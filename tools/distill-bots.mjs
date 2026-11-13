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
   banked smaller and less clean (DISTILLING.md §4, fifth run).
   The simpler score (13 Nov, the eighteenth note: columns filled on the right, colour pulled right, then a
   straight upright wall; nothing trapped), the brown sweep gated, the path search, 20 boards a tier: chains 1.1 /
   1.1 / 1.6 / 2.0 (were 1.6 / 1.2 / 1.3 / 2.0); whites burned 6.5 / 0.8 / 0.9 / 0.9 (were 6.3 / 1.8 / 1.9 / 1.1);
   moves trapping a white by the furnace 1.7 / 2.4 / 1.6 / 1.9 a session (were 2.3 / 3.9 / 3.1 / 4.0); points a
   minute 9.0 / 9.5 / 15.2 / 21.0 (were 9.9 / 9.1 / 11.0 / 16.1) (DISTILLING.md §4, sixth run).
   A piece moved to open the way, and the furnace's whites costing more (13 Nov, the nineteenth note), 20 boards
   a tier: waits with whites left in the columns next to burn 9.3 / 24.3 / 16.5 / 8.9 a session (were 11.4 /
   17.1 / 25.4 / 17.6); whites burned 6.5 / 0.7 / 0.7 / 0.3 (were 6.5 / 0.8 / 0.9 / 0.9); chains 1.1 / 1.1 / 1.4
   / 1.9 (were 1.1 / 1.1 / 1.6 / 2.0) (DISTILLING.md §4, seventh run). */

import { Distilling, WHITE, BROWN, BLACK, BURNT, TALL, UP_LEFT, DOWN_LEFT, neighbourOn, canSwapOn } from '../js/distilling.js';
import { TIERS, P, tierNamed, playSession } from '../js/distill-bots.js';
import { M, playDrags } from '../js/distill-routines.js';
import { S } from '../js/distill-score.js';
import { seeded } from '../js/mirror-row.js';

const GAMES = Number(process.argv[2]) || 40;
const NAMES = (process.argv[3] || TIERS.map((t) => t.name).join(',')).split(',');
const CAP = Number(process.env.CAP) || 30, SEED = Number(process.env.SEED) || 5000;
const L = 'wbK*x';
if (process.env.MEASURE) Object.assign(M, JSON.parse(process.env.MEASURE));
if (process.env.PLAN) Object.assign(P, JSON.parse(process.env.PLAN));
if (process.env.SCORE) Object.assign(S, JSON.parse(process.env.SCORE));

// A white trapped, measured here so a run before a change and one after use the same yardstick (the user,
// 13 Nov, the eighteenth note: the bot's first move "went the entire way so that there was a white trap right
// at the top"): no swap takes it left, junk lies left of it in its row, and it's on the top or bottom edge or
// has no white beside it on its left (broader than src/distill-score.ts's `trappedWhite`, which is the edge
// alone, on the colour's side).
const junkP = (p) => p === BROWN || p === BLACK || p === BURNT;
// The brown sweep (the user, 13 Nov: "the way that [the bot's] sweeping browns up back down to the bottom right
// ... is very good. But it's just like it leaves one or two trapped whites"): a brown up, then down.
const brownSweep = (c, drags) => drags.length > 0 && c[drags[0].x][drags[0].y] === BROWN
  && drags[0].ways.some((w, i) => (w === 0 || w === 1) && drags[0].ways.slice(i + 1).some((v) => v === 2 || v === 3));
// `near`: only those in the column being filled on the right or the two left of it, next to burn, on the colour's
// side of the straight wall: src/distill-score.ts's `trappedWhite` where its score counts it.
function wallAt(c) {
  let at = 0, fewest = Infinity;
  for (let b = 0; b <= c.length; b++) {
    let n = 0;
    for (let x = 0; x < c.length; x++) for (const p of c[x]) if (x < b ? junkP(p) : p === WHITE) n++;
    if (n < fewest) { fewest = n; at = b; }
  }
  return at;
}
// Whites left in the junk columns next to burn (the nineteenth note: "it did seem to get stuck"): from the
// column before the one being built, those more junk than white.
function whitesNextToBurn(c) {
  const done = (col) => !col.some((p) => p === WHITE) && col.reduce((s, p) => s + (p === BLACK ? 1 : p === WHITE || p === BURNT ? -1 : 0), 0) > 0;
  let t = c.length - 1;
  while (t > 0 && done(c[t])) t--;
  let n = 0;
  for (let x = Math.max(0, t - 1); x < c.length; x++) {
    const w = c[x].filter((p) => p === WHITE).length;
    if (c[x].filter(junkP).length > w) n += w;
  }
  return n;
}
function whitesTrapped(c, near = false) {
  let done = 0;
  for (let x = c.length - 1; x >= 0; x--) {
    if (c[x].some((p) => p === WHITE) || c[x].reduce((s, p) => s + (p === BLACK ? 1 : p === WHITE || p === BURNT ? -1 : 0), 0) <= 0) break;
    done++;
  }
  const from = near ? Math.max(c.length - 1 - done - 2, wallAt(c)) : 1;
  let n = 0;
  for (let x = Math.max(1, from); x < c.length; x++) for (let y = 0; y < c[x].length; y++) {
    if (c[x][y] !== WHITE) continue;
    const left = [UP_LEFT, DOWN_LEFT].map((d) => neighbourOn(c, x, y, d)).filter(Boolean);
    if (left.some(([a, b]) => canSwapOn(c, x, y, a, b))) continue;
    let cut = false;
    for (let i = 0; i < x && !cut; i++) if (y < c[i].length && junkP(c[i][y])) cut = true;
    if (!cut) continue;
    const edge = c[x].length === TALL && (y === 0 || y === TALL - 1);
    if (edge || left.every(([a, b]) => c[a][b] !== WHITE)) n++;
  }
  return n;
}

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
    // Stage I watched: moves that leave more whites trapped than before them (no column gone between), the
    // whites trapped as the chain starts, and the junk columns burned a minute of Stage I.
    const watch = { leftMs: 0, stuckWaits: 0, trapping: 0, trappingNear: 0, sweeps: 0, sweepsTrapping: 0, moves: 0, atChain: null, stageOneMs: null, burnedInOne: 0 };
    let before = null;
    let lastPlan = null;
    const onPlan = (a) => {
      // Stage I time with whites left in the junk columns next to burn, and waits (nothing worth doing) then.
      const left = a.stage === 'junk' ? whitesNextToBurn(g.cols) : 0;
      if (lastPlan && lastPlan.left) watch.leftMs += g.time - lastPlan.t;
      if (left && a.kind === 'wait') watch.stuckWaits++;
      lastPlan = { t: g.time, left: left > 0 };
      const now = whitesTrapped(g.cols), near = whitesTrapped(g.cols, true), cols = g.columns.length;
      if (before && before.cols === cols && now > before.n) watch.trapping++;
      if (before && before.cols === cols && near > before.near) watch.trappingNear++;
      before = a.stage === 'junk' && a.kind === 'move' ? { n: now, near, cols } : null;
      if (a.stage === 'junk' && a.kind === 'move') {
        watch.moves++;
        if (brownSweep(g.cols, a.drags)) {
          watch.sweeps++;
          const after = playDrags(g.cols, a.drags);
          if (after && whitesTrapped(after, true) > near) watch.sweepsTrapping++;
        }
      }
      if (a.stage === 'chain' && watch.atChain === null) {
        watch.atChain = now; watch.stageOneMs = g.time; watch.burnedInOne = g.columns.length - g.columnsUp;
      }
      if (trace && process.env.TRACE === '2') { const s = `${a.stage} ${a.kind} ${a.label}: ${a.reason}`; if (s !== lastRoutine) console.log(`        ${s}`); lastRoutine = s; }
    };
    const r = playSession(g, tier, CAP,
      trace ? (c) => console.log(`  ${(g.time / 1000).toFixed(0).padStart(4)}s ${c.up ? 'up  ' : 'burn'} ${c.pieces.map((p) => L[p]).join('')} ${c.message ?? ''}${c.chain > 1 ? ` x${c.chain}` : ''} ${c.points + c.bonus}`) : undefined,
      onPlan);
    runs.push({ ...r, watch });
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
  const w = runs.map((r) => r.watch), one = w.filter((x) => x.stageOneMs);
  console.log(`  trapped whites (no way left, cut off): moves in Stage I leaving more than before ${f1(avg(w.map((x) => x.trapping)))} a session (of ${f1(avg(w.map((x) => x.moves)))} moves), by the furnace (the score's test) ${f1(avg(w.map((x) => x.trappingNear)))}; on the board as the chain starts ${f1(avg(one.map((x) => x.atChain)))}`);
  console.log(`  Stage I with whites left in the junk columns next to burn: ${f1(avg(w.map((x) => x.leftMs / 1000)))} s a session; waits then (stuck) ${f1(avg(w.map((x) => x.stuckWaits)))}; sessions with any such wait ${w.filter((x) => x.stuckWaits > 0).length}/${GAMES}`);
  console.log(`  brown sweeps (a brown up, then down to the bottom right) in Stage I ${f1(avg(w.map((x) => x.sweeps)))} a session, leaving a white trapped by the furnace ${f1(avg(w.map((x) => x.sweepsTrapping)))}`);
  console.log(`  Stage I: ${f1(avg(one.map((x) => x.stageOneMs / 60000)))} minutes, junk columns burned a minute of it ${f1(avg(one.map((x) => x.burnedInOne / (x.stageOneMs / 60000))))}; session points a minute ${f1(avg(runs.map((r) => r.points / r.minutes)))}`);
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
