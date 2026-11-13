/* A Distilling board judged at a glance, for Stage I. TypeScript, compiled to js/distill-score.js; tested in
   tests/distill-score.test.ts. The bots (src/distill-bots.ts) judge each drag they could make by the score of
   the board it leaves, for the time it takes a person: one drag ahead, no search (the user, 12 Nov, the
   eleventh note: "I'm not saying implement them because they're expensive, but even just as a test of moves").

   The simpler score (the user, 13 Nov, the eighteenth note: "forget about dragging whites to the left. It is
   about filling those right-hand columns of black and brown ... you just want to pull things from the left to
   the right. Metric is how many columns are filled, second metric, how straight and vertical is the ... wall
   where the white meets the color. Once that starts emerging, that's another metric"). What it counts
   (DISTILLING.md §3, "The board score"):
   - first, the junk columns filled on the right, no white in them and sure to burn, counted from the
     right-hand edge in: the furnace's column first, then the next, and so on while they're done; and the
     column being filled (and, less, the one left of it), each piece of junk in it;
   - every piece of junk a column further right, a little: colour pulled from the left to the right;
   - second, once the wall between the whites and the colour has formed in a row, how far that row's wall
     stands from one straight upright wall down the board (`wall`).
   No credit for whites going left: that follows from colour pulled right. Sorting the junk earns nothing.
   And three things never to leave, each from a look at the bots or the user's notes:
   - a white trapped (`trappedWhite`): on the top or bottom edge with no way left, or boxed in by junk, on the
     colour's side, in a column to burn soon (the eighteenth note's white dragged up to the top among the
     blacks, and the whites the brown sweep leaves trapped);
   - junk trapped among the whites, no swap taking it right (`trapped`: the bots' chains broke on it);
   - a white in a pocket behind spice (the thirteenth note), heavily.

   Pure: knows nothing of the bots or the den. */

import { BLACK, BROWN, BURNT, COLS, DOWN_LEFT, DOWN_RIGHT, SPICE, TALL, UP_LEFT, UP_RIGHT, WHITE, canSwapOn, neighbourOn, weightOf } from './distilling.js';
import type { Board } from './distilling.js';

/** The score's weights. */
export const S = {
  /** A junk column done on the right, counted from the edge in: more than the pieces in it, so the last piece
      that finishes it is a bonus ("bonus points for getting those first few columns on the right complete"). */
  COLUMN: 15,
  /** Each piece of junk in the column being filled (the first not done, from the right), and in the one left
      of it. */
  FILL: 1,
  NEXT: 0.5,
  /** Each piece of junk, a column further right: colour pulled from the left to the right. */
  PULL: 0.5,
  /** Each column a row's wall stands off the straight upright one, once it's formed in that row. */
  WALL: 1,
  /** A row's wall has formed once at most this many pieces in it are on the wrong side. */
  FORMED: 1,
  /** A white trapped (`trappedWhite`): a loop of another piece's to free, and burned if it isn't; counted in the
      column being filled and the NEAR columns left of it, whose turn to burn is next (one further left has
      many drags going past it to free it first). */
  TRAPPED_WHITE: 3,
  NEAR: 2,
  /** A brown or a black trapped among the whites (`trapped`): about the swaps it'll cost to free. */
  TRAPPED: 1,
  /** A white in a pocket behind spice (`behindSpice`), one of the worst things to leave. */
  POCKET: 12,
};

const junk = (p: number): boolean => p === BROWN || p === BLACK || p === BURNT;

/** A column done as junk: no white in it, and sure to burn (more blacks than whites, burnt whites counted
    as whites; a pure brown would float up instead). */
export function junkDone(col: readonly number[]): boolean {
  let weight = 0;
  for (const p of col) { if (p === WHITE) return false; weight += weightOf(p); }
  return weight > 0;
}

/** Junk columns done, from the right-hand edge in: none if the furnace's own isn't. */
export function doneFromRight(cols: Board): number {
  let n = 0;
  while (n < COLS && junkDone(cols[COLS - 1 - n])) n++;
  return n;
}

/** A brown or a black stuck among whites: whites beside it on its right, and no swap takes it right (a
    black on the bottom of the whites, a brown on the top; "blacks get stuck at the bottom, browns at the
    top"). It needs a technique to get out, and left there it's the white block's dirty edge later. */
export function trapped(cols: Board, x: number, y: number): boolean {
  const p = cols[x][y];
  if (p !== BROWN && p !== BLACK) return false;
  let white = false;
  for (const d of [UP_RIGHT, DOWN_RIGHT]) {
    const n = neighbourOn(cols, x, y, d);
    if (!n) continue;
    const q = cols[n[0]][n[1]];
    // Junk beside it on the right: it's part of the colour, not stuck in the whites.
    if (junk(q) || canSwapOn(cols, x, y, n[0], n[1])) return false;
    if (q === WHITE) white = true;
  }
  return white;
}

/** A white trapped (the user, 13 Nov, the eighteenth note: the bot's opening drag "went the entire way so that
    there was a white trap right at the top. So I don't know how that's following the instruction of don't
    trap things"): on the top or bottom edge (the top or bottom of a tall column), where a white has one way
    left at most, and no swap takes it that way (a white goes left only up into a black or down into a brown,
    so at the top it needs a brown to come below it, at the bottom a black above it), with junk left of it in
    its row and it's on the colour's side of the board (right of the straight wall's place, `wall`), so it's
    cut off from the whites. Getting it out takes a piece brought round to take its place
    (src/distill-path.ts). Only the edges: a white boxed in lower down is freed by the next drag past it as
    often as not, and counting those had the bots carrying whites back right just to give them a way out.
    `boxed`: also one lower down with junk on both its left, the score's test in the columns next to burn (the
    user, 13 Nov: the brown sweep "leaves one or two trapped whites"). */
export function trappedWhite(cols: Board, x: number, y: number, at = wall(cols).at, boxed = false): boolean {
  if (cols[x][y] !== WHITE || x === 0 || x < at) return false;
  const edge = cols[x].length === TALL && (y === 0 || y === TALL - 1);
  if (!edge && !boxed) return false;
  let white = false;
  for (const d of [UP_LEFT, DOWN_LEFT]) {
    const n = neighbourOn(cols, x, y, d);
    if (!n) continue;
    if (canSwapOn(cols, x, y, n[0], n[1])) return false;
    if (cols[n[0]][n[1]] === WHITE) white = true;
  }
  if (!edge && white) return false;
  for (let i = 0; i < x; i++) if (y < cols[i].length && junk(cols[i][y])) return true;
  return false;
}

/** A white in a pocket behind spice (the user, 12 Nov, the thirteenth note: "that white piece that's kind of
    trapped behind the spice at the top right ... things burn, like those places become inaccessible"): on the
    top or bottom of its column with a spice just inside it in its column. Spice never swaps, so it has two
    ways out at most, along the edge, and those close as the board slides. */
export function behindSpice(cols: Board, x: number, y: number): boolean {
  const c = cols[x];
  if (c[y] !== WHITE || (y !== 0 && y !== c.length - 1)) return false;
  return c[y === 0 ? 1 : y - 1] === SPICE;
}

/** Pieces on the wrong side of a wall standing left of column b in a row (junk left of it, whites right of
    it; spice is neither). */
function misfits(cols: Board, y: number, b: number): number {
  let n = 0;
  for (let x = 0; x < COLS; x++) {
    if (y >= cols[x].length) continue;
    const p = cols[x][y];
    if (x < b ? junk(p) : p === WHITE) n++;
  }
  return n;
}

/** Where the wall between the whites and the colour stands, row by row (a row is the y-th piece of every
    column, zigzagging across), and how far it is from straight and upright (the user, 13 Nov: "how straight
    and vertical is the ... wall where the white meets the color. Once that starts emerging"). The straight
    wall `at` is the one upright split of the whole board that puts fewest pieces on the wrong side; each row's
    own wall is its best split, the nearest to that one when several tie. A row's wall has formed once at
    most S.FORMED pieces of it are on the wrong side, with whites and colour both in it; `off` adds up, over
    the formed rows, how many columns each stands off the straight wall. */
export function wall(cols: Board): { at: number; rows: (number | null)[]; off: number } {
  let at = 0, fewest = Infinity;
  for (let b = 0; b <= COLS; b++) {
    let n = 0;
    for (let y = 0; y < TALL; y++) n += misfits(cols, y, b);
    if (n < fewest) { fewest = n; at = b; }
  }
  const rows: (number | null)[] = [];
  let off = 0;
  for (let y = 0; y < TALL; y++) {
    let best = -1, m = Infinity;
    for (let b = 0; b <= COLS; b++) {
      const n = misfits(cols, y, b);
      if (n < m || (n === m && Math.abs(b - at) < Math.abs(best - at))) { m = n; best = b; }
    }
    const formed = m <= S.FORMED && best > 0 && best < COLS;
    rows.push(formed ? best : null);
    if (formed) off += Math.abs(best - at);
  }
  return { at, rows, off };
}

/** The board's score: higher is better (see the header). */
export function boardScore(cols: Board): number {
  const done = doneFromRight(cols), filling = COLS - 1 - done, w = wall(cols);
  let v = S.COLUMN * done - S.WALL * w.off;
  for (let x = 0; x < COLS; x++) for (let y = 0; y < cols[x].length; y++) {
    const p = cols[x][y];
    if (p === WHITE) {
      if (behindSpice(cols, x, y)) v -= S.POCKET;
      else if (x >= filling - S.NEAR && trappedWhite(cols, x, y, w.at, true)) v -= S.TRAPPED_WHITE;
    } else if (junk(p)) {
      v += S.PULL * x;
      if (x === filling) v += S.FILL;
      else if (x === filling - 1) v += S.NEXT;
      if (trapped(cols, x, y)) v -= S.TRAPPED;
    }
  }
  return v;
}
