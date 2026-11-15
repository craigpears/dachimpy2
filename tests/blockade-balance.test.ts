/* The blockade's rock, paper, scissors, proved fleet against fleet (src/blockade-skirmish.ts): two fleets of equal
   points on open sea, each kind of ship doing what it best can, to the last ship. The user, 15 Nov: "Certainly set some
   balance tests up ... if you have a team, like a fight with all frigs and ... versus all brigs, etc., ... you'd expect
   the one to win that's got the advantage in the rock, paper, scissors setup ... without that artificial turtles won't
   go after sloops thing ... wouldn't a simulation ... actually prove that the sloop wins?"

   Each pairing is fought both ways round (each side its own brigs' craft: Dachimpy's turtles, Dalnoth's phantoms) on
   two seeded dice: four fights. tools/blockade-balance.mjs runs more. Where it stands is BLOCKADE.md §4. */
import { describe, expect, it } from 'vitest';
import { skirmish, SKIRMISH, fleet } from '../src/blockade-skirmish';
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
  it('each side the same points: two frigates, two brigs or six sloops, lined up facing each other, the north the south turned round', () => {
    for (const [k, n] of [['frigate', 2], ['brig', 2], ['sloop', 6]] as [Kind, number][]) {
      expect(fleet(k, 'gold').ships.length * SKIRMISH.POINTS[k]).toBe(SKIRMISH.BUDGET);
      expect(fleet(k, 'gold').ships).toHaveLength(n);
      expect(fleet(k, 'crimson').ships.map((x) => [43 - x.at.c, 35 - x.at.r]).sort()).toEqual(fleet(k, 'gold').ships.map((x) => [x.at.c, x.at.r]).sort());
    }
  });
  it('on open sea, frigates beat sloops: sheer weight of shot', () => { expect(wins('frigate', 'sloop')).toBeGreaterThanOrEqual(3); }, 120000);
  it('on open sea, brigs beat frigates: their craft, turtles from astern and phantoms nothing can hit', () => { expect(wins('brig', 'frigate')).toBeGreaterThanOrEqual(3); }, 120000);
  it('on open sea, sloops beat brigs: a brig anchored to launch is a sitting duck, and too clumsy to bring her guns round on them', () => { expect(wins('sloop', 'brig')).toBeGreaterThanOrEqual(3); }, 120000);
  it('on the blockade\'s board, brigs beat frigates from the lagoons, and sloops beat brigs', () => {
    expect(wins('brig', 'frigate', 'blockade')).toBeGreaterThanOrEqual(3);
    expect(wins('sloop', 'brig', 'blockade')).toBeGreaterThanOrEqual(3);
  }, 120000);
  // (on the board, sloops hide and patch up in the lagoons where no frigate can follow them, so a fight to the last ship
  // is a stand-off: about half each by what's left at the end. In a blockade the buoys bring them out)
  it.todo('on the blockade\'s board, frigates beat sloops');
});
