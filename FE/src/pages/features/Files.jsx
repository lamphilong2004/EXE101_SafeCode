import React from 'react';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import '../dashboards/Dashboard.css';

const STATUSES = ['All', 'Uploaded', 'Testing Phase', 'Locked', 'Verifying Payment', 'Paid', 'Disputed'];

const Files = ({ userRole, files = [], updateFileStatus, pagination }) => {
  const { page, totalPages, setPage } = pagination || {};

  const columns = ['File Details', userRole === 'freelancer' ? 'Client' : 'Freelancer', 'Status'];
  if (userRole === 'freelancer') columns.push('Amount');

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title">{userRole === 'freelancer' ? 'Sent Files' : 'Received Files'}</h1>
          <p className="page-subtitle">Complete history of your file transfers.</p>
        </div>
      </div>

      <div className="dashboard-section">
        <Table data={files} columns={columns} userRole={userRole} updateFileStatus={updateFileStatus} />

        {totalPages > 1 && (
          <div className="pagination-controls mt-6 flex justify-center items-center gap-4">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={16} /> Prev
            </Button>
            <span className="text-sm font-medium">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Files;
