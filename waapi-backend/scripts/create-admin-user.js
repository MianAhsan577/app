#!/usr/bin/env node

const bcrypt = require('bcrypt');
const { addDocument, getDocuments } = require('../src/utils/memoryStore');

// Admin user details
const email = 'info@spiritfurnitures.com';
const password = 'Zee9889@';
const name = 'Spirit Furnitures Admin';

async function createAdminUser() {
  try {
    console.log('Checking if user already exists...');
    
    // First initialize the memoryStore if needed
    require('../src/utils/memoryStore');
    
    // Check if user already exists
    const adminUsers = await getDocuments('admin_users');
    const existingUser = adminUsers.find(user => user.email === email);
    
    if (existingUser) {
      console.log('User with this email already exists. Exiting.');
      return;
    }
    
    // Hash password
    console.log('Creating new admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const userData = {
      email,
      password: hashedPassword,
      name,
      role: 'admin',
      createdAt: new Date()
    };
    
    const userRef = await addDocument('admin_users', userData);
    
    console.log('Admin user created successfully!');
    console.log('User ID:', userRef.id);
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Role: admin');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser(); 