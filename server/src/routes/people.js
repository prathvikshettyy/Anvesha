// server/src/routes/people.js
// GET  /api/people          — discover users (with match scoring, respects is_discoverable)
// GET  /api/people/:id      — get one user's public profile
// POST /api/people/:id/connect   — send/accept connection request
// GET  /api/people/connections   — list current user's connections

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * Compute a transparent match score between two interest arrays.
 * Uses Jaccard similarity + skill-exchange bonus.
 *
 * @param {string[]} myInterests      - array of interest_id strings for the requesting user
 * @param {string[]} theirInterests   - array of interest_id strings for the candidate
 * @param {object[]} mySkills         - [{ skill, skill_type }]
 * @param {object[]} theirSkills      - [{ skill, skill_type }]
 * @param {string}   myMode           - preferred_mode of requesting user
 * @param {string}   theirMode        - preferred_mode of candidate
 * @returns {{ score: number, reason: string }}
 */
function computeMatch(myInterests, theirInterests, mySkills, theirSkills, myMode, theirMode) {
  const mySet = new Set(myInterests);
  const theirSet = new Set(theirInterests);
  const intersection = [...mySet].filter(x => theirSet.has(x));
  const union = new Set([...mySet, ...theirSet]);

  const jaccard = union.size > 0 ? intersection.length / union.size : 0;
  let score = Math.round(jaccard * 75); // base up to 75

  // Skill exchange bonus: I want to learn something they teach
  const theyTeach = new Set(theirSkills.filter(s => s.skill_type === 'TEACH').map(s => s.skill.toLowerCase()));
  const iWantLearn = new Set(mySkills.filter(s => s.skill_type === 'LEARN').map(s => s.skill.toLowerCase()));
  const skillMatch = [...iWantLearn].some(s => theyTeach.has(s));
  if (skillMatch) score += 15;

  // Mode compatibility bonus
  const compatible = myMode === 'BOTH' || theirMode === 'BOTH' || myMode === theirMode;
  if (compatible) score += 5;

  // Shared interest bonus per overlap
  score += Math.min(intersection.length * 2, 10);

  score = Math.min(Math.max(score, 1), 99); // clamp 1–99

  // Build human-readable reason
  const sharedLabels = intersection.map(id => id.charAt(0).toUpperCase() + id.slice(1));
  let reason = '';
  if (sharedLabels.length > 0) {
    reason += `You both share interests in ${sharedLabels.join(', ')}. `;
  }
  if (skillMatch) {
    const teachable = [...theyTeach].filter(s => iWantLearn.has(s));
    reason += `They can teach ${teachable.slice(0, 2).join(' and ')} which you want to learn. `;
  }
  if (!reason) reason = 'You are both part of the ShareSpot cultural community.';

  return { score, reason: reason.trim() };
}

// ── GET /api/people/connections — MUST be before /:id ─────────────────────────
router.get('/connections', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT
      u.id, u.handle, u.name, u.bio, u.avatar_url, u.neighborhood,
      u.preferred_mode, u.lat, u.lng,
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
    lat: undefined, lng: undefined, // never expose exact coords
    languages: db.prepare('SELECT language FROM user_languages WHERE user_id = ?').all(u.id).map(r => r.language),
  }));

  res.json(enriched);
});

// ── GET /api/people ───────────────────────────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
  const { q = '', filter = 'ALL' } = req.query;

  // Fetch requesting user's interests, skills, and mode for scoring
  const myInterests = db.prepare('SELECT interest_id FROM user_interests WHERE user_id = ?')
    .all(req.user.id).map(r => r.interest_id);
  const mySkills = db.prepare('SELECT skill, skill_type FROM user_skills WHERE user_id = ?')
    .all(req.user.id);
  const myUser = db.prepare('SELECT preferred_mode FROM users WHERE id = ?').get(req.user.id);
  const myMode = myUser?.preferred_mode || 'BOTH';

  // Base query: discoverable users excluding self
  let sql = `
    SELECT u.id, u.handle, u.name, u.bio, u.avatar_url, u.neighborhood,
           u.preferred_mode, u.lat, u.lng
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
    const theirInterests = db.prepare('SELECT interest_id FROM user_interests WHERE user_id = ?')
      .all(candidate.id).map(r => r.interest_id);
    const theirSkills = db.prepare('SELECT skill, skill_type FROM user_skills WHERE user_id = ?')
      .all(candidate.id);
    const languages = db.prepare('SELECT language FROM user_languages WHERE user_id = ?')
      .all(candidate.id).map(r => r.language);
    const skills = theirSkills;

    const { score, reason } = computeMatch(myInterests, theirInterests, mySkills, theirSkills, myMode, candidate.preferred_mode);

    // Connection status
    const conn = db.prepare(`
      SELECT status FROM connections
      WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)
    `).get(req.user.id, candidate.id, candidate.id, req.user.id);

    // Apply filter
    if (filter === 'TULU' && !languages.includes('Tulu')) return null;
    if (filter === 'MENTORS' && skills.filter(s => s.skill_type === 'TEACH').length === 0) return null;
    if (filter === 'YAKSHA' && !theirInterests.includes('culture')) return null;

    return {
      ...candidate,
      avatar: candidate.avatar_url,
      broadRegion: candidate.neighborhood || 'Manipal',
      lat: undefined, lng: undefined, // privacy: never expose exact coords
      interests: theirInterests,
      speaks: languages,
      willingToTeach: skills.filter(s => s.skill_type === 'TEACH').map(s => s.skill),
      wantsToLearn:   skills.filter(s => s.skill_type === 'LEARN').map(s => s.skill),
      matchScore: score,
      matchReason: reason,
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
    SELECT id, handle, name, bio, avatar_url, neighborhood, preferred_mode
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

    if (existing.status === 'PENDING' && existing.receiver_id === req.user.id) {
      // The other person sent a request — accept it
      db.prepare('UPDATE connections SET status = ? WHERE id = ?').run('CONNECTED', existing.id);
      return res.json({ status: 'CONNECTED', message: 'Connection accepted' });
    }

    return res.json({ status: existing.status, message: 'Request already exists' });
  }

  // New connection request
  const id = uuid();
  db.prepare('INSERT INTO connections (id, requester_id, receiver_id, status) VALUES (?, ?, ?, ?)').run(
    id, req.user.id, targetId, 'CONNECTED' // Direct connect for demo; change to PENDING for full flow
  );

  res.status(201).json({ status: 'CONNECTED', connectionId: id });
});

export default router;
