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
     lat, lng, preferred_mode, is_discoverable, fuzzed_location)
  VALUES
    (@id, @username, @handle, @password_hash, @name, @bio, @avatar_url, @state, @city,
     @neighborhood, @lat, @lng, @preferred_mode, @is_discoverable, @fuzzed_location)
  ON CONFLICT(id) DO UPDATE SET avatar_url = excluded.avatar_url
`);

for (const u of users) {
  const password_hash = bcrypt.hashSync(u.password, HASH_ROUNDS);
  const { password, ...rest } = u;  // strip plain password — not a DB column
  insertUser.run({ ...rest, password_hash });
}
console.log(`[Seed] Inserted ${users.length} users`);

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

console.log('[Seed] Done! Demo accounts (password: demo1234): rohan, priya, arjun, ananya, kavya, vikram, aditya, meera');

