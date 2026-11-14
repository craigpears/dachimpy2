/* Bots that navigate: Duty Navigation's move-choosing (src/navigation.ts), knowing nothing of where it's
   played. TypeScript, compiled to js/nav-bots.js; tested in tests/puzzle-bots.test.ts. Moved here (12 Nov)
   from tools/nav-bots.mjs, which plays them over many games (are its boards fair, how many moves each
   constellation takes; DOOR=1 the starlit door's run), so the browser can use them too.

   The bots (each sees the board, the constellation and the next star, as a player does):
   - random: presses keys at random (a ring, a turn either way, or a drop: one in three).
   - greedy: a new navigator. Each go it turns one ring (any way round, by the shorter way) and drops,
     or turns one ring to fill the constellation; it picks the one that leaves the constellation most
     filled (its stars in place, the places under its marks held up), counting the moves.
   - planner: as greedy, but it may turn two rings before the drop.
   The evil constellation (needsCombo) they meet with its own sense of the board (comboWorth). */

import { Navigation, SPOKES, needsCombo, fits } from './navigation.js';
import { seeded } from './mirror-row.js';

/** A go: rings turned ([ring, way]: 1 or -1, a place each), then a drop, or not. */
export interface NavPlan { steps: [number, number][]; drop: boolean }
export type NavBot = (g: Navigation, rnd: () => number) => NavPlan | null;

/** What a board left behind is worth to a navigator filling from the middle out. Rings turn on their
    own, so each ring is weighed by its best turn: the marks in it that turn would fill (less a little
    for the turns), and a mark's place with nothing under it to hold a star up is worth less. Pairs of
    a colour side by side are a line waiting (to clear the junk). Less every star on the board, more
    in the outer ring, and a booch waiting under the next star. */
export function worth(g: Navigation): number {
  const c = g.constellation, G = g.grid;
  let v = 0;
  if (c) for (let r = 0; r < g.rings; r++) {
    const marks = c.marks.filter((m) => m.ring === r);
    if (!marks.length) continue;
    let top = -Infinity;
    for (let k = 0; k < SPOKES; k++) {
      let n = 0;
      for (const m of marks) if (fits(m, G[r][(m.spoke - k + SPOKES) % SPOKES]?.c)) n++;
      top = Math.max(top, 12 * n - Math.min(k, SPOKES - k));
    }
    v += top;
    for (const m of marks) for (let rr = 0; rr < r; rr++) if (G[rr][m.spoke]) v += 2;
  }
  let outer = 0, all = 0;
  for (let r = 0; r < g.rings; r++) for (let s = 0; s < SPOKES; s++) {
    const x = G[r][s];
    if (!x) continue;
    all++;
    if (r === g.rings - 1) outer++;
    if (G[r][(s + 1) % SPOKES]?.c === x.c) v += 1;
    if (r + 1 < g.rings && G[r + 1][s]?.c === x.c) v += 1;
  }
  if (G[g.rings - 1][g.next.spoke]) v -= 8;
  return v - outer * 3 - all * 0.5;
}

/** The evil one (a row of a colour side by side on a ring: needsCombo): what a board's worth to a
    navigator building it. Over every turn of the ring and every pair of gaps that leaves no three of
    the row side by side: its places held by its colour (and not by junk, worse in a gap), and the
    stars of its colour in the ring above beside the gaps, to be turned in together. Junk that could
    line up and go is worth a little; every star, more in the outer ring, costs. */
export function comboWorth(g: Navigation): number {
  const G = g.grid, marks = g.constellation!.marks, COL = marks[0].colour, N = marks.length, ring = marks[0].ring;
  const s0 = marks.reduce((a, m) => (marks.some((o) => o.spoke === (m.spoke + SPOKES - 1) % SPOKES) ? a : m.spoke), marks[0].spoke);
  const gaps: [number, number][] = [];
  for (let i = 0; i < N; i++) for (let j = i + 2; j < N; j++) {
    const held = [...Array(N).keys()].filter((x) => x !== i && x !== j);
    if (!held.some((a) => held.includes(a + 1) && held.includes(a + 2))) gaps.push([i, j]);
  }
  const help = (r: number, s: number) => {
    const x = G[r][s]!;
    let h = 0;
    if (G[r][(s + 1) % SPOKES]?.c === x.c) h++;
    if (G[r][(s + SPOKES - 1) % SPOKES]?.c === x.c) h++;
    for (let rr = 0; rr < g.rings; rr++) if (rr !== r && G[rr][s]?.c === x.c) h++;
    return h;
  };
  let best = -Infinity;
  for (let k = 0; k < SPOKES; k++) for (const [gi, gj] of gaps) {
    let v = 0;
    for (let x = 0; x < SPOKES; x++) {
      const s = (s0 + x + k) % SPOKES, st = G[ring][s];
      if (x >= N) { if (st?.c === COL) v -= 6; continue; }
      if (x === gi || x === gj) { if (st) v -= 40 - 4 * help(ring, s); continue; }
      if (st?.c === COL) v += 20; else if (st) v -= 40 - 3 * help(ring, s);
    }
    let feed = 0;
    if (ring + 1 < g.rings) for (const d of [-1, 1]) {
      let f = 0;
      for (const x of [gi, gj]) if (G[ring + 1][(s0 + x - d + k + SPOKES) % SPOKES]?.c === COL) f += 10;
      feed = Math.max(feed, f);
    }
    best = Math.max(best, v + feed - Math.min(k, SPOKES - k) * 0.3);
  }
  let v = best, all = 0;
  for (let r = 0; r < g.rings; r++) for (let s = 0; s < SPOKES; s++) {
    const x = G[r][s];
    if (!x) continue;
    all++;
    if (r === g.rings - 1) v -= 5;
    if (r > ring && x.c !== COL) v += 1.2 * help(r, s);
  }
  if (G[g.rings - 1][g.next.spoke]) v -= 10;
  return v - all;
}

/** A plan's turns as [ring, way] steps: ring r turned k places (the shorter way). */
export const turns = (r: number, k: number): [number, number][] => {
  const n = k <= SPOKES / 2 ? k : SPOKES - k, d = k <= SPOKES / 2 ? 1 : -1;
  return Array.from({ length: n }, (): [number, number] => [r, d]);
};

let salt = 1;
const evil = (g: Navigation) => !!g.constellation && needsCombo(g.constellation.marks);
/** Play a plan on a copy: its turns, then a drop if `drop`. Its worth. */
function tryPlan(g: Navigation, steps: [number, number][], drop: boolean): number {
  const c = g.copy(seeded(salt++));
  let done: ReturnType<Navigation['drop']>['done'] = null, booched = false, points = 0;
  for (const [r, d] of steps) { const e = c.turn(d, r); points += e.points; done ??= e.done; }
  if (drop) { const e = c.drop(); points += e.points; done ??= e.done; booched = e.booched; }
  const moves = steps.length + (drop ? 1 : 0);
  if (booched) return -1e6;
  if (evil(g)) return done ? 1e4 - moves : comboWorth(c) - moves * 1.2;
  // Filling it now is what counts, quicker the better; then the board it leaves.
  return (done ? 1e4 + done.points * 10 : 0) + worth(c) - moves * 1.5 + points * 0.2;
}

function plans(depth: number, rings: number): [number, number][][] {
  const out: [number, number][][] = [];
  for (let r = 0; r < rings; r++) for (let k = 0; k < SPOKES; k++) {
    if (k === 0 && r > 0) continue;
    const one = k ? turns(r, k) : [];
    out.push(one);
    if (depth > 1 && k) for (let r2 = 0; r2 < rings; r2++) if (r2 !== r) for (let k2 = 1; k2 < SPOKES; k2++) out.push([...one, ...turns(r2, k2)]);
  }
  return out;
}

/** A navigator looking `depth` rings' turns ahead before its drop. */
export function thinker(depth: number): NavBot {
  // (a plain board's three rings, or a wolf den's four)
  const ps = [3, 4].map((r) => plans(depth, r));
  return (g) => {
    let best: NavPlan | null = null, top = -Infinity;
    for (const steps of ps[g.rings - 3]) for (const drop of [true, false]) {
      if (!drop && !steps.length) continue;
      const v = tryPlan(g, steps, drop);
      if (!drop && v < 1e4) continue;   // (turning without dropping only to fill it)
      if (v > top) { top = v; best = { steps, drop }; }
    }
    return best;
  };
}

export const NAV_BOTS: Record<'random' | 'greedy' | 'planner', NavBot> = {
  random: (_g, rnd) => {
    const x = rnd();
    if (x < 1 / 3) return { steps: [], drop: true };
    return { steps: [[Math.floor(rnd() * _g.rings), rnd() < 0.5 ? 1 : -1]], drop: false };
  },
  greedy: thinker(1),
  planner: thinker(2),
};
