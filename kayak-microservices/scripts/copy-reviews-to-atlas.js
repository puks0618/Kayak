const { MongoClient } = require('mongodb');

const LOCAL_URI = 'mongodb://localhost:27017/kayak_listings';
const ATLAS_URI = 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/kayak_listings';
const BATCH_SIZE = 1000;

async function copyReviewsToAtlas() {
  let localClient, atlasClient;
  
  try {
    console.log('🔌 Connecting to local MongoDB...');
    localClient = new MongoClient(LOCAL_URI);
    await localClient.connect();
    console.log('✅ Connected to local MongoDB');
    
    console.log('🔌 Connecting to Atlas...');
    atlasClient = new MongoClient(ATLAS_URI);
    await atlasClient.connect();
    console.log('✅ Connected to Atlas');
    
    const localDb = localClient.db('kayak_listings');
    const atlasDb = atlasClient.db('kayak_listings');
    
    const localReviews = localDb.collection('reviews');
    const atlasReviews = atlasDb.collection('reviews');
    
    // Check if Atlas already has data
    const existingCount = await atlasReviews.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Atlas already has ${existingCount} reviews. Skipping transfer.`);
      console.log('   Run clear-atlas-reviews.js first if you want to re-import.');
      return;
    }
    
    // Get total count
    const total = await localReviews.countDocuments();
    console.log(`📊 Found ${total} reviews in local MongoDB`);
    
    // Create indexes
    console.log('📊 Creating indexes in Atlas...');
    await atlasReviews.createIndex({ listing_id: 1 });
    await atlasReviews.createIndex({ reviewer_id: 1 });
    await atlasReviews.createIndex({ date: -1 });
    
    // Copy in batches
    let transferred = 0;
    let batch = [];
    
    const cursor = localReviews.find();
    
    while (await cursor.hasNext()) {
      const review = await cursor.next();
      batch.push(review);
      
      if (batch.length >= BATCH_SIZE) {
        await atlasReviews.insertMany(batch);
        transferred += batch.length;
        console.log(`✅ Transferred ${transferred}/${total} reviews...`);
        batch = [];
      }
    }
    
    // Insert remaining batch
    if (batch.length > 0) {
      await atlasReviews.insertMany(batch);
      transferred += batch.length;
    }
    
    console.log(`\n🎉 Successfully transferred ${transferred} reviews to Atlas!`);
    
    // Verify
    const atlasCount = await atlasReviews.countDocuments();
    const atlasValidCount = await atlasReviews.countDocuments({ listing_id: { $ne: null, $gt: 0 } });
    
    console.log(`\n📊 Verification:`);
    console.log(`   Total reviews in Atlas: ${atlasCount}`);
    console.log(`   Reviews with valid listing_id: ${atlasValidCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (localClient) await localClient.close();
    if (atlasClient) await atlasClient.close();
    console.log('\n✅ Connections closed');
  }
}

copyReviewsToAtlas()
  .then(() => {
    console.log('✅ Transfer completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Transfer failed:', error);
    process.exit(1);
  });
