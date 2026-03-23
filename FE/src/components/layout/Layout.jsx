import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, userRole, notifications = [], onLogout }) => {
  return (
    <div className="layout-container">
      <Sidebar userRole={userRole} onLogout={onLogout} />
      <div className="main-content">
        <Header userRole={userRole} notifications={notifications} />
        <main className="page-container">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
