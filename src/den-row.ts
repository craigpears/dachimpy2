/* Pirate Den: the rowing board at sea, her oars run out (TODO.md, "Rowing by port and starboard",
   10 Nov). TypeScript, compiled to js/den-row.js; tested in tests/den-row.test.ts. The puzzle is
   src/rowing.ts (Bilge's board split down the middle, port on the left, starboard on the right);
   src/den-sail.ts rows her by the squares it hands out (Helm.stroke), the more of them waiting the
   quicker (rowTime, src/den-wind.ts); js/den/rowing.js draws it on her deck.

   While her oars are out the board is the steering: the pin stays where you dropped it, a buoy to
   row for, but the pilot doesn't row for her. So she's told which way the pin lies (bearing), and
   which side to pull harder to bring her round to it (pullFor).

   The rowers, one each side, stroke as hard as their side's been pulling lately (the user, 10 Nov:
   a big clear makes that side's pirate go "like crazy"; "I want the funny animation"): `lately` is
   each side's pull, fading over a couple of seconds, and a rower's strokes a second follow it. */

import { Rowing, type RowMove, type RowingOptions, type Side, type Step } from './rowing.js';
import type { Pose } from './den-sail.js';

export const CREW = {
  /** A rower's strokes a second, rowing steady: while she's under way at the oars, or that side's
      pulled lately. */
  STEADY: 0.9,
  /** And this many more a second for every bit of pull that side's had lately: a Vegas on one side
      (15) is over five a second. */
  PER: 0.3,
  /** Seconds the pull lately takes to fade to about a third. */
  FADE: 1.6,
  /** Pull lately at which a side's rower is going like crazy: a two-line combo on one side, or a
      Bingo shared across both. */
  CRAZY: 4,
  /** Squares handed out at once that send her flying: a Vegas shared across both sides is five. */
  FLYING: 4,
};

/** A rowing board at sea and its clock: what each move pulls and hands out, the pull each side's
    had lately, and the time going by (pull on one side waits for the other, src/rowing.ts). */
export class RowBoard {
  readonly rowing: Rowing;
  /** Seconds since the board was set out (the oars' clock). */
  t = 0;
  readonly lately: Record<Side, number> = { port: 0, starboard: 0 };

  constructor(o: RowingOptions = {}) { this.rowing = new Rowing(o); }

  /** A swap on the board (as in Bilge), rowed now. */
  swap(r: number, c: number): RowMove {
    const m = this.rowing.swap(r, c, this.t);
    this.lately.port += m.pull.port;
    this.lately.starboard += m.pull.starboard;
    return m;
  }

  /** Time going by: the pull lately fades, and pull left waiting too long turns her. */
  tick(dt: number): Step[] {
    this.t += dt;
    const k = Math.exp(-dt / CREW.FADE);
    this.lately.port *= k; this.lately.starboard *= k;
    return this.rowing.oars.tick(this.t);
  }

  /** A side's rower's strokes a second (`under`: she's being rowed along just now). */
  rate(side: Side, under: boolean): number {
    const l = this.lately[side];
    return (under || l > 0.05 ? CREW.STEADY : 0) + CREW.PER * l;
  }

  /** That side's rower is going like crazy. */
  crazy(side: Side): boolean { return this.lately[side] >= CREW.CRAZY; }

  /** Pull on a side still waiting for the other side to match it. */
  waiting(side: Side): number { return this.rowing.oars.waiting[side].reduce((t, l) => t + l.n, 0); }
}

const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];

/** Which way a square lies from her, as she's heading: there already, ahead (within about a
    quarter either side), astern, or off to port or starboard. */
export function bearing(p: Pose, to: [number, number]): 'here' | 'ahead' | 'astern' | Side {
  const dc = to[0] - p.c, dr = to[1] - p.r;
  if (!dc && !dr) return 'here';
  const ahead = dc * DC[p.d] + dr * DR[p.d], right = dc * DC[(p.d + 1) % 4] + dr * DR[(p.d + 1) % 4];
  if (Math.abs(right) <= ahead / 2) return 'ahead';
  if (Math.abs(right) <= -ahead / 2) return 'astern';
  return right > 0 ? 'starboard' : 'port';
}

/** The side to pull harder to bring her round toward a square: the side away from it, as at the
    oars (harder on port swings her bows to starboard). Null when it's ahead (pull evenly) or she's
    there; astern, either side turns her. */
export function pullFor(b: ReturnType<typeof bearing>): Side | 'either' | null {
  if (b === 'port') return 'starboard';
  if (b === 'starboard') return 'port';
  return b === 'astern' ? 'either' : null;
}
