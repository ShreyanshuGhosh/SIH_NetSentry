import re
from typing import Dict, Any, List, Tuple

def parse_cisco(raw_text: str) -> Tuple[Dict[str, Any], Dict[str, List[Dict[str, Any]]], List[Dict[str, Any]], str, str]:
    lines = raw_text.splitlines()
    params: Dict[str, Any] = {
        "sshVersion": 1,
        "telnetEnabled": True,
        "httpServerEnabled": True,
        "passwordEncryptionEnabled": False,
        "aaaAuthEnabled": False,
        "snmpVersion": 1,
        "syslogServers": False,
        "sessionIdleTimeoutMinutes": 0,
        "ntpConfigured": False,
        "loginBannerConfigured": False
    }
    evidence: Dict[str, List[Dict[str, Any]]] = {}
    unresolved: List[Dict[str, Any]] = []

    platform = "Catalyst 9300"
    os_version = "17.9.4a Universal"

    for idx, line in enumerate(lines, start=1):
        clean = line.strip()
        if not clean or clean.startswith("!") or clean.startswith("#"):
            continue

        # Version & Platform
        if clean.startswith("version "):
            os_version = clean.replace("version ", "").strip()
        elif "hostname " in clean:
            platform = "Cisco IOS-XE Device"

        # SSH version
        if re.search(r"^ip\s+ssh\s+version\s+(\d+)", clean, re.IGNORECASE):
            m = re.search(r"^ip\s+ssh\s+version\s+(\d+)", clean, re.IGNORECASE)
            params["sshVersion"] = int(m.group(1))
            evidence["sshVersion"] = [{"line": idx, "raw": clean}]
        elif re.search(r"^ip\s+ssh\s+time-out\s+(\d+)", clean, re.IGNORECASE):
            # timeout
            pass

        # Telnet
        elif "transport input none" in clean or "transport input ssh" in clean:
            params["telnetEnabled"] = False
            evidence["telnetEnabled"] = [{"line": idx, "raw": clean}]
        elif "transport input all" in clean or "transport input telnet" in clean:
            params["telnetEnabled"] = True
            evidence["telnetEnabled"] = [{"line": idx, "raw": clean}]

        # HTTP Server
        elif clean.startswith("no ip http server"):
            params["httpServerEnabled"] = False
            evidence["httpServerEnabled"] = [{"line": idx, "raw": clean}]
        elif clean.startswith("ip http server"):
            params["httpServerEnabled"] = True
            evidence["httpServerEnabled"] = [{"line": idx, "raw": clean}]

        # Password Encryption
        elif clean == "service password-encryption":
            params["passwordEncryptionEnabled"] = True
            evidence["passwordEncryptionEnabled"] = [{"line": idx, "raw": clean}]

        # AAA
        elif clean.startswith("aaa new-model"):
            params["aaaAuthEnabled"] = True
            evidence["aaaAuthEnabled"] = [{"line": idx, "raw": clean}]

        # SNMP
        elif re.search(r"^snmp-server\s+group\s+\S+\s+v3", clean, re.IGNORECASE):
            params["snmpVersion"] = 3
            evidence["snmpVersion"] = [{"line": idx, "raw": clean}]
        elif "snmp-server community" in clean:
            if params["snmpVersion"] != 3:
                params["snmpVersion"] = 2
                evidence["snmpVersion"] = [{"line": idx, "raw": clean}]

        # Syslog
        elif clean.startswith("logging host ") or clean.startswith("logging server "):
            params["syslogServers"] = True
            evidence["syslogServers"] = [{"line": idx, "raw": clean}]

        # Inactivity Timeout
        elif re.search(r"^exec-timeout\s+(\d+)", clean, re.IGNORECASE):
            m = re.search(r"^exec-timeout\s+(\d+)", clean, re.IGNORECASE)
            params["sessionIdleTimeoutMinutes"] = int(m.group(1))
            evidence["sessionIdleTimeoutMinutes"] = [{"line": idx, "raw": clean}]

        # NTP
        elif clean.startswith("ntp server ") or clean.startswith("ntp peer "):
            params["ntpConfigured"] = True
            evidence["ntpConfigured"] = [{"line": idx, "raw": clean}]

        # Banner
        elif clean.startswith("banner login ") or clean.startswith("banner motd "):
            params["loginBannerConfigured"] = True
            evidence["loginBannerConfigured"] = [{"line": idx, "raw": clean}]

        # Potential unrecognized commands (heuristics)
        elif any(k in clean for k in ["custom", "watchdog", "experimental", "telemetry-stream", "proprietary"]):
            unresolved.append({"line": idx, "raw": clean})

    return params, evidence, unresolved, platform, os_version
