import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import ExplainableAIModal from '../../components/ExplainableAIModal';
import { Sparkles, Info, ShieldCheck, CheckCircle2, Send, MessageSquare } from 'lucide-react';

export default function FoundMatches() {
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('report_id');
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModalMatch, setActiveModalMatch] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [createdConvId, setCreatedConvId] = useState('');

  useEffect(() => {
    if (reportId) {
      fetchMatches();
    }
  }, [reportId]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/ai/match', {
        method: 'POST',
        body: JSON.stringify({ report_id: reportId, report_type: 'FOUND' })
      });
      setMatches(data.matches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickVerification = async (lostReportId) => {
    setError(''); setActionSuccess(''); setCreatedConvId('');
    try {
      const res = await apiFetch('/found/verification-requests', {
        method: 'POST',
        body: JSON.stringify({
          found_report_id: reportId,
          lost_report_id: lostReportId
        })
      });
      setActionSuccess(res.message);
      if (res.conversation_id) {
        setCreatedConvId(res.conversation_id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Sparkles style={{ width: 32, height: 32, color: '#06b6d4' }} />
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>AI Multimodal Match Results</h1>
          <p style={{ color: 'var(--text-muted)' }}>Weighted visual, text, location, and date/time similarity analysis</p>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 style={{ width: 20, height: 20 }} />
            <span>{actionSuccess}</span>
          </div>
          {createdConvId && (
            <button
              onClick={() => navigate(`/found/conversations/${createdConvId}`)}
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <MessageSquare style={{ width: 14, height: 14 }} /> Open Conversation
            </button>
          )}
        </div>
      )}

      {error && <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>{error}</div>}

      {loading ? (
        <p>Running Multimodal AI Matching Engine...</p>
      ) : matches.length === 0 ? (
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-dim)' }}>No active lost reports currently match this item's visual or location profile above threshold.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {matches.map((item, idx) => {
            const target = item.target_report;
            return (
              <div key={idx} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span className="badge badge-active">{item.overall_match_score}% AI Match</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8' }}>{item.ranking}</span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{target.item_name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{target.description}</p>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Lost Location: {target.lost_location} | Category: {target.category} | Lost Date: {target.lost_date}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 210 }}>
                  <button onClick={() => setActiveModalMatch(item)} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem' }}>
                    <Info style={{ width: 16, height: 16 }} /> Why this item matches
                  </button>

                  <button
                    onClick={() => handleQuickVerification(target.uuid)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem', padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <Send style={{ width: 15, height: 15 }} /> Send Verification Request
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ExplainableAIModal match={activeModalMatch} onClose={() => setActiveModalMatch(null)} />
    </div>
  );
}
