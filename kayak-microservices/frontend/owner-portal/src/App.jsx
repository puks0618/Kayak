import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import OwnerLayout from './components/OwnerLayout';
import ProtectedRoute from './components/ProtectedRoute';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerCars from './pages/OwnerCars';
import OwnerHotels from './pages/OwnerHotels';
import OwnerBookings from './pages/OwnerBookings';

function App() {
  return (
    <Router>
      <Routes>
        {/* Protected Owner Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <OwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="cars" element={<OwnerCars />} />
          <Route path="hotels" element={<OwnerHotels />} />
          <Route path="bookings" element={<OwnerBookings />} />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
