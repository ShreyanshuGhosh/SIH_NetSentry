import React, { useEffect, useRef } from 'react';

interface CyberDefenseBackgroundProps {
  interactive?: boolean;
}

interface Packet {
  x: number;
  laneY: number;
  length: number;
  vx: number;
  color: string;
}

const LANE_SPACING = 40; // 40px vertical spacing representing subnet telemetry lanes

// Semantic telemetry colors with crisp, surgical visibility
const PACKET_COLORS = [
  'rgba(148, 163, 184, 0.70)', // Muted Slate (dominant)
  'rgba(100, 116, 139, 0.60)', // Muted Slate dim
  'rgba(16, 185, 129, 0.90)',  // Phosphor Emerald (telemetry pass)
  'rgba(245, 158, 11, 0.90)',  // Industrial Amber (telemetry warning/transit)
];

export const CyberDefenseBackground: React.FC<CyberDefenseBackgroundProps> = ({
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    // Mouse telemetry probe coordinates
    const mouse = {
      x: -9999,
      y: -9999,
      active: false,
    };

    let packets: Packet[] = [];

    const initPackets = (w: number, h: number) => {
      const numLanes = Math.floor(h / LANE_SPACING);
      const targetCount = Math.max(20, Math.floor(numLanes * 1.5));
      const newPackets: Packet[] = [];

      for (let i = 0; i < targetCount; i++) {
        const laneIndex = Math.floor(Math.random() * numLanes);
        const laneY = laneIndex * LANE_SPACING + 20;
        const colorRoll = Math.random();
        // 70% slate, 20% emerald, 10% amber
        const color =
          colorRoll < 0.70
            ? PACKET_COLORS[0]
            : colorRoll < 0.90
            ? PACKET_COLORS[2]
            : PACKET_COLORS[3];

        newPackets.push({
          x: Math.random() * (w + 200) - 100,
          laneY,
          length: 8 + Math.floor(Math.random() * 8), // 8px - 15px length
          vx: 1.2 + Math.random() * 2.2,             // high-velocity horizontal transit
          color,
        });
      }

      packets = newPackets;
    };

    // Resize handling with HiDPI crisp pixel scaling
    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = w;
      height = h;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      initPackets(w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    // Global window sniffer crosshair listener
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      if (clientX >= 0 && clientX <= rect.width && clientY >= 0 && clientY <= rect.height) {
        mouse.x = clientX;
        mouse.y = clientY;
        mouse.active = true;
      } else {
        mouse.active = false;
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // ── MAIN TELEMETRY RENDER LOOP ──
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // ── 1. SUBNET TELEMETRY LANES (Hairline horizontal rules every 40px) ──
      const numLanes = Math.floor(height / LANE_SPACING);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';

      ctx.beginPath();
      for (let i = 0; i <= numLanes; i++) {
        const y = Math.floor(i * LANE_SPACING + 20) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // ── 2. DATA PACKETS TRANSIT ──
      for (let i = 0; i < packets.length; i++) {
        const p = packets[i];
        p.x += p.vx;

        // Wrap around smoothly when exiting viewport to the right
        if (p.x > width + p.length) {
          p.x = -p.length - Math.random() * 60;
          const newLane = Math.floor(Math.random() * numLanes);
          p.laneY = newLane * LANE_SPACING + 20;

          const colorRoll = Math.random();
          p.color =
            colorRoll < 0.70
              ? PACKET_COLORS[0]
              : colorRoll < 0.90
              ? PACKET_COLORS[2]
              : PACKET_COLORS[3];
        }

        // Draw 2px high packet centered exactly on lane line
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.floor(p.x), p.laneY - 1, p.length, 2);
      }

      // ── 3. ACTIVE SNIFFER CROSSHAIR & MONOSPACE READOUT ──
      if (interactive && mouse.active) {
        const mx = Math.floor(mouse.x) + 0.5;
        const my = Math.floor(mouse.y) + 0.5;

        // Full-span vertical & horizontal hairline crosshairs (rgba(255, 255, 255, 0.15))
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';

        ctx.beginPath();
        // Horizontal line across canvas
        ctx.moveTo(0, my);
        ctx.lineTo(width, my);

        // Vertical line down canvas
        ctx.moveTo(mx, 0);
        ctx.lineTo(mx, height);
        ctx.stroke();

        // Simulated dynamic memory address based on coordinates
        const rawX = Math.floor(mouse.x);
        const rawY = Math.floor(mouse.y);
        const hashSeed = ((rawX * 7919) ^ (rawY * 6271)) & 0xffff;
        const hexAddr = hashSeed.toString(16).toUpperCase().padStart(4, '0');
        const readoutText = `[MEM: 0x${hexAddr}]`;

        // Bounding box dimensions
        const boxWidth = 96;
        const boxHeight = 20;

        // Offset position (+12px X, +12px Y) with edge containment
        let boxX = mouse.x + 12;
        let boxY = mouse.y + 12;

        if (boxX + boxWidth > width - 8) {
          boxX = mouse.x - boxWidth - 12;
        }
        if (boxY + boxHeight > height - 8) {
          boxY = mouse.y - boxHeight - 12;
        }

        // Draw solid #08090C background
        ctx.fillStyle = '#08090C';
        ctx.fillRect(Math.floor(boxX), Math.floor(boxY), boxWidth, boxHeight);

        // Draw 1px rgba(255, 255, 255, 0.1) border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
        ctx.strokeRect(Math.floor(boxX) + 0.5, Math.floor(boxY) + 0.5, boxWidth, boxHeight);

        // Monospace technical readout in Slate (#94A3B8)
        ctx.font = '10px "JetBrains Mono", ui-monospace, Menlo, monospace';
        ctx.fillStyle = '#94A3B8';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(readoutText, Math.floor(boxX) + 8, Math.floor(boxY) + boxHeight / 2);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [interactive]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 block w-full h-full"
    />
  );
};
