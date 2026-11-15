// The task board (the user, 14-15 Nov: "a Kanban style board ... a clear list of things and what their status is",
// "more deterministic ... I don't have to worry about how many tokens are being spent updating the board and
// rendering it"). The cards are plain files in tasks/ (tasks/README.md says how); this script is the only thing that
// changes their status or draws the board, so keeping it up to date is one short command, never a model's writing.
//
//   node tools/task.mjs list [--stream s] [--status st]   the cards, one line each
//   node tools/task.mjs show <id>                         one card in full (its brief, to start a session from)
//   node tools/task.mjs add <stream> "<title>" [--status st] [--asked "the user's words"] [--done "what done looks like"]
//   node tools/task.mjs set <id> <status> [--note "a line for its log"] [--link ?at=..] [--shot path] [--session id] [--branch b]
//   node tools/task.mjs note <id> "<a line for its log>"
//   node tools/task.mjs tidy <id> "<its new text>"           its text rewritten (made concise), its log kept
//   node tools/task.mjs stream <stream> "<where it got to>" [--name "Its name"] [--hue 0-360]
//   node tools/task.mjs move <id> <stream>                into another stream
//   node tools/task.mjs board                             draws tasks/board.html (add, set, note and stream draw it too)
//   node tools/task.mjs serve [--port n] [--pick-up no]   the board at http://localhost:8643/, cards dragged between
//                                                         columns there (each drop is a `set`, by this script)
//
// npm run task -- <the same>. Ids are the card's file name, without .md; any unique part of one will do.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync, renameSync } from 'node:fs';
import { join, dirname, relative, resolve, extname, sep } from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const TASKS = join(ROOT, 'tasks');
export const STATUSES = {
  inbox: 'Inbox',
  idea: 'Ideas',
  asked: 'Asked',
  ready: 'Ready to start',
  doing: 'Being done',
  review: 'For you to review',
  playtest: 'For you to playtest',
  done: 'Done',
};
export const PORT = 8643;
const LOCAL = 'http://localhost:8642/', LIVE = 'https://dachimpy2.dachimpy.workers.dev/';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const today = (d = new Date()) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

/** A file's `key: value` lines between its two `---`, and the rest. */
export function parse(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2] };
}
export function format(meta, body) {
  const lines = Object.entries(meta).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join('\n')}\n---\n${body.replace(/^\n+/, '\n')}`;
}

/** Every stream (a folder of tasks/, its `_stream.md`) and every card in them. */
export function load(dir = TASKS) {
  const streams = [], cards = [];
  for (const s of readdirSync(dir).sort()) {
    const sd = join(dir, s);
    if (!statSync(sd).isDirectory()) continue;
    const sf = join(sd, '_stream.md');
    const { meta, body } = existsSync(sf) ? parse(readFileSync(sf, 'utf8')) : { meta: {}, body: '' };
    streams.push({ id: s, name: meta.name || s, hue: Number(meta.hue ?? 30), where: body.trim(), file: sf });
    for (const f of readdirSync(sd).sort()) {
      if (!f.endsWith('.md') || f.startsWith('_')) continue;
      const file = join(sd, f), { meta: m, body: b } = parse(readFileSync(file, 'utf8'));
      cards.push({ id: f.slice(0, -3), stream: s, file, meta: m, body: b });
    }
  }
  return { streams, cards };
}

/** The card an id names (exactly, or the one card whose id contains it). */
function find(cards, id) {
  const exact = cards.find((c) => c.id === id);
  if (exact) return exact;
  const some = cards.filter((c) => c.id.includes(id));
  if (some.length === 1) return some[0];
  throw new Error(some.length ? `"${id}" could be: ${some.map((c) => c.id).join(', ')}` : `No card "${id}"`);
}
const slug = (t) => t.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
/** A card's log: its `## Log` list, a line added. */
function logged(body, line) {
  const entry = `- ${today()}: ${String(line).replace(/\s+/g, ' ').trim()}`; // one line, always: the log's read an entry a line
  return /^## Log/m.test(body) ? body.replace(/\s*$/, `\n${entry}\n`) : `${body.replace(/\s*$/, '')}\n\n## Log\n\n${entry}\n`;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
/** A little of a card's markdown as HTML: paragraphs, lists, **bold**, `code`, links. */
function md(text) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  const out = [];
  for (const block of text.trim().split(/\n\s*\n/)) {
    if (/^##\s/.test(block)) { out.push(`<h4>${inline(block.replace(/^##\s*/, ''))}</h4>`); continue; }
    const lines = block.split('\n');
    if (lines.every((l) => /^\s*-\s/.test(l) || /^\s{2,}\S/.test(l))) {
      const items = [];
      for (const l of lines) if (/^\s*-\s/.test(l)) items.push(l.replace(/^\s*-\s/, '')); else items[items.length - 1] += ' ' + l.trim();
      out.push(`<ul>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`);
    } else out.push(`<p>${inline(lines.join(' '))}</p>`);
  }
  return out.join('');
}

/** One card on the board: its stream, title, dates and links; everything else (what was asked, its log) kept in
 *  `.full`, read in the card's panel when it's opened. */
export function cardHtml(c, streams) {
  const s = streams.find((x) => x.id === c.stream);
  const m = c.meta, link = m.link ? `<a class="go" href="${esc(LOCAL + m.link)}">Local</a><a class="go" href="${esc(LIVE + m.link)}">Live</a>` : '';
  const shot = m.shot ? `<a class="shot" href="${esc('../' + m.shot)}"><img src="${esc('../' + m.shot)}" alt="" loading="lazy"></a>` : '';
  const who = [m.session ? `session <code>${esc(m.session)}</code>` : '', m.branch ? `branch <code>${esc(m.branch)}</code>` : ''].filter(Boolean).join(' · ');
  return `<article class="card" draggable="true" tabindex="0" data-id="${esc(c.id)}" data-stream="${esc(c.stream)}" data-status="${esc(m.status || 'asked')}" style="--h:${s?.hue ?? 30}">
  ${shot}<div class="tag">${esc(s?.name ?? c.stream)}</div>
  <h3>${esc(m.title || c.id)}</h3>
  <div class="when">${m.asked ? `asked ${esc(m.asked)}` : ''}${m.updated ? ` · updated ${esc(m.updated)}` : ''}</div>
  ${link ? `<div class="links">${link}</div>` : ''}
  <div class="full" hidden>${md(c.body)}${who ? `<p class="who">${who}</p>` : ''}<p class="id"><code>${esc(c.id)}</code></p></div>
</article>`;
}

/** The board: a column a status, a card a task, coloured by stream, filtered by stream, its streams' notes above; a
 *  card opened in a panel beside it, gone through one after another (tools/board-client.js does the clicking). */
export function board({ streams, cards }, when = new Date()) {
  const cols = Object.entries(STATUSES).map(([st, label]) => {
    const here = cards.filter((c) => (c.meta.status || 'asked') === st);
    const fold = st === 'done' ? `<button class="fold">Show them</button>` : '';
    return `<section class="col${st === 'done' ? ' folded' : ''}" data-status="${st}"><h2>${esc(label)} <span>${here.length}</span><button class="through" title="Open the first card and go through them one by one">Go through</button></h2>${fold}<div class="list">${here.map((c) => cardHtml(c, streams)).join('\n')}</div></section>`;
  }).join('\n');
  const chips = streams.map((s) => `<button class="chip" data-stream="${esc(s.id)}" style="--h:${s.hue}">${esc(s.name)} <span>${cards.filter((c) => c.stream === s.id && !['done', 'idea'].includes(c.meta.status)).length}</span></button>`).join('');
  const notes = streams.filter((s) => s.where).map((s) => `<div class="stream" data-stream="${esc(s.id)}" style="--h:${s.hue}"><b>${esc(s.name)}</b>${md(s.where)}</div>`).join('');
  const keys = Object.entries(STATUSES).map(([k, l], i) => `<button class="st" data-status="${k}"><kbd>${i + 1}</kbd>${esc(l)}</button>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Task board</title>
<script src="../js/theme.js"></script>
<link rel="stylesheet" href="../css/site.css">
<style>
  body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.45 system-ui, sans-serif; }
  header { padding: 16px; display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: baseline; }
  h1 { margin: 0; font-size: 22px; color: var(--title); }
  .made { color: var(--faint); font-size: 13px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 10px; }
  .chip { border: 1px solid hsl(var(--h) 45% 45%); background: hsl(var(--h) 35% 22% / .5); color: var(--text); border-radius: 99px; padding: 4px 10px; font: inherit; font-size: 13px; cursor: pointer; }
  .chip span { color: var(--dim); }
  .chip.on { background: hsl(var(--h) 45% 40%); }
  .where { margin: 0 16px 10px; }
  .where > summary { color: var(--dim); font-size: 13px; margin-bottom: 8px; cursor: pointer; }
  .streams { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }
  .stream { border-left: 3px solid hsl(var(--h) 55% 55%); background: var(--tile); padding: 6px 10px; border-radius: 4px; font-size: 13px; color: var(--dim); }
  .stream b { color: var(--text); }
  .stream p { margin: 4px 0 0; }
  .cols { display: flex; gap: 10px; overflow-x: auto; padding: 0 16px 24px; align-items: flex-start; }
  .col { flex: 0 0 270px; background: var(--well); border: 1px solid var(--edge); border-radius: 8px; padding: 8px; }
  .col h2 { margin: 2px 4px 8px; font-size: 14px; color: var(--dim); display: flex; align-items: baseline; gap: 6px; }
  .col h2 span { color: var(--faint); font-weight: 400; }
  .through { margin-left: auto; background: none; border: 1px solid var(--edge); color: var(--faint); border-radius: 4px; font: inherit; font-size: 11.5px; padding: 1px 6px; cursor: pointer; }
  .through:hover { color: var(--text); border-color: var(--accent); }
  .col[data-status="playtest"], .col[data-status="inbox"] { border-color: var(--accent); }
  .col[data-status="idea"] { border-style: dashed; }
  .col[data-status="playtest"] h2, .col[data-status="review"] h2 { color: var(--accent-text); }
  .card { background: var(--bg); border: 1px solid var(--edge); border-left: 4px solid hsl(var(--h) 55% 55%); border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; cursor: pointer; }
  .card:hover { border-color: hsl(var(--h) 55% 55%); }
  .card.open { outline: 2px solid var(--accent); outline-offset: 1px; }
  .card h3 { margin: 2px 0; font-size: 14.5px; color: var(--title); }
  .tag { font-size: 11.5px; color: hsl(var(--h) 60% 72%); }
  .when { font-size: 12px; color: var(--faint); }
  .links { display: flex; gap: 6px; margin-top: 6px; }
  .go { background: var(--accent); color: var(--on-accent); text-decoration: none; border-radius: 4px; padding: 2px 8px; font-size: 12.5px; font-weight: 600; }
  .shot img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 4px; display: block; margin-bottom: 6px; }
  .card.busy::after { content: 'Updating...'; display: block; margin-top: 4px; font-size: 12px; color: var(--accent-text); }
  code { font-size: 12px; color: var(--accent-text); }
  a { color: var(--accent-text); }
  .who, .id { color: var(--faint); font-size: 12px; }
  .drop { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; padding: 0 16px 10px; }
  .drop textarea, .update textarea { flex: 1 1 320px; min-height: 2.6em; background: var(--tile); color: var(--text); border: 1px solid var(--edge); border-radius: 6px; padding: 6px 8px; font: inherit; resize: vertical; box-sizing: border-box; }
  .drop button, .update .send { background: var(--accent); color: var(--on-accent); border: 0; border-radius: 6px; padding: 8px 14px; font: inherit; font-weight: 600; cursor: pointer; }
  .sorting { flex-basis: 100%; color: var(--dim); font-size: 13px; }
  .card.dragging { opacity: .45; }
  .col.over { outline: 2px dashed var(--accent); outline-offset: -2px; }
  .list { min-height: 40px; }
  .col.folded .list { display: none; }
  .fold { display: block; width: 100%; margin-bottom: 8px; background: var(--tile); color: var(--dim); border: 1px solid var(--edge); border-radius: 4px; padding: 4px; font: inherit; font-size: 13px; cursor: pointer; }
  .say { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); background: var(--tile); color: var(--text); border: 1px solid var(--edge); border-radius: 6px; padding: 8px 12px; font-size: 13.5px; max-width: calc(100% - 32px); box-sizing: border-box; z-index: 20; }
  /* A card opened: a panel down the right, the board still there beside it. */
  .panel { position: fixed; top: 0; right: 0; bottom: 0; width: min(560px, 100%); background: var(--bg); border-left: 1px solid var(--edge); box-shadow: -8px 0 24px rgb(0 0 0 / .35); display: flex; flex-direction: column; z-index: 10; box-sizing: border-box; }
  .panel[hidden] { display: none; }
  .panel .bar { display: flex; align-items: center; gap: 6px; padding: 10px 14px; border-bottom: 1px solid var(--edge); }
  .panel .bar .at { flex: 1; color: var(--faint); font-size: 13px; }
  .panel .bar button, .update button { background: var(--tile); color: var(--text); border: 1px solid var(--edge); border-radius: 4px; font: inherit; font-size: 13px; padding: 4px 10px; cursor: pointer; }
  .panel .read { flex: 1; overflow-y: auto; padding: 12px 16px; }
  .panel .read .card { border: 0; padding: 0; margin: 0; cursor: auto; background: none; outline: 0; }
  .panel .read .card::after { display: none; }
  .panel .read h3 { font-size: 19px; margin: 4px 0; }
  .panel .read .full { font-size: 14px; color: var(--text); }
  .panel .read .full p, .panel .read .full ul { margin: 8px 0; }
  .panel .read .full ul { padding-left: 20px; }
  .panel .read .full h4 { margin: 14px 0 4px; font-size: 13px; color: var(--dim); text-transform: uppercase; letter-spacing: .04em; }
  .panel .read .full h4 ~ ul { font-size: 13px; color: var(--dim); }
  .panel .read .shot img { aspect-ratio: auto; max-height: 300px; object-fit: contain; }
  .sts { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 14px; border-bottom: 1px solid var(--edge); }
  .st { background: var(--tile); color: var(--dim); border: 1px solid var(--edge); border-radius: 99px; font: inherit; font-size: 12.5px; padding: 3px 10px 3px 4px; cursor: pointer; }
  .st kbd { display: inline-block; min-width: 1.4em; margin-right: 5px; border-radius: 99px; background: var(--well); color: var(--faint); font: 11px/1.6 system-ui, sans-serif; text-align: center; }
  .st.on { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
  .st.on kbd { background: rgb(0 0 0 / .2); color: inherit; }
  .update { border-top: 1px solid var(--edge); padding: 10px 14px 12px; display: flex; flex-wrap: wrap; gap: 6px; }
  .update textarea { flex-basis: 100%; min-height: 4.2em; }
  .drop .mic { background: var(--tile); color: var(--text); border: 1px solid var(--edge); font-weight: 400; }
  .mic.on, .drop .mic.on { background: #b3261e; color: #fff; border-color: #b3261e; }
  /* A card open: the board moves over beside it, still scrolled and used, the inbox's box too. */
  @media (min-width: 900px) { .panel { width: min(560px, 45vw); } body.reading { padding-right: min(560px, 45vw); } }
  .update .hint { flex-basis: 100%; color: var(--faint); font-size: 12px; }
  .heard { flex: 1 1 200px; align-self: center; color: var(--accent-text); font-size: 13px; font-style: italic; }
  .wave { width: 120px; height: 18px; align-self: center; color: #e5484d; }
  .update textarea { min-height: 9em; max-height: 45vh; }
  .drop textarea { min-height: 3.2em; max-height: 40vh; }
  .update .send { padding: 4px 12px; font-size: 13px; }
  .update .gap { flex: 1; }
  @media (max-width: 640px) { .cols { flex-direction: column; } .col { flex: none; width: 100%; box-sizing: border-box; } }
</style></head>
<body data-port="${PORT}">
<header><h1>Task board</h1><span class="made">Drawn ${esc(today(when))}, ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')} from tasks/ by tools/task.mjs. Click a card to open it.</span></header>
<form class="drop"><textarea name="text" rows="2" placeholder="Drop something in: a fix, an idea, a thought. Sorted onto the board for you."></textarea><button type="button" class="mic" data-for="inbox" hidden title="Dictate into the inbox, on M (say &quot;drop it in&quot; to send it)">Mic (M)</button><button>Drop it in</button><canvas class="wave" data-for="inbox" width="240" height="36" hidden></canvas><span class="heard" data-for="inbox" hidden></span><span class="sorting" hidden></span></form>
<div class="chips"><button class="chip on" data-stream="" style="--h:30">Every stream</button>${chips}</div>
<details class="where"><summary>Where each stream's got to</summary><div class="streams">${notes}</div></details>
<main class="cols">${cols}</main>
<aside class="panel" hidden aria-label="The card opened">
  <div class="bar"><button class="prev" title="The card before (left arrow)">&larr;</button><button class="next" title="The next card (right arrow)">&rarr;</button><span class="at"></span><button class="shut" title="Close (Esc)">Close</button></div>
  <div class="sts">${keys}</div>
  <div class="read"></div>
  <form class="update"><textarea name="text" placeholder="Say or type what's changed: &quot;that works now&quot;, &quot;still slow when you turn&quot;, &quot;split the guns off into their own card&quot;..."></textarea>
    <canvas class="wave" data-for="card" width="240" height="36" hidden></canvas><span class="heard" data-for="card" hidden></span><button type="button" class="mic" data-for="card" hidden title="Dictate, on M (say &quot;next&quot; to send and go on)">Mic (M)</button><button type="button" class="toinbox" title="Not about this card: what's in the box to the inbox instead (say &quot;inbox&quot;)">To the inbox</button><span class="gap"></span>
    <button type="submit" class="send" name="stay">Send</button><button type="submit" class="send" name="on">Send and next</button>
    <span class="hint">Keys, working while the mic's on: M the mic, N send and next, &larr; &rarr; go through, 1-${Object.keys(STATUSES).length} move it, I to the inbox, Esc close. To type instead, click in the box (Esc to leave it; Ctrl+Enter sends). What you send is logged on the card and a headless Claude acts on it (moves it, splits it, notes it).</span></form>
</aside>
<script src="../tools/board-client.js"></script>
</body></html>
`;
}
export function drawBoard(dir = TASKS) {
  const out = join(dir, 'board.html');
  writeFileSync(out, board(load(dir)));
  return out;
}

/** A new card: in its stream (made if new), its id from its title, what was asked and what done looks like. */
export function addCard(stream, title, opt = {}, dir = TASKS) {
  const st = opt.status || 'asked';
  if (!(st in STATUSES)) throw new Error(`Status is one of: ${Object.keys(STATUSES).join(', ')}`);
  if (!/^[a-z0-9-]+$/.test(stream)) throw new Error(`A stream is a folder name: "${stream}"`);
  const sd = join(dir, stream);
  if (!existsSync(sd)) { mkdirSync(sd); writeFileSync(join(sd, '_stream.md'), format({ name: stream, hue: 30 }, '\n')); }
  let id = opt.id || slug(title) || 'card', n = 2;
  const base = id;
  while (existsSync(join(sd, id + '.md'))) id = `${base}-${n++}`;
  const body = [opt.asked ? `**Asked:** ${opt.asked}` : '', opt.done ? `**Done looks like:** ${opt.done}` : ''].filter(Boolean).join('\n\n');
  const meta = { title, status: st, asked: today(), updated: today() };
  writeFileSync(join(sd, id + '.md'), format(meta, `\n${body}\n\n## Log\n\n- ${today()}: added.\n`));
  return { id, stream, file: join(sd, id + '.md'), meta };
}

/** A card changed: its status (logged), any of its fields, a line for its log. The one way a card's changed. */
export function change(cards, id, status, opt = {}) {
  const c = find(cards, id);
  const meta = { ...c.meta, updated: today() };
  const what = [];
  if (status !== undefined) {
    if (!(status in STATUSES)) throw new Error(`Status is one of: ${Object.keys(STATUSES).join(', ')}`);
    meta.status = status; what.push(STATUSES[status].toLowerCase());
  }
  for (const k of ['link', 'shot', 'session', 'branch', 'title']) if (k in opt) meta[k] = opt[k];
  if (opt.note) what.push(opt.note);
  const body = what.length ? logged(c.body, what.join(': ')) : c.body;
  writeFileSync(c.file, format(meta, body));
  return { ...c, meta, body };
}

/** A card's text rewritten (tidied, made concise), its log kept and the tidy logged; the old text is in git history. */
export function tidy(cards, id, text) {
  const c = find(cards, id);
  const body = String(text ?? '').trim();
  if (!body) throw new Error('tidy <id> "<the card\'s new text>"');
  const log = c.body.match(/\n## Log\n[^]*$/)?.[0] ?? '\n## Log\n';
  writeFileSync(c.file, format({ ...c.meta, updated: today() }, logged(`\n${body}\n${log}`, 'tidied up (the old text is in git history)')));
  return c;
}

/** Something dropped in the inbox: a card of its own in tasks/inbox/, what was written its Asked. */
export function dropIn(text, dir = TASKS, when = new Date()) {
  const words = String(text ?? '').trim();
  if (!words) throw new Error('Nothing to drop in');
  const title = words.replace(/\s+/g, ' ').slice(0, 70).replace(/\s\S*$/, (m) => (words.length > 70 ? '...' : m));
  const stamp = `${when.getFullYear()}${String(when.getMonth() + 1).padStart(2, '0')}${String(when.getDate()).padStart(2, '0')}-${String(when.getHours()).padStart(2, '0')}${String(when.getMinutes()).padStart(2, '0')}${String(when.getSeconds()).padStart(2, '0')}`;
  if (!existsSync(join(dir, 'inbox'))) { mkdirSync(join(dir, 'inbox')); writeFileSync(join(dir, 'inbox', '_stream.md'), format({ name: 'Inbox', hue: 0 }, '\nWhat you drop in, before it\'s sorted.\n')); }
  return addCard('inbox', title, { status: 'inbox', asked: words.replace(/\r?\n/g, ' '), id: `inbox-${stamp}` }, dir);
}

export const TRIAGE = join(ROOT, 'tools', 'inbox-triage.md');
export const UPDATE = join(ROOT, 'tools', 'card-update.md');
const TOOLS = ['Read', 'Grep', 'Glob', 'Edit', 'Bash(node tools/task.mjs:*)'].join(',');
/** The cards a headless Claude is working on right now (the board shows them as updating). */
export const busy = new Set();
/** A headless Claude (Sonnet) given a prompt, allowed only the task script, reading and editing documents; done(why)
 *  when it's finished, why saying what went wrong, if anything did. Three at a time at most, the rest waiting their
 *  turn (going through the board quickly sends many). */
/** The server's environment without node_modules/.bin on the path. `npm run board:serve` puts it first, and the local
 *  Node 22 kept there for Wrangler (CLAUDE.md) answers to `node` with a shim, so the headless Claude's `node
 *  tools/task.mjs` never ran and it stopped to ask for approval nobody could give (15 Nov). */
export function plainEnv(env = process.env) {
  const out = { ...env };
  for (const k of Object.keys(out)) {
    if (k.toLowerCase() !== 'path') continue;
    out[k] = out[k].split(process.platform === 'win32' ? ';' : ':').filter((p) => !/node_modules[\\/]\.bin/.test(p)).join(process.platform === 'win32' ? ';' : ':');
  }
  return out;
}
const MAX_RUNS = 3, waiting = [];
let running = 0;
function headless(id, prompt, done, run) {
  busy.add(id);
  const go = () => {
    running++;
    let out = '', ended = false;
    const end = (why) => { if (ended) return; ended = true; running--; busy.delete(id); done(why, out); waiting.shift()?.(); };
    const child = run('claude', ['-p', '--model', 'sonnet', '--allowedTools', TOOLS], { cwd: ROOT, env: plainEnv(), stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    child.on('error', (e) => end(`couldn't start Claude: ${e.message}`));
    child.stdout?.on('data', (d) => { out += d; });
    child.stderr?.on('data', (d) => { out += d; });
    child.on('close', (code) => end(code ? `it failed (${code}): ${out.trim().slice(-300)}` : ''));
    child.stdin?.end(prompt);
    return child;
  };
  if (running < MAX_RUNS) return go();
  waiting.push(go);
  return null;
}
const fill = (file, card, words = '') => readFileSync(file, 'utf8').replaceAll('{{card}}', `${card.stream}/${card.id}`)
  .replaceAll('{{id}}', card.id).replaceAll('{{words}}', words);

/** An inbox card sorted by a headless Claude (tools/inbox-triage.md says how): into a card, an idea or a document,
 *  the inbox card then done. If it couldn't, the inbox card says why and stays in the inbox. */
export function triage(card, run = spawn) {
  console.log(`sorting ${card.id}`);
  return headless(card.id, fill(TRIAGE, card), (why, out) => {
    const now = load().cards.find((x) => x.id === card.id);
    if (now && now.meta.status === 'inbox') change(load().cards, card.id, undefined, { note: why ? `sorting ${why}` : `left in the inbox: ${out.trim().slice(-300)}` });
    drawBoard();
    console.log(`sorted ${card.id}`);
  }, run);
}

/** What the user said about a card as they went through the board: logged on it straight away, in their words, then
 *  acted on by a headless Claude (tools/card-update.md: its status, its title, new cards split off, a document). */
export function update(cards, id, text, run = spawn) {
  const words = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!words) throw new Error('Nothing said');
  const c = change(cards, id, undefined, { note: `you said: "${words}"` });
  act(c, words, run);
  return c;
}
function act(c, words, run) {
  console.log(`updating ${c.id}`);
  headless(c.id, fill(UPDATE, c, words), (why, out) => {
    // Done nothing to it? Say so, with what it said, rather than leave the card looking forgotten.
    const now = load().cards.find((x) => x.id === c.id);
    if (!why && now && now.body.trim().endsWith(`you said: "${words}"`)) why = `did nothing: ${out.trim().slice(-300)}`;
    if (why && now) change(load().cards, c.id, undefined, { note: `acting on it ${why}` }); // (gone? moved while it ran)
    drawBoard();
    console.log(`updated ${c.id}${why ? ': ' + why : ''}`);
  }, run);
}

/** Anything left unanswered when the server stopped mid-run (restarted, closed), picked up again when it starts: a card
 *  whose last line is still what you said, an inbox card not yet sorted. */
export function resume(run = spawn, dir = TASKS) {
  const picked = [];
  for (const c of load(dir).cards) {
    // its log an entry each (older failure notes ran over several lines)
    const log = (c.body.split(/^## Log\s*$/m)[1] ?? '').trim().split(/\n(?=- )/).filter(Boolean);
    // what you said last, with nothing after it but one failed try (the runs that failed before 15 Nov's fix, retried once)
    const at = log.findLastIndex((l) => /^- [^:]+: you said: "/.test(l)), after = at < 0 ? [] : log.slice(at + 1);
    const said = at >= 0 && after.length <= 1 && after.every((l) => /^- [^:]+: acting on it /.test(l)) ? log[at].match(/^- [^:]+: you said: "([^]*)"\s*$/)?.[1] : undefined;
    if (said) { act(c, said, run); picked.push(c.id); }
    else if (c.meta.status === 'inbox' && /^- [^:]+: added\.$/.test(log[0] ?? '')
      // not yet sorted; or sorted once and failed (the runs before 15 Nov's fix), retried once
      && (log.length === 1 || (log.length === 2 && /^- [^:]+: (left in the inbox|sorting )/.test(log[1])))) { triage(c, run); picked.push(c.id); }
  }
  return picked;
}

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
/** The board served from this machine only, drawn fresh on every look: a card moved by POST /api/move {id, status},
 *  something dropped in by POST /api/inbox {text}, what's said about a card by POST /api/update {id, text}. */
export function serve(port = PORT, { pickUp = true } = {}) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'POST' && url.pathname === '/api/move') {
      let data = '';
      req.on('data', (d) => { data += d; if (data.length > 4096) req.destroy(); });
      req.on('end', () => {
        try {
          const { id, status } = JSON.parse(data);
          const c = change(load().cards, String(id), String(status), { note: 'moved on the board' });
          drawBoard();
          res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ id: c.id, status: c.meta.status }));
          console.log(`moved ${c.stream}/${c.id} to ${c.meta.status}`);
        } catch (e) { res.writeHead(400, { 'content-type': 'text/plain' }).end(e.message); }
      });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/inbox') {
      let data = '';
      req.on('data', (d) => { data += d; if (data.length > 64 * 1024) req.destroy(); });
      req.on('end', () => {
        try {
          const c = dropIn(JSON.parse(data).text);
          triage(c);
          res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ id: c.id }));
        } catch (e) { res.writeHead(400, { 'content-type': 'text/plain' }).end(e.message); }
      });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/update') {
      let data = '';
      req.on('data', (d) => { data += d; if (data.length > 64 * 1024) req.destroy(); });
      req.on('end', () => {
        try {
          const { id, text } = JSON.parse(data);
          const c = update(load().cards, String(id), text);
          res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ id: c.id }));
        } catch (e) { res.writeHead(400, { 'content-type': 'text/plain' }).end(e.message); }
      });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/card') {
      const all = load(), c = all.cards.find((x) => x.id === url.searchParams.get('id'));
      res.writeHead(c ? 200 : 404, { 'content-type': 'application/json', 'cache-control': 'no-store' })
        .end(JSON.stringify(c ? { id: c.id, status: c.meta.status, log: c.body.split('## Log')[1]?.trim() ?? '', busy: busy.has(c.id), html: cardHtml(c, all.streams) } : {}));
      return;
    }
    if (req.method !== 'GET') { res.writeHead(405).end(); return; }
    if (url.pathname === '/' || url.pathname === '/tasks/board.html') {
      if (url.pathname === '/') { res.writeHead(302, { location: '/tasks/board.html' }).end(); return; }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(board(load()));
      return;
    }
    // The board's stylesheet, theme and screenshots, from the repo; nothing outside it.
    const file = resolve(ROOT, '.' + decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT + sep) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream' }).end(readFileSync(file));
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`The board: http://localhost:${port}/ (Ctrl+C to stop)`);
    const picked = pickUp ? resume() : [];
    if (picked.length) console.log(`picked up again, left unanswered when it last stopped: ${picked.join(', ')}`);
  });
  return server;
}

function args(argv) {
  const pos = [], opt = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[++i] ?? '';
    else pos.push(argv[i]);
  }
  return { pos, opt };
}
function main(argv) {
  const { pos: [cmd, ...pos], opt } = args(argv);
  const all = load();
  const line = (c) => `${(c.meta.status || 'asked').padEnd(8)} ${c.stream.padEnd(16)} ${c.id}  ${c.meta.title || ''}`;
  const status = (s) => { if (!(s in STATUSES)) throw new Error(`Status is one of: ${Object.keys(STATUSES).join(', ')}`); return s; };
  if (!cmd || cmd === 'list') {
    for (const c of all.cards.filter((c) => (!opt.stream || c.stream === opt.stream) && (!opt.status || (c.meta.status || 'asked') === opt.status))) console.log(line(c));
    return;
  }
  if (cmd === 'show') { const c = find(all.cards, pos[0]); console.log(relative(ROOT, c.file) + '\n' + readFileSync(c.file, 'utf8')); return; }
  if (cmd === 'board') { console.log(relative(ROOT, drawBoard())); return; }
  if (cmd === 'add') {
    const [stream, title] = pos;
    if (!stream || !title) throw new Error('add <stream> "<title>"');
    const c = addCard(stream, title, opt);
    console.log(`added ${c.stream}/${c.id}`);
  } else if (cmd === 'set' || cmd === 'note') {
    const c = change(all.cards, pos[0], cmd === 'set' ? pos[1] : undefined, { ...opt, note: cmd === 'note' ? pos[1] : opt.note });
    console.log(line(c));
  } else if (cmd === 'tidy') {
    const c = tidy(all.cards, pos[0], pos[1]);
    console.log(`tidied ${c.stream}/${c.id}`);
  } else if (cmd === 'move') {
    const c = find(all.cards, pos[0]);
    // (a stream that isn't there yet is made, as add makes one: named and described with `stream` after)
    if (!/^[a-z0-9-]+$/.test(pos[1] ?? '')) throw new Error(`A stream is a folder name: "${pos[1]}"`);
    if (!existsSync(join(TASKS, pos[1]))) { mkdirSync(join(TASKS, pos[1])); writeFileSync(join(TASKS, pos[1], '_stream.md'), format({ name: pos[1], hue: 30 }, '\n')); }
    let id = c.id, n = 2;
    while (existsSync(join(TASKS, pos[1], id + '.md'))) id = `${c.id}-${n++}`;
    renameSync(c.file, join(TASKS, pos[1], id + '.md'));
    console.log(`${c.stream}/${c.id} -> ${pos[1]}/${id}`);
  } else if (cmd === 'serve') {
    serve(Number(opt.port) || PORT, { pickUp: opt['pick-up'] !== 'no' });
    return;
  } else if (cmd === 'stream') {
    const s = all.streams.find((x) => x.id === pos[0]);
    if (!s) throw new Error(`No stream "${pos[0]}": ${all.streams.map((x) => x.id).join(', ')}`);
    const { meta } = existsSync(s.file) ? parse(readFileSync(s.file, 'utf8')) : { meta: { name: s.id, hue: 30 } };
    if (opt.name) meta.name = opt.name;
    if (opt.hue) meta.hue = Number(opt.hue);
    writeFileSync(s.file, format(meta, `\n${pos[1]} (${today()})\n`));
    console.log(`${s.id}: ${pos[1]}`);
  } else throw new Error(`Unknown command "${cmd}" (list, show, add, set, note, tidy, move, stream, board, serve)`);
  drawBoard();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(1); }
}
