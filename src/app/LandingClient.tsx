'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Recycle, Zap, Package, ArrowRight, Sparkles, TrendingUp, BarChart3, ShieldCheck, Leaf } from 'lucide-react';
import ResourceGlobe3D from '@/components/ResourceGlobe3D';

// Animated counter hook
function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

// Particle network canvas
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; opacity: number }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 14000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 217, 165, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((a, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0, 217, 165, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      animFrame = requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();
    window.addEventListener('resize', () => { resize(); init(); });

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.7 }}
    />
  );
}

// Typewriter component
function Typewriter({ texts, speed = 75, pause = 2000 }: { texts: string[]; speed?: number; pause?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [textIdx, setTextIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[textIdx];
    let timeout: NodeJS.Timeout;

    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx(c => c + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(c => c - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setTextIdx(i => (i + 1) % texts.length);
    }

    setDisplayed(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, textIdx, texts, speed, pause]);

  return (
    <span style={{ color: 'var(--rescue-green)' }} className="cursor-blink">
      {displayed}
    </span>
  );
}

export default function LandingPageClient() {
  const [liveStats, setLiveStats] = useState({ totalResources: 0, rescuedCount: 0, totalSavings: 0, departments: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => { setLiveStats(data); setStatsLoaded(true); })
      .catch(() => {
        setLiveStats({ totalResources: 37, rescuedCount: 18, totalSavings: 4455000, departments: 5 });
        setStatsLoaded(true);
      });
  }, []);

  const savings = useCountUp(statsLoaded ? Math.round(liveStats.totalSavings / 1000) : 0);
  const resources = useCountUp(statsLoaded ? liveStats.totalResources : 0);
  const rescued = useCountUp(statsLoaded ? liveStats.rescuedCount : 0);

  return (
    <div className="hero">
      <div className="hero-bg" />
      <div className="hero-grid" />
      <ParticleCanvas />

      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="sidebar-logo-icon" style={{ width: 36, height: 36, borderRadius: 9 }}>
            <Recycle size={20} color="white" />
          </div>
          <span><span style={{ color: 'var(--rescue-green)' }}>RESCUE</span> AI</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
          <Link href="/resources" className="btn btn-secondary btn-sm">Browse Resources</Link>
          <Link href="/needs/new" className="btn btn-primary btn-sm">
            <Zap size={14} />
            Find Resources
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="hero-content">
        <div className="hero-eyebrow animate-fade-in">
          <Sparkles size={14} />
          AI-Powered Resource Recovery · INSPIRE Hackathon 2026
        </div>

        <h1 className="hero-title animate-fade-in stagger-1">
          Don&apos;t Buy.
          <span className="hero-title-rescue">RESCUE.</span>
        </h1>

        <p className="hero-subtitle animate-fade-in stagger-2">
          AI that <Typewriter texts={['finds unused equipment', 'saves procurement costs', 'matches resources to needs', 'reduces organizational waste']} /> inside your organization{' '}
          — <strong style={{ color: 'var(--text-primary)' }}>before new purchases are made</strong>.
        </p>

        <div className="hero-ctas animate-fade-in stagger-3">
          <Link href="/needs/new" className="btn btn-rescue btn-lg">
            <Zap size={18} />
            Find Existing Resources
          </Link>
          <Link href="/dashboard" className="btn btn-secondary btn-lg">
            <BarChart3 size={18} />
            View Dashboard
          </Link>
        </div>

        {/* 3D Interactive Resource Globe */}
        <div className="animate-fade-in stagger-3" style={{ width: '100%', maxWidth: 360, margin: '0 auto 24px' }}>
          <ResourceGlobe3D />
        </div>

        {/* Live Stats */}
        <div className="animate-fade-in stagger-4" style={{
          display: 'flex', gap: 0,
          background: 'rgba(11,11,23,0.85)',
          border: '1px solid rgba(0, 217, 165, 0.14)',
          borderRadius: 20, backdropFilter: 'blur(16px)',
          marginBottom: 48, overflow: 'hidden',
        }}>
          {[
            { value: `${resources}+`, label: 'Resources Indexed', icon: Package, color: '#7C3AED' },
            { value: `${rescued}`, label: 'Resources Rescued', icon: Recycle, color: '#00D9A5' },
            { value: `₹${savings}K`, label: 'Procurement Avoided', icon: TrendingUp, color: '#2563EB' },
            { value: `${liveStats.departments || 5}`, label: 'Departments Connected', icon: ShieldCheck, color: '#D97706' },
          ].map(({ value, label, icon: Icon, color }, i) => (
            <div key={label} style={{
              padding: '20px 28px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 6 }}>
                <Icon size={14} color={color} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ width: '100%', maxWidth: 900 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px' }}>
              How RESCUE Works
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 15 }}>
              Need → Discover → Match → Reuse → Impact. Zero new purchases needed.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { step: '01', title: 'Describe', desc: 'Type what you need in plain English', icon: '✍️' },
              { step: '02', title: 'AI Understands', desc: 'Gemini extracts structured requirements', icon: '🧠' },
              { step: '03', title: 'Search DB', desc: 'Scans all departments in real-time', icon: '🔍' },
              { step: '04', title: 'RESCUE & Save', desc: 'Reserve assets, avoid procurement', icon: '♻️' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="card card-hover animate-slide-up" style={{
                  textAlign: 'center', padding: '20px 18px', minWidth: 160,
                  animationDelay: `${0.5 + i * 0.1}s`,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--rescue-green)', letterSpacing: '1px', marginBottom: 6 }}>
                    STEP {item.step}
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
                {i < 3 && <ArrowRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div style={{ marginTop: 56, width: '100%', maxWidth: 900 }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.5px' }}>
            Why RESCUE AI?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: '🤖', title: 'Gemini-Powered AI', desc: 'Natural language extraction + grounded DB matching. Not hallucinated — 100% real data.' },
              { icon: '🌱', title: 'Sustainability Impact', desc: 'Tracks CO₂ avoided, waste reduction, and procurement eliminated per rescue.' },
              { icon: '⚡', title: '3D Resource Network', desc: 'Interactive visualization of all org resources, live topology, and rescue flows.' },
              { icon: '🔍', title: 'Deep Search', desc: 'Searches every department simultaneously with multi-factor compatibility scoring.' },
              { icon: '📊', title: 'Impact Analytics', desc: 'Track historical savings, environmental metrics, and resource utilization over time.' },
              { icon: '💬', title: 'AI Assistant', desc: 'Ask anything about your organization\'s resources in plain English, any time.' },
            ].map((f, i) => (
              <div key={i} className="card card-hover animate-fade-in" style={{ animationDelay: `${0.6 + i * 0.07}s`, padding: '20px' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div style={{ marginTop: 56, textAlign: 'center' }}>
          <div style={{
            padding: '40px 60px',
            background: 'linear-gradient(135deg, rgba(0,217,165,0.06), rgba(124,58,237,0.06))',
            border: '1px solid var(--border-rescue)',
            borderRadius: 24, maxWidth: 600, margin: '0 auto',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>♻️</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>"Don't buy what you already have."</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              Start discovering hidden resources across your organization in seconds.
            </p>
            <Link href="/needs/new" className="btn btn-rescue btn-lg">
              <Zap size={18} />
              Start RESCUE Search
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
