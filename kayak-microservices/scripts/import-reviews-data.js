const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/kayak_listings';
const MONGODB_DB = 'kayak_listings';
const BATCH_SIZE = 1000;

/**
 * Parse CSV line handling quoted fields with commas
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

/**
 * Clean string value
 */
function cleanString(value) {
  if (!value) return '';
  return value.replace(/^["']|["']$/g, '').trim();
}

/**
 * Import reviews from CSV to MongoDB
 */
async function importReviews() {
  let mongoClient;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    
    const db = mongoClient.db(MONGODB_DB);
    const reviewsCollection = db.collection('reviews');
    
    // Create indexes
    console.log('📊 Creating indexes...');
    await reviewsCollection.createIndex({ listing_id: 1 });
    await reviewsCollection.createIndex({ reviewer_id: 1 });
    await reviewsCollection.createIndex({ date: -1 });
    
    // Clear existing reviews
    console.log('🗑️  Clearing existing reviews...');
    await reviewsCollection.deleteMany({});
    
    // Read and import CSV
    const csvPath = path.join(__dirname, 'stays-data', 'reviews_reduced.csv');
    console.log(`📂 Reading reviews from: ${csvPath}`);
    
    const fileStream = fs.createReadStream(csvPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let batch = [];
    let totalImported = 0;
    let lineNumber = 0;
    let headers = [];
    
    for await (const line of rl) {
      lineNumber++;
      
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Parse headers
      if (lineNumber === 1) {
        headers = parseCSVLine(line);
        console.log(`📋 CSV Headers: ${headers.join(', ')}`);
        continue;
      }
      
      try {
        const values = parseCSVLine(line);
        
        // Skip if not enough values
        if (values.length < headers.length) {
          console.warn(`⚠️  Line ${lineNumber}: Insufficient values, skipping`);
          continue;
        }
        
        // Parse and validate listing_id
        const listingId = parseInt(values[0]);
        if (isNaN(listingId) || listingId === 0) {
          // Skip malformed rows
          continue;
        }
        
        const review = {
          listing_id: listingId,
          review_id: values[1] ? parseInt(values[1]) : lineNumber,
          date: values[2] || '',
          reviewer_id: parseInt(values[3]) || 0,
          reviewer_name: cleanString(values[4]) || 'Anonymous',
          comments: cleanString(values[5]) || '',
          created_at: new Date()
        };
        
        // Skip reviews without comments
        if (!review.comments) {
          continue;
        }
        
        batch.push(review);
        
        // Insert batch when it reaches BATCH_SIZE
        if (batch.length >= BATCH_SIZE) {
          await reviewsCollection.insertMany(batch);
          totalImported += batch.length;
          console.log(`✅ Imported ${totalImported} reviews...`);
          batch = [];
        }
      } catch (error) {
        console.error(`❌ Error processing line ${lineNumber}:`, error.message);
      }
    }
    
    // Insert remaining batch
    if (batch.length > 0) {
      await reviewsCollection.insertMany(batch);
      totalImported += batch.length;
    }
    
    console.log(`\n🎉 Successfully imported ${totalImported} reviews!`);
    
    // Show some statistics
    const stats = await reviewsCollection.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          uniqueListings: { $addToSet: '$listing_id' },
          uniqueReviewers: { $addToSet: '$reviewer_id' }
        }
      }
    ]).toArray();
    
    if (stats.length > 0) {
      console.log(`\n📊 Statistics:`);
      console.log(`   Total Reviews: ${stats[0].totalReviews}`);
      console.log(`   Unique Listings with Reviews: ${stats[0].uniqueListings.length}`);
      console.log(`   Unique Reviewers: ${stats[0].uniqueReviewers.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error importing reviews:', error);
    throw error;
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      console.log('\n✅ MongoDB connection closed');
    }
  }
}

// Run import
importReviews()
  .then(() => {
    console.log('✅ Import completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
