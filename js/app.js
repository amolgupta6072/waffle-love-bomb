// FUT-style draft built on a FUTBIN player export (data/players.json).
(() => {
  'use strict';

  const CHOICES = 5;
  const SUBS = 7;
  const RESERVES = 5;

  // Slot positions on the pitch: [position, x%, y%] with the attack at the top.
  const FORMATIONS = {
    '4-3-3': [['GK', 50, 90], ['LB', 14, 70], ['CB', 37, 74], ['CB', 63, 74], ['RB', 86, 70], ['CM', 27, 48], ['CM', 50, 52], ['CM', 73, 48], ['LW', 17, 22], ['ST', 50, 16], ['RW', 83, 22]],
    '4-4-2': [['GK', 50, 90], ['LB', 14, 70], ['CB', 37, 74], ['CB', 63, 74], ['RB', 86, 70], ['LM', 12, 44], ['CM', 37, 48], ['CM', 63, 48], ['RM', 88, 44], ['ST', 36, 17], ['ST', 64, 17]],
    '4-2-3-1': [['GK', 50, 90], ['LB', 14, 70], ['CB', 37, 74], ['CB', 63, 74], ['RB', 86, 70], ['CDM', 36, 55], ['CDM', 64, 55], ['LM', 15, 34], ['CAM', 50, 34], ['RM', 85, 34], ['ST', 50, 13]],
    '4-1-2-1-2': [['GK', 50, 90], ['LB', 14, 70], ['CB', 37, 74], ['CB', 63, 74], ['RB', 86, 70], ['CDM', 50, 57], ['CM', 24, 45], ['CM', 76, 45], ['CAM', 50, 33], ['ST', 35, 14], ['ST', 65, 14]],
    '3-5-2': [['GK', 50, 90], ['CB', 25, 73], ['CB', 50, 76], ['CB', 75, 73], ['CDM', 37, 55], ['CDM', 63, 55], ['LM', 11, 42], ['CAM', 50, 36], ['RM', 89, 42], ['ST', 36, 14], ['ST', 64, 14]],
    '3-4-3': [['GK', 50, 90], ['CB', 25, 73], ['CB', 50, 76], ['CB', 75, 73], ['LM', 12, 47], ['CM', 37, 50], ['CM', 63, 50], ['RM', 88, 47], ['LW', 18, 22], ['ST', 50, 15], ['RW', 82, 22]],
    '5-3-2': [['GK', 50, 90], ['LWB', 10, 62], ['CB', 30, 74], ['CB', 50, 77], ['CB', 70, 74], ['RWB', 90, 62], ['CM', 27, 45], ['CM', 50, 49], ['CM', 73, 45], ['ST', 36, 16], ['ST', 64, 16]],
    '4-3-2-1': [['GK', 50, 90], ['LB', 14, 70], ['CB', 37, 74], ['CB', 63, 74], ['RB', 86, 70], ['CM', 25, 52], ['CM', 50, 55], ['CM', 75, 52], ['CF', 32, 31], ['CF', 68, 31], ['ST', 50, 13]],
    '4-5-1': [['GK', 50, 90], ['LB', 14, 70], ['CB', 37, 74], ['CB', 63, 74], ['RB', 86, 70], ['LM', 11, 40], ['CM', 32, 50], ['CAM', 50, 36], ['CM', 68, 50], ['RM', 89, 40], ['ST', 50, 14]],
    '4-4-1-1': [['GK', 50, 90], ['LB', 14, 70], ['CB', 37, 74], ['CB', 63, 74], ['RB', 86, 70], ['LM', 12, 46], ['CM', 37, 50], ['CM', 63, 50], ['RM', 88, 46], ['CF', 50, 31], ['ST', 50, 13]],
  };

  // When a slot has too few exact matches, widen to these related positions.
  const NEAR = {
    GK: [], CB: ['CDM'], LB: ['LWB'], RB: ['RWB'], LWB: ['LB', 'LM'], RWB: ['RB', 'RM'],
    CDM: ['CM', 'CB'], CM: ['CDM', 'CAM'], CAM: ['CM', 'CF'], LM: ['LW', 'LWB'], RM: ['RW', 'RWB'],
    LW: ['LM', 'LF'], RW: ['RM', 'RF'], ST: ['CF'], CF: ['ST', 'CAM'],
  };

  // Subs cover each line of the team; reserves are open to anyone.
  const SUB_SLOTS = ['GK', 'CB', 'FB', 'MID', 'MID', 'WING', 'ST'];
  const GROUPS = {
    FB: ['LB', 'RB', 'LWB', 'RWB'], MID: ['CDM', 'CM', 'CAM'], WING: ['LM', 'RM', 'LW', 'RW'],
    ST: ['ST', 'CF'], CB: ['CB'], GK: ['GK'], ANY: null,
  };
  const GROUP_LABEL = { FB: 'FB', MID: 'MID', WING: 'WING', ST: 'ATT', CB: 'CB', GK: 'GK', ANY: 'ANY' };

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  let ALL = [];
  let state = null;

  // ---------- data ----------
  async function loadPlayers() {
    let data = window.FUTBIN_PLAYERS;
    if (!data) {
      try {
        const r = await fetch('data/players.json', { cache: 'no-store' });
        if (r.ok) data = await r.json();
      } catch { /* opened from disk or not scraped yet */ }
    }
    const list = Array.isArray(data) ? data : data?.players || [];
    return list.filter((p) => p && p.name && p.rating && p.position);
  }

  const key = (p) => (p.name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const positionsOf = (p) => [p.position, ...(p.altPositions || [])];
  const usedKeys = () => new Set(allPicked().map(key));

  function allPicked() {
    return [...state.xi, ...state.subs, ...state.reserves].filter(Boolean);
  }

  // Ratings near the top of the pool show up most, like FUT draft.
  function weightedSample(pool, n) {
    const out = [];
    const items = pool.map((p) => ({ p, w: Math.exp((p.rating - 80) / 4) }));
    while (out.length < n && items.length) {
      const total = items.reduce((s, i) => s + i.w, 0);
      let r = Math.random() * total;
      let idx = 0;
      while (idx < items.length - 1 && (r -= items[idx].w) > 0) idx++;
      const [picked] = items.splice(idx, 1);
      if (!out.some((o) => key(o) === key(picked.p))) out.push(picked.p);
    }
    return out;
  }

  function candidates(accept, n = CHOICES) {
    const used = usedKeys();
    const pool = ALL.filter((p) => !used.has(key(p)));
    for (const tier of accept) {
      const matched = pool.filter((p) => tier(p));
      if (matched.length >= n || tier === accept[accept.length - 1]) {
        const picks = weightedSample(matched, n);
        if (picks.length < n) {
          const extra = weightedSample(pool.filter((p) => !picks.includes(p)), n - picks.length);
          picks.push(...extra);
        }
        return picks;
      }
    }
    return [];
  }

  function slotCandidates(pos) {
    return candidates([
      (p) => p.position === pos,
      (p) => positionsOf(p).includes(pos),
      (p) => positionsOf(p).some((x) => x === pos || NEAR[pos]?.includes(x)),
    ]);
  }

  function groupCandidates(group) {
    const list = GROUPS[group];
    if (!list) return candidates([() => true]);
    return candidates([(p) => list.includes(p.position), (p) => positionsOf(p).some((x) => list.includes(x))]);
  }

  // ---------- chemistry & rating (FC 24+ style) ----------
  function chemistry() {
    const xi = state.xi;
    const inPos = xi.map((p, i) => p && positionsOf(p).includes(state.slots[i][0]));
    const count = (field) => {
      const m = new Map();
      xi.forEach((p, i) => {
        const v = p && inPos[i] && (p[field]?.name || p[field]?.id);
        if (v) m.set(v, (m.get(v) || 0) + 1);
      });
      return m;
    };
    const clubs = count('club'), nations = count('nation'), leagues = count('league');
    const step = (n, a, b, c) => (n >= c ? 3 : n >= b ? 2 : n >= a ? 1 : 0);
    const per = xi.map((p, i) => {
      if (!p || !inPos[i]) return 0;
      const isIcon = /icon/i.test(p.version || '');
      const club = step(clubs.get(p.club?.name || p.club?.id) || 0, 2, 5, 8);
      const nation = step(nations.get(p.nation?.name || p.nation?.id) || 0, 2, 5, 8);
      const league = step(leagues.get(p.league?.name || p.league?.id) || 0, 3, 5, 8);
      return isIcon ? 3 : Math.min(3, club + nation + league);
    });
    return { per, inPos, total: per.reduce((a, b) => a + b, 0) };
  }

  function squadRating() {
    const rs = state.xi.filter(Boolean).map((p) => p.rating);
    if (!rs.length) return 0;
    const pad = [...rs, ...Array(11 - rs.length).fill(0)];
    const avg = pad.reduce((a, b) => a + b, 0) / 11;
    const excess = pad.reduce((s, r) => s + Math.max(0, r - avg), 0);
    return Math.min(99, Math.floor(avg + excess / 11));
  }

  // ---------- rendering ----------
  const SILHOUETTE =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="18" fill="rgba(0,0,0,.28)"/><path d="M15 100c3-25 17-38 35-38s32 13 35 38z" fill="rgba(0,0,0,.28)"/></svg>');

  function cardClass(p) {
    const v = (p.version || '').toLowerCase();
    if (v && !/gold|silver|bronze|rare|common/.test(v)) return 'special';
    if (p.rating >= 75) return '';
    if (p.rating >= 65) return 'silver';
    return 'bronze';
  }

  function statsHtml(p) {
    if (!p.stats) return '';
    return `<div class="stats">${Object.entries(p.stats)
      .map(([k, v]) => `<span><b>${esc(v)}</b>${esc(k.toUpperCase())}</span>`)
      .join('')}</div>`;
  }

  function cardEl(p, opts = {}) {
    const c = el('div', `card ${cardClass(p)} ${opts.oop ? 'oop' : ''}`);
    const icons = [p.nation, p.league, p.club]
      .filter((x) => x && x.icon)
      .map((x) => `<img src="${esc(x.icon)}" alt="${esc(x.name)}" title="${esc(x.name)}" referrerpolicy="no-referrer" onerror="this.remove()">`)
      .join('');
    c.innerHTML = `
      <img class="face" alt="" referrerpolicy="no-referrer" loading="lazy">
      <div class="rt">${esc(p.rating)}</div>
      <div class="ps">${esc(opts.shownPos || p.position)}</div>
      ${opts.chem != null ? `<div class="chem c${opts.chem}"><i></i><i></i><i></i></div>` : ''}
      <div class="nm" title="${esc(p.name)}">${esc(p.name)}</div>
      ${statsHtml(p)}
      <div class="icons">${icons}</div>`;
    const img = c.querySelector('img.face');
    // Local download first, then FUTBIN's CDN, then a silhouette.
    const sources = [p.image, p.imageRemote].filter(Boolean);
    const next = () => {
      if (sources.length) img.src = sources.shift();
      else { img.onerror = null; img.src = SILHOUETTE; }
    };
    img.onerror = next;
    next();
    c.title = `${p.name} · ${p.rating} ${positionsOf(p).join('/')}\n${[p.club?.name, p.league?.name, p.nation?.name].filter(Boolean).join(' · ')}`;
    return c;
  }

  function emptyEl(label, sub) {
    return el('div', 'empty', `${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}`);
  }

  function render() {
    const chem = chemistry();
    const pitch = $('#pitch');
    pitch.innerHTML = '<div class="halfway"></div>';
    state.slots.forEach(([pos, x, y], i) => {
      const wrap = el('div', 'slot');
      wrap.style.left = x + '%';
      wrap.style.top = y + '%';
      const p = state.xi[i];
      const node = p ? cardEl(p, { shownPos: pos, chem: chem.per[i], oop: !chem.inPos[i] }) : emptyEl(pos, 'pick');
      if (isSelected('xi', i)) node.classList.add('selected');
      node.onclick = () => onSlotClick('xi', i);
      wrap.append(node);
      pitch.append(wrap);
    });

    const bench = (id, list, labels, kind) => {
      const box = $(id);
      box.innerHTML = '';
      list.forEach((p, i) => {
        const wrap = el('div');
        const node = p ? cardEl(p) : emptyEl(GROUP_LABEL[labels[i]], kind);
        if (isSelected(kind, i)) node.classList.add('selected');
        node.onclick = () => onSlotClick(kind, i);
        wrap.append(node);
        box.append(wrap);
      });
    };
    bench('#subs', state.subs, SUB_SLOTS, 'subs');
    bench('#reserves', state.reserves, Array(RESERVES).fill('ANY'), 'reserves');

    const picked = allPicked().length;
    const total = 11 + SUBS + RESERVES;
    $('#m-rating').textContent = squadRating();
    $('#m-chem').textContent = chem.total;
    $('#m-picks').textContent = picked;
    $('#m-picks-total').textContent = '/' + total;
    $('#btn-finish').hidden = state.xi.some((p) => !p);
  }

  const isSelected = (kind, i) => state.selected && state.selected.kind === kind && state.selected.i === i;

  // ---------- picking ----------
  function openPicker(title, options, onPick) {
    $('#picker-title').textContent = title;
    const box = $('#choices');
    box.innerHTML = '';
    options.forEach((o) => {
      const wrap = el('div', 'choice');
      const node = o.node;
      node.onclick = () => {
        $('#picker').hidden = true;
        onPick(o.value);
      };
      wrap.append(node);
      if (o.meta) wrap.append(el('div', 'meta', o.meta));
      box.append(wrap);
    });
    $('#picker').hidden = false;
  }

  function playerOptions(list) {
    return list.map((p) => ({
      value: p,
      node: cardEl(p),
      meta: esc([p.club?.name, p.nation?.name].filter(Boolean).join(' · ')),
    }));
  }

  function pickFormation() {
    const names = Object.keys(FORMATIONS).sort(() => Math.random() - 0.5).slice(0, CHOICES);
    openPicker('Choose your formation', names.map((name) => {
      const n = el('div', 'formation-choice');
      const mini = el('div', 'mini-pitch');
      FORMATIONS[name].forEach(([, x, y]) => {
        const dot = el('i');
        dot.style.left = x + '%';
        dot.style.top = y + '%';
        mini.append(dot);
      });
      n.append(mini, document.createTextNode(name));
      return { value: name, node: n };
    }), (name) => {
      state.formation = name;
      state.slots = FORMATIONS[name];
      state.xi = Array(11).fill(null);
      showDraft();
      pickCaptain();
    });
  }

  function pickCaptain() {
    const slotPos = new Set(state.slots.map((s) => s[0]));
    const top = ALL.filter((p) => positionsOf(p).some((x) => slotPos.has(x)));
    const best = [...top].sort((a, b) => b.rating - a.rating).slice(0, Math.max(60, Math.ceil(top.length * 0.05)));
    const opts = weightedSample(best, CHOICES);
    openPicker('Choose your captain', playerOptions(opts), (p) => {
      const i = state.slots.findIndex(([pos], idx) => !state.xi[idx] && pos === p.position);
      const j = i >= 0 ? i : state.slots.findIndex(([pos], idx) => !state.xi[idx] && positionsOf(p).includes(pos));
      state.xi[j >= 0 ? j : 0] = p;
      state.captain = p;
      render();
    });
  }

  function onSlotClick(kind, i) {
    const list = state[kind];
    if (!list[i]) {
      state.selected = null;
      const label = kind === 'xi' ? state.slots[i][0] : kind === 'subs' ? GROUP_LABEL[SUB_SLOTS[i]] : 'Reserve';
      const opts = kind === 'xi' ? slotCandidates(state.slots[i][0]) : kind === 'subs' ? groupCandidates(SUB_SLOTS[i]) : groupCandidates('ANY');
      if (!opts.length) return alert('No more players available in the database for this slot.');
      openPicker(`Pick your ${label}${kind === 'xi' ? '' : kind === 'subs' ? ' substitute' : ''}`, playerOptions(opts), (p) => {
        list[i] = p;
        render();
      });
      return;
    }
    // Swap two filled (or one filled + one empty) slots.
    if (!state.selected) {
      state.selected = { kind, i };
    } else if (isSelected(kind, i)) {
      state.selected = null;
    } else {
      const a = state.selected;
      [state[a.kind][a.i], list[i]] = [list[i], state[a.kind][a.i]];
      state.selected = null;
    }
    render();
  }

  // ---------- flow ----------
  function newDraft() {
    state = { formation: null, slots: [], xi: [], subs: Array(SUBS).fill(null), reserves: Array(RESERVES).fill(null), selected: null };
    $('#screen-results').hidden = true;
    pickFormation();
  }

  function showDraft() {
    $('#screen-start').hidden = true;
    $('#screen-draft').hidden = false;
    $('#meters').hidden = false;
    $('#btn-new').hidden = false;
    render();
  }

  // Four-round knockout against AI squads, scaled by rating and chemistry.
  function playDraft() {
    const rating = squadRating();
    const chem = chemistry().total;
    const strength = rating + (chem - 22) * 0.35 + state.subs.filter(Boolean).length * 0.15;
    const rounds = ['Round of 16', 'Quarter-final', 'Semi-final', 'Final'];
    const opponents = ['FUTBIN Rangers', 'Pack Luck FC', 'Sweaty Elite', 'Meta United', 'Div Rivals XI', 'Weekend League CF', 'Draft Kings', 'Chem Style SC'];
    const goals = (diff) => {
      const lambda = Math.max(0.3, 1.35 + diff * 0.09);
      let k = 0, p = Math.exp(-lambda), s = p, u = Math.random();
      while (u > s && k < 9) { k++; p *= lambda / k; s += p; }
      return k;
    };
    const results = [];
    for (let r = 0; r < rounds.length; r++) {
      const opp = Math.round(rating - 3 + r * 2 + (Math.random() * 4 - 2));
      let us = goals(strength - opp), them = goals(opp - strength), pens = '';
      if (us === them) {
        const win = Math.random() < 0.5 + (strength - opp) * 0.03;
        pens = win ? ' (won on pens)' : ' (lost on pens)';
        if (win) us += 0.1; else them += 0.1;
      }
      const win = us > them;
      results.push({ round: rounds[r], opp: opponents[(Math.random() * opponents.length) | 0], oppRating: opp, us: Math.floor(us), them: Math.floor(them), pens, win });
      if (!win) break;
    }
    const wins = results.filter((r) => r.win).length;
    const box = $('#screen-results');
    box.innerHTML = `
      <div class="trophy">${wins === 4 ? '🏆' : wins >= 2 ? '🥈' : '⚽'}</div>
      <h1>${wins === 4 ? 'Draft champions!' : `${wins} win${wins === 1 ? '' : 's'}`}</h1>
      <p class="muted">${esc(state.formation)} · Rating ${rating} · Chemistry ${chem}/33</p>
      <div class="matches">${results.map((r) => `
        <div class="match ${r.win ? 'win' : 'loss'}">
          <div class="round">${r.round}</div>
          <div>Your Draft</div>
          <div class="score">${r.us} – ${r.them}</div>
          <div>${esc(r.opp)} <span class="muted">(${r.oppRating})</span></div>
          ${r.pens ? `<div class="round">${r.pens.trim()}</div>` : ''}
        </div>`).join('')}</div>
      <button id="btn-back" class="ghost">Back to squad</button>
      <button id="btn-again">New draft</button>`;
    $('#screen-draft').hidden = true;
    box.hidden = false;
    $('#btn-back').onclick = () => { box.hidden = true; $('#screen-draft').hidden = false; };
    $('#btn-again').onclick = newDraft;
  }

  async function init() {
    ALL = await loadPlayers();
    const status = $('#data-status');
    if (!ALL.length) {
      status.innerHTML =
        'No player database found. Run <code>npm install && npm run scrape</code> to pull players and images from FUTBIN into <code>data/</code>, then reload.';
      return;
    }
    status.textContent = `${ALL.length} players loaded from FUTBIN.`;
    $('#btn-start').disabled = false;
    $('#btn-start').onclick = newDraft;
    $('#btn-new').onclick = () => confirm('Start a new draft? Your current squad will be lost.') && newDraft();
    $('#btn-finish').onclick = playDraft;
  }

  init();
})();
