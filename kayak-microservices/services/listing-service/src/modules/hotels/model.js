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
      name, address, city, state, zip_code, star_rating,
      price_per_night, num_rooms, room_type, amenities
    } = hotelData;

    const id = uuidv4();
    const query = `
      INSERT INTO hotels 
      (id, name, address, city, state, zip_code, star_rating, price_per_night, num_rooms, room_type, amenities) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(query, [
      id, name, address, city, state, zip_code, star_rating,
      price_per_night, num_rooms, room_type, JSON.stringify(amenities)
    ]);

    return { id, ...hotelData };
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
        (SELECT COUNT(*) FROM hotel_amenities ha WHERE ha.hotel_id = h.hotel_id) as amenity_count
      FROM hotels h
      WHERE h.has_availability = TRUE
    `;
    const params = [];

    // Initialize MongoDB connection
    let db = null;
    try {
      db = await initMongo();
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }

    // Multiple cities search
    if (cities.length > 0) {
      const placeholders = cities.map(() => '?').join(',');
      query += ` AND h.city IN (${placeholders})`;
      cities.forEach(city => params.push(city));
    }

    // Guest capacity
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

    // Property type
    if (propertyType) {
      query += ' AND h.property_type = ?';
      params.push(propertyType);
    }

    // Amenities filter (hotel must have ALL specified amenities)
    if (amenities.length > 0) {
      const amenPlaceholders = amenities.map(() => '?').join(',');
      query += ` AND h.hotel_id IN (
        SELECT ha.hotel_id 
        FROM hotel_amenities ha
        JOIN amenities a ON ha.amenity_id = a.amenity_id
        WHERE a.amenity_name IN (${amenPlaceholders})
        GROUP BY ha.hotel_id
        HAVING COUNT(DISTINCT a.amenity_id) = ?
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
        query += ' ORDER BY h.star_rating DESC, h.number_of_reviews DESC';
        break;
      default:
        query += ' ORDER BY h.star_rating DESC';
    }

    // Pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(DISTINCT h.hotel_id) as total FROM hotels h WHERE h.has_availability = TRUE';
    const countParams = [];
    
    if (cities.length > 0) {
      const placeholders = cities.map(() => '?').join(',');
      countQuery += ` AND h.city IN (${placeholders})`;
      cities.forEach(city => countParams.push(city));
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
      countQuery += ' AND h.property_type = ?';
      countParams.push(propertyType);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    // Enrich hotels with review data from MongoDB
    const enrichedHotels = await Promise.all(rows.map(async (hotel) => {
      try {
        if (!db) {
          return { ...hotel, review_count: 0, recent_reviews: [] };
        }
        
        const reviewsCollection = db.collection('reviews');
        
        // Convert listing_id to integer for MongoDB query (it's stored as string in MySQL)
        const listingIdInt = parseInt(hotel.listing_id);
        if (isNaN(listingIdInt)) {
          return { ...hotel, review_count: 0, recent_reviews: [] };
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
        
        return {
          ...hotel,
          review_count: reviewCount,
          recent_reviews: recentReviews
        };
      } catch (error) {
        console.error(`Error enriching hotel ${hotel.hotel_id} with reviews:`, error);
        return { ...hotel, review_count: 0, recent_reviews: [] };
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

    // Get reviews from MongoDB
    try {
      const db = await initMongo();
      const reviewsCollection = db.collection('reviews');
      const imagesCollection = db.collection('hotel_images');

      const reviews = await reviewsCollection
        .find({ listing_id: hotel.listing_id })
        .sort({ review_date: -1 })
        .limit(10)
        .toArray();

      const images = await imagesCollection
        .findOne({ hotel_id: hotel.hotel_id });

      // Get amenities
      const [amenitiesRows] = await pool.execute(`
        SELECT a.amenity_name, a.amenity_category, a.icon
        FROM hotel_amenities ha
        JOIN amenities a ON ha.amenity_id = a.amenity_id
        WHERE ha.hotel_id = ?
      `, [id]);

      return {
        ...hotel,
        reviews: reviews || [],
        images: images?.images || [],
        amenities: amenitiesRows || []
      };
    } catch (error) {
      console.error('Error fetching hotel details:', error);
      return hotel; // Return basic hotel data if MongoDB fails
    }
  },

  async update(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates).map(val =>
      (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val
    );
    values.push(id);

    if (fields.length === 0) return null;

    const query = `UPDATE hotels SET ${fields} WHERE id = ?`;
    await pool.execute(query, values);

    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('UPDATE hotels SET deleted_at = NOW() WHERE id = ?', [id]);
    return true;
  },

  async updateStatus(id, status) {
    const query = status === 'active'
      ? 'UPDATE hotels SET deleted_at = NULL WHERE id = ?'
      : 'UPDATE hotels SET deleted_at = NOW() WHERE id = ?';
    
    await pool.execute(query, [id]);
    return this.findById(id);
  }
};

module.exports = HotelModel;

