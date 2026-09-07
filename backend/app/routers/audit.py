import hashlib
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException

from app.schemas.canonical import AuditRunRequest, AuditRunResult
from app.store import store
from app.services.redaction import redact_secrets
from app.services.parsers.cisco import parse_cisco
from app.services.parsers.juniper import parse_juniper
from app.services.parsers.palo_alto import parse_palo_alto
from app.services.parsers.sonic import parse_sonic
from app.services.parsers.fortinet import parse_fortinet
from app.services.parsers.arista import parse_arista
from app.services.normalizer import process_unrecognized_lines
from app.services.rule_engine import evaluate_compliance

router = APIRouter(prefix="/api/audit", tags=["audit"])

def _detect_vendor(raw_text: str, override: str = None) -> str:
    if override and override != "auto":
        return override
    lower = raw_text.lower()
    if "junos" in lower or "set system services" in lower or "protocol-version v2" in lower or "system {" in lower:
        return "juniper_junos"
    if "<config" in lower or "palo alto" in lower or "<phash>" in lower:
        return "palo_alto_panos"
    if "config_db.json" in lower or "device_metadata" in lower or "sonic" in lower:
        return "sonic"
    if "config system global" in lower or "fortigate" in lower or "fortios" in lower:
        return "fortinet_fortios"
    if "arista" in lower or "transceiver qsfp" in lower:
        return "arista_eos"
    return "cisco_ios"

@router.post("/run", response_model=AuditRunResult)
async def run_audit(req: AuditRunRequest):
    if not req.raw_config.strip():
        raise HTTPException(status_code=400, detail="raw_config cannot be empty")

    # Step 1: Secret Redaction
    redacted_text, secrets_count = redact_secrets(req.raw_config)
    source_hash = hashlib.sha256(redacted_text.encode("utf-8")).hexdigest()

    # Step 2: Vendor Detection
    vendor = _detect_vendor(redacted_text, req.vendor)
    device_id = req.device_id or f"dev-{uuid.uuid4().hex[:8]}"
    device_name = req.device_name or f"{vendor.replace('_', ' ').upper()} Core Node"

    # Step 3: Deterministic Parsing
    if vendor == "juniper_junos":
        params, evidence, unresolved, platform, os_ver = parse_juniper(redacted_text)
    elif vendor == "palo_alto_panos":
        params, evidence, unresolved, platform, os_ver = parse_palo_alto(redacted_text)
    elif vendor == "sonic":
        params, evidence, unresolved, platform, os_ver = parse_sonic(redacted_text)
    elif vendor == "fortinet_fortios":
        params, evidence, unresolved, platform, os_ver = parse_fortinet(redacted_text)
    elif vendor == "arista_eos":
        params, evidence, unresolved, platform, os_ver = parse_arista(redacted_text)
    else:
        params, evidence, unresolved, platform, os_ver = parse_cisco(redacted_text)

    # Step 4: Amber-Lane Normalization (Check Exemplar Store, enqueue unmatched)
    params, evidence, still_unresolved = process_unrecognized_lines(
        device_id=device_id,
        vendor=vendor,
        unresolved_lines=unresolved,
        parameters=params,
        evidence=evidence
    )

    # Step 5: Compliance Evaluation
    frameworks = req.frameworks or ["cis_v8"]
    findings, summary = evaluate_compliance(
        parameters=params,
        evidence=evidence,
        vendor=vendor,
        selected_frameworks=frameworks
    )

    audit_id = f"aud-{uuid.uuid4().hex[:10]}"
    eval_time = datetime.now(timezone.utc).isoformat()

    result = AuditRunResult(
        audit_id=audit_id,
        device_id=device_id,
        device_name=device_name,
        vendor=vendor,
        platform=req.platform or platform,
        frameworks=frameworks,
        source_hash=source_hash,
        evaluated_at=eval_time,
        summary=summary,
        findings=findings,
        redacted_secrets_count=secrets_count,
        parsed_lane="llm_assisted" if len(still_unresolved) < len(unresolved) else "deterministic"
    )

    # Save to history
    store.save_audit_run(result.model_dump())

    return result

@router.get("/{audit_id}", response_model=AuditRunResult)
async def get_audit_result(audit_id: str):
    res = store.get_audit_by_id(audit_id)
    if not res:
        raise HTTPException(status_code=404, detail="Audit run not found")
    return AuditRunResult(**res)
