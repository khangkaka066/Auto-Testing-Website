const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const ctrl = require('./billing.controller');

const router = express.Router();

router.get('/packages',         authMiddleware, ctrl.getPackages);
router.post('/create-checkout', authMiddleware, ctrl.createCheckout);
router.get('/transactions',     authMiddleware, ctrl.getTransactions);

// Webhook — raw body cần thiết cho Stripe signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.handleWebhook);

module.exports = router;
