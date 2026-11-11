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
   A one-star constellation is mostly waiting for a star of its colour, one in five.

   DOOR=1 plays the starlit door's run instead (src/den-door.ts, DOOR.NAV: two dealt as ever, then the evil
   one, six of a colour side by side on the inner ring, which takes two landing at once); COLOURS=n plays
   it with n colours. The bots meet the evil one with its own sense of the board (comboWorth): four of
   its places held, two gaps a ring's turn apart, and the two that'll fill them waiting in the ring above
   to be turned in together; junk kept out of the inner ring. RECORD=1 prints each won game's moves (as
   tests/den-door.test.ts replays one). Runs of 11 Nov, the planner, 40 goes of 600 moves at the door's
   whole run: the two warm-ups always (about 25 moves each), then the evil one with four colours (the
   door's) in 16 goes of 40, about 270 moves when it's done; with the puzzle's five, 6 of 40. No booches
   (it's careful), but most goes wander on, the inner ring choked with stars that won't line up. */

import { Navigation, RINGS, SPOKES, SIZES as OWN, needsCombo } from '../js/navigation.js';
import { seeded } from '../js/mirror-row.js';
import { DOOR } from '../js/den-door.js';

const AT_DOOR = !!process.env.DOOR, OPTS = AT_DOOR ? { ...DOOR.NAV, ...(process.env.COLOURS ? { colours: Number(process.env.COLOURS) } : {}) } : null;
const GAMES = Number(process.argv[2]) || 30, WANT = AT_DOOR ? DOOR.RUN : Number(process.argv[3]) || 7;
const BOTS = (process.argv[4] || 'random,greedy,planner').split(',');
const SIZES = process.env.SIZES ? process.env.SIZES.split(',').map(Number) : OWN;
const CAP = Number(process.env.CAP) || (AT_DOOR ? 600 : 400);

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

/** The evil one (a row of a colour side by side on a ring: needsCombo): what a board's worth to a
    navigator building it. Over every turn of the ring and every pair of gaps that leaves no three of
    the row side by side: its places held by its colour (and not by junk, worse in a gap), and the
    stars of its colour in the ring above beside the gaps, to be turned in together. Junk that could
    line up and go is worth a little; every star, more in the outer ring, costs. */
function comboWorth(g) {
  const G = g.grid, marks = g.constellation.marks, COL = marks[0].colour, N = marks.length, ring = marks[0].ring;
  const s0 = marks.reduce((a, m) => (marks.some((o) => o.spoke === (m.spoke + SPOKES - 1) % SPOKES) ? a : m.spoke), marks[0].spoke);
  const gaps = [];
  for (let i = 0; i < N; i++) for (let j = i + 2; j < N; j++) {
    const held = [...Array(N).keys()].filter((x) => x !== i && x !== j);
    if (!held.some((a) => held.includes(a + 1) && held.includes(a + 2))) gaps.push([i, j]);
  }
  const help = (r, s) => {
    const x = G[r][s];
    let h = 0;
    if (G[r][(s + 1) % SPOKES]?.c === x.c) h++;
    if (G[r][(s + SPOKES - 1) % SPOKES]?.c === x.c) h++;
    for (let rr = 0; rr < RINGS; rr++) if (rr !== r && G[rr][s]?.c === x.c) h++;
    return h;
  };
  let best = -Infinity;
  for (let k = 0; k < SPOKES; k++) for (const [gi, gj] of gaps) {
    let v = 0;
    for (let x = 0; x < SPOKES; x++) {
      const s = (s0 + x + k) % SPOKES, st = G[ring][s];
      if (x >= N) { if (st?.c === COL) v -= 6; continue; }
      if (x === gi || x === gj) { if (st) v -= 40 - 4 * help(ring, s); continue; }
      if (st?.c === COL) v += 20; else if (st) v -= 40 - 3 * help(ring, s);
    }
    let feed = 0;
    if (ring + 1 < RINGS) for (const d of [-1, 1]) {
      let f = 0;
      for (const x of [gi, gj]) if (G[ring + 1][(s0 + x - d + k + SPOKES) % SPOKES]?.c === COL) f += 10;
      feed = Math.max(feed, f);
    }
    best = Math.max(best, v + feed - Math.min(k, SPOKES - k) * 0.3);
  }
  let v = best, all = 0;
  for (let r = 0; r < RINGS; r++) for (let s = 0; s < SPOKES; s++) {
    const x = G[r][s];
    if (!x) continue;
    all++;
    if (r === RINGS - 1) v -= 5;
    if (r > ring && x.c !== COL) v += 1.2 * help(r, s);
  }
  if (G[RINGS - 1][g.next.spoke]) v -= 10;
  return v - all;
}

/** A plan's turns as [ring, dir] steps: ring r turned k places (the shorter way). */
const turns = (r, k) => { const n = k <= SPOKES / 2 ? k : SPOKES - k, d = k <= SPOKES / 2 ? 1 : -1; return Array.from({ length: n }, () => [r, d]); };

/** A board in a line (TRACE=1): each ring from the middle out, then what's wanted and the next star. */
const show = (g) => g.grid.map((r) => r.map((x) => (x ? 'YROWB'[x.c] : '.')).join('')).join(' | ') + '   want ' + (g.constellation?.marks ?? []).map((m) => `${m.ring}/${m.spoke}:${'YROWB'[m.colour]}`).join(' ') + `  next ${'YROWB'[g.next.c]}@${g.next.spoke}`;

let salt = 1;
const evil = (g) => !!g.constellation && needsCombo(g.constellation.marks);
/** Play a plan on a copy: its turns, then a drop if `drop`. Its worth, and its moves. */
function tryPlan(g, steps, drop) {
  const c = g.copy(seeded(salt++));
  let done = null, booched = false, points = 0;
  for (const [r, d] of steps) { const e = c.turn(d, r); points += e.points; done ??= e.done; }
  if (drop) { const e = c.drop(); points += e.points; done ??= e.done; booched = e.booched; }
  const moves = steps.length + (drop ? 1 : 0);
  if (booched) return -1e6;
  if (evil(g)) return done ? 1e4 - moves : comboWorth(c) - moves * 1.2;
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

console.log(AT_DOOR ? `${GAMES} goes at the starlit door's run (${OPTS.colours ?? 5} colours), ${CAP} moves each.` : `${GAMES} games, ${WANT} constellations each, sizes ${SIZES.join(',')}.`);
for (const name of BOTS) {
  const t0 = Date.now();
  const bySize = new Map(), rate = {};
  let booches = 0, stuck = 0, firstThree = [];
  for (let gi = 0; gi < GAMES; gi++) {
    const g = new Navigation(seeded(1000 + gi), OPTS ?? { sizes: SIZES });
    g.record = false;
    const rnd = seeded(77 + gi), played = [];
    let movesAt = 0;
    while (g.completed < WANT && g.totalMoves < CAP) {
      const p = BOT[name](g, rnd);
      played.push(p.steps.map(([r, d]) => `${r}${d > 0 ? '+' : '-'}`).join('') + (p.drop ? 'd' : ''));
      if (process.env.TRACE && gi === 0) console.log(show(g), ' -> ', p.steps.map(([r, d]) => `${r}${d > 0 ? '+' : '-'}`).join(' '), p.drop ? 'drop' : '');
      for (const [r, d] of p.steps) { const e = g.turn(d, r); if (e.done) record(e.done); }
      if (p.drop) { const e = g.drop(); if (e.booched) booches++; if (e.done) record(e.done); }
    }
    if (g.completed < WANT) stuck++;
    else if (process.env.RECORD) console.log(`won, seed ${1000 + gi}, ${g.totalMoves} moves: ${played.join(' ')}`);
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
