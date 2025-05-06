// Configuration for support number mapping
const supportNumbers = {
    lahore_office: '+923249988114',     // SUPPORT_LAHORE_OFFICE
    lahore_home: '+923178882070',       // SUPPORT_LAHORE_HOME
    islamabad_office: '+923185600656',  // SUPPORT_ISLAMABAD_OFFICE
    islamabad_home: '+923219314424',    // SUPPORT_ISLAMABAD_HOME
    karachi_office: '+923249988114',    // SUPPORT_KARACHI_OFFICE - Same as Lahore
    karachi_home: '+923178882070'       // SUPPORT_KARACHI_HOME - Same as Lahore
};

// Agent names for support numbers
const agentNames = {
    '+923185600656': 'Fawad Khan',  // Islamabad office
    '+923219314424': 'Ali Hassan',   // Islamabad home
    '+923249988114': 'Junaid',       // Lahore/Karachi office
    '+923178882070': 'Khadija',      // Lahore/Karachi home
};

// Track user selections
let selectedCity = null;
let selectedService = null;

// DOM elements
let step1Element;
let step2Element;
let backButton;

// Wait for DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    step1Element = document.getElementById('step1');
    step2Element = document.getElementById('step2');
    backButton = document.getElementById('backButton');
    
    // Add event listeners to city options
    const cityOptions = document.querySelectorAll('#step1 .option');
    cityOptions.forEach(option => {
        option.addEventListener('click', function() {
            selectCity(this.dataset.value);
        });
    });
    
    // Add event listeners to service options
    const serviceOptions = document.querySelectorAll('#step2 .option');
    serviceOptions.forEach(option => {
        option.addEventListener('click', function() {
            selectService(this.dataset.value);
        });
    });
    
    // Add event listener to back button
    backButton.addEventListener('click', goBackToStep1);
    
    console.log('Selection interface initialized successfully');
});

/**
 * Handle city selection
 * @param {string} city - Selected city (lahore or islamabad)
 */
function selectCity(city) {
    // Update UI
    selectedCity = city;
    const options = document.querySelectorAll('#step1 .option');
    options.forEach(option => {
        if (option.dataset.value === city) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    
    console.log('City selected:', city);
    
    // Show service selection step
    setTimeout(() => {
        step1Element.classList.remove('active');
        step2Element.classList.add('active');
    }, 300);
}

/**
 * Go back to city selection step
 */
function goBackToStep1() {
    console.log('Going back to city selection');
    
    // Reset service selection
    const serviceOptions = document.querySelectorAll('#step2 .option');
    serviceOptions.forEach(option => {
        option.classList.remove('selected');
    });
    selectedService = null;
    
    // Show city selection step
    step2Element.classList.remove('active');
    step1Element.classList.add('active');
}

/**
 * Handle service selection and redirect to WhatsApp
 * @param {string} service - Selected service (office or home)
 */
function selectService(service) {
    if (!selectedCity) {
        console.error('No city selected');
        return;
    }
    
    selectedService = service;
    console.log('Service selected:', service);
    
    // Update UI
    const options = document.querySelectorAll('#step2 .option');
    options.forEach(option => {
        if (option.dataset.value === service) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    
    // Create the key for support number lookup
    const key = `${selectedCity}_${selectedService}`;
    const supportNumber = supportNumbers[key];
    
    if (!supportNumber) {
        console.error('Support number not found for', key);
        return;
    }
    
    console.log('Redirecting to WhatsApp with support number:', supportNumber);
    
    // Log the selection to the server
    logSelection(selectedCity, selectedService, supportNumber);
    
    // Redirect to WhatsApp after a brief delay
    setTimeout(() => {
        redirectToWhatsApp(supportNumber);
    }, 500);
}

/**
 * Log the user's selection to the server
 * @param {string} city - Selected city
 * @param {string} service - Selected service
 * @param {string} supportNumber - Support number
 */
function logSelection(city, service, supportNumber) {
    // Get UTM parameters from URL
    const utmParams = getUtmParams();
    
    fetch('/api/log-selection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            city,
            service,
            supportNumber,
            agentName: agentNames[supportNumber] || 'Unknown Agent',
            utmParams,
            timestamp: new Date().toISOString()
        })
    }).catch(error => {
        console.error('Error logging selection:', error);
        // Continue with redirection even if logging fails
    });
}

/**
 * Redirect to WhatsApp with the support number and pre-filled message
 * @param {string} supportNumber - WhatsApp number to message
 */
function redirectToWhatsApp(supportNumber) {
    // Format the support number (remove + if present)
    const formattedNumber = supportNumber.replace('+', '');
    
    // Create pre-filled message based on selection
    const cityName = selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1);
    const serviceName = selectedService === 'office' ? 'Office Furniture' : 'Home Furniture';
    
    const message = encodeURIComponent(
        `Hello! I'm interested in ${serviceName} in ${cityName}. Can you provide more information?`
    );
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`;
    
    console.log('Redirecting to:', whatsappUrl);
    
    // Redirect to WhatsApp
    window.location.href = whatsappUrl;
}

/**
 * Extract UTM parameters from URL for analytics
 * @returns {Object} - UTM parameters
 */
function getUtmParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {};
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
        if (urlParams.has(param)) {
            utmParams[param] = urlParams.get(param);
        }
    });
    
    return utmParams;
} 