/* Distilling's techniques, each a routine of its own (DISTILLING.md §3, and the user's own account of them,
   12 Nov). TypeScript, compiled to js/distill-routines.js; tested in tests/distill-routines.test.ts. The
   bots (src/distill-bots.ts) play them, picked by a planner by stage; the tutorial will demonstrate them
   and "Help, Helium" plays the one your board needs from where it stands. So a routine knows nothing of
   who plays it: given a board (Distilling's columns, left to right, each top to bottom) and what the
   player is after (`Ctx`: the stage, the columns to burn, the column being filled), it says where it
   applies and the drags it would make from there, best first. Each runs on any board.

   A routine is played as drags, never as separate swaps (the user, 12 Nov: "the whole point is
   everything's like one smooth motion ... like zooming them along, but in one smooth, like one
   operation"): a `Drag` is a piece held and swept along its whole path, a swap at each step; a pair's
   routine is a few such drags in quick succession.

   The routines (ROUTINES), by the user's plan for a run (DISTILLING.md, "Watching the first bots"):
   - rescue: save the whites in a column about to burn, dragged out left (up through blacks, down
     through browns), with a helper's drag first when it can't go on its own. Never burn a white.
   - junkColumn: the furnace's column made ready, one column at a time: its last whites out and a black
     on top (a black tip) so it burns and never floats up as pure brown.
   - diamond: junk run right to the junk columns: a black down-right across the whites, then up through
     the browns to the blacks on top; a brown up-right, then down through the blacks to the browns. So
     the junk columns fill black above, brown below. In Stage II, the mirror: junk out of the whites to
     the left.
   - store: junk on the left kept ready to cross: blacks lifted through browns to the top.
   - crawl: a black and a brown together, crawling level through whites (a brown at the top among whites
     can't move alone; with a black beside it the pair crawls along, carrying the whites the other way).
   - figureEight: a black and a brown looped round each other, up or down the board through whites.
   - linePull: a black at the front of a line of browns, the line pulled up a tile at a time.
   - leapfrog: a black swept sideways along a row of browns stored at the top (or a brown along blacks at
     the bottom), up into each and down past it, in one drag.
   - hook: when pieces are scarce, a black dragged down through whites into a brown, hooking up past it,
     and the brown dragged on.
   - channel: Stage II, whites ferried right through the junk on the left, up through blacks and down
     through browns, to fill the next column to go up.

   Pure: no randomness, no clock. Places are 0-based here; a routine's reason names them as a player
   would, columns counted from the left from 1. */

import {
  BLACK, BROWN, BURNT, COLS, DOWN_LEFT, DOWN_RIGHT, SPICE, TALL, UP_LEFT, UP_RIGHT, WHITE, beats, canSwapOn, linkedOn, neighbourOn, weightOf,
} from './distilling.js';
import type { Board } from './distilling.js';

/** A swap: the piece at (x, y) swapped one way (UP_RIGHT...). */
export type Step = [number, number, number];
/** A drag: the piece at (x, y) held and swept along `ways`, a swap at each. */
export interface Drag { x: number; y: number; ways: number[] }
export type RoutineName = 'rescue' | 'junkColumn' | 'diamond' | 'turnOver' | 'store' | 'crawl' | 'figureEight' | 'linePull' | 'leapfrog' | 'hook' | 'channel';
/** A routine's moves from where the board stands: its drags in order, and why, in plain words. */
export interface Move { routine: RoutineName; drags: Drag[]; reason: string }

/** What the player is after. Stage I ('junk'): whites left, junk right, the junk columns from `burnFrom`
    to the furnace burned one at a time. Stage II ('chain'): whites right; the columns from `burnFrom`
    still burn (the last junk columns), the column `fill` (the rightmost not yet Crystal Clear left of
    them) is being filled with whites. `reach`: the longest drag, in swaps. */
export interface Ctx { stage: 'junk' | 'chain'; burnFrom: number; fill: number; reach: number }

export interface Routine {
  name: RoutineName;
  /** Its name for a player, and what it does in a line (the tutorial's caption). */
  label: string;
  about: string;
  /** Every way it applies to this board now, best first: none, it doesn't apply. */
  find(cols: Board, ctx: Ctx): Move[];
}

// ---------------------------------------------------------------- the board, in half pieces

/** A piece's height in half pieces, 0 the top of a tall column to 16 the bottom of one. Every swap moves a
    piece a column across and one half up or down. */
export const halfOf = (cols: Board, x: number, y: number): number => 2 * y + (cols[x].length === TALL ? 0 : 1);
export const isJunk = (p: number): boolean => p === BROWN || p === BLACK || p === BURNT;
export const copyBoard = (cols: Board): Board => cols.map((c) => [...c]);
const RIGHT = [UP_RIGHT, DOWN_RIGHT], LEFT = [UP_LEFT, DOWN_LEFT], ALL = [UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT];
/** The ways toward a side: right (1) or left (-1). */
const towards = (side: number) => (side > 0 ? RIGHT : LEFT);
/** Where a place is, as a player names it. */
export const placeName = (x: number, y: number): string => `column ${x + 1}, row ${y + 1}`;

/** Swap the piece at (x, y) one way on a board, if the rules let it: where it went. */
function swapIn(b: Board, x: number, y: number, d: number): [number, number] | null {
  const n = neighbourOn(b, x, y, d);
  if (!n || !canSwapOn(b, x, y, n[0], n[1])) return null;
  const t = b[x][y]; b[x][y] = b[n[0]][n[1]]; b[n[0]][n[1]] = t;
  return n;
}
/** Play drags on a copy of the board: the board after, or null if any swap of them isn't legal. */
export function playDrags(cols: Board, drags: readonly Drag[]): Board | null {
  const b = copyBoard(cols);
  for (const d of drags) {
    let at: [number, number] | null = [d.x, d.y];
    for (const w of d.ways) { at = swapIn(b, at[0], at[1], w); if (!at) return null; }
  }
  return b;
}
/** Drags as single swaps, in order. */
export function stepsOf(cols: Board, drags: readonly Drag[]): Step[] {
  const out: Step[] = [];
  for (const d of drags) {
    let x = d.x, y = d.y;
    for (const w of d.ways) { out.push([x, y, w]); [x, y] = neighbourOn(cols, x, y, w)!; }
  }
  return out;
}
/** Swaps joined into drags: a swap of the piece the last one moved carries the same drag on. */
export function dragsOf(cols: Board, steps: readonly Step[]): Drag[] {
  const out: Drag[] = [];
  let end: [number, number] | null = null;
  for (const [x, y, w] of steps) {
    if (!end || end[0] !== x || end[1] !== y) out.push({ x, y, ways: [] });
    out[out.length - 1].ways.push(w);
    end = neighbourOn(cols, x, y, w);
  }
  return out;
}
export const swapsIn = (drags: readonly Drag[]): number => drags.reduce((n, d) => n + d.ways.length, 0);

/** Whether the piece at (x, y) can swap toward a side (1 right, -1 left). */
export function canGo(cols: Board, x: number, y: number, side: number): boolean {
  for (const d of towards(side)) {
    const n = neighbourOn(cols, x, y, d);
    if (n && canSwapOn(cols, x, y, n[0], n[1])) return true;
  }
  return false;
}
/** Whether any neighbour toward a side is a piece the test likes. */
function besideOn(cols: Board, x: number, y: number, side: number, test: (p: number) => boolean): boolean {
  for (const d of towards(side)) {
    const n = neighbourOn(cols, x, y, d);
    if (n && test(cols[n[0]][n[1]])) return true;
  }
  return false;
}

/** Junk caught in the whites: whites beside it on both sides. */
export const embedded = (cols: Board, x: number, y: number): boolean => isJunk(cols[x][y])
  && besideOn(cols, x, y, 1, (q) => q === WHITE) && besideOn(cols, x, y, -1, (q) => q === WHITE);

/** Every drag of the piece at (x, y) up to `reach` swaps along the ways given, each kept if `keep` likes
    the board it leaves (the piece then at `at`). A player traces these by eye: "this black falls
    down-right through the whites". */
function traceDrags(cols: Board, x: number, y: number, ways: readonly number[], reach: number,
  keep: (b: Board, at: [number, number], n: number) => boolean, max = 120, budget = 3000): number[][] {
  const b = copyBoard(cols), out: number[][] = [], path: number[] = [];
  let nodes = 0;
  const dfs = (cx: number, cy: number) => {
    if (path.length >= reach || out.length >= max || nodes++ > budget) return;
    for (const d of ways) {
      const n = swapIn(b, cx, cy, d);
      if (!n) continue;
      path.push(d);
      if (keep(b, n, path.length)) out.push([...path]);
      dfs(n[0], n[1]);
      path.pop();
      const t = b[cx][cy]; b[cx][cy] = b[n[0]][n[1]]; b[n[0]][n[1]] = t;
    }
  };
  dfs(x, y);
  return out;
}

/** A few pieces moved together through a sea of one colour (the crawl, the figure of eight, the line
    pull): each swap is one of them with a piece of the sea, or two of them with each other, so the
    board is the sea everywhere they've been. The fewest drags and swaps that reach the best `score` (a
    number, or null for a place not worth stopping at). A drag goes on while the same piece moves. */
function groupSearch(cols: Board, movers: readonly [number, number][], sea: number, maxSwaps: number,
  score: (pos: readonly [number, number][]) => number | null, maxStates = 2500): { steps: Step[]; score: number } | null {
  const types = movers.map(([x, y]) => cols[x][y]), start = new Set(movers.map(([x, y]) => x * 16 + y));
  const at = (pos: readonly [number, number][], x: number, y: number): number => {
    for (let i = 0; i < pos.length; i++) if (pos[i][0] === x && pos[i][1] === y) return types[i];
    return start.has(x * 16 + y) ? sea : cols[x][y];
  };
  const swappable = (pos: readonly [number, number][], x1: number, y1: number, x2: number, y2: number): boolean => {
    if (!linkedOn(cols, x1, y1, x2, y2)) return false;
    const a = at(pos, x1, y1), b = at(pos, x2, y2);
    const above = cols[x1].length === TALL ? y1 === y2 : y1 < y2;
    return above ? beats(b, a) : beats(a, b);
  };
  interface Node { pos: [number, number][]; steps: Step[]; last: number; cost: number }
  const buckets: Node[][] = [[{ pos: movers.map(([x, y]) => [x, y] as [number, number]), steps: [], last: -1, cost: 0 }]];
  const seen = new Map<string, number>();
  let best: { steps: Step[]; score: number } | null = null, bestValue = -Infinity, states = 0;
  for (let c = 0; c < buckets.length && states < maxStates; c++) {
    for (const node of buckets[c] ?? []) {
      if (states++ >= maxStates) break;
      if (node.steps.length >= maxSwaps) continue;
      for (let i = 0; i < node.pos.length; i++) for (let d = 0; d < 4; d++) {
        const [x, y] = node.pos[i], n = neighbourOn(cols, x, y, d);
        if (!n) continue;
        const j = node.pos.findIndex((p) => p[0] === n[0] && p[1] === n[1]);
        if (j < 0 && (at(node.pos, n[0], n[1]) !== sea)) continue;
        if (!swappable(node.pos, x, y, n[0], n[1])) continue;
        const pos = node.pos.map((p) => [p[0], p[1]] as [number, number]);
        pos[i] = [n[0], n[1]];
        if (j >= 0) pos[j] = [x, y];
        const cost = node.cost + 1 + (node.last === i ? 0 : 2);
        const key = `${pos.map((p) => p[0] * 16 + p[1]).join(',')}:${i}`;
        if ((seen.get(key) ?? Infinity) <= cost) continue;
        seen.set(key, cost);
        const steps: Step[] = [...node.steps, [x, y, d]];
        const s = score(pos);
        if (s !== null && s - 0.05 * cost > bestValue) { bestValue = s - 0.05 * cost; best = { steps, score: s }; }
        (buckets[cost] ??= []).push({ pos, steps, last: i, cost });
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------- reading the board

/** A column ready to burn: no whites, and more blacks than whites (burnt whites count as whites). */
export function burnsClean(col: readonly number[]): boolean {
  let w = 0, weight = 0;
  for (const p of col) { if (p === WHITE) w++; weight += weightOf(p); }
  return w === 0 && weight > 0;
}
/** A column ready to go up Crystal Clear: only whites and spice. */
export const clear = (col: readonly number[]): boolean => col.every((p) => p === WHITE || p === SPICE);
/** Stage I's junk column being built: the rightmost not yet ready to burn (those right of it are). */
export function junkTarget(cols: Board): number {
  let t = COLS - 1;
  while (t > 0 && burnsClean(cols[t])) t--;
  return t;
}
/** Stage II's column being filled: the rightmost left of `burnFrom` not yet Crystal Clear (-1: none). */
export function fillTarget(cols: Board, burnFrom: number): number {
  let f = Math.min(burnFrom, COLS) - 1;
  while (f >= 0 && clear(cols[f])) f--;
  return f;
}
/** Whites in the columns from x on. */
export function whitesFrom(cols: Board, x: number): number {
  let n = 0;
  for (let i = Math.max(0, x); i < COLS; i++) for (const p of cols[i]) if (p === WHITE) n++;
  return n;
}

// ---------------------------------------------------------------- how good a board is

/** The weights of `measure` (exported to tune from tools/distill-bots.mjs). */
export const M = {
  /** A white in a column to burn, times NEAR by how close the furnace is (its column, the next, the rest). */
  BURN_WHITE: 12,
  NEAR: [3, 1.6, 1] as number[],
  /** The furnace's column would float up (no whites but no black more): a pure brown. */
  FLOAT: 15,
  /** Stage I: junk not yet in the junk columns, and a little more a column further off. */
  JUNK: 1.5,
  JUNK_FAR: 0.25,
  /** A black too low (or a brown too high) to cross the whites on its own before it hits the edge. */
  LOW: 2.5,
  /** ... and on the edge itself, a black on the bottom or a brown on the top: trapped once whites close
      round it ("blacks get stuck at the bottom, browns at the top"). */
  EDGE: 5,
  /** Stage I: junk caught in the whites (whites both sides), where it'll be trapped as they close round. */
  EMBED: 3,
  /** A piece among the others that can't move the way it has to go: stuck. */
  STUCK: 4,
  /** Stage I: blacks high, browns low on the left (ready to cross: "store blacks top-left"). */
  STORE: 0.4,
  /** The junk columns in the diamond's order: blacks above, browns below. */
  ZONE_SORT: 2,
  /** A burnt white not yet burned. */
  BURNT: 1,
  /** Stage I: whites drift left. */
  WHITE_LEFT: 0.05,
  /** Stage II: junk in the column being filled (and less in the one after), and every white a column
      right (every junk a column left). */
  FILL_JUNK: 10,
  FLOW: 0.5,
};
const near = (x: number) => M.NEAR[Math.min(2, COLS - 1 - x)];

/** How good a board is for what the player's after: higher is better. The planner weighs a routine's
    drags by how much they raise it. */
export function measure(cols: Board, ctx: Ctx): number {
  let v = 0;
  const two = ctx.stage === 'chain';
  for (let x = 0; x < COLS; x++) {
    const col = cols[x], burning = x >= ctx.burnFrom;
    for (let y = 0; y < col.length; y++) {
      const p = col[y];
      if (p === SPICE) continue;
      const h = halfOf(cols, x, y);
      if (burning) {
        // A white in a column to burn, the worse if it's trapped (no way out left); the junk there in the
        // diamond's order, blacks above and browns below, so the whites between can get out.
        if (p === WHITE) v -= M.BURN_WHITE * near(x) + (canGo(cols, x, y, -1) ? 0 : M.STUCK);
        else if (p === BLACK) v += (M.ZONE_SORT * (16 - h)) / 16;
        else if (p === BROWN) v += (M.ZONE_SORT * h) / 16;
        continue;
      }
      if (!two) {
        if (p === WHITE) { v -= M.WHITE_LEFT * x; continue; }
        const d = ctx.burnFrom - x;
        v -= M.JUNK + M.JUNK_FAR * d;
        // A black too low to cross before the bottom (a brown too high), the worse the further, and worst
        // on the edge itself, where it's trapped once whites close round it.
        if (p === BURNT) v -= M.BURNT;
        else if (p === BLACK) { v -= M.LOW * Math.min(2, Math.max(0, h + d - 16) / 3) + (h >= 15 ? M.EDGE : 0); v += (M.STORE * (16 - h)) / 16; }
        else { v -= M.LOW * Math.min(2, Math.max(0, d - h) / 3) + (h <= 1 ? M.EDGE : 0); v += (M.STORE * h) / 16; }
        if (!canGo(cols, x, y, 1) && !besideOn(cols, x, y, 1, isJunk)) v -= M.STUCK;
        if (embedded(cols, x, y)) v -= M.EMBED;
      } else if (p === WHITE) {
        v += M.FLOW * x;
        if (x < ctx.fill && !canGo(cols, x, y, 1) && !besideOn(cols, x, y, 1, (q) => q === WHITE)) v -= M.STUCK;
      } else {
        // Junk in a column that goes up soon: the column being filled most, each before it half as much;
        // twice that if it's trapped among the whites (on the bottom or top edge, or no way out left),
        // since then that column can never go up clear.
        v -= M.FLOW * x;
        if (p === BURNT) v -= M.BURNT;
        const k = x >= ctx.fill ? 0 : ctx.fill - x, inWhites = besideOn(cols, x, y, -1, (q) => q === WHITE) || besideOn(cols, x, y, 1, (q) => q === WHITE);
        const trapped = inWhites && ((p === BLACK && h >= 15) || (p === BROWN && h <= 1) || (!canGo(cols, x, y, -1) && !besideOn(cols, x, y, -1, isJunk)));
        v -= M.FILL_JUNK * 0.5 ** k * (trapped ? 2 : 1);
        if (trapped) v -= M.EDGE;
        if (inWhites && p === BLACK && h > 10) v -= (M.LOW * (h - 10)) / 6;
        if (inWhites && p === BROWN && h < 6) v -= (M.LOW * (6 - h)) / 6;
      }
    }
    if (burning && x === COLS - 1 && !col.some((p) => p === WHITE) && col.reduce((s, p) => s + weightOf(p), 0) <= 0) v -= M.FLOAT;
  }
  return v;
}

// ---------------------------------------------------------------- the routines

const drag = (x: number, y: number, ways: number[]): Drag => ({ x, y, ways });
const byLength = (a: number[], b: number[]) => a.length - b.length;
/** The side junk goes in a stage: right in Stage I, left in Stage II (and whites the other way). */
const junkSide = (ctx: Ctx) => (ctx.stage === 'junk' ? 1 : -1);

/** Save the whites: whites in a column about to burn dragged out left, up through blacks or down
    through browns; when one can't go on its own, a helper's drag first (a black to its upper left, a
    brown to its lower left). The furnace's column first. */
const rescue: Routine = {
  name: 'rescue', label: 'Save the whites',
  about: 'A white in a column about to burn is dragged out left: up through blacks, down through browns.',
  find(cols, ctx) {
    const out: Move[] = [];
    if (ctx.burnFrom >= COLS) return out;
    for (let x = COLS - 1; x >= ctx.burnFrom; x--) for (let y = 0; y < cols[x].length; y++) {
      if (cols[x][y] !== WHITE) continue;
      const where = x === COLS - 1 ? "the furnace's column" : 'a column to burn';
      const out1 = (b: Board, at: [number, number]) => at[0] < ctx.burnFrom;
      const lone = traceDrags(cols, x, y, LEFT, Math.min(ctx.reach, 8), out1).sort(byLength).slice(0, 3);
      for (const w of lone) out.push({ routine: 'rescue', drags: [drag(x, y, w)], reason: `a white in ${where}: drag it out left, ${w[0] === UP_LEFT ? 'up through the blacks' : 'down through the browns'}` });
      if (lone.length) continue;
      // Junk from the left swept in: onto the white itself (it goes out the way the junk came), or a
      // black to its upper left or a brown to its lower left, then the white out.
      const ul = neighbourOn(cols, x, y, UP_LEFT), dl = neighbourOn(cols, x, y, DOWN_LEFT);
      let found = 0;
      for (let jx = 0; jx < x && found < 4; jx++) for (let jy = 0; jy < cols[jx].length && found < 4; jy++) {
        const p = cols[jx][jy];
        if (p !== BLACK && p !== BROWN) continue;
        const on = (c: [number, number] | null, at: [number, number]) => !!c && c[0] === at[0] && c[1] === at[1];
        const target = (at: [number, number]) => (at[0] === x && at[1] === y) || (p === BLACK && on(ul, at)) || (p === BROWN && on(dl, at));
        for (const jw of traceDrags(cols, jx, jy, RIGHT, ctx.reach, (b, at) => target(at), 6).sort(byLength)) {
          const b = playDrags(cols, [drag(jx, jy, jw)])!;
          if (b[x][y] !== WHITE) {
            out.push({ routine: 'rescue', drags: [drag(jx, jy, jw)], reason: `a white stuck in ${where}: sweep the ${p === BLACK ? 'black' : 'brown'} at ${placeName(jx, jy)} onto it, and it's out` });
            found++;
            break;
          }
          const w = traceDrags(b, x, y, LEFT, Math.min(ctx.reach, 8), out1).sort(byLength)[0];
          if (!w) continue;
          out.push({ routine: 'rescue', drags: [drag(jx, jy, jw), drag(x, y, w)], reason: `a white stuck in ${where}: bring the ${p === BLACK ? 'black' : 'brown'} at ${placeName(jx, jy)} beside it, then drag it out left` });
          found++;
          break;
        }
      }
      if (found) continue;
      // A black put on the white's diagonal first (from the top left: "a black taken from the top-left
      // goes down-right across the whites"), then swept down it onto the white.
      for (let jx = 0; jx < x && found < 2; jx++) for (let jy = 0; jy < cols[jx].length && found < 2; jy++) {
        if (cols[jx][jy] !== BLACK) continue;
        for (const pw of traceDrags(cols, jx, jy, ALL, 6, () => true, 40).sort(byLength)) {
          const b = playDrags(cols, [drag(jx, jy, pw)])!;
          if (b[x][y] !== WHITE) continue;
          let [px, py] = [jx, jy];
          for (const d of pw) [px, py] = neighbourOn(cols, px, py, d)!;
          const sweep = traceDrags(b, px, py, RIGHT, ctx.reach, (bb) => bb[x][y] !== WHITE, 4).sort(byLength)[0];
          if (!sweep) continue;
          out.push({ routine: 'rescue', drags: [drag(jx, jy, pw), drag(px, py, sweep)], reason: `a white stuck in ${where}: set the black at ${placeName(jx, jy)} on its diagonal, then sweep it down onto the white` });
          found++;
          break;
        }
      }
      if (found) continue;
      // A helper first: a piece near it dragged so the white has a way out.
      const h0 = halfOf(cols, x, y);
      for (let hx = Math.max(0, x - 3); hx <= Math.min(COLS - 1, x + 1) && found < 6; hx++) for (let hy = 0; hy < cols[hx].length && found < 6; hy++) {
        const p = cols[hx][hy];
        if (p === SPICE || p === WHITE || Math.abs(halfOf(cols, hx, hy) - h0) > 5) continue;
        for (const hw of traceDrags(cols, hx, hy, ALL, 3, () => true, 30).sort(byLength)) {
          const b = playDrags(cols, [drag(hx, hy, hw)])!;
          if (b[x][y] !== WHITE) continue;
          const w = traceDrags(b, x, y, LEFT, Math.min(ctx.reach, 8), out1).sort(byLength)[0];
          if (!w) continue;
          out.push({ routine: 'rescue', drags: [drag(hx, hy, hw), drag(x, y, w)], reason: `a white stuck in ${where}: bring a ${p === BLACK ? 'black' : 'brown'} beside it, then drag it out left` });
          found++;
          break;
        }
      }
    }
    return out;
  },
};

/** The furnace's column made ready, one column at a time: a black tip on a column of junk that would
    float up, and the last whites of the junk column swapped out for junk beside it. */
const junkColumn: Routine = {
  name: 'junkColumn', label: 'Finish the junk column',
  about: 'The next column to burn is finished first: its last whites swapped for junk beside it, a black on top so it burns.',
  find(cols, ctx) {
    const out: Move[] = [];
    if (ctx.burnFrom >= COLS) return out;
    const last = COLS - 1, col = cols[last];
    // A black tip: no whites, but it would float up.
    if (!col.some((p) => p === WHITE) && col.reduce((s, p) => s + weightOf(p), 0) <= 0) {
      for (let x = last - 2; x < last; x++) for (let y = 0; y < cols[x].length; y++) {
        if (cols[x][y] !== BLACK) continue;
        for (const w of traceDrags(cols, x, y, RIGHT, 3, (b) => burnsClean(b[last])).sort(byLength).slice(0, 1)) {
          out.push({ routine: 'junkColumn', drags: [drag(x, y, w)], reason: 'the furnace\'s column is all brown: put a black on it, so it burns and never floats up' });
        }
      }
    }
    // The junk column's last whites: junk from just left of it swapped in.
    const t = ctx.stage === 'junk' ? ctx.burnFrom : last, before = whitesFrom(cols, ctx.burnFrom);
    for (let x = Math.max(0, t - 2); x < ctx.burnFrom; x++) for (let y = 0; y < cols[x].length; y++) {
      if (cols[x][y] !== BLACK && cols[x][y] !== BROWN) continue;
      for (const w of traceDrags(cols, x, y, RIGHT, 3, (b, at) => at[0] >= ctx.burnFrom && whitesFrom(b, ctx.burnFrom) < before).sort(byLength).slice(0, 1)) {
        out.push({ routine: 'junkColumn', drags: [drag(x, y, w)], reason: 'finish the junk column: swap its whites for the junk beside it, one column at a time' });
      }
    }
    return out;
  },
};

/** The diamond: junk run across the whites to its own. Stage I: to the junk columns on the right, a black
    down-right then up through the browns to the blacks on top, a brown up-right then down through the
    blacks to the browns below. Stage II, the mirror: junk out of the whites to the junk on the left. A
    piece is only sent when it gets there, never left stuck on the way at the whites' top or bottom. */
const diamond: Routine = {
  name: 'diamond', label: 'The diamond',
  about: 'A black from the top left dragged down-right across the whites, then up through the browns to the blacks; a brown the other way round. Junk columns fill black above, brown below.',
  find(cols, ctx) {
    const out: Move[] = [];
    const side = junkSide(ctx);
    for (let x = 0; x < COLS; x++) for (let y = 0; y < cols[x].length; y++) {
      const p = cols[x][y];
      if (p !== BLACK && p !== BROWN) continue;
      if (side > 0 && x >= ctx.burnFrom) continue;
      if (side < 0 && (x >= ctx.burnFrom || !besideOn(cols, x, y, -1, (q) => q === WHITE))) continue;
      const arrived = side > 0
        ? (b: Board, at: [number, number]) => at[0] >= ctx.burnFrom || (at[0] === ctx.burnFrom - 1 && besideOn(b, at[0], at[1], 1, isJunk) && !besideOn(b, at[0], at[1], 1, (q) => q === WHITE))
        : (b: Board, at: [number, number]) => at[0] < ctx.fill - 1 && (at[0] === 0 || !besideOn(b, at[0], at[1], -1, (q) => q === WHITE));
      // Any way through, as a hand sweeps it: down and up through the whites, and on the junk's side the
      // ladder, a black climbing through browns from one column to the next and a brown sinking through
      // blacks (the user, 12 Nov: "that is how you get it up").
      const paths = traceDrags(cols, x, y, ALL, ctx.reach, arrived, 80);
      if (!paths.length) continue;
      // Where the technique wants it: over with the junk, then the black as high and the brown as low as
      // it goes ("browns at the bottom, blacks at the top"), the shorter the better.
      const rate = (w: number[]) => {
        let cx = x, cy = y;
        for (const d of w) [cx, cy] = neighbourOn(cols, cx, cy, d)!;
        const h = halfOf(cols, cx, cy), v = p === BLACK ? -h : h;
        const over = side > 0 ? cx >= ctx.burnFrom : cx < ctx.fill - 1;
        return (over ? 40 + v : side * cx * 4 + v * 0.3) - w.length * 0.05;
      };
      paths.sort((a, b) => rate(b) - rate(a));
      const name = p === BLACK ? 'black' : 'brown';
      const how = side > 0
        ? (p === BLACK ? 'down-right across the whites, then up through the browns to the blacks' : 'up-right across the whites, then down through the blacks to the browns')
        : (p === BLACK ? 'down-left out of the whites to the junk on the left' : 'up-left out of the whites to the junk on the left');
      for (const w of paths.slice(0, 3)) out.push({ routine: 'diamond', drags: [drag(x, y, w)], reason: `${side > 0 ? 'whites left, junk right' : 'the mirror, whites right'}: the ${name} at ${placeName(x, y)} ${how}` });
    }
    return out;
  },
};

/** The right side's junk: from the furnace leftward, every column at least half junk (COLS: none). */
export function rightFrom(cols: Board): number {
  let x = COLS;
  while (x > 0 && cols[x - 1].filter(isJunk).length * 2 >= cols[x - 1].length) x--;
  return x;
}

/** Turn the right side over (the user, 12 Nov, the third note): the sweep leaves browns at the top right
    and blacks at the bottom (browns rise and blacks sink through whites), and then nothing new hooks in: a
    black from the left sinks into the blacks, a brown rises into the browns, "nowhere to go". So blacks are
    taken up the right-hand side, a black rising past each brown, zigzagging between its columns to the
    top, one after another; the browns sink. Then a brown arriving at the top hooks in down through the
    blacks, and a black arriving low climbs the browns: "zigzagging up the side is how you get them over.
    But it also then is what allows you to hook things on the left and pull them in." */
const turnOver: Routine = {
  name: 'turnOver', label: 'Turn the right side over',
  about: 'Blacks taken up the right-hand side, zigzagging up through the browns between its columns to the top, the browns sinking: then anything new from the left hooks in.',
  find(cols, ctx) {
    const out: Move[] = [];
    if (ctx.stage !== 'junk') return out;
    const from = rightFrom(cols);
    if (from >= COLS - 1) return out;
    for (let x = from; x < COLS; x++) for (let y = 0; y < cols[x].length; y++) {
      if (cols[x][y] !== BLACK) continue;
      const h0 = halfOf(cols, x, y);
      const ups = traceDrags(cols, x, y, [UP_RIGHT, UP_LEFT], ctx.reach, (b, at) => at[0] >= from && halfOf(b, at[0], at[1]) <= h0 - 4, 30);
      if (!ups.length) continue;
      const top = (w: number[]) => { let cx = x, cy = y; for (const d of w) [cx, cy] = neighbourOn(cols, cx, cy, d)!; return halfOf(cols, cx, cy); };
      ups.sort((a, b) => top(a) - top(b) || a.length - b.length);
      out.push({ routine: 'turnOver', drags: [drag(x, y, ups[0])], reason: `turn the right side over: take the black at ${placeName(x, y)} up through the browns, zigzagging up the side to the top` });
    }
    return out;
  },
};

/** Store the junk on the left ready to cross: a black lifted up through the browns above it, toward the
    top left, where it can cross the whites in one drag (a black left low gets stuck at the bottom). */
const store: Routine = {
  name: 'store', label: 'Store the junk',
  about: 'Junk on the left kept ready to cross: blacks lifted through browns to the top, browns left at the bottom.',
  find(cols, ctx) {
    const out: Move[] = [];
    for (let x = 0; x < Math.min(ctx.burnFrom, ctx.stage === 'junk' ? ctx.burnFrom - 1 : ctx.fill - 1); x++) for (let y = 0; y < cols[x].length; y++) {
      if (cols[x][y] !== BLACK) continue;
      const h0 = halfOf(cols, x, y);
      const ups = traceDrags(cols, x, y, [UP_RIGHT, UP_LEFT], 6, (b, at) => at[0] < ctx.burnFrom - 1 && halfOf(b, at[0], at[1]) <= h0 - 2, 20);
      if (!ups.length) continue;
      ups.sort((a, b) => b.length - a.length);
      out.push({ routine: 'store', drags: [drag(x, y, ups[0])], reason: `store the junk: lift the black at ${placeName(x, y)} up through the browns, ready to cross` });
    }
    // Stage I: junk caught in the whites that can't reach the junk columns, taken back to the junk on the
    // left before it sinks to the bottom (a black) or floats to the top (a brown) and is trapped there.
    if (ctx.stage === 'junk') for (let x = 1; x < ctx.burnFrom; x++) for (let y = 0; y < cols[x].length; y++) {
      const p = cols[x][y];
      if ((p !== BLACK && p !== BROWN) || !embedded(cols, x, y)) continue;
      const back = traceDrags(cols, x, y, LEFT, ctx.reach, (b, at) => !embedded(b, at[0], at[1]) && besideOn(b, at[0], at[1], -1, isJunk), 20);
      if (!back.length) continue;
      back.sort(byLength);
      out.push({ routine: 'store', drags: [drag(x, y, back[0])], reason: `store the junk: the ${p === BLACK ? 'black' : 'brown'} at ${placeName(x, y)} can't cross yet: take it back to the junk on the left before it's trapped` });
    }
    return out;
  },
};

/** Junk that can't move the way it must on its own, in whites: Stage I, a brown at the top or a black at
    the bottom of the whites, or junk beside whites stuck in a column to burn. */
function stuckJunk(cols: Board, ctx: Ctx): [number, number][] {
  const side = junkSide(ctx), out: [number, number][] = [];
  for (let x = 0; x < COLS; x++) for (let y = 0; y < cols[x].length; y++) {
    const p = cols[x][y];
    if (p !== BLACK && p !== BROWN) continue;
    if (side > 0 && x >= ctx.burnFrom) continue;
    if (side < 0 && x >= ctx.burnFrom) continue;
    if (!besideOn(cols, x, y, side, (q) => q === WHITE) || canGo(cols, x, y, side)) continue;
    out.push([x, y]);
  }
  // The nearest the furnace first in Stage I, the nearest the left in Stage II.
  return out.sort((a, b) => side * (b[0] - a[0]));
}
/** The pieces of the other junk colour near a piece, nearest first. */
function partners(cols: Board, x: number, y: number, dx: number, dh: number): [number, number][] {
  const p = cols[x][y], want = p === BLACK ? BROWN : BLACK, h = halfOf(cols, x, y), out: [number, number][] = [];
  for (let px = Math.max(0, x - dx); px <= Math.min(COLS - 1, x + dx); px++) for (let py = 0; py < cols[px].length; py++) {
    if (cols[px][py] === want && Math.abs(halfOf(cols, px, py) - h) <= dh) out.push([px, py]);
  }
  return out.sort((a, b) => Math.abs(a[0] - x) + Math.abs(halfOf(cols, a[0], a[1]) - h) / 2 - Math.abs(b[0] - x) - Math.abs(halfOf(cols, b[0], b[1]) - h) / 2);
}
/** Whites in the columns from x on, with a few pieces moved (they leave whites behind them). */
function whitesFromMoved(cols: Board, from: number, start: readonly [number, number][], pos: readonly [number, number][]): number {
  let n = whitesFrom(cols, from);
  for (const [x, y] of pos) if (x >= from && !start.some((s) => s[0] === x && s[1] === y) && cols[x][y] === WHITE) n--;
  for (const [x, y] of start) if (x >= from && !pos.some((s) => s[0] === x && s[1] === y)) n++;
  return n;
}

/** The crawl: a black and a brown together, crawling level through whites (the black up into the brown
    and down into a white; the brown up into a white and down past the black), the whites going the other
    way. A lone brown at the top among whites can't move; with a black beside it the pair crawls along
    (the user, 12 Nov). Stage I it crawls right, carrying whites out of the columns to burn; Stage II,
    left, out of the whites. */
const crawl: Routine = {
  name: 'crawl', label: 'The crawl',
  about: 'A black and a brown working together crawl level through the whites, the whites going the other way: how whites stuck at the top are rescued.',
  find(cols, ctx) {
    const out: Move[] = [];
    const side = junkSide(ctx);
    const seeds: [number, number][] = [...stuckJunk(cols, ctx)];
    // Whites stuck in a column to burn (no way out on their own): the junk near them, to crawl with.
    if (ctx.burnFrom < COLS) {
      for (let x = COLS - 1; x >= ctx.burnFrom; x--) for (let y = 0; y < cols[x].length; y++) {
        if (cols[x][y] !== WHITE || canGo(cols, x, y, -1)) continue;
        const h = halfOf(cols, x, y);
        for (let jx = Math.max(0, x - 3); jx < x; jx++) for (let jy = 0; jy < cols[jx].length; jy++) {
          const q = cols[jx][jy];
          if ((q === BLACK || q === BROWN) && Math.abs(halfOf(cols, jx, jy) - h) <= 4 && !seeds.some((s) => s[0] === jx && s[1] === jy)) seeds.push([jx, jy]);
        }
      }
    }
    const before = ctx.burnFrom < COLS ? whitesFrom(cols, ctx.burnFrom) : 0;
    for (const [x, y] of seeds.slice(0, 5)) {
      for (const pt of partners(cols, x, y, 4, 6).slice(0, 3)) {
        const start: [number, number][] = [[x, y], pt];
        const h0 = halfOf(cols, x, y);
        const found = groupSearch(cols, start, WHITE, Math.min(ctx.reach, 16), (pos) => {
          const saved = ctx.burnFrom < COLS ? before - whitesFromMoved(cols, ctx.burnFrom, start, pos) : 0;
          const across = side * (pos[0][0] - x);
          if (saved <= 0 && across < 2) return null;
          if (Math.abs(halfOf(cols, pos[0][0], pos[0][1]) - h0) > 4 && saved <= 0) return null;
          if (pos.some(([px]) => side > 0 && px > COLS - 1)) return null;
          return saved * 6 + across;
        });
        if (!found) continue;
        const drags = dragsOf(cols, found.steps);
        if (!playDrags(cols, drags)) continue;
        const what = cols[x][y] === BROWN ? 'brown' : 'black';
        out.push({ routine: 'crawl', drags, reason: before && ctx.burnFrom < COLS && found.score >= 6
          ? 'whites stuck at the top: crawl them out, a black and a brown working together'
          : `the ${what} at ${placeName(x, y)} can't move alone: crawl it ${side > 0 ? 'right' : 'left'} with a ${what === 'brown' ? 'black' : 'brown'} beside it` });
      }
    }
    return out;
  },
};

/** Which way a junk piece wants to go up or down to cross on its own: a black too low to cross the
    whites before the bottom wants up, a brown too high wants down (0: neither). */
function wantsVertical(cols: Board, x: number, y: number, ctx: Ctx): number {
  const p = cols[x][y], h = halfOf(cols, x, y), side = junkSide(ctx);
  const d = side > 0 ? ctx.burnFrom - x : Math.max(1, x - Math.max(0, ctx.fill - 4));
  if (p === BLACK && (h + d > 16 || (!canGo(cols, x, y, side) && h >= 12))) return -1;
  if (p === BROWN && (h - d < 0 || (!canGo(cols, x, y, side) && h <= 4))) return 1;
  return 0;
}

/** The figure of eight: a black and a brown looped round each other through whites, up or down the board
    (the user, 12 Nov: "you can drag ... a pair of pieces up and down, vertically"). Late, on a mostly
    white board. A black stuck low is taken up with a brown, a brown stuck high taken down with a black,
    till it can cross on its own. */
const figureEight: Routine = {
  name: 'figureEight', label: 'The figure of eight',
  about: 'A black and a brown looped round each other carry a pair straight up or down through the whites.',
  find(cols, ctx) {
    const out: Move[] = [];
    for (let x = 0; x < Math.min(ctx.burnFrom, COLS); x++) for (let y = 0; y < cols[x].length; y++) {
      const v = cols[x][y] === BLACK || cols[x][y] === BROWN ? wantsVertical(cols, x, y, ctx) : 0;
      if (!v || !besideOn(cols, x, y, 1, (q) => q === WHITE) && !besideOn(cols, x, y, -1, (q) => q === WHITE)) continue;
      const h0 = halfOf(cols, x, y);
      for (const pt of partners(cols, x, y, 1, 2).slice(0, 2)) {
        const found = groupSearch(cols, [[x, y], pt], WHITE, Math.min(ctx.reach, 12), (pos) => {
          const moved = v * (halfOf(cols, pos[0][0], pos[0][1]) - h0);
          if (moved < 4 || Math.abs(pos[0][0] - x) > 1) return null;
          return moved;
        });
        if (!found) continue;
        const drags = dragsOf(cols, found.steps);
        out.push({ routine: 'figureEight', drags, reason: `the ${cols[x][y] === BLACK ? 'black' : 'brown'} at ${placeName(x, y)} is too ${v < 0 ? 'low' : 'high'} to cross: loop it ${v < 0 ? 'up' : 'down'} with a partner, a figure of eight` });
        break;
      }
    }
    return out;
  },
};

/** The line pull: a black at the front of a line of browns in whites, the line pulled up a tile at a time
    (the user, 12 Nov: "you pull a line of brown things up ... then with just the trailing brown, you can
    bring the black up again ... to keep pulling it up one tile at a time"). */
const linePull: Routine = {
  name: 'linePull', label: 'Pull a line up',
  about: 'A black at the front of a line of browns: the line pulled up through the whites a tile at a time.',
  find(cols, ctx) {
    const out: Move[] = [];
    for (let x = 0; x < Math.min(ctx.burnFrom, COLS); x++) for (let y = 0; y < cols[x].length; y++) {
      if (cols[x][y] !== BLACK || wantsVertical(cols, x, y, ctx) >= 0) continue;
      // The line: browns linked one to the next from the black.
      const line: [number, number][] = [[x, y]];
      for (let k = 0; k < 2; k++) {
        const [lx, ly] = line[line.length - 1];
        let next: [number, number] | null = null;
        for (let d = 0; d < 4 && !next; d++) {
          const n = neighbourOn(cols, lx, ly, d);
          if (n && cols[n[0]][n[1]] === BROWN && !line.some((q) => q[0] === n[0] && q[1] === n[1])) next = n;
        }
        if (!next) break;
        line.push(next);
      }
      if (line.length < 3) continue;
      const h0 = line.reduce((s, [lx, ly]) => s + halfOf(cols, lx, ly), 0);
      const found = groupSearch(cols, line, WHITE, Math.min(ctx.reach, 14), (pos) => {
        const rise = h0 - pos.reduce((s, [px, py]) => s + halfOf(cols, px, py), 0);
        if (rise < 2 * line.length || pos.some(([px]) => Math.abs(px - x) > 2)) return null;
        return rise;
      }, 3000);
      if (!found) continue;
      out.push({ routine: 'linePull', drags: dragsOf(cols, found.steps), reason: `pull the line of browns at ${placeName(x, y)} up a tile, the black at its front` });
    }
    return out;
  },
};

/** The leapfrog: a black swept sideways along browns stored at the top, up into each and down past it
    (the user, 12 Nov: "you keep three brown pieces at the top or bottom, and then drag a black along each
    one"), or a brown along blacks stored at the bottom. One drag; mid-game, with plenty of pieces. */
const leapfrog: Routine = {
  name: 'leapfrog', label: 'The leapfrog',
  about: 'A black dragged sideways along a row of browns, up into each and down past it, in one sweep.',
  find(cols, ctx) {
    const out: Move[] = [];
    const side = junkSide(ctx), [up, down] = side > 0 ? [UP_RIGHT, DOWN_RIGHT] : [UP_LEFT, DOWN_LEFT];
    for (let x = 0; x < COLS; x++) for (let y = 0; y < cols[x].length; y++) {
      const p = cols[x][y];
      if ((p !== BLACK && p !== BROWN) || (side > 0 && x >= ctx.burnFrom)) continue;
      // A black leaps up into a brown, then down into a white; a brown down into a black, then up into a white.
      const [leap, land, row] = p === BLACK ? [up, down, BROWN] : [down, up, BLACK];
      for (const first of [leap, land]) {
        const b = copyBoard(cols), ways: number[] = [];
        let at: [number, number] = [x, y], leaps = 0, w = first;
        for (;;) {
          const n = neighbourOn(b, at[0], at[1], w);
          if (!n || b[n[0]][n[1]] !== (w === leap ? row : WHITE)) break;
          if (!swapIn(b, at[0], at[1], w)) break;
          if (w === leap) leaps++;
          ways.push(w);
          at = n;
          w = w === leap ? land : leap;
          if (ways.length >= ctx.reach) break;
        }
        if (leaps < 2) continue;
        out.push({ routine: 'leapfrog', drags: [drag(x, y, ways)], reason: `leapfrog the ${p === BLACK ? 'black' : 'brown'} at ${placeName(x, y)} ${side > 0 ? 'right' : 'left'} along the row of ${row === BROWN ? 'browns at the top' : 'blacks at the bottom'}, in one sweep` });
        break;
      }
    }
    return out.filter((m) => playDrags(cols, m.drags));
  },
};

/** The hook, when pieces are scarce: a black dragged down through the whites into a brown, hooking up past
    it (the brown drops), and the brown dragged on the same way (the user's, 12 Nov: "drag the opposite
    colour all the way from the top left to the bottom white, you can kind of hook it in and then re-drag
    the brown"). Or a brown up into a black, hooking down past it, and the black dragged on. */
const hook: Routine = {
  name: 'hook', label: 'The hook',
  about: 'A black dragged down through the whites hooks up past a brown; then the brown is dragged on. For when pieces are scarce.',
  find(cols, ctx) {
    const out: Move[] = [];
    const side = junkSide(ctx), [up, down] = side > 0 ? [UP_RIGHT, DOWN_RIGHT] : [UP_LEFT, DOWN_LEFT];
    for (let x = 0; x < Math.min(ctx.burnFrom, COLS); x++) for (let y = 0; y < cols[x].length; y++) {
      const p = cols[x][y];
      if (p !== BLACK && p !== BROWN) continue;
      // The long diagonal through whites (a black down, a brown up), then the hook past the other.
      const [run, hookWay, other] = p === BLACK ? [down, up, BROWN] : [up, down, BLACK];
      const b = copyBoard(cols), ways: number[] = [];
      let at: [number, number] = [x, y];
      for (;;) {
        const n = neighbourOn(b, at[0], at[1], run);
        if (!n || b[n[0]][n[1]] !== WHITE || ways.length >= ctx.reach) break;
        swapIn(b, at[0], at[1], run); ways.push(run); at = n;
      }
      const hn = neighbourOn(b, at[0], at[1], hookWay);
      if (ways.length < 2 || !hn || b[hn[0]][hn[1]] !== other || !swapIn(b, at[0], at[1], hookWay)) continue;
      ways.push(hookWay);
      // The other piece, now where the hook began, dragged on the same way across.
      const on = traceDrags(b, at[0], at[1], towards(side), ctx.reach, (bb, end) => side * (end[0] - at[0]) >= 2, 40);
      if (!on.length) continue;
      on.sort((a2, b2) => b2.length - a2.length);
      out.push({ routine: 'hook', drags: [drag(x, y, ways), drag(at[0], at[1], on[0])], reason: `pieces are scarce: hook the ${p === BLACK ? 'black' : 'brown'} at ${placeName(x, y)} past the ${other === BROWN ? 'brown' : 'black'}, then drag that on` });
    }
    out.push(...unhook(cols, ctx));
    return out;
  },
};

/** The hook's other use, in the chain: junk trapped on the whites' edge in a column that goes up soon (a
    black on the bottom, a brown on the top) can't move alone, nor with one partner that can't reach it
    (a brown never sinks through whites to the bottom). Two partners can: a black dragged down beside it
    as a hook, the brown hooked in down past that black, then the pair crawls it out. The fewest drags
    for it, by the rules. */
function unhook(cols: Board, ctx: Ctx): Move[] {
  const out: Move[] = [];
  if (ctx.stage !== 'chain') return out;
  const side = -1;
  const trapped: [number, number][] = [];
  for (let x = Math.max(0, ctx.fill - 2); x < Math.min(ctx.burnFrom, COLS); x++) for (let y = 0; y < cols[x].length; y++) {
    const p = cols[x][y], h = halfOf(cols, x, y);
    if (p !== BLACK && p !== BROWN) continue;
    if ((p === BLACK && h >= 15) || (p === BROWN && h <= 1) || (!canGo(cols, x, y, side) && besideOn(cols, x, y, side, (q) => q === WHITE))) trapped.push([x, y]);
  }
  for (const [x, y] of trapped.sort((a, b) => b[0] - a[0]).slice(0, 2)) {
    const h0 = halfOf(cols, x, y), p = cols[x][y];
    // Partners: the junk nearest it, of either colour.
    const near: [number, number][] = [];
    for (let px = Math.max(0, x - 4); px <= Math.min(COLS - 1, x + 1); px++) for (let py = 0; py < cols[px].length; py++) {
      if ((px !== x || py !== y) && (cols[px][py] === BLACK || cols[px][py] === BROWN) && Math.abs(halfOf(cols, px, py) - h0) <= 8) near.push([px, py]);
    }
    near.sort((a, b) => Math.abs(a[0] - x) + Math.abs(halfOf(cols, a[0], a[1]) - h0) / 2 - Math.abs(b[0] - x) - Math.abs(halfOf(cols, b[0], b[1]) - h0) / 2);
    const pool = near.slice(0, 4);
    let best: { steps: Step[]; score: number } | null = null;
    for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) {
      if (cols[pool[i][0]][pool[i][1]] === cols[pool[j][0]][pool[j][1]] && cols[pool[i][0]][pool[i][1]] === p) continue;
      const found = groupSearch(cols, [[x, y], pool[i], pool[j]], WHITE, Math.min(ctx.reach, 18), (pos) => {
        const [tx, ty] = pos[0], across = side * (tx - x);
        if (across < 2 || pos.some(([px]) => px >= ctx.burnFrom)) return null;
        return across * 2 - Math.max(0, ...pos.map(([px]) => px - ctx.fill + 2));
      }, 4000);
      if (found && (!best || found.score > best.score)) best = found;
    }
    if (!best) continue;
    const drags = dragsOf(cols, best.steps);
    if (!playDrags(cols, drags)) continue;
    out.push({ routine: 'hook', drags, reason: `the ${p === BLACK ? 'black on the bottom' : 'brown on the top'} at ${placeName(x, y)} is trapped: hook a partner in beside it and work it out left` });
  }
  return out;
}

/** Channels, Stage II: whites on the left ferried right through the junk, up through blacks and down
    through browns, to the whites waiting for the next column to go up. */
const channel: Routine = {
  name: 'channel', label: 'Channels',
  about: 'Stage II: whites on the left ferried right through the junk, up through blacks, down through browns.',
  find(cols, ctx) {
    const out: Move[] = [];
    if (ctx.stage !== 'chain') return out;
    for (let x = 0; x < Math.min(ctx.fill + 1, ctx.burnFrom); x++) for (let y = 0; y < cols[x].length; y++) {
      if (cols[x][y] !== WHITE || !canGo(cols, x, y, 1)) continue;
      const paths = traceDrags(cols, x, y, RIGHT, ctx.reach, (b, at) => at[0] < ctx.burnFrom, 60);
      if (!paths.length) continue;
      const end = (w: number[]) => { let cx = x, cy = y; for (const d of w) [cx, cy] = neighbourOn(cols, cx, cy, d)!; return cx; };
      paths.sort((a, b) => end(b) - end(a) || a.length - b.length);
      out.push({ routine: 'channel', drags: [drag(x, y, paths[0])], reason: `ferry the white at ${placeName(x, y)} right through the junk, up through blacks, down through browns` });
    }
    return out;
  },
};

/** Drags joined where one goes on from where the last stopped: the same piece, still held, one sweep. */
export function joinDrags(cols: Board, drags: readonly Drag[]): Drag[] {
  const out: Drag[] = [];
  let end: [number, number] | null = null;
  for (const d of drags) {
    if (end && end[0] === d.x && end[1] === d.y) out[out.length - 1].ways.push(...d.ways);
    else out.push({ x: d.x, y: d.y, ways: [...d.ways] });
    end = [d.x, d.y];
    for (const w of d.ways) end = neighbourOn(cols, end[0], end[1], w)!;
  }
  return out;
}
/** A move's last drag carried on as far as it goes (the user, 12 Nov: "it should carry on as far as it
    can go"): from where it stops, the held piece swept on the same way across, the same diagonal first,
    until no swap takes it further, never stopped partway into the whites. A white is never carried into
    a column to burn. */
export function carryOn(cols: Board, drags: readonly Drag[], ctx: Ctx): Drag[] {
  const out = drags.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] }));
  const last = out[out.length - 1];
  if (!last?.ways.length) return out;
  const b = playDrags(cols, out);
  if (!b) return out;
  let at: [number, number] = [last.x, last.y];
  for (const w of last.ways) at = neighbourOn(cols, at[0], at[1], w)!;
  const piece = b[at[0]][at[1]];
  if (piece !== BLACK && piece !== BROWN) return out;
  // On toward the junk's own side (right in Stage I, left in the chain), the same diagonal first.
  const side = junkSide(ctx);
  let w = last.ways[last.ways.length - 1];
  while (last.ways.length < 24) {
    const ways = towards(side).includes(w) ? [w, ...towards(side).filter((v) => v !== w)] : towards(side);
    let moved = false;
    for (const v of ways) {
      const n = neighbourOn(b, at[0], at[1], v);
      if (!n) continue;
      if (!swapIn(b, at[0], at[1], v)) continue;
      last.ways.push(v); at = n; w = v; moved = true;
      break;
    }
    if (!moved) break;
  }
  return out;
}
/** The routines that move a piece up or down on the spot, whose drags stop where they mean to. */
const ON_THE_SPOT: readonly RoutineName[] = ['figureEight', 'linePull', 'turnOver'];
/** A routine whose moves always come out as whole drags, the last carried on as far as it goes. */
const whole = (r: Routine): Routine => ({
  ...r,
  find: (cols, ctx) => {
    const seen = new Set<string>();
    return r.find(cols, ctx).map((m) => {
      const drags = joinDrags(cols, m.drags);
      return { ...m, drags: ON_THE_SPOT.includes(r.name) ? drags : carryOn(cols, drags, ctx) };
    }).filter((m) => { const k = JSON.stringify(m.drags); return !seen.has(k) && !!seen.add(k); });
  },
});

export const ROUTINES: Readonly<Record<RoutineName, Routine>> = Object.fromEntries(
  [rescue, junkColumn, diamond, turnOver, store, crawl, figureEight, linePull, leapfrog, hook, channel].map((r) => [r.name, whole(r)]),
) as Record<RoutineName, Routine>;
export const routineNamed = (name: RoutineName): Routine => ROUTINES[name];
