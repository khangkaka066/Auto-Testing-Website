const express = require('express');
const ctrl = require('./status.controller');

const router = express.Router();

router.post('/', ctrl.createStatus);
router.get('/',  ctrl.getStatuses);

module.exports = router;
