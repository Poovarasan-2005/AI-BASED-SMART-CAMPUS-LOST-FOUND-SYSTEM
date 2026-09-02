import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import NaturalSearchWidget from '../../components/NaturalSearchWidget';
import { PlusCircle, FileText, AlertCircle, ShieldCheck, ArrowRight, Mail } from 'lucide-react';

export default function LostDashboard() {
  const [reports, setReports] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const repData = await apiFetch('/lost/reports');
      setReports(repData.reports || []);

      const vrData = await apiFetch('/lost/verification-requests');
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Lost User Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage lost item reports & complete secure ownership verification</p>
        </div>
        <Link to="/lost/reports/create" className="btn btn-lost">
          <PlusCircle style={{ width: 18, height: 18 }} />
          Report Lost Item
        </Link>
      </div>

      {/* Verification Alerts Banner */}
      {verifications.length > 0 && (
        <div className="glass-card" style={{ borderLeft: '4px solid #38bdf8', padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle style={{ color: '#38bdf8', width: 24, height: 24 }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8' }}>Active Verification Notice</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                A verification notice has been matched for your item report. You can communicate directly through the authorized private conversation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Natural AI Search */}
      <NaturalSearchWidget />

      {/* Pending Verifications Table */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Incoming Verification Requests</h3>
        {verifications.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>No verification requests currently pending.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {verifications.map((vr) => (
              <div key={vr.uuid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1rem' }}>{vr.request_code}</strong>
                    <span className="badge badge-active">{vr.status || 'DELIVERED'}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Item: {vr.lost_report?.item_name || vr.found_report?.item_name || 'Lost Item'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/lost/verification/${vr.uuid}`} className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail style={{ width: 14, height: 14 }} /> Review & Reply via Email <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User's Lost Reports */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>My Reported Lost Items</h3>
        {reports.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>You have not submitted any lost item reports yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {reports.map((rep) => (
              <div key={rep.uuid} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className={`badge ${rep.status === 'ACTIVE' ? 'badge-active' : 'badge-matched'}`}>{rep.status}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{rep.lost_date}</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{rep.item_name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{rep.description}</p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Location: {rep.lost_location} | Category: {rep.category}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
