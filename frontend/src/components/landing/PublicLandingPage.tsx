// src/components/landing/PublicLandingPage.tsx
// ApexNet — Premium Institutional Landing Page
// DESIGN_VARIANCE: 6 / MOTION_INTENSITY: 3 / VISUAL_DENSITY: 5
// Design language: Editorial · Real product UI illustrations · Raksha-class premium
// Palette: Warm Stone (#F5F0E8 canvas) + Saffron Gold (#C8830A accent). Zero blue/violet.

import React, { useCallback } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import {
  ShieldCheck, ArrowRight, UploadSimple, Cpu, FilePdf,
  CheckCircle, XCircle, LockKey, ArrowLineRight, SealCheck,
  ShieldWarning, ArrowSquareRight, FileText, Warning,
  Globe, HardDrives, ArrowUp,
} from '@phosphor-icons/react';

interface PublicLandingPageProps {
  onLaunchConsole: (configId?: string, targetTab?: string) => void;
}

const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

// ─── Inline Product Mock: Audit Report Card ────────────────────────────────────
const AuditReportMock: React.FC = () => (
  <div
    className="rounded-2xl border overflow-hidden shadow-xl"
    style={{
      backgroundColor: '#FFFFFF',
      borderColor: '#E4E0D8',
      boxShadow: '0 24px 64px rgba(30,28,26,0.14), 0 4px 12px rgba(30,28,26,0.08)',
    }}
  >
    {/* Header bar */}
    <div
      className="px-5 py-4 flex items-center justify-between border-b"
      style={{ backgroundColor: '#FAFAF8', borderColor: '#E4E0D8' }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ backgroundColor: 'rgba(200,131,10,0.12)', border: '1px solid rgba(200,131,10,0.30)' }}
        >
          <ShieldCheck size={14} weight="bold" className="text-[#C8830A]" />
        </div>
        <span className="text-xs font-bold text-[#1E1C1A]">Audit Report</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase"
          style={{
            backgroundColor: 'rgba(45,106,63,0.10)',
            borderColor: 'rgba(45,106,63,0.30)',
            color: '#1E4D2B',
          }}
        >
          SIGNED PDF
        </span>
      </div>
    </div>

    {/* Device identity block */}
    <div className="px-5 py-4 border-b" style={{ borderColor: '#E4E0D8' }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono text-[#A89F92] uppercase tracking-wider mb-1">Device Node</div>
          <div className="text-sm font-bold text-[#1E1C1A] font-mono">EDGE-SW01</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-[#7C7269]">IOS-XE 17.6.1</span>
            <span className="text-[#D1CBC0]">·</span>
            <span className="text-[10px] font-mono text-[#7C7269]">SN: FCW2142L0BZ</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-[#A89F92] uppercase tracking-wider mb-1">Score</div>
          <div className="text-2xl font-extrabold font-mono text-[#2D6A3F] tabular">87%</div>
          <div className="flex items-center gap-1 mt-0.5 justify-end">
            <CheckCircle size={10} weight="fill" className="text-[#2D6A3F]" />
            <span className="text-[10px] font-mono text-[#2D6A3F]">10 Pass</span>
            <XCircle size={10} weight="fill" className="text-[#B91C1C]" />
            <span className="text-[10px] font-mono text-[#B91C1C]">2 Fail</span>
          </div>
        </div>
      </div>
    </div>

    {/* Findings list */}
    <div className="divide-y" style={{ borderColor: '#E4E0D8' }}>
      {[
        { id: 'CIS-1.1.4', title: 'SSHv2 Enforcement', status: 'PASS', sev: null, line: 'ip ssh version 2' },
        { id: 'CIS-1.2.1', title: 'Telnet Disabled', status: 'PASS', sev: null, line: 'no service telnet' },
        { id: 'NIST-SC-7', title: 'Boundary Protection', status: 'FAIL', sev: 'HIGH', line: 'line 40: missing ACL' },
        { id: 'CIS-3.1', title: 'SNMPv3 Privacy', status: 'FAIL', sev: 'CRITICAL', line: 'snmp-server community ...' },
      ].map((f) => (
        <div key={f.id} className="px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {f.status === 'PASS' ? (
              <CheckCircle size={14} weight="fill" className="text-[#2D6A3F] shrink-0" />
            ) : (
              <XCircle size={14} weight="fill" className="text-[#B91C1C] shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-[#7C7269]">{f.id}</span>
                {f.sev && (
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-px rounded uppercase"
                    style={{
                      backgroundColor: f.sev === 'CRITICAL' ? 'rgba(185,28,28,0.12)' : 'rgba(161,98,7,0.12)',
                      color: f.sev === 'CRITICAL' ? '#B91C1C' : '#A16207',
                    }}
                  >
                    {f.sev}
                  </span>
                )}
              </div>
              <div className="text-xs text-[#1E1C1A] font-medium truncate">{f.title}</div>
            </div>
          </div>
          <div
            className="text-[9px] font-mono px-2 py-1 rounded shrink-0 truncate max-w-[130px]"
            style={{ backgroundColor: '#F5F4F0', color: '#7C7269', border: '1px solid #E4E0D8' }}
          >
            {f.line}
          </div>
        </div>
      ))}
    </div>

    {/* SHA strip */}
    <div
      className="px-5 py-3 flex items-center gap-2"
      style={{ backgroundColor: '#FAFAF8', borderTop: '1px solid #E4E0D8' }}
    >
      <LockKey size={11} weight="bold" className="text-[#A89F92]" />
      <span className="text-[9px] font-mono text-[#A89F92] truncate">SHA-256: a4f2c8...d9e1b7</span>
      <span className="ml-auto text-[9px] font-mono text-[#A89F92]">CIS · NIST · STIG</span>
    </div>
  </div>
);

// ─── Inline Product Mock: Config Ingestion ─────────────────────────────────────
const IngestionMock: React.FC = () => (
  <div
    className="rounded-2xl border overflow-hidden"
    style={{
      backgroundColor: '#FFFFFF',
      borderColor: '#E4E0D8',
      boxShadow: '0 12px 40px rgba(30,28,26,0.10)',
    }}
  >
    <div
      className="px-4 py-3 border-b flex items-center justify-between"
      style={{ backgroundColor: '#FAFAF8', borderColor: '#E4E0D8' }}
    >
      <span className="text-[11px] font-bold text-[#1E1C1A]">Config Ingestion</span>
      <span
        className="text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase"
        style={{ backgroundColor: 'rgba(200,131,10,0.10)', color: '#7C4F04', border: '1px solid rgba(200,131,10,0.25)' }}
      >
        REDACTING
      </span>
    </div>
    <div
      className="px-4 py-3 font-mono text-[10px] space-y-1"
      style={{ backgroundColor: '#F5F4F0', color: '#4A4440' }}
    >
      {[
        { line: 'hostname EDGE-SW01', color: '#4A4440' },
        { line: 'service password-encryption', color: '#4A4440' },
        { line: 'enable secret 9 $9$e7xW...', color: '#B91C1C', strike: true },
        { line: '→ [REDACTED_SECRET_01]', color: '#C8830A' },
        { line: 'ip ssh version 2', color: '#4A4440' },
        { line: 'no service telnet', color: '#2D6A3F' },
        { line: 'username admin privilege 15', color: '#4A4440' },
        { line: 'secret 5 $1$abc$...', color: '#B91C1C', strike: true },
        { line: '→ [REDACTED_SECRET_02]', color: '#C8830A' },
      ].map((l, i) => (
        <div
          key={i}
          className="leading-relaxed"
          style={{ color: l.color, textDecoration: l.strike ? 'line-through' : 'none', opacity: l.strike ? 0.5 : 1 }}
        >
          {l.line}
        </div>
      ))}
    </div>
    <div
      className="px-4 py-2.5 flex items-center gap-2 border-t"
      style={{ backgroundColor: '#FAFAF8', borderColor: '#E4E0D8' }}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A3F] animate-pulse" />
      <span className="text-[10px] font-mono text-[#7C7269]">0 credentials in memory · SHA-256 verified</span>
    </div>
  </div>
);

// ─── Inline Product Mock: Dual-Lane diagram ─────────────────────────────────────
const DualLaneMock: React.FC = () => (
  <div
    className="rounded-2xl border overflow-hidden"
    style={{
      backgroundColor: '#FFFFFF',
      borderColor: '#E4E0D8',
      boxShadow: '0 12px 40px rgba(30,28,26,0.10)',
    }}
  >
    <div
      className="px-4 py-3 border-b"
      style={{ backgroundColor: '#FAFAF8', borderColor: '#E4E0D8' }}
    >
      <span className="text-[11px] font-bold text-[#1E1C1A]">Dual-Lane Trust Engine</span>
    </div>
    <div className="px-4 py-4 space-y-3">
      {/* Green Lane */}
      <div
        className="rounded-xl p-4 border"
        style={{ backgroundColor: 'rgba(45,106,63,0.06)', borderColor: 'rgba(45,106,63,0.20)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-mono"
              style={{ backgroundColor: 'rgba(45,106,63,0.20)', color: '#2D6A3F' }}
            >
              G
            </div>
            <span className="text-xs font-bold text-[#1E4D2B]">Green Lane — Deterministic</span>
          </div>
          <span className="font-mono text-[9px] text-[#2D6A3F] font-bold">CONFIDENCE: 1.000</span>
        </div>
        {[
          'Cisco IOS-XE · JunOS · Arista EOS',
          'ntc-templates TextFSM parser',
          'Line-number evidence mapping',
        ].map((t) => (
          <div key={t} className="flex items-center gap-1.5 text-[10px] text-[#2D6A3F] mb-1">
            <CheckCircle size={10} weight="fill" />
            {t}
          </div>
        ))}
        <div
          className="mt-2 px-2.5 py-1.5 rounded-md font-mono text-[9px]"
          style={{ backgroundColor: 'rgba(45,106,63,0.08)', color: '#1E4D2B' }}
        >
          AST_RESOLVED: line 36 → ssh_version: "2" (1.000)
        </div>
      </div>

      {/* Amber Lane */}
      <div
        className="rounded-xl p-4 border"
        style={{ backgroundColor: 'rgba(161,98,7,0.06)', borderColor: 'rgba(161,98,7,0.20)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-mono"
              style={{ backgroundColor: 'rgba(161,98,7,0.20)', color: '#A16207' }}
            >
              A
            </div>
            <span className="text-xs font-bold text-[#7C4F04]">Amber Lane — Human-Gated LLM</span>
          </div>
          <span className="font-mono text-[9px] text-[#A16207] font-bold">OPT-IN ONLY</span>
        </div>
        {[
          'PAN-OS · FortiOS · SONiC · MikroTik',
          'AsyncAnthropic + instructor + Pydantic v2',
          'Admin approval required, 0.80 threshold',
        ].map((t) => (
          <div key={t} className="flex items-center gap-1.5 text-[10px] text-[#A16207] mb-1">
            <Warning size={10} weight="fill" />
            {t}
          </div>
        ))}
        <div
          className="mt-2 px-2.5 py-1.5 rounded-md font-mono text-[9px]"
          style={{ backgroundColor: 'rgba(161,98,7,0.08)', color: '#7C4F04' }}
        >
          LLM_ASSIST: watchdog → service_hardening (0.94) — PENDING REVIEW
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Landing Page ─────────────────────────────────────────────────────────
export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onLaunchConsole }) => {
  const reduce = useReducedMotion();
  const [dragging, setDragging] = React.useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    onLaunchConsole(undefined, 'ingest');
  }, [onLaunchConsole]);

  return (
    <div
      className="w-full max-w-full overflow-x-hidden min-h-[100dvh] flex flex-col selection:bg-[rgba(200,131,10,0.18)] selection:text-[#1E1C1A]"
      style={{ backgroundColor: '#F5F0E8' }}
    >

      {/* ─── TRUST STRIP ─── */}
      <div
        className="w-full py-2 px-3 sm:px-4 text-center text-[10px] sm:text-[11px] font-mono flex flex-wrap items-center justify-center gap-1.5 sm:gap-3"
        style={{ backgroundColor: 'rgba(200,131,10,0.10)', borderBottom: '1px solid rgba(200,131,10,0.18)', color: '#7C4F04' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#C8830A] inline-block shrink-0" />
        <span className="font-semibold uppercase tracking-wider">Authorized Use Only</span>
        <span className="text-[#C8830A] opacity-40 hidden sm:inline">·</span>
        <span className="text-center">National Technical Research Organisation (NTRO) · Government of India · SIH 2026 · Project SIH26155</span>
      </div>

      {/* ─── NAV ─── */}
      <motion.header
        initial={reduce ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-40 h-[58px] flex items-center justify-between px-4 sm:px-6 lg:px-12 backdrop-blur-md border-b"
        style={{ backgroundColor: 'rgba(245,240,232,0.94)', borderColor: '#E4E0D8' }}
      >
        {/* Logo wordmark */}
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={20} weight="fill" className="text-[#C8830A]" />
          <span className="text-base font-extrabold tracking-tight text-[#1E1C1A]">ApexNet</span>
        </div>

        {/* Center nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#7C7269]">
          {[
            { label: 'Architecture', tab: 'architecture' },
            { label: 'Rule Packs', tab: 'rules' },
            { label: 'How It Works', tab: 'dashboard' },
          ].map((n) => (
            <button
              key={n.tab}
              onClick={() => onLaunchConsole(undefined, n.tab)}
              className="hover:text-[#1E1C1A] transition-colors cursor-pointer"
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#2D6A3F]"
            style={{}}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A3F] animate-pulse" />
            Engine Online
          </div>
          <button
            onClick={() => onLaunchConsole(undefined, 'ingest')}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-white bg-[#1E1C1A] hover:bg-[#2E2B28] active:scale-[0.97] transition-all cursor-pointer"
          >
            Launch Console
            <ArrowRight size={13} weight="bold" />
          </button>
        </div>
      </motion.header>

      {/* ─── HERO ─── */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 pt-10 sm:pt-16 pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">

          {/* Left: big display type */}
          <motion.div
            className="lg:col-span-6 pt-2 sm:pt-4"
            variants={stagger}
            initial={reduce ? false : 'hidden'}
            animate="show"
          >
            <motion.div variants={rise} className="mb-4 sm:mb-6">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-widest"
                style={{ color: '#C8830A' }}
              >
                <SealCheck size={12} weight="bold" />
                Defense-Grade Network Compliance
              </span>
            </motion.div>

            <motion.h1
              variants={rise}
              className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-[#1E1C1A] leading-[1.0] tracking-tight mb-2 sm:mb-3"
            >
              Upload once.
            </motion.h1>
            <motion.h1
              variants={rise}
              className="text-3xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.0] tracking-tight mb-6 sm:mb-8"
              style={{ color: '#C8830A' }}
            >
              Audit everything.
            </motion.h1>

            <motion.p
              variants={rise}
              className="text-sm sm:text-base text-[#7C7269] leading-relaxed max-w-[48ch] mb-6 sm:mb-8"
            >
              Drop any vendor config. ApexNet detects the dialect, redacts secrets, runs deterministic compliance evaluation against CIS, NIST, DISA STIG, and ISO 27001, and emits a cryptographically signed PDF — under 15ms.
            </motion.p>

            <motion.div variants={rise} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8 sm:mb-10">
              <button
                onClick={() => onLaunchConsole(undefined, 'ingest')}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-bold text-white bg-[#C8830A] hover:bg-[#A66A06] active:scale-[0.97] transition-all cursor-pointer shadow-lg shadow-[rgba(200,131,10,0.28)]"
              >
                <UploadSimple size={16} weight="bold" />
                Upload Config File
              </button>
              <button
                onClick={() => onLaunchConsole(undefined, 'dashboard')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-[#1E1C1A] border-2 border-[#D1CBC0] hover:border-[#1E1C1A] transition-all cursor-pointer"
                style={{ backgroundColor: 'transparent' }}
              >
                Open Dashboard
              </button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={rise}
              className="grid grid-cols-1 xs:grid-cols-3 gap-4 sm:gap-8 pt-6 border-t"
              style={{ borderColor: '#D1CBC0' }}
            >
              {([
                { val: '6', label: 'Vendor Parsers', note: 'IOS-XE, JunOS, PAN-OS, SONiC, FortiOS, EOS' },
                { val: '4', label: 'Compliance Packs', note: 'CIS · NIST · STIG · ISO 27001' },
                { val: '<15ms', label: 'Per Audit', note: 'Deterministic engine, zero ML latency' },
              ] as const).map((s) => (
                <div key={s.label}>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#1E1C1A] tabular">{s.val}</div>
                  <div className="text-xs font-semibold text-[#4A4440] mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-[#A89F92] mt-0.5 font-mono">{s.note}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: floating product UI */}
          <motion.div
            className="lg:col-span-6 relative"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative">
              {/* Main audit report mock */}
              <AuditReportMock />

              {/* Floating small badge — top right */}
              <motion.div
                className="absolute -top-4 -right-4 hidden lg:flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-mono font-bold border shadow-lg"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E4E0D8',
                  color: '#2D6A3F',
                  boxShadow: '0 8px 24px rgba(30,28,26,0.12)',
                }}
                animate={reduce ? {} : { y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <CheckCircle size={13} weight="fill" className="text-[#2D6A3F]" />
                Deterministic · Zero LLM
              </motion.div>

              {/* Floating vendor chip — bottom left */}
              <motion.div
                className="absolute -bottom-4 -left-4 hidden lg:flex flex-wrap gap-1.5 p-3 rounded-xl border shadow-lg max-w-[200px]"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E4E0D8',
                  boxShadow: '0 8px 24px rgba(30,28,26,0.12)',
                }}
                animate={reduce ? {} : { y: [0, 4, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="w-full text-[9px] font-mono font-bold text-[#A89F92] uppercase tracking-wider mb-1">Supported Vendors</div>
                {['Cisco IOS-XE', 'JunOS', 'PAN-OS', 'SONiC', 'FortiOS', 'Arista EOS'].map((v) => (
                  <span
                    key={v}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                    style={{ backgroundColor: '#F5F4F0', borderColor: '#E4E0D8', color: '#7C7269' }}
                  >
                    {v}
                  </span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS — Raksha-style timeline with right-side UI panels ─── */}
      <section
        className="mt-24 border-t border-b"
        style={{ backgroundColor: '#EDE8DF', borderColor: '#D1CBC0' }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#C8830A]">
              HOW APEXNET WORKS
            </span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: editorial display copy + steps */}
            <div className="lg:col-span-5">
              <motion.h2
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="text-4xl sm:text-5xl font-extrabold text-[#1E1C1A] leading-[1.0] tracking-tight mb-3"
              >
                You upload.
              </motion.h2>
              <motion.h2
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl font-extrabold leading-[1.0] tracking-tight mb-3"
                style={{ color: '#C8830A' }}
              >
                We audit it.
              </motion.h2>
              <motion.h2
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="text-4xl sm:text-5xl font-extrabold text-[#1E1C1A] leading-[1.0] tracking-tight mb-8"
              >
                You get the report.
              </motion.h2>

              <motion.p
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-sm text-[#7C7269] leading-relaxed mb-10 max-w-[44ch]"
              >
                Vendor fingerprinting, credential redaction, deterministic parsing with LLM fallback for unknown dialects, and cryptographic report signing — all automated. No account, no data retention.
              </motion.p>

              {/* Vertical step list */}
              <motion.div
                className="relative space-y-0"
                variants={stagger}
                initial={reduce ? false : 'hidden'}
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
              >
                {[
                  {
                    num: '01',
                    icon: UploadSimple,
                    title: 'Drop your config file',
                    desc: 'Any format — .cfg, .conf, .txt, .log. Secrets are redacted client-side before the engine ever sees the text.',
                    tab: 'ingest',
                    col: '#C8830A',
                  },
                  {
                    num: '02',
                    icon: Cpu,
                    title: 'Dialect detected, parsed, evaluated',
                    desc: 'TextFSM deterministic parser runs first. Falls back to human-gated LLM only for unrecognized syntax. Findings evaluated against your chosen framework.',
                    tab: 'architecture',
                    col: '#2D6A3F',
                  },
                  {
                    num: '03',
                    icon: FilePdf,
                    title: 'Signed PDF delivered',
                    desc: 'Every finding has line-level source evidence and a vendor-specific remediation CLI command. SHA-256 checksum for chain-of-custody.',
                    tab: 'results',
                    col: '#1E1C1A',
                  },
                ].map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <motion.div key={step.num} variants={rise} className="flex gap-5">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2"
                          style={{
                            backgroundColor: `${step.col}12`,
                            borderColor: `${step.col}30`,
                          }}
                        >
                          <Icon size={18} weight="bold" style={{ color: step.col }} />
                        </div>
                        {i < 2 && (
                          <div
                            className="w-px flex-1 my-2 min-h-[40px]"
                            style={{ backgroundColor: '#D1CBC0' }}
                          />
                        )}
                      </div>
                      <div className="pb-8">
                        <div
                          className="text-[10px] font-mono font-bold mb-1 uppercase tracking-wider"
                          style={{ color: step.col }}
                        >
                          STEP {step.num}
                        </div>
                        <div className="text-sm font-bold text-[#1E1C1A] mb-1">{step.title}</div>
                        <p className="text-xs text-[#7C7269] leading-relaxed mb-2">{step.desc}</p>
                        <button
                          onClick={() => onLaunchConsole(undefined, step.tab)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer hover:gap-2 transition-all"
                          style={{ color: step.col }}
                        >
                          See this step <ArrowRight size={11} weight="bold" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Right: stacked product UI panels */}
            <div className="lg:col-span-7 space-y-6">
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.55, delay: 0.1 }}
              >
                <div className="text-[10px] font-mono font-bold text-[#A89F92] uppercase tracking-wider mb-3">
                  STAGE 01 — CONFIG INGESTION
                </div>
                <IngestionMock />
              </motion.div>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.55, delay: 0.2 }}
              >
                <div className="text-[10px] font-mono font-bold text-[#A89F92] uppercase tracking-wider mb-3">
                  STAGES 02–04 — DUAL-LANE PARSING ENGINE
                </div>
                <DualLaneMock />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMPLIANCE FRAMEWORKS — editorial 2-col ─── */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
        >
          {/* Left: headline */}
          <div className="lg:col-span-4">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#C8830A] block mb-4">
              COMPLIANCE PACKS
            </span>
            <h2 className="text-4xl font-extrabold text-[#1E1C1A] tracking-tight leading-[1.05] mb-4">
              Four authoritative standards. One engine.
            </h2>
            <p className="text-sm text-[#7C7269] leading-relaxed mb-6">
              Rules are YAML. Evaluation is pure Python. No LLM touches the compliance decision — ever.
            </p>
            <button
              onClick={() => onLaunchConsole(undefined, 'rules')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C8830A] hover:text-[#A66A06] cursor-pointer transition-colors"
            >
              Explore rule packs <ArrowLineRight size={14} weight="bold" />
            </button>
          </div>

          {/* Right: framework cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                id: 'cis', label: 'CIS Controls v8', sub: 'Network Infrastructure Benchmark',
                rules: ['CIS-1.1.4 SSHv2 Enforcement', 'CIS-1.2.1 Telnet Disabled', 'CIS-3.1 SNMPv3 Privacy', 'CIS-5.1 AAA Hardening'],
                col: '#C8830A', icon: SealCheck,
              },
              {
                id: 'nist', label: 'NIST SP 800-53 Rev.5', sub: 'Federal Information Systems',
                rules: ['SC-7 Boundary Protection', 'AC-3 Access Enforcement', 'IA-2 Identification & Auth', 'AU-2 Audit Events'],
                col: '#2D6A3F', icon: ShieldCheck,
              },
              {
                id: 'stig', label: 'DISA STIG', sub: 'DoD Network Device Management',
                rules: ['CAT I Critical Findings', 'CAT II High Severity', 'SNMPv3 Auth Privacy', 'Warning Banners'],
                col: '#B91C1C', icon: ShieldWarning,
              },
              {
                id: 'iso', label: 'ISO/IEC 27001:2022', sub: 'Information Security Management',
                rules: ['A.13.1 Net Controls', 'A.13.2 Info Transfer', 'Net Segregation Policy', 'Audit Logging'],
                col: '#7C7269', icon: Globe,
              },
            ].map((fw) => {
              const Icon = fw.icon;
              return (
                <motion.div
                  key={fw.id}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl border p-5 hover:shadow-md transition-all cursor-pointer"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#E4E0D8' }}
                  onClick={() => onLaunchConsole(undefined, 'rules')}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${fw.col}12`, border: `1.5px solid ${fw.col}30` }}
                    >
                      <Icon size={17} weight="bold" style={{ color: fw.col }} />
                    </div>
                    <span
                      className="text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                      style={{ backgroundColor: `${fw.col}10`, color: fw.col, border: `1px solid ${fw.col}25` }}
                    >
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#1E1C1A] mb-0.5">{fw.label}</div>
                  <div className="text-[10px] font-mono text-[#A89F92] mb-3">{fw.sub}</div>
                  <div className="space-y-1">
                    {fw.rules.map((r) => (
                      <div key={r} className="flex items-center gap-1.5 text-[10px] text-[#7C7269] font-mono">
                        <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: fw.col }} />
                        {r}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ─── DROP / UPLOAD CALLOUT ─── */}
      <section
        className="border-t border-b"
        style={{ backgroundColor: '#EDE8DF', borderColor: '#D1CBC0' }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45 }}
            className={`relative rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer transition-all ${
              dragging ? 'border-[#C8830A] bg-[rgba(200,131,10,0.05)]' : 'border-[#C4BDB4] hover:border-[rgba(200,131,10,0.60)]'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => onLaunchConsole(undefined, 'ingest')}
          >
            <div
              className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center border-2"
              style={{ backgroundColor: 'rgba(200,131,10,0.10)', borderColor: 'rgba(200,131,10,0.30)' }}
            >
              <ArrowUp size={28} weight="bold" className="text-[#C8830A]" />
            </div>
            <p className="text-xl font-bold text-[#1E1C1A] mb-2">
              Drop config file to start audit
            </p>
            <p className="text-sm text-[#7C7269] mb-6">
              or <span className="text-[#C8830A] font-semibold underline underline-offset-2 cursor-pointer">open the audit workspace</span>
            </p>
            <p className="text-xs font-mono text-[#A89F92]">
              .cfg · .conf · .txt · .log — Cisco IOS-XE, JunOS, PAN-OS, SONiC, FortiOS, Arista EOS
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono text-[#A89F92]">
              {[
                { dot: '#2D6A3F', label: 'Credentials redacted client-side before parsing' },
                { dot: '#C8830A', label: 'Session-only — cleared on tab close' },
                { dot: '#A16207', label: 'No data sent to any server' },
              ].map(({ dot, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          <div className="lg:col-span-7">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1E1C1A] tracking-tight leading-[1.05] mb-4">
              Your network. Our audit.<br />
              <span style={{ color: '#C8830A' }}>Immediate results.</span>
            </h2>
            <p className="text-sm text-[#7C7269] leading-relaxed max-w-[52ch]">
              Upload any vendor config file and receive a full compliance report in under 15ms. No account required, no data retention, SHA-256-signed output for chain-of-custody.
            </p>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3">
            <button
              onClick={() => onLaunchConsole(undefined, 'ingest')}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-sm font-bold text-white bg-[#C8830A] hover:bg-[#A66A06] active:scale-[0.97] transition-all cursor-pointer shadow-lg shadow-[rgba(200,131,10,0.22)]"
            >
              <UploadSimple size={16} weight="bold" />
              Upload & Audit Config
            </button>
            <button
              onClick={() => onLaunchConsole(undefined, 'dashboard')}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold text-[#1E1C1A] border-2 border-[#D1CBC0] hover:border-[#1E1C1A] transition-all cursor-pointer"
              style={{ backgroundColor: 'transparent' }}
            >
              <ArrowSquareRight size={15} weight="bold" className="text-[#C8830A]" />
              Open Console Dashboard
            </button>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        className="border-t px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: '#EDE8DF', borderColor: '#D1CBC0' }}
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={15} weight="fill" className="text-[#C8830A]" />
          <span className="text-xs font-semibold text-[#4A4440]">National Technical Research Organisation (NTRO) · Government of India</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-[#A89F92]">
          <span>Smart India Hackathon 2026</span>
          <span className="text-[#D1CBC0]">·</span>
          <span>SIH26155</span>
          <span className="text-[#D1CBC0]">·</span>
          <span>ApexNet</span>
        </div>
      </footer>

    </div>
  );
};
