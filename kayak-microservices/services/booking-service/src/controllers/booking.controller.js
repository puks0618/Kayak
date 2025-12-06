/**
 * Booking Controller
 */

const BookingModel = require('../models/booking.model');
const BillingModel = require('../models/billing.model');
const kafkaProducer = require('../kafka/producer');

class BookingController {
  async create(req, res) {
    try {
      // Get user_id from authenticated user (forwarded by gateway) or request body
      const user_id = req.headers['x-user-id'] || req.body.user_id;
      
      if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const { listing_id, listing_type, travel_date, total_amount, payment_details, booking_details } = req.body;

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

      // 3. Publish booking event to Kafka
      try {
        if (listing_type === 'flight' && booking_details) {
          await kafkaProducer.publishFlightBooking({
            bookingId: booking.id,
            userId: user_id,
            status: 'confirmed',
            outboundFlight: booking_details.outboundFlight,
            returnFlight: booking_details.returnFlight,
            passengers: booking_details.passengers || 1,
            passengerInfo: booking_details.passengerInfo,
            totalPrice: total_amount,
            bookingDate: new Date().toISOString()
          });
          console.log(`✅ Flight booking published to Kafka: ${booking.id}`);
        } else if (listing_type === 'hotel' && booking_details) {
          await kafkaProducer.publishHotelBooking({
            bookingId: booking.id,
            userId: user_id,
            status: 'confirmed',
            hotel: booking_details.hotel,
            checkIn: booking_details.checkIn,
            checkOut: booking_details.checkOut,
            guests: booking_details.guests || 1,
            nights: booking_details.nights,
            guestInfo: booking_details.guestInfo,
            totalPrice: total_amount,
            bookingDate: new Date().toISOString()
          });
          console.log(`✅ Hotel booking published to Kafka: ${booking.id}`);
        } else if (listing_type === 'car' && booking_details) {
          await kafkaProducer.publishCarBooking({
            bookingId: booking.id,
            userId: user_id,
            status: 'confirmed',
            car: booking_details.car,
            pickupDate: booking_details.pickupDate,
            dropoffDate: booking_details.dropoffDate,
            pickupTime: booking_details.pickupTime,
            dropoffTime: booking_details.dropoffTime,
            pickupLocation: booking_details.pickupLocation,
            days: booking_details.days,
            driverInfo: booking_details.driverInfo,
            totalPrice: total_amount,
            bookingDate: new Date().toISOString()
          });
          console.log(`✅ Car booking published to Kafka: ${booking.id}`);
        }
      } catch (kafkaError) {
        console.error('⚠️ Failed to publish booking to Kafka:', kafkaError);
        // Don't fail the booking if Kafka fails
      }

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

