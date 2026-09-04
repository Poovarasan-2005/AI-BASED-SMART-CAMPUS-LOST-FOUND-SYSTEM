import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import {
  PackageSearch,
  PlusCircle,
  Sparkles,
  Eye,
  Trash2,
  Calendar,
  MapPin,
  Tag,
  Filter
} from 'lucide-react';

export default function ItemsListPage({ role = 'LOST' }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isLost = role === 'LOST';
  const endpoint = isLost ? '/lost/reports' : '/found/reports';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchItems();
  }, [role]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(endpoint);
      setItems(res.reports || []);
    } catch (err) {
      console.log('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reportId) => {
    if (!window.confirm('Are you sure you want to cancel this report?')) return;
    try {
      await apiFetch(`${endpoint}/${reportId}`, { method: 'DELETE' });
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to cancel report.');
    }
  };

  const filteredItems = items.filter(item => {
    if (filterStatus === 'ALL') return true;
    return (item.status || 'ACTIVE').toUpperCase() === filterStatus;
  });

  return (
    <PortalLayout
      role={role}
      title={isLost ? 'My Reported Lost Items' : 'My Reported Found Items'}
      subtitle={isLost ? 'Track, update, and manage your reported lost items' : 'Track and manage the items you have reported as found on campus'}
    >
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter style={{ width: 16, height: 16, color: 'var(--text-dim)' }} />
          <select
            className="form-control"
            style={{ width: 160, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="POTENTIAL_MATCH">Potential Match</option>
            <option value="RETURNED">Returned</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <Link to={isLost ? '/lost/report' : '/found/report'} className={`btn ${isLost ? 'btn-lost' : 'btn-found'}`}>
          <PlusCircle style={{ width: 16, height: 16 }} />
          {isLost ? 'Report Lost Item' : 'Report Found Item'}
        </Link>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading your items...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <PackageSearch className="empty-state-icon" />
          <h3 className="empty-state-title">No Item Reports Found</h3>
          <p className="empty-state-desc">
            {filterStatus === 'ALL'
              ? `You have not submitted any ${isLost ? 'lost' : 'found'} item reports yet.`
              : `No item reports match status '${filterStatus}'.`}
          </p>
          <Link to={isLost ? '/lost/report' : '/found/report'} className={`btn ${isLost ? 'btn-lost' : 'btn-found'}`}>
            <PlusCircle style={{ width: 16, height: 16 }} />
            {isLost ? 'Report Lost Item' : 'Report Found Item'}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredItems.map((item) => (
            <div key={item.uuid} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Photo */}
              <div style={{ height: 160, background: 'rgba(0,0,0,0.3)', position: 'relative' }}>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.item_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    No Photo Attached
                  </div>
                )}
                <div style={{ position: 'absolute', top: 10, left: 10 }}>
                  <span className={`badge ${
                    item.status === 'ACTIVE' ? 'badge-active' :
                    item.status === 'RETURNED' ? 'badge-returned' :
                    item.status === 'CANCELLED' ? 'badge-cancelled' : 'badge-matched'
                  }`}>
                    {item.status || 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Details */}
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
                    <span>Location: <strong style={{ color: '#fff' }}>{item.lost_location || item.found_location}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar style={{ width: 14, height: 14, color: '#10b981' }} />
                    <span>Date: <strong style={{ color: '#fff' }}>{item.lost_date || item.found_date}</strong></span>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <Link
                    to={`/items/${isLost ? 'lost' : 'found'}/${item.uuid}`}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Eye style={{ width: 14, height: 14 }} /> Details
                  </Link>

                  <Link
                    to={`/${isLost ? 'lost' : 'found'}/matches?report_id=${item.uuid}`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Sparkles style={{ width: 14, height: 14 }} /> Matches
                  </Link>

                  {item.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleCancel(item.uuid)}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '0.45rem', color: '#f87171' }}
                      title="Cancel Report"
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
