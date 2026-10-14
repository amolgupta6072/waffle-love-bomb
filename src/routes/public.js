import express, { Router } from 'express';
import * as v from '../validate.js';
import { CURATIONS, requestRef } from '../catalog.js';
import * as views from '../views/public.js';

const WATCH_SELECT = `SELECT w.*, b.name AS brand_name, b.slug AS brand_slug, b.country AS brand_country
  FROM watches w JOIN brands b ON b.id = w.brand_id WHERE w.published = 1 AND b.published = 1`;

// Simple per-IP limiter for public form submissions.
function rateLimit({ windowMs = 10 * 60 * 1000, max = 12 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const list = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) return res.status(429).send(views.notFoundPage().toString().replace('This page has moved on', 'Too many requests, please try again shortly'));
    list.push(now);
    hits.set(req.ip, list);
    if (hits.size > 5000) hits.clear();
    next();
  };
}

export function publicRouter(db, { formLimit = 12 } = {}) {
  const r = Router();
  const form = express.urlencoded({ extended: false, limit: '20kb' });
  const limiter = rateLimit({ max: formLimit });

  const q = {
    watches: (where = '', ...args) => db.prepare(`${WATCH_SELECT} ${where} ORDER BY b.position, w.position, w.id`).all(...args),
    watch: (slug) => db.prepare(`${WATCH_SELECT} AND w.slug = ?`).get(slug),
    brands: () => db.prepare('SELECT * FROM brands WHERE published = 1 ORDER BY position, name').all(),
    brand: (slug) => db.prepare('SELECT * FROM brands WHERE slug = ? AND published = 1').get(slug),
    locations: () => db.prepare('SELECT * FROM locations WHERE published = 1 ORDER BY position, id').all(),
    location: (slug) => db.prepare('SELECT * FROM locations WHERE slug = ? AND published = 1').get(slug),
    event: (slug) => db.prepare(`SELECT e.*, l.name AS location_name FROM events e LEFT JOIN locations l ON l.id = e.location_id
      WHERE e.slug = ? AND e.published = 1`).get(slug),
  };
  const insertRequest = db.prepare(`INSERT INTO requests
    (type, name, email, phone, city, company, message, preferred_date, guests, watch_id, event_id, location_id)
    VALUES (:type, :name, :email, :phone, :city, :company, :message, :preferred_date, :guests, :watch_id, :event_id, :location_id)`);

  function saveRequest(fields) {
    const row = {
      type: fields.type, name: '', email: '', phone: '', city: '', company: '', message: '', preferred_date: '',
      guests: null, watch_id: null, event_id: null, location_id: null, ...fields,
    };
    return requestRef(Number(insertRequest.run(row).lastInsertRowid));
  }

  const contact = (body, { phoneRequired = false } = {}) => ({
    name: v.text(body.name, 'Full name', { max: 100, required: true }),
    email: v.email(body.email),
    phone: v.phone(body.phone, { required: phoneRequired }),
    city: v.text(body.city, 'City', { max: 80 }),
  });

  // Bots fill the hidden "website" field; quietly pretend success.
  const isBot = (req) => Boolean(req.body?.website);
  const thanks = (res, type, ref) => res.redirect(303, `/thank-you?type=${type}${ref ? `&ref=${ref}` : ''}`);
  const send = (res, page, status = 200) => res.status(status).type('html').send(page.toString());

  // ---------- Pages ----------

  r.get('/', (req, res) => {
    const all = q.watches();
    const featured = all.filter((w) => w.featured).slice(0, 8);
    const counts = Object.fromEntries(CURATIONS.map((c) => [c.slug, 0]));
    all.forEach((w) => { if (w.curation in counts) counts[w.curation]++; });
    const nextEvent = db.prepare(`SELECT * FROM events WHERE published = 1 AND starts_at >= ? ORDER BY starts_at LIMIT 1`)
      .get(new Date().toISOString());
    send(res, views.homePage({
      featured: featured.length ? featured : all.slice(0, 8),
      brands: q.brands(),
      curations: CURATIONS.map((c) => ({ ...c, count: counts[c.slug] })).filter((c) => c.count > 0),
      nextEvent,
      location: q.locations()[0],
    }));
  });

  r.get('/discover', (req, res) => {
    const str = (x) => (typeof x === 'string' ? x : '');
    const filters = { curation: str(req.query.curation), brand: str(req.query.brand), country: str(req.query.country), availability: str(req.query.availability) };
    const all = q.watches();
    const watches = all.filter((w) => (!filters.curation || w.curation === filters.curation)
      && (!filters.brand || w.brand_slug === filters.brand)
      && (!filters.country || w.brand_country === filters.country)
      && (!filters.availability || w.availability === filters.availability));
    const used = new Set(all.map((w) => w.curation));
    const brands = q.brands();
    send(res, views.discoverPage({
      watches,
      brands,
      curations: CURATIONS.filter((c) => used.has(c.slug)),
      countries: [...new Set(brands.map((b) => b.country).filter(Boolean))].sort(),
      filters,
    }));
  });

  r.get('/curations/:slug', (req, res) => res.redirect(301, `/discover?curation=${encodeURIComponent(req.params.slug)}`));

  r.get('/watches/:slug', (req, res, next) => {
    const watch = q.watch(req.params.slug);
    if (!watch) return next();
    const brand = q.brand(watch.brand_slug);
    const related = q.watches('AND w.brand_id = ? AND w.id != ?', watch.brand_id, watch.id).slice(0, 4);
    send(res, views.watchPage({ watch, brand, related }));
  });

  r.get('/maisons', (req, res) => {
    const brands = q.brands().map((b) => {
      const watches = q.watches('AND w.brand_id = ?', b.id);
      return { ...b, watch_count: watches.length, lead: watches.find((w) => w.featured) || watches[0] };
    });
    send(res, views.brandsPage({ brands }));
  });

  r.get('/maisons/:slug', (req, res, next) => {
    const brand = q.brand(req.params.slug);
    if (!brand) return next();
    send(res, views.brandPage({ brand, watches: q.watches('AND w.brand_id = ?', brand.id) }));
  });

  r.get('/gallery', (req, res) => send(res, views.galleryPage({ locations: q.locations() })));
  r.get('/about', (req, res) => send(res, views.aboutPage()));

  r.get('/events', (req, res) => {
    const now = new Date().toISOString();
    const base = `SELECT e.*, l.name AS location_name FROM events e LEFT JOIN locations l ON l.id = e.location_id WHERE e.published = 1`;
    send(res, views.eventsPage({
      upcoming: db.prepare(`${base} AND e.starts_at >= ? ORDER BY e.starts_at`).all(now),
      past: db.prepare(`${base} AND e.starts_at < ? ORDER BY e.starts_at DESC LIMIT 6`).all(now),
    }));
  });

  const spotsLeft = (event) => {
    if (!event.capacity) return null;
    const { taken } = db.prepare(`SELECT COALESCE(SUM(COALESCE(guests, 1)), 0) AS taken FROM requests
      WHERE type = 'event' AND event_id = ? AND status != 'closed'`).get(event.id);
    return event.capacity - taken;
  };

  r.get('/events/:slug', (req, res, next) => {
    const event = q.event(req.params.slug);
    if (!event) return next();
    send(res, views.eventPage({ event, spotsLeft: spotsLeft(event) }));
  });

  r.post('/events/:slug/rsvp', limiter, form, (req, res, next) => {
    const event = q.event(req.params.slug);
    if (!event) return next();
    if (isBot(req)) return thanks(res, 'event');
    try {
      if (new Date(event.starts_at) < new Date()) throw new v.ValidationError('This event has already taken place.');
      const guests = v.int(req.body.guests, 'Guests', { min: 1, max: 2 }) || 1;
      const left = spotsLeft(event);
      if (left !== null && guests > left) throw new v.ValidationError(left > 0 ? `Only ${left} place(s) remain.` : 'This event is fully booked.');
      const ref = saveRequest({ type: 'event', ...contact(req.body), guests, event_id: event.id, message: v.text(req.body.message, 'Message', { max: 1000 }) });
      thanks(res, 'event', ref);
    } catch (err) {
      if (!(err instanceof v.ValidationError)) throw err;
      send(res, views.eventPage({ event, values: req.body, error: err.message, spotsLeft: spotsLeft(event) }), 400);
    }
  });

  // ---------- Enquiries & orders ----------

  r.get('/enquire', (req, res) => {
    const watch = typeof req.query.watch === 'string' ? q.watch(req.query.watch) : null;
    let type = req.query.type === 'order' ? 'order' : 'enquiry';
    if (type === 'order' && !(watch && watch.availability === 'available' && watch.price_inr)) type = 'enquiry';
    send(res, views.enquirePage({ type, watch }));
  });

  r.post('/enquire', limiter, form, (req, res) => {
    const watch = typeof req.body.watch === 'string' && req.body.watch ? q.watch(req.body.watch) : null;
    const type = req.body.type === 'order' && watch?.availability === 'available' && watch.price_inr ? 'order' : 'enquiry';
    if (isBot(req)) return thanks(res, type);
    try {
      const message = v.text(req.body.message, 'Message', { max: 3000, required: type === 'enquiry' });
      const ref = saveRequest({ type, ...contact(req.body, { phoneRequired: type === 'order' }), message, watch_id: watch?.id ?? null });
      thanks(res, type, ref);
    } catch (err) {
      if (!(err instanceof v.ValidationError)) throw err;
      send(res, views.enquirePage({ type, watch, values: req.body, error: err.message }), 400);
    }
  });

  // ---------- Appointments ----------

  const appointmentContext = (src) => ({
    locations: q.locations(),
    watch: typeof src.watch === 'string' && src.watch ? q.watch(src.watch) : null,
    brand: typeof src.brand === 'string' && src.brand ? q.brand(src.brand) : null,
  });

  r.get('/appointment', (req, res) => {
    const ctx = appointmentContext(req.query);
    send(res, views.appointmentPage({ ...ctx, values: { location: typeof req.query.location === 'string' ? req.query.location : '' } }));
  });

  r.post('/appointment', limiter, form, (req, res) => {
    const ctx = appointmentContext(req.body);
    if (isBot(req)) return thanks(res, 'appointment');
    try {
      const locationSlug = v.oneOf(req.body.location, 'Location', [...ctx.locations.map((l) => l.slug), 'virtual']);
      const location = locationSlug === 'virtual' ? null : q.location(locationSlug);
      const slot = v.oneOf(req.body.slot || 'Morning', 'Time', ['Morning', 'Afternoon', 'Evening']);
      const notes = v.text(req.body.message, 'Message', { max: 2000 });
      const message = [
        locationSlug === 'virtual' ? 'Video consultation' : '',
        `Preferred time: ${slot}`,
        ctx.brand && !ctx.watch ? `Interested in: ${ctx.brand.name}` : '',
        notes,
      ].filter(Boolean).join('\n');
      const ref = saveRequest({
        type: 'appointment', ...contact(req.body, { phoneRequired: true }),
        preferred_date: v.date(req.body.preferred_date, 'Preferred date', { required: true, future: true }),
        message, watch_id: ctx.watch?.id ?? null, location_id: location?.id ?? null,
      });
      thanks(res, 'appointment', ref);
    } catch (err) {
      if (!(err instanceof v.ValidationError)) throw err;
      send(res, views.appointmentPage({ ...ctx, values: req.body, error: err.message }), 400);
    }
  });

  // ---------- Brand partnerships & newsletter ----------

  r.get('/partner', (req, res) => send(res, views.partnerPage()));

  r.post('/partner', limiter, form, (req, res) => {
    if (isBot(req)) return thanks(res, 'partner');
    try {
      const ref = saveRequest({
        type: 'partner', ...contact(req.body),
        company: v.text(req.body.company, 'Brand name', { max: 120, required: true }),
        message: v.text(req.body.message, 'About your brand', { max: 3000, required: true }),
      });
      thanks(res, 'partner', ref);
    } catch (err) {
      if (!(err instanceof v.ValidationError)) throw err;
      send(res, views.partnerPage({ values: req.body, error: err.message }), 400);
    }
  });

  r.post('/newsletter', limiter, form, (req, res) => {
    if (isBot(req)) return thanks(res, 'newsletter');
    let email;
    try { email = v.email(req.body.email); } catch { return res.redirect(303, '/#main'); }
    const exists = db.prepare(`SELECT 1 FROM requests WHERE type = 'newsletter' AND email = ? COLLATE NOCASE`).get(email);
    if (!exists) saveRequest({ type: 'newsletter', email });
    thanks(res, 'newsletter');
  });

  // ---------- Bag & checkout ----------
  // The bag lives in the browser (localStorage); the server re-checks every
  // item and recomputes the total when the order is placed.

  r.get('/bag', (req, res) => send(res, views.bagPage()));
  r.get('/checkout', (req, res) => send(res, views.checkoutPage()));

  r.post('/checkout', limiter, form, (req, res) => {
    if (isBot(req)) return res.redirect(303, '/order-confirmed');
    try {
      const slugs = String(req.body.items || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10);
      if (!slugs.length) throw new v.ValidationError('Your bag is empty.');
      const items = slugs.map((slug) => {
        const w = q.watch(slug);
        if (!w || w.availability !== 'available' || !w.price_inr) throw new v.ValidationError(`${w ? `${w.brand_name} ${w.name}` : 'One of the pieces in your bag'} is no longer available to order online. Please remove it or contact us.`);
        return w;
      });
      const total = items.reduce((sum, w) => sum + w.price_inr, 0);
      const who = contact(req.body, { phoneRequired: true });
      const address = [
        v.text(req.body.address1, 'Address', { max: 200, required: true }),
        v.text(req.body.address2, 'Address line 2', { max: 200 }),
        `${who.city} ${v.text(req.body.state, 'State', { max: 60, required: true })} ${v.text(req.body.pincode, 'PIN code', { max: 6, required: true })}`.trim(),
      ].filter(Boolean).join(', ');
      if (!/^\d{6}$/.test(req.body.pincode)) throw new v.ValidationError('Please enter a valid 6-digit PIN code.');
      const pan = v.text(req.body.pan, 'PAN', { max: 10 }).toUpperCase();
      if (total > 200000 && !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) throw new v.ValidationError('A valid PAN is required for purchases above ₹2,00,000.');
      const payment = v.oneOf(req.body.payment, 'Payment method', ['card', 'upi', 'netbanking', 'emi']);
      const message = [
        ...items.map((w) => `${w.brand_name} ${w.name}: ₹${w.price_inr.toLocaleString('en-IN')}`),
        `Total: ₹${total.toLocaleString('en-IN')}`,
        `Payment method: ${payment} (payment gateway not yet connected)`,
        `Deliver to: ${address}`,
        pan ? `PAN: ${pan}` : '',
        v.text(req.body.notes, 'Notes', { max: 1000 }),
      ].filter(Boolean).join('\n');
      const ref = saveRequest({ type: 'order', ...who, message, watch_id: items[0].id });
      res.redirect(303, `/order-confirmed?ref=${ref}`);
    } catch (err) {
      if (!(err instanceof v.ValidationError)) throw err;
      send(res, views.checkoutPage({ values: req.body, error: err.message }), 400);
    }
  });

  r.get('/order-confirmed', (req, res) => {
    const ref = /^LQ-\d{6,}$/.test(req.query.ref || '') ? req.query.ref : '';
    send(res, views.orderConfirmedPage({ ref }));
  });

  r.get('/thank-you', (req, res) => {
    const ref = /^LQ-\d{6,}$/.test(req.query.ref || '') ? req.query.ref : '';
    send(res, views.thanksPage({ type: String(req.query.type || ''), ref }));
  });

  return r;
}
