/**
 * User Storage Utilities
 * Helper functions for user-specific localStorage operations
 */

/**
 * Get user-specific favorites
 * @param {string|number} userId - User ID
 * @returns {Object} Favorites object with flights, hotels, and cars arrays
 */
export const getUserFavorites = (userId) => {
  if (!userId) return { flights: [], hotels: [], cars: [] };
  const key = `favorites_${userId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : { flights: [], hotels: [], cars: [] };
};

/**
 * Save user-specific favorites
 * @param {string|number} userId - User ID
 * @param {Object} favorites - Favorites object
 */
export const saveUserFavorites = (userId, favorites) => {
  if (!userId) return;
  const key = `favorites_${userId}`;
  localStorage.setItem(key, JSON.stringify(favorites));
};

/**
 * Add item to user favorites
 * @param {string|number} userId - User ID
 * @param {string} type - Type of favorite ('flights', 'hotels', 'cars')
 * @param {Object} item - Item to add
 * @returns {Object} Updated favorites
 */
export const addToUserFavorites = (userId, type, item) => {
  const favorites = getUserFavorites(userId);
  
  // Check if item already exists
  const exists = favorites[type]?.some(fav => fav.id === item.id);
  if (exists) return favorites;
  
  // Add timestamp
  const itemWithTimestamp = {
    ...item,
    savedAt: new Date().toISOString()
  };
  
  favorites[type] = [...(favorites[type] || []), itemWithTimestamp];
  saveUserFavorites(userId, favorites);
  return favorites;
};

/**
 * Remove item from user favorites
 * @param {string|number} userId - User ID
 * @param {string} type - Type of favorite ('flights', 'hotels', 'cars')
 * @param {string|number} itemId - ID of item to remove
 * @returns {Object} Updated favorites
 */
export const removeFromUserFavorites = (userId, type, itemId) => {
  const favorites = getUserFavorites(userId);
  favorites[type] = favorites[type]?.filter(item => item.id !== itemId) || [];
  saveUserFavorites(userId, favorites);
  return favorites;
};

/**
 * Check if item is in user favorites
 * @param {string|number} userId - User ID
 * @param {string} type - Type of favorite ('flights', 'hotels', 'cars')
 * @param {string|number} itemId - ID of item to check
 * @returns {boolean} True if item is favorited
 */
export const isUserFavorite = (userId, type, itemId) => {
  if (!userId) return false;
  const favorites = getUserFavorites(userId);
  return favorites[type]?.some(item => item.id === itemId) || false;
};

/**
 * Get user-specific bookings
 * @param {string|number} userId - User ID
 * @returns {Array} Array of booking objects
 */
export const getUserBookings = (userId) => {
  if (!userId) return [];
  const key = `bookings_${userId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Save user-specific bookings
 * @param {string|number} userId - User ID
 * @param {Array} bookings - Array of booking objects
 */
export const saveUserBookings = (userId, bookings) => {
  if (!userId) return;
  const key = `bookings_${userId}`;
  localStorage.setItem(key, JSON.stringify(bookings));
};

/**
 * Add booking to user bookings
 * @param {string|number} userId - User ID
 * @param {Object} booking - Booking object to add
 * @returns {Array} Updated bookings array
 */
export const addUserBooking = (userId, booking) => {
  const bookings = getUserBookings(userId);
  const bookingWithTimestamp = {
    ...booking,
    bookedAt: new Date().toISOString(),
    bookingId: `BK${Date.now()}`
  };
  const updatedBookings = [bookingWithTimestamp, ...bookings];
  saveUserBookings(userId, updatedBookings);
  return updatedBookings;
};

/**
 * Get booking by ID
 * @param {string|number} userId - User ID
 * @param {string} bookingId - Booking ID
 * @returns {Object|null} Booking object or null if not found
 */
export const getUserBookingById = (userId, bookingId) => {
  const bookings = getUserBookings(userId);
  return bookings.find(b => b.bookingId === bookingId) || null;
};

/**
 * Cancel user booking
 * @param {string|number} userId - User ID
 * @param {string} bookingId - Booking ID to cancel
 * @returns {Array} Updated bookings array
 */
export const cancelUserBooking = (userId, bookingId) => {
  const bookings = getUserBookings(userId);
  const updated = bookings.map(booking => 
    booking.bookingId === bookingId 
      ? { ...booking, status: 'cancelled', cancelledAt: new Date().toISOString() }
      : booking
  );
  saveUserBookings(userId, updated);
  return updated;
};

/**
 * Clear all user data (for logout)
 * @param {string|number} userId - User ID
 */
export const clearUserData = (userId) => {
  if (!userId) return;
  localStorage.removeItem(`favorites_${userId}`);
  localStorage.removeItem(`bookings_${userId}`);
};
