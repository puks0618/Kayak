/**
 * Shared Validation Utilities
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const validatePrice = (price) => {
  return typeof price === 'number' && price >= 0;
};

const validateDate = (date) => {
  const parsed = new Date(date);
  return parsed instanceof Date && !isNaN(parsed);
};

module.exports = {
  validateEmail,
  validateUUID,
  validatePrice,
  validateDate
};

