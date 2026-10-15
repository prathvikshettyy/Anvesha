// server/src/middleware/auth.js
// JWT authentication middleware. Attach to any route that requires a logged-in user.

import jwt from 'jsonwebtoken';

const DEFAULT_SECRET = 'sharespot-dev-secret-change-in-production';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_SECRET) {
    console.error('[FATAL] JWT_SECRET must be configured to a secure random string in production');
    process.exit(1);
  }
}

import { db } from '../db/index.js';

export const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

/**
 * Verifies the Authorization: Bearer <token> header.
 * On success: attaches req.user = { id, username, name, is_admin } and calls next().
 * On failure: returns 401.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Ensures the authenticated user has administrative privileges.
 */
export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    try {
      const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.user.id);
      if (!user || !user.is_admin) {
        return res.status(403).json({ error: 'Administrative privileges required' });
      }
      next();
    } catch (err) {
      return res.status(500).json({ error: 'Failed to verify administrative authorization' });
    }
  });
}

/**
 * Optional JWT authentication middleware.
 * If Authorization header is provided and valid, attaches req.user.
 * If header is missing or token is invalid, continues as guest (req.user = undefined).
 */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = payload;
  } catch (_) {
    // Guest fallback
  }
  next();
}

/**
 * Sign a JWT for a user. Expires in 7 days with pinned HS256.
 */
export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      is_admin: Boolean(user.is_admin || user.isAdmin)
    },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '7d' }
  );
}
