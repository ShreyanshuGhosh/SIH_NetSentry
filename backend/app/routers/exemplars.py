from fastapi import APIRouter
from typing import List, Dict, Any

from app.schemas.canonical import FewShotExemplar, TrainingQueueItem
from app.store import store

router = APIRouter(prefix="/api/exemplars", tags=["exemplars"])

@router.get("", response_model=List[FewShotExemplar])
async def list_exemplars():
    return store.get_exemplars()

@router.get("/rejected-log", response_model=List[TrainingQueueItem])
async def list_rejected_log():
    return store.get_rejected_log()
