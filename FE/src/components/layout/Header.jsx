import React from 'react';
import { Bell, Search, Database } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import socket from '../../services/socket';
import api from '../../services/api';
import './Header.css';

const Header = ({ notifications: propNotifications = [] }) => {
  const { user } = useAuth();
  const userRole = user?.role || 'guest';
  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || 'U').toUpperCase();

  const [open, setOpen] = React.useState(false);
  const bellRef = React.useRef(null);
  const [realtimeNotifs, setRealtimeNotifs] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Load existing notifications from API on mount
  React.useEffect(() => {
    if (!user) return;
    api.get('/notifications').then(res => {
      const notifs = res.data || [];
      setRealtimeNotifs(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    }).catch(() => {});
  }, [user]);

  // Listen for real-time notifications via socket
  React.useEffect(() => {
    const handleNewNotification = (notif) => {
      setRealtimeNotifs(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast.info(`🔔 ${notif.title}`, {
        position: 'bottom-right',
        autoClose: 5000,
      });
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, []);

  // Close dropdown on outside click
  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handleBellClick = () => {
    setOpen(v => !v);
    if (!open && unreadCount > 0) {
      // Mark all as read optimistically
      setUnreadCount(0);
      setRealtimeNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const allNotifications = [...realtimeNotifs, ...propNotifications].slice(0, 30);
  const hasNotifications = allNotifications.length > 0;

  return (
    <header className="header">
      {userRole !== 'admin' ? (
        <div className="header-search">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Tìm kiếm file, client..." className="search-input" />
        </div>
      ) : (
        <div className="header-search-placeholder"></div>
      )}

      <div className="header-actions">
        {(userRole === 'freelancer') && (
          <div className="header-credits-badge">
            <Database size={14} />
            <span>{user?.credits?.toFixed(1) || 0} CR</span>
          </div>
        )}

        <div className="notifications" ref={bellRef}>
          <button className="icon-btn" onClick={handleBellClick} aria-label="Notifications" style={{ position: 'relative' }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          {open && (
            <div className="notifications-menu" role="menu">
              <div className="notifications-title">Thông báo</div>
              {hasNotifications ? (
                <div className="notifications-list">
                  {allNotifications.map((n, idx) => (
                    <div
                      key={n._id || idx}
                      className={`notification-item ${n.isRead ? '' : 'unread'}`}
                      role="menuitem"
                    >
                      <p className="notif-title">{n.title}</p>
                      <p className="notif-message">{n.message || n.content}</p>
                      <span className="notif-time">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
                      </span>
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
