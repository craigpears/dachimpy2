/* The leaderboard: pick a pirate name and your purse goes up on the board beside the game.
   It only appears where the leaderboard server runs (the Cloudflare Worker in worker/);
   on a plain static host the board stays hidden and the game plays as before. */
(function () {
  'use strict';
  const KEY = 'carp.pirate', REFRESH_MS = 45000, SYNC_MS = 1500;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage unavailable */ } };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  let getPurse = () => 0, addPurse = () => {}, me = load(), el = null, syncTimer = null, last = null;

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

  const OUT_OF_REACH = 'The board is out of reach. Try again in a moment.';

  // Claim a pirate name. Resolves to an error message, or null when it worked.
  async function joinAs(name) {
    if (!/^[A-Za-z]{3,16}$/.test(name)) return 'Use 3 to 16 letters, no spaces.';
    try {
      const r = await api('pirates', { name, dubs: getPurse() });
      if (!r.ok) return r.data.message || OUT_OF_REACH;
      me = { name: r.data.name, key: r.data.key };
      save(me);
      refresh();
      document.dispatchEvent(new Event('pirate-joined'));
      return null;
    } catch { return OUT_OF_REACH; }
  }

  async function join(form) {
    const err = form.querySelector('.b-err'), btn = form.querySelector('button');
    btn.disabled = true;
    const problem = await joinAs(form.name.value.trim());
    if (problem) { err.textContent = problem; btn.disabled = false; }
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

  // Collect winnings from finished harbour-table rounds, including ones you left part-way.
  async function claim() {
    if (!me) return null;
    try {
      const r = await api('harbour/claim', { name: me.name, key: me.key });
      if (!r.ok) return null;
      if (r.data.won) addPurse(r.data.won, 'Harbour table winnings');
      return r.data;
    } catch { return null; }
  }

  window.Social = {
    start(purseGetter, purseAdder) {
      getPurse = purseGetter;
      addPurse = purseAdder;
      refresh();
      if (me) { purseChanged(); claim(); }
      setInterval(() => { if (!document.hidden) refresh(); }, REFRESH_MS);
    },
    purseChanged,
    me: () => me,
    joinAs,
    claim,
    api,
  };
})();
