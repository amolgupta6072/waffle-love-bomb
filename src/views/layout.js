import { html } from '../html.js';

export const logoMark = (cls = 'logo-mark') => html`<svg class="${cls}" viewBox="0 0 44 34" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6">
  <path d="M8 23V18H18M28 18H33V9"/><circle cx="8" cy="27" r="3.6"/><circle cx="23" cy="18" r="4.4"/><circle cx="33" cy="6" r="3.6"/>
</svg>`;

const icon = {
  bag: html`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`,
  calendar: html`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="4" y="5" width="16" height="15"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>`,
  close: html`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
};

const NAV = [
  ['/about', 'Discover LYNQ'],
  ['/maisons', 'The Maisons'],
  ['/discover', 'The Collection'],
  ['/gallery', 'The Gallery'],
  ['/events', 'Events'],
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
  <meta name="theme-color" content="#ffffff">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css">
</head>
<body class="${bodyClass}">
  <a class="skip" href="#main">Skip to content</a>
  <div class="announce" role="note">
    <span>Authenticity guaranteed by Ethos</span><span aria-hidden="true">·</span><span>Insured delivery across India</span><span aria-hidden="true" class="hide-sm">·</span><span class="hide-sm">Private viewings by appointment</span>
  </div>
  <header class="site-header">
    <div class="wrap header-top">
      <div class="header-side">
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span class="sr-only">Menu</span></button>
        <a class="header-link hide-sm" href="/appointment">${icon.calendar}<span>Book a viewing</span></a>
      </div>
      <a class="brandmark" href="/" aria-label="LYNQ home">${logoMark()}<span class="word">LYNQ</span><span class="sub">An initiative by Ethos</span></a>
      <div class="header-side end">
        <a class="header-link bag-link" href="/bag" data-open-bag aria-label="Shopping bag">${icon.bag}<span class="hide-sm">Bag</span><span class="bag-count" data-bag-count hidden>0</span></a>
      </div>
    </div>
    <nav id="site-nav" class="site-nav" aria-label="Main">
      <div class="wrap nav-inner">
        ${NAV.map(([href, label]) => html`<a href="${href}" ${path.startsWith(href) ? html`aria-current="page"` : ''}>${label}</a>`)}
        <a class="nav-mobile-only" href="/appointment">Book a viewing</a>
      </div>
    </nav>
  </header>

  <main id="main">
${body}
  </main>

  <section class="assurance" aria-label="The LYNQ promise">
    <div class="wrap assurance-grid">
      <div><h3>Authenticity guaranteed</h3><p>Every piece is sourced directly from the maison and backed by Ethos.</p></div>
      <div><h3>Insured delivery</h3><p>Fully insured, signature-on-delivery shipping across India.</p></div>
      <div><h3>Ethos Care</h3><p>After-sales service from Ethos’ specialist watchmakers.</p></div>
      <div><h3>Private viewings</h3><p>Handle any piece at the LYNQ Gallery or on a video call.</p></div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div class="footer-brand">
        <a class="brandmark light" href="/">${logoMark()}<span class="word">LYNQ</span></a>
        <p class="tagline">Curated. Exceptional. Unconventional.</p>
        <p class="muted small">A dedicated platform for independent watchmaking. An initiative by Ethos.</p>
      </div>
      <div>
        <h3 class="footer-title">The journey</h3>
        <ul class="footer-links">
          <li><a href="/about">Discover LYNQ</a></li>
          <li><a href="/maisons">The maisons</a></li>
          <li><a href="/discover">The collection</a></li>
          <li><a href="/gallery">The LYNQ Gallery</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer-title">Client services</h3>
        <ul class="footer-links">
          <li><a href="/appointment">Book a private viewing</a></li>
          <li><a href="/enquire">Contact a specialist</a></li>
          <li><a href="/events">Collector events</a></li>
          <li><a href="/partner">For independent brands</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer-title">The LYNQ Circle</h3>
        <p class="muted small">Early access to new arrivals, private previews and collector evenings.</p>
        <form class="inline-form" method="post" action="/newsletter">
          <label class="sr-only" for="nl-email">Email</label>
          <input id="nl-email" type="email" name="email" placeholder="Your email address" required>
          <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button class="btn btn-light btn-sm" type="submit">Join</button>
        </form>
      </div>
    </div>
    <div class="wrap footer-base">
      <span>© ${new Date().getFullYear()} LYNQ. An initiative by Ethos Limited.</span>
      <span>thisislynq.com</span>
    </div>
  </footer>

  <aside class="bag-drawer" hidden aria-label="Your bag">
    <div class="bag-scrim" data-close-bag></div>
    <div class="bag-panel" role="dialog" aria-modal="true" aria-labelledby="bag-title">
      <div class="bag-head"><h2 id="bag-title">Your bag</h2><button class="icon-btn" type="button" data-close-bag aria-label="Close">${icon.close}</button></div>
      <p class="bag-empty" data-bag-empty>Your bag is empty.</p>
      <ul class="bag-list" data-bag-list></ul>
      <div class="bag-foot" data-bag-full hidden>
        <div class="bag-total"><span>Subtotal</span><strong data-bag-total>₹0</strong></div>
        <p class="hint">Insured delivery included. A LYNQ specialist confirms every order personally.</p>
        <a class="btn btn-dark btn-block" href="/checkout">Proceed to checkout</a>
        <a class="btn btn-outline btn-block" href="/bag">View bag</a>
      </div>
    </div>
  </aside>
  <script src="/js/site.js" defer></script>
</body>
</html>`;
}
