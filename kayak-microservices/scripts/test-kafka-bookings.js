/**
 * Test Kafka Producer - Simulates Flight and Hotel Bookings
 * Use this to test that Kafka consumers are working properly
 */

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

const sampleFlightBooking = {
  bookingId: 'BK' + Date.now(),
  type: 'flight',
  status: 'confirmed',
  outboundFlight: {
    airline: 'Delta Airlines',
    origin: 'LAX',
    destination: 'SFO',
    departureTime: '2025-12-10T09:00:00Z',
  },
  returnFlight: {
    airline: 'Delta Airlines',
    origin: 'SFO',
    destination: 'LAX',
    departureTime: '2025-12-15T17:00:00Z',
  },
  passengers: 2,
  passengerInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123'
  },
  totalPrice: 450.00,
  bookingDate: new Date().toISOString(),
  timestamp: new Date().toISOString()
};

const sampleHotelBooking = {
  bookingId: 'BK' + (Date.now() + 1),
  type: 'hotel',
  status: 'confirmed',
  hotel: {
    id: 12345,
    name: 'Hilton San Francisco',
    city: 'San Francisco',
    neighbourhood: 'Union Square'
  },
  checkIn: '2025-12-10',
  checkOut: '2025-12-15',
  guests: 2,
  nights: 5,
  guestInfo: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0456'
  },
  totalPrice: 850.00,
  bookingDate: new Date().toISOString(),
  timestamp: new Date().toISOString()
};

async function publishTestBookings() {
  try {
    await producer.connect();
    console.log('✅ Test producer connected to Kafka');

    // Publish flight booking
    console.log('\n📤 Publishing test flight booking...');
    await producer.send({
      topic: 'flight-bookings',
      messages: [
        {
          key: sampleFlightBooking.bookingId,
          value: JSON.stringify(sampleFlightBooking),
          headers: {
            'event-type': 'booking-created',
            'source': 'test-producer'
          }
        }
      ]
    });
    console.log(`✅ Flight booking published: ${sampleFlightBooking.bookingId}`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Publish hotel booking
    console.log('\n📤 Publishing test hotel booking...');
    await producer.send({
      topic: 'hotel-bookings',
      messages: [
        {
          key: sampleHotelBooking.bookingId,
          value: JSON.stringify(sampleHotelBooking),
          headers: {
            'event-type': 'booking-created',
            'source': 'test-producer',
            'hotel-id': String(sampleHotelBooking.hotel.id)
          }
        }
      ]
    });
    console.log(`✅ Hotel booking published: ${sampleHotelBooking.bookingId}`);

    console.log('\n✅ All test bookings published successfully!');
    console.log('\nCheck the following:');
    console.log('  - Admin service logs for flight booking');
    console.log('  - Owner service logs for hotel booking');
    console.log('  - Kafka UI at http://localhost:8080 for messages');

  } catch (error) {
    console.error('❌ Error publishing test bookings:', error);
  } finally {
    await producer.disconnect();
    console.log('\n👋 Test producer disconnected');
    process.exit(0);
  }
}

// Run the test
publishTestBookings();
