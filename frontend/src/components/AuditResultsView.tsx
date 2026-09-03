import React, { useState } from 'react';
import {
  CheckCircle, XCircle, WarningCircle,
  FilePdf, Copy, Check, Terminal, ArrowClockwise, CaretDown, CaretUp,
} from '@phosphor-icons/react';
import { AuditFinding, ComplianceStatus, SeverityLevel } from '../types/audit';
import { AuditRunResult } from '../utils/auditEngine';
import { generateAuditPdf } from '../utils/pdfGenerator';
import { FRAMEWORKS } from '../data/rulePacks';

interface AuditResultsViewProps {
  result: AuditRunResult;
  onReAudit: () => void;
  onOpenTraining: () => void;
}

const SEV_COLOR: Record<SeverityLevel, string> = {
  CRITICAL: 'var(--crit)',
  HIGH:     'var(--fail)',
  MEDIUM:   'var(--warn)',
  LOW:      'var(--text-tertiary)',
};

const STATUS_ICON = {
  PASS: <CheckCircle size={15} weight="fill" style={{ color: 'var(--pass)' }} />,
  FAIL: <XCircle     size={15} weight="fill" style={{ color: 'var(--fail)' }} />,
  UNKNOWN:        <WarningCircle size={15} weight="fill" style={{ color: 'var(--warn)' }} />,
  NOT_APPLICABLE: <WarningCircle size={15} weight="fill" style={{ color: 'var(--text-tertiary)' }} />,
  CONFLICT:       <WarningCircle size={15} weight="fill" style={{ color: 'var(--warn)' }} />,
};

export const AuditResultsView: React.FC<AuditResultsViewProps> = ({ result, onReAudit }) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | ComplianceStatus>('ALL');
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fw = FRAMEWORKS[result.framework];
  const findings = result.findings;
  const pass  = findings.filter(f => f.status === 'PASS').length;
  const fail  = findings.filter(f => f.status === 'FAIL').length;
  const total = findings.length;
  const score = total > 0 ? Math.round((pass / total) * 100) : 0;
  const scoreColor = score >= 80 ? 'var(--pass)' : score >= 60 ? 'var(--warn)' : 'var(--fail)';

  const filtered = statusFilter === 'ALL' ? findings : findings.filter(f => f.status === statusFilter);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-14">

      {/* Scorecard - number + horizontal bar, no ring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-14 mb-14">

        {/* Score column */}
        <div className="lg:col-span-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Compliance Score
          </p>
          <div className="flex items-end gap-4 mb-4">
            <span
              className="text-8xl font-bold tabular leading-none"
              style={{ color: scoreColor, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}
            >
              {score}
            </span>
            <div className="pb-2">
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {fw?.name ?? result.framework}
              </div>
              <div className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {result.device.vendorName} {result.device.model}
              </div>
            </div>
          </div>
          <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, backgroundColor: scoreColor }}
            />
          </div>
        </div>

        {/* Stats */}
        <div
          className="lg:col-span-8 flex flex-wrap items-center gap-x-10 gap-y-4 pl-0 lg:pl-10 mt-6 lg:mt-0"
          style={{ borderLeft: '1px solid var(--border-subtle)' }}
        >
          {[
            { label: 'Pass',    count: pass,               color: 'var(--pass)' },
            { label: 'Fail',    count: fail,               color: 'var(--fail)' },
            { label: 'Other',   count: total - pass - fail, color: 'var(--warn)' },
            { label: 'Checked', count: total,              color: 'var(--text-primary)' },
          ].map(s => (
            <div key={s.label}>
              <div
                className="text-4xl font-bold tabular"
                style={{ color: s.color, fontFamily: 'var(--font-mono)' }}
              >
                {s.count}
              </div>
              <div className="font-mono text-[11px] uppercase tracking-widest mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {s.label}
              </div>
            </div>
          ))}

          <div className="ml-auto flex items-center gap-2 mt-auto">
            <button
              onClick={onReAudit}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-mono cursor-pointer transition-colors"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <ArrowClockwise size={12} />
              Re-run
            </button>
            <button
              onClick={() => generateAuditPdf(result)}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-mono cursor-pointer transition-opacity"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <FilePdf size={13} style={{ color: 'var(--accent)' }} />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {([
          { key: 'ALL',     label: `All   (${total})` },
          { key: 'FAIL',    label: `Fail  (${fail})` },
          { key: 'PASS',    label: `Pass  (${pass})` },
          { key: 'UNKNOWN', label: `N/A   (${findings.filter(f => f.status === 'UNKNOWN').length})` },
        ] as { key: 'ALL' | ComplianceStatus; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className="pb-3 px-2 font-mono text-[11px] uppercase tracking-widest transition-colors cursor-pointer border-b-2 -mb-px mr-4"
            style={{
              color: statusFilter === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderColor: statusFilter === key ? 'var(--accent)' : 'transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Findings list */}
      <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {filtered.map((finding: AuditFinding) => {
          const expanded = expandedRule === finding.ruleId;
          return (
            <div
              key={finding.ruleId}
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <button
                onClick={() => setExpandedRule(expanded ? null : finding.ruleId)}
                className="w-full flex items-start gap-4 py-4 cursor-pointer text-left"
              >
                <div className="mt-0.5 shrink-0">{STATUS_ICON[finding.status]}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {finding.title}
                    </span>
                    <span className="font-mono text-[10px] uppercase" style={{ color: SEV_COLOR[finding.severity] }}>
                      {finding.severity}
                    </span>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {finding.ruleId}
                    </span>
                  </div>
                  {!expanded && (
                    <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-tertiary)' }}>
                      {finding.message}
                    </p>
                  )}
                </div>

                <div className="shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                  {expanded ? <CaretUp size={13} /> : <CaretDown size={13} />}
                </div>
              </button>

              {expanded && (
                <div className="pb-5 pl-10 space-y-5">
                  <p className="text-sm leading-relaxed max-w-[72ch]" style={{ color: 'var(--text-secondary)' }}>
                    {finding.message}
                  </p>

                  {finding.evidenceSnippet && (
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
                        Evidence - line {finding.evidenceLine}
                      </p>
                      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                        <pre className="font-mono text-xs p-4 overflow-x-auto leading-relaxed">
                          <span className="select-none mr-4" style={{ color: 'var(--text-tertiary)' }}>{finding.evidenceLine}</span>
                          <span style={{ color: finding.status === 'FAIL' ? 'var(--fail)' : 'var(--text-mono)' }}>
                            {finding.evidenceSnippet}
                          </span>
                        </pre>
                      </div>
                    </div>
                  )}

                  {finding.status === 'FAIL' && finding.remediationCommand && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                          <Terminal size={10} className="inline mr-1.5" />
                          CLI Remediation
                        </p>
                        <button
                          onClick={() => handleCopy(finding.remediationCommand, finding.ruleId)}
                          className="flex items-center gap-1.5 font-mono text-[11px] cursor-pointer transition-colors"
                          style={{ color: 'var(--text-tertiary)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                        >
                          {copied === finding.ruleId
                            ? <Check size={11} style={{ color: 'var(--pass)' }} />
                            : <Copy size={11} />
                          }
                          {copied === finding.ruleId ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                        <pre className="font-mono text-xs p-4 overflow-x-auto leading-relaxed" style={{ color: 'var(--pass)' }}>
                          {finding.remediationCommand}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
