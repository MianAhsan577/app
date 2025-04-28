const express = require('express');
const { Readable } = require('stream');
const { v4: uuidv4 } = require('uuid');
const { addDocument, getDocuments, clearCollection, isUsingFirebase, limitLogs } = require('../utils/memoryStore');

// Connected clients for SSE
const clients = new Set();

/**
 * Simple function to directly show all logs without complex filtering
 * This is a simplified approach that will always return fresh logs
 */
const showAllLogs = async (req, res) => {
  try {
    console.log('Fetching all logs with simple method');
    
    // Set cache-control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    // Get logs directly from memory store
    const logs = await getDocuments('logs');
    
    // Sort by timestamp descending (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    console.log(`Returning ${logs.length} logs with simple method`);
    
    // Return simple data structure
    res.json({
      success: true,
      data: logs,
      totalCount: logs.length
    });
  } catch (error) {
    console.error('Error fetching logs with simple method:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch logs',
      message: error.message
    });
  }
};

/**
 * Get logs with pagination and filters
 */
const getLogs = async (req, res, isSSE = false) => {
  try {
    // Set cache-control headers to prevent browser caching
    if (res && !isSSE) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    
    const { page = 1, limit = 20, search, startDate, endDate, status, city, service } = req.query;
    const actualLimit = Math.min(parseInt(limit), 50); // Cap at 50 max logs
    
    console.log(`Getting logs with page: ${page}, limit: ${actualLimit}, filters: city="${city || ''}", service="${service || ''}"`);
    
    // Get all logs from memory store
    let logs = await getDocuments('logs');
    console.log(`Retrieved ${logs.length} total logs before filtering`);
    
    // Ensure each log has an ID for future operations
    logs.forEach((log, index) => {
      if (!log.id) {
        log.id = `log-${Date.now()}-${index}`;
      }
    });
    
    // Take only the first 100 logs to prevent performance issues
    if (logs.length > 100) {
      console.log(`Trimming logs from ${logs.length} to 100 to improve performance`);
      logs = logs.slice(0, 100);
    }
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(log => 
        (log.customerName && log.customerName.toLowerCase().includes(searchLower)) ||
        (log.companyName && log.companyName.toLowerCase().includes(searchLower)) ||
        (log.phone && log.phone.includes(search)) ||
        (log.inquiryDetails && log.inquiryDetails.toLowerCase().includes(searchLower))
      );
      console.log(`After search filter "${search}": ${logs.length} logs remain`);
    }
    
    if (startDate) {
      const start = new Date(startDate);
      logs = logs.filter(log => new Date(log.timestamp) >= start);
      console.log(`After startDate filter "${startDate}": ${logs.length} logs remain`);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of the day
      logs = logs.filter(log => new Date(log.timestamp) <= end);
      console.log(`After endDate filter "${endDate}": ${logs.length} logs remain`);
    }
    
    if (status) {
      logs = logs.filter(log => log.status === status);
      console.log(`After status filter "${status}": ${logs.length} logs remain`);
    }
    
    // Apply city filter if present
    if (city && city.trim() !== '') {
      console.log(`Applying city filter for "${city}"`);
      logs = logs.filter(log => {
        const logCity = log.selectedCity || '';
        const isMatch = logCity.toLowerCase() === city.toLowerCase();
        return isMatch;
      });
      console.log(`After city filter "${city}": ${logs.length} logs remain`);
    }
    
    // Apply service filter if present
    if (service && service.trim() !== '') {
      console.log(`Applying service filter for "${service}"`);
      logs = logs.filter(log => {
        const logService = log.selectedService || '';
        const isMatch = logService.toLowerCase() === service.toLowerCase();
        return isMatch;
      });
      console.log(`After service filter "${service}": ${logs.length} logs remain`);
    }
    
    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    console.log(`After filtering and sorting: ${logs.length} logs`);
    
    // Apply pagination
    const startIndex = (page - 1) * actualLimit;
    const endIndex = startIndex + actualLimit;
    const paginatedLogs = logs.slice(startIndex, endIndex);
    console.log(`Sending ${paginatedLogs.length} logs after pagination (${startIndex}-${endIndex})`);
    
    // Return paginated results with metadata
    if (isSSE) {
      return paginatedLogs;
    } else {
      // Return logs directly without nesting to simplify frontend access
      res.json({
        success: true,
        data: paginatedLogs,
        totalCount: logs.length,
        totalPages: Math.ceil(logs.length / actualLimit),
        currentPage: parseInt(page)
      });
    }
  } catch (error) {
    console.error('Error getting logs:', error);
    if (res && !isSSE) {
      res.status(500).json({ success: false, error: 'Failed to retrieve logs' });
    }
    return [];
  }
};

/**
 * Get statistics about user interactions
 */
const getStats = async (req, res) => {
  try {
    console.log('Getting statistics for admin dashboard...');
    
    // Set cache-control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    // Get all interactions from memory store
    const interactions = await getDocuments('user_interactions');
    console.log(`Retrieved ${interactions.length} interactions for statistics`);
    
    // If no interactions are available, return empty stats
    if (interactions.length === 0) {
      console.log('No interactions found, returning empty stats');
      return res.json({
        success: true,
        totalInteractions: 0,
        uniqueUsers: 0,
        byCity: {},
        byService: {},
        bySource: {},
        byStatus: {},
        timeData: Array(7).fill(0).map((_, i) => {
          const date = new Date(new Date().getTime() - (6 - i) * 24 * 60 * 60 * 1000);
          const dateString = date.toISOString().split('T')[0];
          return {
            date: dateString,
            count: 0
          };
        })
      });
    }
    
    // Calculate total interactions
    const totalInteractions = interactions.length;
    
    // Calculate unique users (by phone number)
    const uniqueUsers = new Set(interactions.map(interaction => interaction.phone)).size;
    
    // Calculate interactions by city
    const cityCounts = {};
    interactions.forEach(interaction => {
      const city = interaction.selectedCity || 'Unknown';
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });
    
    // Calculate interactions by service
    const serviceCounts = {};
    interactions.forEach(interaction => {
      const service = interaction.selectedService || 'Unknown';
      serviceCounts[service] = (serviceCounts[service] || 0) + 1;
    });
    
    // Calculate interactions by source
    const sourceCounts = {};
    interactions.forEach(interaction => {
      const source = interaction.source || 'Unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    
    // Calculate interactions by status
    const statusCounts = {};
    interactions.forEach(interaction => {
      const status = interaction.status || 'New';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Calculate interactions over time (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const timeData = Array(7).fill(0).map((_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0];
      return {
        date: dateString,
        count: 0
      };
    });
    
    interactions.forEach(interaction => {
      if (interaction.timestamp) {
        const timestamp = new Date(interaction.timestamp);
        if (timestamp >= sevenDaysAgo) {
          const dateString = timestamp.toISOString().split('T')[0];
          const dayIndex = timeData.findIndex(day => day.date === dateString);
          if (dayIndex !== -1) {
            timeData[dayIndex].count++;
          }
        }
      }
    });
    
    const statsResponse = {
      success: true,
      totalInteractions,
      uniqueUsers,
      byCity: cityCounts,
      byService: serviceCounts,
      bySource: sourceCounts,
      byStatus: statusCounts,
      timeData
    };
    
    console.log('Successfully compiled statistics data with:', {
      totalInteractions,
      uniqueUsers,
      cities: Object.keys(cityCounts).length,
      services: Object.keys(serviceCounts).length
    });
    
    res.json(statsResponse);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve statistics',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Reset logs by adding sample logs
 */
const resetLogs = async (req, res) => {
  try {
    console.log('Completely resetting logs and user interactions...');
    
    // Clear all existing logs and user interactions
    await clearCollection('logs');
    await clearCollection('user_interactions');
    
    console.log('Collections cleared successfully');
    
    // Ensure limit
    await limitLogs(7);
    
    console.log('Sample logs limited to 7');
    
    // Broadcast updated logs to all connected clients
    setTimeout(() => {
      broadcastLogs();
    }, 500);
    
    res.json({ 
      success: true, 
      message: 'Logs reset successfully',
      count: 7
    });
  } catch (error) {
    console.error('Error resetting logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reset logs',
      message: error.message
    });
  }
};

/**
 * Limit the logs to the specified maximum number, keeping only the most recent ones
 */
const limitLogsCount = async (req, res) => {
  try {
    const maxLogs = parseInt(req.query.max || 7, 10);
    console.log(`Limiting logs to the ${maxLogs} most recent entries...`);
    
    // Force limit both collections to the most recent entries
    await limitLogs(maxLogs);
    
    console.log(`Logs limited to ${maxLogs} most recent entries successfully`);
    
    // Broadcast updated logs to all connected clients
    setTimeout(() => {
      broadcastLogs();
    }, 500);
    
    res.json({ 
      success: true, 
      message: `Logs limited to ${maxLogs} most recent entries successfully`,
      count: maxLogs
    });
  } catch (error) {
    console.error('Error limiting logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to limit logs',
      message: error.message
    });
  }
};

/**
 * Start real-time logs functionality
 * @param {Express} app - The Express app instance
 */
const startRealTimeLogs = (app) => {
  console.log('Starting real-time logs endpoint');
  // Register the SSE endpoint
  app.get('/api/admin/logs/sse', sseLogsEndpoint);
  return app;
};

/**
 * SSE endpoint for real-time logs
 */
const sseLogsEndpoint = async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  // Filter parameters
  const city = req.query.city || '';
  const service = req.query.service || '';
  
  console.log(`New SSE client connected with filters - city: ${city}, service: ${service}`);
  
  // Add client to connected clients with filters
  const client = {
    res,
    city,
    service,
    id: Date.now()
  };
  
  clients.add(client);
  console.log(`Total connected clients: ${clients.size}`);
  
  // Send initial connection confirmation
  const data = JSON.stringify({ connected: true, timestamp: new Date().toISOString() });
  res.write(`event: connected\ndata: ${data}\n\n`);
  
  // Heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    if (!res.writableEnded) {
      const heartbeat = JSON.stringify({ timestamp: new Date().toISOString() });
      res.write(`event: heartbeat\ndata: ${heartbeat}\n\n`);
    }
  }, 30000); // Send heartbeat every 30 seconds
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    removeClient(client);
  });
  
  // Handle errors
  req.on('error', (err) => {
    console.error('SSE client error:', err);
    clearInterval(heartbeatInterval);
    removeClient(client);
  });
};

/**
 * Remove a client from the connected clients list
 * @param {string} clientId - The client ID to remove
 */
const removeClient = (client) => {
  clients.delete(client);
  console.log(`Client disconnected. Total connected clients: ${clients.size}`);
};

/**
 * Send logs to all connected SSE clients
 */
const broadcastLogs = async () => {
  try {
    if (clients.size === 0) {
      return; // No clients connected
    }
    
    console.log(`Broadcasting logs to ${clients.size} client(s)`);
    
    // Send updates to each client with their specific filters
    for (const client of clients) {
      if (client.res.writableEnded) {
        removeClient(client);
        continue;
      }
      
      try {
        // Get logs based on client filters
        const logs = await getLogs({ query: { city: client.city, service: client.service } }, null, true);
        
        if (logs && logs.length > 0) {
          const message = JSON.stringify({ logs });
          client.res.write(`event: logs\ndata: ${message}\n\n`);
        }
      } catch (error) {
        console.error('Error sending SSE update to client:', error);
      }
    }
  } catch (error) {
    console.error('Error broadcasting logs:', error);
  }
};

// Start broadcasting logs every 10 seconds instead of 3
const broadcastInterval = setInterval(broadcastLogs, 10000);

// If the server is shutting down, clear interval
process.on('SIGINT', () => {
  clearInterval(broadcastInterval);
  process.exit(0);
});

/**
 * Delete selected logs by their IDs
 */
const deleteSelectedLogs = async (req, res) => {
  try {
    console.log('Delete Selected Logs endpoint called');
    console.log('Request body:', req.body);

    // Get log IDs from request
    const { logIds } = req.body;
    
    if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
      const error = 'No valid log IDs provided for deletion';
      console.error(error, { receivedValue: logIds });
      return res.status(400).json({ 
        success: false, 
        error: 'No log IDs provided for deletion',
        message: 'Please select at least one log to delete',
        receivedData: req.body
      });
    }
    
    console.log(`Attempting to delete ${logIds.length} selected logs with IDs:`, logIds);
    
    // Get all logs from both collections
    const logs = await getDocuments('logs');
    const userInteractions = await getDocuments('user_interactions');
    
    console.log(`Retrieved ${logs.length} logs and ${userInteractions.length} user interactions`);
    
    // Add IDs to logs that might not have them (for matching purposes)
    logs.forEach((log, index) => {
      if (!log.id) {
        log.id = `server-generated-${index}`;
        console.log(`Added ID to log: ${log.id}`);
      }
    });
    
    userInteractions.forEach((interaction, index) => {
      if (!interaction.id) {
        interaction.id = `server-generated-interaction-${index}`;
        console.log(`Added ID to interaction: ${interaction.id}`);
      }
    });
    
    // Display the first few logs with their IDs for debugging
    console.log('Sample logs with IDs:');
    logs.slice(0, 3).forEach(log => {
      console.log(`  Log ID: ${log.id}, City: ${log.selectedCity}, Service: ${log.selectedService}`);
    });
    
    // Filter logs to keep only those not in the deletion list
    const updatedLogs = logs.filter(log => !logIds.includes(log.id));
    const updatedUserInteractions = userInteractions.filter(interaction => !logIds.includes(interaction.id));
    
    console.log(`Filtered logs: ${logs.length} -> ${updatedLogs.length}`);
    console.log(`Filtered user interactions: ${userInteractions.length} -> ${updatedUserInteractions.length}`);
    
    // Calculate how many were actually deleted
    const deletedCount = (logs.length - updatedLogs.length) + (userInteractions.length - updatedUserInteractions.length);
    
    if (deletedCount === 0) {
      console.log('Warning: No logs matched the provided IDs for deletion');
      console.log('This could indicate a mismatch between client-side and server-side IDs');
    }
    
    // Clear collections and add back the filtered logs
    await clearCollection('logs');
    await clearCollection('user_interactions');
    
    // Add back filtered logs to collections
    console.log(`Re-adding ${updatedLogs.length} logs to 'logs' collection`);
    for (const log of updatedLogs) {
      await addDocument('logs', log);
    }
    
    console.log(`Re-adding ${updatedUserInteractions.length} logs to 'user_interactions' collection`);
    for (const interaction of updatedUserInteractions) {
      await addDocument('user_interactions', interaction);
    }
    
    console.log(`Successfully deleted ${deletedCount} logs`);
    
    // Broadcast updated logs to all connected clients
    setTimeout(() => {
      broadcastLogs();
    }, 500);
    
    res.json({ 
      success: true, 
      message: `Successfully deleted ${deletedCount} logs`,
      deletedCount,
      remainingCount: updatedLogs.length
    });
  } catch (error) {
    console.error('Error deleting selected logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete selected logs',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Export all controller functions
module.exports = {
  getLogs,
  getStats,
  resetLogs,
  limitLogsCount,
  startRealTimeLogs,
  sseLogsEndpoint,
  showAllLogs,
  deleteSelectedLogs
}; 