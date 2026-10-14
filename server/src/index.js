// server/src/index.js
// ShareSpot Express API server

import express from 'express';
import cors from 'cors';

import authRoutes    from './routes/auth.js';
import eventsRoutes  from './routes/events.js';
import peopleRoutes  from './routes/people.js';
import locketRoutes  from './routes/locket.js';
import messagesRoutes from './routes/messages.js';
import { setupSwagger } from './docs/swagger.js';

// Trigger DB connection + schema on startup
import './db/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
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

import path from 'path';

// ── Start ─────────────────────────────────────────────────────────────────────
let server = null;
const isMain = process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename;

if (isMain) {
  server = app.listen(PORT, () => {
    console.log(`[Server] ShareSpot API running on http://localhost:${PORT}`);
    console.log(`[Server] Health: http://localhost:${PORT}/api/health`);
    console.log(`[Server] Docs:   http://localhost:${PORT}/api/docs`);
  });
}

export { app, server };
export default app;
