/**
 * Flexible data store that works with Firebase or in-memory
 * Falls back to in-memory storage if Firebase is not configured
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } = require('firebase/firestore');
const { v4: uuidv4 } = require('uuid');

// In-memory collections (used when Firebase is not available)
const collections = {
  logs: [],
  user_interactions: [],
  admin_users: []
};

// Flag to track if we're using Firebase or memory
let usingFirebase = false;
let db = null;

// Initialize Firebase if config is available
const initializeFirebase = () => {
  try {
    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyBuYYsGnKOOPQNaNjzx_2RX3ldTPJ6-B5o",
      authDomain: "spiritfurniture-9be96.firebaseapp.com",
      projectId: "spiritfurniture-9be96",
      storageBucket: "spiritfurniture-9be96.appspot.com",
      messagingSenderId: "335228931088",
      appId: "1:335228931088:web:5710e7937e238d4b318e95",
      measurementId: "G-1HDQRPPEQ4"
    };

    // Check if Firebase config is available
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.log('Firebase config not available, using in-memory storage');
      return false;
    }

    // Initialize Firebase app if not already initialized
    const app = initializeApp(firebaseConfig);

    // Get Firestore instance
    db = getFirestore(app);

    console.log('Firebase initialized successfully, using Firestore for storage');
    usingFirebase = true;
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    console.log('Falling back to in-memory storage');
    return false;
  }
};

// ... rest of the file ... 