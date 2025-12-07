const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3307'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: 'kayak_listings'
};

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

async function fixDescriptions() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL...');
    connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Connected to MySQL\n');
    
    // Get count of records with HTML tags
    console.log('📊 Checking for records with HTML tags...');
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM hotels WHERE description LIKE "%<%"'
    );
    const totalToFix = countResult[0].count;
    console.log(`   Found ${totalToFix} records to update\n`);
    
    if (totalToFix === 0) {
      console.log('✅ No records need updating!');
      return;
    }
    
    // Get all hotels that need fixing
    console.log('📝 Fetching records...');
    const [hotels] = await connection.execute(
      'SELECT hotel_id, description, neighborhood_overview FROM hotels WHERE description LIKE "%<%"'
    );
    console.log(`   Retrieved ${hotels.length} records\n`);
    
    // Update each record
    console.log('🔧 Updating descriptions...');
    let updated = 0;
    
    for (const hotel of hotels) {
      const cleanedDescription = cleanDescription(hotel.description);
      const cleanedOverview = cleanDescription(hotel.neighborhood_overview);
      
      await connection.execute(
        'UPDATE hotels SET description = ?, neighborhood_overview = ? WHERE hotel_id = ?',
        [cleanedDescription, cleanedOverview, hotel.hotel_id]
      );
      
      updated++;
      if (updated % 100 === 0) {
        console.log(`   Updated ${updated}/${totalToFix} records...`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updated} records!`);
    
    // Show a sample cleaned description
    console.log('\n📋 Sample cleaned description (plain text):');
    const [sample] = await connection.execute(
      'SELECT description FROM hotels WHERE description NOT LIKE "%<%" LIMIT 1'
    );
    if (sample.length > 0) {
      console.log(sample[0].description.substring(0, 400) + '...\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 MySQL connection closed');
    }
  }
}

// Run the script
console.log('🚀 Starting HTML Description Cleanup...\n');
console.log('============================================================\n');

fixDescriptions()
  .then(() => {
    console.log('\n============================================================');
    console.log('✅ Cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n============================================================');
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
