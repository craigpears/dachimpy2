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
  function openCard(id, keepOrder) {
    if (!keepOrder || !order.includes(id)) order = orderFrom(id);
    if (open !== id) box.value = draft[id] || '';
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
    if (e.code === 'KeyM') { // the mic on or off: into the open card's box, or the inbox's when no card's open
      if (!Speech) tell("This browser can't listen: open the board in Chrome or Edge, or use Win+H.");
      else toggleMic(e.target === drop.text || panel.hidden ? drop.text : box);
    } else if (panel.hidden) return;
    else if (e.key === 'ArrowRight' || e.code === 'KeyJ') step(1);
    else if (e.key === 'ArrowLeft' || e.code === 'KeyK') step(-1);
    else if (e.code === 'KeyN') send(true);
    else if (e.code === 'KeyI') { if (box.value.trim()) dropIt(box); }
    else if (e.key === 'Escape') shut();
    else if (e.key === 'Enter' || e.key === '/') { if (rec) return; box.focus(); }
    else if (n >= 1 && n <= STATUSES.length) moveTo(open, STATUSES[n - 1]);
    else return;
    e.preventDefault();
  });
  // A button clicked (Mic, Send, a status) doesn't keep the keys from working either.
  panel.addEventListener('click', (e) => { if (e.target.closest('button')) e.target.closest('button').blur(); });
  $('.drop').addEventListener('click', (e) => { if (e.target.closest('button')) e.target.closest('button').blur(); });

  // What's said about a card: logged on it at once, then acted on by a headless Claude; the card's redrawn when it's
  // finished (watched every few seconds).
  async function send(goOn) {
    const id = open, text = box.value.trim();
    if (!text) { if (goOn) step(1); return; }
    if (!served) { notServed('send updates'); return; }
    try { await post('/api/update', { id, text }); } catch (e) { served ? tell('Not sent: ' + e.message) : notServed('send updates'); return; }
    box.value = ''; delete draft[id];
    cardEl(id)?.classList.add('busy'); watching.add(id);
    tell('Logged on the card; acting on it now.');
    if (goOn) step(1); else render();
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
        const old = cardEl(id), t = document.createElement('template');
        t.innerHTML = c.html.trim();
        const fresh = t.content.firstElementChild;
        fresh.hidden = old?.hidden ?? false; wire(fresh);
        old?.remove();
        $(`.col[data-status="${c.status}"] .list`).prepend(fresh);
        count();
        if (open === id) render();
        else tell(`Updated: ${$('h3', fresh).textContent}`);
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
  const micOff = () => { if (rec) { rec.onend = null; rec.stop(); } rec = null; into = null; showMic(); };
  function toggleMic(target) {
    if (rec && into === target) return micOff();
    into = target; showMic();
    if (document.activeElement?.matches?.('textarea')) document.activeElement.blur(); // the mic writes; the keys stay keys
    if (rec) return; // already listening: now into the other box
    rec = new Speech(); rec.continuous = true; rec.interimResults = false; rec.lang = 'en-GB';
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;
        const said = e.results[i][0].transcript.trim(), word = said.toLowerCase().replace(/[.!?]$/, '');
        if (into === box && (word === 'next' || word === 'next card')) { send(true); continue; }
        if (into === box && (word === 'back' || word === 'previous')) { step(-1); continue; }
        if (into === box && word === 'inbox') { if (box.value.trim()) dropIt(box); continue; }
        if (into === drop.text && (word === 'drop it in' || word === 'send')) { dropIt(); continue; }
        into.value = (into.value ? into.value.replace(/\s*$/, ' ') : '') + said;
        into.scrollTop = into.scrollHeight;
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return; // a quiet spell: it carries on
      micOff(); // refused, no microphone, no network: it's off, not trying again and again
      tell(e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? "The mic isn't allowed here: allow it in the browser's address bar, or use Win+H." : 'The mic stopped: ' + e.error);
    };
    rec.onend = () => { try { rec?.start(); } catch (e) {} }; // it stops by itself after a pause; keep it on
    rec.start(); showMic();
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
  const busyHere = () => !panel.hidden || !!rec || !!drop.text.value.trim();
  async function dropIt(from = drop.text) {
    const text = from.value.trim();
    if (!text) return;
    if (!served) { notServed('drop things in'); return; }
    let id;
    try { id = (await post('/api/inbox', { text })).id; } catch (err) { served ? tell('Not dropped in: ' + err.message) : notServed('drop things in'); return; }
    from.value = '';
    if (from === box && open) delete draft[open];
    sorting.hidden = false; sorting.textContent = 'In the inbox. Sorting it...';
    tell('In the inbox. Sorting it...');
    const started = Date.now();
    const watch = setInterval(async () => {
      try {
        const c = await (await fetch('/api/card?id=' + encodeURIComponent(id))).json();
        const last = (c.log || '').split('\n').pop().replace(/^- /, '');
        if (!c.busy && (c.status !== 'inbox' || /left in the inbox|failed|couldn't start/.test(last))) {
          clearInterval(watch);
          if (busyHere()) {
            sorting.replaceChildren(last + ' ', Object.assign(document.createElement('a'), { href: location.href, textContent: 'Reload to see it on the board' }));
            tell('Sorted: ' + last);
          } else { sorting.textContent = last; setTimeout(() => location.reload(), 2500); }
        } else if (Date.now() - started > 10 * 60e3) { clearInterval(watch); sorting.textContent = 'Still sorting; it will be on the board when you reload.'; }
      } catch (err) {}
    }, 3000);
  }
  drop.addEventListener('submit', (e) => { e.preventDefault(); dropIt(); });
})();
