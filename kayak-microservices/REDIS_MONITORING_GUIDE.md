# Redis Caching Monitoring Guide

## Overview

This guide provides comprehensive information for monitoring and managing Redis caching across the Kayak microservices platform.

## Redis Database Organization

| Database | Service | Cache Keys | TTL | Purpose |
|----------|---------|------------|-----|---------|
| **DB 0** | listing-service | `car_search:*` | 600s | Car rental search caching only |
| **DB 1** | listing-service | `flight_search:*` | 600s | Flight search caching (one-way & round-trip) |
| **DB 2** | search-service | TBD | 300s | General search queries |
| **DB 4** | listing-service | `hotel_search:*` | 600s | Hotel/stays search caching |

## Cache Key Patterns

### Car Searches
**Pattern:** `car_search:<md5_hash>`

**Hash Generated From:**
- location
- pickupDate
- dropoffDate
- type (SUV, Sedan, etc.)
- transmission
- seats
- company
- minPrice / maxPrice
- sortBy / sortOrder
- pagination (page, limit)

**Example:**
```
car_search:cbf0a86af2d15aa2b775dd1ff63ea21f
```

### Flight Searches
**Pattern:** `flight_search:<md5_hash>`

**Hash Generated From:**
- origin (airport code)
- destination (airport code)
- departureDate
- returnDate (for round-trips)
- cabinClass
- directOnly
- maxPrice
- sortBy / sortOrder
- pagination (limit, offset)

**Example:**
```
flight_search:96c7244b2d7c5277cdca81571c4b7eee
```

**Note:** Round-trip flights are cached as a single unified entry containing both outbound and return flights.

### Hotel Searches
**Pattern:** `hotel_search:<md5_hash>`

**Hash Generated From:**
- cities (array)
- checkIn
- checkOut
- rooms
- guests
- priceMin / priceMax
- starRating
- amenities
- propertyType
- sortBy
- pagination (page, limit)

## Monitoring Endpoints

### Cache Statistics
**Endpoint:** `GET /api/listings/admin/cache/stats`

**Response:**
```json
{
  "uptime": "2h 45m",
  "timestamp": "2025-12-07T10:30:00.000Z",
  "caches": {
    "cars": {
      "hits": 150,
      "misses": 50,
      "total": 200,
      "hitRate": "75.00%",
      "avgResponseTime": "35.50ms"
    },
    "flights": {
      "hits": 200,
      "misses": 80,
      "total": 280,
      "hitRate": "71.43%",
      "avgResponseTime": "28.75ms"
    },
    "hotels": {
      "hits": 100,
      "misses": 40,
      "total": 140,
      "hitRate": "71.43%",
      "avgResponseTime": "32.20ms"
    }
  },
  "overall": {
    "totalRequests": 620,
    "totalHits": 450,
    "totalMisses": 170,
    "overallHitRate": "72.58%"
  },
  "redis": {
    "db0": {
      "name": "Cars & Hotels",
      "keys": 15,
      "pattern": "car_search:*, hotel_search:*"
    },
    "db1": {
      "name": "Flights",
      "keys": 23,
      "pattern": "flight_search:*"
    }
  }
}
```

### Cache Health Check
**Endpoint:** `GET /api/listings/admin/cache/health`

**Response:**
```json
{
  "status": "healthy",
  "databases": {
    "db0": {
      "name": "Cars & Hotels",
      "connected": true,
      "status": "up"
    },
    "db1": {
      "name": "Flights",
      "connected": true,
      "status": "up"
    }
  },
  "timestamp": "2025-12-07T10:30:00.000Z"
}
```

### Reset Metrics
**Endpoint:** `POST /api/listings/admin/cache/reset`

**Response:**
```json
{
  "success": true,
  "message": "Cache metrics have been reset"
}
```

## Redis Commander Access

**URL:** http://localhost:8081

### Viewing Different Databases

1. Access Redis Commander at http://localhost:8081
2. In the left sidebar, you'll see four connections:
   - `local (kayak-redis:6379:0)` - Cars Only
   - `local (kayak-redis:6379:1)` - Flights
   - `local (kayak-redis:6379:2)` - Search Service
   - `local (kayak-redis:6379:4)` - Hotels
3. Click on any connection to view its keys

## CLI Commands

### Check Database Sizes
```bash
# DB 0 (Cars Only)
docker exec kayak-redis redis-cli -n 0 DBSIZE

# DB 1 (Flights)
docker exec kayak-redis redis-cli -n 1 DBSIZE

# DB 2 (Search Service)
docker exec kayak-redis redis-cli -n 2 DBSIZE

# DB 4 (Hotels)
docker exec kayak-redis redis-cli -n 4 DBSIZE
```

### View All Keys
```bash
# Cars
docker exec kayak-redis redis-cli -n 0 KEYS "car_search:*"

# Flights
docker exec kayak-redis redis-cli -n 1 KEYS "flight_search:*"

# Hotels
docker exec kayak-redis redis-cli -n 4 KEYS "hotel_search:*"
```

### Check TTL
```bash
# Check remaining TTL for a specific key
docker exec kayak-redis redis-cli -n 0 TTL "car_search:<hash>"
docker exec kayak-redis redis-cli -n 1 TTL "flight_search:<hash>"
```

### View Cache Content
```bash
# Get cached data for a specific key
docker exec kayak-redis redis-cli -n 0 GET "car_search:<hash>"
docker exec kayak-redis redis-cli -n 1 GET "flight_search:<hash>"
```

### Clear Specific Database
```bash
# Clear all car/hotel caches
docker exec kayak-redis redis-cli -n 0 FLUSHDB

# Clear all flight caches
docker exec kayak-redis redis-cli -n 1 FLUSHDB

# Clear search service cache
docker exec kayak-redis redis-cli -n 2 FLUSHDB
```

### Clear ALL Databases
```bash
docker exec kayak-redis redis-cli FLUSHALL
```

## Performance Metrics

### Expected Performance
- **Cache Miss:** 50-150ms (includes database query)
- **Cache Hit:** 20-50ms (Redis lookup only)
- **Performance Improvement:** 60-70% on cache hits
- **Target Hit Rate:** 70%+ after warm-up

### Monitoring Best Practices

1. **Monitor Hit Rates**
   - Check `/api/listings/admin/cache/stats` regularly
   - Investigate if hit rate drops below 60%
   - Adjust TTL if needed based on data freshness requirements

2. **Track Response Times**
   - Compare cache hit vs miss response times
   - Alert if cache hits exceed 100ms
   - Alert if cache misses exceed 500ms

3. **Watch Database Sizes**
   - Monitor key counts in each database
   - Alert if DB 0 or DB 1 exceed 10,000 keys
   - Consider memory limits

4. **Health Checks**
   - Monitor `/api/listings/admin/cache/health`
   - Alert on degraded or error status
   - Check Redis connectivity regularly

## Cache Invalidation

### Current Strategy: Natural Expiration
- **TTL:** 600 seconds (10 minutes)
- **Behavior:** Caches expire automatically
- **Trade-off:** Data may be up to 10 minutes stale

### Manual Invalidation (if needed)
```bash
# Clear specific cache type
docker exec kayak-redis redis-cli -n 0 KEYS "car_search:*" | xargs docker exec kayak-redis redis-cli -n 0 DEL
docker exec kayak-redis redis-cli -n 1 KEYS "flight_search:*" | xargs docker exec kayak-redis redis-cli -n 1 DEL
```

### Future Considerations
- Implement immediate invalidation on price updates
- Add cache invalidation on new listing additions
- Consider publish/subscribe for cache invalidation events

## Troubleshooting

### Cache Not Working
1. Check Redis connectivity:
   ```bash
   docker exec kayak-redis redis-cli ping
   ```
2. Verify service logs:
   ```bash
   docker logs kayak-listing-service | grep -i redis
   ```
3. Check cache health endpoint:
   ```bash
   curl http://localhost:3003/api/listings/admin/cache/health
   ```

### Low Hit Rate
1. Check if TTL is too short
2. Verify search parameters are consistent
3. Look for parameter variations causing unique keys
4. Consider cache warming for popular searches

### High Memory Usage
1. Check database sizes
2. Monitor key counts
3. Consider reducing TTL
4. Implement key eviction policies

## Redis Configuration

### Connection Settings
```javascript
// DB 0 - Cars Only
{
  url: 'redis://kayak-redis:6379',
  database: 0,
  password: process.env.REDIS_PASSWORD
}

// DB 1 - Flights
{
  url: 'redis://kayak-redis:6379',
  database: 1,
  password: process.env.REDIS_PASSWORD
}

// DB 2 - Search Service
{
  url: 'redis://kayak-redis:6379',
  database: 2,
  password: process.env.REDIS_PASSWORD
}

// DB 4 - Hotels
{
  url: 'redis://kayak-redis:6379',
  database: 2,
  password: process.env.REDIS_PASSWORD
}
```

### Environment Variables
```bash
REDIS_HOST=kayak-redis
REDIS_PORT=6379
REDIS_PASSWORD=<optional>
```

## Best Practices

1. **Cache Key Design**
   - Include all relevant parameters
   - Use consistent ordering
   - Generate deterministic hashes

2. **TTL Selection**
   - Balance freshness vs performance
   - Consider data update frequency
   - Current: 600s (10 minutes)

3. **Monitoring**
   - Track hit rates continuously
   - Monitor response times
   - Alert on anomalies

4. **Capacity Planning**
   - Monitor key counts
   - Track memory usage
   - Plan for growth

5. **Testing**
   - Test cache hits and misses
   - Verify TTL expiration
   - Check different parameter combinations

## Related Documentation

- [Phase 1: Car Caching Complete](PHASE_1_CAR_CACHING_COMPLETE.md)
- [Docker Compose Configuration](infrastructure/docker/docker-compose.yml)
- [Redis Commander UI](http://localhost:8081)
