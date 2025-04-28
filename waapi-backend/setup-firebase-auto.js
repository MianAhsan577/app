/**
 * Script to automatically set up Firebase configuration without user interaction
 * Run with: node setup-firebase-auto.js
 */

const fs = require('fs');
const path = require('path');

// Path to the .env file
const envFilePath = path.join(__dirname, '.env');

// Create default .env content
const envFileContent = `# Port for the server
PORT=5003

# WhatsApp API credentials
WAAPI_API_KEY=ElmIqYY1UDP5D1Pu1XxisjeAvPzCJBVMXT2usuGj49ca7e2c
WAAPI_BASE_URL=https://waapi.app/api
TEST_NUMBER=+923131444779

# JWT secret for authentication
JWT_SECRET=spirit-whatsapp-jwt-secret-2023

# Environment (development or production)
NODE_ENV=development

# Support phone numbers for each city and service type (include country code)
SUPPORT_LAHORE_OFFICE=+923001234567
SUPPORT_LAHORE_HOME=+923001234568
SUPPORT_ISLAMABAD_OFFICE=+923001234569
SUPPORT_ISLAMABAD_HOME=+923001234570
SUPPORT_KARACHI_OFFICE=+923001234571
SUPPORT_KARACHI_HOME=+923001234572

# Firebase configuration
FIREBASE_API_KEY=AIzaSyBuYYsGnKOOPQNaNjzx_2RX3ldTPJ6-B5o
FIREBASE_AUTH_DOMAIN=spiritfurniture-9be96.firebaseapp.com
FIREBASE_PROJECT_ID=spiritfurniture-9be96
FIREBASE_STORAGE_BUCKET=spiritfurniture-9be96.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=335228931088
FIREBASE_APP_ID=1:335228931088:web:5710e7937e238d4b318e95

# Set to 'true' to use Firebase Emulator for local development
USE_FIREBASE_EMULATOR=true
`;

// Check if .env file exists and delete it if it does
if (fs.existsSync(envFilePath)) {
  console.log('Found existing .env file. Removing it...');
  fs.unlinkSync(envFilePath);
  console.log('Existing .env file removed.');
}

// Write the new .env file
fs.writeFileSync(envFilePath, envFileContent);
console.log('\n✅ New .env file has been created.');
console.log('You can now run your application with the updated configuration.'); 