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
     `edgeWhites`, `keptTools`, `clearComingUp`).
   - Helium's lines, quoted from src/lines/helium.ts.
   The words round them are the page's own, written by hand.

   Pure: no randomness (the lesson's deal is seeded), no clock, no DOM. */

import {
  BLACK, BROWN, BURNT, BURN_TICKS, CARRY_ON, CHAIN_BONUS, COLS, FLASK, MESSAGES, POINTS, SPICE, TICK_MS, WHITE, beats, goesUp, judge, parseBoard, weightOf,
} from './distilling.js';
import type { Board } from './distilling.js';
import { ROUTINES, canGo, clear, copyBoard, junkTarget, playDrags, burnsClean } from './distill-routines.js';
import type { Ctx, Drag, RoutineName } from './distill-routines.js';
import { FIRE_COLS, PHASES, PHASE_ORDER, phaseOf } from './distill-phase.js';
import type { Phase } from './distill-phase.js';
import { LEVELS, PATH_LABEL, PER_COLUMN, SWEEP_LABEL, bankFor, clearComingUp, dangerZones, edgeWhites, plainDrag } from './distill-bots.js';
import { blockPhase, keptTools } from './distill-score.js';
import { stuck } from './distill-path.js';
import { STEP_ONE_CTX, afterOpening, beforeBang, lessonPlan, opening, lessonGame } from './den-helium.js';
import { BEST, HELP, HELP_ELSE, NERVES, ONWARD, OPENING, PHASE, STEP_ONE, TELL } from './lines/helium.js';
import { POSITIONS } from './distill-guide-boards.js';
import type { Position } from './distill-guide-boards.js';

/** A technique on the page: a routine, the sweep (a long plain drag) or the path search (a piece brought round). */
export type Technique = RoutineName | 'sweep' | 'path';
/** The user's tricks (DISTILLING.md §3, the twentieth to twenty-ninth notes), in the page's order. */
export const TRICKS = ['white', 'danger', 'edge', 'flick', 'blocks', 'kept', 'burnEarly'] as const;
export type Trick = typeof TRICKS[number];

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

export interface TrickExample { trick: Trick; says: string | null; picture: Picture; shows: boolean }

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
  for (const trick of TRICKS) {
    if (trick === 'white') {
      // The opening's board, the column at the fire with a white in it: the bang.
      const cols = copyBoard(beforeBang().cols), last = COLS - 1;
      const rings = cols[last].flatMap((p, y) => (p === WHITE ? [[last, y] as [number, number]] : []));
      const bang = opening(lessonGame()).some((b) => b.mishap);
      out.push({ trick, says: OPENING.safe, picture: { cols, drags: [], rings, shade: [last], burn: true, from: `${LESSON_FROM}, Helium's opening` }, shows: bang && rings.length > 0 && !goesUp(cols[last]) });
      continue;
    }
    const k = kept(`trick:${trick}`), { cols, drags } = k, after = drags.length ? playDrags(cols, drags) : cols;
    const pic = (rings: [number, number][], shade: number[], burn = false): Picture => ({ cols, drags, rings, shade, burn, from: k.from });
    if (trick === 'danger') {
      const x = COLS - 2;
      out.push({ trick, says: NERVES.uneasy[1], picture: pic(hardWhites(cols, x), [x, COLS - 1]), shows: dangerZones(cols, 'junk', true).includes(x) && !!after && whitesIn(after, x) < whitesIn(cols, x) });
    } else if (trick === 'edge') {
      const e = edgeWhites(cols);
      out.push({ trick, says: null, picture: pic(e.map((w) => [w.x, w.y] as [number, number]), range(COLS - FIRE_COLS, COLS)), shows: e.length > 0 && !!after && edgeWhites(after).length < e.length });
    } else if (trick === 'flick') {
      out.push({ trick, says: null, picture: pic([], range(COLS - 4, COLS)), shows: !!after && drags.length > 0 });
    } else if (trick === 'blocks') {
      out.push({ trick, says: PHASE.block.first, picture: pic([], []), shows: blockPhase(cols) && !!after });
    } else if (trick === 'kept') {
      out.push({ trick, says: HELP.store, picture: pic(toolsAt(cols), [0, 1]), shows: blockPhase(cols) && keptTools(cols).brown && !!after && keptTools(after).brown });
    } else {
      out.push({ trick, says: HELP_ELSE.burn, picture: pic([], [COLS - 1, COLS - 2, COLS - 3], true), shows: burnsClean(cols[COLS - 1]) && clearComingUp(cols) });
    }
  }
  return out;
}

// ---------------------------------------------------------------- Helium's lines, and the whole guide

/** Helium's lines the page quotes, from src/lines/helium.ts. */
export const QUOTES = { goal: BEST.none, stepOne: STEP_ONE.says, why: STEP_ONE.why, onward: ONWARD, tell: TELL } as const;

/** Everything the page draws. */
export function guide() {
  return {
    pieces: PIECES, swaps: SWAPS, furnaceSecs: FURNACE_SECS, chainBonus: CHAIN_BONUS, flask: FLASK, carryOn: CARRY_ON, columns: sampleColumns(),
    phases: phaseExamples(), levels: levelRows(), techniques: techniqueExamples(), tricks: trickExamples(), quotes: QUOTES,
  };
}
