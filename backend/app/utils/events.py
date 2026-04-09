import asyncio

_subscribers: dict[str, dict[int, asyncio.Queue]] = {}
_counter: int = 0


def register(experiment_id: str) -> None:
    if experiment_id not in _subscribers:
        _subscribers[experiment_id] = {}


def subscribe(experiment_id: str) -> tuple[int, asyncio.Queue]:
    global _counter
    _counter += 1
    sub_id = _counter
    queue = asyncio.Queue()
    if experiment_id not in _subscribers:
        _subscribers[experiment_id] = {}
    _subscribers[experiment_id][sub_id] = queue
    return sub_id, queue


def unsubscribe(experiment_id: str, sub_id: int) -> None:
    subs = _subscribers.get(experiment_id)
    if subs:
        subs.pop(sub_id, None)


async def publish(experiment_id: str, event: dict) -> None:
    subs = _subscribers.get(experiment_id)
    if subs:
        for queue in subs.values():
            await queue.put(event)


def cleanup(experiment_id: str) -> None:
    _subscribers.pop(experiment_id, None)
