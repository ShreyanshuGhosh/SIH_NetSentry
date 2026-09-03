import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface SecurityLockPatternProps {
  className?: string;
}

export const SecurityLockPattern: React.FC<SecurityLockPatternProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [telemetry, setTelemetry] = useState({
    clientX: 0,
    clientY: 0,
    ndcX: 0,
    ndcY: 0,
    isInteracting: false,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 520;
    const height = container.clientHeight || 480;

    // ── Three.js Scene Setup ──
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    camera.position.set(0, -1.5, 17.5);
    camera.lookAt(0, -1.5, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Pure alpha transparency
    container.appendChild(renderer.domElement);

    // ── Colors matching the reference image ──
    // Amber / Gold / Orange glowing laser
    const AMBER_HOT = new THREE.Color('#FFFBEB');  // White-hot laser highlights
    const AMBER_CORE = new THREE.Color('#FBBF24'); // Luminous amber-gold
    const ORANGE_BODY = new THREE.Color('#EA580C'); // Neon cyber orange
    const AMBER_DEEP = new THREE.Color('#B45309');  // Deep chassis glow

    // Red Cipher Matrix Rain
    const RED_BRIGHT = new THREE.Color('#EF4444');  // Bright red stream
    const RED_DEEP = new THREE.Color('#991B1B');    // Deep crimson stream
    const STREAM_HEAD = new THREE.Color('#FEF08A'); // Flashing white-amber head character

    // ── Buffers for Volumetric 3D Point Cloud ──
    const TOTAL_POINTS = 11000;
    const posOriginal = new Float32Array(TOTAL_POINTS * 3);
    const colors = new Float32Array(TOTAL_POINTS * 3);
    const sizes = new Float32Array(TOTAL_POINTS);
    const pointTypes = new Float32Array(TOTAL_POINTS); // 0 = 3D Amber Lock, 1 = 3D Red Matrix Stream, 2 = 3D Honeycomb

    let pIdx = 0;

    // ── Physical 3D Volumetric Scale Factor (1.65x = 65% larger lock) ──
    const LOCK_SCALE = 1.65;

    const addPoint = (
      x: number,
      y: number,
      z: number,
      color: THREE.Color,
      size: number,
      type: number
    ) => {
      if (pIdx >= TOTAL_POINTS) return;
      const i3 = pIdx * 3;
      // Scale lock and honeycomb geometry directly in 3D world space
      const scale = type === 0 || type === 2 ? LOCK_SCALE : 1.0;
      posOriginal[i3] = x * scale;
      posOriginal[i3 + 1] = y * scale;
      posOriginal[i3 + 2] = z * scale;

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[pIdx] = size;
      pointTypes[pIdx] = type;
      pIdx++;
    };

    // ── 1. TRUE VOLUMETRIC 3D SHACKLE (Cylindrical Tube & Semicircular Torus) ──
    // Tube radius r = 0.42, major radius R = 1.9, depth Z symmetric [-0.42, +0.42]
    const SHACKLE_POINTS = 3400;
    const shackleR = 1.9;
    const tubeR = 0.42;
    const shackleCenterY = 0.8;

    for (let i = 0; i < SHACKLE_POINTS; i++) {
      const isArc = Math.random() < 0.65;
      const theta = Math.random() * Math.PI * 2; // Circular cross section of tube
      const tr = tubeR * (0.85 + Math.random() * 0.15); // Tube surface thickness

      let x = 0, y = 0, z = tr * Math.sin(theta);

      if (isArc) {
        // Torus arc along the upper semicircle
        const phi = Math.PI * (0.01 + Math.random() * 0.98);
        const arcCenterR = shackleR;
        const currentR = arcCenterR + tr * Math.cos(theta);

        x = currentR * Math.cos(phi);
        y = shackleCenterY + currentR * Math.sin(phi);
      } else {
        // Dual vertical cylindrical posts entering the lock body
        const isLeft = Math.random() > 0.5;
        const postCenterX = isLeft ? -shackleR : shackleR;
        const postY = -0.3 + Math.random() * 1.1;

        x = postCenterX + tr * Math.cos(theta);
        y = postY;
      }

      // Edge outline points get white-hot highlight; body gets rich amber
      const isOutline = Math.abs(tr - tubeR) < 0.05 || Math.random() < 0.25;
      const col = isOutline ? AMBER_HOT : (Math.random() < 0.5 ? AMBER_CORE : ORANGE_BODY);

      addPoint(x, y, z, col, 2.0 + Math.random() * 0.9, 0);
    }

    // ── 2. TRUE VOLUMETRIC 3D LOCK BODY (Heavy Chamfered Vault Chassis) ──
    // Width: 5.2 (X: -2.6 to +2.6)
    // Height: 3.6 (Y: -3.6 to 0.0)
    // Depth: 2.2 (Z: -1.1 to +1.1)
    const BODY_POINTS = 4600;
    const bW = 2.6;
    const bMinY = -3.6;
    const bMaxY = 0.0;
    const bD = 1.1; // Full 2.2 units of real 3D depth!

    for (let i = 0; i < BODY_POINTS; i++) {
      const faceRoll = Math.random();
      let x = 0, y = 0, z = 0;
      let isEdge = false;

      if (faceRoll < 0.32) {
        // Front Face (Z = +bD)
        x = (Math.random() - 0.5) * 2 * bW;
        y = bMinY + Math.random() * (bMaxY - bMinY);
        z = bD;
        isEdge = Math.abs(x) > bW - 0.2 || y > bMaxY - 0.2 || y < bMinY + 0.2;
      } else if (faceRoll < 0.55) {
        // Back Face (Z = -bD)
        x = (Math.random() - 0.5) * 2 * bW;
        y = bMinY + Math.random() * (bMaxY - bMinY);
        z = -bD;
        isEdge = Math.abs(x) > bW - 0.2 || y > bMaxY - 0.2 || y < bMinY + 0.2;
      } else if (faceRoll < 0.75) {
        // Left & Right Side Walls (X = +/- bW)
        const isLeft = Math.random() > 0.5;
        x = isLeft ? -bW : bW;
        y = bMinY + Math.random() * (bMaxY - bMinY);
        z = (Math.random() - 0.5) * 2 * bD;
        isEdge = Math.abs(z) > bD - 0.18 || y > bMaxY - 0.2 || y < bMinY + 0.2;
      } else if (faceRoll < 0.90) {
        // Top & Bottom End Plates (Y = bMaxY / bMinY)
        const isTop = Math.random() > 0.5;
        x = (Math.random() - 0.5) * 2 * bW;
        y = isTop ? bMaxY : bMinY;
        z = (Math.random() - 0.5) * 2 * bD;
        isEdge = Math.abs(x) > bW - 0.2 || Math.abs(z) > bD - 0.18;
      } else {
        // Internal 3D Volumetric Lattice (Fills the lock's interior!)
        x = (Math.random() - 0.5) * 2 * (bW - 0.2);
        y = bMinY + 0.2 + Math.random() * (bMaxY - bMinY - 0.4);
        z = (Math.random() - 0.5) * 2 * (bD - 0.2);
      }

      // Smooth Chamfer on the 4 vertical outer corners
      const cornerThreshold = 0.4;
      if (Math.abs(x) > bW - cornerThreshold && Math.abs(z) > bD - cornerThreshold) {
        x *= 0.92;
        z *= 0.92;
        isEdge = true;
      }

      const col = isEdge
        ? (Math.random() < 0.35 ? AMBER_HOT : AMBER_CORE)
        : (Math.random() < 0.4 ? ORANGE_BODY : AMBER_DEEP);

      addPoint(x, y, z, col, isEdge ? 2.2 + Math.random() * 0.8 : 1.6 + Math.random() * 0.6, 0);
    }

    // ── 3. RECESSED 3D KEYHOLE CORE (Cylindrical Chamber carved into Front Face) ──
    const KEYHOLE_POINTS = 1200;
    const khY = -1.6;

    for (let i = 0; i < KEYHOLE_POINTS; i++) {
      const isCircle = Math.random() < 0.55;
      // Keyhole cavity extends into the body from Z = bD down to Z = bD - 0.6
      const z = (bD + 0.05) - Math.random() * 0.55;

      let x = 0, y = 0;

      if (isCircle) {
        // Circular tumbler head
        const angle = Math.random() * Math.PI * 2;
        const r = 0.52 * (0.8 + Math.random() * 0.2);
        x = r * Math.cos(angle);
        y = khY + r * Math.sin(angle);
      } else {
        // Downward tapered keyway channel
        const t = Math.random(); // 0 to 1
        const halfW = THREE.MathUtils.lerp(0.28, 0.10, t);
        x = (Math.random() - 0.5) * 2 * halfW;
        y = khY - 0.15 - t * 1.2;
      }

      const col = Math.random() < 0.4 ? AMBER_HOT : AMBER_CORE;
      addPoint(x, y, z, col, 2.4 + Math.random() * 0.8, 0);
    }

    // ── 4. 3D HONEYCOMB HEX CLUSTER (Layered in 3D space around shoulders) ──
    const hexRadius = 0.65;
    const hexCenters = [
      { x: -3.2, y: 0.1, z: 0.2 },
      { x: -3.7, y: -0.9, z: -0.2 },
      { x: -3.3, y: -1.9, z: 0.3 },
      { x: 3.2, y: 0.2, z: -0.2 },
      { x: 3.8, y: -0.8, z: 0.3 },
      { x: 3.4, y: -1.8, z: -0.1 },
      { x: -2.0, y: 1.9, z: 0.0 },
      { x: 2.0, y: 1.9, z: 0.0 },
    ];

    hexCenters.forEach((center) => {
      const pts = 42;
      for (let i = 0; i < pts; i++) {
        const side = Math.floor(Math.random() * 6);
        const a1 = (side * Math.PI) / 3;
        const a2 = ((side + 1) * Math.PI) / 3;
        const t = Math.random();

        const x1 = center.x + hexRadius * Math.cos(a1);
        const y1 = center.y + hexRadius * Math.sin(a1);
        const x2 = center.x + hexRadius * Math.cos(a2);
        const y2 = center.y + hexRadius * Math.sin(a2);

        const x = THREE.MathUtils.lerp(x1, x2, t);
        const y = THREE.MathUtils.lerp(y1, y2, t);
        const z = center.z + (Math.random() - 0.5) * 0.2;

        addPoint(x, y, z, AMBER_DEEP, 1.4, 2);
      }
    });

    // ── 5. TRUE 3D VOLUMETRIC CASCADING RED MATRIX STREAM ──
    // Particles drift through a 3D box surrounding the lock in all 3 axes!
    const STREAM_POINTS = TOTAL_POINTS - pIdx;
    const streamBoxW = 16.0;
    const streamBoxH = 16.0;
    const streamBoxD = 8.0;

    for (let i = 0; i < STREAM_POINTS; i++) {
      // Discrete columns for matrix text look
      const colX = (Math.floor(Math.random() * 22) - 11) * 0.72 + (Math.random() - 0.5) * 0.15;
      const colY = (Math.random() - 0.5) * streamBoxH;
      // Distributed in 3D depth: in front, inside, and behind the lock!
      const colZ = -streamBoxD / 2 + Math.random() * streamBoxD;

      const isCenter = Math.abs(colX) < 0.8;
      let col: THREE.Color;

      if (isCenter && Math.random() < 0.25) {
        col = STREAM_HEAD; // Glowing amber/white character in center column
      } else if (Math.random() < 0.3) {
        col = RED_BRIGHT;
      } else {
        col = RED_DEEP;
      }

      addPoint(colX, colY, colZ, col, 1.5 + Math.random() * 0.8, 1);
    }

    // ── BufferGeometry Creation ──
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(posOriginal, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aType', new THREE.BufferAttribute(pointTypes, 1));

    // ── Custom Shader: Full 3D Rotation + Laser Pointer Repulsion ──
    const vertexShader = `
      uniform float uTime;
      uniform vec2 uMouseRot;
      uniform vec3 uPointer;
      uniform float uRepulsionPower;
      
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aType;
      
      varying vec3 vColor;
      varying float vAlpha;

      mat3 getRotationMatrix(vec2 rot) {
        float cx = cos(rot.x), sx = sin(rot.x);
        float cy = cos(rot.y), sy = sin(rot.y);
        mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cx, -sx, 0.0, sx, cx);
        mat3 ry = mat3(cy, 0.0, sy, 0.0, 1.0, 0.0, -sy, 0.0, cy);
        return ry * rx;
      }
      
      void main() {
        vec3 pos = position;
        
        // 1. Red Matrix Cipher Stream: Falling vertically in 3D space
        if (aType > 0.5 && aType < 1.5) {
          float speed = 1.8 + fract(sin(dot(pos.xz, vec2(12.9898, 78.233))) * 43758.5453) * 1.4;
          pos.y = mod(pos.y - uTime * speed + 8.0, 16.0) - 8.0;
        }
        
        // 2. 3D Lock subtle mechanical breathing
        if (aType < 0.5) {
          pos.y += sin(uTime * 1.6 + pos.x * 0.4) * 0.06;
        }
        
        // 3. Volumetric 3D Rotation: Pitch (X) and Yaw (Y)
        mat3 rotMat = getRotationMatrix(uMouseRot);
        vec3 finalPos = rotMat * pos;
        
        // 4. Interactive Laser Cursor Repulsion (Tight, precise micro-bubble)
        float dist = distance(finalPos, uPointer);
        if (dist < 2.2 && uRepulsionPower > 0.01) {
          vec3 repulseDir = normalize(finalPos - uPointer);
          float force = smoothstep(2.2, 0.0, dist) * uRepulsionPower;
          finalPos += repulseDir * force * 1.1;
        }
        
        vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // True 3D depth point sizing (points closer to camera appear larger!)
        gl_PointSize = clamp((aSize * 36.0) / -mvPosition.z, 1.5, 3.8);
        
        // Luminous laser colors with depth shading & proximity flare
        vec3 col = aColor;
        float alpha = 0.88;
        
        // Depth cue: points deeper in Z get subtle atmospheric fade
        float depthFactor = smoothstep(-5.0, 3.0, finalPos.z);
        col = mix(col * 0.6, col, depthFactor);
        
        // Proximity flare tightly focused around cursor tip
        if (dist < 2.2 && uRepulsionPower > 0.01) {
          float flare = smoothstep(2.2, 0.0, dist);
          col = mix(col, vec3(1.0, 0.98, 0.75), flare * 0.75);
          alpha = min(1.0, alpha + flare * 0.3);
        }
        
        vColor = col;
        vAlpha = alpha;
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float r2 = dot(coord, coord);
        if (r2 > 0.25) discard;
        
        // Laser disc with anti-aliased luminous falloff
        float glow = smoothstep(0.25, 0.06, r2);
        gl_FragColor = vec4(vColor, vAlpha * glow);
      }
    `;

    const mouse3D = new THREE.Vector3(-9999, -9999, -9999);
    const mouseRot = new THREE.Vector2(0, 0);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uMouseRot: { value: mouseRot },
        uPointer: { value: mouse3D },
        uRepulsionPower: { value: 0.0 },
      },
    });

    const pointsMesh = new THREE.Points(geometry, material);
    scene.add(pointsMesh);

    // ── Mouse & Inactivity Auto-Reset Engine ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-9999, -9999);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    const targetRot = new THREE.Vector2(0, 0);
    const currentRot = new THREE.Vector2(0, 0);

    let lastInteractionTime = 0;
    const INACTIVITY_TIMEOUT_MS = 2800; // Returns to default state after ~2.8 seconds
    let targetRepulsion = 0.0;
    let currentRepulsion = 0.0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      mouse.x = ndcX;
      mouse.y = ndcY;

      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane, mouse3D);

      const isNearby = Math.abs(ndcX) < 1.4 && Math.abs(ndcY) < 1.4;

      if (isNearby) {
        lastInteractionTime = performance.now();
        targetRepulsion = 1.0;

        // Generous 3D volumetric tilt: Pitch & Yaw clearly reveal the lock's depth and thickness!
        targetRot.y = ndcX * 0.95; // Full 3D yaw
        targetRot.x = -ndcY * 0.65; // Full 3D pitch

        setTelemetry({
          clientX: Math.round(e.clientX),
          clientY: Math.round(e.clientY),
          ndcX: parseFloat(ndcX.toFixed(2)),
          ndcY: parseFloat(ndcY.toFixed(2)),
          isInteracting: true,
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 520;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      camera.lookAt(0, -1.5, 0);
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // ── Animation Loop with Graceful Auto-Reset ──
    let animId: number;
    const startTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const elapsed = (now - startTime) * 0.001;
      material.uniforms.uTime.value = elapsed;

      // Check if user has stopped interacting for more than 2.8s
      const idleTime = now - lastInteractionTime;
      const hasTimedOut = idleTime > INACTIVITY_TIMEOUT_MS;

      if (hasTimedOut) {
        // Smoothly ease back to default front-facing state
        targetRot.set(0, 0);
        targetRepulsion = 0.0;
        mouse3D.set(-9999, -9999, -9999);
      }

      // Smooth mechanical damping back to resting position
      currentRot.x += (targetRot.x - currentRot.x) * 0.055;
      currentRot.y += (targetRot.y - currentRot.y) * 0.055;
      material.uniforms.uMouseRot.value.copy(currentRot);

      currentRepulsion += (targetRepulsion - currentRepulsion) * 0.065;
      material.uniforms.uRepulsionPower.value = currentRepulsion;
      material.uniforms.uPointer.value.copy(mouse3D);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className={`relative w-full h-[520px] lg:h-[560px] bg-transparent rounded-none select-none cursor-crosshair ${className}`}
    >
      {/* Precision Tactical Corner Reticles */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500/40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-500/40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/40 pointer-events-none" />

      {/* 3D WebGL Point Cloud Viewport (Alpha Transparent) */}
      <div ref={mountRef} className="w-full h-full" />

      {/* ── Monospace Tactical Telemetry Overlays (Gold & Red) ── */}
      {/* Top Left: [CIPHER_VAULT // 3D_GOLD_ENCLAVE] & Live Coordinate Probes */}
      <div className="absolute top-2 left-2 z-10 pointer-events-none font-mono text-[10px] tabular-nums space-y-1">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/60 border border-amber-900/60 text-amber-300 backdrop-blur-xs">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-none animate-pulse" />
          <span className="font-semibold">[CIPHER_VAULT // 3D_GOLD_ENCLAVE]</span>
        </div>
        {/* Dynamic Coordinate Readout */}
        <div className="flex items-center gap-2 px-2 py-0.5 bg-black/70 border border-zinc-800 text-[9px] text-slate-300 backdrop-blur-xs">
          <span>
            COORD: [{String(telemetry.clientX).padStart(4, '0')}, {String(telemetry.clientY).padStart(4, '0')}]
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-amber-400">
            VEC: [{telemetry.ndcX >= 0 ? `+${telemetry.ndcX}` : telemetry.ndcX},{' '}
            {telemetry.ndcY >= 0 ? `+${telemetry.ndcY}` : telemetry.ndcY}]
          </span>
        </div>
      </div>

      {/* Top Right: Status Badge & Auto-Reset Status */}
      <div className="absolute top-2 right-2 z-10 pointer-events-none font-mono text-[10px] tabular-nums text-right space-y-1">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/60 border border-red-900/60 text-red-400 backdrop-blur-xs ml-auto">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-none" />
          <span>[STREAM: RED_HEX_MATRIX]</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/70 border border-zinc-800 text-[9px] text-slate-400 backdrop-blur-xs ml-auto">
          <span>STATE:</span>
          <span className={telemetry.isInteracting ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
            {telemetry.isInteracting ? '3D_INTERACTION_ACTIVE' : 'DEFAULT_FRONT_LOCKED'}
          </span>
        </div>
      </div>

      {/* Bottom Left: 3D Volumetric Depth Specs */}
      <div className="absolute bottom-2 left-2 z-10 pointer-events-none font-mono text-[10px] tabular-nums text-slate-400 bg-black/60 border border-zinc-800/80 px-2 py-0.5 flex items-center gap-1.5 backdrop-blur-xs">
        <span className="text-amber-500">DEPTH:</span>
        <span className="text-slate-300">VOLUMETRIC_3D_CHASSIS (D: 2.2U)</span>
      </div>

      {/* Bottom Right: Auto-Relax Indicator */}
      <div className="absolute bottom-2 right-2 z-10 pointer-events-none font-mono text-[10px] tabular-nums bg-black/60 border border-zinc-800/80 px-2 py-0.5 flex items-center gap-1.5 backdrop-blur-xs">
        <span className="w-1.5 h-1.5 bg-amber-400 rounded-none" />
        <span className="text-amber-300 font-semibold">AUTO_RELAX: 2.8S_IDLE</span>
      </div>
    </div>
  );
};
