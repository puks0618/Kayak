/**
 * Sidebar Component
 * Navigation sidebar with menu items
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/flights', label: 'Flights', icon: '✈️' },
    { path: '/cars', label: 'Cars', icon: '🚗' },
    { path: '/bookings', label: 'Bookings', icon: '📅' },
    { path: '/users', label: 'Users', icon: '👥' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/billing', label: 'Billing', icon: '💳' },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Logo/Brand */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-letter">K</span>
          {!isCollapsed && (
            <>
              <span className="logo-letter">A</span>
              <span className="logo-letter">Y</span>
              <span className="logo-letter">A</span>
              <span className="logo-letter">K</span>
            </>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            title={item.label}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Toggle Button */}
      <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
        {isCollapsed ? '→' : '←'}
      </button>
    </aside>
  );
};

export default Sidebar;
