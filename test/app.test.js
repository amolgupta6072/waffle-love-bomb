import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.js';
import { createApp } from '../src/app.js';

let server;
let base;

before(async () => {
  const app = createApp(openDatabase(':memory:'));
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

// Minimal cookie-keeping client.
function client() {
  let cookie = '';
  return async (method, path, body, headers = {}) => {
    const res = await fetch(base + path, {
      method,
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        'X-Lynq-Request': '1',
        ...(cookie && { Cookie: cookie }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const type = res.headers.get('content-type') || '';
    const data = type.includes('json') ? await res.json() : await res.text();
    return { status: res.status, data, headers: res.headers };
  };
}

test('full flow: signup, links, public page, click tracking', async () => {
  const req = client();

  let res = await req('POST', '/api/signup', { email: 'ava@example.com', username: 'Ava', password: 'hunter2hunter2' });
  assert.equal(res.status, 201);
  assert.equal(res.data.user.username, 'ava');

  res = await req('PATCH', '/api/me', { display_name: 'Ava <Rivera>', bio: 'Illustrator', theme: 'sunrise' });
  assert.equal(res.status, 200);
  assert.equal(res.data.user.theme, 'sunrise');

  res = await req('POST', '/api/links', { title: 'Portfolio', url: 'ava.example.com' });
  assert.equal(res.status, 201);
  assert.equal(res.data.link.url, 'https://ava.example.com/');
  const first = res.data.link.id;

  res = await req('POST', '/api/links', { title: 'Shop', url: 'https://shop.example.com' });
  const second = res.data.link.id;

  res = await req('PUT', '/api/links/order', { ids: [second, first] });
  assert.equal(res.status, 200);

  res = await req('GET', '/api/me');
  assert.deepEqual(res.data.links.map((l) => l.id), [second, first]);

  res = await req('PATCH', `/api/links/${second}`, { enabled: false });
  assert.equal(res.data.link.enabled, 0);

  // Public page, viewed anonymously: escapes HTML and hides disabled links.
  const anon = client();
  res = await anon('GET', '/ava');
  assert.equal(res.status, 200);
  assert.match(res.data, /Ava &lt;Rivera&gt;/);
  assert.match(res.data, /theme-sunrise/);
  assert.match(res.data, new RegExp(`/go/${first}`));
  assert.doesNotMatch(res.data, new RegExp(`/go/${second}`));

  res = await anon('GET', `/go/${first}`);
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), 'https://ava.example.com/');
  res = await anon('GET', `/go/${second}`);
  assert.equal(res.status, 404);

  res = await req('GET', '/api/me');
  assert.equal(res.data.user.page_views, 1);
  assert.equal(res.data.links.find((l) => l.id === first).clicks, 1);
});

test('rejects unsafe or invalid input', async () => {
  const req = client();
  await req('POST', '/api/signup', { email: 'bo@example.com', username: 'bo_b', password: 'password123' });

  for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'ftp://x.com', 'not a url']) {
    const res = await req('POST', '/api/links', { title: 'x', url });
    assert.equal(res.status, 400, url);
  }
  let res = await req('PATCH', '/api/me', { avatar_url: 'javascript:alert(1)' });
  assert.equal(res.status, 400);
  res = await req('PATCH', '/api/me', { theme: 'nope' });
  assert.equal(res.status, 400);

  const other = client();
  res = await other('POST', '/api/signup', { email: 'x@example.com', username: 'dashboard', password: 'password123' });
  assert.equal(res.status, 400);
  res = await other('POST', '/api/signup', { email: 'BO@example.com', username: 'bob2', password: 'password123' });
  assert.equal(res.status, 409);
  res = await other('POST', '/api/signup', { email: 'y@example.com', username: 'BO_B', password: 'password123' });
  assert.equal(res.status, 409);
  res = await other('POST', '/api/signup', { email: 'z@example.com', username: 'zed', password: 'short' });
  assert.equal(res.status, 400);
});

test('auth: login, logout, CSRF header, and ownership', async () => {
  const owner = client();
  await owner('POST', '/api/signup', { email: 'cy@example.com', username: 'cyd', password: 'password123' });
  const { data } = await owner('POST', '/api/links', { title: 'Mine', url: 'https://cy.example.com' });

  const intruder = client();
  await intruder('POST', '/api/signup', { email: 'dee@example.com', username: 'dee', password: 'password123' });
  let res = await intruder('PATCH', `/api/links/${data.link.id}`, { title: 'pwned' });
  assert.equal(res.status, 404);
  res = await intruder('DELETE', `/api/links/${data.link.id}`);
  assert.equal(res.status, 404);

  res = await owner('POST', '/api/links', { title: 'x', url: 'https://x.com' }, { 'X-Lynq-Request': '' });
  assert.equal(res.status, 403);

  res = await owner('POST', '/api/logout');
  assert.equal(res.status, 200);
  res = await owner('GET', '/api/me');
  assert.equal(res.status, 401);

  res = await owner('POST', '/api/login', { login: 'cy@example.com', password: 'wrong-password' });
  assert.equal(res.status, 401);
  res = await owner('POST', '/api/login', { login: 'CYD', password: 'password123' });
  assert.equal(res.status, 200);
  res = await owner('GET', '/dashboard');
  assert.equal(res.status, 200);

  const anon = client();
  res = await anon('GET', '/dashboard');
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/login');
});

test('pages and unknown profiles', async () => {
  const anon = client();
  for (const path of ['/', '/login', '/signup', '/css/styles.css', '/js/dashboard.js']) {
    const res = await anon('GET', path);
    assert.equal(res.status, 200, path);
  }
  const res = await anon('GET', '/nobody-here');
  assert.equal(res.status, 404);
  assert.match(res.data, /Claim this lynq/);
});
