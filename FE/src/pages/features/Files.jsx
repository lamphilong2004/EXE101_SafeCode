import React from 'react';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import { Filter } from 'lucide-react';
import '../dashboards/Dashboard.css';

const Files = ({ userRole, files = [], updateFileStatus }) => {

  const columns = ['File Details', userRole === 'freelancer' ? 'Client' : 'Freelancer', 'Status'];
  if (userRole === 'freelancer') columns.push('Amount');

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title">{userRole === 'freelancer' ? 'Sent Files' : 'Received Files'}</h1>
          <p className="page-subtitle">Complete history of your file transfers.</p>
        </div>
        <Button variant="outline">
          <Filter size={18} />
          Filter
        </Button>
      </div>

      <div className="dashboard-section">
        <Table data={files} columns={columns} userRole={userRole} updateFileStatus={updateFileStatus} />
      </div>
    </div>
  );
};

export default Files;
