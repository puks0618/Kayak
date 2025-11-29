/**
 * Payment Controller
 */

const PaymentSaga = require('../sagas/paymentSaga');

class PaymentController {
  async process(req, res) {
    try {
      const paymentData = req.body;
      
      // Execute payment saga
      const saga = new PaymentSaga();
      const result = await saga.execute(paymentData);
      
      res.json({
        message: 'Payment processed successfully',
        payment: result.payment
      });
    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({ error: 'Payment failed' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      
      // TODO: Get payment details
      
      res.json({
        // payment
      });
    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json({ error: 'Failed to get payment' });
    }
  }

  async refund(req, res) {
    try {
      const { id } = req.params;
      
      // TODO: Process refund
      // TODO: Publish payment.refunded event
      
      res.json({
        message: 'Refund processed successfully'
      });
    } catch (error) {
      console.error('Refund error:', error);
      res.status(500).json({ error: 'Refund failed' });
    }
  }
}

module.exports = new PaymentController();

