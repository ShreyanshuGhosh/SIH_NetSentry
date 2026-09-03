import React, { useState, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  WarningCircle,
  CheckCircle,
  ArrowsLeftRight,
  Terminal,
  Cpu,
  ArrowRight,
} from '@phosphor-icons/react';

type ScannerDialect = 'cisco' | 'juniper' | 'paloalto';

interface DiffLine {
  lineNum: number;
  // Vulnerable side representation
  vulnText: string;
  vulnHighlight?: string;
  vulnRule?: string;
  // Hardened side representation
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
    model: 'SRX-345 Security Boundary Gateway',
    os: 'Junos OS 22.4R1-S2',
    benchmark: 'DISA STIG Junos Router NDM v2r1',
    lines: [
      {
        lineNum: 14,
        vulnText: 'set system root-authentication plain-text-password-value "admin123"',
        vulnHighlight: 'plain-text-password-value "admin123"',
        vulnRule: 'STIG-NET-0065',
        hardText: 'set system root-authentication encrypted-password "$6$kL81$..."',
        hardHighlight: 'encrypted-password "$6$kL81$..."',
        hardRule: 'SHA512_SALTED [PASS]',
      },
      {
        lineNum: 15,
        vulnText: 'set system services telnet',
        vulnHighlight: 'set system services telnet',
        vulnRule: 'STIG-NET-0001',
        hardText: 'delete system services telnet',
        hardHighlight: 'delete system services telnet',
        hardRule: 'UNBOUND_DAEMON [PASS]',
      },
      {
        lineNum: 16,
        vulnText: 'set system services ssh protocol-version v1',
        vulnHighlight: 'protocol-version v1',
        vulnRule: 'STIG-NET-0030',
        hardText: 'set system services ssh protocol-version v2',
        hardHighlight: 'protocol-version v2',
        hardRule: 'SSH_V2_ENFORCED [PASS]',
      },
      {
        lineNum: 17,
        vulnText: 'set snmp community public authorization read-only',
        vulnHighlight: 'community public',
        vulnRule: 'STIG-NET-0020',
        hardText: 'set snmp v3 usm local-engine user secoper auth-sha priv-aes256',
        hardHighlight: 'auth-sha priv-aes256',
        hardRule: 'FIPS_CRYPTO [PASS]',
      },
      {
        lineNum: 18,
        vulnText: 'set system services web-management http port 80',
        vulnHighlight: 'http port 80',
        vulnRule: 'STIG-NET-0080',
        hardText: 'delete system services web-management http',
        hardHighlight: 'delete system services web-management http',
        hardRule: 'HTTP_TERMINATED [PASS]',
      },
      {
        lineNum: 19,
        vulnText: 'set system login idle-timeout 120',
        vulnHighlight: 'idle-timeout 120',
        vulnRule: 'STIG-NET-0060',
        hardText: 'set system login idle-timeout 10',
        hardHighlight: 'idle-timeout 10',
        hardRule: 'POLICY_TIMEOUT [PASS]',
      },
    ],
  },
  paloalto: {
    name: 'Palo Alto PAN-OS',
    model: 'PA-3220 Perimeter Next-Gen Firewall',
    os: 'PAN-OS 11.0.2-h3',
    benchmark: 'NIST SP 800-53 Rev. 5 / SC-7 Boundary Protection',
    lines: [
      {
        lineNum: 21,
        vulnText: 'set deviceconfig system service disable-telnet no',
        vulnHighlight: 'disable-telnet no',
        vulnRule: 'NIST-AC-3.1',
        hardText: 'set deviceconfig system service disable-telnet yes',
        hardHighlight: 'disable-telnet yes',
        hardRule: 'TELNET_BLOCKED [PASS]',
      },
      {
        lineNum: 22,
        vulnText: 'set deviceconfig system service disable-http no',
        vulnHighlight: 'disable-http no',
        vulnRule: 'NIST-SC-13.1',
        hardText: 'set deviceconfig system service disable-http yes',
        hardHighlight: 'disable-http yes',
        hardRule: 'HTTPS_MANDATORY [PASS]',
      },
      {
        lineNum: 23,
        vulnText: 'set deviceconfig system snmp-setting snmp-version-v2c yes',
        vulnHighlight: 'snmp-version-v2c yes',
        vulnRule: 'NIST-SC-8.1',
        hardText: 'set deviceconfig system snmp-setting snmp-version-v3 yes',
        hardHighlight: 'snmp-version-v3 yes',
        hardRule: 'AUTHTYPE_PRIV [PASS]',
      },
      {
        lineNum: 24,
        vulnText: 'set deviceconfig system idle-timeout 0',
        vulnHighlight: 'idle-timeout 0',
        vulnRule: 'NIST-AC-12.1',
        hardText: 'set deviceconfig system idle-timeout 10',
        hardHighlight: 'idle-timeout 10',
        hardRule: 'AUTO_LOCK_10M [PASS]',
      },
      {
        lineNum: 25,
        vulnText: 'set shared authentication-profile LOCAL-ONLY method local-database',
        vulnHighlight: 'LOCAL-ONLY method local-database',
        vulnRule: 'NIST-IA-2.1',
        hardText: 'set shared authentication-profile CENTRAL-TACACS method tacacs-plus',
        hardHighlight: 'CENTRAL-TACACS method tacacs-plus',
        hardRule: 'AAA_CENTRALIZED [PASS]',
      },
    ],
  },
};

interface TacticalRemediationScannerProps {
  onLaunchConsole?: () => void;
}

export const TacticalRemediationScanner: React.FC<TacticalRemediationScannerProps> = ({
  onLaunchConsole,
}) => {
  const [activeDialect, setActiveDialect] = useState<ScannerDialect>('cisco');
  // Scrubber position in percentage (0 to 100)
  const [splitPercent, setSplitPercent] = useState<number>(48.5);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const config = SCANNER_CONFIGS[activeDialect];

  // Mouse scrubbing handler: strictly zero transition latency
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSplitPercent(percent);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSplitPercent(percent);
  }, []);

  const isScrubberFarLeft = splitPercent < 22;
  const isScrubberFarRight = splitPercent > 78;

  return (
    <div className="w-full">
      {/* ── Section Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-emerald-400" />
            <span>INTERACTIVE DIFF LEXER :: REAL-TIME REMEDIATION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight font-sans">
            Tactical Remediation Scanner
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl font-sans">
            Scrub horizontally across the configuration stream to observe deterministic line-level remediation. Drag the laser divider to switch between vulnerable states and hardened baselines.
          </p>
        </div>

        {/* Dialect Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 border border-zinc-800 bg-[#0A0B0E] font-mono text-xs">
          {(['cisco', 'juniper', 'paloalto'] as ScannerDialect[]).map((d) => (
            <button
              key={d}
              onClick={() => setActiveDialect(d)}
              className={`px-3 py-1.5 rounded-none uppercase tracking-wider text-[11px] transition-none cursor-pointer ${
                activeDialect === d
                  ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-600'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {SCANNER_CONFIGS[d].name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Border-Collapsed Terminal Container ── */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="relative rounded-none border border-zinc-800 bg-[#0D0E12] overflow-hidden select-none cursor-ew-resize"
        style={{ touchAction: 'none' }}
      >
        {/* Terminal Header Bar */}
        <div className="px-4 py-2.5 border-b border-zinc-800 bg-[#08090C] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Terminal size={14} className="text-cyan-400" />
            <span className="font-semibold text-zinc-200">{config.model}</span>
            <span className="text-zinc-600">::</span>
            <span className="text-zinc-400">{config.os}</span>
          </div>

          <div className="flex items-center gap-4 text-[10px]">
            <span className="hidden sm:inline text-zinc-500 font-mono">
              TARGET: {config.benchmark}
            </span>
            <span className="px-2 py-0.5 border border-zinc-800 bg-[#0A0B0E] text-zinc-300 tabular-nums font-mono">
              SCRUBBER: {splitPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* ── Split Code Display Container ── */}
        <div className="relative font-mono text-xs leading-relaxed p-6 overflow-hidden min-h-[340px] bg-[#07080B]">
          {/* Guide hint at bottom */}
          <div className="absolute bottom-2 right-4 z-20 pointer-events-none text-[10px] font-mono text-zinc-600 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowsLeftRight size={12} className="text-emerald-400" />
            <span>DRAG / HOVER HORIZONTALLY TO SCRUB DIFF</span>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              LAYER 1 (LEFT / BASE): VULNERABLE STATE
              Clip path restricts rendering to 0 -> splitPercent%
              ══════════════════════════════════════════════════════════════════════ */}
          <div
            className="absolute inset-0 p-6 overflow-hidden select-none"
            style={{
              clipPath: `polygon(0 0, ${splitPercent}% 0, ${splitPercent}% 100%, 0 100%)`,
              transition: 'none',
            }}
          >
            <div className="space-y-2">
              {config.lines.map((line) => {
                return (
                  <div key={line.lineNum} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <span className="w-6 text-right tabular-nums text-zinc-600 text-[11px] shrink-0">
                        {line.lineNum}
                      </span>
                      <span className="truncate text-zinc-300">
                        {line.vulnHighlight ? (
                          <>
                            <span className="text-rose-400/90 font-semibold bg-rose-950/40 border border-rose-900/60 px-1 py-0.5">
                              {line.vulnHighlight}
                            </span>
                            <span className="text-zinc-400">
                              {line.vulnText.replace(line.vulnHighlight, '')}
                            </span>
                          </>
                        ) : (
                          line.vulnText
                        )}
                      </span>
                    </div>

                    {line.vulnRule && (
                      <span className="shrink-0 text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-800/80 px-1.5 py-0.5">
                        {line.vulnRule}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              LAYER 2 (RIGHT / OVERLAY): HARDENED STATE
              Clip path reveals rendering from splitPercent% -> 100%
              ══════════════════════════════════════════════════════════════════════ */}
          <div
            className="absolute inset-0 p-6 overflow-hidden select-none"
            style={{
              clipPath: `polygon(${splitPercent}% 0, 100% 0, 100% 100%, ${splitPercent}% 100%)`,
              transition: 'none',
            }}
          >
            <div className="space-y-2">
              {config.lines.map((line) => {
                return (
                  <div key={line.lineNum} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <span className="w-6 text-right tabular-nums text-zinc-600 text-[11px] shrink-0">
                        {line.lineNum}
                      </span>
                      <span className="truncate text-zinc-200">
                        {line.hardHighlight ? (
                          <>
                            <span className="text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-700/80 px-1 py-0.5">
                              {line.hardHighlight}
                            </span>
                            <span className="text-zinc-300">
                              {line.hardText.replace(line.hardHighlight, '')}
                            </span>
                          </>
                        ) : (
                          line.hardText
                        )}
                      </span>
                    </div>

                    {line.hardRule && (
                      <span className="shrink-0 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/80 px-1.5 py-0.5 flex items-center gap-1">
                        <CheckCircle size={11} weight="fill" />
                        <span>{line.hardRule}</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              VERTICAL SCRUBBER LASER LINE (Phosphor Emerald #10B981)
              Zero transition latency; follows mouse cursor strictly
              ══════════════════════════════════════════════════════════════════════ */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col items-center"
            style={{
              left: `${splitPercent}%`,
              transform: 'translateX(-50%)',
              transition: 'none',
            }}
          >
            {/* Top Anchor: Dual Telemetry Badges */}
            <div className="absolute top-2 flex items-center gap-2 pointer-events-none select-none">
              {!isScrubberFarLeft && (
                <div className="px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/90 border border-rose-700 shadow-none whitespace-nowrap -translate-x-full mr-1">
                  [STATE: VULNERABLE]
                </div>
              )}
              {!isScrubberFarRight && (
                <div className="px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/90 border border-emerald-700 shadow-none whitespace-nowrap translate-x-1">
                  [STATE: HARDENED]
                </div>
              )}
            </div>

            {/* Sharp 1px Phosphor Emerald Line */}
            <div
              className="w-[1px] h-full"
              style={{
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
              }}
            />

            {/* Central Scrubber Node Ring */}
            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-none border border-emerald-400 bg-[#07080B] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-emerald-400" />
            </div>

            {/* Bottom Anchor: Position Pin */}
            <div className="absolute bottom-2 font-mono text-[9px] text-emerald-400 bg-[#07080B] border border-emerald-600/80 px-1 py-0.2 whitespace-nowrap">
              SCRUB: {splitPercent.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* ── Terminal Action & Verification Status Strip ── */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-[#08090C] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
            <span className="flex items-center gap-1.5 text-rose-400">
              <WarningCircle size={13} weight="bold" />
              <span>Left: Raw Ingested Config (Non-Compliant)</span>
            </span>
            <span className="text-zinc-700">|</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle size={13} weight="fill" />
              <span>Right: Line-by-Line Synthesized Remediation</span>
            </span>
          </div>

          <button
            onClick={onLaunchConsole}
            className="px-4 py-1.5 rounded-none font-mono font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer text-cyan-300 bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 hover:border-cyan-400 flex items-center gap-1.5 active:scale-95"
          >
            <Cpu size={13} weight="bold" />
            <span>Execute Remediation in Console</span>
            <ArrowRight size={12} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
};
