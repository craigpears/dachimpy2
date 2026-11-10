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

import { Oars, ROW, Rowing, type RowMove, type RowingOptions, type Side, type Step } from './rowing.js';
import { poseAt, type Move, type Pose } from './den-sail.js';

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

  /** Rowed alone, a one-sided move waits ROW.SOLO for the next to even it up, not ROW.WINDOW. */
  constructor(o: RowingOptions = {}) { this.rowing = new Rowing({ ...o, oars: o.oars ?? new Oars(ROW.SOLO) }); }

  /** The next square building up, as fractions of a square's pull (ROW.STEP): `ahead` toward a
      forward (0 to 1), and `turn` toward a turn, more than nothing to starboard (right), less to
      port (left), counting pull still waiting for the other side as the turn it'll be if nothing
      evens it up. A whole one (or more) either way and she's about to turn. The compass shows it,
      and she leans into it (lead). */
  building(): { ahead: number; turn: number } {
    const o = this.rowing.oars;
    return { ahead: o.ahead / ROW.STEP, turn: (o.swing + this.waiting('port') - this.waiting('starboard')) / ROW.STEP };
  }

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

/* Seeing her answer the oars as the pull builds (TODO.md, 10 Nov: "I'm not seeing any physical
   difference. Like ... I expect the boat to start, tilt it, angling to one side if I'm just rowing
   one side, and it to actually see some sense of movement"). She still moves a whole square at a
   time, but between them she creeps ahead as forward pull builds, swings her bows toward the turn
   that's building, and heels toward it; and when the square's move comes it starts from where she's
   crept to, the lead melting into the move, never jumping back. */
export const LEAN = {
  /** Squares she creeps ahead with a whole square's pull built up (short of handing it out). */
  CREEP: 0.3,
  /** Quarter turns her bows swing with a whole turn's pull built up. */
  YAW: 0.35,
  /** Radians she heels into it then. */
  HEEL: 0.1,
};

/** How far she leans into the square that's building: `f` squares ahead along her heading, `y`
    quarter turns (more than nothing to starboard), `heel` radians. */
export interface Lead { f: number; y: number; heel: number }
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export function leadFor(b: { ahead: number; turn: number }): Lead {
  const t = clamp(b.turn, -1, 1);
  return { f: LEAN.CREEP * clamp(b.ahead, 0, 1), y: LEAN.YAW * t, heel: LEAN.HEEL * t };
}

/** Where she's drawn, for a pose (as poseAt gives it: across, out, quarter turns) heading `d`, with
    a lead `k` of the way in. */
export function leaned(p: { c: number; r: number; a: number }, d: number, lead: Lead, k = 1): { c: number; r: number; a: number } {
  return { c: p.c + DC[d] * lead.f * k, r: p.r + DR[d] * lead.f * k, a: p.a + lead.y * k };
}

/** Where she's drawn partway (u, 0 to 1) through a move that began with her leaning `lead`: the
    move as ever (poseAt), the lead fading out as the move goes, so it starts where she'd crept to
    and ends square on. */
export function shownAt(from: Pose, m: Move, u: number, lead: Lead, bump = false): { c: number; r: number; a: number } {
  const e = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
  return leaned(poseAt(from, m, u, bump), from.d, lead, 1 - e);
}

