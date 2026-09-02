import React from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ExplainableAIModal({ match, onClose }) {
  if (!match) return null;

  const { overall_match_score, ranking, score_breakdown, reasons, disclaimer } = match;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Explainable AI Match Breakdown</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI Match Confidence Analysis</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X style={{ width: 24, height: 24 }} />
          </button>
        </div>

        {/* Overall Score Badge */}
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{overall_match_score}%</div>
          <span className="badge badge-active" style={{ fontSize: '0.85rem' }}>
            {ranking} CONFIDENCE MATCH
          </span>
        </div>

        {/* Matching Criteria Reasons */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Why this item matches:</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {reasons && reasons.map((reason, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#34d399' }}>
                <CheckCircle style={{ width: 16, height: 16 }} />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Percentage Breakdown */}
        {score_breakdown && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Multimodal Scoring Breakdown:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: 6 }}>
                Image Similarity: <strong>{score_breakdown.image_similarity}%</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: 6 }}>
                Text Similarity: <strong>{score_breakdown.text_similarity}%</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: 6 }}>
                Features & Color: <strong>{score_breakdown.distinctive_features}%</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: 6 }}>
                Location Proximity: <strong>{score_breakdown.location_similarity}%</strong>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: '#fbbf24' }}>
          <AlertTriangle style={{ width: 18, height: 18, flexShrink: 0 }} />
          <span>{disclaimer}</span>
        </div>

        <button onClick={onClose} className="btn btn-outline" style={{ width: '100%', marginTop: '1.5rem' }}>
          Close Breakdown
        </button>
      </div>
    </div>
  );
}
