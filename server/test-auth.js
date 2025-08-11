const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./config/database.js');

async function testAuth() {
  try {
    console.log('Testing auth functionality...');
    
    // Test admin login
    const email = 'admin@example.com';
    const password = 'admin123';
    
    // Get user from database
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    console.log('Found user:', user ? 'Yes' : 'No');
    
    if (user) {
      console.log('User details:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      });
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isValidPassword);
      
      if (isValidPassword) {
        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
          { expiresIn: '24h' }
        );
        console.log('JWT token generated:', token ? 'Yes' : 'No');
        console.log('Token length:', token.length);
        
        // Test token verification
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
          console.log('Token verification successful:', decoded);
        } catch (error) {
          console.error('Token verification failed:', error);
        }
      }
    }
    
  } catch (error) {
    console.error('Auth test error:', error);
  } finally {
    process.exit();
  }
}

testAuth(); 