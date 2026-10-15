import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes    from './routes/auth.js';
import eventsRoutes  from './routes/events.js';
import peopleRoutes  from './routes/people.js';
import locketRoutes  from './routes/locket.js';
import messagesRoutes from './routes/messages.js';
import communitiesRoutes from './routes/communities.js';
import { setupSwagger } from './docs/swagger.js';
import { initRealtime } from './realtime/socket.js';
import { UPLOADS_DIR } from './lib/uploads.js';

// Trigger DB connection + schema on startup
import './db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST = path.resolve(__dirname, '..', '..', 'client', 'dist');

const app = express();
const PORT = process.env.PORT || 3001;
const corsOrigin = process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN : true;

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
app.use('/api/messages',    messagesRoutes);
app.use('/api/communities', communitiesRoutes);

// ── Client SPA Production Serving ───────────────────────────────────────────
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ShareSpot API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Client SPA Catch-all & Dev Root Fallback ──────────────────────────────────
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/avatars')) {
    return next();
  }
  if (fs.existsSync(CLIENT_DIST)) {
    return res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  }
  if (req.path === '/') {
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
            <p>To view the full web application, run <code>npm run build</code> or start the Vite dev server with <code>.\\scripts\\dev.ps1</code>.</p>
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
    return res.json({
      name: 'ShareSpot API',
      status: 'ok',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/api/health',
    });
  }
  next();
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
const isMain = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === path.resolve(__filename).toLowerCase();

if (isMain) {
  const httpServer = createServer(app);
  initRealtime(httpServer, corsOrigin);
  server = httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Anvesha API listening on port ${PORT}`);
    console.log(`[Server] Health: http://localhost:${PORT}/api/health`);
    console.log(`[Server] Docs:   http://localhost:${PORT}/api/docs`);
    console.log(`[Server] Realtime: Socket.IO attached`);
  });
}

export { app, server };
export default app;
