const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Public routes (customer-facing)
router.post('/initiate', paymentController.initiatePayment);
router.get('/status/:transactionId', paymentController.checkPaymentStatus);

// Callback routes (from payment providers)
router.post('/airtel/callback', paymentController.airtelCallback);
router.post('/mtn/callback', paymentController.mtnCallback);

module.exports = router;