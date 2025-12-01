/**
 * Main App Component
 * User-facing web application
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SharedLayout from './components/SharedLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import FlightResults from './pages/FlightResults';
import FareSelectionPage from './pages/FareSelectionPage';
import Stays from './pages/Stays';
import StaysSearch from './pages/StaysSearch';
import HotelDetail from './pages/HotelDetail';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingSuccess from './pages/BookingSuccess';
import MyTrips from './pages/MyTrips';
import Cars from './pages/Cars';
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
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerCars from './pages/OwnerCars';
import CarForm from './pages/CarForm';

function App() {
  return (
    <Router>
      <Routes>
        {/* Pages without layout (Login/Signup) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Traveller routes - Protected (travellers and owners can access) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><Home /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/flights/results" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><FlightResults /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fare-selection" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><FareSelectionPage /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stays" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><Stays /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stays/search" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><StaysSearch /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stays/hotel/:id" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><HotelDetail /></SharedLayout>
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
          path="/booking/success" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><BookingSuccess /></SharedLayout>
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
          path="/booking/:id" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><BookingSuccess /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cars" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><Cars /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/packages" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><Packages /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai-mode" 
          element={
            <ProtectedRoute allowedRoles={['traveller', 'owner']}>
              <SharedLayout><AIMode /></SharedLayout>
            </ProtectedRoute>
          } 
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
        
        {/* Owner routes - Protected */}
        <Route 
          path="/owner/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <SharedLayout><OwnerDashboard /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/owner/cars" 
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <SharedLayout><OwnerCars /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/owner/cars/new" 
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <SharedLayout><CarForm /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/owner/cars/edit/:id" 
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <SharedLayout><CarForm /></SharedLayout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
