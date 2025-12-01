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
      const token = localStorage.getItem('admin-token');
      
      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);
        // Only set user if they are owner or admin
        if (parsedUser.role === 'owner' || parsedUser.role === 'admin') {
          setUser(parsedUser);
        } else {
          // Clear storage if user is not authorized for admin portal
          localStorage.removeItem('user');
          localStorage.removeItem('admin-token');
        }
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('admin-token');
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
      
      // Verify user has owner or admin role
      if (data.user.role !== 'owner' && data.user.role !== 'admin') {
        throw new Error('Access denied. Owner or Admin account required.');
      }
      
      // Store user and token
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('admin-token', data.token);
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      // Ensure role is set to 'owner' for admin portal registration
      const registrationData = {
        ...userData,
        role: 'owner'
      };

      // Call the backend API
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
      localStorage.setItem('admin-token', data.token);
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('admin-token');
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
