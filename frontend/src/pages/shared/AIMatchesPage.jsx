import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import ExplainableAIModal from '../../components/ExplainableAIModal';
import {
  Sparkles,
  Filter,
  CheckCircle2,
  Send,
  Eye,
  Calendar,
  MapPin,
  Tag,
  AlertCircle,
  HelpCircle,
  ArrowUpDown
} from 'lucide-react';

const CATEGORIES = [
  'ALL',
  'Mobile Phone',
  'Laptop',
  'Tablet',
  'Wallet',
  'ID Card',
  'College ID',
  'Bag',
  'Keys',
  'Books',
  'Documents',
  'Electronics',
  'Accessories',
  'Other'
];

export default function AIMatchesPage({ role = 'LOST' }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const reportIdParam = searchParams.get('report_id') || 'ALL';

  const isLost = role === 'LOST';

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchForModal, setSelectedMatchForModal] = useState(null);

  // Filters (Section 9)
  const [sortBy, setSortBy] = useState('confidence'); // 'confidence' or 'recent'
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [minConfidence, setMinConfidence] = useState(0);

  useEffect(() => {
    fetchMatches();
  }, [reportIdParam, role]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/ai/match', {
        method: 'POST',
        body: JSON.stringify({
          report_id: reportIdParam,
          report_type: isLost ? 'LOST' : 'FOUND',
          min_confidence: 0
        })
      });
      setMatches(res.matches || []);
    } catch (err) {
      console.log('Error fetching AI matches:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredMatches = matches
    .filter(m => {
      const target = m.target_report || {};
      if (filterCategory !== 'ALL' && (target.category || '').toLowerCase() !== filterCategory.toLowerCase()) {
        return false;
      }
      if (filterLocation && !(target.found_location || target.lost_location || '').toLowerCase().includes(filterLocation.toLowerCase())) {
        return false;
      }
      if (filterStatus !== 'ALL' && (target.status || 'ACTIVE').toUpperCase() !== filterStatus) {
        return false;
      }
      if (m.overall_match_score < minConfidence) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'confidence') {
        return b.overall_match_score - a.overall_match_score;
      } else {
        const dateA = a.target_report?.created_at || '';
        const dateB = b.target_report?.created_at || '';
        return dateB.localeCompare(dateA);
      }
    });

  return (
    <PortalLayout
      role={role}
      title="AI Potential Matches"
      subtitle="Multimodal AI probabilistic comparisons based on visual features, brand, color, location, and reporting timeline"
    >
      {/* Disclaimer Banner (Section 8) */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.84rem',
        color: 'var(--text-muted)'
      }}>
        <HelpCircle style={{ width: 18, height: 18, color: '#818cf8', flexShrink: 0 }} />
        <span>
          <strong>Important AI Compliance:</strong> AI results indicate probabilistic similarity and are strictly classified as <strong>"POTENTIAL MATCHES"</strong>. Final recovery requires physical verification and confirmation.
        </span>
      </div>

      {/* Filter Toolbar (Section 9) */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
              Sort By
            </label>
            <select
              className="form-control"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="confidence">Highest Confidence</option>
              <option value="recent">Most Recent Date</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
              Category
            </label>
            <select
              className="form-control"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
              Location Filter
            </label>
            <input
              type="text"
              className="form-control"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              placeholder="Filter campus zone..."
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
              Min Confidence Score ({minConfidence}%)
            </label>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              style={{ width: '100%', marginTop: '0.4rem' }}
            />
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
          Computing Multimodal AI feature scores across campus reports...
        </div>
      ) : filteredMatches.length === 0 ? (
        /* Empty State strictly matching Section 30 */
        <div className="empty-state">
          <Sparkles className="empty-state-icon" style={{ color: '#06b6d4' }} />
          <h3 className="empty-state-title">NO POTENTIAL MATCHES</h3>
          <p className="empty-state-desc">
            We couldn't find a potential match yet. We'll continue looking as new items are reported.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <Link to={isLost ? '/lost/report' : '/found/report'} className={`btn ${isLost ? 'btn-lost' : 'btn-found'} btn-sm`}>
              {isLost ? 'Report Another Lost Item' : 'Report Another Found Item'}
            </Link>
            <Link to="/search" className="btn btn-outline btn-sm">
              Search All Items
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredMatches.map((match) => {
            const target = match.target_report || {};
            const isFoundTarget = match.target_type === 'FOUND';

            return (
              <div key={match.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Photo Header */}
                <div style={{ height: 180, background: 'rgba(0,0,0,0.35)', position: 'relative' }}>
                  {target.image_url ? (
                    <img
                      src={target.image_url}
                      alt={target.item_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      No Photo Available
                    </div>
                  )}

                  {/* Confidence Badge */}
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <button
                      onClick={() => setSelectedMatchForModal(match)}
                      className="badge"
                      style={{
                        background: match.overall_match_score >= 90 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(99, 102, 241, 0.9)',
                        color: '#fff',
                        cursor: 'pointer',
                        border: 'none',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 800
                      }}
                      title="Click to view explainable AI breakdown"
                    >
                      <Sparkles style={{ width: 13, height: 13 }} />
                      {match.overall_match_score}% Potential Match
                    </button>
                  </div>

                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <span className="badge badge-active">
                      POTENTIAL MATCH
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                      {target.item_name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {target.description}
                    </p>
                  </div>

                  {/* Matching Factors (Section 8 & 9) */}
                  <div style={{
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.04em' }}>
                      Matching Factors
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {match.reasons && match.reasons.length > 0 ? (
                        match.reasons.slice(0, 4).map((r, i) => (
                          <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle2 style={{ width: 14, height: 14, color: '#34d399', flexShrink: 0 }} />
                            <span>{r.replace('✓ ', '')}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          Contextual and keyword proximity detected.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tag style={{ width: 13, height: 13, color: '#38bdf8' }} />
                      <span>Category: <strong style={{ color: '#fff' }}>{target.category}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin style={{ width: 13, height: 13, color: '#f43f5e' }} />
                      <span>Location: <strong style={{ color: '#fff' }}>{target.found_location || target.lost_location || 'Campus'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar style={{ width: 13, height: 13, color: '#10b981' }} />
                      <span>Date: <strong style={{ color: '#fff' }}>{target.found_date || target.lost_date || 'Recent'}</strong></span>
                    </div>
                  </div>

                  {/* Actions (Section 9) */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <Link
                      to={`/items/${isFoundTarget ? 'found' : 'lost'}/${target.uuid}`}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1 }}
                    >
                      <Eye style={{ width: 14, height: 14 }} />
                      View Details
                    </Link>

                    {isFoundTarget ? (
                      <Link
                        to={`/verification/request/${target.uuid}?lost_id=${match.my_report?.uuid || ''}`}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                      >
                        <Send style={{ width: 14, height: 14 }} />
                        Send Verification Request
                      </Link>
                    ) : (
                      <Link
                        to={`/verification/request/${match.my_report?.uuid || ''}?lost_id=${target.uuid}`}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                      >
                        <Send style={{ width: 14, height: 14 }} />
                        Verify Match
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Explainable AI Modal */}
      {selectedMatchForModal && (
        <ExplainableAIModal
          match={selectedMatchForModal}
          onClose={() => setSelectedMatchForModal(null)}
        />
      )}
    </PortalLayout>
  );
}
