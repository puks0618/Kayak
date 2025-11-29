import React from 'react';
import './ListingDetailsModal.css';

const ListingDetailsModal = ({ listing, onClose }) => {
  if (!listing) return null;

  const isActive = !listing.deleted_at;
  const { listing_type } = listing;

  const renderFlightDetails = () => (
    <>
      <div className="detail-row">
        <span className="detail-label">Flight Code:</span>
        <span className="detail-value">{listing.flight_code}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Airline:</span>
        <span className="detail-value">{listing.airline}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Departure Airport:</span>
        <span className="detail-value">{listing.departure_airport}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Arrival Airport:</span>
        <span className="detail-value">{listing.arrival_airport}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Departure Time:</span>
        <span className="detail-value">{new Date(listing.departure_time).toLocaleString()}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Arrival Time:</span>
        <span className="detail-value">{new Date(listing.arrival_time).toLocaleString()}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Duration:</span>
        <span className="detail-value">{listing.duration} minutes</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Class:</span>
        <span className="detail-value">{listing.class}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Price:</span>
        <span className="detail-value">${parseFloat(listing.price).toFixed(2)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Total Seats:</span>
        <span className="detail-value">{listing.total_seats}</span>
      </div>
    </>
  );

  const renderHotelDetails = () => (
    <>
      <div className="detail-row full-width">
        <span className="detail-label">Name:</span>
        <span className="detail-value">{listing.name}</span>
      </div>
      <div className="detail-row full-width">
        <span className="detail-label">Address:</span>
        <span className="detail-value">
          {listing.address}<br />
          {listing.city}, {listing.state} {listing.zip_code}
        </span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Star Rating:</span>
        <span className="detail-value">{'⭐'.repeat(listing.star_rating)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Price per Night:</span>
        <span className="detail-value">${parseFloat(listing.price_per_night).toFixed(2)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Number of Rooms:</span>
        <span className="detail-value">{listing.num_rooms}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Room Type:</span>
        <span className="detail-value">{listing.room_type}</span>
      </div>
      {listing.amenities && (
        <div className="detail-row full-width">
          <span className="detail-label">Amenities:</span>
          <span className="detail-value">
            {typeof listing.amenities === 'string' 
              ? listing.amenities 
              : JSON.parse(listing.amenities).join(', ')}
          </span>
        </div>
      )}
    </>
  );

  const renderCarDetails = () => (
    <>
      <div className="detail-row">
        <span className="detail-label">Company:</span>
        <span className="detail-value">{listing.company_name}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Brand:</span>
        <span className="detail-value">{listing.brand}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Model:</span>
        <span className="detail-value">{listing.model}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Year:</span>
        <span className="detail-value">{listing.year}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Type:</span>
        <span className="detail-value">{listing.type}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Transmission:</span>
        <span className="detail-value">{listing.transmission}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Seats:</span>
        <span className="detail-value">{listing.seats}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Daily Rental Price:</span>
        <span className="detail-value">${parseFloat(listing.daily_rental_price).toFixed(2)}</span>
      </div>
      <div className="detail-row full-width">
        <span className="detail-label">Location:</span>
        <span className="detail-value">{listing.location}</span>
      </div>
    </>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Listing Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="listing-details-grid">
            <div className="detail-row">
              <span className="detail-label">Type:</span>
              <span className={`type-badge ${listing_type}`}>
                {listing_type.toUpperCase()}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {listing_type === 'flight' && renderFlightDetails()}
            {listing_type === 'hotel' && renderHotelDetails()}
            {listing_type === 'car' && renderCarDetails()}

            <div className="detail-row">
              <span className="detail-label">Listing ID:</span>
              <span className="detail-value mono">{listing.id}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">
                {new Date(listing.created_at).toLocaleString()}
              </span>
            </div>

            {listing.updated_at && (
              <div className="detail-row">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">
                  {new Date(listing.updated_at).toLocaleString()}
                </span>
              </div>
            )}

            {listing.deleted_at && (
              <div className="detail-row">
                <span className="detail-label">Deactivated:</span>
                <span className="detail-value">
                  {new Date(listing.deleted_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailsModal;
