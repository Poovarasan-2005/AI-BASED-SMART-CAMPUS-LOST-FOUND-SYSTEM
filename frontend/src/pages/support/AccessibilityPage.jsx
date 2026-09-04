import React from 'react';
import { Eye, CheckCircle2 } from 'lucide-react';

export default function AccessibilityPage() {
  return (
    <div style={{ maxWidth: 840, margin: '2rem auto', padding: '0 1.5rem 4rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge badge-active" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          UNIVERSAL CAMPUS ACCESS
        </span>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800 }}>Accessibility Statement</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Commitment to digital accessibility for all campus community members.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
        <p style={{ marginBottom: '1.5rem' }}>
          We are committed to ensuring that the Smart Campus Lost & Found System is accessible to everyone, including persons with visual, auditory, cognitive, and motor impairments.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
          Accessibility Standards & Practices
        </h2>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <li>
            <strong style={{ color: '#fff' }}>Semantic Markup:</strong> Structured HTML elements (headers, landmarks, buttons, form labels) for seamless screen reader compatibility.
          </li>
          <li>
            <strong style={{ color: '#fff' }}>High Contrast Ratios:</strong> Carefully tuned foreground text and interactive elements exceeding WCAG AA requirements.
          </li>
          <li>
            <strong style={{ color: '#fff' }}>Keyboard Navigability:</strong> All forms, dialogs, and navigation menus are fully accessible without requiring a mouse.
          </li>
          <li>
            <strong style={{ color: '#fff' }}>Descriptive Alt Text:</strong> Uploaded images and icons include descriptive labels for assistive technologies.
          </li>
        </ul>

        <p>
          If you encounter any accessibility barriers while using our platform, please reach out via our <a href="/contact" style={{ color: '#818cf8', textDecoration: 'underline' }}>Campus Contact Page</a>.
        </p>
      </div>
    </div>
  );
}
