/* Bots that navigate: the Duty Navigation puzzle (src/navigation.ts), 11 Nov. Are its boards fair (is
   every constellation one a player can fill, without booching), and how many moves does each size
   take? That sets SIZES, so a first go (the night sky at the cliff door) is a minute or two.

   Run on the compiled js (npm run build first) with Node 22 (Node 18 won't load the site's ES
   modules as they are): node_modules/node/bin/node.exe tools/nav-bots.mjs [games] [constellations] [bots]
   - games: seeded games per bot (default 30), constellations: a game plays this many (default 7,
     SIZES's sizes in turn), bots: comma-separated, from 'random,greedy,planner' (default all three).
   SIZES=2,3,4 plays those sizes in turn instead of the puzzle's own.

   The bots (each sees the board, the constellation and the next star, as a player does):
   - random: presses keys at random (a ring, a turn either way, or a drop: one in three).
   - greedy: a new navigator. Each go it turns one ring (any way round, by the shorter way) and drops,
     or turns one ring to fill the constellation; it picks the one that leaves the constellation
     most filled (its stars in place, the places under its marks held up), counting the moves.
   - planner: as greedy, but it may turn two rings before the drop.
   A game stops after `constellations` are filled, or 400 moves. TRACE=1 prints the first game's
   board before each go.

   Run of 11 Nov (40 games, a first go: SIZES=1,2,3), random / greedy / planner: moves a constellation
   of one star 70 / 15 / 14, two 135 / 21 / 18, three - / 30 / 35; the three in 66 moves (greedy and
   planner alike); booches 241 / 3 / 1 in the 40 games; no game short. Random rarely fills one: the
   board's fair, but not by chance. Over the full sizes (30 games of six), the planner fills every
   constellation: four stars in about 52 moves, five 63, six 74; combos are rare (the greedy got 2).
   A one-star constellation is mostly waiting for a star of its colour, one in five. */

import { Navigation, RINGS, SPOKES, SIZES as OWN } from '../js/navigation.js';
import { seeded } from '../js/mirror-row.js';

const GAMES = Number(process.argv[2]) || 30, WANT = Number(process.argv[3]) || 7;
const BOTS = (process.argv[4] || 'random,greedy,planner').split(',');
const SIZES = process.env.SIZES ? process.env.SIZES.split(',').map(Number) : OWN;
const CAP = 400;

/** What a board left behind is worth to a navigator filling from the middle out. Rings turn on their
    own, so each ring is weighed by its best turn: the marks in it that turn would fill (less a little
    for the turns), and a mark's place with nothing under it to hold a star up is worth less. Pairs of
    a colour side by side are a line waiting (to clear the junk). Less every star on the board, more
    in the outer ring, and a booch waiting under the next star. */
function worth(g) {
  const c = g.constellation, G = g.grid;
  let v = 0;
  if (c) for (let r = 0; r < RINGS; r++) {
    const marks = c.marks.filter((m) => m.ring === r);
    if (!marks.length) continue;
    let top = -Infinity;
    for (let k = 0; k < SPOKES; k++) {
      let n = 0;
      for (const m of marks) if (G[r][(m.spoke - k + SPOKES) % SPOKES]?.c === m.colour) n++;
      top = Math.max(top, 12 * n - Math.min(k, SPOKES - k));
    }
    v += top;
    for (const m of marks) for (let rr = 0; rr < r; rr++) if (G[rr][m.spoke]) v += 2;
  }
  let outer = 0, all = 0;
  for (let r = 0; r < RINGS; r++) for (let s = 0; s < SPOKES; s++) {
    const x = G[r][s];
    if (!x) continue;
    all++;
    if (r === RINGS - 1) outer++;
    if (G[r][(s + 1) % SPOKES]?.c === x.c) v += 1;
    if (r + 1 < RINGS && G[r + 1][s]?.c === x.c) v += 1;
  }
  if (G[RINGS - 1][g.next.spoke]) v -= 8;
  return v - outer * 3 - all * 0.5;
}

/** A plan's turns as [ring, dir] steps: ring r turned k places (the shorter way). */
const turns = (r, k) => { const n = k <= SPOKES / 2 ? k : SPOKES - k, d = k <= SPOKES / 2 ? 1 : -1; return Array.from({ length: n }, () => [r, d]); };

/** A board in a line (TRACE=1): each ring from the middle out, then what's wanted and the next star. */
const show = (g) => g.grid.map((r) => r.map((x) => (x ? 'YROWB'[x.c] : '.')).join('')).join(' | ') + '   want ' + (g.constellation?.marks ?? []).map((m) => `${m.ring}/${m.spoke}:${'YROWB'[m.colour]}`).join(' ') + `  next ${'YROWB'[g.next.c]}@${g.next.spoke}`;

let salt = 1;
/** Play a plan on a copy: its turns, then a drop if `drop`. Its worth, and its moves. */
function tryPlan(g, steps, drop) {
  const c = g.copy(seeded(salt++));
  let done = null, booched = false, points = 0;
  for (const [r, d] of steps) { const e = c.turn(d, r); points += e.points; done ??= e.done; }
  if (drop) { const e = c.drop(); points += e.points; done ??= e.done; booched = e.booched; }
  const moves = steps.length + (drop ? 1 : 0);
  if (booched) return -1e6;
  // Filling it now is what counts, quicker the better; then the board it leaves.
  return (done ? 1e4 + done.points * 10 : 0) + worth(c) - moves * 1.5 + points * 0.2;
}

function plans(depth) {
  const out = [];
  for (let r = 0; r < RINGS; r++) for (let k = 0; k < SPOKES; k++) {
    if (k === 0 && r > 0) continue;
    const one = k ? turns(r, k) : [];
    out.push(one);
    if (depth > 1 && k) for (let r2 = 0; r2 < RINGS; r2++) if (r2 !== r) for (let k2 = 1; k2 < SPOKES; k2++) out.push([...one, ...turns(r2, k2)]);
  }
  return out;
}

const thinker = (depth) => {
  const ps = plans(depth);
  return (g) => {
    let best = null, top = -Infinity;
    for (const steps of ps) for (const drop of [true, false]) {
      if (!drop && !steps.length) continue;
      let v = tryPlan(g, steps, drop);
      if (!drop && v < 1e4) continue;   // (turning without dropping only to fill it)
      if (v > top) { top = v; best = { steps, drop }; }
    }
    return best;
  };
};

const BOT = {
  random: (g, rnd) => {
    const x = rnd();
    if (x < 1 / 3) return { steps: [], drop: true };
    return { steps: [[Math.floor(rnd() * RINGS), rnd() < 0.5 ? 1 : -1]], drop: false };
  },
  greedy: thinker(1),
  planner: thinker(2),
};

console.log(`${GAMES} games, ${WANT} constellations each, sizes ${SIZES.join(',')}.`);
for (const name of BOTS) {
  const t0 = Date.now();
  const bySize = new Map(), rate = {};
  let booches = 0, stuck = 0, firstThree = [];
  for (let gi = 0; gi < GAMES; gi++) {
    const g = new Navigation(seeded(1000 + gi), { sizes: SIZES });
    g.record = false;
    const rnd = seeded(77 + gi);
    let movesAt = 0;
    while (g.completed < WANT && g.totalMoves < CAP) {
      const p = BOT[name](g, rnd);
      if (process.env.TRACE && gi === 0) console.log(show(g), ' -> ', p.steps.map(([r, d]) => `${r}${d > 0 ? '+' : '-'}`).join(' '), p.drop ? 'drop' : '');
      for (const [r, d] of p.steps) { const e = g.turn(d, r); if (e.done) record(e.done); }
      if (p.drop) { const e = g.drop(); if (e.booched) booches++; if (e.done) record(e.done); }
    }
    if (g.completed < WANT) stuck++;
    function record(d) {
      const t = bySize.get(d.stars) ?? { n: 0, moves: 0, points: 0, combos: 0 };
      t.n++; t.moves += d.moves; t.points += d.points; if (d.combo) t.combos++;
      bySize.set(d.stars, t);
      rate[d.rating] = (rate[d.rating] ?? 0) + 1;
      if (g.completed === 3) firstThree.push(g.totalMoves);
      movesAt = g.totalMoves;
    }
  }
  const sizes = [...bySize.keys()].sort((a, b) => a - b);
  const avg = (a) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-');
  console.log(`\n${name} (${((Date.now() - t0) / 1000).toFixed(1)}s): booches ${booches} in ${GAMES} games; ${stuck} games short of ${WANT} after ${CAP} moves; moves to the first three ${avg(firstThree)}`);
  console.log('  stars | filled | moves each | points each | combos');
  for (const s of sizes) { const t = bySize.get(s); console.log(`  ${String(s).padEnd(5)} | ${String(t.n).padEnd(6)} | ${(t.moves / t.n).toFixed(1).padEnd(10)} | ${(t.points / t.n).toFixed(1).padEnd(11)} | ${t.combos}`); }
  console.log('  ratings: ' + Object.entries(rate).map(([k, v]) => `${k} ${v}`).join(', '));
}
