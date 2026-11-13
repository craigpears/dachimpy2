/* Distilling's board reader, the piece level: each white's risk, as numbers (the user, 13 Nov, the thirty-third note:
   "you need some kind of little agent or something that detects, traps, and risks and prioritizes which white pieces
   to try and rescue"; and "those need to be actual features and calculations, not just things of note"). For every
   white near the fire: how trapped it is, whether junk can reach it to take its place, and how soon its column burns,
   made into one number, its risk; the whites ranked by it. TypeScript, compiled to js/distill-risk.js; tested in
   tests/distill-read.test.ts. The pattern level is src/distill-patterns.ts, the state and tactic read from both
   src/distill-read.ts; the planner (src/distill-bots.ts) ranks its moves by the risk they take away.

   How a white gets out (Stage I, whites left): a piece of junk takes its place from the left. A black falls into a
   white's place from above (its up-left neighbour), a brown rises into it from below (its down-left neighbour), and
   the white goes the other way, left. So a white's reach is the fewest swaps for junk to get there: a black brought to
   its up-left place, or a brown to its down-left place, through the board as it stands (a black moves down through
   whites and up through browns, a brown up through whites and down through blacks; never through the white itself),
   then the swap into its place. 1: it can go now. None (Infinity): nothing can get to it as the board stands
   ("there's no way of getting a [brown] up to those two at the top", P5).

   A white's trap, what makes it hard to save, added up:
   - its reach: the drags still to make (half a point a swap past the first, at most REACH_MAX), FAR if nothing can;
   - near the top (TOP, the most on the top row, less each half row down to the third row): "I'd definitely be going at
     the top because I see the risk of traps. Because there's blacks at the top and there's just no way for things to
     move as freely up there" (P1); the top right going bad is the snowball;
   - on the bottom row (EDGE), beside a spice (SPICE), with no swap at all beside it (BOXED);
   - each piece of junk round it (ROUND): blacks round it, walled in;
   - walled off from the left by spice for good (WALLED).
   Its urgency: how soon its column reaches the furnace (`burnsIn`: the furnace's time left and a column's time for each
   column between), 1 at URGENT_MS, more nearer. Its risk: (1 + trap) times urgency, so a white walled in at the top
   comes before one lower down that can still be saved later (P1), and any white comes first as its column's time
   runs out.

   Pure: no randomness, no clock; knows nothing of the den. */

import { BURN_TICKS, COLS, DOWN_LEFT, DOWN_RIGHT, SPICE, TICK_MS, UP_LEFT, UP_RIGHT, WHITE, beats, maskOn, neighbourOn } from './distilling.js';
import type { Board } from './distilling.js';
import { behindSpice } from './distill-score.js';
import { canGo, halfOf, isJunk } from './distill-routines.js';

/** The piece level's weights. */
export const RISK = {
  /** The columns next to the fire whose whites are read: the fire's side (src/distill-phase.ts, FIRE_COLS). */
  COLS: 3,
  /** A column's time on the fire, ms (the furnace takes one every 50 ticks). */
  BURN_MS: (BURN_TICKS + 1) * TICK_MS,
  /** Reach: each swap past the first, at most REACH_MAX; nothing can reach it, FAR. */
  REACH: 0.5,
  REACH_MAX: 4,
  FAR: 8,
  /** Near the top: TOP on the top row, TOP_STEP less each half row down. */
  TOP: 4,
  TOP_STEP: 0.8,
  /** On the bottom row; beside a spice; with no swap at all beside it; each piece of junk round it; walled off by
      spice. */
  EDGE: 2,
  SPICE: 2,
  BOXED: 1,
  ROUND: 1,
  WALLED: 14,
  /** Urgency: this many ms to its burn counts 1; nearer counts more (to URGENT_MAX), further less. */
  URGENT_MS: 30000,
  URGENT_MAX: 6,
  /** A white this much at risk or more is flagged (the planner works it first). */
  FLAG: 4,
};

/** A white near the fire, read. */
export interface WhiteRisk {
  x: number;
  y: number;
  /** It can go left on its own now. */
  free: boolean;
  /** On its column's top or bottom row. */
  edge: 'top' | 'bottom' | null;
  /** Beside a spice; walled off from the left by spice for good (or in a pocket behind one). */
  spice: boolean;
  walled: boolean;
  /** No swap at all with any piece beside it; pieces of junk beside it. */
  boxed: boolean;
  round: number;
  /** Swaps for junk to take its place from the left (1: it can go now); Infinity, nothing can. */
  reach: number;
  /** ms till its column burns. */
  burnsIn: number;
  /** How trapped it is, and its risk ((1 + trap) times urgency). */
  trap: number;
  risk: number;
}

const ALL = [UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT], UP = [UP_LEFT, UP_RIGHT];

/** The fewest swaps for a piece of kind `p` (a black or a brown, any on the board) to get to `goal`, the board as it
    stands: a walk from every such piece, each step a swap it could make into the next place, never through `skip`
    (Infinity if none gets there). 0 if `goal` holds one already. */
export function reachTo(cols: Board, p: number, goal: [number, number], skip?: [number, number]): number {
  if (cols[goal[0]][goal[1]] === p) return 0;
  const d = cols.map((c) => c.map(() => Infinity)), queue: [number, number][] = [];
  cols.forEach((c, x) => c.forEach((q, y) => { if (q === p) { d[x][y] = 0; queue.push([x, y]); } }));
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const w of ALL) {
      const n = neighbourOn(cols, x, y, w);
      if (!n || d[n[0]][n[1]] !== Infinity) continue;
      const q = cols[n[0]][n[1]];
      if (q === SPICE || q === p || (skip && n[0] === skip[0] && n[1] === skip[1])) continue;
      if (!(UP.includes(w) ? beats(p, q) : beats(q, p))) continue;
      d[n[0]][n[1]] = d[x][y] + 1;
      if (n[0] === goal[0] && n[1] === goal[1]) return d[x][y] + 1;
      queue.push(n);
    }
  }
  return Infinity;
}

/** The swaps for junk to take the white at (x, y)'s place from the left (see the header). */
export function reachOf(cols: Board, x: number, y: number): number {
  if (canGo(cols, x, y, -1)) return 1;
  const ul = neighbourOn(cols, x, y, UP_LEFT), dl = neighbourOn(cols, x, y, DOWN_LEFT);
  return 1 + Math.min(ul ? reachTo(cols, 2, ul, [x, y]) : Infinity, dl ? reachTo(cols, 1, dl, [x, y]) : Infinity);
}

/** The furnace's ms to each column (Stage I: every column before it burns first, a column's time each). */
export const burnsIn = (x: number, timeLeft: number): number => timeLeft + (COLS - 1 - x) * RISK.BURN_MS;
/** Urgency at ms to burn: 1 at URGENT_MS, more as it nears (at most URGENT_MAX), less further off. */
export const urgency = (ms: number): number => Math.min(RISK.URGENT_MAX, RISK.URGENT_MS / Math.max(1, ms));

/** One white read (see the header). */
export function whiteRisk(cols: Board, x: number, y: number, timeLeft: number): WhiteRisk {
  const reach = reachOf(cols, x, y), len = cols[x].length, h = halfOf(cols, x, y);
  const edge = y === 0 ? 'top' : y === len - 1 ? 'bottom' : null;
  let round = 0, spice = cols[x][y - 1] === SPICE || cols[x][y + 1] === SPICE;
  for (const w of ALL) {
    const n = neighbourOn(cols, x, y, w);
    if (!n) continue;
    const q = cols[n[0]][n[1]];
    if (q === SPICE) spice = true; else if (isJunk(q)) round++;
  }
  const walled = behindSpice(cols, x, y), boxed = maskOn(cols, x, y) === 0;
  const trap = (walled ? RISK.WALLED : reach === Infinity ? RISK.FAR : Math.min(RISK.REACH_MAX, (reach - 1) * RISK.REACH))
    + Math.max(0, RISK.TOP - RISK.TOP_STEP * h) + (edge === 'bottom' ? RISK.EDGE : 0)
    + (spice ? RISK.SPICE : 0) + (boxed ? RISK.BOXED : 0) + RISK.ROUND * round;
  const ms = burnsIn(x, timeLeft);
  return { x, y, free: reach === 1, edge, spice, walled, boxed, round, reach, burnsIn: ms, trap, risk: (1 + trap) * urgency(ms) };
}

/** The whites in the RISK.COLS columns next to the fire (from column `from` on), each read, the most at risk first. */
export function whiteRisks(cols: Board, timeLeft: number, from = COLS - RISK.COLS): WhiteRisk[] {
  const out: WhiteRisk[] = [];
  for (let x = Math.max(1, from); x < COLS; x++) cols[x].forEach((p, y) => { if (p === WHITE) out.push(whiteRisk(cols, x, y, timeLeft)); });
  return out.sort((a, b) => b.risk - a.risk || b.x - a.x);
}

/** The whites' risk added up: what a move is judged by when the whites by the fire come first. */
export const riskTotal = (cols: Board, timeLeft: number, from = COLS - RISK.COLS): number =>
  whiteRisks(cols, timeLeft, from).reduce((s, w) => s + w.risk, 0);

/** The whites flagged: at risk RISK.FLAG or more, the most at risk first. */
export const flagged = (risks: readonly WhiteRisk[]): WhiteRisk[] => risks.filter((w) => w.risk >= RISK.FLAG);
