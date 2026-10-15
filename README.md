# अnvesha — The Lost Connection

> **Manipal Hackathon 2026 (M# 2026) · Round 2 · Culture & Community Track**  
> Team: **TEAMAPPEX**

---

## The Problem

When people relocate away from their native regions—whether students moving to university campuses, working professionals transferring to new cities, researchers, migrants, or entire families—their living cultural identities risk going dormant. Indigenous dialects, traditional art forms, folk practices, and regional culinary heritages lose their daily footing when there is no visible, dedicated space to find peers of similar roots.

This is not a student-only problem. It is a shared human experience for **anyone** who has moved far from home and finds themselves culturally adrift.

---

## What अnvesha Does

**अnvesha** (Sanskrit: *to seek, to discover*) is a cultural discovery, community engagement, and living heritage platform that bridges this disconnect. It gives anyone living away from home a dedicated space to:

- **Discover** regional cultural gatherings and events on a living map.
- **Find** peers who share their dialect, art form, or culinary tradition—and understand *why* they match.
- **Share** daily cultural micro-pulses: dialect words, craft journal entries, and oral pronunciation guides.
- **Participate** in themed cultural circles and group discussions.
- **Message** any peer directly, with full real-time chat backed by persistent database storage.

---

## Key Features

### 1. Living Cultural Atlas & Map
- Interactive map powered by **Leaflet** + **D3-Geo** showing pinned cultural gatherings across India.
- Category filters (Yakshagana, Tulu, Coastal Culinary, Folk Arts, Pottery, etc.) with SVG artwork fallbacks.
- User event submission with source attribution and bookmarking.
- Venue coordinates resolved from a curated lookup table; unresolvable venues fall back to a Karnataka geographic centroid.

### 2. Explainable People Discovery & Skill Exchange
- Match scoring is a **weighted blend** of seven signals:
  1. Interest overlap (Jaccard similarity — up to 42 pts)
  2. Skill exchange: what you want to learn vs. what they can teach, and vice versa (up to 20 pts)
  3. Shared languages (up to 10 pts)
  4. Location proximity — same city > same state (up to 14 pts)
  5. Mutual connections — 1-hop social graph traversal (up to 15 pts)
  6. Engagement mode compatibility: in-person / online / both (up to 4 pts)
  7. Recent platform activity (up to 3 pts)
- Every match includes plain-language **match reasons** (e.g., *"They can teach you Tulu. You share 3 interests."*).
- **Privacy guard**: exact GPS coordinates are never exposed over the API — only city/state/neighborhood labels.

### 3. Culture Locket & Oral Dialect Archive
- Ambient cultural diary styled as a lined parchment notebook with brass coil bindings.
- Supports two moment types: **Word of the Day** (dialect term + phonetic guide + meaning) and **Craft Journal** (step-by-step traditional craft documentation).
- Real audio recording via the browser `MediaRecorder` API, uploaded to the server as webm/ogg/mp4.
- A **curated static dialect vault** of four preserved coastal Karnataka dialect entries (Tulu, Konkani, Kodava Takk, Havigannada) — these are hardcoded reference records, not user-generated (see [Known Limitations](#known-limitations--architectural-assumptions)).
- Sticker reactions sent to locket moment authors via Socket.IO.

### 4. Cultural Community Circles
- Thematic hubs (Folk & Classical Arts, Dialect Preservation, Coastal Culinary, etc.).
- Real-time group discussion notes, requiring membership before posting.
- Community moderation reporting stored in the database; review is a manual administrative action.

### 5. Direct Real-Time Messaging
- 1-on-1 private messaging backed by **SQLite persistence** (all messages survive server restarts).
- Real-time delivery via **Socket.IO**: new messages pushed to both sender and receiver instantly.
- Typing indicators (ephemeral — never persisted), online presence tracking, and unread counts.
- Message thread history capped at **200 messages** per conversation pair per fetch.

### 6. Interactive API Documentation
- Full OpenAPI 3.0 specification served at `/api/docs` via Swagger UI.

---

## Technical Architecture & Stack

```
TEAMAPPEX/
├── client/                     # React 19 + Vite 8 frontend
│   ├── src/
│   │   ├── components/         # Reusable UI (PersonCard, EventCard, CultureLocketCard, Map)
│   │   ├── views/              # Page views (Home, Atlas, People, Locket, Communities, Messages)
│   │   ├── services/           # REST API client & Socket.IO real-time client
│   │   └── utils/              # Identicons, image fallbacks, category presets
│   └── package.json
├── server/                     # Express 4 + Native SQLite backend
│   ├── src/
│   │   ├── db/                 # Node 22 native DatabaseSync singleton, schema & seed
│   │   ├── middleware/         # JWT auth, validation, rate limiting, error handling
│   │   ├── realtime/           # Socket.IO connection & event handlers
│   │   └── routes/             # auth · events · people · locket · messages · communities · docs
│   └── package.json
├── scripts/                    # dev.ps1 automated setup & launcher
├── .env.example                # Environment variable template
└── package.json                # npm workspaces root
```

### Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | React 19, Vite 8 | Fast ESM hot-reloading, component SPA architecture |
| **Styling** | Tailwind CSS (Warm Terracotta Design System) | Indian heritage palette: terracotta, ochre, cream parchment |
| **Maps & Geo** | Leaflet 1.x, React-Leaflet 5, D3-Geo 3 | Interactive map + choropleth state rendering |
| **Backend API** | Express 4, Node.js v22 | Modular routers, security headers, CORS |
| **Database** | Node.js 22 built-in `node:sqlite` (`DatabaseSync`) | Zero native C++ toolchains; WAL mode + foreign keys |
| **Realtime** | Socket.IO v4 (server + client) | Live messaging, typing indicators, presence tracking |
| **File Uploads** | Multer v2 | Dialect voice recordings stored to local disk |
| **Authentication** | `jsonwebtoken` + `bcryptjs` | HMAC-SHA256 JWT (7-day expiry), bcrypt cost 10 |
| **API Docs** | `swagger-ui-express` v5 | Interactive OpenAPI 3.0 explorer at `/api/docs` |

---

## System Requirements

- **Operating System:** Windows 10/11
- **Node.js:** **v22.x or later** *(Required for native `node:sqlite` support)*
- **Package Manager:** npm v10.x or later
- **Browser:** Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari (modern versions)

---

## Installation & Running Locally

### Option 1: Automated Launch (Windows PowerShell — Recommended)

From the project root directory (`d:\TEAMAPPEX`), run:

```powershell
.\scripts\dev.ps1
```

The setup script automatically:
1. Creates `.env` from `.env.example` if not present.
2. Installs root, client, and server dependencies.
3. Automatically seeds the SQLite database (`sharespot.db`) on the first run.
4. Concurrently boots the backend API server and the Vite frontend.

---

### Option 2: Manual Step-by-Step Setup

If you prefer running commands manually:

```bash
# 1. Install all dependencies across workspaces
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Seed demo data into SQLite (first time only)
npm run db:seed --workspace=server

# 4. Start both servers concurrently
npm run dev
```

*(You can also run them in separate terminals using `npm run dev:server` and `npm run dev:client`)*.

---

## Application URLs & Endpoints

| Service | Local URL | Description |
|---|---|---|
| **Web Application** | [http://localhost:5173](http://localhost:5173) | Vite Client Application |
| **REST API Server** | [http://localhost:3001](http://localhost:3001) | Express Backend Server |
| **Interactive API Docs** | [http://localhost:3001/api/docs](http://localhost:3001/api/docs) | Swagger UI / OpenAPI Spec |
| **API Health Status** | [http://localhost:3001/api/health](http://localhost:3001/api/health) | Service Health Check |

---

## Seeded Demo Credentials

The database comes pre-seeded with culturally tailored profiles for immediate exploration:

| Username | Password | Persona & Cultural Background |
|---|---|---|
| `rohan` | `demo1234` | **Rohan Shenoy** — CS student seeking to reconnect with coastal traditions and learn Tulu |
| `priya` | `demo1234` | **Priya Sharma** — Native Tulu speaker, mentor willing to practice conversational dialects |
| `arjun` | `demo1234` | **Arjun Nayak** — Traditional Yakshagana performer and coastal artist |
| `ananya` | `demo1234` | **Ananya Hegde** — Coastal culinary historian documenting traditional recipes |
| `kavya` | `demo1234` | **Kavya Pillai** — Kodava heritage researcher and architecture student |

---

## API Overview

All API endpoints are mounted under the `/api` prefix:

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register` — Create a new user account.
- `POST /api/auth/login` — Sign in with credentials and receive a signed JWT.
- `GET /api/auth/me` — Retrieve the authenticated profile and cultural interests.
- `PATCH /api/auth/me` — Update bio, location, preferred mode, and interest tags.

### 2. Events & Cultural Map (`/api/events`)
- `GET /api/events` — Query gatherings with keyword search, category filters, and pagination.
- `GET /api/events/saved` — List gatherings bookmarked by the authenticated user.
- `GET /api/events/:id` — Retrieve full event details and venue location.
- `POST /api/events` — Submit a new cultural gathering with source attribution.
- `POST /api/events/:id/save` — Toggle saving/bookmarking an event.

### 3. People Discovery & Match Scoring (`/api/people`)
- `GET /api/people` — Discover peers ranked by explainable cultural match scores (Jaccard + skill exchange).
- `GET /api/people/connections` — List confirmed peer connections.
- `GET /api/people/:id` — Fetch a user's public profile and skills.
- `POST /api/people/:id/connect` — Direct connect with a peer.

### 4. Direct Peer Messaging (`/api/messages`)
- `GET /api/messages/conversations` — Fetch user's conversation threads with unread counts.
- `GET /api/messages/:partnerId` — Fetch message history with a peer (persisted in SQLite).
- `POST /api/messages/:partnerId` — Send a direct message (dispatched via REST + Socket.IO).
- `PATCH /api/messages/:partnerId/read` — Mark a message thread as read.
- `GET /api/messages/:partnerId/online` — Check live online status of a peer.

### 5. Culture Locket & Oral Dialect Archive (`/api/locket`)
- `GET /api/locket` — Retrieve active locket moments feed.
- `GET /api/locket/mine` — View moments authored by the current user.
- `GET /api/locket/connections` — View moments shared by connected cultural peers.
- `GET /api/locket/vault` — Access the curated regional dialect vocabulary archive.
- `POST /api/locket/audio` — Upload audio recording for dialect pronunciation guides.
- `POST /api/locket` — Publish a new Word of the Day or Craft Journal pulse.
- `POST /api/locket/:id/react` — Send celebratory sticker reaction to a moment.

### 6. Communities & Discussions (`/api/communities`)
- `GET /api/communities` — Discover cultural hubs by category or search query.
- `GET /api/communities/:id` — Get detailed community info and member roster.
- `POST /api/communities/:id/join` — Join a cultural circle.
- `POST /api/communities/:id/leave` — Leave a community.
- `GET /api/communities/:id/messages` — Retrieve group discussion notes.
- `POST /api/communities/:id/messages` — Post a note in the group discussion.

---

## Known Limitations & Architectural Assumptions

The following constraints are **explicit, intentional design boundaries** of this hackathon build. They are documented here so evaluators can distinguish architectural decisions from implementation defects.

### 1. SQLite Is Single-Process and File-Backed

The database engine is Node.js 22 built-in `node:sqlite` (`DatabaseSync`), writing synchronously to a local file. WAL mode and foreign-key constraints are enabled.

**Boundary:** Running multiple parallel Node.js server processes against the same `.db` file is not supported and will cause write contention. Horizontal scaling requires migrating to a network-accessible database (e.g., PostgreSQL). This is a deliberate choice for zero-dependency, self-contained local operation.

### 2. Socket.IO Uses In-Process Memory Only — No Redis Backplane

All WebSocket connection state (the `onlineUsers` Map, Socket.IO room memberships) lives in the Node.js process heap. No external Redis Pub/Sub adapter is used.

**Boundary:** Deploying two or more backend instances behind a round-robin load balancer without sticky sessions would break real-time delivery. Single-node deployment works correctly.

### 3. Uploaded Media Is Stored on Local Filesystem

Audio recordings (`POST /api/locket/audio`) are saved to `server/uploads/locket/` on the host disk via Multer. Profile avatar URLs in seed data point to the local `/avatars/` static path.

**Boundary:** In containerized or ephemeral deployments, uploaded files are lost on restart unless a persistent volume is mounted at `server/uploads/`. Cloud blob storage is out of scope.

### 4. Audio File Size Is Capped at 5 MB

The Multer configuration enforces a **5 MB** per-file size cap. The `express.json()` middleware enforces a **2 MB** body cap for JSON payloads. Clients that send larger payloads receive `413 Payload Too Large`.

**Boundary:** Long-form audio is not supported — this is a short dialect word/phrase sharing feature by design.

### 5. Browser Microphone Availability Is Not Guaranteed

The Locket recording feature uses the browser-native `MediaRecorder` API, which requires an HTTPS or `localhost` origin, explicit user microphone permission, and available hardware.

**Boundary:** When the microphone is unavailable or denied, the client falls back to Web Speech Synthesis (TTS) for pronunciation display. No audio is captured in this path. This is intentional and user-visible.

### 6. Location Precision Is Intentionally Coarse

User coordinates are **never sent to clients** — `lat` and `lng` fields are explicitly stripped from all API responses. Matching uses only city and state string labels.

**Boundary:** Same-city / same-state is the finest proximity granularity available. Precise meter-level geo-filtering is absent as a privacy safeguard.

### 7. Authentication Is JWT-Only — No OAuth, No Email Verification, No Server-Side Revocation

Sessions are stateless HMAC-SHA256 JWTs with 7-day expiry stored in browser `sessionStorage`. No server-side revocation list exists.

**Boundary:**
- Logout clears the client-side token only; the JWT remains valid until expiry.
- No Google/GitHub OAuth 2.0, WebAuthn, SMS OTP, or email verification.
- Registration is open with no email verification step (acceptable for a demo build).

### 8. The Dialect Vault Is a Hardcoded Static List

The four dialect entries at `GET /api/locket/vault` (Tulu, Konkani, Kodava Takk, Havigannada) are hardcoded constants in source code — not database rows. They cannot be added to, edited, or deleted via the API.

**Boundary:** User-submitted dialect entries go into the locket moments feed, not the vault.

### 9. Content Moderation Is Manual Only

Community reports stored via `POST /api/communities/:id/report` require manual administrator review. No automated NLP toxicity classifier or AI pipeline is implemented.

**Boundary:** No automatic content removal, user suspension, or real-time flagging occurs.

### 10. Message and Community History Is Hard-Capped

- Direct messages: `GET /api/messages/:partnerId` returns at most **200 messages** per request (no pagination cursor).
- Community messages: `GET /api/communities/:id/messages` returns at most **150 messages** per request (no pagination cursor).

**Boundary:** Histories exceeding these caps will drop the oldest messages from view.

### 11. Rate Limiting Is In-Process Only

Rate limiting runs within the Node.js process as Express middleware. Counters reset on server restart and are not shared across instances.

**Boundary:** Distributed rate limiting requires an external Redis-backed adapter in a multi-node setup.

### 12. Event Venue Coordinates Use a Limited Lookup Table

Venue-to-coordinate resolution uses a hardcoded table of approximately 30 known Karnataka cities and major Indian hubs. Unmatched venues fall back to Karnataka's geographic centroid (15.3173°N, 75.7139°E).

**Boundary:** Events with unfamiliar venue names appear clustered at Karnataka's center on the map.

### 13. People Connection Is Instant — No Pending Request Step

`POST /api/people/:id/connect` immediately sets the connection to `CONNECTED`. There is no two-step send/accept flow.

**Boundary:** Any authenticated user can connect with any discoverable user without approval. This is a deliberate UX simplification for the demo.

### 14. JWT Is Stored in sessionStorage

The JWT is stored in `sessionStorage` under key `ss_token` and sent as `Authorization: Bearer` on each request.

**Boundary:** Tokens are accessible to JavaScript in the same origin (XSS risk). Production hardening would use `httpOnly` cookies with `SameSite=Strict`.

### 15. Seed Audio and Image URLs Reference External CDNs

Locket moments and events created by the seed script include `audio_url` and `image_url` values that reference external URLs (e.g., Unsplash). These require internet connectivity and may break if third-party CDNs impose rate limits or change URLs.

**Boundary:** User-uploaded recordings served from `/uploads/locket/` are not subject to this limitation.

---

## Seeded Demo Data Notes

The seed script (`server/src/db/seed.js`) populates:
- **5 user accounts** with cultural profiles, interests, skills, and languages.
- **Pre-established connections** between seed users (so messaging and locket feeds work immediately on first run).
- **Cultural events** across Karnataka (Yakshagana performances, Tulu circles, pottery workshops, food trails, etc.).
- **Community circles** with initial members and roles.
- **Locket moments** as sample dialect entries and craft journal posts.

The seed is **idempotent** — it uses `INSERT OR IGNORE` and is safe to run multiple times without creating duplicates.

---

## Git & Branch Information

- **`main`** — Active primary development branch.
- **`bugbounty`** — Evaluation and review branch, maintained in parity with `main`.