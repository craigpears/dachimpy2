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
//   node tools/task.mjs stream <stream> "<where it got to>"
//   node tools/task.mjs board                             draws tasks/board.html (add, set, note and stream draw it too)
//
// npm run task -- <the same>. Ids are the card's file name, without .md; any unique part of one will do.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const TASKS = join(ROOT, 'tasks');
export const STATUSES = {
  asked: 'Asked',
  ready: 'Ready to start',
  doing: 'Being done',
  review: 'For you to review',
  playtest: 'For you to playtest',
  done: 'Done',
  parked: 'Parked',
};
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
  const entry = `- ${today()}: ${line}`;
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

/** The board: a column a status, a card a task, coloured by stream, filtered by stream, its streams' notes above. */
export function board({ streams, cards }, when = new Date()) {
  const hue = Object.fromEntries(streams.map((s) => [s.id, s.hue]));
  const name = Object.fromEntries(streams.map((s) => [s.id, s.name]));
  const card = (c) => {
    const m = c.meta, link = m.link ? `<a class="go" href="${esc(LOCAL + m.link)}">Local</a><a class="go" href="${esc(LIVE + m.link)}">Live</a>` : '';
    const shot = m.shot ? `<a class="shot" href="${esc('../' + m.shot)}"><img src="${esc('../' + m.shot)}" alt="" loading="lazy"></a>` : '';
    const who = [m.session ? `session <code>${esc(m.session)}</code>` : '', m.branch ? `branch <code>${esc(m.branch)}</code>` : ''].filter(Boolean).join(' · ');
    return `<article class="card" data-stream="${esc(c.stream)}" style="--h:${hue[c.stream] ?? 30}">
  ${shot}<div class="tag">${esc(name[c.stream] ?? c.stream)}</div>
  <h3>${esc(m.title || c.id)}</h3>
  <div class="when">${m.asked ? `asked ${esc(m.asked)}` : ''}${m.updated ? ` · updated ${esc(m.updated)}` : ''}</div>
  ${link ? `<div class="links">${link}</div>` : ''}
  <details><summary>More</summary>${md(c.body)}${who ? `<p class="who">${who}</p>` : ''}<p class="id"><code>${esc(c.id)}</code></p></details>
</article>`;
  };
  const cols = Object.entries(STATUSES).map(([st, label]) => {
    const here = cards.filter((c) => (c.meta.status || 'asked') === st);
    return `<section class="col" data-status="${st}"><h2>${esc(label)} <span>${here.length}</span></h2>${here.map(card).join('\n')}</section>`;
  }).join('\n');
  const chips = streams.map((s) => `<button class="chip" data-stream="${esc(s.id)}" style="--h:${s.hue}">${esc(s.name)} <span>${cards.filter((c) => c.stream === s.id && !['done', 'parked'].includes(c.meta.status)).length}</span></button>`).join('');
  const notes = streams.filter((s) => s.where).map((s) => `<div class="stream" data-stream="${esc(s.id)}" style="--h:${s.hue}"><b>${esc(s.name)}</b>${md(s.where)}</div>`).join('');
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
  .where > summary { color: var(--dim); font-size: 13px; margin-bottom: 8px; }
  .streams { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }
  .stream { border-left: 3px solid hsl(var(--h) 55% 55%); background: var(--tile); padding: 6px 10px; border-radius: 4px; font-size: 13px; color: var(--dim); }
  .stream b { color: var(--text); }
  .stream p { margin: 4px 0 0; }
  .cols { display: flex; gap: 10px; overflow-x: auto; padding: 0 16px 24px; align-items: flex-start; }
  .col { flex: 0 0 270px; background: var(--well); border: 1px solid var(--edge); border-radius: 8px; padding: 8px; }
  .col h2 { margin: 2px 4px 8px; font-size: 14px; color: var(--dim); }
  .col h2 span { color: var(--faint); font-weight: 400; }
  .col[data-status="playtest"] { border-color: var(--accent); }
  .col[data-status="playtest"] h2, .col[data-status="review"] h2 { color: var(--accent-text); }
  .card { background: var(--bg); border: 1px solid var(--edge); border-left: 4px solid hsl(var(--h) 55% 55%); border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; }
  .card h3 { margin: 2px 0; font-size: 14.5px; color: var(--title); }
  .tag { font-size: 11.5px; color: hsl(var(--h) 60% 72%); }
  .when { font-size: 12px; color: var(--faint); }
  .links { display: flex; gap: 6px; margin-top: 6px; }
  .go { background: var(--accent); color: var(--on-accent); text-decoration: none; border-radius: 4px; padding: 2px 8px; font-size: 12.5px; font-weight: 600; }
  .shot img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 4px; display: block; margin-bottom: 6px; }
  details { margin-top: 6px; font-size: 13px; color: var(--dim); }
  summary { cursor: pointer; color: var(--faint); }
  details p, details ul { margin: 6px 0; }
  details ul { padding-left: 18px; }
  details h4 { margin: 8px 0 2px; font-size: 12.5px; color: var(--text); }
  code { font-size: 12px; color: var(--accent-text); }
  a { color: var(--accent-text); }
  .who, .id { color: var(--faint); font-size: 12px; }
  @media (max-width: 640px) { .cols { flex-direction: column; } .col { flex: none; width: 100%; box-sizing: border-box; } }
</style></head>
<body>
<header><h1>Task board</h1><span class="made">Drawn ${esc(today(when))}, ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')} from tasks/ by tools/task.mjs</span></header>
<div class="chips"><button class="chip on" data-stream="" style="--h:30">Every stream</button>${chips}</div>
<details class="where"><summary>Where each stream's got to</summary><div class="streams">${notes}</div></details>
<main class="cols">${cols}</main>
<script>
  const pick = (s) => {
    document.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b.dataset.stream === s));
    document.querySelectorAll('.card, .stream').forEach((c) => { c.hidden = !!s && c.dataset.stream !== s; });
    try { localStorage.setItem('board.stream', s); } catch (e) {}
  };
  document.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => pick(b.dataset.stream)));
  try { const s = localStorage.getItem('board.stream'); if (s) pick(s); } catch (e) {}
</script>
</body></html>
`;
}
export function drawBoard(dir = TASKS) {
  const out = join(dir, 'board.html');
  writeFileSync(out, board(load(dir)));
  return out;
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
    const sd = join(TASKS, stream);
    if (!existsSync(sd)) { mkdirSync(sd); writeFileSync(join(sd, '_stream.md'), format({ name: stream, hue: 30 }, '\n')); }
    let id = slug(title), n = 2;
    while (existsSync(join(sd, id + '.md'))) id = `${slug(title)}-${n++}`;
    const body = [opt.asked ? `**Asked:** ${opt.asked}` : '', opt.done ? `**Done looks like:** ${opt.done}` : ''].filter(Boolean).join('\n\n');
    writeFileSync(join(sd, id + '.md'), format({ title, status: status(opt.status || 'asked'), asked: today(), updated: today() }, `\n${body}\n\n## Log\n\n- ${today()}: added.\n`));
    console.log(`added ${stream}/${id}`);
  } else if (cmd === 'set' || cmd === 'note') {
    const c = find(all.cards, pos[0]);
    const meta = { ...c.meta, updated: today() };
    let body = c.body, what = [];
    if (cmd === 'set') { meta.status = status(pos[1]); what.push(STATUSES[meta.status].toLowerCase()); }
    for (const k of ['link', 'shot', 'session', 'branch', 'title']) if (k in opt) meta[k] = opt[k];
    const note = cmd === 'note' ? pos[1] : opt.note;
    if (note) what.push(note);
    if (what.length) body = logged(body, what.join(': '));
    writeFileSync(c.file, format(meta, body));
    console.log(line({ ...c, meta }));
  } else if (cmd === 'stream') {
    const s = all.streams.find((x) => x.id === pos[0]);
    if (!s) throw new Error(`No stream "${pos[0]}": ${all.streams.map((x) => x.id).join(', ')}`);
    const { meta } = existsSync(s.file) ? parse(readFileSync(s.file, 'utf8')) : { meta: { name: s.id, hue: 30 } };
    writeFileSync(s.file, format(meta, `\n${pos[1]} (${today()})\n`));
    console.log(`${s.id}: ${pos[1]}`);
  } else throw new Error(`Unknown command "${cmd}" (list, show, add, set, note, stream, board)`);
  drawBoard();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(1); }
}
