#!/usr/bin/env node

/**
 * Generate and import car rental reviews to MongoDB Atlas
 * Collection: kayak_listings.cars_reviews
 */

const { MongoClient } = require('mongodb');

// MongoDB Atlas connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/';
const DB_NAME = 'kayak_listings';
const COLLECTION_NAME = 'cars_reviews';

// Sample car companies and models
const carCompanies = ['Enterprise', 'Hertz', 'Avis', 'Budget', 'National', 'Alamo', 'Dollar', 'Thrifty'];
const carMakes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'Mazda'];
const carModels = {
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot'],
  'Ford': ['Fusion', 'Escape', 'Explorer', 'Mustang'],
  'Chevrolet': ['Malibu', 'Cruze', 'Equinox', 'Tahoe'],
  'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder'],
  'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe'],
  'Kia': ['Forte', 'Optima', 'Sportage', 'Sorento'],
  'Mazda': ['Mazda3', 'Mazda6', 'CX-5', 'CX-9']
};

const reviewComments = {
  5: [
    "Excellent car! Clean, comfortable, and perfect for our trip.",
    "Best rental experience ever. The car was in pristine condition.",
    "Amazing vehicle! Smooth ride and great fuel economy.",
    "Highly recommend! The car exceeded all our expectations.",
    "Perfect car for our family vacation. Very spacious and reliable."
  ],
  4: [
    "Great car overall. Minor scratches but nothing major.",
    "Good experience. The car was clean and drove well.",
    "Very satisfied with the rental. Would rent again.",
    "Nice vehicle. Pickup process was smooth and quick.",
    "Good value for money. Car was comfortable for long drives."
  ],
  3: [
    "Decent car. Met our basic needs but nothing special.",
    "Average experience. Car was okay but could be cleaner.",
    "The car worked fine but had some wear and tear.",
    "Acceptable rental. No major issues but not impressive.",
    "Fair rental. Car was functional but interior needed attention."
  ],
  2: [
    "Disappointing. Car had mechanical issues during rental.",
    "Not great. Vehicle was older than expected.",
    "Below expectations. Car had strange noises while driving.",
    "Unsatisfied with cleanliness. Interior was not properly cleaned.",
    "Poor experience. Had to return early due to problems."
  ],
  1: [
    "Terrible experience. Car broke down multiple times.",
    "Worst rental ever. Vehicle was in poor condition.",
    "Do not recommend. Safety concerns with the vehicle.",
    "Awful. Had to exchange the car due to serious issues.",
    "Unacceptable condition. Demanded a refund."
  ]
};

const reviewerNames = [
  'James Wilson', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Miller',
  'Jessica Garcia', 'Robert Martinez', 'Ashley Rodriguez', 'Christopher Lee', 'Amanda White',
  'Matthew Taylor', 'Jennifer Anderson', 'Daniel Thomas', 'Laura Jackson', 'Ryan Harris',
  'Melissa Martin', 'Kevin Thompson', 'Nicole Moore', 'Brian Clark', 'Stephanie Lewis',
  'Justin Walker', 'Rebecca Hall', 'Brandon Allen', 'Michelle Young', 'Eric King',
  'Samantha Wright', 'Andrew Lopez', 'Kimberly Hill', 'Jason Scott', 'Elizabeth Green'
];

function generateReviews(count = 50) {
  const reviews = [];
  const usedReviewerIds = new Set();
  
  for (let i = 0; i < count; i++) {
    const company = carCompanies[Math.floor(Math.random() * carCompanies.length)];
    const make = carMakes[Math.floor(Math.random() * carMakes.length)];
    const model = carModels[make][Math.floor(Math.random() * carModels[make].length)];
    const rating = Math.random() < 0.6 ? (Math.random() < 0.7 ? 5 : 4) : Math.ceil(Math.random() * 3);
    
    // Generate unique reviewer_id
    let reviewerId;
    do {
      reviewerId = Math.floor(10000 + Math.random() * 90000).toString();
    } while (usedReviewerIds.has(reviewerId));
    usedReviewerIds.add(reviewerId);
    
    const reviewerName = reviewerNames[Math.floor(Math.random() * reviewerNames.length)];
    const comment = reviewComments[rating][Math.floor(Math.random() * reviewComments[rating].length)];
    
    // Random date within last 2 years
    const daysAgo = Math.floor(Math.random() * 730);
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() - daysAgo);
    
    const review = {
      car_company: company,
      car_make: make,
      car_model: model,
      car_id: Math.floor(1000 + Math.random() * 9000),
      reviewer_id: reviewerId,
      reviewer_name: reviewerName,
      review_date: reviewDate,
      rating: rating,
      comment: comment,
      verified_booking: Math.random() > 0.2, // 80% verified
      helpful_count: Math.floor(Math.random() * 50),
      created_at: new Date()
    };
    
    reviews.push(review);
  }
  
  return reviews;
}

async function importToMongo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    console.log('🚗 Generating car reviews...');
    const reviews = generateReviews(50);
    console.log(`✅ Generated ${reviews.length} car reviews\n`);
    
    console.log('🔌 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Clear existing car reviews
    console.log('🗑️  Clearing existing car reviews...');
    const deleteResult = await collection.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} existing documents\n`);
    
    // Insert reviews
    console.log(`📥 Inserting ${reviews.length} car reviews...`);
    const insertResult = await collection.insertMany(reviews);
    console.log(`✅ Inserted ${insertResult.insertedCount} reviews\n`);
    
    // Create indexes
    console.log('📇 Creating indexes...');
    await collection.createIndex({ car_company: 1 });
    await collection.createIndex({ car_id: 1 });
    await collection.createIndex({ reviewer_id: 1 });
    await collection.createIndex({ review_date: -1 });
    await collection.createIndex({ rating: 1 });
    console.log('✅ Indexes created\n');
    
    // Show sample
    console.log('📊 Sample reviews:');
    const samples = await collection.find().limit(5).toArray();
    samples.forEach((review, idx) => {
      console.log(`\n${idx + 1}. ${review.car_make} ${review.car_model} (${review.car_company})`);
      console.log(`   Rating: ${'⭐'.repeat(review.rating)} (${review.rating}/5)`);
      console.log(`   Reviewer: ${review.reviewer_name}`);
      console.log(`   Comment: "${review.comment}"`);
    });
    
    console.log('\n✅ Car reviews import complete!');
    
  } catch (error) {
    console.error('❌ Error importing car reviews:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run import
importToMongo();
