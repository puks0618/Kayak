const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
};

async function main() {
  console.log('\n🔗 LINKING 250 BOOKINGS TO 5 CARS & 5 HOTELS\n');
  
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
    
    // Get the 5 cars created
    const [cars] = await connection.execute(
      'SELECT id FROM kayak_listings.cars WHERE owner_id = ? ORDER BY id LIMIT 5',
      [owner_id]
    );
    
    // Get the 5 hotels created
    const [hotels] = await connection.execute(
      'SELECT listing_id FROM kayak_listings.hotels WHERE owner_id = ? ORDER BY listing_id LIMIT 5',
      [owner_id]
    );
    
    console.log(`✓ Found ${cars.length} cars`);
    console.log(`✓ Found ${hotels.length} hotels\n`);
    
    // Get all bookings for this owner
    const [bookings] = await connection.execute(
      'SELECT id, listing_type FROM kayak_bookings.bookings WHERE owner_id = ? ORDER BY id',
      [owner_id]
    );
    
    console.log(`📋 Distributing ${bookings.length} bookings...\n`);
    
    let carIndex = 0;
    let hotelIndex = 0;
    let carsUpdated = 0;
    let hotelsUpdated = 0;
    
    // Update each booking to point to a real listing, cycling through cars and hotels
    for (const booking of bookings) {
      let listing_id;
      
      if (booking.listing_type === 'car') {
        listing_id = cars[carIndex % cars.length].id;
        carIndex++;
        carsUpdated++;
      } else if (booking.listing_type === 'hotel') {
        listing_id = hotels[hotelIndex % hotels.length].listing_id;
        hotelIndex++;
        hotelsUpdated++;
      } else {
        continue;
      }
      
      await connection.execute(
        'UPDATE kayak_bookings.bookings SET listing_id = ? WHERE id = ?',
        [listing_id, booking.id]
      );
    }
    
    console.log(`✅ Updated bookings:`);
    console.log(`   Car bookings:   ${carsUpdated}`);
    console.log(`   Hotel bookings: ${hotelsUpdated}\n`);
    
    // Verify - show distribution
    const [carBookings] = await connection.execute(
      `SELECT c.model, c.location, COUNT(*) as count 
       FROM kayak_bookings.bookings b
       JOIN kayak_listings.cars c ON b.listing_id = c.id
       WHERE b.owner_id = ? AND b.listing_type = 'car'
       GROUP BY b.listing_id`,
      [owner_id]
    );
    
    const [hotelBookings] = await connection.execute(
      `SELECT h.hotel_name, h.city, COUNT(*) as count 
       FROM kayak_bookings.bookings b
       JOIN kayak_listings.hotels h ON b.listing_id = h.listing_id
       WHERE b.owner_id = ? AND b.listing_type = 'hotel'
       GROUP BY b.listing_id`,
      [owner_id]
    );
    
    console.log('📊 BOOKING DISTRIBUTION:');
    console.log('\n🚗 Cars:');
    carBookings.forEach(car => {
      console.log(`   ${car.model} (${car.location}): ${car.count} bookings`);
    });
    
    console.log('\n🏨 Hotels:');
    hotelBookings.forEach(hotel => {
      console.log(`   ${hotel.hotel_name} (${hotel.city}): ${hotel.count} bookings`);
    });
    
    console.log('\n✅ DONE!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

main();
