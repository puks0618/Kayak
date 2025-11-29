/**
 * Flight Routes
 */

const express = require('express');
const router = express.Router();
const flightController = require('./controller');

router.get('/', flightController.getAll);
router.get('/:id', flightController.getById);
router.post('/', flightController.create);
router.patch('/:id', flightController.update);
router.delete('/:id', flightController.delete);

module.exports = router;

