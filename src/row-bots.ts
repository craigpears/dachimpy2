/* Bots that row: mirror strokes' move-choosing (src/mirror-row.ts; RULES.md "Rowing by mirror strokes"),
   knowing nothing of where it's played. TypeScript, compiled to js/row-bots.js; tested in
   tests/puzzle-bots.test.ts. Moved here (12 Nov) from tools/row-bots.mjs, which races them over many games
   (the skill curve, the balance), so the browser can use them too (the race watched: a racer rowing the
   headwind gap, when one does).

   The bots (each sees the boards, not what comes in at the bottom, so its copies get new pieces of their
   own):
   - random: any swap.
   - naive: the swap that pulls most in all, never minding which side: a player who just clears what they
     can. Balance is fair if this one goes mostly straight and turns now and then.
   - turner: wants her round to starboard: the swap that builds most toward a turn that way.
   - greedy: the swap worth most now, tried on copies of the boards.
   - two-ply: the swap worth most with the best follow-up after it (`width`: how many first moves it looks
     past, the best by one ply and a few quiet ones; all of them by default).
   "Worth" is how far a stroke takes her up the course (the way she started), rowed as the den rows her,
   less a square for every quarter turn she's left heading off it. */

import { H, W } from './bilge.js';
import { Course, type Puller, type Rower } from './mirror-row.js';

type Pull = Parameters<Puller['row']>[0];
/** A swap: its left square, [row, column] (port's columns for mirror strokes). */
export type RowMove = [number, number];
export type RowBot = (row: Rower, rnd: () => number) => RowMove;

export const ALL: RowMove[] = [];
for (let r = 0; r < H; r++) for (let c = 0; c < W - 1; c++) ALL.push([r, c]);

/** Her heading in quarter turns (to starboard more than nothing), wrapped to a half circle either way. */
const wrap = (q: number) => ((q + 2) % 4 + 4) % 4 - 2;
/** Squares up the course a quarter turn off it is reckoned to cost (she has to be turned back). */
const OFF = 1;
const DY = [1, 0, -1, 0];

/** Where she is, for a bot: up the course, her heading, how far round, her oars' pull building. */
export interface RowState { y: number; heading: number; turned: number; oars: Puller }
export const stateOf = (row: Rower): RowState => ({ y: row.course.y, heading: row.course.heading, turned: row.course.turned, oars: row.stroke });

/** Where she stands: how far up the course, pull still building counted as part of a square, less for
    heading off it (pull still waiting for the other side counted as turning her). */
export function standing(st: RowState): number {
  const b = st.oars.building();
  return st.y + DY[st.heading] * b.ahead - OFF * Math.abs(wrap(st.turned + b.turn));
}
/** How far round to starboard she is, or about to be (the turner's worth). */
const round = (st: RowState) => st.turned + st.oars.building().turn;

/** The state after a stroke of pull p, rowed as the den rows her. */
export function after(st: RowState, p: Pull): RowState {
  const oars = st.oars.copy();
  const c = Object.assign(new Course(), { x: 0, y: st.y, heading: st.heading, turned: st.turned });
  for (const step of oars.row(p)) c.go(step);
  return { y: c.y, heading: c.heading, turned: c.turned, oars };
}

/** What a stroke's worth, from state st: how much further up the course it leaves her. */
export function worth(p: Pull, st: RowState): { v: number; h: RowState } {
  const n = after(st, p);
  return { v: standing(n) - standing(st), h: n };
}

const pick = <T>(xs: T[], rnd: () => number): T => xs[Math.floor(rnd() * xs.length)];
/** Of the swaps, those worth most to `v` (ties picked among at random). */
function top(row: Rower, rnd: () => number, v: (t: ReturnType<Rower['tryMove']>) => number): RowMove {
  let best = -Infinity, at: RowMove[] = [];
  for (const [r, c] of ALL) {
    const x = v(row.tryMove(r, c, rnd));
    if (x > best + 1e-9) { best = x; at = [[r, c]]; } else if (Math.abs(x - best) <= 1e-9) at.push([r, c]);
  }
  return pick(at, rnd);
}
function best(row: Rower, h: RowState, rnd: () => number): { v: number; move: RowMove } {
  let topV = -Infinity, at: RowMove[] = [];
  for (const [r, c] of ALL) {
    const w = worth(row.tryMove(r, c, rnd).pull, h);
    if (w.v > topV + 1e-9) { topV = w.v; at = [[r, c]]; } else if (Math.abs(w.v - topV) <= 1e-9) at.push([r, c]);
  }
  return { v: topV, move: pick(at, rnd) };
}

/** The two-ply bot, looking past `width` first moves (all of them by default). */
export function twoPly(width = ALL.length): RowBot {
  return (row, rnd) => {
    const h = stateOf(row);
    let first = ALL.map(([r, c]) => { const t = row.tryMove(r, c, rnd), w = worth(t.pull, h); return { r, c, t, w }; });
    if (width < first.length) {
      // The best by one ply, and a few of the moves that clear nothing (the setting-up ones) at random.
      first.sort((a, b) => b.w.v - a.w.v);
      const quiet = first.filter((f) => Math.abs(f.w.v) < 1e-9), keep = first.slice(0, Math.ceil(width / 2));
      while (keep.length < width && quiet.length) keep.push(quiet.splice(Math.floor(rnd() * quiet.length), 1)[0]);
      first = keep;
    }
    let topV = -Infinity, at: RowMove[] = [];
    for (const f of first) {
      const v = f.w.v + best(f.t.copy, f.w.h, rnd).v;
      if (v > topV + 1e-9) { topV = v; at = [[f.r, f.c]]; } else if (Math.abs(v - topV) <= 1e-9) at.push([f.r, f.c]);
    }
    return pick(at, rnd);
  };
}

export const ROW_BOTS: Record<'random' | 'naive' | 'turner' | 'greedy' | 'two-ply', RowBot> = {
  random: (_row, rnd) => pick(ALL, rnd),
  naive: (row, rnd) => top(row, rnd, (t) => t.pull.port + t.pull.starboard),
  turner: (row, rnd) => { const h = stateOf(row); return top(row, rnd, (t) => round(after(h, t.pull))); },
  greedy: (row, rnd) => best(row, stateOf(row), rnd).move,
  'two-ply': twoPly(),
};
