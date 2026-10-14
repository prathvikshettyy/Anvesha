// server/src/middleware/auth.js
// JWT authentication middleware. Attach to any route that requires a logged-in user.

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sharespot-dev-secret-change-in-production';

/**
 * Verifies the Authorization: Bearer <token> header.
 * On success: attaches req.user = { id, username, name } and calls next().
 * On failure: returns 401.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Sign a JWT for a user. Expires in 7 days.
 */
export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
