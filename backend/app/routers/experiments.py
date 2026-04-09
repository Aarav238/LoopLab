import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.database import get_db
from app.models.experiment import ExperimentCreate, ExperimentDoc, StepResult
from app.services.pipeline import run_pipeline
from app.utils import events

router = APIRouter(prefix="/api/v1/experiments", tags=["experiments"])

STEP_NAMES = ["Parameter Validation", "Simulation", "Analysis"]


@router.post("")
async def create_experiment(
    body: ExperimentCreate,
    background_tasks: BackgroundTasks,
):
    experiment_id = str(uuid.uuid4())

    doc = ExperimentDoc(
        id=experiment_id,
        goal=body.goal,
        parameters=body.parameters,
        constraints=body.constraints,
        steps=[StepResult(step_name=name) for name in STEP_NAMES],
        created_at=datetime.utcnow(),
    )

    db = get_db()
    await db.experiments.insert_one(doc.model_dump())

    events.register(experiment_id)
    background_tasks.add_task(run_pipeline, experiment_id)

    return {
        "experiment_id": experiment_id,
        "ws_url": f"ws://localhost:8000/ws/experiments/{experiment_id}/stream",
        "status": "pending",
    }


@router.get("")
async def list_experiments(skip: int = 0, limit: int = 20):
    db = get_db()
    cursor = (
        db.experiments.find({}, {"_id": 0})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    experiments = await cursor.to_list(length=limit)
    return experiments


@router.get("/{experiment_id}")
async def get_experiment(experiment_id: str):
    db = get_db()
    doc = await db.experiments.find_one(
        {"id": experiment_id}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return doc


@router.delete("/{experiment_id}")
async def delete_experiment(experiment_id: str):
    db = get_db()
    result = await db.experiments.delete_one({"id": experiment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Experiment not found")
    events.cleanup(experiment_id)
    return {"deleted": True}
