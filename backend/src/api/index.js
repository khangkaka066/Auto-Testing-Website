const express = require('express');

const router = express.Router();

router.get('/', (req, res) => res.json({ message: 'TestPilot API is running' }));
router.use('/auth',   require('./auth/auth.routes'));
router.use('/test',   require('./test/test.routes'));
router.use('/status', require('./status/status.routes'));

module.exports = router;
