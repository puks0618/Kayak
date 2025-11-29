import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// MySQL Connection Pool
export const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'kayak_billing',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// MongoDB Connection
export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize MySQL tables
export const initializeMySQL = async (): Promise<void> => {
  try {
    const connection = await mysqlPool.getConnection();
    
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, '../../sql/create_bills_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    await connection.query(sql);
    
    connection.release();
    console.log('✅ MySQL tables initialized successfully');
  } catch (error) {
    console.error('❌ MySQL initialization error:', error);
    throw error;
  }
};

