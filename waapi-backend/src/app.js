const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { selectionRoutes, authRoutes, adminRoutes } = require('./routes');
const { startRealTimeLogs } = require('./controllers/admin.controller');
const { isUsingFirebase } = require('./utils/memoryStore');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Initialize storage without sample data
if (isUsingFirebase()) {
  console.log('Firebase initialized successfully. Using Firestore for data storage.');
} else {
  console.log('Using in-memory storage. No sample logs added.');
}

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', selectionRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Initialize real-time logs
startRealTimeLogs(app);

// Default route
app.get('/', (req, res) => {
  res.send('Spirit Furniture Backend is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// This file doesn't actually start the server - it exports the app
// The server is started in index.js
module.exports = app; 