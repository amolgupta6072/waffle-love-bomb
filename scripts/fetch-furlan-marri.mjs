// Furlan Marri hides /products.json, so the general photo job only found share
// banners. This reads the collection's product list and each product's .js
// endpoint to get real product photos. Runs in GitHub Actions.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'https://www.furlanmarri.com';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url, as = 'json') => {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return as === 'json' ? res.json() : as === 'text' ? res.text() : Buffer.from(await res.arrayBuffer());
};

const handles = new Set();
for (const path of ['/collections/all-watches', '/collections/all-collections', '/collections/mechanical-watches', '/collections/mechaquartz-collection', '/collections/archives']) {
  try {
    const data = await get(`${BASE}${path}/products.json?limit=250`);
    data.products.forEach((p) => handles.add(p.handle));
    console.log(`${path}/products.json: ${data.products.length}`);
  } catch (err) {
    console.log(`${path}/products.json failed (${err.message}); reading HTML`);
    try {
      const html = await get(BASE + path, 'text');
      for (const m of html.matchAll(/\/products\/([a-z0-9-]+)/gi)) handles.add(m[1]);
    } catch (e) { console.log(`  ${path} failed: ${e.message}`); }
  }
  await sleep(300);
}
console.log(`${handles.size} product handles`);

const dir = 'public/images/brands/furlan-marri';
mkdirSync(dir, { recursive: true });
const products = [];
for (const handle of handles) {
  try {
    const p = await get(`${BASE}/products/${handle}.js`);
    const src = p.featured_image || p.images?.[0];
    if (!src) continue;
    const url = new URL(src.startsWith('//') ? `https:${src}` : src);
    url.searchParams.set('width', '900');
    const ext = (url.pathname.match(/\.(jpe?g|png|webp)$/i)?.[1] || 'jpg').toLowerCase().replace('jpeg', 'jpg');
    const file = `${handle}-product.${ext}`;
    writeFileSync(join(dir, file), await get(url.href, 'buffer'));
    products.push({ title: p.title, handle, type: p.type || '', url: `${BASE}/products/${handle}`, image: `/images/brands/furlan-marri/${file}` });
    console.log(`ok ${handle}: ${p.title}`);
  } catch (err) { console.log(`skip ${handle}: ${err.message}`); }
  await sleep(250);
}
mkdirSync('data/brand-products', { recursive: true });
writeFileSync('data/brand-products/furlan-marri.json', `${JSON.stringify({ brand: 'furlan-marri', base: BASE, method: 'shopify-js', fetched: new Date().toISOString(), products }, null, 2)}\n`);
console.log(`${products.length} photos saved`);
