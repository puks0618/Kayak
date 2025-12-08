const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3307'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Somalwar1!',
  database: 'kayak_listings'
};

// All available amenities to assign to hotels randomly
// We'll fetch all amenities from the database instead of hardcoding them

async function populateAmenities() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL...');
    connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Connected to MySQL');

    // Get ALL amenity IDs
    console.log('\n📋 Fetching all amenities...');
    const [amenities] = await connection.query(
      'SELECT amenity_id, amenity_name FROM amenities'
    );
    
    console.log(`✅ Found ${amenities.length} amenities`);

    // Get all hotels
    console.log('\n🏨 Fetching hotels...');
    const [hotels] = await connection.query('SELECT hotel_id FROM hotels LIMIT 1000');
    console.log(`✅ Found ${hotels.length} hotels`);

    // Clear existing amenity assignments first
    console.log('\n🗑️  Clearing existing amenity assignments...');
    await connection.query('DELETE FROM hotel_amenities');
    console.log('✅ Cleared existing assignments');

    // Assign random amenities to each hotel
    console.log('\n🔗 Assigning amenities to hotels...');
    let insertCount = 0;

    for (const hotel of hotels) {
      // Randomly select 3-25 amenities per hotel (varying widely)
      const minAmenities = 3;
      const maxAmenities = Math.min(25, amenities.length);
      const numAmenities = Math.floor(Math.random() * (maxAmenities - minAmenities + 1)) + minAmenities;
      
      const shuffled = [...amenities].sort(() => 0.5 - Math.random());
      const selectedAmenities = shuffled.slice(0, numAmenities);

      for (const amenity of selectedAmenities) {
        try {
          await connection.query(
            'INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id) VALUES (?, ?)',
            [hotel.hotel_id, amenity.amenity_id]
          );
          insertCount++;
        } catch (error) {
          // Ignore errors
        }
      }

      if (insertCount % 100 === 0) {
        process.stdout.write(`\r   Processed ${insertCount} amenity assignments...`);
      }
    }

    console.log(`\n✅ Successfully assigned ${insertCount} amenities to hotels`);

    // Show sample results
    console.log('\n📊 Sample Results:');
    const [sampleResults] = await connection.query(`
      SELECT 
        h.hotel_id,
        h.hotel_name,
        GROUP_CONCAT(a.amenity_name SEPARATOR ', ') as amenities
      FROM hotels h
      LEFT JOIN hotel_amenities ha ON h.hotel_id = ha.hotel_id
      LEFT JOIN amenities a ON ha.amenity_id = a.amenity_id
      GROUP BY h.hotel_id, h.hotel_name
      LIMIT 5
    `);

    sampleResults.forEach(row => {
      console.log(`\n🏨 ${row.hotel_name}`);
      console.log(`   Amenities: ${row.amenities || 'None'}`);
    });

    // Count statistics
    const [stats] = await connection.query(`
      SELECT 
        COUNT(DISTINCT hotel_id) as hotels_with_amenities,
        COUNT(*) as total_amenity_assignments,
        AVG(amenity_count) as avg_amenities_per_hotel
      FROM (
        SELECT hotel_id, COUNT(*) as amenity_count
        FROM hotel_amenities
        GROUP BY hotel_id
      ) as counts
    `);

    console.log('\n📈 Statistics:');
    console.log(`   Hotels with amenities: ${stats[0].hotels_with_amenities}`);
    console.log(`   Total amenity assignments: ${stats[0].total_amenity_assignments}`);
    console.log(`   Average amenities per hotel: ${parseFloat(stats[0].avg_amenities_per_hotel).toFixed(2)}`);

    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

populateAmenities();
