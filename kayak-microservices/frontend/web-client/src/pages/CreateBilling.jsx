import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingService } from '../services/api';

const CreateBilling = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    bookingType: 'FLIGHT',
    bookingId: '',
    totalAmount: '',
    paymentMethod: 'CREDIT_CARD',
    transactionStatus: 'PAID',
    invoiceDetails: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await billingService.create({
        userId: formData.userId,
        bookingType: formData.bookingType,
        bookingId: formData.bookingId,
        totalAmount: parseFloat(formData.totalAmount),
        paymentMethod: formData.paymentMethod,
        transactionStatus: formData.transactionStatus,
        invoiceDetails: formData.invoiceDetails || null,
      });

      if (response.success) {
        // Navigate to billing list with success message
        navigate('/billing', { 
          state: { 
            success: true, 
            message: `Billing record created successfully! Invoice number: ${response.data.invoice_number}` 
          } 
        });
      }
    } catch (error) {
      console.error('Error creating billing record:', error);
      alert(error.response?.data?.error?.message || 'Failed to create billing record');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create Billing Record</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Add a new billing record to the system</p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                User ID *
              </label>
              <input
                type="text"
                id="userId"
                name="userId"
                required
                value={formData.userId}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-[#FF690F] focus:border-[#FF690F] sm:text-sm px-3 py-2 border"
                placeholder="Enter user ID"
              />
            </div>

            <div>
              <label htmlFor="bookingType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Booking Type *
              </label>
              <select
                id="bookingType"
                name="bookingType"
                required
                value={formData.bookingType}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-[#FF690F] focus:border-[#FF690F] sm:text-sm rounded-md border"
              >
                <option value="FLIGHT">Flight</option>
                <option value="HOTEL">Hotel</option>
                <option value="CAR">Car</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="bookingId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Booking ID *
            </label>
            <input
              type="text"
              id="bookingId"
              name="bookingId"
              required
              value={formData.bookingId}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-[#FF690F] focus:border-[#FF690F] sm:text-sm px-3 py-2 border"
              placeholder="Enter booking ID"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Amount *
              </label>
              <input
                type="number"
                id="totalAmount"
                name="totalAmount"
                required
                step="0.01"
                min="0"
                value={formData.totalAmount}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-[#FF690F] focus:border-[#FF690F] sm:text-sm px-3 py-2 border"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment Method *
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                required
                value={formData.paymentMethod}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-[#FF690F] focus:border-[#FF690F] sm:text-sm rounded-md border"
              >
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="PAYPAL">PayPal</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="transactionStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              id="transactionStatus"
              name="transactionStatus"
              value={formData.transactionStatus}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-[#FF690F] focus:border-[#FF690F] sm:text-sm rounded-md border"
            >
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="invoiceDetails" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Invoice / Receipt Details
            </label>
            <textarea
              id="invoiceDetails"
              name="invoiceDetails"
              rows={4}
              value={formData.invoiceDetails}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-[#FF690F] focus:border-[#FF690F] sm:text-sm px-3 py-2 border"
              placeholder="Enter invoice or receipt details..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/billing')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF690F]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF690F] hover:bg-[#E55E0D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF690F] disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Billing Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBilling;
