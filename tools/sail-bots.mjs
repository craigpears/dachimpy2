/* Bots that sail: the Sailing puzzle (src/sailing.ts), 10 Nov. How often does a big chain come, by
   skill? The den's twist runs her forward by the chain (runFor: a step a square, a Vegas seven), so
   this says how far a drop takes her on average, and how rare the long rush is.

   Run on the compiled js (npm run build first) with Node 22 (Node 18 won't load the site's ES
   modules as they are): node_modules/node/bin/node.exe tools/sail-bots.mjs [games] [drops] [bots]
   - games: seeded games per bot (default 20), drops: drops a game (default 150),
     bots: comma-separated, from 'random,greedy,two-ply,builder,stairs' (default all five).

   The bots (each sees the board, the pair and the next pair, as a player does):
   - random: any drop it can make.
   - greedy: the drop worth most points now, tried on a copy.
   - two-ply: the drop worth most with the best drop of the next pair after it.
   - builder: two-ply, and on top it weighs the board left behind: targets filled with their colour,
     platforms one short (a trigger waiting), threes of a colour (a line waiting), less for a wrong
     colour in a target and for stacking up near the top. A sailor who sets chains up.
   - stairs: the expert, who builds a staircase (the user, 10 Nov: "Vegas 3s and 4s quite easily";
     see stairs() below) and fires it at six steps. It looks a drop ahead with the next pair after its
     AHEAD best (an environment variable, default 4).
   'record' as the first argument plays the expert from seed 1 up until it makes a Vegas and prints
   that game's drops, for the staircase test in tests/sailing.test.ts.

   Run of 10 Nov (10 games of 200 drops, pairs steered under ledges, lines before platforms), per 100
   drops, random / greedy / two-ply / builder / stairs: points a drop -0.30 / 1.21 / 3.20 / 5.14 /
   2.66; Doubles or better 0.1 / 0.8 / 5.4 / 7.9 / 3.5; Triples or better 0.1 / 0.1 / 0.3 / 0.8 / 2.0;
   Vegas 0 / 0 / 0 / 0 / 0.6 (one every 170 drops or so); longest chain 3 / 4 / 3 / 4 / 7; squares run
   (runFor) 4 / 23 / 40 / 47 / 31; booches 2.6 / 0.9 / 0.1 / 0 / 0.3. Only the staircase makes a
   Vegas; it gives up points a drop to do it. */

import { H, RUN, Sailing, W } from '../js/sailing.js';
import { seeded } from '../js/mirror-row.js';

const GAMES = Number(process.argv[2]) || 20, DROPS = Number(process.argv[3]) || 150;
const BOTS = (process.argv[4] || 'random,greedy,two-ply,builder,stairs').split(',');

/** What a board left behind is worth to a sailor setting up chains. */
function potential(s) {
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
const tryDrop = (s, m) => { const c = s.copy(seeded(salt++)); const e = c.drop(m.col, m.turn, m.row); return { c, e }; };

function best(s, worth) {
  let top = null, topV = -Infinity;
  for (const m of s.moves()) { const v = worth(s, m); if (v > topV) { topV = v; top = m; } }
  return top;
}

const twoPly = (weigh) => (s) => best(s, (s0, m) => {
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
const topRow = (s, c) => { for (let r = 0; r < H; r++) if (s.grid[r][c]) return r; return H; };
/** The row a piece dropped straight down column c comes to rest on (-1 if the top's taken). */
function landRow(s, c) {
  if (s.grid[0][c]) return -1;
  let r = 0;
  while (r + 1 < H && !s.grid[r + 1][c] && !s.shelf(r, c)) r++;
  return r;
}
/** The chain set off by dropping a piece of column c's top colour on it (a pair, that colour under
    another). With along, only the steps that clear three or more from each of those columns in turn
    count (the stairs, not some line that happened to go). */
function trigger(s, c, along) {
  const top = topRow(s, c);
  if (top >= H || top < 2) return 0;
  const x = s.grid[top][c].c;
  const colOf = new Map();
  if (along) for (let r = 0; r < H; r++) for (let cc = 0; cc < W; cc++) if (s.grid[r][cc]) colOf.set(s.grid[r][cc].id, cc);
  let best = 0;
  for (const j of [(x + 1) % 3, (x + 2) % 3]) {
    const t = s.copy(seeded(salt++));
    t.pair = [j, x];
    t.record = !!along;
    const e = t.drop(c, 1);
    if (!e.dropped || e.booched) continue;
    if (!along) { best = Math.max(best, e.steps); continue; }
    let n = 0;
    for (const st of e.stages.filter((z) => z.kind !== 'land')) {
      if (n >= along.length || st.cleared.filter((id) => colOf.get(id) === along[n]).length < 3) break;
      n++;
    }
    best = Math.max(best, n);
  }
  return best;
}

/** The staircase expert. Columns P[0] (the bottom of the stairs, at one edge) to P[5], each a step two
   rows higher than the one before: three of a colour stacked in each (a pair of two, then the third),
   and the third's partner hanging over the step below, the colour of that step. Set it off by dropping
   a fourth on the top step: its three clear, the partner they held falls onto the step below and
   makes four there, and so on down: a step of the chain a column. Pieces that don't fit go to raise
   the steps still to come (each must stand on enough to be two rows above the last). Its worth for a
   drop: the chain the stairs would set off now (how many steps are built), then progress on the next
   step, less for stacking near the top. Building from the bottom step up means a step's hanging
   partner never blocks the column it hangs over, which is already built. */
function stairs() {
  const STEPS = 6, AHEAD = Number(process.env.AHEAD) || 4;
  let dir = 1;
  const P = () => Array.from({ length: STEPS }, (_, k) => (dir > 0 ? k : W - 1 - k));
  // Steps built: the highest step that sets off the whole stairs below it, a column at a time. (Not
  // from the bottom up: a built step's top is covered by the partner hanging over it from the next.)
  const pot = (s, P) => { for (let k = STEPS; k > 0; k--) if (trigger(s, P[k - 1], P.slice(0, k).reverse()) >= k) return k; return 0; };
  const run = (s, c) => {   // the length of the one colour at the top of column c, and its lowest row
    const top = topRow(s, c);
    if (top >= H) return { n: 0, bottom: H };
    let n = 1;
    while (top + n < H && s.grid[top + n][c] && !s.grid[top + n][c].fixed && s.grid[top + n][c].c === s.grid[top][c].c) n++;
    return { n, bottom: top + n - 1 };
  };
  // The highest a step's stack can stand: row 2, or row 4 over the middle columns (a booch is row 0).
  const roof = (c) => (c === 3 || c === 4 ? 4 : 2);
  function worth(s, e, P, ready) {
    if (e.booched) return -1e9;
    if (e.steps >= STEPS || (ready && e.steps >= ready)) return 1e8 + 1000 * e.steps + e.points;
    const p = pot(s, P);
    let v = 1e5 * Math.min(p, STEPS);
    if (p < STEPS) {
      const col = P[p];
      // Where the step being built should stand (the row its stack's lowest piece goes in).
      let R;
      if (p === 0) { R = landRow(s, col); v += 100 * Math.min(run(s, col).n, 3) - 20 * (H - 1 - R); }
      else {
        R = topRow(s, P[p - 1]);
        const land = landRow(s, col);
        if (land > R) v -= 50 * (land - R);
        else {
          const { n, bottom } = run(s, col);
          // Not the colour of the step below: its partner would need a pair of one colour (one in nine).
          const same = n > 0 && s.grid[topRow(s, col)][col].c === s.grid[R][P[p - 1]].c;
          const stacked = n > 0 && bottom <= R && !same && n < 3;
          // Standing higher than it needs to wastes height.
          v += 100 - 150 * (R - (stacked ? bottom : land)) + (stacked ? 100 * n : 0);
        }
      }
      // The steps to come: raised no higher than they'll need to be.
      for (let k = p + 1; k < STEPS; k++) {
        const ideal = R - 2 * (k - p), land = landRow(s, P[k]);
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
    for (const f of first.slice(0, AHEAD)) {
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

const BOT = {
  stairs: stairs(),
  random: (s, rnd) => { const ms = s.moves(); return ms[Math.floor(rnd() * ms.length)]; },
  greedy: (s) => best(s, (s0, m) => { const { e } = tryDrop(s0, m); return e.points; }),
  'two-ply': twoPly(false),
  builder: twoPly(true),
};

// 'record': play the expert from seed 1 up until it makes a Vegas, and print that game's drops (for
// the staircase test in tests/sailing.test.ts).
if (process.argv[2] === 'record') {
  for (let seed = 1; seed < 200; seed++) {
    const s = new Sailing(seeded(seed)), bot = stairs(), drops = [];
    s.record = false;
    for (let d = 0; d < 400; d++) {
      const m = bot(s);
      if (!m) break;
      drops.push([m.col, m.turn, m.row]);
      const e = s.drop(m.col, m.turn, m.row);
      if (e.booched) break;
      if (e.steps >= RUN.VEGAS) {
        console.log(JSON.stringify({ seed, steps: e.steps, drops }));
        process.exit(0);
      }
    }
  }
  process.exit(1);
}

const pct = (n, d) => (100 * n / d).toFixed(1);
console.log(`${GAMES} games of ${DROPS} drops each. Per 100 drops:`);
console.log(['bot'.padEnd(8), 'pts/drop', 'clears', 'Double+', 'Triple+', 'Bingo+', 'Donkey+', 'Vegas', 'squares', 'booches', 'boards', 'longest', 'secs'].join(' | '));
for (const name of BOTS) {
  const t0 = Date.now();
  const tally = { drops: 0, points: 0, run: 0, booches: 0, boards: 0, longest: 0, at: Array(8).fill(0) };
  for (let g = 0; g < GAMES; g++) {
    const s = new Sailing(seeded(1000 + g));
    s.record = false;
    const rnd = seeded(77 + g);
    for (let d = 0; d < DROPS; d++) {
      const m = BOT[name](s, rnd);
      if (!m) break;
      const e = s.drop(m.col, m.turn, m.row);
      tally.drops++;
      tally.points += e.points;
      tally.run += e.run;
      if (e.booched) tally.booches++;
      if (e.boardCleared) tally.boards++;
      tally.longest = Math.max(tally.longest, e.steps);
      for (let k = 1; k <= Math.min(e.steps, 7); k++) tally.at[k]++;
    }
  }
  const n = tally.drops;
  console.log([name.padEnd(8), (tally.points / n).toFixed(2).padEnd(8), pct(tally.at[1], n).padEnd(6), pct(tally.at[2], n).padEnd(7), pct(tally.at[3], n).padEnd(7),
    pct(tally.at[4], n).padEnd(6), pct(tally.at[5], n).padEnd(7), pct(tally.at[RUN.VEGAS], n).padEnd(5), pct(tally.run, n).padEnd(7), pct(tally.booches, n).padEnd(7),
    pct(tally.boards, n).padEnd(6), String(tally.longest).padEnd(7), ((Date.now() - t0) / 1000).toFixed(1)].join(' | '));
}
