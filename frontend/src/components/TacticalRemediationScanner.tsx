// src/components/TacticalRemediationScanner.tsx
// Drag-to-compare before/after remediation diff scrubber wired for ALL 6 VENDORS (§5, Phase 5)

import React, { useState, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  WarningCircle,
  CheckCircle,
  ArrowsLeftRight,
  Terminal,
  Cpu,
  ArrowRight,
  Copy,
  Check,
} from '@phosphor-icons/react';

export type ScannerDialect = 'cisco' | 'juniper' | 'paloalto' | 'sonic' | 'fortinet' | 'arista';

interface DiffLine {
  lineNum: number;
  vulnText: string;
  vulnHighlight?: string;
  vulnRule?: string;
  hardText: string;
  hardHighlight?: string;
  hardRule?: string;
}

const SCANNER_CONFIGS: Record<
  ScannerDialect,
  {
    name: string;
    model: string;
    os: string;
    benchmark: string;
    lines: DiffLine[];
  }
> = {
  cisco: {
    name: 'Cisco IOS-XE',
    model: 'Catalyst 9300-48P Enterprise Core',
    os: 'IOS-XE 17.9.4a',
    benchmark: 'CIS Cisco IOS-XE Benchmark v2.0.0 / DISA STIG',
    lines: [
      {
        lineNum: 11,
        vulnText: 'no service password-encryption',
        vulnHighlight: 'no service password-encryption',
        vulnRule: 'CIS-1.1.4',
        hardText: 'service password-encryption',
        hardHighlight: 'service password-encryption',
        hardRule: 'REMEDIATED [PASS]',
      },
      {
        lineNum: 12,
        vulnText: 'enable password 7 04580F153205',
        vulnHighlight: 'enable password 7 04580F153205',
        vulnRule: 'CIS-1.1.1 [CRIT]',
        hardText: 'enable secret 9 $9$mK82$J9x1fL92kP01eX',
        hardHighlight: 'enable secret 9 $9$mK82$J9x1fL92kP01eX',
        hardRule: 'TYPE_9_SHA512 [PASS]',
      },
      {
        lineNum: 13,
        vulnText: 'no ip ssh version 2',
        vulnHighlight: 'no ip ssh version 2',
        vulnRule: 'CIS-1.2.1 [HIGH]',
        hardText: 'ip ssh version 2',
        hardHighlight: 'ip ssh version 2',
        hardRule: 'SSH_V2_ENFORCED [PASS]',
      },
      {
        lineNum: 14,
        vulnText: 'ip http server',
        vulnHighlight: 'ip http server',
        vulnRule: 'CIS-1.3.4 [HIGH]',
        hardText: 'no ip http server',
        hardHighlight: 'no ip http server',
        hardRule: 'PLAINTEXT_HTTP_OFF [PASS]',
      },
      {
        lineNum: 15,
        vulnText: 'snmp-server community public RO',
        vulnHighlight: 'snmp-server community public RO',
        vulnRule: 'CIS-4.1.1 [CRIT]',
        hardText: 'snmp-server group SEC_RO v3 priv',
        hardHighlight: 'snmp-server group SEC_RO v3 priv',
        hardRule: 'SNMPV3_AUTHPRIV [PASS]',
      },
      {
        lineNum: 16,
        vulnText: 'line vty 0 4',
        hardText: 'line vty 0 4',
      },
      {
        lineNum: 17,
        vulnText: ' transport input telnet',
        vulnHighlight: 'transport input telnet',
        vulnRule: 'STIG-NET-0001',
        hardText: ' transport input ssh',
        hardHighlight: 'transport input ssh',
        hardRule: 'TELNET_DISABLED [PASS]',
      },
      {
        lineNum: 18,
        vulnText: ' exec-timeout 0 0',
        vulnHighlight: 'exec-timeout 0 0',
        vulnRule: 'CIS-5.1.2 [MED]',
        hardText: ' exec-timeout 10 0',
        hardHighlight: 'exec-timeout 10 0',
        hardRule: '10M_IDLE_LOCK [PASS]',
      },
      {
        lineNum: 19,
        vulnText: 'no logging host 10.14.5.50',
        vulnHighlight: 'no logging host 10.14.5.50',
        vulnRule: 'NIST-AU-3',
        hardText: 'logging host 10.14.5.50 transport udp port 514',
        hardHighlight: 'logging host 10.14.5.50 transport udp port 514',
        hardRule: 'SIEM_FORWARDING [PASS]',
      },
    ],
  },
  juniper: {
    name: 'Juniper JunOS',
    model: 'SRX345 Enterprise Firewall Gateway',
    os: 'JunOS 22.4R2-S2.5',
    benchmark: 'CIS Juniper JunOS Benchmark v1.1.0',
    lines: [
      {
        lineNum: 4,
        vulnText: 'services { telnet; }',
        vulnHighlight: 'telnet;',
        vulnRule: 'CIS-JUNOS-2.1 [CRIT]',
        hardText: '/* telnet service deleted */',
        hardHighlight: '/* telnet service deleted */',
        hardRule: 'TELNET_PURGED [PASS]',
      },
      {
        lineNum: 5,
        vulnText: 'services { ssh { protocol-version v1; } }',
        vulnHighlight: 'protocol-version v1;',
        vulnRule: 'CIS-JUNOS-2.2 [HIGH]',
        hardText: 'services { ssh { protocol-version v2; } }',
        hardHighlight: 'protocol-version v2;',
        hardRule: 'SSH_V2_SET [PASS]',
      },
      {
        lineNum: 6,
        vulnText: 'web-management { http; }',
        vulnHighlight: 'http;',
        vulnRule: 'CIS-JUNOS-2.4 [HIGH]',
        hardText: 'web-management { https { port 443; } }',
        hardHighlight: 'https { port 443; }',
        hardRule: 'TLS_WEB_MGMT [PASS]',
      },
      {
        lineNum: 7,
        vulnText: 'snmp { community public { authorization read-only; } }',
        vulnHighlight: 'community public',
        vulnRule: 'CIS-JUNOS-3.1 [CRIT]',
        hardText: 'snmp { v3 { usm { local-engine { user sec-admin { ... } } } } }',
        hardHighlight: 'v3 { usm { local-engine',
        hardRule: 'SNMPV3_USM [PASS]',
      },
      {
        lineNum: 8,
        vulnText: '/* no syslog host configured */',
        vulnHighlight: 'no syslog host',
        vulnRule: 'NIST-AU-3',
        hardText: 'syslog { host 10.14.5.50 { any warning; } }',
        hardHighlight: 'host 10.14.5.50',
        hardRule: 'SYSLOG_ACTIVE [PASS]',
      },
    ],
  },
  paloalto: {
    name: 'Palo Alto PAN-OS',
    model: 'PA-3220 Next-Gen Perimeter Firewall',
    os: 'PAN-OS 11.0.2-h3',
    benchmark: 'CIS Palo Alto Firewall 11 Benchmark v1.0.0',
    lines: [
      {
        lineNum: 5,
        vulnText: 'set deviceconfig system service disable-telnet no',
        vulnHighlight: 'disable-telnet no',
        vulnRule: 'CIS-PAN-1.1 [CRIT]',
        hardText: 'set deviceconfig system service disable-telnet yes',
        hardHighlight: 'disable-telnet yes',
        hardRule: 'TELNET_OFF [PASS]',
      },
      {
        lineNum: 6,
        vulnText: 'set deviceconfig system service disable-http no',
        vulnHighlight: 'disable-http no',
        vulnRule: 'CIS-PAN-1.2 [HIGH]',
        hardText: 'set deviceconfig system service disable-http yes',
        hardHighlight: 'disable-http yes',
        hardRule: 'HTTP_OFF [PASS]',
      },
      {
        lineNum: 7,
        vulnText: 'set deviceconfig system ssh-version 1',
        vulnHighlight: 'ssh-version 1',
        vulnRule: 'CIS-PAN-1.3 [HIGH]',
        hardText: 'set deviceconfig system ssh-version 2',
        hardHighlight: 'ssh-version 2',
        hardRule: 'SSH_V2 [PASS]',
      },
      {
        lineNum: 8,
        vulnText: 'set deviceconfig system idle-timeout 0',
        vulnHighlight: 'idle-timeout 0',
        vulnRule: 'CIS-PAN-2.1 [MED]',
        hardText: 'set deviceconfig system idle-timeout 10',
        hardHighlight: 'idle-timeout 10',
        hardRule: 'TIMEOUT_10M [PASS]',
      },
    ],
  },
  sonic: {
    name: 'SONiC Linux',
    model: 'Edgecore AS7712-32X Leaf Switch',
    os: 'SONiC.202311.0',
    benchmark: 'Open Compute Project (OCP) Hardening Profile',
    lines: [
      {
        lineNum: 14,
        vulnText: '"TELNET": { "global": { "status": "enabled" } }',
        vulnHighlight: '"status": "enabled"',
        vulnRule: 'CIS-SONIC-1.1 [CRIT]',
        hardText: '"TELNET": { "global": { "status": "disabled" } }',
        hardHighlight: '"status": "disabled"',
        hardRule: 'DAEMON_STOPPED [PASS]',
      },
      {
        lineNum: 15,
        vulnText: '"SSH": { "global": { "protocol": "1", "idle_timeout": "0" } }',
        vulnHighlight: '"protocol": "1"',
        vulnRule: 'CIS-SONIC-1.2 [HIGH]',
        hardText: '"SSH": { "global": { "protocol": "2", "idle_timeout": "600" } }',
        hardHighlight: '"protocol": "2", "idle_timeout": "600"',
        hardRule: 'SSH2_600S [PASS]',
      },
      {
        lineNum: 16,
        vulnText: '/* no remote syslog server in config_db.json */',
        vulnHighlight: 'no remote syslog',
        vulnRule: 'NIST-AU-3',
        hardText: '"SYSLOG_SERVER": { "10.14.5.50": { "port": "514", "facility": "local6" } }',
        hardHighlight: '"SYSLOG_SERVER": { "10.14.5.50"',
        hardRule: 'SIEM_FORWARD [PASS]',
      },
    ],
  },
  fortinet: {
    name: 'Fortinet FortiOS',
    model: 'FortiGate 60F Edge Appliance',
    os: 'FortiOS v7.4.2',
    benchmark: 'CIS Fortinet FortiOS 7.x Benchmark',
    lines: [
      {
        lineNum: 3,
        vulnText: 'set admin-telnet-service enable',
        vulnHighlight: 'admin-telnet-service enable',
        vulnRule: 'CIS-FGT-1.1 [CRIT]',
        hardText: 'set admin-telnet-service disable',
        hardHighlight: 'admin-telnet-service disable',
        hardRule: 'TELNET_OFF [PASS]',
      },
      {
        lineNum: 4,
        vulnText: 'set admin-http-service enable',
        vulnHighlight: 'admin-http-service enable',
        vulnRule: 'CIS-FGT-1.2 [HIGH]',
        hardText: 'set admin-http-service disable',
        hardHighlight: 'admin-http-service disable',
        hardRule: 'HTTP_OFF [PASS]',
      },
      {
        lineNum: 5,
        vulnText: 'set admintimeout 0',
        vulnHighlight: 'admintimeout 0',
        vulnRule: 'CIS-FGT-1.3 [MED]',
        hardText: 'set admintimeout 10',
        hardHighlight: 'admintimeout 10',
        hardRule: '10M_LOCK [PASS]',
      },
    ],
  },
  arista: {
    name: 'Arista EOS',
    model: 'Arista 7050X Data Center Leaf Switch',
    os: 'EOS 4.30.2F',
    benchmark: 'CIS Arista EOS Benchmark v1.0.0',
    lines: [
      {
        lineNum: 8,
        vulnText: 'management telnet',
        vulnHighlight: 'management telnet',
        vulnRule: 'CIS-EOS-1.1 [CRIT]',
        hardText: 'no management telnet',
        hardHighlight: 'no management telnet',
        hardRule: 'TELNET_PURGED [PASS]',
      },
      {
        lineNum: 9,
        vulnText: 'management ssh\n protocol version 1',
        vulnHighlight: 'protocol version 1',
        vulnRule: 'CIS-EOS-1.2 [HIGH]',
        hardText: 'management ssh\n protocol version 2',
        hardHighlight: 'protocol version 2',
        hardRule: 'SSH_V2 [PASS]',
      },
      {
        lineNum: 10,
        vulnText: 'management api http-commands\n no shutdown',
        vulnHighlight: 'http-commands\n no shutdown',
        vulnRule: 'CIS-EOS-1.3 [HIGH]',
        hardText: 'no management api http-commands',
        hardHighlight: 'no management api http-commands',
        hardRule: 'HTTP_API_OFF [PASS]',
      },
    ],
  },
};

interface TacticalRemediationScannerProps {
  onLaunchConsole?: () => void;
}

export const TacticalRemediationScanner: React.FC<TacticalRemediationScannerProps> = ({ onLaunchConsole }) => {
  const [dialect, setDialect] = useState<ScannerDialect>('cisco');
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100%
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cfg = SCANNER_CONFIGS[dialect];

  const updateSliderFromEvent = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setSliderPos(Math.round(pct));
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) updateSliderFromEvent(e.clientX);
  };

  const handleCopyRemediation = () => {
    const commands = cfg.lines.map((l) => l.hardText).join('\n');
    navigator.clipboard.writeText(commands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} style={{ color: 'var(--accent-primary)' }} />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tactical Remediation Scanner</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Drag the scrub handle to compare non-compliant configurations against certified hardening playbooks across all 6 dialects.
          </p>
        </div>

        {/* Vendor Selector Tabs (All 6 dialects) */}
        <div className="flex gap-1 overflow-x-auto p-1 rounded border border-slate-200 bg-slate-100 font-mono text-[11px]">
          {(['cisco', 'juniper', 'paloalto', 'sonic', 'fortinet', 'arista'] as const).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDialect(d);
                setSliderPos(50);
              }}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                dialect === d ? 'bg-slate-900 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {SCANNER_CONFIGS[d].name}
            </button>
          ))}
        </div>
      </div>

      {/* Target Device Telemetry Strip */}
      <div
        className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div>
          <span className="font-semibold text-slate-900">{cfg.name}</span>
          <span className="text-slate-400 mx-2">•</span>
          <span className="text-slate-600">{cfg.model}</span>
          <span className="text-slate-400 mx-2">•</span>
          <span className="font-mono text-slate-600">{cfg.os}</span>
        </div>

        <button
          onClick={handleCopyRemediation}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-400 transition-colors cursor-pointer shadow-xs w-fit"
        >
          {copied ? (
            <>
              <Check size={12} style={{ color: 'var(--status-pass)' }} />
              <span style={{ color: 'var(--status-pass)' }}>Hardening Script Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy Remediated Script</span>
            </>
          )}
        </button>
      </div>

      {/* Meaningful Scrub Indicator (§5 Phase 5) */}
      <div className="flex items-center justify-between text-xs font-mono px-1">
        <div className="flex items-center gap-2 text-rose-700 font-semibold">
          <span className="w-2 h-2 rounded-full bg-rose-600" />
          <span>VULNERABLE BASELINE (0%)</span>
        </div>

        <div className="text-slate-600 font-semibold">
          Scrub Position: <span className="text-slate-900 font-bold">{sliderPos}% Hardened</span>
        </div>

        <div className="flex items-center gap-2 text-emerald-700 font-semibold">
          <span>COMPLIANT POSTURE (100%)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
        </div>
      </div>

      {/* Interactive Diff-Scrubber Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative rounded-lg border overflow-hidden cursor-ew-resize select-none bg-rose-50/30"
        style={{
          borderColor: 'var(--border-subtle)',
          minHeight: '440px',
        }}
      >
        {/* Left Side: Vulnerable Lines (Rose Tinted) */}
        <div className="p-6 font-mono text-xs leading-relaxed space-y-3 bg-rose-50/20">
          {cfg.lines.map((line, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <span className="text-slate-400 select-none w-8 text-right shrink-0">L{line.lineNum}</span>
              <span className="flex-1 text-rose-800 font-mono font-medium">
                {line.vulnText}
              </span>
              {line.vulnRule && (
                <span className="text-[10px] px-1.5 py-0.2 rounded border border-rose-200 bg-rose-100 text-rose-700 shrink-0 font-bold">
                  {line.vulnRule}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Right Side Overlay: Hardened Remediated Lines (Emerald Tinted) */}
        <div
          className="absolute inset-0 p-6 font-mono text-xs leading-relaxed space-y-3 overflow-hidden bg-emerald-50/30"
          style={{
            clipPath: `inset(0 0 0 ${sliderPos}%)`,
          }}
        >
          {cfg.lines.map((line, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <span className="text-slate-400 select-none w-8 text-right shrink-0">L{line.lineNum}</span>
              <span className="flex-1 text-emerald-800 font-mono font-medium">
                {line.hardText}
              </span>
              {line.hardRule && (
                <span className="text-[10px] px-1.5 py-0.2 rounded border border-emerald-200 bg-emerald-100 text-emerald-700 shrink-0 font-bold">
                  {line.hardRule}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* The Scrub Divider Line and Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-10 shadow-lg"
          style={{
            left: `${sliderPos}%`,
            backgroundColor: 'var(--accent-primary)',
          }}
        >
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full border border-sky-600 bg-sky-600 flex items-center justify-center text-white cursor-ew-resize pointer-events-auto shadow-md"
          >
            <ArrowsLeftRight size={14} weight="bold" />
          </div>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 text-center font-mono">
        Click and drag the center handle left or right to inspect line-by-line configuration changes before applying them to production infrastructure.
      </div>
    </div>
  );
};
