// Initial Mock & Seed Data for ShareSpot: The Lost Connection
// Track: Culture & Community (M# 2026)

export const INITIAL_INTERESTS = [
  { id: 'culture', name: 'Culture & Heritage', icon: 'account_balance', desc: 'Traditions, rituals & folklore' },
  { id: 'languages', name: 'Dialects & Languages', icon: 'translate', desc: 'Tulu, Konkani, Kannada, Kodava' },
  { id: 'crafts', name: 'Traditional Crafts', icon: 'palette', desc: 'Pottery, weaving, Yakshagana makeup' },
  { id: 'music', name: 'Folk & Classical Music', icon: 'music_note', desc: 'Carnatic, Yakshagana Tala, folk songs' },
  { id: 'food', name: 'Culinary Heritage', icon: 'restaurant', desc: 'Heirloom recipes, regional foodways' },
  { id: 'hackathons', name: 'Technology & Hackathons', icon: 'terminal', desc: 'Coding, AI, open source builders' },
  { id: 'campus', name: 'Campus Events & Fests', icon: 'celebration', desc: 'Revels, UTSAV, club workshops' },
  { id: 'film', name: 'Movies & Regional Cinema', icon: 'movie', desc: 'Coastal films, indie screenings' },
  { id: 'literature', name: 'Books & Literature', icon: 'menu_book', desc: 'Poetry circles, regional writers' },
  { id: 'workshops', name: 'Workshops & Mentorship', icon: 'psychology', desc: 'Hands-on skill exchanges' }
];

export const INITIAL_USER = {
  id: 'usr_rohan',
  name: 'Rohan Shenoy',
  handle: '@rohan_coastal',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  bio: 'First-year CS student from Mangalore. Miss speaking Tulu, passionate about Yakshagana music and coastal folklore.',
  city: 'Manipal',
  neighborhood: 'Academic Block 3 / MIT Campus',
  lat: 13.3525,
  lng: 74.7928,
  preferredMode: 'BOTH',
  isDiscoverable: true,
  interests: ['culture', 'languages', 'crafts', 'music', 'food'],
  intentions: {
    languages: 'WANTS_TO_LEARN',
    crafts: 'WANTS_TO_LEARN',
    music: 'CASUAL_ENTHUSIAST',
    culture: 'NATIVE_SPEAKER'
  },
  savedEvents: ['evt_1', 'evt_3'],
  connectedUserIds: ['usr_priya', 'usr_arjun']
};

export const INITIAL_EVENTS = [
  {
    id: 'evt_1',
    title: 'Yakshagana Prasanga & Live Makeup Demonstration',
    category: 'culture',
    categoryLabel: 'Culture & Heritage',
    date: 'Saturday, Oct 18 • 5:30 PM',
    datetime: '2026-10-18T17:30:00',
    venue: 'MIT Student Quadrangle (Open Amphitheatre)',
    neighborhood: 'MIT Campus, Manipal',
    lat: 13.3518,
    lng: 74.7932,
    isOnline: false,
    organizer: 'Yakshagana Kendra & MAHE Cultural Society',
    image: 'https://images.unsplash.com/photo-1609137144822-0d1279a099f6?w=800&auto=format&fit=crop&q=80',
    description: 'Witness the breathtaking transformation of coastal Karnataka folklore! Renowned artists showcase the 3-hour natural herbal makeup ritual (Bannada Vesha) followed by an authentic Tala Maddale performance.',
    sourceUrl: 'https://reddit.com/r/manipal/comments/cultural_meetup_yakshagana',
    sourceLabel: 'Verified MAHE Club Notice',
    verificationStatus: 'VERIFIED',
    attendeeCount: 142,
    isSaved: true
  },
  {
    id: 'evt_2',
    title: 'Tulu Bhasha Koota: Conversational Circle for Beginners',
    category: 'languages',
    categoryLabel: 'Dialects & Languages',
    date: 'Sunday, Oct 19 • 11:00 AM',
    datetime: '2026-10-19T11:00:00',
    venue: 'KMC Greens Gazebo, Near Tiger Circle',
    neighborhood: 'Tiger Circle, Manipal',
    lat: 13.3541,
    lng: 74.7895,
    isOnline: false,
    organizer: 'Coastal Dialects Preservation Circle',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=80',
    description: 'Moved to coastal Karnataka and want to speak like a local? Join native speakers sharing essential colloquial idioms, market banter, and coastal humor over hot filter coffee.',
    sourceUrl: 'https://reddit.com/r/manipal/comments/tulu_learning_circle',
    sourceLabel: 'r/manipal Community Post',
    verificationStatus: 'COMMUNITY_REPORTED',
    attendeeCount: 38,
    isSaved: false
  },
  {
    id: 'evt_3',
    title: 'Heirloom Coastal Cuisine: Neer Dosa & Ghee Roast Masterclass',
    category: 'food',
    categoryLabel: 'Culinary Heritage',
    date: 'Friday, Oct 24 • 4:00 PM',
    datetime: '2026-10-24T16:00:00',
    venue: 'Welcomgroup School of Hotel Administration (WGSHA)',
    neighborhood: 'Valley View, Manipal',
    lat: 13.3482,
    lng: 74.7954,
    isOnline: false,
    organizer: 'Chef Ananya Rao (WGSHA Alum)',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    description: 'Learn the delicate secrets of grinding batter for paper-thin Neer Dosas and the ancestral slow-roast Kundapura spice mix directly from regional home cooks.',
    sourceUrl: 'https://instagram.com/wgsha_culinary_heritage',
    sourceLabel: 'Verified Department Workshop',
    verificationStatus: 'VERIFIED',
    attendeeCount: 75,
    isSaved: true
  },
  {
    id: 'evt_4',
    title: 'Manipal Hackathon 2026: Tech & Culture Track Showcase',
    category: 'hackathons',
    categoryLabel: 'Technology & Hackathons',
    date: 'Wednesday, Oct 22 • 9:00 AM',
    datetime: '2026-10-22T09:00:00',
    venue: 'TMA Pai Innovation Centre, Hall 3',
    neighborhood: 'Academic Area, Manipal',
    lat: 13.3533,
    lng: 74.7915,
    isOnline: false,
    organizer: 'M# 2026 Organizing Committee',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    description: 'Over 50 teams present AI, IoT, and community solutions connecting youth to living cultural heritage and sustainable urbanization.',
    sourceUrl: 'https://hackathon.manipal.edu/round2',
    sourceLabel: 'Official Hackathon Portal',
    verificationStatus: 'VERIFIED',
    attendeeCount: 220,
    isSaved: false
  },
  {
    id: 'evt_5',
    title: 'Traditional Terracotta Pottery & Clay Sculpting Workshop',
    category: 'crafts',
    categoryLabel: 'Traditional Crafts',
    date: 'Sunday, Oct 26 • 2:00 PM',
    datetime: '2026-10-26T14:00:00',
    venue: 'Hastashilpa Heritage Village Artisans Shed',
    neighborhood: 'Heritage Village, Manipal',
    lat: 13.3592,
    lng: 74.7985,
    isOnline: false,
    organizer: 'Hastashilpa Heritage Trust',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
    description: 'Sit at the manual wooden wheel under master potter Mahadeva. Learn the ancient coil and throw methods passed through three generations.',
    sourceUrl: 'https://hastashilpa.org/workshops',
    sourceLabel: 'Verified Heritage Trust',
    verificationStatus: 'VERIFIED',
    attendeeCount: 28,
    isSaved: false
  },
  {
    id: 'evt_6',
    title: 'Sunset Carnatic Flute & Fusion Jam Session',
    category: 'music',
    categoryLabel: 'Folk & Classical Music',
    date: 'Saturday, Oct 25 • 6:00 PM',
    datetime: '2026-10-25T18:00:00',
    venue: 'End Point Cliffs Overlooking Swarna River',
    neighborhood: 'End Point Park, Manipal',
    lat: 13.3642,
    lng: 74.7876,
    isOnline: false,
    organizer: 'Manipal Music Circle & Acoustic Club',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    description: 'An open-air sunset gathering blending classical Ragas with acoustic guitars. Bring your flute, tambourine, or just sit on the grass and listen to the river breeze.',
    sourceUrl: 'https://reddit.com/r/manipal/comments/acoustic_sunset_jam',
    sourceLabel: 'r/manipal Music Thread',
    verificationStatus: 'COMMUNITY_REPORTED',
    attendeeCount: 95,
    isSaved: false
  }
];

export const INITIAL_PEOPLE = [
  {
    id: 'usr_priya',
    name: 'Priya Sharma',
    handle: '@priya_tuluva',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    bio: 'Native Tulu & Konkani speaker, final year B.Pharm. Loves sharing folklore stories and helping beginners learn regional dialects.',
    broadRegion: 'Manipal Academic Zone (1.2 km away)',
    lat: 13.3530,
    lng: 74.7910,
    interests: ['languages', 'culture', 'music'],
    speaks: ['Tulu', 'Konkani', 'Kannada', 'English'],
    wantsToLearn: ['Terracotta Pottery', 'Calligraphy'],
    willingToTeach: ['Conversational Tulu', 'Coastal Proverbs'],
    matchScore: 98,
    matchReason: 'Priya is a native Tulu speaker willing to mentor beginners. You both share a love for coastal Karnataka folklore and music.',
    connectionStatus: 'CONNECTED' // 'CONNECTED', 'PENDING', 'NONE'
  },
  {
    id: 'usr_arjun',
    name: 'Arjun Nayak',
    handle: '@arjun_yaksha',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: 'Yakshagana Tala performer & 3rd-year Mechatronics student. Preserving the Maddale drumming rhythms and makeup styles.',
    broadRegion: 'End Point Road (2.4 km away)',
    lat: 13.3610,
    lng: 74.7890,
    interests: ['culture', 'crafts', 'music'],
    speaks: ['Kannada', 'Tulu', 'English'],
    wantsToLearn: ['Python AI Audio Processing'],
    willingToTeach: ['Yakshagana Maddale Beats', 'Traditional Mask Painting'],
    matchScore: 94,
    matchReason: 'Arjun teaches traditional Yakshagana crafts. You both expressed interest in traditional performing arts near campus.',
    connectionStatus: 'CONNECTED'
  },
  {
    id: 'usr_ananya',
    name: 'Ananya Hegde',
    handle: '@ananya_culinary',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    bio: 'Food historian and amateur botanist exploring wild coastal greens (Patrode leaves) and heirloom Uttara Kannada pickles.',
    broadRegion: 'Tiger Circle (0.8 km away)',
    lat: 13.3540,
    lng: 74.7890,
    interests: ['food', 'culture', 'workshops'],
    speaks: ['Kannada', 'Havigannada', 'English'],
    wantsToLearn: ['Documentary Photography'],
    willingToTeach: ['Heirloom Spice Blending', 'Foraged Greens Cooking'],
    matchScore: 89,
    matchReason: 'Ananya preserves traditional coastal foodways. You saved the Coastal Cuisine Masterclass.',
    connectionStatus: 'NONE'
  },
  {
    id: 'usr_kavya',
    name: 'Kavya Pillai',
    handle: '@kavya_kodava',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'Kodava speaker from Coorg studying Architecture. Documenting traditional Ainmane ancestral wooden houses.',
    broadRegion: 'Eshwar Nagar (1.9 km away)',
    lat: 13.3490,
    lng: 74.7960,
    interests: ['crafts', 'languages', 'culture'],
    speaks: ['Kodava', 'Kannada', 'English'],
    wantsToLearn: ['Yakshagana Costumes'],
    willingToTeach: ['Kodava Greetings & Proverbs'],
    matchScore: 85,
    matchReason: 'You both share interests in regional architectural crafts and indigenous language preservation.',
    connectionStatus: 'NONE'
  }
];

export const INITIAL_LOCKET_MOMENTS = [
  {
    id: 'lok_1',
    senderId: 'usr_priya',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    momentType: 'WORD_OF_DAY',
    title: 'Tulu Word of the Day',
    vernacularText: 'ಎಂಚ ಉಲ್ಲರ್? (Encha Uller?)',
    phoneticText: '/en-cha ul-ler/',
    meaning: 'How are you? (Polite & respectful greeting used with peers and elders alike)',
    provenance: 'Shared from her grandmother in Udupi',
    audioDuration: '0:04',
    audioUrl: 'mock_audio_tulu_greeting',
    timestamp: '2 hours ago',
    reactions: [
      { id: 'r1', user: 'Rohan', text: 'Loved the pronunciation!' }
    ]
  },
  {
    id: 'lok_2',
    senderId: 'usr_arjun',
    senderName: 'Arjun Nayak',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    momentType: 'CRAFT_STEP',
    title: 'Yakshagana Crown (Kireeta) Gold Leafing',
    vernacularText: 'ಕಿರೀಟ ಕಸೂತಿ (Kireeta Kasooti)',
    meaning: 'Applying natural gum and beaten metal foil to the hand-carved teak wood crown.',
    provenance: 'Practiced at the artisan shed near Saligrama',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    timestamp: 'Yesterday',
    reactions: [
      { id: 'r2', user: 'Rohan', text: 'Stunning craftsmanship!' }
    ]
  }
];

export const INITIAL_CONVERSATIONS = [
  {
    id: 'conv_priya',
    partnerId: 'usr_priya',
    partnerName: 'Priya Sharma',
    partnerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    lastMessage: 'Let’s meet at KMC Greens for the dialect circle this Sunday!',
    lastTime: '10:45 AM',
    unreadCount: 1,
    messages: [
      { id: 'm1', sender: 'usr_priya', text: 'Namaskara Rohan! Saw that you want to practice conversational Tulu.', time: '10:30 AM' },
      { id: 'm2', sender: 'usr_rohan', text: 'Yes! I moved here from Bangalore and really want to understand the coastal slangs.', time: '10:35 AM' },
      { id: 'm3', sender: 'usr_priya', text: 'Awesome! I just sent a voice snippet on our Culture Locket. Practice saying "Encha Uller?" 😄', time: '10:40 AM' },
      { id: 'm4', sender: 'usr_priya', text: 'Let’s meet at KMC Greens for the dialect circle this Sunday!', time: '10:45 AM' }
    ]
  },
  {
    id: 'conv_arjun',
    partnerId: 'usr_arjun',
    partnerName: 'Arjun Nayak',
    partnerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    lastMessage: 'I will bring the Maddale drum to the MIT Quadrangle demo.',
    lastTime: 'Yesterday',
    unreadCount: 0,
    messages: [
      { id: 'm20', sender: 'usr_arjun', text: 'Hey Rohan, are you attending the Yakshagana demo on Saturday?', time: 'Yesterday' },
      { id: 'm21', sender: 'usr_rohan', text: 'Yes, saved it on my ShareSpot calendar! Looking forward to seeing the live makeup.', time: 'Yesterday' },
      { id: 'm22', sender: 'usr_arjun', text: 'I will bring the Maddale drum to the MIT Quadrangle demo.', time: 'Yesterday' }
    ]
  }
];
