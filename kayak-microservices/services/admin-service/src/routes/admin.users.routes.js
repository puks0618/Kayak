const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const adminUserController = require('../controllers/adminUser.controller');

router.use(verifyToken);
router.use(requireAdmin);

router.get('/', adminUserController.getAllUsers);
router.get('/:id', adminUserController.getUserById);
router.put('/:id', adminUserController.updateUser);
router.patch('/:id/status', adminUserController.updateUserStatus);

module.exports = router;
