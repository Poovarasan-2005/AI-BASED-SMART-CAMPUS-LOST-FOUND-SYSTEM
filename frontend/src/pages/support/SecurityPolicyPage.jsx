import React from 'react';
import { ShieldCheck, Lock, KeyRound, Server, FileCheck } from 'lucide-react';

export default function SecurityPolicyPage() {
  return (
    <div style={{ maxWidth: 840, margin: '2rem auto', padding: '0 1.5rem 4rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge badge-active" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          CYBERSECURITY ARCHITECTURE
        </span>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800 }}>Platform Security</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Enterprise-grade defense against unauthorized access, BOLA/IDOR, and data leakage.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <KeyRound style={{ width: 22, height: 22, color: '#f43f5e', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>Bcrypt & JWT Bearer</h3>
            <p style={{ fontSize: '0.85rem' }}>
              Passwords are salted and hashed using passlib bcrypt. User sessions utilize HS256-signed JWT bearer tokens with strict expiration.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <Lock style={{ width: 22, height: 22, color: '#10b981', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>Server-Enforced RBAC</h3>
            <p style={{ fontSize: '0.85rem' }}>
              Authorization is enforced on the FastAPI backend on every API request. Frontend navigation hiding is never relied upon as a security boundary.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <Server style={{ width: 22, height: 22, color: '#38bdf8', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>BOLA & IDOR Mitigation</h3>
            <p style={{ fontSize: '0.85rem' }}>
              Conversations and reports verify that the requesting user identifier strictly matches the document owner or conversation participant before returning data.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <FileCheck style={{ width: 22, height: 22, color: '#f59e0b', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>Audit Logging & Rate Limiting</h3>
            <p style={{ fontSize: '0.85rem' }}>
              Critical actions (logins, verification requests, password updates) are recorded in an append-only audit trail with IP address tracking and rate limiting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
