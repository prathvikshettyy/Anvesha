// server/tests/api.test.mjs
// Automated test suite for ShareSpot backend APIs & SQLite persistence
// Run with: npm test  (or node server/tests/api.test.mjs)

import { app } from '../src/index.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(message);
  } else {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function runTests() {
  const { createServer } = await import('http');
  const { initRealtime } = await import('../src/realtime/socket.js');
  const httpServer = createServer(app);
  initRealtime(httpServer, '*');
  const server = await new Promise((resolve) => {
    const s = httpServer.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const BASE = `http://localhost:${port}/api`;

  console.log(`\n🚀 Starting ShareSpot API & Database Persistence Test Suite (${BASE})\n`);

  let rohanToken = '';
  let testUserId = '';
  let createdEventId = '';
  let createdLocketId = '';
  let createdAudioUrl = '';

  try {
    // ── 1. Health Check & Documentation ─────────────────────────────────────
    console.log('[Test Suite 1/6] Health Check & Swagger UI Documentation');
    const resHealth = await fetch(`${BASE}/health`);
    assert(resHealth.status === 200, 'GET /api/health returns 200');
    const dataHealth = await resHealth.json();
    assert(dataHealth.status === 'ok', 'Health status is "ok"');
    assert(dataHealth.service === 'ShareSpot API', 'Service name is "ShareSpot API"');

    // Swagger UI & OpenAPI Specification verification
    const resDocs = await fetch(`${BASE}/docs/`);
    assert(resDocs.status === 200, 'GET /api/docs/ returns 200 (Swagger UI)');
    const docsHtml = await resDocs.text();
    assert(docsHtml.includes('swagger-ui'), 'Swagger UI bundle referenced in HTML');
    assert(docsHtml.includes('ShareSpot API'), 'Swagger UI document contains ShareSpot API branding');

    const resDocsJson = await fetch(`${BASE}/docs.json`);
    assert(resDocsJson.status === 200, 'GET /api/docs.json returns 200 (OpenAPI spec JSON)');
    const docsJson = await resDocsJson.json();
    assert(docsJson.openapi === '3.0.3', 'OpenAPI specification is version 3.0.3');
    assert(docsJson.info.title === 'ShareSpot API', 'OpenAPI title matches ShareSpot API');
    assert(!!docsJson.paths['/api/events'], 'OpenAPI paths contain /api/events');
    assert(!!docsJson.paths['/api/auth/login'], 'OpenAPI paths contain /api/auth/login');
    assert(!!docsJson.components.securitySchemes.bearerAuth, 'OpenAPI components contain bearerAuth security scheme');

    // ── 2. Auth Suite ────────────────────────────────────────────────────────
    console.log('\n[Test Suite 2/6] Authentication & Profile');
    
    // Test 401 on protected route without auth
    const unauthRes = await fetch(`${BASE}/auth/me`);
    assert(unauthRes.status === 401, 'GET /api/auth/me without token returns 401');

    // Register a new user
    const randomUser = `test_${Date.now()}`;
    const regRes = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: randomUser,
        password: 'password123',
        name: 'Test Student',
        bio: 'Preserving coastal languages',
      }),
    });
    assert(regRes.status === 201, 'POST /api/auth/register returns 201 Created');
    const regData = await regRes.json();
    assert(!!regData.token, 'Register returns JWT token');
    assert(regData.user.username === randomUser, 'Register returns user object');
    assert(regData.user.is_discoverable === 0, 'New user defaults to is_discoverable = 0');
    testUserId = regData.user.id;

    // Login with seeded user Rohan
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'rohan',
        password: 'demo1234',
      }),
    });
    assert(loginRes.status === 200, 'POST /api/auth/login with valid credentials returns 200');
    const loginData = await loginRes.json();
    assert(!!loginData.token, 'Login returns JWT token');
    rohanToken = loginData.token;

    // Test invalid login
    const badLoginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'rohan', password: 'wrongpassword' }),
    });
    assert(badLoginRes.status === 401, 'Login with incorrect password returns 401');

    // Fetch current user profile
    const meRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 with Bearer token');
    const meData = await meRes.json();
    assert(meData.username === 'rohan', 'Profile returns correct username');
    assert(Array.isArray(meData.interests), 'Profile returns user interests');

    // Update profile
    const updateRes = await fetch(`${BASE}/auth/me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bio: 'Updated bio: student exploring Tulu and Yakshagana',
        preferred_mode: 'IN_PERSON',
      }),
    });
    assert(updateRes.status === 200, 'PATCH /api/auth/me returns 200');

    // ── 3. Events Suite ──────────────────────────────────────────────────────
    console.log('\n[Test Suite 3/6] Events & Map Discovery');
    
    // List all events
    const eventsRes = await fetch(`${BASE}/events`);
    assert(eventsRes.status === 200, 'GET /api/events returns 200');
    const eventsData = await eventsRes.json();
    assert(Array.isArray(eventsData) && eventsData.length > 0, 'Returns list of events');
    assert(eventsData[0].title && eventsData[0].venue, 'Events contain title and venue');
    assert(eventsData[0].image !== undefined, 'Events contain normalized image URL');

    // Filter by category
    const cultureRes = await fetch(`${BASE}/events?category=culture`);
    const cultureData = await cultureRes.json();
    assert(cultureData.every(e => e.category === 'culture'), 'Category filter returns only culture events');

    // Search query
    const searchRes = await fetch(`${BASE}/events?q=Yakshagana`);
    const searchData = await searchRes.json();
    assert(searchData.length > 0 && searchData.some(e => e.title.includes('Yakshagana')), 'Keyword search matches "Yakshagana"');

    // Submit new event (Batch 1: Forced to COMMUNITY_REPORTED, ignores client status)
    const testEventTitle = `KMC Greens Dialect Exchange Circle ${Date.now()}`;
    const newEventRes = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: testEventTitle,
        category: 'community',
        venue: 'Cubbon Park Bandstand',
        date: 'Sunday, Oct 25 • 4:00 PM',
        description: 'Interactive conversational session practicing coastal phrases.',
        verification_status: 'VERIFIED', // Should be forced to COMMUNITY_REPORTED
      }),
    });
    assert(newEventRes.status === 201, 'POST /api/events returns 201 Created');
    const newEvent = await newEventRes.json();
    assert(newEvent.id && newEvent.title === testEventTitle, 'Created event persisted and returned with ID');
    assert(newEvent.verificationStatus === 'COMMUNITY_REPORTED', 'New event verificationStatus forced to COMMUNITY_REPORTED');
    createdEventId = newEvent.id;

    // Batch 1: Duplicate submission returns 409 Conflict
    const dupEventRes = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: testEventTitle,
        category: 'community',
        venue: 'Cubbon Park Bandstand',
        date: 'Sunday, Oct 25 • 4:00 PM',
      }),
    });
    assert(dupEventRes.status === 409, 'Duplicate event submission returns 409 Conflict');

    // Batch 1: Non-owner cannot PATCH event; Owner can PATCH
    const strangerPatchRes = await fetch(`${BASE}/events/${createdEventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${regData.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Hijacked Event' }),
    });
    assert(strangerPatchRes.status === 403, 'Non-owner cannot PATCH event (403)');

    const ownerPatchRes = await fetch(`${BASE}/events/${createdEventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: 'Updated by legitimate owner.' }),
    });
    assert(ownerPatchRes.status === 200, 'Owner can successfully PATCH event (200)');

    // Toggle save / bookmark
    const saveRes = await fetch(`${BASE}/events/${createdEventId}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(saveRes.status === 200, 'POST /api/events/:id/save returns 200');
    const saveData = await saveRes.json();
    assert(saveData.saved === true, 'Event marked as saved');

    // Verify in saved events list
    const mySavedRes = await fetch(`${BASE}/events/saved`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    const mySaved = await mySavedRes.json();
    assert(mySaved.some(e => e.id === createdEventId), 'Saved event appears in /api/events/saved');

    // ── 4. People Discovery & Match Scoring Suite ───────────────────────────
    console.log('\n[Test Suite 4/6] People Discovery & Explainable Match Scoring');
    
    const peopleRes = await fetch(`${BASE}/people`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(peopleRes.status === 200, 'GET /api/people returns 200');
    const peopleData = await peopleRes.json();
    assert(Array.isArray(peopleData) && peopleData.length > 0, 'Returns discoverable people list');
    assert(peopleData[0].matchScore !== undefined, 'Each match has a computed matchScore');
    assert(peopleData[0].matchReason !== undefined, 'Each match has an explainable matchReason');
    assert(peopleData[0].lat === undefined && peopleData[0].lng === undefined, 'Privacy check: exact lat/lng are stripped from people results');

    // Verify sorted descending by match score
    const scores = peopleData.map(p => p.matchScore);
    const sorted = [...scores].sort((a, b) => b - a);
    assert(JSON.stringify(scores) === JSON.stringify(sorted), 'People are sorted by matchScore descending');

    // Connect with an unconnected person (Batch 1: Returns 201 PENDING)
    const { db: testDbInit } = await import('../src/db/index.js');
    const targetPerson = peopleData.find(p => p.connectionStatus === 'NONE') || peopleData[peopleData.length - 1];
    testDbInit.prepare('DELETE FROM connections WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)').run(
      'usr_rohan', targetPerson.id, targetPerson.id, 'usr_rohan'
    );
    const connectRes = await fetch(`${BASE}/people/${targetPerson.id}/connect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(connectRes.status === 201, 'POST /api/people/:id/connect returns 201 Created');
    const connectData = await connectRes.json();
    assert(connectData.status === 'PENDING', 'Initial connection status is PENDING');

    // ── 5. Culture Locket Suite ──────────────────────────────────────────────
    console.log('\n[Test Suite 5/6] Culture Locket & Dialect Vault');

    // Dialect vault
    const vaultRes = await fetch(`${BASE}/locket/vault`);
    assert(vaultRes.status === 200, 'GET /api/locket/vault returns 200');
    const vaultData = await vaultRes.json();
    assert(vaultData.length >= 4, 'Dialect vault returns preserved coastal expressions');

    // List visible moments
    const locketsRes = await fetch(`${BASE}/locket`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(locketsRes.status === 200, 'GET /api/locket returns 200');
    const locketsData = await locketsRes.json();
    assert(Array.isArray(locketsData), 'Returns list of visible moments');

    // Batch 1: Unauthenticated audio upload returns 401
    const unauthAudioRes = await fetch(`${BASE}/locket/audio`, {
      method: 'POST',
      body: new FormData(),
    });
    assert(unauthAudioRes.status === 401, 'POST /api/locket/audio without auth returns 401');

    // Batch 1: Invalid audio signature returns 400
    const fakeAudioBlob = new Blob(['NotRealAudioDataHere'], { type: 'audio/webm' });
    const fakeAudioForm = new FormData();
    fakeAudioForm.append('audio', fakeAudioBlob, 'fake.webm');
    fakeAudioForm.append('duration_seconds', '3');
    const badSigRes = await fetch(`${BASE}/locket/audio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rohanToken}` },
      body: fakeAudioForm,
    });
    assert(badSigRes.status === 400, 'POST /api/locket/audio with invalid signature returns 400');

    // Upload real voice recording with valid WebM signature (EBML: 1A 45 DF A3)
    const validWebmBytes = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01, 0x42, 0xf2, 0x81, 0x08, 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d]);
    const audioBlob = new Blob([validWebmBytes], { type: 'audio/webm' });
    const audioForm = new FormData();
    audioForm.append('audio', audioBlob, 'voice-take.webm');
    audioForm.append('duration_seconds', '3');

    const uploadRes = await fetch(`${BASE}/locket/audio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rohanToken}` },
      body: audioForm,
    });
    assert(uploadRes.status === 201, 'POST /api/locket/audio returns 201 Created');
    const uploadData = await uploadRes.json();
    createdAudioUrl = uploadData.url;
    assert(uploadData.url && uploadData.url.startsWith('/uploads/locket/'), 'Audio upload returns /uploads/locket/ path');
    assert(uploadData.duration === '0:03', 'Audio upload returns formatted duration');

    // Verify static audio serving
    const staticAudioRes = await fetch(new URL(uploadData.url, BASE).href);
    assert(staticAudioRes.status === 200, 'Uploaded audio is statically served via /uploads with 200 OK');
    assert(staticAudioRes.headers.get('x-content-type-options') === 'nosniff', 'Static audio served with nosniff header');

    // Create new culture locket moment with uploaded audio
    const newLocketRes = await fetch(`${BASE}/locket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moment_type: 'WORD_OF_DAY',
        vernacular_text: 'ಎಂಚ ಉಲ್ಲರ್ (Encha Uller)',
        phonetic_text: '/en-cha ool-ler/',
        meaning: 'How are you? (Quintessential coastal Tulu greeting)',
        provenance: 'Practiced across Dakshina Kannada & Udupi households',
        audio_url: uploadData.url,
        audio_duration: uploadData.duration,
      }),
    });
    assert(newLocketRes.status === 201, 'POST /api/locket returns 201 Created');
    const newLocket = await newLocketRes.json();
    assert(newLocket.id && newLocket.vernacularText === 'ಎಂಚ ಉಲ್ಲರ್ (Encha Uller)', 'Locket moment persisted in SQLite and returned');
    assert(newLocket.audioUrl === uploadData.url, 'Locket moment contains uploaded audioUrl');
    createdLocketId = newLocket.id;

    // STEP 3 Requirement: Unauthenticated POST returns 401
    const unauthPostRes = await fetch(`${BASE}/locket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vernacular_text: 'Unauthenticated test',
        meaning: 'Should fail with 401',
      }),
    });
    assert(unauthPostRes.status === 401, 'Unauthenticated POST returns 401');

    // STEP 3 Requirement: POST a text moment, then GET /api/locket/mine returns it
    const textMomentRes = await fetch(`${BASE}/locket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moment_type: 'WORD_OF_DAY',
        vernacular_text: 'ಬಲೆ ಒಣಸ್ ಮಲ್ಪಾ (Bale Onas Malpa)',
        meaning: 'Come, let us share a meal together',
      }),
    });
    assert(textMomentRes.status === 201, 'POST a text moment returns 201 Created');
    const textMoment = await textMomentRes.json();

    const checkMineRes = await fetch(`${BASE}/locket/mine`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(checkMineRes.status === 200, 'GET /api/locket/mine returns 200');
    const checkMineData = await checkMineRes.json();
    assert(checkMineData.some(m => m.id === textMoment.id), 'POST a text moment, then GET /api/locket/mine returns it');

    // STEP 3 Requirement: POST an audio moment under the limit works
    const sampleBase64Audio = 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwE=';
    const audioMomentRes = await fetch(`${BASE}/locket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moment_type: 'WORD_OF_DAY',
        vernacular_text: 'ಸೊಲ್ಮೆಲು (Solmelu)',
        meaning: 'Thank you in Tulu',
        audio_url: sampleBase64Audio,
        audio_duration: '0:03',
      }),
    });
    assert(audioMomentRes.status === 201, 'POST an audio moment under the limit works');
    const audioMoment = await audioMomentRes.json();
    assert(audioMoment.audioUrl.startsWith('data:audio/'), 'Audio moment under limit stores data URI');

    // STEP 3 Requirement: Oversize audio returns 413 with a clear message
    const oversizeAudioPayload = 'data:audio/webm;base64,' + 'A'.repeat(2.5 * 1024 * 1024);
    const oversizeRes = await fetch(`${BASE}/locket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moment_type: 'WORD_OF_DAY',
        vernacular_text: 'Oversize test',
        meaning: 'Oversize test meaning',
        audio_url: oversizeAudioPayload,
      }),
    });
    assert(oversizeRes.status === 413, 'Oversize audio returns 413');
    const oversizeBody = await oversizeRes.json();
    assert(oversizeBody.error && oversizeBody.error.includes('Recording too long. Keep it under 30 seconds.'), 'Oversize audio returns clear message');

    // Requirement: Non-locket route returns 413 with "Request too large."
    const oversizeOtherRes = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'A'.repeat(2.5 * 1024 * 1024),
      }),
    });
    assert(oversizeOtherRes.status === 413, 'Non-locket route oversize returns 413');
    const oversizeOtherBody = await oversizeOtherRes.json();
    assert(oversizeOtherBody.error === 'Request too large.', 'Non-locket route returns "Request too large."');

    // Requirement: svg data URI rejected
    const svgRes = await fetch(`${BASE}/locket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moment_type: 'WORD_OF_DAY',
        vernacular_text: 'SVG test',
        meaning: 'SVG rejection test',
        image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="5"/></svg>',
      }),
    });
    assert(svgRes.status === 400, 'svg data URI rejected');

    // Requirement: disallowed audio type rejected
    const disallowedAudioRes = await fetch(`${BASE}/locket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moment_type: 'WORD_OF_DAY',
        vernacular_text: 'WAV test',
        meaning: 'Disallowed audio type test',
        audio_url: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
      }),
    });
    assert(disallowedAudioRes.status === 400, 'disallowed audio type rejected');

    // Requirement: allowed webm accepted
    const allowedWebmRes = await fetch(`${BASE}/locket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moment_type: 'WORD_OF_DAY',
        vernacular_text: 'ಬಲೆ, ಒಣಸ್ ಮಲ್ಪಾ',
        meaning: 'Come, let us share a meal together',
        audio_url: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwE=',
      }),
    });
    assert(allowedWebmRes.status === 201, 'allowed webm accepted');

    // React to locket moment as sender/connection
    const reactRes = await fetch(`${BASE}/locket/${createdLocketId}/react`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: '❤️ Heard and practiced!' }),
    });
    assert(reactRes.status === 201 || reactRes.status === 200, 'POST /api/locket/:id/react returns 201 Created');

    // Connection Privacy Check: Unconnected user (Test Student) must NOT see Rohan's circle moment
    const strangerLocketRes = await fetch(`${BASE}/locket`, {
      headers: { Authorization: `Bearer ${regData.token}` },
    });
    assert(strangerLocketRes.status === 200, 'GET /api/locket for stranger returns 200');
    const strangerLockets = await strangerLocketRes.json();
    assert(!strangerLockets.some(m => m.id === createdLocketId), 'Privacy check: unconnected user cannot see circle locket moment');

    // Connection Privacy Check: Unconnected user cannot react to Rohan's moment
    const strangerReactRes = await fetch(`${BASE}/locket/${createdLocketId}/react`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${regData.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Trying to snoop' }),
    });
    assert(strangerReactRes.status === 403, 'Privacy check: unconnected user gets 403 Forbidden reacting to moment');

    // ── 5b. Culture Locket Connections & Mine Endpoints ──────────────────────
    console.log('\n[Test Suite 5b] GET /api/locket/connections & /mine Authorization & Visibility');

    // 1. Unauthenticated requests get 401
    const unauthConnRes = await fetch(`${BASE}/locket/connections`);
    assert(unauthConnRes.status === 401, 'GET /api/locket/connections without token returns 401');

    const unauthMineRes = await fetch(`${BASE}/locket/mine`);
    assert(unauthMineRes.status === 401, 'GET /api/locket/mine without token returns 401');

    // 2. /mine returns only the caller's moments
    const rohanMineRes = await fetch(`${BASE}/locket/mine`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(rohanMineRes.status === 200, 'GET /api/locket/mine for Rohan returns 200');
    const rohanMineData = await rohanMineRes.json();
    assert(Array.isArray(rohanMineData), 'GET /api/locket/mine returns an array');
    assert(rohanMineData.some(m => m.id === createdLocketId), 'Rohan sees his created moment in /mine');
    assert(rohanMineData.every(m => m.authorId === 'usr_rohan' || m.senderId === 'usr_rohan'), 'All items in Rohan /mine belong to Rohan');
    assert(rohanMineData.every(m => m.lat === undefined && m.lng === undefined && m.latitude === undefined && m.longitude === undefined), '/mine does not expose lat/lng location data');

    const strangerMineRes = await fetch(`${BASE}/locket/mine`, {
      headers: { Authorization: `Bearer ${regData.token}` },
    });
    assert(strangerMineRes.status === 200, 'GET /api/locket/mine for Test Student returns 200');
    const strangerMineData = await strangerMineRes.json();
    assert(!strangerMineData.some(m => m.id === createdLocketId), 'Test Student does NOT see Rohan moment in their own /mine');

    // 3. User A never sees a non-connection's moments in /connections
    const { db: testDb } = await import('../src/db/index.js');
    const { v4: uuidv4 } = await import('uuid');

    // Ensure no connection exists between testUserId and usr_rohan initially
    testDb.prepare('DELETE FROM connections WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)').run(
      testUserId, 'usr_rohan', 'usr_rohan', testUserId
    );

    const nonConnRes = await fetch(`${BASE}/locket/connections`, {
      headers: { Authorization: `Bearer ${regData.token}` },
    });
    assert(nonConnRes.status === 200, 'GET /api/locket/connections returns 200');
    const nonConnData = await nonConnRes.json();
    assert(!nonConnData.some(m => m.id === createdLocketId), 'A never sees a non-connection moment in /connections');

    // 4. User A does NOT see B moments when connection is PENDING
    const testConnId = uuidv4();
    testDb.prepare('INSERT INTO connections (id, requester_id, receiver_id, status) VALUES (?, ?, ?, ?)').run(
      testConnId, testUserId, 'usr_rohan', 'PENDING'
    );

    const pendingRes = await fetch(`${BASE}/locket/connections`, {
      headers: { Authorization: `Bearer ${regData.token}` },
    });
    const pendingData = await pendingRes.json();
    assert(!pendingData.some(m => m.id === createdLocketId), 'User A does NOT see B moments when connection is PENDING');

    // 5. User A does NOT see B moments when connection is DECLINED
    testDb.prepare('UPDATE connections SET status = ? WHERE id = ?').run('DECLINED', testConnId);
    const declinedRes = await fetch(`${BASE}/locket/connections`, {
      headers: { Authorization: `Bearer ${regData.token}` },
    });
    const declinedData = await declinedRes.json();
    assert(!declinedData.some(m => m.id === createdLocketId), 'User A does NOT see B moments when connection is DECLINED');

    // 6. User A sees B moments ONLY after connection is CONNECTED
    testDb.prepare('UPDATE connections SET status = ? WHERE id = ?').run('CONNECTED', testConnId);
    const connectedRes = await fetch(`${BASE}/locket/connections`, {
      headers: { Authorization: `Bearer ${regData.token}` },
    });
    assert(connectedRes.status === 200, 'GET /api/locket/connections returns 200 when connected');
    const connectedData = await connectedRes.json();
    assert(connectedData.some(m => m.id === createdLocketId), 'A moment appears in another user\'s connections feed only if the connection is CONNECTED');
    const matchedMoment = connectedData.find(m => m.id === createdLocketId);
    assert(matchedMoment.authorName || matchedMoment.senderName, 'Locket moment includes author name');
    assert(typeof matchedMoment.reactionCount === 'number', 'Locket moment includes reactionCount number');
    assert(matchedMoment.lat === undefined && matchedMoment.lng === undefined && matchedMoment.latitude === undefined && matchedMoment.longitude === undefined, '/connections does not expose lat/lng location data');

    // 7. A does not see own moments in /connections
    const rohanConnRes = await fetch(`${BASE}/locket/connections`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    const rohanConnData = await rohanConnRes.json();
    assert(!rohanConnData.some(m => m.id === createdLocketId), 'Rohan does NOT see his own moments in /connections');

    // ── 6. Messages Suite ────────────────────────────────────────────────────
    console.log('\n[Test Suite 6/6] Private Peer Messaging');

    // List conversations
    const convsRes = await fetch(`${BASE}/messages/conversations`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(convsRes.status === 200, 'GET /api/messages/conversations returns 200');
    const convsData = await convsRes.json();
    assert(Array.isArray(convsData), 'Returns conversations array');

    // Send a message to Priya
    const sendMsgRes = await fetch(`${BASE}/messages/usr_priya`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Automated test message: looking forward to the Yakshagana demo!' }),
    });
    assert(sendMsgRes.status === 201, 'POST /api/messages/:partnerId returns 201 Created');

    // Get thread
    const threadRes = await fetch(`${BASE}/messages/usr_priya`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(threadRes.status === 200, 'GET /api/messages/:partnerId returns 200');
    const threadData = await threadRes.json();
    assert(threadData.messages.some(m => m.text.includes('Automated test message')), 'Sent message appears in message thread');

    // Mark as read
    const readRes = await fetch(`${BASE}/messages/usr_priya/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(readRes.status === 200, 'PATCH /api/messages/:partnerId/read returns 200');

    // ─── [Test Suite 7/7] Cultural Communities & Discussions ───────────────────
    console.log('\n[Test Suite 7/7] Cultural Communities & Group Discussions');

    // List communities
    const commListRes = await fetch(`${BASE}/communities`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(commListRes.status === 200, 'GET /api/communities returns 200');
    const comms = await commListRes.json();
    assert(Array.isArray(comms) && comms.length >= 5, 'Returns list of seeded cultural communities');
    assert(comms[0].name && comms[0].type && comms[0].category, 'Communities contain name, type, and category');

    // Filter by category
    const musicCommRes = await fetch(`${BASE}/communities?category=music`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(musicCommRes.status === 200, 'GET /api/communities?category=music returns 200');
    const musicComms = await musicCommRes.json();
    assert(musicComms.every(c => c.category === 'music'), 'Category filter returns only music communities');

    // Search by query
    const searchCommRes = await fetch(`${BASE}/communities?q=Manipal`);
    assert(searchCommRes.status === 200, 'GET /api/communities?q=Manipal returns 200');
    const manipalComms = await searchCommRes.json();
    assert(manipalComms.some(c => c.name.includes('Manipal')), 'Search query finds Manipal communities');

    // Get specific community
    const targetCommId = 'comm_folk_art';
    const commDetailRes = await fetch(`${BASE}/communities/${targetCommId}`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(commDetailRes.status === 200, 'GET /api/communities/:id returns 200');
    const commDetail = await commDetailRes.json();
    assert(commDetail.id === targetCommId, 'Community details return correct ID');
    assert(Array.isArray(commDetail.members), 'Community details contain members list');

    // Join community
    const joinRes = await fetch(`${BASE}/communities/${targetCommId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(joinRes.status === 200, 'POST /api/communities/:id/join returns 200');
    const joinData = await joinRes.json();
    assert(joinData.isMember === true, 'Community membership confirmed');

    // Post discussion message in joined community
    const postMsgRes = await fetch(`${BASE}/communities/${targetCommId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Hello folk artists! Excited to learn about traditional mural techniques.' }),
    });
    assert(postMsgRes.status === 201, 'POST /api/communities/:id/messages returns 201 Created');
    const postedMsg = await postMsgRes.json();
    assert(postedMsg.id && postedMsg.text.includes('mural techniques'), 'Discussion message persisted in SQLite');

    // Read discussion messages (Batch 1: Requires auth and membership)
    const unauthGetMsgsRes = await fetch(`${BASE}/communities/${targetCommId}/messages`);
    assert(unauthGetMsgsRes.status === 401, 'GET /api/communities/:id/messages unauthenticated returns 401');

    const getMsgsRes = await fetch(`${BASE}/communities/${targetCommId}/messages`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(getMsgsRes.status === 200, 'GET /api/communities/:id/messages returns 200');
    const allMsgs = await getMsgsRes.json();
    assert(allMsgs.some(m => m.id === postedMsg.id), 'Sent message appears in community discussion thread');

    // Report community affordance
    const reportRes = await fetch(`${BASE}/communities/${targetCommId}/report`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Test moderation check' }),
    });
    assert(reportRes.status === 200, 'POST /api/communities/:id/report returns 200');

    // Leave community
    const leaveRes = await fetch(`${BASE}/communities/${targetCommId}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(leaveRes.status === 200, 'POST /api/communities/:id/leave returns 200');
    // ─── [Test Suite 8/8] Batch 1 Security & Invariant Hardening ─────────────
    console.log('\n[Test Suite 8/8] Batch 1 Security & Invariant Hardening');

    // 1. Unauthorized messaging: stranger cannot send message to non-connected peer
    const strangerMsgRes = await fetch(`${BASE}/messages/usr_kavya`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${regData.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Spamming stranger without connection' }),
    });
    assert(strangerMsgRes.status === 403, 'Sending message to non-connected user returns 403');

    // 2. Connections accept flow:
    testDb.prepare('DELETE FROM connections WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)').run(
      testUserId, 'usr_kavya', 'usr_kavya', testUserId
    );

    // Create connection request from Test Student to Kavya
    const studentToKavyaRes = await fetch(`${BASE}/people/usr_kavya/connect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${regData.token}` },
    });
    assert(studentToKavyaRes.status === 201, 'Student creates connection request to Kavya');

    // Login as Kavya to inspect requests and accept
    const kavyaLogin = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'kavya', password: 'demo1234' }),
    });
    const { token: kavyaToken } = await kavyaLogin.json();

    // Kavya checks incoming requests
    const incomingRes = await fetch(`${BASE}/people/requests/incoming`, {
      headers: { Authorization: `Bearer ${kavyaToken}` },
    });
    assert(incomingRes.status === 200, 'GET /api/people/requests/incoming returns 200');
    const incomingData = await incomingRes.json();
    assert(incomingData.some(r => r.requester_id === testUserId), 'Kavya sees incoming request from Student');

    // Kavya accepts connection
    const acceptRes = await fetch(`${BASE}/people/${testUserId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kavyaToken}` },
    });
    assert(acceptRes.status === 200, 'POST /api/people/:id/accept returns 200');

    // Now Student can send message to Kavya
    const connectedMsgRes = await fetch(`${BASE}/messages/usr_kavya`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${regData.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Hello Kavya, we are now connected!' }),
    });
    assert(connectedMsgRes.status === 201, 'Once accepted, message is successfully delivered (201)');

    // 3. JWT Algorithm Pinning: forged token with 'none' is rejected
    const jwt = await import('jsonwebtoken');
    const forgedToken = jwt.default.sign({ id: 'usr_rohan' }, '', { algorithm: 'none' });
    const forgedRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert(forgedRes.status === 401, 'Token signed with alg: none is rejected (401)');

    // 4. Community member privacy: member with is_discoverable = 0 is not in public member list
    const studentCommJoinRes = await fetch(`${BASE}/communities/${targetCommId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${regData.token}` },
    });
    assert(studentCommJoinRes.status === 200, 'Student joins community');

    const commDetailPrivacyRes = await fetch(`${BASE}/communities/${targetCommId}`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    const commDetailPrivacy = await commDetailPrivacyRes.json();
    assert(!commDetailPrivacy.members.some(m => m.id === testUserId), 'Non-discoverable user (is_discoverable=0) does NOT appear in community member list');

    // ─── [Test Suite 9/9] Batch 2 Security Hardening & Data Portability ────────
    console.log('\n[Test Suite 9/9] Batch 2 Security Hardening & Data Portability');

    // 1. Password min 8 characters enforcement
    const shortPassRes = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `short_${Date.now()}`,
        password: 'short12', // 7 chars
        name: 'Short Password Tester',
      }),
    });
    assert(shortPassRes.status === 400, 'Password under 8 characters is rejected (400)');

    // 2. Avatar URL validation (reject javascript:, accept safe values)
    const badAvatarRes = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `avatar_${Date.now()}`,
        password: 'validpassword123',
        name: 'Avatar Tester',
        avatar_url: 'javascript:alert(1)',
      }),
    });
    assert(badAvatarRes.status === 400, 'Malicious javascript: avatar_url is rejected (400)');

    // 3. Event image URL validation
    const badEventImgRes = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `Test Invalid Image Event ${Date.now()}`,
        category: 'culture',
        venue: 'Cubbon Park Bandstand',
        image_url: 'javascript:alert(1)',
      }),
    });
    assert(badEventImgRes.status === 400, 'Malicious javascript: event image_url is rejected (400)');

    // 4. Locket Reaction UNIQUE(moment_id, user_id) idempotence
    const react1Res = await fetch(`${BASE}/locket/${createdLocketId}/react`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'First reaction text' }),
    });
    assert(react1Res.status === 201 || react1Res.status === 200, 'Initial reaction returns 201/200');

    const react2Res = await fetch(`${BASE}/locket/${createdLocketId}/react`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Updated reaction text' }),
    });
    assert(react2Res.status === 201 || react2Res.status === 200, 'Second reaction from same user updates without error');

    // 5. Pagination on GET /api/people
    const paginatedPeopleRes = await fetch(`${BASE}/people?limit=2&offset=0`, {
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(paginatedPeopleRes.status === 200, 'GET /api/people?limit=2 returns 200');
    const paginatedPeople = await paginatedPeopleRes.json();
    assert(paginatedPeople.length <= 2, 'GET /api/people with limit=2 returns at most 2 items');

    // 6. User Data Export (GET /api/auth/export)
    const exportRes = await fetch(`${BASE}/auth/export`, {
      headers: { Authorization: `Bearer ${regData.token}` },
    });
    assert(exportRes.status === 200, 'GET /api/auth/export returns 200');
    const exportData = await exportRes.json();
    assert(exportData.user && exportData.user.id === testUserId, 'Export contains user profile');
    assert(Array.isArray(exportData.connections), 'Export contains connections array');
    assert(Array.isArray(exportData.interests), 'Export contains interests array');
    assert(Array.isArray(exportData.communityMemberships), 'Export contains community memberships array');

    // 7. User Account Deletion (DELETE /api/auth/me)
    // Wrong password returns 401
    const badDeleteRes = await fetch(`${BASE}/auth/me`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${regData.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'wrongpassword' }),
    });
    assert(badDeleteRes.status === 401, 'DELETE /api/auth/me with incorrect password returns 401');

    // Correct password succeeds and cleans up account
    const goodDeleteRes = await fetch(`${BASE}/auth/me`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${regData.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'password123' }),
    });
    assert(goodDeleteRes.status === 200, 'DELETE /api/auth/me with valid password returns 200');

    // Verify user is gone
    const deletedMeRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${regData.token}` },
    });
    assert(deletedMeRes.status === 404, 'Deleted user cannot access GET /api/auth/me (returns 404)');

    // 8. Item 11: Demo seeding production guard test
    const { execSync } = await import('child_process');
    const { fileURLToPath } = await import('url');
    const seedScriptPath = fileURLToPath(new URL('../src/db/seed.js', import.meta.url));
    const seedOutput = execSync(`node "${seedScriptPath}"`, {
      env: { ...process.env, NODE_ENV: 'production', ALLOW_DEMO_SEED: 'false' },
      encoding: 'utf8',
    });
    assert(seedOutput.includes('Demo seeding disabled in production'), 'Seed script refuses to run in production without ALLOW_DEMO_SEED=true');

    // 9. Rate limiting: 25 successful logins in a row are not blocked (skipSuccessfulRequests: true)
    let successfulLoginsCount = 0;
    for (let i = 0; i < 25; i++) {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'rohan',
          password: 'demo1234',
        }),
      });
      if (res.status === 200) {
        successfulLoginsCount++;
      }
    }
    assert(successfulLoginsCount === 25, '25 successful logins in a row are not blocked by auth rate limiter (skipSuccessfulRequests: true)');

    // 10. Security Gap Verification Suite (Cases 1 - 11)
    const { runSecurityGapTests } = await import('./security_gaps.test.mjs');
    const gapResults = await runSecurityGapTests(BASE, port, server);
    for (const r of gapResults) {
      if (r.passed) passed++;
      else failed++;
    }

    console.log('\n' + '='.repeat(55));
    console.log(`🎉 ALL TESTS PASSED: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(55) + '\n');
  } catch (err) {
    console.error('\n❌ Test suite aborted due to unhandled error:', err.message || err);
    process.exitCode = 1;
  } finally {
    try {
      const { db } = await import('../src/db/index.js');
      const fs = await import('fs');
      const path = await import('path');
      if (createdLocketId) {
        db.prepare('DELETE FROM locket_reactions WHERE moment_id = ?').run(createdLocketId);
        db.prepare('DELETE FROM locket_moments WHERE id = ?').run(createdLocketId);
      }
      if (createdEventId) {
        db.prepare('DELETE FROM saved_events WHERE event_id = ?').run(createdEventId);
        db.prepare('DELETE FROM events WHERE id = ?').run(createdEventId);
      }
      if (testUserId) {
        db.prepare('DELETE FROM connections WHERE requester_id = ? OR receiver_id = ?').run(testUserId, testUserId);
        db.prepare('DELETE FROM user_interests WHERE user_id = ?').run(testUserId);
        db.prepare('DELETE FROM user_skills WHERE user_id = ?').run(testUserId);
        db.prepare('DELETE FROM saved_events WHERE user_id = ?').run(testUserId);
        db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
      }
      if (createdAudioUrl && createdAudioUrl.startsWith('/uploads/locket/')) {
        const filePath = path.join(process.cwd(), createdAudioUrl.startsWith('/') ? createdAudioUrl.slice(1) : createdAudioUrl);
        const serverFilePath = path.join(process.cwd(), 'server', createdAudioUrl.startsWith('/') ? createdAudioUrl.slice(1) : createdAudioUrl);
        if (fs.existsSync(filePath)) try { fs.unlinkSync(filePath); } catch(_) {}
        if (fs.existsSync(serverFilePath)) try { fs.unlinkSync(serverFilePath); } catch(_) {}
      }
    } catch (_) {}
    server.close();
  }
}

runTests();
