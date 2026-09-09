// src/components/TacticalRemediationScanner.tsx
// Drag-to-compare before/after remediation diff scrubber wired for ALL 6 VENDORS (§5, Phase 5)
// Features literal, executable CLI remediation command sequences (Zero UI Slop)

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
  vulnRule?: string;
  hardText: string;
  hardRule?: string;
}

const SCANNER_CONFIGS: Record<
  ScannerDialect,
  {
    name: string;
    model: string;
    os: string;
    benchmark: string;
    remediationScript: string;
    lines: DiffLine[];
  }
> = {
  cisco: {
    name: 'Cisco IOS-XE',
    model: 'Catalyst 9300-48P Enterprise Core',
    os: 'IOS-XE 17.9.4a',
    benchmark: 'CIS Cisco IOS-XE Benchmark v2.0.0 / DISA STIG',
    remediationScript: `! ApexNet Certified Hardening Script: Cisco IOS-XE
! Target: Catalyst 9300-48P (IOS-XE 17.9.4a)
! Benchmark: CIS Cisco IOS-XE v2.0.0 / DISA STIG
configure terminal
service password-encryption
enable algorithm-type scrypt secret <new_password>
ip ssh version 2
no ip http server
no snmp-server community public
snmp-server group SEC_RO v3 priv
line vty 0 4
 transport input ssh
 exec-timeout 10 0
exit
logging host 10.14.5.50 transport udp port 514
end
write memory`,
    lines: [
      {
        lineNum: 11,
        vulnText: 'no service password-encryption',
        vulnRule: 'CIS-1.1.4',
        hardText: 'service password-encryption',
        hardRule: 'CIS-1.1.4 [PASS]',
      },
      {
        lineNum: 12,
        vulnText: 'enable password 7 04580F153205',
        vulnRule: 'CIS-1.1.1 [CRIT]',
        hardText: 'enable algorithm-type scrypt secret <new_password>',
        hardRule: 'CIS-1.1.1 [PASS]',
      },
      {
        lineNum: 13,
        vulnText: 'no ip ssh version 2',
        vulnRule: 'CIS-1.2.1 [HIGH]',
        hardText: 'ip ssh version 2',
        hardRule: 'CIS-1.2.1 [PASS]',
      },
      {
        lineNum: 14,
        vulnText: 'ip http server',
        vulnRule: 'CIS-1.3.4 [HIGH]',
        hardText: 'no ip http server',
        hardRule: 'CIS-1.3.4 [PASS]',
      },
      {
        lineNum: 15,
        vulnText: 'snmp-server community public RO',
        vulnRule: 'CIS-4.1.1 [CRIT]',
        hardText: 'no snmp-server community public\nsnmp-server group SEC_RO v3 priv',
        hardRule: 'CIS-4.1.1 [PASS]',
      },
      {
        lineNum: 16,
        vulnText: 'line vty 0 4',
        hardText: 'line vty 0 4',
      },
      {
        lineNum: 17,
        vulnText: ' transport input telnet',
        vulnRule: 'STIG-NET-0001',
        hardText: ' transport input ssh',
        hardRule: 'STIG-NET-0001 [PASS]',
      },
      {
        lineNum: 18,
        vulnText: ' exec-timeout 0 0',
        vulnRule: 'CIS-5.1.2 [MED]',
        hardText: ' exec-timeout 10 0',
        hardRule: 'CIS-5.1.2 [PASS]',
      },
      {
        lineNum: 19,
        vulnText: 'no logging host 10.14.5.50',
        vulnRule: 'NIST-AU-3',
        hardText: 'logging host 10.14.5.50 transport udp port 514',
        hardRule: 'NIST-AU-3 [PASS]',
      },
    ],
  },
  juniper: {
    name: 'Juniper JunOS',
    model: 'SRX345 Enterprise Firewall Gateway',
    os: 'JunOS 22.4R2-S2.5',
    benchmark: 'CIS Juniper JunOS Benchmark v1.1.0',
    remediationScript: `# ApexNet Certified Hardening Script: Juniper JunOS
# Target: SRX345 Gateway (JunOS 22.4R2-S2.5)
# Benchmark: CIS Juniper JunOS v1.1.0
configure
delete system services telnet
set system services ssh protocol-version v2
delete system services web-management http
set system services web-management https port 443
delete snmp community public
set snmp v3 usm local-engine user secadmin authentication-sha
set system syslog host 10.14.5.50 any warning facility-override local5
commit check
commit and-quit`,
    lines: [
      {
        lineNum: 4,
        vulnText: 'set system services telnet',
        vulnRule: 'CIS-JUNOS-2.1 [CRIT]',
        hardText: 'delete system services telnet',
        hardRule: 'CIS-JUNOS-2.1 [PASS]',
      },
      {
        lineNum: 5,
        vulnText: 'set system services ssh protocol-version v1',
        vulnRule: 'CIS-JUNOS-2.2 [HIGH]',
        hardText: 'set system services ssh protocol-version v2',
        hardRule: 'CIS-JUNOS-2.2 [PASS]',
      },
      {
        lineNum: 6,
        vulnText: 'set system services web-management http',
        vulnRule: 'CIS-JUNOS-2.4 [HIGH]',
        hardText: 'delete system services web-management http\nset system services web-management https port 443',
        hardRule: 'CIS-JUNOS-2.4 [PASS]',
      },
      {
        lineNum: 7,
        vulnText: 'set snmp community public authorization read-only',
        vulnRule: 'CIS-JUNOS-3.1 [CRIT]',
        hardText: 'delete snmp community public\nset snmp v3 usm local-engine user secadmin authentication-sha',
        hardRule: 'CIS-JUNOS-3.1 [PASS]',
      },
      {
        lineNum: 8,
        vulnText: '/* no syslog host configured */',
        vulnRule: 'NIST-AU-3',
        hardText: 'set system syslog host 10.14.5.50 any warning facility-override local5',
        hardRule: 'NIST-AU-3 [PASS]',
      },
    ],
  },
  paloalto: {
    name: 'Palo Alto PAN-OS',
    model: 'PA-3220 Next-Gen Perimeter Firewall',
    os: 'PAN-OS 11.0.2-h3',
    benchmark: 'CIS Palo Alto Firewall 11 Benchmark v1.0.0',
    remediationScript: `# ApexNet Certified Hardening Script: Palo Alto PAN-OS
# Target: PA-3220 Perimeter Firewall (PAN-OS 11.0.2-h3)
# Benchmark: CIS Palo Alto Firewall 11 v1.0.0
configure
set deviceconfig system service disable-telnet yes
set deviceconfig system service disable-http yes
set deviceconfig system ssh-version 2
set deviceconfig system idle-timeout 10
set shared log-settings syslog SIEM-SERVER server 10.14.5.50 port 514 facility LOG_LOCAL6
commit`,
    lines: [
      {
        lineNum: 5,
        vulnText: 'set deviceconfig system service disable-telnet no',
        vulnRule: 'CIS-PAN-1.1 [CRIT]',
        hardText: 'set deviceconfig system service disable-telnet yes',
        hardRule: 'CIS-PAN-1.1 [PASS]',
      },
      {
        lineNum: 6,
        vulnText: 'set deviceconfig system service disable-http no',
        vulnRule: 'CIS-PAN-1.2 [HIGH]',
        hardText: 'set deviceconfig system service disable-http yes',
        hardRule: 'CIS-PAN-1.2 [PASS]',
      },
      {
        lineNum: 7,
        vulnText: 'set deviceconfig system ssh-version 1',
        vulnRule: 'CIS-PAN-1.3 [HIGH]',
        hardText: 'set deviceconfig system ssh-version 2',
        hardRule: 'CIS-PAN-1.3 [PASS]',
      },
      {
        lineNum: 8,
        vulnText: 'set deviceconfig system idle-timeout 0',
        vulnRule: 'CIS-PAN-2.1 [MED]',
        hardText: 'set deviceconfig system idle-timeout 10',
        hardRule: 'CIS-PAN-2.1 [PASS]',
      },
      {
        lineNum: 9,
        vulnText: '/* no syslog destination profile configured */',
        vulnRule: 'NIST-AU-3',
        hardText: 'set shared log-settings syslog SIEM-SERVER server 10.14.5.50 port 514 facility LOG_LOCAL6',
        hardRule: 'NIST-AU-3 [PASS]',
      },
    ],
  },
  sonic: {
    name: 'SONiC Linux',
    model: 'Edgecore AS7712-32X Leaf Switch',
    os: 'SONiC.202311.0',
    benchmark: 'Open Compute Project (OCP) Hardening Profile',
    remediationScript: `# ApexNet Certified Hardening Script: SONiC Linux
# Target: Edgecore AS7712-32X (SONiC 202311)
# Benchmark: OCP / CIS SONiC Hardening Profile
sonic-cli
configure terminal
no telnet-server enable
ssh-server protocol 2
ssh-server idle-timeout 600
logging server 10.14.5.50 severity informational
end
write memory`,
    lines: [
      {
        lineNum: 14,
        vulnText: 'sonic(config)# telnet-server enable',
        vulnRule: 'CIS-SONIC-1.1 [CRIT]',
        hardText: 'sonic(config)# no telnet-server enable',
        hardRule: 'CIS-SONIC-1.1 [PASS]',
      },
      {
        lineNum: 15,
        vulnText: 'sonic(config)# ssh-server protocol 1',
        vulnRule: 'CIS-SONIC-1.2 [HIGH]',
        hardText: 'sonic(config)# ssh-server protocol 2\nsonic(config)# ssh-server idle-timeout 600',
        hardRule: 'CIS-SONIC-1.2 [PASS]',
      },
      {
        lineNum: 16,
        vulnText: '/* no remote syslog server in config_db.json */',
        vulnRule: 'NIST-AU-3',
        hardText: 'sonic(config)# logging server 10.14.5.50 severity informational',
        hardRule: 'NIST-AU-3 [PASS]',
      },
    ],
  },
  fortinet: {
    name: 'Fortinet FortiOS',
    model: 'FortiGate 60F Edge Appliance',
    os: 'FortiOS v7.4.2',
    benchmark: 'CIS Fortinet FortiOS 7.x Benchmark',
    remediationScript: `# ApexNet Certified Hardening Script: Fortinet FortiOS
# Target: FortiGate 60F (FortiOS v7.4.2)
# Benchmark: CIS Fortinet FortiOS 7.x
config system global
    set admin-telnet-service disable
    set admin-http-service disable
    set admintimeout 10
end
config log syslogd setting
    set status enable
    set server "10.14.5.50"
    set mode udp
    set port 514
end`,
    lines: [
      {
        lineNum: 3,
        vulnText: 'set admin-telnet-service enable',
        vulnRule: 'CIS-FGT-1.1 [CRIT]',
        hardText: 'set admin-telnet-service disable',
        hardRule: 'CIS-FGT-1.1 [PASS]',
      },
      {
        lineNum: 4,
        vulnText: 'set admin-http-service enable',
        vulnRule: 'CIS-FGT-1.2 [HIGH]',
        hardText: 'set admin-http-service disable',
        hardRule: 'CIS-FGT-1.2 [PASS]',
      },
      {
        lineNum: 5,
        vulnText: 'set admintimeout 0',
        vulnRule: 'CIS-FGT-1.3 [MED]',
        hardText: 'set admintimeout 10',
        hardRule: 'CIS-FGT-1.3 [PASS]',
      },
      {
        lineNum: 6,
        vulnText: '/* no remote syslogd configured */',
        vulnRule: 'NIST-AU-3',
        hardText: 'config log syslogd setting\n    set status enable\n    set server "10.14.5.50"\nend',
        hardRule: 'NIST-AU-3 [PASS]',
      },
    ],
  },
  arista: {
    name: 'Arista EOS',
    model: 'Arista 7050X Data Center Leaf Switch',
    os: 'EOS 4.30.2F',
    benchmark: 'CIS Arista EOS Benchmark v1.0.0',
    remediationScript: `! ApexNet Certified Hardening Script: Arista EOS
! Target: 7050X Leaf (EOS 4.30.2F)
! Benchmark: CIS Arista EOS Benchmark v1.0.0
configure terminal
no management telnet
management ssh
   protocol version 2
   idle-timeout 10
no management api http-commands
logging host 10.14.5.50
logging level SECURITY informational
end
write memory`,
    lines: [
      {
        lineNum: 8,
        vulnText: 'management telnet\n no shutdown',
        vulnRule: 'CIS-EOS-1.1 [CRIT]',
        hardText: 'no management telnet',
        hardRule: 'CIS-EOS-1.1 [PASS]',
      },
      {
        lineNum: 9,
        vulnText: 'management ssh\n protocol version 1',
        vulnRule: 'CIS-EOS-1.2 [HIGH]',
        hardText: 'management ssh\n protocol version 2\n idle-timeout 10',
        hardRule: 'CIS-EOS-1.2 [PASS]',
      },
      {
        lineNum: 10,
        vulnText: 'management api http-commands\n no shutdown',
        vulnRule: 'CIS-EOS-1.3 [HIGH]',
        hardText: 'no management api http-commands',
        hardRule: 'CIS-EOS-1.3 [PASS]',
      },
      {
        lineNum: 11,
        vulnText: '/* no syslog host configured */',
        vulnRule: 'NIST-AU-3',
        hardText: 'logging host 10.14.5.50\nlogging level SECURITY informational',
        hardRule: 'NIST-AU-3 [PASS]',
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
    navigator.clipboard.writeText(cfg.remediationScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 select-none">
      {/* Top Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} style={{ color: 'var(--accent-primary)' }} />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tactical Remediation Scanner</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Compare non-compliant configurations against exact, step-by-step CLI command sequences to achieve benchmark compliance.
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

      {/* Target Device Telemetry & Action Strip */}
      <div
        className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{cfg.name}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-700">{cfg.model}</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-600">{cfg.os}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Target Benchmark: {cfg.benchmark}
          </div>
        </div>

        <button
          onClick={handleCopyRemediation}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono font-medium border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 hover:border-sky-400 transition-colors cursor-pointer shadow-xs w-fit"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-600" weight="bold" />
              <span className="text-emerald-700 font-bold">Hardening Script Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} weight="bold" />
              <span>Copy Remediated Script</span>
            </>
          )}
        </button>
      </div>

      {/* Scrubber Status Indicator Bar */}
      <div className="flex items-center justify-between text-xs font-mono px-1">
        <div className="flex items-center gap-2 text-rose-700 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
          <span>VULNERABLE BASELINE (Anti-Patterns)</span>
        </div>

        <div className="text-slate-600 font-semibold bg-[var(--bg-surface)] px-3 py-1 rounded border border-slate-200 shadow-xs">
          Scrub Position: <span className="text-slate-900 font-bold">{sliderPos}% Hardened</span>
        </div>

        <div className="flex items-center gap-2 text-emerald-700 font-semibold">
          <span>CLI REMEDIATION (Executable Commands)</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
        </div>
      </div>

      {/* Interactive Diff-Scrubber Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative rounded-lg border border-slate-800 overflow-hidden cursor-ew-resize select-none bg-[#0B0F14]"
        style={{
          minHeight: '440px',
        }}
      >
        {/* Left Side: Vulnerable Lines (Rose Tinted Base Layer) */}
        <div className="p-6 font-mono text-xs leading-[1.5rem] space-y-3 text-rose-400 w-full h-full">
          {cfg.lines.map((line, idx) => {
            const lineCount = Math.max(
              line.vulnText.split('\n').length,
              line.hardText.split('\n').length
            );
            return (
              <div 
                key={idx} 
                className="grid grid-cols-[3rem_1fr_8rem] gap-4 items-start"
                style={{ minHeight: `${lineCount * 1.5}rem` }}
              >
                <span className="text-slate-600 select-none text-right shrink-0">L{line.lineNum}</span>
                <span className="whitespace-pre-wrap font-medium">{line.vulnText}</span>
                <div className="text-right">
                  {line.vulnRule && (
                    <span className="text-[10px] px-2 py-0.5 rounded border border-rose-900/50 bg-rose-950/40 text-rose-300 font-bold whitespace-nowrap">
                      {line.vulnRule}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side Overlay: Exact Executable CLI Remediation Commands (Emerald Tinted) */}
        <div
          className="absolute inset-0 p-6 font-mono text-xs leading-[1.5rem] space-y-3 text-emerald-400 bg-[#0B0F14] pointer-events-none"
          style={{
            clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
          }}
        >
          {cfg.lines.map((line, idx) => {
            const lineCount = Math.max(
              line.vulnText.split('\n').length,
              line.hardText.split('\n').length
            );
            return (
              <div 
                key={idx} 
                className="grid grid-cols-[3rem_1fr_8rem] gap-4 items-start"
                style={{ minHeight: `${lineCount * 1.5}rem` }}
              >
                <span className="text-slate-600 select-none text-right shrink-0">L{line.lineNum}</span>
                <span className="whitespace-pre-wrap font-medium">{line.hardText}</span>
                <div className="text-right">
                  {line.hardRule && (
                    <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-900/50 bg-emerald-950/40 text-emerald-300 font-bold whitespace-nowrap">
                      {line.hardRule}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* The Scrub Divider Line and Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-10 shadow-lg bg-sky-500"
          style={{
            left: `${sliderPos}%`,
          }}
        >
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full border border-sky-400 bg-[#0B0F14] flex items-center justify-center text-sky-400 cursor-ew-resize pointer-events-auto shadow-[0_0_15px_rgba(14,165,233,0.3)]"
          >
            <ArrowsLeftRight size={14} weight="bold" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
        <span>Click and drag the center handle left or right to inspect non-compliant lines vs literal CLI remediation commands.</span>
        <span className="text-sky-700 font-medium">Executable CLI sequences ready for terminal deployment</span>
      </div>
    </div>
  );
};
