import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectMongoDB, initializeMySQL } from './config/database';
import billingRoutes from './routes/billing';
import invoiceRoutes from './routes/invoiceRoutes';
import logsRoutes from './routes/logs';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logRequest, logError } from './middleware/logger';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5176'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(logRequest);

// Routes
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Billing API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/billing', invoiceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/logs', logsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(logError);
app.use(errorHandler);

// Initialize databases and start server
const startServer = async () => {
  try {
    // Initialize MySQL tables
    await initializeMySQL();
    
    // Connect to MongoDB
    await connectMongoDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`💳 Billing API: http://localhost:${PORT}/api/billing`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

