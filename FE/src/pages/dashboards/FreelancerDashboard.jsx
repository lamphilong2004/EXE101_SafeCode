import React, { useMemo } from 'react';
import { UploadCloud, FileLock2, CreditCard, ShieldCheck, ArrowRight, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Table from '../../components/ui/Table';
import './Dashboard.css';

const FreelancerDashboard = ({ files, updateFileStatus, pagination }) => {
  const { user } = useAuth();
  const { totalFiles } = pagination || {};

  const recentFiles = files.slice(0, 5);

  const pendingCount = useMemo(() =>
    files.filter(f => f.status === 'Verifying Payment').length, [files]);

  const paidCount = useMemo(() =>
    files.filter(f => f.status === 'Paid' || f.status === 'Delivered').length, [files]);

  const activeCount = useMemo(() =>
    files.filter(f => f.status === 'Testing Phase').length, [files]);

  const pendingRevenue = useMemo(() =>
    files
      .filter(f => ['Testing Phase', 'Locked', 'Verifying Payment'].includes(f.status))
      .reduce((sum, f) => sum + (f.amount || 0), 0), [files]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const columns = ['File Details', 'Client', 'Status', 'Amount'];

  return (
    <div className="dashboard-wrapper">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>{greeting()}, {user?.name?.split(' ').slice(-1)[0] || 'Freelancer'} 👋</h2>
          <p>Quản lý các giao dịch và bàn giao code của bạn một cách an toàn.</p>
          <span className="welcome-time">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <div className="quick-actions" style={{ marginBottom: 0 }}>
          <Link to="/upload" className="quick-action-btn primary">
            <UploadCloud size={16} />
            Gửi File Mới
          </Link>
          <Link to="/credits" className="quick-action-btn">
            <CreditCard size={16} />
            Credits
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">
            <FileLock2 size={22} />
          </div>
          <div className="stat-card-label">Tổng File Gửi</div>
          <div className="stat-card-value">{totalFiles ?? files.length}</div>
          <div className="stat-card-sub">Tất cả thời gian</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.3)', color: '#34d399' }}>
            <CheckCircle size={22} />
          </div>
          <div className="stat-card-label">Đã Bàn Giao</div>
          <div className="stat-card-value" style={{ color: '#34d399' }}>{paidCount}</div>
          <div className="stat-card-sub">Giao dịch thành công</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(251, 191, 36, 0.15)', borderColor: 'rgba(251, 191, 36, 0.3)', color: '#fbbf24' }}>
            <Clock size={22} />
          </div>
          <div className="stat-card-label">Chờ Xác Nhận</div>
          <div className="stat-card-value" style={{ color: '#fbbf24' }}>{pendingCount}</div>
          <div className="stat-card-sub">Cần xem xét bill</div>
        </div>

        <div className="stat-card glow">
          <div className="stat-card-icon">
            <CreditCard size={22} />
          </div>
          <div className="stat-card-label">Credits Hiện Có</div>
          <div className="stat-card-value">{user?.credits?.toFixed(1) || '0.0'}</div>
          <div className="stat-card-sub">Pay-per-file plan</div>
        </div>
      </div>

      {/* Recent Deliveries Table */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">
            <span className="dashboard-section-title-dot" />
            Bàn Giao Gần Đây
          </h2>
          <Link to="/files" className="view-all-link">
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>
        {recentFiles.length > 0 ? (
          <Table data={recentFiles} columns={columns} userRole="freelancer" updateFileStatus={updateFileStatus} hideFilter={true} />
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <UploadCloud size={32} />
            </div>
            <h3>Chưa có bàn giao nào</h3>
            <p>Bắt đầu bằng cách tải lên file mã nguồn đầu tiên của bạn. SafeCode sẽ mã hóa và gửi an toàn đến khách hàng.</p>
            <Link to="/upload" className="quick-action-btn primary">
              <UploadCloud size={16} />
              Gửi File Đầu Tiên
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FreelancerDashboard;
