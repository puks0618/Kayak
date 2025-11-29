/**
 * Metric Card Component
 * Display dashboard metric with icon and value
 */

import React from 'react';
import './MetricCard.css';

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  iconBg = '#646cff',
  loading = false 
}) => {
  return (
    <div className="metric-card">
      <div className="metric-card-content">
        <div className="metric-info">
          <div className="metric-title">{title}</div>
          <div className="metric-value">
            {loading ? (
              <div className="metric-skeleton"></div>
            ) : (
              formatValue(title, value)
            )}
          </div>
        </div>
        <div className="metric-icon" style={{ backgroundColor: iconBg }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Helper function to format values based on metric type
const formatValue = (title, value) => {
  if (title.toLowerCase().includes('revenue')) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  }
  
  return new Intl.NumberFormat('en-US').format(value || 0);
};

export default MetricCard;
