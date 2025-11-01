const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Router management
router.get('/routers', adminController.getRouters);
router.post('/routers', adminController.createRouter);
router.put('/routers/:id', adminController.updateRouter);
router.delete('/routers/:id', adminController.deleteRouter);
router.get('/routers/:id/test', adminController.testRouterConnection);

// Package management
router.get('/packages', adminController.getPackages);
router.post('/packages', adminController.createPackage);
router.put('/packages/:id', adminController.updatePackage);
router.delete('/packages/:id', adminController.deletePackage);

// Payment management
router.get('/payments', adminController.getPayments);
router.get('/payments/stats', adminController.getPaymentStats);

// Voucher management
router.get('/vouchers', adminController.getVouchers);
router.get('/vouchers/stats', adminController.getVoucherStats);

// SMS management
router.get('/sms/logs', adminController.getSmsLogs);
router.get('/sms/stats', adminController.getSmsStats);
router.get('/sms/balance', adminController.checkSmsBalance);

module.exports = router;