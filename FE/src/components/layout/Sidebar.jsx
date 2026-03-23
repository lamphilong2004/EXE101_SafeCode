import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, FolderLock, CreditCard, Settings, ShieldCheck, LogOut, Users, AlertTriangle } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ userRole, onLogout }) => {
  const isFreelancer = userRole === 'freelancer';
  const isAdmin = userRole === 'admin';

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShieldCheck size={24} />
        </div>
        <span>SafeCode</span>
      </Link>

      <nav className="sidebar-nav">
        {isAdmin ? (
          // Admin-only navigation
          <>
            <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Bảng Điều Khiển</span>
            </NavLink>
          </>
        ) : (
          // Normal user navigation
          <>
            <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            
            {isFreelancer && (
              <NavLink to="/upload" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <UploadCloud size={20} />
                <span>Upload</span>
              </NavLink>
            )}

            <NavLink to="/files" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <FolderLock size={20} />
              <span>{isFreelancer ? 'Sent Files' : 'Received Files'}</span>
            </NavLink>

            {isFreelancer && (
              <NavLink to="/credits" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <CreditCard size={20} />
                <span>Credits</span>
              </NavLink>
            )}

            <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button onClick={onLogout} className="sidebar-link w-full text-left" style={{ width: '100%' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
