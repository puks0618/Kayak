/**
 * Header Component
 * Top header with user profile and theme toggle
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './Header.css';

const Header = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // TODO: Get actual user data from auth context
  const user = {
    name: 'Admin Panel',
    email: 'john.doe@email.com',
    avatar: null,
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Page Title - Can be updated per page */}
        <div className="header-title">
          <h1>Admin Portal</h1>
        </div>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Theme Toggle */}
          <button
            className="header-action-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          {/* User Profile */}
          <div className="header-user">
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            className="header-action-btn logout-btn"
            onClick={() => navigate('/signout')}
            aria-label="Logout"
            title="Logout"
          >
            🚪
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
