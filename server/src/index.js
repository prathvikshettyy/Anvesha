// server/src/index.js
// Anvesha Express API server

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import os from 'os';

import authRoutes    from './routes/auth.js';
import eventsRoutes  from './routes/events.js';
import peopleRoutes  from './routes/people.js';
import locketRoutes  from './routes/locket.js';
import messagesRoutes from './routes/messages.js';
import { setupSwagger } from './docs/swagger.js';
import { initRealtime } from './realtime/socket.js';
import { UPLOADS_DIR } from './lib/uploads.js';

// Trigger DB connection + schema on startup
import './db/index.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// ── Middleware ────────────────────────────────────────────────────────────────
// In dev we accept any origin so that phones/tablets on the LAN can reach the
// API when accessed via the machine's local IP (e.g. http://192.168.x.x:3001).
const corsOrigin = process.env.NODE_ENV === 'production'
  ? CLIENT_ORIGIN
  : true; // reflect any Origin in dev

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '2mb' })); // 2MB cap — covers base64 audio clips
app.use(express.urlencoded({ extended: false }));

// ── Security Headers ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── Static file serving — real uploaded Culture Locket recordings ────────────
app.use('/uploads', express.static(UPLOADS_DIR, {
  setHeaders: (res, filePath) => {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.webm')) {
      res.setHeader('Content-Type', 'audio/webm');
    } else if (lower.endsWith('.ogg')) {
      res.setHeader('Content-Type', 'audio/ogg');
    } else if (lower.endsWith('.mp4') || lower.endsWith('.m4a') || lower.endsWith('.aac')) {
      res.setHeader('Content-Type', 'audio/mp4');
    } else if (lower.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else if (lower.endsWith('.wav')) {
      res.setHeader('Content-Type', 'audio/wav');
    }
    res.setHeader('Accept-Ranges', 'bytes');
  },
}));

// ── Request logging (dev only) ────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── API Documentation (Swagger UI) ───────────────────────────────────────────
setupSwagger(app, '/api/docs');

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/events',   eventsRoutes);
app.use('/api/people',   peopleRoutes);
app.use('/api/locket',   locketRoutes);
app.use('/api/messages', messagesRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ShareSpot API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[Error]', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
let server = null;
const isMain = process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename;

if (isMain) {
  const httpServer = createServer(app);
  initRealtime(httpServer, CLIENT_ORIGIN);
  server = httpServer.listen(PORT, '0.0.0.0', () => {
    const nets = os.networkInterfaces();
    const lanIp = Object.values(nets).flat().find(n => n.family === 'IPv4' && !n.internal)?.address;
    console.log(`[Server] Anvesha API running on http://localhost:${PORT}`);
    if (lanIp) console.log(`[Server] Network:  http://${lanIp}:${PORT}  ← open this on other devices`);
    console.log(`[Server] Health: http://localhost:${PORT}/api/health`);
    console.log(`[Server] Docs:   http://localhost:${PORT}/api/docs`);
    console.log(`[Server] Realtime: Socket.IO attached`);
  });
}

export { app, server };
export default app;
