import json
import logging

from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings
from app.models.suggestion import AISuggestion, ParameterChange


async def generate_suggestion(experiment: dict) -> AISuggestion:
    try:
        parser = PydanticOutputParser(pydantic_object=AISuggestion)

        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are an AI materials scientist assistant. "
                "Given a materials discovery experiment result with real material candidates "
                "from a database of 85 materials, suggest how the user could refine their "
                "search in the next iteration to get better results.\n\n"
                "Consider:\n"
                "- Whether the best candidate closely matches the user's goal\n"
                "- Whether adjusting search parameters could find better candidates\n"
                "- Trade-offs between properties (e.g., cost vs performance)\n"
                "- Alternative material categories that might work\n\n"
                "Be specific and scientific. Reference actual material properties.\n"
                "Always return valid JSON matching the schema exactly.\n\n"
                "{format_instructions}",
            ),
            (
                "human",
                "Goal: {goal}\n\n"
                "Parameters used: {parameters}\n\n"
                "Constraints: {constraints}\n\n"
                "Top candidates found: {simulation_results}\n\n"
                "Best match analysis: {analysis_result}\n\n"
                "Provide your suggestion for refining the search in the next iteration.",
            ),
        ])

        llm = ChatOpenAI(
            model="gpt-4.1",
            temperature=0.3,
            api_key=settings.OPENAI_API_KEY,
        )

        chain = prompt | llm | parser

        steps = experiment.get("steps", [])
        simulation_output = steps[1]["output"] if len(steps) > 1 else {}
        final_result = experiment.get("final_result", {})

        result = await chain.ainvoke({
            "format_instructions": parser.get_format_instructions(),
            "goal": experiment.get("goal", ""),
            "parameters": json.dumps(experiment.get("parameters", {})),
            "constraints": json.dumps(experiment.get("constraints", [])),
            "simulation_results": json.dumps(simulation_output),
            "analysis_result": json.dumps(final_result),
        })

        return result

    except Exception as e:
        logger.exception("AI suggestion failed: %s", e)
        params = experiment.get("parameters", {})
        fallback_changes = []
        for name, value in params.items():
            fallback_changes.append(ParameterChange(
                name=name,
                current_value=value,
                suggested_value=value,
                change_direction="maintain",
                expected_impact="Unable to determine",
            ))

        return AISuggestion(
            reasoning="AI suggestion unavailable due to service error.",
            suggested_parameters=fallback_changes,
            predicted_improvement_pct=0.0,
            confidence=0.0,
            scientific_rationale="Fallback suggestion - no AI analysis available.",
        )
