import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Users, AlertTriangle, CheckCircle, XCircle, Phone, Mail, FileText, BarChart3, Database, DollarSign, ArrowRight, Info, PlusCircle, MinusCircle, Banknote, ShieldCheck, ShieldX, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'analytics';

  const [disputes, setDisputes] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [creditRequests, setCreditRequests] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [selectedKyc, setSelectedKyc] = useState(null);
  // Pagination
  const [dPage] = useState(1);
  const [uPage] = useState(1);

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
      } else if (activeTab === 'users') {
        const res = await api.get(`/admin/users?page=${uPage}&limit=15`);
        setUsers(res.data.users);
      } else if (activeTab === 'transactions') {
        const res = await api.get(`/admin/transactions`);
        setTransactions(res.data.transactions);
      } else if (activeTab === 'credits') {
        const res = await api.get(`/admin/credit-requests`);
        setCreditRequests(res.data.requests);
      } else if (activeTab === 'withdraw') {
        const res = await api.get('/withdraw/all');
        setWithdrawRequests(res.data);
      } else if (activeTab === 'kyc') {
        const res = await api.get('/kyc/pending?status=pending');
        setKycRequests(res.data.users);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load admin data");
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

  // Disputer actions
  const handleResolve = async (fileId, action) => {
    const labels = {
      confirm: 'XÁC NHẬN thanh toán hợp lệ',
      reject: 'HỦY BỎ thanh toán',
      warning: 'CẢNH CÁO Freelancer'
    };
    if (!window.confirm(`Bạn chắc chắn muốn thực hiện hành động: "${labels[action]}"?`)) return;

    try {
      await api.post(`/admin/disputes/${fileId}/resolve`, { action });
      toast.success("Resolved dispute successfully");
      setSelectedDispute(null);
      fetchData();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || "Resolve failed");
    }
  };

  const handleApproveCredit = async (reqId) => {
    if(!window.confirm("Duyệt yêu cầu nạp credit này?")) return;
    try {
      await api.post(`/admin/credit-requests/${reqId}/approve`);
      toast.success("Đã duyệt thành công, nạp Credit cho user.");
      fetchData();
    } catch(err) {
      toast.error(err.response?.data?.error || "Action failed");
    }
  }

  const handleRejectCredit = async (reqId) => {
    const reason = window.prompt("Lý do từ chối (Admin Note):", "Ảnh bill không hợp lệ");
    if(reason === null) return;
    try {
      await api.post(`/admin/credit-requests/${reqId}/reject`, { adminNote: reason });
      toast.success("Đã từ chối yêu cầu.");
      fetchData();
    } catch(err) {
      toast.error(err.response?.data?.error || "Action failed");
    }
  };

  const handleApproveWithdraw = async (reqId) => {
    const reason = window.prompt("Ghi chú duyệt (Tùy chọn):", "Chuyển khoản thành công");
    if(reason === null) return;
    try {
      await api.post(`/withdraw/${reqId}/approve`, { adminNote: reason });
      toast.success("Đã duyệt yêu cầu rút tiền.");
      fetchData();
    } catch(err) {
      toast.error(err.response?.data?.error || "Action failed");
    }
  };

  const handleRejectWithdraw = async (reqId) => {
    const reason = window.prompt("Lý do từ chối (Bắt buộc):", "Sai thông tin ngân hàng");
    if(reason === null) return;
    if(!reason) {
      toast.error("Bắt buộc phải nhập lý do từ chối.");
      return;
    }
    try {
      await api.post(`/withdraw/${reqId}/reject`, { adminNote: reason });
      toast.success("Đã từ chối yêu cầu rút tiền, hoàn lại Credit.");
      fetchData();
    } catch(err) {
      toast.error(err.response?.data?.error || "Action failed");
    }
  };

  const handleToggleBan = async (userId, currentStatus) => {
    if(!window.confirm(`Bạn có chắc muốn ${currentStatus ? 'mở khóa' : 'khóa'} tài khoản này?`)) return;
    try {
      const res = await api.put(`/admin/users/${userId}/ban`);
      toast.success(res.data.message);
      fetchData(); // Reload users
    } catch(err) {
      toast.error(err.response?.data?.error || "Lỗi khi thao tác");
    }
  };

  const handleReviewKyc = async (userId, action) => {
    const adminNote = action === 'reject'
      ? window.prompt("Lý do từ chối (bắt buộc):", "Ảnh CCCD không rõ nét")
      : null;
    if (action === 'reject' && adminNote === null) return;
    try {
      await api.post(`/kyc/${userId}/review`, { action, adminNote });
      toast.success(action === 'approve' ? 'Đã phê duyệt KYC!' : 'Đã từ chối KYC.');
      setSelectedKyc(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Thao tác thất bại');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Bảng Điều Khiển Admin</h1>
        <p>Quản lý hệ thống SafeCode</p>
      </div>

      {stats && (
        <div className="admin-stats-grid">
          <div className="stat-card">
            <Users className="stat-icon" />
            <div className="stat-info">
              <h3>Tổng User</h3>
              <p>{stats.totalUsers || 0}</p>
            </div>
          </div>
          <div className="stat-card">
            <AlertTriangle className="stat-icon warning" />
            <div className="stat-info">
              <h3>Tranh Chấp Mở</h3>
              <p>{stats.totalDisputes || 0}</p>
            </div>
          </div>
          <div className="stat-card">
            <Database className="stat-icon processing" />
            <div className="stat-info">
              <h3>Tổng Source Code</h3>
              <p>{stats.totalFiles || 0}</p>
            </div>
          </div>
          <div className="stat-card">
            <DollarSign className="stat-icon success" />
            <div className="stat-info">
              <h3>Doanh Thu Hệ Thống</h3>
              <p>{(stats.totalRevenue || 0).toLocaleString()} đ</p>
            </div>
          </div>
        </div>
      )}

      <div className="admin-content">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dữ liệu...</div>
        ) : (
          <>
            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div className="analytics-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '24px' }}>
                {/* CHART AREA */}
                <div className="card-styled" style={{ height: '400px', display: 'flex', flexDirection: 'column', padding: '20px', background: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                    <BarChart3 size={18} /> Biểu đồ Tăng trưởng Doanh thu (7 ngày)
                  </h3>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.chartData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDoanhThu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000)}k`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--surface-solid)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                          formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                        />
                        <Area type="monotone" dataKey="doanhThu" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorDoanhThu)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>



                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div className="card-styled" style={{ padding: '20px', background: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}><FileText size={18}/> Activity Log (Nhật ký hoạt động)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {!stats?.recentActivities || stats.recentActivities.length === 0 ? (
                        <p className="text-muted text-sm italic" style={{ padding: '12px 0' }}>Hệ thống trống. Chưa có hoạt động nào được ghi nhận.</p>
                      ) : (
                        stats.recentActivities.map((log, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '16px', paddingBottom: '12px', borderBottom: idx !== stats.recentActivities.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                            <div style={{ minWidth: '100px', color: 'var(--text-muted)', fontSize: '13px' }}>{log.time}</div>
                            <div style={{ flex: 1, fontSize: '14px', color: log.type === 'error' ? 'var(--danger-color)' : log.type === 'success' ? 'var(--success-color)' : 'var(--text-main)' }}>
                              {log.action}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TRANSACTIONS TAB */}
            {activeTab === 'transactions' && (
              <div className="card-styled p-6" style={{ background: 'var(--background-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 className="text-xl font-bold mb-6" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                  <DollarSign className="text-primary" size={24} /> Lịch sử Giao dịch (Doanh Thu)
                </h3>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mã / Tên File</th>
                        <th>Client Mua (Tiền Vào)</th>
                        <th>Cộng Credit Freelancer</th>
                        <th>Doanh Thu (VNĐ)</th>
                        <th>Trạng Thái</th>
                        <th>Thời Gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr><td colSpan="6" className="text-center">Chưa có giao dịch nào.</td></tr>
                      ) : transactions.map(tx => (
                        <tr key={tx._id}>
                          <td>{tx.fileId?.title || tx._id.toString().substring(0,8)}</td>
                          <td>{tx.clientEmail}</td>
                          <td>
                            <div className="font-medium text-emerald-400">+{tx.amount / 1000} CR</div>
                            <div className="text-xs text-gray-400">{tx.freelancerId?.email}</div>
                          </td>
                          <td className="font-bold text-blue-400">{(tx.amount || 0).toLocaleString()} đ</td>
                          <td>
                            <span className={`status-badge ${tx.status === 'Succeeded' ? 'success' : 'warning'}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="text-gray-400">{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DISPUTES TAB */}
            {activeTab === 'disputes' && (
              <div className="data-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>File & Trạng Thái</th>
                      <th>Khách Hàng (Tạo)</th>
                      <th>Freelancer</th>
                      <th>Giá Trị</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.length === 0 ? (
                      <tr><td colSpan="5" className="text-center">Không có tranh chấp cần xử lý.</td></tr>
                    ) : (
                      disputes.map(d => (
                        <tr key={d._id}>
                          <td>
                            <strong>{d.title}</strong>
                            <br/><span className="status-badge warning">{d.status}</span>
                          </td>
                          <td>{d.intendedClientEmail}</td>
                          <td>{d.freelancerId?.name || d.freelancerId?.email}</td>
                          <td>{d.price.amount}</td>
                          <td>
                            <Button size="sm" variant="outline" onClick={() => setSelectedDispute(d)}>Xem Chi Tiết</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* AI CREDIT REQUESTS TAB */}
            {activeTab === 'credits' && (
              <div className="data-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ngày & Người Yêu Cầu</th>
                      <th>Số Lượng Nạp</th>
                      <th>Mã Đơn Hàng (PayOS)</th>
                      <th>Trạng Thái</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditRequests.length === 0 ? (
                      <tr><td colSpan="5" className="text-center">Chưa có yêu cầu Nạp Credit.</td></tr>
                    ) : (
                      creditRequests.map(req => (
                        <tr key={req._id}>
                          <td>
                            <div className="text-sm">
                              <div><b>{req.userId?.name || 'User'}</b></div>
                              <div className="text-muted">{req.userId?.email}</div>
                              <small>{new Date(req.createdAt).toLocaleString()}</small>
                            </div>
                          </td>
                          <td>
                            <strong className="text-success">+{req.amount} CR</strong><br />
                            <small>{req.amountVND?.toLocaleString() || (req.amount * 1000).toLocaleString()} VND</small>
                          </td>
                          <td>
                            {req.payosOrderCode ? (
                              <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>#{req.payosOrderCode}</div>
                            ) : req.billImageUrl ? (
                              <Button size="sm" variant="outline" onClick={() => window.open(req.billImageUrl, '_blank')}>Xem Bill Cũ</Button>
                            ) : (
                              <span className="text-muted italic">N/A</span>
                            )}
                          </td>
                          <td>
                             <span className={`status-badge ${req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'error' : 'pending'}`}>
                               {req.status === 'approved' ? 'THÀNH CÔNG' : req.status.toUpperCase()}
                             </span>
                          </td>
                          <td>
                            {req.status === 'pending' && (
                              req.payosOrderCode ? (
                                <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontStyle: 'italic' }}>
                                  <Clock size={12}/> Đang chờ thanh toán (PayOS)...
                                </span>
                              ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <Button size="sm" variant="success" title="Duyệt/Xác nhận đã nhận tiền" onClick={() => handleApproveCredit(req._id)}><CheckCircle size={14}/></Button>
                                  <Button size="sm" variant="danger" title="Từ chối/Hủy đơn" onClick={() => handleRejectCredit(req._id)}><XCircle size={14}/></Button>
                                </div>
                              )
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* WITHDRAW TAB */}
            {activeTab === 'withdraw' && (
              <div className="data-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ngày & Người Yêu Cầu</th>
                      <th>Số Lượng Rút</th>
                      <th>Thông Tin Nhận Tiền</th>
                      <th>Trạng Thái</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawRequests.length === 0 ? (
                      <tr><td colSpan="5" className="text-center">Chưa có yêu cầu rút tiền.</td></tr>
                    ) : (
                      withdrawRequests.map(req => (
                        <tr key={req._id}>
                          <td>
                            <div className="text-sm">
                              <div><b>{req.userId?.name || 'User'}</b></div>
                              <div className="text-muted">{req.userId?.email}</div>
                              <small>{new Date(req.createdAt).toLocaleString()}</small>
                            </div>
                          </td>
                          <td>
                            <strong className="text-danger">-{req.amount} CR</strong><br />
                            <small>{req.amountVND?.toLocaleString()} VND</small>
                          </td>
                          <td>
                            <div className="text-sm">
                              <div><b>Ngân hàng:</b> {req.bankDetails?.bankName}</div>
                              <div><b>Chủ TK:</b> {req.bankDetails?.accountName}</div>
                              <div><b>Số TK:</b> <span style={{fontFamily: 'monospace'}}>{req.bankDetails?.accountNumber}</span></div>
                            </div>
                          </td>
                          <td>
                             <span className={`status-badge ${req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'error' : 'pending'}`}>
                               {req.status === 'approved' ? 'ĐÃ CHUYỂN' : req.status.toUpperCase()}
                             </span>
                          </td>
                          <td>
                            {req.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <Button size="sm" variant="success" title="Xác nhận đã chuyển tiền" onClick={() => handleApproveWithdraw(req._id)}><CheckCircle size={14}/></Button>
                                <Button size="sm" variant="danger" title="Từ chối/Hoàn tiền" onClick={() => handleRejectWithdraw(req._id)}><XCircle size={14}/></Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* KYC TAB */}
            {activeTab === 'kyc' && (
              <div className="data-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Người Dùng</th>
                      <th>Họ Tên CCCD</th>
                      <th>Số CCCD</th>
                      <th>Ngày Nộp</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kycRequests.length === 0 ? (
                      <tr><td colSpan="5" className="text-center">Không có hồ sơ KYC đang chờ duyệt.</td></tr>
                    ) : (
                      kycRequests.map(u => (
                        <tr key={u._id}>
                          <td>
                            <strong>{u.name}</strong><br/>
                            <small>{u.email}</small><br/>
                            <span className="status-badge">{u.role}</span>
                          </td>
                          <td>{u.kyc?.fullName || '-'}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace' }}>{u.kyc?.cccdNumber || '-'}</span>
                          </td>
                          <td>
                            <small>{u.kyc?.submittedAt ? new Date(u.kyc.submittedAt).toLocaleString('vi-VN') : '-'}</small>
                          </td>
                          <td>
                            <Button size="sm" variant="outline" onClick={() => setSelectedKyc(u)}>Xem Hồ Sơ</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="data-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Người Dùng</th>
                      <th>Vai Trò</th>
                      <th>Credits</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td>
                          <strong>{u.name}</strong><br/>
                          <small>{u.email}</small>
                          {u.isBanned && <span className="status-badge danger" style={{marginLeft: '8px', fontSize: '11px'}}>Banned</span>}
                        </td>
                        <td><span className="status-badge">{u.role}</span></td>
                        <td>{u.credits?.toFixed(1) || 0}</td>
                        <td>
                           <div style={{ display: 'flex', gap: '8px' }}>
                             <Button size="sm" variant="outline" title="Chỉnh sửa Credit" onClick={() => { setTargetUser(u); setShowCreditModal(true); setCreditAmount(0); }}>
                               Cộng/Trừ CR
                             </Button>
                             {u.role !== 'admin' && (
                               <Button size="sm" variant={u.isBanned ? "secondary" : "danger"} onClick={() => handleToggleBan(u._id, u.isBanned)}>
                                 {u.isBanned ? 'Mở Khóa' : 'Khóa (Ban)'}
                               </Button>
                             )}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </>
        )}
      </div>

      {selectedDispute && (
        <div className="modal-overlay">
          <div className="checkout-modal premium-ui" style={{ maxWidth: '600px' }}>
            <div className="checkout-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="text-xl font-bold">Phân Xử Tranh Chấp</h3>
              <button onClick={() => setSelectedDispute(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <div className="checkout-body" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="payment-summary card-styled" style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span className="text-xs text-muted block">Dự án:</span>
                  <strong>{selectedDispute.title}</strong>
                </div>
                <div>
                  <span className="text-xs text-muted block">Giá trị:</span>
                  <strong className="text-primary">{selectedDispute.price?.amount?.toLocaleString()} {selectedDispute.price?.currency?.toUpperCase()}</strong>
                </div>
                <div>
                  <span className="text-xs text-muted block">Khách hàng:</span>
                  <span>{selectedDispute.intendedClientEmail}</span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Freelancer:</span>
                  <span>{selectedDispute.freelancerId?.name || selectedDispute.freelancerId?.email}</span>
                </div>
              </div>

              {selectedDispute.receipt?.imageUrl ? (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="font-bold text-sm">Minh chứng chuyển khoản (Ảnh Bill):</label>
                  <img 
                    src={selectedDispute.receipt.imageUrl} 
                    alt="Receipt" 
                    style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border-color)' }} 
                  />
                  {selectedDispute.receipt.trackingLink && (
                    <div style={{ marginTop: '8px' }}>
                      <span className="text-xs text-muted block">Link giao dịch:</span>
                      <a href={selectedDispute.receipt.trackingLink} target="_blank" rel="noopener noreferrer" className="text-primary text-sm break-all">{selectedDispute.receipt.trackingLink}</a>
                    </div>
                  )}
                  <span className="text-xs text-muted mt-1 italic block">
                    {selectedDispute.receipt.verifiedByAI ? "✅ AI đã tự động xác minh bill khớp" : "⚠️ AI chưa xác minh hoặc phát hiện bill không khớp"}
                  </span>
                </div>
              ) : (
                <p className="text-muted text-sm italic mt-4">Chưa có ảnh bill thanh toán được tải lên.</p>
              )}
            </div>
            <div className="checkout-footer" style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="success" size="sm" onClick={() => handleResolve(selectedDispute._id, 'confirm')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={16} /> Đã nhận tiền (Confirm)
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleResolve(selectedDispute._id, 'reject')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <XCircle size={16} /> Hủy giao dịch (Reject)
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleResolve(selectedDispute._id, 'requestMoreInfo')}>
                Yêu cầu bằng chứng
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDispute(null)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}

      {showCreditModal && targetUser && (
        <div className="modal-overlay">
          <div className="checkout-modal premium-ui" style={{ maxWidth: '400px' }}>
            <div className="checkout-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="text-xl font-bold">Chỉnh Sửa Credit</h3>
              <button onClick={() => setShowCreditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <div className="checkout-body" style={{ padding: '20px' }}>
              <p className="text-sm mb-4">Người dùng: <strong>{targetUser.name}</strong> ({targetUser.email})</p>
              <div className="form-group mb-3" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="text-sm font-bold">Số lượng Credit (Cộng/Trừ):</label>
                <input 
                  type="number" 
                  value={creditAmount} 
                  onChange={(e) => setCreditAmount(Number(e.target.value))} 
                  className="form-input"
                  style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--background-color)', outline: 'none' }}
                />
                <span className="text-xs text-muted">Nhập số dương để cộng (e.g. 5) hoặc âm để trừ (e.g. -5).</span>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="text-sm font-bold">Lý do điều chỉnh:</label>
                <input 
                  type="text" 
                  value={creditReason} 
                  onChange={(e) => setCreditReason(e.target.value)} 
                  placeholder="Nạp tiền ngoài hệ thống / phạt vi phạm..."
                  className="form-input"
                  style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--background-color)', outline: 'none' }}
                />
              </div>
            </div>
            <div className="checkout-footer" style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
              <Button variant="primary" onClick={async () => {
                try {
                  const res = await api.post(`/admin/users/${targetUser._id}/credits`, {
                    amount: creditAmount,
                    reason: creditReason
                  });
                  toast.success(`Đã cập nhật số dư! Số dư mới: ${res.data.newBalance} CR`);
                  setShowCreditModal(false);
                  fetchData();
                  fetchStats();
                } catch (err) {
                  toast.error(err.response?.data?.error || "Cập nhật thất bại");
                }
              }} style={{ flex: 1 }}>Xác nhận</Button>
              <Button variant="outline" onClick={() => setShowCreditModal(false)}>Hủy</Button>
            </div>
          </div>
        </div>
      )}
      {selectedKyc && (
        <div className="modal-overlay">
          <div className="checkout-modal premium-ui" style={{ maxWidth: '650px' }}>
            <div className="checkout-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="text-xl font-bold">Xem Xét Hồ Sơ KYC</h3>
              <button onClick={() => setSelectedKyc(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <div className="checkout-body" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="payment-summary card-styled" style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span className="text-xs text-muted block">Người nộp:</span>
                  <strong>{selectedKyc.name}</strong>
                  <br/><small className="text-muted">{selectedKyc.email}</small>
                </div>
                <div>
                  <span className="text-xs text-muted block">Vai trò:</span>
                  <span className="status-badge">{selectedKyc.role}</span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Họ tên (CCCD):</span>
                  <strong>{selectedKyc.kyc?.fullName}</strong>
                </div>
                <div>
                  <span className="text-xs text-muted block">Số CCCD:</span>
                  <strong style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}>{selectedKyc.kyc?.cccdNumber}</strong>
                </div>
                <div>
                  <span className="text-xs text-muted block">Ngày nộp:</span>
                  <small>{selectedKyc.kyc?.submittedAt ? new Date(selectedKyc.kyc.submittedAt).toLocaleString('vi-VN') : '-'}</small>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label className="font-bold text-sm" style={{ display: 'block', marginBottom: '8px' }}>Mặt trước CCCD:</label>
                  {selectedKyc.kyc?.cccdFront ? (
                    <img
                      src={selectedKyc.kyc.cccdFront}
                      alt="CCCD mặt trước"
                      style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'contain', maxHeight: '200px' }}
                    />
                  ) : <p className="text-muted text-sm italic">Không có ảnh</p>}
                </div>
                <div>
                  <label className="font-bold text-sm" style={{ display: 'block', marginBottom: '8px' }}>Mặt sau CCCD:</label>
                  {selectedKyc.kyc?.cccdBack ? (
                    <img
                      src={selectedKyc.kyc.cccdBack}
                      alt="CCCD mặt sau"
                      style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'contain', maxHeight: '200px' }}
                    />
                  ) : <p className="text-muted text-sm italic">Không có ảnh</p>}
                </div>
              </div>
            </div>
            <div className="checkout-footer" style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="success" size="sm" onClick={() => handleReviewKyc(selectedKyc._id, 'approve')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={16} /> Phê Duyệt KYC
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleReviewKyc(selectedKyc._id, 'reject')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldX size={16} /> Từ Chối
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedKyc(null)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
