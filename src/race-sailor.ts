/* Pirate Den: a racer's Sailing on the pilot, in the sloop race: her drops at her skill's pace, and the chain
   each one makes, whose gust carries her on (src/den-sailing.ts, carry: a clear a square, a Double two, a
   Triple three, by RUN_TABLE), as your own sloop's are. TypeScript, compiled to js/race-sailor.js; tested in
   tests/race-sim.test.ts. The simulation's bots Sail with one (src/race-sim.ts), and the race watched shows
   it (src/race-watch.ts; js/den/watch-boards.js draws the very board).

   The user (12 Nov), watching Kikkit: "she's doing lots of Doubles and Triples, but that's supposed to be
   zooming your ship along in any context", and "if you do a Double or Triple, even just in a normal lane,
   it's supposed to speed you along a bit". Till then the simulation reckoned Sailing on the pilot as a steady
   bit of extra speed, and the board you watched played its own drops beside it. Now every clear is a gust
   at the moment it's made, and the board you watch is the one making them.

   Two of them, the same drops at the same pace:
   - On a board (boardSailor): a real Sailing board (src/sailing.ts) played by the shallow bot
     (src/sail-bots.ts), each drop chosen as the last lands and landed `every` seconds later: what it clears
     is what carries her. The race watched sails with these, so what you see on her board is what moves her.
     A few milliseconds a drop: fine for a race in the browser, too slow for thousands of them.
   - Drawn (drawnSailor): each drop's chain drawn from the shallow bot's own figures (SAILOR.ODDS), from the
     race's dice: the headless simulation's thousands of races, your rivals in the den's race and the room's
     bots online, where nobody sees the board. The same odds, so the same balance. */

import { Sailing, type Drop } from './sailing.js';
import { SAIL_BOTS } from './sail-bots.js';
import { seeded } from './mirror-row.js';

export type SailSkill = 'decent' | 'good' | 'great';

export const SAILOR = {
  /** Seconds a drop, by skill (a drop every 2.5 s or so for a decent player; was WATCH.DROP). */
  DROP: { decent: 2.6, good: 2.2, great: 1.8 } as Record<SailSkill, number>,
  /** What a drop makes, by its chain's steps (0 nothing cleared, 1 a clear, 2 a Double, 3 a Triple): the
      shallow bot's own figures (3000 drops over twelve deals, 12 Nov: 1923, 1010, 65 and 2), about 0.38
      squares of gust a drop. */
  ODDS: [0.641, 0.3367, 0.0217, 0.0007] as readonly number[],
};

/** A racer's Sailing: time passing while she plays it, and the chains of the drops she lands meanwhile
    (their steps), in order. */
export interface Sailor {
  tick(dt: number): number[];
  /** Seconds a drop takes her. */
  readonly every: number;
  /** Seconds into the drop she's steering down now. */
  readonly t: number;
  /** On a board: its seed (a board laid from it and played the same drops is the same board), the drops
      landed so far, in order, and the one she's steering down now. */
  readonly seed?: number;
  readonly drops?: readonly Drop[];
  readonly aim?: Drop | null;
}

/** Squares of gust a second she makes Sailing at `every` seconds a drop, on average (SAILOR.ODDS): what the
    simulation counts as the Sailing she'd have done, against a shortcut's own saving. */
export function gustRate(every: number): number {
  return SAILOR.ODDS.reduce((n, p, steps) => n + p * Math.min(steps, 3), 0) / every;
}

/** Drawn: each drop's chain from SAILOR.ODDS, by `rand` (the race's dice). */
export function drawnSailor(every: number, rand: () => number): Sailor {
  let t = 0;
  return {
    every,
    get t() { return t; },
    tick(dt) {
      const out: number[] = [];
      for (t += dt; t >= every; t -= every) {
        let x = rand(), steps = 0;
        while (steps < SAILOR.ODDS.length - 1 && x >= SAILOR.ODDS[steps]) x -= SAILOR.ODDS[steps++];
        out.push(steps);
      }
      return out;
    },
  };
}

/** On a board: a real Sailing board of `seed`, played by the shallow bot, a drop every `every` seconds. */
export function boardSailor(every: number, seed: number): Sailor {
  const game = new Sailing(seeded(seed));
  game.record = false;
  const drops: Drop[] = [];
  let t = 0, aim: Drop | null = SAIL_BOTS.shallow(game);
  return {
    every, seed, drops,
    get t() { return t; },
    get aim() { return aim; },
    tick(dt) {
      const out: number[] = [];
      for (t += dt; t >= every; t -= every) {
        if (!aim) { aim = SAIL_BOTS.shallow(game); continue; }
        const e = game.drop(aim.col, aim.turn, aim.row);
        drops.push(aim);
        out.push(e.booched ? 0 : e.steps);
        aim = SAIL_BOTS.shallow(game);
      }
      return out;
    },
  };
}
