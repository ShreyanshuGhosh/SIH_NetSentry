export type VendorId = 
  | 'cisco_ios'
  | 'juniper_junos'
  | 'palo_alto'
  | 'palo_alto_panos'
  | 'sonic'
  | 'sonic_whitebox'
  | 'fortinet_fortios'
  | 'arista_eos'
  | 'cloud_aws_sg';

export type FrameworkId = 
  | 'cis_v8' 
  | 'nist_800_53' 
  | 'disa_stig' 
  | 'iso_27001';

export type ComplianceStatus = 
  | 'PASS' 
  | 'FAIL' 
  | 'UNKNOWN' 
  | 'NOT_APPLICABLE' 
  | 'CONFLICT';

export type SeverityLevel = 
  | 'CRITICAL' 
  | 'HIGH' 
  | 'MEDIUM' 
  | 'LOW';

export type ParsingLane = 
  | 'deterministic' 
  | 'llm_fallback';

export interface FieldExtraction {
  value: any;
  confidence: number;
  evidenceLine: number;
  evidenceSnippet: string;
  sourceLane: ParsingLane;
  fewShotApplied?: boolean;
}

export interface SecurityBaselineModel {
  hostname?: string;
  vendor: VendorId;
  os_version?: string;
  ssh_version: FieldExtraction;
  telnet_disabled: FieldExtraction;
  snmp_version: FieldExtraction;
  snmp_default_community_disabled: FieldExtraction;
  aaa_authentication_enabled: FieldExtraction;
  remote_syslog_enabled: FieldExtraction;
  syslog_servers: FieldExtraction;
  ntp_servers_configured: FieldExtraction;
  ntp_authenticated: FieldExtraction;
  session_idle_timeout_minutes: FieldExtraction;
  login_banner_present: FieldExtraction;
  insecure_http_server_disabled: FieldExtraction;
  unencrypted_passwords_disabled: FieldExtraction;
}

export interface AuditRule {
  id: string;
  title: string;
  framework: FrameworkId;
  frameworkRef: string;
  severity: SeverityLevel;
  field: keyof SecurityBaselineModel;
  operator: 'equals' | 'greater_equal' | 'contains' | 'is_true' | 'is_false' | 'not_empty';
  targetValue: any;
  passMessage: string;
  failMessage: string;
  remediation: Partial<Record<VendorId, string>> & Record<string, any>;
  description: string;
}

export interface AuditFinding {
  ruleId: string;
  title: string;
  framework: FrameworkId;
  frameworkRef: string;
  severity: SeverityLevel;
  status: ComplianceStatus;
  evidenceLine: number;
  evidenceSnippet: string;
  confidence: number;
  sourceLane: ParsingLane;
  valueFound: any;
  expectedValue: any;
  message: string;
  remediationCommand: string;
  remediationRationale: string;
}

export interface TrainingItem {
  id: string;
  vendor: VendorId;
  rawCommandBlock: string;
  lineNumbers: string;
  suggestedField: keyof SecurityBaselineModel;
  confidence: number;
  status: 'pending' | 'mapped';
  targetField?: keyof SecurityBaselineModel;
  targetValue?: any;
  adminNote?: string;
  mappedAt?: string;
}

export interface FewShotExemplar {
  id: string;
  vendor: VendorId;
  rawSyntax: string;
  mappedField: string;
  mappedValue: any;
  contributor: string;
  timestamp: string;
}

export interface SampleDeviceConfig {
  id: string;
  name: string;
  vendor: VendorId;
  vendorName: string;
  deviceType: 'Router' | 'Switch' | 'Firewall' | 'White-Box' | 'Cloud Gateway';
  model: string;
  serialNumber: string;
  osVersion: string;
  rawText: string;
  redactedSecretsCount: number;
}
