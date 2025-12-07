/**
 * Flight Routes - Enhanced for Kayak Flight Search
 */

const express = require('express');
const router = express.Router();
const flightController = require('./controller');

// Search & Discovery endpoints (must come before /:id)
router.get('/search', flightController.search);      // Advanced search with filters
router.get('/deals', flightController.getDeals);     // Get flight deals
router.get('/routes', flightController.getRoutes);   // Get popular routes

// CRUD endpoints
router.get('/', flightController.getAll);            // Basic list
router.get('/:id', flightController.getById);        // Get single flight
router.post('/', flightController.create);           // Create flight
router.patch('/:id', flightController.update);       // Update flight
router.delete('/:id', flightController.delete);      // Delete flight

module.exports = router;

