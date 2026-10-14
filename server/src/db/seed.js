// server/src/db/seed.js
// Run with: npm run db:seed (from server/) or npm run db:seed --workspace=server
// Seeds all initial data from the frontend's initialData.js equivalent.
// Safe to run multiple times — uses INSERT OR IGNORE.

import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { db } from './index.js';

console.log('[Seed] Starting database seed...');

const HASH_ROUNDS = 10;

// ─── Seed Users ───────────────────────────────────────────────────────────────
const users = [
  {
    id: 'usr_rohan',
    username: 'rohan',
    handle: '@rohan_coastal',
    password: 'demo1234',
    name: 'Rohan Shenoy',
    bio: 'First-year CS student from Mangalore. Miss speaking Tulu, passionate about Yakshagana music and coastal folklore.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    city: 'Manipal',
    neighborhood: 'Academic Block 3 / MIT Campus',
    lat: 13.3525,
    lng: 74.7928,
    preferred_mode: 'BOTH',
    is_discoverable: 1,
    fuzzed_location: 1,
  },
  {
    id: 'usr_priya',
    username: 'priya',
    handle: '@priya_tuluva',
    password: 'demo1234',
    name: 'Priya Sharma',
    bio: 'Native Tulu & Konkani speaker, final year B.Pharm. Loves sharing folklore stories and helping beginners learn regional dialects.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    city: 'Manipal',
    neighborhood: 'Manipal Academic Zone',
    lat: 13.3530,
    lng: 74.7910,
    preferred_mode: 'BOTH',
    is_discoverable: 1,
    fuzzed_location: 1,
  },
  {
    id: 'usr_arjun',
    username: 'arjun',
    handle: '@arjun_yaksha',
    password: 'demo1234',
    name: 'Arjun Nayak',
    bio: 'Yakshagana Tala performer & 3rd-year Mechatronics student. Preserving the Maddale drumming rhythms and makeup styles.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    city: 'Manipal',
    neighborhood: 'End Point Road',
    lat: 13.3610,
    lng: 74.7890,
    preferred_mode: 'IN_PERSON',
    is_discoverable: 1,
    fuzzed_location: 1,
  },
  {
    id: 'usr_ananya',
    username: 'ananya',
    handle: '@ananya_culinary',
    password: 'demo1234',
    name: 'Ananya Hegde',
    bio: 'Food historian and amateur botanist exploring wild coastal greens and heirloom Uttara Kannada pickles.',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    city: 'Manipal',
    neighborhood: 'Tiger Circle',
    lat: 13.3540,
    lng: 74.7890,
    preferred_mode: 'BOTH',
    is_discoverable: 1,
    fuzzed_location: 1,
  },
  {
    id: 'usr_kavya',
    username: 'kavya',
    handle: '@kavya_kodava',
    password: 'demo1234',
    name: 'Kavya Pillai',
    bio: 'Kodava speaker from Coorg studying Architecture. Documenting traditional Ainmane ancestral wooden houses.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    city: 'Manipal',
    neighborhood: 'Eshwar Nagar',
    lat: 13.3490,
    lng: 74.7960,
    preferred_mode: 'BOTH',
    is_discoverable: 1,
    fuzzed_location: 1,
  },
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users
    (id, username, handle, password_hash, name, bio, avatar_url, city, neighborhood,
     lat, lng, preferred_mode, is_discoverable, fuzzed_location)
  VALUES
    (@id, @username, @handle, @password_hash, @name, @bio, @avatar_url, @city,
     @neighborhood, @lat, @lng, @preferred_mode, @is_discoverable, @fuzzed_location)
`);

for (const u of users) {
  const password_hash = bcrypt.hashSync(u.password, HASH_ROUNDS);
  insertUser.run({ ...u, password_hash });
}
console.log(`[Seed] Inserted ${users.length} users`);

// ─── Seed User Interests ──────────────────────────────────────────────────────
const interestData = [
  { user_id: 'usr_rohan', interest_id: 'culture',   intention: 'NATIVE_SPEAKER' },
  { user_id: 'usr_rohan', interest_id: 'languages', intention: 'WANTS_TO_LEARN' },
  { user_id: 'usr_rohan', interest_id: 'crafts',    intention: 'WANTS_TO_LEARN' },
  { user_id: 'usr_rohan', interest_id: 'music',     intention: 'CASUAL_ENTHUSIAST' },
  { user_id: 'usr_rohan', interest_id: 'food',      intention: 'CASUAL_ENTHUSIAST' },

  { user_id: 'usr_priya', interest_id: 'languages', intention: 'WILLING_TO_TEACH' },
  { user_id: 'usr_priya', interest_id: 'culture',   intention: 'NATIVE_SPEAKER' },
  { user_id: 'usr_priya', interest_id: 'music',     intention: 'CASUAL_ENTHUSIAST' },

  { user_id: 'usr_arjun', interest_id: 'culture',   intention: 'NATIVE_SPEAKER' },
  { user_id: 'usr_arjun', interest_id: 'crafts',    intention: 'WILLING_TO_TEACH' },
  { user_id: 'usr_arjun', interest_id: 'music',     intention: 'WILLING_TO_TEACH' },

  { user_id: 'usr_ananya', interest_id: 'food',      intention: 'WILLING_TO_TEACH' },
  { user_id: 'usr_ananya', interest_id: 'culture',   intention: 'CASUAL_ENTHUSIAST' },
  { user_id: 'usr_ananya', interest_id: 'workshops', intention: 'WILLING_TO_TEACH' },

  { user_id: 'usr_kavya', interest_id: 'crafts',    intention: 'WILLING_TO_TEACH' },
  { user_id: 'usr_kavya', interest_id: 'languages', intention: 'WILLING_TO_TEACH' },
  { user_id: 'usr_kavya', interest_id: 'culture',   intention: 'CASUAL_ENTHUSIAST' },
];

const insertInterest = db.prepare(`
  INSERT OR IGNORE INTO user_interests (user_id, interest_id, intention)
  VALUES (@user_id, @interest_id, @intention)
`);
for (const i of interestData) insertInterest.run(i);
console.log(`[Seed] Inserted ${interestData.length} user interests`);

// ─── Seed User Languages ──────────────────────────────────────────────────────
const languageData = [
  { user_id: 'usr_rohan',  language: 'Kannada' },
  { user_id: 'usr_rohan',  language: 'English' },
  { user_id: 'usr_priya',  language: 'Tulu' },
  { user_id: 'usr_priya',  language: 'Konkani' },
  { user_id: 'usr_priya',  language: 'Kannada' },
  { user_id: 'usr_priya',  language: 'English' },
  { user_id: 'usr_arjun',  language: 'Kannada' },
  { user_id: 'usr_arjun',  language: 'Tulu' },
  { user_id: 'usr_arjun',  language: 'English' },
  { user_id: 'usr_ananya', language: 'Kannada' },
  { user_id: 'usr_ananya', language: 'Havigannada' },
  { user_id: 'usr_ananya', language: 'English' },
  { user_id: 'usr_kavya',  language: 'Kodava' },
  { user_id: 'usr_kavya',  language: 'Kannada' },
  { user_id: 'usr_kavya',  language: 'English' },
];
const insertLang = db.prepare(`
  INSERT OR IGNORE INTO user_languages (user_id, language) VALUES (@user_id, @language)
`);
for (const l of languageData) insertLang.run(l);

// ─── Seed User Skills ─────────────────────────────────────────────────────────
const skillData = [
  { user_id: 'usr_priya',  skill: 'Conversational Tulu',   skill_type: 'TEACH' },
  { user_id: 'usr_priya',  skill: 'Coastal Proverbs',      skill_type: 'TEACH' },
  { user_id: 'usr_priya',  skill: 'Terracotta Pottery',    skill_type: 'LEARN' },
  { user_id: 'usr_priya',  skill: 'Calligraphy',           skill_type: 'LEARN' },
  { user_id: 'usr_arjun',  skill: 'Yakshagana Maddale Beats',   skill_type: 'TEACH' },
  { user_id: 'usr_arjun',  skill: 'Traditional Mask Painting',  skill_type: 'TEACH' },
  { user_id: 'usr_arjun',  skill: 'Python AI Audio Processing', skill_type: 'LEARN' },
  { user_id: 'usr_ananya', skill: 'Heirloom Spice Blending',    skill_type: 'TEACH' },
  { user_id: 'usr_ananya', skill: 'Foraged Greens Cooking',     skill_type: 'TEACH' },
  { user_id: 'usr_ananya', skill: 'Documentary Photography',    skill_type: 'LEARN' },
  { user_id: 'usr_kavya',  skill: 'Kodava Greetings & Proverbs', skill_type: 'TEACH' },
  { user_id: 'usr_kavya',  skill: 'Yakshagana Costumes',        skill_type: 'LEARN' },
];
const insertSkill = db.prepare(`
  INSERT OR IGNORE INTO user_skills (user_id, skill, skill_type)
  VALUES (@user_id, @skill, @skill_type)
`);
for (const s of skillData) insertSkill.run(s);
console.log('[Seed] Inserted languages and skills');

// ─── Seed Connections ─────────────────────────────────────────────────────────
const connectionData = [
  { id: uuid(), requester_id: 'usr_rohan', receiver_id: 'usr_priya', status: 'CONNECTED' },
  { id: uuid(), requester_id: 'usr_rohan', receiver_id: 'usr_arjun', status: 'CONNECTED' },
];
const insertConn = db.prepare(`
  INSERT OR IGNORE INTO connections (id, requester_id, receiver_id, status)
  VALUES (@id, @requester_id, @receiver_id, @status)
`);
for (const c of connectionData) insertConn.run(c);
console.log(`[Seed] Inserted ${connectionData.length} connections`);

// ─── Seed Events ──────────────────────────────────────────────────────────────
const events = [
  {
    id: 'evt_1',
    title: 'Yakshagana Prasanga & Live Makeup Demonstration',
    category: 'culture',
    category_label: 'Culture & Heritage',
    date_label: 'Saturday, Oct 18 • 5:30 PM',
    datetime_iso: '2026-10-18T17:30:00',
    venue: 'MIT Student Quadrangle (Open Amphitheatre)',
    neighborhood: 'MIT Campus, Manipal',
    lat: 13.3518, lng: 74.7932,
    is_online: 0,
    organizer: 'Yakshagana Kendra & MAHE Cultural Society',
    image_url: 'https://images.unsplash.com/photo-1609137144822-0d1279a099f6?w=800&auto=format&fit=crop&q=80',
    description: 'Witness the breathtaking transformation of coastal Karnataka folklore! Renowned artists showcase the 3-hour natural herbal makeup ritual (Bannada Vesha) followed by an authentic Tala Maddale performance.',
    source_url: 'https://reddit.com/r/manipal/comments/cultural_meetup_yakshagana',
    source_label: 'Verified MAHE Club Notice',
    verification_status: 'VERIFIED',
    attendee_count: 142,
    submitted_by: null,
  },
  {
    id: 'evt_2',
    title: 'Tulu Bhasha Koota: Conversational Circle for Beginners',
    category: 'languages',
    category_label: 'Dialects & Languages',
    date_label: 'Sunday, Oct 19 • 11:00 AM',
    datetime_iso: '2026-10-19T11:00:00',
    venue: 'KMC Greens Gazebo, Near Tiger Circle',
    neighborhood: 'Tiger Circle, Manipal',
    lat: 13.3541, lng: 74.7895,
    is_online: 0,
    organizer: 'Coastal Dialects Preservation Circle',
    image_url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=80',
    description: 'Moved to coastal Karnataka and want to speak like a local? Join native speakers sharing essential colloquial idioms, market banter, and coastal humor over hot filter coffee.',
    source_url: 'https://reddit.com/r/manipal/comments/tulu_learning_circle',
    source_label: 'r/manipal Community Post',
    verification_status: 'COMMUNITY_REPORTED',
    attendee_count: 38,
    submitted_by: null,
  },
  {
    id: 'evt_3',
    title: 'Heirloom Coastal Cuisine: Neer Dosa & Ghee Roast Masterclass',
    category: 'food',
    category_label: 'Culinary Heritage',
    date_label: 'Friday, Oct 24 • 4:00 PM',
    datetime_iso: '2026-10-24T16:00:00',
    venue: 'Welcomgroup School of Hotel Administration (WGSHA)',
    neighborhood: 'Valley View, Manipal',
    lat: 13.3482, lng: 74.7954,
    is_online: 0,
    organizer: 'Chef Ananya Rao (WGSHA Alum)',
    image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    description: 'Learn the delicate secrets of grinding batter for paper-thin Neer Dosas and the ancestral slow-roast Kundapura spice mix directly from regional home cooks.',
    source_url: 'https://instagram.com/wgsha_culinary_heritage',
    source_label: 'Verified Department Workshop',
    verification_status: 'VERIFIED',
    attendee_count: 75,
    submitted_by: null,
  },
  {
    id: 'evt_4',
    title: 'Manipal Hackathon 2026: Tech & Culture Track Showcase',
    category: 'hackathons',
    category_label: 'Technology & Hackathons',
    date_label: 'Wednesday, Oct 22 • 9:00 AM',
    datetime_iso: '2026-10-22T09:00:00',
    venue: 'TMA Pai Innovation Centre, Hall 3',
    neighborhood: 'Academic Area, Manipal',
    lat: 13.3533, lng: 74.7915,
    is_online: 0,
    organizer: 'M# 2026 Organizing Committee',
    image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    description: 'Over 50 teams present AI, IoT, and community solutions connecting youth to living cultural heritage and sustainable urbanization.',
    source_url: 'https://hackathon.manipal.edu/round2',
    source_label: 'Official Hackathon Portal',
    verification_status: 'VERIFIED',
    attendee_count: 220,
    submitted_by: null,
  },
  {
    id: 'evt_5',
    title: 'Traditional Terracotta Pottery & Clay Sculpting Workshop',
    category: 'crafts',
    category_label: 'Traditional Crafts',
    date_label: 'Sunday, Oct 26 • 2:00 PM',
    datetime_iso: '2026-10-26T14:00:00',
    venue: 'Hastashilpa Heritage Village Artisans Shed',
    neighborhood: 'Heritage Village, Manipal',
    lat: 13.3592, lng: 74.7985,
    is_online: 0,
    organizer: 'Hastashilpa Heritage Trust',
    image_url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
    description: 'Sit at the manual wooden wheel under master potter Mahadeva. Learn the ancient coil and throw methods passed through three generations.',
    source_url: 'https://hastashilpa.org/workshops',
    source_label: 'Verified Heritage Trust',
    verification_status: 'VERIFIED',
    attendee_count: 28,
    submitted_by: null,
  },
  {
    id: 'evt_6',
    title: 'Sunset Carnatic Flute & Fusion Jam Session',
    category: 'music',
    category_label: 'Folk & Classical Music',
    date_label: 'Saturday, Oct 25 • 6:00 PM',
    datetime_iso: '2026-10-25T18:00:00',
    venue: 'End Point Cliffs Overlooking Swarna River',
    neighborhood: 'End Point Park, Manipal',
    lat: 13.3642, lng: 74.7876,
    is_online: 0,
    organizer: 'Manipal Music Circle & Acoustic Club',
    image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    description: 'An open-air sunset gathering blending classical Ragas with acoustic guitars. Bring your flute, tambourine, or just sit on the grass and listen to the river breeze.',
    source_url: 'https://reddit.com/r/manipal/comments/acoustic_sunset_jam',
    source_label: 'r/manipal Music Thread',
    verification_status: 'COMMUNITY_REPORTED',
    attendee_count: 95,
    submitted_by: null,
  },
];

const insertEvent = db.prepare(`
  INSERT OR IGNORE INTO events
    (id, title, category, category_label, date_label, datetime_iso, venue, neighborhood,
     lat, lng, is_online, organizer, image_url, description, source_url, source_label,
     verification_status, attendee_count, submitted_by)
  VALUES
    (@id, @title, @category, @category_label, @date_label, @datetime_iso, @venue,
     @neighborhood, @lat, @lng, @is_online, @organizer, @image_url, @description,
     @source_url, @source_label, @verification_status, @attendee_count, @submitted_by)
`);
for (const e of events) insertEvent.run(e);
console.log(`[Seed] Inserted ${events.length} events`);

// ─── Seed Saved Events ────────────────────────────────────────────────────────
const savedData = [
  { user_id: 'usr_rohan', event_id: 'evt_1' },
  { user_id: 'usr_rohan', event_id: 'evt_3' },
];
const insertSaved = db.prepare(`
  INSERT OR IGNORE INTO saved_events (user_id, event_id) VALUES (@user_id, @event_id)
`);
for (const s of savedData) insertSaved.run(s);

// ─── Seed Locket Moments ──────────────────────────────────────────────────────
const lockets = [
  {
    id: 'lok_1',
    sender_id: 'usr_priya',
    recipient_id: 'usr_rohan',
    moment_type: 'WORD_OF_DAY',
    title: 'Tulu Word of the Day',
    vernacular_text: 'ಎಂಚ ಉಲ್ಲರ್? (Encha Uller?)',
    phonetic_text: '/en-cha ul-ler/',
    meaning: 'How are you? (Polite & respectful greeting used with peers and elders alike)',
    provenance: 'Shared from her grandmother in Udupi',
    audio_url: '',
    image_url: '',
    audio_duration: '0:04',
    timestamp_iso: datetime_2h_ago(),
  },
  {
    id: 'lok_2',
    sender_id: 'usr_arjun',
    recipient_id: 'usr_rohan',
    moment_type: 'CRAFT_STEP',
    title: 'Yakshagana Crown (Kireeta) Gold Leafing',
    vernacular_text: 'ಕಿರೀಟ ಕಸೂತಿ (Kireeta Kasooti)',
    phonetic_text: '',
    meaning: 'Applying natural gum and beaten metal foil to the hand-carved teak wood crown.',
    provenance: 'Practiced at the artisan shed near Saligrama',
    audio_url: '',
    image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    audio_duration: '',
    timestamp_iso: yesterday_iso(),
  },
];

function datetime_2h_ago() {
  return new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
}
function yesterday_iso() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

const insertLocket = db.prepare(`
  INSERT OR IGNORE INTO locket_moments
    (id, sender_id, recipient_id, moment_type, title, vernacular_text, phonetic_text,
     meaning, provenance, audio_url, image_url, audio_duration, timestamp_iso)
  VALUES
    (@id, @sender_id, @recipient_id, @moment_type, @title, @vernacular_text, @phonetic_text,
     @meaning, @provenance, @audio_url, @image_url, @audio_duration, @timestamp_iso)
`);
for (const l of lockets) insertLocket.run(l);
console.log(`[Seed] Inserted ${lockets.length} locket moments`);

// ─── Seed Messages ────────────────────────────────────────────────────────────
const messages = [
  { id: uuid(), sender_id: 'usr_priya', receiver_id: 'usr_rohan', text: 'Namaskara Rohan! Saw that you want to practice conversational Tulu.',        sent_at: msg_time(-15), is_read: 1 },
  { id: uuid(), sender_id: 'usr_rohan', receiver_id: 'usr_priya', text: 'Yes! I moved here from Bangalore and really want to understand the coastal slangs.', sent_at: msg_time(-10), is_read: 1 },
  { id: uuid(), sender_id: 'usr_priya', receiver_id: 'usr_rohan', text: 'Awesome! I just sent a voice snippet on our Culture Locket. Practice saying "Encha Uller?" 😄', sent_at: msg_time(-5), is_read: 1 },
  { id: uuid(), sender_id: 'usr_priya', receiver_id: 'usr_rohan', text: `Let's meet at KMC Greens for the dialect circle this Sunday!`, sent_at: msg_time(-1), is_read: 0 },
  { id: uuid(), sender_id: 'usr_arjun', receiver_id: 'usr_rohan', text: 'Hey Rohan, are you attending the Yakshagana demo on Saturday?', sent_at: msg_time_days(-1, 30), is_read: 1 },
  { id: uuid(), sender_id: 'usr_rohan', receiver_id: 'usr_arjun', text: 'Yes, saved it on my ShareSpot calendar! Looking forward to seeing the live makeup.', sent_at: msg_time_days(-1, 25), is_read: 1 },
  { id: uuid(), sender_id: 'usr_arjun', receiver_id: 'usr_rohan', text: 'I will bring the Maddale drum to the MIT Quadrangle demo.', sent_at: msg_time_days(-1, 20), is_read: 1 },
];

function msg_time(minutesAgo) {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}
function msg_time_days(daysAgo, minutesAgo) {
  return new Date(Date.now() - daysAgo * 86400000 - minutesAgo * 60000).toISOString();
}

const insertMsg = db.prepare(`
  INSERT OR IGNORE INTO messages (id, sender_id, receiver_id, text, sent_at, is_read)
  VALUES (@id, @sender_id, @receiver_id, @text, @sent_at, @is_read)
`);
for (const m of messages) insertMsg.run(m);
console.log(`[Seed] Inserted ${messages.length} messages`);

console.log('[Seed] ✅ Database seeded successfully!');
console.log('[Seed] Demo accounts: rohan/demo1234 · priya/demo1234 · arjun/demo1234');
