import React, { useState, useEffect } from 'react';
import { CreditCard, Zap, Check, ArrowUpRight, ArrowDownRight, History, Banknote, ShieldCheck, RefreshCw, QrCode, Crown, Diamond } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Credits.css';
import '../landing/Landing.css'; // Import pricing neon styles

const Credits = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [creditsToBuy, setCreditsToBuy] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [histRes, reqRes] = await Promise.all([
          api.get(`/credits/history?page=${page}&limit=10`),
          api.get('/credits/my-requests')
        ]);
        setHistory(histRes.data.records);
        setTotalPages(histRes.data.totalPages);
        setRequests(reqRes.data.requests);
      } catch (err) {
        console.error("Failed to fetch credits data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

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
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Không thể tạo mã QR nạp tiền.");
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

  const transferAmount = creditsToBuy * 1000;
  const transferContent = `NAP SAFE ${user?.email?.split('@')[0] || user?.id?.slice(-4)}`;

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title">Credits & Thanh toán</h1>
          <p className="page-subtitle">Nạp tiền để tiếp tục sử dụng các dịch vụ và mua bán Source Code an toàn.</p>
        </div>
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
                  value={creditsToBuy * 1000}
                  onChange={(e) => setCreditsToBuy(Math.floor(Number(e.target.value) / 1000))}
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
                    onClick={() => setCreditsToBuy(val)}
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
    </div>
  );
};

export default Credits;
