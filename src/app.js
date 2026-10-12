import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadUser } from './auth.js';
import { apiRouter } from './api.js';
import { renderProfile, renderNotFound } from './profile-page.js';

const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url));
const page = (name) => join(PUBLIC_DIR, `${name}.html`);

export function createApp(db, { secureCookies = false } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');

  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN',
    });
    next();
  });
  app.use(cookieParser());
  app.use(loadUser(db));

  app.use('/api', apiRouter(db, { secureCookies }));

  // App pages. Logged-in users skip the auth pages; logged-out users can't see the dashboard.
  app.get('/', (req, res) => res.sendFile(page('index')));
  app.get(['/login', '/signup'], (req, res) => {
    if (req.user) return res.redirect('/dashboard');
    res.sendFile(page(req.path.slice(1)));
  });
  app.get('/dashboard', (req, res) => {
    if (!req.user) return res.redirect('/login');
    res.sendFile(page('dashboard'));
  });

  app.use(express.static(PUBLIC_DIR, { index: false, extensions: false }));

  // Click tracking: count, then redirect to the stored (validated) URL.
  const findLink = db.prepare(`
    SELECT l.id, l.url FROM links l JOIN users u ON u.id = l.user_id
    WHERE l.id = ? AND l.enabled = 1
  `);
  const countClick = db.prepare('UPDATE links SET clicks = clicks + 1 WHERE id = ?');
  app.get('/go/:id', (req, res) => {
    const link = findLink.get(Number(req.params.id) || 0);
    if (!link) return res.status(404).send(renderNotFound());
    countClick.run(link.id);
    res.redirect(302, link.url);
  });

  // Public profile pages: lynq.example/username
  const findUser = db.prepare('SELECT * FROM users WHERE username = ?');
  const enabledLinks = db.prepare('SELECT id, title FROM links WHERE user_id = ? AND enabled = 1 ORDER BY position, id');
  const countView = db.prepare('UPDATE users SET page_views = page_views + 1 WHERE id = ?');
  app.get('/:username', (req, res) => {
    const username = req.params.username.replace(/^@/, '');
    const user = findUser.get(username);
    if (!user) return res.status(404).send(renderNotFound(/^[a-z0-9_.-]{3,30}$/i.test(username) ? username : ''));
    if (req.user?.id !== user.id) countView.run(user.id);
    res.set('Cache-Control', 'no-store').send(renderProfile(user, enabledLinks.all(user.id)));
  });

  app.use((req, res) => res.status(404).send(renderNotFound()));

  return app;
}
