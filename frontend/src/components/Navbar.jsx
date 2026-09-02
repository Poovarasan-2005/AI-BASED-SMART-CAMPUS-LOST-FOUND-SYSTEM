import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, MessageSquare, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const convLink = user?.role === 'LOST_USER' ? '/lost/conversations' : '/found/conversations';

  return (
    <nav className="navbar glass-card">
      <Link to="/" className="nav-brand">
        <ShieldCheck style={{ width: 28, height: 28, color: '#6366f1' }} />
        <span>Campus Lost & Found</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {user ? (
          <>
            <span className={`badge ${
              user.role === 'LOST_USER' ? 'badge-active' :
              user.role === 'FOUND_USER' ? 'badge-returned' : 'badge-matched'
            }`}>
              {user.role.replace('_', ' ')}
            </span>

            {user.role !== 'ADMIN' && (
              <Link to={convLink} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageSquare style={{ width: 16, height: 16, color: '#6366f1' }} />
                Conversations
              </Link>
            )}

            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {user.full_name} ({user.email})
            </span>

            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              <LogOut style={{ width: 16, height: 16 }} />
              Logout
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/lost/login" className="btn btn-lost" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Lost User Portal
            </Link>
            <Link to="/found/login" className="btn btn-found" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Found User Portal
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
