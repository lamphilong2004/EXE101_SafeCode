import React from 'react';
import { Bell, Search, Database } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = ({ notifications = [] }) => {
  const { user } = useAuth();
  const userRole = user?.role || 'guest';
  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || 'U').toUpperCase();

  const [open, setOpen] = React.useState(false);
  const bellRef = React.useRef(null);
  const [realNotifications, setRealNotifications] = React.useState([]);

  React.useEffect(() => {
    setRealNotifications(notifications);
  }, [user, notifications]);

  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const hasNotifications = (realNotifications?.length || 0) > 0;

  return (
    <header className="header">
      <div className="header-search">
        <Search size={16} className="search-icon" />
        <input type="text" placeholder="Tìm kiếm file, client..." className="search-input" />
      </div>

      <div className="header-actions">
        {(userRole === 'freelancer') && (
          <div className="header-credits-badge">
            <Database size={14} />
            <span>{user?.credits?.toFixed(1) || 0} CR</span>
          </div>
        )}

        <div className="notifications" ref={bellRef}>
          <button className="icon-btn" onClick={() => setOpen(v => !v)} aria-label="Notifications">
            <Bell size={18} />
            {hasNotifications && <span className="notification-dot" />}
          </button>
          {open && (
            <div className="notifications-menu" role="menu">
              <div className="notifications-title">Thông báo</div>
              {hasNotifications ? (
                <div className="notifications-list">
                  {notifications.map((n) => (
                    <div key={n.id} className="notification-item" role="menuitem">
                      {n.message}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="notifications-empty">Không có thông báo mới</div>
              )}
            </div>
          )}
        </div>

        <div className="user-profile">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-role">{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
