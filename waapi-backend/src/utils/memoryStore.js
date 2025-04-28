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
      storageBucket: "spiritfurniture-9be96.firebasestorage.app",
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

// Try to initialize Firebase
initializeFirebase();

/**
 * Add a document to a collection
 * @param {string} collectionName - Name of the collection
 * @param {object} data - Document data to add
 * @returns {Promise<object>} - Document with ID
 */
const addDocument = async (collectionName, data) => {
  try {
    // Add timestamp if not present
    const documentWithTimestamp = {
      ...data,
      timestamp: data.timestamp || new Date()
    };
    
    // If using Firebase
    if (usingFirebase && db) {
      // Add to Firestore
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, documentWithTimestamp);
      console.log(`Added document to Firebase ${collectionName} with ID:`, docRef.id);
      
      return { id: docRef.id, ...documentWithTimestamp };
    } else {
      // Using in-memory
      if (!collections[collectionName]) {
        collections[collectionName] = [];
      }
      
      // Generate a simple ID
      const id = `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Add ID to document
      const documentWithId = {
        ...documentWithTimestamp,
        id
      };
      
      // Add to collection
      collections[collectionName].push(documentWithId);
      
      // Limit collection size to 10 items max for logs and user_interactions
      if ((collectionName === 'logs' || collectionName === 'user_interactions') && 
          collections[collectionName].length > 10) {
        // Sort by timestamp (newest first) and keep only the newest 10
        collections[collectionName].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        collections[collectionName] = collections[collectionName].slice(0, 10);
        console.log(`Limited ${collectionName} collection to 10 documents`);
      }
      
      console.log(`Added document to in-memory ${collectionName}:`, documentWithId);
      
      return documentWithId;
    }
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Get all documents from a collection
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Array>} - Array of documents
 */
const getDocuments = async (collectionName) => {
  try {
    // If using Firebase
    if (usingFirebase && db) {
      console.log(`Attempting to retrieve documents from Firebase ${collectionName}`);
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      const docs = [];
      let count = 0;
      
      snapshot.forEach(doc => {
        // Limit to 100 docs max to prevent performance issues
        if (count < 100) {
          docs.push({
            id: doc.id,
            ...doc.data()
          });
        }
        count++;
      });
      
      console.log(`Retrieved ${count} documents from Firebase ${collectionName}, returning ${docs.length}`);
      
      // Log a sample document to help diagnose issues
      if (docs.length > 0) {
        const keys = Object.keys(docs[0]);
        console.log(`Sample document keys: ${keys.join(', ')}`);
      }
      
      return docs;
    } else {
      // Using in-memory
      if (!collections[collectionName]) {
        return [];
      }
      
      // Return a copy of the collection, limited to 100 items
      const docs = collections[collectionName].slice(0, 100);
      console.log(`Retrieved ${collections[collectionName].length} documents from in-memory ${collectionName}, returning ${docs.length}`);
      return docs;
    }
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    
    // Fallback to in-memory if Firebase fails
    if (usingFirebase && collections[collectionName]) {
      console.log(`Falling back to in-memory data for ${collectionName}`);
      return [...collections[collectionName]];
    }
    
    return [];
  }
};

/**
 * Clear all documents from a collection
 * @param {string} collectionName - Name of the collection
 */
const clearCollection = async (collectionName) => {
  try {
    // If using Firebase
    if (usingFirebase && db) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      // Delete each document individually
      console.log(`Deleting ${snapshot.size} documents from Firebase ${collectionName}`);
      const deletePromises = [];
      
      snapshot.forEach(document => {
        const docRef = doc(db, collectionName, document.id);
        deletePromises.push(deleteDoc(docRef));
      });
      
      await Promise.all(deletePromises);
      console.log(`Cleared collection in Firebase: ${collectionName}`);
    }
    
    // Always clear in-memory collection as well
    if (collections[collectionName]) {
      collections[collectionName] = [];
      console.log(`Cleared collection in memory: ${collectionName}`);
    }
  } catch (error) {
    console.error(`Error clearing collection ${collectionName}:`, error);
    
    // At least clear the in-memory version if Firebase fails
    if (collections[collectionName]) {
      collections[collectionName] = [];
    }
  }
};

/**
 * Limit the number of logs in the collections to prevent excessive growth
 * @param {number} maxLogs - Maximum number of logs to keep
 */
const limitLogs = async (maxLogs = 10) => {
  try {
    // Limit logs in memory store
    if (collections.logs.length > maxLogs) {
      // Sort by timestamp (newest first)
      collections.logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      // Keep only the newest maxLogs
      collections.logs = collections.logs.slice(0, maxLogs);
      console.log(`Limited logs collection to ${maxLogs} documents`);
    }
    
    // Also limit user_interactions
    if (collections.user_interactions.length > maxLogs) {
      // Sort by timestamp (newest first)
      collections.user_interactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      // Keep only the newest maxLogs
      collections.user_interactions = collections.user_interactions.slice(0, maxLogs);
      console.log(`Limited user_interactions collection to ${maxLogs} documents`);
    }
    
    // If using Firebase, we would need to also limit the Firestore collections
    // This would require more complex logic with queries and batch deletes
    
    return true;
  } catch (error) {
    console.error('Error limiting logs:', error);
    return false;
  }
};

// Check if Firestore is being used
const isUsingFirebase = () => {
  return usingFirebase;
};

// Automatically limit any existing logs on startup after all functions are defined
limitLogs(10).then(() => {
  console.log('Successfully limited logs on startup');
}).catch(err => {
  console.error('Error limiting logs on startup:', err);
});

module.exports = {
  addDocument,
  getDocuments,
  clearCollection,
  isUsingFirebase,
  limitLogs
}; 