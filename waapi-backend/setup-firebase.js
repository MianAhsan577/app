/**
 * Script to set up Firebase configuration
 * Run with: node setup-firebase.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask a question and get user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Path to the .env file
const envFilePath = path.join(__dirname, '.env');

// Check if .env file exists
async function main() {
  console.log('✨ Firebase Configuration Setup ✨');
  console.log('--------------------------------');
  console.log('This script will help you set up your Firebase configuration.');
  console.log('You will need to provide your Firebase project details.');
  console.log('You can find these in your Firebase console: https://console.firebase.google.com/');
  console.log('--------------------------------');

  // Read existing .env file if it exists
  let envFileContent = '';
  if (fs.existsSync(envFilePath)) {
    envFileContent = fs.readFileSync(envFilePath, 'utf8');
    console.log('Found existing .env file. We will update the Firebase configuration.');
  } else {
    console.log('No .env file found. We will create a new one.');
    // Create default .env content
    envFileContent = `# Port for the server
PORT=5003

# WhatsApp API credentials
WAAPI_API_KEY=ElmIqYY1UDP5D1Pu1XxisjeAvPzCJBVMXT2usuGj49ca7e2c
WAAPI_BASE_URL=https://waapi.app/api
TEST_NUMBER=+923131444779

# JWT secret for authentication
JWT_SECRET=spirit-whatsapp-jwt-secret-2023

# Environment (development or production)
NODE_ENV=development

`;
  }

  // Ask for Firebase configuration
  console.log('\nPlease enter your Firebase project details:');
  const apiKey = await askQuestion('Firebase API Key: ');
  const authDomain = await askQuestion('Firebase Auth Domain (e.g., your-project-id.firebaseapp.com): ');
  const projectId = await askQuestion('Firebase Project ID: ');
  const storageBucket = await askQuestion('Firebase Storage Bucket (e.g., your-project-id.appspot.com): ');
  const messagingSenderId = await askQuestion('Firebase Messaging Sender ID: ');
  const appId = await askQuestion('Firebase App ID: ');

  // Ask if user wants to use Firebase Emulator
  const useEmulator = await askQuestion('Do you want to use Firebase Emulator for local development? (yes/no): ');
  const useEmulatorValue = useEmulator.toLowerCase() === 'yes' ? 'true' : 'false';

  // Firebase configuration content
  const firebaseConfig = `
# Firebase configuration
FIREBASE_API_KEY=${apiKey}
FIREBASE_AUTH_DOMAIN=${authDomain}
FIREBASE_PROJECT_ID=${projectId}
FIREBASE_STORAGE_BUCKET=${storageBucket}
FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
FIREBASE_APP_ID=${appId}

# Set to 'true' to use Firebase Emulator for local development
USE_FIREBASE_EMULATOR=${useEmulatorValue}
`;

  // Update or add Firebase configuration in the .env file
  if (envFileContent.includes('FIREBASE_API_KEY=')) {
    // Replace existing Firebase configuration
    const regex = /(FIREBASE_API_KEY=.*\n)?(FIREBASE_AUTH_DOMAIN=.*\n)?(FIREBASE_PROJECT_ID=.*\n)?(FIREBASE_STORAGE_BUCKET=.*\n)?(FIREBASE_MESSAGING_SENDER_ID=.*\n)?(FIREBASE_APP_ID=.*\n)?(USE_FIREBASE_EMULATOR=.*\n)?/;
    envFileContent = envFileContent.replace(regex, firebaseConfig);
  } else {
    // Add new Firebase configuration
    envFileContent += firebaseConfig;
  }

  // Write updated .env file
  fs.writeFileSync(envFilePath, envFileContent);

  console.log('\n✅ Firebase configuration has been saved to .env file.');
  console.log('You can now run your application with Firebase support.');
  console.log('\nTo start your application:');
  console.log('npm start');
  console.log('\nIf you need to update this configuration later, run this script again:');
  console.log('node setup-firebase.js');

  rl.close();
}

main().catch(console.error); 