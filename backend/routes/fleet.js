const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../db/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// List fleet vehicles — everyone signed in can view, useful for transporter's assign dropdown
router.get('/', verifyToken, (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.all('SELECT * FROM vehicles WHERE status = ? ORDER BY created_at DESC', [status])
    : db.all('SELECT * FROM vehicles ORDER BY created_at DESC');
  res.json({ vehicles: rows });
});

// Add a vehicle to the fleet (transporter or admin)
router.post('/', verifyToken, requireRole('transporter', 'admin'), (req, res) => {
  const { vehicle_number, vehicle_type, capacity, driver_name, driver_phone } = req.body;
  if (!vehicle_number) {
    return res.status(400).json({ error: 'Vehicle number is required.' });
  }

  const existing = db.get('SELECT id FROM vehicles WHERE vehicle_number = ?', [vehicle_number]);
  if (existing) {
    return res.status(409).json({ error: 'A vehicle with this number already exists in the fleet.' });
  }

  const id = uuidv4();
  db.run(
    `INSERT INTO vehicles (id, vehicle_number, vehicle_type, capacity, driver_name, driver_phone, added_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, vehicle_number, vehicle_type || null, capacity || null, driver_name || null, driver_phone || null, req.user.id]
  );

  res.status(201).json({ vehicle: db.get('SELECT * FROM vehicles WHERE id = ?', [id]) });
});

// Update vehicle status/details
router.patch('/:id', verifyToken, requireRole('transporter', 'admin'), (req, res) => {
  const vehicle = db.get('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

  const { status, driver_name, driver_phone, vehicle_type, capacity } = req.body;
  db.run(
    `UPDATE vehicles SET status = ?, driver_name = ?, driver_phone = ?, vehicle_type = ?, capacity = ? WHERE id = ?`,
    [
      status || vehicle.status,
      driver_name ?? vehicle.driver_name,
      driver_phone ?? vehicle.driver_phone,
      vehicle_type ?? vehicle.vehicle_type,
      capacity ?? vehicle.capacity,
      req.params.id
    ]
  );

  res.json({ vehicle: db.get('SELECT * FROM vehicles WHERE id = ?', [req.params.id]) });
});

router.delete('/:id', verifyToken, requireRole('transporter', 'admin'), (req, res) => {
  const vehicle = db.get('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });
  if (vehicle.status === 'assigned') {
    return res.status(400).json({ error: 'Cannot remove a vehicle that is currently assigned to a trip.' });
  }
  db.run('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
