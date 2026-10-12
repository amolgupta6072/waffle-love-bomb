// Builds a static, clickable demo of LYNQ (public site + a read-only look at
// the admin) into a folder of plain HTML files that can be hosted anywhere.
//
// Usage: npm run demo -- [output-folder]   (default: demo/)
//
// Forms in the demo don't send anything; submitting one shows the matching
// thank-you page. Admin pages carry sample inbox entries and don't save.

import { mkdirSync, writeFileSync, readFileSync, rmSync, copyFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { join } from 'node:path';
import { openDatabase } from '../src/db.js';
import { createApp } from '../src/app.js';
import { seedIfEmpty } from '../src/seed.js';
import { upsertAdmin } from '../src/auth.js';
import { CURATIONS } from '../src/catalog.js';

const OUT = process.argv[2] || 'demo';
const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');

const db = openDatabase(':memory:');
seedIfEmpty(db);
upsertAdmin(db, { email: 'demo@lynq.local', password: 'demo-password-123' });

const server = await new Promise((resolve) => { const s = createApp(db, { formLimit: 1e6 }).listen(0, () => resolve(s)); });
const base = `http://127.0.0.1:${server.address().port}`;
let cookie = '';
async function call(method, path, form) {
  const res = await fetch(base + path, {
    method,
    redirect: 'manual',
    headers: { ...(cookie && { Cookie: cookie }), ...(form && { 'Content-Type': 'application/x-www-form-urlencoded' }) },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  return { status: res.status, text: await res.text() };
}

// ---------- Sample inbox entries (clearly sample data) ----------
const soon = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
await call('POST', '/appointment', { location: 'delhi-ncr', watch: 'awake-son-mai-guilloche-main-alba', preferred_date: soon(6), slot: 'Evening', name: 'Sample Client A', email: 'client.a@example.com', phone: '+91 90000 00001', city: 'New Delhi', message: 'Would like to compare the Son Mài dials side by side.' });
await call('POST', '/enquire', { watch: 'fears-brunswick-38-white', name: 'Sample Client B', email: 'client.b@example.com', city: 'Mumbai', message: 'Is the Brunswick available with a white dial in India?' });
await call('POST', '/appointment', { location: 'virtual', brand: 'amida', preferred_date: soon(3), slot: 'Morning', name: 'Sample Client C', email: 'client.c@example.com', phone: '+91 90000 00003', city: 'Bengaluru' });
await call('POST', '/partner', { company: 'Sample Atelier', name: 'Sample Founder', email: 'founder@example.com', message: 'Founder-led brand producing around 500 pieces a year, interested in India.' });
await call('POST', '/newsletter', { email: 'circle.member@example.com' });
await call('POST', '/admin/login', { email: 'demo@lynq.local', password: 'demo-password-123' });
const csrf = /name="_csrf" value="([a-f0-9]+)"/.exec((await call('GET', '/admin')).text)[1];
await call('POST', '/admin/requests/2', { _csrf: csrf, status: 'in_progress', note: 'Sample note: called back, sending detailed photos.' });

// ---------- Pages to export ----------
const watches = db.prepare('SELECT id, slug FROM watches WHERE published = 1').all();
const brands = db.prepare('SELECT id, slug FROM brands WHERE published = 1').all();
const usedCurations = new Set(db.prepare('SELECT DISTINCT curation FROM watches').all().map((r) => r.curation));
const requests = db.prepare('SELECT id FROM requests').all();
const locations = db.prepare('SELECT id FROM locations').all();

const pages = new Map([
  ['/', 'home.html'], ['/discover', 'discover.html'], ['/maisons', 'maisons.html'], ['/gallery', 'gallery.html'],
  ['/events', 'events.html'], ['/about', 'about.html'], ['/partner', 'partner.html'], ['/appointment', 'appointment.html'],
  ['/enquire', 'enquire.html'], ['/nothing-here', '404.html'],
  ['/admin', 'admin.html'], ['/admin/watches', 'admin-watches.html'], ['/admin/brands', 'admin-brands.html'],
  ['/admin/events', 'admin-events.html'], ['/admin/locations', 'admin-locations.html'],
]);
for (const c of CURATIONS) if (usedCurations.has(c.slug)) pages.set(`/discover?curation=${c.slug}`, `discover-${c.slug}.html`);
// Admin edit screens for a handful of watches are enough to show how editing works.
watches.forEach((w, i) => { pages.set(`/watches/${w.slug}`, `watch-${w.slug}.html`); if (i < 12) pages.set(`/admin/watches/${w.id}`, `admin-watch-${w.id}.html`); });
for (const b of brands) { pages.set(`/maisons/${b.slug}`, `maison-${b.slug}.html`); pages.set(`/admin/brands/${b.id}`, `admin-brand-${b.id}.html`); }
for (const r of requests) pages.set(`/admin/requests/${r.id}`, `admin-request-${r.id}.html`);
for (const l of locations) pages.set(`/admin/locations/${l.id}`, `admin-location-${l.id}.html`);
for (const t of ['order', 'enquiry', 'appointment', 'event', 'partner', 'newsletter']) pages.set(`/thank-you?type=${t}`, `thank-you-${t}.html`);

// Maps an app URL to its exported file (or '#' when the demo has no such page).
function mapUrl(href) {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const [pathAndQuery, hash = ''] = href.split('#');
  const [path, query = ''] = pathAndQuery.split('?');
  const params = new URLSearchParams(query.replace(/&amp;/g, '&'));
  let key = path;
  if (path === '/discover' && params.get('curation')) key = `/discover?curation=${params.get('curation')}`;
  if (path.startsWith('/curations/')) key = `/discover?curation=${path.split('/')[2]}`;
  if (path === '/thank-you') key = `/thank-you?type=${params.get('type') || 'enquiry'}`;
  if (path === '/admin' || path === '/admin/login') key = '/admin';
  const file = pages.get(key);
  if (file) return file + (hash ? `#${hash}` : '');
  return path === '/' && hash ? `#${hash}` : '#';
}

const siteCss = read('public/css/site.css');
const adminCss = read('public/css/admin.css');
const siteJs = read('public/js/site.js');
const adminJs = read('public/js/admin.js');
const favicon = `data:image/svg+xml,${encodeURIComponent(read('public/favicon.svg').trim())}`;

const DEMO_CSS = `
[hidden] { display: none !important; }
.demo-bar { background: #2a0507; color: #f3dcdc; font: 500 12px/1.4 Inter, system-ui, sans-serif; letter-spacing: .04em; text-align: center; padding: 8px 16px; }
.demo-toast { position: fixed; left: 50%; bottom: calc(24px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); background: #0b0b0c; color: #f6f3ee; padding: 12px 18px; font: 500 14px/1.4 Inter, system-ui, sans-serif; z-index: 100; max-width: calc(100% - 32px); }
`;

// Public forms go to their thank-you page; admin forms explain that the demo doesn't save.
const DEMO_JS = `
document.querySelectorAll('form').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var to = form.getAttribute('data-demo-to');
    if (to) { window.location.href = to; return; }
    var t = document.querySelector('.demo-toast') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'demo-toast', role: 'status' }));
    t.textContent = 'Demo only: in the live admin this would be saved.';
    t.hidden = false;
    setTimeout(function () { t.hidden = true; }, 2600);
    form.querySelectorAll('button').forEach(function (b) { b.disabled = false; });
  }, true);
});
var filters = document.querySelector('form[data-clientfilter]');
if (filters) {
  var apply = function () {
    var get = function (n) { var s = filters.querySelector('select[name=' + n + ']'); return s ? s.value : ''; };
    var b = get('brand'), c = get('country'), a = get('availability'), shown = 0;
    document.querySelectorAll('.watch-card').forEach(function (card) {
      var ok = (!b || card.dataset.brand === b) && (!c || card.dataset.country === c) && (!a || card.dataset.availability === a);
      card.hidden = !ok; if (ok) shown++;
    });
    var count = filters.querySelector('.result-count');
    if (count) count.textContent = shown + (shown === 1 ? ' watch' : ' watches');
  };
  filters.querySelectorAll('select').forEach(function (s) { s.addEventListener('change', apply); });
}
`;

function formTarget(action, formHtml) {
  if (action === '/enquire') return /name="type" value="order"/.test(formHtml) ? 'thank-you-order.html' : 'thank-you-enquiry.html';
  if (action === '/appointment') return 'thank-you-appointment.html';
  if (action === '/partner') return 'thank-you-partner.html';
  if (action === '/newsletter') return 'thank-you-newsletter.html';
  if (/^\/events\/.+\/rsvp$/.test(action)) return 'thank-you-event.html';
  return '';
}

function transform(htmlText, isAdmin) {
  let out = htmlText
    .replace(/data-autosubmit/g, 'data-clientfilter')
    .replace('<link rel="stylesheet" href="/css/site.css">', `<style>${siteCss}${DEMO_CSS}</style>`)
    .replace('<link rel="stylesheet" href="/css/admin.css">', `<style>${adminCss}${DEMO_CSS}</style>`)
    .replace('<script src="/js/site.js" defer></script>', `<script>${siteJs}</script><script>${DEMO_JS}</script>`)
    .replace('<script src="/js/admin.js" defer></script>', `<script>${adminJs}</script><script>${DEMO_JS}</script>`)
    .replace(/href="\/favicon\.svg"/, `href="${favicon}"`);
  // Forms: remember where a public form should land, then neutralise the action.
  out = out.replace(/<form([^>]*?)action="([^"]+)"([^>]*)>([\s\S]*?)<\/form>/g, (m, a, action, b, inner) => {
    const to = isAdmin ? '' : formTarget(action, inner);
    return `<form${a}action="#"${b}${to ? ` data-demo-to="${to}"` : ''}>${inner}</form>`;
  });
  // Product photos: copy each one used into the demo and point at it relatively.
  out = out.replace(/src="\/(images\/[^"]+)"/g, (m, rel) => { usedImages.add(rel); return `src="${rel}"`; });
  out = out.replace(/(href|data-href)="(\/[^"]*)"/g, (m, attr, url) => `${attr}="${mapUrl(url.replace(/&amp;/g, '&'))}"`);
  out = out.replace(/<body([^>]*)>/, `<body$1><div class="demo-bar">${isAdmin
    ? 'Demo of the LYNQ team admin · sample entries · changes are not saved'
    : 'LYNQ concept preview for internal review · forms do not send'}</div>`);
  return out;
}

const usedImages = new Set();
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const [url, file] of pages) {
  const { status, text } = await call('GET', url);
  if (status !== 200 && !(url === '/nothing-here' && status === 404)) throw new Error(`${url} returned ${status}`);
  writeFileSync(join(OUT, file), transform(text, url.startsWith('/admin')));
}

for (const rel of usedImages) {
  mkdirSync(join(OUT, dirname(rel)), { recursive: true });
  copyFileSync(join(root, 'public', rel), join(OUT, rel));
}

// The entry page is the home page without its document wrapper, for hosts that
// add their own (the other files are complete documents).
const home = readFileSync(join(OUT, 'home.html'), 'utf8');
const head = /<head>([\s\S]*?)<\/head>/.exec(home)[1].replace(/<meta charset="utf-8">\s*/, '').replace(/<meta name="viewport"[^>]*>\s*/, '');
const body = /<body[^>]*>([\s\S]*)<\/body>/.exec(home)[1];
writeFileSync(join(OUT, 'index.html'), `${head.replace(/<title>[^<]*<\/title>/, '<title>LYNQ Website Preview</title>')}\n${body}`);

server.close();
console.log(`Demo written to ${OUT}/ (${pages.size + 1} pages, ${usedImages.size} photos). Open ${OUT}/home.html in a browser.`);
