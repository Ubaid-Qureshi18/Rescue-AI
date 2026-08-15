'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, LayoutDashboard, Package, Zap, Inbox,
  BarChart3, Settings, Sparkles, X, ChevronRight,
  Database, RefreshCw, Command, CornerDownLeft
} from 'lucide-react';

interface ResourceItem {
  id: string;
  name: string;
  category: string;
  location: string;
  department?: { name: string };
  status: string;
}

export default function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Toggle on Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Fetch resources once when opened
  useEffect(() => {
    if (isOpen && resources.length === 0) {
      setLoading(true);
      fetch('/api/resources')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setResources(data);
          else if (data.resources) setResources(data.resources);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, resources.length]);

  const quickNav = [
    { label: 'Dashboard Overview', href: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { label: 'Browse All Resources', href: '/resources', icon: Package, category: 'Navigation' },
    { label: 'Find Resources (AI Search)', href: '/needs/new', icon: Zap, category: 'Navigation', badge: 'AI' },
    { label: 'Requests & Active MoUs', href: '/requests', icon: Inbox, category: 'Navigation' },
    { label: 'Impact Center & ESG', href: '/impact', icon: BarChart3, category: 'Navigation' },
    { label: 'Admin Panel & Settings', href: '/admin', icon: Settings, category: 'Navigation' },
  ];

  const filteredNav = quickNav.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredResources = resources.filter(res =>
    res.name.toLowerCase().includes(query.toLowerCase()) ||
    res.category.toLowerCase().includes(query.toLowerCase()) ||
    res.location?.toLowerCase().includes(query.toLowerCase()) ||
    res.department?.name?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6);

  const handleSelectNav = (href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  };

  const handleSelectResource = (id: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/resources?search=${encodeURIComponent(id)}`);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        className="card animate-fade-in-scale"
        style={{
          width: '100%',
          maxWidth: 640,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-rescue)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 217, 165, 0.15)',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
        }}>
          <Search size={18} color="var(--rescue-green)" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, page, or search 50+ campus assets... (e.g. 'laptops', 'cnc', 'vr', 'impact')"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 15,
              outline: 'none',
            }}
          />
          <kbd style={{
            fontSize: 11,
            padding: '3px 6px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            color: 'var(--text-muted)',
          }}>
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div style={{ maxHeight: 420, overflowY: 'auto', padding: '12px 8px' }}>
          {/* Pages & Actions */}
          {filteredNav.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '6px 12px', letterSpacing: '0.5px' }}>
                Navigation & Shortcuts
              </div>
              {filteredNav.map((item, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectNav(item.href)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0, 217, 165, 0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <item.icon size={16} color="var(--text-secondary)" />
                  <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span className="badge badge-green" style={{ fontSize: 10 }}>{item.badge}</span>
                  )}
                  <CornerDownLeft size={12} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          )}

          {/* Resources search matches */}
          {query.trim().length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '6px 12px', letterSpacing: '0.5px' }}>
                Matching Inventory ({filteredResources.length})
              </div>
              {filteredResources.length === 0 ? (
                <div style={{ padding: '16px 12px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                  No indexed resources match &quot;{query}&quot;
                </div>
              ) : (
                filteredResources.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => handleSelectResource(res.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Package size={16} color="var(--text-purple)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{res.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {res.category} · {res.location} {res.department?.name ? `(${res.department.name})` : ''}
                      </div>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: 10 }}>View</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span>Navigate: <kbd style={{ padding: '2px 4px', background: 'var(--bg-elevated)', borderRadius: 3 }}>↑</kbd> <kbd style={{ padding: '2px 4px', background: 'var(--bg-elevated)', borderRadius: 3 }}>↓</kbd></span>
            <span>Select: <kbd style={{ padding: '2px 4px', background: 'var(--bg-elevated)', borderRadius: 3 }}>↵</kbd></span>
          </div>
          <span>RESCUE AI Command Hub</span>
        </div>
      </div>
    </div>
  );
}
