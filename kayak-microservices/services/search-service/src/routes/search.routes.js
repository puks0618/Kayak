/**
 * Search Routes
 */

const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

// GET /api/search?type=flight&origin=NYC&destination=LAX
router.get('/', searchController.search);

// POST /api/search/advanced
router.post('/advanced', searchController.advancedSearch);

// GET /api/search/suggestions?q=new
router.get('/suggestions', searchController.suggestions);

module.exports = router;

