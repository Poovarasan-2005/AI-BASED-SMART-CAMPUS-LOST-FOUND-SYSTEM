import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import {
  User,
  Mail,
  Smartphone,
  Building,
  GraduationCap,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function UserProfilePage({ role = 'LOST' }) {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Edit fields
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiFetch('/user/profile');
      if (res.user) {
        setProfile(res.user);
        setFullName(res.user.full_name || '');
        setMobile(res.user.mobile || '');
        setDepartment(res.user.department || '');
        setYear(res.user.year || '');
      }
    } catch (err) {
      console.log('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');
    setSaving(true);
    try {
      await apiFetch('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
          mobile,
          department,
          year
        })
      });
      setStatusMsg('Profile details updated successfully!');
      fetchProfile();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdError('');
    setChangingPwd(true);
    try {
      await apiFetch('/user/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      setPwdMsg('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwdError(err.message || 'Failed to change password.');
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <PortalLayout
      role={role}
      title="User Account Profile"
      subtitle="Manage your campus account details, contact verification, and security credentials"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
        {/* Profile Information */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.65rem', borderRadius: '50%', color: '#818cf8' }}>
              <User style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Campus Member Info</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Role: {profile?.role || user?.role}</span>
            </div>
          </div>

          {statusMsg && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.75rem', borderRadius: 6, marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              {statusMsg}
            </div>
          )}

          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.75rem', borderRadius: 6, marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="form-control"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Campus Verified Email</label>
              <input
                type="email"
                className="form-control"
                value={profile?.email || user?.email || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#34d399', marginTop: 2 }}>
                ✓ Verified Campus Email
              </span>
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                className="form-control"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Computer Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Year / Status</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 3rd Year / Staff"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Security & Password Change */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '0.65rem', borderRadius: '50%', color: '#f43f5e' }}>
              <KeyRound style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Account Security</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Password & session credentials</span>
            </div>
          </div>

          {pwdMsg && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.75rem', borderRadius: 6, marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              {pwdMsg}
            </div>
          )}

          {pwdError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.75rem', borderRadius: 6, marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              {pwdError}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password (min 6 characters)</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={changingPwd}
              className="btn btn-outline"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {changingPwd ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          {/* Security Note */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            marginTop: '2rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <strong>Security Safeguard:</strong> All passwords are encrypted with bcrypt. Your sessions use cryptographically signed JWT tokens with automatic expiration.
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
