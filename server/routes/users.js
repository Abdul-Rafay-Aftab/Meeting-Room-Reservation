const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { logAction } = require('../utils/logger');

const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await db.get(`
      SELECT id, name, email, role, department, created_at
      FROM users WHERE id = ?
    `, [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('department').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { name, department } = req.body;

    // Build update query
    const updates = [];
    const params = [];

    if (name) {
      updates.push(`name = ?`);
      params.push(name);
    }

    if (department !== undefined) {
      updates.push(`department = ?`);
      params.push(department);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add updated timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    // Add user ID to params
    params.push(userId);

    await db.run(updateQuery, params);
    
    // Get updated user
    const updatedUser = await db.get(`
      SELECT id, name, email, role, department, created_at
      FROM users WHERE id = ?
    `, [userId]);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the profile update
    await logAction('profile_updated', userId, 'user', userId, { name, department });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user's upcoming reservations
router.get('/upcoming-reservations', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;
    
         const reservations = await db.query(`
       SELECT r.*, rm.name as room_name, rm.location
       FROM reservations r
       JOIN rooms rm ON r.room_id = rm.id
       WHERE r.user_id = ? 
       AND r.status = 'confirmed'
       AND r.start_time > datetime('now')
       ORDER BY r.start_time ASC
       LIMIT ?
     `, [userId, parseInt(limit)]);
     
     res.json({ reservations: reservations });
  } catch (error) {
    console.error('Get upcoming reservations error:', error);
    res.status(500).json({ error: 'Failed to get upcoming reservations' });
  }
});

// Get user's past reservations
router.get('/past-reservations', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;
    
         const reservations = await db.query(`
       SELECT r.*, rm.name as room_name, rm.location
       FROM reservations r
       JOIN rooms rm ON r.room_id = rm.id
       WHERE r.user_id = ? 
       AND r.end_time < datetime('now')
       ORDER BY r.start_time DESC
       LIMIT ?
     `, [userId, parseInt(limit)]);
     
     res.json({ reservations: reservations });
  } catch (error) {
    console.error('Get past reservations error:', error);
    res.status(500).json({ error: 'Failed to get past reservations' });
  }
});

// Get user's reservation statistics
router.get('/statistics', async (req, res) => {
  try {
    const userId = req.user.id;
    
         // Total reservations
     const totalResult = await db.query(`
       SELECT COUNT(*) as total FROM reservations WHERE user_id = ?
     `, [userId]);
     
     // Confirmed reservations
     const confirmedResult = await db.query(`
       SELECT COUNT(*) as confirmed FROM reservations 
       WHERE user_id = ? AND status = 'confirmed'
     `, [userId]);
     
     // Cancelled reservations
     const cancelledResult = await db.query(`
       SELECT COUNT(*) as cancelled FROM reservations 
       WHERE user_id = ? AND status = 'cancelled'
     `, [userId]);
     
     // Total hours booked (simplified for SQLite)
     const hoursResult = await db.query(`
       SELECT COALESCE(SUM((julianday(end_time) - julianday(start_time)) * 24), 0) as total_hours
       FROM reservations 
       WHERE user_id = ? AND status = 'confirmed'
     `, [userId]);
     
     // Most used room
     const roomResult = await db.query(`
       SELECT rm.name, COUNT(*) as usage_count
       FROM reservations r
       JOIN rooms rm ON r.room_id = rm.id
       WHERE r.user_id = ? AND r.status = 'confirmed'
       GROUP BY rm.id, rm.name
       ORDER BY usage_count DESC
       LIMIT 1
     `, [userId]);
     
     res.json({
       statistics: {
         totalReservations: parseInt(totalResult[0].total),
         confirmedReservations: parseInt(confirmedResult[0].confirmed),
         cancelledReservations: parseInt(cancelledResult[0].cancelled),
         totalHours: parseFloat(hoursResult[0].total_hours),
         mostUsedRoom: roomResult[0] || null
       }
     });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

module.exports = router; 