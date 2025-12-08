const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const DB_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
};

// Booking statuses and their distribution
const STATUS_DIST = {
  pending: 0.15,    // 15%
  confirmed: 0.50,  // 50%
  completed: 0.30,  // 30%
  cancelled: 0.05   // 5%
};

// Listing type distribution
const TYPE_DIST = {
  flight: 0.70,     // 70%
  hotel: 0.25,      // 25%
  car: 0.05         // 5%
};

const BOOKING_RANGE = {
  start_date: new Date('2025-11-01'),
  end_date: new Date('2026-02-28'),
};

const PRICE_RANGE = {
  min: 100,
  max: 2100,
};

const COMMISSION_RATE = 0.15; // 15% commission

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomStatus() {
  const rand = Math.random();
  let sum = 0;
  for (const [status, prob] of Object.entries(STATUS_DIST)) {
    sum += prob;
    if (rand <= sum) return status;
  }
  return 'pending';
}

function getRandomType() {
  const rand = Math.random();
  let sum = 0;
  for (const [type, prob] of Object.entries(TYPE_DIST)) {
    sum += prob;
    if (rand <= sum) return type;
  }
  return 'flight';
}

function getRandomAmount() {
  return Math.floor(Math.random() * (PRICE_RANGE.max - PRICE_RANGE.min + 1)) + PRICE_RANGE.min;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function main() {
  console.log('\n🚀 REAL BOOKING DISTRIBUTION\n');
  
  let connection;
  try {
    console.log('📡 Connecting to MySQL...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected\n');

    // Get real listing IDs
    console.log('📥 Fetching real listing IDs...');
    
    const [flights] = await connection.query(
      'SELECT id FROM kayak_listings.flights LIMIT 500'
    );
    console.log(`  ✓ ${flights.length} flights found`);

    // Hotels table has corrupted data, so we'll use it less frequently
    const [hotels] = await connection.query(
      'SELECT id FROM kayak_listings.flights LIMIT 100'  // Use flights as fallback for hotels
    );
    console.log(`  ✓ ${hotels.length} hotel-fallbacks found`);

    const [cars] = await connection.query(
      'SELECT id FROM kayak_listings.cars LIMIT 50'
    );
    console.log(`  ✓ ${cars.length} cars found\n`);

    // Get all owners
    console.log('📥 Fetching owner accounts...');
    const [owners] = await connection.query(
      'SELECT id FROM kayak_auth.users WHERE role = "owner" LIMIT 30'
    );
    console.log(`  ✓ ${owners.length} owners found\n`);

    // Get all travellers
    console.log('📥 Fetching traveller accounts...');
    const [travellers] = await connection.query(
      'SELECT id FROM kayak_auth.users WHERE role = "traveller" LIMIT 500'
    );
    console.log(`  ✓ ${travellers.length} travellers found\n`);

    if (flights.length === 0 || hotels.length === 0 || cars.length === 0 || owners.length === 0 || travellers.length === 0) {
      console.error('❌ Not enough listings or users in database');
      return;
    }

    // Clear old bookings for these owners
    console.log('🗑️  Clearing old bookings for top 30 owners...');
    const ownerIds = owners.map(o => o.id);
    await connection.query(
      'DELETE FROM kayak_bookings.bookings WHERE owner_id IN (?)',
      [ownerIds]
    );
    console.log('✓ Cleared\n');

    // Create bookings
    console.log(`📊 Creating 250 bookings per owner (${owners.length * 250} total)...\n`);

    let totalCreated = 0;
    let statsCounts = {
      flight: { pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
      hotel: { pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
      car: { pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
    };

    for (let ownerIdx = 0; ownerIdx < owners.length; ownerIdx++) {
      const owner = owners[ownerIdx];
      const bookingsToCreate = [];

      for (let i = 0; i < 250; i++) {
        const type = getRandomType();
        const status = getRandomStatus();
        const amount = getRandomAmount();
        const commission = Math.round(amount * COMMISSION_RATE * 100) / 100;
        const ownerEarnings = amount - commission;

        let listingId;
        if (type === 'flight' && flights.length > 0) {
          listingId = flights[Math.floor(Math.random() * flights.length)].id;
        } else if (type === 'hotel' && hotels.length > 0) {
          listingId = hotels[Math.floor(Math.random() * hotels.length)].id;  // Using flight ID as fallback
        } else if (type === 'car' && cars.length > 0) {
          listingId = cars[Math.floor(Math.random() * cars.length)].id;
        } else {
          listingId = uuidv4();
        }

        const travelerId = travellers[Math.floor(Math.random() * travellers.length)].id;
        const bookingDate = formatDate(new Date());
        const travelDate = formatDate(getRandomDate(BOOKING_RANGE.start_date, BOOKING_RANGE.end_date));

        bookingsToCreate.push([
          uuidv4(),
          owner.id,
          travelerId,
          listingId,
          type,
          status,
          bookingDate,
          travelDate,
          amount,
          commission,
          ownerEarnings,
          new Date(),
          new Date(),
        ]);

        statsCounts[type][status]++;
      }

      // Insert bookings for this owner
      if (bookingsToCreate.length > 0) {
        await connection.query(
          `INSERT INTO kayak_bookings.bookings 
           (id, owner_id, user_id, listing_id, listing_type, status, booking_date, travel_date, total_amount, platform_commission, owner_earnings, created_at, updated_at)
           VALUES ?`,
          [bookingsToCreate]
        );
        totalCreated += bookingsToCreate.length;
      }

      process.stdout.write(`\r  Owner ${ownerIdx + 1}/${owners.length} (${totalCreated} bookings created)`);
    }

    console.log('\n\n✅ Booking creation complete!\n');

    // Show statistics
    console.log('📊 Booking Distribution Statistics:\n');
    console.log('By Type:');
    for (const type of Object.keys(TYPE_DIST)) {
      const count = Object.values(statsCounts[type]).reduce((a, b) => a + b, 0);
      const pct = ((count / totalCreated) * 100).toFixed(1);
      console.log(`  ${type.padEnd(8)}: ${count.toString().padStart(5)} (${pct}%)`);
    }

    console.log('\nBy Status:');
    for (const status of Object.keys(STATUS_DIST)) {
      let count = 0;
      for (const type of Object.keys(statsCounts)) {
        count += statsCounts[type][status];
      }
      const pct = ((count / totalCreated) * 100).toFixed(1);
      console.log(`  ${status.padEnd(10)}: ${count.toString().padStart(5)} (${pct}%)`);
    }

    console.log('\nBy Type and Status:');
    for (const type of Object.keys(statsCounts)) {
      console.log(`\n  ${type}:`);
      for (const status of Object.keys(statsCounts[type])) {
        const count = statsCounts[type][status];
        console.log(`    ${status.padEnd(10)}: ${count}`);
      }
    }

    // Verify
    const [verifyResult] = await connection.query(
      'SELECT COUNT(*) as total FROM kayak_bookings.bookings'
    );
    const [ownerBookingCounts] = await connection.query(
      'SELECT owner_id, COUNT(*) as count FROM kayak_bookings.bookings GROUP BY owner_id ORDER BY count DESC LIMIT 5'
    );

    console.log('\n✅ Verification:');
    console.log(`  Total bookings in system: ${verifyResult[0].total}`);
    console.log('\n  Top owners by booking count:');
    ownerBookingCounts.forEach((row, idx) => {
      console.log(`    ${idx + 1}. ${row.owner_id}: ${row.count} bookings`);
    });

    console.log('\n✅ DONE!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) await connection.end();
  }
}

main();
