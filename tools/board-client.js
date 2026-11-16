// The task board's page (drawn by tools/task.mjs): filtering by stream, cards dragged between columns, a card opened
// in a panel and gone through one after another, what's said about it sent, the inbox. Everything it changes it asks
// `node tools/task.mjs serve` to change (POST /api/move, /api/update, /api/inbox): only the script writes a card.
// The user, 15 Nov: "You need to be able to actually see the detail on the cards and open them ... some quick way of
// going between them, even if the quick fire way is then me just having this mic on and dictating into here".
(() => {
  const PORT = document.body.dataset.port;
  // Served by the script (any port it's given), or opened as a file or from another server, where nothing can be changed.
  let served = location.protocol !== 'file:';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const STATUSES = $$('.panel .st').map((b) => b.dataset.status);

  let say;
  const tell = (text) => { say?.remove(); say = Object.assign(document.createElement('div'), { className: 'say', textContent: text }); document.body.append(say); setTimeout(() => say?.remove(), 5000); };
  const notServed = (what) => tell(`To ${what}, run npm run board:serve and open http://localhost:${PORT}/`);
  const post = async (path, body) => {
    const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if ([404, 405, 501].includes(r.status)) { served = false; throw new Error('not served'); }
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  };
  const cardEl = (id) => $(`.cols .card[data-id="${CSS.escape(id)}"]`);
  const count = () => $$('.col').forEach((c) => { $('h2 span', c).textContent = $$('.card', c).length; });

  // Streams.
  const pick = (s) => {
    $$('.chip').forEach((b) => b.classList.toggle('on', b.dataset.stream === s));
    $$('.cols .card, .stream').forEach((c) => { c.hidden = !!s && c.dataset.stream !== s; });
    try { localStorage.setItem('board.stream', s); } catch (e) {}
  };
  $$('.chip').forEach((b) => b.addEventListener('click', () => pick(b.dataset.stream)));
  try { const s = localStorage.getItem('board.stream'); if (s) pick(s); } catch (e) {}
  $$('.fold').forEach((b) => b.addEventListener('click', () => {
    const col = b.closest('.col'); col.classList.toggle('folded'); b.textContent = col.classList.contains('folded') ? 'Show them' : 'Hide them';
  }));

  // A card moved: dragged to a column, or a status picked in its panel.
  async function moveTo(id, status) {
    if (!served) { notServed('move cards'); return false; }
    try { await post('/api/move', { id, status }); } catch (e) { served ? tell('Not saved: ' + e.message) : notServed('move cards'); return false; }
    const card = cardEl(id);
    $(`.col[data-status="${status}"] .list`).prepend(card);
    card.dataset.status = status; count();
    if (open === id) render();
    return true;
  }
  let dragged = null;
  const wire = (c) => {
    c.addEventListener('dragstart', (e) => { dragged = c; c.classList.add('dragging'); e.dataTransfer.setData('text/plain', c.dataset.id); });
    c.addEventListener('dragend', () => { c.classList.remove('dragging'); dragged = null; });
    c.addEventListener('click', (e) => { if (!e.target.closest('a, button, select, textarea')) openCard(c.dataset.id); });
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === c) openCard(c.dataset.id); });
  };
  $$('.cols .card').forEach(wire);
  $$('.col').forEach((col) => {
    col.addEventListener('dragover', (e) => { if (dragged) { e.preventDefault(); col.classList.add('over'); } });
    col.addEventListener('dragleave', (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
    col.addEventListener('drop', (e) => {
      e.preventDefault(); col.classList.remove('over');
      if (dragged && dragged.closest('.col') !== col) moveTo(dragged.dataset.id, col.dataset.status);
    });
  });

  // A card opened in the panel, and gone through: the order is fixed when it's opened (the cards showing, column by
  // column from its own, Done only if you started there), so moving one doesn't shuffle where "next" goes.
  const panel = $('.panel'), read = $('.read', panel), at = $('.at', panel), form = $('.update', panel), box = form.text;
  let open = null, order = [];
  const showing = (c) => !c.hidden;
  function orderFrom(id) {
    const start = cardEl(id), from = start.closest('.col').dataset.status;
    const cols = $$('.col').filter((c) => c.dataset.status !== 'done' || from === 'done');
    const k = cols.findIndex((c) => c.dataset.status === from);
    return [...cols.slice(k), ...cols.slice(0, k)].flatMap((c) => $$('.card', c).filter(showing).map((x) => x.dataset.id));
  }
  function showStatus(st) { $$('.st', panel).forEach((b) => b.classList.toggle('on', b.dataset.status === st)); }
  function render() {
    const c = cardEl(open);
    if (!c) return shut();
    const copy = c.cloneNode(true);
    copy.removeAttribute('draggable'); copy.removeAttribute('tabindex'); copy.classList.remove('open');
    $('.full', copy).hidden = false;
    read.replaceChildren(copy); read.scrollTop = 0;
    const i = order.indexOf(open), col = $(`.col[data-status="${c.dataset.status}"] h2`).firstChild.textContent.trim();
    at.textContent = `${col} · ${i + 1} of ${order.length}${c.classList.contains('busy') ? ' · updating...' : ''}`;
    showStatus(c.dataset.status);
    $$('.cols .card.open').forEach((x) => x.classList.remove('open'));
    c.classList.add('open'); c.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    try { history.replaceState(null, '', '#' + encodeURIComponent(open)); } catch (e) {}
  }
  // L tries the open card locally, Shift+L live, in a new tab (the user, 15 Nov: "link to, like, live or local to
  // test something? Open in a new tab").
  function tryIt(where) {
    const c = cardEl(open), a = c && ($(`a.go[data-go="${where}"]`, c) || $('a.go', c));
    if (!a) return tell('No link on this card, or its stream, to try it at.');
    window.open(a.href, '_blank', 'noopener');
  }
  function openCard(id, keepOrder) {
    if (!keepOrder || !order.includes(id)) order = orderFrom(id);
    if (open !== id) { box.value = draft[id] || ''; fit(box); }
    open = id; panel.hidden = false; document.body.classList.add('reading'); render();
  }
  function step(by) {
    if (!open) return;
    const i = order.indexOf(open) + by;
    if (i < 0 || i >= order.length) { tell(by > 0 ? 'That was the last card.' : 'That was the first card.'); return; }
    draft[open] = box.value;
    openCard(order[i], true);
  }
  function shut() {
    if (open) draft[open] = box.value;
    if (into === box) micOff(); // it was writing into the card that's gone
    panel.hidden = true; open = null; document.body.classList.remove('reading');
    $$('.cols .card.open').forEach((x) => x.classList.remove('open'));
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
  }
  const draft = {};
  $('.prev', panel).addEventListener('click', () => step(-1));
  $('.next', panel).addEventListener('click', () => step(1));
  $('.shut', panel).addEventListener('click', shut);
  $$('.st', panel).forEach((b) => b.addEventListener('click', () => open && moveTo(open, b.dataset.status)));
  $$('.through').forEach((b) => b.addEventListener('click', () => {
    const first = $$('.card', b.closest('.col')).find(showing);
    if (first) openCard(first.dataset.id); else tell('Nothing in that column.');
  }));
  // The keys. The mic writes into the boxes without them ever being clicked into, so the keys always work while it's
  // on (the user, 15 Nov: "all the shortcuts break as soon as the text box has got attention ... I'm going to be
  // primarily using the mic ... So it doesn't really ever need any text focus"). Only a box you've clicked into to
  // type in, with the mic off, takes the keys as letters; Esc leaves it, and Alt+ any key still works in it.
  document.addEventListener('keydown', (e) => {
    const inBox = !!e.target.closest?.('input, textarea, select');
    const typing = inBox && !rec, alt = e.altKey && !e.ctrlKey && !e.metaKey;
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { // send (and next), wherever you are
      e.preventDefault();
      if (!panel.hidden && e.target !== drop.text && into !== drop.text) send(true); else dropIt();
      return;
    }
    if (typing && !alt) { if (e.key === 'Escape') { e.preventDefault(); e.target.blur(); } return; }
    if (e.ctrlKey || e.metaKey || (e.altKey && !alt)) return;
    if (inBox) e.target.blur(); // a key while the mic's on: the box lets go, so the next one's a key too
    const n = Number(/^Digit(\d)$/.exec(e.code)?.[1] ?? NaN);
    if (e.key === 'Enter' && rec) { e.preventDefault(); if (into === drop.text) dropIt(); else send(true); return; } // dictating: Enter sends it (and goes on)
    if (e.code === 'KeyM') { // the mic on or off: into the open card's box, or the inbox's when no card's open
      if (!Speech) tell("This browser can't listen: open the board in Chrome or Edge, or use Win+H.");
      else toggleMic(e.target === drop.text || panel.hidden ? drop.text : box);
    } else if (panel.hidden) return;
    else if (e.key === 'ArrowRight' || e.code === 'KeyJ') step(1);
    else if (e.key === 'ArrowLeft' || e.code === 'KeyK') step(-1);
    else if (e.code === 'KeyN') send(true);
    else if (e.code === 'KeyI') { if (box.value.trim()) dropIt(box); }
    else if (e.code === 'KeyL') tryIt(e.shiftKey ? 'live' : 'local');
    else if (e.key === 'Escape') shut();
    else if (e.key === 'Enter' || e.key === '/') { if (rec) return; box.focus(); }
    else if (n >= 1 && n <= STATUSES.length) moveTo(open, STATUSES[n - 1]);
    else return;
    e.preventDefault();
  });
  // A button clicked (Mic, Send, a status) doesn't keep the keys from working either.
  panel.addEventListener('click', (e) => { if (e.target.closest('button')) e.target.closest('button').blur(); });
  $('.drop').addEventListener('click', (e) => { if (e.target.closest('button')) e.target.closest('button').blur(); });

  // What's been sent, and what came of it, in a list in the corner that stays (the user, 15 Nov: "It makes you
  // nervous. Like, did that save? Did it not?"): each line there at once, "saved" when it's on the card, then what
  // the headless Claude said it did. A line opens its card.
  const feed = Object.assign(document.createElement('ol'), { className: 'feed' });
  document.body.append(feed);
  function feedLine(id, title, words) {
    const li = document.createElement('li');
    li.dataset.id = id;
    li.innerHTML = '<b></b> <span class="said"></span><span class="what">Saving...</span>';
    $('b', li).textContent = title;
    $('.said', li).textContent = '"' + (words.length > 90 ? words.slice(0, 90) + '...' : words) + '"';
    li.addEventListener('click', () => cardEl(id) && openCard(id));
    feed.prepend(li);
    while (feed.children.length > 6) feed.lastElementChild.remove();
    return li;
  }
  const feedSays = (id, text, state) => $$('li', feed).filter((li) => li.dataset.id === id).slice(0, 1).forEach((li) => {
    $('.what', li).textContent = text; li.className = state || '';
  });
  // A card drawn afresh from the server, where it was if it's still in that column.
  function replaceCard(id, html, status) {
    const old = cardEl(id), t = document.createElement('template');
    t.innerHTML = html.trim();
    const fresh = t.content.firstElementChild;
    fresh.hidden = old?.hidden ?? false; wire(fresh);
    if (old && old.dataset.status === status) old.replaceWith(fresh);
    else { old?.remove(); $(`.col[data-status="${status}"] .list`).prepend(fresh); }
    count();
    return fresh;
  }

  // What's said about a card: logged on it at once (and shown on it, its log and all), then acted on by a headless
  // Claude; the card's redrawn when it's finished (watched every few seconds).
  async function send(goOn) {
    if (into === box) keepHeard(); // the end of what's being said goes with it, not onto the next card
    const id = open, text = box.value.trim();
    if (!text) { if (goOn) step(1); return; }
    if (!served) { notServed('send updates'); return; }
    const li = feedLine(id, $('h3', cardEl(id)).textContent, text);
    let r;
    try { r = await post('/api/update', { id, text }); } catch (e) {
      feedSays(id, 'Not saved: ' + (served ? e.message : 'the board isn\'t being served'), 'bad');
      served ? tell('Not sent: ' + e.message) : notServed('send updates'); return;
    }
    box.value = ''; fit(box); delete draft[id];
    replaceCard(id, r.html, r.status).classList.add('busy'); watching.add(id);
    feedSays(id, 'Saved on the card. Acting on it...', 'saved');
    if (open === id) { if (goOn) step(1); else render(); }
  }
  form.addEventListener('submit', (e) => { e.preventDefault(); send(e.submitter?.name === 'on'); });
  // Something that isn't about this card, thought of while going through: the same box, into the inbox instead.
  $('.toinbox', panel).addEventListener('click', () => { if (box.value.trim()) dropIt(box); else tell('Say or type it first, then send it to the inbox.'); });
  const watching = new Set();
  setInterval(async () => {
    for (const id of watching) {
      try {
        const c = await (await fetch('/api/card?id=' + encodeURIComponent(id))).json();
        if (c.busy) continue;
        watching.delete(id);
        if (!c.id) { feedSays(id, 'Done (the card was moved or renamed: reload to see it).', 'done'); continue; }
        replaceCard(id, c.html, c.status);
        feedSays(id, c.did || 'Done.', /^(couldn't|it failed|did nothing)/.test(c.did || '') ? 'bad' : 'done');
        if (open === id) render();
      } catch (e) {}
    }
  }, 3000);

  // Dictating, where the browser can (Chrome, Edge; the user, 15 Nov: "Definitely need that [mic] thing for ... that
  // brain dump thing as well"): one mic, into whichever box it was put on for, the open card's or the inbox's. Said on
  // its own: "next" sends the card's and goes on, "back" goes back, "inbox" sends what's in the box to the inbox;
  // "drop it in" or "send" sends the inbox's. Windows' own dictation (Win+H) types into any box.
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  const mics = $$('.mic');
  let rec = null, into = null;
  const showMic = () => mics.forEach((m) => {
    const on = !!rec && m.dataset.for === (into === box ? 'card' : 'inbox');
    m.classList.toggle('on', on); m.textContent = on ? 'Mic on (M)' : 'Mic (M)';
  });
  // The browser's listening stops by itself after a pause (Edge's after every phrase), and what it had half heard was
  // lost with it (the user, 15 Nov: "it cuts off insanely quickly"). So what it's hearing is shown as it's said, kept
  // if it stops before it's sure, and it's started again at once.
  let heard = ''; // said, not yet settled
  const showHeard = () => $$('.heard, .wave').forEach((h) => {
    const mine = !!rec && h.dataset.for === (into === box ? 'card' : 'inbox');
    h.hidden = !mine;
    if (h.matches('.heard')) h.textContent = heard ? heard + ' ...' : 'Listening...';
  });
  // A wave of your voice while it listens, so it's plain it's on (the user, 15 Nov: "it shows like the wavy ... line.
  // It's a lot clearer that things are going"): the microphone's level, a bar a moment, scrolling. If the level can't be
  // read, a gentle wave still shows it's on.
  let meter = null;
  async function waveOn() {
    if (meter) return;
    meter = { levels: [], stop: () => {} };
    const m = meter;
    let read = () => 0.25 + 0.2 * Math.sin(Date.now() / 180); // no level to read: a gentle wave
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (meter !== m) { stream.getTracks().forEach((t) => t.stop()); return; }
      const ctx = new AudioContext(), an = ctx.createAnalyser();
      an.fftSize = 512; ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      read = () => { an.getByteTimeDomainData(buf); let s = 0; for (const v of buf) s += ((v - 128) / 128) ** 2; return Math.min(1, Math.sqrt(s / buf.length) * 4); };
      m.stop = () => { stream.getTracks().forEach((t) => t.stop()); ctx.close(); };
    } catch (e) {}
    const draw = () => {
      if (meter !== m) return;
      m.levels.push(read()); if (m.levels.length > 40) m.levels.shift();
      const c = $$('.wave').find((w) => !w.hidden);
      if (c) {
        const g = c.getContext('2d'), w = c.width, h = c.height, bw = w / 40;
        g.clearRect(0, 0, w, h); g.fillStyle = getComputedStyle(c).color;
        m.levels.forEach((l, i) => { const bh = Math.max(2, l * h); g.fillRect(w - (m.levels.length - i) * bw + 1, (h - bh) / 2, bw - 2, bh); });
      }
      requestAnimationFrame(draw);
    };
    draw();
  }
  const waveOff = () => { meter?.stop(); meter = null; };
  // The boxes grow with what's said, to most of the panel, then scroll.
  const fit = (t) => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px'; t.scrollTop = t.scrollHeight; };
  function said(text) {
    const words = text.trim(), word = words.toLowerCase().replace(/[.!?]$/, '');
    if (!words || !into) return;
    if (into === box && (word === 'next' || word === 'next card')) return send(true);
    if (into === box && (word === 'back' || word === 'previous')) return step(-1);
    if (into === box && word === 'inbox') return box.value.trim() && dropIt(box);
    if (into === drop.text && (word === 'drop it in' || word === 'send')) return dropIt();
    into.value = (into.value ? into.value.replace(/\s*$/, ' ') : '') + words;
    fit(into);
  }
  const keepHeard = () => { if (heard) { said(heard); heard = ''; } };
  const micOff = () => {
    keepHeard();
    if (rec) { rec.onend = null; rec.onresult = null; rec.abort(); }
    rec = null; into = null; showMic(); showHeard(); waveOff();
  };
  function toggleMic(target) {
    if (rec && into === target) return micOff();
    keepHeard(); // anything half heard goes in the box it was said for
    into = target; showMic();
    if (document.activeElement?.matches?.('textarea')) document.activeElement.blur(); // the mic writes; the keys stay keys
    if (rec) return showHeard(); // already listening: now into the other box
    rec = new Speech(); rec.continuous = true; rec.interimResults = true; rec.lang = 'en-GB';
    rec.onresult = (e) => {
      let half = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) said(e.results[i][0].transcript);
        else half += e.results[i][0].transcript;
      }
      heard = half.trim(); showHeard();
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return; // a quiet spell: it carries on
      micOff(); // refused, no microphone, no network: it's off, not trying again and again
      tell(e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? "The mic isn't allowed here: allow it in the browser's address bar, or use Win+H." : 'The mic stopped: ' + e.error);
    };
    const again = () => { try { rec?.start(); } catch (e) { setTimeout(() => { try { rec?.start(); } catch (e2) {} }, 250); } };
    rec.onend = () => { keepHeard(); showHeard(); again(); }; // it stopped by itself: keep what it heard, listen again
    rec.start(); showMic(); showHeard(); waveOn();
  }
  if (Speech) mics.forEach((m) => {
    m.hidden = false;
    m.addEventListener('click', () => toggleMic(m.dataset.for === 'card' ? box : drop.text));
  });
  // A card linked to (#its-id) opens.
  const follow = () => { const id = decodeURIComponent(location.hash.slice(1)); if (id && id !== open && cardEl(id)) openCard(id); };
  follow();
  window.addEventListener('hashchange', follow);

  // The inbox: what's dropped in is a card at once, then sorted by a headless Claude (tools/inbox-triage.md); the
  // board watches it, and once it's been put where it goes draws itself again, unless you're busy (a card open, the
  // mic on, something half written), when it says so instead.
  const drop = $('.drop'), sorting = $('.sorting', drop);
  [box, drop.text].forEach((t) => t.addEventListener('input', () => fit(t)));
  async function dropIt(from = drop.text) {
    if (into === from) keepHeard();
    const text = from.value.trim();
    if (!text) return;
    if (!served) { notServed('drop things in'); return; }
    let id;
    try { id = (await post('/api/inbox', { text })).id; } catch (err) { served ? tell('Not dropped in: ' + err.message) : notServed('drop things in'); return; }
    from.value = ''; fit(from);
    if (from === box && open) delete draft[open];
    feedLine(id, 'Inbox', text);
    feedSays(id, 'In the inbox. Sorting it...', 'saved');
    sorting.hidden = true;
    const started = Date.now();
    const watch = setInterval(async () => {
      try {
        const c = await (await fetch('/api/card?id=' + encodeURIComponent(id))).json();
        const last = (c.log || '').split('\n').pop().replace(/^- /, '');
        if (!c.busy && (c.status !== 'inbox' || /left in the inbox|failed|couldn't start/.test(last))) {
          clearInterval(watch);
          replaceCard(id, c.html, c.status);
          // (what it made elsewhere shows on a reload: offered, never forced, so this list and your place stay)
          feedSays(id, (c.did || last) + ' Reload to see it on the board.', c.status === 'inbox' ? 'bad' : 'done');
        } else if (Date.now() - started > 10 * 60e3) { clearInterval(watch); feedSays(id, 'Still sorting; it will be on the board when you reload.', 'saved'); }
      } catch (err) {}
    }, 3000);
  }
  drop.addEventListener('submit', (e) => { e.preventDefault(); dropIt(); });
})();
