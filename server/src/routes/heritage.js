// server/src/routes/heritage.js
// Culture & Heritage Discovery API for Anvesha
// Covers sacred temples, cathedrals, historic mosques, monasteries, monuments, living traditions & hidden villages.

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

export const HERITAGE_CATEGORIES = {
  TEMPLES_RELIGIOUS: { label: 'Temples & Religious Heritage', icon: '🛕' },
  CHURCHES_CATHEDRALS: { label: 'Churches & Cathedrals', icon: '⛪' },
  MOSQUES_ISLAMIC: { label: 'Mosques & Islamic Heritage', icon: '🕌' },
  MONASTERIES_SPIRITUAL: { label: 'Monasteries & Spiritual Centers', icon: '☸️' },
  MONUMENTS_WALKS: { label: 'Historic Monuments & Walks', icon: '🏰' },
  PERFORMANCES_CRAFTS: { label: 'Performances, Festivals & Crafts', icon: '🎭' },
  HIDDEN_VILLAGES: { label: 'Hidden Villages & Rural Destinations', icon: '🏡' }
};

export function formatHeritage(row) {
  if (!row) return null;
  const categoryLabel = row.category_label || HERITAGE_CATEGORIES[row.category]?.label || 'Cultural Heritage';
  const isPermanent = Boolean(row.is_permanent_place);
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categoryLabel,
    category_label: categoryLabel,
    isPermanentPlace: isPermanent,
    is_permanent_place: row.is_permanent_place,
    state: row.state,
    stateId: row.state_id,
    state_id: row.state_id,
    city: row.city || '',
    locationSummary: row.location_summary,
    location_summary: row.location_summary,
    lat: row.lat !== null ? Number(row.lat) : null,
    lng: row.lng !== null ? Number(row.lng) : null,
    description: row.description,
    culturalSignificance: row.cultural_significance || '',
    cultural_significance: row.cultural_significance || '',
    imageUrl: row.image_url || '/images/heritage-tapestry-bg.png',
    image_url: row.image_url || '/images/heritage-tapestry-bg.png',
    visitingHours: row.visiting_hours || 'Open to visitors according to standard site guidelines',
    visiting_hours: row.visiting_hours || 'Open to visitors according to standard site guidelines',
    eventDate: row.event_date || '',
    event_date: row.event_date || '',
    eventDateIso: row.event_date_iso || '',
    event_date_iso: row.event_date_iso || '',
    dressGuidelines: row.dress_guidelines || 'Modest, respectful attire recommended.',
    dress_guidelines: row.dress_guidelines || 'Modest, respectful attire recommended.',
    photographyRules: row.photography_rules || 'Check local on-site signage before photographing sanctums.',
    photography_rules: row.photography_rules || 'Check local on-site signage before photographing sanctums.',
    customsEtiquette: row.customs_etiquette || 'Maintain peace, silence, and observe sacred customs.',
    customs_etiquette: row.customs_etiquette || 'Maintain peace, silence, and observe sacred customs.',
    organizerName: row.organizer_name || '',
    organizer_name: row.organizer_name || '',
    contactInfo: row.contact_info || '',
    contact_info: row.contact_info || '',
    verificationStatus: row.verification_status || 'VERIFIED',
    verification_status: row.verification_status || 'VERIFIED',
    sourceLabel: row.source_label || 'State Tourism & Heritage Department',
    source_label: row.source_label || 'State Tourism & Heritage Department',
    sourceUrl: row.source_url || '',
    source_url: row.source_url || '',
    submittedBy: row.submitted_by || null,
    submitted_by: row.submitted_by || null,
    createdAt: row.created_at,
    created_at: row.created_at
  };
}

// ── 1. GET /api/heritage — list places and cultural experiences ───────────────
router.get('/', optionalAuth, (req, res) => {
  const {
    q = '',
    category = 'ALL',
    state = 'ALL',
    stateId = 'ALL',
    type = 'ALL', // 'ALL' | 'PERMANENT' | 'SCHEDULED'
    limit = 50
  } = req.query;

  let sql = 'SELECT * FROM heritage_sites WHERE 1=1';
  const params = [];

  // Search query across name, description, city, state, location_summary
  if (q && q.trim()) {
    const term = `%${q.trim().toLowerCase()}%`;
    sql += ` AND (
      LOWER(name) LIKE ? OR
      LOWER(description) LIKE ? OR
      LOWER(city) LIKE ? OR
      LOWER(state) LIKE ? OR
      LOWER(location_summary) LIKE ? OR
      LOWER(cultural_significance) LIKE ?
    )`;
    params.push(term, term, term, term, term, term);
  }

  // Category filter
  if (category && category !== 'ALL') {
    sql += ' AND UPPER(category) = UPPER(?)';
    params.push(category);
  }

  // State filter
  const targetState = stateId !== 'ALL' ? stateId : state;
  if (targetState && targetState !== 'ALL') {
    const norm = targetState.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    sql += ' AND (LOWER(state_id) = LOWER(?) OR LOWER(state_id) = LOWER(?) OR LOWER(state) LIKE ?)';
    params.push(targetState, norm, `%${targetState}%`);
  }

  // Type filter (Permanent Place vs Scheduled Event)
  if (type === 'PERMANENT' || type === '1') {
    sql += ' AND is_permanent_place = 1';
  } else if (type === 'SCHEDULED' || type === '0') {
    sql += ' AND is_permanent_place = 0';
  }

  sql += ' ORDER BY is_permanent_place DESC, created_at DESC LIMIT ?';
  params.push(Math.min(parseInt(limit, 10) || 50, 100));

  try {
    const rows = db.prepare(sql).all(...params);
    res.json(rows.map(formatHeritage));
  } catch (err) {
    console.error('Error fetching heritage listings:', err);
    res.status(500).json({ error: 'Failed to load heritage listings' });
  }
});

// ── 2. GET /api/heritage/:id — get single heritage site detail ───────────────
router.get('/:id', optionalAuth, (req, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare('SELECT * FROM heritage_sites WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ error: 'Heritage listing not found' });
    }
    res.json(formatHeritage(row));
  } catch (err) {
    console.error('Error fetching heritage site by ID:', err);
    res.status(500).json({ error: 'Failed to fetch heritage listing' });
  }
});

// ── 3. POST /api/heritage — submit a new heritage site or experience ─────────
router.post('/',
  requireAuth,
  (req, res) => {
    const name = (req.body.name || '').trim();
    const category = (req.body.category || '').trim();
    const state = (req.body.state || '').trim();
    const description = (req.body.description || '').trim();
    const city = (req.body.city || '').trim();
    const locationSummary = (req.body.locationSummary || req.body.location_summary || city || '').trim();
    const isPermanentPlace = req.body.is_permanent_place !== undefined
      ? (req.body.is_permanent_place ? 1 : 0)
      : (req.body.isPermanentPlace !== undefined ? (req.body.isPermanentPlace ? 1 : 0) : 1);
    const stateId = (req.body.stateId || req.body.state_id || '').trim();
    const lat = req.body.lat !== undefined ? Number(req.body.lat) : null;
    const lng = req.body.lng !== undefined ? Number(req.body.lng) : null;
    const culturalSignificance = (req.body.culturalSignificance || req.body.cultural_significance || '').trim();
    const imageUrl = (req.body.imageUrl || req.body.image_url || '').trim();
    const visitingHours = (req.body.visitingHours || req.body.visiting_hours || 'Open to visitors according to standard site guidelines').trim();
    const eventDate = (req.body.eventDate || req.body.event_date || '').trim();
    const eventDateIso = (req.body.eventDateIso || req.body.event_date_iso || '').trim();
    const dressGuidelines = (req.body.dressGuidelines || req.body.dress_guidelines || 'Modest clothing recommended.').trim();
    const photographyRules = (req.body.photographyRules || req.body.photography_rules || 'Check signs on premises.').trim();
    const customsEtiquette = (req.body.customsEtiquette || req.body.customs_etiquette || 'Maintain respectful decorum.').trim();
    const organizerName = (req.body.organizerName || req.body.organizer_name || 'Community Heritage Contributor').trim();
    const contactInfo = (req.body.contactInfo || req.body.contact_info || '').trim();
    const sourceLabel = (req.body.sourceLabel || req.body.source_label || 'Community Contributed Heritage Listing').trim();
    const sourceUrl = (req.body.sourceUrl || req.body.source_url || '').trim();

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Landmark or event name must be at least 2 characters' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    if (!state) {
      return res.status(400).json({ error: 'State is required' });
    }
    if (!description || description.length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    }

    const validCategories = Object.keys(HERITAGE_CATEGORIES);
    const upperCategory = String(category).toUpperCase();
    if (!validCategories.includes(upperCategory)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    const normStateId = stateId
      ? stateId.toLowerCase().trim()
      : state.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    const id = `herit_${uuid().replace(/-/g, '').slice(0, 16)}`;
    const categoryLabel = HERITAGE_CATEGORIES[upperCategory].label;

    try {
      db.prepare(`
        INSERT INTO heritage_sites (
          id, name, category, category_label, is_permanent_place,
          state, state_id, city, location_summary, lat, lng,
          description, cultural_significance, image_url, visiting_hours,
          event_date, event_date_iso, dress_guidelines, photography_rules,
          customs_etiquette, organizer_name, contact_info, verification_status,
          source_label, source_url, submitted_by
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?
        )
      `).run(
        id,
        name.trim().slice(0, 200),
        upperCategory,
        categoryLabel,
        isPermanentPlace ? 1 : 0,
        state.trim().slice(0, 80),
        normStateId,
        city ? city.trim().slice(0, 80) : '',
        locationSummary.trim().slice(0, 200),
        lat !== null && !isNaN(lat) ? Number(lat) : null,
        lng !== null && !isNaN(lng) ? Number(lng) : null,
        description.trim().slice(0, 3000),
        culturalSignificance ? culturalSignificance.trim().slice(0, 2000) : '',
        imageUrl ? imageUrl.trim() : '/images/heritage-tapestry-bg.png',
        visitingHours ? visitingHours.trim().slice(0, 200) : 'Open to visitors',
        eventDate ? eventDate.trim().slice(0, 100) : '',
        eventDateIso ? eventDateIso.trim().slice(0, 50) : '',
        dressGuidelines ? dressGuidelines.trim().slice(0, 500) : 'Modest, respectful attire recommended.',
        photographyRules ? photographyRules.trim().slice(0, 500) : 'Check on-site signage before photographing sanctums.',
        customsEtiquette ? customsEtiquette.trim().slice(0, 500) : 'Maintain peace, silence, and observe local customs.',
        organizerName ? organizerName.trim().slice(0, 150) : '',
        contactInfo ? contactInfo.trim().slice(0, 200) : '',
        req.user?.is_admin ? 'VERIFIED' : 'COMMUNITY_SUBMITTED',
        sourceLabel ? sourceLabel.trim().slice(0, 150) : 'Community Contributed Heritage Listing',
        sourceUrl ? sourceUrl.trim().slice(0, 500) : '',
        req.user.id
      );

      const created = db.prepare('SELECT * FROM heritage_sites WHERE id = ?').get(id);
      res.status(201).json(formatHeritage(created));
    } catch (err) {
      console.error('Error creating heritage listing:', err);
      res.status(500).json({ error: 'Failed to create heritage listing' });
    }
  }
);

export default router;
