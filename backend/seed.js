// Run directly with: node seed.js
// Also imported and called automatically by server.js on every boot,
// since Render's free tier has no Shell access and wipes the disk on
// every restart/redeploy. Every insert here already checks for an
// existing row first, so calling this repeatedly is always safe.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const database = require('./db/database');

async function seed() {
  const demoUsers = [
    { name: 'Arun Kumar', email: 'user@vbms.test', password: 'password123', role: 'user', department: 'Operations' },
    { name: 'Priya Raman', email: 'hod@vbms.test', password: 'password123', role: 'hod', department: 'Operations' },
    { name: 'Divya Shankar', email: 'user2@vbms.test', password: 'password123', role: 'user', department: 'Sales' },
    { name: 'Karthik Iyer', email: 'hod2@vbms.test', password: 'password123', role: 'hod', department: 'Sales' },
    { name: 'Suresh Babu', email: 'transporter@vbms.test', password: 'password123', role: 'transporter', department: 'Logistics' },
    { name: 'Admin', email: 'admin@vbms.test', password: 'password123', role: 'admin', department: 'Administration' }
  ];

  for (const u of demoUsers) {
    const existing = database.get('SELECT id FROM users WHERE email = ?', [u.email]);
    if (existing) {
      console.log(`Skipping ${u.email} (already exists)`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, 10);
    database.run(
      `INSERT INTO users (id, name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), u.name, u.email, hash, u.role, u.department]
    );
    console.log(`Created ${u.role}: ${u.email} / ${u.password}`);
  }

  const demoVehicles = [
    { vehicle_number: 'TN 45 AB 1234', vehicle_type: 'Sedan', capacity: 4, driver_name: 'Murugan', driver_phone: '9876500001' },
    { vehicle_number: 'TN 45 CD 5678', vehicle_type: 'SUV', capacity: 6, driver_name: 'Ravi', driver_phone: '9876500002' },
    { vehicle_number: 'TN 48 EF 9012', vehicle_type: 'Mini Bus', capacity: 12, driver_name: 'Karthik', driver_phone: '9876500003' }
  ];

  for (const v of demoVehicles) {
    const existing = database.get('SELECT id FROM vehicles WHERE vehicle_number = ?', [v.vehicle_number]);
    if (existing) continue;
    database.run(
      `INSERT INTO vehicles (id, vehicle_number, vehicle_type, capacity, driver_name, driver_phone) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), v.vehicle_number, v.vehicle_type, v.capacity, v.driver_name, v.driver_phone]
    );
    console.log(`Added vehicle: ${v.vehicle_number}`);
  }

  console.log('Seed check complete. Demo logins (password: password123):');
  demoUsers.forEach(u => console.log(`  ${u.role.padEnd(12)} ${u.email}`));
}

module.exports = { seed };

// Only run database.init() + exit when invoked directly via `node seed.js`.
// When imported by server.js, database.init() has already run and the
// process should keep running as the live server.
if (require.main === module) {
  database.init()
    .then(() => seed())
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
