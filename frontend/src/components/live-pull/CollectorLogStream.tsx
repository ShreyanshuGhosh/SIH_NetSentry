// src/components/live-pull/CollectorLogStream.tsx
// Animated, real-time Netmiko collector terminal stream with honest state visualization (§6.5)

import React, { useEffect, useRef } from 'react';
import { Terminal, CheckCircle, WarningCircle, XCircle } from '@phosphor-icons/react';
import { LivePullState } from '../../types/canonical';

export interface CollectorLogLine {
  id: string;
  timestamp: string;
  level: 'info' | 'ok' | 'warn' | 'error';
  message: string;
}

interface CollectorLogStreamProps {
  logs: CollectorLogLine[];
  state: LivePullState;
  targetHost: string;
}

export const CollectorLogStream: React.FC<CollectorLogStreamProps> = ({
  logs,
  state,
  targetHost,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const levelColor = (lvl: CollectorLogLine['level']) => {
    switch (lvl) {
      case 'ok':
        return '#15803D';
      case 'warn':
        return '#B45309';
      case 'error':
        return '#DC2626';
      default:
        return 'var(--text-primary)';
    }
  };

  return (
    <div
      className="rounded-lg border shadow-xs overflow-hidden font-mono text-xs"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Terminal Titlebar */}
      <div
        className="px-4 py-2.5 border-b flex items-center justify-between text-[11px]"
        style={{
          backgroundColor: 'var(--bg-surface-raised)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2">
          <Terminal size={14} style={{ color: 'var(--accent-primary)' }} />
          <span className="font-semibold text-slate-900">netmiko-collector-stream</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">target: {targetHost} (SSHv2:22)</span>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          {state === 'connecting' && (
            <span className="flex items-center gap-1 text-sky-600 font-semibold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
              CONNECTING
            </span>
          )}
          {state === 'collecting' && (
            <span className="flex items-center gap-1 text-amber-600 font-semibold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              STREAMING BYTES
            </span>
          )}
          {state === 'completed' && (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle size={12} weight="fill" />
              INGESTION COMPLETE
            </span>
          )}
          {state === 'failed' && (
            <span className="flex items-center gap-1 text-red-600 font-semibold">
              <XCircle size={12} weight="fill" />
              SESSION FAILED
            </span>
          )}
          {state === 'idle' && <span className="text-slate-400">IDLE</span>}
        </div>
      </div>

      {/* Log Feed */}
      <div
        ref={containerRef}
        className="p-4 space-y-1.5 overflow-y-auto max-h-[360px] leading-relaxed"
      >
        {logs.length === 0 ? (
          <div className="text-slate-400 italic">Collector session idle. Ready to initiate SSH handshake.</div>
        ) : (
          logs.map((line) => (
            <div key={line.id} className="flex items-start gap-3">
              <span className="text-slate-400 select-none text-[10px] shrink-0 pt-0.5">{line.timestamp}</span>
              <span
                className="select-none font-bold text-[10px] shrink-0 w-12"
                style={{ color: levelColor(line.level) }}
              >
                [{line.level.toUpperCase()}]
              </span>
              <span className="flex-1 text-[11px]" style={{ color: levelColor(line.level) }}>
                {line.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
