// src/types/canonical.ts
// Phase 0: Canonical Data Architecture for ApexNet
// Vendor-agnostic, extensible compliance schema

export type SupportedVendor =
  | "cisco_ios"
  | "juniper_junos"
  | "palo_alto_panos"
  | "sonic"
  | "fortinet_fortios"
  | "arista_eos";

export const VENDOR_DISPLAY_NAMES: Record<SupportedVendor, { name: string; dialect: string; icon: string }> = {
  cisco_ios: { name: "Cisco Systems", dialect: "IOS-XE", icon: "cisco" },
  juniper_junos: { name: "Juniper Networks", dialect: "JunOS", icon: "juniper" },
  palo_alto_panos: { name: "Palo Alto Networks", dialect: "PAN-OS", icon: "paloalto" },
  sonic: { name: "SONiC Linux", dialect: "Disaggregated NOS", icon: "sonic" },
  fortinet_fortios: { name: "Fortinet", dialect: "FortiOS", icon: "fortinet" },
  arista_eos: { name: "Arista Networks", dialect: "EOS", icon: "arista" },
};

export type FrameworkId = "cis_v8" | "nist_800_53" | "disa_stig" | "iso_27001";

export interface FrameworkMeta {
  id: FrameworkId;
  name: string;
  version: string;
  authority: string;
  description: string;
}

export const SUPPORTED_FRAMEWORKS: Record<FrameworkId, FrameworkMeta> = {
  cis_v8: {
    id: "cis_v8",
    name: "CIS Critical Security Controls v8",
    version: "v8.0.2",
    authority: "Center for Internet Security",
    description: "Prescriptive technical recommendations for cyber defense benchmarks.",
  },
  nist_800_53: {
    id: "nist_800_53",
    name: "NIST SP 800-53 Rev. 5",
    version: "Rev 5.1",
    authority: "National Institute of Standards & Technology",
    description: "Security and privacy controls for federal information systems.",
  },
  disa_stig: {
    id: "disa_stig",
    name: "DISA Network Device STIG",
    version: "v2r4",
    authority: "Defense Information Systems Agency",
    description: "Hardening requirements for mission-critical defense networks.",
  },
  iso_27001: {
    id: "iso_27001",
    name: "ISO/IEC 27001:2022 Annex A",
    version: "2022",
    authority: "International Organization for Standardization",
    description: "Information security management systems and network access controls.",
  },
};

// §6.1 Baseline Field Definition (Extensible registry, appendable at runtime)
export interface BaselineFieldDefinition {
  key: string;
  label: string;
  framework: FrameworkId[];
  valueType: "boolean" | "number" | "string" | "enum";
  enumOptions?: string[];
  description: string;
  createdBy: "system" | "admin";
  createdAt: string;
}

// Initial ~10 seeded system fields
export const INITIAL_BASELINE_FIELDS: BaselineFieldDefinition[] = [
  {
    key: "sshVersion",
    label: "SSH Protocol Version (v2)",
    framework: ["cis_v8", "nist_800_53", "disa_stig", "iso_27001"],
    valueType: "number",
    description: "Enforce SSH protocol version 2 and disallow SSHv1.",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    key: "telnetEnabled",
    label: "Telnet Service Disabled",
    framework: ["cis_v8", "nist_800_53", "disa_stig"],
    valueType: "boolean",
    description: "Plaintext management daemon must be disabled.",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    key: "httpServerEnabled",
    label: "Plaintext HTTP Disabled",
    framework: ["cis_v8", "disa_stig", "iso_27001"],
    valueType: "boolean",
    description: "Unencrypted web management interfaces must be disabled.",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    key: "passwordEncryptionEnabled",
    label: "Password Storage Encryption",
    framework: ["cis_v8", "nist_800_53", "disa_stig"],
    valueType: "boolean",
    description: "Local password hashes encrypted using Type 9 / SHA-512 / strong cipher.",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    key: "aaaAuthEnabled",
    label: "Centralized AAA Authentication",
    framework: ["cis_v8", "nist_800_53", "iso_27001"],
    valueType: "boolean",
    description: "TACACS+ or RADIUS AAA authentication active on management ports.",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    key: "snmpVersion",
    label: "SNMP Protocol Version",
    framework: ["cis_v8", "nist_800_53", "disa_stig"],
    valueType: "enum",
    enumOptions: ["v1", "v2c", "v3"],
    description: "SNMPv3 with authPriv encryption required; insecure community strings banned.",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    key: "syslogServers",
    label: "Centralized Remote Syslog",
    framework: ["cis_v8", "nist_800_53", "disa_stig", "iso_27001"],
    valueType: "string",
    description: "Security events forwarded to dedicated SIEM collector IP.",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    key: "sessionIdleTimeoutMinutes",
    label: "Session Idle Lockout (≤ 15 min)",
    framework: ["cis_v8", "nist_800_53", "disa_stig"],
    valueType: "number",
    description: "Console and VTY idle session disconnect window in minutes.",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    key: "ntpConfigured",
    label: "NTP Time Synchronization",
    framework: ["cis_v8", "nist_800_53", "iso_27001"],
    valueType: "boolean",
    description: "Authorized NTP server synchronized for audit trail integrity.",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    key: "loginBannerConfigured",
    label: "Authorized Notice / Login Banner",
    framework: ["cis_v8", "disa_stig"],
    valueType: "boolean",
    description: "Mandatory legal notice displayed prior to administrative access.",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

// §6.1 Extensible Canonical Normalized Configuration Model
export interface NormalizedConfig {
  deviceId: string;
  vendor: SupportedVendor;
  platform: string;
  osVersion: string;
  // Extensible open map keyed by BaselineFieldDefinition.key
  parameters: Record<string, boolean | number | string | null>;
  evidence: {
    [parameterKey: string]: { line: number; raw: string }[];
  };
  sourceHash: string; // SHA-256 of redacted raw config
  parsedLane: "deterministic" | "llm_fallback";
  unresolvedLines: string[];
}

// §6.2 Few-Shot Exemplar Store Contract
export interface FewShotExemplar {
  id: string;
  vendor: SupportedVendor;
  rawLinePattern: string;
  mappedFieldKey: string;
  mappedValue: boolean | number | string;
  approvedBy: string;
  approvedAt: string;
  timesReused: number; // Incremented when resolving on DIFFERENT devices
}

// §6.4 Rule Engine & Findings with controlGroupId for deduplication
export type SeverityLevel = "critical" | "high" | "medium" | "low";
export type ComplianceStatus = "pass" | "fail" | "not_applicable";

export interface ComplianceRule {
  id: string;
  title: string;
  framework: FrameworkId;
  severity: SeverityLevel;
  catRating?: "CAT I" | "CAT II" | "CAT III"; // Authentic DISA STIG Category rating
  controlGroupId?: string; // Deduplicates identical underlying controls across frameworks
  description: string;
  frameworkRef: string;
  sourceNote?: string; // Paraphrased standard citation for auditability
  evaluate(parameters: NormalizedConfig["parameters"]): ComplianceStatus;
  remediation: Record<SupportedVendor, string>;
}

export interface Finding {
  ruleId: string;
  ruleTitle: string;
  framework: FrameworkId;
  controlGroupId?: string;
  status: ComplianceStatus;
  severity: SeverityLevel;
  catRating?: "CAT I" | "CAT II" | "CAT III";
  evidenceLines: { line: number; raw: string }[];
  remediationCommand: string;
  resolvedViaExemplar?: { exemplarId: string; sourceDeviceId: string };
  frameworkRef: string;
  sourceNote?: string;
}

// §6.5 Explicit Error / Failure State Machines
export type UploadState = "idle" | "uploading" | "vendor_unrecognized" | "parse_failed" | "ready";
export type LivePullState = "idle" | "connecting" | "collecting" | "parsing" | "completed" | "failed" | "timeout";

// Training Queue Item with reject tracking (§6.8)
export interface TrainingQueueItem {
  id: string;
  deviceId: string;
  vendor: SupportedVendor;
  rawCommandBlock: string;
  lineNumbers: string;
  suggestedField?: string;
  suggestedValue?: boolean | number | string;
  confidence: number;
  status: "pending" | "mapped" | "rejected";
  rejectionReason?: string;
  timestamp: string;
}
