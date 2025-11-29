/**
 * Admin Portal App Component
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </div>
    </Router>
  );
}

// TODO: Implement actual admin components
const Dashboard = () => <div>Admin Dashboard - Overview with charts</div>;
const Users = () => <div>User Management</div>;
const Listings = () => <div>Listing Management</div>;
const Bookings = () => <div>Booking Management</div>;
const Analytics = () => <div>Analytics & Reports (Recharts)</div>;

export default App;

