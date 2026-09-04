import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import NaturalSearchWidget from '../../components/NaturalSearchWidget';
import {
  PlusCircle,
  FileText,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Bell,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Tag,
  MapPin,
  Calendar
} from 'lucide-react';

export default function FoundDashboard() {
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [matches, setMatches] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. My Found Items
      const repData = await apiFetch('/found/reports');
      setReports(repData.reports || []);

      // 2. AI Potential Matches (against lost items)
      const matchData = await apiFetch('/ai/match', {
        method: 'POST',
        body: JSON.stringify({ report_type: 'FOUND', min_confidence: 60 })
      });
      setMatches(matchData.matches || []);

      // 3. Verification Requests
      const vrData = await apiFetch('/found/verification-requests');
      setVerifications(vrData.verification_requests || []);

      // 4. Conversations
      const convData = await apiFetch('/conversations');
      setConversations(convData.conversations || []);

      // 5. Notifications
      const notifData = await apiFetch('/notifications');
      setNotifications(notifData.notifications || []);
      setUnreadCount(notifData.unread_count || 0);
    } catch (err) {
      console.log('Found Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const returnedCount = reports.filter(r => r.status === 'RETURNED').length;

  return (
    <PortalLayout
      role="FOUND"
      title="Found User Dashboard"
      subtitle="Manage items you've found, review AI potential lost matches, and respond to secure verification requests"
    >
      {/* 5-Metric Counter Cards (Section 20) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>My Found Items</span>
            <FileText style={{ width: 18, height: 18, color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{reports.length}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Potential Matches</span>
            <Sparkles style={{ width: 18, height: 18, color: '#06b6d4' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#06b6d4' }}>{matches.length}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Verification Requests</span>
            <ShieldCheck style={{ width: 18, height: 18, color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{verifications.length}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Unread Alerts</span>
            <Bell style={{ width: 18, height: 18, color: '#818cf8' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#818cf8' }}>{unreadCount}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Returned Items</span>
            <CheckCircle2 style={{ width: 18, height: 18, color: '#34d399' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>{returnedCount}</div>
        </div>
      </div>

      {/* AI Search Widget */}
      <NaturalSearchWidget />

      {/* Section 1: AI Potential Matches (Section 20) */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles style={{ width: 20, height: 20, color: '#06b6d4' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>AI Potential Lost Item Matches</h3>
          </div>
          <Link to="/found/matches" className="btn btn-outline btn-sm">
            View All ({matches.length}) <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>

        {matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            No potential lost matches detected at the moment. As campus members report lost possessions, matches will populate here automatically.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {matches.slice(0, 3).map(m => {
              const target = m.target_report || {};
              return (
                <div key={m.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span className="badge badge-potential" style={{ fontSize: '0.7rem' }}>
                      {m.overall_match_score}% Potential Match
                    </span>
                    <span className="badge badge-active" style={{ fontSize: '0.65rem' }}>
                      {target.status || 'Active'}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{target.item_name}</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.3, flex: 1 }}>
                    {target.description}
                  </p>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                    Location: {target.lost_location || 'Campus'}
                  </div>
                  <Link to={`/items/lost/${target.uuid}`} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                    View Matching Report
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Recent Found Items */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText style={{ width: 20, height: 20, color: '#10b981' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Recent Found Items</h3>
          </div>
          <Link to="/found/items" className="btn btn-outline btn-sm">
            View All ({reports.length}) <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>

        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            You have not submitted any found item reports yet.
            <div style={{ marginTop: '0.75rem' }}>
              <Link to="/found/report" className="btn btn-found btn-sm">Report Found Item</Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {reports.slice(0, 3).map(r => (
              <div key={r.uuid} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span className="badge badge-active">{r.status}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{r.found_date}</span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{r.item_name}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                  {r.description}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/items/found/${r.uuid}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                    Details
                  </Link>
                  <Link to={`/found/matches?report_id=${r.uuid}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    Matches
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Split Row: Verification Requests & Conversations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Verification Requests */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck style={{ width: 18, height: 18, color: '#f59e0b' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Incoming Requests</h3>
            </div>
            <Link to="/found/verification-requests" className="btn btn-outline btn-sm">
              All ({verifications.length})
            </Link>
          </div>

          {verifications.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem' }}>
              No pending verification requests from lost owners.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {verifications.slice(0, 3).map(vr => (
                <div key={vr.uuid} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.88rem' }}>{vr.request_code}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      From: {vr.requester_name}
                    </div>
                  </div>
                  <Link to={`/found/messages/${vr.conversation_id || vr.uuid}`} className="btn btn-outline btn-sm">
                    Reply
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversations */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare style={{ width: 18, height: 18, color: '#818cf8' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Active Conversations</h3>
            </div>
            <Link to="/found/messages" className="btn btn-outline btn-sm">
              All ({conversations.length})
            </Link>
          </div>

          {conversations.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem' }}>
              No active conversations yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {conversations.slice(0, 3).map(c => (
                <div key={c.uuid} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.88rem' }}>{c.item_name || 'Item Verification'}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      With: {c.other_participant_name || 'Lost Owner'}
                    </div>
                  </div>
                  <Link to={`/found/messages/${c.uuid}`} className="btn btn-outline btn-sm">
                    Open
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
