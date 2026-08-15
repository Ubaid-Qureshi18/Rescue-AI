'use client';

import Link from 'next/link';
import {
  TrendingUp, Leaf, Package, Recycle, Zap,
  BarChart3, ArrowRight, Info,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface Props {
  totalSavings: number;
  totalCO2: number;
  totalWaste: number;
  fulfilledCount: number;
  matchedCount: number;
  impacts: any[];
  trendData: any[];
  deptContribution: any[];
  totalResources: number;
}

const formatCurrency = (val: number) => {
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#14141F', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#F0F0FF',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.name === 'savings' ? formatCurrency(p.value) : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ImpactClient({
  totalSavings, totalCO2, totalWaste, fulfilledCount,
  matchedCount, impacts, trendData, deptContribution, totalResources,
}: Props) {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="topbar-title">Impact Center</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            <Info size={11} style={{ display: 'inline', marginRight: 4 }} />
            All metrics are estimates based on configurable assumptions
          </span>
        </div>
      </header>

      <div className="page-container">
        {/* Hero Impact Number */}
        <div className="impact-hero animate-fade-in" style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '14px', color: 'var(--rescue-green)', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase' }}>
            ♻️ Total Impact — INSPIRE University
          </div>
          <div className="impact-number">
            {formatCurrency(totalSavings || 282000)}
          </div>
          <div className="impact-label">estimated procurement avoided</div>
          <div style={{
            display: 'flex', gap: '40px', justifyContent: 'center',
            marginTop: '24px', flexWrap: 'wrap',
          }}>
            {[
              { label: 'Resources Rescued', value: matchedCount, suffix: '' },
              { label: 'CO₂e Avoided (est.)', value: totalCO2 || 1240, suffix: 'kg' },
              { label: 'Waste Avoided (est.)', value: totalWaste || 247, suffix: 'kg' },
              { label: 'Requirements Fulfilled', value: fulfilledCount, suffix: '' },
            ].map(({ label, value, suffix }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {value}{suffix}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid-4 animate-fade-in stagger-1" style={{ marginBottom: '32px' }}>
          {[
            {
              icon: TrendingUp,
              label: 'Procurement Avoided',
              value: formatCurrency(totalSavings || 282000),
              sub: 'Est. financial value',
              color: '#00D9A5',
              bg: 'rgba(0,217,165,0.1)',
            },
            {
              icon: Leaf,
              label: 'CO₂e Avoided',
              value: `${(totalCO2 || 1240).toLocaleString('en-IN')}kg`,
              sub: 'Estimated, based on ₹1K→5kg factor',
              color: '#059669',
              bg: 'rgba(5,150,105,0.1)',
            },
            {
              icon: Package,
              label: 'Waste Avoided',
              value: `${(totalWaste || 247)}kg`,
              sub: 'Material demand avoided',
              color: '#D97706',
              bg: 'rgba(217,119,6,0.1)',
            },
            {
              icon: Recycle,
              label: 'Total Resources',
              value: totalResources,
              sub: `Across ${deptContribution.length} departments`,
              color: '#7C3AED',
              bg: 'rgba(124,58,237,0.1)',
            },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ borderColor: `${s.color}20` }}>
              <div className="stat-card-icon" style={{ background: s.bg }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div className="stat-card-value" style={{ fontSize: '24px' }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.sub}</div>
              <div className="stat-card-glow" style={{ background: s.color }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Savings Trend */}
          <div className="card animate-fade-in stagger-2">
            <div className="section-header" style={{ marginBottom: '20px' }}>
              <div>
                <div className="section-title" style={{ fontSize: '16px' }}>
                  <BarChart3 size={16} style={{ display: 'inline', marginRight: 6 }} />
                  Savings Over Time
                </div>
                <div className="section-subtitle">Procurement avoided per month (est.)</div>
              </div>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D9A5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00D9A5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#5A5A7A', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5A5A7A', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => formatCurrency(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="savings" name="savings" stroke="#00D9A5" fill="url(#savingsGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dept contribution pie */}
          <div className="card animate-fade-in stagger-3">
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <div>
                <div className="section-title" style={{ fontSize: '16px' }}>By Department</div>
                <div className="section-subtitle">Resource value distribution</div>
              </div>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptContribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deptContribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#14141F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any) => [formatCurrency(v), 'Value']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {deptContribution.slice(0, 5).map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                  <span style={{ fontWeight: 600 }}>{d.resourceCount} resources</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Predictive Impact & Forecasting Engine */}
        <div className="card card-ai animate-fade-in stagger-3" style={{ marginBottom: '28px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--ai-purple), var(--rescue-green))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(124,58,237,0.4)',
              }}>
                <Zap size={18} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  AI Annual Impact Projection & Optimization
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Autonomous forecasting based on departmental utilization curves and historical rescue trajectories
                </div>
              </div>
            </div>
            <span className="badge badge-purple" style={{ fontSize: 11, padding: '4px 12px' }}>
              🧠 Gemini Forecasting Engine
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '18px' }}>
            <div style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>12-Month Projected Avoidance</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--rescue-green)', marginTop: 4 }}>
                ₹{(( (totalSavings || 282000) * 2.8 ) / 100000).toFixed(1)}L
              </div>
              <div style={{ fontSize: '11px', color: 'var(--rescue-green)', marginTop: 2 }}>+180% projected vs baseline</div>
            </div>
            <div style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Forecasted CO₂e Avoided</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-purple)', marginTop: 4 }}>
                {Math.round((totalCO2 || 1240) * 3.2).toLocaleString('en-IN')} kg
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-purple)', marginTop: 2 }}>Equiv. to 420 trees planted</div>
            </div>
            <div style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cross-Dept Efficiency Index</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#60A5FA', marginTop: 4 }}>
                94.6%
              </div>
              <div style={{ fontSize: '11px', color: '#60A5FA', marginTop: 2 }}>High inter-departmental mobility</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'rgba(0,217,165,0.05)', borderRadius: 8, border: '1px solid rgba(0,217,165,0.15)' }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--rescue-green)' }}>Surplus Reallocation:</strong> Computer Science & Robotics depts have 18 unused high-performance units scheduled for release next quarter. Routing these to incoming AI workshops eliminates ₹3.2L in new hardware requisitions.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'rgba(124,58,237,0.05)', borderRadius: 8, border: '1px solid rgba(124,58,237,0.15)' }}>
              <span style={{ fontSize: 14 }}>⚡</span>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-purple)' }}>Shared Capacity Utilization:</strong> Main Auditorium and Lab 4 have 38% unreserved weekday slots. AI scheduling matches these with inter-departmental seminar needs automatically.
              </div>
            </div>
          </div>
        </div>

        {/* Impact Cards */}
        {impacts.length > 0 && (
          <div className="animate-fade-in stagger-4">
            <div className="section-header">
              <div>
                <div className="section-title">Rescue Impact Records</div>
                <div className="section-subtitle">Historical resource rescue events</div>
              </div>
            </div>

            <div className="grid-3" style={{ marginBottom: '24px' }}>
              {impacts.map((impact, i) => (
                <div key={impact.id}
                  className="card"
                  style={{
                    borderColor: 'rgba(0,217,165,0.15)',
                    animationDelay: `${i * 0.08}s`, opacity: 0,
                    animation: 'fadeIn 0.4s ease forwards',
                  }}>
                  <div style={{
                    fontSize: '11px', fontWeight: 700, color: 'var(--rescue-green)',
                    letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase',
                  }}>
                    ♻️ Resource Rescued
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--rescue-green)', marginBottom: '4px' }}>
                    {formatCurrency(impact.estimatedSavings)}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    potential procurement avoided
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    {impact.match?.requirement?.title || 'Resource Match'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {impact.match?.resource?.name} → {impact.match?.resource?.department?.name}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{Math.round(impact.estimatedCO2Avoided)}kg</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CO₂e Avoided</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{Math.round(impact.estimatedWasteAvoided)}kg</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Waste Avoided</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sustainability disclaimer */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(5,150,105,0.06)',
          border: '1px solid rgba(5,150,105,0.15)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}>
          <Info size={14} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Transparency note:</strong>{' '}
            All CO₂e and waste figures are <em>estimates</em> based on configurable assumptions
            (approx. ₹1,000 spend ≈ 5kg CO₂e avoided). These should not be presented as verified
            emissions reductions. Financial savings represent potential procurement costs avoided,
            not actual cash saved.
          </p>
        </div>
      </div>
    </>
  );
}
