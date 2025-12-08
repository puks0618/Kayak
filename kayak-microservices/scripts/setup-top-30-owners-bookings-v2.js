const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Database connection configuration
const authDb = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
  database: 'kayak_auth'
};

const listingDb = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
  database: 'kayak_listings'
};

const bookingDb = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
  database: 'kayak_bookings'
};

// Helper function
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🚀 GENERATING PROPER BOOKINGS FOR TOP 30 OWNERS\n');
  console.log('Distribution: 60 hotels + 40 cars per owner (100 total per owner)\n');

  let authConnection, listingConnection, bookingConnection;

  try {
    // Connect to databases
    console.log('📡 Connecting to databases...');
    authConnection = await mysql.createConnection(authDb);
    listingConnection = await mysql.createConnection(listingDb);
    bookingConnection = await mysql.createConnection(bookingDb);
    console.log('✅ Connected\n');

    // Get top 30 owners
    console.log('👥 Fetching top 30 owners by email...');
    const [owners] = await authConnection.query(
      `SELECT id, email FROM users WHERE role = 'owner' ORDER BY email ASC LIMIT 30`
    );
    console.log(`✓ Found ${owners.length} owners\n`);

    // Get travellers
    console.log('🧑 Fetching travellers for booking creation...');
    const [travellers] = await authConnection.query(
      `SELECT id FROM users WHERE role = 'traveller' ORDER BY RAND() LIMIT 2000`
    );
    console.log(`✓ Found ${travellers.length} travellers\n`);

    // Clear existing hotel and car bookings for these 30 owners (keep flights)
    console.log('🗑️  Clearing existing hotel and car bookings for top 30 owners...');

    // First get booking IDs to delete
    const [bookingsToDelete] = await bookingConnection.query(
      `SELECT id FROM bookings WHERE listing_type IN ('hotel', 'car') 
       AND user_id IN (SELECT id FROM kayak_auth.users WHERE role = 'owner' ORDER BY email ASC LIMIT 30)`
    );

    if (bookingsToDelete.length > 0) {
      const bookingIds = bookingsToDelete.map(b => b.id);

      // Delete from billing table first (child table) if it exists
      try {
        if (bookingIds.length > 0) {
          // Delete in batches to avoid query size issues
          for (let i = 0; i < bookingIds.length; i += 500) {
            const batch = bookingIds.slice(i, i + 500);
            await bookingConnection.query(
              `DELETE FROM billing WHERE booking_id IN (${batch.map(() => '?').join(',')})`,
              batch
            );
          }
        }
      } catch (e) {
        // billing table might not exist, that's ok
        console.log('⚠️  billing table not found, continuing...');
      }

      // Then delete from bookings table
      if (bookingIds.length > 0) {
        for (let i = 0; i < bookingIds.length; i += 500) {
          const batch = bookingIds.slice(i, i + 500);
          await bookingConnection.query(
            `DELETE FROM bookings WHERE id IN (${batch.map(() => '?').join(',')})`,
            batch
          );
        }
      }
    }

    console.log('✓ Cleared\n');

    // Pre-fetch all listings for each owner
    console.log('📍 Pre-fetching all listings for each owner...');
    const ownerListings = {};

    for (const owner of owners) {
      const [hotels] = await listingConnection.query(
        `SELECT listing_id as id FROM hotels WHERE owner_id = ?`,
        [owner.id]
      );
      const [cars] = await listingConnection.query(
        `SELECT id FROM cars WHERE owner_id = ?`,
        [owner.id]
      );

      ownerListings[owner.id] = {
        hotels: hotels.map(h => h.id),
        cars: cars.map(c => c.id)
      };
    }

    console.log('✓ Listings loaded\n');

    // Generate bookings
    console.log('📝 Generating bookings for all 30 owners...\n');

    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    let totalBookings = 0;
    let totalHotels = 0;
    let totalCars = 0;

    for (let ownerIdx = 0; ownerIdx < owners.length; ownerIdx++) {
      const owner = owners[ownerIdx];
      const bookingsToInsert = [];

      const hotelListings = ownerListings[owner.id]?.hotels || [];
      const carListings = ownerListings[owner.id]?.cars || [];

      // Generate 60 hotel bookings
      for (let i = 0; i < 60; i++) {
        if (hotelListings.length === 0) break;

        const hotelId = randomElement(hotelListings);
        const traveller = randomElement(travellers);
        const bookingDate = new Date();
        const travelDateStart = new Date(2025, 10, 1); // Nov 1, 2025
        const travelDateEnd = new Date(2026, 1, 28); // Feb 28, 2026
        const travelDate = randomDate(travelDateStart, travelDateEnd);
        const checkInDate = travelDate;
        const checkOutDate = new Date(travelDate);
        checkOutDate.setDate(checkOutDate.getDate() + Math.floor(Math.random() * 4) + 2); // 2-5 nights
        const amount = Math.floor(Math.random() * 250) + 50; // $50-$300

        bookingsToInsert.push([
          uuidv4(),                    // id
          traveller.id,                // user_id
          hotelId,                     // listing_id
          'hotel',                     // listing_type
          randomElement(statuses),     // status
          bookingDate,                 // booking_date
          travelDate.toISOString().split('T')[0], // travel_date (YYYY-MM-DD)
          amount,                      // total_amount
          null,                        // payment_id
          bookingDate,                 // created_at
          bookingDate                  // updated_at
        ]);
        totalHotels++;
      }

      // Generate 40 car bookings
      for (let i = 0; i < 40; i++) {
        if (carListings.length === 0) break;

        const carId = randomElement(carListings);
        const traveller = randomElement(travellers);
        const bookingDate = new Date();
        const travelDateStart = new Date(2025, 10, 1);
        const travelDateEnd = new Date(2026, 1, 28);
        const pickupDate = randomDate(travelDateStart, travelDateEnd);
        const dropoffDate = new Date(pickupDate);
        dropoffDate.setDate(dropoffDate.getDate() + Math.floor(Math.random() * 9) + 1); // 1-10 days
        const amount = Math.floor(Math.random() * 200) + 30; // $30-$230

        bookingsToInsert.push([
          uuidv4(),                    // id
          traveller.id,                // user_id
          carId,                       // listing_id
          'car',                       // listing_type
          randomElement(statuses),     // status
          bookingDate,                 // booking_date
          pickupDate.toISOString().split('T')[0], // travel_date (using pickup date)
          amount,                      // total_amount
          null,                        // payment_id
          bookingDate,                 // created_at
          bookingDate                  // updated_at
        ]);
        totalCars++;
      }

      // Insert in batches
      if (bookingsToInsert.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < bookingsToInsert.length; i += batchSize) {
          const batch = bookingsToInsert.slice(i, i + batchSize);
          await bookingConnection.query(
            `INSERT INTO bookings (
              id, user_id, listing_id, listing_type, status, booking_date, travel_date,
              total_amount, payment_id, created_at, updated_at
            ) VALUES ?`,
            [batch]
          );
        }
      }

      totalBookings += bookingsToInsert.length;
      process.stdout.write(`\r✓ ${ownerIdx + 1}/${owners.length} owners processed`);
    }

    console.log('\n\n✅ BOOKING GENERATION COMPLETE!\n');

    console.log('📊 Summary:');
    console.log(`   Total Bookings: ${totalBookings}`);
    console.log(`   Hotel Bookings: ${totalHotels} (${Math.round((totalHotels / totalBookings) * 100)}%)`);
    console.log(`   Car Bookings: ${totalCars} (${Math.round((totalCars / totalBookings) * 100)}%)\n`);

    // Verify - show distribution for first 5 owners
    console.log('📊 Verification - Sample of Owner Booking Distribution:');
    for (let i = 0; i < Math.min(5, owners.length); i++) {
      const owner = owners[i];
      const [bookingStats] = await bookingConnection.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN listing_type='hotel' THEN 1 ELSE 0 END) as hotels,
          SUM(CASE WHEN listing_type='car' THEN 1 ELSE 0 END) as cars
        FROM bookings WHERE listing_id IN (
          SELECT COALESCE(listing_id, id) FROM kayak_listings.hotels 
          WHERE owner_id = ? 
          UNION ALL
          SELECT id FROM kayak_listings.cars WHERE owner_id = ?
        )`,
        [owner.id, owner.id]
      );

      const stat = bookingStats[0];
      console.log(
        `   Owner ${i + 1}: ${stat.total} total (${stat.hotels || 0} hotels, ${stat.cars || 0} cars)`
      );
    }

    console.log('\n✨ All bookings generated successfully!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (authConnection) await authConnection.end();
    if (listingConnection) await listingConnection.end();
    if (bookingConnection) await bookingConnection.end();
  }
}

main().catch(console.error);
