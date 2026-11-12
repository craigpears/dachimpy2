/* Pirate Den: the sloop race's gambles (12 Nov). TypeScript, compiled to js/den-gamble.js; tested in
   tests/den-gamble.test.ts. Their squares are LAY.RACE.GAMBLES (src/den-sail.ts); the helm plays them
   through its `takes` hook (Helm, src/den-sail.ts) and the turning pool's spin (`turns`, src/den-whirl.ts);
   js/den/race-gamble.js draws them; the simulation's bots take them by their own odds (src/race-sim.ts,
   BETS). RACE.md §4, "Gambles", has the reasoning.

   The user (12 Nov), to go further with snakes and ladders: "sometimes maybe there should be a mysterious
   headwind. Half the time it pushes you forward and helps you skip a bit. Sometimes you're getting lucky and
   it goes backwards. But maybe the whirlpool, the direction the whirlpool goes is changes, so it goes back
   up, that's involved, that goes back and forth. So you can go that way if you want to take a gamble."

   Two squares that are a bet rather than a puzzle, each a ladder or a snake:
   - The veiled wind, through spit 5 (VEIL): a lane that looks the same either way till she's on it. Sail onto
     it and it's a coin toss (seeded: one race's tosses the same every time, so a race simulated or replayed
     is the same race), each time she comes onto it: it blows her on through onto the run home (a ladder), or
     back out and along leg 5's second row to its start (a snake). Worth about the same either way on
     average: a swing, not a shortcut.
   - The turning pool, on leg 2 (TURN): a whirlpool, by Puzzle Pirates' rules (src/den-whirl.ts: one step a
     move, to its far corner), whose spin turns back and forth on a beat you can see (BEAT): clockwise a
     while, slowing, then anticlockwise. Sailed into along the leg's first row (on its second she sails by),
     its step leaves her on its corner in the spit, turned to face on (clockwise) or back (anticlockwise),
     and it throws her the way she faces: on, out across the leg and down a cleft through spit 2 onto leg 3
     (only its throw gets there); or back, up a wind lane through spit 1 onto leg 1. It can be read, so it's a bet on timing: go in as it turns your way and it flings you on; mistime
     it and it throws you back. Sailed into any other way, it's a plain whirlpool, turning her about. */

import { LAY, type Pose } from './den-sail.js';

const RC = LAY.RACE, TN = RC.GAMBLES.TURN, VL = RC.GAMBLES.VEIL;
const key = (c: number, r: number) => `${c},${r}`;

export const GAMBLE = {
  /** Seconds the turning pool spins each way before it turns (a beat: slowing to a stop and picking up the
      other way). Long enough to read and time a way in; short enough that a racer coming up to it waits a
      little at most. Assumed. (A course from the race's editor may set its own: src/race-course.ts.) */
  BEAT: RC.COURSE.beat,
  /** Its spin at full speed, in radians a second (js/den/race-gamble.js): a plain pool's. */
  SPEED: 1.6,
  /** The veiled wind's chance of blowing her on: a coin toss (or a course's own odds, from the race's
      editor: src/race-course.ts). */
  ON: RC.COURSE.veilOn / 100,
  /** What each saves (on, a ladder) or costs (back, a snake), in seconds, over sailing on the long way from
      a few squares before it to well past it, as the helm measures it (tests/den-gamble.test.ts holds the
      course to it; the simulation's bots go by it, src/race-sim.ts). The veiled wind about the same either
      way, so it's worth about nothing on average: a coin toss, a swing. The turning pool's throw back up onto
      leg 1 costs about three and a half times what its throw on saves: it's a bet on timing, about even for a
      racer who times it three goes in four, a loss for one who doesn't and a gain for one who does better. */
  SAVES: { veil: { on: 26, back: -27 }, turn: { on: 19, back: -67 } } as Record<BetId, { on: number; back: number }>,
};
/** A gamble: the turning pool, or the veiled wind. */
export type BetId = 'turn' | 'veil';

/** Its spin at `t` seconds of the race's clock (from the gun): 1 clockwise at full, -1 anticlockwise at
    full, through 0 as it turns. */
export const spinAt = (t: number): number => Math.sin((Math.PI * t) / GAMBLE.BEAT);
/** The way it's spinning at `t`: what its step does to her if it takes it now. */
export const spinWay = (t: number): 1 | -1 => (spinAt(t) >= 0 ? 1 : -1);
/** How far round it's turned by `t` (seconds' worth at full speed, clockwise up): for drawing it. */
export const turnedAt = (t: number): number => (GAMBLE.BEAT / Math.PI) * (1 - Math.cos((Math.PI * t) / GAMBLE.BEAT));
/** Seconds till it next turns its spin, from `t`. */
export const nextTurn = (t: number): number => GAMBLE.BEAT - (((t % GAMBLE.BEAT) + GAMBLE.BEAT) % GAMBLE.BEAT);

/** A coin toss for the `n`-th time (0 up) a racer comes onto the veiled wind in race `seed`: true, it blows
    her on. The same seed and count, the same toss. */
export function toss(seed: number, n: number): boolean {
  let x = (Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(n + 1, 0x85ebca6b)) >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15; x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return (x >>> 0) / 2 ** 32 < GAMBLE.ON;
}

const veils = new Set(VL.WAY.map(([c, r]) => key(c, r)));
/** On the veiled wind's lane. */
export const onVeil = (c: number, r: number): boolean => veils.has(key(Math.round(c), Math.round(r)));
/** The veiled wind's carry, on or back, from where she's come onto it. */
export const veilCarry = (on: boolean): Pose[] => (on ? VL.ON : VL.BACK).map((p) => ({ ...p }));

/** The turning pool's throw, from where its step has left her (`p`, turned): from its corner in the spit
    facing on (out, down the course) or back (in), that way; anywhere else, or facing along the leg, none. */
export function throwOf(p: Pose): { on: boolean; squares: Pose[] } | null {
  if (p.c !== TN.FAR[0] || p.r !== TN.FAR[1] || (p.d !== 0 && p.d !== 2)) return null;
  const on = p.d === 0;
  return { on, squares: (on ? TN.ON : TN.BACK).map((q) => ({ ...q })) };
}

/** What took her last: the veiled wind or the turning pool, on or back, and the squares it carried her. */
export interface Taken { kind: 'veil' | 'turn'; on: boolean; squares: Pose[] }

/** The gambles in one race: the clock the pool turns on, the tosses, and what took her last. Its `takes` is
    the helm's (Helm.takes) and its `way` the pool's spin (Whirlpool.turns) once wired to them. */
export class Gambles {
  /** The race's clock: seconds from the gun (or, with no race on, as it's ticked). */
  t = 0;
  /** Times she's come onto the veiled wind this race. */
  n = 0;
  /** What took her last, for the 3D to show (it clears it). */
  last: Taken | null = null;
  constructor(public seed = 1) {}

  /** The pool's spin now. */
  way(): 1 | -1 { return spinWay(this.t); }
  /** A new race: the clock from the gun, a fresh run of tosses. */
  reset(seed: number) { this.seed = seed; this.t = 0; this.n = 0; this.last = null; }
  /** Time going by; or, with `clock`, set to it (the race's). */
  tick(dt: number, clock: number | null = null) { this.t = clock ?? this.t + dt; }

  /** Helm.takes: come to rest on the veiled wind, its toss and its carry; turned by the pool's step to face
      on or back on its corner in the spit, its throw. */
  takes(p: Pose, whirled: boolean): Pose[] | null {
    if (onVeil(p.c, p.r)) {
      const on = toss(this.seed, this.n++), squares = veilCarry(on);
      this.last = { kind: 'veil', on, squares };
      return squares;
    }
    const th = whirled ? throwOf(p) : null;
    if (!th) return null;
    this.last = { kind: 'turn', on: th.on, squares: th.squares };
    return th.squares;
  }
}

/** The turning pool's way in, along the leg: its corner on leg 2's first row, sailing left along it
    (clockwise, its step faces her on). */
export const TURN_IN: Pose = { c: TN.IN[0], r: TN.IN[1], d: 3 };
/** The veiled wind's way on: leg 5's second row in front of it, facing out onto it. */
export const VEIL_IN: Pose = { c: VL.WAY[0][0], r: VL.WAY[0][1] - 1, d: 0 };
