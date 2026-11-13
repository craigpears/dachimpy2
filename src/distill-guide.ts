/* Distilling, the read version (distilling-guide.html): every picture and name on it, worked out from the same code
   as Helium's lesson and the bots, so the page can't drift from them. TypeScript, compiled to js/distill-guide.js;
   tested in tests/distill-guide.test.ts; drawn by the hand-written js/distill-guide-view.js.

   The user (13 Nov): "a summary document of the strategy that the bot is taking now ... what are the rules, what are
   the phases, what are the tricks and techniques ... a read version ... a 2D static version of the guide, and ...
   everything's just kept in sync, like the animated version, the 2D static version" (RULES.md, "Every tutorial has
   a read version, kept in sync").

   - The rules: the pieces' weights and points, the swaps the rule allows (`beats`), the furnace's seconds, columns
     judged as the game judges them (`judge`), the chain bonus: all read off src/distilling.ts.
   - The phases (src/distill-phase.ts, PHASES): the fire's side and the fill on the lesson's own board, before and
     after its step one (src/den-helium.ts); blocks and the chain on boards a bot reached (src/distill-guide-boards.ts).
     Each checked to be that phase by `phaseOf`.
   - The levels (src/distill-bots.ts, LEVELS): each target's bank (`bankFor`) and the techniques it plays.
   - The techniques (src/distill-routines.ts, ROUTINES, with the sweep and the path search): each drawn on a real
     board with the move its own `find` offers there, the move the bot played or the lesson plays.
   - The user's tricks: each on a board where it shows, marked by the planner's own reading of it (`dangerZones`,
     `edgeWhites`, `keptTools`, `clearComingUp`); the sorted right side's one fluid motion (the thirty-first note)
     found on a sorted board by `fluidMotion` and checked by `isFluid`.
   - Reading the board (src/distill-read.ts): its states and tactics, on the positions the user critiqued, each read
     as the planner reads it, with the bot's move there now (`readingExamples`).
   - The page's order (`PLAN`, 13 Nov): the rules and a target, then each phase in a game's order with its own
     tricks and techniques under it, simplest first.
   - Helium's lines, quoted from src/lines/helium.ts.
   The words round them are the page's own, written by hand.

   Pure: no randomness (the lesson's deal is seeded), no clock, no DOM. */

import {
  BLACK, BROWN, BURNT, BURN_TICKS, CARRY_ON, CHAIN_BONUS, COLS, DOWN_LEFT, DOWN_RIGHT, FLASK, MESSAGES, POINTS, SPICE, TICK_MS, UP_LEFT, UP_RIGHT, WHITE,
  beats, canSwapOn, goesUp, judge, neighbourOn, parseBoard, weightOf,
} from './distilling.js';
import type { Board } from './distilling.js';
import { ROUTINES, canGo, clear, copyBoard, junkTarget, playDrags, burnsClean, rightFrom, whitesFrom } from './distill-routines.js';
import type { Ctx, Drag, RoutineName } from './distill-routines.js';
import { FIRE_COLS, PHASES, PHASE_ORDER, phaseOf } from './distill-phase.js';
import type { Phase } from './distill-phase.js';
import { LEVELS, PATH_LABEL, PER_COLUMN, SWEEP_LABEL, bankFor, chainZones, clearComingUp, contextFor, dangerZones, edgeWhites, levelNamed, plainDrag } from './distill-bots.js';
import { blockPhase, keptTools } from './distill-score.js';
import { bringRound, pairRescue, stuck } from './distill-path.js';
import { STEP_ONE_CTX, afterOpening, aimFor, beforeBang, lessonPlan, opening, lessonGame } from './den-helium.js';
import { DRAG_TRICKS, LADDER, dragTricks, makeWay, teachLevel } from './distill-teach.js';
import type { DragTrick } from './distill-teach.js';
import { BEST, HELP, HELP_ELSE, NERVES, ONWARD, OPENING, PHASE, SPOT, STEP_ONE, TEACH, TELL } from './lines/helium.js';
import { POSITIONS } from './distill-guide-boards.js';
import type { Position } from './distill-guide-boards.js';
import { POSITIONS as POSITIONS_SEEN, boardOf, botAt } from './distill-positions.js';
import { STATES, TACTICS, readBoard } from './distill-read.js';
import type { BoardState, Tactic } from './distill-read.js';

/** A technique on the page: a routine, the sweep (a long plain drag) or the path search (a piece brought round). */
export type Technique = RoutineName | 'sweep' | 'path';
/** The user's tricks (DISTILLING.md §3, the twentieth to twenty-ninth notes, the thirty-first's fluid motion, and the
    pair rescue in the chain, 13 Nov). */
export const TRICKS = ['white', 'danger', 'edge', 'flick', 'blocks', 'kept', 'burnEarly', 'fluid', 'pair'] as const;
export type Trick = typeof TRICKS[number];

/** A section of the page under a phase: a technique or a trick; `longer`, one only the longer chains need. */
export type GuideItem = { kind: 'technique'; name: Technique; longer?: boolean } | { kind: 'trick'; name: Trick };
const tech = (name: Technique, longer = false): GuideItem => (longer ? { kind: 'technique', name, longer } : { kind: 'technique', name });
const trick = (name: Trick): GuideItem => ({ kind: 'trick', name });
/** The page in the course of a game (the user, 13 Nov: "a few of the simple things are a bit out of order ...
    progression's a bit weird"): each phase in a game's order, and under it its own tricks and techniques, simplest
    first. The first things a player needs (never a white down the fire, the danger by the fire) come first; the
    chain's channels in the chain. Storing and the leapfrog sit with the blocks, not the fill: the fill weighs storing
    down and the blocks weigh both up (src/distill-phase.ts, PHASE_WEIGHTS), storing waits till the junk on the right
    is down to a few columns (`sortingTime`), and the leapfrog runs along a stored row. */
export const PLAN: Readonly<Record<Phase, readonly GuideItem[]>> = {
  fire: [trick('white'), trick('danger'), trick('edge'), tech('rescue'), tech('sweep')],
  fill: [tech('junkColumn'), tech('diamond'), trick('flick'), trick('burnEarly'), tech('turnOver')],
  block: [trick('blocks'), trick('kept'), tech('store'), tech('leapfrog'), trick('fluid')],
  chain: [tech('channel'), trick('pair'), tech('crawl', true), tech('hook', true), tech('figureEight', true), tech('linePull', true), tech('path')],
};

/** A board to draw: its pieces, the drags on it (arrows, numbered in order), pieces ringed, columns shaded, the
    furnace's column burning (`burn`), and where the board's from, in plain words. */
export interface Picture {
  cols: Board;
  drags: Drag[];
  rings: [number, number][];
  shade: number[];
  burn?: boolean;
  from: string;
}

// ---------------------------------------------------------------- where the boards come from

/** A board a bot reached, as the page says it: the deal and how far in. */
const fromPosition = (p: Position): string => {
  const s = Math.round(p.ms / 1000);
  return `A real deal (seed ${p.seed}), ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} in, as the ${p.bot.toUpperCase().replace('CC', 'CC^')} bot ${p.chosen ? 'played it' : 'found it'}`;
};
const LESSON_FROM = 'Helium\'s lesson board';

const same = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((w, i) => w === b[i]);
/** Whether a move offered (`full`) is the one played (`played`): the same drags, the last let go anywhere along its
    way (the planner lets a drag go where it's best, src/distill-bots.ts `judge`). */
export function sameMove(full: readonly Drag[], played: readonly Drag[]): boolean {
  if (!played.length || full.length !== played.length) return false;
  return played.every((d, i) => {
    const f = full[i];
    if (d.x !== f.x || d.y !== f.y) return false;
    return i < played.length - 1 ? same(d.ways, f.ways) : d.ways.length >= 1 && d.ways.length <= f.ways.length && d.ways.every((w, k) => w === f.ways[k]);
  });
}

/** The position kept for a key (src/distill-guide-boards.ts); throws if the tool hasn't picked one. */
export function position(key: string): Position {
  const p = POSITIONS[key];
  if (!p) throw new Error(`no board for ${key}: run tools/distill-guide.mjs`);
  return p;
}

/** A kept position's move, live: the move its routine's own `find` offers on the board now that's the one played
    there (`offered`): the routine's whole move (`full`, a technique's picture) and as far as the bot took it
    (`played`, a trick's). If the routine no longer offers it, its first move there (the test then fails, to pick
    the boards again). The path search's and a burn's are as kept. */
export function liveMove(p: Position): { full: Drag[]; played: Drag[]; offered: boolean } {
  const cols = parseBoard(p.cols);
  if (!p.by || p.by === 'path') return { full: p.drags, played: p.drags, offered: !!playDrags(cols, p.drags) };
  const moves = ROUTINES[p.by].find(cols, p.ctx as Ctx);
  const m = moves.find((x) => sameMove(x.drags, p.drags));
  if (m) return { full: m.drags, played: p.drags, offered: true };
  const first = moves[0]?.drags ?? [];
  return { full: first, played: first, offered: false };
}

// ---------------------------------------------------------------- the rules

/** The pieces, in the game's order: weight (which way a column goes), points sent up, whether it swaps. */
export const PIECES = [WHITE, BROWN, BLACK, SPICE, BURNT].map((p) => ({ piece: p, weight: weightOf(p), points: POINTS[p], swaps: p !== SPICE }));
/** The swaps the rule allows: lower over upper, the lower beating the upper (rock, paper, scissors). */
export const SWAPS = [WHITE, BROWN, BLACK].flatMap((lower) => [WHITE, BROWN, BLACK].filter((upper) => beats(lower, upper)).map((upper) => ({ lower, upper })));
/** Seconds the furnace takes to burn the right-hand column (the 50th tick). */
export const FURNACE_SECS = Math.round(((BURN_TICKS + 1) * TICK_MS) / 100) / 10;
export { CHAIN_BONUS, FLASK, CARRY_ON };

/** Columns judged as the game judges them: a column written top to bottom, and the Crystal Clears straight before
    it. Which way it goes, its points, its message. */
const SAMPLE_COLUMNS: readonly { col: string; before: number }[] = [
  { col: 'wwwwwwwww', before: 0 },
  { col: 'wwwwwwwww', before: 3 },
  { col: 'www*wwww', before: 1 },
  { col: 'wwwwwbbww', before: 2 },
  { col: 'bbbbbbbb', before: 2 },
  { col: 'wwKKwbKKw', before: 0 },
  { col: 'KKKbbbbw', before: 0 },
];
export function sampleColumns() {
  return SAMPLE_COLUMNS.map(({ col, before }) => {
    const pieces = parseBoard([col])[0], c = judge(pieces, before);
    return { pieces, before, up: c.up, points: c.points + c.bonus, bonus: c.bonus, chain: c.chain, message: c.message ? MESSAGES[c.message] : null, spice: c.spice ? MESSAGES[c.spice] : null };
  });
}

// ---------------------------------------------------------------- the phases

export interface PhaseExample { phase: Phase; label: string; plan: string; says: string; stage: 'junk' | 'chain'; picture: Picture }

/** The lesson's board before and after its step one, and its step one's drags. */
function lessonBoards(): { before: Board; after: Board; drags: Drag[] } {
  const g = afterOpening(), before = copyBoard(g.cols);
  const clearBeat = lessonPlan(g).find((b) => b.name === 'clear');
  const drags = clearBeat && clearBeat.act.kind === 'drags' ? clearBeat.act.drags.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] })) : [];
  return { before, after: copyBoard(g.cols), drags };
}

/** Whites on the fire's side, ringed (the lesson rings them so). */
const fireWhites = (cols: Board): [number, number][] => {
  const out: [number, number][] = [];
  for (let x = COLS - FIRE_COLS; x < COLS; x++) cols[x].forEach((p, y) => { if (p === WHITE || p === BURNT) out.push([x, y]); });
  return out;
};
const range = (a: number, b: number) => Array.from({ length: b - a }, (_, i) => a + i);
/** The junk columns done from the fire in, and the one being filled. */
const junkSide = (cols: Board) => range(junkTarget(cols), COLS);

export function phaseExamples(): PhaseExample[] {
  const lesson = lessonBoards();
  const kept = (key: string, shade: (cols: Board) => number[], rings: (cols: Board) => [number, number][] = () => []): Picture => {
    const p = position(key), cols = parseBoard(p.cols);
    return { cols, drags: liveMove(p).played, rings: rings(cols), shade: shade(cols), from: fromPosition(p) };
  };
  const pictures: Record<Phase, Picture> = {
    fire: { cols: lesson.before, drags: lesson.drags, rings: fireWhites(lesson.before), shade: range(COLS - FIRE_COLS, COLS), from: `${LESSON_FROM}, Helium's step one` },
    fill: { cols: lesson.after, drags: [], rings: [], shade: junkSide(lesson.after), from: `${LESSON_FROM}, after step one` },
    block: kept('phase:block', () => range(COLS - 3, COLS), toolsAt),
    chain: kept('phase:chain', (cols) => range(0, COLS).filter((x) => clear(cols[x]))),
  };
  return PHASE_ORDER.map((phase) => ({
    phase, ...PHASES[phase], says: PHASE[phase].first, stage: phase === 'chain' ? 'chain' : 'junk', picture: pictures[phase],
  }));
}

// ---------------------------------------------------------------- the levels

export interface LevelRow { name: string; label: string; target: number; bank: number; whites: number; techniques: Technique[]; adds: Technique[] }
/** Each target, lowest first: the columns of whites banked before its chain, and the techniques it plays (every
    level sweeps and brings a piece round too). */
export function levelRows(): LevelRow[] {
  let had: Technique[] = [];
  return LEVELS.map((l) => {
    const techniques: Technique[] = ['sweep', ...l.routines, ...(l.path ? ['path' as const] : [])];
    const adds = techniques.filter((t) => !had.includes(t));
    had = techniques;
    return { name: l.name, label: l.label, target: l.target, bank: bankFor(l.target), whites: Math.round(bankFor(l.target) * PER_COLUMN), techniques, adds };
  });
}
/** The lowest target whose bot plays a technique. */
export const firstLevel = (t: Technique): LevelRow | undefined => levelRows().find((l) => l.techniques.includes(t));

// ---------------------------------------------------------------- the techniques

export interface TechniqueExample { name: Technique; label: string; says: string | null; level: string | null; picture: Picture; offered: boolean }

/** Every technique in the order a player meets them: the sweep, then each level's new ones, the path search last. */
export function techniqueOrder(): Technique[] {
  const order: Technique[] = [];
  for (const l of levelRows()) for (const t of l.adds) if (t !== 'path' && !order.includes(t)) order.push(t);
  for (const r of Object.keys(ROUTINES) as RoutineName[]) if (!order.includes(r)) order.push(r);
  return [...order, 'path'];
}
const labelOf = (t: Technique): string => (t === 'sweep' ? SWEEP_LABEL : t === 'path' ? PATH_LABEL : ROUTINES[t].label);

/** Saving the whites, on the lesson's own board: the first move Helium plays in step one, as the routine offers it. */
function rescueOnLesson(): { picture: Picture; offered: boolean } {
  const lesson = lessonBoards();
  const moves = ROUTINES.rescue.find(lesson.before, STEP_ONE_CTX);
  const m = moves.find((x) => x.drags.length <= lesson.drags.length && x.drags.every((d, i) => d.x === lesson.drags[i].x && d.y === lesson.drags[i].y && same(d.ways, lesson.drags[i].ways)));
  const drags = m?.drags ?? moves[0]?.drags ?? [];
  return { picture: { cols: lesson.before, drags, rings: fireWhites(lesson.before), shade: range(COLS - FIRE_COLS, COLS), from: `${LESSON_FROM}, Helium's first move` }, offered: !!m };
}

export function techniqueExamples(): TechniqueExample[] {
  return techniqueOrder().map((name) => {
    let picture: Picture, offered: boolean;
    if (name === 'rescue') ({ picture, offered } = rescueOnLesson());
    else {
      const p = position(`technique:${name}`), cols = parseBoard(p.cols), live = liveMove(p);
      picture = { cols, drags: live.full, rings: [], shade: [], from: fromPosition(p) };
      offered = live.offered && (name !== 'sweep' || plainDrag(live.played)) && (name !== 'path' || stuck(cols, p.ctx as Ctx).length > 0);
    }
    const says = name === 'sweep' ? HELP.diamond : HELP[name];
    return { name, label: labelOf(name), says, level: firstLevel(name)?.label ?? null, picture, offered };
  });
}

// ---------------------------------------------------------------- the user's tricks

export interface TrickExample { trick: Trick; says: string | null; level: string | null; picture: Picture; shows: boolean }

// ---------------------------------------------------------------- the sorted right side's one fluid motion

/** A sorted right side (DISTILLING.md, the thirty-first note), as a real game at Helium's still had it
    (notes/distilling/45-sorted-right-side-one-fluid-motion.webp): the whites a block on the left and middle, the
    right-hand columns junk, blacks along the top and browns low. */
export const SORTED_RIGHT: readonly string[] = ['bKKwKwwK', 'wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wKwwwwww', 'KKKwwwbbb', 'KKbbwbbb', 'KKKbbbbbb', 'KbKbbbbK', 'bbKKKKKK*'];

/** How far the right side (from `from`) is out of its order: each brown above a black in the same column. */
export function unsorted(cols: Board, from: number): number {
  let n = 0;
  for (let x = from; x < COLS; x++) cols[x].forEach((p, i) => { if (p === BROWN) for (let j = i + 1; j < cols[x].length; j++) if (cols[x][j] === BLACK) n++; });
  return n;
}
/** A black that's joined the blacks: nothing but blacks (or the edge, or a spice) above it, so it climbs no further. */
export function amongBlacks(cols: Board, x: number, y: number): boolean {
  if (cols[x][y] !== BLACK || (y > 0 && cols[x][y - 1] !== BLACK)) return false;
  return [UP_RIGHT, UP_LEFT].every((w) => { const n = neighbourOn(cols, x, y, w); return !n || cols[n[0]][n[1]] === BLACK || cols[n[0]][n[1]] === SPICE; });
}
const isDown = (w: number) => w === DOWN_LEFT || w === DOWN_RIGHT;
/** Where a drag leaves its piece. */
export function endOf(cols: Board, d: Drag): [number, number] {
  let at: [number, number] = [d.x, d.y];
  for (const w of d.ways) at = neighbourOn(cols, at[0], at[1], w)!;
  return at;
}

/** The fluid motion (the user, 13 Nov: "once there's a nice clear separation, it's just down, up and back up
    again"): on a sorted right side, a black from the far left (not a corner tool kept top-left) dragged down
    through the whites, then up through the browns, in one drag, until it's joined the blacks on the right, with the
    right side no less sorted and no white let into it. The fewest swaps. */
export function fluidMotion(cols: Board, reach = 20): Drag | null {
  const from = rightFrom(cols), order = unsorted(cols, from), whites = whitesFrom(cols, from);
  let best: Drag | null = null;
  for (let x0 = 0; x0 < 2; x0++) for (let y0 = 2; y0 < cols[x0].length; y0++) {
    if (cols[x0][y0] !== BLACK) continue;
    const b = copyBoard(cols), ways: number[] = [], seen = new Set<number>([x0 * 16 + y0]);
    let nodes = 0;
    const dfs = (x: number, y: number, rising: boolean) => {
      if (ways.length >= reach || (best && ways.length >= best.ways.length) || nodes++ > 20000) return;
      for (const w of [DOWN_RIGHT, UP_RIGHT, DOWN_LEFT, UP_LEFT]) {
        if (rising && isDown(w)) continue;
        const n = neighbourOn(b, x, y, w);
        if (!n || seen.has(n[0] * 16 + n[1]) || !canSwapOn(b, x, y, n[0], n[1])) continue;
        const t = b[x][y]; b[x][y] = b[n[0]][n[1]]; b[n[0]][n[1]] = t; ways.push(w); seen.add(n[0] * 16 + n[1]);
        if (n[0] >= from && ways.some(isDown) && !isDown(w) && amongBlacks(b, n[0], n[1]) && unsorted(b, from) <= order && whitesFrom(b, from) <= whites
          && (!best || ways.length < best.ways.length)) best = { x: x0, y: y0, ways: [...ways] };
        else dfs(n[0], n[1], rising || !isDown(w));
        seen.delete(n[0] * 16 + n[1]); ways.pop(); b[n[0]][n[1]] = b[x][y]; b[x][y] = t;
      }
    };
    dfs(x0, y0, false);
  }
  return best;
}
/** Whether a drag is the fluid motion on its board: legal, a black, down first and then only up, ending among the
    blacks on the right with the right side no less sorted. */
export function isFluid(cols: Board, d: Drag): boolean {
  const after = playDrags(cols, [d]), from = rightFrom(cols);
  if (!after || cols[d.x][d.y] !== BLACK || !d.ways.length || !isDown(d.ways[0])) return false;
  const turn = d.ways.findIndex((w) => !isDown(w));
  if (turn < 0 || d.ways.slice(turn).some(isDown)) return false;
  const [ex, ey] = endOf(cols, d);
  return ex >= from && amongBlacks(after, ex, ey) && unsorted(after, from) <= unsorted(cols, from) && whitesFrom(after, from) <= whitesFrom(cols, from);
}

// ---------------------------------------------------------------- the pair rescue, in the chain

/** A brown stuck at the top of the column going up (the user, 13 Nov: "this is absolute danger mode ... the first
    thing I would be doing here is just rescuing that brown piece ... You got a brown piece there, look, that can
    move up, and then a black that can hop along the top"): the furnace's column all white but a brown at its top, a
    black on the top row a few columns left, a brown below it that can move up, the junk on the left. */
export const STUCK_ON_TOP: readonly string[] = ['bKbKbKbK', 'KbKbwKbKb', 'bKwbKbKw', 'KwbwKwbww', 'wwwwwwww', 'Kwwwwwwww', 'wbwwwwww', 'wwwwwwwww', 'wwwwwwww', 'bwwwwwwww'];

/** The pair rescue on a board, live: the chain's zone (`chainZones`), its stuck piece, and the drags the bots'
    `pairRescue` finds for the lowest target, which frees the column where no one piece brought round does. */
export function pairOn(cols: Board): { zone: number | null; stuck: [number, number] | null; drags: Drag[]; frees: boolean } {
  const ctx = contextFor(cols, 'chain', 0, LEVELS[0].reach), zone = chainZones(cols, ctx)[0] ?? null;
  if (zone === null) return { zone, stuck: null, drags: [], frees: false };
  const y = cols[zone].findIndex((p, i) => (p === BROWN || p === BLACK) && !canGo(cols, zone, i, -1));
  const drags = pairRescue(cols, zone, ctx, levelNamed(LEVELS[0].name)) ?? [];
  const after = drags.length ? playDrags(cols, drags) : null;
  const alone = bringRound(cols, { x: zone, y, side: -1 }, levelNamed(LEVELS[0].name));
  return { zone, stuck: [zone, y], drags, frees: !!after && !alone && after[zone].every((p) => p === WHITE || p === SPICE) };
}

/** The corner tools (keptTools): a brown in the bottom-left corner, a black in the top-left. */
function toolsAt(cols: Board): [number, number][] {
  const out: [number, number][] = [];
  for (let x = 0; x < 2; x++) cols[x].forEach((p, y) => { if ((p === BROWN && y >= cols[x].length - 2) || (p === BLACK && y <= 1)) out.push([x, y]); });
  return out;
}
const hardWhites = (cols: Board, x: number): [number, number][] => cols[x].flatMap((p, y) => (p === WHITE && !canGo(cols, x, y, -1) ? [[x, y] as [number, number]] : []));
const whitesIn = (cols: Board, x: number) => cols[x].filter((p) => p === WHITE).length;

export function trickExamples(): TrickExample[] {
  const kept = (key: string) => { const p = position(key), cols = parseBoard(p.cols); return { p, cols, drags: liveMove(p).played, from: fromPosition(p) }; };
  const out: TrickExample[] = [];
  // Every bot plays the tricks (the planner's own), so each comes in at the first level; the fluid motion once the
  // right side's turned over.
  const every = levelRows()[0].label;
  for (const trick of TRICKS) {
    if (trick === 'white') {
      // The opening's board, the column at the fire with a white in it: the bang.
      const cols = copyBoard(beforeBang().cols), last = COLS - 1;
      const rings = cols[last].flatMap((p, y) => (p === WHITE ? [[last, y] as [number, number]] : []));
      const bang = opening(lessonGame()).some((b) => b.mishap);
      out.push({ trick, says: OPENING.safe, level: every, picture: { cols, drags: [], rings, shade: [last], burn: true, from: `${LESSON_FROM}, Helium's opening` }, shows: bang && rings.length > 0 && !goesUp(cols[last]) });
      continue;
    }
    if (trick === 'fluid') {
      // A sorted right side, the black's one drag found on it, live.
      const cols = parseBoard(SORTED_RIGHT), d = fluidMotion(cols), from = rightFrom(cols);
      out.push({
        trick, says: null, level: firstLevel('turnOver')?.label ?? null,
        picture: { cols, drags: d ? [d] : [], rings: [], shade: range(from, COLS), from: 'A real game at Helium\'s still, the right side sorted' },
        shows: !!d && isFluid(cols, d),
      });
      continue;
    }
    if (trick === 'pair') {
      // The user's board, the plan found on it live.
      const cols = parseBoard(STUCK_ON_TOP), p = pairOn(cols);
      out.push({
        trick, says: HELP.path, level: every,
        picture: { cols, drags: p.drags, rings: p.stuck ? [p.stuck] : [], shade: p.zone === null ? [] : [p.zone], from: 'A board laid to show it: a brown stuck at the top of the column going up, the chain on' },
        shows: p.frees && p.drags.length >= 2,
      });
      continue;
    }
    const k = kept(`trick:${trick}`), { cols, drags } = k, after = drags.length ? playDrags(cols, drags) : cols;
    const pic = (rings: [number, number][], shade: number[], burn = false): Picture => ({ cols, drags, rings, shade, burn, from: k.from });
    const push = (says: string | null, picture: Picture, shows: boolean) => out.push({ trick, says, level: every, picture, shows });
    if (trick === 'danger') {
      const x = COLS - 2;
      push(NERVES.uneasy[1], pic(hardWhites(cols, x), [x, COLS - 1]), dangerZones(cols, 'junk', true).includes(x) && !!after && whitesIn(after, x) < whitesIn(cols, x));
    } else if (trick === 'edge') {
      const e = edgeWhites(cols);
      push(null, pic(e.map((w) => [w.x, w.y] as [number, number]), range(COLS - FIRE_COLS, COLS)), e.length > 0 && !!after && edgeWhites(after).length < e.length);
    } else if (trick === 'flick') {
      push(null, pic([], range(COLS - 4, COLS)), !!after && drags.length > 0);
    } else if (trick === 'blocks') {
      push(PHASE.block.first, pic([], []), blockPhase(cols) && !!after);
    } else if (trick === 'kept') {
      push(HELP.store, pic(toolsAt(cols), [0, 1]), blockPhase(cols) && keptTools(cols).brown && !!after && keptTools(after).brown);
    } else {
      push(HELP_ELSE.burn, pic([], [COLS - 1, COLS - 2, COLS - 3], true), burnsClean(cols[COLS - 1]) && clearComingUp(cols));
    }
  }
  return out;
}

// ---------------------------------------------------------------- reading the board

/** A board read, for the page (src/distill-read.ts): its state and tactic in plain words, why, and the board with the
    pieces it's about ringed and the bot's move there drawn. */
export interface ReadingExample { id: string; state: BoardState; tactic: Tactic; stateLabel: string; tacticLabel: string; about: string; why: string; picture: Picture }
/** The positions the page reads (src/distill-positions.ts, the user's own critiques): a white trapped by the fire, the
    ladder about to be lost, a cracked board, damage control. */
export const READ_EXAMPLES = ['P2', 'P8', 'P10', 'P7'] as const;
/** Each READ_EXAMPLES position read, as the planner reads it, with the bot's move there now. */
export function readingExamples(): ReadingExample[] {
  return READ_EXAMPLES.map((id) => {
    const p = POSITIONS_SEEN.find((q) => q.id === id)!, cols = boardOf(p), r = readBoard(cols, { stage: p.stage, timeLeft: p.timeLeft }), a = botAt(p);
    const rings: [number, number][] = r.tactic === 'sortLadder' ? [] : r.targets.slice(0, 6).map((t) => [t.x, t.y]);
    const shade = r.tactic === 'sortLadder' ? [COLS - 2, COLS - 1] : r.tactic === 'fixCracks' ? [] : [...new Set(r.targets.map((t) => t.x))];
    const s = Math.round(p.ms / 1000);
    return {
      id, state: r.state, tactic: r.tactic, stateLabel: STATES[r.state].label, tacticLabel: TACTICS[r.tactic].label, about: TACTICS[r.tactic].about, why: r.why,
      picture: { cols, drags: a.drags, rings, shade, from: `A real deal (seed ${p.seed}), ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} in, ${(p.timeLeft / 1000).toFixed(1)} s on the furnace; ${id} of the positions` },
    };
  });
}

// ---------------------------------------------------------------- Helium's lines, and the whole guide

// ---------------------------------------------------------------- the tricks, side by side

/** A trick drawn small (the user, 13 Nov: "that can appear in the guide quite well as small things next to each
    other"): its name, what you do and its one-line rule in Helium's words (src/lines/helium.ts, TEACH), and a picture
    of it on the board their lesson's played on, cropped round it (`crop`: the columns and rows shown). The five plain
    tricks their lesson shows, then the ladder (`bots`: the bots' sixth, junk past junk; never shown as a move to make),
    then making way. Every drag the bots make is one of these tricks or a run of them, with a goal
    (src/distill-goals.ts). */
export interface TrickTile { trick: DragTrick | 'makeWay'; name: string; how: string; rule: string; bots: boolean; picture: Picture; crop: { x: [number, number]; y: [number, number] } }
/** Every drag of one piece on a board, up to `most` swaps, each swap legal after the last. */
function everyDrag(cols: Board, most: number, visit: (d: Drag) => boolean): void {
  const walk = (b: Board, x0: number, y0: number, x: number, y: number, ways: number[]): boolean => {
    if (ways.length && visit({ x: x0, y: y0, ways: [...ways] })) return true;
    if (ways.length >= most) return false;
    for (const w of [UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT]) {
      const n = neighbourOn(b, x, y, w);
      if (!n || !canSwapOn(b, x, y, n[0], n[1])) continue;
      const nb = copyBoard(b); nb[n[0]][n[1]] = b[x][y]; nb[x][y] = b[n[0]][n[1]];
      if (walk(nb, x0, y0, n[0], n[1], [...ways, w])) return true;
    }
    return false;
  };
  for (let x = 1; x < COLS - 1; x++) for (let y = 1; y < cols[x].length - 1; y++) if (walk(cols, x, y, x, y, [])) return;
}
/** The columns and rows round some drags, a piece either side. */
function cropOf(cols: Board, drags: readonly Drag[]): TrickTile['crop'] {
  const cells = drags.flatMap((d) => { const out: [number, number][] = [[d.x, d.y]]; let at: [number, number] = [d.x, d.y]; for (const w of d.ways) { at = neighbourOn(cols, at[0], at[1], w)!; out.push(at); } return out; });
  const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]);
  return { x: [Math.max(0, Math.min(...xs) - 1), Math.min(COLS - 1, Math.max(...xs) + 1)], y: [Math.max(0, Math.min(...ys) - 1), Math.min(8, Math.max(...ys) + 1)] };
}
/** The tricks side by side: each found on the lesson's board after its opening (a drag of two swaps that's that trick
    alone, the first from the left; three for the weave if need be), making way as their lesson finds it for step one. */
export function trickTiles(): TrickTile[] {
  const cols = afterOpening().cols, out: TrickTile[] = [];
  const tile = (trick: TrickTile['trick'], drags: Drag[], bots = false): TrickTile => {
    const t = TEACH[trick];
    return { trick, name: t.name, how: t.how, rule: t.why, bots, picture: { cols, drags, rings: [], shade: [], from: LESSON_FROM }, crop: cropOf(cols, drags) };
  };
  for (const trick of DRAG_TRICKS) {
    let found: Drag | null = null;
    for (const most of [2, 3]) {
      everyDrag(cols, most, (d) => { const ts = dragTricks(cols, d); if (d.ways.length === most && ts.length === 1 && ts[0] === trick) { found = d; return true; } return false; });
      if (found) break;
    }
    if (found) out.push(tile(trick, [found], trick === LADDER));
  }
  const fire = Array.from({ length: FIRE_COLS }, (_, i) => COLS - FIRE_COLS + i);
  const way = makeWay(cols, aimFor(cols, fire, null, 1, 'out'), teachLevel(1));
  if (way) out.push(tile('makeWay', way.drags));
  return out;
}

/** Helium's lines the page quotes, from src/lines/helium.ts. */
export const QUOTES = { goal: BEST.none, stepOne: STEP_ONE.says, why: STEP_ONE.why, onward: ONWARD, tell: TELL, trick: TEACH.lift.why, spot: SPOT.three } as const;

/** Everything the page draws. */
export function guide() {
  return {
    pieces: PIECES, swaps: SWAPS, furnaceSecs: FURNACE_SECS, chainBonus: CHAIN_BONUS, flask: FLASK, carryOn: CARRY_ON, columns: sampleColumns(),
    phases: phaseExamples(), levels: levelRows(), techniques: techniqueExamples(), tricks: trickExamples(), quotes: QUOTES, plan: PLAN, reading: readingExamples(),
    trickTiles: trickTiles(),
  };
}
