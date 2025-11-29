/**
 * Booking Details Modal Component
 */

import React from 'react';
import Button from '../shared/Button';
import './BookingDetailsModal.css';

const BookingDetailsModal = ({ isOpen, onClose, booking, onUpdateStatus, onCancel }) => {
  if (!isOpen || !booking) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffa500',
      confirmed: '#4caf50',
      completed: '#2196f3',
      cancelled: '#f44336',
    };
    return colors[status] || '#666';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content booking-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 Booking Details</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3>Booking Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Booking ID:</label>
                <span className="detail-value">{booking.id}</span>
              </div>
              <div className="detail-item">
                <label>Status:</label>
                <span 
                  className={`status-badge status-${booking.status}`}
                  style={{ backgroundColor: getStatusColor(booking.status) }}
                >
                  {booking.status.toUpperCase()}
                </span>
              </div>
              <div className="detail-item">
                <label>Booking Date:</label>
                <span className="detail-value">{formatDateTime(booking.booking_date)}</span>
              </div>
              <div className="detail-item">
                <label>Travel Date:</label>
                <span className="detail-value">{formatDateTime(booking.travel_date)}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Customer Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>User ID:</label>
                <span className="detail-value">{booking.user_id}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Listing Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Listing ID:</label>
                <span className="detail-value">{booking.listing_id}</span>
              </div>
              <div className="detail-item">
                <label>Listing Type:</label>
                <span className={`listing-type type-${booking.listing_type}`}>
                  {booking.listing_type.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Payment Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Total Amount:</label>
                <span className="detail-value amount">{formatCurrency(booking.total_amount)}</span>
              </div>
              {booking.payment_id && (
                <div className="detail-item">
                  <label>Payment ID:</label>
                  <span className="detail-value">{booking.payment_id}</span>
                </div>
              )}
            </div>
          </div>

          {booking.notes && (
            <div className="detail-section">
              <h3>Notes</h3>
              <p className="detail-notes">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {booking.status === 'pending' && (
            <>
              <Button
                variant="success"
                onClick={() => {
                  onUpdateStatus(booking, 'confirmed');
                  onClose();
                }}
              >
                ✓ Confirm Booking
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  onCancel(booking);
                  onClose();
                }}
              >
                ✗ Cancel Booking
              </Button>
            </>
          )}
          {booking.status === 'confirmed' && (
            <Button
              variant="primary"
              onClick={() => {
                onUpdateStatus(booking, 'completed');
                onClose();
              }}
            >
              ✓ Mark as Completed
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;
