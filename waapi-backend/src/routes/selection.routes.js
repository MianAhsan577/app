const express = require('express');
const router = express.Router();
const { logSelectionData } = require('../controllers/selection.controller');

// Log selection data from the popup interface
router.post('/log-selection', logSelectionData);

module.exports = router; 