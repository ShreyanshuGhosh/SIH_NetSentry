import React, { useState } from 'react';
import { Play, CheckCircle, ArrowRight } from '@phosphor-icons/react';
import { SampleDeviceConfig } from '../types/audit';
import { SAMPLE_CONFIGS } from '../data/sampleConfigs';

interface LivePullSimulatorProps {
  onIngestPulledConfig: (config: SampleDeviceConfig) => void;
}

const DRIVERS = [
  { value: 'cisco_ios',        label: 'cisco_ios         Catalyst / ISR / ASR' },
  { value: 'juniper_junos',    label: 'juniper_junos     SRX / MX Firewall' },
  { value: 'palo_alto',        label: 'palo_alto         PAN-OS NGFW' },
  { value: 'sonic_whitebox',   label: 'sonic_whitebox    SONiC Linux' },
  { value: 'fortinet_fortios', label: 'fortinet_fortios  FortiGate' },
  { value: 'arista_eos',       label: 'arista_eos        Arista EOS' },
];

export const LivePullSimulator: React.FC<LivePullSimulatorProps> = ({ onIngestPulledConfig }) => {
  const [host, setHost]       = useState('10.14.20.1');
  const [driver, setDriver]   = useState('cisco_ios');
  const [user, setUser]       = useState('audit_readonly');
  const [pulling, setPulling] = useState(false);
  const [done, setDone]       = useState(false);
  const [logs, setLogs]       = useState<{ text: string; level: 'info' | 'ok' | 'warn' }[]>([
    { text: '[INIT]  Netmiko collector driver initialized in read-only sandbox.', level: 'info' },
    { text: '[WAIT]  Ready to establish SSHv2 session with remote target.', level: 'info' },
  ]);

  const handlePull = () => {
    setPulling(true);
    setDone(false);
    setLogs([
      { text: `[INFO]  Connecting to ${host} via netmiko.${driver}...`, level: 'info' },
      { text: `[INFO]  Establishing SSHv2 session on port 22 as '${user}'...`, level: 'info' },
    ]);
    setTimeout(() => {
      setLogs(prev => [
        ...prev,
        { text: '[OK]    SSH session authenticated. RSA keypair accepted.', level: 'ok' },
        { text: "[INFO]  Executing: 'show running-config' (read-only, no state change).", level: 'info' },
        { text: '[INFO]  Receiving configuration stream...', level: 'info' },
      ]);
    }, 900);
    setTimeout(() => {
      const cfg = SAMPLE_CONFIGS.find(s => s.vendor === driver) ?? SAMPLE_CONFIGS[0];
      setLogs(prev => [
        ...prev,
        { text: `[OK]    Capture complete. ${cfg.rawText.split('\n').length} lines ingested.`, level: 'ok' },
        { text: '[INFO]  Applying in-memory secret redaction pattern...', level: 'info' },
        { text: `[OK]    SHA-256: e8b7a42c91f...d3c. ${cfg.redactedSecretsCount} secrets redacted.`, level: 'ok' },
        { text: '[DONE]  Config ready for compliance audit pipeline.', level: 'ok' },
      ]);
      setPulling(false);
      setDone(true);
      onIngestPulledConfig(cfg);
    }, 2200);
  };

  const logColor = (level: 'info' | 'ok' | 'warn') =>
    level === 'ok'   ? 'var(--pass)'
    : level === 'warn' ? 'var(--warn)'
    : 'var(--text-secondary)';

  const inputStyle = {
    width: '100%',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    padding: '10px 16px',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    color: 'var(--text-primary)',
    outline: 'none',
  } as React.CSSProperties;

  return (
    <div className="max-w-7xl mx-auto px-6 py-14">

      <h2 className="text-xl font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
        Live Device Pull Simulator
      </h2>
      <p className="text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>
        Read-only SSH collection via Netmiko. No write commands executed. Secrets redacted in memory before ingestion.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12">

        {/* Params */}
        <aside className="lg:col-span-4 space-y-6">
          {[
            { label: 'Target Host', val: host, setter: setHost },
            { label: 'Audit Account', val: user, setter: setUser },
          ].map(({ label, val, setter }) => (
            <div key={label}>
              <label className="block font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
                {label}
              </label>
              <input
                type="text"
                value={val}
                onChange={e => setter(e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
              />
            </div>
          ))}

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
              Device Driver
            </label>
            <select
              value={driver}
              onChange={e => setDriver(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              {DRIVERS.map(d => (
                <option key={d.value} value={d.value} style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
            <p className="font-mono text-[10px] mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Key-based auth only. Password is never transmitted.
            </p>
            <button
              onClick={handlePull}
              disabled={pulling}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm cursor-pointer active:scale-95 disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              onMouseEnter={e => !pulling && (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Play size={14} weight="fill" />
              {pulling ? 'Pulling...' : 'Start Live Pull'}
            </button>
          </div>

          {done && (
            <div className="flex items-start gap-3 text-sm pl-3" style={{ borderLeft: '2px solid var(--pass)' }}>
              <CheckCircle size={14} weight="fill" style={{ color: 'var(--pass)', marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ color: 'var(--text-primary)' }}>Pull complete</p>
                <p className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--pass)' }}>
                  Config sent to Audit Console
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Console */}
        <div className="lg:col-span-8 mt-8 lg:mt-0">
          <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Collector Log
          </p>
          <div
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            {/* Terminal chrome */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--border-strong)' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--border-strong)' }} />
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: pulling ? 'var(--warn)' : done ? 'var(--pass)' : 'var(--border-strong)' }}
                />
              </div>
              <span className="font-mono text-[10px] ml-2" style={{ color: 'var(--text-tertiary)' }}>
                netmiko-collector@sandbox:~$
              </span>
            </div>

            <div className="p-5 font-mono text-xs leading-relaxed space-y-1.5 min-h-[280px]">
              {logs.map((line, i) => (
                <div key={i} style={{ color: logColor(line.level) }}>
                  {line.text}
                </div>
              ))}
              {pulling && (
                <div className="animate-pulse" style={{ color: 'var(--text-tertiary)' }}>_</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
