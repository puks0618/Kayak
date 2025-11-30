/**
 * Main App Component
 * User-facing web application
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SharedLayout from './components/SharedLayout';
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
        
        {/* Pages with shared layout */}
        <Route path="/" element={<SharedLayout><Home /></SharedLayout>} />
        <Route path="/flights/results" element={<SharedLayout><FlightResults /></SharedLayout>} />
        <Route path="/flights/fare-selection" element={<SharedLayout><FareSelectionPage /></SharedLayout>} />
        <Route path="/stays" element={<SharedLayout><Stays /></SharedLayout>} />
        <Route path="/cars" element={<SharedLayout><Cars /></SharedLayout>} />
        <Route path="/packages" element={<SharedLayout><Packages /></SharedLayout>} />
        <Route path="/ai-mode" element={<SharedLayout><AIMode /></SharedLayout>} />
        <Route path="/listings" element={<SharedLayout><Listings /></SharedLayout>} />
        
        {/* Billing routes */}
        <Route path="/billing" element={<SharedLayout><BillingList /></SharedLayout>} />
        <Route path="/billing/dashboard" element={<SharedLayout><BillingDashboard /></SharedLayout>} />
        <Route path="/billing/new" element={<SharedLayout><CreateBilling /></SharedLayout>} />
        <Route path="/billing/:id" element={<SharedLayout><BillingDetail /></SharedLayout>} />
        <Route path="/billing/:id/invoice" element={<SharedLayout><InvoiceViewerPage /></SharedLayout>} />
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
