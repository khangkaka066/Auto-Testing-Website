const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const ctrl = require('./billing.controller');

const router = express.Router();

router.get('/packages', authMiddleware, ctrl.getPackages);
router.post('/create-checkout', authMiddleware, ctrl.createCheckout);
router.get('/transactions', authMiddleware, ctrl.getTransactions);

// VietQR thủ công cũ, giữ lại để fallback
router.post('/create-bank-transfer', authMiddleware, ctrl.createBankTransfer);

// payOS
router.post('/create-payos-payment', authMiddleware, ctrl.createPayosPayment);
router.get('/payos/status/:orderCode', authMiddleware, ctrl.getPayosStatus);

// Webhook payOS: không dùng authMiddleware vì payOS server gọi vào
router.post('/payos/webhook', ctrl.handlePayosWebhook);

// Webhook Stripe cũ
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.handleWebhook);

module.exports = router;
