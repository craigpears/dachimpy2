/* Pirate Den: the sloop race. TypeScript, compiled to js/den-race.js; tested in tests/den-race.test.ts.
   js/den/race.js draws it (the course's land, its buoy and gate, the guns, the whirlpools, the crane; the
   rivals, js/den/race-field.js) and plays it at sea; its squares are LAY.RACE in src/den-sail.ts (with
   every other place's, as the sea lays them), what's said src/lines/race.ts.

   The user (11 Nov): "maybe we've got enough to start some sloop races ... a winding, snakes and ladders,
   zigzagging kind of course, just with a lot of shortcuts, and each shortcut is a different puzzle, and
   you have to choose either the long way round, just ... without doing anything, and the long way it
   potentially involves running past some cannons", "it should be significant", and of the first draft:
   "this will be out near where Primates Rule is ... We're going to have to go through several
   iterations of this course." And it's a minigame, not a sea battle: the den is "about creative new
   mechanics, and tutorials".

   The second pass (11 Nov), re-laid to the simulation (src/race-sim.ts, RACE.md §8) and to what the user
   asked for after more goes: snakes ("I want the snakes and [ladders]"), shortcuts of every size ("Are
   you a person that can break quick double triples? ... Or do you want to go for those giant" ones), a
   start "with just like regular whirlpools ... pick your starting spot along the starting edge", the
   long way plain to follow ("clearer [buoys] for the main route"), the race explained at the start, and
   "a more ceremonious finish goal line".

   So: a buoy on the open sea out past Primates Rule; Space by it takes you in to the starting line,
   where you pick your spot along it (A D, or a click on the line), and Space again and the starter
   counts you down, the clock running from the gun. Through the start's field of whirlpools and winds,
   then five legs back and forth and the run home (LAY.RACE in src/den-sail.ts has the lay), the long
   way round each spit's end by its numbered buoy (no puzzle, a reach every leg), or through it by a
   shortcut, each a puzzle the den already has, played by its one module:
   - [A] the gun gap: two guns trained on it, as the imperial checkpoint's are (its numbers, CHECK; each
     a destructible turret, src/den-turret.ts). It's the combo that gets you through: a heavy one (a big
     Sailing chain's boost, or a Vegas rowed each side) rushes her past their marks; a square at a time
     she's a sitting duck, holed (patched by Carpentry: src/den-patch.ts). Or knock them out with her
     own guns, loaded by Gunnery. Just past it, one move too many and the tight water's wind sweeps her
     back along leg 2.
   - [B] the headwind gap: the wind blows straight back through it, so no sail gets her through; row it,
     by mirror strokes (src/den-row.ts). Sit idle in it and she drifts back a square at a time (Drift).
     And the small gap beside it that a Double hops.
   - [C] the whirlpool channel: only a Vegas from its mouth carries her over (src/den-sailing.ts,
     gustPath); less, and a whirlpool has her and its winds carry her back to the mouth (src/den-whirl.ts).
     The rocks across a gap (Rocks, 12 Nov), shot down by anyone's broadsides on the move, ROCKS.HITS of
     them, then open to every racer. And the barrier of driftwood across a gap (Barrier), cleared by
     Foraging (src/foraging.ts) from the notch in front of it, sheltered.
   - [D] the locks: up one, pumped by Bilge, and down the other (src/den-lock.ts), a berth beside the way
     in to wait your turn in; and the zigzag before them, headwinds a Double hops.
   - [E] the crane in its notch on the last spit: built by Carpentry, a part at a time (src/den-crane.ts,
     the cliff's crane's rules put down here), it hauls her over to the run home. And the gap a Triple
     hops.
   Each stopped puzzle's shortcut skips about the same stretch of course and is sized to take about the
   same time to play, the chain hops growing with their chain (RACE.DECENT, tested; RACE.md §8, "Shortcuts in
   proportion"), so it pays only if it's your puzzle. The snakes (winds that carry her back: RACE.md §4) are
   gentle since 12 Nov: each a loop of three or four squares back, to try again, never a leg or the start
   ("I don't want it to be rage-inducing"). No gambles (12 Nov). Home is a line across the run home between
   two markers (atFinish). The start's field is laid from the race's seed (src/start-field.ts): Race.seed.
   Your best time's kept in this browser. The race keeps a field of racers (src/den-racers.ts: two to
   four on one course, first come first served, shooting each other): you, and up to three rivals, the
   den's own characters (src/den-rivals.ts, how many picked on the line), each sailed by the
   simulation's bots (src/race-sim.ts, simDrive, handed in as the Race's `drive`: this file can't import
   it, as it imports this) on her favourite route in her own style. They fire on you as the field's rules
   say, and you on them (target, shoot). The race simulated with bots of every way round is
   src/race-sim.ts (RACE.md §8). */

import { LAY, SAIL, type Helm, type Pose, type RaceLay, type Sea } from './den-sail.js';
import { CHECK } from './den-checkpoint.js';
import { Turret, type TurretEvent } from './den-turret.js';
import { Crane, CRANES } from './den-crane.js';
import { Field, FIELD, stretchAt, atFinish, courseSea, type FieldEvent } from './den-racers.js';
import { RIVALS, type Rival } from './den-rivals.js';
import type { Deal } from './foraging.js';
import { fieldFor, type StartField } from './start-field.js';

export { stretchAt, atFinish };

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
      over the long way round its bend, sailed (tests/den-race.test.ts holds each to it). Set (11 Nov,
      the course's second pass) to what the simulation recommended (src/race-sim.ts, RACE.md §8): a
      shortcut pays only for a player good at its puzzle. A heavy combo through the gun gap; a few
      squares rowed by mirror strokes; a Vegas; a lock pumped up by Bilge and another drained; three
      frames of Carpentry; a barrier cleared by Foraging; and the gaps a Double and a Triple hop. The
      locks' went from 26 to 31 (12 Nov) when their water and gates became a beat, not a wait (LOCK). The barrier's
      from 15 to 12 (12 Nov) when it moved a column east, off the trade wind's hop.
      The race's next pass (12 Nov, RACE.md §8, "Shortcuts in proportion": "each an element of puzzling surely
      should be the same distance"): every stopped puzzle's shortcut skips about the same stretch, about 22 s
      (the gate 22, the rowing gap 25, the rocks 25, the locks 23, the crane 27, the barrier 16: it sits where
      spit 3 has room), each puzzle sized to about the same time (the locks 5 clears, the crane's small frames,
      the bribe 30 coins); the chain hops grow with the chain: a Double 9, a Triple 14, a Vegas 48. */
  DECENT: { guns: 22, headwind: 25, whirls: 48, rocks: 25, locks: 23, crane: 23, forage: 16, double: 9, triple: 14 },
  /** The long way's own spot on the starting line: where the long way's route starts (LONG_ROUTE), and
      what the simulation measures every other spot against (src/race-sim.ts, SIM.SPOTS). */
  LONG_SPOT: 13,
  /** Seconds sat on one square before you count as sitting still (stopped to puzzle): a sitting duck in
      the open for a rival going by (src/den-racers.ts). */
  STILL: 1.5,
  /** Where your best time's kept, in this browser (a course from the editor keeps its own: src/race-course.ts). */
  STORE: RC.CUSTOM ? `den-race-best:${RC.CODE}` : 'den-race-best',
  /** The gun gap's guns in a race of several (RACE.md §6; src/race-sim.ts tries both): what quietens
      them, the same shots as hit other racers, a hit a gun ('shared': leaving the other racers in peace
      pays, "a kind of peaceful racer bonus"); or more hits than a racer starts with, so they want
      Gunnery as well ('hits': HARD hits a gun). The simulation settled it (11 Nov): shared, the gap's
      ways through even with each other; with more hits, shooting them out was the worst way round. And
      once roused, the seconds a gun takes to load again after an aimed shot: slower than the checkpoint's
      (CHECK.AIMED_RELOAD, 4), since in a race it fires on whoever comes near, not only on the racer who
      roused it (the user, 11 Nov: "If they're aggroed, they are very relentless"). */
  GAP: { MODE: 'shared' as 'shared' | 'hits', HARD: 2, AIMED_RELOAD: 6 },
  /** The barrier of driftwood across a gap [C], as Foraging deals it: its bundles of driftwood on the
      board from the start ([row, column], a crate each, the puzzle's smallest container), nothing more
      to come; cleared when they've all dropped out of the bottom (src/foraging.ts: the board's done). As many as
      the course has (src/race-course.ts, bundles: two, the den's own). */
  FORAGE: { BUNDLES: ([[4, 2], [3, 4], [5, 5], [2, 1]] as [number, number][]).slice(0, RC.COURSE.bundles) },
  /** The rocks across spit 3's gap (12 Nov): broadside hits to bring them down, anyone's (the user: "Maybe
      you could do it with like 3 gunshots or something"). */
  ROCKS: { HITS: 3 },
} as const;

/** With the Sailing board open at sea, Space and Enter are the board's (Space drops its pair faster), never
    the race's: not the buoy's, the gate's guard's, the crane's or the barrier's (the user's playtest, 12 Nov:
    Space at the start buoy with the board open took her in to the starting line). Under the starlit door's
    cleft the board's hers as well (js/den/door.js lets its keys through). */
export const boardHasKey = (key: string, board: boolean): boolean => board && (key === ' ' || key === 'enter');
/** By the starting buoy: where Space takes her in to the starting line. */
export const atStart = (c: number, r: number): boolean => c >= RC.START.c0 && c <= RC.START.c1 && r >= RC.START.r0 && r <= RC.START.r1;
/** Anywhere on the course: behind its line of rocks. */
export const onCourse = (c: number, r: number): boolean => r > RC.R0;
const headwind = new Set(RC.HEADWIND.map(([c, r]) => key(c, r)));
/** In the headwind gap [B]. */
export const inHeadwind = (c: number, r: number): boolean => headwind.has(key(c, r));
/** On the starting line. */
export const onLine = (c: number, r: number): boolean => r === RC.LINE.r && c >= RC.LINE.c0 && c <= RC.LINE.c1;
/** Where she starts from on the line at spot `c`: facing out across the start's field. */
export const spotPose = (c: number): Pose => ({ c: Math.max(RC.LINE.c0, Math.min(RC.LINE.c1, Math.round(c))), r: RC.LINE.r, d: 0 });
/** The spot she's taken in to from the buoy: the line's square below the gate. */
export const FIRST_SPOT = RC.GATE[1][0];

/** Which snake, if any, has this square: the left-hand trade wind's loops, the tight water past the gun gap,
    or the trade wind back across leg 3 (each carries her back a few squares: RACE.md §4). */
export type Snake = 'left' | 'tight' | 'mid';
const snakes = new Map<string, Snake>([
  ...RC.SNAKES.LEFT.map(([c, r]): [string, Snake] => [key(c, r), 'left']),
  ...RC.SNAKES.TIGHT.map(([c, r]): [string, Snake] => [key(c, r), 'tight']),
  ...RC.SNAKES.MID.map(([c, r]): [string, Snake] => [key(c, r), 'mid']),
]);
export const snakeAt = (c: number, r: number): Snake | null => snakes.get(key(Math.round(c), Math.round(r))) ?? null;

/** The buoy she's sailing for, by where she is: the one at the end of the stretch she's on (1 to 5), 6 the
    finish; in the start's field, buoy 1. (The long way plain to follow: "clearer [buoys] for the main
    route", the next one shown.) */
export function nextBuoy(c: number, r: number): number {
  const s = stretchAt(Math.round(c), Math.round(r));
  return s >= 0 ? s + 1 : 1;
}

export type RaceEvent =
  | { kind: 'count'; n: number }
  | { kind: 'go' }
  /** On to the next stretch (1 the second leg ... 5 the run home). */
  | { kind: 'leg'; n: number }
  /** A rival's over the finish line: who (her number in the field), her time and place. */
  | { kind: 'home'; racer: number; secs: number; place: number }
  /** A rival's fired a broadside (`by`, her number): the squares it went over, and who it hit (-1 nobody,
      0 you: you're holed, to patch). */
  | { kind: 'shot'; by: number; cells: [number, number][]; hit: number }
  /** A snake has her: swept back. */
  | { kind: 'swept'; snake: Snake }
  /** Over the finish line: her time and place. */
  | { kind: 'finish'; secs: number; best: boolean; won: boolean; place: number }
  /** Back out through the gate once she'd been through it: the race is off. */
  | { kind: 'quit' };

/** The rivals' sailing, handed to the Race (src/race-sim.ts, simDrive: the simulation's bots, the race's
    field theirs to move): each tick their moves, shots and finishes; how far round the long way any racer
    is (seconds of it, for places: you as well); a rival hit by you; and how high she's lifted (by the
    crane: 0 on the water, 1 at the top of its swing). */
export interface Driver {
  step(dt: number): FieldEvent[];
  progress(i: number): number;
  hit(i: number, by: number): boolean;
  lift(i: number): number;
  /** Your hit on the rocks, told on (a race online: to its room); the field's counted it already. */
  rock?(): void;
}
export type Drive = (field: Field, rivals: readonly Rival[], seed: number) => Driver;

/** You, each tick: your square (fractional as she sails), the way you face, and what holds you if
    anything (holed: 'dazed', patching; 'carried', on the crane's hook or a gust, out of reach). */
export interface You { c: number; r: number; d?: number; held?: 'dazed' | 'carried' | null }

/** Where a racer stands now: her number, her name, her place (1 first), her time once she's home. */
export interface Standing { i: number; name: string; place: number; time: number | null }

/** The race you sail in the den: on the line (picking her spot, and how many rivals), counting down,
    under way (the clock), or done; how far round she's got, in order. Its field (src/den-racers.ts) is you
    (racer 0, moved by the helm: `at` each tick) and your rivals (src/den-rivals.ts, the first `rivals` of
    them), sailed from the gun by `drive` (none: they sit on their spots, as some tests have them). Once
    you're home, the rest race on till they're home too. */
export class Race {
  state: 'off' | 'line' | 'count' | 'on' | 'done' = 'off';
  /** Counting down, the seconds left; under way, the clock; done, her time. */
  t = 0;
  won = false;
  /** Through the gate onto the course, this race. */
  entered = false;
  /** Her spot on the starting line (its column). */
  spot: number = FIRST_SPOT;
  /** How many rivals race you (picked on the line). */
  rivals: number = RIVALS.length;
  /** The racers: you, then your rivals. */
  field: Field;
  /** The rivals' sailing, from the gun. */
  run: Driver | null = null;
  /** Racing online (src/race-net.ts): everyone else on the course, in order, the other players and the
      room's bots, instead of your rivals (null: your rivals, the first `rivals` of them). */
  roster: readonly Rival[] | null = null;
  /** The race's seed: its start's field (src/start-field.ts: the same seed, the same field, for everyone in a
      race online), and your rivals' sailing (`drive`). A fresh one each time she's taken in to the line. */
  seed = 1;
  /** The snake that has her now, if one does (said once a sweep). */
  private snake: Snake | null = null;
  /** How long she's sat on one square, and which. */
  private stillT = 0;
  private sq = '';
  constructor(public best: number | null = null, public drive: Drive | null = null) { this.field = this.lineUp(); }

  /** Your rivals this race, in their order. */
  racing(): readonly Rival[] { return this.roster ?? RIVALS.slice(0, this.rivals); }
  /** A fresh field: you, and your rivals on their spots. */
  private lineUp(): Field {
    const f = new Field(['you', ...this.racing().map((r) => r.name)], courseSea(), RACE.COUNT, FIELD.ONLINE);
    this.racing().forEach((r, k) => { f.racers[k + 1].pose = spotPose(r.spot); });
    return f;
  }
  /** A rival's spot (one racing this race). */
  taken(c: number): boolean { return this.racing().some((r) => r.spot === c); }

  /** The furthest stretch she's reached in order (0 the first leg): every one counts, a shortcut's or not. */
  get leg(): number { return this.field.racers[0].leg; }

  /** Whether Space (`key`, as js/den gets it) by the buoy takes her in to the starting line: by it, lying
      still, no race on, and the Sailing board not open (`board`): with it open, Space is the board's,
      dropping its pair faster (12 Nov: Space at the buoy with the board open took her to the line). */
  takes(key: string, h: Helm, board: boolean): boolean {
    if (boardHasKey(key, board) || (key !== ' ' && key !== 'enter')) return false;
    return atStart(h.pose.c, h.pose.r) && h.slot < 0 && !h.held() && this.state !== 'count' && this.state !== 'on';
  }
  /** The start's field this race (its seed's). */
  field0(): StartField { return fieldFor(this.seed); }
  /** In to the starting line from the buoy, to pick her spot, a fresh seed (`seed`: a race online's, the
      room's). Not while one's on. */
  take(seed: number = 1 + Math.floor(Math.random() * 2 ** 30)): boolean {
    if (this.state === 'count' || this.state === 'on') return false;
    Object.assign(this, { state: 'line', spot: FIRST_SPOT, won: false, entered: false, run: null, seed });
    this.field = this.lineUp();
    if (this.taken(this.spot)) this.shift(1);
    return true;
  }
  /** On the line: how many rivals race you, one to all of them (RIVALS). Your spot moves along if one of
      theirs is it now. How many now. */
  setRivals(n: number): number {
    if (this.state !== 'line' || this.roster) return this.rivals;
    this.rivals = Math.max(1, Math.min(RIVALS.length, Math.round(n)));
    this.field = this.lineUp();
    if (this.taken(this.spot)) this.shift(this.spot < RC.LINE.c1 ? 1 : -1);
    return this.rivals;
  }
  /** Racing online: everyone else on the course (the room's line-up, you not in it), or null to race your
      rivals again. On the line, they're lined up on their spots now. */
  setRoster(roster: readonly Rival[] | null) {
    this.roster = roster;
    if (this.state === 'line' || this.state === 'off') this.field = this.lineUp();
  }
  /** Along the line a square, left (-1) or right (+1), or to spot `to`: never onto a rival's (she goes past
      it). Where she is now. */
  shift(by: number, to: number | null = null): number {
    if (this.state !== 'line') return this.spot;
    const dir = (to ?? this.spot + by) >= this.spot ? 1 : -1;
    let c = to ?? this.spot + by;
    while (this.taken(c)) c += dir;
    if (c >= RC.LINE.c0 && c <= RC.LINE.c1) this.spot = c;
    return this.spot;
  }
  /** The count, from the line (or straight from the buoy). Not while one's on. */
  start(): boolean {
    if (this.state === 'count' || this.state === 'on') return false;
    Object.assign(this, { state: 'count', t: RACE.COUNT, won: false, entered: false, run: null, stillT: 0, sq: '' });
    this.snake = null;
    this.field = this.lineUp();
    this.field.start();
    return true;
  }
  /** Carried on under the course (the starlit door's tunnel, src/den-door.ts) from stretch `from` to
      stretch `to`, past the ones between: counted as reached in order, if she'd reached `from`. */
  under(from: number, to: number): RaceEvent[] {
    if (this.state !== 'on') return [];
    return this.field.under(0, from, to).flatMap((e) => (e.kind === 'leg' ? [{ kind: 'leg' as const, n: e.n }] : []));
  }
  /** Given up (sailed back out through the gate, say). */
  quit() { this.state = 'off'; this.run = null; }
  /** The clock under way: from the gun, 0 till then. */
  clock(): number { return this.state === 'on' || this.state === 'done' ? this.t : 0; }

  /** Each tick: `at`, where you are after it. Once you're home, the rivals race on. */
  tick(dt: number, at: You): RaceEvent[] {
    const out: RaceEvent[] = [];
    if (this.state === 'count') {
      for (const e of this.field.tick(dt)) if (e.kind === 'count' || e.kind === 'go') out.push(e);
      this.t = this.field.t;
      if (this.field.state === 'on') { this.state = 'on'; this.run = this.drive?.(this.field, this.racing(), this.seed) ?? null; }
      return out;
    }
    const rest = this.state === 'done' && this.field.state === 'on';
    if (this.state !== 'on' && !rest) return out;
    this.field.tick(dt);
    if (this.state === 'on') {
      this.t = this.field.t;
      if (onCourse(at.c, at.r)) this.entered = true;
      else if (this.entered) { this.quit(); out.push({ kind: 'quit' }); return out; }
      // (a snake: said once each time one has her)
      const sn = snakeAt(at.c, at.r);
      if (sn && sn !== this.snake) out.push({ kind: 'swept', snake: sn });
      this.snake = sn;
      for (const e of this.field.move(0, { c: at.c, r: at.r, d: at.d ?? 0 })) {
        if (e.kind === 'leg') out.push({ kind: 'leg', n: e.n });
        if (e.kind === 'finish') {
          this.state = 'done';
          this.won = e.place === 1;
          const best = this.best === null || this.t < this.best;
          if (best) this.best = this.t;
          out.push({ kind: 'finish', secs: this.t, best, won: this.won, place: e.place });
        }
      }
      // (what she's doing, for the rivals' guns: sat on one square a while, she's stopped to puzzle)
      const k = `${Math.round(at.c)},${Math.round(at.r)}`;
      this.stillT = k === this.sq ? this.stillT + dt : 0;
      this.sq = k;
      const me = this.field.racers[0];
      if (me.state !== 'finished') me.state = at.held === 'dazed' ? 'dazed' : at.held === 'carried' ? 'carried' : this.stillT >= RACE.STILL ? 'puzzling' : 'sailing';
    }
    // The rivals: their moves, their broadsides (at you too), home.
    for (const e of this.run?.step(dt) ?? []) {
      if (e.kind === 'shot') out.push({ kind: 'shot', by: e.racer, cells: e.cells, hit: e.hit });
      if (e.kind === 'finish' && e.racer > 0) out.push({ kind: 'home', racer: e.racer, secs: e.secs, place: e.place });
    }
    return out;
  }

  /** Your broadside's come down on the rocks (12 Nov): a hit on them, shared by the field. Whether it counted,
      and whether they're down now. */
  blast(): { hit: boolean; down: boolean } {
    if (this.state !== 'on') return { hit: false, down: rocksDown(this.field) };
    const hit = this.field.blast(RACE.ROCKS.HITS);
    if (hit) this.run?.rock?.();
    return { hit, down: rocksDown(this.field) };
  }
  /** Who a broadside of yours over `cells` (in order, as it flies) would hit: the first rival on one who
      can be hit, before any rock or land; -1 nobody. */
  target(cells: [number, number][]): number { return this.state === 'on' ? this.field.firstOn(cells, 0) : -1; }
  /** Your shot's come down on rival `i`: she's holed, dazed till she's patched (not if she can't be hit
      now). Whether it holed her. */
  shoot(i: number): boolean {
    if (this.state !== 'on' || i <= 0) return false;
    return this.run ? this.run.hit(i, 0) : this.field.hit(i, 0);
  }
  /** Where everyone stands: those home by their times, then the rest by how far round the long way
      they've got (the rivals' sailing says; before the gun, in the field's order). */
  standings(): Standing[] {
    const F = this.field.racers, far = (i: number) => this.run?.progress(i) ?? -i;
    const order = F.map((r) => r.i).sort((a, b) => {
      const ta = F[a].time, tb = F[b].time;
      if (ta !== null || tb !== null) return ta === null ? 1 : tb === null ? -1 : ta - tb;
      return far(b) - far(a);
    });
    return order.map((i, k) => ({ i, name: F[i].name, place: k + 1, time: F[i].time }));
  }
  /** Your place now (1 first). */
  place(): number { return this.standings().findIndex((s) => s.i === 0) + 1; }
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

/* The long way round, as squares (the simulation's bots sail it: src/race-sim.ts), from the long way's own
   spot on the line (RACE.LONG_SPOT): straight runs between them, down through the start's field and along
   the middle of each stretch (the run home's one row), round every bend, to the finish line. */
const S = RC.STRETCHES;
/** The row the long way runs along a stretch: the middle of its two, or the run home's one. */
export const routeRow = (i: number): number => (i === S.length - 1 ? S[i].r : S[i].r + 0.5);
/** The long way round a course laid out (this page's, or any from the race's editor: src/race-course.ts),
    round each buoy. */
export function longRoute(lay: RaceLay = RC): [number, number][] {
  const out: [number, number][] = [[RACE.LONG_SPOT, lay.LINE.r], [RACE.LONG_SPOT, routeRow(0)]];
  lay.STRETCHES.forEach((s, i) => {
    const end = i === S.length - 1 ? lay.FINISH[0] : lay.BUOYS[i].at[0] + 0.5;
    out.push([end, routeRow(i)]);
    if (i + 1 < S.length) out.push([end, routeRow(i + 1)]);
  });
  return out;
}
export const LONG_ROUTE: [number, number][] = longRoute();

/* [A] The gun gap's guns: a destructible turret either side (src/den-turret.ts), set up with the imperial
   checkpoint's numbers (src/den-checkpoint.ts, CHECK), trained on the way in, the gap and the way out.
   As the checkpoint's: off their marks they leave her be till she fires on them (then it's a fight,
   till she's out of their sight), and one that's hit her holds its fire on its marks till she's out
   of sight. */
export type GapEvent = TurretEvent & { gun: number };
export class GunGap {
  readonly guns: Turret[] = RC.GUNS.at.map((at, g) => new Turret({
    at, marks: RC.GUNS.marks[g], alert: false, reach: CHECK.REACH,
    flight: CHECK.AIMED, reload: RACE.GAP.AIMED_RELOAD, markFlight: CHECK.FLIGHT, markReload: CHECK.RELOAD,
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
   square every RACE.DRIFT seconds, out of it the way she came in (back round its dog-leg). */
export class Drift {
  idle = 0;
  /** Each tick: the square it blows her back to, if it does (Helm.gust plays it). */
  tick(dt: number, h: Helm): Pose | null {
    const p = h.pose, still = h.slot < 0 && !h.cur && !h.gusts.length && !h.strokes.length && !h.dazed();
    if (!inHeadwind(p.c, p.r) || !still) { this.idle = 0; return null; }
    this.idle += dt;
    if (this.idle < RACE.DRIFT) return null;
    this.idle = 0;
    const i = RC.HEADWIND.findIndex(([c, r]) => c === p.c && r === p.r), [c, r] = i > 0 ? RC.HEADWIND[i - 1] : [p.c, p.r - 1];
    return { c, r, d: p.d };
  }
}

/** [D] The locks made ready for a race: each one's water at the side she comes to it from, so going down
    the course she's let in as she comes (the up lock drained, the down lock full from the canal above), and
    only Bilge and the down lock draining stand between her and the far side. Before (12 Nov), the down lock
    lay drained as they all start, and she sat while it filled from above before it drained again: "it
    shouldn't feel like you're losing the race because you're waiting on the animation." `h`'s locks, the
    race's (LAY.RACE.LOCKS) only. */
export function readyLocks(h: Helm) {
  for (const s of RC.LOCKS) {
    const l = h.lockAt(...s.at);
    // (she comes to each from the row before it: one whose high side is that way, 2, she goes into full)
    if (l) l.set(s.up === 2 ? 1 : 0);
  }
}

/** [E] The crane in its notch: the cliff's crane's rules (src/den-crane.ts), its ledge here: she lies in
    the notch off leg 5, and it sets her down on the run home (LAY.RACE.CRANE.TO). Once built it stays
    built, race after race. */
export const neckCrane = (random: () => number = Math.random): Crane => new Crane(random, [...RC.CRANE.LEDGE] as [number, number], CRANES[RC.COURSE.frames]);

/* [C] The barrier of driftwood across a gap (the user, 11 Nov: "it's not even macheting. You just have
   to clear the barrier ... similar to the static rocks, but you're doing it through foraging"): land on
   the sea till it's cleared, by a board of Foraging dealt with its bundles of driftwood on it
   (barrierDeal; src/foraging.ts, the one implementation, played as Umami's is), from the notch in front
   of it. Sheltered there, between the gap's banks: with the whirlpools on the same spit out in the open,
   it's the leader's shortcut on this stretch (the user, 11 Nov: "So I don't want the leaders not be able
   to puzzle at all"). Cleared, it's open for the rest of the race; a new race, it's back. */
export const atNotch = (c: number, r: number): boolean => c === RC.FORAGE.NOTCH[0] && r === RC.FORAGE.NOTCH[1];
export function barrierDeal(random: () => number = Math.random): Deal {
  return { random, bananas: 0, start: RACE.FORAGE.BUNDLES.map(([r, c]) => ({ size: 'crate' as const, r, c, tag: 'drift' })) };
}
export class Barrier {
  cleared = false;
  /** Cleared: its squares open water on `sea`. */
  clear(sea: Sea) {
    for (const [c, r] of RC.FORAGE.BARRIER) { sea.works.delete(key(c, r)); sea.rocks.delete(key(c, r)); }
    sea.touch();
    this.cleared = true;
  }
  /** Back across the gap, for a new race. */
  reset(sea: Sea) {
    for (const [c, r] of RC.FORAGE.BARRIER) { sea.works.add(key(c, r)); sea.rocks.add(key(c, r)); }
    sea.touch();
    this.cleared = false;
  }
}

/* [C'] The rocks blasted open for everyone (12 Nov). The user: "if you had like a destructible obstacle there
   ... somebody could start shooting it if they're first, but then ... once it's been destroyed, that opens it
   up ... for everybody, not just them ... it's a way for the loser to catch up ... Maybe you could do it with
   like 3 gunshots or something." A wall of rocks across the mouth of a gap in spit 3, off leg 3: land on the sea
   till it's down. Anyone's broadside that comes down on it (fired as she sails by on leg 3: her port side going
   along it) is a hit, counted by the race's field (Field.rocks, shared: online the room keeps it); at
   ROCKS.HITS it's down, open water for every racer for the rest of the race. Her shots are her budget (she
   starts with two, loaded by Gunnery), so blasting costs what she'd fire at rivals. A new race, it's back. */
const rockSq = new Set(RC.ROCKS.WALL.map(([c, r]) => key(c, r)));
/** One of the rocks' squares (where a broadside comes down on them). */
export const onRocks = (c: number, r: number): boolean => rockSq.has(key(Math.round(c), Math.round(r)));
/** The rocks are down, on this field. */
export const rocksDown = (f: Field): boolean => f.rocks >= RACE.ROCKS.HITS;
/** Down: their squares open water on `sea`; or back across the gap (`up`), for a new race. */
export function rocksOn(sea: Sea, up: boolean) {
  for (const [c, r] of RC.ROCKS.WALL) {
    if (up) { sea.works.add(key(c, r)); sea.rocks.add(key(c, r)); } else { sea.works.delete(key(c, r)); sea.rocks.delete(key(c, r)); }
  }
  sea.touch();
}
