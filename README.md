# अnvesha: The Lost Connection

> **Manipal Hackathon 2026 (M# 2026) · Round 2 · Culture & Community Track**  
> Team: **TEAMAPPEX**

---

## Project Overview

When individuals relocate away from their native regions—whether students moving to university campuses like Manipal, working professionals, researchers, migrants, or families—their living cultural identities—indigenous dialects, traditional art forms, folk practices, and regional culinary heritages—often go dormant due to a lack of visible, dedicated spaces to connect with peers of similar roots.

**अnvesha** (Anvesha) is a cultural discovery, community engagement, and living heritage platform built to bridge this cultural disconnect. It provides an intuitive, living ecosystem where anyone living away from home can discover regional gatherings, find language conversation partners, share daily heritage micro-pulses, and participate in cultural circles.

---

## Key Pillars & Features

1. **Living Cultural Atlas & Map**
   - Interactive regional and campus map powered by Leaflet and D3.
   - Pinned cultural gatherings (Yakshagana performances, Tulu conversational circles, clay pottery workshops, coastal food heritage trails).
   - Filter by categories with zero-latency cultural artwork and vector SVG fallbacks.
   - User gathering submissions with verified source attribution and bookmarking.

2. **Explainable People Discovery & Skill Exchange**
   - Dynamic match scoring powered by Jaccard interest overlap, dialect synergy, and reciprocal skill intentions.
   - Transparent plain-language match reasons (e.g., *"Priya can teach conversational Tulu which you want to learn"*).
   - Strict privacy safeguards: precise geographic coordinates are never exposed over the wire; only broad neighborhood proximity is shared.
   - Direct peer communication without restrictive request bottlenecks.

3. **Culture Locket & Oral Dialect Archive**
   - Ambient daily cultural pulses styled as an authentic lined parchment diary with brass coil bindings.
   - Native audio pronunciation guides with interactive syllable-by-syllable breakdown (e.g., `EN · CHA · UL · LER`).
   - Preservation vault for regional idioms, field provenance, and quick peer sticker reactions.

4. **Cultural Community Circles**
   - Thematic and location-based hubs (Folk & Classical Arts, Dialect Preservation, Coastal Culinary).
   - Real-time experience sharing and group discussions within safe, moderated cultural spaces.

5. **Direct Real-Time Messaging**
   - Direct 1-on-1 private messaging backed by **Node.js native SQLite database persistence**.
   - Real-time updates, typing indicators, and presence check powered by **Socket.IO**.

6. **Interactive OpenAPI 3.0 / Swagger Documentation**
   - Self-documenting API explorer served directly at `/api/docs`.

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

### Technology Breakdown

| Layer | Technology | Key Highlights |
|---|---|---|
| **Frontend** | React 19, Vite 8 | Fast ESM hot-reloading, component architecture |
| **Styling** | Tailwind CSS (Warm Terracotta Design System) | Custom Indian heritage palette: terracotta, ochre, cream parchment |
| **Maps & Geo** | Leaflet, React-Leaflet, D3-Geo | Interactive geospatial mapping and choropleth rendering |
| **Backend API** | Express 4, Node.js v22 | Clean REST architecture with modular routers |
| **Database** | Node.js Built-in `node:sqlite` (`DatabaseSync`) | Zero native C++ build toolchains; robust synchronous SQLite engine |
| **Realtime** | Socket.IO v4 | Live message broadcasting, typing state, and presence detection |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` | Secure stateless auth with salt-hashed credentials |
| **API Docs** | Swagger UI Express (`swagger-ui-express`) | Interactive OpenAPI 3.0 documentation at `/api/docs` |

---

## System Requirements

- **Operating System:** Windows 10/11 (or macOS / Linux)
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

To ensure clear technical evaluation boundaries, the following explicit architectural decisions and known constraints are documented:

1. **Embedded SQLite Single-Process Boundary**:
   - The database engine uses Node.js 22 built-in `node:sqlite` (`DatabaseSync`) writing directly to a local disk file (`server/data/sharespot.db`).
   - *Design Boundary*: Built for high-performance single-instance and edge deployment with WAL mode and foreign key constraints enabled. Distributed multi-region clustering, multi-master replication, and cross-datacenter database sharding are out of scope (architectural migration path to PostgreSQL is standard for multi-datacenter horizontal scale).

2. **Real-Time WebSocket In-Process Memory Adapter**:
   - Socket.IO maintains WebSocket connection states and room broadcasts in-memory on the active server node.
   - *Design Boundary*: Operating multiple server nodes behind a stateless round-robin load balancer without sticky sessions or an external Redis Pub/Sub backplane is not supported in this single-node configuration.

3. **Local Storage & Persistent Volumes**:
   - Audio pulse recordings (`/uploads/locket/`) and the SQLite database file reside on the local host filesystem.
   - *Design Boundary*: Integration with external cloud blob stores (e.g. AWS S3, Cloudflare R2, Google Cloud Storage) is deliberately omitted to keep the application 100% self-contained and offline-friendly. Containerized deployments must attach a persistent volume to preserve media across container restarts.

4. **Client Audio Recording & Browser Hardware Permissions**:
   - Dialect voice recording utilizes the browser's native `MediaRecorder` API.
   - *Design Boundary*: Hardware microphone capture requires explicit browser permission and HTTPS or `localhost` context. If audio hardware is denied or unavailable, the client utilizes simulated native voice guide generation and Web Speech TTS synthesis.

5. **Location Privacy & Geospatial Precision**:
   - To prevent stalking and protect user safety, the platform **strictly forbids** real-time GPS tracking, background geolocation breadcrumbs, or publishing exact residential coordinates.
   - *Design Boundary*: All community gathering locations and peer proximity indicators resolve to broad neighborhood centroids and district bounding boxes rather than high-precision real-time coordinates.

6. **Authentication & Identity Boundaries**:
   - Authentication relies on stateless, cryptographically signed HMAC-SHA256 JWT tokens with bcrypt password hashing (cost factor 10).
   - *Design Boundary*: Third-party social OAuth 2.0 (Google/GitHub SSO), hardware security keys (WebAuthn), and SMS/email OTP verification flows require external cloud providers and are outside the self-contained hackathon evaluation scope.

7. **Content Moderation & Asynchronous Pipelines**:
   - Community notes and audio locket moments provide integrated user reporting mechanisms (`/api/communities/:id/report`).
   - *Design Boundary*: Automated real-time NLP toxicity filtering and AI audio biometric screening are asynchronous administrative processes not run synchronously on the request loop.

8. **Device & Viewport Support**:
   - Responsive layouts are specifically targeted for standard mobile screens (360px–430px width) and desktop viewports (1024px+). Non-standard foldables or sub-320px micro-screens fall back to standard horizontal scroll containers.

9. **In-Memory Rate Limiting**:
   - Rate limiters use an in-memory sliding window algorithm per Node.js process. In a distributed multi-node architecture, centralized rate limiting would require an external Redis cluster.

---

## Git & Deployment Branch Guidelines

- **`main`**: Active primary development branch.
- **`bugbounty`**: Deployment branch configured for evaluations and review.
- Both branches are maintained in parity for seamless verification.