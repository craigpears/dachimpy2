/* Pirate Den: the sloop race's parchment chart, one drawing for the tool and the den (14 Nov). TypeScript,
   compiled to js/race-chart.js; tested in tests/race-plan-chart.test.ts. Pure: no DOM, it writes SVG as text.

   The chart of the course in the captain's map's look (js/den/map.js: ink on old parchment, hand-lettered), drawn
   from the race's own data so it stays right as the course is re-laid (12 Nov, the user: "draw like a map of the
   course ... shows where all the shortcuts and things are"). Two use it:
   - tools/race-map.mjs, the chart on the changelog and design.html (changelog/race-map.jpg): this sheet, its own
     words over it (each shortcut's puzzle, saving and wins, from the race simulated).
   - the race plan's big chart in the den (js/den/plan-chart.js): this sheet, each leg's choices marked where they
     are with their names and puzzles (choicePlaces), your route on it, a click on a choice taking it. The user, 13
     Nov: "for a new player, they don't know what those things correspond to. They've not seen the map before ...
     we've got the nice 2D map for the chart kind of thing. Is it something that could be combined into that".
     No times or win rates on it (13 Nov: "that's just a behind-the-scenes balance thing"): what each choice is,
     where, and its line against the long way's.

   Everything is read when it's drawn (LAY.RACE as laid now: a course from the editor is the den's then), never
   kept from load. Where each shortcut's words go (wordsAt) is shared too, so the two charts label alike. */

import { LAY, SAIL, Sea } from './den-sail.js';
import { RACE, LONG_ROUTE } from './den-race.js';
import { CUTS, choiceLines, cutInT, cutOutT, longBetween, LEG_T } from './race-sim.js';
import { SHELTER } from './den-racers.js';
import { CHECK } from './den-checkpoint.js';
import { RIVALS } from './den-rivals.js';
import { whirlpool } from './den-whirl.js';
import { fieldFor, type StartField } from './start-field.js';
import { LEGS, STOPS, type Choice, type CutId, type Stop } from './race-plan.js';

export type Pt = [number, number];
/** A square's size on the sheet, in its units. */
export const SQ = 40;
export const INK = '#4a2c14', RED = '#7a2414', SNAKE = '#9b2a14', BLUE = '#284a60', GREEN = '#2f5a24', DOOR_INK = '#3b2a6b', GOLD = '#a8780f', TITLE = '#5a1a0c';
const LAND = '#d6b778';

const f = (n: number) => Math.round(n * 10) / 10;
const key = (c: number, r: number) => `${c},${r}`;
export function esc(s: unknown): string { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

/** A line of words: its text, or [text, colour, weight, style]. */
export type Line = string | [string, string?, number?, string?];
export interface LabelOpts { size?: number; lh?: number; col?: string; anchor?: 'start' | 'middle' | 'end'; halo?: boolean; rotate?: number; style?: string; weight?: number; attrs?: string }
/** Words on the sheet: lines of text, the first at (x, y), each next one a line down, with a parchment halo so
    they read. Sizes in squares. */
export function label(x: number, y: number, lines: Line[], o: LabelOpts = {}): string {
  const size = (o.size ?? 0.6) * SQ, lh = size * (o.lh ?? 1.15), col = o.col ?? INK, anchor = o.anchor ?? 'middle';
  const halo = o.halo === false ? '' : ` paint-order="stroke" stroke="rgba(238,220,172,.92)" stroke-width="${f(size * 0.28)}" stroke-linejoin="round"`;
  const rot = o.rotate ? ` transform="rotate(${o.rotate} ${f(x)} ${f(y)})"` : '';
  return `<text x="${f(x)}" y="${f(y)}" font-size="${f(size)}" text-anchor="${anchor}" fill="${col}"${o.style ? ` font-style="${o.style}"` : ''} font-weight="${o.weight ?? 500}"${halo}${rot}${o.attrs ?? ''}>${lines.map((ln, i) => {
    const [t, c, w, st] = Array.isArray(ln) ? ln : [ln];
    return `<tspan x="${f(x)}" dy="${i ? f(lh) : 0}"${c ? ` fill="${c}"` : ''}${w ? ` font-weight="${w}"` : ''}${st ? ` font-style="${st}"` : ''}>${esc(t)}</tspan>`;
  }).join('')}</text>`;
}

/** The sheet drawn: its squares' places on it, its view, and its layers (the paper, the sea, the land and all
    that's on the water), the clipped group left open for the words over it (sheetSvg closes it). */
export interface Sheet {
  X: (c: number) => number;
  Y: (r: number) => number;
  /** A label whose first line's middle sits on square (c, r), fractions allowed. */
  at: (c: number, r: number, lines: Line[], o?: LabelOpts) => string;
  x0: number; y0: number; w: number; h: number; viewBox: string;
  layers: string[];
}
/** The whole chart as one svg: the sheet, `over` (words, lines) on it inside its edge. */
export const sheetSvg = (s: Sheet, over: string[] = [], attrs = ''): string =>
  `<svg viewBox="${s.viewBox}" xmlns="http://www.w3.org/2000/svg"${attrs}>${s.layers.join('\n')}\n${over.join('\n')}</g></svg>`;

/** The sheet's squares to the sheet: out to sea at the top, as on the captain's map, the race starting at the
    bottom and winding up to the finish. */
export function sheetFrame(): Pick<Sheet, 'X' | 'Y' | 'x0' | 'y0' | 'w' | 'h' | 'viewBox'> {
  const RC = LAY.RACE, W = SAIL.COLS, RTOP = RC.STRETCHES[RC.STRETCHES.length - 1].r + 1, RBOT = RC.START.r0;
  const X = (c: number) => (c + 0.5) * SQ, Y = (r: number) => (RTOP - r + 0.5) * SQ;
  const x0 = -0.8 * SQ, x1 = (W + 0.8) * SQ, y0 = -0.9 * SQ, y1 = (RTOP - RBOT + 1.8) * SQ;
  return { X, Y, x0, y0, w: x1 - x0, h: y1 - y0, viewBox: `${f(x0)} ${f(y0)} ${f(x1 - x0)} ${f(y1 - y0)}` };
}

/** The chart's sheet, drawn: `field` the start's (one race's; seed 1's on the changelog's chart), `ids` a prefix
    for its defs' ids so two on a page don't clash. */
export function sheet(o: { field?: StartField; ids?: string } = {}): Sheet {
  const RC = LAY.RACE, W = SAIL.COLS, FIELD = o.field ?? fieldFor(1), id = o.ids ?? 'rc-';
  const sea = new Sea(9);
  sea.layField(FIELD);
  const R0 = RC.R0, RTOP = RC.STRETCHES[RC.STRETCHES.length - 1].r + 1, RBOT = RC.START.r0;
  const fr = sheetFrame(), { X, Y, x0, y0 } = fr, VW = fr.w, VH = fr.h, x1 = x0 + VW, y1 = y0 + VH;
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];   // (the way each heading points on the sheet)
  let seed = 12;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const svg: string[] = [];
  const add = (s: string) => { svg.push(s); };

  const barrier = new Set([...RC.FORAGE.BARRIER, ...RC.ROCKS.WALL, ...RC.FIELD.HOP.ROCKS].map(([c, r]) => key(c, r)));
  const isLand = (c: number, r: number) => c >= 0 && c < W && r > R0 && r <= RTOP && sea.ground(c, r) && !barrier.has(key(c, r));
  const reef = new Set(RC.REEF.map(([c, r]) => key(c, r)));
  const whirlSq = new Set<string>();
  const pools = [...FIELD.POOLS, ...RC.WHIRLS.POOLS].map((p) => whirlpool(p));
  for (const w of pools) for (const [c, r] of w.squares) whirlSq.add(key(c, r));

  // What each wind is: a snake, the whirlpool channel's, a headwind to hop, the start's field.
  const kind = new Map<string, string>();
  for (const [c, r] of RC.SNAKES.LEFT) kind.set(key(c, r), 'left');
  for (const [c, r] of RC.SNAKES.MID) kind.set(key(c, r), 'mid');
  for (const [c, r] of RC.WHIRLS.WINDS) kind.set(key(c, r), 'whirls');
  for (const [c, r] of [RC.DOUBLE.WIND, ...RC.TRIPLE, ...RC.ZIGZAG]) kind.set(key(c, r), 'hop');
  for (const [c, r] of [...RC.FIELD.HOP.HEAD, ...RC.FIELD.HOP.LANE]) kind.set(key(c, r), 'hop');
  for (const [c, r] of [...RC.FIELD.CONVEYOR, ...RC.FIELD.BACK]) kind.set(key(c, r), 'field');

  // A hand-drawn line through points (sheet units), wobbling a little between them.
  const wobbly = (pts: Pt[], close = false, jag = 3) => {
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
  add(`<defs>
  <radialGradient id="${id}paper" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#f0ddae"/><stop offset=".72" stop-color="#dcc08a"/><stop offset="1" stop-color="#a3763e"/></radialGradient>
  <pattern id="${id}shelter" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="rgba(70,120,50,.18)"/><line x1="0" y1="0" x2="0" y2="10" stroke="rgba(47,90,36,.55)" stroke-width="3"/></pattern>
  <pattern id="${id}exposed" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="10" height="10" fill="rgba(170,40,20,.12)"/><line x1="0" y1="0" x2="0" y2="10" stroke="rgba(155,42,20,.5)" stroke-width="2.5"/></pattern>
  <filter id="${id}grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .22  0 0 0 0 .1  0 0 0 .09 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <clipPath id="${id}sheet"><path id="edge"/></clipPath>
</defs>`);
  {
    // A ragged, burnt edge.
    const edge: Pt[] = [], m = 6, side = (ax: number, ay: number, bx: number, by: number, n: number) => { for (let i = 0; i < n; i++) { const t = i / n; edge.push([ax + (bx - ax) * t + (rnd() - 0.5) * 12, ay + (by - ay) * t + (rnd() - 0.5) * 12]); } };
    side(x0 + m, y0 + m, x1 - m, y0 + m, 30); side(x1 - m, y0 + m, x1 - m, y1 - m, 44); side(x1 - m, y1 - m, x0 + m, y1 - m, 30); side(x0 + m, y1 - m, x0 + m, y0 + m, 44);
    const d = `M${edge.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`;
    svg[0] = svg[0].replace('<path id="edge"/>', `<path d="${d}"/>`);
    add(`<path d="${d}" fill="url(#${id}paper)"/>`);
    add(`<g clip-path="url(#${id}sheet)">`);
    add(`<rect x="${x0}" y="${y0}" width="${VW}" height="${VH}" filter="url(#${id}grain)" fill="#000"/>`);
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
    const tint: Record<string, string> = { left: 'rgba(170,45,20,.16)', mid: 'rgba(170,45,20,.16)', whirls: 'rgba(40,74,96,.1)', hop: 'rgba(40,74,96,.16)', field: 'rgba(40,74,96,.12)' };
    const arrows = { snake: '', blue: '' };
    for (let r = RBOT; r <= RTOP; r++) for (let c = 0; c < W; c++) {
      const d = sea.windAt(c, r);
      if (d === undefined || r <= R0) continue;
      const k = kind.get(key(c, r)) ?? 'field', x = X(c), y = Y(r), ux = DX[d], uy = DY[d], sx = -uy, sy = ux;
      add(`<rect x="${f(x - SQ / 2)}" y="${f(y - SQ / 2)}" width="${SQ}" height="${SQ}" fill="${tint[k]}"/>`);
      const a = SQ * 0.32, h = SQ * 0.17;
      const s = `M${f(x - ux * a)} ${f(y - uy * a)}L${f(x + ux * a)} ${f(y + uy * a)}M${f(x + ux * (a - h) + sx * h)} ${f(y + uy * (a - h) + sy * h)}L${f(x + ux * a)} ${f(y + uy * a)}L${f(x + ux * (a - h) - sx * h)} ${f(y + uy * (a - h) - sy * h)}`;
      if (k === 'left' || k === 'mid') arrows.snake += s; else arrows.blue += s;
    }
    add(`<path d="${arrows.blue}" fill="none" stroke="${BLUE}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`);
    add(`<path d="${arrows.snake}" fill="none" stroke="${SNAKE}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`);
    // The start's slow winds (one race's): a dotted square and one short arrow, a nudge, not a lane.
    let slow = '';
    for (const [c, r, d] of FIELD.SLOW) {
      const x = X(c), y = Y(r), ux = DX[d], uy = DY[d], sx = -uy, sy = ux, a = SQ * 0.2, h = SQ * 0.13;
      add(`<rect x="${f(x - SQ / 2 + 4)}" y="${f(y - SQ / 2 + 4)}" width="${SQ - 8}" height="${SQ - 8}" fill="rgba(40,74,96,.07)" stroke="${BLUE}" stroke-width="1.4" stroke-dasharray="3 3"/>`);
      slow += `M${f(x - ux * a)} ${f(y - uy * a)}L${f(x + ux * a)} ${f(y + uy * a)}M${f(x + ux * (a - h) + sx * h)} ${f(y + uy * (a - h) + sy * h)}L${f(x + ux * a)} ${f(y + uy * a)}L${f(x + ux * (a - h) - sx * h)} ${f(y + uy * (a - h) - sy * h)}`;
    }
    add(`<path d="${slow}" fill="none" stroke="${BLUE}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  /* The land: each spit, filled, its coast inked with a cliff's hachures, a few hills. */
  {
    let fill = '', hach = '';
    const coast: [Pt, Pt][] = [];
    for (let r = R0 + 1; r <= RTOP; r++) for (let c = 0; c < W; c++) {
      if (!isLand(c, r)) continue;
      fill += `M${f(X(c) - SQ / 2 - 0.6)} ${f(Y(r) - SQ / 2 - 0.6)}h${SQ + 1.2}v${SQ + 1.2}h${-SQ - 1.2}Z`;
      // each side with water beyond it (not the board's edge)
      for (let d = 0; d < 4; d++) {
        const nc = c + [0, 1, 0, -1][d], nr = r + [1, 0, -1, 0][d];
        if (nc < 0 || nc >= W || isLand(nc, nr)) continue;
        const cx = X(c), cy = Y(r), ux = DX[d], uy = DY[d], sx = -uy, sy = ux, hs = SQ / 2;
        const a: Pt = [cx + ux * hs + sx * hs, cy + uy * hs + sy * hs], b: Pt = [cx + ux * hs - sx * hs, cy + uy * hs - sy * hs];
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
    for (const k of SHELTER) { const [c, r] = k.split(',').map(Number); add(`<rect x="${X(c) - SQ / 2}" y="${Y(r) - SQ / 2}" width="${SQ}" height="${SQ}" fill="url(#${id}shelter)" stroke="rgba(47,90,36,.7)" stroke-width="1.5"/>`); }
    for (const cid of ['whirls', 'headwind', 'door'] as const) { const { c, r } = CUTS[cid].at; if (!CUTS[cid].sheltered) add(`<rect x="${X(c) - SQ / 2}" y="${Y(r) - SQ / 2}" width="${SQ}" height="${SQ}" fill="url(#${id}exposed)" stroke="rgba(155,42,20,.7)" stroke-width="1.5"/>`); }
  }

  /* Whirlpools: an inked spiral, clockwise, over their squares (the channel's each missing a corner). */
  for (const w of pools) {
    const [mc, mr] = w.mid, cx = X(mc), cy = Y(mr);
    let d = '';
    for (let t = 0; t <= 3.2 * Math.PI * 2; t += 0.25) { const rad = 3 + t * 1.55, x = cx + Math.cos(t) * rad, y = cy + Math.sin(t) * rad; d += `${d ? 'L' : 'M'}${f(x)} ${f(y)}`; }
    add(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${SQ * 0.9}" fill="rgba(40,74,96,.12)" stroke="rgba(40,74,96,.5)" stroke-width="1.5" stroke-dasharray="4 4"/>`);
    add(`<path d="${d}" fill="none" stroke="${BLUE}" stroke-width="2.4" stroke-linecap="round"/>`);
  }

  /* The rocks: across the rocks' gap in spit 3 (blasted open in a race, anyone's three hits), and walling in the
     start's hop. Boulders, inked. */
  {
    let p = '';
    for (const [c, r] of [...RC.ROCKS.WALL, ...RC.FIELD.HOP.ROCKS]) for (let k = 0; k < 3; k++) {
      const x = X(c) + (rnd() - 0.5) * 18, y = Y(r) + (rnd() - 0.5) * 14, s = 7 + rnd() * 5;
      p += `M${f(x - s)} ${f(y + s * 0.6)}L${f(x - s * 0.5)} ${f(y - s * 0.7)}L${f(x + s * 0.4)} ${f(y - s * 0.8)}L${f(x + s)} ${f(y + s * 0.6)}Z`;
    }
    add(`<path d="${p}" fill="#a39684" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`);
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
  {
    const D = RC.DOOR, fx = (X(D.FACE[0][0]) + X(D.FACE[1][0])) / 2, fy = Y(D.FACE[0][1]) + SQ / 2;
    const caves: Pt[] = D.EXITS.map((e) => [fx, Y(e.OUT[0][1]) - SQ / 2]), [ox, oy] = caves[caves.length - 1];
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
    const ways: Pt[][] = [
      [[RC.GUNS.way[0][0], S[0].r + 1], [RC.GUNS.way[2][0], RC.GUNS.way[2][1] + 1]],
      [[RC.BRIBE.NOTCH[0], S[0].r + 1], RC.BRIBE.NOTCH],
      [[RC.HEADWIND[0][0], S[1].r + 1], ...RC.HEADWIND, [RC.HEADWIND[RC.HEADWIND.length - 1][0], S[2].r]],
      [[RC.DOUBLE.WAY[0][0], S[1].r + 1], [RC.DOUBLE.WAY[0][0], S[2].r]],
      [[RC.WHIRLS.MOUTH.c, RC.WHIRLS.MOUTH.r], [RC.WHIRLS.OUT[0], RC.WHIRLS.OUT[1]]],
      [[RC.FORAGE.NOTCH[0], S[2].r + 1], RC.FORAGE.NOTCH, RC.FORAGE.OUT],
      [[RC.ROCKS.WALL[0][0], S[2].r + 1], RC.ROCKS.OUT],
      [[RC.FIELD.HOP.c0 + 1, RC.FIELD.HOP.FROM], [RC.FIELD.HOP.c0 + 1, RC.FIELD.HOP.FROM + 2], [RC.FIELD.HOP.LANDS[0], RC.FIELD.HOP.FROM + 2], RC.FIELD.HOP.LANDS],
      [[RC.LOCKS[0].at[0], S[3].r], [RC.LOCKS[1].at[0], S[4].r]],
      [[RC.CRANE.LEDGE[0], S[4].r], RC.CRANE.LEDGE],
      [[RC.TRIPLE[0][0], S[4].r + 1], [RC.TRIPLE[0][0], S[5].r]],
    ];
    add(`<path d="${ways.map((w) => `M${w.map(([c, r]) => `${f(X(c))} ${f(Y(r))}`).join('L')}`).join('')}" fill="none" stroke="${GREEN}" stroke-width="3.4" stroke-dasharray="2 7" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  /* The long way, dashed, round the buoys, with arrowheads the way she goes. */
  {
    const pts: Pt[] = LONG_ROUTE.map(([c, r]) => [X(c), Y(r)]);
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
    add(label(x + (b.bend === 'R' ? 15 : -15), y - 20 + 7, [String(b.n)], { size: 0.5, weight: 700, col: TITLE, halo: false }));
  }

  /* The finish line across the run home, its two striped towers, the chequered line between. */
  {
    const [c, r] = RC.FINISH, x = X(c) - SQ / 2, ya = Y(r) - SQ / 2, yb = Y(r) + SQ / 2;
    let ch = '';
    for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) ch += `<rect x="${x - 5 + j * 5}" y="${ya + i * 5}" width="5" height="5" fill="${INK}"/>`;
    add(`<rect x="${x - 5}" y="${ya}" width="10" height="${SQ}" fill="#f2efe4" stroke="${INK}" stroke-width="1.5"/>${ch}`);
    for (const ty of [ya - 6, yb + 6]) add(`<g stroke="${INK}" stroke-width="2"><rect x="${x - 7}" y="${ty - 10}" width="14" height="20" fill="#f2efe4"/><path d="M${x - 7} ${ty - 3}h14M${x - 7} ${ty + 4}h14" stroke="#c8402a" stroke-width="3.5"/><circle cx="${x}" cy="${ty - 14}" r="4.5" fill="#d9a93a"/></g>`);
  }

  // A compass in the open water left of the start's field; out past Primates Rule, bottom left.
  {
    const x = X(2.5), y = Y(RC.FIELD.r0 + 3);
    add(`<g stroke="${INK}" fill="${INK}" stroke-width="2"><circle cx="${x}" cy="${y}" r="17" fill="none"/>${[[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => `<path d="M${x + dx * 26} ${y + dy * 26}L${x + dy * 5} ${y - dx * 5}L${x - dy * 5} ${y + dx * 5}Z"${dy === -1 ? '' : ' fill="none"'}/>`).join('')}</g>`);
    add(label(x, y - 32, ['N'], { size: 0.5, weight: 700 }));
    add(label(X(0) - 6, Y(RBOT) + 6, ['out past Primates Rule'], { size: 0.5, anchor: 'start', style: 'italic' }));
  }

  const at = (c: number, r: number, lines: Line[], o?: LabelOpts) => label(X(c), Y(r) + (o?.size ?? 0.6) * SQ * 0.35, lines, o);
  return { ...fr, at, layers: svg };
}

function star(x: number, y: number, s: number): string {
  let p = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? s * 0.42 : s; p += `${i ? 'L' : 'M'}${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`; }
  return `<path d="${p}Z" fill="#e7c34a" stroke="${INK}" stroke-width="1.2"/>`;
}

/* ---- Where the words go ---- */

/** Where a thing's words go: a square (fractions allowed) as the middle of its first line, and which way they
    run from it. */
export interface Words { c: number; r: number; anchor: 'start' | 'middle' | 'end' }
export type WordsId = 'gate' | 'bay' | 'wreck' | 'double' | 'headwind' | 'door' | 'snake' | 'whirls' | 'rocks' | 'forage' | 'zigzag' | 'locks' | 'berth' | 'crane' | 'triple' | 'finish' | 'line';
/** Each shortcut's words, beside what it names (12 Nov: the user couldn't tell the gate's or the locks' labels
    were theirs, nor what the wreck was for), as both charts place them. */
export function wordsAt(): Record<WordsId, Words> {
  const RC = LAY.RACE, SP = RC.SPITS, BY = RC.BAY, sp = (k: number) => (SP[k].r0 + SP[k].r1) / 2;
  const w = (c: number, r: number, anchor: Words['anchor'] = 'middle'): Words => ({ c, r, anchor });
  const gaps = (RC.DOUBLE.WAY[0][0] + RC.HEADWIND[0][0]) / 2;
  return {
    gate: w(RC.GUNS.gap[0] - 1.2, BY.MOLE + 0.05, 'end'),
    bay: w(BY.TURN[0] - 0.9, BY.MOLE - 0.4, 'end'),
    wreck: w(RC.BRIBE.NOTCH[0] - 0.6, RC.BRIBE.NOTCH[1] + 0.3, 'end'),
    double: w(gaps, SP[1].r0 + 0.05),
    headwind: w(gaps, SP[1].r1 + 0.05),
    door: w(RC.DOOR.FACE[1][0] + 2.6, sp(1) - 0.45),
    snake: w(RC.SNAKES.MID[0][0] + 1.7, sp(1) - 0.45),
    whirls: w(4.5, sp(2) - 1.5),
    rocks: w(RC.ROCKS.WALL[0][0] - 2.1, sp(2) - 1.2),
    forage: w(RC.FORAGE.NOTCH[0] + 3.2, sp(2) - 1.2),
    zigzag: w(7, sp(3) - 0.5),
    locks: w(RC.BERTH[0] + 4.3, sp(3) - 0.6),
    berth: w(RC.BERTH[0] + 0.6, SP[3].r0 + 1.05, 'start'),
    crane: w(RC.CRANE.LEDGE[0] - 4.4, sp(4) - 0.35),
    triple: w(RC.TRIPLE[0][0] + 2.2, sp(4) - 0.35),
    finish: w(RC.FINISH[0] + 0.8, RC.FINISH[1], 'start'),
    line: w(RC.LINE.c0 - 1.1, RC.BUOY[1] + 0.05, 'start'),
  };
}
/** Each leg's name, where it starts, the way it's sailed ("leg 1 →", "← leg 2"; the last "the run home"). */
export function legWords(): (Words & { name: string; text: string })[] {
  const RC = LAY.RACE, S = RC.STRETCHES, W = SAIL.COLS;
  return S.map((s, i) => {
    const right = s.d === 1, name = i === S.length - 1 ? 'the run home' : `leg ${i + 1}`;
    return { c: right ? 1.6 : W - 2.6, r: s.r, anchor: right ? 'start' : 'end', name, text: right ? `${name} →` : `← ${name}` };
  });
}

/* ---- The plan's choices on the chart ---- */

/** A leg's choice where it is on the course (the race plan's big chart): the squares she stops at for its puzzle
    (none for the long way, or running the gate: its way in), its words' place and its two lines (its name and
    a pointer, its puzzle), its line on the course and the long way's it leaves (`skips`; the long way's own: its
    leg), and both their lengths in squares, so a new player sees each choice against the long way. */
export interface ChoicePlace {
  leg: number; id: Choice; name: string; puzzle: string;
  /** Where she stops for it, and what the pilot says there (STOPS's own words). */
  stops: Pt[]; says: string[];
  words: Words; lines: [string, string];
  line: Pt[][]; skips: Pt[];
  squares: number; longSquares: number;
}
/** Squares along a line (corner to corner, as the crow flies between them). */
export const lineSquares = (pts: readonly Pt[]): number => pts.slice(1).reduce((n, [c, r], i) => n + Math.hypot(c - pts[i][0], r - pts[i][1]), 0);
/** The stops each choice makes, the pilot's own (src/race-plan.ts, STOPS); running the gate makes none, its way
    in marked instead. */
function stopsOf(id: Choice): { at: Pt; say: string }[] {
  const RC = LAY.RACE, S = STOPS, of = (s: Stop) => ({ at: [s.at[0], s.at[1]] as Pt, say: s.say });
  switch (id) {
    case 'long': return [];
    case 'run': return [{ at: [RC.GUNS.way[0][0], RC.GUNS.way[0][1]], say: 'The imperial gate · straight through, holed by its guns' }];
    case 'bribe': return [of(S.wreck), of(S.pay)];
    case 'zigzag': return S.zigzag.map(of);
    default: return [of(S[id as Exclude<Choice, 'long' | 'run' | 'bribe' | 'zigzag'>])];
  }
}
/** Its words: the shortcut's own place (the gate's three ways: the bribe at the wreck, shooting and running stacked
    at the gate), the long way at its leg's name. */
const WORDS_OF: Partial<Record<Choice, WordsId>> = { bribe: 'wreck', shoot: 'gate', run: 'gate', headwind: 'headwind', door: 'door', double: 'double', whirls: 'whirls', rocks: 'rocks', forage: 'forage', zigzag: 'zigzag', locks: 'locks', crane: 'crane', triple: 'triple' };
/** Squares off to one side of its words a choice's stop is for them to point at it (▸, ◂). */
export const POINT = 1.5;
/** Every leg's every choice, where it is: the same LEGS the strip offers, in their order. */
export function choicePlaces(): ChoicePlace[] {
  const spots = wordsAt(), legs = legWords(), out: ChoicePlace[] = [];
  LEGS.forEach((L, leg) => L.options.forEach((o) => {
    const st = stopsOf(o.id), says = [...new Set(st.map((s) => s.say.replace(/ \d+ of \d+/, '')))];
    const wid = WORDS_OF[o.id], cuts = o.cuts.filter((c): c is Exclude<CutId, 'zigzag'> => c !== 'zigzag');
    const line = choiceLines(leg, o.id);
    // (the long way it leaves: from where its first shortcut leaves the long way to where its last comes out onto it)
    const main = cuts.filter((c) => c !== 'wreck');
    const skips: Pt[] = main.length ? longBetween(cutInT(main[0]), cutOutT(main[main.length - 1])) : longBetween(LEG_T[leg], LEG_T[leg + 1]);
    let words: Words, lines: [string, string];
    // (the long way on its leg, where its name goes, the way it's sailed: "Leg 1: the long way →", "← Leg 2: the long way")
    if (!wid) {
      const g = legs[leg], what = `Leg ${leg + 1}: ${o.name.toLowerCase()}`;
      words = { c: g.c, r: g.r + 0.8, anchor: g.anchor };   // (on the leg's water, between its two rows)
      lines = [g.anchor === 'end' ? `← ${what}` : `${what} →`, o.puzzle];
    }
    else {
      const s = spots[wid];
      words = o.id === 'run' ? { ...s, r: s.r - 1.75 } : s;
      // (a pointer at where she stops, when it's off to one side of the words)
      const dc = st.length ? Math.min(...st.map((x) => x.at[0])) - words.c : 0, dc2 = st.length ? Math.max(...st.map((x) => x.at[0])) - words.c : 0;
      lines = [dc > POINT ? `${o.name} ▸` : dc2 < -POINT ? `◂ ${o.name}` : o.name, o.puzzle];
    }
    out.push({ leg, id: o.id, name: o.name, puzzle: o.puzzle, stops: st.map((s) => s.at), says, words, lines, line, skips, squares: line.reduce((n, l) => n + lineSquares(l), 0), longSquares: lineSquares(skips) });
  }));
  return out;
}
