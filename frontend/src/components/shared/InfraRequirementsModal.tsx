// src/components/shared/InfraRequirementsModal.tsx
// Comprehensive diagnostic drawer/modal explaining external infrastructure requirements for non-static network rules

import React, { useState } from 'react';
import {
  X,
  WarningCircle,
  HardDrives,
  Terminal,
  ArrowsClockwise,
  CheckCircle,
  Copy,
  Check,
  ShieldCheck,
  Broadcast
} from '@phosphor-icons/react';
import { InfraCheckRequirements } from '../../types/canonical';

interface InfraRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleId: string;
  ruleTitle: string;
  frameworkRef: string;
  infraRequirements?: InfraCheckRequirements;
}

export const InfraRequirementsModal: React.FC<InfraRequirementsModalProps> = ({
  isOpen,
  onClose,
  ruleId,
  ruleTitle,
  frameworkRef,
  infraRequirements,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !infraRequirements) return null;

  const handleCopy = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                {ruleId}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                <Broadcast size={12} className="animate-pulse text-amber-600" />
                Checking Infra Missing
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900">{ruleTitle}</h2>
            <p className="font-mono text-[11px] text-slate-500">{frameworkRef}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Section 1: Why Config File Inspection Is Insufficient */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs uppercase tracking-wider">
              <WarningCircle size={16} className="text-amber-600 shrink-0" />
              <span>Why Static Config Analysis Is Insufficient</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed">
              {infraRequirements.whyConfigInsufficient}
            </p>
          </div>

          {/* Section 2: Required Checking Infrastructure & Tools */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs uppercase tracking-wider">
              <HardDrives size={16} className="text-slate-600 shrink-0" />
              <span>Required Checking Infrastructure</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {infraRequirements.requiredInfrastructure.map((infra, idx) => (
                <span
                  key={idx}
                  className="font-mono text-xs px-2.5 py-1 rounded border border-slate-300 bg-slate-50 text-slate-800 flex items-center gap-1.5 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  {infra}
                </span>
              ))}
            </div>
          </div>

          {/* Section 3: Synthetic Probe / Audit Command Sequence */}
          {infraRequirements.syntheticProbeCommand && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                  <Terminal size={16} className="text-slate-600 shrink-0" />
                  <span>Synthetic Probe / Active Audit Query</span>
                </div>
                <button
                  onClick={() => handleCopy(infraRequirements.syntheticProbeCommand)}
                  className="text-xs font-mono text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Query'}</span>
                </button>
              </div>
              <div className="relative rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-emerald-400 overflow-x-auto">
                <pre className="whitespace-pre-wrap">{infraRequirements.syntheticProbeCommand}</pre>
              </div>
            </div>
          )}

          {/* Section 4: Telemetry Signal Verification */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs uppercase tracking-wider">
              <ArrowsClockwise size={16} className="text-slate-600 shrink-0" />
              <span>Expected Telemetry Signal / Attestation Response</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800">
              {infraRequirements.telemetrySignal}
            </div>
          </div>

          {/* Section 5: Step-by-Step Verification Procedure */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs uppercase tracking-wider">
              <ShieldCheck size={16} className="text-slate-600 shrink-0" />
              <span>Comprehensive Audit & Verification Procedure</span>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 bg-white text-xs text-slate-700 space-y-2 leading-relaxed">
              {infraRequirements.verificationProcedure.split('\n').map((step, idx) => (
                <p key={idx} className={step.startsWith('-') || step.match(/^\d+\./) ? 'pl-2' : ''}>
                  {step}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Status remains <strong className="text-amber-700">CHECKING INFRA MISSING</strong> until live sensor probe connects.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
