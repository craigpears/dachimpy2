/* Pirate Den: the sloop race. TypeScript, compiled to js/den-race.js; tested in tests/den-race.test.ts.
   js/den/race.js draws it (the course's land, its buoy and gate, the guns, the whirlpools, the crane, the
   rival) and plays it at sea; its squares are LAY.RACE in src/den-sail.ts (with every other place's, as
   the sea lays them), what's said src/lines/race.ts.

   The user (11 Nov): "maybe we've got enough to start some sloop races ... a winding, snakes and ladders,
   zigzagging kind of course, just with a lot of shortcuts, and each shortcut is a different puzzle, and
   you have to choose either the long way round, just ... without doing anything, and the long way it
   potentially involves running past some cannons", "it should be significant", and of the first draft:
   "this will be out near where Primates Rule is ... We're going to have to go through several
   iterations of this course." And it's a minigame, not a sea battle: the den is "about creative new
   mechanics, and tutorials".

   So: a buoy on the open sea out past Primates Rule; Space by it and the starter counts you down, and
   you're off through the gate in the line of rocks with a rival sloop beside you, the clock running.
   Five legs back and forth and the run home, each pair round the end of a spit of land the long way
   (no puzzle, a reach every leg), or through it by its shortcut, each a puzzle the den already has,
   played by its one module:
   - [A] the gun gap: two guns trained on it, as the imperial checkpoint's are (its numbers, CHECK; each
     a destructible turret, src/den-turret.ts). It's the combo that gets you through: a heavy one (a big
     Sailing chain's boost, or a Vegas rowed each side) rushes her past their marks; a square at a time
     she's a sitting duck, holed (patched by Carpentry: src/den-patch.ts). Or knock them out with her
     own guns, loaded by Gunnery.
   - [B] the headwind gap: the wind blows straight back through it, so no sail gets her through; row it,
     by mirror strokes (src/den-row.ts). Sit idle in it and she drifts back a square at a time (Drift).
   - [C] the whirlpool reef: only a Vegas from its mouth carries her over (src/den-sailing.ts, gustPath);
     less, and a whirlpool has her and its winds carry her back to the mouth (src/den-whirl.ts).
   - [D] the locks: up one, pumped by Bilge, and down the other (src/den-lock.ts).
   - [E] the crane on the neck: built by Carpentry, a part at a time (src/den-crane.ts, the cliff's crane's
     rules put down here), it hauls her over to the run home. The biggest saving, and the most work.
   Each shortcut saves about what a decent player takes on its puzzle (RACE.DECENT, tested), so it pays
   only if it's your puzzle. Then the trade wind home sweeps her up to the finish, by the gate.
   The rival (nameless for now: a real pirate needs the user's pick) sails the long way at a set pace;
   your best time's kept in this browser. */

import { LAY, SAIL, type Helm, type Pose } from './den-sail.js';
import { CHECK } from './den-checkpoint.js';
import { Turret, type TurretEvent } from './den-turret.js';
import { Crane } from './den-crane.js';

const RC = LAY.RACE;
const key = (c: number, r: number) => `${c},${r}`;

export const RACE = {
  /** Seconds the starter counts down. */
  COUNT: 3,
  /** Seconds she can sit idle in the headwind gap before it drifts her back a square. */
  DRIFT: 3,
  /** How near the gun gap (squares, any way) she has to stay for its guns to keep their fight up; out of
      it, they go back to their marks (as the checkpoint's: CHECK.SIGHT). */
  SIGHT: CHECK.SIGHT,
  /** About what a decent player takes on each shortcut's puzzle, in seconds: what each shortcut saves
      over the long way round its bend, sailed (tests/den-race.test.ts holds each to it). A Gunnery load
      or a heavy combo; a few squares rowed by mirror strokes; a Vegas; a lock pumped up by Bilge and
      another drained; three frames of Carpentry. */
  DECENT: { guns: 30, headwind: 30, whirls: 55, locks: 45, crane: 75 },
  /** The rival: seconds to sail the whole course the long way, from the gun. Quicker than you can sail it
      the long way (they know the water), so you beat them on the shortcuts you're good at. */
  RIVAL: { SECS: 235 },
  /** Where your best time's kept, in this browser. */
  STORE: 'den-race-best',
} as const;

/** Which stretch of the course a square's on (0 the first leg, 5 the run home), or -1. */
export function stretchAt(c: number, r: number): number {
  if (c < 1 || c >= SAIL.COLS) return -1;
  return RC.STRETCHES.findIndex((s) => r === s.r || r === s.r + 1);
}
/** By the starting buoy: where Space starts a race. */
export const atStart = (c: number, r: number): boolean => c >= RC.START.c0 && c <= RC.START.c1 && r >= RC.START.r0 && r <= RC.START.r1;
/** Anywhere on the course: behind its line of rocks. */
export const onCourse = (c: number, r: number): boolean => r > RC.R0;
/** The finish: where the trade wind home drops her. */
export const atFinish = (c: number, r: number): boolean => c === RC.FINISH[0] && r === RC.FINISH[1];
const headwind = new Set(RC.HEADWIND.map(([c, r]) => key(c, r)));
/** In the headwind gap [B]. */
export const inHeadwind = (c: number, r: number): boolean => headwind.has(key(c, r));

export type RaceEvent =
  | { kind: 'count'; n: number }
  | { kind: 'go' }
  /** On to the next stretch (1 the second leg ... 5 the run home). */
  | { kind: 'leg'; n: number }
  | { kind: 'rival' }
  | { kind: 'finish'; secs: number; best: boolean; won: boolean }
  /** Back out through the gate once she'd been through it: the race is off. */
  | { kind: 'quit' };

/** The race: counting down, under way (the clock), or done; how far round she's got, in order. */
export class Race {
  state: 'off' | 'count' | 'on' | 'done' = 'off';
  /** Counting down, the seconds left; under way, the clock; done, her time. */
  t = 0;
  /** The furthest stretch she's reached in order (0 the first leg): every one counts, a shortcut's or not. */
  leg = 0;
  rivalHome = false;
  won = false;
  /** Through the gate onto the course, this race. */
  entered = false;
  constructor(public best: number | null = null) {}

  /** Off from the buoy: the count. Not while one's on. */
  start(): boolean {
    if (this.state === 'count' || this.state === 'on') return false;
    Object.assign(this, { state: 'count', t: RACE.COUNT, leg: 0, rivalHome: false, won: false, entered: false });
    return true;
  }
  /** Given up (sailed back out through the gate, say). */
  quit() { this.state = 'off'; }
  /** The clock under way: from the gun, 0 till then. */
  clock(): number { return this.state === 'on' || this.state === 'done' ? this.t : 0; }

  /** Each tick: `at`, her square after it. */
  tick(dt: number, at: { c: number; r: number }): RaceEvent[] {
    const out: RaceEvent[] = [];
    if (this.state === 'count') {
      const was = Math.ceil(this.t - 1e-9);
      this.t -= dt;
      if (this.t <= 1e-9) { this.state = 'on'; this.t = -this.t; out.push({ kind: 'go' }); }
      else if (Math.ceil(this.t - 1e-9) < was) out.push({ kind: 'count', n: Math.ceil(this.t - 1e-9) });
      return out;
    }
    if (this.state !== 'on') return out;
    this.t += dt;
    if (onCourse(at.c, at.r)) this.entered = true;
    else if (this.entered) { this.state = 'off'; out.push({ kind: 'quit' }); return out; }
    if (!this.rivalHome && this.t >= RACE.RIVAL.SECS) { this.rivalHome = true; out.push({ kind: 'rival' }); }
    const s = stretchAt(at.c, at.r);
    if (s === this.leg + 1) { this.leg = s; out.push({ kind: 'leg', n: s }); }
    if (this.leg === RC.STRETCHES.length - 1 && atFinish(at.c, at.r)) {
      this.state = 'done';
      this.won = this.t < RACE.RIVAL.SECS;
      const best = this.best === null || this.t < this.best;
      if (best) this.best = this.t;
      out.push({ kind: 'finish', secs: this.t, best, won: this.won });
    }
    return out;
  }
}

/** A time as the clock shows it: 3:07.4. */
export function clockText(secs: number): string {
  const m = Math.floor(secs / 60), s = secs - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
}
/** A best time as kept in this browser, or null if it's not one. */
export function cleanBest(o: unknown): number | null {
  const n = typeof o === 'string' ? Number(o) : o;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 && n < 3600 ? n : null;
}

/* The rival: the long way round, at a set pace, from beside the buoy. Its route as squares, straight
   runs between them along the middle of each stretch, round every bend; the last up the trade wind
   home, at the wind's pace (SAIL.PUSH a square), the rest at a steady pace that brings it home in
   RACE.RIVAL.SECS. */
const mid = (s: { r: number }) => s.r + 0.5;
const S = RC.STRETCHES;
export const RIVAL_ROUTE: [number, number][] = (() => {
  const out: [number, number][] = [[RC.GATE[1][0], RC.R0 - 1], [RC.GATE[1][0], mid(S[0])]];
  S.forEach((s, i) => {
    const end = s.d === 1 ? SAIL.COLS - 1.5 : i === S.length - 1 ? 0 : 2.5;
    out.push([end, mid(s)]);
    if (i + 1 < S.length) out.push([end, mid(S[i + 1])]);
  });
  out.push([RC.FINISH[0], RC.FINISH[1]]);
  return out;
})();
const seg = RIVAL_ROUTE.slice(1).map((b, i) => { const a = RIVAL_ROUTE[i]; return { a, b, len: Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]) }; });
const laneLen = seg[seg.length - 1].len, sailLen = seg.slice(0, -1).reduce((n, x) => n + x.len, 0);
const pace = (RACE.RIVAL.SECS - laneLen * SAIL.PUSH) / sailLen;
/** Where the rival is `t` seconds from the gun: across, out, and the way it faces (quarter turns). */
export function rivalAt(t: number): { c: number; r: number; a: number; home: boolean } {
  let left = Math.max(0, t);
  for (let i = 0; i < seg.length; i++) {
    const { a, b, len } = seg[i], secs = len * (i === seg.length - 1 ? SAIL.PUSH : pace);
    const dc = Math.sign(b[0] - a[0]), dr = Math.sign(b[1] - a[1]), face = dr > 0 ? 0 : dc > 0 ? 1 : dr < 0 ? 2 : 3;
    if (left < secs || i === seg.length - 1) {
      const u = Math.min(1, left / secs);
      return { c: a[0] + (b[0] - a[0]) * u, r: a[1] + (b[1] - a[1]) * u, a: face, home: left >= secs };
    }
    left -= secs;
  }
  return { c: RC.FINISH[0], r: RC.FINISH[1], a: 2, home: true };
}

/* [A] The gun gap's guns: a destructible turret either side (src/den-turret.ts), set up with the imperial
   checkpoint's numbers (src/den-checkpoint.ts, CHECK), trained on the way in, the gap and the way out.
   As the checkpoint's: off their marks they leave her be till she fires on them (then it's a fight,
   till she's out of their sight), and one that's hit her holds its fire on its marks till she's out
   of sight. */
export type GapEvent = TurretEvent & { gun: number };
export class GunGap {
  readonly guns: Turret[] = RC.GUNS.at.map((at, g) => new Turret({
    at, marks: RC.GUNS.marks[g], alert: false, reach: CHECK.REACH,
    flight: CHECK.AIMED, reload: CHECK.AIMED_RELOAD, markFlight: CHECK.FLIGHT, markReload: CHECK.RELOAD,
    quiet: CHECK.QUIET, wreck: CHECK.WRECK,
  }));
  scored = this.guns.map(() => false);
  /** The gun on this square, or -1. */
  gunAt(c: number, r: number): number { return this.guns.findIndex((t) => t.at[0] === c && t.at[1] === r); }
  /** Her shot came down on (c, r): a hit on a gun (see Turret.hit), it's a fight now; null if it isn't one. */
  shot(c: number, r: number): { gun: number; did: 'quiet' | 'wrecked' | null; first: boolean } | null {
    const g = this.gunAt(c, r);
    if (g < 0) return null;
    const first = !this.guns.some((t) => t.roused);
    for (const t of this.guns) t.rouse();
    return { gun: g, did: this.guns[g].hit(), first };
  }
  /** Both wrecked: the gap's safe. */
  silenced(): boolean { return this.guns.every((t) => t.wrecked); }
  /** `ship`: where she is (Helm.now), or null when they shouldn't fire on her (Helm.spared). */
  tick(dt: number, ship: { c: number; r: number } | null, at: { c: number; r: number }): GapEvent[] {
    const [gc, gr] = RC.GUNS.gap;
    if (Math.max(Math.abs(at.c - gc), Math.abs(at.r - gr)) > RACE.SIGHT + 1) {
      this.scored.fill(false);
      for (const t of this.guns) t.roused = false;
    }
    return this.guns.flatMap((t, gun) => t.tick(dt, this.scored[gun] && !t.roused ? null : ship).map((e) => {
      if (e.kind === 'land' && e.hit) this.scored[gun] = true;
      return { ...e, gun };
    }));
  }
}

/* [B] Drift: sat idle in the headwind gap (nothing being sailed or rowed), the wind blows her back a
   square every RACE.DRIFT seconds, out of it the way she came in. */
export class Drift {
  idle = 0;
  /** Each tick: the square it blows her back to, if it does (Helm.gust plays it). */
  tick(dt: number, h: Helm): Pose | null {
    const p = h.pose, still = h.slot < 0 && !h.cur && !h.gusts.length && !h.strokes.length && !h.dazed();
    if (!inHeadwind(p.c, p.r) || !still) { this.idle = 0; return null; }
    this.idle += dt;
    if (this.idle < RACE.DRIFT) return null;
    this.idle = 0;
    return { c: p.c, r: p.r - 1, d: p.d };
  }
}

/** [E] The crane on the neck: the cliff's crane's rules (src/den-crane.ts), its ledge here: she lies
    alongside on the last leg, and it sets her down on the run home (LAY.RACE.CRANE.TO). Once built it
    stays built, race after race. */
export const neckCrane = (random: () => number = Math.random): Crane => new Crane(random, [...RC.CRANE.LEDGE] as [number, number]);
