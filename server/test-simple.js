const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Test auth route without database
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  res.json({ 
    message: 'Login endpoint reached',
    body: req.body 
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 