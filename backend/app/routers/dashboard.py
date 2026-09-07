from fastapi import APIRouter
from typing import Dict, Any

from app.store import store

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/posture")
async def get_dashboard_posture():
    return store.get_dashboard_stats()
