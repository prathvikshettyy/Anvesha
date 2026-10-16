// server/src/routes/communities.js
// Complete REST endpoints for cultural communities, memberships, group discussion, and moderation.

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { requireFields } from '../middleware/validate.js';
import { broadcastRealtime } from '../realtime/socket.js';

const router = Router();

// ── GET /api/communities — list & search communities ──────────────────────────
router.get('/', optionalAuth, (req, res) => {
  const currentUserId = req.user?.id || null;
  const { q = '', category = 'ALL', type = 'ALL', filter = 'ALL' } = req.query;

  let sql = `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.description,
      c.category,
      c.category_label,
      c.type,
      c.event_id,
      c.location,
      c.image_url,
      c.icon,
      c.created_by,
      (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) AS member_count,
      c.created_at,
      ${currentUserId ? `(SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id AND cm.user_id = ?) > 0 AS is_member` : '0 AS is_member'},
      e.title AS event_title,
      e.date_label AS event_date,
      e.venue AS event_venue,
      e.image_url AS event_image,
      u.id AS organizer_id,
      u.name AS organizer_name,
      u.handle AS organizer_handle,
      u.avatar_url AS organizer_avatar,
      u.bio AS organizer_bio,
      u.city AS organizer_city
    FROM communities c
    LEFT JOIN events e ON e.id = c.event_id
    LEFT JOIN users u ON u.id = COALESCE(c.created_by, (SELECT user_id FROM community_members WHERE community_id = c.id AND role = 'ADMIN' LIMIT 1))
    WHERE 1=1
  `;

  const params = currentUserId ? [currentUserId] : [];

  if (category && category !== 'ALL') {
    sql += ` AND LOWER(c.category) = LOWER(?)`;
    params.push(category);
  }

  if (type && type !== 'ALL') {
    sql += ` AND UPPER(c.type) = UPPER(?)`;
    params.push(type);
  }

  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    sql += ` AND (c.name LIKE ? OR c.description LIKE ? OR c.location LIKE ?)`;
    params.push(term, term, term);
  }

  if (filter === 'JOINED' && currentUserId) {
    sql += ` AND c.id IN (SELECT community_id FROM community_members WHERE user_id = ?)`;
    params.push(currentUserId);
  } else if (filter === 'SUGGESTED' && currentUserId) {
    sql += ` AND c.id NOT IN (SELECT community_id FROM community_members WHERE user_id = ?)`;
    params.push(currentUserId);
  }

  sql += ` ORDER BY is_member DESC, member_count DESC, c.name ASC`;

  try {
    const rows = db.prepare(sql).all(...params);
    const result = rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      category: r.category,
      categoryLabel: r.category_label,
      type: r.type,
      eventId: r.event_id,
      location: r.location,
      image: r.image_url,
      icon: r.icon,
      memberCount: r.member_count,
      isMember: Boolean(r.is_member),
      createdAt: r.created_at,
      createdBy: r.created_by,
      organizerUser: r.organizer_id ? {
        id: r.organizer_id,
        name: r.organizer_name,
        handle: r.organizer_handle,
        avatar: r.organizer_avatar,
        bio: r.organizer_bio,
        city: r.organizer_city,
        role: 'Circle Organiser & Lead Admin'
      } : null,
      event: r.event_id ? {
        id: r.event_id,
        title: r.event_title,
        date: r.event_date,
        venue: r.event_venue,
        image: r.event_image
      } : null
    }));
    res.json(result);
  } catch (err) {
    console.error('Error fetching communities:', err);
    res.status(500).json({ error: 'Failed to load communities' });
  }
});

// ── GET /api/communities/:id — get community details ─────────────────────────
router.get('/:id', optionalAuth, (req, res) => {
  const currentUserId = req.user?.id || null;
  const { id } = req.params;

  const comm = db.prepare(`
    SELECT
      c.*,
      (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) AS member_count,
      ${currentUserId ? `(SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id AND cm.user_id = ?) > 0 AS is_member` : '0 AS is_member'},
      ${currentUserId ? `(SELECT role FROM community_members cm WHERE cm.community_id = c.id AND cm.user_id = ?)` : 'NULL'} AS user_role,
      e.title AS event_title,
      e.date_label AS event_date,
      e.venue AS event_venue,
      e.image_url AS event_image,
      e.category_label AS event_category,
      u.id AS organizer_id,
      u.name AS organizer_name,
      u.handle AS organizer_handle,
      u.avatar_url AS organizer_avatar,
      u.bio AS organizer_bio,
      u.city AS organizer_city
    FROM communities c
    LEFT JOIN events e ON e.id = c.event_id
    LEFT JOIN users u ON u.id = COALESCE(c.created_by, (SELECT user_id FROM community_members WHERE community_id = c.id AND role = 'ADMIN' LIMIT 1))
    WHERE c.id = ? OR c.slug = ?
  `).get(...(currentUserId ? [currentUserId, currentUserId, id, id] : [id, id]));

  if (!comm) return res.status(404).json({ error: 'Community not found' });

  // Get sample of active members who have opted into discoverability
  const members = db.prepare(`
    SELECT u.id, u.name, u.handle, u.avatar_url, u.city, cm.role, cm.joined_at
    FROM community_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.community_id = ? AND u.is_discoverable = 1
    ORDER BY cm.role = 'ADMIN' DESC, cm.joined_at DESC
    LIMIT 20
  `).all(comm.id);

  res.json({
    id: comm.id,
    name: comm.name,
    slug: comm.slug,
    description: comm.description,
    category: comm.category,
    categoryLabel: comm.category_label,
    type: comm.type,
    eventId: comm.event_id,
    location: comm.location,
    image: comm.image_url,
    icon: comm.icon,
    memberCount: comm.member_count,
    isMember: Boolean(comm.is_member),
    userRole: comm.user_role || null,
    createdAt: comm.created_at,
    createdBy: comm.created_by,
    organizerUser: comm.organizer_id ? {
      id: comm.organizer_id,
      name: comm.organizer_name,
      handle: comm.organizer_handle,
      avatar: comm.organizer_avatar,
      bio: comm.organizer_bio,
      city: comm.organizer_city,
      role: 'Circle Organiser & Lead Admin'
    } : null,
    event: comm.event_id ? {
      id: comm.event_id,
      title: comm.event_title,
      date: comm.event_date,
      venue: comm.event_venue,
      image: comm.event_image,
      categoryLabel: comm.event_category
    } : null,
    members: currentUserId ? members.map(m => ({
      id: m.id,
      name: m.name,
      handle: m.handle,
      avatar: m.avatar_url,
      city: m.city,
      role: m.role,
      joinedAt: m.joined_at
    })) : []
  });
});

// ── POST /api/communities/:id/join — join community ──────────────────────────
router.post('/:id/join', requireAuth, (req, res) => {
  const { id } = req.params;
  const comm = db.prepare('SELECT id FROM communities WHERE id = ? OR slug = ?').get(id, id);
  if (!comm) return res.status(404).json({ error: 'Community not found' });

  try {
    db.prepare(`
      INSERT OR IGNORE INTO community_members (community_id, user_id, role)
      VALUES (?, ?, 'MEMBER')
    `).run(comm.id, req.user.id);

    const countRow = db.prepare('SELECT COUNT(*) as cnt FROM community_members WHERE community_id = ?').get(comm.id);
    db.prepare('UPDATE communities SET member_count = ? WHERE id = ?').run(countRow.cnt, comm.id);

    res.json({ success: true, isMember: true, memberCount: countRow.cnt });
  } catch (err) {
    console.error('Error joining community:', err);
    res.status(500).json({ error: 'Failed to join community' });
  }
});

// ── POST /api/communities/:id/leave — leave community ────────────────────────
router.post('/:id/leave', requireAuth, (req, res) => {
  const { id } = req.params;
  const comm = db.prepare('SELECT id FROM communities WHERE id = ? OR slug = ?').get(id, id);
  if (!comm) return res.status(404).json({ error: 'Community not found' });

  try {
    db.prepare(`
      DELETE FROM community_members WHERE community_id = ? AND user_id = ?
    `).run(comm.id, req.user.id);

    const countRow = db.prepare('SELECT COUNT(*) as cnt FROM community_members WHERE community_id = ?').get(comm.id);
    db.prepare('UPDATE communities SET member_count = ? WHERE id = ?').run(countRow.cnt, comm.id);

    res.json({ success: true, isMember: false, memberCount: countRow.cnt });
  } catch (err) {
    console.error('Error leaving community:', err);
    res.status(500).json({ error: 'Failed to leave community' });
  }
});

// ── GET /api/communities/:id/messages — group discussion messages ────────────
router.get('/:id/messages', requireAuth, (req, res) => {
  const { id } = req.params;
  const comm = db.prepare('SELECT id FROM communities WHERE id = ? OR slug = ?').get(id, id);
  if (!comm) return res.status(404).json({ error: 'Community not found' });

  // Enforce server-side membership permission
  const isMember = db.prepare(`
    SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ?
  `).get(comm.id, req.user.id);

  if (!isMember) {
    return res.status(403).json({ error: 'You must join this community to view discussion messages.' });
  }

  const rows = db.prepare(`
    SELECT
      m.id,
      m.community_id,
      m.sender_id,
      m.text,
      m.sent_at,
      m.is_pinned,
      u.name AS sender_name,
      u.handle AS sender_handle,
      u.avatar_url AS sender_avatar
    FROM community_messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.community_id = ?
    ORDER BY m.sent_at ASC
    LIMIT 150
  `).all(comm.id);

  const messages = rows.map(r => ({
    id: r.id,
    communityId: r.community_id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    senderHandle: r.sender_handle,
    senderAvatar: r.sender_avatar,
    text: r.text,
    sentAt: r.sent_at,
    isPinned: Boolean(r.is_pinned)
  }));

  res.json(messages);
});

// ── POST /api/communities/:id/messages — send discussion message ──────────────
router.post('/:id/messages', requireAuth, requireFields('text'), (req, res) => {
  const { id } = req.params;
  const comm = db.prepare('SELECT id FROM communities WHERE id = ? OR slug = ?').get(id, id);
  if (!comm) return res.status(404).json({ error: 'Community not found' });

  // Enforce server-side membership permission!
  const isMember = db.prepare(`
    SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ?
  `).get(comm.id, req.user.id);

  if (!isMember) {
    return res.status(403).json({ error: 'You must join this community before participating in discussions.' });
  }

  const { text } = req.body;
  if (!text.trim()) return res.status(400).json({ error: 'Message cannot be empty' });
  if (text.length > 2000) return res.status(400).json({ error: 'Message cannot exceed 2000 characters' });

  const msgId = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO community_messages (id, community_id, sender_id, text, sent_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(msgId, comm.id, req.user.id, text.trim(), now);

  const sender = db.prepare('SELECT name, handle, avatar_url FROM users WHERE id = ?').get(req.user.id);

  const fullMsg = {
    id: msgId,
    communityId: comm.id,
    senderId: req.user.id,
    senderName: sender?.name || req.user.name,
    senderHandle: sender?.handle || `@${req.user.username}`,
    senderAvatar: sender?.avatar_url || '',
    text: text.trim(),
    sentAt: now,
    isPinned: false
  };

  // Broadcast to realtime listeners
  broadcastRealtime('community:message:new', fullMsg);

  res.status(201).json(fullMsg);
});

// ── POST /api/communities/:id/report — report community or discussion message ─
router.post('/:id/report', requireAuth, requireFields('reason'), (req, res) => {
  const { id } = req.params;
  const { reason, messageId = null } = req.body;

  const comm = db.prepare('SELECT id FROM communities WHERE id = ? OR slug = ?').get(id, id);
  if (!comm) return res.status(404).json({ error: 'Community not found' });

  const reportId = uuid();
  db.prepare(`
    INSERT INTO community_reports (id, community_id, message_id, reporter_id, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(reportId, comm.id, messageId, req.user.id, reason.trim());

  res.json({
    success: true,
    message: 'Thank you for your report. Our cultural community guardians will review this promptly.'
  });
});

// ── PATCH /api/communities/:id — edit community (creator or admin only) ───────
router.patch('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const comm = db.prepare('SELECT * FROM communities WHERE id = ? OR slug = ?').get(id, id);
  if (!comm) return res.status(404).json({ error: 'Community not found' });

  const member = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(comm.id, req.user.id);
  const isOwner = comm.created_by === req.user.id || member?.role === 'ADMIN';
  if (!isOwner) {
    return res.status(403).json({ error: 'Only the community creator or admin can edit this community' });
  }

  const allowed = ['name', 'description', 'location', 'image_url', 'icon'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (updates.name && updates.name.length > 200) {
    return res.status(400).json({ error: 'Name too long (max 200 chars)' });
  }
  if (updates.description && updates.description.length > 2000) {
    return res.status(400).json({ error: 'Description too long (max 2000 chars)' });
  }

  if (Object.keys(updates).length > 0) {
    const sets = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE communities SET ${sets} WHERE id = @id`).run({ ...updates, id: comm.id });
  }

  const updated = db.prepare('SELECT * FROM communities WHERE id = ?').get(comm.id);
  res.json(updated);
});

// ── DELETE /api/communities/:id — delete community (creator or admin only) ─────
router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const comm = db.prepare('SELECT * FROM communities WHERE id = ? OR slug = ?').get(id, id);
  if (!comm) return res.status(404).json({ error: 'Community not found' });

  const member = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(comm.id, req.user.id);
  const isOwner = comm.created_by === req.user.id || member?.role === 'ADMIN';
  if (!isOwner) {
    return res.status(403).json({ error: 'Only the community creator or admin can delete this community' });
  }

  db.prepare('DELETE FROM communities WHERE id = ?').run(comm.id);
  res.json({ success: true, message: 'Community deleted successfully' });
});

export default router;
