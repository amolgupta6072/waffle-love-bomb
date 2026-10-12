const THEMES = [
  { id: 'midnight', name: 'Midnight', bg: 'linear-gradient(160deg,#3b2a8f,#120f24 60%,#7a1f5c)', btn: 'rgb(255 255 255 / 25%)' },
  { id: 'sunrise', name: 'Sunrise', bg: 'linear-gradient(160deg,#ffb36b,#ff6f91,#8e54e9)', btn: 'rgb(255 255 255 / 45%)' },
  { id: 'forest', name: 'Forest', bg: 'linear-gradient(180deg,#13261c,#2e5a3c)', btn: '#e8f3ea' },
  { id: 'ocean', name: 'Ocean', bg: 'linear-gradient(180deg,#0b3d5c,#0e7490,#22d3ee)', btn: 'rgb(255 255 255 / 30%)' },
  { id: 'paper', name: 'Paper', bg: '#f6f3ec', btn: '#1d1b16' },
  { id: 'candy', name: 'Candy', bg: 'linear-gradient(135deg,#ffe1f0,#e4dcff,#d5f5ff)', btn: '#ffffff' },
];

const state = { user: null, links: [] };
const $ = (id) => document.getElementById(id);

// ---------- Helpers ----------
let toastTimer;
function toast(message, isError = false) {
  const el = $('toast');
  el.textContent = message;
  el.className = `toast show${isError ? ' error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 2400);
}

async function run(fn, successMessage) {
  try {
    const result = await fn();
    if (successMessage) toast(successMessage);
    return result;
  } catch (err) {
    toast(err.message, true);
    throw err;
  }
}

let previewTimer;
function refreshPreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    $('preview').src = `/${state.user.username}?preview=${Date.now()}`;
  }, 150);
}

function publicUrl() {
  return `${location.origin}/${state.user.username}`;
}

// ---------- Rendering ----------
function renderStats() {
  const clicks = state.links.reduce((sum, l) => sum + l.clicks, 0);
  const views = state.user.page_views;
  $('stat-views').textContent = views.toLocaleString();
  $('stat-clicks').textContent = clicks.toLocaleString();
  $('stat-ctr').textContent = views ? `${Math.round((clicks / views) * 100)}%` : '—';
}

function renderLinks() {
  const list = $('links');
  const tpl = $('link-template');
  list.replaceChildren();
  state.links.forEach((link, i) => {
    const li = tpl.content.firstElementChild.cloneNode(true);
    li.dataset.id = link.id;
    li.classList.toggle('disabled', !link.enabled);
    li.querySelector('.link-title').textContent = link.title;
    li.querySelector('.link-url').textContent = link.url;
    li.querySelector('.link-meta').textContent = `${link.clicks.toLocaleString()} click${link.clicks === 1 ? '' : 's'}`;
    li.querySelector('[data-action=toggle]').checked = !!link.enabled;
    li.querySelector('[data-action=up]').disabled = i === 0;
    li.querySelector('[data-action=down]').disabled = i === state.links.length - 1;
    list.append(li);
  });
  $('links-empty').hidden = state.links.length > 0;
  $('link-count').textContent = state.links.length ? `${state.links.length} total` : '';
  renderStats();
}

function renderProfile() {
  const u = state.user;
  const form = $('profile-form');
  form.display_name.value = u.display_name;
  form.bio.value = u.bio;
  form.avatar_url.value = u.avatar_url;
  updateBioCount();
  $('share-link').textContent = publicUrl().replace(/^https?:\/\//, '');
  $('share-link').href = `/${u.username}`;
  $('account-email').textContent = `Signed in as @${u.username} (${u.email})`;
}

function renderThemes() {
  const wrap = $('themes');
  wrap.replaceChildren(...THEMES.map((t) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-option';
    btn.dataset.theme = t.id;
    btn.setAttribute('aria-pressed', String(state.user.theme === t.id));
    const swatch = document.createElement('div');
    swatch.className = 'theme-swatch';
    swatch.style.background = t.bg;
    for (let i = 0; i < 3; i++) {
      const bar = document.createElement('i');
      bar.style.background = t.btn;
      swatch.append(bar);
    }
    const label = document.createElement('span');
    label.textContent = t.name;
    btn.append(swatch, label);
    return btn;
  }));
}

function updateBioCount() {
  $('bio-count').textContent = `${$('bio').value.length}/280`;
}

// ---------- Links ----------
$('add-link-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button');
  btn.disabled = true;
  try {
    const { link } = await run(() => api('POST', '/api/links', { title: form.title.value, url: form.url.value }), 'Link added');
    state.links.push(link);
    form.reset();
    form.title.focus();
    renderLinks();
    refreshPreview();
  } catch { /* toast already shown */ } finally {
    btn.disabled = false;
  }
});

async function saveOrder() {
  await run(() => api('PUT', '/api/links/order', { ids: state.links.map((l) => l.id) }));
  renderLinks();
  refreshPreview();
}

function move(from, to) {
  if (to < 0 || to >= state.links.length || from === to) return;
  const [item] = state.links.splice(from, 1);
  state.links.splice(to, 0, item);
  return saveOrder();
}

function openEditor(li, link) {
  if (li.querySelector('.link-edit')) return;
  const box = document.createElement('div');
  box.className = 'link-edit';
  box.innerHTML = `
    <input type="text" name="title" maxlength="100" aria-label="Title">
    <input type="text" name="url" inputmode="url" aria-label="URL">
    <div class="row">
      <button class="btn btn-ghost btn-sm" type="button" data-edit="cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" type="button" data-edit="save">Save</button>
    </div>`;
  box.querySelector('[name=title]').value = link.title;
  box.querySelector('[name=url]').value = link.url;
  li.append(box);
  li.draggable = false;
  box.querySelector('[name=title]').focus();

  const save = async () => {
    try {
      const { link: updated } = await run(() => api('PATCH', `/api/links/${link.id}`, {
        title: box.querySelector('[name=title]').value,
        url: box.querySelector('[name=url]').value,
      }), 'Link updated');
      Object.assign(link, updated);
      renderLinks();
      refreshPreview();
    } catch { /* keep editor open */ }
  };
  box.addEventListener('click', (e) => {
    const action = e.target.dataset.edit;
    if (action === 'cancel') renderLinks();
    if (action === 'save') save();
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') renderLinks();
  });
}

$('links').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn || btn.dataset.action === 'toggle') return;
  const li = btn.closest('.link-item');
  const index = state.links.findIndex((l) => l.id === Number(li.dataset.id));
  const link = state.links[index];
  switch (btn.dataset.action) {
    case 'up': return move(index, index - 1);
    case 'down': return move(index, index + 1);
    case 'edit': return openEditor(li, link);
    case 'delete':
      if (!confirm(`Delete “${link.title}”?`)) return;
      await run(() => api('DELETE', `/api/links/${link.id}`), 'Link deleted');
      state.links.splice(index, 1);
      renderLinks();
      refreshPreview();
  }
});

$('links').addEventListener('change', async (e) => {
  if (e.target.dataset.action !== 'toggle') return;
  const li = e.target.closest('.link-item');
  const link = state.links.find((l) => l.id === Number(li.dataset.id));
  const enabled = e.target.checked;
  try {
    await run(() => api('PATCH', `/api/links/${link.id}`, { enabled }), enabled ? 'Link visible' : 'Link hidden');
    link.enabled = enabled ? 1 : 0;
  } catch { /* revert below */ }
  renderLinks();
  refreshPreview();
});

// Drag-and-drop reordering
let dragId = null;
$('links').addEventListener('dragstart', (e) => {
  const li = e.target.closest('.link-item');
  if (!li) return;
  dragId = Number(li.dataset.id);
  li.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(dragId));
});
$('links').addEventListener('dragover', (e) => {
  const li = e.target.closest('.link-item');
  if (!li || dragId === null) return;
  e.preventDefault();
  document.querySelectorAll('.drag-over').forEach((el) => el !== li && el.classList.remove('drag-over'));
  if (Number(li.dataset.id) !== dragId) li.classList.add('drag-over');
});
$('links').addEventListener('drop', (e) => {
  const li = e.target.closest('.link-item');
  if (!li || dragId === null) return;
  e.preventDefault();
  const from = state.links.findIndex((l) => l.id === dragId);
  const to = state.links.findIndex((l) => l.id === Number(li.dataset.id));
  move(from, to);
});
$('links').addEventListener('dragend', () => {
  dragId = null;
  document.querySelectorAll('.dragging, .drag-over').forEach((el) => el.classList.remove('dragging', 'drag-over'));
});

// ---------- Profile & theme ----------
$('bio').addEventListener('input', updateBioCount);

$('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  try {
    const { user } = await run(() => api('PATCH', '/api/me', {
      display_name: form.display_name.value,
      bio: form.bio.value,
      avatar_url: form.avatar_url.value,
    }), 'Profile saved');
    state.user = user;
    renderProfile();
    refreshPreview();
  } catch { /* toast shown */ }
});

$('themes').addEventListener('click', async (e) => {
  const btn = e.target.closest('.theme-option');
  if (!btn || btn.dataset.theme === state.user.theme) return;
  try {
    const { user } = await run(() => api('PATCH', '/api/me', { theme: btn.dataset.theme }), 'Theme updated');
    state.user = user;
    renderThemes();
    refreshPreview();
  } catch { /* toast shown */ }
});

// ---------- Account ----------
$('copy-link').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(publicUrl());
    toast('Link copied!');
  } catch {
    prompt('Copy your lynq:', publicUrl());
  }
});

$('logout').addEventListener('click', async () => {
  await api('POST', '/api/logout').catch(() => {});
  location.href = '/';
});

$('delete-account').addEventListener('click', async () => {
  const answer = prompt(`This permanently deletes your page and all links.\nType your username (${state.user.username}) to confirm:`);
  if (answer?.trim().toLowerCase() !== state.user.username) return;
  await run(() => api('DELETE', '/api/me'));
  location.href = '/';
});

// ---------- Boot ----------
(async function init() {
  const data = await api('GET', '/api/me');
  state.user = data.user;
  state.links = data.links;
  renderProfile();
  renderThemes();
  renderLinks();
  refreshPreview();
})();
