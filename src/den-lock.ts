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
  /* Its water and its gates are a beat, not a wait (the user, 12 Nov, racing through the race's locks:
     "I was spending just as much time waiting for the ship to go forward, and it was like, come on, come
     on ... there should be a bit of an animation, but, like, it shouldn't feel like you're losing the
     race because you're waiting on the animation"). They were 2 s to drain or fill, 0.8 s for the gates,
     and the last of a pumped lift easing in over a second and more. */
  /** Seconds it takes to drain down, or to fill from above, by itself. */
  DRAIN: 0.8,
  /** Its water rising to what's been pumped (see lockRise): at least this much of the lift a
      second, quicker the further it has to go (RISE_K of what's left a second), so each clear lifts it
      a step you can see, and it's there in a moment. */
  RISE: 0.6,
  RISE_K: 7,
  /** Seconds the gates take to swing open once its water's where she needs it. */
  GATES: 0.4,
  /** What the pilot reckons a lock costs her, in seconds (src/den-sail.ts weighs a course by the
      clock): going up, a go of Bilge; going down, the water running out and the gates. So she never
      goes through locks she has no need to, and the secret way round is yours to find. */
  COST_UP: 28,
  COST_DOWN: 2,
} as const;

/** Where a lock stands on the sea's board: its square, the way from its low side to its high side
    (0 out to sea, 1 right as seen from the den, 2 back in, 3 left), and the level of its low side
    (the sea's 0; its high side is a level up). Its other two sides are the canal's banks. */
export interface LockSpot {
  at: [number, number]; up: number; low: number;
  /** Moves' worth of Bilge to raise her in it, if not LOCK.WORK (a course from the race's editor, 12 Nov:
      src/race-course.ts, clears). */
  work?: number;
}

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
  const d = to - level, step = Math.max(LOCK.RISE * dt, Math.abs(d) * Math.min(1, dt * LOCK.RISE_K));
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
  pump(w: number) { this.fill = Math.min(1, Math.max(this.fill, this.level) + w / (this.spot.work ?? LOCK.WORK)); }

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

  /** Set to `level` (0 drained, 1 full), still, its gates at rest: ready for whoever comes next (the
      race's locks, for each new race: src/den-race.ts, readyLocks). */
  set(level: 0 | 1) { this.level = this.fill = level; this.gates = 0; }

  /** Which of its ends are open (for drawing): the low side's when its water's down, the high
      side's when it's up. */
  openAt(end: 'low' | 'high'): boolean { return end === 'low' ? this.level < 0.01 : this.level > 0.99; }
}

/** What the pilot reckons going into a lock from water at level `lv` costs (see LOCK.COST_UP). */
export function lockCost(s: LockSpot, lv: number): number { return lv <= s.low ? LOCK.COST_UP : LOCK.COST_DOWN; }

/* Where a lock's gates stand, and her clear of them (the user, 10 Nov: "the front part of the ship
   is sticking out of the gate when the [lock] is draining"). She's longer than a square (js/den/
   sea.js: her stern 2.2 behind her middle, her bowsprit's tip 3.3 ahead), so a lock's chamber runs
   on past its square each way, and its gates stand out in the squares either side. Both pairs swing
   open toward its high side, as a real lock's do: the high pair out of the chamber, the low pair
   into it. Her bow and stern stay clear of both pairs, shut and swinging, while she's in it:
   - Its high gates stand GATE_HIGH out from its middle, past her bowsprit's tip.
   - Its low gates stand a whole square out, at the middle of the square below: swinging into the
     chamber, a pair any nearer swept through her stern (going up) or brushed her bow (going down).
   - Two locks a square apart (the two down through the checkpoint's headland) are a staircase: the
     upper one's low gates are the lower one's high gates, one pair between the two chambers.
   - Waiting outside a lock for its water (to fill from above, or drain), or simply lying off it,
     she lies back from its shut gates, her bow (or stern) clear of them and of their swing, and
     glides on in as they open (lieClear). (Before, she waited on the square beside it, her bow
     through its gates.) */
/** Her reach along her length from her middle, as js/den/sea.js draws her: her bowsprit's tip
    ahead, her stern behind; and her stern's half-width at its corners. */
export const HER = { BOW: 3.3, STERN: 2.2, STERN_HALF: 1.0 } as const;
export const GATES = {
  /** A lock's high gates, metres out from its middle: past her bowsprit's tip as she lies in it. */
  HIGH: 3.5,
  /** A gate's thickness. */
  LEAF: 0.28,
  /** How far she lies back from a shut gate's face. */
  CLEAR: 0.3,
  /** How far from her middle a gate's hinge is, across: half the chamber's width, a leaf's length. */
  HALF: 2,
} as const;

/** Where a lock's gates stand, in metres out from its middle (a square `cell` long): its low pair and
    its high pair; and the lock whose low gates its high ones are, if it's the lower of a staircase
    (then it has no high gates of its own). */
export function gatesOf(s: LockSpot, all: readonly LockSpot[], cell: number): { low: number; high: number; above: number } {
  const [hc, hr] = ends(s).high;
  const above = all.findIndex((o) => o !== s && ends(o).low[0] === hc && ends(o).low[1] === hr);
  return { low: cell, high: above >= 0 ? cell : GATES.HIGH, above };
}

/** Where she lies along a lock, in metres from its middle (+ toward its high side): `along` where
    her helm has her, `facing` +1 with her bow toward its high side or -1 toward its low, `at` where
    its gates stand (gatesOf), and `open` how far each pair has swung open (0 shut, 1 open). Outside
    it, she keeps her nearer end CLEAR of a shut pair's face, and is let on in only once they're well
    open (past 60%, by when they've swung clear of her), smoothly. In it, she fits as she is. On a
    staircase's gates (where her helm has her between its two chambers), she's outside the one her
    bow's toward. */
export function lieClear(along: number, facing: 1 | -1, at: { low: number; high: number }, open: { low: number; high: number }): number {
  const toHigh = facing > 0 ? HER.BOW : HER.STERN, toLow = facing > 0 ? HER.STERN : HER.BOW;
  const pad = GATES.LEAF / 2 + GATES.CLEAR;
  const give = (u: number) => { const k = Math.max(0, Math.min(1, (u - 0.6) / 0.4)); return k * k * (3 - 2 * k) * 4 * at.low; };
  const eps = 1e-6;
  if (along > at.high - (facing < 0 ? eps : -eps)) return Math.max(along, at.high + pad + toLow - give(open.high));
  if (along < -at.low + (facing > 0 ? eps : -eps)) return Math.min(along, -at.low - pad - toHigh + give(open.low));
  return along;
}

/** How far each pair of a lock's gates has swung open, 0 shut to 1 open: `end` of lock `i`. */
export type GateOpen = (i: number, end: 'low' | 'high') => number;

/** Where she's drawn among the locks (`spots`, on a board of `cell`-long squares): her helm's
    pose `p` (squares; heading `a`: 0 out to sea, 1 right, 2 back in, 3 left), lying clear of every
    lock's shut gates she's outside of (lieClear). A staircase's shared pair is the upper lock's low
    gates; `open` answers for them either way. */
export function lieAmong<P extends { c: number; r: number; a: number }>(p: P, spots: readonly LockSpot[], cell: number, open: GateOpen): P {
  const d = ((Math.round(p.a) % 4) + 4) % 4;
  spots.forEach((s, i) => {
    const [c, r] = s.at, up = s.up, dc = p.c - c, dr = p.r - r;
    const along = (dc * DC[up] + dr * DR[up]) * cell, across = dc * DR[up] - dr * DC[up];
    if (Math.abs(across) > 0.5 || Math.abs(along) > 3 * cell || d % 2 !== up % 2) return;
    const at = gatesOf(s, spots, cell);
    const to = lieClear(along, d === up ? 1 : -1, at, { low: open(i, 'low'), high: at.above >= 0 ? open(at.above, 'low') : open(i, 'high') });
    if (to !== along) p = { ...p, c: p.c + (to - along) / cell * DC[up], r: p.r + (to - along) / cell * DR[up] };
  });
  return p;
}

/* Where a lock's quay Bilge board lies, and which way it's turned (the user, playtesting, 10 Nov:
   "[pulling] in[to] the locks and the [nose], so you can't see the [bilging] puzzle. Obviously, it
   should be orientated to the ship or the dock or whatever", and "You can see some of it, but I
   think some of it's in"). Every lock had its board laid the same: on the bank beside it, nudged a
   metre toward its high side, its top row out to sea, seen from the den side. Coming back up the two
   locks through the headland she faces in, so the view had her bow coming at you; and at the lower
   of the two, its quay only a square long between the sea and the staircase's higher bank, half the
   board was sunk into that bank. So, for any lock:
   - Its top row is toward the lock's high side, the way she faces waiting to be pumped up: seen from
     behind her (js/den.js turns the view to it), it reads the right way up, her bow ahead, never
     coming at you.
   - It lies wholly on its quay's own flat ground: the bank square beside the lock, and the next one
     up or down the canal if that's at the same height (never the sea, nor a higher or lower bank).
     Nudged toward its high side as ever, room allowing; and where there's only the one square, its
     squares a little smaller so it fits (the view comes in to suit, so it looks the same). */
export const QUAY = {
  /** A square of the board, in metres, at most (as the first lock's always were). */
  SQ: 0.45,
  /** From the chamber's edge out to the board's inner edge: the pier, and room for the pump. */
  IN: 0.88,
  /** Kept in from the sea's edge or a step in the bank. */
  EDGE: 0.1,
  /** Nudged toward the lock's high side, room allowing. */
  NUDGE: 1,
} as const;

/** Where a lock's quay board lies: on the bank that way (`side`, a way as `up`), `across` metres out
    from the lock's middle and `along` metres toward its high side; its squares `sq` metres; its top
    row toward `face` (a way). */
export interface QuayBoard { side: number; across: number; along: number; sq: number; face: number }

/** Where lock `s`'s quay board lies (on `cell`-metre squares), a board `w` by `h` squares (its frame
    in): on its bank toward the den, or on its right-hand bank if it runs out to sea, wholly on the
    quay's own flat ground. `top(c, r)` is the height of the high ground on a square, or null where
    there's none (water). */
export function quayOf(s: LockSpot, cell: number, w: number, h: number, top: (c: number, r: number) => number | null): QuayBoard {
  const side = s.up % 2 ? 2 : 1, [c, r] = s.at;
  const qc = c + DC[side], qr = r + DR[side], own = top(qc, qr);
  const same = (d: number) => { const t = top(qc + d * DC[s.up], qr + d * DR[s.up]); return t !== null && own !== null && Math.abs(t - own) < 1e-6; };
  // The flat ground along the bank, in metres from the lock's middle toward its high side.
  const lo = same(-1) ? -1.5 * cell : -cell / 2, hi = same(1) ? 1.5 * cell : cell / 2;
  const sq = Math.min(QUAY.SQ, (hi - lo - 2 * QUAY.EDGE) / h, (cell - QUAY.IN - QUAY.EDGE) / w);
  const reach = h * sq / 2;
  const along = Math.max(lo + QUAY.EDGE + reach, Math.min(hi - QUAY.EDGE - reach, QUAY.NUDGE));
  return { side, across: cell / 2 + QUAY.IN + w * sq / 2, along, sq, face: s.up };
}
