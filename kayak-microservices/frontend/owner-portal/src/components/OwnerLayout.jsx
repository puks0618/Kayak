import React from 'react';
import { Outlet } from 'react-router-dom';
import OwnerHeader from './OwnerHeader';

const OwnerLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <OwnerHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default OwnerLayout;
