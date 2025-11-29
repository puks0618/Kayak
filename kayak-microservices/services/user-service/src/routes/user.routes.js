/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// User CRUD
// Auth routes
router.post('/register', userController.create);
router.post('/login', userController.login);

// Admin routes - get all users with filtering
router.get('/', userController.getAll);

// User CRUD
router.get('/:id', userController.getById);
router.patch('/:id', userController.update);
router.put('/:id/status', userController.updateStatus);
router.delete('/:id', userController.delete);

// Profile routes (TODO: Implement profile methods in controller)
// router.get('/me/profile', userController.getProfile);
// router.patch('/me/profile', userController.updateProfile);

module.exports = router;

