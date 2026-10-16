// server/src/routes/auth.js
// POST /api/auth/register  — create a new account
// POST /api/auth/login     — sign in and receive a JWT
// GET  /api/auth/me        — get logged-in user's full profile

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { requireFields, isValidMode, isValidUrl } from '../middleware/validate.js';
import { generateIdenticon } from '../lib/identicon.js';

const router = Router();
const HASH_ROUNDS = 10;

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register',
  requireFields('username', 'password', 'name'),
  (req, res) => {
    const { username, password, name, bio = '', avatar_url = '', state = 'Karnataka', city = '' } = req.body;

    if (username.length < 3 || username.length > 30)
      return res.status(400).json({ error: 'Username must be 3–30 characters' });
    if (!/^[a-z0-9_]+$/.test(username))
      return res.status(400).json({ error: 'Username may only contain lowercase letters, numbers, and underscores' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (name.length > 80)
      return res.status(400).json({ error: 'Name too long (max 80 chars)' });
    if (bio.length > 500)
      return res.status(400).json({ error: 'Bio too long (max 500 chars)' });
    if (avatar_url && !isValidUrl(avatar_url, 'image'))
      return res.status(400).json({ error: 'Invalid avatar_url' });

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const id = `usr_${uuid().replace(/-/g, '').slice(0, 12)}`;
    const handle = `@${username}`;
    const password_hash = bcrypt.hashSync(password, HASH_ROUNDS);
    const effectiveAvatar = avatar_url && avatar_url.trim() ? avatar_url.trim() : generateIdenticon(username);

    db.prepare(`
      INSERT INTO users (id, username, handle, password_hash, name, bio, avatar_url, state, city, neighborhood, is_discoverable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(id, username, handle, password_hash, name, bio.slice(0, 500), effectiveAvatar, state.slice(0, 80) || 'Karnataka', city.slice(0, 120), city.slice(0, 120));

    const user = db.prepare('SELECT id, username, handle, name, bio, avatar_url, state, city, neighborhood, preferred_mode, is_discoverable, is_admin FROM users WHERE id = ?').get(id);
    user.interests = [];
    user.languages = [];
    user.skills = [];
    user.saved_event_ids = [];
    const token = signToken(user);

    res.status(201).json({ token, user });
  }
);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login',
  requireFields('username', 'password'),
  (req, res) => {
    const { username, password } = req.body;
    const trimmed = String(username || '').trim();
    const clean = trimmed.toLowerCase();
    const handleVariant = clean.startsWith('@') ? clean : `@${clean}`;
    const cleanName = clean.startsWith('@') ? clean.slice(1) : clean;

    const user = db.prepare(`
      SELECT * FROM users
      WHERE LOWER(username) = ?
         OR LOWER(handle) = ?
         OR (is_admin = 1 AND ? = 'admin')
    `).get(cleanName, handleVariant, cleanName);
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' });

    db.prepare('UPDATE users SET last_active_at = datetime(\'now\') WHERE id = ?').run(user.id);

    // Build public user object (never return password_hash)
    const { password_hash, ...publicUser } = user;
    publicUser.interests = db.prepare('SELECT interest_id, intention FROM user_interests WHERE user_id = ?').all(user.id);
    publicUser.languages = db.prepare('SELECT language FROM user_languages WHERE user_id = ?').all(user.id).map(r => r.language);
    publicUser.skills    = db.prepare('SELECT skill, skill_type FROM user_skills WHERE user_id = ?').all(user.id);
    publicUser.saved_event_ids = db.prepare('SELECT event_id FROM saved_events WHERE user_id = ?').all(user.id).map(r => r.event_id);

    const token = signToken(publicUser);
    res.json({ token, user: publicUser });
  }
);

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  db.prepare('UPDATE users SET last_active_at = datetime(\'now\') WHERE id = ?').run(req.user.id);

  const user = db.prepare('SELECT id, username, handle, name, bio, avatar_url, state, city, neighborhood, lat, lng, preferred_mode, is_discoverable, fuzzed_location, is_admin, created_at, last_active_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.interests = db.prepare('SELECT interest_id, intention FROM user_interests WHERE user_id = ?').all(user.id);
  user.languages = db.prepare('SELECT language FROM user_languages WHERE user_id = ?').all(user.id).map(r => r.language);
  user.skills    = db.prepare('SELECT skill, skill_type FROM user_skills WHERE user_id = ?').all(user.id);
  user.saved_event_ids = db.prepare('SELECT event_id FROM saved_events WHERE user_id = ?').all(user.id).map(r => r.event_id);

  res.json(user);
});

// ── PATCH /api/auth/me — update profile ───────────────────────────────────────
router.patch('/me', requireAuth, (req, res) => {
  const allowed = ['name', 'bio', 'state', 'city', 'neighborhood', 'preferred_mode', 'is_discoverable', 'fuzzed_location', 'avatar_url'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (updates.preferred_mode && !isValidMode(updates.preferred_mode))
    return res.status(400).json({ error: 'Invalid preferred_mode' });
  if (updates.bio && updates.bio.length > 500)
    return res.status(400).json({ error: 'Bio too long' });
  if (updates.name && (updates.name.length < 1 || updates.name.length > 80))
    return res.status(400).json({ error: 'Name must be 1–80 characters' });
  if (updates.state && updates.state.length > 80)
    return res.status(400).json({ error: 'State too long' });
  if (updates.city && updates.city.length > 120)
    return res.status(400).json({ error: 'City too long' });
  if (updates.avatar_url && !isValidUrl(updates.avatar_url, 'image'))
    return res.status(400).json({ error: 'Invalid avatar_url' });

  if (Object.keys(updates).length > 0) {
    const sets = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE users SET ${sets} WHERE id = @id`).run({ ...updates, id: req.user.id });
  }

  // Update interests if provided (supports array of string IDs or array of { interest_id, intention } objects)
  if (Array.isArray(req.body.interests)) {
    db.prepare('DELETE FROM user_interests WHERE user_id = ?').run(req.user.id);
    const ins = db.prepare('INSERT OR IGNORE INTO user_interests (user_id, interest_id, intention) VALUES (?, ?, ?)');
    for (const item of req.body.interests) {
      const id = typeof item === 'string' ? item : item?.interest_id;
      const intent = typeof item === 'object' && item?.intention ? item.intention : 'CASUAL_ENTHUSIAST';
      if (typeof id === 'string' && id.trim()) {
        ins.run(req.user.id, id.trim().slice(0, 50), intent);
      }
    }
  }

  res.json({ ok: true });
});

// ── GET /api/auth/export — GDPR/DPDP personal data export ─────────────────────
router.get('/export', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, handle, name, bio, avatar_url, state, city, neighborhood, preferred_mode, is_discoverable, created_at, last_active_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const interests = db.prepare('SELECT interest_id, intention FROM user_interests WHERE user_id = ?').all(user.id);
  const languages = db.prepare('SELECT language FROM user_languages WHERE user_id = ?').all(user.id).map(r => r.language);
  const skills = db.prepare('SELECT skill, skill_type FROM user_skills WHERE user_id = ?').all(user.id);
  const savedEvents = db.prepare('SELECT e.id, e.title, e.venue, se.saved_at FROM saved_events se JOIN events e ON e.id = se.event_id WHERE se.user_id = ?').all(user.id);
  const connections = db.prepare('SELECT id, requester_id, receiver_id, status, created_at FROM connections WHERE requester_id = ? OR receiver_id = ?').all(user.id, user.id);
  const locketMoments = db.prepare('SELECT id, moment_type, vernacular_text, meaning, timestamp_iso FROM locket_moments WHERE sender_id = ?').all(user.id);
  const communityMemberships = db.prepare('SELECT cm.community_id, c.name as community_name, cm.role, cm.joined_at FROM community_members cm JOIN communities c ON c.id = cm.community_id WHERE cm.user_id = ?').all(user.id);

  res.json({
    exportedAt: new Date().toISOString(),
    user,
    interests,
    languages,
    skills,
    savedEvents,
    connections,
    locketMoments,
    communityMemberships,
  });
});

// ── DELETE /api/auth/me — account deletion with password verification & cascades ─
router.delete('/me', requireAuth, requireFields('password'), (req, res) => {
  const { password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Incorrect password' });

  // Cascading removal across all relational tables
  try {
    db.exec('BEGIN');
    db.prepare('DELETE FROM user_interests WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM user_languages WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM user_skills WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM saved_events WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM connections WHERE requester_id = ? OR receiver_id = ?').run(user.id, user.id);
    db.prepare('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?').run(user.id, user.id);
    db.prepare('DELETE FROM community_members WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM community_messages WHERE sender_id = ?').run(user.id);
    db.prepare('DELETE FROM locket_reactions WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM locket_moments WHERE sender_id = ? OR recipient_id = ?').run(user.id, user.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  res.json({ success: true, message: 'Account and associated data deleted successfully.' });
});

export default router;
