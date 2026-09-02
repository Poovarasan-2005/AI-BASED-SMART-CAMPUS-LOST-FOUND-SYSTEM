import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Mail, Smartphone, User, MessageSquare, Send, CheckCircle2, ArrowLeft, Lock, Info, Sparkles } from 'lucide-react';

export default function VerificationRequestPage() {
  const { foundReportId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const targetFoundId = foundReportId || searchParams.get('found_id') || searchParams.get('report_id') || '';
  const lostReportId = searchParams.get('lost_id') || '';

  const [foundItem, setFoundItem] = useState(null);
  const [loadingItem, setLoadingItem] = useState(true);

  // Form State
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.phone_number || user?.mobile || '9080667045');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (user) {
      if (!name && user.full_name) setName(user.full_name);
      if (!email && user.email) setEmail(user.email);
      if (!mobile && (user.phone_number || user.mobile)) setMobile(user.phone_number || user.mobile);
    }
  }, [user]);

  useEffect(() => {
    if (targetFoundId) {
      fetchFoundItemPreview();
    } else {
      setLoadingItem(false);
    }
  }, [targetFoundId]);

  const fetchFoundItemPreview = async () => {
    try {
      const res = await apiFetch(`/verification/found-report/${targetFoundId}`);
      if (res.found_report) {
        setFoundItem(res.found_report);
      }
    } catch (err) {
      console.log('Preview fetch error:', err);
    } finally {
      setLoadingItem(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Your Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('A valid Email ID is required.');
      return;
    }
    if (!mobile.trim()) {
      setError('Your Mobile Number is required.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a message or description explaining your verification request.');
      return;
    }
    if (!targetFoundId) {
      setError('Missing Found Item reference ID.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/verification/send-request', {
        method: 'POST',
        body: JSON.stringify({
          found_report_id: targetFoundId,
          lost_report_id: lostReportId || null,
          requester_name: name.trim(),
          requester_email: email.trim().toLowerCase(),
          requester_mobile: mobile.trim(),
          description: description.trim()
        })
      });

      setSuccessData(res);
    } catch (err) {
      setError(err.message || 'Failed to submit verification request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back
        </button>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.75rem', borderRadius: '50%', color: '#06b6d4' }}>
            <ShieldCheck style={{ width: 32, height: 32 }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Send Verification Request</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {user?.role === 'FOUND_USER'
                ? 'Send a secure verification notice to the person who reported the matching lost item.'
                : 'Send a secure verification request to the person who reported this item/person as found. Your request will be delivered to their verified email address.'}
            </p>
          </div>
        </div>

        {/* Found Item Preview Box */}
        {foundItem && (
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-active">Target Found Record</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>ID: {foundItem.uuid}</span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.25rem 0' }}>{foundItem.item_name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem 0' }}>{foundItem.description}</p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Location: <strong>{foundItem.found_location}</strong></span>
                  <span>Category: <strong>{foundItem.category}</strong></span>
                  {foundItem.found_date && <span>Found Date: <strong>{foundItem.found_date}</strong></span>}
                </div>
              </div>
              {foundItem.image_url && (
                <img
                  src={foundItem.image_url}
                  alt={foundItem.item_name}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}
                />
              )}
            </div>
          </div>
        )}

        {/* Success State */}
        {successData ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)' }}>
            <CheckCircle2 style={{ width: 52, height: 52, color: '#34d399', margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginBottom: '0.5rem' }}>
              Verification request sent successfully.
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 1.75rem auto', lineHeight: 1.5 }}>
              The found person has been notified by email. You can continue the conversation through the secure email conversation.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 6, maxWidth: 440, margin: '0 auto 1.5rem auto', textAlign: 'left', fontSize: '0.85rem' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <strong>Verification Reference:</strong> <span style={{ color: '#38bdf8' }}>{successData.verification_request_id}</span>
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                <strong>Status:</strong> <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>Delivered ✓✓</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(`Lost & Found: Verification Request [${successData.verification_request_id}]`)}&body=${encodeURIComponent(`Hello,\n\nI have submitted a verification request (${successData.verification_request_id}) regarding the found item on Campus Lost & Found.\n\n`)}`}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <Mail style={{ width: 18, height: 18 }} /> Open Email Application
              </a>
              <Link to={user?.role === 'FOUND_USER' ? '/found/dashboard' : '/lost/dashboard'} className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            {/* Requester Name */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <User style={{ width: 16, height: 16, color: '#38bdf8' }} /> Your Name
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Requester Email */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <Mail style={{ width: 16, height: 16, color: '#38bdf8' }} /> Your Email ID
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                The found person's email reply and verification alerts will be sent here.
              </span>
            </div>

            {/* Requester Mobile */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <Smartphone style={{ width: 16, height: 16, color: '#38bdf8' }} /> Your Mobile Number
              </label>
              <input
                type="tel"
                className="form-control"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>

            {/* Description / Message */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <MessageSquare style={{ width: 16, height: 16, color: '#38bdf8' }} /> Message / Description
              </label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Explain why you are contacting the person who reported the item/person as found"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Privacy note */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Lock style={{ width: 16, height: 16, color: '#10b981', flexShrink: 0 }} />
              <span>
                Zero-Trust Privacy: The found person's email is not displayed publicly. Your request and contact details will be delivered directly and securely to their inbox.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Send style={{ width: 18, height: 18 }} />
              {submitting ? 'Sending Verification Request...' : 'Send Verification Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
