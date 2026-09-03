import React from 'react';
import { ArrowRight, Fingerprint, Cpu, Robot, Users, FilePdf } from '@phosphor-icons/react';

interface HeroLandingProps {
  onStartAudit: () => void;
  onExploreTraining: () => void;
  onSelectVendorConfig: (vendorId: string) => void;
}

const VENDORS = [
  { id: 'cisco-cat9300-core',     label: 'Cisco IOS-XE',     sub: 'Catalyst 9300' },
  { id: 'juniper-srx345-gateway', label: 'Juniper JunOS',     sub: 'SRX345 Gateway' },
  { id: 'paloalto-pa3220-dc',     label: 'Palo Alto PAN-OS',  sub: 'PA-3220 NGFW' },
  { id: 'sonic-whitebox-leaf',    label: 'SONiC Linux',       sub: 'White-Box Switch' },
  { id: 'fortinet-fortigate-60f', label: 'Fortinet FortiOS',  sub: 'FortiGate 60F' },
  { id: 'arista-7050x-leaf',      label: 'Arista EOS',        sub: '7050X Leaf' },
];

const PIPELINE: {
  num: string;
  icon: React.ElementType;
  label: string;
  lane?: string;
  detail: string;
}[] = [
  { num: '01', icon: Fingerprint, label: 'Ingest + Fingerprint', detail: 'Config upload or live SSH pull via Netmiko. SHA-256 hash. Secrets redacted in memory before any storage.' },
  { num: '02', icon: Cpu,         label: 'Deterministic Parse',  lane: 'GREEN', detail: 'AST + regex parser for known CLI dialects: Cisco IOS-XE, JunOS, PAN-OS, EOS. Zero LLM involvement. Zero hallucination.' },
  { num: '03', icon: Robot,       label: 'LLM Fallback',         lane: 'AMBER', detail: 'Unknown vendor syntax routed to LLM. Pydantic schema validates all output fields. Confidence gating at 0.80 threshold.' },
  { num: '04', icon: Users,       label: 'Human-in-the-Loop',    detail: 'Fields below confidence threshold queued for admin labeling. Approved mappings saved permanently to PostgreSQL few-shot store.' },
  { num: '05', icon: FilePdf,     label: 'Evaluate + Report',    lane: 'GREEN', detail: 'Deterministic YAML rule engine computes PASS/FAIL. LLM never determines compliance. Signed PDF with per-device CLI remediation.' },
];

const LANE_COLOR: Record<string, string> = {
  GREEN: 'var(--pass)',
  AMBER: 'var(--warn)',
};

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onStartAudit,
  onExploreTraining,
  onSelectVendorConfig,
}) => {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* ── INTRO: asymmetric, left-heavy, not a marketing hero ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-16 py-20 items-start">

          {/* Left col - 7 */}
          <div className="lg:col-span-7 fade-up">
            <p
              className="font-mono text-[11px] uppercase tracking-[0.14em] mb-5"
              style={{ color: 'var(--accent)' }}
            >
              Problem Statement SIH26155 / NTRO
            </p>

            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.07] mb-5"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
            >
              AI-Driven Multi-Vendor<br />Network Compliance Auditor
            </h1>

            <p
              className="text-base leading-relaxed mb-8 max-w-[56ch]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Audit enterprise firewalls, routers, and switches against CIS, NIST 800-53, DISA STIG, and ISO 27001 with line-level evidence and device-specific CLI remediation commands.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onStartAudit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-opacity cursor-pointer active:scale-95"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Open Audit Console
                <ArrowRight size={15} weight="bold" />
              </button>
              <button
                onClick={onExploreTraining}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                Training Interface
              </button>
            </div>
          </div>

          {/* Right col - 5: trust principle */}
          <div
            className="lg:col-span-5 mt-10 lg:mt-0 pl-0 lg:pl-10 lg:border-l fade-up fade-up-1"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <p
              className="font-mono text-[11px] uppercase tracking-[0.12em] mb-4"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Trust Boundary
            </p>
            <p
              className="text-2xl font-semibold leading-snug mb-5"
              style={{ color: 'var(--text-primary)' }}
            >
              AI normalizes.<br />Rules decide.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The LLM component extracts raw CLI syntax into a vendor-neutral schema. All PASS/FAIL verdicts are computed deterministically by a YAML rule engine. LLM output never directly determines a compliance result.
            </p>

            {/* Three framework badges - text only, no box */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              <span>CIS Network v8</span>
              <span>NIST SP 800-53</span>
              <span>DISA STIG</span>
              <span>ISO/IEC 27001</span>
            </div>
          </div>
        </div>

        {/* ── PIPELINE: vertical numbered list, not equal cards ── */}
        <section style={{ borderTop: '1px solid var(--border-subtle)' }} className="py-16">
          <h2
            className="text-lg font-semibold tracking-tight mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Five-Stage Processing Pipeline
          </h2>
          <p className="text-sm mb-10" style={{ color: 'var(--text-tertiary)' }}>
            Two parsing lanes with deterministic YAML evaluation. No compliance verdict ever touches the LLM.
          </p>

          <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
            {PIPELINE.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.num}
                  className="flex items-start gap-8 py-5"
                  style={{ borderBottom: '1px solid var(--border-subtle)', paddingLeft: `${i * 16}px` }}
                >
                  {/* Number + lane */}
                  <div className="shrink-0 w-36">
                    <div
                      className="font-mono text-[11px] tabular"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      STAGE {stage.num}
                    </div>
                    {stage.lane && (
                      <div
                        className="font-mono text-[10px] uppercase tracking-widest mt-0.5"
                        style={{ color: LANE_COLOR[stage.lane] }}
                      >
                        {stage.lane} LANE
                      </div>
                    )}
                  </div>

                  {/* Label + detail */}
                  <div className="flex items-start gap-4 flex-1">
                    <Icon
                      size={16}
                      weight="duotone"
                      style={{ color: stage.lane ? LANE_COLOR[stage.lane] : 'var(--text-tertiary)', marginTop: 2 }}
                    />
                    <div>
                      <div
                        className="text-sm font-semibold mb-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {stage.label}
                      </div>
                      <p className="text-sm leading-relaxed max-w-[60ch]" style={{ color: 'var(--text-secondary)' }}>
                        {stage.detail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── VENDOR MATRIX: sparse grid, text only ── */}
        <section style={{ borderTop: '1px solid var(--border-subtle)' }} className="py-16">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Preloaded Device Configurations
            </h2>
            <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              6 test configurations
            </span>
          </div>

          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            {VENDORS.map((v, i) => (
              <button
                key={v.id}
                onClick={() => onSelectVendorConfig(v.id)}
                className="group px-0 py-5 text-left transition-colors cursor-pointer"
                style={{
                  paddingLeft: i % 6 === 0 ? 0 : '20px',
                  borderLeft: i % 6 !== 0 ? '1px solid var(--border-subtle)' : 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  className="text-sm font-medium mb-0.5 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {v.label}
                </div>
                <div className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  {v.sub}
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
