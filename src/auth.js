import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_COOKIE = 'lynq_session';

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(expected, actual);
}

export function createSession(db, userId) {
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .run(token, userId, Date.now() + SESSION_TTL_MS);
  return token;
}

export function destroySession(db, token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function cookieOptions(secure) {
  return { httpOnly: true, sameSite: 'lax', secure, maxAge: SESSION_TTL_MS, path: '/' };
}

// Attaches req.user when a valid session cookie is present.
export function loadUser(db) {
  const find = db.prepare(`
    SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > ?
  `);
  return (req, _res, next) => {
    const token = req.cookies?.[SESSION_COOKIE];
    req.user = token ? find.get(token, Date.now()) ?? null : null;
    next();
  };
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in.' });
  next();
}
