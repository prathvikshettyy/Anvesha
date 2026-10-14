// server/src/routes/locket.js
// GET  /api/locket          — get locket moments visible to current user
// POST /api/locket          — create a new locket moment (auth required)
// POST /api/locket/:id/react — react to a locket moment (auth required)
// GET  /api/locket/vault    — get the curated dialect archive (public)

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFields, isValidUrl } from '../middleware/validate.js';

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
    momentType: row.moment_type,
    title: row.title,
    vernacularText: row.vernacular_text,
    phoneticText: row.phonetic_text,
    meaning: row.meaning,
    provenance: row.provenance,
    audioUrl: row.audio_url,
    imageUrl: row.image_url,
    audioDuration: row.audio_duration,
    timestamp: row.timestamp_iso,
    reactions,
  };
}

// ── GET /api/locket/vault — public dialect archive ────────────────────────────
router.get('/vault', (req, res) => {
  res.json(DIALECT_VAULT);
});

// ── GET /api/locket — moments sent to or by current user ─────────────────────
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM locket_moments
    WHERE recipient_id = ? OR sender_id = ?
    ORDER BY timestamp_iso DESC
    LIMIT 50
  `).all(req.user.id, req.user.id);

  res.json(rows.map(formatMoment));
});

// ── POST /api/locket — create a new locket moment ────────────────────────────
router.post('/',
  requireAuth,
  requireFields('vernacular_text', 'meaning'),
  (req, res) => {
    const {
      recipient_id,
      moment_type = 'WORD_OF_DAY',
      title,
      vernacular_text,
      phonetic_text = '',
      meaning,
      provenance = '',
      audio_url = '',
      image_url = '',
      audio_duration = '',
    } = req.body;

    // Validate
    const validTypes = ['WORD_OF_DAY', 'CRAFT_STEP'];
    if (!validTypes.includes(moment_type))
      return res.status(400).json({ error: 'Invalid moment_type' });
    if (vernacular_text.length > 500)
      return res.status(400).json({ error: 'vernacular_text too long (max 500)' });
    if (meaning.length > 2000)
      return res.status(400).json({ error: 'meaning too long (max 2000)' });
    if (audio_url && !isValidUrl(audio_url))
      return res.status(400).json({ error: 'audio_url must be http or https' });
    if (image_url && !isValidUrl(image_url))
      return res.status(400).json({ error: 'image_url must be http or https' });

    // Validate recipient if provided
    if (recipient_id) {
      const target = db.prepare('SELECT id FROM users WHERE id = ?').get(recipient_id);
      if (!target) return res.status(404).json({ error: 'Recipient not found' });
    }

    const id = `lok_${uuid().replace(/-/g, '').slice(0, 12)}`;
    const resolvedTitle = (title || (moment_type === 'WORD_OF_DAY' ? 'Dialect Word of the Day' : 'Cultural Moment')).slice(0, 200);

    db.prepare(`
      INSERT INTO locket_moments
        (id, sender_id, recipient_id, moment_type, title, vernacular_text, phonetic_text,
         meaning, provenance, audio_url, image_url, audio_duration)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id, req.user.id, recipient_id || null, moment_type, resolvedTitle,
      vernacular_text.slice(0, 500), phonetic_text.slice(0, 200),
      meaning.slice(0, 2000), provenance.slice(0, 500),
      audio_url, image_url, audio_duration.slice(0, 20)
    );

    const row = db.prepare('SELECT * FROM locket_moments WHERE id = ?').get(id);
    res.status(201).json(formatMoment(row));
  }
);

// ── POST /api/locket/:id/react ────────────────────────────────────────────────
router.post('/:id/react', requireAuth, requireFields('text'), (req, res) => {
  const moment = db.prepare('SELECT id, recipient_id, sender_id FROM locket_moments WHERE id = ?').get(req.params.id);
  if (!moment) return res.status(404).json({ error: 'Locket moment not found' });

  // Only the recipient or sender can react
  if (moment.recipient_id !== req.user.id && moment.sender_id !== req.user.id)
    return res.status(403).json({ error: 'Not authorized to react to this moment' });

  const { text } = req.body;
  if (text.length > 200) return res.status(400).json({ error: 'Reaction text too long (max 200)' });

  const id = uuid();
  db.prepare('INSERT INTO locket_reactions (id, moment_id, user_id, text) VALUES (?,?,?,?)').run(
    id, moment.id, req.user.id, text.slice(0, 200)
  );

  res.status(201).json({ id, text, userId: req.user.id });
});

export default router;
