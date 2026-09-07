// src/components/dashboard/DashboardView.tsx
// Authenticated Home Screen: Fleet Compliance Posture & Audits Overview

import React from 'react';
import {
  ShieldCheck,
  WarningCircle,
  XCircle,
  CheckCircle,
  UploadSimple,
  Brain,
  GitDiff,
  ArrowRight,
  CaretRight,
  HardDrives,
} from '@phosphor-icons/react';
import { ActiveNavTab } from '../shell/NavRail';
import { EngineEvaluationResult } from '../../engine/ruleEngine';
import { StatusBadge } from '../shared/StatusBadge';
import { SeverityTag } from '../shared/SeverityTag';
import { VENDOR_DISPLAY_NAMES, SupportedVendor } from '../../types/canonical';

interface DashboardViewProps {
  recentAudits: {
    deviceId: string;
    deviceName: string;
    vendor: SupportedVendor;
    model: string;
    score: number;
    pass: number;
    fail: number;
    auditResult: EngineEvaluationResult;
  }[];
  pendingTrainingCount: number;
  onNavigate: (tab: ActiveNavTab) => void;
  onSelectAuditResult: (audit: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  recentAudits,
  pendingTrainingCount,
  onNavigate,
  onSelectAuditResult,
}) => {
  // Aggregate stats across recent audited devices
  const totalAudited = recentAudits.length;
  const avgScore = totalAudited > 0
    ? Math.round(recentAudits.reduce((acc, a) => acc + a.score, 0) / totalAudited)
    : 0;
  const totalPass = recentAudits.reduce((acc, a) => acc + a.pass, 0);
  const totalFail = recentAudits.reduce((acc, a) => acc + a.fail, 0);

  const avgScoreColor =
    avgScore >= 80 ? 'var(--status-pass)' : avgScore >= 60 ? 'var(--status-warn)' : 'var(--status-fail)';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security Posture Dashboard</h1>
          <p className="text-xs text-slate-600 mt-1">
            Real-time compliance telemetry across audited defense perimeter switches, routers, and firewalls.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('ingest')}
            className="flex items-center gap-2 px-3.5 py-2 rounded text-xs font-medium text-white transition-all cursor-pointer shadow-sm hover:brightness-105 active:scale-95"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <UploadSimple size={15} weight="bold" />
            <span>Ingest & Audit Config</span>
          </button>

          <button
            onClick={() => onNavigate('training')}
            className="flex items-center gap-2 px-3.5 py-2 rounded text-xs font-medium transition-colors border cursor-pointer hover:bg-slate-100 text-slate-700"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Brain size={15} />
            <span>Review Queue</span>
            {pendingTrainingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                {pendingTrainingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4 Fleet Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-lg border shadow-xs"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-[11px] font-mono uppercase text-slate-500 mb-2">Fleet Compliance Index</div>
          <div className="text-4xl font-bold font-mono tabular mb-1" style={{ color: avgScoreColor }}>
            {avgScore}%
          </div>
          <div className="text-xs text-slate-500">Mean score across {totalAudited} audited nodes</div>
        </div>

        <div
          className="p-5 rounded-lg border shadow-xs"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-[11px] font-mono uppercase text-slate-500 mb-2">Controls Passed</div>
          <div className="text-4xl font-bold font-mono tabular text-emerald-700 mb-1">
            {totalPass}
          </div>
          <div className="text-xs text-slate-500">Verified deterministic line-level evidence</div>
        </div>

        <div
          className="p-5 rounded-lg border shadow-xs"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-[11px] font-mono uppercase text-slate-500 mb-2">Controls Failed</div>
          <div className="text-4xl font-bold font-mono tabular text-red-600 mb-1">
            {totalFail}
          </div>
          <div className="text-xs text-slate-500">Remediation scripts ready in diff-scrubber</div>
        </div>

        <div
          className="p-5 rounded-lg border shadow-xs"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-[11px] font-mono uppercase text-slate-500 mb-2">Training Queue</div>
          <div className="text-4xl font-bold font-mono tabular text-amber-600 mb-1">
            {pendingTrainingCount}
          </div>
          <div className="text-xs text-slate-500">Unrecognized CLI lines awaiting admin mapping</div>
        </div>
      </div>

      {/* Main Grid: Recent Audits & Active Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Recent Device Audits Table */}
        <div
          className="lg:col-span-8 rounded-lg border shadow-xs overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-raised)' }}
          >
            <div className="flex items-center gap-2">
              <HardDrives size={16} style={{ color: 'var(--accent-primary)' }} />
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Audited Network Nodes
              </h2>
            </div>
            <span className="font-mono text-[11px] text-slate-500">{recentAudits.length} devices evaluated</span>
          </div>

          <div className="divide-y divide-slate-200">
            {recentAudits.map((device) => {
              const vendor = VENDOR_DISPLAY_NAMES[device.vendor] || { name: device.vendor, dialect: 'Generic' };
              const scoreColor =
                device.score >= 80 ? 'var(--status-pass)' : device.score >= 60 ? 'var(--status-warn)' : 'var(--status-fail)';

              return (
                <div
                  key={device.deviceId}
                  className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                  onClick={() => {
                    onSelectAuditResult(device);
                    onNavigate('results');
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-900 truncate">{device.deviceName}</span>
                      <span
                        className="font-mono text-[10px] px-1.5 py-0.2 rounded border"
                        style={{
                          backgroundColor: 'var(--bg-surface-raised)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {vendor.dialect}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{device.model}</div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold tabular" style={{ color: scoreColor }}>
                        {device.score}%
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        {device.pass} P / {device.fail} F
                      </div>
                    </div>
                    <CaretRight size={14} className="text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 cols: Quick Workflows & Guided Operations */}
        <div className="lg:col-span-4 space-y-6">
          {/* Training Queue Callout Card */}
          <div
            className="p-5 rounded-lg border shadow-xs relative overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
              <Brain size={16} style={{ color: 'var(--status-warn)' }} />
              <span>Adaptive Training Loop</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              When an admin maps an unrecognized CLI line, it saves to the few-shot store and generalizes to
              future audits across other devices.
            </p>
            <button
              onClick={() => onNavigate('training')}
              className="w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-medium transition-colors border cursor-pointer hover:bg-slate-100 text-slate-700"
              style={{
                backgroundColor: 'var(--bg-surface-raised)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span>Review {pendingTrainingCount} Pending Syntax Blocks</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Remediation Shortcut Card */}
          <div
            className="p-5 rounded-lg border shadow-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
              <GitDiff size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>Tactical Remediation Scanner</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Drag-to-compare diff-scrubber wired across all 6 vendor operating systems. Generate atomic hardening commands.
            </p>
            <button
              onClick={() => onNavigate('remediation')}
              className="w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-medium transition-colors border cursor-pointer hover:bg-slate-100 text-slate-700"
              style={{
                backgroundColor: 'var(--bg-surface-raised)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span>Launch Diff-Scrubber</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
