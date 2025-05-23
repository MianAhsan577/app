const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Serve static files from the waapi-backend/public directory
app.use(express.static(path.join(__dirname, 'waapi-backend/public')));

// Import routes from your application
const routes = require('./waapi-backend/src/routes');

// Route debugging middleware
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use('/admin', routes.adminRoutes);
app.use('/auth', routes.authRoutes);
app.use('/api', routes.selectionRoutes);

// Admin panel route
app.get('/admin-panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'waapi-backend/public/admin.html'));
});

// Root route - Redirect to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'waapi-backend/public/index.html'));
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ status: 'success', message: 'Test endpoint working' });
});

// Start server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Available routes:');
  
  // Helper function to print routes
  function print(path, layer) {
    if (layer.route) {
      layer.route.stack.forEach(print.bind(null, path + layer.route.path));
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(print.bind(null, path + layer.regexp.toString().slice(2, -2)));
    } else if (layer.method) {
      console.log('%s %s', layer.method.toUpperCase(), path);
    }
  }

  app._router.stack.forEach(print.bind(null, ''));
}); 