/**
 * Admin Portal App Component
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import FlightsManagement from './pages/FlightsManagement';
import BookingsManagement from './pages/BookingsManagement';
import UsersManagement from './pages/UsersManagement';
import Analytics from './pages/Analytics';
import Signout from './pages/Signout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Signout route without Layout */}
        <Route path="/signout" element={<Signout />} />
        
        {/* All other routes with Layout */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/flights" element={<FlightsManagement />} />
              <Route path="/bookings" element={<BookingsManagement />} />
              <Route path="/users" element={<UsersManagement />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;

