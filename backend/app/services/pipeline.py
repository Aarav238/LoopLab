import asyncio
import random
import time
from datetime import datetime

from app.database import get_db
from app.services.ai_service import generate_suggestion
from app.utils import events


async def _update_step(experiment_id: str, step_index: int, update: dict):
    db = get_db()
    set_fields = {f"steps.{step_index}.{k}": v for k, v in update.items()}
    await db.experiments.update_one(
        {"id": experiment_id},
        {"$set": set_fields},
    )


async def run_pipeline(experiment_id: str):
    db = get_db()
    doc = await db.experiments.find_one({"id": experiment_id})
    if not doc:
        return

    parameters = doc["parameters"]

    try:
        await db.experiments.update_one(
            {"id": experiment_id}, {"$set": {"status": "running"}}
        )

        # --- Step 1: Parameter Validation (1.5s) ---
        await _update_step(experiment_id, 0, {"status": "running"})
        await events.publish(experiment_id, {
            "event": "step_started",
            "experiment_id": experiment_id,
            "step_name": "Parameter Validation",
            "progress": 0,
            "data": {},
            "timestamp": datetime.utcnow().isoformat(),
        })

        start = time.monotonic()
        await asyncio.sleep(1.5)
        duration_ms = int((time.monotonic() - start) * 1000)

        temp = parameters.get("temperature", 0)
        warnings = (
            ["Temperature near upper bound of safe range"] if temp > 250 else []
        )
        step1_output = {
            "valid": True,
            "warnings": warnings,
            "validated_params": parameters,
        }

        await _update_step(experiment_id, 0, {
            "status": "completed",
            "output": step1_output,
            "duration_ms": duration_ms,
        })
        await events.publish(experiment_id, {
            "event": "step_completed",
            "experiment_id": experiment_id,
            "step_name": "Parameter Validation",
            "progress": 25,
            "data": step1_output,
            "timestamp": datetime.utcnow().isoformat(),
        })

        # --- Step 2: Simulation (3s) ---
        await _update_step(experiment_id, 1, {"status": "running"})
        await events.publish(experiment_id, {
            "event": "step_started",
            "experiment_id": experiment_id,
            "step_name": "Simulation",
            "progress": 25,
            "data": {},
            "timestamp": datetime.utcnow().isoformat(),
        })

        start = time.monotonic()
        await asyncio.sleep(3)
        duration_ms = int((time.monotonic() - start) * 1000)

        candidates = []
        for i in range(1, 4):
            candidates.append({
                "id": f"MAT-{i:03d}",
                "thermal_conductivity": round(random.uniform(0.8, 3.2), 2),
                "stability_score": round(random.uniform(0.55, 0.98), 2),
                "cost_per_kg": round(random.uniform(25, 110), 1),
            })
        step2_output = {"candidates": candidates}

        await _update_step(experiment_id, 1, {
            "status": "completed",
            "output": step2_output,
            "duration_ms": duration_ms,
        })
        await events.publish(experiment_id, {
            "event": "step_completed",
            "experiment_id": experiment_id,
            "step_name": "Simulation",
            "progress": 50,
            "data": step2_output,
            "timestamp": datetime.utcnow().isoformat(),
        })

        # --- Step 3: Analysis (1s) ---
        await _update_step(experiment_id, 2, {"status": "running"})
        await events.publish(experiment_id, {
            "event": "step_started",
            "experiment_id": experiment_id,
            "step_name": "Analysis",
            "progress": 75,
            "data": {},
            "timestamp": datetime.utcnow().isoformat(),
        })

        start = time.monotonic()
        await asyncio.sleep(1)
        duration_ms = int((time.monotonic() - start) * 1000)

        best = max(candidates, key=lambda c: c["thermal_conductivity"])
        step3_output = {
            "best_candidate": best["id"],
            "best_thermal_conductivity": best["thermal_conductivity"],
            "improvement_over_baseline_pct": round(random.uniform(8, 34), 1),
            "recommendation": (
                f"{best['id']} shows promising conductivity with "
                "acceptable stability for EV battery applications."
            ),
        }

        await _update_step(experiment_id, 2, {
            "status": "completed",
            "output": step3_output,
            "duration_ms": duration_ms,
        })
        await events.publish(experiment_id, {
            "event": "step_completed",
            "experiment_id": experiment_id,
            "step_name": "Analysis",
            "progress": 90,
            "data": step3_output,
            "timestamp": datetime.utcnow().isoformat(),
        })

        # --- Complete experiment ---
        now = datetime.utcnow()
        await db.experiments.update_one(
            {"id": experiment_id},
            {"$set": {
                "status": "completed",
                "completed_at": now,
                "final_result": step3_output,
            }},
        )
        await events.publish(experiment_id, {
            "event": "experiment_completed",
            "experiment_id": experiment_id,
            "step_name": None,
            "progress": 90,
            "data": step3_output,
            "timestamp": now.isoformat(),
        })

        # --- AI Suggestion ---
        updated_doc = await db.experiments.find_one({"id": experiment_id})
        suggestion = await generate_suggestion(updated_doc)
        suggestion_dict = suggestion.model_dump()

        await db.experiments.update_one(
            {"id": experiment_id},
            {"$set": {"ai_suggestion": suggestion_dict}},
        )
        await events.publish(experiment_id, {
            "event": "ai_suggestion_ready",
            "experiment_id": experiment_id,
            "step_name": None,
            "progress": 100,
            "data": suggestion_dict,
            "timestamp": datetime.utcnow().isoformat(),
        })

    except Exception as e:
        await db.experiments.update_one(
            {"id": experiment_id}, {"$set": {"status": "failed"}}
        )
        await events.publish(experiment_id, {
            "event": "failed",
            "experiment_id": experiment_id,
            "step_name": None,
            "progress": 0,
            "data": {"error": str(e)},
            "timestamp": datetime.utcnow().isoformat(),
        })
