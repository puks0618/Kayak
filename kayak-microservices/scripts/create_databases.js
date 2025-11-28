const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const MYSQL_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Somalwar1!',
    multipleStatements: true // Required to run SQL scripts
};

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/';

async function initMySQL() {
    console.log('Initializing MySQL databases...');
    let connection;
    try {
        connection = await mysql.createConnection(MYSQL_CONFIG);
        console.log('Connected to MySQL');

        const sqlDir = path.join(__dirname, '../infrastructure/databases/mysql/init');
        const files = fs.readdirSync(sqlDir).sort();

        for (const file of files) {
            if (file.endsWith('.sql')) {
                console.log(`Executing ${file}...`);
                const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
                await connection.query(sql);
                console.log(`✓ ${file} executed successfully`);
            }
        }
        console.log('MySQL initialization complete.\n');
    } catch (err) {
        console.error('MySQL Initialization Error:', err);
    } finally {
        if (connection) await connection.end();
    }
}

async function initMongoDB() {
    console.log('Initializing MongoDB collections...');
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        // 1. Analytics Collection
        const analyticsDb = client.db('kayak_analytics');
        await createCollectionWithIndexes(analyticsDb, 'analytics', [
            { key: { date: -1 } },
            { key: { type: 1 } },
            { key: { 'metrics.revenue': -1 } }
        ]);

        // 2. Listings Collections (Reviews & Images)
        const listingsDb = client.db('kayak_listings');

        // Reviews
        await createCollectionWithIndexes(listingsDb, 'reviews', [
            { key: { listing_id: 1 } },
            { key: { user_id: 1 } },
            { key: { rating: 1 } },
            { key: { created_at: -1 } }
        ]);

        // Images
        await createCollectionWithIndexes(listingsDb, 'images', [
            { key: { listing_id: 1 } },
            { key: { listing_type: 1 } }
        ]);

        // 3. Logs Collection (Capped)
        const logsDb = client.db('kayak_logs');
        const logsCollectionName = 'application_logs';
        const collections = await logsDb.listCollections({ name: logsCollectionName }).toArray();

        if (collections.length === 0) {
            await logsDb.createCollection(logsCollectionName, {
                capped: true,
                size: 104857600, // 100MB
                max: 100000
            });
            console.log(`Created capped collection: ${logsCollectionName}`);
        } else {
            console.log(`Collection ${logsCollectionName} already exists`);
        }

        const logsCollection = logsDb.collection(logsCollectionName);
        await logsCollection.createIndex({ service: 1 });
        await logsCollection.createIndex({ level: 1 });
        await logsCollection.createIndex({ timestamp: -1 });
        console.log(`Indexes created for ${logsCollectionName}`);

        console.log('MongoDB initialization complete.\n');
    } catch (err) {
        console.error('MongoDB Initialization Error:', err);
    } finally {
        await client.close();
    }
}

async function createCollectionWithIndexes(db, collectionName, indexes) {
    const collection = db.collection(collectionName);
    // Create collection implicitly by creating indexes or inserting
    // But explicit creation is fine too if options needed.
    // Here we just ensure indexes exist.

    for (const index of indexes) {
        await collection.createIndex(index.key);
    }
    console.log(`✓ Collection '${collectionName}' configured in ${db.databaseName}`);
}

async function main() {
    await initMySQL();
    await initMongoDB();
    console.log('All database initializations finished.');
}

main();
