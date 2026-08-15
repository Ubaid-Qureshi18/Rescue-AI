import Link from 'next/link';
import { Home, Zap, Search, Recycle } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '24px',
      color: 'var(--text-primary)',
    }}>
      <div className="card card-rescue animate-fade-in-scale" style={{
        maxWidth: 500,
        width: '100%',
        padding: '40px',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        borderRadius: 20,
        border: '1px solid var(--border-rescue)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 217, 165, 0.1)',
      }}>
        <div style={{
          fontSize: '64px',
          fontWeight: 900,
          background: 'linear-gradient(135deg, var(--rescue-green), var(--ai-purple))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8,
          lineHeight: 1,
        }}>
          404
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          Resource Pathway Not Found
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
          The requested asset node or page has moved or is currently not indexed in the campus network.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/dashboard" className="btn btn-rescue">
            <Home size={15} />
            Dashboard
          </Link>
          <Link href="/needs/new" className="btn btn-secondary">
            <Zap size={15} />
            Find Resources
          </Link>
        </div>
      </div>
    </div>
  );
}
