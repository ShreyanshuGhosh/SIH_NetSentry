// src/components/shared/SeverityTag.tsx
// Zero-slop severity tag: CRITICAL, HIGH, MEDIUM, LOW

import React from 'react';
import { SeverityLevel } from '../../types/canonical';

interface SeverityTagProps {
  severity: SeverityLevel | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  size?: 'sm' | 'md';
}

export const SeverityTag: React.FC<SeverityTagProps> = ({ severity, size = 'sm' }) => {
  const norm = severity.toLowerCase() as SeverityLevel;

  const config: Record<SeverityLevel, { label: string; color: string; bg: string; border: string }> = {
    critical: {
      label: 'CRITICAL',
      color: '#DC2626',
      bg: '#FEF2F2',
      border: '#FECACA',
    },
    high: {
      label: 'HIGH',
      color: '#EA580C',
      bg: '#FFF7ED',
      border: '#FED7AA',
    },
    medium: {
      label: 'MEDIUM',
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A',
    },
    low: {
      label: 'LOW',
      color: '#475569',
      bg: '#F1F5F9',
      border: '#CBD5E1',
    },
  };

  const item = config[norm] || config.low;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center justify-center font-mono font-semibold tracking-wider rounded border ${padding}`}
      style={{
        backgroundColor: item.bg,
        color: item.color,
        borderColor: item.border,
      }}
    >
      {item.label}
    </span>
  );
};
