export class ValidationError extends Error {}

export function text(value, label, { max = 200, required = false } = {}) {
  const v = typeof value === 'string' ? value.trim() : '';
  if (required && !v) throw new ValidationError(`${label} is required.`);
  if (v.length > max) throw new ValidationError(`${label} must be at most ${max} characters.`);
  return v;
}

export function email(value) {
  const v = text(value, 'Email', { max: 254, required: true });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new ValidationError('Please enter a valid email address.');
  return v;
}

export function phone(value, { required = false } = {}) {
  const v = text(value, 'Phone', { max: 30, required });
  if (v && !/^[+\d][\d\s()-]{6,}$/.test(v)) throw new ValidationError('Please enter a valid phone number.');
  return v;
}

export function date(value, label, { required = false, future = false } = {}) {
  const v = text(value, label, { max: 20, required });
  if (!v) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) throw new ValidationError(`${label} must be a valid date.`);
  if (future && v < new Date().toISOString().slice(0, 10)) throw new ValidationError(`${label} cannot be in the past.`);
  return v;
}

export function int(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER, required = false } = {}) {
  if (value === undefined || value === null || String(value).trim() === '') {
    if (required) throw new ValidationError(`${label} is required.`);
    return null;
  }
  const n = Number(String(value).replace(/[,\s₹]/g, ''));
  if (!Number.isInteger(n) || n < min || n > max) throw new ValidationError(`${label} must be a whole number between ${min} and ${max}.`);
  return n;
}

// Only http(s) links, so stored URLs can never become javascript: links.
export function url(value, label) {
  let v = text(value, label, { max: 2000 });
  if (!v) return '';
  if (v.startsWith('/')) return v; // local asset path
  if (!/^[a-z][a-z0-9+.-]*:/i.test(v)) v = `https://${v}`;
  let parsed;
  try { parsed = new URL(v); } catch { throw new ValidationError(`${label} is not a valid link.`); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new ValidationError(`${label} must be an http(s) link.`);
  return parsed.href;
}

export function oneOf(value, label, options, { required = true } = {}) {
  if (!required && (value === '' || value === undefined)) return '';
  if (!options.includes(value)) throw new ValidationError(`Please choose a valid ${label.toLowerCase()}.`);
  return value;
}

export function slug(value) {
  const v = text(value, 'Slug', { max: 120, required: true }).toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v)) throw new ValidationError('Slug may only contain lowercase letters, numbers and single dashes.');
  return v;
}

export function color(value, label) {
  const v = text(value, label, { max: 7 });
  if (v && !/^#[0-9a-f]{6}$/i.test(v)) throw new ValidationError(`${label} must be a hex colour like #1a2b3c.`);
  return v;
}
