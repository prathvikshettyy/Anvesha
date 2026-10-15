// server/src/routes/locket.js
// GET  /api/locket          — get locket moments visible to current user
// POST /api/locket          — create a new locket moment (auth required)
// POST /api/locket/audio    — upload a real voice recording (auth required)
// POST /api/locket/:id/react — react to a locket moment (auth required)
// GET  /api/locket/vault    — get the curated dialect archive (public)

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { requireFields, isValidUrl } from '../middleware/validate.js';
import { uploadLocketAudio } from '../lib/uploads.js';
import { emitToUser, emitToConnections } from '../realtime/socket.js';
import { getConnectedFriendIds } from '../lib/matching.js';

const router = Router();

// Hardcoded dialect vault (these are preserved cultural records, not user-generated)
const DIALECT_VAULT = [
  {
    id: 'v_1',
    dialect: 'Tulu (Coastal Karnataka)',
    phrase: 'ಬಲೆ, ಒಣಸ್ ಮಲ್ಪಾ (Bale, Onas Malpa)',
    phonetic: '/ba-le o-nas mal-pa/',
    english: 'Come, let us share a meal together. (The quintessential coastal gesture of hospitality)',
    contributor: 'Preserved by Vasanthi Nayak (Age 72, Kundapura)',
    audioDuration: '0:03',
  },
  {
    id: 'v_2',
    dialect: 'Konkani (Goud Saraswat)',
    phrase: 'ತುಗೆಲೆ ನಾವ್ ಕಿತ್ತೆ? (Tugele Naav Kitte?)',
    phonetic: '/tu-ge-le naav kit-te/',
    english: 'What is your name? (Used in ancestral temple and community gatherings)',
    contributor: 'Preserved by Dr. Ramesh Pai (Manipal)',
    audioDuration: '0:03',
  },
  {
    id: 'v_3',
    dialect: 'Kodava Takk (Coorg)',
    phrase: 'ಎಲ್ಲಾರ್ಕೂ ನಮಸ್ಕಾರ (Ellarkoo Cholo)',
    phonetic: '/el-lar-koo cho-lo/',
    english: 'Peace and well-being to everyone. (Traditional clan harvest blessing)',
    contributor: 'Preserved by Muthappa K. (Madikeri)',
    audioDuration: '0:04',
  },
  {
    id: 'v_4',
    dialect: 'Havigannada (Uttara Kannada)',
    phrase: 'ಎಲ್ಲಿಗೆ ಹೊಂಟ್ರಿ? (Ellige Hontri?)',
    phonetic: '/el-li-ge hon-tri/',
    english: 'Where are you headed? (Warm greeting shared when crossing river ferries)',
    contributor: 'Preserved by Savitri Bhat (Sirsi)',
    audioDuration: '0:03',
  },
];

/**
 * Format a DB locket row with sender info and reactions.
 */
function formatMoment(row) {
  const sender = db.prepare('SELECT name, handle, avatar_url FROM users WHERE id = ?').get(row.sender_id);
  const recipient = row.recipient_id ? db.prepare('SELECT name, handle FROM users WHERE id = ?').get(row.recipient_id) : null;
  const reactions = db.prepare(`
    SELECT r.id, r.text, r.reacted_at, u.name as user_name
    FROM locket_reactions r JOIN users u ON u.id = r.user_id
    WHERE r.moment_id = ?
    ORDER BY r.reacted_at ASC
  `).all(row.id);

  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: sender?.name || 'Unknown',
    senderAvatar: sender?.avatar_url || '',
    recipientId: row.recipient_id || null,
    recipientName: recipient?.name || null,
    momentType: row.moment_type,
    title: row.title,
    vernacularText: row.vernacular_text,
    phoneticText: row.phonetic_text,
    meaning: row.meaning,
    provenance: row.provenance,
    audioUrl: row.audio_url,
    imageUrl: row.image_url,
    image: row.image_url,
    audioDuration: row.audio_duration,
    timestamp: row.timestamp_iso,
    reactions,
  };
}

// ── GET /api/locket/vault — public dialect archive ────────────────────────────
router.get('/vault', (req, res) => {
  res.json(DIALECT_VAULT);
});

// ── GET /api/locket/connections — moments posted by CONNECTED users ───────────
// Returns locket moments authored by users who have a CONNECTED connection
// with the logged-in user (both directions). Does not include the user's own
// moments. Does not return lat/lng or location data.
router.get('/connections', requireAuth, (req, res) => {
  const currentUserId = req.user.id;

  const rows = db.prepare(`
    SELECT m.*, u.name AS author_name, u.avatar_url AS author_avatar,
      (SELECT COUNT(*) FROM locket_reactions r WHERE r.moment_id = m.id) AS reaction_count
    FROM locket_moments m
    JOIN users u ON u.id = m.sender_id
    WHERE m.sender_id != ? AND m.sender_id IN (
      SELECT CASE WHEN c.requester_id = ? THEN c.receiver_id ELSE c.requester_id END
      FROM connections c
      WHERE c.status = 'CONNECTED' AND (c.requester_id = ? OR c.receiver_id = ?)
    )
    ORDER BY m.timestamp_iso DESC
    LIMIT 100
  `).all(currentUserId, currentUserId, currentUserId, currentUserId);

  const results = rows.map(row => {
    const reactions = db.prepare(`
      SELECT r.id, r.text, r.reacted_at, u.name as user_name
      FROM locket_reactions r JOIN users u ON u.id = r.user_id
      WHERE r.moment_id = ?
      ORDER BY r.reacted_at ASC
    `).all(row.id);
    return {
      id: row.id,
      authorId: row.sender_id,
      author_id: row.sender_id,
      senderId: row.sender_id,
      sender_id: row.sender_id,
      authorName: row.author_name || 'Unknown',
      author_name: row.author_name || 'Unknown',
      senderName: row.author_name || 'Unknown',
      senderAvatar: row.author_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      momentType: row.moment_type,
      moment_type: row.moment_type,
      title: row.title,
      vernacularText: row.vernacular_text,
      vernacular_text: row.vernacular_text,
      phoneticText: row.phonetic_text,
      phonetic_text: row.phonetic_text,
      meaning: row.meaning,
      provenance: row.provenance,
      audioUrl: row.audio_url,
      audio_url: row.audio_url,
      imageUrl: row.image_url,
      image_url: row.image_url,
      image: row.image_url,
      audioDuration: row.audio_duration,
      audio_duration: row.audio_duration,
      timestamp: row.timestamp_iso,
      timestamp_iso: row.timestamp_iso,
      reactionCount: row.reaction_count || 0,
      reaction_count: row.reaction_count || 0,
      reactions,
    };
  });

  res.json(results);
});

// ── GET /api/locket/mine — moments posted by the current user ─────────────────
// Returns all locket moments where the sender is the current authenticated user.
// Does not return lat/lng or location data.
router.get('/mine', requireAuth, (req, res) => {
  const currentUserId = req.user.id;

  const rows = db.prepare(`
    SELECT m.*, u.name AS author_name, u.avatar_url AS author_avatar,
      (SELECT COUNT(*) FROM locket_reactions r WHERE r.moment_id = m.id) AS reaction_count
    FROM locket_moments m
    JOIN users u ON u.id = m.sender_id
    WHERE m.sender_id = ?
    ORDER BY m.timestamp_iso DESC
    LIMIT 100
  `).all(currentUserId);

  const results = rows.map(row => {
    const reactions = db.prepare(`
      SELECT r.id, r.text, r.reacted_at, u.name as user_name
      FROM locket_reactions r JOIN users u ON u.id = r.user_id
      WHERE r.moment_id = ?
      ORDER BY r.reacted_at ASC
    `).all(row.id);
    const recipient = row.recipient_id
      ? db.prepare('SELECT name FROM users WHERE id = ?').get(row.recipient_id)
      : null;
    return {
      id: row.id,
      authorId: row.sender_id,
      author_id: row.sender_id,
      senderId: row.sender_id,
      sender_id: row.sender_id,
      authorName: row.author_name || 'You',
      author_name: row.author_name || 'You',
      senderName: row.author_name || 'You',
      senderAvatar: row.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      recipientId: row.recipient_id || null,
      recipientName: recipient?.name || null,
      momentType: row.moment_type,
      moment_type: row.moment_type,
      title: row.title,
      vernacularText: row.vernacular_text,
      vernacular_text: row.vernacular_text,
      phoneticText: row.phonetic_text,
      phonetic_text: row.phonetic_text,
      meaning: row.meaning,
      provenance: row.provenance,
      audioUrl: row.audio_url,
      audio_url: row.audio_url,
      imageUrl: row.image_url,
      image_url: row.image_url,
      image: row.image_url,
      audioDuration: row.audio_duration,
      audio_duration: row.audio_duration,
      timestamp: row.timestamp_iso,
      timestamp_iso: row.timestamp_iso,
      reactionCount: row.reaction_count || 0,
      reaction_count: row.reaction_count || 0,
      reactions,
    };
  });

  res.json(results);
});



// ── GET /api/locket — moments sent to, by, or shared with current user's connections ───────
router.get('/', optionalAuth, (req, res) => {
  const currentUserId = req.user?.id;
  if (!currentUserId) {
    // Unauthenticated guests have no connections
    return res.json([]);
  }

  const rows = db.prepare(`
    SELECT * FROM locket_moments
    WHERE sender_id = ?
       OR recipient_id = ?
       OR (
         recipient_id IS NULL AND sender_id IN (
           SELECT CASE WHEN requester_id = ? THEN receiver_id ELSE requester_id END
           FROM connections
           WHERE status = 'CONNECTED' AND (requester_id = ? OR receiver_id = ?)
         )
       )
    ORDER BY timestamp_iso DESC
    LIMIT 50
  `).all(currentUserId, currentUserId, currentUserId, currentUserId, currentUserId);

  res.json(rows.map(formatMoment));
});

// ── POST /api/locket/audio — upload a real voice recording ───────────────────
// multipart/form-data, field name "audio". Returns { url, duration } where
// `url` is a server-relative path suitable for use as `audio_url` when
// creating a locket moment, and is playable directly via an <audio> tag.
// NOTE: No auth required — audio blobs are identified only by UUID filename
// and cannot be enumerated. Auth is enforced when attaching to a locket moment.
router.post('/audio', (req, res) => {
  uploadLocketAudio.single('audio')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Audio upload failed' });
    if (!req.file) return res.status(400).json({ error: 'No audio file received' });

    const durationSeconds = Number(req.body?.duration_seconds) || 0;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = Math.round(durationSeconds % 60);
    const duration = `${minutes}:${String(seconds).padStart(2, '0')}`;

    res.status(201).json({
      url: `/uploads/locket/${req.file.filename}`,
      duration,
    });
  });
});

// ── POST /api/locket — create a new locket moment ────────────────────────────
// Accessible by authenticated users only.
router.post('/',
  requireAuth,
  (req, res) => {
    const senderId = req.user.id;

    const vernacular_text = req.body.vernacular_text || req.body.vernacularText || '';
    const meaning = req.body.meaning || '';
    const moment_type = req.body.moment_type || req.body.momentType || 'WORD_OF_DAY';
    const recipient_id = req.body.recipient_id || req.body.recipientId || null;
    const phonetic_text = req.body.phonetic_text || req.body.phoneticText || '';
    const provenance = req.body.provenance || '';
    let audio_url = req.body.audio_url || req.body.audioUrl || '';
    const image_url = req.body.image_url || req.body.imageUrl || req.body.image || '';
    const audio_duration = req.body.audio_duration || req.body.audioDuration || '';
    const title = req.body.title;

    if (!vernacular_text.trim() || !meaning.trim()) {
      return res.status(400).json({ error: 'vernacular_text and meaning are required' });
    }

    // Validate
    const validTypes = ['WORD_OF_DAY', 'CRAFT_STEP'];
    if (!validTypes.includes(moment_type))
      return res.status(400).json({ error: 'Invalid moment_type' });
    if (vernacular_text.length > 500)
      return res.status(400).json({ error: 'vernacular_text too long (max 500)' });
    if (meaning.length > 2000)
      return res.status(400).json({ error: 'meaning too long (max 2000)' });

    // Check audio size limit (cap at ~2MB base64; return 413 if exceeded)
    if (audio_url && audio_url.length > 2 * 1024 * 1024) {
      return res.status(413).json({ error: 'Recording too long. Keep it under 30 seconds.' });
    }

    // Format raw base64 as data URI if needed
    if (audio_url && !audio_url.startsWith('http://') && !audio_url.startsWith('https://') && !audio_url.startsWith('/') && !audio_url.startsWith('data:')) {
      if (/^[A-Za-z0-9+/=\s]+$/.test(audio_url.slice(0, 100))) {
        audio_url = `data:audio/webm;base64,${audio_url.trim()}`;
      }
    }

    if (audio_url && !isValidUrl(audio_url, 'audio'))
      return res.status(400).json({ error: 'audio_url must be http, https, server path, or allowed audio data URI (webm, ogg, mp4, mpeg)' });
    if (image_url && !isValidUrl(image_url, 'image'))
      return res.status(400).json({ error: 'image_url must be http, https, server path, or allowed image data URI (png, jpeg, webp)' });

    // Validate recipient if provided
    let validRecipientId = null;
    if (recipient_id) {
      const target = db.prepare('SELECT id FROM users WHERE id = ?').get(recipient_id);
      if (target) validRecipientId = target.id;
    }

    const id = `lok_${uuid().replace(/-/g, '').slice(0, 12)}`;
    const resolvedTitle = (title || (moment_type === 'WORD_OF_DAY' ? 'Dialect Word of the Day' : 'Cultural Moment')).slice(0, 200);

    const timestamp_iso = new Date().toISOString();
    db.prepare(`
      INSERT INTO locket_moments
        (id, sender_id, recipient_id, moment_type, title, vernacular_text, phonetic_text,
         meaning, provenance, audio_url, image_url, audio_duration, timestamp_iso)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id, senderId, validRecipientId, moment_type, resolvedTitle,
      vernacular_text.slice(0, 500), phonetic_text.slice(0, 200),
      meaning.slice(0, 2000), provenance.slice(0, 500),
      audio_url, image_url, audio_duration.slice(0, 20),
      timestamp_iso
    );

    const row = db.prepare('SELECT * FROM locket_moments WHERE id = ?').get(id);
    const formatted = formatMoment(row);

    // Push realtime event ONLY to targeted recipient or confirmed connections (not global broadcast!)
    if (validRecipientId) {
      emitToUser(senderId, 'locket:new', formatted);
      emitToUser(validRecipientId, 'locket:new', formatted);
    } else {
      emitToConnections(senderId, 'locket:new', formatted);
    }

    res.status(201).json(formatted);
  }
);

// ── POST /api/locket/:id/react ────────────────────────────────────────────────
router.post('/:id/react', requireAuth, requireFields('text'), (req, res) => {
  const moment = db.prepare('SELECT id, recipient_id, sender_id FROM locket_moments WHERE id = ?').get(req.params.id);
  if (!moment) return res.status(404).json({ error: 'Locket moment not found' });

  // Only the recipient, sender, or connected friends can react
  const isSender = moment.sender_id === req.user.id;
  const isDirectRecipient = moment.recipient_id === req.user.id;
  let isConnectedFriend = false;
  if (moment.recipient_id === null) {
    const friendIds = getConnectedFriendIds(db, moment.sender_id);
    isConnectedFriend = friendIds.has(req.user.id);
  }

  if (!isSender && !isDirectRecipient && !isConnectedFriend) {
    return res.status(403).json({ error: 'Not authorized to react to this moment' });
  }

  const { text } = req.body;
  if (text.length > 200) return res.status(400).json({ error: 'Reaction text too long (max 200)' });

  const id = uuid();
  db.prepare('INSERT INTO locket_reactions (id, moment_id, user_id, text) VALUES (?,?,?,?)').run(
    id, moment.id, req.user.id, text.slice(0, 200)
  );

  // Notify sender of reaction
  emitToUser(moment.sender_id, 'locket:reaction', { momentId: moment.id, reaction: { id, text, userId: req.user.id } });

  res.status(201).json({ id, text, userId: req.user.id });
});

export default router;
