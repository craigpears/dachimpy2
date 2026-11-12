/* Bots that sail: the Sailing puzzle's move-choosing (src/sailing.ts), knowing nothing of where it's
   played. TypeScript, compiled to js/sail-bots.js; tested in tests/puzzle-bots.test.ts. Moved here (12 Nov)
   from tools/sail-bots.mjs, which runs them over many games (how often a big chain comes, by skill), so
   the browser can use them too: the race watched (src/race-watch.ts, js/den/race-watch.js) plays a
   racer's Sailing board with them, move by move.

   The bots (each sees the board, the pair and the next pair, as a player does):
   - random: any drop it can make.
   - greedy: the drop worth most points now, tried on a copy.
   - two-ply: the drop worth most with the best drop of the next pair after it.
   - shallow: one drop ahead, weighing the board it leaves as the builder does: the builder's sense at a
     thirtieth of its cost (a few milliseconds a drop, where the builder takes a third of a second), so the
     browser can play it live without a stutter (the race watched: Sailing on the pilot).
   - builder: two-ply, and on top it weighs the board left behind: targets filled with their colour,
     platforms one short (a trigger waiting), threes of a colour (a line waiting), less for a wrong
     colour in a target and for stacking up near the top. A sailor who sets chains up.
   - stairs: the expert, who builds a staircase (the user, 10 Nov: "Vegas 3s and 4s quite easily";
     see stairs() below) and fires it at six steps. It looks a drop ahead with the next pair after its
     `ahead` best (4). It's slow (a second or more a drop), so a Vegas shown in the browser is one it
     made already (VEGAS_GAMES), its drops replayed.
   tools/sail-bots.mjs has their figures (10 Nov): only the staircase makes a Vegas, one every 170 drops
   or so; the builder makes a Double or better every thirteen drops. */

import { H, W, type Drop, type Sailing } from './sailing.js';
import { seeded } from './mirror-row.js';

/** A bot: the drop it makes on this board, with this pair (null: none can be made). `rnd` for the
    random one. */
export type SailBot = (s: Sailing, rnd?: () => number) => Drop | null;

/** What a board left behind is worth to a sailor setting up chains. */
export function potential(s: Sailing): number {
  let v = 0;
  for (const p of s.platforms) {
    let ok = 0, wrong = 0;
    for (const t of p.targets) {
      const x = s.grid[t.r][t.c];
      if (x && x.c === t.colour) ok++; else if (x) wrong++;
    }
    v += ok - 3 * wrong + (ok === p.targets.length - 1 && !wrong ? 3 : 0);
  }
  // Threes of a colour, across and down: a line one piece short.
  for (const [dr, dc] of [[0, 1], [1, 0]]) for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const a = s.grid[r][c];
    if (!a || a.fixed) continue;
    let n = 1;
    while (n < 4 && s.grid[r + dr * n]?.[c + dc * n]?.c === a.c) n++;
    if (n === 3) v += 0.5;
  }
  // Stacking near the top is asking for a booch.
  for (let c = 0; c < W; c++) {
    let top = H;
    for (let r = 0; r < H; r++) if (s.grid[r][c]) { top = r; break; }
    if (top < 6) v -= (6 - top) * (c === 3 || c === 4 ? 3 : 1);
  }
  return v;
}

let salt = 1;
/** A drop tried on a copy: the copy after it, and what it earned. */
const tryDrop = (s: Sailing, m: Drop) => { const c = s.copy(seeded(salt++)); const e = c.drop(m.col, m.turn, m.row); return { c, e }; };

function best(s: Sailing, worth: (s: Sailing, m: Drop) => number): Drop | null {
  let top: Drop | null = null, topV = -Infinity;
  for (const m of s.moves()) { const v = worth(s, m); if (v > topV) { topV = v; top = m; } }
  return top;
}

const twoPly = (weigh: boolean): SailBot => (s) => best(s, (s0, m) => {
  const { c, e } = tryDrop(s0, m);
  if (e.booched || e.boardCleared) return e.points + (e.booched ? -50 : 0);
  let after = -Infinity;
  for (const m2 of c.moves()) {
    const { c: c2, e: e2 } = tryDrop(c, m2);
    const v = e2.points + (e2.booched ? -50 : weigh ? 0.5 * potential(c2) : 0);
    if (v > after) after = v;
  }
  return e.points + (after === -Infinity ? -50 : after);
});

/** The first row with a piece in column c (H if none). */
const topRow = (s: Sailing, c: number) => { for (let r = 0; r < H; r++) if (s.grid[r][c]) return r; return H; };
/** The row a piece dropped straight down column c comes to rest on (-1 if the top's taken). */
function landRow(s: Sailing, c: number): number {
  if (s.grid[0][c]) return -1;
  let r = 0;
  while (r + 1 < H && !s.grid[r + 1][c] && !s.shelf(r, c)) r++;
  return r;
}
/** The chain set off by dropping a piece of column c's top colour on it (a pair, that colour under
    another). With along, only the steps that clear three or more from each of those columns in turn
    count (the stairs, not some line that happened to go). */
function trigger(s: Sailing, c: number, along?: number[]): number {
  const top = topRow(s, c);
  if (top >= H || top < 2) return 0;
  const x = s.grid[top][c]!.c;
  const colOf = new Map<number, number>();
  if (along) for (let r = 0; r < H; r++) for (let cc = 0; cc < W; cc++) if (s.grid[r][cc]) colOf.set(s.grid[r][cc]!.id, cc);
  let most = 0;
  for (const j of [(x + 1) % 3, (x + 2) % 3]) {
    const t = s.copy(seeded(salt++));
    t.pair = [j, x];
    t.record = !!along;
    const e = t.drop(c, 1);
    if (!e.dropped || e.booched) continue;
    if (!along) { most = Math.max(most, e.steps); continue; }
    let n = 0;
    for (const st of e.stages.filter((z) => z.kind === 'line' || z.kind === 'platform')) {
      if (n >= along.length || st.cleared.filter((id) => colOf.get(id) === along[n]).length < 3) break;
      n++;
    }
    most = Math.max(most, n);
  }
  return most;
}

/** The staircase expert. Columns P[0] (the bottom of the stairs, at one edge) to P[5], each a step two
   rows higher than the one before: three of a colour stacked in each (a pair of two, then the third),
   and the third's partner hanging over the step below, the colour of that step. Set it off by dropping
   a fourth on the top step: its three clear, the partner they held falls onto the step below and
   makes four there, and so on down: a step of the chain a column. Pieces that don't fit go to raise
   the steps still to come (each must stand on enough to be two rows above the last). Its worth for a
   drop: the chain the stairs would set off now (how many steps are built), then progress on the next
   step, less for stacking near the top. Building from the bottom step up means a step's hanging
   partner never blocks the column it hangs over, which is already built. Each call makes a fresh one
   (it keeps which side it builds from). */
export function stairs(ahead = 4): SailBot {
  const STEPS = 6;
  let dir = 1;
  const P = () => Array.from({ length: STEPS }, (_, k) => (dir > 0 ? k : W - 1 - k));
  // Steps built: the highest step that sets off the whole stairs below it, a column at a time. (Not
  // from the bottom up: a built step's top is covered by the partner hanging over it from the next.)
  const pot = (s: Sailing, ps: number[]) => { for (let k = STEPS; k > 0; k--) if (trigger(s, ps[k - 1], ps.slice(0, k).reverse()) >= k) return k; return 0; };
  const run = (s: Sailing, c: number) => {   // the length of the one colour at the top of column c, and its lowest row
    const top = topRow(s, c);
    if (top >= H) return { n: 0, bottom: H };
    let n = 1;
    while (top + n < H && s.grid[top + n][c] && !s.grid[top + n][c]!.fixed && s.grid[top + n][c]!.c === s.grid[top][c]!.c) n++;
    return { n, bottom: top + n - 1 };
  };
  // The highest a step's stack can stand: row 2, or row 4 over the middle columns (a booch is row 0).
  const roof = (c: number) => (c === 3 || c === 4 ? 4 : 2);
  function worth(s: Sailing, e: ReturnType<Sailing['drop']>, ps: number[], ready: number): number {
    if (e.booched) return -1e9;
    if (e.steps >= STEPS || (ready && e.steps >= ready)) return 1e8 + 1000 * e.steps + e.points;
    const p = pot(s, ps);
    let v = 1e5 * Math.min(p, STEPS);
    if (p < STEPS) {
      const col = ps[p];
      // Where the step being built should stand (the row its stack's lowest piece goes in).
      let R: number;
      if (p === 0) { R = landRow(s, col); v += 100 * Math.min(run(s, col).n, 3) - 20 * (H - 1 - R); }
      else {
        R = topRow(s, ps[p - 1]);
        const land = landRow(s, col);
        if (land > R) v -= 50 * (land - R);
        else {
          const { n, bottom } = run(s, col);
          // Not the colour of the step below: its partner would need a pair of one colour (one in nine).
          const same = n > 0 && s.grid[topRow(s, col)][col]!.c === s.grid[R]?.[ps[p - 1]]?.c;
          const stacked = n > 0 && bottom <= R && !same && n < 3;
          // Standing higher than it needs to wastes height.
          v += 100 - 150 * (R - (stacked ? bottom : land)) + (stacked ? 100 * n : 0);
        }
      }
      // The steps to come: raised no higher than they'll need to be.
      for (let k = p + 1; k < STEPS; k++) {
        const ideal = R - 2 * (k - p), land = landRow(s, ps[k]);
        if (land < ideal) v -= 300 * (ideal - land);
      }
    }
    for (let c = 0; c < W; c++) {
      const t = topRow(s, c);
      if (t < 3) v -= 3000 * (3 - t);
      if ((c === 3 || c === 4) && t < 5) v -= 20000 * (5 - t);
      v -= 2 * (H - t);
    }
    return v + e.points + 20 * e.cleared;
  }
  return (s) => {
    // Pick the side when starting afresh: the edge with the deeper bottom step (by two rows, so it
    // doesn't flit between them).
    if (pot(s, P()) === 0) {
      const other = dir > 0 ? W - 1 : 0, mine = dir > 0 ? 0 : W - 1;
      if (landRow(s, other) >= landRow(s, mine) + 2) dir = -dir;
    }
    const ps = P();
    const now = pot(s, ps);
    // Fire early when the next step has no room, or the middle is filling up.
    const crowded = Math.min(topRow(s, 3), topRow(s, 4)) < 5;
    const full = now < STEPS && now >= 1 && topRow(s, ps[now - 1]) - 2 < roof(ps[now]);
    const ready = now >= 2 && (crowded || full) ? now : 0;
    // One drop ahead, then the next pair's best after the most promising few (it's shown).
    const first = s.moves().map((m) => { const { c, e } = tryDrop(s, m); return { m, c, e, v: worth(c, e, ps, ready) }; }).sort((p, q) => q.v - p.v);
    let m = first[0]?.m ?? null, top = -Infinity;
    for (const f of first.slice(0, ahead)) {
      let v = f.v;
      if (f.v < 1e8 && !f.e.booched && !f.e.boardCleared) {
        let after = -Infinity;
        for (const m2 of f.c.moves()) { const { c, e } = tryDrop(f.c, m2); after = Math.max(after, worth(c, e, ps, ready)); }
        v = Math.max(f.v, after);
      }
      if (v > top) { top = v; m = f.m; }
    }
    return m;
  };
}

/** The bots by name (stairs a fresh one each time it's asked for: it keeps its side). */
export const SAIL_BOTS = {
  random: ((s, rnd = Math.random) => { const ms = s.moves(); return ms[Math.floor(rnd() * ms.length)] ?? null; }) as SailBot,
  greedy: ((s) => best(s, (s0, m) => tryDrop(s0, m).e.points)) as SailBot,
  'two-ply': twoPly(false),
  shallow: ((s) => best(s, (s0, m) => { const { c, e } = tryDrop(s0, m); return e.points + (e.booched ? -50 : 0.5 * potential(c)); })) as SailBot,
  builder: twoPly(true),
  get stairs(): SailBot { return stairs(); },
};
export type SailBotName = keyof typeof SAIL_BOTS;

/** Games the staircase played to a Vegas, from a fresh ordinary deal of `seed` (new Sailing(seeded(seed))),
    its drops in order, [column, turn, row]; the last sets the Vegas off. Recorded by
    `tools/sail-bots.mjs record` (12 Nov), so a Vegas can be shown move by move without the browser
    playing the slow staircase: the board's laid as it was some drops before the end, and the rest
    played (src/race-watch.ts). */
export const VEGAS_GAMES: readonly { seed: number; drops: readonly (readonly [number, Drop['turn'], number])[] }[] = [
  { seed: 2, drops: [[0, 2, 5], [6, 2, 15], [7, 1, 13], [0, 0, 15], [6, 3, 13], [5, 0, 12], [0, 0, 14], [6, 0, 11], [2, 0, 15], [4, 0, 11], [0, 0, 14], [0, 0, 13], [4, 0, 10], [0, 0, 12], [4, 1, 8], [0, 0, 11], [2, 0, 13], [0, 1, 10], [0, 0, 13], [0, 0, 12], [0, 0, 11], [5, 2, 9], [3, 0, 13], [4, 1, 11], [4, 3, 9], [3, 2, 8], [4, 2, 7], [2, 0, 7], [2, 0, 6], [0, 0, 4], [0, 0, 3], [5, 1, 5], [2, 1, 4], [3, 0, 5], [5, 1, 3], [6, 1, 7], [6, 1, 5], [2, 1, 4], [5, 1, 1], [5, 0, 4], [5, 0, 3], [5, 1, 1], [5, 1, 3], [7, 1, 9], [7, 1, 7], [7, 1, 5], [7, 1, 3], [0, 1, 1], [0, 1, 3], [2, 0, 3], [0, 0, 2], [2, 1, 1]] },
  { seed: 3, drops: [[0, 2, 7], [6, 2, 15], [6, 0, 14], [0, 0, 15], [0, 0, 14], [6, 0, 13], [0, 0, 13], [0, 0, 12], [0, 1, 10], [0, 0, 11], [0, 0, 10], [1, 1, 8], [0, 1, 5], [1, 1, 5], [5, 1, 14], [5, 0, 12], [6, 0, 11], [4, 0, 11], [4, 2, 10], [0, 1, 5], [0, 1, 3], [4, 3, 13], [0, 1, 6], [2, 0, 14], [5, 2, 9], [3, 0, 9], [3, 2, 8], [0, 1, 4], [4, 0, 7], [0, 1, 2], [2, 0, 7], [0, 1, 5], [0, 1, 3], [2, 2, 6], [0, 3, 1], [3, 2, 5], [1, 2, 5], [1, 0, 4], [2, 2, 3], [6, 1, 7], [2, 0, 2]] },
  { seed: 13, drops: [[0, 1, 14], [7, 1, 14], [1, 0, 15], [4, 0, 15], [3, 1, 14], [0, 1, 12], [0, 1, 10], [0, 3, 8], [0, 1, 14], [0, 1, 12], [6, 0, 13], [5, 0, 12], [6, 0, 11], [4, 0, 11], [4, 0, 10], [5, 0, 9], [4, 0, 14], [3, 0, 9], [3, 0, 8], [3, 1, 10], [3, 3, 6], [3, 0, 13], [2, 0, 14], [3, 0, 13], [2, 0, 12], [1, 2, 13], [4, 0, 7], [1, 0, 14], [4, 0, 13], [2, 0, 14], [2, 0, 13], [3, 0, 12], [3, 1, 10], [3, 1, 8], [0, 1, 11], [3, 1, 6], [3, 0, 5], [1, 0, 5], [1, 2, 4], [2, 2, 3], [2, 1, 10], [2, 2, 2]] },
];
