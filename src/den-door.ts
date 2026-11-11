/* Pirate Den: the starlit door, on the sloop race's course. TypeScript, compiled to js/den-door.js;
   tested in tests/den-door.test.ts. js/den/door.js draws it and plays it at sea (the marks in the rock,
   the Navigation board in front of it, the stars lit on it, the door swinging open, the tunnel and her
   trip through it); its squares are LAY.RACE.DOOR in src/den-sail.ts.

   The user (11 Nov), of Duty Navigation finding hidden ways: "the only thing that comes to mind is in
   [The Fellowship of the Ring] ... going into the mines of Moria, and he's ... doing the thing to reveal
   the door by starlight. Can we do a similar kind of thing and use duty navigation as the puzzle for how
   you find the door and have it discoverable in some way similar to the carpentry spots?" And of the
   tunnel behind it: "that unlocks a really long, straight passage. But it requires some like more
   hardcore puzzling ... you're going underneath the cavern, but you've got to do like big Vegas, like
   a big Vegas to get through it in sailing".

   So:
   - The door: a stretch of plain cliff on the second spit, off leg 2 (FACE, the water off it OFF), with
     faint marks in the rock for anyone looking closely, never pointed out ("Hidden gems, never hinted").
     Stop off it and Space, and Duty Navigation (src/navigation.ts, its one module) stands in front of
     the rock as the night sky; each constellation filled lights its stars on the rock, in their places
     on the wheel. Its run is two dealt as ever, then the evil one (NAV): six of a colour side by side on
     the inner ring, which can't be made a star at a time (navigation.ts, needsCombo). All three lit,
     the door's outline glows and it swings open; open, it stays open that race.
   - A booch turns her about, away from the cliff: she's pushed off, and the board starts again, every
     star on the rock gone dark (Door.booch).
   - The tunnel: a long straight passage under the cliffs, under legs 3 and 4, from the door to the
     fourth spit's far face, out onto leg 5 (OUT, INTO). No wind blows in it but a draught out through
     the door, so no sail or oar gets her in: only a Sailing chain's gust from the door's mouth (OFF,
     facing in), and only a Vegas's carries her the length of it (tunnelGust; as only a Vegas gets her
     over the race's whirlpools, or into the penguins' water). Less, and she's carried in that far, and
     the draught carries her back out to the mouth, facing in, to try again. It's the course's biggest
     shortcut: legs 2 to 5 in seconds (DOOR.SAVES, tested), for whoever finds it and can navigate.
   - It's ours, not the film's: no words to speak, no elvish, just the stars. */

import { LAY, SAIL, type Pose } from './den-sail.js';
import { runFor, RUN } from './sailing.js';
import { bottomRow, type Done, type Mark, type NavOptions } from './navigation.js';

const D = LAY.RACE.DOOR, LEN = D.INTO[0][1] - D.FACE[0][1] + 1;

export const DOOR = {
  /** The door's Navigation: two constellations dealt as ever (two stars, then three), then the evil
      one, six reds side by side on the inner ring (the bottom row), which takes two stars landing at
      once (navigation.ts, needsCombo). Four colours of star, not the puzzle's five: with five, the
      bots (tools/nav-bots.mjs, DOOR=1) filled the evil one in 6 goes of 40, the inner ring choking on
      stars that won't line up; with four, 16 of 40, in about 270 moves. Still evil. */
  NAV: { sizes: [2, 3], colours: 4, given: [null, null, bottomRow(1, 6, 1)] } as NavOptions,
  /** How many constellations open it (the run's length). */
  RUN: 3,
  /** The squares a gust has to be worth to carry her the length of the tunnel: a Vegas's. */
  NEED: runFor(RUN.VEGAS),
  /** Squares from the door's face to the tunnel's far end, and out onto leg 5 (the trip's length). */
  LEN,
  /** The stretches it joins: she's on leg 2 (1) at its mouth, and comes out on leg 5 (4). */
  FROM: 1, TO: 4,
  /** Seconds her trip through takes, door to daylight, at a gust's pace (SAIL.PUSH a square), with a
      little dark either end as she goes in and comes out; and back out, carried in and the draught
      bringing her out again. */
  TRIP: Math.round((LEN * SAIL.PUSH + 2) * 10) / 10,
  BACK: 3,
  /** About what the tunnel saves over the long way, legs 2 to 5 sailed under sail, in seconds
      (tests/den-door.test.ts holds it to this; the puzzling's on top: the Navigation run and a Vegas). */
  SAVES: 145,
} as const;

/** Off the door: the water off its face, on leg 2, where Space by the rock brings the board up. */
export const offDoor = (c: number, r: number): boolean => D.OFF.some(([x, y]) => x === c && y === r);
/** Which of the door's two columns `p` is at the mouth of, facing in (toward the cliff), or -1. */
export function mouthOf(p: Pose): number {
  return p.d === 0 ? D.OFF.findIndex(([x, y]) => x === p.c && y === p.r) : -1;
}
/** Where the tunnel puts her out, from mouth `i`: on leg 5 below its far end, facing straight on. */
export const outOf = (i: number): Pose => ({ c: D.INTO[i][0], r: D.INTO[i][1], d: 0 });

/** What a gust from `from` does at the door: null if it isn't the tunnel's (not at its mouth facing in,
    or the door's shut: the cliff stops it as any rock does, src/den-sailing.ts); 'through' with a
    Vegas's run or more, out onto leg 5 (`to`); 'back' with less, carried in `went` squares and back out
    to the mouth (`to`, facing in). */
export function tunnelGust(open: boolean, from: Pose, run: number): { way: 'through' | 'back'; went: number; to: Pose } | null {
  const i = mouthOf(from);
  if (!open || i < 0 || run <= 0) return null;
  if (run >= DOOR.NEED) return { way: 'through', went: DOOR.LEN, to: outOf(i) };
  return { way: 'back', went: run, to: { ...from } };
}

/** The door: the stars lit on the rock (each constellation's marks as it went), how far through the
    run, and whether it's open. One a race (a new race, a shut door). */
export class Door {
  lit: Mark[][] = [];
  open = false;
  /** A constellation filled on its board: its stars lit on the rock. True when that was the last of
      the run, and the door opens. */
  done(d: Done): boolean {
    if (this.open || d.booched) return false;
    this.lit.push(d.marks.map((m) => ({ ...m })));
    if (this.lit.length >= DOOR.RUN) this.open = true;
    return this.open;
  }
  /** A booch: every star on the rock dark, the run to start again; and where she's pushed off to,
      turned about away from the cliff, from `at` (off its face). */
  booch(at: Pose): Pose {
    this.lit = [];
    return { c: at.c, r: at.r - 1, d: 2 };
  }
  /** A new race: shut again, dark. */
  reset() { this.lit = []; this.open = false; }
}
