'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Plus, Upload, Filter, Package, MapPin, Zap, X,
  Laptop, Presentation, Armchair, FlaskConical, Wrench, CheckCircle,
  Building2, Brain, Sparkles, Heart, LayoutGrid, List as ListIcon,
  CheckCircle2, ArrowRight, DollarSign, Tag, Info,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  Electronics: Laptop,
  Furniture: Armchair,
  Space: FlaskConical,
  Capacity: Wrench,
  Material: Package,
};

const CONDITION_COLORS: Record<string, string> = {
  Excellent: 'badge-green',
  Good: 'badge-blue',
  Fair: 'badge-amber',
  Poor: 'badge-red',
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'badge-green',
  RESERVED: 'badge-amber',
  UNAVAILABLE: 'badge-red',
  MAINTENANCE: 'badge-muted',
};

const formatCurrency = (val: number) => {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
};

function getHealthScore(resource: any): { score: number; label: string; barClass: string } {
  let score = 100;
  if (resource.condition === 'Fair') score -= 25;
  if (resource.condition === 'Poor') score -= 50;
  if (resource.status === 'RESERVED') score -= 10;
  if (resource.status === 'UNAVAILABLE') score -= 30;
  if (resource.status === 'MAINTENANCE') score -= 40;
  score = Math.max(10, Math.min(100, score));
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor';
  const barClass = score >= 80 ? 'health-excellent' : score >= 60 ? 'health-good' : score >= 40 ? 'health-fair' : 'health-poor';
  return { score, label, barClass };
}

export default function ResourcesClient({ resources, departments }: { resources: any[]; departments: any[] }) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('AVAILABLE');
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  // List Resource Modal State
  const [showListModal, setShowListModal] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Electronics',
    quantity: 1,
    condition: 'Good',
    location: 'Main Block, Floor 2',
    departmentId: departments[0]?.id || 'dept-ce',
    estimatedValue: 25000,
    description: '',
    tags: '',
  });
  const [isSubmittingResource, setIsSubmittingResource] = useState(false);
  const [listSuccessMsg, setListSuccessMsg] = useState<string | null>(null);

  // Quick match modal
  const [quickMatchResource, setQuickMatchResource] = useState<any | null>(null);
  const [quickMatchDesc, setQuickMatchDesc] = useState('');
  const [isQuickMatching, setIsQuickMatching] = useState(false);

  // CSV Modal State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set(resources.map(r => r.category))), [resources]);

  const filtered = useMemo(() => {
    return resources.filter(r => {
      const q = search.toLowerCase();
      if (search && !r.name.toLowerCase().includes(q) &&
        !r.description.toLowerCase().includes(q) &&
        !r.tags.toLowerCase().includes(q) &&
        !r.department.name.toLowerCase().includes(q)) return false;
      if (categoryFilter && r.category !== categoryFilter) return false;
      if (deptFilter && r.departmentId !== deptFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    });
  }, [resources, search, categoryFilter, deptFilter, statusFilter]);

  const handleAiAutoFill = async () => {
    if (!aiPromptInput.trim()) return;
    setIsAutoFilling(true);
    try {
      const resp = await fetch('/api/ai/autofill-resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: aiPromptInput }),
      });
      const data = await resp.json();
      if (data.autoFill) {
        setFormData(prev => ({
          ...prev,
          name: data.autoFill.name || prev.name,
          category: data.autoFill.category || prev.category,
          quantity: data.autoFill.quantity || prev.quantity,
          condition: data.autoFill.condition || prev.condition,
          location: data.autoFill.location || prev.location,
          departmentId: data.autoFill.departmentId || prev.departmentId,
          estimatedValue: data.autoFill.estimatedValue || prev.estimatedValue,
          description: data.autoFill.description || prev.description,
          tags: data.autoFill.tags || prev.tags,
        }));
      }
    } catch (e) {
      console.error('AutoFill failed:', e);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleCreateResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmittingResource(true);
    try {
      const resp = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await resp.json();
      if (data.success) {
        setListSuccessMsg(`🎉 Successfully listed ${formData.name} in the organizational catalog!`);
        setTimeout(() => {
          setShowListModal(false);
          setListSuccessMsg(null);
          window.location.reload();
        }, 1200);
      } else {
        alert(data.error || 'Failed to list resource');
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsSubmittingResource(false);
    }
  };

  const handleGenerateDesc = async (resource: any) => {
    setIsGeneratingDesc(true);
    setAiDescription(null);
    try {
      const resp = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: resource.name,
          description: resource.description,
          category: resource.category,
          quantity: resource.quantity,
          estimatedValue: resource.estimatedValue,
          condition: resource.condition,
          location: resource.location,
          departmentName: resource.department?.name,
        }),
      });
      const data = await resp.json();
      setAiDescription(data.description);
    } catch {
      setAiDescription('Unable to generate description at this time.');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleQuickMatch = async () => {
    if (!quickMatchResource || !quickMatchDesc.trim()) return;
    setIsQuickMatching(true);
    try {
      const resp = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: `I need ${quickMatchResource.name} — ${quickMatchDesc}` }),
      });
      const data = await resp.json();
      const reqResp = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput: quickMatchDesc, extracted: data.extracted, userId: 'user-req' }),
      });
      const reqData = await reqResp.json();
      if (reqData.requirementId) {
        window.location.href = `/match/${reqData.requirementId}`;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsQuickMatching(false);
    }
  };

  const handleCsvSubmit = async () => {
    if (!csvContent.trim()) return;
    setIsUploading(true);
    setUploadMsg(null);
    try {
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const items = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length < 2) continue;
        const row: any = {};
        headers.forEach((h, index) => { row[h] = parts[index] || ''; });
        items.push({
          name: row.name || `Resource ${i}`,
          category: row.category || 'Electronics',
          quantity: parseInt(row.quantity) || 1,
          location: row.location || 'Central Store',
          condition: row.condition || 'Good',
          estimatedValue: parseFloat(row.estimatedvalue || row.value) || 10000,
          tags: row.tags || row.name?.toLowerCase(),
        });
      }
      const resp = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resources: items }),
      });
      const data = await resp.json();
      if (data.success) {
        setUploadMsg(`✅ Successfully imported ${data.count} resources! Reloading...`);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setUploadMsg(`❌ Error: ${data.error}`);
      }
    } catch (e: any) {
      setUploadMsg(`❌ CSV Parse Error: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="topbar-title">Resource Explorer</h1>
          <span className="badge badge-purple">{resources.length} Assets</span>
          <span className="badge badge-green">
            {resources.filter(r => r.status === 'AVAILABLE').length} Available
          </span>
        </div>
        <div className="topbar-actions">
          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 2, border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--rescue-green)' : 'transparent',
                color: viewMode === 'grid' ? '#060610' : 'var(--text-muted)',
                border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700,
              }}
              title="Grid View"
            >
              <LayoutGrid size={14} /> Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--rescue-green)' : 'transparent',
                color: viewMode === 'table' ? '#060610' : 'var(--text-muted)',
                border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700,
              }}
              title="Table / List View"
            >
              <ListIcon size={14} /> List
            </button>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={() => setShowCsvModal(true)}>
            <Upload size={14} />
            Bulk CSV
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowListModal(true)}
            style={{
              background: 'linear-gradient(135deg, #00D9A5, #00b894)',
              border: 'none', fontWeight: 700,
            }}
          >
            <Plus size={14} />
            + List a Resource
          </button>
        </div>
      </header>

      <div className="page-container">
        {/* Hero Summary Banner */}
        <div className="animate-fade-in" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          {[
            { label: 'Total Assets', value: resources.length, color: 'var(--rescue-green)', suffix: '' },
            { label: 'Available Now', value: resources.filter(r => r.status === 'AVAILABLE').length, color: '#00D9A5', suffix: '' },
            { label: 'Departments', value: new Set(resources.map(r => r.departmentId)).size, color: 'var(--ai-purple)', suffix: '' },
            {
              label: 'Total Value',
              value: Math.round(resources.reduce((s, r) => s + (r.estimatedValue || 0) * (r.quantity || 1), 0) / 100000),
              color: '#FCD34D', suffix: 'L'
            },
          ].map(({ label, value, color, suffix }) => (
            <div key={label} style={{
              padding: '14px 18px',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 12, textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color }}>{label === 'Total Value' ? '₹' : ''}{value}{suffix}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {categories.map(cat => {
            const count = resources.filter(r => r.category === cat).length;
            const Icon = CATEGORY_ICONS[cat] || Package;
            return (
              <button key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  background: categoryFilter === cat ? 'rgba(0,217,165,0.1)' : 'var(--bg-card)',
                  border: categoryFilter === cat ? '1px solid rgba(0,217,165,0.3)' : '1px solid var(--border-subtle)',
                  padding: '5px 12px', borderRadius: 20, transition: 'all 0.15s',
                }}>
                <Icon size={13} color={categoryFilter === cat ? 'var(--rescue-green)' : 'var(--text-muted)'} />
                <span style={{ fontSize: 13, color: categoryFilter === cat ? 'var(--rescue-green)' : 'var(--text-secondary)', fontWeight: 500 }}>{cat}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>{count}</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowListModal(true)}
            style={{
              marginLeft: 'auto', background: 'linear-gradient(135deg, rgba(0,217,165,0.15), rgba(124,58,237,0.15))',
              color: 'var(--rescue-green)', border: '1px solid rgba(0,217,165,0.3)',
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Sparkles size={13} />
            + List Resource with AI
          </button>
        </div>

        {/* Search & Filters */}
        <div className="animate-fade-in stagger-1" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
            <Search size={16} className="search-bar-icon" />
            <input
              className="input"
              placeholder="Search resources, specifications, tags, departments..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select className="input select" style={{ width: 'auto', minWidth: 160 }}
            value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <select className="input select" style={{ width: 'auto', minWidth: 140 }}
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>

          {(search || categoryFilter || deptFilter || statusFilter !== 'AVAILABLE') && (
            <button className="btn btn-ghost btn-sm" onClick={() => {
              setSearch(''); setCategoryFilter(''); setDeptFilter(''); setStatusFilter('AVAILABLE');
            }}>
              <Filter size={14} />
              Clear
            </button>
          )}
        </div>

        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> matching assets
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Click any resource for technical specifications & AI analysis
          </span>
        </div>

        {/* RESOURCE DISPLAY: GRID vs TABLE LIST */}
        {filtered.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">No resources match your query</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
              Try adjusting your filters or list a new resource.
            </p>
            <button className="btn btn-rescue" style={{ marginTop: 16 }} onClick={() => setShowListModal(true)}>
              <Plus size={16} /> List This Resource
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid-3 animate-fade-in stagger-2">
            {filtered.map((resource, i) => {
              const Icon = CATEGORY_ICONS[resource.category] || Package;
              const health = getHealthScore(resource);
              return (
                <div
                  key={resource.id}
                  className="resource-card"
                  onClick={() => { setSelectedResource(resource); setAiDescription(null); }}
                  style={{ animationDelay: `${i * 0.02}s` }}
                >
                  <div className="resource-card-category">
                    <div className={`category-icon category-${resource.category.toLowerCase()}`}>
                      <Icon size={16} color="var(--text-secondary)" />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{resource.category}</span>
                    <span className={`badge ${STATUS_COLORS[resource.status] || 'badge-muted'}`}
                      style={{ marginLeft: 'auto', fontSize: 10 }}>
                      {resource.status === 'AVAILABLE' && <CheckCircle size={8} />}
                      {resource.status}
                    </span>
                  </div>

                  <div className="resource-card-name">{resource.name}</div>
                  <div className="resource-card-dept">
                    <MapPin size={11} style={{ display: 'inline' }} />
                    {resource.location} · {resource.department.name}
                  </div>

                  {resource.description && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }} className="truncate">
                      {resource.description}
                    </p>
                  )}

                  {/* Health Score */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Heart size={9} /> Health Score
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{health.score}/100</span>
                    </div>
                    <div className="health-bar">
                      <div className={`health-bar-fill ${health.barClass}`} style={{ width: `${health.score}%` }} />
                    </div>
                  </div>

                  <div className="resource-card-stats">
                    <div className="resource-stat">
                      <div className="resource-stat-value">{resource.quantity}</div>
                      <div className="resource-stat-label">Qty</div>
                    </div>
                    <div className="resource-stat">
                      <div className="resource-stat-value">{formatCurrency(resource.estimatedValue)}</div>
                      <div className="resource-stat-label">Unit Value</div>
                    </div>
                    <div className="resource-stat">
                      <div className="resource-stat-value" style={{ color: resource.condition === 'Excellent' ? 'var(--rescue-green)' : 'inherit', fontSize: 13 }}>
                        {resource.condition}
                      </div>
                      <div className="resource-stat-label">Condition</div>
                    </div>
                    {/* Quick Match button */}
                    {resource.status === 'AVAILABLE' && (
                      <button
                        className="btn btn-rescue btn-sm"
                        style={{ marginLeft: 'auto', padding: '5px 10px', fontSize: 11 }}
                        onClick={e => { e.stopPropagation(); setQuickMatchResource(resource); setQuickMatchDesc(''); }}
                      >
                        <Zap size={10} />
                        Match
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table / List View */
          <div className="card animate-fade-in stagger-2" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Asset Name</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Department & Location</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Quantity</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Unit Value</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Condition</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Health</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(resource => {
                    const health = getHealthScore(resource);
                    return (
                      <tr
                        key={resource.id}
                        onClick={() => { setSelectedResource(resource); setAiDescription(null); }}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {resource.name}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className="badge badge-purple" style={{ fontSize: 10 }}>{resource.category}</span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                          <div>{resource.department.name}</div>
                          <div style={{ fontSize: 11 }}>{resource.location}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--rescue-green)' }}>
                          {resource.quantity} units
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                          {formatCurrency(resource.estimatedValue)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className={`badge ${CONDITION_COLORS[resource.condition] || 'badge-muted'}`} style={{ fontSize: 10 }}>
                            {resource.condition}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', minWidth: 100 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{health.score}</div>
                          <div className="health-bar" style={{ height: 4 }}>
                            <div className={`health-bar-fill ${health.barClass}`} style={{ width: `${health.score}%` }} />
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className={`badge ${STATUS_COLORS[resource.status] || 'badge-muted'}`} style={{ fontSize: 10 }}>
                            {resource.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          {resource.status === 'AVAILABLE' && (
                            <button
                              className="btn btn-rescue btn-sm"
                              style={{ padding: '4px 10px', fontSize: 11 }}
                              onClick={e => {
                                e.stopPropagation();
                                setQuickMatchResource(resource);
                                setQuickMatchDesc('');
                              }}
                            >
                              <Zap size={10} /> Match
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          MODAL 1: LIST A RESOURCE (WITH AI AUTO-FILL)
          ============================================================ */}
      {showListModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 220,
          backdropFilter: 'blur(12px)', padding: 20,
        }} onClick={() => setShowListModal(false)}>
          <div
            className="card card-ai animate-fade-in-scale"
            style={{ width: 620, maxHeight: '90vh', overflowY: 'auto', padding: 32, position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setShowListModal(false)}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--rescue-green), var(--ai-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={20} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>List an Organizational Resource</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Share surplus or idle equipment across campus departments</p>
              </div>
            </div>

            {/* AI Auto-Fill Helper */}
            <div style={{
              marginTop: 16, marginBottom: 20, padding: 14,
              background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-purple)' }}>
                <Sparkles size={14} /> AI Instant Auto-Fill
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  style={{ fontSize: 13, padding: '8px 12px' }}
                  placeholder="e.g. 15 Dell 27-inch 4K monitors in Computer Lab 3 with HDMI cables"
                  value={aiPromptInput}
                  onChange={e => setAiPromptInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAiAutoFill(); } }}
                />
                <button
                  type="button"
                  className="btn btn-ai btn-sm"
                  style={{ whiteSpace: 'nowrap' }}
                  onClick={handleAiAutoFill}
                  disabled={!aiPromptInput.trim() || isAutoFilling}
                >
                  {isAutoFilling ? <div className="loading-spinner" style={{ width: 14, height: 14 }} /> : <><Sparkles size={12} /> Auto-Fill</>}
                </button>
              </div>
            </div>

            {listSuccessMsg && (
              <div style={{ padding: '12px 16px', background: 'rgba(0,217,165,0.15)', border: '1px solid rgba(0,217,165,0.3)', borderRadius: 8, color: 'var(--rescue-green)', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                {listSuccessMsg}
              </div>
            )}

            <form onSubmit={handleCreateResourceSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Resource / Asset Name *</label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. Apple MacBook Pro 16 M2"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="input select"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Space">Space / Lab</option>
                    <option value="Capacity">Capacity / Machine</option>
                    <option value="Material">Material</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Available Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    required
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Condition *</label>
                  <select
                    className="input select"
                    value={formData.condition}
                    onChange={e => setFormData({ ...formData, condition: e.target.value })}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Est. Unit Value (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    required
                    value={formData.estimatedValue}
                    onChange={e => setFormData({ ...formData, estimatedValue: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select
                    className="input select"
                    value={formData.departmentId}
                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Physical Location *</label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. Block A, Lab 203"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Description & Capabilities</label>
                <textarea
                  className="input textarea"
                  style={{ minHeight: 70 }}
                  placeholder="Describe specifications, software loaded, accessories included, etc."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Search Tags (comma separated)</label>
                <input
                  className="input"
                  placeholder="e.g. 4k, display, monitor, design, coding"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowListModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-rescue" disabled={isSubmittingResource}>
                  {isSubmittingResource ? (
                    <><div className="loading-spinner" /> Listing Asset...</>
                  ) : (
                    <><Plus size={16} /> Publish to Catalog</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: RESOURCE DETAILS & AI DESCRIBE
          ============================================================ */}
      {selectedResource && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          backdropFilter: 'blur(10px)', padding: 20,
        }} onClick={() => setSelectedResource(null)}>
          <div className="card animate-fade-in-scale" style={{ width: 560, padding: 32, position: 'relative', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setSelectedResource(null)}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className={`badge ${STATUS_COLORS[selectedResource.status] || 'badge-muted'}`}>
                {selectedResource.status}
              </span>
              <span className="badge badge-purple">{selectedResource.category}</span>
              <span className="badge badge-muted">{selectedResource.condition}</span>
              <span className="badge badge-muted" style={{ marginLeft: 'auto' }}>
                <Heart size={9} /> Health {getHealthScore(selectedResource).score}/100
              </span>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{selectedResource.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building2 size={13} color="var(--rescue-green)" />
              {selectedResource.department.name} · {selectedResource.location}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: 16, background: 'var(--bg-elevated)', borderRadius: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Available Qty</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--rescue-green)' }}>{selectedResource.quantity} units</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unit Value</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{formatCurrency(selectedResource.estimatedValue)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Value</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#FCD34D' }}>{formatCurrency(selectedResource.estimatedValue * selectedResource.quantity)}</div>
              </div>
            </div>

            {/* AI Description */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Description</div>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--text-purple)', border: '1px solid rgba(124,58,237,0.2)', padding: '4px 10px', fontSize: 11 }}
                  onClick={() => handleGenerateDesc(selectedResource)}
                  disabled={isGeneratingDesc}
                >
                  {isGeneratingDesc ? <div className="loading-spinner" style={{ width: 12, height: 12 }} /> : <><Brain size={10} /> AI Describe</>}
                </button>
              </div>
              {aiDescription ? (
                <div style={{ padding: '12px 14px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  <Sparkles size={12} color="var(--ai-purple)" style={{ display: 'inline', marginRight: 6 }} />
                  {aiDescription}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {selectedResource.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description. Click "AI Describe" to generate one.</span>}
                </p>
              )}
            </div>

            {selectedResource.specifications && (() => {
              try {
                const specs = JSON.parse(selectedResource.specifications);
                const entries = Object.entries(specs);
                if (entries.length === 0) return null;
                return (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Technical Specifications</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {entries.map(([k, v]: any) => (
                        <div key={k} style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontSize: 12 }}>
                          <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                          <strong style={{ color: 'var(--text-primary)' }}>{String(v)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } catch { return null; }
            })()}

            {selectedResource.tags && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
                {selectedResource.tags.split(',').map((t: string) => (
                  <span key={t} className="badge badge-muted" style={{ fontSize: 11 }}>#{t.trim()}</span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setSelectedResource(null)}>Close</button>
              {selectedResource.status === 'AVAILABLE' && (
                <button
                  className="btn btn-rescue"
                  onClick={() => { setQuickMatchResource(selectedResource); setSelectedResource(null); setQuickMatchDesc(''); }}
                >
                  <Zap size={16} />
                  Quick Match
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: QUICK MATCH
          ============================================================ */}
      {quickMatchResource && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          backdropFilter: 'blur(10px)', padding: 20,
        }} onClick={() => setQuickMatchResource(null)}>
          <div className="card card-rescue animate-fade-in-scale" style={{ width: 460, padding: 32 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,217,165,0.1)', border: '1px solid rgba(0,217,165,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color="var(--rescue-green)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Quick Match</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{quickMatchResource.name}</div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">What do you need this resource for?</label>
              <textarea
                className="input textarea"
                style={{ minHeight: 100 }}
                placeholder={`e.g. Training workshop for 25 students next Tuesday`}
                value={quickMatchDesc}
                onChange={e => setQuickMatchDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setQuickMatchResource(null)}>Cancel</button>
              <button
                className="btn btn-rescue"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleQuickMatch}
                disabled={!quickMatchDesc.trim() || isQuickMatching}
              >
                {isQuickMatching ? (
                  <><div className="loading-spinner" /> Matching...</>
                ) : (
                  <><Zap size={16} /> Find Matches</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 4: CSV BULK IMPORT
          ============================================================ */}
      {showCsvModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          backdropFilter: 'blur(10px)',
        }} onClick={() => setShowCsvModal(false)}>
          <div className="card" style={{ width: 540, padding: 32 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Upload Resources via CSV</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Paste CSV with columns: <code>name, category, quantity, location, condition, estimatedValue, tags</code>
            </p>

            {uploadMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, background: 'var(--bg-elevated)' }}>
                {uploadMsg}
              </div>
            )}

            <textarea
              className="input textarea font-mono"
              style={{ minHeight: 160, fontSize: 12, marginBottom: 20 }}
              placeholder={`name,category,quantity,location,condition,estimatedValue,tags\nVR Headset Meta Quest 3,Electronics,6,Lab A5,Excellent,48000,vr,gaming\nChemical Fume Hood,Capacity,2,Bio Lab 1,Good,85000,lab,biotech`}
              value={csvContent}
              onChange={e => setCsvContent(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowCsvModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCsvSubmit} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload & Index to Database'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
