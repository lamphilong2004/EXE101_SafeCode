import React from 'react';
import { UploadCloud, FileLock2, CreditCard, ShieldCheck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import './Dashboard.css';

const FreelancerDashboard = ({ files, updateFileStatus }) => {
  const columns = ['File Details', 'Client', 'Status', 'Amount'];

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title">Freelancer Dashboard</h1>
          <p className="page-subtitle">Manage your secure deliveries and credits.</p>
        </div>
        <Button variant="primary">
          <UploadCloud size={18} />
          Encrypt & Send New File
        </Button>
      </div>

      <div className="dashboard-stats-grid mb-6">
        <Card title="Total Files Sent" icon={<FileLock2 size={24} />} value={files.length} />
        <Card title="Pending Payments" icon={<ShieldCheck size={24} />} value={`$${files.filter(f => f.status.includes('Pending') || f.status === 'Testing Phase' || f.status === 'Locked').reduce((sum, f) => sum + (f.amount || 0), 0).toFixed(2)}`} />
        <Card 
          title="Available Credits" 
          icon={<CreditCard size={24} />} 
          value="4 Uploads"
          className="credits-card"
        >
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-muted">Pay-per-file plan</span>
            <Button variant="outline" className="text-sm py-1">Upgrade</Button>
          </div>
        </Card>
      </div>

      <div className="dashboard-section">
        <h2 className="section-title mb-4">Recent Deliveries</h2>
        <Table data={files} columns={columns} userRole="freelancer" updateFileStatus={updateFileStatus} />
      </div>
    </div>
  );
};

export default FreelancerDashboard;
