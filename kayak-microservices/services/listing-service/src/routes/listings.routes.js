/**
 * Admin Listings Routes
 * Unified route for managing all listing types
 */

const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listings.controller');

// Get all listings with type filtering
router.get('/', listingsController.getAll);

// Update listing status (activate/deactivate)
router.put('/:type/:id/status', listingsController.updateStatus);

// Delete listing
router.delete('/:type/:id', listingsController.delete);

module.exports = router;
