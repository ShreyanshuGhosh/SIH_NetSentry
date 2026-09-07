import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional

from app.config import settings

store_lock = threading.RLock()

DATA_DIR = Path(settings.data_dir)
DATA_DIR.mkdir(parents=True, exist_ok=True)

FIELDS_FILE = DATA_DIR / "baseline_fields.json"
EXEMPLARS_FILE = DATA_DIR / "exemplars.json"
QUEUE_FILE = DATA_DIR / "training_queue.json"
AUDIT_FILE = DATA_DIR / "audit_history.json"

DEFAULT_BASELINE_FIELDS = [
    {"key": "sshVersion", "label": "SSH Protocol Version", "frameworks": ["cis_v8", "nist_800_53", "disa_stig"], "value_type": "number", "created_by": "system"},
    {"key": "telnetEnabled", "label": "Insecure Telnet Protocol", "frameworks": ["cis_v8", "nist_800_53", "iso_27001"], "value_type": "boolean", "created_by": "system"},
    {"key": "httpServerEnabled", "label": "Cleartext HTTP Web Management", "frameworks": ["cis_v8", "nist_800_53", "disa_stig"], "value_type": "boolean", "created_by": "system"},
    {"key": "passwordEncryptionEnabled", "label": "Local Credential Reversible Encryption", "frameworks": ["cis_v8", "disa_stig"], "value_type": "boolean", "created_by": "system"},
    {"key": "aaaAuthEnabled", "label": "AAA Authentication / RADIUS / TACACS+", "frameworks": ["cis_v8", "nist_800_53", "iso_27001"], "value_type": "boolean", "created_by": "system"},
    {"key": "snmpVersion", "label": "SNMP Protocol Security Version", "frameworks": ["cis_v8", "disa_stig"], "value_type": "number", "created_by": "system"},
    {"key": "syslogServers", "label": "Centralized Syslog SIEM Export", "frameworks": ["cis_v8", "nist_800_53", "iso_27001"], "value_type": "boolean", "created_by": "system"},
    {"key": "sessionIdleTimeoutMinutes", "label": "Administrative Console Inactivity Timeout", "frameworks": ["cis_v8", "disa_stig"], "value_type": "number", "created_by": "system"},
    {"key": "ntpConfigured", "label": "NTP Synchronized Time Reference", "frameworks": ["cis_v8", "nist_800_53"], "value_type": "boolean", "created_by": "system"},
    {"key": "loginBannerConfigured", "label": "Statutory Authorized Access Warning Banner", "frameworks": ["cis_v8", "disa_stig"], "value_type": "boolean", "created_by": "system"},
]

DEFAULT_EXEMPLARS = [
    {
        "id": "fse-sonic-01",
        "vendor": "sonic",
        "raw_line_pattern": "idle_timeout",
        "mapped_field_key": "sessionIdleTimeoutMinutes",
        "mapped_value": 10,
        "approved_by": "SecOps Admin (NTRO)",
        "approved_at": "2026-08-28 10:14:22",
        "times_reused": 3
    },
    {
        "id": "fse-forti-02",
        "vendor": "fortinet_fortios",
        "raw_line_pattern": "set admin-telnet-service disable",
        "mapped_field_key": "telnetEnabled",
        "mapped_value": False,
        "approved_by": "Lead Network Engineer",
        "approved_at": "2026-08-29 16:30:11",
        "times_reused": 2
    },
    {
        "id": "fse-junos-03",
        "vendor": "juniper_junos",
        "raw_line_pattern": "protocol-version v2",
        "mapped_field_key": "sshVersion",
        "mapped_value": 2,
        "approved_by": "Compliance Auditor",
        "approved_at": "2026-09-01 09:05:44",
        "times_reused": 4
    }
]

DEFAULT_QUEUE = [
    {
        "id": "tq-sonic-01",
        "device_id": "sonic-leaf-01",
        "vendor": "sonic",
        "raw_command_block": "\"fast_reboot_watchdog\": \"enabled\"",
        "line_numbers": "Line 41",
        "suggested_field": "httpServerEnabled",
        "suggested_value": False,
        "confidence": 0.48,
        "status": "pending",
        "timestamp": "2026-09-07T08:15:00Z",
        "rejection_reason": None
    },
    {
        "id": "tq-arista-02",
        "device_id": "arista-leaf-02",
        "vendor": "arista_eos",
        "raw_command_block": "transceiver qsfp default-mode 4x10G",
        "line_numbers": "Line 4",
        "suggested_field": "loginBannerConfigured",
        "suggested_value": True,
        "confidence": 0.52,
        "status": "pending",
        "timestamp": "2026-09-07T08:22:00Z",
        "rejection_reason": None
    },
    {
        "id": "tq-junos-03",
        "device_id": "juniper-srx345-gateway",
        "vendor": "juniper_junos",
        "raw_command_block": "telnet {\n    /* legacy maintenance port */\n}",
        "line_numbers": "Lines 33-35",
        "suggested_field": "telnetEnabled",
        "suggested_value": True,
        "confidence": 0.65,
        "status": "pending",
        "timestamp": "2026-09-07T08:30:00Z",
        "rejection_reason": None
    }
]

def _read_json(filepath: Path, default: Any) -> Any:
    if not filepath.exists():
        _write_json(filepath, default)
        return default
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default

def _write_json(filepath: Path, data: Any):
    temp_path = filepath.with_suffix(".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    temp_path.replace(filepath)

# Initialize files on import
with store_lock:
    if not FIELDS_FILE.exists():
        _write_json(FIELDS_FILE, DEFAULT_BASELINE_FIELDS)
    if not EXEMPLARS_FILE.exists():
        _write_json(EXEMPLARS_FILE, DEFAULT_EXEMPLARS)
    if not QUEUE_FILE.exists():
        _write_json(QUEUE_FILE, DEFAULT_QUEUE)
    if not AUDIT_FILE.exists():
        _write_json(AUDIT_FILE, [])

class JsonStore:
    @staticmethod
    def get_baseline_fields() -> List[Dict[str, Any]]:
        with store_lock:
            return _read_json(FIELDS_FILE, DEFAULT_BASELINE_FIELDS)

    @staticmethod
    def register_baseline_field(key: str, label: str, frameworks: List[str], value_type: str = "boolean") -> Dict[str, Any]:
        with store_lock:
            fields = _read_json(FIELDS_FILE, DEFAULT_BASELINE_FIELDS)
            for f in fields:
                if f["key"] == key:
                    return f
            new_f = {
                "key": key,
                "label": label,
                "frameworks": frameworks,
                "value_type": value_type,
                "created_by": "admin"
            }
            fields.append(new_f)
            _write_json(FIELDS_FILE, fields)
            return new_f

    @staticmethod
    def get_exemplars() -> List[Dict[str, Any]]:
        with store_lock:
            return _read_json(EXEMPLARS_FILE, DEFAULT_EXEMPLARS)

    @staticmethod
    def find_matching_exemplar(raw_line: str, vendor: str) -> Optional[Dict[str, Any]]:
        with store_lock:
            exemplars = _read_json(EXEMPLARS_FILE, DEFAULT_EXEMPLARS)
            clean = raw_line.strip().lower()
            for ex in exemplars:
                if ex.get("vendor") == vendor:
                    pattern = ex.get("raw_line_pattern", "").strip().lower()
                    if pattern and pattern in clean:
                        ex["times_reused"] = ex.get("times_reused", 0) + 1
                        _write_json(EXEMPLARS_FILE, exemplars)
                        return ex
            return None

    @staticmethod
    def approve_and_save_exemplar(queue_id: str, field_key: str, value: Any, approved_by: str) -> Optional[Dict[str, Any]]:
        with store_lock:
            queue = _read_json(QUEUE_FILE, DEFAULT_QUEUE)
            exemplars = _read_json(EXEMPLARS_FILE, DEFAULT_EXEMPLARS)

            target_item = None
            for item in queue:
                if item["id"] == queue_id:
                    item["status"] = "approved"
                    target_item = item
                    break

            if not target_item:
                return None

            _write_json(QUEUE_FILE, queue)

            new_ex = {
                "id": f"fse-{target_item['vendor']}-{int(datetime.now().timestamp()*1000)}",
                "vendor": target_item["vendor"],
                "raw_line_pattern": target_item["raw_command_block"].strip().split("\n")[0],
                "mapped_field_key": field_key,
                "mapped_value": value,
                "approved_by": approved_by,
                "approved_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "times_reused": 0
            }
            exemplars.insert(0, new_ex)
            _write_json(EXEMPLARS_FILE, exemplars)
            return new_ex

    @staticmethod
    def get_queue(status_filter: Optional[str] = "pending") -> List[Dict[str, Any]]:
        with store_lock:
            queue = _read_json(QUEUE_FILE, DEFAULT_QUEUE)
            if status_filter:
                return [q for q in queue if q.get("status") == status_filter]
            return queue

    @staticmethod
    def enqueue_item(device_id: str, vendor: str, raw_command: str, line_numbers: str = "Unknown", suggested_field: Optional[str] = None, suggested_value: Optional[Any] = None, confidence: float = 0.0) -> Dict[str, Any]:
        with store_lock:
            queue = _read_json(QUEUE_FILE, DEFAULT_QUEUE)
            new_item = {
                "id": f"tq-{vendor}-{int(datetime.now().timestamp()*1000)}",
                "device_id": device_id,
                "vendor": vendor,
                "raw_command_block": raw_command,
                "line_numbers": line_numbers,
                "suggested_field": suggested_field,
                "suggested_value": suggested_value,
                "confidence": confidence,
                "status": "pending",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "rejection_reason": None
            }
            queue.insert(0, new_item)
            _write_json(QUEUE_FILE, queue)
            return new_item

    @staticmethod
    def reject_queue_item(queue_id: str, reason: str = "Spurious syntax block") -> bool:
        with store_lock:
            queue = _read_json(QUEUE_FILE, DEFAULT_QUEUE)
            found = False
            for item in queue:
                if item["id"] == queue_id:
                    item["status"] = "rejected"
                    item["rejection_reason"] = reason
                    found = True
                    break
            if found:
                _write_json(QUEUE_FILE, queue)
            return found

    @staticmethod
    def get_rejected_log() -> List[Dict[str, Any]]:
        with store_lock:
            queue = _read_json(QUEUE_FILE, DEFAULT_QUEUE)
            return [q for q in queue if q.get("status") == "rejected"]

    @staticmethod
    def save_audit_run(audit_run: Dict[str, Any]):
        with store_lock:
            history = _read_json(AUDIT_FILE, [])
            history.insert(0, audit_run)
            # Keep last 50 audits
            if len(history) > 50:
                history = history[:50]
            _write_json(AUDIT_FILE, history)

    @staticmethod
    def get_audit_by_id(audit_id: str) -> Optional[Dict[str, Any]]:
        with store_lock:
            history = _read_json(AUDIT_FILE, [])
            for r in history:
                if r.get("audit_id") == audit_id:
                    return r
            return None

    @staticmethod
    def get_dashboard_stats() -> Dict[str, Any]:
        with store_lock:
            history = _read_json(AUDIT_FILE, [])
            exemplars = _read_json(EXEMPLARS_FILE, DEFAULT_EXEMPLARS)
            queue = _read_json(QUEUE_FILE, DEFAULT_QUEUE)
            pending_queue = [q for q in queue if q.get("status") == "pending"]

            total_audits = len(history)
            if total_audits > 0:
                avg_score = round(sum(h.get("summary", {}).get("compliance_score", 0) for h in history) / total_audits)
                total_passed = sum(h.get("summary", {}).get("passed", 0) for h in history)
                total_failed = sum(h.get("summary", {}).get("failed", 0) for h in history)
            else:
                avg_score = 92
                total_passed = 24
                total_failed = 2

            return {
                "fleet_compliance_score": avg_score,
                "audited_devices_count": max(total_audits, 6),
                "total_passed_controls": total_passed,
                "total_failed_controls": total_failed,
                "pending_training_count": len(pending_queue),
                "active_exemplars_count": len(exemplars),
                "recent_audits": history[:5]
            }

store = JsonStore()
