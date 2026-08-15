'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, RefreshCw, Plus, Upload, Building2,
  Users, Package, CheckCircle2, AlertTriangle, Trash2,
  Database, Sparkles, Layers,
} from 'lucide-react';

interface AdminProps {
  departments: any[];
  resources: any[];
  users: any[];
  reservations: any[];
  matches: any[];
  totalValue: number;
  reservedCount: number;
}

const formatCurrency = (val: number) =>
  val >= 100000 ? `₹${(val / 100000).toFixed(2)}L` : `₹${val.toLocaleString('en-IN')}`;

export default function AdminClient({
  departments, resources, users, reservations, matches, totalValue, reservedCount
}: AdminProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'csv' | 'users'>('overview');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedOutput, setSeedOutput] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [condition, setCondition] = useState('Good');
  const [location, setLocation] = useState('Lab 1, Floor 2');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept-ce');
  const [estimatedValue, setEstimatedValue] = useState('15000');
  const [tags, setTags] = useState('equipment, tech');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // CSV State
  const [csvText, setCsvText] = useState(
    `name,category,quantity,location,condition,estimatedValue,tags\n` +
    `3D Printer Pro,Electronics,2,Maker Space,Excellent,75000,3d printing,prototyping\n` +
    `Digital Oscilloscope 100MHz,Electronics,5,Electronics Lab B,Good,32000,circuits,measurement\n` +
    `Ergonomic Conference Table,Furniture,4,Block A Conference,Excellent,18000,furniture,tables`
  );
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);

  const handleResetSeed = async () => {
    if (!confirm('Are you sure you want to re-seed the database to default hackathon state?')) return;
    setIsSeeding(true);
    setSeedOutput(null);
    try {
      const resp = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await resp.json();
      if (data.success) {
        setSeedOutput('Database re-seeded successfully! Refreshing...');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setSeedOutput(`Re-seed failed: ${data.error}`);
      }
    } catch (e: any) {
      setSeedOutput(`Error triggering seed: ${e.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const resp = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          description,
          quantity: parseInt(quantity) || 1,
          condition,
          location,
          departmentId,
          estimatedValue: parseFloat(estimatedValue) || 5000,
          tags,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Successfully created ${name} in database!` });
        setName('');
        setDescription('');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create resource' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvImport = async () => {
    if (!csvText.trim()) return;
    setIsUploadingCsv(true);
    setMessage(null);

    try {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const resourcesList = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length < 2) continue;
        const row: any = {};
        headers.forEach((h, index) => {
          row[h] = parts[index] || '';
        });
        resourcesList.push({
          name: row.name || `Asset ${i}`,
          category: row.category || 'Electronics',
          quantity: parseInt(row.quantity) || 1,
          location: row.location || 'Main Campus',
          condition: row.condition || 'Good',
          estimatedValue: parseFloat(row.estimatedvalue || row.value) || 10000,
          tags: row.tags || row.name?.toLowerCase(),
          departmentId,
        });
      }

      const resp = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resources: resourcesList }),
      });
      const data = await resp.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Imported ${data.count} resources into database!` });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setMessage({ type: 'error', text: data.error || 'Import failed' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: `CSV format error: ${e.message}` });
    } finally {
      setIsUploadingCsv(false);
    }
  };

  return (
    <>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className="topbar-title">Admin Panel</h1>
          <span className="badge badge-purple">
            <ShieldCheck size={12} />
            System Control
          </span>
        </div>
        <div className="topbar-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ resources, departments, users, reservations }, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `rescue_ai_backup_${new Date().toISOString().split('T')[0]}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
          >
            💾 Backup JSON
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleResetSeed}
            disabled={isSeeding}
          >
            <RefreshCw size={14} className={isSeeding ? 'loading-spinner' : ''} />
            Reset Seed Data
          </button>
        </div>
      </header>

      <div className="page-container">
        {/* System Diagnostics Health Banner */}
        <div className="animate-fade-in" style={{
          display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
          background: 'rgba(17, 17, 32, 0.75)', border: '1px solid rgba(0, 217, 165, 0.15)',
          borderRadius: 14, padding: '12px 20px', marginBottom: 24, backdropFilter: 'blur(16px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rescue-green)', boxShadow: '0 0 8px var(--rescue-green)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Database:</span>
            <strong style={{ color: 'var(--text-primary)' }}>SQLite (Connected)</strong>
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', boxShadow: '0 0 8px #7C3AED' }} />
            <span style={{ color: 'var(--text-muted)' }}>AI Core:</span>
            <strong style={{ color: 'var(--text-primary)' }}>Gemini 2.0 Flash</strong>
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', boxShadow: '0 0 8px #2563EB' }} />
            <span style={{ color: 'var(--text-muted)' }}>Connected Depts:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{departments.length} Nexus Units</strong>
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginLeft: 'auto' }}>
            <span style={{ color: 'var(--rescue-green)', fontWeight: 700 }}>● System Healthy · 99.99% Operational</span>
          </div>
        </div>
        {seedOutput && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
            background: 'rgba(0, 217, 165, 0.1)', border: '1px solid var(--border-rescue)',
            fontSize: '13px', color: 'var(--rescue-green)',
          }}>
            {seedOutput}
          </div>
        )}

        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
            background: message.type === 'success' ? 'rgba(0, 217, 165, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'var(--border-rescue)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontSize: '13px', color: message.type === 'success' ? 'var(--rescue-green)' : '#F87171',
          }}>
            {message.text}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid-4 animate-fade-in" style={{ marginBottom: '28px' }}>
          {[
            { label: 'TOTAL INVENTORY VALUE', value: formatCurrency(totalValue), icon: Database, color: '#00D9A5' },
            { label: 'TOTAL RESOURCES', value: resources.length, icon: Package, color: '#7C3AED' },
            { label: 'DEPARTMENTS', value: departments.length, icon: Building2, color: '#2563EB' },
            { label: 'ACTIVE RESERVATIONS', value: reservations.length, icon: CheckCircle2, color: '#D97706' },
          ].map((item, i) => (
            <div key={i} className="stat-card" style={{ borderColor: `${item.color}20` }}>
              <div className="stat-card-icon" style={{ background: `${item.color}15` }}>
                <item.icon size={20} color={item.color} />
              </div>
              <div className="stat-card-value">{item.value}</div>
              <div className="stat-card-label">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs animate-fade-in" style={{ marginBottom: '24px' }}>
          {[
            { key: 'overview', label: 'Department Matrix' },
            { key: 'add', label: 'Add New Resource' },
            { key: 'csv', label: 'Bulk CSV Import' },
            { key: 'users', label: 'Users & Roles' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key as any)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
                Department Resource Inventory Matrix
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px' }}>Department</th>
                      <th style={{ padding: '12px' }}>Location</th>
                      <th style={{ padding: '12px' }}>Resource Count</th>
                      <th style={{ padding: '12px' }}>Total Asset Value</th>
                      <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((d: any) => {
                      const deptResources = resources.filter(r => r.departmentId === d.id);
                      const deptVal = deptResources.reduce((s, r) => s + r.estimatedValue * r.quantity, 0);

                      return (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '14px 12px', fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                              {d.name}
                            </div>
                          </td>
                          <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{d.location}</td>
                          <td style={{ padding: '14px 12px', fontWeight: 700 }}>{deptResources.length} assets</td>
                          <td style={{ padding: '14px 12px', fontWeight: 700, color: 'var(--rescue-green)' }}>{formatCurrency(deptVal)}</td>
                          <td style={{ padding: '14px 12px' }}>
                            <span className="badge badge-green">ACTIVE</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <div className="animate-fade-in card" style={{ padding: '32px', maxWidth: '640px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Add Resource to SQLite Database</h2>
            <form onSubmit={handleCreateResource} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Resource Name *</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Sony Alpha DSLR Camera" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="input select" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Space">Space</option>
                    <option value="Material">Material</option>
                    <option value="Capacity">Capacity</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="input select" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input type="number" className="input" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <select className="input select" value={condition} onChange={e => setCondition(e.target.value)}>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Value (₹)</label>
                  <input type="number" className="input" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Block C, Studio 3" />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="input textarea" style={{ minHeight: '80px' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Asset specifications and usage context" />
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                <input className="input" value={tags} onChange={e => setTags(e.target.value)} placeholder="camera, dslr, video, photography" />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }} disabled={isSubmitting}>
                <Plus size={16} />
                {isSubmitting ? 'Saving to DB...' : 'Save Resource to Database'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'csv' && (
          <div className="animate-fade-in card" style={{ padding: '32px', maxWidth: '720px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Bulk CSV Resource Import</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Paste formatted CSV content below. RESCUE AI will parse and index all rows into your SQLite database.
            </p>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">CSV Data</label>
              <textarea
                className="input textarea font-mono"
                style={{ minHeight: '200px', fontSize: '12px' }}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
              />
            </div>
            <button className="btn btn-rescue" onClick={handleCsvImport} disabled={isUploadingCsv}>
              <Upload size={16} />
              {isUploadingCsv ? 'Importing CSV...' : 'Parse and Import CSV to Database'}
            </button>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-fade-in card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              System Users & Department Affiliations
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {users.map((u: any) => (
                <div key={u.id} style={{
                  padding: '16px', background: 'var(--bg-elevated)', borderRadius: '10px',
                  border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <div className="sidebar-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>
                    {u.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                    <div style={{ fontSize: '11px', color: 'var(--rescue-green)', marginTop: '2px' }}>
                      {u.department?.name || 'Central Admin'} · {u.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
