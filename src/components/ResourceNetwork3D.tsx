'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { RotateCw, Maximize2, Compass, Layers, Zap } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  color: string;
  resourceCount: number;
  totalValue: number;
}

interface ResourceNetwork3DProps {
  departments: Department[];
  rescuedCount: number;
  totalResources: number;
}

interface Node3D {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  type: 'hub' | 'dept' | 'resource';
  pulse: number;
  pulseSpeed: number;
  resourceCount?: number;
  totalValue?: number;
  deptName?: string;
}

interface Edge3D {
  from: string;
  to: string;
  strength: number;
  active: boolean;
  color?: string;
}

export default function ResourceNetwork3D({ departments, rescuedCount, totalResources }: ResourceNetwork3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node3D[]>([]);
  const edgesRef = useRef<Edge3D[]>([]);
  const timeRef = useRef(0);
  const rotationRef = useRef({ x: 0.2, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0.002 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(true);
  const [hoveredNodeInfo, setHoveredNodeInfo] = useState<Node3D | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const nodes: Node3D[] = [];
    const edges: Edge3D[] = [];

    // Central hub
    nodes.push({
      id: 'hub',
      label: 'RESCUE AI',
      color: '#00D9A5',
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      radius: 26,
      type: 'hub',
      pulse: 0,
      pulseSpeed: 0.02,
      totalValue: departments.reduce((s, d) => s + d.totalValue, 0),
      resourceCount: totalResources,
    });

    // Department nodes arranged in spherical 3D orbit
    departments.forEach((dept, i) => {
      const phi = Math.acos(-1 + (2 * i + 1) / departments.length);
      const theta = Math.sqrt(departments.length * Math.PI) * phi;
      const r = 180;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi) * 0.8;
      const z = r * Math.sin(phi) * Math.sin(theta);

      nodes.push({
        id: dept.id,
        label: dept.name.split(' ')[0],
        deptName: dept.name,
        color: dept.color,
        x, y, z,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        vz: (Math.random() - 0.5) * 0.08,
        radius: 12 + Math.min(dept.resourceCount * 1.2, 10),
        type: 'dept',
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.01,
        resourceCount: dept.resourceCount,
        totalValue: dept.totalValue,
      });

      // Edge to hub
      edges.push({
        from: 'hub',
        to: dept.id,
        strength: dept.resourceCount / Math.max(totalResources, 1),
        active: true,
        color: dept.color,
      });

      // Satellite resource nodes orbiting each department
      const numResources = Math.min(dept.resourceCount, 6);
      for (let j = 0; j < numResources; j++) {
        const satAngle = (j / numResources) * Math.PI * 2;
        const satDist = 55 + (j % 2) * 15;
        const rx = x + satDist * Math.cos(satAngle);
        const ry = y + satDist * Math.sin(satAngle) * 0.6;
        const rz = z + satDist * Math.sin(satAngle);

        const resId = `res-${dept.id}-${j}`;
        nodes.push({
          id: resId,
          label: '',
          deptName: dept.name,
          color: dept.color,
          x: rx, y: ry, z: rz,
          vx: (Math.random() - 0.5) * 0.04,
          vy: (Math.random() - 0.5) * 0.04,
          vz: (Math.random() - 0.5) * 0.04,
          radius: 3.5 + Math.random() * 2.5,
          type: 'resource',
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.03 + Math.random() * 0.02,
        });

        edges.push({
          from: dept.id,
          to: resId,
          strength: 0.25,
          active: false,
          color: `${dept.color}40`,
        });
      }

      // Cross-department rescue flows
      if (i > 0 && rescuedCount > 0) {
        edges.push({
          from: departments[(i - 1) % departments.length].id,
          to: dept.id,
          strength: 0.6,
          active: true,
          color: '#00D9A5',
        });
      }
    });

    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [departments, rescuedCount, totalResources]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    window.addEventListener('resize', handleResize);

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const cssW = canvas.offsetWidth;
      const cssH = canvas.offsetHeight;

      ctx.clearRect(0, 0, cssW, cssH);

      // Auto rotation physics with damping
      if (autoRotateRef.current && !isDraggingRef.current) {
        rotationRef.current.y += 0.003;
      } else if (!isDraggingRef.current) {
        rotationRef.current.y += velocityRef.current.y;
        rotationRef.current.x += velocityRef.current.x;
        velocityRef.current.x *= 0.92;
        velocityRef.current.y *= 0.92;
      }

      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;
      const cosX = Math.cos(rx), sinX = Math.sin(rx);
      const cosY = Math.cos(ry), sinY = Math.sin(ry);
      const fov = 460;
      const cx = cssW / 2;
      const cy = cssH / 2;

      // 3D Orbital Grid Rings
      ctx.save();
      for (let ring = 1; ring <= 2; ring++) {
        const ringRadius = 190 * ring;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
          const ox = ringRadius * Math.cos(a);
          const oy = 0;
          const oz = ringRadius * Math.sin(a);
          const x1 = ox * cosY - oz * sinY;
          const z1 = ox * sinY + oz * cosY;
          const y2 = oy * cosX - z1 * sinX;
          const z2 = oy * sinX + z1 * cosX;
          const scale = fov / (fov + z2 + 250);
          const sx = cx + x1 * scale;
          const sy = cy + y2 * scale;
          if (a === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = ring === 1 ? 'rgba(0, 217, 165, 0.05)' : 'rgba(124, 58, 237, 0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Project nodes in 3D
      const projected = nodesRef.current.map(node => {
        node.pulse += node.pulseSpeed;
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;
        const scale = fov / (fov + z2 + 250);
        const sx = cx + x1 * scale;
        const sy = cy + y2 * scale;
        return { ...node, sx, sy, z2, scale };
      });

      // Sort by depth (painter's algorithm)
      projected.sort((a, b) => b.z2 - a.z2);

      // Render 3D Edges
      edgesRef.current.forEach(edge => {
        const from = projected.find(n => n.id === edge.from);
        const to = projected.find(n => n.id === edge.to);
        if (!from || !to) return;

        const isHighlight = selectedDept && (from.id === selectedDept || to.id === selectedDept);
        const alpha = edge.active ? (isHighlight ? 0.85 : 0.35) : 0.12;

        ctx.beginPath();
        ctx.moveTo(from.sx, from.sy);
        ctx.lineTo(to.sx, to.sy);

        const edgeGrad = ctx.createLinearGradient(from.sx, from.sy, to.sx, to.sy);
        edgeGrad.addColorStop(0, `${from.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
        edgeGrad.addColorStop(1, `${to.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);

        ctx.strokeStyle = edgeGrad;
        ctx.lineWidth = edge.active ? (isHighlight ? 2.5 : 1.5) * from.scale : 0.8 * from.scale;
        ctx.stroke();
      });

      // Render 3D Flowing Energy Packets (Rescue Flow Particles)
      const activeEdges = edgesRef.current.filter(e => e.active);
      if (activeEdges.length > 0) {
        for (let p = 0; p < 12; p++) {
          const edge = activeEdges[p % activeEdges.length];
          const from = projected.find(n => n.id === edge.from);
          const to = projected.find(n => n.id === edge.to);
          if (!from || !to) continue;

          const progress = (t * 0.45 + p * (1 / 12)) % 1;
          const px = from.sx + (to.sx - from.sx) * progress;
          const py = from.sy + (to.sy - from.sy) * progress;
          const pScale = from.scale * (1 - Math.abs(progress - 0.5) * 0.4);

          ctx.beginPath();
          ctx.arc(px, py, 3.5 * pScale, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 217, 165, 0.95)';
          ctx.shadowColor = '#00D9A5';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Render 3D Nodes
      projected.forEach(node => {
        const isHovered = hoveredRef.current === node.id;
        const isFocus = selectedDept === node.id;
        const pulseFactor = Math.sin(node.pulse) * 0.15 + 1;
        const r = Math.max(3, node.radius * node.scale * pulseFactor * (isHovered ? 1.3 : 1));

        if (node.type === 'hub') {
          // Central RESCUE Hub
          // Pulsing halo
          const halo = ctx.createRadialGradient(node.sx, node.sy, 0, node.sx, node.sy, r * 2.8);
          halo.addColorStop(0, 'rgba(0, 217, 165, 0.25)');
          halo.addColorStop(0.6, 'rgba(124, 58, 237, 0.12)');
          halo.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(node.sx, node.sy, r * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = halo;
          ctx.fill();

          // Hub core
          const hg = ctx.createRadialGradient(node.sx - r * 0.3, node.sy - r * 0.3, 0, node.sx, node.sy, r);
          hg.addColorStop(0, '#00D9A5');
          hg.addColorStop(0.7, '#009a75');
          hg.addColorStop(1, '#06382a');
          ctx.beginPath();
          ctx.arc(node.sx, node.sy, r, 0, Math.PI * 2);
          ctx.fillStyle = hg;
          ctx.fill();
          ctx.strokeStyle = '#00D9A5';
          ctx.lineWidth = 2 * node.scale;
          ctx.stroke();

          // Label
          ctx.font = `bold ${Math.max(9, 11 * node.scale)}px Inter, sans-serif`;
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡ RESCUE', node.sx, node.sy);

        } else if (node.type === 'dept') {
          // Department Nexus Node
          if (isHovered || isFocus) {
            const glow = ctx.createRadialGradient(node.sx, node.sy, 0, node.sx, node.sy, r * 2.5);
            glow.addColorStop(0, `${node.color}60`);
            glow.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(node.sx, node.sy, r * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();
          }

          const dg = ctx.createRadialGradient(node.sx - r * 0.3, node.sy - r * 0.3, 0, node.sx, node.sy, r);
          dg.addColorStop(0, `${node.color}`);
          dg.addColorStop(1, `${node.color}88`);
          ctx.beginPath();
          ctx.arc(node.sx, node.sy, r, 0, Math.PI * 2);
          ctx.fillStyle = dg;
          ctx.fill();
          ctx.strokeStyle = isHovered || isFocus ? '#FFFFFF' : `${node.color}cc`;
          ctx.lineWidth = (isHovered ? 2.5 : 1.2) * node.scale;
          ctx.stroke();

          // Department label
          if (node.scale > 0.6) {
            ctx.font = `600 ${Math.max(9, 10 * node.scale)}px Inter, sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label, node.sx, node.sy);

            if (node.resourceCount) {
              ctx.font = `700 ${Math.max(7, 8.5 * node.scale)}px Inter, sans-serif`;
              ctx.fillStyle = 'var(--rescue-green)';
              ctx.fillText(`${node.resourceCount} items`, node.sx, node.sy + r + 10 * node.scale);
            }
          }
        } else {
          // Satellite resource node
          ctx.beginPath();
          ctx.arc(node.sx, node.sy, r, 0, Math.PI * 2);
          ctx.fillStyle = `${node.color}cc`;
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF30';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Mouse & Touch Controls
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        rotationRef.current.y += dx * 0.006;
        rotationRef.current.x += dy * 0.006;
        rotationRef.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationRef.current.x));
        velocityRef.current = { x: dy * 0.001, y: dx * 0.001 };
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }

      // 3D Hover Detection
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;
      const cosX = Math.cos(rx), sinX = Math.sin(rx);
      const cosY = Math.cos(ry), sinY = Math.sin(ry);
      const fov = 460;
      const cx = canvas.offsetWidth / 2;
      const cy = canvas.offsetHeight / 2;

      let foundNode: Node3D | null = null;
      nodesRef.current.forEach(n => {
        if (n.type === 'resource') return;
        const x1 = n.x * cosY - n.z * sinY;
        const z1 = n.x * sinY + n.z * cosY;
        const y2 = n.y * cosX - z1 * sinX;
        const z2 = n.y * sinX + z1 * cosX;
        const scale = fov / (fov + z2 + 250);
        const sx = cx + x1 * scale;
        const sy = cy + y2 * scale;
        const r = n.radius * scale;
        if (Math.hypot(mx - sx, my - sy) < r + 8) {
          foundNode = n;
        }
      });

      hoveredRef.current = foundNode ? (foundNode as any).id : null;
      setHoveredNodeInfo(foundNode);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [departments]);

  const resetOrientation = () => {
    rotationRef.current = { x: 0.2, y: 0 };
    velocityRef.current = { x: 0, y: 0.002 };
    setSelectedDept(null);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '360px',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.08) 0%, rgba(6, 6, 14, 0.95) 75%)',
        border: '1px solid rgba(124, 58, 237, 0.2)',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
      />

      {/* Top 3D Status Overlay */}
      <div style={{
        position: 'absolute', top: 12, left: 16,
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(6, 6, 14, 0.75)', padding: '6px 12px',
        borderRadius: 20, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00D9A5', animation: 'chat-pulse 2s infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.4px' }}>
          3D TOPOLOGY ENGINE
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          · {departments.length} Nodes · {totalResources} Satellites
        </span>
      </div>

      {/* 3D Viewport Controls */}
      <div style={{
        position: 'absolute', top: 12, right: 16,
        display: 'flex', gap: 6,
      }}>
        <button
          onClick={() => setAutoRotate(r => !r)}
          style={{
            background: autoRotate ? 'rgba(0, 217, 165, 0.15)' : 'rgba(255,255,255,0.06)',
            color: autoRotate ? 'var(--rescue-green)' : 'var(--text-secondary)',
            border: autoRotate ? '1px solid rgba(0, 217, 165, 0.3)' : '1px solid var(--border-subtle)',
            padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
          }}
          title="Toggle Auto-Orbit"
        >
          <RotateCw size={12} className={autoRotate ? 'animate-spin' : ''} />
          {autoRotate ? 'Orbiting' : 'Paused'}
        </button>

        <button
          onClick={resetOrientation}
          style={{
            background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)', padding: '5px 10px', borderRadius: 8,
            fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
          }}
          title="Reset Camera Orientation"
        >
          <Compass size={12} />
          Reset
        </button>
      </div>

      {/* Interactive 3D Hover Tooltip */}
      {hoveredNodeInfo && (
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'rgba(11, 11, 23, 0.92)', border: `1px solid ${hoveredNodeInfo.color}60`,
          borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(16px)',
          boxShadow: `0 12px 32px rgba(0,0,0,0.8), 0 0 20px ${hoveredNodeInfo.color}30`,
          minWidth: 200, animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: hoveredNodeInfo.color }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>
              {hoveredNodeInfo.deptName || hoveredNodeInfo.label}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', gap: 12, marginTop: 4 }}>
            {hoveredNodeInfo.resourceCount !== undefined && (
              <span><strong>{hoveredNodeInfo.resourceCount}</strong> Assets</span>
            )}
            {hoveredNodeInfo.totalValue !== undefined && (
              <span style={{ color: 'var(--rescue-green)' }}>
                <strong>₹{(hoveredNodeInfo.totalValue / 100000).toFixed(1)}L</strong> Value
              </span>
            )}
          </div>
        </div>
      )}

      {/* Legend / Filter Pills */}
      <div style={{
        position: 'absolute', bottom: 12, right: 16,
        display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: '60%', justifyContent: 'flex-end',
      }}>
        {departments.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedDept(selectedDept === d.id ? null : d.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 8px', borderRadius: 12, fontSize: 10,
              background: selectedDept === d.id ? `${d.color}35` : 'rgba(6, 6, 14, 0.7)',
              border: `1px solid ${selectedDept === d.id ? d.color : 'rgba(255,255,255,0.08)'}`,
              color: selectedDept === d.id ? '#FFFFFF' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.color }} />
            {d.name.split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
