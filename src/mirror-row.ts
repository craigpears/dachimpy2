/* Mirror strokes, a test (TODO.md, "Test mirror strokes on a page of its own", 10 Nov). TypeScript,
   compiled to js/mirror-row.js by `npm run build`; tested in tests/mirror-row.test.ts, played on
   row-test.html and by the bots in tools/row-bots.js. It knows nothing of the den.

   IDEAS.md's "Mirror strokes, thought through for skill": two full Bilge boards side by side, port
   on the left and starboard on the right, with pieces of their own; every swap made on one is made
   in mirror on the other. Looking over her bows the port board's left edge is her outboard side and
   the starboard board's right edge is his, so the mirror of columns c, c + 1 on port is columns
   W - 2 - c, W - 1 - c on starboard. Each board's cascade runs on its own.

   What each board clears is pull for its side, reckoned as rowing.ts reckons a move (ROW: a big
   combo is a big pull). Matched pull drives her ahead, the unmatched part turns her (port's extra
   to starboard), as on the split board. Two ways to pair them, to try both:
   - Stroke: move by move, "clear on both at once to pull straight". What one move pulls on one
     side alone turns her, and turning one way then the other cancels out.
   - ClockedOars: rowing.ts's own Oars, as the den rows, with a move every WINDOW seconds, so a
     one-sided move can still be evened up by the next one.
   The plain split board (SplitRow) is here too, paired either way, so the two can be played and
   measured side by side. */

import { Bilge, NO_SPECIALS, W } from './bilge.js';
import type { Move, Odds } from './bilge.js';
import { Oars, ROW, pull } from './rowing.js';
import type { Pull, Step } from './rowing.js';

/** The column on starboard where a swap at column c on port is mirrored (its left piece). */
export const mirrorCol = (c: number): number => W - 2 - c;

/** All of a move's pull on a board of one side's own. */
export function sidePull(before: ReturnType<Bilge['snap']>, m: Move): number {
  const p = pull(before, m);
  return p.port + p.starboard;
}

/** A copy of a Bilge board, with its own source of new pieces: what a bot imagines a move would do
    (it can see the board, not what's coming in at the bottom). */
export function copyBilge(b: Bilge, random: () => number): Bilge {
  return Object.assign(Object.create(Bilge.prototype) as Bilge, b, { grid: b.snap(), random });
}

/** What turns a move's pull into squares. */
export interface Puller {
  /** Pull built up toward a square forward. */
  readonly ahead: number;
  /** Pull built up toward a turn: more than nothing to starboard. */
  readonly swing: number;
  /** Pull still waiting for the other side (port's less starboard's): it turns her if it's not
      matched in time. */
  pending(): number;
  row(p: Pull): Step[];
  copy(): Puller;
}

/** One stroke's pull turned into squares, move by move. */
export class Stroke implements Puller {
  /** Pull built up toward a square forward. */
  ahead = 0;
  /** Pull built up toward a turn: more than nothing to starboard (port pulled harder). */
  swing = 0;

  /** What a stroke does: how much drives her ahead, and how much turns her (to starboard more than
      nothing). Near enough even (ROW.EVEN) counts as straight, as on the split board. */
  static split(p: Pull): { fwd: number; turn: number } {
    const m = Math.min(p.port, p.starboard), u = p.port - p.starboard;
    if (Math.abs(u) <= ROW.EVEN * (p.port + p.starboard)) return { fwd: 2 * m + Math.abs(u), turn: 0 };
    return { fwd: 2 * m, turn: u };
  }

  row(p: Pull): Step[] {
    const { fwd, turn } = Stroke.split(p);
    this.ahead += fwd; this.swing += turn;
    const out: Step[] = [];
    while (this.swing >= ROW.STEP) { out.push('R'); this.swing -= ROW.STEP; }
    while (this.swing <= -ROW.STEP) { out.push('L'); this.swing += ROW.STEP; }
    while (this.ahead >= ROW.STEP) { out.push('F'); this.ahead -= ROW.STEP; }
    return out;
  }

  pending(): number { return 0; }
  copy(): Stroke { return Object.assign(new Stroke(), { ahead: this.ahead, swing: this.swing }); }
}

/** rowing.ts's Oars, as the den rows, with a move every WINDOW seconds: pull on one side waits for
    the next move to match it. */
export class ClockedOars implements Puller {
  oars = new Oars();
  t = 0;
  get ahead(): number { return this.oars.ahead; }
  get swing(): number { return this.oars.swing; }
  pending(): number {
    const sum = (ls: { n: number }[]) => ls.reduce((t, l) => t + l.n, 0);
    return sum(this.oars.waiting.port) - sum(this.oars.waiting.starboard);
  }
  row(p: Pull): Step[] { this.t += ROW.WINDOW; return this.oars.feed(p, this.t); }
  copy(): ClockedOars {
    const o = this.oars as unknown as { matched: { n: number; at: number }[] };
    const oars = Object.assign(Object.create(Oars.prototype) as Oars, this.oars, {
      waiting: { port: this.oars.waiting.port.map((l) => ({ ...l })), starboard: this.oars.waiting.starboard.map((l) => ({ ...l })) },
      matched: o.matched.slice(),
    });
    return Object.assign(new ClockedOars(), { oars, t: this.t });
  }
}

/** Headings, a quarter turn at a time: 0 up the course, 1 to starboard, 2 back, 3 to port. */
const DX = [0, 1, 0, -1], DY = [1, 0, -1, 0];

/** Where she's been on the sea, in squares, as Battle Navigation moves her: forward a square, or
    forward a square and round a quarter turn into the next. She starts at (0, 0) heading up the
    course (y). */
export class Course {
  x = 0; y = 0; heading = 0;
  /** Quarter turns made in all, to starboard more than nothing (four is a whole circle). */
  turned = 0;
  /** The most she's been round, either way, in quarter turns. */
  mostTurned = 0;
  /** Every square she's moved through: [x, y, heading]. */
  readonly trail: [number, number, number][] = [[0, 0, 0]];

  go(step: Step): void {
    this.x += DX[this.heading]; this.y += DY[this.heading];
    if (step !== 'F') {
      const t = step === 'R' ? 1 : -1;
      this.heading = (this.heading + t + 4) % 4;
      this.turned += t;
      this.mostTurned = Math.max(this.mostTurned, Math.abs(this.turned));
      this.x += DX[this.heading]; this.y += DY[this.heading];
    }
    this.trail.push([this.x, this.y, this.heading]);
  }

  /** Has she been right round, a whole circle? */
  get circled(): boolean { return this.mostTurned >= 4; }
}

/** What a move did. */
export interface RowResult {
  /** Bilge's own account of each board's move (one for the split board). */
  moves: Move[];
  pull: Pull;
  /** The combo names that landed, '' for none: [port, starboard] mirrored, [the board] split. */
  combos: string[];
  steps: Step[];
}

export interface RowOptions {
  /** A source for each board's pieces (the split board uses the first). */
  randoms?: (() => number)[];
  odds?: Odds;
  /** Pair the sides as the den's Oars do (ClockedOars) rather than move by move (Stroke). */
  clocked?: boolean;
}

/** A way to row her: mirrored boards or the plain split one. */
export interface Rower {
  readonly kind: 'mirror' | 'split';
  readonly boards: Bilge[];
  readonly stroke: Puller;
  readonly course: Course;
  /** Swap at (r, c), on the port board for mirror strokes, and row with what it cleared. */
  swap(r: number, c: number): RowResult;
  /** What the swap would pull, tried on copies (each with new pieces from `random`). */
  tryMove(r: number, c: number, random: () => number): { pull: Pull; combos: string[]; copy: Rower };
}

function sail(stroke: Puller, course: Course, p: Pull): Step[] {
  const steps = stroke.row(p);
  for (const s of steps) course.go(s);
  return steps;
}

/** Mirror strokes: two boards, one cursor, every swap made on both. */
export class MirrorRow implements Rower {
  readonly kind = 'mirror';
  readonly boards: Bilge[];
  stroke: Puller;
  course = new Course();

  constructor(o: RowOptions = {}, boards?: Bilge[]) {
    this.stroke = o.clocked ? new ClockedOars() : new Stroke();
    const rs = o.randoms ?? [Math.random, Math.random];
    this.boards = boards ?? [0, 1].map((i) => {
      const b = new Bilge(rs[i] ?? Math.random, o.odds ?? NO_SPECIALS);
      b.water = ROW.WATER;
      return b;
    });
  }

  get port(): Bilge { return this.boards[0]; }
  get starboard(): Bilge { return this.boards[1]; }

  private play(r: number, c: number): Omit<RowResult, 'steps'> {
    const [pb, sb] = [this.port.snap(), this.starboard.snap()];
    const pm = this.port.swap(r, c), sm = this.starboard.swap(r, mirrorCol(c));
    return { moves: [pm, sm], pull: { port: sidePull(pb, pm), starboard: sidePull(sb, sm) }, combos: [pm.combo, sm.combo] };
  }

  swap(r: number, c: number): RowResult {
    const res = this.play(r, c);
    return { ...res, steps: sail(this.stroke, this.course, res.pull) };
  }

  tryMove(r: number, c: number, random: () => number) {
    const copy = new MirrorRow({}, this.boards.map((b) => copyBilge(b, random)));
    const { pull: p, combos } = copy.play(r, c);
    return { pull: p, combos, copy };
  }
}

/** The plain split board (rowing.ts): one board, the left three columns port, the right three
    starboard, reckoned move by move as mirror strokes are. */
export class SplitRow implements Rower {
  readonly kind = 'split';
  readonly boards: Bilge[];
  stroke: Puller;
  course = new Course();

  constructor(o: RowOptions = {}, board?: Bilge) {
    this.stroke = o.clocked ? new ClockedOars() : new Stroke();
    if (board) this.boards = [board];
    else {
      const b = new Bilge(o.randoms?.[0] ?? Math.random, o.odds ?? NO_SPECIALS);
      b.water = ROW.WATER;
      this.boards = [b];
    }
  }

  private play(r: number, c: number): Omit<RowResult, 'steps'> {
    const before = this.boards[0].snap(), m = this.boards[0].swap(r, c);
    return { moves: [m], pull: pull(before, m), combos: [m.combo] };
  }

  swap(r: number, c: number): RowResult {
    const res = this.play(r, c);
    return { ...res, steps: sail(this.stroke, this.course, res.pull) };
  }

  tryMove(r: number, c: number, random: () => number) {
    const copy = new SplitRow({}, copyBilge(this.boards[0], random));
    const { pull: p, combos } = copy.play(r, c);
    return { pull: p, combos, copy };
  }
}

/** A seeded source of numbers in [0, 1) (mulberry32), so a game can be played again. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
