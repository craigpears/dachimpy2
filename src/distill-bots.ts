/* Bots that distil, and the planner behind them and "Help, Helium": Distilling (src/distilling.ts) played
   by its techniques, each a routine of src/distill-routines.ts, picked by stage. TypeScript, compiled to
   js/distill-bots.js; tested in tests/distill-bots.test.ts; run over many seeded boards by
   tools/distill-bots.mjs, whose numbers are DISTILLING.md §4's goals.

   Every tier plays the same plan, the user's (12 Nov: "It's always whites to the left. There's no
   reason to do any other strategy"): whites left, junk right, a junk column at a time, never a white
   burned on purpose; then, with enough whites banked, the chain, whites right. The tiers differ in which
   techniques they can pull off (their routines) and how fast (a moment to spot each drag, and a hand's
   speed along it), and how much they bank before the chain.

   The planner (`choose`): the stage says which routines are on the menu, the board which of them apply,
   and each routine's drags are weighed by how much they better the board (distill-routines' `measure`)
   for the swaps and drags they take; with time short, only what saves the furnace's column. A column
   ready to go is burned at once when nothing worth doing is left (the better tiers). In the chain, past
   a few Crystal Clears, the top tiers take the endgame's gamble the way a player does (the user, 12 Nov:
   "like a game of Russian roulette"): chase the next column while the odds are fair, cash in (dismiss)
   when it can't be filled in time.

   `advise(board)` is the planner for anyone's board, a person's mid-game: the stage, the routine it would
   play now, why in a line, and its drags. "Help, Helium" will show that on the player's own board. */

import { COLS, Distilling, SPICE, WHITE, neighbourOn } from './distilling.js';
import type { Board, Column, DistillEvent } from './distilling.js';
import {
  M, ROUTINES, burnsClean, clear, colourLeft, fillTarget, isJunk, junkTarget, measure, playDrags, scarce, swapsIn, whitesFrom,
} from './distill-routines.js';
import type { Ctx, Drag, Move, RoutineName } from './distill-routines.js';

/** A tier of distiller (DISTILLING.md §4): the techniques it can pull off and its pace. */
export interface Tier {
  name: string;
  label: string;
  /** A hand's speed along a drag, swaps a second (at most 6: a swap slides 150 ms), and ms to spot each
      drag before it starts. A drag is one operation: spotted once, then swept. */
  rate: number;
  spot: number;
  /** ms between drags while sweeping, at the start: blind, one after another (the user, 12 Nov: "It's
      just go, go, go"). */
  sweepSpot: number;
  /** Columns of whites to bank before the chain. */
  bank: number;
  /** The longest drag it sweeps, in swaps. */
  reach: number;
  /** The techniques it knows. */
  routines: readonly RoutineName[];
  /** Whether it burns as soon as the column's ready and nothing's left worth doing (else it waits for the
      furnace), dismisses when its chain breaks, and takes the endgame's gamble (cashes in a chain whose
      next column can't be filled in time). */
  early: boolean;
  dismiss: boolean;
  gamble: boolean;
}

const BASIC: RoutineName[] = ['rescue', 'junkColumn', 'diamond', 'channel'];
export const TIERS: readonly Tier[] = [
  { name: 'learner', label: 'Learner', rate: 4, spot: 900, sweepSpot: 400, bank: 4, reach: 6, routines: BASIC, early: false, dismiss: false, gamble: false },
  { name: 'master', label: 'Able to Master', rate: 5, spot: 500, sweepSpot: 150, bank: 6, reach: 10, routines: [...BASIC, 'turnOver', 'crawl', 'store', 'leapfrog'], early: true, dismiss: true, gamble: false },
  { name: 'grandmaster', label: 'Grand-Master to Legendary', rate: 6, spot: 350, sweepSpot: 100, bank: 6, reach: 14, routines: [...BASIC, 'turnOver', 'crawl', 'store', 'leapfrog', 'figureEight', 'hook'], early: true, dismiss: true, gamble: true },
  { name: 'ultimate', label: 'Ultimate', rate: 6, spot: 250, sweepSpot: 80, bank: 6, reach: 16, routines: [...BASIC, 'turnOver', 'crawl', 'store', 'leapfrog', 'figureEight', 'hook', 'linePull'], early: true, dismiss: true, gamble: true },
];
export const tierNamed = (name: string): Tier => {
  const t = TIERS.find((x) => x.name === name);
  if (!t) throw new Error(`no tier "${name}"`);
  return t;
};

/** The routines on the menu in each stage, in the order they're preferred when they'd do as well. */
/** The slow techniques (the seventh note: "very action heavy"), played only once plain drags stop getting
    much over. */
export const SLOW: readonly RoutineName[] = ['crawl', 'turnOver', 'linePull', 'figureEight', 'hook', 'leapfrog'];
export const MENU: Readonly<Record<'junk' | 'chain', readonly RoutineName[]>> = {
  junk: ['rescue', 'junkColumn', 'turnOver', 'crawl', 'diamond', 'leapfrog', 'hook', 'figureEight', 'linePull', 'store'],
  chain: ['rescue', 'junkColumn', 'crawl', 'channel', 'diamond', 'leapfrog', 'hook', 'figureEight', 'linePull'],
};
/** The planner's weights (exported to tune from tools/distill-bots.mjs's PLAN). */
export const P = {
  /** A routine's cost: what each second of a person's time is worth (timeFor), and each turn within a drag;
      SWAP the sweep's own cost a swap. */
  PER_SEC: 1,
  TURN_MS: 60,
  SWAP: 0.08,
  /** The least a routine must better the board by to be worth it, and the most for a ready column to
      burn at once rather than wait while it's done. */
  MIN: 0.3,
  SLACK: 2,
  /** ms left on the furnace below which only what saves its column counts. */
  URGENT: 5000,
  /** The gamble: from this many Crystal Clears in a row, a chain is cashed in when its next column can't
      be filled in time. */
  CASH_FROM: 3,
  /** ... looked at only in its last few seconds, when what's left can be judged. */
  CASH_MS: 4000,
  /** Stage I: how many columns past the one being built are kept clear of whites too. */
  AHEAD: 1,
  /** A sweep: a drag at least this long. */
  SWEEP_LONG: 3,
  /** ... swept blind while it does nearly as well as the best thing to do (a careful rescue worth far more
      comes first). */
  SWEEP_AS_GOOD: 0.6,
  /** Pieces plain drags could still get over at which it's sweeping time, and the slow techniques wait. */
  PLENTY: 4,
  /** Each swap that takes a piece back the wrong way. */
  BACK: 0.6,
  /** Turning the right side over: played next unless something's worth more than this (a big rescue),
      and so long as it costs the board no more than this by the measure. */
  TURN_UNLESS: 12,
  TURN_COST: 3,
};

/** What the planner says to do now: its stage, and a routine's drags, a burn, a wait or a dismiss, with
    the routine's name for a player and the reason in a line. */
export interface Advice {
  stage: 'junk' | 'chain';
  kind: 'move' | 'burn' | 'wait' | 'dismiss';
  routine: RoutineName | null;
  label: string;
  reason: string;
  drags: Drag[];
  /** What the move betters the board by, for its cost. */
  value: number;
  /** Swept blind: the start's plain long drags, one after another with hardly a pause. */
  sweep: boolean;
}

/** The board as the planner sees it: the columns, the chain now, the furnace's ms left. */
export interface Situation { cols: Board; chain: number; timeLeft: number }
/** How the planner plays: the routines it knows, its reach and pace, and its habits (a Tier's). */
export type Style = Pick<Tier, 'routines' | 'reach' | 'rate' | 'spot' | 'sweepSpot' | 'early' | 'gamble'>;

/** Junk in the furnace's column (spice is fine in a Crystal Clear). */
const junkAt = (col: readonly number[]) => col.filter((p) => p !== WHITE && p !== SPICE).length;
/** The ms a move takes at a pace. */
const msFor = (drags: readonly Drag[], s: Style, sweep = false) => drags.length * (sweep ? s.sweepSpot : s.spot) + (swapsIn(drags) * 1000) / s.rate;

/** The context for a stage: Stage I, the junk column being built (and those done right of it) burn;
    Stage II, the last `burns` columns burn, and the rightmost left of them not yet clear is filled. */
export function contextFor(cols: Board, stage: 'junk' | 'chain', burns: number, reach: number): Ctx {
  // Stage I: the junk column being built and the next one with it, so the next one's whites are out
  // before it's the furnace's ("one column at a time ... to give yourself breathing room").
  if (stage === 'junk') { const t = Math.max(0, junkTarget(cols) - P.AHEAD); return { stage, burnFrom: t, fill: t, reach }; }
  const burnFrom = COLS - burns;
  return { stage, burnFrom, fill: fillTarget(cols, burnFrom), reach };
}

/** The start's sweeps: plain long drags of a black or a brown right over to the junk (the diamond's run,
    carried on as far as it goes), each worth it for its swaps, best first; spotting one costs next to
    nothing, it's done blind. None: sweeping has stopped getting junk right. */
export function sweepsOn(cols: Board, ctx: Ctx, style: Style, base = measure(cols, ctx)): { move: Move; value: number }[] {
  if (!style.routines.includes('diamond')) return [];
  const out: { move: Move; value: number }[] = [];
  for (const move of ROUTINES.diamond.find(cols, ctx)) {
    if (move.drags.length !== 1 || move.drags[0].ways.length < P.SWEEP_LONG) continue;
    const after = playDrags(cols, move.drags);
    if (!after) continue;
    const value = measure(after, ctx) - base - P.SWAP * swapsIn(move.drags);
    if (value > P.MIN) out.push({ move, value });
  }
  return out.sort((a, b) => b.value - a.value);
}

/** Turns within a move's drags: each change of way while a piece is held. */
export const turnsIn = (drags: readonly Drag[]): number => drags.reduce((n, d) => n + d.ways.filter((w, i) => i > 0 && w !== d.ways[i - 1]).length, 0);
/** The junk's whole way across: every junk piece's column, added up (a swap taking junk right adds one). */
export function junkAcross(cols: Board): number {
  let n = 0;
  cols.forEach((c, x) => { for (const p of c) if (isJunk(p)) n += x; });
  return n;
}
/** A move's cost in a person's time (the user, 12 Nov: "that kind of one smooth mouse motion is cheap. It's
    quick"): a moment to spot and pick up each drag, its swaps at a hand's speed, a little for each turn. */
export const timeFor = (drags: readonly Drag[], s: Style, sweep = false): number =>
  drags.length * (sweep ? s.sweepSpot : s.spot) + (swapsIn(drags) * 1000) / s.rate + P.TURN_MS * turnsIn(drags);

/** A move's swaps that take a piece the wrong way, back over ground already won (the user, 12 Nov, the tenth
    note: "each time you kind of loop or go back, you're basically undoing some progress"): junk going back left
    in Stage I (right in the chain), a white going back right (left in the chain). */
export function backward(cols: Board, drags: readonly Drag[], stage: 'junk' | 'chain'): number {
  const side = stage === 'junk' ? 1 : -1, b = cols.map((c) => [...c]);
  let n = 0;
  for (const d of drags) {
    let [x, y] = [d.x, d.y];
    for (const w of d.ways) {
      const to = neighbourOn(b, x, y, w);
      if (!to) break;
      const p = b[x][y], dx = to[0] - x;
      if ((isJunk(p) && dx * side < 0) || (p === WHITE && dx * side > 0)) n++;
      b[x][y] = b[to[0]][to[1]]; b[to[0]][to[1]] = p;
      [x, y] = to;
    }
  }
  return n;
}

/** Every move of the routines the style knows, on the board now, weighed: how much it betters the board,
    less the person's time it takes and the ground it gives back, best first. With time short on a column
    that needs saving, only moves that save it in time. `find` is the context the routines look with (a
    second look with colour taken as scarce, say); the board's always measured by `ctx`. */
export function weigh(sit: Situation, ctx: Ctx, style: Style, find: Ctx = ctx): { move: Move; value: number }[] {
  const { cols } = sit, last = COLS - 1, base = measure(cols, ctx), burning = ctx.burnFrom <= last;
  const wrong = (b: Board) => (burning ? b[last].filter((p) => p === WHITE).length : junkAt(b[last]));
  const urgent = sit.timeLeft < P.URGENT && wrong(cols) > 0;
  const out: { move: Move; value: number }[] = [];
  for (const name of MENU[find.stage]) {
    if (!style.routines.includes(name)) continue;
    for (const move of ROUTINES[name].find(cols, find)) {
      const after = playDrags(cols, move.drags);
      if (!after) continue;
      if (urgent && (wrong(after) >= wrong(cols) || msFor(move.drags, style) > sit.timeLeft)) continue;
      const value = measure(after, ctx) - base - P.PER_SEC * timeFor(move.drags, style) / 1000 - P.BACK * backward(cols, move.drags, find.stage);
      out.push({ move, value });
    }
  }
  return out.sort((a, b) => b.value - a.value);
}

/** Pick the routine for the board now (see the header). */
export function choose(sit: Situation, ctx: Ctx, style: Style): Advice {
  const { cols } = sit, last = COLS - 1;
  const base = measure(cols, ctx);
  const burning = ctx.burnFrom <= last;
  const furnace = cols[last];
  const ready = burning ? burnsClean(furnace) : clear(furnace);
  // What's wrong with the furnace's column, to save it when time's short.
  const wrong = (b: Board) => (burning ? b[last].filter((p) => p === WHITE).length : junkAt(b[last]));
  const urgent = sit.timeLeft < P.URGENT && wrong(cols) > 0;
  const gen = (c: Ctx) => weigh(sit, ctx, style, c);
  let moves = gen(ctx);
  // Count first (the ninth note): how many pieces plain drags could still get over. While that's high it's
  // sweeping time, whatever happened a drag ago, and the slow techniques wait.
  const sweeps = ctx.stage === 'junk' && !urgent ? sweepsOn(cols, ctx, style, base) : [];
  const plain = new Set(sweeps.map((s) => `${s.move.drags[0].x},${s.move.drags[0].y}`)).size;
  if (plain >= P.PLENTY) moves = moves.filter((m) => !SLOW.includes(m.move.routine));
  let best = moves[0] && moves[0].value > P.MIN ? moves[0] : null;
  // Colour plentiful but nothing cheaper gets anything over: the slow techniques after all.
  if (!best && !sweeps.length && ctx.stage === 'junk' && ctx.scarce === undefined && !scarce(cols, ctx)) {
    moves = gen({ ...ctx, scarce: true });
    best = moves[0] && moves[0].value > P.MIN ? moves[0] : null;
  }
  const advice = (kind: Advice['kind'], label: string, reason: string, m: { move: Move; value: number } | null = null): Advice => ({
    stage: ctx.stage, kind, routine: m?.move.routine ?? null, label, reason, drags: m?.move.drags ?? [], value: m?.value ?? 0, sweep: false,
  });
  // The endgame's gamble: the next Crystal Clear can't be filled in time.
  if (style.gamble && !burning && sit.chain >= P.CASH_FROM && !ready && sit.timeLeft < P.CASH_MS) {
    const need = junkAt(furnace), saving = moves.filter((m) => m.value > P.MIN && wrong(playDrags(cols, m.move.drags)!) < need);
    const perFix = style.spot + 4000 / style.rate;
    if (!saving.length || need * perFix > sit.timeLeft) {
      return advice('dismiss', 'Cash in', `the gamble: CC^${sit.chain} so far, and the next column needs ${need} more white${need > 1 ? 's' : ''} in ${(sit.timeLeft / 1000).toFixed(0)} s. Poor odds: cash in now`);
    }
  }
  // The start is sweeping, decided by the board: while a plain long drag still takes a black or a brown
  // over to the junk, sweep blind and fast, the best such drag each time; the techniques come in only when
  // that stops getting junk right, or when the furnace's column needs saving.
  const sweeping = sweeps.length > 0 && (plain >= P.PLENTY
    ? !(best && best.move.routine === 'rescue' && best.value > 2 * sweeps[0].value)
    : !best || sweeps[0].value >= P.SWEEP_AS_GOOD * best.value);
  // Then, the sweep done, turn the right side over (blacks up its side, browns down), so what comes next
  // from the left can hook in; only a big rescue comes first.
  if (ctx.stage === 'junk' && !urgent && !sweeping) {
    const turn = moves.filter((m) => m.move.routine === 'turnOver' && m.value > -P.TURN_COST)[0];
    if (turn && (!best || best.value < P.TURN_UNLESS)) return advice('move', ROUTINES.turnOver.label, turn.move.reason, turn);
  }
  // Burn a ready column at once when nothing much is left to do; in the chain, only when nothing is (a
  // Crystal Clear burned early is time lost ferrying whites for the next).
  if (ready && style.early && (!best || (ctx.stage === 'junk' && best.value < P.SLACK))) {
    return advice('burn', 'Burn now', burning ? "the furnace's column is all junk: burn it now" : 'the column is Crystal Clear: send it up now');
  }
  if (sweeping) {
    const sw = sweeps[0];
    return { ...advice('move', 'The sweep', `go, go, go: ${sw.move.reason}`, sw), sweep: true };
  }
  if (best) {
    const gamble = !burning && sit.chain >= P.CASH_FROM && !ready && style.gamble
      ? ` (the gamble: CC^${sit.chain} so far, chasing the next while the odds are fair)` : '';
    return advice('move', ROUTINES[best.move.routine].label, best.move.reason + gamble, best);
  }
  return advice('wait', 'Wait', ready ? 'the column is ready: let the furnace take it' : 'nothing worth moving: wait for the next column');
}

/** Whites, and junk, on the board. */
export function counts(cols: Board): { whites: number; junk: number } {
  let whites = 0, junk = 0;
  for (const c of cols) for (const p of c) { if (p === WHITE) whites++; else if (isJunk(p)) junk++; }
  return { whites, junk };
}
/** Whether it's decision time in Stage I: the whites banked make `bank` columns, or too little junk is
    left to finish the junk column being built. */
export function decisionTime(cols: Board, bank: number): boolean {
  const t = junkTarget(cols), { whites } = counts(cols);
  let junkLeft = 0;
  for (let x = 0; x < t; x++) for (const p of cols[x]) if (isJunk(p)) junkLeft++;
  const need = cols[t].filter((p) => p === WHITE).length;
  return whites >= bank * 8.5 || junkLeft < need;
}
/** The junk columns still to burn at decision time: the ones done on the right, and the one being built
    if it's mostly junk. */
export function burnsLeft(cols: Board): number {
  // From the furnace, every column that's more junk than whites: those are finished as junk (their
  // whites saved) and burned, so the chain starts on a column that's mostly white.
  let n = 0;
  while (n < COLS - 1) {
    const col = cols[COLS - 1 - n], whites = col.filter((p) => p === WHITE).length;
    if (whites * 2 >= col.length && !burnsClean(col)) break;
    n++;
  }
  return n;
}

/** The pace "Help, Helium" plays at, and every technique. */
export const HELIUM: Style = { routines: Object.keys(ROUTINES) as RoutineName[], reach: 16, rate: 6, spot: 250, sweepSpot: 80, early: true, gamble: true };

/** The planner on anyone's board mid-game, a person's: it reads the stage from the board (the chain
    started, or the whites banked, or the junk run out), then picks the routine as the bots do. */
export function advise(g: { cols: Board; chain?: number; timeLeft?: number }, o: { bank?: number } = {}): Advice {
  const cols = g.cols, chain = g.chain ?? 0, timeLeft = g.timeLeft ?? Infinity;
  const two = chain > 0 || decisionTime(cols, o.bank ?? 8);
  const burns = chain > 0 ? 0 : two ? burnsLeft(cols) : 0;
  return choose({ cols, chain, timeLeft }, contextFor(cols, two ? 'chain' : 'junk', burns, HELIUM.reach), HELIUM);
}

/** A distiller of a tier: where it is in its run, and its next move. */
export class DistillBot {
  readonly tier: Tier;
  stage: 'junk' | 'chain' = 'junk';
  /** Stage II's junk columns still to go out before the chain. */
  burns = 0;
  /** Whites on the board, in columns, as the chain started. */
  banked: number | null = null;
  quit = false;
  /** Drags made, and how often each routine was played. */
  drags = 0;
  used: Partial<Record<RoutineName, number>> = {};
  /** What it's doing now (the test page shows its label). */
  last: Advice | null = null;

  constructor(tier: Tier) { this.tier = tier; }

  plan(g: Distilling): Advice {
    if (this.quit) return this.say({ stage: this.stage, kind: 'dismiss', routine: null, label: 'Dismiss', reason: 'the chain is over: dismiss and keep the score', drags: [], value: 0, sweep: false });
    if (this.stage === 'junk' && decisionTime(g.cols, this.tier.bank)) { this.stage = 'chain'; this.burns = burnsLeft(g.cols); }
    const ctx = contextFor(g.cols, this.stage, this.burns, this.tier.reach);
    const a = choose({ cols: g.cols, chain: g.chain, timeLeft: g.timeLeft() }, ctx, this.tier);
    if (a.kind === 'dismiss') this.quit = true;
    if (a.routine) this.used[a.routine] = (this.used[a.routine] ?? 0) + 1;
    return this.say(a);
  }
  private say(a: Advice): Advice { this.last = a; return a; }

  /** A column went: count down the junk columns, note the bank, and quit when the chain breaks. */
  seen(col: Column, g: Distilling): void {
    if (this.stage !== 'chain') return;
    if (this.burns > 0) { this.burns--; return; }
    if (col.chain === 1 && this.banked === null) this.banked = (whitesFrom(g.cols, 0) + col.whites) / 8.5;
    if (this.tier.dismiss && col.chain === 0 && g.longest > 0) this.quit = true;
  }
}

/** A session played by a bot, at its pace. */
export interface Played {
  tier: string;
  longest: number;
  score: number;
  points: number;
  columnsUp: number;
  columnsBurned: number;
  whitesBurned: number;
  /** Minutes it took, swaps and drags made, white columns banked as the chain started. */
  minutes: number;
  swaps: number;
  drags: number;
  banked: number | null;
  dismissed: boolean;
  finished: boolean;
  /** How often each routine was played. */
  used: Partial<Record<RoutineName, number>>;
  /** Each technique (a sweep counted as its own, 'sweep') in Stage I: how often it was played while colour
      was plentiful, middling or scarce, the person's time it took (ms) and the junk it got over (columns
      moved right, all its junk together). */
  cost: Record<string, { plenty: number; middle: number; scarce: number; ms: number; over: number }>;
}

/** Play a session through with a bot: each drag a moment to spot, then swept at the tier's hand speed;
    the furnace runs on meanwhile. Stops at `cap` minutes of play. `onColumn` sees each column, `onPlan`
    each decision. */
export function playSession(g: Distilling, tier: Tier, cap = 30, onColumn?: (c: Column) => void, onPlan?: (a: Advice) => void): Played {
  const bot = new DistillBot(tier), swapMs = 1000 / tier.rate, cost: Played['cost'] = {};
  let went = false;
  const handle = (ev: DistillEvent[]) => {
    for (const e of ev) if (e.kind === 'column') { went = true; bot.seen(e.column, g); onColumn?.(e.column); }
  };
  while (!g.finished && g.time < cap * 60000) {
    if (g.sliding > 0) { handle(g.tick(g.sliding)); continue; }
    const a = bot.plan(g);
    onPlan?.(a);
    if (a.kind === 'dismiss') { g.dismiss(); break; }
    if (a.kind === 'burn') { handle(g.burnNow()); handle(g.tick(tier.spot)); continue; }
    if (a.kind === 'wait') { handle(g.tick(Math.max(1, Math.min(250, g.timeLeft())))); continue; }
    went = false;
    let ok = true;
    const was = a.stage === 'junk' ? junkAcross(g.cols) : 0, share = colourLeft(g.cols), t0 = g.time;
    for (const d of a.drags) {
      handle(g.tick(a.sweep ? tier.sweepSpot : tier.spot));
      bot.drags++;
      let x = d.x, y = d.y;
      for (const w of d.ways) {
        if (went || !g.movable) break;
        const n = g.swapToward(x, y, w);
        if (!n) { ok = false; break; }
        [x, y] = n;
        handle(g.tick(swapMs));
      }
      if (went || !ok) break;
    }
    if (a.stage === 'junk' && !went && a.routine) {
      const k = a.sweep ? 'sweep' : a.routine, c = (cost[k] ??= { plenty: 0, middle: 0, scarce: 0, ms: 0, over: 0 });
      c[share > 0.45 ? 'plenty' : share > M.SCARCE ? 'middle' : 'scarce']++;
      c.ms += g.time - t0 + P.TURN_MS * turnsIn(a.drags);
      c.over += junkAcross(g.cols) - was;
    }
  }
  return {
    tier: tier.name, longest: g.longest, score: g.score(), points: g.points, columnsUp: g.columnsUp,
    columnsBurned: g.columns.length - g.columnsUp, whitesBurned: g.whitesBurned, minutes: g.time / 60000,
    swaps: g.swaps, drags: bot.drags, banked: bot.banked, dismissed: g.dismissed, finished: g.finished, used: bot.used, cost,
  };
}
