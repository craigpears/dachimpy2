/* The sloop race, simulated (src/race-sim.ts), 11 Nov: bots of every strategy and skill raced against
   each other on the race's course, no 3D, to see whether every way round has "a relatively equal chance
   of winning" (the user). RACE.md §8 has the numbers and what was tuned by them.

   Run on the compiled js (npm run build first) with Node 22 (Node 18 won't load the site's ES modules as
   they are): node_modules/node/bin/node.exe tools/race-sim.mjs [races] [size] [mode]
   - races: races run (default 2000), each a fresh field from its own seed;
   - size: racers in each, 2 to 4 (default 4), each a strategy drawn at random (no two alike) and a skill
     (decent, good or great);
   - mode: the gun gap's guns, 'shared' (her shots quieten them, a hit each: the same shots as for racers)
     or 'hits' (they need more hits than she starts with), RACE.GAP.MODE by default.
   A racer is a route (the shortcuts she takes) and a style (when she fires, whether she loads more, whether
   she'll stop in the open with someone close behind), each reported on its own.
   SAVES=locks:30,crane:60 tries the course with those shortcuts saving those seconds instead (a course
   before it's laid). ROUTES=long,locks races just those routes. CHAIN=0: nobody Sails on the pilot.
   SHOTS=n: racers start with n shots. SNAKES=0: no snakes. (The gambles went, 12 Nov.) */

import { run, ROUTES, STYLES, CUTS, SKILLS, PACE, SIM } from '../js/race-sim.js';
import { RACE } from '../js/den-race.js';
import { DOOR } from '../js/den-door.js';

const RACES = Number(process.argv[2]) || 2000, SIZE = Number(process.argv[3]) || 4, MODE = process.argv[4] || RACE.GAP.MODE;
const saves = {};
Object.assign(saves, Object.fromEntries((process.env.SAVES || '').split(',').filter(Boolean).map((kv) => { const [k, v] = kv.split(':'); return [k, Number(v)]; })));
const routes = process.env.ROUTES ? ROUTES.filter((s) => process.env.ROUTES.split(',').includes(s.name)) : ROUTES;
const opts = { mode: MODE, saves, routes, chains: process.env.CHAIN !== '0', snakes: process.env.SNAKES !== '0', ...(process.env.SHOTS ? { shots: Number(process.env.SHOTS) } : {}) };

const t0 = Date.now();
const rep = run(RACES, SIZE, opts);
const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(1)}%` : '-').padStart(6);
const fair = 1 / SIZE;

console.log(`${RACES} races of ${SIZE}, the gap's guns '${MODE}', Sailing on the pilot ${opts.chains ? 'on' : 'off'}, the long way ${SIM.LONG} s (${PACE.toFixed(2)} s a square); ${((Date.now() - t0) / 1000).toFixed(1)} s.`);
console.log('Shortcuts on the course (seconds): ' + Object.values(CUTS).map((c) => `${c.id} saves ${(saves[c.id] ?? c.saves).toFixed(0)} (trip ${c.trip.toFixed(1)}${c.sheltered ? ', sheltered' : ''})`).join('; '));

const table = (title, rows, by) => {
  console.log(`\n${title} (fair: ${(100 * fair).toFixed(0)}%)`);
  console.log('             races   wins  vs fair  time   hit/race  hits given');
  for (const s of rows) {
    const t = by[s.name];
    if (t) console.log(`${s.name.padEnd(11)} ${String(t.n).padStart(6)} ${pct(t.wins, t.n)}  ${(t.wins / t.n / fair).toFixed(2).padStart(6)}  ${(t.time / t.n).toFixed(0).padStart(4)}  ${(t.hitsTaken / t.n).toFixed(2).padStart(8)}  ${(t.hitsGiven / t.n).toFixed(2).padStart(9)}`);
  }
};
table('By route', routes, rep.byRoute);
table('By style', STYLES, rep.byStyle);
console.log('\nBy skill');
for (const k of SKILLS) { const t = rep.bySkill[k]; if (t) console.log(`${k.padEnd(8)} ${pct(t.wins, t.n)}  time ${(t.time / t.n).toFixed(0)}`); }
table('By starting spot (left of the field\'s hop, above it, right of it)', [{ name: 'left' }, { name: 'gap' }, { name: 'right' }], rep.bySpot);
console.log('\nSwept back by a snake (racers it had, and how many of them still won)');
for (const [k, x] of Object.entries(rep.bySnake)) console.log(`${k.padEnd(7)} ${String(x.n).padStart(5)}  won ${pct(x.wins, x.n)}`);

console.log('\nStopped in the open to puzzle, by place in the field then');
for (const [k, p] of Object.entries(rep.byPosition)) console.log(`${k.padEnd(7)} stops ${String(p.n).padStart(5)}  hit there ${pct(p.hit, p.n)}  won the race ${pct(p.wins, p.n)}`);

console.log('\nWhat each shortcut really saved (seconds, mean, by skill; less than nothing: it cost her)');
console.log('shortcut   gone for  done    decent   good  great');
for (const [id, c] of Object.entries(rep.cuts)) {
  const m = (k) => (c.saved[k].n ? (c.saved[k].secs / c.saved[k].n).toFixed(0) : '-').padStart(6);
  console.log(`${id.padEnd(9)} ${String(c.tried).padStart(8)} ${pct(c.done, c.tried)}  ${m('decent')} ${m('good')} ${m('great')}`);
}

console.log('\nThe starlit door\'s tunnel: who came up at each exit (by skill), and how many of them won');
rep.exits.forEach((e, k) => { const n = e.decent + e.good + e.great; console.log(`exit ${k + 1} (leg ${DOOR.EXITS[k].to + 1})  ${String(n).padStart(5)}  decent ${e.decent}  good ${e.good}  great ${e.great}  won ${pct(e.wins, n)}`); });

const K = rep.rocks;
console.log(`\nThe rocks (12 Nov): down in ${pct(K.down, RACES)} of races; racers who hit them ${K.hit} (won ${pct(K.hitWins, K.hit)}), went through ${K.through} (won ${pct(K.throughWins, K.through)}), through free on someone else's hits ${K.free} (won ${pct(K.freeWins, K.free)})`);