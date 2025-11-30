/**
 * MongoDB Configuration for Reviews and Images
 */

module.exports = {
  uri: process.env.MONGO_URI || 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/kayak_listings',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10
  },
  collections: {
    reviews: 'reviews',
    images: 'images'
  }
};

