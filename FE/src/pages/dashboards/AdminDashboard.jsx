import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Users, AlertTriangle, CheckCircle, XCircle, Phone, Mail, FileText } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('disputes');
  const [disputes, setDisputes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'disputes') {
        const res = await api.get('/admin/disputes');
        setDisputes(res.data.disputes);
      } else {
        const res = await api.get('/admin/users');
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải dữ liệu admin.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolve = async (fileId, action) => {
    const label = action === 'confirm' ? 'XÁC NHẬN thanh toán hợp lệ' : 'TỪ CHỐI tranh chấp';
    if (!window.confirm(`Admin ${label}?`)) return;
    try {
      await api.post(`/admin/disputes/${fileId}/resolve`, { action });
      toast.success(action === 'confirm' ? '✅ Đã xác nhận! Key đã gửi cho Client.' : '❌ Đã từ chối Dispute.');
      setSelectedDispute(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Thao tác thất bại.');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>⚙️ Bảng Điều Khiển Admin</h1>
        <p>Quản lý người dùng và giải quyết tranh chấp thanh toán</p>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'disputes' ? 'active' : ''}`} onClick={() => setActiveTab('disputes')}>
          <AlertTriangle size={16} /> Tranh Chấp ({disputes.length})
        </button>
        <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={16} /> Người Dùng
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">Đang tải...</div>
      ) : activeTab === 'disputes' ? (
        <div className="admin-content">
          {disputes.length === 0 ? (
            <div className="admin-empty">
              <CheckCircle size={48} style={{ color: 'var(--primary-color)' }} />
              <p>Không có tranh chấp nào đang chờ xử lý.</p>
            </div>
          ) : (
            <div className="dispute-grid">
              {disputes.map(d => (
                <div key={d._id} className="dispute-card" onClick={() => setSelectedDispute(d)}>
                  <div className="dispute-card-header">
                    <FileText size={20} />
                    <span className="dispute-title">{d.title}</span>
                    <span className="dispute-badge">Tranh Chấp</span>
                  </div>
                  <div className="dispute-card-body">
                    <div><strong>Client:</strong> {d.intendedClientEmail}</div>
                    <div><strong>Freelancer:</strong> {d.freelancerId?.name || 'N/A'}</div>
                    <div><Mail size={12} /> {d.freelancerId?.email}</div>
                    {d.freelancerId?.phone && <div><Phone size={12} /> {d.freelancerId.phone}</div>}
                    <div><strong>Số tiền:</strong> ${d.price?.amount}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Cập nhật: {new Date(d.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="dispute-card-footer">
                    <button className="btn-resolve confirm" onClick={(e) => { e.stopPropagation(); handleResolve(d._id, 'confirm'); }}>
                      <CheckCircle size={14} /> Force Confirm
                    </button>
                    <button className="btn-resolve reject" onClick={(e) => { e.stopPropagation(); handleResolve(d._id, 'reject'); }}>
                      <XCircle size={14} /> Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dispute Detail Modal */}
          {selectedDispute && (
            <div className="modal-overlay" onClick={() => setSelectedDispute(null)}>
              <div className="dispute-detail-modal" onClick={e => e.stopPropagation()}>
                <h3>Chi tiết Tranh Chấp</h3>
                <div className="detail-grid">
                  <div className="detail-section">
                    <h4>📁 File</h4>
                    <p><strong>Tên:</strong> {selectedDispute.title}</p>
                    <p><strong>Số tiền:</strong> ${selectedDispute.price?.amount}</p>
                    <p><strong>Client:</strong> {selectedDispute.intendedClientEmail}</p>
                  </div>
                  <div className="detail-section">
                    <h4>👤 Freelancer</h4>
                    <p><strong>Tên:</strong> {selectedDispute.freelancerId?.name}</p>
                    <p><strong>Email:</strong> {selectedDispute.freelancerId?.email}</p>
                    <p><strong>Phone:</strong> {selectedDispute.freelancerId?.phone || 'Chưa cập nhật'}</p>
                    <p><strong>Ngân hàng:</strong> {selectedDispute.freelancerId?.payoutSettings?.bankName || 'N/A'}</p>
                    <p><strong>STK:</strong> {selectedDispute.freelancerId?.payoutSettings?.accountNumber || 'N/A'}</p>
                  </div>
                </div>
                {selectedDispute.receipt?.imageUrl && (
                  <div className="receipt-preview">
                    <h4>🧾 Ảnh Bill Client Gửi</h4>
                    <img src={selectedDispute.receipt.imageUrl} alt="Payment Receipt" />
                    {selectedDispute.receipt?.trackingLink && (
                      <a href={selectedDispute.receipt.trackingLink} target="_blank" rel="noreferrer">
                        🔗 Xem Link Giao Dịch
                      </a>
                    )}
                  </div>
                )}
                <div className="dispute-detail-actions">
                  <button className="btn-resolve confirm" onClick={() => handleResolve(selectedDispute._id, 'confirm')}>
                    <CheckCircle size={16} /> Force Confirm (Giải phóng Key cho Client)
                  </button>
                  <button className="btn-resolve reject" onClick={() => handleResolve(selectedDispute._id, 'reject')}>
                    <XCircle size={16} /> Từ chối (Đóng Dispute)
                  </button>
                  <button className="btn-resolve" style={{ background: 'transparent', color: 'var(--text-muted)' }} onClick={() => setSelectedDispute(null)}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="admin-content">
          <div className="users-search">
            <input
              type="text"
              placeholder="Tìm theo email..."
              onChange={(e) => {
                e.target.value.toLowerCase();
                // Inline filter via CSS workaround – just re-render
              }}
            />
          </div>
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Ngày tạo</th>
                <th>Đăng nhập lần cuối</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.name || '—'}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <span className={`role-badge role-${u.role}`}>{u.role}</span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
