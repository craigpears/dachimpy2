/* Pirate Den: the sloop race's field, two to four racers on one course. TypeScript, compiled to
   js/den-racers.js; tested in tests/den-racers.test.ts. The race's own rules are src/den-race.ts (its
   Race, the single-player race js/den/race.js plays, keeps its field here: you racer 0, the rival a bot
   racer); the headless simulation that races bots on it is src/race-sim.ts.

   The user (11 Nov): "start adding multiple players to this first, even if it's like 2 to 4 players with
   some bots"; "I definitely want to be able to shoot other racers. That's absolutely part of this"; "If
   you got through it first, we get through it first"; and of the lead: "Some can be safe, like ... the
   locks and the crane ... So I don't want the leaders not be able to puzzle at all."

   So the field, knowing nothing of how a racer's moved (by the helm, a set route, or the simulation):
   - Each racer's pose, the stretch she's reached in order (every one counts, a shortcut's or not, as the
     race's), and what she's doing: sailing, waiting her turn at a lock or the crane, puzzling at a
     shortcut, dazed after a hit, carried (by a gust, the crane, through the starlit door's tunnel: out
     of anyone's reach while it lasts), or finished; her finish time and place.
   - First come, first served (SPOTS): the up lock, the down lock and the crane are one racer's at a time;
     the next to come waits her turn, in the order they came.
   - Her guns: a broadside out of either side, RANGE squares (SAIL.RANGE, as everywhere at sea), stopped
     by the first rock or land (broadside, src/den-sail.ts). Every racer starts with FIELD.SHOTS loaded
     (more by Gunnery, up to FIELD.HOLD). A hit holes her: she's dazed, still, till she's patched by
     Carpentry (src/den-patch.ts), as any hit at sea; she's never knocked out. A dazed racer can't be hit
     again till she's patched (Helm.hit).
   - Sheltered (SHELTER): in a lock's chamber or the canal between its walls, or alongside the crane's
     ledge behind the neck, nobody's broadside reaches her. Everywhere else on the course she's in the
     open: stopped there, she's a sitting duck for whoever comes by. */

import { LAY, SAIL, broadside, type Pose, type Sea, type Side } from './den-sail.js';

const RC = LAY.RACE;
const key = (c: number, r: number) => `${c},${r}`;

/** Which stretch of the course a square's on (0 the first leg, 5 the run home), or -1. (src/den-race.ts
    gives these on, as the course's own.) */
export function stretchAt(c: number, r: number): number {
  if (c < 1 || c >= SAIL.COLS) return -1;
  return RC.STRETCHES.findIndex((s) => r === s.r || r === s.r + 1);
}
/** The finish: where the trade wind home drops her. */
export const atFinish = (c: number, r: number): boolean => c === RC.FINISH[0] && r === RC.FINISH[1];

/** A place on the course that's one racer's at a time. */
export type Spot = 'lock-up' | 'lock-down' | 'crane';

export const FIELD = {
  /** Racers on one course. */
  LEAST: 2,
  MOST: 4,
  /** Shots every racer starts with, loaded (the user, 11 Nov: "a gun or two loaded"), and the most she
      holds: her Gunnery board's four guns, two a side (src/den-guns.ts), counted together here. */
  SHOTS: 2,
  HOLD: 4,
  /** The squares that are one racer's at a time: each lock's chamber, and the crane's ledge. */
  SPOTS: { 'lock-up': RC.LOCKS[0].at, 'lock-down': RC.LOCKS[1].at, crane: RC.CRANE.LEDGE } as Record<Spot, [number, number]>,
} as const;

/** Sheltered squares: nobody's broadside reaches a racer on one (the locks' chambers and the canal
    between them, the crane's ledge). */
export const SHELTER: ReadonlySet<string> = new Set([...RC.LOCKS.map((l) => l.at), ...RC.POUND.at, RC.CRANE.LEDGE].map(([c, r]) => key(c, r)));
export const sheltered = (c: number, r: number): boolean => SHELTER.has(key(Math.round(c), Math.round(r)));

export type RacerState = 'sailing' | 'waiting' | 'puzzling' | 'dazed' | 'carried' | 'finished';

export interface Racer {
  /** Her number in the field (0 is you, in the den's race). */
  i: number;
  name: string;
  pose: Pose;
  /** The furthest stretch she's reached in order (0 the first leg, 5 the run home). */
  leg: number;
  state: RacerState;
  /** The spot she's at (waiting her turn or holding it), if any. */
  spot: Spot | null;
  shots: number;
  /** Hits she's taken, and hits she's scored on other racers. */
  hits: number;
  scored: number;
  /** Seconds from the gun to the finish, and her place (1 first), once she's home. */
  time: number | null;
  place: number | null;
}

export type FieldEvent =
  | { kind: 'count'; n: number }
  | { kind: 'go' }
  | { kind: 'leg'; racer: number; n: number }
  | { kind: 'finish'; racer: number; secs: number; place: number }
  /** A broadside: who fired, the squares it went over, and who it hit (-1 nobody). */
  | { kind: 'shot'; racer: number; cells: [number, number][]; hit: number }
  /** A spot's free and it's her turn now. */
  | { kind: 'turn'; racer: number; spot: Spot };

/** What a racer's doing sets whether a shot can hit her: not once she's home, nor while she's carried,
    nor dazed already (patching), nor sheltered. */
export function hittable(r: Racer): boolean {
  return r.state !== 'finished' && r.state !== 'carried' && r.state !== 'dazed' && !sheltered(r.pose.c, r.pose.r);
}

export class Field {
  readonly racers: Racer[];
  state: 'off' | 'count' | 'on' | 'done' = 'off';
  /** Counting down, the seconds left; under way, the clock. */
  t = 0;
  /** Racers home, in the order they finished. */
  order: number[] = [];
  /** Who holds each spot, and who's waiting for it, in the order they came. */
  holds = new Map<Spot, number>();
  queues = new Map<Spot, number[]>();

  /** `names`: the racers, two to four; `count`, the starter's seconds (0: off at once); `sea`, for the
      broadsides (rocks and land stop a shot): any sea with the race's course laid. */
  constructor(names: string[], public sea: Sea | null = null, public count = 3) {
    if (names.length < FIELD.LEAST || names.length > FIELD.MOST) throw new Error(`a race is ${FIELD.LEAST} to ${FIELD.MOST} racers`);
    this.racers = names.map((name, i) => ({
      i, name, pose: { c: RC.BUOY[0], r: RC.BUOY[1], d: 0 }, leg: 0, state: 'sailing' as RacerState, spot: null,
      shots: FIELD.SHOTS, hits: 0, scored: 0, time: null, place: null,
    }));
  }

  /** Off from the buoy: the count (or straight off with no count). */
  start(): FieldEvent[] {
    this.state = this.count > 0 ? 'count' : 'on';
    this.t = this.count;
    this.order = []; this.holds.clear(); this.queues.clear();
    for (const r of this.racers) Object.assign(r, { leg: 0, state: 'sailing', spot: null, shots: FIELD.SHOTS, hits: 0, scored: 0, time: null, place: null });
    if (this.state === 'on') { this.t = 0; return [{ kind: 'go' }]; }
    return [];
  }
  /** The clock under way: from the gun, 0 till then. */
  clock(): number { return this.state === 'on' || this.state === 'done' ? this.t : 0; }

  /** The clock: the count, then the race. */
  tick(dt: number): FieldEvent[] {
    if (this.state === 'count') {
      const was = Math.ceil(this.t - 1e-9);
      this.t -= dt;
      if (this.t <= 1e-9) { this.state = 'on'; this.t = -this.t; return [{ kind: 'go' }]; }
      if (Math.ceil(this.t - 1e-9) < was) return [{ kind: 'count', n: Math.ceil(this.t - 1e-9) }];
      return [];
    }
    if (this.state === 'on') this.t += dt;
    return [];
  }

  /** Racer `i` is at `pose` now: the stretch she's reached, in order, and home if she's at the finish
      having been round. */
  move(i: number, pose: Pose): FieldEvent[] {
    const r = this.racers[i];
    if (r.state === 'finished') return [];
    r.pose = { ...pose };
    if (this.state !== 'on') return [];
    const out: FieldEvent[] = [];
    const c = Math.round(pose.c), y = Math.round(pose.r), s = stretchAt(c, y);
    if (s === r.leg + 1) { r.leg = s; out.push({ kind: 'leg', racer: i, n: s }); }
    if (r.leg === RC.STRETCHES.length - 1 && atFinish(c, y)) out.push(...this.home(i));
    return out;
  }
  /** Carried on under the course (the starlit door's tunnel) from stretch `from` to `to`: counted as
      reached in order, if she'd reached `from`. */
  under(i: number, from: number, to: number): FieldEvent[] {
    const r = this.racers[i];
    if (this.state !== 'on' || r.leg !== from || to <= from) return [];
    r.leg = to;
    return [{ kind: 'leg', racer: i, n: to }];
  }
  /** She's home now (at `secs` from the gun, or the clock): her time and place. */
  home(i: number, secs = this.t): FieldEvent[] {
    const r = this.racers[i];
    if (r.state === 'finished' || this.state !== 'on') return [];
    for (const s of [...this.holds.keys()]) if (this.holds.get(s) === i) this.release(i, s);
    r.state = 'finished'; r.spot = null; r.time = secs;
    this.order.push(i);
    this.order.sort((a, b) => this.racers[a].time! - this.racers[b].time!);
    this.order.forEach((j, n) => { this.racers[j].place = n + 1; });
    if (this.order.length === this.racers.length) this.state = 'done';
    return [{ kind: 'finish', racer: i, secs, place: r.place! }];
  }

  /** Racer `i` comes to a spot: hers if it's free (or hers already), or she waits her turn, after
      anyone already waiting. */
  claim(i: number, spot: Spot): 'yours' | 'wait' {
    const r = this.racers[i], held = this.holds.get(spot);
    if (held === i) return 'yours';
    if (held === undefined) {
      this.holds.set(spot, i);
      r.spot = spot;
      this.queues.set(spot, (this.queues.get(spot) ?? []).filter((j) => j !== i));
      return 'yours';
    }
    const q = this.queues.get(spot) ?? [];
    if (!q.includes(i)) q.push(i);
    this.queues.set(spot, q);
    r.spot = spot;
    r.state = 'waiting';
    return 'wait';
  }
  /** Racer `i` gives up waiting for a spot (she'll go the long way). */
  leave(i: number, spot: Spot) {
    this.queues.set(spot, (this.queues.get(spot) ?? []).filter((j) => j !== i));
    const r = this.racers[i];
    if (r.spot === spot && this.holds.get(spot) !== i) { r.spot = null; if (r.state === 'waiting') r.state = 'sailing'; }
  }
  /** Racer `i` is done with a spot: it's the next in line's, if anyone's waiting. */
  release(i: number, spot: Spot): FieldEvent[] {
    if (this.holds.get(spot) !== i) return [];
    this.holds.delete(spot);
    if (this.racers[i].spot === spot) this.racers[i].spot = null;
    const q = this.queues.get(spot) ?? [];
    const next = q.shift();
    if (next === undefined) return [];
    this.holds.set(spot, next);
    const n = this.racers[next];
    n.spot = spot;
    if (n.state === 'waiting') n.state = 'puzzling';
    return [{ kind: 'turn', racer: next, spot }];
  }
  /** Who holds a spot (-1 nobody). */
  holder(spot: Spot): number { return this.holds.get(spot) ?? -1; }

  /** Who a broadside out of `side` from racer `i` would hit now, if she fired: the squares it'd go over
      (stopped by rock or land) and the first racer on one of them who can be hit (-1 nobody). */
  aim(i: number, side: Side): { cells: [number, number][]; hit: number } {
    const r = this.racers[i], at = { c: r.pose.c, r: r.pose.r, a: r.pose.d };
    const cells = this.sea ? broadside(this.sea, at, side).cells : straight(at, side);
    for (const [c, y] of cells) {
      if (this.sea?.isRock(c, y)) break;
      const t = this.racers.find((o) => o.i !== i && hittable(o) && Math.round(o.pose.c) === c && Math.round(o.pose.r) === y);
      if (t) return { cells, hit: t.i };
    }
    return { cells, hit: -1 };
  }
  /** Racer `i` fires out of `side`: a shot spent (none, no shot: null), and whoever it hits is holed,
      dazed till she's patched. `lands`: false when it's fired too soon or too late as she goes by (a
      broadside's timing is the shooter's: the simulation's aim), so it hits nobody. */
  fire(i: number, side: Side, lands = true): Extract<FieldEvent, { kind: 'shot' }> | null {
    const r = this.racers[i];
    if (r.shots <= 0 || r.state === 'finished' || this.state !== 'on') return null;
    r.shots--;
    const aim = this.aim(i, side), hit = lands ? aim.hit : -1;
    if (hit >= 0) this.hit(hit, i);
    return { kind: 'shot', racer: i, cells: aim.cells, hit };
  }
  /** Racer `i` is hit (by racer `by`, or a gun: -1): dazed till she's patched. Not if she can't be. */
  hit(i: number, by = -1): boolean {
    const t = this.racers[i];
    if (!hittable(t)) return false;
    t.hits++;
    t.state = 'dazed';
    if (by >= 0) this.racers[by].scored++;
    return true;
  }
  /** Patched (Carpentry): she's under way again (or back at her puzzle, if she was at a spot). */
  patched(i: number) {
    const r = this.racers[i];
    if (r.state === 'dazed') r.state = r.spot && this.holds.get(r.spot) === i ? 'puzzling' : 'sailing';
  }
  /** Shots loaded by Gunnery: up to what she holds. */
  load(i: number, n = 1) { const r = this.racers[i]; r.shots = Math.min(FIELD.HOLD, r.shots + n); }
}

/** A broadside's squares with no sea to stop it. */
function straight(at: { c: number; r: number; a: number }, side: Side): [number, number][] {
  const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
  const d = (((Math.round(at.a) + (side === 'R' ? 1 : 3)) % 4) + 4) % 4, c0 = Math.round(at.c), r0 = Math.round(at.r);
  return Array.from({ length: SAIL.RANGE }, (_, k): [number, number] => [c0 + DC[d] * (k + 1), r0 + DR[d] * (k + 1)]);
}
