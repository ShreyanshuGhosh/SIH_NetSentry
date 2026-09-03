import { AuditRule, FrameworkId } from '../types/audit';

export interface FrameworkMetadata {
  id: FrameworkId;
  name: string;
  fullName: string;
  version: string;
  authority: string;
  totalControls: number;
  description: string;
  badgeColor: string;
}

export const FRAMEWORKS: Record<FrameworkId, FrameworkMetadata> = {
  cis_v8: {
    id: 'cis_v8',
    name: 'CIS Network Benchmarks',
    fullName: 'Center for Internet Security Network Devices Benchmark',
    version: 'v8.0.0',
    authority: 'Center for Internet Security (CIS)',
    totalControls: 9,
    description: 'Industry-standard baseline security configurations to protect against common cyber threats.',
    badgeColor: 'emerald'
  },
  nist_800_53: {
    id: 'nist_800_53',
    name: 'NIST SP 800-53',
    fullName: 'NIST Special Publication 800-53 Rev. 5',
    version: 'Rev. 5',
    authority: 'National Institute of Standards and Technology',
    totalControls: 9,
    description: 'Federal information system security controls for critical national infrastructure.',
    badgeColor: 'cyan'
  },
  disa_stig: {
    id: 'disa_stig',
    name: 'DISA STIG Network',
    fullName: 'Defense Information Systems Agency Security Technical Implementation Guide',
    version: 'Release 34',
    authority: 'Department of Defense (DoD)',
    totalControls: 9,
    description: 'DoD-grade tactical network device hardening guidelines and mandatory controls.',
    badgeColor: 'amber'
  },
  iso_27001: {
    id: 'iso_27001',
    name: 'ISO/IEC 27001',
    fullName: 'ISO/IEC 27001:2022 Information Security Controls',
    version: '2022 Standard',
    authority: 'International Organization for Standardization',
    totalControls: 8,
    description: 'Annex A controls covering operational security and cryptographic boundaries.',
    badgeColor: 'blue'
  }
};

export const AUDIT_RULES: AuditRule[] = [
  // ══════════════════════════════════════════════════════════════════════════════
  // 1. CIS NETWORK BENCHMARKS (v8.0.0)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'CIS-NET-1.1.1',
    title: 'Enforce SSH Protocol Version 2',
    framework: 'cis_v8',
    frameworkRef: 'CIS Control 1.1.1 / NIST AC-17',
    severity: 'HIGH',
    field: 'ssh_version',
    operator: 'equals',
    targetValue: 2,
    passMessage: 'SSH protocol version 2 is strictly enforced. Insecure SSHv1 is disabled.',
    failMessage: 'SSH protocol version is not locked to version 2. Legacy SSHv1 exposes session to MITM attacks.',
    description: 'Ensure only SSHv2 is enabled for remote administrative access.',
    remediation: {
      cisco_ios: 'ip ssh version 2',
      juniper_junos: 'set system services ssh protocol-version v2',
      palo_alto: 'set deviceconfig system ssh-version 2',
      sonic_whitebox: 'sonic-cli -c "config ssh protocol 2"',
      fortinet_fortios: 'config system global\n  set admin-ssh-port 22\nend',
      arista_eos: 'management ssh\n   protocol version 2',
      cloud_aws_sg: 'aws ec2 authorize-security-group-ingress --group-id <sg-id> --protocol tcp --port 22 --cidr <admin-subnet>'
    }
  },
  {
    id: 'CIS-NET-1.2.1',
    title: 'Disable Unencrypted Telnet Service',
    framework: 'cis_v8',
    frameworkRef: 'CIS Control 1.2.1 / STIG NET-0001',
    severity: 'CRITICAL',
    field: 'telnet_disabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Clear-text Telnet daemon is completely disabled.',
    failMessage: 'Telnet service is actively permitted. Passwords and CLI commands transmit in plaintext over network.',
    description: 'All remote administrative sessions must be encrypted; plaintext Telnet must be disabled.',
    remediation: {
      cisco_ios: 'line vty 0 15\n transport input ssh',
      juniper_junos: 'delete system services telnet',
      palo_alto: 'set deviceconfig system service disable-telnet yes',
      sonic_whitebox: 'systemctl stop telnet.socket && systemctl disable telnet.socket',
      fortinet_fortios: 'config system global\n  set admin-telnet-service disable\nend',
      arista_eos: 'no management telnet',
      cloud_aws_sg: 'aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol tcp --port 23'
    }
  },
  {
    id: 'CIS-NET-1.3.4',
    title: 'Disable Insecure HTTP Management Server',
    framework: 'cis_v8',
    frameworkRef: 'CIS Control 1.3.4 / NIST SC-8',
    severity: 'HIGH',
    field: 'insecure_http_server_disabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Clear-text HTTP web administration server is disabled.',
    failMessage: 'HTTP server is running without TLS encryption. Credentials can be intercepted.',
    description: 'Web management must mandate HTTPS and terminate plain HTTP access.',
    remediation: {
      cisco_ios: 'no ip http server',
      juniper_junos: 'delete system services web-management http',
      palo_alto: 'set deviceconfig system service disable-http yes',
      sonic_whitebox: 'config restapi disable-http',
      fortinet_fortios: 'config system global\n  set admin-http-service disable\nend',
      arista_eos: 'no management api http-commands\n   protocol http',
      cloud_aws_sg: 'aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol tcp --port 80'
    }
  },
  {
    id: 'CIS-NET-2.1.2',
    title: 'Enable AAA Centralized Authentication',
    framework: 'cis_v8',
    frameworkRef: 'CIS Control 2.1.2 / NIST IA-2',
    severity: 'HIGH',
    field: 'aaa_authentication_enabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'AAA authentication and authorization framework is active.',
    failMessage: 'AAA is unconfigured. Device relies on unprotected local fallback accounts.',
    description: 'Enforce centralized authentication and authorization via TACACS+ or RADIUS with local fallback.',
    remediation: {
      cisco_ios: 'aaa new-model\naaa authentication login default local\naaa authorization exec default local',
      juniper_junos: 'set system authentication-order [ password radius tacplus ]',
      palo_alto: 'set shared authentication-profile RADIUS-AUTH method radius',
      sonic_whitebox: 'config aaa authentication login tacacs+ local',
      fortinet_fortios: 'config user tacacs+\n  edit "tacacs_srv"\n    set server "10.14.5.10"\n  next\nend',
      arista_eos: 'aaa authentication login default local\naaa authorization exec default local',
      cloud_aws_sg: 'aws iam attach-role-policy --role-name NetworkAdmin --policy-arn arn:aws:iam::aws:policy/AdministratorAccess'
    }
  },
  {
    id: 'CIS-NET-3.1.1',
    title: 'Configure Centralized Remote Syslog Logging',
    framework: 'cis_v8',
    frameworkRef: 'CIS Control 3.1.1 / NIST AU-3 / ISO A.12.4.1',
    severity: 'HIGH',
    field: 'remote_syslog_enabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Remote centralized syslog forwarding to SIEM is active.',
    failMessage: 'No external syslog server configured. Security audits cannot reconstruct incident logs if device is compromised.',
    description: 'Forward audit and security event logs to an isolated, tamper-evident central logging server.',
    remediation: {
      cisco_ios: 'logging host 10.14.5.50\nlogging trap notifications\nlogging facility local6',
      juniper_junos: 'set system syslog host 10.14.5.50 any warning facility-override local5',
      palo_alto: 'set shared log-settings syslog NTRO-SIEM server 10.14.5.50 port 514 facility LOG_LOCAL6',
      sonic_whitebox: 'config syslog add 10.14.5.50 514 local6 informational',
      fortinet_fortios: 'config log syslogd setting\n  set status enable\n  set server "10.14.5.50"\n  set facility local6\nend',
      arista_eos: 'logging host 10.14.5.50\nlogging level SECURITY informational',
      cloud_aws_sg: 'aws logs create-log-group --log-group-name /ntro/network/audit'
    }
  },
  {
    id: 'CIS-NET-4.2.1',
    title: 'Mandate Encrypted SNMPv3 Protocol',
    framework: 'cis_v8',
    frameworkRef: 'CIS Control 4.2.1 / DISA STIG NET-0020',
    severity: 'MEDIUM',
    field: 'snmp_version',
    operator: 'equals',
    targetValue: 'v3',
    passMessage: 'SNMPv3 with SHA/AES authentication and privacy is deployed.',
    failMessage: 'Legacy unencrypted SNMPv1/v2c detected. Community strings can be sniffed.',
    description: 'Disable SNMPv1/v2c community strings and configure SNMPv3 with AuthPriv security level.',
    remediation: {
      cisco_ios: 'snmp-server group SECGROUP v3 priv\nsnmp-server user secoper SECGROUP v3 auth sha <auth-key> priv aes 128 <priv-key>',
      juniper_junos: 'set snmp v3 usm local-engine user admin-v3 authentication-sha authentication-key <key>',
      palo_alto: 'set deviceconfig system snmp-setting snmp-version-v3 user secoper authpwd <pwd> privpwd <pwd>',
      sonic_whitebox: 'config snmp user add secoper SHA <auth-key> AES <priv-key>',
      fortinet_fortios: 'config system snmp user\n  edit "snmp3user"\n    set security-level auth-priv\n  next\nend',
      arista_eos: 'snmp-server group SECGROUP v3 auth\nsnmp-server user secuser SECGROUP v3 auth sha <key>',
      cloud_aws_sg: 'aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol udp --port 161'
    }
  },
  {
    id: 'CIS-NET-5.1.2',
    title: 'Enforce Administrative Session Idle Timeout <= 15 Min',
    framework: 'cis_v8',
    frameworkRef: 'CIS Control 5.1.2 / NIST AC-12',
    severity: 'MEDIUM',
    field: 'session_idle_timeout_minutes',
    operator: 'equals',
    targetValue: 10,
    passMessage: 'Administrative session idle timeout is set to 10 minutes.',
    failMessage: 'Session timeout exceeds recommended duration or is disabled. Unattended terminals remain open.',
    description: 'Automatically terminate inactive administrative console and VTY sessions after 10-15 minutes.',
    remediation: {
      cisco_ios: 'line con 0\n exec-timeout 10 0\nline vty 0 15\n exec-timeout 10 0',
      juniper_junos: 'set system login idle-timeout 10',
      palo_alto: 'set deviceconfig system idle-timeout 10',
      sonic_whitebox: 'config ssh idle-timeout 600',
      fortinet_fortios: 'config system global\n  set admintimeout 10\nend',
      arista_eos: 'management ssh\n   idle-timeout 10',
      cloud_aws_sg: 'aws iam update-account-password-policy --max-session-duration 3600'
    }
  },
  {
    id: 'CIS-NET-6.1.1',
    title: 'Configure Synchronized NTP Time Source',
    framework: 'cis_v8',
    frameworkRef: 'CIS Control 6.1.1 / NIST AU-8 / ISO A.12.4.4',
    severity: 'MEDIUM',
    field: 'ntp_servers_configured',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Internal authoritative NTP time servers are configured.',
    failMessage: 'No NTP server specified. Log timestamps across network devices will drift, hindering forensic audits.',
    description: 'Synchronize device clock with trusted internal time servers for forensic integrity.',
    remediation: {
      cisco_ios: 'ntp server 10.14.0.1 prefer\nntp server 10.14.0.2',
      juniper_junos: 'set system ntp server 10.14.0.1\nset system ntp server 10.14.0.2',
      palo_alto: 'set deviceconfig system ntp-servers primary-ntp-server 10.14.0.1',
      sonic_whitebox: 'config ntp add 10.14.0.1',
      fortinet_fortios: 'config system ntp\n  set ntpsync enable\n  config ntpserver\n    edit 1\n      set server "10.14.0.1"\n    next\n  end\nend',
      arista_eos: 'ntp server 10.14.0.1 prefer\nntp server 10.14.0.2',
      cloud_aws_sg: 'aws ec2 modify-instance-metadata-options --http-tokens required'
    }
  },
  {
    id: 'CIS-NET-7.1.1',
    title: 'Enforce Legal Warning Login Banner',
    framework: 'cis_v8',
    frameworkRef: 'CIS Control 7.1.1 / NIST AC-8 / DISA STIG NET-0010',
    severity: 'LOW',
    field: 'login_banner_present',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Authorized access warning banner is present before login prompt.',
    failMessage: 'No legal advisory banner configured on login interfaces.',
    description: 'Display an official notice warning that unauthorized access is prohibited and subject to legal prosecution.',
    remediation: {
      cisco_ios: 'banner login ^C\n* PROPRIETARY SYSTEM - AUTHORIZED ACCESS ONLY *\n^C',
      juniper_junos: 'set system login message "RESTRICTED SYSTEM - OFFICIAL NTRO INFRASTRUCTURE ONLY"',
      palo_alto: 'set deviceconfig system login-banner "RESTRICTED GOVERNMENT ACCESS ONLY"',
      sonic_whitebox: 'config banner login "RESTRICTED ACCESS - NTRO AI COMPUTE FABRIC"',
      fortinet_fortios: 'config system global\n  set pre-login-banner enable\nend',
      arista_eos: 'banner login\nGOVERNMENT CLASSIFIED NETWORK - ALL SESSIONS MONITORED\nEOF',
      cloud_aws_sg: 'aws ssm put-parameter --name "/ntro/legal-banner" --value "RESTRICTED" --type String'
    }
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. NIST SP 800-53 REV. 5 (FEDERAL INFORMATION SECURITY CONTROLS)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'NIST-AC-17.1',
    title: 'Remote Access Management via Cryptographic Protocol',
    framework: 'nist_800_53',
    frameworkRef: 'NIST SP 800-53 Rev. 5 AC-17(1) / SC-13',
    severity: 'HIGH',
    field: 'ssh_version',
    operator: 'equals',
    targetValue: 2,
    passMessage: 'FIPS-approved SSHv2 cryptographic protocol enforced on all management interfaces.',
    failMessage: 'Unapproved or legacy SSH protocol detected in violation of NIST AC-17(1) cryptographic standards.',
    description: 'Establish and document usage restrictions, configuration requirements, and implementation guidance for remote management sessions.',
    remediation: {
      cisco_ios: 'ip ssh version 2\nip ssh server algorithm encryption aes256-gcm',
      juniper_junos: 'set system services ssh protocol-version v2\nset system services ssh ciphers aes256-gcm@openssh.com',
      palo_alto: 'set deviceconfig system ssh-version 2',
      sonic_whitebox: 'sonic-cli -c "config ssh protocol 2"',
      fortinet_fortios: 'config system global\n  set strong-crypto enable\nend',
      arista_eos: 'management ssh\n   protocol version 2\n   cipher aes256-gcm@openssh.com',
      cloud_aws_sg: 'aws ec2 authorize-security-group-ingress --group-id <sg-id> --protocol tcp --port 22 --cidr <trusted-management-cidr>'
    }
  },
  {
    id: 'NIST-AC-3.1',
    title: 'Access Enforcement: Terminate Clear-Text Management (Telnet)',
    framework: 'nist_800_53',
    frameworkRef: 'NIST SP 800-53 Rev. 5 AC-3 / SC-8',
    severity: 'CRITICAL',
    field: 'telnet_disabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Clear-text Telnet management is disabled across all operational network boundaries.',
    failMessage: 'Clear-text Telnet daemon is enabled, exposing administrative credentials to eavesdropping.',
    description: 'Enforce approved authorizations for logical access to information and system resources in accordance with security policies.',
    remediation: {
      cisco_ios: 'line vty 0 15\n transport input ssh\n no transport input telnet',
      juniper_junos: 'delete system services telnet',
      palo_alto: 'set deviceconfig system service disable-telnet yes',
      sonic_whitebox: 'systemctl mask telnet.socket',
      fortinet_fortios: 'config system global\n  set admin-telnet-service disable\nend',
      arista_eos: 'no management telnet',
      cloud_aws_sg: 'aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol tcp --port 23'
    }
  },
  {
    id: 'NIST-IA-2.1',
    title: 'Identification and Authentication for Network Administrators (AAA)',
    framework: 'nist_800_53',
    frameworkRef: 'NIST SP 800-53 Rev. 5 IA-2 / IA-8',
    severity: 'HIGH',
    field: 'aaa_authentication_enabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Centralized AAA authentication service (TACACS+/RADIUS) is enforced for administrative access.',
    failMessage: 'No centralized AAA authentication detected. Local unmonitored accounts are vulnerable to compromise.',
    description: 'Uniquely identify and authenticate organizational users accessing network devices using central directory services.',
    remediation: {
      cisco_ios: 'aaa new-model\naaa group server tacacs+ TAC-SEC\n server-private 10.14.5.10\naaa authentication login default group TAC-SEC local',
      juniper_junos: 'set system authentication-order [ tacplus radius password ]\nset system tacplus-server 10.14.5.10',
      palo_alto: 'set shared authentication-profile TACACS-AUTH method tacacs-plus',
      sonic_whitebox: 'config aaa authentication login tacacs+ local',
      fortinet_fortios: 'config user tacacs+\n  edit "secops_tacacs"\n    set server "10.14.5.10"\n  next\nend',
      arista_eos: 'aaa group server tacacs+ TAC-SEC\n server 10.14.5.10\naaa authentication login default group TAC-SEC local',
      cloud_aws_sg: 'aws iam attach-role-policy --role-name SecOpsAdmin --policy-arn arn:aws:iam::aws:policy/AdministratorAccess'
    }
  },
  {
    id: 'NIST-AU-3.1',
    title: 'Content of Audit Records: Centralized Remote Syslog Forwarding',
    framework: 'nist_800_53',
    frameworkRef: 'NIST SP 800-53 Rev. 5 AU-3 / AU-12',
    severity: 'HIGH',
    field: 'remote_syslog_enabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Audit event generation is forwarded to isolated central SIEM collectors.',
    failMessage: 'Centralized syslog forwarding is absent. Local buffer records are susceptible to tampering or rollover.',
    description: 'Ensure audit records contain information establishing what event occurred, when, where, source of the event, and outcome.',
    remediation: {
      cisco_ios: 'logging host 10.14.5.50 transport udp port 514\nlogging trap informational\nlogging source-interface Loopback0',
      juniper_junos: 'set system syslog host 10.14.5.50 any informational\nset system syslog host 10.14.5.50 facility-override local7',
      palo_alto: 'set shared log-settings syslog FED-SIEM server 10.14.5.50 port 514 facility LOG_LOCAL7',
      sonic_whitebox: 'config syslog add 10.14.5.50 514 local7 informational',
      fortinet_fortios: 'config log syslogd setting\n  set status enable\n  set server "10.14.5.50"\n  set facility local7\nend',
      arista_eos: 'logging host 10.14.5.50\nlogging level SECURITY informational',
      cloud_aws_sg: 'aws logs create-log-stream --log-group-name /nist/network/audit --log-stream-name spine-routers'
    }
  },
  {
    id: 'NIST-SC-8.1',
    title: 'Transmission Confidentiality and Integrity: Mandate SNMPv3',
    framework: 'nist_800_53',
    frameworkRef: 'NIST SP 800-53 Rev. 5 SC-8 / SC-13',
    severity: 'HIGH',
    field: 'snmp_version',
    operator: 'equals',
    targetValue: 'v3',
    passMessage: 'SNMPv3 with AuthPriv encryption (SHA-256 / AES-256) is active.',
    failMessage: 'Unencrypted SNMPv1 or v2c detected. Community strings and MIB objects transmit in cleartext.',
    description: 'Protect the confidentiality and integrity of transmitted telemetry and management information.',
    remediation: {
      cisco_ios: 'no snmp-server community public\nsnmp-server group NIST_GRP v3 priv\nsnmp-server user secadmin NIST_GRP v3 auth sha <key> priv aes 256 <key>',
      juniper_junos: 'delete snmp community\nset snmp v3 usm local-engine user secadmin authentication-sha authentication-key <key> privacy-aes256 privacy-key <key>',
      palo_alto: 'set deviceconfig system snmp-setting snmp-version-v3 user secadmin authpwd <pwd> privpwd <pwd>',
      sonic_whitebox: 'config snmp user add secadmin SHA <key> AES <key>',
      fortinet_fortios: 'config system snmp user\n  edit "secadmin"\n    set security-level auth-priv\n    set auth-proto sha256\n  next\nend',
      arista_eos: 'snmp-server group NIST_GRP v3 priv\nsnmp-server user secadmin NIST_GRP v3 auth sha <key> priv aes <key>',
      cloud_aws_sg: 'aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol udp --port 161'
    }
  },
  {
    id: 'NIST-AC-12.1',
    title: 'Session Inactivity Automatic Termination (<= 10 Min)',
    framework: 'nist_800_53',
    frameworkRef: 'NIST SP 800-53 Rev. 5 AC-12',
    severity: 'MEDIUM',
    field: 'session_idle_timeout_minutes',
    operator: 'equals',
    targetValue: 10,
    passMessage: 'Session idle disconnect timer is locked to 10 minutes.',
    failMessage: 'Idle administrative session timeout exceeds 10 minutes or is unconfigured.',
    description: 'Automatically terminate user sessions after a defined condition of inactivity.',
    remediation: {
      cisco_ios: 'line vty 0 15\n exec-timeout 10 0\nline con 0\n exec-timeout 10 0',
      juniper_junos: 'set system login idle-timeout 10',
      palo_alto: 'set deviceconfig system idle-timeout 10',
      sonic_whitebox: 'config ssh idle-timeout 600',
      fortinet_fortios: 'config system global\n  set admintimeout 10\nend',
      arista_eos: 'management ssh\n   idle-timeout 10',
      cloud_aws_sg: 'aws iam update-account-password-policy --max-session-duration 3600'
    }
  },
  {
    id: 'NIST-AU-8.1',
    title: 'Time Stamps: Authoritative Stratum Clock Synchronization (NTP)',
    framework: 'nist_800_53',
    frameworkRef: 'NIST SP 800-53 Rev. 5 AU-8',
    severity: 'MEDIUM',
    field: 'ntp_servers_configured',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Redundant internal authoritative NTP sources configured for forensic audit integrity.',
    failMessage: 'No authoritative NTP time servers configured. System timestamps cannot be correlated during audits.',
    description: 'Use internal system clocks to generate time stamps for audit records that correlate across distributed assets.',
    remediation: {
      cisco_ios: 'ntp server 10.14.0.1 prefer\nntp server 10.14.0.2',
      juniper_junos: 'set system ntp server 10.14.0.1 prefer\nset system ntp server 10.14.0.2',
      palo_alto: 'set deviceconfig system ntp-servers primary-ntp-server 10.14.0.1 secondary-ntp-server 10.14.0.2',
      sonic_whitebox: 'config ntp add 10.14.0.1',
      fortinet_fortios: 'config system ntp\n  set ntpsync enable\n  config ntpserver\n    edit 1\n      set server "10.14.0.1"\n    next\n  end\nend',
      arista_eos: 'ntp server 10.14.0.1 prefer\nntp server 10.14.0.2',
      cloud_aws_sg: 'aws ec2 modify-instance-metadata-options --http-tokens required'
    }
  },
  {
    id: 'NIST-AC-8.1',
    title: 'System Use Notification & Legal Warning Banner',
    framework: 'nist_800_53',
    frameworkRef: 'NIST SP 800-53 Rev. 5 AC-8',
    severity: 'LOW',
    field: 'login_banner_present',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Approved federal advisory notice and consent banner displayed prior to access.',
    failMessage: 'No advisory warning banner configured before login prompt.',
    description: 'Display an approved system use notification message before granting access to information systems.',
    remediation: {
      cisco_ios: 'banner login ^C\n* US GOVERNMENT SYSTEM - AUTHORIZED MONITORING ACTIVE *\n^C',
      juniper_junos: 'set system login message "US GOVERNMENT SYSTEM - AUTHORIZED ACCESS ONLY"',
      palo_alto: 'set deviceconfig system login-banner "RESTRICTED SYSTEM - CONSENT TO MONITORING REQUIRED"',
      sonic_whitebox: 'config banner login "RESTRICTED SYSTEM - OFFICIAL USE ONLY"',
      fortinet_fortios: 'config system global\n  set pre-login-banner enable\nend',
      arista_eos: 'banner login\nRESTRICTED SYSTEM - AUTHORIZED USERS ONLY\nEOF',
      cloud_aws_sg: 'aws ssm put-parameter --name "/nist/banner" --value "RESTRICTED" --type String'
    }
  },
  {
    id: 'NIST-SC-13.1',
    title: 'Cryptographic Boundary: Terminate Insecure Clear-Text HTTP',
    framework: 'nist_800_53',
    frameworkRef: 'NIST SP 800-53 Rev. 5 SC-13 / SC-8',
    severity: 'HIGH',
    field: 'insecure_http_server_disabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Unencrypted clear-text HTTP web administration service is disabled.',
    failMessage: 'Insecure clear-text HTTP server active on administrative network interfaces.',
    description: 'Implement approved cryptography to prevent unauthorized disclosure of information and access credentials.',
    remediation: {
      cisco_ios: 'no ip http server\nip http secure-server',
      juniper_junos: 'delete system services web-management http\nset system services web-management https',
      palo_alto: 'set deviceconfig system service disable-http yes',
      sonic_whitebox: 'config restapi disable-http',
      fortinet_fortios: 'config system global\n  set admin-http-service disable\nend',
      arista_eos: 'no management api http-commands\n   protocol http',
      cloud_aws_sg: 'aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol tcp --port 80'
    }
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. DISA STIG NETWORK (DEPARTMENT OF DEFENSE RELEASE 34)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'STIG-NET-0001',
    title: 'Prohibit Unencrypted Clear-Text Telnet Protocol',
    framework: 'disa_stig',
    frameworkRef: 'DoD DISA STIG NET-0001 / SRG-NET-000018',
    severity: 'CRITICAL',
    field: 'telnet_disabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Telnet daemon is permanently disabled in compliance with DoD Category I mandates.',
    failMessage: 'Telnet service is enabled, allowing unencrypted transmission of DoD command and telemetry data.',
    description: 'The network device must not utilize unencrypted protocols for management sessions (DoD CAT I Finding).',
    remediation: {
      cisco_ios: 'line vty 0 15\n transport input ssh\n no transport input telnet',
      juniper_junos: 'delete system services telnet',
      palo_alto: 'set deviceconfig system service disable-telnet yes',
      sonic_whitebox: 'systemctl mask telnet.socket',
      fortinet_fortios: 'config system global\n  set admin-telnet-service disable\nend',
      arista_eos: 'no management telnet',
      cloud_aws_sg: 'aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol tcp --port 23'
    }
  },
  {
    id: 'STIG-NET-0010',
    title: 'Mandate DoD Standard Notice and Consent Banner',
    framework: 'disa_stig',
    frameworkRef: 'DoD DISA STIG NET-0010 / SRG-NET-000019',
    severity: 'HIGH',
    field: 'login_banner_present',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Official Department of Defense warning banner is displayed prior to login authentication.',
    failMessage: 'DoD standard warning banner is absent on interactive console and VTY channels.',
    description: 'The network device must display the approved DoD warning banner prior to granting administrative access.',
    remediation: {
      cisco_ios: 'banner login ^C\nYou are accessing a U.S. Government (USG) Information System (IS) that is provided for USG-authorized use only.\n^C',
      juniper_junos: 'set system login message "You are accessing a U.S. Government Information System provided for USG-authorized use only."',
      palo_alto: 'set deviceconfig system login-banner "You are accessing a U.S. Government Information System provided for USG-authorized use only."',
      sonic_whitebox: 'config banner login "U.S. GOVERNMENT SYSTEM - AUTHORIZED USE ONLY"',
      fortinet_fortios: 'config system global\n  set pre-login-banner enable\nend',
      arista_eos: 'banner login\nYou are accessing a U.S. Government Information System provided for USG-authorized use only.\nEOF',
      cloud_aws_sg: 'aws ssm put-parameter --name "/disa/banner" --value "USG-RESTRICTED" --type String'
    }
  },
  {
    id: 'STIG-NET-0020',
    title: 'Enforce FIPS-Validated SNMPv3 with AuthPriv Cryptography',
    framework: 'disa_stig',
    frameworkRef: 'DoD DISA STIG NET-0020 / SRG-NET-000030',
    severity: 'HIGH',
    field: 'snmp_version',
    operator: 'equals',
    targetValue: 'v3',
    passMessage: 'SNMPv3 with AuthPriv (SHA-256 authentication and AES-256 privacy) is strictly enforced.',
    failMessage: 'SNMPv1/v2c community strings detected or SNMPv3 operating below AuthPriv security level.',
    description: 'The network device must utilize SNMPv3 with FIPS-validated cryptographic algorithms for telemetry polling.',
    remediation: {
      cisco_ios: 'no snmp-server community public\nno snmp-server community private\nsnmp-server group STIG_GRP v3 priv\nsnmp-server user stigadmin STIG_GRP v3 auth sha <key> priv aes 256 <key>',
      juniper_junos: 'delete snmp community\nset snmp v3 usm local-engine user stigadmin authentication-sha authentication-key <key> privacy-aes256 privacy-key <key>',
      palo_alto: 'set deviceconfig system snmp-setting snmp-version-v3 user stigadmin authpwd <pwd> privpwd <pwd>',
      sonic_whitebox: 'config snmp user add stigadmin SHA <key> AES <key>',
      fortinet_fortios: 'config system snmp user\n  edit "stigadmin"\n    set security-level auth-priv\n    set auth-proto sha256\n    set priv-proto aes256\n  next\nend',
      arista_eos: 'snmp-server group STIG_GRP v3 priv\nsnmp-server user stigadmin STIG_GRP v3 auth sha <key> priv aes <key>',
      cloud_aws_sg: 'aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol udp --port 161'
    }
  },
  {
    id: 'STIG-NET-0030',
    title: 'Mandate SSH Protocol Version 2 for Administrative Sessions',
    framework: 'disa_stig',
    frameworkRef: 'DoD DISA STIG NET-0030 / SRG-NET-000031',
    severity: 'HIGH',
    field: 'ssh_version',
    operator: 'equals',
    targetValue: 2,
    passMessage: 'SSHv2 protocol enforced; legacy SSHv1 daemon is locked down.',
    failMessage: 'SSHv1 fallback is permitted on terminal lines, exposing sessions to decryption.',
    description: 'The network device must exclusively enforce SSH Version 2 with approved Diffie-Hellman group exchanges.',
    remediation: {
      cisco_ios: 'ip ssh version 2\nip ssh dh-group min 14',
      juniper_junos: 'set system services ssh protocol-version v2\nset system services ssh key-exchange group14-sha256',
      palo_alto: 'set deviceconfig system ssh-version 2',
      sonic_whitebox: 'sonic-cli -c "config ssh protocol 2"',
      fortinet_fortios: 'config system global\n  set strong-crypto enable\nend',
      arista_eos: 'management ssh\n   protocol version 2',
      cloud_aws_sg: 'aws ec2 authorize-security-group-ingress --group-id <sg-id> --protocol tcp --port 22 --cidr <dod-admin-cidr>'
    }
  },
  {
    id: 'STIG-NET-0040',
    title: 'Enforce Centralized TACACS+/RADIUS AAA Authorization',
    framework: 'disa_stig',
    frameworkRef: 'DoD DISA STIG NET-0040 / SRG-NET-000045',
    severity: 'HIGH',
    field: 'aaa_authentication_enabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Centralized AAA infrastructure authorization (TACACS+) is operational.',
    failMessage: 'Device administrative access does not enforce centralized AAA authorization against DoD identity stores.',
    description: 'The network device must authenticate and authorize administrative users against centralized AAA infrastructure.',
    remediation: {
      cisco_ios: 'aaa new-model\naaa authentication login default group tacacs+ local\naaa authorization exec default group tacacs+ local',
      juniper_junos: 'set system authentication-order [ tacplus radius password ]\nset system tacplus-server 10.14.5.10',
      palo_alto: 'set shared authentication-profile DISA-TACACS method tacacs-plus',
      sonic_whitebox: 'config aaa authentication login tacacs+ local',
      fortinet_fortios: 'config user tacacs+\n  edit "dod_tacacs"\n    set server "10.14.5.10"\n  next\nend',
      arista_eos: 'aaa authentication login default group tacacs+ local\naaa authorization exec default group tacacs+ local',
      cloud_aws_sg: 'aws iam attach-role-policy --role-name DoDAdmin --policy-arn arn:aws:iam::aws:policy/AdministratorAccess'
    }
  },
  {
    id: 'STIG-NET-0050',
    title: 'Synchronize Device Clock to Designated DoD NTP Source',
    framework: 'disa_stig',
    frameworkRef: 'DoD DISA STIG NET-0050 / SRG-NET-000055',
    severity: 'MEDIUM',
    field: 'ntp_servers_configured',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Authenticated NTP time synchronization established with authorized DoD Stratum-1 servers.',
    failMessage: 'No authoritative NTP time servers configured. Security incident telemetry cannot be sequenced.',
    description: 'The network device must synchronize its internal clock with designated DoD authoritative NTP time sources.',
    remediation: {
      cisco_ios: 'ntp server 10.14.0.1 prefer\nntp server 10.14.0.2',
      juniper_junos: 'set system ntp server 10.14.0.1 prefer\nset system ntp server 10.14.0.2',
      palo_alto: 'set deviceconfig system ntp-servers primary-ntp-server 10.14.0.1',
      sonic_whitebox: 'config ntp add 10.14.0.1',
      fortinet_fortios: 'config system ntp\n  set ntpsync enable\n  config ntpserver\n    edit 1\n      set server "10.14.0.1"\n    next\n  end\nend',
      arista_eos: 'ntp server 10.14.0.1 prefer\nntp server 10.14.0.2',
      cloud_aws_sg: 'aws ec2 modify-instance-metadata-options --http-tokens required'
    }
  },
  {
    id: 'STIG-NET-0060',
    title: 'Terminate Inactive Management Sessions Within 10 Minutes',
    framework: 'disa_stig',
    frameworkRef: 'DoD DISA STIG NET-0060 / SRG-NET-000062',
    severity: 'MEDIUM',
    field: 'session_idle_timeout_minutes',
    operator: 'equals',
    targetValue: 10,
    passMessage: 'Console and VTY idle session timeout is locked to 10 minutes.',
    failMessage: 'Session idle timeout exceeds 10 minutes or is disabled, violating DoD unattended workstation mandates.',
    description: 'The network device must automatically terminate an administrative session after 10 minutes of inactivity.',
    remediation: {
      cisco_ios: 'line con 0\n exec-timeout 10 0\nline vty 0 15\n exec-timeout 10 0',
      juniper_junos: 'set system login idle-timeout 10',
      palo_alto: 'set deviceconfig system idle-timeout 10',
      sonic_whitebox: 'config ssh idle-timeout 600',
      fortinet_fortios: 'config system global\n  set admintimeout 10\nend',
      arista_eos: 'management ssh\n   idle-timeout 10',
      cloud_aws_sg: 'aws iam update-account-password-policy --max-session-duration 3600'
    }
  },
  {
    id: 'STIG-NET-0070',
    title: 'Forward Security Events to Centralized SIEM via Remote Syslog',
    framework: 'disa_stig',
    frameworkRef: 'DoD DISA STIG NET-0070 / SRG-NET-000074',
    severity: 'HIGH',
    field: 'remote_syslog_enabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Real-time security event telemetry is transmitted to centralized defense logging enclave.',
    failMessage: 'Centralized remote logging is unconfigured. Forensic reconstruction is impossible during network breaches.',
    description: 'The network device must send audit records to a central audit repository in real time.',
    remediation: {
      cisco_ios: 'logging host 10.14.5.50\nlogging trap notifications\nlogging facility local6',
      juniper_junos: 'set system syslog host 10.14.5.50 any warning facility-override local5',
      palo_alto: 'set shared log-settings syslog DOD-SIEM server 10.14.5.50 port 514 facility LOG_LOCAL6',
      sonic_whitebox: 'config syslog add 10.14.5.50 514 local6 informational',
      fortinet_fortios: 'config log syslogd setting\n  set status enable\n  set server "10.14.5.50"\n  set facility local6\nend',
      arista_eos: 'logging host 10.14.5.50\nlogging level SECURITY informational',
      cloud_aws_sg: 'aws logs create-log-group --log-group-name /dod/network/audit'
    }
  },
  {
    id: 'STIG-NET-0080',
    title: 'Disable Clear-Text Web Management HTTP Server',
    framework: 'disa_stig',
    frameworkRef: 'DoD DISA STIG NET-0080 / SRG-NET-000088',
    severity: 'HIGH',
    field: 'insecure_http_server_disabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Unencrypted clear-text HTTP web interface is terminated.',
    failMessage: 'Unencrypted HTTP server active on management network interface.',
    description: 'The network device must disable unencrypted web management interfaces.',
    remediation: {
      cisco_ios: 'no ip http server\nip http secure-server',
      juniper_junos: 'delete system services web-management http\nset system services web-management https',
      palo_alto: 'set deviceconfig system service disable-http yes',
      sonic_whitebox: 'config restapi disable-http',
      fortinet_fortios: 'config system global\n  set admin-http-service disable\nend',
      arista_eos: 'no management api http-commands\n   protocol http',
      cloud_aws_sg: 'aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol tcp --port 80'
    }
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. ISO/IEC 27001:2022 (INFORMATION SECURITY CONTROLS)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'ISO-A.8.20',
    title: 'Network Controls: Mandate Encrypted Transport (SSHv2)',
    framework: 'iso_27001',
    frameworkRef: 'ISO/IEC 27001:2022 Control A.8.20 / A.8.24',
    severity: 'HIGH',
    field: 'ssh_version',
    operator: 'equals',
    targetValue: 2,
    passMessage: 'Administrative network traffic secured with robust SSHv2 encryption.',
    failMessage: 'Unencrypted or obsolete administrative protocols detected in violation of network segregation controls.',
    description: 'Networks must be secured, managed, and controlled to protect information in systems and applications.',
    remediation: {
      cisco_ios: 'ip ssh version 2',
      juniper_junos: 'set system services ssh protocol-version v2',
      palo_alto: 'set deviceconfig system ssh-version 2',
      sonic_whitebox: 'sonic-cli -c "config ssh protocol 2"',
      fortinet_fortios: 'config system global\n  set admin-ssh-port 22\nend',
      arista_eos: 'management ssh\n   protocol version 2',
      cloud_aws_sg: 'aws ec2 authorize-security-group-ingress --group-id <sg-id> --protocol tcp --port 22 --cidr <corp-cidr>'
    }
  },
  {
    id: 'ISO-A.8.21',
    title: 'Security of Network Services: Disable Clear-Text Protocols (Telnet)',
    framework: 'iso_27001',
    frameworkRef: 'ISO/IEC 27001:2022 Control A.8.21',
    severity: 'CRITICAL',
    field: 'telnet_disabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Insecure Telnet network service is disabled.',
    failMessage: 'Unsecured Telnet network service is operational, exposing user session data to network sniffing.',
    description: 'Security mechanisms, service levels, and service requirements of network services must be identified, implemented, and monitored.',
    remediation: {
      cisco_ios: 'line vty 0 15\n transport input ssh',
      juniper_junos: 'delete system services telnet',
      palo_alto: 'set deviceconfig system service disable-telnet yes',
      sonic_whitebox: 'systemctl mask telnet.socket',
      fortinet_fortios: 'config system global\n  set admin-telnet-service disable\nend',
      arista_eos: 'no management telnet',
      cloud_aws_sg: 'aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol tcp --port 23'
    }
  },
  {
    id: 'ISO-A.8.24',
    title: 'Use of Cryptography: Mandate Secure SNMPv3 Authentication',
    framework: 'iso_27001',
    frameworkRef: 'ISO/IEC 27001:2022 Control A.8.24',
    severity: 'HIGH',
    field: 'snmp_version',
    operator: 'equals',
    targetValue: 'v3',
    passMessage: 'Cryptographic protection applied to telemetry polling via SNMPv3.',
    failMessage: 'Unencrypted SNMP community strings utilized, violating organizational cryptographic policy.',
    description: 'Rules for the effective use of cryptography, including cryptographic key management, must be defined and implemented.',
    remediation: {
      cisco_ios: 'no snmp-server community public\nsnmp-server group ISO_GRP v3 priv\nsnmp-server user isooper ISO_GRP v3 auth sha <key> priv aes 128 <key>',
      juniper_junos: 'delete snmp community\nset snmp v3 usm local-engine user isooper authentication-sha authentication-key <key>',
      palo_alto: 'set deviceconfig system snmp-setting snmp-version-v3 user isooper authpwd <pwd> privpwd <pwd>',
      sonic_whitebox: 'config snmp user add isooper SHA <key> AES <key>',
      fortinet_fortios: 'config system snmp user\n  edit "isooper"\n    set security-level auth-priv\n  next\nend',
      arista_eos: 'snmp-server group ISO_GRP v3 auth\nsnmp-server user isooper ISO_GRP v3 auth sha <key>',
      cloud_aws_sg: 'aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol udp --port 161'
    }
  },
  {
    id: 'ISO-A.8.5',
    title: 'Secure Authentication: Enforce Centralized AAA Access Control',
    framework: 'iso_27001',
    frameworkRef: 'ISO/IEC 27001:2022 Control A.8.5',
    severity: 'HIGH',
    field: 'aaa_authentication_enabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Centralized AAA access control implemented with corporate directory synchronization.',
    failMessage: 'Administrative authentication relies on non-centralized, unmanaged local credentials.',
    description: 'Secure authentication technologies and procedures must be implemented based on information access restrictions.',
    remediation: {
      cisco_ios: 'aaa new-model\naaa authentication login default local\naaa authorization exec default local',
      juniper_junos: 'set system authentication-order [ password radius tacplus ]',
      palo_alto: 'set shared authentication-profile RADIUS-AUTH method radius',
      sonic_whitebox: 'config aaa authentication login tacacs+ local',
      fortinet_fortios: 'config user tacacs+\n  edit "iso_tacacs"\n    set server "10.14.5.10"\n  next\nend',
      arista_eos: 'aaa authentication login default local\naaa authorization exec default local',
      cloud_aws_sg: 'aws iam attach-role-policy --role-name SecOpsAdmin --policy-arn arn:aws:iam::aws:policy/AdministratorAccess'
    }
  },
  {
    id: 'ISO-A.8.15',
    title: 'Logging: Forward Network Security Events to Tamper-Resistant SIEM',
    framework: 'iso_27001',
    frameworkRef: 'ISO/IEC 27001:2022 Control A.8.15',
    severity: 'HIGH',
    field: 'remote_syslog_enabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Security and administrative audit logs forwarded to central SIEM.',
    failMessage: 'No external logging destination specified. Incident response cannot audit device actions.',
    description: 'Logs that record activities, exceptions, faults and other relevant events must be produced, stored, protected and analysed.',
    remediation: {
      cisco_ios: 'logging host 10.14.5.50\nlogging trap notifications\nlogging facility local6',
      juniper_junos: 'set system syslog host 10.14.5.50 any warning facility-override local5',
      palo_alto: 'set shared log-settings syslog ISO-SIEM server 10.14.5.50 port 514 facility LOG_LOCAL6',
      sonic_whitebox: 'config syslog add 10.14.5.50 514 local6 informational',
      fortinet_fortios: 'config log syslogd setting\n  set status enable\n  set server "10.14.5.50"\n  set facility local6\nend',
      arista_eos: 'logging host 10.14.5.50\nlogging level SECURITY informational',
      cloud_aws_sg: 'aws logs create-log-group --log-group-name /iso/network/audit'
    }
  },
  {
    id: 'ISO-A.8.17',
    title: 'Clock Synchronization: Synchronize with Authoritative NTP Sources',
    framework: 'iso_27001',
    frameworkRef: 'ISO/IEC 27001:2022 Control A.8.17',
    severity: 'MEDIUM',
    field: 'ntp_servers_configured',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Authoritative NTP time synchronization configured for cross-system correlation.',
    failMessage: 'Internal clocks unaligned with reference time source, invalidating security log timestamp fidelity.',
    description: 'The clocks of information processing systems must be synchronized to approved time sources.',
    remediation: {
      cisco_ios: 'ntp server 10.14.0.1 prefer\nntp server 10.14.0.2',
      juniper_junos: 'set system ntp server 10.14.0.1 prefer\nset system ntp server 10.14.0.2',
      palo_alto: 'set deviceconfig system ntp-servers primary-ntp-server 10.14.0.1',
      sonic_whitebox: 'config ntp add 10.14.0.1',
      fortinet_fortios: 'config system ntp\n  set ntpsync enable\n  config ntpserver\n    edit 1\n      set server "10.14.0.1"\n    next\n  end\nend',
      arista_eos: 'ntp server 10.14.0.1 prefer\nntp server 10.14.0.2',
      cloud_aws_sg: 'aws ec2 modify-instance-metadata-options --http-tokens required'
    }
  },
  {
    id: 'ISO-A.5.15',
    title: 'Access Control: Automatically Terminate Inactive Sessions',
    framework: 'iso_27001',
    frameworkRef: 'ISO/IEC 27001:2022 Control A.5.15',
    severity: 'MEDIUM',
    field: 'session_idle_timeout_minutes',
    operator: 'equals',
    targetValue: 10,
    passMessage: 'Session idle timeout locked to 10 minutes.',
    failMessage: 'Unattended terminals remain active indefinitely or timeout exceeds policy limit.',
    description: 'Rules to control physical and logical access to information and other associated assets must be established.',
    remediation: {
      cisco_ios: 'line con 0\n exec-timeout 10 0\nline vty 0 15\n exec-timeout 10 0',
      juniper_junos: 'set system login idle-timeout 10',
      palo_alto: 'set deviceconfig system idle-timeout 10',
      sonic_whitebox: 'config ssh idle-timeout 600',
      fortinet_fortios: 'config system global\n  set admintimeout 10\nend',
      arista_eos: 'management ssh\n   idle-timeout 10',
      cloud_aws_sg: 'aws iam update-account-password-policy --max-session-duration 3600'
    }
  },
  {
    id: 'ISO-A.8.9',
    title: 'Configuration Management: Terminate Clear-Text Web Interfaces',
    framework: 'iso_27001',
    frameworkRef: 'ISO/IEC 27001:2022 Control A.8.9',
    severity: 'HIGH',
    field: 'insecure_http_server_disabled',
    operator: 'is_true',
    targetValue: true,
    passMessage: 'Clear-text HTTP administrative management service is disabled.',
    failMessage: 'Clear-text HTTP daemon active on production device, exposing session cookies and tokens.',
    description: 'Configurations, including security configurations, of hardware, software, services and networks must be established, documented, implemented, monitored and reviewed.',
    remediation: {
      cisco_ios: 'no ip http server\nip http secure-server',
      juniper_junos: 'delete system services web-management http\nset system services web-management https',
      palo_alto: 'set deviceconfig system service disable-http yes',
      sonic_whitebox: 'config restapi disable-http',
      fortinet_fortios: 'config system global\n  set admin-http-service disable\nend',
      arista_eos: 'no management api http-commands\n   protocol http',
      cloud_aws_sg: 'aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol tcp --port 80'
    }
  }
];
