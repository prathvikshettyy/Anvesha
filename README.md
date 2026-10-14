# ShareSpot: The Lost Connection

> **M# Manipal Hackathon 2026 · Round 2 · Culture & Community Track**  
> Team: **TEAMAPPEX**

---

## Project & Team Details

| Field | Value |
|---|---|
| **App name** | ShareSpot: The Lost Connection |
| **Track** | Culture & Community |
| **Team** | TEAMAPPEX |
| **Event** | Manipal Hackathon 2026 (M# 2026) — Round 2 |

---

## Solution Summary

Students who move to Manipal carry living cultural identities — native dialects, folk art traditions, and family recipes — that go dormant within weeks of campus life because there is no visible way to find others who share them.

**ShareSpot** is a cultural community and event-discovery platform with three pillars:

1. **Living Cultural Map** — Browse, search, and save upcoming cultural gatherings (Yakshagana shows, Tulu conversational circles, pottery workshops) across Manipal, pinned on a campus map with verified source attribution.
2. **Transparent People Matching** — Discover opted-in peers based on shared dialects, interest overlap, and skill-exchange intentions. Every match score is explained in plain language ("Priya teaches Conversational Tulu which you want to learn").
3. **Culture Locket** — A private daily micro-sharing ritual: send a 5-second dialect audio clip, a regional word of the day, or a craft technique photo directly to a paired connection.

---

## Architecture & Stack

```
d:\TEAMAPPEX\
├── client/          React 19 + Vite 8 + Tailwind CSS (CDN) frontend
│   └── src/
│       ├── services/api.js   Centralised API client
│       ├── views/            Page-level components
│       └── components/       Reusable UI components
├── server/          Express 4 + better-sqlite3 backend
│   └── src/
│       ├── db/               Schema, seed, singleton connection
│       ├── middleware/        JWT auth, input validation
│       └── routes/           auth · events · people · locket · messages
├── scripts/         dev.ps1 (Windows) · dev.sh (Linux/macOS)
├── .env.example     Environment variable template
└── package.json     npm workspace root (runs both with concurrently)
```

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 19 + Vite 8 | Fast HMR, ESM-native, lightweight |
| Styling | Tailwind CSS v3 (CDN) + custom tokens | Rapid prototyping, warm terracotta design system |
| Icons | Lucide React + Material Symbols | Consistent, accessible icon sets |
| Backend | Express 4 | Minimal, well-understood, fast to iterate |
| Database | SQLite via `better-sqlite3` | Zero-config, synchronous API, single file, no server process |
| Auth | JWT (jsonwebtoken) + bcryptjs | Stateless, standard, bcrypt cost=10 for password hashing |
| Dev runner | concurrently | Single `npm run dev` starts both server + client |
| Linter | oxlint | Fast Rust-based linter |

---

## Supported Environments

- **Node.js:** v22.x (tested) — v18+ required minimum
- **npm:** v10.x
- **OS:** Windows 10/11, Linux, macOS
- **Browser:** Chrome 120+, Firefox 125+, Edge 120+, Safari 17+

---

## Dependencies

### Client (`client/package.json`)
- `react` ^19.2.8 — UI library
- `react-dom` ^19.2.8 — DOM renderer
- `lucide-react` ^1.57.0 — Icon library
- `canvas-confetti` ^1.9.4 — Celebratory animations

### Server (`server/package.json`)
- `express` ^4.19.2 — HTTP framework
- `better-sqlite3` ^9.6.0 — SQLite driver (synchronous, no callback hell)
- `bcryptjs` ^2.4.3 — Password hashing
- `jsonwebtoken` ^9.0.2 — JWT signing and verification
- `cors` ^2.8.5 — Cross-origin resource sharing
- `multer` ^1.4.5-lts.1 — Multipart/form-data parsing (for audio uploads)
- `uuid` ^10.0.0 — Unique ID generation

### Root
- `concurrently` ^9.1.2 — Run client + server together

---

## Installation & Run Commands

### Quick Start (Windows — recommended)

```powershell
# From d:\TEAMAPPEX
.\scripts\dev.ps1
```

This script automatically:
- Copies `.env.example` → `.env` if not present
- Installs all dependencies
- Seeds the database on first run
- Starts both servers

### Manual Setup

```bash
# 1. Install all dependencies
npm install                          # root (installs concurrently)
cd server && npm install && cd ..    # server deps
cd client && npm install && cd ..    # client deps

# 2. Set up environment variables
cp .env.example .env
# Edit .env — set JWT_SECRET to a secure random value

# 3. Seed the database (first time only)
npm run db:seed --workspace=server

# 4. Run both servers together
npm run dev

# ── Or run them separately ──
npm run dev:server   # Express API on :3001
npm run dev:client   # Vite on :5173
```

### Verify it's working

```bash
# Health check
curl http://localhost:3001/api/health
# → {"status":"ok","service":"ShareSpot API",...}

# Frontend
open http://localhost:5173
```

---

## Deployment / Access Details

| Service | URL |
|---|---|
| Frontend (dev) | http://localhost:5173 |
| API (dev) | http://localhost:3001 |
| Health check | http://localhost:3001/api/health |

In development, Vite proxies all `/api/*` requests to `:3001` — no CORS configuration needed on the client.

For a production deployment, build the client (`npm run build`) and serve `client/dist/` through a static host or the same Express server.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | Express server port |
| `JWT_SECRET` | **Yes** | dev fallback | Secret used to sign JWTs. Must be changed in production. Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |
| `NODE_ENV` | No | `development` | Set to `production` to hide stack traces in error responses |
| `VITE_API_URL` | No | `/api` | API base URL used by the React client |

---

## Database Setup

The app uses **SQLite** via `better-sqlite3`. The database file is created at `server/data/sharespot.db` automatically on first server start (schema is applied via `IF NOT EXISTS` statements).

```bash
# Seed demo data (users, events, locket moments, messages)
npm run db:seed --workspace=server

# The database file is gitignored — never committed to source control
```

### Demo Accounts (created by seed)

| Username | Password | Character |
|---|---|---|
| `rohan` | `demo1234` | Rohan Shenoy — CS student, wants to learn Tulu |
| `priya` | `demo1234` | Priya Sharma — native Tulu speaker, willing to teach |
| `arjun` | `demo1234` | Arjun Nayak — Yakshagana performer |
| `ananya` | `demo1234` | Ananya Hegde — food historian |
| `kavya` | `demo1234` | Kavya Pillai — Kodava architecture student |

---

## API Reference (5 Major APIs)

All endpoints are prefixed with `/api`.

### 1. Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Sign in → JWT |
| GET | `/auth/me` | ✅ | Get full profile |
| PATCH | `/auth/me` | ✅ | Update profile + interests |

### 2. Events — `/api/events`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/events?q=&category=` | No | List/search events |
| GET | `/events/saved` | ✅ | User's saved events |
| GET | `/events/:id` | No | Event detail |
| POST | `/events` | ✅ | Submit gathering |
| POST | `/events/:id/save` | ✅ | Toggle save |

### 3. People — `/api/people`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/people?q=&filter=` | ✅ | Discover users with match scores |
| GET | `/people/connections` | ✅ | My confirmed connections |
| GET | `/people/:id` | ✅ | Public profile |
| POST | `/people/:id/connect` | ✅ | Connect |

### 4. Culture Locket — `/api/locket`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/locket` | ✅ | My locket feed |
| POST | `/locket` | ✅ | Create moment |
| POST | `/locket/:id/react` | ✅ | React to moment |
| GET | `/locket/vault` | No | Dialect archive |

### 5. Messages — `/api/messages`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/messages/conversations` | ✅ | All conversations |
| GET | `/messages/:partnerId` | ✅ | Full thread |
| POST | `/messages/:partnerId` | ✅ | Send message |
| PATCH | `/messages/:partnerId/read` | ✅ | Mark read |

---

## Test Instructions

### Automated End-to-End Test Suite

Run the complete automated test suite (exercises all 6 API modules against SQLite):

```bash
npm test
```

```
🎉 ALL TESTS PASSED: 45 passed, 0 failed
```

This runs 45 automated test assertions covering:
- **Health:** `/api/health` status and version checks
- **Authentication:** Registration, login, JWT validation, profile retrieval (`/api/auth/me`), profile updates, and unauthenticated access prevention (401)
- **Events:** Listing, category filtering, keyword search, community event submission with SQLite persistence, and bookmark/save toggles
- **People Discovery:** Discoverable user queries, Jaccard + skill-exchange match calculation, match score sorting, and location privacy enforcement (exact coordinates stripped)
- **Culture Locket:** Dialect archive vault retrieval, visible moments query, new dialect word/step moment creation with SQLite persistence, and peer reaction logging
- **Messages:** Conversation listing, thread history retrieval, message sending with SQLite persistence, and read receipt marking

### Test with a browser

1. Start both servers: `.\scripts\dev.ps1` (or `npm run dev`)
2. Open http://localhost:5173
3. Look for the **"🟢 SQLite Live"** badge in the navbar indicating real-time database synchronization
4. Click **Get Started** → complete onboarding to persist custom preferences to SQLite
5. Or **Explore Demo** → browse events on the living map, submit a gathering, discover people, send a culture locket, and message connections

### Test the API directly

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test1234","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"rohan","password":"demo1234"}'

# List events (no auth required)
curl http://localhost:3001/api/events

# Search events
curl "http://localhost:3001/api/events?q=yakshagana&category=culture"

# Health check
curl http://localhost:3001/api/health
```

---

## Known Limitations

- **Audio recording:** The LocketModal UI includes a recording simulation. Real `MediaRecorder` audio capture is implemented in the client; audio blobs are stored as base64 strings — not streamed to a separate file server.
- **Map tiles:** The InteractiveMap uses a hand-drawn SVG canvas for Manipal. Real tile maps (Leaflet + OSM) are a planned P1 upgrade.
- **Real-time messaging:** The Messages view polls manually (via user interaction), not via WebSocket. For a hackathon demo this is acceptable; a WebSocket layer is deferred.
- **Image uploads:** Event images use Unsplash URLs. User photo upload to a file server is not implemented.
- **Email verification:** Account creation has no email flow; only username + password.
- **SQLite concurrency:** better-sqlite3 with WAL mode handles multiple readers/one writer. For production scale, migrate to PostgreSQL.

---

## AI Tools & Purposes

| Tool | Purpose |
|---|---|
| **Google Antigravity (AGY)** | Architecture planning, full-stack code generation, security review, README authoring |

All code has been reviewed, understood, and is fully explainable by the team. Antigravity was used as a coding assistant; all design decisions and architectural choices were made by the team.

---

## Material Third-Party Resources & Synthetic Data

| Resource | Source | License / Notes |
|---|---|---|
| Event seed data | Synthetic, Manipal campus-inspired | No real event details; all dates/organizers are fictional |
| User seed data | Synthetic | No real personal data; avatars from Unsplash (free to use) |
| Unsplash images | [unsplash.com](https://unsplash.com) | Unsplash License (free for demo use) |
| Playfair Display font | Google Fonts | SIL Open Font License |
| DM Sans font | Google Fonts | SIL Open Font License |
| Material Symbols | Google Fonts | Apache 2.0 |
| Lucide React icons | [lucide.dev](https://lucide.dev) | ISC License |
| canvas-confetti | npm | MIT License |
| Express | npm | MIT License |
| better-sqlite3 | npm | MIT License |
| bcryptjs | npm | MIT License |
| jsonwebtoken | npm | MIT License |

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Core development — all features merged here |
| `bugbounty` | Frozen deployment branch for peer testing (Attack Phase) |
| `fixing` | Bug fixes during Fixing Phase (2:00–3:30 AM, 16 Oct) — created from `bugbounty` |

> ⚠️ Never commit to `bugbounty` after 12:00 AM or to `fixing` after 3:30 AM on 16 October.