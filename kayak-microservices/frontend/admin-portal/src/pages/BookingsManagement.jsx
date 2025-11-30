/**
 * Bookings Management Page
 */

import React, { useState, useEffect } from 'react';
import Button from '../components/shared/Button';
import BookingsTable from '../components/bookings/BookingsTable';
import BookingsFilter from '../components/bookings/BookingsFilter';
import BookingDetailsModal from '../components/bookings/BookingDetailsModal';
import { 
  getBookings, 
  updateBookingStatus,
  cancelBooking 
} from '../services/bookingsApi';
import './BookingsManagement.css';

const BookingsManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    listing_type: '',
    user_id: '',
    date_from: '',
    date_to: ''
  });

  // Modal states
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async (filterParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBookings({
        ...filterParams,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setBookings(data.bookings || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateStatus = async (booking, newStatus) => {
    try {
      await updateBookingStatus(booking.id, newStatus);
      
      // Refresh bookings list
      await fetchBookings(filters);
      
      // Show success message
      alert(`Booking ${booking.id} status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating booking status:', err);
      alert('Failed to update booking status. Please try again.');
    }
  };

  const handleCancelBooking = async (booking) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel booking ${booking.id}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await cancelBooking(booking.id);
      
      // Refresh bookings list
      await fetchBookings(filters);
      
      // Show success message
      alert(`Booking ${booking.id} has been cancelled`);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    const filterParams = {};
    if (filters.status) filterParams.status = filters.status;
    if (filters.listing_type) filterParams.listing_type = filters.listing_type;
    if (filters.user_id) filterParams.user_id = filters.user_id;
    if (filters.date_from) filterParams.date_from = filters.date_from;
    if (filters.date_to) filterParams.date_to = filters.date_to;
    
    fetchBookings(filterParams);
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      listing_type: '',
      user_id: '',
      date_from: '',
      date_to: ''
    });
    fetchBookings();
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
    fetchBookings({ ...filters, page: newPage });
  };

  if (error && bookings.length === 0) {
    return (
      <div className="bookings-management">
        <div className="page-header">
          <div>
            <h1>Bookings Management</h1>
            <p className="page-subtitle">Manage and track customer bookings</p>
          </div>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <Button onClick={() => fetchBookings()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-management">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Bookings Management</h1>
          <p className="page-subtitle">Manage and track customer bookings</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-label">Total Bookings</span>
            <span className="stat-value">{pagination.total}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <BookingsFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleResetFilters}
      />

      {/* Bookings Table */}
      <BookingsTable
        bookings={bookings}
        onView={handleViewBooking}
        onUpdateStatus={handleUpdateStatus}
        onCancel={handleCancelBooking}
        loading={loading}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <Button
            variant="secondary"
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            ← Previous
          </Button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next →
          </Button>
        </div>
      )}

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onUpdateStatus={handleUpdateStatus}
        onCancel={handleCancelBooking}
      />
    </div>
  );
};

export default BookingsManagement;
