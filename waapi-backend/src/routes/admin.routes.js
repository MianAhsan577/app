const express = require('express');
const router = express.Router();
const { getLogs, getStats, limitLogsCount, showAllLogs, deleteSelectedLogs } = require('../controllers/admin.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

/**
 * Admin routes
 * 
 * Authentication middleware temporarily disabled for testing
 */

// Get logs with complex filtering (original method)
router.get('/logs', getLogs);

// Get logs with simple approach (new simpler method)
router.get('/simple-logs', showAllLogs);

// Get stats
router.get('/stats', getStats);

// Limit the number of logs
router.post('/logs/limit', limitLogsCount);

// Delete selected logs endpoint - Make sure this route is properly registered
router.post('/logs/delete-selected', deleteSelectedLogs);

// Debug route to check if routes are registered
router.get('/routes-debug', (req, res) => {
  const routes = [];
  
  // Get all registered routes on this router
  router.stack.forEach(layer => {
    if (layer.route) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods)
        .filter(method => layer.route.methods[method])
        .map(method => method.toUpperCase());
      
      routes.push({
        path,
        methods,
        middleware: layer.route.stack.length
      });
    }
  });
  
  res.json({
    success: true,
    message: 'Debug information about registered routes',
    routes,
    routeCount: routes.length
  });
});

// Real-time logs endpoint is now set up directly when initializing the server
// This is handled by startRealTimeLogs in app.js or index.js

// Export router
module.exports = router; 