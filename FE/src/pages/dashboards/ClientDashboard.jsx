import React from 'react';
import { FolderLock, Key, ShieldCheck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import './Dashboard.css';
import Button from '../../components/ui/Button';

const ClientDashboard = ({ files, updateFileStatus }) => {
  const clientFiles = files || [];
  const columns = ['File Details', 'Freelancer', 'Status'];

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title">Client Dashboard</h1>
          <p className="page-subtitle">Access your securely delivered source codes.</p>
        </div>
      </div>

      <div className="dashboard-stats-grid mb-6">
        <Card title="Files Received" icon={<FolderLock size={24} />} value={8} />
        <Card title="Pending Unlocks" icon={<ShieldCheck size={24} />} value={1} />
        
      </div>

      <div className="dashboard-section">
        <h2 className="section-title mb-4">Received Files</h2>
        <Table data={clientFiles} columns={columns} userRole="client" updateFileStatus={updateFileStatus} />
      </div>
    </div>
  );
};

export default ClientDashboard;
