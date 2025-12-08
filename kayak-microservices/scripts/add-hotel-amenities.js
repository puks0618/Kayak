const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3307'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Somalwar1!',
  database: 'kayak_listings'
};

// Common hotel amenities
const AMENITIES_POOL = [
  'Wifi', 'Kitchen', 'Air conditioning', 'Heating', 'TV', 'Hair dryer',
  'Iron', 'Washer', 'Dryer', 'Free parking on premises', 'Paid parking on premises',
  'Gym', 'Pool', 'Hot tub', 'EV charger', 'Crib', 'Workspace',
  'Breakfast', 'BBQ grill', 'Fire pit', 'Patio or balcony', 'Backyard',
  'Beach access', 'Lake access', 'Ski-in/Ski-out', 'Smoke alarm',
  'Carbon monoxide alarm', 'First aid kit', 'Fire extinguisher', 'Security cameras',
  'Self check-in', 'Lockbox', 'Keypad', 'Smart lock', 'Doorman',
  'Pets allowed', 'Smoking allowed', 'Long term stays allowed', 'Hangers',
  'Bed linens', 'Extra pillows and blankets', 'Ethernet connection',
  'Pocket wifi', 'Dishwasher', 'Coffee maker', 'Refrigerator', 'Microwave',
  'Dishes and silverware', 'Freezer', 'Stove', 'Oven', 'Mini fridge'
];

async function addAmenities() {
  console.log('🔌 Connecting to MySQL...');
  const connection = await mysql.createConnection(MYSQL_CONFIG);
  console.log('✅ Connected\n');

  console.log('📋 Fetching hotels...');
  const [hotels] = await connection.query('SELECT id FROM hotels');
  console.log(`✅ Found ${hotels.length} hotels\n`);

  console.log('🏨 Adding amenities to hotels...');
  let updated = 0;

  for (const hotel of hotels) {
    // Random number of amenities per hotel (8-25)
    const numAmenities = Math.floor(Math.random() * 18) + 8;
    
    // Shuffle and select random amenities
    const shuffled = [...AMENITIES_POOL].sort(() => 0.5 - Math.random());
    const selectedAmenities = shuffled.slice(0, numAmenities);

    await connection.query(
      'UPDATE hotels SET amenities = ? WHERE id = ?',
      [JSON.stringify(selectedAmenities), hotel.id]
    );

    updated++;
    if (updated % 500 === 0) {
      console.log(`   Updated ${updated} hotels...`);
    }
  }

  console.log(`\n✅ Added amenities to ${updated} hotels`);

  // Sample result
  const [sample] = await connection.query(`
    SELECT id, hotel_name, JSON_LENGTH(amenities) as amenity_count, 
           JSON_EXTRACT(amenities, '$[0]') as first_amenity
    FROM hotels 
    LIMIT 5
  `);
  
  console.log('\n📊 Sample results:');
  console.table(sample);

  await connection.end();
  console.log('\n✅ Done!');
}

addAmenities().catch(console.error);
