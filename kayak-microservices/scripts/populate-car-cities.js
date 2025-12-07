#!/usr/bin/env node

/**
 * Populate Cars Table with Sample Data for 10 Major US Cities
 * Creates car rental listings across 10 popular cities
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// MySQL connection (via Docker)
const MYSQL_CONFIG = {
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
  database: 'kayak_listings'
};

// 10 Major US Cities for Car Rentals
const CAR_CITIES = [
  'Los Angeles, CA',
  'New York, NY',
  'Miami, FL',
  'Las Vegas, NV',
  'San Francisco, CA',
  'Chicago, IL',
  'Orlando, FL',
  'Seattle, WA',
  'Boston, MA',
  'Denver, CO'
];

// Car rental companies
const COMPANIES = [
  'Enterprise',
  'Hertz',
  'Budget',
  'Avis',
  'National',
  'Alamo',
  'Dollar',
  'Thrifty'
];

// Car brands and models
const CAR_TYPES = [
  { brand: 'Toyota', model: 'Camry', type: 'sedan', seats: 5 },
  { brand: 'Honda', model: 'Civic', type: 'compact', seats: 5 },
  { brand: 'Ford', model: 'Explorer', type: 'suv', seats: 7 },
  { brand: 'Chevrolet', model: 'Malibu', type: 'sedan', seats: 5 },
  { brand: 'Nissan', model: 'Altima', type: 'sedan', seats: 5 },
  { brand: 'Jeep', model: 'Grand Cherokee', type: 'suv', seats: 5 },
  { brand: 'BMW', model: '5 Series', type: 'luxury', seats: 5 },
  { brand: 'Mercedes', model: 'E-Class', type: 'luxury', seats: 5 },
  { brand: 'Hyundai', model: 'Elantra', type: 'economy', seats: 5 },
  { brand: 'Toyota', model: 'Corolla', type: 'economy', seats: 5 },
  { brand: 'Ford', model: 'Escape', type: 'suv', seats: 5 },
  { brand: 'Honda', model: 'CR-V', type: 'suv', seats: 5 },
  { brand: 'Chrysler', model: 'Pacifica', type: 'van', seats: 7 },
  { brand: 'Dodge', model: 'Grand Caravan', type: 'van', seats: 7 },
  { brand: 'Kia', model: 'Forte', type: 'compact', seats: 5 }
];

const TRANSMISSIONS = ['automatic', 'manual'];

// Sample images for different car types
const CAR_IMAGES = {
  sedan: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'],
  suv: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'],
  luxury: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800'],
  economy: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800'],
  compact: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800'],
  van: ['https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800', 'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=800']
};

function getRandomPrice(type) {
  const priceRanges = {
    economy: [25, 45],
    compact: [30, 50],
    sedan: [40, 70],
    suv: [60, 120],
    luxury: [100, 250],
    van: [70, 130]
  };
  
  const [min, max] = priceRanges[type] || [40, 80];
  return (Math.random() * (max - min) + min).toFixed(2);
}

function getRandomRating() {
  return (Math.random() * (5.0 - 3.5) + 3.5).toFixed(2);
}

function getCarImages(type) {
  const images = CAR_IMAGES[type] || CAR_IMAGES.sedan;
  return images.slice(0, Math.floor(Math.random() * 2) + 1);
}

async function populateCarCities() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL...');
    connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Connected to MySQL');

    // Clear existing car data
    console.log('\n🗑️  Clearing existing car data...');
    await connection.query('DELETE FROM cars');
    console.log('✅ Cleared existing cars');

    // Insert cars for each city
    console.log('\n🚗 Inserting car rental data for 10 cities...');
    
    let totalCars = 0;
    const insertQuery = `
      INSERT INTO cars 
      (id, company_name, brand, model, year, type, transmission, seats, 
       daily_rental_price, location, availability_status, rating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `;

    for (const city of CAR_CITIES) {
      console.log(`\n  📍 Adding cars for ${city}...`);
      
      // Add 8-12 cars per city for variety
      const numCars = Math.floor(Math.random() * 5) + 8;
      
      for (let i = 0; i < numCars; i++) {
        const carType = CAR_TYPES[Math.floor(Math.random() * CAR_TYPES.length)];
        const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
        const transmission = TRANSMISSIONS[Math.floor(Math.random() * TRANSMISSIONS.length)];
        const year = Math.floor(Math.random() * 5) + 2020; // 2020-2024
        const price = getRandomPrice(carType.type);
        const rating = getRandomRating();
        const images = getCarImages(carType.type);
        
        await connection.execute(insertQuery, [
          uuidv4(),
          company,
          carType.brand,
          carType.model,
          year,
          carType.type,
          transmission,
          carType.seats,
          price,
          city,
          rating
        ]);
        
        totalCars++;
      }
      
      console.log(`     ✓ Added ${numCars} cars`);
    }

    console.log(`\n✅ Successfully inserted ${totalCars} cars across ${CAR_CITIES.length} cities!`);

    // Display summary
    console.log('\n📊 Summary by City:');
    const [citySummary] = await connection.query(`
      SELECT 
        location,
        COUNT(*) as car_count,
        AVG(daily_rental_price) as avg_price,
        MIN(daily_rental_price) as min_price,
        MAX(daily_rental_price) as max_price
      FROM cars
      GROUP BY location
      ORDER BY location
    `);

    citySummary.forEach(row => {
      console.log(`  ${row.location.padEnd(25)} - ${row.car_count} cars | $${parseFloat(row.min_price).toFixed(0)}-$${parseFloat(row.max_price).toFixed(0)}/day | Avg: $${parseFloat(row.avg_price).toFixed(0)}`);
    });

    console.log('\n📊 Summary by Type:');
    const [typeSummary] = await connection.query(`
      SELECT 
        type,
        COUNT(*) as count,
        AVG(daily_rental_price) as avg_price
      FROM cars
      GROUP BY type
      ORDER BY avg_price DESC
    `);

    typeSummary.forEach(row => {
      console.log(`  ${row.type.padEnd(10)} - ${row.count} cars | Avg: $${parseFloat(row.avg_price).toFixed(2)}/day`);
    });

    console.log('\n🎉 Car cities population complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

populateCarCities();
