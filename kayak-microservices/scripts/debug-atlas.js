const { MongoClient } = require('mongodb');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const uri = process.env.MONGO_URI || 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/kayak_listings';

(async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    const client = new MongoClient(uri);
    await client.connect();
    
    // List all databases
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log('\n📚 Available databases:', dbs.databases.map(d => `${d.name} (${(d.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`).join(', '));
    
    // Check kayak_listings collections
    const db = client.db('kayak_listings');
    const collections = await db.listCollections().toArray();
    console.log('\n📦 Collections in kayak_listings:', collections.map(c => c.name).join(', '));
    
    // Check reviews count
    const reviewsCount = await db.collection('reviews').countDocuments();
    console.log(`\n✅ Total reviews: ${reviewsCount}`);
    
    if (reviewsCount > 0) {
      const sampleReview = await db.collection('reviews').findOne();
      console.log(`\n📄 Sample review listing_id: ${sampleReview.listing_id} (type: ${typeof sampleReview.listing_id})`);
      
      // Test query with integer
      const intCount = await db.collection('reviews').countDocuments({ listing_id: 25696 });
      console.log(`   Reviews for listing_id 25696 (int): ${intCount}`);
      
      // Test query with string
      const strCount = await db.collection('reviews').countDocuments({ listing_id: '25696' });
      console.log(`   Reviews for listing_id '25696' (string): ${strCount}`);
    }
    
    await client.close();
    console.log('\n✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
