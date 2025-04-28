const express = require('express');
const selectionRoutes = require('./selection.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');

// Create empty routers for the missing routes
const webhookRoutes = express.Router();
const messageRoutes = express.Router();

// Default webhook handler
webhookRoutes.post('/', (req, res) => {
  console.log('Webhook received:', req.body);
  res.status(200).json({ status: 'success', message: 'Webhook received' });
});

// Default message route
messageRoutes.post('/', (req, res) => {
  console.log('Message request received:', req.body);
  res.status(200).json({ status: 'success', message: 'Message queued' });
});

module.exports = {
  webhookRoutes,
  messageRoutes,
  selectionRoutes,
  authRoutes,
  adminRoutes
}; 