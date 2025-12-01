import React from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, car, loading }) => {
  if (!car) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Car">
      <div className="delete-confirm">
        <p>Are you sure you want to delete this car?</p>
        <div className="delete-details">
          <strong>{car.brand} {car.model} ({car.year})</strong>
          <p>{car.company_name} - {car.location}</p>
        </div>
        <p className="warning-text">This action cannot be undone.</p>
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Car'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
