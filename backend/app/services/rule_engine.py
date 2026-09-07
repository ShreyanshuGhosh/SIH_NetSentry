from typing import Dict, Any, List, Tuple
from app.schemas.canonical import Finding, AuditSummary, LineEvidence

# Canonical Rules with Control Group IDs for multi-framework deduplication
RULES_CATALOG = [
    {
        "id": "CIS-NET-1.1.1",
        "title": "Ensure SSH Protocol Version 2 is Configured",
        "framework": "cis_v8",
        "control_group_id": "CTRL-SSH-V2",
        "severity": "high",
        "framework_ref": "CIS Benchmark v8.0 Control 1.1.1",
        "evaluate": lambda p: "pass" if p.get("sshVersion", 0) >= 2 else "fail",
        "remediation": {
            "cisco_ios": "ip ssh version 2\nip ssh time-out 60\nip ssh authentication-retries 3",
            "juniper_junos": "set system services ssh protocol-version v2",
            "palo_alto_panos": "set deviceconfig system service disable-telnet yes\nset deviceconfig system ssh-cipher-suite aes256-gcm",
            "sonic": "sonic-cli -c \"configure terminal ; ip ssh version 2\"",
            "fortinet_fortios": "config system global\n    set admin-ssh-v1 disable\nend",
            "arista_eos": "management ssh\n   protocol-version 2"
        }
    },
    {
        "id": "NIST-AC-17",
        "title": "Remote Access - Enforce SSHv2 Cryptographic Channel",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-SSH-V2",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev 5 AC-17(2)",
        "evaluate": lambda p: "pass" if p.get("sshVersion", 0) >= 2 else "fail",
        "remediation": {
            "cisco_ios": "ip ssh version 2",
            "juniper_junos": "set system services ssh protocol-version v2",
            "palo_alto_panos": "set deviceconfig system service disable-telnet yes",
            "sonic": "sonic-cli -c \"configure terminal ; ip ssh version 2\"",
            "fortinet_fortios": "config system global\n    set admin-ssh-v1 disable\nend",
            "arista_eos": "management ssh\n   protocol-version 2"
        }
    },
    {
        "id": "CIS-NET-1.1.2",
        "title": "Ensure Insecure Telnet Service is Disabled",
        "framework": "cis_v8",
        "control_group_id": "CTRL-NO-TELNET",
        "severity": "critical",
        "framework_ref": "CIS Benchmark v8.0 Control 1.1.2",
        "evaluate": lambda p: "pass" if p.get("telnetEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "line vty 0 4\n transport input ssh\nline vty 5 15\n transport input ssh",
            "juniper_junos": "delete system services telnet",
            "palo_alto_panos": "set deviceconfig system service disable-telnet yes",
            "sonic": "systemctl disable --now telnetd",
            "fortinet_fortios": "config system global\n    set admin-telnet-service disable\nend",
            "arista_eos": "no management telnet"
        }
    },
    {
        "id": "NIST-IA-5",
        "title": "Authenticator Management - Disable Cleartext Remote Access",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-NO-TELNET",
        "severity": "critical",
        "framework_ref": "NIST SP 800-53 Rev 5 IA-5(1)",
        "evaluate": lambda p: "pass" if p.get("telnetEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "line vty 0 15\n transport input ssh",
            "juniper_junos": "delete system services telnet",
            "palo_alto_panos": "set deviceconfig system service disable-telnet yes",
            "sonic": "systemctl disable --now telnetd",
            "fortinet_fortios": "config system global\n    set admin-telnet-service disable\nend",
            "arista_eos": "no management telnet"
        }
    },
    {
        "id": "CIS-NET-1.2.1",
        "title": "Ensure Unencrypted HTTP Server is Disabled",
        "framework": "cis_v8",
        "control_group_id": "CTRL-NO-HTTP",
        "severity": "medium",
        "framework_ref": "CIS Benchmark v8.0 Control 1.2.1",
        "evaluate": lambda p: "pass" if p.get("httpServerEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "no ip http server\nip http secure-server",
            "juniper_junos": "delete system services web-management http\nset system services web-management https",
            "palo_alto_panos": "set deviceconfig system service disable-http yes",
            "sonic": "systemctl stop nginx\nsystemctl disable nginx",
            "fortinet_fortios": "config system global\n    set admin-http-service disable\nend",
            "arista_eos": "no management api http-commands protocol http"
        }
    },
    {
        "id": "CIS-NET-1.3.1",
        "title": "Ensure Password Encryption Service is Enabled",
        "framework": "cis_v8",
        "control_group_id": "CTRL-PWD-ENC",
        "severity": "medium",
        "framework_ref": "CIS Benchmark v8.0 Control 1.3.1",
        "evaluate": lambda p: "pass" if p.get("passwordEncryptionEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "service password-encryption",
            "juniper_junos": "set system login password-encryption sha-512",
            "palo_alto_panos": "set mgt-config users admin password-hash sha512",
            "sonic": "sonic-cli -c \"configure terminal ; password-encryption enabled\"",
            "fortinet_fortios": "config system global\n    set strong-crypto enable\nend",
            "arista_eos": "service password-encryption"
        }
    },
    {
        "id": "CIS-NET-1.4.1",
        "title": "Ensure AAA Authentication is Enabled",
        "framework": "cis_v8",
        "control_group_id": "CTRL-AAA",
        "severity": "high",
        "framework_ref": "CIS Benchmark v8.0 Control 1.4.1",
        "evaluate": lambda p: "pass" if p.get("aaaAuthEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "aaa new-model\naaa authentication login default group radius local\naaa authorization exec default group radius local",
            "juniper_junos": "set system authentication-order [ tacplus radius password ]",
            "palo_alto_panos": "set deviceconfig system authentication-profile TACACS_PROFILE",
            "sonic": "sonic-cli -c \"configure terminal ; aaa authentication login default group tacacs+ local\"",
            "fortinet_fortios": "config user tacacs+\n    edit \"TACACS_SERVER\"\nend",
            "arista_eos": "aaa new-model\naaa authentication login default group tacacs+ local"
        }
    },
    {
        "id": "CIS-NET-1.5.1",
        "title": "Ensure Centralized Syslog Forwarding is Active",
        "framework": "cis_v8",
        "control_group_id": "CTRL-SYSLOG",
        "severity": "medium",
        "framework_ref": "CIS Benchmark v8.0 Control 1.5.1",
        "evaluate": lambda p: "pass" if p.get("syslogServers") is True else "fail",
        "remediation": {
            "cisco_ios": "logging host 10.14.5.50\nlogging trap notifications\nlogging facility local6",
            "juniper_junos": "set system syslog host 10.14.5.50 any notice",
            "palo_alto_panos": "set shared log-settings syslog SYSLOG_SIEM server 10.14.5.50",
            "sonic": "config syslog add 10.14.5.50",
            "fortinet_fortios": "config log syslogd setting\n    set status enable\n    set server \"10.14.5.50\"\nend",
            "arista_eos": "logging host 10.14.5.50"
        }
    },
    {
        "id": "CIS-NET-1.6.1",
        "title": "Ensure Inactivity Console Timeout is = 15 Minutes",
        "framework": "cis_v8",
        "control_group_id": "CTRL-IDLE-TIMEOUT",
        "severity": "low",
        "framework_ref": "CIS Benchmark v8.0 Control 1.6.1",
        "evaluate": lambda p: "pass" if 0 < p.get("sessionIdleTimeoutMinutes", 0) <= 15 else "fail",
        "remediation": {
            "cisco_ios": "line con 0\n exec-timeout 10 0\nline vty 0 15\n exec-timeout 10 0",
            "juniper_junos": "set system login idle-timeout 10",
            "palo_alto_panos": "set deviceconfig system idle-timeout 10",
            "sonic": "sonic-cli -c \"configure terminal ; line console 0 ; exec-timeout 10\"",
            "fortinet_fortios": "config system global\n    set admintimeout 10\nend",
            "arista_eos": "line console\n   timeout 10 0\nline vty\n   timeout 10 0"
        }
    },
    {
        "id": "CIS-NET-1.7.1",
        "title": "Ensure NTP Time Synchronization is Configured",
        "framework": "cis_v8",
        "control_group_id": "CTRL-NTP",
        "severity": "medium",
        "framework_ref": "CIS Benchmark v8.0 Control 1.7.1",
        "evaluate": lambda p: "pass" if p.get("ntpConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "ntp server 10.14.0.1 prefer\nntp authenticate",
            "juniper_junos": "set system ntp server 10.14.0.1 prefer",
            "palo_alto_panos": "set deviceconfig system ntp-servers primary-ntp-server ntp-server-address 10.14.0.1",
            "sonic": "config ntp add 10.14.0.1",
            "fortinet_fortios": "config system ntp\n    set type custom\n    config ntpserver\n        edit 1\n            set server \"10.14.0.1\"\n        next\n    end\nend",
            "arista_eos": "ntp server 10.14.0.1 prefer"
        }
    },
    {
        "id": "CIS-NET-1.8.1",
        "title": "Ensure Authorized Access Warning Banner is Configured",
        "framework": "cis_v8",
        "control_group_id": "CTRL-BANNER",
        "severity": "low",
        "framework_ref": "CIS Benchmark v8.0 Control 1.8.1",
        "evaluate": lambda p: "pass" if p.get("loginBannerConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "banner login ^C\nPROPRIETARY SYSTEM - AUTHORIZED GOVERNMENT OF INDIA ACCESS ONLY\n^C",
            "juniper_junos": "set system login message \"AUTHORIZED GOVERNMENT ACCESS ONLY\"",
            "palo_alto_panos": "set deviceconfig system login-banner \"AUTHORIZED GOVERNMENT ACCESS ONLY\"",
            "sonic": "sonic-cli -c \"configure terminal ; banner login \\\"AUTHORIZED ACCESS ONLY\\\"\"",
            "fortinet_fortios": "config system global\n    set pre-login-banner enable\nend",
            "arista_eos": "banner login\nAUTHORIZED ACCESS ONLY\nEOF"
        }
    }
]

def evaluate_compliance(
    parameters: Dict[str, Any],
    evidence: Dict[str, List[Dict[str, Any]]],
    vendor: str,
    selected_frameworks: List[str]
) -> Tuple[List[Finding], AuditSummary]:
    findings: List[Finding] = []
    
    # Filter rules by selected frameworks
    applicable_rules = [r for r in RULES_CATALOG if r["framework"] in selected_frameworks]
    
    # Track unique control_group_ids for deduplicated compliance calculation
    control_groups_evaluated: Dict[str, str] = {} # group_id -> "pass" | "fail"
    
    passed_count = 0
    failed_count = 0
    crit_count = 0
    high_count = 0
    med_count = 0
    low_count = 0

    for rule in applicable_rules:
        verdict = rule["evaluate"](parameters)
        
        # Check if parameter has exemplar trace
        resolved_via_exemplar = None
        for key in parameters:
            if key.startswith("_exemplar_"):
                resolved_via_exemplar = parameters[key]
                break

        # Evidence lookup
        # Match parameter key from rule
        rule_evidence = []
        for param_key, ev_list in evidence.items():
            if param_key.lower() in rule["title"].lower() or param_key in ["sshVersion", "telnetEnabled", "httpServerEnabled", "passwordEncryptionEnabled", "aaaAuthEnabled", "syslogServers", "sessionIdleTimeoutMinutes", "ntpConfigured", "loginBannerConfigured"]:
                # Check if this rule evaluates this param
                pass

        # Build Finding object
        remediation_cmd = rule["remediation"].get(vendor, rule["remediation"].get("cisco_ios", "Consult vendor guide"))
        
        # Pull exact line evidence if available
        ev_lines = []
        if "SSH" in rule["title"] and "sshVersion" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["sshVersion"]]
        elif "Telnet" in rule["title"] and "telnetEnabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["telnetEnabled"]]
        elif "HTTP" in rule["title"] and "httpServerEnabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["httpServerEnabled"]]
        elif "Password" in rule["title"] and "passwordEncryptionEnabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["passwordEncryptionEnabled"]]
        elif "AAA" in rule["title"] and "aaaAuthEnabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["aaaAuthEnabled"]]
        elif "Syslog" in rule["title"] and "syslogServers" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["syslogServers"]]
        elif "Timeout" in rule["title"] and "sessionIdleTimeoutMinutes" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["sessionIdleTimeoutMinutes"]]
        elif "NTP" in rule["title"] and "ntpConfigured" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["ntpConfigured"]]
        elif "Banner" in rule["title"] and "loginBannerConfigured" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["loginBannerConfigured"]]

        findings.append(Finding(
            rule_id=rule["id"],
            rule_title=rule["title"],
            framework=rule["framework"],
            control_group_id=rule.get("control_group_id"),
            severity=rule["severity"],
            status=verdict,
            evidence_lines=ev_lines,
            remediation_command=remediation_cmd,
            framework_ref=rule["framework_ref"],
            resolved_via_exemplar=resolved_via_exemplar
        ))

        # Update control group deduplication
        cg_id = rule.get("control_group_id") or rule["id"]
        if cg_id not in control_groups_evaluated:
            control_groups_evaluated[cg_id] = verdict
        else:
            # If any failure occurred on this control across frameworks, verdict is fail
            if verdict == "fail":
                control_groups_evaluated[cg_id] = "fail"

        if verdict == "pass":
            passed_count += 1
        else:
            failed_count += 1
            if rule["severity"] == "critical":
                crit_count += 1
            elif rule["severity"] == "high":
                high_count += 1
            elif rule["severity"] == "medium":
                med_count += 1
            else:
                low_count += 1

    dedup_total = len(control_groups_evaluated)
    dedup_passed = sum(1 for v in control_groups_evaluated.values() if v == "pass")
    compliance_score = round((dedup_passed / dedup_total) * 100) if dedup_total > 0 else 100

    summary = AuditSummary(
        compliance_score=compliance_score,
        total_controls=len(applicable_rules),
        deduplicated_controls=dedup_total,
        passed=passed_count,
        failed=failed_count,
        critical_count=crit_count,
        high_count=high_count,
        medium_count=med_count,
        low_count=low_count
    )

    return findings, summary
