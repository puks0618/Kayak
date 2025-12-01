#!/usr/bin/env node

/**
 * Sync airline ratings from MongoDB to MySQL
 * Calculates average rating and review count per airline from MongoDB,
 * then updates the flights table in MySQL
 */

const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');

// MongoDB Atlas connection
const MONGO_URI = 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/';
const DB_NAME = 'kayak_listings';
const COLLECTION_NAME = 'flights_reviews';

// MySQL connection (via Docker)
const MYSQL_CONFIG = {
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
  database: 'kayak_listings'
};

async function getAirlineRatingsFromMongo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Aggregate ratings per airline
    const ratings = await collection.aggregate([
      {
        $group: {
          _id: '$airline',
          avg_rating: { $avg: '$rating' },
          review_count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('📊 Airline Ratings from MongoDB:');
    ratings.forEach(r => {
      console.log(`   ${r._id}: ${r.avg_rating.toFixed(2)} (${r.review_count} reviews)`);
    });
    console.log();
    
    return ratings;
    
  } finally {
    await client.close();
  }
}

async function updateMySQLRatings(ratings) {
  const connection = await mysql.createConnection(MYSQL_CONFIG);
  
  try {
    console.log('✅ Connected to MySQL\n');
    console.log('🔄 Updating flights table...\n');
    
    for (const airline of ratings) {
      const avgRating = parseFloat(airline.avg_rating.toFixed(1));
      const reviewCount = airline.review_count;
      
      const [result] = await connection.execute(
        'UPDATE flights SET airline_rating = ?, airline_review_count = ? WHERE airline = ?',
        [avgRating, reviewCount, airline._id]
      );
      
      console.log(`   ✓ ${airline._id}: Updated ${result.affectedRows} flights`);
    }
    
    console.log('\n✅ All flights updated!\n');
    
    // Verify updates
    console.log('📊 Verification:');
    const [airlines] = await connection.execute(
      'SELECT airline, airline_rating, airline_review_count, COUNT(*) as flight_count FROM flights GROUP BY airline, airline_rating, airline_review_count ORDER BY airline'
    );
    
    airlines.forEach(a => {
      console.log(`   ${a.airline}: ${a.airline_rating} (${a.airline_review_count} reviews) - ${a.flight_count} flights`);
    });
    
  } finally {
    await connection.end();
  }
}

async function main() {
  console.log('🔄 Syncing airline ratings from MongoDB to MySQL\n');
  
  try {
    // Get ratings from MongoDB
    const ratings = await getAirlineRatingsFromMongo();
    
    // Update MySQL
    await updateMySQLRatings(ratings);
    
    console.log('\n✅ Sync complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
