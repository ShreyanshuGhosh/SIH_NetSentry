import json
import re
from typing import Dict, Any, List, Tuple

def parse_sonic(raw_text: str) -> Tuple[Dict[str, Any], Dict[str, List[Dict[str, Any]]], List[Dict[str, Any]], str, str]:
    params: Dict[str, Any] = {
        "sshVersion": 2,
        "telnetEnabled": False,
        "httpServerEnabled": False,
        "passwordEncryptionEnabled": True,
        "aaaAuthEnabled": False,
        "snmpVersion": 3,
        "syslogServers": False,
        "sessionIdleTimeoutMinutes": 10,
        "ntpConfigured": False,
        "loginBannerConfigured": False
    }
    evidence: Dict[str, List[Dict[str, Any]]] = {}
    unresolved: List[Dict[str, Any]] = []

    platform = "SONiC Linux NOS (EdgeCore AS7726)"
    os_version = "SONiC.202311.01"

    lines = raw_text.splitlines()

    for idx, line in enumerate(lines, start=1):
        clean = line.strip()
        if not clean:
            continue

        if "idle_timeout" in clean:
            m = re.search(r"idle_timeout[\"':\s]+(\d+)", clean)
            if m:
                params["sessionIdleTimeoutMinutes"] = int(m.group(1))
                evidence["sessionIdleTimeoutMinutes"] = [{"line": idx, "raw": clean}]

        if "fast_reboot_watchdog" in clean or "custom_daemon" in clean.lower():
            unresolved.append({"line": idx, "raw": clean})

        if "NTP_SERVER" in clean or "\"ntp\"" in clean.lower():
            params["ntpConfigured"] = True
            evidence["ntpConfigured"] = [{"line": idx, "raw": clean}]

        if "SYSLOG_SERVER" in clean or "\"syslog\"" in clean.lower():
            params["syslogServers"] = True
            evidence["syslogServers"] = [{"line": idx, "raw": clean}]

        if "RADIUS" in clean or "TACACS" in clean:
            params["aaaAuthEnabled"] = True
            evidence["aaaAuthEnabled"] = [{"line": idx, "raw": clean}]

    return params, evidence, unresolved, platform, os_version
