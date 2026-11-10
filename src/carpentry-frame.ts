/* Pirate Den: Carpentry's frame, the one implementation of it. TypeScript, compiled to
   js/carpentry-frame.js; tested in tests/carpentry-frame.test.ts. It knows nothing of where it's
   played: the den's frames (the stairs, the wall-walk, the gun tower, your shack: js/den/land.js),
   the hole in her deck (src/den-patch.ts) and the crane's frames (src/den-crane.ts) are all one of
   these, drawn round by their own 3D.

   The user (10 Nov), building the crane: "is this not supposed to be like the same? That's what I
   mean by there should be one modular mechanic. So the idea that you can pick up a piece like that
   you've just placed should be in that core module." So the rules are here, once:
   - a piece goes over at least one empty square of the frame, clear of the pieces in it already;
   - it may stick out over the frame's edge, as far as the margin lets it (each place sets its own:
     a square of deck round a hole in hers, two squares on the crane's ledge, any way at the den);
   - any piece laid can be lifted back out, not only the last, till the frame's full: its squares
     are freed and the others stay as they are (a gap is never filled for you: lifting pieces back
     out is the way out of one);
   - full, what sticks out is sawn off (Shipshape when nothing did). */

import type { Cell, Letter } from './engine';

/** A spot for a piece: its top-left, and how many of its squares stick out over the frame. */
export interface Spot { r: number; c: number; over: number }
/** A piece in the frame: its letter, its squares (on the frame's grid), and how many stick out. */
export interface Laid { letter: Letter; cells: Cell[]; over: number }
/** The frame's box and the margin round it, rows and columns. */
export interface Board { r0: number; c0: number; h: number; w: number }
/** What a place asks of its frame: how far a piece may stick out (squares; any way, if left out),
    and any square of the grid a piece may not cover there (the den's stairs: not far above a tread). */
export interface Rules { margin?: number; allow?: (r: number, c: number) => boolean }
/** A piece lifted back out, as it goes into your hands: its shape at the top left, and where its
    top-left was, so it's held where it lay. */
export interface Held { letter: Letter; cells: Cell[]; r: number; c: number }

const key = (r: number, c: number) => `${r},${c}`;

/** A lifted piece as it goes into your hands. */
export function held(l: Laid): Held {
  const r = Math.min(...l.cells.map((p) => p[0])), c = Math.min(...l.cells.map((p) => p[1]));
  return { letter: l.letter, cells: l.cells.map(([a, b]): Cell => [a - r, b - c]), r, c };
}

export class CarpentryFrame {
  readonly cells: Cell[];
  /** The frame's box and the margin round it (just the frame's box when a piece may stick out any way). */
  readonly board: Board;
  laid: Laid[] = [];
  private set: Set<string>;
  private box: { r0: number; c0: number; r1: number; c1: number };
  private margin: number;
  private allow?: (r: number, c: number) => boolean;

  constructor(cells: Cell[], rules: Rules = {}) {
    this.cells = cells.map(([r, c]): Cell => [r, c]);
    this.set = new Set(this.cells.map(([r, c]) => key(r, c)));
    const rs = this.cells.map((p) => p[0]), cs = this.cells.map((p) => p[1]);
    this.box = { r0: Math.min(...rs), c0: Math.min(...cs), r1: Math.max(...rs), c1: Math.max(...cs) };
    this.margin = rules.margin ?? Infinity;
    this.allow = rules.allow;
    const m = Number.isFinite(this.margin) ? this.margin : 0, b = this.box;
    this.board = { r0: b.r0 - m, c0: b.c0 - m, h: b.r1 - b.r0 + 1 + 2 * m, w: b.c1 - b.c0 + 1 + 2 * m };
  }

  private taken(): Set<string> { return new Set(this.laid.flatMap((p) => p.cells.map(([r, c]) => key(r, c)))); }
  /** A piece is on that square (in the frame or sticking out over its edge). */
  occupied(r: number, c: number): boolean { return this.at(r, c) >= 0; }
  /** The squares of the frame still to fill. */
  open(): Cell[] { const t = this.taken(); return this.cells.filter(([r, c]) => !t.has(key(r, c))); }
  /** Every square of it filled. */
  done(): boolean { return this.open().length === 0; }
  /** Squares of the pieces in it that stick out over its edge: offcuts, once it's sawn. */
  over(): number { return this.laid.reduce((n, p) => n + p.over, 0); }
  /** Filled with nothing sticking out: Shipshape. */
  shipshape(): boolean { return this.done() && this.over() === 0; }
  /** That square's part of the frame. */
  isHole(r: number, c: number): boolean { return this.set.has(key(r, c)); }

  /** Whether a piece (its squares, at the top left) goes with its top-left at r, c: within the
      margin round the frame, clear of the pieces in, and over at least one empty square of it. */
  fit(shape: Cell[], r: number, c: number): Spot | null {
    const t = this.taken(), b = this.box, m = this.margin;
    let over = 0, inside = 0;
    for (const [pr, pc] of shape) {
      const R = pr + r, Cc = pc + c;
      if (R < b.r0 - m || R > b.r1 + m || Cc < b.c0 - m || Cc > b.c1 + m || t.has(key(R, Cc))) return null;
      if (this.allow && !this.allow(R, Cc)) return null;
      if (this.set.has(key(R, Cc))) inside++; else over++;
    }
    return inside ? { r, c, over } : null;
  }

  /** Every spot the piece goes, top row first, left to right. */
  fits(shape: Cell[]): Spot[] {
    const out: Spot[] = [], seen = new Set<string>();
    for (const [er, ec] of this.open()) for (const [pr, pc] of shape) {
      const r = er - pr, c = ec - pc;
      if (seen.has(key(r, c))) continue;
      seen.add(key(r, c));
      const s = this.fit(shape, r, c);
      if (s) out.push(s);
    }
    return out.sort((a, z) => a.r - z.r || a.c - z.c);
  }

  /** Fit a piece there, if it goes. */
  put(letter: Letter, shape: Cell[], r: number, c: number): boolean {
    const s = this.fit(shape, r, c);
    if (!s) return false;
    this.laid.push({ letter, cells: shape.map(([pr, pc]): Cell => [pr + r, pc + c]), over: s.over });
    return true;
  }

  /** Lay a piece just where it's said to be, unchecked: one fitted already somewhere this is a copy
      of (a crewmate's frame, as the host has it). */
  lay(letter: Letter, cells: Cell[]): Laid {
    const l: Laid = { letter, cells: cells.map(([r, c]): Cell => [r, c]), over: cells.filter(([r, c]) => !this.isHole(r, c)).length };
    this.laid.push(l);
    return l;
  }

  /** Which piece is on that square: its place in `laid`, or -1. */
  at(r: number, c: number): number { return this.laid.findIndex((p) => p.cells.some(([a, b]) => a === r && b === c)); }

  /** Lift a piece back out, any of them, till the frame's full: its squares are freed, the others
      stay as they are. What came out, or nothing. */
  lift(i: number): Laid | undefined {
    if (this.done() || i < 0 || i >= this.laid.length) return undefined;
    return this.laid.splice(i, 1)[0];
  }

  /** Backspace: the last piece back out, till the frame's full. */
  takeBack(): Laid | undefined { return this.lift(this.laid.length - 1); }

  /** Sawn to fit, once it's full: for each piece (as in `laid`), the places in its squares of the
      ones kept and the ones sawn off. */
  saw(): { kept: number[]; cut: number[] }[] {
    return this.laid.map((p) => {
      const kept: number[] = [], cut: number[] = [];
      p.cells.forEach(([r, c], i) => (this.isHole(r, c) ? kept : cut).push(i));
      return { kept, cut };
    });
  }
}
