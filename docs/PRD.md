# ShareSpot: The Lost Connection - Product Requirements Document

**Team of 4 · 36-hour hackathon build · Region: coastal Karnataka · Version 1.0, 14 Oct 2026**

---

## 1. Overview
- **Product:** ShareSpot is a culture-first discovery web app. It connects people to the communities, events and people they have a real reason to belong to, and explains every match in one specific sentence.
- **Promise:** Find your people. Keep your culture in motion.
- **Core chain:** cultural knowledge &rarr; personal interests &rarr; real communities &rarr; participation &rarr; preservation.
- **Story for the demo:** A student far from home, interested in Yakshagana and Tulu culture, has no idea who shares that interest. ShareSpot shows them a community, an event and a person, each with a "because" reason, and rejects one superficial match on stage.
- **MVP shape:** One region, a small set of cultural traditions, 10 to 15 hand-curated real communities and events with source links, and synthetic users that are clearly labelled demo data.

---

## 2. Problem and goals

### Problem
Meaningful cultural ties (language, hometown, art form, festival) are scattered across platforms, generations and cities. Ordinary event apps list events by keyword and never say why one matters to you.

### Goals
1. Help a user find a community, an event and a person, each with a specific, explainable reason to care.
2. Separate meaningful matches from superficial similarity, and show that separation in the demo.
3. Move users from discovery to participation (join, attend, connect), then to preservation (credit and keep cultural knowledge).
4. Protect privacy by default: no precise location, no inferred identity.

### Non-goals (out of the MVP)
- Scraping social platforms or private groups
- Live location, payments, unmoderated public messaging
- Claims of automated cultural verification
- Popularity ranking, public like counts, streaks, follower races

---

## 3. Success metrics
Measured on 5 to 8 classmates as test users. Report the real numbers, even if small.

| Metric | Definition |
| :--- | :--- |
| **Recommendation relevance** | Recommendations marked relevant &divide; recommendations shown |
| **Participation intent** | Events saved or marked interested &divide; events viewed |
| **Community joins** | Join-link taps &divide; community cards viewed |
| **Connection conversion** | Connection requests accepted &divide; requests sent |
| **Data quality** | Displayed events with a working source link and a verification label &divide; all displayed events |
| **Locket response (stretch)** | Locket cards that get a reply &divide; cards sent |

*Sign-ups, scroll time and post counts are not success measures.*

---

## 4. Target users

| Persona | Wants | Safe Next Step in the App |
| :--- | :--- | :--- |
| **Culture seeker (student interested in Tulu culture and Yakshagana)** | To explore a tradition and find who practises it nearby | Open a cultural card, then join a community or save an event |
| **Person living away from home** | To keep a link to a hometown, language or tradition | Find a language partner, send a Locket word |
| **Knowledge keeper or practitioner** | To share on their own terms and be credited | Mark "can teach", set attribution and reuse permissions |
| **Language learner** | Conversation partners and practice circles | Request to connect with an opted-in speaker |
| **Community organiser** | To reach the right people and run events | Create a community, post an event, add a join link |

*Students, people new to a city and general explorers (technology, film, gaming, sports) are secondary users of the same product. Culture is the deepest category and the one the demo is built around.*

---

## 5. Product principles
When a feature conflicts with one of these, the principle wins.
1. **People before posts.** Every screen leads to a person, community, event or exchange.
2. **Consent before visibility.** Fields, discovery and location precision are controlled by the user, per field, private by default.
3. **Explainable matching.** Every recommendation shows a specific reason. If the system cannot write one, it does not show the match.
4. **Custodian first.** Practitioners and communities control what they share, how it is credited and whether it can be reused. Reuse and model training are off by default.
5. **Honest data.** Seeded content carries a visible demo badge. Events show a source link and a verification label. No invented footfall, ratings or endangerment claims.
6. **Small, repeatable interactions.** Locket and reminders are low-frequency and opt-in.

---

## 6. How ShareSpot differs from a generic event app

| Generic Event App | ShareSpot |
| :--- | :--- |
| Ranks events by keyword and location | Starts from a community and its cultural entities (language, tradition, skill, region) |
| "You both like music" | Rarity-weighted matches with a "because" sentence; weak matches are rejected |
| People are interchangeable attendees | People have roles: custodian, practitioner, seeker, curious |
| Chat or comments | Request to connect, then a Telegram join link with admin approval |
| Engagement is the metric | Connections, participation and knowledge exchange are the metrics |
| No cultural context | Cultural cards with context, source and attribution |

*Five signature elements: cultural knowledge layer, communities as the anchor, meaningful-match engine, Culture Locket (stretch), consent-based joining.*

---

## 7. User flows

### 7.1 Participant flow
1. **Welcome:** Value statement, then "Get started" or a clearly labelled demo entry.
2. **Onboarding:** Pick interest categories and cultural sub-interests (language, art form, festival, craft); say what you can teach or want to learn; choose online, in person or either; optionally add a broad region; set visibility per field.
3. **Cultural card:** A card for a chosen tradition with image, context, source and credit, linking to related communities.
4. **Match engine:** Scores communities, events and people; shows a match only if it can write a specific reason.
5. **Home feed:** Coming up from your communities, picked for you, find your people, explore something new.
6. **Path A, community:** Read why it was suggested, tap the invite link, join after admin approval.
7. **Path B, event:** Open detail, check the verification label, follow the source link, save it.
8. **Path C, person (should):** View only the fields they chose to share, send a connection request; contact details appear after acceptance.
9. **Keep it alive (stretch):** Send a private Locket card; the recipient reacts or replies; the sender can delete it.
10. **Feedback:** Mark a recommendation relevant, not for me, or already known; the next ranking changes.

*The match engine sits before the home feed, so anything it cannot explain is never shown.*

### 7.2 Organiser flow
1. Sign in as an organiser and create a community: name, description, entities, region, visibility.
2. Create the Telegram group and paste its invite link (single-use, expiring, approval-based).
3. Post events with a source link, or add community keywords so the scheduled job imports matching events.
4. Approve join requests and vouch for members to give them verified status.
5. Review activity (real joins, events, feedback counts). There is no popularity ranking.

### 7.3 Safety flow
Anyone can report or block a person, event, community or Locket card. Reports go to a queue where the team can hide the item or correct its label.

---

## 8. Screens and information architecture
Six primary pages, a profile menu and two onboarding screens. Mobile: compact top bar and bottom navigation. Desktop: left navigation, centre feed, right rail.

| Screen | Purpose | Key Content | Priority |
| :--- | :--- | :--- | :--- |
| **Welcome** | State value, start | Hero headline, Get started, labelled demo entry | Must |
| **Onboarding** | Interests and privacy | Interest chips, cultural sub-interests, per-field visibility, mode, broad region | Must |
| **Home** | Personalised discovery | Coming up from your communities, Picked for you, Find your people, Explore something new | Must |
| **Events** | Searchable directory | Filters (keyword, category, date, region, online or in person), cards, detail with source link and verification label | Must |
| **Communities** | The anchor | Cards with a "why this community" reason, real in-app member count, join link, linked events | Must |
| **Saved** | Bookmarks | Saved events and communities | Must |
| **Profile and privacy** | Control | Edit profile and interests, discovery toggle, per-field visibility, block and report | Must |
| **Cultural card** | Preservation | Word, phrase or tradition with image, context, attribution, source | Must (one flow) |
| **Find People** | Opt-in profiles | Shared-interest reason, roles, View, Request to connect, Dismiss | Should |
| **Culture Locket** | Keep a connection alive | Send, react, reply, delete a private card | Stretch |

- **Event card contents:** Image or category placeholder, title, category, date and time, venue or online status, broad location, organiser, source link, verification label, save action. Show an interest count only when it comes from real in-app actions.

---

## 9. Functional requirements
*(M = must, S = should, X = stretch)*

| ID | Requirement | Priority |
| :--- | :--- | :--- |
| **F1** | Email sign-in, or a clearly labelled demo session | M |
| **F2** | Select and later edit interests, including cultural sub-interests | M |
| **F3** | Per-field visibility and a discovery on/off switch; no ethnicity, religion, caste or exact location required | M |
| **F4** | Cultural cards (image, context, source, attribution) for each supported tradition | M |
| **F5** | Related-interest suggestions from embeddings, shown only with labelled evidence | S |
| **F6** | Community cards with entities and a "why" reason | M |
| **F7** | Organiser creates a community and adds a Telegram invite link; join is single-use, expiring, approval-based | S |
| **F8** | Verified status for a person in a community (organiser vouching) | S |
| **F9** | Event list, detail, search, filters (category, date, region, mode), save | M |
| **F10** | Source link, retrieval time and verification label on every event | M |
| **F11** | Events linked to communities; imported events refreshed on a schedule | S |
| **F12** | Organiser event submission form | S |
| **F13** | Map view with public event pins and a list fallback | S |
| **F14** | Opt-in profiles with roles and a match reason | S |
| **F15** | Request to connect; contact details revealed only after acceptance | S |
| **F16** | Culture Locket: send one card to one connection, react or reply, sender can delete | X |
| **F17** | Mark a recommendation relevant, not for me or already known; feedback adjusts later ranking | S |
| **F18** | Report, block and mute controls | S |
| **F19** | Visible "demo data" badge on every seeded record | M |

---

## 10. Matching and ranking logic
A transparent weighted score with two safeguards: rarity weighting and the "because" rule. All weights are starting heuristics, not validated values. Normalise each factor to 0 to 1 and renormalise the weights when a factor is missing.

- **Rarity weight:** For an entity held by $n$ users out of $N$:
  $$w = \ln\left(\frac{N}{1 + n}\right)$$
  With $N = 200$, a shared "Music" interest held by 90 users weighs about 0.79, while a shared art form held by 5 users weighs about 3.5.

- **People score:**
  $$S_{\text{person}} = 0.30 \cdot O + 0.25 \cdot C + 0.20 \cdot L + 0.15 \cdot M + 0.10 \cdot G$$
  where:
  - $O$ = rarity-weighted interest overlap
  - $C$ = intent complementarity (a willing teacher and a learner)
  - $L$ = language fit
  - $M$ = participation mode fit
  - $G$ = opted-in location fit

- **Event score:**
  $$S_{\text{event}} = 0.35 \cdot I + 0.25 \cdot K + 0.20 \cdot D + 0.10 \cdot M + 0.10 \cdot G$$
  where:
  - $I$ = user interest match
  - $K$ = match to a community the user belongs to or follows
  - $D$ = date relevance
  - $M$ = mode fit
  - $G$ = location fit
  *(Add a small capped bonus for organiser-posted or verified events)*

- **The "because" rule:** A recommendation is shown only if it has at least one evidence item: a shared entity above a rarity threshold, a complementary role pair (can teach and wants to learn), or a membership or event link to a community the user follows. Reason sentences come from templates filled with real data (for example, *"You both want to practise Tulu"*). A language model never invents people, events or cultural facts.

- **Rejected-match demo:** Seed two users who share only a common interest. They fall below the threshold and the system declines to recommend them, shown on stage.

- **Embeddings (should):** Sentence embeddings only suggest related interests, and a suggestion appears only if a labelled link supports it (same region, theme or language).

- **Feedback loop:** "Not for me" lowers that entity's weight for that user by 30 percent, "relevant" raises it by 10 percent, "already know this" hides the card without penalty.

*Never rank on sensitive traits, popularity or inferred identity.*

---

## 11. Data and integrations
The demo must run with no external API. Every live source sits behind an adapter and a seeded fallback.

| Source | Used for | Caveat |
| :--- | :--- | :--- |
| **DRISHTIKON (Hugging Face)** | Cultural cards, themes, regions, images | A benchmark of questions and images, not a knowledge base. Check Tulu and Yakshagana coverage and the licence in the first 2 hours |
| **Wikidata** | Festival and tradition entities, typical dates | Context layer; link to official sites for current-year details |
| **UNESCO heritage and endangered-language lists** | Heritage context | Claim endangerment only with a cited source |
| **Meetup GraphQL API** | Community groups and events | Access rules are changing: test in hour 1, drop if it fails |
| **Ticketmaster Discovery API** | Festivals, music, arts events | Ticketed entertainment, not grassroots events |
| **Curated CSV and organiser form** | Guaranteed layer for niche communities | Each real event needs a hand-checked source URL |
| **OpenStreetMap (Nominatim, Overpass)** | Geocoding, public venues | Public venues only |
| **Synthetic personas** | 100 to 200 demo users, 5 or 6 hand-written | Include a superficial-match trap and a lone custodian |

- **Event update flow:** Each community stores keywords and a region. A scheduled job queries each adapter per community, never per user. Results are upserted by source URL plus start time. Past events and events with disappeared source links are hidden. Every run updates the "last checked" timestamp. Events are ranked per user inside the database.
- **Verification labels:** `Verified` (team checked the official page), `Organiser-submitted`, `Imported unverified` (with source link), `Demo data` (always badged).
- **Integrity:** Social posts are leads, not proof. Do not build on scraping LinkedIn, X or private groups.

---

## 12. Data model
Supabase (PostgreSQL) with row-level security. Store only what a feature needs.

| Table | Key fields |
| :--- | :--- |
| `users` | id, display_name, bio, discoverable, broad_region, privacy_settings |
| `entities` | id, type (language, tradition, skill, art form, festival), name, region, source, embedding |
| `entity_stats` | entity_id, user_count (for rarity weight) |
| `user_entities` | user_id, entity_id, relation (speaks, learning, practises, wants_to_learn, can_teach, interested_in) |
| `communities` | id, name, description, region, visibility, organiser_id, telegram_invite_url, invite_expires_at |
| `community_entities` | community_id, entity_id |
| `memberships` | user_id, community_id, status, verified_by |
| `events` | id, title, description, category, start_time, end_time, venue_name, broad_region, online_url, image_url, organiser, source_url, retrieved_at, verification_status, demo_data, community_id |
| `saved_items` | user_id, target_type, target_id, created_at |
| `connection_requests` | sender_id, recipient_id, status, created_at |
| `cultural_cards` | id, entity_id, title, body, image_url, source, attribution, reuse_permission |
| `locket_moments` | id, sender_id, recipient_id, content_type, content, attribution, created_at, expires_at |
| `locket_responses` | moment_id, responder_id, response_type, response_text, created_at |
| `feedback` | user_id, target_type, target_id, feedback_type, created_at |
| `reports` | reporter_id, target_type, target_id, reason, status, created_at |

- **Access rules (RLS):** Users edit only their own rows; connection details are readable only after acceptance; Locket moments are readable only by sender and recipient; undiscoverable users never appear in queries for other users. Every seeded row carries `demo_data = true`.

---

## 13. Privacy, safety and cultural respect

### Privacy
- Profiles are private by default; discovery is opt-in with per-field visibility.
- No precise or live location. Users appear at most as a broad region; only public venues are pinned.
- Third-party APIs receive community keywords only, never user data.
- A trait is surfaced in a region only when at least $k$ people share it, so small groups cannot be singled out.
- Contact details are revealed only after a connection is accepted.
- Users self-declare culture and identity. The system never infers ethnicity, religion, caste or affiliation.
- No government IDs, exact addresses or other sensitive details are stored.

### Safety
- Report, block, mute and delete on people, events, communities and Locket cards.
- Telegram invite links are single-use, expiring and approval-based; a phone number is shared only when the user chooses to join.
- Validate all input and escape user-generated text. Never imply someone attends an event unless they said so.

### Cultural respect
- Custodians control visibility, attribution and reuse; reuse and model training are off by default.
- Credit sources on every cultural card and provide a correction and report path.
- Do not publish restricted or sacred knowledge without permission. Avoid stereotypes in copy and imagery.
- Make no claim that a language or tradition is endangered without a reliable cited source.

*Roadmap, not MVP:* On-device profile storage and private set intersection for matching without revealing full profiles.

---

## 14. Architecture, stack and design

| Layer | Choice | Notes |
| :--- | :--- | :--- |
| **Frontend** | Next.js, TypeScript, Tailwind CSS | Responsive; deploy on Vercel |
| **Backend, auth, storage** | Supabase (Postgres, Auth, Storage) | RLS enforces who reads what |
| **Vector search** | pgvector | Related-interest suggestions only |
| **Data prep** | Python and pandas scripts | Offline: DRISHTIKON, Wikidata, seeding, embeddings |
| **Event ingestion** | Scheduled job, one adapter per source | Server-side; API keys never reach the browser |
| **Maps** | Leaflet with OpenStreetMap tiles | List view required as accessible alternative |
| **Joining** | Telegram invite links | No direct add exists, so joining is consent-based |

*External APIs and datasets never touch users directly. Scheduled and offline jobs write into Postgres and the app reads from it, so the demo still works when an API is down.*

### Design system (Modern Terracotta)
- **Palette:**
  - Cream: `#FCF7F0` (canvas)
  - Blush: `#E9CDB8` (panels)
  - Terra: `#C56E50` (primary actions)
  - Cocoa: `#5B332C` (text)
  - Ochre: `#D9A441` (sparing highlights)
- **Type:** Playfair Display for hero and editorial titles, DM Sans for everything else. No other typefaces.
- **Cards:** 12 to 18 px corners, gentle borders, restrained shadows. Authentic event photography; avoid cultural stereotypes.
- **Contrast:** Terra on Cream is roughly 3.4:1, which fails for small text. Use it for large text, icons and fills; darken it for small button labels; verify every pairing with a contrast checker.
- **Interactions:** Visible focus, hover and selected states, keyboard navigation, and loading, empty, success and error states for every major action.

---

## 15. MVP scope
- **Must have:** Welcome or demo entry; interest onboarding with per-field privacy; home feed; communities with join links; event list, detail, filters and save; rarity-weighted matching with "because" reasons and one rejected match; one cultural card flow; profile edit; demo badges; working deployment with seed data.
- **Should have:** Find People with roles; connection requests; organiser event form; map with list fallback; feedback buttons; report and block; a small graph view of why a match was made.
- **Stretch:** Working Culture Locket, in-app chat, live Meetup ingestion, push notifications.

*Scope is locked by hour 4 and frozen at hour 28. The last 8 hours are for user testing, the demo and fixes, not new features.*

---

## 16. Team ownership (proposed for 4 people)

| Owner | Workstreams |
| :--- | :--- |
| **Person 1: frontend and design** | Design tokens, welcome, onboarding, profile and privacy, cultural card page, demo slides |
| **Person 2: product pages** | Home feed, communities, events list and filters, event detail, Saved, map and list fallback if time allows |
| **Person 3: backend and data** | Schema, auth, RLS, demo session, seed script, deployment, Telegram link fields, testing |
| **Person 4: matching and content** | Matching function, rejected-match case, feedback loop, cultural card content, and 10 to 15 curated real communities and events with source URLs |

*Person 4's curated data feeds Person 3's seed script, so agree on one seed format on day one.*

---

## 17. 36-hour plan

| Hours | Focus |
| :--- | :--- |
| **0 to 1** | Lock decisions, create repo, Supabase project and Vercel deploy of an empty Next.js page; test one Meetup query |
| **1 to 4** | Schema and auth, design tokens, layout shell, start the curated list; check DRISHTIKON coverage and licence; lock scope at hour 4 |
| **4 to 10** | Seed script and demo data, onboarding, card components on dummy data, matching function v1 |
| **10 to 20** | Wire pages to real data: home feed, communities, events, detail, save; cultural card flow; rejected-match case |
| **20 to 28** | Feedback loop, profile edit, privacy controls, report and block, should-haves in priority order; freeze features at hour 28 |
| **28 to 36** | User test with 5 to 8 classmates, record metrics, fix bugs, cache outputs, rehearse the demo, sleep in shifts |

- **Checkpoint:** By the end of the first working slot, a user can log in on the deployed URL and see seeded communities.
- **Working rules:** One branch per person, small PRs, merge to main at least hourly, never push a change that breaks the live URL.

---

## 18. Acceptance criteria
The MVP is done when a judge can complete the full journey on the deployed app without developer help.
1. A user signs in, or enters a clearly labelled demo session.
2. A user selects interests, including cultural sub-interests, edits them later, and chooses which fields are discoverable.
3. The home page shows at least three recommendations, each with a specific "because" reason.
4. One superficial match is visibly rejected in the demo.
5. A user opens a cultural card showing context, source and attribution.
6. A user finds a community, sees why it was suggested, and opens its join link.
7. A user filters events by category, date, broad region and online or in person, opens an event, and follows its source link.
8. Every event shows a verification label and a source or demo badge.
9. A user saves an event and sees it on the Saved page after a refresh.
10. A user sends a connection request to an opted-in person and sees why they matched.
11. A user marks a recommendation "not for me" and the next ranking changes.
12. A user can report or block another user and turn discovery off.
13. No precise location and no contact detail is shown by default.
14. Seeded content is badged "demo data" everywhere it appears.
15. The layout works on desktop and mobile with readable contrast and keyboard focus.
16. *Stretch:* A Locket card can be sent, answered and deleted.

---

## 19. Demo script (3 to 4 minutes)

| Time | Beat | What the judge sees |
| :--- | :--- | :--- |
| **0:00** | Problem | A student far from home, interested in Yakshagana and Tulu culture, with no idea who shares that interest |
| **0:20** | Onboarding | Interests and privacy settings; a cultural card with context and source |
| **0:50** | Meaningful match | A community and a person with a "because" sentence; a second pair rejected as superficial |
| **1:30** | Events | A community's events in list (and map if built), each with source link and verification label |
| **2:00** | Join | The Telegram join link and connection request flow, with privacy explained |
| **2:25** | Culture Locket | Send and reply, or a pre-seeded exchange if not built |
| **2:55** | Feedback | Mark a recommendation "not for me" and watch the ranking change |
| **3:15** | Impact | Real metrics from the classmate test, then the roadmap slide |

> **Pitch line:** *The Lost Connection does not just help people discover culture. It helps them build relationships that keep culture alive.*

*Cache any model outputs beforehand so nothing flakes on stage.*

---

## 20. Risks and mitigations

| Risk | Mitigation |
| :--- | :--- |
| **Scope too large for 36 hours** | Lock scope at hour 4, freeze at hour 28, treat Locket and chat as stretch |
| **Meetup access fails or is restricted** | Test in hour 1; fall back to Ticketmaster plus curated and organiser events |
| **Few API events for niche coastal Karnataka communities** | Curate 10 to 15 real communities and events by hand with source links; label the rest demo data |
| **DRISHTIKON has thin Tulu or Yakshagana coverage, or licence limits** | Check in the first 2 hours; supplement with Wikidata and hand-written cards; say so honestly |
| **Looks like a generic event app** | Lead with communities, cultural cards, the "because" rule and the rejected match |
| **Embeddings produce superficial links** | Show a link only with labelled evidence |
| **Judges question verification** | Use organiser vouching and show the label in the UI |
| **Terra colour fails contrast at small sizes** | Large text, icons and fills only; darken for small labels; verify with a checker |
| **Fake or outdated events** | Source link, retrieval time and verification label on every event; report flow |
| **Cultural misuse or exposure of private knowledge** | Custodian controls, attribution, reuse off by default, no restricted knowledge published |
| **Live demo failure** | Cache API results and seeded fallbacks so the journey works without external APIs |

---

## 21. Decisions

| Decision | Status |
| :--- | :--- |
| **App name** | ShareSpot, with the Lost Connection tagline |
| **Stack** | Next.js with Supabase |
| **Region** | Coastal Karnataka; list of 10 to 15 communities and events still to be curated |
| **Verification model** | Organiser vouching |
| **Locket scope** | Seeded demo only; working flow is stretch |
| **Owners** | Proposed split in section 16; confirm with the team |
