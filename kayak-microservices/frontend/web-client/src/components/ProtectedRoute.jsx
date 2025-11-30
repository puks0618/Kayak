/**
 * Protected Route Component
 * Ensures only users with specific roles can access certain routes
 * Validates session with backend on mount
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { validateSession, clearCredentials } from '../store/authSlice';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, isAuthenticated, sessionValid, loading } = useSelector((state) => state.auth);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // If we have a token but haven't validated the session yet
      const token = localStorage.getItem('token');
      
      if (token && sessionValid === null) {
        try {
          await dispatch(validateSession()).unwrap();
        } catch (error) {
          console.error('Session validation failed:', error);
          // Clear credentials if validation fails
          dispatch(clearCredentials());
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setIsValidating(false);
    };

    checkSession();
  }, [dispatch, sessionValid]);

  // Show loading while validating session
  if (loading || isValidating) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '18px',
        color: '#6B7280'
      }}>
        Loading...
      </div>
    );
  }

  // Not logged in - redirect to login with return path
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Session is invalid - clear and redirect
  if (sessionValid === false) {
    dispatch(clearCredentials());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    if (user.role === 'admin') {
      window.location.href = 'http://localhost:5174';
      return null;
    } else if (user.role === 'owner') {
      return <Navigate to="/owner/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // User is authorized
  return children;
};

export default ProtectedRoute;
