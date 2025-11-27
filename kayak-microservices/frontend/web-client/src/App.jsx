/**
 * Main App Component
 * User-facing web application
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FlightResults from './pages/FlightResults';
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
        <Route path="/" element={<Home />} />
        <Route path="/flights/results" element={<FlightResults />} />
        <Route path="/stays" element={<Stays />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/ai-mode" element={<AIMode />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;
