import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, FolderLock, CreditCard, Settings, ShieldCheck, LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = ({ userRole, onLogout }) => {
  const { user } = useAuth();
  const isFreelancer = userRole === 'freelancer';
  const isAdmin = userRole === 'admin';

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || 'U').toUpperCase();

  const roleLabel = isAdmin ? 'Admin' : isFreelancer ? 'Freelancer' : 'Client';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link to="/" className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShieldCheck size={20} />
        </div>
        <span className="sidebar-logo-text">Safe<span>Code</span></span>
      </Link>

      {/* Role Badge */}
      <div className="sidebar-role-badge">
        <span className="sidebar-role-badge-dot" />
        {roleLabel}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {isAdmin ? (
          <>
            <span className="sidebar-nav-section">Admin Panel</span>
            <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <div className="sidebar-link-icon"><LayoutDashboard size={18} /></div>
              <span>Bảng Điều Khiển</span>
            </NavLink>
          </>
        ) : (
          <>
            <span className="sidebar-nav-section">Navigation</span>
            <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <div className="sidebar-link-icon"><LayoutDashboard size={18} /></div>
              <span>Dashboard</span>
            </NavLink>

            {isFreelancer && (
              <NavLink to="/upload" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <div className="sidebar-link-icon"><UploadCloud size={18} /></div>
                <span>Upload & Encrypt</span>
              </NavLink>
            )}

            <NavLink to="/files" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <div className="sidebar-link-icon"><FolderLock size={18} /></div>
              <span>{isFreelancer ? 'Sent Files' : 'Received Files'}</span>
            </NavLink>

            {isFreelancer && (
              <NavLink to="/credits" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <div className="sidebar-link-icon"><CreditCard size={18} /></div>
                <span>Credits</span>
              </NavLink>
            )}

            <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <div className="sidebar-link-icon"><Settings size={18} /></div>
              <span>Settings</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* User Info */}
        <div className="sidebar-user-info">
          <div className="sidebar-avatar">{initials}</div>
          <div style={{ overflow: 'hidden' }}>
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>

        <button onClick={onLogout} className="sidebar-link logout-link">
          <div className="sidebar-link-icon"><LogOut size={18} /></div>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
