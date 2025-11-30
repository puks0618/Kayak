/**
 * Layout Component
 * Main layout wrapper with sidebar and header
 */

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="layout">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`layout-main ${isSidebarCollapsed ? 'layout-main-expanded' : ''}`}>
        <Header />
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
