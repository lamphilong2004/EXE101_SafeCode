import React from 'react';
import { FolderLock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import './Dashboard.css';

const ClientDashboard = ({ files, updateFileStatus, pagination }) => {
  const { totalFiles } = pagination || {};
  const clientFiles = files || [];
  const columns = ['File Details', 'Freelancer', 'Status'];

  // Dashboard only shows 5 most recent — full list is on /files
  const recentFiles = clientFiles.slice(0, 5);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title">Client Dashboard</h1>
          <p className="page-subtitle">Access your securely delivered source codes.</p>
        </div>
      </div>

      <div className="dashboard-stats-grid mb-6">
        <Card title="Files Received" icon={<FolderLock size={24} />} value={totalFiles || files.length} />
        <Card title="Pending Unlocks" icon={<ShieldCheck size={24} />} value={clientFiles.filter(f => f.status === 'Testing Phase' || f.status === 'Locked').length} />
      </div>

      <div className="dashboard-section">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title">Received Files</h2>
          <Link to="/files" className="view-all-link">
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>
        <Table data={recentFiles} columns={columns} userRole="client" updateFileStatus={updateFileStatus} />
      </div>
    </div>
  );
};

export default ClientDashboard;
