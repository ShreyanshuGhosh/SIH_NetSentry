import re
from typing import Dict, Any, List, Tuple

def parse_juniper(raw_text: str) -> Tuple[Dict[str, Any], Dict[str, List[Dict[str, Any]]], List[Dict[str, Any]], str, str]:
    lines = raw_text.splitlines()
    params: Dict[str, Any] = {
        "sshVersion": 1,
        "telnetEnabled": True,
        "httpServerEnabled": True,
        "passwordEncryptionEnabled": True,
        "aaaAuthEnabled": False,
        "snmpVersion": 1,
        "syslogServers": False,
        "sessionIdleTimeoutMinutes": 0,
        "ntpConfigured": False,
        "loginBannerConfigured": False
    }
    evidence: Dict[str, List[Dict[str, Any]]] = {}
    unresolved: List[Dict[str, Any]] = []

    platform = "Juniper SRX / MX Gateway"
    os_version = "JunOS 22.4R1"

    for idx, line in enumerate(lines, start=1):
        clean = line.strip()
        if not clean or clean.startswith("/*") or clean.startswith("#"):
            continue

        # SSH version
        if "protocol-version v2" in clean or "ssh protocol-version v2" in clean:
            params["sshVersion"] = 2
            evidence["sshVersion"] = [{"line": idx, "raw": clean}]

        # Telnet
        elif "telnet {" in clean and "/* legacy" in clean:
            params["telnetEnabled"] = True
            evidence["telnetEnabled"] = [{"line": idx, "raw": clean}]
            unresolved.append({"line": idx, "raw": clean})
        elif "services { telnet" in clean or "set system services telnet" in clean:
            params["telnetEnabled"] = True
            evidence["telnetEnabled"] = [{"line": idx, "raw": clean}]
        elif "delete system services telnet" in clean or "no telnet" in clean:
            params["telnetEnabled"] = False
            evidence["telnetEnabled"] = [{"line": idx, "raw": clean}]

        # Web management
        elif "web-management {" in clean or "set system services web-management" in clean:
            if "http {" in clean or "set system services web-management http" in clean:
                params["httpServerEnabled"] = True
                evidence["httpServerEnabled"] = [{"line": idx, "raw": clean}]
            elif "https {" in clean:
                params["httpServerEnabled"] = False
                evidence["httpServerEnabled"] = [{"line": idx, "raw": clean}]

        # AAA
        elif "radius-server {" in clean or "tacplus-server {" in clean:
            params["aaaAuthEnabled"] = True
            evidence["aaaAuthEnabled"] = [{"line": idx, "raw": clean}]

        # SNMP
        elif "snmp {" in clean and "v3" in clean:
            params["snmpVersion"] = 3
            evidence["snmpVersion"] = [{"line": idx, "raw": clean}]

        # Syslog
        elif "syslog {" in clean or "host " in clean and "syslog" in line:
            params["syslogServers"] = True
            evidence["syslogServers"] = [{"line": idx, "raw": clean}]

        # Inactivity Timeout
        elif "idle-timeout " in clean:
            m = re.search(r"idle-timeout\s+(\d+)", clean)
            if m:
                params["sessionIdleTimeoutMinutes"] = int(m.group(1))
                evidence["sessionIdleTimeoutMinutes"] = [{"line": idx, "raw": clean}]

        # NTP
        elif "ntp {" in clean or "set system ntp server" in clean:
            params["ntpConfigured"] = True
            evidence["ntpConfigured"] = [{"line": idx, "raw": clean}]

        # Login message / banner
        elif "login { message " in clean or "set system login message" in clean:
            params["loginBannerConfigured"] = True
            evidence["loginBannerConfigured"] = [{"line": idx, "raw": clean}]

    return params, evidence, unresolved, platform, os_version
