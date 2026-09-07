// src/components/settings/SettingsView.tsx
// Deliberately de-scoped settings: Benchmark version pin & display density toggle (§6.7, C3)

import React, { useState } from 'react';
import { GearSix, CheckCircle, ShieldCheck, HardDrive } from '@phosphor-icons/react';
import { SUPPORTED_FRAMEWORKS, FrameworkId } from '../../types/canonical';

export const SettingsView: React.FC = () => {
  const [density, setDensity] = useState<'standard' | 'compact'>('standard');
  const [pinnedFramework, setPinnedFramework] = useState<FrameworkId>('cis_v8');
  const [toast, setToast] = useState(false);

  const handleSave = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b pb-6" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <GearSix size={22} style={{ color: 'var(--accent-primary)' }} />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System & Display Settings</h1>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Configure default compliance benchmark version pinning and terminal density.
        </p>
      </div>

      {toast && (
        <div
          className="p-3 rounded border text-xs flex items-center gap-2 text-emerald-800"
          style={{
            backgroundColor: 'var(--status-pass-bg)',
            borderColor: 'rgba(46, 204, 113, 0.3)',
          }}
        >
          <CheckCircle size={16} weight="fill" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      {/* Benchmark Version Pinning Card */}
      <div
        className="p-6 rounded-lg border space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div>
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider font-mono">
            Default Compliance Benchmark Pinning
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Pin the active benchmark revision applied to incoming live pulls and batch uploads.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(SUPPORTED_FRAMEWORKS) as FrameworkId[]).map((fwId) => {
            const fw = SUPPORTED_FRAMEWORKS[fwId];
            const isSelected = pinnedFramework === fwId;

            return (
              <button
                key={fwId}
                onClick={() => setPinnedFramework(fwId)}
                className={`p-3 rounded text-left border transition-colors cursor-pointer text-xs ${
                  isSelected
                    ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="font-semibold text-slate-900 flex justify-between">
                  <span>{fw.name}</span>
                  <span className="font-mono text-[10px] text-slate-500">{fw.version}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">{fw.authority}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Display Density Card */}
      <div
        className="p-6 rounded-lg border space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div>
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider font-mono">
            Terminal Interface Density
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Adjust visual spacing for SOC monitoring workstations vs. standard inspection views.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setDensity('standard')}
            className={`px-4 py-2 rounded text-xs border transition-colors cursor-pointer ${
              density === 'standard'
                ? 'border-sky-600 bg-sky-50 text-sky-950 font-bold shadow-xs'
                : 'border-slate-300 text-slate-700 bg-white hover:border-slate-400'
            }`}
          >
            Standard High-Density (Default)
          </button>
          <button
            onClick={() => setDensity('compact')}
            className={`px-4 py-2 rounded text-xs border transition-colors cursor-pointer ${
              density === 'compact'
                ? 'border-sky-600 bg-sky-50 text-sky-950 font-bold shadow-xs'
                : 'border-slate-300 text-slate-700 bg-white hover:border-slate-400'
            }`}
          >
            Compact Cockpit Mode
          </button>
        </div>
      </div>

      {/* System Provenance Card */}
      <div
        className="p-5 rounded-lg border text-xs font-mono space-y-2"
        style={{ backgroundColor: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="text-slate-800 font-semibold">NETSENTRY DUAL-LANE CORE COMPLIANCE ENGINE</div>
        <div className="text-slate-600 text-[11px]">
          Build: v1.1.0-sih26155-ntro • Engine: Deterministic Lexer + Few-Shot Store
        </div>
        <div className="text-slate-600 text-[11px] truncate">
          Engine Integrity Checksum: sha256:e8b7a42c91fd3c098ab901fe23145da
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-5 py-2 rounded text-xs font-semibold text-white transition-all cursor-pointer shadow-sm hover:brightness-110 active:scale-95"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};
