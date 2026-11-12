/* Pirate Den: the sloop race's course editor (12 Nov). TypeScript, compiled to js/race-editor.js; tested in
   tests/race-editor.test.ts. race-editor.html is the page and js/race-editor-view.js draws it (the course in
   2D, in the chart's look, and its side panel); js/race-balance.js races it in a Web Worker. This is its
   rules: what's on the course and where (each feature's squares, to click on), moving one, its sizes, what
   makes a course a race (src/race-course.ts, problems, and the water itself: waterProblems), the links (to
   share it, and to race it in 3D in the den), and the balance check's summary.

   The user (12 Nov): "having a map editor are going to be like the top of demands ... down to the details
   of how many it takes to clear each thing ... you'd need to be able to switch between 2D and 3D views."
   Mostly a 2D job: click a feature on the chart, drag it along its spit or nudge it, set its numbers in the
   side panel; a click takes the course into the den's own race, and a link back. */

import { layRace, type RaceLay } from './den-sail.js';
import { whirlpool } from './den-whirl.js';
import {
  BUOY_RANGE, COL_KEYS, DEFAULT_COURSE, DOOR_NAME, NAMES, PLACE, SIZES, SIZE_NAMES, CRANE_SIZES, encodeCourse, problems, rangeOf,
  type ColKey, type Course, type CraneSize, type SizeKey,
} from './race-course.js';
import type { CutId, Report, Skill } from './race-sim.js';
import type { BetId } from './den-gamble.js';

/** A thing on the course to select: a feature (by the column that places it), or a buoy (0 to 4). */
export type FeatureId = ColKey | `buoy${0 | 1 | 2 | 3 | 4}`;
export const BUOY_IDS: FeatureId[] = [0, 1, 2, 3, 4].map((i) => `buoy${i}` as FeatureId);
export const FEATURES: FeatureId[] = [...BUOY_IDS, ...COL_KEYS];
export const buoyOf = (id: FeatureId): number => (id.startsWith('buoy') ? Number(id.slice(4)) : -1);

/** What each is, in a line, for the side panel: its puzzle, and the size it's set by. */
export const ABOUT: Record<FeatureId, { name: string; what: string; sizes: (SizeKey | 'frames')[] }> = {
  buoy0: { name: 'Buoy 1', what: 'Where spit 1 ends: the long way rounds it here. In toward the start, and leg 1 and leg 2 are shorter.', sizes: [] },
  buoy1: { name: 'Buoy 2', what: 'Where spit 2 ends, on the left. Out toward the middle, and legs 2 and 3 are shorter.', sizes: [] },
  buoy2: { name: 'Buoy 3', what: 'Where spit 3 ends, on the right.', sizes: [] },
  buoy3: { name: 'Buoy 4', what: 'Where spit 4 ends, on the left. Leg 4\'s zigzag of headwinds goes with it.', sizes: [] },
  buoy4: { name: 'Buoy 5', what: 'Where spit 5 ends, on the right: the last bend before the run home.', sizes: [] },
  gun: { name: NAMES.gun, what: 'The gun gap through spit 1, a gun either side: rush it on a Quad, shoot its guns quiet, run it and be holed, or pay its guard.', sizes: ['coins'] },
  wreck: { name: NAMES.wreck, what: 'An old wreck in a notch off leg 1, sheltered: Treasure Haul brings up the coins to bribe the gate\'s guard.', sizes: ['coins'] },
  turn: { name: NAMES.turn, what: 'A gamble on leg 2: a whirlpool whose spin turns on a beat. Caught turning your way, it throws you down a cleft onto leg 3; the other way, back up to leg 1.', sizes: ['beat'] },
  head: { name: NAMES.head, what: 'Rowed through spit 2 against the wind (mirror strokes), its dog-leg at the far end.', sizes: [] },
  double: { name: NAMES.double, what: 'A small gap through spit 2, one wind blowing back across it: a Double hops it.', sizes: [] },
  mid: { name: NAMES.mid, what: 'A snake: a trade wind up through spit 2 and across leg 3. Hop it with a Double, or it sweeps you back to leg 2.', sizes: [] },
  whirl: { name: NAMES.whirl, what: 'Three whirlpools through spit 3: only a Sailing Vegas from its mouth carries you over (the spit\'s depth makes it a Vegas). Out in the open.', sizes: [] },
  forage: { name: NAMES.forage, what: 'A jam of logs across a gap in spit 3, cleared by Foraging from the notch in front of it, sheltered.', sizes: ['bundles'] },
  lock: { name: NAMES.lock, what: 'Up a lock and down another through spit 4, pumped by Bilge, a sheltered berth beside the way in.', sizes: ['clears'] },
  crane: { name: NAMES.crane, what: 'Built by Carpentry on a ledge in a notch off leg 5, a frame at a time: it swings you over onto the run home.', sizes: ['frames'] },
  triple: { name: NAMES.triple, what: 'A gap through spit 5, two winds blowing back across it: a Triple hops it.', sizes: [] },
  veil: { name: NAMES.veil, what: 'A gamble through spit 5: a coin toss blows you on to the run home, or back along leg 5.', sizes: ['veilOn'] },
  finish: { name: NAMES.finish, what: 'The line across the run home, between two towers.', sizes: [] },
};
/** The crane's frames, in words. */
export const FRAME_NAMES: Record<CraneSize, string> = { small: 'small (6 pieces)', standard: 'standard (13 pieces)', large: 'large (18 pieces)' };
export { SIZES, SIZE_NAMES, CRANE_SIZES };

const key = (c: number, r: number) => `${c},${r}`;
type Sq = [number, number];

/** The squares each feature takes on a laid course: to draw it picked out, and to pick it by a click. */
export function squaresOf(lay: RaceLay, id: FeatureId): Sq[] {
  const b = buoyOf(id);
  if (b >= 0) {
    // (its buoy, and the water round its spit's end)
    const s = lay.SPITS[b], [c] = lay.BUOYS[b].at, out: Sq[] = [];
    for (let r = s.r0; r <= s.r1; r++) for (const x of [c, c + (s.bend === 'R' ? 1 : -1)]) out.push([x, r]);
    return out;
  }
  const pool = (p: { at: Sq }) => whirlpool(p).squares as Sq[];
  switch (id as ColKey) {
    case 'gun': return [...lay.GUNS.way, ...lay.GUNS.at, ...lay.BRIBE.TOWERS, lay.BRIBE.GATE];
    case 'wreck': return [lay.BRIBE.NOTCH, lay.BRIBE.WRECK];
    case 'turn': return [...pool(lay.GAMBLES.TURN.POOL), ...lay.GAMBLES.TURN.CLEFT, ...lay.GAMBLES.TURN.UP.map(([c, r]): Sq => [c, r])];
    case 'head': return lay.HEADWIND;
    case 'double': return lay.DOUBLE.WAY;
    case 'mid': return lay.SNAKES.MID.map(([c, r]): Sq => [c, r]);
    case 'whirl': return [...lay.WHIRLS.POOLS.flatMap(pool), ...lay.WHIRLS.WINDS.map(([c, r]): Sq => [c, r]), [lay.WHIRLS.MOUTH.c, lay.WHIRLS.MOUTH.r]];
    case 'forage': return [lay.FORAGE.NOTCH, ...lay.FORAGE.BARRIER, ...lay.FORAGE.GAP];
    case 'lock': return [...lay.LOCKS.map((l) => l.at), ...lay.POUND.at, lay.BERTH];
    case 'crane': return [lay.CRANE.LEDGE, [lay.CRANE.LEDGE[0], lay.CRANE.LEDGE[1] + 1]];
    case 'triple': return lay.TRIPLE.map(([c, r]): Sq => [c, r]);
    case 'veil': return lay.GAMBLES.VEIL.WAY;
    case 'finish': return [lay.FINISH, [lay.FINISH[0], lay.FINISH[1] + 1]];
    default: return [];
  }
}

/** The feature at a square, if any (the smallest first, so the wreck's notch beats the gate's reach). */
export function featureAt(lay: RaceLay, c: number, r: number): FeatureId | null {
  const hit = FEATURES.map((id) => ({ id, sq: squaresOf(lay, id) })).filter((f) => f.sq.some(([x, y]) => x === c && y === r));
  hit.sort((a, b) => a.sq.length - b.sq.length);
  return hit[0]?.id ?? null;
}

/** Where a feature's column is, and where it may go (its spit, the legs either side, the rest round it). */
export function columnOf(k: Course, id: FeatureId): number { const b = buoyOf(id); return b >= 0 ? k.buoys[b] : k[id as ColKey]; }
export function limitsOf(k: Course, id: FeatureId): [number, number] { const b = buoyOf(id); return b >= 0 ? BUOY_RANGE(b) : rangeOf(k, id as ColKey); }

/** The course with a feature moved to column `c` (kept within its limits). */
export function moved(k: Course, id: FeatureId, c: number): Course {
  const [lo, hi] = limitsOf(k, id), to = Math.max(lo, Math.min(hi, Math.round(c))), b = buoyOf(id);
  if (lo > hi) return k;
  if (b >= 0) { const buoys = [...k.buoys]; buoys[b] = to; return { ...k, buoys }; }
  const out = { ...k, [id]: to } as Course;
  // (the veiled wind carries its way back with it)
  if (id === 'veil') out.veilBack = Math.max(k.buoys[3] + 1, Math.min(to - 2, k.veilBack + to - k.veil));
  return out;
}

/** The course with a size set (kept within what it may be). */
export function sized(k: Course, size: SizeKey | 'frames' | 'veilBack', v: number | string): Course {
  if (size === 'frames') return CRANE_SIZES.includes(v as CraneSize) ? { ...k, frames: v as CraneSize } : k;
  if (size === 'veilBack') return { ...k, veilBack: Math.max(k.buoys[3] + 1, Math.min(k.veil - 2, Math.round(Number(v)))) };
  const { lo, hi, step } = SIZES[size], n = Number(v);
  if (!Number.isFinite(n)) return k;
  return { ...k, [size]: Math.max(lo, Math.min(hi, lo + Math.round((n - lo) / step) * step)) };
}

/** The course's water as she sails it, ignoring the winds: whether the long way round the buoys is open
    from the starting line to the finish, every buoy on it; and whether every shortcut's way in is water
    she can get to. (problems keeps everything inside its spit; this checks the water itself.) */
export function waterProblems(lay: RaceLay): string[] {
  const land = new Set([...lay.LAND.flat(), ...lay.FORAGE.BARRIER].map(([c, r]) => key(c, r)));
  const R1 = lay.FINISH[1] + 1, W = 27;
  const water = (c: number, r: number) => c >= 0 && c < W && r > lay.R0 && r <= R1 && !land.has(key(c, r));
  // (the long way: a spit's rows only round its end, past its buoy)
  const inSpit = (c: number, r: number) => lay.SPITS.some((s, i) => r >= s.r0 && r <= s.r1 && (s.bend === 'R' ? c < lay.BUOYS[i].at[0] : c > lay.BUOYS[i].at[0] + 1));
  const reach = (ok: (c: number, r: number) => boolean) => {
    const seen = new Set<string>(), todo: Sq[] = [];
    for (let c = lay.LINE.c0; c <= lay.LINE.c1; c++) if (ok(c, lay.LINE.r)) { seen.add(key(c, lay.LINE.r)); todo.push([c, lay.LINE.r]); }
    while (todo.length) {
      const [c, r] = todo.pop()!;
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = c + a, y = r + b;
        if (ok(x, y) && !seen.has(key(x, y))) { seen.add(key(x, y)); todo.push([x, y]); }
      }
    }
    return seen;
  };
  const out: string[] = [];
  const long = reach((c, r) => water(c, r) && !inSpit(c, r));
  if (!long.has(key(...lay.FINISH))) out.push('The long way round the buoys doesn\'t reach the finish line.');
  lay.BUOYS.forEach((b, i) => { if (!long.has(key(...b.at))) out.push(`Buoy ${i + 1} isn't on the long way's water.`); });
  const all = reach(water);
  const ways: [string, Sq][] = [
    [NAMES.gun, lay.GUNS.way[0]], [NAMES.wreck, lay.BRIBE.NOTCH], [NAMES.head, lay.HEADWIND[0]], [NAMES.double, lay.DOUBLE.WAY[0]],
    [NAMES.whirl, [lay.WHIRLS.MOUTH.c, lay.WHIRLS.MOUTH.r]], [NAMES.forage, lay.FORAGE.NOTCH], [NAMES.lock, lay.BERTH], [NAMES.crane, lay.CRANE.LEDGE],
    [NAMES.triple, [lay.TRIPLE[0][0], lay.TRIPLE[0][1] - 1]], [NAMES.veil, lay.GAMBLES.VEIL.WAY[0]], [NAMES.turn, lay.GAMBLES.TURN.IN],
  ];
  for (const [n, sq] of ways) if (!all.has(key(...sq))) out.push(`${n} can't be sailed to.`);
  return out;
}

/** Everything wrong with a course (none: it's a race, to share and to sail). */
export const check = (k: Course): string[] => {
  const p = problems(k);
  return p.length ? p : waterProblems(layRace(k, true));
};

/** The links: to this page with the course in it (to share), and to the den's race on it (its 3D). */
export const shareLink = (base: string, k: Course): string => `${base.split('?')[0].split('#')[0]}?course=${encodeCourse(k)}`;
export const raceLink = (k: Course): string => `den.html?at=race&course=${encodeCourse(k)}`;
/** The den's own course, to start from or go back to. */
export const fresh = (): Course => ({ ...DEFAULT_COURSE, buoys: [...DEFAULT_COURSE.buoys] });

/* ---- The balance check: the course raced by the simulation's bots (src/race-sim.ts, in a Web Worker:
   js/race-balance.js), a few hundred races of four, and what it shows, as the chart does: each way
   round's wins, and what each shortcut saves. ---- */

/** Each way round, as the balance check names it (the simulation's routes: src/race-sim.ts). */
export const ROUTE_NAMES: Record<string, string> = {
  long: 'The long way (hopping the zigzag)', 'gap-run': 'Gun gap, run a square at a time', 'gap-combo': 'Gun gap, rushed on a Quad',
  'gap-shot': 'Gun gap, its guns shot quiet', bribe: 'Gun gap, its guard bribed', headwind: 'Headwind gap, rowed',
  doubles: 'The Double\'s and Triple\'s gaps', whirls: 'Whirlpools, a Vegas', forage: 'Barrier, Foraging', locks: 'Locks, Bilge',
  crane: 'Crane, Carpentry', door: 'The starlit door', every: 'Every shortcut it comes to',
};
/** Each shortcut, as the balance check names it. */
export const CUT_NAMES: Partial<Record<CutId, string>> = {
  guns: NAMES.gun, headwind: NAMES.head, double: NAMES.double, whirls: NAMES.whirl, forage: NAMES.forage,
  locks: NAMES.lock, crane: NAMES.crane, triple: NAMES.triple, zigzag: 'Leg 4\'s zigzag, hopped', door: DOOR_NAME,
};
/** Which way round each feature is (to put its wins on the chart). */
export const ROUTE_OF: Partial<Record<FeatureId, string>> = {
  gun: 'gap-combo', wreck: 'bribe', head: 'headwind', double: 'doubles', triple: 'doubles', whirl: 'whirls', forage: 'forage', lock: 'locks', crane: 'crane',
};

export interface Balance {
  races: number;
  /** Fair share of wins in a field this size. */
  fair: number;
  /** Seconds the long way takes, no puzzle. */
  long: number;
  routes: { id: string; name: string; wins: number; n: number; ok: boolean }[];
  cuts: { id: CutId; name: string; saves: number; by: Record<Skill, number | null> }[];
  bets: { id: BetId; name: string; on: number; back: number; taken: number; came: number }[];
}
/** The balance test's band (tests/race-sim.test.ts): a way round winning between half and 1.6 times its fair share. */
export const BAND: [number, number] = [0.5, 1.6];

/** Two runs of races added together (the check runs them a batch at a time, to show how far it's got). */
export function mergeReports(a: Report, b: Report): Report {
  type Tallies = Report['byRoute'];
  const tallies = (x: Tallies, y: Tallies): Tallies => {
    const out = JSON.parse(JSON.stringify(x)) as Record<string, Record<string, number>>;
    for (const [k, t] of Object.entries(y as unknown as Record<string, Record<string, number>>)) {
      const o = (out[k] ??= Object.fromEntries(Object.keys(t).map((f) => [f, 0])));
      for (const [f, v] of Object.entries(t)) o[f] = (o[f] ?? 0) + v;
    }
    return out as unknown as Tallies;
  };
  const cuts = JSON.parse(JSON.stringify(a.cuts)) as Report['cuts'];
  for (const [id, c] of Object.entries(b.cuts)) {
    const o = (cuts[id] ??= { tried: 0, done: 0, saved: { decent: { n: 0, secs: 0 }, good: { n: 0, secs: 0 }, great: { n: 0, secs: 0 } } });
    o.tried += c.tried; o.done += c.done;
    for (const s of ['decent', 'good', 'great'] as Skill[]) { o.saved[s].n += c.saved[s].n; o.saved[s].secs += c.saved[s].secs; }
  }
  const bets = JSON.parse(JSON.stringify(a.bets)) as Report['bets'];
  for (const [id, t] of Object.entries(b.bets) as [BetId, Report['bets'][BetId]][]) {
    const o = bets[id];
    o.taken += t.taken; o.on += t.on; o.wins += t.wins;
    for (const s of ['decent', 'good', 'great'] as Skill[]) { o.saved[s].n += t.saved[s].n; o.saved[s].secs += t.saved[s].secs; }
  }
  return {
    ...a, races: a.races + b.races,
    byRoute: tallies(a.byRoute, b.byRoute), byStyle: tallies(a.byStyle, b.byStyle), bySkill: tallies(a.bySkill, b.bySkill), bySpot: tallies(a.bySpot, b.bySpot),
    cuts, bets,
  };
}

/** What the check shows, from its races (`rep`), the course's long way (`long`, seconds), what each
    shortcut saves on it (`saves`, CUTS) and each gamble each way (`bets`, BET_SAVES). Only the ways round
    and shortcuts named here (ROUTE_NAMES, CUT_NAMES). */
export function balanceOf(rep: Report, long: number, saves: Partial<Record<CutId, number>>, bets: Record<BetId, { on: number; back: number }>): Balance {
  const fair = 1 / rep.size;
  const routes = Object.entries(rep.byRoute).filter(([id]) => id in ROUTE_NAMES).map(([id, t]) => {
    const wins = t.n ? t.wins / t.n : 0;
    return { id, name: ROUTE_NAMES[id], wins, n: t.n, ok: wins >= BAND[0] * fair && wins <= BAND[1] * fair };
  }).sort((a, b) => b.wins - a.wins);
  const cuts = (Object.keys(CUT_NAMES) as CutId[]).filter((id) => saves[id] !== undefined).map((id) => {
    const c = rep.cuts[id], by = Object.fromEntries((['decent', 'good', 'great'] as Skill[]).map((s) => [s, c && c.saved[s].n ? c.saved[s].secs / c.saved[s].n : null])) as Record<Skill, number | null>;
    return { id, name: CUT_NAMES[id]!, saves: saves[id]!, by };
  });
  const betNames: Record<BetId, string> = { turn: NAMES.turn, veil: NAMES.veil };
  return {
    races: rep.races, fair, long, routes, cuts,
    bets: (['turn', 'veil'] as BetId[]).map((id) => ({ id, name: betNames[id], on: bets[id].on, back: bets[id].back, taken: rep.bets[id].taken, came: rep.bets[id].taken ? rep.bets[id].on / rep.bets[id].taken : 0 })),
  };
}

/** A time as the clock shows it, to the second: 3:42. */
export const mmss = (secs: number): string => { const s = Math.round(secs); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export { PLACE };
