'use client';

import { useEffect, useRef } from 'react';

export default function ResourceGlobe3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const rotationRef = useRef({ x: 0.3, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
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

    // Performance observer: pause RAF when out of viewport
    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(container);

    // Mouse / Touch Drag interaction
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      rotationRef.current.y += dx * 0.008;
      rotationRef.current.x = Math.max(-1.2, Math.min(1.2, rotationRef.current.x + dy * 0.008));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Generate 3D surface points
    const points: Array<{ x: number; y: number; z: number; color: string; size: number }> = [];
    const count = 150;
    const colors = ['#00D9A5', '#7C3AED', '#2563EB', '#DB2777', '#D97706', '#059669'];

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const r = 110;
      points.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.cos(phi),
        z: r * Math.sin(phi) * Math.sin(theta),
        color: colors[i % colors.length],
        size: Math.random() * 2.5 + 1.5,
      });
    }

    let time = 0;

    const draw = () => {
      if (!isVisibleRef.current) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      time += 0.012;
      if (!isDraggingRef.current) {
        rotationRef.current.y += 0.006;
      }

      const cssW = canvas.offsetWidth;
      const cssH = canvas.offsetHeight;
      ctx.clearRect(0, 0, cssW, cssH);

      const cx = cssW / 2;
      const cy = cssH / 2;
      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;
      const cosX = Math.cos(rx), sinX = Math.sin(rx);
      const cosY = Math.cos(ry), sinY = Math.sin(ry);
      const fov = 350;

      // Outer glowing halo
      const halo = ctx.createRadialGradient(cx, cy, 40, cx, cy, 140);
      halo.addColorStop(0, 'rgba(0, 217, 165, 0.14)');
      halo.addColorStop(0.5, 'rgba(124, 58, 237, 0.09)');
      halo.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // Latitude / Longitude 3D Rings
      ctx.save();
      for (let lat = -60; lat <= 60; lat += 30) {
        const radLat = (lat * Math.PI) / 180;
        const latR = 110 * Math.cos(radLat);
        const latY = 110 * Math.sin(radLat);
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.15) {
          const px = latR * Math.cos(a);
          const py = latY;
          const pz = latR * Math.sin(a);
          const x1 = px * cosY - pz * sinY;
          const z1 = px * sinY + pz * cosY;
          const y2 = py * cosX - z1 * sinX;
          const z2 = py * sinX + z1 * cosX;
          const scale = fov / (fov + z2 + 200);
          const sx = cx + x1 * scale;
          const sy = cy + y2 * scale;
          if (a === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = 'rgba(0, 217, 165, 0.09)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();

      // Project surface points
      const projected = points.map(p => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;
        const scale = fov / (fov + z2 + 200);
        const sx = cx + x1 * scale;
        const sy = cy + y2 * scale;
        return { ...p, sx, sy, z2, scale };
      });

      projected.sort((a, b) => b.z2 - a.z2);

      // Connect nearby points
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          if (a.z2 < 0 && b.z2 < 0) continue;
          const dist = Math.hypot(a.sx - b.sx, a.sy - b.sy);
          if (dist < 44) {
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.strokeStyle = `rgba(0, 217, 165, ${0.2 * (1 - dist / 44)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw projected points
      projected.forEach(p => {
        const alpha = p.z2 > 0 ? 0.95 : 0.25;
        const r = p.size * p.scale;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Orbiting Rescue Satellite ring
      const satR = 145;
      const satA = time * 1.2;
      const satX = satR * Math.cos(satA);
      const satY = satR * Math.sin(satA) * 0.4;
      const satZ = satR * Math.sin(satA);
      const sx1 = satX * cosY - satZ * sinY;
      const sz1 = satX * sinY + satZ * cosY;
      const sy2 = satY * cosX - sz1 * sinX;
      const sz2 = satY * sinX + sz1 * cosX;
      const satScale = fov / (fov + sz2 + 200);
      const satSx = cx + sx1 * satScale;
      const satSy = cy + sy2 * satScale;

      ctx.beginPath();
      ctx.arc(satSx, satSy, 6 * satScale, 0, Math.PI * 2);
      ctx.fillStyle = '#00D9A5';
      ctx.shadowColor = '#00D9A5';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '320px', position: 'relative', cursor: 'grab' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
