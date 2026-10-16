// server/src/db/seed.js
// Run with: npm run db:seed (from server/) or npm run db:seed --workspace=server
// Seeds realistic demo data — Karnataka-first, but reaching across India, to
// exercise every signal in the match engine (shared interests, skill
// exchange, language overlap, same-city/same-state proximity, and mutual
// connections). Safe to run multiple times — uses INSERT OR IGNORE.

import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { db } from './index.js';

if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  console.log('[Seed] Demo seeding disabled in production. Set ALLOW_DEMO_SEED=true to override.');
  process.exit(0);
}

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
    bio: 'Software engineer in Bengaluru, originally from Mangaluru. Trying to hold onto Tulu and coastal folklore while living in the city.',
    avatar_url: '/avatars/rohan.jpg',
    state: 'Karnataka',
    city: 'Bengaluru',
    neighborhood: 'Indiranagar',
    lat: 12.9716,
    lng: 77.5946,
    preferred_mode: 'BOTH',
    is_discoverable: 1,
    fuzzed_location: 1,
    is_admin: 1,
  },
  {
    id: 'usr_priya',
    username: 'priya',
    handle: '@priya_tuluva',
    password: 'demo1234',
    name: 'Priya Sharma',
    bio: 'Native Tulu & Konkani speaker in Mangaluru. Loves sharing folklore stories and helping beginners learn coastal dialects.',
    avatar_url: '/avatars/priya.jpg',
    state: 'Karnataka',
    city: 'Mangaluru',
    neighborhood: 'Kadri',
    lat: 12.9141,
    lng: 74.8560,
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
    bio: 'Yakshagana Tala performer in Udupi. Preserving the Maddale drumming rhythms and traditional makeup styles.',
    avatar_url: '/avatars/arjun.jpg',
    state: 'Karnataka',
    city: 'Udupi',
    neighborhood: 'Kadiyali',
    lat: 13.3409,
    lng: 74.7421,
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
    bio: 'Food historian in Mysuru exploring heirloom Karnataka recipes and running community cooking circles.',
    avatar_url: '/avatars/ananya.jpg',
    state: 'Karnataka',
    city: 'Mysuru',
    neighborhood: 'Vijayanagar',
    lat: 12.2958,
    lng: 76.6394,
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
    bio: 'Kodava speaker and architect in Madikeri, documenting traditional Ainmane ancestral wooden houses of Kodagu.',
    avatar_url: '/avatars/kavya.jpg',
    state: 'Karnataka',
    city: 'Madikeri',
    neighborhood: 'Mahadevpet',
    lat: 12.4244,
    lng: 75.7382,
    preferred_mode: 'BOTH',
    is_discoverable: 1,
    fuzzed_location: 1,
  },
  {
    id: 'usr_vikram',
    username: 'vikram',
    handle: '@vikram_builds',
    password: 'demo1234',
    name: 'Vikram Rao',
    bio: 'Hackathon organizer in Hubballi. Teaches Python to first-time coders and is slowly learning Hindustani classical music.',
    avatar_url: '/avatars/vikram.jpg',
    state: 'Karnataka',
    city: 'Hubballi',
    neighborhood: 'Vidyanagar',
    lat: 15.3647,
    lng: 75.1240,
    preferred_mode: 'ONLINE',
    is_discoverable: 1,
    fuzzed_location: 1,
  },
  {
    id: 'usr_aditya',
    username: 'aditya',
    handle: '@aditya_blr',
    password: 'demo1234',
    name: 'Aditya Kulkarni',
    bio: 'New to Bengaluru, working in tech and wanting to pick up basic Tulu and Kannada from people around the city.',
    avatar_url: '/avatars/aditya.jpg',
    state: 'Karnataka',
    city: 'Bengaluru',
    neighborhood: 'Koramangala',
    lat: 12.9352,
    lng: 77.6245,
    preferred_mode: 'BOTH',
    is_discoverable: 1,
    fuzzed_location: 1,
  },
  {
    id: 'usr_meera',
    username: 'meera',
    handle: '@meera_sings',
    password: 'demo1234',
    name: 'Meera Joshi',
    bio: 'Folk singer in Mumbai, curious about coastal Karnataka dialects and always happy to trade a song for a phrase.',
    avatar_url: '/avatars/meera.jpg',
    state: 'Maharashtra',
    city: 'Mumbai',
    neighborhood: 'Bandra',
    lat: 19.0596,
    lng: 72.8295,
    preferred_mode: 'ONLINE',
    is_discoverable: 1,
    fuzzed_location: 1,
  },
];

const insertUser = db.prepare(`
  INSERT INTO users
    (id, username, handle, password_hash, name, bio, avatar_url, state, city, neighborhood,
     lat, lng, preferred_mode, is_discoverable, fuzzed_location, is_admin)
  VALUES
    (@id, @username, @handle, @password_hash, @name, @bio, @avatar_url, @state, @city,
     @neighborhood, @lat, @lng, @preferred_mode, @is_discoverable, @fuzzed_location, @is_admin)
  ON CONFLICT(id) DO UPDATE SET
    avatar_url = excluded.avatar_url,
    is_admin = excluded.is_admin
`);

for (const u of users) {
  const password_hash = bcrypt.hashSync(u.password, HASH_ROUNDS);
  const { password, ...rest } = u;  // strip plain password — not a DB column
  insertUser.run({ ...rest, is_admin: u.is_admin || 0, password_hash });
}
// Strictly enforce that exactly 1 user (Rohan Shenoy) is platform administrator
db.exec(`UPDATE users SET is_admin = 1 WHERE username = 'rohan' OR id = 'usr_rohan'`);
db.exec(`UPDATE users SET is_admin = 0 WHERE username != 'rohan' AND id != 'usr_rohan'`);
console.log(`[Seed] Inserted ${users.length} users (1 Admin: rohan)`);

// ─── Seed User Interests (drives Jaccard overlap scoring) ─────────────────────
const interestData = [
  { user_id: 'usr_rohan',  interest_id: 'languages',  intention: 'WANTS_TO_LEARN' },
  { user_id: 'usr_rohan',  interest_id: 'culture',    intention: 'CASUAL_ENTHUSIAST' },
  { user_id: 'usr_rohan',  interest_id: 'music',      intention: 'CASUAL_ENTHUSIAST' },

  { user_id: 'usr_priya',  interest_id: 'languages',  intention: 'NATIVE_SPEAKER' },
  { user_id: 'usr_priya',  interest_id: 'culture',    intention: 'WILLING_TO_TEACH' },

  { user_id: 'usr_arjun',  interest_id: 'culture',    intention: 'WILLING_TO_TEACH' },
  { user_id: 'usr_arjun',  interest_id: 'music',      intention: 'WILLING_TO_TEACH' },

  { user_id: 'usr_ananya', interest_id: 'culture',    intention: 'CASUAL_ENTHUSIAST' },
  { user_id: 'usr_ananya', interest_id: 'community',  intention: 'WILLING_TO_TEACH' },

  { user_id: 'usr_kavya',  interest_id: 'art',        intention: 'WILLING_TO_TEACH' },
  { user_id: 'usr_kavya',  interest_id: 'culture',    intention: 'CASUAL_ENTHUSIAST' },

  { user_id: 'usr_vikram', interest_id: 'technology', intention: 'WILLING_TO_TEACH' },
  { user_id: 'usr_vikram', interest_id: 'workshops',  intention: 'WILLING_TO_TEACH' },
  { user_id: 'usr_vikram', interest_id: 'music',      intention: 'WANTS_TO_LEARN' },

  { user_id: 'usr_aditya', interest_id: 'languages',  intention: 'WANTS_TO_LEARN' },
  { user_id: 'usr_aditya', interest_id: 'technology', intention: 'CASUAL_ENTHUSIAST' },

  { user_id: 'usr_meera',  interest_id: 'music',      intention: 'WILLING_TO_TEACH' },
  { user_id: 'usr_meera',  interest_id: 'festivals',  intention: 'CASUAL_ENTHUSIAST' },
  { user_id: 'usr_meera',  interest_id: 'languages',  intention: 'WANTS_TO_LEARN' },
];
const insertInterest = db.prepare(`
  INSERT OR IGNORE INTO user_interests (user_id, interest_id, intention)
  VALUES (@user_id, @interest_id, @intention)
`);
for (const i of interestData) insertInterest.run(i);
console.log(`[Seed] Inserted ${interestData.length} interest records`);

// ─── Seed User Languages (drives language-overlap scoring) ────────────────────
const languageData = [
  { user_id: 'usr_rohan',  language: 'English' }, { user_id: 'usr_rohan',  language: 'Hindi' },
  { user_id: 'usr_rohan',  language: 'Kannada' },
  { user_id: 'usr_priya',  language: 'Tulu' }, { user_id: 'usr_priya',  language: 'Konkani' },
  { user_id: 'usr_priya',  language: 'English' }, { user_id: 'usr_priya',  language: 'Kannada' },
  { user_id: 'usr_arjun',  language: 'Kannada' }, { user_id: 'usr_arjun',  language: 'Tulu' },
  { user_id: 'usr_arjun',  language: 'English' },
  { user_id: 'usr_ananya', language: 'Kannada' }, { user_id: 'usr_ananya', language: 'English' },
  { user_id: 'usr_kavya',  language: 'Kodava Takk' }, { user_id: 'usr_kavya',  language: 'Kannada' },
  { user_id: 'usr_kavya',  language: 'English' },
  { user_id: 'usr_vikram', language: 'Kannada' }, { user_id: 'usr_vikram', language: 'English' },
  { user_id: 'usr_vikram', language: 'Hindi' },
  { user_id: 'usr_aditya', language: 'Kannada' }, { user_id: 'usr_aditya', language: 'English' },
  { user_id: 'usr_meera',  language: 'Marathi' }, { user_id: 'usr_meera',  language: 'Hindi' },
  { user_id: 'usr_meera',  language: 'English' },
];
const insertLang = db.prepare(`
  INSERT OR IGNORE INTO user_languages (user_id, language) VALUES (@user_id, @language)
`);
for (const l of languageData) insertLang.run(l);
console.log(`[Seed] Inserted ${languageData.length} language records`);

// ─── Seed User Skills (drives skill-exchange scoring) ──────────────────────────
const skillData = [
  { user_id: 'usr_rohan',  skill: 'Tulu',                       skill_type: 'LEARN' },
  { user_id: 'usr_rohan',  skill: 'Yakshagana',                 skill_type: 'LEARN' },

  { user_id: 'usr_priya',  skill: 'Tulu',                       skill_type: 'TEACH' },
  { user_id: 'usr_priya',  skill: 'Konkani',                    skill_type: 'TEACH' },

  { user_id: 'usr_arjun',  skill: 'Yakshagana',                 skill_type: 'TEACH' },
  { user_id: 'usr_arjun',  skill: 'Maddale Drumming',           skill_type: 'TEACH' },

  { user_id: 'usr_ananya', skill: 'Mysuru Pak Recipe',          skill_type: 'TEACH' },
  { user_id: 'usr_ananya', skill: 'Pottery',                    skill_type: 'LEARN' },

  { user_id: 'usr_kavya',  skill: 'Kodava Embroidery',          skill_type: 'TEACH' },
  { user_id: 'usr_kavya',  skill: 'Yakshagana',                 skill_type: 'LEARN' },

  { user_id: 'usr_vikram', skill: 'Python Programming',         skill_type: 'TEACH' },
  { user_id: 'usr_vikram', skill: 'Hindustani Classical Music', skill_type: 'LEARN' },

  { user_id: 'usr_aditya', skill: 'Tulu',                       skill_type: 'LEARN' },
  { user_id: 'usr_aditya', skill: 'Python Programming',         skill_type: 'LEARN' },

  { user_id: 'usr_meera',  skill: 'Marathi Folk Singing',       skill_type: 'TEACH' },
  { user_id: 'usr_meera',  skill: 'Tulu',                       skill_type: 'LEARN' },
];
const insertSkill = db.prepare(`
  INSERT OR IGNORE INTO user_skills (user_id, skill, skill_type) VALUES (@user_id, @skill, @skill_type)
`);
for (const s of skillData) insertSkill.run(s);
console.log(`[Seed] Inserted ${skillData.length} skill records`);

// ─── Seed Connections (drives mutual-connections graph scoring) ───────────────
// rohan <-> priya, rohan <-> arjun, priya <-> kavya — this leaves rohan and
// kavya with one mutual connection (priya) despite not being connected
// themselves, so the "N mutual connections" signal has real data to show.
const connectionData = [
  { id: uuid(), requester_id: 'usr_rohan', receiver_id: 'usr_priya', status: 'CONNECTED' },
  { id: uuid(), requester_id: 'usr_rohan', receiver_id: 'usr_arjun', status: 'CONNECTED' },
  { id: uuid(), requester_id: 'usr_priya', receiver_id: 'usr_kavya', status: 'CONNECTED' },
];
const insertConn = db.prepare(`
  INSERT OR IGNORE INTO connections (id, requester_id, receiver_id, status)
  VALUES (@id, @requester_id, @receiver_id, @status)
`);
for (const c of connectionData) insertConn.run(c);
console.log(`[Seed] Inserted ${connectionData.length} connections`);

// ─── Seed Events — Karnataka-first, reaching across India ─────────────────────
const events = [
  {
    id: 'evt_1', title: 'Udupi Yakshagana Night', category: 'culture', category_label: 'Culture & Heritage',
    date_label: 'Saturday, 7:00 PM', datetime_iso: new Date(Date.now() + 3 * 86400000).toISOString(),
    venue: 'Kadiyali Temple Grounds', neighborhood: 'Udupi', lat: 13.3409, lng: 74.7421, is_online: 0,
    organizer: 'Udupi Yakshagana Kendra',
    image_url: '/images/yakshagana-art-bg.png',
    description: 'A full night of traditional Yakshagana performance — live Maddale drumming, elaborate makeup, and stories from the Puranas.',
    source_url: '', source_label: 'Community Submitted', verification_status: 'COMMUNITY_REPORTED', attendee_count: 64, submitted_by: 'usr_arjun',
  },
  {
    id: 'evt_2', title: 'Mysuru Dasara Cultural Procession Prep Circle', category: 'festivals', category_label: 'Festivals & Celebrations',
    date_label: 'Sunday, 10:00 AM', datetime_iso: new Date(Date.now() + 5 * 86400000).toISOString(),
    venue: 'Mysuru Palace Grounds', neighborhood: 'Mysuru', lat: 12.3052, lng: 76.6552, is_online: 0,
    organizer: 'Mysuru Dasara Committee',
    image_url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop&q=80',
    description: 'Volunteers and performers rehearse float decorations and folk-dance formations ahead of the famous Mysuru Dasara procession.',
    source_url: '', source_label: 'Community Submitted', verification_status: 'COMMUNITY_REPORTED', attendee_count: 41, submitted_by: 'usr_ananya',
  },
  {
    id: 'evt_3', title: 'Bengaluru Tech & Culture Hackathon', category: 'technology', category_label: 'Technology & Hackathons',
    date_label: 'Next Weekend', datetime_iso: new Date(Date.now() + 9 * 86400000).toISOString(),
    venue: 'Koramangala Innovation Hub', neighborhood: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245, is_online: 0,
    organizer: 'Bengaluru Builders Collective',
    image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    description: 'A 24-hour hackathon with a twist: every team must build something that helps preserve or share a regional Indian language or tradition.',
    source_url: '', source_label: 'Community Submitted', verification_status: 'COMMUNITY_REPORTED', attendee_count: 120, submitted_by: 'usr_vikram',
  },
  {
    id: 'evt_4', title: 'Hubballi Hindustani Classical Evening', category: 'music', category_label: 'Folk & Classical Music',
    date_label: 'Friday, 6:30 PM', datetime_iso: new Date(Date.now() + 2 * 86400000).toISOString(),
    venue: 'Vidyanagar Community Hall', neighborhood: 'Hubballi', lat: 15.3647, lng: 75.1240, is_online: 0,
    organizer: 'Hubballi Sangeet Sabha',
    image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop&q=80',
    description: 'An intimate evening of Hindustani classical vocals and tabla, open to both seasoned listeners and curious beginners.',
    source_url: '', source_label: 'Community Submitted', verification_status: 'COMMUNITY_REPORTED', attendee_count: 28, submitted_by: 'usr_vikram',
  },
  {
    id: 'evt_5', title: 'Kodagu Traditional Craft Workshop', category: 'art', category_label: 'Art & Traditional Crafts',
    date_label: 'Saturday, 11:00 AM', datetime_iso: new Date(Date.now() + 6 * 86400000).toISOString(),
    venue: 'Mahadevpet Heritage Center', neighborhood: 'Madikeri', lat: 12.4244, lng: 75.7382, is_online: 0,
    organizer: 'Kodagu Heritage Trust',
    image_url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&auto=format&fit=crop&q=80',
    description: 'Hands-on Kodava embroidery (Kodagu thoni) session, taught by local artisans using techniques passed down for generations.',
    source_url: '', source_label: 'Community Submitted', verification_status: 'COMMUNITY_REPORTED', attendee_count: 19, submitted_by: 'usr_kavya',
  },
  {
    id: 'evt_6', title: 'Mangaluru Konkani & Tulu Literature Meet', category: 'literature', category_label: 'Books & Literature',
    date_label: 'Sunday, 4:00 PM', datetime_iso: new Date(Date.now() + 4 * 86400000).toISOString(),
    venue: 'Kadri Reading Circle', neighborhood: 'Mangaluru', lat: 12.9141, lng: 74.8560, is_online: 0,
    organizer: 'Mangaluru Dialect Collective',
    image_url: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=800&auto=format&fit=crop&q=80',
    description: 'Readings and open discussion of contemporary Konkani and Tulu short stories, followed by a casual dialect-practice circle.',
    source_url: '', source_label: 'Community Submitted', verification_status: 'COMMUNITY_REPORTED', attendee_count: 22, submitted_by: 'usr_priya',
  },
  {
    id: 'evt_7', title: 'Gokarna Coastal Folklore Film Night', category: 'film', category_label: 'Film & Theatre',
    date_label: 'Friday, 8:00 PM', datetime_iso: new Date(Date.now() + 7 * 86400000).toISOString(),
    venue: 'Om Beach Open-Air Screen', neighborhood: 'Gokarna', lat: 14.5479, lng: 74.3188, is_online: 0,
    organizer: 'Coastal Karnataka Film Circle',
    image_url: 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=800&auto=format&fit=crop&q=80',
    description: 'An open-air screening of short documentaries on coastal Karnataka folklore, with a filmmaker Q&A after.',
    source_url: '', source_label: 'Community Submitted', verification_status: 'COMMUNITY_REPORTED', attendee_count: 35, submitted_by: 'usr_rohan',
  },
  {
    id: 'evt_8', title: 'Bengaluru Science Gallery Open Day', category: 'science', category_label: 'Science & Discovery',
    date_label: 'Sunday, 11:00 AM', datetime_iso: new Date(Date.now() + 8 * 86400000).toISOString(),
    venue: 'Science Gallery Bengaluru', neighborhood: 'Bengaluru', lat: 12.9719, lng: 77.6412, is_online: 0,
    organizer: 'Science Gallery Bengaluru',
    image_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
    description: 'Free open day with hands-on exhibits exploring the science behind traditional Indian crafts, textiles, and instruments.',
    source_url: '', source_label: 'Community Submitted', verification_status: 'COMMUNITY_REPORTED', attendee_count: 88, submitted_by: 'usr_aditya',
  },
  {
    id: 'evt_9', title: 'Jaipur Desert Folk Ballads Night', category: 'music', category_label: 'Folk & Classical Music',
    date_label: 'Saturday, 7:30 PM', datetime_iso: new Date(Date.now() + 10 * 86400000).toISOString(),
    venue: 'Jawahar Kala Kendra', neighborhood: 'Jaipur', lat: 26.9124, lng: 75.7873, is_online: 0,
    organizer: 'Rajasthan Folk Arts Society',
    image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
    description: 'Manganiyar and Langa folk musicians perform Rajasthani desert ballads on sarangi and dholak.',
    source_url: '', source_label: 'Community Submitted', verification_status: 'COMMUNITY_REPORTED', attendee_count: 73, submitted_by: 'usr_meera',
  },
  {
    id: 'evt_10', title: 'Kolkata Baul Poetry & Community Circle', category: 'community', category_label: 'Dialect & Community Circles',
    date_label: 'Sunday, 5:00 PM', datetime_iso: new Date(Date.now() + 11 * 86400000).toISOString(),
    venue: 'Rabindra Sarobar Lakeside Lawn', neighborhood: 'Kolkata', lat: 22.5726, lng: 88.3639, is_online: 0,
    organizer: 'Kolkata Baul Sangha',
    image_url: 'https://images.unsplash.com/photo-1558980664-10e7170b5df9?w=800&auto=format&fit=crop&q=80',
    description: 'An evening of mystic Baul poetry and ektara music, with an open floor for anyone to share a verse.',
    source_url: '', source_label: 'Community Submitted', verification_status: 'COMMUNITY_REPORTED', attendee_count: 30, submitted_by: 'usr_meera',
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
function datetime_2h_ago() {
  return new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
}
function yesterday_iso() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

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
    provenance: 'Practiced at the artisan shed near Udupi',
    audio_url: '',
    image_url: '/images/heritage-tapestry-bg.png',
    audio_duration: '',
    timestamp_iso: yesterday_iso(),
  },
];

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
function msg_time(minutesAgo) {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}
function msg_time_days(daysAgo, minutesAgo) {
  return new Date(Date.now() - daysAgo * 86400000 - minutesAgo * 60000).toISOString();
}

const messages = [
  { id: uuid(), sender_id: 'usr_priya', receiver_id: 'usr_rohan', text: 'Namaskara Rohan! Saw that you want to practice conversational Tulu.', sent_at: msg_time(-15), is_read: 1 },
  { id: uuid(), sender_id: 'usr_rohan', receiver_id: 'usr_priya', text: 'Yes! I moved to Bengaluru for work and really want to hold onto the coastal slang.', sent_at: msg_time(-10), is_read: 1 },
  { id: uuid(), sender_id: 'usr_priya', receiver_id: 'usr_rohan', text: 'Awesome! I just sent a voice snippet on our Culture Locket. Practice saying "Encha Uller?" 😄', sent_at: msg_time(-5), is_read: 1 },
  { id: uuid(), sender_id: 'usr_priya', receiver_id: 'usr_rohan', text: 'Let\u2019s do a video call this Sunday for the dialect circle!', sent_at: msg_time(-1), is_read: 0 },
  { id: uuid(), sender_id: 'usr_arjun', receiver_id: 'usr_rohan', text: 'Hey Rohan, are you coming down to Udupi for the Yakshagana night on Saturday?', sent_at: msg_time_days(-1, 30), is_read: 1 },
  { id: uuid(), sender_id: 'usr_rohan', receiver_id: 'usr_arjun', text: 'Yes, saved it on Anvesha! Looking forward to seeing the live makeup.', sent_at: msg_time_days(-1, 25), is_read: 1 },
  { id: uuid(), sender_id: 'usr_arjun', receiver_id: 'usr_rohan', text: 'I\u2019ll bring the Maddale drum so you can try it.', sent_at: msg_time_days(-1, 20), is_read: 1 },
];

const insertMsg = db.prepare(`
  INSERT OR IGNORE INTO messages (id, sender_id, receiver_id, text, sent_at, is_read)
  VALUES (@id, @sender_id, @receiver_id, @text, @sent_at, @is_read)
`);
for (const m of messages) insertMsg.run(m);
console.log(`[Seed] Inserted ${messages.length} messages`);

// ─── Seed Communities ────────────────────────────────────────────────────────
const communities = [
  {
    id: 'comm_classical_music',
    name: 'Indian Music & Festivals',
    slug: 'indian-music-festivals',
    description: 'A community for Hindustani and Carnatic classical music lovers, folk ballad seekers, and festival enthusiasts across India.',
    category: 'music',
    category_label: 'Music',
    type: 'INTEREST',
    event_id: null,
    location: 'Pan-India & Karnataka',
    image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop&q=80',
    icon: 'music_note',
    member_count: 28,
    created_by: 'usr_vikram',
  },
  {
    id: 'comm_folk_art',
    name: 'Art & Folk Traditions',
    slug: 'art-folk-traditions',
    description: 'Exploring indigenous art forms: Warli murals, Madhubani lines, Kodava embroidery, and temple iconography.',
    category: 'art',
    category_label: 'Art',
    type: 'INTEREST',
    event_id: null,
    location: 'Karnataka & Beyond',
    image_url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&auto=format&fit=crop&q=80',
    icon: 'palette',
    member_count: 16,
    created_by: 'usr_kavya',
  },
  {
    id: 'comm_loc_manipal',
    name: 'Events Around Manipal',
    slug: 'events-around-manipal',
    description: 'Local student and resident circle for discovering gatherings, beach heritage walks, temple festivals, and campus culture.',
    category: 'regional',
    category_label: 'Local',
    type: 'LOCATION',
    event_id: null,
    location: 'Manipal & Udupi',
    image_url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop&q=80',
    icon: 'location_on',
    member_count: 34,
    created_by: 'usr_arjun',
  },
  {
    id: 'comm_evt_manipal_fest',
    name: 'Manipal Cultural Fest 2026',
    slug: 'manipal-cultural-fest-2026',
    description: 'Official gathering community for attendees, performers, and volunteers participating in the Manipal Cultural Fest 2026.',
    category: 'festivals',
    category_label: 'Festivals',
    type: 'EVENT',
    event_id: 'evt_1',
    location: 'Manipal University Campus',
    image_url: '/images/yakshagana-art-bg.png',
    icon: 'celebration',
    member_count: 38,
    created_by: 'usr_arjun',
  },
  {
    id: 'comm_evt_dasara',
    name: 'Mysuru Dasara Cultural Circle',
    slug: 'mysuru-dasara-circle',
    description: 'Procession prep, folk float coordination, and heritage walks for the historic Mysuru Dasara festival.',
    category: 'festivals',
    category_label: 'Festivals',
    type: 'EVENT',
    event_id: 'evt_2',
    location: 'Mysuru Palace Grounds',
    image_url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop&q=80',
    icon: 'celebration',
    member_count: 42,
    created_by: 'usr_ananya',
  },
  {
    id: 'comm_evt_hackathon',
    name: 'Bengaluru Culture Tech Hackers',
    slug: 'bengaluru-culture-tech-hackers',
    description: 'Builders, linguists, and designers teaming up for the Bengaluru Tech & Culture Hackathon to preserve regional languages.',
    category: 'technology',
    category_label: 'Technology',
    type: 'EVENT',
    event_id: 'evt_3',
    location: 'Koramangala, Bengaluru',
    image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    icon: 'code',
    member_count: 54,
    created_by: 'usr_vikram',
  },
  {
    id: 'comm_dialects_lit',
    name: 'Tulu & Konkani Dialect Circle',
    slug: 'tulu-konkani-dialect-circle',
    description: 'Preserving coastal idioms, folklore stories, and proverbs through weekly voice exchanges and literature readings.',
    category: 'literature',
    category_label: 'Literature',
    type: 'INTEREST',
    event_id: 'evt_6',
    location: 'Mangaluru & Udupi',
    image_url: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=800&auto=format&fit=crop&q=80',
    icon: 'menu_book',
    member_count: 22,
    created_by: 'usr_priya',
  },
  {
    id: 'comm_loc_bengaluru',
    name: 'Bengaluru Heritage & Art Walkers',
    slug: 'bengaluru-heritage-walkers',
    description: 'Weekend walking trails through Malleswaram old streets, pete markets, temple tanks, and filter coffee spots.',
    category: 'regional',
    category_label: 'Regional Culture',
    type: 'LOCATION',
    event_id: null,
    location: 'Bengaluru, Karnataka',
    image_url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop&q=80',
    icon: 'explore',
    member_count: 45,
    created_by: 'usr_rohan',
  },
];

const insertComm = db.prepare(`
  INSERT OR IGNORE INTO communities
    (id, name, slug, description, category, category_label, type, event_id, location, image_url, icon, member_count, created_by)
  VALUES
    (@id, @name, @slug, @description, @category, @category_label, @type, @event_id, @location, @image_url, @icon, @member_count, @created_by)
`);
for (const c of communities) insertComm.run(c);
console.log(`[Seed] Inserted ${communities.length} communities`);

// ─── Seed Community Memberships ─────────────────────────────────────────────
const communityMembers = [
  { community_id: 'comm_classical_music', user_id: 'usr_rohan',  role: 'MEMBER' },
  { community_id: 'comm_classical_music', user_id: 'usr_vikram', role: 'ADMIN' },
  { community_id: 'comm_classical_music', user_id: 'usr_meera',  role: 'MEMBER' },
  { community_id: 'comm_folk_art',        user_id: 'usr_kavya',  role: 'ADMIN' },
  { community_id: 'comm_folk_art',        user_id: 'usr_ananya', role: 'MEMBER' },
  { community_id: 'comm_loc_manipal',     user_id: 'usr_rohan',  role: 'MEMBER' },
  { community_id: 'comm_loc_manipal',     user_id: 'usr_arjun',  role: 'ADMIN' },
  { community_id: 'comm_loc_manipal',     user_id: 'usr_priya',  role: 'MEMBER' },
  { community_id: 'comm_evt_manipal_fest',user_id: 'usr_rohan',  role: 'MEMBER' },
  { community_id: 'comm_evt_manipal_fest',user_id: 'usr_arjun',  role: 'ADMIN' },
  { community_id: 'comm_evt_manipal_fest',user_id: 'usr_priya',  role: 'MEMBER' },
  { community_id: 'comm_evt_dasara',      user_id: 'usr_ananya', role: 'ADMIN' },
  { community_id: 'comm_evt_dasara',      user_id: 'usr_aditya', role: 'MEMBER' },
  { community_id: 'comm_evt_hackathon',   user_id: 'usr_vikram', role: 'ADMIN' },
  { community_id: 'comm_evt_hackathon',   user_id: 'usr_aditya', role: 'MEMBER' },
  { community_id: 'comm_dialects_lit',    user_id: 'usr_priya',  role: 'ADMIN' },
  { community_id: 'comm_dialects_lit',    user_id: 'usr_rohan',  role: 'MEMBER' },
  { community_id: 'comm_loc_bengaluru',   user_id: 'usr_rohan',  role: 'ADMIN' },
  { community_id: 'comm_loc_bengaluru',   user_id: 'usr_vikram', role: 'MEMBER' },
];

const insertCommMember = db.prepare(`
  INSERT OR IGNORE INTO community_members (community_id, user_id, role)
  VALUES (@community_id, @user_id, @role)
`);
for (const cm of communityMembers) insertCommMember.run(cm);
console.log(`[Seed] Inserted ${communityMembers.length} community memberships`);

// ─── Seed Community Discussion Messages ─────────────────────────────────────
const commMessages = [
  {
    id: uuid(),
    community_id: 'comm_classical_music',
    sender_id: 'usr_vikram',
    text: 'Welcome everyone! In this circle we discuss regional classical traditions. Anyone here exploring the differences between Kirana and Gwalior gharanas?',
    sent_at: msg_time_days(2, 10),
  },
  {
    id: uuid(),
    community_id: 'comm_classical_music',
    sender_id: 'usr_meera',
    text: 'I grew up listening to Marathi Natyasangeet and Bhimsen Joshi ji. Would love to share rare recording links!',
    sent_at: msg_time_days(1, 45),
  },
  {
    id: uuid(),
    community_id: 'comm_classical_music',
    sender_id: 'usr_rohan',
    text: 'Looking forward to the upcoming Hindustani session in Hubballi! Is anyone traveling from Bengaluru?',
    sent_at: msg_time(40),
  },
  {
    id: uuid(),
    community_id: 'comm_loc_manipal',
    sender_id: 'usr_arjun',
    text: 'Namaskara Manipal folks! Next weekend there is an early morning heritage walk towards End Point, followed by traditional breakfast at Mitra Samaj Udupi.',
    sent_at: msg_time_days(1, 120),
  },
  {
    id: uuid(),
    community_id: 'comm_loc_manipal',
    sender_id: 'usr_priya',
    text: 'Count me in! Also, the Kadri temple fair preparations in Mangaluru are starting this week.',
    sent_at: msg_time(55),
  },
  {
    id: uuid(),
    community_id: 'comm_evt_manipal_fest',
    sender_id: 'usr_arjun',
    text: 'Official notice: Stage sound check for the Yakshagana all-night performance starts at 5:00 PM on Saturday. Performers please gather by the green room.',
    sent_at: msg_time_days(1, 30),
  },
  {
    id: uuid(),
    community_id: 'comm_evt_manipal_fest',
    sender_id: 'usr_rohan',
    text: 'Can non-performers observe the traditional makeup (Bannada Vesha) process before the show starts?',
    sent_at: msg_time(30),
  },
  {
    id: uuid(),
    community_id: 'comm_evt_manipal_fest',
    sender_id: 'usr_arjun',
    text: 'Yes absolutely! Makeup takes nearly 3 hours, anyone interested in the natural pigments is welcome to watch quietly.',
    sent_at: msg_time(15),
  },
  {
    id: uuid(),
    community_id: 'comm_dialects_lit',
    sender_id: 'usr_priya',
    text: 'Uploaded a new Culture Locket entry with conversational Tulu greetings! Who wants to practice dialogue next Sunday?',
    sent_at: msg_time_days(2, 60),
  },
  {
    id: uuid(),
    community_id: 'comm_evt_hackathon',
    sender_id: 'usr_vikram',
    text: 'We are looking for one more teammate with React or audio processing experience to build a dialect phonetics tool for the hackathon!',
    sent_at: msg_time_days(1, 10),
  },
];

const insertCommMsg = db.prepare(`
  INSERT OR IGNORE INTO community_messages (id, community_id, sender_id, text, sent_at)
  VALUES (@id, @community_id, @sender_id, @text, @sent_at)
`);
for (const cm of commMessages) insertCommMsg.run(cm);
console.log(`[Seed] Inserted ${commMessages.length} community messages`);

// ─── Seed Event Reviews & Ratings ───────────────────────────────────────────
const eventReviews = [
  {
    id: 'rev_manipal_priya',
    event_id: 'evt_1',
    user_id: 'usr_priya',
    rating: 5,
    feedback: 'The Yakshagana troupe performance at KMC Greens was breathtaking. The elaborate headgear and live Chenda percussion gave everyone goosebumps!',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'rev_manipal_vikram',
    event_id: 'evt_1',
    user_id: 'usr_vikram',
    rating: 5,
    feedback: 'Very well-organized cultural gathering. Loved the interactive artisan kiosks demonstrating traditional Udupi saree weaving techniques.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'rev_manipal_kavya',
    event_id: 'evt_1',
    user_id: 'usr_kavya',
    rating: 4,
    feedback: 'Inspiring atmosphere and great turn out of students. The sound system for the folk dance demo could have been slightly louder towards the back, but otherwise outstanding!',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'rev_dasara_arjun',
    event_id: 'evt_2',
    user_id: 'usr_arjun',
    rating: 5,
    feedback: 'Experiencing the Mysore Dasara heritage circle in person is truly unforgettable. The classical Carnatic concerts and palace lighting left us mesmerized.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'rev_hackathon_ananya',
    event_id: 'evt_3',
    user_id: 'usr_ananya',
    rating: 5,
    feedback: 'Phenomenal hackathon combining AI with indigenous dialect preservation and living heritage. Mentors provided insightful guidance on vernacular NLP.',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'rev_cooking_meera',
    event_id: 'evt_4',
    user_id: 'usr_meera',
    rating: 5,
    feedback: 'Learned the genuine secret to Udupi rasam and tempering spices directly from temple culinary masters. Delightful hands-on workshop!',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const insertReview = db.prepare(`
  INSERT OR IGNORE INTO event_reviews (id, event_id, user_id, rating, feedback, created_at, updated_at)
  VALUES (@id, @event_id, @user_id, @rating, @feedback, @created_at, @updated_at)
`);
for (const r of eventReviews) insertReview.run(r);
console.log(`[Seed] Inserted ${eventReviews.length} event reviews`);

// ─── Seed Local Food & Culinary Heritage ────────────────────────────────────
const localDishes = [
  {
    id: 'dish_neer_dosa',
    name: 'Neer Dosa & Coconut Chutney',
    regional_name: 'ನೀರು ದೋಸೆ',
    region: 'Tulunadu / Coastal Karnataka',
    state_id: 'karnataka',
    city: 'Manipal',
    event_id: 'evt_1',
    category: 'BREAKFAST',
    category_label: 'Heirloom Coastal Breakfast',
    description: 'Delicate, lace-thin crepe prepared with soaked unboiled rice, water, and freshly grated coconut. Feather-light texture served with fresh coconut-coriander chutney or jaggery.',
    cultural_tradition: 'Ancient culinary staple of coastal Bunt and GSB households, traditionally steam-cooked on seasoned iron skillets using a fresh banana leaf applicator.',
    image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
    dietary_type: 'VEGAN',
    allergens: JSON.stringify([]),
    is_sample_data: 1,
    source_attribution: 'Manipal Coastal Food Heritage Archive (Sample Data)',
  },
  {
    id: 'dish_mangalore_buns',
    name: 'Mangalore Banana Buns',
    regional_name: 'ಮಂಗಳೂರು ಬನ್ಸ್',
    region: 'South Canara / Udupi Coast',
    state_id: 'karnataka',
    city: 'Udupi',
    event_id: 'evt_1',
    category: 'SNACKS_STREET',
    category_label: 'Iconic Coastal Evening Snack',
    description: 'Fluffy, golden deep-fried puffed bread mildly sweetened with ripe mashed bananas, buttermilk, and a touch of roasted cumin seeds.',
    cultural_tradition: 'Evolved in Udupi temple-town cafés and coastal tea stalls as a creative technique to celebrate seasonal harvests of native ripe bananas without food waste.',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    dietary_type: 'VEGETARIAN',
    allergens: JSON.stringify(['Gluten', 'Dairy']),
    is_sample_data: 1,
    source_attribution: 'Udupi Heritage Kitchen Documentation (Sample Data)',
  },
  {
    id: 'dish_patrode',
    name: 'Patrode (Steamed Colocasia Pinwheels)',
    regional_name: 'ಪತ್ರೊಡೆ',
    region: 'Coastal Karnataka & Malenadu',
    state_id: 'karnataka',
    city: 'Manipal',
    event_id: 'evt_4',
    category: 'TRADITIONAL_DISH',
    category_label: 'Monsoon Foraged Delicacy',
    description: 'Tender wild colocasia (taro) leaves smeared with a spiced paste of soaked rice, toor dal, and tamarind pulp, rolled into logs, steamed, and pan-fried in coconut oil.',
    cultural_tradition: 'An essential coastal monsoon foraging tradition passed down over centuries. Tamarind is key to neutralising the natural calcium oxalate crystals of wild colocasia.',
    image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    dietary_type: 'VEGAN',
    allergens: JSON.stringify([]),
    is_sample_data: 1,
    source_attribution: 'Dakshina Kannada Ethno-Botanical Foodways (Sample Data)',
  },
  {
    id: 'dish_udupi_saaru',
    name: 'Udupi Saaru & Temple Rasam',
    regional_name: 'ಉಡುಪಿ ಸಾರು',
    region: 'Udupi / Coastal Karnataka',
    state_id: 'karnataka',
    city: 'Udupi',
    event_id: 'evt_4',
    category: 'MAINS',
    category_label: 'Sacred Temple Cuisine',
    description: 'Digestive, fragrant lentil broth brewed with toor dal, byadagi chillies, coriander seeds, fresh curry leaves, and asafoetida, tempered in desi ghee.',
    cultural_tradition: 'Preserved at the Sri Krishna Matha for centuries as strictly satvik cuisine (free of onion and garlic) emphasizing therapeutic herbal balancing.',
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    dietary_type: 'VEGETARIAN',
    allergens: JSON.stringify(['Dairy']),
    is_sample_data: 1,
    source_attribution: 'Udupi Sri Krishna Matha Culinary Chronicle (Sample Data)',
  },
  {
    id: 'dish_mysore_pak',
    name: 'Royal Mysore Pak',
    regional_name: 'ಮೈಸೂರು ಪಾಕ್',
    region: 'Old Mysore Kingdom',
    state_id: 'karnataka',
    city: 'Mysuru',
    event_id: 'evt_2',
    category: 'SWEETS_DESSERTS',
    category_label: 'Palace Heritage Confection',
    description: 'Crumbly, melt-in-mouth golden confection crafted from gently roasted gram flour (besan), pure churned ghee, and fragrant sugar syrup.',
    cultural_tradition: 'Invented in 1935 by Kakasura Madappa, the royal chef of Maharaja Krishna Raja Wadiyar IV in the palace kitchens of Amba Vilas in Mysuru.',
    image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
    dietary_type: 'VEGETARIAN',
    allergens: JSON.stringify(['Dairy']),
    is_sample_data: 1,
    source_attribution: 'Mysuru Royal Heritage Trust Records (Sample Data)',
  },
  {
    id: 'dish_bisi_bele_bath',
    name: 'Bisi Bele Bath',
    regional_name: 'ಬಿಸಿ ಬೇಳೆ ಬಾತ್',
    region: 'Bengaluru / Central Karnataka',
    state_id: 'karnataka',
    city: 'Bengaluru',
    event_id: 'evt_3',
    category: 'MAINS',
    category_label: 'Heirloom Grain Preparation',
    description: 'Slow-cooked spiced one-pot preparation of rice, toor dal, seasonal country vegetables, marathi moggu (kapok buds), and roasted spices, topped with boondi and ghee.',
    cultural_tradition: 'Originally documented in royal Mysore court banquets as a complete ceremonial midday meal, celebrated today in traditional Bengaluru heritage eateries.',
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80',
    dietary_type: 'VEGETARIAN',
    allergens: JSON.stringify(['Dairy', 'Peanuts']),
    is_sample_data: 1,
    source_attribution: 'Bengaluru Culinary History Documentation (Sample Data)',
  },
  {
    id: 'dish_filter_kaapi',
    name: 'Degree Filter Coffee (Kaapi)',
    regional_name: 'ಫಿಲ್ಟರ್ ಕಾಫಿ',
    region: 'Chikmagalur & Coastal Karnataka',
    state_id: 'karnataka',
    city: 'Manipal',
    event_id: 'evt_1',
    category: 'BEVERAGES',
    category_label: 'Traditional Beverage Ritual',
    description: 'Frothy, velvety brew made from dark-roasted peaberry coffee beans and chicory extracted in a brass drip filter, blended with frothed whole milk in a traditional davarah-tumbler.',
    cultural_tradition: 'Tracing roots back to Baba Budan bringing Sufi coffee seeds to the Malnad hills in the 17th century; morning coffee in Karnataka is a cherished communal conversation starter.',
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    dietary_type: 'VEGETARIAN',
    allergens: JSON.stringify(['Dairy']),
    is_sample_data: 1,
    source_attribution: 'Western Ghats Agro-Heritage Guild (Sample Data)',
  },
  {
    id: 'dish_appam_stew',
    name: 'Appam & Vegetable Ishtu',
    regional_name: 'അപ്പം ഇസ്തു',
    region: 'Central Kerala Coast',
    state_id: 'kerala',
    city: 'Kochi',
    category: 'BREAKFAST',
    category_label: 'Kerala Coastal Classic',
    description: 'Bowl-shaped fermented rice pancakes with pillowy soft honeycomb centers and paper-crisp frilly edges, paired with a mild, aromatic coconut milk and green cardamom stew.',
    cultural_tradition: 'Perfected across Syrian Christian and coastal spice-port households over centuries, celebrating fresh local coconut milk and native Malabar Tellicherry black pepper.',
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    dietary_type: 'VEGAN',
    allergens: JSON.stringify([]),
    is_sample_data: 1,
    source_attribution: 'Kerala Spice Coast Foodway Study (Sample Data)',
  },
  {
    id: 'dish_jigarthanda',
    name: 'Madurai Famous Jigarthanda',
    regional_name: 'ஜிகர்தண்டா',
    region: 'Pandya Nadu / Tamil Nadu',
    state_id: 'tamil-nadu',
    city: 'Madurai',
    category: 'BEVERAGES',
    category_label: 'Historic Summer Cooler',
    description: 'Soothing cooling beverage crafted with badam pisin (natural almond gum), sarsaparilla (nannari) root syrup, caramelized reduced milk, and hand-churned ice cream.',
    cultural_tradition: 'Literally meaning "Heart Cooler" in Persian/Urdu, introduced during the historic Madurai Sultanate and adapted to the arid plains of southern Tamil Nadu.',
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80',
    dietary_type: 'VEGETARIAN',
    allergens: JSON.stringify(['Dairy', 'Nuts']),
    is_sample_data: 1,
    source_attribution: 'Madurai Living Traditions Archive (Sample Data)',
  },
  {
    id: 'dish_puran_poli',
    name: 'Puran Poli & Katachi Amti',
    regional_name: 'पुरण पोळी',
    region: 'Deccan Maharashtra',
    state_id: 'maharashtra',
    city: 'Pune',
    category: 'SWEETS_DESSERTS',
    category_label: 'Festive Heritage Bread',
    description: 'Paper-thin whole wheat flatbread stuffed with sweet cooked chana dal, organic jaggery, nutmeg, and green cardamom, served with melted cow ghee and tangy spiced amti broth.',
    cultural_tradition: 'Documented in the 12th-century Sanskrit encyclopedic text Manasollasa compiled by Western Chalukya monarch Someshvara III.',
    image_url: 'https://images.unsplash.com/photo-1605634560410-b4916a03d09a?w=800&auto=format&fit=crop&q=80',
    dietary_type: 'VEGETARIAN',
    allergens: JSON.stringify(['Gluten', 'Dairy']),
    is_sample_data: 1,
    source_attribution: 'Sahyadri Gastronomy Research (Sample Data)',
  },
  {
    id: 'dish_dal_baati',
    name: 'Dal Baati Churma',
    regional_name: 'दाल बाटी चूरमा',
    region: 'Marwar & Mewar',
    state_id: 'rajasthan',
    city: 'Jaipur',
    category: 'MAINS',
    category_label: 'Royal Desert Classic',
    description: 'Oven-hardened whole wheat dumplings roasted over desert coals, soaked in desi ghee, served alongside spiced five-lentil dal and crushed jaggery churma.',
    cultural_tradition: 'Conceived during early Mewar kingdoms as durable military sustenance; baatis could survive extreme desert aridity and heat for days without spoiling.',
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    dietary_type: 'VEGETARIAN',
    allergens: JSON.stringify(['Gluten', 'Dairy']),
    is_sample_data: 1,
    source_attribution: 'Rajasthan Folk Culture Documentation (Sample Data)',
  },
  {
    id: 'dish_shorshe_ilish',
    name: 'Shorshe Ilish (Hilsa in Mustard Gravy)',
    regional_name: 'সর্ষে ইলিশ',
    region: 'Bengal Riverine Delta',
    state_id: 'west-bengal',
    city: 'Kolkata',
    category: 'MAINS',
    category_label: 'River Delta Culinary Heritage',
    description: 'Fresh Hilsa (Tenualosa ilisha) gently poached in a stone-ground paste of pungent black and yellow mustard seeds, green chillies, and raw cold-pressed kachi ghani mustard oil.',
    cultural_tradition: 'The culinary soul of monsoon Bengal; the monsoon feast of Ilish marks the sacred celebration of riverine abundance across delta villages.',
    image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
    dietary_type: 'NON_VEGETARIAN',
    allergens: JSON.stringify(['Mustard', 'Fish']),
    is_sample_data: 1,
    source_attribution: 'Bengal Culinary Heritage Archive (Sample Data)',
  },
];

const insertDish = db.prepare(`
  INSERT OR IGNORE INTO local_dishes
    (id, name, regional_name, region, state_id, city, event_id, category, category_label,
     description, cultural_tradition, image_url, dietary_type, allergens, is_sample_data, source_attribution)
  VALUES
    (@id, @name, @regional_name, @region, @state_id, @city, @event_id, @category, @category_label,
     @description, @cultural_tradition, @image_url, @dietary_type, @allergens, @is_sample_data, @source_attribution)
`);
for (const d of localDishes) insertDish.run(d);
console.log(`[Seed] Inserted ${localDishes.length} local dishes`);

// ─── Seed Advertisements & Sponsored Campaigns ─────────────────────────────
const advertisements = [
  {
    id: 'ad_karnataka_heritage_pass',
    advertiser_name: 'Karnataka Tourism & KSTDC',
    title: 'Karnataka Golden Chariot & Heritage Circuit Pass',
    description: 'Explore 14 UNESCO & state heritage landmarks from Hampi to Badami with priority entry, local dialect audio guides, and curated cultural heritage walks.',
    image_url: 'https://images.unsplash.com/photo-1600100397608-f010f443b355?w=800&auto=format&fit=crop&q=80',
    destination_url: 'https://kstdc.co/heritage-pass',
    cta_label: 'Get Heritage Pass',
    placement: 'ALL',
    target_state: 'karnataka',
    target_city: 'Bengaluru',
    category: 'tourism',
    event_id: 'evt_1',
    status: 'ACTIVE',
    budget_amount: 25000.00,
    payment_status: 'PAID',
    payment_reference: 'KSTDC-NEFT-8849201',
    payment_verified_at: '2026-10-01 10:00:00',
    payment_notes: 'Verified via KSTDC state tourism bank transfer. Campaign active for Q4.',
    start_date: '2026-10-01',
    end_date: '2027-03-31',
    impressions_count: 342,
    clicks_count: 48,
    created_by: 'usr_rohan',
  },
  {
    id: 'ad_udupi_temple_feast',
    advertiser_name: 'Mitra Samaj & Coastal Heritage Trust',
    title: 'Authentic Udupi Temple Feast & Spice Tasting',
    description: 'Savor a traditional 16-course Satvik banana leaf Bhojana prepared with heirloom recipes, woodfire vessels, and coastal cold-pressed coconut oils.',
    image_url: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80',
    destination_url: 'https://udupikulinary.org/feast',
    cta_label: 'Reserve Dining',
    placement: 'HOMEPAGE',
    target_state: 'karnataka',
    target_city: 'Udupi',
    category: 'food',
    event_id: 'evt_2',
    status: 'ACTIVE',
    budget_amount: 12000.00,
    payment_status: 'PAID',
    payment_reference: 'UPI-MITRA-9482103',
    payment_verified_at: '2026-10-05 14:30:00',
    payment_notes: 'Paid in full via Merchant UPI. Manually reconciled against bank ledger.',
    start_date: '2026-10-05',
    end_date: '2026-12-31',
    impressions_count: 218,
    clicks_count: 31,
    created_by: 'usr_rohan',
  },
  {
    id: 'ad_hampi_craft_walk',
    advertiser_name: 'Deccan Craft & Stone Artisan Collective',
    title: 'Live Terracotta & Stone Carving Masterclass',
    description: 'Hands-on pottery and granite chiseling sessions directly with 4th generation Shilpis beside ancient Tungabhadra temple boulders.',
    image_url: 'https://images.unsplash.com/photo-1599818493175-6b5d63f23e7f?w=800&auto=format&fit=crop&q=80',
    destination_url: 'https://hampicrafts.org/workshops',
    cta_label: 'Book Workshop',
    placement: 'EVENTS',
    target_state: 'karnataka',
    target_city: 'Hampi',
    category: 'workshops',
    event_id: null,
    status: 'ACTIVE',
    budget_amount: 8500.00,
    payment_status: 'PAID',
    payment_reference: 'HMP-BANK-449102',
    payment_verified_at: '2026-10-08 11:15:00',
    payment_notes: 'Cheque deposit cleared into community development escrow account.',
    start_date: '2026-10-08',
    end_date: '2026-11-30',
    impressions_count: 156,
    clicks_count: 19,
    created_by: 'usr_rohan',
  },
  {
    id: 'ad_kerala_kathakali_utsav',
    advertiser_name: 'Kalamandalam Cultural Guild',
    title: 'Chenda Melam & Kathakali Night Residency',
    description: 'Experience sacred temple drum cadences and theatrical Navarasa enactments under bronze oil lamps in an open-air riverfront courtyard.',
    image_url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80',
    destination_url: 'https://kalamandalam.org/utsav',
    cta_label: 'Explore Utsav',
    placement: 'MAP',
    target_state: 'kerala',
    target_city: 'Thrissur',
    category: 'festivals',
    event_id: null,
    status: 'PENDING',
    budget_amount: 15000.00,
    payment_status: 'UNPAID',
    payment_reference: 'PENDING-INVOICE-2026-04',
    payment_verified_at: null,
    payment_notes: 'Pending payment verification by organizers. Awaiting festival sponsorship clearance.',
    start_date: '2026-10-20',
    end_date: '2026-12-15',
    impressions_count: 0,
    clicks_count: 0,
    created_by: 'usr_rohan',
  },
  {
    id: 'ad_mysuru_silk_guild',
    advertiser_name: 'Karnataka Handlooms & Weavers Council',
    title: 'Mysore Silk Zari Weaving Showcase & Direct Fair',
    description: 'Meet master weavers from Melukote and Kollegal. 100% pure gold zari brocades directly from loom to patron with artisan certification.',
    image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80',
    destination_url: 'https://mysuresilktrust.in/exhibition',
    cta_label: 'View Collection',
    placement: 'EXPERIENCES',
    target_state: 'karnataka',
    target_city: 'Mysuru',
    category: 'culture',
    event_id: null,
    status: 'ACTIVE',
    budget_amount: 18000.00,
    payment_status: 'PAID',
    payment_reference: 'KHC-RTGS-7729103',
    payment_verified_at: '2026-10-03 09:30:00',
    payment_notes: 'State Handloom Board sponsorship verified via official RTGS transaction.',
    start_date: '2026-10-01',
    end_date: '2027-01-31',
    impressions_count: 284,
    clicks_count: 42,
    created_by: 'usr_rohan',
  }
];

const insertAd = db.prepare(`
  INSERT OR IGNORE INTO advertisements
    (id, advertiser_name, title, description, image_url, destination_url, cta_label,
     placement, target_state, target_city, category, event_id, status, budget_amount,
     payment_status, payment_reference, payment_verified_at, payment_notes, start_date, end_date,
     impressions_count, clicks_count, created_by)
  VALUES
    (@id, @advertiser_name, @title, @description, @image_url, @destination_url, @cta_label,
     @placement, @target_state, @target_city, @category, @event_id, @status, @budget_amount,
     @payment_status, @payment_reference, @payment_verified_at, @payment_notes, @start_date, @end_date,
     @impressions_count, @clicks_count, @created_by)
`);
for (const ad of advertisements) insertAd.run(ad);
console.log(`[Seed] Inserted ${advertisements.length} advertisements & sponsored campaigns`);

// ─── Seed Culture & Heritage Places & Experiences ───────────────────────────
const heritageSites = [
  // 1. TEMPLES & RELIGIOUS HERITAGE SITES
  {
    id: 'herit_virupaksha_hampi',
    name: 'Virupaksha Temple & Sacred Hampi Complex',
    category: 'TEMPLES_RELIGIOUS',
    category_label: 'Temples & Religious Heritage',
    is_permanent_place: 1,
    state: 'Karnataka',
    state_id: 'karnataka',
    city: 'Hampi',
    location_summary: 'Hampi Bazaar, Vijayanagara District',
    lat: 15.3350,
    lng: 76.4600,
    description: 'Continuous living pilgrimage shrine dedicated to Lord Shiva as Virupaksha since the 7th century CE. Renowned for its 50-meter eastern gopuram, inverted pinhole camera shadow phenomenon in the inner sanctum, and surrounding monolith Tungabhadra ghats.',
    cultural_significance: 'UNESCO World Heritage monument; the spiritual center of the Vijayanagara Empire that survived the 1565 battle.',
    image_url: 'https://images.unsplash.com/photo-1600100397608-f010f443b355?w=800&auto=format&fit=crop&q=80',
    visiting_hours: 'Daily: 6:00 AM – 1:00 PM, 5:00 PM – 9:00 PM',
    event_date: '',
    event_date_iso: '',
    dress_guidelines: 'Modest clothing required. Shoulders and knees must be covered. Traditional Indian attire preferred.',
    photography_rules: 'Photography permitted in outer courtyard; strictly prohibited inside the garbhagriha (inner sanctum).',
    customs_etiquette: 'Remove footwear at designated temple shoe stand before ascending gopuram steps. Maintain silence during aarti.',
    organizer_name: 'Archaeological Survey of India & Hampi World Heritage Area Management Authority (HWHAMA)',
    contact_info: 'Official ASI Hampi Circle Information Desk',
    verification_status: 'VERIFIED',
    source_label: 'Archaeological Survey of India (ASI)',
    source_url: 'https://asi.nic.in',
    submitted_by: 'usr_rohan'
  },
  {
    id: 'herit_brihadisvara_thanjavur',
    name: 'Brihadisvara Great Living Chola Temple',
    category: 'TEMPLES_RELIGIOUS',
    category_label: 'Temples & Religious Heritage',
    is_permanent_place: 1,
    state: 'Tamil Nadu',
    state_id: 'tamil-nadu',
    city: 'Thanjavur',
    location_summary: 'Membalam Rd, Balaganapathy Nagar',
    lat: 10.7828,
    lng: 79.1318,
    description: 'Commissioned by Chola emperor Raja Raja I in 1010 CE. Built entirely of interlocking granite blocks without mortar, featuring an 80-tonne monolithic kumbam atop the 66-meter vimana tower.',
    cultural_significance: 'Pinnacle of Dravidian stone architecture and UNESCO Great Living Chola Temples group.',
    image_url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80',
    visiting_hours: 'Daily: 6:00 AM – 12:30 PM, 4:00 PM – 8:30 PM',
    event_date: '',
    event_date_iso: '',
    dress_guidelines: 'Modest attire. Sleeveless tops and shorts are not permitted.',
    photography_rules: 'Allowed in courtyards; restricted inside main sanctum.',
    customs_etiquette: 'Footwear strictly prohibited within inner temple perimeter. Cloakroom available outside.',
    organizer_name: 'Hindu Religious and Charitable Endowments (HR&CE) & ASI',
    contact_info: 'Thanjavur Palace Devasthanam Administrative Office',
    verification_status: 'VERIFIED',
    source_label: 'Tamil Nadu Tourism Development Corporation',
    source_url: 'https://www.tamilnadutourism.tn.gov.in',
    submitted_by: 'usr_rohan'
  },

  // 2. CHURCHES & CATHEDRALS
  {
    id: 'herit_bom_jesus_goa',
    name: 'Basilica of Bom Jesus',
    category: 'CHURCHES_CATHEDRALS',
    category_label: 'Churches & Cathedrals',
    is_permanent_place: 1,
    state: 'Goa',
    state_id: 'goa',
    city: 'Old Goa',
    location_summary: 'Old Goa Road, Velha Goa',
    lat: 15.5009,
    lng: 73.9116,
    description: 'Constructed in 1605 CE, this Baroque landmark holds the sacred relics of St. Francis Xavier. Famous for its unplastered laterite stone facade, ornate gilded altarpiece, and Florentine marble mausoleum.',
    cultural_significance: 'UNESCO World Heritage monument and one of the oldest surviving Christian architectural sites in Asia.',
    image_url: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
    visiting_hours: 'Monday–Saturday: 9:00 AM – 6:30 PM; Sunday: 10:30 AM – 6:30 PM',
    event_date: '',
    event_date_iso: '',
    dress_guidelines: 'Respectful attire suitable for an active place of worship. Shoulders covered.',
    photography_rules: 'Permitted without flash. Silence mobile phones inside the nave.',
    customs_etiquette: 'Quiet contemplation is observed during prayer services and mass.',
    organizer_name: 'Archdiocese of Goa and Daman & ASI',
    contact_info: 'Basilica Office, Old Goa',
    verification_status: 'VERIFIED',
    source_label: 'Goa Tourism Development Corporation',
    source_url: 'https://goa-tourism.com',
    submitted_by: 'usr_rohan'
  },
  {
    id: 'herit_st_philomena_mysuru',
    name: 'St. Philomena’s Neo-Gothic Cathedral',
    category: 'CHURCHES_CATHEDRALS',
    category_label: 'Churches & Cathedrals',
    is_permanent_place: 1,
    state: 'Karnataka',
    state_id: 'karnataka',
    city: 'Mysuru',
    location_summary: 'Ashoka Road, St Philomena Nagar',
    lat: 12.3210,
    lng: 76.6578,
    description: 'Built under the patronage of Maharaja Nalvadi Krishnaraja Wadiyar in 1936. Designed with 175-foot soaring twin spires modeled after Cologne Cathedral, featuring stained glass windows from France portraying biblical allegories.',
    cultural_significance: 'One of the tallest cathedrals in South Asia and an emblem of Mysuru royal ecumenical patronage.',
    image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop&q=80',
    visiting_hours: 'Daily: 5:00 AM – 6:00 PM',
    event_date: '',
    event_date_iso: '',
    dress_guidelines: 'Decent, modest attire requested for all visitors.',
    photography_rules: 'Allowed outside; restricted inside during liturgical ceremonies.',
    customs_etiquette: 'Switch off mobile phones inside the catacomb crypt and main sanctuary.',
    organizer_name: 'Diocese of Mysore',
    contact_info: 'Cathedral Administrative Parish Office',
    verification_status: 'VERIFIED',
    source_label: 'Karnataka Tourism Department',
    source_url: 'https://karnatakatourism.org',
    submitted_by: 'usr_ananya'
  },

  // 3. MOSQUES & ISLAMIC HERITAGE
  {
    id: 'herit_jama_masjid_delhi',
    name: 'Masjid-i Jahān-Numā (Jama Masjid of Delhi)',
    category: 'MOSQUES_ISLAMIC',
    category_label: 'Mosques & Islamic Heritage',
    is_permanent_place: 1,
    state: 'Delhi',
    state_id: 'delhi',
    city: 'Old Delhi',
    location_summary: 'Chandni Chowk, Central Delhi',
    lat: 28.6507,
    lng: 77.2334,
    description: 'Commissioned by Mughal Emperor Shah Jahan between 1650 and 1656. Built of carved red sandstone and pure white marble, with three domes, two 40-meter minarets, and a vast central courtyard that holds 25,000 worshippers.',
    cultural_significance: 'The principal congregational mosque of the Mughal empire and a monumental masterpiece of Indo-Islamic symmetry.',
    image_url: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=800&auto=format&fit=crop&q=80',
    visiting_hours: 'Daily: 7:00 AM – 12:00 PM, 1:30 PM – 6:30 PM (Closed to visitors during prayer times)',
    event_date: '',
    event_date_iso: '',
    dress_guidelines: 'Modest attire mandatory. Robes and head coverings available at north gate entrance.',
    photography_rules: 'Permitted in courtyard with nominal camera token. Prohibited during congregational namaz.',
    customs_etiquette: 'Remove footwear at outer staircase portals. Shoe minders stationed at each gate.',
    organizer_name: 'Delhi Waqf Board & Management Committee',
    contact_info: 'Jama Masjid Trust Secretariat, Gate No. 1',
    verification_status: 'VERIFIED',
    source_label: 'Delhi Tourism and Transportation Development',
    source_url: 'https://delhitourism.gov.in',
    submitted_by: 'usr_rohan'
  },
  {
    id: 'herit_ibrahim_rauza_bijapur',
    name: 'Ibrahim Rauza Complex (The Black Taj of the Deccan)',
    category: 'MOSQUES_ISLAMIC',
    category_label: 'Mosques & Islamic Heritage',
    is_permanent_place: 1,
    state: 'Karnataka',
    state_id: 'karnataka',
    city: 'Vijayapura',
    location_summary: 'Station Road, Vijayapura (Bijapur)',
    lat: 16.8280,
    lng: 75.6980,
    description: '17th-century Adil Shahi architectural wonder comprising a royal tomb and mosque facing each other across a raised ornamental fountain terrace. Famous for its perforated stone fretwork windows, hanging stone chains, and Persian calligraphic inscriptions.',
    cultural_significance: 'Considered by architectural historians as the inspiration for the Taj Mahal and pinnacle of Deccan Sultanate art.',
    image_url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop&q=80',
    visiting_hours: 'Daily: 6:00 AM – 6:00 PM',
    event_date: '',
    event_date_iso: '',
    dress_guidelines: 'Respectful modest clothing.',
    photography_rules: 'Permitted in gardens and exterior arcades.',
    customs_etiquette: 'Footwear removal required before stepping onto the stone prayer plinth.',
    organizer_name: 'Archaeological Survey of India (Dharwad Circle)',
    contact_info: 'ASI Bijapur Sub-Circle Office',
    verification_status: 'VERIFIED',
    source_label: 'Archaeological Survey of India',
    source_url: 'https://asi.nic.in',
    submitted_by: 'usr_vikram'
  },

  // 4. MONASTERIES & SPIRITUAL HERITAGE
  {
    id: 'herit_hemis_monastery_ladakh',
    name: 'Hemis Gompa (Monastery)',
    category: 'MONASTERIES_SPIRITUAL',
    category_label: 'Monasteries & Spiritual Centers',
    is_permanent_place: 1,
    state: 'Ladakh',
    state_id: 'ladakh',
    city: 'Leh',
    location_summary: 'Hemis National Park Valley, Leh District',
    lat: 33.9126,
    lng: 77.7067,
    description: 'The largest and wealthiest Drukpa Kagyu Buddhist monastery in Ladakh, dating back to 1630. Houses a copper-gilded statue of Lord Buddha, sacred thangkas dating back hundreds of years, and a world-renowned museum of Central Asian Buddhist artifacts.',
    cultural_significance: 'Spiritual hub of the Drukpa lineage in the western Himalayas; host of the vibrant Hemis Cham dance ritual.',
    image_url: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&auto=format&fit=crop&q=80',
    visiting_hours: 'Daily: 8:00 AM – 1:00 PM, 2:00 PM – 6:00 PM',
    event_date: '',
    event_date_iso: '',
    dress_guidelines: 'Warm, modest attire. Hats and sunglasses must be removed inside prayer halls.',
    photography_rules: 'Permitted in courtyards; strictly prohibited inside the main Dukhang and secret shrine chambers.',
    customs_etiquette: 'Walk clockwise around prayer wheels, stupas, and altars. Maintain quiet during chant recitations.',
    organizer_name: 'Hemis Monastery Administrative Trust',
    contact_info: 'Hemis Gompa Management Committee, Leh',
    verification_status: 'VERIFIED',
    source_label: 'Ladakh Tourism Department',
    source_url: 'https://www.ladakhtourism.org',
    submitted_by: 'usr_rohan'
  },
  {
    id: 'herit_namdroling_bylakuppe',
    name: 'Namdroling Monastery (The Golden Temple)',
    category: 'MONASTERIES_SPIRITUAL',
    category_label: 'Monasteries & Spiritual Centers',
    is_permanent_place: 1,
    state: 'Karnataka',
    state_id: 'karnataka',
    city: 'Bylakuppe',
    location_summary: 'Bylakuppe Tibetan Settlement, Near Kushalnagar',
    lat: 12.4285,
    lng: 75.9678,
    description: 'Founded in 1963 by His Holiness Penor Rinpoche. Features three majestic 40-foot gold-plated statues of Buddha Shakyamuni, Padmasambhava, and Amitayus, surrounded by Tibetan traditional murals and sacred mandalas.',
    cultural_significance: 'The largest teaching center of the Nyingma lineage of Tibetan Buddhism in the world.',
    image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop&q=80',
    visiting_hours: 'Daily: 9:00 AM – 6:00 PM',
    event_date: '',
    event_date_iso: '',
    dress_guidelines: 'Respectful and clean attire.',
    photography_rules: 'Allowed inside without flash. Video filming requires permission.',
    customs_etiquette: 'Remove shoes before entering prayer hall. Circumambulate clockwise.',
    organizer_name: 'Namdroling Nyingmapa Monastery Trust',
    contact_info: 'Bylakuppe Information Desk',
    verification_status: 'VERIFIED',
    source_label: 'Karnataka Tourism Board',
    source_url: 'https://karnatakatourism.org',
    submitted_by: 'usr_kavya'
  },

  // 5. HISTORIC MONUMENTS & HERITAGE WALKS
  {
    id: 'herit_golconda_acoustic_walk',
    name: 'Golconda Fort & Acoustic Citadel Heritage Walk',
    category: 'MONUMENTS_WALKS',
    category_label: 'Historic Monuments & Walks',
    is_permanent_place: 1,
    state: 'Telangana',
    state_id: 'telangana',
    city: 'Hyderabad',
    location_summary: 'Ibrahim Bagh, Western Hyderabad',
    lat: 17.3833,
    lng: 78.4011,
    description: 'Medieval diamond capital fortress built by the Kakatiyas and fortified by the Qutb Shahi sultans. Renowned for its acoustic engineering: a hand clap at the grand entry gate (Fateh Darwaza) rings clearly at the highest citadel point a kilometer away.',
    cultural_significance: 'Historic epicenter of the legendary Golconda diamonds (including the Koh-i-Noor and Hope Diamond).',
    image_url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80',
    visiting_hours: 'Daily: 9:00 AM – 5:30 PM; Sound & Light show at 6:30 PM',
    event_date: '',
    event_date_iso: '',
    dress_guidelines: 'Comfortable walking shoes and light cotton clothing suitable for stone stairs.',
    photography_rules: 'Permitted everywhere in the outdoor complex. Professional equipment requires ASI permit.',
    customs_etiquette: 'Do not deface or carve onto historic ramparts. Carry water and follow marked pedestrian pathways.',
    organizer_name: 'Archaeological Survey of India (Hyderabad Circle)',
    contact_info: 'Golconda Fort ASI Ticket and Information Counter',
    verification_status: 'VERIFIED',
    source_label: 'Telangana Tourism Department',
    source_url: 'https://tourism.telangana.gov.in',
    submitted_by: 'usr_rohan'
  },
  {
    id: 'herit_mehrangarh_jodhpur',
    name: 'Mehrangarh Citadel & Blue City Ramparts',
    category: 'MONUMENTS_WALKS',
    category_label: 'Historic Monuments & Walks',
    is_permanent_place: 1,
    state: 'Rajasthan',
    state_id: 'rajasthan',
    city: 'Jodhpur',
    location_summary: 'Fort Rd, Sodagaran Mohalla, Jodhpur',
    lat: 26.2978,
    lng: 73.0185,
    description: 'Rising 410 feet above the blue city of Jodhpur, founded in 1459 by Rao Jodha. Features seven imposing gates with historic cannonball indentations, exquisite filigreed sandstone jharokhas, and a museum of Marwar royal palanquins.',
    cultural_significance: 'One of the best-preserved royal fortress complexes in Rajasthan, operated with international museum standards.',
    image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
    visiting_hours: 'Daily: 9:00 AM – 5:00 PM',
    event_date: '',
    event_date_iso: '',
    dress_guidelines: 'Modest casual attire and sturdy walking shoes.',
    photography_rules: 'Permitted in courtyards; museum sections may restrict flash photography.',
    customs_etiquette: 'Respect royal memorial cenotaphs and preserved state rooms.',
    organizer_name: 'Mehrangarh Museum Trust',
    contact_info: 'Fort Heritage Office, Jodhpur',
    verification_status: 'VERIFIED',
    source_label: 'Rajasthan Tourism Development Corporation (RTDC)',
    source_url: 'https://tourism.rajasthan.gov.in',
    submitted_by: 'usr_meera'
  },

  // 6. TRADITIONAL PERFORMANCES, FESTIVALS & CRAFTS (SCHEDULED & LIVING EXPERIENCES)
  {
    id: 'herit_yakshagana_coastal_circle',
    name: 'Coastal Yakshagana All-Night Folk Theatre & Bannada Vesha',
    category: 'PERFORMANCES_CRAFTS',
    category_label: 'Performances, Festivals & Crafts',
    is_permanent_place: 0,
    state: 'Karnataka',
    state_id: 'karnataka',
    city: 'Udupi',
    location_summary: 'Ambalpadi Temple Open Grounds, Udupi',
    lat: 13.3400,
    lng: 74.7400,
    description: 'An ancient living dance-drama tradition combining classical Carnatic ragas, dramatic Chande drumming, and elaborate natural herbal makeup rituals. Master artists narrate epics with improvisational colloquial dialogue.',
    cultural_significance: 'Living intangible cultural heritage of coastal Karnataka preserving coastal Tuluva and Kannada mythologies.',
    image_url: '/images/yakshagana-art-bg.png',
    visiting_hours: 'Evening: 6:00 PM – Dawn (Open Public Entry)',
    event_date: 'Saturday, Oct 24, 2026 · 6:00 PM',
    event_date_iso: '2026-10-24T18:00:00',
    dress_guidelines: 'Clean modest attire suitable for open-air grass seating.',
    photography_rules: 'Allowed from spectator areas without flash during performances.',
    customs_etiquette: 'Audience members remove footwear at perimeter before sitting on ground mats.',
    organizer_name: 'Udupi Yakshagana Kalanikethana & Cultural Council',
    contact_info: 'Coastal Arts Preservation Society, Udupi',
    verification_status: 'VERIFIED',
    source_label: 'South Zone Cultural Centre & Karnataka Janapada Academy',
    source_url: 'https://karnatakatourism.org',
    submitted_by: 'usr_arjun'
  },
  {
    id: 'herit_raghurajpur_pattachitra',
    name: 'Raghurajpur Living Heritage Crafts Village Walk',
    category: 'PERFORMANCES_CRAFTS',
    category_label: 'Performances, Festivals & Crafts',
    is_permanent_place: 1,
    state: 'Odisha',
    state_id: 'odisha',
    city: 'Puri',
    location_summary: 'Raghurajpur Village, 14 km from Puri',
    lat: 19.8647,
    lng: 85.8280,
    description: 'A designated Heritage Crafts Village where every household is a family of traditional Chitrakar artisans practicing Pattachitra (cloth scroll painting), palm-leaf engraving (Talapatra Chitra), and Gotipua classical acrobat dance.',
    cultural_significance: 'National Heritage Village recognized for preserving 5th-century BCE indigenous artistic methods using organic mineral colors.',
    image_url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&auto=format&fit=crop&q=80',
    visiting_hours: 'Daily: 9:00 AM – 6:00 PM (Direct studio visits with artisans)',
    event_date: '',
    event_date_iso: '',
    dress_guidelines: 'Modest casual clothing.',
    photography_rules: 'Always ask permission before taking close-up portraits of working artisans.',
    customs_etiquette: 'Patrons are encouraged to respect artisan time and buy directly without aggressive bargaining.',
    organizer_name: 'Raghurajpur Crafts Guild & Odisha Tourism',
    contact_info: 'Village Artisan Panchayat Office',
    verification_status: 'VERIFIED',
    source_label: 'Department of Tourism, Government of Odisha',
    source_url: 'https://dot.odishatourism.gov.in',
    submitted_by: 'usr_rohan'
  },

  // 7. HIDDEN VILLAGES & LESSER-KNOWN HERITAGE DESTINATIONS
  {
    id: 'herit_anegundi_kishkindha',
    name: 'Anegundi Ancient Kishkindha Heritage Village',
    category: 'HIDDEN_VILLAGES',
    category_label: 'Hidden Villages & Rural Destinations',
    is_permanent_place: 1,
    state: 'Karnataka',
    state_id: 'karnataka',
    city: 'Anegundi',
    location_summary: 'Across Tungabhadra River, Gangavathi Taluk',
    lat: 15.3520,
    lng: 76.4940,
    description: 'Predating Hampi by centuries, Anegundi is historically associated with Kishkindha, the monkey kingdom of the Ramayana. Features pre-historic rock art shelters, traditional coracle river ferries, banana fiber artisan collectives, and intact medieval gateway fortifications.',
    cultural_significance: 'Cradle of Vijayanagara culture, promoting sustainable rural community-based conservation through the Kishkinda Trust.',
    image_url: 'https://images.unsplash.com/photo-1600100397608-f010f443b355?w=800&auto=format&fit=crop&q=80',
    visiting_hours: 'Sunrise to Sunset daily; village walks best in early morning',
    event_date: '',
    event_date_iso: '',
    dress_guidelines: 'Modest village clothing. Avoid revealing beachwear.',
    photography_rules: 'Permitted with friendly courtesy towards residents.',
    customs_etiquette: 'Respect rural homes, avoid plastic littering, support local women self-help artisan cooperatives.',
    organizer_name: 'The Kishkinda Trust (TKT) & Local Gram Panchayat',
    contact_info: 'Uramma Heritage Homes & TKT Office, Anegundi',
    verification_status: 'VERIFIED',
    source_label: 'Kishkinda Trust Rural Tourism Initiative',
    source_url: 'https://karnatakatourism.org',
    submitted_by: 'usr_priya'
  },
  {
    id: 'herit_mawlynnong_root_bridges',
    name: 'Mawlynnong Living Root Bridges Eco-Village',
    category: 'HIDDEN_VILLAGES',
    category_label: 'Hidden Villages & Rural Destinations',
    is_permanent_place: 1,
    state: 'Meghalaya',
    state_id: 'meghalaya',
    city: 'East Khasi Hills',
    location_summary: 'Pynursla Tehsil, East Khasi Hills District',
    lat: 25.2017,
    lng: 91.8800,
    description: 'Renowned as God’s Own Garden, Mawlynnong is celebrated for its community-driven cleanliness and indigenous Khasi bio-engineering of living root bridges made by guiding Ficus elastica aerial roots across mountain torrents.',
    cultural_significance: 'Exemplifies sustainable matrilineal tribal community harmony and centuries-old living botanical architecture.',
    image_url: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&auto=format&fit=crop&q=80',
    visiting_hours: 'Daily: 7:00 AM – 5:30 PM (No entry after dusk)',
    event_date: '',
    event_date_iso: '',
    dress_guidelines: 'Sturdy rainproof footwear and comfortable modest trekking clothing.',
    photography_rules: 'Permitted throughout village pathways and root bridge areas.',
    customs_etiquette: 'Strict zero-littering policy; all waste must be placed in bamboo conical dustbins. Keep noise levels minimal.',
    organizer_name: 'Mawlynnong Village Council & Meghalaya Tourism',
    contact_info: 'Village Headman Office & Tourism Gate Counter',
    verification_status: 'VERIFIED',
    source_label: 'Meghalaya Tourism Development Corporation',
    source_url: 'https://www.meghalayatourism.in',
    submitted_by: 'usr_rohan'
  }
];

const insertHeritage = db.prepare(`
  INSERT OR IGNORE INTO heritage_sites (
    id, name, category, category_label, is_permanent_place,
    state, state_id, city, location_summary, lat, lng,
    description, cultural_significance, image_url, visiting_hours,
    event_date, event_date_iso, dress_guidelines, photography_rules,
    customs_etiquette, organizer_name, contact_info, verification_status,
    source_label, source_url, submitted_by
  ) VALUES (
    @id, @name, @category, @category_label, @is_permanent_place,
    @state, @state_id, @city, @location_summary, @lat, @lng,
    @description, @cultural_significance, @image_url, @visiting_hours,
    @event_date, @event_date_iso, @dress_guidelines, @photography_rules,
    @customs_etiquette, @organizer_name, @contact_info, @verification_status,
    @source_label, @source_url, @submitted_by
  )
`);

for (const h of heritageSites) insertHeritage.run(h);
console.log(`[Seed] Inserted ${heritageSites.length} culture & heritage sites and experiences`);

console.log('[Seed] Done! Demo accounts (password: demo1234): rohan, priya, arjun, ananya, kavya, vikram, aditya, meera');

