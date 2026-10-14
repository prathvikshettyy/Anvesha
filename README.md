# ShareSpot: The Lost Connection

> **Find your people. Keep your culture in motion.**

ShareSpot is a culture-first discovery web app that connects people to the communities, events and people they have a real reason to belong to. Every recommendation comes with a specific "because" reason, and weak matches are rejected instead of shown.

Built for a 36-hour hackathon by a team of 4. MVP region: coastal Karnataka (Tulu culture, Yakshagana, local art, festivals, crafts).

---

## Contents
1. [Overview and demo story](#1-overview-and-demo-story)
2. [Goals and success metrics](#2-goals-and-success-metrics)
3. [Users and principles](#3-users-and-principles)
4. [Features and scope](#4-features-and-scope)
5. [User flows and screens](#5-user-flows-and-screens)
6. [Matching and ranking logic](#6-matching-and-ranking-logic)
7. [Data sources and verification](#7-data-sources-and-verification)
8. [Data model](#8-data-model)
9. [Privacy, safety and cultural respect](#9-privacy-safety-and-cultural-respect)
10. [Tech stack and design system](#10-tech-stack-and-design-system)
11. [Getting started](#11-getting-started)
12. [Project structure](#12-project-structure)
13. [Team ownership and 36-hour plan](#13-team-ownership-and-36-hour-plan)
14. [Building with Google Antigravity](#14-building-with-google-antigravity)
15. [Acceptance criteria](#15-acceptance-criteria)
16. [Demo script](#16-demo-script)
17. [Risks and mitigations](#17-risks-and-mitigations)
18. [Decisions, roadmap and credits](#18-decisions-roadmap-and-credits)
19. [Repository Guidelines (Hackathon / Bug Bounty)](#19-repository-guidelines-hackathon--bug-bounty)

---

## 1. Overview and demo story
- **Core chain:** cultural knowledge &rarr; personal interests &rarr; real communities &rarr; participation &rarr; preservation.
- **Demo story:** A student far from home, interested in Yakshagana and Tulu culture, has no idea who shares that interest. ShareSpot shows a community, an event and a person, each with a "because" reason, and visibly rejects one superficial match.
- **MVP shape:** One region, a small set of cultural traditions, 10 to 15 hand-curated real communities and events with source links, and synthetic users clearly labelled as demo data.

### Generic Event App vs. ShareSpot

| Generic Event App | ShareSpot |
| :--- | :--- |
| Ranks events by keyword and location | Starts from a community and its cultural entities (language, tradition, skill, region) |
| "You both like music" | Rarity-weighted matches with a "because" sentence; weak matches are rejected |
| People are interchangeable attendees | People have roles: custodian, practitioner, seeker, curious |
| Chat or comments | Request to connect, then a Telegram join link with admin approval |
| Engagement is the metric | Connections, participation and knowledge exchange are the metrics |
| No cultural context | Cultural cards with context, source and attribution |

---

## 2. Goals and success metrics

### Goals
- Help a user find a community, an event and a person, each with a specific, explainable reason to care.
- Separate meaningful matches from superficial similarity, and show that in the demo.
- Move users from discovery to participation (join, attend, connect), then to preservation (credit and keep cultural knowledge).
- Protect privacy by default: no precise location, no inferred identity.

### Metrics (measured on 5 to 8 classmates; report real numbers, even if small)

| Metric | Definition |
| :--- | :--- |
| **Recommendation relevance** | Recommendations marked relevant / recommendations shown |
| **Participation intent** | Events saved or marked interested / events viewed |
| **Community joins** | Join-link taps / community cards viewed |
| **Connection conversion** | Requests accepted / requests sent |
| **Data quality** | Displayed events with a working source link and verification label / all displayed events |
| **Locket response (stretch)** | Cards that get a reply / cards sent |

*Sign-ups, scroll time and post counts are not success measures.*

---

## 3. Users and principles

### Personas

| Persona | Wants | Safe Next Step |
| :--- | :--- | :--- |
| **Culture seeker** | To explore a tradition and find who practises it | Open a cultural card, join a community or save an event |
| **Person living away from home** | To keep a link to a hometown, language or tradition | Find a language partner, send a Locket word |
| **Knowledge keeper** | To share on their own terms and be credited | Mark "can teach", set attribution and reuse permissions |
| **Language learner** | Conversation partners and practice circles | Request to connect with an opted-in speaker |
| **Community organiser** | To reach the right people and run events | Create a community, post an event, add a join link |

### Six Principles (when a feature conflicts with one, the principle wins)
1. **People before posts.** Every screen leads to a person, community, event or exchange.
2. **Consent before visibility.** Per-field control, private by default.
3. **Explainable matching.** No specific reason, no match shown.
4. **Custodian first.** Practitioners control credit and reuse; reuse and model training are off by default.
5. **Honest data.** Demo badges, source links and verification labels. No invented footfall, ratings or endangerment claims.
6. **Small, repeatable interactions.** Low-frequency, opt-in reminders and Locket. No public like counts or streaks.

---

## 4. Features and scope

- **Must have:** welcome or demo entry; interest onboarding with per-field privacy; home feed; communities with join links; event list, detail, filters and save; rarity-weighted matching with "because" reasons and one rejected match; one cultural card flow; profile edit; demo badges; working deployment with seed data.
- **Should have:** Find People with roles; connection requests; organiser event form; map with list fallback; feedback buttons; report and block; small graph view of why a match was made.
- **Stretch:** Culture Locket, in-app chat, live Meetup ingestion, push notifications.
- **Out of the MVP:** scraping social platforms, live location, payments, unmoderated public messaging, claims of automated cultural verification.

*Scope is locked by hour 4 and frozen at hour 28.*

| ID | Requirement | Priority |
| :--- | :--- | :--- |
| **F1** | Email sign-in, or a clearly labelled demo session | M |
| **F2** | Select and edit interests, including cultural sub-interests | M |
| **F3** | Per-field visibility and discovery switch; no ethnicity, religion, caste or exact location required | M |
| **F4** | Cultural cards (image, context, source, attribution) | M |
| **F5** | Related-interest suggestions from embeddings, only with labelled evidence | S |
| **F6** | Community cards with entities and a "why" reason | M |
| **F7** | Organiser creates a community with a Telegram invite link (single-use, expiring, approval-based) | S |
| **F8** | Verified status in a community via organiser vouching | S |
| **F9** | Event list, detail, search, filters, save | M |
| **F10** | Source link, retrieval time and verification label on every event | M |
| **F11** | Events linked to communities; imported events refreshed on a schedule | S |
| **F12** | Organiser event submission form | S |
| **F13** | Map view with public event pins and a list fallback | S |
| **F14** | Opt-in profiles with roles and a match reason | S |
| **F15** | Request to connect; contact details only after acceptance | S |
| **F16** | Culture Locket: send, react or reply, sender can delete | X |
| **F17** | Feedback: relevant, not for me, already known; adjusts ranking | S |
| **F18** | Report, block and mute | S |
| **F19** | "Demo data" badge on every seeded record | M |

*(M = must, S = should, X = stretch)*

---

## 5. User flows and screens

### Participant flow
1. **Welcome:** Value statement, then "Get started" or the labelled demo entry.
2. **Onboarding:** Interest categories and cultural sub-interests; teach or learn intent; online, in person or either; optional broad region; per-field visibility.
3. **Cultural card:** Image, context, source and credit, linking to related communities.
4. **Match engine:** Scores communities, events and people; shows a match only with a specific reason.
5. **Home feed:** Coming up from your communities, picked for you, find your people, explore something new.
6. **Path A, community:** Read why it was suggested, tap the invite link, join after admin approval.
7. **Path B, event:** Open detail, check the verification label, follow the source link, save.
8. **Path C, person (should):** View only shared fields, send a connection request.
9. **Keep it alive (stretch):** Private Locket card to one connection.
10. **Feedback:** Relevant, not for me, or already known; the next ranking changes.

### Organiser flow
Create a community, paste a Telegram invite link, post events with a source link, approve join requests and vouch for members, review real activity (no popularity ranking).

### Safety flow
Anyone can report or block a person, event, community or Locket card; reports go to a queue where the team can hide the item or correct its label.

### Screens and Information Architecture

| Screen | Purpose | Priority |
| :--- | :--- | :--- |
| **Welcome** | State value, start, labelled demo entry | Must |
| **Onboarding** | Interests, privacy, mode, broad region | Must |
| **Home** | Personalised discovery | Must |
| **Events** | Filters (keyword, category, date, region, mode), cards, detail | Must |
| **Communities** | Cards with "why this community", join link, linked events | Must |
| **Saved** | Saved events and communities | Must |
| **Profile and privacy** | Edit profile and interests, discovery toggle, block and report | Must |
| **Cultural card** | Context, source, attribution | Must (one flow) |
| **Find People** | Opt-in profiles, roles, connection request | Should |
| **Culture Locket** | Private card exchange | Stretch |

- **Event card:** Image or category placeholder, title, category, date and time, venue or online status, broad location, organiser, source link, verification label, save action. Show an interest count only when it comes from real in-app actions.
- **Layout:** On mobile use a compact top bar and bottom navigation. On desktop use a left navigation, centre feed and right rail.

---

## 6. Matching and ranking logic
A transparent weighted score with two safeguards: rarity weighting and the "because" rule. All weights are starting heuristics, not validated values. Normalise each factor to 0 to 1 and renormalise weights when a factor is missing.

- **Rarity weight:**  
  $$w = \ln\left(\frac{N}{1 + n}\right)$$  
  where $n$ of $N$ users hold an entity. With $N = 200$, a shared "Music" interest held by 90 users weighs about 0.79; a shared art form held by 5 users weighs about 3.5.

- **People score:**  
  $$S_{\text{person}} = 0.30 \cdot O + 0.25 \cdot C + 0.20 \cdot L + 0.15 \cdot M + 0.10 \cdot G$$  
  $O$ = rarity-weighted interest overlap, $C$ = intent complementarity (teacher and learner), $L$ = language fit, $M$ = mode fit, $G$ = opted-in location fit.

- **Event score:**  
  $$S_{\text{event}} = 0.35 \cdot I + 0.25 \cdot K + 0.20 \cdot D + 0.10 \cdot M + 0.10 \cdot G$$  
  $I$ = user interest match, $K$ = link to a community the user follows, $D$ = date relevance, $M$ = mode fit, $G$ = location fit. Add a small capped bonus for organiser-posted or verified events.

- **The "because" rule:** A recommendation is shown only if it has at least one evidence item: a shared entity above a rarity threshold, a complementary role pair, or a membership or event link to a community the user follows. Reason sentences come from templates filled with real data (for example, *"You both want to practise Tulu"*). A language model never invents people, events or cultural facts.

- **Rejected-match demo:** Seed two users who share only a common interest. They fall below the threshold and are shown as rejected.

- **Embeddings (should):** Only suggest related interests, and only with a labelled link (same region, theme or language).

- **Feedback loop:** "not for me" lowers that entity's weight for that user by 30 percent, "relevant" raises it by 10 percent, "already know this" hides the card without penalty.

- **Guardrails:** Never rank on sensitive traits, popularity or inferred identity.

---

## 7. Data sources and verification
The demo must run with no external API. Every live source sits behind an adapter and a seeded fallback.

| Source | Used for | Caveat |
| :--- | :--- | :--- |
| **DRISHTIKON (Hugging Face)** | Cultural cards, themes, regions, images | A benchmark of questions and images, not a knowledge base. Check Tulu and Yakshagana coverage and licence in the first 2 hours |
| **Wikidata** | Festival and tradition entities, typical dates | Context layer; link to official sites for current dates |
| **UNESCO lists** | Heritage context | Claim endangerment only with a cited source |
| **Meetup GraphQL API** | Community groups and events | Access rules are changing: test in hour 1, drop if it fails |
| **Ticketmaster Discovery API** | Festivals, music, arts | Ticketed entertainment, not grassroots events |
| **Curated CSV and organiser form** | Guaranteed layer for niche communities | Each real event needs a hand-checked source URL |
| **OpenStreetMap** | Geocoding, public venues | Public venues only |
| **Synthetic personas** | 100 to 200 demo users, 5 or 6 hand-written | Include a superficial-match trap and a lone custodian |

- **Event update flow:** Each community stores keywords and a region. A scheduled job queries each adapter per community, never per user. Results are upserted by source URL plus start time. Past events and events with disappeared source links are hidden. Every run updates the "last checked" time.
- **Verification labels:** `Verified` (team checked the official page), `Organiser-submitted`, `Imported unverified` (with source link), `Demo data` (always badged).
- **Integrity:** Social posts are leads, not proof. Do not build on scraping LinkedIn, X or private groups.

---

## 8. Data model
Supabase (PostgreSQL) with row-level security.

| Table | Key fields |
| :--- | :--- |
| `users` | id, display_name, bio, discoverable, broad_region, privacy_settings |
| `entities` | id, type (language, tradition, skill, art_form, festival), name, region, source, embedding |
| `entity_stats` | entity_id, user_count (for rarity weight) |
| `user_entities` | user_id, entity_id, relation (speaks, learning, practises, wants_to_learn, can_teach, interested_in) |
| `communities` | id, name, description, region, visibility, organiser_id, telegram_invite_url, invite_expires_at |
| `community_entities` | community_id, entity_id |
| `memberships` | user_id, community_id, status, verified_by |
| `events` | id, title, description, category, start_time, end_time, venue_name, broad_region, online_url, image_url, organiser, source_url, retrieved_at, verification_status, demo_data, community_id |
| `saved_items` | user_id, target_type, target_id, created_at |
| `connection_requests` | sender_id, recipient_id, status, created_at |
| `cultural_cards` | id, entity_id, title, body, image_url, source, attribution, reuse_permission |
| `locket_moments`, `locket_responses` | Stretch: private cards and replies |
| `feedback` | user_id, target_type, target_id, feedback_type, created_at |
| `reports` | reporter_id, target_type, target_id, reason, status, created_at |

- **RLS rules:** Users edit only their own rows; connection details are readable only after acceptance; Locket moments are readable only by sender and recipient; undiscoverable users never appear in other users' queries. Every seeded row has `demo_data = true`.

---

## 9. Privacy, safety and cultural respect

### Privacy
- Profiles are private by default; discovery is opt-in with per-field visibility.
- No precise or live location. Broad region only; only public venues are pinned.
- Third-party APIs receive community keywords only, never user data.
- A trait is surfaced in a region only when at least $k$ people share it.
- Contact details are revealed only after a connection is accepted.
- Users self-declare culture and identity. The system never infers ethnicity, religion, caste or affiliation.
- No government IDs, exact addresses or other sensitive details are stored.

### Safety
- Report, block, mute and delete on people, events, communities and Locket cards.
- Telegram invite links are single-use, expiring and approval-based.
- Validate all input and escape user-generated text. Never imply someone attends an event unless they said so.

### Cultural respect
- Custodians control visibility, attribution and reuse.
- Credit sources on every cultural card and provide a correction and report path.
- Do not publish restricted or sacred knowledge without permission. Avoid stereotypes in copy and imagery.
- Make no claim that a language or tradition is endangered without a reliable cited source.

---

## 10. Tech stack and design system

| Layer | Choice |
| :--- | :--- |
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS |
| **Backend, auth, storage** | Supabase (Postgres, Auth, RLS) |
| **Hosting** | Vercel |
| **Vector search (should)** | pgvector, for related-interest suggestions only |
| **Data prep** | Python and pandas, offline only |
| **Event ingestion** | Scheduled job, one adapter per source, server-side |
| **Maps (should)** | Leaflet with OpenStreetMap tiles, with a list fallback |
| **Joining** | Telegram invite links |

*External APIs and datasets never touch users directly: scheduled and offline jobs write into Postgres and the app reads from it, so the demo works when an API is down.*

### Design system (Modern Terracotta)
- **Palette:**
  - Cream (canvas): `#FCF7F0`
  - Blush (panels): `#E9CDB8`
  - Terra (primary actions): `#C56E50`
  - Cocoa (text): `#5B332C`
  - Ochre (sparing highlights): `#D9A441`
- **Fonts:** Playfair Display for hero and editorial titles, DM Sans for everything else. No other typefaces.
- **Cards:** 12 to 18 px corners, gentle borders, restrained shadows. Authentic photography; avoid cultural stereotypes.
- **Accessibility:** Terra on Cream is roughly 3.4:1, which fails for small text. Use it for large text, icons and fills; darken it for small button labels; verify every pairing with a contrast checker.
- **States:** Visible focus, hover and selected states, keyboard navigation, and loading, empty, success and error states for every major action.

---

## 11. Getting started

### Prerequisites
Node.js 18 or newer, a Supabase project, a Vercel account.

```bash
git clone <repo-url>
cd sharespot
npm install
cp .env.example .env.local
```

### Fill in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
# Server-side only. Never expose to the browser.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Create the database by running `supabase/schema.sql` in the Supabase SQL editor, then seed demo data and start the app:
```bash
npm run seed
npm run dev
```
Open `http://localhost:3000`.

- **Seed file:** `data/seed.json` has four arrays: entities, communities, events and users. Every seeded row must have `demo_data: true`, except hand-checked real communities and events, which carry a source URL and a verification label.

---

## 12. Project structure

```
sharespot/
├── GEMINI.md          # Always-on rules for Antigravity (see section 14)
├── app/               # Next.js pages and routes
├── components/        # Event card, community card, nav, badges
├── lib/
│   ├── supabase/      # Supabase client helpers
│   └── matching/      # Rarity weights, scores, "because" templates
├── data/              # seed.json and curated community and event list
├── scripts/           # Offline Python data prep and seeding
├── supabase/          # schema.sql and RLS policies
└── docs/              # PRD and demo script
```

---

## 13. Team ownership and 36-hour plan

| Owner | Workstreams |
| :--- | :--- |
| **Person 1: frontend and design** | Design tokens, welcome, onboarding, profile and privacy, cultural card page, demo slides |
| **Person 2: product pages** | Home feed, communities, events list and filters, event detail, Saved, map with list fallback if time allows |
| **Person 3: backend and data** | Schema, auth, RLS, demo session, seed script, deployment, testing |
| **Person 4: matching and content** | Matching function, rejected-match case, feedback loop, cultural card content, 10 to 15 curated real communities and events with source URLs |

*Person 4's curated data feeds Person 3's seed script, so agree on one seed format on day one.*

| Hours | Focus |
| :--- | :--- |
| **0 to 1** | Lock decisions; create repo, Supabase project and Vercel deploy of an empty page; test one Meetup query |
| **1 to 4** | Schema and auth, design tokens, layout shell, start curated list, check DRISHTIKON coverage and licence; lock scope at hour 4 |
| **4 to 10** | Seed script and demo data, onboarding, card components on dummy data, matching v1 |
| **10 to 20** | Wire pages to real data; cultural card flow; rejected-match case |
| **20 to 28** | Feedback loop, profile edit, privacy controls, report and block, should-haves in priority order; freeze features at hour 28 |
| **28 to 36** | Test with 5 to 8 classmates, record metrics, fix bugs, cache outputs, rehearse, sleep in shifts |

- **Checkpoint:** By the end of the first working slot, a user can log in on the deployed URL and see seeded communities.
- **Working rules:** One branch per person, small PRs, merge to main at least hourly, never push a change that breaks the live URL.

---

## 14. Building with Google Antigravity
Antigravity works best with small, bounded tasks, so use three pieces: an always-on rules file, one planning prompt, then one short prompt per task. Rule and workflow folder names differ between versions (`.agent/rules/` or `.agents/rules/`), so check the Rules tab in your install. Do not add that folder to `.gitignore`.

### 14.1 Rules file
Save as `GEMINI.md` in the repo root (or as `.agent/rules/sharespot.md`):
```markdown
# ShareSpot rules (always follow)
Project: ShareSpot, a culture-first discovery web app for coastal Karnataka (Tulu culture, Yakshagana, crafts, festivals). 36-hour hackathon MVP.
Tagline: "Find your people. Keep your culture in motion."
Stack: Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres, Auth, RLS), Vercel. No other backend. Python only for offline scripts.
Design (Modern Terracotta): Cream #FCF7F0, Blush #E9CDB8, Terra #C56E50, Cocoa #5B332C, Ochre #D9A441.
Fonts: Playfair Display (hero/titles), DM Sans (all else). Terra fails contrast for small text: use for large text, icons, fills only.
Every screen needs loading, empty, error and success states, focus styles, mobile + desktop layouts.
Product rules (these beat any feature request):
1. Show a recommendation only if it has a real "because" reason built from templates filled with real data. Never invent people, events or cultural facts.
2. Private by default. No precise location. No contact details shown by default. Never infer ethnicity, religion or caste.
3. Every seeded row has demo_data = true and shows a visible "Demo data" badge.
4. Every event shows source link, "last checked" time and a verification label.
5. Never rank on popularity or sensitive traits.
Working rules:
- Small, commit-ready changes. Keep the app deployable at all times.
- Do not build: scraping, live location, payments, public messaging, Culture Locket.
- Ask before adding any dependency, new table or new page not in the plan.
- Matching weights are heuristics, not validated values. Say so in comments.
```

### 14.2 First prompt (use Planning mode)
Read GEMINI.md. Create a Next.js + TypeScript + Tailwind app in this folder, connected to Supabase via environment variables (.env.example only, no real keys). Produce an implementation plan first and wait for my approval. The plan must cover:
1. Folder structure (`app/`, `components/`, `lib/supabase`, `lib/matching`, `data/`, `scripts/`, `supabase/`).
2. Supabase `schema.sql` with RLS for: `users`, `entities`, `entity_stats`, `user_entities` (relation: `speaks`|`learning`|`practises`|`wants_to_learn`|`can_teach`|`interested_in`), `communities`, `community_entities`, `memberships`, `events` (category, start_time, end_time, venue_name, broad_region, online_url, image_url, organiser, source_url, retrieved_at, verification_status, demo_data, community_id), `saved_items`, `cultural_cards`, `feedback`.
3. Tailwind tokens and the two fonts.
4. Layout shell: top bar + bottom nav on mobile, left nav + centre feed on desktop.
5. Screens in order: Welcome (with labelled demo entry), Onboarding, Home, Communities, Events (filters + detail), Saved, Profile and privacy, one Cultural card page.
Do not write code until I approve the plan.

### 14.3 One prompt per task (run in parallel, one branch each)
- **Backend and data (Person 3):** Using the approved schema, write `supabase/schema.sql` with RLS, then `data/seed.json` and `scripts/seed.ts`: ~60 synthetic users, 30-40 entities, 8-10 communities, 5-6 hand-written personas, and the real curated events. Every seeded row has `demo_data = true`. Include an `entity_stats` refresh query.
- **Matching (Person 4):** In `lib/matching`, implement: rarity weight $w = \ln(N/(1+n))$; event score $0.35 \cdot I + 0.25 \cdot K + 0.20 \cdot D + 0.10 \cdot M + 0.10 \cdot G$ with weights renormalised when a factor is missing; and the "because" rule with template sentences filled from real data. A match needs at least one evidence item (rare shared entity, teacher/learner pair, or link to a followed community). Add unit tests, including a case where two users share only a common interest and are rejected with the reason "only a common interest". Add the feedback rule: "not for me" -30% entity weight, "relevant" +10%.
- **Frontend (Persons 1 and 2):** Build the Welcome and Onboarding screens / Home feed and Communities page / Events list, filters and detail page using the design tokens in `GEMINI.md`. Use dummy data first, behind a data layer that can swap for Supabase queries. Show the Demo data badge, verification label and source link wherever relevant. Include loading, empty and error states.
- **Final check (browser agent):** Open the deployed URL and walk through the acceptance criteria in README section 15, one by one. Report each step as pass or fail with what you saw.

---

## 15. Acceptance criteria
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

## 16. Demo script (3 to 4 minutes)

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

## 17. Risks and mitigations

| Risk | Mitigation |
| :--- | :--- |
| **Scope too large for 36 hours** | Lock scope at hour 4, freeze at hour 28, treat Locket and chat as stretch |
| **Meetup access fails or is restricted** | Test in hour 1; fall back to Ticketmaster plus curated and organiser events |
| **Few API events for niche coastal Karnataka communities** | Curate 10 to 15 real communities and events by hand with source links; label the rest demo data |
| **DRISHTIKON has thin Tulu or Yakshagana coverage, or licence limits** | Check in the first 2 hours; supplement with Wikidata and hand-written cards; say so honestly |
| **Looks like a generic event app** | Lead with communities, cultural cards, the "because" rule and the rejected match |
| **Embeddings produce superficial links** | Show a link only with labelled evidence |
| **Judges question verification** | Use organiser vouching and show the label in the UI |
| **Terra colour fails contrast at small sizes** | Large text, icons and fills only; darken for small labels |
| **Fake or outdated events** | Source link, retrieval time and verification label on every event; report flow |
| **Cultural misuse or exposure of private knowledge** | Custodian controls, attribution, reuse off by default, no restricted knowledge published |
| **Live demo failure** | Cache API results and seeded fallbacks so the journey works without external APIs |

---

## 18. Decisions, roadmap and credits

| Decision | Status |
| :--- | :--- |
| **App name** | ShareSpot, with the Lost Connection tagline |
| **Stack** | Next.js with Supabase |
| **Region** | Coastal Karnataka; 10 to 15 communities and events still to be curated |
| **Verification model** | Organiser vouching |
| **Locket scope** | Seeded demo only; working flow is stretch |
| **Owners** | Proposed split in section 13; confirm with the team |

- **Roadmap:** Working Culture Locket; live Meetup and Ticketmaster ingestion; on-device profile storage and private set intersection for matching without revealing full profiles.
- **Credits & Licences:** Credit data sources on every cultural card (DRISHTIKON, Wikidata and any others used). Check each dataset's licence before use.

---

## 19. Repository Guidelines (Hackathon / Bug Bounty)

Please follow these guidelines throughout the Bug Bounty event:

### 1. Branch Rules
- Each team must maintain a single repository with three branches: `main`, `bugbounty`, and `fixing`.
- `main` is for ongoing development, `bugbounty` is for deployment and peer testing, and `fixing` is for bug fixes.
- Keep `main` and `bugbounty` in sync until the Attack Phase begins.
- **Never delete the `bugbounty` or `fixing` branches.**

### 2. Attack Phase (12:00 AM - 2:00 AM)
- The `bugbounty` branch will be frozen at the start of the Attack Phase. No changes or commits are allowed to this branch after the phase begins.
- Only the code on the `bugbounty` branch will be deployed for peer testing.
- Development may continue on `main`.
- Test only assigned projects and follow the event's testing guidelines.

### 3. Fixing Phase (2:00 AM - 3:30 AM)
- **Create the `fixing` branch directly from `bugbounty`** at the start of the Fixing Phase. Do not create it from `main` or any other branch.
- Commit all bug fixes to the `fixing` branch only.
- Keep `bugbounty` frozen throughout the Fixing Phase and subsequent evaluation.
- All fixing work must stop when the Fixing Phase ends at 3:30 AM.
- **Do not make any commits to the `fixing` branch after the Fixing Phase ends.** Post-deadline commits may result in disqualification from the Bug Bounty round.
- Merge validated fixes into `main` only after the Fixing Phase ends.
- Update `bugbounty` only after the organizers explicitly announce that evaluation is complete and development may resume.

### 4. Bug Reporting Rules
- Each team may report a maximum of **10 bugs overall**, with a maximum of **4 bugs per target team**.
- Bug reports must be clear and reproducible.
- Report critical vulnerabilities or exposed data privately to the organizers.

### 5. Important Rules
- **Do not modify the `bugbounty` branch after the Attack Phase begins.** Unauthorized changes may result in disqualification from the Bug Bounty round.
- **Do not commit to the `fixing` branch after the Fixing Phase ends at 3:30 AM.** Violations may result in disqualification from the Bug Bounty round.
- Do not modify another team's branches or attempt to bypass repository restrictions.
- Test only assigned projects and authorized accounts. Destructive testing, denial-of-service attacks, phishing, malware deployment, and attempts to access unrelated systems are prohibited.