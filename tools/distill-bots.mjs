/* Bots that distil: Distilling (src/distilling.ts), played by each tier of src/distill-bots.ts over many
   seeded boards, 12 Nov. What does each reach (its longest Crystal Clear chain, its session score), and
   how long does it take? Those are the goals: "the top bot reaches CC^12 in about X minutes"
   (DISTILLING.md §4, where the results are written up).

   Run on the compiled js (npm run build first) with Node 22 (Node 18 won't load the site's ES modules
   as they are): node_modules/node/bin/node.exe tools/distill-bots.mjs [games] [tiers]
   - games: seeded boards per tier (default 40), tiers: comma-separated, from
     'learner,master,grandmaster,ultimate' (default all four).
   TRACE=1 prints each column of the first game as it goes. CAP=n stops a session at n minutes (30).
   WEIGHTS='{"SORT":2}' and TIER='{"bank":6}' try other weights and tier settings.

   Run of 12 Nov (40 boards a tier), learner / master / grandmaster / ultimate: longest chain mean 0.0 /
   1.9 / 2.4 / 2.5, best 1 / 5 / 5 / 6, CC^6+ 0 / 0 / 0 / 3 of 40, CC^12 none; score a column 1.3 / 8.6 /
   9.0 / 8.9; minutes 5.0 / 1.7 / 1.8 / 1.9; whites burned 14 / 0.7 / 1.0 / 1.6. Stage I is sound, Stage II
   isn't: the white block's edges are dirty (DISTILLING.md §4). Unlimited speed changes little. */

import { Distilling } from '../js/distilling.js';
import { TIERS, W, tierNamed, playSession } from '../js/distill-bots.js';
import { seeded } from '../js/mirror-row.js';

const GAMES = Number(process.argv[2]) || 40;
const NAMES = (process.argv[3] || TIERS.map((t) => t.name).join(',')).split(',');
const CAP = Number(process.env.CAP) || 30;
const L = 'wbK*x';
// WEIGHTS='{"SORT":2}' tries the bots' sense of the board weighed otherwise; TIER='{"bank":6}' a tier's settings.
if (process.env.WEIGHTS) Object.assign(W, JSON.parse(process.env.WEIGHTS));

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f1 = (n) => (Number.isFinite(n) ? n.toFixed(1) : '-');

console.log(`${GAMES} seeded boards a tier, ${CAP} minutes at most each.`);
for (const name of NAMES) {
  const tier = { ...tierNamed(name), ...(process.env.TIER ? JSON.parse(process.env.TIER) : {}) }, t0 = Date.now(), runs = [];
  for (let i = 0; i < GAMES; i++) {
    const g = new Distilling(seeded(5000 + i));
    const trace = process.env.TRACE && i === 0;
    const r = playSession(g, tier, CAP, trace ? (c) => console.log(`  ${(g.time / 1000).toFixed(0).padStart(4)}s ${c.up ? 'up  ' : 'burn'} ${c.pieces.map((p) => L[p]).join('')} ${c.message ?? ''}${c.chain > 1 ? ` x${c.chain}` : ''} ${c.points + c.bonus}`) : undefined);
    runs.push(r);
  }
  const chains = runs.map((r) => r.longest), at = (n) => runs.filter((r) => r.longest >= n).length;
  const full = runs.filter((r) => r.longest >= 12);
  const hist = {};
  for (const c of chains) hist[c] = (hist[c] ?? 0) + 1;
  console.log(`\n${tier.label} (${tier.name}: ${tier.rate} swaps/s, bank ${tier.bank} columns; ${((Date.now() - t0) / 1000).toFixed(1)}s to run)`);
  console.log(`  longest chain: mean ${f1(avg(chains))}, median ${med(chains)}, best ${Math.max(...chains)}; CC^6+ ${at(6)}/${GAMES}, CC^9+ ${at(9)}/${GAMES}, CC^12+ ${at(12)}/${GAMES}`);
  console.log(`  chains: ${Object.entries(hist).map(([k, v]) => `CC^${k} x${v}`).join(', ')}`);
  console.log(`  session score: mean ${f1(avg(runs.map((r) => r.score)))}, best ${f1(Math.max(...runs.map((r) => r.score)))}`);
  console.log(`  minutes a session: mean ${f1(avg(runs.map((r) => r.minutes)))}${full.length ? `; a CC^12 in ${f1(avg(full.map((r) => r.minutes)))}` : ''}; columns burned ${f1(avg(runs.map((r) => r.columnsBurned)))}, sent up ${f1(avg(runs.map((r) => r.columnsUp)))}`);
  console.log(`  whites burned ${f1(avg(runs.map((r) => r.whitesBurned)))}; white columns banked as the chain began ${f1(avg(runs.filter((r) => r.banked !== null).map((r) => r.banked)))}; swaps a minute ${f1(avg(runs.map((r) => r.swaps / r.minutes)))}`);
  const su = runs.reduce((a, r) => ({ early: a.early + r.setups.early, mid: a.mid + r.setups.mid, late: a.late + r.setups.late }), { early: 0, mid: 0, late: 0 });
  if (tier.pairs) console.log(`  drags set up for the next (a pair: crawl, leapfrog, figure of eight, hook) a session: early ${f1(su.early / GAMES)}, mid ${f1(su.mid / GAMES)}, late ${f1(su.late / GAMES)}`);
  console.log(`  ${runs.filter((r) => r.dismissed).length} dismissed, ${runs.filter((r) => r.finished && !r.dismissed).length} the flask full, ${runs.filter((r) => !r.finished).length} out of time`);
}
