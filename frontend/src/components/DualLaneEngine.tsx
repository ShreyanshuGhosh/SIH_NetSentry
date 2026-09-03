import React, { useState } from 'react';
import { Cpu, Robot, CheckCircle, WarningCircle, Users, ArrowRight } from '@phosphor-icons/react';
import { AuditRunResult } from '../utils/auditEngine';

interface DualLaneEngineProps {
  auditResult: AuditRunResult;
  onOpenTraining: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  ssh_version: 'SSH Protocol Version',
  telnet_disabled: 'Telnet Daemon',
  snmp_version: 'SNMP Security Level',
  aaa_authentication_enabled: 'AAA Centralized Auth',
  remote_syslog_enabled: 'Remote SIEM Syslog',
  session_idle_timeout_minutes: 'Session Idle Timeout (min)',
  insecure_http_server_disabled: 'HTTP Web Management',
  login_banner_present: 'Warning Login Banner',
};

export const DualLaneEngine: React.FC<DualLaneEngineProps> = ({ auditResult, onOpenTraining }) => {
  const [tab, setTab] = useState<'schema' | 'comparison'>('schema');
  const { baseline, lane, device } = auditResult;

  const isGreen = lane === 'deterministic';

  return (
    <div className="max-w-7xl mx-auto px-6 py-14">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            Dual-Lane Parsing Engine
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Normalized baseline extracted from{' '}
            <span className="font-mono" style={{ color: 'var(--text-mono)' }}>{device.name}</span>
            {' '}via{' '}
            <span
              className="font-mono font-semibold"
              style={{ color: isGreen ? 'var(--pass)' : 'var(--warn)' }}
            >
              {isGreen ? 'Green Lane' : 'Amber Lane'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm font-mono" style={{ color: 'var(--text-tertiary)' }}>
          {isGreen
            ? <Cpu size={16} weight="duotone" style={{ color: 'var(--pass)' }} />
            : <Robot size={16} weight="duotone" style={{ color: 'var(--warn)' }} />
          }
          {isGreen ? 'Deterministic AST parser' : 'LLM extraction + Pydantic validation'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {(['schema', 'comparison'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="pb-3 px-1 text-sm font-medium transition-colors cursor-pointer capitalize mr-5 border-b-2 -mb-px"
            style={{
              color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderColor: tab === t ? 'var(--accent)' : 'transparent',
            }}
          >
            {t === 'schema' ? 'Normalized Schema' : 'Lane Comparison'}
          </button>
        ))}
      </div>

      {tab === 'schema' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16">

          {/* Field list */}
          <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
            {Object.entries(FIELD_LABELS).map(([key, label]) => {
              const extraction = (baseline as unknown as Record<string, { value: unknown; confidence: number }>)[key];
              const val = extraction?.value;
              const conf = extraction?.confidence ?? 1;
              const isNull = val === null || val === undefined;
              const isBool = typeof val === 'boolean';
              const isPassing = isBool ? val === true : val !== null && val !== 'none' && val !== 'v1';

              return (
                <div
                  key={key}
                  className="flex items-center justify-between py-4"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</div>
                    <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{key}</div>
                  </div>
                  <div className="text-right">
                    {isNull ? (
                      <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>not detected</span>
                    ) : isBool ? (
                      <div className="flex items-center gap-1.5">
                        {val
                          ? <CheckCircle size={13} weight="fill" style={{ color: 'var(--pass)' }} />
                          : <WarningCircle size={13} weight="fill" style={{ color: 'var(--fail)' }} />
                        }
                        <span className="font-mono text-xs" style={{ color: val ? 'var(--pass)' : 'var(--fail)' }}>
                          {String(val)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {isPassing
                          ? <CheckCircle size={13} weight="fill" style={{ color: 'var(--pass)' }} />
                          : <WarningCircle size={13} weight="fill" style={{ color: 'var(--warn)' }} />
                        }
                        <span className="font-mono text-xs" style={{ color: 'var(--text-mono)' }}>{String(val)}</span>
                      </div>
                    )}
                    {!isNull && (
                      <div className="font-mono text-[10px] mt-0.5" style={{ color: conf < 0.80 ? 'var(--warn)' : 'var(--text-tertiary)' }}>
                        {(conf * 100).toFixed(0)}% conf
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confidence + CTA */}
          <div className="mt-8 lg:mt-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] mb-5" style={{ color: 'var(--text-tertiary)' }}>
              Field Confidence
            </p>
            <div className="space-y-4 mb-10">
              {Object.keys(FIELD_LABELS).map(key => {
                const conf = isGreen ? 0.96 + Math.random() * 0.03 : 0.68 + Math.random() * 0.24;
                const w = Math.round(conf * 100);
                const isLow = conf < 0.80;
                return (
                  <div key={key}>
                    <div className="flex justify-between font-mono text-[11px] mb-1.5">
                      <span style={{ color: 'var(--text-tertiary)' }} className="truncate max-w-[28ch]">{key}</span>
                      <span style={{ color: isLow ? 'var(--warn)' : 'var(--pass)' }}>{w}%</span>
                    </div>
                    <div className="h-px" style={{ backgroundColor: 'var(--border-subtle)' }}>
                      <div
                        className="h-px transition-all"
                        style={{ width: `${w}%`, backgroundColor: isLow ? 'var(--warn)' : 'var(--pass)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {!isGreen && (
              <div style={{ borderTop: '1px solid var(--border-subtle)' }} className="pt-5">
                <p className="text-sm leading-relaxed mb-3 max-w-[40ch]" style={{ color: 'var(--text-secondary)' }}>
                  Low-confidence fields are queued for human labeling to improve future extractions.
                </p>
                <button
                  onClick={onOpenTraining}
                  className="flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer"
                  style={{ color: 'var(--accent)' }}
                >
                  <Users size={14} weight="bold" />
                  Open Training UI
                  <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'comparison' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
          {[
            {
              icon: Cpu, lane: 'Green Lane', color: 'var(--pass)',
              points: [
                'AST + regex parser for known CLI dialects',
                'Zero LLM involvement - zero hallucination risk',
                'Sub-millisecond extraction latency',
                'Requires prior dialect library fingerprint',
                'Confidence always 0.96-1.00',
              ],
            },
            {
              icon: Robot, lane: 'Amber Lane', color: 'var(--warn)',
              points: [
                'Handles any vendor CLI not in library',
                'Pydantic schema validates all output fields',
                'Confidence gate: below 0.80 routes to human',
                'Correct labels saved to few-shot store',
                'Confidence typically 0.70-0.92',
              ],
            },
          ].map(({ icon: Icon, lane: laneLabel, color, points }) => (
            <div key={laneLabel}>
              <div className="flex items-center gap-2 mb-4">
                <Icon size={15} weight="duotone" style={{ color }} />
                <span className="text-sm font-semibold" style={{ color }}>{laneLabel}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                {points.map(p => (
                  <div key={p} className="flex items-start gap-3 py-3 text-sm" style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <CheckCircle size={13} weight="fill" style={{ color, marginTop: 2, flexShrink: 0 }} />
                    {p}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
