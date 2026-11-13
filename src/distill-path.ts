/* A piece brought round to take a stuck piece's place: Distilling's path search, beside the named techniques
   (the user, 13 Nov, the eighteenth note: "it's almost better to model it as a path ... a pathfinding A-star
   style problem. Find the path of a piece that could take that white's place. But obviously that pathfinding
   can involve loops"). TypeScript, compiled to js/distill-path.js; tested in tests/distill-path.test.ts.

   A piece is stuck where it can't go the way it has to (`stuck`): in Stage I a white trapped on the top or
   bottom edge with junk between it and the whites (src/distill-score.ts, `trappedWhite`), a brown or a black
   trapped among the whites (`trapped`), or a white in a column about to burn with no way out left; in the
   chain, junk in a column still to go up Crystal Clear with no way out left. The search (`bringRound`) finds
   one drag, the cheapest in a person's time (a moment to pick the piece up, a hand's speed along it, a little
   for each turn: the user, 12 Nov, "one smooth mouse motion is cheap"), of some other piece along legal swaps,
   loops and all, ending in a swap with the stuck piece that sends it its way: a brown looped round under a
   white trapped at the top, which then rises past the white and the white drops out left. A* over the boards
   the drag leaves (the same square with the board changed behind it is a new place, which is how a loop is
   found), the heuristic the squares still to go; capped at a few thousand boards, so it runs per move in the
   browser.

   When no one drag gets there (the user, 13 Nov, the nineteenth note: "you have to drag that brown upwards so
   then you could drag a black over and into that spot"), `openWay` tries one piece moved out of the way first,
   a short drag near the stuck piece, and searches again on the board it leaves: the two drags played together,
   costed as a person's two (`bringRound`'s search kept small for each, so it stays cheap per move). Only for
   whites in the columns next to burn, where it matters.

   The bots (src/distill-bots.ts) offer it as a fallback, when none of the named routines unsticks anything;
   its moves are then judged like any other. The named routines are the shapes such a search tends to find;
   the search covers what they miss.

   Pure: no randomness, no clock. */

import { COLS, DOWN_LEFT, DOWN_RIGHT, SPICE, UP_LEFT, UP_RIGHT, WHITE, canSwapOn, neighbourOn } from './distilling.js';
import type { Board } from './distilling.js';
import { trapped, trappedWhite, wall } from './distill-score.js';
import { canGo, halfOf, isJunk, placeName, playDrags } from './distill-routines.js';
import type { Ctx, Drag } from './distill-routines.js';

/** A move the search found: one drag, and why. Its technique is 'path', beside the named routines. */
export interface PathMove { routine: 'path'; drags: Drag[]; reason: string }
/** What a person's time is made of (a Style's pace): a hand's speed, swaps a second, and ms to spot a drag. */
export interface Pace { rate: number; spot: number }

/** The search's limits and a turn's cost. */
export const PATH = {
  /** The longest drag searched, in swaps. */
  SWAPS: 12,
  /** Boards looked at, at most, for one stuck piece. */
  NODES: 2500,
  /** Stuck pieces searched for, at most, a move (the furnace's side first). */
  TARGETS: 4,
  /** ms for each turn within a drag (as the planner's TURN_MS). */
  TURN_MS: 60,
  /** Opening the way (`openWay`): pieces this many squares from the stuck one or nearer are tried, moved up to
      ENABLE_SWAPS swaps, at most ENABLE_BOARDS of them, each searched on with ENABLE_NODES boards. */
  ENABLE_NEAR: 4,
  ENABLE_SWAPS: 2,
  ENABLE_BOARDS: 80,
  ENABLE_NODES: 300,
};

const ALL = [UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT];
const LEFT = [UP_LEFT, DOWN_LEFT], RIGHT = [UP_RIGHT, DOWN_RIGHT];

/** A stuck piece, and the side it has to go (-1 left, 1 right). */
export interface Stuck { x: number; y: number; side: number }

/** The pieces stuck where they can't go the way they have to (see the header), the furnace's side first. */
export function stuck(cols: Board, ctx: Ctx): Stuck[] {
  const out: Stuck[] = [], at = ctx.stage === 'junk' ? wall(cols).at : 0;
  for (let x = COLS - 1; x >= 0; x--) for (let y = 0; y < cols[x].length; y++) {
    const p = cols[x][y];
    if (ctx.stage === 'junk') {
      if (p === WHITE && (trappedWhite(cols, x, y, at) || (x >= ctx.burnFrom && x > 0 && !canGo(cols, x, y, -1)))) out.push({ x, y, side: -1 });
      else if (trapped(cols, x, y)) out.push({ x, y, side: 1 });
    } else if (isJunk(p) && x >= ctx.fill && x < ctx.burnFrom && !canGo(cols, x, y, -1)) out.push({ x, y, side: -1 });
  }
  return out;
}

/** Squares apart: every swap is a column across and half a piece up or down. */
const apart = (cols: Board, a: [number, number], b: [number, number]): number =>
  Math.max(Math.abs(a[0] - b[0]), Math.abs(halfOf(cols, a[0], a[1]) - halfOf(cols, b[0], b[1])) );

interface Node { b: Board; at: [number, number]; ways: number[]; cost: number; f: number; from: [number, number] }

/** The cheapest drag, in a person's time, of some other piece round to the stuck one at (x, y) and into its
    place, sending it toward `side`: its drags (one), or null if none within the search's limits. */
export function bringRound(cols: Board, s: Stuck, pace: Pace, limits = PATH): Drag[] | null {
  return search(cols, s, pace, limits, limits.NODES)?.drags ?? null;
}

/** bringRound's search: the drag and its cost in ms, a person's. */
function search(cols: Board, s: Stuck, pace: Pace, limits: typeof PATH, nodes: number, skip?: ReadonlySet<string>): { drags: Drag[]; ms: number } | null {
  const swapMs = 1000 / pace.rate, q = cols[s.x][s.y];
  // Where the piece brought round must stand to swap the stuck one its way: beside it on that side.
  const goals = (s.side < 0 ? LEFT : RIGHT).map((d) => neighbourOn(cols, s.x, s.y, d)).filter((n): n is [number, number] => !!n);
  if (!goals.length) return null;
  const h = (b: Board, at: [number, number]) => Math.min(...goals.map((g) => apart(b, at, g))) * swapMs;
  const open: Node[] = [];
  const push = (n: Node) => { // a binary heap on f
    open.push(n);
    for (let i = open.length - 1; i > 0;) { const j = (i - 1) >> 1; if (open[j].f <= open[i].f) break; [open[i], open[j]] = [open[j], open[i]]; i = j; }
  };
  const pop = (): Node => {
    const top = open[0], last = open.pop()!;
    if (open.length) {
      open[0] = last;
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < open.length && open[l].f < open[m].f) m = l;
        if (r < open.length && open[r].f < open[m].f) m = r;
        if (m === i) break;
        [open[i], open[m]] = [open[m], open[i]]; i = m;
      }
    }
    return top;
  };
  // Every other piece that could reach in time and swaps with something: a place to start.
  for (let x = 0; x < COLS; x++) for (let y = 0; y < cols[x].length; y++) {
    const p = cols[x][y];
    if (p === SPICE || (x === s.x && y === s.y) || p === q || skip?.has(`${x},${y}`)) continue;
    const at: [number, number] = [x, y];
    if (apart(cols, at, goals[0]) > limits.SWAPS && (goals.length < 2 || apart(cols, at, goals[1]) > limits.SWAPS)) continue;
    push({ b: cols, at, ways: [], cost: pace.spot, f: pace.spot + h(cols, at), from: at });
  }
  const seen = new Set<string>();
  let looked = 0;
  while (open.length && looked < nodes) {
    const n = pop();
    const key = `${n.at[0]},${n.at[1]}:${n.b.map((c) => c.join('')).join('|')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    looked++;
    // Done: beside the stuck piece on its side, and the swap sends it that way.
    if (goals.some((g) => g[0] === n.at[0] && g[1] === n.at[1])) {
      for (const d of ALL) {
        const t = neighbourOn(n.b, n.at[0], n.at[1], d);
        if (t && t[0] === s.x && t[1] === s.y && n.b[s.x][s.y] === q && canSwapOn(n.b, n.at[0], n.at[1], s.x, s.y)) {
          return { drags: [{ x: n.from[0], y: n.from[1], ways: [...n.ways, d] }], ms: n.cost + swapMs + (n.ways.length && n.ways[n.ways.length - 1] !== d ? limits.TURN_MS : 0) };
        }
      }
    }
    if (n.ways.length >= limits.SWAPS) continue;
    for (const d of ALL) {
      const t = neighbourOn(n.b, n.at[0], n.at[1], d);
      // Never through the stuck piece on the way: it's swapped only at the end, its way.
      if (!t || (t[0] === s.x && t[1] === s.y) || !canSwapOn(n.b, n.at[0], n.at[1], t[0], t[1])) continue;
      const b = n.b.map((c) => c.slice());
      const p = b[n.at[0]][n.at[1]]; b[n.at[0]][n.at[1]] = b[t[0]][t[1]]; b[t[0]][t[1]] = p;
      const turn = n.ways.length && n.ways[n.ways.length - 1] !== d ? limits.TURN_MS : 0;
      const cost = n.cost + swapMs + turn;
      push({ b, at: t, ways: [...n.ways, d], cost, f: cost + h(b, t), from: n.from });
    }
  }
  return null;
}

/** A few ways into a piece's place, each the cheapest drag of a different piece, cheapest first: to show, not
    to play (the user, 13 Nov, of Helium ringing a white by the fire: "maybe it should show some arrows of nearby
    routes of pieces that can be dragged into the spots"). At most `most`; none if nothing reaches it. */
export function routesInto(cols: Board, s: Stuck, pace: Pace, most = 3, limits = PATH): Drag[] {
  const out: Drag[] = [], skip = new Set<string>();
  while (out.length < most) {
    const r = search(cols, s, pace, limits, limits.NODES, skip);
    if (!r) break;
    out.push(r.drags[0]);
    skip.add(`${r.drags[0].x},${r.drags[0].y}`);
  }
  return out;
}

/** When no one drag brings a piece round to the stuck one: the cheapest pair, in a person's time, of a piece
    near it moved out of the way first (a short drag) and then a piece brought round into its place on the board
    that leaves (the user, 13 Nov, the nineteenth note: "what's a single thing that could move, like in this
    example, that brown piece that would allow me to get to that path"). Its two drags, or null. */
export function openWay(cols: Board, s: Stuck, pace: Pace, limits = PATH): Drag[] | null {
  const swapMs = 1000 / pace.rate, target: [number, number] = [s.x, s.y];
  // Every short drag of a piece near the stuck one, never of the stuck one or through it.
  const firsts: { drag: Drag; b: Board; ms: number }[] = [], seen = new Set<string>();
  const walk = (b: Board, from: [number, number], at: [number, number], ways: number[]) => {
    if (ways.length) {
      const key = b.map((c) => c.join('')).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        const turns = ways.filter((w, i) => i > 0 && w !== ways[i - 1]).length;
        firsts.push({ drag: { x: from[0], y: from[1], ways: [...ways] }, b, ms: pace.spot + ways.length * swapMs + turns * limits.TURN_MS });
      }
    }
    if (ways.length >= limits.ENABLE_SWAPS) return;
    for (const d of ALL) {
      const t = neighbourOn(b, at[0], at[1], d);
      if (!t || (t[0] === s.x && t[1] === s.y) || !canSwapOn(b, at[0], at[1], t[0], t[1])) continue;
      const nb = b.map((c) => c.slice());
      const p = nb[at[0]][at[1]]; nb[at[0]][at[1]] = nb[t[0]][t[1]]; nb[t[0]][t[1]] = p;
      walk(nb, from, t, [...ways, d]);
    }
  };
  for (let x = 0; x < COLS; x++) for (let y = 0; y < cols[x].length; y++) {
    if (cols[x][y] === SPICE || (x === s.x && y === s.y) || apart(cols, [x, y], target) > limits.ENABLE_NEAR) continue;
    walk(cols, [x, y], [x, y], []);
  }
  // The cheapest first, so the best pair is likely found before the cap.
  firsts.sort((a, b) => a.ms - b.ms);
  let best: { drags: Drag[]; ms: number } | null = null;
  for (const f of firsts.slice(0, limits.ENABLE_BOARDS)) {
    if (best && f.ms >= best.ms) break;
    const then = search(f.b, s, pace, limits, limits.ENABLE_NODES);
    if (then && (!best || f.ms + then.ms < best.ms)) best = { drags: [f.drag, ...then.drags], ms: f.ms + then.ms };
  }
  return best?.drags ?? null;
}

const NAMES = ['white', 'brown', 'black', 'spice', 'burnt white'];

/** Moves bringing a piece round to each stuck piece given (the first few; all that are stuck, the furnace's
    side first, if none are given). */
export function pathMoves(cols: Board, ctx: Ctx, pace: Pace, targets: readonly Stuck[] = stuck(cols, ctx), limits = PATH): PathMove[] {
  const out: PathMove[] = [];
  for (const s of targets.slice(0, limits.TARGETS)) {
    const what = NAMES[cols[s.x][s.y]], out_ = s.side < 0 ? 'left' : 'right';
    const drags = bringRound(cols, s, pace, limits);
    if (drags) {
      const d = drags[0], turns = d.ways.filter((w, i) => i > 0 && w !== d.ways[i - 1]).length;
      out.push({
        routine: 'path', drags,
        reason: `the ${what} at ${placeName(s.x, s.y)} is stuck: bring the ${NAMES[cols[d.x][d.y]]} at ${placeName(d.x, d.y)} round${turns > 1 ? ', looping,' : ''} to take its place, and it's out ${out_}`,
      });
      continue;
    }
    // No one drag gets there: a white in the columns next to burn gets a piece moved out of the way first.
    if (ctx.stage !== 'junk' || cols[s.x][s.y] !== WHITE || s.x < ctx.burnFrom) continue;
    const two = openWay(cols, s, pace, limits);
    if (!two) continue;
    const [a, b] = two, after = playDrags(cols, [a]);
    out.push({
      routine: 'path', drags: two,
      reason: `nothing reaches the ${what} at ${placeName(s.x, s.y)}: move the ${NAMES[cols[a.x][a.y]]} at ${placeName(a.x, a.y)} out of the way, then bring the ${after ? NAMES[after[b.x][b.y]] : 'piece'} at ${placeName(b.x, b.y)} round into its place, and it's out ${out_}`,
    });
  }
  return out;
}
