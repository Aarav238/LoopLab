"""
LLM-powered query parser that extracts structured search criteria
from natural language material discovery goals.
"""

import json

from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.config import settings
from app.data.materials import PROPERTY_UNITS, CATEGORIES


class PropertyTarget(BaseModel):
    property_name: str = Field(
        description="Name of the material property (must be one of: "
        "thermal_conductivity, density, melting_point, specific_heat, "
        "tensile_strength, electrical_conductivity, cost_per_kg, stability_score)"
    )
    target_value: float | None = Field(
        default=None,
        description="Specific numeric target the user wants (e.g., 1.0 for '1 W/mK'). "
        "Null if user wants max/min instead of a specific value.",
    )
    direction: str = Field(
        default="closest",
        description="How to match: 'closest' (find nearest to target_value), "
        "'above' (must be >= target_value), 'below' (must be <= target_value), "
        "'maximize' (highest possible), 'minimize' (lowest possible)",
    )
    weight: float = Field(
        default=1.0,
        description="Relative importance of this criterion (0.0 to 1.0). "
        "Primary criteria get 1.0, secondary criteria get lower values.",
    )


class ParsedQuery(BaseModel):
    target_properties: list[PropertyTarget] = Field(
        default_factory=list,
        description="List of material properties the user cares about with targets",
    )
    material_categories: list[str] = Field(
        default_factory=list,
        description="Material categories to search in (e.g., 'catalyst', 'metal', 'polymer'). "
        "Empty list means search all categories.",
    )
    application_keywords: list[str] = Field(
        default_factory=list,
        description="Keywords describing the intended application "
        "(e.g., 'nitric acid', 'EV battery', 'heat exchanger')",
    )
    exclude_toxic: bool = Field(
        default=False,
        description="Whether to exclude toxic materials",
    )
    max_cost_per_kg: float | None = Field(
        default=None,
        description="Maximum acceptable cost per kg in USD, if specified",
    )


async def parse_query(goal: str, parameters: dict, constraints: list[str]) -> ParsedQuery:
    """Parse a natural language materials discovery goal into structured search criteria."""
    try:
        parser = PydanticOutputParser(pydantic_object=ParsedQuery)

        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are a materials science query parser. Given a user's goal for "
                "material discovery, extract structured search criteria.\n\n"
                "Available material properties and their units:\n"
                "{property_info}\n\n"
                "Available material categories:\n"
                "{categories}\n\n"
                "IMPORTANT RULES:\n"
                "- When the user says 'around X' or 'approximately X' for a property, "
                "set direction to 'closest' with the specific target_value.\n"
                "- When the user says '> X' or 'greater than X', set direction to 'above'.\n"
                "- When the user says '< X' or 'less than X', set direction to 'below'.\n"
                "- When the user wants the 'best' or 'highest' without a specific value, "
                "set direction to 'maximize'.\n"
                "- When the user wants the 'lowest' without a specific value, "
                "set direction to 'minimize'.\n"
                "- Infer the material_categories from context (e.g., 'catalyst for nitric acid' "
                "means category='catalyst').\n"
                "- Extract application keywords for matching against material application lists.\n"
                "- If the user mentions non-toxic or safety, set exclude_toxic=true.\n"
                "- Parse constraints like 'cost_per_kg < 80' into max_cost_per_kg=80.\n\n"
                "{format_instructions}",
            ),
            (
                "human",
                "Goal: {goal}\n\n"
                "User-provided parameters: {parameters}\n\n"
                "User-provided constraints: {constraints}\n\n"
                "Parse this into structured search criteria.",
            ),
        ])

        llm = ChatOpenAI(
            model="gpt-4.1",
            temperature=0.1,
            api_key=settings.OPENAI_API_KEY,
        )

        chain = prompt | llm | parser

        property_info = "\n".join(
            f"  - {name}: {unit}" for name, unit in PROPERTY_UNITS.items()
        )

        result = await chain.ainvoke({
            "format_instructions": parser.get_format_instructions(),
            "property_info": property_info,
            "categories": ", ".join(CATEGORIES),
            "goal": goal,
            "parameters": json.dumps(parameters),
            "constraints": json.dumps(constraints),
        })

        return result

    except Exception:
        # Fallback: basic keyword-based parsing
        return _fallback_parse(goal, parameters, constraints)


def _fallback_parse(goal: str, parameters: dict, constraints: list[str]) -> ParsedQuery:
    """Basic keyword-based parsing when LLM is unavailable."""
    goal_lower = goal.lower()

    targets = []
    categories = []
    app_keywords = []
    exclude_toxic = False
    max_cost = None

    # Detect categories
    category_keywords = {
        "catalyst": ["catalyst", "catalytic", "catalysis"],
        "metal": ["metal", "alloy", "steel", "aluminum", "copper"],
        "polymer": ["polymer", "plastic", "resin", "rubber", "PEEK", "PTFE"],
        "ceramic": ["ceramic", "oxide", "carbide", "nitride", "glass"],
        "composite": ["composite", "reinforced", "fiber"],
        "semiconductor": ["semiconductor", "silicon", "gallium"],
        "battery_material": ["battery", "lithium", "electrode", "electrolyte"],
        "insulator": ["insulation", "insulator", "insulating"],
    }
    for cat, keywords in category_keywords.items():
        if any(kw in goal_lower for kw in keywords):
            categories.append(cat)

    # Detect property targets from parameters
    for key, value in parameters.items():
        key_lower = key.lower().replace(" ", "_")
        if key_lower in PROPERTY_UNITS:
            targets.append(PropertyTarget(
                property_name=key_lower,
                target_value=value,
                direction="closest",
                weight=1.0,
            ))

    # Detect thermal conductivity mentions in goal text
    if "thermal conductivity" in goal_lower or "thermal_conductivity" in goal_lower:
        if not any(t.property_name == "thermal_conductivity" for t in targets):
            # Try to extract numeric value
            import re
            match = re.search(r"(\d+\.?\d*)\s*(?:w/mk|W/mK)", goal)
            if match:
                targets.append(PropertyTarget(
                    property_name="thermal_conductivity",
                    target_value=float(match.group(1)),
                    direction="closest",
                    weight=1.0,
                ))

    # Detect application keywords
    app_phrases = [
        "nitric acid", "sulfuric acid", "EV battery", "heat exchanger",
        "thermal management", "catalytic converter", "fuel cell",
        "solar cell", "aerospace", "medical", "corrosion",
    ]
    for phrase in app_phrases:
        if phrase.lower() in goal_lower:
            app_keywords.append(phrase)

    # Detect toxicity preference
    if "non-toxic" in goal_lower or "non toxic" in goal_lower or "safe" in goal_lower:
        exclude_toxic = True

    # Parse constraints
    for constraint in constraints:
        c_lower = constraint.lower().strip()
        if "cost" in c_lower and "<" in c_lower:
            import re
            match = re.search(r"<\s*(\d+\.?\d*)", c_lower)
            if match:
                max_cost = float(match.group(1))
        if "non_toxic" in c_lower or "non-toxic" in c_lower:
            exclude_toxic = True

    return ParsedQuery(
        target_properties=targets,
        material_categories=categories,
        application_keywords=app_keywords,
        exclude_toxic=exclude_toxic,
        max_cost_per_kg=max_cost,
    )
