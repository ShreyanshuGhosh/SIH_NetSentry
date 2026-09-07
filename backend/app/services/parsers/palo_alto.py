import re
from typing import Dict, Any, List, Tuple

def parse_palo_alto(raw_text: str) -> Tuple[Dict[str, Any], Dict[str, List[Dict[str, Any]]], List[Dict[str, Any]], str, str]:
    lines = raw_text.splitlines()
    params: Dict[str, Any] = {
        "sshVersion": 2, # PAN-OS defaults to SSHv2
        "telnetEnabled": False,
        "httpServerEnabled": False,
        "passwordEncryptionEnabled": True,
        "aaaAuthEnabled": False,
        "snmpVersion": 3,
        "syslogServers": False,
        "sessionIdleTimeoutMinutes": 15,
        "ntpConfigured": False,
        "loginBannerConfigured": False
    }
    evidence: Dict[str, List[Dict[str, Any]]] = {}
    unresolved: List[Dict[str, Any]] = []

    platform = "Palo Alto Next-Gen Firewall (PA-3220)"
    os_version = "PAN-OS 11.0.2"

    for idx, line in enumerate(lines, start=1):
        clean = line.strip()
        if not clean:
            continue

        if "<telnet>yes</telnet>" in clean or "set service telnet enable" in clean:
            params["telnetEnabled"] = True
            evidence["telnetEnabled"] = [{"line": idx, "raw": clean}]
        elif "<http>yes</http>" in clean:
            params["httpServerEnabled"] = True
            evidence["httpServerEnabled"] = [{"line": idx, "raw": clean}]
        elif "<syslog>" in clean or "set deviceconfig system syslog" in clean:
            params["syslogServers"] = True
            evidence["syslogServers"] = [{"line": idx, "raw": clean}]
        elif "<banner>" in clean or "set deviceconfig system login-banner" in clean:
            params["loginBannerConfigured"] = True
            evidence["loginBannerConfigured"] = [{"line": idx, "raw": clean}]
        elif "<ntp-servers>" in clean or "set deviceconfig system ntp-servers" in clean:
            params["ntpConfigured"] = True
            evidence["ntpConfigured"] = [{"line": idx, "raw": clean}]
        elif "<authentication-profile>" in clean:
            params["aaaAuthEnabled"] = True
            evidence["aaaAuthEnabled"] = [{"line": idx, "raw": clean}]

    return params, evidence, unresolved, platform, os_version
