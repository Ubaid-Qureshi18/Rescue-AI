'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('RESCUE AI Runtime Boundary Caught:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '24px',
      color: 'var(--text-primary)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div className="card card-rescue animate-fade-in-scale" style={{
        maxWidth: 520,
        width: '100%',
        padding: '36px',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-rescue)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 217, 165, 0.12)',
        borderRadius: 20,
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <AlertTriangle size={28} color="#F87171" />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Auto-Recovery Safeguard
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          RESCUE AI encountered a temporary runtime state and isolated it safely.
          Your inventory and reservations in the database remain 100% secure.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            className="btn btn-rescue"
            onClick={() => reset()}
            style={{ padding: '10px 20px', fontSize: 14 }}
          >
            <RefreshCw size={15} />
            Recover Session
          </button>
          <Link
            href="/dashboard"
            className="btn btn-secondary"
            style={{ padding: '10px 20px', fontSize: 14 }}
          >
            <Home size={15} />
            Dashboard
          </Link>
        </div>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
          <ShieldCheck size={12} color="var(--rescue-green)" />
          <span>RESCUE AI Fault-Tolerant Engine</span>
        </div>
      </div>
    </div>
  );
}
