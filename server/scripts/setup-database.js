const db = require('../config/database');

const createTables = async () => {
  try {
    // Create Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        department VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Rooms table
    await db.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        capacity INTEGER DEFAULT 10,
        available_from TIME DEFAULT '09:00:00',
        available_to TIME DEFAULT '17:00:00',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Reservations table
    await db.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        purpose TEXT,
        department VARCHAR(100),
        status VARCHAR(50) DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        actor_id INTEGER REFERENCES users(id),
        entity_type VARCHAR(50),
        entity_id INTEGER,
        details JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Blackout Periods table
    await db.query(`
      CREATE TABLE IF NOT EXISTS blackout_periods (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const seedData = async () => {
  try {
    // Create admin user
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await db.query(`
      INSERT INTO users (name, email, password_hash, role, department)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['Admin User', 'admin@company.com', adminPassword, 'admin', 'IT']);

    // Create sample rooms
    const rooms = [
      { name: 'Conference Room A', location: '1st Floor', capacity: 20 },
      { name: 'Conference Room B', location: '2nd Floor', capacity: 15 },
      { name: 'Meeting Room 1', location: '3rd Floor', capacity: 8 },
      { name: 'Meeting Room 2', location: '3rd Floor', capacity: 6 },
      { name: 'Board Room', location: '4th Floor', capacity: 12 }
    ];

    for (const room of rooms) {
      await db.query(`
        INSERT INTO rooms (name, location, capacity)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [room.name, room.location, room.capacity]);
    }

    console.log('Sample data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};

const setupDatabase = async () => {
  try {
    console.log('Setting up database...');
    await createTables();
    await seedData();
    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase(); 