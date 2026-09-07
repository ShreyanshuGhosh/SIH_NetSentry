import { FewShotExemplar, TrainingItem } from '../types/audit';

export const INITIAL_FEW_SHOT_EXEMPLARS: FewShotExemplar[] = [
  {
    id: 'fse-01',
    vendor: 'sonic_whitebox',
    rawSyntax: '"SSH": { "global": { "idle_timeout": "600" } }',
    mappedField: 'session_idle_timeout_minutes',
    mappedValue: 10,
    contributor: 'SecOps Admin (NTRO)',
    timestamp: '2026-08-28 10:14:22'
  },
  {
    id: 'fse-02',
    vendor: 'fortinet_fortios',
    rawSyntax: 'set admin-telnet-service disable',
    mappedField: 'telnet_disabled',
    mappedValue: true,
    contributor: 'Lead Network Engineer',
    timestamp: '2026-08-29 16:30:11'
  },
  {
    id: 'fse-03',
    vendor: 'juniper_junos',
    rawSyntax: 'set system services ssh protocol-version v2',
    mappedField: 'ssh_version',
    mappedValue: 2,
    contributor: 'Compliance Auditor',
    timestamp: '2026-09-01 09:05:44'
  }
];

export const INITIAL_TRAINING_QUEUE: TrainingItem[] = [
  {
    id: 'train-sonic-01',
    vendor: 'sonic_whitebox',
    rawCommandBlock: '"fast_reboot_watchdog": "enabled"',
    lineNumbers: 'Lines 41-43',
    suggestedField: 'insecure_http_server_disabled',
    confidence: 0.46,
    status: 'pending'
  },
  {
    id: 'train-arista-02',
    vendor: 'arista_eos',
    rawCommandBlock: 'transceiver qsfp default-mode 4x10G',
    lineNumbers: 'Line 4',
    suggestedField: 'login_banner_present',
    confidence: 0.52,
    status: 'pending'
  },
  {
    id: 'train-juniper-03',
    vendor: 'juniper_junos',
    rawCommandBlock: 'telnet {\n    /* legacy remote console */\n}',
    lineNumbers: 'Lines 33-35',
    suggestedField: 'telnet_disabled',
    confidence: 0.61,
    status: 'pending'
  }
];
