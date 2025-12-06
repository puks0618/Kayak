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
  groupId: 'owner-bookings-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000
});

let isConnected = false;
const hotelBookings = []; // In-memory store (replace with database in production)
const carBookings = []; // In-memory store for car bookings

/**
 * Connect and subscribe to booking topics
 */
const connect = async () => {
  if (!isConnected) {
    try {
      await consumer.connect();
      await consumer.subscribe({ 
        topics: ['hotel-bookings', 'car-bookings'], 
        fromBeginning: false 
      });
      isConnected = true;
      console.log('✅ Owner Kafka Consumer connected to hotel-bookings and car-bookings topics');
    } catch (error) {
      console.error('❌ Owner Kafka Consumer connection failed:', error.message);
      throw error;
    }
  }
};

/**
 * Start consuming booking messages
 */
const startConsuming = async () => {
  try {
    await connect();
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const bookingData = JSON.parse(message.value.toString());
          const eventType = message.headers['event-type']?.toString();
          const resourceId = message.headers['hotel-id']?.toString() || message.headers['car-id']?.toString();
          
          console.log(`📨 Owner received ${topic} event:`, {
            bookingId: bookingData.bookingId,
            resourceId,
            eventType,
            timestamp: bookingData.timestamp
          });

          // Route to appropriate handler based on topic
          if (topic === 'hotel-bookings') {
            switch (eventType) {
              case 'booking-created':
                handleNewHotelBooking(bookingData);
                break;
              case 'booking-status-updated':
                handleHotelBookingStatusUpdate(bookingData);
                break;
              default:
                console.log('Unknown hotel event type:', eventType);
            }
          } else if (topic === 'car-bookings') {
            switch (eventType) {
              case 'booking-created':
                handleNewCarBooking(bookingData);
                break;
              case 'booking-status-updated':
                handleCarBookingStatusUpdate(bookingData);
                break;
              default:
                console.log('Unknown car event type:', eventType);
            }
          }

        } catch (error) {
          console.error('❌ Error processing booking message:', error.message);
        }
      }
    });

    console.log('🎧 Owner service listening for hotel and car bookings...');
  } catch (error) {
    console.error('❌ Failed to start consuming bookings:', error.message);
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
 * Handle new car booking
 */
const handleNewCarBooking = (bookingData) => {
  // Store booking for owner dashboard
  carBookings.push({
    ...bookingData,
    receivedAt: new Date().toISOString()
  });

  console.log(`✅ Owner processed car booking: ${bookingData.bookingId}`);
  console.log(`   - Car: ${bookingData.car.brand} ${bookingData.car.model}`);
  console.log(`   - Company: ${bookingData.car.company_name}`);
  console.log(`   - Location: ${bookingData.pickupLocation}`);
  console.log(`   - Duration: ${bookingData.days} days`);
  console.log(`   - Total Price: $${bookingData.totalPrice}`);
  console.log(`   - Total car bookings tracked: ${carBookings.length}`);
  
  // Here you can:
  // - Store in database
  // - Notify car rental company
  // - Update availability
  // - Send confirmation email
  // - Update analytics
};

/**
 * Handle car booking status update
 */
const handleCarBookingStatusUpdate = (bookingData) => {
  const booking = carBookings.find(b => b.bookingId === bookingData.bookingId);
  if (booking) {
    booking.status = bookingData.status;
    booking.updatedAt = bookingData.timestamp;
    console.log(`✅ Owner updated car booking status: ${bookingData.bookingId} -> ${bookingData.status}`);
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
 * Get all tracked car bookings
 */
const getCarBookings = (carId = null) => {
  if (carId) {
    return carBookings.filter(b => String(b.car.id) === String(carId));
  }
  return carBookings;
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
  getCarBookings,
  getHotelBookingStats,
  getBookingsByHotel,
  disconnect
};
