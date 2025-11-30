/**
 * Delete Confirmation Modal Component
 */

import React from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, flight, loading = false }) => {
  if (!flight) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Flight"
      size="small"
    >
      <div className="delete-confirm">
        <p className="delete-message">
          Are you sure you want to delete this flight?
        </p>
        
        <div className="flight-details">
          <div className="detail-row">
            <span className="detail-label">Flight Code:</span>
            <span className="detail-value">{flight.flight_code}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Airline:</span>
            <span className="detail-value">{flight.airline}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Route:</span>
            <span className="detail-value">
              {flight.departure_airport} → {flight.arrival_airport}
            </span>
          </div>
        </div>

        <p className="delete-warning">
          This action cannot be undone.
        </p>

        <div className="delete-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            Delete Flight
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
