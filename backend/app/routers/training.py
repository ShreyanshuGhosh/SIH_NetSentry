from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from app.schemas.canonical import (
    AskAIRequest,
    AskAIResponse,
    ApproveExemplarRequest,
    RejectItemRequest,
    CreateFieldRequest,
    FewShotExemplar,
    TrainingQueueItem,
    BaselineFieldDefinition
)
from app.store import store
from app.services.gemini_verifier import verify_unrecognized_syntax

router = APIRouter(prefix="/api/training", tags=["training"])

@router.post("/ask-ai", response_model=AskAIResponse)
async def ask_ai_assist(req: AskAIRequest):
    """
    Opt-In AI Assist: Triggers Gemini to analyze unrecognized syntax
    and suggest an extensible baseline schema mapping on-demand.
    """
    if not req.raw_command.strip():
        raise HTTPException(status_code=400, detail="raw_command cannot be empty")

    fields = store.get_baseline_fields()
    result = verify_unrecognized_syntax(req.raw_command, fields)
    return AskAIResponse(**result)

@router.get("/queue", response_model=List[TrainingQueueItem])
async def get_training_queue():
    """
    Returns items currently pending human review in the Amber Lane queue.
    """
    return store.get_queue(status_filter="pending")

@router.post("/approve", response_model=FewShotExemplar)
async def approve_training_item(req: ApproveExemplarRequest):
    """
    Admin approves a mapping (either manual or suggested by Gemini).
    Saves to exemplars.json and enables cross-device generalization.
    """
    saved = store.approve_and_save_exemplar(
        queue_id=req.queue_id,
        field_key=req.mapped_field_key,
        value=req.mapped_value,
        approved_by=req.approved_by
    )
    if not saved:
        raise HTTPException(status_code=404, detail="Queue item not found")
    return FewShotExemplar(**saved)

@router.post("/reject")
async def reject_training_item(req: RejectItemRequest):
    """
    Admin marks item as rejected / non-compliance-relevant.
    Excluded from active queue but retained in rejection audit log (�6.8, Test 4).
    """
    ok = store.reject_queue_item(req.queue_id, req.reason)
    if not ok:
        raise HTTPException(status_code=404, detail="Queue item not found")
    return {"status": "rejected", "queue_id": req.queue_id}

@router.get("/fields", response_model=List[BaselineFieldDefinition])
async def get_baseline_fields():
    return store.get_baseline_fields()

@router.post("/fields", response_model=BaselineFieldDefinition)
async def register_field(req: CreateFieldRequest):
    new_f = store.register_baseline_field(
        key=req.key,
        label=req.label,
        frameworks=req.frameworks,
        value_type=req.value_type
    )
    return BaselineFieldDefinition(**new_f)
