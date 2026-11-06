/* The leaderboard: pick a pirate name and your purse goes up on the board beside the game.
   It only appears where the leaderboard server runs (the Cloudflare Worker in worker/);
   on a plain static host the board stays hidden and the game plays as before. */
(function () {
  'use strict';
  const KEY = 'carp.pirate', REFRESH_MS = 45000, SYNC_MS = 1500;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage unavailable */ } };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  let getPurse = () => 0, me = load(), el = null, syncTimer = null, last = null;

  async function api(path, body) {
    const res = await fetch('api/' + path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  function paint() {
    if (!el || !last) return;
    const mine = me && me.name;
    const rows = last.pirates.map((p, i) => `<li class="${p.name === mine ? 'me' : ''}"><span class="b-rank">${i + 1}</span><span class="b-name">${esc(p.name)}</span><span class="b-dubs"><span class="coin" aria-hidden="true"></span><b>${p.dubs}</b></span></li>`).join('');
    const onBoard = mine && last.pirates.some((p) => p.name === mine);
    const you = me
      ? `<p class="b-you">Sailing as <b>${esc(me.name)}</b>${last.me && !onBoard ? ` · ${ordinal(last.me.rank)} of ${last.total}` : ''}</p>`
      : `<form class="b-join">
          <label for="b-name">Put your pirate name on the board</label>
          <div class="b-row"><input id="b-name" name="name" autocomplete="nickname" maxlength="16" placeholder="Pirate name" required><button class="btn sm">Join</button></div>
          <p class="b-err" role="alert"></p>
        </form>`;
    el.innerHTML = `<h2>Richest pirates</h2>
      ${rows ? `<ol class="b-list">${rows}</ol>` : '<p class="hint">No pirates yet. Be the first!</p>'}
      ${you}`;
    const form = el.querySelector('.b-join');
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); join(form); });
  }

  const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');

  async function refresh() {
    try {
      const r = await api('board' + (me ? '?me=' + encodeURIComponent(me.name) : ''));
      if (!r.ok || !Array.isArray(r.data.pirates)) return;
      last = r.data;
      if (!el) mount();
      paint();
    } catch { /* no leaderboard server here */ }
  }

  function mount() {
    document.querySelector('.shell').insertAdjacentHTML('beforeend', '<aside class="lboard" id="lboard" aria-label="Leaderboard"></aside>');
    el = document.getElementById('lboard');
  }

  async function join(form) {
    const name = form.name.value.trim(), err = form.querySelector('.b-err'), btn = form.querySelector('button');
    if (!/^[A-Za-z]{3,16}$/.test(name)) { err.textContent = 'Use 3 to 16 letters, no spaces.'; return; }
    btn.disabled = true;
    try {
      const r = await api('pirates', { name, dubs: getPurse() });
      if (!r.ok) { err.textContent = r.data.message || 'The board is out of reach. Try again in a moment.'; btn.disabled = false; return; }
      me = { name: r.data.name, key: r.data.key };
      save(me);
      refresh();
    } catch { err.textContent = 'The board is out of reach. Try again in a moment.'; btn.disabled = false; }
  }

  // Post the purse a moment after it settles, so a run of bets sends one update.
  function purseChanged() {
    if (!me) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
      try {
        const r = await api('purse', { name: me.name, key: me.key, dubs: getPurse() });
        if (r.status === 403) { me = null; save(null); }
        refresh();
      } catch { /* try again on the next change */ }
    }, SYNC_MS);
  }

  window.Social = {
    start(purseGetter) {
      getPurse = purseGetter;
      refresh();
      if (me) purseChanged();
      setInterval(() => { if (!document.hidden) refresh(); }, REFRESH_MS);
    },
    purseChanged,
  };
})();
