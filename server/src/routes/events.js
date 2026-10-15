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

// Known venue/city anchors for coordinate resolution — Karnataka-first,
// but covers major India hubs too so the platform works for anyone in
// India, not just one campus or city.
const VENUE_COORDS = {
  // Manipal / Udupi coast (still a real cluster of campus activity)
  'mit campus':        { lat: 13.3525, lng: 74.7928 },
  'tiger circle':      { lat: 13.3541, lng: 74.7895 },
  'kmc greens':        { lat: 13.3541, lng: 74.7895 },
  'end point':         { lat: 13.3642, lng: 74.7876 },
  'wgsha':             { lat: 13.3482, lng: 74.7954 },
  'heritage village':  { lat: 13.3592, lng: 74.7985 },
  'hastashilpa':       { lat: 13.3592, lng: 74.7985 },
  'tma pai':           { lat: 13.3533, lng: 74.7915 },
  'manipal':           { lat: 13.3525, lng: 74.7928 },
  'udupi':             { lat: 13.3409, lng: 74.7421 },
  // Karnataka — major cities
  'bengaluru':         { lat: 12.9716, lng: 77.5946 },
  'bangalore':         { lat: 12.9716, lng: 77.5946 },
  'mysuru':            { lat: 12.2958, lng: 76.6394 },
  'mysore':            { lat: 12.2958, lng: 76.6394 },
  'mangaluru':         { lat: 12.9141, lng: 74.8560 },
  'mangalore':         { lat: 12.9141, lng: 74.8560 },
  'hubballi':          { lat: 15.3647, lng: 75.1240 },
  'hubli':             { lat: 15.3647, lng: 75.1240 },
  'belagavi':          { lat: 15.8497, lng: 74.4977 },
  'belgaum':           { lat: 15.8497, lng: 74.4977 },
  'hampi':             { lat: 15.3350, lng: 76.4600 },
  'gokarna':           { lat: 14.5479, lng: 74.3188 },
  'madikeri':          { lat: 12.4244, lng: 75.7382 },
  'coorg':             { lat: 12.3375, lng: 75.8069 },
  'shivamogga':        { lat: 13.9299, lng: 75.5681 },
  'karnataka':         { lat: 15.3173, lng: 75.7139 },
  // Other major India hubs (platform is for anyone in India)
  'delhi':             { lat: 28.6139, lng: 77.2090 },
  'mumbai':            { lat: 19.0760, lng: 72.8777 },
  'jaipur':            { lat: 26.9124, lng: 75.7873 },
  'agra':              { lat: 27.1767, lng: 78.0081 },
  'kolkata':           { lat: 22.5726, lng: 88.3639 },
  'chennai':           { lat: 13.0827, lng: 80.2707 },
  'hyderabad':         { lat: 17.3850, lng: 78.4867 },
  'pune':              { lat: 18.5204, lng: 73.8567 },
};

// Karnataka's approximate geographic centre — default fallback so
// unresolvable venues still land somewhere sensible on the live map.
const DEFAULT_CENTER = { lat: 15.3173, lng: 75.7139 };

function resolveCoords(venue, lat, lng) {
  if (lat && lng && isValidCoords(lat, lng)) return { lat: Number(lat), lng: Number(lng) };
  const vLower = (venue || '').toLowerCase();
  for (const [key, coords] of Object.entries(VENUE_COORDS)) {
    if (vLower.includes(key)) return coords;
  }
  // Small random jitter around the Karnataka center as fallback
  return {
    lat: DEFAULT_CENTER.lat + (Math.random() - 0.5) * 2,
    lng: DEFAULT_CENTER.lng + (Math.random() - 0.5) * 2,
  };
}

function inferStateAndCity(row) {
  const text = `${row.state || ''} ${row.neighborhood || ''} ${row.venue || ''} ${row.title || ''}`.toLowerCase();
  
  if (text.includes('karnataka') || text.includes('manipal') || text.includes('bengaluru') || text.includes('bangalore') || text.includes('mysuru') || text.includes('mysore') || text.includes('udupi') || text.includes('mangaluru') || text.includes('mangalore') || text.includes('hubli') || text.includes('hubballi') || text.includes('cubbon') || text.includes('indiranagar')) {
    const city = text.includes('manipal') ? 'Manipal' : text.includes('mysuru') || text.includes('mysore') ? 'Mysuru' : text.includes('udupi') ? 'Udupi' : text.includes('mangaluru') || text.includes('mangalore') ? 'Mangaluru' : 'Bengaluru';
    return { state: 'Karnataka', stateId: 'karnataka', city };
  }
  if (text.includes('kerala') || text.includes('kochi') || text.includes('thrissur') || text.includes('thiruvananthapuram')) {
    return { state: 'Kerala', stateId: 'kerala', city: text.includes('kochi') ? 'Kochi' : 'Thrissur' };
  }
  if (text.includes('tamil nadu') || text.includes('chennai') || text.includes('thanjavur') || text.includes('madurai')) {
    return { state: 'Tamil Nadu', stateId: 'tamil-nadu', city: text.includes('thanjavur') ? 'Thanjavur' : 'Chennai' };
  }
  if (text.includes('maharashtra') || text.includes('mumbai') || text.includes('pune') || text.includes('palghar')) {
    return { state: 'Maharashtra', stateId: 'maharashtra', city: text.includes('pune') ? 'Pune' : 'Mumbai' };
  }
  if (text.includes('rajasthan') || text.includes('jaipur') || text.includes('jodhpur')) {
    return { state: 'Rajasthan', stateId: 'rajasthan', city: text.includes('jodhpur') ? 'Jodhpur' : 'Jaipur' };
  }
  if (text.includes('west bengal') || text.includes('kolkata') || text.includes('shantiniketan')) {
    return { state: 'West Bengal', stateId: 'west-bengal', city: 'Kolkata' };
  }
  if (text.includes('delhi')) {
    return { state: 'Delhi', stateId: 'delhi', city: 'Delhi' };
  }
  return {
    state: row.state || 'Karnataka',
    stateId: (row.state || 'karnataka').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    city: row.city || row.neighborhood || 'Bengaluru'
  };
}

export const CATEGORY_PLACEHOLDERS = {
  culture:    '/images/yakshagana-art-bg.png',
  festivals:  '/images/taj_sunset.jpg',
  technology: '/images/cinematic_india_hero.jpg',
  music:      '/images/folk_musician.jpg',
  art:        '/images/heritage-tapestry-bg.png',
  film:       '/images/visite_reference.jpg',
  literature: '/images/himalaya_buddha.jpg',
  food:       '/images/kadak_chai.jpg',
  community:  '/images/cultural_atlas_ref.jpg',
  workshops:  '/images/heritage-tapestry-bg.png',
  science:    '/images/cinematic_india_hero.jpg',
};

// Aliases
CATEGORY_PLACEHOLDERS.heritage = CATEGORY_PLACEHOLDERS.culture;
CATEGORY_PLACEHOLDERS.celebrations = CATEGORY_PLACEHOLDERS.festivals;
CATEGORY_PLACEHOLDERS.crafts = CATEGORY_PLACEHOLDERS.art;
CATEGORY_PLACEHOLDERS.theatre = CATEGORY_PLACEHOLDERS.film;
CATEGORY_PLACEHOLDERS.books = CATEGORY_PLACEHOLDERS.literature;
CATEGORY_PLACEHOLDERS.dialects = CATEGORY_PLACEHOLDERS.community;

const BROKEN_PATTERNS = [
  'photo-1579783902614-a3fb3927b675',
  'photo-1600100397608-f70cff5a2e09',
  'photo-1609137144822-0d1279a099f6',
  'photo-1601925268312-2e6d1a3e1f5f',
];

export function isBrokenUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') return true;
  return BROKEN_PATTERNS.some((p) => url.includes(p));
}

export function getCategoryPlaceholder(category) {
  const cat = String(category || 'culture').toLowerCase().trim();
  return CATEGORY_PLACEHOLDERS[cat] || CATEGORY_PLACEHOLDERS.culture;
}

function formatEvent(row) {
  if (!row) return null;
  const geo = inferStateAndCity(row);
  const rawImg = row.image_url || row.image || '';
  const resolvedImg = (!isBrokenUrl(rawImg)) ? rawImg : getCategoryPlaceholder(row.category);
  return {
    ...row,
    state: row.state || geo.state,
    stateId: row.state_id || row.stateId || geo.stateId,
    city: row.city || geo.city,
    image: resolvedImg,
    imageUrl: resolvedImg,
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
      venue, neighborhood = 'Karnataka',
      organizer = 'Community Organizer', description = '',
      lat, lng,
    } = req.body;

    const date_label = req.body.date_label || req.body.date || 'Upcoming Weekend';
    const datetime_iso = req.body.datetime_iso || req.body.datetime || new Date().toISOString();
    const source_url = req.body.source_url || req.body.sourceUrl || '';
    const image_url = req.body.image_url || req.body.image || getCategoryPlaceholder(category);

    // Validate
    if (title.length > 200)
      return res.status(400).json({ error: 'Title too long (max 200 chars)' });
    if (!isValidCategory(category))
      return res.status(400).json({ error: 'Invalid category' });
    if (source_url && !isValidUrl(source_url))
      return res.status(400).json({ error: 'source_url must be http or https' });
    if (image_url && !isValidUrl(image_url, 'image'))
      return res.status(400).json({ error: 'image_url must be valid image URL or allowed data image' });
    if (description.length > 2000)
      return res.status(400).json({ error: 'Description too long (max 2000 chars)' });

    const coords = resolveCoords(venue, lat, lng);
    // Mirrors PIN_CATEGORIES in client/src/components/IllustratedPin.jsx
    const categoryLabels = {
      culture: 'Culture & Heritage', festivals: 'Festivals & Celebrations',
      technology: 'Technology & Hackathons', music: 'Folk & Classical Music',
      art: 'Art & Traditional Crafts', film: 'Film & Theatre',
      literature: 'Books & Literature', science: 'Science & Discovery',
      workshops: 'Hands-on Workshops', community: 'Dialect & Community Circles',
    };

    // Check for existing identical event to prevent duplicate submissions
    const existing = db.prepare(
      'SELECT id FROM events WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) AND LOWER(TRIM(venue)) = LOWER(TRIM(?))'
    ).get(title, venue);

    if (existing) {
      return res.status(409).json({ error: 'An event with this title and venue already exists' });
    }

    const id = `evt_${uuid().replace(/-/g, '').slice(0, 12)}`;
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

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    res.status(201).json(formatEvent(event));
  }
);

// ── PATCH /api/events/:id — edit event (owner only) ───────────────────────────
router.patch('/:id',
  requireAuth,
  (req, res) => {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Event not found' });

    if (existing.submitted_by !== req.user.id) {
      return res.status(403).json({ error: 'Only the event creator can edit this event' });
    }

    const allowed = ['title', 'category', 'date_label', 'datetime_iso', 'venue', 'neighborhood', 'organizer', 'image_url', 'description', 'source_url', 'lat', 'lng'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.title && updates.title.length > 200)
      return res.status(400).json({ error: 'Title too long (max 200 chars)' });
    if (updates.category && !isValidCategory(updates.category))
      return res.status(400).json({ error: 'Invalid category' });
    if (updates.source_url && !isValidUrl(updates.source_url))
      return res.status(400).json({ error: 'source_url must be http or https' });
    if (updates.image_url && !isValidUrl(updates.image_url, 'image'))
      return res.status(400).json({ error: 'image_url must be valid image URL' });
    if (updates.description && updates.description.length > 2000)
      return res.status(400).json({ error: 'Description too long (max 2000 chars)' });

    const coords = (updates.lat !== undefined && updates.lng !== undefined)
      ? resolveCoords(updates.venue || existing.venue, updates.lat, updates.lng)
      : (updates.venue ? resolveCoords(updates.venue, existing.lat, existing.lng) : null);

    if (coords) {
      updates.lat = coords.lat;
      updates.lng = coords.lng;
    }

    const categoryLabels = {
      culture: 'Culture & Heritage', festivals: 'Festivals & Celebrations',
      technology: 'Technology & Hackathons', music: 'Folk & Classical Music',
      art: 'Art & Traditional Crafts', film: 'Film & Theatre',
      literature: 'Books & Literature', science: 'Science & Discovery',
      workshops: 'Hands-on Workshops', community: 'Dialect & Community Circles',
    };
    if (updates.category) {
      updates.category_label = categoryLabels[updates.category] || 'Culture & Heritage';
    }

    if (Object.keys(updates).length > 0) {
      const sets = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
      db.prepare(`UPDATE events SET ${sets} WHERE id = @id`).run({ ...updates, id });
    }

    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    res.json(formatEvent(updated));
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
