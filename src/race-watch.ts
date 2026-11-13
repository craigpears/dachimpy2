/* Pirate Den: the sloop race, watched. TypeScript, compiled to js/race-watch.js; tested in
   tests/race-watch.test.ts. js/den/race-watch.js draws it (den.html?at=race-watch): the course and its
   sloops as the race has them, a free camera, a bar saying who you're watching and what she's doing, and
   her board on screen as she plays it (js/den/watch-boards.js).

   The user (12 Nov): a link to watch four bots race, to judge how realistic it looks, and a spectator
   mode: "I can see the puzzle, as I said, the puzzling, the just move around free camera, including
   jumping between watching each person in the race." And before that (RACE.md §10), of watching: "that
   would go down to the detail of the actual puzzling, because that's kind of what you're watching."

   So:
   - Four race with no player in it (WATCHED, src/den-rivals.ts: Kikkit, Tzz, Dalnoth with Umami aboard,
     and Gravee up the locks), each sailed by the simulation's own bots (src/race-sim.ts, `sail`) on a
     field of their own, from their spots on the line, after the starter's count: the same race, and the
     same balance, as the one you race them in. A fresh seed each race (N: another).
   - Who you're watching (`follow`): nobody (the free camera), or a racer, 1 to 4, Tab the next.
   - What she's doing, in plain words (`doing`): "pumping the lock", "building the crane", "sailing the
     long way"; her place and her leg (`bar`).
   - Her board while she puzzles (`board`): which puzzle it is and why (Sailing on the pilot, a Vegas at
     the whirlpools' mouth, Bilge at the lock...), with the seconds it has left and in all, as the
     simulation draws them; and its moves paced to those (`Pacer`), so the race's balance holds and the
     board is what's being played. The moves are the puzzles' own bots' (src/sail-bots.ts and the rest),
     played on the puzzles' own rules, drawn by their own looks.
   - Under way, her Sailing board is the simulation's own (`sailor`: src/race-sailor.ts, played on a real
     board here), so every clear you see on it is the gust that carries her sloop on, there and then (12 Nov:
     "if you do a Double or Triple, even just in a normal lane, it's supposed to speed you along a bit"). Her
     sloop sails square to square, a move at a time, as yours does (src/race-sim.ts, `motion`).
   - The free camera's sums (`FreeCam`): moved, turned, tilted and zoomed, held over the course.
   - The starlit door stays a secret: nobody in the field takes it (the test checks), and nothing here
     names it. */

import { LAY } from './den-sail.js';
import { RACE, clockText } from './den-race.js';
import { Field, FIELD, courseSea, type FieldEvent } from './den-racers.js';
import { WATCHED, type Rival } from './den-rivals.js';
import { sail, route, style, SIM, type BotInfo, type CutId, type SimRun, type Skill } from './race-sim.js';
import { SAILOR, type Sailor } from './race-sailor.js';
import { cutsOf, optionOf, type Plan, type PlanChange } from './race-plan.js';
import { LOCK } from './den-lock.js';
import { PATCH } from './den-patch.js';

const RC = LAY.RACE;

export const WATCH = {
  /** Seconds a racer's change of plan is said on the bar. */
  CHANGED: 8,
  /** Seconds between the drops of a Sailing board, by skill: the racers' own pace (src/race-sailor.ts). Under
      way it's her very board (the simulation's sailor, `sailor`), at her own pace; this is a board's at a stop. */
  DROP: SAILOR.DROP as Record<Skill, number>,
  /** A Vegas shown at the whirlpools' mouth: the drops of a recorded one (src/sail-bots.ts, VEGAS_GAMES)
      played in the time she has, about this many seconds a drop, never fewer than MIN of them. */
  VEGAS_DROP: 2.4,
  VEGAS_MIN: 6,
  /** Seconds between moves at the other boards: a Bilge swap, a turn of Foraging, a chalk mark at the
      guns (or a look whether one's wanted), a stroke of the oars. Carpentry is a piece at a time, paced
      to the patch's or the crane's pieces. */
  BILGE: 1.6,
  FORAGE: 1.8,
  GUNS: 1.4,
  ROW: 1.5,
  /** The free camera: metres a second it moves, radians a second it turns (keys); its tilt (radians
      down from level) and distance (metres) to begin with, and their bounds. */
  CAM: { SPEED: 26, TURN: 1.6, TILT: 0.85, DIST: 46, TILT_MIN: 0.25, TILT_MAX: 1.45, DIST_MIN: 9, DIST_MAX: 75 },
};

/** A racer's board, while she puzzles: which puzzle it is, and why (what the bar says of it). */
export type Puzzle = 'sailing' | 'rowing' | 'bilge' | 'foraging' | 'gunnery' | 'carpentry';
export type Why =
  | 'pilot' | 'double' | 'triple' | 'vegas'
  | 'row' | 'lock' | 'barrier' | 'load' | 'crane' | 'patch';
export interface BoardNow {
  puzzle: Puzzle;
  why: Why;
  /** Seconds left at it, and in all (the simulation's: Infinity on the pilot, which never ends). */
  left: number;
  full: number;
  /** Goes at a Vegas so far (0 the first). */
  tries: number;
}

/** What she's puzzling at just now, from what the simulation has her doing; none, when she's under way
    with nothing to play but the pilot (she still Sails on it: a board), waiting, carried, or home. */
export function boardOf(x: BotInfo | null): BoardNow | null {
  if (!x) return null;
  const at = (puzzle: Puzzle, why: Why, left = x.work, full = x.full): BoardNow => ({ puzzle, why, left, full, tries: x.tries });
  if (x.mode === 'daze') return at('carpentry', 'patch', x.daze, PATCH.PIECES * SIM.PUZZLE.piece);
  if (x.mode === 'stop') {
    switch (x.cut) {
      case 'guns': return at('gunnery', 'load');
      case 'headwind': return at('rowing', 'row');
      case 'double': return at('sailing', 'double');
      case 'triple': return at('sailing', 'triple');
      case 'whirls': return at('sailing', 'vegas');
      case 'forage': return at('foraging', 'barrier');
      case 'locks': return at('bilge', 'lock');
      case 'crane': return at('carpentry', 'crane');
      default: return null;   // (the starlit door: never, it's a secret)
    }
  }
  if (x.mode === 'sail') {
    const m = x.move;
    if (m?.kind === 'load') return at('gunnery', 'load', m.left, SIM.PUZZLE.load);
    if (m?.kind === 'hop') return at('sailing', m.id === 'triple' ? 'triple' : 'double', m.left, SIM.PUZZLE[m.id === 'triple' ? 'triple' : 'double']);
    return at('sailing', 'pilot', Infinity, Infinity);
  }
  return null;
}

/** Seconds between moves on a board, as the race has her play it: Sailing's drops by her skill at it
    (a Vegas's in the time she has); a piece of Carpentry in a piece's time (SIM.PUZZLE.piece, her skill's
    share of it); the rest by WATCH's own beat. */
export function paceOf(b: BoardNow, skill: Skill): number {
  switch (b.puzzle) {
    case 'sailing': return b.why === 'vegas' ? WATCH.VEGAS_DROP : WATCH.DROP[skill];
    case 'bilge': return Math.min(WATCH.BILGE, b.full / LOCK.WORK);
    case 'foraging': return WATCH.FORAGE;
    case 'gunnery': return WATCH.GUNS;
    case 'rowing': return WATCH.ROW;
    case 'carpentry': return SIM.PUZZLE.piece * SIM.SKILL[skill];
  }
}

/** How many of a recorded Vegas's drops to play in `secs` (the rest laid already): about a drop every
    WATCH.VEGAS_DROP seconds, at least WATCH.VEGAS_MIN, at most the game's own. */
export function vegasDrops(secs: number, of: number): number {
  return Math.max(Math.min(of, WATCH.VEGAS_MIN), Math.min(of, Math.round(secs / WATCH.VEGAS_DROP)));
}

/** A beat for a board's moves: due every `every` seconds; or, with `left` seconds to go and `moves`
    still to make, spread evenly over them (the last one as time runs out). */
export class Pacer {
  t = 0;
  constructor(public every: number) {}
  /** Moves due after `dt` seconds (0 or more: a slow frame can owe two). */
  tick(dt: number): number {
    this.t += dt;
    let n = 0;
    while (this.t >= this.every && n < 4) { this.t -= this.every; n++; }
    if (n === 4) this.t = 0;
    return n;
  }
  /** Spread `moves` over the `left` seconds still to go. */
  spread(left: number, moves: number) { if (moves > 0 && Number.isFinite(left)) this.every = Math.max(0.15, left / moves); }
}

/* ---- What she's doing, in plain words ---- */

const WHERE: Record<CutId, string> = {
  guns: 'the gun gap', wreck: 'the old wreck', headwind: 'the headwind gap', double: 'the Double\'s gap', whirls: 'the whirlpools', rocks: 'the rocks',
  forage: 'the barrier of driftwood', locks: 'the locks', crane: 'the crane', triple: 'the Triple\'s gap', zigzag: 'the zigzag',
  door: 'the long way',   // (never: it's a secret, and nobody watched takes it)
};
const STOPPED: Record<CutId, (x: BotInfo) => string> = {
  guns: () => 'loading shots for the gun gap (Gunnery)',
  wreck: () => 'hauling coins from the wreck for the bribe (Treasure Haul)',
  headwind: () => 'rowing up the headwind gap',
  double: () => 'building a Double for the gap (Sailing)',
  triple: () => 'building a Triple for the gap (Sailing)',
  whirls: (x) => `building a Vegas at the whirlpools' mouth (Sailing)${x.tries ? `, go ${x.tries + 1}` : ''}`,
  rocks: () => 'loading her guns by the rocks, to blast them (Gunnery)',
  forage: () => 'clearing the barrier of driftwood (Foraging)',
  locks: () => 'pumping the lock (Bilge)',
  crane: () => 'building the crane (Carpentry)',
  zigzag: () => 'hopping the zigzag',
  door: () => 'sailing the long way',
};
const CARRIED: Record<CutId, string> = {
  guns: 'through the imperial gate, across the fort\'s bay', wreck: 'off from the wreck, coins aboard', headwind: 'out of the headwind gap', double: 'hopping the gap on her Double',
  whirls: 'zooming over the whirlpools on her Vegas!', rocks: 'through the gap the rocks were blasted out of', forage: 'through the barrier\'s gap', locks: 'up the locks and down',
  crane: 'hauled over the neck by the crane', triple: 'hopping the gap on her Triple', zigzag: 'hopping the zigzag\'s headwinds',
  door: 'sailing the long way',
};


/** A change of plan, said: "Tzz changes her plan: leg 4, the locks → the long way, weaving". */
export function planChange(name: string, c: PlanChange): string {
  const a = optionOf(c.leg, c.from)?.name ?? c.from, b = optionOf(c.leg, c.to)?.name ?? c.to, lc = (s: string) => s.replace(/^The /, 'the ');
  return `${name} changes her plan: leg ${c.leg + 1}, ${lc(a)} → ${lc(b)}`;
}

/** What a racer's up to, as the bar says it. `next`: the next shortcut her route takes, if any. */
export function doing(x: BotInfo | null, next: CutId | null, home: number | null): string {
  if (home !== null) return `home, ${['1st', '2nd', '3rd'][home - 1] ?? `${home}th`}`;
  if (!x) return 'on the line';
  const m = x.mode === 'daze' ? 'daze' : x.mode;
  if (m === 'daze') return 'holed! Patching her deck (Carpentry)';
  if (m === 'wait') return `waiting her turn at ${WHERE[x.cut ?? 'locks']}`;
  if (m === 'trip') return x.cut ? CARRIED[x.cut] : 'carried a few squares back by the wind!';
  if (m === 'stop' && x.cut) return STOPPED[x.cut](x);
  if (x.hop > 0) return 'lining up a Double over the trade wind';
  if (x.move?.kind === 'hop') return `building a ${x.move.id === 'triple' ? 'Triple' : 'Double'} on the move (Sailing)`;
  if (x.move?.kind === 'load') return 'loading a shot by Gunnery, under way';
  if (x.route === 'long' || !next || next === 'zigzag') return 'sailing the long way (Sailing on the pilot)';
  return `sailing for ${WHERE[next]} (Sailing on the pilot)`;
}

/* ---- The race, watched ---- */

/** A race of four bots, watched: its field, sailed by the simulation's bots after the count, and who
    you're following. */
export class Watch {
  readonly racers: readonly Rival[];
  field: Field;
  run: SimRun | null = null;
  /** Who you're following: a racer's number, or -1, the free camera. */
  follow = -1;
  /** What each racer's route takes, in order. */
  private routes: CutId[][];

  /** `boards`: each racer's Sailing played on a real board (src/race-sailor.ts, boardSailor), as the page shows it; off,
      drawn from its odds (quicker: for tests that don't look at the boards). */
  constructor(public seed: number = Math.floor(Math.random() * 2 ** 31), racers: readonly Rival[] = WATCHED, readonly boards = true) {
    if (racers.length < FIELD.LEAST || racers.length > FIELD.MOST) throw new Error(`a race is ${FIELD.LEAST} to ${FIELD.MOST} racers`);
    this.racers = racers;
    this.routes = racers.map((r) => route(r.racer.route).cuts.slice());
    this.field = new Field(racers.map((r) => r.name), courseSea(), RACE.COUNT);
    racers.forEach((r, i) => { this.field.racers[i].pose = { c: r.spot, r: RC.LINE.r, d: 0 }; });
    this.field.start();
  }

  get state() { return this.field.state; }
  /** The clock: counting down, the seconds left; under way, from the gun. */
  get t() { return this.field.t; }

  /** Each tick: the count, then the bots' moves, shots and finishes. */
  tick(dt: number): FieldEvent[] {
    const out = this.field.tick(dt);
    if (this.field.state === 'on' && !this.run) {
      this.run = sail({
        field: this.field, you: false, seed: this.seed, boards: this.boards,
        racers: this.racers.map((r) => ({ route: route(r.racer.route), style: style(r.racer.style), skill: r.racer.skill, spot: r.spot })),
      });
    }
    if (this.run && (this.field.state === 'on')) out.push(...this.run.step(dt));
    return out;
  }

  /** What racer `i` is up to (null before the gun). */
  info(i: number): BotInfo | null { return this.run?.info(i) ?? null; }
  /** Her board, if she's puzzling (or Sailing on the pilot). */
  board(i: number): BoardNow | null { return this.field.racers[i].state === 'finished' ? null : boardOf(this.info(i)); }
  /** Her very Sailing board, while she's under way and Sailing on it (on the pilot, or building a combo for a
      gap): the simulation's own (src/race-sailor.ts, boardSailor), whose every clear carries her. Null when the
      board on show is one built at a stop (a Vegas at the whirlpools' mouth, a Double finished at its gap). */
  sailor(i: number): Sailor | null {
    const x = this.info(i), b = this.board(i);
    return x && b?.puzzle === 'sailing' && x.mode === 'sail' ? this.run?.sailor(i) ?? null : null;
  }
  /** The next shortcut her plan takes from where she's got to, if any. */
  nextCut(i: number): CutId | null {
    const x = this.info(i), done = x?.done ?? [];
    return (x ? cutsOf(x.plan) : this.routes[i]).find((id) => !done.includes(id)) ?? null;
  }
  /** Her plan (13 Nov: "if you're watching the race, you should ... be able to see what people's plans are,
      because that keeps it interesting"): each leg still to come and her choice on it, the one she's on first;
      and her last change to it, while it's fresh (WATCH.CHANGED seconds). */
  plan(i: number): { legs: { leg: number; name: string; puzzle: string; now: boolean }[]; changed: string } {
    const x = this.info(i), r = this.field.racers[i], plan: Plan = x?.plan ?? route(this.racers[i].racer.route).plan;
    const from = r.state === 'finished' ? plan.length : Math.min(plan.length, Math.max(0, r.leg));
    const legs = plan.slice(from).map((id, k) => { const o = optionOf(from + k, id)!; return { leg: from + k + 1, name: o.name, puzzle: o.puzzle, now: k === 0 }; });
    const c: PlanChange | undefined = x?.changes[x.changes.length - 1];
    const changed = c && this.field.t - c.t < WATCH.CHANGED ? planChange(r.name, c) : '';
    return { legs, changed };
  }

  /** Everyone's place: those home by their times, then the rest by how far round they've got. */
  standings(): { i: number; name: string; place: number; time: number | null }[] {
    const F = this.field.racers, far = (i: number) => this.run?.progress(i) ?? -i;
    const order = F.map((r) => r.i).sort((a, b) => {
      const ta = F[a].time, tb = F[b].time;
      if (ta !== null || tb !== null) return ta === null ? 1 : tb === null ? -1 : ta - tb;
      return far(b) - far(a);
    });
    return order.map((i, k) => ({ i, name: F[i].name, place: k + 1, time: F[i].time }));
  }
  place(i: number): number { return this.standings().findIndex((s) => s.i === i) + 1; }

  /** Follow racer `i` (0 up), or nobody (-1, the free camera). */
  pick(i: number): number { this.follow = i >= 0 && i < this.racers.length ? i : -1; return this.follow; }
  /** The next racer along (from the free camera, the leader), or back (-1). */
  cycle(by: 1 | -1 = 1): number {
    if (this.follow < 0) return this.pick(by > 0 ? this.standings()[0].i : this.standings()[this.racers.length - 1].i);
    return this.pick((this.follow + by + this.racers.length) % this.racers.length);
  }

  /** The bar: the clock, and who you're watching, her place, her leg and what she's doing; or the free
      camera's. */
  bar(): { clock: string; who: string; place: string; leg: string; doing: string } {
    const clock = this.field.state === 'count' ? `${Math.ceil(this.field.t)}...` : clockText(this.field.clock());
    const n = this.racers.length;
    if (this.follow < 0) return { clock, who: 'Free camera', place: '', leg: '', doing: this.field.state === 'done' ? 'everyone\'s home' : '' };
    const i = this.follow, r = this.field.racers[i], legs = RC.STRETCHES.length - 1;
    const leg = r.state === 'finished' ? 'home' : this.field.state === 'count' || !this.run ? 'on the line' : r.leg >= legs ? 'the run home' : `leg ${r.leg + 1} of ${legs}`;
    const p = this.place(i), nth = ['1st', '2nd', '3rd', '4th'][p - 1] ?? `${p}th`;
    return { clock, who: r.name, place: `${nth} of ${n}`, leg, doing: this.field.state === 'count' ? 'on the line, waiting for the gun' : doing(this.info(i), this.nextCut(i), r.place) };
  }
}

/* ---- The free camera ---- */

/** Where a camera looks from, as the den's camera takes it: the point it looks at, the way round it
    looks from (yaw, about the up), how far down it tilts, and how far back it is. */
export interface Shot { x: number; z: number; yaw: number; tilt: number; dist: number }

/** The free camera: its point moved over the course (held inside `bounds`, world metres), turned, tilted
    and zoomed. Moving is along the ground the way it looks. */
export class FreeCam {
  shot: Shot;
  constructor(public bounds: { x0: number; x1: number; z0: number; z1: number }, at: Partial<Shot> = {}) {
    this.shot = { x: (bounds.x0 + bounds.x1) / 2, z: (bounds.z0 + bounds.z1) / 2, yaw: 0, tilt: WATCH.CAM.TILT, dist: WATCH.CAM.DIST, ...at };
  }
  /** Moved `fwd` ahead (the way it looks, along the ground) and `side` to the right, in metres. */
  move(fwd: number, side: number) {
    const s = this.shot, y = s.yaw;
    // (it looks toward -sin(yaw), -cos(yaw): from out at +sin(yaw), +cos(yaw) in toward the point)
    s.x += -Math.sin(y) * fwd + Math.cos(y) * side;
    s.z += -Math.cos(y) * fwd - Math.sin(y) * side;
    this.hold();
  }
  /** Turned by `a` radians about the up; tilted by `t`. */
  turn(a: number, t = 0) {
    const s = this.shot;
    s.yaw = Math.atan2(Math.sin(s.yaw + a), Math.cos(s.yaw + a));
    s.tilt = Math.max(WATCH.CAM.TILT_MIN, Math.min(WATCH.CAM.TILT_MAX, s.tilt + t));
  }
  /** Zoomed in (`k` under 1) or out. */
  zoom(k: number) { this.shot.dist = Math.max(WATCH.CAM.DIST_MIN, Math.min(WATCH.CAM.DIST_MAX, this.shot.dist * k)); }
  /** To look at (x, z), keeping its way round, tilt and distance. */
  goTo(x: number, z: number) { this.shot.x = x; this.shot.z = z; this.hold(); }
  private hold() {
    const s = this.shot, b = this.bounds;
    s.x = Math.max(b.x0, Math.min(b.x1, s.x));
    s.z = Math.max(Math.min(b.z0, b.z1), Math.min(Math.max(b.z0, b.z1), s.z));
  }
}
