import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Zap, Check, ArrowUpRight, ArrowDownRight, History, Banknote, ShieldCheck, RefreshCw, QrCode, Crown, Diamond, Copy, XCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { QRCodeSVG } from 'qrcode.react';
import socket from '../../services/socket';
import './Credits.css';
import '../landing/Landing.css'; // Import pricing neon styles

const Credits = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [topupAmount, setTopupAmount] = useState('50000');
  const creditsToBuy = Math.floor(Number(topupAmount) / 1000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrData, setQrData] = useState(null);

  // Withdraw state
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(50);
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', accountName: '' });

  // Fix bfcache hanging issue
  useEffect(() => {
    const handlePageShow = (e) => {
      if (e.persisted) {
        setIsSubmitting(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // Listen to socket for automatic payment success
  useEffect(() => {
    const handleNotification = (notif) => {
      if (notif.title === 'credit_approved') {
        if (qrData) {
          setQrData(null);
          toast.success(notif.message || "Thanh toán thành công! Đã nạp tiền vào tài khoản.");
          // Refresh user data (or just let the page reload/update)
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    };
    socket.on('new_notification', handleNotification);
    return () => socket.off('new_notification', handleNotification);
  }, [qrData]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [histRes, reqRes, withdrawRes] = await Promise.all([
          api.get(`/credits/history?page=${page}&limit=10`),
          api.get('/credits/my-requests'),
          user?.role === 'freelancer' ? api.get('/withdraw') : Promise.resolve({ data: [] })
        ]);
        setHistory(histRes.data.records);
        setTotalPages(histRes.data.totalPages);
        setRequests(reqRes.data.requests);
        if (user?.role === 'freelancer') {
          setWithdrawRequests(withdrawRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch credits data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, user?.role]);

  const handleWithdraw = async () => {
    if (withdrawAmount < 50) {
      toast.error("Tối thiểu rút 50 Credit (100.000 VNĐ).");
      return;
    }
    if (withdrawAmount > user.credits) {
      toast.error("Số dư Credit không đủ.");
      return;
    }
    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
      toast.error("Vui lòng nhập đầy đủ thông tin ngân hàng.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post('/withdraw', { amount: withdrawAmount, bankDetails });
      toast.success("Gửi yêu cầu rút tiền thành công!");
      setShowWithdrawModal(false);
      // Refresh user data
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.error || "Lỗi khi tạo yêu cầu rút tiền.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayosTopup = async (overrideAmount = null) => {
    // Check if overrideAmount is a valid number, otherwise default to creditsToBuy
    const amountToBuy = typeof overrideAmount === 'number' ? overrideAmount : creditsToBuy;
    
    if (amountToBuy < 10) {
      toast.error("Vui lòng nạp tối thiểu 10 Credit (10.000 VNĐ).");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post('/credits/buy-payos', { amount: amountToBuy });
      if (res.data.qrCode) {
        setQrData(res.data);
      } else if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Không thể tạo mã QR nạp tiền.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${type}!`);
  };

  const getIcon = (type, amount) => {
    if (amount > 0) return <ArrowUpRight className="text-success" size={16} />;
    return <ArrowDownRight className="text-danger" size={16} />;
  };

  const formatAmount = (amt) => (amt > 0 ? `+${amt}` : amt);


  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Credits & Thanh toán</h1>
          <p className="page-subtitle">Nạp tiền để tiếp tục sử dụng các dịch vụ và mua bán Source Code an toàn.</p>
        </div>
        {user?.role === 'freelancer' && (
          <Button variant="primary" className="btn-glow" onClick={() => setShowWithdrawModal(true)}>
            <Banknote size={18} className="mr-2" /> Rút Tiền
          </Button>
        )}
      </div>

      <div className="dashboard-stats-grid mb-6">
        <Card
          className="credits-balance-card glass-panel fade-in"
          title="Credit Khả dụng"
          icon={<CreditCard size={28} className="text-primary" />}
          value={
            <div className="balance-value">
              <span>{user?.credits?.toFixed(1) || 0}</span>
              <small>CR</small>
            </div>
          }
        />
        <Card
          className="subscription-card glass-panel fade-in"
          title="Gói hiện tại"
          icon={<Zap size={28} className="text-warning" />}
          value={<div className="subscription-value">{user?.plan || 'Gói Khởi Đầu'}</div>}
        />
      </div>

      {user?.role === 'freelancer' && (
        <div className="pricing-section mb-10" style={{ padding: '2rem 0', background: 'transparent' }}>
          <div className="pricing-intro" style={{ marginBottom: '2rem' }}>
            <div className="pricing-icons">
              <div className="pricing-icon-wrapper"><Crown size={20} color="#06b6d4" /></div>
              <div className="pricing-icon-wrapper"><Zap size={20} color="#10b981" /></div>
              <div className="pricing-icon-wrapper"><Diamond size={20} color="#d946ef" /></div>
            </div>
            <h2>Mở Khóa Premium</h2>
            <p>Chọn gói phù hợp - Nâng tầm trải nghiệm</p>
          </div>

          <div className="pricing-grid">
            {/* Cyan Card */}
            <div className="pricing-card neon-cyan">
              <div className="pricing-badge">Featured</div>
              <div className="pricing-header">
                <div className="pricing-icon"><Crown size={48} /></div>
                <h3 className="pricing-tier">SAFECODE VIP</h3>
                <div className="pricing-price-text">Miễn phí</div>
              </div>

              <div className="pricing-features">
                <div className="feature-item">
                  <Check size={18} />
                  <span>Tuyệt vời để <strong>trải nghiệm thử</strong></span>
                </div>
                <div className="feature-item">
                  <Check size={18} />
                  <span>Tặng ngay <strong>50 Credit</strong> khi đăng ký</span>
                </div>
                <div className="feature-item">
                  <Check size={18} />
                  <span>Truy cập đầy đủ tính năng mã hóa</span>
                </div>
                <div className="feature-item">
                  <Check size={18} />
                  <span>Thanh toán Escrow an toàn</span>
                </div>
              </div>

              <button className="pricing-btn">
                Đang Sử Dụng
              </button>
            </div>

            {/* Magenta Card */}
            <div className="pricing-card neon-magenta">
              <div className="pricing-header">
                <div className="pricing-icon"><Diamond size={48} /></div>
                <h3 className="pricing-tier">SAFECODE PRO</h3>
                <div className="pricing-price-text">250,000đ cho 1 tháng</div>
              </div>

              <div className="pricing-features">
                <div className="feature-item">
                  <Check size={18} />
                  <span>Dành cho freelancer <strong>giao dịch nhiều</strong></span>
                </div>
                <div className="feature-item">
                  <Check size={18} />
                  <span>Tặng <strong>250 Credit</strong> mỗi tháng</span>
                </div>
                <div className="feature-item">
                  <Check size={18} />
                  <span>Tặng thêm <strong>50 Credit</strong> miễn phí lần đầu</span>
                </div>
                <div className="feature-item">
                  <Check size={18} />
                  <span>Hỗ trợ ưu tiên <strong>24/7</strong></span>
                </div>
              </div>

              <button className="pricing-btn" onClick={() => handlePayosTopup(250)} disabled={isSubmitting}>
                {isSubmitting ? 'Đang khởi tạo...' : 'Nâng Cấp Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="credits-layout-grid">
        <div className="credits-sidebar fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Zap className="text-primary" size={20} /> Mua thêm Credit
          </h2>

          <div className="qr-topup-container">
            <div className="topup-banner">
              <h3><Zap fill="#fde047" color="#fde047" size={24} /> Nạp SafeCode Credit</h3>
              <p>Nạp tiền siêu nhanh - An toàn tuyệt đối - Tự động 24/7</p>
              <div className="topup-features">
                <span><Zap size={14} /> Tức thì</span>
                <span><ShieldCheck size={14} /> An toàn</span>
                <span><RefreshCw size={14} /> Tự động</span>
              </div>
            </div>

            <div className="topup-card">
              <div className="topup-steps">
                <div className="topup-step active">
                  <span className="step-num">1</span>
                  <span>Nhập số tiền</span>
                </div>
                <div className="step-divider"></div>
                <div className="topup-step">
                  <span className="step-num">2</span>
                  <span>Quét mã QR</span>
                </div>
              </div>

              <h4 className="topup-title">Bạn muốn nạp bao nhiêu?</h4>
              <p className="topup-subtitle">Nhập số tiền và chọn tạo mã QR để thanh toán tức thì</p>

              <div className="topup-input-container">
                <input
                  type="number"
                  className="topup-input"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value.replace(/\D/g, ''))}
                />
                <span className="topup-currency">VNĐ</span>
              </div>
              <div className="topup-limits">
                Tối thiểu 10.000đ - Tối đa 50.000.000đ
              </div>

              <div className="quick-options">
                {[50, 100, 200, 500, 1000, 2000].map(val => (
                  <button
                    key={val}
                    className={`quick-btn ${creditsToBuy === val ? 'active' : ''}`}
                    onClick={() => setTopupAmount(String(val * 1000))}
                  >
                    {val < 1000 ? `${val}K` : `${val / 1000}M`}
                  </button>
                ))}
              </div>

              <div className="topup-summary">
                <div className="summary-row">
                  <span>Bạn thanh toán</span>
                  <strong>{(creditsToBuy * 1000).toLocaleString()} VNĐ</strong>
                </div>
                <div className="summary-row highlight">
                  <span>Bạn nhận được</span>
                  <strong>{creditsToBuy.toLocaleString()} Credit</strong>
                </div>
              </div>

              <button
                className={`btn-generate-qr ${creditsToBuy >= 10 ? 'ready' : ''}`}
                onClick={handlePayosTopup}
                disabled={isSubmitting || creditsToBuy < 10}
              >
                <QrCode size={20} /> {isSubmitting ? 'Đang khởi tạo...' : 'Tạo mã QR nạp tiền'}
              </button>
            </div>
          </div>
        </div>

        <div className="credits-main">
          {requests.length > 0 && (
            <div className="fade-in" style={{ animationDelay: '0.2s' }}>
              <h2 className="section-title mb-4 flex items-center gap-2">
                <Banknote size={20} className="text-primary" /> Lịch sử Nạp Credit
              </h2>
              <Card className="p-0 overflow-hidden mb-8 glass-panel border-0">
                <table className="credits-table premium-table">
                  <thead>
                    <tr>
                      <th>Ngày gửi</th>
                      <th>Số Credit</th>
                      <th>Thành tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req._id}>
                        <td className="text-sm text-muted">{new Date(req.createdAt).toLocaleString()}</td>
                        <td className="font-bold text-success">+{req.amount} CR</td>
                        <td className="font-medium">{req.amountVND.toLocaleString()} đ</td>
                        <td>
                          <span className={`status-badge status-${req.status}`}>
                            {req.status === 'pending' ? 'Chờ thanh toán' : req.status === 'approved' ? 'Thành công' : 'Từ chối'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {withdrawRequests.length > 0 && (
            <div className="fade-in" style={{ animationDelay: '0.2s' }}>
              <h2 className="section-title mb-4 flex items-center gap-2">
                <Banknote size={20} className="text-primary" /> Lịch sử Yêu cầu Rút Tiền
              </h2>
              <Card className="p-0 overflow-hidden mb-8 glass-panel border-0">
                <table className="credits-table premium-table">
                  <thead>
                    <tr>
                      <th>Ngày yêu cầu</th>
                      <th>Số Credit</th>
                      <th>Số tiền rút (VNĐ)</th>
                      <th>Trạng thái</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawRequests.map(req => (
                      <tr key={req._id}>
                        <td className="text-sm text-muted">{new Date(req.createdAt).toLocaleString()}</td>
                        <td className="font-bold text-danger">-{req.amount} CR</td>
                        <td className="font-medium">{req.amountVND.toLocaleString()} đ</td>
                        <td>
                          <span className={`status-badge status-${req.status}`}>
                            {req.status === 'pending' ? 'Chờ duyệt' : req.status === 'approved' ? 'Đã chuyển' : 'Từ chối'}
                          </span>
                        </td>
                        <td className="text-sm">{req.adminNote || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          <div className="fade-in" style={{ animationDelay: '0.3s' }}>
            <h2 className="section-title mb-4 flex items-center gap-2">
              <History size={20} className="text-primary" /> Biến động Số dư
            </h2>
            <Card className="p-0 overflow-hidden glass-panel border-0">
              <table className="credits-table premium-table">
                <thead>
                  <tr>
                    <th>Ngày giao dịch</th>
                    <th>Loại</th>
                    <th>Mô tả chi tiết</th>
                    <th>Biến động</th>
                    <th>Số dư sau</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="text-center p-8">Đang tải dữ liệu...</td></tr>
                  ) : history.length === 0 ? (
                    <tr><td colSpan="5" className="text-center p-8 text-muted">Bạn chưa có giao dịch nào.</td></tr>
                  ) : (
                    history.map(row => (
                      <tr key={row._id}>
                        <td className="text-sm text-muted">{new Date(row.createdAt).toLocaleString()}</td>
                        <td>
                          <span className={`type-badge type-${row.type}`}>{row.type}</span>
                        </td>
                        <td className="text-sm">{row.description}</td>
                        <td className="font-bold">
                          <div className={`flex items-center gap-1 ${row.amount > 0 ? 'text-success' : 'text-danger'}`}>
                            {getIcon(row.type, row.amount)} {formatAmount(row.amount)} CR
                          </div>
                        </td>
                        <td className="font-bold text-gray-700">{row.balanceAfter?.toFixed(1)} CR</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="pagination p-4 bg-gray-50 flex justify-center gap-3 border-t border-gray-100">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Trang trước</Button>
                  <span className="flex items-center px-4 font-medium text-sm bg-white border rounded shadow-sm">Trang {page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Trang sau</Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* PayOS QR Modal */}
      {qrData && createPortal(
        <div className="payos-modal-overlay fade-in">
          <div className="payos-modal-content">
            {/* Top Banner */}
            <div className="payos-banner">
              <span className="payos-banner-icon">💡</span>
              <span>Mở App Ngân hàng bất kỳ để <strong>quét mã VietQR</strong> hoặc <strong>chuyển khoản</strong> chính xác số tiền bên dưới</span>
            </div>

            <div className="payos-modal-body">
              {/* Left Side: QR & Logos */}
              <div className="payos-qr-section">
                <div className="vietqr-logo-container">
                  <span className="viet">Viet</span><span className="qr">QR</span> <span className="pro">PRO</span>
                </div>
                <div className="payos-qr-wrapper">
                  <QRCodeSVG 
                    value={qrData.qrCode} 
                    size={240} 
                    level="M"
                    imageSettings={{
                      src: "https://play-lh.googleusercontent.com/p4BaQ6Y8_NsDHpTzn26h2U8gqWHFyKNhKkG0rxSsnB3qD64Hw8HozfCDYLiZXt2L7jDot8MhsF3qFePuOW16=w256",
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>
                <div className="payos-bank-logos">
                  <span style={{ fontWeight: '800', fontStyle: 'italic', color: '#0d47a1', fontSize: '1.1rem' }}>napas <span style={{ color: '#2196f3' }}>247</span></span>
                  <div className="payos-logo-divider"></div>
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSMFqLbp_MUb1bOiQ92ZbMePy_Zf9tkoRrNaJFO9Hhpw&s=10" alt="Bank Logo" height="24" style={{ borderRadius: '4px' }} />
                </div>
                <button className="payos-cancel-btn" onClick={() => setQrData(null)}>Huỷ</button>
              </div>

              {/* Right Side: Details */}
              <div className="payos-details-section">
                <div className="payos-bank-info">
                  <div className="payos-bank-icon">
                    <img src="https://play-lh.googleusercontent.com/p4BaQ6Y8_NsDHpTzn26h2U8gqWHFyKNhKkG0rxSsnB3qD64Hw8HozfCDYLiZXt2L7jDot8MhsF3qFePuOW16=w256" alt="MB" width="36" height="36" style={{ borderRadius: '50%' }} />
                  </div>
                  <div>
                    <div className="payos-bank-label">Ngân hàng</div>
                    <div className="payos-bank-name">Ngân hàng TMCP Quân đội</div>
                  </div>
                </div>

                <div className="payos-detail-item">
                  <div className="payos-detail-title">Chủ tài khoản:</div>
                  <div className="payos-detail-value uppercase font-bold">{qrData.accountName}</div>
                </div>

                <div className="payos-detail-item">
                  <div className="payos-detail-title">Số tài khoản:</div>
                  <div className="payos-detail-value-wrapper">
                    <span className="payos-detail-value font-bold">{qrData.accountNumber}</span>
                    <button className="payos-copy-btn" onClick={() => copyToClipboard(qrData.accountNumber, "Số tài khoản")}>Sao chép</button>
                  </div>
                </div>

                <div className="payos-detail-item">
                  <div className="payos-detail-title">Số tiền:</div>
                  <div className="payos-detail-value-wrapper">
                    <span className="payos-detail-value font-bold">{qrData.amount.toLocaleString()} vnđ</span>
                    <button className="payos-copy-btn" onClick={() => copyToClipboard(qrData.amount, "Số tiền")}>Sao chép</button>
                  </div>
                </div>

                <div className="payos-detail-item">
                  <div className="payos-detail-title">Nội dung:</div>
                  <div className="payos-detail-value-wrapper">
                    <span className="payos-detail-value font-bold">{qrData.description}</span>
                    <button className="payos-copy-btn" onClick={() => copyToClipboard(qrData.description, "Nội dung")}>Sao chép</button>
                  </div>
                </div>

                <div className="payos-warning">
                  Lưu ý : Nhập chính xác số tiền <strong>{qrData.amount.toLocaleString()}</strong> khi chuyển khoản
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && createPortal(
        <div className="payos-modal-overlay fade-in" style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="payos-modal-content" style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '450px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowWithdrawModal(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <XCircle size={24} />
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' 
              }}>
                <Banknote size={32} color="#10b981" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc', margin: '0 0 8px 0' }}>Rút Tiền Về Bank</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Quy đổi Credit thành VNĐ (1 CR = 2,000 VNĐ)</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#cbd5e1', marginBottom: '8px', fontWeight: '500' }}>
                  <span>Số Credit muốn rút</span>
                  <span style={{ color: '#06b6d4' }}>Khả dụng: {user?.credits?.toFixed(1)} CR</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    style={{
                      width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white', fontSize: '16px', outline: 'none', transition: 'all 0.2s'
                    }}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    min="50"
                  />
                  <Zap size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                <div style={{ 
                  marginTop: '12px', padding: '12px', borderRadius: '12px', 
                  background: 'rgba(16, 185, 129, 0.05)', border: '1px dashed rgba(16, 185, 129, 0.2)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Thực nhận:</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '18px' }}>
                    {(withdrawAmount * 1000).toLocaleString()} VNĐ
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#cbd5e1', marginBottom: '8px', fontWeight: '500' }}>Ngân hàng thụ hưởng</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white', fontSize: '14px', outline: 'none'
                    }}
                    placeholder="VD: Vietcombank, MB Bank, MoMo..."
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#cbd5e1', marginBottom: '8px', fontWeight: '500' }}>Số Tài Khoản</label>
                  <input 
                    type="text" 
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white', fontSize: '14px', outline: 'none'
                    }}
                    placeholder="VD: 0123456789"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#cbd5e1', marginBottom: '8px', fontWeight: '500' }}>Tên Chủ Thẻ</label>
                  <input 
                    type="text" 
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white', fontSize: '14px', outline: 'none', textTransform: 'uppercase'
                    }}
                    placeholder="VD: NGUYEN VAN A"
                    value={bankDetails.accountName}
                    onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>
            </div>

            <Button 
              variant="primary" 
              className="w-full mt-8" 
              style={{ 
                padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none',
                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)', color: '#fff'
              }}
              onClick={handleWithdraw} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận & Gửi yêu cầu'}
            </Button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Credits;
