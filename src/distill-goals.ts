/* Every drag a named trick with a goal: what each drag of a move is (src/distill-teach.ts's tricks, the climb, the
   sink, the lift, the drop, the weave and the ladder) and what it's for, read off the board it's played on, the
   planner's context and the board read (src/distill-read.ts's tactic and its targets). TypeScript, compiled to
   js/distill-goals.js; tested in tests/distill-goals.test.ts.

   The user (13 Nov), on Helium's teaching moves: "I like that you've got labelled moves of what the purpose and goal is
   of each ... if the bot follows, again, that is integrated into those same tricks, that it's not going to do a half
   move for no reason, like everything ... has got a goal and a reason and like linked to one of those more abstract
   moves." So the planner (src/distill-bots.ts, `choose`) names every drag of its move by its tricks and its goal, and
   never chooses a move with a drag that has none: a half move.

   A drag's goal, the first that holds, from what it does on the board as that drag starts:
   - the board read's own (Stage I): a white the tactic works on gone from its place (`free`, or `fill` when the tactic
     fills the gaps), the right-hand pair sorted (`ladder`), the V's tail sorted (`tail`), stranded junk freed
     (`cracks`), the way opened to a trapped white or the pieces round it set moving (`open`, the tactic's opening);
   - a white out of the columns to burn (`save`, the white dragged out; `fill`, junk dragged into its place);
   - in the chain, junk out of the column being filled or the two after it (`build`), a white brought toward it, junk
     taken back left out of its way;
   - a stuck piece freed (`untrap`: a white with no way out, or junk among the whites with none, src/distill-path.ts's
     `stuck`);
   - in Stage I, junk carried right to the colour, let go against junk or in the columns being built (`pull`), never
     left stranded among the whites; a white brought left out of a column that's more junk than white, stranding
     nothing (`bank`); a junk column sorted blacks over browns (`ladder`); junk stored with the junk on the left
     (`store`).
   A drag with none of those, followed in the same move by one that has one, makes way for it (`makeWay`); a move that
   sets up next move's save (the planner's `setUp`) has that for its goal (`setUp`). Anything else is a half move: no
   goal.

   Pure: no randomness, no clock; knows nothing of the den. */

import { BLACK, BROWN, COLS, WHITE, neighbourOn } from './distilling.js';
import type { Board } from './distilling.js';
import { isJunk, junkTarget, playDrags } from './distill-routines.js';
import type { Ctx, Drag } from './distill-routines.js';
import { dragTricks } from './distill-teach.js';
import type { DragTrick } from './distill-teach.js';
import { flow } from './distill-read.js';
import type { Reading } from './distill-read.js';
import { whiteRisk } from './distill-risk.js';
import { disorder, ladderBad, stranded, tailOrder } from './distill-patterns.js';
import { stuck } from './distill-path.js';

/** What a drag is for. */
export type GoalKind = 'save' | 'fill' | 'free' | 'open' | 'build' | 'untrap' | 'pull' | 'bank' | 'ladder' | 'tail' | 'cracks' | 'store' | 'makeWay' | 'setUp';
/** Each goal's kind in a word or two, for the pages. */
export const GOALS: Readonly<Record<GoalKind, string>> = {
  save: 'Save a white', fill: 'Fill a gap', free: 'Free a white', open: 'Open the way', build: 'Build the Crystal Clear', untrap: 'Free a stuck piece',
  pull: 'Junk to the colour', bank: 'A white to the others', ladder: 'Sort the junk', tail: 'Sort the tail', cracks: 'Fix a crack', store: 'Store the junk',
  makeWay: 'Make way', setUp: 'Set up the save',
};
/** A drag's goal: its kind, and in plain words what it's for ("free column 9's top white"). */
export interface Goal { kind: GoalKind; says: string; /** The white it's about, where it has one. */ at?: { x: number; y: number } }
/** A drag of a move named: its tricks in order (one, or the runs of a junk piece's drag), their names in words ("the
    lift, then the ladder"), and its goal (null: none, a half move). */
export interface DragStep { tricks: DragTrick[]; name: string; goal: Goal | null }

/** What the planner's after, for reading the goals: its context (the columns to burn, the column being filled, those let
    go), the board read in Stage I, and for a set-up move, the save it sets up, in words. */
export interface Aims { ctx: Ctx; reading?: Reading | null; setup?: string | null }

/** The trick names, as a player says them. */
export const TRICK_WORDS: Readonly<Record<DragTrick, string>> = { climb: 'the climb', sink: 'the sink', lift: 'the lift', drop: 'the drop', weave: 'the weave', ladder: 'the ladder' };
/** A drag's tricks in words: "the lift, then the ladder". */
export const trickName = (ts: readonly DragTrick[]): string => ts.map((t) => TRICK_WORDS[t]).join(', then ');

const PIECE = ['white', 'brown', 'black', 'spice', 'burnt white'];
/** A white by its place, as a player names it: "column 9's top white", "column 8's white in row 4". */
export function whiteAt(cols: Board, x: number, y: number): string {
  const edge = y === 0 ? 'top ' : y === cols[x].length - 1 ? 'bottom ' : '';
  return edge ? `column ${x + 1}'s ${edge}white` : `column ${x + 1}'s white in row ${y + 1}`;
}
/** Where a drag lets its piece go. */
function endOf(cols: Board, d: Drag): [number, number] {
  let at: [number, number] = [d.x, d.y];
  for (const w of d.ways) { const n = neighbourOn(cols, at[0], at[1], w); if (!n) break; at = n; }
  return at;
}
const whitesIn = (b: Board, x: number) => b[x].filter((p) => p === WHITE).length;
const junkIn = (b: Board, x: number) => b[x].filter(isJunk).length;
/** Columns that burn: from `burnFrom` on, and those let go (`over`). */
const burnsAt = (ctx: Ctx) => (x: number): boolean => x >= ctx.burnFrom || (!!ctx.over && x >= ctx.over[0] && x <= ctx.over[1]);
/** A piece of junk let go against the junk on its right (or the right-hand edge): joined up with the colour. */
function joined(b: Board, [x, y]: [number, number]): boolean {
  if (!isJunk(b[x][y])) return false;
  for (const w of [0, 3]) { const n = neighbourOn(b, x, y, w); if (n && !isJunk(b[n[0]][n[1]])) return false; }
  return true;
}
/** ... or against the junk on its left (or the left-hand edge): with the junk stored there. */
function joinedLeft(b: Board, [x, y]: [number, number]): boolean {
  if (!isJunk(b[x][y])) return false;
  for (const w of [1, 2]) { const n = neighbourOn(b, x, y, w); if (n && !isJunk(b[n[0]][n[1]])) return false; }
  return true;
}
const key = (p: { x: number; y: number }) => p.x * 16 + p.y;
/** The stranded junk and the stuck pieces on a board, kept for the board a planner's candidates all start from. */
const strandedOn = new WeakMap<Board, number>(), stuckOn = new WeakMap<Board, { ctx: Ctx; keys: number[] }>();
const strandedN = (b: Board): number => { let n = strandedOn.get(b); if (n === undefined) { n = stranded(b).length; strandedOn.set(b, n); } return n; };
function stuckKeys(b: Board, ctx: Ctx): number[] {
  const had = stuckOn.get(b);
  if (had && had.ctx === ctx) return had.keys;
  const keys = stuck(b, ctx).map(key);
  stuckOn.set(b, { ctx, keys });
  return keys;
}

/** A drag's own goal, played on board `b` (the board as it starts), leaving `a`; null if it gets nothing done. */
export function ownGoal(b: Board, d: Drag, a: Board, aims: Aims): Goal | null {
  const { ctx, reading: r } = aims, p = b[d.x][d.y], end = endOf(b, d), burns = burnsAt(ctx), one = ctx.stage === 'junk';
  const what = PIECE[p] ?? 'piece';
  // The board read's own: the whites the tactic works on, the patterns it sorts.
  if (one && r) {
    if (r.tactic === 'freeTrapped' || r.tactic === 'fillGaps') {
      const t = r.targets.find((q) => b[q.x][q.y] === WHITE && a[q.x][q.y] !== WHITE);
      if (t) return r.tactic === 'fillGaps' ? { kind: 'fill', says: `fill column ${t.x + 1}'s gap: ${whiteAt(b, t.x, t.y)} out left`, at: { x: t.x, y: t.y } } : { kind: 'free', says: `free ${whiteAt(b, t.x, t.y)}`, at: { x: t.x, y: t.y } };
    }
    if (r.tactic === 'sortLadder' && ladderBad(a) < ladderBad(b)) return { kind: 'ladder', says: `sort columns ${COLS - 1} and ${COLS}, blacks over browns, before column ${COLS} goes` };
    if (r.tactic === 'sortTail' && tailOrder(a, r.patterns.tail.from) > tailOrder(b, r.patterns.tail.from)) return { kind: 'tail', says: 'sort the V\'s tail: the brown down through the blacks, so the next sweep runs through' };
    if (r.tactic === 'fixCracks') {
      const now = new Set(stranded(a).map(key)), freed = stranded(b).find((q) => !now.has(key(q)));
      if (freed && now.size < strandedN(b)) return { kind: 'cracks', says: `free the stranded ${PIECE[b[freed.x][freed.y]]} at column ${freed.x + 1}, row ${freed.y + 1}` };
    }
    if (r.tactic === 'freeTrapped') {
      const t = r.targets[0];
      if (t && b[t.x][t.y] === WHITE && a[t.x][t.y] === WHITE) {
        if (whiteRisk(a, t.x, t.y, r.timeLeft).risk < whiteRisk(b, t.x, t.y, r.timeLeft).risk) return { kind: 'open', says: `open the way to ${whiteAt(b, t.x, t.y)}`, at: { x: t.x, y: t.y } };
        if (flow(a, t) > flow(b, t)) return { kind: 'open', says: `set the pieces round ${whiteAt(b, t.x, t.y)} moving`, at: { x: t.x, y: t.y } };
      }
    }
  }
  // A white out of the columns to burn, or further from the fire among them (out of the furnace's column first).
  let fell = -1, out = false;
  for (let x = COLS - 1, sb = 0, sa = 0; x >= 0; x--) {
    sb += whitesIn(b, x); sa += whitesIn(a, x);
    if (!burns(x)) { if (fell >= 0 && sa < sb) out = true; break; }
    if (sa < sb && fell < 0) fell = x;
  }
  if (fell >= 0) {
    const where = out ? 'out before it burns' : 'further from the fire';
    return p === WHITE && burns(d.x) ? { kind: 'save', says: `get ${whiteAt(b, d.x, d.y)} ${where}` }
      : { kind: 'fill', says: `fill column ${fell + 1}'s gap: its white ${out ? 'out left before it burns' : 'further from the fire'}` };
  }
  // The chain: the columns going up next cleared of junk, whites brought toward them, junk out of their way.
  if (!one && ctx.fill >= 0) {
    for (const x of [ctx.fill, ctx.fill - 1, ctx.fill - 2]) {
      if (x < 0 || burns(x) || junkIn(a, x) >= junkIn(b, x)) continue;
      return { kind: 'build', says: x === ctx.fill ? `clear column ${x + 1}'s junk for the Crystal Clear` : `clear column ${x + 1}'s junk, to go up after column ${ctx.fill + 1}` };
    }
  }
  // A stuck piece freed: a white with no way out, junk among the whites with none.
  const was = stuckKeys(b, ctx), still = new Set(stuck(a, ctx).map(key));
  const freed = was.find((k) => !still.has(k));
  if (freed !== undefined && still.size < was.length) {
    const fx = Math.floor(freed / 16), fy = freed % 16, q = b[fx][fy];
    return { kind: 'untrap', says: q === WHITE ? `free ${whiteAt(b, fx, fy)}, stuck` : `free the stuck ${PIECE[q]} at column ${fx + 1}, row ${fy + 1}` };
  }
  if (!one) {
    if (p === WHITE && end[0] > d.x && end[0] <= ctx.fill) return { kind: 'build', says: `bring a white over toward column ${ctx.fill + 1}` };
    if (isJunk(p) && end[0] < d.x) return { kind: 'build', says: `take the ${what} back left, out of the chain's way` };
    return null;
  }
  // Stage I: junk over to the colour, a white over to the others, the junk sorted or stored; nothing stranded.
  let s0: number | null = null;
  const strands = () => (s0 ??= stranded(a).length) > strandedN(b);
  const building = junkTarget(b);
  if (isJunk(p) && end[0] > d.x && !strands() && (joined(a, end) || end[0] >= building - 1 || junkIn(a, end[0]) > whitesIn(a, end[0]))) {
    return { kind: 'pull', says: `carry the ${what} over to the colour in column ${end[0] + 1}` };
  }
  if (p === WHITE && end[0] < d.x && junkIn(b, d.x) > whitesIn(b, d.x) && !strands()) {
    return { kind: 'bank', says: `bring ${whiteAt(b, d.x, d.y)} left, out of the junk` };
  }
  const touched = new Set([d.x, end[0]]);
  for (const x of touched) {
    if (junkIn(b, x) * 2 < b[x].length || whitesIn(a, x) !== whitesIn(b, x)) continue;
    if (disorder(a[x]) < disorder(b[x])) return { kind: 'ladder', says: `sort column ${x + 1}'s junk, blacks over browns` };
  }
  if (isJunk(p) && end[0] < d.x && !strands() && (end[0] === 0 || joinedLeft(a, end))) {
    return { kind: 'store', says: `store the ${what} with the junk on the left, for later` };
  }
  return null;
}

/** A move's drags named, each its tricks and goal (see the header): a drag with no goal of its own makes way for the
    next that has one; a set-up move's drags with none set up its save. */
export function stepsFor(cols: Board, drags: readonly Drag[], aims: Aims): DragStep[] {
  const out: DragStep[] = [];
  let b = cols;
  for (const d of drags) {
    const a = playDrags(b, [d]);
    const tricks = dragTricks(b, d);
    out.push({ tricks, name: trickName(tricks), goal: a ? ownGoal(b, d, a, aims) : null });
    if (!a) break;
    b = a;
  }
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i].goal) continue;
    const j = out.findIndex((s, k) => k > i && s.goal && s.goal.kind !== 'setUp');
    if (j > i) out[i].goal = { kind: 'makeWay', says: `make way for drag ${j + 1}` };
    else if (aims.setup) out[i].goal = { kind: 'setUp', says: aims.setup };
  }
  return out;
}

/** Whether every drag of a move has a goal: no half move in it. */
export const purposeful = (steps: readonly DragStep[]): boolean => steps.length > 0 && steps.every((s) => s.goal !== null);

/** A move's drags in a line each: "1. The lift: fill column 9's gap". */
export function stepLines(steps: readonly DragStep[]): string[] {
  return steps.map((s, i) => `${steps.length > 1 ? `${i + 1}. ` : ''}${s.name[0].toUpperCase()}${s.name.slice(1)}: ${s.goal ? s.goal.says : 'no goal (a half move)'}`);
}
