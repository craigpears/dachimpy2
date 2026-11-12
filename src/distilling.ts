/* Distilling, the real puzzle (DISTILLING.md, 12 Nov: its rules from the open-source port of the game's
   own client, `crafting/brew`, checked move for move against it). TypeScript, compiled to
   js/distilling.js by `npm run build`; tested in tests/distilling.test.ts, played by the bots in
   src/distill-bots.ts (tools/distill-bots.mjs runs them). It knows nothing of the den: its look is
   js/den/distill-board.js, played on its own on the unlinked distilling-test.html.

   Pure: the randomness is a `random` passed in (0 <= r < 1), and the clock is driven by `tick(ms)` (or
   a furnace tick at a time, `furnaceTick()`), never the time of day.

   - The board: 10 columns, left to right, each top to bottom, set like a honeycomb: tall (9) and short
     (8) in turn, the short ones half a piece lower; 85 pieces. At the start the 1st, 3rd... columns
     (x = 0, 2, 4, 6, 8) are tall, and the rightmost (x = 9, short, by the furnace) is all black.
   - Every piece links to four diagonal neighbours, never the ones above or below it in its column.
   - Two linked pieces swap only if the lower one beats the upper one: a white rises past a black, a
     brown past a white, a black past a brown. So a swap can't be undone straight away. Spice never
     moves; a burnt white moves like a white.
   - The furnace ticks every 306 ms; at the 50th tick (15.3 s) the rightmost column leaves, a warning at
     the 41st (furnace 40, about 3 s before); a burn waits for a swap still moving (150 ms). Burning
     now (X, right-click) burns at once and restarts the furnace. The board then slides right for 900
     ms, when nothing can be moved, and a new column comes in on the left, the opposite height of its
     neighbour.
   - A column whose weights (white and burnt white -1, black +1, brown and spice 0) add to 0 or less goes
     up into the flask; more blacks than whites burns it.
   - Points, if it goes up: white 1, brown 0, black -1, spice 3, burnt white -3; burned, -3 a spice
     ("Wasted Spice") and nothing else. A Crystal Clear (only whites and spice) scores 4 more for every
     Crystal Clear straight before it; any other column, up or burned, breaks the chain.
   - Every two whites burned make the next white made a burnt white. New pieces: 1 in 31 spice (never
     in the first 17), the rest white, brown or black evenly.
   - The session ends once 100 pieces are in the flask, unless the column that got there was the 12th
     Crystal Clear in a row or more: then it carries on until a column that isn't one leaves. Its score
     is points / columns sent up. */

/** Pieces, as the game numbers them. */
export const WHITE = 0, BROWN = 1, BLACK = 2, SPICE = 3, BURNT = 4;
/** Their letters, for boards written out (DISTILLING.md's sketches): w b K * x. */
export const LETTERS = 'wbK*x';
export const COLS = 10, TALL = 9, SHORT = 8;
/** The furnace: ms a tick; a column leaves on the tick after BURN_TICKS (the 50th, 15.3 s); the warning
    on the tick the furnace stands at WARN_TICK (40, about 3 s before). */
export const TICK_MS = 306, BURN_TICKS = 49, WARN_TICK = BURN_TICKS - Math.trunc(3000 / TICK_MS);
/** A swap's slide, and the board's slide right after a column leaves (nothing moves meanwhile). */
export const SWAP_MS = 150, SLIDE_MS = 900;
/** The first pieces made that are never spice (the two columns beside the all-black one), and the odds. */
export const NO_SPICE_FIRST = 17, SPICE_ONE_IN = 31;
/** The flask is full at this many pieces, unless the chain is at least CARRY_ON. */
export const FLASK = 100, CARRY_ON = 12;
/** Points a piece is worth sent up, by piece. */
export const POINTS: readonly number[] = [1, 0, -1, 3, -3];
/** The chain bonus: this much for every Crystal Clear straight before. */
export const CHAIN_BONUS = 4;
/** What the board says as a column goes. */
export const MESSAGES = { clear: 'Crystal clear!', smooth: 'Smooooooth', blecch: 'Blecch!', burnt: 'Burnt!', spicy: 'Spicy!', wasted: 'Wasted Spice', finished: 'Finished!' } as const;

/** Directions to a neighbour: up-right, up-left, down-left, down-right. */
export const UP_RIGHT = 0, UP_LEFT = 1, DOWN_LEFT = 2, DOWN_RIGHT = 3;
/** Each way as it's drawn, in pieces: a column across and half a piece up or down (y down). */
export const WAY: readonly (readonly [number, number])[] = [[1, -0.5], [-1, -0.5], [-1, 0.5], [1, 0.5]];

/** How a piece swaps: white (and burnt white) 0, brown 1, black 2; spice never. */
export const kindOf = (p: number): number => (p === SPICE ? -128 : p === BURNT ? WHITE : p);
/** Its weight: white and burnt white -1, black +1, the rest 0. */
export const weightOf = (p: number): number => (p === WHITE || p === BURNT ? -1 : p === BLACK ? 1 : 0);
/** Whether `lower` swaps with `upper` sitting diagonally above it: the lower beats the upper. */
export const beats = (lower: number, upper: number): boolean => {
  const d = kindOf(upper) - kindOf(lower);
  return d === -1 || d === 2;
};

export type Board = number[][];

/** Whether column x is tall (9) or short (8). */
export const tallAt = (cols: Board, x: number): boolean => cols[x].length === TALL;
/** The neighbour of (x, y) one way (UP_RIGHT...), or null off the board. */
export function neighbourOn(cols: Board, x: number, y: number, dir: number): [number, number] | null {
  const tall = tallAt(cols, x);
  const nx = dir === UP_RIGHT || dir === DOWN_RIGHT ? x + 1 : x - 1;
  if (nx < 0 || nx >= COLS) return null;
  const ny = dir === UP_RIGHT || dir === UP_LEFT ? y - (tall ? 1 : 0) : y + (tall ? 0 : 1);
  if (ny < 0 || ny >= cols[nx].length) return null;
  return [nx, ny];
}
/** Whether two places are linked (diagonal neighbours). */
export function linkedOn(cols: Board, x1: number, y1: number, x2: number, y2: number): boolean {
  if (Math.abs(x1 - x2) !== 1 || y1 < 0 || y2 < 0 || y1 >= cols[x1].length || y2 >= cols[x2].length) return false;
  return y1 === y2 || y1 === y2 + (tallAt(cols, x1) ? 1 : -1);
}
/** Whether (x1, y1) sits above (x2, y2), given they're linked: a tall column's piece is above the short
    one's of the same row. */
const above = (cols: Board, x1: number, y1: number, y2: number): boolean => (tallAt(cols, x1) ? y1 === y2 : y1 < y2);
/** Whether the pieces at two places can swap. */
export function canSwapOn(cols: Board, x1: number, y1: number, x2: number, y2: number): boolean {
  if (!linkedOn(cols, x1, y1, x2, y2)) return false;
  const a = cols[x1][y1], b = cols[x2][y2];
  return above(cols, x1, y1, y2) ? beats(b, a) : beats(a, b);
}
/** Which ways a piece can swap, a bit a direction (the corners the board lights). */
export function maskOn(cols: Board, x: number, y: number): number {
  let m = 0;
  for (let d = 0; d < 4; d++) {
    const n = neighbourOn(cols, x, y, d);
    if (n && canSwapOn(cols, x, y, n[0], n[1])) m |= 1 << d;
  }
  return m;
}
/** Every swap that can be made, each once: [x1, y1, x2, y2] with x2 = x1 + 1. */
export function swapsOn(cols: Board): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  for (let x = 0; x < COLS - 1; x++) for (let y = 0; y < cols[x].length; y++) for (const d of [UP_RIGHT, DOWN_RIGHT]) {
    const n = neighbourOn(cols, x, y, d);
    if (n && canSwapOn(cols, x, y, n[0], n[1])) out.push([x, y, n[0], n[1]]);
  }
  return out;
}

/** A column as it left: up into the flask or burned, what was in it (blacks counting burnt whites, as
    the game counts them for its message), its points, the chain bonus, where it stands in a chain (1
    the first Crystal Clear, 2 the second...; 0 not one), and its messages. */
export interface Column {
  up: boolean;
  pieces: number[];
  whites: number;
  browns: number;
  blacks: number;
  burnt: number;
  spices: number;
  points: number;
  bonus: number;
  chain: number;
  message: 'clear' | 'smooth' | 'blecch' | 'burnt' | null;
  spice: 'spicy' | 'wasted' | null;
}

/** Whether a column goes up: its weights add to 0 or less. */
export const goesUp = (pieces: readonly number[]): boolean => pieces.reduce((s, p) => s + weightOf(p), 0) <= 0;

/** A column leaving, after `before` Crystal Clears in a row: what it scores and says (BrewBoard's
    scoreRightColumn, and BrewController's messages). */
export function judge(pieces: readonly number[], before: number): Column {
  let whites = 0, browns = 0, blacks = 0, burnt = 0, spices = 0, pts = 0;
  for (const p of pieces) {
    pts += POINTS[p];
    if (p === WHITE) whites++;
    else if (p === BROWN) browns++;
    else if (p === BLACK) blacks++;
    else if (p === SPICE) spices++;
    else { burnt++; blacks++; }
  }
  const up = goesUp(pieces);
  const c: Column = { up, pieces: [...pieces], whites, browns, blacks, burnt, spices, points: 0, bonus: 0, chain: 0, message: null, spice: null };
  if (!up) {
    c.points = -spices * POINTS[SPICE];
    if (whites) c.message = 'burnt';
    if (spices) c.spice = 'wasted';
    return c;
  }
  c.points = pts;
  if (!browns && !blacks) { c.bonus = CHAIN_BONUS * before; c.chain = before + 1; }
  if (!blacks) {
    if (!browns) c.message = 'clear';
    else if (whites / browns > 1) c.message = 'smooth';
  } else if (blacks / whites >= 1) c.message = 'blecch';
  if (spices) c.spice = 'spicy';
  return c;
}

/** Read a board written out, a column a string top to bottom in LETTERS (for tests and drills). */
export const parseBoard = (cols: readonly string[]): Board => cols.map((s) => [...s].map((ch) => {
  const p = LETTERS.indexOf(ch);
  if (p < 0) throw new Error(`no piece "${ch}"`);
  return p;
}));
/** Write a board out, as parseBoard reads it. */
export const writeBoard = (cols: Board): string[] => cols.map((c) => c.map((p) => LETTERS[p]).join(''));

/** What the furnace did: the warning, or a column gone (and whether that finished the session). */
export type DistillEvent = { kind: 'warning' } | { kind: 'column'; column: Column; finished: boolean };

export interface DistillOptions {
  /** The furnace's clock running (default true); off, columns go only when burned on purpose. */
  timer?: boolean;
}

/** A session at the still. */
export class Distilling {
  readonly random: () => number;
  readonly timer: boolean;
  /** The board: columns left to right, each top to bottom. */
  cols: Board = [];
  /** Pieces made (none of the first NO_SPICE_FIRST is spice), and whites burned not yet made into a
      burnt white (every two make one). */
  made = 0;
  owed = 0;
  /** Crystal Clears in a row now, and the longest this session. */
  chain = 0;
  longest = 0;
  /** The furnace: ticks since the last column left (it goes at BURN_TICKS), ms into the tick, and a
      burn due but waiting for a swap to land. */
  furnace = 0;
  clock = 0;
  due = false;
  /** ms left of a swap sliding, and of the board sliding right after a burn. */
  swapping = 0;
  sliding = 0;
  /** ms played, swaps made, and whites burned in all. */
  time = 0;
  swaps = 0;
  whitesBurned = 0;
  /** The flask: pieces in it, and its whites and blacks (burnt whites with them), for its colour. */
  flask = 0;
  flaskWhites = 0;
  flaskBlacks = 0;
  points = 0;
  /** Every column gone, in order. */
  columns: Column[] = [];
  finished = false;
  dismissed = false;

  constructor(random: () => number, options: DistillOptions = {}) {
    this.random = random;
    this.timer = options.timer !== false;
    // The furnace's column all black (no pieces made), then the rest from the right.
    this.cols = new Array(COLS);
    for (let x = COLS - 1; x >= 0; x--) {
      const n = x % 2 === 0 ? TALL : SHORT;
      this.cols[x] = Array.from({ length: n }, () => (x === COLS - 1 ? BLACK : this.nextPiece()));
    }
  }

  /** A new piece: 1 in 31 spice (never the first 17), else white, brown or black evenly; a white made
      while two burned whites are owed is a burnt white. */
  nextPiece(): number {
    const n = this.made++ < NO_SPICE_FIRST ? SPICE_ONE_IN - 1 : SPICE_ONE_IN;
    const r = Math.floor(this.random() * n);
    if (r === SPICE_ONE_IN - 1) return SPICE;
    const p = r % 3;
    if (p === WHITE && this.owed >= 2) { this.owed -= 2; return BURNT; }
    return p;
  }

  /** Lay a board by hand (tests, drills): columns left to right, each top to bottom, tall and short in
      turn. New columns still come from `random`. */
  lay(cols: Board): this {
    if (cols.length !== COLS) throw new Error(`a board is ${COLS} columns`);
    for (let x = 0; x < COLS; x++) {
      const n = cols[x].length;
      if ((n !== TALL && n !== SHORT) || (x > 0 && n === cols[x - 1].length)) throw new Error('columns go tall and short in turn');
    }
    this.cols = cols.map((c) => [...c]);
    return this;
  }

  tall(x: number): boolean { return tallAt(this.cols, x); }
  at(x: number, y: number): number | undefined { return this.cols[x]?.[y]; }
  neighbour(x: number, y: number, dir: number): [number, number] | null { return neighbourOn(this.cols, x, y, dir); }
  linked(x1: number, y1: number, x2: number, y2: number): boolean { return linkedOn(this.cols, x1, y1, x2, y2); }
  canSwap(x1: number, y1: number, x2: number, y2: number): boolean { return canSwapOn(this.cols, x1, y1, x2, y2); }
  mask(x: number, y: number): number { return maskOn(this.cols, x, y); }
  allSwaps(): [number, number, number, number][] { return swapsOn(this.cols); }
  /** Whether a hand can move anything now (not while the board slides, nor once it's over). */
  get movable(): boolean { return !this.finished && this.sliding <= 0; }

  /** Swap two linked pieces, if the rule lets them. */
  swap(x1: number, y1: number, x2: number, y2: number): boolean {
    if (!this.movable || !this.canSwap(x1, y1, x2, y2)) return false;
    const c = this.cols, p = c[x1][y1];
    c[x1][y1] = c[x2][y2];
    c[x2][y2] = p;
    this.swaps++;
    this.swapping = SWAP_MS;
    return true;
  }
  /** Swap the piece at (x, y) one way, if it can; where it is after. */
  swapToward(x: number, y: number, dir: number): [number, number] | null {
    const n = this.neighbour(x, y, dir);
    return n && this.swap(x, y, n[0], n[1]) ? n : null;
  }
  /** A drag: the piece at path[0] held, and the mouse over each place in turn; whenever it's over a
      neighbour of the held piece it can swap with, they swap, and the held piece goes on from there.
      A place it can't swap with does nothing (the piece is still held), as in the game. The swaps
      made, and where the held piece ends. */
  drag(path: readonly [number, number][]): { swaps: number; at: [number, number] } {
    let at: [number, number] = [path[0][0], path[0][1]], n = 0;
    for (let i = 1; i < path.length; i++) {
      const [x, y] = path[i];
      if (this.swap(at[0], at[1], x, y)) { at = [x, y]; n++; }
    }
    return { swaps: n, at };
  }
  /** Which way a held piece goes for a mouse (dx, dy) from its middle, in pieces (x right, y down): the
      way it can swap whose direction is nearest the mouse's, if the mouse is well on its way there
      (over half a piece out, and within 50 degrees of it). Smooths a slightly sloppy drag where the
      intent is clear (the user, 12 Nov: "certainly make it smooth. I want this enjoyable"), where the
      real game swapped only with the mouse near a piece's middle. */
  wayToward(x: number, y: number, dx: number, dy: number): number | null {
    const len = Math.hypot(dx, dy);
    if (len < 0.55) return null;
    let best: number | null = null, bestCos = Math.cos((50 * Math.PI) / 180);
    for (let d = 0; d < 4; d++) {
      const [wx, wy] = WAY[d], cos = (wx * dx + wy * dy) / (len * Math.hypot(wx, wy));
      const n = this.neighbour(x, y, d);
      if (cos > bestCos && n && this.canSwap(x, y, n[0], n[1])) { best = d; bestCos = cos; }
    }
    return best;
  }
  /** A drag by ways (UP_RIGHT...) from (x, y), stopping at the first it can't make. */
  dragWays(x: number, y: number, ways: readonly number[]): { swaps: number; at: [number, number] } {
    let at: [number, number] = [x, y], n = 0;
    for (const d of ways) {
      const next = this.swapToward(at[0], at[1], d);
      if (!next) break;
      at = next; n++;
    }
    return { swaps: n, at };
  }

  /** ms until the rightmost column leaves, at the furnace's pace. */
  timeLeft(): number {
    if (!this.timer || this.finished) return Infinity;
    return (TICK_MS - this.clock) + Math.max(0, BURN_TICKS - this.furnace) * TICK_MS;
  }
  /** How hot the furnace is, 0 just after a burn to 1 at it. */
  heat(): number { return Math.max(0, Math.min(1, this.furnace / BURN_TICKS)); }

  /** Time passes: swaps land, the board slides, the furnace ticks. What happened. */
  tick(ms: number): DistillEvent[] {
    const ev: DistillEvent[] = [];
    if (this.finished) return ev;
    this.time += ms;
    if (this.sliding > 0) this.sliding = Math.max(0, this.sliding - ms);
    if (this.swapping > 0) {
      this.swapping = Math.max(0, this.swapping - ms);
      if (this.swapping === 0) this.tryBurn(ev);
    }
    if (this.timer) {
      this.clock += ms;
      while (!this.finished && this.clock >= TICK_MS) {
        this.clock -= TICK_MS;
        this.furnaceTick(ev);
      }
    }
    return ev;
  }
  /** Time passing with the furnace stopped (a board paused, for a demo): a swap lands, and a burn waiting
      on it goes; the board slides. The furnace's clock and the time played don't move. */
  settle(ms: number): DistillEvent[] {
    const ev: DistillEvent[] = [];
    if (this.finished) return ev;
    if (this.sliding > 0) this.sliding = Math.max(0, this.sliding - ms);
    if (this.swapping > 0) {
      this.swapping = Math.max(0, this.swapping - ms);
      if (this.swapping === 0) this.tryBurn(ev);
    }
    return ev;
  }
  /** One tick of the furnace (BrewController's): the warning at WARN_TICK, the burn after BURN_TICKS. */
  furnaceTick(ev: DistillEvent[] = []): DistillEvent[] {
    if (this.finished) return ev;
    if (this.furnace === WARN_TICK) ev.push({ kind: 'warning' });
    if (this.furnace >= BURN_TICKS) { this.due = true; this.tryBurn(ev); }
    this.furnace++;
    return ev;
  }
  /** Burn now (X, or right-click), whatever the furnace says, and restart it; not while the board's
      sliding. A swap still moving lands first. */
  burnNow(): DistillEvent[] {
    const ev: DistillEvent[] = [];
    if (!this.movable) return ev;
    this.clock = 0;
    this.furnace = Number.MAX_SAFE_INTEGER;
    return this.furnaceTick(ev);
  }
  /** Quit now, keeping what's been sent up. */
  dismiss(): void { this.finished = true; this.dismissed = true; this.due = false; }

  private tryBurn(ev: DistillEvent[]): void {
    if (!this.due || this.swapping > 0 || this.finished) return;
    this.due = false;
    this.furnace = -1;
    const col = judge(this.cols[COLS - 1], this.chain);
    this.chain = col.chain;
    this.longest = Math.max(this.longest, this.chain);
    if (!col.up) { this.owed += col.whites; this.whitesBurned += col.whites; }
    else {
      this.flask += col.pieces.length;
      this.flaskWhites += col.whites;
      this.flaskBlacks += col.blacks;
    }
    this.points += col.points + col.bonus;
    this.columns.push(col);
    // Everything right a column, a new one in on the left, the opposite height of its neighbour.
    this.cols.pop();
    const n = this.cols[0].length === TALL ? SHORT : TALL;
    this.cols.unshift(Array.from({ length: n }, () => this.nextPiece()));
    this.sliding = SLIDE_MS;
    const finished = this.flask >= FLASK && col.chain < CARRY_ON;
    if (finished) this.finished = true;
    ev.push({ kind: 'column', column: col, finished });
  }

  /** Columns sent up so far. */
  get columnsUp(): number { return this.columns.filter((c) => c.up).length; }
  /** The session's score: points a column sent up. */
  score(): number { return this.points / Math.max(1, this.columnsUp); }
  /** The flask's liquid (BrewIndicator): how full (0 to 1), and its colour, HSB and see-through, from
      its mix: golden, paler and clearer the purer, dark and murky with blacks. */
  liquid(): { level: number; hue: number; sat: number; bri: number; alpha: number } {
    const level = Math.min(1, this.flask / FLASK);
    if (!this.flask) return { level, hue: 49 / 360, sat: 1, bri: 1, alpha: 0 };
    const w = this.flaskWhites / this.flask, k = this.flaskBlacks / this.flask;
    const purity = Math.min(1, Math.max(0, (w * (1 - k) - 0.25) / 0.75));
    let sat = 1, bri = 1, alpha = 0.5;
    if (purity >= 0.5) { sat = 1 - ((purity - 0.5) / 0.5) * 0.75; alpha = 1 - purity; }
    else bri = 1 - ((0.5 - purity) / 0.5) * 0.75;
    return { level, hue: 49 / 360, sat, bri, alpha };
  }
}
