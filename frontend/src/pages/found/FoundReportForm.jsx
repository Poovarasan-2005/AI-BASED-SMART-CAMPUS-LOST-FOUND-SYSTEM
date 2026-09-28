import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, uploadImage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import {
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const CATEGORIES = [
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

export default function FoundReportForm() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Mobile Phone',
    description: '',
    brand: '',
    model: '',
    color: '',
    unique_features: '',
    serial_number: '',
    found_date: new Date().toISOString().split('T')[0],
    found_time: '12:00',
    found_location: 'Library',
    image_url: '',
    additional_info: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageQualityAlert, setImageQualityAlert] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageQualityAlert(null);
    setUploadingImage(true);

    const data = new FormData();
    data.append('file', file);

    try {
      const result = await uploadImage(file);

      if (result.success) {
        setFormData(prev => ({ ...prev, image_url: result.image_url }));
        setPreviewUrl(result.image_url);
        setImageQualityAlert({
          type: 'success',
          message: 'Image verified! Valid format & clear resolution detected.'
        });
      } else {
        setImageQualityAlert({
          type: 'error',
          message: result.message || 'Image quality too low (blurry or dark).'
        });
      }
    } catch (err) {
      setImageQualityAlert({
        type: 'error',
        message: err.message || 'Image upload failed.'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/found/reports', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      // Redirect to potential matches view to immediately show AI results
      navigate(`/found/matches?report_id=${res.report?.uuid || ''}`);
    } catch (err) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout
      role="FOUND"
      title="Report Found Item"
      subtitle="Help reunite a campus member with their lost possession. Our AI will automatically notify matching owners."
    >
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.85rem', borderRadius: 6, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Core Identification */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Item Name *</label>
                <input
                  type="text"
                  name="item_name"
                  className="form-control"
                  placeholder="e.g. Black Samsung Smartphone"
                  value={formData.item_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Category *</label>
                <select
                  name="category"
                  className="form-control"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Detailed Description / Observations *</label>
              <textarea
                name="description"
                rows={3}
                className="form-control"
                placeholder="Describe where and how you found the item, condition, distinguishing marks..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            {/* Brand, Model, Color */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Brand</label>
                <input
                  type="text"
                  name="brand"
                  className="form-control"
                  placeholder="e.g. Samsung, Apple, Casio"
                  value={formData.brand}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Model</label>
                <input
                  type="text"
                  name="model"
                  className="form-control"
                  placeholder="e.g. Galaxy S24, Air M2"
                  value={formData.model}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Color *</label>
                <input
                  type="text"
                  name="color"
                  className="form-control"
                  placeholder="e.g. Black, Silver, Blue"
                  value={formData.color}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Unique Features */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles style={{ width: 14, height: 14, color: '#06b6d4' }} /> Unique Features / Distinctive Details
              </label>
              <input
                type="text"
                name="unique_features"
                className="form-control"
                placeholder="e.g. Case sticker, phone ring holder, key tag"
                value={formData.unique_features}
                onChange={handleChange}
              />
            </div>

            {/* Date, Time, Location */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Found Date *</label>
                <input
                  type="date"
                  name="found_date"
                  className="form-control"
                  value={formData.found_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Found Time *</label>
                <input
                  type="time"
                  name="found_time"
                  className="form-control"
                  value={formData.found_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Found Location *</label>
                <input
                  type="text"
                  name="found_location"
                  className="form-control"
                  placeholder="e.g. Library 2nd floor desk, Science lab"
                  value={formData.found_location}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Image Upload with Live OpenCV Validation */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Item Photo (JPG, PNG, WEBP — Max 5MB)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                  className="form-control"
                  style={{ flex: 1, padding: '0.5rem' }}
                />
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  />
                )}
              </div>
              {uploadingImage && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Processing image & extracting OpenCV visual feature vectors...
                </span>
              )}
              {imageQualityAlert && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: imageQualityAlert.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: imageQualityAlert.type === 'success' ? '#34d399' : '#f87171',
                  border: `1px solid ${imageQualityAlert.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  {imageQualityAlert.type === 'success' ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : <AlertCircle style={{ width: 14, height: 14 }} />}
                  <span>{imageQualityAlert.message}</span>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label>Where is the item currently kept?</label>
              <textarea
                name="additional_info"
                rows={2}
                className="form-control"
                placeholder="e.g. Kept safely with me / handed over to Department Reception desk..."
                value={formData.additional_info}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="btn btn-found"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 700 }}
            >
              {loading ? 'Submitting & Searching Lost Database...' : 'Submit Found Item & Match Lost Items'}
              <ArrowRight style={{ width: 18, height: 18 }} />
            </button>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
