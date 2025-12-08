const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const csv = require('csv-parser');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3307'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: 'kayak_listings',
  multipleStatements: true
};

async function importHotels() {
  console.log('🚀 Starting hotel data import...\n');
  
  const connection = await mysql.createConnection(MYSQL_CONFIG);
  console.log('✅ MySQL connected\n');

  // Clear existing hotels
  console.log('🧹 Clearing existing hotel data...');
  await connection.query('DELETE FROM hotel_amenities');
  await connection.query('DELETE FROM hotels');
  console.log('✅ Cleared\n');

  const csvPath = path.join(__dirname, 'stays-data', 'listings_reduced.csv');
  
  let imported = 0;
  let skipped = 0;
  const batch = [];
  const BATCH_SIZE = 500;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Parse price
          const priceStr = row.price || '$0';
          const price = parseFloat(priceStr.replace(/[$,]/g, '')) || 0;
          
          // Skip if no valid data
          if (!row.name || price <= 0 || price > 10000) {
            skipped++;
            return;
          }

          // Parse rating
          let rating = parseFloat(row.review_scores_rating) || 0;
          if (rating > 5) rating = rating / 20; // Convert 0-100 to 0-5
          rating = Math.min(5, Math.max(0, rating));

          const hotel = {
            listing_id: row.id || `listing_${imported}`,
            hotel_name: (row.name || 'Unnamed Property').substring(0, 500),
            description: row.description ? row.description.substring(0, 5000) : null,
            neighborhood_overview: row.neighborhood_overview ? row.neighborhood_overview.substring(0, 2000) : null,
            city: (row.neighbourhood_cleansed || row.neighbourhood || 'Unknown').substring(0, 255),
            state: 'NY', // Assuming NYC data
            neighbourhood: row.neighbourhood ? row.neighbourhood.substring(0, 255) : null,
            neighbourhood_cleansed: row.neighbourhood_cleansed ? row.neighbourhood_cleansed.substring(0, 255) : null,
            latitude: parseFloat(row.latitude) || 0,
            longitude: parseFloat(row.longitude) || 0,
            property_type: row.property_type ? row.property_type.substring(0, 255) : null,
            room_type: row.room_type ? row.room_type.substring(0, 100) : 'Entire home/apt',
            accommodates: parseInt(row.accommodates) || 2,
            bedrooms: parseInt(row.bedrooms) || 1,
            beds: parseInt(row.beds) || 1,
            bathrooms: parseFloat(row.bathrooms) || 1,
            bathrooms_text: row.bathrooms_text ? row.bathrooms_text.substring(0, 100) : null,
            price_per_night: price,
            minimum_nights: parseInt(row.minimum_nights) || 1,
            maximum_nights: parseInt(row.maximum_nights) || 365,
            star_rating: rating,
            number_of_reviews: parseInt(row.number_of_reviews) || 0,
            host_name: row.host_name ? row.host_name.substring(0, 255) : null,
            picture_url: row.picture_url || null,
            has_availability: true,
            availability_30: parseInt(row.availability_30) || 0
          };

          batch.push(hotel);
          imported++;

          // Insert batch
          if (batch.length >= BATCH_SIZE) {
            insertBatch(connection, batch.splice(0, BATCH_SIZE)).catch(err => {
              console.error('Batch insert error:', err.message);
            });
          }

          // Progress
          if (imported % 1000 === 0) {
            console.log(`   Imported ${imported} hotels...`);
          }
        } catch (error) {
          skipped++;
        }
      })
      .on('end', async () => {
        // Insert remaining
        if (batch.length > 0) {
          await insertBatch(connection, batch);
        }

        console.log(`\n✅ Import complete!`);
        console.log(`   Imported: ${imported} hotels`);
        console.log(`   Skipped: ${skipped} rows\n`);

        await connection.end();
        resolve(imported);
      })
      .on('error', reject);
  });
}

async function insertBatch(connection, hotels) {
  const values = hotels.map(h => [
    h.listing_id, h.hotel_name, h.description, h.neighborhood_overview,
    h.city, h.state, h.neighbourhood, h.neighbourhood_cleansed,
    h.latitude, h.longitude, h.property_type, h.room_type,
    h.accommodates, h.bedrooms, h.beds, h.bathrooms, h.bathrooms_text,
    h.price_per_night, h.minimum_nights, h.maximum_nights,
    h.star_rating, h.number_of_reviews, h.host_name,
    h.picture_url, h.has_availability, h.availability_30
  ]);

  const sql = `
    INSERT INTO hotels (
      listing_id, hotel_name, description, neighborhood_overview,
      city, state, neighbourhood, neighbourhood_cleansed,
      latitude, longitude, property_type, room_type,
      accommodates, bedrooms, beds, bathrooms, bathrooms_text,
      price_per_night, minimum_nights, maximum_nights,
      star_rating, number_of_reviews, host_name,
      picture_url, has_availability, availability_30
    ) VALUES ?
  `;

  try {
    await connection.query(sql, [values]);
  } catch (error) {
    // If batch fails, try one by one
    for (const hotel of hotels) {
      try {
        await connection.query(sql.replace('VALUES ?', 'VALUES (?)'), [[
          hotel.listing_id, hotel.hotel_name, hotel.description, hotel.neighborhood_overview,
          hotel.city, hotel.state, hotel.neighbourhood, hotel.neighbourhood_cleansed,
          hotel.latitude, hotel.longitude, hotel.property_type, hotel.room_type,
          hotel.accommodates, hotel.bedrooms, hotel.beds, hotel.bathrooms, hotel.bathrooms_text,
          hotel.price_per_night, hotel.minimum_nights, hotel.maximum_nights,
          hotel.star_rating, hotel.number_of_reviews, hotel.host_name,
          hotel.picture_url, hotel.has_availability, hotel.availability_30
        ]]);
      } catch (err) {
        // Skip individual failures
      }
    }
  }
}

importHotels()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
