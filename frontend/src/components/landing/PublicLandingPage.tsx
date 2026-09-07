// src/components/landing/PublicLandingPage.tsx
// Authoritative Institutional Gateway (Zero Features, Light Mode, Direct Access, Anti-Slop)

import React from 'react';
import { ShieldCheck, ArrowRight, ShieldCheckered, IdentificationBadge } from '@phosphor-icons/react';

interface PublicLandingPageProps {
  onLaunchConsole: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onLaunchConsole }) => {
  return (
    <div
      className="min-h-[100dvh] flex flex-col justify-between selection:bg-sky-100 selection:text-sky-900"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Institutional Top Header */}
      <header
        className="h-16 border-b px-6 lg:px-12 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded flex items-center justify-center border"
            style={{
              backgroundColor: 'rgba(2, 132, 199, 0.08)',
              borderColor: 'rgba(2, 132, 199, 0.25)',
              color: 'var(--accent-primary)',
            }}
          >
            <ShieldCheck size={22} weight="bold" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900">NetSentry</div>
            <div className="text-[11px] text-slate-500 font-mono">
              NTRO, Government of India • SIH26155
            </div>
          </div>
        </div>

        <button
          onClick={onLaunchConsole}
          className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold text-white cursor-pointer shadow-sm transition-all hover:brightness-105 active:scale-95"
          style={{
            backgroundColor: 'var(--accent-primary)',
          }}
        >
          <span>Access Workspace</span>
          <ArrowRight size={14} weight="bold" />
        </button>
      </header>

      {/* Main Gateway Body */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 lg:py-16 flex flex-col justify-center">
        {/* Gateway Card */}
        <div
          className="rounded-xl border shadow-sm p-8 sm:p-12 space-y-8"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Institutional Classification Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium border"
              style={{
                backgroundColor: 'rgba(2, 132, 199, 0.08)',
                borderColor: 'rgba(2, 132, 199, 0.25)',
                color: 'var(--accent-primary)',
              }}
            >
              <IdentificationBadge size={14} weight="bold" />
              <span>OFFICIAL USE ONLY</span>
            </span>

            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border text-slate-600"
              style={{
                backgroundColor: 'var(--bg-surface-raised)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <ShieldCheckered size={14} weight="bold" />
              <span>SIH26155 • DEFENSE COMPLIANCE AUDITOR</span>
            </span>
          </div>

          {/* Heading & Authority Purpose */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              Multi-Vendor Network Security Compliance Auditor
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              Deterministic compliance verification and canonical configuration normalization
              for heterogeneous defense network infrastructure. Audits Cisco, Juniper, Palo Alto,
              SONiC, Fortinet, and Arista against national and defense benchmarks.
            </p>
          </div>

          {/* Primary Access CTA */}
          <div className="pt-2">
            <button
              onClick={onLaunchConsole}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all cursor-pointer hover:brightness-105 active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              <span>Access NetSentry Workspace</span>
              <ArrowRight size={16} weight="bold" />
            </button>
            <p className="text-[12px] text-slate-500 mt-2.5">
              Direct access to live auditing console, baseline training GUI, and remediation scanner.
            </p>
          </div>

          {/* System Telemetry & Operational Parameters Strip */}
          <div
            className="pt-6 border-t grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-slate-600"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div>
              <div className="text-[11px] text-slate-600 uppercase font-semibold mb-1">
                Supported Vendor Dialects
              </div>
              <div>Cisco IOS-XE • JunOS • PAN-OS • SONiC • FortiOS • Arista EOS</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-600 uppercase font-semibold mb-1">
                Audit Framework Benchmarks
              </div>
              <div>CIS Controls v8 • NIST SP 800-53 • DISA STIG • ISO 27001</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-600 uppercase font-semibold mb-1">
                Engine Architecture
              </div>
              <div>Dual-Lane: Deterministic Green Lane + Few-Shot Amber Lane</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-600 uppercase font-semibold mb-1">
                Data Provenance & Privacy
              </div>
              <div>Client-Side Memory Redaction (SHA-256 Secret Provenance)</div>
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Verification Footer */}
      <footer
        className="border-t py-4 px-6 lg:px-12 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div>National Technical Research Organisation (NTRO) • Government of India</div>
        <div className="font-mono text-[11px] text-slate-500">
          Smart India Hackathon 2026 • SIH26155
        </div>
      </footer>
    </div>
  );
};
