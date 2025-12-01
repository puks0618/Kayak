#!/usr/bin/env node

/**
 * Car Images Download Script
 * Downloads high-quality car images from Unsplash and organizes by type
 * 
 * Usage: node download-car-images.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Unsplash Access Key (Free tier: 50 requests/hour)
// Get your own key at: https://unsplash.com/developers
const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY';

// Car image mapping based on our seed data
const carImages = [
  // Economy (2 cars)
  { id: 1, type: 'economy', model: 'yaris', search: 'toyota yaris car', filename: 'yaris.jpg' },
  { id: 2, type: 'economy', model: 'accent', search: 'hyundai accent car', filename: 'accent.jpg' },
  
  // Compact (4 cars)
  { id: 3, type: 'compact', model: 'civic', search: 'honda civic car', filename: 'civic.jpg' },
  { id: 4, type: 'compact', model: 'corolla', search: 'toyota corolla car', filename: 'corolla.jpg' },
  { id: 5, type: 'compact', model: 'mazda3', search: 'mazda 3 car', filename: 'mazda3.jpg' },
  { id: 6, type: 'compact', model: 'elantra', search: 'hyundai elantra car', filename: 'elantra.jpg' },
  
  // Sedan (3 cars)
  { id: 7, type: 'sedan', model: 'camry', search: 'toyota camry car', filename: 'camry.jpg' },
  { id: 8, type: 'sedan', model: 'accord', search: 'honda accord car', filename: 'accord.jpg' },
  { id: 9, type: 'sedan', model: 'altima', search: 'nissan altima car', filename: 'altima.jpg' },
  
  // SUV (6 cars)
  { id: 10, type: 'suv', model: 'rav4', search: 'toyota rav4 suv', filename: 'rav4.jpg' },
  { id: 11, type: 'suv', model: 'crv', search: 'honda crv suv', filename: 'crv.jpg' },
  { id: 12, type: 'suv', model: 'explorer', search: 'ford explorer suv', filename: 'explorer.jpg' },
  { id: 13, type: 'suv', model: 'highlander', search: 'toyota highlander suv', filename: 'highlander.jpg' },
  { id: 14, type: 'suv', model: 'pilot', search: 'honda pilot suv', filename: 'pilot.jpg' },
  { id: 15, type: 'suv', model: 'cherokee', search: 'jeep cherokee suv', filename: 'cherokee.jpg' },
  
  // Luxury (4 cars)
  { id: 16, type: 'luxury', model: 'bmw3', search: 'bmw 3 series car', filename: 'bmw3.jpg' },
  { id: 17, type: 'luxury', model: 'c-class', search: 'mercedes c class car', filename: 'c-class.jpg' },
  { id: 18, type: 'luxury', model: 'a4', search: 'audi a4 car', filename: 'a4.jpg' },
  { id: 19, type: 'luxury', model: 'genesis', search: 'genesis g70 car', filename: 'genesis.jpg' },
  
  // Van (1 car)
  { id: 20, type: 'van', model: 'pacifica', search: 'chrysler pacifica van', filename: 'pacifica.jpg' },
];

// Base directory for images
const BASE_DIR = path.join(__dirname, '../frontend/web-client/public/car-images');

// Create directory structure
function createDirectories() {
  const types = ['economy', 'compact', 'sedan', 'suv', 'luxury', 'van'];
  
  if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
  }
  
  types.forEach(type => {
    const typeDir = path.join(BASE_DIR, type);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
  });
  
  console.log('✅ Created directory structure');
}

// Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Search and download from Unsplash
async function downloadFromUnsplash(carInfo) {
  const query = encodeURIComponent(carInfo.search);
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', async () => {
        try {
          const result = JSON.parse(data);
          
          if (result.results && result.results.length > 0) {
            const photo = result.results[0];
            const imageUrl = photo.urls.regular; // 1080px width
            const filepath = path.join(BASE_DIR, carInfo.type, carInfo.filename);
            
            await downloadImage(imageUrl, filepath);
            console.log(`✅ Downloaded: ${carInfo.type}/${carInfo.filename}`);
            resolve();
          } else {
            console.log(`⚠️  No image found for: ${carInfo.model}`);
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Fallback: Download from Pexels (no API key needed for some endpoints)
async function downloadFallbackImage(carInfo) {
  // Use a generic car image as fallback
  const fallbackImages = {
    economy: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format',
    compact: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format',
    sedan: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&auto=format',
    suv: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format',
    luxury: 'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800&auto=format',
    van: 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800&auto=format',
  };
  
  const imageUrl = fallbackImages[carInfo.type];
  const filepath = path.join(BASE_DIR, carInfo.type, carInfo.filename);
  
  await downloadImage(imageUrl, filepath);
  console.log(`✅ Downloaded fallback: ${carInfo.type}/${carInfo.filename}`);
}

// Generate updated SQL file
function generateUpdatedSQL() {
  const sqlPath = path.join(__dirname, '../infrastructure/databases/mysql/init/10-cars-seed-data-updated.sql');
  
  let sql = `-- Updated Cars Seed Data with Local Images
-- Generated: ${new Date().toISOString()}

UPDATE cars SET images = JSON_ARRAY('/car-images/economy/yaris.jpg') WHERE id = 1;
UPDATE cars SET images = JSON_ARRAY('/car-images/economy/accent.jpg') WHERE id = 2;
UPDATE cars SET images = JSON_ARRAY('/car-images/compact/civic.jpg') WHERE id = 3;
UPDATE cars SET images = JSON_ARRAY('/car-images/compact/corolla.jpg') WHERE id = 4;
UPDATE cars SET images = JSON_ARRAY('/car-images/compact/mazda3.jpg') WHERE id = 5;
UPDATE cars SET images = JSON_ARRAY('/car-images/compact/elantra.jpg') WHERE id = 6;
UPDATE cars SET images = JSON_ARRAY('/car-images/sedan/camry.jpg') WHERE id = 7;
UPDATE cars SET images = JSON_ARRAY('/car-images/sedan/accord.jpg') WHERE id = 8;
UPDATE cars SET images = JSON_ARRAY('/car-images/sedan/altima.jpg') WHERE id = 9;
UPDATE cars SET images = JSON_ARRAY('/car-images/suv/rav4.jpg') WHERE id = 10;
UPDATE cars SET images = JSON_ARRAY('/car-images/suv/crv.jpg') WHERE id = 11;
UPDATE cars SET images = JSON_ARRAY('/car-images/suv/explorer.jpg') WHERE id = 12;
UPDATE cars SET images = JSON_ARRAY('/car-images/suv/highlander.jpg') WHERE id = 13;
UPDATE cars SET images = JSON_ARRAY('/car-images/suv/pilot.jpg') WHERE id = 14;
UPDATE cars SET images = JSON_ARRAY('/car-images/suv/cherokee.jpg') WHERE id = 15;
UPDATE cars SET images = JSON_ARRAY('/car-images/luxury/bmw3.jpg') WHERE id = 16;
UPDATE cars SET images = JSON_ARRAY('/car-images/luxury/c-class.jpg') WHERE id = 17;
UPDATE cars SET images = JSON_ARRAY('/car-images/luxury/a4.jpg') WHERE id = 18;
UPDATE cars SET images = JSON_ARRAY('/car-images/luxury/genesis.jpg') WHERE id = 19;
UPDATE cars SET images = JSON_ARRAY('/car-images/van/pacifica.jpg') WHERE id = 20;
`;
  
  fs.writeFileSync(sqlPath, sql);
  console.log(`\n✅ Generated SQL update file: ${sqlPath}`);
}

// Main execution
async function main() {
  console.log('🚗 Car Images Download Script\n');
  
  if (UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
    console.log('⚠️  No Unsplash API key found. Using fallback method...\n');
    console.log('To use Unsplash API:');
    console.log('1. Get free API key from: https://unsplash.com/developers');
    console.log('2. Edit this script and replace YOUR_UNSPLASH_ACCESS_KEY\n');
    
    createDirectories();
    
    console.log('Downloading fallback images...\n');
    for (const car of carImages) {
      try {
        await downloadFallbackImage(car);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
      } catch (error) {
        console.error(`❌ Error downloading ${car.filename}:`, error.message);
      }
    }
  } else {
    createDirectories();
    
    console.log('Downloading from Unsplash...\n');
    for (const car of carImages) {
      try {
        await downloadFromUnsplash(car);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit: 50/hour
      } catch (error) {
        console.error(`❌ Error downloading ${car.filename}:`, error.message);
      }
    }
  }
  
  generateUpdatedSQL();
  
  console.log('\n✅ All done! Images downloaded to:', BASE_DIR);
  console.log('\nNext steps:');
  console.log('1. Run the SQL update: docker exec -i kayak-mysql mysql -uroot -prootpassword kayak_listings < infrastructure/databases/mysql/init/10-cars-seed-data-updated.sql');
  console.log('2. Rebuild frontend: cd infrastructure/docker && docker-compose build web-client && docker-compose up -d web-client');
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
