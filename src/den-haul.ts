/* Pirate Den: hauling up a chest by Treasure Haul. TypeScript, compiled to js/den-haul.js; tested in
   tests/den-haul.test.ts. js/den/treasure.js draws the board in the world; this is when you can
   start, the board you haul on, and what the chest's worth.

   The user (9 Nov): sailing over the wrecked turret's chest to collect it was "not Puzzle Pirates'
   spirit at all. Like, you need to have to haul it up. It's just mandatory. It's the Puzzle Pirates
   way. You need puzzles." So the chest is hauled up by Treasure Haul (src/treasure-haul.ts, the real
   puzzle), and, as everywhere in the den, only when you ask: she stops by the chest and Space
   starts the haul; sailing past never pulls you in.

   The chest itself is on the board, down at its foot in the middle, with the coins it spilled
   round it; haul it up to the top row and bring the coins up too, and it's aboard. The same goes
   for any chest the den has you haul (the clifftop lagoon's wreck, later): a Salvage at a place. */

import { Haul, H, W, type Bit, type Odds } from './treasure-haul.js';

export const HAUL = {
  /** Coins spilled round the chest, to bring up with it. */
  HOARD: 40,
  /** Now and then a gem comes in (they help raise the chest); no more chests come up than the one
      you're hauling. (Tried by a simple player: with no gems the chest can take hundreds of
      moves to raise; with these, about twenty, and nearly always under fifty.) */
  ODDS: { ruby: 0.03, emerald: 0.03, chest: 0 } as Odds,
  /** The chest's worth: BASE doubloons, and one more for every PER points the haul scored, up to
      MAX in all. (A Masterpiece pays 10; a haul usually scores about 250 to 1300.) */
  BASE: 25,
  PER: 40,
  MAX: 60,
  /** How near she must be, in squares any way, to haul: on it or beside it. */
  REACH: 1,
};

/** The board for hauling up one chest: the chest at the foot of the board in its middle two
    columns, the board's coins round it, HOARD of them to come up in all. */
export function chestBoard(random: () => number = Math.random, hoard = HAUL.HOARD): Haul {
  const b = new Haul(random, HAUL.ODDS);
  b.hoard = hoard;
  b.chestsLeft = 0;
  // (Ids the board's own pieces never reach, as it counts up from 1.)
  const chest: Bit = { id: 1e9, k: -1, s: 'chest' };
  const c = W / 2 - 1;
  for (const [rr, cc] of [[H - 2, c], [H - 2, c + 1], [H - 1, c], [H - 1, c + 1]]) b.grid[rr][cc] = chest;
  return b;
}

/** What a haul's chest pays, from what the haul scored. */
export function payout(score: number): number {
  return Math.min(HAUL.MAX, HAUL.BASE + Math.floor(Math.max(0, score) / HAUL.PER));
}

/** The den's word when it's aboard. */
export const aboard = (n: number): string => `The chest's aboard! ${n} doubloons`;

/** A chest to be hauled up at a square of the sea, and its haul. Esc leaves it where it is, and its
    board as you left it, to come back to. */
export class Salvage {
  board: Haul | null = null;
  /** Hauled aboard, and paid. */
  done = false;

  constructor(public at: [number, number], private readonly random: () => number = Math.random) {}

  /** Within reach of the chest from (c, r). */
  reaches(c: number, r: number): boolean {
    return Math.max(Math.abs(Math.round(c) - this.at[0]), Math.abs(Math.round(r) - this.at[1])) <= HAUL.REACH;
  }

  /** She can start hauling: it's not aboard yet, she's within reach, and she's stopped there (no
      move being sailed or waiting to be, not held at the lock nor dazed). */
  canStart(ship: { pose: { c: number; r: number }; idle(): boolean; held(): unknown }): boolean {
    return !this.done && ship.idle() && !ship.held() && this.reaches(ship.pose.c, ship.pose.r);
  }

  /** The board to haul on: a fresh one the first time, else the one you left. */
  open(): Haul {
    if (this.done) throw new Error('That chest is aboard already');
    return (this.board ??= chestBoard(this.random));
  }

  /** The haul's over (the chest and all its coins up): it's aboard, and this is what it pays (once;
      null if it isn't over, or it's paid already). */
  finish(): number | null {
    if (this.done || !this.board?.over) return null;
    this.done = true;
    return payout(this.board.score);
  }
}
