// src/components/shell/NavRail.tsx
// Persistent left icon-rail — Institutional Light Mode
// Warm stone palette, saffron-gold accent. Clean ApexNet logo hyperlink to landing page.

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
  onViewLandingPage?: () => void;
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
  onViewLandingPage,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard',    label: 'Dashboard',               icon: SquaresFour },
    { id: 'ingest',       label: 'Ingest & Audit',          icon: UploadSimple },
    { id: 'results',      label: 'Audit Results',           icon: ShieldCheck },
    {
      id: 'training', label: 'AI Training GUI', icon: Brain,
      badge: pendingTrainingCount > 0 ? pendingTrainingCount : undefined,
    },
    { id: 'rules',        label: 'Rule Packs',              icon: FileCode },
    { id: 'remediation',  label: 'Remediation Scanner',     icon: GitDiff },
    { id: 'live-pull',    label: 'Live Pull Simulator',     icon: TerminalWindow },
    { id: 'architecture', label: 'Trust Boundary & Dual-Lane', icon: Cpu },
  ];

  return (
    <aside
      className="w-16 md:w-56 shrink-0 border-r flex flex-col justify-between select-none z-30 min-h-screen"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      <div>
        {/* Brand — Hyperlinked ApexNet Logo & Title (Clicking returns to Public Landing Page) */}
        <button
          onClick={onViewLandingPage}
          className="w-full h-14 flex items-center px-4 gap-3 border-b text-left hover:bg-[rgba(200,131,10,0.06)] transition-all cursor-pointer group"
          style={{ borderColor: 'var(--border-subtle)' }}
          title="ApexNet — Return to Public Landing Page"
        >
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform"
            style={{ backgroundColor: 'rgba(200,131,10,0.10)', borderColor: 'rgba(200,131,10,0.30)' }}
          >
            <Shield size={17} weight="bold" className="text-[#C8830A]" />
          </div>
          <div className="hidden md:block overflow-hidden">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-extrabold text-[#1E1C1A] tracking-tight group-hover:text-[#C8830A] transition-colors">
                ApexNet
              </span>
            </div>
            <div className="text-[10px] font-mono text-[#A89F92] flex items-center gap-1 mt-0.5">
              <span>NTRO</span>
              <span className="text-[#D1CBC0]">/</span>
              <span>SIH26155</span>
            </div>
          </div>
        </button>

        {/* Nav items */}
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer relative ${
                  isActive
                    ? 'font-bold border'
                    : 'text-[#7C7269] hover:text-[#1E1C1A] hover:bg-[#EDE8DF]'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--bg-canvas)',
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)',
                      }
                    : {}
                }
              >
                <Icon
                  size={16}
                  weight={isActive ? 'bold' : 'regular'}
                  className={isActive ? 'text-[#C8830A]' : 'text-[#A89F92]'}
                />
                <span className="hidden md:inline truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <>
                    <span
                      className="hidden md:inline-flex ml-auto text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full"
                      style={{
                        backgroundColor: 'rgba(200,131,10,0.15)',
                        color: '#7C4F04',
                      }}
                    >
                      {item.badge}
                    </span>
                    <span className="md:hidden absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C8830A]" />
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Settings */}
      <div className="p-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'font-bold border'
              : 'text-[#7C7269] hover:text-[#1E1C1A] hover:bg-[#EDE8DF]'
          }`}
          style={
            activeTab === 'settings'
              ? {
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }
              : {}
          }
        >
          <GearSix size={16} weight={activeTab === 'settings' ? 'bold' : 'regular'} />
          <span className="hidden md:inline">Settings</span>
        </button>
      </div>
    </aside>
  );
};
