import React from 'react';
import './UserDetailsModal.css';

const UserDetailsModal = ({ user, onClose }) => {
  if (!user) return null;

  const isActive = !user.deleted_at;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="user-details-grid">
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{user.first_name} {user.last_name}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{user.email}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{user.phone}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">SSN:</span>
              <span className="detail-value">{user.ssn}</span>
            </div>

            <div className="detail-row full-width">
              <span className="detail-label">Address:</span>
              <span className="detail-value">
                {user.address}<br />
                {user.city}, {user.state} {user.zip_code}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">User ID:</span>
              <span className="detail-value mono">{user.id}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Joined:</span>
              <span className="detail-value">
                {new Date(user.created_at).toLocaleString()}
              </span>
            </div>

            {user.updated_at && (
              <div className="detail-row">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">
                  {new Date(user.updated_at).toLocaleString()}
                </span>
              </div>
            )}

            {user.deleted_at && (
              <div className="detail-row">
                <span className="detail-label">Deactivated:</span>
                <span className="detail-value">
                  {new Date(user.deleted_at).toLocaleString()}
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

export default UserDetailsModal;
