import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function FoundLogin() {
  const [email, setEmail] = useState('found.user@campus.edu');
  const [password, setPassword] = useState('FoundPass123!');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setUnverified(false);
    setLoading(true);
    try {
      const data = await apiFetch('/found/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      login(data.user, data.access_token);
      navigate('/found/dashboard');
    } catch (err) {
      setError(err.message);
      if (err.message.includes('unverified')) {
        setUnverified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDevAutoVerify = async () => {
    try {
      const res = await apiFetch('/dev/direct-verify', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setSuccessMsg(res.message);
      setError('');
      setUnverified(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: '4rem auto' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <ShieldCheck style={{ width: 32, height: 32, color: '#10b981' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Found User Portal</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Report found items & initiate verification matching</p>
        </div>

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: '#34d399', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 style={{ width: 18, height: 18 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            <div>{error}</div>
            {unverified && (
              <button
                type="button"
                onClick={handleDevAutoVerify}
                className="btn btn-primary"
                style={{ marginTop: '0.75rem', width: '100%', padding: '0.4rem', fontSize: '0.8rem' }}
              >
                Click Here to Auto-Verify Email ({email})
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Campus Email Address</label>
            <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-found" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In as Found User'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have a Found User account? <Link to="/found/register" style={{ color: '#10b981', fontWeight: 600 }}>Register Here</Link>
        </div>
      </div>
    </div>
  );
}
