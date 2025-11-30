import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);
        // CRITICAL: Only allow admin role for admin portal
        if (parsedUser.role === 'admin') {
          setUser(parsedUser);
        } else {
          // Clear storage if user is not admin
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      // Call the backend API
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message =
          errorBody.error ||
          errorBody.message ||
          (response.status === 401
            ? 'Email or password is incorrect.'
            : response.status === 400
            ? 'Please check your email and password.'
            : 'Login failed. Please try again.');
        throw new Error(message);
      }

      const data = await response.json();
      
      // CRITICAL: Only admins can access admin portal
      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Admin account required.');
      }
      
      // Store user and token
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      // DISABLED: Admin accounts should not be created via signup
      // Admins are created via database seeding or CLI commands only
      return { 
        success: false, 
        error: 'Admin registration is not allowed. Please contact system administrator.' 
      };

      // Original code kept for reference (DISABLED)
      /*
      const registrationData = {
        ...userData,
        role: 'admin'  // Changed from 'owner' to 'admin'
      };

      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message =
          errorBody.error ||
          errorBody.message ||
          (response.status === 409
            ? 'An account with this email already exists. Try logging in instead.'
            : 'Registration failed. Please try again.');
        throw new Error(message);
      }

      const data = await response.json();
      
      // Store user and token
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
