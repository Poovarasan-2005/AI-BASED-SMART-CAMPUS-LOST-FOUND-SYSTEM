import React from 'react';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 840, margin: '2rem auto', padding: '0 1.5rem 4rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge badge-active" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          CAMPUS CODE OF CONDUCT
        </span>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800 }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Authorized Campus Community Agreement
        </p>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
          1. Authorized Campus Access
        </h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Access to the Smart Campus Lost & Found System is reserved exclusively for enrolled students, active faculty, staff, and authorized campus affiliates. Accounts are verified via institutional email and OTP security.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
          2. Honest Reporting & Ownership Claims
        </h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Users agree to submit truthful, accurate descriptions of lost and found property. Fraudulent claims, impersonation, or attempt to misappropriate campus items will result in immediate suspension, disciplinary review, and referral to campus security authorities.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
          3. Prohibited Content
        </h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Users may not post offensive, commercial, defamatory, or non-lost-and-found items. Weaponry, illicit substances, or dangerous items must be immediately reported to Campus Police rather than listed on the platform.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
          4. Platform Moderation
        </h2>
        <p>
          Campus security administrators retain the full authority to moderate, hide, or archive listings, suspend violating accounts, and review audit logs to maintain campus safety.
        </p>
      </div>
    </div>
  );
}
