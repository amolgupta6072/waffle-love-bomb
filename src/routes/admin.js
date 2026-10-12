import express, { Router } from 'express';
import { RESOURCES, parseForm } from '../resources.js';
import { REQUEST_STATUSES, REQUEST_TYPES, requestRef } from '../catalog.js';
import { ValidationError } from '../validate.js';
import { verifyPassword, createSession, destroySession, cookieOptions, SESSION_COOKIE } from '../auth.js';
import { transaction } from '../db.js';
import * as views from '../views/admin.js';

const REQUEST_SELECT = `SELECT r.*, w.slug AS watch_slug, w.price_inr AS watch_price,
    CASE WHEN w.id IS NULL THEN NULL ELSE b.name || ' ' || w.name END AS watch_label,
    e.title AS event_title, l.name AS location_name
  FROM requests r
  LEFT JOIN watches w ON w.id = r.watch_id
  LEFT JOIN brands b ON b.id = w.brand_id
  LEFT JOIN events e ON e.id = r.event_id
  LEFT JOIN locations l ON l.id = r.location_id`;

export function adminRouter(db, { secureCookies }) {
  const r = Router();
  r.use(express.urlencoded({ extended: false, limit: '100kb' }));
  r.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

  const send = (res, page, status = 200) => res.status(status).type('html').send(page.toString());
  const flash = (req) => {
    const m = { saved: 'Saved.', created: 'Created.', deleted: 'Deleted.' }[req.query.done];
    return m || '';
  };

  // ---------- Auth ----------
  const failures = new Map();
  r.get('/login', (req, res) => (req.admin ? res.redirect('/admin') : send(res, views.loginPage())));
  r.post('/login', (req, res) => {
    const key = req.ip;
    const recent = (failures.get(key) || []).filter((t) => Date.now() - t < 15 * 60 * 1000);
    if (recent.length >= 8) return send(res, views.loginPage({ error: 'Too many attempts. Try again in a few minutes.' }), 429);
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      failures.set(key, [...recent, Date.now()]);
      return send(res, views.loginPage({ error: 'Incorrect email or password.', email }), 401);
    }
    failures.delete(key);
    res.cookie(SESSION_COOKIE, createSession(db, admin.id), cookieOptions(secureCookies));
    res.redirect(303, '/admin');
  });

  r.use((req, res, next) => {
    if (!req.admin) return res.redirect('/admin/login');
    if (req.method === 'POST' && req.body?._csrf !== req.admin.csrf) return res.status(403).send('Invalid form token. Go back, refresh the page and try again.');
    next();
  });

  r.post('/logout', (req, res) => {
    destroySession(db, req.cookies[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.redirect(303, '/admin/login');
  });

  // ---------- Inbox ----------
  r.get('/', (req, res) => {
    const type = REQUEST_TYPES[req.query.type] ? req.query.type : '';
    const status = ['new', 'in_progress', 'closed', 'all'].includes(req.query.status) ? req.query.status : 'open';
    const where = [];
    const args = [];
    if (type) { where.push('r.type = ?'); args.push(type); }
    if (status === 'open') where.push(`r.status != 'closed'`);
    else if (status !== 'all') { where.push('r.status = ?'); args.push(status); }
    const requests = db.prepare(`${REQUEST_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY r.id DESC LIMIT 300`).all(...args);
    const counts = {};
    for (const row of db.prepare(`SELECT type, COUNT(*) AS total, SUM(status != 'closed') AS open FROM requests GROUP BY type`).all()) counts[row.type] = row;
    send(res, views.inboxPage({ admin: req.admin, requests, counts, filters: { type, status }, flash: flash(req) }));
  });

  r.get('/requests.csv', (req, res) => {
    const type = REQUEST_TYPES[req.query.type] ? req.query.type : '';
    const rows = db.prepare(`${REQUEST_SELECT} ${type ? 'WHERE r.type = ?' : ''} ORDER BY r.id`).all(...(type ? [type] : []));
    const cols = ['ref', 'type', 'status', 'name', 'email', 'phone', 'city', 'company', 'watch_label', 'event_title', 'location_name', 'preferred_date', 'guests', 'message', 'note', 'created_at'];
    // Prefix cells that spreadsheet apps would treat as formulas.
    const esc = (val) => {
      let s = val === null || val === undefined ? '' : String(val);
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const body = [cols.join(','), ...rows.map((row) => cols.map((c) => esc(c === 'ref' ? requestRef(row.id) : row[c])).join(','))].join('\n');
    res.type('text/csv').attachment(`lynq-${type || 'requests'}-${new Date().toISOString().slice(0, 10)}.csv`).send(body);
  });

  const findRequest = (id) => db.prepare(`${REQUEST_SELECT} WHERE r.id = ?`).get(Number(id) || 0);

  r.get('/requests/:id', (req, res, next) => {
    const request = findRequest(req.params.id);
    if (!request) return next();
    send(res, views.requestPage({ admin: req.admin, request, flash: flash(req) }));
  });

  r.post('/requests/:id', (req, res, next) => {
    const request = findRequest(req.params.id);
    if (!request) return next();
    const status = REQUEST_STATUSES[req.body.status] ? req.body.status : request.status;
    const note = typeof req.body.note === 'string' ? req.body.note.slice(0, 5000) : request.note;
    db.prepare('UPDATE requests SET status = ?, note = ? WHERE id = ?').run(status, note, request.id);
    res.redirect(303, `/admin/requests/${request.id}?done=saved`);
  });

  r.post('/requests/:id/delete', (req, res) => {
    db.prepare('DELETE FROM requests WHERE id = ?').run(Number(req.params.id) || 0);
    res.redirect(303, '/admin?done=deleted');
  });

  // ---------- Content (generic CRUD) ----------
  for (const [key, resource] of Object.entries(RESOURCES)) {
    const base = `/${key}`;
    const find = (id) => db.prepare(`SELECT * FROM ${resource.table} WHERE id = ?`).get(Number(id) || 0);
    const slugTaken = (slug, id = 0) => db.prepare(`SELECT 1 FROM ${resource.table} WHERE slug = ? AND id != ?`).get(slug, id);

    r.get(base, (req, res) => {
      const rows = db.prepare(resource.listQuery || `SELECT * FROM ${resource.table} ORDER BY ${resource.order}`).all();
      send(res, views.listPage({ admin: req.admin, key, resource, rows, flash: flash(req) }));
    });

    r.get(`${base}/new`, (req, res) => send(res, views.editPage({ admin: req.admin, key, resource, row: null, db })));

    const save = (req, res, row) => {
      try {
        const data = parseForm(resource, req.body, db);
        if (slugTaken(data.slug, row?.id)) throw new ValidationError(`The slug “${data.slug}” is already in use.`);
        const cols = Object.keys(data);
        let id = row?.id;
        transaction(db, () => {
          if (row) {
            db.prepare(`UPDATE ${resource.table} SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`).run(...cols.map((c) => data[c]), row.id);
          } else {
            id = Number(db.prepare(`INSERT INTO ${resource.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`)
              .run(...cols.map((c) => data[c])).lastInsertRowid);
          }
        });
        res.redirect(303, `/admin${base}/${id}?done=${row ? 'saved' : 'created'}`);
      } catch (err) {
        if (!(err instanceof ValidationError)) throw err;
        send(res, views.editPage({ admin: req.admin, key, resource, row, values: req.body, error: err.message, db }), 400);
      }
    };

    r.post(`${base}/new`, (req, res) => save(req, res, null));

    r.get(`${base}/:id`, (req, res, next) => {
      const row = find(req.params.id);
      if (!row) return next();
      send(res, views.editPage({ admin: req.admin, key, resource, row, db, flash: flash(req) }));
    });

    r.post(`${base}/:id`, (req, res, next) => {
      const row = find(req.params.id);
      if (!row) return next();
      save(req, res, row);
    });

    r.post(`${base}/:id/delete`, (req, res) => {
      db.prepare(`DELETE FROM ${resource.table} WHERE id = ?`).run(Number(req.params.id) || 0);
      res.redirect(303, `/admin${base}?done=deleted`);
    });
  }

  r.use((req, res) => res.status(404).send('Not found'));
  return r;
}
