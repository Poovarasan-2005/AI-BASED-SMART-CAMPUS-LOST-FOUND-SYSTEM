import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Sparkles, ShieldCheck, MessageSquare, QrCode, ArrowRight } from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Report Your Item',
      desc: 'Whether you lost an item or discovered one on campus, fill out the comprehensive reporting form. Upload clear photos and note key attributes like brand, model, campus building, and time.',
      icon: FileText,
      color: '#f43f5e'
    },
    {
      num: '02',
      title: 'AI Evaluates Potential Matches',
      desc: 'Our multimodal matching engine calculates weighted similarity scores (visual features, text description, brand, color, location, and date). Matches exceeding confidence thresholds are surfaced with explainable factor breakdowns.',
      icon: Sparkles,
      color: '#06b6d4'
    },
    {
      num: '03',
      title: 'Send Verification Request',
      desc: 'If an item appears to be yours, send a formal Verification Request. The system sends an email notification directly to the finder without publicly exposing either party’s contact details.',
      icon: ShieldCheck,
      color: '#f59e0b'
    },
    {
      num: '04',
      title: 'Private In-App Conversation',
      desc: 'Communicate directly in a secure, BOLA-protected in-app chat. Message delivery and read receipts (Sent ✓, Delivered ✓✓, Seen ✓✓) keep you informed as the other person reviews your messages.',
      icon: MessageSquare,
      color: '#6366f1'
    },
    {
      num: '05',
      title: 'Secure Campus Handover',
      desc: 'Meet safely at an authorized campus location (such as the Central Library or Campus Security Desk). Verify ownership and mark the item as returned.',
      icon: QrCode,
      color: '#10b981'
    }
  ];

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1.5rem 4rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span className="badge badge-active" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          STEP-BY-STEP RECOVERY
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>How the System Works</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 600, margin: '0.5rem auto 0 auto' }}>
          LOST → REPORT → AI MATCH → VERIFY → COMMUNICATE → RECOVER
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
        {steps.map((s, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: `rgba(255, 255, 255, 0.05)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: s.color,
              flexShrink: 0
            }}>
              <s.icon style={{ width: 26, height: 26 }} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: s.color, letterSpacing: '0.08em', marginBottom: 2 }}>
                STEP {s.num}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link to="/search" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
          Search Campus Items Now <ArrowRight style={{ width: 16, height: 16 }} />
        </Link>
      </div>
    </div>
  );
}
