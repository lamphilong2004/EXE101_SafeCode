import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Users, AlertTriangle, CheckCircle, XCircle, Phone, Mail, FileText, BarChart3, Database, DollarSign, ArrowRight, Info, PlusCircle, MinusCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('disputes');
  const [disputes, setDisputes] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  
  // Pagination
  const [dPage, setDPage] = useState(1);
  const [dTotalPages, setDTotalPages] = useState(1);
  const [uPage, setUPage] = useState(1);
  const [uTotalPages, setUTotalPages] = useState(1);

  // Credit Management
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditReason, setCreditReason] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error("Stats fail", err);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'disputes') {
        const res = await api.get(`/admin/disputes?page=${dPage}&limit=10`);
        setDisputes(res.data.disputes);
        setDTotalPages(res.data.totalPages);
      } else {
        const res = await api.get(`/admin/users?page=${uPage}&limit=15`);
        setUsers(res.data.users);
        setUTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải dữ liệu admin.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, dPage, uPage]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolve = async (fileId, action) => {
    const labels = {
      confirm: 'XÁC NHẬN thanh toán hợp lệ',
      reject: 'TỪ CHỐI tranh chấp',
      requestMoreInfo: 'YÊU CẦU THÊM bằng chứng (Hạn 48h)'
    };
    if (!window.confirm(`Admin ${labels[action]}?`)) return;
    try {
      await api.post(`/admin/disputes/${fileId}/resolve`, { action });
      toast.success('Thao tác thành công!');
      setSelectedDispute(null);
      fetchData();
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error('Thao tác thất bại.');
    }
  };

  const handleAdjustCredits = async () => {
    if (!targetUser) return;
    try {
      await api.post(`/admin/users/${targetUser._id}/credits`, { 
        amount: Number(creditAmount), 
        reason: creditReason 
      });
      toast.success(`Đã cập nhật credit cho ${targetUser.email}`);
      setShowCreditModal(false);
      fetchData();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi xử lý');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>⚙️ Bảng Điều Khiển Admin</h1>
        <p>Giám sát doanh thu, quản lý user và giải quyết tranh chấp</p>
      </div>

      {stats && (
        <div className="admin-stats-grid">
          <div className="stat-card">
            <div className="stat-header"><Users size={16} /> Users</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header"><FileText size={16} /> Files</div>
            <div className="stat-value">{stats.totalFiles}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header"><DollarSign size={16} /> Doanh thu</div>
            <div className="stat-value">{stats.totalRevenue.toLocaleString()} VND</div>
          </div>
          <div className="stat-card">
            <div className="stat-header"><Database size={16} /> Credits lưu thông</div>
            <div className="stat-value">{stats.totalCreditsInCirculation.toFixed(1)}</div>
          </div>
        </div>
      )}

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'disputes' ? 'active' : ''}`} onClick={() => setActiveTab('disputes')}>
          <AlertTriangle size={16} /> Tranh Chấp ({stats?.totalDisputes || 0})
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
            <>
              <div className="dispute-grid">
                {disputes.map(d => (
                  <div key={d._id} className="dispute-card" onClick={() => setSelectedDispute(d)}>
                    <div className="dispute-card-header">
                      <FileText size={20} />
                      <span className="dispute-title">{d.title}</span>
                      <span className={`status-badge ${d.status === 'AwaitingEvidence' ? 'status-awaiting' : 'status-disputed'}`}>
                        {d.status === 'AwaitingEvidence' ? 'Đang chờ Evidence' : 'Disputed'}
                      </span>
                    </div>
                    <div className="dispute-card-body">
                      <div><strong>Client:</strong> {d.intendedClientEmail}</div>
                      <div><strong>Freelancer:</strong> {d.freelancerId?.name || 'N/A'}</div>
                      <div><strong>Số tiền:</strong> {d.price?.amount.toLocaleString()} {d.price?.currency.toUpperCase()}</div>
                    </div>
                    <div className="dispute-card-footer">
                      <button className="btn-resolve confirm" onClick={(e) => { e.stopPropagation(); handleResolve(d._id, 'confirm'); }}>
                        <CheckCircle size={14} /> Confirm
                      </button>
                      <button className="btn-resolve info" onClick={(e) => { e.stopPropagation(); handleResolve(d._id, 'requestMoreInfo'); }}>
                        <Info size={14} /> Request Info
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {dTotalPages > 1 && (
                <div className="pagination-controls">
                  <Button variant="outline" size="sm" disabled={dPage === 1} onClick={() => setDPage(dPage - 1)}>Trang trước</Button>
                  <span>{dPage} / {dTotalPages}</span>
                  <Button variant="outline" size="sm" disabled={dPage === dTotalPages} onClick={() => setDPage(dPage + 1)}>Trang sau</Button>
                </div>
              )}
            </>
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
                    <p><strong>Status:</strong> {selectedDispute.status}</p>
                    {selectedDispute.disputeDeadline && (
                      <p className="text-danger"><strong>Deadline:</strong> {new Date(selectedDispute.disputeDeadline).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="detail-section">
                    <h4>👤 Freelancer</h4>
                    <p><strong>Tên:</strong> {selectedDispute.freelancerId?.name}</p>
                    <p><strong>Email:</strong> {selectedDispute.freelancerId?.email}</p>
                  </div>
                </div>
                {selectedDispute.receipt?.imageUrl && (
                  <div className="receipt-preview">
                    <h4>🧾 Bill của Client</h4>
                    <img src={selectedDispute.receipt.imageUrl} alt="Payment Receipt" />
                  </div>
                )}
                <div className="dispute-detail-actions">
                  <Button variant="primary" onClick={() => handleResolve(selectedDispute._id, 'confirm')}>Force Confirm</Button>
                  <Button variant="outline" onClick={() => handleResolve(selectedDispute._id, 'requestMoreInfo')}>Yêu cầu thêm bằng chứng</Button>
                  <Button onClick={() => handleResolve(selectedDispute._id, 'reject')} style={{backgroundColor: '#fee2e2', color: '#dc2626'}}>Từ chối</Button>
                  <Button variant="outline" onClick={() => setSelectedDispute(null)}>Quay lại</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="admin-content">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Credits</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="font-bold">{u.name}</div>
                    <div className="text-xs text-muted">{u.email}</div>
                  </td>
                  <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                  <td className="font-bold">{u.credits?.toFixed(1) || 0}</td>
                  <td>
                    <Button size="sm" variant="outline" onClick={() => { setTargetUser(u); setShowCreditModal(true); }}>
                      <PlusCircle size={14} className="mr-1" /> Cấp Credit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {uTotalPages > 1 && (
            <div className="pagination-controls">
              <Button variant="outline" size="sm" disabled={uPage === 1} onClick={() => setUPage(uPage - 1)}>Trước</Button>
              <span>{uPage} / {uTotalPages}</span>
              <Button variant="outline" size="sm" disabled={uPage === uTotalPages} onClick={() => setUPage(uPage + 1)}>Sau</Button>
            </div>
          )}

          {/* Credit Modal */}
          {showCreditModal && targetUser && (
            <div className="modal-overlay" onClick={() => setShowCreditModal(false)}>
              <div className="credit-modal" onClick={e => e.stopPropagation()}>
                <h3>Quản lý Credits cho {targetUser.name}</h3>
                <div className="credit-form">
                  <div className="input-group">
                    <label>Số lượng (Số âm để trừ)</label>
                    <input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} className="form-input" />
                  </div>
                  <div className="input-group">
                    <label>Lý do</label>
                    <input type="text" value={creditReason} onChange={e => setCreditReason(e.target.value)} placeholder="VD: Hoàn tiền, Thưởng sự kiện..." className="form-input" />
                  </div>
                  <Button variant="primary" onClick={handleAdjustCredits}>Xác nhận thay đổi</Button>
                  <Button variant="outline" onClick={() => setShowCreditModal(false)}>Hủy</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
