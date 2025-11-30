import React, { useState, useEffect } from 'react';
import ListingsTable from '../components/listings/ListingsTable';
import ListingsFilter from '../components/listings/ListingsFilter';
import ListingDetailsModal from '../components/listings/ListingDetailsModal';
import { listingsApi } from '../services/listingsApi';
import './ListingsManagement.css';

const ListingsManagement = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: 'all',
    status: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({});
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listingsApi.getListings(filters);
      setListings(response.listings);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to load listings. Please try again.');
      console.error('Fetch listings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (listing) => {
    setSelectedListing(listing);
    setShowDetailsModal(true);
  };

  const handleToggleStatus = async (listing) => {
    const newStatus = listing.deleted_at ? 'active' : 'inactive';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} this ${listing.listing_type}?`)) {
      try {
        await listingsApi.updateListingStatus(listing.listing_type, listing.id, newStatus);
        fetchListings();
      } catch (err) {
        alert(`Failed to ${action} listing. Please try again.`);
        console.error('Toggle status error:', err);
      }
    }
  };

  const handleDelete = async (listing) => {
    if (confirm(`Are you sure you want to delete this ${listing.listing_type}? This action cannot be undone.`)) {
      try {
        await listingsApi.deleteListing(listing.listing_type, listing.id);
        fetchListings();
      } catch (err) {
        alert('Failed to delete listing. Please try again.');
        console.error('Delete listing error:', err);
      }
    }
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getTypeStats = () => {
    const stats = { flight: 0, hotel: 0, car: 0 };
    listings.forEach(listing => {
      if (stats[listing.listing_type] !== undefined) {
        stats[listing.listing_type]++;
      }
    });
    return stats;
  };

  const typeStats = getTypeStats();

  return (
    <div className="listings-management">
      <div className="page-header">
        <h1>Listings Management</h1>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-label">Total Listings</span>
            <span className="stat-value">{pagination.total || 0}</span>
          </div>
          {filters.type === 'all' && (
            <>
              <div className="stat-card flight">
                <span className="stat-label">Flights</span>
                <span className="stat-value">{typeStats.flight}</span>
              </div>
              <div className="stat-card hotel">
                <span className="stat-label">Hotels</span>
                <span className="stat-value">{typeStats.hotel}</span>
              </div>
              <div className="stat-card car">
                <span className="stat-label">Cars</span>
                <span className="stat-value">{typeStats.car}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <ListingsFilter filters={filters} onFilterChange={setFilters} />

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={fetchListings}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading listings...</div>
      ) : (
        <>
          <ListingsTable
            listings={listings}
            onViewDetails={handleViewDetails}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="pagination-btn"
              >
                Previous
              </button>

              <div className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}
                <span className="pagination-detail">
                  ({listings.length} of {pagination.total} listings)
                </span>
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showDetailsModal && (
        <ListingDetailsModal
          listing={selectedListing}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedListing(null);
          }}
        />
      )}
    </div>
  );
};

export default ListingsManagement;
