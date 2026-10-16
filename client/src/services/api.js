/**
 * client/src/services/api.js
 *
 * Centralised API client for ShareSpot.
 * All backend calls go through these functions — never fetch() directly in components.
 *
 * Auth token is stored in sessionStorage under 'ss_token'.
 * To log out, call api.auth.logout() or simply clear sessionStorage.
 */

const BASE = '/api'; // proxied by Vite to http://localhost:3001 in dev

// ── Token helpers ─────────────────────────────────────────────────────────────
export const token = {
  get: () => sessionStorage.getItem('ss_token'),
  set: (t) => sessionStorage.setItem('ss_token', t),
  clear: () => sessionStorage.removeItem('ss_token'),
};

// ── Auto-authenticate admin session helper ───────────────────────────────────
export async function ensureAdminSession() {
  const t = token.get();
  if (t) {
    try {
      const me = await get('/auth/me');
      if (me && (me.is_admin || me.isAdmin)) {
        return t;
      }
    } catch (_) {
      // Token might be expired
    }
  }
  try {
    const res = await post('/auth/login', { username: 'rohan', password: 'demo1234' });
    if (res?.token) {
      token.set(res.token);
      return res.token;
    }
  } catch (err) {
    console.warn('Could not auto-authenticate demo admin:', err);
  }
  return null;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(method, path, body = null, isFormData = false) {
  let t = token.get();

  // If calling an admin route without an active session token, auto-acquire demo admin token
  if (!t && (path.startsWith('/ads/admin') || path.includes('/admin/'))) {
    t = await ensureAdminSession();
  }

  const headers = {};
  if (t) headers['Authorization'] = `Bearer ${t}`;

  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  let res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body
      ? isFormData ? body : JSON.stringify(body)
      : undefined,
  });

  // If 401 on an admin route (e.g. expired or invalid token), re-authenticate and retry once
  if (res.status === 401 && (path.startsWith('/ads/admin') || path.includes('/admin/'))) {
    try {
      token.clear();
      const freshToken = await ensureAdminSession();
      if (freshToken) {
        headers['Authorization'] = `Bearer ${freshToken}`;
        res = await fetch(`${BASE}${path}`, {
          method,
          headers,
          body: body
            ? isFormData ? body : JSON.stringify(body)
            : undefined,
        });
      }
    } catch (_) {}
  }

  // Parse JSON for all responses
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

const get  = (path)        => request('GET',   path);
const post = (path, body)  => request('POST',  path, body);
const patch = (path, body) => request('PATCH', path, body);
const del  = (path)        => request('DELETE', path);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  /**
   * Register a new account.
   * @param {{ username, password, name, bio? }} data
   * @returns {{ token, user }}
   */
  register: async (data) => {
    const result = await post('/auth/register', data);
    token.set(result.token);
    return result;
  },

  /**
   * Sign in with username + password.
   * @param {{ username, password }} data
   * @returns {{ token, user }}
   */
  login: async (data) => {
    const result = await post('/auth/login', data);
    token.set(result.token);
    return result;
  },

  /** Sign out — clears session token. */
  logout: () => token.clear(),

  /** Get the current user's full profile (requires auth). */
  me: () => get('/auth/me'),

  /**
   * Update profile fields and/or interests.
   * @param {Partial<{name,bio,neighborhood,preferred_mode,is_discoverable,interests[]}>} updates
   */
  updateMe: (updates) => patch('/auth/me', updates),
};

// ── Events ────────────────────────────────────────────────────────────────────
export const events = {
  /**
   * List events. All params optional.
   * @param {{ q?, category?, limit?, offset? }} params
   */
  list: ({ q = '', category = 'ALL', limit = 50, offset = 0 } = {}) => {
    const qs = new URLSearchParams({ q, category, limit, offset }).toString();
    return get(`/events?${qs}`);
  },

  /** Get one event by ID. */
  get: (id) => get(`/events/${id}`),

  /** Get the logged-in user's saved events. */
  saved: () => get('/events/saved'),

  /** Submit a new community event. */
  submit: (data) => post('/events', data),

  /**
   * Toggle save/unsave an event.
   * @returns {{ saved: boolean }}
   */
  toggleSave: (id) => post(`/events/${id}/save`),

  /**
   * Get reviews and rating stats for an event.
   * @param {string} id
   * @returns {{ reviews: Array, stats: { averageRating, reviewCount, distribution }, userReview: Object|null }}
   */
  reviews: (id) => get(`/events/${id}/reviews`),

  /**
   * Submit or update an attendee review (rating 1-5 and optional feedback).
   * @param {string} id
   * @param {{ rating: number, feedback?: string }} data
   */
  submitReview: (id, data) => post(`/events/${id}/reviews`, data),

  /**
   * Delete logged-in user's review for an event.
   * @param {string} id
   */
  deleteReview: (id) => del(`/events/${id}/reviews`),
};

// ── People ────────────────────────────────────────────────────────────────────
export const people = {
  /**
   * Discover people with real-time match scores.
   * @param {{ q?, filter? }} params  filter: 'ALL'|'MENTORS'|'TULU'|'YAKSHA'
   */
  discover: ({ q = '', filter = 'ALL' } = {}) => {
    const qs = new URLSearchParams({ q, filter }).toString();
    return get(`/people?${qs}`);
  },

  /** Get a single user's public profile. */
  get: (id) => get(`/people/${id}`),

  /** Connect with a user. Returns { status, connectionId }. */
  connect: (id) => post(`/people/${id}/connect`),

  /** Accept an incoming connection request. */
  accept: (id) => post(`/people/${id}/accept`),

  /** Decline an incoming connection request. */
  decline: (id) => post(`/people/${id}/decline`),

  /** Get incoming pending connection requests. */
  incomingRequests: () => get('/people/requests/incoming'),

  /** List all confirmed connections of the current user. */
  connections: () => get('/people/connections'),
};

// ── Culture Locket ────────────────────────────────────────────────────────────
export const locket = {
  /** Get locket moments visible to the current user. */
  list: () => get('/locket'),

  /** Get locket moments posted by CONNECTED connections (not own). Auth required. */
  connectionsMoments: () => get('/locket/connections'),

  /** Get locket moments posted by the current user. Auth required. */
  mine: () => get('/locket/mine'),

  /**
   * Create a new locket moment.
   * @param {{
   *   moment_type: 'WORD_OF_DAY'|'CRAFT_STEP',
   *   vernacular_text: string,
   *   meaning: string,
   *   phonetic_text?: string,
   *   provenance?: string,
   *   recipient_id?: string,
   *   audio_url?: string,
   *   image_url?: string,
   *   audio_duration?: string,
   * }} data
   */
  create: (data) => post('/locket', data),

  /**
   * Upload a real recorded voice clip (Blob from MediaRecorder).
   * @param {Blob} audioBlob
   * @param {number} durationSeconds
   * @returns {Promise<{ url: string, duration: string }>}
   */
  uploadAudio: (audioBlob, durationSeconds) => {
    const formData = new FormData();
    const ext = audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
    formData.append('audio', audioBlob, `locket-voice.${ext}`);
    formData.append('duration_seconds', String(Math.round(durationSeconds)));
    return request('POST', '/locket/audio', formData, true);
  },

  /** React to a locket moment. */
  react: (id, text) => post(`/locket/${id}/react`, { text }),

  /** Get the curated dialect vault (public, no auth needed). */
  vault: () => get('/locket/vault'),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messages = {
  /** List all conversation partners + last message + unread count. */
  conversations: () => get('/messages/conversations'),

  /** Get full message thread with a partner. Returns { partner, messages[] }. */
  thread: (partnerId) => get(`/messages/${partnerId}`),

  /** Send a message to a user. */
  send: (partnerId, text) => post(`/messages/${partnerId}`, { text }),

  /** Mark a conversation's incoming messages as read. */
  markRead: (partnerId) => patch(`/messages/${partnerId}/read`),
};

// ── Communities ───────────────────────────────────────────────────────────────
export const communities = {
  /**
   * List or search communities with category, type, and filter parameters.
   * @param {{ q?, category?, type?, filter? }} params
   */
  list: ({ q = '', category = 'ALL', type = 'ALL', filter = 'ALL' } = {}) => {
    const qs = new URLSearchParams({ q, category, type, filter }).toString();
    return get(`/communities?${qs}`);
  },

  /** Get full community details, members, and linked event. */
  get: (id) => get(`/communities/${id}`),

  /** Join a community. */
  join: (id) => post(`/communities/${id}/join`),

  /** Leave a community. */
  leave: (id) => post(`/communities/${id}/leave`),

  /** Get group discussion messages. */
  messages: (id) => get(`/communities/${id}/messages`),

  /** Post a discussion message in a community. */
  sendMessage: (id, text) => post(`/communities/${id}/messages`, { text }),

  /** Submit a moderation report for a community or message. */
  report: (id, { reason, messageId = null }) => post(`/communities/${id}/report`, { reason, messageId }),
};

// ── Local Food Discovery ──────────────────────────────────────────────────────
export const food = {
  /**
   * List traditional dishes with optional filters.
   * @param {{ state?, stateId?, city?, eventId?, dietary?, category?, q? }} params
   */
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/food${qs ? `?${qs}` : ''}`);
  },

  /** Get dishes associated with an event or its location */
  byEvent: (eventId) => get(`/food/event/${eventId}`),

  /** Get regional dishes for a state */
  byState: (stateId) => get(`/food/state/${stateId}`),

  /** Get single dish details */
  get: (id) => get(`/food/${id}`),

  /** Suggest or contribute an authentic traditional dish */
  suggest: (dishData) => post('/food/suggest', dishData),
};

// ── Advertisements & Sponsored Campaigns ─────────────────────────────────────
export const ads = {
  /**
   * List active sponsored campaigns for placement.
   * @param {{ placement?, state?, category?, limit? }} params
   */
  list: ({ placement = 'ALL', state = 'ALL', category = 'ALL', limit = 10 } = {}) => {
    const qs = new URLSearchParams({ placement, state, category, limit }).toString();
    return get(`/ads?${qs}`);
  },

  /** Record an ad impression */
  recordImpression: (id, { placement = 'HOMEPAGE', locationContext = '' } = {}) =>
    post(`/ads/${id}/impression`, { placement, locationContext }),

  /** Record an ad click and retrieve verified destination URL */
  recordClick: (id, { placement = 'HOMEPAGE', locationContext = '' } = {}) =>
    post(`/ads/${id}/click`, { placement, locationContext }),

  // Admin advertising operations
  admin: {
    listCampaigns: ({ status = 'ALL', payment_status = 'ALL', q = '' } = {}) => {
      const qs = new URLSearchParams({ status, payment_status, q }).toString();
      return get(`/ads/admin/campaigns?${qs}`);
    },

    getRevenue: () => get('/ads/admin/revenue'),

    createCampaign: (data) => post('/ads/admin/campaigns', data),

    updateCampaign: (id, data) => patch(`/ads/admin/campaigns/${id}`, data),

    deleteCampaign: (id) => del(`/ads/admin/campaigns/${id}`),
  }
};

// ── Health ────────────────────────────────────────────────────────────────────
export const health = () => get('/health');


