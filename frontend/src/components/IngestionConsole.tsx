import React, { useState } from 'react';
import { LockSimple, CaretRight, Eye, EyeSlash, CheckCircle, WarningCircle, Cpu } from '@phosphor-icons/react';
import { FrameworkId, ParsingLane, SampleDeviceConfig } from '../types/audit';
import { SAMPLE_CONFIGS } from '../data/sampleConfigs';
import { FRAMEWORKS } from '../data/rulePacks';
import { detectVendor, redactSecrets } from '../utils/auditEngine';

interface IngestionConsoleProps {
  selectedConfig: SampleDeviceConfig;
  onSelectConfig: (config: SampleDeviceConfig) => void;
  selectedFramework: FrameworkId;
  onSelectFramework: (framework: FrameworkId) => void;
  selectedLane: ParsingLane | 'auto';
  onSelectLane: (lane: ParsingLane | 'auto') => void;
  onExecuteAudit: () => void;
  isAuditing: boolean;
}

const LANES = [
  { id: 'auto',          label: 'Auto Route',       sub: 'Green first, Amber fallback' },
  { id: 'deterministic', label: 'Green Lane only',   sub: 'Fail if dialect unknown' },
  { id: 'llm_fallback',  label: 'Amber Lane only',   sub: 'Force LLM extraction' },
];

export const IngestionConsole: React.FC<IngestionConsoleProps> = ({
  selectedConfig,
  onSelectConfig,
  selectedFramework,
  onSelectFramework,
  selectedLane,
  onSelectLane,
  onExecuteAudit,
  isAuditing,
}) => {
  const [showRaw, setShowRaw] = useState(false);
  const { redactedText, count: redactedCount } = redactSecrets(selectedConfig.rawText);
  const vendor = detectVendor(selectedConfig.rawText);
  const displayText = showRaw ? selectedConfig.rawText : redactedText;

  return (
    <div className="max-w-7xl mx-auto px-6 py-14">

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            Ingestion Console
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Select a device configuration. Secrets are redacted in memory before any processing.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-[11px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Detected Vendor
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--pass)' }}>{vendor.vendor}</div>
          <div className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {(vendor.confidence * 100).toFixed(0)}% confidence - {vendor.dialect}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10">

        {/* Left rail */}
        <aside className="lg:col-span-3 space-y-8">

          {/* Config selector */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Test Configurations
            </p>
            <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
              {SAMPLE_CONFIGS.map(cfg => (
                <button
                  key={cfg.id}
                  onClick={() => onSelectConfig(cfg)}
                  className="w-full text-left py-3 flex items-center justify-between cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--border-subtle)', color: selectedConfig.id === cfg.id ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                  onMouseEnter={e => { if (selectedConfig.id !== cfg.id) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  onMouseLeave={e => { if (selectedConfig.id !== cfg.id) e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                >
                  <div>
                    <div className="text-sm font-medium">{cfg.vendorName}</div>
                    <div className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{cfg.osVersion}</div>
                  </div>
                  {selectedConfig.id === cfg.id && (
                    <CaretRight size={12} weight="bold" style={{ color: 'var(--accent)' }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Framework selector */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Framework
            </p>
            <div className="space-y-0.5">
              {Object.values(FRAMEWORKS).map(fw => (
                <button
                  key={fw.id}
                  onClick={() => onSelectFramework(fw.id as FrameworkId)}
                  className="w-full text-left px-3 py-2.5 rounded text-sm cursor-pointer transition-colors relative"
                  style={{
                    color: selectedFramework === fw.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    backgroundColor: selectedFramework === fw.id ? 'var(--bg-elevated)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (selectedFramework !== fw.id) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  onMouseLeave={e => { if (selectedFramework !== fw.id) e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                >
                  {selectedFramework === fw.id && (
                    <span className="absolute left-0 top-1 bottom-1 w-px" style={{ backgroundColor: 'var(--accent)' }} />
                  )}
                  {fw.name}
                </button>
              ))}
            </div>
          </div>

          {/* Lane */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Parsing Lane
            </p>
            <div className="space-y-0.5">
              {LANES.map(lane => (
                <button
                  key={lane.id}
                  onClick={() => onSelectLane(lane.id as ParsingLane | 'auto')}
                  className="w-full text-left px-3 py-2.5 rounded cursor-pointer transition-colors"
                  style={{
                    backgroundColor: selectedLane === lane.id ? 'var(--bg-elevated)' : 'transparent',
                    color: selectedLane === lane.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  <div className="text-sm">{lane.label}</div>
                  <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{lane.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Config view */}
        <div className="lg:col-span-9 flex flex-col gap-4 mt-8 lg:mt-0">

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              <LockSimple size={12} style={{ color: 'var(--pass)' }} />
              {redactedCount} secret{redactedCount !== 1 ? 's' : ''} redacted
              {vendor.dialect !== 'unknown'
                ? <><CheckCircle size={12} weight="fill" style={{ color: 'var(--pass)', marginLeft: 12 }} /> Green Lane eligible</>
                : <><WarningCircle size={12} weight="fill" style={{ color: 'var(--warn)', marginLeft: 12 }} /> Amber Lane fallback</>
              }
            </div>
            <button
              onClick={() => setShowRaw(v => !v)}
              className="flex items-center gap-1.5 font-mono text-[11px] cursor-pointer transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              {showRaw ? <EyeSlash size={13} /> : <Eye size={13} />}
              {showRaw ? 'Show Redacted' : 'Show Raw'}
            </button>
          </div>

          {/* Config block */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest"
              style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}
            >
              <span>{selectedConfig.vendorName}</span>
              <span style={{ color: 'var(--border-strong)' }}>|</span>
              <span>{selectedConfig.model}</span>
              <span style={{ color: 'var(--border-strong)' }}>|</span>
              <span>{selectedConfig.rawText.split('\n').length} lines</span>
            </div>
            <pre
              className="font-mono text-xs leading-relaxed p-5 overflow-auto max-h-[400px] whitespace-pre-wrap break-all"
              style={{ color: 'var(--text-mono)' }}
            >
              {displayText}
            </pre>
          </div>

          <button
            onClick={onExecuteAudit}
            disabled={isAuditing}
            className="self-start flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-opacity cursor-pointer active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            onMouseEnter={e => !isAuditing && (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Cpu size={14} weight="bold" />
            {isAuditing ? 'Evaluating...' : 'Run Compliance Audit'}
          </button>
        </div>
      </div>
    </div>
  );
};
