/* Bots that distil: Distilling (src/distilling.ts), played by each tier of src/distill-bots.ts over many
   seeded boards. Each tier plays the techniques of src/distill-routines.ts, picked by the planner by
   stage. What does each reach (its longest Crystal Clear chain, its session score, how often CC^12), and
   how long does it take? Those are the goals (DISTILLING.md §4, where the results are written up).

   Run on the compiled js (npm run build first) with Node 22 (Node 18 won't load the site's ES modules
   as they are): node_modules/node/bin/node.exe tools/distill-bots.mjs [games] [tiers]
   - games: seeded boards per tier (default 40, seeds 5000 on), tiers: comma-separated, from
     'learner,master,grandmaster,ultimate' (default all four).
   TRACE=1 prints each column of the first game as it goes (TRACE=2 each routine played too). CAP=n stops
   a session at n minutes (30). SCORE='{"TRAPPED":4}' (Stage I's board score, src/distill-score.ts),
   MEASURE='{"STUCK":6}' (the chain's), PLAN='{"SLACK":1}' and TIER='{"bank":7}' try other weights, planner
   settings and tier settings. SEED=n starts the boards at seed n.

   Run of 12 Nov (40 boards a tier), learner / master / grandmaster / ultimate: longest chain mean 1.5 /
   2.8 / 2.7 / 3.3, best 4 / 6 / 9 / 9, CC^6+ 0 / 4 / 4 / 8 of 40, CC^12 none; score a column 3.9 / 8.6 /
   9.5 / 10.5; minutes 5.6 / 3.3 / 3.0 / 3.0; whites burned 6.5 / 1.6 / 1.4 / 1.4 (the first, hill-climbing
   bots: chains 0.0 / 1.9 / 2.4 / 2.5). Chains break on junk trapped on the whites' edges (DISTILLING.md §4).
   After the user's notes (sweeping, carrying on, turning the right side over): chains 1.7 / 2.7 / 3.1 / 3.5,
   CC^6+ 0 / 2 / 7 / 14 of 40, CC^12 none, swaps a drag 3.4 to 4.1.
   After the sixth to tenth notes (costs in a person's time, plain drags counted first, sorting and the slow
   techniques only once colour's scarce): chains 1.4 / 2.4 / 2.9 / 2.9, CC^6+ 0 / 3 / 7 / 6 of 40, CC^12 none;
   minutes 5.7 / 3.2 / 3.0 / 2.7. Allowing the sorting whenever it pays gave the Ultimate 4.1 on 20 boards.
   Judged by the board score (the eleventh to fourteenth notes: Stage I's moves by src/distill-score.ts, one
   look ahead, a second of a person's time): chains 1.7 / 1.1 / 1.6 / 1.8, best 5 / 3 / 4 / 6, CC^6+ 0 / 0 / 0 /
   1 of 40, CC^12 none; minutes 6.0 / 3.1 / 2.7 / 2.8; blacks no longer dragged up early, but the white block
   banked smaller and less clean (DISTILLING.md §4, fifth run). */

import { Distilling } from '../js/distilling.js';
import { TIERS, P, tierNamed, playSession } from '../js/distill-bots.js';
import { M } from '../js/distill-routines.js';
import { S } from '../js/distill-score.js';
import { seeded } from '../js/mirror-row.js';

const GAMES = Number(process.argv[2]) || 40;
const NAMES = (process.argv[3] || TIERS.map((t) => t.name).join(',')).split(',');
const CAP = Number(process.env.CAP) || 30, SEED = Number(process.env.SEED) || 5000;
const L = 'wbK*x';
if (process.env.MEASURE) Object.assign(M, JSON.parse(process.env.MEASURE));
if (process.env.PLAN) Object.assign(P, JSON.parse(process.env.PLAN));
if (process.env.SCORE) Object.assign(S, JSON.parse(process.env.SCORE));

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f1 = (n) => (Number.isFinite(n) ? n.toFixed(1) : '-');

console.log(`${GAMES} seeded boards a tier (seeds ${SEED} on), ${CAP} minutes at most each.`);
for (const name of NAMES) {
  const tier = { ...tierNamed(name), ...(process.env.TIER ? JSON.parse(process.env.TIER) : {}) }, t0 = Date.now(), runs = [];
  for (let i = 0; i < GAMES; i++) {
    const g = new Distilling(seeded(SEED + i));
    const trace = process.env.TRACE && i === 0;
    let lastRoutine = '';
    const r = playSession(g, tier, CAP,
      trace ? (c) => console.log(`  ${(g.time / 1000).toFixed(0).padStart(4)}s ${c.up ? 'up  ' : 'burn'} ${c.pieces.map((p) => L[p]).join('')} ${c.message ?? ''}${c.chain > 1 ? ` x${c.chain}` : ''} ${c.points + c.bonus}`) : undefined,
      trace && process.env.TRACE === '2' ? (a) => { const s = `${a.stage} ${a.kind} ${a.label}: ${a.reason}`; if (s !== lastRoutine) console.log(`        ${s}`); lastRoutine = s; } : undefined);
    runs.push(r);
  }
  const chains = runs.map((r) => r.longest), at = (n) => runs.filter((r) => r.longest >= n).length;
  const full = runs.filter((r) => r.longest >= 12);
  const hist = {};
  for (const c of chains) hist[c] = (hist[c] ?? 0) + 1;
  console.log(`\n${tier.label} (${tier.name}: ${tier.rate} swaps/s along a drag, ${tier.spot} ms to spot one, bank ${tier.bank} columns; ${((Date.now() - t0) / 1000).toFixed(1)}s to run)`);
  console.log(`  longest chain: mean ${f1(avg(chains))}, median ${med(chains)}, best ${Math.max(...chains)}; CC^6+ ${at(6)}/${GAMES}, CC^9+ ${at(9)}/${GAMES}, CC^12+ ${at(12)}/${GAMES}${at(12) ? ` (1 run in ${f1(GAMES / at(12))})` : ''}`);
  console.log(`  chains: ${Object.entries(hist).map(([k, v]) => `CC^${k} x${v}`).join(', ')}`);
  console.log(`  session score: mean ${f1(avg(runs.map((r) => r.score)))}, best ${f1(Math.max(...runs.map((r) => r.score)))}`);
  console.log(`  minutes a session: mean ${f1(avg(runs.map((r) => r.minutes)))}${full.length ? `; a CC^12 in ${f1(avg(full.map((r) => r.minutes)))}` : ''}; columns burned ${f1(avg(runs.map((r) => r.columnsBurned)))}, sent up ${f1(avg(runs.map((r) => r.columnsUp)))}`);
  console.log(`  whites burned ${f1(avg(runs.map((r) => r.whitesBurned)))}; white columns banked as the chain began ${f1(avg(runs.filter((r) => r.banked !== null).map((r) => r.banked)))}; drags a minute ${f1(avg(runs.map((r) => r.drags / r.minutes)))}, swaps a drag ${f1(avg(runs.map((r) => r.swaps / Math.max(1, r.drags))))}`);
  const used = {};
  for (const r of runs) for (const [k, v] of Object.entries(r.used)) used[k] = (used[k] ?? 0) + v;
  console.log(`  routines a session: ${Object.entries(used).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${f1(v / GAMES)}`).join(', ')}`);
  // Stage I's techniques: how often a session while colour was plentiful / middling / scarce, and a
  // person's time per column of junk got over (the seventh and tenth notes' ranking).
  const cost = {};
  for (const r of runs) for (const [k, c] of Object.entries(r.cost)) {
    const t = (cost[k] ??= { plenty: 0, middle: 0, scarce: 0, ms: 0, over: 0 });
    for (const f of ['plenty', 'middle', 'scarce', 'ms', 'over']) t[f] += c[f];
  }
  console.log(`  Stage I, a session (colour plentiful/middling/scarce) and ms a column of junk over:`);
  for (const [k, c] of Object.entries(cost).sort((a, b) => a[1].ms / Math.max(1, a[1].over) - b[1].ms / Math.max(1, b[1].over))) {
    console.log(`    ${k.padEnd(12)} ${f1(c.plenty / GAMES)}/${f1(c.middle / GAMES)}/${f1(c.scarce / GAMES)}   ${c.over > 0 ? Math.round(c.ms / c.over) : '-'} ms`);
  }
  console.log(`  ${runs.filter((r) => r.dismissed).length} dismissed, ${runs.filter((r) => r.finished && !r.dismissed).length} the flask full, ${runs.filter((r) => !r.finished).length} out of time`);
}
