import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import {
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle2,
  Mail,
  User,
  AlertCircle
} from 'lucide-react';

export default function VerificationRequestsListPage({ role = 'LOST' }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const isLost = role === 'LOST';

  useEffect(() => {
    fetchRequests();
  }, [role]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const endpoint = isLost ? '/lost/verification-requests' : '/found/verification-requests';
      const res = await apiFetch(endpoint);
      setRequests(res.verification_requests || []);
    } catch (err) {
      console.log('Error fetching verification requests:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout
      role={role}
      title="Verification Requests"
      subtitle={isLost
        ? 'Review outgoing requests sent to finders and incoming inquiries on your lost reports'
        : 'Review incoming requests from campus members seeking to verify found items'}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
          Loading verification requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <ShieldCheck className="empty-state-icon" style={{ color: '#10b981' }} />
          <h3 className="empty-state-title">No Active Verification Requests</h3>
          <p className="empty-state-desc">
            You currently have no pending verification requests. Check your potential AI matches to discover matching reports.
          </p>
          <Link to={isLost ? '/lost/matches' : '/found/matches'} className="btn btn-primary btn-sm">
            Explore AI Potential Matches
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map((vr) => {
            const isSeen = vr.status === 'SEEN';
            const isDelivered = vr.status === 'DELIVERED';
            const convId = vr.conversation_id || vr.uuid;
            const messagesPath = isLost ? `/lost/messages/${convId}` : `/found/messages/${convId}`;

            return (
              <div key={vr.uuid} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>
                      {vr.request_code || vr.uuid}
                    </span>
                    <span className={`badge ${isSeen ? 'badge-active' : isDelivered ? 'badge-matched' : 'badge-pending'}`}>
                      {isSeen ? 'Seen ✓✓' : isDelivered ? 'Delivered ✓✓' : (vr.status || 'Active')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Item: {vr.found_report?.item_name || vr.lost_report?.item_name || 'Found Campus Item'}
                  </h3>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span>Requester: <strong style={{ color: '#fff' }}>{vr.requester_name}</strong></span>
                    <span>Date: {vr.created_at ? new Date(vr.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>

                  {vr.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.5rem', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
                      "{vr.description}"
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <Link
                    to={messagesPath}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.55rem 1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <MessageSquare style={{ width: 16, height: 16 }} />
                    Open Secure Conversation
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PortalLayout>
  );
}
