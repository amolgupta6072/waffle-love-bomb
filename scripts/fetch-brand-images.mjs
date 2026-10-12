// Downloads product listings and the main product photo for each LYNQ brand
// from the brand's own website. Runs in GitHub Actions (see
// .github/workflows/fetch-brand-images.yml), which has open internet access.
//
// Output:
//   data/brand-products/<brand>.json        product titles, links and image paths
//   public/images/brands/<brand>/<handle>.<ext>   one photo per product (max ~800 px)

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BRANDS = {
  'arsene-lippens': 'https://www.arsenelippens.com',
  'furlan-marri': 'https://www.furlanmarri.com',
  beaubleu: 'https://beaubleu-paris.com',
  dennison: 'https://dennisonwatch.com',
  awake: 'https://awakewatches.com',
  'atelier-wen': 'https://us.atelierwen.com',
  amida: 'https://www.amida-watches.com',
  fears: 'https://www.fearswatches.com',
  formex: 'https://formexwatch.com',
  hegid: 'https://hegid.com',
};

// Accessories we don't need photos of.
const SKIP = /\b(strap|straps|buckle|gift ?card|pouch|tool|cleaning|cloth|spring ?bar|deployant|clasp|travel case|poster|book|t-shirt|cap|hoodie|sticker|insurance|service|engraving|deposit)\b/i;
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as = 'json') {
  const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  if (as === 'json') return res.json();
  if (as === 'text') return res.text();
  return Buffer.from(await res.arrayBuffer());
}

// Shopify stores publish /products.json.
async function shopifyProducts(base) {
  const all = [];
  for (let page = 1; page <= 6; page++) {
    const data = await get(`${base}/products.json?limit=250&page=${page}`);
    if (!data.products?.length) break;
    all.push(...data.products);
    await sleep(300);
  }
  return all.map((p) => ({
    title: p.title,
    handle: p.handle,
    type: p.product_type || '',
    url: `${base}/products/${p.handle}`,
    image: p.images?.[0]?.src || '',
  }));
}

// Fallback for non-Shopify sites: read product links from collection pages, then each page's og:image.
async function htmlProducts(base) {
  const links = new Set();
  for (const path of ['/collections/watches/', '/collections/all', '/watches/', '/']) {
    try {
      const html = await get(base + path, 'text');
      for (const m of html.matchAll(/href="((?:https?:\/\/[^"]*?)?\/(?:watches|products)\/[a-z0-9-]+\/?)"/gi)) {
        links.add(new URL(m[1], base).href);
      }
    } catch { /* try next */ }
  }
  const out = [];
  for (const url of [...links].slice(0, 120)) {
    try {
      const html = await get(url, 'text');
      const meta = (prop) => html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)`, 'i'))?.[1] || '';
      const handle = url.replace(/\/$/, '').split('/').pop();
      out.push({ title: meta('title').replace(/\s*[-|–].*$/, '') || handle, handle, type: '', url, image: meta('image') });
      await sleep(250);
    } catch (err) { console.log(`  skip ${url}: ${err.message}`); }
  }
  return out;
}

function sized(src) {
  const url = new URL(src.startsWith('//') ? `https:${src}` : src);
  if (url.hostname.includes('shopify') || url.pathname.includes('/cdn/shop/')) url.searchParams.set('width', '800');
  return url.href;
}

const summary = [];
for (const [brand, base] of Object.entries(BRANDS)) {
  console.log(`\n== ${brand} (${base})`);
  let products = [];
  let method = 'shopify';
  try {
    products = await shopifyProducts(base);
  } catch (err) {
    console.log(`  products.json unavailable (${err.message}); reading pages instead`);
    method = 'html';
    try { products = await htmlProducts(base); } catch (e) { console.log(`  failed: ${e.message}`); }
  }
  const watches = products.filter((p) => p.image && !SKIP.test(`${p.title} ${p.type}`));
  const dir = join('public/images/brands', brand);
  mkdirSync(dir, { recursive: true });
  const saved = [];
  for (const p of watches.slice(0, 150)) {
    try {
      const src = sized(p.image);
      const ext = (new URL(src).pathname.match(/\.(jpe?g|png|webp)$/i)?.[1] || 'jpg').toLowerCase().replace('jpeg', 'jpg');
      const file = `${p.handle}.${ext}`;
      writeFileSync(join(dir, file), await get(src, 'buffer'));
      saved.push({ title: p.title, handle: p.handle, type: p.type, url: p.url, image: `/images/brands/${brand}/${file}` });
      await sleep(150);
    } catch (err) { console.log(`  image failed for ${p.handle}: ${err.message}`); }
  }
  mkdirSync('data/brand-products', { recursive: true });
  writeFileSync(join('data/brand-products', `${brand}.json`), `${JSON.stringify({ brand, base, method, fetched: new Date().toISOString(), products: saved }, null, 2)}\n`);
  console.log(`  ${products.length} products found, ${saved.length} photos saved`);
  summary.push(`${brand}: ${products.length} products, ${saved.length} photos (${method})`);
}
console.log(`\nSummary\n${summary.join('\n')}`);
