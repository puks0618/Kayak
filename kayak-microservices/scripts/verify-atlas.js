const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/kayak_listings';

(async () => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('kayak_listings');
    
    // Check total reviews
    const total = await db.collection('reviews').countDocuments();
    console.log(`Total reviews: ${total}`);
    
    // Check reviews with valid listing_id
    const validReviews = await db.collection('reviews').countDocuments({ listing_id: { $ne: null, $gt: 0 } });
    console.log(`Reviews with valid listing_id: ${validReviews}`);
    
    // Check reviews with null listing_id
    const nullReviews = await db.collection('reviews').countDocuments({ listing_id: null });
    console.log(`Reviews with null listing_id: ${nullReviews}`);
    
    // Get sample of valid reviews
    const samples = await db.collection('reviews').find({ listing_id: { $ne: null, $gt: 0 } }).limit(5).toArray();
    console.log('\nSample valid reviews:');
    samples.forEach(r => console.log(`  Listing ${r.listing_id}: ${r.comments.substring(0, 50)}...`));
    
    // Check for listing 25696
    const count25696 = await db.collection('reviews').countDocuments({ listing_id: 25696 });
    console.log(`\nReviews for listing 25696: ${count25696}`);
    
    await client.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
