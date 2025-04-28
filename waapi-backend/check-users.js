const { initializeFirebase, getDocuments } = require('./src/utils/memoryStore');

async function checkAdminUsers() {
  try {
    await initializeFirebase();
    const users = await getDocuments('admin_users');
    console.log('Admin Users:');
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error checking admin users:', error);
  }
}

checkAdminUsers(); 