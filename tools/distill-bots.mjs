/* Bots that distil: Distilling (src/distilling.ts), played by each tier of src/distill-bots.ts over many
   seeded boards. Each tier plays the techniques of src/distill-routines.ts, picked by the planner by
   stage. What does each reach (its longest Crystal Clear chain, its session score, how often CC^12), and
   how long does it take? Those are the goals (DISTILLING.md §4, where the results are written up).

   Run on the compiled js (npm run build first) with Node 22 (Node 18 won't load the site's ES modules
   as they are): node_modules/node/bin/node.exe tools/distill-bots.mjs [games] [tiers]
   - games: seeded boards per tier (default 40, seeds 5000 on), tiers: comma-separated, from
     'learner,master,grandmaster,ultimate' (default all four).
   TRACE=1 prints each column of the first game as it goes (TRACE=2 each routine played too). CAP=n stops
   a session at n minutes (30). MEASURE='{"STUCK":6}', PLAN='{"SLACK":1}' and TIER='{"bank":7}' try other
   weights, planner settings and tier settings. SEED=n starts the boards at seed n.

   Run of 12 Nov (40 boards a tier), learner / master / grandmaster / ultimate: longest chain mean 1.5 /
   2.8 / 2.7 / 3.3, best 4 / 6 / 9 / 9, CC^6+ 0 / 4 / 4 / 8 of 40, CC^12 none; score a column 3.9 / 8.6 /
   9.5 / 10.5; minutes 5.6 / 3.3 / 3.0 / 3.0; whites burned 6.5 / 1.6 / 1.4 / 1.4 (the first, hill-climbing
   bots: chains 0.0 / 1.9 / 2.4 / 2.5). Chains break on junk trapped on the whites' edges (DISTILLING.md §4). */

import { Distilling } from '../js/distilling.js';
import { TIERS, P, tierNamed, playSession } from '../js/distill-bots.js';
import { M } from '../js/distill-routines.js';
import { seeded } from '../js/mirror-row.js';

const GAMES = Number(process.argv[2]) || 40;
const NAMES = (process.argv[3] || TIERS.map((t) => t.name).join(',')).split(',');
const CAP = Number(process.env.CAP) || 30, SEED = Number(process.env.SEED) || 5000;
const L = 'wbK*x';
if (process.env.MEASURE) Object.assign(M, JSON.parse(process.env.MEASURE));
if (process.env.PLAN) Object.assign(P, JSON.parse(process.env.PLAN));

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
  console.log(`  ${runs.filter((r) => r.dismissed).length} dismissed, ${runs.filter((r) => r.finished && !r.dismissed).length} the flask full, ${runs.filter((r) => !r.finished).length} out of time`);
}
