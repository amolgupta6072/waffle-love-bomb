import { html, paragraphs, lines, formatInr, formatDate } from '../html.js';
import { watchArt } from '../watch-art.js';
import { CURATIONS, curationBySlug, AVAILABILITY } from '../catalog.js';
import { layout, logoMark } from './layout.js';

// ---------- Shared pieces ----------

export function watchVisual(w, { eager = false } = {}) {
  if (w.image_url) return html`<img class="watch-img" src="${w.image_url}" alt="${w.brand_name} ${w.name}" ${eager ? '' : html`loading="lazy"`}>`;
  return watchArt({ ...w, name: `${w.brand_name} ${w.name}` });
}

const priceLabel = (w) => (w.price_inr ? formatInr(w.price_inr) : 'Price on request');
const canOrder = (w) => w.availability === 'available' && Boolean(w.price_inr);
const origin = (b) => [b.city, b.country].filter(Boolean).join(', ');

function watchCard(w) {
  return html`<a class="watch-card" href="/watches/${w.slug}" data-brand="${w.brand_slug || ''}" data-country="${w.brand_country || ''}" data-availability="${w.availability}">
    <div class="watch-stage">${watchVisual(w)}</div>
    <div class="watch-meta">
      <span class="card-brand">${w.brand_name}</span>
      <h3>${w.name}</h3>
      <span class="card-price">${w.availability === 'sold' ? 'Sold out' : priceLabel(w)}</span>
    </div>
  </a>`;
}

export const watchGrid = (watches, cls = '') => html`<div class="watch-grid ${cls}">${watches.map(watchCard)}</div>`;

const field = (label, input, hint = '') => html`<div class="field"><label>${label}${input}</label>${hint ? html`<p class="hint">${hint}</p>` : ''}</div>`;
const input = (name, v, attrs = '') => html`<input name="${name}" value="${v[name] ?? ''}" ${attrs}>`;
const errorBox = (error) => (error ? html`<div class="alert" role="alert">${error}</div>` : '');
const honeypot = html`<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">`;

function contactFields(v, { phoneRequired = false } = {}) {
  return html`
    <div class="field-row">
      ${field('Full name', input('name', v, html`type="text" autocomplete="name" required maxlength="100"`))}
      ${field('Email', input('email', v, html`type="email" autocomplete="email" required`))}
    </div>
    <div class="field-row">
      ${field(phoneRequired ? 'Phone' : 'Phone (optional)', input('phone', v, html`type="tel" autocomplete="tel" ${phoneRequired ? html`required` : ''}`))}
      ${field('City', input('city', v, html`type="text" autocomplete="address-level2" maxlength="80" ${phoneRequired ? html`required` : ''}`))}
    </div>`;
}

function pageHead(eyebrow, title, intro = '') {
  return html`<section class="page-head wrap">
    <p class="eyebrow">${eyebrow}</p>
    <h1>${title}</h1>
    ${intro ? html`<p class="lede">${intro}</p>` : ''}
  </section>`;
}

// The four chapters of the LYNQ journey, shown as a thin progress line.
const STEPS = [['/about', 'Discover LYNQ'], ['/maisons', 'The Maisons'], ['/discover', 'The Collection'], ['/checkout', 'Your Order']];
function journey(current) {
  return html`<ol class="journey wrap" aria-label="Your journey">
    ${STEPS.map(([href, label], i) => html`<li class="${i === current ? 'is-current' : ''} ${i < current ? 'is-done' : ''}"><a href="${href}"><span class="num">${['I', 'II', 'III', 'IV'][i]}</span>${label}</a></li>`)}
  </ol>`;
}

// ---------- Pages ----------

export function homePage({ featured, brands, curations, nextEvent, location }) {
  return layout({
    path: '/',
    bodyClass: 'home',
    body: html`
    <section class="hero">
      <img class="hero-bg" src="/images/lynq/silk.webp" alt="" aria-hidden="true">
      <div class="wrap hero-inner">
        ${logoMark('hero-mark')}
        <h1 class="hero-title">LYNQ</h1>
        <p class="hero-sub">A dedicated platform for independent watchmaking</p>
        <p class="hero-tag">Curated · Exceptional · Unconventional</p>
        <div class="hero-cta">
          <a class="btn btn-light" href="#chapter-1">Begin the journey</a>
          <a class="btn btn-ghost-light" href="/maisons">Explore the maisons</a>
        </div>
      </div>
      <p class="hero-foot">An initiative by Ethos</p>
    </section>

    <section class="chapter wrap" id="chapter-1">
      <div class="chapter-copy">
        <p class="chapter-num">Chapter I</p>
        <h2>Discover LYNQ</h2>
        <p class="lede">As collectors move toward independent, design-led and founder-driven watchmaking, LYNQ is a home built around discovery, storytelling and community.</p>
        <p>Where independence is preserved. Where storytelling leads. Where community matters more than scale.</p>
        <a class="link-arrow" href="/about">Our story</a>
      </div>
      <figure class="chapter-image"><img src="/images/lynq/wall.webp" alt="The LYNQ wall: curated independent watches displayed in eight themes"></figure>
    </section>

    <section class="chapter-band">
      <div class="wrap">
        <div class="section-head center">
          <p class="chapter-num">Chapter II</p>
          <h2>The Maisons</h2>
          <p class="lede">Ten founder-led and independent houses, each with a distinct point of view.</p>
        </div>
        <div class="maison-tiles">
          ${brands.map((b) => html`<a class="maison-tile" href="/maisons/${b.slug}">
            <div class="tile-stage">${b.lead ? watchVisual({ ...b.lead, brand_name: b.name }) : ''}</div>
            <span class="tile-name">${b.name}</span>
            <span class="tile-origin">${origin(b)}</span>
          </a>`)}
        </div>
      </div>
    </section>

    <section class="section wrap">
      <div class="section-head center">
        <p class="chapter-num">Chapter III</p>
        <h2>The Collection</h2>
        <p class="lede">Selected pieces from the maisons. Discover by theme, or browse the full collection.</p>
      </div>
      <nav class="curation-links" aria-label="Curations">
        ${curations.map((c) => html`<a href="/discover?curation=${c.slug}">${c.name}</a>`)}
      </nav>
      ${watchGrid(featured)}
      <p class="center-cta"><a class="btn btn-outline" href="/discover">View the full collection</a></p>
    </section>

    <section class="feature-image">
      <img src="/images/lynq/gallery.webp" alt="Concept render of the LYNQ Gallery">
      <div class="feature-card">
        <p class="chapter-num">Chapter IV</p>
        <h2>The LYNQ Gallery</h2>
        <p>A space designed for discovery, conversation and context, where collectors meet independent watchmaking in person.</p>
        ${location ? html`<p class="status-line">${location.name} · ${location.status_note || (location.status === 'open' ? 'Now open' : 'Coming soon')}</p>` : ''}
        <div class="btn-row"><a class="btn btn-dark" href="/appointment">Book a private viewing</a><a class="link-arrow" href="/gallery">About the gallery</a></div>
      </div>
    </section>

    ${nextEvent ? html`<section class="section wrap">
      <div class="event-feature">
        <div><p class="eyebrow">Next collector evening</p><h2>${nextEvent.title}</h2><p class="muted">${formatDate(nextEvent.starts_at, true)}${nextEvent.venue ? ` · ${nextEvent.venue}` : ''}</p><p>${nextEvent.summary}</p></div>
        <a class="btn btn-dark" href="/events/${nextEvent.slug}">Reserve your place</a>
      </div>
    </section>` : ''}

    <section class="circle-band">
      <img class="circle-bg" src="/images/lynq/silk.webp" alt="" aria-hidden="true">
      <div class="wrap circle-inner">
        <p class="eyebrow light">The LYNQ Circle</p>
        <h2>Be first to know</h2>
        <p>New arrivals, private previews and invitations to collector evenings, shared sparingly.</p>
        <form class="inline-form big" method="post" action="/newsletter">
          <label class="sr-only" for="circle-email">Email</label>
          <input id="circle-email" type="email" name="email" placeholder="Your email address" required>
          ${honeypot}
          <button class="btn btn-light" type="submit">Join the Circle</button>
        </form>
      </div>
    </section>`,
  });
}

export function discoverPage({ watches, brands, curations, countries, filters }) {
  const opt = (value, label, current) => html`<option value="${value}" ${value === current ? html`selected` : ''}>${label}</option>`;
  const active = curationBySlug[filters.curation];
  return layout({
    title: active ? active.name : 'The Collection',
    path: '/discover',
    body: html`
    ${journey(2)}
    <section class="page-head wrap center">
      <p class="chapter-num">Chapter III · The Collection</p>
      <h1>${active ? active.name : 'The Collection'}</h1>
      <p class="lede">${active ? active.blurb : 'Every piece is presented with its story, and can be ordered, reserved for a private viewing or discussed with a specialist.'}</p>
    </section>
    <section class="wrap">
      <nav class="curation-links tabs" aria-label="Curations">
        <a class="${!filters.curation ? 'active' : ''}" href="/discover">All</a>
        ${curations.map((c) => html`<a class="${filters.curation === c.slug ? 'active' : ''}" href="/discover?curation=${c.slug}">${c.name}</a>`)}
      </nav>
      <form class="filters" method="get" action="/discover" data-autosubmit>
        ${filters.curation ? html`<input type="hidden" name="curation" value="${filters.curation}">` : ''}
        <label>Maison<select name="brand">${opt('', 'All maisons', filters.brand)}${brands.map((b) => opt(b.slug, b.name, filters.brand))}</select></label>
        <label>Origin<select name="country">${opt('', 'All origins', filters.country)}${countries.map((c) => opt(c, c, filters.country))}</select></label>
        <label>Availability<select name="availability">${opt('', 'Any', filters.availability)}${opt('available', 'Available to order', filters.availability)}</select></label>
        <noscript><button class="btn btn-dark btn-sm" type="submit">Apply</button></noscript>
        <span class="result-count">${watches.length} ${watches.length === 1 ? 'watch' : 'watches'}</span>
      </form>
      ${watches.length ? watchGrid(watches) : html`<div class="empty"><p>No watches match these filters yet.</p><a class="btn btn-outline" href="/discover">Clear filters</a></div>`}
    </section>`,
  });
}

export function watchPage({ watch: w, brand, related }) {
  const curation = curationBySlug[w.curation];
  const specs = [
    ['Collection', w.collection], ['Reference', w.reference], ['Case', w.case_material], ['Size', w.case_size],
    ['Movement', w.movement], ['Dial', w.dial], ['Strap', w.strap], ['Edition', w.edition],
  ].filter(([, v]) => v);
  const orderable = canOrder(w);
  return layout({
    title: `${brand.name} ${w.name}`,
    description: `${brand.name} ${w.name}. ${brand.tagline}`,
    path: '/discover',
    body: html`
    ${journey(2)}
    <nav class="crumbs wrap" aria-label="Breadcrumb"><a href="/maisons">The Maisons</a><span>/</span><a href="/maisons/${brand.slug}">${brand.name}</a><span>/</span><span aria-current="page">${w.name}</span></nav>
    <section class="product wrap">
      <div class="product-stage">${watchVisual({ ...w, brand_name: brand.name }, { eager: true })}</div>
      <div class="product-info">
        <a class="product-brand" href="/maisons/${brand.slug}">${brand.name}</a>
        <h1>${w.name}</h1>
        <p class="product-sub">${[w.collection, curation?.name].filter(Boolean).join(' · ')}</p>
        <p class="price">${priceLabel(w)}</p>
        <p class="availability ${w.availability}">${AVAILABILITY[w.availability] || ''}</p>
        <div class="product-actions">
          ${orderable ? html`<button class="btn btn-dark btn-block" type="button" data-add-to-bag
              data-bag-slug="${w.slug}" data-bag-name="${w.name}" data-bag-brand="${brand.name}" data-bag-price="${w.price_inr}"
              data-bag-image="${w.image_url}" data-bag-url="/watches/${w.slug}">Add to bag</button>`
          : html`<a class="btn btn-dark btn-block" href="/enquire?watch=${w.slug}">${w.availability === 'sold' ? 'Ask about similar pieces' : 'Enquire about this piece'}</a>`}
          ${w.availability !== 'sold' ? html`<a class="btn btn-outline btn-block" href="/appointment?watch=${w.slug}">Book a private viewing</a>` : ''}
          ${orderable ? html`<a class="text-link" href="/enquire?watch=${w.slug}">Speak to a LYNQ specialist</a>` : ''}
        </div>
        <ul class="product-assurance">
          <li>Authenticity guaranteed by Ethos</li>
          <li>Complimentary insured delivery</li>
          <li>After-sales by Ethos Care</li>
        </ul>
        <details class="accordion" open><summary>The piece</summary><div class="prose">${paragraphs(w.description)}</div></details>
        <details class="accordion"><summary>Specifications</summary>
          ${specs.length ? html`<dl class="specs">${specs.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>` : html`<p class="muted">Full specifications are available on request from our watch specialists.</p>`}
        </details>
        <details class="accordion"><summary>Delivery &amp; after-sales</summary>
          <p>Every order is confirmed personally by a LYNQ specialist, then delivered fully insured across India. After-sales care is provided by Ethos Care, Ethos’ dedicated service centre.</p>
        </details>
      </div>
    </section>
    <section class="brand-strip">
      <div class="wrap brand-strip-inner">
        <div><p class="eyebrow">The maison</p><h2>${brand.name}</h2><p class="lede">${brand.tagline}</p></div>
        <a class="btn btn-outline" href="/maisons/${brand.slug}">Discover ${brand.name}</a>
      </div>
    </section>
    ${related.length ? html`<section class="section wrap"><div class="section-head center"><p class="eyebrow">Also from ${brand.name}</p><h2>More from the maison</h2></div>${watchGrid(related)}</section>` : ''}`,
  });
}

export function brandsPage({ brands }) {
  return layout({
    title: 'The Maisons',
    path: '/maisons',
    body: html`
    ${journey(1)}
    <section class="page-head wrap center">
      <p class="chapter-num">Chapter II · The Maisons</p>
      <h1>The Maisons</h1>
      <p class="lede">Founder-led and independent brands with a strong vision, a distinctive design language and limited production, each chosen for its resonance with collectors.</p>
    </section>
    <section class="wrap maison-rows">
      ${brands.map((b, i) => html`<a class="maison-row ${i % 2 ? 'flip' : ''}" href="/maisons/${b.slug}">
        <div class="maison-row-art">${b.lead ? watchVisual({ ...b.lead, brand_name: b.name }) : ''}</div>
        <div class="maison-row-copy">
          <p class="eyebrow">${origin(b)}${b.founded ? ` · Est. ${b.founded}` : ''}</p>
          <h2>${b.name}</h2>
          <p class="lede">${b.tagline}</p>
          <span class="link-arrow">Discover the maison · ${b.watch_count} ${b.watch_count === 1 ? 'piece' : 'pieces'}</span>
        </div>
      </a>`)}
    </section>`,
  });
}

export function brandPage({ brand: b, watches }) {
  const collections = [];
  for (const w of watches) {
    let c = collections.find((x) => x.name === w.collection);
    if (!c) {
      c = { name: w.collection || 'The collection', intro: paragraphs(w.description)[0] || '', watches: [] };
      collections.push(c);
    }
    c.watches.push(w);
  }
  const hero = watches.find((w) => w.featured && w.image_url) || watches.find((w) => w.image_url) || watches[0];
  const facts = [['Origin', origin(b)], ['Founded', b.founded], ['Collections', String(collections.length)], ['Pieces at LYNQ', String(watches.length)]].filter(([, v]) => v);
  return layout({
    title: b.name,
    description: `${b.name}: ${b.tagline}`,
    path: '/maisons',
    body: html`
    ${journey(1)}
    <section class="maison-hero">
      <div class="wrap maison-hero-inner">
        <div class="maison-hero-copy">
          <p class="eyebrow light">The Maisons</p>
          <h1>${b.name}</h1>
          <p class="maison-tagline">${b.tagline}</p>
          <a class="btn btn-light" href="#portfolio">View the portfolio</a>
        </div>
        ${hero ? html`<div class="maison-hero-art">${watchVisual({ ...hero, brand_name: b.name }, { eager: true })}</div>` : ''}
      </div>
    </section>
    <section class="wrap maison-story">
      <div>
        <p class="eyebrow">The story</p>
        <div class="prose large dropcap">${paragraphs(b.story)}</div>
      </div>
      <aside>
        <dl class="facts">${facts.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
        ${lines(b.highlights).length ? html`<ul class="ticks">${lines(b.highlights).map((l) => html`<li>${l}</li>`)}</ul>` : ''}
        ${b.website ? html`<p><a class="text-link" href="${b.website}" target="_blank" rel="noopener">Official ${b.name} website ↗</a></p>` : ''}
      </aside>
    </section>
    <section class="wrap portfolio" id="portfolio">
      <div class="section-head center">
        <p class="eyebrow">The portfolio</p>
        <h2>${b.name} at LYNQ</h2>
        <nav class="curation-links" aria-label="Collections">${collections.map((c, i) => html`<a href="#collection-${i}">${c.name}</a>`)}</nav>
      </div>
      ${collections.map((c, i) => html`<div class="collection" id="collection-${i}">
        <div class="collection-head"><h3>${c.name}</h3>${c.intro}</div>
        ${watchGrid(c.watches)}
      </div>`)}
      ${watches.length ? '' : html`<p class="muted center">Pieces from ${b.name} are arriving soon. <a href="/enquire">Register your interest</a>.</p>`}
    </section>
    <section class="feature-image slim">
      <img src="/images/lynq/gallery-2.webp" alt="" aria-hidden="true">
      <div class="feature-card">
        <h2>Experience ${b.name} in person</h2>
        <p>Reserve a private viewing at the LYNQ Gallery, or let a specialist present the collection to you by video call.</p>
        <a class="btn btn-dark" href="/appointment?brand=${b.slug}">Book a private viewing</a>
      </div>
    </section>`,
  });
}

export function galleryPage({ locations }) {
  return layout({
    title: 'The LYNQ Gallery',
    path: '/gallery',
    body: html`
    ${pageHead('The LYNQ Gallery', 'A space designed for discovery, conversation and context', 'Moving away from traditional retail, each LYNQ Gallery is an immersive, design-led environment where collectors discover independent brands in context. Minimal display reflects limited production; storytelling and craft lead.')}
    <figure class="wrap page-figure"><img src="/images/lynq/gallery.webp" alt="Concept render of the LYNQ Gallery"><figcaption>Concept render of the first LYNQ Gallery</figcaption></figure>
    <section class="wrap gallery-points">
      <div><h3>10–12 maisons</h3><p>Each gallery features a tight circle of like-minded brands, so every one receives focused attention.</p></div>
      <div><h3>Collector-led</h3><p>Our specialists are trained by the founders themselves. Expect conversation, not a sales pitch.</p></div>
      <div><h3>By appointment</h3><p>Reserve time to handle pieces in private, or let us bring a specific watch in for you to view.</p></div>
      <div><h3>A cultural anchor</h3><p>Launches, previews and collector evenings make every gallery a meeting place for independent horology.</p></div>
    </section>
    <section class="wrap">
      <h2 class="section-title">Locations</h2>
      <div class="locations">
        ${locations.map((l) => html`<article class="location">
          <p class="eyebrow">${l.city}</p>
          <h3>${l.name}</h3>
          <p class="badge ${l.status}">${l.status_note || (l.status === 'open' ? 'Open' : 'Coming soon')}</p>
          ${l.description ? html`<p>${l.description}</p>` : ''}
          ${l.address ? html`<p class="muted">${l.address}</p>` : ''}
          ${l.hours ? html`<p class="muted small">${l.hours}</p>` : ''}
          ${l.phone ? html`<p class="small"><a href="tel:${l.phone.replace(/[^\d+]/g, '')}">${l.phone}</a></p>` : ''}
          <a class="btn btn-outline btn-sm" href="/appointment?location=${l.slug}">${l.status === 'open' ? 'Book a visit' : 'Register for opening'}</a>
        </article>`)}
        <article class="location virtual">
          <p class="eyebrow">Anywhere</p>
          <h3>Private video consultation</h3>
          <p>Can’t visit in person? A LYNQ specialist will walk you through any piece on a private video call.</p>
          <a class="btn btn-outline btn-sm" href="/appointment?location=virtual">Schedule a call</a>
        </article>
      </div>
    </section>`,
  });
}

export function eventsPage({ upcoming, past }) {
  return layout({
    title: 'Events',
    path: '/events',
    body: html`
    ${pageHead('Events & experiences', 'Collector evenings and private previews', 'Intimate gatherings designed for direct, meaningful engagement between independent brands, founders and India’s collector community.')}
    <section class="wrap">
      ${upcoming.length ? html`<div class="event-list">${upcoming.map((e) => html`<a class="event-row" href="/events/${e.slug}">
        <time datetime="${e.starts_at}"><span class="d">${new Date(e.starts_at).toLocaleDateString('en-IN', { day: 'numeric', timeZone: 'Asia/Kolkata' })}</span><span class="m">${new Date(e.starts_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</span></time>
        <div><h3>${e.title}</h3><p class="muted">${e.venue || e.location_name || ''}</p><p>${e.summary}</p></div>
        <span class="link-arrow">Details</span>
      </a>`)}</div>` : html`<div class="empty"><p>No upcoming events are announced just yet.</p><p class="muted">Join the LYNQ Circle and you will be the first to receive an invitation.</p></div>`}
      ${past.length ? html`<h2 class="section-title">Past events</h2><ul class="past-events">${past.map((e) => html`<li><span>${formatDate(e.starts_at)}</span> ${e.title}</li>`)}</ul>` : ''}
    </section>`,
  });
}

export function eventPage({ event: e, values = {}, error, spotsLeft }) {
  const isPast = new Date(e.starts_at) < new Date();
  const full = spotsLeft !== null && spotsLeft <= 0;
  return layout({
    title: e.title,
    description: e.summary,
    path: '/events',
    body: html`
    ${pageHead(formatDate(e.starts_at, true), e.title, e.summary)}
    <section class="wrap two-col">
      <div class="prose">
        ${e.venue || e.location_name ? html`<p><strong>Venue:</strong> ${e.venue || e.location_name}</p>` : ''}
        ${paragraphs(e.description)}
      </div>
      <div class="form-card" id="rsvp">
        ${isPast ? html`<h2>This event has taken place</h2><p class="muted">Join the LYNQ Circle to hear about the next one.</p>`
        : full ? html`<h2>This evening is fully booked</h2><p class="muted">Leave an enquiry and we will let you know if a place opens up.</p><a class="btn btn-outline" href="/enquire">Contact us</a>`
        : html`<h2>Reserve your place</h2>
          ${spotsLeft !== null && spotsLeft <= 10 ? html`<p class="muted small">Only ${spotsLeft} ${spotsLeft === 1 ? 'place' : 'places'} remaining.</p>` : ''}
          ${errorBox(error)}
          <form method="post" action="/events/${e.slug}/rsvp">
            ${contactFields(values)}
            ${field('Number of guests (including you)', html`<select name="guests">${[1, 2].map((n) => html`<option ${String(values.guests) === String(n) ? html`selected` : ''}>${n}</option>`)}</select>`)}
            ${field('Anything we should know? (optional)', html`<textarea name="message" rows="3" maxlength="1000">${values.message || ''}</textarea>`)}
            ${honeypot}
            <button class="btn btn-dark btn-block" type="submit">Request invitation</button>
            <p class="hint">Places are confirmed personally by the LYNQ team.</p>
          </form>`}
      </div>
    </section>`,
  });
}

export function aboutPage() {
  return layout({
    title: 'About',
    path: '/about',
    body: html`
    ${journey(0)}
    ${pageHead('Chapter I · Discover LYNQ', 'Connection in its most deliberate form')}
    <figure class="wrap page-figure"><img src="/images/lynq/wall.webp" alt="The LYNQ wall"><figcaption>Curated · Exceptional · Unconventional</figcaption></figure>
    <section class="wrap prose large about">
      <p>LYNQ signifies a link between Ethos and the world of independent watchmaking: a bridge between India’s evolving collector community and niche global brands that operate outside traditional luxury structures. Above all, it is a connection between creators and connoisseurs, where dialogue, trust and shared passion shape every interaction.</p>
      <p>Independent brands grow through storytelling, community and founder-led vision. LYNQ provides a dedicated environment where they can be discovered, understood and appreciated beyond transactional retail.</p>
      <p>The name expresses alignment rather than distribution. LYNQ is not simply a channel but a connector of ecosystems that naturally belong together, bringing institutional strength and independent creativity into long-term partnership.</p>
      <p>India’s watch collector community is growing and changing. Enthusiasts are moving beyond mainstream names toward brands that have a founder story, that experiment, that feel genuinely scarce. LYNQ is built for precisely this shift, at the moment the Indian collector is ready for it.</p>
      <blockquote>LYNQ exists to serve this difference with precision, partnership and long-term commitment.</blockquote>
      <p><a class="btn btn-dark" href="/maisons">Continue to the maisons</a></p>
    </section>
    <section class="wrap ethos-band">
      <div><p class="eyebrow">An initiative by Ethos</p><h2>Backed by India’s leading luxury watch retailer</h2></div>
      <p>Ethos has spent more than two decades bringing collectors closer to watchmaking, from its multi-brand boutiques and Haute Horology salons to Ethos Care, its dedicated after-sales service. In 2020 it became the first Indian retailer to embrace independent watchmaking brands. LYNQ builds on that foundation with authentic sourcing, specialist guidance and dependable after-sales support for every piece.</p>
    </section>`,
  });
}

export function partnerPage({ values = {}, error } = {}) {
  return layout({
    title: 'For independent brands',
    path: '/partner',
    body: html`
    ${pageHead('For independent brands', 'Build your brand in India, with focus rather than scale', 'LYNQ gives each partner brand dedicated visibility, storytelling and engagement within an ecosystem built specifically for independent watchmaking.')}
    <section class="wrap partner-grid">
      <div>
        <h2 class="section-title">Who we look for</h2>
        <ul class="ticks">
          <li>Founder-led or independent brands with a strong vision and identity</li>
          <li>A distinctive design language and storytelling-driven positioning</li>
          <li>Limited production with high collector relevance</li>
          <li>Strong resonance within global enthusiast communities</li>
        </ul>
        <h2 class="section-title">What partners receive</h2>
        <dl class="benefits">
          <div><dt>Market access</dt><dd>Entry into India with access to Ethos’ established, high-value client base.</dd></div>
          <div><dt>A curated ecosystem</dt><dd>Placement alongside like-minded brands on a focused, discovery-led platform.</dd></div>
          <div><dt>Operational backbone</dt><dd>End-to-end support across retail, logistics and after-sales.</dd></div>
          <div><dt>Brand building</dt><dd>Storytelling, events and direct engagement with collectors.</dd></div>
          <div><dt>Dedicated brand management</dt><dd>A named LYNQ team member for merchandising, launches and day-to-day coordination.</dd></div>
          <div><dt>Controlled growth</dt><dd>Scale selectively while keeping your identity and exclusivity intact.</dd></div>
        </dl>
      </div>
      <div class="form-card">
        <h2>Introduce your brand</h2>
        ${errorBox(error)}
        <form method="post" action="/partner">
          ${field('Brand name', input('company', values, html`type="text" required maxlength="120"`))}
          ${contactFields(values)}
          ${field('Tell us about your brand', html`<textarea name="message" rows="5" required maxlength="3000" placeholder="Founding story, collections, annual production, current markets…">${values.message || ''}</textarea>`)}
          ${honeypot}
          <button class="btn btn-dark btn-block" type="submit">Send introduction</button>
        </form>
      </div>
    </section>`,
  });
}

function watchSummary(w) {
  if (!w) return '';
  return html`<a class="watch-summary" href="/watches/${w.slug}"><div class="mini">${watchVisual(w)}</div><div><span class="eyebrow">${w.brand_name}</span><strong>${w.name}</strong><span class="muted small">${priceLabel(w)}</span></div></a>`;
}

export function enquirePage({ type, watch, values = {}, error }) {
  const isOrder = type === 'order';
  return layout({
    title: isOrder ? 'Order' : 'Enquire',
    path: '/enquire',
    body: html`
    ${pageHead(isOrder ? 'Order' : 'Enquiries', isOrder ? 'Reserve this piece' : 'How can we help?', isOrder
      ? 'Submit your details and a LYNQ specialist will contact you within one business day to confirm availability, complete payment securely and arrange delivery or collection.'
      : 'Questions about a watch, a maison or a commission? Our specialists reply personally, usually within one business day.')}
    <section class="wrap narrow">
      ${watchSummary(watch)}
      <div class="form-card">
        ${errorBox(error)}
        <form method="post" action="/enquire">
          <input type="hidden" name="type" value="${isOrder ? 'order' : 'enquiry'}">
          ${watch ? html`<input type="hidden" name="watch" value="${watch.slug}">` : ''}
          ${contactFields(values, { phoneRequired: isOrder })}
          ${field(isOrder ? 'Notes (optional)' : 'Your message', html`<textarea name="message" rows="5" maxlength="3000" ${isOrder ? '' : html`required`} placeholder="${isOrder ? 'Delivery preferences, strap size, gifting…' : ''}">${values.message || ''}</textarea>`)}
          ${honeypot}
          <button class="btn btn-dark btn-block" type="submit">${isOrder ? 'Submit order request' : 'Send enquiry'}</button>
          ${isOrder ? html`<p class="hint">No payment is taken online. Your order is confirmed once a specialist has spoken with you.</p>` : ''}
        </form>
      </div>
    </section>`,
  });
}

export function appointmentPage({ locations, watch, brand, values = {}, error }) {
  const today = new Date().toISOString().slice(0, 10);
  const slot = values.slot || '';
  return layout({
    title: 'Book an appointment',
    path: '/appointment',
    body: html`
    ${pageHead('Appointments', 'Book a private viewing', 'Spend unhurried time with the watches and the stories behind them, in the gallery or over a video call.')}
    <section class="wrap narrow">
      ${watchSummary(watch)}
      ${brand && !watch ? html`<p class="lede">You’d like to discover <strong>${brand.name}</strong>. We’ll prepare a selection for your visit.</p>` : ''}
      <div class="form-card">
        ${errorBox(error)}
        <form method="post" action="/appointment">
          ${watch ? html`<input type="hidden" name="watch" value="${watch.slug}">` : ''}
          ${brand ? html`<input type="hidden" name="brand" value="${brand.slug}">` : ''}
          ${field('Where would you like to meet?', html`<select name="location" required>
            ${locations.map((l) => html`<option value="${l.slug}" ${values.location === l.slug ? html`selected` : ''}>${l.name}${l.status === 'coming' ? ` (${l.status_note || 'coming soon'})` : ''}</option>`)}
            <option value="virtual" ${values.location === 'virtual' ? html`selected` : ''}>Private video consultation</option>
          </select>`)}
          <div class="field-row">
            ${field('Preferred date', input('preferred_date', values, html`type="date" min="${today}" required`))}
            ${field('Preferred time', html`<select name="slot">${['Morning', 'Afternoon', 'Evening'].map((s) => html`<option ${slot === s ? html`selected` : ''}>${s}</option>`)}</select>`)}
          </div>
          ${contactFields(values, { phoneRequired: true })}
          ${field('Anything you’d like to see? (optional)', html`<textarea name="message" rows="3" maxlength="2000">${values.message || ''}</textarea>`)}
          ${honeypot}
          <button class="btn btn-dark btn-block" type="submit">Request appointment</button>
          <p class="hint">We’ll confirm your appointment by phone or email.</p>
        </form>
      </div>
    </section>`,
  });
}

const THANKS = {
  order: ['Thank you for your order request', 'A LYNQ specialist will be in touch within one business day to confirm availability and complete your purchase.'],
  enquiry: ['Thank you for your enquiry', 'A LYNQ specialist will reply personally, usually within one business day.'],
  appointment: ['Your request has been received', 'We will contact you shortly to confirm the date and time of your appointment.'],
  event: ['Thank you for your RSVP', 'Places are confirmed personally. We will be in touch with your invitation.'],
  partner: ['Thank you for introducing your brand', 'Our brand team reviews every introduction and will respond if there is a fit.'],
  newsletter: ['Welcome to the LYNQ Circle', 'You will be the first to hear about new arrivals, previews and collector evenings.'],
};

export function thanksPage({ type, ref }) {
  const [title, text] = THANKS[type] || THANKS.enquiry;
  return layout({
    title: 'Thank you',
    body: html`<section class="wrap narrow thanks">
      ${logoMark('thanks-mark')}
      <h1>${title}</h1>
      <p class="lede">${text}</p>
      ${ref ? html`<p class="muted">Your reference: <strong>${ref}</strong></p>` : ''}
      <div class="btn-row center"><a class="btn btn-dark" href="/discover">Continue discovering</a><a class="btn btn-outline" href="/">Home</a></div>
    </section>`,
  });
}

export function notFoundPage() {
  return layout({
    title: 'Not found',
    body: html`<section class="wrap narrow thanks">
      <p class="eyebrow">404</p>
      <h1>This page has moved on</h1>
      <p class="lede">The page you were looking for doesn’t exist, or the piece is no longer listed.</p>
      <div class="btn-row center"><a class="btn btn-dark" href="/discover">Discover watches</a><a class="btn btn-outline" href="/">Home</a></div>
    </section>`,
  });
}

export { CURATIONS };

// ---------- Bag, checkout, confirmation ----------

export function bagPage() {
  return layout({
    title: 'Your bag',
    path: '/bag',
    body: html`
    ${journey(3)}
    <section class="page-head wrap center"><p class="chapter-num">Chapter IV · Your Order</p><h1>Your bag</h1></section>
    <section class="wrap checkout-grid">
      <div>
        <div class="empty" data-bag-empty><p>Your bag is empty.</p><a class="btn btn-outline" href="/discover">Explore the collection</a></div>
        <ul class="bag-list large" data-bag-list></ul>
      </div>
      <aside class="summary" data-bag-full hidden>
        <h2>Summary</h2>
        <div class="summary-row"><span>Subtotal</span><span data-bag-total>₹0</span></div>
        <div class="summary-row"><span>Insured delivery</span><span>Complimentary</span></div>
        <div class="summary-row total"><span>Total</span><strong data-bag-total>₹0</strong></div>
        <a class="btn btn-dark btn-block" href="/checkout">Proceed to checkout</a>
        <a class="text-link" href="/appointment">Prefer to see it first? Book a private viewing</a>
      </aside>
    </section>`,
  });
}

export function checkoutPage({ values = {}, error } = {}) {
  const v = values;
  const pay = v.payment || 'card';
  const radio = (value, label, note) => html`<label class="pay-option"><input type="radio" name="payment" value="${value}" ${pay === value ? html`checked` : ''}><span><strong>${label}</strong><small>${note}</small></span></label>`;
  return layout({
    title: 'Checkout',
    path: '/checkout',
    bodyClass: 'checkout',
    body: html`
    ${journey(3)}
    <section class="page-head wrap center"><p class="chapter-num">Chapter IV · Your Order</p><h1>Checkout</h1></section>
    <section class="wrap">
      <div class="empty" data-bag-empty><p>Your bag is empty.</p><a class="btn btn-outline" href="/discover">Explore the collection</a></div>
    </section>
    <form class="wrap checkout-grid" method="post" action="/checkout" data-checkout data-bag-full hidden>
      <div class="checkout-steps">
        ${errorBox(error)}
        <input type="hidden" name="items" value="">
        <fieldset class="step"><legend><span class="num">1</span>Contact</legend>${contactFields(v, { phoneRequired: true })}</fieldset>
        <fieldset class="step"><legend><span class="num">2</span>Delivery</legend>
          ${field('Address', input('address1', v, html`type="text" autocomplete="address-line1" required maxlength="200"`))}
          ${field('Apartment, building, landmark (optional)', input('address2', v, html`type="text" autocomplete="address-line2" maxlength="200"`))}
          <div class="field-row">
            ${field('State', input('state', v, html`type="text" autocomplete="address-level1" required maxlength="60"`))}
            ${field('PIN code', input('pincode', v, html`type="text" inputmode="numeric" pattern="[0-9]{6}" autocomplete="postal-code" required maxlength="6"`))}
          </div>
          <div data-pan hidden>${field('PAN', input('pan', v, html`type="text" maxlength="10" autocapitalize="characters"`), 'Required by Indian tax rules for purchases above ₹2,00,000.')}</div>
          ${field('Notes for your specialist (optional)', html`<textarea name="notes" rows="2" maxlength="1000" placeholder="Gift wrapping, strap size, preferred delivery time…">${v.notes || ''}</textarea>`)}
        </fieldset>
        <fieldset class="step"><legend><span class="num">3</span>Payment</legend>
          <div class="pay-options">
            ${radio('card', 'Credit or debit card', 'Visa, Mastercard, RuPay, Amex')}
            ${radio('upi', 'UPI', 'Google Pay, PhonePe, Paytm and others')}
            ${radio('netbanking', 'Net banking', 'All major Indian banks')}
            ${radio('emi', 'EMI', 'No-cost EMI on eligible cards')}
          </div>
          <div class="pay-panel" data-pay-panel="card" ${pay === 'card' ? '' : html`hidden`}>
            <div class="field-row">
              ${field('Card number', html`<input type="text" inputmode="numeric" autocomplete="off" placeholder="1234 5678 9012 3456">`)}
              ${field('Name on card', html`<input type="text" autocomplete="off">`)}
            </div>
            <div class="field-row">
              ${field('Expiry', html`<input type="text" autocomplete="off" placeholder="MM / YY">`)}
              ${field('CVV', html`<input type="password" autocomplete="off" placeholder="•••">`)}
            </div>
          </div>
          <div class="pay-panel" data-pay-panel="upi" ${pay === 'upi' ? '' : html`hidden`}>${field('UPI ID', html`<input type="text" autocomplete="off" placeholder="yourname@bank">`)}</div>
          <div class="pay-panel" data-pay-panel="netbanking" ${pay === 'netbanking' ? '' : html`hidden`}><p class="hint">You will be taken to your bank’s secure page to complete payment.</p></div>
          <div class="pay-panel" data-pay-panel="emi" ${pay === 'emi' ? '' : html`hidden`}><p class="hint">Choose your card and EMI tenure on the next secure screen.</p></div>
          <p class="secure-note">Payments are processed securely by our payment partner. Card details are never stored by LYNQ.</p>
        </fieldset>
        ${honeypot}
      </div>
      <aside class="summary">
        <h2>Your order</h2>
        <ul class="bag-list compact" data-bag-list="static"></ul>
        <div class="summary-row"><span>Subtotal</span><span data-bag-total>₹0</span></div>
        <div class="summary-row"><span>Insured delivery</span><span>Complimentary</span></div>
        <div class="summary-row total"><span>Total</span><strong data-bag-total>₹0</strong></div>
        <button class="btn btn-dark btn-block" type="submit">Place order</button>
        <p class="hint">A LYNQ specialist will call to confirm your order before dispatch.</p>
      </aside>
    </form>`,
  });
}

export function orderConfirmedPage({ ref } = {}) {
  return layout({
    title: 'Order confirmed',
    path: '/checkout',
    body: html`
    <section class="wrap narrow thanks" data-order-confirmed>
      ${logoMark('thanks-mark')}
      <p class="chapter-num">Thank you</p>
      <h1>Your order is confirmed</h1>
      <p class="lede">A LYNQ specialist will call you shortly to confirm the details and arrange insured delivery.</p>
      ${ref ? html`<p class="muted">Order reference: <strong>${ref}</strong></p>` : ''}
      <div class="order-recap" data-order-has-items hidden>
        <ul class="bag-list compact" data-order-list></ul>
        <div class="summary-row total"><span>Total</span><strong data-order-total></strong></div>
      </div>
      <div class="btn-row center"><a class="btn btn-dark" href="/maisons">Continue discovering</a><a class="btn btn-outline" href="/appointment">Book a private viewing</a></div>
    </section>`,
  });
}
