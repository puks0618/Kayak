# API Design Documentation

## Overview

This document outlines the API design for the Kayak Microservices platform.

## API Gateway

Base URL: `http://localhost:3000`

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Search Endpoints

#### GET /api/search
Search for listings.

**Query Parameters:**
- `type`: flight | hotel | car
- `origin`: Origin city (for flights)
- `destination`: Destination city
- `date`: Travel date
- `page`: Page number
- `limit`: Results per page

**Response:**
```json
{
  "results": [],
  "total": 0,
  "page": 1,
  "totalPages": 0
}
```

### Booking Endpoints

#### POST /api/bookings
Create a new booking (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "listingId": "uuid",
  "listingType": "flight",
  "travelDate": "2024-12-01",
  "passengers": 2
}
```

**Response:**
```json
{
  "booking": {
    "id": "uuid",
    "status": "confirmed",
    "amount": 500.00
  }
}
```

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "code": "ERR_001"
}
```

### HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

- Rate limit: 100 requests per 15 minutes per IP
- Header: `X-RateLimit-Remaining`

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

**Response Headers:**
- `X-Total-Count`: Total number of items
- `X-Page`: Current page
- `X-Per-Page`: Items per page

