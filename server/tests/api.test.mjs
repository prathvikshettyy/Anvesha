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
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const BASE = `http://localhost:${port}/api`;

  console.log(`\n🚀 Starting ShareSpot API & Database Persistence Test Suite (${BASE})\n`);

  let rohanToken = '';
  let testUserId = '';
  let createdEventId = '';
  let createdLocketId = '';

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

    // Submit new event
    const newEventRes = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Bengaluru Dialect Exchange Circle',
        category: 'community',
        venue: 'Cubbon Park Bandstand',
        date: 'Sunday, Oct 25 • 4:00 PM',
        description: 'Interactive conversational session practicing coastal phrases.',
      }),
    });
    assert(newEventRes.status === 201, 'POST /api/events returns 201 Created');
    const newEvent = await newEventRes.json();
    assert(newEvent.id && newEvent.title === 'Bengaluru Dialect Exchange Circle', 'Created event persisted and returned with ID');
    createdEventId = newEvent.id;

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

    // Connect with a person
    const targetPersonId = peopleData[0].id;
    const connectRes = await fetch(`${BASE}/people/${targetPersonId}/connect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rohanToken}` },
    });
    assert(connectRes.status === 200, 'POST /api/people/:id/connect returns 200');

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

    // Create new culture locket moment
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
      }),
    });
    assert(newLocketRes.status === 201, 'POST /api/locket returns 201 Created');
    const newLocket = await newLocketRes.json();
    assert(newLocket.id && newLocket.vernacularText === 'ಎಂಚ ಉಲ್ಲರ್ (Encha Uller)', 'Locket moment persisted in SQLite and returned');
    createdLocketId = newLocket.id;

    // React to locket moment
    const reactRes = await fetch(`${BASE}/locket/${createdLocketId}/react`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rohanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: '❤️ Heard and practiced!' }),
    });
    assert(reactRes.status === 201 || reactRes.status === 200, 'POST /api/locket/:id/react returns 201 Created');

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

    console.log('\n' + '='.repeat(55));
    console.log(`🎉 ALL TESTS PASSED: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(55) + '\n');
  } catch (err) {
    console.error('\n❌ Test suite aborted due to unhandled error:', err.message || err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
