/**
 * Kafka Producer for Booking Service
 * Publishes booking events to Kafka topics
 */

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: {
    retries: 5,
    initialRetryTime: 300,
  }
});

const producer = kafka.producer();

let isConnected = false;

/**
 * Connect to Kafka
 */
const connect = async () => {
  if (!isConnected) {
    try {
      await producer.connect();
      isConnected = true;
      console.log('✅ Kafka Producer connected');
    } catch (error) {
      console.error('❌ Kafka Producer connection failed:', error.message);
      throw error;
    }
  }
};

/**
 * Publish flight booking event
 * Topic: flight-bookings
 * Consumer: Admin Service
 */
const publishFlightBooking = async (bookingData) => {
  try {
    await connect();
    
    const message = {
      bookingId: bookingData.bookingId,
      userId: bookingData.userId,
      type: 'flight',
      status: bookingData.status,
      outboundFlight: {
        airline: bookingData.outboundFlight?.airline,
        origin: bookingData.outboundFlight?.departure_airport || bookingData.outboundFlight?.origin,
        destination: bookingData.outboundFlight?.arrival_airport || bookingData.outboundFlight?.destination,
        departureTime: bookingData.outboundFlight?.departure_time || bookingData.outboundFlight?.departureTime,
      },
      returnFlight: bookingData.returnFlight ? {
        airline: bookingData.returnFlight?.airline,
        origin: bookingData.returnFlight?.departure_airport || bookingData.returnFlight?.origin,
        destination: bookingData.returnFlight?.arrival_airport || bookingData.returnFlight?.destination,
        departureTime: bookingData.returnFlight?.departure_time || bookingData.returnFlight?.departureTime,
      } : null,
      passengers: bookingData.passengers,
      passengerInfo: bookingData.passengerInfo,
      totalPrice: bookingData.totalPrice,
      bookingDate: bookingData.bookingDate,
      timestamp: new Date().toISOString()
    };

    await producer.send({
      topic: 'flight-bookings',
      messages: [
        {
          key: bookingData.bookingId,
          value: JSON.stringify(message),
          headers: {
            'event-type': 'booking-created',
            'source': 'booking-service'
          }
        }
      ]
    });

    console.log(`✅ Flight booking published to Kafka: ${bookingData.bookingId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to publish flight booking:', error.message);
    return false;
  }
};

/**
 * Publish hotel booking event
 * Topic: hotel-bookings
 * Consumer: Owner Service (to be created)
 */
const publishHotelBooking = async (bookingData) => {
  try {
    await connect();
    
    const message = {
      bookingId: bookingData.bookingId,
      userId: bookingData.userId,
      type: 'hotel',
      status: bookingData.status,
      hotel: {
        id: bookingData.hotel?.hotel_id || bookingData.hotel?.id,
        name: bookingData.hotel?.hotel_name || bookingData.hotel?.name,
        city: bookingData.hotel?.city,
        neighbourhood: bookingData.hotel?.neighbourhood_cleansed
      },
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guests: bookingData.guests,
      nights: bookingData.nights,
      guestInfo: bookingData.guestInfo,
      totalPrice: bookingData.totalPrice,
      bookingDate: bookingData.bookingDate,
      timestamp: new Date().toISOString()
    };

    await producer.send({
      topic: 'hotel-bookings',
      messages: [
        {
          key: bookingData.bookingId,
          value: JSON.stringify(message),
          headers: {
            'event-type': 'booking-created',
            'source': 'booking-service',
            'hotel-id': String(bookingData.hotel?.hotel_id || bookingData.hotel?.id)
          }
        }
      ]
    });

    console.log(`✅ Hotel booking published to Kafka: ${bookingData.bookingId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to publish hotel booking:', error.message);
    return false;
  }
};

/**
 * Publish booking status update
 */
const publishBookingStatusUpdate = async (bookingId, status, type) => {
  try {
    await connect();
    
    const topic = type === 'flight' ? 'flight-bookings' : 'hotel-bookings';
    const message = {
      bookingId,
      type,
      status,
      eventType: 'status-update',
      timestamp: new Date().toISOString()
    };

    await producer.send({
      topic,
      messages: [
        {
          key: bookingId,
          value: JSON.stringify(message),
          headers: {
            'event-type': 'booking-status-updated',
            'source': 'booking-service'
          }
        }
      ]
    });

    console.log(`✅ Booking status update published to Kafka: ${bookingId} -> ${status}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to publish booking status update:', error.message);
    return false;
  }
};

/**
 * Disconnect from Kafka
 */
const disconnect = async () => {
  if (isConnected) {
    await producer.disconnect();
    isConnected = false;
    console.log('Kafka Producer disconnected');
  }
};

// Graceful shutdown
process.on('SIGINT', disconnect);
process.on('SIGTERM', disconnect);

module.exports = {
  connect,
  publishFlightBooking,
  publishHotelBooking,
  publishBookingStatusUpdate,
  disconnect
};
