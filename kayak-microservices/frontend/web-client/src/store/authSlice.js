/**
 * Redux Auth Slice
 * Manages authentication state
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../api/authClient';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(email, password);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed');
    }
  }
);

export const validateSession = createAsyncThunk(
  'auth/validate',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.validateSession();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Session validation failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    // Clear token from storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
);

// Initialize from localStorage if available
const loadInitialState = () => {
  try {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      return {
        user: JSON.parse(savedUser),
        token: savedToken,
        isAuthenticated: true,
        loading: false,
        error: null,
        sessionValid: true,
      };
    }
  } catch (error) {
    console.error('Error loading auth state from localStorage:', error);
  }
  
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    sessionValid: null,
  };
};

const initialState = loadInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.sessionValid = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.sessionValid = false;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      // Update localStorage immediately
      try {
        localStorage.setItem('user', JSON.stringify(state.user));
        console.log('✅ User profile saved to localStorage:', state.user);
      } catch (error) {
        console.error('❌ Failed to save user to localStorage:', error);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.sessionValid = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.sessionValid = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Validate Session
      .addCase(validateSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(validateSession.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.valid) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.sessionValid = true;
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          state.sessionValid = false;
        }
      })
      .addCase(validateSession.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.sessionValid = false;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.sessionValid = false;
        state.error = null;
      });
  },
});

export const { clearError, setCredentials, clearCredentials, updateUser } = authSlice.actions;
export default authSlice.reducer;
