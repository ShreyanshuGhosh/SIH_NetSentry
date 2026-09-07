// frontend/src/services/api.ts
// Centralized Type-Safe API Client for FastAPI Backend (Zero Mock States)

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || '';

export interface ApiFinding {
  rule_id: string;
  rule_title: string;
  framework: string;
  control_group_id?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'pass' | 'fail' | 'not_applicable';
  evidence_lines: { line: number; raw: string }[];
  remediation_command: string;
  framework_ref: string;
  resolved_via_exemplar?: {
    exemplar_id: string;
    source_device_id: string;
    pattern?: string;
  };
}

export interface ApiAuditSummary {
  compliance_score: number;
  total_controls: number;
  deduplicated_controls: number;
  passed: number;
  failed: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

export interface ApiAuditResult {
  audit_id: string;
  device_id: string;
  device_name: string;
  vendor: string;
  platform: string;
  frameworks: string[];
  source_hash: string;
  evaluated_at: string;
  summary: ApiAuditSummary;
  findings: ApiFinding[];
  redacted_secrets_count: number;
  parsed_lane: string;
}

export interface ApiTrainingItem {
  id: string;
  device_id: string;
  vendor: string;
  raw_command_block: string;
  line_numbers: string;
  suggested_field?: string;
  suggested_value?: any;
  confidence: number;
  status: string;
  timestamp: string;
  rejection_reason?: string;
}

export interface ApiExemplar {
  id: string;
  vendor: string;
  raw_line_pattern: string;
  mapped_field_key: string;
  mapped_value: any;
  approved_by: string;
  approved_at: string;
  times_reused: number;
}

export interface ApiBaselineField {
  key: string;
  label: string;
  frameworks: string[];
  value_type: string;
  created_by: string;
}

export interface AskAIResult {
  suggested_field?: string;
  suggested_value?: any;
  confidence: number;
  reasoning: string;
}

export const api = {
  async getHealth() {
    const res = await fetch(`${BACKEND_BASE}/api/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  },

  async getDashboardPosture() {
    const res = await fetch(`${BACKEND_BASE}/api/dashboard/posture`);
    if (!res.ok) throw new Error('Failed to fetch fleet posture metrics');
    return res.json();
  },

  async runAudit(payload: {
    raw_config: string;
    device_id?: string;
    device_name?: string;
    vendor?: string;
    platform?: string;
    frameworks?: string[];
  }): Promise<ApiAuditResult> {
    const res = await fetch(`${BACKEND_BASE}/api/audit/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Audit execution failed' }));
      throw new Error(err.detail || 'Audit execution failed');
    }
    return res.json();
  },

  async getAuditResult(auditId: string): Promise<ApiAuditResult> {
    const res = await fetch(`${BACKEND_BASE}/api/audit/${auditId}`);
    if (!res.ok) throw new Error('Audit run not found');
    return res.json();
  },

  async getTrainingQueue(): Promise<ApiTrainingItem[]> {
    const res = await fetch(`${BACKEND_BASE}/api/training/queue`);
    if (!res.ok) throw new Error('Failed to fetch training queue');
    return res.json();
  },

  async askAI(rawCommand: string, vendor: string = 'generic'): Promise<AskAIResult> {
    const res = await fetch(`${BACKEND_BASE}/api/training/ask-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_command: rawCommand, vendor }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'AI assistance request failed' }));
      throw new Error(err.detail || 'AI assistance request failed');
    }
    return res.json();
  },

  async approveTrainingItem(payload: {
    queue_id: string;
    mapped_field_key: string;
    mapped_value: any;
    approved_by?: string;
  }): Promise<ApiExemplar> {
    const res = await fetch(`${BACKEND_BASE}/api/training/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to approve exemplar');
    return res.json();
  },

  async rejectTrainingItem(queueId: string, reason: string = 'Spurious syntax block') {
    const res = await fetch(`${BACKEND_BASE}/api/training/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queue_id: queueId, reason }),
    });
    if (!res.ok) throw new Error('Failed to reject queue item');
    return res.json();
  },

  async getBaselineFields(): Promise<ApiBaselineField[]> {
    const res = await fetch(`${BACKEND_BASE}/api/training/fields`);
    if (!res.ok) throw new Error('Failed to fetch baseline fields');
    return res.json();
  },

  async registerBaselineField(payload: {
    key: string;
    label: string;
    frameworks?: string[];
    value_type?: string;
  }): Promise<ApiBaselineField> {
    const res = await fetch(`${BACKEND_BASE}/api/training/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to register baseline field');
    return res.json();
  },

  async getExemplars(): Promise<ApiExemplar[]> {
    const res = await fetch(`${BACKEND_BASE}/api/exemplars`);
    if (!res.ok) throw new Error('Failed to fetch exemplars');
    return res.json();
  },

  async getRejectedAuditLog(): Promise<ApiTrainingItem[]> {
    const res = await fetch(`${BACKEND_BASE}/api/exemplars/rejected-log`);
    if (!res.ok) throw new Error('Failed to fetch rejection audit log');
    return res.json();
  },

  async getRules() {
    const res = await fetch(`${BACKEND_BASE}/api/rules`);
    if (!res.ok) throw new Error('Failed to fetch rules catalog');
    return res.json();
  },

  getPdfReportUrl(auditId: string): string {
    return `${BACKEND_BASE}/api/reports/pdf/${auditId}`;
  },

  createLivePullWebSocket(): WebSocket {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = BACKEND_BASE ? new URL(BACKEND_BASE).host : window.location.host;
    return new WebSocket(`${proto}//${host}/ws/live-pull`);
  },
};
