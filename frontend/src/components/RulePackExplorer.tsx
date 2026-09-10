// src/components/RulePackExplorer.tsx
// Declarative YAML Rule Pack Explorer with single unified remediation display (no duplication, §4)
// Vendor selector shows 6 built-in demo dialects; unlimited via AI Training loop

import React, { useState } from 'react';
import { Copy, Check, CaretRight, FileCode, CheckCircle, ArrowRight, Broadcast } from '@phosphor-icons/react';
import { FrameworkId } from '../types/audit';
import { FRAMEWORKS } from '../data/rulePacks';
import { COMPLIANCE_RULES } from '../engine/rules';
import { SeverityTag } from './shared/SeverityTag';
import { MonoCodeBlock } from './shared/MonoCodeBlock';
import { VENDOR_DISPLAY_NAMES, SupportedVendor } from '../types/canonical';
import { InfraRequirementsModal } from './shared/InfraRequirementsModal';

interface RulePackExplorerProps {
  onOpenTraining?: () => void;
}

export const RulePackExplorer: React.FC<RulePackExplorerProps> = ({ onOpenTraining }) => {
  const [selectedFw, setSelectedFw] = useState<FrameworkId>('cis_v8');
  const [selectedVendor, setSelectedVendor] = useState<SupportedVendor>('cisco_ios');
  const [infraModalOpen, setInfraModalOpen] = useState(false);

  const rules = COMPLIANCE_RULES.filter((r) => r.framework === selectedFw);
  const [activeRuleId, setActiveRuleId] = useState<string>(rules[0]?.id || 'CIS-NET-1.1.1');
  const activeRule = rules.find((r) => r.id === activeRuleId) || rules[0] || COMPLIANCE_RULES[0];

  const frameworksList = Object.keys(FRAMEWORKS) as FrameworkId[];
  // 6 built-in demo dialects; unlimited via AI Training loop — see "Unknown / Other Vendor" option below
  const vendorsList: SupportedVendor[] = [
    'cisco_ios',
    'juniper_junos',
    'palo_alto_panos',
    'sonic',
    'fortinet_fortios',
    'arista_eos',
  ];

  // Short display names for vendor pills
  const vendorShortName: Record<SupportedVendor, string> = {
    cisco_ios: 'Cisco',
    juniper_junos: 'JunOS',
    palo_alto_panos: 'PAN-OS',
    sonic: 'SONiC',
    fortinet_fortios: 'FortiOS',
    arista_eos: 'Arista',
  };

  // Pure declarative YAML representation (single remediation block, no duplication with embedded strings)
  const yamlContent = activeRule
    ? `id: "${activeRule.id}"
title: "${activeRule.title}"
framework: "${activeRule.framework}"
reference: "${activeRule.frameworkRef}"
severity: "${activeRule.severity}"
control_group: "${activeRule.controlGroupId || 'NONE'}"
verification_mode: "${activeRule.infraRequirements ? 'EXTERNAL_INFRASTRUCTURE_REQUIRED' : 'AUTOMATED_STATIC_PARSER'}"
${activeRule.infraRequirements ? `infra_requirements:
  why_static_fails: "${activeRule.infraRequirements.whyConfigInsufficient}"
  required_infra: [${activeRule.infraRequirements.requiredInfrastructure.map(i => `"${i}"`).join(', ')}]
  telemetry_signal: "${activeRule.infraRequirements.telemetrySignal}"
` : ''}description: >
  ${activeRule.description}
remediation_target: "${selectedVendor}"
remediation_cli: |
  ${(activeRule.remediation[selectedVendor] || 'Not configured').split('\n').join('\n  ')}`
    : '';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="border-b pb-6" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <FileCode size={22} style={{ color: 'var(--accent-primary)' }} />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">YAML Rule Pack Explorer</h1>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Declarative compliance benchmark definitions. Pure deterministic rules evaluated against normalized config parameters.
        </p>
      </div>

      {/* Framework Selection Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {frameworksList.map((fwId) => {
          const fw = FRAMEWORKS[fwId];
          const isSelected = selectedFw === fwId;
          return (
            <button
              key={fwId}
              onClick={() => {
                setSelectedFw(fwId);
                const first = COMPLIANCE_RULES.find((r) => r.framework === fwId);
                if (first) setActiveRuleId(first.id);
              }}
              className={`px-4 py-2 rounded text-xs font-mono transition-colors cursor-pointer border ${
                isSelected
                  ? 'border-sky-600 bg-sky-50 text-sky-950 font-bold shadow-xs'
                  : 'border-slate-300 hover:border-slate-400 text-slate-700 bg-[var(--bg-surface)]'
              }`}
            >
              {fw?.name || fwId}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Rule List (4 cols) & Rule Detail (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Rules List */}
        <aside
          className="lg:col-span-4 rounded-lg border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="px-4 py-3 border-b flex items-center justify-between font-mono text-[11px] text-slate-500"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <span>RULES IN BENCHMARK</span>
            <span>{rules.length} CONTROLS</span>
          </div>

          <div className="divide-y divide-slate-200 max-h-[560px] overflow-y-auto">
            {rules.map((rule) => {
              const isActive = activeRule?.id === rule.id;
              return (
                <button
                  key={rule.id}
                  onClick={() => setActiveRuleId(rule.id)}
                  className={`w-full text-left p-3.5 transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    isActive ? 'bg-slate-100 text-slate-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-slate-900">{rule.id}</span>
                      <SeverityTag severity={rule.severity} size="sm" />
                      {rule.infraRequirements && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                          INFRA REQ
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-800 truncate">{rule.title}</div>
                    <div className="font-mono text-[10px] text-slate-500 mt-0.5 truncate">{rule.frameworkRef}</div>
                  </div>
                  {isActive && <CaretRight size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right: Declarative Rule Detail & Unified Remediation */}
        <div className="lg:col-span-8 space-y-6">
          {activeRule && (
            <>
              {/* Header Info */}
              <div
                className="p-5 rounded-lg border space-y-2"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-slate-900">{activeRule.id}</span>
                    <SeverityTag severity={activeRule.severity} />
                    {activeRule.infraRequirements && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold flex items-center gap-1">
                        <Broadcast size={12} weight="bold" />
                        CHECKING INFRA MISSING
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-slate-500">{activeRule.frameworkRef}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">{activeRule.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">{activeRule.description}</p>
                {activeRule.infraRequirements && (
                  <div className="mt-3 pt-3 border-t border-indigo-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="text-[11px] text-indigo-900">
                      <strong>External Checking Infrastructure:</strong> Requires live network prober, SIEM query, or hardware sensors.
                    </div>
                    <button
                      onClick={() => setInfraModalOpen(true)}
                      className="px-3 py-1 text-xs font-medium rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Broadcast size={14} weight="bold" />
                      Click More to Know Details →
                    </button>
                  </div>
                )}
              </div>

              {/* Vendor Selector for Remediation Preview */}
              {/* 6 built-in demo dialects; unlimited via AI Training loop — "Unknown / Other Vendor" routes there */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 uppercase font-mono font-medium">
                    Select Vendor Dialect Remediation
                  </span>
                  <span className="text-[10px] font-mono text-[#7C4F04] bg-[rgba(200,131,10,0.08)] border border-[rgba(200,131,10,0.20)] rounded px-2 py-0.5">
                    6 built-in — any other vendor handled by AI Training loop
                  </span>
                </div>

                <div className="flex gap-1 flex-wrap">
                  {vendorsList.map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVendor(v)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                        selectedVendor === v
                          ? 'border-sky-600 bg-sky-50 text-sky-950 font-bold shadow-xs'
                          : 'border-slate-300 text-slate-700 bg-[var(--bg-surface)] hover:border-slate-400'
                      }`}
                    >
                      {vendorShortName[v]}
                    </button>
                  ))}
                  {/* 7th option: visually distinct — routes to AI Training, not a hardcoded dialect */}
                  <button
                    onClick={() => onOpenTraining?.()}
                    className="px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer border border-dashed border-[#C8830A] text-[#C8830A] hover:bg-[rgba(200,131,10,0.08)] flex items-center gap-1 font-semibold transition-all"
                    title="Any vendor not in the built-in list is handled by the AI Training loop"
                  >
                    <span>+</span>
                    <span>Unknown / Other →</span>
                  </button>
                </div>
              </div>

              {/* Declarative Rule YAML (Unified single display) */}
              <div>
                <MonoCodeBlock
                  code={yamlContent}
                  language="yaml"
                  maxHeight="440px"
                  showLineNumbers={true}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {activeRule && activeRule.infraRequirements && (
        <InfraRequirementsModal
          isOpen={infraModalOpen}
          onClose={() => setInfraModalOpen(false)}
          ruleId={activeRule.id}
          ruleTitle={activeRule.title}
          frameworkRef={activeRule.frameworkRef}
          infraRequirements={activeRule.infraRequirements}
        />
      )}
    </div>
  );
};


