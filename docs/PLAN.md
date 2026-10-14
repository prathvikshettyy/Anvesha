# Anvesha — Implementation Plan

> This document is the single source of truth for what's being built, in what
> order, and why. Update the checkboxes as work lands. Written after a full
> audit of the existing codebase (Oct 2026).

## 0. Audit summary — what already exists

The app was already substantially rebuilt past the original "ShareSpot /
Manipal-only" hackathon pitch described in `README.md` / `spec.md`:

- Rebranded in the **UI** to "Anvesha", framed around all of India (hero copy,
  nav, India-wide illustrated SVG map with all states). The stale "Manipal
  campus" framing still lingers in: `server/src/db/schema.js` defaults,
  `server/src/db/seed.js` demo data, `README.md`, event venue-coordinate
  resolver, and a few UI copy strings ("Coming Up on Campus", etc).
- Real Express + SQLite (`node:sqlite`) backend with auth (JWT), events,
  people/matching, locket, messages routes. Reasonably clean and tested
  (`server/tests/api.test.mjs`).
- People-matching is a real Jaccard + skill-exchange formula, but it is
  **location-blind** and ignores the social graph (no mutual-connections
  signal).
- "Culture Locket" voice recording is **fully simulated** — `LocketModal`
  just runs a `setInterval` timer; no `MediaRecorder`, no audio file is ever
  produced or stored. Playback on `CultureLocketCard` uses `SpeechSynthesis`
  TTS, not a real recording.
- Messaging is REST-only, polled on view mount / partner switch. No push,
  no typing indicator, no presence.
- Two separate maps exist: a hand-drawn SVG "Manipal" map (`InteractiveMap.jsx`,
  now mostly unused) and a hand-drawn illustrated all-India SVG map
  (`InteractiveIndiaMap.jsx`). Neither uses real geographic tiles/coordinates
  for rendering — `lat/lng` are stored but never actually plotted on a real
  map.
- Onboarding only collects interests + a coarse mode preference; it never
  asks **where the user lives**, so matching/maps can't use real location.
- Category taxonomies disagree across 3 places (`validate.js` backend allow-list,
  `SubmitEventModal` dropdown, `PIN_CATEGORIES` used by the map/legend) — a
  real bug, not just cosmetic.
- UI visual language (warm terracotta, serif headings) is already tasteful
  and not overtly "AI slop" — but confetti bursts and sparkle icons are
  used liberally on nearly every interaction, which reads as gimmicky.
  Dialing this back, not a full redesign, is the right call.

## 1. Decisions

- **No standalone Neo4j server.** The social graph here (users, interests,
  connections) is small and fits comfortably in SQLite. Standing up a second
  database process adds real operational cost (another service to install,
  run, and keep in sync) with no accuracy benefit at this scale, and this
  dev sandbox cannot reliably keep a long-running external DB service alive
  between sessions. Instead, graph traversal (mutual connections, 2-hop
  "friend of friend") is implemented directly as recursive/self-join SQL
  queries + in-memory scoring in Node. The schema stays graph-friendly
  (`connections` is already an edge table) so a real Neo4j migration remains
  straightforward later if the team scales up.
- **Real-time chat via Socket.IO**, layered on top of the existing REST
  endpoints (REST remains the source of truth / fallback; sockets push
  live updates and typing/presence signals).
- **Real audio for Culture Locket** via the browser `MediaRecorder` API,
  uploaded as a file (multipart/form-data, `multer` disk storage) and served
  statically from the Express server — not base64-in-JSON, not simulated.
- **Real map via Leaflet + OpenStreetMap tiles** (`react-leaflet`), default
  view centered and bounded on **Karnataka**, plotting real event `lat/lng`.
  The existing hand-illustrated India SVG map is kept as the "Explore all of
  India" artistic browsing mode (it's a nice, legitimately useful feature),
  while the new Leaflet view becomes the "Live Map" for real, geographically
  accurate exploration — primarily Karnataka, with the rest of India
  reachable by panning/zooming out.
- **Onboarding now asks for location** (state + city/district, Karnataka
  districts surfaced first) and per-selected-interest intent (learn / teach /
  curious), feeding a richer, explainable, dynamically-recomputed match score.

## 2. Phases

### Phase 0 — Foundation fixes ☐
- [ ] Install dependencies, confirm server/tests/client boot.
- [ ] Unify the event category taxonomy across backend validation, event
      submission form, and map legend (single source of truth).
- [ ] Remove hard-coded "Manipal only" defaults from schema/seed/venue
      resolver; make Karnataka the sensible default while supporting any
      Indian state/city.

### Phase 1 — Location-aware onboarding ☐
- [ ] Add `state` column to `users` (plus keep `city`/`neighborhood`).
- [ ] Onboarding: new "Where are you based?" step — state selector
      (Karnataka districts featured first, full India states below) + free
      text city, before interests.
- [ ] Onboarding: per-selected-interest intent (learn / teach / curious)
      instead of two hard-coded categories, persisted via existing
      `user_interests.intention` column.
- [ ] Persist `state`/`city` through register/update-profile endpoints.

### Phase 2 — Robust, explainable, dynamic match engine ☐
- [ ] Rewrite `computeMatch` to combine: interest Jaccard, skill-exchange,
      **language overlap**, **same state/city proximity bonus**, **mutual
      connections (graph)**, recency/activity, with tunable weights and a
      clear, multi-line human-readable explanation.
- [ ] Add mutual-connections SQL query (1-hop friend-of-friend count).
- [ ] Track `last_active_at` on login/`/me` for a small recency signal and to
      power "online now" in chat.
- [ ] Expose match breakdown to the client so "Why you matched" is specific
      (not a single vague sentence).

### Phase 3 — Real Culture Locket recordings ✅
- [x] `LocketModal`: real `MediaRecorder` capture (webm/opus/m4a), waveform tied
      to actual mic input, preview playback before sending, auto-save to server disk.
- [x] New `POST /api/locket/audio` (multipart) storing files under
      `server/uploads/locket/`, served via `express.static('/uploads')`.
- [x] `CultureLocketCard`: play the real uploaded audio file; TTS kept only
      as a fallback for the curated dialect vault entries that have no
      recorded audio.

### Phase 4 — Real map, Karnataka-first ☐
- [ ] Add `leaflet` + `react-leaflet`.
- [ ] New `KarnatakaMap` component: OSM tiles, bounded/centered on
      Karnataka, markers from real event `lat/lng`, clustering-light via
      simple marker grouping, popup → event detail.
- [ ] `EventsView`: add a third view mode "Live Map" alongside the existing
      illustrated Atlas map and List view.
- [ ] Seed real Karnataka event coordinates (Bengaluru, Mysuru, Udupi,
      Mangaluru, Hubballi, etc.) so the live map isn't empty.

### Phase 5 — Real-time chat ☐
- [ ] `socket.io` server, JWT-authenticated handshake, per-user room.
- [ ] Live message delivery, typing indicator, online/last-seen presence.
- [ ] Client `MessagesView` subscribes instead of only polling; REST stays
      as the persistence + history/fallback layer.

### Phase 6 — UI consistency / de-flash pass ☐
- [ ] Reduce confetti to a few meaningful moments (onboarding complete,
      first connection) instead of firing on every click.
- [ ] Trim redundant "Sparkles" iconography where it adds noise.
- [ ] Sweep remaining "Manipal"/campus-only copy in favour of India-wide,
      Karnataka-first language.

### Phase 7 — Stretch (time-permitting)
- [ ] Lightweight notification center for connection requests.
- [ ] Event RSVP persisted (attendee list), not just an alert().
- [ ] Basic safety/report action on profiles & messages.

---
Legend: ☐ not started · ⏳ in progress · ✅ done. Phases are executed roughly
in order, but later phases may start before earlier ones are 100% checked off
when the work is independent.
