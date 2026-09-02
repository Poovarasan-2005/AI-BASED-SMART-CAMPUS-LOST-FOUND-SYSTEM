import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, uploadImage } from '../../services/api';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LostReportForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    item_name: 'Black Samsung Galaxy S24 Ultra',
    category: 'Mobile Phone',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    color: 'Black',
    serial_number: 'S24-ULTRA-88392',
    lost_date: '2026-08-25',
    lost_time: '13:30',
    lost_location: 'Library',
    description: 'Black Samsung phone with clear case lost in central reading room.',
    secret_attribute: 'Small blue star sticker inside the clear phone case'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imageQualityAlert, setImageQualityAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImageQualityAlert(null);

    // Instant OpenCV Quality Check (Section 19)
    try {
      const res = await uploadImage(file);
      if (!res.quality_passed) {
        setImageQualityAlert({ type: 'error', message: res.message });
      } else {
        setImageQualityAlert({ type: 'success', message: 'Image quality check passed! Clear resolution and brightness.' });
      }
    } catch (err) {
      console.log("Quality check error", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await apiFetch('/lost/reports', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      navigate('/lost/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Report Lost Item</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Provide item details and a private secret attribute for physical ownership verification.
        </p>

        {error && <div style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Item Name *</label>
              <input type="text" name="item_name" className="form-control" required value={formData.item_name} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select name="category" className="form-control" required value={formData.category} onChange={handleChange}>
                <option value="Mobile Phone">Mobile Phone</option>
                <option value="Backpack">Backpack / Bag</option>
                <option value="Laptop">Laptop / Tablet</option>
                <option value="Wallet">Wallet / Purse</option>
                <option value="Keys">Keys</option>
                <option value="Earphones">Earphones / Headphones</option>
                <option value="ID Card">ID Card</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Brand</label>
              <input type="text" name="brand" className="form-control" value={formData.brand} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Color *</label>
              <input type="text" name="color" className="form-control" required value={formData.color} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Serial Number</label>
              <input type="text" name="serial_number" className="form-control" value={formData.serial_number} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Campus Location *</label>
              <select name="lost_location" className="form-control" required value={formData.lost_location} onChange={handleChange}>
                <option value="Library">Central Library</option>
                <option value="Canteen">Campus Canteen</option>
                <option value="Main Block">Main Academic Block</option>
                <option value="Hostel">Student Hostel</option>
                <option value="Sports Ground">Sports Ground</option>
                <option value="Laboratory">Science Lab</option>
              </select>
            </div>
            <div className="form-group">
              <label>Lost Date *</label>
              <input type="date" name="lost_date" className="form-control" required value={formData.lost_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Approx. Time *</label>
              <input type="time" name="lost_time" className="form-control" required value={formData.lost_time} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Item Description *</label>
            <textarea name="description" className="form-control" rows="3" required value={formData.description} onChange={handleChange}></textarea>
          </div>

          {/* Secret Identifying Detail (Section 45) */}
          <div className="form-group" style={{ background: 'rgba(99,102,241,0.08)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-glow)' }}>
            <label style={{ color: '#818cf8', fontWeight: 700 }}>Private Secret Attribute (Ownership Verification)</label>
            <input
              type="text"
              name="secret_attribute"
              className="form-control"
              placeholder="e.g., 'Small blue star sticker inside clear case' or 'Keyring with letter S'"
              value={formData.secret_attribute}
              onChange={handleChange}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
              🔒 Kept strictly private. Used during verification to prove physical ownership.
            </span>
          </div>

          {/* OpenCV Image Quality Upload */}
          <div className="form-group">
            <label>Item Image Upload (Runs OpenCV Quality Check)</label>
            <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
          </div>

          {imageQualityAlert && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: imageQualityAlert.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: imageQualityAlert.type === 'error' ? '#f87171' : '#34d399',
              padding: '0.75rem', borderRadius: 6, fontSize: '0.85rem', marginBottom: '1.25rem'
            }}>
              {imageQualityAlert.type === 'error' ? <AlertCircle style={{ width: 18, height: 18 }} /> : <CheckCircle2 style={{ width: 18, height: 18 }} />}
              <span>{imageQualityAlert.message}</span>
            </div>
          )}

          <button type="submit" className="btn btn-lost" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Submitting Report...' : 'Submit Lost Item Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
