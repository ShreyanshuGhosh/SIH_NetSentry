// src/components/DualLaneEngine.tsx
// Architecture, Trust Boundary, and Competitive Positioning Table (§1, Phase 5)

import React from 'react';
import {
  Cpu,
  Brain,
  ShieldCheck,
  CheckCircle,
  Scales,
  LockSimple,
  Table,
} from '@phosphor-icons/react';

interface DualLaneEngineProps {
  onOpenTraining?: () => void;
}

export const DualLaneEngine: React.FC<DualLaneEngineProps> = ({ onOpenTraining }) => {
  const competitors = [
    {
      name: 'Batfish (AWS / UCLA / USC)',
      does: 'Model-based network behavior, data-plane simulation, ACL & firewall verification.',
      lacks: 'No LLM normalization of previously unseen vendor syntax; no admin-in-the-loop few-shot training.',
    },
    {
      name: 'FireMon',
      does: 'Multi-vendor firewall policy management across 600+ network platforms, audit reporting.',
      lacks: 'Fixed static vendor drivers; no adaptive/learning layer for arbitrary or newly deployed NOS syntax.',
    },
    {
      name: 'Tufin',
      does: 'Continuous compliance automation for PCI DSS, SOX, NERC CIP, and HIPAA.',
      lacks: 'Not architected around vendor-neutral AI interpretation of unknown command lines.',
    },
    {
      name: 'Itential',
      does: 'Visual workflow orchestration, multi-cloud lifecycle management, approval gates.',
      lacks: 'Orchestration-first platform, not specialized in deterministic compliance-reasoning.',
    },
    {
      name: 'Public GitHub Firewall Tools',
      does: 'Client-side regex parsers for a fixed vendor list (Cisco ASA, FortiOS, Versa).',
      lacks: 'No extensible baseline schema mapping, no confidence gating, no unknown-syntax adaptation.',
    },
    {
      name: 'StackGuardian',
      does: 'Open-source IaC config management and drift detection concept.',
      lacks: 'Early single-commit prototype, lacks verifiable end-to-end evidence pipeline.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* Header */}
      <div className="border-b pb-6" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Cpu size={22} style={{ color: 'var(--accent-primary)' }} />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Trust Boundary & Dual-Lane Architecture
          </h1>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Strict separation of concerns: AI extracts and normalizes syntax into a canonical model,
          but a deterministic rules engine, never the LLM, decides compliance verdicts.
        </p>
      </div>

      {/* Novelty Statement Box (§1) */}
      <div
        className="p-6 rounded-lg border text-sm leading-relaxed"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          borderLeft: '4px solid var(--accent-primary)',
        }}
      >
        <div className="font-mono text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1">
          The Defensible Novelty Claim (SIH26155 / NTRO)
        </div>
        <p className="text-slate-700">
          "Existing tools can parse known vendors or verify modeled network behavior. Our contribution is an
          administrator-in-the-loop AI normalization and compliance-mapping layer that learns new configuration
          syntax without backend redeployment, while preserving evidence, confidence, framework references,
          and remediation traceability."
        </p>
      </div>

      {/* Two-Column Dual-Lane Explainer (§5 Phase 5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Green Lane Card */}
        <div
          className="p-6 rounded-lg border space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--status-pass)' }} />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Green Lane: Deterministic Parser
            </h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Compiled syntactic lexers parse known vendor grammars (Cisco IOS-XE, JunOS, PAN-OS, SONiC, FortiOS, Arista EOS)
            with zero latency overhead (&lt; 15ms) and 100% deterministic reproducibility.
          </p>

          <div className="space-y-2 text-xs border-t border-slate-200 pt-3 font-mono">
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle size={14} style={{ color: 'var(--status-pass)' }} />
              <span>Zero LLM cost or latency for known dialects</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle size={14} style={{ color: 'var(--status-pass)' }} />
              <span>Full cryptographic SHA-256 line provenance</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle size={14} style={{ color: 'var(--status-pass)' }} />
              <span>Client-side secret masking active</span>
            </div>
          </div>
        </div>

        {/* Amber Lane Card */}
        <div
          className="p-6 rounded-lg border space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--status-warn)' }} />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Amber Lane: AI Normalization Layer
            </h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            When previously unencountered vendor syntax or custom Linux network commands are ingested, the system
            invokes the Few-Shot Exemplar Store to map raw lines into canonical schema parameters.
          </p>

          <div className="space-y-2 text-xs border-t border-slate-200 pt-3 font-mono">
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle size={14} style={{ color: 'var(--status-warn)' }} />
              <span>Extracts into extensible canonical parameters</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle size={14} style={{ color: 'var(--status-warn)' }} />
              <span>Routes items below 80% confidence to Review Queue</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle size={14} style={{ color: 'var(--status-warn)' }} />
              <span>Learned mappings generalize cross-device immediately</span>
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Positioning Table (§1) */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <Table size={16} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Competitive Positioning Against Existing Enterprise Audit Solutions (§1)
            </h2>
          </div>
          <span className="font-mono text-[10px] text-slate-500">Defense Audit Matrix</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 font-mono text-[11px] text-slate-600 bg-slate-50">
                <th className="p-4 w-1/4 font-semibold">Existing Tool / Platform</th>
                <th className="p-4 w-3/8 font-semibold">What It Already Does</th>
                <th className="p-4 w-3/8 text-sky-700 font-semibold">What It Does NOT Do (ApexNet Opening)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {competitors.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900 font-mono">{c.name}</td>
                  <td className="p-4 text-slate-600">{c.does}</td>
                  <td className="p-4 text-sky-900 leading-relaxed font-sans">{c.lacks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
