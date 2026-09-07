// src/components/shared/LaneBadge.tsx
// Displays parsing pipeline lane: Green Lane (Deterministic) or Amber Lane (LLM Extraction)

import React from 'react';

interface LaneBadgeProps {
  lane: 'deterministic' | 'llm_fallback' | 'auto';
  size?: 'sm' | 'md';
}

export const LaneBadge: React.FC<LaneBadgeProps> = ({ lane, size = 'sm' }) => {
  const isGreen = lane === 'deterministic';
  const isAmber = lane === 'llm_fallback';

  const label = isGreen ? 'GREEN LANE' : isAmber ? 'AMBER LANE' : 'AUTO ROUTE';
  const sub = isGreen ? 'Deterministic' : isAmber ? 'AI Extraction' : 'Hybrid';

  const color = isGreen ? '#15803D' : isAmber ? '#B45309' : '#0284C7';
  const bg = isGreen ? '#ECFDF5' : isAmber ? '#FFFBEB' : '#F0F9FF';
  const border = isGreen ? '#A7F3D0' : isAmber ? '#FDE68A' : '#BAE6FD';

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border ${padding}`}
      style={{ backgroundColor: bg, color, borderColor: border }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-semibold">{label}</span>
      <span className="text-[9px] opacity-75 font-sans">({sub})</span>
    </span>
  );
};
