import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.js';
import { createApp } from '../src/app.js';
import { seedIfEmpty } from '../src/seed.js';
import { upsertAdmin } from '../src/auth.js';

let server;
let base;
let db;

before(async () => {
  db = openDatabase(':memory:');
  seedIfEmpty(db);
  upsertAdmin(db, { email: 'team@lynq.test', password: 'correct horse battery' });
  await new Promise((resolve) => { server = createApp(db, { formLimit: 1000 }).listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

// Cookie-keeping client that posts urlencoded forms like a browser.
function client() {
  let cookie = '';
  return async (method, path, form) => {
    const res = await fetch(base + path, {
      method,
      redirect: 'manual',
      headers: {
        ...(cookie && { Cookie: cookie }),
        ...(form && { 'Content-Type': 'application/x-www-form-urlencoded' }),
      },
      body: form ? new URLSearchParams(form).toString() : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return { status: res.status, text: await res.text(), location: res.headers.get('location'), headers: res.headers };
  };
}

const lastRequest = () => db.prepare('SELECT * FROM requests ORDER BY id DESC LIMIT 1').get();
const future = (days) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);

test('public pages render with seeded catalogue', async () => {
  const get = client();
  for (const path of ['/', '/discover', '/maisons', '/maisons/formex', '/watches/fears-brunswick-38-white', '/gallery', '/events', '/about', '/partner', '/appointment', '/enquire']) {
    const res = await get('GET', path);
    assert.equal(res.status, 200, path);
  }
  const home = await get('GET', '/');
  assert.match(home.text, /A dedicated platform for independent watchmaking/);
  assert.match(home.text, /Arsène Lippens/);
  const missing = await get('GET', '/watches/does-not-exist');
  assert.equal(missing.status, 404);
});

test('no commercial terms leak onto the public site', async () => {
  const get = client();
  for (const path of ['/', '/discover', '/maisons', '/maisons/dennison', '/partner', '/about']) {
    const { text } = await get('GET', path);
    assert.doesNotMatch(text, /margin|discount|ex-factory|business plan/i, path);
  }
});

test('discover filters by curation, maison and origin', async () => {
  const get = client();
  let res = await get('GET', '/discover?curation=the-artisans');
  assert.match(res.text, /Son Mài/);
  assert.doesNotMatch(res.text, /href="\/watches\/formex-reef-39-5"/);
  res = await get('GET', '/discover?brand=amida');
  assert.match(res.text, /3 watches/);
  res = await get('GET', '/discover?country=United%20Kingdom');
  assert.match(res.text, /Brunswick/);
  assert.doesNotMatch(res.text, /href="\/watches\/hegid-vision"/);
});

test('enquiry is stored and shows a reference', async () => {
  const post = client();
  const res = await post('POST', '/enquire', { watch: 'awake-son-mai-silver-leaf-ultra-violet', name: 'Riya <b>Shah</b>', email: 'riya@example.com', message: 'Is the Silver Leaf available in Delhi?' });
  assert.equal(res.status, 303);
  assert.match(res.location, /\/thank-you\?type=enquiry&ref=LQ-\d{6}/);
  const r = lastRequest();
  assert.equal(r.type, 'enquiry');
  assert.equal(r.email, 'riya@example.com');
  assert.ok(r.watch_id);

  const bad = await post('POST', '/enquire', { name: 'X', email: 'not-an-email', message: 'hi' });
  assert.equal(bad.status, 400);
  assert.match(bad.text, /valid email/);
});

test('orders are only possible for available, priced pieces', async () => {
  const post = client();
  // Seeded watches are "on request": an order attempt is downgraded to an enquiry.
  let page = await post('GET', '/enquire?type=order&watch=formex-essence-thirtynine-blue');
  assert.doesNotMatch(page.text, /Submit order request/);

  db.prepare(`UPDATE watches SET availability = 'available', price_inr = 450000 WHERE slug = 'formex-essence-thirtynine-blue'`).run();
  page = await post('GET', '/watches/formex-essence-thirtynine-blue');
  assert.match(page.text, /Order this piece/);
  assert.match(page.text, /₹4,50,000/);

  const noPhone = await post('POST', '/enquire', { type: 'order', watch: 'formex-essence-thirtynine-blue', name: 'Arjun', email: 'arjun@example.com' });
  assert.equal(noPhone.status, 400);
  const ok = await post('POST', '/enquire', { type: 'order', watch: 'formex-essence-thirtynine-blue', name: 'Arjun', email: 'arjun@example.com', phone: '+91 98765 43210' });
  assert.equal(ok.status, 303);
  assert.equal(lastRequest().type, 'order');
});

test('appointments validate date and location', async () => {
  const post = client();
  let res = await post('POST', '/appointment', { location: 'delhi-ncr', preferred_date: '2020-01-01', slot: 'Evening', name: 'Kabir', email: 'k@example.com', phone: '9876543210' });
  assert.equal(res.status, 400);
  assert.match(res.text, /cannot be in the past/);
  res = await post('POST', '/appointment', { location: 'mars', preferred_date: future(5), name: 'Kabir', email: 'k@example.com', phone: '9876543210' });
  assert.equal(res.status, 400);
  res = await post('POST', '/appointment', { location: 'virtual', brand: 'beaubleu', preferred_date: future(5), slot: 'Evening', name: 'Kabir', email: 'k@example.com', phone: '9876543210' });
  assert.equal(res.status, 303);
  const r = lastRequest();
  assert.equal(r.type, 'appointment');
  assert.equal(r.location_id, null);
  assert.match(r.message, /Video consultation/);
  assert.match(r.message, /Interested in: Beaubleu/);
});

test('event RSVPs respect capacity', async () => {
  const startsAt = new Date(Date.now() + 10 * 864e5).toISOString();
  db.prepare(`INSERT INTO events (slug, title, starts_at, summary, capacity) VALUES ('collector-evening', 'Collector Evening', ?, 'An evening with the founders', 3)`).run(startsAt);
  const post = client();
  const home = await post('GET', '/');
  assert.match(home.text, /Collector Evening/);
  let res = await post('POST', '/events/collector-evening/rsvp', { name: 'A', email: 'a@example.com', guests: '2' });
  assert.equal(res.status, 303);
  res = await post('POST', '/events/collector-evening/rsvp', { name: 'B', email: 'b@example.com', guests: '2' });
  assert.equal(res.status, 400);
  assert.match(res.text, /Only 1 place/);
  res = await post('POST', '/events/collector-evening/rsvp', { name: 'B', email: 'b@example.com', guests: '1' });
  assert.equal(res.status, 303);
  res = await post('GET', '/events/collector-evening');
  assert.match(res.text, /fully booked/);
});

test('partner applications, newsletter de-duplication and honeypot', async () => {
  const post = client();
  let res = await post('POST', '/partner', { company: 'Atelier Nouveau', name: 'Léa', email: 'lea@nouveau.example', message: 'Founder-led, 400 pieces a year.' });
  assert.equal(res.status, 303);
  assert.equal(lastRequest().company, 'Atelier Nouveau');

  const count = () => db.prepare(`SELECT COUNT(*) AS n FROM requests WHERE type = 'newsletter'`).get().n;
  const before = count();
  await post('POST', '/newsletter', { email: 'circle@example.com' });
  await post('POST', '/newsletter', { email: 'CIRCLE@example.com' });
  assert.equal(count(), before + 1);

  const total = db.prepare('SELECT COUNT(*) AS n FROM requests').get().n;
  res = await post('POST', '/enquire', { name: 'Bot', email: 'bot@example.com', message: 'spam', website: 'http://spam.example' });
  assert.equal(res.status, 303);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM requests').get().n, total);
});

test('admin requires sign-in and a CSRF token', async () => {
  const anon = client();
  let res = await anon('GET', '/admin');
  assert.equal(res.status, 302);
  assert.equal(res.location, '/admin/login');
  res = await anon('POST', '/admin/brands/new', { name: 'Evil' });
  assert.equal(res.status, 302);

  const admin = client();
  res = await admin('POST', '/admin/login', { email: 'team@lynq.test', password: 'wrong' });
  assert.equal(res.status, 401);
  res = await admin('POST', '/admin/login', { email: 'team@lynq.test', password: 'correct horse battery' });
  assert.equal(res.status, 303);
  res = await admin('GET', '/admin');
  assert.equal(res.status, 200);
  assert.match(res.text, /Inbox/);
  res = await admin('POST', '/admin/brands/new', { name: 'No Token' });
  assert.equal(res.status, 403);
});

test('admin manages content and requests end to end', async () => {
  const admin = client();
  await admin('POST', '/admin/login', { email: 'team@lynq.test', password: 'correct horse battery' });
  const page = await admin('GET', '/admin/watches/new');
  const csrf = /name="_csrf" value="([a-f0-9]+)"/.exec(page.text)[1];
  const brandId = db.prepare(`SELECT id FROM brands WHERE slug = 'hegid'`).get().id;

  let res = await admin('POST', '/admin/watches/new', {
    _csrf: csrf, brand_id: String(brandId), name: 'Vision <script>alert(1)</script>', slug: '', curation: 'the-collectors',
    description: 'Limited test piece.', price_inr: '3,25,000', availability: 'available', published: '1',
    art_shape: 'round', art_style: 'chrono', art_case: 'steel', art_dial: '#112233', art_strap: '#445566', image_url: 'javascript:alert(1)',
  });
  assert.equal(res.status, 400, 'javascript: image URL is rejected');

  res = await admin('POST', '/admin/watches/new', {
    _csrf: csrf, brand_id: String(brandId), name: 'Vision <script>alert(1)</script>', slug: '', curation: 'the-collectors',
    description: 'Limited test piece.', price_inr: '3,25,000', availability: 'available', published: '1',
    art_shape: 'round', art_style: 'chrono', art_case: 'steel', art_dial: '#112233', art_strap: '#445566', image_url: '',
  });
  assert.equal(res.status, 303);
  const watch = db.prepare(`SELECT * FROM watches WHERE curation = 'the-collectors' AND brand_id = (SELECT id FROM brands WHERE slug = 'hegid') AND name LIKE 'Vision <%'`).get();
  assert.equal(watch.slug, 'hegid-vision-script-alert-1-script');
  assert.equal(watch.price_inr, 325000);

  const pub = client();
  res = await pub('GET', `/watches/${watch.slug}`);
  assert.equal(res.status, 200);
  assert.doesNotMatch(res.text, /<script>alert/);
  assert.match(res.text, /&lt;script&gt;/);
  res = await pub('GET', '/discover?curation=the-collectors');
  assert.match(res.text, /2 watches/);

  // Unpublishing hides the piece.
  res = await admin('POST', `/admin/watches/${watch.id}`, {
    _csrf: csrf, brand_id: String(brandId), name: watch.name, slug: watch.slug, curation: 'the-collectors', availability: 'available',
    art_shape: 'round', art_style: 'chrono', art_case: 'steel', art_dial: '#112233', art_strap: '#445566',
  });
  assert.equal(res.status, 303);
  res = await pub('GET', `/watches/${watch.slug}`);
  assert.equal(res.status, 404);

  // Duplicate slugs are refused.
  res = await admin('POST', '/admin/brands/new', { _csrf: csrf, name: 'Formex', slug: 'formex' });
  assert.equal(res.status, 400);
  assert.match(res.text, /already in use/);

  // Work an inbox item and export it.
  await pub('POST', '/enquire', { name: '=HYPERLINK("x")', email: 'csv@example.com', message: 'CSV check' });
  const req = lastRequest();
  res = await admin('POST', `/admin/requests/${req.id}`, { _csrf: csrf, status: 'in_progress', note: 'Called back' });
  assert.equal(res.status, 303);
  assert.equal(lastRequest().status, 'in_progress');
  res = await admin('GET', '/admin/requests.csv?type=enquiry');
  assert.equal(res.status, 200);
  assert.match(res.text, /'=HYPERLINK/);
  assert.match(res.headers.get('content-type'), /text\/csv/);
});
