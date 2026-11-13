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
/** Each drag in its own colour, in order (then round again): gold, sky, rose, lime, violet, teal. */
const DRAG_COLOURS = ['#ffd23a', '#5fb8ff', '#ff6fb8', '#a6e85c', '#b98cff', '#3ee8c8'];
/** How far a stretch of a drag gone over twice is set aside, so there and back are two lanes. */
const LANE = 4.5;

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
  const m = el('marker', { id: 'dg-head', viewBox: '0 0 10 10', refX: '5', refY: '5', markerWidth: '3.2', markerHeight: '3.2', orient: 'auto' }, d);
  el('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#8a4b0f', stroke: '#3a2004', 'stroke-width': '1' }, m);
  // A drag's arrowhead, one in each drag's colour, only ever at its end.
  DRAG_COLOURS.forEach((c, i) => {
    const mk = el('marker', { id: `dg-head-${i}`, viewBox: '0 0 10 10', refX: '6', refY: '5', markerWidth: '3', markerHeight: '3', orient: 'auto', markerUnits: 'strokeWidth' }, d);
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: c, stroke: '#1a0e04', 'stroke-width': '1.2', 'stroke-linejoin': 'round' }, mk);
  });
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
  drags(svg, cols, pic.drags, W, H - 32);
  return svg;
}

/** The drags: each the path its held piece takes, through every place it swaps into, in its own colour. A dot where
    it's picked up, an arrowhead only where it's let go, and, when there's more than one, its number in a disc of its
    colour beside the dot, placed clear of the other numbers, dots and its own line. A stretch gone over twice (there
    and back) is drawn as two lanes, each set to its own side, so neither hides the other. Lines first, then the dots,
    then the numbers, so nothing's drawn over a label. */
function drags(svg, cols, list, W, H) {
  const paths = list.map((d) => {
    let px = d.x, py = d.y;
    const cells = [[px, py]];
    for (const w of d.ways) { const n = neighbourOn(cols, px, py, w); if (!n) break; [px, py] = n; cells.push([px, py]); }
    return cells;
  });
  // Stretches gone over more than once, by any drag.
  const key = (a, b) => (a[0] * 16 + a[1] < b[0] * 16 + b[1] ? `${a}|${b}` : `${b}|${a}`);
  const uses = new Map();
  for (const cells of paths) for (let k = 1; k < cells.length; k++) { const s = key(cells[k - 1], cells[k]); uses.set(s, (uses.get(s) ?? 0) + 1); }
  const lines = paths.map((cells) => {
    const pts = [];
    for (let k = 1; k < cells.length; k++) {
      const [ax, ay] = at(cols, ...cells[k - 1]), [bx, by] = at(cols, ...cells[k]);
      let ox = 0, oy = 0;
      if (uses.get(key(cells[k - 1], cells[k])) > 1) {
        const len = Math.hypot(bx - ax, by - ay);
        ox = (-(by - ay) / len) * LANE; oy = ((bx - ax) / len) * LANE;
      }
      const a = [ax + ox, ay + oy], b = [bx + ox, by + oy];
      if (!pts.length || Math.hypot(pts[pts.length - 1][0] - a[0], pts[pts.length - 1][1] - a[1]) > 0.5) pts.push(a);
      pts.push(b);
    }
    return pts;
  });
  lines.forEach((pts, i) => {
    if (pts.length < 2) return;
    const points = pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');
    el('polyline', { points, fill: 'none', stroke: '#1a0e04', 'stroke-width': 8, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.7 }, svg);
    el('polyline', { points, fill: 'none', stroke: DRAG_COLOURS[i % DRAG_COLOURS.length], 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'marker-end': `url(#dg-head-${i % DRAG_COLOURS.length})` }, svg);
  });
  const starts = paths.map((cells) => at(cols, ...cells[0]));
  starts.forEach(([sx, sy], i) => el('circle', { cx: sx, cy: sy, r: 6.5, fill: DRAG_COLOURS[i % DRAG_COLOURS.length], stroke: '#1a0e04', 'stroke-width': 2.2 }, svg));
  if (list.length < 2) return;
  // The numbers: round each dot, the spot furthest from the other numbers, the dots and every line.
  const placed = [];
  const near = (x, y, pts, r) => pts.reduce((s, [px, py]) => { const dd = Math.hypot(px - x, py - y); return s + (dd < r ? r - dd : 0); }, 0);
  const allPts = lines.flat();
  starts.forEach(([sx, sy], i) => {
    let best = null;
    for (let k = 0; k < 8; k++) {
      const ang = (Math.PI / 4) * k - (3 * Math.PI) / 4, x = sx + 17 * Math.cos(ang), y = sy + 17 * Math.sin(ang);
      if (x < 11 || x > W - 11 || y < 11 || y > H - 11) continue;
      const cost = 6 * near(x, y, placed, 22) + 3 * near(x, y, starts.filter((_, j) => j !== i), 18) + near(x, y, allPts, 14) + 2 * near(x, y, lines[i].slice(0, 2), 16) + k * 0.01;
      if (!best || cost < best.cost) best = { x, y, cost };
    }
    if (!best) best = { x: sx, y: sy - 17 };
    placed.push([best.x, best.y]);
    const c = DRAG_COLOURS[i % DRAG_COLOURS.length];
    el('circle', { cx: best.x, cy: best.y, r: 9, fill: c, stroke: '#1a0e04', 'stroke-width': 2 }, svg);
    const n = el('text', { x: best.x, y: best.y + 4.2, 'text-anchor': 'middle', class: 'num' }, svg);
    n.textContent = String(i + 1);
  });
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
  // The techniques only the longer chains need, as the page's plan marks them.
  const longer = new Set(Object.values(g.plan).flat().filter((i) => i.kind === 'technique' && i.longer).map((i) => i.name));
  for (const t of g.techniques) {
    const sec = document.querySelector(`[data-technique="${t.name}"]`);
    if (!sec) continue;
    fill(sec, '[data-name]', t.label);
    const tag = fill(sec, '[data-level-of]', t.level ? `${longer.has(t.name) ? 'for longer chains, ' : ''}from ${t.level}` : '');
    if (tag && longer.has(t.name)) tag.classList.add('longer');
    quote(sec, t.says);
    sec.querySelector('[data-picture]')?.replaceWith(figure(t.picture, `${t.label}, drawn as its drag on a real board`));
  }
  for (const t of g.tricks) {
    const sec = document.querySelector(`[data-trick="${t.trick}"]`);
    if (!sec) continue;
    fill(sec, '[data-level-of]', t.level ? `from ${t.level}` : '');
    quote(sec, t.says);
    sec.querySelector('[data-picture]')?.replaceWith(figure(t.picture, 'a real board showing it'));
  }
  // Reading the board (src/distill-read.ts): each position read as the planner reads it, its state and tactic, why,
  // and the bot's move there.
  for (const box of document.querySelectorAll('[data-reading]')) for (const r of g.reading) {
    const a = html('article', { className: 'board-side', id: `r-${r.id.toLowerCase()}` });
    a.appendChild(figure(r.picture, `${r.stateLabel}: ${r.tacticLabel.toLowerCase()}, on a real board`));
    const text = html('div');
    text.appendChild(html('h3', {}, `${r.stateLabel}: ${r.tacticLabel.toLowerCase()}`));
    text.appendChild(html('p', { className: 'sub' }, r.about));
    const why = html('p');
    why.appendChild(html('span', { className: 'state' }, 'Read: '));
    why.appendChild(document.createTextNode(r.why));
    text.appendChild(why);
    a.appendChild(text);
    box.appendChild(a);
  }
  // The table of contents: each phase's tricks and techniques, in the page's order, by their headings.
  for (const [phase, items] of Object.entries(g.plan)) {
    const box = document.querySelector(`[data-toc-phase="${phase}"] [data-toc-items]`);
    if (!box) continue;
    items.forEach((it, i) => {
      const id = `${it.kind === 'trick' ? 'k' : 't'}-${it.name}`, h = document.getElementById(id)?.querySelector('h3');
      if (i) box.appendChild(document.createTextNode(' · '));
      box.appendChild(html('a', { href: `#${id}`, target: '_self' }, h?.textContent ?? it.name));
    });
  }
  document.body.classList.add('drawn');
}

try { draw(); } catch (e) {
  console.error(e);
  const n = document.querySelector('[data-failed]');
  if (n) n.hidden = false;
}
