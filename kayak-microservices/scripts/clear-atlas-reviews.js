const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/kayak_listings';

(async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected!');
    
    const db = client.db('kayak_listings');
    const result = await db.collection('reviews').deleteMany({});
    
    console.log(`🗑️  Deleted ${result.deletedCount} reviews from Atlas`);
    
    await client.close();
    console.log('✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
