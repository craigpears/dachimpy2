/* Pirate Den: a hole in her deck, patched by Carpentry. TypeScript, compiled to js/den-patch.js;
   tested in tests/den-patch.test.ts. den.js draws the hole, the crate of timber beside it and the
   pieces, and plays it with the Carpentry view's keys (src/den-carp-view.ts).

   The user (9 Nov), dazed by the turret and bilging her out: it was over "way too quickly. Like,
   you know, one fix and it was done", and bilging was wrong for it: "what do you mean bilge? I've
   been hit by a cannonball, not water bucket." So a hit knocks a hole in her deck, and she's dazed
   till it's patched: a whole hole to fill, as the den's Carpentry is played (the wall's holes):
   - a piece must cover at least one open square of the hole, and nothing already in it;
   - it may rest on the sound deck round the hole (boarding it over), a square's width all round,
     as a piece at the wall may hang over the stone;
   - the hole's patched when every square of it is filled.
   About a small wall hole's worth of work: three pieces. */

import type { Cell, Letter } from './engine';

export const PATCH = {
  /** Pieces' worth of hole a hit knocks in her deck: as big as the wall's biggest starting hole. */
  PIECES: 3,
  /** Squares of sound deck round the hole that a piece may rest on. */
  MARGIN: 1,
} as const;

/** A spot for a piece: its top-left, and how many of its squares rest on the deck round the hole. */
export interface Spot { r: number; c: number; over: number }
/** A piece in the hole: its letter, the squares it covers (on the board), and how many rest on the deck. */
export interface Laid { letter: Letter; cells: Cell[]; over: number }
/** The board: the hole's box and the deck round it, rows and columns. */
export interface Board { r0: number; c0: number; h: number; w: number }

const k = (r: number, c: number) => `${r},${c}`;

/** Laid along her: at the top left, and turned to be longer than it's wide if it isn't, since her
    deck's long and narrow (its rows run from her bow to her stern). */
export function alongDeck(cells: Cell[]): Cell[] {
  const r0 = Math.min(...cells.map((p) => p[0])), c0 = Math.min(...cells.map((p) => p[1]));
  const at = cells.map(([r, c]): Cell => [r - r0, c - c0]);
  const h = Math.max(...at.map((p) => p[0])) + 1, w = Math.max(...at.map((p) => p[1])) + 1;
  return w > h ? at.map(([r, c]): Cell => [c, r]) : at;
}

/** The hole a hit knocked in her, and what's been fitted into it. */
export class DeckHole {
  readonly cells: Cell[];
  readonly board: Board;
  laid: Laid[] = [];
  private set: Set<string>;

  constructor(cells: Cell[]) {
    this.cells = alongDeck(cells);
    this.set = new Set(this.cells.map(([r, c]) => k(r, c)));
    const h = Math.max(...this.cells.map((p) => p[0])) + 1, w = Math.max(...this.cells.map((p) => p[1])) + 1, m = PATCH.MARGIN;
    this.board = { r0: -m, c0: -m, h: h + 2 * m, w: w + 2 * m };
  }

  private taken(): Set<string> { return new Set(this.laid.flatMap((p) => p.cells.map(([r, c]) => k(r, c)))); }
  /** The squares of the hole still to fill. */
  open(): Cell[] { const t = this.taken(); return this.cells.filter(([r, c]) => !t.has(k(r, c))); }
  /** Every square of it filled. */
  done(): boolean { return this.open().length === 0; }
  /** Pieces resting on the deck round it (boarded over, not fitted flush). */
  over(): number { return this.laid.reduce((n, p) => n + p.over, 0); }
  isHole(r: number, c: number): boolean { return this.set.has(k(r, c)); }

  /** Whether a piece (its squares, at the top left) goes with its top-left at r, c: all on the
      board, clear of the pieces in, and over at least one open square of the hole. */
  fit(shape: Cell[], r: number, c: number): Spot | null {
    const t = this.taken(), b = this.board;
    let over = 0, inHole = 0;
    for (const [pr, pc] of shape) {
      const R = pr + r, Cc = pc + c;
      if (R < b.r0 || R >= b.r0 + b.h || Cc < b.c0 || Cc >= b.c0 + b.w || t.has(k(R, Cc))) return null;
      if (this.set.has(k(R, Cc))) inHole++; else over++;
    }
    return inHole ? { r, c, over } : null;
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

  /** Take the last piece back out (as the real puzzle lets you adjust the last piece). */
  takeBack(): Laid | undefined { return this.done() ? undefined : this.laid.pop(); }
}
