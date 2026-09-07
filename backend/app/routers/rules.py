from fastapi import APIRouter
from app.services.rule_engine import RULES_CATALOG

router = APIRouter(prefix="/api/rules", tags=["rules"])

@router.get("")
async def get_all_rules():
    # Return serializable rules without lambda functions
    return [
        {
            "id": r["id"],
            "title": r["title"],
            "framework": r["framework"],
            "control_group_id": r.get("control_group_id"),
            "severity": r["severity"],
            "framework_ref": r["framework_ref"],
            "remediation": r["remediation"]
        }
        for r in RULES_CATALOG
    ]
