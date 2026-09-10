// src/components/LivePullSimulator.tsx
// Live SSH Collector Simulator with explicit state machine and honest telemetry (§6.5, C1)
// 6 built-in Netmiko drivers; unlimited via AI Training loop — see "Unknown / Other Vendor" option

import React, { useState } from 'react';
import {
  Play,
  CheckCircle,
  WarningCircle,
  ArrowRight,
  ArrowsClockwise,
  ShieldCheck,
  Terminal,
} from '@phosphor-icons/react';
import { SampleDeviceConfig } from '../types/audit';
import { SAMPLE_CONFIGS } from '../data/sampleConfigs';
import { CollectorLogStream, CollectorLogLine } from './live-pull/CollectorLogStream';
import { LivePullState } from '../types/canonical';

interface LivePullSimulatorProps {
  onIngestPulledConfig: (config: SampleDeviceConfig) => void;
  onOpenTraining?: () => void;
}

// 6 built-in demo dialects; unlimited via AI Training loop — "Unknown / Other Vendor" routes there
const DRIVERS = [
  { value: 'cisco_ios', label: 'cisco_ios (Cisco IOS-XE Catalyst/ISR)' },
  { value: 'juniper_junos', label: 'juniper_junos (Juniper JunOS SRX/MX)' },
  { value: 'palo_alto_panos', label: 'palo_alto_panos (Palo Alto PAN-OS NGFW)' },
  { value: 'sonic', label: 'sonic (SONiC Open Linux NOS)' },
  { value: 'fortinet_fortios', label: 'fortinet_fortios (Fortinet FortiGate)' },
  { value: 'arista_eos', label: 'arista_eos (Arista EOS Data Center)' },
  { value: 'ai_training', label: '+ Unknown / Other Vendor → (route to AI Training loop)' },
];

export const LivePullSimulator: React.FC<LivePullSimulatorProps> = ({ onIngestPulledConfig, onOpenTraining }) => {
  const [host, setHost] = useState('10.14.20.1');
  const [port, setPort] = useState('22');
  const [driver, setDriver] = useState('cisco_ios');
  const [user, setUser] = useState('audit_readonly');
  const [state, setState] = useState<LivePullState>('idle');
  const [simulateError, setSimulateError] = useState(false);
  const [logs, setLogs] = useState<CollectorLogLine[]>([
    {
      id: 'log-0',
      timestamp: '00:00:00',
      level: 'info',
      message: 'Netmiko read-only collector driver loaded in unprivileged container sandbox.',
    },
    {
      id: 'log-1',
      timestamp: '00:00:00',
      level: 'info',
      message: 'Target queue ready. System will issue read-only commands without configuration changes.',
    },
  ]);

  const addLog = (level: CollectorLogLine['level'], message: string) => {
    const now = new Date().toTimeString().split(' ')[0];
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: now,
        level,
        message,
      },
    ]);
  };

  const handleStartPull = () => {
    setState('connecting');
    setLogs([]);
    addLog('info', `Initializing Netmiko connection: target=${host}:${port} driver=${driver}...`);
    addLog('info', `Establishing cryptographic SSHv2 session with unprivileged audit account '${user}'...`);

    if (simulateError) {
      setTimeout(() => {
        setState('failed');
        addLog('error', `Connection refused or timed out after 3000ms: host ${host} unreachable.`);
        addLog('warn', 'Recovery action: Verify management gateway ACLs, VPN tunnel, or test host reachability.');
      }, 1500);
      return;
    }

    setTimeout(() => {
      setState('collecting');
      addLog('ok', 'SSHv2 session authenticated successfully. Host key fingerprint verified.');
      addLog('info', "Invoking read-only command: 'show running-config'...");
      addLog('info', 'Receiving raw ASCII configuration stream from terminal buffer...');
    }, 1200);

    setTimeout(() => {
      setState('parsing');
      const targetConfig =
        SAMPLE_CONFIGS.find((s) => s.vendor === driver || s.id.includes(driver.split('_')[0])) ||
        SAMPLE_CONFIGS[0];
      const lines = targetConfig.rawText.split('\n');

      addLog('ok', `Configuration captured: ${lines.length} lines (${targetConfig.rawText.length} bytes).`);
      addLog('info', 'Executing client-side in-memory secret masking before pipeline handoff...');
      addLog('ok', `Redacted ${targetConfig.redactedSecretsCount} secrets (SHA-256 provenance generated).`);
      addLog('ok', 'Pipeline handoff successful. Configuration ready for deterministic compliance audit.');

      setState('completed');
      onIngestPulledConfig(targetConfig);
    }, 2800);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="border-b pb-6" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Terminal size={22} style={{ color: 'var(--accent-primary)' }} />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Live SSH Collector Simulator</h1>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Automated read-only telemetry collection via Netmiko. Strictly executes non-modifying retrieval commands
          with immediate client-side secret masking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Connection Parameters (4 cols) */}
        <aside
          className="lg:col-span-4 p-5 rounded-lg border shadow-xs space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-[11px] font-mono uppercase text-slate-500 font-medium">Connection Parameters</div>

          <div>
            <label className="block text-xs text-slate-600 mb-1">Target Host IP / FQDN</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full px-3 py-2 rounded text-xs font-mono text-slate-900 bg-[var(--bg-surface)] border border-slate-300 outline-none focus:border-sky-600 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Port</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full px-3 py-2 rounded text-xs font-mono text-slate-900 bg-[var(--bg-surface)] border border-slate-300 outline-none focus:border-sky-600 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Audit Account</label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full px-3 py-2 rounded text-xs font-mono text-slate-900 bg-[var(--bg-surface)] border border-slate-300 outline-none focus:border-sky-600 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1">Device Driver</label>
            <select
              value={driver}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ai_training') {
                  onOpenTraining?.();
                  return;
                }
                setDriver(val);
              }}
              className="w-full px-3 py-2 rounded text-xs font-mono text-slate-900 bg-[var(--bg-surface)] border border-slate-300 outline-none focus:border-sky-600 shadow-2xs"
            >
              {DRIVERS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] font-mono text-[#7C4F04] bg-[rgba(200,131,10,0.08)] border border-[rgba(200,131,10,0.20)] rounded px-2 py-1 mt-1.5 leading-relaxed">
              6 built-in drivers — unrecognized vendor syntax is handled by the AI Training loop
            </p>
          </div>

          {/* Test Fail State Toggle (§6.5 C1 demonstration) */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={simulateError}
                onChange={(e) => setSimulateError(e.target.checked)}
                className="rounded text-sky-600 border-slate-300"
              />
              <span>Simulate connection timeout failure</span>
            </label>
          </div>

          <button
            onClick={handleStartPull}
            disabled={state === 'connecting' || state === 'collecting' || state === 'parsing'}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-xs font-semibold text-white transition-all cursor-pointer shadow-sm hover:brightness-105 active:scale-95 disabled:opacity-50 mt-2"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Play size={14} weight="bold" />
            <span>
              {state === 'connecting'
                ? 'Handshaking...'
                : state === 'collecting'
                ? 'Streaming Config...'
                : state === 'parsing'
                ? 'Masking Secrets...'
                : 'Initiate Live Pull'}
            </span>
          </button>
        </aside>

        {/* Right: Collector Log Stream (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider font-mono">
              Live Netmiko Session Telemetry
            </div>
            {state === 'failed' && (
              <button
                onClick={() => {
                  setSimulateError(false);
                  handleStartPull();
                }}
                className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors cursor-pointer"
              >
                <ArrowsClockwise size={13} />
                <span>Retry Connection</span>
              </button>
            )}
          </div>

          <CollectorLogStream logs={logs} state={state} targetHost={host} />

          {state === 'completed' && (
            <div
              className="p-4 rounded-lg border flex items-center justify-between shadow-2xs"
              style={{
                backgroundColor: 'var(--status-pass-bg)',
                borderColor: 'var(--status-pass-border)',
              }}
            >
              <div className="flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                <CheckCircle size={18} weight="fill" style={{ color: 'var(--status-pass)' }} />
                <span>Device configuration captured and sanitized. Ready for compliance evaluation.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
