import React from 'react';
import './Card.css';

const Card = ({ title, icon, value, children, className = '' }) => {
  return (
    <div className={`crypto-card ${className}`}>
      {(title || icon) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {icon && <div className="card-icon">{icon}</div>}
        </div>
      )}
      <div className="card-body">
        {value && <div className="card-value">{value}</div>}
        {children}
      </div>
    </div>
  );
};

export default Card;
