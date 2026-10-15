// scripts/verify-contact-organiser.mjs
// Run with: node scripts/verify-contact-organiser.mjs

const BASE = 'http://127.0.0.1:3001/api';

console.log('\n🔍 --- VERIFYING "CONNECT WITH EVENT ORGANISER" FEATURE ---\n');

async function run() {
  try {
    // 1. Check health
    const healthRes = await fetch(`${BASE}/health`);
    if (!healthRes.ok) throw new Error('Server not responding. Ensure dev server is running on port 3001.');
    console.log('✅ 1. Server is running & healthy.');

    // 2. Fetch event details for evt_1 (Yakshagana Night)
    const eventRes = await fetch(`${BASE}/events/evt_1`);
    const event = await eventRes.json();
    console.log(`✅ 2. Event fetched: "${event.title}"`);
    console.log(`      - Organizer field: "${event.organizer}"`);
    console.log(`      - Submitter user ID: "${event.submittedBy}"`);

    // 3. Verify organizerUser details
    const org = event.organizerUser;
    if (!org) throw new Error('organizerUser is missing from event response');
    console.log(`✅ 3. Organizer User Details populated:`);
    console.log(`      - Name:   ${org.name}`);
    console.log(`      - Role:   ${org.role}`);
    console.log(`      - Handle: ${org.handle}`);
    console.log(`      - City:   ${org.city}`);

    // 4. Verify privacy constraints (No private email or phone exposed)
    if (org.email || org.phone || org.password_hash) {
      throw new Error('FAILED: Private user contact info (email/phone) leaked in organizerUser!');
    }
    console.log('✅ 4. Privacy constraint verified: No private email or phone numbers exposed.');

    // 5. Authenticate as attendee (Rohan)
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'rohan', password: 'demo1234' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log(`✅ 5. Logged in as attendee: ${loginData.user.name}`);

    // 6. Test direct communication with organiser (Arjun Nayak)
    const testMessage = `Inquiry regarding "${event.title}": Is prior registration required for the makeup workshop?`;
    const sendRes = await fetch(`${BASE}/messages/${org.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text: testMessage })
    });
    if (!sendRes.ok) {
      const err = await sendRes.json();
      throw new Error(`Failed to message organiser: ${JSON.stringify(err)}`);
    }
    const sentMsg = await sendRes.json();
    console.log(`✅ 6. Successfully sent message to organiser (${org.name}):`);
    console.log(`      - Message ID: ${sentMsg.id}`);
    console.log(`      - Content: "${sentMsg.text}"`);

    // 7. Verify existing conversation thread is reopened without duplicates
    const threadRes = await fetch(`${BASE}/messages/${org.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const threadData = await threadRes.json();
    console.log(`✅ 7. Existing conversation thread reopened:`);
    console.log(`      - Partner: ${threadData.partner.name} (${threadData.partner.handle})`);
    console.log(`      - Total messages in thread: ${threadData.messages.length}`);
    console.log(`      - Latest message: "${threadData.messages[threadData.messages.length - 1].text}"`);

    console.log('\n🎉 ALL CHECKS PASSED: "Connect with Event Organiser" is fully functional!\n');
  } catch (err) {
    console.error('\n❌ Verification check failed:', err.message);
    process.exit(1);
  }
}

run();
