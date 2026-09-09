// src/components/IngestionConsole.tsx
// Config Ingestion — simple, clean, easy to use.
// Three states: (1) idle — big drop zone + generate button
//               (2) file loaded — view/edit in built-in viewer, download, framework multi-select, continue
//               (3) auditing — progress feedback

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadSimple, FileText, DownloadSimple, ArrowRight,
  CheckCircle, PencilSimple, FloppyDisk, X, CircleNotch,
  Cpu, Waveform,
} from '@phosphor-icons/react';

import { FrameworkId, ParsingLane, SampleDeviceConfig } from '../types/audit';
import { BulkConfigFile } from './ingest/BulkDropzone';
import { detectVendorFromConfig } from '../adapters';
import { redactSecretsInMemory } from '../adapters/adapterUtils';
import { SupportedVendor } from '../types/canonical';

// ─── Generate unique timestamped & randomized network config ───────────────────
// Uses fictional vendor/platform names — never real brand names like Cisco/Juniper in text headers.
// Every call dynamically randomizes compliance pass/fail rules so scores span 0% to 100%!
function generateUniqueRandomConfig(): { config: SampleDeviceConfig; fileName: string } {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const millis = now.getMilliseconds().toString().padStart(3, '0');
  
  const timeStampStr = `${dateStr}_${hours}${minutes}${seconds}_${millis}`;
  const hexHash = Math.random().toString(36).substring(2, 8).toUpperCase();
  const isoUtc = now.toISOString();

  // Randomize security compliance controls independently (pass vs fail)
  const passSSH = Math.random() > 0.35;        // true = SSHv2, false = SSHv1
  const disableTelnet = Math.random() > 0.40;  // true = telnet off, false = telnet enabled
  const disableHTTP = Math.random() > 0.35;    // true = no http server, false = http server on
  const passEnc = Math.random() > 0.30;        // true = service password-encryption, false = no encryption
  const passAAA = Math.random() > 0.40;        // true = aaa new-model, false = no aaa
  const passSNMP = Math.random() > 0.45;       // true = snmp v3, false = snmp v1 public
  const passNTP = Math.random() > 0.35;        // true = ntp configured, false = no ntp
  const passSyslog = Math.random() > 0.35;     // true = logging host configured, false = no logging

  // Pick a random dialect family
  const dialectChoice = Math.floor(Math.random() * 3);

  let vendorId: SupportedVendor = 'cisco_ios';
  let vendorName = 'NexGate OS';
  let model = `NG-4800X-${hexHash.slice(0, 4)}`;
  let extension = 'cfg';
  let rawText = '';

  if (dialectChoice === 0) {
    // ── NexGate OS (Cisco-style CLI parser) ──
    vendorId = 'cisco_ios';
    vendorName = 'NexGate OS';
    model = `NG-4800X-${hexHash.slice(0, 4)}`;
    extension = 'cfg';

    const sshLine = passSSH ? 'ip ssh version 2' : 'ip ssh version 1';
    const telnetLine = disableTelnet ? 'transport input ssh' : 'transport input telnet ssh';
    const httpLine = disableHTTP ? 'no ip http server\nip http secure-server' : 'ip http server';
    const encLine = passEnc ? 'service password-encryption' : 'no service password-encryption';
    const aaaLine = passAAA ? 'aaa new-model\naaa authentication login default local' : 'no aaa new-model';
    const snmpLine = passSNMP
      ? 'snmp-server group MONITOR-GRP v3 priv\nno snmp-server community public'
      : 'snmp-server community public RO';
    const ntpLine = passNTP
      ? `ntp server 10.${now.getMonth() + 1}.${now.getDate()}.1 key 42 prefer\nntp authentication enable`
      : '! ntp not configured';
    const syslogLine = passSyslog
      ? `logging host 10.10.1.${(now.getSeconds() % 200) + 10}\nlogging trap informational`
      : '! syslog logging disabled';

    rawText = `! NexGate OS 5.2.1 — Dynamic Security Baseline Configuration
! Device Model: ${model} / Serial: NGX-${timeStampStr}-${hexHash}
! Timestamp UTC: ${isoUtc}
! Generated Session ID: GEN-${timeStampStr}-${hexHash}
!
hostname NODE-${timeStampStr.slice(-6)}-${hexHash.slice(0, 3)}
!
boot-start-marker
service timestamps log datetime msec
${encLine}
!
management ssh
 protocol-version ${passSSH ? '2' : '1'}
 idle-timeout 600
 no shutdown
!
${httpLine}
!
login banner ^
  GOVERNMENT RESTRICTED NETWORK — NODE-${timeStampStr.slice(-6)}
  AUTHORIZED ACCESS ONLY — ALL SESSIONS MONITORED (${timeStampStr})
  UNAUTHORIZED ACCESS IS PROHIBITED UNDER CYBER LAW
^
!
${aaaLine}
!
${snmpLine}
!
${ntpLine}
!
${syslogLine}
!
line vty 0 15
 exec-timeout 10 0
 ${telnetLine}
 access-class MGT-ACL in
!
${sshLine}
!
enable secret 9 $9$${hexHash}$${timeStampStr.slice(-6)}...
username admin privilege 15 secret 9 $9$${hexHash}xVoGfz3P...
!
interface Mgmt0
 ip address 192.168.${now.getSeconds() + 1}.1 255.255.255.0
 no shutdown
!
ip access-list standard MGT-ACL
 permit 10.200.${now.getMinutes()}.0/24
 deny any log
!
end
`;
  } else if (dialectChoice === 1) {
    // ── StratoWall FW (Junos-style structured config parser) ──
    vendorId = 'juniper_junos';
    vendorName = 'StratoWall FW';
    model = `SW-2200-${hexHash.slice(0, 4)}`;
    extension = 'conf';

    const sshProtocol = passSSH ? 'protocol-version v2;' : 'protocol-version v1;';
    const telnetBlock = disableTelnet ? '/* telnet service disabled */' : 'telnet;';
    const webBlock = disableHTTP
      ? 'web-management { https { port 443; } }'
      : 'web-management { http; }';
    const passBlock = passEnc
      ? 'root-authentication { encrypted-password "$6$e7xW$SECURE_CRYPT_HASH"; }'
      : 'root-authentication { plain-text-password "admin123"; }';
    const aaaBlock = passAAA
      ? 'authentication-order [ tacplus radius password ];'
      : '/* aaa disabled */';
    const snmpBlock = passSNMP
      ? 'snmp { v3 { usm { user monitor { privacy aes256; } } } }'
      : 'snmp { community public { authorization read-only; } }';
    const ntpBlock = passNTP
      ? `ntp { server 10.0.${now.getDate()}.1; }`
      : '/* ntp disabled */';
    const syslogBlock = passSyslog
      ? `syslog { host 10.10.1.${(now.getSeconds() % 200) + 10} { any any; } }`
      : '/* syslog disabled */';

    rawText = `## Last commit: ${isoUtc} by operator-admin
# StratoWall Firewall OS 4.1.0 — Security Export
# Platform: ${model} / Serial: SWF-${timeStampStr}-${hexHash}
# Session Stamp: GEN-${timeStampStr}-${hexHash}
#
system {
    host-name NODE-${timeStampStr.slice(-6)}-${hexHash.slice(0, 3)};
    ${passBlock}
    ${aaaBlock}
    services {
        ssh {
            ${sshProtocol}
        }
        ${telnetBlock}
        ${webBlock}
    }
    ${syslogBlock}
    ${ntpBlock}
}
${snmpBlock}
interfaces {
    ge-0/0/0 {
        unit 0 {
            family inet {
                address 10.0.${now.getSeconds() + 1}.1/30;
            }
        }
    }
}
`;
  } else {
    // ── IronLeaf NOS (EOS-style CLI parser) ──
    vendorId = 'arista_eos';
    vendorName = 'IronLeaf NOS';
    model = `IL-6548-${hexHash.slice(0, 4)}`;
    extension = 'cfg';

    const sshLine = passSSH ? 'protocol version 2' : 'protocol version 1';
    const telnetLine = disableTelnet ? 'no management telnet' : 'management telnet';
    const httpLine = disableHTTP ? 'no management api http-commands\nprotocol https' : 'protocol http';
    const encLine = passEnc ? 'service password-encryption' : 'no service password-encryption';
    const aaaLine = passAAA ? 'aaa authentication login default group tacacs+ local' : 'no aaa new-model';

    rawText = `! IronLeaf NOS 4.28.1 — Configuration Export
! Device Model: ${model} / Serial: ILN-${timeStampStr}-${hexHash}
! Timestamp UTC: ${isoUtc}
!
hostname NODE-${timeStampStr.slice(-6)}-${hexHash.slice(0, 3)}
!
${encLine}
!
management ssh
 ${sshLine}
 idle-timeout 600
 exit
!
${telnetLine}
!
management api http-commands
 ${httpLine}
 exit
!
${aaaLine}
!
username admin privilege 15 secret 9 $9$${hexHash}xVoGfz3P...
!
interface Ethernet1
 description UPLINK-PRIMARY
 ip address 10.100.${now.getSeconds() + 1}.1/24
!
end
`;
  }

  const serial = `${vendorName.substring(0, 3).toUpperCase()}-${timeStampStr}-${hexHash}`;
  const host = `NODE-${timeStampStr.slice(-6)}-${hexHash.slice(0, 3)}`;
  const fileName = `${vendorName.replace(/\s+/g, '_')}_${timeStampStr}.${extension}`;

  const config: SampleDeviceConfig = {
    id: `gen-${timeStampStr}-${hexHash}`,
    name: `${model} (${host})`,
    vendor: vendorId as any,
    vendorName: vendorName,
    deviceType: 'Router',
    model: model,
    serialNumber: serial,
    osVersion: `${vendorName} 2026.1`,
    rawText: rawText,
    redactedSecretsCount: 2,
  };

  return { config, fileName };
}

// ─── Component Props ───────────────────────────────────────────────────────────
interface IngestionConsoleProps {
  selectedConfig: SampleDeviceConfig;
  onSelectConfig: (config: SampleDeviceConfig) => void;
  selectedFrameworks?: FrameworkId[];
  onToggleFramework?: (framework: FrameworkId) => void;
  onSelectAllFrameworks?: (frameworks: FrameworkId[]) => void;
  selectedLane: ParsingLane | 'auto';
  onSelectLane: (lane: ParsingLane | 'auto') => void;
  onExecuteAudit: () => void;
  onBatchAudit?: (files: BulkConfigFile[]) => void;
  isAuditing: boolean;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export const IngestionConsole: React.FC<IngestionConsoleProps> = ({
  selectedFrameworks = ['cis_v8'],
  onToggleFramework,
  onSelectAllFrameworks,
  onSelectConfig,
  onExecuteAudit,
  isAuditing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadedFile, setLoadedFile] = useState<{ name: string; text: string } | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFileDrop = useCallback((text: string, fileName: string) => {
    setLoadedFile({ name: fileName, text });
    setEditedText(text);
    setEditing(false);
    setSaved(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      handleFileDrop(ev.target?.result as string, file.name);
    };
    reader.readAsText(file);
    // reset so same file can be re-selected
    e.target.value = '';
  }, [handleFileDrop]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleFileDrop(ev.target?.result as string, file.name);
    reader.readAsText(file);
  }, [handleFileDrop]);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    // Brief generation pause to simulate processing
    setTimeout(() => {
      const { config, fileName } = generateUniqueRandomConfig();
      setLoadedFile({ name: fileName, text: config.rawText });
      setEditedText(config.rawText);
      setEditing(false);
      setSaved(false);
      setGenerating(false);
      // Prime the engine state with native vendor dialect
      onSelectConfig(config);
    }, 650);
  }, [onSelectConfig]);

  const handleDownload = useCallback(() => {
    if (!loadedFile) return;
    const blob = new Blob([editedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = loadedFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [loadedFile, editedText]);

  const handleContinue = useCallback(() => {
    if (!loadedFile) return;
    // Build a synthetic SampleDeviceConfig from the raw text
    const detection = detectVendorFromConfig(editedText);
    const { redactedCount } = redactSecretsInMemory(editedText);
    const cfg: SampleDeviceConfig = {
      id: `upload-${Date.now()}`,
      name: loadedFile.name.replace(/\.[^.]+$/, ''),
      vendor: (detection.vendor as any) || 'cisco_ios',
      vendorName: detection.dialect || 'Unknown',
      deviceType: 'Router',
      model: detection.dialect || 'Generic Node',
      serialNumber: 'N/A',
      osVersion: detection.dialect || 'Unknown',
      rawText: editedText,
      redactedSecretsCount: redactedCount,
    };
    onSelectConfig(cfg);
    // Small delay so state propagates before audit fires
    setTimeout(() => onExecuteAudit(), 80);
  }, [loadedFile, editedText, onSelectConfig, onExecuteAudit]);

  const handleSaveEdit = useCallback(() => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleClear = useCallback(() => {
    setLoadedFile(null);
    setEditedText('');
    setEditing(false);
    setSaved(false);
  }, []);

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1E1C1A] tracking-tight">Ingest & Audit</h1>
        <p className="text-sm text-[#7C7269] mt-1">
          Upload a network config file or generate a unique timestamped file to test the compliance engine.
        </p>
      </div>

      {/* ── State 1: No file loaded — Drop zone + generate ── */}
      {!loadedFile && (
        <div className="space-y-5">
          {/* Big drop zone */}
          <div
            className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer py-20 px-10 flex flex-col items-center justify-center text-center gap-5 ${
              dragging
                ? 'border-[#C8830A] bg-[rgba(200,131,10,0.05)]'
                : 'border-[#D1CBC0] hover:border-[rgba(200,131,10,0.55)] hover:bg-[rgba(200,131,10,0.02)]'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(200,131,10,0.10)', border: '2px solid rgba(200,131,10,0.25)' }}
            >
              <UploadSimple size={36} weight="bold" className="text-[#C8830A]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1E1C1A]">Drop your config file here</p>
              <p className="text-sm text-[#7C7269] mt-1">
                or <span className="text-[#C8830A] font-semibold underline underline-offset-2">browse to upload</span>
              </p>
              <p className="text-xs font-mono text-[#A89F92] mt-3">
                .cfg · .conf · .txt · .log · .json
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".cfg,.conf,.txt,.log,.json,.rsc"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[#D1CBC0]" />
            <span className="text-xs font-mono text-[#A89F92] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[#D1CBC0]" />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-[#D1CBC0] text-sm font-bold text-[#1E1C1A] hover:border-[#1E1C1A] hover:bg-[rgba(30,28,26,0.03)] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            {generating ? (
              <>
                <CircleNotch size={20} weight="bold" className="animate-spin text-[#C8830A]" />
                Generating unique randomized compliance config...
              </>
            ) : (
              <>
                <Waveform size={20} weight="bold" className="text-[#C8830A]" />
                Generate random network config file
              </>
            )}
          </button>
          <p className="text-center text-[11px] font-mono text-[#A89F92]">
            Generates a unique timestamped config file with randomized compliance rules (scores range 0% to 100%).
          </p>
        </div>
      )}

      {/* ── State 2: File loaded — viewer/editor + framework multi-select + actions ── */}
      {loadedFile && (
        <div className="space-y-6">

          {/* File identity bar */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl border"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText size={18} weight="bold" className="text-[#C8830A] shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#1E1C1A] truncate">{loadedFile.name}</div>
                <div className="text-[11px] font-mono text-[#A89F92]">
                  {editedText.split('\n').length} lines · {(new Blob([editedText]).size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-[#E4E0D8] text-[#A89F92] hover:text-[#4A4440]"
              title="Remove file"
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          {/* Built-in text viewer / editor */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--border-default)' }}
          >
            {/* Viewer toolbar */}
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <span className="text-[11px] font-mono font-bold text-[#7C7269] uppercase tracking-wider">
                {editing ? 'Edit Mode' : 'View Mode'}
              </span>
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold text-white bg-[#2D6A3F] hover:bg-[#1E4D2B] transition-colors cursor-pointer"
                    >
                      {saved ? <CheckCircle size={12} weight="bold" /> : <FloppyDisk size={12} weight="bold" />}
                      {saved ? 'Saved' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditing(false); setEditedText(loadedFile.text); }}
                      className="px-3 py-1 rounded-md text-[11px] font-medium text-[#7C7269] hover:text-[#1E1C1A] cursor-pointer border transition-colors"
                      style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-canvas)' }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold cursor-pointer border transition-colors hover:bg-[#E4E0D8]"
                    style={{ borderColor: 'var(--border-default)', color: '#4A4440', backgroundColor: 'var(--bg-canvas)' }}
                  >
                    <PencilSimple size={12} weight="bold" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Text area or static view */}
            {editing ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full resize-none font-mono text-xs leading-relaxed outline-none p-4"
                style={{
                  backgroundColor: '#FAFAF8',
                  color: 'var(--text-primary)',
                  minHeight: '340px',
                  maxHeight: '480px',
                }}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="none"
              />
            ) : (
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-auto select-text"
                style={{
                  backgroundColor: '#FAFAF8',
                  color: 'var(--text-primary)',
                  minHeight: '260px',
                  maxHeight: '440px',
                  whiteSpace: 'pre',
                }}
              >
                {editedText}
              </pre>
            )}
          </div>

          {/* ── Compliance Benchmark Framework Selector (Multi-Select Enabled) ── */}
          <div
            className="p-5 rounded-xl border space-y-3"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <span className="text-xs font-mono font-bold text-[#1E1C1A] uppercase tracking-wider block">
                  Select Compliance Benchmark Frameworks
                </span>
                <p className="text-[11px] text-[#7C7269] mt-0.5 font-medium">
                  Multi-select enabled — select as many benchmark frameworks as desired for a combined deduplicated audit report.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectAllFrameworks && onSelectAllFrameworks(['cis_v8', 'nist_800_53', 'disa_stig', 'iso_27001'])}
                  className="px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer bg-[var(--bg-canvas)] border-[#D1CBC0] hover:border-[#1E1C1A] text-[#1E1C1A]"
                >
                  Select All (4)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {[
                {
                  id: 'cis_v8',
                  name: 'CIS Network Benchmarks',
                  authority: 'CIS',
                  desc: 'Industry-standard baseline security configurations',
                },
                {
                  id: 'nist_800_53',
                  name: 'NIST SP 800-53 Rev. 5',
                  authority: 'NIST',
                  desc: 'Federal information system security controls',
                },
                {
                  id: 'disa_stig',
                  name: 'DISA STIG Network',
                  authority: 'DoD',
                  desc: 'DoD-grade tactical network device hardening',
                },
                {
                  id: 'iso_27001',
                  name: 'ISO/IEC 27001:2022',
                  authority: 'ISO',
                  desc: 'International operational security controls',
                },
              ].map((fw) => {
                const isSelected = selectedFrameworks.includes(fw.id as FrameworkId);
                return (
                  <button
                    key={fw.id}
                    type="button"
                    onClick={() => onToggleFramework && onToggleFramework(fw.id as FrameworkId)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'border-[#C8830A] bg-[rgba(200,131,10,0.06)] shadow-xs ring-1 ring-[#C8830A]'
                        : 'border-[#D1CBC0] hover:border-[#A89F92] bg-[var(--bg-canvas)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1E1C1A]">{fw.name}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border bg-[#EDE8DF] text-[#7C7269]">
                          {fw.authority}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7C7269] mt-1 leading-snug">{fw.desc}</p>
                    </div>

                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-[#C8830A] bg-[#C8830A] text-white'
                          : 'border-[#D1CBC0] bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle size={12} weight="bold" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            {/* Continue → Run Audit */}
            <button
              onClick={handleContinue}
              disabled={isAuditing}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-[#C8830A] hover:bg-[#A66A06] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 shadow-lg shadow-[rgba(200,131,10,0.22)]"
            >
              {isAuditing ? (
                <>
                  <CircleNotch size={16} weight="bold" className="animate-spin" />
                  Running Compliance Audit...
                </>
              ) : (
                <>
                  <Cpu size={16} weight="bold" />
                  Continue — Run Audit
                  <ArrowRight size={14} weight="bold" />
                </>
              )}
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-[#4A4440] border-2 border-[#D1CBC0] hover:border-[#1E1C1A] transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <DownloadSimple size={16} weight="bold" />
              Download File
            </button>

            {/* Load different file */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-[#7C7269] border-2 border-[#D1CBC0] hover:text-[#1E1C1A] hover:border-[#A89F92] transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--bg-canvas)' }}
            >
              <UploadSimple size={16} weight="bold" />
              Replace File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".cfg,.conf,.txt,.log,.json,.rsc"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {/* Security note */}
          <div
            className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl border text-[11px] font-mono text-[#A89F92]"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            {[
              { dot: '#2D6A3F', label: 'Secrets redacted before any processing' },
              { dot: '#C8830A', label: 'Session only — cleared on close' },
              { dot: '#A16207', label: 'No data sent to any server' },
            ].map(({ dot, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
