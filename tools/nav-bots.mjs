/* Bots that navigate: the Duty Navigation puzzle (src/navigation.ts), 11 Nov. Are its boards fair (is
   every constellation one a player can fill, without booching), and how many moves does each size
   take? That sets SIZES, so a first go (the night sky at the cliff door) is a minute or two.

   Run on the compiled js (npm run build first) with Node 22 (Node 18 won't load the site's ES
   modules as they are): node_modules/node/bin/node.exe tools/nav-bots.mjs [games] [constellations] [bots]
   - games: seeded games per bot (default 30), constellations: a game plays this many (default 7,
     SIZES's sizes in turn), bots: comma-separated, from 'random,greedy,planner' (default all three).
   SIZES=2,3,4 plays those sizes in turn instead of the puzzle's own.

   The bots (src/nav-bots.ts, moved there 12 Nov so the browser can use them; each sees the board, the constellation and the next star, as a player does):
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

   DOOR=1 plays the starlit door's run instead (src/den-door.ts, DOOR.NAV: two small ones dealt as ever).
   EVIL=1 plays the evil constellation's run (two dealt as ever, then six of a colour side by side on the
   inner ring, which takes two landing at once; built for the door first, saved for elsewhere since,
   IDEAS.md "The evil constellation"); COLOURS=n plays it with n colours (4 by default). The bots meet the evil one with its own sense of the board (comboWorth): four of
   its places held, two gaps a ring's turn apart, and the two that'll fill them waiting in the ring above
   to be turned in together; junk kept out of the inner ring. RECORD=1 prints each won game's moves (as
   tests/navigation.test.ts replays one). Runs of 11 Nov, the planner, 40 goes of 600 moves at the evil
   run: the two warm-ups always (about 25 moves each), then the evil one with four colours in 16 goes of 40, about 270 moves when it's done; with the puzzle's five, 6 of 40. No booches
   (it's careful), but most goes wander on, the inner ring choked with stars that won't line up. */

import { Navigation, SIZES as OWN, bottomRow } from '../js/navigation.js';
import { NAV_BOTS } from '../js/nav-bots.js';
import { seeded } from '../js/mirror-row.js';
import { DOOR } from '../js/den-door.js';

/** The evil constellation's run (IDEAS.md): two dealt as ever, then six reds side by side on the inner ring. */
const EVIL = { sizes: [2, 3], colours: Number(process.env.COLOURS) || 4, given: [null, null, bottomRow(1, 6, 1)] };
const AT_EVIL = !!process.env.EVIL, AT_DOOR = AT_EVIL || !!process.env.DOOR;
const OPTS = AT_EVIL ? EVIL : AT_DOOR ? { ...DOOR.NAV, ...(process.env.COLOURS ? { colours: Number(process.env.COLOURS) } : {}) } : null;
const GAMES = Number(process.argv[2]) || 30, WANT = AT_EVIL ? 3 : AT_DOOR ? DOOR.RUN : Number(process.argv[3]) || 7;
const BOTS = (process.argv[4] || 'random,greedy,planner').split(',');
const SIZES = process.env.SIZES ? process.env.SIZES.split(',').map(Number) : OWN;
const CAP = Number(process.env.CAP) || (AT_DOOR ? 600 : 400);

/** A board in a line (TRACE=1): each ring from the middle out, then what's wanted and the next star. */
const show = (g) => g.grid.map((r) => r.map((x) => (x ? 'YROWB'[x.c] : '.')).join('')).join(' | ') + '   want ' + (g.constellation?.marks ?? []).map((m) => `${m.ring}/${m.spoke}:${'YROWB'[m.colour]}`).join(' ') + `  next ${'YROWB'[g.next.c]}@${g.next.spoke}`;

// (the bots themselves are src/nav-bots.ts, so the browser can use them too)
const BOT = NAV_BOTS;

console.log(AT_DOOR ? `${GAMES} goes at ${AT_EVIL ? "the evil constellation's" : "the starlit door's"} run (${OPTS.colours ?? 5} colours), ${CAP} moves each.` : `${GAMES} games, ${WANT} constellations each, sizes ${SIZES.join(',')}.`);
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
