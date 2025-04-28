const { addDocument } = require('../utils/memoryStore');

/**
 * Get agent name based on support number
 * @param {String} phoneNumber - Support number
 * @returns {String} - Agent name
 */
function getAgentName(phoneNumber) {
  const agentMap = {
    '+923185600656': 'Fawad Khan',  // Islamabad office
    '+923219314424': 'Ali Hassan',   // Islamabad home
    '+923249988114': 'Junaid',       // Lahore/Karachi office
    '+923178882070': 'Khadija',      // Lahore/Karachi home
  };
  
  return agentMap[phoneNumber] || 'Unknown Agent';
}

/**
 * Log selection data from the popup interface
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response object
 */
const logSelectionData = async (req, res) => {
  try {
    const { city, service, supportNumber, utmParams, timestamp } = req.body;
    
    // Log the selection data for debugging
    console.log('Received selection data:', {
      city,
      service,
      supportNumber,
      utmParams,
      timestamp
    });
    
    // Convert selection format
    const selectedCity = city.charAt(0).toUpperCase() + city.slice(1);
    const selectedService = service === 'office' ? 'Office Furniture' : 'Home Furniture';
    
    // Get agent name for this support number
    const agentName = getAgentName(supportNumber);
    
    // Create data object
    const data = {
      phone: 'popup_selection', // Using a placeholder since we don't have the user's phone number yet
      selectedCity,
      selectedService,
      supportNumber,
      agentName,  // Add agent name
      timestamp: timestamp || new Date(),
      source: 'popup_interface',
    };
    
    // Add UTM parameters if provided
    if (utmParams && Object.keys(utmParams).length > 0) {
      data.utm = utmParams;
    }
    
    // Log to memory store
    try {
      // Add to both collections for consistency
      await addDocument('user_interactions', data);
      await addDocument('logs', data);
      console.log('Selection logged to memory store');
    } catch (error) {
      console.error('Error logging to memory store:', error.message);
      // Continue execution even if logging fails
    }
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Selection logged successfully'
    });
  } catch (error) {
    console.error('Error logging selection:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  logSelectionData
}; 