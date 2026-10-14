// Furlan Marri hides /products.json and its product pages carry carousels of
// other watches, so we collect every product image URL on the site and match
// photos to models by the watch name in the image's file name.
// Runs in GitHub Actions; writes a full image list for review plus the matches.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'https://www.furlanmarri.com';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url, as = 'text') => {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return as === 'text' ? res.text() : Buffer.from(await res.arrayBuffer());
};

// The models LYNQ lists, and the words their photo file names should contain.
const TARGETS = {
  'sabbia-rosa': ['sabbia-rosa', 'sabbiarosa'],
  'ardesia-blu': ['ardesia'],
  'nero-sabbia': ['nero-sabbia', 'nerosabbia'],
  castagna: ['castagna'],
  'rosso-grigio': ['rosso-grigio', 'rossogrigio'],
  'blue-sector': ['blue-sector', 'bluesector'],
  'salmon-sector': ['salmon-sector', 'salmonsector'],
  'white-sector': ['white-sector', 'whitesector'],
  'disco-onyx-diamonds': ['onyx'],
  'outback-elegy': ['elegy'],
};

const pages = new Set(['/', '/collections/all-watches', '/collections/all-collections', '/collections/mechanical-watches', '/collections/mechaquartz-collection', '/collections/mechaquartz-watches', '/collections/archives']);
const images = new Set();
const collect = (html) => {
  for (const m of html.matchAll(/(?:https?:)?\/\/cdn\.shopify\.com\/s\/files\/[^"'\s)]+?\.(?:png|jpe?g|webp)/gi)) {
    images.add(m[0].replace(/^\/\//, 'https://').split('?')[0]);
  }
  for (const m of html.matchAll(/\/products\/([a-z0-9-]+)/gi)) pages.add(`/products/${m[1]}`);
};

const visited = new Set();
for (let round = 0; round < 2; round++) {
  for (const path of [...pages]) {
    if (visited.has(path)) continue;
    visited.add(path);
    try { collect(await get(BASE + path)); } catch (err) { console.log(`skip ${path}: ${err.message}`); }
    await sleep(200);
  }
}
const all = [...images].sort();
console.log(`${visited.size} pages, ${all.length} images`);
mkdirSync('data/brand-products', { recursive: true });
writeFileSync('data/brand-products/furlan-marri-images.txt', `${all.join('\n')}\n`);

const dir = 'public/images/brands/furlan-marri';
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const products = [];
for (const [handle, words] of Object.entries(TARGETS)) {
  // Prefer packshot-style names (shopify/packshot/front) over lifestyle shots.
  const candidates = all.filter((u) => words.some((w) => u.toLowerCase().split('/').pop().replace(/_/g, '-').includes(w)) && !/header|banner/i.test(u));
  const pick = candidates.find((u) => /shopify|packshot|front|png/i.test(u.split('/').pop())) || candidates[0];
  console.log(`${handle}: ${candidates.length} candidates -> ${pick || 'none'}`);
  if (!pick) continue;
  const ext = (pick.match(/\.(png|jpe?g|webp)$/i)?.[1] || 'jpg').toLowerCase().replace('jpeg', 'jpg');
  const file = `${handle}.${ext}`;
  try {
    writeFileSync(join(dir, file), await get(`${pick}?width=900`, 'buffer'));
    products.push({ title: handle.replace(/-/g, ' '), handle, type: '', url: `${BASE}/products/${handle}`, image: `/images/brands/furlan-marri/${file}`, source: pick });
  } catch (err) { console.log(`  download failed: ${err.message}`); }
}
writeFileSync('data/brand-products/furlan-marri.json', `${JSON.stringify({ brand: 'furlan-marri', base: BASE, method: 'image-file-names', fetched: new Date().toISOString(), products }, null, 2)}\n`);
console.log(`${products.length} photos saved`);
