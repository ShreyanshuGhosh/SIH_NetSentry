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
  Broadcast,
  ArrowRight,
  HardDrives
} from '@phosphor-icons/react';
import { Finding } from '../../types/canonical';
import { StatusBadge } from '../shared/StatusBadge';
import { SeverityTag } from '../shared/SeverityTag';
import { MonoCodeBlock } from '../shared/MonoCodeBlock';
import { InfraRequirementsModal } from '../shared/InfraRequirementsModal';

interface FindingsTableProps {
  findings: Finding[];
  onOpenRemediation: (ruleId?: string) => void;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({
  findings,
  onOpenRemediation,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'FAIL' | 'PASS' | 'INFRA_MISSING'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);
  const [selectedInfraFinding, setSelectedInfraFinding] = useState<Finding | null>(null);

  const filtered = filter === 'ALL'
    ? findings
    : filter === 'INFRA_MISSING'
      ? findings.filter((f) => f.status.toLowerCase() === 'checking_infra_missing')
      : findings.filter((f) => f.status.toUpperCase() === filter);

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
          className="flex items-center p-1 rounded border text-xs font-mono w-fit overflow-x-auto"
          style={{
            backgroundColor: 'var(--bg-canvas)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {(['ALL', 'FAIL', 'PASS', 'INFRA_MISSING'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors whitespace-nowrap ${
                filter === mode ? 'bg-slate-900 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode === 'INFRA_MISSING' ? 'INFRA MISSING' : mode} (
              {mode === 'ALL'
                ? findings.length
                : mode === 'INFRA_MISSING'
                ? findings.filter((f) => f.status.toLowerCase() === 'checking_infra_missing').length
                : findings.filter((f) => f.status.toUpperCase() === mode).length}
              )
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      <div className="divide-y divide-slate-200">
        {filtered.map((finding) => {
          const isExpanded = expandedId === finding.ruleId;
          const isFail = finding.status === 'fail';
          const isInfraMissing = finding.status.toLowerCase() === 'checking_infra_missing';

          return (
            <div key={finding.ruleId} className="transition-colors hover:bg-slate-50">
              {/* Row Summary */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : finding.ruleId)}
                className="p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-4 cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="flex items-center gap-2 shrink-0 sm:w-36">
                    <StatusBadge status={finding.status} />
                    <SeverityTag severity={finding.severity} />
                  </div>

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
                      {isInfraMissing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInfraFinding(finding);
                          }}
                          className="inline-flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded border text-indigo-700 bg-indigo-50 border-indigo-200 font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          <Broadcast size={11} className="text-indigo-600 animate-pulse" />
                          <span>Checking Infra Missing (Click Details)</span>
                        </button>
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
                  {/* Dedicated Checking Infra Missing Callout Banner */}
                  {isInfraMissing && finding.infraRequirements && (
                    <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                          <Broadcast size={16} className="text-indigo-600 animate-pulse" />
                          <span>Checking Infrastructure Missing — External Environmental Telemetry Required</span>
                        </div>
                        <p className="text-xs text-indigo-900 leading-relaxed max-w-2xl">
                          {finding.infraRequirements.whyConfigInsufficient}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedInfraFinding(finding)}
                        className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs transition-colors"
                      >
                        <span>Click More to Know Details</span>
                        <ArrowRight size={13} weight="bold" />
                      </button>
                    </div>
                  )}

                  {/* Exemplar Provenance (§6.2, Test 2) */}
                  {finding.resolvedViaExemplar && (
                    <div className="p-3 rounded border border-sky-200 bg-sky-50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sky-950">
                        <Brain size={16} className="text-sky-600 shrink-0" />
                        <span>
                          Resolved via exemplar <strong className="font-mono text-sky-900">{finding.resolvedViaExemplar.exemplarId}</strong> (learned from device <strong className="font-mono text-sky-900">{finding.resolvedViaExemplar.sourceDeviceId}</strong>)
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-sky-700 font-semibold uppercase tracking-wider bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-sky-200 shrink-0">
                        Cross-Device Reused
                      </span>
                    </div>
                  )}

                  {/* Line-Level Evidence */}
                  <div>
                    <div className="text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                      Triggering Line-Level Evidence
                    </div>
                    {finding.evidenceLines.length > 0 ? (
                      <div className="rounded border border-slate-200 bg-[var(--bg-surface)] p-3 font-mono text-[11px] space-y-1">
                        {finding.evidenceLines.map((ev, i) => (
                          <div key={i} className="flex gap-3 text-rose-700">
                            <span className="text-slate-400 select-none w-8 text-right">L{ev.line}</span>
                            <span className="whitespace-pre">{ev.raw}</span>
                          </div>
                        ))}
                      </div>
                    ) : isInfraMissing ? (
                      <div className="rounded border border-indigo-200 bg-indigo-50/50 p-3 font-mono text-[11px] text-indigo-900">
                        External telemetry integration required. Static CLI configuration lines alone cannot verify dynamic server or physical status.
                      </div>
                    ) : (
                      <div className="rounded border border-slate-200 bg-[var(--bg-surface)] p-3 font-mono text-[11px] text-slate-500 italic">
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
                      className="p-3 rounded border border-slate-200 bg-[var(--bg-surface)] font-mono text-[11px] leading-relaxed overflow-x-auto text-emerald-800"
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

      {/* In-Depth Infrastructure Requirements Modal */}
      {selectedInfraFinding && (
        <InfraRequirementsModal
          isOpen={true}
          onClose={() => setSelectedInfraFinding(null)}
          ruleId={selectedInfraFinding.ruleId}
          ruleTitle={selectedInfraFinding.ruleTitle}
          frameworkRef={selectedInfraFinding.frameworkRef}
          infraRequirements={selectedInfraFinding.infraRequirements}
        />
      )}
    </div>
  );
};
