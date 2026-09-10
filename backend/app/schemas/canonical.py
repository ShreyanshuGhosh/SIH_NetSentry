from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

class BaselineFieldDefinition(BaseModel):
    key: str
    label: str
    frameworks: List[str] = ["cis_v8"]
    value_type: str = "boolean"
    created_by: str = "system"

class FewShotExemplar(BaseModel):
    id: str
    vendor: str
    raw_line_pattern: str
    mapped_field_key: str
    mapped_value: Any
    approved_by: str
    approved_at: str
    times_reused: int = 0

class TrainingQueueItem(BaseModel):
    id: str
    device_id: str
    vendor: str
    raw_command_block: str
    line_numbers: str
    suggested_field: Optional[str] = None
    suggested_value: Optional[Any] = None
    confidence: float = 0.0
    status: str = "pending"  # pending | approved | rejected
    timestamp: str
    rejection_reason: Optional[str] = None

class LineEvidence(BaseModel):
    line: int
    raw: str

class Finding(BaseModel):
    rule_id: str
    rule_title: str
    framework: str
    control_group_id: Optional[str] = None
    severity: str  # critical | high | medium | low
    cat_rating: Optional[str] = None  # CAT I | CAT II | CAT III
    source_note: Optional[str] = None
    status: str    # pass | fail | not_applicable | checking_infra_missing
    evidence_lines: List[LineEvidence] = []
    remediation_command: str
    framework_ref: str
    resolved_via_exemplar: Optional[Dict[str, Any]] = None
    infra_requirements: Optional[Dict[str, Any]] = None

class AuditSummary(BaseModel):
    compliance_score: int
    total_controls: int
    deduplicated_controls: int
    passed: int
    failed: int
    infra_missing: int = 0
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int

class AuditRunResult(BaseModel):
    audit_id: str
    device_id: str
    device_name: str
    vendor: str
    platform: str
    frameworks: List[str]
    source_hash: str
    evaluated_at: str
    summary: AuditSummary
    findings: List[Finding]
    redacted_secrets_count: int = 0
    parsed_lane: str = "deterministic"

class AuditRunRequest(BaseModel):
    raw_config: str
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    vendor: Optional[str] = None
    platform: Optional[str] = None
    frameworks: List[str] = ["cis_v8"]

class AskAIRequest(BaseModel):
    raw_command: str
    vendor: Optional[str] = "generic"

class AskAIResponse(BaseModel):
    suggested_field: Optional[str] = None
    suggested_value: Optional[Any] = None
    confidence: float = 0.0
    reasoning: str = ""

class ApproveExemplarRequest(BaseModel):
    queue_id: str
    mapped_field_key: str
    mapped_value: Any
    approved_by: str = "SecOps Admin"

class RejectItemRequest(BaseModel):
    queue_id: str
    reason: str = "Spurious syntax block"

class CreateFieldRequest(BaseModel):
    key: str
    label: str
    frameworks: List[str] = ["cis_v8"]
    value_type: str = "boolean"
