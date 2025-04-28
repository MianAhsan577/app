const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { webhookRoutes, messageRoutes, selectionRoutes, authRoutes, adminRoutes } = require('./routes');
const { startRealTimeLogs } = require('./controllers/admin.controller');
const { isUsingFirebase, limitLogs } = require('./utils/memoryStore');

// Load environment variables from .env file directly, with logging
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
console.log('File exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('File content found');
}

const result = dotenv.config({ path: envPath });
console.log('dotenv result:', result.error ? 'Error: ' + result.error : 'Success');

// Manually set environment variables if they're not set
if (!process.env.PORT) process.env.PORT = 5003;
if (!process.env.WAAPI_API_KEY) process.env.WAAPI_API_KEY = 'ElmIqYY1UDP5D1Pu1XxisjeAvPzCJBVMXT2usuGj49ca7e2c';
if (!process.env.WAAPI_BASE_URL) process.env.WAAPI_BASE_URL = 'https://waapi.app/api';
if (!process.env.TEST_NUMBER) process.env.TEST_NUMBER = '+923131444779';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'spirit-whatsapp-jwt-secret-2023';

// Set development mode for simplicity
process.env.NODE_ENV = 'development';

// Initialize Express app
const app = express();
// Force PORT to be 5003 to avoid conflicts
process.env.PORT = process.env.PORT || 5003;
const PORT = 5003;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/webhook', webhookRoutes);
app.use('/send-initial-message', messageRoutes);
app.use('/api', selectionRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Initialize real-time logs
const adminController = require('./controllers/admin.controller');
adminController.startRealTimeLogs(app);

// Add explicit route for SSE endpoint - recommended for clarity
app.get('/api/admin/logs/sse', adminController.sseLogsEndpoint);

// Initialize storage
console.log('Initializing storage...');
// Limit logs to maintain reasonable collection size
limitLogs(7).then(() => {
  if (isUsingFirebase()) {
    console.log('Firebase initialized successfully. Using Firestore for data storage.');
  } else {
    console.log('Using in-memory storage. Logs limited to 7 entries.');
  }
}).catch(err => {
  console.error('Error initializing storage:', err);
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'WhatsApp API server is running',
    storage: isUsingFirebase() ? 'Firebase Firestore' : 'In-Memory'
  });
});

// Instances route
app.get('/instances', async (req, res) => {
  try {
    // Import here to avoid circular dependency
    const { getInstances } = require('./services/waapi.service');
    const instances = await getInstances();
    res.status(200).json({ status: 'success', instances });
  } catch (error) {
    console.error('Error getting instances:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Serve the index.html for admin panel
app.get('/admin-panel*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Serve the index.html for all other routes (for SPA navigation)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server available at http://localhost:${PORT}`);
  console.log(`Admin dashboard available at http://localhost:${PORT}/admin-panel`);
  console.log(`Development mode enabled. You can login with:`);
  console.log(`Email: admin@example.com`);
  console.log(`Password: password123`);
});

module.exports = app; 