import React from 'react';
import './Badge.css';

const Badge = ({ status }) => {
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'paid':
      case 'active':
        return 'badge-success';
      case 'pending payment':
      case 'processing':
        return 'badge-warning';
      default:
        return 'badge-default';
    }
  };

  return (
    <span className={`badge ${getStatusClass(status)}`}>
      {status}
    </span>
  );
};

export default Badge;
