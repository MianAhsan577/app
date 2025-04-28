const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, connectFirestoreEmulator } = require('firebase/firestore');
const bcrypt = require('bcrypt');

// Firebase configuration for client SDK
const firebaseConfig = {
  apiKey: "AIzaSyBuYYsGnKOOPQNaNjzx_2RX3ldTPJ6-B5o",
  authDomain: "spiritfurniture-9be96.firebaseapp.com",
  projectId: "spiritfurniture-9be96",
  storageBucket: "spiritfurniture-9be96.firebasestorage.app",
  messagingSenderId: "335228931088",
  appId: "1:335228931088:web:5710e7937e238d4b318e95",
  measurementId: "G-1HDQRPPEQ4"
};

async function createAdminUser() {
  try {
    console.log('Initializing Firebase for emulator...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Connect to emulator
    console.log('Connecting to Firestore emulator...');
    connectFirestoreEmulator(db, 'localhost', 8080);
    
    // Admin user credentials
    const email = 'admin@example.com';
    const password = 'password123';
    
    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Admin user data
    const userData = {
      email,
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date()
    };
    
    console.log('Adding admin user to Firestore emulator...');
    
    // Add to admin_users collection
    const adminCollection = collection(db, 'admin_users');
    const userRef = await addDoc(adminCollection, userData);
    
    console.log(`Admin user created with ID: ${userRef.id}`);
    console.log('You can now login with:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    return 'Success';
  } catch (error) {
    console.error('Error creating admin user:', error);
    return error.message;
  }
}

// Execute the function
createAdminUser()
  .then(result => {
    console.log('Operation complete:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 