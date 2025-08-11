const db = require('./config/database.js');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Check if admin user exists
    const adminUser = await db.get('SELECT * FROM users WHERE email = ?', ['admin@example.com']);
    console.log('Admin user:', adminUser);
    
    // Check all users
    const allUsers = await db.query('SELECT id, name, email, role FROM users');
    console.log('All users:', allUsers);
    
    // Check rooms
    const rooms = await db.query('SELECT * FROM rooms');
    console.log('Rooms:', rooms);
    
  } catch (error) {
    console.error('Database test error:', error);
  } finally {
    process.exit();
  }
}

testDatabase(); 