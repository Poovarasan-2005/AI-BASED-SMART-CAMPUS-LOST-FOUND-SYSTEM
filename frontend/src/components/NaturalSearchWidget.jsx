import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { Sparkles, Search, Send, CheckCircle2 } from 'lucide-react';

export default function NaturalSearchWidget() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await apiFetch('/ai/natural-search', {
        method: 'POST',
        body: JSON.stringify({ query })
      });
      setResults(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Sparkles style={{ color: '#06b6d4', width: 22, height: 22 }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Natural Language Campus Search</h3>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          type="text"
          className="form-control"
          placeholder="e.g., 'I lost my black bag near the library yesterday...'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          <Search style={{ width: 18, height: 18 }} />
          {loading ? 'Analyzing...' : 'Search'}
        </button>
      </form>

      {results && (
        <div style={{ marginTop: '1rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <strong>Extracted Attributes: </strong>
            Category: <span style={{ color: '#22d3ee' }}>{results.parsed_attributes.category || 'N/A'}</span> | 
            Color: <span style={{ color: '#22d3ee' }}>{results.parsed_attributes.color || 'N/A'}</span> | 
            Location: <span style={{ color: '#22d3ee' }}>{results.parsed_attributes.location || 'N/A'}</span>
          </div>

          {results.results.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>No potential matches found for this search.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {results.results.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{item.report.item_name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Found at {item.report.found_location} on {item.report.found_date}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-active">{item.match_score}% AI Similarity</span>
                    <Link
                      to={`/verification/request/${item.report.uuid}`}
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Send style={{ width: 13, height: 13 }} /> Send Verification Request
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
