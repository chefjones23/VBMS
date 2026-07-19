const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../db/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// Admin: list all users
router.get('/', verifyToken, requireRole('admin'), (req, res) => {
  const rows = db.all('SELECT id, name, email, role, department, phone, created_at FROM users ORDER BY created_at DESC');
  res.json({ users: rows });
});

// Admin: create a staff account (hod / transporter / admin)
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }
  if (!['user', 'hod', 'transporter', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }
  if (['user', 'hod'].includes(role) && !department) {
    return res.status(400).json({ error: 'Department is required for Employee and HOD accounts, since HOD approval is scoped by department.' });
  }

  const existing = db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  db.run(
    `INSERT INTO users (id, name, email, password_hash, role, department, phone) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, email.toLowerCase(), hash, role, department || null, phone || null]
  );

  res.status(201).json({ user: { id, name, email: email.toLowerCase(), role, department, phone } });
});

// Notifications for the logged-in user
router.get('/me/notifications', verifyToken, (req, res) => {
  const rows = db.all(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  );
  res.json({ notifications: rows });
});

router.patch('/me/notifications/:id/read', verifyToken, (req, res) => {
  db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

router.patch('/me/notifications/read-all', verifyToken, (req, res) => {
  db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
  res.json({ success: true });
});

// Admin: delete a user account
router.delete('/:id', verifyToken, requireRole('admin'), (req, res) => {
  const target = db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!target) return res.status(404).json({ error: 'User not found.' });

  if (target.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account while logged in as it.' });
  }

  if (target.role === 'admin') {
    const adminCount = db.get(`SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'`).cnt;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last remaining Admin account.' });
    }
  }

  db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
