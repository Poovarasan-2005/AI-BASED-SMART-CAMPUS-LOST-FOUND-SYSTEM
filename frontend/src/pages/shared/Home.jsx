import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Search,
  ArrowRight,
  FileText,
  KeyRound,
  MessageSquare,
  QrCode,
  CheckCircle2,
  Lock,
  Compass
} from 'lucide-react';

export default function Home() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem 5rem 1.5rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '3.5rem 1rem 4rem 1rem' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span className="badge badge-active" style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}>
              <Sparkles style={{ width: 14, height: 14 }} /> AI-POWERED SMART CAMPUS PLATFORM
            </span>
          </div>

          <h1 style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 1.15, marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
            LOST SOMETHING ON CAMPUS?<br />
            <span style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 50%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              FIND IT FASTER WITH AI.
            </span>
          </h1>

          <p style={{ fontSize: '1.18rem', color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: 680, margin: '0 auto 2.75rem auto', lineHeight: 1.6 }}>
            Report lost and found items, discover intelligent potential matches, and securely connect with the person who may have your item.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
            <Link
              to="/lost/report"
              className="btn btn-lost"
              style={{ padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: 700, gap: '0.6rem' }}
            >
              <FileText style={{ width: 18, height: 18 }} />
              REPORT LOST ITEM
            </Link>
            <Link
              to="/found/report"
              className="btn btn-found"
              style={{ padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: 700, gap: '0.6rem' }}
            >
              <FileText style={{ width: 18, height: 18 }} />
              REPORT FOUND ITEM
            </Link>
            <Link
              to="/search"
              className="btn btn-outline"
              style={{ padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: 700, gap: '0.6rem' }}
            >
              <Search style={{ width: 18, height: 18 }} />
              SEARCH LOST & FOUND
            </Link>
          </div>

          {/* Quick Demo Login Banner */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.5rem',
            maxWidth: 700,
            margin: '0 auto 4rem auto',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ textAlign: 'left' }}>
              <strong style={{ color: '#fff' }}>Demo Evaluation Accounts Ready:</strong>
              <div style={{ fontSize: '0.78rem', marginTop: 2 }}>
                Lost: <code>lost.user@campus.edu</code> (Pass: <code>LostPass123!</code>) | Found: <code>found.user@campus.edu</code> (Pass: <code>FoundPass123!</code>)
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/lost/login" className="btn btn-outline btn-sm">Lost Login</Link>
              <Link to="/found/login" className="btn btn-outline btn-sm">Found Login</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Process Pipeline (Section 27) */}
      <section style={{ marginBottom: '5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="badge badge-matched" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
            5-STEP RECOVERY PIPELINE
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>How Campus Recovery Works</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            End-to-end trusted verification from the moment an item is lost to secure handover.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          position: 'relative'
        }}>
          {[
            {
              step: '01',
              title: 'REPORT',
              desc: 'Submit detailed lost or found item details with photo, campus zone, and unique features.',
              color: '#f43f5e',
              icon: FileText
            },
            {
              step: '02',
              title: 'AI MATCH',
              desc: 'Multimodal AI compares visual features, description keywords, and location/date proximity.',
              color: '#06b6d4',
              icon: Sparkles
            },
            {
              step: '03',
              title: 'VERIFY',
              desc: 'Send a zero-trust verification request delivered directly to the finder’s verified email inbox.',
              color: '#f59e0b',
              icon: ShieldCheck
            },
            {
              step: '04',
              title: 'CONNECT',
              desc: 'Private in-app chat with Sent, Delivered, and Seen status tracking and masked contact numbers.',
              color: '#6366f1',
              icon: MessageSquare
            },
            {
              step: '05',
              title: 'RECOVER',
              desc: 'Complete safe campus handover with QR receipt validation and mark the item as returned.',
              color: '#10b981',
              icon: QrCode
            }
          ].map((item, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                top: 12,
                right: 14,
                fontSize: '1.5rem',
                fontWeight: 900,
                color: 'rgba(255,255,255,0.06)'
              }}>
                {item.step}
              </div>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `rgba(${item.color === '#f43f5e' ? '244,63,94' : item.color === '#06b6d4' ? '6,182,212' : item.color === '#f59e0b' ? '245,158,11' : item.color === '#6366f1' ? '99,102,241' : '16,185,129'}, 0.15)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                color: item.color
              }}>
                <item.icon style={{ width: 22, height: 22 }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '0.02em' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Security & Features Grid */}
      <section style={{ marginBottom: '5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="badge badge-active" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
            CAMPUS-GRADE SECURITY
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Built Strictly For Campus Safety</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Zero plaintext leaks, BOLA-protected conversations, and verified campus credentials.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <Lock style={{ width: 28, height: 28, color: '#10b981', marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Zero-Trust Privacy</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Finders' email addresses and phone numbers are never publicly listed. Requesters must submit formal verification requests.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <Sparkles style={{ width: 28, height: 28, color: '#06b6d4', marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Explainable AI Matching</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Weighted multimodal scoring calculates visual, color, brand, location, and date proximity with clear confidence factor breakdowns.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <MessageSquare style={{ width: 28, height: 28, color: '#6366f1', marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Sent, Delivered & Seen Chat</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              BOLA-authorized private messaging where read receipts are only updated when the authenticated recipient actually opens the conversation.
            </p>
          </div>
        </div>
      </section>

      {/* Campus Footer Links (Section 31) */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        paddingTop: '2.5rem',
        marginTop: '3rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <div>
          <strong style={{ color: '#fff' }}>AI-Based Smart Campus Lost & Found System</strong>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 2 }}>
            Designed for students, faculty, staff, and authorized campus members.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
          <Link to="/about" style={{ textDecoration: 'none' }}>About</Link>
          <Link to="/how-it-works" style={{ textDecoration: 'none' }}>How It Works</Link>
          <Link to="/contact" style={{ textDecoration: 'none' }}>Contact</Link>
          <Link to="/support" style={{ textDecoration: 'none' }}>Support</Link>
          <Link to="/privacy" style={{ textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms" style={{ textDecoration: 'none' }}>Terms of Service</Link>
          <Link to="/security" style={{ textDecoration: 'none' }}>Security</Link>
          <Link to="/accessibility" style={{ textDecoration: 'none' }}>Accessibility</Link>
        </div>
      </footer>
    </div>
  );
}
