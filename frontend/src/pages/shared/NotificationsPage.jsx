import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import {
  Bell,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  Check
} from 'lucide-react';

export default function NotificationsPage({ role = 'LOST' }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [role]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/notifications');
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.log('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifications();
    } catch (err) {
      console.log('Error marking read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      fetchNotifications();
    } catch (err) {
      console.log('Error marking all read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'AI_MATCH':
        return <Sparkles style={{ width: 18, height: 18, color: '#06b6d4' }} />;
      case 'VERIFICATION_REQUEST':
        return <ShieldCheck style={{ width: 18, height: 18, color: '#10b981' }} />;
      case 'NEW_MESSAGE':
        return <MessageSquare style={{ width: 18, height: 18, color: '#818cf8' }} />;
      default:
        return <AlertTriangle style={{ width: 18, height: 18, color: '#f59e0b' }} />;
    }
  };

  return (
    <PortalLayout
      role={role}
      title="Notifications & Activity"
      subtitle="System alerts for potential AI matches, verification notices, and incoming message replies"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-active">
            {unreadCount} Unread
          </span>
        </div>

        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn btn-outline btn-sm">
            <Check style={{ width: 14, height: 14 }} /> Mark All As Read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
          Loading your notification alerts...
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <Bell className="empty-state-icon" />
          <h3 className="empty-state-title">No Notifications Yet</h3>
          <p className="empty-state-desc">
            You're all caught up! When a new potential match or message is received, it will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {notifications.map((n) => {
            const isUnread = n.status === 'UNREAD';

            return (
              <div
                key={n.uuid}
                className="glass-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderLeft: isUnread ? '3px solid #6366f1' : '1px solid var(--border-color)',
                  background: isUnread ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.65rem', borderRadius: 10, marginTop: 2 }}>
                    {getIcon(n.type)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                        {n.title}
                      </h4>
                      {isUnread && (
                        <span className="badge badge-potential" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.4rem', lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {n.created_at ? new Date(n.created_at).toLocaleString() : 'Recent'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {n.link && (
                    <Link to={n.link} className="btn btn-outline btn-sm">
                      View <ArrowRight style={{ width: 12, height: 12 }} />
                    </Link>
                  )}
                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(n.uuid)}
                      className="btn btn-outline btn-sm"
                      title="Mark as read"
                    >
                      <Check style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PortalLayout>
  );
}
