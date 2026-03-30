import React from 'react';
import { UploadCloud, FileLock2, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import './Dashboard.css';

const FreelancerDashboard = ({ files, updateFileStatus, pagination }) => {
  const { user } = useAuth();
  const { totalFiles } = pagination || {};
  const columns = ['File Details', 'Client', 'Status', 'Amount'];

  // Dashboard only shows 5 most recent — full list is on /files
  const recentFiles = files.slice(0, 5);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title">Freelancer Dashboard</h1>
          <p className="page-subtitle">Manage your secure deliveries and credits.</p>
        </div>
        <Link to="/upload">
          <Button variant="primary">
            <UploadCloud size={18} />
            Encrypt & Send New File
          </Button>
        </Link>
      </div>

      <div className="dashboard-stats-grid mb-6">
        <Card title="Total Files Sent" icon={<FileLock2 size={24} />} value={totalFiles || files.length} />
        <Card title="Pending Payments" icon={<ShieldCheck size={24} />} value={`${files.filter(f => f.status.includes('Pending') || f.status === 'Testing Phase' || f.status === 'Locked').reduce((sum, f) => sum + (f.amount || 0), 0).toLocaleString()} VND`} />
        <Card 
          title="Available Credits" 
          icon={<CreditCard size={24} />} 
          value={`${user?.credits?.toFixed(1) || 0} Credits`}
          className="credits-card"
        >
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-muted">Pay-per-file plan</span>
            <Link to="/credits"><Button variant="outline" className="text-sm py-1">Xem Credits</Button></Link>
          </div>
        </Card>
      </div>

      <div className="dashboard-section">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title">Recent Deliveries</h2>
          <Link to="/files" className="view-all-link">
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>
        <Table data={recentFiles} columns={columns} userRole="freelancer" updateFileStatus={updateFileStatus} />
      </div>
    </div>
  );
};

export default FreelancerDashboard;
