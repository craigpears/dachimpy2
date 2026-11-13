/* Bots that distil, and the planner behind them and "Help, Helium": Distilling (src/distilling.ts) played
   by its techniques, each a routine of src/distill-routines.ts, picked by stage. TypeScript, compiled to
   js/distill-bots.js; tested in tests/distill-bots.test.ts; run over many seeded boards by
   tools/distill-bots.mjs, whose numbers are DISTILLING.md §4's goals.

   Every bot plays the same plan, the user's (12 Nov: "It's always whites to the left. There's no
   reason to do any other strategy"): whites left, junk right, a junk column at a time, never a white
   burned on purpose; then, with enough whites banked, the chain, whites right. A bot is its target chain
   (the user, 13 Nov, the thirtieth note: "I want to say what is the bot's target crystal clear and it will
   try and work towards it"): CC^1, CC^2, CC^3, CC^5, CC^8 (`LEVELS`). The target sets the whites it banks
   before the chain (`bankFor`), so how long Stage I lasts, and the techniques it uses: the simple ones for
   the low targets, the crawl and the hook from CC^5, the figure of eight and the line pull for CC^8. When a
   chain breaks it doesn't dismiss: it goes back to building toward the next one ("once it's got a crystal
   clear one, it will start sending them up ... then it will start working on the next one"). All play at
   one pace (a moment to spot each drag, a hand's speed along it).

   The planner (`choose`): the stage says which routines are on the menu, the board which of them apply.
   In Stage I every move they offer, a plain drag or a technique alike, is judged by the board it leaves
   (src/distill-score.ts: junk columns filled from the right, colour pulled right, then a straight upright
   wall; nothing trapped), the score it gains a second of a person's time, one look ahead (the user, 12 Nov, the eleventh note: "even just as a test of
   moves"); the cheap plain drag that does as well wins, and a long plain one is the sweep, swept blind. In
   the chain, a move is weighed by how much it betters the board (distill-routines' `measure`) less the
   time it takes. With time short, only what saves the furnace's column. A column
   ready to go is burned at once when nothing worth doing is left, in Stage I only while the columns coming
   up to the fire next are clear of white too (the twenty-seventh note). "Help, Helium" can take the
   endgame's gamble the way a player does (the user, 12 Nov: "like a game of Russian roulette"): chase the
   next column while the odds are fair, cash in (dismiss) when it can't be filled in time. When a piece is
   stuck where it can't go its way (a white trapped at the top, junk in a column still to go up) and none of
   the routines it knows unsticks anything, it searches for a piece to bring round into its place
   (src/distill-path.ts, the user, 13 Nov: "model it as a path ... A-star"), judged like any other move. Each
   move it reads the phase the game's in (src/distill-phase.ts: the fire's side, filling the junk columns,
   blocks and the V, the chain), which tilts the techniques' worth (the user, 13 Nov: "different techniques
   have different weights depending on the stage"), all even only while a white's in danger (the
   twenty-eighth note); the advice says it, for Helium to say aloud, with its target and the whites still
   needed for it.

   `advise(board)` is the planner for anyone's board, a person's mid-game: the stage, the routine it would
   play now, why in a line, and its drags. "Help, Helium" will show that on the player's own board. */

import { BLACK, BROWN, COLS, DOWN_LEFT, DOWN_RIGHT, Distilling, SPICE, TALL, UP_LEFT, UP_RIGHT, WHITE, neighbourOn } from './distilling.js';
import type { Board, Column, DistillEvent } from './distilling.js';
import {
  M, ROUTINES, burnsClean, canGo, clear, colourLeft, fillTarget, isJunk, junkTarget, measure, playDrags, swapsIn, whitesFrom,
} from './distill-routines.js';
import { blockPhase, boardScore, keptTools } from './distill-score.js';
import { PATH, pathMoves, stuck } from './distill-path.js';
import type { PathMove } from './distill-path.js';
import { phaseOf, weightIn } from './distill-phase.js';
import type { Phase } from './distill-phase.js';
import type { Ctx, Drag, Move, RoutineName } from './distill-routines.js';

/** A technique the planner can play: a named routine, or 'path', a piece brought round by the search
    (src/distill-path.ts). */
export type Technique = RoutineName | 'path';
/** A move weighed: its value, and whether it takes a white out of the furnace's column in time. */
export interface Weighed { move: Move | PathMove; value: number; saves?: boolean; after?: Board; tie?: boolean; weighted?: boolean }
/** The path search when a white in the furnace's column has no other way out: longer drags, a wider look
    for a piece to move out of the way first. Run only then. */
export const PATH_WIDE = { ...PATH, SWAPS: 16, NODES: 6000, ENABLE_NEAR: 6, ENABLE_BOARDS: 200, ENABLE_NODES: 600 };
/** The path search's name for a player. */
export const PATH_LABEL = 'Bring a piece round';
/** A long plain drag's name for a player: no technique, just swept over (`plainDrag`). */
export const SWEEP_LABEL = 'The sweep';

/** How a bot plays: the techniques it knows, its reach and pace, and its habits. */
export interface Style {
  /** A hand's speed along a drag, swaps a second (at most 6: a swap slides 150 ms), and ms to spot each
      drag before it starts. A drag is one operation: spotted once, then swept. */
  rate: number;
  spot: number;
  /** ms between drags while sweeping, at the start: blind, one after another (the user, 12 Nov: "It's
      just go, go, go"). */
  sweepSpot: number;
  /** The longest drag it sweeps, in swaps. */
  reach: number;
  /** The techniques it knows. */
  routines: readonly RoutineName[];
  /** Whether it searches for a piece to bring round when nothing it knows unsticks a stuck one. */
  path?: boolean;
  /** Whether it burns as soon as the column's ready and nothing's left worth doing (else it waits for the
      furnace), and takes the endgame's gamble (cashes in a chain whose next column can't be filled in time). */
  early: boolean;
  gamble: boolean;
}
/** A bot (DISTILLING.md §4, the twelfth run): its target chain, the techniques that target needs, at the one
    pace every bot plays at. */
export interface Level extends Style {
  /** 'cc2' and so on; its label, 'CC^2'. */
  name: string;
  label: string;
  /** The Crystal Clear chain it banks for and aims at. */
  target: number;
}

/** The one pace every bot plays at (the user, 13 Nov: the levels are their targets, not their speed): a hand's
    5 swaps a second along a drag, 350 ms to spot one, 100 ms between the start's blind sweeps, drags up to 14
    swaps long. */
export const PACE = { rate: 5, spot: 350, sweepSpot: 100, reach: 14 } as const;
const BASIC: RoutineName[] = ['rescue', 'junkColumn', 'diamond', 'channel'];
/** The techniques each target needs (the thirtieth note: "a CC^2 with the simple ones, the crawls and hooks only
    for the longer chains"; the twenty-eighth: crawls are "for ... mid or late game"). */
const KNOWS: Readonly<Record<number, readonly RoutineName[]>> = {
  1: BASIC,
  2: [...BASIC, 'turnOver', 'store'],
  3: [...BASIC, 'turnOver', 'store', 'leapfrog'],
  5: [...BASIC, 'turnOver', 'store', 'leapfrog', 'crawl', 'hook'],
  8: [...BASIC, 'turnOver', 'store', 'leapfrog', 'crawl', 'hook', 'figureEight', 'linePull'],
};
const level = (target: number): Level => ({ name: `cc${target}`, label: `CC^${target}`, target, routines: KNOWS[target], ...PACE, path: true, early: true, gamble: false });
/** The bots, a target chain each, lowest first. */
export const LEVELS: readonly Level[] = [1, 2, 3, 5, 8].map(level);
/** The bots' old names, for links made before the levels (`?bot=ultimate`): each the level nearest it. */
const OLD_NAMES: Readonly<Record<string, string>> = { learner: 'cc1', master: 'cc3', grandmaster: 'cc5', ultimate: 'cc8' };
/** A bot by its name ('cc2'), or an old tier's name. */
export const levelNamed = (name: string): Level => {
  const t = LEVELS.find((x) => x.name === (OLD_NAMES[name] ?? name));
  if (!t) throw new Error(`no bot "${name}"`);
  return t;
};
/** The level for a target: the highest whose target is at most it (the lowest if none). */
export const levelFor = (target: number): Level => [...LEVELS].reverse().find((l) => l.target <= target) ?? LEVELS[0];
/** The tiers' old names for the levels, for anything still keyed by them. */
export const TIERS = LEVELS;
export const tierNamed = levelNamed;
/** Columns of whites banked before the chain, for a target: enough for the chain with a little over, since new
    columns bring whites too as it goes (DISTILLING.md §4: about 8 columns banked for a CC^12). Never more than 6
    for now: banking 7 left the CC^8 bot in Stage I nearly all session (the twelfth run, 0.3 chains a session),
    as banking more did in the second run; it gets its longer chains from its techniques. */
export const bankFor = (target: number): number => Math.min(6, 3.5 + target / 2);
/** The whites a column holds, on average (tall and short in turn). */
export const PER_COLUMN = 8.5;

/** The routines on the menu in each stage, in the order they're preferred when they'd do as well. */
export const MENU: Readonly<Record<'junk' | 'chain', readonly RoutineName[]>> = {
  junk: ['rescue', 'junkColumn', 'turnOver', 'crawl', 'diamond', 'leapfrog', 'hook', 'figureEight', 'linePull', 'store'],
  chain: ['rescue', 'junkColumn', 'crawl', 'channel', 'diamond', 'leapfrog', 'hook', 'figureEight', 'linePull'],
};
/** The planner's weights (exported to tune from tools/distill-bots.mjs's PLAN). */
export const P = {
  /** A routine's cost: what each second of a person's time is worth in the chain (timeFor), and each turn
      within a drag. */
  PER_SEC: 1,
  TURN_MS: 60,
  /** The chain: the least a routine must better the board by (`measure`) to be worth it. */
  MIN: 0.3,
  /** Stage I, judged by the board score (src/distill-score.ts) a second of a person's time: the least a
      move must get to be worth it, and the most for a ready column to burn at once rather than wait while
      it's done. */
  RATE_MIN: 0.15,
  SLACK: 1,
  /** ms left on the furnace below which only what saves its column counts. */
  URGENT: 5000,
  /** The gamble: from this many Crystal Clears in a row, a chain is cashed in when its next column can't
      be filled in time. */
  CASH_FROM: 3,
  /** ... looked at only in its last few seconds, when what's left can be judged. */
  CASH_MS: 4000,
  /** Stage I: how many columns past the one being built are kept clear of whites too. */
  AHEAD: 1,
  /** A sweep: one plain drag at least this long, all one way across, swept blind (no pause to think). */
  SWEEP_LONG: 3,
  /** The tie-breaker (`tieBreak`): a move doing the same job (its board score gain at most this much less) in
      the same drags and at most TIE_SWAPS more swaps; the right-hand columns it sorts, from the edge in. */
  TIE_SCORE: 0.25,
  TIE_SWAPS: 2,
  TIE_COLS: 4,
  /** The block phase: what each drag costs a person on top (`judge`), so a small move earns its place. */
  BLOCK_DRAG_MS: 400,
  /** Stage I: whites in the column before the furnace's, hard to reach, saved first too (`dangerZones`; 0 off). */
  ZONE2: 1,
  /** Stage I: a white on the top or bottom edge, or beside a spice, in the EDGE_COLS columns next to the fire, in
      danger already (`edgeWhites`, the twenty-sixth note; 0 off). */
  EDGE_COLS: 3,
  /** Stage I: a ready column is burned early only while this many columns coming up to the fire after it are
      clear of white too (the twenty-seventh note; 0, any time). */
  EARLY_CLEAR: 2,
  /** The block phase: a drag carried on at most this many swaps past where its score peaks, to where the junk
      joins up (`judge`, the twenty-ninth note; 0 off). */
  CARRY: 2,
  /** The chain: each swap that takes a piece back the wrong way. */
  BACK: 0.6,
  /** The phases' weights on the techniques (src/distill-phase.ts; 0 off, every technique even). */
  PHASES: 1,
};

/** What the planner says to do now: its stage, and a routine's drags, a burn, a wait or a dismiss, with
    the routine's name for a player and the reason in a line. */
export interface Advice {
  stage: 'junk' | 'chain';
  /** The phase it thinks the game's in (src/distill-phase.ts), said aloud by Helium. */
  phase: Phase;
  kind: 'move' | 'burn' | 'wait' | 'dismiss';
  /** The named routine played. A move found by the path search names the hook, the nearest named technique
      (a piece taken round a corner), for anyone keyed by the routines' names; its `technique` says 'path', which
      "Help, Helium" looks up for their own line. */
  routine: RoutineName | null;
  /** The technique played: the routine, or 'path' for the path search's move (its label PATH_LABEL). */
  technique?: Technique | null;
  label: string;
  reason: string;
  drags: Drag[];
  /** What the move betters the board by, for its cost. */
  value: number;
  /** Swept blind: the start's plain long drags, one after another with hardly a pause. */
  sweep: boolean;
  /** Chosen by the tie-breaker (`tieBreak`) over the move that scored best a second. */
  tie?: boolean;
  /** Ranked with the phase's weights on (none of them even for danger). */
  weighted?: boolean;
  /** The chain it's aiming at (the thirtieth note), and the whites still needed for it: in Stage I, still to
      bank before the chain starts; in the chain, still to get into the columns going up for it (0 once it's
      reached). Set by the bots and `advise`, for Helium to say ("our goal is to get one column full of white
      pieces"). */
  target?: number;
  whitesNeeded?: number;
}

/** The board as the planner sees it: the columns, the chain now, the furnace's ms left. */
export interface Situation { cols: Board; chain: number; timeLeft: number }

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

/** A sweep: one plain drag, long, every swap the same way across (left or right), so it's swept blind with
    hardly a pause (the user, 12 Nov: "It's just quick drag motions ... go, go, go"). */
export function plainDrag(drags: readonly Drag[]): boolean {
  if (drags.length !== 1 || drags[0].ways.length < P.SWEEP_LONG) return false;
  const right = (w: number) => w === UP_RIGHT || w === DOWN_RIGHT, r = right(drags[0].ways[0]);
  return drags[0].ways.every((w) => right(w) === r);
}

/** The brown sweep: a brown taken up through the whites and back down through the blacks, to the bottom right
    (the diamond's brown run). */
export function brownSweep(cols: Board, drags: readonly Drag[]): boolean {
  if (!drags.length || cols[drags[0].x][drags[0].y] !== BROWN) return false;
  const ways = drags[0].ways, up = ways.findIndex((w) => w === UP_RIGHT || w === UP_LEFT);
  return up >= 0 && ways.slice(up + 1).some((w) => w === DOWN_RIGHT || w === DOWN_LEFT);
}

/** Whites left in the junk columns from x on (those more junk than white): the columns next to burn still to
    clear. */
export function whitesInJunk(cols: Board, x: number): number {
  let n = 0;
  for (let i = Math.max(0, x); i < COLS; i++) {
    const w = cols[i].filter((p) => p === WHITE).length;
    if (cols[i].filter(isJunk).length > w) n += w;
  }
  return n;
}

/** The whites in danger, in the order they're saved (the user, 13 Nov, the twentieth and twenty-second notes:
    "If you're playing well, you should never burn a white"; "it doesn't seem fussed that you're only one column
    away from a couple of whites burning at the bottom ... that's your danger area that's hard to reach"): first
    the furnace's own column, a column to burn, while it has a white; then (Stage I) the column before it, a junk
    column, while a white there is hard to reach, with no way out left on its own (low down, boxed in, behind
    spice): it takes longest to free, so it's started soonest; then (Stage I) the leftmost column next to the fire
    with a white on its edge or beside a spice (`edgeWhites`, the twenty-sixth note), whatever its way out now.
    Each zone is its first column; its whites are those from there to the furnace. */
export function dangerZones(cols: Board, stage: 'junk' | 'chain', burning: boolean): number[] {
  const last = COLS - 1, out: number[] = [];
  const whites = (x: number) => cols[x].map((p, y) => (p === WHITE ? y : -1)).filter((y) => y >= 0);
  if (burning && whites(last).length) out.push(last);
  if (stage === 'junk' && P.ZONE2) {
    const x = last - 1, w = whites(x);
    if (w.length && cols[x].filter(isJunk).length > w.length && w.some((y) => !canGo(cols, x, y, -1))) out.push(x);
  }
  const edge = stage === 'junk' ? edgeZone(cols) : null;
  if (edge !== null && !out.includes(edge)) out.push(edge);
  return out;
}
/** A white in danger already by the fire (the user, 13 Nov, the twenty-sixth note: "this top right here ... It
    should have moved [a brown] into that spot behind the [spice] piece ... where something can potentially get
    trapped. Like, I would be taking some of those browns in the far bottom left and be like racing them up there
    to fill those gaps in"): in the EDGE_COLS columns next to the fire, on its column's top or bottom, or beside a
    spice, where its ways out are few and close as the board slides. From column `from` on. */
export function edgeWhites(cols: Board, from = 0): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  if (!P.EDGE_COLS) return out;
  for (let x = Math.max(from, COLS - P.EDGE_COLS); x < COLS; x++) cols[x].forEach((p, y) => {
    if (p !== WHITE) return;
    const spice = [UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT].some((d) => { const n = neighbourOn(cols, x, y, d); return !!n && cols[n[0]][n[1]] === SPICE; })
      || cols[x][y - 1] === SPICE || cols[x][y + 1] === SPICE;
    if (y === 0 || y === cols[x].length - 1 || spice) out.push({ x, y });
  });
  return out;
}
/** The edge whites' zone: the leftmost column next to the fire, short of the furnace's own (its zone already),
    with one (`edgeWhites`); null if none. */
export function edgeZone(cols: Board): number | null {
  const e = edgeWhites(cols).filter((w) => w.x < COLS - 1);
  return e.length ? Math.min(...e.map((w) => w.x)) : null;
}
/** The right-hand columns' order (the user, 13 Nov, the twenty-first note: "one of the heuristics is browns being
    lower down the board"): every brown's depth in half pieces, less every black's, in the last TIE_COLS columns.
    Higher is browns lower and blacks higher. */
export function rightOrder(cols: Board): number {
  let v = 0;
  for (let x = COLS - P.TIE_COLS; x < COLS; x++) cols[x].forEach((p, y) => {
    const h = 2 * y + (cols[x].length === TALL ? 0 : 1);
    if (p === BROWN) v += h; else if (p === BLACK) v -= h;
  });
  return v;
}
/** A tie-breaker, never a goal (the twenty-first note: "you don't want to really actively be going out of your
    way, spending extra moves to sort them at this point. But it's still preferable if it costs you very little
    ... a little flick and a swish, and the brown can be one level lower"): among moves doing the best one's job
    (its board score gain, within TIE_SCORE) in as many drags and at most TIE_SWAPS more swaps, the one leaving
    the right-hand side in the best order, browns lower and blacks higher; the best itself when none is better. */
export function tieBreak(cols: Board, moves: readonly Weighed[], best: Weighed, block = false): Weighed {
  if (!best.after) return best;
  const base = boardScore(cols, block), gain = boardScore(best.after, block) - base, swaps = swapsIn(best.move.drags);
  let pick = best, order = rightOrder(best.after);
  for (const m of moves) {
    if (m === best || !m.after || m.move.drags.length !== best.move.drags.length) continue;
    if (swapsIn(m.move.drags) > swaps + P.TIE_SWAPS || boardScore(m.after, block) - base < gain - P.TIE_SCORE) continue;
    const o = rightOrder(m.after);
    if (o > order) { pick = m; order = o; }
  }
  return pick === best ? best : { ...pick, tie: true };
}

/** Hard-to-reach whites in a column: no way out left on their own. */
const hardIn = (cols: Board, x: number): number => cols[x].reduce((n, p, y) => n + (p === WHITE && !canGo(cols, x, y, -1) ? 1 : 0), 0);

/** Stage I: a move judged by the board it leaves (src/distill-score.ts), the score it gains a second of a
    person's time (the user, 12 Nov, the eleventh note: "even just as a test of moves"). One look ahead, no
    search. Its last drag is let go where that's best: carried on while each swap still gets something over,
    stopped before it only climbs through the junk (a black sent on up through the browns gets nothing). */
export function judge(cols: Board, drags: readonly Drag[], style: Style, base?: number, block = false): { drags: Drag[]; value: number } | null {
  base ??= boardScore(cols, block);
  if (!drags.length) return null;
  const init = drags.slice(0, -1), last = drags[drags.length - 1];
  let best: { drags: Drag[]; value: number } | null = null;
  for (let k = last.ways.length; k >= 1; k--) {
    const d = [...init, { x: last.x, y: last.y, ways: last.ways.slice(0, k) }];
    const after = playDrags(cols, d);
    if (!after) continue;
    // In the block phase each drag costs a person more: a small move has to earn its place (the twenty-third note:
    // "a lot of small, intricate moves ... I would just start pulling, like treating it more like blocks").
    const value = (boardScore(after, block) - base) / ((timeFor(d, style, plainDrag(d)) + (block ? P.BLOCK_DRAG_MS * d.length : 0)) / 1000);
    if (!best || value > best.value) best = { drags: d, value };
  }
  // A block move carried on to where the junk joins up (the user, 13 Nov, the twenty-ninth note: "It has decided
  // to just leave it one short. Why? Like, there was an extra move there. You could have gotten that right, nice,
  // tucked into the corner"): let go among the whites, and a swap or two more of the same drag takes it in against
  // the junk on its right (the corner, the row), it's played on, while it still gains.
  if (block && best && P.CARRY) {
    const k = best.drags[best.drags.length - 1].ways.length, before = playDrags(cols, init);
    if (before && isJunk(before[last.x][last.y]) && !joinedUp(playDrags(cols, best.drags)!, endOf(cols, last, k))) {
      for (let more = 1; more <= P.CARRY && k + more <= last.ways.length; more++) {
        const d = [...init, { x: last.x, y: last.y, ways: last.ways.slice(0, k + more) }], after = playDrags(cols, d);
        if (!after || !joinedUp(after, endOf(cols, last, k + more))) continue;
        const value = (boardScore(after, block) - base) / ((timeFor(d, style, plainDrag(d)) + P.BLOCK_DRAG_MS * d.length) / 1000);
        if (value > 0) return { drags: d, value };
        break;
      }
    }
  }
  return best;
}
/** Where a drag's piece is after its first k swaps. */
function endOf(cols: Board, d: Drag, k = d.ways.length): [number, number] {
  let at: [number, number] = [d.x, d.y];
  for (const w of d.ways.slice(0, k)) { const n = neighbourOn(cols, at[0], at[1], w); if (!n) break; at = n; }
  return at;
}
/** A piece of junk joined up with the junk on its right: every neighbour on its right junk (none, on the right
    edge), so it's let go against the colour, not among the whites. */
export function joinedUp(cols: Board, [x, y]: [number, number]): boolean {
  if (!isJunk(cols[x][y])) return false;
  for (const d of [UP_RIGHT, DOWN_RIGHT]) {
    const n = neighbourOn(cols, x, y, d);
    if (n && !isJunk(cols[n[0]][n[1]])) return false;
  }
  return true;
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

/** Every move of the routines the style knows, on the board now, weighed, best first. Stage I: by the board
    score it gains a second of a person's time (`judge`), its last drag let go where that's best. The chain:
    how much it betters the board (`measure`), less the person's time it takes and the ground it gives back.
    With time short on a column that needs saving, only moves that save it in time.

    A white in the furnace's column, a column to burn, is never let burn while anything can get it out (the
    user, 13 Nov, the twentieth note: "If you're playing well, you should never burn a white"): then only the
    moves that take a white out of it, in time, are offered (`saves`), whatever they score, the wider path
    search (PATH_WIDE) if nothing else does; and no move ever puts a white into it. In Stage I the same holds
    a column earlier for a white that's hard to reach (`dangerZones`). Among the saving moves, those freeing a
    hard-to-reach white come first ("the harder to reach, the sooner to start"); when nothing can save the
    furnace's whites, the next column's hard ones get the time rather than easy work elsewhere. */
export function weigh(sit: Situation, ctx: Ctx, style: Style): Weighed[] {
  const { cols } = sit, last = COLS - 1, burning = ctx.burnFrom <= last, one = ctx.stage === 'junk';
  const block = one && blockPhase(cols), base = one ? boardScore(cols, block) : measure(cols, ctx);
  const wrong = (b: Board) => (burning ? b[last].filter((p) => p === WHITE).length : junkAt(b[last]));
  const urgent = sit.timeLeft < P.URGENT && wrong(cols) > 0;
  const zones = dangerZones(cols, ctx.stage, burning);
  // Never a white into a danger zone (the furnace's column always, when it burns).
  const guard = zones.length ? Math.min(...zones) : burning ? last : COLS;
  const out: Weighed[] = [];
  const near = one ? whitesInJunk(cols, ctx.burnFrom) : 0;
  // The whites by the fire in danger already (the twenty-sixth note), and those of them with a way out: no move
  // takes that away ("It even moved some blacks in the way at the top that actually block getting that white piece
  // out easily ... Why have you blocked it all in?"), nor puts another white there.
  const edges = one ? edgeWhites(cols) : [], open = edges.filter((w) => canGo(cols, w.x, w.y, -1));
  const tools = keptTools(cols);
  const consider = (found: Move | PathMove) => {
    const j = one ? judge(cols, found.drags, style, base, block) : null;
    const move = j ? { ...found, drags: j.drags } : found;
    const after = playDrags(cols, move.drags);
    if (!after || (one && !j)) return;
    if (urgent && (wrong(after) >= wrong(cols) || msFor(move.drags, style, plainDrag(move.drags)) > sit.timeLeft)) return;
    if ((burning && wrong(after) > wrong(cols)) || whitesFrom(after, guard) > whitesFrom(cols, guard)) return;
    // (A white got out of the two columns nearest the fire is more urgent, wherever it lands.)
    if (one && whitesFrom(after, last - 1) >= whitesFrom(cols, last - 1)
      && (edgeWhites(after).length > edges.length || open.some((w) => after[w.x][w.y] === WHITE && !canGo(after, w.x, w.y, -1)))) return;
    // The block phase's corner tools, a brown bottom-left and a black top-left, are spent only to save a white in
    // danger (the twenty-fourth note: "you don't want to just get too greedy"; a long drag across the board always
    // scored more than keeping one).
    if (block && !zones.length) { const k = keptTools(after); if ((tools.brown && !k.brown) || (tools.black && !k.black)) return; }
    // The brown sweep waits till the columns next to burn are clear of white (the user, 13 Nov: "it's very good.
    // But it's just like it leaves one or two trapped whites ... it's being applied a bit too quickly before those
    // columns have been cleared"): till then it's played only when it takes a white out of them.
    if (one && near > 0 && brownSweep(cols, move.drags) && whitesInJunk(after, ctx.burnFrom) >= near) return;
    const value = j ? j.value : measure(after, ctx) - base - P.PER_SEC * timeFor(move.drags, style) / 1000 - P.BACK * backward(cols, move.drags, ctx.stage);
    out.push({ move, value, after });
  };
  for (const name of MENU[ctx.stage]) {
    if (!style.routines.includes(name)) continue;
    for (const found of ROUTINES[name].find(cols, ctx)) consider(found);
  }
  // The fallback: a piece stuck that nothing the routines offer unsticks (it's still stuck where it is after
  // every one of them): bring a piece round to take its place.
  if (style.path) {
    let left = stuck(cols, ctx);
    const at = (s: { x: number; y: number }) => `${s.x},${s.y}`;
    for (const m of out) {
      if (!left.length) break;
      const still = new Set(stuck(playDrags(cols, m.move.drags)!, ctx).map(at));
      left = left.filter((s) => still.has(at(s)));
    }
    if (left.length) for (const found of pathMoves(cols, ctx, style, left)) consider(found);
  }
  // The phase's weights on the techniques, for ranking (the user, 13 Nov: "different techniques have different
  // weights depending on the stage"), every one even only for real danger, a white in a danger zone ("it can
  // always use all the techniques if it absolutely needs to, like ... there's a blocked white"). Not for any piece
  // stuck anywhere: something nearly always is, and the weights hardly ever applied (the twenty-eighth note: crawls
  // "still being done at an early stage when there are much simpler techniques").
  const phase = phaseOf(cols, ctx.stage), even = !P.PHASES || zones.length > 0;
  const rank = (m: Weighed) => (even || m.value <= 0 ? m.value : m.value * weightIn(phase, m.move.routine));
  // The danger zones in turn: only what saves a white of the first that can be saved (the furnace's in time),
  // the hard-to-reach first; if nothing does yet, the wider search for its whites. The edge whites' zone is saved
  // by one of them getting out (junk raced into its place), not any white.
  const edgeAt = one ? edgeZone(cols) : null;
  for (const zone of zones) {
    const edgeOnly = zone === edgeAt && zone < last - 1;
    const saving = (m: Weighed) => whitesFrom(m.after!, zone) < whitesFrom(cols, zone)
      && (!edgeOnly || edgeWhites(m.after!, zone).length < edgeWhites(cols, zone).length)
      && (zone < last || msFor(m.move.drags, style, plainDrag(m.move.drags)) <= sit.timeLeft);
    if (!out.some(saving) && style.path) {
      const whites: { x: number; y: number; side: number }[] = [];
      if (edgeOnly) for (const w of edgeWhites(cols, zone)) whites.push({ ...w, side: -1 });
      else cols[zone].forEach((p, y) => { if (p === WHITE) whites.push({ x: zone, y, side: -1 }); });
      for (const found of pathMoves(cols, ctx, style, whites, PATH_WIDE)) consider(found);
    }
    const saves = out.filter(saving);
    if (!saves.length) continue;
    const hard = (m: Weighed) => hardIn(cols, zone) - hardIn(m.after!, zone);
    return saves.map((m) => ({ ...m, saves: true })).sort((a, b) => hard(b) - hard(a) || b.value - a.value);
  }
  return out.sort((a, b) => rank(b) - rank(a)).map((m) => (even ? m : { ...m, weighted: true }));
}
/** The columns coming up to the fire after the furnace's, clear of white (`P.EARLY_CLEAR` of them): only then is
    a junk column burned early (the user, 13 Nov, the twenty-seventh note: "3 burns just happened in rapid
    succession ... Is that why it's struggling and failing?"; each early burn brought the whites a column closer). */
export function clearComingUp(cols: Board): boolean {
  for (let k = 2; k <= 1 + P.EARLY_CLEAR; k++) if (COLS - k >= 0 && cols[COLS - k].includes(WHITE)) return false;
  return true;
}

/** Pick the routine for the board now (see the header). */
export function choose(sit: Situation, ctx: Ctx, style: Style): Advice {
  const { cols } = sit, last = COLS - 1;
  const burning = ctx.burnFrom <= last;
  const furnace = cols[last];
  const ready = burning ? burnsClean(furnace) : clear(furnace);
  // What's wrong with the furnace's column, to save it when time's short.
  const wrong = (b: Board) => (burning ? b[last].filter((p) => p === WHITE).length : junkAt(b[last]));
  const moves = weigh(sit, ctx, style);
  // A move saving a white from the furnace is played whatever it scores.
  const top = moves[0] && (moves[0].saves || moves[0].value > (ctx.stage === 'junk' ? P.RATE_MIN : P.MIN)) ? moves[0] : null;
  const best = top && ctx.stage === 'junk' && !top.saves ? tieBreak(cols, moves, top, blockPhase(cols)) : top;
  const advice = (kind: Advice['kind'], label: string, reason: string, m: { move: Move | PathMove; value: number } | null = null): Advice => ({
    stage: ctx.stage, phase: phaseOf(cols, ctx.stage), kind, routine: !m ? null : m.move.routine === 'path' ? 'hook' : m.move.routine, technique: m?.move.routine ?? null,
    label, reason, drags: m?.move.drags ?? [], value: m?.value ?? 0, sweep: false, ...((m as Weighed | null)?.tie ? { tie: true } : {}),
    ...((m as Weighed | null)?.weighted ? { weighted: true } : {}),
  });
  // The endgame's gamble: the next Crystal Clear can't be filled in time.
  if (style.gamble && !burning && sit.chain >= P.CASH_FROM && !ready && sit.timeLeft < P.CASH_MS) {
    const need = junkAt(furnace), saving = moves.filter((m) => m.value > P.MIN && wrong(playDrags(cols, m.move.drags)!) < need);
    const perFix = style.spot + 4000 / style.rate;
    if (!saving.length || need * perFix > sit.timeLeft) {
      return advice('dismiss', 'Cash in', `the gamble: CC^${sit.chain} so far, and the next column needs ${need} more white${need > 1 ? 's' : ''} in ${(sit.timeLeft / 1000).toFixed(0)} s. Poor odds: cash in now`);
    }
  }
  // Burn a ready column at once when nothing much is left to do; in the chain, only when nothing is (a
  // Crystal Clear burned early is time lost ferrying whites for the next).
  if (ready && style.early && (ctx.stage === 'chain' || clearComingUp(cols)) && (!best || (ctx.stage === 'junk' && best.value < P.SLACK))) {
    return advice('burn', 'Burn now', burning ? "the furnace's column is all junk: burn it now" : 'the column is Crystal Clear: send it up now');
  }
  // A plain long drag that wins is the sweep, swept blind: no technique needed, "quick drag brown up, black
  // down, done" (the eleventh note).
  if (best && ctx.stage === 'junk' && plainDrag(best.move.drags)) {
    return { ...advice('move', SWEEP_LABEL, `go, go, go: ${best.move.reason}`, best), sweep: true };
  }
  if (best) {
    const gamble = !burning && sit.chain >= P.CASH_FROM && !ready && style.gamble
      ? ` (the gamble: CC^${sit.chain} so far, chasing the next while the odds are fair)` : '';
    return advice('move', best.move.routine === 'path' ? PATH_LABEL : ROUTINES[best.move.routine].label, best.move.reason + gamble, best);
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
  return whites >= bank * PER_COLUMN || junkLeft < need;
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
export const HELIUM: Style = { routines: Object.keys(ROUTINES) as RoutineName[], path: true, reach: 16, rate: 6, spot: 250, sweepSpot: 80, early: true, gamble: true };
/** The target "Help, Helium" plays to when none is given: the top level's, every technique. */
export const DEFAULT_TARGET = LEVELS[LEVELS.length - 1].target;

/** The whites still needed for a target (the Advice's `whitesNeeded`): in Stage I, still to bank before the chain
    (`bankFor`); in the chain, missing from the columns going up for the rest of it, the first left of the junk
    columns still to burn (0 once it's reached). */
export function whitesNeededFor(cols: Board, stage: 'junk' | 'chain', chain: number, target: number, burns = 0): number {
  if (stage === 'junk') return Math.max(0, Math.round(bankFor(target) * PER_COLUMN) - counts(cols).whites);
  let n = 0;
  for (let x = COLS - 1 - burns, k = Math.max(0, target - chain); k > 0 && x >= 0; x--, k--) n += cols[x].filter((p) => p !== WHITE && p !== SPICE).length;
  return n;
}

/** The planner on anyone's board mid-game, a person's: it reads the stage from the board (the chain
    started, or the whites banked for the target, or the junk run out), then picks the routine as the bots do,
    with the techniques that target needs (`levelFor`) at Helium's pace. The target is DEFAULT_TARGET unless
    given (Helium's lesson in levels: "this is how I build a Crystal Clear 2"). */
export function advise(g: { cols: Board; chain?: number; timeLeft?: number }, o: { target?: number } = {}): Advice {
  const cols = g.cols, chain = g.chain ?? 0, timeLeft = g.timeLeft ?? Infinity, target = o.target ?? DEFAULT_TARGET;
  const two = chain > 0 || decisionTime(cols, bankFor(target));
  const burns = chain > 0 ? 0 : two ? burnsLeft(cols) : 0, stage = two ? 'chain' : 'junk';
  const style = target === DEFAULT_TARGET ? HELIUM : { ...HELIUM, routines: levelFor(target).routines };
  const a = choose({ cols, chain, timeLeft }, contextFor(cols, stage, burns, HELIUM.reach), style);
  return { ...a, target, whitesNeeded: whitesNeededFor(cols, stage, chain, target, burns) };
}

/** A distiller at a level: where it is in its run, and its next move. It banks the whites for its target, sends
    the chain up, and when the chain breaks goes back to building toward the next one; it never dismisses. */
export class DistillBot {
  readonly level: Level;
  stage: 'junk' | 'chain' = 'junk';
  /** Stage II's junk columns still to go out before the chain. */
  burns = 0;
  /** Whites on the board, in columns, as its first chain started. */
  banked: number | null = null;
  /** Drags made, and how often each routine was played. */
  drags = 0;
  used: Partial<Record<Technique, number>> = {};
  /** Every chain it's sent up, its length, and the one going now. */
  chains: number[] = [];
  private run = 0;
  /** What it's doing now (the test page shows its label). */
  last: Advice | null = null;

  constructor(level: Level) { this.level = level; }

  plan(g: Distilling): Advice {
    const target = this.level.target;
    if (this.stage === 'junk' && decisionTime(g.cols, bankFor(target))) { this.stage = 'chain'; this.burns = burnsLeft(g.cols); }
    const ctx = contextFor(g.cols, this.stage, this.burns, this.level.reach);
    const a = choose({ cols: g.cols, chain: g.chain, timeLeft: g.timeLeft() }, ctx, this.level);
    const t = a.technique ?? a.routine;
    if (t) this.used[t] = (this.used[t] ?? 0) + 1;
    this.last = { ...a, target, whitesNeeded: whitesNeededFor(g.cols, this.stage, g.chain, target, this.burns) };
    return this.last;
  }

  /** A column went: note the chain, count down the junk columns before it, note the bank, and when the chain
      breaks go back to building (Stage I) toward the next. */
  seen(col: Column, g: Distilling): void {
    if (col.chain > 0) this.run = col.chain;
    else if (this.run > 0) { this.chains.push(this.run); this.run = 0; }
    if (this.stage !== 'chain') return;
    if (this.burns > 0) { this.burns--; return; }
    if (col.chain === 1 && this.banked === null) this.banked = (whitesFrom(g.cols, 0) + col.whites) / PER_COLUMN;
    if (col.chain === 0) this.stage = 'junk';
  }
  /** Every chain sent up, the one still going too. */
  allChains(): number[] { return this.run > 0 ? [...this.chains, this.run] : [...this.chains]; }
}

/** A session played by a bot, at its pace. */
export interface Played {
  /** The bot's name ('cc2'), and its target. */
  level: string;
  target: number;
  /** Every chain it sent up, its length. */
  chains: number[];
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
  used: Partial<Record<Technique, number>>;
  /** Each technique (a sweep counted as its own, 'sweep') in Stage I: how often it was played while colour
      was plentiful, middling or scarce, the person's time it took (ms) and the junk it got over (columns
      moved right, all its junk together). */
  cost: Record<string, { plenty: number; middle: number; scarce: number; ms: number; over: number }>;
}

/** Play a session through with a bot: each drag a moment to spot, then swept at its hand speed;
    the furnace runs on meanwhile. Stops at `cap` minutes of play. `onColumn` sees each column, `onPlan`
    each decision. */
export function playSession(g: Distilling, level: Level, cap = 30, onColumn?: (c: Column) => void, onPlan?: (a: Advice) => void): Played {
  const bot = new DistillBot(level), swapMs = 1000 / level.rate, cost: Played['cost'] = {};
  let went = false;
  const handle = (ev: DistillEvent[]) => {
    for (const e of ev) if (e.kind === 'column') { went = true; bot.seen(e.column, g); onColumn?.(e.column); }
  };
  while (!g.finished && g.time < cap * 60000) {
    if (g.sliding > 0) { handle(g.tick(g.sliding)); continue; }
    const a = bot.plan(g);
    onPlan?.(a);
    if (a.kind === 'dismiss') { g.dismiss(); break; }
    if (a.kind === 'burn') { handle(g.burnNow()); handle(g.tick(level.spot)); continue; }
    if (a.kind === 'wait') { handle(g.tick(Math.max(1, Math.min(250, g.timeLeft())))); continue; }
    went = false;
    let ok = true;
    const was = a.stage === 'junk' ? junkAcross(g.cols) : 0, share = colourLeft(g.cols), t0 = g.time;
    for (const d of a.drags) {
      handle(g.tick(a.sweep ? level.sweepSpot : level.spot));
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
      const k = a.sweep ? 'sweep' : (a.technique ?? a.routine), c = (cost[k] ??= { plenty: 0, middle: 0, scarce: 0, ms: 0, over: 0 });
      c[share > 0.45 ? 'plenty' : share > M.SCARCE ? 'middle' : 'scarce']++;
      c.ms += g.time - t0 + P.TURN_MS * turnsIn(a.drags);
      c.over += junkAcross(g.cols) - was;
    }
  }
  return {
    level: level.name, target: level.target, chains: bot.allChains(), longest: g.longest, score: g.score(), points: g.points, columnsUp: g.columnsUp,
    columnsBurned: g.columns.length - g.columnsUp, whitesBurned: g.whitesBurned, minutes: g.time / 60000,
    swaps: g.swaps, drags: bot.drags, banked: bot.banked, dismissed: g.dismissed, finished: g.finished, used: bot.used, cost,
  };
}
