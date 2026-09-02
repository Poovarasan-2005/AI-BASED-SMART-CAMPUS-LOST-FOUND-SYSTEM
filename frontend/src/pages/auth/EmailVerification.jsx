import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const role = searchParams.get('role') || 'lost';
  
  const [statusMsg, setStatusMsg] = useState('Verifying your email token...');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setStatusMsg('Missing verification token.');
      setLoading(false);
      return;
    }

    apiFetch('/email/verify', {
      method: 'POST',
      body: JSON.stringify({ token })
    })
      .then((res) => {
        setSuccess(true);
        setStatusMsg(res.message);
      })
      .catch((err) => {
        setSuccess(false);
        setStatusMsg(err.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={{ maxWidth: 440, margin: '4rem auto', textAlign: 'center' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        {loading ? (
          <p>Processing verification...</p>
        ) : success ? (
          <>
            <CheckCircle2 style={{ width: 48, height: 48, color: '#34d399', margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Email Verified!</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{statusMsg}</p>
            <Link to={role === 'found' ? '/found/login' : '/lost/login'} className="btn btn-primary" style={{ width: '100%' }}>
              Proceed to Sign In
            </Link>
          </>
        ) : (
          <>
            <AlertCircle style={{ width: 48, height: 48, color: '#f87171', margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Verification Failed</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{statusMsg}</p>
            <Link to="/" className="btn btn-outline" style={{ width: '100%' }}>Return to Home</Link>
          </>
        )}
      </div>
    </div>
  );
}
