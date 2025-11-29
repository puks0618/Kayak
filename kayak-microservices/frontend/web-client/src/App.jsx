/**
 * Main App Component
 * User-facing web application
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

// TODO: Implement actual components
const Home = () => <div>Home Page - Search flights, hotels, cars</div>;
const Search = () => <div>Search Results</div>;
const Bookings = () => <div>My Bookings</div>;
const Profile = () => <div>User Profile</div>;

export default App;

