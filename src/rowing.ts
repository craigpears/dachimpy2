/* Rowing: Bilge's board split down the middle into her oars. TypeScript, compiled to js/rowing.js by
   `npm run build`; tested in tests/rowing.test.ts. Like bilge.ts it knows nothing of the den. It was
   the den's first rowing board; the den now rows mirror strokes (src/mirror-row.ts), which reckons
   a move's pull here (pull, ROW), and its bots measure this split board against it.

   The user (10 Nov), on IDEAS.md's "Port and starboard": "not obviously like a brand new puzzle,
   but it's certainly a nice twist on bilging ... Do that. Absolutely do that." So it is the real
   Bilge (src/bilge.ts, every rule as it is), and only what a move clears is read a new way:
   - Looking over her bows, the left three columns are her port oars, the right three starboard.
     A piece cleared in columns 0-2 pulls on the port oars, one in columns 3-5 on the starboard.
   - A move pulls as hard as it's worth, reckoned as the bilging guides reckon a move (a big combo
     is a big pull), and that pull is shared between the sides by where its pieces were cleared.
   - Even work drives her straight ahead. More on one side turns her toward that side: harder on
     the starboard oars (the right) turns her to starboard (right), harder on port to port (left).
     Real oars do the opposite, but the user (10 Nov): "if you pull on the right-hand side, it
     should definitely go right".
   - The pull builds up into whole squares of Battle Navigation's moves: forward, left, right.

   Rowing will be a team puzzle too, and the heart of a race (the user, 10 Nov): each of two
   pirates rows one side on a board of their own, and "if you both clear a bingo at the same time,
   that gets you that good balanced forward momentum", while if one outdoes the other "you just
   end up rowing in circles"; a Vegas is a burst, that side's pirate rowing like crazy. So the oars
   (Oars, below) take pull for either side from anywhere, the one split board or two boards of a
   side each, and it's timing that pairs them: pull on one side waits a moment (WINDOW) for the
   other side to match it. What's matched drives her ahead; what's still unmatched when the moment's
   up turns her. On the split board a move that pulls both sides matches itself at once, and a
   one-sided move can still be evened up by the next one.

   Any swap is allowed, as in Bilge, the one across the middle (columns 2 and 3) too. What counts
   is where the pieces were when they were cleared, not where the swap was: a swap across the
   middle that makes a line each side pulls both sides; one that makes a line in column 2 alone
   pulls port.

   The water line: rowing has nothing to pump, so it stays where Bilge's water is lowest (three
   rows) and never moves. It's only the sea she sits in, there so crabs still come up out of it
   and clear as a bonus, as in the real puzzle. */

import { Bilge, MIN_WATER, W } from './bilge.js';
import type { Bit, Move, Odds } from './bilge.js';

/** The numbers to tune. */
export const ROW = {
  /** Pull it takes to row one square on the sea, forward or turning: three plain threes. A Bingo
      is nearly three squares, a two-line combo one. */
  STEP: 3,
  /** Seconds pull on one side waits for the other side to match it before it turns her. A decent
      bilger makes a move about every three seconds, so one side's move and the next move on the
      other side still pull together. */
  WINDOW: 3,
  /** Near enough even counts as straight: unmatched pull no more than this share of the pull
      rowed round it (itself, and what was matched in the WINDOW either side) drives her ahead
      rather than turning her. */
  EVEN: 0.25,
  /** What a move's own clear is worth, as the bilging guides on YPPedia reckon it: a three (no
      name) one, and each named combo more. A pufferfish or jellyfish's own clear is worth nothing,
      as in Bilge; only what it sets off counts. */
  THREE: 1,
  WORTH: { Good: 1.5, Great: 2, 'Arrr!': 3, 'Har!': 3.5, 'Yarrr!': 4, 'Bingo!': 8, 'Sea Donkey!': 12, 'Vegas!': 15 } as Record<string, number>,
  /** Each link of a chain after the move's own clear. */
  LINK: 0.5,
  /** Each crab that comes up out of the water. */
  CRAB: 2,
  /** The water, in rows: Bilge's least, and it stays there (see above). */
  WATER: MIN_WATER,
};

/** A square on the sea, as on Battle Navigation's tokens: forward, left, right. */
export type Step = 'F' | 'L' | 'R';

/** How hard a move pulled on each side's oars. */
export interface Pull { port: number; starboard: number }

/** Which oars a column is: the left three port, the right three starboard. */
export const isPort = (c: number): boolean => c < W / 2;

/** How hard a Bilge move pulled each side, from the board as it was just before the move. Each
    step of the move is worth its share (the move's own clear its combo, a chain's link LINK, a
    crab CRAB), split between the sides by where the pieces it cleared were. */
export function pull(before: (Bit | null)[][], m: Move): Pull {
  const out: Pull = { port: 0, starboard: 0 };
  if (!m.moved) return out;
  let grid = before, own = true;
  for (const st of m.stages) {
    if (st.cleared.length) {
      const where = new Map<number, [number, Bit]>();
      grid.forEach((row) => row.forEach((b, c) => { if (b) where.set(b.id, [c, b]); }));
      const gone = st.cleared.map((id) => where.get(id)).filter((x): x is [number, Bit] => !!x);
      const port = gone.filter(([c]) => isPort(c)).length;
      let worth: number;
      if (own) worth = m.puffer || m.jelly ? 0 : ROW.WORTH[m.combo] ?? ROW.THREE;
      else if (gone.every(([, b]) => b.s === 'crab')) worth = ROW.CRAB * gone.length;   // a chain never clears a crab
      else worth = ROW.LINK;
      own = false;
      if (gone.length) {
        out.port += worth * port / gone.length;
        out.starboard += worth * (gone.length - port) / gone.length;
      }
    }
    grid = st.grid;
  }
  return out;
}

/** A side of the boat. */
export type Side = 'port' | 'starboard';

/** Pull on one side, waiting for the other side to match it. */
interface Lot { n: number; at: number }

/** The oars: pull from either side builds up here until there's a whole square's worth, and then
    it's handed out as a move for the sea. Times are in seconds, from any clock, so long as it only
    goes forward. */
export class Oars {
  /** Pull built up toward a square forward. */
  ahead = 0;
  /** Pull built up toward a turn: more than nothing to starboard (starboard's oars pulled harder),
      less to port. Turning one way and then the other cancels out, as it would at the oars. */
  swing = 0;
  /** Pull on each side still waiting for the other side, oldest first. */
  readonly waiting: Record<Side, Lot[]> = { port: [], starboard: [] };
  /** Pull matched lately (both sides together), to tell near-even from lopsided. */
  private matched: Lot[] = [];

  /** `window`: the seconds pull on one side waits for the other (ROW.WINDOW unless asked). */
  constructor(readonly window: number = ROW.WINDOW) {}

  /** Pull on one side's oars. */
  row(side: Side, n: number, now: number): Step[] {
    return this.feed(side === 'port' ? { port: n, starboard: 0 } : { port: 0, starboard: n }, now);
  }

  /** Pull on both sides at once (a move on the split board). */
  feed(p: Pull, now: number): Step[] {
    if (p.port > 0) this.waiting.port.push({ n: p.port, at: now });
    if (p.starboard > 0) this.waiting.starboard.push({ n: p.starboard, at: now });
    const sum = (ls: Lot[]) => ls.reduce((t, l) => t + l.n, 0);
    const m = Math.min(sum(this.waiting.port), sum(this.waiting.starboard));
    if (m > 0) {
      this.ahead += 2 * m;
      this.matched.push({ n: 2 * m, at: now });
      for (const ls of [this.waiting.port, this.waiting.starboard]) {
        let left = m;
        while (left > 1e-9 && ls.length) {
          const take = Math.min(left, ls[0].n);
          ls[0].n -= take; left -= take;
          if (ls[0].n <= 1e-9) ls.shift();
        }
      }
    }
    return this.tick(now);
  }

  /** Time goes by: pull left waiting past the WINDOW turns her (or, if it's near enough even with
      what was rowed round it, drives her ahead). Call it every so often, and it hands out any
      squares that finishes. */
  tick(now: number): Step[] {
    for (const side of ['port', 'starboard'] as Side[]) {
      const ls = this.waiting[side];
      while (ls.length && ls[0].at + this.window <= now) {
        const { n, at } = ls.shift()!;
        const round = this.matched.filter((x) => Math.abs(x.at - at) <= this.window).reduce((t, x) => t + x.n, 0);
        if (n <= ROW.EVEN * (n + round)) this.ahead += n;
        else this.swing += side === 'starboard' ? n : -n;
      }
    }
    this.matched = this.matched.filter((x) => x.at + 2 * this.window > now);
    const out: Step[] = [];
    while (this.swing >= ROW.STEP) { out.push('R'); this.swing -= ROW.STEP; }
    while (this.swing <= -ROW.STEP) { out.push('L'); this.swing += ROW.STEP; }
    while (this.ahead >= ROW.STEP) { out.push('F'); this.ahead -= ROW.STEP; }
    return out;
  }

  /** Lose whatever was built up or waiting (when she runs aground, say). */
  reset(): void {
    this.ahead = 0; this.swing = 0;
    this.waiting.port = []; this.waiting.starboard = [];
    this.matched = [];
  }
}

/** What a move at a rowing board did: Bilge's own account, the pull on each side, and the squares
    it finished (more can come later, from Oars.tick). */
export interface RowMove { move: Move; pull: Pull; steps: Step[] }

export interface RowingOptions {
  random?: () => number;
  odds?: Odds;
  /** The oars it rows; two boards rowing one boat share them. */
  oars?: Oars;
  /** A board of one side's own (a team's): everything it clears pulls that side. Left out, it's the
      split board, port on the left and starboard on the right. */
  side?: Side;
}

/** A rowing board: a Bilge board and the oars it pulls. */
export class Rowing {
  readonly bilge: Bilge;
  readonly oars: Oars;
  readonly side?: Side;

  constructor(o: RowingOptions = {}) {
    this.bilge = new Bilge(o.random ?? Math.random, o.odds);
    this.bilge.water = ROW.WATER;
    this.oars = o.oars ?? new Oars();
    this.side = o.side;
  }

  /** Swap the pieces at (r, c) and (r, c + 1), as in Bilge, at this time, and row with what it
      cleared. */
  swap(r: number, c: number, now: number): RowMove {
    const before = this.bilge.snap();
    const move = this.bilge.swap(r, c);
    let p = pull(before, move);
    if (this.side) { const all = p.port + p.starboard; p = this.side === 'port' ? { port: all, starboard: 0 } : { port: 0, starboard: all }; }
    return { move, pull: p, steps: this.oars.feed(p, now) };
  }
}
