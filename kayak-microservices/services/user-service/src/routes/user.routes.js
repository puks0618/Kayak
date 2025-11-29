/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// User CRUD
router.post('/', userController.create);
router.get('/:id', userController.getById);
router.patch('/:id', userController.update);
router.delete('/:id', userController.delete);

// Profile routes
router.get('/me/profile', userController.getProfile);
router.patch('/me/profile', userController.updateProfile);

module.exports = router;

