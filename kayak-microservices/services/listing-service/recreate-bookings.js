const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const DB_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
};

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('\n🚀 RECREATING 250 BOOKINGS FOR owner00001\n');
  
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Get owner00001's ID
    const [ownerResult] = await connection.execute(
      'SELECT id FROM kayak_auth.users WHERE email = ?',
      ['owner00001@test.com']
    );
    
    if (ownerResult.length === 0) {
      console.log('❌ Owner00001 not found');
      return;
    }
    
    const owner_id = ownerResult[0].id;
    console.log(`✅ Found owner: ${owner_id}\n`);
    
    // Get the 5 cars
    const [cars] = await connection.execute(
      'SELECT id FROM kayak_listings.cars WHERE owner_id = ? ORDER BY id LIMIT 5',
      [owner_id]
    );
    
    // Get the 5 hotels
    const [hotels] = await connection.execute(
      'SELECT listing_id FROM kayak_listings.hotels WHERE owner_id = ? ORDER BY listing_id LIMIT 5',
      [owner_id]
    );
    
    console.log(`✓ Cars: ${cars.length}`);
    console.log(`✓ Hotels: ${hotels.length}\n`);
    
    // Delete old bookings for this owner
    await connection.execute(
      'DELETE FROM kayak_bookings.bookings WHERE owner_id = ?',
      [owner_id]
    );
    
    console.log('🗑️  Cleared old bookings\n');
    
    // Get some travellers to assign bookings to
    const [travellers] = await connection.execute(
      'SELECT id FROM kayak_auth.users WHERE role = "traveller" LIMIT 500'
    );
    
    console.log(`✓ Found ${travellers.length} travellers\n`);
    
    // Create 250 bookings: 50 cars, 200 hotels (ratio)
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    const bookingsToCreate = [];
    
    const startDate = new Date('2025-11-01');
    const endDate = new Date('2026-02-28');
    
    // 50 car bookings
    for (let i = 0; i < 50; i++) {
      const carId = cars[i % cars.length].id;
      const travellerId = travellers[i % travellers.length].id;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const bookingDate = getRandomDate(startDate, endDate);
      const travelDate = getRandomDate(bookingDate, endDate);
      const amount = 45 + Math.random() * (95 - 45); // $45-$95 per day
      const totalAmount = amount * (Math.random() * 7 + 1); // 1-8 days
      const commission = totalAmount * 0.15;
      
      bookingsToCreate.push([
        uuidv4(),
        owner_id,
        travellerId,
        carId,
        'car',
        status,
        bookingDate,
        travelDate,
        totalAmount,
        commission,
        totalAmount - commission,
        new Date(),
        new Date()
      ]);
    }
    
    // 200 hotel bookings
    for (let i = 0; i < 200; i++) {
      const hotelId = hotels[i % hotels.length].listing_id;
      const travellerId = travellers[(50 + i) % travellers.length].id;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const bookingDate = getRandomDate(startDate, endDate);
      const travelDate = getRandomDate(bookingDate, endDate);
      const amount = 120 + Math.random() * (200 - 120); // $120-$200 per night
      const nights = Math.random() * 10 + 1;
      const totalAmount = amount * nights;
      const commission = totalAmount * 0.15;
      
      bookingsToCreate.push([
        uuidv4(),
        owner_id,
        travellerId,
        hotelId,
        'hotel',
        status,
        bookingDate,
        travelDate,
        totalAmount,
        commission,
        totalAmount - commission,
        new Date(),
        new Date()
      ]);
    }
    
    // Insert all bookings in batches
    console.log(`📋 Creating 250 bookings (50 cars + 200 hotels)...\n`);
    
    const batchSize = 50;
    for (let i = 0; i < bookingsToCreate.length; i += batchSize) {
      const batch = bookingsToCreate.slice(i, i + batchSize);
      await connection.query(
        `INSERT INTO kayak_bookings.bookings 
         (id, owner_id, user_id, listing_id, listing_type, status, booking_date, travel_date, total_amount, platform_commission, owner_earnings, created_at, updated_at)
         VALUES ?`,
        [batch]
      );
      process.stdout.write(`\r  ${Math.min(i + batchSize, bookingsToCreate.length)}/${bookingsToCreate.length}`);
    }
    
    console.log('\n\n✅ Created 250 bookings!\n');
    
    // Show distribution
    const [carBookings] = await connection.execute(
      `SELECT c.brand, c.model, COUNT(*) as count 
       FROM kayak_bookings.bookings b
       JOIN kayak_listings.cars c ON b.listing_id = c.id
       WHERE b.owner_id = ? AND b.listing_type = 'car'
       GROUP BY b.listing_id`,
      [owner_id]
    );
    
    const [hotelBookings] = await connection.execute(
      `SELECT h.hotel_name, COUNT(*) as count 
       FROM kayak_bookings.bookings b
       JOIN kayak_listings.hotels h ON b.listing_id = h.listing_id
       WHERE b.owner_id = ? AND b.listing_type = 'hotel'
       GROUP BY b.listing_id`,
      [owner_id]
    );
    
    console.log('📊 FINAL DISTRIBUTION:');
    console.log('\n🚗 Cars (50 bookings):');
    carBookings.forEach(car => {
      console.log(`   ${car.brand} ${car.model}: ${car.count} bookings`);
    });
    
    console.log('\n🏨 Hotels (200 bookings):');
    hotelBookings.forEach(hotel => {
      console.log(`   ${hotel.hotel_name}: ${hotel.count} bookings`);
    });
    
    console.log('\n✅ DONE!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

main();
