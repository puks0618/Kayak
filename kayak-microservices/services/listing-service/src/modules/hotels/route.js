/**
 * Hotel Routes
 */

const express = require('express');
const router = express.Router();
const hotelController = require('./controller');

// Public search endpoint
router.post('/search', hotelController.search.bind(hotelController));

// CRUD endpoints
router.get('/', hotelController.getAll);
router.get('/:id', hotelController.getById);
router.post('/', hotelController.create);
router.patch('/:id', hotelController.update);
router.delete('/:id', hotelController.delete);

module.exports = router;

