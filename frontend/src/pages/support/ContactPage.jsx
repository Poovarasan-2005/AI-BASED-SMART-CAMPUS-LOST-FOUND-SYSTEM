import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ maxWidth: 840, margin: '2rem auto', padding: '0 1.5rem 4rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span className="badge badge-active" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          CAMPUS ASSISTANCE
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Contact Campus Lost & Found</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 600, margin: '0.5rem auto 0 auto' }}>
          Need assistance or wish to report a high-value campus item? Our security team is available 24/7.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Contact Information */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Campus Headquarters</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <MapPin style={{ width: 20, height: 20, color: '#f43f5e', flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: '#fff' }}>Central Campus Security Desk</strong>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Main University Library, Ground Floor, Room 102</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Mail style={{ width: 20, height: 20, color: '#38bdf8', flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: '#fff' }}>Official Campus Helpdesk</strong>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>support@campuslostfound.edu</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Phone style={{ width: 20, height: 20, color: '#10b981', flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: '#fff' }}>Campus Hotline</strong>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>+1 (800) 555-CAMPUS (Ext. 404)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <CheckCircle2 style={{ width: 48, height: 48, color: '#34d399', margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>Inquiry Received</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                A campus security desk representative will reply to your campus email within 1 business day.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem' }}>Send an Inquiry</h2>

              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Campus Email</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                <Send style={{ width: 16, height: 16 }} /> Send Inquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
