const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static('public'));

// Import routes from your application
const routes = require('./waapi-backend/src/routes');

// Route debugging middleware
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// Root route - Welcome page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Spirit WhatsApp App</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          h1 {
            color: #4a6fa5;
          }
          .endpoint {
            background-color: #f0f0f0;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Spirit WhatsApp App</h1>
          <p>Welcome to the Spirit WhatsApp Messaging Application with SMS routing capabilities!</p>
          
          <h2>Available Endpoints:</h2>
          <div class="endpoint">/test - Test endpoint</div>
          <div class="endpoint">/api - API endpoints</div>
          <div class="endpoint">/admin - Admin endpoints</div>
          <div class="endpoint">/auth - Authentication endpoints</div>
        </div>
      </body>
    </html>
  `);
});

// Mount routes
app.use('/admin', routes.adminRoutes);
app.use('/auth', routes.authRoutes);
app.use('/api', routes.selectionRoutes);

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