/**
 * MongoDB Configuration for Reviews and Images
 */

module.exports = {
  uri: process.env.MONGO_URI || 'mongodb://localhost:27017/kayak_listings',
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

