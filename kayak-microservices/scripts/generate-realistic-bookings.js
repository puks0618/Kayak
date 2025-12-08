/**
 * Generate Realistic Bookings for Top 30 Owners
 * 
 * Distribution (Owners only see Hotels and Cars):
 * - Hotels: 60% (~60 bookings per owner)
 * - Cars: 40% (~40 bookings per owner)
 * 
 * NOTE: Flights are admin-only and not included in owner bookings
 * 
 * Each owner gets:
 * - ~60 hotel bookings  
 * - ~40 car bookings
 * - TOTAL: ~100 bookings per owner
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

// Generate random date between start and end
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate random booking amount
function randomAmount(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Get random element from array
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('\n🚀 GENERATING REALISTIC BOOKINGS FOR TOP 30 OWNERS\n');
  
  let bookingConnection;
  let listingConnection;
  let authConnection;
  
  try {
    // Connect to databases
    console.log('📡 Connecting to databases...');
    bookingConnection = await mysql.createConnection(DB_CONFIG);
    listingConnection = await mysql.createConnection(LISTING_CONFIG);
    authConnection = await mysql.createConnection(AUTH_CONFIG);
    console.log('✅ Connected\n');

    // Get top 30 owners
    console.log('👥 Fetching top 30 owners...');
    const [owners] = await authConnection.query(
      `SELECT id, email FROM users WHERE role = 'owner' AND email LIKE 'owner%' 
       ORDER BY email ASC LIMIT 30`
    );
    console.log(`✓ Found ${owners.length} owners\n`);

    // Get travellers for creating bookings
    console.log('🧑 Fetching random travellers...');
    const [travellers] = await authConnection.query(
      `SELECT id FROM users WHERE role = 'traveller' ORDER BY RAND() LIMIT 500`
    );
    console.log(`✓ Found ${travellers.length} travellers\n`);

    // Get listings for each owner
    console.log('📍 Fetching listings...');
    
    const ownerListings = {};
    
    for (const owner of owners) {
      const [hotels] = await listingConnection.query(
        `SELECT listing_id as id FROM hotels WHERE owner_id = ? LIMIT 5`,
        [owner.id]
      );
      const [cars] = await listingConnection.query(
        `SELECT id FROM cars WHERE owner_id = ? LIMIT 5`,
        [owner.id]
      );

      ownerListings[owner.id] = {
        email: owner.email,
        hotels: hotels.map(h => h.id),
        cars: cars.map(c => c.id)
      };
    }
    console.log(`✓ Listings loaded for ${owners.length} owners\n`);

    // Booking statuses and sources
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    const bookingSource = 'web';

    // Generate bookings
    console.log('📝 Generating bookings...\n');
    const startDate = new Date('2025-11-01');
    const endDate = new Date('2026-02-28');
    let totalBookings = 0;
    let totalHotels = 0;
    let totalCars = 0;

    for (const owner of owners) {
      const listings = ownerListings[owner.id];
      const bookings = [];

      // Hotel bookings (60% - ~60 per owner)
      const hotelCount = 60;
      for (let i = 0; i < hotelCount; i++) {
        if (listings.hotels.length === 0) continue;
        
        const traveller = randomElement(travellers);
        const hotel = randomElement(listings.hotels);
        const amount = randomAmount(100, 400);
        const checkIn = randomDate(startDate, endDate);
        const checkOut = new Date(checkIn.getTime() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000);

        bookings.push({
          id: uuidv4(),
          traveller_id: traveller.id,
          owner_id: owner.id,
          listing_id: hotel,
          listing_type: 'hotel',
          booking_date: new Date(),
          travel_date: checkIn,
          check_in_date: checkIn,
          check_out_date: checkOut,
          total_amount: amount,
          status: randomElement(statuses),
          booking_source: bookingSource,
          created_at: new Date(),
          updated_at: new Date()
        });
        totalHotels++;
      }

      // Car bookings (40% - ~40 per owner)
      const carCount = 40;
      for (let i = 0; i < carCount; i++) {
        if (listings.cars.length === 0) continue;
        
        const traveller = randomElement(travellers);
        const car = randomElement(listings.cars);
        const amount = randomAmount(50, 200);
        const pickupDate = randomDate(startDate, endDate);
        const dropoffDate = new Date(pickupDate.getTime() + (Math.floor(Math.random() * 14) + 1) * 24 * 60 * 60 * 1000);

        bookings.push({
          id: uuidv4(),
          traveller_id: traveller.id,
          owner_id: owner.id,
          listing_id: car,
          listing_type: 'car',
          booking_date: new Date(),
          travel_date: pickupDate,
          pickup_date: pickupDate,
          dropoff_date: dropoffDate,
          total_amount: amount,
          status: randomElement(statuses),
          booking_source: bookingSource,
          created_at: new Date(),
          updated_at: new Date()
        });
        totalCars++;
      }

      // Insert bookings for this owner in batches
      const batchSize = 100;
      for (let i = 0; i < bookings.length; i += batchSize) {
        const batch = bookings.slice(i, i + batchSize);
        const values = batch.map(b => [
          b.id,
          b.traveller_id,
          b.owner_id,
          b.listing_id,
          b.listing_type,
          b.booking_date,
          b.travel_date,
          b.check_in_date || null,
          b.check_out_date || null,
          b.pickup_date || null,
          b.dropoff_date || null,
          b.total_amount,
          b.status,
          b.booking_source,
          b.created_at,
          b.updated_at
        ]);

        await bookingConnection.query(
          `INSERT INTO bookings (
            id, traveller_id, owner_id, listing_id, listing_type,
            booking_date, travel_date, check_in_date, check_out_date,
            pickup_date, dropoff_date, total_amount, status, booking_source,
            created_at, updated_at
          ) VALUES ?`,
          [values]
        );
      }

      totalBookings += bookings.length;
      process.stdout.write(`\r✓ Generated ${totalBookings} bookings (${owners.indexOf(owner) + 1}/${owners.length} owners)`);
    }

    console.log('\n✅ BOOKING GENERATION COMPLETE!\n');

    // Verify totals
    const [allBookings] = await bookingConnection.query(
      `SELECT listing_type, COUNT(*) as count FROM bookings GROUP BY listing_type`
    );

    console.log('📊 Final Booking Summary:');
    console.log(`   Total Bookings: ${totalBookings}`);
    console.log(`   Hotel Bookings: ${totalHotels} (${Math.round((totalHotels / totalBookings) * 100)}%)`);
    console.log(`   Car Bookings: ${totalCars} (${Math.round((totalCars / totalBookings) * 100)}%)`);
    console.log(`   (Flights are admin-only and not included in owner bookings)\n`);

    // Show distribution per owner
    const [ownerCounts] = await bookingConnection.query(
      `SELECT owner_id, COUNT(*) as count FROM bookings GROUP BY owner_id ORDER BY owner_id LIMIT 5`
    );
    
    console.log('📊 Sample Owner Booking Counts:');
    ownerCounts.forEach(row => {
      console.log(`   Owner ${owners.find(o => o.id === row.owner_id)?.email}: ${row.count} bookings`);
    });

    console.log('\n✅ READY TO TEST!\n');

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
