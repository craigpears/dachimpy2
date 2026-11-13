// Distilling: positions to critique (distilling-positions.html). Hand-written, not compiled. Draws each of
// src/distill-positions.ts's positions (js/distill-positions.js) flat, as the read version draws its boards (its
// `board`, from js/distill-guide-view.js, whose own drawing finds nothing to fill on this page but sets up the
// pieces' colours), with the bot's move as numbered arrows, the column it's filling shaded, its phase and reason,
// how it reads the board (its state and tactic, src/distill-read.ts), and any verdicts the user has given there (or
// that they skipped it).
import { board } from './distill-guide-view.js';
import { MOMENTS, POSITIONS, SKIPPED, VERDICTS } from './distill-positions.js';
import { STATES, TACTICS } from './distill-read.js';
import { PHASES } from './distill-phase.js';

const NS = 'http://www.w3.org/2000/svg';
const CELL = 40;
const html = (tag, attrs = {}, text) => { const e = document.createElement(tag); Object.assign(e, attrs); if (text !== undefined) e.textContent = text; return e; };
const secs = (ms) => `${(ms / 1000).toFixed(1)} s`;
const levelLabel = (name) => name.replace(/^cc/, 'CC^');
const parse = (cols) => cols.map((s) => [...s].map((ch) => 'wbK*x'.indexOf(ch)));
const KIND = { wait: 'Waits', burn: 'Burns the column now', dismiss: 'Cashes in' };

/** The board, its columns numbered 1 to 10 above it, so a column can be named in chat. */
function drawn(p) {
  const cols = parse(p.cols), bot = p.bot;
  const svg = board({ cols, drags: bot.drags, shade: bot.column !== undefined ? [bot.column] : [], rings: [], burn: bot.kind === 'burn' },
    `${p.id}: the board, and the bot's move drawn on it`);
  const [x0, y0, w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
  svg.setAttribute('viewBox', `${x0} ${y0 - 18} ${w} ${h + 18}`);
  cols.forEach((_, x) => {
    const t = document.createElementNS(NS, 'text');
    Object.entries({ x: 24 + x * CELL, y: -3, 'text-anchor': 'middle', class: 'colnum' }).forEach(([k, v]) => t.setAttribute(k, v));
    t.textContent = String(x + 1);
    svg.appendChild(t);
  });
  return svg;
}

function position(p) {
  const bot = p.bot, a = html('article', { id: p.id.toLowerCase() });
  const h = html('h3');
  h.appendChild(html('span', { className: 'pid' }, p.id));
  h.appendChild(document.createTextNode(MOMENTS[p.moment]));
  a.appendChild(h);
  a.appendChild(html('p', { className: 'what' }, p.what));
  const fig = html('figure', { className: 'pic' });
  fig.appendChild(drawn(p));
  fig.appendChild(html('figcaption', {}, bot.drags.length > 1 ? 'The bot\'s drags, in order: 1 first. A dot where each is picked up, an arrow where it\'s let go.'
    : bot.drags.length ? 'The bot\'s drag: a dot where it\'s picked up, an arrow where it\'s let go.' : 'The bot makes no drag here.'));
  a.appendChild(fig);
  const dl = html('dl');
  const row = (k, v) => { dl.appendChild(html('dt', {}, k)); dl.appendChild(html('dd', {}, v)); };
  row('Phase', `${PHASES[bot.phase]?.label ?? bot.phase}: ${PHASES[bot.phase]?.plan ?? ''}`);
  // The board read (src/distill-read.ts): its state, the tactic in play, and why.
  if (bot.state) row('Reads', `${STATES[bot.state]?.label ?? bot.state}; ${(TACTICS[bot.tactic]?.label ?? bot.tactic).toLowerCase()}: ${bot.read}`);
  row('Does', bot.kind === 'move' ? `${bot.label}${bot.drags.length > 1 ? `, in ${bot.drags.length} drags` : ''}` : (KIND[bot.kind] ?? bot.kind));
  row('Why', bot.reason);
  if (bot.column !== undefined) row('Filling', `column ${bot.column + 1} (shaded), to go up Crystal Clear`);
  row('Where', `the ${levelLabel(p.level)} bot, seed ${p.seed}, ${secs(p.ms)} in; ${secs(p.timeLeft)} on the furnace${p.chain ? `; the chain at CC^${p.chain}` : ''}`);
  a.appendChild(dl);
  const verdicts = VERDICTS[p.id] ?? [];
  if (!verdicts.length && SKIPPED[p.id]) a.appendChild(html('div', { className: 'verdicts' }, `Skipped by you, ${SKIPPED[p.id].date}: ${SKIPPED[p.id].note}`));
  if (verdicts.length) {
    const box = html('div', { className: 'verdicts' });
    box.appendChild(html('b', {}, 'Your verdicts, tested:'));
    const ul = html('ul');
    for (const v of verdicts) ul.appendChild(html('li', {}, `${v.date}${v.from ? ` (${v.from})` : ''}: ${v.note}${v.open ? ' Not done by the bot yet.' : ' The bot does it.'}`));
    box.appendChild(ul);
    a.appendChild(box);
  }
  a.appendChild(html('p', { className: 'ask' }, `Tell me in chat: “${p.id}: …” in your words (“${p.id}: should get the white in column 9 out first”), or a screenshot with your drag drawn on.`));
  return a;
}

function draw() {
  const list = document.querySelector('[data-positions]'), toc = document.querySelector('[data-toc]');
  POSITIONS.forEach((p, i) => {
    list.appendChild(position(p));
    if (i) toc.appendChild(document.createTextNode(' · '));
    toc.appendChild(html('a', { href: `#${p.id.toLowerCase()}`, target: '_self', title: MOMENTS[p.moment] }, p.id));
  });
  if (!POSITIONS.length) list.appendChild(html('p', { className: 'intro' }, 'No positions picked yet.'));
}

try { draw(); } catch (e) {
  console.error(e);
  document.getElementById('broken').hidden = false;
}
