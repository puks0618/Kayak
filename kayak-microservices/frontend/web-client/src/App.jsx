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
        
        {/* Traveller routes - Protected (only travellers can access) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute allowedRoles={['traveller']}>
              <SharedLayout><Home /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/flights/results" 
          element={
            <ProtectedRoute allowedRoles={['traveller']}>
              <SharedLayout><FlightResults /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fare-selection" 
          element={
            <ProtectedRoute allowedRoles={['traveller']}>
              <SharedLayout><FareSelectionPage /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stays" 
          element={
            <ProtectedRoute allowedRoles={['traveller']}>
              <SharedLayout><Stays /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cars" 
          element={
            <ProtectedRoute allowedRoles={['traveller']}>
              <SharedLayout><Cars /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/packages" 
          element={
            <ProtectedRoute allowedRoles={['traveller']}>
              <SharedLayout><Packages /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai-mode" 
          element={
            <ProtectedRoute allowedRoles={['traveller']}>
              <SharedLayout><AIMode /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/listings" 
          element={
            <ProtectedRoute allowedRoles={['traveller']}>
              <SharedLayout><Listings /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Billing routes - Protected (only travellers) */}
        <Route 
          path="/billing" 
          element={
            <ProtectedRoute allowedRoles={['traveller']}>
              <SharedLayout><BillingList /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/billing/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['traveller']}>
              <SharedLayout><BillingDashboard /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/billing/new" 
          element={
            <ProtectedRoute allowedRoles={['traveller']}>
              <SharedLayout><CreateBilling /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/billing/:id" 
          element={
            <ProtectedRoute allowedRoles={['traveller']}>
              <SharedLayout><BillingDetail /></SharedLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/billing/:id/invoice" 
          element={
            <ProtectedRoute allowedRoles={['traveller']}>
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
