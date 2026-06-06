const express = require('express');

const router = express.Router();

router.get('/', (req, res) => res.json({ message: 'TestPilot API is running' }));
router.use('/auth',    require('./auth/auth.routes'));
router.use('/auth/github', require('./github/github.routes'));
router.use('/test',    require('./test/test.routes'));
router.use('/billing', require('./billing/billing.routes'));
router.use('/status',  require('./status/status.routes'));
router.use('/contact', require('./contact/contact.routes'));

module.exports = router;
