// src/components/shared/MonoCodeBlock.tsx
// High-density line-numbered syntax and evidence block with copy action

import React, { useState } from 'react';
import { Copy, Check } from '@phosphor-icons/react';

interface MonoCodeBlockProps {
  code: string;
  language?: string;
  highlightLines?: number[];
  maxHeight?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export const MonoCodeBlock: React.FC<MonoCodeBlockProps> = ({
  code,
  language = 'cli',
  highlightLines = [],
  maxHeight = '420px',
  showLineNumbers = true,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-md border overflow-hidden text-xs ${className}`}
      style={{
        backgroundColor: 'var(--bg-canvas)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b font-mono text-[10px]"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-disabled)',
        }}
      >
        <span className="uppercase tracking-wider font-semibold text-[10px]">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          title="Copy contents"
        >
          {copied ? (
            <>
              <Check size={12} weight="bold" style={{ color: 'var(--status-pass)' }} />
              <span style={{ color: 'var(--status-pass)' }}>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div
        className="overflow-x-auto p-3 font-mono leading-relaxed"
        style={{ maxHeight, color: 'var(--text-primary)' }}
      >
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isHighlighted = highlightLines.includes(lineNum);

          return (
            <div
              key={idx}
              className="flex items-start"
              style={{
                backgroundColor: isHighlighted ? '#FEF2F2' : 'transparent',
                borderLeft: isHighlighted ? '2px solid #DC2626' : '2px solid transparent',
              }}
            >
              {showLineNumbers && (
                <span
                  className="select-none text-right pr-3 font-mono text-[11px] shrink-0"
                  style={{
                    color: isHighlighted ? '#DC2626' : '#94A3B8',
                    width: '3.2rem',
                  }}
                >
                  {lineNum}
                </span>
              )}
              <span className="whitespace-pre flex-1 text-[11px]">{line || ' '}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
