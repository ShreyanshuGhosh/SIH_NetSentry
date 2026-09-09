// src/components/AuditResultsView.tsx
// Comprehensive Audit Results screen composing PostureSummaryStrip, FindingsTable, and PdfReportPreview

import React from 'react';
import { Play, GitDiff, FilePdf, ArrowClockwise } from '@phosphor-icons/react';
import { EngineEvaluationResult } from '../engine/ruleEngine';
import { PostureSummaryStrip } from './results/PostureSummaryStrip';
import { FindingsTable } from './results/FindingsTable';
import { PdfReportPreview } from './results/PdfReportPreview';
import { FRAMEWORKS } from '../data/rulePacks';
import { VENDOR_DISPLAY_NAMES } from '../types/canonical';

interface AuditResultsViewProps {
  result: EngineEvaluationResult;
  deviceName?: string;
  platform?: string;
  osVersion?: string;
  onReAudit: () => void;
  onOpenRemediation: (ruleId?: string) => void;
  onOpenTraining: () => void;
}

export const AuditResultsView: React.FC<AuditResultsViewProps> = ({
  result,
  deviceName = 'Core Switch 01',
  platform = 'Catalyst 9300',
  osVersion = 'IOS-XE 17.9.4a',
  onReAudit,
  onOpenRemediation,
  onOpenTraining,
}) => {
  const frameworkNameStr = result.frameworks && result.frameworks.length > 0
    ? result.frameworks.map((fwId) => FRAMEWORKS[fwId]?.name || fwId).join(' + ')
    : 'CIS Network Benchmarks';
  const vendorInfo = VENDOR_DISPLAY_NAMES[result.vendor] || { name: result.vendor, dialect: 'Generic' };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="text-[11px] font-mono uppercase text-slate-500">
            Compliance Evaluation Record
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Audit Findings & Line-Level Evidence
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onReAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-slate-300 text-slate-700 bg-[var(--bg-surface)] hover:text-slate-900 hover:border-slate-400 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowClockwise size={13} />
            <span>Re-run Evaluation</span>
          </button>

          <button
            onClick={() => onOpenRemediation()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold text-white transition-all cursor-pointer shadow-sm hover:brightness-110 active:scale-95"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <GitDiff size={14} weight="bold" />
            <span>Open Remediation Scanner</span>
          </button>
        </div>
      </div>

      {/* Section 1: Posture Summary Strip */}
      <PostureSummaryStrip
        summary={result.summary}
        frameworkName={frameworkNameStr}
        deviceName={deviceName}
        platform={platform}
        sourceHash={result.sourceHash}
      />

      {/* Section 2: Findings Table */}
      <FindingsTable
        findings={result.findings}
        onOpenRemediation={onOpenRemediation}
      />

      {/* Section 3: PDF Report Preview & Download */}
      <PdfReportPreview
        auditResult={result}
        deviceName={deviceName}
        platform={platform}
        osVersion={osVersion}
      />
    </div>
  );
};
