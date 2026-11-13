/* Bots that distil: Distilling (src/distilling.ts), played by each bot of src/distill-bots.ts, a target chain
   each (CC^1, CC^2, CC^3, CC^5, CC^8), over many seeded boards. Each plays the techniques of
   src/distill-routines.ts its target needs, picked by the planner by stage. What does each reach against its
   target (its chains, its session score), and how long does it take? Those are the goals (DISTILLING.md §4,
   where the results are written up).

   Run on the compiled js (npm run build first) with Node 22 (Node 18 won't load the site's ES modules
   as they are): node_modules/node/bin/node.exe tools/distill-bots.mjs [games] [bots]
   - games: seeded boards per bot (default 40, seeds 5000 on), bots: comma-separated, from
     'cc1,cc2,cc3,cc5,cc8' (default all five; the old tier names still work).
   TRACE=1 prints each column of the first game as it goes (TRACE=2 each routine played too). CAP=n stops
   a session at n minutes (30). SCORE='{"TRAPPED":4}' (Stage I's board score, src/distill-score.ts),
   MEASURE='{"STUCK":6}' (the chain's), PLAN='{"SLACK":1}' and TIER='{"reach":16}' try other weights, planner
   settings and a bot's settings; PHASE_W='{"block":{"hook":1.3}}' a phase's weights on the techniques
   (src/distill-phase.ts; PLAN='{"PHASES":0}' switches them off). SEED=n starts the boards at seed n.

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
   / 1.9 (were 1.1 / 1.1 / 1.6 / 2.0) (DISTILLING.md §4, seventh run).
   Never a white burned (13 Nov, the twentieth and twenty-second notes: the furnace's whites saved first, by
   rule, the hard-to-reach first, and a hard white a column earlier the same way), then the twenty-first note's
   tie-breaker, 20 boards a tier: sessions with no white burned 2 / 12 / 14 / 12, then 1 / 11 / 14 / 14 (were
   3 / 12 / 13 / 15); disasters 1 / 0 / 0 / 0 (were 2 / 1 / 0 / 0); points a minute 8.9 / 12.9 / 11.4 / 16.9, then
   9.6 / 9.5 / 13.4 / 16.2 (were 9.0 / 9.8 / 13.8 / 20.7) (DISTILLING.md §4, eighth and ninth runs).
   The block phase (13 Nov, the twenty-third to twenty-fifth notes: junk in blocks, the V, the corner tools kept),
   20 boards a tier: small drags there 3.8 / 7.7 / 7.8 a session for the master / grandmaster / ultimate (were
   6.8 / 11.7 / 12.5), drags there 14.2 / 21.2 / 21.0 (were 21.5 / 29.1 / 29.4); sessions with no white burned
   1 / 14 / 17 / 13 (were 1 / 11 / 14 / 14); points a minute 9.6 / 8.9 / 12.0 / 16.1 (were 9.6 / 9.5 / 13.4 / 16.2)
   (DISTILLING.md §4, tenth run).
   Phases the bots say aloud (13 Nov: fire, fill, block, chain; src/distill-phase.ts), each weighing the
   techniques, 20 boards a tier: whites burned unchanged, sessions with none 1 / 14 / 17 / 13, whites a session 5.3 /
   1.2 / 0.2 / 0.6; points a minute 9.6 / 8.8 / 12.2 / 18.5 (were 9.6 / 8.9 / 12.0 / 16.1) (DISTILLING.md §4,
   eleventh run).
   The bots as target chains (13 Nov, the thirtieth note), and the twenty-sixth to twenty-ninth notes' fixes: see
   DISTILLING.md §4, twelfth run. Whites burned later in a session traced and fixed (the bank left after a chain
   breaks chained again, a way out of a danger zone only when it leaves fewer whites, whites walled in by spice),
   and a danger zone's saving moves ranked by the phase's weights: DISTILLING.md §4, thirteenth run.
   The pair rescue in the chain (13 Nov: junk stuck on the edge of a column going up, freed first): chains 3.7 / 3.5 /
   3.9 / 4.7 / 3.9 (were 2.4 / 2.4 / 2.5 / 3.6 / 3.0), columns up not Crystal Clear 4.3 / 4.4 / 4.5 / 4.0 / 5.5 a session
   (were 7.0 / 7.3 / 7.8 / 6.1 / 7.0); the CHAIN line counts the chain's waits and those columns (DISTILLING.md §4,
   fourteenth run). The board reader: fifteenth run. Every drag a named trick with a goal (no half move chosen), and
   a chain let go when its next column's junk (13 Nov): chains 3.6 / 3.8 / 3.4 / 4.3 / 4.1 (were 3.6 / 4.0 / 3.4 / 4.5 /
   4.3), whites burned 0.5 / 0.7 / 0.5 / 0.3 / 0.3 (were 0.6 / 0.8 / 0.7 / 0.1 / 0.1) (DISTILLING.md §4, sixteenth
   run). */

import { Distilling, WHITE, BROWN, BLACK, BURNT, TALL, UP_LEFT, DOWN_LEFT, neighbourOn, canSwapOn } from '../js/distilling.js';
import { LEVELS, P, bankFor, levelNamed, playSession } from '../js/distill-bots.js';
import { M, playDrags } from '../js/distill-routines.js';
import { S } from '../js/distill-score.js';
import { PHASE_WEIGHTS } from '../js/distill-phase.js';
import { seeded } from '../js/mirror-row.js';

const GAMES = Number(process.argv[2]) || 40;
const NAMES = (process.argv[3] || LEVELS.map((t) => t.name).join(',')).split(',');
const CAP = Number(process.env.CAP) || 30, SEED = Number(process.env.SEED) || 5000;
const L = 'wbK*x';
if (process.env.MEASURE) Object.assign(M, JSON.parse(process.env.MEASURE));
if (process.env.PLAN) Object.assign(P, JSON.parse(process.env.PLAN));
if (process.env.SCORE) Object.assign(S, JSON.parse(process.env.SCORE));
if (process.env.PHASE_W) for (const [k, v] of Object.entries(JSON.parse(process.env.PHASE_W))) PHASE_WEIGHTS[k] = v;

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
// A hard-to-reach white one column from the fire (the twenty-second note: "it doesn't seem fussed that you're only
// one column away from a couple of whites burning at the bottom"): the furnace's column all junk, and in the
// one before it a white with no swap taking it left.
function hardOneFromFire(c) {
  const last = c[c.length - 1], next = c[c.length - 2], x = c.length - 2;
  if (last.some((p) => p === WHITE) || last.reduce((s, p) => s + (p === BLACK ? 1 : p === WHITE || p === BURNT ? -1 : 0), 0) <= 0) return false;
  return next.some((p, y) => p === WHITE && ![UP_LEFT, DOWN_LEFT].some((d) => { const n = neighbourOn(c, x, y, d); return n && canSwapOn(c, x, y, n[0], n[1]); }));
}
// The block phase (the twenty-third note: "you've got the whites mostly over to the left. This is where you just
// start ... treating it more like blocks"): colour half the board or less, and three in four whites left of the
// last three columns. The same test as src/distill-score.ts's `blockPhase`.
function blockPhase(c) {
  let junk = 0, all = 0, whites = 0, left = 0;
  c.forEach((col, x) => col.forEach((p) => { all++; if (junkP(p)) junk++; if (p === WHITE) { whites++; if (x < c.length - 3) left++; } }));
  return junk / all <= 0.5 && whites > 0 && left / whites >= 0.75;
}
const whitesFromCol = (c, x) => c.slice(x).reduce((n, col) => n + col.filter((p) => p === WHITE).length, 0);
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

const EARLY = 3; // the first few columns gone, up or burned: a white burned among them is a disaster
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f1 = (n) => (Number.isFinite(n) ? n.toFixed(1) : '-');

console.log(`${GAMES} seeded boards a bot (seeds ${SEED} on), ${CAP} minutes at most each.`);
for (const name of NAMES) {
  const tier = { ...levelNamed(name), ...(process.env.TIER ? JSON.parse(process.env.TIER) : {}) }, t0 = Date.now(), runs = [];
  for (let i = 0; i < GAMES; i++) {
    const g = new Distilling(seeded(SEED + i));
    const trace = process.env.TRACE && i === 0;
    let lastRoutine = '';
    // Stage I watched: moves that leave more whites trapped than before them (no column gone between), the
    // whites trapped as the chain starts, and the junk columns burned a minute of Stage I.
    const watch = { early: { n: 0, quick: 0, whites: 0, lastBurn: -1e9 }, byPhase: {}, weighted: 0, stageOneMoves: 0, block: { moves: 0, small: 0, swaps: 0, ms: 0, from: null }, ties: 0, chainWaits: 0, chainWaitsJunk: 0, chainWaitMs: 0, notClear: 0, phases: {}, elsewhere: 0, leftMs: 0, stuckWaits: 0, trapping: 0, trappingNear: 0, sweeps: 0, sweepsTrapping: 0, moves: 0, atChain: null, stageOneMs: null, burnedInOne: 0 };
    let before = null;
    let lastPlan = null, lastWait = null;
    const onPlan = (a) => {
      // Stage I time with whites left in the junk columns next to burn, and waits (nothing worth doing) then.
      const left = a.stage === 'junk' ? whitesNextToBurn(g.cols) : 0;
      if (lastPlan && lastPlan.left) watch.leftMs += g.time - lastPlan.t;
      if (left && a.kind === 'wait') watch.stuckWaits++;
      lastPlan = { t: g.time, left: left > 0 };
      // The chain's waits (the thirteenth run: "the bot waits, nothing worth moving, about 300 times a session"):
      // each wait, and those with junk still in the column going up, and the time they took.
      if (lastWait) { watch.chainWaitMs += g.time - lastWait; lastWait = null; }
      if (a.stage === 'chain' && a.kind === 'wait') {
        watch.chainWaits++;
        const col = g.cols[a.column ?? g.cols.length - 1];
        if (col.some((p) => junkP(p))) { watch.chainWaitsJunk++; lastWait = g.time; }
      }
      const now = whitesTrapped(g.cols), near = whitesTrapped(g.cols, true), cols = g.columns.length;
      if (before && before.cols === cols && now > before.n) watch.trapping++;
      if (before && before.cols === cols && near > before.near) watch.trappingNear++;
      before = a.stage === 'junk' && a.kind === 'move' ? { n: now, near, cols } : null;
      // The phase it thought it was in (src/distill-phase.ts), a move at a time, and each technique played there.
      if (a.kind === 'move') {
        watch.phases[a.phase] = (watch.phases[a.phase] ?? 0) + 1;
        const k = a.sweep ? 'sweep' : (a.technique ?? a.routine ?? '?'), bp = (watch.byPhase[a.phase] ??= {});
        bp[k] = (bp[k] ?? 0) + 1;
        if (a.stage === 'junk') { watch.stageOneMoves++; if (a.weighted) watch.weighted++; }
      }
      // Early burns (the twenty-seventh note: "3 burns just happened in rapid succession"): a column burned at once
      // in Stage I, how many within 3 s of the last column burned, and how many with whites still in the two
      // columns that slide up to the fire next.
      if (a.kind === 'burn' && a.stage === 'junk') {
        const e = watch.early, n = g.cols.length;
        e.n++;
        if (g.time - e.lastBurn < 3000) e.quick++;
        if (g.cols[n - 2].concat(g.cols[n - 3]).some((p) => p === WHITE)) e.whites++;
      }
      if (a.stage === 'junk' && a.kind === 'move') {
        watch.moves++;
        if (a.tie) watch.ties++;
        // The block phase (the twenty-third note): moves, swaps, and small drags (1 or 2 swaps) there.
        if (blockPhase(g.cols)) {
          const b = watch.block;
          if (b.from === null) b.from = g.time;
          b.ms = g.time - b.from;
          b.moves++;
          for (const d of a.drags) { b.swaps += d.ways.length; if (d.ways.length <= 2) b.small++; }
          b.drags = (b.drags ?? 0) + a.drags.length;
        }
        // A move that takes no white out of the last two columns while a hard one sits one from the fire.
        if (hardOneFromFire(g.cols)) {
          const after = playDrags(g.cols, a.drags);
          if (after && whitesFromCol(after, g.cols.length - 2) >= whitesFromCol(g.cols, g.cols.length - 2)) watch.elsewhere++;
        }
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
    // When the first white burned (the twentieth note: "how many like mixed brown black columns you burn before
    // you burned a white ... if you burn a white on the first column or the second column that goes up or down,
    // that's catastrophic"): the columns gone (up or burned) before it, and the junk columns burned before it.
    const first = { gone: 0, junk: 0, at: null, junkBefore: null };
    const onColumn = (c) => {
      if (!c.up) watch.early.lastBurn = g.time;
      // A column sent up not Crystal Clear: a chain broken, or never started.
      if (c.up && c.chain === 0) watch.notClear++;
      if (!c.up && g.time <= 180000) watch.burnedBy3 = (watch.burnedBy3 ?? 0) + (c.whites ?? 0);
      if (first.at === null && !c.up && c.whites > 0) { first.at = first.gone + 1; first.junkBefore = first.junk; }
      first.gone++;
      if (!c.up && !(c.whites > 0)) first.junk++;
      if (trace) console.log(`  ${(g.time / 1000).toFixed(0).padStart(4)}s ${c.up ? 'up  ' : 'burn'} ${c.pieces.map((p) => L[p]).join('')} ${c.message ?? ''}${c.chain > 1 ? ` x${c.chain}` : ''} ${c.points + c.bonus}`);
    };
    const r = playSession(g, tier, CAP, onColumn, onPlan);
    runs.push({ ...r, watch, first });
  }
  const chains = runs.map((r) => r.longest), at = (n) => runs.filter((r) => r.longest >= n).length;
  const full = runs.filter((r) => r.longest >= 12);
  const hist = {};
  for (const c of chains) hist[c] = (hist[c] ?? 0) + 1;
  console.log(`\n${tier.label} (${tier.name}: ${tier.rate} swaps/s along a drag, ${tier.spot} ms to spot one, bank ${bankFor(tier.target)} columns; ${((Date.now() - t0) / 1000).toFixed(1)}s to run)`);
  // Its chains against its target (the thirtieth note): every chain sent up, and how many reached it.
  const all = runs.flatMap((r) => r.chains ?? []);
  console.log(`  target CC^${tier.target}: chains sent ${f1(all.length / GAMES)} a session, mean length ${f1(avg(all))}; reaching the target ${all.filter((c) => c >= tier.target).length} of ${all.length}; sessions whose longest reached it ${runs.filter((r) => r.longest >= tier.target).length}/${GAMES}`);
  console.log(`  longest chain: mean ${f1(avg(chains))}, median ${med(chains)}, best ${Math.max(...chains)}; CC^6+ ${at(6)}/${GAMES}, CC^9+ ${at(9)}/${GAMES}, CC^12+ ${at(12)}/${GAMES}${at(12) ? ` (1 run in ${f1(GAMES / at(12))})` : ''}`);
  console.log(`  chains: ${Object.entries(hist).map(([k, v]) => `CC^${k} x${v}`).join(', ')}`);
  // Whites burned, by when (the twentieth note): none at all is the aim; one in the first few columns gone is a
  // disaster ("game ending"); later, still bad.
  const fb = runs.map((r) => r.first), burnt = fb.filter((x) => x.at !== null);
  console.log(`  whites burned: sessions with none ${GAMES - burnt.length}/${GAMES}; the first one burned in the first 3 columns gone (a disaster) ${burnt.filter((x) => x.at <= EARLY).length}/${GAMES}; junk columns burned before the first, where one burned: median ${med(burnt.map((x) => x.junkBefore))} (fewest ${burnt.length ? Math.min(...burnt.map((x) => x.junkBefore)) : '-'}); whites burned a session ${f1(avg(runs.map((r) => r.whitesBurned)))}`);
  console.log(`  session score: mean ${f1(avg(runs.map((r) => r.score)))}, best ${f1(Math.max(...runs.map((r) => r.score)))}`);
  console.log(`  minutes a session: mean ${f1(avg(runs.map((r) => r.minutes)))}${full.length ? `; a CC^12 in ${f1(avg(full.map((r) => r.minutes)))}` : ''}; columns burned ${f1(avg(runs.map((r) => r.columnsBurned)))}, sent up ${f1(avg(runs.map((r) => r.columnsUp)))}`);
  console.log(`  whites burned ${f1(avg(runs.map((r) => r.whitesBurned)))}; white columns banked as the chain began ${f1(avg(runs.filter((r) => r.banked !== null).map((r) => r.banked)))}; drags a minute ${f1(avg(runs.map((r) => r.drags / r.minutes)))}, swaps a drag ${f1(avg(runs.map((r) => r.swaps / Math.max(1, r.drags))))}`);
  const w = runs.map((r) => r.watch), one = w.filter((x) => x.stageOneMs);
  console.log(`  trapped whites (no way left, cut off): moves in Stage I leaving more than before ${f1(avg(w.map((x) => x.trapping)))} a session (of ${f1(avg(w.map((x) => x.moves)))} moves), by the furnace (the score's test) ${f1(avg(w.map((x) => x.trappingNear)))}; on the board as the chain starts ${f1(avg(one.map((x) => x.atChain)))}`);
  console.log(`  Stage I with whites left in the junk columns next to burn: ${f1(avg(w.map((x) => x.leftMs / 1000)))} s a session; waits then (stuck) ${f1(avg(w.map((x) => x.stuckWaits)))}; sessions with any such wait ${w.filter((x) => x.stuckWaits > 0).length}/${GAMES}`);
  const bl = w.map((x) => x.block).filter((b) => b.moves > 0);
  console.log(`  the block phase (whites the bulk and mostly left): reached in ${bl.length}/${GAMES} sessions; there, moves a minute ${f1(avg(bl.filter((b) => b.ms > 0).map((b) => b.moves / (b.ms / 60000))))}, swaps a drag ${f1(avg(bl.map((b) => b.swaps / Math.max(1, b.drags ?? 0))))}, small drags (1 or 2 swaps) ${f1(avg(bl.map((b) => b.small)))} a session of ${f1(avg(bl.map((b) => b.drags ?? 0)))}`);
  console.log(`  the tie-breaker (browns lower, blacks higher on the right, for next to nothing) changed the choice ${f1(avg(w.map((x) => x.ties)))} times a session (of ${f1(avg(w.map((x) => x.moves)))} moves)`);
  console.log(`  moves made elsewhere while a hard-to-reach white sat one column from the fire ${f1(avg(w.map((x) => x.elsewhere)))} a session`);
  console.log(`  brown sweeps (a brown up, then down to the bottom right) in Stage I ${f1(avg(w.map((x) => x.sweeps)))} a session, leaving a white trapped by the furnace ${f1(avg(w.map((x) => x.sweepsTrapping)))}`);
  console.log(`  Stage I: ${f1(avg(one.map((x) => x.stageOneMs / 60000)))} minutes, junk columns burned a minute of it ${f1(avg(one.map((x) => x.burnedInOne / (x.stageOneMs / 60000))))}; session points a minute ${f1(avg(runs.map((r) => r.points / r.minutes)))}`);
  const ph = {};
  for (const x of w) for (const [k, v] of Object.entries(x.phases)) ph[k] = (ph[k] ?? 0) + v;
  console.log(`  moves a session in each phase (src/distill-phase.ts): ${['fire', 'fill', 'block', 'chain'].map((k) => `${k} ${f1((ph[k] ?? 0) / GAMES)}`).join(', ')}${P.PHASES ? '' : ' (its weights off)'}`);
  const ear = w.map((x) => x.early);
  console.log(`  early burns (Stage I, at once) ${f1(avg(ear.map((e) => e.n)))} a session: within 3 s of the last burn ${f1(avg(ear.map((e) => e.quick)))}, with whites in the next two columns ${f1(avg(ear.map((e) => e.whites)))}; Stage I moves ranked with the phase weights on ${w.reduce((s, x) => s + x.weighted, 0)} of ${w.reduce((s, x) => s + x.stageOneMoves, 0)}`);
  const bph = {};
  for (const x of w) for (const [p, ks] of Object.entries(x.byPhase)) for (const [k, v] of Object.entries(ks)) { const o = (bph[p] ??= {}); o[k] = (o[k] ?? 0) + v; }
  for (const p of ['fire', 'fill', 'block', 'chain']) if (bph[p]) console.log(`    ${p.padEnd(6)} ${Object.entries(bph[p]).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${f1(v / GAMES)}`).join(', ')}`);
  const disasters = burnt.filter((x) => x.at <= EARLY).length;
  console.log(`SUMMARY ${tier.name} target ${tier.target ?? '-'}: chain mean ${f1(avg(chains))} (best ${Math.max(...chains)}), at target ${tier.target ? runs.filter((r) => r.longest >= tier.target).length : '-'}/${GAMES}; no white burned ${GAMES - burnt.length}/${GAMES}; disasters ${disasters}; whites burned ${f1(avg(runs.map((r) => r.whitesBurned)))} (in the first 3 minutes ${f1(avg(w.map((x) => x.burnedBy3 ?? 0)))}); points a minute ${f1(avg(runs.map((r) => r.points / r.minutes)))}; early burns ${f1(avg(ear.map((e) => e.n)))} (quick ${f1(avg(ear.map((e) => e.quick)))}, whites next ${f1(avg(ear.map((e) => e.whites)))}); weighted ${w.reduce((s, x) => s + x.weighted, 0)}/${w.reduce((s, x) => s + x.stageOneMoves, 0)}; chains a session ${f1(all.length / GAMES)}, mean ${f1(avg(all))}, at target ${all.filter((c) => c >= tier.target).length}/${all.length}`);
  console.log(`CHAIN ${tier.name}: waits in the chain ${f1(avg(w.map((x) => x.chainWaits)))} a session, with junk in the column going up ${f1(avg(w.map((x) => x.chainWaitsJunk)))} (${f1(avg(w.map((x) => x.chainWaitMs / 1000)))} s); columns sent up not Crystal Clear ${f1(avg(w.map((x) => x.notClear)))} a session`);
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
