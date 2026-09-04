import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  ShieldCheck,
  Tag,
  MapPin,
  Calendar,
  Clock,
  Palette,
  Sparkles,
  Lock,
  Send,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function ItemDetailsPage() {
  const { type, id } = useParams(); // type is 'lost' or 'found'
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isFound = (type || '').toLowerCase() === 'found';

  useEffect(() => {
    fetchItemDetails();
  }, [type, id]);

  const fetchItemDetails = async () => {
    try {
      const endpoint = isFound ? `/found/reports/public/${id}` : `/lost/reports/public/${id}`;
      const res = await apiFetch(endpoint);
      if (res.report) {
        setItem(res.report);
      } else {
        setError('Item record not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load item details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '4rem auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading item specifications...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div style={{ maxWidth: 600, margin: '4rem auto', textAlign: 'center' }}>
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" style={{ color: '#f43f5e' }} />
          <h3 className="empty-state-title">Item Not Found</h3>
          <p className="empty-state-desc">{error || 'This campus item record does not exist or has been removed.'}</p>
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            <ArrowLeft style={{ width: 16, height: 16 }} /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Back Navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Previous
        </button>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem', overflow: 'hidden' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className={`badge ${isFound ? 'badge-active' : 'badge-potential'}`}>
                {isFound ? 'Found Item Record' : 'Lost Item Report'}
              </span>
              <span className="badge badge-matched">{item.status || 'ACTIVE'}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>ID: {item.uuid}</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{item.item_name}</h1>
          </div>

          {isFound && (
            <Link
              to={`/verification/request/${item.uuid}`}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}
            >
              <Send style={{ width: 16, height: 16 }} />
              Send Verification Request
            </Link>
          )}
        </div>

        {/* Media & Details Split */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          {/* Photo Preview */}
          <div>
            <div style={{
              width: '100%',
              height: 320,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-color)'
            }}>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.item_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                  <FileText style={{ width: 40, height: 40, margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem' }}>No item image was attached</p>
                </div>
              )}
            </div>
          </div>

          {/* Key Attributes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
                Item Specifications
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>Category</span>
                  <strong style={{ color: '#fff' }}>{item.category || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>Brand</span>
                  <strong style={{ color: '#fff' }}>{item.brand || 'Unbranded / Not Specified'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>Model</span>
                  <strong style={{ color: '#fff' }}>{item.model || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>Color</span>
                  <strong style={{ color: '#fff' }}>{item.color || 'N/A'}</strong>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
                Campus Location & Timeline
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>{isFound ? 'Found Location' : 'Lost Location'}</span>
                  <strong style={{ color: '#fff' }}>{item.found_location || item.lost_location || 'Campus'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>{isFound ? 'Found Date' : 'Lost Date'}</span>
                  <strong style={{ color: '#fff' }}>{item.found_date || item.lost_date || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>Time</span>
                  <strong style={{ color: '#fff' }}>{item.found_time || item.lost_time || 'Approximate'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description & Unique Features */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Detailed Description</h3>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {item.description || 'No additional narrative description provided.'}
          </p>
        </div>

        {item.unique_features && (
          <div style={{ marginBottom: '1.5rem', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles style={{ width: 16, height: 16 }} /> Unique Features & Marks
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: 0 }}>
              {item.unique_features}
            </p>
          </div>
        )}

        {item.additional_info && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>Additional Information</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {item.additional_info}
            </p>
          </div>
        )}

        {/* Zero-Trust Privacy Safeguard Notice (Section 12 & 26) */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}>
          <Lock style={{ width: 18, height: 18, color: '#10b981', flexShrink: 0 }} />
          <span>
            <strong>Zero-Trust Campus Privacy Policy:</strong> In compliance with campus privacy standards, personal contact numbers, private emails, and physical proof questions are protected. To connect with the reporting member, use the Send Verification Request action.
          </span>
        </div>
      </div>
    </div>
  );
}
