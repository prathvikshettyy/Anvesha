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
      state        TEXT DEFAULT 'Karnataka',
      city         TEXT DEFAULT '',
      neighborhood TEXT DEFAULT '',
      lat          REAL DEFAULT 15.3173,
      lng          REAL DEFAULT 75.7139,
      preferred_mode TEXT DEFAULT 'BOTH'
                       CHECK(preferred_mode IN ('BOTH','IN_PERSON','ONLINE')),
      is_discoverable INTEGER DEFAULT 0,
      fuzzed_location INTEGER DEFAULT 1,
      created_at   TEXT DEFAULT (datetime('now')),
      last_active_at TEXT DEFAULT (datetime('now'))
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
      neighborhood       TEXT DEFAULT 'Karnataka',
      lat                REAL,
      lng                REAL,
      is_online          INTEGER DEFAULT 0,
      organizer          TEXT DEFAULT '',
      image_url          TEXT DEFAULT '',
      description        TEXT DEFAULT '',
      source_url         TEXT DEFAULT '',
      source_label       TEXT DEFAULT 'Community Submitted',
      verification_status TEXT DEFAULT 'COMMUNITY_REPORTED'
                            CHECK(verification_status IN ('VERIFIED','COMMUNITY_REPORTED','PENDING','SOURCED')),
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

    -- ─── Communities ────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS communities (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      slug           TEXT UNIQUE NOT NULL,
      description    TEXT NOT NULL,
      category       TEXT NOT NULL,
      category_label TEXT NOT NULL,
      type           TEXT NOT NULL CHECK(type IN ('INTEREST','EVENT','LOCATION')),
      event_id       TEXT REFERENCES events(id) ON DELETE SET NULL,
      location       TEXT DEFAULT '',
      image_url      TEXT DEFAULT '',
      icon           TEXT DEFAULT 'groups',
      member_count   INTEGER DEFAULT 0,
      created_by     TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at     TEXT DEFAULT (datetime('now'))
    );

    -- ─── Community Members ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS community_members (
      community_id   TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
      user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role           TEXT DEFAULT 'MEMBER' CHECK(role IN ('ADMIN','MODERATOR','MEMBER')),
      joined_at      TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (community_id, user_id)
    );

    -- ─── Community Messages ─────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS community_messages (
      id             TEXT PRIMARY KEY,
      community_id   TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
      sender_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text           TEXT NOT NULL,
      sent_at        TEXT DEFAULT (datetime('now')),
      is_pinned      INTEGER DEFAULT 0,
      is_reported    INTEGER DEFAULT 0
    );

    -- ─── Community Reports (Moderation) ──────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS community_reports (
      id             TEXT PRIMARY KEY,
      community_id   TEXT REFERENCES communities(id) ON DELETE CASCADE,
      message_id     TEXT REFERENCES community_messages(id) ON DELETE CASCADE,
      reporter_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason         TEXT NOT NULL,
      status         TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING','REVIEWED','DISMISSED')),
      created_at     TEXT DEFAULT (datetime('now'))
    );

    -- ─── Communities Indexes ────────────────────────────────────────────────────
    CREATE INDEX IF NOT EXISTS idx_comm_category ON communities(category, type);
    CREATE INDEX IF NOT EXISTS idx_comm_event ON communities(event_id);
    CREATE INDEX IF NOT EXISTS idx_comm_members ON community_members(user_id, community_id);
    CREATE INDEX IF NOT EXISTS idx_comm_messages ON community_messages(community_id, sent_at);
  `);

  migrateLegacyColumns(db);
}

/**
 * Lightweight, idempotent migrations for databases created before a column
 * existed. Safe to run on every boot.
 */
function migrateLegacyColumns(db) {
  const userColumns = db.prepare(`PRAGMA table_info(users)`).all().map(c => c.name);
  if (!userColumns.includes('state')) {
    db.exec(`ALTER TABLE users ADD COLUMN state TEXT DEFAULT 'Karnataka'`);
  }
  if (!userColumns.includes('last_active_at')) {
    db.exec(`ALTER TABLE users ADD COLUMN last_active_at TEXT`);
    db.exec(`UPDATE users SET last_active_at = datetime('now') WHERE last_active_at IS NULL`);
  }

  // Ensure users.is_discoverable defaults to 0
  const userSql = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='users'`).get()?.sql || '';
  if (userSql && userSql.includes('is_discoverable INTEGER DEFAULT 1')) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE IF NOT EXISTS users_migrated (
        id              TEXT PRIMARY KEY,
        username        TEXT UNIQUE NOT NULL,
        handle          TEXT UNIQUE NOT NULL,
        password_hash   TEXT NOT NULL,
        name            TEXT NOT NULL,
        bio             TEXT DEFAULT '',
        avatar_url      TEXT DEFAULT '',
        state           TEXT DEFAULT 'Karnataka',
        city            TEXT NOT NULL,
        neighborhood    TEXT NOT NULL,
        lat             REAL,
        lng             REAL,
        preferred_mode  TEXT DEFAULT 'BOTH' CHECK(preferred_mode IN ('IN_PERSON','ONLINE','BOTH')),
        is_discoverable INTEGER DEFAULT 0,
        fuzzed_location INTEGER DEFAULT 1,
        created_at      TEXT DEFAULT (datetime('now')),
        last_active_at  TEXT DEFAULT (datetime('now'))
      );
      INSERT INTO users_migrated (id, username, handle, password_hash, name, bio, avatar_url, state, city, neighborhood, lat, lng, preferred_mode, is_discoverable, fuzzed_location, created_at, last_active_at)
        SELECT id, username, handle, password_hash, name, bio, avatar_url, COALESCE(state, 'Karnataka'), city, neighborhood, lat, lng, preferred_mode, is_discoverable, fuzzed_location, created_at, last_active_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_migrated RENAME TO users;
      CREATE INDEX IF NOT EXISTS idx_users_discoverable ON users(is_discoverable, preferred_mode);
      PRAGMA foreign_keys = ON;
    `);
  }

  // Ensure 'SOURCED' is allowed in events.verification_status
  const eventSql = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='events'`).get()?.sql || '';
  if (eventSql && !eventSql.includes('SOURCED')) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE IF NOT EXISTS events_migrated (
        id                 TEXT PRIMARY KEY,
        title              TEXT NOT NULL,
        category           TEXT NOT NULL,
        category_label     TEXT NOT NULL,
        date_label         TEXT NOT NULL,
        datetime_iso       TEXT NOT NULL,
        venue              TEXT NOT NULL,
        neighborhood       TEXT DEFAULT 'Karnataka',
        lat                REAL,
        lng                REAL,
        is_online          INTEGER DEFAULT 0,
        organizer          TEXT DEFAULT '',
        image_url          TEXT DEFAULT '',
        description        TEXT DEFAULT '',
        source_url         TEXT DEFAULT '',
        source_label       TEXT DEFAULT 'Community Submitted',
        verification_status TEXT DEFAULT 'COMMUNITY_REPORTED'
                              CHECK(verification_status IN ('VERIFIED','COMMUNITY_REPORTED','PENDING','SOURCED')),
        attendee_count     INTEGER DEFAULT 0,
        submitted_by       TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at         TEXT DEFAULT (datetime('now'))
      );
      INSERT OR IGNORE INTO events_migrated SELECT * FROM events;
      DROP TABLE events;
      ALTER TABLE events_migrated RENAME TO events;
      CREATE INDEX IF NOT EXISTS idx_events_category ON events(category, verification_status);
      PRAGMA foreign_keys = ON;
    `);
  }
}


