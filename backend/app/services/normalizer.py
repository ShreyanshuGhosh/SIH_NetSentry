from typing import Dict, Any, List, Tuple
from app.store import store

def process_unrecognized_lines(
    device_id: str,
    vendor: str,
    unresolved_lines: List[Dict[str, Any]],
    parameters: Dict[str, Any],
    evidence: Dict[str, List[Dict[str, Any]]]
) -> Tuple[Dict[str, Any], Dict[str, List[Dict[str, Any]]], List[Dict[str, Any]]]:
    """
    Dual-Lane Normalizer:
    1. First checks the Few-Shot Exemplar Store in exemplars.json.
       If an exemplar pattern matches, auto-resolves the parameter,
       increments times_reused, and attaches provenance.
    2. If not matched, instantly enqueues the line into the Amber review queue.
       Zero background LLM calls (Gemini is triggered strictly on-demand by the operator).
    """
    still_unresolved = []

    for item in unresolved_lines:
        line_no = item.get("line", 1)
        raw_cmd = item.get("raw", "").strip()
        if not raw_cmd:
            continue

        matched_exemplar = store.find_matching_exemplar(raw_cmd, vendor)
        if matched_exemplar:
            field_key = matched_exemplar["mapped_field_key"]
            val = matched_exemplar["mapped_value"]
            parameters[field_key] = val
            evidence[field_key] = [{"line": line_no, "raw": raw_cmd}]
            # Attach exemplar provenance trace
            parameters[f"_exemplar_{field_key}"] = {
                "exemplar_id": matched_exemplar["id"],
                "source_device_id": matched_exemplar.get("approved_by", "Learned Pattern"),
                "pattern": matched_exemplar.get("raw_line_pattern")
            }
        else:
            # Enqueue to training queue for human review
            store.enqueue_item(
                device_id=device_id,
                vendor=vendor,
                raw_command=raw_cmd,
                line_numbers=f"Line {line_no}",
                confidence=0.50
            )
            still_unresolved.append(item)

    return parameters, evidence, still_unresolved
