import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
export const SESSION_COOKIE = 'lynq_admin';

export function hashPassword(password) {
  const salt = randomBytes(16);
  return `${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(expected, actual);
}

export function upsertAdmin(db, { email, password, name = '' }) {
  if (!email || !password || password.length < 10) throw new Error('Admin needs an email and a password of at least 10 characters.');
  db.prepare(`INSERT INTO admins (email, name, password_hash) VALUES (?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, name = excluded.name`)
    .run(email.trim(), name, hashPassword(password));
}

export function createSession(db, adminId) {
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, admin_id, csrf, expires_at) VALUES (?, ?, ?, ?)')
    .run(token, adminId, randomBytes(24).toString('hex'), Date.now() + SESSION_TTL_MS);
  return token;
}

export function destroySession(db, token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export const cookieOptions = (secure) => ({ httpOnly: true, sameSite: 'lax', secure, maxAge: SESSION_TTL_MS, path: '/' });

// Attaches req.admin (with req.admin.csrf) when a valid session cookie is present.
export function loadAdmin(db) {
  const find = db.prepare(`
    SELECT a.id, a.email, a.name, s.csrf FROM sessions s JOIN admins a ON a.id = s.admin_id
    WHERE s.token = ? AND s.expires_at > ?
  `);
  return (req, _res, next) => {
    const token = req.cookies?.[SESSION_COOKIE];
    req.admin = token ? find.get(token, Date.now()) ?? null : null;
    next();
  };
}
