const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const adminFlightController = require('../controllers/adminFlight.controller');

router.use(verifyToken);
router.use(requireAdmin);

router.get('/', adminFlightController.getAllFlights);
router.get('/:id', adminFlightController.getFlightById);
router.post('/', adminFlightController.createFlight);
router.put('/:id', adminFlightController.updateFlight);
router.delete('/:id', adminFlightController.deleteFlight);

module.exports = router;
