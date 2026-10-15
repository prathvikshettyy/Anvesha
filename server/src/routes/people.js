// server/src/routes/people.js
// GET  /api/people          — discover users (with match scoring, respects is_discoverable)
// GET  /api/people/:id      — get one user's public profile
// POST /api/people/:id/connect   — send/accept connection request
// GET  /api/people/connections   — list current user's connections

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { computeMatch, getConnectedFriendIds } from '../lib/matching.js';

const router = Router();

function loadProfile(userId) {
  const interests = db.prepare('SELECT interest_id, intention FROM user_interests WHERE user_id = ?').all(userId);
  const skills = db.prepare('SELECT skill, skill_type FROM user_skills WHERE user_id = ?').all(userId);
  const languages = db.prepare('SELECT language FROM user_languages WHERE user_id = ?').all(userId).map(r => r.language);
  return { interests, skills, languages };
}

// ── GET /api/people/connections — MUST be before /:id ─────────────────────────
router.get('/connections', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT
      u.id, u.handle, u.name, u.bio, u.avatar_url, u.state, u.city, u.neighborhood,
      u.preferred_mode, u.last_active_at,
      c.status, c.id as connection_id
    FROM connections c
    JOIN users u ON (
      (c.requester_id = ? AND u.id = c.receiver_id) OR
      (c.receiver_id  = ? AND u.id = c.requester_id)
    )
    WHERE c.status = 'CONNECTED'
      AND u.is_discoverable = 1
  `).all(req.user.id, req.user.id);

  const enriched = rows.map(u => ({
    ...u,
    languages: db.prepare('SELECT language FROM user_languages WHERE user_id = ?').all(u.id).map(r => r.language),
  }));

  res.json(enriched);
});

// ── GET /api/people/requests/incoming — MUST be before /:id ───────────────────
router.get('/requests/incoming', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT
      c.id as connection_id, c.requester_id, c.receiver_id, c.created_at,
      u.id, u.handle, u.name, u.avatar_url, u.city, u.state, u.bio
    FROM connections c
    JOIN users u ON u.id = c.requester_id
    WHERE c.receiver_id = ? AND c.status = 'PENDING'
    ORDER BY c.created_at DESC
  `).all(req.user.id);
  res.json(rows);
});

// ── GET /api/people ───────────────────────────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
  const { q = '', filter = 'ALL' } = req.query;

  const myUser = db.prepare('SELECT state, city, preferred_mode FROM users WHERE id = ?').get(req.user.id);
  const myProfile = loadProfile(req.user.id);
  const myFriendIds = getConnectedFriendIds(db, req.user.id);
  const me = {
    ...myProfile,
    state: myUser?.state || '',
    city: myUser?.city || '',
    mode: myUser?.preferred_mode || 'BOTH',
    friendIds: myFriendIds,
  };

  // Base query: discoverable users excluding self
  let sql = `
    SELECT u.id, u.handle, u.name, u.bio, u.avatar_url, u.state, u.city, u.neighborhood,
           u.preferred_mode, u.last_active_at
    FROM users u
    WHERE u.is_discoverable = 1 AND u.id != ?
  `;
  const params = [req.user.id];

  if (q.trim()) {
    sql += ` AND (u.name LIKE ? OR u.bio LIKE ?)`;
    const like = `%${q.trim().slice(0, 100)}%`;
    params.push(like, like);
  }

  const candidates = db.prepare(sql).all(...params);

  const result = candidates.map(candidate => {
    const theirProfile = loadProfile(candidate.id);
    const theirFriendIds = getConnectedFriendIds(db, candidate.id);
    const them = {
      ...theirProfile,
      state: candidate.state || '',
      city: candidate.city || '',
      mode: candidate.preferred_mode || 'BOTH',
      friendIds: theirFriendIds,
      lastActiveAt: candidate.last_active_at,
    };

    const { score, reason, reasons, mutualConnections } = computeMatch(me, them);

    // Connection status
    const conn = db.prepare(`
      SELECT status FROM connections
      WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)
    `).get(req.user.id, candidate.id, candidate.id, req.user.id);

    const theirInterestIds = theirProfile.interests.map(i => i.interest_id);

    // Apply filter
    if (filter === 'TULU' && !them.languages.includes('Tulu')) return null;
    if (filter === 'MENTORS' && theirProfile.skills.filter(s => s.skill_type === 'TEACH').length === 0) return null;
    if (filter === 'YAKSHA' && !theirInterestIds.includes('culture')) return null;
    if (filter === 'NEARBY' && candidate.state !== myUser?.state) return null;

    return {
      ...candidate,
      avatar: candidate.avatar_url,
      broadRegion: candidate.city || candidate.neighborhood || candidate.state || 'India',
      lat: undefined, lng: undefined, // privacy: never expose exact coords
      interests: theirInterestIds,
      speaks: them.languages,
      willingToTeach: theirProfile.skills.filter(s => s.skill_type === 'TEACH').map(s => s.skill),
      wantsToLearn:   theirProfile.skills.filter(s => s.skill_type === 'LEARN').map(s => s.skill),
      matchScore: score,
      matchReason: reason,
      matchReasons: reasons,
      mutualConnections,
      connectionStatus: conn?.status || 'NONE',
    };
  }).filter(Boolean);

  // Sort by match score descending
  result.sort((a, b) => b.matchScore - a.matchScore);
  res.json(result);
});

// ── GET /api/people/:id ───────────────────────────────────────────────────────
router.get('/:id', requireAuth, (req, res) => {
  const user = db.prepare(`
    SELECT id, handle, name, bio, avatar_url, state, city, neighborhood, preferred_mode
    FROM users WHERE id = ? AND is_discoverable = 1
  `).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.languages = db.prepare('SELECT language FROM user_languages WHERE user_id = ?').all(user.id).map(r => r.language);
  user.skills    = db.prepare('SELECT skill, skill_type FROM user_skills WHERE user_id = ?').all(user.id);

  res.json(user);
});

// ── POST /api/people/:id/connect ──────────────────────────────────────────────
router.post('/:id/connect', requireAuth, (req, res) => {
  const targetId = req.params.id;
  if (targetId === req.user.id)
    return res.status(400).json({ error: 'Cannot connect with yourself' });

  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
  if (!target) return res.status(404).json({ error: 'User not found' });

  // Check for existing connection in either direction
  const existing = db.prepare(`
    SELECT * FROM connections
    WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)
  `).get(req.user.id, targetId, targetId, req.user.id);

  if (existing) {
    if (existing.status === 'CONNECTED')
      return res.json({ status: 'CONNECTED', message: 'Already connected' });

    if (existing.status === 'PENDING')
      return res.json({ status: 'PENDING', message: 'Connection request already exists' });

    if (existing.status === 'DECLINED')
      return res.json({ status: 'DECLINED', message: 'Connection previously declined' });

    return res.json({ status: existing.status, message: 'Request already exists' });
  }

  // New connection request — created as PENDING (requires receiver acceptance)
  const id = uuid();
  db.prepare('INSERT INTO connections (id, requester_id, receiver_id, status) VALUES (?, ?, ?, ?)').run(
    id, req.user.id, targetId, 'PENDING'
  );

  res.status(201).json({ status: 'PENDING', connectionId: id, message: 'Connection request sent' });
});

// ── POST /api/people/:id/accept — accept incoming request ─────────────────────
router.post('/:id/accept', requireAuth, (req, res) => {
  const targetId = req.params.id;
  const existing = db.prepare(`
    SELECT * FROM connections
    WHERE requester_id = ? AND receiver_id = ? AND status = 'PENDING'
  `).get(targetId, req.user.id);

  if (!existing) {
    return res.status(404).json({ error: 'No pending connection request from this user' });
  }

  db.prepare('UPDATE connections SET status = ? WHERE id = ?').run('CONNECTED', existing.id);
  res.json({ status: 'CONNECTED', message: 'Connection accepted' });
});

// ── POST /api/people/:id/decline — decline incoming request ───────────────────
router.post('/:id/decline', requireAuth, (req, res) => {
  const targetId = req.params.id;
  const existing = db.prepare(`
    SELECT * FROM connections
    WHERE requester_id = ? AND receiver_id = ? AND status = 'PENDING'
  `).get(targetId, req.user.id);

  if (!existing) {
    return res.status(404).json({ error: 'No pending connection request from this user' });
  }

  db.prepare('UPDATE connections SET status = ? WHERE id = ?').run('DECLINED', existing.id);
  res.json({ status: 'DECLINED', message: 'Connection declined' });
});

export default router;
