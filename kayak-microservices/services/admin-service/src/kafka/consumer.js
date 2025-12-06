/**
 * Kafka Consumer for Admin Service
 * Consumes flight booking events from Kafka
 */

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'admin-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: {
    retries: 5,
    initialRetryTime: 300,
  }
});

const consumer = kafka.consumer({ 
  groupId: 'admin-flight-bookings-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000
});

let isConnected = false;
const flightBookings = []; // In-memory store (replace with database in production)

/**
 * Connect and subscribe to flight-bookings topic
 */
const connect = async () => {
  if (!isConnected) {
    try {
      await consumer.connect();
      await consumer.subscribe({ 
        topic: 'flight-bookings', 
        fromBeginning: false 
      });
      isConnected = true;
      console.log('✅ Admin Kafka Consumer connected to flight-bookings topic');
    } catch (error) {
      console.error('❌ Admin Kafka Consumer connection failed:', error.message);
      throw error;
    }
  }
};

/**
 * Start consuming flight booking messages
 */
const startConsuming = async () => {
  try {
    await connect();
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const bookingData = JSON.parse(message.value.toString());
          const eventType = message.headers['event-type']?.toString();
          
          console.log(`📨 Admin received flight booking event:`, {
            bookingId: bookingData.bookingId,
            eventType,
            timestamp: bookingData.timestamp
          });

          // Handle different event types
          switch (eventType) {
            case 'booking-created':
              handleNewFlightBooking(bookingData);
              break;
            case 'booking-status-updated':
              handleFlightBookingStatusUpdate(bookingData);
              break;
            default:
              console.log('Unknown event type:', eventType);
          }

        } catch (error) {
          console.error('❌ Error processing flight booking message:', error.message);
        }
      }
    });

    console.log('🎧 Admin service listening for flight bookings...');
  } catch (error) {
    console.error('❌ Failed to start consuming flight bookings:', error.message);
    throw error;
  }
};

/**
 * Handle new flight booking
 */
const handleNewFlightBooking = (bookingData) => {
  // Store booking for admin dashboard
  flightBookings.push({
    ...bookingData,
    receivedAt: new Date().toISOString()
  });

  console.log(`✅ Admin processed flight booking: ${bookingData.bookingId}`);
  console.log(`   - Route: ${bookingData.outboundFlight.origin} → ${bookingData.outboundFlight.destination}`);
  console.log(`   - Passengers: ${bookingData.passengers}`);
  console.log(`   - Total Price: $${bookingData.totalPrice}`);
  console.log(`   - Total flight bookings tracked: ${flightBookings.length}`);
  
  // Here you can:
  // - Store in database
  // - Send notifications
  // - Update analytics
  // - Generate reports
};

/**
 * Handle flight booking status update
 */
const handleFlightBookingStatusUpdate = (bookingData) => {
  const booking = flightBookings.find(b => b.bookingId === bookingData.bookingId);
  if (booking) {
    booking.status = bookingData.status;
    booking.updatedAt = bookingData.timestamp;
    console.log(`✅ Admin updated flight booking status: ${bookingData.bookingId} -> ${bookingData.status}`);
  }
};

/**
 * Get all tracked flight bookings
 */
const getFlightBookings = () => {
  return flightBookings;
};

/**
 * Get flight booking statistics
 */
const getFlightBookingStats = () => {
  return {
    total: flightBookings.length,
    byStatus: flightBookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {}),
    totalRevenue: flightBookings.reduce((sum, booking) => sum + parseFloat(booking.totalPrice), 0),
    lastBooking: flightBookings[flightBookings.length - 1]
  };
};

/**
 * Disconnect from Kafka
 */
const disconnect = async () => {
  if (isConnected) {
    await consumer.disconnect();
    isConnected = false;
    console.log('Admin Kafka Consumer disconnected');
  }
};

// Graceful shutdown
process.on('SIGINT', disconnect);
process.on('SIGTERM', disconnect);

module.exports = {
  connect,
  startConsuming,
  getFlightBookings,
  getFlightBookingStats,
  disconnect
};
