/* Bilging the shallows: the tide, the rocks and the barrels (9 Nov). */
import { describe, expect, it } from 'vitest';
import { BILGE, HIGH, LOW, Tide, barrelsFor, blastHits, oddsFor, onRocks, rocksBare, shoreAt, worth } from '../src/den-bilge';
import { MAX_WATER, MIN_WATER } from '../src/bilge';
import type { Move } from '../src/bilge';

const move = (o: Partial<Move>): Move => ({ moved: true, lines: [], combo: '', cleared: 0, chain: 0, crabs: 0, puffer: false, jelly: false, stages: [], ...o });

describe('the tide is the board\'s water line', () => {
  it('runs the sea\'s edge out to the board\'s water: three rows of water, nine rows of dry board', () => {
    expect(shoreAt(MIN_WATER)).toBe(BILGE.Z0 - 9);
    expect(shoreAt(MAX_WATER)).toBe(BILGE.Z0 - 3);
    expect(LOW).toBeLessThan(HIGH);
  });
  it('starts out, as the puzzle does, with three rows of water', () => {
    expect(new Tide().water).toBe(MIN_WATER);
  });
  it('comes in by itself, but never over the top three rows', () => {
    const t = new Tide();
    t.tick(30);
    expect(t.water).toBeCloseTo(MIN_WATER + 1);
    t.tick(1000);
    expect(t.water).toBe(MAX_WATER);
  });
  it('goes out as you bilge, but never below three rows', () => {
    const t = new Tide();
    t.water = 6;
    t.pump(worth(move({ lines: [3, 3, 3], combo: 'Bingo!' }), t.water));
    expect(t.water).toBeLessThan(6);
    t.pump(1000);
    expect(t.water).toBe(MIN_WATER);
  });
  it('keeps up with the tide if you clear a three every three seconds or so', () => {
    const t = new Tide();
    t.water = 6;
    for (let i = 0; i < 20; i++) { t.tick(3); t.pump(worth(move({ lines: [3] }), t.water)); }
    expect(t.water).toBeLessThanOrEqual(6);
  });
});

describe('what a move is worth', () => {
  it('counts the bigger combos far more, as the bilging guides do', () => {
    const w = (lines: number[], combo: string) => worth(move({ lines, combo }), 3);
    expect(w([3], '')).toBeLessThan(1);
    expect(w([4], 'Good')).toBeGreaterThan(1);
    expect(w([3, 3], 'Arrr!')).toBe(3);
    expect(w([3, 3, 3], 'Bingo!')).toBe(8);
    expect(w([3, 3, 3, 5], 'Vegas!')).toBeGreaterThan(w([3, 3, 3, 3], 'Sea Donkey!'));
  });
  it('pumps nothing for a move that clears nothing', () => {
    expect(worth(move({}), 3)).toBe(0);
    expect(worth(move({ moved: false }), 3)).toBe(0);
  });
  it('counts a pufferfish or jellyfish for what it sets off only', () => {
    expect(worth(move({ puffer: true, cleared: 9 }), 3)).toBe(0);
    expect(worth(move({ jelly: true, cleared: 12, chain: 2 }), 3)).toBe(1);
  });
  it('counts crabs well, and more the higher the water', () => {
    expect(worth(move({ crabs: 1 }), 3)).toBe(2);
    expect(worth(move({ crabs: 1 }), 9)).toBe(6);
    expect(worth(move({ crabs: 2 }), 3)).toBe(4);
  });
});

describe('the rocks the tide leaves bare', () => {
  it('are bare only seaward of high tide\'s mark, down to the sea', () => {
    expect(rocksBare(shoreAt(MAX_WATER))).toBe(0);
    expect(rocksBare(shoreAt(MIN_WATER))).toBe(6);
    const shore = shoreAt(MIN_WATER);
    expect(onRocks(HIGH - 1, shore)).toBe(true);
    expect(onRocks(HIGH + 1, shore)).toBe(false);
    expect(onRocks(shore - 0.5, shore)).toBe(false);
  });
});

describe('powder barrels', () => {
  it('come with two lines at once or better', () => {
    expect(barrelsFor(move({ lines: [5], combo: 'Great' }))).toBe(0);
    expect(barrelsFor(move({ lines: [3, 3], combo: 'Arrr!' }))).toBe(1);
    expect(barrelsFor(move({ lines: [3, 3, 3], combo: 'Bingo!' }))).toBe(2);
    expect(barrelsFor(move({ lines: [3, 3, 3, 3], combo: 'Sea Donkey!' }))).toBe(3);
  });
  it('knock down the raiders close by when they go off', () => {
    const rs = [{ x: 0, z: 0 }, { x: 2, z: 0 }, { x: 0, z: 3 }];
    expect(blastHits({ x: 0, z: 0 }, rs)).toEqual([rs[0], rs[1]]);
  });
});

describe('the special pieces come in as the raids go on', () => {
  it('none at first, then pufferfish, crabs and jellyfish', () => {
    expect(oddsFor(0)).toEqual({ puffer: 0, crab: 0, jelly: 0 });
    expect(oddsFor(2).puffer).toBeGreaterThan(0);
    expect(oddsFor(2).crab).toBe(0);
    expect(oddsFor(3).crab).toBeGreaterThan(0);
    expect(oddsFor(4).jelly).toBeGreaterThan(0);
  });
});
