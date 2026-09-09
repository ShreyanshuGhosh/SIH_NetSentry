import React from 'react';
import { ShieldCheck, Cpu, ArrowLeft } from '@phosphor-icons/react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onQuickAudit: () => void;
  onBackToLanding?: () => void;
  auditScore?: number;
  passCount?: number;
  failCount?: number;
}

const NAV = [
  { id: 'pipeline',  label: 'Architecture' },
  { id: 'audit',     label: 'Audit Console' },
  { id: 'training',  label: 'Training UI' },
  { id: 'rules',     label: 'Rule Packs' },
  { id: 'telemetry', label: 'Live Pull' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onQuickAudit,
  onBackToLanding,
  auditScore,
  passCount,
  failCount,
}) => {
  const hasScore = auditScore !== undefined;

  return (
    <header className="sticky top-0 z-40 w-full" style={{ backgroundColor: 'var(--bg-base)', borderBottom: '1px solid var(--border-default)' }}>

      {/* Status strip - persistent compliance posture bar */}
      {hasScore && (
        <div
          className="w-full h-9 flex items-center px-6 gap-8 border-b"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-6 font-mono text-[11px] tracking-wider">
            <span style={{ color: 'var(--text-tertiary)' }} className="uppercase">Posture</span>

            <span className="tabular font-semibold" style={{
              color: (auditScore ?? 0) >= 80 ? 'var(--pass)'
                   : (auditScore ?? 0) >= 60 ? 'var(--warn)'
                   : 'var(--fail)'
            }}>
              {auditScore}% compliant
            </span>

            {passCount !== undefined && (
              <span style={{ color: 'var(--pass)' }}>
                {passCount} PASS
              </span>
            )}
            {failCount !== undefined && (
              <span style={{ color: 'var(--fail)' }}>
                {failCount} FAIL
              </span>
            )}
          </div>

          {/* Score bar fills the remaining width */}
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }}>
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${auditScore ?? 0}%`,
                backgroundColor: (auditScore ?? 0) >= 80 ? 'var(--pass)'
                               : (auditScore ?? 0) >= 60 ? 'var(--warn)'
                               : 'var(--fail)',
              }}
            />
          </div>

          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
            SIH26155 · NTRO
          </span>
        </div>
      )}

      {/* Main nav row */}
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-8 py-3">

        {/* Left: Back Button + Home Brand Button */}
        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-2 px-3 py-1.5 rounded-none font-mono text-xs font-semibold text-slate-300 bg-black hover:bg-[#080D1A] border border-slate-800 hover:border-cyan-800 hover:text-cyan-400 transition-all cursor-pointer shrink-0"
              title="Return to Main Landing Page"
            >
              <ArrowLeft size={14} weight="bold" className="text-cyan-400" />
              <span>Back to Home</span>
            </button>
          )}

          <button
            onClick={onBackToLanding ? onBackToLanding : () => setActiveTab('pipeline')}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
            title="ApexNet Home (Main Landing Page)"
          >
            <div className="w-7 h-7 rounded-none flex items-center justify-center border border-slate-800 bg-black group-hover:border-cyan-600 transition-colors">
              <ShieldCheck size={16} weight="bold" className="text-cyan-400" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              ApexNet
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-none border text-cyan-400 border-cyan-800/80 bg-cyan-950/60">
              HOME
            </span>
          </button>
        </div>

        {/* Nav links - mono caps, left-border active state */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors cursor-pointer rounded-none"
              style={{
                color: activeTab === item.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                backgroundColor: activeTab === item.id ? 'var(--bg-elevated)' : 'transparent',
              }}
            >
              {item.label}
              {activeTab === item.id && (
                <span
                  className="absolute left-0 top-1 bottom-1 w-px bg-cyan-400"
                />
              )}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <button
          onClick={onQuickAudit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-none font-mono font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer text-cyan-300 bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 hover:border-cyan-400 hover:text-cyan-200 active:scale-95 shrink-0"
        >
          <Cpu size={14} weight="bold" />
          <span>Quick Audit</span>
        </button>
      </div>

      {/* Mobile tabs */}
      <div
        className="md:hidden flex overflow-x-auto border-t"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
      >
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="py-2.5 px-3 font-mono text-[10px] uppercase tracking-widest text-blue-400 border-r border-zinc-800 shrink-0 font-semibold"
          >
            ← Back to Home
          </button>
        )}
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex-1 min-w-[72px] py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
            style={{
              color: activeTab === item.id ? 'var(--accent)' : 'var(--text-tertiary)',
              borderBottom: activeTab === item.id ? '1px solid var(--accent)' : '1px solid transparent',
            }}
          >
            {item.label.split(' ')[0]}
          </button>
        ))}
      </div>
    </header>
  );
};
