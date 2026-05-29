import React, { useState, useEffect } from 'react';
import { CreditCard, Zap, Check, ArrowUpRight, ArrowDownRight, History, ShoppingCart, Upload, Banknote } from 'lucide-react';
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
        toast.success("Đã gửi yêu cầu nạp Credit. Vui lòng chờ Admin duyệt.");
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

  const getIcon = (type, amount) => {
    if (amount > 0) return <ArrowUpRight className="text-success" size={16} />;
    return <ArrowDownRight className="text-danger" size={16} />;
  };

  const formatAmount = (amt) => (amt > 0 ? `+${amt}` : amt);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title">Credits & Thanh toán</h1>
          <p className="page-subtitle">Quản lý số dư và nạp thêm Credit để tiếp tục giao dịch.</p>
        </div>
      </div>

      <div className="dashboard-stats-grid mb-6">
        <Card
          title="Credit Khả dụng"
          icon={<CreditCard size={24} />}
          value={`${user?.credits?.toFixed(1) || 0} Credits`}
        />
        <Card
          title="Gói hiện tại"
          icon={<Zap size={24} />}
          value={user?.subscription?.status === 'active' ? "Pro Unlimited" : "Pay-per-file"}
        />
      </div>

      <div className="credits-layout-grid">
        <div className="credits-main">
          {requests.length > 0 && (
            <>
              <h2 className="section-title mb-4 flex items-center gap-2">
                <Banknote size={20} /> Lịch sử Nạp Credit (Chuyển khoản)
              </h2>
              <Card className="p-0 overflow-hidden mb-6">
                <table className="credits-table">
                  <thead>
                    <tr>
                      <th>Ngày gửi</th>
                      <th>Số Credit</th>
                      <th>Số tiền (VND)</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req._id}>
                        <td className="text-xs">{new Date(req.createdAt).toLocaleString()}</td>
                        <td className="font-bold">+{req.amount}</td>
                        <td>{req.amountVND.toLocaleString()}</td>
                        <td>
                          <span className="type-badge">
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}

          <h2 className="section-title mb-4 flex items-center gap-2">
            <History size={20} /> Biến động Số dư
          </h2>
          <Card className="p-0 overflow-hidden">
            <table className="credits-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Loại</th>
                  <th>Mô tả</th>
                  <th>Biến động</th>
                  <th>Số dư</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center p-4">Đang tải...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan="5" className="text-center p-4">Chưa có giao dịch.</td></tr>
                ) : (
                  history.map(row => (
                    <tr key={row._id}>
                      <td className="text-xs">{new Date(row.createdAt).toLocaleString()}</td>
                      <td>
                        <span className={`type-badge type-${row.type}`}>{row.type}</span>
                      </td>
                      <td className="text-xs">{row.description}</td>
                      <td className="font-bold">
                        <div className="flex items-center gap-1">
                          {getIcon(row.type, row.amount)} {formatAmount(row.amount)}
                        </div>
                      </td>
                      <td className="font-bold">{row.balanceAfter?.toFixed(1)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="pagination p-3 border-t flex justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
                <span className="flex items-center px-2 text-sm">Trang {page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            )}
          </Card>
        </div>

        <div className="credits-sidebar">
          <h2 className="section-title mb-4">Nạp Credit</h2>
          
          <div className="pricing-card compact mb-6" style={{ borderColor: 'var(--primary-color)' }}>
            <div className="price-header">
              <h3>Chuyển khoản Ngân hàng</h3>
              <div className="price-tag">1,000 VND<small>/Credit</small></div>
            </div>
            
            <div className="mt-4 mb-4">
              <label className="text-sm font-bold mb-1 block">Số Credit muốn nạp:</label>
              <div className="flex gap-2 items-center">
                <input 
                  type="number" 
                  min="1" 
                  max="10000"
                  value={creditsToBuy} 
                  onChange={(e) => setCreditsToBuy(Number(e.target.value))} 
                  className="w-full p-2 border rounded text-sm"
                  style={{ borderColor: 'var(--border-color)', outline: 'none' }}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded mb-4 text-sm border">
              <p className="font-bold text-primary mb-2">Thông tin chuyển khoản:</p>
              <p>Ngân hàng: <b>{bankConfig.bankName}</b></p>
              <p>Số TK: <b>{bankConfig.accountNumber}</b></p>
              <p>Chủ TK: <b>{bankConfig.accountName}</b></p>
              <p>Số tiền cần chuyển: <b className="text-danger">{(creditsToBuy * 1000).toLocaleString()} VND</b></p>
              <p>Nội dung: <b>NẠP SAFE {user?.email}</b></p>
            </div>

            <div className="mb-4">
              <label className="text-sm font-bold mb-1 block">Tải lên ảnh Bill chuyển khoản:</label>
              <input 
                type="text" 
                placeholder="Nhập URL ảnh Bill (Tạm thời)" 
                value={billUrl} 
                onChange={(e) => setBillUrl(e.target.value)} 
                className="w-full p-2 border rounded text-sm"
                style={{ borderColor: 'var(--border-color)', outline: 'none' }}
              />
              <p className="text-xs text-muted mt-1 italic">*Tạm thời dán link ảnh để test flow.</p>
            </div>

            <Button variant="primary" className="w-full" size="sm" onClick={handleRequestCredits} disabled={isSubmitting}>
              <Upload size={16} className="mr-2" /> {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu cầu Nạp'}
            </Button>
          </div>

          <div className="pricing-card compact popular">
            <div className="popular-badge">Subscription</div>
            <div className="price-header">
              <h3>Pro Unlimited</h3>
              <div className="price-tag">180,000 VND<small>/tháng</small></div>
            </div>
            <ul className="features text-sm">
              <li><Check size={14} className="text-success" /> Upload không giới hạn (Không tốn Credit)</li>
              <li><Check size={14} className="text-success" /> Xử lý Sandbox ưu tiên</li>
              <li><Check size={14} className="text-success" /> Tính năng chống sao chép nâng cao</li>
            </ul>
            <Button variant="outline" className="w-full mt-2" size="sm" disabled>Sắp ra mắt</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
