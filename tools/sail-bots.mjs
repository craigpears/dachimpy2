/* Bots that sail: the Sailing puzzle (src/sailing.ts), 10 Nov. How often does a big chain come, by
   skill? The den's twist runs her forward by the chain (runFor: a step a square, a Vegas seven), so
   this says how far a drop takes her on average, and how rare the long rush is.

   Run on the compiled js (npm run build first) with Node 22 (Node 18 won't load the site's ES
   modules as they are): node_modules/node/bin/node.exe tools/sail-bots.mjs [games] [drops] [bots]
   - games: seeded games per bot (default 20), drops: drops a game (default 150),
     bots: comma-separated, from 'random,greedy,two-ply,builder' (default all four).

   The bots (each sees the board, the pair and the next pair, as a player does):
   - random: any drop it can make.
   - greedy: the drop worth most points now, tried on a copy.
   - two-ply: the drop worth most with the best drop of the next pair after it.
   - builder: two-ply, and on top it weighs the board left behind: targets filled with their colour,
     platforms one short (a trigger waiting), threes of a colour (a line waiting), less for a wrong
     colour in a target and for stacking up near the top. A sailor who sets chains up.

   First run (10 Nov, 20 games of 150 drops), per 100 drops: points a drop -0.85 / 0.81 / 2.30 / 4.35
   (random / greedy / two-ply / builder); Doubles or better 0.1 / 0.4 / 3.2 / 6.7; Triples or better
   0 / 0 / 0.1 / 0.4; longest chain 2 / 2 / 3 / 4; no Vegas in 3000 drops by any bot. Squares run
   (runFor) 2 / 18 / 33 / 44; booches 5.2 / 1.8 / 0.4 / 0. A Vegas is a build planned over many drops,
   not something two pairs' lookahead stumbles on. */

import { H, RUN, Sailing, W } from '../js/sailing.js';
import { seeded } from '../js/mirror-row.js';

const GAMES = Number(process.argv[2]) || 20, DROPS = Number(process.argv[3]) || 150;
const BOTS = (process.argv[4] || 'random,greedy,two-ply,builder').split(',');

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
const tryDrop = (s, m) => { const c = s.copy(seeded(salt++)); const e = c.drop(m.col, m.turn); return { c, e }; };

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

const BOT = {
  random: (s, rnd) => { const ms = s.moves(); return ms[Math.floor(rnd() * ms.length)]; },
  greedy: (s) => best(s, (s0, m) => { const { e } = tryDrop(s0, m); return e.points; }),
  'two-ply': twoPly(false),
  builder: twoPly(true),
};

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
      const e = s.drop(m.col, m.turn);
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
