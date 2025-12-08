const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const DB_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
};

const BOOKING_TYPE_RATIO = {
  flight: 0.70,
  hotel: 0.25,
  car: 0.05
};

const STATUS_DISTRIBUTION = {
  pending: 0.15,
  confirmed: 0.50,
  completed: 0.30,
  cancelled: 0.05
};

async function getOwners(connection) {
  console.log('📥 Fetching first 30 owners...');
  const [owners] = await connection.query(`
    SELECT id, email FROM kayak_auth.users 
    WHERE email LIKE 'owner00%' AND email LIKE '%@test.com'
    ORDER BY email ASC
    LIMIT 30
  `);
  return owners;
}

async function getTravelers(connection) {
  console.log('📥 Fetching travelers...');
  const [travelers] = await connection.query(`
    SELECT id, email FROM kayak_auth.users 
    WHERE email LIKE 'traveller%' AND email LIKE '%@test.com'
    ORDER BY RAND()
    LIMIT 500
  `);
  return travelers;
}

async function getFlights(connection, count) {
  const [flights] = await connection.query(`
    SELECT id FROM kayak_listings.flights 
    ORDER BY RAND()
    LIMIT ?
  `, [count]);
  return flights.map(f => ({ listing_id: f.id, listing_type: 'flight' }));
}

async function getHotels(connection, count) {
  const [hotels] = await connection.query(`
    SELECT CONCAT('hotel-', hotel_id) as listing_id FROM kayak_listings.hotels 
    ORDER BY RAND()
    LIMIT ?
  `, [count]);
  return hotels.map(h => ({ listing_id: h.listing_id, listing_type: 'hotel' }));
}

async function getCars(connection, count) {
  const [cars] = await connection.query(`
    SELECT id FROM kayak_listings.cars 
    ORDER BY RAND()
    LIMIT ?
  `, [count]);
  return cars.map(c => ({ listing_id: c.id, listing_type: 'car' }));
}

function generateRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateBookingData(listing, traveler, owner, bookingNumber) {
  const bookingDate = generateRandomDate(new Date('2025-11-01'), new Date('2025-12-08'));
  let travelDate, pickupDate, returnDate;
  
  if (listing.listing_type === 'flight') {
    travelDate = generateRandomDate(bookingDate, new Date('2026-02-28'));
    pickupDate = travelDate;
    returnDate = null;
  } else if (listing.listing_type === 'hotel') {
    travelDate = generateRandomDate(bookingDate, new Date('2026-02-28'));
    pickupDate = travelDate;
    const stayDays = Math.floor(Math.random() * 14) + 1;
    returnDate = new Date(travelDate);
    returnDate.setDate(returnDate.getDate() + stayDays);
  } else {
    travelDate = generateRandomDate(bookingDate, new Date('2026-02-28'));
    pickupDate = travelDate;
    const rentalDays = Math.floor(Math.random() * 10) + 1;
    returnDate = new Date(travelDate);
    returnDate.setDate(returnDate.getDate() + rentalDays);
  }

  const rand = Math.random();
  let status = 'pending';
  let cumulativeProb = 0;
  for (const [s, prob] of Object.entries(STATUS_DISTRIBUTION)) {
    cumulativeProb += prob;
    if (rand < cumulativeProb) {
      status = s;
      break;
    }
  }

  const baseAmount = Math.floor(Math.random() * 2000) + 100;
  const platformCommission = Math.round(baseAmount * 0.15 * 100) / 100;
  const ownerEarnings = Math.round((baseAmount - platformCommission) * 100) / 100;

  return {
    id: uuidv4(),
    user_id: traveler.id,
    owner_id: owner.id,
    pickup_location: ['NYC', 'LAX', 'ORD', 'DFW', 'SFO', 'MIA', 'BOS', 'ATL'][Math.floor(Math.random() * 8)],
    dropoff_location: ['NYC', 'LAX', 'ORD', 'DFW', 'SFO', 'MIA', 'BOS', 'ATL'][Math.floor(Math.random() * 8)],
    pickup_date: pickupDate,
    pickup_time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    return_date: returnDate,
    return_time: returnDate ? `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null,
    listing_id: listing.listing_id.substring(0, 36),
    listing_type: listing.listing_type,
    status: status,
    booking_date: bookingDate,
    travel_date: travelDate,
    total_amount: baseAmount,
    platform_commission: platformCommission,
    owner_earnings: ownerEarnings,
    payment_id: uuidv4(),
    created_at: bookingDate,
    updated_at: new Date()
  };
}

async function clearExistingBookings(connection) {
  console.log('🗑️  Clearing existing test bookings...');
  const [owners] = await connection.query(`
    SELECT id FROM kayak_auth.users 
    WHERE email LIKE 'owner00%' AND email LIKE '%@test.com'
  `);
  
  const ownerIds = owners.map(o => o.id);
  if (ownerIds.length > 0) {
    const placeholders = ownerIds.map(() => '?').join(',');
    await connection.query(
      `DELETE FROM kayak_bookings.bookings WHERE owner_id IN (${placeholders})`,
      ownerIds
    );
    console.log(`✓ Deleted bookings from ${ownerIds.length} owners\n`);
  }
}

async function main() {
  console.log('\n🚀 BOOKING DISTRIBUTION SYSTEM\n');
  console.log('📊 Booking Distribution Ratio:');
  console.log(`   Flights: ${(BOOKING_TYPE_RATIO.flight * 100).toFixed(0)}%`);
  console.log(`   Hotels:  ${(BOOKING_TYPE_RATIO.hotel * 100).toFixed(0)}%`);
  console.log(`   Cars:    ${(BOOKING_TYPE_RATIO.car * 100).toFixed(0)}%\n`);
  
  console.log('📊 Status Distribution:');
  Object.entries(STATUS_DISTRIBUTION).forEach(([status, prob]) => {
    console.log(`   ${status}: ${(prob * 100).toFixed(0)}%`);
  });
  console.log();

  let connection;
  try {
    console.log('📡 Connecting to databases...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected\n');

    await clearExistingBookings(connection);

    const owners = await getOwners(connection);
    console.log(`✓ Loaded ${owners.length} owners\n`);

    const travelers = await getTravelers(connection);
    console.log(`✓ Loaded ${travelers.length} travelers\n`);

    const bookingsPerOwner = 250;
    const totalBookings = owners.length * bookingsPerOwner;
    
    const flightCount = Math.floor(totalBookings * BOOKING_TYPE_RATIO.flight);
    const hotelCount = Math.floor(totalBookings * BOOKING_TYPE_RATIO.hotel);
    const carCount = totalBookings - flightCount - hotelCount;

    console.log(`📊 Creating ${totalBookings} bookings (${bookingsPerOwner} per owner):`);
    console.log(`   Flights: ${flightCount}`);
    console.log(`   Hotels: ${hotelCount}`);
    console.log(`   Cars: ${carCount}\n`);

    console.log('📥 Fetching listings...');
    const flights = await getFlights(connection, flightCount);
    const hotels = await getHotels(connection, hotelCount);
    const cars = await getCars(connection, carCount);
    console.log(`✓ Flights: ${flights.length}, Hotels: ${hotels.length}, Cars: ${cars.length}\n`);

    console.log(`📝 Creating ${totalBookings} bookings...\n`);
    let allListings = [...flights, ...hotels, ...cars];
    allListings = allListings.sort(() => 0.5 - Math.random());

    const batchSize = 500;
    let insertedCount = 0;

    for (let ownerIdx = 0; ownerIdx < owners.length; ownerIdx++) {
      const owner = owners[ownerIdx];
      const startIdx = ownerIdx * bookingsPerOwner;
      const endIdx = startIdx + bookingsPerOwner;

      for (let i = startIdx; i < endIdx; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, endIdx);
        const values = [];

        for (let j = i; j < batchEnd; j++) {
          const listingIdx = j % allListings.length;
          const listing = allListings[listingIdx];
          const travelerIdx = Math.floor(Math.random() * travelers.length);
          const traveler = travelers[travelerIdx];

          const booking = generateBookingData(listing, traveler, owner, j);
          values.push([
            booking.id,
            booking.user_id,
            booking.owner_id,
            booking.pickup_location,
            booking.dropoff_location,
            booking.pickup_date,
            booking.pickup_time,
            booking.return_date,
            booking.return_time,
            booking.listing_id,
            booking.listing_type,
            booking.status,
            booking.booking_date,
            booking.travel_date,
            booking.total_amount,
            booking.platform_commission,
            booking.owner_earnings,
            booking.payment_id,
            booking.created_at,
            booking.updated_at
          ]);
        }

        await connection.query(
          `INSERT INTO kayak_bookings.bookings (
            id, user_id, owner_id, pickup_location, dropoff_location,
            pickup_date, pickup_time, return_date, return_time,
            listing_id, listing_type, status, booking_date, travel_date,
            total_amount, platform_commission, owner_earnings, payment_id,
            created_at, updated_at
          ) VALUES ?`,
          [values]
        );

        insertedCount += values.length;
        process.stdout.write(`\r  ${insertedCount}/${totalBookings} (${Math.round((insertedCount / totalBookings) * 100)}%)`);
      }
    }

    console.log('\n✅ All bookings created\n');

    console.log('📊 Final Booking Summary:');
    const [summary] = await connection.query(`
      SELECT listing_type, status, COUNT(*) as count 
      FROM kayak_bookings.bookings 
      GROUP BY listing_type, status 
      ORDER BY listing_type, status
    `);
    
    summary.forEach(row => {
      console.log(`   ${row.listing_type.padEnd(8)} ${row.status.padEnd(12)} ${row.count}`);
    });

    // Get list of first 10 owners
    const [ownerList] = await connection.query(`
      SELECT id, email FROM kayak_auth.users 
      WHERE email LIKE 'owner00%' AND email LIKE '%@test.com'
      ORDER BY email ASC
      LIMIT 10
    `);
    
    const ownerIds = ownerList.map(o => o.id);

    console.log('\n📊 Bookings per Owner (Sample - First 10):');
    const [ownerStats] = await connection.query(`
      SELECT owner_id, 
             COUNT(*) as total_bookings,
             SUM(CASE WHEN listing_type='flight' THEN 1 ELSE 0 END) as flights,
             SUM(CASE WHEN listing_type='hotel' THEN 1 ELSE 0 END) as hotels,
             SUM(CASE WHEN listing_type='car' THEN 1 ELSE 0 END) as cars,
             SUM(owner_earnings) as total_earnings
      FROM kayak_bookings.bookings
      WHERE owner_id IN (${ownerIds.map(() => '?').join(',')})
      GROUP BY owner_id
      ORDER BY owner_id ASC
    `, ownerIds);

    ownerStats.forEach((row, idx) => {
      const email = ownerList[idx].email;
      console.log(`   ${email}: ${row.total_bookings} total (F:${row.flights}, H:${row.hotels}, C:${row.cars}) - $${parseFloat(row.total_earnings || 0).toFixed(2)}`);
    });

    console.log('\n✅ BOOKING DISTRIBUTION COMPLETE!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) await connection.end();
  }
}

main();
