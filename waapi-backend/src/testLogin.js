const { initializeFirebase, getFirestore } = require('./config/firebase');
const { login } = require('./controllers/auth.controller');

// Initialize Firebase
initializeFirebase();

// Mock Express request and response
const req = {
  body: {
    email: 'admin@example.com',
    password: 'password123'
  }
};

const res = {
  status: function(statusCode) {
    console.log('Status code:', statusCode);
    this.statusCode = statusCode;
    return this;
  },
  json: function(data) {
    console.log('Response data:', data);
    return this;
  }
};

// Test login function
async function testLogin() {
  try {
    console.log('Testing login with:', req.body);
    await login(req, res);
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testLogin(); 