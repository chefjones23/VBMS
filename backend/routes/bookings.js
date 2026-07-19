const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../db/database');
const { verifyToken, requireRole } = require('../middleware/auth');

function generateBookingCode() {
  const year = new Date().getFullYear();
  const row = db.get(
    `SELECT COUNT(*) as cnt FROM bookings WHERE booking_code LIKE ?`,
    [`VBMS-${year}-%`]
  );
  const seq = String((row?.cnt || 0) + 1).padStart(4, '0');
  return `VBMS-${year}-${seq}`;
}

function notify(userId, bookingId, message) {
  db.run(
    `INSERT INTO notifications (id, user_id, booking_id, message) VALUES (?, ?, ?, ?)`,
    [uuidv4(), userId, bookingId, message]
  );
  if (global.broadcastToUser) global.broadcastToUser(userId, { type: 'notification', message, bookingId });
}

function fullBooking(id) {
  return db.get(
    `SELECT b.*, u.name as user_name, u.department as user_department, u.phone as user_phone,
            hod.name as hod_name, t.name as transporter_name
     FROM bookings b
     LEFT JOIN users u ON b.user_id = u.id
     LEFT JOIN users hod ON b.hod_id = hod.id
     LEFT JOIN users t ON b.transporter_id = t.id
     WHERE b.id = ?`,
    [id]
  );
}

// Create a new booking request (User)
router.post('/', verifyToken, requireRole('user'), (req, res) => {
  try {
    const { purpose, destination, travel_date, travel_time, return_date, passengers } = req.body;
    if (!purpose || !destination || !travel_date) {
      return res.status(400).json({ error: 'Purpose, destination, and travel date are required.' });
    }

    const id = uuidv4();
    const bookingCode = generateBookingCode();

    db.run(
      `INSERT INTO bookings (id, booking_code, user_id, purpose, destination, travel_date, travel_time, return_date, passengers, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [id, bookingCode, req.user.id, purpose, destination, travel_date, travel_time || null, return_date || null, passengers || 1]
    );

    // Notify only the HOD(s) belonging to the requester's own department
    const requester = db.get(`SELECT department FROM users WHERE id = ?`, [req.user.id]);
    const hods = requester?.department
      ? db.all(`SELECT id FROM users WHERE role = 'hod' AND department = ?`, [requester.department])
      : [];
    hods.forEach(h => notify(h.id, id, `New travel request ${bookingCode} awaiting your approval.`));

    res.status(201).json({ booking: fullBooking(id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking request.' });
  }
});

// List bookings — scoped by role
router.get('/', verifyToken, (req, res) => {
  const { role, id } = req.user;
  let rows;

  if (role === 'user') {
    rows = db.all(
      `SELECT b.*, u.name as user_name, hod.name as hod_name, t.name as transporter_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN users hod ON b.hod_id = hod.id
       LEFT JOIN users t ON b.transporter_id = t.id
       WHERE b.user_id = ? ORDER BY b.created_at DESC`,
      [id]
    );
  } else if (role === 'hod') {
    const hodUser = db.get(`SELECT department FROM users WHERE id = ?`, [id]);
    rows = db.all(
      `SELECT b.*, u.name as user_name, u.department as user_department, hod.name as hod_name, t.name as transporter_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN users hod ON b.hod_id = hod.id
       LEFT JOIN users t ON b.transporter_id = t.id
       WHERE u.department = ?
       ORDER BY b.created_at DESC`,
      [hodUser?.department || '']
    );
  } else if (role === 'transporter') {
    rows = db.all(
      `SELECT b.*, u.name as user_name, u.department as user_department, hod.name as hod_name, t.name as transporter_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN users hod ON b.hod_id = hod.id
       LEFT JOIN users t ON b.transporter_id = t.id
       WHERE b.status IN ('approved','assigned','completed')
       ORDER BY b.created_at DESC`
    );
  } else {
    // admin — sees everything
    rows = db.all(
      `SELECT b.*, u.name as user_name, u.department as user_department, hod.name as hod_name, t.name as transporter_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN users hod ON b.hod_id = hod.id
       LEFT JOIN users t ON b.transporter_id = t.id
       ORDER BY b.created_at DESC`
    );
  }

  res.json({ bookings: rows });
});

router.get('/:id', verifyToken, (req, res) => {
  const booking = fullBooking(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  res.json({ booking });
});

// HOD approves a travel request
router.patch('/:id/approve', verifyToken, requireRole('hod'), (req, res) => {
  const booking = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (booking.status !== 'pending') {
    return res.status(400).json({ error: 'Only pending requests can be approved.' });
  }

  const hodUser = db.get('SELECT department FROM users WHERE id = ?', [req.user.id]);
  const requester = db.get('SELECT department FROM users WHERE id = ?', [booking.user_id]);
  if (!hodUser?.department || hodUser.department !== requester?.department) {
    return res.status(403).json({ error: 'You can only approve requests from your own department.' });
  }

  const { remarks } = req.body;
  db.run(
    `UPDATE bookings SET status = 'approved', hod_id = ?, hod_remarks = ?, hod_decision_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    [req.user.id, remarks || null, req.params.id]
  );

  notify(booking.user_id, booking.id, `Your travel request ${booking.booking_code} was approved. A vehicle will be assigned shortly.`);
  const transporters = db.all(`SELECT id FROM users WHERE role = 'transporter'`);
  transporters.forEach(t => notify(t.id, booking.id, `Request ${booking.booking_code} approved — please assign a vehicle.`));

  res.json({ booking: fullBooking(req.params.id) });
});

// HOD rejects a travel request
router.patch('/:id/reject', verifyToken, requireRole('hod'), (req, res) => {
  const booking = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (booking.status !== 'pending') {
    return res.status(400).json({ error: 'Only pending requests can be rejected.' });
  }

  const hodUser = db.get('SELECT department FROM users WHERE id = ?', [req.user.id]);
  const requester = db.get('SELECT department FROM users WHERE id = ?', [booking.user_id]);
  if (!hodUser?.department || hodUser.department !== requester?.department) {
    return res.status(403).json({ error: 'You can only reject requests from your own department.' });
  }

  const { remarks } = req.body;
  if (!remarks) return res.status(400).json({ error: 'Please provide a reason for rejection.' });

  db.run(
    `UPDATE bookings SET status = 'rejected', hod_id = ?, hod_remarks = ?, hod_decision_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    [req.user.id, remarks, req.params.id]
  );

  notify(booking.user_id, booking.id, `Your travel request ${booking.booking_code} was rejected: ${remarks}`);
  res.json({ booking: fullBooking(req.params.id) });
});

// Transporter assigns a vehicle — either from the fleet list or a manual entry
router.patch('/:id/assign', verifyToken, requireRole('transporter'), (req, res) => {
  const booking = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (booking.status !== 'approved') {
    return res.status(400).json({ error: 'Only HOD-approved requests can be assigned a vehicle.' });
  }

  const { vehicle_id, vehicle_number, driver_name, driver_phone, remarks } = req.body;

  let finalVehicleNumber = vehicle_number;
  let finalDriverName = driver_name;
  let finalDriverPhone = driver_phone;

  if (vehicle_id) {
    const vehicle = db.get('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vehicle) return res.status(404).json({ error: 'Selected fleet vehicle not found.' });
    if (vehicle.status !== 'available') {
      return res.status(400).json({ error: 'Selected vehicle is not currently available.' });
    }
    finalVehicleNumber = vehicle.vehicle_number;
    finalDriverName = finalDriverName || vehicle.driver_name;
    finalDriverPhone = finalDriverPhone || vehicle.driver_phone;
    db.run(`UPDATE vehicles SET status = 'assigned' WHERE id = ?`, [vehicle_id]);
  }

  if (!finalVehicleNumber) {
    return res.status(400).json({ error: 'Provide a vehicle from the fleet list or enter a vehicle number manually.' });
  }

  db.run(
    `UPDATE bookings SET status = 'assigned', vehicle_id = ?, vehicle_number = ?, driver_name = ?, driver_phone = ?,
     transporter_id = ?, transporter_remarks = ?, assigned_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    [vehicle_id || null, finalVehicleNumber, finalDriverName || null, finalDriverPhone || null, req.user.id, remarks || null, req.params.id]
  );

  notify(
    booking.user_id,
    booking.id,
    `Vehicle ${finalVehicleNumber} has been assigned for your trip ${booking.booking_code}.`
  );

  res.json({ booking: fullBooking(req.params.id) });
});

// Mark a trip completed (transporter or admin)
router.patch('/:id/complete', verifyToken, requireRole('transporter', 'admin'), (req, res) => {
  const booking = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (booking.status !== 'assigned') {
    return res.status(400).json({ error: 'Only assigned trips can be marked complete.' });
  }

  db.run(`UPDATE bookings SET status = 'completed', updated_at = datetime('now') WHERE id = ?`, [req.params.id]);
  if (booking.vehicle_id) {
    db.run(`UPDATE vehicles SET status = 'available' WHERE id = ?`, [booking.vehicle_id]);
  }
  notify(booking.user_id, booking.id, `Your trip ${booking.booking_code} has been marked completed.`);
  res.json({ booking: fullBooking(req.params.id) });
});

// Cancel a booking (the requesting user, while still pending)
router.patch('/:id/cancel', verifyToken, requireRole('user'), (req, res) => {
  const booking = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (booking.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only cancel your own requests.' });
  }
  if (!['pending', 'approved'].includes(booking.status)) {
    return res.status(400).json({ error: 'This request can no longer be cancelled.' });
  }

  db.run(`UPDATE bookings SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`, [req.params.id]);
  res.json({ booking: fullBooking(req.params.id) });
});

module.exports = router;
