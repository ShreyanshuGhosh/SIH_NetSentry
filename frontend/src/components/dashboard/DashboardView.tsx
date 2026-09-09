// src/components/dashboard/DashboardView.tsx
// Authenticated Home Screen: Fleet Compliance Posture & Audits Overview (Next-Gen Operator Console)

import React, { useState } from 'react';
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
  MagnifyingGlass,
  Copy,
  Check,
} from '@phosphor-icons/react';
import { ActiveNavTab } from '../shell/NavRail';
import { EngineEvaluationResult } from '../../engine/ruleEngine';
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
  const [selectedAuditIndex, setSelectedAuditIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Aggregate stats across recent audited devices
  const totalAudited = recentAudits.length;
  const avgScore = totalAudited > 0
    ? Math.round(recentAudits.reduce((acc, a) => acc + a.score, 0) / totalAudited)
    : 0;
  const totalPass = recentAudits.reduce((acc, a) => acc + a.pass, 0);
  const totalFail = recentAudits.reduce((acc, a) => acc + a.fail, 0);

  const avgScoreColor =
    avgScore >= 80 ? 'var(--status-pass)' : avgScore >= 60 ? 'var(--status-warn)' : 'var(--status-fail)';

  const activeAudit = recentAudits[selectedAuditIndex] || recentAudits[0];

  const handleCopyRemediation = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredAudits = recentAudits.filter(
    (a) =>
      a.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-[1500px] mx-auto space-y-6 sm:space-y-8">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
              Security Posture Dashboard
            </h1>
            <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Perimeter Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Real-time compliance telemetry across defense perimeter switches, routers, and firewalls.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('ingest')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <UploadSimple size={15} weight="bold" />
            <span>Ingest & Audit Config</span>
          </button>

          <button
            onClick={() => onNavigate('training')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors border cursor-pointer hover:bg-slate-50 text-slate-700 shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Brain size={15} className="text-slate-600" />
            <span>Review Queue</span>
            {pendingTrainingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                {pendingTrainingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4 Fleet Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-xl border shadow-2xs transition-all hover:shadow-sm"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-rajdhani font-semibold uppercase text-slate-500 tracking-wider">
              Fleet Compliance Index
            </span>
            <ShieldCheck size={18} className="text-sky-600" weight="duotone" />
          </div>
          <div className="text-3xl font-bold font-chakra tabular mb-1" style={{ color: avgScoreColor }}>
            {avgScore}%
          </div>
          <div className="text-xs text-slate-500">Mean score across {totalAudited} audited nodes</div>
        </div>

        <div
          className="p-5 rounded-xl border shadow-2xs transition-all hover:shadow-sm"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-rajdhani font-semibold uppercase text-slate-500 tracking-wider">
              Controls Passed
            </span>
            <CheckCircle size={18} className="text-emerald-600" weight="duotone" />
          </div>
          <div className="text-3xl font-bold font-chakra tabular text-emerald-600 mb-1">
            {totalPass}
          </div>
          <div className="text-xs text-slate-500">Verified line-level rule matches</div>
        </div>

        <div
          className="p-5 rounded-xl border shadow-2xs transition-all hover:shadow-sm"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-rajdhani font-semibold uppercase text-slate-500 tracking-wider">
              Controls Failed
            </span>
            <XCircle size={18} className="text-rose-600" weight="duotone" />
          </div>
          <div className="text-3xl font-bold font-chakra tabular text-rose-600 mb-1">
            {totalFail}
          </div>
          <div className="text-xs text-slate-500">Remediation scripts ready</div>
        </div>

        <div
          className="p-5 rounded-xl border shadow-2xs transition-all hover:shadow-sm"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-rajdhani font-semibold uppercase text-slate-500 tracking-wider">
              Training Queue
            </span>
            <Brain size={18} className="text-amber-600" weight="duotone" />
          </div>
          <div className="text-3xl font-bold font-chakra tabular text-amber-600 mb-1">
            {pendingTrainingCount}
          </div>
          <div className="text-xs text-slate-500">CLI syntax lines awaiting admin mapping</div>
        </div>
      </div>

      {/* Main Content Layout: Table (7 cols) + AI Remediation Panel (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Audited Nodes Table */}
        <div
          className="lg:col-span-7 rounded-xl border shadow-2xs overflow-hidden flex flex-col"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          {/* Table Toolbar */}
          <div
            className="px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="flex items-center gap-2">
              <HardDrives size={17} className="text-sky-600" weight="duotone" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                Audited Network Nodes
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlass size={13} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 rounded-md text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:border-sky-600 text-slate-800 placeholder:text-slate-400 font-sans transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Device Table */}
          <div className="divide-y overflow-y-auto max-h-[520px]" style={{ borderColor: 'var(--border-subtle)' }}>
            {filteredAudits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
                <div className="w-14 h-14 rounded-xl border border-cyan-500/25 bg-cyan-500/10 flex items-center justify-center">
                  <UploadSimple size={24} weight="bold" className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No audits yet</p>
                  <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                    Upload a vendor config file to run your first compliance audit and populate this dashboard.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('ingest')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-[0.97]"
                  style={{ backgroundColor: 'var(--accent-primary)', color: '#0B0F19' }}
                >
                  <UploadSimple size={14} weight="bold" />
                  Upload Config Now
                </button>
              </div>
            ) : (
              filteredAudits.map((device, idx) => {
                const vendor = VENDOR_DISPLAY_NAMES[device.vendor] || { name: device.vendor, dialect: 'Generic' };
                const scoreColor =
                  device.score >= 80 ? 'var(--status-pass)' : device.score >= 60 ? 'var(--status-warn)' : 'var(--status-fail)';
                const isSelected = selectedAuditIndex === idx;

                return (
                  <div
                    key={device.deviceId}
                    className={`p-4 transition-all flex items-center justify-between gap-4 cursor-pointer border-l-4 ${
                      isSelected
                        ? 'shadow-inner'
                        : 'border-transparent hover:bg-[var(--bg-surface-raised)]'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: 'var(--accent-subtle)', borderColor: 'var(--accent-primary)' }
                        : {}
                    }
                    onClick={() => {
                      setSelectedAuditIndex(idx);
                      onSelectAuditResult(device);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-sm font-semibold truncate font-display`}
                          style={{ color: isSelected ? 'var(--accent-primary-hover)' : 'var(--text-primary)' }}
                        >
                          {device.deviceName}
                        </span>
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded-md border font-semibold`}
                          style={
                            isSelected
                              ? { backgroundColor: 'var(--accent-subtle)', borderColor: 'var(--accent-border)', color: 'var(--accent-primary)' }
                              : { backgroundColor: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }
                          }
                        >
                          {vendor.dialect}
                        </span>
                      </div>
                      <div
                        className={`text-xs font-mono truncate`}
                        style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
                      >
                        {device.model}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold tabular" style={{ color: scoreColor }}>
                          {device.score}%
                        </div>
                        <div
                          className={`font-mono text-[10px]`}
                          style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                        >
                          {device.pass} Pass / {device.fail} Fail
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAuditResult(device);
                          onNavigate('results');
                        }}
                        className="p-1.5 rounded-md transition-colors"
                        style={{
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-surface-raised)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)'; }}
                        title="Inspect Full Audit Results"
                      >
                        <CaretRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 5 cols: AI Remediation Side Panel (from Stitch Design) */}
        <div className="lg:col-span-5">
          <div
            className="rounded-xl border shadow-2xs p-6 space-y-5 sticky top-6"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight font-display">
                  Remediation Insights
                </h3>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200">
                {activeAudit?.deviceName}
              </span>
            </div>

            {/* Failing Rule Highlight */}
            {activeAudit?.auditResult?.findings?.find((f: any) => f.status === 'FAIL') ? (
              (() => {
                const failingRule = activeAudit.auditResult.findings.find((f: any) => f.status === 'FAIL')!;
                return (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-rose-700">
                          {failingRule.ruleId}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                          {failingRule.severity} Failure
                        </span>
                      </div>
                      <p className="text-xs text-rose-950 font-medium leading-snug">
                        {failingRule.ruleTitle || failingRule.ruleId}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-mono font-semibold uppercase text-slate-500">
                        Generated Hardening Patch ({activeAudit.vendor})
                      </div>
                      <div className="relative group">
                        <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                          {failingRule.remediationCommand || `no ${failingRule.ruleId.toLowerCase()}\nsecurity hardening enable`}
                        </pre>
                        <button
                          onClick={() =>
                            handleCopyRemediation(
                              failingRule.remediationCommand || `no ${failingRule.ruleId.toLowerCase()}\nsecurity hardening enable`
                            )
                          }
                          className="absolute right-2 top-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="Copy CLI Commands"
                        >
                          {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('remediation')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      <span>Apply in Tactical Diff-Scrubber</span>
                      <ArrowRight size={14} weight="bold" />
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="p-6 text-center space-y-2 bg-emerald-50/50 rounded-lg border border-emerald-200/60">
                <CheckCircle size={32} className="text-emerald-600 mx-auto" weight="fill" />
                <h4 className="text-xs font-semibold text-emerald-900">Perimeter Node Fully Hardened</h4>
                <p className="text-[11px] text-emerald-700">
                  All compliance checks passed line-by-line with zero failed policies.
                </p>
              </div>
            )}

            {/* Quick Links */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <button
                onClick={() => onNavigate('training')}
                className="flex items-center gap-1.5 hover:text-sky-600 transition-colors font-medium cursor-pointer"
              >
                <Brain size={14} />
                <span>Training Queue ({pendingTrainingCount})</span>
              </button>
              <button
                onClick={() => onNavigate('remediation')}
                className="flex items-center gap-1.5 hover:text-sky-600 transition-colors font-medium cursor-pointer"
              >
                <GitDiff size={14} />
                <span>Diff Scrubber</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
