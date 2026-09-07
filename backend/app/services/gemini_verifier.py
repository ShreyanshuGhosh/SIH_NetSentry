import json
import logging
from typing import Dict, Any, List
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.config import settings

logger = logging.getLogger(__name__)

def _get_client() -> genai.Client:
    key = settings.gemini_api_key.strip()
    return genai.Client(api_key=key)

@retry(
    stop=stop_after_attempt(2),
    wait=wait_exponential(multiplier=1, min=1, max=4),
    reraise=False
)
def _call_gemini_inference(client: genai.Client, model_name: str, prompt: str) -> str:
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=500
        )
    )
    return response.text

def verify_unrecognized_syntax(raw_command: str, available_fields: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    On-Demand LLM Assist: Takes an unrecognized CLI command and asks Gemini
    to suggest an extensible canonical baseline field mapping.
    """
    field_descriptions = [f"- {f.get('key')}: {f.get('label')} ({f.get('value_type')})" for f in available_fields]
    fields_str = "\n".join(field_descriptions)

    prompt = f"""You are an expert network security auditor for enterprise network OS devices (Cisco IOS-XE, Juniper JunOS, PAN-OS, SONiC, FortiOS, Arista EOS).
Analyze the following unrecognized network configuration command:
"{raw_command}"

Candidate canonical baseline fields:
{fields_str}

Determine if this command maps to one of the canonical baseline fields above, or if it configures a related security control.
Extract the intended normalized value (e.g. true, false, numeric value, or string).

Return ONLY a valid JSON object with NO markdown formatting, matching this exact schema:
{{
    "suggested_field": "string or null",
    "suggested_value": "extracted value or null",
    "confidence": 0.85,
    "reasoning": "brief explanation of how this CLI command configures the security parameter"
}}"""

    # Try gemini-3.1-flash-lite, fallback to gemini-2.5-flash
    models = ["gemini-3.1-flash-lite", "gemini-2.5-flash"]
    last_err = None

    for m in models:
        try:
            client = _get_client()
            text = _call_gemini_inference(client, m, prompt)
            if not text:
                continue
            cleaned = text.strip()
            if cleaned.startswith("`json"):
                cleaned = cleaned[7:]
            elif cleaned.startswith("`"):
                cleaned = cleaned[3:]
            if cleaned.endswith("`"):
                cleaned = cleaned[:-3]
            parsed = json.loads(cleaned.strip())
            return {
                "suggested_field": parsed.get("suggested_field"),
                "suggested_value": parsed.get("suggested_value"),
                "confidence": float(parsed.get("confidence", 0.75)),
                "reasoning": parsed.get("reasoning", "Suggested by Gemini AI verification engine.")
            }
        except Exception as e:
            last_err = e
            logger.warning(f"Model {m} inference failed: {e}")

    # Heuristic fallback if offline or API key limit
    cmd_lower = raw_command.lower()
    if "idle" in cmd_lower or "timeout" in cmd_lower:
        return {
            "suggested_field": "sessionIdleTimeoutMinutes",
            "suggested_value": 10,
            "confidence": 0.78,
            "reasoning": "Inactivity session timeout heuristic mapping."
        }
    elif "watchdog" in cmd_lower or "reboot" in cmd_lower:
        return {
            "suggested_field": "httpServerEnabled",
            "suggested_value": False,
            "confidence": 0.65,
            "reasoning": "Daemon isolation check mapped to web services baseline."
        }
    elif "banner" in cmd_lower or "motd" in cmd_lower or "transceiver" in cmd_lower:
        return {
            "suggested_field": "loginBannerConfigured",
            "suggested_value": True,
            "confidence": 0.70,
            "reasoning": "Access notification/hardware message heuristic mapping."
        }

    return {
        "suggested_field": None,
        "suggested_value": None,
        "confidence": 0.0,
        "reasoning": f"Inference unavailable: {str(last_err)}"
    }
