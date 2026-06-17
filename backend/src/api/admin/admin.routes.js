const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const { adminMiddleware } = require('../../middleware/adminMiddleware');
const ctrl = require('./admin.controller');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats',                  ctrl.getStats);
router.get('/charts',                 ctrl.getChartData);
router.get('/recent-activity',        ctrl.getRecentActivity);
router.get('/users',                  ctrl.getUsers);
router.get('/transactions',           ctrl.getTransactions);
router.get('/reviews',                ctrl.getReviews);
router.get('/chat/sessions',          ctrl.getChatSessions);
router.get('/chat/messages/:sessionId', ctrl.getChatMessages);
router.post('/chat/reply',            ctrl.adminReply);
router.patch('/chat/sessions/:id/close', ctrl.closeSession);

module.exports = router;
