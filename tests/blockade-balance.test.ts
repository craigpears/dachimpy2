/* The blockade's rock, paper, scissors, proved fleet against fleet (src/blockade-skirmish.ts): two fleets of equal
   points on open sea, each kind of ship doing what it best can, to the last ship. The user, 15 Nov: "Certainly set some
   balance tests up ... if you have a team, like a fight with all frigs and ... versus all brigs, etc., ... you'd expect
   the one to win that's got the advantage in the rock, paper, scissors setup ... without that artificial turtles won't
   go after sloops thing ... wouldn't a simulation ... actually prove that the sloop wins?"

   Each pairing is fought both ways round (each side its own brigs' craft: Dachimpy's turtles, Dalnoth's phantoms) on
   two seeded dice: four fights. tools/blockade-balance.mjs runs more. Where it stands is BLOCKADE.md §4. */
import { describe, expect, it } from 'vitest';
import { skirmish, SKIRMISH, fleet, blockadeGame, blockadeFleet } from '../src/blockade-skirmish';
import { Blockade, BLOCKADE } from '../src/blockade';
import type { Kind } from '../src/blockade';

const dice = (seed: number) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
/** How many of four fights `a` wins against `z`, on open sea or the blockade's board. */
const wins = (a: Kind, z: Kind, board: 'open' | 'blockade' = 'open') => {
  let n = 0;
  for (const seed of [1, 2]) for (const flip of [false, true]) {
    const f = skirmish(flip ? z : a, flip ? a : z, dice(seed), { board });
    if (f.winner === (flip ? 'crimson' : 'gold')) n++;
  }
  return n;
};

describe('rock, paper, scissors, fleet against fleet (15 Nov: "set some balance tests up")', () => {
  it('each side the same points: two frigates, three brigs or six sloops, lined up facing each other, the north the south turned round', () => {
    for (const [k, n] of [['frigate', 2], ['brig', 3], ['sloop', 6]] as [Kind, number][]) {
      expect(fleet(k, 'gold').ships.length * SKIRMISH.POINTS[k]).toBe(SKIRMISH.BUDGET);
      expect(fleet(k, 'gold').ships).toHaveLength(n);
      expect(fleet(k, 'crimson').ships.map((x) => [BLOCKADE.COLS - 1 - x.at.c, BLOCKADE.ROWS - 1 - x.at.r]).sort()).toEqual(fleet(k, 'gold').ships.map((x) => [x.at.c, x.at.r]).sort());
    }
  });
  it('head-on, on open sea: frigates beat sloops (weight of shot), brigs beat frigates (their craft), brigs beat sloops (a brig\'s hull, 15 Nov: "consistent with Puzzle Pirates")', () => {
    expect(wins('frigate', 'sloop')).toBeGreaterThanOrEqual(3);
    expect(wins('brig', 'frigate')).toBeGreaterThanOrEqual(3);
    expect(wins('brig', 'sloop')).toBeGreaterThanOrEqual(3);
  }, 180000);
  it('head-on, on the blockade\'s board: brigs beat frigates from the lagoons, and frigates beat sloops', () => {
    expect(wins('brig', 'frigate', 'blockade')).toBeGreaterThanOrEqual(3);
    expect(wins('frigate', 'sloop', 'blockade')).toBeGreaterThanOrEqual(3);
  }, 180000);
});

describe('whole blockades, buoys and all (15 Nov: "it kind of emerges in the tactics")', () => {
  it('each side placed as a blockade has it, every ship where she fits: frigates on their end, brigs and sloops on their side', () => {
    for (const m of [{ frigate: 3 }, { brig: 4 }, { sloop: 8 }, { frigate: 1, brig: 1, sloop: 3 }]) {
      const b = new Blockade({ teams: [blockadeFleet(m, 'gold'), blockadeFleet(m, 'crimson')] });
      for (const s of b.ships.filter((x) => !x.craft)) expect(s.sea.bare().fits(s.helm.pose), s.name).toBe(true);
    }
  });
  it('brigs beat frigates in a blockade', () => {
    let n = 0;
    for (const seed of [1, 2]) for (const flip of [false, true]) {
      const g = flip ? blockadeGame({ frigate: 2 }, { brig: 3 }, dice(seed)) : blockadeGame({ brig: 3 }, { frigate: 2 }, dice(seed));
      if (g.winner === (flip ? 'crimson' : 'gold')) n++;
    }
    expect(n).toBeGreaterThanOrEqual(3);
  }, 180000);
  // (as it stands, six sloops out-score anything in a blockade: everywhere at once, a buoy contested by any one of them.
  // To shape with the user, BLOCKADE.md §3)
  it.todo('brigs holding the centre and contesting a lagoon beat sloops; frigates forcing them out, the sloops win');
});
