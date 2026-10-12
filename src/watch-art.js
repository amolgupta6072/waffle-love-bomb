// Draws a stylised watch as inline SVG from a few attributes, so every model
// has an elegant visual even before product photography is uploaded.

import { raw, escape } from './html.js';

const CASES = {
  steel: ['#f4f5f7', '#a9aeb4', '#6f757c'],
  gold: ['#f7e3ad', '#c99a4b', '#8a6526'],
  rose: ['#f6d7c3', '#c4876a', '#86533f'],
  black: ['#5a5c60', '#2a2b2e', '#111214'],
};

export const ART_SHAPES = ['round', 'cushion', 'rect'];
export const ART_STYLES = ['three-hand', 'small-seconds', 'chrono', 'skeleton', 'digital'];
export const ART_CASES = Object.keys(CASES);

let counter = 0;

function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

const safeColor = (c, fallback) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : fallback);

export function watchArt({ art_shape = 'round', art_style = 'three-hand', art_dial, art_case = 'steel', art_strap, name = '' } = {}) {
  const id = `w${++counter}`;
  const dial = safeColor(art_dial, '#22252b');
  const strap = safeColor(art_strap, '#2a2a2a');
  const [c1, c2, c3] = CASES[art_case] || CASES.steel;
  const light = luminance(dial) > 0.55;
  const ink = light ? '#1c1d20' : '#f3efe6';
  const cx = 100;
  const cy = 150;

  // Case + dial geometry per shape. rx/ry are the dial's "radius" for placing indices.
  let caseShape;
  let dialShape;
  let rx;
  let ry;
  let strapW;
  let crownX;
  if (art_shape === 'rect') {
    caseShape = `<rect x="48" y="78" width="104" height="144" rx="20" fill="url(#${id}c)"/>`;
    dialShape = (fill) => `<rect x="57" y="88" width="86" height="124" rx="13" fill="${fill}"/>`;
    rx = 34; ry = 50; strapW = 78; crownX = 152;
  } else if (art_shape === 'cushion') {
    caseShape = `<rect x="34" y="84" width="132" height="132" rx="38" fill="url(#${id}c)"/>`;
    dialShape = (fill) => `<rect x="44" y="94" width="112" height="112" rx="30" fill="${fill}"/>`;
    rx = 45; ry = 45; strapW = 72; crownX = 166;
  } else {
    caseShape = `<circle cx="${cx}" cy="${cy}" r="64" fill="url(#${id}c)"/><circle cx="${cx}" cy="${cy}" r="58" fill="none" stroke="${c3}" stroke-opacity=".35"/>`;
    dialShape = (fill) => `<circle cx="${cx}" cy="${cy}" r="55" fill="${fill}"/>`;
    rx = 46; ry = 46; strapW = 66; crownX = 164;
  }

  const at = (deg, k = 1) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  };
  const line = ([x1, y1], [x2, y2], w, color = ink, extra = '') =>
    `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;

  let face = '';
  if (art_style === 'digital') {
    face += `<rect x="${cx - rx * 0.95}" y="${cy - 14}" width="${rx * 1.9}" height="28" rx="6" fill="#0d0d0f" stroke="${c2}" stroke-width="1.5"/>`;
    face += `<text x="${cx - rx * 0.5}" y="${cy + 6}" font-family="Georgia, serif" font-size="17" fill="#f3efe6" text-anchor="middle">12</text>`;
    face += `<text x="${cx + rx * 0.5}" y="${cy + 6}" font-family="Georgia, serif" font-size="17" fill="#f3efe6" text-anchor="middle">10</text>`;
    face += `<line x1="${cx}" y1="${cy - 10}" x2="${cx}" y2="${cy + 10}" stroke="#a61b22" stroke-width="2"/>`;
  } else {
    for (let h = 0; h < 12; h++) {
      const major = h % 3 === 0;
      face += line(at(h * 30, major ? 0.78 : 0.84), at(h * 30, 0.96), major ? 3 : 1.6, ink, 'stroke-opacity=".9"');
    }
    const sub = (x, y, r) =>
      `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${ink}" stroke-opacity=".55" stroke-width="1.2"/>` +
      `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - r * 0.75}" stroke="${ink}" stroke-width="1.2"/>`;
    if (art_style === 'chrono') {
      face += sub(cx - rx * 0.45, cy, rx * 0.24) + sub(cx + rx * 0.45, cy, rx * 0.24);
    } else if (art_style === 'small-seconds') {
      face += sub(cx, cy + ry * 0.46, rx * 0.24);
    } else if (art_style === 'skeleton') {
      face += [[-0.35, -0.2, 0.3], [0.32, 0.25, 0.26], [0.1, -0.42, 0.18], [-0.25, 0.42, 0.16]]
        .map(([dx, dy, r]) => `<circle cx="${cx + rx * dx}" cy="${cy + ry * dy}" r="${rx * r}" fill="none" stroke="${c1}" stroke-opacity=".55" stroke-width="2.5" stroke-dasharray="3 2"/>`)
        .join('');
    }
    face += line([cx, cy], at(-62, 0.52), 4.2);
    face += line([cx, cy], at(60, 0.8), 2.8);
    face += line(at(210, 0.15), at(30, 0.86), 1, '#b3262d');
    face += `<circle cx="${cx}" cy="${cy}" r="3.4" fill="${ink}"/><circle cx="${cx}" cy="${cy}" r="1.4" fill="#b3262d"/>`;
  }

  const svg = `<svg class="watch-art" viewBox="0 0 200 300" role="img" aria-label="${escape(name || 'Watch illustration')}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>
    <radialGradient id="${id}d" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
  </defs>
  <rect x="${cx - strapW / 2}" y="0" width="${strapW}" height="300" rx="10" fill="${strap}"/>
  <rect x="${cx - strapW / 2}" y="0" width="${strapW}" height="300" rx="10" fill="url(#${id}s)"/>
  <rect x="${crownX - 2}" y="${cy - 9}" width="11" height="18" rx="3" fill="url(#${id}c)"/>
  ${caseShape}
  ${dialShape(dial)}
  ${dialShape(`url(#${id}d)`)}
  ${face}
</svg>`;
  return raw(svg);
}
