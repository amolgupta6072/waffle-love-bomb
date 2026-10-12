// Shared helpers for the app pages.

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Lynq-Request': '1' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (res.status === 401 && !url.startsWith('/api/login')) {
    location.href = '/login';
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function showError(message) {
  const el = document.getElementById('error');
  el.textContent = message;
  el.hidden = !message;
}
