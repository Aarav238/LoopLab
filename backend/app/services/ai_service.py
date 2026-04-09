import json

from langchain_openai import ChatOpenAI
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
                "Given an experiment result, suggest the single most impactful "
                "parameter adjustment for the next iteration. "
                "Think step by step. Be specific and scientific. "
                "Always return valid JSON matching the schema exactly.\n\n"
                "{format_instructions}",
            ),
            (
                "human",
                "Goal: {goal}\n\n"
                "Parameters used: {parameters}\n\n"
                "Constraints: {constraints}\n\n"
                "Simulation results: {simulation_results}\n\n"
                "Analysis result: {analysis_result}\n\n"
                "Provide your suggestion for the next iteration.",
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

    except Exception:
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
