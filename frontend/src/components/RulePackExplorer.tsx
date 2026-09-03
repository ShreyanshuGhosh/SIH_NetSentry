import React, { useState } from 'react';
import { Copy, Check, CaretRight } from '@phosphor-icons/react';
import { FrameworkId } from '../types/audit';
import { AUDIT_RULES, FRAMEWORKS } from '../data/rulePacks';

const SEV_COLOR: Record<string, string> = {
  CRITICAL: 'var(--crit)',
  HIGH:     'var(--fail)',
  MEDIUM:   'var(--warn)',
  LOW:      'var(--text-tertiary)',
};

export const RulePackExplorer: React.FC = () => {
  const [fw, setFw]         = useState<FrameworkId>('cis_v8');
  const [ruleId, setRuleId] = useState<string>(AUDIT_RULES[0].id);
  const [copied, setCopied] = useState(false);

  const rules = AUDIT_RULES.filter(r => r.framework === fw);
  const active = rules.find(r => r.id === ruleId) ?? rules[0];

  const yaml = active ? `id: ${active.id}
title: "${active.title}"
framework: ${active.framework}
reference: "${active.frameworkRef}"
severity: ${active.severity}
check:
  field: ${active.field}
  operator: ${active.operator}
  expected_value: ${active.targetValue}
pass_message: "${active.passMessage}"
fail_message: "${active.failMessage}"
remediation:
  cisco_ios: "${active.remediation.cisco_ios?.replace(/\n/g, '\\n') ?? ''}"
  juniper_junos: "${active.remediation.juniper_junos?.replace(/\n/g, '\\n') ?? ''}"
  palo_alto: "${active.remediation.palo_alto?.replace(/\n/g, '\\n') ?? ''}"` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-14">

      <h2 className="text-xl font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
        YAML Rule Pack Explorer
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Declarative rule definitions used by the compliance evaluation engine.
      </p>

      {/* Framework tabs */}
      <div className="flex gap-1 mb-8">
        {(Object.keys(FRAMEWORKS) as FrameworkId[]).map(fwId => (
          <button
            key={fwId}
            onClick={() => {
              setFw(fwId);
              const first = AUDIT_RULES.find(r => r.framework === fwId);
              if (first) setRuleId(first.id);
            }}
            className="px-4 py-2 rounded text-xs font-mono cursor-pointer transition-colors relative"
            style={{
              color: fw === fwId ? 'var(--text-primary)' : 'var(--text-tertiary)',
              backgroundColor: fw === fwId ? 'var(--bg-elevated)' : 'transparent',
              border: fw === fwId ? '1px solid var(--border-default)' : '1px solid transparent',
            }}
          >
            {fw === fwId && (
              <span className="absolute left-0 top-1 bottom-1 w-px" style={{ backgroundColor: 'var(--accent)' }} />
            )}
            {FRAMEWORKS[fwId].name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10">

        {/* Rule list */}
        <aside className="lg:col-span-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="font-mono text-[10px] uppercase tracking-widest py-3" style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
            {rules.length} rules
          </p>
          {rules.map(rule => (
            <button
              key={rule.id}
              onClick={() => setRuleId(rule.id)}
              className="w-full text-left py-3.5 flex items-center gap-3 cursor-pointer transition-colors"
              style={{ borderBottom: '1px solid var(--border-subtle)', color: ruleId === rule.id ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
              onMouseEnter={e => { if (ruleId !== rule.id) e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { if (ruleId !== rule.id) e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{rule.title}</div>
                <div className="font-mono text-[10px] mt-0.5" style={{ color: SEV_COLOR[rule.severity] }}>
                  {rule.severity}
                </div>
              </div>
              {ruleId === rule.id && <CaretRight size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
            </button>
          ))}
        </aside>

        {/* YAML view */}
        <div className="lg:col-span-8 mt-8 lg:mt-0">
          {active && (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{active.title}</p>
                  <p className="font-mono text-[11px] mt-0.5" style={{ color: SEV_COLOR[active.severity] }}>
                    {active.severity} - {active.frameworkRef}
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 font-mono text-[11px] cursor-pointer transition-colors shrink-0"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                >
                  {copied ? <Check size={12} style={{ color: 'var(--pass)' }} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy YAML'}
                </button>
              </div>

              <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div
                  className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest"
                  style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}
                >
                  rule.yaml
                </div>
                <pre className="font-mono text-xs p-5 overflow-x-auto leading-relaxed" style={{ color: 'var(--text-mono)' }}>
                  {yaml}
                </pre>
              </div>

              {/* Remediation */}
              <div className="mt-8" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 24 }}>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-5" style={{ color: 'var(--text-tertiary)' }}>
                  CLI Remediation Commands
                </p>
                <div className="space-y-4">
                  {[
                    { label: 'Cisco IOS-XE',    cmd: active.remediation.cisco_ios },
                    { label: 'Juniper JunOS',    cmd: active.remediation.juniper_junos },
                    { label: 'Palo Alto PAN-OS', cmd: active.remediation.palo_alto },
                    { label: 'SONiC Linux',      cmd: active.remediation.sonic_whitebox },
                  ].filter(r => r.cmd).map(({ label, cmd }) => (
                    <div key={label}>
                      <p className="font-mono text-[10px] mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                        <pre className="font-mono text-xs p-4 overflow-x-auto leading-relaxed" style={{ color: 'var(--pass)' }}>
                          {cmd}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
