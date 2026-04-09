import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.database import get_db
from app.utils import events

router = APIRouter()


@router.websocket("/ws/experiments/{experiment_id}/stream")
async def experiment_stream(websocket: WebSocket, experiment_id: str):
    await websocket.accept()

    sub_id = None

    try:
        db = get_db()
        doc = await db.experiments.find_one(
            {"id": experiment_id}, {"_id": 0}
        )

        if not doc:
            await websocket.close(code=4004, reason="Experiment not found")
            return

        for step in doc.get("steps", []):
            if step["status"] in ("completed", "failed"):
                await websocket.send_json({
                    "event": "step_completed",
                    "experiment_id": experiment_id,
                    "step_name": step["step_name"],
                    "progress": 0,
                    "data": step.get("output", {}),
                    "timestamp": "",
                })

        if doc.get("status") == "completed":
            await websocket.send_json({
                "event": "experiment_completed",
                "experiment_id": experiment_id,
                "step_name": None,
                "progress": 100,
                "data": doc.get("final_result", {}),
                "timestamp": "",
            })
            if doc.get("ai_suggestion"):
                await websocket.send_json({
                    "event": "ai_suggestion_ready",
                    "experiment_id": experiment_id,
                    "step_name": None,
                    "progress": 100,
                    "data": doc["ai_suggestion"],
                    "timestamp": "",
                })
            return

        if doc.get("status") == "failed":
            await websocket.send_json({
                "event": "failed",
                "experiment_id": experiment_id,
                "step_name": None,
                "progress": 0,
                "data": {"error": "Experiment failed"},
                "timestamp": "",
            })
            return

        sub_id, queue = events.subscribe(experiment_id)

        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=60)
                await websocket.send_json(event)

                if event.get("event") in ("ai_suggestion_ready", "failed"):
                    break
            except asyncio.TimeoutError:
                await websocket.send_json({"event": "heartbeat"})

    except WebSocketDisconnect:
        pass
    finally:
        if sub_id is not None:
            events.unsubscribe(experiment_id, sub_id)
