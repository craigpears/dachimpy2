/* Pirate Den: the sloop race, simulated: two to four bots raced on its course with no 3D, over and over,
   to test its balance. TypeScript, compiled to js/race-sim.js; tested in tests/race-sim.test.ts; run by
   tools/race-sim.mjs (win rates by route, by racing style, by skill, by place when stopping in the open,
   and what each shortcut really saves). The race's rules are src/den-race.ts and its field
   src/den-racers.ts, which this plays; its course is LAY.RACE (src/den-sail.ts), read from there, so a
   reworked course is simulated as it's laid.

   The user (11 Nov): "a test harness underneath this ... where you don't need to worry about the
   graphical elements. So you can just run through simulations quickly and easily, and just really test
   balance ... implement a handful of bots that go through different strategies ... and just actually
   make sure they all have a relatively equal chance of winning."

   How it's played (RACE.md §8, "Simulation", has the reasoning and the numbers):
   - The course, as the bots see it: the long way's route (RIVAL_ROUTE), sailed at the pace that brings
     her round in the time the helm takes the long way (SIM.LONG, measured by the helm; the test checks
     it). Each racer's progress is how far round the long way she's got, in seconds of it (tau). Under
     way, she's on a leg's first row; the second is for passing a sloop that's stopped.
   - Each shortcut (CUTS): where she leaves the long way and where she rejoins it, from LAY.RACE; her own
     trip through (the gust, the crane, the tunnel, the locks' water and gates, the gap's light airs);
     and what it saves, the long way between less the trip (as tests/den-race.test.ts measures it with
     the helm). Where she sits to puzzle, if she stops, and whether that's sheltered.
   - Puzzles aren't played move by move: each takes a time drawn for the racer's skill (decent, good,
     great) round a decent player's (SIM.PUZZLE, sources there), spread as people are (SIM.SPREAD). A Vegas
     comes off only so often (SIM.VEGAS); one that doesn't sends her back to the mouth, to try again
     quicker (the board half built), or after SIM.TRIES she gives up and sails on.
   - On the move she's on the pilot: Sailing on it (any racer, whenever she's free: SIM.CHAIN) carries her
     on ahead by its chains' gusts; a combo built for the gun gap, or her guns loaded by Gunnery, takes
     that time instead, and she sails a little slower while she's at it (SIM.OVERLAP).
   - A racer is a route (ROUTES: the shortcuts she takes) and a style (STYLES: when she fires, whether she
     loads more, whether she'll stop in the open with someone close behind).
   - Shooting, by the field's rules (src/den-racers.ts: a broadside, three squares out of her side,
     stopped by land; sheltered spots out of reach): a bot fires on a racer sitting still as it goes by,
     the broadside landing as often as its skill times it (SIM.AIM). A hit dazes her till she's patched (a
     Carpentry patch's time); a Vegas being built loses some of its board.
   - The gun gap's guns (SIM.GAP): run square by square, each gun's mark shot may hole her; a heavy combo
     rushes her past them; her shots quieten them (RACE.GAP.MODE: the same shots as for racers, a hit each;
     or more hits than a racer starts with) and rouse them: then they fire on any racer in reach, not only
     her, till nobody's near.
   - Deterministic: one seed, one race. */

import { LAY, SAIL, Sea, type Pose } from './den-sail.js';
import { RACE, RIVAL_ROUTE } from './den-race.js';
import { Field, FIELD, sheltered, type Spot, type RacerState } from './den-racers.js';
import { DOOR } from './den-door.js';
import { CHECK } from './den-checkpoint.js';
import { CRANE, TRIP } from './den-crane.js';
import { LOCK } from './den-lock.js';
import { PATCH } from './den-patch.js';
import { WIND } from './den-wind.js';
import { runFor, RUN } from './sailing.js';
import { seeded } from './mirror-row.js';

const RC = LAY.RACE, S = RC.STRETCHES;

export type Skill = 'decent' | 'good' | 'great';
export const SKILLS: Skill[] = ['decent', 'good', 'great'];
export type CutId = 'guns' | 'headwind' | 'whirls' | 'locks' | 'crane' | 'door';

export const SIM = {
  /** Seconds a tick. */
  DT: 0.1,
  /** Seconds the helm takes the long way round, gun to finish, no puzzle (measured 11 Nov, 256.7 s: the
      long-way test in tests/den-race.test.ts; tests/race-sim.test.ts measures it again and holds this to
      it). */
  LONG: 257,
  /** A racer's sailing a little better or worse than another's (the pins she drops, her turns): her
      pace's spread, as a fraction. */
  STEER: 0.02,
  /** Puzzling on the move at something other than Sailing (a combo held for the gun gap, Gunnery), she
      sails on at this fraction of her speed: the pilot sails her, but the bends and the gap want her
      (RACE.md §8: on-the-move time overlaps the sailing). Assumed. */
  OVERLAP: 0.85,
  /** Sailing on the pilot whenever she's free: the squares a second its chains' gusts carry her on, by
      skill. From tools/sail-bots.mjs (40 to 47 squares every 100 drops for the two-ply and builder bots),
      at a drop every 2.5 s or so, less what's lost at the bends: decent 0.06, good 0.09, great 0.12.
      Assumed; CHAIN=0 in the runner tries the race with nobody doing it. */
  CHAIN: { decent: 0.06, good: 0.09, great: 0.12 } as Record<Skill, number>,
  /** Puzzle time by skill, as a fraction of a decent player's. */
  SKILL: { decent: 1, good: 0.75, great: 0.55 } as Record<Skill, number>,
  /** How puzzle times spread about their mean (a log-normal's sigma). */
  SPREAD: 0.3,
  /** A decent player's seconds at each puzzle, as the race asks for it. Where a bot measured it, that;
      otherwise RACE.DECENT's own figure (the design: each shortcut saves about what a decent player
      takes) or a guess:
      - combo: a heavy Sailing chain (worth four squares) on the sea's own board: RACE.DECENT.guns. Assumed.
      - vegas: a Sailing Vegas on the sea's own board: RACE.DECENT.whirls. Assumed (tools/sail-bots.mjs's
        best bot, the staircase, makes one every 170 drops or so; people do far better: the user builds
        "Vegas 3s and 4s quite easily").
      - row: the headwind gap's few squares by mirror strokes: RACE.DECENT.headwind. Assumed.
      - bilge: a lock pumped up: LOCK.COST_UP, the pilot's own reckoning of a go of Bilge (LOCK.WORK
        moves' worth). The user finds it quick.
      - piece: a Carpentry piece fitted (the crane's thirteen, CRANE.PARTS; a hit's patch, PATCH.PIECES):
        4 s. Assumed; the user finds Carpentry quick.
      - nav: the starlit door's two small constellations: 53 moves for the planner bot
        (tools/nav-bots.mjs, DOOR=1), at 1.2 s a move.
      - load: a shot loaded by Gunnery: 20 s. Assumed; the user: "just loading the guns and gunning
        takes a long time". */
  PUZZLE: { combo: RACE.DECENT.guns, vegas: RACE.DECENT.whirls, row: RACE.DECENT.headwind, bilge: LOCK.COST_UP, piece: 4, nav: 53 * 1.2, load: 20 },
  /** A Vegas's chance to come off, a go, by skill; the next go after one that doesn't takes this much of
      a fresh one's time; and the goes before she gives up and sails on. Assumed. */
  VEGAS: { decent: 0.55, good: 0.7, great: 0.85 } as Record<Skill, number>,
  RETRY: 0.6,
  TRIES: 3,
  /** Seconds back at the mouth after a Vegas that didn't come off: the whirlpools' winds (about ten
      squares at the trade winds' pace, and the whirl); the tunnel's draught (DOOR.BACK). */
  BACK: { whirls: 10 * SAIL.PUSH + 2, door: DOOR.BACK },
  /** How much of a Vegas's board a hit costs her, built so far. Assumed. */
  HIT_LOSS: 0.5,
  /** How often a broadside fired as she goes by a racer sitting still lands, by skill (it's the timing).
      Assumed. */
  AIM: { decent: 0.6, good: 0.75, great: 0.9 } as Record<Skill, number>,
  /** Seconds a bot waits her turn at a lock or the crane before she gives up and goes the long way. */
  WAIT: 20,
  /** The gun gap's guns as the bots meet them (their own numbers are the checkpoint's, CHECK): the
      chance she's holed sailing through square by square (measured with the helm and GunGap, 11 Nov:
      once, as the user found, "one hit, one patch"; patched, she's spared a while, and she's through);
      sailing past it the long way (gun 0's way-in mark is on the first leg's second row, and the pilot's
      line from the buoy runs over it: measured, holed; steered along the first row, she isn't); and an
      aimed shot from a roused gun, on a sloop under way (in the air CHECK.AIMED seconds: she's often
      gone; assumed) and on one sitting still. */
  GAP: { RUN_HIT: 0.9, LONG_HIT: 0.8, AIMED_HIT: 0.3, STILL_HIT: 0.95 },
  /** The squares-worth of the heavy combo that rushes her past the guns (src/den-sailing.ts). */
  COMBO: runFor(4),
  /** A racer counts as ahead of another stopped in the open once she's this many seconds round the long
      way past her (a square: alongside isn't ahead). */
  AHEAD: 1.6,
};

/* ---- The course as the bots sail it ---- */

const segs = RIVAL_ROUTE.slice(1).map((b, i) => { const a = RIVAL_ROUTE[i]; return { a, b, len: Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]) }; });
const laneLen = segs[segs.length - 1].len, sailLen = segs.slice(0, -1).reduce((n, x) => n + x.len, 0);
/** Seconds a square, the long way (the trade wind home at its own pace). */
export const PACE = (SIM.LONG - laneLen * SAIL.PUSH) / sailLen;
const secsOf = (i: number) => segs[i].len * (i === segs.length - 1 ? SAIL.PUSH : PACE);

/** Where she is, `tau` seconds round the long way: on a leg, its first row, facing along it. */
export function routePose(tau: number): Pose {
  let left = Math.max(0, tau);
  for (let i = 0; i < segs.length; i++) {
    const { a, b } = segs[i], secs = secsOf(i);
    if (left <= secs || i === segs.length - 1) {
      const u = Math.min(1, left / secs);
      const dc = Math.sign(b[0] - a[0]), dr = Math.sign(b[1] - a[1]), d = dr > 0 ? 0 : dc > 0 ? 1 : dr < 0 ? 2 : 3;
      const c = a[0] + (b[0] - a[0]) * u, r = a[1] + (b[1] - a[1]) * u;
      return { c, r: dr === 0 && i < segs.length - 1 ? Math.floor(r) : r, d };
    }
    left -= secs;
  }
  return { c: RC.FINISH[0], r: RC.FINISH[1], d: 2 };
}
/** How far round the long way (seconds) she is at column `c` on stretch `s`. */
export function tauAt(s: number, c: number): number {
  const row = S[s].r + 0.5;
  let t = 0;
  for (let i = 0; i < segs.length; i++) {
    const { a, b } = segs[i];
    if (a[1] === row && b[1] === row && Math.min(a[0], b[0]) <= c && c <= Math.max(a[0], b[0])) return t + Math.abs(c - a[0]) * PACE;
    t += secsOf(i);
  }
  throw new Error(`no stretch ${s} at ${c}`);
}

export interface Cut {
  id: CutId;
  /** Where she leaves the long way and rejoins it (seconds round it). */
  tIn: number;
  tOut: number;
  /** Her own trip through, in seconds; and what it saves her over the long way between. */
  trip: number;
  saves: number;
  /** Where she sits while she puzzles there, if she stops. */
  at: Pose;
  sheltered: boolean;
  /** One racer's at a time (src/den-racers.ts). */
  spot: Spot | null;
}
const cut = (id: CutId, s: number, c: number, to: number, trip: number, at: Pose, spot: Spot | null = null): Cut => {
  const tIn = tauAt(s, c), tOut = tauAt(to, c);
  return { id, tIn, tOut, trip, saves: tOut - tIn - trip, at, sheltered: sheltered(at.c, at.r), spot };
};
const G = RC.GUNS.gap, B = RC.HEADWIND, M = RC.WHIRLS.MOUTH, L = RC.LOCKS, E = RC.CRANE, D = RC.DOOR;
/** The course's shortcuts, as the bots take them. The gap's trip is the helm's through it (measured
    11 Nov: 7.25 s), the locks' too (10 s, pumped at once); the headwind's rowed at the oars' pace; the
    others' gusts, the crane's trip (TRIP) and the tunnel's (DOOR.TRIP). Stopped short of the gap, she
    waits two squares before it, off its marks, on the leg's second row. */
export const CUTS: Record<CutId, Cut> = {
  guns: cut('guns', 0, G[0], 1, 7.25, { c: G[0] - 2, r: S[0].r + 1, d: 1 }),
  headwind: cut('headwind', 1, B[0][0], 2, 1 + 5 * WIND.OARS, { c: B[0][0], r: B[0][1], d: 0 }),
  whirls: cut('whirls', 2, M.c, 3, runFor(RUN.VEGAS) * SAIL.PUSH, { ...M }),
  locks: cut('locks', 3, L[0].at[0], 4, 10, { c: L[0].at[0], r: L[0].at[1], d: 0 }, 'lock-up'),
  crane: cut('crane', 4, E.LEDGE[0], 5, TRIP, { c: E.LEDGE[0], r: E.LEDGE[1], d: 1 }, 'crane'),
  door: cut('door', 1, D.OFF[0][0], 4, DOOR.TRIP, { c: D.OFF[0][0], r: D.OFF[0][1], d: 0 }),
};
/** Where the gun gap's first gun's mark crosses the long way. */
const GAP_T = tauAt(0, G[0]);
/** Pieces in the crane's three frames (about five squares a piece). */
const CRANE_PIECES = Math.round(CRANE.PARTS.reduce((n, p) => n + p.rows.join('').split('#').length - 1, 0) / 5);

/* ---- The bots ---- */

/** A route: the shortcuts it takes (each it comes to, in order), and how it takes the gun gap. */
export interface Route { name: string; cuts: CutId[]; gap?: 'run' | 'combo' | 'shot' }
export const ROUTES: Route[] = [
  { name: 'long', cuts: [] },
  { name: 'gap-run', cuts: ['guns'], gap: 'run' },
  { name: 'gap-combo', cuts: ['guns'], gap: 'combo' },
  { name: 'gap-shot', cuts: ['guns'], gap: 'shot' },
  { name: 'headwind', cuts: ['headwind'] },
  { name: 'whirls', cuts: ['whirls'] },
  { name: 'locks', cuts: ['locks'] },
  { name: 'crane', cuts: ['crane'] },
  { name: 'door', cuts: ['door'] },
  { name: 'every', cuts: ['guns', 'headwind', 'whirls', 'locks', 'crane'], gap: 'combo' },
];
/** A racing style: whether she fires on a racer sitting still as she goes by, whether she loads more by
    Gunnery once she's fired hers (instead of Sailing on the pilot), and how near behind (seconds) another
    can be for her still to stop in the open (none: she stops whatever). */
export interface Style { name: string; fire: boolean; reload?: boolean; caution?: number }
export const STYLES: Style[] = [
  { name: 'peaceful', fire: false },
  { name: 'opportunist', fire: true },
  { name: 'aggressive', fire: true, reload: true },
  { name: 'cautious', fire: true, caution: 30 },
];
const byName = <T extends { name: string }>(list: T[], name: string): T => {
  const x = list.find((y) => y.name === name);
  if (!x) throw new Error(`no ${name}`);
  return x;
};
export const route = (name: string): Route => byName(ROUTES, name);
export const style = (name: string): Style => byName(STYLES, name);

/** The course's next pass, as the simulation would have it (RACE.md §8, "Simulation"): what each shortcut
    should save, and the long way clear of the gun gap's marks. The race's balance test (tests/race-sim.test.ts)
    races on it till the course is laid to it (RACE.DECENT then takes these, and tests/den-race.test.ts
    holds the course to them); then the test races on the course as laid, and this goes. */
export const NEXT: Pick<SimOptions, 'saves' | 'longMark'> = {
  saves: { guns: 10, headwind: 30, whirls: 46, locks: 24, crane: 37, door: 85 },
  longMark: false,
};

/** A racer: her route, style and skill. */
export interface Entrant { route: Route; style: Style; skill: Skill }
/** Back yourself on your puzzles (RACE.md §1): a racer takes the route of the puzzle she's best at, a
    level better at it than at the rest (the long way's is Sailing on the pilot, the gap's its combo, its
    Gunnery or the patches as she runs it). Every shortcut at once is an all-rounder's: no better at any. */
export const bestAt = (e: Entrant): Skill => (e.route.name === 'every' ? e.skill : SKILLS[Math.min(SKILLS.length - 1, SKILLS.indexOf(e.skill) + 1)]);

/** A race's set-up: its racers, in starting order, and what's being tried: the gap's guns' rule, any
    shortcut's saving changed (a course before it's laid), Sailing on the pilot or not. */
export interface SimOptions {
  racers: Entrant[];
  seed: number;
  /** The gun gap's guns: RACE.GAP.MODE by default. */
  mode?: 'shared' | 'hits';
  /** Seconds each shortcut saves, instead of the course's. */
  saves?: Partial<Record<CutId, number>>;
  /** Whether the long way past the gun gap runs over its first gun's mark (as it's laid: true). */
  longMark?: boolean;
  /** Sailing on the pilot whenever she's free (SIM.CHAIN): on by default. */
  chains?: boolean;
  /** Shots each racer starts with (FIELD.SHOTS by default). */
  shots?: number;
}

/** How each racer got on. */
export interface RacerResult {
  route: string;
  style: string;
  skill: Skill;
  start: number;
  time: number;
  place: number;
  hitsTaken: number;
  hitsGiven: number;
  /** Each shortcut she went for: done or given up, and what it saved her (seconds; less than nothing if
      it cost her), the Sailing she'd have done meanwhile counted against it. */
  cuts: { id: CutId; done: boolean; saved: number }[];
  /** Each time she stopped in the open to puzzle: her place in the field then (0 leading), out of how
      many still racing, and whether she was hit there. */
  exposed: { id: CutId; rank: number; of: number; hit: boolean }[];
}

type Mode = 'sail' | 'stop' | 'wait' | 'trip' | 'daze' | 'done';
interface Bot {
  i: number; route: Route; style: Style; skill: Skill; best: Skill; pace: number;
  tau: number; mode: Mode; was: Mode;
  cut: Cut | null; stage: number; work: number; full: number; tries: number;
  /** Seconds since she turned off the long way for the shortcut she's on; Sailing she's missed. */
  since: number; lost: number;
  move: { kind: 'combo' | 'load'; left: number } | null; combo: boolean; daze: number; trip: number; waited: number;
  done: Set<CutId>; res: RacerResult; stop: RacerResult['exposed'][number] | null; inLine: Set<number>;
}

const STATE: Record<Mode, RacerState> = { sail: 'sailing', stop: 'puzzling', wait: 'waiting', trip: 'carried', daze: 'dazed', done: 'finished' };
let sea: Sea | null = null;
/** The den's sea, the race's course on it (one, made once). */
const SEA = (): Sea => (sea ??= new Sea(9));

/** One race, start to finish: each racer's result, in starting order. */
export function simulate(o: SimOptions): RacerResult[] {
  const rand = seeded(o.seed), mode = o.mode ?? RACE.GAP.MODE, chains = o.chains ?? true;
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const draw = (mean: number, skill: Skill) => mean * SIM.SKILL[skill] * Math.exp(SIM.SPREAD * gauss() - SIM.SPREAD ** 2 / 2);
  const cuts = Object.fromEntries(Object.entries(CUTS).map(([k, c]) => {
    const saves = o.saves?.[k as CutId];
    return [k, saves === undefined ? c : { ...c, saves, tOut: c.tIn + c.trip + saves }];
  })) as Record<CutId, Cut>;
  const field = new Field(o.racers.map((r) => `${r.route.name}/${r.style.name}`), SEA(), 0);
  field.start();
  if (o.shots !== undefined) for (const r of field.racers) r.shots = o.shots;
  const bots: Bot[] = o.racers.map((r, i) => ({
    i, route: r.route, style: r.style, skill: r.skill, best: bestAt(r), pace: 1 + SIM.STEER * gauss(), tau: -0.5 * i, mode: 'sail', was: 'sail',
    cut: null, stage: 0, work: 0, full: 0, tries: 0, since: 0, lost: 0, move: null, combo: false, daze: 0, trip: 0, waited: 0,
    done: new Set(), stop: null, inLine: new Set(),
    res: { route: r.route.name, style: r.style.name, skill: r.skill, start: i, time: 0, place: 0, hitsTaken: 0, hitsGiven: 0, cuts: [], exposed: [] },
  }));
  /** What a second of her time is worth in Sailing on the pilot (seconds round the long way). */
  const chainWorth = (b: Bot) => (chains ? SIM.CHAIN[b.route.name === 'long' ? b.best : b.skill] * (PACE - SAIL.PUSH) : 0);

  // The gap's guns: hits each has taken, quiet till, loading; roused; whom each has holed.
  const need = mode === 'shared' ? 1 : RACE.GAP.HARD;
  const guns = RC.GUNS.at.map((at) => ({ at, quiet: 0, hits: 0, wait: 0 }));
  let roused = false;
  const scored = new Set<string>();
  const live = (g: (typeof guns)[number]) => g.hits < CHECK.WRECK && g.quiet <= 0;
  const grace = new Map<number, number>();
  const shots = (b: Bot) => field.racers[b.i].shots;
  const patchTime = (b: Bot, skill = b.skill) => draw(PATCH.PIECES * SIM.PUZZLE.piece, skill);

  for (const b of bots) {
    if (b.route.gap === 'combo') b.move = { kind: 'combo', left: draw(SIM.PUZZLE.combo, b.best) };
    if (b.route.gap === 'shot' && shots(b) < 2 * need) b.move = { kind: 'load', left: draw(SIM.PUZZLE.load, b.best) };
    if (b.route.gap) b.res.cuts.push({ id: 'guns', done: false, saved: 0 });
  }
  const rankOf = (b: Bot) => {
    const racing = bots.filter((x) => x.mode !== 'done');
    return { rank: racing.filter((x) => x !== b && x.tau > b.tau + SIM.AHEAD).length, of: racing.length };
  };
  const behind = (b: Bot, secs: number) => bots.some((x) => x !== b && x.mode !== 'done' && x.tau <= b.tau + SIM.AHEAD && x.tau > b.tau - secs);
  const hitBot = (t: Bot, by: number) => {
    if (!field.hit(t.i, by)) return false;
    t.res.hitsTaken++;
    if (by >= 0) bots[by].res.hitsGiven++;
    if (t.stop) t.stop.hit = true;
    if (t.mode === 'stop' && t.cut && (t.cut.id === 'whirls' || (t.cut.id === 'door' && t.stage === 1))) t.work += (t.full - t.work) * SIM.HIT_LOSS;
    if (t.mode !== 'daze') t.was = t.mode;
    t.mode = 'daze';
    t.daze = patchTime(t);
    return true;
  };
  const record = (b: Bot, id: CutId, done: boolean) => {
    const c = cuts[id];
    let r = b.res.cuts.find((x) => x.id === id && !x.done && x.saved === 0);
    if (!r) { r = { id, done, saved: 0 }; b.res.cuts.push(r); }
    r.done = done;
    // (what it saved: the long way between, less the time it took her from the turn-off, the sailing she
    // lost puzzling on the move for it, and the Sailing on the pilot she'd have done meanwhile)
    r.saved = (done ? c.tOut - c.tIn : 0) - b.since * (1 + chainWorth(b)) - b.lost;
    b.since = 0; b.lost = 0;
  };
  const go = (b: Bot, c: Cut, work: number) => {
    b.cut = c; b.stage = 0; b.work = work; b.full = work; b.tries = 0; b.mode = 'stop';
    if (!c.sheltered) { b.stop = { id: c.id, ...rankOf(b), hit: false }; b.res.exposed.push(b.stop); }
  };
  const firstWork = (b: Bot, c: Cut): number => {
    switch (c.id) {
      case 'headwind': return draw(SIM.PUZZLE.row, b.best);
      case 'whirls': return draw(SIM.PUZZLE.vegas, b.best);
      case 'locks': return draw(SIM.PUZZLE.bilge, b.best);
      case 'crane': return draw(CRANE_PIECES * SIM.PUZZLE.piece, b.best);
      case 'door': return draw(SIM.PUZZLE.nav, b.best);
      default: return 0;
    }
  };
  /** She's come to a shortcut she means to take: in, waiting her turn, or (cautious, someone close
      behind) on by. */
  const arrive = (b: Bot, c: Cut): boolean => {
    b.tau = c.tIn; b.since = 0; b.lost = 0;
    if (b.style.caution && !c.sheltered && behind(b, b.style.caution)) return false;
    if (c.spot && field.claim(b.i, c.spot) === 'wait') { b.cut = c; b.mode = 'wait'; b.waited = 0; return true; }
    go(b, c, firstWork(b, c));
    return true;
  };
  const through = (b: Bot, secs: number) => { b.mode = 'trip'; b.trip = secs; b.stop = null; };
  const out = (b: Bot) => {
    const c = b.cut!;
    if (c.spot) field.release(b.i, c.spot);
    if (c.id === 'door') field.under(b.i, 1, 4);
    b.done.add(c.id);
    record(b, c.id, true);
    b.tau = c.tOut; b.cut = null; b.mode = 'sail';
  };
  const giveUp = (b: Bot) => {
    const c = b.cut!;
    if (c.spot) { field.release(b.i, c.spot); field.leave(b.i, c.spot); }
    b.done.add(c.id);
    record(b, c.id, false);
    b.cut = null; b.mode = 'sail'; b.stop = null;
  };
  /** Through the gap, by her route: rushed past on her combo, past its guns quietened, or run. */
  const gap = (b: Bot) => {
    const c = cuts.guns;
    if (b.cut !== c) { b.tau = c.tIn; b.since = 0; b.cut = c; }
    if (b.route.gap === 'combo') {
      if (b.combo) return through(b, 1 + SIM.COMBO * SAIL.PUSH);
      // (not built yet: stop short, off its marks, and finish it)
      go(b, c, b.move?.left ?? 0); b.move = null; return;
    }
    if (b.route.gap === 'shot') {
      const short = 2 * need - shots(b);
      if (short > 0) {
        go(b, c, (b.move?.left ?? draw(SIM.PUZZLE.load, b.best)) + Math.max(0, short - 1) * draw(SIM.PUZZLE.load, b.best));
        b.move = null; return;
      }
      field.racers[b.i].shots -= 2 * need;
      for (const g of guns) { g.hits += need; g.quiet = g.hits >= CHECK.WRECK ? 0 : CHECK.QUIET; }
      roused = true;
      return through(b, c.trip);
    }
    // (run: a live gun that hasn't holed her yet may, once, as she goes through square by square)
    let secs = c.trip;
    const g = guns.findIndex((x, k) => live(x) && !scored.has(`${k},${b.i}`));
    if (g >= 0 && rand() < SIM.GAP.RUN_HIT) { scored.add(`${g},${b.i}`); secs += patchTime(b, b.best); b.res.hitsTaken++; }
    through(b, secs);
  };
  /** A puzzle done at a shortcut: through, or (a Vegas) through if it comes off. */
  const solved = (b: Bot) => {
    const c = b.cut!;
    if (c.id === 'guns') {
      b.stop = null;
      if (b.route.gap === 'combo') b.combo = true;
      else field.load(b.i, 2 * need - shots(b));
      return gap(b);
    }
    if (c.id === 'door' && b.stage === 0) { b.stage = 1; b.work = b.full = draw(SIM.PUZZLE.vegas, b.best); return; }
    if ((c.id === 'whirls' || c.id === 'door') && rand() >= SIM.VEGAS[b.best]) {
      if (++b.tries >= SIM.TRIES) return giveUp(b);
      b.work = b.full = SIM.BACK[c.id] + draw(SIM.PUZZLE.vegas * SIM.RETRY, b.best);
      return;
    }
    through(b, c.trip);
  };

  const LIMIT = SIM.LONG * 4, dt = SIM.DT;
  while (field.state === 'on' && field.t < LIMIT) {
    field.tick(dt);
    for (const g of guns) { g.quiet = Math.max(0, g.quiet - dt); g.wait = Math.max(0, g.wait - dt); }
    for (const [k, v] of grace) grace.set(k, v - dt);

    for (const b of bots) {
      if (b.mode === 'done') continue;
      if (b.cut) b.since += dt;
      if (b.mode === 'daze') {
        b.daze -= dt;
        if (b.daze <= 0) { field.patched(b.i); b.mode = b.was; grace.set(b.i, SAIL.GRACE); }
      } else if (b.mode === 'trip') {
        b.trip -= dt;
        if (b.trip <= 0) out(b);
      } else if (b.mode === 'wait') {
        b.waited += dt;
        if (field.holder(b.cut!.spot!) === b.i) go(b, b.cut!, firstWork(b, b.cut!));
        else if (b.waited > SIM.WAIT) giveUp(b);
      } else if (b.mode === 'stop') {
        b.work -= dt;
        if (b.work <= 0) solved(b);
      } else if (b.mode === 'sail') {
        // On the pilot: a combo held for the gap, or a shot loaded, slows her a little; otherwise her
        // Sailing's gusts carry her on.
        let speed = 1 + chainWorth(b);
        if (!b.move && b.style.reload && shots(b) < FIELD.SHOTS) b.move = { kind: 'load', left: draw(SIM.PUZZLE.load, b.skill) };
        if (b.move) {
          speed = SIM.OVERLAP;
          b.move.left -= dt;
          if (b.move.left <= 0) {
            if (b.move.kind === 'combo') { b.combo = true; b.move = null; }
            else {
              field.load(b.i);
              const short = b.route.gap === 'shot' && !b.done.has('guns') ? 2 * need - shots(b) : b.style.reload ? FIELD.SHOTS - shots(b) : 0;
              b.move = short > 0 ? { kind: 'load', left: draw(SIM.PUZZLE.load, b.route.gap === 'shot' ? b.best : b.skill) } : null;
            }
          }
        }
        // (the Sailing she'd have done, held for the gap's puzzle, counts against the gap)
        if (b.move && b.route.gap && !b.done.has('guns')) b.lost += dt * (1 + chainWorth(b) - speed);
        const next = b.tau + (dt * speed) / b.pace;
        if (b.tau < GAP_T && next >= GAP_T) {
          if (b.route.gap) { gap(b); continue; }
          // (the long way past the gap runs over its first gun's mark)
          if ((o.longMark ?? true) && live(guns[0]) && !scored.has(`0,${b.i}`) && !((grace.get(b.i) ?? 0) > 0) && rand() < SIM.GAP.LONG_HIT) {
            scored.add(`0,${b.i}`); b.tau = next; hitBot(b, -1); continue;
          }
        }
        const due = b.route.cuts.map((id) => cuts[id]).filter((c) => c.id !== 'guns' && !b.done.has(c.id) && b.tau < c.tIn && next >= c.tIn).sort((x, y) => x.tIn - y.tIn)[0];
        if (due) {
          b.done.add(due.id);
          if (arrive(b, due)) continue;
        }
        b.tau = next;
        if (b.tau >= SIM.LONG) { b.mode = 'done'; field.home(b.i); }
      }
    }

    // Where each is, and what she's doing, for the field.
    for (const b of bots) {
      if (b.mode === 'done') continue;
      let at: Pose;
      if (b.mode === 'stop' || (b.mode === 'daze' && b.was === 'stop')) {
        at = { ...b.cut!.at };
        // (rowing up the headwind gap as she goes)
        if (b.cut!.id === 'headwind') at.r = B[Math.min(B.length - 1, Math.floor((1 - b.work / Math.max(1e-9, b.full)) * B.length))][1];
      } else if (b.mode === 'wait' || (b.mode === 'daze' && b.was === 'wait')) {
        // (waiting her turn on the leg, beside the way in)
        const c = b.cut!;
        at = c.id === 'locks' ? { c: c.at.c + 1, r: c.at.r - 1, d: 3 } : { ...c.at, c: c.at.c + 1 };
      } else {
        at = routePose(b.tau);
        if (b.mode === 'daze') at.r = Math.floor(at.r) + 1;
      }
      for (const e of field.move(b.i, at)) if (e.kind === 'finish') b.mode = 'done';
      field.racers[b.i].state = STATE[b.mode];
    }

    // The gap's guns, roused: an aimed shot on a racer in reach each time one's loaded, till nobody's near.
    if (roused) {
      const near = (b: Bot, c: number, r: number, n: number) => Math.max(Math.abs(field.racers[b.i].pose.c - c), Math.abs(field.racers[b.i].pose.r - r)) <= n;
      if (!bots.some((b) => b.mode !== 'done' && near(b, G[0], G[1], RACE.SIGHT + 1))) roused = false;
      for (const g of guns) {
        if (!roused || !live(g) || g.wait > 0) continue;
        const t = bots.find((b) => (b.mode === 'sail' || b.mode === 'stop' || b.mode === 'wait') && !((grace.get(b.i) ?? 0) > 0) && near(b, g.at[0], g.at[1], CHECK.REACH));
        if (!t) continue;
        g.wait = RACE.GAP.AIMED_RELOAD;
        if (rand() < (t.mode === 'sail' ? SIM.GAP.AIMED_HIT : SIM.GAP.STILL_HIT)) hitBot(t, -1);
      }
    }

    // Broadsides: each that means to fires on a racer sitting still, once as it goes by, if it has a
    // shot (not the gap's shot, keeping hers for its guns).
    for (const b of bots) {
      if (b.mode !== 'sail' || !b.style.fire || (b.route.gap === 'shot' && !b.done.has('guns'))) continue;
      const now = new Set<number>();
      for (const side of ['L', 'R'] as const) {
        const { hit } = field.aim(b.i, side);
        if (hit < 0) continue;
        now.add(hit);
        const t = bots[hit];
        if (b.inLine.has(hit) || !(t.mode === 'stop' || t.mode === 'wait') || shots(b) <= 0) continue;
        const lands = rand() < SIM.AIM[b.skill];
        field.fire(b.i, side, false);
        if (lands) hitBot(t, b.i);
      }
      b.inLine = now;
    }
  }
  return bots.map((b) => ({ ...b.res, time: field.racers[b.i].time ?? LIMIT, place: field.racers[b.i].place ?? bots.length }));
}

/* ---- Many races ---- */

export interface Tally { n: number; wins: number; time: number; hitsTaken: number; hitsGiven: number }
export interface Report {
  races: number;
  size: number;
  byRoute: Record<string, Tally>;
  byStyle: Record<string, Tally>;
  bySkill: Record<string, Tally>;
  /** Stopped in the open, by her place then: leading, in the pack, last. */
  byPosition: Record<'leader' | 'pack' | 'last', { n: number; hit: number; wins: number }>;
  /** Each shortcut: how often it was gone for, done, and what it saved on average, by skill. */
  cuts: Record<string, { tried: number; done: number; saved: Record<Skill, { n: number; secs: number }> }>;
}

/** A standard field of `size` from seed `seed`: each racer a route drawn at random (no two alike), a
    style and a skill drawn at random, in a random starting order. */
export function lineUp(size: number, seed: number, routes: Route[] = ROUTES, styles: Style[] = STYLES): Entrant[] {
  const rand = seeded(seed * 7919 + 13), left = [...routes], out: Entrant[] = [];
  for (let k = 0; k < size; k++) {
    out.push({
      route: left.splice(Math.floor(rand() * left.length), 1)[0],
      style: styles[Math.floor(rand() * styles.length)],
      skill: SKILLS[Math.floor(rand() * SKILLS.length)],
    });
  }
  return out;
}

export type RunOptions = Omit<SimOptions, 'racers' | 'seed'> & { seed?: number; routes?: Route[]; styles?: Style[] };
/** Races `races` standard fields of `size`, seeds from `seed` (1) up, and tallies them. */
export function run(races: number, size: number, opts: RunOptions = {}): Report {
  const rep: Report = {
    races, size, byRoute: {}, byStyle: {}, bySkill: {}, cuts: {},
    byPosition: { leader: { n: 0, hit: 0, wins: 0 }, pack: { n: 0, hit: 0, wins: 0 }, last: { n: 0, hit: 0, wins: 0 } },
  };
  const tally = (t: Record<string, Tally>, k: string, r: RacerResult) => {
    const x = (t[k] ??= { n: 0, wins: 0, time: 0, hitsTaken: 0, hitsGiven: 0 });
    x.n++; x.wins += r.place === 1 ? 1 : 0; x.time += r.time; x.hitsTaken += r.hitsTaken; x.hitsGiven += r.hitsGiven;
  };
  for (let k = 0; k < races; k++) {
    const seed = (opts.seed ?? 1) + k;
    for (const r of simulate({ ...opts, racers: lineUp(size, seed, opts.routes, opts.styles), seed })) {
      tally(rep.byRoute, r.route, r);
      tally(rep.byStyle, r.style, r);
      tally(rep.bySkill, r.skill, r);
      for (const e of r.exposed) {
        const p = rep.byPosition[e.rank === 0 ? 'leader' : e.rank === e.of - 1 ? 'last' : 'pack'];
        p.n++; p.hit += e.hit ? 1 : 0; p.wins += r.place === 1 ? 1 : 0;
      }
      for (const c of r.cuts) {
        const x = (rep.cuts[c.id] ??= { tried: 0, done: 0, saved: { decent: { n: 0, secs: 0 }, good: { n: 0, secs: 0 }, great: { n: 0, secs: 0 } } });
        x.tried++; x.done += c.done ? 1 : 0;
        x.saved[r.skill].n++; x.saved[r.skill].secs += c.saved;
      }
    }
  }
  return rep;
}
