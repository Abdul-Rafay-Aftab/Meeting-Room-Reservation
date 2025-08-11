const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in the server directory
const dbPath = path.join(__dirname, '..', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Create tables if they don't exist
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Add unique constraint on email
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

    // Rooms table
    db.run(`CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      description TEXT,
      location TEXT,
      available_from TEXT DEFAULT '09:00:00',
      available_to TEXT DEFAULT '17:00:00',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Reservations table
    db.run(`CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      status TEXT DEFAULT 'confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert default admin user if not exists
    db.get("SELECT id FROM users WHERE email = 'admin@example.com'", (err, row) => {
      if (!row) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
          ['Admin User', 'admin@example.com', hashedPassword, 'admin']);
        console.log('Default admin user created: admin@example.com / admin123');
      }
    });

    // Insert sample rooms if not exists
    db.get("SELECT id FROM rooms WHERE name = 'Conference Room A'", (err, row) => {
      if (!row) {
        db.run(`INSERT INTO rooms (name, capacity, description, location) VALUES 
          ('Conference Room A', 10, 'Large conference room with projector', 'Floor 1'),
          ('Meeting Room B', 6, 'Medium meeting room with whiteboard', 'Floor 2'),
          ('Small Meeting Room C', 4, 'Small meeting room for intimate discussions', 'Floor 1')`);
        console.log('Sample rooms created');
      }
    });
  });
}

// Helper function to run queries with promises
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Helper function to run single row queries
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Helper function to run insert/update/delete queries
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

module.exports = {
  query,
  get,
  run,
  db
}; 