const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/kayak_listings';

(async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to Atlas!');
    
    const db = client.db('kayak_listings');
    
    // Check reviews collection
    const totalReviews = await db.collection('reviews').countDocuments();
    console.log(`📊 Total reviews in Atlas: ${totalReviews}`);
    
    // Check specific listing
    const listing25696 = await db.collection('reviews').countDocuments({listing_id: 25696});
    console.log(`📋 Reviews for listing 25696: ${listing25696}`);
    
    // Get a sample review
    const sample = await db.collection('reviews').findOne({listing_id: 25696});
    if (sample) {
      console.log('📝 Sample review:', {
        listing_id: sample.listing_id,
        reviewer: sample.reviewer_name,
        comment: sample.comments.substring(0, 50)
      });
    }
    
    await client.close();
    console.log('✅ Connection closed');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
