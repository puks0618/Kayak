# JMeter Performance Tests

Performance test scenarios for Kayak microservices.

## Test Scenarios

1. **base.jmx** - Basic load test without caching
2. **with-cache.jmx** - Load test with Redis caching enabled
3. **with-kafka.jmx** - Load test with Kafka event publishing
4. **full-stack.jmx** - Complete end-to-end load test

## Running Tests

```bash
# Install JMeter first
jmeter -n -t base.jmx -l results/base-results.jtl -e -o results/base-report

# With custom parameters
jmeter -n -t base.jmx \
  -JBASE_URL=http://your-server:3000 \
  -JUSERS=100 \
  -JRAMP_UP=60 \
  -l results/results.jtl
```

## Metrics to Monitor

- Response time (p50, p95, p99)
- Throughput (requests/second)
- Error rate
- CPU and memory usage
- Database connections
- Cache hit rate

