/* Bots that play oars against the water (TODO.md, "Prototype oars against the water", 10 Nov), as a
   check on the skill curve: if better play goes much further, and the gap grows with lookahead,
   there's depth to it.

   Run on the compiled js (npm run build first) with Node 22 (Node 18 won't load the site's ES
   modules as they are): node_modules/node/bin/node.exe tools/oar-press-bots.mjs [games] [pairs] [bots]
   - games: seeded games per bot (default 30), pairs: pairs a game (default 200), bots:
     comma-separated, from 'random,greedy,lookahead,builder' (the default, all four).
   - TUNE='{"TURN":1.5}' in the environment tries other numbers in OAR_PRESS without changing them.

   The bots:
   - random: any placement.
   - greedy: the placement worth most once it's landed.
   - lookahead: the placement worth most with the best place for the next pair after it (the
     next pair is shown, so it's fair).
   - builder: lookahead, three times as keen on pieces of a colour lying together (chains to come).
   "Worth" is how far up the course she's made, plus the drive still in the oars (how far each has
   to sweep back, at how firm), less a boat length for every radian she'd be left off the course,
   plus a little for pieces of a colour lying together and less for a stack near the top. */

import { OAR_PRESS, OarPress } from '../js/oar-press.js';

const GAMES = Number(process.argv[2]) || 30, PAIRS = Number(process.argv[3]) || 200;
const BOTS = (process.argv[4] || 'random,greedy,lookahead,builder').split(',');
const OFF = 1, HIGH = 0.3;
let TOGETHER = 0.02;
if (process.env.TUNE) Object.assign(OAR_PRESS, JSON.parse(process.env.TUNE));

const wrap = (h) => ((h + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

function worth(g) {
  const { DRIVE, TURN, H, W } = OAR_PRESS;
  const left = [0, 1].map((s) => (1 - g.oar[s]) * g.firmness(s) * DRIVE);
  const ahead = (left[0] + left[1]) / 2, turn = (left[0] - left[1]) * TURN;
  let v = g.y + ahead * Math.cos(g.heading + turn / 2) - OFF * Math.abs(wrap(g.heading + turn));
  for (const b of g.boards) {
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const p = b.grid[r][c];
      if (!p || p.breaker) continue;
      if (b.grid[r][c + 1]?.c === p.c && !b.grid[r][c + 1].breaker) v += TOGETHER;
      if (b.grid[r + 1]?.[c]?.c === p.c && !b.grid[r + 1][c].breaker) v += TOGETHER;
    }
    for (let c = 0; c < W; c++) if (b.height(c) >= H - 3) v -= HIGH;
  }
  return v;
}

function best(g, deep) {
  let top = -Infinity, pick = null;
  for (const p of g.boards[0].placements()) {
    const t = g.copy();
    t.step([p]);
    let v = worth(t);
    if (deep) { v = -Infinity; for (const q of t.boards[0].placements()) { const u = t.copy(); u.step([q]); v = Math.max(v, worth(u)); } }
    if (v > top) { top = v; pick = p; }
  }
  return pick;
}

const choose = {
  random: (g, rnd) => { const ps = g.boards[0].placements(); return ps[Math.floor(rnd() * ps.length)]; },
  greedy: (g) => best(g, false),
  lookahead: (g) => best(g, true),
  /** The lookahead bot, keener on building groups (for chains) before it pops. */
  builder: (g) => { TOGETHER = 0.06; const p = best(g, true); TOGETHER = 0.02; return p; },
};

function lcg(seed) { let a = seed >>> 0; return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296); }

console.log(`${GAMES} games of ${PAIRS} pairs, solo board (warm to port, cool to starboard)`);
console.log('bot        made good  rowed  straight  pops  popped  chains3+  biggest  unison  washed  spent%');
for (const name of BOTS) {
  const sum = { good: 0, rowed: 0, pops: 0, popped: 0, big: 0, biggest: 0, unison: 0, washed: 0, spent: 0 };
  const t0 = Date.now();
  for (let i = 0; i < GAMES; i++) {
    const g = new OarPress({ seed: 1000 + i * 7 }), rnd = lcg(i + 1);
    for (let k = 0; k < PAIRS; k++) g.step([choose[name](g, rnd)]);
    const s = g.stats;
    sum.good += g.y; sum.rowed += s.rowed; sum.pops += s.pops; sum.popped += s.popped; sum.big += s.bigChains;
    sum.biggest += s.biggestChain; sum.unison += s.unisons; sum.washed += s.washed; sum.spent += (s.spent[0] + s.spent[1]) / (2 * PAIRS);
  }
  const m = (k, d = 1) => (sum[k] / GAMES).toFixed(d);
  console.log(`${name.padEnd(10)} ${m('good').padStart(9)} ${m('rowed').padStart(6)} ${(sum.good / sum.rowed).toFixed(2).padStart(9)} ${m('pops', 0).padStart(5)} ${m('popped', 0).padStart(7)} ${m('big').padStart(9)} ${m('biggest').padStart(8)} ${m('unison', 0).padStart(7)} ${m('washed', 0).padStart(7)} ${(100 * sum.spent / GAMES).toFixed(0).padStart(7)}   (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
