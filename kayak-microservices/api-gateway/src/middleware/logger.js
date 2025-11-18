/**
 * Request Logger Middleware
 * Logs all incoming requests with trace ID
 */

const logger = (req, res, next) => {
  const start = Date.now();
  const traceId = req.id || 'unknown';

  // Log request
  console.log(`[${new Date().toISOString()}] [${traceId}] ${req.method} ${req.path}`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] [${traceId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};

module.exports = logger;

