/* The late game's channels: a white brought right into the column being filled, in for a piece of junk stuck there, along
   a channel of junk made for it. TypeScript, compiled to js/distill-channel.js; tested in tests/distill-channel.test.ts;
   offered by the planner in the chain (src/distill-bots.ts, `weigh`), its drags named by src/distill-goals.ts ('channel'
   and 'buildChannel').

   The user (14 Nov, watching CC^1, DISTILLING.md "The late game: whites go right"): "they create a kind of channel for
   the white to go through. And then the white ... can then follow that channel"; "a move becomes a move through the
   brown channel and then the black channel ... this is how the late game strategy works." By the swap rule a white sinks
   through browns and rises through blacks, so one drag carries it down a brown channel and up a black one; its last swap
   takes the junk's place in the column being filled (rising past a black, or sinking past a brown), and every piece it
   passed steps back one place along the path, the junk from the column among them.

   - `whiteRun`: the cheapest such drag, in a person's time, of any white left of the column into a piece of junk there,
     on the board as it stands (a white moving only down onto browns and up onto blacks, never into the columns from the
     target's on but for its last swap).
   - `channelRuns`: for each piece of junk in the column being filled, the cheapest plan: the white's run alone, or the
     channel built first, a drag of junk past junk only (a brown sunk down through blacks, a black lifted up through
     browns: the ladder; `notes/distilling/50-*`, the brown at the top right dragged down-left through the blacks to join
     the browns), then the run. A plan never touches the column being filled or right of it but for the run's last swap,
     never takes a white from a column that's mostly white (the next Crystal Clears in the making), and (`NEXT_ONLY`) is
     offered only for the column going up next while it's mostly white, a few pieces of junk left to replace (the bots'
     run, 14 Nov: DISTILLING.md, "The late game").

   Pure: no randomness, no clock; knows nothing of the den. */

import { BLACK, BROWN, COLS, DOWN_LEFT, DOWN_RIGHT, UP_LEFT, UP_RIGHT, WHITE, canSwapOn, neighbourOn } from './distilling.js';
import type { Board } from './distilling.js';
import { isJunk, placeName, playDrags } from './distill-routines.js';
import type { Ctx, Drag } from './distill-routines.js';

/** The search's limits: the white's longest run (swaps), a builder's longest drag (swaps), builders picked up at most
    this many columns left of the column being filled, and at most BOARDS builders' boards tried. */
export const CHANNEL = { RUN: 16, BUILD: 5, FROM: 6, BOARDS: 600, TURN_MS: 60, NEXT_ONLY: 1 };

/** A person's pace: a hand's swaps a second, and ms to spot a drag. */
export interface ChannelPace { rate: number; spot: number }
/** A plan: its drags (the builder, if any, then the white's run), its cost in a person's ms, the white it brings and
    the junk it replaces, and what the channel runs through ('blacks', 'browns, then blacks'...). */
export interface ChannelPlan { drags: Drag[]; ms: number; white: [number, number]; into: [number, number]; built: boolean; through: string }

const ALL = [UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT];
const isUp = (w: number) => w === UP_RIGHT || w === UP_LEFT;
const OPPOSITE = [DOWN_LEFT, DOWN_RIGHT, UP_RIGHT, UP_LEFT];

/** Where a white at (x, y) steps the way `w`, if it can: down onto a brown, up onto a black (the swap rule; the piece at
    (x, y) on the board may not be the white yet, so only the neighbour is looked at). */
function steps(b: Board, x: number, y: number, w: number): [number, number] | null {
  const n = neighbourOn(b, x, y, w);
  if (!n) return null;
  const q = b[n[0]][n[1]];
  return (isUp(w) ? q === BLACK : q === BROWN) ? n : null;
}

/** What a run passes through, in order of its runs of one kind: "black", "brown, then black". */
function throughOf(b: Board, d: Drag): string {
  const kinds: string[] = [];
  let at: [number, number] = [d.x, d.y];
  for (const w of d.ways) {
    const n = neighbourOn(b, at[0], at[1], w)!, k = b[n[0]][n[1]] === BLACK ? 'blacks' : 'browns';
    if (kinds[kinds.length - 1] !== k) kinds.push(k);
    at = n;
  }
  return kinds.join(', then ');
}

/** The cheapest drag of a white from a column left of `into`'s along a channel into `into`'s place (see the header), on
    board b: its drag and ms, or null. Only whites from the columns `from` allows (all, unless given). */
export function whiteRun(b: Board, into: [number, number], pace: ChannelPace, limits = CHANNEL, from: (x: number) => boolean = () => true): { drag: Drag; ms: number } | null {
  const [tx, ty] = into, swapMs = 1000 / pace.rate;
  if (!isJunk(b[tx][ty])) return null;
  // Dijkstra over (place, the way it came), from every white left of the column at once.
  type St = { x: number; y: number; w: number; ms: number; n: number; prev: St | null; from: [number, number] };
  const best = new Map<string, number>(), open: St[] = [];
  const key = (x: number, y: number, w: number) => `${x},${y},${w}`;
  for (let x = 0; x < tx; x++) if (from(x)) for (let y = 0; y < b[x].length; y++) if (b[x][y] === WHITE) open.push({ x, y, w: -1, ms: pace.spot, n: 0, prev: null, from: [x, y] });
  while (open.length) {
    let i = 0;
    for (let j = 1; j < open.length; j++) if (open[j].ms < open[i].ms) i = j;
    const s = open[i];
    open[i] = open[open.length - 1]; open.pop();
    const k = key(s.x, s.y, s.w);
    if ((best.get(k) ?? Infinity) < s.ms) continue;
    if (s.x === tx && s.y === ty) {
      // Its ways, read back; checked by playing it (a run that loops back over its own path is only as the board has it).
      const ways: number[] = [];
      for (let t: St | null = s; t && t.w >= 0; t = t.prev) ways.unshift(t.w);
      const drag = { x: s.from[0], y: s.from[1], ways }, after = playDrags(b, [drag]);
      if (after && after[tx][ty] === WHITE) return { drag, ms: s.ms };
      continue;
    }
    if (s.n >= limits.RUN) continue;
    for (const w of ALL) {
      if (s.w >= 0 && w === OPPOSITE[s.w]) continue;
      const n = steps(b, s.x, s.y, w);
      if (!n || (n[0] >= tx && !(n[0] === tx && n[1] === ty))) continue;
      const ms = s.ms + swapMs + (s.w >= 0 && s.w !== w ? limits.TURN_MS : 0), nk = key(n[0], n[1], w);
      if ((best.get(nk) ?? Infinity) <= ms) continue;
      best.set(nk, ms);
      open.push({ x: n[0], y: n[1], w, ms, n: s.n + 1, prev: s, from: s.from });
    }
  }
  return null;
}

/** Every builder: a drag of junk past junk only (the ladder: a brown down through blacks, a black up through browns), up
    to CHANNEL.BUILD swaps, from the columns `from` to `to - 1` and staying in them; each with the board it leaves and its
    ms, cheapest first, at most CHANNEL.BOARDS. */
export function builders(b: Board, from: number, to: number, pace: ChannelPace, limits = CHANNEL): { drag: Drag; after: Board; ms: number }[] {
  const out: { drag: Drag; after: Board; ms: number }[] = [], seen = new Set<string>(), swapMs = 1000 / pace.rate;
  const walk = (bb: Board, x0: number, y0: number, at: [number, number], ways: number[]) => {
    if (ways.length) {
      const k = bb.map((c) => c.join('')).join('|');
      if (!seen.has(k)) {
        seen.add(k);
        const turns = ways.filter((w, i) => i > 0 && w !== ways[i - 1]).length;
        out.push({ drag: { x: x0, y: y0, ways: [...ways] }, after: bb, ms: pace.spot + ways.length * swapMs + turns * limits.TURN_MS });
      }
    }
    if (ways.length >= limits.BUILD) return;
    for (const w of ALL) {
      const n = neighbourOn(bb, at[0], at[1], w);
      if (!n || n[0] < from || n[0] >= to || (bb[n[0]][n[1]] !== BROWN && bb[n[0]][n[1]] !== BLACK) || !canSwapOn(bb, at[0], at[1], n[0], n[1])) continue;
      const nb = bb.map((c) => c.slice());
      const p = nb[at[0]][at[1]]; nb[at[0]][at[1]] = nb[n[0]][n[1]]; nb[n[0]][n[1]] = p;
      walk(nb, x0, y0, n, [...ways, w]);
    }
  };
  for (let x = Math.max(0, from); x < to; x++) for (let y = 0; y < b[x].length; y++) {
    if (b[x][y] === BROWN || b[x][y] === BLACK) walk(b, x, y, [x, y], []);
  }
  return out.sort((a, c) => a.ms - c.ms).slice(0, limits.BOARDS);
}

/** The cheapest plan into each piece of junk in column `ctx.fill` (see the header), cheapest first. */
export function channelRuns(cols: Board, ctx: Ctx, pace: ChannelPace, limits = CHANNEL): ChannelPlan[] {
  const x = ctx.fill;
  if (ctx.stage !== 'chain' || x <= 0 || x >= COLS || x >= ctx.burnFrom) return [];
  // The late game's: the column going up next (the fire, or the junk burning, just right of it), mostly white with a few
  // pieces of junk left to replace (P43). Offered further back too, it cost CC^2 its chains (3.9 to 3.6, the 14 Nov run).
  if (limits.NEXT_ONLY && (x !== ctx.burnFrom - 1 || cols[x].filter((p) => p === WHITE).length * 2 < cols[x].length)) return [];
  const junk: [number, number][] = [];
  cols[x].forEach((p, y) => { if (isJunk(p)) junk.push([x, y]); });
  if (!junk.length) return [];
  const out: ChannelPlan[] = [];
  // Never a white taken from a column that's mostly white: those are the next Crystal Clears in the making, and robbing
  // one leaves it the junk besides (the 14 Nov run: CC^3 burned 1.1 whites a session, not 0.5, its chains broken that way).
  const from = (c: number) => cols[c].filter((p) => p === WHITE).length * 2 < cols[c].length;
  let builds: { drag: Drag; after: Board; ms: number }[] | null = null;
  for (const into of junk) {
    const run = whiteRun(cols, into, pace, limits, from);
    let plan: ChannelPlan | null = run ? { drags: [run.drag], ms: run.ms, white: [run.drag.x, run.drag.y], into, built: false, through: throughOf(cols, run.drag) } : null;
    // The channel built first, when there's none yet or building one is quicker overall.
    builds ??= builders(cols, x - limits.FROM, x, pace, limits);
    for (const f of builds) {
      if (plan && f.ms >= plan.ms) break;
      const then = whiteRun(f.after, into, pace, limits, from);
      if (!then || (plan && f.ms + then.ms >= plan.ms)) continue;
      plan = { drags: [f.drag, then.drag], ms: f.ms + then.ms, white: [then.drag.x, then.drag.y], into, built: true, through: throughOf(f.after, then.drag) };
    }
    if (plan) out.push(plan);
  }
  return out.sort((a, b) => a.ms - b.ms);
}

/** A plan in a line, for the reason: "a channel built (the brown at column 8, row 2 sunk through the blacks), then the
    white at column 3, row 4 along it, through browns, then blacks, into column 9, row 4, in for the black there". */
export function channelReason(cols: Board, p: ChannelPlan): string {
  const piece = (q: number) => (q === BLACK ? 'black' : q === BROWN ? 'brown' : 'junk');
  const run = p.drags[p.drags.length - 1], what = piece(cols[p.into[0]][p.into[1]]);
  const built = p.built ? `a channel built first (the ${piece(cols[p.drags[0].x][p.drags[0].y])} at ${placeName(p.drags[0].x, p.drags[0].y)} ${cols[p.drags[0].x][p.drags[0].y] === BROWN ? 'sunk down through the blacks' : 'lifted up through the browns'}), then ` : '';
  return `${built}the white at ${placeName(run.x, run.y)} along the channel, through ${p.through}, into ${placeName(p.into[0], p.into[1])}, in for the ${what} there, the ${what} back along the path`;
}
