/**
 * Main App Component
 * User-facing web application
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SharedLayout from './components/SharedLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import FlightResults from './pages/FlightResults';
import FareSelectionPage from './pages/FareSelectionPage';
import AirlineReviews from './pages/AirlineReviews';
import Stays from './pages/Stays';
import StaysSearch from './pages/StaysSearch';
import HotelDetail from './pages/HotelDetail';
import BookingConfirmation from './pages/BookingConfirmation';
import FlightBookingConfirmation from './pages/FlightBookingConfirmation';
import MyTrips from './pages/MyTrips';
import Favorites from './pages/Favorites';
import UserProfile from './pages/UserProfile';
import UserReviews from './pages/UserReviews';
import Cars from './pages/Cars';
import CarResults from './pages/CarResults';
import CarDetail from './pages/CarDetail';
import CarBookingConfirmation from './pages/CarBookingConfirmation';
import CarBookingSuccess from './pages/CarBookingSuccess';
import Packages from './pages/Packages';
import AIMode from './pages/AIMode';
import Listings from './pages/Listings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BillingDashboard from './pages/BillingDashboard';
import BillingList from './pages/BillingList';
import BillingDetail from './pages/BillingDetail';
import CreateBilling from './pages/CreateBilling';
import InvoiceViewerPage from './pages/InvoiceViewerPage';
// Owner pages moved to owner-portal (port 5180)
// import OwnerDashboard from './pages/OwnerDashboard';
// import OwnerCars from './pages/OwnerCars';
// import OwnerHotels from './pages/OwnerHotels';
// import OwnerBookings from './pages/OwnerBookings';
// import CarForm from './pages/CarForm';

// Component to remove hash from URL
function HashRemover() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If URL has a hash, remove it
    if (window.location.hash) {
      const cleanPath = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', cleanPath);
    }
  }, [location]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <HashRemover />
      <Routes>
        {/* Pages without layout (Login/Signup) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Public routes - No login required */}
        <Route 
          path="/" 
          element={<SharedLayout><Home /></SharedLayout>} 
        />
        <Route 
          path="/flights/results" 
          element={<SharedLayout><FlightResults /></SharedLayout>} 
        />
        <Route 
          path="/flights/fare-selection" 
          element={<SharedLayout><FareSelectionPage /></SharedLayout>} 
        />
        <Route 
          path="/flights/airlines/:airlineName/reviews" 
          element={<SharedLayout><AirlineReviews /></SharedLayout>} 
        />
        <Route 
          path="/stays" 
          element={<SharedLayout><Stays /></SharedLayout>} 
        />
        <Route 
          path="/stays/search" 
          element={<SharedLayout><StaysSearch /></SharedLayout>} 
        />
        <Route 
          path="/stays/hotel/:id" 
          element={<SharedLayout><HotelDetail /></SharedLayout>} 
        />
        
        {/* Protected routes - Login required */}
        <Route 
          path="/flights/booking/confirm" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><FlightBookingConfirmation /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stays/booking/confirm" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><BookingConfirmation /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/trips" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><MyTrips /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-trips" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><MyTrips /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><UserProfile /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reviews" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><UserReviews /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/favorites" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><Favorites /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cars" 
          element={<SharedLayout><Cars /></SharedLayout>} 
        />
        <Route 
          path="/cars/search" 
          element={<SharedLayout><CarResults /></SharedLayout>} 
        />
        <Route 
          path="/cars/:id" 
          element={<SharedLayout><CarDetail /></SharedLayout>} 
        />
        <Route 
          path="/cars/booking/confirm" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><CarBookingConfirmation /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/booking/car/success" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><CarBookingSuccess /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/packages" 
          element={<SharedLayout><Packages /></SharedLayout>} 
        />
        <Route 
          path="/ai-mode" 
          element={<SharedLayout><AIMode /></SharedLayout>} 
        />
        <Route 
          path="/listings" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><Listings /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Billing routes - Protected (travellers and owners) */}
        <Route 
          path="/billing" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><BillingList /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/billing/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><BillingDashboard /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/billing/new" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><CreateBilling /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/billing/:id" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><BillingDetail /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/billing/:id/invoice" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><InvoiceViewerPage /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/invoice/:id" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><InvoiceViewerPage /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Owner routes removed - now on owner-portal (port 5180) */}
        {/* Owners are redirected to http://localhost:5180 after login */}
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
