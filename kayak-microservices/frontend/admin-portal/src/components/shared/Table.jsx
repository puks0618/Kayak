/**
 * Table Component
 * Basic wrapper for tables (TanStack Table will be used in specific implementations)
 */

import React from 'react';
import './Table.css';

const Table = ({ children, className = '' }) => {
  return (
    <div className="table-container">
      <table className={`table ${className}`}>{children}</table>
    </div>
  );
};

export default Table;
