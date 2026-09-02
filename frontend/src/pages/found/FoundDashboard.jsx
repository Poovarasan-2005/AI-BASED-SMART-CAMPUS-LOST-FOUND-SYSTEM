import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { PlusCircle, Sparkles, QrCode, ArrowRight, MessageSquare } from 'lucide-react';

export default function FoundDashboard() {
  const [reports, setReports] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const repData = await apiFetch('/found/reports');
      setReports(repData.reports || []);

      const vrData = await apiFetch('/found/verification-requests');
      setVerifications(vrData.verification_requests || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Found User Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Report items found on campus & initiate AI verification matching</p>
        </div>
        <Link to="/found/reports/create" className="btn btn-found">
          <PlusCircle style={{ width: 18, height: 18 }} />
          Report Found Item
        </Link>
      </div>

      {/* Reported Found Items */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>My Found Reports & AI Matching</h3>
        {reports.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>You have not submitted any found item reports yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {reports.map((rep) => (
              <div key={rep.uuid} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className={`badge ${rep.status === 'ACTIVE' ? 'badge-active' : 'badge-matched'}`}>{rep.status}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{rep.found_date}</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{rep.item_name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{rep.description}</p>
                <Link to={`/found/matches?report_id=${rep.uuid}`} className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Sparkles style={{ width: 16, height: 16 }} />
                  Run AI Multimodal Match
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Status Tracking */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Verification Requests</h3>
        {verifications.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>No active verification requests.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {verifications.map((vr) => (
              <div key={vr.uuid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1rem' }}>{vr.request_code}</strong>
                    <span className="badge badge-pending">{vr.status}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Found Item: {vr.found_report?.item_name || 'Found Record'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to="/found/conversations" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MessageSquare style={{ width: 14, height: 14 }} /> Open Conversation
                  </Link>
                  {vr.status === 'APPROVED' && (
                    <Link to={`/found/recovery/${vr.uuid}`} className="btn btn-found" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <QrCode style={{ width: 14, height: 14 }} /> Scan Handover QR
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
