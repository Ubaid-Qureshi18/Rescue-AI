'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, Clock, XCircle, ChevronRight,
  MapPin, Building2, Zap, Eye, Package, Sparkles,
} from 'lucide-react';

const STATUS_INFO: Record<string, { label: string; badge: string; icon: any }> = {
  PENDING: { label: 'Pending', badge: 'badge-muted', icon: Clock },
  MATCHED: { label: 'Matched', badge: 'badge-amber', icon: ChevronRight },
  FULFILLED: { label: 'Fulfilled', badge: 'badge-green', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', badge: 'badge-red', icon: XCircle },
};

const formatCurrency = (val: number) =>
  val >= 100000 ? `₹${(val / 100000).toFixed(2)}L` : `₹${val.toLocaleString('en-IN')}`;

export default function RequestsClient({ requirements }: { requirements: any[] }) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'matched' | 'fulfilled'>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleApproveRequirement = async (reqId: string) => {
    setApprovingId(reqId);
    try {
      const resp = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementId: reqId }),
      });
      const data = await resp.json();
      if (data.success) {
        setToast(`🎉 Approved requirement and committed ${data.approvedMatchesCount} reservation(s) to SQLite database!`);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        alert(data.error || 'Approval failed');
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  const filtered = requirements.filter(r => {
    if (activeTab === 'all') return true;
    return r.status.toLowerCase() === activeTab;
  });

  return (
    <>
      <header className="topbar">
        <h1 className="topbar-title">Requests</h1>
        <div className="topbar-actions">
          <Link href="/needs/new" className="btn btn-primary btn-sm">
            <Zap size={14} />
            New Request
          </Link>
        </div>
      </header>

      <div className="page-container">
        {toast && (
          <div className="toast toast-success" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
            <Sparkles size={16} color="var(--rescue-green)" />
            <span>{toast}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs animate-fade-in" style={{ marginBottom: '24px' }}>
          {[
            { key: 'all', label: 'All', count: requirements.length },
            { key: 'pending', label: 'Pending', count: requirements.filter(r => r.status === 'PENDING').length },
            { key: 'matched', label: 'Matched', count: requirements.filter(r => r.status === 'MATCHED').length },
            { key: 'fulfilled', label: 'Fulfilled', count: requirements.filter(r => r.status === 'FULFILLED').length },
          ].map(({ key, label, count }) => (
            <button key={key}
              className={`tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key as any)}>
              {label} {count > 0 && (
                <span style={{
                  marginLeft: '4px',
                  background: activeTab === key ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                  borderRadius: '999px',
                  padding: '0 6px',
                  fontSize: '11px',
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No requests here</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
              Create a new resource requirement to get started.
            </p>
            <Link href="/needs/new" className="btn btn-primary" style={{ marginTop: '16px' }}>
              <Zap size={14} />
              Find Resources
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map((req, i) => {
              const statusInfo = STATUS_INFO[req.status] || STATUS_INFO.PENDING;
              const StatusIcon = statusInfo.icon;
              const topMatch = req.matches?.[0];
              const totalSaved = req.matches?.reduce((s: number, m: any) =>
                s + (m.impact?.estimatedSavings || 0), 0) || 0;

              return (
                <div key={req.id} className="card card-hover animate-fade-in">
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '10px',
                      background: req.status === 'FULFILLED' ? 'rgba(0,217,165,0.12)' :
                        req.status === 'MATCHED' ? 'rgba(217,119,6,0.12)' : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <StatusIcon size={18}
                        color={req.status === 'FULFILLED' ? 'var(--rescue-green)' :
                          req.status === 'MATCHED' ? '#FCD34D' : 'var(--text-muted)'} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{req.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            {req.user?.name || 'Faculty Requester'} · {new Date(req.createdAt).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                        <span className={`badge ${statusInfo.badge}`} style={{ flexShrink: 0 }}>
                          {statusInfo.label}
                        </span>
                      </div>

                      {req.structuredData && (() => {
                        try {
                          const data = JSON.parse(req.structuredData);
                          const items = Object.entries(data)
                            .filter(([k, v]) => ['laptops', 'projectors', 'chairs', 'tables', 'microphones', 'arduinoKits', 'rooms', 'classrooms'].includes(k) && v)
                            .slice(0, 4);
                          return items.length > 0 ? (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                              {items.map(([k, v]) => (
                                <span key={k} className="badge badge-muted" style={{ fontSize: '11px' }}>
                                  {String(v)} {k.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                </span>
                              ))}
                            </div>
                          ) : null;
                        } catch { return null; }
                      })()}

                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {req.estimatedCost > 0 && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Purchase cost: <strong style={{ color: '#F87171' }}>{formatCurrency(req.estimatedCost)}</strong>
                          </div>
                        )}
                        {totalSaved > 0 && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Rescued: <strong style={{ color: 'var(--rescue-green)' }}>{formatCurrency(totalSaved)}</strong>
                          </div>
                        )}
                        {req.matches?.length > 0 && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            <Package size={11} style={{ display: 'inline', marginRight: 4 }} />
                            {req.matches.length} resource{req.matches.length !== 1 ? 's' : ''} matched
                          </div>
                        )}
                      </div>

                      {topMatch && (
                        <div style={{
                          marginTop: '12px',
                          padding: '10px 12px',
                          background: 'var(--bg-elevated)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--rescue-green)', flexShrink: 0 }} />
                          <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Top match: <strong>{topMatch.resource?.name}</strong>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {' '}at {topMatch.resource?.location} — {Math.round(topMatch.matchScore)}% match
                            </span>
                          </div>
                          <span className={`badge ${topMatch.status === 'APPROVED' ? 'badge-green' : topMatch.status === 'REJECTED' ? 'badge-red' : 'badge-muted'}`}
                            style={{ fontSize: '10px' }}>
                            {topMatch.status}
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                      <Link href={`/match/${req.id}`} className="btn btn-secondary btn-sm">
                        <Eye size={12} />
                        View Matches
                      </Link>
                      {req.status === 'MATCHED' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApproveRequirement(req.id)}
                          disabled={approvingId === req.id}
                        >
                          <CheckCircle2 size={12} />
                          {approvingId === req.id ? 'Approving...' : 'Approve & Reserve'}
                        </button>
                      )}
                    </div>
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
