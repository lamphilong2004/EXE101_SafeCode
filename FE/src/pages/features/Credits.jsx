import React, { useState, useEffect } from 'react';
import { CreditCard, Zap, Check, ArrowUpRight, ArrowDownRight, History, Banknote, Upload, Copy } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Credits.css';

const Credits = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [creditsToBuy, setCreditsToBuy] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billUrl, setBillUrl] = useState('');

  const [bankConfig, setBankConfig] = useState({
    bankName: "Loading...",
    accountNumber: "...",
    accountName: "...",
    branch: "..."
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [histRes, reqRes, bankRes] = await Promise.all([
          api.get(`/credits/history?page=${page}&limit=10`),
          api.get('/credits/my-requests'),
          api.get('/credits/bank-info')
        ]);
        setHistory(histRes.data.records);
        setTotalPages(histRes.data.totalPages);
        setRequests(reqRes.data.requests);
        setBankConfig(bankRes.data);
      } catch (err) {
        console.error("Failed to fetch credits data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

  const handleRequestCredits = async () => {
    if (creditsToBuy < 1) {
      toast.error("Vui lòng nhập số credit hợp lệ.");
      return;
    }
    if (!billUrl) {
      toast.error("Vui lòng tải lên ảnh bill chuyển khoản.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post('/credits/request', { amount: creditsToBuy, billImageUrl: billUrl });
      if (res.data.success) {
        toast.success("Đã gửi yêu cầu nạp Credit thành công! Vui lòng chờ Admin duyệt.");
        setRequests([res.data.request, ...requests]);
        setBillUrl('');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Gửi yêu cầu thất bại.");
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
          value={<div className="subscription-value">Pay-per-file</div>}
        />
      </div>

      <div className="credits-layout-grid">
        <div className="credits-sidebar fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Zap className="text-primary" size={20} /> Mua thêm Credit
          </h2>
          
          <div className="pricing-card premium-buy-card">
            <div className="price-header">
              <h3>Chuyển khoản Ngân hàng</h3>
              <div className="price-tag">1,000đ<small>/Credit</small></div>
            </div>
            
            <div className="form-group mb-5">
              <label className="text-sm font-bold mb-2 block">Số Credit muốn nạp:</label>
              <div className="credits-input-wrapper">
                <input 
                  type="number" 
                  min="1" 
                  max="10000"
                  value={creditsToBuy} 
                  onChange={(e) => setCreditsToBuy(Number(e.target.value))} 
                  className="credits-input"
                />
                <span className="credits-suffix">CR</span>
              </div>
            </div>

            <div className="transfer-info-box mb-5">
              <p className="box-title">Thông tin chuyển khoản</p>
              
              <div className="info-row">
                <span>Ngân hàng:</span>
                <strong>{bankConfig.bankName}</strong>
              </div>
              
              <div className="info-row copyable">
                <span>Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <strong className="text-primary text-lg">{bankConfig.accountNumber}</strong>
                  <button className="icon-btn sm" onClick={() => copyToClipboard(bankConfig.accountNumber, 'Số tài khoản')} title="Copy số tài khoản">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              
              <div className="info-row">
                <span>Chủ tài khoản:</span>
                <strong>{bankConfig.accountName}</strong>
              </div>

              <div className="info-row copyable">
                <span>Số tiền:</span>
                <div className="flex items-center gap-2">
                  <strong className="text-danger text-lg">{transferAmount.toLocaleString()} VNĐ</strong>
                  <button className="icon-btn sm" onClick={() => copyToClipboard(transferAmount.toString(), 'Số tiền')} title="Copy số tiền">
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="info-row copyable">
                <span>Nội dung CK:</span>
                <div className="flex items-center gap-2">
                  <strong className="tracking-wide bg-yellow-100 px-2 py-1 rounded text-gray-800">{transferContent}</strong>
                  <button className="icon-btn sm" onClick={() => copyToClipboard(transferContent, 'Nội dung CK')} title="Copy nội dung">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group mb-5">
              <label className="text-sm font-bold mb-2 block">Link ảnh Bill chuyển khoản:</label>
              <input 
                type="text" 
                placeholder="Dán link ảnh bằng chứng giao dịch..." 
                value={billUrl} 
                onChange={(e) => setBillUrl(e.target.value)} 
                className="form-input text-sm"
              />
            </div>

            <Button variant="primary" className="w-full submit-credits-btn" onClick={handleRequestCredits} disabled={isSubmitting}>
              <Upload size={18} className="mr-2" /> {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu cầu Nạp'}
            </Button>
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
                            {req.status === 'pending' ? 'Đang chờ' : req.status === 'approved' ? 'Thành công' : 'Từ chối'}
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
