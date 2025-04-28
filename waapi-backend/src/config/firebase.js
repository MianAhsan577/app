// Firebase Client SDK
const { initializeApp } = require('firebase/app');
const { 
  getFirestore: getFirestoreClient, 
  collection: clientCollection, 
  getDocs: clientGetDocs, 
  addDoc: clientAddDoc, 
  query: clientQuery, 
  where: clientWhere,
  orderBy: clientOrderBy,
  limit: clientLimitQuery
} = require('firebase/firestore');

// Firebase Admin SDK
const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Path to service account file
const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

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

// Flag to track initializations
let clientInitialized = false;
let adminInitialized = false;
let clientDb = null;
let adminDb = null;
let clientApp = null;
let useEmulator = process.env.FIREBASE_USE_EMULATOR === 'true' || process.env.NODE_ENV !== 'production';

const connectToEmulator = (db) => {
  if (useEmulator) {
    // Connect to emulator if running locally
    const EMULATOR_HOST = 'localhost';
    const FIRESTORE_PORT = 8080;
    
    try {
      if (db) {
        console.log(`Connecting to Firestore emulator at ${EMULATOR_HOST}:${FIRESTORE_PORT}`);
        // Admin SDK uses connectFirestore, client SDK uses connectFirestoreEmulator
        if (adminInitialized) {
          db.settings({
            host: `${EMULATOR_HOST}:${FIRESTORE_PORT}`,
            ssl: false
          });
        }
        return true;
      }
    } catch (err) {
      console.error('Error connecting to Firestore emulator:', err);
    }
  }
  return false;
};

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  try {
    if (adminInitialized) {
      console.log('Firebase Admin already initialized');
      return adminDb;
    }

    console.log('Initializing Firebase Admin SDK...');

    // Check if we're using emulator
    if (useEmulator) {
      console.log('Using Firebase Admin with local emulator');
      // Use local emulator
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: 'spiritfurniture-9be96'
        });
      }
      adminDb = admin.firestore();
      
      // Connect to emulator
      connectToEmulator(adminDb);
      
      console.log('Firebase Admin initialized with emulator');
    } else {
      // Use real Firebase with service account
      try {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(require(serviceAccountPath))
          });
        }
        adminDb = admin.firestore();
        console.log('Firebase Admin initialized with service account');
      } catch (error) {
        console.error('Error initializing Firebase Admin with service account:', error);
        console.log('Falling back to emulator mode');
        
        // Fall back to emulator mode
        if (!admin.apps.length) {
          admin.initializeApp({
            projectId: 'spiritfurniture-9be96'
          });
        }
        adminDb = admin.firestore();
        useEmulator = true;
      }
    }
    
    adminInitialized = true;
    return adminDb;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    return null;
  }
};

// Initialize Firebase Client SDK
const initializeFirebase = () => {
  try {
    // Check if already initialized
    if (clientInitialized) {
      console.log('Firebase client already initialized');
      return clientDb;
    }

    console.log('Initializing Firebase Client SDK...');
    
    // Initialize Firebase
    clientApp = initializeApp(firebaseConfig);
    
    // Get Firestore instance
    clientDb = getFirestoreClient(clientApp);
    
    // Connect to emulator if needed
    if (useEmulator) {
      const { connectFirestoreEmulator } = require('firebase/firestore');
      try {
        console.log('Connecting Firebase client to emulator');
        connectFirestoreEmulator(clientDb, 'localhost', 8080);
      } catch (err) {
        console.error('Error connecting client to emulator:', err);
      }
    }
    
    // Confirm initialization
    console.log(`Firebase client initialized successfully with project: ${firebaseConfig.projectId}`);
    clientInitialized = true;
    
    // Also initialize admin SDK
    initializeFirebaseAdmin();
    
    return clientDb;
  } catch (error) {
    console.error('Error initializing Firebase client:', error);
    return null;
  }
};

// Get Firestore database instance (preferring Admin SDK if available)
const getFirestore = () => {
  if (!adminInitialized) {
    initializeFirebaseAdmin();
  }
  
  if (!clientInitialized && !adminDb) {
    initializeFirebase();
  }
  
  // Prefer admin SDK, fall back to client SDK
  return adminDb || clientDb;
};

// Check if Firebase/Firestore is available
const isDBAvailable = () => {
  return (adminDb !== null) || (clientDb !== null);
};

// Simulate real-time listeners using polling
const realtimeListeners = {};

// Add a real-time listener for a collection
const addRealtimeListener = (collectionName, callback) => {
  try {
    const db = getFirestore();
    if (!db) {
      console.error('Database not available for real-time listener');
      return null;
    }

    console.log(`Setting up real-time listener for ${collectionName}...`);
    
    // Create a polling interval to simulate real-time updates
    const pollInterval = setInterval(async () => {
      try {
        let docs = [];
        
        if (adminInitialized) {
          // Use Admin SDK
          const snapshot = await db.collection(collectionName).get();
          snapshot.forEach(doc => {
            docs.push({
              id: doc.id,
              ...doc.data(),
              changeType: 'added'
            });
          });
        } else {
          // Use Client SDK
          const querySnapshot = await clientGetDocs(clientCollection(clientDb, collectionName));
          querySnapshot.forEach((doc) => {
            docs.push({
              id: doc.id,
              ...doc.data(),
              changeType: 'added'
            });
          });
        }
        
        if (docs.length > 0) {
          console.log(`Polling found ${docs.length} documents in ${collectionName}`);
          callback(docs);
        }
      } catch (error) {
        console.error(`Error polling ${collectionName}:`, error);
      }
    }, 5000); // Poll every 5 seconds

    // Store the polling interval
    realtimeListeners[collectionName] = pollInterval;
    console.log(`Poll-based listener added for ${collectionName}`);
    
    // Return a function to clear the interval
    return () => clearInterval(pollInterval);
  } catch (error) {
    console.error(`Error adding real-time listener for ${collectionName}:`, error);
    return null;
  }
};

// Remove a real-time listener for a collection
const removeRealtimeListener = (collectionName) => {
  try {
    const interval = realtimeListeners[collectionName];
    if (interval) {
      clearInterval(interval);
      delete realtimeListeners[collectionName];
      console.log(`Removed real-time listener for ${collectionName}`);
    }
  } catch (error) {
    console.error(`Error removing real-time listener for ${collectionName}:`, error);
  }
};

// Helper to add a document to a collection
const addDocument = async (collectionName, data) => {
  try {
    const db = getFirestore();
    if (!db) {
      console.error('Database not available');
      return null;
    }
    
    let docRef;
    
    if (adminInitialized) {
      // Use Admin SDK
      docRef = await db.collection(collectionName).add({
        ...data,
        timestamp: data.timestamp || new Date()
      });
      console.log(`Added document to ${collectionName} with ID: ${docRef.id}`);
      return docRef.id;
    } else {
      // Use Client SDK
      docRef = await clientAddDoc(clientCollection(clientDb, collectionName), {
        ...data,
        timestamp: data.timestamp || new Date()
      });
      console.log(`Added document to ${collectionName} with ID: ${docRef.id}`);
      return docRef.id;
    }
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    return null;
  }
};

// Helper functions to abstract away the differences between Admin and Client SDK
const collection = (db, collectionName) => {
  if (adminInitialized && adminDb) {
    return adminDb.collection(collectionName);
  } else {
    return clientCollection(db, collectionName);
  }
};

const query = (collectionRef, ...args) => {
  if (adminInitialized && adminDb) {
    // For Admin SDK, we need to chain the query methods
    let queryRef = collectionRef;
    args.forEach(arg => {
      // Extract the operation type and parameters
      if (arg && arg._method) {
        const method = arg._method;
        const params = arg._params;
        
        if (method === 'where') {
          queryRef = queryRef.where(params.fieldPath, params.opStr, params.value);
        } else if (method === 'orderBy') {
          queryRef = queryRef.orderBy(params.fieldPath, params.directionStr);
        } else if (method === 'limit') {
          queryRef = queryRef.limit(params.limit);
        }
      }
    });
    return queryRef;
  } else {
    // For Client SDK, we use the client query function
    return clientQuery(collectionRef, ...args);
  }
};

const where = (fieldPath, opStr, value) => {
  if (adminInitialized && adminDb) {
    // For Admin SDK, we return an object with the method and params
    return {
      _method: 'where',
      _params: { fieldPath, opStr, value }
    };
  } else {
    // For Client SDK, we use the client where function
    return clientWhere(fieldPath, opStr, value);
  }
};

const orderBy = (fieldPath, directionStr) => {
  if (adminInitialized && adminDb) {
    // For Admin SDK, we return an object with the method and params
    return {
      _method: 'orderBy',
      _params: { fieldPath, directionStr }
    };
  } else {
    // For Client SDK, we use the client orderBy function
    return clientOrderBy(fieldPath, directionStr);
  }
};

const limitQuery = (limit) => {
  if (adminInitialized && adminDb) {
    // For Admin SDK, we return an object with the method and params
    return {
      _method: 'limit',
      _params: { limit }
    };
  } else {
    // For Client SDK, we use the client limit function
    return clientLimitQuery(limit);
  }
};

const getDocs = async (queryRef) => {
  if (adminInitialized && adminDb) {
    // For Admin SDK
    const snapshot = await queryRef.get();
    return {
      empty: snapshot.empty,
      size: snapshot.size,
      docs: snapshot.docs.map(doc => ({
        id: doc.id,
        data: () => doc.data(),
        exists: true
      })),
      forEach: callback => snapshot.forEach(doc => {
        callback({
          id: doc.id,
          data: () => doc.data(),
          exists: true
        });
      })
    };
  } else {
    // For Client SDK
    return await clientGetDocs(queryRef);
  }
};

const addDoc = async (collectionRef, data) => {
  if (adminInitialized && adminDb) {
    // For Admin SDK
    const docRef = await collectionRef.add(data);
    return {
      id: docRef.id
    };
  } else {
    // For Client SDK
    return await clientAddDoc(collectionRef, data);
  }
};

// In-memory database for development
const localDb = {
  collections: {
    admin_users: [],
    user_interactions: [],
    logs: []
  },
  
  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = [];
    }
    return {
      add: (data) => {
        const id = `local-${Date.now()}`;
        this.collections[name].push({
          id,
          data: { ...data },
          get: () => ({ data: () => ({ ...data }) })
        });
        return { id };
      },
      where: () => ({
        get: () => ({
          empty: this.collections[name].length === 0,
          docs: this.collections[name]
        })
      })
    };
  }
};

module.exports = {
  initializeFirebase,
  initializeFirebaseAdmin,
  getFirestore,
  isDBAvailable,
  addRealtimeListener,
  removeRealtimeListener,
  addDocument,
  firebaseConfig,
  localDb,
  // Export Firebase functions for use in other modules
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limitQuery,
  // Export Admin SDK directly
  admin
}; 