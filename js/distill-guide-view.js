// Distilling, the read version (distilling-guide.html): draws its boards as flat SVG honeycombs. Hand-written, not
// compiled. Everything it draws, and every name and line of Helium's in it, comes from js/distill-guide.js (src/
// distill-guide.ts), worked out from the same code as Helium's lesson and the bots; the page's own words stay in the
// page. It fills the page's slots: [data-phase], [data-technique], [data-trick] and [data-level] sections, and the
// rules' [data-rules] figures.
import { guide } from './distill-guide.js';
import { WHITE, BROWN, BLACK, SPICE, BURNT, TALL, neighbourOn } from './distilling.js';

const NS = 'http://www.w3.org/2000/svg';
/** A piece's colours, as the den's board draws them (js/den/distill-board.js): base, light, shadow, outline. */
const COL = {
  [WHITE]: { base: '#f3e8b4', light: '#fffdf0', dark: '#bfae6a', edge: '#5a4c20' },
  [BROWN]: { base: '#c9861c', light: '#ffd27a', dark: '#7a4608', edge: '#3a2004' },
  [BLACK]: { base: '#4a5440', light: '#9aa888', dark: '#20261a', edge: '#0c1008' },
  [SPICE]: { base: '#f47a14', light: '#ffd08a', dark: '#b8300a', edge: '#5a1404' },
  [BURNT]: { base: '#b4a674', light: '#e2d6a8', dark: '#6e6238', edge: '#3a3014' },
};
/** The pieces' names, in plain words. */
const NAMES = { [WHITE]: 'white', [BROWN]: 'brown', [BLACK]: 'black', [SPICE]: 'spice', [BURNT]: 'burnt white' };
const CELL = 40, R = 17;

const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};
const html = (tag, attrs = {}, text) => { const e = document.createElement(tag); Object.assign(e, attrs); if (text !== undefined) e.textContent = text; return e; };
const sign = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

/** The shared defs, once: each piece's gloss, and the arrowhead. */
function defs() {
  const svg = el('svg', { width: 0, height: 0, style: 'position:absolute', 'aria-hidden': 'true' });
  const d = el('defs', {}, svg);
  for (const [p, c] of Object.entries(COL)) {
    const g = el('radialGradient', { id: `dg-piece-${p}`, cx: '0.36', cy: '0.32', r: '0.75' }, d);
    el('stop', { offset: '0', 'stop-color': c.light }, g);
    el('stop', { offset: '0.45', 'stop-color': c.base }, g);
    el('stop', { offset: '1', 'stop-color': c.dark }, g);
  }
  const m = el('marker', { id: 'dg-head', viewBox: '0 0 10 10', refX: '5', refY: '5', markerWidth: '3.2', markerHeight: '3.2', orient: 'auto-start-reverse' }, d);
  el('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#ffd23a', stroke: '#3a2004', 'stroke-width': '1' }, m);
  const bg = el('linearGradient', { id: 'dg-board', x1: '0', y1: '0', x2: '0', y2: '1' }, d);
  el('stop', { offset: '0', 'stop-color': '#4a3520' }, bg);
  el('stop', { offset: '0.5', 'stop-color': '#5c4628' }, bg);
  el('stop', { offset: '1', 'stop-color': '#3a2816' }, bg);
  document.body.prepend(svg);
}

/** A piece drawn at (cx, cy). */
function piece(svg, p, cx, cy, r = R) {
  const c = COL[p];
  el('circle', { cx, cy, r, fill: `url(#dg-piece-${p})`, stroke: c.edge, 'stroke-width': 1.5 }, svg);
  if (p === SPICE) el('path', { d: `M${cx - r * 0.45},${cy + r * 0.1} q${r * 0.3},${-r * 0.6} ${r * 0.7},${-r * 0.2} q${r * 0.2},${r * 0.45} ${-r * 0.25},${r * 0.55}`, fill: 'none', stroke: c.dark, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, svg);
  if (p === BURNT) for (const [dx, dy] of [[-0.3, 0.2], [0.25, -0.1], [0.1, 0.4], [-0.05, -0.35]]) el('circle', { cx: cx + dx * r, cy: cy + dy * r, r: r * 0.12, fill: c.dark, opacity: 0.7 }, svg);
}

/** Where a place's middle is: columns 40 apart, a short column half a piece lower. */
const at = (cols, x, y) => [24 + x * CELL, 24 + y * CELL + (cols[x].length === TALL ? 0 : CELL / 2)];

/** A board: its columns shaded, pieces, rings, the furnace under the right-hand column, and the drags as arrows. */
export function board(pic, label) {
  const { cols } = pic, W = 48 + 9 * CELL, H = 24 + 8 * CELL + 24 + 30;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'board', role: 'img', 'aria-label': label });
  el('rect', { x: 1, y: 1, width: W - 2, height: H - 32, rx: 10, fill: 'url(#dg-board)', stroke: '#b08a3c', 'stroke-width': 2 }, svg);
  // The columns a picture's about: tinted behind the pieces, framed over them.
  const shade = (over) => { for (const x of pic.shade) el('rect', over ? { x: 4 + x * CELL, y: 3, width: CELL, height: H - 36, rx: 9, fill: 'none', stroke: '#ffb347', 'stroke-width': 2, 'stroke-dasharray': '6 4' } : { x: 4 + x * CELL, y: 3, width: CELL, height: H - 36, rx: 9, fill: 'rgba(255, 140, 40, 0.38)' }, svg); };
  shade(false);
  // The furnace, under the right-hand column, glowing when it burns.
  const fx = 24 + 9 * CELL;
  el('rect', { x: fx - 26, y: H - 28, width: 52, height: 26, rx: 4, fill: pic.burn ? '#c2410c' : '#2c2a28', stroke: '#111', 'stroke-width': 1.5 }, svg);
  for (let i = 0; i < 4; i++) el('rect', { x: fx - 20 + i * 11, y: H - 22, width: 6, height: 14, rx: 2, fill: pic.burn ? '#ffd27a' : '#e0742a', opacity: pic.burn ? 1 : 0.6 }, svg);
  const t = el('text', { x: fx - 34, y: H - 10, 'text-anchor': 'end', class: 'fire-label' }, svg);
  t.textContent = pic.burn ? 'burns' : 'the fire';
  cols.forEach((col, x) => col.forEach((p, y) => { const [cx, cy] = at(cols, x, y); piece(svg, p, cx, cy); }));
  shade(true);
  for (const [x, y] of pic.rings) { const [cx, cy] = at(cols, x, y); el('circle', { cx, cy, r: R + 3.5, fill: 'none', stroke: '#ff4a2a', 'stroke-width': 3.2 }, svg); }
  // The drags: each from its piece along every way it swaps, the path the held piece takes.
  pic.drags.forEach((d, i) => {
    let px = d.x, py = d.y;
    const pts = [at(cols, px, py)];
    for (const w of d.ways) { const n = neighbourOn(cols, px, py, w); if (!n) break; [px, py] = n; pts.push(at(cols, px, py)); }
    const points = pts.map(([a, b]) => `${a},${b}`).join(' ');
    el('polyline', { points, fill: 'none', stroke: '#3a2004', 'stroke-width': 8, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.75 }, svg);
    el('polyline', { points, fill: 'none', stroke: '#ffd23a', 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'marker-end': 'url(#dg-head)' }, svg);
    const [sx, sy] = pts[0];
    el('circle', { cx: sx, cy: sy, r: 6, fill: '#ffd23a', stroke: '#3a2004', 'stroke-width': 2 }, svg);
    if (pic.drags.length > 1) {
      el('circle', { cx: sx - 13, cy: sy - 13, r: 9, fill: '#3a2004', stroke: '#ffd23a', 'stroke-width': 1.5 }, svg);
      const n = el('text', { x: sx - 13, y: sy - 9, 'text-anchor': 'middle', class: 'num' }, svg);
      n.textContent = String(i + 1);
    }
  });
  return svg;
}

/** A picture with where its board's from. */
function figure(pic, label) {
  const f = html('figure', { className: 'pic' });
  f.appendChild(board(pic, label));
  f.appendChild(html('figcaption', {}, pic.from));
  return f;
}
const fill = (sec, sel, text) => { const e = sec.querySelector(sel); if (e && text) e.textContent = text; return e; };
const quote = (sec, says) => { const q = sec.querySelector('[data-says]'); if (q) { if (says) q.textContent = `“${says}”`; else q.remove(); } };

// ---------------------------------------------------------------- the rules' figures

function pieces(box, g) {
  const ul = html('ul', { className: 'pieces' });
  for (const p of g.pieces) {
    const li = html('li');
    const svg = el('svg', { viewBox: '0 0 40 40', class: 'chip', 'aria-hidden': 'true' });
    piece(svg, p.piece, 20, 20);
    li.appendChild(svg);
    li.appendChild(html('b', {}, NAMES[p.piece]));
    li.appendChild(html('span', {}, `weight ${sign(p.weight)} · ${sign(p.points)} sent up${p.swaps ? '' : ' · never moves'}`));
    ul.appendChild(li);
  }
  box.appendChild(ul);
}
function swaps(box, g) {
  const row = html('div', { className: 'swaps' });
  for (const s of g.swaps) {
    const f = html('figure');
    const svg = el('svg', { viewBox: '0 0 90 80', class: 'pair', role: 'img', 'aria-label': `a ${NAMES[s.lower]} below a ${NAMES[s.upper]} swaps with it` });
    piece(svg, s.upper, 26, 22); piece(svg, s.lower, 64, 58);
    el('path', { d: 'M40,26 Q66,22 64,40', fill: 'none', stroke: '#8a4b0f', 'stroke-width': 2.5, 'marker-end': 'url(#dg-head)' }, svg);
    el('path', { d: 'M50,56 Q24,58 26,40', fill: 'none', stroke: '#8a4b0f', 'stroke-width': 2.5, 'marker-end': 'url(#dg-head)' }, svg);
    f.appendChild(svg);
    f.appendChild(html('figcaption', {}, `${NAMES[s.lower]} rises past ${NAMES[s.upper]}`));
    row.appendChild(f);
  }
  box.appendChild(row);
}
function columns(box, g) {
  const row = html('div', { className: 'columns' });
  for (const c of g.columns) {
    const f = html('figure');
    // A column as it stands on the board: a short one half a piece lower.
    const svg = el('svg', { viewBox: `0 0 34 ${10 + 9 * 24 + 4}`, class: 'col', 'aria-hidden': 'true' });
    c.pieces.forEach((p, y) => piece(svg, p, 17, 17 + y * 24 + (c.pieces.length === TALL ? 0 : 12), 11));
    f.appendChild(svg);
    const cap = html('figcaption');
    cap.appendChild(html('b', {}, c.up ? 'up' : 'burns'));
    cap.appendChild(document.createTextNode(c.up ? ` ${sign(c.points)}` : ''));
    if (c.before) cap.appendChild(html('small', {}, `after ${c.before} Crystal Clear${c.before > 1 ? 's' : ''}`));
    for (const m of [c.message, c.spice]) if (m) cap.appendChild(html('i', {}, m));
    f.appendChild(cap);
    row.appendChild(f);
  }
  box.appendChild(row);
}

// ---------------------------------------------------------------- the page

function draw() {
  defs();
  const g = guide();
  for (const box of document.querySelectorAll('[data-rules]')) ({ pieces, swaps, columns })[box.dataset.rules]?.(box, g);
  for (const e of document.querySelectorAll('[data-n]')) {
    const v = { furnace: g.furnaceSecs, bonus: g.chainBonus, flask: g.flask, carry: g.carryOn }[e.dataset.n];
    if (v !== undefined) e.textContent = String(v);
  }
  for (const e of document.querySelectorAll('[data-quote]')) { const q = g.quotes[e.dataset.quote]; if (q) e.textContent = `“${q}”`; }
  const labels = Object.fromEntries(g.techniques.map((t) => [t.name, t.label]));
  for (const p of g.phases) {
    const sec = document.querySelector(`[data-phase="${p.phase}"]`);
    if (!sec) continue;
    fill(sec, '[data-name]', p.label);
    fill(sec, '[data-plan]', p.plan);
    quote(sec, p.says);
    sec.querySelector('[data-picture]')?.replaceWith(figure(p.picture, `${p.label}: a board in this phase`));
  }
  for (const l of g.levels) {
    const li = document.querySelector(`[data-level="${l.name}"]`);
    if (!li) continue;
    fill(li, '[data-name]', l.label);
    fill(li, '[data-bank]', `${l.bank} columns of whites banked (about ${l.whites})`);
    const adds = li.querySelector('[data-adds]');
    if (adds) {
      adds.textContent = l.target === g.levels[0].target ? 'Plays: ' : 'Adds: ';
      l.adds.forEach((t, i) => {
        if (i) adds.appendChild(document.createTextNode(', '));
        adds.appendChild(html('a', { href: `#t-${t}`, target: '_self' }, labels[t] ?? t));
      });
    }
  }
  for (const t of g.techniques) {
    const sec = document.querySelector(`[data-technique="${t.name}"]`);
    if (!sec) continue;
    fill(sec, '[data-name]', t.label);
    fill(sec, '[data-level-of]', t.level ? `from ${t.level}` : '');
    quote(sec, t.says);
    sec.querySelector('[data-picture]')?.replaceWith(figure(t.picture, `${t.label}, drawn as its drag on a real board`));
  }
  for (const t of g.tricks) {
    const sec = document.querySelector(`[data-trick="${t.trick}"]`);
    if (!sec) continue;
    quote(sec, t.says);
    sec.querySelector('[data-picture]')?.replaceWith(figure(t.picture, 'a real board showing it'));
  }
  // The table of contents' technique links, by their names.
  const toc = document.querySelector('[data-toc-techniques]');
  if (toc) g.techniques.forEach((t, i) => {
    if (i) toc.appendChild(document.createTextNode(' · '));
    toc.appendChild(html('a', { href: `#t-${t.name}`, target: '_self' }, t.label));
  });
  document.body.classList.add('drawn');
}

try { draw(); } catch (e) {
  console.error(e);
  const n = document.querySelector('[data-failed]');
  if (n) n.hidden = false;
}
