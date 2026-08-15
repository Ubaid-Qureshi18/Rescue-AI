'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, Clock, XCircle, ChevronRight,
  MapPin, Building2, Zap, Eye, Package, Sparkles, FileText, X, Download, ShieldCheck
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

  // AI MoU Modal state
  const [selectedMoUReq, setSelectedMoUReq] = useState<any | null>(null);
  const [mouData, setMouData] = useState<any | null>(null);
  const [isGeneratingMoU, setIsGeneratingMoU] = useState(false);

  const handleGenerateMoU = async (req: any) => {
    setSelectedMoUReq(req);
    setMouData(null);
    setIsGeneratingMoU(true);
    try {
      const topMatch = req.matches?.[0];
      const resp = await fetch('/api/ai/mou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceName: topMatch?.resource?.name || req.title,
          requesterName: req.user?.name || 'Authorized Requester',
          requesterDept: req.user?.department?.name || 'Academics Department',
          ownerDept: topMatch?.resource?.department?.name || 'Resource Facility',
          quantity: topMatch?.quantityMatched || 1,
          neededFrom: req.neededFrom,
          neededUntil: req.neededUntil,
          estimatedSavings: req.matches?.reduce((s: number, m: any) => s + (m.impact?.estimatedSavings || 0), 0) || req.estimatedCost || 50000,
          reason: req.description || req.title,
        }),
      });
      const data = await resp.json();
      setMouData(data.mou);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingMoU(false);
    }
  };

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
            {filtered.map((req) => {
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
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--text-purple)', border: '1px solid rgba(124,58,237,0.25)', fontSize: 11 }}
                        onClick={() => handleGenerateMoU(req)}
                      >
                        <FileText size={12} /> AI Transfer MoU
                      </button>
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

      {/* ============================================================
          AI MoU AGREEMENT MODAL
          ============================================================ */}
      {selectedMoUReq && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          backdropFilter: 'blur(12px)', padding: 20,
        }} onClick={() => setSelectedMoUReq(null)}>
          <div className="card card-ai animate-fade-in-scale" style={{ width: 620, maxHeight: '85vh', overflowY: 'auto', padding: 32, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setSelectedMoUReq(null)}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--rescue-green), var(--ai-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>Institutional Inter-Departmental MoU</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI-generated formal resource custody & ESG agreement</p>
              </div>
            </div>

            {isGeneratingMoU ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="loading-spinner" style={{ width: 28, height: 28, margin: '0 auto 16px' }} />
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Gemini AI is structuring transfer terms & compliance protocols...</p>
              </div>
            ) : mouData ? (
              <div>
                <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 16, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Protocol Reference:</div>
                    <strong style={{ fontSize: 13, color: 'var(--rescue-green)' }}>{mouData.referenceNumber}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Effective Date:</div>
                    <strong style={{ fontSize: 12 }}>{mouData.effectiveDate}</strong>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.4px' }}>Parties & Asset Scope</h4>
                  <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 8, fontSize: 13, lineHeight: 1.6 }}>
                    <div>• <strong>Lending Facility:</strong> {mouData.parties?.lenderDepartment}</div>
                    <div>• <strong>Borrower Unit:</strong> {mouData.parties?.borrowerDepartment} ({mouData.parties?.requester})</div>
                    <div>• <strong>Asset & Quantity:</strong> {mouData.assetDetails?.item} ({mouData.assetDetails?.quantity} units)</div>
                    <div>• <strong>Estimated Savings:</strong> <span style={{ color: 'var(--rescue-green)', fontWeight: 700 }}>{mouData.assetDetails?.estimatedProcurementAvoided}</span></div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.4px' }}>Compliance Terms</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {mouData.termsAndConditions?.map((term: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 6 }}>
                        <span style={{ color: 'var(--rescue-green)', fontWeight: 700 }}>{i + 1}.</span>
                        <span>{term}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setSelectedMoUReq(null)}>Close</button>
                  <button className="btn btn-rescue" onClick={() => window.print()}>
                    <Download size={14} /> Print / Export Signed MoU
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Unable to load MoU protocol.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
