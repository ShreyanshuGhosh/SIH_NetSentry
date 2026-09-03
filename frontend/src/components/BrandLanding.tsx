import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cpu,
  ArrowRight,
  Terminal,
  Check,
} from '@phosphor-icons/react';
import { CyberDefenseBackground } from './CyberDefenseBackground';
import { TacticalRemediationScanner } from './TacticalRemediationScanner';
import { SecurityLockPattern } from './SecurityLockPattern';
import { MousePointerTracker } from './MousePointerTracker';

interface BrandLandingProps {
  onLaunchProduct: (vendorId?: string) => void;
}

// ── VENDOR HARDWARE BENCHMARK MATRIX ──
const VENDOR_MATRIX = [
  {
    id: 'cisco-cat9300-core',
    vendor: 'Cisco',
    model: 'Catalyst 9300',
    os: 'IOS-XE 17.9.4a',
    role: 'Core Enterprise Switch',
    lane: 'Deterministic Green',
    latency: '0.42 ms',
    benchmark: 'CIS Cisco IOS-XE Benchmark v2.0.0',
    status: 'COMPLIANT',
  },
  {
    id: 'juniper-srx345-gateway',
    vendor: 'Juniper',
    model: 'SRX-345 Gateway',
    os: 'Junos OS 22.4R1-S2',
    role: 'Security Boundary Gateway',
    lane: 'Deterministic Green',
    latency: '0.38 ms',
    benchmark: 'DISA STIG Junos Router NDM v2r1',
    status: 'COMPLIANT',
  },
  {
    id: 'paloalto-pa3220-dc',
    vendor: 'Palo Alto',
    model: 'PA-3220 NGFW',
    os: 'PAN-OS 11.0.2-h3',
    role: 'Perimeter Next-Gen Firewall',
    lane: 'Deterministic Green',
    latency: '0.51 ms',
    benchmark: 'NIST SP 800-53 Rev. 5 (SC-7, AC-3)',
    status: 'COMPLIANT',
  },
  {
    id: 'sonic-whitebox-leaf',
    vendor: 'SONiC',
    model: 'Edgecore AS7726',
    os: 'Enterprise SONiC 202311',
    role: 'Datacenter White-Box Leaf',
    lane: 'Amber + Few-Shot Store',
    latency: '142 ms',
    benchmark: 'CIS Open Network Devices v1.1.0',
    status: 'DEVIATION',
  },
  {
    id: 'fortinet-fortigate-60f',
    vendor: 'Fortinet',
    model: 'FortiGate 60F',
    os: 'FortiOS 7.4.1 GA',
    role: 'Branch Edge Firewall',
    lane: 'Deterministic Green',
    latency: '0.44 ms',
    benchmark: 'ISO/IEC 27001:2022 Control A.13.1',
    status: 'COMPLIANT',
  },
  {
    id: 'arista-7050x-leaf',
    vendor: 'Arista',
    model: '7050X3 Leaf',
    os: 'EOS 4.30.2F',
    role: 'Spine/Leaf Switch',
    lane: 'Deterministic Green',
    latency: '0.39 ms',
    benchmark: 'CIS Arista EOS Benchmark v1.2.0',
    status: 'COMPLIANT',
  },
];

// ── INSPECTOR PIPELINE STAGES ──
const INSPECTOR_STAGES = [
  {
    id: 'redact',
    tab: '01 // In-Memory Redactor',
    status: 'AIR-GAPPED :: 0-EGRESS',
    filename: 'running-config.raw',
    lines: [
      { num: 12, text: '! Hardware: Cisco Catalyst 9300 (IOS-XE 17.9.4a)', type: 'comment' },
      { num: 13, text: 'version 17.9', type: 'code' },
      { num: 14, text: 'enable secret 9 $9$mK...92  -->  [REDACTED_SECRET_HASH_01]', type: 'redact' },
      { num: 15, text: 'service password-encryption', type: 'code' },
      { num: 28, text: 'tacacs-server key 7 08224  -->  [REDACTED_SECRET_KEY_02]', type: 'redact' },
      { num: 39, text: 'line vty 0 4', type: 'code' },
      { num: 40, text: ' exec-timeout 15 0', type: 'warn' },
      { num: 41, text: ' transport input ssh', type: 'code' },
    ],
    note: 'Type 7/9 passwords, TACACS+ keys, and SNMP strings masked in memory before AST grammar tokenization.',
  },
  {
    id: 'ast',
    tab: '02 // Deterministic AST',
    status: 'LATENCY: 0.42ms',
    filename: 'baseline-normalized.json',
    lines: [
      { num: 1, text: '{', type: 'code' },
      { num: 2, text: '  "parser_lane": "deterministic_green_lane",', type: 'highlight' },
      { num: 3, text: '  "vendor_detected": "cisco_ios",', type: 'code' },
      { num: 4, text: '  "baseline": {', type: 'code' },
      { num: 5, text: '    "ssh_version": { "value": 2, "confidence": 1.0, "line": 24 },', type: 'pass' },
      { num: 6, text: '    "telnet_disabled": { "value": true, "confidence": 1.0, "line": 31 },', type: 'pass' },
      { num: 7, text: '    "session_idle_timeout_min": { "value": 15, "confidence": 1.0, "line": 40 },', type: 'warn' },
      { num: 8, text: '    "snmp_version": { "value": "v3", "confidence": 0.98, "line": 44 }', type: 'pass' },
      { num: 9, text: '  }', type: 'code' },
      { num: 10, text: '}', type: 'code' },
    ],
    note: 'Zero LLM dependency for Cisco, Juniper, Palo Alto, and Arista. Hardcoded grammar tree parser.',
  },
  {
    id: 'verdict',
    tab: '03 // YAML Rule Engine',
    status: 'VERIFICATION: ZERO_HALLUCINATION',
    filename: 'cis-v8-evaluation.yaml',
    lines: [
      { num: 1, text: '- rule_id: CIS-2.1.1', type: 'code' },
      { num: 2, text: '  check: baseline.ssh_version.value == 2', type: 'code' },
      { num: 3, text: '  verdict: PASS [Enforced on VTY 0-15]', type: 'pass' },
      { num: 4, text: '- rule_id: CIS-2.1.2', type: 'code' },
      { num: 5, text: '  check: baseline.telnet_disabled.value == true', type: 'code' },
      { num: 6, text: '  verdict: PASS [Telnet daemon disabled]', type: 'pass' },
      { num: 7, text: '- rule_id: CIS-3.1.4', type: 'code' },
      { num: 8, text: '  check: baseline.session_idle_timeout_min.value <= 10', type: 'code' },
      { num: 9, text: '  verdict: FAIL [Value 15 min exceeds limit <= 10 min]', type: 'fail' },
      { num: 10, text: '  severity: HIGH | framework_ref: "CIS v8 Control 3.1.4"', type: 'fail' },
    ],
    note: 'Pure deterministic evaluation in TypeScript/YAML without AI inference or probabilistic scoring.',
  },
  {
    id: 'remediate',
    tab: '04 // Target Remediation',
    status: 'SYNTAX: VENDOR_SPECIFIC',
    filename: 'remediation-payload.cli',
    lines: [
      { num: 1, text: '! Targeted CLI script generated for Cisco Catalyst 9300', type: 'comment' },
      { num: 2, text: 'configure terminal', type: 'code' },
      { num: 3, text: ' line vty 0 4', type: 'code' },
      { num: 4, text: '  exec-timeout 10 0', type: 'pass' },
      { num: 5, text: '  transport input ssh', type: 'code' },
      { num: 6, text: ' line vty 5 15', type: 'code' },
      { num: 7, text: '  exec-timeout 10 0', type: 'pass' },
      { num: 8, text: '  transport input ssh', type: 'code' },
      { num: 9, text: ' exit', type: 'code' },
      { num: 10, text: 'write memory', type: 'highlight' },
    ],
    note: 'Generates exact copy-paste configuration commands for Cisco, Juniper, Palo Alto, or SONiC.',
  },
];

export const BrandLanding: React.FC<BrandLandingProps> = ({ onLaunchProduct }) => {
  // Hero Interactive CLI state
  // Inspector Section state
  const [activeStage, setActiveStage] = useState('redact');
  const [selectedVendorDispatch, setSelectedVendorDispatch] = useState(VENDOR_MATRIX[0].id);

  const currentInspector =
    INSPECTOR_STAGES.find((s) => s.id === activeStage) || INSPECTOR_STAGES[0];

  return (
    <div className="relative min-h-screen bg-[#08090C] text-[#A1A1AA] selection:bg-zinc-800 selection:text-white">
      {/* ── 1. TACTICAL LOGIC ANALYZER & TELEMETRY CROSSHAIR CANVAS (Z-0) ── */}
      <CyberDefenseBackground interactive={true} />
      <MousePointerTracker />

      {/* ── 2. PAGE CONTENT CONTAINER (Z-10, BG-TRANSPARENT) ── */}
      <div className="relative z-10 bg-transparent">
        {/* ── TOP CONSOLE HEADER (SCROLLS WITH PAGE) ── */}
        <header
          className="relative w-full border-b backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(8, 9, 12, 0.85)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Brand & Technical Breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5 cursor-pointer text-left group"
              title="NetSentry Console Top"
            >
              <div className="w-6 h-6 rounded-none flex items-center justify-center border border-zinc-700 bg-[#0D0E12] text-zinc-100">
                <ShieldCheck size={14} weight="bold" />
              </div>
              <span className="font-mono font-bold text-sm tracking-tight text-zinc-100 flex items-center gap-2">
                NETSENTRY
                <span className="text-[10px] font-mono px-1.5 py-0.5 border border-zinc-800 bg-[#0D0E12] text-zinc-400 font-normal">
                  KERNEL_V2
                </span>
              </span>
            </button>
            <span className="hidden sm:inline font-mono text-xs text-zinc-600">/</span>
            <span className="hidden sm:inline font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
              NTRO-SIH26155 :: SPEC_AUDITOR
            </span>
          </div>

          {/* Quick Nav Anchors */}
          <nav className="hidden md:flex items-center gap-6 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            <a href="#inspector" className="hover:text-zinc-200 transition-colors">
              Pipeline
            </a>
            <a href="#workbench" className="hover:text-zinc-200 transition-colors">
              Dual-Lane
            </a>
            <a href="#remediation-scanner" className="hover:text-emerald-400 transition-colors">
              Remediation Scanner
            </a>
            <a href="#testbed" className="hover:text-zinc-200 transition-colors">
              Testbed
            </a>
            <a href="#instruments" className="hover:text-zinc-200 transition-colors">
              Instruments
            </a>
          </nav>

          {/* Header Action: High-Contrast Slate-White Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onLaunchProduct()}
              className="px-3.5 py-1.5 rounded-none font-mono font-medium text-xs tracking-wider uppercase transition-none cursor-pointer bg-zinc-100 text-zinc-950 hover:bg-zinc-300 active:scale-[0.98] flex items-center gap-1.5"
            >
              <Cpu size={13} weight="bold" />
              <span>Launch Console</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 3. HERO SECTION ── */}
      <section
        id="hero"
        className="relative pt-12 pb-24 border-b border-zinc-800/80 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* ── LEFT COLUMN (7 COLS): Headline, Value Proposition & Actions ── */}
            <div className="lg:col-span-7 flex flex-col items-start text-left pt-2">
              {/* Terminal Monospace Breadcrumb Eyebrow */}
              <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-500" />
                <span className="text-zinc-300">SYS.AUDIT // NTRO-SIH26155</span>
                <span className="text-zinc-600">::</span>
                <span className="text-emerald-400">ENGINE VERIFIED</span>
              </div>

              {/* Headings: Space Grotesk Tight Negative Tracking */}
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-zinc-100 tracking-[-0.03em] leading-[1.08] mb-6 font-sans">
                Multi-Vendor Network Compliance & Verification Engine
              </h1>

              <p className="text-sm sm:text-base leading-relaxed text-zinc-300 mb-8 max-w-xl font-sans">
                Deterministic AST parsing and in-memory credential masking for heterogeneous enterprise firewalls, core routers, and white-box hardware. Verifies CIS, NIST, DISA STIG, and ISO 27001 with line-level evidence and zero AI hallucination.
              </p>

              {/* Brutalist Surgical Actions */}
              <div className="flex flex-wrap items-center gap-4 mb-10 w-full sm:w-auto">
                <button
                  onClick={() => onLaunchProduct()}
                  className="px-6 py-3.5 rounded-none font-mono font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer text-cyan-300 bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 hover:text-cyan-200 hover:border-cyan-400 active:scale-95 flex items-center gap-2"
                >
                  <span>Open Audit Platform</span>
                  <ArrowRight size={14} weight="bold" />
                </button>

                <a
                  href="#inspector"
                  className="px-5 py-3.5 rounded-none font-mono text-xs tracking-wider uppercase transition-colors cursor-pointer bg-[#0D0E12] border border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white flex items-center gap-2"
                >
                  <Terminal size={14} className="text-cyan-400" />
                  <span>Inspect Pipeline</span>
                </a>
              </div>

              {/* Hairline Metrics Strip */}
              <div className="w-full border border-zinc-800 bg-[#0D0E12] grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 text-left font-mono">
                <div className="p-3">
                  <div className="text-lg font-bold text-zinc-100 tabular-nums">0.00%</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                    Hallucination
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-lg font-bold text-zinc-100 tabular-nums">6 Dialects</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                    Cisco · JunOS · PAN
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-lg font-bold text-zinc-100 tabular-nums">4 Packs</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                    CIS · NIST · STIG
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-lg font-bold text-cyan-400 tabular-nums">&lt; 1 ms</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                    AST Lexer Time
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN (5 COLS): Interactive 3D Security Lock Pattern ── */}
            <div className="lg:col-span-5 w-full flex items-center justify-center relative">
              <SecurityLockPattern />
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SECTION 1: TELEMETRY PIPELINE INSPECTOR ── */}
      <section
        id="inspector"
        className="py-16 border-b border-zinc-800/80 bg-transparent"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                EXECUTION_STAGE_INSPECTION
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
                How NetSentry Verifies Infrastructure Code
              </h2>
              <p className="text-xs text-zinc-400 mt-1 font-sans">
                Deterministic AST parsing and in-memory secret masking prior to benchmark validation.
              </p>
            </div>
            <button
              onClick={() => onLaunchProduct()}
              className="font-mono text-xs uppercase tracking-wider text-zinc-300 hover:text-white transition-none flex items-center gap-1.5 cursor-pointer"
            >
              <span>Test with your own device config</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Precision Terminal Window: Pure Black Code Block, Crisp 1px Zinc Border */}
          <div className="rounded-none border border-zinc-800 bg-[#0D0E12] overflow-hidden">
            {/* Terminal Tab Bar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-zinc-800 bg-[#090A0E]">
              {INSPECTOR_STAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStage(s.id)}
                  className={`px-3 py-1.5 rounded-none font-mono text-xs cursor-pointer transition-none ${
                    activeStage === s.id
                      ? 'bg-[#161822] text-zinc-100 border border-zinc-600 font-medium'
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  {s.tab}
                </button>
              ))}

              <div className="ml-auto hidden sm:flex items-center gap-2 pr-3 font-mono text-[11px] text-zinc-400">
                <span className="w-1.5 h-1.5 bg-emerald-500 inline-block" />
                {currentInspector.status}
              </div>
            </div>

            {/* File Info Bar */}
            <div className="px-4 py-2 border-b border-zinc-800/80 bg-[#0B0C10] flex items-center justify-between font-mono text-[11px] text-zinc-400">
              <span>file: {currentInspector.filename}</span>
              <span className="text-zinc-500">{currentInspector.note}</span>
            </div>

            {/* Pure Black Code Inspection Area */}
            <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto bg-[#000000]">
              <div className="space-y-1">
                {currentInspector.lines.map((l) => (
                  <div key={l.num} className="flex items-start gap-4">
                    <span className="text-zinc-600 select-none w-6 text-right shrink-0 tabular-nums">
                      {l.num}
                    </span>
                    <span
                      className={`break-all ${
                        l.type === 'comment'
                          ? 'text-zinc-500'
                          : l.type === 'redact'
                          ? 'text-amber-400 bg-amber-950/60 border border-amber-600/70 px-1 font-mono font-semibold'
                          : l.type === 'warn'
                          ? 'text-amber-300 font-semibold'
                          : l.type === 'pass'
                          ? 'text-emerald-400'
                          : l.type === 'fail'
                          ? 'text-rose-400 font-semibold'
                          : l.type === 'highlight'
                          ? 'text-zinc-100 font-medium'
                          : 'text-zinc-300'
                      }`}
                    >
                      {l.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Bar */}
            <div className="px-5 py-3 border-t border-zinc-800 bg-[#090A0E] flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-zinc-400 font-mono">
                Line-level evidence extracted with zero token inference cost.
              </span>
              <button
                onClick={() => onLaunchProduct()}
                className="px-4 py-1.5 rounded-none font-mono font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-zinc-300 transition-none cursor-pointer flex items-center gap-2"
              >
                <span>Launch Interactive Test With This File</span>
                <ArrowRight size={12} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. SECTION 2: DUAL-LANE ARCHITECTURE COMPARATIVE WORKBENCH ── */}
      <section
        id="workbench"
        className="py-16 border-b border-zinc-800/80 bg-transparent"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-8">
            <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              ARCHITECTURAL_SEGREGATION
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight mb-2">
              Dual-Lane Architecture: AI Suggests, Rules Decide
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-zinc-400 font-sans">
              Generative models are prone to hallucinating configuration lines and falsifying compliance status. NetSentry enforces strict algorithmic segregation between parser lanes.
            </p>
          </div>

          {/* Unified Comparative Workbench: Single Bordered Panel with Central Hairline Divider */}
          <div className="rounded-none border border-zinc-800 bg-[#0D0E12] overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
            {/* Green Lane Column */}
            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Authentic Technical Status Bar */}
                <div className="p-2 border border-zinc-800 bg-[#08090C] mb-6 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 inline-block" />
                    <span className="text-zinc-200 font-bold">LANE_01 :: GREEN</span>
                  </div>
                  <span className="text-zinc-500">ENGINE: DETERMINISTIC_LEXER_V2</span>
                  <span className="text-emerald-400 font-semibold">LATENCY: &lt;1ms</span>
                </div>

                <h3 className="text-base font-bold text-zinc-100 mb-2 font-mono">
                  Deterministic AST Lexer
                </h3>
                <p className="text-xs leading-relaxed text-zinc-400 mb-6 font-sans">
                  Extracts configuration tokens using hardcoded AST syntax grammars for Cisco IOS-XE, Juniper Junos, Palo Alto PAN-OS, and Arista EOS. Guaranteed 100% deterministic accuracy with line-number verification.
                </p>

                <div className="space-y-2.5 font-mono text-xs text-zinc-300">
                  <div className="flex items-center gap-2.5">
                    <Check size={13} weight="bold" className="text-emerald-400 shrink-0" />
                    <span>Sub-millisecond execution runtime (&lt; 1 ms)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check size={13} weight="bold" className="text-emerald-400 shrink-0" />
                    <span>Air-gapped operation with zero network egress</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check size={13} weight="bold" className="text-emerald-400 shrink-0" />
                    <span>Mathematical proof of compliance verdicts</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check size={13} weight="bold" className="text-emerald-400 shrink-0" />
                    <span>Zero token billing overhead or LLM quota limits</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-800 font-mono text-[11px] text-zinc-500 flex justify-between">
                <span>PRIMARY PROCESSING PATH</span>
                <span className="text-emerald-400">95%+ ENTERPRISE COVERAGE</span>
              </div>
            </div>

            {/* Amber Lane Column */}
            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Authentic Technical Status Bar */}
                <div className="p-2 border border-zinc-800 bg-[#08090C] mb-6 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-400 inline-block" />
                    <span className="text-zinc-200 font-bold">LANE_02 :: AMBER</span>
                  </div>
                  <span className="text-zinc-500">ENGINE: LLM_PYDANTIC_GATE_V1</span>
                  <span className="text-amber-400 font-semibold">GATE: 0.80 CONF</span>
                </div>

                <h3 className="text-base font-bold text-zinc-100 mb-2 font-mono">
                  Confidence-Gated Schema Extractor
                </h3>
                <p className="text-xs leading-relaxed text-zinc-400 mb-6 font-sans">
                  Invoked exclusively for alien, white-box, or legacy vendor dialects (SONiC, Hillstone, Allied Telesis). Outputs are strictly coerced into a validated Pydantic schema with confidence scoring.
                </p>

                <div className="space-y-2.5 font-mono text-xs text-zinc-300">
                  <div className="flex items-center gap-2.5">
                    <Check size={13} weight="bold" className="text-amber-400 shrink-0" />
                    <span>Strict schema validation eliminates syntax hallucinations</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check size={13} weight="bold" className="text-amber-400 shrink-0" />
                    <span>Confidence &lt; 0.80 escalates to SecOps Human-in-the-Loop</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check size={13} weight="bold" className="text-amber-400 shrink-0" />
                    <span>Approved mappings saved in PostgreSQL few-shot store</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check size={13} weight="bold" className="text-amber-400 shrink-0" />
                    <span>Zero LLM verdict authority: YAML rules evaluate</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-800 font-mono text-[11px] text-zinc-500 flex justify-between">
                <span>ADAPTIVE LEARNING FALLBACK</span>
                <span className="text-amber-400">ACTIVE FEEDBACK LOOP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2.5: TACTICAL REMEDIATION SCANNER (LIVE DIFF SCRUBBER) ── */}
      <section
        id="remediation-scanner"
        className="py-16 border-b border-zinc-800/80 bg-transparent"
      >
        <div className="max-w-7xl mx-auto px-6">
          <TacticalRemediationScanner onLaunchConsole={() => onLaunchProduct()} />
        </div>
      </section>

      {/* ── 6. SECTION 3: PRELOADED MULTI-VENDOR TESTBED ── */}
      <section
        id="testbed"
        className="py-16 border-b border-zinc-800/80 bg-transparent"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                LIVE_RUNTIMES
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
                Preloaded Multi-Vendor Testbed
              </h2>
              <p className="text-xs text-zinc-400 mt-2 font-sans max-w-lg leading-relaxed">
                Select any configuration to trigger an air-gapped audit with line-level evidence. Powered by deterministic AST lexers and zero-trust schema validation.
              </p>
            </div>
            <span className="font-mono text-[11px] text-zinc-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 inline-block rounded-sm animate-pulse" />
              [TELEMETRY: 6 VENDOR RUNTIMES ACTIVE]
            </span>
          </div>

          {/* Brutalist 2-Col Card Grid with Collapsed Borders (1px hairlines) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-800 border border-zinc-800">
            {VENDOR_MATRIX.map((v) => (
              <div
                key={v.id}
                onClick={() => onLaunchProduct(v.id)}
                className="group relative bg-[#0D0E12] hover:bg-[#11131A] transition-colors p-6 cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="font-mono text-[10px] text-zinc-500 mb-2 uppercase tracking-widest">
                      {v.role}
                    </div>
                    <div className="font-mono text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
                      {v.vendor} <span className="text-zinc-500 font-normal">{v.model}</span>
                    </div>
                  </div>
                  {/* Status Indicator / Lane */}
                  <div className={`px-2 py-1 text-[9px] font-mono tracking-widest uppercase border ${
                    v.lane.includes('Green')
                      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20'
                      : 'text-amber-400 border-amber-500/30 bg-amber-950/20'
                  }`}>
                    {v.lane.includes('Green') ? 'LANE_01 // GREEN' : 'LANE_02 // AMBER'}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 border-t border-zinc-800/80 pt-4">
                  <div>
                    <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5">
                      FIRMWARE_OS
                    </div>
                    <div className="font-mono text-[11px] text-zinc-300">
                      {v.os}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5">
                      BENCHMARK_TARGET
                    </div>
                    <div className="font-mono text-[11px] text-zinc-300 truncate pr-4" title={v.benchmark}>
                      {v.benchmark}
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5">
                        LATENCY
                      </div>
                      <div className="font-mono text-[11px] text-zinc-300 tabular-nums">
                        {v.latency}
                      </div>
                    </div>
                    {/* Interaction Arrow */}
                    <div className="opacity-20 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-zinc-500 pb-0.5">
                      <span className="font-mono text-[9px]">[↵]</span>
                      <span className="font-mono text-[11px] font-bold text-zinc-100">→</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. SECTION 4: 3-COLUMN INSTRUMENT MATRIX ── */}
      <section
        id="instruments"
        className="py-16 border-b border-zinc-800/80 bg-transparent"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-8">
            <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              INSTRUMENT_CAPABILITIES
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight mb-2">
              Institutional Guarantees for Critical Infrastructure
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans">
              Engineered for air-gapped national defense networks and sovereign security perimeters.
            </p>
          </div>

          {/* Border-Collapsed 3-Column Instrument Matrix */}
          <div className="rounded-none border border-zinc-800 bg-[#0D0E12] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
            {/* Feature 01 */}
            <div className="p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs font-bold text-zinc-400 tracking-wider mb-3">
                  01 // ZERO-SECRET
                </div>
                <h3 className="text-base font-bold text-zinc-100 mb-2">
                  In-Memory Credential Redaction
                </h3>
                <p className="text-xs leading-relaxed text-zinc-400 font-sans">
                  Pre-tokenization regex engine intercepts Cisco type 7/9 passwords, SHA-512 hashes, BGP keys, and TACACS+ secrets in browser memory. Plaintext credentials are masked with zero network egress.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-zinc-800/80 font-mono text-[10px] text-emerald-400">
                GUARANTEE: 100% AIR-GAPPED MASKING
              </div>
            </div>

            {/* Feature 02 */}
            <div className="p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs font-bold text-zinc-400 tracking-wider mb-3">
                  02 // PDF-PROVENANCE
                </div>
                <h3 className="text-base font-bold text-zinc-100 mb-2">
                  Defense-Grade Evidence Dossiers
                </h3>
                <p className="text-xs leading-relaxed text-zinc-400 font-sans">
                  Produces cryptographically verified PDF audit packages stamped with NTRO SIH26155 metadata, exact line-number evidence traces, and target copy-paste CLI remediation scripts.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-zinc-800/80 font-mono text-[10px] text-zinc-300">
                STANDARDS: CIS · NIST · DISA STIG
              </div>
            </div>

            {/* Feature 03 */}
            <div className="p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs font-bold text-zinc-400 tracking-wider mb-3">
                  03 // FEW-SHOT-AST
                </div>
                <h3 className="text-base font-bold text-zinc-100 mb-2">
                  Human-in-the-Loop Active Store
                </h3>
                <p className="text-xs leading-relaxed text-zinc-400 font-sans">
                  SecOps engineers label unknown CLI syntax via a dedicated triage queue. Approved field mappings are committed permanently to a PostgreSQL few-shot exemplar store for continuous AST coverage.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-zinc-800/80 font-mono text-[10px] text-amber-400">
                ACTIVE LEARNING: CONFIDENCE &gt;= 0.80
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. SECTION 5: FULL-WIDTH ARCHITECTURAL LAUNCHPAD ── */}
      <section className="py-16 border-b border-zinc-800 bg-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="p-6 sm:p-8 rounded-none border border-zinc-800 bg-[#0D0E12]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left 8 Cols: Architectural Value */}
              <div className="lg:col-span-8 text-left">
                <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                  DISPATCH_TERMINAL
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight mb-2">
                  Operationalize Compliance Across Critical Infrastructure
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl mb-4 font-sans">
                  Select a testbed device below or upload your running-config in the console to run a complete, air-gapped compliance audit with line-level evidence in under a second.
                </p>
                <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Check size={12} weight="bold" /> Zero Plaintext Storage
                  </span>
                  <span>•</span>
                  <span>CIS Benchmark v8</span>
                  <span>•</span>
                  <span>NIST SP 800-53</span>
                  <span>•</span>
                  <span>DISA STIG Junos</span>
                </div>
              </div>

              {/* Right 4 Cols: Direct Dispatch Trigger */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider">
                  Select Target Configuration
                </div>
                <select
                  value={selectedVendorDispatch}
                  onChange={(e) => setSelectedVendorDispatch(e.target.value)}
                  className="w-full rounded-none px-3.5 py-2.5 bg-[#08090C] border border-zinc-800 text-zinc-100 font-mono text-xs outline-none focus:border-zinc-500 cursor-pointer"
                >
                  {VENDOR_MATRIX.map((v) => (
                    <option
                      key={v.id}
                      value={v.id}
                      className="bg-[#08090C] text-zinc-100 font-mono text-xs"
                    >
                      {v.vendor} {v.model} ({v.os})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => onLaunchProduct(selectedVendorDispatch)}
                  className="w-full py-3 px-5 rounded-none font-mono font-medium text-xs uppercase tracking-wider bg-zinc-100 text-zinc-950 hover:bg-zinc-300 transition-none cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Cpu size={14} weight="bold" />
                  <span>Launch Platform With Target</span>
                  <ArrowRight size={13} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. WORKSTATION CONSOLE FOOTER ── */}
      <footer className="py-8 bg-[#060709]/85 backdrop-blur-md border-t border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-zinc-500">
          <div>
            <span className="text-zinc-200 font-bold tracking-tight">NetSentry</span> - Autonomous Network Hardening & Compliance Auditor
            <p className="text-[11px] text-zinc-600 mt-0.5">
              Problem Statement SIH26155 · Organisation: NTRO · SIH 2026
            </p>
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <button
              onClick={() => onLaunchProduct()}
              className="text-zinc-300 hover:text-white transition-none cursor-pointer font-medium"
            >
              Open Audit Console →
            </button>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};
