// The blockade's rock, paper, scissors, fleet against fleet (src/blockade-skirmish.ts): each pairing of kinds, both
// ways round, over a few seeded dice; who won, and by how much. Run: node tools/blockade-balance.mjs [seeds]
import { skirmish } from '../js/blockade-skirmish.js';
const seeds = Number(process.argv[2] ?? 3), board = process.argv[3] ?? 'open';
const dice = (seed) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pairs = [['frigate', 'sloop'], ['brig', 'frigate'], ['sloop', 'brig']];
const t0 = Date.now();
for (const [a, z] of pairs) {
  let wins = 0, games = 0;
  const rows = [];
  for (let s = 1; s <= seeds; s++) for (const flip of [false, true]) {
    const [g, c] = flip ? [z, a] : [a, z];
    const f = skirmish(g, c, dice(s), { board });
    const aWon = f.winner === (flip ? 'crimson' : 'gold');
    wins += aWon ? 1 : 0; games++;
    rows.push(`  seed ${s} ${g.padEnd(7)} (gold) v ${c.padEnd(7)} (crimson): ${f.winner ?? 'draw'} ${f.gold.toFixed(1)}-${f.crimson.toFixed(1)} in ${f.secs}s`);
  }
  console.log(`${a} should beat ${z} (${board}): ${wins}/${games}`);
  console.log(rows.join('\n'));
}
console.log(`(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
