/* Pirate Den: planning your race route, then puzzling it through (RACE.md §5; agreed 12 Nov, built 13 Nov).
   TypeScript, compiled to js/race-plan.js; tested in tests/race-plan.test.ts. Pure: no 3D, no DOM.

   The user (12 Nov): "if we are supposed to be puzzling as you're going through as a person, some way of like
   pre-planning your route through the course ... and then the puzzling's kind of the executing phase", and,
   agreeing it: "I like that plan idea ... you plan by choosing those options, that works. That's really simple
   and easy." Then (13 Nov): "it should all be in the same thing. So if you're watching the race, you should
   ... be able to see what people's plans are ... online, local should all be the same."

   So every racer races by a plan, the one module for all of them: your sloop, your rivals, the simulation's
   bots, the race watched, and racers online.
   - A plan is a choice for each leg (LEGS): the long way, or one of that leg's shortcuts. Not a drawn line: the
     pilot knows the water. It starts as the long way everywhere (longPlan), and it can be changed at any time
     (choose, cycle), hidden from the other racers.
   - What a plan takes (cutsOf: the shortcuts, in course order; gapOf: how it takes the gun gap) is what the
     simulation's bots race by (src/race-sim.ts: a route is a named plan; a bot changes hers when she gives a
     shortcut up), and what the pilot sails you by.
   - Where the pilot heads next (goalOf, pinOf): the long way's next pin, or the plan's next shortcut's way in
     (WAY_IN), the same rule for every racer, weighed by how far round the long way she's got. The moves there
     are read off the pilot's chart (src/race-pilot.ts, PilotChart), never worked out another way.
   - The obstacles make the stops, never the plan (Pilot, for a sloop sailed by a person): each shortcut and
     each hop has a spot she stops at (STOPS), the board it needs put up there; she goes on once it's done (a
     gust's carried her over, the crane's swung her across, the lock's pumped). A Double or Triple held and
     thrown on the way in (the gaps' mouths line her up: src/den-sailing.ts, lineUp) is used without stopping. */

import { LAY, SAIL, Sea, type Helm, type Move, type Pose } from './den-sail.js';
import { PilotChart } from './race-pilot.js';
import { DOOR } from './den-door.js';
import { fieldFor } from './start-field.js';
import { LONG_ROUTE, routeRow } from './den-race.js';

const RC = LAY.RACE, S = RC.STRETCHES, P = RC.SPITS;

/** A shortcut, as the race's simulation names them (and the zigzag's hops, on leg 4). */
export type CutId = 'guns' | 'wreck' | 'headwind' | 'double' | 'whirls' | 'rocks' | 'forage' | 'locks' | 'crane' | 'triple' | 'zigzag' | 'door';
/** A leg's choice: the long way, or one of its shortcuts. Leg 1's gun gap three ways: run it, rush it on a Quad,
    shoot its guns quiet; or bribe its guard with the wreck's coins. Leg 4's long way hops the zigzag's headwinds
    with Doubles ('zigzag', a stop behind each on her row), or weaves through them (the long way, no puzzle). */
export type Choice = 'long' | 'run' | 'quad' | 'shoot' | 'bribe' | 'headwind' | 'double' | 'door' | 'whirls' | 'rocks' | 'forage' | 'zigzag' | 'locks' | 'crane' | 'triple';
/** A plan: a choice for each of the five legs. */
export type Plan = Choice[];
/** The board a stop puts up. */
export type Board = 'sailing' | 'gunnery' | 'treasure' | 'pay' | 'rowing' | 'navigation' | 'foraging' | 'bilge' | 'carpentry';

export interface Option {
  id: Choice;
  /** Its name on the strip, and its puzzle (what you'll be doing there). */
  name: string;
  puzzle: string;
  /** The shortcuts it takes. */
  cuts: CutId[];
}
const opt = (id: Choice, name: string, puzzle: string, cuts: CutId[] = []): Option => ({ id, name, puzzle, cuts });
const LONG = opt('long', 'The long way', 'Sailing on the pilot');
/** Each leg's choices, the long way first, then its shortcuts in the order she comes to them. */
export const LEGS: { n: number; options: Option[] }[] = [
  { n: 1, options: [LONG, opt('bribe', 'The wreck, then bribe the gate', 'Treasure Haul', ['wreck', 'guns']), opt('quad', 'Rush the gate', 'Sailing: a Quad', ['guns']), opt('shoot', 'Shoot the gate quiet', 'Gunnery', ['guns']), opt('run', 'Run the gate', 'no puzzle: holed, likely', ['guns'])] },
  { n: 2, options: [LONG, opt('headwind', 'The headwind gap', 'rowing', ['headwind']), opt('door', 'The starlit door', 'Duty Navigation', ['door']), opt('double', 'The Double\'s gap', 'Sailing: a Double', ['double'])] },
  { n: 3, options: [LONG, opt('whirls', 'The whirlpools', 'Sailing: a Vegas', ['whirls']), opt('rocks', 'The rocks', 'Gunnery: broadsides', ['rocks']), opt('forage', 'The driftwood', 'Foraging', ['forage'])] },
  { n: 4, options: [opt('long', 'The long way', 'weaving the zigzag: no puzzle'), opt('zigzag', 'Hop the zigzag', 'Sailing: a Double a headwind', ['zigzag']), opt('locks', 'The locks', 'Bilge', ['locks'])] },
  { n: 5, options: [LONG, opt('crane', 'The crane', 'Carpentry', ['crane']), opt('triple', 'The Triple\'s gap', 'Sailing: a Triple', ['triple'])] },
];
/** The long way everywhere, hopping the zigzag: where every plan starts. */
export const longPlan = (): Plan => LEGS.map(() => 'long');
/** Leg `leg`'s option `id`, if it has one. */
export const optionOf = (leg: number, id: Choice): Option | undefined => LEGS[leg]?.options.find((o) => o.id === id);
/** A plan with leg `leg` changed to `id` (unchanged if it isn't one of that leg's). */
export function choose(plan: Plan, leg: number, id: Choice): Plan {
  if (!optionOf(leg, id)) return plan;
  const out = [...plan];
  out[leg] = id;
  return out;
}
/** One click on a leg: its next choice, round to the first again. */
export function cycle(plan: Plan, leg: number, by = 1): Plan {
  const os = LEGS[leg].options, k = os.findIndex((o) => o.id === plan[leg]);
  return choose(plan, leg, os[(((k + by) % os.length) + os.length) % os.length].id);
}
/** A plan as written down or said over the wire, made safe: a choice of each leg's own, the long way otherwise. */
export function cleanPlan(x: unknown): Plan {
  const a = Array.isArray(x) ? x : [];
  return LEGS.map((L, i) => (L.options.some((o) => o.id === a[i]) ? a[i] as Choice : 'long'));
}
/** The shortcuts a plan takes, in course order. */
export const cutsOf = (plan: Plan): CutId[] => plan.flatMap((id, leg) => optionOf(leg, id)?.cuts ?? []);
/** How a plan takes the gun gap, if it does: run, rushed on a combo, its guns shot quiet, or its guard bribed. */
export function gapOf(plan: Plan): 'run' | 'combo' | 'shot' | 'bribe' | undefined {
  return ({ run: 'run', quad: 'combo', shoot: 'shot', bribe: 'bribe' } as const)[plan[0] as 'run'] ?? undefined;
}
/** The leg a shortcut's choice is on. */
export const legOf = (id: CutId): number => CUT_AT[id][0];
/** What a plan falls back to on a leg when a shortcut on it is given up (or can't be got to): the long way (on
    leg 4 weaving, as she would without the zigzag's hops; the bribe's gate without its coins is run). */
export const fallback = (leg: number, id: Choice): Choice => (leg === 0 && id === 'bribe' ? 'run' : 'long');
/** The plan's legs from `from` on, in words: "Leg 3: the whirlpools (Sailing: a Vegas)". */
export const planText = (plan: Plan, from = 0): string[] => plan.slice(from).map((id, k) => {
  const o = optionOf(from + k, id)!;
  return `Leg ${from + k + 1}: ${o.name.toLowerCase().replace(/^the /, 'the ')}`;
});
/** A change of plan, for whoever's watching: when, which leg, from what to what. */
export interface PlanChange { t: number; leg: number; from: Choice; to: Choice }

/* ---- Where each shortcut leaves the long way ---- */

const G = RC.GUNS.way, WR = RC.BRIBE.NOTCH, B = RC.HEADWIND, M = RC.WHIRLS.MOUTH, K = RC.ROCKS, L = RC.LOCKS, E = RC.CRANE, D = RC.DOOR, F = RC.FORAGE, D2 = RC.DOUBLE.WAY, T3 = RC.TRIPLE, Z = RC.ZIGZAG;
/** The stretch and column where each shortcut leaves the long way (the simulation's CUTS go by it too). */
export const CUT_AT: Record<CutId, [number, number]> = {
  guns: [0, G[0][0]], wreck: [0, WR[0]], headwind: [1, B[0][0]], double: [1, D2[0][0]], whirls: [2, M.c], rocks: [2, K.WALL[0][0]],
  forage: [2, F.NOTCH[0]], locks: [3, L[0].at[0]], crane: [4, E.LEDGE[0]], triple: [4, T3[0][0]], zigzag: [3, Z[0][0] + 1], door: [DOOR.FROM, D.OFF[0][0]],
};
/** The long way's pins, in order, as the pilot sails it (tools/race-measure.mjs, tests/race-helpers.ts's
    longWay): round each spit's end, to beside the trade wind back up the course (`hop`: hopped with a Double),
    and on to the finish line. */
export const LONG_PINS: { at: [number, number]; hop?: true }[] = [
  { at: [SAIL.COLS - 2, P[0].r0] }, { at: [3, P[1].r1] }, { at: [RC.SNAKES.MID[0][0] - 1, S[2].r + 1], hop: true },
  { at: [SAIL.COLS - 2, P[2].r1] }, { at: [3, P[3].r1] }, { at: [SAIL.COLS - 2, P[4].r1] }, { at: [RC.FINISH[0], RC.FINISH[1]] },
];
/** The trade wind back up the course's pin. */
export const HOP_PIN = LONG_PINS.findIndex((p) => p.hop);
/** Every shortcut's way through the spits: shut on the pilot's sea but for the one she's taking, so the pilot
    never wanders into one. */
export const WAYS: [number, number][] = [...RC.GUNS.way, ...RC.HEADWIND, ...RC.LOCKS.map((l) => l.at), ...RC.DOUBLE.WAY];
const WAYS_OF: Partial<Record<CutId, [number, number][]>> = { guns: RC.GUNS.way, headwind: RC.HEADWIND, locks: RC.LOCKS.map((l) => l.at), double: RC.DOUBLE.WAY };
/** The shortcut whose way through she's in, if she's in one (a gust's left her there, say): its way's open to
    the pilot while she's in it. */
export const wayAt = (c: number, r: number): CutId | null =>
  (Object.keys(WAYS_OF) as CutId[]).find((id) => WAYS_OF[id]!.some(([x, y]) => x === c && y === r)) ?? null;
/** A sea with every shortcut's way shut but `open`'s. */
export function shutWays(s: Sea, open: CutId | null = null): Sea {
  const keep = new Set((open ? WAYS_OF[open] ?? [] : []).map(([c, r]) => `${c},${r}`));
  for (const [c, r] of WAYS) if (!keep.has(`${c},${r}`)) s.rocks.add(`${c},${r}`);
  s.touch();
  return s;
}
/** Where she leaves the long way for each shortcut, the pilot sailing her there when her plan takes it: her
    square on the leg at its way in, on its second row, the spit's side (every shortcut goes down through a
    spit, and the course's wind blows down it: from the second row there's no sailing back up onto the first);
    or the first, or a column on, where that's a trade wind's. On `sea`, the course's with its ways shut. */
export function waysIn(sea: Sea): Record<CutId, [number, number]> {
  const ok = ([x, y]: [number, number]) => sea.open(x, y) && sea.windAt(x, y) === undefined && !sea.isLock(x, y);
  return Object.fromEntries((Object.keys(CUT_AT) as CutId[]).map((id) => {
    const [s, c] = CUT_AT[id], r = S[s].r;
    const near: [number, number][] = [[c, r + 1], [c, r], [c - 1, r + 1], [c + 1, r + 1], [c - 1, r], [c + 1, r]];
    return [id, near.find(ok) ?? near[0]];
  })) as Record<CutId, [number, number]>;
}
let courseOnce: Sea | null = null;
/** The ways in on the den's course (WAY_IN): the same squares for every racer. */
export const WAY_IN: Record<CutId, [number, number]> = waysIn(courseOnce ??= shutWays(new Sea(9)));

/** The long way's next pin from how far round she's got (`at`, by `pinAt`'s measure): beside the trade wind
    back up the course till she's hopped it. */
export function pinOf(at: number, hopped: boolean, pinAt: readonly number[]): number {
  const k = LONG_PINS.findIndex((_, j) => pinAt[j] > at + 1e-6 || (j === HOP_PIN && !hopped));
  return k < 0 ? LONG_PINS.length - 1 : k;
}
/** The next shortcut a plan's cuts take before the long way's pin `k`, if any: not done, not the zigzag (it's
    on the long way's water), and not one she's well past (`back`: a few squares, she goes back for one she
    came onto the leg beyond). Measured round the long way by `cutAt` and `pinAt`, the caller's measure (the
    simulation's seconds; squares). The same rule for every racer. */
export function goalOf(cuts: readonly CutId[], done: ReadonlySet<CutId>, at: number, k: number, pinAt: readonly number[], cutAt: (id: CutId) => number, back: number): CutId | null {
  return cuts.filter((id) => id !== 'zigzag' && !done.has(id))
    .filter((id) => cutAt(id) <= pinAt[k] + 1e-6 && cutAt(id) >= at - back)
    .sort((x, y) => cutAt(x) - cutAt(y))[0] ?? null;
}

/* ---- How far round the long way, in squares (the pilot's measure; the simulation's, progressAt, is the same
   in seconds) ---- */

const SEGS = LONG_ROUTE.slice(1).map((b, i) => { const a = LONG_ROUTE[i]; return { a, b, len: Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]) }; });
/** Squares round the long way to column `c` of stretch `s`. */
export function roundTo(s: number, c: number): number {
  const row = routeRow(s);
  let t = 0;
  for (const { a, b, len } of SEGS) {
    if (a[1] === row && b[1] === row) return t + Math.abs(Math.max(Math.min(a[0], b[0]), Math.min(Math.max(a[0], b[0]), c)) - a[0]);
    t += len;
  }
  return t;
}
/** Which stretch she's on or past (0 the first leg, 5 the run home; -1 above the first). */
export function stretchOf(r: number): number {
  let s = S.length - 1;
  while (s >= 0 && S[s].r > Math.round(r)) s--;
  return s;
}
/** How far round the long way a square is, in squares: by the stretch she's on (either of its two rows), or
    the last she's below (in a spit, through a shortcut: as far along it as it goes), or down the start's field. */
export function roundAt(p: { c: number; r: number }): number {
  const r = Math.round(p.r);
  if (r < S[0].r) return ((p.r - RC.LINE.r) / (S[0].r + 0.5 - RC.LINE.r)) * roundTo(0, LONG_ROUTE[0][0]);
  const s = stretchOf(r), onIt = r === S[s].r || r === S[s].r + 1;
  return roundTo(s, onIt ? p.c : S[s].d === 1 ? SAIL.COLS : -1);
}

/* ---- The stops, for a sloop sailed by a person (Pilot) ---- */

/** A stop: where she's held (a square, and the way she faces if it matters), the board put up there, and for a
    hop the gust it needs (smaller ones hold her there rather than carry her into the wind). */
export interface Stop { id: string; at: [number, number]; d?: number; board: Board; need?: number; hold?: boolean; say: string }
const T = (s: number) => S[s].r;
/** The zigzag's headwinds, in the order she meets them (leg 4 runs left). */
const ZIG = [...Z].sort((a, b) => b[0] - a[0]);
export const STOPS = {
  /** The trade wind back up the course, on the long way: hopped with a Double from right behind it. */
  mid: { id: 'mid', at: LONG_PINS[HOP_PIN].at, d: 1, board: 'sailing', need: 2, hold: true, say: 'The trade wind back · a Double hops her over' } as Stop,
  zigzag: ZIG.map(([c, r], k): Stop => ({ id: `zigzag${k}`, at: [c + 1, r], d: 3, board: 'sailing', need: 2, hold: true, say: `The zigzag's headwind ${k + 1} of ${ZIG.length} · a Double hops her over` })),
  quad: { id: 'quad', at: [G[0][0], T(0) + 1], d: 0, board: 'sailing', need: 4, hold: true, say: 'The imperial gate · a Quad rushes her through' } as Stop,
  shoot: { id: 'shoot', at: [G[0][0] - 1, T(0) + 1], d: 1, board: 'gunnery', say: 'Off the gate\'s gun · Q: fire port to quieten it' } as Stop,
  wreck: { id: 'wreck', at: [...WR] as [number, number], board: 'treasure', say: 'The old wreck · haul up the guard\'s price' } as Stop,
  pay: { id: 'pay', at: [...RC.BRIBE.GATE] as [number, number], board: 'pay', say: 'The imperial gate · paying the guard' } as Stop,
  headwind: { id: 'headwind', at: [B[0][0], T(1) + 1], board: 'rowing', say: 'The headwind gap · row her up it' } as Stop,
  double: { id: 'double', at: [D2[0][0], T(1) + 1], board: 'sailing', need: 2, hold: true, say: 'The Double\'s gap · a Double hops her over' } as Stop,
  door: { id: 'door', at: [...D.OFF[0]] as [number, number], board: 'navigation', say: 'The starlit door · Duty Navigation opens it' } as Stop,
  whirls: { id: 'whirls', at: [M.c, M.r], d: 0, board: 'sailing', need: 7, say: 'The whirlpools\' mouth · a Vegas carries her over' } as Stop,
  rocks: { id: 'rocks', at: [K.WALL[0][0], T(2) + 1], d: 1, board: 'gunnery', say: 'Off the rocks · Q: fire port at them' } as Stop,
  forage: { id: 'forage', at: [...F.NOTCH] as [number, number], board: 'foraging', say: 'The driftwood · clear it' } as Stop,
  locks: { id: 'locks', at: [...L[0].at] as [number, number], board: 'bilge', say: 'The up lock · pump it up' } as Stop,
  crane: { id: 'crane', at: [...E.LEDGE] as [number, number], board: 'carpentry', say: 'The crane · build it, and it hauls her over' } as Stop,
  triple: { id: 'triple', at: [T3[0][0], T(4) + 1], board: 'sailing', need: 3, hold: true, say: 'The Triple\'s gap · a Triple hops her over' } as Stop,
};


/** What the world round her says, for the pilot to know a stop's done (js/den/race.js answers it). */
export interface PlanWorld {
  /** The race's seed (its start's field), and a mark that changes whenever a square of her sea's opened or shut. */
  seed: number;
  sig: string;
  /** Her own sea (what's open on it: the barrier cleared, the rocks down, a spot shut to her online). */
  sea: Sea;
  /** The wreck's coins aboard, and the guard's price. */
  coins(): number;
  price: number;
  /** The gate's guard paid; the gate's gun 0 quiet or wrecked; the rocks down; the barrier cleared. */
  paid(): boolean;
  gunQuiet(): boolean;
  rocksDown(): boolean;
  cleared(): boolean;
}
/** What the pilot wants done just now: sailing on to a square (facing `d`, by way of `open`'s way through, if
    any), held at a stop with its board up, or nothing (home, or the helm's yours). */
export type Order = { kind: 'sail'; to: [number, number]; d?: number; open?: CutId | null } | { kind: 'stop'; stop: Stop } | { kind: 'idle' };
const at = (p: Pose, q: readonly number[]) => p.c === q[0] && p.r === q[1];
/** On a stretch's own rows (not in a spit, a notch or a gap). */
const onLeg = (p: Pose) => { const s = stretchOf(p.r); return s >= 0 && (Math.round(p.r) === S[s].r || Math.round(p.r) === S[s].r + 1); };
/** Held at a hop's stop, a gust of `run` squares too small to hop it doesn't carry her into its wind: she's held
    there for the one that will (the pilot holding her, as agreed: "the pilot sails up to it, lines her up, holds
    her there and puts up the board it asks for"). Whether it's held. */
export const holds = (o: Order, run: number): boolean => o.kind === 'stop' && !!o.stop.hold && run > 0 && run < (o.stop.need ?? 0);

/** The pilot, sailing your sloop by your plan, a move at a time, with the same moves as your own helm. The
    bots' pilot is the simulation's (src/race-sim.ts), by the same rule for where to head (goalOf), the same
    ways in and the same charts. Each step: steer(h, w) puts in her next moves (h.put, as your own: written
    down online as yours are), or holds her at a stop. */
export class Pilot {
  plan: Plan;
  /** The shortcuts she's been through (or given up), and whether she's over the trade wind back up the course. */
  done = new Set<CutId>();
  hopped = false;
  /** Off: the helm's yours, and the pilot puts nothing in. Taken: you've put in moves or dropped a pin, and
      she's sailing them; the pilot carries on once they're played out. */
  on = true;
  taken = false;
  /** Changes of plan in the race, for whoever's watching. */
  changes: PlanChange[] = [];
  /** The order given last, and the shortcut she's on her way through, if she is. */
  order: Order = { kind: 'idle' };
  going: CutId | null = null;
  private charts = new Map<string, PilotChart>();
  private seas = new Map<string, Sea>();
  private sig = '';
  private letGone = false;
  constructor(plan: Plan = longPlan()) { this.plan = cleanPlan(plan); }

  /** A new race: the plan kept (it's yours), nothing done. */
  restart() { this.done.clear(); this.going = null; this.hopped = false; this.taken = false; this.changes = []; this.order = { kind: 'idle' }; this.letGone = false; }
  /** The plan changed (one click on the strip: cycle), at the race's clock `t`. */
  set(plan: Plan, t = 0) {
    const next = cleanPlan(plan);
    next.forEach((id, leg) => { if (id !== this.plan[leg]) this.changes.push({ t, leg, from: this.plan[leg], to: id }); });
    this.plan = next;
  }

  /** The pilot's chart to a square (and a way to face there, `d`), on her sea with every way shut but `open`'s:
      charted once for each, again when her sea changes. */
  chart(w: PlanWorld, goal: readonly number[], d: number | undefined, open: CutId | null): PilotChart {
    if (w.sig !== this.sig) { this.sig = w.sig; this.charts.clear(); this.seas.clear(); }
    const k = `${goal}|${d ?? ''}|${open ?? ''}`;
    let ch = this.charts.get(k);
    if (!ch) {
      const sk = open ?? '';
      let sea = this.seas.get(sk);
      if (!sea) {
        sea = new Sea(9);
        sea.layField(fieldFor(w.seed));
        sea.breeze = w.sea.breeze;
        // (her own sea's land as it is now, in the race's rows: the barrier, the rocks, a spot shut to her)
        for (let c = 0; c < sea.cols; c++) for (let r = RC.R0; r < sea.rows; r++) {
          const q = `${c},${r}`;
          if (w.sea.rocks.has(q)) sea.rocks.add(q); else sea.rocks.delete(q);
        }
        shutWays(sea, open);
        this.seas.set(sk, sea);
      }
      this.charts.set(k, ch = new PilotChart(sea, [goal[0], goal[1]], RC.LINE.r - 1, sea.rows - 1, () => Infinity, d));
    }
    return ch;
  }

  /** Where she's headed, from where she is: the order for now. */
  next(h: Helm, w: PlanWorld, depth = 0): Order {
    const p = h.pose, s = stretchOf(p.r), cuts = cutsOf(this.plan);
    // (through or past a shortcut's leg, it's done)
    for (const id of cuts) if (s > legOf(id)) this.done.add(id);
    if (!this.hopped && (s > 2 || (s === 2 && p.c >= RC.SNAKES.MID[0][0]))) this.hopped = true;
    if (s === S.length - 1 && p.c <= RC.FINISH[0]) return { kind: 'idle' };
    const pinAt = LONG_PINS.map((x) => roundAt({ c: x.at[0], r: x.at[1] }));
    const here = roundAt(p), k = pinOf(here, this.hopped, pinAt);
    const cutAt = (id: CutId) => roundTo(CUT_AT[id][0], CUT_AT[id][1]);
    // (the shortcut she's on her way through, kept to till she's out the far side: in a notch or a gap she's
    // counted as far round as the leg goes, past it; on the leg's own rows well past its way in, it's let go,
    // as goalOf would. The Double's gap's gust leaves her in its far end: through)
    const c0 = this.going;
    if (c0 && (!cuts.includes(c0) || this.done.has(c0) || (onLeg(p) && cutAt(c0) < here - 6) || (c0 === 'double' && wayAt(p.c, p.r) === 'double'))) {
      if (c0 === 'double' && cuts.includes(c0)) this.done.add(c0);
      this.going = null;
    }
    const g = this.going ?? goalOf(cuts, this.done, here, k, pinAt, cutAt, 6);
    this.going = g;
    if (g) {
      const o = this.cut(g, h, w, depth);
      if (o) return o;
      // (put by: a shortcut whose way in no sailing gets her to from here, as the bots do: the long way there)
      this.done.add(g);
      this.going = null;
      const leg = legOf(g);
      this.set(choose(this.plan, leg, fallback(leg, this.plan[leg])));
      return depth < 4 ? this.next(h, w, depth + 1) : { kind: 'idle' };
    }
    // (the zigzag's hops: each headwind on the row she's sailing that's still ahead of her on leg 4, a stop
    // behind it, a Double over each (they alternate rows, so that's every other one: the rest aren't in her way);
    // one she can't line up for from where she is, she weaves by)
    if (cuts.includes('zigzag') && s === 3) {
      const z = STOPS.zigzag.find((x) => x.at[1] === p.r && p.c >= x.at[0]);
      if (z && this.reach(w, z, null, p)) return this.stopOr(p, z, null);
    }
    if (k === HOP_PIN && !this.hopped) return this.stopOr(p, STOPS.mid, null);
    return { kind: 'sail', to: LONG_PINS[k].at };
  }
  /** Whether she can sail to a stop's spot from here (or she's on it). */
  private reach(w: PlanWorld, st: Stop, open: CutId | null, p: Pose): boolean {
    return at(p, st.at) || this.chart(w, st.at, st.d, open ?? wayAt(p.c, p.r)).secs(p) < Infinity;
  }
  /** Sail to a stop's spot, or held there once she's on it (facing as it needs). */
  private stopOr(p: Pose, st: Stop, open: CutId | null): Order {
    if (at(p, st.at) && (st.d === undefined || p.d === st.d)) return { kind: 'stop', stop: st };
    return { kind: 'sail', to: st.at, d: st.d, open };
  }
  /** The way through a shortcut her plan takes: to its stop, held there, then through. Null if she can't get
      there from here. */
  private cut(id: CutId, h: Helm, w: PlanWorld, depth: number): Order | null {
    const p = h.pose, s = stretchOf(p.r);
    const go = (st: Stop, open: CutId | null = null) => (this.reach(w, st, open, p) ? this.stopOr(p, st, open) : null);
    switch (id) {
      case 'wreck':
        if (w.coins() >= w.price) { this.done.add('wreck'); return this.next(h, w, depth + 1); }
        return go(STOPS.wreck);
      case 'guns': {
        const gap = gapOf(this.plan);
        if (gap === 'bribe' && w.coins() >= w.price && !w.paid()) return go(STOPS.pay);
        if (gap === 'combo') return go(STOPS.quad);
        if (gap === 'shot' && !w.gunQuiet()) return go(STOPS.shoot);
        return { kind: 'sail', to: [G[0][0], T(1)], open: 'guns' };
      }
      // (rowing up the gap, the oars out: the board's steering her, not the pilot, till she's out on leg 3)
      case 'headwind': return s === 1 && p.r > T(1) + 1 ? { kind: 'stop', stop: STOPS.headwind } : go(STOPS.headwind);
      case 'door': return go(STOPS.door);
      case 'double': return go(STOPS.double);
      case 'whirls': return go(STOPS.whirls);
      case 'rocks': return w.rocksDown() ? { kind: 'sail', to: [...K.OUT] as [number, number] } : go(STOPS.rocks);
      case 'forage': return w.cleared() ? { kind: 'sail', to: [...F.OUT] as [number, number] } : go(STOPS.forage);
      // (into the up lock, held there till it's pumped by Bilge on its quay; then on through the canal and down)
      case 'locks': return at(p, L[0].at) && h.held() === 'up' ? { kind: 'stop', stop: STOPS.locks } : { kind: 'sail', to: [L[1].at[0], T(4)], open: 'locks' };
      case 'crane': return go(STOPS.crane);
      case 'triple': return go(STOPS.triple);
      default: return null;
    }
  }

  /** One step of the race (before the helm's): her next moves put in toward where the order says, or held.
      What it ordered. */
  steer(h: Helm, w: PlanWorld): Order {
    // (a gust's carrying her: the rest of her turn, put in from where she was, is let go, and she goes on from
    // where it leaves her, as the bots do)
    if (h.gusts.length) { if (!this.letGone && (h.mine.length || h.slot >= 0)) { h.letGo(); this.letGone = true; } return this.order; }
    this.letGone = false;
    // (swept along by a square of wind, or a gust's last: where she'll be is where it leaves her)
    if (h.cur?.m === 'W' && !h.cur.done) return this.order;
    if (!this.on) return (this.order = { kind: 'idle' });
    // (the helm's yours till your own moves and pin are played out)
    if (this.taken) {
      if (h.pin || h.mine.length || h.slot >= 0 || h.cur) return (this.order = { kind: 'idle' });
      this.taken = false;
    }
    const o = (this.order = this.next(h, w));
    if (o.kind !== 'sail' || h.oars || h.mine.length >= SAIL.SLOTS) return o;
    // (her next moves off the chart, a turn's worth ahead, from where those already put in leave her)
    let q = h.after();
    for (const m of h.mine) q = h.sea.sail(q, m).to;
    const got = this.chart(w, o.to, o.d, o.open ?? wayAt(q.c, q.r)).moves(q, SAIL.SLOTS - h.mine.length);
    for (const m of got.moves) h.put(m as Move);
    return o;
  }
  /** You've put in a move or dropped a pin: the helm's yours till they're played out (the pilot's own moves let
      go first). */
  take(h: Helm) {
    if (!this.on || this.taken) return;
    this.taken = true;
    while (h.mine.length) h.unput();
  }
}
