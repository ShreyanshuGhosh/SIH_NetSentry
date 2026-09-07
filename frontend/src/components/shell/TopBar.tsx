// src/components/shell/TopBar.tsx
// Persistent top navigation bar across authenticated console screens

import React from 'react';
import { Play, ArrowSquareOut, CheckCircle, WarningCircle, XCircle } from '@phosphor-icons/react';
import { SupportedVendor, VENDOR_DISPLAY_NAMES } from '../../types/canonical';

interface TopBarProps {
  currentDeviceName: string;
  currentVendor: SupportedVendor;
  complianceScore: number;
  passCount: number;
  failCount: number;
  isAuditing?: boolean;
  onExecuteAudit: () => void;
  onViewPublicOverview: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentDeviceName,
  currentVendor,
  complianceScore,
  passCount,
  failCount,
  isAuditing = false,
  onExecuteAudit,
  onViewPublicOverview,
}) => {
  const vendorInfo = VENDOR_DISPLAY_NAMES[currentVendor] || { name: 'Multi-Vendor', dialect: 'Standard' };

  const scoreColor =
    complianceScore >= 80
      ? 'var(--status-pass)'
      : complianceScore >= 60
      ? 'var(--status-warn)'
      : 'var(--status-fail)';

  return (
    <header
      className="h-14 border-b px-4 md:px-6 flex items-center justify-between shrink-0 select-none z-20"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Left: Operational Context & Target Device Status */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span className="text-xs font-semibold text-slate-900 truncate">
            NTRO Defense Infrastructure
          </span>
          <span className="text-slate-300 text-xs">•</span>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-slate-500 text-xs hidden md:inline">Target:</span>
          <span className="text-xs font-semibold text-slate-900 truncate">
            {currentDeviceName}
          </span>
          <span
            className="font-mono text-[10px] px-1.5 py-0.5 rounded border hidden sm:inline"
            style={{
              backgroundColor: 'var(--bg-surface-raised)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent-primary)',
            }}
          >
            {vendorInfo.dialect}
          </span>
        </div>
      </div>

      {/* Right: Telemetry metrics + Actions */}
      <div className="flex items-center gap-3 md:gap-5 shrink-0">
        {/* Real Computed Score & Counts */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="flex items-center gap-1" style={{ color: 'var(--status-pass)' }}>
              <CheckCircle size={14} weight="fill" />
              <span>{passCount}</span>
            </span>
            <span className="text-slate-300">/</span>
            <span className="flex items-center gap-1" style={{ color: 'var(--status-fail)' }}>
              <XCircle size={14} weight="fill" />
              <span>{failCount}</span>
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono"
            style={{
              backgroundColor: 'var(--bg-surface-raised)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <span className="text-slate-500 text-[10px] uppercase font-sans font-medium">Score:</span>
            <span className="font-bold tabular" style={{ color: scoreColor }}>
              {complianceScore}%
            </span>
          </div>
        </div>

        {/* Run Audit Action */}
        <button
          onClick={onExecuteAudit}
          disabled={isAuditing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white transition-all cursor-pointer shadow-sm hover:brightness-105 active:scale-95 disabled:opacity-50"
          style={{
            backgroundColor: 'var(--accent-primary)',
          }}
        >
          <Play size={13} weight="bold" />
          <span>{isAuditing ? 'Evaluating...' : 'Run Audit'}</span>
        </button>

        {/* Public Gateway Switcher */}
        <button
          onClick={onViewPublicOverview}
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer pl-2 border-l border-slate-200"
          title="Return to Public Gateway"
        >
          <span>Public Gateway</span>
          <ArrowSquareOut size={13} />
        </button>
      </div>
    </header>
  );
};
