/**
 * Signout Page
 * Handles user logout and redirects to KAYAK login page
 */

import React, { useEffect } from 'react';
import './Signout.css';

const Signout = () => {
  useEffect(() => {
    // Clear any stored authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.clear();
    console.log('Signout component mounted - buttons should be visible');
  }, []);

  const handleTravelerLogin = () => {
    window.location.href = 'http://localhost:5175/';
  };

  const handleOwnerLogin = () => {
    window.location.href = 'http://localhost:5174/';
  };

  return (
    <div className="signout-container">
      <div className="signout-card">
        <div className="signout-icon">
          <div className="logo">
            <span className="logo-letter">K</span>
            <span className="logo-letter">A</span>
            <span className="logo-letter">Y</span>
            <span className="logo-letter">A</span>
            <span className="logo-letter">K</span>
          </div>
        </div>
        <h1>Signed Out Successfully</h1>
        <p>Choose your login portal to continue</p>
        <div className="login-buttons">
          <button className="login-btn traveler-btn" onClick={handleTravelerLogin}>
            <span className="btn-icon">✈️</span>
            <span className="btn-text">Traveler Login</span>
          </button>
          <button className="login-btn owner-btn" onClick={handleOwnerLogin}>
            <span className="btn-icon">🏠</span>
            <span className="btn-text">Owner Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signout;
