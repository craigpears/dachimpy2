/* Pirate Den: a crane up the cliff, to a clifftop lagoon. TypeScript, compiled to js/den-crane.js;
   tested in tests/den-crane.test.ts. js/den/crane.js draws it all: the ledge, the old hoist, the
   frames on the ledge, the crane as it goes up, the lagoon and its wreck, and her trip up and down.

   The user (9 Nov): "could I go somewhere to the side of a cliff and like construct a crane to get
   in?", built "with like the carpentry puzzle", and to somewhere of its own: "I don't want ... the
   lock the same thing as the crane." Then (10 Nov) the journey: the canal, Bilge to fill the lock up
   into the hidden cove, and from the cove a crane built by Carpentry hauls her up the cliff, and at
   the top a clifftop lagoon with an old wreck, its treasure brought up by Treasure Haul. "We can
   have a multi-step thing and gradually build up on it."

   So, in the hidden cove, at the foot of its left-hand cliff, there's a ledge: an old smugglers'
   landing, their hoist rotting on the clifftop above it, too small to lift a ship. Sail her
   alongside it and Space builds a crane up there, by Carpentry, a part at a time, as the den's
   rampart and shack are built (RULES.md, "It's built by carpentry, piece by piece, not by magic"):
   each part's frame is laid on the ledge and filled with pieces; a piece may stick out over the
   frame's edge, and the spare's sawn off when it's full; then the old hoist hauls it up the cliff
   and it goes into its place. Its foot, its post and its jib: the crane is the pieces you fitted.
   Built, it hauls her up the cliff and swings her down into the lagoon (a short, cheesy moment
   Space skips), and lowers her back down the same way whenever you like, so you're never stuck.

   The lagoon lies up on the headland, off the edge of the sea's board: she isn't sailed there, she's
   set down in it, beside an old wreck sunk in its still water, and its treasure is hauled up by
   Treasure Haul (src/den-haul.ts). */

import { Salvage } from './den-haul.js';
import type { Cell, Letter } from './engine';

/** A part of the crane: its name, and its frame as rows ('#' a square to fill), as it's laid on the
    ledge: its top row toward the cliff, its columns along the ledge. */
export interface Part { name: 'foot' | 'post' | 'jib'; rows: string[] }

export const CRANE = {
  /** The ledge: the square of the hidden cove she lies alongside it on (at the foot of its left-hand
      cliff; the cove is LAY.COVE in src/den-sail.ts). */
  LEDGE: [0, 11] as [number, number],
  /** A square of the crane's timber, in metres (the den's are 0.55). */
  SQ: 0.45,
  /** Squares a piece may stick out over a frame's edge (the spare's sawn off when it's full). */
  MARGIN: 2,
  /** Its parts, in the order they're built. Each frame can be filled exactly, with single squares
      jutting out where the rare pieces go (RULES.md, "Room for the rare pieces"): the post's are
      its tenons, into the foot and the jib. About four pieces each, thirteen in all. */
  PARTS: [
    { name: 'foot', rows: ['#####.', '######', '#####.', '.####.'] },
    { name: 'post', rows: ['.######.', '########', '.######.'] },
    { name: 'jib', rows: ['##########', '.########.', '.#######..'] },
  ] as Part[],
  /** Her trip up the cliff (or down it), a beat at a time, in seconds: you leap up to the winch;
      she's wound up out of the water; the jib swings her round over the clifftop; she's lowered
      into the water on the other side; you leap down onto her deck; a look round. */
  BEATS: { leap: 0.9, rise: 2.4, swing: 2.4, lower: 1.8, back: 0.9, look: 1.2 },
};

/** The lagoon, up on the headland to the left of the hidden cove: off the sea's board (squares to
    the left of its first column), so nothing on the sea is in the way of it. */
export const LAGOON = {
  /** The old wreck sunk in it, as a square of the sea's board would be counted (off the board). */
  WRECK: [-4, 11] as [number, number],
};

const key = (r: number, c: number) => `${r},${c}`;

/** A part's frame, as squares [row, column]. */
export function partCells(i: number): Cell[] {
  const out: Cell[] = [];
  CRANE.PARTS[i].rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') out.push([r, c]); }));
  return out;
}

/** A spot for a piece: its top-left, and how many of its squares stick out over the frame. */
export interface Spot { r: number; c: number; over: number }
/** A piece in the frame: its letter, its squares (on the frame), and how many stick out. */
export interface Laid { letter: Letter; cells: Cell[]; over: number }

/** A part's frame on the ledge, and the pieces fitted into it: the den's frames' rules (a piece
    covers at least one empty square of it, clear of the pieces in already, and may stick out over
    its edge, here by up to CRANE.MARGIN squares). It plays like the hole in her deck
    (src/den-patch.ts), with the same keys, tray and fair deal. */
export class CraneFrame {
  readonly cells: Cell[];
  /** The frame's box and the margin round it, rows and columns. */
  readonly board: { r0: number; c0: number; h: number; w: number };
  laid: Laid[] = [];
  private set: Set<string>;

  constructor(cells: Cell[]) {
    this.cells = cells.map(([r, c]): Cell => [r, c]);
    this.set = new Set(this.cells.map(([r, c]) => key(r, c)));
    const r0 = Math.min(...cells.map((p) => p[0])), c0 = Math.min(...cells.map((p) => p[1]));
    const h = Math.max(...cells.map((p) => p[0])) - r0 + 1, w = Math.max(...cells.map((p) => p[1])) - c0 + 1, m = CRANE.MARGIN;
    this.board = { r0: r0 - m, c0: c0 - m, h: h + 2 * m, w: w + 2 * m };
  }

  private taken(): Set<string> { return new Set(this.laid.flatMap((p) => p.cells.map(([r, c]) => key(r, c)))); }
  /** The squares of the frame still to fill. */
  open(): Cell[] { const t = this.taken(); return this.cells.filter(([r, c]) => !t.has(key(r, c))); }
  /** Every square of it filled. */
  done(): boolean { return this.open().length === 0; }
  /** Squares of the pieces in it that stick out over its edge: offcuts, once it's sawn. */
  over(): number { return this.laid.reduce((n, p) => n + p.over, 0); }
  /** Filled with nothing sticking out: Shipshape. */
  shipshape(): boolean { return this.done() && this.over() === 0; }
  isHole(r: number, c: number): boolean { return this.set.has(key(r, c)); }

  /** Whether a piece (its squares, at the top left) goes with its top-left at r, c: within the
      margin round the frame, clear of the pieces in, and over at least one empty square of it. */
  fit(shape: Cell[], r: number, c: number): Spot | null {
    const t = this.taken(), b = this.board;
    let over = 0, inside = 0;
    for (const [pr, pc] of shape) {
      const R = pr + r, Cc = pc + c;
      if (R < b.r0 || R >= b.r0 + b.h || Cc < b.c0 || Cc >= b.c0 + b.w || t.has(key(R, Cc))) return null;
      if (this.set.has(key(R, Cc))) inside++; else over++;
    }
    return inside ? { r, c, over } : null;
  }

  /** Every spot the piece goes. */
  fits(shape: Cell[]): Spot[] {
    const out: Spot[] = [], b = this.board;
    for (let r = b.r0 - 4; r < b.r0 + b.h; r++) for (let c = b.c0 - 4; c < b.c0 + b.w; c++) {
      const s = this.fit(shape, r, c);
      if (s) out.push(s);
    }
    return out;
  }

  /** Fit a piece there, if it goes. */
  put(letter: Letter, shape: Cell[], r: number, c: number): boolean {
    const s = this.fit(shape, r, c);
    if (!s) return false;
    this.laid.push({ letter, cells: shape.map(([pr, pc]): Cell => [pr + r, pc + c]), over: s.over });
    return true;
  }

  /** Take the last piece back out, till the frame's full (a gap is never filled for you: lifting
      pieces back out is the way out of one). */
  takeBack(): Laid | undefined { return this.done() ? undefined : this.laid.pop(); }
}

/** Where she is: in the hidden cove, by the ledge, or up in the lagoon. */
export type Where = 'cove' | 'lagoon';

/** How far through each beat of a trip (CRANE.BEATS) she is, `t` seconds in: each 0 to 1. */
export interface Beat { leap: number; rise: number; swing: number; lower: number; back: number; done: boolean }

/** Seconds a whole trip takes. */
export const TRIP = Object.values(CRANE.BEATS).reduce((a, b) => a + b, 0);

/** The beats of a trip, `t` seconds in. The same either way: up out of the water she's in, round,
    and down into the other. */
export function travel(t: number): Beat {
  const B = CRANE.BEATS, out = { leap: 0, rise: 0, swing: 0, lower: 0, back: 0, done: t >= TRIP };
  let at = Math.max(0, t);
  for (const k of ['leap', 'rise', 'swing', 'lower', 'back'] as const) {
    out[k] = Math.min(1, at / B[k]);
    at -= B[k];
    if (at < 0) break;
  }
  return out;
}

/** A ship, as the crane needs to know her: where she is, and whether she's stopped there. */
export interface Ship { pose: { c: number; r: number }; idle(): boolean; held(): unknown; oars: boolean }

/** What happened: a part went up (Shipshape or sawn), the crane's whole, or she got there. */
export type CraneEvent = { kind: 'part'; part: number; shipshape: boolean } | { kind: 'built' } | { kind: 'arrive'; where: Where };

/** The crane: how much of it is up, the frame being filled, and her trips up and down. */
export class Crane {
  /** Parts up so far (all of CRANE.PARTS: it's built). */
  up = 0;
  /** The next part's frame, on the ledge, once you've started on it (kept as you left it). */
  frame: CraneFrame | null = null;
  /** You're at it: the frame's in front of you (Esc leaves it, to come back to). */
  building = false;
  where: Where = 'cove';
  /** A trip under way: where to, and how far into it. */
  trip: { to: Where; t: number } | null = null;
  /** The lagoon wreck's treasure. */
  salvage: Salvage;

  constructor(random: () => number = Math.random) { this.salvage = new Salvage(LAGOON.WRECK, random); }

  built(): boolean { return this.up >= CRANE.PARTS.length; }

  /** She's alongside the ledge, in the cove: on its square, stopped, nothing holding her up, her
      oars shipped (as for hauling a chest). */
  alongside(ship: Ship): boolean {
    return this.where === 'cove' && !this.trip && ship.pose.c === CRANE.LEDGE[0] && ship.pose.r === CRANE.LEDGE[1] && ship.idle() && !ship.held() && !ship.oars;
  }

  /** Start (or go back to) the next part: its frame, laid on the ledge. Null once it's built. */
  build(): CraneFrame | null {
    if (this.built()) return null;
    this.building = true;
    return (this.frame ??= new CraneFrame(partCells(this.up)));
  }

  /** Leave the frame as it is, to come back to. */
  leave() { this.building = false; }

  /** The frame's full: sawn and hoisted up, the part's in its place. What went up (nothing if the
      frame isn't full). The next part's frame is laid when you go on (build: js/den/crane.js does,
      as each part lands, while you're still at it); once all three are up, it's built and you're
      done building. */
  raise(): CraneEvent[] {
    if (!this.frame?.done()) return [];
    const out: CraneEvent[] = [{ kind: 'part', part: this.up, shipshape: this.frame.shipshape() }];
    this.up++;
    this.frame = null;
    if (this.built()) { this.building = false; out.push({ kind: 'built' }); }
    return out;
  }

  /** Haul her up into the lagoon (or lower her back down to the cove). Only once it's built, and
      not while a trip's under way. */
  haul(): boolean {
    if (!this.built() || this.trip) return false;
    this.trip = { to: this.where === 'cove' ? 'lagoon' : 'cove', t: 0 };
    return true;
  }

  /** How far through the trip she is (its beats), if she's on one. */
  beat(): Beat | null { return this.trip ? travel(this.trip.t) : null; }

  /** The trip going on; she's there at the end of it. */
  tick(dt: number): CraneEvent[] {
    if (!this.trip) return [];
    this.trip.t += dt;
    return this.trip.t >= TRIP ? this.skip() : [];
  }

  /** Space: she's there now. */
  skip(): CraneEvent[] {
    if (!this.trip) return [];
    this.where = this.trip.to;
    this.trip = null;
    return [{ kind: 'arrive', where: this.where }];
  }

  /** The wreck's treasure can be hauled up: she's in the lagoon (not on her way), and it's not up yet. */
  canHaulWreck(): boolean { return this.where === 'lagoon' && !this.trip && !this.salvage.done; }
}
