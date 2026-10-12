import { html } from '../html.js';

export const logoMark = (cls = 'logo-mark') => html`<svg class="${cls}" viewBox="0 0 44 34" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6">
  <path d="M8 23V18H18M28 18H33V9"/><circle cx="8" cy="27" r="3.6"/><circle cx="23" cy="18" r="4.4"/><circle cx="33" cy="6" r="3.6"/>
</svg>`;

const NAV = [
  ['/discover', 'Discover'],
  ['/maisons', 'Maisons'],
  ['/gallery', 'The Gallery'],
  ['/events', 'Events'],
  ['/about', 'About'],
];

export function layout({ title, description = '', path = '/', body, bodyClass = '' }) {
  const fullTitle = title ? `${title} | LYNQ` : 'LYNQ | A Dedicated Platform for Independent Watchmaking';
  const desc = description || 'LYNQ is a dedicated platform for independent watchmaking. Discover founder-led maisons, their stories and collections. An initiative by Ethos.';
  return html`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${fullTitle}</title>
  <meta name="description" content="${desc}">
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${desc}">
  <meta property="og:site_name" content="LYNQ">
  <meta name="theme-color" content="#0b0b0c">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css">
</head>
<body class="${bodyClass}">
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brandmark" href="/" aria-label="LYNQ home">${logoMark()}<span>LYNQ</span></a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span class="sr-only">Menu</span></button>
      <nav id="site-nav" class="site-nav" aria-label="Main">
        ${NAV.map(([href, label]) => html`<a href="${href}" ${path.startsWith(href) ? html`aria-current="page"` : ''}>${label}</a>`)}
        <a class="btn btn-outline btn-sm" href="/appointment">Book an appointment</a>
      </nav>
    </div>
  </header>

  <main id="main">
${body}
  </main>

  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div class="footer-brand">
        <a class="brandmark" href="/">${logoMark()}<span>LYNQ</span></a>
        <p class="tagline">Curated. Exceptional. Unconventional.</p>
        <p class="muted small">A dedicated platform for independent watchmaking.<br>An initiative by Ethos.</p>
      </div>
      <div>
        <h3 class="eyebrow">Explore</h3>
        <ul class="footer-links">
          <li><a href="/discover">Discover watches</a></li>
          <li><a href="/maisons">The maisons</a></li>
          <li><a href="/gallery">The LYNQ Gallery</a></li>
          <li><a href="/events">Collector events</a></li>
        </ul>
      </div>
      <div>
        <h3 class="eyebrow">Connect</h3>
        <ul class="footer-links">
          <li><a href="/appointment">Book an appointment</a></li>
          <li><a href="/enquire">Make an enquiry</a></li>
          <li><a href="/partner">For independent brands</a></li>
          <li><a href="/about">About LYNQ</a></li>
        </ul>
      </div>
      <div>
        <h3 class="eyebrow">The LYNQ Circle</h3>
        <p class="muted small">Early access to new arrivals, private previews and collector evenings.</p>
        <form class="inline-form" method="post" action="/newsletter">
          <label class="sr-only" for="nl-email">Email</label>
          <input id="nl-email" type="email" name="email" placeholder="Your email" required>
          <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button class="btn btn-light btn-sm" type="submit">Join</button>
        </form>
      </div>
    </div>
    <div class="wrap footer-base">
      <span>© ${new Date().getFullYear()} LYNQ. An initiative by Ethos Limited.</span>
      <span class="muted">thisislynq.com</span>
    </div>
  </footer>
  <script src="/js/site.js" defer></script>
</body>
</html>`;
}
