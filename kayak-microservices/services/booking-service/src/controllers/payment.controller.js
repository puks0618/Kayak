/**
 * Payment Controller
 */

const PaymentSaga = require('../sagas/paymentSaga');

/**
 * Payment Controller
 */

const BillingModel = require('../models/billing.model');
const BookingModel = require('../models/booking.model');

class PaymentController {
  async processPayment(req, res) {
    try {
      const { bookingId, paymentDetails } = req.body;

      // 1. Get Billing Record
      const billing = await BillingModel.findByBookingId(bookingId);
      if (!billing) {
        return res.status(404).json({ error: 'Billing record not found' });
      }

      // 2. Simulate Payment Gateway Call
      const success = true; // Mock success
      const transactionId = 'tx_' + Math.random().toString(36).substr(2, 9);

      if (success) {
        // 3. Update Billing Status
        await BillingModel.updateStatus(billing.id, 'paid');

        // 4. Update Booking Status
        await BookingModel.updateStatus(bookingId, 'confirmed', billing.id);

        res.json({
          message: 'Payment successful',
          transactionId,
          status: 'confirmed'
        });
      } else {
        await BillingModel.updateStatus(billing.id, 'failed');
        res.status(400).json({ error: 'Payment failed' });
      }
    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({ error: 'Payment processing failed', details: error.message });
    }
  }

  async getBill(req, res) {
    try {
      const { id } = req.params;
      const bill = await BillingModel.findById(id);

      if (!bill) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      res.json(bill);
    } catch (error) {
      console.error('Get bill error:', error);
      res.status(500).json({ error: 'Failed to get bill' });
    }
  }
}

module.exports = new PaymentController();
