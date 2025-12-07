/**
 * Integration Tests for Authentication Flow
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Authentication Integration Tests', () => {
  let authToken;

  test('should register a new user', async () => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email: 'test@example.com',
      password: 'Test123456',
      name: 'Test User'
    });

    expect(response.status).toBe(201);
    // TODO: Add more assertions
  });

  test('should login with valid credentials', async () => {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'Test123456'
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('token');
    authToken = response.data.token;
  });

  test('should access protected route with valid token', async () => {
    const response = await axios.get(`${API_URL}/api/users/me/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
  });
});

