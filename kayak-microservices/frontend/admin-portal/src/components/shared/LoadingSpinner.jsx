/**
 * Loading Spinner Component
 */

import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  text = '',
  className = '' 
}) => {
  return (
    <div className={`spinner-container ${className}`}>
      <div className={`spinner spinner-${size}`}></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
