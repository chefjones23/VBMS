require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');

const database = require('./db/database');
const { JWT_SECRET } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const fleetRoutes = require('./routes/fleet');
const userRoutes = require('./routes/users');

const PORT = process.env.PORT || 5000;

async function start() {
  await database.init();

  const app = express();
  const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
  app.use(cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true
  }));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'VBMS API' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/fleet', fleetRoutes);
  app.use('/api/users', userRoutes);

  // 404 handler
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

  // Generic error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  const server = http.createServer(app);

  // --- WebSocket server for real-time notifications ---
  const wss = new WebSocketServer({ server, path: '/ws' });
  const userSockets = new Map(); // userId -> Set of sockets

  wss.on('connection', (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;

      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId).add(ws);

      ws.on('close', () => {
        userSockets.get(userId)?.delete(ws);
      });
    } catch (err) {
      ws.close();
    }
  });

  global.broadcastToUser = (userId, payload) => {
    const sockets = userSockets.get(userId);
    if (!sockets) return;
    const message = JSON.stringify(payload);
    sockets.forEach(ws => {
      if (ws.readyState === ws.OPEN) ws.send(message);
    });
  };

  server.listen(PORT, () => {
    console.log(`VBMS API + WebSocket server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
