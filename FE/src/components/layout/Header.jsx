import React from 'react';
import { Bell, User, Search, Database } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = ({ notifications = [] }) => {
  const { user } = useAuth();
  const userRole = user?.role || 'guest';
  const userName = user?.name || 'Alex Freelance';

  const [open, setOpen] = React.useState(false);
  const bellRef = React.useRef(null);

  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const hasNotifications = (notifications?.length || 0) > 0;

  return (
    <header className="header">
      <div className="header-search">
        <Search size={20} className="search-icon" />
        <input type="text" placeholder="Search files, clients..." className="search-input" />
      </div>

      <div className="header-actions">
        {userRole === 'freelancer' && (
          <div className="header-credits flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-orange-700 font-bold text-sm">
            <Database size={14} />
            <span>{user?.credits?.toFixed(1) || 0} Credits</span>
          </div>
        )}
        <div className="notifications" ref={bellRef}>
        <button className="icon-btn" onClick={() => setOpen((v) => !v)} aria-label="Notifications">
          <Bell size={20} />
          {hasNotifications && <span className="notification-dot"></span>}
        </button>
        {open && (
          <div className="notifications-menu" role="menu">
            <div className="notifications-title">Notifications</div>
            {hasNotifications ? (
              <div className="notifications-list">
                {notifications.map((n) => (
                  <div key={n.id} className="notification-item" role="menuitem">
                    {n.message}
                  </div>
                ))}
              </div>
            ) : (
              <div className="notifications-empty">No notifications</div>
            )}
          </div>
        )}
        </div>
        <div className="user-profile">
          <div className="avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-role">{userRole === 'freelancer' ? 'Freelancer' : 'Client'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
