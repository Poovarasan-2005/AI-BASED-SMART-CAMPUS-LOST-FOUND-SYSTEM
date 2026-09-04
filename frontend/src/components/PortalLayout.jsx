import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  PackageSearch,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Users,
  FileCheck,
  AlertTriangle,
  History,
  Settings,
  Search,
  ChevronRight
} from 'lucide-react';

export default function PortalLayout({ role = 'LOST', title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isLost = role === 'LOST';
  const isFound = role === 'FOUND';
  const isAdmin = role === 'ADMIN';

  const prefix = isLost ? '/lost' : isFound ? '/found' : '/admin';

  return (
    <div className="portal-container">
      {/* Sidebar Navigation */}
      <aside className="portal-sidebar">
        <div style={{ padding: '0.5rem 0.75rem 1rem 0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              className={`badge ${isLost ? 'badge-potential' : isFound ? 'badge-active' : 'badge-matched'}`}
              style={{ fontSize: '0.7rem' }}
            >
              {isLost ? 'Lost Owner Portal' : isFound ? 'Found Finder Portal' : 'Admin Security Portal'}
            </span>
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
            {user?.full_name || 'Campus User'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            {user?.email || ''}
          </div>
        </div>

        <div className="portal-sidebar-title">Navigation</div>

        {/* Common & Role Specific Links */}
        <NavLink to={`${prefix}/dashboard`} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard style={{ width: 18, height: 18 }} />
          <span>Dashboard</span>
        </NavLink>

        {!isAdmin && (
          <>
            <NavLink to={`${prefix}/report`} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <PlusCircle style={{ width: 18, height: 18 }} />
              <span>{isLost ? 'Report Lost Item' : 'Report Found Item'}</span>
            </NavLink>

            <NavLink to={`${prefix}/items`} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <PackageSearch style={{ width: 18, height: 18 }} />
              <span>{isLost ? 'My Lost Items' : 'My Found Items'}</span>
            </NavLink>

            <NavLink to={`${prefix}/matches`} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <Sparkles style={{ width: 18, height: 18, color: '#06b6d4' }} />
              <span>AI Potential Matches</span>
            </NavLink>

            <NavLink to={`${prefix}/verification-requests`} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <ShieldCheck style={{ width: 18, height: 18, color: '#10b981' }} />
              <span>Verification Requests</span>
            </NavLink>

            <NavLink to={`${prefix}/messages`} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <MessageSquare style={{ width: 18, height: 18, color: '#818cf8' }} />
              <span>Private Messages</span>
            </NavLink>

            <NavLink to={`${prefix}/notifications`} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <Bell style={{ width: 18, height: 18, color: '#f59e0b' }} />
              <span>Notifications</span>
            </NavLink>

            <NavLink to={`${prefix}/profile`} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <User style={{ width: 18, height: 18 }} />
              <span>Account Profile</span>
            </NavLink>
          </>
        )}

        {isAdmin && (
          <>
            <NavLink to="/admin/users" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <Users style={{ width: 18, height: 18 }} />
              <span>User Management</span>
            </NavLink>

            <NavLink to="/admin/items" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <PackageSearch style={{ width: 18, height: 18 }} />
              <span>Item Moderation</span>
            </NavLink>

            <NavLink to="/admin/matches" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <Sparkles style={{ width: 18, height: 18, color: '#06b6d4' }} />
              <span>AI Potential Matches</span>
            </NavLink>

            <NavLink to="/admin/verification-requests" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <ShieldCheck style={{ width: 18, height: 18, color: '#10b981' }} />
              <span>Verification Requests</span>
            </NavLink>

            <NavLink to="/admin/reports" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <AlertTriangle style={{ width: 18, height: 18, color: '#f87171' }} />
              <span>Abuse & Reports</span>
            </NavLink>

            <NavLink to="/admin/audit-logs" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <History style={{ width: 18, height: 18 }} />
              <span>Audit Logs</span>
            </NavLink>

            <NavLink to="/admin/settings" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <Settings style={{ width: 18, height: 18 }} />
              <span>Platform Settings</span>
            </NavLink>
          </>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <Link to="/search" className="sidebar-nav-item">
            <Search style={{ width: 18, height: 18 }} />
            <span>Search Campus</span>
          </Link>
          <button
            onClick={handleLogout}
            className="sidebar-nav-item"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <LogOut style={{ width: 18, height: 18, color: '#f43f5e' }} />
            <span style={{ color: '#f43f5e' }}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="portal-content">
        {(title || subtitle) && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
              <Link to="/">Campus</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <span>{isLost ? 'Lost Portal' : isFound ? 'Found Portal' : 'Admin'}</span>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <span style={{ color: 'var(--text-main)' }}>{title}</span>
            </div>
            {title && <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff' }}>{title}</h1>}
            {subtitle && <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
