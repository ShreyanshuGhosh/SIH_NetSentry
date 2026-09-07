import re
from typing import Dict, Any, List, Tuple

def parse_fortinet(raw_text: str) -> Tuple[Dict[str, Any], Dict[str, List[Dict[str, Any]]], List[Dict[str, Any]], str, str]:
    params: Dict[str, Any] = {
        "sshVersion": 2,
        "telnetEnabled": True,
        "httpServerEnabled": True,
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

    platform = "FortiGate Next-Generation Security Appliance"
    os_version = "FortiOS 7.4.1"

    lines = raw_text.splitlines()

    for idx, line in enumerate(lines, start=1):
        clean = line.strip()
        if not clean or clean.startswith("#"):
            continue

        if "set admin-telnet-service disable" in clean or "set telnet disable" in clean:
            params["telnetEnabled"] = False
            evidence["telnetEnabled"] = [{"line": idx, "raw": clean}]
        elif "set admin-telnet-service enable" in clean:
            params["telnetEnabled"] = True
            evidence["telnetEnabled"] = [{"line": idx, "raw": clean}]

        if "set admin-http-service disable" in clean:
            params["httpServerEnabled"] = False
            evidence["httpServerEnabled"] = [{"line": idx, "raw": clean}]
        elif "set admin-http-service enable" in clean:
            params["httpServerEnabled"] = True
            evidence["httpServerEnabled"] = [{"line": idx, "raw": clean}]

        if "set pre-login-banner enable" in clean or "set post-login-banner enable" in clean:
            params["loginBannerConfigured"] = True
            evidence["loginBannerConfigured"] = [{"line": idx, "raw": clean}]

        if "config log syslogd setting" in clean or "set syslog-name" in clean:
            params["syslogServers"] = True
            evidence["syslogServers"] = [{"line": idx, "raw": clean}]

        if "set ntpserver" in clean or "config system ntp" in clean:
            params["ntpConfigured"] = True
            evidence["ntpConfigured"] = [{"line": idx, "raw": clean}]

    return params, evidence, unresolved, platform, os_version
