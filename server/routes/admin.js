const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { logAction, getLogs, getLogStats, clearLogs } = require('../utils/logger');
const { requireAdmin } = require('../middlewares/auth');

const router = express.Router();

// Apply admin middleware to all routes
router.use(requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, department, limit = 50 } = req.query;
    
    let query = 'SELECT id, name, email, role, department, created_at FROM users WHERE 1=1';
    const params = [];
    
    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }
    
    if (department) {
      query += ` AND department = ?`;
      params.push(department);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const users = await db.query(query, params);
    res.json({ users: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user role
router.put('/users/:id/role', [
  body('role').isIn(['user', 'admin']).withMessage('Role must be either user or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user.id;

    // Check if user exists
    const user = await db.get('SELECT id, name, email FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user role
    await db.run('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [role, id]);

    // Log the action
    await logAction('user_role_updated', adminId, 'user', id, { newRole: role });

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Get all reservations (admin view)
router.get('/reservations', async (req, res) => {
  try {
    const { status, roomId, userId, startDate, endDate, limit = 50 } = req.query;
    
    let query = `
      SELECT r.*, rm.name as room_name, rm.location,
             u.name as user_name, u.email as user_email
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }
    
    if (roomId) {
      query += ` AND r.room_id = ?`;
      params.push(roomId);
    }
    
    if (userId) {
      query += ` AND r.user_id = ?`;
      params.push(userId);
    }
    
    if (startDate) {
      query += ` AND r.start_time >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND r.end_time <= ?`;
      params.push(endDate);
    }
    
    query += ` ORDER BY r.start_time DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const reservations = await db.query(query, params);
    res.json({ reservations: reservations });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: 'Failed to get reservations' });
  }
});

// Create new room
router.post('/rooms', [
  body('name').trim().isLength({ min: 1 }).withMessage('Room name is required'),
  body('location').optional().trim(),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  body('availableFrom').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Invalid time format'),
  body('availableTo').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Invalid time format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, location, capacity, availableFrom, availableTo } = req.body;
    const adminId = req.user.id;

    // Check if room name already exists
    const existingRoom = await db.get('SELECT id FROM rooms WHERE name = ?', [name]);
    if (existingRoom) {
      return res.status(400).json({ error: 'Room with this name already exists' });
    }

    // Create room
    const result = await db.run(`
      INSERT INTO rooms (name, location, capacity, available_from, available_to)
      VALUES (?, ?, ?, ?, ?)
    `, [name, location, capacity, availableFrom, availableTo]);

    // Get the created room
    const room = await db.get('SELECT * FROM rooms WHERE id = ?', [result.id]);

    // Log the action
    await logAction('room_created', adminId, 'room', room.id, { name, location, capacity });

    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Update room
router.put('/rooms/:id', [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Room name cannot be empty'),
  body('location').optional().trim(),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  body('availableFrom').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Invalid time format'),
  body('availableTo').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Invalid time format'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, location, capacity, availableFrom, availableTo, isActive } = req.body;
    const adminId = req.user.id;

    // Check if room exists
    const existingRoom = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
    if (!existingRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push(`name = ?`);
      params.push(name);
    }

    if (location !== undefined) {
      updates.push(`location = ?`);
      params.push(location);
    }

    if (capacity !== undefined) {
      updates.push(`capacity = ?`);
      params.push(capacity);
    }

    if (isActive !== undefined) {
      updates.push(`is_active = ?`);
      params.push(isActive);
    }

    if (availableFrom !== undefined) {
      updates.push(`available_from = ?`);
      params.push(availableFrom);
    }

    if (availableTo !== undefined) {
      updates.push(`available_to = ?`);
      params.push(availableTo);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add updated timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE rooms 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    // Add room ID to params
    params.push(id);

    await db.run(updateQuery, params);
    
    // Get the updated room
    const updatedRoom = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);

    // Log the action
    await logAction('room_updated', adminId, 'room', id, { name, location, capacity, isActive });

    res.json({
      message: 'Room updated successfully',
      room: updatedRoom
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete room
router.delete('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Check if room exists
    const room = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if room has active reservations
    const reservationsResult = await db.query(`
      SELECT COUNT(*) as count FROM reservations 
      WHERE room_id = ? AND status = 'confirmed' AND start_time > datetime('now')
    `, [id]);

    if (reservationsResult && reservationsResult.length > 0 && parseInt(reservationsResult[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete room with active future reservations' 
      });
    }

    // Delete room
    await db.run('DELETE FROM rooms WHERE id = ?', [id]);

    // Log the action
    await logAction('room_deleted', adminId, 'room', id, { roomName: room.name });

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Get system statistics
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE r.start_time >= ? AND r.start_time <= ?';
      params.push(startDate, endDate);
    }

    // Total reservations
    const totalReservationsResult = await db.query(`
      SELECT COUNT(*) as total FROM reservations r ${dateFilter}
    `, params);

    // Confirmed reservations
    const confirmedReservationsResult = await db.query(`
      SELECT COUNT(*) as confirmed FROM reservations r 
      WHERE r.status = 'confirmed' ${dateFilter ? 'AND ' + dateFilter.replace('WHERE ', '') : ''}
    `, params);

    // Total users
    const totalUsersResult = await db.query('SELECT COUNT(*) as total FROM users');

    // Total rooms
    const totalRoomsResult = await db.query('SELECT COUNT(*) as total FROM rooms WHERE is_active = 1');

    // Room utilization (simplified for SQLite)
    const roomUtilizationResult = await db.query(`
      SELECT 
        rm.name,
        COUNT(r.id) as reservation_count,
        COALESCE(SUM((julianday(r.end_time) - julianday(r.start_time)) * 24), 0) as total_hours
      FROM rooms rm
      LEFT JOIN reservations r ON rm.id = r.room_id 
        AND r.status = 'confirmed'
        ${dateFilter ? 'AND ' + dateFilter.replace('WHERE ', '') : ''}
      WHERE rm.is_active = 1
      GROUP BY rm.id, rm.name
      ORDER BY total_hours DESC
    `, params);

    // Peak hours (simplified for SQLite)
    const peakHoursResult = await db.query(`
      SELECT 
        CAST(strftime('%H', r.start_time) AS INTEGER) as hour,
        COUNT(*) as reservation_count
      FROM reservations r
      WHERE r.status = 'confirmed' ${dateFilter ? 'AND ' + dateFilter.replace('WHERE ', '') : ''}
      GROUP BY CAST(strftime('%H', r.start_time) AS INTEGER)
      ORDER BY reservation_count DESC
      LIMIT 5
    `, params);

    res.json({
      statistics: {
        totalReservations: parseInt(totalReservationsResult[0].total),
        confirmedReservations: parseInt(confirmedReservationsResult[0].confirmed),
        totalUsers: parseInt(totalUsersResult[0].total),
        totalRooms: parseInt(totalRoomsResult[0].total),
        roomUtilization: roomUtilizationResult,
        peakHours: peakHoursResult
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get system logs
router.get('/logs', async (req, res) => {
  try {
    const { action, entityType, actorId, startDate, endDate, limit = 100 } = req.query;
    
    const filters = {};
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (actorId) filters.actorId = actorId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (limit) filters.limit = parseInt(limit);

    const logs = await getLogs(filters);
    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

// Get log statistics
router.get('/logs/stats', async (req, res) => {
  try {
    const stats = await getLogStats();
    res.json({ stats });
  } catch (error) {
    console.error('Get log stats error:', error);
    res.status(500).json({ error: 'Failed to get log statistics' });
  }
});

// Clear all logs (admin only)
router.delete('/logs', async (req, res) => {
  try {
    await clearLogs();
    res.json({ message: 'All logs cleared successfully' });
  } catch (error) {
    console.error('Clear logs error:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

module.exports = router; 