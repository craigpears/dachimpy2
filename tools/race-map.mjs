/* A chart of the sloop race's course (12 Nov), in the captain's map's look (js/den/map.js, mapTexture:
   ink on old parchment, hand-lettered), drawn from the race's own data so it stays right as the course is
   re-laid: the user, "draw like a map of the course ... shows where all the shortcuts and things are, and all
   the wins? Like a 2D depiction of the course."

   Everything on it is read from the compiled js: the squares from LAY.RACE (src/den-sail.ts) and the sea
   built on them (courseSea), the long way (LONG_ROUTE), what each shortcut saves (CUTS, from RACE.DECENT,
   DOOR.SAVES and SIM.ZIGZAG), the sheltered spots (SHELTER), the gun gap's guns and their reach (CHECK), the
   rivals' spots and routes (RIVALS); and the wins from the race simulated, as tools/race-sim.mjs runs it
   (src/race-sim.ts). Only the words for each puzzle are written here.

   One chart, everything on it, the starlit door, its tunnel and its route among the rest: since 12 Nov
   there are no hidden gems in the proof of concept (RULES.md), so the PUBLIC mode that left the door out is
   gone. Its chart is changelog/race-map.jpg, on the changelog and design.html (RACE.md §13).

   Run on the compiled js (npm run build first) with Node 22:
     node_modules/node/bin/node.exe tools/race-map.mjs <out.html> [races] [size]
   races (default 2000, about a minute) and size (racers in each, default 4) as tools/race-sim.mjs. */

import { writeFileSync } from 'node:fs';
import { LAY, SAIL } from '../js/den-sail.js';
import { RACE, LONG_ROUTE } from '../js/den-race.js';
import { run, ROUTES, STYLES, SKILLS, CUTS, SIM, PACE, zoneOf } from '../js/race-sim.js';
import { SHELTER, courseSea } from '../js/den-racers.js';
import { CHECK } from '../js/den-checkpoint.js';
import { RIVALS } from '../js/den-rivals.js';
import { whirlpool } from '../js/den-whirl.js';
import { DOOR } from '../js/den-door.js';
import { GAMBLE } from '../js/den-gamble.js';

const OUT = process.argv[2];
if (!OUT) { console.error('usage: tools/race-map.mjs <out.html> [races] [size]'); process.exit(1); }
const RACES = Number(process.argv[3]) || 2000, SIZE = Number(process.argv[4]) || 4;

/* ---- The wins ---- */
const t0 = Date.now();
const rep = run(RACES, SIZE, { mode: RACE.GAP.MODE });
console.log(`${RACES} races of ${SIZE} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const fair = 1 / SIZE;
const winOf = (t) => (t && t.n ? t.wins / t.n : 0);
const pc = (x) => `${Math.round(100 * x)}%`;
const routeWin = (name) => pc(winOf(rep.byRoute[name]));

/* ---- The course ---- */
const RC = LAY.RACE, sea = courseSea(), W = SAIL.COLS;
const R0 = RC.R0, RTOP = RC.STRETCHES[RC.STRETCHES.length - 1].r + 1, RBOT = RC.START.r0;
const key = (c, r) => `${c},${r}`;
const SQ = 40;
/** A square's middle on the sheet (out to sea at the top, as on the captain's map); fractions between. */
const X = (c) => (c + 0.5) * SQ, Y = (r) => (RTOP - r + 0.5) * SQ;
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];   // (the way each heading points on the sheet)
const INK = '#4a2c14', LAND = '#d6b778', SAND = '#e2c88e', RED = '#7a2414', SNAKE = '#9b2a14', BLUE = '#284a60', GREEN = '#2f5a24', DOOR_INK = '#3b2a6b';

let seed = 12;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const f = (n) => Math.round(n * 10) / 10;

const barrier = new Set(RC.FORAGE.BARRIER.map(([c, r]) => key(c, r)));
const isLand = (c, r) => c >= 0 && c < W && r > R0 && r <= RTOP && sea.ground(c, r) && !barrier.has(key(c, r));
const reef = new Set(RC.REEF.map(([c, r]) => key(c, r)));
const whirlSq = new Set();
const pools = [...RC.FIELD.POOLS, ...RC.WHIRLS.POOLS].map((p) => whirlpool(p));
for (const w of pools) for (const [c, r] of w.squares) whirlSq.add(key(c, r));

// What each wind is: a snake, the whirlpool channel's, a headwind to hop, the start's field.
const kind = new Map();
for (const [c, r] of RC.SNAKES.LEFT) kind.set(key(c, r), 'left');
for (const [c, r] of RC.SNAKES.TIGHT) kind.set(key(c, r), 'tight');
for (const [c, r] of RC.SNAKES.MID) kind.set(key(c, r), 'mid');
for (const [c, r] of RC.WHIRLS.WINDS) kind.set(key(c, r), 'whirls');
for (const [c, r] of [RC.DOUBLE.WIND, ...RC.TRIPLE, ...RC.ZIGZAG]) kind.set(key(c, r), 'hop');
for (const [c, r] of RC.FIELD.WINDS) kind.set(key(c, r), 'field');
for (const [c, r] of RC.GAMBLES.TURN.UP) kind.set(key(c, r), 'gamble');

const svg = [];
const add = (s) => svg.push(s);

// A hand-drawn line through points (sheet units), wobbling a little between them.
const wobbly = (pts, close = false, jag = 3) => {
  let d = '';
  pts.forEach(([x, y], i) => {
    if (!i) { d += `M${f(x)} ${f(y)}`; return; }
    const [px, py] = pts[i - 1], n = Math.max(1, Math.round(Math.hypot(x - px, y - py) / 14));
    for (let k = 1; k <= n; k++) {
      const t = k / n, j = k < n ? jag : 0;
      d += `L${f(px + (x - px) * t + (rnd() - 0.5) * j)} ${f(py + (y - py) * t + (rnd() - 0.5) * j)}`;
    }
  });
  return close ? `${d}Z` : d;
};

/* The sheet: the course from the open sea off its gate (bottom) to the run home (top). */
const x0 = -0.8 * SQ, x1 = (W + 0.8) * SQ, y0 = -0.9 * SQ, y1 = (RTOP - RBOT + 1.8) * SQ;
const VW = x1 - x0, VH = y1 - y0;
add(`<defs>
  <radialGradient id="paper" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#f0ddae"/><stop offset=".72" stop-color="#dcc08a"/><stop offset="1" stop-color="#a3763e"/></radialGradient>
  <pattern id="shelter" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="rgba(70,120,50,.18)"/><line x1="0" y1="0" x2="0" y2="10" stroke="rgba(47,90,36,.55)" stroke-width="3"/></pattern>
  <pattern id="exposed" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="10" height="10" fill="rgba(170,40,20,.12)"/><line x1="0" y1="0" x2="0" y2="10" stroke="rgba(155,42,20,.5)" stroke-width="2.5"/></pattern>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .22  0 0 0 0 .1  0 0 0 .09 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <clipPath id="sheet"><path id="edge"/></clipPath>
</defs>`);
{
  // A ragged, burnt edge.
  const edge = [], m = 6, side = (ax, ay, bx, by, n) => { for (let i = 0; i < n; i++) { const t = i / n; edge.push([ax + (bx - ax) * t + (rnd() - 0.5) * 12, ay + (by - ay) * t + (rnd() - 0.5) * 12]); } };
  side(x0 + m, y0 + m, x1 - m, y0 + m, 30); side(x1 - m, y0 + m, x1 - m, y1 - m, 44); side(x1 - m, y1 - m, x0 + m, y1 - m, 30); side(x0 + m, y1 - m, x0 + m, y0 + m, 44);
  const d = `M${edge.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`;
  svg[0] = svg[0].replace('<path id="edge"/>', `<path d="${d}"/>`);
  add(`<path d="${d}" fill="url(#paper)"/>`);
  add(`<g clip-path="url(#sheet)">`);
  add(`<rect x="${x0}" y="${y0}" width="${VW}" height="${VH}" filter="url(#grain)" fill="#000"/>`);
  for (let i = 0; i < 12; i++) add(`<circle cx="${f(x0 + rnd() * VW)}" cy="${f(y0 + rnd() * VH)}" r="${f(30 + rnd() * 90)}" fill="rgba(140,95,45,${f(0.04 + rnd() * 0.06)})"/>`);
  add(`<path d="${d}" fill="none" stroke="rgba(80,42,14,.5)" stroke-width="16"/>`);
}

/* The sea: little waves on the open water, away from the winds and whirlpools. */
{
  let p = '';
  for (let i = 0; i < 150; i++) {
    const c = rnd() * W - 0.5, r = RBOT - 0.5 + rnd() * (RTOP - RBOT + 1), cc = Math.round(c), rr = Math.round(r);
    if (isLand(cc, rr) || reef.has(key(cc, rr)) || sea.windAt(cc, rr) !== undefined || whirlSq.has(key(cc, rr)) || rr === RC.LINE.r) continue;
    const x = X(c), y = Y(r);
    p += `M${f(x - 9)} ${f(y)}q4.5 -4 9 0t9 0`;
  }
  add(`<path d="${p}" fill="none" stroke="rgba(52,72,84,.4)" stroke-width="1.8"/>`);
}

/* The winds: each square tinted, an arrow the way it blows. Snakes red, the rest in blue ink. */
{
  const tint = { left: 'rgba(170,45,20,.16)', tight: 'rgba(170,45,20,.16)', mid: 'rgba(170,45,20,.16)', gamble: 'rgba(170,45,20,.16)', whirls: 'rgba(40,74,96,.1)', hop: 'rgba(40,74,96,.16)', field: 'rgba(40,74,96,.12)' };
  let arrows = { snake: '', blue: '' };
  for (let r = RBOT; r <= RTOP; r++) for (let c = 0; c < W; c++) {
    const d = sea.windAt(c, r);
    if (d === undefined || r <= R0) continue;
    const k = kind.get(key(c, r)) ?? 'field', x = X(c), y = Y(r), ux = DX[d], uy = DY[d], sx = -uy, sy = ux;
    add(`<rect x="${f(x - SQ / 2)}" y="${f(y - SQ / 2)}" width="${SQ}" height="${SQ}" fill="${tint[k]}"/>`);
    const a = SQ * 0.32, h = SQ * 0.17;
    const s = `M${f(x - ux * a)} ${f(y - uy * a)}L${f(x + ux * a)} ${f(y + uy * a)}M${f(x + ux * (a - h) + sx * h)} ${f(y + uy * (a - h) + sy * h)}L${f(x + ux * a)} ${f(y + uy * a)}L${f(x + ux * (a - h) - sx * h)} ${f(y + uy * (a - h) - sy * h)}`;
    if (k === 'left' || k === 'tight' || k === 'mid' || k === 'gamble') arrows.snake += s; else arrows.blue += s;
  }
  add(`<path d="${arrows.blue}" fill="none" stroke="${BLUE}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`);
  add(`<path d="${arrows.snake}" fill="none" stroke="${SNAKE}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`);
}

/* The land: each spit, filled, its coast inked with a cliff's hachures, a few hills. */
{
  let fill = '', coast = [], hach = '';
  for (let r = R0 + 1; r <= RTOP; r++) for (let c = 0; c < W; c++) {
    if (!isLand(c, r)) continue;
    fill += `M${f(X(c) - SQ / 2 - 0.6)} ${f(Y(r) - SQ / 2 - 0.6)}h${SQ + 1.2}v${SQ + 1.2}h${-SQ - 1.2}Z`;
    // each side with water beyond it (not the board's edge)
    for (let d = 0; d < 4; d++) {
      const nc = c + [0, 1, 0, -1][d], nr = r + [1, 0, -1, 0][d];
      if (nc < 0 || nc >= W || isLand(nc, nr)) continue;
      const cx = X(c), cy = Y(r), ux = DX[d], uy = DY[d], sx = -uy, sy = ux, hs = SQ / 2;
      const a = [cx + ux * hs + sx * hs, cy + uy * hs + sy * hs], b = [cx + ux * hs - sx * hs, cy + uy * hs - sy * hs];
      coast.push([a, b]);
      for (let k = 0; k < 4; k++) {
        const t = (k + 0.5 + (rnd() - 0.5) * 0.5) / 4, px = a[0] + (b[0] - a[0]) * t, py = a[1] + (b[1] - a[1]) * t, l = 4 + rnd() * 7;
        hach += `M${f(px)} ${f(py)}l${f(-ux * l)} ${f(-uy * l)}`;
      }
    }
  }
  add(`<path d="${fill}" fill="${LAND}"/>`);
  add(`<path d="${hach}" stroke="rgba(74,44,20,.55)" stroke-width="1.6" fill="none"/>`);
  add(`<path d="${coast.map(([a, b]) => wobbly([a, b], false, 3)).join('')}" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`);
  // Little hills on the broad land (spit 3's middle).
  let hills = '';
  for (let i = 0; i < 40; i++) {
    const c = Math.floor(rnd() * W), r = R0 + 1 + Math.floor(rnd() * (RTOP - R0));
    if (![[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => isLand(c + a, r + b))) continue;
    const x = X(c) + (rnd() - 0.5) * 10, y = Y(r) + 6;
    hills += `M${f(x - 9)} ${f(y)}q9 -14 18 0`;
  }
  add(`<path d="${hills}" stroke="rgba(74,44,20,.5)" stroke-width="1.8" fill="none"/>`);
}

/* The line of rocks across the sea in front of the course, and its gate. */
{
  let p = '';
  for (const [c, r] of RC.REEF) for (let k = 0; k < 3; k++) {
    const x = X(c) + (rnd() - 0.5) * 22, y = Y(r) + (rnd() - 0.5) * 12, s = 5 + rnd() * 5;
    p += `M${f(x - s)} ${f(y + s * 0.5)}L${f(x - s * 0.4)} ${f(y - s * 0.7)}L${f(x + s * 0.5)} ${f(y - s * 0.6)}L${f(x + s)} ${f(y + s * 0.5)}Z`;
  }
  add(`<path d="${p}" fill="#9b8c78" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`);
}

/* Sheltered spots, shaded; the open-water stops (sitting ducks), hatched red. */
{
  for (const k of SHELTER) { const [c, r] = k.split(',').map(Number); add(`<rect x="${X(c) - SQ / 2}" y="${Y(r) - SQ / 2}" width="${SQ}" height="${SQ}" fill="url(#shelter)" stroke="rgba(47,90,36,.7)" stroke-width="1.5"/>`); }
  const stops = ['whirls', 'headwind', 'door'];
  for (const id of stops) { const { c, r } = CUTS[id].at; if (!CUTS[id].sheltered) add(`<rect x="${X(c) - SQ / 2}" y="${Y(r) - SQ / 2}" width="${SQ}" height="${SQ}" fill="url(#exposed)" stroke="rgba(155,42,20,.7)" stroke-width="1.5"/>`); }
}

/* Whirlpools: an inked spiral, clockwise, over their squares (the channel's each missing a corner). */
for (const w of pools) {
  const [mc, mr] = w.mid, cx = X(mc), cy = Y(mr);
  let d = '';
  for (let t = 0; t <= 3.2 * Math.PI * 2; t += 0.25) { const rad = 3 + t * 1.55, x = cx + Math.cos(t) * rad, y = cy + Math.sin(t) * rad; d += `${d ? 'L' : 'M'}${f(x)} ${f(y)}`; }
  add(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${SQ * 0.9}" fill="rgba(40,74,96,.12)" stroke="rgba(40,74,96,.5)" stroke-width="1.5" stroke-dasharray="4 4"/>`);
  add(`<path d="${d}" fill="none" stroke="${BLUE}" stroke-width="2.4" stroke-linecap="round"/>`);
}

/* The gambles (src/den-gamble.ts): the turning pool, a spiral with an arrow each way round its rim (its spin
   turns), its throw on (gold, down the cleft onto leg 3) and back (the red lane up spit 1, drawn with the
   winds); the veiled wind's gap, a shimmer and a question mark, its carry on (gold) and back (red, along
   leg 5). */
const GOLD = '#a8780f';
const way = (poses, col) => `<path d="M${poses.map((p) => `${f(X(p.c))} ${f(Y(p.r))}`).join('L')}" fill="none" stroke="${col}" stroke-width="3.4" stroke-dasharray="2 7" stroke-linecap="round" stroke-linejoin="round"/>`;
{
  const G = RC.GAMBLES, tp = whirlpool(G.TURN.POOL), [mc, mr] = tp.mid, cx = X(mc), cy = Y(mr);
  add(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${SQ * 0.9}" fill="rgba(184,134,26,.18)" stroke="${GOLD}" stroke-width="2" stroke-dasharray="4 4"/>`);
  let d = '';
  for (let t = 0; t <= 2.6 * Math.PI * 2; t += 0.25) { const rad = 3 + t * 1.7, x = cx + Math.cos(t) * rad, y = cy + Math.sin(t) * rad; d += `${d ? 'L' : 'M'}${f(x)} ${f(y)}`; }
  add(`<path d="${d}" fill="none" stroke="${BLUE}" stroke-width="2.4" stroke-linecap="round"/>`);
  const R = SQ * 0.9 + 7, P = (a) => `${f(cx + R * Math.cos(a))} ${f(cy + R * Math.sin(a))}`;
  add(`<g fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M${P(-2.5)}A${R} ${R} 0 0 1 ${P(-0.7)}"/><path d="M${P(2.5)}A${R} ${R} 0 0 1 ${P(0.7)}"/></g>`);
  // (the arrowheads: clockwise at the top's end, anticlockwise at the bottom's)
  for (const [a, s] of [[-0.7, 1], [0.7, -1]]) {
    const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a), tx = -Math.sin(a) * s, ty = Math.cos(a) * s, nx = Math.cos(a), ny = Math.sin(a);
    add(`<path d="M${f(x - tx * 9 + nx * 6)} ${f(y - ty * 9 + ny * 6)}L${f(x)} ${f(y)}L${f(x - tx * 9 - nx * 6)} ${f(y - ty * 9 - ny * 6)}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`);
  }
  add(way([{ c: G.TURN.FAR[0], r: G.TURN.FAR[1] }, ...G.TURN.ON], GOLD));
  // The veiled wind: its squares shimmering, a question mark; on to the run home, or back along leg 5.
  for (const [c, r] of G.VEIL.WAY) {
    add(`<rect x="${f(X(c) - SQ / 2)}" y="${f(Y(r) - SQ / 2)}" width="${SQ}" height="${SQ}" fill="rgba(184,134,26,.24)"/>`);
    for (let k = 0; k < 5; k++) add(`<circle cx="${f(X(c) + (rnd() - 0.5) * SQ * 0.8)}" cy="${f(Y(r) + (rnd() - 0.5) * SQ * 0.8)}" r="1.8" fill="${GOLD}"/>`);
  }
  const [vc0, vr0] = G.VEIL.WAY[0];
  add(way([{ c: vc0, r: vr0 }, ...G.VEIL.ON], GOLD));
  add(way(G.VEIL.BACK, SNAKE));
  add(label(X(vc0), (Y(vr0) + Y(G.VEIL.WAY[G.VEIL.WAY.length - 1][1])) / 2 + SQ * 0.33, ['?'], { size: 0.95, weight: 700, col: '#5a1a0c' }));
}

/* [A] The gun gap's guns: their reach (any way, CHECK.REACH squares), the squares they're trained on. */
{
  const G = RC.GUNS, R = CHECK.REACH;
  for (const [c, r] of G.at) {
    const xa = Math.max(x0, X(c - R) - SQ / 2), xb = Math.min(x1, X(c + R) + SQ / 2);
    add(`<rect x="${f(xa)}" y="${f(Y(r + R) - SQ / 2)}" width="${f(xb - xa)}" height="${(2 * R + 1) * SQ}" fill="rgba(170,45,20,.05)" stroke="${SNAKE}" stroke-width="2" stroke-dasharray="9 6" rx="6"/>`);
  }
  for (const [c, r] of G.marks.flat()) add(`<g stroke="${SNAKE}" stroke-width="2" fill="none"><circle cx="${X(c)}" cy="${Y(r)}" r="9"/><path d="M${X(c) - 14} ${Y(r)}h28M${X(c)} ${Y(r) - 14}v28"/></g>`);
  G.at.forEach(([c, r]) => {
    const x = X(c), y = Y(r), s = Math.sign(G.gap[0] - c);
    add(`<g stroke="${INK}" stroke-width="2.2"><rect x="${x - 13}" y="${y - 11}" width="26" height="22" fill="#b89a6a"/>${[0, 1, 2, 3].map((i) => `<rect x="${x - 13 + i * 7}" y="${y - 16}" width="5" height="5" fill="#b89a6a"/>`).join('')}<path d="M${x} ${y}h${s * 22}" stroke-width="6" stroke-linecap="round"/></g>`);
  });
}

/* [D] The locks: a chamber between stone walls, a gate at either end; the canal between. */
{
  for (const [c, r] of RC.POUND.at) add(`<rect x="${X(c) - SQ / 2}" y="${Y(r) - SQ / 2}" width="${SQ}" height="${SQ}" fill="rgba(60,110,140,.25)"/>`);
  for (const l of RC.LOCKS) {
    const [c, r] = l.at, x = X(c), y = Y(r);
    add(`<g stroke="${INK}" stroke-width="2.2"><rect x="${x - SQ / 2}" y="${y - SQ / 2}" width="7" height="${SQ}" fill="#a49884"/><rect x="${x + SQ / 2 - 7}" y="${y - SQ / 2}" width="7" height="${SQ}" fill="#a49884"/><path d="M${x - SQ / 2 + 7} ${y - SQ / 2 + 3}h${SQ - 14}M${x - SQ / 2 + 7} ${y + SQ / 2 - 3}h${SQ - 14}" stroke="#5b3a20" stroke-width="5"/></g>`);
  }
}

/* [C] The barrier of driftwood across its gap. */
for (const [c, r] of RC.FORAGE.BARRIER) {
  const x = X(c), y = Y(r);
  for (const [dx, dy, a] of [[-4, -9, 12], [3, 0, -8], [-2, 9, 5]]) add(`<rect x="${x + dx - 17}" y="${y + dy - 4}" width="34" height="8" rx="4" fill="#8a5a30" stroke="${INK}" stroke-width="1.8" transform="rotate(${a} ${x + dx} ${y + dy})"/>`);
}

/* [E] The crane on its ledge: a gantry, its jib out over the neck, and her swing over to the run home. */
{
  const [c, r] = RC.CRANE.LEDGE, x = X(c), y = Y(r), T = RC.CRANE.TO;
  add(`<path d="M${x} ${y}C${x - SQ * 1.1} ${y - SQ * 0.6} ${X(T.c) - SQ * 1.1} ${Y(T.r) + SQ * 0.4} ${X(T.c)} ${Y(T.r)}" fill="none" stroke="${GREEN}" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>`);
  add(`<g stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M${x + 6} ${y + 14}L${x + 12} ${y - 22}L${x + 18} ${y + 14}M${x + 12} ${y - 22}L${x - 18} ${y - 34}M${x - 16} ${y - 33}v12"/><path d="M${x - 21} ${y - 21}h10" stroke-width="3"/></g>`);
}

/* The starlit door: its carved face on the cliff, stars about it, the tunnel under the course and a sea
   cave up a cleft at each of its exits (DOOR.EXITS), the far end's the last. */
const star = (x, y, s) => { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? s * 0.42 : s; p += `${i ? 'L' : 'M'}${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`; } return `<path d="${p}Z" fill="#e7c34a" stroke="${INK}" stroke-width="1.2"/>`; };
{
  const D = RC.DOOR, fx = (X(D.FACE[0][0]) + X(D.FACE[1][0])) / 2, fy = Y(D.FACE[0][1]) + SQ / 2;
  const caves = D.EXITS.map((e) => [fx, Y(e.OUT[0][1]) - SQ / 2]), [ox, oy] = caves[caves.length - 1];
  add(`<path d="M${fx} ${fy}L${ox} ${oy}" stroke="${DOOR_INK}" stroke-width="4" stroke-dasharray="1 8" stroke-linecap="round" opacity=".85"/>`);
  add(`<path d="M${fx - 12} ${fy}v-8a12 12 0 0 1 24 0v8Z" fill="#2a2140" stroke="${INK}" stroke-width="2"/>`);
  // (each cave's mouth, a dark half-round in the cliff, and the way up out of it onto the leg)
  for (const [x, y] of caves) add(`<path d="M${x - 12} ${y}a12 11 0 0 0 24 0Z" fill="#2a2140" stroke="${INK}" stroke-width="2"/><path d="M${x} ${y - 4}v-16m-6 6l6 -6l6 6" fill="none" stroke="${DOOR_INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`);
  add(star(fx - 30, fy - 14, 7) + star(fx + 30, fy - 16, 6));
}

/* [A] The gun gap as an imperial gate: its towers either side of the way in, an arch and the Empire's flag
   over it, its guard on the leg in front (paid with the wreck's coins: src/den-bribe.ts); the old wreck in
   its notch off leg 1, where Treasure Haul brings the coins up. */
{
  const B = RC.BRIBE, [gc, gr] = B.GATE, ty = Y(B.TOWERS[0][1]);
  for (const [c, r] of B.TOWERS) { const x = X(c), y = Y(r); add(`<g stroke="${INK}" stroke-width="2"><rect x="${x - 9}" y="${y - 14}" width="18" height="26" fill="#e6dcc4"/>${[0, 1, 2].map((i) => `<rect x="${x - 9 + i * 6.5}" y="${y - 19}" width="5" height="5" fill="#e6dcc4"/>`).join('')}<rect x="${x - 3.5}" y="${y - 9}" width="7" height="15" fill="#a3271c" stroke="none"/></g>`); }
  const ax = X(gc);
  add(`<g stroke="${INK}" stroke-width="2.4" fill="none"><path d="M${ax - SQ / 2 + 2} ${ty - 12}Q${ax} ${ty - 34} ${ax + SQ / 2 - 2} ${ty - 12}"/><path d="M${ax} ${ty - 23}v-18"/></g><path d="M${ax} ${ty - 41}l17 4l-17 5Z" fill="#a3271c" stroke="${INK}" stroke-width="1.6"/>`);
  // (the guard, in crimson, on the square in front of it)
  add(`<g stroke="${INK}" stroke-width="1.6"><circle cx="${X(gc)}" cy="${Y(gr) - 10}" r="4.5" fill="#e8c9a0"/><path d="M${X(gc) - 6} ${Y(gr) + 8}L${X(gc)} ${Y(gr) - 6}L${X(gc) + 6} ${Y(gr) + 8}Z" fill="#a3271c"/></g>`);
  const [wc, wr] = B.WRECK, x = X(wc), y = Y(wr);
  add(`<g transform="translate(${x} ${y + 4}) rotate(-14)" stroke="${INK}" stroke-width="2.2"><path d="M-17 -3h26l-6 9h-16Z" fill="#8a5a30"/><path d="M9 -3l5 -5M5 1l9 -1" fill="none"/><path d="M-4 -3l3 -16l7 -4" fill="none"/></g>`);
  add(`<circle cx="${x + 12}" cy="${y - 10}" r="4" fill="#d9a93a" stroke="${INK}" stroke-width="1.2"/><circle cx="${x + 17}" cy="${y - 5}" r="3.4" fill="#d9a93a" stroke="${INK}" stroke-width="1.2"/>`);
}

/* The shortcuts' ways through, dotted green (the crane's swing above; the tunnel, the door's). */
{
  const S = RC.STRETCHES;
  const ways = [
    [[RC.GUNS.way[0][0], S[0].r + 1], [RC.GUNS.way[2][0], S[1].r]],
    [[RC.BRIBE.NOTCH[0], S[0].r + 1], RC.BRIBE.NOTCH],
    [[RC.HEADWIND[0][0], S[1].r + 1], ...RC.HEADWIND, [RC.HEADWIND[RC.HEADWIND.length - 1][0], S[2].r]],
    [[RC.DOUBLE.WAY[0][0], S[1].r + 1], [RC.DOUBLE.WAY[0][0], S[2].r]],
    [[RC.WHIRLS.MOUTH.c, RC.WHIRLS.MOUTH.r], [RC.WHIRLS.OUT[0], RC.WHIRLS.OUT[1]]],
    [[RC.FORAGE.NOTCH[0], S[2].r + 1], RC.FORAGE.NOTCH, RC.FORAGE.OUT],
    [[RC.LOCKS[0].at[0], S[3].r], [RC.LOCKS[1].at[0], S[4].r]],
    [[RC.CRANE.LEDGE[0], S[4].r], RC.CRANE.LEDGE],
    [[RC.TRIPLE[0][0], S[4].r + 1], [RC.TRIPLE[0][0], S[5].r]],
  ];
  add(`<path d="${ways.map((w) => `M${w.map(([c, r]) => `${f(X(c))} ${f(Y(r))}`).join('L')}`).join('')}" fill="none" stroke="${GREEN}" stroke-width="3.4" stroke-dasharray="2 7" stroke-linecap="round" stroke-linejoin="round"/>`);
}

/* The long way, dashed, round the buoys, with arrowheads the way she goes. */
{
  const pts = LONG_ROUTE.map(([c, r]) => [X(c), Y(r)]);
  add(`<path d="${wobbly(pts, false, 2)}" fill="none" stroke="${RED}" stroke-width="3.4" stroke-dasharray="10 7" stroke-linecap="round" opacity=".9"/>`);
  let heads = '';
  pts.slice(1).forEach(([bx, by], i) => {
    const [ax, ay] = pts[i], len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len, sx = -uy, sy = ux;
    for (let t = SQ * 2.5; t < len - SQ; t += SQ * 5) { const x = ax + ux * t, y = ay + uy * t; heads += `M${f(x - ux * 9 + sx * 8)} ${f(y - uy * 9 + sy * 8)}L${f(x)} ${f(y)}L${f(x - ux * 9 - sx * 8)} ${f(y - uy * 9 - sy * 8)}`; }
  });
  add(`<path d="${heads}" fill="none" stroke="${RED}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`);
}

/* The starting line: a rope of floats; the buoy off the gate; the racers' spots. */
{
  const L = RC.LINE, y = Y(L.r);
  add(`<path d="M${X(L.c0) - SQ / 2} ${y}H${X(L.c1) + SQ / 2}" stroke="${INK}" stroke-width="2"/>`);
  for (let c = L.c0; c <= L.c1; c++) add(`<circle cx="${X(c)}" cy="${y}" r="4.5" fill="#f2efe4" stroke="${INK}" stroke-width="1.5"/>`);
  const [bc, br] = RC.BUOY;
  add(`<g stroke="${INK}" stroke-width="2"><path d="M${X(bc) - 9} ${Y(br) + 8}L${X(bc)} ${Y(br) - 16}L${X(bc) + 9} ${Y(br) + 8}Z" fill="#c8402a"/><path d="M${X(bc) - 5} ${Y(br) - 2}h10" stroke="#f2efe4" stroke-width="4"/></g>`);
  for (const R of RIVALS) {
    const x = X(R.spot);
    add(`<g stroke="${INK}" stroke-width="1.6"><path d="M${x} ${y - 4}v-26"/><path d="M${x} ${y - 30}l16 6l-16 6Z" fill="${R.sail}"/></g>`);
  }
  add(`<circle cx="${X(RACE.LONG_SPOT)}" cy="${y}" r="7" fill="none" stroke="#b8902a" stroke-width="3"/>`);
}

/* The numbered buoys round the long way, on the outside of each bend. */
for (const b of RC.BUOYS) {
  const [c, r] = b.at, x = X(c) + (b.bend === 'R' ? 8 : -8), y = Y(r);
  add(`<g stroke="${INK}" stroke-width="2"><path d="M${x - 8} ${y + 10}L${x} ${y - 14}L${x + 8} ${y + 10}Z" fill="#f2efe4"/><path d="M${x - 5} ${y + 2}h10M${x - 6.5} ${y + 7}h13" stroke="#c8402a" stroke-width="3.5"/></g>`);
  add(`<circle cx="${x + (b.bend === 'R' ? 15 : -15)}" cy="${y - 20}" r="13" fill="#f6ead0" stroke="${INK}" stroke-width="2"/>`);
  add(label(x + (b.bend === 'R' ? 15 : -15), y - 20 + 7, [String(b.n)], { size: 0.5, weight: 700, col: '#5a1a0c', halo: false }));
}

/* The finish line across the run home, its two striped towers, the chequered line between. */
{
  const [c, r] = RC.FINISH, x = X(c) - SQ / 2, ya = Y(r) - SQ / 2, yb = Y(r) + SQ / 2;
  let ch = '';
  for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) ch += `<rect x="${x - 5 + j * 5}" y="${ya + i * 5}" width="5" height="5" fill="${INK}"/>`;
  add(`<rect x="${x - 5}" y="${ya}" width="10" height="${SQ}" fill="#f2efe4" stroke="${INK}" stroke-width="1.5"/>${ch}`);
  for (const ty of [ya - 6, yb + 6]) add(`<g stroke="${INK}" stroke-width="2"><rect x="${x - 7}" y="${ty - 10}" width="14" height="20" fill="#f2efe4"/><path d="M${x - 7} ${ty - 3}h14M${x - 7} ${ty + 4}h14" stroke="#c8402a" stroke-width="3.5"/><circle cx="${x}" cy="${ty - 14}" r="4.5" fill="#d9a93a"/></g>`);
}

/* ---- Words ---- */
// A label: lines of text, the first at (x, y), each next one a line down; a parchment halo so it reads.
function label(x, y, lines, o = {}) {
  const size = (o.size ?? 0.6) * SQ, lh = size * (o.lh ?? 1.15), col = o.col ?? INK, anchor = o.anchor ?? 'middle';
  const halo = o.halo === false ? '' : ` paint-order="stroke" stroke="rgba(238,220,172,.92)" stroke-width="${f(size * 0.28)}" stroke-linejoin="round"`;
  const rot = o.rotate ? ` transform="rotate(${o.rotate} ${f(x)} ${f(y)})"` : '';
  return `<text x="${f(x)}" y="${f(y)}" font-size="${f(size)}" text-anchor="${anchor}" fill="${col}"${o.style ? ` font-style="${o.style}"` : ''} font-weight="${o.weight ?? 500}"${halo}${rot}>${lines.map((ln, i) => {
    const [t, c, w, st] = Array.isArray(ln) ? ln : [ln];
    return `<tspan x="${f(x)}" dy="${i ? f(lh) : 0}"${c ? ` fill="${c}"` : ''}${w ? ` font-weight="${w}"` : ''}${st ? ` font-style="${st}"` : ''}>${esc(t)}</tspan>`;
  }).join('')}</text>`;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
const sv = (id) => `${Math.round(CUTS[id].saves)} s`;
const T = (t) => [t, '#5a1a0c', 700];   // a title line
const N = (t) => [t, INK, 500, 'italic'];   // a note line
const WIN = (t) => [t, '#8a1c10', 700];   // a win line
// Where a label goes: a square (c, r: fractions allowed) as the middle of its first line.
const at = (c, r, lines, o) => add(label(X(c), Y(r) + (o?.size ?? 0.6) * SQ * 0.35, lines, o));
const S = RC.STRETCHES, SP = RC.SPITS;

// The legs, each where it starts, the way it's sailed. (Sizes in squares: the words big enough to read on a
// phone, the chart scaled to its width.)
S.forEach((s, i) => {
  const right = s.d === 1, name = i === S.length - 1 ? 'the run home' : `leg ${i + 1}`;
  at(right ? 1.6 : W - 2.6, s.r, [[right ? `${name} \u2192` : `\u2190 ${name}`, '#5a1a0c', 700]], { size: 0.74, anchor: right ? 'start' : 'end', style: 'italic' });
});
// The start.
{
  const L = RC.LINE;
  at(L.c0 - 1.1, RC.BUOY[1] + 0.05, [T('\u2191 starting line: pick a spot')], { size: 0.6, anchor: 'start' });
  const zones = { left: [L.c0, 15], gap: [16, 20], right: [21, L.c1] };
  for (const [z, [a, b]] of Object.entries(zones)) {
    if (zoneOf(a) !== z || zoneOf(b) !== z) throw new Error(`the starting spots' zones have moved: ${z}`);
    at((a + b) / 2, RC.START.r0 - 0.2, [WIN(`${z === 'gap' ? 'by the gap' : z} ${pc(winOf(rep.bySpot[z]))}`)], { size: 0.66 });
    add(`<path d="M${X(a) - SQ / 2 + 4} ${Y(RC.START.r0) - SQ * 0.72}v6H${X(b) + SQ / 2 - 4}v-6" fill="none" stroke="#8a1c10" stroke-width="2"/>`);
  }
  at(RC.BUOY[0] + 0.7, RC.BUOY[1] + 0.05, [N('Space by the buoy')], { size: 0.56, anchor: 'start' });
  for (const R of RIVALS) at(R.spot + 0.45, L.r + 0.7, [[R.name, INK, 700]], { size: 0.55, anchor: 'start' });
  at(RACE.LONG_SPOT, L.r - 0.66, [N('long way\u2019s spot')], { size: 0.45 });
  const F = RC.FIELD;
  at(W - 1.6, F.r0 + 4.5, [N('trade wind back')], { size: 0.55, anchor: 'end' });
  at(4, F.r0 + 0.5, [N('the conveyor \u2192 the crowded line')], { size: 0.55, anchor: 'start' });
}
const BIG = { size: 0.78, lh: 1.17 };
// [A] spit 1: the gun gap.
// (the gate's words on the spit's far left, clear of the turning pool and the wreck; the pool's beside it)
at(0.7, SP[0].r1 + 0.05, [T(`The imperial gate · ${sv('guns')} ▸`), WIN(`Quad ${routeWin('gap-combo')} · shot ${routeWin('gap-shot')}`), WIN(`run ${routeWin('gap-run')} · bribe ${routeWin('bribe')}`), N('the bribe: haul the wreck')], { size: 0.56, lh: 1.12, anchor: 'start' });
// The gambles: the turning pool on leg 2, the veiled wind through spit 5 (what each way saves, GAMBLE.SAVES).
const GS = GAMBLE.SAVES, sgn = (n) => (n < 0 ? `−${-n}` : `+${n}`);
at(12.7, SP[0].r1 + 0.05, [T('◂ Turning pool'), N('a gamble: time its spin'), [`on to leg 3 · ${sgn(GS.turn.on)} s`, GOLD, 700], [`back to leg 1 · ${sgn(GS.turn.back)} s`, SNAKE, 700]], { size: 0.52, lh: 1.12 });
at(25.6, SP[0].r0 - 0.95, [N('guns\u2019 reach')], { size: 0.5, anchor: 'end', col: SNAKE });
// [B] spit 2: the Double's gap, the headwind gap, the trade wind up the middle (and the tight water below it).
at(9, SP[1].r1, [T('Double\u2019s gap'), N(`a Double \u00b7 ${sv('double')}`), WIN(`doubles ${routeWin('doubles')}`)], BIG);
at(16, SP[1].r1 - 0.3, [T('Headwind gap'), WIN(`row \u00b7 ${sv('headwind')} \u00b7 ${routeWin('headwind')}`)], { size: 0.6, lh: 1.1 });   // (two lines: the door below, a cave above)
at(23, SP[1].r1, [['SNAKE: trade wind', SNAKE, 700], N('hop on a Double'), N('or back to leg 2')], BIG);
at(RC.SNAKES.TIGHT[0][0] - 0.6, RC.SNAKES.TIGHT[0][1], [['tight water ▸', SNAKE, 700]], { size: 0.6, anchor: 'end' });
// [C] spit 3: the whirlpools, the starlit door, the barrier.
at(4.5, SP[2].r1 - 0.1, [T('Whirlpool channel'), N('a Vegas carries her'), [`saves ${sv('whirls')}`, '#5a1a0c', 700], WIN(`Vegas ${routeWin('whirls')}`), N('stopped in the open:'), N('a sitting duck')], BIG);
at(16, SP[2].r1 - 0.1, [['\u2605 Starlit door', DOOR_INK, 700], N('Navigation, Vegas'), ...DOOR.EXITS.map((e, k) => [`${k ? 'or ' : 'up at '}leg ${e.to + 1}: ${Math.round(e.saves)} s`, '#5a1a0c', 700]), WIN(`door ${routeWin('door')}`)], BIG);
at(22.5, SP[2].r1 - 0.1, [T('Barrier'), N('Foraging'), [`saves ${sv('forage')}`, '#5a1a0c', 700], WIN(`forage ${routeWin('forage')}`), N('sheltered')], BIG);
// [D] spit 4: the zigzag below it (on the long way) and the locks.
at(8, SP[3].r1, [T('The zigzag \u2193'), N(`hop on Doubles \u00b7 ${sv('zigzag')}`), WIN(`long way ${routeWin('long')}`)], BIG);
at(21, SP[3].r1, [T(`The locks \u00b7 saves ${sv('locks')}`), N('Bilge \u00b7 sheltered'), WIN(`locks ${routeWin('locks')}`)], BIG);
// [E] spit 5: the crane and the Triple's gap.
at(6, SP[4].r1, [T(`The crane \u00b7 saves ${sv('crane')}`), WIN(`Carpentry \u00b7 crane ${routeWin('crane')}`)], BIG);
at(20, SP[4].r1 + 0.05, [T('Triple’s gap'), N(`a Triple · ${sv('triple')}`), WIN(`doubles ${routeWin('doubles')}`)], { size: 0.46, lh: 1.12 });
at(15.3, SP[4].r1 + 0.1, [T('Veiled wind ▸'), N('a gamble: a coin toss'), [`${sgn(GS.veil.on)} s or ${sgn(GS.veil.back)} s`, '#5a1a0c', 700]], { size: 0.52, lh: 1.1 });
// The finish, and the left-hand trade wind up the whole left side.
at(RC.FINISH[0] + 0.8, RC.FINISH[1], [['FINISH', '#5a1a0c', 700]], { size: 0.7, anchor: 'start' });
at(14, S[5].r + 1, [['SNAKE: the left-hand trade wind, back to the start', SNAKE, 700]], { size: 0.6 });
for (const r of [S[0].r + 3, S[2].r + 4.5, S[4].r - 2]) add(label(X(0) + 7, Y(r), ['SNAKE: back to the start \u2193'], { size: 0.55, weight: 700, col: SNAKE, rotate: -90 }));

// A compass in the open water left of the start's field; out past Primates Rule, bottom left.
{
  const x = X(2.5), y = Y(RC.FIELD.r0 + 3);
  add(`<g stroke="${INK}" fill="${INK}" stroke-width="2"><circle cx="${x}" cy="${y}" r="17" fill="none"/>${[[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => `<path d="M${x + dx * 26} ${y + dy * 26}L${x + dy * 5} ${y - dx * 5}L${x - dy * 5} ${y + dx * 5}Z"${dy === -1 ? '' : ' fill="none"'}/>`).join('')}</g>`);
  add(label(x, y - 32, ['N'], { size: 0.5, weight: 700 }));
  add(label(X(0) - 6, Y(RBOT) + 6, ['out past Primates Rule'], { size: 0.5, anchor: 'start', style: 'italic' }));
}
add('</g>');

/* ---- The page ---- */
const RT = (n) => `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, '0')}`;
const PUZZLE = {
  long: ['The long way round the buoys', 'Sailing on the pilot; hops the zigzag’s headwinds on Doubles'],
  'gap-run': ['Gun gap, run a square at a time', 'no puzzle; holed once, patched by Carpentry'],
  'gap-combo': ['Gun gap, rushed', 'a Quad (Sailing), held and broken as she’s lined up'],
  'gap-shot': ['Gun gap, its guns shot quiet', 'her two starting shots, a hit a gun (Gunnery loads more)'],
  bribe: ['Gun gap, its guard bribed', 'Treasure Haul at the wreck in its notch off leg 1 (sheltered), then pay at the gate and be towed through'],
  headwind: ['Headwind gap, rowed', 'Rowing (mirror strokes); idle and she drifts back out'],
  doubles: ['The Double’s and Triple’s gaps', 'a Double, then a Triple, built on the move'],
  whirls: ['Whirlpool channel', 'a Sailing Vegas from its mouth; less sends her back'],
  forage: ['Barrier of driftwood', 'Foraging, from the notch in front of it'],
  locks: ['The locks', 'Bilge, pumping the up lock'],
  crane: ['The crane', 'Carpentry, building it a part at a time'],
  door: ['★ The starlit door', `Duty Navigation on the rock, then a Vegas each stretch of the tunnel: up at ${DOOR.EXITS.map((e) => `leg ${e.to + 1} saves ${Math.round(e.saves)} s`).join(', or ')}`],
  every: ['Every shortcut it comes to', 'the wreck and the gate’s bribe, the Double, the whirlpools, the locks, the crane'],
};
const MOVE = new Set(['guns', 'double', 'triple', 'zigzag']);
const kindOf = (id) => (MOVE.has(id) ? 'on the move' : id === 'headwind' ? 'rowing, slowly' : CUTS[id].sheltered ? 'stopped, sheltered' : 'stopped, exposed');
const racedBy = (name) => RIVALS.filter((R) => R.racer.route === name).map((R) => R.name).join(', ');
const maxWin = Math.max(...ROUTES.map((r) => winOf(rep.byRoute[r.name])), fair * 1.6);
const bar = (w) => `<div class="bar"><span style="width:${f((100 * w) / maxWin)}%" class="${w / fair < 0.75 ? 'lo' : w / fair > 1.25 ? 'hi' : ''}"></span><i style="left:${f((100 * fair) / maxWin)}%"></i></div>`;
const rows = ROUTES.map((R) => {
  const t = rep.byRoute[R.name], w = winOf(t), saves = R.cuts.reduce((n, id) => n + CUTS[id].saves, 0);
  const [name, how] = PUZZLE[R.name] ?? [R.name, ''];
  const kinds = [...new Set(R.cuts.map(kindOf))].join('; ');
  const by = racedBy(R.name);
  return `<tr><td><b>${esc(name)}</b><br><small>${esc(how)}${kinds ? ` · ${esc(kinds)}` : ''}${by ? ` · <em>${esc(by)}’s way</em>` : ''}</small>${bar(w)}</td><td class="n">${Math.round(saves)} s</td><td class="n"><b>${pc(w)}</b><br><small>${t ? f(w / fair).toFixed(2) : '-'}× fair</small></td></tr>`;
}).join('');
const small = (title, list, by) => `<table class="mini"><tr><th colspan="2">${title}</th></tr>${list.map((k) => `<tr><td>${esc(k)}</td><td class="n">${pc(winOf(by[k]))}</td></tr>`).join('')}</table>`;
const cutRows = Object.entries(rep.cuts).map(([id, c]) => `<tr><td>${esc(id)}</td><td class="n">${Math.round(CUTS[id].saves)}</td><td class="n">${pc(c.tried ? c.done / c.tried : 0)}</td>${SKILLS.map((k) => `<td class="n">${c.saved[k].n ? Math.round(c.saved[k].secs / c.saved[k].n) : '-'}</td>`).join('')}</tr>`).join('');
const snakes = Object.entries(rep.bySnake).map(([k, x]) => `${k === 'left' ? 'the left-hand trade wind' : k === 'mid' ? 'the trade wind up the middle' : 'the tight water'}: ${x.n} swept (${pc(x.n / (RACES * SIZE))} of racers), ${pc(x.n ? x.wins / x.n : 0)} still won`).join('; ');
const gambles = Object.entries(rep.bets).map(([id, b]) => `${id === 'turn' ? 'the turning pool' : 'the veiled wind'}: taken ${b.taken} times (by the leader ${b.by.leader}, the pack ${b.by.pack}, the last ${b.by.last}), ${pc(b.taken ? b.on / b.taken : 0)} carried her on`).join('; ');
const today = new Date().toISOString().slice(0, 10);

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sloop Race Chart</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,500;0,700;1,500&display=swap" rel="stylesheet">
<style>
  :root { --ink: #4a2c14; --red: #8a1c10; --paper: #ecd9a8; }
  html, body { margin: 0; background: #2b1a0e; color: var(--ink); font: 500 17px/1.4 Alegreya, Georgia, serif; }
  main { max-width: 980px; margin: 0 auto; padding: 14px 10px 40px; }
  h1 { font-size: 30px; margin: 4px 6px 0; color: #f0ddae; letter-spacing: .5px; }
  .sub { color: #d9c08c; margin: 2px 6px 12px; font-style: italic; }
  svg { width: 100%; height: auto; display: block; font-family: Alegreya, Georgia, serif; }
  .card { background: radial-gradient(ellipse at center, #f0ddae 0%, #dcc08a 80%, #c49a5e 100%); border-radius: 6px; padding: 14px 14px 10px; margin: 16px 0; box-shadow: 0 2px 12px #0008; }
  h2 { margin: 0 0 6px; font-size: 22px; color: #5a1a0c; }
  table { border-collapse: collapse; width: 100%; }
  td, th { padding: 6px 4px; border-bottom: 1px solid #4a2c1433; vertical-align: top; text-align: left; }
  td.n { text-align: right; white-space: nowrap; }
  small { font-size: 14px; }
  .bar { position: relative; height: 12px; margin: 6px 0 2px; max-width: 420px; background: #4a2c1418; border-radius: 3px; }
  .bar span { position: absolute; left: 0; top: 0; bottom: 0; background: #6f4a24; border-radius: 3px; }
  .bar span.lo { background: #9b2a14; } .bar span.hi { background: #2f5a24; }
  .bar i { position: absolute; top: -4px; bottom: -4px; border-left: 2px dashed var(--red); }
  .minis { display: flex; flex-wrap: wrap; gap: 12px; }
  .mini { width: auto; min-width: 150px; flex: 1; }
  .key { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 6px 14px; font-size: 15px; }
  .key div { display: flex; gap: 8px; align-items: center; }
  .key svg { width: 34px; height: 22px; flex: none; }
  .fine { color: #b89a6a; font-size: 13px; margin: 18px 6px 0; }
  .fair { font-style: italic; }
</style></head>
<body><main>
<h1>The Sloop Race: a chart of the course</h1>
<p class="sub">Every shortcut, snake and wind, and who wins by which way round: ${RACES} races of ${SIZE} simulated. Out to sea is up; the race starts at the bottom and winds up to the finish.</p>
<svg viewBox="${f(x0)} ${f(y0)} ${f(VW)} ${f(VH)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chart of the sloop race course">${svg.join('\n')}</svg>
<div class="card"><h2>The key</h2><div class="key">
  <div><svg viewBox="0 0 34 22"><path d="M2 11h30" stroke="${RED}" stroke-width="3" stroke-dasharray="8 5"/></svg>the long way, round the numbered buoys (${RT(SIM.LONG)}, ${f(PACE)} s a square)</div>
  <div><svg viewBox="0 0 34 22"><path d="M2 11h30" stroke="${GREEN}" stroke-width="3.4" stroke-dasharray="2 7" stroke-linecap="round"/></svg>a shortcut's way through a spit</div>
  <div><svg viewBox="0 0 34 22"><rect x="6" y="0" width="22" height="22" fill="rgba(170,45,20,.16)"/><path d="M8 11h17m-6 -5l6 5l-6 5" stroke="${SNAKE}" stroke-width="3" fill="none"/></svg>a snake: a wind that sweeps her back</div>
  <div><svg viewBox="0 0 34 22"><rect x="6" y="0" width="22" height="22" fill="rgba(40,74,96,.16)"/><path d="M8 11h17m-6 -5l6 5l-6 5" stroke="${BLUE}" stroke-width="2.6" fill="none"/></svg>a wind, the way it blows (a headwind to hop, the start's field, the whirlpools')</div>
  <div><svg viewBox="0 0 34 22"><rect x="6" y="0" width="22" height="22" fill="url(#k-shelter)" stroke="rgba(47,90,36,.7)"/><defs><pattern id="k-shelter" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="rgba(70,120,50,.18)"/><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(47,90,36,.55)" stroke-width="3"/></pattern></defs></svg>sheltered: safe to puzzle, even in the lead</div>
  <div><svg viewBox="0 0 34 22"><rect x="6" y="0" width="22" height="22" fill="url(#k-exp)" stroke="rgba(155,42,20,.7)"/><defs><pattern id="k-exp" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="8" height="8" fill="rgba(170,40,20,.12)"/><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(155,42,20,.5)" stroke-width="2.5"/></pattern></defs></svg>stopped in the open: a sitting duck for anyone behind</div>
  <div><svg viewBox="0 0 34 22"><rect x="2" y="2" width="30" height="18" rx="3" fill="none" stroke="${SNAKE}" stroke-width="2" stroke-dasharray="6 4"/></svg>a gun gap gun's reach (${CHECK.REACH} squares any way); crosshairs: the squares it's trained on</div>
  <div><svg viewBox="0 0 34 22"><circle cx="17" cy="11" r="9" fill="none" stroke="${BLUE}" stroke-width="2"/><path d="M17 11m-3 0a3 3 0 1 1 6 0a6 6 0 1 1 -12 0" fill="none" stroke="${BLUE}" stroke-width="2"/></svg>a whirlpool: stop on one and it has her; a gust zooms her over</div>
  <div><svg viewBox="0 0 34 22"><path d="M10 20v-26" stroke="${INK}"/><path d="M10 4l14 5l-14 5Z" fill="#b8322a" stroke="${INK}"/></svg>a rival's spot on the line (Kikkit red, Tzz blue, Dalnoth gold); the gold ring, the long way's</div>
  <div><svg viewBox="0 0 34 22"><path d="M2 11h30" stroke="${GOLD}" stroke-width="3.4" stroke-dasharray="2 7" stroke-linecap="round"/></svg>a gamble's ladder: where it carries her on</div>
  <div><svg viewBox="0 0 34 22"><path d="M2 11h30" stroke="${SNAKE}" stroke-width="3.4" stroke-dasharray="2 7" stroke-linecap="round"/></svg>a gamble's snake: where it sends her back</div>
</div></div>
<div class="card"><h2>Who wins, by which way round</h2>
<p class="fair">Fair is ${pc(fair)}: one race in ${SIZE}, in fields of ${SIZE}, each racer a different way round, a racing style and a skill drawn at random, and a level better at her own way's puzzle. The dashed line on each bar is fair; green is more than a quarter over it, red more than a quarter under. "Saves" is over the long way, for a decent player's puzzling (the puzzle's time is on top).</p>
<table><tr><th>Way round</th><th class="n">Saves</th><th class="n">Wins</th></tr>${rows}</table></div>
<div class="card"><h2>And the rest of the field</h2><div class="minis">
${small('By style', STYLES.map((s) => s.name), rep.byStyle)}
${small('By skill', SKILLS, rep.bySkill)}
${small('By starting spot', ['left', 'gap', 'right'], rep.bySpot)}
${small('Stopped in the open, won the race', ['leader', 'pack', 'last'], Object.fromEntries(Object.entries(rep.byPosition).map(([k, p]) => [k, { n: p.n, wins: p.wins }])))}
</div>
<p><small><b>Snakes:</b> ${esc(snakes) || 'none bit'}.</small></p>
<p><small><b>Gambles:</b> ${esc(gambles)}.</small></p>
<p><small><b>Stopped in the open, hit there:</b> leader ${pc(rep.byPosition.leader.n ? rep.byPosition.leader.hit / rep.byPosition.leader.n : 0)}, in the pack ${pc(rep.byPosition.pack.n ? rep.byPosition.pack.hit / rep.byPosition.pack.n : 0)}, last ${pc(rep.byPosition.last.n ? rep.byPosition.last.hit / rep.byPosition.last.n : 0)}.</small></p>
<h2>What each shortcut really saved</h2>
<table><tr><th>Shortcut</th><th class="n">Laid to save</th><th class="n">Done</th><th class="n">decent</th><th class="n">good</th><th class="n">great</th></tr>${cutRows}</table>
<p><small>Seconds, mean, by the racer's skill, her puzzling counted; less than nothing, it cost her.</small></p></div>
<p class="fine">Drawn ${today}, for the Pirate Den’s changelog and design page, by tools/race-map.mjs from the course as laid (LAY.RACE) and src/race-sim.ts's bots (gun gap guns '${RACE.GAP.MODE}'); run it again after a change to the course.</p>
</main></body></html>
`;
writeFileSync(OUT, html);
console.log(`Wrote ${OUT}`);
