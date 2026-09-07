// src/components/landing/PublicLandingPage.tsx
// Authoritative Institutional Gateway (Light Mode, Tactical Reticle, High-Precision Defense Aesthetic)

import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  ShieldCheckered,
  IdentificationBadge,
  Cpu,
  Robot,
  Database,
  FilePdf,
  Fingerprint,
  CheckCircle,
  Lightning,
  Terminal,
  FileCode,
  LockKey,
} from '@phosphor-icons/react';


interface PublicLandingPageProps {
  onLaunchConsole: (configId?: string, targetTab?: string) => void;
}

// ── 5-STAGE PIPELINE DEFINITION ──
interface PipelineStage {
  num: string;
  id: string;
  title: string;
  lane: 'GREEN' | 'AMBER' | 'NEUTRAL';
  icon: React.ElementType;
  headline: string;
  description: string;
  technicalSpecs: string[];
  sampleEvidence: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    num: '01',
    id: 'ingest-redact',
    title: 'Ingestion & Redaction',
    lane: 'NEUTRAL',
    icon: Fingerprint,
    headline: 'In-Memory Client-Side Secret Redaction',
    description: 'Configs ingested via file drop or live SSH Netmiko session. Pre-shared keys, passwords, and TACACS secrets are stripped using compiled regex filters before persistent storage.',
    technicalSpecs: [
      'SHA-256 cryptographic provenance calculated before and after redaction',
      'Matches Cisco Type 5/7/9, JunOS $6$, PAN-OS, and Fortinet encrypted tokens',
      'Zero plaintext credentials transmitted to normalizers or external APIs',
    ],
    sampleEvidence: 'enable secret 9 $9$e7xW...  -->  [REDACTED_ENABLE_SECRET_01]',
  },
  {
    num: '02',
    id: 'deterministic-green',
    title: 'Deterministic Green Lane',
    lane: 'GREEN',
    icon: Cpu,
    headline: 'High-Throughput AST & Regex Parsing (<15ms)',
    description: 'Standardized dialect parsers deterministically extract network configuration statements into the vendor-neutral CanonicalDeviceConfig schema. 100% deterministic, zero hallucination.',
    technicalSpecs: [
      'Dedicated deterministic dialect parsers: Cisco IOS-XE, JunOS, PAN-OS, SONiC, FortiOS, Arista EOS',
      'Generates exact source line number mappings for verifiable audit trails',
      'Handles multi-line hierarchical blocks, interface definitions, and AAA profiles',
    ],
    sampleEvidence: 'AST_RESOLVED: line 36 -> ip ssh version 2 (Confidence: 1.000)',
  },
  {
    num: '03',
    id: 'opt-in-amber',
    title: 'On-Demand Amber Lane',
    lane: 'AMBER',
    icon: Robot,
    headline: 'Administrator-Gated LLM Normalization',
    description: 'When unfamiliar or non-standard syntax is encountered, the administrator can opt-in to request LLM suggestions. Synthesized mappings must be reviewed and approved by human operators.',
    technicalSpecs: [
      'Strict manual invocation: zero automated background LLM billing or rate-limit consumption',
      'Confidence scoring with strict 0.80 acceptance threshold',
      'Structured Pydantic JSON schema verification with zero arbitrary execution',
    ],
    sampleEvidence: 'LLM_ASSIST: fast_reboot_watchdog enabled -> service_hardening (0.94)',
  },
  {
    num: '04',
    id: 'few-shot-store',
    title: 'Persistent Exemplar Store',
    lane: 'AMBER',
    icon: Database,
    headline: 'Dynamic Syntax Learning Without Redeployment',
    description: 'Human-approved mappings are persisted as few-shot exemplars in the thread-safe JSON/database store. The deterministic parser consults this store on subsequent passes to learn new syntax on the fly.',
    technicalSpecs: [
      'Permanent knowledge persistence across daemon restarts',
      'Elevates previously unknown dialect lines into deterministic matches',
      'Defensible differentiator: system continuously improves through operator feedback',
    ],
    sampleEvidence: 'EXEMPLAR_SAVED: sonic.fast_reboot -> sys.watchdog (Persisted to Store)',
  },
  {
    num: '05',
    id: 'compliance-pdf',
    title: 'Evaluation & Signed Report',
    lane: 'GREEN',
    icon: FilePdf,
    headline: 'Deterministic Rule Engine & Cryptographic Audit Reports',
    description: 'Evaluates normalized CanonicalDeviceConfig against CIS, NIST, DISA STIG, and ISO 27001 rule packs. Emits line-level evidence, remediation CLI snippets, and signed ReportLab PDF.',
    technicalSpecs: [
      'Rules strictly determine PASS/FAIL verdicts — LLM never decides compliance',
      'Vendor-specific remediation commands: exact CLI syntax for instant remediation',
      'Produces audit-ready PDF with SHA-256 report verification checksum',
    ],
    sampleEvidence: 'RULE_CIS_2_1: FAIL (Cisco IOS-XE: line 40 missing "ip ssh version 2")',
  },
];

// ── PRELOADED DEVICE HARDWARE MATRIX ──
const PRELOADED_DEVICES = [
  {
    id: 'cisco-cat9300-core',
    vendor: 'Cisco',
    series: 'Catalyst 9300',
    model: 'C9300-48UXM',
    os: 'IOS-XE 17.09.04a',
    role: 'Enterprise Core Switch',
    framework: 'CIS Cisco IOS-XE v2.0.0',
    lane: 'Deterministic Green',
    redacted: 4,
  },
  {
    id: 'juniper-srx345-gateway',
    vendor: 'Juniper',
    series: 'SRX345 Gateway',
    model: 'SRX345-SYS-JB',
    os: 'Junos 22.4R2-S2.5',
    role: 'Security Boundary Firewall',
    framework: 'DISA STIG Junos NDM v2r1',
    lane: 'Deterministic Green',
    redacted: 3,
  },
  {
    id: 'paloalto-pa3220-dc',
    vendor: 'Palo Alto',
    series: 'PA-3220 NGFW',
    model: 'PA-3220',
    os: 'PAN-OS 11.0.2-h3',
    role: 'Perimeter Next-Gen Firewall',
    framework: 'NIST SP 800-53 Rev. 5',
    lane: 'Deterministic Green',
    redacted: 2,
  },
  {
    id: 'sonic-whitebox-leaf',
    vendor: 'SONiC',
    series: 'White-Box Leaf',
    model: 'Edgecore AS7712-32X',
    os: 'Enterprise SONiC 202311',
    role: 'Datacenter White-Box Leaf',
    framework: 'CIS Open Network v1.1.0',
    lane: 'Amber + Few-Shot Store',
    redacted: 2,
  },
  {
    id: 'fortinet-fortigate-60f',
    vendor: 'Fortinet',
    series: 'FortiGate 60F',
    model: 'FG-60F',
    os: 'FortiOS v7.4.2 build2573',
    role: 'Branch Perimeter Firewall',
    framework: 'ISO/IEC 27001:2022 A.13.1',
    lane: 'Deterministic Green',
    redacted: 3,
  },
  {
    id: 'arista-7050x-leaf',
    vendor: 'Arista',
    series: '7050X Leaf',
    model: 'DCS-7050SX3-48YC8',
    os: 'EOS 4.30.2F',
    role: 'Datacenter Spine/Leaf',
    framework: 'CIS Arista EOS v1.2.0',
    lane: 'Deterministic Green',
    redacted: 2,
  },
];

// ── COMPLIANCE FRAMEWORKS ──
const COMPLIANCE_FRAMEWORKS = [
  {
    id: 'cis_v8',
    title: 'CIS Controls v8',
    subtitle: 'Network Infrastructure Benchmark',
    badges: ['Management Plane', 'SSHv2', 'AAA Enforcement', 'Syslog Transport'],
    scope: 'Essential cyber hygiene baseline for multi-vendor network equipment',
  },
  {
    id: 'nist_800_53',
    title: 'NIST SP 800-53 Rev. 5',
    subtitle: 'Federal Information Systems Security',
    badges: ['SC-7 Boundary Protection', 'AC-3 Access Control', 'IA-2 Identification', 'AU-2 Audit Events'],
    scope: 'Rigorous federal security controls for defense and government networks',
  },
  {
    id: 'disa_stig',
    title: 'DISA STIG',
    subtitle: 'DoD Network Device Management',
    badges: ['Category I Severity', 'Category II Severity', 'SNMPv3 Privacy', 'Banners'],
    scope: 'United States Department of Defense security technical implementation guides',
  },
  {
    id: 'iso_27001',
    title: 'ISO/IEC 27001:2022',
    subtitle: 'Information Security Management',
    badges: ['Control A.13.1', 'Control A.13.2', 'Network Segregation', 'Audit Logging'],
    scope: 'International information security management specification',
  },
];

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onLaunchConsole }) => {
  const [activeStageId, setActiveStageId] = useState<string>('ingest-redact');
  const activeStage = PIPELINE_STAGES.find((s) => s.id === activeStageId) || PIPELINE_STAGES[0];

  return (
    <div
      className="min-h-[100dvh] flex flex-col justify-between selection:bg-sky-100 selection:text-sky-900 relative bg-slate-50/80 text-slate-900"
      style={{
        backgroundImage: 'radial-gradient(rgba(203, 213, 225, 0.4) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >

      {/* ── TOP INSTITUTIONAL HEADER ── */}
      <header className="sticky top-0 z-40 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 lg:px-12 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-sky-200 bg-sky-50 text-sky-700 shadow-xs">
            <ShieldCheck size={20} weight="bold" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900 flex items-baseline gap-2">
              <span>NetSentry</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-600">
                v1.1.0
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              NTRO, Government of India <span className="text-slate-300">/</span> SIH26155
            </div>
          </div>
        </div>

        {/* Right Status Badges & Quick Action */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Deterministic Engine Online</span>
          </div>

          <button
            onClick={() => onLaunchConsole()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 transition-colors shadow-xs cursor-pointer"
          >
            <span>Access Workspace</span>
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </header>

      {/* ── MAIN BODY CONTENT ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-10 lg:py-16 space-y-16">
        
        {/* ── SECTION 1: HERO & TRUST BOUNDARY ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Col: Main Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            {/* Classification Badge Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-sky-50 border border-sky-200 text-sky-700">
                <IdentificationBadge size={14} weight="bold" />
                <span>OFFICIAL USE ONLY</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono bg-white border border-slate-200 text-slate-700 shadow-xs">
                <ShieldCheckered size={14} weight="bold" className="text-slate-500" />
                <span>SIH26155 • DEFENSE COMPLIANCE AUDITOR</span>
              </span>
            </div>

            {/* Main Title & Narrative */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-tight">
                AI-Driven Multi-Vendor Network Security Compliance Auditor
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Deterministic compliance verification and canonical configuration normalization
                for heterogeneous defense networks. Ingests Cisco, Juniper, Palo Alto,
                SONiC, Fortinet, and Arista configs — auditing against national standards with zero hallucination.
              </p>
            </div>

            {/* Direct Action Hub */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onLaunchConsole(undefined, 'dashboard')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 transition-all shadow-sm cursor-pointer hover:shadow"
              >
                <span>Launch Audit Workspace</span>
                <ArrowRight size={16} weight="bold" />
              </button>

              <button
                onClick={() => onLaunchConsole(undefined, 'training')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 transition-colors shadow-xs cursor-pointer"
              >
                <Robot size={16} weight="bold" className="text-amber-600" />
                <span>Admin Training Queue</span>
              </button>

              <button
                onClick={() => onLaunchConsole(undefined, 'live-pull')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 transition-colors shadow-xs cursor-pointer"
              >
                <Terminal size={16} weight="bold" className="text-slate-600" />
                <span>Live SSH Ingest</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-xs font-mono text-slate-600">
              <div>
                <span className="text-[10px] text-slate-600 uppercase block font-semibold">Vendor Dialects</span>
                <span className="text-sm font-bold text-slate-900">6 Native Parsers</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 uppercase block font-semibold">Audit Latency</span>
                <span className="text-sm font-bold text-emerald-600">&lt; 15 ms / Device</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 uppercase block font-semibold">Secret Protection</span>
                <span className="text-sm font-bold text-sky-600">Zero-Egress SHA-256</span>
              </div>
            </div>
          </div>

          {/* Right Col: Trust Principle & Architecture Pillar */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <LockKey size={18} weight="bold" className="text-sky-600" />
                <span className="font-mono text-xs uppercase font-semibold text-slate-900">
                  Trust Boundary Philosophy
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                DETERMINISTIC VERDICTS
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 leading-snug">
                AI normalizes syntax.<br />Deterministic rules decide compliance.
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                In defense and critical government infrastructure, LLM hallucinations cannot be tolerated in compliance verdicts.
                NetSentry restricts AI to an on-demand translation assistant: translating unfamiliar CLI dialect blocks into canonical schema.
                All Pass/Fail verdicts and remediation scripts are computed deterministically against authoritative rule engines.
              </p>
            </div>

            {/* Dual Lane Breakdown */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-emerald-100 text-emerald-700 shrink-0 text-xs font-bold font-mono">
                  G
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-900">Deterministic Green Lane</div>
                  <div className="text-[11px] text-emerald-700">AST & regex parsing for recognized syntax. Zero LLM involvement, instant verification.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-amber-100 text-amber-700 shrink-0 text-xs font-bold font-mono">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900">Administrator-in-the-Loop Amber Lane</div>
                  <div className="text-[11px] text-amber-700">Unseen vendor commands queued for manual or LLM-assisted review, saved permanently to few-shot store.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: 5-STAGE PROCESSING PIPELINE (INTERACTIVE INSPECTOR) ── */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 pb-5">
            <div>
              <span className="text-[11px] font-mono uppercase font-semibold text-sky-600">
                System Specification
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Five-Stage Network Auditing Pipeline
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Click any stage to inspect technical execution flow
            </span>
          </div>

          {/* Stage Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {PIPELINE_STAGES.map((stage) => {
              const Icon = stage.icon;
              const isSelected = stage.id === activeStageId;
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  className={`flex flex-col p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-300 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      STAGE {stage.num}
                    </span>
                    <Icon
                      size={16}
                      weight="bold"
                      className={isSelected ? 'text-sky-600' : 'text-slate-400'}
                    />
                  </div>
                  <div className="text-xs font-semibold text-slate-850 truncate">
                    {stage.title}
                  </div>
                  <div className="text-[10px] font-mono mt-0.5">
                    {stage.lane === 'GREEN' && (
                      <span className="text-emerald-600 font-medium">Deterministic</span>
                    )}
                    {stage.lane === 'AMBER' && (
                      <span className="text-amber-600 font-medium">Opt-In AI / Human</span>
                    )}
                    {stage.lane === 'NEUTRAL' && (
                      <span className="text-slate-500 font-medium">Pre-Processing</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Technical Detail Card */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-sky-100 text-sky-700 flex items-center justify-center font-mono text-xs font-bold">
                  {activeStage.num}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{activeStage.headline}</h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Module ID: net_sentry.pipeline.{activeStage.id}
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] font-mono px-2.5 py-1 rounded font-bold uppercase ${
                  activeStage.lane === 'GREEN'
                    ? 'bg-emerald-100 text-emerald-800'
                    : activeStage.lane === 'AMBER'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {activeStage.lane} LANE
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {activeStage.description}
            </p>

            {/* Key Specs */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase font-semibold text-slate-500">
                Architectural Controls & Verification:
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {activeStage.technicalSpecs.map((spec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle size={14} weight="bold" className="text-sky-600 shrink-0 mt-0.5" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trace Output Preview */}
            <div className="pt-2 border-t border-slate-200">
              <div className="text-[10px] font-mono text-slate-600 uppercase mb-1">
                Telemetry Log Output:
              </div>
              <div
                className="bg-slate-900 text-slate-100 rounded-md p-2.5 font-mono text-[11px] flex items-center justify-between overflow-x-auto"
                data-no-tracker="true"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">❯</span>
                  <span>{activeStage.sampleEvidence}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 ml-4 font-mono">VERIFIED</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: PRELOADED DEVICE CONFIGURATIONS ── */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <span className="text-[11px] font-mono uppercase font-semibold text-sky-600">
                Interactive Test Bench
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Preloaded Defense Device Configurations
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              6 authentic vendor configurations with redacted credentials
            </span>
          </div>

          {/* 6 Device Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRELOADED_DEVICES.map((device) => (
              <div
                key={device.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all hover:border-sky-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-semibold text-sky-600 block">
                        {device.vendor}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{device.series}</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                      {device.model}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600">{device.role}</div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] font-mono text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>OS Version:</span>
                      <span className="font-semibold text-slate-700">{device.os}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Target Benchmark:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[170px]" title={device.framework}>
                        {device.framework}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Secrets Redacted:</span>
                      <span className="font-semibold text-sky-600">{device.redacted} Credentials</span>
                    </div>
                  </div>
                </div>

                {/* Audit CTA button for this specific device */}
                <button
                  onClick={() => onLaunchConsole(device.id, 'results')}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 border border-sky-200 transition-colors cursor-pointer"
                >
                  <span>Audit This Configuration</span>
                  <ArrowRight size={13} weight="bold" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 4: COMPLIANCE BENCHMARK PACKS ── */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-mono uppercase font-semibold text-sky-600">
                Authoritative Standards
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                National & Defense Compliance Frameworks
              </h2>
            </div>
            <button
              onClick={() => onLaunchConsole(undefined, 'rules')}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
            >
              <span>Explore Rule Packs</span>
              <ArrowRight size={12} weight="bold" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMPLIANCE_FRAMEWORKS.map((fw) => (
              <div
                key={fw.id}
                className="bg-slate-50/70 rounded-lg border border-slate-200 p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{fw.title}</span>
                    <ShieldCheck size={16} weight="bold" className="text-sky-600" />
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">{fw.subtitle}</div>
                  <p className="text-xs text-slate-600 pt-1 leading-relaxed">{fw.scope}</p>
                </div>

                <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-200">
                  {fw.badges.map((b, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 5: INSTITUTIONAL TELEMETRY & ATTRIBUTION STRIP ── */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div className="pt-2 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">6</div>
              <div className="text-[11px] font-mono uppercase text-slate-500 mt-1">Vendor Parsers</div>
            </div>

            <div className="pt-4 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">4</div>
              <div className="text-[11px] font-mono uppercase text-slate-500 mt-1">Compliance Packs</div>
            </div>

            <div className="pt-4 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">&lt; 15ms</div>
              <div className="text-[11px] font-mono uppercase text-slate-500 mt-1">Audit Latency</div>
            </div>

            <div className="pt-4 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-600 font-mono">100%</div>
              <div className="text-[11px] font-mono uppercase text-slate-500 mt-1">Evidence Mapped</div>
            </div>
          </div>
        </section>

      </main>

      {/* ── INSTITUTIONAL VERIFICATION FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 lg:px-12 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>National Technical Research Organisation (NTRO) • Government of India</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Smart India Hackathon 2026 • SIH26155 • NetSentry v1.1.0
        </div>
      </footer>
    </div>
  );
};
