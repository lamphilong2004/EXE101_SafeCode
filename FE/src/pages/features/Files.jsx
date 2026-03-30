import React, { useState, useMemo } from 'react';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import '../dashboards/Dashboard.css';

const STATUSES = ['All', 'Uploaded', 'Testing Phase', 'Locked', 'Verifying Payment', 'Paid', 'Disputed'];

const Files = ({ userRole, files = [], updateFileStatus, pagination }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const { page, totalPages, setPage } = pagination || {};

  const columns = ['File Details', userRole === 'freelancer' ? 'Client' : 'Freelancer', 'Status'];
  if (userRole === 'freelancer') columns.push('Amount');

  const filteredFiles = useMemo(() => {
    if (activeFilter === 'All') return files;
    return files.filter(f => f.status === activeFilter);
  }, [files, activeFilter]);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title">{userRole === 'freelancer' ? 'Sent Files' : 'Received Files'}</h1>
          <p className="page-subtitle">Complete history of your file transfers.</p>
        </div>
      </div>

      <div className="filter-tabs mb-4">
        {STATUSES.map(s => (
          <button
            key={s}
            className={`filter-tab ${activeFilter === s ? 'active' : ''}`}
            onClick={() => setActiveFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="dashboard-section">
        <Table data={filteredFiles} columns={columns} userRole={userRole} updateFileStatus={updateFileStatus} />

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
