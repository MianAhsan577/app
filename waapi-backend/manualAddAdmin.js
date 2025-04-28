require('dotenv').config();

// Set emulator configuration
process.env.FIREBASE_USE_EMULATOR = 'true';
process.env.NODE_ENV = 'development';

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, addDoc, connectFirestoreEmulator } = require('firebase/firestore');
const bcrypt = require('bcrypt');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBuYYsGnKOOPQNaNjzx_2RX3ldTPJ6-B5o",
  authDomain: "spiritfurniture-9be96.firebaseapp.com",
  projectId: "spiritfurniture-9be96",
  storageBucket: "spiritfurniture-9be96.firebasestorage.app",
  messagingSenderId: "335228931088",
  appId: "1:335228931088:web:5710e7937e238d4b318e95",
  measurementId: "G-1HDQRPPEQ4"
};

async function createAdmin() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Connect to emulator
    try {
      console.log('Connecting to Firestore emulator...');
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (error) {
      console.error('Failed to connect to emulator, might be using real Firebase:', error.message);
    }

    // Default admin credentials
    const email = 'admin@example.com';
    const password = 'password123';
    const name = 'Admin User';

    console.log(`Checking if admin user ${email} already exists...`);
    
    // Check if admin user exists
    const adminUsersCollection = collection(db, 'admin_users');
    const q = query(adminUsersCollection, where('email', '==', email));
    const userSnapshot = await getDocs(q);
    
    if (!userSnapshot.empty) {
      console.log(`Admin user ${email} already exists.`);
    } else {
      // Create a new admin user
      console.log('Creating new admin user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Admin user data
      const userData = {
        email,
        password: hashedPassword,
        name,
        role: 'admin',
        createdAt: new Date()
      };
      
      // Add to Firestore
      const docRef = await addDoc(adminUsersCollection, userData);
      
      console.log(`Admin user created with ID: ${docRef.id}`);
    }
    
    console.log('You can now login with:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    return;
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the function
createAdmin().then(() => {
  console.log('Done!');
  process.exit(0);
}); 