/**
 * Database Connection Configuration
 * Central configuration for MySQL and MongoDB connections
 * 
 * SECURITY: All credentials must be provided via environment variables.
 * Use AWS Secrets Manager in production.
 * Never hardcode credentials in this file.
 */

// Validate required environment variables
if (!process.env.MYSQL_HOST) {
  throw new Error('MYSQL_HOST environment variable is required');
}
if (!process.env.MYSQL_USER) {
  throw new Error('MYSQL_USER environment variable is required');
}
if (!process.env.MYSQL_PASSWORD && !process.env.USE_IAM_AUTH) {
  throw new Error('MYSQL_PASSWORD environment variable is required (or set USE_IAM_AUTH=true)');
}

// MySQL RDS Connection
const mysqlConfig = {
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || '10'),
  connectTimeout: parseInt(process.env.MYSQL_CONNECT_TIMEOUT || '10000'),
  waitForConnections: true,
  queueLimit: 0,
  // Enable SSL for secure connections
  ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: true } : undefined
};

// MongoDB DocumentDB Connection
if (!process.env.MONGODB_HOST) {
  throw new Error('MONGODB_HOST environment variable is required');
}
if (!process.env.MONGODB_USER) {
  throw new Error('MONGODB_USER environment variable is required');
}
if (!process.env.MONGODB_PASSWORD) {
  throw new Error('MONGODB_PASSWORD environment variable is required');
}

const mongoConfig = {
  host: process.env.MONGODB_HOST,
  port: parseInt(process.env.MONGODB_PORT || '27017'),
  user: process.env.MONGODB_USER,
  password: process.env.MONGODB_PASSWORD,
  database: process.env.MONGODB_DATABASE,
  ssl: process.env.MONGODB_SSL !== 'false',
  sslValidate: process.env.MONGODB_SSL_VALIDATE !== 'false',
  replicaSet: 'rs0',
  readPreference: 'secondaryPreferred',
  retryWrites: false
};

// Build MongoDB connection string
const buildMongoUri = (database) => {
  const { user, password, host, port, ssl, replicaSet, readPreference, retryWrites } = mongoConfig;
  const db = database || mongoConfig.database || 'admin';
  
  let uri = `mongodb://${user}:${encodeURIComponent(password)}@${host}:${port}/${db}?`;
  
  const params = [];
  if (ssl) params.push('ssl=true');
  if (replicaSet) params.push(`replicaSet=${replicaSet}`);
  if (readPreference) params.push(`readPreference=${readPreference}`);
  params.push(`retryWrites=${retryWrites}`);
  
  return uri + params.join('&');
};

// Service-specific database names
const databases = {
  mysql: {
    auth: 'kayak_auth',
    users: 'kayak_users',
    listings: 'kayak_listings',
    bookings: 'kayak_bookings'
  },
  mongodb: {
    listings: 'kayak_listings',
    analytics: 'kayak_analytics',
    logs: 'kayak_logs'
  }
};

module.exports = {
  mysqlConfig,
  mongoConfig,
  buildMongoUri,
  databases
};
