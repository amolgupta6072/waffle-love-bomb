import { html, formatInr, formatDate } from '../html.js';
import { REQUEST_TYPES, REQUEST_STATUSES, AVAILABILITY, LOCATION_STATUSES, requestRef } from '../catalog.js';
import { formValue } from '../resources.js';
import { watchArt } from '../watch-art.js';
import { logoMark } from './layout.js';

const NAV = [
  ['/admin', 'Inbox'],
  ['/admin/watches', 'Watches'],
  ['/admin/brands', 'Maisons'],
  ['/admin/events', 'Events'],
  ['/admin/locations', 'Locations'],
];

export function adminLayout({ title, admin, path = '/admin', body, flash }) {
  return html`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${title} | LYNQ Admin</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/css/admin.css">
</head>
<body>
  ${admin ? html`<header class="admin-bar">
    <a class="admin-brand" href="/admin">${logoMark()}<span>LYNQ</span><small>Admin</small></a>
    <nav>${NAV.map(([href, label]) => html`<a href="${href}" ${(href === '/admin' ? path === '/admin' || path.startsWith('/admin/requests') : path.startsWith(href)) ? html`aria-current="page"` : ''}>${label}</a>`)}</nav>
    <div class="admin-user">
      <a href="/" target="_blank" rel="noopener">View site ↗</a>
      <form method="post" action="/admin/logout"><input type="hidden" name="_csrf" value="${admin.csrf}"><button type="submit">Sign out</button></form>
    </div>
  </header>` : ''}
  <main class="admin-main">
    ${flash ? html`<div class="flash">${flash}</div>` : ''}
    ${body}
  </main>
  <script src="/js/admin.js" defer></script>
</body>
</html>`;
}

export function loginPage({ error, email = '' } = {}) {
  return adminLayout({
    title: 'Sign in',
    body: html`<div class="login">
      <div class="login-brand">${logoMark()}<span>LYNQ</span></div>
      <h1>Team sign in</h1>
      ${error ? html`<p class="error">${error}</p>` : ''}
      <form method="post" action="/admin/login">
        <label>Email<input type="email" name="email" value="${email}" autocomplete="username" required autofocus></label>
        <label>Password<input type="password" name="password" autocomplete="current-password" required></label>
        <button class="btn" type="submit">Sign in</button>
      </form>
    </div>`,
  });
}

const PLURALS = { order: 'Orders', enquiry: 'Enquiries', appointment: 'Appointments', event: 'Event RSVPs', partner: 'Brand introductions', newsletter: 'Circle sign-ups' };

const statusPill = (s) => html`<span class="pill s-${s}">${REQUEST_STATUSES[s] || s}</span>`;

export function inboxPage({ admin, requests, counts, filters, flash }) {
  const link = (params) => {
    const q = new URLSearchParams({ ...filters, ...params });
    [...q.keys()].forEach((k) => { if (!q.get(k)) q.delete(k); });
    const s = q.toString();
    return s ? `/admin?${s}` : '/admin';
  };
  const exportHref = `/admin/requests.csv${filters.type ? `?type=${filters.type}` : ''}`;
  return adminLayout({
    title: 'Inbox',
    admin,
    path: '/admin',
    flash,
    body: html`
    <div class="page-top"><h1>Inbox</h1><a class="btn btn-ghost" href="${exportHref}">Export CSV</a></div>
    <div class="stat-row">
      ${Object.entries(REQUEST_TYPES).map(([type, label]) => html`<a class="stat ${filters.type === type ? 'active' : ''}" href="${link({ type: filters.type === type ? '' : type })}">
        <span class="label">${PLURALS[type] || label}</span><span class="value">${counts[type]?.open || 0}</span><span class="sub">${counts[type]?.total || 0} total</span>
      </a>`)}
    </div>
    <div class="tabs">
      ${[['open', 'Open'], ['new', 'New'], ['in_progress', 'In progress'], ['closed', 'Closed'], ['all', 'All']].map(([s, l]) => html`<a class="${filters.status === s ? 'active' : ''}" href="${link({ status: s })}">${l}</a>`)}
    </div>
    ${requests.length ? html`<table class="table">
      <thead><tr><th>Ref</th><th>Type</th><th>From</th><th>About</th><th>Received</th><th>Status</th></tr></thead>
      <tbody>${requests.map((r) => html`<tr class="clickable" data-href="/admin/requests/${r.id}">
        <td><a href="/admin/requests/${r.id}">${requestRef(r.id)}</a></td>
        <td><span class="type t-${r.type}">${REQUEST_TYPES[r.type] || r.type}</span></td>
        <td><strong>${r.name || r.email}</strong><br><span class="muted">${r.name ? r.email : ''}</span></td>
        <td>${r.watch_label || r.event_title || r.company || (r.location_name ? r.location_name : '')}${r.preferred_date ? html`<br><span class="muted">${formatDate(r.preferred_date)}</span>` : ''}</td>
        <td class="muted nowrap">${formatDate(`${r.created_at.replace(' ', 'T')}Z`, true)}</td>
        <td>${statusPill(r.status)}</td>
      </tr>`)}</tbody>
    </table>` : html`<p class="empty">Nothing here.</p>`}`,
  });
}

export function requestPage({ admin, request: r, flash }) {
  const rows = [
    ['Type', REQUEST_TYPES[r.type] || r.type],
    ['Name', r.name], ['Email', r.email ? html`<a href="mailto:${r.email}">${r.email}</a>` : ''],
    ['Phone', r.phone ? html`<a href="tel:${r.phone.replace(/[^\d+]/g, '')}">${r.phone}</a>` : ''],
    ['City', r.city], ['Brand', r.company],
    ['Watch', r.watch_slug ? html`<a href="/watches/${r.watch_slug}" target="_blank" rel="noopener">${r.watch_label}</a>${r.watch_price ? ` · ${formatInr(r.watch_price)}` : ''}` : ''],
    ['Event', r.event_title], ['Guests', r.guests],
    ['Location', r.location_name || (r.type === 'appointment' && !r.location_id ? 'Video consultation' : '')],
    ['Preferred date', r.preferred_date ? formatDate(r.preferred_date) : ''],
    ['Received', formatDate(`${r.created_at.replace(' ', 'T')}Z`, true)],
  ].filter(([, val]) => val !== '' && val !== null && val !== undefined);
  return adminLayout({
    title: requestRef(r.id),
    admin,
    path: '/admin/requests',
    flash,
    body: html`
    <p class="crumbs"><a href="/admin">Inbox</a> / ${requestRef(r.id)}</p>
    <div class="page-top"><h1>${requestRef(r.id)} ${statusPill(r.status)}</h1></div>
    <div class="detail-grid">
      <section class="card">
        <dl class="kv">${rows.map(([k, val]) => html`<dt>${k}</dt><dd>${val}</dd>`)}</dl>
        ${r.message ? html`<h2>Message</h2><p class="message">${r.message}</p>` : ''}
      </section>
      <section class="card">
        <h2>Handling</h2>
        <form method="post" action="/admin/requests/${r.id}">
          <input type="hidden" name="_csrf" value="${admin.csrf}">
          <label>Status<select name="status">${Object.entries(REQUEST_STATUSES).map(([v, l]) => html`<option value="${v}" ${r.status === v ? html`selected` : ''}>${l}</option>`)}</select></label>
          <label>Internal notes<textarea name="note" rows="6" placeholder="Call notes, follow-ups, payment status…">${r.note}</textarea></label>
          <button class="btn" type="submit">Save</button>
        </form>
        <form method="post" action="/admin/requests/${r.id}/delete" data-confirm="Delete this request permanently?">
          <input type="hidden" name="_csrf" value="${admin.csrf}">
          <button class="btn btn-danger btn-sm" type="submit">Delete</button>
        </form>
      </section>
    </div>`,
  });
}

function cell(name, row) {
  const val = row[name];
  switch (name) {
    case 'published': return val ? html`<span class="pill s-closed">Live</span>` : html`<span class="pill s-new">Hidden</span>`;
    case 'price_inr': return val ? formatInr(val) : html`<span class="muted">On request</span>`;
    case 'availability': return AVAILABILITY[val] || val;
    case 'status': return LOCATION_STATUSES[val] || val;
    case 'starts_at': return formatDate(val, true);
    default: return val ?? '';
  }
}

const COLUMN_LABELS = {
  name: 'Name', title: 'Title', brand_name: 'Maison', price_inr: 'Price', availability: 'Availability', published: 'Visibility',
  country: 'Country', watch_count: 'Watches', city: 'City', status: 'Status', starts_at: 'Date', rsvps: 'Guests',
};

export function listPage({ admin, key, resource, rows, flash }) {
  return adminLayout({
    title: resource.title,
    admin,
    path: `/admin/${key}`,
    flash,
    body: html`
    <div class="page-top"><h1>${resource.title}</h1><a class="btn" href="/admin/${key}/new">Add ${resource.singular}</a></div>
    ${rows.length ? html`<table class="table">
      <thead><tr>${key === 'watches' ? html`<th></th>` : ''}${resource.columns.map((c) => html`<th>${COLUMN_LABELS[c] || c}</th>`)}</tr></thead>
      <tbody>${rows.map((row) => html`<tr class="clickable" data-href="/admin/${key}/${row.id}">
        ${key === 'watches' ? html`<td class="thumb">${row.image_url ? html`<img src="${row.image_url}" alt="">` : watchArt(row)}</td>` : ''}
        ${resource.columns.map((c, i) => html`<td>${i === 0 ? html`<a href="/admin/${key}/${row.id}">${cell(c, row)}</a>` : cell(c, row)}</td>`)}
      </tr>`)}</tbody>
    </table>` : html`<p class="empty">No ${resource.title.toLowerCase()} yet.</p>`}`,
  });
}

function fieldInput(field, value, db) {
  const common = html`name="${field.name}" id="f-${field.name}"`;
  switch (field.type) {
    case 'textarea': return html`<textarea ${common} rows="${field.rows || 4}" maxlength="${field.max || 3000}" ${field.required ? html`required` : ''}>${value}</textarea>`;
    case 'checkbox': return html`<input type="checkbox" ${common} value="1" ${value ? html`checked` : ''}>`;
    case 'select': return html`<select ${common} ${field.required ? html`required` : ''}>${field.options(db).map((o) => html`<option value="${o.value}" ${String(o.value) === String(value) ? html`selected` : ''}>${o.label}</option>`)}</select>`;
    case 'int': return html`<input type="text" inputmode="numeric" ${common} value="${value}" placeholder="${field.placeholder || ''}">`;
    case 'color': return html`<span class="color-pair"><input type="color" data-mirror="f-${field.name}" value="${value || '#222222'}" aria-label="${field.label} picker"><input type="text" ${common} value="${value}" maxlength="7" placeholder="#rrggbb"></span>`;
    case 'datetime': return html`<input type="datetime-local" ${common} value="${value}" ${field.required ? html`required` : ''}>`;
    default: return html`<input type="text" ${common} value="${value}" placeholder="${field.placeholder || ''}" ${field.required ? html`required` : ''}>`;
  }
}

export function editPage({ admin, key, resource, row, values, error, db, flash }) {
  const isNew = !row;
  const src = values || row || {};
  return adminLayout({
    title: isNew ? `New ${resource.singular}` : row[resource.titleField],
    admin,
    path: `/admin/${key}`,
    flash,
    body: html`
    <p class="crumbs"><a href="/admin/${key}">${resource.title}</a> / ${isNew ? 'New' : row[resource.titleField]}</p>
    <div class="page-top">
      <h1>${isNew ? `New ${resource.singular}` : row[resource.titleField]}</h1>
      ${!isNew && row.published ? html`<a class="btn btn-ghost" href="${resource.publicPath(row)}" target="_blank" rel="noopener">View on site ↗</a>` : ''}
    </div>
    ${error ? html`<p class="error">${error}</p>` : ''}
    <div class="${key === 'watches' ? 'edit-with-preview' : ''}">
      <form class="card edit-form" method="post" action="/admin/${key}/${isNew ? 'new' : row.id}">
        <input type="hidden" name="_csrf" value="${admin.csrf}">
        ${resource.fields.map((f) => (f.group ? html`<h2 class="group">${f.group}</h2>` : html`<div class="frow ${f.type === 'checkbox' ? 'check' : ''}">
          <label for="f-${f.name}">${f.label}${f.required ? html` <span class="req">*</span>` : ''}</label>
          ${fieldInput(f, values ? (values[f.name] ?? '') : formValue(f, row), db)}
          ${f.hint ? html`<p class="hint">${f.hint}</p>` : ''}
        </div>`))}
        <div class="form-actions"><button class="btn" type="submit">${isNew ? 'Create' : 'Save changes'}</button><a class="btn btn-ghost" href="/admin/${key}">Cancel</a></div>
      </form>
      ${key === 'watches' ? html`<aside class="card preview-card"><h2>Illustration preview</h2><div class="art-preview" data-art-preview>${watchArt(src)}</div><p class="hint">Updates when you save. Uploaded product photography replaces the illustration on the site.</p></aside>` : ''}
    </div>
    ${!isNew ? html`<form class="danger-zone" method="post" action="/admin/${key}/${row.id}/delete" data-confirm="Delete this ${resource.singular} permanently?">
      <input type="hidden" name="_csrf" value="${admin.csrf}">
      <button class="btn btn-danger btn-sm" type="submit">Delete ${resource.singular}</button>
    </form>` : ''}`,
  });
}
