#!/usr/bin/env node

/**
 * Import airline reviews from CSV to MongoDB Atlas
 * Collection: kayak_listings.flights_reviews
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const csv = require('csv-parser');

// MongoDB Atlas connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/';
const DB_NAME = 'kayak_listings';
const COLLECTION_NAME = 'flights_reviews';
const CSV_FILE = path.join(__dirname, 'airline_reviews.csv');

// Batch size for inserts
const BATCH_SIZE = 100;

async function readCSV() {
  return new Promise((resolve, reject) => {
    const reviews = [];
    
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (row) => {
        // Parse and validate row
        try {
          const review = {
            airline: row.airline.trim(),
            reviewer_id: row.reviewer_id.trim(),
            reviewer_name: row.reviewer_name.trim(),
            review_date: new Date(row.review_date),
            rating: parseInt(row.rating),
            comment: row.comment.trim(),
            verified_booking: row.verified_booking === 'True' || row.verified_booking === 'true',
            helpful_count: parseInt(row.helpful_count),
            created_at: new Date()
          };
          
          // Validation
          if (!review.airline || !review.reviewer_id || !review.reviewer_name) {
            console.warn('⚠️  Skipping malformed row:', row);
            return;
          }
          
          if (review.rating < 1 || review.rating > 5) {
            console.warn('⚠️  Invalid rating:', review.rating);
            return;
          }
          
          reviews.push(review);
        } catch (error) {
          console.warn('⚠️  Error parsing row:', error.message);
        }
      })
      .on('end', () => {
        console.log(`✅ Parsed ${reviews.length} valid reviews from CSV\n`);
        resolve(reviews);
      })
      .on('error', reject);
  });
}

async function importToMongo(reviews) {
  const client = new MongoClient(MONGO_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Clear existing airline reviews (optional - comment out if you want to keep)
    console.log('🗑️  Clearing existing airline reviews...');
    const deleteResult = await collection.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} existing documents\n`);
    
    // Batch insert
    console.log(`📥 Inserting ${reviews.length} reviews in batches of ${BATCH_SIZE}...`);
    let inserted = 0;
    
    for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
      const batch = reviews.slice(i, i + BATCH_SIZE);
      await collection.insertMany(batch);
      inserted += batch.length;
      process.stdout.write(`\r   Progress: ${inserted}/${reviews.length} (${((inserted/reviews.length)*100).toFixed(1)}%)`);
    }
    
    console.log('\n✅ All reviews inserted!\n');
    
    // Create indexes
    console.log('📇 Creating indexes...');
    await collection.createIndex({ airline: 1 });
    await collection.createIndex({ reviewer_id: 1 });
    await collection.createIndex({ review_date: -1 });
    await collection.createIndex({ rating: 1 });
    await collection.createIndex({ airline: 1, review_date: -1 });
    console.log('✅ Indexes created\n');
    
    // Statistics
    console.log('📊 Import Statistics:');
    const totalDocs = await collection.countDocuments();
    console.log(`   Total documents: ${totalDocs}`);
    
    // Reviews per airline
    const perAirline = await collection.aggregate([
      {
        $group: {
          _id: '$airline',
          count: { $sum: 1 },
          avg_rating: { $avg: '$rating' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n   Reviews per airline:');
    perAirline.forEach(airline => {
      console.log(`      ${airline._id}: ${airline.count} reviews (avg: ${airline.avg_rating.toFixed(2)})`);
    });
    
    // Rating distribution
    const ratingDist = await collection.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n   Rating distribution:');
    ratingDist.forEach(r => {
      const percentage = (r.count / totalDocs * 100).toFixed(1);
      console.log(`      ${r._id} stars: ${r.count} (${percentage}%)`);
    });
    
    // Collection stats
    const stats = await db.command({ collStats: COLLECTION_NAME });
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`\n   Collection size: ${sizeMB} MB`);
    console.log(`   Storage size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Indexes: ${stats.nindexes}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

async function main() {
  console.log('🛫 Starting airline reviews import to MongoDB Atlas\n');
  console.log(`   Database: ${DB_NAME}`);
  console.log(`   Collection: ${COLLECTION_NAME}`);
  console.log(`   CSV File: ${CSV_FILE}\n`);
  
  try {
    // Check if CSV exists
    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(`CSV file not found: ${CSV_FILE}`);
    }
    
    // Read CSV
    const reviews = await readCSV();
    
    if (reviews.length === 0) {
      throw new Error('No valid reviews found in CSV');
    }
    
    // Import to MongoDB
    await importToMongo(reviews);
    
    console.log('\n✈️  Import complete! Reviews are now in MongoDB Atlas.');
    console.log('\n💡 Next steps:');
    console.log('   1. Update MySQL flights table with airline ratings');
    console.log('   2. Update listing-service to fetch reviews from MongoDB');
    console.log('   3. Update frontend to display airline ratings and reviews\n');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run
main();
