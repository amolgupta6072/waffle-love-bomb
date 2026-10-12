import { html, paragraphs, lines, formatInr, formatDate } from '../html.js';
import { watchArt } from '../watch-art.js';
import { CURATIONS, curationBySlug, AVAILABILITY } from '../catalog.js';
import { layout, logoMark } from './layout.js';

// ---------- Shared pieces ----------

export function watchVisual(w) {
  if (w.image_url) return html`<img class="watch-img" src="${w.image_url}" alt="${w.brand_name} ${w.name}" loading="lazy">`;
  return watchArt({ ...w, name: `${w.brand_name} ${w.name}` });
}

const priceLabel = (w) => (w.price_inr ? formatInr(w.price_inr) : 'Price on request');

function watchCard(w) {
  return html`<a class="watch-card" href="/watches/${w.slug}" data-brand="${w.brand_slug || ''}" data-country="${w.brand_country || ''}" data-availability="${w.availability}">
    <div class="watch-stage">${watchVisual(w)}</div>
    <div class="watch-meta">
      <span class="eyebrow">${w.brand_name}</span>
      <h3>${w.name}</h3>
      <span class="muted small">${w.availability === 'sold' ? 'Sold out' : priceLabel(w)}</span>
    </div>
  </a>`;
}

export const watchGrid = (watches) => html`<div class="watch-grid">${watches.map(watchCard)}</div>`;

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
      ${field('City', input('city', v, html`type="text" autocomplete="address-level2" maxlength="80"`))}
    </div>`;
}

function pageHead(eyebrow, title, intro = '') {
  return html`<section class="page-head wrap">
    <p class="eyebrow">${eyebrow}</p>
    <h1>${title}</h1>
    ${intro ? html`<p class="lede">${intro}</p>` : ''}
  </section>`;
}

// ---------- Pages ----------

export function homePage({ featured, brands, curations, nextEvent, location }) {
  return layout({
    path: '/',
    bodyClass: 'home',
    body: html`
    <section class="hero">
      <div class="hero-silk" aria-hidden="true"></div>
      <div class="wrap hero-inner">
        <p class="eyebrow light">An initiative by Ethos</p>
        <h1 class="hero-title">${logoMark('hero-mark')}<span>LYNQ</span></h1>
        <p class="hero-sub">A dedicated platform for independent watchmaking.</p>
        <p class="hero-tag">Curated. Exceptional. Unconventional.</p>
        <div class="hero-cta">
          <a class="btn btn-light" href="/discover">Discover the collection</a>
          <a class="btn btn-ghost-light" href="/appointment">Book a private viewing</a>
        </div>
      </div>
    </section>

    <section class="manifesto wrap">
      <p class="eyebrow">Why LYNQ</p>
      <p class="statement">As collectors move toward independent, design-led and founder-driven watchmaking, LYNQ is a home built around <em>discovery</em>, <em>storytelling</em> and <em>community</em>.</p>
      <div class="pillars">
        <div><span class="num">01</span><h3>Independence preserved</h3><p>Founder-led maisons presented alongside like-minded peers, never diluted in a crowded showroom.</p></div>
        <div><span class="num">02</span><h3>Storytelling leads</h3><p>The vision, philosophy and craft behind every brand, so you understand a watch before you wear it.</p></div>
        <div><span class="num">03</span><h3>Community over scale</h3><p>Private previews, collector evenings and direct conversations with the people who make the watches.</p></div>
      </div>
    </section>

    <section class="section wrap">
      <div class="section-head">
        <div><p class="eyebrow">Selected pieces</p><h2>From the maisons</h2></div>
        <a class="link-arrow" href="/discover">View all watches</a>
      </div>
      ${watchGrid(featured)}
    </section>

    <section class="curations-band">
      <div class="wrap">
        <div class="section-head"><div><p class="eyebrow light">Ways to discover</p><h2>The curations</h2></div></div>
        <div class="curation-grid">
          ${curations.map((c) => html`<a class="curation" href="/discover?curation=${c.slug}">
            <h3>${c.name}</h3><p>${c.blurb}</p><span class="count">${c.count} ${c.count === 1 ? 'piece' : 'pieces'}</span>
          </a>`)}
        </div>
      </div>
    </section>

    <section class="section wrap">
      <div class="section-head">
        <div><p class="eyebrow">The portfolio</p><h2>The maisons</h2></div>
        <a class="link-arrow" href="/maisons">Meet every maison</a>
      </div>
      <ul class="maison-list">
        ${brands.map((b) => html`<li><a href="/maisons/${b.slug}"><span class="maison-name">${b.name}</span><span class="maison-origin">${[b.city, b.country].filter(Boolean).join(', ')}</span></a></li>`)}
      </ul>
    </section>

    <section class="split wrap">
      <div class="split-copy">
        <p class="eyebrow">The LYNQ Gallery</p>
        <h2>A space for discovery, conversation and context</h2>
        <p>A gallery-led home for independent watchmaking. Each LYNQ Gallery brings together a small circle of like-minded brands, with minimal display that reflects limited production and puts storytelling and craft first.</p>
        ${location ? html`<p class="status-line"><strong>${location.name}</strong> · ${location.status_note || (location.status === 'open' ? 'Now open' : 'Coming soon')}</p>` : ''}
        <div class="btn-row"><a class="btn btn-dark" href="/gallery">Visit the gallery</a><a class="btn btn-outline" href="/appointment">Request an appointment</a></div>
      </div>
      <div class="split-visual gallery-visual" aria-hidden="true">
        <div class="vitrine">${featured.slice(0, 3).map((w) => html`<div class="vitrine-cell">${watchVisual(w)}</div>`)}</div>
        <p class="wall-text">Curated · Intimate · Independent</p>
      </div>
    </section>

    ${nextEvent ? html`<section class="section wrap">
      <div class="event-feature">
        <div><p class="eyebrow">Next collector evening</p><h2>${nextEvent.title}</h2><p class="muted">${formatDate(nextEvent.starts_at, true)}${nextEvent.venue ? ` · ${nextEvent.venue}` : ''}</p><p>${nextEvent.summary}</p></div>
        <a class="btn btn-dark" href="/events/${nextEvent.slug}">Reserve your place</a>
      </div>
    </section>` : ''}

    <section class="circle-band">
      <div class="wrap circle-inner">
        <div><p class="eyebrow light">The LYNQ Circle</p><h2>Be first to know</h2><p>New arrivals, private previews and invitations to collector evenings, shared sparingly.</p></div>
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
    title: active ? active.name : 'Discover',
    path: '/discover',
    body: html`
    ${pageHead('Discover', active ? active.name : 'The collection', active ? active.blurb : 'Explore independent watches by maison, origin or curation. Every piece is presented with its story, and can be enquired after, ordered or viewed in person.')}
    <section class="wrap">
      <div class="chips" role="list">
        <a role="listitem" class="chip ${!filters.curation ? 'active' : ''}" href="/discover">All</a>
        ${curations.map((c) => html`<a role="listitem" class="chip ${filters.curation === c.slug ? 'active' : ''}" href="/discover?curation=${c.slug}">${c.name}</a>`)}
      </div>
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
  const canOrder = w.availability === 'available' && w.price_inr;
  return layout({
    title: `${brand.name} ${w.name}`,
    description: `${brand.name} ${w.name}. ${brand.tagline}`,
    path: '/discover',
    body: html`
    <nav class="crumbs wrap" aria-label="Breadcrumb"><a href="/discover">Discover</a><span>/</span><a href="/maisons/${brand.slug}">${brand.name}</a><span>/</span><span aria-current="page">${w.name}</span></nav>
    <section class="product wrap">
      <div class="product-stage">${watchVisual({ ...w, brand_name: brand.name })}</div>
      <div class="product-info">
        <a class="eyebrow" href="/maisons/${brand.slug}">${brand.name}</a>
        <h1>${w.name}</h1>
        ${curation ? html`<a class="tag" href="/discover?curation=${curation.slug}">${curation.name}</a>` : ''}
        <p class="price">${priceLabel(w)}</p>
        <p class="availability ${w.availability}">${AVAILABILITY[w.availability] || ''}</p>
        <div class="prose">${paragraphs(w.description)}</div>
        <div class="product-actions">
          ${canOrder ? html`<a class="btn btn-dark" href="/enquire?type=order&watch=${w.slug}">Order this piece</a>` : ''}
          ${w.availability !== 'sold' ? html`<a class="btn ${canOrder ? 'btn-outline' : 'btn-dark'}" href="/appointment?watch=${w.slug}">Request an appointment</a>` : ''}
          <a class="btn btn-outline" href="/enquire?watch=${w.slug}">${w.availability === 'sold' ? 'Ask about similar pieces' : 'Enquire'}</a>
        </div>
        ${specs.length ? html`<dl class="specs">${specs.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>` : html`<p class="muted small">Full specifications are available on request from our watch specialists.</p>`}
      </div>
    </section>
    <section class="brand-strip wrap">
      <div><p class="eyebrow">The maison</p><h2>${brand.name}</h2><p class="lede">${brand.tagline}</p></div>
      <a class="link-arrow" href="/maisons/${brand.slug}">Read the story</a>
    </section>
    ${related.length ? html`<section class="section wrap"><div class="section-head"><div><p class="eyebrow">Also from ${brand.name}</p><h2>More from the maison</h2></div></div>${watchGrid(related)}</section>` : ''}`,
  });
}

export function brandsPage({ brands }) {
  return layout({
    title: 'The Maisons',
    path: '/maisons',
    body: html`
    ${pageHead('The portfolio', 'The maisons', 'Founder-led and independent brands with a strong vision, distinctive design language and limited production, each chosen for its resonance with collectors.')}
    <section class="wrap brand-cards">
      ${brands.map((b) => html`<a class="brand-card" href="/maisons/${b.slug}">
        <div class="brand-card-art">${b.lead ? watchVisual({ ...b.lead, brand_name: b.name }) : ''}</div>
        <div class="brand-card-copy">
          <p class="eyebrow">${[b.city, b.country].filter(Boolean).join(', ')}${b.founded ? ` · Est. ${b.founded}` : ''}</p>
          <h2>${b.name}</h2>
          <p>${b.tagline}</p>
          <span class="link-arrow">${b.watch_count} ${b.watch_count === 1 ? 'watch' : 'watches'}</span>
        </div>
      </a>`)}
    </section>`,
  });
}

export function brandPage({ brand: b, watches }) {
  const collections = [...new Set(watches.map((w) => w.collection).filter(Boolean))];
  return layout({
    title: b.name,
    description: `${b.name}: ${b.tagline}`,
    path: '/maisons',
    body: html`
    <section class="brand-hero">
      <div class="wrap brand-hero-inner">
        <div>
          <p class="eyebrow light">${[b.city, b.country].filter(Boolean).join(', ')}${b.founded ? ` · Est. ${b.founded}` : ''}</p>
          <h1>${b.name}</h1>
          <p class="lede">${b.tagline}</p>
        </div>
        ${watches[0] ? html`<div class="brand-hero-art">${watchVisual(watches[0])}</div>` : ''}
      </div>
    </section>
    <section class="wrap brand-story">
      <div class="prose large">${paragraphs(b.story)}</div>
      <aside>
        ${lines(b.highlights).length ? html`<h2 class="eyebrow">At a glance</h2><ul class="ticks">${lines(b.highlights).map((l) => html`<li>${l}</li>`)}</ul>` : ''}
        ${collections.length ? html`<h2 class="eyebrow">Collections</h2><p>${collections.join(' · ')}</p>` : ''}
        ${b.website ? html`<p><a class="link-arrow" href="${b.website}" target="_blank" rel="noopener">Official website</a></p>` : ''}
        <a class="btn btn-dark" href="/appointment?brand=${b.slug}">Discover ${b.name} in person</a>
      </aside>
    </section>
    <section class="section wrap">
      <div class="section-head"><div><p class="eyebrow">The collection</p><h2>${b.name} at LYNQ</h2></div></div>
      ${watches.length ? watchGrid(watches) : html`<p class="muted">Pieces from ${b.name} are arriving soon. <a href="/enquire">Register your interest</a>.</p>`}
    </section>`,
  });
}

export function galleryPage({ locations }) {
  return layout({
    title: 'The LYNQ Gallery',
    path: '/gallery',
    body: html`
    ${pageHead('The LYNQ Gallery', 'A space designed for discovery, conversation and context', 'Moving away from traditional retail, each LYNQ Gallery is an immersive, design-led environment where collectors discover independent brands in context. Minimal display reflects limited production; storytelling and craft lead.')}
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
    ${pageHead('About LYNQ', 'Connection in its most deliberate form')}
    <section class="wrap prose large about">
      <p>LYNQ signifies a link between Ethos and the world of independent watchmaking: a bridge between India’s evolving collector community and niche global brands that operate outside traditional luxury structures. Above all, it is a connection between creators and connoisseurs, where dialogue, trust and shared passion shape every interaction.</p>
      <p>Independent brands grow through storytelling, community and founder-led vision. LYNQ provides a dedicated environment where they can be discovered, understood and appreciated beyond transactional retail.</p>
      <p>The name expresses alignment rather than distribution. LYNQ is not simply a channel but a connector of ecosystems that naturally belong together, bringing institutional strength and independent creativity into long-term partnership.</p>
      <p>India’s watch collector community is growing and changing. Enthusiasts are moving beyond mainstream names toward brands that have a founder story, that experiment, that feel genuinely scarce. LYNQ is built for precisely this shift, at the moment the Indian collector is ready for it.</p>
      <blockquote>LYNQ exists to serve this difference with precision, partnership and long-term commitment.</blockquote>
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
