import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import {
  ShieldCheck,
  Search,
  Bell,
  LogOut,
  User,
  LayoutDashboard,
  HelpCircle,
  Info
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadNotifications();
      const interval = setInterval(fetchUnreadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await apiFetch('/notifications');
      if (res && typeof res.unread_count === 'number') {
        setUnreadCount(res.unread_count);
      }
    } catch (err) {
      // quiet fail for polling
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isLost = user?.role === 'LOST_USER';
  const isFound = user?.role === 'FOUND_USER';
  const isAdmin = user?.role === 'ADMIN';
  const portalPrefix = isLost ? '/lost' : isFound ? '/found' : '/admin';

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', padding: '0.45rem', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck style={{ width: 22, height: 22, color: '#fff' }} />
        </div>
        <div>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Smart Campus <span style={{ color: '#06b6d4' }}>Lost & Found</span>
          </span>
          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}>
            AI-Powered Campus Recovery
          </span>
        </div>
      </Link>

      {/* Main Nav Links */}
      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          Home
        </Link>
        <Link to="/search" className={`nav-link ${location.pathname === '/search' ? 'active' : ''}`}>
          <Search style={{ width: 14, height: 14, display: 'inline', marginRight: 4 }} />
          Search
        </Link>
        <Link to="/how-it-works" className={`nav-link ${location.pathname === '/how-it-works' ? 'active' : ''}`}>
          How It Works
        </Link>
        <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
          About
        </Link>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.75rem' }}>
            {/* Dashboard Link */}
            <Link
              to={`${portalPrefix}/dashboard`}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LayoutDashboard style={{ width: 14, height: 14 }} />
              Dashboard
            </Link>

            {/* Notification Bell */}
            {!isAdmin && (
              <Link
                to={`${portalPrefix}/notifications`}
                className="btn btn-outline btn-sm"
                style={{ position: 'relative', padding: '0.45rem 0.65rem' }}
                title="Notifications"
              >
                <Bell style={{ width: 16, height: 16 }} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: '#f43f5e',
                      color: '#fff',
                      borderRadius: '50%',
                      padding: '0.1rem 0.35rem',
                      fontSize: '0.65rem',
                      fontWeight: 800
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Role Badge */}
            <span
              className={`badge ${isLost ? 'badge-potential' : isFound ? 'badge-active' : 'badge-matched'}`}
              style={{ fontSize: '0.72rem' }}
            >
              {isLost ? 'LOST USER' : isFound ? 'FOUND USER' : 'ADMIN'}
            </span>

            {/* Profile */}
            <Link to={`${portalPrefix}/profile`} className="nav-link" title="My Profile" style={{ padding: '0.4rem' }}>
              <User style={{ width: 18, height: 18 }} />
            </Link>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              style={{ padding: '0.45rem 0.75rem', color: '#f87171' }}
              title="Sign Out"
            >
              <LogOut style={{ width: 14, height: 14 }} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.75rem' }}>
            <Link to="/lost/login" className="btn btn-lost btn-sm">
              Lost User
            </Link>
            <Link to="/found/login" className="btn btn-found btn-sm">
              Found User
            </Link>
            <Link to="/admin/login" className="btn btn-outline btn-sm">
              Admin
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
