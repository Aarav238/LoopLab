from typing import Literal, Union

from pydantic import BaseModel


class ParameterChange(BaseModel):
    name: str
    current_value: Union[float, str, None] = None
    suggested_value: Union[float, str, None] = None
    change_direction: Literal["increase", "decrease", "maintain"]
    expected_impact: str


class AISuggestion(BaseModel):
    reasoning: str
    suggested_parameters: list[ParameterChange]
    predicted_improvement_pct: float
    confidence: float
    scientific_rationale: str
