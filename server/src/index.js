// server/src/index.js
// Anvesha Express API server

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';

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

// ── Static file serving — real uploaded Culture Locket recordings & avatars ────
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
app.use('/avatars', express.static(path.join(UPLOADS_DIR, 'avatars')));

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

// ── Root Landing / API Info ───────────────────────────────────────────────────
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.type('html').send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Anvesha / ShareSpot API</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #faf6f0; color: #3b2d26; max-width: 640px; margin: 3rem auto; padding: 2rem; border-radius: 1.5rem; border: 2px solid #e8dbce; }
            h1 { color: #c56e50; font-family: serif; margin-top: 0; }
            .btn { display: inline-block; background: #c56e50; color: white; padding: 0.75rem 1.5rem; border-radius: 9999px; text-decoration: none; font-weight: bold; margin: 1rem 0; }
            .btn:hover { background: #b05e42; }
            ul { line-height: 1.8; }
            a { color: #c56e50; }
            code { background: #eee5dc; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <h1>✨ Anvesha & ShareSpot API Server</h1>
          <p>The backend REST & Realtime API is <strong>active and healthy</strong> on port <code>3001</code>.</p>
          <p>To use the full web application, visit the Vite frontend:</p>
          <p><a href="https://localhost:5173" class="btn">🚀 Open Web Application (Port 5173)</a></p>
          <hr style="border: 0; border-top: 1px solid #e8dbce; margin: 1.5rem 0;" />
          <h3>API Quick Links:</h3>
          <ul>
            <li><a href="/api/health"><code>GET /api/health</code></a> — Server health status</li>
            <li><a href="/api/docs"><code>GET /api/docs</code></a> — Interactive Swagger API documentation</li>
            <li><a href="/api/locket"><code>GET /api/locket</code></a> — Community culture locket audio feed</li>
            <li><a href="/api/events"><code>GET /api/events</code></a> — Living India cultural events feed</li>
          </ul>
        </body>
      </html>
    `);
  }
  res.json({
    name: 'ShareSpot API',
    status: 'ok',
    version: '1.0.0',
    frontend: 'https://localhost:5173',
    docs: '/api/docs',
    health: '/api/health',
  });
});

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
    console.log(`[Server] Anvesha API listening on port ${PORT}`);
    console.log(`[Server] Health: http://localhost:${PORT}/api/health`);
    console.log(`[Server] Docs:   http://localhost:${PORT}/api/docs`);
    console.log(`[Server] Realtime: Socket.IO attached`);
  });
}

export { app, server };
export default app;
