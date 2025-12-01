const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const adminBillController = require('../controllers/adminBill.controller');

router.use(verifyToken);
router.use(requireAdmin);

router.get('/', adminBillController.searchBills);
router.get('/:id', adminBillController.getBillById);

module.exports = router;
