const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { logAction } = require('../utils/logger');
const { sendReservationConfirmation, sendReservationCancellation, sendReservationUpdate } = require('../utils/email');

const router = express.Router();

// Create new reservation
router.post('/', [
  body('roomId').isInt().withMessage('Valid room ID is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('purpose').trim().isLength({ min: 1 }).withMessage('Purpose is required'),
  body('department').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roomId, startTime, endTime, purpose, department } = req.body;
    const userId = req.user.id;

    // Validate time range
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now) {
      return res.status(400).json({ error: 'Start time must be in the future' });
    }

    if (end <= start) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Check duration limit (4 hours max)
    const durationHours = (end - start) / (1000 * 60 * 60);
    if (durationHours > 4) {
      return res.status(400).json({ error: 'Reservation cannot exceed 4 hours' });
    }

    // Check if room exists and is active
    const room = await db.get('SELECT * FROM rooms WHERE id = ? AND is_active = 1', [roomId]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found or inactive' });
    }

    // Check working hours (simplified - assume 9 AM to 6 PM)
    const startHour = start.getHours();
    const endHour = end.getHours();
    
    if (startHour < 9 || endHour > 18) {
      return res.status(400).json({ 
        error: 'Room is only available from 9:00 AM to 6:00 PM' 
      });
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
    `, [roomId, startTime, startTime, endTime, endTime, startTime, endTime]);

    if (overlaps.length > 0) {
      return res.status(400).json({ error: 'Room is not available for the selected time' });
    }

    // Create reservation
    const result = await db.run(`
      INSERT INTO reservations (user_id, room_id, title, start_time, end_time, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, roomId, purpose, startTime, endTime, department || '']);

    // Get the created reservation
    const reservation = await db.get('SELECT * FROM reservations WHERE id = ?', [result.id]);

    // Log the reservation
    await logAction('reservation_created', userId, 'reservation', reservation.id, {
      roomId, startTime, endTime, purpose
    });

    // Send confirmation email
    await sendReservationConfirmation(reservation, req.user, room);

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

// Get user's reservations
router.get('/my-reservations', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50 } = req.query;

    let query = `
      SELECT r.*, rm.name as room_name, rm.location
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
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

// Get reservation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reservation = await db.get(`
      SELECT r.*, rm.name as room_name, rm.location, rm.capacity,
             u.name as user_name, u.email as user_email
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ? AND (r.user_id = ? OR ? = 'admin')
    `, [id, userId, req.user.role]);

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json({ reservation: reservation });
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ error: 'Failed to get reservation' });
  }
});

// Update reservation
router.put('/:id', [
  body('startTime').optional().isISO8601().withMessage('Valid start time is required'),
  body('endTime').optional().isISO8601().withMessage('Valid end time is required'),
  body('purpose').optional().trim().isLength({ min: 1 }).withMessage('Purpose cannot be empty'),
  body('department').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { startTime, endTime, purpose, department } = req.body;

    // Check if reservation exists and user has permission
    const existingReservation = await db.get(`
      SELECT r.*, rm.name as room_name, rm.location
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.id = ? AND (r.user_id = ? OR ? = 'admin')
    `, [id, userId, req.user.role]);

    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    const room = { name: existingReservation.room_name, location: existingReservation.location };

    // Build update query
    const updates = [];
    const params = [];

    if (startTime) {
      updates.push(`start_time = ?`);
      params.push(startTime);
    }

    if (endTime) {
      updates.push(`end_time = ?`);
      params.push(endTime);
    }

    if (purpose) {
      updates.push(`title = ?`);
      params.push(purpose);
    }

    if (department) {
      updates.push(`description = ?`);
      params.push(department);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add updated timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE reservations 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    // Add reservation ID to params
    params.push(id);

    await db.run(updateQuery, params);
    
    // Get the updated reservation
    const updatedReservation = await db.get(`
      SELECT r.*, rm.name as room_name, rm.location
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.id = ?
    `, [id]);

    // Log the update
    await logAction('reservation_updated', userId, 'reservation', id, {
      startTime, endTime, purpose, department
    });

    // Send update email
    await sendReservationUpdate(updatedReservation, req.user, room);

    res.json({
      message: 'Reservation updated successfully',
      reservation: updatedReservation
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

// Cancel reservation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if reservation exists and user has permission
    const reservation = await db.get(`
      SELECT r.*, rm.name as room_name, rm.location
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.id = ? AND (r.user_id = ? OR ? = 'admin')
    `, [id, userId, req.user.role]);

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const room = { name: reservation.room_name, location: reservation.location };

    // Check if reservation is in the future
    if (new Date(reservation.start_time) <= new Date()) {
      return res.status(400).json({ error: 'Cannot cancel past or ongoing reservations' });
    }

    // Cancel reservation
    await db.run('UPDATE reservations SET status = ? WHERE id = ?', ['cancelled', id]);

    // Log the cancellation
    await logAction('reservation_cancelled', userId, 'reservation', id);

    // Send cancellation email
    await sendReservationCancellation(reservation, req.user, room);

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

module.exports = router; 