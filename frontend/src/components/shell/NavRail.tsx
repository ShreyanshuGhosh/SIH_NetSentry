// src/components/shell/NavRail.tsx
// Persistent left icon-rail — Institutional Light Mode
// Warm stone palette, saffron-gold accent. Clean NetSentry logo hyperlink to landing page.

import React from 'react';
import {
  SquaresFour,
  UploadSimple,
  ShieldCheck,
  Brain,
  FileCode,
  TerminalWindow,
  GearSix,
  Shield,
} from '@phosphor-icons/react';
import logoImg from '../../assets/netsentry-logo.jpg';

export type ActiveNavTab =
  | 'dashboard'
  | 'ingest'
  | 'results'
  | 'training'
  | 'rules'
  | 'live-pull'
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
    { id: 'live-pull',    label: 'Live Pull Simulator',     icon: TerminalWindow },
  ];

  return (
    <aside
      className="w-16 md:w-56 shrink-0 border-r flex flex-col justify-between select-none z-30 sticky top-0 h-screen overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[rgba(200,131,10,0.3)] hover:scrollbar-thumb-[rgba(200,131,10,0.6)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#D1CBC0] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#A89F92]"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      <div>
        {/* Brand - Hyperlinked NetSentry Logo & Title (Clicking returns to Public Landing Page) */}
        <button
          onClick={onViewLandingPage}
          className="w-full h-14 flex items-center justify-center px-2 md:px-4 border-b hover:bg-[rgba(200,131,10,0.06)] transition-all cursor-pointer group"
          style={{ borderColor: 'var(--border-subtle)' }}
          title="NetSentry - Return to Public Landing Page"
        >
          <img src={logoImg} alt="NetSentry Logo" className="h-4 md:h-6 max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
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
