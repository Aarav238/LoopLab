from typing import Literal

from pydantic import BaseModel


class ParameterChange(BaseModel):
    name: str
    current_value: float
    suggested_value: float
    change_direction: Literal["increase", "decrease", "maintain"]
    expected_impact: str


class AISuggestion(BaseModel):
    reasoning: str
    suggested_parameters: list[ParameterChange]
    predicted_improvement_pct: float
    confidence: float
    scientific_rationale: str
