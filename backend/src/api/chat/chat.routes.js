const express = require('express');
const ctrl = require('./chat.controller');

const router = express.Router();

// Bot chat endpoint (used by ChatWidget in bot mode — falls back to local KB on frontend if this fails)
router.post('/',                   ctrl.botChat);

router.post('/session',            ctrl.createSession);
router.post('/message',            ctrl.sendMessage);
router.get('/messages/:sessionId', ctrl.getMessages);

module.exports = router;
