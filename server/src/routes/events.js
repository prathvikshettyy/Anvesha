// server/src/routes/events.js
// GET    /api/events              — list events (with optional search & category filter)
// GET    /api/events/:id          — get one event by ID
// POST   /api/events              — submit a new event (auth required)
// POST   /api/events/:id/save     — save/unsave event (auth required)
// GET    /api/events/saved        — get current user's saved events (auth required)

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { isValidUrl, isValidCategory, isValidCoords, requireFields } from '../middleware/validate.js';

const router = Router();

// Known Manipal venue anchors for coordinate resolution
const VENUE_COORDS = {
  'mit campus':        { lat: 13.3525, lng: 74.7928 },
  'tiger circle':      { lat: 13.3541, lng: 74.7895 },
  'kmc greens':        { lat: 13.3541, lng: 74.7895 },
  'end point':         { lat: 13.3642, lng: 74.7876 },
  'wgsha':             { lat: 13.3482, lng: 74.7954 },
  'heritage village':  { lat: 13.3592, lng: 74.7985 },
  'hastashilpa':       { lat: 13.3592, lng: 74.7985 },
  'tma pai':           { lat: 13.3533, lng: 74.7915 },
  'manipal':           { lat: 13.3525, lng: 74.7928 },
};

function resolveCoords(venue, lat, lng) {
  if (lat && lng && isValidCoords(lat, lng)) return { lat: Number(lat), lng: Number(lng) };
  const vLower = (venue || '').toLowerCase();
  for (const [key, coords] of Object.entries(VENUE_COORDS)) {
    if (vLower.includes(key)) return coords;
  }
  // Small random jitter around Manipal center as fallback
  return {
    lat: 13.3525 + (Math.random() - 0.5) * 0.008,
    lng: 74.7928 + (Math.random() - 0.5) * 0.008,
  };
}

// ── GET /api/events ───────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { q = '', category = 'ALL', limit = 50, offset = 0 } = req.query;

  let sql = `
    SELECT e.*,
      (SELECT COUNT(*) FROM saved_events WHERE event_id = e.id) as save_count
    FROM events e
    WHERE 1=1
  `;
  const params = [];

  if (category !== 'ALL' && isValidCategory(category)) {
    sql += ' AND e.category = ?';
    params.push(category);
  }

  if (q.trim()) {
    sql += ` AND (
      e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ? OR e.organizer LIKE ?
    )`;
    const like = `%${q.trim().slice(0, 100)}%`;
    params.push(like, like, like, like);
  }

  sql += ' ORDER BY e.datetime_iso ASC LIMIT ? OFFSET ?';
  params.push(Math.min(Number(limit) || 50, 100), Math.max(Number(offset) || 0, 0));

  const events = db.prepare(sql).all(...params);
  res.json(events);
});

// ── GET /api/events/saved — MUST be before /:id ───────────────────────────────
router.get('/saved', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT e.* FROM events e
    JOIN saved_events se ON se.event_id = e.id
    WHERE se.user_id = ?
    ORDER BY se.saved_at DESC
  `).all(req.user.id);
  res.json(rows);
});

// ── GET /api/events/:id ───────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// ── POST /api/events — submit new event ───────────────────────────────────────
router.post('/',
  requireAuth,
  requireFields('title', 'venue'),
  (req, res) => {
    const {
      title, category = 'culture', date_label = 'Upcoming',
      datetime_iso, venue, neighborhood = 'Manipal Hub',
      organizer = 'Campus Cultural Collective', description = '',
      source_url = '', image_url = '',
      lat, lng,
    } = req.body;

    // Validate
    if (title.length > 200)
      return res.status(400).json({ error: 'Title too long (max 200 chars)' });
    if (!isValidCategory(category))
      return res.status(400).json({ error: 'Invalid category' });
    if (source_url && !isValidUrl(source_url))
      return res.status(400).json({ error: 'source_url must be http or https' });
    if (image_url && !isValidUrl(image_url))
      return res.status(400).json({ error: 'image_url must be http or https' });
    if (description.length > 2000)
      return res.status(400).json({ error: 'Description too long (max 2000 chars)' });

    const coords = resolveCoords(venue, lat, lng);
    const categoryLabels = {
      culture: 'Culture & Heritage', languages: 'Dialects & Languages',
      crafts: 'Traditional Crafts', music: 'Folk & Classical Music',
      food: 'Culinary Heritage', hackathons: 'Technology & Hackathons',
      campus: 'Campus Events', film: 'Movies & Regional Cinema',
      literature: 'Books & Literature', workshops: 'Workshops & Mentorship',
    };

    const id = `evt_${uuid().replace(/-/g, '').slice(0, 12)}`;
    db.prepare(`
      INSERT INTO events
        (id, title, category, category_label, date_label, datetime_iso, venue,
         neighborhood, lat, lng, organizer, image_url, description, source_url,
         source_label, verification_status, submitted_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'Community Submitted','PENDING',?)
    `).run(
      id, title.slice(0, 200), category, categoryLabels[category],
      date_label.slice(0, 100), datetime_iso || new Date().toISOString(),
      venue.slice(0, 300), neighborhood.slice(0, 200),
      coords.lat, coords.lng,
      organizer.slice(0, 200), image_url, description.slice(0, 2000),
      source_url, req.user.id
    );

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    res.status(201).json(event);
  }
);

// ── POST /api/events/:id/save — toggle save ───────────────────────────────────
router.post('/:id/save', requireAuth, (req, res) => {
  const { id } = req.params;
  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const existing = db.prepare(
    'SELECT 1 FROM saved_events WHERE user_id = ? AND event_id = ?'
  ).get(req.user.id, id);

  if (existing) {
    db.prepare('DELETE FROM saved_events WHERE user_id = ? AND event_id = ?').run(req.user.id, id);
    res.json({ saved: false });
  } else {
    db.prepare('INSERT INTO saved_events (user_id, event_id) VALUES (?, ?)').run(req.user.id, id);
    res.json({ saved: true });
  }
});

export default router;
