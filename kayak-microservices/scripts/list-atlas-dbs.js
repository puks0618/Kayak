const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/';

(async () => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    const admin = client.db().admin();
    const dbs = await admin.listDatabases();
    
    console.log('📊 Databases in Atlas:');
    for (const db of dbs.databases) {
      console.log(`\n  ${db.name}:`);
      const database = client.db(db.name);
      const collections = await database.listCollections().toArray();
      for (const coll of collections) {
        const count = await database.collection(coll.name).countDocuments();
        console.log(`    - ${coll.name}: ${count} documents`);
      }
    }
    
    await client.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
