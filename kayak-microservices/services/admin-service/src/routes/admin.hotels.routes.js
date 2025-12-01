/**
 * Admin Hotels Routes
 * Protected CRUD operations for hotels
 */

const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const adminHotelController = require('../controllers/adminHotel.controller');

// Apply authentication and admin authorization
router.use(verifyToken);
router.use(requireAdmin);

// Hotel CRUD endpoints
router.get('/', adminHotelController.getAllHotels);
router.get('/:id', adminHotelController.getHotelById);
router.post('/', adminHotelController.createHotel);
router.put('/:id', adminHotelController.updateHotel);
router.delete('/:id', adminHotelController.deleteHotel);

module.exports = router;
