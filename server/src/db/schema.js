// server/src/db/schema.js
// Creates all tables on first run. Safe to call multiple times (IF NOT EXISTS).

export function applySchema(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- ─── Users ─────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      username     TEXT UNIQUE NOT NULL,
      handle       TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name         TEXT NOT NULL,
      bio          TEXT DEFAULT '',
      avatar_url   TEXT DEFAULT '',
      city         TEXT DEFAULT 'Manipal',
      neighborhood TEXT DEFAULT 'Manipal Campus',
      lat          REAL DEFAULT 13.3525,
      lng          REAL DEFAULT 74.7928,
      preferred_mode TEXT DEFAULT 'BOTH'
                       CHECK(preferred_mode IN ('BOTH','IN_PERSON','ONLINE')),
      is_discoverable INTEGER DEFAULT 1,
      fuzzed_location INTEGER DEFAULT 1,
      created_at   TEXT DEFAULT (datetime('now'))
    );

    -- ─── User Interests (many-to-many: user ↔ interest_id string) ──────────────
    CREATE TABLE IF NOT EXISTS user_interests (
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      interest_id TEXT NOT NULL,
      intention   TEXT DEFAULT 'CASUAL_ENTHUSIAST'
                    CHECK(intention IN ('WANTS_TO_LEARN','WILLING_TO_TEACH','NATIVE_SPEAKER','CASUAL_ENTHUSIAST')),
      PRIMARY KEY (user_id, interest_id)
    );

    -- ─── User Languages (speaks) ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS user_languages (
      user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      language TEXT NOT NULL,
      PRIMARY KEY (user_id, language)
    );

    -- ─── User Skills (willing_to_teach, wants_to_learn) ────────────────────────
    CREATE TABLE IF NOT EXISTS user_skills (
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      skill      TEXT NOT NULL,
      skill_type TEXT NOT NULL CHECK(skill_type IN ('TEACH','LEARN')),
      PRIMARY KEY (user_id, skill, skill_type)
    );

    -- ─── Connections ────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS connections (
      id           TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status       TEXT DEFAULT 'PENDING'
                     CHECK(status IN ('PENDING','CONNECTED','DECLINED')),
      created_at   TEXT DEFAULT (datetime('now')),
      UNIQUE(requester_id, receiver_id)
    );

    -- ─── Events ─────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS events (
      id                 TEXT PRIMARY KEY,
      title              TEXT NOT NULL,
      category           TEXT NOT NULL,
      category_label     TEXT NOT NULL,
      date_label         TEXT NOT NULL,
      datetime_iso       TEXT NOT NULL,
      venue              TEXT NOT NULL,
      neighborhood       TEXT DEFAULT 'Manipal',
      lat                REAL,
      lng                REAL,
      is_online          INTEGER DEFAULT 0,
      organizer          TEXT DEFAULT '',
      image_url          TEXT DEFAULT '',
      description        TEXT DEFAULT '',
      source_url         TEXT DEFAULT '',
      source_label       TEXT DEFAULT 'Community Submitted',
      verification_status TEXT DEFAULT 'COMMUNITY_REPORTED'
                            CHECK(verification_status IN ('VERIFIED','COMMUNITY_REPORTED','PENDING')),
      attendee_count     INTEGER DEFAULT 0,
      submitted_by       TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at         TEXT DEFAULT (datetime('now'))
    );

    -- ─── Saved Events ────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS saved_events (
      user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      saved_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, event_id)
    );

    -- ─── Locket Moments ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS locket_moments (
      id            TEXT PRIMARY KEY,
      sender_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id  TEXT REFERENCES users(id) ON DELETE CASCADE,
      moment_type   TEXT DEFAULT 'WORD_OF_DAY'
                      CHECK(moment_type IN ('WORD_OF_DAY','CRAFT_STEP')),
      title         TEXT NOT NULL,
      vernacular_text TEXT NOT NULL,
      phonetic_text TEXT DEFAULT '',
      meaning       TEXT NOT NULL,
      provenance    TEXT DEFAULT '',
      audio_url     TEXT DEFAULT '',
      image_url     TEXT DEFAULT '',
      audio_duration TEXT DEFAULT '',
      timestamp_iso TEXT DEFAULT (datetime('now'))
    );

    -- ─── Locket Reactions ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS locket_reactions (
      id        TEXT PRIMARY KEY,
      moment_id TEXT NOT NULL REFERENCES locket_moments(id) ON DELETE CASCADE,
      user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text      TEXT NOT NULL,
      reacted_at TEXT DEFAULT (datetime('now'))
    );

    -- ─── Messages ────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS messages (
      id          TEXT PRIMARY KEY,
      sender_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text        TEXT NOT NULL,
      sent_at     TEXT DEFAULT (datetime('now')),
      is_read     INTEGER DEFAULT 0
    );

    -- ─── Indexes for performance ─────────────────────────────────────────────────
    CREATE INDEX IF NOT EXISTS idx_messages_pair
      ON messages(sender_id, receiver_id, sent_at);
    CREATE INDEX IF NOT EXISTS idx_messages_receiver
      ON messages(receiver_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_locket_recipient
      ON locket_moments(recipient_id, timestamp_iso);
    CREATE INDEX IF NOT EXISTS idx_connections_pair
      ON connections(requester_id, receiver_id);
    CREATE INDEX IF NOT EXISTS idx_events_category
      ON events(category, verification_status);
  `);
}
