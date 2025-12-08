/**
 * Generate Realistic Bookings for Top 30 Owners - Optimized Version
 * Generates 100 bookings per owner (60 hotels + 40 cars)
 * Flights are ADMIN ONLY and not included for owners
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
  console.log('\n🚀 GENERATING BOOKINGS FOR TOP 30 OWNERS\n');
  
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
    console.log('👥 Fetching top 30 owners...');
    const [owners] = await authConnection.query(
      `SELECT id, email FROM users WHERE role = 'owner' AND email LIKE 'owner%' 
       ORDER BY email ASC LIMIT 30`
    );
    console.log(`✓ Found ${owners.length} owners\n`);

    // Get random travellers
    console.log('🧑 Fetching travellers...');
    const [travellers] = await authConnection.query(
      `SELECT id FROM users WHERE role = 'traveller' ORDER BY RAND() LIMIT 1000`
    );
    console.log(`✓ Found ${travellers.length} travellers\n`);

    // Pre-fetch all listings for all owners
    console.log('📍 Pre-fetching all listings...');
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

    // Check which owners already have bookings
    console.log('✓ Checking existing bookings...');
    const [existingBookings] = await bookingConnection.query(
      `SELECT DISTINCT owner_id, COUNT(*) as count FROM bookings WHERE owner_id IN (${owners.map(() => '?').join(',')}) GROUP BY owner_id`,
      owners.map(o => o.id)
    );
    
    const ownersWithBookings = new Set(existingBookings.map(b => b.owner_id));
    const ownersToProcess = owners.filter(o => !ownersWithBookings.has(o.id));
    console.log(`✓ ${ownersWithBookings.size} owners already have bookings`);
    console.log(`✓ ${ownersToProcess.length} owners need bookings\n`);

    if (ownersToProcess.length === 0) {
      console.log('✅ All owners already have bookings!');
      process.exit(0);
    }

    // Generate bookings
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    const startDate = new Date('2025-11-01');
    const endDate = new Date('2026-02-28');
    let totalBookings = 0;
    let totalHotels = 0;
    let totalCars = 0;

    console.log(`📝 Generating 100 bookings per owner for ${ownersToProcess.length} owners...\n`);

    for (let ownerIdx = 0; ownerIdx < ownersToProcess.length; ownerIdx++) {
      const owner = ownersToProcess[ownerIdx];
      const listings = ownerListings[owner.id];
      const bookings = [];

      // Hotel bookings (60 per owner)
      const hotelCount = Math.min(60, listings.hotels.length * 12); // Spread across hotels
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
          booking_source: 'web',
          created_at: new Date(),
          updated_at: new Date()
        });
        totalHotels++;
      }

      // Car bookings (40 per owner)
      const carCount = Math.min(40, listings.cars.length * 8);
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
          booking_source: 'web',
          created_at: new Date(),
          updated_at: new Date()
        });
        totalCars++;
      }

      // Insert in batch
      const batchSize = 100;
      for (let i = 0; i < bookings.length; i += batchSize) {
        const batch = bookings.slice(i, i + batchSize);
        const values = batch.map(b => [
          b.id, b.traveller_id, b.owner_id, b.listing_id, b.listing_type,
          b.booking_date, b.travel_date, b.check_in_date || null, b.check_out_date || null,
          b.pickup_date || null, b.dropoff_date || null, b.total_amount, b.status,
          b.booking_source, b.created_at, b.updated_at
        ]);

        await bookingConnection.query(
          `INSERT INTO bookings (
            id, traveller_id, owner_id, listing_id, listing_type, booking_date, travel_date,
            check_in_date, check_out_date, pickup_date, dropoff_date, total_amount, status,
            booking_source, created_at, updated_at
          ) VALUES ?`,
          [values]
        );
      }

      totalBookings += bookings.length;
      process.stdout.write(`\r✓ ${ownerIdx + 1}/${ownersToProcess.length} owners processed (${totalBookings} total bookings)`);
    }

    console.log('\n\n✅ BOOKING GENERATION COMPLETE!\n');

    console.log('📊 Summary:');
    console.log(`   Total Bookings Generated: ${totalBookings}`);
    console.log(`   Hotel Bookings: ${totalHotels} (${Math.round((totalHotels / totalBookings) * 100)}%)`);
    console.log(`   Car Bookings: ${totalCars} (${Math.round((totalCars / totalBookings) * 100)}%)`);
    console.log(`   Owners Processed: ${ownersToProcess.length}\n`);

    // Verify
    const [allBookings] = await bookingConnection.query(
      `SELECT owner_id, listing_type, COUNT(*) as count FROM bookings 
       WHERE owner_id IN (${owners.map(() => '?').join(',')}) 
       GROUP BY owner_id, listing_type ORDER BY owner_id`,
      owners.map(o => o.id)
    );

    console.log('📊 Booking Distribution by Owner (first 5):');
    let currentOwner = null;
    let ownerBookingCount = 0;
    for (let i = 0; i < Math.min(10, allBookings.length); i++) {
      const booking = allBookings[i];
      const owner = owners.find(o => o.id === booking.owner_id);
      if (booking.owner_id !== currentOwner) {
        if (currentOwner && ownerBookingCount > 0) {
          const ownerEmail = owners.find(o => o.id === currentOwner)?.email;
          console.log(`   ${ownerEmail}: ${ownerBookingCount} bookings`);
        }
        currentOwner = booking.owner_id;
        ownerBookingCount = 0;
      }
      ownerBookingCount += booking.count;
    }
    if (currentOwner) {
      const ownerEmail = owners.find(o => o.id === currentOwner)?.email;
      console.log(`   ${ownerEmail}: ${ownerBookingCount} bookings`);
    }

    console.log('\n✅ READY FOR TESTING!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (bookingConnection) await bookingConnection.end();
    if (listingConnection) await listingConnection.end();
    if (authConnection) await authConnection.end();
  }
}

main();
