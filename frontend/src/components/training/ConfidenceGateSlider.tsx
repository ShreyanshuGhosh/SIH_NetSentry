// src/components/training/ConfidenceGateSlider.tsx
// Adjustable confidence gate slider (default 0.80) filtering low-confidence syntax into the Amber queue (§6.8)

import React from 'react';
import { SlidersHorizontal } from '@phosphor-icons/react';

interface ConfidenceGateSliderProps {
  confidenceThreshold: number; // 0.0 to 1.0 (default 0.80)
  onChangeThreshold: (val: number) => void;
  pendingCount: number;
}

export const ConfidenceGateSlider: React.FC<ConfidenceGateSliderProps> = ({
  confidenceThreshold,
  onChangeThreshold,
  pendingCount,
}) => {
  return (
    <div
      className="p-4 rounded-xl border shadow-2xs space-y-3"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-cyan-600" weight="bold" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            Amber Lane Confidence Gate
          </span>
        </div>
        <div className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
          {(confidenceThreshold * 100).toFixed(0)}%
        </div>
      </div>

      <div className="space-y-1.5">
        <input
          type="range"
          min="50"
          max="95"
          step="5"
          value={Math.round(confidenceThreshold * 100)}
          onChange={(e) => onChangeThreshold(parseInt(e.target.value, 10) / 100)}
          className="w-full accent-cyan-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
        />
        <div className="flex justify-between font-mono text-[10px] text-slate-400">
          <span>50% (Permissive)</span>
          <span>80% (Default Gate)</span>
          <span>95% (Strict Review)</span>
        </div>
      </div>

      <div className="text-[11px] text-slate-600 leading-snug">
        <strong className="text-slate-900 font-semibold">Affects future ingestion passes:</strong> Syntax lines extracted with confidence below{' '}
        <span className="font-mono text-slate-900 font-semibold">{(confidenceThreshold * 100).toFixed(0)}%</span> route
        to the Human-in-the-Loop review queue. <span className="font-mono text-amber-700 font-semibold">({pendingCount} items pending review)</span>
      </div>
    </div>
  );
};
