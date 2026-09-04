import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Sparkles,
  Filter,
  MapPin,
  Calendar,
  Tag,
  ShieldCheck,
  ArrowRight,
  Eye,
  Send
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

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'ALL');
  const [location, setLocation] = useState('');
  const [itemType, setItemType] = useState('FOUND'); // search found items by default
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parsedQuery, setParsedQuery] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    handleSearch();
  }, [category, itemType]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    setParsedQuery(null);

    try {
      if (query.trim()) {
        // Natural language AI search
        const res = await apiFetch('/ai/natural-search', {
          method: 'POST',
          body: JSON.stringify({ query: query.trim() })
        });
        setParsedQuery(res.parsed_attributes || null);
        let items = (res.results || []).map(r => ({
          ...r.report,
          match_score: r.match_score,
          label: r.label
        }));

        if (category !== 'ALL') {
          items = items.filter(i => i.category?.toLowerCase() === category.toLowerCase());
        }
        if (location) {
          items = items.filter(i => (i.found_location || i.lost_location || '').toLowerCase().includes(location.toLowerCase()));
        }
        setResults(items);
      } else {
        // Direct list search
        const endpoint = itemType === 'LOST' ? '/lost/reports' : '/found/reports';
        const res = await apiFetch(endpoint);
        let items = res.reports || [];

        if (category !== 'ALL') {
          items = items.filter(i => i.category?.toLowerCase() === category.toLowerCase());
        }
        if (location) {
          items = items.filter(i => (i.found_location || i.lost_location || '').toLowerCase().includes(location.toLowerCase()));
        }
        setResults(items);
      }
    } catch (err) {
      console.log('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge badge-active" style={{ fontSize: '0.78rem', marginBottom: '0.75rem' }}>
          CAMPUS SMART SEARCH
        </span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Search Campus Lost & Found Items</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: 600, margin: '0 auto' }}>
          Type naturally like <em>"I lost a black Samsung phone near the library yesterday"</em> or filter by campus categories.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: 260 }}>
            <Search style={{ position: 'absolute', left: 14, top: 12, width: 18, height: 18, color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: 42 }}
              placeholder="Ask naturally or enter item name, brand, model..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
            <Sparkles style={{ width: 16, height: 16 }} />
            Search With AI
          </button>
        </div>

        {/* Filters Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
              Item Database
            </label>
            <select
              className="form-control"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
            >
              <option value="FOUND">Found Items (Looking to Recover)</option>
              <option value="LOST">Lost Reports (Looking to Return)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
              Category
            </label>
            <select
              className="form-control"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
              Campus Location
            </label>
            <input
              type="text"
              className="form-control"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              placeholder="e.g. Library, Science Hall..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
      </form>

      {/* AI Parsed Attributes Tag */}
      {parsedQuery && (
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <Sparkles style={{ width: 16, height: 16, color: '#818cf8' }} />
          <span style={{ color: 'var(--text-muted)' }}>AI Extracted Query Entities:</span>
          {parsedQuery.category && <span className="badge badge-active">Category: {parsedQuery.category}</span>}
          {parsedQuery.color && <span className="badge badge-matched">Color: {parsedQuery.color}</span>}
          {parsedQuery.location && <span className="badge badge-pending">Location: {parsedQuery.location}</span>}
        </div>
      )}

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          {loading ? 'Searching campus records...' : `Results (${results.length} items found)`}
        </h2>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Processing Multimodal AI Search...
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <Search className="empty-state-icon" />
          <h3 className="empty-state-title">No Matching Campus Items Found</h3>
          <p className="empty-state-desc">
            We couldn't find any items matching your criteria. Try adjusting your query or category filter.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <Link to="/lost/report" className="btn btn-lost btn-sm">Report Lost Item</Link>
            <Link to="/found/report" className="btn btn-found btn-sm">Report Found Item</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {results.map((item) => (
            <div key={item.uuid} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Image Preview */}
              <div style={{ height: 180, background: 'rgba(0,0,0,0.3)', position: 'relative' }}>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.item_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                    No Photo Uploaded
                  </div>
                )}
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: '0.35rem' }}>
                  <span className={`badge ${item.status === 'ACTIVE' ? 'badge-active' : 'badge-matched'}`}>
                    {item.status || 'ACTIVE'}
                  </span>
                  {item.match_score && (
                    <span className="badge badge-potential">
                      {item.match_score}% Potential Match
                    </span>
                  )}
                </div>
              </div>

              {/* Item Info */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {item.item_name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4, flex: 1 }}>
                  {item.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Tag style={{ width: 14, height: 14, color: '#38bdf8' }} />
                    <span>Category: <strong style={{ color: '#fff' }}>{item.category}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin style={{ width: 14, height: 14, color: '#f43f5e' }} />
                    <span>Location: <strong style={{ color: '#fff' }}>{item.found_location || item.lost_location || 'Campus'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar style={{ width: 14, height: 14, color: '#10b981' }} />
                    <span>Date: <strong style={{ color: '#fff' }}>{item.found_date || item.lost_date || 'Recent'}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <Link
                    to={`/items/${itemType.toLowerCase()}/${item.uuid}`}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Eye style={{ width: 14, height: 14 }} />
                    Details
                  </Link>
                  {itemType === 'FOUND' && (
                    <Link
                      to={`/verification/request/${item.uuid}`}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <Send style={{ width: 14, height: 14 }} />
                      Verify
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
