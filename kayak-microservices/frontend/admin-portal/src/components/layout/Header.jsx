/**
 * Header Component
 * Top header with user profile and theme toggle
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get user display name and email
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Admin Panel';
  const displayEmail = user?.email || 'user@kayak.com';
  const avatarInitial = user?.firstName?.charAt(0).toUpperCase() || 'A';

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
              {user?.profileImage ? (
                <img src={user.profileImage} alt={displayName} />
              ) : (
                <span>{avatarInitial}</span>
              )}
            </div>
            <div className="user-info">
              <div className="user-name">{displayName}</div>
              <div className="user-email">{displayEmail}</div>
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
