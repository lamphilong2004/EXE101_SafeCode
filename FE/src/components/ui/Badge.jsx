import React from 'react';
import './Badge.css';

const Badge = ({ status }) => {
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'paid':
      case 'active':
        return 'badge-success';
      case 'testing phase':
      case 'verifying payment':
        return 'badge-primary';
      case 'pending payment':
      case 'processing':
      case 'awaiting evidence':
        return 'badge-warning';
      case 'disputed':
      case 'locked':
      case 'revoked':
        return 'badge-error';
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
