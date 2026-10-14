// server/src/middleware/validate.js
// Input validation helpers used across route handlers.

/**
 * Validates that a string URL is http or https only, OR a server-relative
 * path (e.g. "/uploads/locket/abc.webm") produced by our own upload
 * endpoints. Returns false for javascript:, data:, ftp:, etc.
 */
export function isValidUrl(str) {
  if (!str || typeof str !== 'string') return true; // optional fields are OK if absent
  if (str.startsWith('/') && !str.startsWith('//')) return true; // same-origin relative path
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates lat/lng are in range.
 */
export function isValidCoords(lat, lng) {
  if (lat === undefined && lng === undefined) return true;
  const latN = Number(lat);
  const lngN = Number(lng);
  return latN >= -90 && latN <= 90 && lngN >= -180 && lngN <= 180;
}

// Single source of truth for event categories — mirrored by
// client/src/components/IllustratedPin.jsx (PIN_CATEGORIES) and the
// SubmitEventModal / EventsView category pickers. Keep all three in sync.
const ALLOWED_CATEGORIES = new Set([
  'culture', 'festivals', 'technology', 'music', 'art',
  'film', 'literature', 'science', 'workshops', 'community',
]);

export function isValidCategory(cat) {
  return ALLOWED_CATEGORIES.has(cat);
}

const ALLOWED_MODES = new Set(['BOTH', 'IN_PERSON', 'ONLINE']);
export function isValidMode(mode) {
  return ALLOWED_MODES.has(mode);
}

const ALLOWED_INTENTIONS = new Set([
  'WANTS_TO_LEARN', 'WILLING_TO_TEACH', 'NATIVE_SPEAKER', 'CASUAL_ENTHUSIAST',
]);
export function isValidIntention(i) {
  return ALLOWED_INTENTIONS.has(i);
}

/**
 * Middleware factory: rejects if any required body fields are missing or empty.
 */
export function requireFields(...fields) {
  return (req, res, next) => {
    for (const field of fields) {
      const val = req.body[field];
      if (val === undefined || val === null || val === '') {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    next();
  };
}
