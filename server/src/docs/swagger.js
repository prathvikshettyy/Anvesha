// server/src/docs/swagger.js
// OpenAPI 3.0.3 Specification for ShareSpot REST APIs

import swaggerUi from 'swagger-ui-express';

export const swaggerSpec = {
    openapi: '3.0.3',
    info: {
        title: 'ShareSpot API',
        version: '1.0.0',
        description: `
**ShareSpot** is a hyperlocal cultural community platform connecting students, locals, and enthusiasts around coastal Karnataka heritage, regional languages (Tulu, Konkani, Kannada, Kodava), craft workshops, and community events.

### Authentication
Protected endpoints require a JSON Web Token (JWT) passed in the HTTP Authorization header:
\`\`\`http
Authorization: Bearer <your_jwt_token>
\`\`\`
Obtain a token via **POST /api/auth/login** (e.g. \`username: rohan\`, \`password: demo1234\`) or **POST /api/auth/register**.
Click the **Authorize** button on the top right to authenticate your Swagger UI session.
    `.trim(),
        contact: {
            name: 'ShareSpot Engineering',
            url: 'https://github.com/teamappex/TEAMAPPEX',
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
        },
    },
    servers: [
        {
            url: 'http://localhost:3001',
            description: 'Backend Express Server',
        },
        {
            url: 'http://localhost:5173',
            description: 'Frontend Dev Server (Vite /api Proxy)',
        },
        {
            url: '/',
            description: 'Relative / Same Host',
        },
    ],
    tags: [
        { name: 'Auth', description: 'Authentication and profile management' },
        { name: 'Events', description: 'Cultural events discovery, filtering, and submissions' },
        { name: 'People', description: 'Peer discovery, match scoring, and connections' },
        { name: 'Culture Locket', description: 'Dialect preservation, audio snippets, and cultural vault' },
        { name: 'Messages', description: 'Direct conversations and private peer messaging' },
        { name: 'Health', description: 'Service health and operational status' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT token obtained from /api/auth/login or /api/auth/register.',
            },
        },
        schemas: {
            ErrorResponse: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        example: 'Invalid username or password',
                    },
                },
            },
            SuccessOkResponse: {
                type: 'object',
                properties: {
                    ok: {
                        type: 'boolean',
                        example: true,
                    },
                },
            },
            HealthResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'ShareSpot API' },
                    version: { type: 'string', example: '1.0.0' },
                    timestamp: { type: 'string', format: 'date-time', example: '2026-10-14T12:00:00.000Z' },
                },
            },
            UserInterest: {
                type: 'object',
                properties: {
                    interest_id: { type: 'string', example: 'culture' },
                    intention: {
                        type: 'string',
                        enum: ['WANTS_TO_LEARN', 'WILLING_TO_TEACH', 'NATIVE_SPEAKER', 'CASUAL_ENTHUSIAST'],
                        example: 'CASUAL_ENTHUSIAST',
                    },
                },
            },
            UserSkill: {
                type: 'object',
                properties: {
                    skill: { type: 'string', example: 'Yakshagana Steps' },
                    skill_type: {
                        type: 'string',
                        enum: ['TEACH', 'LEARN'],
                        example: 'TEACH',
                    },
                },
            },
            UserProfile: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'usr_rohan' },
                    username: { type: 'string', example: 'rohan' },
                    handle: { type: 'string', example: '@rohan' },
                    name: { type: 'string', example: 'Rohan Shenoy' },
                    bio: { type: 'string', example: 'Engineering student passionate about coastal folklore & Yakshagana.' },
                    avatar_url: { type: 'string', example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
                    city: { type: 'string', example: 'Manipal' },
                    neighborhood: { type: 'string', example: 'MIT Campus' },
                    lat: { type: 'number', example: 13.3525 },
                    lng: { type: 'number', example: 74.7928 },
                    preferred_mode: {
                        type: 'string',
                        enum: ['BOTH', 'IN_PERSON', 'ONLINE'],
                        example: 'BOTH',
                    },
                    is_discoverable: { type: 'integer', example: 1 },
                    fuzzed_location: { type: 'integer', example: 1 },
                    created_at: { type: 'string', format: 'date-time' },
                    interests: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/UserInterest' },
                    },
                    languages: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['Tulu', 'Kannada', 'English'],
                    },
                    skills: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/UserSkill' },
                    },
                    saved_event_ids: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['evt_yakshagana_1', 'evt_tulu_circle_2'],
                    },
                },
            },
            RegisterRequest: {
                type: 'object',
                required: ['username', 'password', 'name'],
                properties: {
                    username: {
                        type: 'string',
                        minLength: 3,
                        maxLength: 30,
                        pattern: '^[a-z0-9_]+$',
                        example: 'aarav_u',
                    },
                    password: {
                        type: 'string',
                        minLength: 6,
                        example: 'secret123',
                    },
                    name: {
                        type: 'string',
                        maxLength: 80,
                        example: 'Aarav Upadhyaya',
                    },
                    bio: {
                        type: 'string',
                        maxLength: 500,
                        example: 'Literature and coastal heritage enthusiast.',
                    },
                    avatar_url: {
                        type: 'string',
                        example: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
                    },
                },
            },
            LoginRequest: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                    username: {
                        type: 'string',
                        example: 'rohan',
                    },
                    password: {
                        type: 'string',
                        example: 'demo1234',
                    },
                },
            },
            AuthResponse: {
                type: 'object',
                properties: {
                    token: {
                        type: 'string',
                        description: 'JWT Bearer token for authenticating future requests',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                    user: {
                        $ref: '#/components/schemas/UserProfile',
                    },
                },
            },
            UpdateProfileRequest: {
                type: 'object',
                properties: {
                    name: { type: 'string', maxLength: 80, example: 'Rohan Shenoy' },
                    bio: { type: 'string', maxLength: 500, example: 'Updated bio: exploring coastal dialects and theatre' },
                    neighborhood: { type: 'string', example: 'Tiger Circle' },
                    preferred_mode: {
                        type: 'string',
                        enum: ['BOTH', 'IN_PERSON', 'ONLINE'],
                        example: 'IN_PERSON',
                    },
                    is_discoverable: { type: 'integer', enum: [0, 1], example: 1 },
                    fuzzed_location: { type: 'integer', enum: [0, 1], example: 1 },
                    avatar_url: { type: 'string', example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
                    interests: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['interest_id'],
                            properties: {
                                interest_id: { type: 'string', example: 'culture' },
                                intention: {
                                    type: 'string',
                                    enum: ['WANTS_TO_LEARN', 'WILLING_TO_TEACH', 'NATIVE_SPEAKER', 'CASUAL_ENTHUSIAST'],
                                    example: 'CASUAL_ENTHUSIAST',
                                },
                            },
                        },
                    },
                },
            },
            Event: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'evt_yakshagana_1' },
                    title: { type: 'string', example: 'Yakshagana Bayalata: Panchavati Charitre' },
                    category: {
                        type: 'string',
                        enum: ['culture', 'languages', 'crafts', 'music', 'food', 'hackathons', 'campus', 'film', 'literature', 'workshops'],
                        example: 'culture',
                    },
                    categoryLabel: { type: 'string', example: 'Culture & Heritage' },
                    date: { type: 'string', example: 'Saturday, Oct 24 • 7:00 PM' },
                    datetime: { type: 'string', format: 'date-time', example: '2026-10-24T13:30:00.000Z' },
                    venue: { type: 'string', example: 'KMC Greens Amphitheatre' },
                    neighborhood: { type: 'string', example: 'Tiger Circle / KMC' },
                    lat: { type: 'number', example: 13.3541 },
                    lng: { type: 'number', example: 74.7895 },
                    organizer: { type: 'string', example: 'Udupi Yakshagana Kendra' },
                    image: { type: 'string', example: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800' },
                    imageUrl: { type: 'string', example: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800' },
                    description: { type: 'string', example: 'All-night open-air Badagu Thittu Yakshagana performance.' },
                    sourceUrl: { type: 'string', example: 'https://kendra.yakshagana.org/events/panchavati' },
                    sourceLabel: { type: 'string', example: 'Official Troupe' },
                    verificationStatus: { type: 'string', example: 'VERIFIED' },
                    attendeeCount: { type: 'integer', example: 240 },
                    isOnline: { type: 'boolean', example: false },
                    save_count: { type: 'integer', example: 14 },
                },
            },
            CreateEventRequest: {
                type: 'object',
                required: ['title', 'venue'],
                properties: {
                    title: { type: 'string', maxLength: 200, example: 'Coastal Konkani Cooking Circle' },
                    category: {
                        type: 'string',
                        enum: ['culture', 'languages', 'crafts', 'music', 'food', 'hackathons', 'campus', 'film', 'literature', 'workshops'],
                        default: 'culture',
                        example: 'food',
                    },
                    venue: { type: 'string', maxLength: 300, example: 'WGSHA Culinary Lab, Manipal' },
                    neighborhood: { type: 'string', maxLength: 200, example: 'WGSHA Campus' },
                    organizer: { type: 'string', maxLength: 200, example: 'Heritage Food Collective' },
                    description: { type: 'string', maxLength: 2000, example: 'Hands-on preparation of Neer Dosa, Gassi, and Pathrode.' },
                    date: { type: 'string', example: 'Sunday, Oct 25 • 10:00 AM' },
                    date_label: { type: 'string', example: 'Sunday, Oct 25 • 10:00 AM' },
                    datetime_iso: { type: 'string', format: 'date-time', example: '2026-10-25T04:30:00.000Z' },
                    source_url: { type: 'string', format: 'uri', example: 'https://example.com/cooking-workshop' },
                    image_url: { type: 'string', format: 'uri', example: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800' },
                    lat: { type: 'number', example: 13.3482 },
                    lng: { type: 'number', example: 74.7954 },
                },
            },
            SaveToggleResponse: {
                type: 'object',
                properties: {
                    saved: {
                        type: 'boolean',
                        description: 'True if now saved/bookmarked, false if removed',
                        example: true,
                    },
                },
            },
            PersonCandidate: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'usr_priya' },
                    handle: { type: 'string', example: '@priya_m' },
                    name: { type: 'string', example: 'Priya Nayak' },
                    bio: { type: 'string', example: 'Native Tulu speaker and Yakshagana classical dancer.' },
                    avatar: { type: 'string', example: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
                    avatar_url: { type: 'string', example: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
                    broadRegion: { type: 'string', example: 'Udupi Heritage Zone' },
                    preferred_mode: { type: 'string', example: 'BOTH' },
                    interests: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['culture', 'languages', 'crafts'],
                    },
                    speaks: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['Tulu', 'Kannada', 'English'],
                    },
                    willingToTeach: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['Tulu Conversational Phrases', 'Yakshagana Steps'],
                    },
                    wantsToLearn: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['Audio Podcasting', 'Digital Archiving'],
                    },
                    matchScore: {
                        type: 'integer',
                        description: 'Calculated Jaccard interest overlap + skill exchange bonus (1–99)',
                        example: 92,
                    },
                    matchReason: {
                        type: 'string',
                        description: 'Explainable AI rationale for why this person was matched',
                        example: 'You both share interests in Culture, Languages. They can teach Yakshagana Steps which you want to learn.',
                    },
                    connectionStatus: {
                        type: 'string',
                        enum: ['NONE', 'PENDING', 'CONNECTED'],
                        example: 'NONE',
                    },
                },
            },
            ConnectResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'CONNECTED' },
                    connectionId: { type: 'string', example: '0c7562f0-9ef8-49f9-b47f-c1f964a51e60' },
                    message: { type: 'string', example: 'Already connected' },
                },
            },
            DialectVaultPhrase: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'v_1' },
                    dialect: { type: 'string', example: 'Tulu (Coastal Karnataka)' },
                    phrase: { type: 'string', example: 'ಬಲೆ, ಒಣಸ್ ಮಲ್ಪಾ (Bale, Onas Malpa)' },
                    phonetic: { type: 'string', example: '/ba-le o-nas mal-pa/' },
                    english: { type: 'string', example: 'Come, let us share a meal together. (The quintessential coastal gesture of hospitality)' },
                    contributor: { type: 'string', example: 'Preserved by Vasanthi Nayak (Age 72, Kundapura)' },
                    audioDuration: { type: 'string', example: '0:03' },
                },
            },
            LocketReaction: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'c1b48f32-723a-446a-939e-e67c8702bfca' },
                    text: { type: 'string', example: '❤️ Heard and practiced!' },
                    reacted_at: { type: 'string', format: 'date-time' },
                    user_name: { type: 'string', example: 'Rohan Shenoy' },
                },
            },
            LocketMoment: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'lok_3f8a92bc10de' },
                    senderId: { type: 'string', example: 'usr_priya' },
                    senderName: { type: 'string', example: 'Priya Nayak' },
                    senderAvatar: { type: 'string', example: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
                    momentType: {
                        type: 'string',
                        enum: ['WORD_OF_DAY', 'CRAFT_STEP'],
                        example: 'WORD_OF_DAY',
                    },
                    title: { type: 'string', example: 'Dialect Word of the Day' },
                    vernacularText: { type: 'string', example: 'ಎಂಚ ಉಲ್ಲರ್ (Encha Uller)' },
                    phoneticText: { type: 'string', example: '/en-cha ool-ler/' },
                    meaning: { type: 'string', example: 'How are you? (Warm coastal greeting in Tulu)' },
                    provenance: { type: 'string', example: 'Everyday greeting across Udupi & Mangaluru' },
                    audioUrl: { type: 'string', example: '' },
                    imageUrl: { type: 'string', example: '' },
                    audioDuration: { type: 'string', example: '0:04' },
                    timestamp: { type: 'string', format: 'date-time' },
                    reactions: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/LocketReaction' },
                    },
                },
            },
            CreateLocketRequest: {
                type: 'object',
                required: ['vernacular_text', 'meaning'],
                properties: {
                    moment_type: {
                        type: 'string',
                        enum: ['WORD_OF_DAY', 'CRAFT_STEP'],
                        default: 'WORD_OF_DAY',
                        example: 'WORD_OF_DAY',
                    },
                    title: { type: 'string', maxLength: 200, example: 'Coastal Blessing' },
                    vernacular_text: { type: 'string', maxLength: 500, example: 'ಎಂಚ ಉಲ್ಲರ್ (Encha Uller)' },
                    phonetic_text: { type: 'string', maxLength: 200, example: '/en-cha ool-ler/' },
                    meaning: { type: 'string', maxLength: 2000, example: 'How are you? (Quintessential coastal Tulu greeting)' },
                    provenance: { type: 'string', maxLength: 500, example: 'Practiced across Dakshina Kannada & Udupi households' },
                    recipient_id: { type: 'string', description: 'Optional specific user ID or null for community feed', example: 'usr_rohan' },
                    audio_url: { type: 'string', format: 'uri', example: 'https://example.com/audio/encha.mp3' },
                    image_url: { type: 'string', format: 'uri', example: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800' },
                    audio_duration: { type: 'string', example: '0:03' },
                },
            },
            ReactionRequest: {
                type: 'object',
                required: ['text'],
                properties: {
                    text: { type: 'string', maxLength: 200, example: '❤️ Practiced with my roommate!' },
                },
            },
            ConversationItem: {
                type: 'object',
                properties: {
                    partnerId: { type: 'string', example: 'usr_priya' },
                    partnerName: { type: 'string', example: 'Priya Nayak' },
                    partnerAvatar: { type: 'string', example: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
                    partnerHandle: { type: 'string', example: '@priya_m' },
                    lastMessage: { type: 'string', example: 'See you at the Yakshagana rehearsal at 5pm!' },
                    lastTime: { type: 'string', format: 'date-time' },
                    unreadCount: { type: 'integer', example: 1 },
                },
            },
            Message: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'msg_98a72b01' },
                    sender_id: { type: 'string', example: 'usr_rohan' },
                    receiver_id: { type: 'string', example: 'usr_priya' },
                    text: { type: 'string', example: 'Looking forward to the dialect exchange session!' },
                    sent_at: { type: 'string', format: 'date-time' },
                    is_read: { type: 'integer', enum: [0, 1], example: 0 },
                },
            },
            SendMessageRequest: {
                type: 'object',
                required: ['text'],
                properties: {
                    text: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 2000,
                        example: 'Hello! I noticed you are interested in learning conversational Tulu.',
                    },
                },
            },
            ThreadResponse: {
                type: 'object',
                properties: {
                    partner: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'usr_priya' },
                            name: { type: 'string', example: 'Priya Nayak' },
                            handle: { type: 'string', example: '@priya_m' },
                            avatar_url: { type: 'string', example: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
                        },
                    },
                    messages: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Message' },
                    },
                },
            },
        },
    },
    paths: {
        '/api/health': {
            get: {
                tags: ['Health'],
                summary: 'Service health check',
                description: 'Returns the operational health and timestamp of the ShareSpot Express API service.',
                responses: {
                    200: {
                        description: 'Service is operational',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/HealthResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register a new account',
                description: 'Creates a new user profile with hashed credentials and returns a JWT token.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RegisterRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Account created successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AuthResponse' },
                            },
                        },
                    },
                    400: {
                        description: 'Validation error',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                    409: {
                        description: 'Username already taken',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Log in to account',
                description: 'Authenticates user credentials and returns a JWT Bearer token.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Authentication successful',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AuthResponse' },
                            },
                        },
                    },
                    400: {
                        description: 'Missing required credentials',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                    401: {
                        description: 'Invalid username or password',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Get current user profile',
                description: 'Returns the full authenticated user profile, saved events, and cultural interests.',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Current user profile',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UserProfile' },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
            patch: {
                tags: ['Auth'],
                summary: 'Update current user profile',
                description: 'Update user bio, preferred mode (IN_PERSON/ONLINE/BOTH), discoverability, and interests.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Profile updated successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessOkResponse' },
                            },
                        },
                    },
                    400: {
                        description: 'Invalid input or field values',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/events': {
            get: {
                tags: ['Events'],
                summary: 'List cultural events',
                description: 'Returns verified and community-submitted cultural events with coordinate points for interactive map display.',
                parameters: [
                    {
                        name: 'q',
                        in: 'query',
                        description: 'Search keyword matching title, description, venue, or organizer',
                        required: false,
                        schema: { type: 'string', example: 'Yakshagana' },
                    },
                    {
                        name: 'category',
                        in: 'query',
                        description: 'Filter events by category (or ALL)',
                        required: false,
                        schema: {
                            type: 'string',
                            enum: ['ALL', 'culture', 'languages', 'crafts', 'music', 'food', 'hackathons', 'campus', 'film', 'literature', 'workshops'],
                            default: 'ALL',
                        },
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        description: 'Maximum events to return (max 100)',
                        required: false,
                        schema: { type: 'integer', default: 50, maximum: 100 },
                    },
                    {
                        name: 'offset',
                        in: 'query',
                        description: 'Number of events to skip for pagination',
                        required: false,
                        schema: { type: 'integer', default: 0 },
                    },
                ],
                responses: {
                    200: {
                        description: 'List of events matching criteria',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Event' },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Events'],
                summary: 'Submit a new cultural event',
                description: 'Submit a community event. Automatically geocodes known Manipal venues (KMC Greens, End Point, Tiger Circle, etc.).',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateEventRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Event created successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Event' },
                            },
                        },
                    },
                    400: {
                        description: 'Invalid event data or missing title/venue',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/events/saved': {
            get: {
                tags: ['Events'],
                summary: 'List saved/bookmarked events',
                description: 'Returns all events bookmarked by the currently authenticated user.',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Array of saved events',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Event' },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/events/{id}': {
            get: {
                tags: ['Events'],
                summary: 'Get event by ID',
                description: 'Returns the full details and location coordinates for a specific cultural event.',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'Event ID',
                        schema: { type: 'string', example: 'evt_yakshagana_1' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Event found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Event' },
                            },
                        },
                    },
                    404: {
                        description: 'Event not found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/events/{id}/save': {
            post: {
                tags: ['Events'],
                summary: 'Bookmark or unbookmark an event',
                description: 'Toggles bookmark state for the specified event for the authenticated user.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'Event ID',
                        schema: { type: 'string', example: 'evt_yakshagana_1' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Bookmark state toggled',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SaveToggleResponse' },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                    404: {
                        description: 'Event not found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/people': {
            get: {
                tags: ['People'],
                summary: 'Discover peers with explainable match scoring',
                description: 'Discovers discoverable members. Computes transparent Jaccard similarity and skill-exchange compatibility score (1–99) along with human-readable match reason.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'q',
                        in: 'query',
                        description: 'Filter candidates by name or bio',
                        required: false,
                        schema: { type: 'string' },
                    },
                    {
                        name: 'filter',
                        in: 'query',
                        description: 'Filter candidates by specific criteria',
                        required: false,
                        schema: {
                            type: 'string',
                            enum: ['ALL', 'TULU', 'MENTORS', 'YAKSHA'],
                            default: 'ALL',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'List of matching members sorted by match score descending',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/PersonCandidate' },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/people/connections': {
            get: {
                tags: ['People'],
                summary: 'List confirmed connections',
                description: 'Returns all users who have an active CONNECTED relationship with the authenticated user.',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'List of connected users',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/PersonCandidate' },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/people/{id}': {
            get: {
                tags: ['People'],
                summary: 'Get public member profile',
                description: 'Returns public profile information for a discoverable user.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'User ID',
                        schema: { type: 'string', example: 'usr_priya' },
                    },
                ],
                responses: {
                    200: {
                        description: 'User profile found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/PersonCandidate' },
                            },
                        },
                    },
                    404: {
                        description: 'User not found or profile is hidden',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/people/{id}/connect': {
            post: {
                tags: ['People'],
                summary: 'Connect with a peer',
                description: 'Sends or confirms a connection link with the specified user.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'Target User ID to connect with',
                        schema: { type: 'string', example: 'usr_priya' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Connection status updated',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ConnectResponse' },
                            },
                        },
                    },
                    201: {
                        description: 'New connection created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ConnectResponse' },
                            },
                        },
                    },
                    400: {
                        description: 'Cannot connect with yourself',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                    404: {
                        description: 'User not found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/locket/vault': {
            get: {
                tags: ['Culture Locket'],
                summary: 'Get dialect archive vault',
                description: 'Returns preserved indigenous expressions and dialect audio records (Tulu, Konkani, Kodava, Havigannada). Publicly accessible.',
                responses: {
                    200: {
                        description: 'Preserved dialect phrases',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/DialectVaultPhrase' },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/locket/connections': {
            get: {
                tags: ['Culture Locket'],
                summary: "List connected peers' locket moments",
                description: "Returns locket moments authored by users who have a CONNECTED connection with the authenticated user (both directions). Does not include user's own moments, and excludes location data.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Array of cultural locket moments from connected peers',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/LocketMoment' },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/locket/mine': {
            get: {
                tags: ['Culture Locket'],
                summary: "List authenticated user's own locket moments",
                description: "Returns all cultural locket moments posted by the authenticated user. Excludes location data.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Array of personal cultural locket moments',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/LocketMoment' },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/locket': {
            get: {
                tags: ['Culture Locket'],
                summary: 'List visible locket moments',
                description: 'Returns cultural audio/visual locket moments sent directly to the authenticated user, by the user, or shared with the community.',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Array of cultural locket moments',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/LocketMoment' },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Culture Locket'],
                summary: 'Create a new cultural locket moment',
                description: 'Share a vernacular word-of-the-day or craft step with audio and pronunciation guides.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateLocketRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Locket moment created successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LocketMoment' },
                            },
                        },
                    },
                    400: {
                        description: 'Validation error',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/locket/{id}/react': {
            post: {
                tags: ['Culture Locket'],
                summary: 'React to a locket moment',
                description: 'Add an emotional reaction or comment to a locket moment (authorized for sender or recipient).',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'Locket Moment ID',
                        schema: { type: 'string', example: 'lok_3f8a92bc10de' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ReactionRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Reaction recorded',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        text: { type: 'string', example: '❤️ Heard and practiced!' },
                                        userId: { type: 'string', example: 'usr_rohan' },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Missing or invalid reaction text',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                    403: {
                        description: 'Not authorized to react to this moment',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                    404: {
                        description: 'Locket moment not found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/messages/conversations': {
            get: {
                tags: ['Messages'],
                summary: 'List all direct message conversations',
                description: 'Returns the list of active direct message conversations for the authenticated user, with latest message snippet and unread counter.',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'List of conversations',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/ConversationItem' },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/messages/{partnerId}': {
            get: {
                tags: ['Messages'],
                summary: 'Get message thread with user',
                description: 'Returns conversation history between the authenticated user and specified peer.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'partnerId',
                        in: 'path',
                        required: true,
                        description: 'User ID of conversation partner',
                        schema: { type: 'string', example: 'usr_priya' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Message thread',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ThreadResponse' },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                    404: {
                        description: 'User not found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Messages'],
                summary: 'Send a direct message',
                description: 'Sends a direct message to the specified conversation partner.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'partnerId',
                        in: 'path',
                        required: true,
                        description: 'Recipient User ID',
                        schema: { type: 'string', example: 'usr_priya' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/SendMessageRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Message sent successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Message' },
                            },
                        },
                    },
                    400: {
                        description: 'Cannot message yourself or empty message',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                    404: {
                        description: 'User not found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/messages/{partnerId}/read': {
            patch: {
                tags: ['Messages'],
                summary: 'Mark thread as read',
                description: 'Marks all incoming messages from this user as read.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'partnerId',
                        in: 'path',
                        required: true,
                        description: 'User ID of sender whose messages should be marked as read',
                        schema: { type: 'string', example: 'usr_priya' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Messages marked as read',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessOkResponse' },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - valid JWT required',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' },
                            },
                        },
                    },
                },
            },
        },
    },
};

export const swaggerUiOptions = {
    customSiteTitle: 'ShareSpot API — Interactive Documentation',
    customCss: `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&display=swap');
    
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #FAF6F0;
      color: #3D231E;
    }
    
    .swagger-ui .topbar {
      background: linear-gradient(135deg, #2A1B18 0%, #3D231E 100%);
      border-bottom: 3px solid #C56E50;
      padding: 14px 0;
      box-shadow: 0 4px 16px rgba(42, 27, 24, 0.15);
    }
    
    .swagger-ui .topbar .topbar-wrapper {
      max-width: 1400px;
      padding: 0 24px;
    }
    
    .swagger-ui .topbar .topbar-wrapper a {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }
    
    .swagger-ui .topbar .topbar-wrapper a::after {
      content: 'ShareSpot Cultural API Explorer';
      color: #F6EDE1;
      font-family: 'DM Sans', sans-serif;
      font-weight: 700;
      font-size: 1.15rem;
      letter-spacing: -0.01em;
    }

    .swagger-ui .topbar-wrapper img {
      width: 28px;
      height: 28px;
      content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23C56E50"><circle cx="12" cy="12" r="10" fill="%23C56E50"/><circle cx="12" cy="12" r="4" fill="%23FAF6F0"/></svg>');
    }

    .swagger-ui .info {
      margin: 32px 0 24px;
      padding: 28px;
      background: #FFFFFF;
      border: 1px solid #E8DACB;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(91, 51, 44, 0.05);
    }

    .swagger-ui .info .title {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 700;
      color: #2A1B18;
      font-size: 2.2rem;
    }

    .swagger-ui .info .description {
      font-size: 1rem;
      line-height: 1.6;
      color: #5B332C;
    }

    .swagger-ui .scheme-container {
      background: #F6EDE1;
      border: 1px solid #E8DACB;
      border-radius: 10px;
      padding: 14px 24px;
      margin-bottom: 24px;
      box-shadow: none;
    }

    .swagger-ui .opblock {
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      margin-bottom: 12px;
      overflow: hidden;
      border: 1px solid transparent;
    }

    .swagger-ui .opblock.opblock-get {
      background: rgba(46, 125, 50, 0.05);
      border-color: rgba(46, 125, 50, 0.3);
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #2E7D32;
    }

    .swagger-ui .opblock.opblock-post {
      background: rgba(197, 110, 80, 0.06);
      border-color: rgba(197, 110, 80, 0.35);
    }
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #C56E50;
    }

    .swagger-ui .opblock.opblock-patch {
      background: rgba(217, 119, 6, 0.06);
      border-color: rgba(217, 119, 6, 0.35);
    }
    .swagger-ui .opblock.opblock-patch .opblock-summary-method {
      background: #D97706;
    }

    .swagger-ui .opblock.opblock-delete {
      background: rgba(220, 38, 38, 0.06);
      border-color: rgba(220, 38, 38, 0.35);
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: #DC2626;
    }

    .swagger-ui .btn.authorize {
      background-color: #C56E50;
      border-color: #C56E50;
      color: #FFFFFF;
      border-radius: 8px;
      font-weight: 600;
      padding: 8px 18px;
      transition: all 0.2s ease;
    }
    .swagger-ui .btn.authorize:hover {
      background-color: #B35D40;
      border-color: #B35D40;
    }
    .swagger-ui .btn.authorize svg {
      fill: #FFFFFF;
    }

    .swagger-ui .opblock-tag {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 1.35rem;
      border-bottom: 2px solid #E8DACB;
      color: #2A1B18;
      padding: 16px 0 10px;
    }
  `,
    swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
    },
};

/**
 * Mounts Swagger UI and OpenAPI JSON endpoints on the Express application.
 *
 * @param {import('express').Express} app - Express application instance
 * @param {string} [basePath='/api/docs'] - Primary route path for the docs
 */
export function setupSwagger(app, basePath = '/api/docs') {
    const serveSpecJson = (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.json(swaggerSpec);
    };

    // Raw OpenAPI 3.0.3 specification JSON endpoints
    app.get(`${basePath}.json`, serveSpecJson);
    app.get('/api-docs.json', serveSpecJson);

    // Turnkey Swagger UI setup
    const swaggerUiHandler = swaggerUi.setup(swaggerSpec, swaggerUiOptions);

    app.use(basePath, swaggerUi.serve, swaggerUiHandler);

    // Also mount on standard aliases for developer convenience
    if (basePath === '/api/docs') {
        app.use('/api-docs', swaggerUi.serve, swaggerUiHandler);
        app.use('/docs', swaggerUi.serve, swaggerUiHandler);
    }
}

export { swaggerUi };
export default setupSwagger;
