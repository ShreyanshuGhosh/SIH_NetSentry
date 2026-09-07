import re
from typing import Dict, Any, List, Tuple

def parse_arista(raw_text: str) -> Tuple[Dict[str, Any], Dict[str, List[Dict[str, Any]]], List[Dict[str, Any]], str, str]:
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

    platform = "Arista 7050SX Cloud Switch"
    os_version = "EOS 4.30.2F"

    lines = raw_text.splitlines()

    for idx, line in enumerate(lines, start=1):
        clean = line.strip()
        if not clean or clean.startswith("!"):
            continue

        if "transceiver qsfp" in clean:
            unresolved.append({"line": idx, "raw": clean})

        if "banner login" in clean or "banner motd" in clean:
            params["loginBannerConfigured"] = True
            evidence["loginBannerConfigured"] = [{"line": idx, "raw": clean}]

        if "ntp server" in clean:
            params["ntpConfigured"] = True
            evidence["ntpConfigured"] = [{"line": idx, "raw": clean}]

        if "logging host" in clean:
            params["syslogServers"] = True
            evidence["syslogServers"] = [{"line": idx, "raw": clean}]

        if "aaa authentication login" in clean:
            params["aaaAuthEnabled"] = True
            evidence["aaaAuthEnabled"] = [{"line": idx, "raw": clean}]

    return params, evidence, unresolved, platform, os_version
