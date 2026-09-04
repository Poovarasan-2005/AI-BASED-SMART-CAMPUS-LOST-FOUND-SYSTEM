import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Users, Lock, Compass } from 'lucide-react';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1.5rem 4rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span className="badge badge-active" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          CAMPUS PLATFORM
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>About Smart Campus Lost & Found</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 640, margin: '0.5rem auto 0 auto' }}>
          An intelligent campus security infrastructure connecting students, faculty, and campus staff through explainable AI matching and verified recovery.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
          Our Mission
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          Traditional campus lost and found desks rely on fragmented paper logbooks, unmonitored social media groups, and unverified claims. The AI-Based Smart Campus Lost & Found System was engineered to provide a centralized, privacy-respecting platform that leverages computer vision and multimodal scoring to reunite members with their misplaced belongings in hours instead of weeks.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
          Core Architectural Principles
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <Sparkles style={{ width: 22, height: 22, color: '#06b6d4', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>Multimodal AI Matching</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Combines OpenCV color feature vectors, brand/model semantics, campus location zones, and reporting timestamps.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <Lock style={{ width: 22, height: 22, color: '#10b981', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>Zero-Trust Privacy</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              No private email addresses or phone numbers are publicly broadcasted. Contacts are shared solely by mutual authenticated consent.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <ShieldCheck style={{ width: 22, height: 22, color: '#818cf8', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>Verified Campus Community</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Strict role-based access control (LOST_USER, FOUND_USER, ADMIN) enforcing authenticated campus credential verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
