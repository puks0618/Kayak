const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const adminCarController = require('../controllers/adminCar.controller');

router.use(verifyToken);
router.use(requireAdmin);

router.get('/', adminCarController.getAllCars);
router.get('/:id', adminCarController.getCarById);
router.post('/', adminCarController.createCar);
router.put('/:id', adminCarController.updateCar);
router.delete('/:id', adminCarController.deleteCar);

module.exports = router;
