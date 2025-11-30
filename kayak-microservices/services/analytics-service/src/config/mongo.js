/**
 * MongoDB Configuration for Analytics Service
 */

module.exports = {
    uri: process.env.MONGO_URI || 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/kayak_analytics',
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10
    },
    collections: {
        analytics: 'analytics',
        logs: 'logs'
    }
};
