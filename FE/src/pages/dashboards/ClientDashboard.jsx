import React, { useMemo } from 'react';
import { FolderLock, ShieldCheck, ArrowRight, Lock, PlayCircle, CheckCircle, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Table from '../../components/ui/Table';
import './Dashboard.css';

const ClientDashboard = ({ files, updateFileStatus, pagination }) => {
  const { user } = useAuth();
  const { totalFiles } = pagination || {};
  const clientFiles = files || [];

  const recentFiles = clientFiles.slice(0, 5);

  const testingCount = useMemo(() =>
    clientFiles.filter(f => f.status === 'Testing Phase').length, [clientFiles]);

  const lockedCount = useMemo(() =>
    clientFiles.filter(f => f.status === 'Locked').length, [clientFiles]);

  const paidCount = useMemo(() =>
    clientFiles.filter(f => f.status === 'Paid' || f.status === 'Delivered').length, [clientFiles]);

  const columns = ['File Details', 'Freelancer', 'Status'];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="dashboard-wrapper">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>{greeting()}, {user?.name?.split(' ').slice(-1)[0] || 'Client'} 👋</h2>
          <p>Theo dõi và quản lý mã nguồn bạn đã nhận. Hoàn toàn bảo mật, đúng tiến độ.</p>
          <span className="welcome-time">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <Link to="/files" className="quick-action-btn primary" style={{ flexShrink: 0 }}>
          <FolderLock size={16} />
          Xem File Của Tôi
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">
            <Inbox size={22} />
          </div>
          <div className="stat-card-label">Files Đã Nhận</div>
          <div className="stat-card-value">{totalFiles ?? clientFiles.length}</div>
          <div className="stat-card-sub">Tổng từ freelancer</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(96, 165, 250, 0.15)', borderColor: 'rgba(96, 165, 250, 0.3)', color: '#60a5fa' }}>
            <PlayCircle size={22} />
          </div>
          <div className="stat-card-label">Đang Dùng Thử</div>
          <div className="stat-card-value" style={{ color: '#60a5fa' }}>{testingCount}</div>
          <div className="stat-card-sub">Testing phase</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(248, 113, 113, 0.15)', borderColor: 'rgba(248, 113, 113, 0.3)', color: '#f87171' }}>
            <Lock size={22} />
          </div>
          <div className="stat-card-label">Đã Hết Hạn Trial</div>
          <div className="stat-card-value" style={{ color: '#f87171' }}>{lockedCount}</div>
          <div className="stat-card-sub">Cần thanh toán</div>
        </div>

        <div className="stat-card glow">
          <div className="stat-card-icon">
            <CheckCircle size={22} />
          </div>
          <div className="stat-card-label">Đã Thanh Toán</div>
          <div className="stat-card-value">{paidCount}</div>
          <div className="stat-card-sub">Code đã mở khóa</div>
        </div>
      </div>

      {/* Received Files Table */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-title-dot" />
            File Vừa Nhận
          </h2>
          <Link to="/files" className="view-all-link">
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>
        {recentFiles.length > 0 ? (
          <Table data={recentFiles} columns={columns} userRole="client" updateFileStatus={updateFileStatus} />
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FolderLock size={32} />
            </div>
            <h3>Chưa có file nào được gửi</h3>
            <p>Khi một Freelancer gửi mã nguồn đến email của bạn, chúng sẽ xuất hiện ở đây để bạn dùng thử và thanh toán.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
