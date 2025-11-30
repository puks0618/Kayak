/**
 * Booking Controller
 */

const BookingModel = require('../models/booking.model');
const BillingModel = require('../models/billing.model');

class BookingController {
  async create(req, res) {
    try {
      const { user_id, listing_id, listing_type, travel_date, total_amount, payment_details } = req.body;

      // 1. Create Booking (Pending)
      const booking = await BookingModel.create({
        user_id, listing_id, listing_type,
        travel_date, total_amount, status: 'pending'
      });

      // 2. Create Billing Record (Pending)
      const tax = total_amount * 0.1; // 10% tax
      const total = parseFloat(total_amount) + tax;

      const billing = await BillingModel.create({
        booking_id: booking.id,
        user_id,
        amount: total_amount,
        tax,
        total,
        payment_method: payment_details.method,
        status: 'pending',
        invoice_details: { listing_id, listing_type, travel_date }
      });

      // TODO: Trigger Saga/Workflow for Payment Processing
      // For MVP, we'll simulate payment success here if not using external service

      res.status(201).json({
        message: 'Booking initiated',
        booking_id: booking.id,
        billing_id: billing.id,
        status: 'pending'
      });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const booking = await BookingModel.findById(id);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json(booking);
    } catch (error) {
      console.error('Get booking error:', error);
      res.status(500).json({ error: 'Failed to get booking' });
    }
  }

  async getUserBookings(req, res) {
    try {
      const { userId } = req.params;
      const bookings = await BookingModel.findByUserId(userId);
      res.json(bookings);
    } catch (error) {
      console.error('Get user bookings error:', error);
      res.status(500).json({ error: 'Failed to get user bookings' });
    }
  }

  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        user_id,
        listing_type,
        sortBy = 'booking_date',
        sortOrder = 'desc'
      } = req.query;

      const bookings = await BookingModel.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        user_id,
        listing_type,
        sortBy,
        sortOrder
      });

      res.json(bookings);
    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({ error: 'Failed to get bookings' });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const booking = await BookingModel.findById(id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      await BookingModel.updateStatus(id, status);
      const updatedBooking = await BookingModel.findById(id);

      res.json(updatedBooking);
    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({ error: 'Failed to update booking status' });
    }
  }

  async cancel(req, res) {
    try {
      const { id } = req.params;
      const booking = await BookingModel.findById(id);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check if cancellable (e.g., not already completed/cancelled)
      if (booking.status === 'cancelled') {
        return res.status(400).json({ error: 'Booking already cancelled' });
      }

      await BookingModel.updateStatus(id, 'cancelled');

      // TODO: Trigger Refund Saga

      res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ error: 'Failed to cancel booking' });
    }
  }
}

module.exports = new BookingController();

