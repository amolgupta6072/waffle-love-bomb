export const THEMES = ['midnight', 'sunrise', 'forest', 'ocean', 'paper', 'candy'];

// Paths that would collide with app routes if used as a username.
const RESERVED = new Set([
  'api', 'app', 'admin', 'login', 'logout', 'signup', 'register', 'dashboard',
  'settings', 'go', 'css', 'js', 'img', 'assets', 'static', 'public', 'help',
  'about', 'terms', 'privacy', 'lynq', 'www', 'index', 'favicon.ico', 'robots.txt',
]);

export class ValidationError extends Error {}

function str(value, field, { max, min = 0 } = {}) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw new ValidationError(`${field} must be text.`);
  const v = value.trim();
  if (v.length < min) throw new ValidationError(min === 1 ? `${field} is required.` : `${field} must be at least ${min} characters.`);
  if (max && v.length > max) throw new ValidationError(`${field} must be at most ${max} characters.`);
  return v;
}

export function username(value) {
  const v = str(value, 'Username', { min: 3, max: 30 }).toLowerCase();
  if (!/^[a-z0-9_.-]+$/.test(v)) throw new ValidationError('Username may only contain letters, numbers, dots, dashes and underscores.');
  if (RESERVED.has(v)) throw new ValidationError('That username is reserved.');
  return v;
}

export function email(value) {
  const v = str(value, 'Email', { min: 1, max: 254 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new ValidationError('Enter a valid email address.');
  return v;
}

export function password(value) {
  if (typeof value !== 'string' || value.length < 8) throw new ValidationError('Password must be at least 8 characters.');
  if (value.length > 200) throw new ValidationError('Password is too long.');
  return value;
}

// Only http(s) URLs are allowed so a link can never run javascript: etc.
// A bare domain like "example.com" is upgraded to https://.
export function httpUrl(value, field = 'URL', { optional = false } = {}) {
  let v = str(value, field, { min: optional ? 0 : 1, max: 2000 });
  if (!v) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(v)) v = `https://${v}`;
  let parsed;
  try { parsed = new URL(v); } catch { throw new ValidationError(`${field} is not a valid link.`); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new ValidationError(`${field} must start with http:// or https://.`);
  if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') throw new ValidationError(`${field} is not a valid link.`);
  return parsed.href;
}

export function profile(body) {
  const out = {};
  if ('display_name' in body) out.display_name = str(body.display_name, 'Display name', { max: 60 });
  if ('bio' in body) out.bio = str(body.bio, 'Bio', { max: 280 });
  if ('avatar_url' in body) out.avatar_url = httpUrl(body.avatar_url, 'Avatar URL', { optional: true });
  if ('theme' in body) {
    if (!THEMES.includes(body.theme)) throw new ValidationError('Unknown theme.');
    out.theme = body.theme;
  }
  return out;
}

export function link(body, { partial = false } = {}) {
  const out = {};
  if (!partial || 'title' in body) out.title = str(body.title, 'Title', { min: 1, max: 100 });
  if (!partial || 'url' in body) out.url = httpUrl(body.url);
  if ('enabled' in body) out.enabled = body.enabled ? 1 : 0;
  return out;
}
