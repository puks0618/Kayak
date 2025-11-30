import React, { useState, useEffect } from 'react';
import UsersTable from '../components/users/UsersTable';
import UsersFilter from '../components/users/UsersFilter';
import UserDetailsModal from '../components/users/UserDetailsModal';
import UserFormModal from '../components/users/UserFormModal';
import { usersApi } from '../services/usersApi';
import './UsersManagement.css';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.getUsers(filters);
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to load users. Please try again.');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowFormModal(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        await usersApi.updateUser(editingUser.id, userData);
      }
      setShowFormModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert('Failed to save user. Please try again.');
      console.error('Save user error:', err);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.deleted_at ? 'active' : 'inactive';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} ${user.first_name} ${user.last_name}?`)) {
      try {
        await usersApi.updateUserStatus(user.id, newStatus);
        fetchUsers();
      } catch (err) {
        alert(`Failed to ${action} user. Please try again.`);
        console.error('Toggle status error:', err);
      }
    }
  };

  const handleDelete = async (user) => {
    if (confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}? This action cannot be undone.`)) {
      try {
        await usersApi.deleteUser(user.id);
        fetchUsers();
      } catch (err) {
        alert('Failed to delete user. Please try again.');
        console.error('Delete user error:', err);
      }
    }
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="users-management">
      <div className="page-header">
        <h1>Users Management</h1>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{pagination.total || 0}</span>
          </div>
        </div>
      </div>

      <UsersFilter filters={filters} onFilterChange={setFilters} />

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={fetchUsers}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading users...</div>
      ) : (
        <>
          <UsersTable
            users={users}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
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
                  ({users.length} of {pagination.total} users)
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
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showFormModal && (
        <UserFormModal
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => {
            setShowFormModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UsersManagement;
