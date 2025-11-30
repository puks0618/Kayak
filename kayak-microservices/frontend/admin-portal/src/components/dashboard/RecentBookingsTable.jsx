/**
 * Recent Bookings Table Component
 * Display last 5 bookings
 */

import React from 'react';
import Badge from '../shared/Badge';
import './RecentBookingsTable.css';

const RecentBookingsTable = ({ bookings = [], loading = false }) => {
  if (loading) {
    return (
      <div className="recent-bookings">
        <h2 className="section-title">Recent Bookings</h2>
        <div className="table-skeleton">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-row"></div>
          ))}
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="recent-bookings">
        <h2 className="section-title">Recent Bookings</h2>
        <div className="empty-state">
          <p>No bookings found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-bookings">
      <h2 className="section-title">Recent Bookings</h2>
      <div className="table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>REFERENCE</th>
              <th>TYPE</th>
              <th>AMOUNT</th>
              <th>STATUS</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>#{booking.id.slice(-6)}</td>
                <td className="booking-reference">{formatReference(booking)}</td>
                <td>
                  <span className="booking-type">{formatType(booking.listing_type)}</span>
                </td>
                <td className="booking-amount">{formatAmount(booking.total_amount)}</td>
                <td>
                  <Badge variant={getStatusVariant(booking.status)}>
                    {booking.status}
                  </Badge>
                </td>
                <td className="booking-date">{formatDate(booking.booking_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper functions
const formatReference = (booking) => {
  // Create a reference from listing type and booking ID
  const prefix = booking.listing_type === 'flight' ? 'FL' : 
                 booking.listing_type === 'hotel' ? 'HLD' : 'CAR';
  return `${prefix}-${booking.id.slice(0, 13)}`;
};

const formatType = (type) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'Invalid Date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    return 'Invalid Date';
  }
};

const getStatusVariant = (status) => {
  const statusLower = status?.toLowerCase() || '';
  switch (statusLower) {
    case 'confirmed':
      return 'confirmed';
    case 'pending':
      return 'pending';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'default';
  }
};

export default RecentBookingsTable;
