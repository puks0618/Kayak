/**
 * Billing Management Page
 * Search and view bills with detailed filters
 */

import React, { useState, useEffect } from 'react';
import { billingApi } from '../services/billingApi';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import './BillingManagement.css';

const BillingManagement = () => {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    date: '',
    startDate: '',
    endDate: '',
    month: '',
    year: new Date().getFullYear(),
    userId: '',
    status: '',
    minAmount: '',
    maxAmount: ''
  });

  useEffect(() => {
    searchBills();
  }, [pagination.page]);

  const searchBills = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };

      // Remove empty filters
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] === '' || searchParams[key] === null) {
          delete searchParams[key];
        }
      });

      const data = await billingApi.searchBills(searchParams);
      setBills(data.bills || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error('Search bills error:', err);
      setError('Failed to search bills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const viewBillDetails = async (billId) => {
    try {
      setLoading(true);
      const data = await billingApi.getBillById(billId);
      setSelectedBill(data.bill);
    } catch (err) {
      console.error('Get bill error:', err);
      setError('Failed to load bill details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    searchBills();
  };

  const clearFilters = () => {
    setFilters({
      date: '',
      startDate: '',
      endDate: '',
      month: '',
      year: new Date().getFullYear(),
      userId: '',
      status: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  return (
    <div className="billing-management">
      <div className="page-header">
        <h1>Billing Management</h1>
        <p>Search and manage billing records</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      {/* Search Filters */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="filter-grid">
            <div className="form-group">
              <label>Specific Date</label>
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
              />
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="form-group">
              <label>Month</label>
              <select name="month" value={filters.month} onChange={handleFilterChange}>
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Year</label>
              <select name="year" value={filters.year} onChange={handleFilterChange}>
                {[2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Min Amount</label>
              <input
                type="number"
                name="minAmount"
                value={filters.minAmount}
                onChange={handleFilterChange}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Max Amount</label>
              <input
                type="number"
                name="maxAmount"
                value={filters.maxAmount}
                onChange={handleFilterChange}
                placeholder="10000"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Search Bills
            </button>
            <button type="button" onClick={clearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          </div>
        </form>
      </div>

      {/* Bills Table */}
      <div className="table-section">
        <h2>Search Results ({pagination.total} bills found)</h2>
        
        {loading ? (
          <LoadingSpinner />
        ) : bills.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill ID</th>
                  <th>Booking ID</th>
                  <th>User ID</th>
                  <th>Amount</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => (
                  <tr key={bill.id}>
                    <td>{bill.id.substring(0, 8)}...</td>
                    <td>{bill.booking_id?.substring(0, 8)}...</td>
                    <td>{bill.user_id?.substring(0, 8)}...</td>
                    <td>${Number(bill.amount || 0).toFixed(2)}</td>
                    <td>${Number(bill.tax || 0).toFixed(2)}</td>
                    <td>${Number(bill.total || 0).toFixed(2)}</td>
                    <td>{bill.payment_method}</td>
                    <td>
                      <span className={`status-badge status-${bill.status}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td>{new Date(bill.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => viewBillDetails(bill.id)}
                        className="btn btn-sm btn-info"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p className="no-data">No bills found. Try adjusting your filters.</p>
        )}
      </div>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="modal-overlay" onClick={() => setSelectedBill(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bill Details</h2>
              <button onClick={() => setSelectedBill(null)} className="close-btn">✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <strong>Bill ID:</strong>
                  <span>{selectedBill.id}</span>
                </div>
                <div className="detail-item">
                  <strong>Booking ID:</strong>
                  <span>{selectedBill.booking_id}</span>
                </div>
                <div className="detail-item">
                  <strong>User ID:</strong>
                  <span>{selectedBill.user_id}</span>
                </div>
                <div className="detail-item">
                  <strong>Amount:</strong>
                  <span>${Number(selectedBill.amount || 0).toFixed(2)}</span>
                </div>
                <div className="detail-item">
                  <strong>Tax:</strong>
                  <span>${Number(selectedBill.tax || 0).toFixed(2)}</span>
                </div>
                <div className="detail-item">
                  <strong>Total:</strong>
                  <span>${Number(selectedBill.total || 0).toFixed(2)}</span>
                </div>
                <div className="detail-item">
                  <strong>Payment Method:</strong>
                  <span>{selectedBill.payment_method}</span>
                </div>
                <div className="detail-item">
                  <strong>Status:</strong>
                  <span className={`status-badge status-${selectedBill.status}`}>
                    {selectedBill.status}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Created At:</strong>
                  <span>{new Date(selectedBill.created_at).toLocaleString()}</span>
                </div>
                {selectedBill.listing_type && (
                  <div className="detail-item">
                    <strong>Listing Type:</strong>
                    <span>{selectedBill.listing_type}</span>
                  </div>
                )}
              </div>
              {selectedBill.invoice_details && (
                <div className="invoice-details">
                  <h3>Invoice Details</h3>
                  <pre>{JSON.stringify(selectedBill.invoice_details, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingManagement;
