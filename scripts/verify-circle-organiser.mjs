// scripts/verify-circle-organiser.mjs
// Run with: node scripts/verify-circle-organiser.mjs

const BASE = 'http://127.0.0.1:3001/api';

console.log('\n🔍 --- VERIFYING "CONNECT WITH CIRCLE ORGANISER" FEATURE ---\n');

async function run() {
  try {
    // 1. Check health
    const healthRes = await fetch(`${BASE}/health`);
    if (!healthRes.ok) throw new Error('Server not responding. Ensure dev server is running on port 3001.');
    console.log('✅ 1. Server is running & healthy.');

    // 2. Fetch communities list
    const commsRes = await fetch(`${BASE}/communities`);
    const comms = await commsRes.json();
    console.log(`✅ 2. Communities fetched (${comms.length} circles found)`);

    // Check the 3 circles from the user screenshot:
    // - Events Around Manipal (comm_loc_manipal) -> Arjun Nayak
    // - Indian Music & Festivals (comm_classical_music) -> Vikram Rao / Vikram Joshi
    // - Art & Folk Traditions (comm_folk_art) -> Kavya Pillai / Kavya Bopanna
    const manipalCircle = comms.find(c => c.id === 'comm_loc_manipal');
    const musicCircle = comms.find(c => c.id === 'comm_classical_music');
    const artCircle = comms.find(c => c.id === 'comm_folk_art');

    if (!manipalCircle?.organizerUser) throw new Error('organizerUser missing for Events Around Manipal');
    if (!musicCircle?.organizerUser) throw new Error('organizerUser missing for Indian Music & Festivals');
    if (!artCircle?.organizerUser) throw new Error('organizerUser missing for Art & Folk Traditions');

    console.log(`✅ 3. Circle Organisers properly attached:`);
    console.log(`      - Events Around Manipal:     ${manipalCircle.organizerUser.name} (${manipalCircle.organizerUser.handle}) - Role: ${manipalCircle.organizerUser.role}`);
    console.log(`      - Indian Music & Festivals:  ${musicCircle.organizerUser.name} (${musicCircle.organizerUser.handle}) - Role: ${musicCircle.organizerUser.role}`);
    console.log(`      - Art & Folk Traditions:     ${artCircle.organizerUser.name} (${artCircle.organizerUser.handle}) - Role: ${artCircle.organizerUser.role}`);

    // 4. Verify privacy constraints (No private email or phone numbers exposed)
    for (const c of [manipalCircle, musicCircle, artCircle]) {
      const org = c.organizerUser;
      if (org.email || org.phone || org.password_hash) {
        throw new Error(`Privacy violation: Contact info leaked in circle ${c.id}`);
      }
    }
    console.log('✅ 4. Privacy constraint verified: No private email or phone numbers exposed.');

    // 5. Authenticate as Rohan
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'rohan', password: 'demo1234' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log(`✅ 5. Logged in as user: ${loginData.user.name}`);

    // 6. Test direct communication with circle organiser (e.g. Arjun Nayak or Vikram Rao)
    const testMessage = `Hello ${manipalCircle.organizerUser.name}, I am reaching out regarding the "${manipalCircle.name}" circle.`;
    const sendRes = await fetch(`${BASE}/messages/${manipalCircle.organizerUser.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text: testMessage })
    });
    if (!sendRes.ok) {
      const err = await sendRes.json();
      throw new Error(`Failed to message circle organiser: ${JSON.stringify(err)}`);
    }
    const sentMsg = await sendRes.json();
    console.log(`✅ 6. Message successfully sent to circle organiser! ID: ${sentMsg.id}`);

    // 7. Verify message thread retrieval
    const threadRes = await fetch(`${BASE}/messages/${manipalCircle.organizerUser.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const thread = await threadRes.json();
    const containsMsg = thread.messages.some(m => m.id === sentMsg.id);
    if (!containsMsg) throw new Error('Sent message not found in thread');
    console.log(`✅ 7. Thread verified: message is present with partner ${thread.partner.name}.`);

    console.log('\n🎉 ALL 7 CIRCLE ORGANISER VERIFICATION CHECKS PASSED!\n');
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.message);
    process.exit(1);
  }
}

run();
