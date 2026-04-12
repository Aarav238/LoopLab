import asyncio
import time
from datetime import datetime

from app.database import get_db
from app.services.ai_service import generate_suggestion
from app.services.query_parser import parse_query
from app.services.material_search import search_materials
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

    goal = doc["goal"]
    parameters = doc["parameters"]
    constraints = doc.get("constraints", [])

    try:
        await db.experiments.update_one(
            {"id": experiment_id}, {"$set": {"status": "running"}}
        )

        # --- Step 1: Parameter Validation & Query Parsing ---
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

        # Use LLM to parse the natural language goal into structured search criteria
        parsed_query = await parse_query(goal, parameters, constraints)

        duration_ms = int((time.monotonic() - start) * 1000)

        temp = parameters.get("temperature", 0)
        warnings = (
            ["Temperature near upper bound of safe range"] if temp > 250 else []
        )

        parsed_summary = {
            "target_properties": [
                {
                    "property": t.property_name,
                    "target": t.target_value,
                    "direction": t.direction,
                    "weight": t.weight,
                }
                for t in parsed_query.target_properties
            ],
            "categories": parsed_query.material_categories,
            "application_keywords": parsed_query.application_keywords,
            "exclude_toxic": parsed_query.exclude_toxic,
            "max_cost_per_kg": parsed_query.max_cost_per_kg,
        }

        step1_output = {
            "valid": True,
            "warnings": warnings,
            "validated_params": parameters,
            "parsed_query": parsed_summary,
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

        # --- Step 2: Simulation (Material Database Search) ---
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

        # Search real materials database with parsed criteria
        # Small delay so the UI feels responsive (actual search is fast)
        await asyncio.sleep(1.5)
        top_candidates = search_materials(parsed_query, top_n=5)

        duration_ms = int((time.monotonic() - start) * 1000)

        # Format candidates for output
        candidates = []
        for mat in top_candidates:
            candidates.append({
                "id": mat["id"],
                "name": mat["name"],
                "formula": mat["formula"],
                "category": mat["category"],
                "thermal_conductivity": mat["thermal_conductivity"],
                "density": mat["density"],
                "melting_point": mat["melting_point"],
                "stability_score": mat["stability_score"],
                "cost_per_kg": mat["cost_per_kg"],
                "applications": mat["applications"],
                "match_score": mat["match_score"],
                "toxic": mat.get("toxic", False),
            })

        step2_output = {
            "candidates": candidates,
            "total_searched": 85,
            "filters_applied": {
                "categories": parsed_query.material_categories or ["all"],
                "exclude_toxic": parsed_query.exclude_toxic,
                "max_cost": parsed_query.max_cost_per_kg,
            },
        }

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

        # --- Step 3: Analysis ---
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
        await asyncio.sleep(0.5)
        duration_ms = int((time.monotonic() - start) * 1000)

        # Best candidate is the one with the highest match score (already sorted)
        best = candidates[0] if candidates else None

        if best:
            # Build a contextual recommendation
            recommendation = _build_recommendation(best, parsed_query)

            step3_output = {
                "best_candidate": best["id"],
                "best_name": best["name"],
                "best_formula": best["formula"],
                "best_category": best["category"],
                "best_thermal_conductivity": best["thermal_conductivity"],
                "best_density": best["density"],
                "best_melting_point": best["melting_point"],
                "best_stability_score": best["stability_score"],
                "best_cost_per_kg": best["cost_per_kg"],
                "match_score_pct": round(best["match_score"] * 100, 1),
                "recommendation": recommendation,
                "runner_up": candidates[1]["name"] if len(candidates) > 1 else None,
                "runner_up_id": candidates[1]["id"] if len(candidates) > 1 else None,
            }
        else:
            step3_output = {
                "best_candidate": None,
                "match_score_pct": 0,
                "recommendation": "No materials found matching the given criteria. "
                "Try relaxing constraints or broadening the search.",
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


def _build_recommendation(best: dict, parsed_query) -> str:
    """Build a contextual recommendation string based on the best match and query."""
    parts = [f"{best['name']} ({best['formula']})"]

    # Mention how it matches the primary target
    if parsed_query.target_properties:
        primary = parsed_query.target_properties[0]
        prop_name = primary.property_name.replace("_", " ")
        actual = best.get(primary.property_name)
        if actual is not None:
            if primary.direction == "closest" and primary.target_value is not None:
                diff_pct = abs(actual - primary.target_value) / primary.target_value * 100 if primary.target_value else 0
                if diff_pct < 5:
                    parts.append(f"closely matches the target {prop_name} of {primary.target_value}")
                elif diff_pct < 20:
                    parts.append(f"is near the target {prop_name} ({actual} vs {primary.target_value} requested)")
                else:
                    parts.append(f"is the closest available match for {prop_name} ({actual})")
            elif primary.direction in ("above", "maximize"):
                parts.append(f"meets the {prop_name} requirement with {actual}")
            elif primary.direction in ("below", "minimize"):
                parts.append(f"satisfies the low {prop_name} requirement at {actual}")

    # Mention category relevance
    if parsed_query.material_categories:
        parts.append(f"classified as {best['category']}")

    # Mention application relevance
    if parsed_query.application_keywords:
        mat_apps = " ".join(best.get("applications", [])).lower()
        matched_apps = [
            kw for kw in parsed_query.application_keywords
            if kw.lower() in mat_apps
        ]
        if matched_apps:
            parts.append(f"with known applications in {', '.join(matched_apps)}")

    # Stability note
    stability = best.get("stability_score", 0)
    if stability >= 0.9:
        parts.append("and has excellent stability")
    elif stability >= 0.8:
        parts.append("and has good stability")

    return " ".join(parts) + "."
