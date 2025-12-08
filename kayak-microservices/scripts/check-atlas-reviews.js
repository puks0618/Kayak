const { MongoClient } = require('mongodb');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const uri = process.env.MONGO_URI || 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/kayak_listings';

(async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('kayak_listings');
    
    const count = await db.collection('reviews').countDocuments();
    console.log(`✅ Total reviews in Atlas: ${count}`);
    
    if (count > 0) {
      const sample = await db.collection('reviews').findOne();
      console.log('\n📄 Sample review:');
      console.log(`   Listing ID: ${sample.listing_id}`);
      console.log(`   Reviewer: ${sample.reviewer_name}`);
      console.log(`   Date: ${sample.date}`);
      console.log(`   Comment: ${sample.comments.substring(0, 80)}...`);
      
      // Check a specific listing
      const listingCount = await db.collection('reviews').countDocuments({ listing_id: 25696 });
      console.log(`\n📊 Reviews for listing 25696: ${listingCount}`);
    }
    
    await client.close();
    console.log('\n✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
