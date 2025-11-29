/**
 * Car Routes
 */

const express = require('express');
const router = express.Router();
const carController = require('./controller');

router.get('/', carController.getAll);
router.get('/:id', carController.getById);
router.post('/', carController.create);
router.patch('/:id', carController.update);
router.delete('/:id', carController.delete);

module.exports = router;

