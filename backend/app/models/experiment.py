from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ExperimentCreate(BaseModel):
    goal: str
    parameters: dict[str, float]
    constraints: list[str] = []


class StepResult(BaseModel):
    step_name: str
    status: Literal["pending", "running", "completed", "failed"] = "pending"
    output: dict = {}
    duration_ms: int = 0


class ExperimentDoc(BaseModel):
    id: str
    goal: str
    parameters: dict[str, float]
    constraints: list[str]
    status: Literal["pending", "running", "completed", "failed"] = "pending"
    steps: list[StepResult] = []
    final_result: dict = {}
    ai_suggestion: dict = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
