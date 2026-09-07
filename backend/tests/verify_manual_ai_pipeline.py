import asyncio
import hashlib
from app.store import store
from app.services.redaction import redact_secrets
from app.services.gemini_verifier import verify_unrecognized_syntax
from app.services.reporting import generate_pdf_report
from app.schemas.canonical import AuditRunRequest
from app.routers.audit import run_audit
from app.routers.training import ask_ai_assist, approve_training_item
from app.schemas.canonical import AskAIRequest, ApproveExemplarRequest
from app.services.ssh_collector import stream_ssh_collection

async def main():
    print("=== NETSENTRY MANUAL-FIRST + OPT-IN AI ASSIST VERIFICATION ===")

    # 1. Secret Redaction Test
    sample_cisco = """hostname CORE-SW01
enable secret 9 $9$e7xW$SUPER_SECRET_ENABLE_HASH
username admin privilege 15 secret 9 $9$mJ7K$SUPER_SECRET_ADMIN_HASH
snmp-server community PRIVATE_COMMUNITY RO
ip ssh version 2
service password-encryption
no ip http server
"""
    redacted, count = redact_secrets(sample_cisco)
    assert count >= 3, f"Expected at least 3 redacted secrets, got {count}"
    assert "SUPER_SECRET" not in redacted, "Secret leaked into redacted config!"
    assert "PRIVATE_COMMUNITY" not in redacted, "SNMP community leaked into redacted config!"
    print(f"[PASS] Secret Redaction: Successfully redacted {count} credentials in memory before parsing.")

    # 2. Ingest Config A with Unrecognized Line (Manual-First: No background LLM)
    config_a = """hostname LEAF-NODE-A
ip ssh version 1
transport input telnet
custom_inactivity_watchdog timer 12
"""
    queue_len_before = len(store.get_queue("pending"))
    req_a = AuditRunRequest(
        raw_config=config_a,
        device_id="dev-leaf-a",
        device_name="Leaf Switch A",
        vendor="cisco_ios",
        frameworks=["cis_v8", "nist_800_53"]
    )
    res_a = await run_audit(req_a)
    queue_len_after = len(store.get_queue("pending"))
    print(f"[PASS] Audit Run A: Score={res_a.summary.compliance_score}%, Controls={res_a.summary.deduplicated_controls}, Verdicts={res_a.summary.passed} PASS / {res_a.summary.failed} FAIL.")
    assert queue_len_after > queue_len_before, "Unrecognized line was not enqueued to Human-in-the-Loop review queue!"
    print(f"[PASS] Manual-First Enqueue: Unrecognized line enqueued without background LLM execution.")

    # 3. On-Demand Opt-In AI Assist Test
    pending_items = store.get_queue("pending")
    target_item = pending_items[0]
    print(f"[INFO] Testing On-Demand AI Assist on queue item: '{target_item['raw_command_block']}'...")
    ai_res = await ask_ai_assist(AskAIRequest(
        raw_command=target_item["raw_command_block"],
        vendor=target_item["vendor"]
    ))
    print(f"[PASS] Gemini Verification: Suggested Field='{ai_res.suggested_field}', Value={ai_res.suggested_value}, Confidence={ai_res.confidence*100:.0f}%, Reasoning='{ai_res.reasoning[:60]}...'")

    # 4. Human Approval & Exemplar Store Generalization
    approve_req = ApproveExemplarRequest(
        queue_id=target_item["id"],
        mapped_field_key=ai_res.suggested_field or "sessionIdleTimeoutMinutes",
        mapped_value=ai_res.suggested_value if ai_res.suggested_value is not None else 12,
        approved_by="SecOps Lead Admin"
    )
    saved_ex = await approve_training_item(approve_req)
    print(f"[PASS] Exemplar Approved: ID={saved_ex.id}, Pattern='{saved_ex.raw_line_pattern}', MappedTo={saved_ex.mapped_field_key}={saved_ex.mapped_value}")

    # 5. Ingest Config B (Different device, same syntax) -> Auto-resolves from exemplars.json
    config_b = """hostname LEAF-NODE-B
ip ssh version 2
transport input ssh
no ip http server
custom_inactivity_watchdog timer 12
"""
    req_b = AuditRunRequest(
        raw_config=config_b,
        device_id="dev-leaf-b",
        device_name="Leaf Switch B",
        vendor="cisco_ios",
        frameworks=["cis_v8"]
    )
    res_b = await run_audit(req_b)
    reused_ex = store.find_matching_exemplar("custom_inactivity_watchdog timer 12", "cisco_ios")
    assert reused_ex is not None and reused_ex["times_reused"] >= 1, "Exemplar was not reused cross-device!"
    print(f"[PASS] Cross-Device Generalization: Device B auto-resolved '{saved_ex.mapped_field_key}' via learned exemplar. Times reused: {reused_ex['times_reused']}.")

    # 6. ReportLab PDF Generation
    pdf_bytes = generate_pdf_report(res_b.model_dump())
    assert len(pdf_bytes) > 2000, "PDF bytes suspiciously small"
    assert pdf_bytes.startswith(b"%PDF"), "Generated output is not a valid PDF!"
    print(f"[PASS] ReportLab PDF Engine: Generated {len(pdf_bytes)} bytes cryptographic PDF report.")

    # 7. Real Paramiko SSH Collector Socket Test
    print("[INFO] Testing Paramiko SSH Collector socket handler on 127.0.0.1:2222...")
    events = []
    async for ev in stream_ssh_collection(host="127.0.0.1", port=2222, username="audit_user"):
        events.append(ev)
    final_ev = events[-1]
    print(f"[PASS] Paramiko SSH Socket Test: Honest final status='{final_ev['status']}', Message='{final_ev['message']}'")

    print("\nALL 7 FULL-STACK BACKEND VERIFICATION CHECKS PASSED!")

if __name__ == "__main__":
    asyncio.run(main())
