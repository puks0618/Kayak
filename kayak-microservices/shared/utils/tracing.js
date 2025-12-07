/**
 * Distributed Tracing Utilities
 */

const { v4: uuidv4 } = require('uuid');

class TracingService {
  generateTraceId() {
    return uuidv4();
  }

  generateSpanId() {
    return uuidv4();
  }

  createSpan(traceId, parentSpanId, serviceName, operation) {
    return {
      traceId,
      spanId: this.generateSpanId(),
      parentSpanId,
      serviceName,
      operation,
      startTime: Date.now()
    };
  }

  endSpan(span) {
    return {
      ...span,
      endTime: Date.now(),
      duration: Date.now() - span.startTime
    };
  }
}

module.exports = new TracingService();

