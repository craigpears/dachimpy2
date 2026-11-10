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
   Those are Carpentry's frame's rules (src/carpentry-frame.ts), the same everywhere you build.
   About a small wall hole's worth of work: three pieces. */

import { CarpentryFrame, type Board, type Laid, type Spot } from './carpentry-frame.js';
import type { Cell } from './engine';

export type { Board, Laid, Spot };

export const PATCH = {
  /** Pieces' worth of hole a hit knocks in her deck: as big as the wall's biggest starting hole. */
  PIECES: 3,
  /** Squares of sound deck round the hole that a piece may rest on. */
  MARGIN: 1,
} as const;

/** Laid along her: at the top left, and turned to be longer than it's wide if it isn't, since her
    deck's long and narrow (its rows run from her bow to her stern). */
export function alongDeck(cells: Cell[]): Cell[] {
  const r0 = Math.min(...cells.map((p) => p[0])), c0 = Math.min(...cells.map((p) => p[1]));
  const at = cells.map(([r, c]): Cell => [r - r0, c - c0]);
  const h = Math.max(...at.map((p) => p[0])) + 1, w = Math.max(...at.map((p) => p[1])) + 1;
  return w > h ? at.map(([r, c]): Cell => [c, r]) : at;
}

/** The hole a hit knocked in her, and what's been fitted into it: Carpentry's frame
    (src/carpentry-frame.ts), laid along her deck, a piece resting a square onto the deck round it at
    most. Any piece fitted can be lifted back out till it's patched, as at the den. */
export class DeckHole extends CarpentryFrame {
  constructor(cells: Cell[]) { super(alongDeck(cells), { margin: PATCH.MARGIN }); }
}
