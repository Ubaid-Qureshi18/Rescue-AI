'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Zap, Clock, CheckCircle2, AlertCircle, ArrowRight,
  ClipboardList, Building2, Calendar, TrendingUp,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: any; color: string }> = {
  PENDING: { label: 'Searching', badge: 'badge-amber', icon: Clock, color: '#FCD34D' },
  MATCHED: { label: 'Matched', badge: 'badge-blue', icon: CheckCircle2, color: '#60A5FA' },
  FULFILLED: { label: 'Fulfilled ✓', badge: 'badge-green', icon: CheckCircle2, color: '#00D9A5' },
  REJECTED: { label: 'No Match', badge: 'badge-red', icon: AlertCircle, color: '#F87171' },
};

const formatCurrency = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}K`;

export default function NeedsClient({ requirements }: { requirements: any[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() =>
    requirements.filter(r => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    }),
    [requirements, search, statusFilter]
  );

  const stats = useMemo(() => ({
    total: requirements.length,
    fulfilled: requirements.filter(r => r.status === 'FULFILLED').length,
    pending: requirements.filter(r => r.status === 'PENDING').length,
    totalSavings: requirements.reduce((s, r) =>
      s + r.matches.reduce((ms: number, m: any) => ms + (m.impact?.estimatedSavings || 0), 0), 0),
  }), [requirements]);

  return (
    <>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="topbar-title">Needs History</h1>
          <span className="badge badge-muted">{requirements.length} total</span>
        </div>
        <Link href="/needs/new" className="btn btn-primary btn-sm">
          <Zap size={14} />
          New Search
        </Link>
      </header>

      <div className="page-container">
        {/* Stats Strip */}
        <div className="animate-fade-in" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28,
        }}>
          {[
            { label: 'Total Searches', value: stats.total, color: '#7C3AED', icon: ClipboardList },
            { label: 'Fully Fulfilled', value: stats.fulfilled, color: '#00D9A5', icon: CheckCircle2 },
            { label: 'Awaiting Match', value: stats.pending, color: '#FCD34D', icon: Clock },
            { label: 'Savings Generated', value: formatCurrency(stats.totalSavings || 0), color: '#2563EB', icon: TrendingUp },
          ].map((s, i) => (
            <div key={i} className="card" style={{ borderColor: `${s.color}20`, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={16} color={s.color} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="animate-fade-in stagger-1" style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
            <Search size={15} className="search-bar-icon" />
            <input
              className="input"
              placeholder="Search requirements..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="tabs">
            {[
              { value: '', label: 'All' },
              { value: 'FULFILLED', label: 'Fulfilled' },
              { value: 'MATCHED', label: 'Matched' },
              { value: 'PENDING', label: 'Pending' },
            ].map(t => (
              <button
                key={t.value}
                className={`tab ${statusFilter === t.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requirements List */}
        {filtered.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No requirements found</div>
            <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
              {requirements.length === 0
                ? 'Start by searching for resources you need.'
                : 'Try adjusting your search or filter.'}
            </p>
            {requirements.length === 0 && (
              <Link href="/needs/new" className="btn btn-rescue" style={{ marginTop: 16 }}>
                <Zap size={16} /> Find Resources Now
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((req, i) => {
              const config = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = config.icon;
              const savings = req.matches.reduce((s: number, m: any) => s + (m.impact?.estimatedSavings || 0), 0);
              const topMatch = req.matches[0];

              return (
                <div
                  key={req.id}
                  className="card card-hover animate-fade-in"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    {/* Status indicator */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${config.color}15`, border: `1px solid ${config.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 2,
                    }}>
                      <StatusIcon size={18} color={config.color} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{req.title}</div>
                        <span className={`badge ${config.badge}`} style={{ fontSize: 10 }}>
                          {config.label}
                        </span>
                        {savings > 0 && (
                          <span className="badge badge-green" style={{ fontSize: 10 }}>
                            <TrendingUp size={9} /> {formatCurrency(savings)} saved
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} />
                          {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {req.user && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Building2 size={11} /> {req.user.name}
                          </span>
                        )}
                        {req.matches.length > 0 && (
                          <span>{req.matches.length} resource{req.matches.length !== 1 ? 's' : ''} matched</span>
                        )}
                      </div>

                      {/* Top match preview */}
                      {topMatch && (
                        <div style={{
                          marginTop: 10, padding: '8px 12px',
                          background: 'var(--bg-elevated)', borderRadius: 8,
                          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                        }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: topMatch.resource?.department?.color || '#00D9A5',
                            flexShrink: 0,
                          }} />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            Top match: <strong>{topMatch.resource?.name}</strong> from {topMatch.resource?.department?.name}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--rescue-green)', fontWeight: 700 }}>
                            {Math.round(topMatch.matchScore)}% match
                          </span>
                        </div>
                      )}
                    </div>

                    <Link href={`/match/${req.id}`} className="btn btn-secondary btn-sm" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                      View <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
