const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const DB_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
};

async function main() {
  console.log('\n🚀 CREATING OWNER LISTINGS\n');
  
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
    
    // Create 5 car listings
    console.log('🚗 Creating 5 car listings...');
    const cars = [
      { brand: 'Toyota', model: 'Camry', year: 2023, location: 'Los Angeles, CA', price: 45 },
      { brand: 'Honda', model: 'Accord', year: 2022, location: 'San Francisco, CA', price: 50 },
      { brand: 'Tesla', model: 'Model 3', year: 2024, location: 'San Diego, CA', price: 75 },
      { brand: 'BMW', model: '3 Series', year: 2023, location: 'Las Vegas, NV', price: 85 },
      { brand: 'Mercedes', model: 'C-Class', year: 2023, location: 'Miami, FL', price: 95 },
    ];
    
    for (const car of cars) {
      const carId = uuidv4();
      await connection.execute(
        `INSERT INTO kayak_listings.cars 
         (id, owner_id, company_name, brand, model, year, type, transmission, seats, daily_rental_price, location, approval_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [carId, owner_id, 'Owner Rentals', car.brand, car.model, car.year, 'sedan', 'automatic', 5, car.price, car.location, 'approved']
      );
      console.log(`   ✓ ${car.brand} ${car.model} - $${car.price}/day`);
    }
    
    // Create 5 hotel listings
    console.log('\n🏨 Creating 5 hotel listings...');
    const hotels = [
      { name: 'Luxury Downtown Hotel', city: 'New York, NY', price: 150 },
      { name: 'Beachfront Resort', city: 'Miami, FL', price: 200 },
      { name: 'Mountain View Lodge', city: 'Denver, CO', price: 120 },
      { name: 'Urban Boutique Hotel', city: 'Chicago, IL', price: 130 },
      { name: 'Coastal Paradise Inn', city: 'San Diego, CA', price: 180 },
    ];
    
    for (const hotel of hotels) {
      const hotelId = uuidv4();
      await connection.execute(
        `INSERT INTO kayak_listings.hotels 
         (listing_id, owner_id, hotel_name, city, price_per_night, star_rating, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [hotelId, owner_id, hotel.name, hotel.city, hotel.price, 5]
      );
      console.log(`   ✓ ${hotel.name} - $${hotel.price}/night`);
    }
    
    console.log('\n✅ LISTINGS CREATED!\n');
    
    // Now get the IDs and update bookings
    console.log('🔗 Linking bookings to listings...');
    
    const [carIds] = await connection.execute(
      'SELECT id FROM kayak_listings.cars WHERE owner_id = ? LIMIT 5',
      [owner_id]
    );
    
    const [hotelIds] = await connection.execute(
      'SELECT listing_id FROM kayak_listings.hotels WHERE owner_id = ? LIMIT 5',
      [owner_id]
    );
    
    // Get bookings for this owner and update them to point to real listings
    const [bookings] = await connection.execute(
      'SELECT id, listing_type FROM kayak_bookings.bookings WHERE owner_id = ? ORDER BY id',
      [owner_id]
    );
    
    let carIndex = 0;
    let hotelIndex = 0;
    
    for (const booking of bookings) {
      let listing_id;
      
      if (booking.listing_type === 'car' && carIds.length > 0) {
        listing_id = carIds[carIndex % carIds.length].id;
        carIndex++;
      } else if (booking.listing_type === 'hotel' && hotelIds.length > 0) {
        listing_id = hotelIds[hotelIndex % hotelIds.length].listing_id;
        hotelIndex++;
      } else {
        continue;
      }
      
      await connection.execute(
        'UPDATE kayak_bookings.bookings SET listing_id = ? WHERE id = ?',
        [listing_id, booking.id]
      );
    }
    
    console.log(`   ✓ Updated ${bookings.length} bookings\n`);
    
    // Verify
    const [carCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM kayak_listings.cars WHERE owner_id = ?',
      [owner_id]
    );
    
    const [hotelCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM kayak_listings.hotels WHERE owner_id = ?',
      [owner_id]
    );
    
    const [bookingCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM kayak_bookings.bookings WHERE owner_id = ?',
      [owner_id]
    );
    
    console.log('📊 SUMMARY:');
    console.log(`   Cars:     ${carCount[0].count}`);
    console.log(`   Hotels:   ${hotelCount[0].count}`);
    console.log(`   Bookings: ${bookingCount[0].count}\n`);
    
    console.log('✅ DONE!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

main();
