// src/components/shared/StatusBadge.tsx
// Zero-slop compliance status badge: ≤ 2 words, uppercase, strictly semantic tokens

import React from 'react';
import { ComplianceStatus } from '../../types/canonical';

interface StatusBadgeProps {
  status: ComplianceStatus | 'PASS' | 'FAIL' | 'WARN' | 'NOT_APPLICABLE' | 'UNKNOWN';
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className = '' }) => {
  const norm = status.toLowerCase();

  let text = 'PASS';
  let bg = 'var(--status-pass-bg)';
  let color = 'var(--status-pass)';
  let border = 'rgba(21, 128, 61, 0.3)';

  if (norm === 'fail') {
    text = 'FAIL';
    bg = 'var(--status-fail-bg)';
    color = 'var(--status-fail)';
    border = 'rgba(220, 38, 38, 0.3)';
  } else if (norm === 'warn' || norm === 'unknown') {
    text = 'WARN';
    bg = 'var(--status-warn-bg)';
    color = 'var(--status-warn)';
    border = 'rgba(217, 119, 6, 0.3)';
  } else if (norm === 'checking_infra_missing' || norm === 'infra_missing') {
    text = 'INFRA REQ';
    bg = '#EEF2FF';
    color = '#4338CA';
    border = 'rgba(79, 70, 229, 0.4)';
  } else if (norm === 'not_applicable' || norm === 'n/a') {
    text = 'N/A';
    bg = 'var(--bg-surface-raised)';
    color = 'var(--text-disabled)';
    border = 'var(--border-subtle)';
  }

  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const widthClass = className.includes('w-') ? '' : (size === 'sm' ? 'w-20' : 'w-24');

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 font-mono font-semibold tracking-wider rounded border ${widthClass} ${padding} ${className}`}
      style={{
        backgroundColor: bg,
        color: color,
        borderColor: border,
      }}
    >
      {text}
    </span>
  );
};
