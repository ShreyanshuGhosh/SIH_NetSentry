// src/components/shell/NavRail.tsx
// Persistent left icon-rail on every authenticated screen (§5)
// Dense, quiet, professional aesthetic (CrowdStrike / Palantir)

import React from 'react';
import {
  SquaresFour,
  UploadSimple,
  ShieldCheck,
  Brain,
  FileCode,
  GitDiff,
  TerminalWindow,
  Cpu,
  GearSix,
  Shield,
} from '@phosphor-icons/react';

export type ActiveNavTab =
  | 'dashboard'
  | 'ingest'
  | 'results'
  | 'training'
  | 'rules'
  | 'remediation'
  | 'live-pull'
  | 'architecture'
  | 'settings';

interface NavRailProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  pendingTrainingCount?: number;
}

interface NavItem {
  id: ActiveNavTab;
  label: string;
  icon: any;
  badge?: number;
}

export const NavRail: React.FC<NavRailProps> = ({
  activeTab,
  onSelectTab,
  pendingTrainingCount = 0,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: SquaresFour },
    { id: 'ingest', label: 'Ingest & Audit', icon: UploadSimple },
    { id: 'results', label: 'Audit Results', icon: ShieldCheck },
    {
      id: 'training',
      label: 'AI Training GUI',
      icon: Brain,
      badge: pendingTrainingCount > 0 ? pendingTrainingCount : undefined,
    },
    { id: 'rules', label: 'Rule Packs', icon: FileCode },
    { id: 'remediation', label: 'Remediation Scanner', icon: GitDiff },
    { id: 'live-pull', label: 'Live Pull Simulator', icon: TerminalWindow },
    { id: 'architecture', label: 'Trust Boundary & Dual-Lane', icon: Cpu },
  ];

  return (
    <aside
      className="w-16 md:w-56 shrink-0 border-r flex flex-col justify-between select-none z-30 min-h-screen"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div>
        {/* Brand / Logo Header */}
        <div
          className="h-14 flex items-center px-4 gap-3 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 border border-sky-200 bg-sky-50 text-sky-600"
          >
            <Shield size={17} weight="bold" />
          </div>
          <div className="hidden md:block overflow-hidden">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold text-slate-900 tracking-tight">NetSentry</span>
              <span className="font-mono text-[10px] text-slate-400 font-normal">v1.1.0</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 tracking-tight flex items-center gap-1 mt-0.5">
              <span>NTRO</span>
              <span className="text-slate-300 select-none">/</span>
              <span>SIH26155</span>
            </div>
          </div>
        </div>

        {/* Navigation items list */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors cursor-pointer group text-left relative ${
                  isActive
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--bg-surface-raised)' : 'transparent',
                }}
                title={item.label}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  />
                )}
                <Icon
                  size={18}
                  weight={isActive ? 'bold' : 'regular'}
                  style={{
                    color: isActive ? 'var(--accent-primary)' : 'inherit',
                  }}
                />
                <span className="hidden md:inline truncate">{item.label}</span>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className="ml-auto hidden md:flex items-center justify-center font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold"
                    style={{
                      backgroundColor: 'var(--status-warn-bg)',
                      color: 'var(--status-warn)',
                      border: '1px solid rgba(217, 119, 6, 0.3)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: Settings & System metadata */}
      <div className="p-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'text-slate-900 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          style={{
            backgroundColor: activeTab === 'settings' ? 'var(--bg-surface-raised)' : 'transparent',
          }}
          title="System Settings"
        >
          <GearSix size={18} />
          <span className="hidden md:inline">Settings</span>
        </button>

        <div className="hidden md:block px-3 py-2 mt-1 text-[10px] text-slate-500 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>Engine: <span className="text-slate-700 font-medium">Dual-Lane Core</span></div>
          <div>Mode: <span className="text-emerald-700 font-medium">Deterministic</span></div>
        </div>
      </div>
    </aside>
  );
};
