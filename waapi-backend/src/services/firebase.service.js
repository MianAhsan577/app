const { addDocument, getDocuments } = require('../utils/memoryStore');

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
 * Log user response to persistent store (memory store)
 * This is now a wrapper around the memoryStore for backward compatibility
 * @param {string} phoneNumber - User's phone number
 * @param {string} selectedOption - Option selected by the user (lahore_option, islamabad_option, lahore_office, etc.)
 * @returns {Promise<string|null>} - ID of the created document or null if error
 */
const logUserResponse = async (phoneNumber, selectedOption) => {
  try {
    console.log('Logging user response:', { phoneNumber, selectedOption });
    
    // Determine what type of selection this is (city or furniture)
    let data = {
      phoneNumber,
      selectedOption,
      timestamp: new Date(),
    };
    
    // For furniture selections, add additional metadata
    if (selectedOption.includes('_office') || selectedOption.includes('_home')) {
      const cityPrefix = selectedOption.startsWith('lahore_') ? 'Lahore' : 'Islamabad';
      const serviceType = selectedOption.includes('_office') ? 'Office Furniture' : 'Home Furniture';
      
      data.selectedCity = cityPrefix;
      data.selectedService = serviceType;
    }
    
    // Add to persistent store
    const docRef = await addDocument('user_interactions', data);
    
    console.log(`User response logged with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error logging user response:', error);
    // Return null instead of throwing an error to prevent crashing the app
    return null;
  }
};

/**
 * Log complete user interaction to persistent store (memory store)
 * This is now a wrapper around the memoryStore for backward compatibility
 * @param {string} phoneNumber - User's phone number or identifier
 * @param {string} selectedCity - City selected by the user (Lahore or Islamabad)
 * @param {string} selectedService - Service selected (Office Furniture or Home Furniture)
 * @param {string} supportNumber - Support number that was notified
 * @param {Object} utmParams - Optional UTM parameters for tracking
 * @returns {Promise<object|null>} - Reference to the created document or null if error
 */
const logCompleteInteraction = async (phoneNumber, selectedCity, selectedService, supportNumber, utmParams = {}) => {
  try {
    console.log('Logging complete interaction:', { phoneNumber, selectedCity, selectedService });
    
    // Get agent name for this support number
    const agentName = getAgentName(supportNumber);
    
    const data = {
      phone: phoneNumber,
      selectedCity,
      selectedService,
      supportNumber,
      agentName,
      timestamp: new Date(),
      source: 'popup_interface',
    };

    // Add UTM parameters if provided
    if (Object.keys(utmParams).length > 0) {
      data.utm = utmParams;
    }
    
    // Add to both collections
    const userInteraction = await addDocument('user_interactions', data);
    const logEntry = await addDocument('logs', data);
    
    console.log(`Complete interaction logged with ID: ${userInteraction.id}`);
    return userInteraction;
  } catch (error) {
    console.error('Error logging complete interaction:', error);
    return null;
  }
};

/**
 * Get user responses by phone number
 * This is now a wrapper around the memoryStore for backward compatibility
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<Array>} - Array of user response documents
 */
const getUserResponsesByPhoneNumber = async (phoneNumber) => {
  try {
    console.log('Getting user responses for phone number:', phoneNumber);
    
    // Get user responses from persistent store
    const userResponses = await getDocuments('user_interactions');
    
    // Filter by phone number
    const filteredResponses = userResponses.filter(
      response => response.phoneNumber === phoneNumber || response.phone === phoneNumber
    );
    
    // Sort by timestamp in descending order
    filteredResponses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return filteredResponses;
  } catch (error) {
    console.error('Error getting user responses:', error);
    return [];
  }
};

module.exports = {
  logUserResponse,
  logCompleteInteraction,
  getUserResponsesByPhoneNumber
}; 