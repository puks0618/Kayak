/**
 * Admin Portal App Component
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import FlightsManagement from './pages/FlightsManagement';
import BookingsManagement from './pages/BookingsManagement';
import UsersManagement from './pages/UsersManagement';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Signout from './pages/Signout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signout" element={<Signout />} />
          
          {/* Protected routes with Layout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/flights" element={<FlightsManagement />} />
                  <Route path="/bookings" element={<BookingsManagement />} />
                  <Route path="/users" element={<UsersManagement />} />
                  <Route path="/analytics" element={<Analytics />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

