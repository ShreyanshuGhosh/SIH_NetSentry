// src/components/RulePackExplorer.tsx
// Declarative YAML Rule Pack Explorer with single unified remediation display (no duplication, §4)

import React, { useState } from 'react';
import { Copy, Check, CaretRight, FileCode, CheckCircle } from '@phosphor-icons/react';
import { FrameworkId } from '../types/audit';
import { FRAMEWORKS } from '../data/rulePacks';
import { COMPLIANCE_RULES } from '../engine/rules';
import { SeverityTag } from './shared/SeverityTag';
import { MonoCodeBlock } from './shared/MonoCodeBlock';
import { VENDOR_DISPLAY_NAMES, SupportedVendor } from '../types/canonical';

export const RulePackExplorer: React.FC = () => {
  const [selectedFw, setSelectedFw] = useState<FrameworkId>('cis_v8');
  const [selectedVendor, setSelectedVendor] = useState<SupportedVendor>('cisco_ios');

  const rules = COMPLIANCE_RULES.filter((r) => r.framework === selectedFw);
  const [activeRuleId, setActiveRuleId] = useState<string>(rules[0]?.id || 'CIS-NET-1.1.1');
  const activeRule = rules.find((r) => r.id === activeRuleId) || rules[0] || COMPLIANCE_RULES[0];

  const frameworksList = Object.keys(FRAMEWORKS) as FrameworkId[];
  const vendorsList: SupportedVendor[] = [
    'cisco_ios',
    'juniper_junos',
    'palo_alto_panos',
    'sonic',
    'fortinet_fortios',
    'arista_eos',
  ];

  // Pure declarative YAML representation (single remediation block, no duplication with embedded strings)
  const yamlContent = activeRule
    ? `id: "${activeRule.id}"
title: "${activeRule.title}"
framework: "${activeRule.framework}"
reference: "${activeRule.frameworkRef}"
severity: "${activeRule.severity}"
control_group: "${activeRule.controlGroupId || 'NONE'}"
description: >
  ${activeRule.description}
remediation_target: "${selectedVendor}"
remediation_cli: |
  ${(activeRule.remediation[selectedVendor] || 'Not configured').split('\n').join('\n  ')}`
    : '';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
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
                  : 'border-slate-300 hover:border-slate-400 text-slate-700 bg-white'
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold text-slate-900">{rule.id}</span>
                      <SeverityTag severity={rule.severity} size="sm" />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">{activeRule.id}</span>
                    <SeverityTag severity={activeRule.severity} />
                  </div>
                  <span className="font-mono text-xs text-slate-500">{activeRule.frameworkRef}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">{activeRule.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">{activeRule.description}</p>
              </div>

              {/* Vendor Selector for Remediation Preview */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 uppercase font-mono font-medium">
                  Select Vendor Dialect Remediation
                </span>

                <div className="flex gap-1">
                  {vendorsList.map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVendor(v)}
                      className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                        selectedVendor === v
                          ? 'border-sky-600 bg-sky-50 text-sky-950 font-bold shadow-xs'
                          : 'border-slate-300 text-slate-700 bg-white hover:border-slate-400'
                      }`}
                    >
                      {v.split('_')[0].toUpperCase()}
                    </button>
                  ))}
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
    </div>
  );
};
