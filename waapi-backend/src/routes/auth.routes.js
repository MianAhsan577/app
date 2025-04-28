const express = require('express');
const router = express.Router();
const { register, login, verifyToken } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify', authMiddleware, verifyToken);

module.exports = router; 