/* Pirate Den: a lock on a canal. TypeScript, compiled to js/den-lock.js; tested in
   tests/den-lock.test.ts. js/den/lock.js draws each one (its chamber, its gates, the water rising,
   the quay's pump and Bilge board); src/den-sail.ts lays them on the sea (LAY.LOCKS) and sails her
   through them.

   The user (9 Nov): "some kind of a lock and canal ... there's a bit of a cliff. You have to go up a
   lock", and "you have to do a lot of bilging to open and close the canals". Then (10 Nov): "make it
   a bit more of a journey ... be more than just the one lock". So a lock is a thing of its own, put
   down wherever a canal steps up or down, each one the same:
   - It joins two stretches of water a step apart: its low side and its high side.
   - She goes in or out only when its water's at the level of the side she's going to or from.
   - Lifting her costs a puzzle: waiting in it to go up, Bilge on the quay pumps it full, a step
     with every clear (a proper go of it: about seven moves' worth, "you should see the line of
     water gradually going up").
   - Water running downhill is free: with her in it to go down, it drains by itself; empty and
     wanted full from the high side, it fills from above by itself (nobody's lifted).
   - Once its water's there, its gates swing open, and she waits for them before she sails on. */

export const LOCK = {
  /** Moves' worth of Bilge to raise her (see Lock.pump). At four it "filled way too quickly" (the
      user, 9 Nov); at sixteen, a third too long for now (10 Nov: "tone down how many times you need
      to get through the locks, just so I can get in there a bit quicker. For now ... Maybe take a
      third off"); at eleven, still heavy once rowing in at the canal's mouth came too (10 Nov: "the
      locks are incredibly [bilge] heavy now because we've got the rowing to get in ... a bit of
      balancing on how much bilging is needed"). */
  WORK: 7,
  /** Seconds it takes to drain down, or to fill from above, by itself. */
  DRAIN: 2,
  /** Its water rising to what's been pumped (see lockRise): at least this much of the lift a
      second, quicker the further it has to go, so each clear lifts it a step you can see. */
  RISE: 0.15,
  /** Seconds the gates take to swing open once its water's where she needs it. */
  GATES: 0.8,
  /** What the pilot reckons a lock costs her, in seconds (src/den-sail.ts weighs a course by the
      clock): going up, a go of Bilge; going down, the water running out and the gates. So she never
      goes through locks she has no need to, and the secret way round is yours to find. */
  COST_UP: 28,
  COST_DOWN: 4,
} as const;

/** Where a lock stands on the sea's board: its square, the way from its low side to its high side
    (0 out to sea, 1 right as seen from the den, 2 back in, 3 left), and the level of its low side
    (the sea's 0; its high side is a level up). Its other two sides are the canal's banks. */
export interface LockSpot { at: [number, number]; up: number; low: number }

/** Across and out for each way (as in src/den-sail.ts). */
const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];

/** A lock's two ends: the squares off its low side and its high side. */
export function ends(s: LockSpot): { low: [number, number]; high: [number, number] } {
  const [c, r] = s.at, d = s.up;
  return { high: [c + DC[d], r + DR[d]], low: [c - DC[d], r - DR[d]] };
}

/** Its water, rising (or falling) towards where it's headed: a step at a time as each clear is
    pumped in, smoothly, never in one jump, and there within a second or so. */
export function lockRise(level: number, to: number, dt: number): number {
  const d = to - level, step = Math.max(LOCK.RISE * dt, Math.abs(d) * Math.min(1, dt * 3));
  return Math.abs(d) <= step ? to : level + Math.sign(d) * step;
}

/** What's in the way of her going through a lock's end: its water to be pumped up by Bilge ('up'),
    to drain down by itself ('down'), or to fill from above by itself ('fill'). */
export type LockNeed = 'up' | 'down' | 'fill';

/** A lock and its water. */
export class Lock {
  /** Its water: 0 at its low side's level, 1 at its high side's. It starts drained. */
  level = 0;
  /** What's been pumped in: the water rises to it (lockRise). */
  fill = 0;
  /** Seconds till its gates are open, once its water's where she needs it. */
  gates = 0;

  constructor(readonly spot: LockSpot) {}

  /** Its water's height, in the sea's levels. */
  height(): number { return this.spot.low + this.level; }

  /** What's in the way of her going between it and water at level `lv`: `into` it from there, or
      out of it to there. Nothing, once its water's at that level. Up to the high side with her in it
      takes Bilge; anything else runs by itself. */
  need(lv: number, into: boolean): LockNeed | null {
    const want = lv - this.spot.low;
    if (Math.abs(this.level - want) <= 1e-6) return null;
    if (want < this.level) return 'down';
    return into ? 'fill' : 'up';
  }

  /** A move's worth of Bilge pumped in, with her waiting in it to go up. */
  pump(w: number) { this.fill = Math.min(1, Math.max(this.fill, this.level) + w / LOCK.WORK); }

  /** Its water rising to what's been pumped in; full, the top gates swing open. */
  rise(dt: number) {
    if (this.fill <= this.level + 1e-9) return;
    this.level = lockRise(this.level, this.fill, dt);
    if (this.level >= 1 - 1e-9) { this.level = this.fill = 1; this.gates = LOCK.GATES; }
  }

  /** Running by itself towards `to` (0 drained, 1 full from above) for up to `dt` seconds: the
      seconds left over once it's there, its gates then swinging open (0 while it's still going). */
  run(to: 0 | 1, dt: number): number {
    const need = Math.abs(to - this.level) * LOCK.DRAIN, use = Math.min(dt, need);
    this.level += Math.sign(to - this.level) * use / LOCK.DRAIN;
    if (to === 0) this.fill = Math.min(this.fill, this.level);
    if (use < need - 1e-12) return 0;
    this.level = this.fill = to;
    this.gates = LOCK.GATES;
    return dt - use;
  }

  /** Its gates swinging open for up to `dt` seconds: the seconds left over once they're open. */
  open(dt: number): number {
    const use = Math.min(dt, this.gates);
    this.gates -= use;
    if (this.gates > 1e-9) return 0;
    this.gates = 0;
    return dt - use;
  }

  /** Which of its ends are open (for drawing): the low side's when its water's down, the high
      side's when it's up. */
  openAt(end: 'low' | 'high'): boolean { return end === 'low' ? this.level < 0.01 : this.level > 0.99; }
}

/** What the pilot reckons going into a lock from water at level `lv` costs (see LOCK.COST_UP). */
export function lockCost(s: LockSpot, lv: number): number { return lv <= s.low ? LOCK.COST_UP : LOCK.COST_DOWN; }
