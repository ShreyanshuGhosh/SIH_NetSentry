// src/components/landing/MousePointerTracker.tsx
// Tactical Precision Reticle & Coordinate Tracker (Tailored for Light Mode)

import React, { useEffect, useState, useRef } from 'react';

export const MousePointerTracker: React.FC = () => {
  const [coords, setCoords] = useState({ x: -100, y: -100 });
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isSuppressed, setIsSuppressed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const posRef = useRef({ x: -100, y: -100 });
  const targetRef = useRef({ x: -100, y: -100 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (!window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };

      const target = e.target as HTMLElement | null;
      if (target) {
        // Suppress tracking over input controls, code blocks, or explicitly opted-out elements
        const shouldSuppress = Boolean(
          target.closest('[data-no-tracker="true"]') ||
          target.closest('pre') ||
          target.closest('code') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select')
        );

        if (shouldSuppress) {
          setIsSuppressed(true);
          return;
        }

        setIsSuppressed(false);
        if (!isVisible) setIsVisible(true);

        // Check if target is a clickable interactive element
        const isClickable = Boolean(
          target.closest('button') ||
          target.closest('a') ||
          target.closest('[role="button"]') ||
          target.getAttribute('data-interactive') === 'true'
        );
        setIsHoveringInteractive(isClickable);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Smooth lerp loop for the reticle
    const updateLoop = () => {
      posRef.current.x += (targetRef.current.x - posRef.current.x) * 0.2;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * 0.2;

      setCoords({
        x: Math.round(posRef.current.x),
        y: Math.round(posRef.current.y),
      });

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };
    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isVisible]);

  if (!isVisible || isSuppressed || coords.x < 0 || coords.y < 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {/* Precision Core Dot */}
      <div
        className="fixed w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150"
        style={{
          left: `${targetRef.current.x}px`,
          top: `${targetRef.current.y}px`,
          backgroundColor: isHoveringInteractive ? '#16a34a' : '#0284c7',
          boxShadow: isHoveringInteractive
            ? '0 0 6px rgba(22, 163, 74, 0.4)'
            : '0 0 5px rgba(2, 132, 199, 0.35)',
        }}
      />

      {/* Trailing Tactical Reticle Ring (Light Mode Precision) */}
      <div
        className="fixed rounded-full transition-all duration-200 ease-out -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
        style={{
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          width: isHoveringInteractive ? '26px' : '16px',
          height: isHoveringInteractive ? '26px' : '16px',
          border: isHoveringInteractive
            ? '1.5px solid rgba(22, 163, 74, 0.8)'
            : '1px solid rgba(2, 132, 199, 0.45)',
          backgroundColor: isHoveringInteractive
            ? 'rgba(22, 163, 74, 0.06)'
            : 'rgba(2, 132, 199, 0.03)',
        }}
      >
        {/* Surgical Crosshair Notches on Target Hover */}
        {isHoveringInteractive && (
          <>
            <div className="absolute top-0 w-1 h-0.5 bg-emerald-600 -translate-y-1/2" />
            <div className="absolute bottom-0 w-1 h-0.5 bg-emerald-600 translate-y-1/2" />
            <div className="absolute left-0 h-1 w-0.5 bg-emerald-600 -translate-x-1/2" />
            <div className="absolute right-0 h-1 w-0.5 bg-emerald-600 translate-x-1/2" />
          </>
        )}
      </div>

      {/* Monospace Tactical Coordinates Tag */}
      <div
        className="fixed font-mono text-[9px] font-medium tracking-wider select-none pointer-events-none transition-opacity duration-150 flex items-center gap-1.5"
        style={{
          left: `${coords.x + 16}px`,
          top: `${coords.y + 10}px`,
          color: isHoveringInteractive ? '#15803d' : '#64748b',
        }}
      >
        <span className="bg-white/95 px-1.5 py-0.5 rounded shadow-xs border border-slate-200 backdrop-blur-xs">
          [{coords.x}, {coords.y}]
        </span>
        {isHoveringInteractive && (
          <span className="bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded border border-emerald-200 text-[8px] font-bold tracking-widest uppercase">
            LOCK
          </span>
        )}
      </div>
    </div>
  );
};
