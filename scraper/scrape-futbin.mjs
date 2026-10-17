#!/usr/bin/env node
// Scrapes the FUTBIN player list into data/players.json and downloads each
// player's card image into data/img/.
//
//   node scraper/scrape-futbin.mjs                 # first 10 list pages via fetch
//   node scraper/scrape-futbin.mjs --pages 40      # more players
//   node scraper/scrape-futbin.mjs --browser       # use Playwright (gets past JS challenges)
//   node scraper/scrape-futbin.mjs --html saved/   # parse list pages you saved from your browser
//   node scraper/scrape-futbin.mjs --no-images     # keep remote image URLs, skip downloading
//
// FUTBIN's markup changes between seasons, so parsing is heuristic: each table
// row that links to a /player/ page is read for name, rating, position, club,
// nation, league and the six face stats.

import { load } from 'cheerio';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'data');
const IMG_DIR = path.join(OUT_DIR, 'img');
const BASE = 'https://www.futbin.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

const POSITIONS = new Set([
  'GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF',
]);

function parseArgs(argv) {
  const args = { pages: 10, browser: false, html: null, images: true, delay: 1500, query: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--pages') args.pages = Number(argv[++i]);
    else if (a === '--browser') args.browser = true;
    else if (a === '--html') args.html = argv[++i];
    else if (a === '--no-images') args.images = false;
    else if (a === '--delay') args.delay = Number(argv[++i]);
    else if (a === '--query') args.query = argv[++i]; // e.g. "version=gold_rare"
  }
  return args;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const abs = (u) => (!u ? null : u.startsWith('//') ? 'https:' + u : u.startsWith('/') ? BASE + u : u);

function imgSrc($img) {
  return abs(
    $img.attr('data-src') || $img.attr('data-original') || $img.attr('src') || $img.attr('srcset')?.split(' ')[0],
  );
}

// Pulls the name of a club / nation / league from the filter link or icon in a row.
function filterLabel($, $row, key) {
  const $a = $row.find(`a[href*="${key}="]`).first();
  if ($a.length) {
    const $img = $a.find('img').first();
    const label = clean($a.attr('title') || $img.attr('title') || $img.attr('alt') || $a.text());
    const id = ($a.attr('href').match(new RegExp(`${key}=(\\d+)`)) || [])[1] || null;
    return { name: label || null, id, icon: $img.length ? imgSrc($img) : null };
  }
  const $img = $row.find(`img[src*="/${key}"], img[data-src*="/${key}"]`).first();
  if ($img.length) {
    const id = (imgSrc($img).match(/\/(\d+)\.png/) || [])[1] || null;
    return { name: clean($img.attr('title') || $img.attr('alt')) || null, id, icon: imgSrc($img) };
  }
  return { name: null, id: null, icon: null };
}

export function parseListPage(html) {
  const $ = load(html);
  const players = [];
  const seen = new Set();

  $('tr').each((_, tr) => {
    const $row = $(tr);
    const $link = $row.find('a[href*="/player/"]').first();
    if (!$link.length) return;
    const href = $link.attr('href');
    const m = href.match(/\/(\d+)\/player\/(\d+)\/([^/?#]+)/);
    if (!m) return;
    const [, season, id, slug] = m;
    if (seen.has(id)) return;
    seen.add(id);

    const name =
      clean($row.find('.table-player-name').first().text()) ||
      clean($link.attr('title')) ||
      clean($link.text()) ||
      slug.replace(/-/g, ' ');

    // Card face image: prefer something under /players/.
    let image = null;
    $row.find('img').each((_, im) => {
      const src = imgSrc($(im));
      if (!image && src && /\/players?\//.test(src)) image = src;
    });

    // Rating: the first 2-digit number in a "rating" element, else first cell in range.
    let rating = null;
    $row.find('[class*="rating"]').each((_, el) => {
      const n = Number(clean($(el).text()));
      if (!rating && n >= 40 && n <= 99) rating = n;
    });

    // Positions: main is the first standalone position token; others are alternates.
    const positions = [];
    $row.find('*').each((_, el) => {
      const $el = $(el);
      if ($el.children().length) return;
      for (const tok of clean($el.text()).split(/[\s,]+/)) {
        if (POSITIONS.has(tok) && !positions.includes(tok)) positions.push(tok);
      }
    });

    // Face stats: six numbers from cells tagged as stats, else the first six
    // numeric cells after the rating.
    let stats = [];
    $row.find('[class*="stat"]').each((_, el) => {
      const $el = $(el);
      if ($el.find('[class*="stat"]').length) return;
      const n = Number(clean($el.text()));
      if (n >= 1 && n <= 99) stats.push(n);
    });
    if (stats.length < 6) {
      stats = [];
      $row.children('td').each((_, td) => {
        const t = clean($(td).text());
        if (/^\d{1,2}$/.test(t)) stats.push(Number(t));
      });
      if (stats[0] === rating) stats.shift();
    }
    stats = stats.slice(0, 6);
    const keys = positions[0] === 'GK' ? ['div', 'han', 'kic', 'ref', 'spd', 'pos'] : ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];

    const version =
      clean($row.find('[class*="version"], [class*="card-type"]').first().text()) ||
      ($row.attr('class') || '').match(/(gold|silver|bronze|totw|icon|hero|special)[\w-]*/i)?.[0] ||
      null;

    if (!rating || !positions.length) return;

    players.push({
      id,
      season,
      name,
      slug,
      url: BASE + href.replace(BASE, ''),
      rating,
      position: positions[0],
      altPositions: positions.slice(1),
      club: filterLabel($, $row, 'club'),
      nation: filterLabel($, $row, 'nation'),
      league: filterLabel($, $row, 'league'),
      version,
      stats: stats.length === 6 ? Object.fromEntries(keys.map((k, i) => [k, stats[i]])) : null,
      image,
      imageRemote: image,
    });
  });
  return players;
}

async function makeFetcher(useBrowser) {
  if (!useBrowser) {
    const headers = { 'user-agent': UA, accept: 'text/html,image/*,*/*', referer: BASE + '/' };
    return {
      html: async (url) => {
        const r = await fetch(url, { headers });
        if (!r.ok) throw new Error(`${r.status} for ${url}`);
        return r.text();
      },
      bytes: async (url) => {
        const r = await fetch(url, { headers });
        if (!r.ok) throw new Error(`${r.status} for ${url}`);
        return Buffer.from(await r.arrayBuffer());
      },
      close: async () => {},
    };
  }
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ userAgent: UA });
  const page = await ctx.newPage();
  return {
    html: async (url) => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('a[href*="/player/"]', { timeout: 30000 });
      return page.content();
    },
    bytes: async (url) => {
      const r = await ctx.request.get(url, { headers: { referer: BASE + '/' } });
      if (!r.ok()) throw new Error(`${r.status()} for ${url}`);
      return r.body();
    },
    close: () => browser.close(),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await fs.mkdir(IMG_DIR, { recursive: true });
  const fetcher = await makeFetcher(args.browser);
  const all = new Map();

  try {
    if (args.html) {
      const files = (await fs.readdir(args.html)).filter((f) => /\.html?$/.test(f)).sort();
      for (const f of files) {
        const found = parseListPage(await fs.readFile(path.join(args.html, f), 'utf8'));
        found.forEach((p) => all.set(p.id, p));
        console.log(`${f}: ${found.length} players`);
      }
    } else {
      for (let page = 1; page <= args.pages; page++) {
        const url = `${BASE}/players?page=${page}${args.query ? '&' + args.query : ''}`;
        const found = parseListPage(await fetcher.html(url));
        found.forEach((p) => all.set(p.id, p));
        console.log(`page ${page}: ${found.length} players (total ${all.size})`);
        if (!found.length) break;
        await sleep(args.delay);
      }
    }

    const players = [...all.values()];
    if (args.images) {
      let ok = 0;
      for (const p of players) {
        if (!p.imageRemote) continue;
        const file = `${p.id}.png`;
        const dest = path.join(IMG_DIR, file);
        try {
          await fs.access(dest);
        } catch {
          try {
            await fs.writeFile(dest, await fetcher.bytes(p.imageRemote));
            await sleep(150);
          } catch (e) {
            console.warn(`image failed for ${p.name}: ${e.message}`);
            continue;
          }
        }
        p.image = `data/img/${file}`;
        ok++;
      }
      console.log(`images: ${ok}/${players.length}`);
    }

    players.sort((a, b) => b.rating - a.rating);
    const out = { source: BASE, scrapedAt: new Date().toISOString(), count: players.length, players };
    await fs.writeFile(path.join(OUT_DIR, 'players.json'), JSON.stringify(out, null, 1));
    // Also as a script so index.html works when opened straight from disk (file://).
    await fs.writeFile(path.join(OUT_DIR, 'players.js'), `window.FUTBIN_PLAYERS = ${JSON.stringify(out)};\n`);
    console.log(`wrote ${players.length} players to data/players.json`);
    if (!players.length) {
      console.error('No players parsed. FUTBIN may have blocked the request or changed its markup; try --browser or --html.');
      process.exitCode = 1;
    }
  } finally {
    await fetcher.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
