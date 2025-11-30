import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { billingService } from '../services/api';

const BillingList = () => {
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    booking_type: '',
    booking_date: '',
  });

  useEffect(() => {
    // Check for success message from navigation state
    if (location.state?.success && location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the location state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
      // Refresh records to show the newly created record
      fetchRecords();
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    }
  }, [location.state]);

  useEffect(() => {
    // Fetch records when component mounts or filters change
    fetchRecords();
  }, [filters]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      // Map frontend filters to API filters
      const apiFilters = {};
      if (filters.status) {
        apiFilters.status = filters.status.toUpperCase();
      }
      if (filters.booking_type) {
        apiFilters.bookingType = filters.booking_type.toUpperCase();
      }
      if (filters.booking_date) {
        apiFilters.from = filters.booking_date;
        apiFilters.to = filters.booking_date;
      }
      
      const response = await billingService.getAll(apiFilters);
      
      // Transform Bill[] to BillingRecord[] for display
      const transformedRecords = response.data.map((bill) => ({
        id: bill.billing_id.toString(),
        customer_id: bill.user_id,
        customer_name: bill.user_id, // Using user_id as name since we don't have a name field
        invoice_number: bill.invoice_number,
        amount: parseFloat(bill.total_amount),
        currency: 'USD', // Default currency
        status: bill.transaction_status.toLowerCase(),
        due_date: bill.transaction_date, // Using transaction_date as due_date
        created_at: bill.transaction_date,
        updated_at: bill.transaction_date,
      }));
      
      setRecords(transformedRecords);
    } catch (error) {
      console.error('Error fetching billing records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this billing record?')) {
      return;
    }

    try {
      await billingService.delete(id);
      fetchRecords();
    } catch (error) {
      console.error('Error deleting billing record:', error);
      alert('Failed to delete billing record');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF690F]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Success Message Banner */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800 ml-4"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Billing Records</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Manage all your billing records</p>
        </div>
        <Link
          to="/billing/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF690F] hover:bg-[#E55E0D]"
        >
          Create New Record
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filters</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-[#FF690F] focus:border-[#FF690F] sm:text-sm rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label htmlFor="booking_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Booking Type
              </label>
              <select
                id="booking_type"
                value={filters.booking_type}
                onChange={(e) => setFilters({ ...filters, booking_type: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-[#FF690F] focus:border-[#FF690F] sm:text-sm rounded-md"
              >
                <option value="">All Types</option>
                <option value="flight">Flight</option>
                <option value="hotel">Hotel</option>
                <option value="car">Car</option>
              </select>
            </div>
            <div>
              <label htmlFor="booking_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Booking Date
              </label>
              <input
                type="date"
                id="booking_date"
                value={filters.booking_date}
                onChange={(e) => setFilters({ ...filters, booking_date: e.target.value })}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-[#FF690F] focus:border-[#FF690F] sm:text-sm px-3 py-2"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {records.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No billing records found</p>
            <Link
              to="/billing/new"
              className="text-[#FF690F] hover:text-[#E55E0D] font-medium"
            >
              Create your first billing record
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/billing/${record.id}`}
                        className="text-sm font-medium text-[#FF690F] hover:text-[#E55E0D]"
                      >
                        {record.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{record.customer_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{record.customer_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {record.currency} {record.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : record.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(record.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/billing/${record.id}`}
                        className="text-[#FF690F] hover:text-[#E55E0D] mr-4"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/billing/${record.id}/invoice`}
                        className="text-[#FF690F] hover:text-[#E55E0D]"
                      >
                        View Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingList;
