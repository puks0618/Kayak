/**
 * Main App Component
 * User-facing web application
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <Routes>
        {/* Pages without layout (Login/Signup) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Pages with shared layout */}
        <Route path="/" element={<SharedLayout><Home /></SharedLayout>} />
        <Route path="/flights/results" element={<SharedLayout><FlightResults /></SharedLayout>} />
        <Route path="/fare-selection" element={<SharedLayout><FareSelectionPage /></SharedLayout>} />
        <Route path="/stays" element={<SharedLayout><Stays /></SharedLayout>} />
        <Route path="/cars" element={<SharedLayout><Cars /></SharedLayout>} />
        <Route path="/packages" element={<SharedLayout><Packages /></SharedLayout>} />
        <Route path="/ai-mode" element={<SharedLayout><AIMode /></SharedLayout>} />
        <Route path="/listings" element={<SharedLayout><Listings /></SharedLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
