const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseIntSafe(process.env.MYSQL_PORT || '3307'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: 'kayak_listings',
  multipleStatements: true
};

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kayak_listings';
const MONGODB_DB = 'kayak_listings';

// Batch size for bulk inserts
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
 * Clean and parse price string
 */
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[$,]/g, '');
  const price = parseFloatSafe(cleaned);
  return isNaN(price) ? 0 : price;
}

/**
 * Parse boolean values
 */
function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 't' || lower === 'true' || lower === '1';
  }
  return false;
}

/**
 * Parse integer with default
 */
function parseIntSafe(value, defaultValue = 0) {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Parse float with default and max value
 */
function parseFloatSafe(value, defaultValue = 0, maxValue = null) {
  const num = parseFloat(value);
  if (isNaN(num)) return defaultValue;
  if (maxValue !== null && num > maxValue) return maxValue;
  if (num < 0) return 0;
  return num;
}

/**
 * Truncate string to max length
 */
function truncateString(str, maxLength) {
  if (!str) return null;
  return str.length > maxLength ? str.substring(0, maxLength) : str;
}

/**
 * Parse date string to MySQL format
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
}

/**
 * Extract amenities from JSON string
 */
function parseAmenities(amenitiesStr) {
  if (!amenitiesStr) return [];
  try {
    // Remove quotes and parse JSON array
    const cleaned = amenitiesStr.replace(/^"|"$/g, '').replace(/\\/g, '');
    const amenities = JSON.parse(cleaned);
    return Array.isArray(amenities) ? amenities : [];
  } catch (e) {
    return [];
  }
}

/**
 * Clean and remove HTML formatting from description text
 * Strips all HTML tags and converts to plain text
 */
function cleanDescription(desc) {
  if (!desc) return null;
  
  let cleaned = desc;
  
  // Replace <b> tags with bold markers temporarily
  cleaned = cleaned.replace(/<b>([^<]+)<\/b>/gi, '$1');
  
  // Replace <br /> tags with newlines
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // Clean up multiple newlines (more than 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/ {2,}/g, ' ');
  
  // Trim whitespace from each line
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
  
  return cleaned.trim();
}

/**
 * Import listings to MySQL
 */
async function importListings(connection) {
  console.log('\n📊 Importing Listings to MySQL...');
  console.log('='.repeat(60));
  
  const csvPath = path.join(__dirname, 'stays-data', 'listings_reduced.csv');
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headers = [];
  let lineCount = 0;
  let importedCount = 0;
  let batch = [];
  let amenitiesMap = new Map();
  let errorCount = 0;
  const MAX_ERRORS = 100; // Stop after too many errors
  const MAX_RECORDS = 10000; // Limit for faster testing

  // Get existing amenities
  const [amenityRows] = await connection.query('SELECT amenity_id, amenity_name FROM amenities');
  amenityRows.forEach(row => {
    amenitiesMap.set(row.amenity_name.toLowerCase(), row.amenity_id);
  });

  for await (const line of rl) {
    if (lineCount === 0) {
      // Parse headers
      headers = parseCSVLine(line);
      lineCount++;
      continue;
    }
    
    // Limit records for testing
    if (lineCount > MAX_RECORDS) break;

    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || null;
    });

    // Build hotel object with truncation
    const hotel = {
      listing_id: truncateString(row.id || `listing_${lineCount}`, 255),
      hotel_name: truncateString(row.name || 'Unnamed Property', 500),
      description: cleanDescription(row.description), // Clean HTML formatting
      neighborhood_overview: cleanDescription(row.neighborhood_overview),
      address: null, // Not in CSV
      city: truncateString(row.neighbourhood_cleansed || row.neighbourhood || 'Unknown', 255),
      state: null, // Could be extracted from host_location
      neighbourhood: truncateString(row.neighbourhood, 255),
      neighbourhood_cleansed: truncateString(row.neighbourhood_cleansed, 255),
      latitude: parseFloatSafe(row.latitude),
      longitude: parseFloatSafe(row.longitude),
      property_type: truncateString(row.property_type, 255),
      room_type: truncateString(row.room_type, 100),
      accommodates: parseIntSafe(row.accommodates, 2),
      bedrooms: parseIntSafe(row.bedrooms, 1),
      beds: parseIntSafe(row.beds, 1),
      bathrooms: parseFloatSafe(row.bathrooms, 1, 99.9), // Max 99.9
      bathrooms_text: truncateString(row.bathrooms_text, 100),
      price_per_night: parsePrice(row.price),
      minimum_nights: parseIntSafe(row.minimum_nights, 1),
      maximum_nights: parseIntSafe(row.maximum_nights, 365),
      star_rating: Math.min(5, parseFloatSafe(row.review_scores_rating) / 20 || 0), // Convert 0-100 to 0-5
      number_of_reviews: parseIntSafe(row.number_of_reviews, 0),
      review_scores_rating: parseFloatSafe(row.review_scores_rating, 0, 99.99),
      review_scores_accuracy: parseFloatSafe(row.review_scores_accuracy, 0, 99.99),
      review_scores_cleanliness: parseFloatSafe(row.review_scores_cleanliness, 0, 99.99),
      review_scores_checkin: parseFloatSafe(row.review_scores_checkin, 0, 99.99),
      review_scores_communication: parseFloatSafe(row.review_scores_communication, 0, 99.99),
      review_scores_location: parseFloatSafe(row.review_scores_location, 0, 99.99),
      review_scores_value: parseFloatSafe(row.review_scores_value, 0, 99.99),
      host_id: truncateString(row.host_id, 255),
      host_name: truncateString(row.host_name, 255),
      host_since: parseDate(row.host_since),
      host_location: truncateString(row.host_location, 255),
      host_response_time: truncateString(row.host_response_time, 100),
      host_response_rate: truncateString(row.host_response_rate, 50),
      host_is_superhost: parseBoolean(row.host_is_superhost),
      has_availability: parseBoolean(row.has_availability),
      availability_30: parseIntSafe(row.availability_30, 0),
      availability_60: parseIntSafe(row.availability_60, 0),
      availability_90: parseIntSafe(row.availability_90, 0),
      availability_365: parseIntSafe(row.availability_365, 0),
      instant_bookable: parseBoolean(row.instant_bookable),
      picture_url: row.picture_url,
      first_review: parseDate(row.first_review),
      last_review: parseDate(row.last_review),
      last_scraped: parseDate(row.last_scraped),
      amenities: parseAmenities(row.amenities)
    };

    batch.push(hotel);
    lineCount++;

    // Insert batch
    if (batch.length >= BATCH_SIZE) {
      const count = await insertHotelBatch(connection, batch, amenitiesMap);
      importedCount += count;
      batch = [];
      process.stdout.write(`\r   Imported ${importedCount.toLocaleString()} hotels...`);
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    const count = await insertHotelBatch(connection, batch, amenitiesMap);
    importedCount += count;
  }

  // Ensure data is committed
  await connection.query('COMMIT');

  console.log(`\r   ✅ Imported ${importedCount.toLocaleString()} hotels from ${(lineCount - 1).toLocaleString()} rows`);
  return importedCount;
}

/**
 * Insert batch of hotels
 */
async function insertHotelBatch(connection, hotels, amenitiesMap) {
  let successCount = 0;

  for (const hotel of hotels) {
    try {
      const amenities = hotel.amenities;
      delete hotel.amenities;

      const columns = Object.keys(hotel).join(', ');
      const placeholders = Object.keys(hotel).map(() => '?').join(', ');
      const values = Object.values(hotel);

      const sql = `INSERT INTO hotels (${columns}) VALUES (${placeholders})`;
      const [result] = await connection.query(sql, values);
      
      const hotelId = result.insertId;

      // Insert amenities
      if (amenities && amenities.length > 0 && hotelId) {
        for (const amenityName of amenities) {
          const amenityKey = amenityName.toLowerCase().trim();
          const amenityId = amenitiesMap.get(amenityKey);
          
          if (amenityId) {
            try {
              await connection.query(
                'INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id) VALUES (?, ?)',
                [hotelId, amenityId]
              );
            } catch (e) {
              // Ignore duplicate amenity errors
            }
          }
        }
      }

      successCount++;
    } catch (error) {
      // Skip duplicate entries silently
      if (!error.message.includes('Duplicate entry')) {
        // Log unique error types
        const errorType = error.message.match(/for column '([^']+)'/)?.[1] || 'unknown';
        console.error(`\n⚠️  Error: ${errorType} - ${error.message.substring(0, 80)}`);
      }
    }
  }

  return successCount;
}

/**
 * Import reviews to MongoDB
 */
async function importReviews(mongoClient) {
  console.log('\n📊 Importing Reviews to MongoDB...');
  console.log('='.repeat(60));
  
  const db = mongoClient.db(MONGODB_DB);
  const reviewsCollection = db.collection('reviews');

  // Create indexes
  await reviewsCollection.createIndex({ listing_id: 1, date: -1 });
  await reviewsCollection.createIndex({ reviewer_id: 1 });
  await reviewsCollection.createIndex({ listing_id: 1, rating: -1 });

  const csvPath = path.join(__dirname, 'stays-data', 'reviews_reduced.csv');
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headers = [];
  let lineCount = 0;
  let importedCount = 0;
  let batch = [];
  const MAX_REVIEWS = 50000; // Limit reviews for testing

  for await (const line of rl) {
    if (lineCount === 0) {
      // Parse headers
      headers = parseCSVLine(line);
      lineCount++;
      continue;
    }
    
    // Limit records for testing
    if (lineCount > MAX_REVIEWS) break;

    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || null;
    });

    // Build review object
    const review = {
      listing_id: row.listing_id,
      review_id: row.id,
      reviewer_id: row.reviewer_id,
      reviewer_name: row.reviewer_name,
      review_date: row.date ? new Date(row.date) : new Date(),
      comment: row.comments,
      rating: null, // Not in this CSV, would need to calculate from review_scores
      helpful_count: 0,
      verified_booking: true,
      created_at: new Date()
    };

    batch.push(review);
    lineCount++;

    // Insert batch
    if (batch.length >= BATCH_SIZE) {
      try {
        await reviewsCollection.insertMany(batch, { ordered: false });
        importedCount += batch.length;
        batch = [];
        process.stdout.write(`\r   Imported ${importedCount.toLocaleString()} reviews...`);
      } catch (error) {
        // Some duplicates may occur
        importedCount += batch.length;
        batch = [];
      }
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    try {
      await reviewsCollection.insertMany(batch, { ordered: false });
      importedCount += batch.length;
    } catch (error) {
      importedCount += batch.length;
    }
  }

  console.log(`\r   ✅ Imported ${importedCount.toLocaleString()} reviews from ${(lineCount - 1).toLocaleString()} rows`);
  return importedCount;
}

/**
 * Create hotel images collection in MongoDB
 */
async function createImagesCollection(mongoClient, mysqlConnection) {
  console.log('\n📊 Creating Hotel Images Collection...');
  console.log('='.repeat(60));
  
  const db = mongoClient.db(MONGODB_DB);
  const imagesCollection = db.collection('hotel_images');

  // Create indexes
  await imagesCollection.createIndex({ hotel_id: 1 });
  await imagesCollection.createIndex({ listing_id: 1 });

  // Fetch hotels with picture URLs
  const [hotels] = await mysqlConnection.query(
    'SELECT hotel_id, listing_id, picture_url, hotel_name FROM hotels WHERE picture_url IS NOT NULL LIMIT 5000'
  );

  let importedCount = 0;
  const batch = [];

  for (const hotel of hotels) {
    if (hotel.picture_url) {
      const imageDoc = {
        hotel_id: hotel.hotel_id,
        listing_id: hotel.listing_id,
        hotel_name: hotel.hotel_name,
        images: [
          {
            image_url: hotel.picture_url,
            image_type: 'primary',
            caption: hotel.hotel_name,
            is_primary: true,
            upload_date: new Date()
          }
        ],
        created_at: new Date()
      };

      batch.push(imageDoc);

      if (batch.length >= BATCH_SIZE) {
        await imagesCollection.insertMany(batch, { ordered: false });
        importedCount += batch.length;
        batch.length = 0;
        process.stdout.write(`\r   Created ${importedCount.toLocaleString()} image documents...`);
      }
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    await imagesCollection.insertMany(batch, { ordered: false });
    importedCount += batch.length;
  }

  console.log(`\r   ✅ Created ${importedCount.toLocaleString()} image documents`);
  return importedCount;
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 Starting Kayak Stays Data Import...\n');
  console.log('='.repeat(60));

  let mysqlConnection;
  let mongoClient;

  try {
    // Connect to MySQL
    console.log('🔌 Connecting to MySQL...');
    mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('   ✅ MySQL connected');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('   ✅ MongoDB connected');

    // Check if schema exists
    console.log('\n📝 Checking database schema...');
    const [tables] = await mysqlConnection.query("SHOW TABLES LIKE 'hotels'");
    
    if (tables.length === 0) {
      console.log('   Creating new schema...');
      const schemaSQL = fs.readFileSync(
        path.join(__dirname, 'stays-data', 'create_stays_schema.sql'),
        'utf-8'
      );
      await mysqlConnection.query(schemaSQL);
      console.log('   ✅ Schema created');
    } else {
      console.log('   ✅ Schema already exists');
    }

    // Import data
    const hotelsCount = await importListings(mysqlConnection);
    const reviewsCount = await importReviews(mongoClient);
    const imagesCount = await createImagesCollection(mongoClient, mysqlConnection);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Import Summary:');
    console.log('='.repeat(60));
    console.log(`\n✅ Hotels imported:        ${hotelsCount.toLocaleString()}`);
    console.log(`✅ Reviews imported:       ${reviewsCount.toLocaleString()}`);
    console.log(`✅ Image docs created:     ${imagesCount.toLocaleString()}`);
    console.log('\n✅ Data import complete!\n');

  } catch (error) {
    console.error('\n❌ Error during import:', error);
    throw error;
  } finally {
    // Close connections
    if (mysqlConnection) await mysqlConnection.end();
    if (mongoClient) await mongoClient.close();
  }
}

// Run the script
main().catch(console.error);
