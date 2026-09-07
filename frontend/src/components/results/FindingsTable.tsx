// src/components/results/FindingsTable.tsx
// Line-level compliance findings table with vendor CLI remediation and exemplar traceability (§6.2, §6.4)

import React, { useState } from 'react';
import {
  CaretDown,
  CaretUp,
  Copy,
  Check,
  Terminal,
  ShieldWarning,
  GitDiff,
  Brain,
} from '@phosphor-icons/react';
import { Finding } from '../../types/canonical';
import { StatusBadge } from '../shared/StatusBadge';
import { SeverityTag } from '../shared/SeverityTag';
import { MonoCodeBlock } from '../shared/MonoCodeBlock';

interface FindingsTableProps {
  findings: Finding[];
  onOpenRemediation: (ruleId?: string) => void;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({
  findings,
  onOpenRemediation,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'FAIL' | 'PASS'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);

  const filtered = filter === 'ALL' ? findings : findings.filter((f) => f.status.toUpperCase() === filter);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRuleId(id);
    setTimeout(() => setCopiedRuleId(null), 2000);
  };

  return (
    <div
      className="rounded-lg border overflow-hidden space-y-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Table Toolbar */}
      <div
        className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <ShieldWarning size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Rule Compliance Findings ({filtered.length} Evaluated)
          </h2>
        </div>

        {/* Filter Pills */}
        <div
          className="flex items-center p-1 rounded border text-xs font-mono w-fit"
          style={{
            backgroundColor: 'var(--bg-canvas)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {(['ALL', 'FAIL', 'PASS'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                filter === mode ? 'bg-slate-900 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode} ({mode === 'ALL' ? findings.length : findings.filter((f) => f.status.toUpperCase() === mode).length})
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      <div className="divide-y divide-slate-200">
        {filtered.map((finding) => {
          const isExpanded = expandedId === finding.ruleId;
          const isFail = finding.status === 'fail';

          return (
            <div key={finding.ruleId} className="transition-colors hover:bg-slate-50">
              {/* Row Summary */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : finding.ruleId)}
                className="p-4 flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <StatusBadge status={finding.status} />
                  <SeverityTag severity={finding.severity} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-900 truncate">
                        {finding.ruleId}: {finding.ruleTitle}
                      </span>
                      {finding.resolvedViaExemplar && (
                        <span
                          className="hidden md:inline-flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.2 rounded border text-sky-700 bg-sky-50 border-sky-200 font-medium"
                        >
                          <Brain size={11} />
                          <span>Learned from Few-Shot Store</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                      {finding.frameworkRef}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {finding.evidenceLines.length > 0 && (
                    <span className="font-mono text-[10px] text-slate-500 hidden sm:inline">
                      Line {finding.evidenceLines[0].line}
                    </span>
                  )}
                  {isExpanded ? <CaretUp size={14} className="text-slate-500" /> : <CaretDown size={14} className="text-slate-500" />}
                </div>
              </div>

              {/* Row Expanded Details (Evidence + CLI Remediation) */}
              {isExpanded && (
                <div
                  className="px-6 py-5 border-t space-y-4 text-xs"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {/* Line-Level Evidence */}
                  <div>
                    <div className="text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                      Triggering Line-Level Evidence
                    </div>
                    {finding.evidenceLines.length > 0 ? (
                      <div className="rounded border border-slate-200 bg-white p-3 font-mono text-[11px] space-y-1">
                        {finding.evidenceLines.map((ev, i) => (
                          <div key={i} className="flex gap-3 text-rose-700">
                            <span className="text-slate-400 select-none w-8 text-right">L{ev.line}</span>
                            <span className="whitespace-pre">{ev.raw}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded border border-slate-200 bg-white p-3 font-mono text-[11px] text-slate-500 italic">
                        Control omitted in configuration; negative check trigger (absence of mandatory hardening directive).
                      </div>
                    )}
                  </div>

                  {/* Vendor CLI Remediation */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[10px] uppercase font-mono text-slate-500">
                        Vendor-Specific CLI Remediation Command
                      </div>
                      <button
                        onClick={() => handleCopy(finding.remediationCommand, finding.ruleId)}
                        className="flex items-center gap-1 text-[11px] font-mono text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        {copiedRuleId === finding.ruleId ? (
                          <>
                            <Check size={12} style={{ color: 'var(--status-pass)' }} />
                            <span style={{ color: 'var(--status-pass)' }}>Copied CLI</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy CLI</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre
                      className="p-3 rounded border border-slate-200 bg-white font-mono text-[11px] leading-relaxed overflow-x-auto text-emerald-800"
                    >
                      {finding.remediationCommand}
                    </pre>
                  </div>

                  {/* Remediation CTA */}
                  {isFail && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onOpenRemediation(finding.ruleId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white transition-all cursor-pointer shadow-sm hover:brightness-110"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      >
                        <GitDiff size={14} weight="bold" />
                        <span>Send to Remediation Diff-Scrubber</span>
                      </button>
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
