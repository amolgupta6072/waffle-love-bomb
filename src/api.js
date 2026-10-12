import express, { Router } from 'express';
import * as v from './validate.js';
import {
  hashPassword, verifyPassword, createSession, destroySession,
  cookieOptions, requireUser, SESSION_COOKIE,
} from './auth.js';

const MAX_LINKS = 100;

function publicUser(u) {
  return {
    id: u.id, email: u.email, username: u.username, display_name: u.display_name,
    bio: u.bio, avatar_url: u.avatar_url, theme: u.theme, page_views: u.page_views,
  };
}

export function apiRouter(db, { secureCookies }) {
  const r = Router();
  r.use(express.json({ limit: '50kb' }));

  // State-changing requests must carry a custom header. Browsers won't send
  // one cross-origin without a CORS preflight we never approve, so this
  // blocks CSRF from other sites.
  r.use((req, res, next) => {
    if (req.method !== 'GET' && req.get('X-Lynq-Request') !== '1') {
      return res.status(403).json({ error: 'Missing request header.' });
    }
    next();
  });

  const startSession = (res, userId) =>
    res.cookie(SESSION_COOKIE, createSession(db, userId), cookieOptions(secureCookies));

  r.post('/signup', (req, res) => {
    const email = v.email(req.body.email);
    const username = v.username(req.body.username);
    const password = v.password(req.body.password);
    const taken = db.prepare('SELECT email, username FROM users WHERE email = ? OR username = ?').get(email, username);
    if (taken) {
      const what = taken.username.toLowerCase() === username ? 'That username is taken.' : 'An account with that email already exists.';
      return res.status(409).json({ error: what });
    }
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO users (email, username, password_hash, display_name) VALUES (?, ?, ?, ?)',
    ).run(email, username, hashPassword(password), username);
    startSession(res, Number(lastInsertRowid));
    res.status(201).json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid)) });
  });

  r.post('/login', (req, res) => {
    const login = typeof req.body.login === 'string' ? req.body.login.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(login, login);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Wrong username/email or password.' });
    }
    startSession(res, user.id);
    res.json({ user: publicUser(user) });
  });

  r.post('/logout', (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (token) destroySession(db, token);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  r.get('/check-username', (req, res) => {
    try {
      const name = v.username(req.query.username);
      const taken = db.prepare('SELECT 1 FROM users WHERE username = ?').get(name);
      res.json({ available: !taken, error: taken ? 'That username is taken.' : null });
    } catch (err) {
      if (err instanceof v.ValidationError) return res.json({ available: false, error: err.message });
      throw err;
    }
  });

  r.use(requireUser);

  r.get('/me', (req, res) => {
    const links = db.prepare('SELECT * FROM links WHERE user_id = ? ORDER BY position, id').all(req.user.id);
    res.json({ user: publicUser(req.user), links });
  });

  r.patch('/me', (req, res) => {
    const fields = v.profile(req.body);
    const keys = Object.keys(fields);
    if (keys.length) {
      db.prepare(`UPDATE users SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`)
        .run(...keys.map((k) => fields[k]), req.user.id);
    }
    res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
  });

  r.delete('/me', (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  r.post('/links', (req, res) => {
    const { title, url } = v.link(req.body);
    const { n, maxPos } = db.prepare('SELECT COUNT(*) AS n, COALESCE(MAX(position), -1) AS maxPos FROM links WHERE user_id = ?').get(req.user.id);
    if (n >= MAX_LINKS) return res.status(400).json({ error: `You can have at most ${MAX_LINKS} links.` });
    const { lastInsertRowid } = db.prepare('INSERT INTO links (user_id, title, url, position) VALUES (?, ?, ?, ?)')
      .run(req.user.id, title, url, maxPos + 1);
    res.status(201).json({ link: db.prepare('SELECT * FROM links WHERE id = ?').get(lastInsertRowid) });
  });

  // Reorder: body is { ids: [...] } listing every link id in the new order.
  r.put('/links/order', (req, res) => {
    const ids = req.body.ids;
    const owned = db.prepare('SELECT id FROM links WHERE user_id = ?').all(req.user.id).map((l) => l.id);
    if (!Array.isArray(ids) || ids.length !== owned.length || !owned.every((id) => ids.includes(id))) {
      return res.status(400).json({ error: 'Order must list each of your links exactly once.' });
    }
    const set = db.prepare('UPDATE links SET position = ? WHERE id = ? AND user_id = ?');
    db.exec('BEGIN');
    try {
      ids.forEach((id, i) => set.run(i, id, req.user.id));
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    res.json({ ok: true });
  });

  const ownLink = (req, res) => {
    const link = db.prepare('SELECT * FROM links WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.user.id);
    if (!link) res.status(404).json({ error: 'Link not found.' });
    return link;
  };

  r.patch('/links/:id', (req, res) => {
    const link = ownLink(req, res);
    if (!link) return;
    const fields = v.link(req.body, { partial: true });
    const keys = Object.keys(fields);
    if (keys.length) {
      db.prepare(`UPDATE links SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`)
        .run(...keys.map((k) => fields[k]), link.id);
    }
    res.json({ link: db.prepare('SELECT * FROM links WHERE id = ?').get(link.id) });
  });

  r.delete('/links/:id', (req, res) => {
    const link = ownLink(req, res);
    if (!link) return;
    db.prepare('DELETE FROM links WHERE id = ?').run(link.id);
    res.json({ ok: true });
  });

  r.use((req, res) => res.status(404).json({ error: 'Not found.' }));

  // eslint-disable-next-line no-unused-vars
  r.use((err, req, res, next) => {
    if (err instanceof v.ValidationError) return res.status(400).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  });

  return r;
}
