import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import PortalLayout from '../../components/PortalLayout';
import {
  ShieldCheck,
  Users,
  FileText,
  AlertTriangle,
  Activity,
  MapPin,
  PieChart,
  Lock,
  Unlock,
  X,
  CheckCircle2,
  Search,
  ExternalLink,
  Settings,
  History,
  Sparkles,
  Save
} from 'lucide-react';

export default function AdminDashboard({ view = 'dashboard' }) {
  const location = useLocation();

  // Derive initial tab from prop or URL
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/items')) return 'items';
    if (path.includes('/admin/matches')) return 'matches';
    if (path.includes('/admin/verification-requests')) return 'verifications';
    if (path.includes('/admin/reports')) return 'reports';
    if (path.includes('/admin/audit-logs')) return 'logs';
    if (path.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [recoveredItems, setRecoveredItems] = useState([]);
  const [allLostReports, setAllLostReports] = useState([]);
  const [allFoundReports, setAllFoundReports] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({
    ai_matching_threshold: 70,
    max_upload_size_mb: 5,
    auto_close_days: 30,
    require_email_verification: true
  });
  const [settingsStatus, setSettingsStatus] = useState('');

  const [activeModal, setActiveModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const dash = await apiFetch('/admin/dashboard');
      setMetrics(dash.metrics);

      const anal = await apiFetch('/admin/analytics');
      setAnalytics(anal);

      const uData = await apiFetch('/admin/users');
      setUsersList(uData.users || []);

      const logData = await apiFetch('/admin/audit-logs');
      setAuditLogs(logData.audit_logs || []);

      const recData = await apiFetch('/admin/recovered-items');
      setRecoveredItems(recData.recovered_items || []);

      const lostData = await apiFetch('/admin/all-lost-reports');
      setAllLostReports(lostData.lost_reports || []);

      const foundData = await apiFetch('/admin/all-found-reports');
      setAllFoundReports(foundData.found_reports || []);

      const vrData = await apiFetch('/admin/verification-requests');
      setVerificationRequests(vrData.verification_requests || []);

      const setRes = await apiFetch('/admin/settings');
      if (setRes.settings) {
        setPlatformSettings(setRes.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspend = async (userId, currentStatus) => {
    const action = currentStatus === 'SUSPENDED' ? 'ACTIVATE' : 'SUSPEND';
    try {
      await apiFetch('/admin/suspend-user', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, action })
      });
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleModerateItem = async (itemId, itemType, action) => {
    try {
      await apiFetch('/admin/moderate-item', {
        method: 'POST',
        body: JSON.stringify({ item_id: itemId, item_type: itemType, action })
      });
      alert(`Item ${action}ed successfully.`);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsStatus('');
    try {
      await apiFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(platformSettings)
      });
      setSettingsStatus('Settings updated successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <PortalLayout role="ADMIN" title="Admin Portal" subtitle="Loading administrative records...">
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Authenticating administrator privileges & fetching campus datasets...
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      role="ADMIN"
      title="Admin Moderation & Security Dashboard"
      subtitle="Real-time campus location analytics, user management, item moderation, and security audit logs"
    >
      {/* Metric Cards - Interactive & Clickable (Section 21) */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div
            onClick={() => setActiveModal('recovered')}
            className="glass-card"
            style={{ padding: '1.25rem', cursor: 'pointer', border: activeModal === 'recovered' ? '2px solid #34d399' : '1px solid var(--border-color)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recovery Rate</div>
              <span style={{ fontSize: '0.68rem', color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>Details</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>{metrics.recovery_rate}</div>
          </div>

          <div
            onClick={() => setActiveModal('lost')}
            className="glass-card"
            style={{ padding: '1.25rem', cursor: 'pointer', border: activeModal === 'lost' ? '2px solid #f43f5e' : '1px solid var(--border-color)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Lost Reports</div>
              <span style={{ fontSize: '0.68rem', color: '#f43f5e', background: 'rgba(244,63,94,0.1)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>{allLostReports.length}</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e', marginTop: '0.25rem' }}>{metrics.total_lost_reports}</div>
          </div>

          <div
            onClick={() => setActiveModal('found')}
            className="glass-card"
            style={{ padding: '1.25rem', cursor: 'pointer', border: activeModal === 'found' ? '2px solid #10b981' : '1px solid var(--border-color)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Found Reports</div>
              <span style={{ fontSize: '0.68rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>{allFoundReports.length}</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>{metrics.total_found_reports}</div>
          </div>

          <div
            onClick={() => setActiveTab('users')}
            className="glass-card"
            style={{ padding: '1.25rem', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campus Users</div>
              <span style={{ fontSize: '0.68rem', color: '#818cf8', background: 'rgba(129,140,248,0.1)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>Manage</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#818cf8', marginTop: '0.25rem' }}>{metrics.total_users}</div>
          </div>

          <div
            onClick={() => setActiveTab('verifications')}
            className="glass-card"
            style={{ padding: '1.25rem', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Verifications</div>
              <span style={{ fontSize: '0.68rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>Track</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>{metrics.pending_verifications}</div>
          </div>
        </div>
      )}

      {/* Tab Navigation Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { id: 'dashboard', label: 'Dashboard & Analytics' },
          { id: 'users', label: `Users (${usersList.length})` },
          { id: 'items', label: `Item Moderation (${allLostReports.length + allFoundReports.length})` },
          { id: 'verifications', label: `Verification Requests (${verificationRequests.length})` },
          { id: 'logs', label: `Security Logs (${auditLogs.length})` },
          { id: 'settings', label: 'Settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
              color: activeTab === tab.id ? '#818cf8' : 'var(--text-muted)',
              border: activeTab === tab.id ? '1px solid #6366f1' : '1px solid var(--border-color)',
              borderRadius: 8
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW: DASHBOARD & ANALYTICS */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Top Lost Locations */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin style={{ width: 18, height: 18, color: '#f43f5e' }} /> Most Common Lost Locations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {analytics?.most_common_lost_locations?.map((loc, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: '0.88rem' }}>
                  <span>{loc.location}</span>
                  <strong style={{ color: '#38bdf8' }}>{loc.count} reports</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart style={{ width: 18, height: 18, color: '#06b6d4' }} /> Category Distribution
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {analytics?.category_distribution?.map((cat, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: '0.88rem' }}>
                  <span>{cat.category}</span>
                  <strong style={{ color: '#34d399' }}>{cat.count} items</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>Campus User Management</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Full Name</th>
                  <th style={{ padding: '0.75rem' }}>Email</th>
                  <th style={{ padding: '0.75rem' }}>Role</th>
                  <th style={{ padding: '0.75rem' }}>Department</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.uuid} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>{u.full_name}</td>
                    <td style={{ padding: '0.75rem' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge badge-matched">{u.role}</span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{u.department || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${u.account_status === 'SUSPENDED' ? 'badge-cancelled' : 'badge-active'}`}>
                        {u.account_status || 'ACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleSuspend(u.uuid, u.account_status)}
                          className="btn btn-outline btn-sm"
                          style={{
                            color: u.account_status === 'SUSPENDED' ? '#34d399' : '#f87171',
                            borderColor: u.account_status === 'SUSPENDED' ? '#34d399' : '#f87171'
                          }}
                        >
                          {u.account_status === 'SUSPENDED' ? <Unlock style={{ width: 12, height: 12 }} /> : <Lock style={{ width: 12, height: 12 }} />}
                          {u.account_status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: ITEM MODERATION */}
      {activeTab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Lost Reports */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', color: '#f43f5e' }}>
              Reported Lost Items ({allLostReports.length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.65rem' }}>Item Name</th>
                    <th style={{ padding: '0.65rem' }}>Category</th>
                    <th style={{ padding: '0.65rem' }}>Location</th>
                    <th style={{ padding: '0.65rem' }}>Status</th>
                    <th style={{ padding: '0.65rem' }}>Moderation</th>
                  </tr>
                </thead>
                <tbody>
                  {allLostReports.map(item => (
                    <tr key={item.uuid} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.65rem', fontWeight: 700 }}>{item.item_name}</td>
                      <td style={{ padding: '0.65rem', color: 'var(--text-muted)' }}>{item.category}</td>
                      <td style={{ padding: '0.65rem' }}>{item.lost_location}</td>
                      <td style={{ padding: '0.65rem' }}>
                        <span className={`badge ${item.status === 'ACTIVE' ? 'badge-active' : 'badge-matched'}`}>{item.status}</span>
                      </td>
                      <td style={{ padding: '0.65rem', display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => handleModerateItem(item.uuid, 'LOST', 'APPROVE')} className="btn btn-outline btn-sm" style={{ color: '#34d399' }}>Approve</button>
                        <button onClick={() => handleModerateItem(item.uuid, 'LOST', 'FLAG')} className="btn btn-outline btn-sm" style={{ color: '#fbbf24' }}>Flag</button>
                        <button onClick={() => handleModerateItem(item.uuid, 'LOST', 'CANCEL')} className="btn btn-outline btn-sm" style={{ color: '#f87171' }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Found Reports */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', color: '#10b981' }}>
              Reported Found Items ({allFoundReports.length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.65rem' }}>Item Name</th>
                    <th style={{ padding: '0.65rem' }}>Category</th>
                    <th style={{ padding: '0.65rem' }}>Location</th>
                    <th style={{ padding: '0.65rem' }}>Status</th>
                    <th style={{ padding: '0.65rem' }}>Moderation</th>
                  </tr>
                </thead>
                <tbody>
                  {allFoundReports.map(item => (
                    <tr key={item.uuid} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.65rem', fontWeight: 700 }}>{item.item_name}</td>
                      <td style={{ padding: '0.65rem', color: 'var(--text-muted)' }}>{item.category}</td>
                      <td style={{ padding: '0.65rem' }}>{item.found_location}</td>
                      <td style={{ padding: '0.65rem' }}>
                        <span className={`badge ${item.status === 'ACTIVE' ? 'badge-active' : 'badge-matched'}`}>{item.status}</span>
                      </td>
                      <td style={{ padding: '0.65rem', display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => handleModerateItem(item.uuid, 'FOUND', 'APPROVE')} className="btn btn-outline btn-sm" style={{ color: '#34d399' }}>Approve</button>
                        <button onClick={() => handleModerateItem(item.uuid, 'FOUND', 'FLAG')} className="btn btn-outline btn-sm" style={{ color: '#fbbf24' }}>Flag</button>
                        <button onClick={() => handleModerateItem(item.uuid, 'FOUND', 'CANCEL')} className="btn btn-outline btn-sm" style={{ color: '#f87171' }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: VERIFICATION REQUESTS */}
      {activeTab === 'verifications' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>Campus Verification Requests</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Request Code</th>
                  <th style={{ padding: '0.75rem' }}>Requester</th>
                  <th style={{ padding: '0.75rem' }}>Email</th>
                  <th style={{ padding: '0.75rem' }}>Description</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {verificationRequests.map(vr => (
                  <tr key={vr.uuid} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>{vr.request_code}</td>
                    <td style={{ padding: '0.75rem' }}>{vr.requester_name}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{vr.requester_email}</td>
                    <td style={{ padding: '0.75rem', maxWidth: 260, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {vr.description}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge badge-active">{vr.status || 'DELIVERED'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: SECURITY AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History style={{ width: 18, height: 18, color: '#f59e0b' }} /> Security Audit Logs (Append-Only)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.65rem' }}>Timestamp</th>
                  <th style={{ padding: '0.65rem' }}>Action</th>
                  <th style={{ padding: '0.65rem' }}>User ID</th>
                  <th style={{ padding: '0.65rem' }}>Resource</th>
                  <th style={{ padding: '0.65rem' }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.65rem', color: 'var(--text-dim)' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td style={{ padding: '0.65rem', fontWeight: 700, color: '#38bdf8' }}>{log.action}</td>
                    <td style={{ padding: '0.65rem' }}>{log.user_id}</td>
                    <td style={{ padding: '0.65rem' }}>{log.resource_type}</td>
                    <td style={{ padding: '0.65rem', color: 'var(--text-dim)' }}>{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="glass-card" style={{ padding: '2rem', maxWidth: 640 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings style={{ width: 20, height: 20, color: '#818cf8' }} /> Platform Governance Settings
          </h3>

          {settingsStatus && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.75rem', borderRadius: 6, marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              {settingsStatus}
            </div>
          )}

          <form onSubmit={handleSaveSettings}>
            <div className="form-group">
              <label>Multimodal AI Match Threshold (Minimum Confidence %)</label>
              <input
                type="number"
                min="30"
                max="95"
                className="form-control"
                value={platformSettings.ai_matching_threshold}
                onChange={e => setPlatformSettings({ ...platformSettings, ai_matching_threshold: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label>Maximum Upload File Size (MB)</label>
              <input
                type="number"
                min="1"
                max="25"
                className="form-control"
                value={platformSettings.max_upload_size_mb}
                onChange={e => setPlatformSettings({ ...platformSettings, max_upload_size_mb: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label>Auto-Close Inactive Items (Days)</label>
              <input
                type="number"
                min="7"
                max="180"
                className="form-control"
                value={platformSettings.auto_close_days}
                onChange={e => setPlatformSettings({ ...platformSettings, auto_close_days: Number(e.target.value) })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
              <Save style={{ width: 16, height: 16 }} /> Save Platform Settings
            </button>
          </form>
        </div>
      )}

      {/* MODAL 1: RECOVERED ITEMS */}
      {activeModal === 'recovered' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: 850, maxHeight: '85vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 style={{ width: 22, height: 22 }} /> Recovered Campus Items ({recoveredItems.length})
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Digital receipts and verification audit records for successfully returned items</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem' }}>Item Name</th>
                    <th style={{ padding: '0.6rem' }}>Owner</th>
                    <th style={{ padding: '0.6rem' }}>Finder</th>
                    <th style={{ padding: '0.6rem' }}>Handover Method</th>
                    <th style={{ padding: '0.6rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recoveredItems.map((rec) => (
                    <tr key={rec.uuid} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 700 }}>{rec.lost_report?.item_name || rec.found_report?.item_name || 'Campus Item'}</td>
                      <td style={{ padding: '0.6rem' }}>{rec.lost_user}</td>
                      <td style={{ padding: '0.6rem' }}>{rec.found_user}</td>
                      <td style={{ padding: '0.6rem', color: '#38bdf8' }}>{rec.recovery_method || 'QR Handover'}</td>
                      <td style={{ padding: '0.6rem' }}>
                        <span className="badge badge-active">{rec.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ALL LOST REPORTS */}
      {activeModal === 'lost' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: 850, maxHeight: '85vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText style={{ width: 22, height: 22 }} /> Campus Lost Reports ({allLostReports.length})
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem' }}>Item Name</th>
                    <th style={{ padding: '0.6rem' }}>Category</th>
                    <th style={{ padding: '0.6rem' }}>Location</th>
                    <th style={{ padding: '0.6rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allLostReports.map(item => (
                    <tr key={item.uuid} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 700 }}>{item.item_name}</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{item.category}</td>
                      <td style={{ padding: '0.6rem' }}>{item.lost_location}</td>
                      <td style={{ padding: '0.6rem' }}><span className="badge badge-active">{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ALL FOUND REPORTS */}
      {activeModal === 'found' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: 850, maxHeight: '85vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck style={{ width: 22, height: 22 }} /> Campus Found Reports ({allFoundReports.length})
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem' }}>Item Name</th>
                    <th style={{ padding: '0.6rem' }}>Category</th>
                    <th style={{ padding: '0.6rem' }}>Location</th>
                    <th style={{ padding: '0.6rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allFoundReports.map(item => (
                    <tr key={item.uuid} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 700 }}>{item.item_name}</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{item.category}</td>
                      <td style={{ padding: '0.6rem' }}>{item.found_location}</td>
                      <td style={{ padding: '0.6rem' }}><span className="badge badge-active">{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
