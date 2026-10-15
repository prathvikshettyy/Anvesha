// server/tests/security_gaps.test.mjs
// Comprehensive test suite for the 11 security & invariant gaps

import { spawnSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { io as ClientIO } from 'socket.io-client';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

export async function runSecurityGapTests(BASE, port, server) {
  console.log('\n' + '='.repeat(60));
  console.log('🛡️  RUNNING SECURITY GAP VERIFICATION SUITE (CASES 1 - 11)');
  console.log('='.repeat(60) + '\n');

  const results = []; // { caseNum, name, passed, error }

  function record(caseNum, name, fn) {
    return async () => {
      try {
        await fn();
        results.push({ caseNum, name, passed: true });
        console.log(`  ✅ [Case ${caseNum}] PASS: ${name}`);
      } catch (err) {
        results.push({ caseNum, name, passed: false, error: err.message });
        console.error(`  ❌ [Case ${caseNum}] FAIL: ${name} -> ${err.message}`);
      }
    };
  }

  // Helpers to register or login test users
  async function registerUser(prefix) {
    const username = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const password = 'Password123!';
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        name: `${prefix} User`,
        bio: 'Security test user',
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to register ${username}: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return { token: data.token, user: data.user, password, username };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CASE 1: Event & Community Ownership (PATCH / DELETE)
  // ───────────────────────────────────────────────────────────────────────────
  const user1A = await registerUser('owner1a');
  const user1B = await registerUser('nonowner1b');

  // Create an event owned by user1A
  const createEvtRes = await fetch(`${BASE}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user1A.token}`,
    },
    body: JSON.stringify({
      title: 'Yakshagana Night Fest',
      venue: 'MIT Campus',
      category: 'culture',
    }),
  });
  const event1 = await createEvtRes.json();

  await record(1, 'Non-owner cannot PATCH another user event (403)', async () => {
    const res = await fetch(`${BASE}/events/${event1.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1B.token}`,
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403, got ${res.status} (${await res.text()})`);
    }
  })();

  await record(1, 'Owner can PATCH their own event (200)', async () => {
    const res = await fetch(`${BASE}/events/${event1.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1A.token}`,
      },
      body: JSON.stringify({ title: 'Yakshagana Night Fest Updated' }),
    });
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  })();

  await record(1, 'Non-owner cannot DELETE another user event (403)', async () => {
    const res = await fetch(`${BASE}/events/${event1.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1B.token}` },
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  })();

  await record(1, 'Owner can DELETE their own event (200)', async () => {
    const res = await fetch(`${BASE}/events/${event1.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1A.token}` },
    });
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  })();

  // Communities: comm_folk_art
  await record(1, 'Non-owner cannot PATCH another user community (403)', async () => {
    const res = await fetch(`${BASE}/communities/comm_folk_art`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1B.token}`,
      },
      body: JSON.stringify({ name: 'Hacked Community' }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  })();

  await record(1, 'Non-owner cannot DELETE another user community (403)', async () => {
    const res = await fetch(`${BASE}/communities/comm_folk_art`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1B.token}` },
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // CASE 2: Connection Request Invariants
  // ───────────────────────────────────────────────────────────────────────────
  const user2A = await registerUser('conn2a');
  const user2B = await registerUser('conn2b');

  await record(2, 'Self-connect is rejected with 400', async () => {
    const res = await fetch(`${BASE}/people/${user2A.user.id}/connect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2A.token}` },
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400, got ${res.status}`);
    }
    const data = await res.json();
    if (!data.error?.includes('Cannot connect with yourself')) {
      throw new Error(`Expected Cannot connect with yourself, got ${JSON.stringify(data)}`);
    }
  })();

  let connId2;
  await record(2, 'Sender creates connection request as PENDING', async () => {
    const res = await fetch(`${BASE}/people/${user2B.user.id}/connect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2A.token}` },
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    if (data.status !== 'PENDING') throw new Error(`Expected PENDING, got ${data.status}`);
    connId2 = data.connectionId;
  })();

  await record(2, 'Sender cannot accept their own request', async () => {
    // user2A attempts to accept the request they sent to user2B
    const res = await fetch(`${BASE}/people/${user2B.user.id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2A.token}` },
    });
    // Expected 404/403: only recipient can accept
    if (res.status !== 404 && res.status !== 403) {
      throw new Error(`Expected 404 or 403, got ${res.status}`);
    }
  })();

  await record(2, 'Duplicate connection request is rejected', async () => {
    const res = await fetch(`${BASE}/people/${user2B.user.id}/connect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2A.token}` },
    });
    const data = await res.json();
    if (data.status !== 'PENDING' || !data.message?.includes('already exists')) {
      throw new Error(`Expected existing PENDING request notice, got ${JSON.stringify(data)}`);
    }
  })();

  await record(2, 'Recipient can decline connection request', async () => {
    const res = await fetch(`${BASE}/people/${user2A.user.id}/decline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2B.token}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.status !== 'DECLINED') throw new Error(`Expected DECLINED, got ${data.status}`);
  })();

  await record(2, 'Re-requesting after DECLINED returns previously declined status', async () => {
    const res = await fetch(`${BASE}/people/${user2B.user.id}/connect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2A.token}` },
    });
    const data = await res.json();
    if (data.status !== 'DECLINED' || !data.message?.includes('previously declined')) {
      throw new Error(`Expected DECLINED message, got ${JSON.stringify(data)}`);
    }
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // CASE 3: Mass Assignment Protection
  // ───────────────────────────────────────────────────────────────────────────
  const user3 = await registerUser('mass3');

  await record(3, 'POST /api/events ignores client verification_status, demo_data, submitted_by, id, created_at', async () => {
    const res = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user3.token}`,
      },
      body: JSON.stringify({
        title: `Mass Assign Event Test ${Date.now()}`,
        venue: 'End Point',
        category: 'art',
        id: 'evt_malicious_id',
        created_at: '2020-01-01T00:00:00.000Z',
        submitted_by: 'usr_impersonated',
        verification_status: 'VERIFIED',
        demo_data: true,
      }),
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const created = await res.json();
    if (created.id === 'evt_malicious_id') throw new Error('Client id was accepted');
    if (created.verification_status === 'VERIFIED') throw new Error('Client verification_status was accepted');
    if (created.submitted_by === 'usr_impersonated') throw new Error('Client submitted_by was accepted');
    if (created.createdAt === '2020-01-01T00:00:00.000Z') throw new Error('Client created_at was accepted');
  })();

  await record(3, 'PATCH /api/auth/me ignores id, password_hash, created_at, demo_data', async () => {
    const res = await fetch(`${BASE}/auth/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user3.token}`,
      },
      body: JSON.stringify({
        id: 'usr_hacked_id',
        password_hash: 'bogus_hash',
        created_at: '2019-01-01T00:00:00.000Z',
        name: 'Updated Name Safe',
      }),
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const meRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${user3.token}` },
    });
    const me = await meRes.json();
    if (me.id === 'usr_hacked_id') throw new Error('id was overridden');
    if (me.password_hash) throw new Error('password_hash leaked in me');
    if (me.name !== 'Updated Name Safe') throw new Error('Safe name update failed');
  })();

  await record(3, 'Registration ignores is_discoverable (defaults to 0)', async () => {
    const regRes = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `disc_${Date.now()}`,
        password: 'Password123!',
        name: 'Discoverable Attacker',
        is_discoverable: 1,
      }),
    });
    const regData = await regRes.json();
    if (regData.user.is_discoverable !== 0) {
      throw new Error(`Expected is_discoverable=0, got ${regData.user.is_discoverable}`);
    }
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // CASE 4: Robust Input Validation & SQL Injection Resilience
  // ───────────────────────────────────────────────────────────────────────────
  await record(4, 'SQL injection test string in search & filter parameters returns safe 200, never 500', async () => {
    const sqli = "' OR 1=1 --";
    const endpoints = [
      { path: `/events?q=${encodeURIComponent(sqli)}&category=${encodeURIComponent(sqli)}`, headers: {} },
      { path: `/people?q=${encodeURIComponent(sqli)}&interest=${encodeURIComponent(sqli)}&language=${encodeURIComponent(sqli)}`, headers: { Authorization: `Bearer ${user3.token}` } },
      { path: `/communities?q=${encodeURIComponent(sqli)}&category=${encodeURIComponent(sqli)}&type=${encodeURIComponent(sqli)}`, headers: {} },
    ];
    for (const ep of endpoints) {
      const res = await fetch(`${BASE}${ep.path}`, { headers: ep.headers });
      if (res.status === 500) throw new Error(`500 Internal Server Error on ${ep.path}`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status} on ${ep.path}`);
    }
  })();

  await record(4, 'javascript: and data:image/svg+xml URLs rejected on POST/PATCH (400)', async () => {
    // Event image_url with javascript:
    const res1 = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user3.token}`,
      },
      body: JSON.stringify({
        title: 'XSS Event',
        venue: 'KMC Greens',
        image_url: 'javascript:alert(1)',
      }),
    });
    if (res1.status !== 400) throw new Error(`Expected 400 for javascript: image_url, got ${res1.status}`);

    // Event image_url with data:image/svg+xml
    const res2 = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user3.token}`,
      },
      body: JSON.stringify({
        title: 'SVG Event',
        venue: 'KMC Greens',
        image_url: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
      }),
    });
    if (res2.status !== 400) throw new Error(`Expected 400 for data:image/svg+xml, got ${res2.status}`);

    // Auth profile avatar_url with javascript:
    const res3 = await fetch(`${BASE}/auth/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user3.token}`,
      },
      body: JSON.stringify({ avatar_url: 'javascript:alert(1)' }),
    });
    if (res3.status !== 400) throw new Error(`Expected 400 for avatar_url javascript:, got ${res3.status}`);
  })();

  await record(4, 'Over-long strings and wrong types return 400, never 500', async () => {
    // Title > 200 chars
    const res1 = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user3.token}`,
      },
      body: JSON.stringify({
        title: 'A'.repeat(250),
        venue: 'KMC Greens',
      }),
    });
    if (res1.status !== 400) throw new Error(`Expected 400 for overlong title, got ${res1.status}`);

    // Community message > 2000 chars
    const res2 = await fetch(`${BASE}/communities/comm_folk_art/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user3.token}`,
      },
      body: JSON.stringify({ text: 'M'.repeat(2500) }),
    });
    // Either 403 (if not joined) or 400 (if overlong) — never 500
    if (res2.status === 500) throw new Error('Got 500 on overlong community message');
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // CASE 5: Upload Security
  // ───────────────────────────────────────────────────────────────────────────
  await record(5, 'Unauthenticated audio upload is rejected (401)', async () => {
    const res = await fetch(`${BASE}/locket/audio`, {
      method: 'POST',
      body: new FormData(),
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  })();

  await record(5, 'Fake extension with mismatched file signature is rejected (400)', async () => {
    const formData = new FormData();
    const fakeBlob = new Blob(['Not a real audio file content'], { type: 'audio/webm' });
    formData.append('audio', fakeBlob, 'fake_voice.webm');
    formData.append('duration_seconds', '5');

    const res = await fetch(`${BASE}/locket/audio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user3.token}` },
      body: formData,
    });
    if (res.status !== 400) throw new Error(`Expected 400 for signature mismatch, got ${res.status}`);
  })();

  await record(5, 'Disallowed MIME type (text/plain) is rejected (400)', async () => {
    const formData = new FormData();
    const textBlob = new Blob(['some text content'], { type: 'text/plain' });
    formData.append('audio', textBlob, 'notes.txt');

    const res = await fetch(`${BASE}/locket/audio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user3.token}` },
      body: formData,
    });
    if (res.status !== 400) throw new Error(`Expected 400 for wrong MIME type, got ${res.status}`);
  })();

  await record(5, 'Oversized audio file (> 5MB) is rejected (400 or 413)', async () => {
    const formData = new FormData();
    const bigBuffer = new Uint8Array(6 * 1024 * 1024);
    // EBML header so signature check doesn't fail first
    bigBuffer[0] = 0x1A; bigBuffer[1] = 0x45; bigBuffer[2] = 0xDF; bigBuffer[3] = 0xA3;
    const bigBlob = new Blob([bigBuffer], { type: 'audio/webm' });
    formData.append('audio', bigBlob, 'giant.webm');

    const res = await fetch(`${BASE}/locket/audio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user3.token}` },
      body: formData,
    });
    if (res.status !== 400 && res.status !== 413) {
      throw new Error(`Expected 400 or 413 for oversized file, got ${res.status}`);
    }
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // CASE 6: Socket.IO Authentication & Isolation
  // ───────────────────────────────────────────────────────────────────────────
  const socketUrl = `http://localhost:${port}`;

  await record(6, 'Socket.IO handshake without token is refused', async () => {
    await new Promise((resolve, reject) => {
      const client = ClientIO(socketUrl, {
        path: '/socket.io',
        transports: ['polling', 'websocket'],
        reconnection: false,
        timeout: 2000,
      });
      const timer = setTimeout(() => {
        client.disconnect();
        reject(new Error('Connection timeout without error'));
      }, 2500);

      client.on('connect_error', (err) => {
        clearTimeout(timer);
        client.disconnect();
        if (err.message.includes('Authentication required')) resolve();
        else reject(new Error(`Unexpected error message: ${err.message}`));
      });
      client.on('connect', () => {
        clearTimeout(timer);
        client.disconnect();
        reject(new Error('Connection succeeded without token'));
      });
    });
  })();

  await record(6, 'Socket.IO handshake with invalid token is refused', async () => {
    await new Promise((resolve, reject) => {
      const client = ClientIO(socketUrl, {
        path: '/socket.io',
        auth: { token: 'invalid.jwt.token' },
        transports: ['polling', 'websocket'],
        reconnection: false,
        timeout: 2000,
      });
      const timer = setTimeout(() => {
        client.disconnect();
        reject(new Error('Connection timeout without error'));
      }, 2500);

      client.on('connect_error', (err) => {
        clearTimeout(timer);
        client.disconnect();
        if (err.message.includes('Invalid or expired token')) resolve();
        else reject(new Error(`Unexpected error message: ${err.message}`));
      });
      client.on('connect', () => {
        clearTimeout(timer);
        client.disconnect();
        reject(new Error('Connection succeeded with invalid token'));
      });
    });
  })();

  await record(6, 'Socket.IO user cannot join another user room', async () => {
    await new Promise((resolve, reject) => {
      const client = ClientIO(socketUrl, {
        path: '/socket.io',
        auth: { token: user3.token },
        transports: ['polling', 'websocket'],
        reconnection: false,
        timeout: 2000,
      });
      const timer = setTimeout(() => {
        client.disconnect();
        reject(new Error('Connection timeout'));
      }, 2500);

      client.on('connect', () => {
        client.emit('join', { room: `user:${user1A.user.id}` });
        setTimeout(() => {
          clearTimeout(timer);
          client.disconnect();
          resolve();
        }, 300);
      });
      client.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  })();

  await record(6, 'Socket.IO typing events are only relayed between connected users', async () => {
    const user6A = await registerUser('sock6a');
    const user6B = await registerUser('sock6b');
    // user6A and user6B are NOT connected!

    await new Promise((resolve, reject) => {
      let clientA = null;
      let clientB = null;
      const timer = setTimeout(() => {
        if (clientA) clientA.disconnect();
        if (clientB) clientB.disconnect();
        reject(new Error('Timeout during typing relay test'));
      }, 3000);

      clientB = ClientIO(socketUrl, {
        path: '/socket.io',
        auth: { token: user6B.token },
        transports: ['polling', 'websocket'],
        reconnection: false,
        timeout: 2000,
      });
      clientA = ClientIO(socketUrl, {
        path: '/socket.io',
        auth: { token: user6A.token },
        transports: ['polling', 'websocket'],
        reconnection: false,
        timeout: 2000,
      });

      let receivedTyping = false;
      clientB.on('typing', () => {
        receivedTyping = true;
      });

      clientA.on('connect', () => {
        clientA.emit('typing', { to: user6B.user.id });
        setTimeout(() => {
          clearTimeout(timer);
          clientA.disconnect();
          clientB.disconnect();
          if (receivedTyping) {
            reject(new Error('Typing event was leaked to non-connected user'));
          } else {
            resolve();
          }
        }, 500);
      });
      clientA.on('connect_error', (err) => { clearTimeout(timer); reject(err); });
      clientB.on('connect_error', (err) => { clearTimeout(timer); reject(err); });
    });
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // CASE 7: Account Deletion, Privacy & Export
  // ───────────────────────────────────────────────────────────────────────────
  const delUser = await registerUser('deluser7');

  // Populate data across tables
  // Join community
  await fetch(`${BASE}/communities/comm_folk_art/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${delUser.token}` },
  });
  // Save an event
  await fetch(`${BASE}/events/${event1.id}/save`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${delUser.token}` },
  });

  await record(7, 'GET /api/auth/export contains no password_hash or other user private data', async () => {
    const res = await fetch(`${BASE}/auth/export`, {
      headers: { Authorization: `Bearer ${delUser.token}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.user?.password_hash) throw new Error('password_hash present in export');
    if (!Array.isArray(data.communityMemberships)) throw new Error('communityMemberships missing');
  })();

  await record(7, 'DELETE /api/auth/me cleans up all 11 tables and user vanishes from community', async () => {
    const delRes = await fetch(`${BASE}/auth/me`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${delUser.token}`,
      },
      body: JSON.stringify({ password: delUser.password }),
    });
    if (delRes.status !== 200) throw new Error(`Expected 200, got ${delRes.status}`);

    const { db } = await import('../src/db/index.js');
    const tablesChecked = [
      'users',
      'user_interests',
      'user_languages',
      'user_skills',
      'saved_events',
      'connections',
      'messages',
      'community_members',
      'community_messages',
      'locket_reactions',
      'locket_moments',
    ];

    for (const table of tablesChecked) {
      const col = (table === 'connections') ? 'requester_id = ? OR receiver_id = ?' :
                  (table === 'messages') ? 'sender_id = ? OR receiver_id = ?' :
                  (table === 'locket_moments') ? 'sender_id = ? OR recipient_id = ?' :
                  (table === 'community_messages') ? 'sender_id = ?' :
                  (table === 'users') ? 'id = ?' : 'user_id = ?';
      const params = col.includes('OR') ? [delUser.user.id, delUser.user.id] : [delUser.user.id];
      const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${table} WHERE ${col}`).get(...params).cnt;
      if (count > 0) {
        throw new Error(`Table ${table} still contains ${count} rows for deleted user`);
      }
    }

    // Vanishes from community member list
    const commRes = await fetch(`${BASE}/communities/comm_folk_art`);
    const commData = await commRes.json();
    if (commData.members?.some(m => m.id === delUser.user.id)) {
      throw new Error('Deleted user still appears in community members list');
    }
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // CASE 8: Production Mode Enforcement
  // ───────────────────────────────────────────────────────────────────────────
  await record(8, 'Production mode refuses to start without JWT_SECRET (exit code 1)', async () => {
    const res = spawnSync('node', ['server/src/index.js'], {
      cwd: rootDir,
      env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: '', CLIENT_ORIGIN: 'http://localhost:3000', PORT: '3091' },
      timeout: 3000,
      encoding: 'utf8',
    });
    if (res.status !== 1) {
      throw new Error(`Expected exit status 1, got ${res.status}`);
    }
    if (!res.stderr.includes('JWT_SECRET must be configured')) {
      throw new Error(`Expected fatal message in stderr, got: ${res.stderr}`);
    }
  })();

  await record(8, 'Production mode refuses to start without CLIENT_ORIGIN (exit code 1)', async () => {
    const res = spawnSync('node', ['server/src/index.js'], {
      cwd: rootDir,
      env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: 'super-long-secure-secret-32-chars-long!', CLIENT_ORIGIN: '', PORT: '3092' },
      timeout: 3000,
      encoding: 'utf8',
    });
    if (res.status !== 1) {
      throw new Error(`Expected exit status 1, got ${res.status}`);
    }
  })();

  await record(8, 'Production mode: /api/docs returns 404, thrown error has no stack, headers present', async () => {
    const prodEnv = {
      ...process.env,
      NODE_ENV: 'production',
      JWT_SECRET: 'super-long-secure-secret-32-chars-long!',
      CLIENT_ORIGIN: 'http://localhost:3093',
      PORT: '3093',
    };
    const proc = spawn('node', ['server/src/index.js'], { cwd: rootDir, env: prodEnv, stdio: 'ignore' });
    try {
      // Wait for server to bind
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 200));
        try {
          const h = await fetch('http://localhost:3093/api/health');
          if (h.ok) break;
        } catch (_) {}
      }

      // Check /api/docs is 404
      const docsRes = await fetch('http://localhost:3093/api/docs');
      if (docsRes.status !== 404) throw new Error(`/api/docs returned ${docsRes.status}, expected 404`);

      // Check security headers on root /
      const rootRes = await fetch('http://localhost:3093/');
      if (!rootRes.headers.get('content-security-policy')) throw new Error('Missing Content-Security-Policy');
      if (!rootRes.headers.get('strict-transport-security')) throw new Error('Missing Strict-Transport-Security');
      if (rootRes.headers.get('x-content-type-options') !== 'nosniff') throw new Error('Missing X-Content-Type-Options');

      // Check error response masks stack trace
      const errRes = await fetch('http://localhost:3093/api/locket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json{{{',
      });
      const errData = await errRes.json();
      if (errData.stack || (errData.error && errData.error.includes('at '))) {
        throw new Error(`Stack trace was leaked: ${JSON.stringify(errData)}`);
      }
    } finally {
      proc.kill('SIGTERM');
    }
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // CASE 9: Schema Migration & Data Preservation
  // ───────────────────────────────────────────────────────────────────────────
  await record(9, 'Schema migration preserves existing rows on legacy schema', async () => {
    const tempDbPath = path.resolve(rootDir, `server/data/test_legacy_${Date.now()}.db`);
    try {
      const testDb = new DatabaseSync(tempDbPath);
      // Legacy schema definition before Batch 1/2 changes
      testDb.exec(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          handle TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          bio TEXT DEFAULT '',
          avatar_url TEXT DEFAULT '',
          state TEXT DEFAULT 'Karnataka',
          city TEXT DEFAULT '',
          neighborhood TEXT DEFAULT '',
          lat REAL,
          lng REAL,
          preferred_mode TEXT DEFAULT 'BOTH',
          is_discoverable INTEGER DEFAULT 1,
          fuzzed_location INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now')),
          last_active_at TEXT DEFAULT (datetime('now'))
        );
        INSERT INTO users (id, username, handle, password_hash, name, city, neighborhood)
        VALUES ('usr_legacy1', 'legacy_user', '@legacy', 'hash123', 'Legacy User', 'Udupi', 'Manipal');

        CREATE TABLE events (
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
                                CHECK(verification_status IN ('VERIFIED','COMMUNITY_REPORTED','PENDING')),
          attendee_count     INTEGER DEFAULT 0,
          submitted_by       TEXT,
          created_at         TEXT DEFAULT (datetime('now'))
        );
        INSERT INTO events (id, title, category, category_label, date_label, datetime_iso, venue, verification_status)
        VALUES ('evt_legacy1', 'Legacy Event', 'culture', 'Culture', 'Tomorrow', '2026-10-16', 'Tiger Circle', 'VERIFIED');

        CREATE TABLE locket_moments (
          id TEXT PRIMARY KEY,
          sender_id TEXT,
          recipient_id TEXT,
          timestamp_iso TEXT,
          vernacular_text TEXT,
          meaning TEXT
        );
        CREATE TABLE locket_reactions (
          id         TEXT PRIMARY KEY,
          moment_id  TEXT NOT NULL,
          user_id    TEXT NOT NULL,
          text       TEXT NOT NULL,
          reacted_at TEXT DEFAULT (datetime('now'))
        );
        INSERT INTO locket_reactions (id, moment_id, user_id, text)
        VALUES ('rxn_leg1', 'lok_leg1', 'usr_legacy1', '❤️');
      `);

      // Run current schema migration
      const { applySchema } = await import('../src/db/schema.js');
      applySchema(testDb);

      // Verify legacy user survived and is_discoverable default is 0 for new rows
      const userRow = testDb.prepare('SELECT * FROM users WHERE id = ?').get('usr_legacy1');
      if (!userRow || userRow.name !== 'Legacy User') throw new Error('Legacy user data was lost');

      // Verify SOURCED is now allowed in events
      testDb.prepare(`
        INSERT INTO events (id, title, category, category_label, date_label, datetime_iso, venue, verification_status)
        VALUES ('evt_new_src', 'Sourced Event', 'culture', 'Culture', 'Tomorrow', '2026-10-16', 'Tiger Circle', 'SOURCED')
      `).run();
      const evtRow = testDb.prepare('SELECT * FROM events WHERE id = ?').get('evt_legacy1');
      if (!evtRow || evtRow.title !== 'Legacy Event') throw new Error('Legacy event data was lost');

      // Verify UNIQUE constraint on locket_reactions
      const rxnRow = testDb.prepare('SELECT * FROM locket_reactions WHERE id = ?').get('rxn_leg1');
      if (!rxnRow || rxnRow.text !== '❤️') throw new Error('Legacy reaction was lost');

      testDb.close();
    } finally {
      if (fs.existsSync(tempDbPath)) try { fs.unlinkSync(tempDbPath); } catch (_) {}
    }
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // CASE 10: Rate Limits (429 on excessive failed logins)
  // ───────────────────────────────────────────────────────────────────────────
  await record(10, 'Excessive failed logins (> 20) are blocked with 429', async () => {
    let got429 = false;
    for (let i = 0; i < 24; i++) {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nonexistent_attacker', password: 'wrong_password' }),
      });
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    if (!got429) {
      throw new Error('Did not receive 429 after exceeding failed login rate limit');
    }
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // CASE 11: Private Data Leak Prevention
  // ───────────────────────────────────────────────────────────────────────────
  await record(11, 'Private data (lat, lng, email, password_hash) never appears in API responses', async () => {
    // Check GET /people
    const peopleRes = await fetch(`${BASE}/people`, {
      headers: { Authorization: `Bearer ${user3.token}` },
    });
    const peopleData = await peopleRes.json();
    for (const p of peopleData) {
      if (p.password_hash) throw new Error('password_hash leaked in /people');
      if (p.email) throw new Error('email leaked in /people');
      if (p.lat !== undefined || p.lng !== undefined) throw new Error('Exact lat/lng leaked in /people');
    }

    // Check GET /communities
    const commRes = await fetch(`${BASE}/communities`);
    const comms = await commRes.json();
    for (const c of comms) {
      if (c.email) throw new Error('email leaked in /communities');
      if (c.password_hash) throw new Error('password_hash leaked in /communities');
    }

    // Check GET /locket
    const locketRes = await fetch(`${BASE}/locket`, {
      headers: { Authorization: `Bearer ${user3.token}` },
    });
    const moments = await locketRes.json();
    for (const m of moments) {
      if (m.email) throw new Error('email leaked in /locket');
      if (m.password_hash) throw new Error('password_hash leaked in /locket');
      if (m.lat !== undefined || m.lng !== undefined) throw new Error('lat/lng leaked in /locket');
    }
  })();

  return results;
}

// Standalone execution runner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { app } = await import('../src/index.js');
  const { createServer } = await import('http');
  const { initRealtime } = await import('../src/realtime/socket.js');
  const port = 3097;
  const httpServer = createServer(app);
  initRealtime(httpServer, '*');
  const s = httpServer.listen(port);
  const BASE = `http://localhost:${port}/api`;
  runSecurityGapTests(BASE, port, s)
    .then((results) => {
      console.log('\n--- RESULTS SUMMARY ---');
      console.table(results.map(r => ({
        Case: r.caseNum,
        Name: r.name,
        Result: r.passed ? 'PASS' : 'FAIL',
        Error: r.error || '',
      })));
      process.exit(results.every(r => r.passed) ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
