// Field definitions for the admin's editable content. Each resource gets a
// generic list / create / edit / delete UI driven by these definitions.

import * as v from './validate.js';
import { CURATIONS, AVAILABILITY, LOCATION_STATUSES } from './catalog.js';
import { ART_SHAPES, ART_STYLES, ART_CASES } from './watch-art.js';
import { slugify } from './seed.js';

const opts = (obj) => Object.entries(obj).map(([value, label]) => ({ value, label }));
const plain = (list) => list.map((x) => ({ value: x, label: x }));

export const RESOURCES = {
  watches: {
    table: 'watches',
    singular: 'watch',
    title: 'Watches',
    titleField: 'name',
    order: 'brand_id, position, id',
    fields: [
      { name: 'brand_id', label: 'Maison', type: 'select', required: true, options: (db) => db.prepare('SELECT id AS value, name AS label FROM brands ORDER BY position, name').all() },
      { name: 'name', label: 'Model name', type: 'text', required: true },
      { name: 'slug', label: 'URL slug', type: 'slug', hint: 'Leave blank to generate from the maison and model name.' },
      { name: 'collection', label: 'Collection', type: 'text' },
      { name: 'reference', label: 'Reference', type: 'text' },
      { name: 'curation', label: 'Curation', type: 'select', options: () => [{ value: '', label: 'None' }, ...CURATIONS.map((c) => ({ value: c.slug, label: c.name }))] },
      { name: 'description', label: 'Description', type: 'textarea', max: 5000, hint: 'Separate paragraphs with a blank line.' },
      { group: 'Specifications' },
      { name: 'case_material', label: 'Case', type: 'text' },
      { name: 'case_size', label: 'Case size', type: 'text', placeholder: 'e.g. 38 mm' },
      { name: 'movement', label: 'Movement', type: 'text' },
      { name: 'dial', label: 'Dial', type: 'text' },
      { name: 'strap', label: 'Strap / bracelet', type: 'text' },
      { name: 'edition', label: 'Edition', type: 'text', placeholder: 'e.g. Limited to 99 pieces' },
      { group: 'Sales' },
      { name: 'price_inr', label: 'Price (INR)', type: 'int', hint: 'Leave blank to show “Price on request”.' },
      { name: 'availability', label: 'Availability', type: 'select', required: true, options: () => opts(AVAILABILITY), hint: '“Available to order” plus a price enables online order requests.' },
      { name: 'featured', label: 'Feature on the home page', type: 'checkbox' },
      { name: 'published', label: 'Published', type: 'checkbox', default: 1 },
      { name: 'position', label: 'Sort order', type: 'int' },
      { group: 'Imagery' },
      { name: 'image_url', label: 'Product image URL', type: 'url', hint: 'Optional. Without an image, an illustration is drawn from the settings below.' },
      { name: 'art_shape', label: 'Illustration: case shape', type: 'select', options: () => plain(ART_SHAPES) },
      { name: 'art_style', label: 'Illustration: dial layout', type: 'select', options: () => plain(ART_STYLES) },
      { name: 'art_case', label: 'Illustration: case metal', type: 'select', options: () => plain(ART_CASES) },
      { name: 'art_dial', label: 'Illustration: dial colour', type: 'color' },
      { name: 'art_strap', label: 'Illustration: strap colour', type: 'color' },
    ],
    columns: ['name', 'brand_name', 'price_inr', 'availability', 'published'],
    listQuery: 'SELECT w.*, b.name AS brand_name FROM watches w JOIN brands b ON b.id = w.brand_id ORDER BY b.position, w.position, w.id',
    autoSlug: (row, db) => {
      const brand = db.prepare('SELECT name FROM brands WHERE id = ?').get(row.brand_id);
      return slugify(`${brand?.name || ''} ${row.name}`);
    },
    publicPath: (row) => `/watches/${row.slug}`,
  },
  brands: {
    table: 'brands',
    singular: 'maison',
    title: 'Maisons',
    titleField: 'name',
    order: 'position, name',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'URL slug', type: 'slug', hint: 'Leave blank to generate from the name.' },
      { name: 'country', label: 'Country', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'founded', label: 'Founded', type: 'text', placeholder: 'e.g. 1846' },
      { name: 'tagline', label: 'Tagline', type: 'textarea', max: 300, rows: 2 },
      { name: 'story', label: 'Story', type: 'textarea', max: 8000, rows: 8, hint: 'Separate paragraphs with a blank line.' },
      { name: 'highlights', label: 'At a glance', type: 'textarea', max: 2000, hint: 'One point per line.' },
      { name: 'website', label: 'Official website', type: 'url' },
      { name: 'position', label: 'Sort order', type: 'int' },
      { name: 'published', label: 'Published', type: 'checkbox', default: 1 },
    ],
    columns: ['name', 'country', 'watch_count', 'published'],
    listQuery: 'SELECT b.*, (SELECT COUNT(*) FROM watches w WHERE w.brand_id = b.id) AS watch_count FROM brands b ORDER BY b.position, b.name',
    autoSlug: (row) => slugify(row.name),
    publicPath: (row) => `/maisons/${row.slug}`,
  },
  locations: {
    table: 'locations',
    singular: 'location',
    title: 'Locations',
    titleField: 'name',
    order: 'position, id',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'URL slug', type: 'slug', hint: 'Leave blank to generate from the name.' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: () => opts(LOCATION_STATUSES) },
      { name: 'status_note', label: 'Status note', type: 'text', placeholder: 'e.g. Opening 2026, or Open daily' },
      { name: 'address', label: 'Address', type: 'textarea', rows: 2 },
      { name: 'hours', label: 'Opening hours', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'position', label: 'Sort order', type: 'int' },
      { name: 'published', label: 'Published', type: 'checkbox', default: 1 },
    ],
    columns: ['name', 'city', 'status', 'published'],
    autoSlug: (row) => slugify(row.name),
    publicPath: () => '/gallery',
  },
  events: {
    table: 'events',
    singular: 'event',
    title: 'Events',
    titleField: 'title',
    order: 'starts_at DESC',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'URL slug', type: 'slug', hint: 'Leave blank to generate from the title.' },
      { name: 'starts_at', label: 'Date & time (IST)', type: 'datetime', required: true },
      { name: 'location_id', label: 'Gallery', type: 'select', options: (db) => [{ value: '', label: 'Other venue' }, ...db.prepare('SELECT id AS value, name AS label FROM locations ORDER BY position').all()] },
      { name: 'venue', label: 'Venue (shown to guests)', type: 'text' },
      { name: 'summary', label: 'Summary', type: 'textarea', rows: 2, max: 400 },
      { name: 'description', label: 'Full description', type: 'textarea', rows: 8, max: 8000 },
      { name: 'capacity', label: 'Capacity (guests)', type: 'int', hint: 'Leave blank for no limit.' },
      { name: 'published', label: 'Published', type: 'checkbox', default: 1 },
    ],
    columns: ['title', 'starts_at', 'rsvps', 'published'],
    listQuery: `SELECT e.*, (SELECT COALESCE(SUM(COALESCE(r.guests, 1)), 0) FROM requests r WHERE r.event_id = e.id AND r.type = 'event' AND r.status != 'closed') AS rsvps
      FROM events e ORDER BY e.starts_at DESC`,
    autoSlug: (row) => slugify(row.title),
    publicPath: (row) => `/events/${row.slug}`,
  },
};

// IST is UTC+05:30 year round, so conversions are fixed-offset.
const toIst = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 16);
};
const fromIst = (local) => new Date(`${local}:00+05:30`).toISOString();

export function formValue(field, row) {
  const value = row?.[field.name];
  if (field.type === 'datetime') return value ? toIst(value) : '';
  if (value === null || value === undefined) return field.default ?? '';
  return value;
}

// Converts a submitted form body into column values, validating each field.
export function parseForm(resource, body, db) {
  const out = {};
  for (const f of resource.fields) {
    if (!f.name) continue;
    const raw = body[f.name];
    switch (f.type) {
      case 'checkbox': out[f.name] = raw ? 1 : 0; break;
      case 'int': out[f.name] = f.name === 'position' ? (v.int(raw, f.label, { min: 0 }) ?? 0) : v.int(raw, f.label, { min: 0 }); break;
      case 'url': out[f.name] = v.url(raw, f.label); break;
      case 'color': out[f.name] = v.color(raw, f.label); break;
      case 'textarea': out[f.name] = v.text(raw, f.label, { max: f.max || 3000, required: f.required }); break;
      case 'slug': out[f.name] = raw && raw.trim() ? v.slug(raw) : ''; break;
      case 'datetime': {
        const s = v.text(raw, f.label, { max: 20, required: f.required });
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) throw new v.ValidationError(`${f.label} must be a valid date and time.`);
        out[f.name] = fromIst(s);
        break;
      }
      case 'select': {
        const values = f.options(db).map((o) => String(o.value));
        const s = raw === undefined ? '' : String(raw);
        if (!values.includes(s) || (f.required && s === '')) throw new v.ValidationError(`Please choose a valid ${f.label.toLowerCase()}.`);
        out[f.name] = s === '' ? (f.name.endsWith('_id') ? null : '') : (f.name.endsWith('_id') ? Number(s) : s);
        break;
      }
      default: out[f.name] = v.text(raw, f.label, { max: f.max || 200, required: f.required });
    }
  }
  if ('slug' in out && !out.slug) out.slug = resource.autoSlug(out, db);
  return out;
}
