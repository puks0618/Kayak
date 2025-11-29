import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verify user has owner or admin role
  if (user && user.role !== 'owner' && user.role !== 'admin') {
    // Redirect unauthorized users back to traveller portal
    window.location.href = 'http://localhost:5175';
    return null;
  }

  return children;
};

export default ProtectedRoute;
