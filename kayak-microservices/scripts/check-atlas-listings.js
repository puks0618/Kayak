const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/kayak_listings';

(async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('kayak_listings');
    
    // Get top listings with most reviews
    const topListings = await db.collection('reviews').aggregate([
      { $group: { _id: '$listing_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    console.log('📊 Top 10 listings with most reviews in Atlas:');
    topListings.forEach(l => console.log(`   Listing ${l._id}: ${l.count} reviews`));
    
    // Check if these exist in MySQL
    console.log('\n🔍 Checking if these listings exist in our hotels table...');
    
    await client.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
