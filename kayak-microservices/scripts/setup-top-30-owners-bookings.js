/**
 * Generate Proper Bookings for Top 30 Owners
 * Distribution: 60 hotels + 40 cars per owner (100 total)
 * Flights are admin-only and should NOT appear for owners
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const DB_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
  database: 'kayak_bookings'
};

const LISTING_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
  database: 'kayak_listings'
};

const AUTH_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
  database: 'kayak_auth'
};

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomAmount(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('\n🚀 GENERATING PROPER BOOKINGS FOR TOP 30 OWNERS\n');
  console.log('Distribution: 60 hotels + 40 cars per owner (100 total per owner)\n');
  
  let bookingConnection;
  let listingConnection;
  let authConnection;
  
  try {
    console.log('📡 Connecting to databases...');
    bookingConnection = await mysql.createConnection(DB_CONFIG);
    listingConnection = await mysql.createConnection(LISTING_CONFIG);
    authConnection = await mysql.createConnection(AUTH_CONFIG);
    console.log('✅ Connected\n');

    // Get top 30 owners
    console.log('👥 Fetching top 30 owners by email...');
    const [owners] = await authConnection.query(
      `SELECT id, email FROM users WHERE role = 'owner' AND email LIKE 'owner%' 
       ORDER BY email ASC LIMIT 30`
    );
    console.log(`✓ Found ${owners.length} owners\n`);

    // Get random travellers
    console.log('🧑 Fetching travellers for booking creation...');
    const [travellers] = await authConnection.query(
      `SELECT id FROM users WHERE role = 'traveller' ORDER BY RAND() LIMIT 2000`
    );
    console.log(`✓ Found ${travellers.length} travellers\n`);

    // Clear existing hotel and car bookings for these 30 owners (keep flights)
    console.log('🗑️  Clearing existing hotel and car bookings for top 30 owners...');
    
    // First get booking IDs to delete
    const [bookingsToDelete] = await bookingConnection.query(
      `SELECT id FROM bookings WHERE owner_id IN (${owners.map(() => '?').join(',')}) AND listing_type IN ('hotel', 'car')`,
      owners.map(o => o.id)
    );
    
    if (bookingsToDelete.length > 0) {
      const bookingIds = bookingsToDelete.map(b => b.id);
      
      // Delete from billing table first (child table)
      if (bookingIds.length > 0) {
        await bookingConnection.query(
          `DELETE FROM billing WHERE booking_id IN (${bookingIds.map(() => '?').join(',')})`,
          bookingIds
        );
      }
      
      // Then delete from bookings table
      await bookingConnection.query(
        `DELETE FROM bookings WHERE id IN (${bookingIds.map(() => '?').join(',')})`,
        bookingIds
      );
    }
    
    console.log('✓ Cleared\n');

    // Pre-fetch all listings for all owners
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
        email: owner.email,
        hotels: hotels.map(h => h.id),
        cars: cars.map(c => c.id)
      };
    }
    console.log(`✓ Listings loaded\n`);

    // Generate bookings
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    const startDate = new Date('2025-11-01');
    const endDate = new Date('2026-02-28');
    let totalBookings = 0;
    let totalHotels = 0;
    let totalCars = 0;

    console.log('📝 Generating bookings for all 30 owners...\n');

    for (let ownerIdx = 0; ownerIdx < owners.length; ownerIdx++) {
      const owner = owners[ownerIdx];
      const listings = ownerListings[owner.id];
      const bookings = [];

      // Skip if no listings
      if (listings.hotels.length === 0 && listings.cars.length === 0) {
        process.stdout.write(`\r⚠️  ${ownerIdx + 1}/${owners.length} - ${owner.email}: No listings, skipping`);
        continue;
      }

      // Hotel bookings (60 per owner)
      const hotelCount = 60;
      for (let i = 0; i < hotelCount; i++) {
        if (listings.hotels.length === 0) continue;
        
        const traveller = randomElement(travellers);
        const hotel = randomElement(listings.hotels);
        const amount = randomAmount(100, 400);
        const checkIn = randomDate(startDate, endDate);
        const checkOut = new Date(checkIn.getTime() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000);

        bookings.push([
          uuidv4(),                    // id
          traveller.id,                 // traveller_id
          owner.id,                     // owner_id
          hotel,                        // listing_id
          'hotel',                      // listing_type
          new Date(),                   // booking_date
          checkIn,                      // travel_date
          checkIn,                      // check_in_date
          checkOut,                     // check_out_date
          null,                         // pickup_date
          null,                         // dropoff_date
          amount,                       // total_amount
          randomElement(statuses),      // status
          'web',                        // booking_source
          new Date(),                   // created_at
          new Date()                    // updated_at
        ]);
        totalHotels++;
      }

      // Car bookings (40 per owner)
      const carCount = 40;
      for (let i = 0; i < carCount; i++) {
        if (listings.cars.length === 0) continue;
        
        const traveller = randomElement(travellers);
        const car = randomElement(listings.cars);
        const amount = randomAmount(50, 200);
        const pickupDate = randomDate(startDate, endDate);
        const dropoffDate = new Date(pickupDate.getTime() + (Math.floor(Math.random() * 14) + 1) * 24 * 60 * 60 * 1000);

        bookings.push([
          uuidv4(),                    // id
          traveller.id,                 // traveller_id
          owner.id,                     // owner_id
          car,                          // listing_id
          'car',                        // listing_type
          new Date(),                   // booking_date
          pickupDate,                   // travel_date
          null,                         // check_in_date
          null,                         // check_out_date
          pickupDate,                   // pickup_date
          dropoffDate,                  // dropoff_date
          amount,                       // total_amount
          randomElement(statuses),      // status
          'web',                        // booking_source
          new Date(),                   // created_at
          new Date()                    // updated_at
        ]);
        totalCars++;
      }

      // Insert in batches
      if (bookings.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < bookings.length; i += batchSize) {
          const batch = bookings.slice(i, i + batchSize);
          await bookingConnection.query(
            `INSERT INTO bookings (
              id, traveller_id, owner_id, listing_id, listing_type, booking_date, travel_date,
              check_in_date, check_out_date, pickup_date, dropoff_date, total_amount, status,
              booking_source, created_at, updated_at
            ) VALUES ?`,
            [batch]
          );
        }
      }

      totalBookings += bookings.length;
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
          SUM(CASE WHEN listing_type='car' THEN 1 ELSE 0 END) as cars,
          SUM(CASE WHEN listing_type='flight' THEN 1 ELSE 0 END) as flights
        FROM bookings WHERE owner_id = ?`,
        [owner.id]
      );
      const stats = bookingStats[0];
      console.log(`   ${owner.email}:`);
      console.log(`     - Total: ${stats.total}, Hotels: ${stats.hotels || 0}, Cars: ${stats.cars || 0}, Flights: ${stats.flights || 0}`);
    }

    console.log('\n✅ ALL BOOKINGS READY FOR TESTING!\n');
    console.log('🔑 Test Credentials:');
    console.log('   Email: owner00001@test.com - owner00030@test.com');
    console.log('   Password: Password123\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (bookingConnection) await bookingConnection.end();
    if (listingConnection) await listingConnection.end();
    if (authConnection) await authConnection.end();
  }
}

main();
