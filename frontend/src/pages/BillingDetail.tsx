import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { billingApi, Bill } from '../services/api';

const BillingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRecord();
    }
  }, [id]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const response = await billingApi.getById(parseInt(id!));
      setRecord(response.data);
    } catch (error) {
      console.error('Error fetching billing record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this billing record?')) {
      return;
    }

    try {
      await billingApi.delete(id!);
      navigate('/billing');
    } catch (error) {
      console.error('Error deleting billing record:', error);
      alert('Failed to delete billing record');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kayak-orange"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Billing record not found</p>
        <Link to="/billing" className="text-kayak-orange hover:text-primary-600 font-medium">
          Back to Billing Records
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <Link to="/billing" className="text-sm text-kayak-orange hover:text-primary-600 mb-2 inline-block">
            ← Back to Billing Records
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Billing Record Details</h2>
          <p className="mt-2 text-sm text-gray-600">Invoice #{record.invoice_number}</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/billing/${record.billing_id}/invoice`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            View Invoice PDF
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Billing Information</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Billing ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{record.billing_id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Invoice Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{record.invoice_number}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{record.user_id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Booking Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{record.booking_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Booking ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{record.booking_id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
              <dd className="mt-1 text-sm text-gray-900">
                USD {typeof record.total_amount === 'number' ? record.total_amount.toFixed(2) : parseFloat(record.total_amount.toString()).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
              <dd className="mt-1 text-sm text-gray-900">{record.payment_method.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Transaction Status</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    record.transaction_status === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : record.transaction_status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : record.transaction_status === 'OVERDUE'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {record.transaction_status.toLowerCase()}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Transaction Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(record.transaction_date).toLocaleString()}
              </dd>
            </div>
            {record.invoice_details && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Invoice Details</dt>
                <dd className="mt-1 text-sm text-gray-900">{record.invoice_details}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default BillingDetail;
