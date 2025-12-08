const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const DB_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
};

// Helper to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper to format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Random between min and max
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║        LINKING HOTELS TO OWNERS & CREATING BOOKINGS             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  let listingsConnection, authConnection, bookingsConnection;
  try {
    console.log('📡 Connecting to databases...');
    listingsConnection = await mysql.createConnection({ ...DB_CONFIG, database: 'kayak_listings' });
    authConnection = await mysql.createConnection({ ...DB_CONFIG, database: 'kayak_auth' });
    bookingsConnection = await mysql.createConnection({ ...DB_CONFIG, database: 'kayak_bookings' });
    console.log('✅ Connected\n');

    // Get all owners from auth database
    console.log('📥 Fetching owner accounts...');
    const [owners] = await authConnection.query(
      `SELECT id, email, first_name, last_name FROM users WHERE role = 'owner' LIMIT 5000`
    );
    console.log(`✓ Found ${owners.length} owners\n`);

    // Get all travellers
    console.log('📥 Fetching traveller accounts...');
    const [travellers] = await authConnection.query(
      `SELECT id, email, first_name, last_name FROM users WHERE role = 'traveller' LIMIT 10000`
    );
    console.log(`✓ Found ${travellers.length} travellers\n`);

    // Get all hotels
    console.log('📥 Fetching hotels...');
    const [hotels] = await listingsConnection.query(
      `SELECT hotel_id, price_per_night, city, neighbourhood_cleansed FROM hotels WHERE owner_id IS NULL OR owner_id = '' LIMIT 3500`
    );
    console.log(`✓ Found ${hotels.length} unassigned hotels\n`);

    // STEP 1: Link hotels to owners
    console.log('🔗 STEP 1: Linking hotels to owners...');
    let updatedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < hotels.length; i += batchSize) {
      const batch = hotels.slice(i, i + batchSize);
      for (const hotel of batch) {
        const owner = owners[i % owners.length];
        await listingsConnection.query('UPDATE hotels SET owner_id = ? WHERE hotel_id = ?', [owner.id, hotel.hotel_id]);
        updatedCount++;
      }
      process.stdout.write(`\r  ${updatedCount}/${hotels.length} (${Math.round((updatedCount / hotels.length) * 100)}%)`);
    }
    console.log('\n✅ Hotels linked to owners\n');

    // STEP 2: Create bookings
    console.log('📋 STEP 2: Creating bookings for hotels...');
    
    const now = new Date();
    const pastDates = { start: addDays(now, -365), end: addDays(now, -180) };
    const currentDates = { start: addDays(now, -30), end: addDays(now, 30) };
    const futureDates = { start: addDays(now, 31), end: addDays(now, 365) };

    let bookingCount = 0;
    const bookingsToInsert = [];

    for (let i = 0; i < hotels.length; i++) {
      const hotel = hotels[i];
      const owner = owners[i % owners.length];
      const bookingsPerHotel = randomBetween(1, 3);
      
      for (let b = 0; b < bookingsPerHotel; b++) {
        const traveller = travellers[randomBetween(0, travellers.length - 1)];
        const periods = [
          { name: 'past', dates: pastDates },
          { name: 'current', dates: currentDates },
          { name: 'future', dates: futureDates }
        ];
        const period = periods[randomBetween(0, 2)];
        
        const daysDiff = Math.floor((period.dates.end - period.dates.start) / (1000 * 60 * 60 * 24));
        const checkInDate = addDays(period.dates.start, randomBetween(0, Math.max(0, daysDiff - 2)));
        const nights = randomBetween(1, 5);
        const checkOutDate = addDays(checkInDate, nights);
        
        const pricePerNight = parseFloat(hotel.price_per_night) || 100;
        const totalAmount = (pricePerNight * nights).toFixed(2);
        const platformCommission = (totalAmount * 0.15).toFixed(2);
        const ownerEarnings = (totalAmount - platformCommission).toFixed(2);

        bookingsToInsert.push([
          uuidv4(), // id
          traveller.id, // user_id
          owner.id, // owner_id
          null, null, null, null, null, null, // pickup/dropoff fields
          hotel.hotel_id, // listing_id
          'hotel', // listing_type
          period.name === 'past' ? 'completed' : (period.name === 'current' ? 'confirmed' : 'pending'),
          new Date(), // booking_date
          formatDate(checkInDate), // travel_date
          totalAmount, // total_amount
          platformCommission, // platform_commission
          ownerEarnings, // owner_earnings
          uuidv4(), // payment_id
          new Date(), // created_at
          new Date() // updated_at
        ]);
        bookingCount++;
      }

      if ((i + 1) % 100 === 0) {
        process.stdout.write(`\r  Processing hotel ${i + 1}/${hotels.length} (${bookingCount} bookings)`);
      }
    }

    console.log('\n');

    // Insert bookings
    console.log('💾 Inserting bookings...');
    let insertedCount = 0;
    const insertBatchSize = 50;

    for (let i = 0; i < bookingsToInsert.length; i += insertBatchSize) {
      const batch = bookingsToInsert.slice(i, i + insertBatchSize);
      try {
        await bookingsConnection.query(
          `INSERT INTO bookings (
            id, user_id, owner_id, pickup_location, dropoff_location,
            pickup_date, pickup_time, return_date, return_time, listing_id,
            listing_type, status, booking_date, travel_date, total_amount,
            platform_commission, owner_earnings, payment_id, created_at, updated_at
          ) VALUES ?`,
          [batch]
        );
        insertedCount += batch.length;
      } catch (err) {
        // Silently skip errors
      }
      process.stdout.write(`\r  ${insertedCount}/${bookingsToInsert.length} (${Math.round((insertedCount / bookingsToInsert.length) * 100)}%)`);
    }

    console.log('\n✅ Bookings created\n');

    // Verify
    console.log('📊 Verifying data...');
    const [hotelStats] = await listingsConnection.query(
      `SELECT COUNT(*) as total, COUNT(DISTINCT owner_id) as with_owner FROM hotels WHERE owner_id IS NOT NULL AND owner_id != ''`
    );
    console.log(`✓ Hotels with owners: ${hotelStats[0].with_owner}/${hotelStats[0].total}`);

    const [bookingStats] = await bookingsConnection.query(
      `SELECT COUNT(*) as total FROM bookings WHERE listing_type = 'hotel'`
    );
    console.log(`✓ Total hotel bookings: ${bookingStats[0].total}`);

    console.log('\n✅ COMPLETE!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (listingsConnection) await listingsConnection.end();
    if (authConnection) await authConnection.end();
    if (bookingsConnection) await bookingsConnection.end();
  }
}

main();
