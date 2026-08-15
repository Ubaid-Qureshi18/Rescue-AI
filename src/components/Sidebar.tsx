'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Zap,
  Inbox,
  BarChart3,
  Recycle,
  Settings,
  Menu,
  X,
  UserCheck,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/resources', icon: Package, label: 'Resources' },
  { href: '/needs/new', icon: Zap, label: 'Find Resources', highlight: true },
  { href: '/needs', icon: ClipboardList, label: 'Needs History' },
  { href: '/requests', icon: Inbox, label: 'Requests' },
  { href: '/impact', icon: BarChart3, label: 'Impact Center' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<'requester' | 'admin'>('requester');
  const [stats, setStats] = useState<{ totalSavings: number; rescuedCount: number } | null>(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const toggleUserRole = () => {
    setActiveUser(prev => prev === 'requester' ? 'admin' : 'requester');
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div style={{
        display: 'none',
        height: '56px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 16px',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 150,
      }} className="mobile-header">
        <Link href="/" className="sidebar-logo-mark">
          <div className="sidebar-logo-icon">
            <Recycle size={18} color="white" />
          </div>
          <div className="sidebar-logo-text">
            <span>RESCUE</span> AI
          </div>
        </Link>

        <button className="btn btn-ghost btn-icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 140,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <Link href="/" className="sidebar-logo-mark">
            <div className="sidebar-logo-icon">
              <Recycle size={18} color="white" />
            </div>
            <div>
              <div className="sidebar-logo-text">
                <span>RESCUE</span> AI
              </div>
            </div>
          </Link>
          <div className="sidebar-tagline">INSPIRE University</div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Platform</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`nav-item${isActive ? ' active' : ''}`}
                style={item.highlight && !isActive ? {
                  background: 'rgba(0, 217, 165, 0.06)',
                  border: '1px solid rgba(0, 217, 165, 0.15)',
                  color: '#00D9A5',
                } : {}}
              >
                <item.icon size={16} />
                {item.label}
                {item.highlight && (
                  <span style={{
                    marginLeft: 'auto',
                    background: 'rgba(0, 217, 165, 0.2)',
                    color: '#00D9A5',
                    borderRadius: '999px',
                    fontSize: '10px',
                    padding: '1px 6px',
                    fontWeight: 700,
                  }}>AI</span>
                )}
              </Link>
            );
          })}

          <div className="sidebar-section-label" style={{ marginTop: '12px' }}>System Control</div>
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={`nav-item${pathname === '/admin' ? ' active' : ''}`}
          >
            <Settings size={16} />
            Admin Panel
          </Link>
        </nav>

        {/* Live Rescue Stats Ticker */}
          {stats && (
            <div className="sidebar-ticker">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <TrendingUp size={10} color="var(--rescue-green)" />
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Impact</span>
              </div>
              <span className="sidebar-ticker-value">₹{(stats.totalSavings / 100000).toFixed(1)}L</span>
              <span style={{ fontSize: 10 }}> procurement avoided · {stats.rescuedCount} rescued</span>
            </div>
          )}

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={toggleUserRole} style={{ cursor: 'pointer' }} title="Click to switch active user profile">
            <div className="sidebar-avatar">
              {activeUser === 'requester' ? 'SP' : 'AD'}
            </div>
            <div>
              <div className="sidebar-user-name">
                {activeUser === 'requester' ? 'Sunita Patel' : 'Admin User'}
              </div>
              <div className="sidebar-user-role">
                {activeUser === 'requester' ? 'Computer Eng.' : 'System Admin'}
              </div>
            </div>
            <UserCheck size={14} color="var(--rescue-green)" style={{ marginLeft: 'auto' }} />
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
          .main-content { margin-left: 0 !important; margin-top: 56px !important; }
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            top: 56px !important;
            z-index: 145 !important;
          }
          .sidebar.mobile-open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
}
