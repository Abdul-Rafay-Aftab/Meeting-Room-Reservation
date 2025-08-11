const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    
    let query = 'SELECT * FROM rooms';
    const params = [];
    
    if (active === 'true') {
      query += ' WHERE is_active = true';
    } else if (active === 'false') {
      query += ' WHERE is_active = false';
    }
    
    query += ' ORDER BY name';
    
    const rooms = await db.query(query, params);
    res.json({ rooms: rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// Get room by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const room = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json({ room: room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Get room availability for a specific date
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }
    
    // Get room details
    const room = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Get reservations for the specified date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const reservations = await db.query(`
      SELECT r.*, u.name as user_name
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      WHERE r.room_id = ? 
      AND r.status = 'confirmed'
      AND r.start_time >= ? 
      AND r.start_time <= ?
      ORDER BY r.start_time
    `, [id, startOfDay, endOfDay]);
    
    res.json({
      room,
      date,
      reservations: reservations
    });
  } catch (error) {
    console.error('Get room availability error:', error);
    res.status(500).json({ error: 'Failed to get room availability' });
  }
});

// Get all rooms availability for a specific date
router.get('/availability/all', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get all active rooms with their reservations for the date (simplified for SQLite)
    const rooms = await db.query(`
      SELECT rm.*
      FROM rooms rm
      WHERE rm.is_active = 1
      ORDER BY rm.name
    `);
    
    // Get reservations for each room
    const roomsWithReservations = await Promise.all(rooms.map(async (room) => {
      const reservations = await db.query(`
        SELECT r.*, u.name as user_name
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        WHERE r.room_id = ? 
        AND r.status = 'confirmed'
        AND r.start_time >= ? 
        AND r.start_time <= ?
        ORDER BY r.start_time
      `, [room.id, startOfDay, endOfDay]);
      
      return {
        ...room,
        reservations: reservations
      };
    }));
    
    res.json({
      date,
      rooms: roomsWithReservations
    });
  } catch (error) {
    console.error('Get all rooms availability error:', error);
    res.status(500).json({ error: 'Failed to get rooms availability' });
  }
});

// Check if room is available for a specific time range
router.post('/:id/check-availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.body;
    
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }
    
    // Check if room exists
    const room = await db.get('SELECT * FROM rooms WHERE id = ? AND is_active = 1', [id]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found or inactive' });
    }
    
    // Check for overlapping reservations
    const overlaps = await db.query(`
      SELECT id FROM reservations 
      WHERE room_id = ? 
      AND status = 'confirmed'
      AND (
        (start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?)
      )
    `, [id, startTime, startTime, endTime, endTime, startTime, endTime]);
    
    const isAvailable = overlaps.length === 0;
    
    res.json({
      room,
      startTime,
      endTime,
      isAvailable,
             conflictingReservations: overlaps
    });
  } catch (error) {
    console.error('Check room availability error:', error);
    res.status(500).json({ error: 'Failed to check room availability' });
  }
});

module.exports = router; 