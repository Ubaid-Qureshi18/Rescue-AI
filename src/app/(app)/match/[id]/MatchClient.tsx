'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, MapPin, Building2, Star, Zap,
  ArrowRight, Package, Users, TrendingUp, Leaf,
  AlertTriangle, ChevronDown, ChevronUp, Sparkles, HelpCircle,
} from 'lucide-react';
import type { RescuePlan } from '@/lib/matching';

interface Props {
  requirement: any;
  extracted: any;
  rescuePlan: RescuePlan;
  matchResults: any[];
}

const formatCurrency = (val: number) =>
  val >= 100000 ? `₹${(val / 100000).toFixed(2)}L` : `₹${val.toLocaleString('en-IN')}`;

function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1200 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    const frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{prefix}{displayed.toLocaleString('en-IN')}{suffix}</>;
}

export default function MatchClient({ requirement, extracted, rescuePlan, matchResults }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [rescued, setRescued] = useState(requirement.status === 'FULFILLED');
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [isRescuing, setIsRescuing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pct = rescuePlan.requirementFulfillmentPct;
  const savings = rescuePlan.estimatedSavings;
  const estimatedCost = requirement.estimatedCost || 0;
  // "still needed" = cost of the uncovered portion of the requirement
  const remaining = estimatedCost > 0
    ? Math.round(estimatedCost * (1 - pct / 100))
    : 0;

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleRescue = async (matchIdToApprove?: string) => {
    setIsRescuing(true);
    try {
      const resp = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirementId: requirement.id,
          matchId: matchIdToApprove,
        }),
      });

      const data = await resp.json();

      if (data.success) {
        setRescued(true);
        setToastMessage(`🎉 Rescued ${data.approvedMatchesCount} resource(s)! Impact saved to database.`);
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        alert(data.error || 'Failed to complete reservation');
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsRescuing(false);
    }
  };

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="topbar-title">AI Match Results</h1>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {requirement.title}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => window.print()}
            title="Print or Save PDF of Rescue Plan"
          >
            🖨️ Export Plan
          </button>
          <span className={`badge ${rescued ? 'badge-green' : 'badge-purple'}`}>
            <CheckCircle2 size={10} />
            {rescued ? 'FULFILLED IN DATABASE' : `${matchResults.length} resources found`}
          </span>
        </div>
      </header>

      <div className="page-container">
        {toastMessage && (
          <div className="toast toast-success" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
            <Sparkles size={16} color="var(--rescue-green)" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* THE MONEY SHOT */}
        {!rescued ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(14,14,26,0.9), rgba(14,14,26,0.9))',
            border: '1px solid var(--border-subtle)',
            borderRadius: '24px',
            padding: '48px',
            textAlign: 'center',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: revealed
                ? 'radial-gradient(ellipse at 50% 50%, rgba(0, 217, 165, 0.08) 0%, transparent 70%)'
                : 'radial-gradient(ellipse at 50% 50%, rgba(239, 68, 68, 0.06) 0%, transparent 70%)',
              transition: 'background 1s ease',
              pointerEvents: 'none',
            }} />

            {!revealed ? (
              <div className="animate-fade-in">
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Estimated purchase cost
                </div>
                <div style={{ fontSize: '64px', fontWeight: 900, color: '#F87171', letterSpacing: '-2px' }}>
                  {formatCurrency(estimatedCost)}
                </div>
                <div style={{ fontSize: '16px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  would be required if purchasing new
                </div>
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                  <div className="loading-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                </div>
              </div>
            ) : (
              <div className="animate-fade-in-scale">
                <div style={{ fontSize: '18px', color: 'var(--text-muted)', textDecoration: 'line-through', marginBottom: '8px', opacity: 0.6 }}>
                  Estimated purchase: {formatCurrency(estimatedCost)}
                </div>

                {pct === 100 ? (
                  <>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--rescue-green)', marginBottom: '8px', letterSpacing: '1px' }}>
                      ♻️ RESCUE FOUND A WAY
                    </div>
                    <div style={{
                      fontSize: '72px', fontWeight: 900, letterSpacing: '-3px', lineHeight: '1', marginBottom: '8px',
                      background: 'linear-gradient(135deg, #00D9A5, #00b8a5)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                      <AnimatedNumber value={savings} prefix="₹" />
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
                      potential procurement avoided
                    </div>
                    <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Resources Found', value: matchResults.length, icon: Package },
                        { label: 'Departments Connected', value: new Set(matchResults.map(m => m.resource.departmentId)).size, icon: Building2 },
                        { label: 'Requirement Fulfilled', value: `${pct}%`, icon: CheckCircle2 },
                        { label: 'New Equipment Needed', value: '0', icon: Star },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', marginBottom: '4px' }}>
                            <Icon size={14} color="var(--rescue-green)" />
                          </div>
                          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '24px', maxWidth: '500px' }}>
                      &quot;We found existing resources that satisfy 100% of your requirement.
                      No new purchase is necessary.&quot;
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#FCD34D', marginBottom: '8px' }}>
                      ⚡ PARTIAL RESCUE — {pct}% Covered
                    </div>
                    <div style={{
                      fontSize: '56px', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, marginBottom: '8px',
                      background: 'linear-gradient(135deg, #00D9A5, #FCD34D)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                      <AnimatedNumber value={savings} prefix="₹" />
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      saved · Only {formatCurrency(remaining)} still needed
                    </div>
                  </>
                )}

                <button
                  className="btn btn-rescue btn-lg"
                  onClick={() => handleRescue()}
                  disabled={isRescuing}
                  style={{ fontSize: '16px', padding: '16px 40px' }}
                >
                  {isRescuing ? (
                    <>
                      <div className="loading-spinner" />
                      Reserving in database...
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      RESCUE & RESERVE RESOURCES
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="impact-hero animate-fade-in-scale" style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>♻️</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--rescue-green)', marginBottom: '8px', letterSpacing: '1px' }}>
              RESCUE COMPLETE & RESERVED IN DATABASE
            </div>
            <div className="impact-number" style={{ marginBottom: '16px' }}>
              {formatCurrency(savings)}
            </div>
            <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
              {[
                { label: 'Resources Rescued', value: matchResults.length, color: 'var(--rescue-green)' },
                { label: 'Procurement Avoided', value: formatCurrency(savings), color: 'var(--rescue-green)' },
                { label: 'Departments Connected', value: new Set(matchResults.map(m => m.resource.departmentId)).size, color: 'var(--ai-purple)' },
                { label: 'CO₂e Avoided (est.)', value: `${rescuePlan.estimatedCO2Avoided}kg`, color: '#059669' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link href="/requests" className="btn btn-secondary">
                View Requests <ArrowRight size={14} />
              </Link>
              <Link href="/impact" className="btn btn-secondary">
                View Impact <TrendingUp size={14} />
              </Link>
              <Link href="/needs/new" className="btn btn-primary">
                <Zap size={14} />
                New Search
              </Link>
            </div>
          </div>
        )}

        {/* Rescue Plan Bundles */}
        {rescuePlan.resourceBundles.length > 0 && (
          <div className="card card-rescue" style={{ marginBottom: '32px', padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Sparkles size={16} color="var(--rescue-green)" />
                <span style={{ fontSize: '16px', fontWeight: 700 }}>Rescue Plan</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {rescuePlan.summary}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {rescuePlan.resourceBundles.map((bundle, i) => (
                <div key={i} style={{
                  padding: '16px',
                  background: bundle.covered ? 'rgba(0,217,165,0.06)' : 'rgba(217,119,6,0.06)',
                  border: `1px solid ${bundle.covered ? 'rgba(0,217,165,0.2)' : 'rgba(217,119,6,0.2)'}`,
                  borderRadius: '10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{bundle.resourceType}</div>
                    {bundle.covered
                      ? <CheckCircle2 size={16} color="var(--rescue-green)" />
                      : <AlertTriangle size={16} color="#FCD34D" />}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: bundle.covered ? 'var(--rescue-green)' : '#FCD34D', marginBottom: '4px' }}>
                    {bundle.found}/{bundle.needed}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {bundle.covered ? '✓ Fully covered' : `${bundle.needed - bundle.found} still needed`}
                  </div>
                  {bundle.sources.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {bundle.sources.map((s, j) => (
                        <div key={j}>• {s.quantity} from {s.departmentName}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternatives section */}
        {rescuePlan.alternatives && rescuePlan.alternatives.length > 0 && (
          <div className="card" style={{ marginBottom: '32px', padding: '20px', borderColor: 'rgba(124, 58, 237, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <HelpCircle size={16} color="var(--text-purple)" />
              <span style={{ fontSize: '15px', fontWeight: 700 }}>AI Alternative Resource Suggestions</span>
            </div>
            {rescuePlan.alternatives.map((alt, i) => (
              <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '6px' }}>
                Instead of <strong>{alt.originalRequested}</strong>, consider <strong>{alt.suggestedResource}</strong> ({alt.availableQuantity} available at {alt.departmentName}).
              </div>
            ))}
          </div>
        )}

        {/* Match Cards */}
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Matched Resources</div>
              <div className="section-subtitle">{matchResults.length} resources found across INSPIRE University</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {matchResults.map((match, i) => {
              const isExpanded = expandedMatch === (match.matchId || match.resource.id);
              const isTop = i === 0;
              const dept = match.resource.department;

              return (
                <div key={match.matchId ? `match-${match.matchId}` : `${match.resource.id}-${i}`} className={`match-card ${isTop ? 'top-match' : ''} animate-fade-in`}>
                  {isTop && (
                    <div className="rescue-badge" style={{ marginBottom: '12px', width: 'fit-content' }}>
                      <Star size={10} />
                      TOP MATCH
                    </div>
                  )}

                  <div className="match-card-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>
                        {match.resource.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <MapPin size={11} />
                          {match.resource.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <Building2 size={11} />
                          {dept.name}
                        </span>
                        <span className={`badge ${match.resource.condition === 'Excellent' ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: '10px' }}>
                          {match.resource.condition}
                        </span>
                      </div>

                      {match.reason && (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                          {match.reason}
                        </p>
                      )}
                    </div>

                    <div className="match-card-score">
                      <div className="match-score-number">{Math.round(match.matchScore)}</div>
                      <div className="match-score-label">% Match</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--rescue-green)' }}>{match.quantityMatched}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Available</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700 }}>
                        ₹{(match.resource.estimatedValue || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Unit Value</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#FCD34D' }}>
                        ₹{((match.resource.estimatedValue || 0) * match.quantityMatched).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Value Rescued</div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => setExpandedMatch(isExpanded ? null : (match.matchId || match.resource.id))}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? 'Less' : 'Score breakdown'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="animate-fade-in" style={{ marginTop: '12px' }}>
                      <div className="match-score-bars">
                        {[
                          { label: 'Availability', value: match.availabilityScore, weight: '30%' },
                          { label: 'Compatibility', value: match.compatibilityScore, weight: '25%' },
                          { label: 'Quantity', value: match.quantityScore, weight: '15%' },
                          { label: 'Location', value: match.locationScore, weight: '10%' },
                          { label: 'Condition', value: match.conditionScore, weight: '10%' },
                          { label: 'Cost Benefit', value: match.costBenefitScore, weight: '10%' },
                        ].map(({ label, value, weight }) => (
                          <div key={label} className="match-score-bar-item">
                            <span style={{ width: '100px', flexShrink: 0 }}>{label}</span>
                            <span style={{ width: '32px', color: 'var(--text-muted)', fontSize: '10px' }}>{weight}</span>
                            <div className="progress-bar" style={{ flex: 1 }}>
                              <div className="progress-bar-fill green" style={{ width: `${value}%` }} />
                            </div>
                            <span className="score-pct">{Math.round(value)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!rescued && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleRescue(match.matchId || match.id)} disabled={isRescuing}>
                        <Zap size={12} />
                        Reserve This Asset
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
