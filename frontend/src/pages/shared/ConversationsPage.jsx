import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export default function ConversationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await apiFetch('/conversations');
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p style={{ padding: '2rem' }}>Loading active recovery conversations...</p>;

  const basePath = user?.role === 'LOST_USER' ? '/lost/conversations' : '/found/conversations';

  return (
    <div style={{ maxWidth: 750, margin: '2rem auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare style={{ color: '#6366f1', width: 26, height: 26 }} /> Private Recovery Conversations
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Secure in-app communication between verified Lost Owners & Finders</p>
        </div>
        <span className="badge badge-active">{conversations.length} Active Cases</span>
      </div>

      {error && <div style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</div>}

      {conversations.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Lock style={{ width: 40, height: 40, color: 'var(--text-dim)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Conversations Yet</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Private conversations are created automatically after ownership verification OTP and Lost User approval.
          </p>
          <Link to={user?.role === 'LOST_USER' ? '/lost/dashboard' : '/found/dashboard'} className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {conversations.map((c) => (
            <div
              key={c.uuid}
              onClick={() => navigate(`${basePath}/${c.uuid}`)}
              className="glass-card"
              style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-color)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className={`badge ${c.status === 'CLOSED' ? 'badge-returned' : 'badge-matched'}`}>{c.status}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{c.uuid}</span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>{c.item_name}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Participant: <strong>{c.other_participant_name}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', fontSize: '0.85rem', fontWeight: 600 }}>
                  Open Chat <ArrowRight style={{ width: 16, height: 16 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
