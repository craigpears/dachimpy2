/* Bots that sail: the Sailing puzzle (src/sailing.ts), 10 Nov. How often does a big chain come, by
   skill? The den's twist runs her forward by the chain (runFor: a step a square, a Vegas seven), so
   this says how far a drop takes her on average, and how rare the long rush is.

   The bots are src/sail-bots.ts (moved there 12 Nov, so the browser can use them). Run on the compiled js
   (npm run build first) with Node 22 (Node 18 won't load the site's ES
   modules as they are): node_modules/node/bin/node.exe tools/sail-bots.mjs [games] [drops] [bots]
   - games: seeded games per bot (default 20), drops: drops a game (default 150),
     bots: comma-separated, from 'random,greedy,two-ply,builder,stairs' (default all five).

   The bots (each sees the board, the pair and the next pair, as a player does):
   - random: any drop it can make.
   - greedy: the drop worth most points now, tried on a copy.
   - two-ply: the drop worth most with the best drop of the next pair after it.
   - builder: two-ply, and on top it weighs the board left behind: targets filled with their colour,
     platforms one short (a trigger waiting), threes of a colour (a line waiting), less for a wrong
     colour in a target and for stacking up near the top. A sailor who sets chains up.
   - stairs: the expert, who builds a staircase (the user, 10 Nov: "Vegas 3s and 4s quite easily";
     see stairs() below) and fires it at six steps. It looks a drop ahead with the next pair after its
     AHEAD best (an environment variable, default 4).
   EASY=1 plays the easy board (Kikkit's whirlpools': src/sailing.ts, EASY) instead of an ordinary deal.
   'record' as the first argument plays the expert from seed 1 up until it makes a Vegas and prints
   that game's drops, for the staircase test in tests/sailing.test.ts.

   Run of 10 Nov (10 games of 200 drops, pairs steered under ledges, lines before platforms), per 100
   drops, random / greedy / two-ply / builder / stairs: points a drop -0.30 / 1.21 / 3.20 / 5.14 /
   2.66; Doubles or better 0.1 / 0.8 / 5.4 / 7.9 / 3.5; Triples or better 0.1 / 0.1 / 0.3 / 0.8 / 2.0;
   Vegas 0 / 0 / 0 / 0 / 0.6 (one every 170 drops or so); longest chain 3 / 4 / 3 / 4 / 7; squares run
   (runFor) 4 / 23 / 40 / 47 / 31; booches 2.6 / 0.9 / 0.1 / 0 / 0.3. Only the staircase makes a
   Vegas; it gives up points a drop to do it. */

import { RUN, Sailing } from '../js/sailing.js';
import { seeded } from '../js/mirror-row.js';
import { SAIL_BOTS, stairs } from '../js/sail-bots.js';

const GAMES = Number(process.argv[2]) || 20, DROPS = Number(process.argv[3]) || 150;
const BOTS = (process.argv[4] || 'random,greedy,two-ply,builder,stairs').split(',');
const AHEAD = Number(process.env.AHEAD) || 4;
// (the bots themselves are src/sail-bots.ts, so the browser can use them too: the race watched)
const BOT = { ...SAIL_BOTS, stairs: stairs(AHEAD) };

// 'record' [from]: play the expert from seed `from` (1) up until it makes a Vegas, and print that game's
// drops (src/sail-bots.ts keeps a few as VEGAS_GAMES, for a Vegas shown move by move: the race watched).
if (process.argv[2] === 'record') {
  for (let seed = Number(process.argv[3]) || 1; seed < 200; seed++) {
    const s = new Sailing(seeded(seed)), bot = stairs(AHEAD), drops = [];
    s.record = false;
    for (let d = 0; d < 400; d++) {
      const m = bot(s);
      if (!m) break;
      drops.push([m.col, m.turn, m.row]);
      const e = s.drop(m.col, m.turn, m.row);
      if (e.booched) break;
      if (e.steps >= RUN.VEGAS) {
        console.log(JSON.stringify({ seed, steps: e.steps, drops }));
        process.exit(0);
      }
    }
  }
  process.exit(1);
}

const pct = (n, d) => (100 * n / d).toFixed(1);
console.log(`${GAMES} games of ${DROPS} drops each. Per 100 drops:`);
console.log(['bot'.padEnd(8), 'pts/drop', 'clears', 'Double+', 'Triple+', 'Bingo+', 'Donkey+', 'Vegas', 'squares', 'booches', 'boards', 'longest', 'secs'].join(' | '));
for (const name of BOTS) {
  const t0 = Date.now();
  const tally = { drops: 0, points: 0, run: 0, booches: 0, boards: 0, longest: 0, at: Array(8).fill(0) };
  for (let g = 0; g < GAMES; g++) {
    const s = new Sailing(seeded(1000 + g), true, { easy: !!process.env.EASY });
    s.record = false;
    const rnd = seeded(77 + g);
    for (let d = 0; d < DROPS; d++) {
      const m = BOT[name](s, rnd);
      if (!m) break;
      const e = s.drop(m.col, m.turn, m.row);
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
