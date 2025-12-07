/**
 * Hotel Model
 */

const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306'),
  user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || 'Somalwar1!',
  database: process.env.DB_NAME || 'kayak_listings',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/kayak_listings';
let mongoClient = null;
let mongoDb = null;

const pool = mysql.createPool(dbConfig);

// Initialize MongoDB connection
async function initMongo() {
  if (!mongoClient) {
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    mongoDb = mongoClient.db('kayak_listings');
    console.log('MongoDB connected for hotels module');
  }
  return mongoDb;
}

const HotelModel = {
  async create(hotelData) {
    const {
      hotel_name, address, city, state, star_rating,
      price_per_night, room_type, listing_id, owner_id
    } = hotelData;

    const query = `
      INSERT INTO hotels 
      (listing_id, owner_id, hotel_name, address, city, state, star_rating, price_per_night, room_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      listing_id || uuidv4(), owner_id, hotel_name, address, city, state, star_rating,
      price_per_night, room_type
    ]);

    return { hotel_id: result.insertId, ...hotelData };
  },

  async findAll(filters = {}) {
    let query = 'SELECT * FROM hotels WHERE 1=1';
    const params = [];

    if (filters.city) {
      query += ' AND city = ?';
      params.push(filters.city);
    }
    if (filters.state) {
      query += ' AND state = ?';
      params.push(filters.state);
    }
    if (filters.price_min) {
      query += ' AND price_per_night >= ?';
      params.push(filters.price_min);
    }
    if (filters.price_max) {
      query += ' AND price_per_night <= ?';
      params.push(filters.price_max);
    }
    if (filters.stars) {
      query += ' AND star_rating >= ?';
      params.push(filters.stars);
    }

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Advanced search with multiple filters
   */
  async search(searchParams) {
    const {
      cities = [],
      checkIn,
      checkOut,
      rooms = 1,
      guests = 2,
      priceMin,
      priceMax,
      starRating,
      amenities = [],
      propertyType,
      sortBy = 'price_asc', // price_asc, price_desc, rating_desc
      page = 1,
      limit = 20
    } = searchParams;

    let query = `
      SELECT DISTINCT h.*,
        (SELECT COUNT(*) FROM hotel_amenities ha WHERE ha.hotel_id = h.hotel_id) as amenity_count,
        (SELECT GROUP_CONCAT(ha.amenity SEPARATOR '|||') 
         FROM hotel_amenities ha 
         WHERE ha.hotel_id = h.hotel_id) as hotel_amenities_list
      FROM hotels h
      WHERE h.has_availability = 1
    `;
    const params = [];

    // Initialize MongoDB connection
    let db = null;
    try {
      db = await initMongo();
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }

    // Multiple cities search (search in city and address)
    if (cities.length > 0) {
      const conditions = cities.map(() => 
        '(h.city LIKE ? OR h.address LIKE ?)'
      ).join(' OR ');
      query += ` AND (${conditions})`;
      cities.forEach(city => {
        const searchPattern = `%${city}%`;
        params.push(searchPattern, searchPattern);
      });
    }

    // Guest capacity - using accommodates field
    if (guests) {
      query += ' AND h.accommodates >= ?';
      params.push(guests);
    }

    // Price range
    if (priceMin) {
      query += ' AND h.price_per_night >= ?';
      params.push(priceMin);
    }
    if (priceMax) {
      query += ' AND h.price_per_night <= ?';
      params.push(priceMax);
    }

    // Star rating (minimum)
    if (starRating) {
      query += ' AND h.star_rating >= ?';
      params.push(starRating);
    }

    // Property type - using room_type as substitute
    if (propertyType) {
      query += ' AND h.room_type = ?';
      params.push(propertyType);
    }

    // Amenities filter (hotel must have ALL specified amenities)
    if (amenities.length > 0) {
      const amenPlaceholders = amenities.map(() => '?').join(',');
      query += ` AND h.id IN (
        SELECT ha.hotel_id 
        FROM hotel_amenities ha
        WHERE ha.amenity IN (${amenPlaceholders})
        GROUP BY ha.hotel_id
        HAVING COUNT(DISTINCT ha.amenity) = ?
      )`;
      amenities.forEach(amenity => params.push(amenity));
      params.push(amenities.length);
    }

    // Sorting
    switch (sortBy) {
      case 'price_asc':
        query += ' ORDER BY h.price_per_night ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY h.price_per_night DESC';
        break;
      case 'rating_desc':
        query += ' ORDER BY h.star_rating DESC, h.review_scores_rating DESC';
        break;
      case 'reviews_desc':
        query += ' ORDER BY h.number_of_reviews DESC, h.review_scores_rating DESC';
        break;
      default:
        query += ' ORDER BY h.star_rating DESC, h.review_scores_rating DESC';
    }

    // Pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(DISTINCT h.hotel_id) as total FROM hotels h WHERE h.has_availability = 1';
    const countParams = [];
    
    if (cities.length > 0) {
      const conditions = cities.map(() => 
        '(h.city LIKE ? OR h.address LIKE ?)'
      ).join(' OR ');
      countQuery += ` AND (${conditions})`;
      cities.forEach(city => {
        const searchPattern = `%${city}%`;
        countParams.push(searchPattern, searchPattern);
      });
    }
    if (guests) {
      countQuery += ' AND h.accommodates >= ?';
      countParams.push(guests);
    }
    if (priceMin) {
      countQuery += ' AND h.price_per_night >= ?';
      countParams.push(priceMin);
    }
    if (priceMax) {
      countQuery += ' AND h.price_per_night <= ?';
      countParams.push(priceMax);
    }
    if (starRating) {
      countQuery += ' AND h.star_rating >= ?';
      countParams.push(starRating);
    }
    if (propertyType) {
      countQuery += ' AND h.room_type = ?';
      countParams.push(propertyType);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    // Enrich hotels with review data and images from MongoDB
    const enrichedHotels = await Promise.all(rows.map(async (hotel) => {
      try {
        // Parse amenities string into array
        const amenitiesList = hotel.hotel_amenities_list ? hotel.hotel_amenities_list.split('|||') : [];
        
        // Get images from picture_url field
        const hotelImages = hotel.picture_url ? [hotel.picture_url] : [];
        
        if (!db) {
          return { 
            ...hotel, 
            review_count: 0, 
            recent_reviews: [],
            amenities: amenitiesList,
            images: hotelImages
          };
        }
        
        const reviewsCollection = db.collection('reviews');
        const imagesCollection = db.collection('images');
        
        // Convert listing_id to integer for MongoDB query (it's stored as string in MySQL)
        const listingIdInt = parseInt(hotel.listing_id);
        if (isNaN(listingIdInt)) {
          return { 
            ...hotel, 
            review_count: 0, 
            recent_reviews: [],
            amenities: amenitiesList,
            images: hotelImages
          };
        }
        
        // Get review count
        const reviewCount = await reviewsCollection.countDocuments({ listing_id: listingIdInt });
        
        // Get recent reviews
        const recentReviews = await reviewsCollection
          .find({ listing_id: listingIdInt })
          .sort({ date: -1 })
          .limit(3)
          .project({ reviewer_name: 1, comments: 1, date: 1, _id: 0 })
          .toArray();
        
        // Get additional images from MongoDB if available, otherwise use MySQL images
        const imageDoc = await imagesCollection.findOne({ listing_id: listingIdInt });
        const images = imageDoc?.picture_url ? [imageDoc.picture_url, ...hotelImages] : hotelImages;
        
        return {
          ...hotel,
          review_count: reviewCount,
          recent_reviews: recentReviews,
          amenities: amenitiesList,
          images
        };
      } catch (error) {
        console.error(`Error enriching hotel ${hotel.hotel_id} with reviews:`, error);
        const amenitiesList = hotel.hotel_amenities_list ? hotel.hotel_amenities_list.split('|||') : [];
        const hotelImages = hotel.picture_url ? [hotel.picture_url] : [];
        return { 
          ...hotel, 
          review_count: 0, 
          recent_reviews: [],
          amenities: amenitiesList,
          images: hotelImages
        };
      }
    }));

    return {
      hotels: enrichedHotels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM hotels WHERE hotel_id = ?', [id]);
    return rows[0];
  },

  async findByIdWithDetails(id) {
    // Get hotel data
    const hotel = await this.findById(id);
    if (!hotel) return null;

    // Get reviews and images from MongoDB
    try {
      const db = await initMongo();
      const reviewsCollection = db.collection('reviews');
      const imagesCollection = db.collection('images');

      // Convert listing_id to integer
      const listingIdInt = parseInt(hotel.listing_id);

      const reviews = await reviewsCollection
        .find({ listing_id: listingIdInt })
        .sort({ date: -1 })
        .limit(10)
        .toArray();

      // Get additional image from MongoDB if available
      const imageDoc = await imagesCollection.findOne({ listing_id: listingIdInt });
      const hotelImages = hotel.picture_url ? [hotel.picture_url] : [];
      const images = imageDoc?.picture_url ? [imageDoc.picture_url, ...hotelImages] : hotelImages;

      // Get amenities directly from hotel_amenities table
      const [amenitiesRows] = await pool.execute(`
        SELECT DISTINCT amenity
        FROM hotel_amenities
        WHERE hotel_id = ?
      `, [hotel.hotel_id]);

      return {
        ...hotel,
        reviews: reviews || [],
        images,
        amenities: amenitiesRows.map(row => row.amenity) || []
      };
    } catch (error) {
      console.error('Error fetching hotel details:', error);
      const hotelImages = hotel.picture_url ? [hotel.picture_url] : [];
      return {
        ...hotel,
        reviews: [],
        images: hotelImages,
        amenities: []
      };
    }
  },

  async update(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates).map(val =>
      (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val
    );
    values.push(id);

    if (fields.length === 0) return null;

    const query = `UPDATE hotels SET ${fields} WHERE hotel_id = ?`;
    await pool.execute(query, values);

    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('UPDATE hotels SET has_availability = 0 WHERE hotel_id = ?', [id]);
    return true;
  },

  async updateStatus(id, status) {
    const query = status === 'active'
      ? 'UPDATE hotels SET has_availability = 1 WHERE hotel_id = ?'
      : 'UPDATE hotels SET has_availability = 0 WHERE hotel_id = ?';
    
    await pool.execute(query, [id]);
    return this.findById(id);
  }
};

module.exports = HotelModel;

