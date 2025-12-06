/**
 * Protected Route Component for Owner Portal
 * Ensures only authenticated owners can access routes
 */

import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, clearCredentials } from '../store/authSlice';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Check for auth in URL hash FIRST (synchronous)
  const hash = window.location.hash;
  if (hash.startsWith('#auth=')) {
    try {
      const authParam = hash.substring(6); // Remove '#auth='
      const authData = JSON.parse(decodeURIComponent(authParam));
      
      // Store in localStorage immediately
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      
      // Update Redux state immediately
      dispatch(setCredentials({ user: authData.user, token: authData.token }));
      
      // Clean URL without reload
      window.history.replaceState(null, '', window.location.pathname);
      
      // Don't return here, let it continue to render with the user now set
    } catch (error) {
      console.error('Error parsing auth from URL:', error);
    }
  }

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token && !user) {
      try {
        const parsedUser = JSON.parse(storedUser);
        dispatch(setCredentials({ user: parsedUser, token }));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, [dispatch, user]);

  // Check localStorage first before redirecting
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  
  // Not logged in - redirect to web-client login
  if (!storedUser || !storedToken) {
    if (!isAuthenticated || !user) {
      window.location.href = 'http://localhost:5175/login';
      return null;
    }
  }

  // Parse stored user for role check
  let userToCheck = user;
  if (!userToCheck && storedUser) {
    try {
      userToCheck = JSON.parse(storedUser);
    } catch (e) {
      console.error('Error parsing user:', e);
    }
  }

  // Check if user is owner or admin
  if (userToCheck && userToCheck.role !== 'owner' && userToCheck.role !== 'admin') {
    // Not an owner - redirect to web-client
    window.location.href = 'http://localhost:5175';
    return null;
  }

  // User is authorized owner
  return children;
};

export default ProtectedRoute;
