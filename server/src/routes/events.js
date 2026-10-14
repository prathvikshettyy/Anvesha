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

function formatEvent(row) {
  if (!row) return null;
  return {
    ...row,
    image: row.image_url || row.image || '',
    imageUrl: row.image_url || row.image || '',
    date: row.date_label || row.date || 'Upcoming Weekend',
    datetime: row.datetime_iso || row.datetime || new Date().toISOString(),
    categoryLabel: row.category_label || row.categoryLabel || row.category,
    sourceUrl: row.source_url || row.sourceUrl || '',
    sourceLabel: row.source_label || row.sourceLabel || 'Community Verified',
    verificationStatus: row.verification_status || row.verificationStatus || 'VERIFIED',
    attendeeCount: row.attendee_count ?? row.attendeeCount ?? 0,
    isOnline: Boolean(row.is_online),
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

  const rawEvents = db.prepare(sql).all(...params).map(formatEvent);
  // Deduplicate events by id and normalized title so duplicates never reach client
  const seenIds = new Set();
  const seenTitles = new Set();
  const events = rawEvents.filter(e => {
    if (!e) return false;
    const titleNorm = (e.title || '').trim().toLowerCase();
    if (titleNorm.includes('<script') || titleNorm.includes('security test')) return false;
    if (seenIds.has(e.id) || (titleNorm && seenTitles.has(titleNorm))) {
      return false;
    }
    seenIds.add(e.id);
    if (titleNorm) seenTitles.add(titleNorm);
    return true;
  });
  res.json(events);
});

// ── GET /api/events/saved — MUST be before /:id ───────────────────────────────
router.get('/saved', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT e.* FROM events e
    JOIN saved_events se ON se.event_id = e.id
    WHERE se.user_id = ?
    ORDER BY se.saved_at DESC
  `).all(req.user.id).map(formatEvent);
  res.json(rows);
});

// ── GET /api/events/:id ───────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(formatEvent(event));
});

// ── POST /api/events — submit new event ───────────────────────────────────────
router.post('/',
  requireAuth,
  requireFields('title', 'venue'),
  (req, res) => {
    const {
      title, category = 'culture',
      venue, neighborhood = 'Manipal Hub',
      organizer = 'Campus Cultural Collective', description = '',
      lat, lng,
    } = req.body;

    const date_label = req.body.date_label || req.body.date || 'Upcoming Weekend';
    const datetime_iso = req.body.datetime_iso || req.body.datetime || new Date().toISOString();
    const source_url = req.body.source_url || req.body.sourceUrl || '';
    const image_url = req.body.image_url || req.body.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';

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

    // Check for existing identical event to prevent duplicate submissions
    const existing = db.prepare(
      'SELECT * FROM events WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) AND LOWER(TRIM(venue)) = LOWER(TRIM(?))'
    ).get(title, venue);

    const id = existing ? existing.id : `evt_${uuid().replace(/-/g, '').slice(0, 12)}`;
    if (existing) {
      db.prepare(`
        UPDATE events SET
          category = ?, category_label = ?, date_label = ?, datetime_iso = ?,
          neighborhood = ?, lat = ?, lng = ?, organizer = ?, image_url = ?,
          description = ?, source_url = ?, submitted_by = ?
        WHERE id = ?
      `).run(
        category, categoryLabels[category] || 'Culture & Heritage',
        date_label.slice(0, 100), datetime_iso,
        neighborhood.slice(0, 200), coords.lat, coords.lng,
        organizer.slice(0, 200), image_url, description.slice(0, 2000),
        source_url, req.user.id, id
      );
    } else {
      db.prepare(`
        INSERT INTO events
          (id, title, category, category_label, date_label, datetime_iso, venue,
           neighborhood, lat, lng, organizer, image_url, description, source_url,
           source_label, verification_status, submitted_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'Community Submitted','COMMUNITY_REPORTED',?)
      `).run(
        id, title.slice(0, 200), category, categoryLabels[category] || 'Culture & Heritage',
        date_label.slice(0, 100), datetime_iso,
        venue.slice(0, 300), neighborhood.slice(0, 200),
        coords.lat, coords.lng,
        organizer.slice(0, 200), image_url, description.slice(0, 2000),
        source_url, req.user.id
      );
    }

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    res.status(201).json(formatEvent(event));
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
