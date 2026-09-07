// src/components/IngestionConsole.tsx
// Rebuilt Ingestion Console with Single + Bulk upload, collapsed Advanced Lane, and zero-slop styling

import React, { useState } from 'react';
import {
  CaretRight,
  Eye,
  EyeSlash,
  Play,
  SlidersHorizontal,
  UploadSimple,
  HardDrives,
  CheckCircle,
  WarningCircle,
  ShieldCheck,
  LockSimple,
} from '@phosphor-icons/react';
import { FrameworkId, ParsingLane, SampleDeviceConfig } from '../types/audit';
import { SAMPLE_CONFIGS } from '../data/sampleConfigs';
import { FRAMEWORKS } from '../data/rulePacks';
import { redactSecretsInMemory } from '../adapters/adapterUtils';
import { detectVendorFromConfig } from '../adapters';
import { BulkDropzone, BulkConfigFile } from './ingest/BulkDropzone';
import { MonoCodeBlock } from './shared/MonoCodeBlock';
import { LaneBadge } from './shared/LaneBadge';

interface IngestionConsoleProps {
  selectedConfig: SampleDeviceConfig;
  onSelectConfig: (config: SampleDeviceConfig) => void;
  selectedFramework: FrameworkId;
  onSelectFramework: (framework: FrameworkId) => void;
  selectedLane: ParsingLane | 'auto';
  onSelectLane: (lane: ParsingLane | 'auto') => void;
  onExecuteAudit: () => void;
  onBatchAudit?: (files: BulkConfigFile[]) => void;
  isAuditing: boolean;
}

export const IngestionConsole: React.FC<IngestionConsoleProps> = ({
  selectedConfig,
  onSelectConfig,
  selectedFramework,
  onSelectFramework,
  selectedLane,
  onSelectLane,
  onExecuteAudit,
  onBatchAudit,
  isAuditing,
}) => {
  const [ingestMode, setIngestMode] = useState<'single' | 'bulk'>('single');
  const [showRaw, setShowRaw] = useState(false);
  const [showAdvancedLane, setShowAdvancedLane] = useState(false);

  const { redactedText, redactedCount, sourceHash } = redactSecretsInMemory(selectedConfig.rawText);
  const detection = detectVendorFromConfig(selectedConfig.rawText);
  const displayText = showRaw ? selectedConfig.rawText : redactedText;

  const frameworksList = Object.keys(FRAMEWORKS) as FrameworkId[];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Configuration Ingestion Engine</h1>
          <p className="text-xs text-slate-600 mt-1">
            Vendor-agnostic parser with client-side cryptographic secret masking. Evaluates raw configs against compliance rule packs.
          </p>
        </div>

        {/* Segmented Mode Switcher */}
        <div
          className="flex items-center p-1 rounded-lg border w-fit shadow-xs"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setIngestMode('single')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              ingestMode === 'single' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrives size={14} />
            <span>Single Device</span>
          </button>
          <button
            onClick={() => setIngestMode('bulk')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              ingestMode === 'bulk' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadSimple size={14} />
            <span>Bulk Upload Batch</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Bulk Upload */}
      {ingestMode === 'bulk' && (
        <BulkDropzone
          onRunBatchAudit={(files) => {
            if (onBatchAudit) onBatchAudit(files);
            else onExecuteAudit();
          }}
          isAuditing={isAuditing}
        />
      )}

      {/* Mode 2: Single Device Console (Three-Column Layout) */}
      {ingestMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Col 1: Device List (3 cols) */}
          <aside className="lg:col-span-3 space-y-4">
            <div
              className="rounded-lg border shadow-xs overflow-hidden"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div
                className="px-4 py-3 border-b flex items-center justify-between font-mono text-[11px] text-slate-500 font-medium"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-raised)' }}
              >
                <span>TEST CONFIGURATIONS</span>
                <span>{SAMPLE_CONFIGS.length} NODES</span>
              </div>

              <div className="divide-y divide-slate-200">
                {SAMPLE_CONFIGS.map((cfg) => {
                  const isSelected = selectedConfig.id === cfg.id;
                  return (
                    <button
                      key={cfg.id}
                      onClick={() => onSelectConfig(cfg)}
                      className={`w-full text-left p-3.5 flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected ? 'bg-slate-100 text-slate-900 border-l-2 border-sky-600' : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                          {cfg.vendorName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">{cfg.model}</div>
                        <div className="font-mono text-[10px] text-slate-400 truncate">{cfg.osVersion}</div>
                      </div>
                      {isSelected && (
                        <CaretRight size={14} weight="bold" style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Col 2: Framework Selector & Collapsed Parsing Lane (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Target Hardware Details */}
            <div
              className="p-4 rounded-lg border shadow-xs space-y-3"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="text-[11px] font-mono uppercase text-slate-500 font-medium">Target Node Telemetry</div>
              <div>
                <div className="text-sm font-bold text-slate-900">{selectedConfig.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedConfig.deviceType} • S/N: {selectedConfig.serialNumber}</div>
              </div>

              {/* Detected Vendor & Confidence */}
              <div
                className="p-3 rounded border flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--bg-surface-raised)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div>
                  <div className="text-[10px] uppercase font-mono text-slate-500">Classified Dialect</div>
                  <div className="text-xs font-semibold text-emerald-700 font-mono">{detection.dialect}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-500">Confidence</div>
                  <div className="text-xs font-semibold text-slate-900 font-mono">{Math.round(detection.confidence * 100)}%</div>
                </div>
              </div>
            </div>

            {/* Framework Selector */}
            <div
              className="p-4 rounded-lg border shadow-xs space-y-3"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="text-[11px] font-mono uppercase text-slate-500 font-medium">Evaluation Benchmark</div>
              <div className="space-y-2">
                {frameworksList.map((fwId) => {
                  const fw = FRAMEWORKS[fwId];
                  const isSelected = selectedFramework === fwId;
                  return (
                    <button
                      key={fwId}
                      onClick={() => onSelectFramework(fwId)}
                      className={`w-full text-left p-2.5 rounded border text-xs transition-colors cursor-pointer ${
                        isSelected ? 'border-sky-600 bg-sky-50/70 text-slate-900 shadow-xs' : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="font-semibold text-slate-900">{fw.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{fw.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Parsing Lane (Demoted/Collapsed by default per Phase 2 mandate) */}
            <div
              className="rounded-lg border shadow-xs overflow-hidden"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <button
                onClick={() => setShowAdvancedLane(!showAdvancedLane)}
                className="w-full p-3.5 flex items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} />
                  <span>Advanced: Pipeline Routing</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  {selectedLane === 'auto' ? 'Auto Route' : selectedLane === 'deterministic' ? 'Green Lane' : 'Amber Lane'}
                </span>
              </button>

              {showAdvancedLane && (
                <div className="p-3 border-t space-y-2 text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                  {[
                    { id: 'auto', label: 'Auto Route (Recommended)', sub: 'Green lane first, amber fallback for unknown syntax' },
                    { id: 'deterministic', label: 'Green Lane Only', sub: 'Strict compiled lexer; flag unknown lines as unverified' },
                    { id: 'llm_fallback', label: 'Amber Lane (Few-Shot Store)', sub: 'Extract parameters using exemplar store' },
                  ].map((lane) => (
                    <button
                      key={lane.id}
                      onClick={() => onSelectLane(lane.id as any)}
                      className={`w-full text-left p-2 rounded border transition-colors cursor-pointer ${
                        selectedLane === lane.id ? 'border-sky-600 bg-sky-50 text-slate-900' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="font-medium text-slate-900">{lane.label}</div>
                      <div className="text-[10px] text-slate-500">{lane.sub}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Run Audit Action */}
            <button
              onClick={onExecuteAudit}
              disabled={isAuditing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded text-xs font-semibold text-white transition-all cursor-pointer shadow-sm hover:brightness-105 active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Play size={14} weight="bold" />
              <span>{isAuditing ? 'Executing Compliance Audit...' : 'Execute Compliance Audit'}</span>
            </button>
          </div>

          {/* Col 3: Config Viewer with In-Memory Redaction Toggle (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-500 uppercase font-medium">Redacted Source Config</span>
                <span className="font-mono text-[10px] text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200 bg-emerald-50">
                  {redactedCount} secrets masked
                </span>
              </div>

              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                {showRaw ? <EyeSlash size={14} /> : <Eye size={14} />}
                <span>{showRaw ? 'Hide Raw Secrets' : 'View Raw Secrets'}</span>
              </button>
            </div>

            {/* Syntax block */}
            <MonoCodeBlock
              code={displayText}
              language={detection.dialect}
              maxHeight="540px"
              className="w-full shadow-xs"
            />

            <div className="font-mono text-[10px] text-slate-400 truncate">
              Source Hash: {sourceHash}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
