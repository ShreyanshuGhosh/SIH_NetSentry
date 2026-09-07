// src/components/results/PostureSummaryStrip.tsx
// Top posture summary strip showing deduplicated pass/fail counts and severity breakdown (§6.4)

import React from 'react';
import { ShieldCheck, WarningCircle, XCircle, CheckCircle } from '@phosphor-icons/react';
import { EvaluatedAuditSummary } from '../../engine/ruleEngine';

interface PostureSummaryStripProps {
  summary: EvaluatedAuditSummary;
  frameworkName: string;
  deviceName: string;
  platform: string;
  sourceHash: string;
}

export const PostureSummaryStrip: React.FC<PostureSummaryStripProps> = ({
  summary,
  frameworkName,
  deviceName,
  platform,
  sourceHash,
}) => {
  const score = summary.complianceScore;
  const scoreColor =
    score >= 80 ? 'var(--status-pass)' : score >= 60 ? 'var(--status-warn)' : 'var(--status-fail)';

  return (
    <div
      className="p-6 rounded-lg border space-y-6"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Top Meta Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
            <span>{deviceName}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-mono text-[11px]">{platform}</span>
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            Evaluated against: <span className="text-slate-900 font-semibold">{frameworkName}</span>
          </div>
        </div>

        <div className="font-mono text-[10px] text-slate-500 truncate">
          Source Hash: {sourceHash.substring(0, 24)}...
        </div>
      </div>

      {/* Score & Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Large Score Card (4 cols) */}
        <div className="md:col-span-4 flex items-center gap-4">
          <div
            className="text-6xl font-bold font-mono tabular tracking-tight"
            style={{ color: scoreColor }}
          >
            {score}%
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">Compliance Index</div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              {summary.passed} of {summary.deduplicatedControls} controls passed
            </div>
            <div className="font-mono text-[10px] text-slate-400 mt-0.5">
              (Deduplicated across frameworks)
            </div>
          </div>
        </div>

        {/* Breakdown Counts (4 cols) */}
        <div className="md:col-span-4 grid grid-cols-2 gap-3 border-l border-r border-slate-200 px-0 md:px-6">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} weight="fill" style={{ color: 'var(--status-pass)' }} />
            <div>
              <div className="text-sm font-bold font-mono text-slate-900 tabular">{summary.passed}</div>
              <div className="text-[10px] text-slate-500 uppercase font-mono">Passed</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <XCircle size={18} weight="fill" style={{ color: 'var(--status-fail)' }} />
            <div>
              <div className="text-sm font-bold font-mono text-slate-900 tabular">{summary.failed}</div>
              <div className="text-[10px] text-slate-500 uppercase font-mono">Failed</div>
            </div>
          </div>
        </div>

        {/* Severity Breakdown Bar (4 cols) */}
        <div className="md:col-span-4 space-y-2">
          <div className="text-[10px] uppercase font-mono text-slate-500 flex justify-between">
            <span>Failure Severity Breakdown</span>
            <span>{summary.criticalCount + summary.highCount + summary.mediumCount + summary.lowCount} total</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
            <div className="p-1.5 rounded border border-rose-200 bg-rose-50 text-rose-700">
              <div className="font-bold">{summary.criticalCount}</div>
              <div className="text-[9px] text-rose-600">CRIT</div>
            </div>
            <div className="p-1.5 rounded border border-orange-200 bg-orange-50 text-orange-700">
              <div className="font-bold">{summary.highCount}</div>
              <div className="text-[9px] text-orange-600">HIGH</div>
            </div>
            <div className="p-1.5 rounded border border-amber-200 bg-amber-50 text-amber-700">
              <div className="font-bold">{summary.mediumCount}</div>
              <div className="text-[9px] text-amber-600">MED</div>
            </div>
            <div className="p-1.5 rounded border border-slate-200 bg-slate-100 text-slate-700">
              <div className="font-bold">{summary.lowCount}</div>
              <div className="text-[9px] text-slate-500">LOW</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
