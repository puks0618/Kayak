/**
 * Integration Tests for Complete Booking Flow
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Booking Flow Integration Tests', () => {
  let authToken;
  let listingId;
  let bookingId;

  beforeAll(async () => {
    // TODO: Login and get auth token
    // TODO: Create test listing
  });

  test('should search for available listings', async () => {
    const response = await axios.get(`${API_URL}/api/search`, {
      params: {
        type: 'flight',
        origin: 'NYC',
        destination: 'LAX'
      }
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('results');
  });

  test('should create a booking', async () => {
    const response = await axios.post(
      `${API_URL}/api/bookings`,
      {
        listingId: 'test-listing-id',
        listingType: 'flight',
        travelDate: '2024-12-01'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    expect(response.status).toBe(201);
    bookingId = response.data.booking.id;
  });

  test('should retrieve booking details', async () => {
    const response = await axios.get(`${API_URL}/api/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    expect(response.status).toBe(200);
  });
});

