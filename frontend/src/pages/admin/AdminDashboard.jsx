import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';
import { ShieldCheck, Users, FileText, AlertTriangle, Activity, MapPin, PieChart, Lock, Unlock, X, CheckCircle2, Search, ExternalLink } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [recoveredItems, setRecoveredItems] = useState([]);
  const [allLostReports, setAllLostReports] = useState([]);
  const [allFoundReports, setAllFoundReports] = useState([]);

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'users', 'logs'
  const [activeModal, setActiveModal] = useState(null); // 'recovered', 'lost', 'found', null
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  if (loading) return <p style={{ padding: '2rem' }}>Loading Admin Moderation & Analytics Portal...</p>;

  // Recovery Rate Gauge Calculations
  const rateVal = metrics?.raw_recovery_rate || 0;
  const strokeDashoffset = 283 - (283 * rateVal) / 100;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Admin Moderation & Security Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time campus location analytics, user management, and security audit logs</p>
        </div>
        <span className="badge badge-matched" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
          ADMIN SESSION
        </span>
      </div>

      {/* Metric Cards - Interactive & Clickable */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          
          {/* CARD 1: RECOVERY RATE */}
          <div
            onClick={() => setActiveModal('recovered')}
            className="glass-card"
            style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', border: activeModal === 'recovered' ? '2px solid #34d399' : '1px solid var(--border-color)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recovery Rate</div>
              <span style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>Click details</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>{metrics.recovery_rate}</div>
          </div>

          {/* CARD 2: RECOVERED ITEMS */}
          <div
            onClick={() => setActiveModal('recovered')}
            className="glass-card"
            style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', border: activeModal === 'recovered' ? '2px solid #22d3ee' : '1px solid var(--border-color)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recovered Items</div>
              <span style={{ fontSize: '0.7rem', color: '#22d3ee', background: 'rgba(34,211,238,0.1)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>Click details</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22d3ee', marginTop: '0.25rem' }}>{metrics.recovered_items}</div>
          </div>

          {/* CARD 3: TOTAL LOST REPORTS */}
          <div
            onClick={() => setActiveModal('lost')}
            className="glass-card"
            style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', border: activeModal === 'lost' ? '2px solid #f43f5e' : '1px solid var(--border-color)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Lost Reports</div>
              <span style={{ fontSize: '0.7rem', color: '#f43f5e', background: 'rgba(244,63,94,0.1)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>Click details</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f43f5e', marginTop: '0.25rem' }}>{metrics.total_lost_reports}</div>
          </div>

          {/* CARD 4: TOTAL FOUND REPORTS */}
          <div
            onClick={() => setActiveModal('found')}
            className="glass-card"
            style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', border: activeModal === 'found' ? '2px solid #10b981' : '1px solid var(--border-color)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Found Reports</div>
              <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>Click details</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>{metrics.total_found_reports}</div>
          </div>
        </div>
      )}

      {/* RECOVERY RATE CHART STYLE VISUALIZER */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PieChart style={{ color: '#34d399', width: 20, height: 20 }} /> Recovery Rate Visual Analytics Chart
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '2rem', alignItems: 'center' }}>
          {/* Radial Donut Progress Ring */}
          <div style={{ position: 'relative', width: 150, height: 150, margin: '0 auto' }}>
            <svg width="150" height="150" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradientRing)"
                strokeWidth="10"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
              <defs>
                <linearGradient id="gradientRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>{metrics?.recovery_rate || '0%'}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RECOVERY RATE</div>
            </div>
          </div>

          {/* Comparative Progress Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Total Lost Items Reported</span>
                <strong style={{ color: '#f43f5e' }}>{metrics?.total_lost_reports || 0}</strong>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: '#f43f5e' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Total Found Items Reported</span>
                <strong style={{ color: '#10b981' }}>{metrics?.total_found_reports || 0}</strong>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, ((metrics?.total_found_reports || 0) / Math.max(1, metrics?.total_lost_reports || 1)) * 100)}%`, height: '100%', background: '#10b981' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Successfully Recovered & Returned Items</span>
                <strong style={{ color: '#22d3ee' }}>{metrics?.recovered_items || 0} ({metrics?.recovery_rate})</strong>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${rateVal}%`, height: '100%', background: 'linear-gradient(90deg, #34d399, #22d3ee)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button onClick={() => setActiveTab('analytics')} className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
          <MapPin style={{ width: 16, height: 16 }} /> Location & Category Analytics
        </button>
        <button onClick={() => setActiveTab('users')} className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
          <Users style={{ width: 16, height: 16 }} /> User Moderation ({usersList.length})
        </button>
        <button onClick={() => setActiveTab('logs')} className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
          <Activity style={{ width: 16, height: 16 }} /> Security Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: LOCATION & CATEGORY ANALYTICS */}
      {activeTab === 'analytics' && analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin style={{ color: '#f43f5e', width: 20, height: 20 }} /> Most Common Lost Locations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {analytics.most_common_lost_locations.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                  <span style={{ fontWeight: 600 }}>{item.location}</span>
                  <span className="badge badge-active">{item.count} Reports</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart style={{ color: '#06b6d4', width: 20, height: 20 }} /> Item Category Distribution
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {analytics.category_distribution.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                  <span style={{ fontWeight: 600 }}>{cat.category}</span>
                  <span className="badge badge-returned">{cat.count} Items</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MODERATION */}
      {activeTab === 'users' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>User Accounts & Role Permissions</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>User</th>
                  <th style={{ padding: '0.75rem' }}>Email</th>
                  <th style={{ padding: '0.75rem' }}>Role</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.uuid} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.full_name}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem' }}><span className="badge badge-matched">{u.role}</span></td>
                    <td style={{ padding: '0.75rem' }}><span className={`badge ${u.account_status === 'ACTIVE' ? 'badge-active' : 'badge-cancelled'}`}>{u.account_status}</span></td>
                    <td style={{ padding: '0.75rem' }}>
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleSuspend(u.uuid, u.account_status)}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: u.account_status === 'SUSPENDED' ? '#34d399' : '#f87171' }}
                        >
                          {u.account_status === 'SUSPENDED' ? <Unlock style={{ width: 14, height: 14 }} /> : <Lock style={{ width: 14, height: 14 }} />}
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

      {/* TAB 3: SECURITY AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Security Audit Log Trail</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.6rem' }}>Timestamp</th>
                  <th style={{ padding: '0.6rem' }}>Action</th>
                  <th style={{ padding: '0.6rem' }}>User ID</th>
                  <th style={{ padding: '0.6rem' }}>Resource</th>
                  <th style={{ padding: '0.6rem' }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '0.6rem', color: 'var(--text-dim)' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td style={{ padding: '0.6rem', fontWeight: 700, color: '#22d3ee' }}>{log.action}</td>
                    <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{log.user_id}</td>
                    <td style={{ padding: '0.6rem' }}>{log.resource_type}:{log.resource_id}</td>
                    <td style={{ padding: '0.6rem', color: 'var(--text-dim)' }}>{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: RECOVERED ITEMS & FOUND DETAILS */}
      {activeModal === 'recovered' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: 750, maxHeight: '85vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 style={{ width: 22, height: 22 }} /> Recovered Items & Found Details ({recoveredItems.length})
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verified matches completed with single-use QR handover</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {recoveredItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No recovered items logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recoveredItems.map((rec) => (
                  <div key={rec.id} style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(52,211,153,0.3)', padding: '1.25rem', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span className="badge badge-returned">{rec.status}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Recovery ID: {rec.recovery_id}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 6 }}>
                        <h5 style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.25rem' }}>Found Item Details</h5>
                        <div>Item Name: <strong>{rec.found_report?.item_name || 'Found Item'}</strong></div>
                        <div>Found Location: {rec.found_report?.found_location}</div>
                        <div>Category: {rec.found_report?.category}</div>
                        <div>Finder Name: {rec.found_user}</div>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 6 }}>
                        <h5 style={{ fontWeight: 700, color: '#22d3ee', marginBottom: '0.25rem' }}>Owner / Lost Details</h5>
                        <div>Item Name: <strong>{rec.lost_report?.item_name || 'Lost Item'}</strong></div>
                        <div>Lost Location: {rec.lost_report?.lost_location}</div>
                        <div>Owner Name: {rec.lost_user}</div>
                        <div>Verified OTP & Secret Check: Passed</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Complete registry of lost items submitted by campus members</p>
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
                    <th style={{ padding: '0.6rem' }}>Lost Location</th>
                    <th style={{ padding: '0.6rem' }}>Secret Attribute</th>
                    <th style={{ padding: '0.6rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allLostReports.map((item) => (
                    <tr key={item.uuid} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 700 }}>{item.item_name}</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{item.category}</td>
                      <td style={{ padding: '0.6rem' }}>{item.lost_location}</td>
                      <td style={{ padding: '0.6rem', color: '#22d3ee' }}>{item.secret_attribute || 'N/A'}</td>
                      <td style={{ padding: '0.6rem' }}>
                        <span className={`badge ${item.status === 'RETURNED' ? 'badge-returned' : item.status === 'MATCHED' ? 'badge-matched' : 'badge-active'}`}>
                          {item.status}
                        </span>
                      </td>
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
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Found item reports logged by finders and security officers</p>
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
                    <th style={{ padding: '0.6rem' }}>Found Location</th>
                    <th style={{ padding: '0.6rem' }}>Found Date</th>
                    <th style={{ padding: '0.6rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allFoundReports.map((item) => (
                    <tr key={item.uuid} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 700 }}>{item.item_name}</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{item.category}</td>
                      <td style={{ padding: '0.6rem' }}>{item.found_location}</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-dim)' }}>{item.found_date}</td>
                      <td style={{ padding: '0.6rem' }}>
                        <span className={`badge ${item.status === 'RETURNED' ? 'badge-returned' : item.status === 'MATCHED' ? 'badge-matched' : 'badge-active'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
