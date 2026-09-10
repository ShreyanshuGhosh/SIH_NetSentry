from typing import Dict, Any, List, Tuple
from app.schemas.canonical import Finding, AuditSummary, LineEvidence

# Canonical Rules with Control Group IDs for multi-framework deduplication
RULES_CATALOG = [
    # ─── CIS Controls v8 (Network Infrastructure Safeguards) ───
    {
        "id": "CIS-NET-1.1.1",
        "title": "Ensure SSH Protocol Version 2 is Configured",
        "framework": "cis_v8",
        "control_group_id": "CTRL-SSH-V2",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 4.1",
        "source_note": "CIS Controls v8, Safeguard 4.1 (Establish and Maintain a Secure Configuration Baseline - SSHv2)",
        "evaluate": lambda p: "pass" if p.get("sshVersion", 0) >= 2 else "fail",
        "remediation": {
            "cisco_ios": "ip ssh version 2\nip ssh server algorithm encryption aes256-gcm",
            "juniper_junos": "set system services ssh protocol-version v2",
            "palo_alto_panos": "set deviceconfig system ssh ciphers mgmt [ aes256-gcm aes256-ctr ]",
            "sonic": "sonic-cli -c \"configure terminal ; ip ssh version 2\"",
            "fortinet_fortios": "config system global\n    set admin-ssh-v1 disable\n    set strong-crypto enable\nend",
            "arista_eos": "management ssh\n   protocol-version 2"
        }
    },
    {
        "id": "CIS-NET-1.1.2",
        "title": "Ensure Insecure Telnet Service is Disabled",
        "framework": "cis_v8",
        "control_group_id": "CTRL-TELNET-OFF",
        "severity": "critical",
        "framework_ref": "CIS Controls v8 Safeguard 4.8",
        "source_note": "CIS Controls v8, Safeguard 4.8 (Uninstall or Disable Unnecessary Services - Telnet)",
        "evaluate": lambda p: "pass" if p.get("telnetEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "line vty 0 15\n transport input ssh\n no transport input telnet",
            "juniper_junos": "delete system services telnet",
            "palo_alto_panos": "set deviceconfig system service disable-telnet yes",
            "sonic": "systemctl mask --now telnet.socket",
            "fortinet_fortios": "config system interface\n    edit \"port1\"\n        set allowaccess ping https ssh\n    next\nend",
            "arista_eos": "no management telnet"
        }
    },
    {
        "id": "CIS-NET-1.2.1",
        "title": "Ensure Unencrypted HTTP Server is Disabled",
        "framework": "cis_v8",
        "control_group_id": "CTRL-HTTP-OFF",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 4.8",
        "source_note": "CIS Controls v8, Safeguard 4.8 (Uninstall or Disable Unnecessary Services - HTTP)",
        "evaluate": lambda p: "pass" if p.get("httpServerEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "no ip http server\nip http secure-server",
            "juniper_junos": "delete system services web-management http\nset system services web-management https",
            "palo_alto_panos": "set deviceconfig system service disable-http yes",
            "sonic": "systemctl stop nginx-http && systemctl disable nginx-http",
            "fortinet_fortios": "config system global\n    set admin-https-redirect enable\nend",
            "arista_eos": "no management api http-commands protocol http"
        }
    },
    {
        "id": "CIS-NET-1.3.1",
        "title": "Ensure Password Encryption Service is Enabled",
        "framework": "cis_v8",
        "control_group_id": "CTRL-PASS-ENCRYPT",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 5.2",
        "source_note": "CIS Controls v8, Safeguard 5.2 (Use Unique Passwords - Local Password Encryption)",
        "evaluate": lambda p: "pass" if p.get("passwordEncryptionEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "service password-encryption",
            "juniper_junos": "set system login password-format sha512",
            "palo_alto_panos": "set mgt-config users secadmin password",
            "sonic": "passwd -e admin",
            "fortinet_fortios": "config system global\n    set strong-crypto enable\nend",
            "arista_eos": "service password-encryption"
        }
    },
    {
        "id": "CIS-NET-1.4.1",
        "title": "Ensure AAA Authentication is Enabled",
        "framework": "cis_v8",
        "control_group_id": "CTRL-AAA-AUTH",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 5.3",
        "source_note": "CIS Controls v8, Safeguard 5.3 (Disable Dormant Accounts / Centralized AAA Services)",
        "evaluate": lambda p: "pass" if p.get("aaaAuthEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "aaa new-model\naaa authentication login default group tacacs+ local\naaa authorization exec default group tacacs+ local",
            "juniper_junos": "set system authentication-order [ tacplus radius password ]",
            "palo_alto_panos": "set shared authentication-profile TACACS-AUTH method tacacs-plus",
            "sonic": "config aaa authentication login tacacs+ local",
            "fortinet_fortios": "config user tacacs+\n    edit \"secops_tacacs\"\n        set server \"10.14.5.10\"\n    next\nend",
            "arista_eos": "aaa new-model\naaa authentication login default group tacacs+ local"
        }
    },
    {
        "id": "CIS-NET-1.2.2",
        "title": "SNMP Protocol Restricted to v3 authPriv",
        "framework": "cis_v8",
        "control_group_id": "CTRL-SNMP-V3",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 12.6",
        "source_note": "CIS Controls v8, Safeguard 12.6 (Secure Network Management Protocols - SNMPv3 authPriv)",
        "evaluate": lambda p: "pass" if p.get("snmpVersion") == "v3" else "fail",
        "remediation": {
            "cisco_ios": "no snmp-server community public\nsnmp-server group SECGROUP v3 priv",
            "juniper_junos": "delete snmp community\nset snmp v3 usm local-engine user admin-v3 authentication-sha",
            "palo_alto_panos": "set deviceconfig system snmp-setting snmp-version-v3 user secoper authpwd <pwd> privpwd <pwd>",
            "sonic": "config snmp user add secoper SHA <auth-key> AES <priv-key>",
            "fortinet_fortios": "config system snmp user\n    edit \"snmp3user\"\n        set security-level auth-priv\n    next\nend",
            "arista_eos": "snmp-server group SECGROUP v3 auth"
        }
    },
    {
        "id": "CIS-NET-1.5.1",
        "title": "Ensure Centralized Syslog Forwarding is Active",
        "framework": "cis_v8",
        "control_group_id": "CTRL-SYSLOG-SIEM",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 8.2",
        "source_note": "CIS Controls v8, Safeguard 8.2 (Collect Audit Logs - Centralized Syslog)",
        "evaluate": lambda p: "pass" if p.get("syslogServers") is not None and p.get("syslogServers") is not False else "fail",
        "remediation": {
            "cisco_ios": "logging host 10.14.5.50\nlogging trap notifications\nlogging facility local6",
            "juniper_junos": "set system syslog host 10.14.5.50 any notice facility-override local5",
            "palo_alto_panos": "set shared log-settings syslog SYSLOG_SIEM server 10.14.5.50",
            "sonic": "config syslog add 10.14.5.50",
            "fortinet_fortios": "config log syslogd setting\n    set status enable\n    set server \"10.14.5.50\"\nend",
            "arista_eos": "logging host 10.14.5.50"
        }
    },
    {
        "id": "CIS-NET-1.6.1",
        "title": "Ensure Inactivity Console Timeout is <= 15 Minutes",
        "framework": "cis_v8",
        "control_group_id": "CTRL-IDLE-TIMEOUT",
        "severity": "medium",
        "framework_ref": "CIS Controls v8 Safeguard 4.3",
        "source_note": "CIS Controls v8, Safeguard 4.3 (Configure Automatic Session Locking on Enterprise Assets)",
        "evaluate": lambda p: "pass" if 0 < p.get("sessionIdleTimeoutMinutes", 0) <= 15 else "fail",
        "remediation": {
            "cisco_ios": "line con 0\n exec-timeout 10 0\nline vty 0 15\n exec-timeout 10 0",
            "juniper_junos": "set system login idle-timeout 10",
            "palo_alto_panos": "set deviceconfig system idle-timeout 10",
            "sonic": "config ssh idle-timeout 600",
            "fortinet_fortios": "config system global\n    set admintimeout 10\nend",
            "arista_eos": "line console\n   timeout 10 0\nline vty\n   timeout 10 0"
        }
    },
    {
        "id": "CIS-NET-1.7.1",
        "title": "Ensure NTP Time Synchronization is Configured",
        "framework": "cis_v8",
        "control_group_id": "CTRL-NTP-SYNC",
        "severity": "medium",
        "framework_ref": "CIS Controls v8 Safeguard 8.4",
        "source_note": "CIS Controls v8, Safeguard 8.4 (Standardize Time Synchronization across Enterprise Assets)",
        "evaluate": lambda p: "pass" if p.get("ntpConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "ntp server 10.14.0.1 prefer\nntp authenticate",
            "juniper_junos": "set system ntp server 10.14.0.1 prefer",
            "palo_alto_panos": "set deviceconfig system ntp-servers primary-ntp-server 10.14.0.1",
            "sonic": "config ntp add 10.14.0.1",
            "fortinet_fortios": "config system ntp\n    set ntpsync enable\n    set type custom\nend",
            "arista_eos": "ntp server 10.14.0.1 prefer"
        }
    },
    {
        "id": "CIS-NET-1.8.1",
        "title": "Ensure Authorized Access Warning Banner is Configured",
        "framework": "cis_v8",
        "control_group_id": "CTRL-LOGIN-BANNER",
        "severity": "low",
        "framework_ref": "CIS Controls v8 Safeguard 4.1",
        "source_note": "CIS Controls v8, Safeguard 4.1 (Establish and Maintain a Secure Configuration Baseline - Advisory Banner)",
        "evaluate": lambda p: "pass" if p.get("loginBannerConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "banner login ^C\nPROPRIETARY SYSTEM - AUTHORIZED ACCESS ONLY\n^C",
            "juniper_junos": "set system login message \"AUTHORIZED ACCESS ONLY\"",
            "palo_alto_panos": "set deviceconfig system login-banner \"AUTHORIZED ACCESS ONLY\"",
            "sonic": "config banner login \"AUTHORIZED ACCESS ONLY\"",
            "fortinet_fortios": "config system global\n    set pre-login-banner enable\nend",
            "arista_eos": "banner login\nAUTHORIZED ACCESS ONLY\nEOF"
        }
    },

    # ─── NIST SP 800-53 Rev. 5 Controls ───
    {
        "id": "NIST-AC-17",
        "title": "Remote Access - Enforce SSHv2 Cryptographic Channel",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-SSH-V2",
        "severity": "critical",
        "framework_ref": "NIST SP 800-53 Rev. 5 AC-17(2)",
        "source_note": "NIST SP 800-53 Rev. 5, Control AC-17(2) (Remote Access - Cryptographic Protection)",
        "evaluate": lambda p: "pass" if p.get("sshVersion", 0) >= 2 else "fail",
        "remediation": {
            "cisco_ios": "ip ssh version 2",
            "juniper_junos": "set system services ssh protocol-version v2",
            "palo_alto_panos": "set deviceconfig system ssh ciphers mgmt [ aes256-gcm aes256-ctr ]",
            "sonic": "sonic-cli -c \"configure terminal ; ip ssh version 2\"",
            "fortinet_fortios": "config system global\n    set admin-ssh-v1 disable\n    set strong-crypto enable\nend",
            "arista_eos": "management ssh\n   protocol-version 2"
        }
    },
    {
        "id": "NIST-SC-8",
        "title": "Transmission Confidentiality - Ban Insecure Telnet",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-TELNET-OFF",
        "severity": "critical",
        "framework_ref": "NIST SP 800-53 Rev. 5 SC-8(1)",
        "source_note": "NIST SP 800-53 Rev. 5, Control SC-8(1) (Transmission Confidentiality - Disable Cleartext Protocols)",
        "evaluate": lambda p: "pass" if p.get("telnetEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "line vty 0 15\n transport input ssh",
            "juniper_junos": "delete system services telnet",
            "palo_alto_panos": "set deviceconfig system service disable-telnet yes",
            "sonic": "systemctl mask --now telnet.socket",
            "fortinet_fortios": "config system interface\n    edit \"port1\"\n        set allowaccess ping https ssh\n    next\nend",
            "arista_eos": "no management telnet"
        }
    },
    {
        "id": "NIST-SC-13",
        "title": "Cryptographic Boundary - Disable Plaintext HTTP",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-HTTP-OFF",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 SC-13 / SC-8",
        "source_note": "NIST SP 800-53 Rev. 5, Controls SC-13 & SC-8 (Cryptographic Protection of Management Services)",
        "evaluate": lambda p: "pass" if p.get("httpServerEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "no ip http server\nip http secure-server",
            "juniper_junos": "delete system services web-management http\nset system services web-management https",
            "palo_alto_panos": "set deviceconfig system service disable-http yes",
            "sonic": "systemctl stop nginx-http && systemctl disable nginx-http",
            "fortinet_fortios": "config system global\n    set admin-https-redirect enable\nend",
            "arista_eos": "no management api http-commands protocol http"
        }
    },
    {
        "id": "NIST-IA-5",
        "title": "Authenticator Management - Cryptographic Password Storage",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-PASS-ENCRYPT",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 IA-5(1)",
        "source_note": "NIST SP 800-53 Rev. 5, Control IA-5(1) (Password-Based Authentication - Cryptographic Storage)",
        "evaluate": lambda p: "pass" if p.get("passwordEncryptionEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "service password-encryption",
            "juniper_junos": "set system login password-format sha512",
            "palo_alto_panos": "set mgt-config users secadmin password",
            "sonic": "passwd -e admin",
            "fortinet_fortios": "config system global\n    set strong-crypto enable\nend",
            "arista_eos": "service password-encryption"
        }
    },
    {
        "id": "NIST-IA-2",
        "title": "Identification and Authentication - Centralized AAA",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-AAA-AUTH",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 IA-2(1)",
        "source_note": "NIST SP 800-53 Rev. 5, Control IA-2(1) (Centralized Identification and Authentication)",
        "evaluate": lambda p: "pass" if p.get("aaaAuthEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "aaa new-model\naaa authentication login default group tacacs+ local",
            "juniper_junos": "set system authentication-order [ tacplus radius password ]",
            "palo_alto_panos": "set shared authentication-profile TACACS-AUTH method tacacs-plus",
            "sonic": "config aaa authentication login tacacs+ local",
            "fortinet_fortios": "config user tacacs+\n    edit \"secops_tacacs\"\n        set server \"10.14.5.10\"\n    next\nend",
            "arista_eos": "aaa new-model\naaa authentication login default group tacacs+ local"
        }
    },
    {
        "id": "NIST-SC-8-SNMP",
        "title": "Transmission Integrity - Mandate SNMPv3 authPriv",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-SNMP-V3",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 SC-8(1)",
        "source_note": "NIST SP 800-53 Rev. 5, Control SC-8(1) (Cryptographic Protection for Telemetry & Polling)",
        "evaluate": lambda p: "pass" if p.get("snmpVersion") == "v3" else "fail",
        "remediation": {
            "cisco_ios": "no snmp-server community public\nsnmp-server group NIST_GRP v3 priv",
            "juniper_junos": "delete snmp community\nset snmp v3 usm local-engine user secadmin authentication-sha",
            "palo_alto_panos": "set deviceconfig system snmp-setting snmp-version-v3 user secadmin authpwd <pwd> privpwd <pwd>",
            "sonic": "config snmp user add secadmin SHA <key> AES <key>",
            "fortinet_fortios": "config system snmp user\n    edit \"secadmin\"\n        set security-level auth-priv\n    next\nend",
            "arista_eos": "snmp-server group NIST_GRP v3 priv"
        }
    },
    {
        "id": "NIST-AU-4",
        "title": "Audit Storage - Transfer Records to Central SIEM",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-SYSLOG-SIEM",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 AU-4(1) / AU-12",
        "source_note": "NIST SP 800-53 Rev. 5, Control AU-4(1) (Transfer to Alternate Storage / Central SIEM Repository)",
        "evaluate": lambda p: "pass" if p.get("syslogServers") is not None and p.get("syslogServers") is not False else "fail",
        "remediation": {
            "cisco_ios": "logging host 10.14.5.50\nlogging trap notifications",
            "juniper_junos": "set system syslog host 10.14.5.50 any warning",
            "palo_alto_panos": "set shared log-settings syslog SIEM server 10.14.5.50 port 514",
            "sonic": "config syslog add 10.14.5.50",
            "fortinet_fortios": "config log syslogd setting\n    set status enable\n    set server \"10.14.5.50\"\nend",
            "arista_eos": "logging host 10.14.5.50"
        }
    },
    {
        "id": "NIST-AC-12",
        "title": "Session Termination - Inactivity Disconnect <= 15 Min",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-IDLE-TIMEOUT",
        "severity": "medium",
        "framework_ref": "NIST SP 800-53 Rev. 5 AC-12",
        "source_note": "NIST SP 800-53 Rev. 5, Control AC-12 (Session Termination - Inactivity Lockout)",
        "evaluate": lambda p: "pass" if 0 < p.get("sessionIdleTimeoutMinutes", 0) <= 15 else "fail",
        "remediation": {
            "cisco_ios": "line vty 0 15\n exec-timeout 10 0\nline con 0\n exec-timeout 10 0",
            "juniper_junos": "set system login idle-timeout 10",
            "palo_alto_panos": "set deviceconfig system idle-timeout 10",
            "sonic": "config ssh idle-timeout 600",
            "fortinet_fortios": "config system global\n    set admintimeout 10\nend",
            "arista_eos": "management ssh\n   idle-timeout 10"
        }
    },
    {
        "id": "NIST-AU-8",
        "title": "Time Stamps - Authoritative Stratum NTP Synchronization",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-NTP-SYNC",
        "severity": "medium",
        "framework_ref": "NIST SP 800-53 Rev. 5 AU-8(1)",
        "source_note": "NIST SP 800-53 Rev. 5, Control AU-8(1) (Synchronization with Authoritative Time Source)",
        "evaluate": lambda p: "pass" if p.get("ntpConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "ntp server 10.14.0.1 prefer\nntp authenticate",
            "juniper_junos": "set system ntp server 10.14.0.1 prefer",
            "palo_alto_panos": "set deviceconfig system ntp-servers primary-ntp-server 10.14.0.1",
            "sonic": "config ntp add 10.14.0.1",
            "fortinet_fortios": "config system ntp\n    set ntpsync enable\n    set type custom\nend",
            "arista_eos": "ntp server 10.14.0.1 prefer"
        }
    },
    {
        "id": "NIST-AC-8",
        "title": "System Use Notification - Legal Advisory Banner",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-LOGIN-BANNER",
        "severity": "low",
        "framework_ref": "NIST SP 800-53 Rev. 5 AC-8",
        "source_note": "NIST SP 800-53 Rev. 5, Control AC-8 (System Use Notification - Advisory Banner)",
        "evaluate": lambda p: "pass" if p.get("loginBannerConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "banner login ^C\nUS GOVERNMENT SYSTEM - AUTHORIZED ACCESS ONLY\n^C",
            "juniper_junos": "set system login message \"US GOVERNMENT SYSTEM - AUTHORIZED ACCESS ONLY\"",
            "palo_alto_panos": "set deviceconfig system login-banner \"US GOVERNMENT SYSTEM - AUTHORIZED ACCESS ONLY\"",
            "sonic": "config banner login \"US GOVERNMENT SYSTEM - AUTHORIZED ACCESS ONLY\"",
            "fortinet_fortios": "config system global\n    set pre-login-banner enable\nend",
            "arista_eos": "banner login\nUS GOVERNMENT SYSTEM - AUTHORIZED ACCESS ONLY\nEOF"
        }
    },

    # ─── DISA STIG Controls ───
    {
        "id": "STIG-NET-0001",
        "title": "DoD STIG: Prohibit Unencrypted Clear-Text Telnet Protocol",
        "framework": "disa_stig",
        "control_group_id": "CTRL-TELNET-OFF",
        "severity": "critical",
        "cat_rating": "CAT I",
        "framework_ref": "DISA STIG Rule SV-216960r856276_rule (SRG-NET-000018-RTR-000002)",
        "source_note": "DISA Cisco Router STIG V-216960, CISC-RT-000010 (CAT I Finding)",
        "evaluate": lambda p: "pass" if p.get("telnetEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "line vty 0 15\n transport input ssh\n no transport input telnet",
            "juniper_junos": "delete system services telnet",
            "palo_alto_panos": "set deviceconfig system service disable-telnet yes",
            "sonic": "systemctl mask --now telnet.socket",
            "fortinet_fortios": "config system interface\n    edit \"port1\"\n        set allowaccess ping https ssh\n    next\nend",
            "arista_eos": "no management telnet"
        }
    },
    {
        "id": "STIG-NET-0002",
        "title": "DoD STIG: Prohibit Clear-Text Web Management (HTTP)",
        "framework": "disa_stig",
        "control_group_id": "CTRL-HTTP-OFF",
        "severity": "critical",
        "cat_rating": "CAT I",
        "framework_ref": "DISA STIG Rule SV-216960r856276_rule (SRG-NET-000018-RTR-000002)",
        "source_note": "DISA Cisco Router STIG V-216960, CISC-RT-000010 (CAT I Finding)",
        "evaluate": lambda p: "pass" if p.get("httpServerEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "no ip http server\nip http secure-server",
            "juniper_junos": "delete system services web-management http\nset system services web-management https",
            "palo_alto_panos": "set deviceconfig system service disable-http yes",
            "sonic": "systemctl stop nginx-http && systemctl disable nginx-http",
            "fortinet_fortios": "config system global\n    set admin-https-redirect enable\nend",
            "arista_eos": "no management api http-commands protocol http"
        }
    },
    {
        "id": "STIG-NET-0003",
        "title": "DoD STIG: Enforce SSHv2 Protocol Exclusively",
        "framework": "disa_stig",
        "control_group_id": "CTRL-SSH-V2",
        "severity": "high",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-216959r856275_rule (SRG-NET-000018-RTR-000001)",
        "source_note": "DISA Cisco Router STIG V-216959, CISC-RT-000020 (CAT II Finding)",
        "evaluate": lambda p: "pass" if p.get("sshVersion", 0) >= 2 else "fail",
        "remediation": {
            "cisco_ios": "ip ssh version 2\nip ssh dh-group min 14",
            "juniper_junos": "set system services ssh protocol-version v2",
            "palo_alto_panos": "set deviceconfig system ssh ciphers mgmt [ aes256-gcm aes256-ctr ]",
            "sonic": "sonic-cli -c \"configure terminal ; ip ssh version 2\"",
            "fortinet_fortios": "config system global\n    set admin-ssh-v1 disable\n    set strong-crypto enable\nend",
            "arista_eos": "management ssh\n   protocol-version 2"
        }
    },
    {
        "id": "STIG-NET-0004",
        "title": "DoD STIG: Cryptographic Local Password Storage",
        "framework": "disa_stig",
        "control_group_id": "CTRL-PASS-ENCRYPT",
        "severity": "high",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-216975r856291_rule (SRG-NET-000168-RTR-000078)",
        "source_note": "DISA Cisco Router STIG V-216975, CISC-RT-000240 (CAT II Finding)",
        "evaluate": lambda p: "pass" if p.get("passwordEncryptionEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "service password-encryption",
            "juniper_junos": "set system login password-format sha512",
            "palo_alto_panos": "set mgt-config users secadmin password",
            "sonic": "passwd -e admin",
            "fortinet_fortios": "config system global\n    set strong-crypto enable\nend",
            "arista_eos": "service password-encryption"
        }
    },
    {
        "id": "STIG-NET-0005",
        "title": "DoD STIG: Centralized TACACS+/RADIUS Authorization",
        "framework": "disa_stig",
        "control_group_id": "CTRL-AAA-AUTH",
        "severity": "high",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-216957r856273_rule (SRG-NET-000015-RTR-000001)",
        "source_note": "DISA Cisco Router STIG V-216957, CISC-RT-000030 (CAT II Finding)",
        "evaluate": lambda p: "pass" if p.get("aaaAuthEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "aaa new-model\naaa authentication login default group tacacs+ local\naaa authorization exec default group tacacs+ local",
            "juniper_junos": "set system authentication-order [ tacplus radius password ]",
            "palo_alto_panos": "set shared authentication-profile TACACS-AUTH method tacacs-plus",
            "sonic": "config aaa authentication login tacacs+ local",
            "fortinet_fortios": "config user tacacs+\n    edit \"dod_tacacs\"\n        set server \"10.14.5.10\"\n    next\nend",
            "arista_eos": "aaa new-model\naaa authentication login default group tacacs+ local"
        }
    },
    {
        "id": "STIG-NET-0006",
        "title": "DoD STIG: Enforce SNMPv3 with AuthPriv Cryptography",
        "framework": "disa_stig",
        "control_group_id": "CTRL-SNMP-V3",
        "severity": "high",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-216965r856281_rule (SRG-NET-000131-RTR-000035)",
        "source_note": "DISA Cisco Router STIG V-216965, CISC-RT-000200 (CAT II Finding)",
        "evaluate": lambda p: "pass" if p.get("snmpVersion") == "v3" else "fail",
        "remediation": {
            "cisco_ios": "no snmp-server community public\nsnmp-server group STIG_GRP v3 priv\nsnmp-server user stigadmin STIG_GRP v3 auth sha <key> priv aes 256 <key>",
            "juniper_junos": "delete snmp community\nset snmp v3 usm local-engine user stigadmin authentication-sha",
            "palo_alto_panos": "set deviceconfig system snmp-setting snmp-version-v3 user stigadmin authpwd <pwd> privpwd <pwd>",
            "sonic": "config snmp user add stigadmin SHA <key> AES <key>",
            "fortinet_fortios": "config system snmp user\n    edit \"stigadmin\"\n        set security-level auth-priv\n    next\nend",
            "arista_eos": "snmp-server group STIG_GRP v3 priv"
        }
    },
    {
        "id": "STIG-NET-0007",
        "title": "DoD STIG: Forward Security Events to Centralized SIEM",
        "framework": "disa_stig",
        "control_group_id": "CTRL-SYSLOG-SIEM",
        "severity": "high",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-216970r856286_rule (SRG-NET-000333-RTR-000098)",
        "source_note": "DISA Cisco Router STIG V-216970, CISC-RT-000100 (CAT II Finding)",
        "evaluate": lambda p: "pass" if p.get("syslogServers") is not None and p.get("syslogServers") is not False else "fail",
        "remediation": {
            "cisco_ios": "logging host 10.14.5.50\nlogging trap notifications\nlogging facility local6",
            "juniper_junos": "set system syslog host 10.14.5.50 any warning facility-override local5",
            "palo_alto_panos": "set shared log-settings syslog DOD-SIEM server 10.14.5.50 port 514",
            "sonic": "config syslog add 10.14.5.50",
            "fortinet_fortios": "config log syslogd setting\n    set status enable\n    set server \"10.14.5.50\"\nend",
            "arista_eos": "logging host 10.14.5.50"
        }
    },
    {
        "id": "STIG-NET-0008",
        "title": "DoD STIG: Terminate Inactive Sessions Within 10-15 Minutes",
        "framework": "disa_stig",
        "control_group_id": "CTRL-IDLE-TIMEOUT",
        "severity": "medium",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-216962r856278_rule (SRG-NET-000113-RTR-000027)",
        "source_note": "DISA Cisco Router STIG V-216962, CISC-RT-000060 (CAT II Finding)",
        "evaluate": lambda p: "pass" if 0 < p.get("sessionIdleTimeoutMinutes", 0) <= 15 else "fail",
        "remediation": {
            "cisco_ios": "line con 0\n exec-timeout 10 0\nline vty 0 15\n exec-timeout 10 0",
            "juniper_junos": "set system login idle-timeout 10",
            "palo_alto_panos": "set deviceconfig system idle-timeout 10",
            "sonic": "config ssh idle-timeout 600",
            "fortinet_fortios": "config system global\n    set admintimeout 10\nend",
            "arista_eos": "management ssh\n   idle-timeout 10"
        }
    },
    {
        "id": "STIG-NET-0009",
        "title": "DoD STIG: Synchronize Clocks to Designated DoD Time Server",
        "framework": "disa_stig",
        "control_group_id": "CTRL-NTP-SYNC",
        "severity": "low",
        "cat_rating": "CAT III",
        "framework_ref": "DISA STIG Rule SV-216972r856288_rule (SRG-NET-000168-RTR-000077)",
        "source_note": "DISA Cisco Router STIG V-216972, CISC-RT-000110 (CAT III Finding)",
        "evaluate": lambda p: "pass" if p.get("ntpConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "ntp server 10.14.0.1 prefer\nntp server 10.14.0.2",
            "juniper_junos": "set system ntp server 10.14.0.1 prefer",
            "palo_alto_panos": "set deviceconfig system ntp-servers primary-ntp-server 10.14.0.1",
            "sonic": "config ntp add 10.14.0.1",
            "fortinet_fortios": "config system ntp\n    set ntpsync enable\n    set type custom\nend",
            "arista_eos": "ntp server 10.14.0.1 prefer"
        }
    },
    {
        "id": "STIG-NET-0010",
        "title": "DoD STIG: Mandatory Standard Notice and Consent Banner",
        "framework": "disa_stig",
        "control_group_id": "CTRL-LOGIN-BANNER",
        "severity": "medium",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-216964r856280_rule (SRG-NET-000041-RTR-000008)",
        "source_note": "DISA Cisco Router STIG V-216964, CISC-RT-000050 (CAT II Finding)",
        "evaluate": lambda p: "pass" if p.get("loginBannerConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "banner login ^C\nYou are accessing a U.S. Government Information System provided for USG-authorized use only.\n^C",
            "juniper_junos": "set system login message \"You are accessing a U.S. Government Information System provided for USG-authorized use only.\"",
            "palo_alto_panos": "set deviceconfig system login-banner \"You are accessing a U.S. Government Information System provided for USG-authorized use only.\"",
            "sonic": "config banner login \"You are accessing a U.S. Government Information System provided for USG-authorized use only.\"",
            "fortinet_fortios": "config system global\n    set pre-login-banner enable\nend",
            "arista_eos": "banner login\nYou are accessing a U.S. Government Information System provided for USG-authorized use only.\nEOF"
        }
    },

    # ─── ISO/IEC 27001:2022 Controls ───
    {
        "id": "ISO-A.8.20",
        "title": "Network Controls: Mandate Encrypted Transport (SSHv2)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-SSH-V2",
        "severity": "critical",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.20",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.20 (Network Security - Remote Management Encryption)",
        "evaluate": lambda p: "pass" if p.get("sshVersion", 0) >= 2 else "fail",
        "remediation": {
            "cisco_ios": "ip ssh version 2",
            "juniper_junos": "set system services ssh protocol-version v2",
            "palo_alto_panos": "set deviceconfig system ssh ciphers mgmt [ aes256-gcm aes256-ctr ]",
            "sonic": "sonic-cli -c \"config ssh protocol 2\"",
            "fortinet_fortios": "config system global\n    set admin-ssh-v1 disable\n    set strong-crypto enable\nend",
            "arista_eos": "management ssh\n   protocol-version 2"
        }
    },
    {
        "id": "ISO-A.8.21",
        "title": "Security of Network Services: Disable Clear-Text Protocols (Telnet)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-TELNET-OFF",
        "severity": "critical",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.21",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.21 (Security of Network Services - Disable Insecure Protocols)",
        "evaluate": lambda p: "pass" if p.get("telnetEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "line vty 0 15\n transport input ssh\n no transport input telnet",
            "juniper_junos": "delete system services telnet",
            "palo_alto_panos": "set deviceconfig system service disable-telnet yes",
            "sonic": "systemctl mask --now telnet.socket",
            "fortinet_fortios": "config system interface\n    edit \"port1\"\n        set allowaccess ping https ssh\n    next\nend",
            "arista_eos": "no management telnet"
        }
    },
    {
        "id": "ISO-A.8.9",
        "title": "Configuration Management: Terminate Clear-Text Web Interfaces",
        "framework": "iso_27001",
        "control_group_id": "CTRL-HTTP-OFF",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.9",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.9 (Configuration Management - Secure Baseline Hardening)",
        "evaluate": lambda p: "pass" if p.get("httpServerEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "no ip http server\nip http secure-server",
            "juniper_junos": "delete system services web-management http\nset system services web-management https",
            "palo_alto_panos": "set deviceconfig system service disable-http yes",
            "sonic": "systemctl stop nginx-http && systemctl disable nginx-http",
            "fortinet_fortios": "config system global\n    set admin-https-redirect enable\nend",
            "arista_eos": "no management api http-commands protocol http"
        }
    },
    {
        "id": "ISO-A.8.24-PASS",
        "title": "Use of Cryptography: Local Credential Storage Encryption",
        "framework": "iso_27001",
        "control_group_id": "CTRL-PASS-ENCRYPT",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.24",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.24 (Use of Cryptography - Credential Storage)",
        "evaluate": lambda p: "pass" if p.get("passwordEncryptionEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "service password-encryption",
            "juniper_junos": "set system login password-format sha512",
            "palo_alto_panos": "set mgt-config users secadmin password",
            "sonic": "passwd -e admin",
            "fortinet_fortios": "config system global\n    set strong-crypto enable\nend",
            "arista_eos": "service password-encryption"
        }
    },
    {
        "id": "ISO-A.8.5",
        "title": "Secure Authentication: Enforce Centralized AAA Access Control",
        "framework": "iso_27001",
        "control_group_id": "CTRL-AAA-AUTH",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.5",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.5 (Secure Authentication - Centralized Directory Services)",
        "evaluate": lambda p: "pass" if p.get("aaaAuthEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "aaa new-model\naaa authentication login default group tacacs+ local\naaa authorization exec default group tacacs+ local",
            "juniper_junos": "set system authentication-order [ tacplus radius password ]",
            "palo_alto_panos": "set shared authentication-profile TACACS-AUTH method tacacs-plus",
            "sonic": "config aaa authentication login tacacs+ local",
            "fortinet_fortios": "config user tacacs+\n    edit \"iso_tacacs\"\n        set server \"10.14.5.10\"\n    next\nend",
            "arista_eos": "aaa new-model\naaa authentication login default group tacacs+ local"
        }
    },
    {
        "id": "ISO-A.8.24-SNMP",
        "title": "Use of Cryptography: Mandate Secure SNMPv3 Authentication",
        "framework": "iso_27001",
        "control_group_id": "CTRL-SNMP-V3",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.24",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.24 (Use of Cryptography - Management Protocols)",
        "evaluate": lambda p: "pass" if p.get("snmpVersion") == "v3" else "fail",
        "remediation": {
            "cisco_ios": "no snmp-server community public\nsnmp-server group ISO_GRP v3 priv\nsnmp-server user isooper ISO_GRP v3 auth sha <key> priv aes 128 <key>",
            "juniper_junos": "delete snmp community\nset snmp v3 usm local-engine user isooper authentication-sha",
            "palo_alto_panos": "set deviceconfig system snmp-setting snmp-version-v3 user isooper authpwd <pwd> privpwd <pwd>",
            "sonic": "config snmp user add isooper SHA <key> AES <key>",
            "fortinet_fortios": "config system snmp user\n    edit \"isooper\"\n        set security-level auth-priv\n    next\nend",
            "arista_eos": "snmp-server group ISO_GRP v3 auth"
        }
    },
    {
        "id": "ISO-A.8.15",
        "title": "Logging: Forward Network Security Events to Tamper-Resistant SIEM",
        "framework": "iso_27001",
        "control_group_id": "CTRL-SYSLOG-SIEM",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.15",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.15 (Logging - Centralized Collection & Monitoring)",
        "evaluate": lambda p: "pass" if p.get("syslogServers") is not None and p.get("syslogServers") is not False else "fail",
        "remediation": {
            "cisco_ios": "logging host 10.14.5.50\nlogging trap notifications\nlogging facility local6",
            "juniper_junos": "set system syslog host 10.14.5.50 any warning facility-override local5",
            "palo_alto_panos": "set shared log-settings syslog ISO-SIEM server 10.14.5.50 port 514",
            "sonic": "config syslog add 10.14.5.50",
            "fortinet_fortios": "config log syslogd setting\n    set status enable\n    set server \"10.14.5.50\"\nend",
            "arista_eos": "logging host 10.14.5.50"
        }
    },
    {
        "id": "ISO-A.5.15-IDLE",
        "title": "Access Control: Automatically Terminate Inactive Sessions",
        "framework": "iso_27001",
        "control_group_id": "CTRL-IDLE-TIMEOUT",
        "severity": "medium",
        "framework_ref": "ISO/IEC 27001:2022 Control A.5.15",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.5.15 (Access Control - Session Inactivity Lockout)",
        "evaluate": lambda p: "pass" if 0 < p.get("sessionIdleTimeoutMinutes", 0) <= 15 else "fail",
        "remediation": {
            "cisco_ios": "line con 0\n exec-timeout 10 0\nline vty 0 15\n exec-timeout 10 0",
            "juniper_junos": "set system login idle-timeout 10",
            "palo_alto_panos": "set deviceconfig system idle-timeout 10",
            "sonic": "config ssh idle-timeout 600",
            "fortinet_fortios": "config system global\n    set admintimeout 10\nend",
            "arista_eos": "management ssh\n   idle-timeout 10"
        }
    },
    {
        "id": "ISO-A.8.17",
        "title": "Clock Synchronization: Synchronize with Authoritative NTP Sources",
        "framework": "iso_27001",
        "control_group_id": "CTRL-NTP-SYNC",
        "severity": "medium",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.17",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.17 (Clock Synchronization)",
        "evaluate": lambda p: "pass" if p.get("ntpConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "ntp server 10.14.0.1 prefer\nntp server 10.14.0.2",
            "juniper_junos": "set system ntp server 10.14.0.1 prefer",
            "palo_alto_panos": "set deviceconfig system ntp-servers primary-ntp-server 10.14.0.1",
            "sonic": "config ntp add 10.14.0.1",
            "fortinet_fortios": "config system ntp\n    set ntpsync enable\n    set type custom\nend",
            "arista_eos": "ntp server 10.14.0.1 prefer"
        }
    },
    {
        "id": "ISO-A.5.15-BANNER",
        "title": "Access Control: Authorized Notice and Login Banner",
        "framework": "iso_27001",
        "control_group_id": "CTRL-LOGIN-BANNER",
        "severity": "low",
        "framework_ref": "ISO/IEC 27001:2022 Control A.5.15",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.5.15 (Access Control - Advisory Warning Notice)",
        "evaluate": lambda p: "pass" if p.get("loginBannerConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "banner login ^C\nAUTHORIZED USERS ONLY - ALL ACCESS MONITORED\n^C",
            "juniper_junos": "set system login message \"AUTHORIZED USERS ONLY - ALL ACCESS MONITORED\"",
            "palo_alto_panos": "set deviceconfig system login-banner \"AUTHORIZED USERS ONLY - ALL ACCESS MONITORED\"",
            "sonic": "config banner login \"AUTHORIZED USERS ONLY - ALL ACCESS MONITORED\"",
            "fortinet_fortios": "config system global\n    set pre-login-banner enable\nend",
            "arista_eos": "banner login\nAUTHORIZED USERS ONLY - ALL ACCESS MONITORED\nEOF"
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
        remediation_cmd = rule["remediation"].get(vendor, rule["remediation"].get("cisco_ios", "Consult vendor guide"))
        
        # Pull exact line evidence if available based on control group ID or title
        ev_lines = []
        cg = rule.get("control_group_id", "")
        if (cg == "CTRL-SSH-V2" or "SSH" in rule["title"]) and "sshVersion" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["sshVersion"]]
        elif (cg == "CTRL-TELNET-OFF" or "Telnet" in rule["title"]) and "telnetEnabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["telnetEnabled"]]
        elif (cg == "CTRL-HTTP-OFF" or "HTTP" in rule["title"]) and "httpServerEnabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["httpServerEnabled"]]
        elif (cg == "CTRL-PASS-ENCRYPT" or "Password" in rule["title"]) and "passwordEncryptionEnabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["passwordEncryptionEnabled"]]
        elif (cg == "CTRL-AAA-AUTH" or "AAA" in rule["title"]) and "aaaAuthEnabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["aaaAuthEnabled"]]
        elif (cg == "CTRL-SNMP-V3" or "SNMP" in rule["title"]) and "snmpVersion" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["snmpVersion"]]
        elif (cg == "CTRL-SYSLOG-SIEM" or "Syslog" in rule["title"]) and "syslogServers" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["syslogServers"]]
        elif (cg == "CTRL-IDLE-TIMEOUT" or "Timeout" in rule["title"]) and "sessionIdleTimeoutMinutes" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["sessionIdleTimeoutMinutes"]]
        elif (cg == "CTRL-NTP-SYNC" or "NTP" in rule["title"]) and "ntpConfigured" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["ntpConfigured"]]
        elif (cg == "CTRL-LOGIN-BANNER" or "Banner" in rule["title"]) and "loginBannerConfigured" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["loginBannerConfigured"]]

        findings.append(Finding(
            rule_id=rule["id"],
            rule_title=rule["title"],
            framework=rule["framework"],
            control_group_id=rule.get("control_group_id"),
            severity=rule["severity"],
            cat_rating=rule.get("cat_rating"),
            source_note=rule.get("source_note"),
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
