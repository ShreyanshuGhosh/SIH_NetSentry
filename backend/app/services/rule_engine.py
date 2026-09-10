from typing import Dict, Any, List, Tuple
from app.schemas.canonical import Finding, AuditSummary, LineEvidence

# Canonical Rules Catalog with Control Group IDs for multi-framework deduplication
# Total rules: 96 (24 controls × 4 frameworks)
RULES_CATALOG = [
    # ─── CIS Controls v8 ───
    {
        "id": "CIS-NET-1.1.1",
        "title": "Enforce SSHv2 Protocol Exclusively",
        "framework": "cis_v8",
        "control_group_id": "CTRL-SSH-V2",
        "severity": "critical",
        "framework_ref": "CIS Controls v8 Safeguard 12.6",
        "source_note": "CIS Controls v8, Safeguard 12.6 (Use Secure Network Management Protocols - SSHv2)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("sshVersion", 0) >= 2 else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nip ssh version 2\nend\nwrite memory",
            "juniper_junos": "set system services ssh protocol-version v2\ncommit and-quit",
            "palo_alto_panos": "set deviceconfig system ssh ciphers mgmt [ aes256-gcm aes256-ctr ]\ncommit",
            "sonic": "sonic-cli -c \"configure terminal ; ip ssh version 2\"",
            "fortinet_fortios": "config system global\nset admin-ssh-v1 disable\nset strong-crypto enable\nend",
            "arista_eos": "configure\nmanagement ssh\nprotocol version 2\nexit\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-1.1.2",
        "title": "Disable Insecure Telnet Daemon",
        "framework": "cis_v8",
        "control_group_id": "CTRL-TELNET-OFF",
        "severity": "critical",
        "framework_ref": "CIS Controls v8 Safeguard 4.8 / 12.6",
        "source_note": "CIS Controls v8, Safeguards 4.8 & 12.6 (Disable Unnecessary Cleartext Services - Telnet)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("telnetEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nline vty 0 15\ntransport input ssh\nend\nwrite memory",
            "juniper_junos": "delete system services telnet\ncommit and-quit",
            "palo_alto_panos": "set deviceconfig system service disable-telnet yes\ncommit",
            "sonic": "systemctl mask --now telnet.socket",
            "fortinet_fortios": "config system interface\nedit \"port1\"\nset allowaccess https ssh ping\nnext\nend",
            "arista_eos": "configure\nno management telnet\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-1.1.3",
        "title": "Disable Plaintext HTTP Web Management",
        "framework": "cis_v8",
        "control_group_id": "CTRL-HTTP-OFF",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 4.8 / 12.6",
        "source_note": "CIS Controls v8, Safeguards 4.8 & 12.6 (Disable Insecure Web Management - Mandate HTTPS)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("httpServerEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno ip http server\nip http secure-server\nend\nwrite memory",
            "juniper_junos": "delete system services web-management http\nset system services web-management https port 443\ncommit",
            "palo_alto_panos": "set deviceconfig system service disable-http yes\ncommit",
            "sonic": "systemctl stop nginx-http && systemctl disable nginx-http",
            "fortinet_fortios": "config system global\nset admin-https-redirect enable\nend",
            "arista_eos": "configure\nno management api http-commands\nprotocol https\nexit\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-1.1.4",
        "title": "Enforce Strong Local Password Encryption",
        "framework": "cis_v8",
        "control_group_id": "CTRL-PASS-ENCRYPT",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 5.2 / 3.11",
        "source_note": "CIS Controls v8, Safeguards 5.2 & 3.11 (Secure Local Credential Storage - PBKDF2/SHA-512)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("passwordEncryptionEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nservice password-encryption\nend\nwrite memory",
            "juniper_junos": "set system login password-format sha512\ncommit",
            "palo_alto_panos": "set mgt-config users secadmin password\ncommit",
            "sonic": "passwd -e admin",
            "fortinet_fortios": "config system global\nset strong-crypto enable\nend",
            "arista_eos": "configure\nservice password-encryption\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-1.2.1",
        "title": "Centralized AAA Authentication Enforcement",
        "framework": "cis_v8",
        "control_group_id": "CTRL-AAA-AUTH",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 12.5",
        "source_note": "CIS Controls v8, Safeguard 12.5 (Centralize Network AAA Infrastructure)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("aaaAuthEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\naaa new-model\naaa authentication login default group tacacs+ local\nend\nwrite memory",
            "juniper_junos": "set system authentication-order [ tacplus radius password ]\ncommit",
            "palo_alto_panos": "set shared authentication-profile TACACS-AUTH method tacacs-plus\ncommit",
            "sonic": "config aaa authentication login tacacs+ local",
            "fortinet_fortios": "config user tacacs+\nedit \"tacacs_srv\"\nset server \"10.14.5.10\"\nnext\nend",
            "arista_eos": "configure\naaa new-model\naaa authentication login default group tacacs+ local\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-1.2.2",
        "title": "SNMP Protocol Restricted to v3 authPriv",
        "framework": "cis_v8",
        "control_group_id": "CTRL-SNMP-V3",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 4.8",
        "source_note": "CIS Controls v8, Safeguard 4.8 (Uninstall or Disable Unnecessary Services - SNMPv3)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("snmpVersion") == "v3" else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno snmp-server community public\nsnmp-server group SEC_GRP v3 priv\nend\nwrite memory",
            "juniper_junos": "delete snmp community\nset snmp v3 usm local-engine user secoper authentication-sha\ncommit",
            "palo_alto_panos": "set deviceconfig system snmp-setting snmp-version-v3\ncommit",
            "sonic": "config snmp user add secoper SHA <authkey> AES <privkey>",
            "fortinet_fortios": "config system snmp user\nedit \"secoper\"\nset security-level auth-priv\nnext\nend",
            "arista_eos": "configure\nsnmp-server group SEC_GRP v3 auth\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-1.3.1",
        "title": "Remote Syslog Collection & Forwarding",
        "framework": "cis_v8",
        "control_group_id": "CTRL-SYSLOG-SIEM",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 8.2",
        "source_note": "CIS Controls v8, Safeguard 8.2 (Collect Audit Logs - Centralized Syslog)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("syslogServers") is not None else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nlogging host 10.14.5.50\nlogging trap notifications\nend\nwrite memory",
            "juniper_junos": "set system syslog host 10.14.5.50 any warning facility-override local5\ncommit",
            "palo_alto_panos": "set shared log-settings syslog SIEM server 10.14.5.50 port 514\ncommit",
            "sonic": "config syslog add 10.14.5.50",
            "fortinet_fortios": "config log syslogd setting\nset status enable\nset server \"10.14.5.50\"\nend",
            "arista_eos": "configure\nlogging host 10.14.5.50\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-1.4.1",
        "title": "Administrative Inactivity Session Disconnect (≤ 15 min)",
        "framework": "cis_v8",
        "control_group_id": "CTRL-IDLE-TIMEOUT",
        "severity": "medium",
        "framework_ref": "CIS Controls v8 Safeguard 4.11",
        "source_note": "CIS Controls v8, Safeguard 4.11 (Enforce Inactive Session Timeout - 15 Minutes)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("sessionIdleTimeoutMinutes") is not None and int(p.get("sessionIdleTimeoutMinutes", 999)) <= 15 else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nline con 0\nexec-timeout 10 0\nline vty 0 15\nexec-timeout 10 0\nend\nwrite memory",
            "juniper_junos": "set system login idle-timeout 10\ncommit",
            "palo_alto_panos": "set deviceconfig system idle-timeout 10\ncommit",
            "sonic": "config ssh idle-timeout 600",
            "fortinet_fortios": "config system global\nset admintimeout 10\nend",
            "arista_eos": "configure\nmanagement ssh\nidle-timeout 10\nexit\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-1.5.1",
        "title": "Authoritative NTP Clock Synchronization",
        "framework": "cis_v8",
        "control_group_id": "CTRL-NTP-SYNC",
        "severity": "medium",
        "framework_ref": "CIS Controls v8 Safeguard 8.4",
        "source_note": "CIS Controls v8, Safeguard 8.4 (Standardize Time Synchronization - NTP)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("ntpConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nntp server 10.14.0.1 prefer\nntp authenticate\nend\nwrite memory",
            "juniper_junos": "set system ntp server 10.14.0.1 prefer\ncommit",
            "palo_alto_panos": "set deviceconfig system ntp-servers primary-ntp-server 10.14.0.1\ncommit",
            "sonic": "config ntp add 10.14.0.1",
            "fortinet_fortios": "config system ntp\nset ntpsync enable\nset type custom\nend",
            "arista_eos": "configure\nntp server 10.14.0.1 prefer\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-1.6.1",
        "title": "Authorized Login Notice / Banner Configuration",
        "framework": "cis_v8",
        "control_group_id": "CTRL-LOGIN-BANNER",
        "severity": "low",
        "framework_ref": "CIS Controls v8 Safeguard 4.1",
        "source_note": "CIS Controls v8, Safeguard 4.1 (Establish and Maintain a Secure Configuration Baseline - Advisory Banner)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("loginBannerConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nbanner login ^C\nRESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\n^C\nend\nwrite memory",
            "juniper_junos": "set system login message \"RESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\"\ncommit",
            "palo_alto_panos": "set deviceconfig system login-banner \"RESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\"\ncommit",
            "sonic": "config banner login \"RESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\"",
            "fortinet_fortios": "config system global\nset pre-login-banner enable\nend",
            "arista_eos": "configure\nbanner login\nRESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\nEOF\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-2.1.1",
        "title": "Disable Insecure ICMP Redirects",
        "framework": "cis_v8",
        "control_group_id": "CTRL-ICMP-REDIRECTS",
        "severity": "medium",
        "framework_ref": "CIS Controls v8 Safeguard 12.1",
        "source_note": "CIS Controls v8, Safeguard 12.1 (Ensure Network Infrastructure is Kept Up to Date - Disable ICMP Redirects)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("icmpRedirectsDisabled") is True or p.get("icmp_redirects_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno ip icmp redirect\ninterface range Gi0/0 - 3\nno ip redirects\nend\nwrite memory",
            "juniper_junos": "set system no-redirects\ncommit and-quit",
            "palo_alto_panos": "set network profiles zone-protection-profile REJECT-REDIRECTS icmp-drop yes\ncommit",
            "sonic": "sysctl -w net.ipv4.conf.all.send_redirects=0 net.ipv4.conf.default.send_redirects=0",
            "fortinet_fortios": "config system global\nset icmp-send-redirect disable\nend",
            "arista_eos": "configure\nno ip icmp redirect\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-2.1.2",
        "title": "Disable Proxy ARP on Network Interfaces",
        "framework": "cis_v8",
        "control_group_id": "CTRL-PROXY-ARP",
        "severity": "medium",
        "framework_ref": "CIS Controls v8 Safeguard 12.1",
        "source_note": "CIS Controls v8, Safeguard 12.1 (Ensure Network Infrastructure is Kept Up to Date - Disable Proxy ARP)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("proxyArpDisabled") is True or p.get("proxy_arp_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\ninterface range Gi0/0 - 3\nno ip proxy-arp\nend\nwrite memory",
            "juniper_junos": "set interfaces ge-0/0/0 unit 0 family inet no-proxy-arp\ncommit",
            "palo_alto_panos": "set network interface ethernet ethernet1/1 layer3 arp-proxy-enabled no\ncommit",
            "sonic": "sysctl -w net.ipv4.conf.all.proxy_arp=0",
            "fortinet_fortios": "config system proxy-arp\npurge\nend",
            "arista_eos": "configure\nno ip proxy-arp\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-2.1.3",
        "title": "Disable IP Source Routing",
        "framework": "cis_v8",
        "control_group_id": "CTRL-SOURCE-ROUTE",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 12.1",
        "source_note": "CIS Controls v8, Safeguard 12.1 (Disable IP Source Routing)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("ipSourceRoutingDisabled") is True or p.get("ip_source_routing_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno ip source-route\nend\nwrite memory",
            "juniper_junos": "set system no-ip-source-routing\ncommit",
            "palo_alto_panos": "set deviceconfig setting tcp ip-drop-source-routed yes\ncommit",
            "sonic": "sysctl -w net.ipv4.conf.all.accept_source_route=0",
            "fortinet_fortios": "config system global\nset ip-src-routing disable\nend",
            "arista_eos": "configure\nno ip source-route\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-2.1.4",
        "title": "Disable IP Directed Broadcasts (Smurf Mitigation)",
        "framework": "cis_v8",
        "control_group_id": "CTRL-DIRECTED-BROADCAST",
        "severity": "medium",
        "framework_ref": "CIS Controls v8 Safeguard 12.1",
        "source_note": "CIS Controls v8, Safeguard 12.1 (Disable IP Directed Broadcasts)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("directedBroadcastDisabled") is True or p.get("directed_broadcast_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\ninterface range Gi0/0 - 3\nno ip directed-broadcast\nend\nwrite memory",
            "juniper_junos": "set system no-directed-broadcasts\ncommit",
            "palo_alto_panos": "set network profiles zone-protection-profile DROP-BCAST directed-broadcast-drop yes\ncommit",
            "sonic": "sysctl -w net.ipv4.icmp_echo_ignore_broadcasts=1",
            "fortinet_fortios": "config system interface\nedit port1\nset broadcast-forward disable\nnext\nend",
            "arista_eos": "configure\nno ip directed-broadcast\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-2.2.1",
        "title": "Disable Insecure Link Discovery Protocols (CDP / LLDP)",
        "framework": "cis_v8",
        "control_group_id": "CTRL-DISCOVERY-PROTOCOLS",
        "severity": "medium",
        "framework_ref": "CIS Controls v8 Safeguard 12.1 / 4.8",
        "source_note": "CIS Controls v8, Safeguard 12.1 & 4.8 (Disable Link Layer Discovery Protocols)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("discoveryProtocolsDisabled") is True or p.get("discovery_protocols_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno cdp run\nno lldp run\nend\nwrite memory",
            "juniper_junos": "delete protocols lldp\ncommit",
            "palo_alto_panos": "set network interface ethernet ethernet1/1 lldp enable no\ncommit",
            "sonic": "systemctl stop lldp && systemctl disable lldp",
            "fortinet_fortios": "config system lldp\nset status disable\nend",
            "arista_eos": "configure\nno lldp run\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-2.3.1",
        "title": "Restrict VTY / Management Access via Ingress ACL",
        "framework": "cis_v8",
        "control_group_id": "CTRL-MGMT-ACL",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 12.2",
        "source_note": "CIS Controls v8, Safeguard 12.2 (Establish and Maintain a Secure Network Architecture - Ingress Filtering)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("vtyAccessClassConfigured") is True or p.get("vty_access_class_configured") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nip access-list standard MGMT-ACL\npermit 10.14.0.0 0.0.255.255\ndeny any log\nline vty 0 15\naccess-class MGMT-ACL in\nend\nwrite memory",
            "juniper_junos": "set firewall family inet filter MGMT-FILTER term ALLOW-MGMT from source-address 10.14.0.0/16\nset interfaces fxp0 unit 0 family inet filter input MGMT-FILTER\ncommit",
            "palo_alto_panos": "set deviceconfig system permitted-ip 10.14.0.0/16\ncommit",
            "sonic": "sonic-cli -c \"configure terminal ; ip access-list MGMT-VTY ; permit tcp 10.14.0.0/16 any eq 22\"",
            "fortinet_fortios": "config system admin\nedit \"admin\"\nset trusthost1 10.14.0.0 255.255.0.0\nnext\nend",
            "arista_eos": "configure\nip access-list MGMT-ACL\npermit ip 10.14.0.0/16 any\nline vty\naccess-class MGMT-ACL\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-2.4.1",
        "title": "Enforce NTP Cryptographic Authentication",
        "framework": "cis_v8",
        "control_group_id": "CTRL-NTP-AUTH",
        "severity": "medium",
        "framework_ref": "CIS Controls v8 Safeguard 8.4",
        "source_note": "CIS Controls v8, Safeguard 8.4 (Standardize Time Synchronization - NTP Cryptographic Authentication)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("ntpAuthenticated") is True or p.get("ntp_authenticated") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nntp authenticate\nntp authentication-key 1 sha1 SECRETAUTHKEY\nntp trusted-key 1\nntp server 10.14.0.1 key 1 prefer\nend\nwrite memory",
            "juniper_junos": "set system ntp authentication-key 1 type sha1 value SECRETAUTHKEY\nset system ntp trusted-key 1\nset system ntp server 10.14.0.1 key 1\ncommit",
            "palo_alto_panos": "set deviceconfig system ntp-servers primary-ntp-server authentication-type symmetric-key\ncommit",
            "sonic": "config ntp key add 1 sha1 SECRETAUTHKEY",
            "fortinet_fortios": "config system ntp\nset authentication enable\nset key-type sha1\nset key SECRETAUTHKEY\nend",
            "arista_eos": "configure\nntp authenticate\nntp authentication-key 1 sha1 SECRETAUTHKEY\nntp trusted-key 1\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-2.5.1",
        "title": "Prohibit Default Public/Private SNMP Community Strings",
        "framework": "cis_v8",
        "control_group_id": "CTRL-SNMP-COMMUNITY",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 4.8",
        "source_note": "CIS Controls v8, Safeguard 4.8 (Prohibit Default Community Strings)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("snmpDefaultCommunityDisabled") is True or p.get("snmp_default_community_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno snmp-server community public\nno snmp-server community private\nend\nwrite memory",
            "juniper_junos": "delete snmp community public\ndelete snmp community private\ncommit",
            "palo_alto_panos": "delete deviceconfig system snmp-setting snmp-version-v2c\ncommit",
            "sonic": "config snmp community del public",
            "fortinet_fortios": "config system snmp community\ndelete 1\nend",
            "arista_eos": "configure\nno snmp-server community public\nno snmp-server community private\nwrite memory",
        }
    },
    {
        "id": "CIS-NET-3.1.1",
        "title": "Dynamic TACACS+/RADIUS Server Live Reachability & Latency Verification",
        "framework": "cis_v8",
        "control_group_id": "CTRL-AAA-LIVE",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 12.5",
        "source_note": "CIS Controls v8, Safeguard 12.5 (Centralize Network AAA Infrastructure - Live Verification)",
        "infra_requirements": {
            "whyConfigInsufficient": "Static analysis can only verify that `tacacs-server host` is written in config text. It cannot verify whether the AAA daemon is actually reachable, whether TLS/mTLS sessions establish, or whether fallback-to-local lockouts occur under packet drop conditions.",
            "requiredInfrastructure": ["Active Directory / FreeIPA / Cisco ISE RADIUS cluster","Synthetic round-trip authentication prober","OOB Management Network Gateway","Health check collector daemon"],
            "syntheticProbeCommand": "echo 'test-user:$(openssl rand -hex 16)' | radtest -t pap -x synthetic-auditor 10.14.5.10 1812 1813 testing123",
            "telemetrySignal": "AAA authentication response code 2 (Access-Accept) with round-trip latency < 120ms logged in /var/log/radius.log, and Cisco ISE TACACS+ live session audit log event 5200 (Authentication Succeeded).",
            "verificationProcedure": "1. Dispatch synthetic round-trip authentication probe through the device management interface.\n2. Confirm ISE/FreeIPA cluster responds with Access-Accept within SLA (<120ms).\n3. Test primary server failure failover to secondary AAA host.\n4. Ensure fallback-to-local credential lockout triggers only upon total cluster unreachability.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "test aaa group tacacs+ secadmin password legacy\nping 10.14.5.10 source GigabitEthernet0",
            "juniper_junos": "request system radius-server test server 10.14.5.10 secret testing123 user secadmin password legacy",
            "palo_alto_panos": "test authentication authentication-profile TACACS-AUTH username secadmin password legacy",
            "sonic": "radtest -t pap secadmin legacy 10.14.5.10 1812 testing123",
            "fortinet_fortios": "diagnose test authserver tacacs+ tacacs_srv secadmin legacy",
            "arista_eos": "test aaa group tacacs+ secadmin password legacy",
        }
    },
    {
        "id": "CIS-NET-3.1.2",
        "title": "SIEM Real-Time Ingestion and Event Parsability Verification",
        "framework": "cis_v8",
        "control_group_id": "CTRL-SIEM-INGEST",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 8.2",
        "source_note": "CIS Controls v8, Safeguard 8.2 (Collect Audit Logs - Real-Time SIEM Ingestion Verification)",
        "infra_requirements": {
            "whyConfigInsufficient": "A static `logging host` entry confirms syslog destination IP in configuration, but cannot confirm if firewall transit drops UDP 514, if TLS syslog certificate validation succeeds, or if the SIEM indexer parses field extractions without schema drop.",
            "requiredInfrastructure": ["Splunk / Elastic / OpenSearch Cluster","Syslog forwarder (rsyslog / syslog-ng)","API gateway with SIEM ingest verification query access","Synthetic test event emitter"],
            "syntheticProbeCommand": "curl -s -k -u elastic:admin 'https://siem.corp.internal:9200/_search?q=host:edge-router-01+AND+@timestamp:>now-5m' | jq .hits.total.value",
            "telemetrySignal": "Syslog RFC 5424 structured event containing device hostname, facility 16 (local0), severity 4, indexed into Elasticsearch index 'syslog-network-*' with zero parse exceptions within 60 seconds.",
            "verificationProcedure": "1. Emit synthetic high-priority syslog test frame from network device.\n2. Query SIEM REST API within 60 seconds to verify document ingestion.\n3. Validate parsed fields: timestamp, host, process_id, severity, and raw payload.\n4. Trigger alert pipeline test to confirm SIEM rule match on critical event.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "send log 1 \"APEXNET-TEST-PROBE: SIEM Connectivity Verification\"\nshow logging | include APEXNET",
            "juniper_junos": "request logger tag APEXNET message \"APEXNET-TEST-PROBE: SIEM Ingestion Test\"",
            "palo_alto_panos": "test routing fib-lookup ip 10.14.5.50\ntest management-server test-log",
            "sonic": "logger -p local0.warn \"APEXNET-TEST-PROBE: SIEM Ingestion Test\"",
            "fortinet_fortios": "diagnose log test",
            "arista_eos": "send log 1 \"APEXNET-TEST-PROBE: SIEM Connectivity Verification\"",
        }
    },
    {
        "id": "CIS-NET-3.2.1",
        "title": "Out-of-Band (OOB) Physical & Logical Management Plane Air-Gap Isolation",
        "framework": "cis_v8",
        "control_group_id": "CTRL-OOB-ISOLATION",
        "severity": "critical",
        "framework_ref": "CIS Controls v8 Safeguard 12.2",
        "source_note": "CIS Controls v8, Safeguard 12.2 (Secure Network Architecture - OOB Management Plane Isolation)",
        "infra_requirements": {
            "whyConfigInsufficient": "Static configuration statements (e.g. `interface Management0` or `vrf MGMT`) cannot prove that the physical Ethernet patch cable is not plugged into an access switch trunk, or that transit route leaks between default and management routing tables do not exist.",
            "requiredInfrastructure": ["802.1Q VLAN packet analyzer / tap prober","Independent OOB management core switch","Route leakage detector across VRF boundaries","Port boundary scanner (Nmap / Scapy)"],
            "syntheticProbeCommand": "scapy -c 'sendp(Ether()/IP(dst=\"10.14.0.1\",src=\"192.168.100.5\")/ICMP(), iface=\"eth0-prod\")'",
            "telemetrySignal": "Complete drop / zero return packets from production interfaces into the OOB VRF. NetFlow / IPFIX flow monitors must show 0 bytes transferred across VRF isolation boundary.",
            "verificationProcedure": "1. Transmit tagged test frames on production data interfaces targeted at OOB IP range.\n2. Verify router drops packets via dedicated hardware forwarding ASIC.\n3. Query routing table FIB for route leaks between VRF 'default' and VRF 'management'.\n4. Physically verify management port cabling connects strictly to air-gapped OOB switch.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "show ip route vrf MGMT\nshow run interface GigabitEthernet0 | include vrf",
            "juniper_junos": "show route table mgmt.inet.0\nshow interfaces fxp0",
            "palo_alto_panos": "show routing route virtual-router default\nshow interface management",
            "sonic": "show ip route vrf mgmt\nip link show eth0",
            "fortinet_fortios": "diagnose ip route list\nget system interface mgmt",
            "arista_eos": "show ip route vrf MGMT\nshow interfaces Management1",
        }
    },
    {
        "id": "CIS-NET-3.3.1",
        "title": "PKI Certificate Revocation List (CRL) & OCSP Responder Live Reachability",
        "framework": "cis_v8",
        "control_group_id": "CTRL-PKI-REVOCATION",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 3.11",
        "source_note": "CIS Controls v8, Safeguard 3.11 (Encrypt Sensitive Data at Rest and in Transit - PKI Revocation Checking)",
        "infra_requirements": {
            "whyConfigInsufficient": "Crypto trustpoint definitions in static config do not demonstrate that CA CRL distributions points (CDP) or OCSP responders are online, reachable, and returning unexpired revocation status within TCP timeout limits.",
            "requiredInfrastructure": ["Internal Certificate Authority (CA) CDP server","OCSP Stapling / Responder endpoint","Network-layer synthetic TLS handshaker","DNS resolver for CA FQDN resolution"],
            "syntheticProbeCommand": "openssl ocsp -issuer ca-chain.pem -cert router-mgmt.crt -url http://ocsp.pki.corp.internal:8888 -CAfile ca-root.pem",
            "telemetrySignal": "OCSP response status: 'successful', Cert Status: 'good', producedAt < 24h ago, nextUpdate in the future. Zero CRL download timeout alerts in device system diagnostics.",
            "verificationProcedure": "1. Initiate synthetic OCSP query from device management context to responder URI.\n2. Confirm responder returns valid cryptographic signature from CA trust anchor.\n3. Verify device CRL cache updates on scheduled refresh window.\n4. Test revocation handling: present revoked client cert to SSH/HTTPS daemon and verify immediate rejection.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "crypto pki crl request MY_PKI_CA\nshow crypto pki crl",
            "juniper_junos": "request security pki crl download ca-profile CA-CORP\nshow security pki crl",
            "palo_alto_panos": "test certificate-status certificate router-cert\nshow ocsp responder",
            "sonic": "curl -I http://ocsp.pki.corp.internal:8888",
            "fortinet_fortios": "diagnose vpn certificate crl list\ndiagnose vpn certificate ocsp status",
            "arista_eos": "show security pki certificate MY_CERT detail",
        }
    },
    {
        "id": "CIS-NET-3.4.1",
        "title": "Control Plane Policing (CoPP) Hardware Rate-Limiter Telemetry & Drop Monitoring",
        "framework": "cis_v8",
        "control_group_id": "CTRL-COPP-TELEMETRY",
        "severity": "high",
        "framework_ref": "CIS Controls v8 Safeguard 12.1",
        "source_note": "CIS Controls v8, Safeguard 12.1 (Ensure Network Infrastructure is Kept Up to Date - CoPP Hardware Telemetry)",
        "infra_requirements": {
            "whyConfigInsufficient": "Static policy-map configuration verifies ACL structure, but cannot verify whether TCAM hardware rate-limiter meters are successfully allocated, whether legitimate control protocols (BGP, OSPF, LACP) suffer packet drops during volume surges, or if CPU starvation occurs.",
            "requiredInfrastructure": ["SNMP / gNMI Streaming Telemetry Collector","Hardware ASIC TCAM meter monitor","Synthetic traffic generator (IXIA / Trex / Scapy)","Prometheus / Grafana network telemetry stack"],
            "syntheticProbeCommand": "gnmic -a 10.14.0.1:57400 -u admin -p ***** --insecure get --path '/interfaces/interface[name=CoPP]/state/counters'",
            "telemetrySignal": "gNMI / SNMP MIB ciscoCoPPStatsTable streaming data: CPU load <= 35%, legitimate control traffic drop rate == 0 pps, burst flood traffic dropped according to rate-limit profile.",
            "verificationProcedure": "1. Query TCAM CoPP rate-limiter hardware counters via gNMI / SNMP.\n2. Inject controlled burst of ICMP/BGP control plane packets at edge.\n3. Verify policer meters drop traffic above baseline rate threshold while CPU stays below 40%.\n4. Verify critical BGP/BFD keepalive packets maintain priority queue without drops.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "show policy-map control-plane\nshow platform hardware qfp active feature copp datapath stats",
            "juniper_junos": "show firewall filter __default_bpdu_filter__ counter\nshow system processes cpu",
            "palo_alto_panos": "show running dos-rule\nshow dos-block-meter",
            "sonic": "show copp stats",
            "fortinet_fortios": "diagnose ips anomaly status\nget system performance status",
            "arista_eos": "show copp\nshow cpu counters queue",
        }
    },
    {
        "id": "CIS-NET-3.5.1",
        "title": "Datacenter Chassis Physical Tamper & Port Security Sensor Monitoring",
        "framework": "cis_v8",
        "control_group_id": "CTRL-PHYSICAL-TAMPER",
        "severity": "medium",
        "framework_ref": "CIS Controls v8 Safeguard 1.1",
        "source_note": "CIS Controls v8, Safeguard 1.1 (Establish and Maintain a Detailed Enterprise Asset Inventory - Physical Security)",
        "infra_requirements": {
            "whyConfigInsufficient": "Physical security controls (cabinet door contact sensors, chassis intrusion micro-switches, cable tamper traps, optical port link down locks) exist physically in the facility and cannot be validated solely by examining startup-config text.",
            "requiredInfrastructure": ["BMS (Building Management System) / DCIM Platform","Chassis chassis-intrusion micro-switch sensor","Environmental telemetry probe (SNMP / Modbus)","Physical access control badge logging integration"],
            "syntheticProbeCommand": "snmpget -v3 -l authPriv -u secops -a SHA -A ***** -x AES -X ***** 10.14.0.1 1.3.6.1.4.1.9.9.43.1.1.6.1.3.1",
            "telemetrySignal": "SNMP OID chassisIntrusionStatus returns normal (1). DCIM API confirms rack door locked with optical link monitor status healthy across all active backbone trunks.",
            "verificationProcedure": "1. Query chassis intrusion OID and DCIM cabinet lock API for physical lock status.\n2. Test micro-switch trigger during scheduled maintenance window; verify alarm propagates to NOC within 5 seconds.\n3. Verify unpopulated SFP/QSFP ports have physical dust/tamper covers or admin shutdown.\n4. Correlate DCIM physical door badge logs with configuration change timestamps.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "show environment\nshow inventory\nshow logging | include CHASSIS|TAMPER",
            "juniper_junos": "show chassis environment\nshow chassis hardware",
            "palo_alto_panos": "show system environmentals\nshow system state | match chassis",
            "sonic": "show platform summary\nshow platform psustatus",
            "fortinet_fortios": "diagnose hardware sysinfo\nget system status",
            "arista_eos": "show environment all\nshow inventory",
        }
    },
    # ─── NIST SP 800-53 Rev. 5 Controls ───
    {
        "id": "NIST-AC-17",
        "title": "Remote Access Encryption Protocol (SSHv2)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-SSH-V2",
        "severity": "critical",
        "framework_ref": "NIST SP 800-53 Rev. 5 AC-17(2)",
        "source_note": "NIST SP 800-53 Rev. 5, Control AC-17(2) (Remote Access - Cryptographic Protection)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("sshVersion", 0) >= 2 else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nip ssh version 2\nend\nwrite memory",
            "juniper_junos": "set system services ssh protocol-version v2\ncommit and-quit",
            "palo_alto_panos": "set deviceconfig system ssh ciphers mgmt [ aes256-gcm aes256-ctr ]\ncommit",
            "sonic": "sonic-cli -c \"configure terminal ; ip ssh version 2\"",
            "fortinet_fortios": "config system global\nset admin-ssh-v1 disable\nset strong-crypto enable\nend",
            "arista_eos": "configure\nmanagement ssh\nprotocol version 2\nexit\nwrite memory",
        }
    },
    {
        "id": "NIST-CM-7-TELNET",
        "title": "Least Functionality (Prohibit Clear-Text Telnet)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-TELNET-OFF",
        "severity": "critical",
        "framework_ref": "NIST SP 800-53 Rev. 5 CM-7(1)",
        "source_note": "NIST SP 800-53 Rev. 5, Control CM-7(1) (Least Functionality - Periodic Review)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("telnetEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nline vty 0 15\ntransport input ssh\nend\nwrite memory",
            "juniper_junos": "delete system services telnet\ncommit and-quit",
            "palo_alto_panos": "set deviceconfig system service disable-telnet yes\ncommit",
            "sonic": "systemctl mask --now telnet.socket",
            "fortinet_fortios": "config system interface\nedit \"port1\"\nset allowaccess https ssh ping\nnext\nend",
            "arista_eos": "configure\nno management telnet\nwrite memory",
        }
    },
    {
        "id": "NIST-AC-17-HTTP",
        "title": "Remote Access (Disable Clear-Text Web Management)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-HTTP-OFF",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 AC-17(2)",
        "source_note": "NIST SP 800-53 Rev. 5, Control AC-17(2) (Remote Access - Cryptographic Protection)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("httpServerEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno ip http server\nip http secure-server\nend\nwrite memory",
            "juniper_junos": "delete system services web-management http\nset system services web-management https port 443\ncommit",
            "palo_alto_panos": "set deviceconfig system service disable-http yes\ncommit",
            "sonic": "systemctl stop nginx-http && systemctl disable nginx-http",
            "fortinet_fortios": "config system global\nset admin-https-redirect enable\nend",
            "arista_eos": "configure\nno management api http-commands\nprotocol https\nexit\nwrite memory",
        }
    },
    {
        "id": "NIST-IA-5",
        "title": "Authenticator Management (Password Hash Obfuscation)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-PASS-ENCRYPT",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 IA-5(1)",
        "source_note": "NIST SP 800-53 Rev. 5, Control IA-5(1) (Password-Based Authentication)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("passwordEncryptionEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nservice password-encryption\nend\nwrite memory",
            "juniper_junos": "set system login password-format sha512\ncommit",
            "palo_alto_panos": "set mgt-config users secadmin password\ncommit",
            "sonic": "passwd -e admin",
            "fortinet_fortios": "config system global\nset strong-crypto enable\nend",
            "arista_eos": "configure\nservice password-encryption\nwrite memory",
        }
    },
    {
        "id": "NIST-AC-2",
        "title": "Account Management (Centralized AAA Integration)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-AAA-AUTH",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 AC-2",
        "source_note": "NIST SP 800-53 Rev. 5, Control AC-2 (Account Management)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("aaaAuthEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\naaa new-model\naaa authentication login default group tacacs+ local\nend\nwrite memory",
            "juniper_junos": "set system authentication-order [ tacplus radius password ]\ncommit",
            "palo_alto_panos": "set shared authentication-profile TACACS-AUTH method tacacs-plus\ncommit",
            "sonic": "config aaa authentication login tacacs+ local",
            "fortinet_fortios": "config user tacacs+\nedit \"tacacs_srv\"\nset server \"10.14.5.10\"\nnext\nend",
            "arista_eos": "configure\naaa new-model\naaa authentication login default group tacacs+ local\nwrite memory",
        }
    },
    {
        "id": "NIST-SC-13-SNMP",
        "title": "Cryptographic Protection (SNMPv3 authPriv)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-SNMP-V3",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 SC-13",
        "source_note": "NIST SP 800-53 Rev. 5, Control SC-13 (Cryptographic Protection)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("snmpVersion") == "v3" else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno snmp-server community public\nsnmp-server group SEC_GRP v3 priv\nend\nwrite memory",
            "juniper_junos": "delete snmp community\nset snmp v3 usm local-engine user secoper authentication-sha\ncommit",
            "palo_alto_panos": "set deviceconfig system snmp-setting snmp-version-v3\ncommit",
            "sonic": "config snmp user add secoper SHA <authkey> AES <privkey>",
            "fortinet_fortios": "config system snmp user\nedit \"secoper\"\nset security-level auth-priv\nnext\nend",
            "arista_eos": "configure\nsnmp-server group SEC_GRP v3 auth\nwrite memory",
        }
    },
    {
        "id": "NIST-AU-2",
        "title": "Event Logging (Forward Audit Records to Central SIEM)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-SYSLOG-SIEM",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 AU-2",
        "source_note": "NIST SP 800-53 Rev. 5, Control AU-2 (Event Logging)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("syslogServers") is not None else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nlogging host 10.14.5.50\nlogging trap notifications\nend\nwrite memory",
            "juniper_junos": "set system syslog host 10.14.5.50 any warning facility-override local5\ncommit",
            "palo_alto_panos": "set shared log-settings syslog SIEM server 10.14.5.50 port 514\ncommit",
            "sonic": "config syslog add 10.14.5.50",
            "fortinet_fortios": "config log syslogd setting\nset status enable\nset server \"10.14.5.50\"\nend",
            "arista_eos": "configure\nlogging host 10.14.5.50\nwrite memory",
        }
    },
    {
        "id": "NIST-SC-10",
        "title": "Network Disconnect (Inactivity Session Lockout ≤ 15 min)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-IDLE-TIMEOUT",
        "severity": "medium",
        "framework_ref": "NIST SP 800-53 Rev. 5 SC-10",
        "source_note": "NIST SP 800-53 Rev. 5, Control SC-10 (Network Disconnect)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("sessionIdleTimeoutMinutes") is not None and int(p.get("sessionIdleTimeoutMinutes", 999)) <= 15 else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nline con 0\nexec-timeout 10 0\nline vty 0 15\nexec-timeout 10 0\nend\nwrite memory",
            "juniper_junos": "set system login idle-timeout 10\ncommit",
            "palo_alto_panos": "set deviceconfig system idle-timeout 10\ncommit",
            "sonic": "config ssh idle-timeout 600",
            "fortinet_fortios": "config system global\nset admintimeout 10\nend",
            "arista_eos": "configure\nmanagement ssh\nidle-timeout 10\nexit\nwrite memory",
        }
    },
    {
        "id": "NIST-AU-8",
        "title": "Time Stamps (Synchronize with Authoritative NTP Sources)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-NTP-SYNC",
        "severity": "medium",
        "framework_ref": "NIST SP 800-53 Rev. 5 AU-8(1)",
        "source_note": "NIST SP 800-53 Rev. 5, Control AU-8(1) (Time Stamps - Synchronization with Authoritative Time Source)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("ntpConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nntp server 10.14.0.1 prefer\nntp authenticate\nend\nwrite memory",
            "juniper_junos": "set system ntp server 10.14.0.1 prefer\ncommit",
            "palo_alto_panos": "set deviceconfig system ntp-servers primary-ntp-server 10.14.0.1\ncommit",
            "sonic": "config ntp add 10.14.0.1",
            "fortinet_fortios": "config system ntp\nset ntpsync enable\nset type custom\nend",
            "arista_eos": "configure\nntp server 10.14.0.1 prefer\nwrite memory",
        }
    },
    {
        "id": "NIST-AC-8",
        "title": "System Use Notification (Mandatory Login Advisory Banner)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-LOGIN-BANNER",
        "severity": "low",
        "framework_ref": "NIST SP 800-53 Rev. 5 AC-8",
        "source_note": "NIST SP 800-53 Rev. 5, Control AC-8 (System Use Notification)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("loginBannerConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nbanner login ^C\nRESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\n^C\nend\nwrite memory",
            "juniper_junos": "set system login message \"RESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\"\ncommit",
            "palo_alto_panos": "set deviceconfig system login-banner \"RESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\"\ncommit",
            "sonic": "config banner login \"RESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\"",
            "fortinet_fortios": "config system global\nset pre-login-banner enable\nend",
            "arista_eos": "configure\nbanner login\nRESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\nEOF\nwrite memory",
        }
    },
    {
        "id": "NIST-SC-7-ICMP",
        "title": "Boundary Protection (Disable Insecure ICMP Redirects)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-ICMP-REDIRECTS",
        "severity": "medium",
        "framework_ref": "NIST SP 800-53 Rev. 5 SC-7(5)",
        "source_note": "NIST SP 800-53 Rev. 5, Control SC-7(5) (Boundary Protection - Deny Subnet Path Alteration via ICMP Redirects)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("icmpRedirectsDisabled") is True or p.get("icmp_redirects_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno ip icmp redirect\ninterface range Gi0/0 - 3\nno ip redirects\nend\nwrite memory",
            "juniper_junos": "set system no-redirects\ncommit and-quit",
            "palo_alto_panos": "set network profiles zone-protection-profile REJECT-REDIRECTS icmp-drop yes\ncommit",
            "sonic": "sysctl -w net.ipv4.conf.all.send_redirects=0 net.ipv4.conf.default.send_redirects=0",
            "fortinet_fortios": "config system global\nset icmp-send-redirect disable\nend",
            "arista_eos": "configure\nno ip icmp redirect\nwrite memory",
        }
    },
    {
        "id": "NIST-SC-7-PROXYARP",
        "title": "Boundary Protection (Disable Proxy ARP)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-PROXY-ARP",
        "severity": "medium",
        "framework_ref": "NIST SP 800-53 Rev. 5 SC-7",
        "source_note": "NIST SP 800-53 Rev. 5, Control SC-7 (Boundary Protection - Prevent Subnet ARP Spoofing)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("proxyArpDisabled") is True or p.get("proxy_arp_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\ninterface range Gi0/0 - 3\nno ip proxy-arp\nend\nwrite memory",
            "juniper_junos": "set interfaces ge-0/0/0 unit 0 family inet no-proxy-arp\ncommit",
            "palo_alto_panos": "set network interface ethernet ethernet1/1 layer3 arp-proxy-enabled no\ncommit",
            "sonic": "sysctl -w net.ipv4.conf.all.proxy_arp=0",
            "fortinet_fortios": "config system proxy-arp\npurge\nend",
            "arista_eos": "configure\nno ip proxy-arp\nwrite memory",
        }
    },
    {
        "id": "NIST-SC-7-SR",
        "title": "Boundary Protection (Drop Source Routed Packets)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-SOURCE-ROUTE",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 SC-7",
        "source_note": "NIST SP 800-53 Rev. 5, Control SC-7 (Boundary Protection - Reject Loose/Strict Source Routing)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("ipSourceRoutingDisabled") is True or p.get("ip_source_routing_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno ip source-route\nend\nwrite memory",
            "juniper_junos": "set system no-ip-source-routing\ncommit",
            "palo_alto_panos": "set deviceconfig setting tcp ip-drop-source-routed yes\ncommit",
            "sonic": "sysctl -w net.ipv4.conf.all.accept_source_route=0",
            "fortinet_fortios": "config system global\nset ip-src-routing disable\nend",
            "arista_eos": "configure\nno ip source-route\nwrite memory",
        }
    },
    {
        "id": "NIST-SC-5-BROADCAST",
        "title": "Denial-of-Service Protection (Disable Directed Broadcasts)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-DIRECTED-BROADCAST",
        "severity": "medium",
        "framework_ref": "NIST SP 800-53 Rev. 5 SC-5",
        "source_note": "NIST SP 800-53 Rev. 5, Control SC-5 (Denial of Service Protection - Prohibit Amplification Vectors)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("directedBroadcastDisabled") is True or p.get("directed_broadcast_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\ninterface range Gi0/0 - 3\nno ip directed-broadcast\nend\nwrite memory",
            "juniper_junos": "set system no-directed-broadcasts\ncommit",
            "palo_alto_panos": "set network profiles zone-protection-profile DROP-BCAST directed-broadcast-drop yes\ncommit",
            "sonic": "sysctl -w net.ipv4.icmp_echo_ignore_broadcasts=1",
            "fortinet_fortios": "config system interface\nedit port1\nset broadcast-forward disable\nnext\nend",
            "arista_eos": "configure\nno ip directed-broadcast\nwrite memory",
        }
    },
    {
        "id": "NIST-CM-7-DISCOVERY",
        "title": "Least Functionality (Disable Discovery Protocols)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-DISCOVERY-PROTOCOLS",
        "severity": "medium",
        "framework_ref": "NIST SP 800-53 Rev. 5 CM-7",
        "source_note": "NIST SP 800-53 Rev. 5, Control CM-7 (Least Functionality - Disable Information Leakage Protocols)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("discoveryProtocolsDisabled") is True or p.get("discovery_protocols_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno cdp run\nno lldp run\nend\nwrite memory",
            "juniper_junos": "delete protocols lldp\ncommit",
            "palo_alto_panos": "set network interface ethernet ethernet1/1 lldp enable no\ncommit",
            "sonic": "systemctl stop lldp && systemctl disable lldp",
            "fortinet_fortios": "config system lldp\nset status disable\nend",
            "arista_eos": "configure\nno lldp run\nwrite memory",
        }
    },
    {
        "id": "NIST-AC-17-ACL",
        "title": "Remote Access (Enforce Ingress Management Filtering)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-MGMT-ACL",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 AC-17(1)",
        "source_note": "NIST SP 800-53 Rev. 5, Control AC-17(1) (Remote Access - Automated Monitoring and Control)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("vtyAccessClassConfigured") is True or p.get("vty_access_class_configured") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nip access-list standard MGMT-ACL\npermit 10.14.0.0 0.0.255.255\ndeny any log\nline vty 0 15\naccess-class MGMT-ACL in\nend\nwrite memory",
            "juniper_junos": "set firewall family inet filter MGMT-FILTER term ALLOW-MGMT from source-address 10.14.0.0/16\nset interfaces fxp0 unit 0 family inet filter input MGMT-FILTER\ncommit",
            "palo_alto_panos": "set deviceconfig system permitted-ip 10.14.0.0/16\ncommit",
            "sonic": "sonic-cli -c \"configure terminal ; ip access-list MGMT-VTY ; permit tcp 10.14.0.0/16 any eq 22\"",
            "fortinet_fortios": "config system admin\nedit \"admin\"\nset trusthost1 10.14.0.0 255.255.0.0\nnext\nend",
            "arista_eos": "configure\nip access-list MGMT-ACL\npermit ip 10.14.0.0/16 any\nline vty\naccess-class MGMT-ACL\nwrite memory",
        }
    },
    {
        "id": "NIST-AU-8-AUTH",
        "title": "Time Stamps (Enforce Cryptographic NTP Authentication)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-NTP-AUTH",
        "severity": "medium",
        "framework_ref": "NIST SP 800-53 Rev. 5 AU-8(1)",
        "source_note": "NIST SP 800-53 Rev. 5, Control AU-8(1) (Time Stamps - Synchronization with Authenticated Reference)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("ntpAuthenticated") is True or p.get("ntp_authenticated") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nntp authenticate\nntp authentication-key 1 sha1 SECRETAUTHKEY\nntp trusted-key 1\nntp server 10.14.0.1 key 1 prefer\nend\nwrite memory",
            "juniper_junos": "set system ntp authentication-key 1 type sha1 value SECRETAUTHKEY\nset system ntp trusted-key 1\nset system ntp server 10.14.0.1 key 1\ncommit",
            "palo_alto_panos": "set deviceconfig system ntp-servers primary-ntp-server authentication-type symmetric-key\ncommit",
            "sonic": "config ntp key add 1 sha1 SECRETAUTHKEY",
            "fortinet_fortios": "config system ntp\nset authentication enable\nset key-type sha1\nset key SECRETAUTHKEY\nend",
            "arista_eos": "configure\nntp authenticate\nntp authentication-key 1 sha1 SECRETAUTHKEY\nntp trusted-key 1\nwrite memory",
        }
    },
    {
        "id": "NIST-IA-5-SNMP",
        "title": "Authenticator Management (Prohibit Default SNMP Communities)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-SNMP-COMMUNITY",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 IA-5",
        "source_note": "NIST SP 800-53 Rev. 5, Control IA-5 (Authenticator Management - Remove Default Authenticators)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("snmpDefaultCommunityDisabled") is True or p.get("snmp_default_community_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno snmp-server community public\nno snmp-server community private\nend\nwrite memory",
            "juniper_junos": "delete snmp community public\ndelete snmp community private\ncommit",
            "palo_alto_panos": "delete deviceconfig system snmp-setting snmp-version-v2c\ncommit",
            "sonic": "config snmp community del public",
            "fortinet_fortios": "config system snmp community\ndelete 1\nend",
            "arista_eos": "configure\nno snmp-server community public\nno snmp-server community private\nwrite memory",
        }
    },
    {
        "id": "NIST-IA-2-LIVE",
        "title": "Identification and Authentication (Dynamic AAA Server Operational Verification)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-AAA-LIVE",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 IA-2(1)",
        "source_note": "NIST SP 800-53 Rev. 5, Control IA-2(1) (Identification and Authentication - Multi-Factor / Centralized Service Reachability)",
        "infra_requirements": {
            "whyConfigInsufficient": "Static analysis can only verify that `tacacs-server host` is written in config text. It cannot verify whether the AAA daemon is actually reachable, whether TLS/mTLS sessions establish, or whether fallback-to-local lockouts occur under packet drop conditions.",
            "requiredInfrastructure": ["Active Directory / FreeIPA / Cisco ISE RADIUS cluster","Synthetic round-trip authentication prober","OOB Management Network Gateway","Health check collector daemon"],
            "syntheticProbeCommand": "echo 'test-user:$(openssl rand -hex 16)' | radtest -t pap -x synthetic-auditor 10.14.5.10 1812 1813 testing123",
            "telemetrySignal": "AAA authentication response code 2 (Access-Accept) with round-trip latency < 120ms logged in /var/log/radius.log, and Cisco ISE TACACS+ live session audit log event 5200 (Authentication Succeeded).",
            "verificationProcedure": "1. Dispatch synthetic round-trip authentication probe through the device management interface.\n2. Confirm ISE/FreeIPA cluster responds with Access-Accept within SLA (<120ms).\n3. Test primary server failure failover to secondary AAA host.\n4. Ensure fallback-to-local credential lockout triggers only upon total cluster unreachability.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "test aaa group tacacs+ secadmin password legacy\nping 10.14.5.10 source GigabitEthernet0",
            "juniper_junos": "request system radius-server test server 10.14.5.10 secret testing123 user secadmin password legacy",
            "palo_alto_panos": "test authentication authentication-profile TACACS-AUTH username secadmin password legacy",
            "sonic": "radtest -t pap secadmin legacy 10.14.5.10 1812 testing123",
            "fortinet_fortios": "diagnose test authserver tacacs+ tacacs_srv secadmin legacy",
            "arista_eos": "test aaa group tacacs+ secadmin password legacy",
        }
    },
    {
        "id": "NIST-AU-6-INGEST",
        "title": "Audit Record Review, Analysis, and Reporting (Real-Time Ingestion Validation)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-SIEM-INGEST",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 AU-6",
        "source_note": "NIST SP 800-53 Rev. 5, Control AU-6 (Audit Record Review, Analysis, and Reporting - Verification of Ingestion)",
        "infra_requirements": {
            "whyConfigInsufficient": "A static `logging host` entry confirms syslog destination IP in configuration, but cannot confirm if firewall transit drops UDP 514, if TLS syslog certificate validation succeeds, or if the SIEM indexer parses field extractions without schema drop.",
            "requiredInfrastructure": ["Splunk / Elastic / OpenSearch Cluster","Syslog forwarder (rsyslog / syslog-ng)","API gateway with SIEM ingest verification query access","Synthetic test event emitter"],
            "syntheticProbeCommand": "curl -s -k -u elastic:admin 'https://siem.corp.internal:9200/_search?q=host:edge-router-01+AND+@timestamp:>now-5m' | jq .hits.total.value",
            "telemetrySignal": "Syslog RFC 5424 structured event containing device hostname, facility 16 (local0), severity 4, indexed into Elasticsearch index 'syslog-network-*' with zero parse exceptions within 60 seconds.",
            "verificationProcedure": "1. Emit synthetic high-priority syslog test frame from network device.\n2. Query SIEM REST API within 60 seconds to verify document ingestion.\n3. Validate parsed fields: timestamp, host, process_id, severity, and raw payload.\n4. Trigger alert pipeline test to confirm SIEM rule match on critical event.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "send log 1 \"APEXNET-TEST-PROBE: SIEM Connectivity Verification\"\nshow logging | include APEXNET",
            "juniper_junos": "request logger tag APEXNET message \"APEXNET-TEST-PROBE: SIEM Ingestion Test\"",
            "palo_alto_panos": "test routing fib-lookup ip 10.14.5.50\ntest management-server test-log",
            "sonic": "logger -p local0.warn \"APEXNET-TEST-PROBE: SIEM Ingestion Test\"",
            "fortinet_fortios": "diagnose log test",
            "arista_eos": "send log 1 \"APEXNET-TEST-PROBE: SIEM Connectivity Verification\"",
        }
    },
    {
        "id": "NIST-SC-7-OOB",
        "title": "Boundary Protection (Physically & Logically Isolated Out-of-Band Management)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-OOB-ISOLATION",
        "severity": "critical",
        "framework_ref": "NIST SP 800-53 Rev. 5 SC-7(21)",
        "source_note": "NIST SP 800-53 Rev. 5, Control SC-7(21) (Boundary Protection - Isolation of Information System Components)",
        "infra_requirements": {
            "whyConfigInsufficient": "Static configuration statements (e.g. `interface Management0` or `vrf MGMT`) cannot prove that the physical Ethernet patch cable is not plugged into an access switch trunk, or that transit route leaks between default and management routing tables do not exist.",
            "requiredInfrastructure": ["802.1Q VLAN packet analyzer / tap prober","Independent OOB management core switch","Route leakage detector across VRF boundaries","Port boundary scanner (Nmap / Scapy)"],
            "syntheticProbeCommand": "scapy -c 'sendp(Ether()/IP(dst=\"10.14.0.1\",src=\"192.168.100.5\")/ICMP(), iface=\"eth0-prod\")'",
            "telemetrySignal": "Complete drop / zero return packets from production interfaces into the OOB VRF. NetFlow / IPFIX flow monitors must show 0 bytes transferred across VRF isolation boundary.",
            "verificationProcedure": "1. Transmit tagged test frames on production data interfaces targeted at OOB IP range.\n2. Verify router drops packets via dedicated hardware forwarding ASIC.\n3. Query routing table FIB for route leaks between VRF 'default' and VRF 'management'.\n4. Physically verify management port cabling connects strictly to air-gapped OOB switch.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "show ip route vrf MGMT\nshow run interface GigabitEthernet0 | include vrf",
            "juniper_junos": "show route table mgmt.inet.0\nshow interfaces fxp0",
            "palo_alto_panos": "show routing route virtual-router default\nshow interface management",
            "sonic": "show ip route vrf mgmt\nip link show eth0",
            "fortinet_fortios": "diagnose ip route list\nget system interface mgmt",
            "arista_eos": "show ip route vrf MGMT\nshow interfaces Management1",
        }
    },
    {
        "id": "NIST-SC-12-CRL",
        "title": "Cryptographic Key Establishment & PKI Certificate Revocation Verification",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-PKI-REVOCATION",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 SC-12",
        "source_note": "NIST SP 800-53 Rev. 5, Control SC-12 (Cryptographic Key Establishment and Management - Revocation Status Checking)",
        "infra_requirements": {
            "whyConfigInsufficient": "Crypto trustpoint definitions in static config do not demonstrate that CA CRL distributions points (CDP) or OCSP responders are online, reachable, and returning unexpired revocation status within TCP timeout limits.",
            "requiredInfrastructure": ["Internal Certificate Authority (CA) CDP server","OCSP Stapling / Responder endpoint","Network-layer synthetic TLS handshaker","DNS resolver for CA FQDN resolution"],
            "syntheticProbeCommand": "openssl ocsp -issuer ca-chain.pem -cert router-mgmt.crt -url http://ocsp.pki.corp.internal:8888 -CAfile ca-root.pem",
            "telemetrySignal": "OCSP response status: 'successful', Cert Status: 'good', producedAt < 24h ago, nextUpdate in the future. Zero CRL download timeout alerts in device system diagnostics.",
            "verificationProcedure": "1. Initiate synthetic OCSP query from device management context to responder URI.\n2. Confirm responder returns valid cryptographic signature from CA trust anchor.\n3. Verify device CRL cache updates on scheduled refresh window.\n4. Test revocation handling: present revoked client cert to SSH/HTTPS daemon and verify immediate rejection.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "crypto pki crl request MY_PKI_CA\nshow crypto pki crl",
            "juniper_junos": "request security pki crl download ca-profile CA-CORP\nshow security pki crl",
            "palo_alto_panos": "test certificate-status certificate router-cert\nshow ocsp responder",
            "sonic": "curl -I http://ocsp.pki.corp.internal:8888",
            "fortinet_fortios": "diagnose vpn certificate crl list\ndiagnose vpn certificate ocsp status",
            "arista_eos": "show security pki certificate MY_CERT detail",
        }
    },
    {
        "id": "NIST-SC-5-COPP",
        "title": "Denial-of-Service Protection (Control Plane Hardware Rate-Limiter Monitoring)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-COPP-TELEMETRY",
        "severity": "high",
        "framework_ref": "NIST SP 800-53 Rev. 5 SC-5(2)",
        "source_note": "NIST SP 800-53 Rev. 5, Control SC-5(2) (Denial of Service Protection - Excess Capacity / Bandwidth Rate Limiting)",
        "infra_requirements": {
            "whyConfigInsufficient": "Static policy-map configuration verifies ACL structure, but cannot verify whether TCAM hardware rate-limiter meters are successfully allocated, whether legitimate control protocols (BGP, OSPF, LACP) suffer packet drops during volume surges, or if CPU starvation occurs.",
            "requiredInfrastructure": ["SNMP / gNMI Streaming Telemetry Collector","Hardware ASIC TCAM meter monitor","Synthetic traffic generator (IXIA / Trex / Scapy)","Prometheus / Grafana network telemetry stack"],
            "syntheticProbeCommand": "gnmic -a 10.14.0.1:57400 -u admin -p ***** --insecure get --path '/interfaces/interface[name=CoPP]/state/counters'",
            "telemetrySignal": "gNMI / SNMP MIB ciscoCoPPStatsTable streaming data: CPU load <= 35%, legitimate control traffic drop rate == 0 pps, burst flood traffic dropped according to rate-limit profile.",
            "verificationProcedure": "1. Query TCAM CoPP rate-limiter hardware counters via gNMI / SNMP.\n2. Inject controlled burst of ICMP/BGP control plane packets at edge.\n3. Verify policer meters drop traffic above baseline rate threshold while CPU stays below 40%.\n4. Verify critical BGP/BFD keepalive packets maintain priority queue without drops.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "show policy-map control-plane\nshow platform hardware qfp active feature copp datapath stats",
            "juniper_junos": "show firewall filter __default_bpdu_filter__ counter\nshow system processes cpu",
            "palo_alto_panos": "show running dos-rule\nshow dos-block-meter",
            "sonic": "show copp stats",
            "fortinet_fortios": "diagnose ips anomaly status\nget system performance status",
            "arista_eos": "show copp\nshow cpu counters queue",
        }
    },
    {
        "id": "NIST-PE-3-TAMPER",
        "title": "Physical Access Control (Chassis Tamper & Environmental Sensor Telemetry)",
        "framework": "nist_800_53",
        "control_group_id": "CTRL-PHYSICAL-TAMPER",
        "severity": "medium",
        "framework_ref": "NIST SP 800-53 Rev. 5 PE-3",
        "source_note": "NIST SP 800-53 Rev. 5, Control PE-3 (Physical Access Control - Tamper Protection and Environmental Verification)",
        "infra_requirements": {
            "whyConfigInsufficient": "Physical security controls (cabinet door contact sensors, chassis intrusion micro-switches, cable tamper traps, optical port link down locks) exist physically in the facility and cannot be validated solely by examining startup-config text.",
            "requiredInfrastructure": ["BMS (Building Management System) / DCIM Platform","Chassis chassis-intrusion micro-switch sensor","Environmental telemetry probe (SNMP / Modbus)","Physical access control badge logging integration"],
            "syntheticProbeCommand": "snmpget -v3 -l authPriv -u secops -a SHA -A ***** -x AES -X ***** 10.14.0.1 1.3.6.1.4.1.9.9.43.1.1.6.1.3.1",
            "telemetrySignal": "SNMP OID chassisIntrusionStatus returns normal (1). DCIM API confirms rack door locked with optical link monitor status healthy across all active backbone trunks.",
            "verificationProcedure": "1. Query chassis intrusion OID and DCIM cabinet lock API for physical lock status.\n2. Test micro-switch trigger during scheduled maintenance window; verify alarm propagates to NOC within 5 seconds.\n3. Verify unpopulated SFP/QSFP ports have physical dust/tamper covers or admin shutdown.\n4. Correlate DCIM physical door badge logs with configuration change timestamps.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "show environment\nshow inventory\nshow logging | include CHASSIS|TAMPER",
            "juniper_junos": "show chassis environment\nshow chassis hardware",
            "palo_alto_panos": "show system environmentals\nshow system state | match chassis",
            "sonic": "show platform summary\nshow platform psustatus",
            "fortinet_fortios": "diagnose hardware sysinfo\nget system status",
            "arista_eos": "show environment all\nshow inventory",
        }
    },
    # ─── DISA STIG Controls ───
    {
        "id": "STIG-NET-SSH-001",
        "title": "DoD STIG: Enforce SSHv2 Protocol",
        "framework": "disa_stig",
        "control_group_id": "CTRL-SSH-V2",
        "severity": "high",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-220525r856275_rule (SRG-NET-000018-RTR-000001)",
        "source_note": "DISA Cisco Router STIG V-220525, CISC-RT-000005 (CAT II Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("sshVersion", 0) >= 2 else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nip ssh version 2\nend\nwrite memory",
            "juniper_junos": "set system services ssh protocol-version v2\ncommit and-quit",
            "palo_alto_panos": "set deviceconfig system ssh ciphers mgmt [ aes256-gcm aes256-ctr ]\ncommit",
            "sonic": "sonic-cli -c \"configure terminal ; ip ssh version 2\"",
            "fortinet_fortios": "config system global\nset admin-ssh-v1 disable\nset strong-crypto enable\nend",
            "arista_eos": "configure\nmanagement ssh\nprotocol version 2\nexit\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-0001",
        "title": "DoD STIG: Prohibit Unencrypted Telnet Protocol",
        "framework": "disa_stig",
        "control_group_id": "CTRL-TELNET-OFF",
        "severity": "critical",
        "cat_rating": "CAT I",
        "framework_ref": "DISA STIG Rule SV-216960r856276_rule (SRG-NET-000018-RTR-000002)",
        "source_note": "DISA Cisco Router STIG V-216960, CISC-RT-000010 (CAT I Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("telnetEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nline vty 0 15\ntransport input ssh\nend\nwrite memory",
            "juniper_junos": "delete system services telnet\ncommit and-quit",
            "palo_alto_panos": "set deviceconfig system service disable-telnet yes\ncommit",
            "sonic": "systemctl mask --now telnet.socket",
            "fortinet_fortios": "config system interface\nedit \"port1\"\nset allowaccess https ssh ping\nnext\nend",
            "arista_eos": "configure\nno management telnet\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-0002",
        "title": "DoD STIG: Prohibit Clear-Text Web Management (HTTP)",
        "framework": "disa_stig",
        "control_group_id": "CTRL-HTTP-OFF",
        "severity": "critical",
        "cat_rating": "CAT I",
        "framework_ref": "DISA STIG Rule SV-216961r856277_rule (SRG-NET-000018-RTR-000003)",
        "source_note": "DISA Cisco Router STIG V-216961, CISC-RT-000020 (CAT I Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("httpServerEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno ip http server\nip http secure-server\nend\nwrite memory",
            "juniper_junos": "delete system services web-management http\nset system services web-management https port 443\ncommit",
            "palo_alto_panos": "set deviceconfig system service disable-http yes\ncommit",
            "sonic": "systemctl stop nginx-http && systemctl disable nginx-http",
            "fortinet_fortios": "config system global\nset admin-https-redirect enable\nend",
            "arista_eos": "configure\nno management api http-commands\nprotocol https\nexit\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-0003",
        "title": "DoD STIG: Cryptographically Protect Local Passwords",
        "framework": "disa_stig",
        "control_group_id": "CTRL-PASS-ENCRYPT",
        "severity": "critical",
        "cat_rating": "CAT I",
        "framework_ref": "DISA STIG Rule SV-216962r856278_rule (SRG-NET-000168-RTR-000074)",
        "source_note": "DISA Cisco Router STIG V-216962, CISC-RT-000030 (CAT I Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("passwordEncryptionEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nservice password-encryption\nend\nwrite memory",
            "juniper_junos": "set system login password-format sha512\ncommit",
            "palo_alto_panos": "set mgt-config users secadmin password\ncommit",
            "sonic": "passwd -e admin",
            "fortinet_fortios": "config system global\nset strong-crypto enable\nend",
            "arista_eos": "configure\nservice password-encryption\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-0004",
        "title": "DoD STIG: Mandate Centralized AAA Authentication",
        "framework": "disa_stig",
        "control_group_id": "CTRL-AAA-AUTH",
        "severity": "critical",
        "cat_rating": "CAT I",
        "framework_ref": "DISA STIG Rule SV-216963r856279_rule (SRG-NET-000018-RTR-000007)",
        "source_note": "DISA Cisco Router STIG V-216963, CISC-RT-000040 (CAT I Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("aaaAuthEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\naaa new-model\naaa authentication login default group tacacs+ local\nend\nwrite memory",
            "juniper_junos": "set system authentication-order [ tacplus radius password ]\ncommit",
            "palo_alto_panos": "set shared authentication-profile TACACS-AUTH method tacacs-plus\ncommit",
            "sonic": "config aaa authentication login tacacs+ local",
            "fortinet_fortios": "config user tacacs+\nedit \"tacacs_srv\"\nset server \"10.14.5.10\"\nnext\nend",
            "arista_eos": "configure\naaa new-model\naaa authentication login default group tacacs+ local\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-0005",
        "title": "DoD STIG: Restrict SNMP to Version 3",
        "framework": "disa_stig",
        "control_group_id": "CTRL-SNMP-V3",
        "severity": "medium",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-216965r856281_rule (SRG-NET-000168-RTR-000075)",
        "source_note": "DISA Cisco Router STIG V-216965, CISC-RT-000060 (CAT II Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("snmpVersion") == "v3" else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno snmp-server community public\nsnmp-server group SEC_GRP v3 priv\nend\nwrite memory",
            "juniper_junos": "delete snmp community\nset snmp v3 usm local-engine user secoper authentication-sha\ncommit",
            "palo_alto_panos": "set deviceconfig system snmp-setting snmp-version-v3\ncommit",
            "sonic": "config snmp user add secoper SHA <authkey> AES <privkey>",
            "fortinet_fortios": "config system snmp user\nedit \"secoper\"\nset security-level auth-priv\nnext\nend",
            "arista_eos": "configure\nsnmp-server group SEC_GRP v3 auth\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-0006",
        "title": "DoD STIG: Transmit Audit Records to Central Log Server",
        "framework": "disa_stig",
        "control_group_id": "CTRL-SYSLOG-SIEM",
        "severity": "high",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-216966r856282_rule (SRG-NET-000334-RTR-000179)",
        "source_note": "DISA Cisco Router STIG V-216966, CISC-RT-000070 (CAT II Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("syslogServers") is not None else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nlogging host 10.14.5.50\nlogging trap notifications\nend\nwrite memory",
            "juniper_junos": "set system syslog host 10.14.5.50 any warning facility-override local5\ncommit",
            "palo_alto_panos": "set shared log-settings syslog SIEM server 10.14.5.50 port 514\ncommit",
            "sonic": "config syslog add 10.14.5.50",
            "fortinet_fortios": "config log syslogd setting\nset status enable\nset server \"10.14.5.50\"\nend",
            "arista_eos": "configure\nlogging host 10.14.5.50\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-0007",
        "title": "DoD STIG: Enforce 10-Minute Administrative Session Timeout",
        "framework": "disa_stig",
        "control_group_id": "CTRL-IDLE-TIMEOUT",
        "severity": "medium",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-216967r856283_rule (SRG-NET-000019-RTR-000007)",
        "source_note": "DISA Cisco Router STIG V-216967, CISC-RT-000080 (CAT II Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("sessionIdleTimeoutMinutes") is not None and int(p.get("sessionIdleTimeoutMinutes", 999)) <= 15 else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nline con 0\nexec-timeout 10 0\nline vty 0 15\nexec-timeout 10 0\nend\nwrite memory",
            "juniper_junos": "set system login idle-timeout 10\ncommit",
            "palo_alto_panos": "set deviceconfig system idle-timeout 10\ncommit",
            "sonic": "config ssh idle-timeout 600",
            "fortinet_fortios": "config system global\nset admintimeout 10\nend",
            "arista_eos": "configure\nmanagement ssh\nidle-timeout 10\nexit\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-0008",
        "title": "DoD STIG: Synchronize Device Clocks with Designated NTP Server",
        "framework": "disa_stig",
        "control_group_id": "CTRL-NTP-SYNC",
        "severity": "low",
        "cat_rating": "CAT III",
        "framework_ref": "DISA STIG Rule SV-216972r856288_rule (SRG-NET-000168-RTR-000077)",
        "source_note": "DISA Cisco Router STIG V-216972, CISC-RT-000110 (CAT III Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("ntpConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nntp server 10.14.0.1 prefer\nntp authenticate\nend\nwrite memory",
            "juniper_junos": "set system ntp server 10.14.0.1 prefer\ncommit",
            "palo_alto_panos": "set deviceconfig system ntp-servers primary-ntp-server 10.14.0.1\ncommit",
            "sonic": "config ntp add 10.14.0.1",
            "fortinet_fortios": "config system ntp\nset ntpsync enable\nset type custom\nend",
            "arista_eos": "configure\nntp server 10.14.0.1 prefer\nwrite memory",
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
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("loginBannerConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nbanner login ^C\nRESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\n^C\nend\nwrite memory",
            "juniper_junos": "set system login message \"RESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\"\ncommit",
            "palo_alto_panos": "set deviceconfig system login-banner \"RESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\"\ncommit",
            "sonic": "config banner login \"RESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\"",
            "fortinet_fortios": "config system global\nset pre-login-banner enable\nend",
            "arista_eos": "configure\nbanner login\nRESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\nEOF\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-ICMP-001",
        "title": "DoD STIG: Prohibit Sending ICMP Redirect Messages",
        "framework": "disa_stig",
        "control_group_id": "CTRL-ICMP-REDIRECTS",
        "severity": "medium",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-220535r856289_rule (SRG-NET-000362-RTR-000114)",
        "source_note": "DISA Cisco Router STIG V-220535, CISC-RT-000120 (CAT II Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("icmpRedirectsDisabled") is True or p.get("icmp_redirects_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno ip icmp redirect\ninterface range Gi0/0 - 3\nno ip redirects\nend\nwrite memory",
            "juniper_junos": "set system no-redirects\ncommit and-quit",
            "palo_alto_panos": "set network profiles zone-protection-profile REJECT-REDIRECTS icmp-drop yes\ncommit",
            "sonic": "sysctl -w net.ipv4.conf.all.send_redirects=0 net.ipv4.conf.default.send_redirects=0",
            "fortinet_fortios": "config system global\nset icmp-send-redirect disable\nend",
            "arista_eos": "configure\nno ip icmp redirect\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-ARP-001",
        "title": "DoD STIG: Prohibit Proxy ARP on Routed Interfaces",
        "framework": "disa_stig",
        "control_group_id": "CTRL-PROXY-ARP",
        "severity": "medium",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-220536r856290_rule (SRG-NET-000362-RTR-000115)",
        "source_note": "DISA Cisco Router STIG V-220536, CISC-RT-000130 (CAT II Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("proxyArpDisabled") is True or p.get("proxy_arp_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\ninterface range Gi0/0 - 3\nno ip proxy-arp\nend\nwrite memory",
            "juniper_junos": "set interfaces ge-0/0/0 unit 0 family inet no-proxy-arp\ncommit",
            "palo_alto_panos": "set network interface ethernet ethernet1/1 layer3 arp-proxy-enabled no\ncommit",
            "sonic": "sysctl -w net.ipv4.conf.all.proxy_arp=0",
            "fortinet_fortios": "config system proxy-arp\npurge\nend",
            "arista_eos": "configure\nno ip proxy-arp\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-SR-001",
        "title": "DoD STIG: Reject IP Source Routed Packets",
        "framework": "disa_stig",
        "control_group_id": "CTRL-SOURCE-ROUTE",
        "severity": "critical",
        "cat_rating": "CAT I",
        "framework_ref": "DISA STIG Rule SV-220537r856291_rule (SRG-NET-000364-RTR-000116)",
        "source_note": "DISA Cisco Router STIG V-220537, CISC-RT-000140 (CAT I Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("ipSourceRoutingDisabled") is True or p.get("ip_source_routing_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno ip source-route\nend\nwrite memory",
            "juniper_junos": "set system no-ip-source-routing\ncommit",
            "palo_alto_panos": "set deviceconfig setting tcp ip-drop-source-routed yes\ncommit",
            "sonic": "sysctl -w net.ipv4.conf.all.accept_source_route=0",
            "fortinet_fortios": "config system global\nset ip-src-routing disable\nend",
            "arista_eos": "configure\nno ip source-route\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-BCAST-001",
        "title": "DoD STIG: Prohibit IP Directed Broadcasts",
        "framework": "disa_stig",
        "control_group_id": "CTRL-DIRECTED-BROADCAST",
        "severity": "medium",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-220538r856292_rule (SRG-NET-000362-RTR-000117)",
        "source_note": "DISA Cisco Router STIG V-220538, CISC-RT-000150 (CAT II Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("directedBroadcastDisabled") is True or p.get("directed_broadcast_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\ninterface range Gi0/0 - 3\nno ip directed-broadcast\nend\nwrite memory",
            "juniper_junos": "set system no-directed-broadcasts\ncommit",
            "palo_alto_panos": "set network profiles zone-protection-profile DROP-BCAST directed-broadcast-drop yes\ncommit",
            "sonic": "sysctl -w net.ipv4.icmp_echo_ignore_broadcasts=1",
            "fortinet_fortios": "config system interface\nedit port1\nset broadcast-forward disable\nnext\nend",
            "arista_eos": "configure\nno ip directed-broadcast\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-DISC-001",
        "title": "DoD STIG: Disable Cisco Discovery Protocol (CDP) and LLDP",
        "framework": "disa_stig",
        "control_group_id": "CTRL-DISCOVERY-PROTOCOLS",
        "severity": "medium",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-220539r856293_rule (SRG-NET-000131-RTR-000035)",
        "source_note": "DISA Cisco Router STIG V-220539, CISC-RT-000160 (CAT II Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("discoveryProtocolsDisabled") is True or p.get("discovery_protocols_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno cdp run\nno lldp run\nend\nwrite memory",
            "juniper_junos": "delete protocols lldp\ncommit",
            "palo_alto_panos": "set network interface ethernet ethernet1/1 lldp enable no\ncommit",
            "sonic": "systemctl stop lldp && systemctl disable lldp",
            "fortinet_fortios": "config system lldp\nset status disable\nend",
            "arista_eos": "configure\nno lldp run\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-VTY-001",
        "title": "DoD STIG: Restrict Remote Management via Ingress ACL",
        "framework": "disa_stig",
        "control_group_id": "CTRL-MGMT-ACL",
        "severity": "critical",
        "cat_rating": "CAT I",
        "framework_ref": "DISA STIG Rule SV-220540r856294_rule (SRG-NET-000018-RTR-000006)",
        "source_note": "DISA Cisco Router STIG V-220540, CISC-RT-000170 (CAT I Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("vtyAccessClassConfigured") is True or p.get("vty_access_class_configured") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nip access-list standard MGMT-ACL\npermit 10.14.0.0 0.0.255.255\ndeny any log\nline vty 0 15\naccess-class MGMT-ACL in\nend\nwrite memory",
            "juniper_junos": "set firewall family inet filter MGMT-FILTER term ALLOW-MGMT from source-address 10.14.0.0/16\nset interfaces fxp0 unit 0 family inet filter input MGMT-FILTER\ncommit",
            "palo_alto_panos": "set deviceconfig system permitted-ip 10.14.0.0/16\ncommit",
            "sonic": "sonic-cli -c \"configure terminal ; ip access-list MGMT-VTY ; permit tcp 10.14.0.0/16 any eq 22\"",
            "fortinet_fortios": "config system admin\nedit \"admin\"\nset trusthost1 10.14.0.0 255.255.0.0\nnext\nend",
            "arista_eos": "configure\nip access-list MGMT-ACL\npermit ip 10.14.0.0/16 any\nline vty\naccess-class MGMT-ACL\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-NTP-002",
        "title": "DoD STIG: Mandate NTP Symmetric Key Authentication",
        "framework": "disa_stig",
        "control_group_id": "CTRL-NTP-AUTH",
        "severity": "medium",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-220541r856295_rule (SRG-NET-000168-RTR-000078)",
        "source_note": "DISA Cisco Router STIG V-220541, CISC-RT-000180 (CAT II Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("ntpAuthenticated") is True or p.get("ntp_authenticated") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nntp authenticate\nntp authentication-key 1 sha1 SECRETAUTHKEY\nntp trusted-key 1\nntp server 10.14.0.1 key 1 prefer\nend\nwrite memory",
            "juniper_junos": "set system ntp authentication-key 1 type sha1 value SECRETAUTHKEY\nset system ntp trusted-key 1\nset system ntp server 10.14.0.1 key 1\ncommit",
            "palo_alto_panos": "set deviceconfig system ntp-servers primary-ntp-server authentication-type symmetric-key\ncommit",
            "sonic": "config ntp key add 1 sha1 SECRETAUTHKEY",
            "fortinet_fortios": "config system ntp\nset authentication enable\nset key-type sha1\nset key SECRETAUTHKEY\nend",
            "arista_eos": "configure\nntp authenticate\nntp authentication-key 1 sha1 SECRETAUTHKEY\nntp trusted-key 1\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-SNMP-002",
        "title": "DoD STIG: Prohibit Default SNMP Community Strings",
        "framework": "disa_stig",
        "control_group_id": "CTRL-SNMP-COMMUNITY",
        "severity": "critical",
        "cat_rating": "CAT I",
        "framework_ref": "DISA STIG Rule SV-220542r856296_rule (SRG-NET-000168-RTR-000076)",
        "source_note": "DISA Cisco Router STIG V-220542, CISC-RT-000190 (CAT I Finding)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("snmpDefaultCommunityDisabled") is True or p.get("snmp_default_community_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno snmp-server community public\nno snmp-server community private\nend\nwrite memory",
            "juniper_junos": "delete snmp community public\ndelete snmp community private\ncommit",
            "palo_alto_panos": "delete deviceconfig system snmp-setting snmp-version-v2c\ncommit",
            "sonic": "config snmp community del public",
            "fortinet_fortios": "config system snmp community\ndelete 1\nend",
            "arista_eos": "configure\nno snmp-server community public\nno snmp-server community private\nwrite memory",
        }
    },
    {
        "id": "STIG-NET-AAA-LIVE",
        "title": "DoD STIG: Operational Verification of Centralized AAA Server Connectivity",
        "framework": "disa_stig",
        "control_group_id": "CTRL-AAA-LIVE",
        "severity": "high",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-220543r856297_rule (SRG-NET-000018-RTR-000008)",
        "source_note": "DISA Cisco Router STIG V-220543, CISC-RT-000200 (CAT II Finding)",
        "infra_requirements": {
            "whyConfigInsufficient": "Static analysis can only verify that `tacacs-server host` is written in config text. It cannot verify whether the AAA daemon is actually reachable, whether TLS/mTLS sessions establish, or whether fallback-to-local lockouts occur under packet drop conditions.",
            "requiredInfrastructure": ["Active Directory / FreeIPA / Cisco ISE RADIUS cluster","Synthetic round-trip authentication prober","OOB Management Network Gateway","Health check collector daemon"],
            "syntheticProbeCommand": "echo 'test-user:$(openssl rand -hex 16)' | radtest -t pap -x synthetic-auditor 10.14.5.10 1812 1813 testing123",
            "telemetrySignal": "AAA authentication response code 2 (Access-Accept) with round-trip latency < 120ms logged in /var/log/radius.log, and Cisco ISE TACACS+ live session audit log event 5200 (Authentication Succeeded).",
            "verificationProcedure": "1. Dispatch synthetic round-trip authentication probe through the device management interface.\n2. Confirm ISE/FreeIPA cluster responds with Access-Accept within SLA (<120ms).\n3. Test primary server failure failover to secondary AAA host.\n4. Ensure fallback-to-local credential lockout triggers only upon total cluster unreachability.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "test aaa group tacacs+ secadmin password legacy\nping 10.14.5.10 source GigabitEthernet0",
            "juniper_junos": "request system radius-server test server 10.14.5.10 secret testing123 user secadmin password legacy",
            "palo_alto_panos": "test authentication authentication-profile TACACS-AUTH username secadmin password legacy",
            "sonic": "radtest -t pap secadmin legacy 10.14.5.10 1812 testing123",
            "fortinet_fortios": "diagnose test authserver tacacs+ tacacs_srv secadmin legacy",
            "arista_eos": "test aaa group tacacs+ secadmin password legacy",
        }
    },
    {
        "id": "STIG-NET-SIEM-INGEST",
        "title": "DoD STIG: Operational Verification of Centralized Audit Log Ingestion",
        "framework": "disa_stig",
        "control_group_id": "CTRL-SIEM-INGEST",
        "severity": "high",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-220544r856298_rule (SRG-NET-000334-RTR-000180)",
        "source_note": "DISA Cisco Router STIG V-220544, CISC-RT-000210 (CAT II Finding)",
        "infra_requirements": {
            "whyConfigInsufficient": "A static `logging host` entry confirms syslog destination IP in configuration, but cannot confirm if firewall transit drops UDP 514, if TLS syslog certificate validation succeeds, or if the SIEM indexer parses field extractions without schema drop.",
            "requiredInfrastructure": ["Splunk / Elastic / OpenSearch Cluster","Syslog forwarder (rsyslog / syslog-ng)","API gateway with SIEM ingest verification query access","Synthetic test event emitter"],
            "syntheticProbeCommand": "curl -s -k -u elastic:admin 'https://siem.corp.internal:9200/_search?q=host:edge-router-01+AND+@timestamp:>now-5m' | jq .hits.total.value",
            "telemetrySignal": "Syslog RFC 5424 structured event containing device hostname, facility 16 (local0), severity 4, indexed into Elasticsearch index 'syslog-network-*' with zero parse exceptions within 60 seconds.",
            "verificationProcedure": "1. Emit synthetic high-priority syslog test frame from network device.\n2. Query SIEM REST API within 60 seconds to verify document ingestion.\n3. Validate parsed fields: timestamp, host, process_id, severity, and raw payload.\n4. Trigger alert pipeline test to confirm SIEM rule match on critical event.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "send log 1 \"APEXNET-TEST-PROBE: SIEM Connectivity Verification\"\nshow logging | include APEXNET",
            "juniper_junos": "request logger tag APEXNET message \"APEXNET-TEST-PROBE: SIEM Ingestion Test\"",
            "palo_alto_panos": "test routing fib-lookup ip 10.14.5.50\ntest management-server test-log",
            "sonic": "logger -p local0.warn \"APEXNET-TEST-PROBE: SIEM Ingestion Test\"",
            "fortinet_fortios": "diagnose log test",
            "arista_eos": "send log 1 \"APEXNET-TEST-PROBE: SIEM Connectivity Verification\"",
        }
    },
    {
        "id": "STIG-NET-OOB-001",
        "title": "DoD STIG: Mandate Out-of-Band Management Network Plane Physical/Logical Separation",
        "framework": "disa_stig",
        "control_group_id": "CTRL-OOB-ISOLATION",
        "severity": "critical",
        "cat_rating": "CAT I",
        "framework_ref": "DISA STIG Rule SV-220545r856299_rule (SRG-NET-000018-RTR-000009)",
        "source_note": "DISA Cisco Router STIG V-220545, CISC-RT-000220 (CAT I Finding)",
        "infra_requirements": {
            "whyConfigInsufficient": "Static configuration statements (e.g. `interface Management0` or `vrf MGMT`) cannot prove that the physical Ethernet patch cable is not plugged into an access switch trunk, or that transit route leaks between default and management routing tables do not exist.",
            "requiredInfrastructure": ["802.1Q VLAN packet analyzer / tap prober","Independent OOB management core switch","Route leakage detector across VRF boundaries","Port boundary scanner (Nmap / Scapy)"],
            "syntheticProbeCommand": "scapy -c 'sendp(Ether()/IP(dst=\"10.14.0.1\",src=\"192.168.100.5\")/ICMP(), iface=\"eth0-prod\")'",
            "telemetrySignal": "Complete drop / zero return packets from production interfaces into the OOB VRF. NetFlow / IPFIX flow monitors must show 0 bytes transferred across VRF isolation boundary.",
            "verificationProcedure": "1. Transmit tagged test frames on production data interfaces targeted at OOB IP range.\n2. Verify router drops packets via dedicated hardware forwarding ASIC.\n3. Query routing table FIB for route leaks between VRF 'default' and VRF 'management'.\n4. Physically verify management port cabling connects strictly to air-gapped OOB switch.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "show ip route vrf MGMT\nshow run interface GigabitEthernet0 | include vrf",
            "juniper_junos": "show route table mgmt.inet.0\nshow interfaces fxp0",
            "palo_alto_panos": "show routing route virtual-router default\nshow interface management",
            "sonic": "show ip route vrf mgmt\nip link show eth0",
            "fortinet_fortios": "diagnose ip route list\nget system interface mgmt",
            "arista_eos": "show ip route vrf MGMT\nshow interfaces Management1",
        }
    },
    {
        "id": "STIG-NET-PKI-001",
        "title": "DoD STIG: Operational Verification of PKI CRL and OCSP Availability",
        "framework": "disa_stig",
        "control_group_id": "CTRL-PKI-REVOCATION",
        "severity": "high",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-220546r856300_rule (SRG-NET-000168-RTR-000079)",
        "source_note": "DISA Cisco Router STIG V-220546, CISC-RT-000230 (CAT II Finding)",
        "infra_requirements": {
            "whyConfigInsufficient": "Crypto trustpoint definitions in static config do not demonstrate that CA CRL distributions points (CDP) or OCSP responders are online, reachable, and returning unexpired revocation status within TCP timeout limits.",
            "requiredInfrastructure": ["Internal Certificate Authority (CA) CDP server","OCSP Stapling / Responder endpoint","Network-layer synthetic TLS handshaker","DNS resolver for CA FQDN resolution"],
            "syntheticProbeCommand": "openssl ocsp -issuer ca-chain.pem -cert router-mgmt.crt -url http://ocsp.pki.corp.internal:8888 -CAfile ca-root.pem",
            "telemetrySignal": "OCSP response status: 'successful', Cert Status: 'good', producedAt < 24h ago, nextUpdate in the future. Zero CRL download timeout alerts in device system diagnostics.",
            "verificationProcedure": "1. Initiate synthetic OCSP query from device management context to responder URI.\n2. Confirm responder returns valid cryptographic signature from CA trust anchor.\n3. Verify device CRL cache updates on scheduled refresh window.\n4. Test revocation handling: present revoked client cert to SSH/HTTPS daemon and verify immediate rejection.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "crypto pki crl request MY_PKI_CA\nshow crypto pki crl",
            "juniper_junos": "request security pki crl download ca-profile CA-CORP\nshow security pki crl",
            "palo_alto_panos": "test certificate-status certificate router-cert\nshow ocsp responder",
            "sonic": "curl -I http://ocsp.pki.corp.internal:8888",
            "fortinet_fortios": "diagnose vpn certificate crl list\ndiagnose vpn certificate ocsp status",
            "arista_eos": "show security pki certificate MY_CERT detail",
        }
    },
    {
        "id": "STIG-NET-COPP-001",
        "title": "DoD STIG: Operational Telemetry Monitoring of Control Plane Rate Limiting",
        "framework": "disa_stig",
        "control_group_id": "CTRL-COPP-TELEMETRY",
        "severity": "high",
        "cat_rating": "CAT II",
        "framework_ref": "DISA STIG Rule SV-220547r856301_rule (SRG-NET-000362-RTR-000118)",
        "source_note": "DISA Cisco Router STIG V-220547, CISC-RT-000240 (CAT II Finding)",
        "infra_requirements": {
            "whyConfigInsufficient": "Static policy-map configuration verifies ACL structure, but cannot verify whether TCAM hardware rate-limiter meters are successfully allocated, whether legitimate control protocols (BGP, OSPF, LACP) suffer packet drops during volume surges, or if CPU starvation occurs.",
            "requiredInfrastructure": ["SNMP / gNMI Streaming Telemetry Collector","Hardware ASIC TCAM meter monitor","Synthetic traffic generator (IXIA / Trex / Scapy)","Prometheus / Grafana network telemetry stack"],
            "syntheticProbeCommand": "gnmic -a 10.14.0.1:57400 -u admin -p ***** --insecure get --path '/interfaces/interface[name=CoPP]/state/counters'",
            "telemetrySignal": "gNMI / SNMP MIB ciscoCoPPStatsTable streaming data: CPU load <= 35%, legitimate control traffic drop rate == 0 pps, burst flood traffic dropped according to rate-limit profile.",
            "verificationProcedure": "1. Query TCAM CoPP rate-limiter hardware counters via gNMI / SNMP.\n2. Inject controlled burst of ICMP/BGP control plane packets at edge.\n3. Verify policer meters drop traffic above baseline rate threshold while CPU stays below 40%.\n4. Verify critical BGP/BFD keepalive packets maintain priority queue without drops.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "show policy-map control-plane\nshow platform hardware qfp active feature copp datapath stats",
            "juniper_junos": "show firewall filter __default_bpdu_filter__ counter\nshow system processes cpu",
            "palo_alto_panos": "show running dos-rule\nshow dos-block-meter",
            "sonic": "show copp stats",
            "fortinet_fortios": "diagnose ips anomaly status\nget system performance status",
            "arista_eos": "show copp\nshow cpu counters queue",
        }
    },
    {
        "id": "STIG-NET-PHYS-001",
        "title": "DoD STIG: Verify Physical Security Tamper Sensors and Port Enclosures",
        "framework": "disa_stig",
        "control_group_id": "CTRL-PHYSICAL-TAMPER",
        "severity": "medium",
        "cat_rating": "CAT III",
        "framework_ref": "DISA STIG Rule SV-220548r856302_rule (SRG-NET-000168-RTR-000080)",
        "source_note": "DISA Cisco Router STIG V-220548, CISC-RT-000250 (CAT III Finding)",
        "infra_requirements": {
            "whyConfigInsufficient": "Physical security controls (cabinet door contact sensors, chassis intrusion micro-switches, cable tamper traps, optical port link down locks) exist physically in the facility and cannot be validated solely by examining startup-config text.",
            "requiredInfrastructure": ["BMS (Building Management System) / DCIM Platform","Chassis chassis-intrusion micro-switch sensor","Environmental telemetry probe (SNMP / Modbus)","Physical access control badge logging integration"],
            "syntheticProbeCommand": "snmpget -v3 -l authPriv -u secops -a SHA -A ***** -x AES -X ***** 10.14.0.1 1.3.6.1.4.1.9.9.43.1.1.6.1.3.1",
            "telemetrySignal": "SNMP OID chassisIntrusionStatus returns normal (1). DCIM API confirms rack door locked with optical link monitor status healthy across all active backbone trunks.",
            "verificationProcedure": "1. Query chassis intrusion OID and DCIM cabinet lock API for physical lock status.\n2. Test micro-switch trigger during scheduled maintenance window; verify alarm propagates to NOC within 5 seconds.\n3. Verify unpopulated SFP/QSFP ports have physical dust/tamper covers or admin shutdown.\n4. Correlate DCIM physical door badge logs with configuration change timestamps.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "show environment\nshow inventory\nshow logging | include CHASSIS|TAMPER",
            "juniper_junos": "show chassis environment\nshow chassis hardware",
            "palo_alto_panos": "show system environmentals\nshow system state | match chassis",
            "sonic": "show platform summary\nshow platform psustatus",
            "fortinet_fortios": "diagnose hardware sysinfo\nget system status",
            "arista_eos": "show environment all\nshow inventory",
        }
    },
    # ─── ISO 27001:2022 Controls ───
    {
        "id": "ISO-A.8.20",
        "title": "Network Controls (Encrypted Remote Management - SSHv2)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-SSH-V2",
        "severity": "critical",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.20",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.20 (Networks Security - Cryptographic Management)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("sshVersion", 0) >= 2 else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nip ssh version 2\nend\nwrite memory",
            "juniper_junos": "set system services ssh protocol-version v2\ncommit and-quit",
            "palo_alto_panos": "set deviceconfig system ssh ciphers mgmt [ aes256-gcm aes256-ctr ]\ncommit",
            "sonic": "sonic-cli -c \"configure terminal ; ip ssh version 2\"",
            "fortinet_fortios": "config system global\nset admin-ssh-v1 disable\nset strong-crypto enable\nend",
            "arista_eos": "configure\nmanagement ssh\nprotocol version 2\nexit\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.26",
        "title": "Application Security Requirements (Prohibit Clear-Text Telnet)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-TELNET-OFF",
        "severity": "critical",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.26",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.26 (Application Security Requirements - Insecure Protocols)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("telnetEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nline vty 0 15\ntransport input ssh\nend\nwrite memory",
            "juniper_junos": "delete system services telnet\ncommit and-quit",
            "palo_alto_panos": "set deviceconfig system service disable-telnet yes\ncommit",
            "sonic": "systemctl mask --now telnet.socket",
            "fortinet_fortios": "config system interface\nedit \"port1\"\nset allowaccess https ssh ping\nnext\nend",
            "arista_eos": "configure\nno management telnet\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.20-HTTP",
        "title": "Network Controls (Disable Insecure Web Management)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-HTTP-OFF",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.20",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.20 (Networks Security - Web Management)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("httpServerEnabled") is False else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno ip http server\nip http secure-server\nend\nwrite memory",
            "juniper_junos": "delete system services web-management http\nset system services web-management https port 443\ncommit",
            "palo_alto_panos": "set deviceconfig system service disable-http yes\ncommit",
            "sonic": "systemctl stop nginx-http && systemctl disable nginx-http",
            "fortinet_fortios": "config system global\nset admin-https-redirect enable\nend",
            "arista_eos": "configure\nno management api http-commands\nprotocol https\nexit\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.24",
        "title": "Use of Cryptography (Password Storage Protection)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-PASS-ENCRYPT",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.24",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.24 (Use of Cryptography - Credential Storage)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("passwordEncryptionEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nservice password-encryption\nend\nwrite memory",
            "juniper_junos": "set system login password-format sha512\ncommit",
            "palo_alto_panos": "set mgt-config users secadmin password\ncommit",
            "sonic": "passwd -e admin",
            "fortinet_fortios": "config system global\nset strong-crypto enable\nend",
            "arista_eos": "configure\nservice password-encryption\nwrite memory",
        }
    },
    {
        "id": "ISO-A.5.16",
        "title": "Identity Management (Centralized Authentication)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-AAA-AUTH",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.5.16",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.5.16 (Identity Management - Centralized AAA)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("aaaAuthEnabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\naaa new-model\naaa authentication login default group tacacs+ local\nend\nwrite memory",
            "juniper_junos": "set system authentication-order [ tacplus radius password ]\ncommit",
            "palo_alto_panos": "set shared authentication-profile TACACS-AUTH method tacacs-plus\ncommit",
            "sonic": "config aaa authentication login tacacs+ local",
            "fortinet_fortios": "config user tacacs+\nedit \"tacacs_srv\"\nset server \"10.14.5.10\"\nnext\nend",
            "arista_eos": "configure\naaa new-model\naaa authentication login default group tacacs+ local\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.20-SNMP",
        "title": "Network Controls (Mandate SNMPv3 authPriv)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-SNMP-V3",
        "severity": "medium",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.20",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.20 (Networks Security - Secure Monitoring)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("snmpVersion") == "v3" else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno snmp-server community public\nsnmp-server group SEC_GRP v3 priv\nend\nwrite memory",
            "juniper_junos": "delete snmp community\nset snmp v3 usm local-engine user secoper authentication-sha\ncommit",
            "palo_alto_panos": "set deviceconfig system snmp-setting snmp-version-v3\ncommit",
            "sonic": "config snmp user add secoper SHA <authkey> AES <privkey>",
            "fortinet_fortios": "config system snmp user\nedit \"secoper\"\nset security-level auth-priv\nnext\nend",
            "arista_eos": "configure\nsnmp-server group SEC_GRP v3 auth\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.15",
        "title": "Logging (Forward Security Events to Tamper-Resistant SIEM)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-SYSLOG-SIEM",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.15",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.15 (Logging - Centralized Collection & Monitoring)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("syslogServers") is not None else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nlogging host 10.14.5.50\nlogging trap notifications\nend\nwrite memory",
            "juniper_junos": "set system syslog host 10.14.5.50 any warning facility-override local5\ncommit",
            "palo_alto_panos": "set shared log-settings syslog SIEM server 10.14.5.50 port 514\ncommit",
            "sonic": "config syslog add 10.14.5.50",
            "fortinet_fortios": "config log syslogd setting\nset status enable\nset server \"10.14.5.50\"\nend",
            "arista_eos": "configure\nlogging host 10.14.5.50\nwrite memory",
        }
    },
    {
        "id": "ISO-A.5.15",
        "title": "Access Control (Automatically Terminate Inactive Sessions)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-IDLE-TIMEOUT",
        "severity": "medium",
        "framework_ref": "ISO/IEC 27001:2022 Control A.5.15",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.5.15 (Access Control - Session Inactivity Lockout)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("sessionIdleTimeoutMinutes") is not None and int(p.get("sessionIdleTimeoutMinutes", 999)) <= 15 else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nline con 0\nexec-timeout 10 0\nline vty 0 15\nexec-timeout 10 0\nend\nwrite memory",
            "juniper_junos": "set system login idle-timeout 10\ncommit",
            "palo_alto_panos": "set deviceconfig system idle-timeout 10\ncommit",
            "sonic": "config ssh idle-timeout 600",
            "fortinet_fortios": "config system global\nset admintimeout 10\nend",
            "arista_eos": "configure\nmanagement ssh\nidle-timeout 10\nexit\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.17",
        "title": "Clock Synchronization (Synchronize with Authoritative NTP Sources)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-NTP-SYNC",
        "severity": "medium",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.17",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.17 (Clock Synchronization)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("ntpConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nntp server 10.14.0.1 prefer\nntp authenticate\nend\nwrite memory",
            "juniper_junos": "set system ntp server 10.14.0.1 prefer\ncommit",
            "palo_alto_panos": "set deviceconfig system ntp-servers primary-ntp-server 10.14.0.1\ncommit",
            "sonic": "config ntp add 10.14.0.1",
            "fortinet_fortios": "config system ntp\nset ntpsync enable\nset type custom\nend",
            "arista_eos": "configure\nntp server 10.14.0.1 prefer\nwrite memory",
        }
    },
    {
        "id": "ISO-A.5.15-BANNER",
        "title": "Access Control (Authorized Notice and Login Banner)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-LOGIN-BANNER",
        "severity": "low",
        "framework_ref": "ISO/IEC 27001:2022 Control A.5.15",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.5.15 (Access Control - Advisory Warning Notice)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("loginBannerConfigured") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nbanner login ^C\nRESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\n^C\nend\nwrite memory",
            "juniper_junos": "set system login message \"RESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\"\ncommit",
            "palo_alto_panos": "set deviceconfig system login-banner \"RESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\"\ncommit",
            "sonic": "config banner login \"RESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\"",
            "fortinet_fortios": "config system global\nset pre-login-banner enable\nend",
            "arista_eos": "configure\nbanner login\nRESTRICTED SYSTEM - AUTHORIZED ACCESS ONLY\nEOF\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.20-ICMP",
        "title": "Network Controls (Disable Insecure Route Redirects)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-ICMP-REDIRECTS",
        "severity": "medium",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.20",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.20 (Networks Security - Disable Insecure Route Redirects)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("icmpRedirectsDisabled") is True or p.get("icmp_redirects_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno ip icmp redirect\ninterface range Gi0/0 - 3\nno ip redirects\nend\nwrite memory",
            "juniper_junos": "set system no-redirects\ncommit and-quit",
            "palo_alto_panos": "set network profiles zone-protection-profile REJECT-REDIRECTS icmp-drop yes\ncommit",
            "sonic": "sysctl -w net.ipv4.conf.all.send_redirects=0 net.ipv4.conf.default.send_redirects=0",
            "fortinet_fortios": "config system global\nset icmp-send-redirect disable\nend",
            "arista_eos": "configure\nno ip icmp redirect\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.20-PROXYARP",
        "title": "Network Controls (Disable Insecure Proxy ARP)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-PROXY-ARP",
        "severity": "medium",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.20",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.20 (Networks Security - Disable Proxy ARP)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("proxyArpDisabled") is True or p.get("proxy_arp_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\ninterface range Gi0/0 - 3\nno ip proxy-arp\nend\nwrite memory",
            "juniper_junos": "set interfaces ge-0/0/0 unit 0 family inet no-proxy-arp\ncommit",
            "palo_alto_panos": "set network interface ethernet ethernet1/1 layer3 arp-proxy-enabled no\ncommit",
            "sonic": "sysctl -w net.ipv4.conf.all.proxy_arp=0",
            "fortinet_fortios": "config system proxy-arp\npurge\nend",
            "arista_eos": "configure\nno ip proxy-arp\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.20-SR",
        "title": "Network Controls (Disable IP Source Routing)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-SOURCE-ROUTE",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.20",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.20 (Networks Security - Drop Source Routed Packets)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("ipSourceRoutingDisabled") is True or p.get("ip_source_routing_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno ip source-route\nend\nwrite memory",
            "juniper_junos": "set system no-ip-source-routing\ncommit",
            "palo_alto_panos": "set deviceconfig setting tcp ip-drop-source-routed yes\ncommit",
            "sonic": "sysctl -w net.ipv4.conf.all.accept_source_route=0",
            "fortinet_fortios": "config system global\nset ip-src-routing disable\nend",
            "arista_eos": "configure\nno ip source-route\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.20-BCAST",
        "title": "Network Controls (Disable Subnet Directed Broadcasts)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-DIRECTED-BROADCAST",
        "severity": "medium",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.20",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.20 (Networks Security - Drop Directed Broadcasts)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("directedBroadcastDisabled") is True or p.get("directed_broadcast_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\ninterface range Gi0/0 - 3\nno ip directed-broadcast\nend\nwrite memory",
            "juniper_junos": "set system no-directed-broadcasts\ncommit",
            "palo_alto_panos": "set network profiles zone-protection-profile DROP-BCAST directed-broadcast-drop yes\ncommit",
            "sonic": "sysctl -w net.ipv4.icmp_echo_ignore_broadcasts=1",
            "fortinet_fortios": "config system interface\nedit port1\nset broadcast-forward disable\nnext\nend",
            "arista_eos": "configure\nno ip directed-broadcast\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.20-DISC",
        "title": "Network Controls (Disable Insecure Discovery Protocols)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-DISCOVERY-PROTOCOLS",
        "severity": "medium",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.20",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.20 (Networks Security - Disable Discovery Beacons)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("discoveryProtocolsDisabled") is True or p.get("discovery_protocols_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno cdp run\nno lldp run\nend\nwrite memory",
            "juniper_junos": "delete protocols lldp\ncommit",
            "palo_alto_panos": "set network interface ethernet ethernet1/1 lldp enable no\ncommit",
            "sonic": "systemctl stop lldp && systemctl disable lldp",
            "fortinet_fortios": "config system lldp\nset status disable\nend",
            "arista_eos": "configure\nno lldp run\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.22-MGMT",
        "title": "Segregation of Networks (Filter Administrative Access via ACL)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-MGMT-ACL",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.22",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.22 (Segregation of Networks - Restricted Management Gateways)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("vtyAccessClassConfigured") is True or p.get("vty_access_class_configured") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nip access-list standard MGMT-ACL\npermit 10.14.0.0 0.0.255.255\ndeny any log\nline vty 0 15\naccess-class MGMT-ACL in\nend\nwrite memory",
            "juniper_junos": "set firewall family inet filter MGMT-FILTER term ALLOW-MGMT from source-address 10.14.0.0/16\nset interfaces fxp0 unit 0 family inet filter input MGMT-FILTER\ncommit",
            "palo_alto_panos": "set deviceconfig system permitted-ip 10.14.0.0/16\ncommit",
            "sonic": "sonic-cli -c \"configure terminal ; ip access-list MGMT-VTY ; permit tcp 10.14.0.0/16 any eq 22\"",
            "fortinet_fortios": "config system admin\nedit \"admin\"\nset trusthost1 10.14.0.0 255.255.0.0\nnext\nend",
            "arista_eos": "configure\nip access-list MGMT-ACL\npermit ip 10.14.0.0/16 any\nline vty\naccess-class MGMT-ACL\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.17-AUTH",
        "title": "Clock Synchronization (Mandate NTP Cryptographic Authentication)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-NTP-AUTH",
        "severity": "medium",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.17",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.17 (Clock Synchronization - Authenticated NTP)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("ntpAuthenticated") is True or p.get("ntp_authenticated") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nntp authenticate\nntp authentication-key 1 sha1 SECRETAUTHKEY\nntp trusted-key 1\nntp server 10.14.0.1 key 1 prefer\nend\nwrite memory",
            "juniper_junos": "set system ntp authentication-key 1 type sha1 value SECRETAUTHKEY\nset system ntp trusted-key 1\nset system ntp server 10.14.0.1 key 1\ncommit",
            "palo_alto_panos": "set deviceconfig system ntp-servers primary-ntp-server authentication-type symmetric-key\ncommit",
            "sonic": "config ntp key add 1 sha1 SECRETAUTHKEY",
            "fortinet_fortios": "config system ntp\nset authentication enable\nset key-type sha1\nset key SECRETAUTHKEY\nend",
            "arista_eos": "configure\nntp authenticate\nntp authentication-key 1 sha1 SECRETAUTHKEY\nntp trusted-key 1\nwrite memory",
        }
    },
    {
        "id": "ISO-A.8.24-SNMP",
        "title": "Use of Cryptography (Remove Default SNMP Authenticators)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-SNMP-COMMUNITY",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.24",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.24 (Remove Default SNMP Community Authenticators)",
        "infra_requirements": None,
        "evaluate": lambda p: "pass" if p.get("snmpDefaultCommunityDisabled") is True or p.get("snmp_default_community_disabled") is True else "fail",
        "remediation": {
            "cisco_ios": "configure terminal\nno snmp-server community public\nno snmp-server community private\nend\nwrite memory",
            "juniper_junos": "delete snmp community public\ndelete snmp community private\ncommit",
            "palo_alto_panos": "delete deviceconfig system snmp-setting snmp-version-v2c\ncommit",
            "sonic": "config snmp community del public",
            "fortinet_fortios": "config system snmp community\ndelete 1\nend",
            "arista_eos": "configure\nno snmp-server community public\nno snmp-server community private\nwrite memory",
        }
    },
    {
        "id": "ISO-A.5.16-LIVE",
        "title": "Identity Management (Operational AAA Service Availability & Latency Monitoring)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-AAA-LIVE",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.5.16",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.5.16 (Identity Management - AAA Infrastructure Live Availability)",
        "infra_requirements": {
            "whyConfigInsufficient": "Static analysis can only verify that `tacacs-server host` is written in config text. It cannot verify whether the AAA daemon is actually reachable, whether TLS/mTLS sessions establish, or whether fallback-to-local lockouts occur under packet drop conditions.",
            "requiredInfrastructure": ["Active Directory / FreeIPA / Cisco ISE RADIUS cluster","Synthetic round-trip authentication prober","OOB Management Network Gateway","Health check collector daemon"],
            "syntheticProbeCommand": "echo 'test-user:$(openssl rand -hex 16)' | radtest -t pap -x synthetic-auditor 10.14.5.10 1812 1813 testing123",
            "telemetrySignal": "AAA authentication response code 2 (Access-Accept) with round-trip latency < 120ms logged in /var/log/radius.log, and Cisco ISE TACACS+ live session audit log event 5200 (Authentication Succeeded).",
            "verificationProcedure": "1. Dispatch synthetic round-trip authentication probe through the device management interface.\n2. Confirm ISE/FreeIPA cluster responds with Access-Accept within SLA (<120ms).\n3. Test primary server failure failover to secondary AAA host.\n4. Ensure fallback-to-local credential lockout triggers only upon total cluster unreachability.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "test aaa group tacacs+ secadmin password legacy\nping 10.14.5.10 source GigabitEthernet0",
            "juniper_junos": "request system radius-server test server 10.14.5.10 secret testing123 user secadmin password legacy",
            "palo_alto_panos": "test authentication authentication-profile TACACS-AUTH username secadmin password legacy",
            "sonic": "radtest -t pap secadmin legacy 10.14.5.10 1812 testing123",
            "fortinet_fortios": "diagnose test authserver tacacs+ tacacs_srv secadmin legacy",
            "arista_eos": "test aaa group tacacs+ secadmin password legacy",
        }
    },
    {
        "id": "ISO-A.8.15-INGEST",
        "title": "Logging (SIEM Real-Time Ingestion & Parsability Verification)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-SIEM-INGEST",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.15",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.15 (Logging - Real-Time Analysis & Ingest Validation)",
        "infra_requirements": {
            "whyConfigInsufficient": "A static `logging host` entry confirms syslog destination IP in configuration, but cannot confirm if firewall transit drops UDP 514, if TLS syslog certificate validation succeeds, or if the SIEM indexer parses field extractions without schema drop.",
            "requiredInfrastructure": ["Splunk / Elastic / OpenSearch Cluster","Syslog forwarder (rsyslog / syslog-ng)","API gateway with SIEM ingest verification query access","Synthetic test event emitter"],
            "syntheticProbeCommand": "curl -s -k -u elastic:admin 'https://siem.corp.internal:9200/_search?q=host:edge-router-01+AND+@timestamp:>now-5m' | jq .hits.total.value",
            "telemetrySignal": "Syslog RFC 5424 structured event containing device hostname, facility 16 (local0), severity 4, indexed into Elasticsearch index 'syslog-network-*' with zero parse exceptions within 60 seconds.",
            "verificationProcedure": "1. Emit synthetic high-priority syslog test frame from network device.\n2. Query SIEM REST API within 60 seconds to verify document ingestion.\n3. Validate parsed fields: timestamp, host, process_id, severity, and raw payload.\n4. Trigger alert pipeline test to confirm SIEM rule match on critical event.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "send log 1 \"APEXNET-TEST-PROBE: SIEM Connectivity Verification\"\nshow logging | include APEXNET",
            "juniper_junos": "request logger tag APEXNET message \"APEXNET-TEST-PROBE: SIEM Ingestion Test\"",
            "palo_alto_panos": "test routing fib-lookup ip 10.14.5.50\ntest management-server test-log",
            "sonic": "logger -p local0.warn \"APEXNET-TEST-PROBE: SIEM Ingestion Test\"",
            "fortinet_fortios": "diagnose log test",
            "arista_eos": "send log 1 \"APEXNET-TEST-PROBE: SIEM Connectivity Verification\"",
        }
    },
    {
        "id": "ISO-A.8.22-OOB",
        "title": "Segregation of Networks (Enforce Dedicated Out-of-Band Management Network)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-OOB-ISOLATION",
        "severity": "critical",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.22",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.22 (Segregation of Networks - Dedicated Out-of-Band Network)",
        "infra_requirements": {
            "whyConfigInsufficient": "Static configuration statements (e.g. `interface Management0` or `vrf MGMT`) cannot prove that the physical Ethernet patch cable is not plugged into an access switch trunk, or that transit route leaks between default and management routing tables do not exist.",
            "requiredInfrastructure": ["802.1Q VLAN packet analyzer / tap prober","Independent OOB management core switch","Route leakage detector across VRF boundaries","Port boundary scanner (Nmap / Scapy)"],
            "syntheticProbeCommand": "scapy -c 'sendp(Ether()/IP(dst=\"10.14.0.1\",src=\"192.168.100.5\")/ICMP(), iface=\"eth0-prod\")'",
            "telemetrySignal": "Complete drop / zero return packets from production interfaces into the OOB VRF. NetFlow / IPFIX flow monitors must show 0 bytes transferred across VRF isolation boundary.",
            "verificationProcedure": "1. Transmit tagged test frames on production data interfaces targeted at OOB IP range.\n2. Verify router drops packets via dedicated hardware forwarding ASIC.\n3. Query routing table FIB for route leaks between VRF 'default' and VRF 'management'.\n4. Physically verify management port cabling connects strictly to air-gapped OOB switch.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "show ip route vrf MGMT\nshow run interface GigabitEthernet0 | include vrf",
            "juniper_junos": "show route table mgmt.inet.0\nshow interfaces fxp0",
            "palo_alto_panos": "show routing route virtual-router default\nshow interface management",
            "sonic": "show ip route vrf mgmt\nip link show eth0",
            "fortinet_fortios": "diagnose ip route list\nget system interface mgmt",
            "arista_eos": "show ip route vrf MGMT\nshow interfaces Management1",
        }
    },
    {
        "id": "ISO-A.8.24-CRL",
        "title": "Use of Cryptography (Live PKI Certificate Revocation Status Verification)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-PKI-REVOCATION",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.24",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.24 (Use of Cryptography - Certificate Revocation Checking)",
        "infra_requirements": {
            "whyConfigInsufficient": "Crypto trustpoint definitions in static config do not demonstrate that CA CRL distributions points (CDP) or OCSP responders are online, reachable, and returning unexpired revocation status within TCP timeout limits.",
            "requiredInfrastructure": ["Internal Certificate Authority (CA) CDP server","OCSP Stapling / Responder endpoint","Network-layer synthetic TLS handshaker","DNS resolver for CA FQDN resolution"],
            "syntheticProbeCommand": "openssl ocsp -issuer ca-chain.pem -cert router-mgmt.crt -url http://ocsp.pki.corp.internal:8888 -CAfile ca-root.pem",
            "telemetrySignal": "OCSP response status: 'successful', Cert Status: 'good', producedAt < 24h ago, nextUpdate in the future. Zero CRL download timeout alerts in device system diagnostics.",
            "verificationProcedure": "1. Initiate synthetic OCSP query from device management context to responder URI.\n2. Confirm responder returns valid cryptographic signature from CA trust anchor.\n3. Verify device CRL cache updates on scheduled refresh window.\n4. Test revocation handling: present revoked client cert to SSH/HTTPS daemon and verify immediate rejection.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "crypto pki crl request MY_PKI_CA\nshow crypto pki crl",
            "juniper_junos": "request security pki crl download ca-profile CA-CORP\nshow security pki crl",
            "palo_alto_panos": "test certificate-status certificate router-cert\nshow ocsp responder",
            "sonic": "curl -I http://ocsp.pki.corp.internal:8888",
            "fortinet_fortios": "diagnose vpn certificate crl list\ndiagnose vpn certificate ocsp status",
            "arista_eos": "show security pki certificate MY_CERT detail",
        }
    },
    {
        "id": "ISO-A.8.20-COPP",
        "title": "Network Controls (Control Plane Policing Hardware Telemetry Monitoring)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-COPP-TELEMETRY",
        "severity": "high",
        "framework_ref": "ISO/IEC 27001:2022 Control A.8.20",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.8.20 (Networks Security - Control Plane Protection Telemetry)",
        "infra_requirements": {
            "whyConfigInsufficient": "Static policy-map configuration verifies ACL structure, but cannot verify whether TCAM hardware rate-limiter meters are successfully allocated, whether legitimate control protocols (BGP, OSPF, LACP) suffer packet drops during volume surges, or if CPU starvation occurs.",
            "requiredInfrastructure": ["SNMP / gNMI Streaming Telemetry Collector","Hardware ASIC TCAM meter monitor","Synthetic traffic generator (IXIA / Trex / Scapy)","Prometheus / Grafana network telemetry stack"],
            "syntheticProbeCommand": "gnmic -a 10.14.0.1:57400 -u admin -p ***** --insecure get --path '/interfaces/interface[name=CoPP]/state/counters'",
            "telemetrySignal": "gNMI / SNMP MIB ciscoCoPPStatsTable streaming data: CPU load <= 35%, legitimate control traffic drop rate == 0 pps, burst flood traffic dropped according to rate-limit profile.",
            "verificationProcedure": "1. Query TCAM CoPP rate-limiter hardware counters via gNMI / SNMP.\n2. Inject controlled burst of ICMP/BGP control plane packets at edge.\n3. Verify policer meters drop traffic above baseline rate threshold while CPU stays below 40%.\n4. Verify critical BGP/BFD keepalive packets maintain priority queue without drops.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "show policy-map control-plane\nshow platform hardware qfp active feature copp datapath stats",
            "juniper_junos": "show firewall filter __default_bpdu_filter__ counter\nshow system processes cpu",
            "palo_alto_panos": "show running dos-rule\nshow dos-block-meter",
            "sonic": "show copp stats",
            "fortinet_fortios": "diagnose ips anomaly status\nget system performance status",
            "arista_eos": "show copp\nshow cpu counters queue",
        }
    },
    {
        "id": "ISO-A.7.1-PHYS",
        "title": "Physical Security Perimeters (Chassis Intrusion & Physical Tamper Telemetry)",
        "framework": "iso_27001",
        "control_group_id": "CTRL-PHYSICAL-TAMPER",
        "severity": "medium",
        "framework_ref": "ISO/IEC 27001:2022 Control A.7.1",
        "source_note": "ISO/IEC 27001:2022 Annex A, Control A.7.1 (Physical Security Perimeters - Enclosure Tamper Sensors)",
        "infra_requirements": {
            "whyConfigInsufficient": "Physical security controls (cabinet door contact sensors, chassis intrusion micro-switches, cable tamper traps, optical port link down locks) exist physically in the facility and cannot be validated solely by examining startup-config text.",
            "requiredInfrastructure": ["BMS (Building Management System) / DCIM Platform","Chassis chassis-intrusion micro-switch sensor","Environmental telemetry probe (SNMP / Modbus)","Physical access control badge logging integration"],
            "syntheticProbeCommand": "snmpget -v3 -l authPriv -u secops -a SHA -A ***** -x AES -X ***** 10.14.0.1 1.3.6.1.4.1.9.9.43.1.1.6.1.3.1",
            "telemetrySignal": "SNMP OID chassisIntrusionStatus returns normal (1). DCIM API confirms rack door locked with optical link monitor status healthy across all active backbone trunks.",
            "verificationProcedure": "1. Query chassis intrusion OID and DCIM cabinet lock API for physical lock status.\n2. Test micro-switch trigger during scheduled maintenance window; verify alarm propagates to NOC within 5 seconds.\n3. Verify unpopulated SFP/QSFP ports have physical dust/tamper covers or admin shutdown.\n4. Correlate DCIM physical door badge logs with configuration change timestamps.",
        },
        "evaluate": lambda p: "checking_infra_missing",
        "remediation": {
            "cisco_ios": "show environment\nshow inventory\nshow logging | include CHASSIS|TAMPER",
            "juniper_junos": "show chassis environment\nshow chassis hardware",
            "palo_alto_panos": "show system environmentals\nshow system state | match chassis",
            "sonic": "show platform summary\nshow platform psustatus",
            "fortinet_fortios": "diagnose hardware sysinfo\nget system status",
            "arista_eos": "show environment all\nshow inventory",
        }
    },
]

def evaluate_config(
    parameters: Dict[str, Any],
    evidence: Dict[str, List[Dict[str, Any]]],
    frameworks: List[str],
    vendor: str,
    exemplars_applied: Dict[str, Any] = None
) -> Tuple[List[Finding], AuditSummary]:
    applicable_rules = [r for r in RULES_CATALOG if r["framework"] in frameworks]
    findings = []
    
    passed_count = 0
    failed_count = 0
    infra_missing_count = 0
    crit_count = 0
    high_count = 0
    med_count = 0
    low_count = 0

    control_groups_evaluated = {}

    for rule in applicable_rules:
        verdict = rule["evaluate"](parameters)
        
        remediation_cmd = rule["remediation"].get(vendor, rule["remediation"].get("cisco_ios", "Contact network security administrator."))
        
        resolved_via_exemplar = None
        if exemplars_applied and rule["id"] in exemplars_applied:
            resolved_via_exemplar = exemplars_applied[rule["id"]]

        # Extract line evidence based on control group
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
        elif cg == "CTRL-ICMP-REDIRECTS" and "icmpRedirectsDisabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["icmpRedirectsDisabled"]]
        elif cg == "CTRL-PROXY-ARP" and "proxyArpDisabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["proxyArpDisabled"]]
        elif cg == "CTRL-SOURCE-ROUTE" and "ipSourceRoutingDisabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["ipSourceRoutingDisabled"]]
        elif cg == "CTRL-DIRECTED-BROADCAST" and "directedBroadcastDisabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["directedBroadcastDisabled"]]
        elif cg == "CTRL-DISCOVERY-PROTOCOLS" and "discoveryProtocolsDisabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["discoveryProtocolsDisabled"]]
        elif cg == "CTRL-MGMT-ACL" and "vtyAccessClassConfigured" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["vtyAccessClassConfigured"]]
        elif cg == "CTRL-NTP-AUTH" and "ntpAuthenticated" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["ntpAuthenticated"]]
        elif cg == "CTRL-SNMP-COMMUNITY" and "snmpDefaultCommunityDisabled" in evidence:
            ev_lines = [LineEvidence(line=e["line"], raw=e["raw"]) for e in evidence["snmpDefaultCommunityDisabled"]]

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
            resolved_via_exemplar=resolved_via_exemplar,
            infra_requirements=rule.get("infra_requirements")
        ))

        # Update control group deduplication
        cg_id = rule.get("control_group_id") or rule["id"]
        if verdict != "checking_infra_missing":
            if cg_id not in control_groups_evaluated:
                control_groups_evaluated[cg_id] = verdict
            else:
                if verdict == "fail":
                    control_groups_evaluated[cg_id] = "fail"

        if verdict == "pass":
            passed_count += 1
        elif verdict == "checking_infra_missing":
            infra_missing_count += 1
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
        infra_missing=infra_missing_count,
        critical_count=crit_count,
        high_count=high_count,
        medium_count=med_count,
        low_count=low_count
    )

    return findings, summary
