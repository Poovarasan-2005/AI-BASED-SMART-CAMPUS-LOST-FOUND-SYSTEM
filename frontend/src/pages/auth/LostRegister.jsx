import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function LostRegister() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      const data = await apiFetch('/lost/register', {
        method: 'POST',
        body: JSON.stringify({ full_name: fullName, email, mobile, password, department })
      });
      setMsg(data.message);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 460, margin: '3rem auto' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>Lost User Registration</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
          Create an account to report lost items and receive OTP verification alerts.
        </p>

        {msg && <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.75rem', borderRadius: 6, fontSize: '0.85rem', marginBottom: '1rem' }}>{msg}</div>}
        {error && <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.75rem', borderRadius: 6, fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="form-control" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Campus Email</label>
            <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Real Mobile Phone Number</label>
            <input type="tel" className="form-control" placeholder="e.g. +91 98765 43210" required value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Department</label>
            <input type="text" className="form-control" required value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-lost" style={{ width: '100%', marginTop: '1rem' }}>Register Account</button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          Already registered? <Link to="/lost/login" style={{ color: '#f43f5e' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
