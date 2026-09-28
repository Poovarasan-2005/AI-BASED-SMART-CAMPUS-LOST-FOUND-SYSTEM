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
  Lock,
  ArrowRight,
  FileText
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

export default function LostReportForm() {
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
    lost_date: new Date().toISOString().split('T')[0],
    lost_time: '12:00',
    lost_location: 'Library',
    image_url: '',
    additional_info: '',
    secret_attribute: ''
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
      const res = await apiFetch('/lost/reports', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      // Navigate to potential matches to show AI results immediately!
      navigate(`/lost/matches?report_id=${res.report?.uuid || ''}`);
    } catch (err) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout
      role="LOST"
      title="Report Lost Item"
      subtitle="Submit item details. Our Multimodal AI will immediately analyze campus records to find potential matches."
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
                  placeholder="e.g. Black Samsung Galaxy S24"
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
              <label>Detailed Description *</label>
              <textarea
                name="description"
                rows={3}
                className="form-control"
                placeholder="Describe appearance, condition, case/cover, contents..."
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
                  placeholder="e.g. S24 Ultra, Air M2"
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
                  placeholder="e.g. Black, Navy Blue, Silver"
                  value={formData.color}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Unique Features */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles style={{ width: 14, height: 14, color: '#06b6d4' }} /> Unique Features / Distinguishing Marks
              </label>
              <input
                type="text"
                name="unique_features"
                className="form-control"
                placeholder="e.g. Small star sticker on case, scratch on screen, custom keychain"
                value={formData.unique_features}
                onChange={handleChange}
              />
            </div>

            {/* Date, Time, Location */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Lost Date *</label>
                <input
                  type="date"
                  name="lost_date"
                  className="form-control"
                  value={formData.lost_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Lost Time *</label>
                <input
                  type="time"
                  name="lost_time"
                  className="form-control"
                  value={formData.lost_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Lost Location *</label>
                <input
                  type="text"
                  name="lost_location"
                  className="form-control"
                  placeholder="e.g. Central Library 2nd Floor, Science Hall"
                  value={formData.lost_location}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Image Upload with Live OpenCV Quality Validation */}
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
            <div className="form-group">
              <label>Additional Information</label>
              <textarea
                name="additional_info"
                rows={2}
                className="form-control"
                placeholder="Any further context (e.g. circumstances, whom you were with)..."
                value={formData.additional_info}
                onChange={handleChange}
              />
            </div>

            {/* Private Secret Attribute for Ownership Proof */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              marginBottom: '1.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#818cf8', fontWeight: 700 }}>
                <Lock style={{ width: 16, height: 16 }} />
                <span>Private Ownership Proof Attribute</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                A hidden detail known ONLY to you (e.g. phone lock screen wallpaper, engraving, secret pocket contents). This is never shown to other users.
              </p>
              <input
                type="text"
                name="secret_attribute"
                className="form-control"
                placeholder="e.g. Wallpaper is a picture of a golden retriever in snow"
                value={formData.secret_attribute}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="btn btn-lost"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 700 }}
            >
              {loading ? 'Submitting & Initiating AI Match Engine...' : 'Submit Lost Report & Discover Matches'}
              <ArrowRight style={{ width: 18, height: 18 }} />
            </button>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
