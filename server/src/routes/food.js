// server/src/routes/food.js
// Local Food & Traditional Culinary Discovery API for Anvesha
// GET  /api/food               — List traditional dishes (filter by state, city, dietary, event, q)
// GET  /api/food/event/:eventId — Get traditional dishes associated with an event or its location
// GET  /api/food/state/:stateId — Get regional dishes for a state
// GET  /api/food/:id           — Get one dish by ID

import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

export function formatDish(row) {
  if (!row) return null;
  let allergens = [];
  try {
    allergens = Array.isArray(row.allergens)
      ? row.allergens
      : (row.allergens ? JSON.parse(row.allergens) : []);
  } catch (_) {
    allergens = [];
  }

  return {
    id: row.id,
    name: row.name,
    regionalName: row.regional_name || '',
    region: row.region,
    stateId: row.state_id,
    city: row.city || '',
    eventId: row.event_id || null,
    category: row.category,
    categoryLabel: row.category_label || 'Traditional Dish',
    description: row.description,
    culturalTradition: row.cultural_tradition,
    imageUrl: row.image_url || '/images/kadak_chai.jpg',
    dietaryType: row.dietary_type || 'UNKNOWN',
    allergens,
    isSampleData: Boolean(row.is_sample_data),
    sourceAttribution: row.source_attribution || 'Curated Heritage Archive (Sample Data)',
    createdAt: row.created_at,
  };
}

export function normalizeState(id) {
  if (!id) return '';
  const s = id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const isoMap = {
    'in-ka': 'karnataka',
    'in-kl': 'kerala',
    'in-tn': 'tamil-nadu',
    'in-mh': 'maharashtra',
    'in-rj': 'rajasthan',
    'in-wb': 'west-bengal',
    'in-dl': 'delhi',
  };
  return isoMap[s] || s;
}

// ── GET /api/food ─────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const {
    state,
    stateId,
    city,
    eventId,
    dietary,
    category,
    q = '',
    limit = 50,
  } = req.query;

  let sql = 'SELECT * FROM local_dishes WHERE 1=1';
  const params = [];

  const targetState = stateId || state;
  if (targetState && targetState !== 'ALL') {
    const norm = normalizeState(targetState);
    sql += ' AND (LOWER(state_id) = LOWER(?) OR LOWER(state_id) = LOWER(?))';
    params.push(targetState, norm);
  }

  if (city && city.trim()) {
    sql += ' AND (LOWER(city) LIKE ? OR LOWER(region) LIKE ?)';
    const likeCity = `%${city.trim().toLowerCase()}%`;
    params.push(likeCity, likeCity);
  }

  if (eventId && eventId.trim()) {
    sql += ' AND event_id = ?';
    params.push(eventId.trim());
  }

  if (dietary && dietary !== 'ALL') {
    sql += ' AND dietary_type = ?';
    params.push(dietary);
  }

  if (category && category !== 'ALL') {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (q.trim()) {
    sql += ' AND (name LIKE ? OR regional_name LIKE ? OR description LIKE ? OR cultural_tradition LIKE ? OR region LIKE ?)';
    const likeQ = `%${q.trim()}%`;
    params.push(likeQ, likeQ, likeQ, likeQ, likeQ);
  }

  sql += ' ORDER BY id ASC LIMIT ?';
  params.push(Math.min(Number(limit) || 50, 100));

  const rows = db.prepare(sql).all(...params).map(formatDish);
  res.json(rows);
});

// ── GET /api/food/event/:eventId — Dishes for an event or its locale ──────────
router.get('/event/:eventId', (req, res) => {
  const { eventId } = req.params;

  // 1. Check if event exists
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  // 2. Fetch directly linked dishes first
  const directDishes = db.prepare('SELECT * FROM local_dishes WHERE event_id = ?').all(eventId);

  // 3. Also fetch regional dishes matching the event's state/city
  const eventText = `${event.venue || ''} ${event.neighborhood || ''} ${event.city || ''} ${event.state || ''}`.toLowerCase();
  let stateId = 'karnataka';
  if (eventText.includes('kerala')) stateId = 'kerala';
  else if (eventText.includes('tamil nadu') || eventText.includes('chennai') || eventText.includes('madurai')) stateId = 'tamil-nadu';
  else if (eventText.includes('maharashtra') || eventText.includes('mumbai') || eventText.includes('pune')) stateId = 'maharashtra';
  else if (eventText.includes('rajasthan') || eventText.includes('jaipur')) stateId = 'rajasthan';
  else if (eventText.includes('bengal') || eventText.includes('kolkata')) stateId = 'west-bengal';

  const regionalDishes = db.prepare(
    'SELECT * FROM local_dishes WHERE state_id = ? AND (event_id IS NULL OR event_id != ?)'
  ).all(stateId, eventId);

  // Deduplicate and prioritize direct event dishes
  const allDishes = [...directDishes, ...regionalDishes];
  const seen = new Set();
  const deduped = [];
  for (const d of allDishes) {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      deduped.push(formatDish(d));
    }
  }

  res.json({
    event: {
      id: event.id,
      title: event.title,
      venue: event.venue,
      city: event.city || 'Karnataka',
      stateId,
    },
    dishes: deduped,
  });
});

// ── GET /api/food/state/:stateId — Regional culinary heritage ─────────────────
router.get('/state/:stateId', (req, res) => {
  const { stateId } = req.params;
  const norm = normalizeState(stateId);
  const rows = db.prepare(
    'SELECT * FROM local_dishes WHERE LOWER(state_id) = LOWER(?) OR LOWER(state_id) = LOWER(?) ORDER BY category ASC, id ASC'
  ).all(stateId, norm).map(formatDish);

  res.json(rows);
});

// ── POST /api/food/suggest — Community traditional dish contribution ──────────
router.post('/suggest', (req, res) => {
  const {
    name,
    regionalName = '',
    region,
    stateId,
    city = '',
    eventId = null,
    category = 'TRADITIONAL_DISH',
    categoryLabel = 'Heirloom Delicacy',
    description,
    culturalTradition = '',
    imageUrl = '',
    dietaryType = 'UNKNOWN',
    allergens = [],
  } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Valid dish name is required (min 2 characters)' });
  }

  if (!region || typeof region !== 'string' || region.trim().length < 2) {
    return res.status(400).json({ error: 'Cultural region or tradition is required' });
  }

  if (!stateId || typeof stateId !== 'string') {
    return res.status(400).json({ error: 'State identifier is required' });
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return res.status(400).json({ error: 'Description is required (min 10 characters)' });
  }

  const validDietary = ['VEGETARIAN', 'VEGAN', 'NON_VEGETARIAN', 'UNKNOWN'];
  const sanitizedDietary = validDietary.includes(dietaryType) ? dietaryType : 'UNKNOWN';

  const sanitizedAllergens = Array.isArray(allergens)
    ? allergens.filter(a => typeof a === 'string' && a.trim()).slice(0, 10)
    : [];

  const normState = normalizeState(stateId);
  const dishId = `dish_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    const insertStmt = db.prepare(`
      INSERT INTO local_dishes (
        id, name, regional_name, region, state_id, city, event_id,
        category, category_label, description, cultural_tradition,
        image_url, dietary_type, allergens, is_sample_data, source_attribution, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, 0, ?, ?
      )
    `);

    insertStmt.run(
      dishId,
      name.trim(),
      regionalName.trim(),
      region.trim(),
      normState,
      city.trim(),
      eventId || null,
      category,
      categoryLabel,
      description.trim(),
      culturalTradition.trim(),
      imageUrl.trim() || 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
      sanitizedDietary,
      JSON.stringify(sanitizedAllergens),
      'Community Heritage Contribution',
      new Date().toISOString()
    );

    const inserted = db.prepare('SELECT * FROM local_dishes WHERE id = ?').get(dishId);
    return res.status(201).json({
      message: 'Traditional dish submitted to local food archive successfully!',
      dish: formatDish(inserted),
    });
  } catch (err) {
    console.error('Failed to submit dish:', err);
    return res.status(500).json({ error: 'Failed to record dish contribution.' });
  }
});

// ── GET /api/food/:id — Single dish details ──────────────────────────────────
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM local_dishes WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Traditional dish not found' });
  }
  res.json(formatDish(row));
});

export default router;
