'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Zap, Edit3, ChevronRight, AlertTriangle,
  CheckCircle2, TrendingUp, Brain, ShieldAlert, Mic, MicOff,
} from 'lucide-react';

const EXAMPLES = [
  { icon: '🚀', label: 'AI Hackathon Setup', text: 'Need 20 Dell laptops, 2 4K projectors, 50 ergonomic chairs and Smart Classroom 101 for an AI Hackathon with 40 developers.' },
  { icon: '🤖', label: 'Robotics Challenge', text: 'We need 25 Arduino Mega kits, 10 Raspberry Pi 5 boards, soldering workbenches and the Robotics Prototyping Hall for a 2-day competition.' },
  { icon: '🧬', label: 'Genomics Lab Workshop', text: 'Need 2 refrigerated microcentrifuges, 1 NanoDrop spectrophotometer and the Biotech Cleanroom for a molecular genetics practical session.' },
  { icon: '🎙️', label: 'Media & Spatial Audio', text: 'Need 6 Meta Quest 3 VR headsets, 2 RodeCaster Pro podcast rigs, 4 studio light panels and the soundproof green screen studio for 25 students.' },
  { icon: '📊', label: 'Campus Symposium', text: 'Symposium needs 100 folding chairs, 2 4K laser projectors, 4 wireless microphones, conference tables and the 180-seat Grand Auditorium.' },
];

const RISK_CONFIG = {
  LOW: { color: '#00D9A5', bg: 'rgba(0,217,165,0.06)', border: 'rgba(0,217,165,0.2)', icon: CheckCircle2, label: 'Low Procurement Risk' },
  MEDIUM: { color: '#FCD34D', bg: 'rgba(252,211,77,0.06)', border: 'rgba(252,211,77,0.2)', icon: AlertTriangle, label: 'Partial Coverage Likely' },
  HIGH: { color: '#F87171', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', icon: ShieldAlert, label: 'High Procurement Risk' },
};

export default function CreateNeedPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const [needDate, setNeedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'input' | 'extracted' | 'creating'>('input');
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const toggleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is supported in modern browsers like Chrome, Edge, and Safari.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleExtract = async () => {
    if (!input.trim()) return;
    setIsExtracting(true);
    setRiskAnalysis(null);
    try {
      const resp = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = await resp.json();
      setExtracted(data.extracted);
      setStep('extracted');

      // Run risk analysis in background immediately
      setIsAnalyzing(true);
      try {
        const riskResp = await fetch('/api/ai/analyze-need', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: data.extracted?.title || input, extractedRequirement: data.extracted }),
        });
        const riskData = await riskResp.json();
        setRiskAnalysis(riskData);
      } catch (e) {
        console.error('Risk analysis failed:', e);
      } finally {
        setIsAnalyzing(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFindResources = async () => {
    if (!extracted) return;
    setIsCreating(true);
    setStep('creating');
    try {
      const resp = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawInput: input,
          extracted,
          needDate,
          userId: 'user-req',
        }),
      });
      const data = await resp.json();
      if (data.requirementId) {
        router.push(`/match/${data.requirementId}`);
      }
    } catch (e) {
      console.error(e);
      setIsCreating(false);
      setStep('extracted');
    }
  };

  const resourceItems = extracted ? Object.entries(extracted)
    .filter(([k, v]) => ['laptops', 'projectors', 'chairs', 'tables', 'microphones', 'cameras', 'arduinoKits', 'rooms', 'classrooms'].includes(k) && v)
    .map(([k, v]) => ({ key: k, label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()), value: v as number }))
    : [];

  const riskCfg = riskAnalysis ? RISK_CONFIG[riskAnalysis.riskLevel as keyof typeof RISK_CONFIG] || RISK_CONFIG.MEDIUM : null;

  return (
    <>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="topbar-title">Find Resources</h1>
          <span className="badge badge-purple">
            <Sparkles size={10} />
            AI-Powered
          </span>
        </div>
        <div className="steps">
          {['Describe Need', 'AI Extracts', 'Find Matches'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className={`step ${(step === 'input' && i === 0) || (step === 'extracted' && i === 1) || (step === 'creating' && i === 2) ? 'active' : (
                (step === 'extracted' && i === 0) || (step === 'creating' && i <= 1) ? 'completed' : ''
              )}`}>
                <div className="step-number">{i + 1}</div>
                <span style={{ fontSize: 12 }}>{s}</span>
              </div>
              {i < 2 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </header>

      <div className="page-container" style={{ maxWidth: 800, margin: '0 auto' }}>
        {step === 'input' && (
          <div className="animate-fade-in-scale">
            <div className="page-header" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
              <h1 className="page-title" style={{ fontSize: 32 }}>What do you need?</h1>
              <p className="page-subtitle" style={{ maxWidth: 500, margin: '8px auto 0' }}>
                Describe your requirements in plain English. RESCUE AI will understand your need
                and search all departmental resources before suggesting any purchase.
              </p>
            </div>

            <div className="card card-rescue" style={{ padding: 32, marginBottom: 24 }}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="form-label" style={{ margin: 0 }}>Describe your requirement</label>
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
                      padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                      background: isListening ? 'rgba(239,68,68,0.2)' : 'rgba(124,58,237,0.12)',
                      color: isListening ? '#F87171' : 'var(--text-purple)',
                      border: isListening ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(124,58,237,0.25)',
                    }}
                  >
                    {isListening ? (
                      <><MicOff size={12} className="animate-pulse" /> Listening... (Click to stop)</>
                    ) : (
                      <><Mic size={12} /> 🎙️ Voice Dictate</>
                    )}
                  </button>
                </div>
                <textarea
                  className="input textarea"
                  style={{ minHeight: 140, fontSize: 15, lineHeight: 1.7 }}
                  placeholder="e.g. I need 20 laptops, a projector, 30 chairs and a classroom for a 4-hour AI workshop with 30 participants next Friday."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">When do you need it?</label>
                <input type="date" className="input" value={needDate}
                  onChange={e => setNeedDate(e.target.value)}
                  style={{ width: 'auto' }} />
              </div>

              <button
                className="btn btn-rescue w-full"
                style={{ justifyContent: 'center', fontSize: 16, padding: 16 }}
                onClick={handleExtract}
                disabled={!input.trim() || isExtracting}
              >
                {isExtracting ? (
                  <>
                    <div className="loading-spinner" style={{ width: 18, height: 18 }} />
                    AI is understanding your need...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Extract Requirements with AI
                  </>
                )}
              </button>
            </div>

            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Try an example
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 10 }}>
                {EXAMPLES.map((ex, i) => (
                  <button key={i}
                    className="card card-hover"
                    style={{ padding: '14px 16px', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
                    onClick={() => setInput(ex.text)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>{ex.icon}</span>
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{ex.label}</strong>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--rescue-green)', fontWeight: 700 }}>1-Click Try →</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                      {ex.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(step === 'extracted' || step === 'creating') && extracted && (
          <div className="animate-fade-in-scale">
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>AI Understood Your Need</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Review the extracted requirements, then let RESCUE search all departments.
              </p>
            </div>

            {/* AI Risk Analyzer Banner */}
            {(isAnalyzing || riskAnalysis) && (
              <div className="animate-fade-in" style={{ marginBottom: 20 }}>
                {isAnalyzing ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                    background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)',
                    borderRadius: 12,
                  }}>
                    <Brain size={16} color="var(--ai-purple)" />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>AI is analyzing procurement risk against current inventory...</span>
                    <div className="loading-spinner" style={{ width: 14, height: 14, marginLeft: 'auto' }} />
                  </div>
                ) : riskAnalysis && riskCfg ? (
                  <div style={{
                    padding: '16px 20px',
                    background: riskCfg.bg,
                    border: `1px solid ${riskCfg.border}`,
                    borderRadius: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <riskCfg.icon size={16} color={riskCfg.color} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: riskCfg.color }}>{riskCfg.label}</span>
                      <span style={{
                        marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                        background: `${riskCfg.color}20`, color: riskCfg.color,
                        padding: '2px 8px', borderRadius: 20,
                      }}>
                        {riskAnalysis.riskScore}% purchase probability
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
                      {riskAnalysis.headline}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8 }}>
                      {riskAnalysis.reasoning}
                    </p>
                    {riskAnalysis.suggestions && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {riskAnalysis.suggestions.map((s: string, i: number) => (
                          <span key={i} style={{
                            fontSize: 11, padding: '3px 10px', borderRadius: 20,
                            background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                          }}>
                            💡 {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Original Input */}
            <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>
                Original Request
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                &quot;{input}&quot;
              </p>
            </div>

            {/* Extracted Title */}
            <div className="card card-rescue" style={{ padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
                    Requirement Title
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{extracted.title || 'Resource Requirement'}</div>
                </div>
                <span className="badge badge-green">
                  <Sparkles size={10} />
                  AI Extracted
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                {resourceItems.map(({ key, label, value }) => (
                  <div key={key} style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10, padding: '12px 16px',
                  }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--rescue-green)' }}>{value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
                {extracted.participants && (
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 16px' }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ai-purple)' }}>{extracted.participants}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Participants</div>
                  </div>
                )}
                {extracted.duration && (
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 16px' }}>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{extracted.duration}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Duration</div>
                  </div>
                )}
                {extracted.otherItems?.map((item: any, i: number) => (
                  <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 16px' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#FCD34D' }}>{item.quantity}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.name}</div>
                  </div>
                ))}
              </div>

              {extracted.estimatedCost && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: 8, marginBottom: 16,
                }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    ⚠️ Estimated new purchase cost
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#F87171' }}>
                    ₹{extracted.estimatedCost.toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setStep('input')}
                  disabled={isCreating}
                >
                  <Edit3 size={14} />
                  Edit Input
                </button>
                <button
                  className="btn btn-rescue"
                  style={{ flex: 1, justifyContent: 'center', fontSize: 15 }}
                  onClick={handleFindResources}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <div className="loading-spinner" />
                      RESCUE is searching...
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      FIND EXISTING RESOURCES
                    </>
                  )}
                </button>
              </div>
            </div>

            {step === 'creating' && (
              <div className="card card-rescue" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div className="loading-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                  🔍 AI is searching all departments...
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  Analyzing resources across all departments for compatibility
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                  {['Electronics', 'Furniture', 'Spaces', 'Equipment', 'Materials'].map(cat => (
                    <span key={cat} className="badge badge-muted" style={{ fontSize: 11 }}>
                      🔎 {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
