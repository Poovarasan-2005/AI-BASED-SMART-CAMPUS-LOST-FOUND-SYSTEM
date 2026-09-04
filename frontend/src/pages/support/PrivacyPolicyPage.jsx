import React from 'react';
import { ShieldCheck, Lock, EyeOff } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: 840, margin: '2rem auto', padding: '0 1.5rem 4rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge badge-active" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          CAMPUS DATA PROTECTION
        </span>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Last updated: August 2026 • Campus Data Governance Standard
        </p>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
          1. Zero-Trust Personal Data Protection
        </h2>
        <p style={{ marginBottom: '1.5rem' }}>
          The Smart Campus Lost & Found System strictly isolates personal identifying information (PII). A reporting user's mobile number and verified campus email are never published in public search indices or item listings.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
          2. Information We Collect
        </h2>
        <p style={{ marginBottom: '1.5rem' }}>
          We collect account details (university email, mobile number, campus department, student/staff status), item specifications, location zones, and uploaded images for the sole purpose of matching and verifying lost campus property.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
          3. Secure In-App Communication
        </h2>
        <p style={{ marginBottom: '1.5rem' }}>
          All private conversation messages between lost item owners and finders are protected by server-enforced Object-Level Authorization (BOLA/IDOR prevention). Messages cannot be intercepted or accessed by third parties.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
          4. Image Storage & Retention
        </h2>
        <p>
          Uploaded item photographs are inspected for security (format validation, file size limits) and stored on secure local campus servers. Once an item is marked as RETURNED and the retention window passes, photos can be archived.
        </p>
      </div>
    </div>
  );
}
