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
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };

      const target = e.target as HTMLElement | null;
      if (target) {
        // STRICT EXCLUSION: Never track or render over the interactive telemetry preview,
        // code blocks, terminal windows, preformatted text, or input controls
        const shouldSuppress = Boolean(
          target.closest('#live-preview') ||
          target.closest('[data-no-tracker="true"]') ||
          target.closest('pre') ||
          target.closest('code') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select') ||
          target.closest('.interactive-telemetry')
        );

        if (shouldSuppress) {
          setIsSuppressed(true);
          return;
        }

        setIsSuppressed(false);
        if (!isVisible) setIsVisible(true);

        // Check if target or parent is a clickable button/link on hero/headers
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
      posRef.current.x += (targetRef.current.x - posRef.current.x) * 0.18;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * 0.18;

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

  // Completely disappear when inside excluded areas like #live-preview
  if (!isVisible || isSuppressed || coords.x < 0 || coords.y < 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden transition-opacity duration-150"
      aria-hidden="true"
    >
      {/* Precision Core Dot */}
      <div
        className="fixed w-1 h-1 rounded-full transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: `${targetRef.current.x}px`,
          top: `${targetRef.current.y}px`,
          backgroundColor: isHoveringInteractive ? '#10B981' : 'rgba(245, 158, 11, 0.9)',
          boxShadow: isHoveringInteractive
            ? '0 0 4px rgba(16, 185, 129, 0.8)'
            : '0 0 4px rgba(245, 158, 11, 0.6)',
        }}
      />

      {/* Trailing Tactical Reticle Ring (Compact & Surgical) */}
      <div
        className="fixed rounded-full transition-all duration-300 ease-out -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
        style={{
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          width: isHoveringInteractive ? '22px' : '14px',
          height: isHoveringInteractive ? '22px' : '14px',
          border: isHoveringInteractive
            ? '1px solid rgba(16, 185, 129, 0.7)'
            : '1px solid rgba(245, 158, 11, 0.35)',
          backgroundColor: isHoveringInteractive
            ? 'rgba(16, 185, 129, 0.04)'
            : 'transparent',
        }}
      >
        {/* Subtle crosshair notches */}
        {isHoveringInteractive && (
          <>
            <div className="absolute top-0 w-1 h-0.5 bg-emerald-400 -translate-y-1/2" />
            <div className="absolute bottom-0 w-1 h-0.5 bg-emerald-400 translate-y-1/2" />
            <div className="absolute left-0 h-1 w-0.5 bg-emerald-400 -translate-x-1/2" />
            <div className="absolute right-0 h-1 w-0.5 bg-emerald-400 translate-x-1/2" />
          </>
        )}
      </div>

      {/* Tactical Live Coordinates Tag */}
      <div
        className="fixed font-mono text-[9px] tracking-wider uppercase transition-opacity duration-200 select-none pointer-events-none"
        style={{
          left: `${coords.x + 14}px`,
          top: `${coords.y + 10}px`,
          color: isHoveringInteractive ? 'var(--pass)' : 'var(--text-tertiary)',
        }}
      >
        <span>
          [{coords.x}, {coords.y}]
        </span>
        {isHoveringInteractive && (
          <span className="ml-2 font-semibold text-emerald-400 tracking-widest">
            LOCK
          </span>
        )}
      </div>
    </div>
  );
};
