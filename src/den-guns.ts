/* Pirate Den: her guns, loaded by Gunnery. TypeScript, compiled to js/den-guns.js; tested in
   tests/den-guns.test.ts. The puzzle is the one copy of Gunnery (src/gunnery.ts), the gun tower's
   too; js/den/sea-guns.js lays its board on her deck, in the tower's look (js/den/gundeck.js);
   src/den-sail.ts says where a shot goes (broadside).

   The user (10 Nov): "we should have to load the guns through the puzzle". So Q and E fire only a
   gun that's loaded, and her guns are loaded by Gunnery, the den's own (the gun tower's), played on
   her deck. The board's four guns are hers, as in Puzzle Pirates, where what the gunners load is
   what the ship can fire: the two down its left side are her port guns, the two down its right her
   starboard. Firing a side's shot empties one of that side's loaded guns, which then wants a bucket
   to swab it out, as after any shot in Gunnery. So she holds as many shots a side as that side has
   guns on the board: two. This is only what the puzzle means for her. */

import type { Helm, Side } from './den-sail.js';
import { Gunnery } from './gunnery.js';

export const GUNS = {
  /** The side of her each of the board's guns is, in the board's order (src/gunnery.ts,
      GUNNERY.GUNS: two down its left side, then two down its right). */
  SIDES: ['L', 'L', 'R', 'R'] as Side[],
  /** Seconds her gun takes to run out again after a shot, with that side's next load. */
  RUN_OUT: 1.2,
};

/** What a press of Q or E did: fired that side's shot; or nothing, as that side has no shot loaded,
    or its gun's still running out after the last one. */
export type Fired = 'fired' | 'empty' | 'running';

/** Her guns: the Gunnery board on her deck (the puzzle itself, src/gunnery.ts: the same one the gun
    tower plays), its four guns two a side, and her side guns running out after a shot. */
export class Broadside {
  /** Seconds till each side's gun is run out again (0: it is). */
  wait: Record<Side, number> = { L: 0, R: 0 };

  constructor(readonly board: Gunnery = new Gunnery()) {}

  /** The board's guns that side. */
  private side(side: Side) { return this.board.guns.filter((_, i) => GUNS.SIDES[i] === side); }
  /** The shots that side has: its loaded guns. */
  shots(side: Side): number { return this.side(side).filter((g) => g.state === 'loaded').length; }
  /** The most shots that side can hold. */
  most(side: Side): number { return this.side(side).length; }
  /** A shot loaded that side, and its gun run out. */
  ready(side: Side): boolean { return this.shots(side) > 0 && this.wait[side] <= 1e-9; }
  /** How far that side's gun is run out again after a shot, 0 just fired to 1 out. */
  out(side: Side): number { return 1 - Math.max(0, this.wait[side]) / GUNS.RUN_OUT; }

  /** Fire that side, if it has a shot and its gun's run out: one of its loaded guns on the board is
      fired (it wants a bucket now, as in Gunnery). */
  fire(side: Side): Fired {
    if (!this.shots(side)) return 'empty';
    if (this.wait[side] > 1e-9) return 'running';
    this.board.fired(this.side(side).find((g) => g.state === 'loaded')!);
    this.wait[side] = GUNS.RUN_OUT;
    return 'fired';
  }

  /** Loaded up to `n` shots all told, if she has fewer: empty guns on the board loaded, a side at a time
      (port first), so a race's starting shots (FIELD.SHOTS, src/den-racers.ts: the user, 11 Nov, "a gun or
      two loaded") are one a side. A gun part loaded, fouled or wanting a swab is left as it is. How many
      she has now. */
  stock(n: number): number {
    const sides: Side[] = ['L', 'R'];
    for (let k = 0; this.shots('L') + this.shots('R') < n && k < 2 * this.board.guns.length; k++) {
      const g = this.side(sides[k % 2]).find((x) => x.state === 'empty');
      if (g) g.state = 'loaded';
    }
    return this.shots('L') + this.shots('R');
  }

  tick(dt: number) { for (const k of ['L', 'R'] as Side[]) this.wait[k] = Math.max(0, this.wait[k] - dt); }
}

/** Why the Gunnery board can't be on her deck just now, if it can't: her oars are out (the rowing
    board's there: one or the other, not both), she's holed (the deck patch comes first), or she's
    waiting in the lock to be pumped up (the quay's Bilge). Under way to a pin she can: she sails
    on while you load. */
export function cantLoad(h: Helm): 'oars' | 'holed' | 'lock' | null {
  if (h.oars) return 'oars';
  if (h.dazed()) return 'holed';
  if (h.held() === 'up') return 'lock';
  return null;
}
