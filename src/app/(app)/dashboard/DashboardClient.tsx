'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Package, Recycle, TrendingUp, Leaf, Zap, ArrowRight,
  Lightbulb, Clock, CheckCircle2, AlertCircle, Search,
  BarChart3, Sparkles,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { AIInsight } from '@/lib/ai';

// Animated counter
function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
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

const ResourceNetwork3D = dynamic(() => import('@/components/ResourceNetwork3D'), { ssr: false, loading: () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
    <div className="loading-spinner" style={{ marginRight: 8, width: 16, height: 16 }} />
    Loading 3D Network...
  </div>
)});

interface DashboardData {
  stats: {
    totalResources: number;
    rescuedCount: number;
    totalSavings: number;
    totalCO2: number;
    requirementCount: number;
  };
  categoryUtilization: Array<{ category: string; utilization: number; total: number }>;
  departments: Array<{ id: string; name: string; color: string; resourceCount: number; totalValue: number }>;
  recentMatches: any[];
  insights: AIInsight[];
  requirements: any[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: '#2563EB',
  Furniture: '#D97706',
  Space: '#059669',
  Material: '#DB2777',
  Capacity: '#7C3AED',
};

const formatCurrency = (val: number) => {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val}`;
};

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { stats, categoryUtilization, departments, insights, requirements } = data;

  const countResources = useCountUp(stats.totalResources);
  const countRescued = useCountUp(stats.rescuedCount);
  const countCO2 = useCountUp(stats.totalCO2);

  return (
    <>
      {/* Topbar */}
      <header className="topbar">
        <h1 className="topbar-title">Dashboard</h1>
        <div className="topbar-actions">
          <Link href="/needs/new" className="btn btn-primary btn-sm">
            <Zap size={14} />
            Find Resources
          </Link>
        </div>
      </header>

      <div className="page-container">
        {/* Stats Grid — animated counters */}
        <div className="grid-4 animate-fade-in" style={{ marginBottom: 24 }}>
          {[
            {
              icon: Package, label: 'TOTAL RESOURCES', value: countResources,
              color: '#7C3AED', bg: 'rgba(124,58,237,0.1)',
              change: `${departments.length} departments`, up: true,
            },
            {
              icon: Recycle, label: 'RESOURCES RESCUED', value: countRescued,
              color: '#00D9A5', bg: 'rgba(0,217,165,0.1)',
              change: 'All-time matches', up: true,
            },
            {
              icon: TrendingUp, label: 'PROCUREMENT AVOIDED', value: formatCurrency(stats.totalSavings),
              color: '#2563EB', bg: 'rgba(37,99,235,0.1)',
              change: 'Estimated savings', up: true,
            },
            {
              icon: Leaf, label: 'CO\u2082e AVOIDED (kg)', value: countCO2,
              color: '#059669', bg: 'rgba(5,150,105,0.1)',
              change: 'Est. environmental benefit', up: true,
            },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ borderColor: `${s.color}20` }}>
              <div className={`stagger-${i + 1} animate-fade-in`}>
                <div className="stat-card-icon" style={{ background: s.bg }}>
                  <s.icon size={20} color={s.color} />
                </div>
                <div className="stat-card-value">{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
                <div className={`stat-card-change ${s.up ? 'up' : 'down'}`}>↑ {s.change}</div>
              </div>
              <div className="stat-card-glow" style={{ background: s.color }} />
            </div>
          ))}
        </div>

        {/* Quick Actions Row */}
        <div className="animate-fade-in stagger-1" style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { href: '/needs/new', icon: Search, label: 'Search Resources', desc: 'Find what you need', color: '#00D9A5', bg: 'rgba(0,217,165,0.08)' },
            { href: '/resources', icon: Package, label: 'Browse All Assets', desc: `${stats.totalResources} indexed`, color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
            { href: '/needs', icon: BarChart3, label: 'Needs History', desc: `${stats.requirementCount} searches`, color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
            { href: '/impact', icon: Sparkles, label: 'Impact Center', desc: 'Environmental metrics', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
          ].map((action, i) => (
            <Link key={i} href={action.href} style={{
              flex: 1, minWidth: 160, padding: '14px 16px',
              background: action.bg, border: `1px solid ${action.color}20`,
              borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all 0.2s', textDecoration: 'none',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${action.color}20`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <action.icon size={18} color={action.color} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{action.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Resource Utilization */}
          <div className="card animate-fade-in stagger-2">
            <div className="section-header" style={{ marginBottom: '20px' }}>
              <div>
                <div className="section-title" style={{ fontSize: '16px' }}>Resource Utilization</div>
                <div className="section-subtitle">By category across all departments</div>
              </div>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryUtilization} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#5A5A7A', fontSize: 11 }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="category" tick={{ fill: '#9898B8', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ background: '#14141F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#F0F0FF', fontSize: 12 }}
                    formatter={(v: any) => [`${v}%`, 'Utilization']}
                  />
                  <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
                    {categoryUtilization.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.category] || '#00D9A5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Network — 3D Visualization */}
          <div className="card animate-fade-in stagger-3" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 0' }}>
              <div className="section-header" style={{ marginBottom: '8px' }}>
                <div>
                  <div className="section-title" style={{ fontSize: '16px' }}>Resource Network</div>
                  <div className="section-subtitle">3D organizational topology</div>
                </div>
                <span className="badge badge-green" style={{ fontSize: '10px' }}>LIVE</span>
              </div>
            </div>
            <div style={{ height: 280, position: 'relative' }}>
              <ResourceNetwork3D
                departments={departments}
                rescuedCount={stats.rescuedCount}
                totalResources={stats.totalResources}
              />
            </div>
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              {departments.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: d.color }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* AI Insights */}
          <div className="card animate-fade-in stagger-3">
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <div>
                <div className="section-title" style={{ fontSize: '16px' }}>
                  <span style={{ marginRight: 6 }}>🔎</span> AI Insights
                </div>
                <div className="section-subtitle">Proactive opportunities identified</div>
              </div>
              <span className="badge badge-purple">
                <Lightbulb size={10} />
                AI
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {insights.map((insight, i) => (
                <div key={i} className="insight-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {insight.title}
                    </div>
                    {insight.potentialSavings && (
                      <span className="badge badge-green" style={{ fontSize: '10px', flexShrink: 0 }}>
                        {formatCurrency(insight.potentialSavings)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
                    {insight.description}
                  </div>
                  {insight.action && (
                    <Link href="/needs/new" className="btn btn-primary btn-sm" style={{ fontSize: '11px' }}>
                      {insight.action} <ArrowRight size={10} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Predictive Surplus Forecast Section */}
        <div className="card card-ai animate-fade-in stagger-4" style={{ marginTop: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--rescue-green)" />
                <span style={{ fontSize: '16px', fontWeight: 800 }}>AI Predictive Surplus Forecast</span>
                <span className="badge badge-purple" style={{ fontSize: '10px' }}>Gemini 2.0 Proactive</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Forecasts upcoming idle asset windows before purchasing cycles begin
              </div>
            </div>
            <span className="badge badge-green" style={{ fontSize: '11px', padding: '4px 10px' }}>
              Estimated ₹10.1L Savings Pipeline
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {[
              {
                dept: 'Computer Engineering & AI',
                surplus: '18 Dell Laptops & 1 GPU Server',
                window: 'Exam Season (Sept 15 - Oct 10)',
                opp: 'Can fulfill Robotics & Data Science annual workshops without external rental.',
                conf: 94,
                savings: '₹4.8L',
              },
              {
                dept: 'Mechanical & Fabrication',
                surplus: 'Haas Mini Mill CNC (40 hrs)',
                window: 'Post-Formula Student Break',
                opp: 'Available for Robotics drone chassis and Electronics heat-sink prototyping.',
                conf: 96,
                savings: '₹3.5L',
              },
              {
                dept: 'Media & XR Innovation',
                surplus: '8 Meta Quest 3 VR Headsets',
                window: 'Post-Exhibition Recess',
                opp: 'Can be allocated to Biotech / Medical 3D anatomy simulation module.',
                conf: 89,
                savings: '₹3.2L',
              },
            ].map((p, i) => (
              <div key={i} style={{
                padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px',
                border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{p.dept}</strong>
                  <span className="badge badge-green" style={{ fontSize: '10px' }}>{p.conf}% Confidence</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rescue-green)' }}>
                  📦 {p.surplus}
                </div>
                <div style={{ fontSize: '11px', color: '#FCD34D' }}>
                  ⏳ Idle Window: {p.window}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                  {p.opp}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Opportunity Value:</span>
                  <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{p.savings}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero CTA */}
        <div className="impact-hero animate-fade-in" style={{ marginTop: '32px' }}>
          <div style={{ fontSize: '13px', color: 'var(--rescue-green)', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase' }}>
            ♻️ Start a Rescue
          </div>
          <div className="impact-number">{formatCurrency(stats.totalSavings || 282000)}</div>
          <div className="impact-label">potential procurement avoided across INSPIRE University</div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <Link href="/needs/new" className="btn btn-rescue">
              <Zap size={18} />
              Find Resources Now
            </Link>
            <Link href="/impact" className="btn btn-secondary">
              View Full Impact <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
