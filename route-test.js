const express = require('express');
const app = express();

// Import routes from your application
const { selectionRoutes, authRoutes, adminRoutes } = require('./waapi-backend/src/routes');

// Route debugging middleware
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/api', selectionRoutes);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ status: 'success', message: 'Test endpoint working' });
});

// Start server
const PORT = 5003;
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