/**
 * Kafka Consumer for Owner Service
 * Consumes hotel booking events from Kafka
 */

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'owner-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: {
    retries: 5,
    initialRetryTime: 300,
  }
});

const consumer = kafka.consumer({ 
  groupId: 'owner-hotel-bookings-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000
});

let isConnected = false;
const hotelBookings = []; // In-memory store (replace with database in production)

/**
 * Connect and subscribe to hotel-bookings topic
 */
const connect = async () => {
  if (!isConnected) {
    try {
      await consumer.connect();
      await consumer.subscribe({ 
        topic: 'hotel-bookings', 
        fromBeginning: false 
      });
      isConnected = true;
      console.log('✅ Owner Kafka Consumer connected to hotel-bookings topic');
    } catch (error) {
      console.error('❌ Owner Kafka Consumer connection failed:', error.message);
      throw error;
    }
  }
};

/**
 * Start consuming hotel booking messages
 */
const startConsuming = async () => {
  try {
    await connect();
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const bookingData = JSON.parse(message.value.toString());
          const eventType = message.headers['event-type']?.toString();
          const hotelId = message.headers['hotel-id']?.toString();
          
          console.log(`📨 Owner received hotel booking event:`, {
            bookingId: bookingData.bookingId,
            hotelId,
            eventType,
            timestamp: bookingData.timestamp
          });

          // Handle different event types
          switch (eventType) {
            case 'booking-created':
              handleNewHotelBooking(bookingData);
              break;
            case 'booking-status-updated':
              handleHotelBookingStatusUpdate(bookingData);
              break;
            default:
              console.log('Unknown event type:', eventType);
          }

        } catch (error) {
          console.error('❌ Error processing hotel booking message:', error.message);
        }
      }
    });

    console.log('🎧 Owner service listening for hotel bookings...');
  } catch (error) {
    console.error('❌ Failed to start consuming hotel bookings:', error.message);
    throw error;
  }
};

/**
 * Handle new hotel booking
 */
const handleNewHotelBooking = (bookingData) => {
  // Store booking for owner dashboard
  hotelBookings.push({
    ...bookingData,
    receivedAt: new Date().toISOString()
  });

  console.log(`✅ Owner processed hotel booking: ${bookingData.bookingId}`);
  console.log(`   - Hotel: ${bookingData.hotel.name}`);
  console.log(`   - Location: ${bookingData.hotel.city}`);
  console.log(`   - Check-in: ${bookingData.checkIn}`);
  console.log(`   - Check-out: ${bookingData.checkOut}`);
  console.log(`   - Guests: ${bookingData.guests}`);
  console.log(`   - Total Price: $${bookingData.totalPrice}`);
  console.log(`   - Total hotel bookings tracked: ${hotelBookings.length}`);
  
  // Here you can:
  // - Store in database
  // - Send notification to property owner
  // - Update room availability
  // - Generate booking confirmation
  // - Update revenue analytics
};

/**
 * Handle hotel booking status update
 */
const handleHotelBookingStatusUpdate = (bookingData) => {
  const booking = hotelBookings.find(b => b.bookingId === bookingData.bookingId);
  if (booking) {
    booking.status = bookingData.status;
    booking.updatedAt = bookingData.timestamp;
    console.log(`✅ Owner updated hotel booking status: ${bookingData.bookingId} -> ${bookingData.status}`);
  }
};

/**
 * Get all tracked hotel bookings
 */
const getHotelBookings = (hotelId = null) => {
  if (hotelId) {
    return hotelBookings.filter(b => String(b.hotel.id) === String(hotelId));
  }
  return hotelBookings;
};

/**
 * Get hotel booking statistics
 */
const getHotelBookingStats = (hotelId = null) => {
  const bookings = getHotelBookings(hotelId);
  
  return {
    total: bookings.length,
    byStatus: bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {}),
    totalRevenue: bookings.reduce((sum, booking) => sum + parseFloat(booking.totalPrice), 0),
    totalNights: bookings.reduce((sum, booking) => sum + booking.nights, 0),
    averageStayLength: bookings.length > 0 
      ? (bookings.reduce((sum, booking) => sum + booking.nights, 0) / bookings.length).toFixed(1)
      : 0,
    lastBooking: bookings[bookings.length - 1]
  };
};

/**
 * Get bookings by hotel
 */
const getBookingsByHotel = () => {
  return hotelBookings.reduce((acc, booking) => {
    const hotelId = booking.hotel.id;
    if (!acc[hotelId]) {
      acc[hotelId] = {
        hotelName: booking.hotel.name,
        hotelCity: booking.hotel.city,
        bookings: []
      };
    }
    acc[hotelId].bookings.push(booking);
    return acc;
  }, {});
};

/**
 * Disconnect from Kafka
 */
const disconnect = async () => {
  if (isConnected) {
    await consumer.disconnect();
    isConnected = false;
    console.log('Owner Kafka Consumer disconnected');
  }
};

// Graceful shutdown
process.on('SIGINT', disconnect);
process.on('SIGTERM', disconnect);

module.exports = {
  connect,
  startConsuming,
  getHotelBookings,
  getHotelBookingStats,
  getBookingsByHotel,
  disconnect
};
