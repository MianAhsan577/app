const bcrypt = require('bcrypt');
const { initializeFirebase, getFirestore } = require('./config/firebase');

// Initialize Firebase
initializeFirebase();

// Admin user details
const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'password123',
  role: 'admin',
  createdAt: new Date()
};

// Sample interaction data
const sampleInteractions = [
  {
    phone: '+923001234567',
    selectedCity: 'Lahore',
    selectedService: 'Office Furniture',
    supportNumber: '+923249988114',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
    source: 'popup_interface'
  },
  {
    phone: '+923001234568',
    selectedCity: 'Islamabad',
    selectedService: 'Home Furniture',
    supportNumber: '+923219314424',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    source: 'popup_interface'
  },
  {
    phone: '+923001234569',
    selectedCity: 'Lahore',
    selectedService: 'Home Furniture',
    supportNumber: '+923178882070',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    source: 'popup_interface'
  },
  {
    phone: '+923001234570',
    selectedCity: 'Islamabad',
    selectedService: 'Office Furniture',
    supportNumber: '+923185600656',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
    source: 'popup_interface'
  },
  {
    phone: '+923001234571',
    selectedCity: 'Lahore',
    selectedService: 'Office Furniture',
    supportNumber: '+923249988114',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    source: 'popup_interface'
  }
];

async function createAdminUser() {
  try {
    const db = getFirestore();
    if (!db) {
      console.error('Firestore not available');
      process.exit(1);
    }
    
    // First clear existing data for clean start
    console.log('Clearing existing data...');
    await clearCollection(db, 'admin_users');
    await clearCollection(db, 'user_interactions');
    
    // Check if user already exists
    const userSnapshot = await db.collection('admin_users')
      .where('email', '==', adminUser.email)
      .get();
    
    if (!userSnapshot.empty) {
      console.log('Admin user already exists');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminUser.password, salt);
      
      // Create user with hashed password
      const userData = {
        ...adminUser,
        password: hashedPassword
      };
      
      const userRef = await db.collection('admin_users').add(userData);
      
      console.log(`Admin user created with ID: ${userRef.id}`);
      console.log('Email:', adminUser.email);
      console.log('Password:', adminUser.password);
    }
    
    // Add sample interactions
    console.log('Adding sample interactions...');
    for (const interaction of sampleInteractions) {
      await db.collection('user_interactions').add(interaction);
    }
    console.log('Sample interactions added!');
    
    // Verify data was added correctly
    await verifyData(db);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Helper function to clear a collection
async function clearCollection(db, collectionName) {
  const snapshot = await db.collection(collectionName).get();
  
  // If this is a real Firestore instance, we'd need to delete docs individually
  // But for our in-memory DB, we can just clear the array directly
  if (process.env.NODE_ENV !== 'production') {
    const localDb = require('./config/firebase').localDb;
    if (localDb && localDb[collectionName]) {
      localDb[collectionName] = [];
      console.log(`Cleared ${collectionName} collection`);
    }
  }
}

// Helper function to verify data was added correctly
async function verifyData(db) {
  // Check users
  const usersSnapshot = await db.collection('admin_users').get();
  console.log(`Verified ${usersSnapshot.docs.length} admin users in database`);
  
  // Check interactions
  const interactionsSnapshot = await db.collection('user_interactions').get();
  console.log(`Verified ${interactionsSnapshot.docs.length} interactions in database`);
  
  // Log the actual user data for debugging
  if (usersSnapshot.docs.length > 0) {
    const userData = usersSnapshot.docs[0].data();
    console.log('User data preview:', {
      id: usersSnapshot.docs[0].id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      passwordPresent: !!userData.password
    });
  }
}

// Run the function
createAdminUser();