import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Mail, Smartphone, User, MessageSquare, CheckCircle2, QrCode, ArrowLeft, Clock, MapPin, Tag } from 'lucide-react';

export default function LostVerificationPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [requestDoc, setRequestDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      try {
        const res = await apiFetch(`/lost/verification-requests/${requestId}`);
        if (res.verification_request) {
          setRequestDoc(res.verification_request);
          return;
        }
      } catch (e) {}

      const data = await apiFetch('/lost/verification-requests');
      const target = (data.verification_requests || []).find(
        r => r.uuid === requestId || r.request_code === requestId || r.id === requestId
      );
      if (target) {
        setRequestDoc(target);
      } else {
        setError(`Verification request '${requestId}' not found or belongs to another user account.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p style={{ padding: '2rem' }}>Loading verification details...</p>;
  
  if (error || !requestDoc) return (
    <div style={{ maxWidth: 540, margin: '4rem auto', textAlign: 'center' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f87171', marginBottom: '0.75rem' }}>Verification Request Not Found</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {error || 'This verification request does not exist or was created under a different account.'}
        </p>
        <Link to="/lost/dashboard" className="btn btn-primary" style={{ width: '100%' }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Return to Lost Dashboard
        </Link>
      </div>
    </div>
  );

  const convId = requestDoc.conversation_id;
  const foundRep = requestDoc.found_report;

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      {/* Back navigation */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Dashboard
        </button>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-active">{requestDoc.status || 'ACTIVE'}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Ref: {requestDoc.request_code}</span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Item Verification Request</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Direct email-verified item matching & private campus communication
            </p>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.75rem', borderRadius: '50%', color: '#6366f1' }}>
            <ShieldCheck style={{ width: 34, height: 34 }} />
          </div>
        </div>

        {/* Found Item Details Card */}
        {foundRep && (
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.5rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <span className="badge badge-pending" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>Reported Found Match</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0' }}>{foundRep.item_name}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.4rem 0 0.75rem 0' }}>{foundRep.description}</p>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin style={{ width: 14, height: 14, color: '#38bdf8' }} /> Location: <strong>{foundRep.found_location}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Tag style={{ width: 14, height: 14, color: '#38bdf8' }} /> Category: <strong>{foundRep.category}</strong>
                  </span>
                  {foundRep.found_date && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock style={{ width: 14, height: 14, color: '#38bdf8' }} /> Date: <strong>{foundRep.found_date}</strong>
                    </span>
                  )}
                </div>
              </div>

              {foundRep.image_url && (
                <img
                  src={foundRep.image_url}
                  alt={foundRep.item_name}
                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)' }}
                />
              )}
            </div>
          </div>
        )}

        {/* Requester Contact / Verification Info */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.5rem', marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User style={{ width: 18, height: 18, color: '#38bdf8' }} /> Requester Contact Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>{requestDoc.requester_name || 'Campus Member'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Email</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem', color: '#38bdf8' }}>{requestDoc.requester_email || 'Verified on Campus'}</div>
            </div>
            {requestDoc.requester_mobile && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Mobile</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>{requestDoc.requester_mobile}</div>
              </div>
            )}
          </div>

          {requestDoc.description && (
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: 6 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                Verification Message / Description
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                {requestDoc.description}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons: Direct Email Application Communication */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Main mailto trigger */}
          <a
            href={`mailto:${requestDoc.requester_email || 'campuslostfound@campus.edu'}?subject=${encodeURIComponent(`Lost & Found: Verification Request [${requestDoc.request_code}] - ${foundRep?.item_name || 'Lost Item'}`)}&body=${encodeURIComponent(`Hello ${requestDoc.requester_name || ''},\n\nRegarding the Lost & Found item verification request (${requestDoc.request_code}) for "${foundRep?.item_name || 'Item'}":\n\n`)}`}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.95rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', textDecoration: 'none' }}
          >
            <Mail style={{ width: 20, height: 20 }} /> Open Email Application & Reply ({requestDoc.requester_email})
          </a>

          {/* Webmail Gmail Shortcut */}
          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(requestDoc.requester_email || '')}&su=${encodeURIComponent(`Lost & Found: Verification Request [${requestDoc.request_code}] - ${foundRep?.item_name || 'Lost Item'}`)}&body=${encodeURIComponent(`Hello ${requestDoc.requester_name || ''},\n\nRegarding the Lost & Found item verification request (${requestDoc.request_code}) for "${foundRep?.item_name || 'Item'}":\n\n`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
          >
            <Mail style={{ width: 16, height: 16 }} /> Open in Gmail (Browser)
          </a>

          <Link to="/lost/dashboard" className="btn btn-outline" style={{ textAlign: 'center', padding: '0.75rem' }}>
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
