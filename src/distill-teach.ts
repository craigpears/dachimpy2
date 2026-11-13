/* Distilling taught: the move a learner is shown, picked to be seen and repeated. TypeScript, compiled to
   js/distill-teach.js; tested in tests/distill-teach.test.ts. Knows nothing of the den: Helium's plan at their still
   (src/den-helium.ts, planFor) hands it the step's aim and the bots' own move, and draws what it picks.

   The user (13 Nov), playing Helium's plan: "it's giving you really complicated moves ... I'm not really sure that
   seemed very tutorial-like. Like, am I supposed to be able to figure out and spot similar things?" and "the drawing
   of the arrows was all fine ... if we go for a crystal clear one, those were complicated moves. Maybe for later,
   sure, but for crystal clear one starting, no." And: "drag the brown to the right, and then the white to the left.
   When to me, it's like, well, why isn't that just one move?"

   So the move shown is one drag, short, one of a few named plain tricks, each the swap rule seen once
   (DISTILLING.md §3, "The physics": in blacks whites rise, in whites browns rise and blacks sink, in browns whites
   sink), picked for what the plan's step is after (`Aim`: whites out of the junk columns, junk out of the gold
   column), the plainest that does the most, the same trick again while it still does well. When none helps yet, a
   short drag first that makes way for one (`makeWay`, the two numbered), never a single drag split in two
   (`joinPairs`). How plain scales with the goal (`teachLevel`): at a Crystal Clear 1 drags of up to three swaps, four
   from CC^2, and the bots' own techniques first only from CC^5. Below that the bots' move (src/distill-bots.ts,
   advise) only when nothing plain helps, a split pair in it joined into the one drag a player would make, shown a
   drag at a time, and only when the whole of it does something for the step. With a plain move, the other places
   the same trick works now (`spots`), a few, for you to find. */

import { BLACK, BROWN, BURNT, COLS, SPICE, WHITE, UP_LEFT, UP_RIGHT, DOWN_LEFT, DOWN_RIGHT, canSwapOn, neighbourOn, type Board } from './distilling.js';
import { playDrags, type Drag } from './distill-routines.js';

/** The plain tricks, each one rule of the swap seen in a drag: a white dragged up through blacks (`climb`) or down
    through browns (`sink`); a brown dragged up through whites (`lift`), or a black down through them (`drop`), each
    white it passes stepping the other way; and a white dragged up over blacks and down under browns in one go
    (`weave`). */
export const TRICKS = ['climb', 'sink', 'lift', 'drop', 'weave'] as const;
export type Trick = (typeof TRICKS)[number];
/** What a move shown is: a plain trick; a short drag first to make way for one (`makeWay`, the two drawn numbered,
    never two that are one drag split: `joinPairs`); or the bots' own (`bots`). */
export type Shown = Trick | 'makeWay' | 'bots';

/** How plain the moves are for a goal: the tricks, the most swaps a drag (and a drag making way), and when the bots'
    own move comes in: only when no plain move helps (`fallback`), or first (`first`). */
export interface TeachLevel { from: number; tricks: readonly Trick[]; swaps: number; makeWay: number; bots: 'fallback' | 'first' }
export const TEACH_LEVELS: readonly TeachLevel[] = [
  { from: 1, tricks: TRICKS, swaps: 3, makeWay: 2, bots: 'fallback' },
  { from: 2, tricks: TRICKS, swaps: 4, makeWay: 2, bots: 'fallback' },
  { from: 5, tricks: TRICKS, swaps: 5, makeWay: 3, bots: 'first' },
];
/** The level for a goal (a Crystal Clear `goal`): the last whose `from` it reaches. */
export const teachLevel = (goal: number): TeachLevel => [...TEACH_LEVELS].reverse().find((l) => goal >= l.from) ?? TEACH_LEVELS[0];

/** What the plan's step is after, as a cost to bring down: whites (and burnt whites) in `out` (the junk columns to
    burn), the nearer the fire the dearer; and junk in `into` (the columns to go up Crystal Clear), each with its
    weight (the gold column 1, the ones after it for a longer chain less). `focus`, the part the step's about: a
    plain move must bring that part on, not only the other (clearing the junk columns, a white got out of them). */
export interface Aim { out: readonly number[]; into: readonly { x: number; w: number }[]; focus?: 'out' | 'into' }
const whiteish = (p: number) => p === WHITE || p === BURNT;
const junky = (p: number) => p !== WHITE && p !== SPICE;
/** A white in the junk columns: 1, and a quarter more a column nearer the fire. */
const OUT_STEP = 0.25;
/** The aim's cost on a board, or one `part` of it. */
export function cost(cols: Board, aim: Aim, part?: 'out' | 'into'): number {
  let c = 0;
  const first = aim.out.length ? Math.min(...aim.out) : COLS;
  if (part !== 'into') for (const x of aim.out) for (const p of cols[x]) if (whiteish(p)) c += 1 + OUT_STEP * (x - first + 1);
  if (part !== 'out') for (const { x, w } of aim.into) if (x >= 0 && x < COLS) for (const p of cols[x]) if (junky(p)) c += w;
  return c;
}

/** A move a learner's shown: the trick (or the bots' own), its one drag (the bots' may be more from CC^5), what it
    brings the step's cost down by, and its swaps. */
export interface TeachMove { trick: Shown; drags: Drag[]; value: number; swaps: number }

const up = (w: number) => w === UP_LEFT || w === UP_RIGHT;
const right = (w: number) => w === UP_RIGHT || w === DOWN_RIGHT;
/** The trick a drag of piece `p` along `ways` is, or null if it's none of them. */
export function trickOf(p: number, ways: readonly number[]): Trick | null {
  if (!ways.length) return null;
  const ups = ways.filter(up).length, all = ups === ways.length, none = ups === 0;
  if (whiteish(p)) return all ? 'climb' : none ? 'sink' : 'weave';
  // (a brown or black a single swap is the same swap as the white's: shown as the white's, the one it's about)
  if (ways.length < 2) return null;
  if (p === BROWN && all) return 'lift';
  if (p === BLACK && none) return 'drop';
  return null;
}
/** Whether a drag's swaps keep to one side (never back on itself). */
const shapeOk = (ways: readonly number[]): boolean => ways.every((w) => right(w) === right(ways[0]));

/** A swap on a board, as a new board sharing the columns it doesn't touch; null if the rule won't have it. */
function swapped(b: Board, x: number, y: number, w: number): { b: Board; at: [number, number] } | null {
  const n = neighbourOn(b, x, y, w);
  if (!n || !canSwapOn(b, x, y, n[0], n[1])) return null;
  const nb = b.slice();
  nb[x] = [...b[x]]; nb[n[0]] = [...b[n[0]]];
  nb[n[0]][n[1]] = b[x][y]; nb[x][y] = b[n[0]][n[1]];
  return { b: nb, at: n };
}
/** Every drag of one piece on the board up to `most` swaps, keeping to one side, each swap legal after the last
    (`keep` prunes a way for a piece), from the columns `from` allows: the drag and the board after. */
function eachDrag(cols: Board, most: number, keep: (p: number, w: number) => boolean, visit: (d: Drag, after: Board) => void, from: (x: number) => boolean = () => true): void {
  const walk = (b: Board, x0: number, y0: number, x: number, y: number, ways: number[]) => {
    if (ways.length) visit({ x: x0, y: y0, ways: [...ways] }, b);
    if (ways.length >= most) return;
    for (const w of [UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT]) {
      if (ways.length && !shapeOk([...ways, w])) continue;
      if (!keep(cols[x0][y0], w)) continue;
      const s = swapped(b, x, y, w);
      if (s) walk(s.b, x0, y0, s.at[0], s.at[1], [...ways, w]);
    }
  };
  for (let x = 0; x < COLS; x++) if (from(x)) for (let y = 0; y < cols[x].length; y++) if (cols[x][y] !== SPICE) walk(cols, x, y, x, y, []);
}
/** Whether column x is within `reach` columns of any the aim's about (a drag from further off can't change its cost). */
const nearAim = (aim: Aim, reach: number) => (x: number): boolean =>
  aim.out.some((o) => Math.abs(o - x) <= reach) || aim.into.some((i) => Math.abs(i.x - x) <= reach);

/** Every plain drag on the board a level allows (one piece, its swaps legal one after another), with its trick and
    what it does for the aim: the ones that help (value > 0). */
export function plainMoves(cols: Board, aim: Aim, level: TeachLevel): TeachMove[] {
  const base = cost(cols, aim), focus = aim.focus, part = focus ? cost(cols, aim, focus) : 0, out: TeachMove[] = [];
  // (a brown is only ever lifted, a black only dropped: nothing else of theirs is a trick)
  const keep = (p: number, w: number) => !((p === BROWN && !up(w)) || (p === BLACK && up(w)));
  eachDrag(cols, level.swaps, keep, (d, after) => {
    const trick = trickOf(cols[d.x][d.y], d.ways);
    if (!trick || !level.tricks.includes(trick)) return;
    const value = base - cost(after, aim);
    if (value > 1e-9 && (!focus || part - cost(after, aim, focus) > 1e-9)) out.push({ trick, drags: [d], value, swaps: d.ways.length });
  }, nearAim(aim, level.swaps));
  return out;
}

/** The best of them: the most it does, then the fewest swaps, then the one nearest `near` (the bots' own move's
    piece: the same column, the same aim), then the one nearest the fire. */
function best(moves: readonly TeachMove[], near: { x: number; y: number } | null): TeachMove | null {
  const dist = (m: TeachMove) => (near ? Math.abs(m.drags[0].x - near.x) + Math.abs(m.drags[0].y - near.y) * 0.5 : 0);
  let top: TeachMove | null = null;
  for (const m of moves) {
    if (!top) { top = m; continue; }
    const d = m.value - top.value;
    if (d > 1e-9 || (d > -1e-9 && (m.swaps < top.swaps || (m.swaps === top.swaps && (dist(m) < dist(top) || (dist(m) === dist(top) && m.drags[0].x > top.drags[0].x)))))) top = m;
  }
  return top;
}

/** The pieces a drag touches: the one held and every place it passes through. */
export function touched(cols: Board, d: Drag): [number, number][] {
  const out: [number, number][] = [[d.x, d.y]];
  let x = d.x, y = d.y;
  for (const w of d.ways) { const n = neighbourOn(cols, x, y, w); if (!n) break; [x, y] = n; out.push([x, y]); }
  return out;
}

/** The ringed places to find at the most (the user wants it light: "it shouldn't be a wall of rings"). */
export const SPOT_MOST = 3;
/** The other places the same trick works now: one drag a piece (its best), none touching the move shown, the most
    useful first, at most SPOT_MOST; `more`, how many there are in all. */
export function spotsFor(cols: Board, shown: TeachMove, moves: readonly TeachMove[]): { spots: Drag[]; more: number } {
  const used = new Set(touched(cols, shown.drags[0]).map(([x, y]) => `${x},${y}`));
  const byPiece = new Map<string, TeachMove>();
  for (const m of moves) {
    if (m.trick !== shown.trick) continue;
    const k = `${m.drags[0].x},${m.drags[0].y}`;
    if (used.has(k)) continue;
    const had = byPiece.get(k);
    if (!had || m.value > had.value + 1e-9 || (Math.abs(m.value - had.value) <= 1e-9 && m.swaps < had.swaps)) byPiece.set(k, m);
  }
  const all = [...byPiece.values()].sort((a, b) => b.value - a.value || a.swaps - b.swaps || b.drags[0].x - a.drags[0].x || a.drags[0].y - b.drags[0].y);
  return { spots: all.slice(0, SPOT_MOST).map((m) => ({ ...m.drags[0], ways: [...m.drags[0].ways] })), more: all.length };
}

const opposite = (w: number) => (w + 2) % 4;
const sameBoard = (a: Board | null, b: Board | null) => !!a && !!b && a.every((c, x) => c.every((p, y) => p === b[x][y]));
/** Two drags that are one drag split, joined, or null: the same piece held on (the second starts where the first
    ended), or a one-swap drag of a piece onto another and then that other piece dragged on from where it was put
    (one drag of the other piece the whole way, its first swap the same one); checked to leave the board the same. */
function joinTwo(b: Board, a: Drag, n: Drag): Drag | null {
  const both = playDrags(b, [a, n]);
  if (!both) return null;
  const end = touched(b, a).at(-1)!, tries: Drag[] = [];
  if (n.x === end[0] && n.y === end[1]) tries.push({ x: a.x, y: a.y, ways: [...a.ways, ...n.ways] });
  const m = a.ways.length === 1 && n.x === a.x && n.y === a.y ? neighbourOn(b, a.x, a.y, a.ways[0]) : null;
  if (m) tries.push({ x: m[0], y: m[1], ways: [opposite(a.ways[0]), ...n.ways] });
  return tries.find((one) => sameBoard(playDrags(b, [one]), both)) ?? null;
}
/** Split drags joined (the user, 13 Nov: "drag the brown to the right, and then the white to the left ... why isn't
    that just one move?"): every run of drags in `drags` on board `cols` that's one drag split (joinTwo) made the one
    drag a player would make. (The bots' agent is adding its own to the bots' Advice, 13 Nov; the two to be joined.) */
export function joinPairs(cols: Board, drags: readonly Drag[]): Drag[] {
  const out: Drag[] = [];
  let b = cols.map((c) => [...c]), cur: Drag | null = null;
  for (const d0 of drags) {
    const d = { x: d0.x, y: d0.y, ways: [...d0.ways] };
    if (cur) {
      const one = joinTwo(b, cur, d);
      if (one) { cur = one; continue; }
      out.push(cur);
      b = playDrags(b, [cur]) ?? b;
    }
    cur = d;
  }
  if (cur) out.push(cur);
  return out;
}

/** What's shown for a step: the move (null: nothing to drag, the step's to burn), the other places its trick works,
    and how many in all. */
export interface Teach { move: TeachMove | null; spots: Drag[]; more: number }
/** The trick shown last is shown again while it does at least this share of what the best move would. */
export const KEEP_TRICK = 0.5;
/** The move to show a learner for a step's `aim` on board `cols` at goal `goal`, given the bots' own drags for it
    (`bots`, src/distill-bots.ts's advise, to the same target): the plainest good one for the step's focus (the trick
    shown last, `prefer`, kept while it still does well), or a short drag making way for one, or a plain one for the
    rest of the aim; the bots' (joined, and one drag at a time below CC^5) only when none of those helps, or first from
    CC^5. */
export function teach(cols: Board, aim: Aim, goal: number, bots: readonly Drag[] = [], prefer: Shown | null = null): Teach {
  const level = teachLevel(goal), joined = bots.length ? joinPairs(cols, bots) : [];
  const near = joined.length ? { x: joined[0].x, y: joined[0].y } : null;
  /** The plainest good move for an aim, and the other places its trick works. */
  const plainFor = (a: Aim): Teach | null => {
    const all = plainMoves(cols, a, level);
    // (the trick shown last again while it still does at least half as much as the best: the same trick in a row,
    // the rings' places among them, so it's learned by doing it again)
    const top = all.reduce((v, m) => Math.max(v, m.value), 0), again = all.filter((m) => m.trick === prefer && m.value >= top * KEEP_TRICK);
    const m = best(again.length ? again : all, near);
    return m ? { move: m, ...spotsFor(cols, m, all) } : null;
  };
  const theirs = joined.length ? (level.bots === 'first' ? joined : joined.slice(0, 1)) : [];
  const botMove: TeachMove | null = theirs.length && playDrags(cols, theirs)
    ? { trick: 'bots', drags: theirs, value: cost(cols, aim) - cost(playDrags(cols, theirs)!, aim), swaps: theirs.reduce((n, d) => n + d.ways.length, 0) }
    : null;
  if (level.bots === 'first' && botMove) return { move: botMove, spots: [], more: 0 };
  const plain = plainFor(aim);
  if (plain) return plain;
  const way = makeWay(cols, aim, level);
  if (way) return { move: way, spots: [], more: 0 };
  // (nothing plain for the step's focus: a plain move for the rest of it, the gold column, say, while the whites in
  // the junk wait for a way out)
  const rest = aim.focus ? plainFor({ ...aim, focus: undefined }) : null;
  if (rest) return rest;
  // (theirs a drag at a time, while the whole of it does something for the step: never a shuffle that leads nowhere)
  const whole = playDrags(cols, joined);
  return { move: botMove && whole && cost(cols, aim) - cost(whole, aim) > 1e-9 ? botMove : null, spots: [], more: 0 };
}

/** A drag making way starts this near the columns the step's about. */
export const MAKE_WAY_NEAR = 2;
/** When no plain move helps yet: a short drag first (any piece, at most the level's `makeWay` swaps, nothing made
    worse) that opens the way for a plain one, the two together (numbered). Never a pair that's one drag split
    (`joinPairs`): that's one drag, shown as one, or not at all. The pair that does the most, then the fewest swaps. */
export function makeWay(cols: Board, aim: Aim, level: TeachLevel): TeachMove | null {
  const base = cost(cols, aim);
  let top: TeachMove | null = null;
  eachDrag(cols, level.makeWay, () => true, (d, after) => {
    const first = base - cost(after, aim);
    if (first < -1e-9) return;
    const then = best(plainMoves(after, aim, level), { x: d.x, y: d.y });
    if (!then || joinPairs(cols, [d, then.drags[0]]).length < 2) return;
    const value = first + then.value, swaps = d.ways.length + then.swaps;
    if (!top || value > top.value + 1e-9 || (value > top.value - 1e-9 && swaps < top.swaps)) top = { trick: 'makeWay', drags: [d, then.drags[0]], value, swaps };
  }, nearAim(aim, MAKE_WAY_NEAR));
  return top;
}
