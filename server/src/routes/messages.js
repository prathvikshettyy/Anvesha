// server/src/routes/messages.js
// GET  /api/messages/conversations — list all conversations for current user
// GET  /api/messages/:partnerId    — get message thread with a specific user
// POST /api/messages/:partnerId    — send a message to a user (auth required)
// PATCH /api/messages/:partnerId/read — mark messages as read

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFields } from '../middleware/validate.js';
import { emitToUser, isOnline } from '../realtime/socket.js';

const router = Router();

// ── GET /api/messages/conversations ──────────────────────────────────────────
router.get('/conversations', requireAuth, (req, res) => {
  // Get latest message per conversation partner
  const rows = db.prepare(`
    SELECT
      partner.id        AS partnerId,
      partner.name      AS partnerName,
      partner.avatar_url AS partnerAvatar,
      partner.handle    AS partnerHandle,
      latest.text       AS lastMessage,
      latest.sent_at    AS lastTime,
      (
        SELECT COUNT(*) FROM messages m2
        WHERE m2.sender_id = partner.id
          AND m2.receiver_id = ?
          AND m2.is_read = 0
      ) AS unreadCount
    FROM users partner
    JOIN messages latest ON (
      latest.id = (
        SELECT id FROM messages
        WHERE (sender_id = ? AND receiver_id = partner.id)
           OR (sender_id = partner.id AND receiver_id = ?)
        ORDER BY sent_at DESC LIMIT 1
      )
    )
    WHERE partner.id != ?
    ORDER BY latest.sent_at DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id);

  res.json(rows);
});

// ── GET /api/messages/:partnerId ─────────────────────────────────────────────
router.get('/:partnerId', requireAuth, (req, res) => {
  const { partnerId } = req.params;

  const partner = db.prepare('SELECT id, name, avatar_url, handle FROM users WHERE id = ?').get(partnerId);
  if (!partner) return res.status(404).json({ error: 'User not found' });

  const messages = db.prepare(`
    SELECT id, sender_id, receiver_id, text, sent_at, is_read
    FROM messages
    WHERE (sender_id = ? AND receiver_id = ?)
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY sent_at ASC
    LIMIT 200
  `).all(req.user.id, partnerId, partnerId, req.user.id);

  res.json({ partner, messages });
});

// ── POST /api/messages/:partnerId — send a message ───────────────────────────
router.post('/:partnerId',
  requireAuth,
  requireFields('text'),
  (req, res) => {
    const { partnerId } = req.params;

    if (partnerId === req.user.id)
      return res.status(400).json({ error: 'Cannot message yourself' });

    const partner = db.prepare('SELECT id FROM users WHERE id = ?').get(partnerId);
    if (!partner) return res.status(404).json({ error: 'User not found' });

    const { text } = req.body;
    if (text.length > 2000) return res.status(400).json({ error: 'Message too long (max 2000 chars)' });
    if (!text.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

    const id = uuid();
    db.prepare('INSERT INTO messages (id, sender_id, receiver_id, text) VALUES (?,?,?,?)').run(
      id, req.user.id, partnerId, text.slice(0, 2000)
    );

    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);

    // Push live to both sides (receiver sees it instantly; sender's other
    // open tabs stay in sync). REST remains the source of truth / fallback.
    emitToUser(partnerId, 'message:new', msg);
    emitToUser(req.user.id, 'message:new', msg);

    res.status(201).json(msg);
  }
);

// ── PATCH /api/messages/:partnerId/read — mark thread as read ────────────
 router.patch('/:partnerId/read', requireAuth, (req, res) => {
  const { partnerId } = req.params;
  db.prepare(`
    UPDATE messages SET is_read = 1
    WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
  `).run(partnerId, req.user.id);
  emitToUser(partnerId, 'message:read', { by: req.user.id });
  res.json({ ok: true });
});

// ── GET /api/messages/:partnerId/online — lightweight presence check ───────
router.get('/:partnerId/online', requireAuth, (req, res) => {
  res.json({ online: isOnline(req.params.partnerId) });
});

export default router;
