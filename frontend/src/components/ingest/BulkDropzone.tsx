// src/components/ingest/BulkDropzone.tsx
// Bulk upload flow with per-file vendor auto-detection, client-side redaction, and error states (§6.5, C1)

import React, { useState, useRef } from 'react';
import {
  UploadSimple,
  FileText,
  CheckCircle,
  WarningCircle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Trash,
} from '@phosphor-icons/react';
import { detectVendorFromConfig } from '../../adapters';
import { redactSecretsInMemory } from '../../adapters/adapterUtils';
import { SupportedVendor, UploadState, VENDOR_DISPLAY_NAMES } from '../../types/canonical';

export interface BulkConfigFile {
  id: string;
  fileName: string;
  rawText: string;
  redactedText: string;
  redactedSecretsCount: number;
  detectedVendor: SupportedVendor;
  dialect: string;
  confidence: number;
  lineCount: number;
  state: UploadState;
  errorMessage?: string;
}

interface BulkDropzoneProps {
  onRunBatchAudit: (files: BulkConfigFile[]) => void;
  isAuditing?: boolean;
}

export const BulkDropzone: React.FC<BulkDropzoneProps> = ({
  onRunBatchAudit,
  isAuditing = false,
}) => {
  const [files, setFiles] = useState<BulkConfigFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFileContent = (name: string, text: string): BulkConfigFile => {
    const lines = text.split('\n');
    const { redactedText, redactedCount } = redactSecretsInMemory(text);
    const detection = detectVendorFromConfig(text);

    let state: UploadState = 'ready';
    let errorMessage: string | undefined;

    if (text.trim().length === 0) {
      state = 'parse_failed';
      errorMessage = 'Empty configuration file. Please provide a valid running-config.';
    } else if (detection.confidence < 0.35) {
      state = 'vendor_unrecognized';
      errorMessage = 'Dialect unclassified (< 35% confidence). Can route to Amber Lane / AI Training.';
    }

    return {
      id: `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileName: name,
      rawText: text,
      redactedText,
      redactedSecretsCount: redactedCount,
      detectedVendor: detection.vendor,
      dialect: detection.dialect,
      confidence: detection.confidence,
      lineCount: lines.length,
      state,
      errorMessage,
    };
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming: BulkConfigFile[] = [];

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        const processed = processFileContent(file.name, text);
        setFiles((prev) => [...prev, processed]);
      };
      reader.readAsText(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const readyFiles = files.filter((f) => f.state === 'ready');
  const errorFiles = files.filter((f) => f.state !== 'ready');

  // Load standard seed files for demo convenience
  const handleLoadDemoBatch = () => {
    const demoConfigs = [
      {
        name: 'cisco-catalyst-core.cfg',
        text: `hostname CORE-SW01\nip ssh version 2\nno ip http server\nservice password-encryption\nline vty 0 4\n transport input ssh\n exec-timeout 10 0\nsnmp-server group SECGROUP v3 priv\nlogging host 10.14.5.50\nntp server 10.14.0.1 prefer`,
      },
      {
        name: 'juniper-srx-border.conf',
        text: `version 22.4R2;\nsystem {\n    host-name SRX-FW;\n    services {\n        ssh { protocol-version v2; }\n        telnet { }\n    }\n    syslog { host 10.14.5.50; }\n    ntp { server 10.14.0.1; }\n}`,
      },
      {
        name: 'sonic-leaf-disaggregated.json',
        text: `{\n  "DEVICE_METADATA": { "localhost": { "hostname": "SONIC-LEAF-01" } },\n  "SSH": { "global": { "protocol": "2", "idle_timeout": "600" } },\n  "TELNET": { "global": { "status": "disabled" } },\n  "SYSLOG_SERVER": { "10.14.5.50": { "port": "514" } }\n}`,
      },
    ];

    const processed = demoConfigs.map((c) => processFileContent(c.name, c.text));
    setFiles(processed);
  };

  return (
    <div className="space-y-6">
      {/* Dropzone Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragging ? 'border-sky-500 bg-sky-950/20' : 'hover:border-zinc-700'
        }`}
        style={{
          backgroundColor: isDragging ? 'rgba(47, 168, 255, 0.05)' : 'var(--bg-surface)',
          borderColor: isDragging ? 'var(--accent-primary)' : 'var(--border-subtle)',
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".cfg,.txt,.json,.conf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="max-w-md mx-auto space-y-3">
          <div
            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center border"
            style={{
              backgroundColor: 'var(--bg-surface-raised)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent-primary)',
            }}
          >
            <UploadSimple size={24} />
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-900">
              Drag & drop configuration files here, or <span className="text-sky-600 underline">browse</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Ships with deterministic parsers for Cisco, Juniper, PAN-OS, SONiC, Fortinet, and Arista — any other vendor's syntax is picked up automatically by the AI Training loop.
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Client-side in-memory secret masking active
            </span>
          </div>
        </div>
      </div>

      {/* Demo helper */}
      {files.length === 0 && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadDemoBatch}
            className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
          >
            Load sample multi-vendor batch (Cisco + Juniper + SONiC)
          </button>
        </div>
      )}

      {/* File Ingestion Queue Table */}
      {files.length > 0 && (
        <div
          className="rounded-lg border shadow-xs overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="px-5 py-3 border-b flex items-center justify-between font-mono text-xs text-slate-500"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-raised)' }}
          >
            <span>INGESTION BATCH QUEUE ({files.length} FILES)</span>
            <button
              onClick={() => setFiles([])}
              className="text-[11px] text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {files.map((file) => {
              const vendor = VENDOR_DISPLAY_NAMES[file.detectedVendor];
              const isReady = file.state === 'ready';

              return (
                <div key={file.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={20} className={isReady ? 'text-slate-400' : 'text-amber-500'} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate flex items-center gap-2">
                        <span>{file.fileName}</span>
                        <span className="font-mono text-[10px] text-slate-500">({file.lineCount} lines)</span>
                      </div>

                      {/* Detected Vendor & Status */}
                      <div className="flex items-center gap-2 mt-1">
                        {isReady ? (
                          <>
                            <span
                              className="font-mono text-[10px] px-1.5 py-0.2 rounded border text-emerald-700 bg-emerald-50 border-emerald-200"
                            >
                              {vendor.dialect} ({Math.round(file.confidence * 100)}% match)
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {file.redactedSecretsCount} secrets masked in memory
                            </span>
                          </>
                        ) : (
                          <span
                            className="font-mono text-[10px] px-1.5 py-0.2 rounded border text-amber-700 bg-amber-50 border-amber-200"
                          >
                            {file.errorMessage}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions per file */}
                  <div className="flex items-center gap-3 shrink-0">
                    {isReady ? (
                      <span className="flex items-center gap-1 text-emerald-700 text-xs font-mono">
                        <CheckCircle size={15} weight="fill" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-xs font-mono">
                        <WarningCircle size={15} weight="fill" />
                        <span>Review Required</span>
                      </span>
                    )}

                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                      title="Remove file"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div
            className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{
              backgroundColor: 'var(--bg-surface-raised)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="text-xs text-slate-600">
              {readyFiles.length} of {files.length} configuration files validated and ready for audit.
            </div>

            <button
              onClick={() => onRunBatchAudit(readyFiles)}
              disabled={readyFiles.length === 0 || isAuditing}
              className="flex items-center gap-2 px-5 py-2.5 rounded text-xs font-semibold text-white transition-all cursor-pointer shadow-sm hover:brightness-105 active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <ShieldCheck size={16} weight="bold" />
              <span>
                {isAuditing ? 'Auditing Batch...' : `Run Batch Audit (${readyFiles.length} Devices)`}
              </span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
