import React from 'react';
import './Badge.css';

const statusMap = {
  'draft':             { cls: 'status-draft',     label: 'Draft' },
  'uploaded':          { cls: 'status-uploaded',  label: 'Uploaded' },
  'testing phase':     { cls: 'status-testing',   label: 'Testing' },
  'locked':            { cls: 'status-locked',    label: 'Locked' },
  'verifying payment': { cls: 'status-verifying', label: 'Verifying...' },
  'paid':              { cls: 'status-paid',      label: 'Paid' },
  'delivered':         { cls: 'status-paid',      label: 'Delivered' },
  'disputed':          { cls: 'status-disputed',  label: 'Disputed' },
  'active':            { cls: 'status-paid',      label: 'Active' },
  'pending payment':   { cls: 'status-verifying', label: 'Pending' },
};

const Badge = ({ status }) => {
  const key = (status || '').toLowerCase();
  const { cls, label } = statusMap[key] || { cls: 'status-draft', label: status };

  return (
    <span className={`status-badge ${cls}`}>
      <span className="status-badge-dot" />
      {label}
    </span>
  );
};

export default Badge;
