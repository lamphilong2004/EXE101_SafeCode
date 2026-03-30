import React, { useState, useEffect } from 'react';
import { CreditCard, Zap, Check, ArrowUpRight, ArrowDownRight, History } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Credits.css';

const Credits = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/credits/history?page=${page}&limit=10`);
        setHistory(res.data.records);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        console.error("Failed to fetch credit history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [page]);

  const getIcon = (type, amount) => {
    if (amount > 0) return <ArrowUpRight className="text-success" size={16} />;
    return <ArrowDownRight className="text-danger" size={16} />;
  };

  const formatAmount = (amt) => (amt > 0 ? `+${amt}` : amt);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title">Credits & Billing</h1>
          <p className="page-subtitle">Manage your subscription and pay-per-file credits.</p>
        </div>
      </div>

      <div className="dashboard-stats-grid mb-6">
        <Card 
          title="Available Credits" 
          icon={<CreditCard size={24} />} 
          value={`${user?.credits?.toFixed(1) || 0} Credits`} 
        />
        <Card 
          title="Current Plan" 
          icon={<Zap size={24} />} 
          value={user?.subscription?.status === 'active' ? "Pro Unlimited" : "Pay-per-file"} 
        />
      </div>

      <div className="credits-layout-grid">
        <div className="credits-main">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <History size={20} /> Transaction History
          </h2>
          <Card className="p-0 overflow-hidden">
            <table className="credits-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center p-4">Loading history...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan="5" className="text-center p-4">No transactions found.</td></tr>
                ) : (
                  history.map(row => (
                    <tr key={row._id}>
                      <td className="text-xs">{new Date(row.createdAt).toLocaleString()}</td>
                      <td>
                        <span className={`type-badge type-${row.type}`}>{row.type}</span>
                      </td>
                      <td className="text-xs">{row.description}</td>
                      <td className={`font-bold ${row.amount > 0 ? 'text-success' : 'text-danger'}`}>
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
                <span className="flex items-center px-2 text-sm">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            )}
          </Card>
        </div>

        <div className="credits-sidebar">
          <h2 className="section-title mb-4">Pricing</h2>
          <div className="pricing-card compact mb-4">
            <div className="price-header">
              <h3>Pay-per-file</h3>
              <div className="price-tag">10,000 VND<small>/Credit</small></div>
            </div>
            <ul className="features text-sm">
              <li><Check size={14} className="text-success" /> Tiered pricing (1-8 Credits)</li>
              <li><Check size={14} className="text-success" /> Secure Encryption</li>
              <li><Check size={14} className="text-success" /> URL/Build Sandbox support</li>
            </ul>
          </div>

          <div className="pricing-card compact popular">
            <div className="popular-badge">Subscription</div>
            <div className="price-header">
              <h3>Pro Unlimited</h3>
              <div className="price-tag">290,000 VND<small>/month</small></div>
            </div>
            <ul className="features text-sm">
              <li><Check size={14} className="text-success" /> Unlimited Uploads (No Credit usage)</li>
              <li><Check size={14} className="text-success" /> Priority Sandbox processing</li>
              <li><Check size={14} className="text-success" /> Advanced Watermarking</li>
            </ul>
            <Button variant="primary" className="w-full mt-2" size="sm">Coming Soon</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
