import { describe, expect, it } from 'vitest';
import { PLAN, FURNISH, OCTOPUSES, ALL, octopusAt, TOUR, stopAt, STUMP, atStump, atAltar, PACK, Fray, FRAY, PORTRAITS, type Hide } from '../src/den-jezerbell.js';
import { walkable, houseById, BACKDROPS } from '../src/den-houses.js';
import { FOUND, PACK_TAUNTS, ON_A_PICTURE } from '../src/lines/jezerbell.js';

describe("Jezerbell's house", () => {
  it('is in the housing district, by its id', () => {
    expect(houseById('jezerbell')?.owner).toBe('Jezerbell');
  });

  it('has everything in her room inside it, and you can get to the stump, the altar and every hiding place', () => {
    for (const p of FURNISH) expect(walkable(PLAN, p.x, Math.min(p.z, 3.0)) || Math.abs(p.x) > 5, p.kind).toBe(true);
    expect(walkable(PLAN, STUMP.x - 0.5, STUMP.z + 1.2)).toBe(true);
    for (const o of OCTOPUSES) expect(walkable(PLAN, o.at.x, o.at.z), o.id).toBe(true);
    for (const s of TOUR) expect(walkable(PLAN, s.at.x, s.at.z), s.id).toBe(true);
  });

  it('has a line for every octopus found, every wolf, and every portrait', () => {
    for (const o of OCTOPUSES) expect(FOUND[o.id]).toBeTruthy();
    for (const w of PACK) expect(PACK_TAUNTS[w.id as keyof typeof PACK_TAUNTS]).toBeTruthy();
    for (const p of PORTRAITS) {
      expect(ON_A_PICTURE[p.id]).toBeTruthy();
      expect(BACKDROPS).toContain(p.backdrop);
    }
  });

  it('counts the missing octopus among them all', () => {
    expect(ALL).toBe(OCTOPUSES.length + 1);
  });

  it('finds an octopus only close by, never one already found, and the nearest first', () => {
    const vase = OCTOPUSES.find((o) => o.id === 'vase')!;
    expect(octopusAt(vase.at, new Set())?.id).toBe('vase');
    expect(octopusAt(vase.at, new Set<Hide>(['vase']))?.id ?? null).not.toBe('vase');
    expect(octopusAt({ x: 0, z: 0.2 }, new Set())).toBeNull();
  });

  it('no two hiding places so close one hides the other', () => {
    for (const a of OCTOPUSES) for (const b of OCTOPUSES) {
      if (a === b) continue;
      expect(octopusAt(a.at, new Set())?.id, `${a.id} near ${b.id}`).toBe(a.id);
    }
  });

  it('offers the stump and the altar only close to them', () => {
    expect(atStump({ x: STUMP.x, z: STUMP.z + 1 })).toBe(true);
    expect(atStump({ x: 0, z: 2 })).toBe(false);
    expect(atAltar({ x: 0, z: 2 })).toBe(false);
  });

  it('walks you round her tour in order, skipping on if you walk ahead', () => {
    expect(stopAt(0, TOUR[0].at.x, TOUR[0].at.z)).toBe(0);
    expect(stopAt(0, TOUR[1].at.x, TOUR[1].at.z)).toBe(1);
    expect(stopAt(2, TOUR[0].at.x, TOUR[0].at.z)).toBe(-1);
  });
});

describe('the werewolf fray', () => {
  it('starts with the first wolf on you', () => {
    const f = new Fray();
    expect(f.start()).toEqual([{ what: 'duel', wolf: 0 }]);
    expect(f.yours).toBe(0);
  });

  it('turns the next wolf standing on you when yours is down, and is won when the last is', () => {
    const f = new Fray();
    f.start();
    for (let i = 0; i < PACK.length - 1; i++) {
      const ev = f.duelOver(true);
      expect(ev[0]).toEqual({ what: 'down', wolf: i, by: 'you' });
      expect(ev[1]).toEqual({ what: 'duel', wolf: i + 1 });
    }
    const last = f.duelOver(true);
    expect(last.at(-1)).toEqual({ what: 'over', won: true });
    expect(f.over && f.won).toBe(true);
    expect(f.left).toBe(0);
  });

  it('has her beat one of her own now and then, never the one you are dueling', () => {
    const f = new Fray();
    f.start();
    expect(f.tick(FRAY.HER_FIRST - 1)).toEqual([]);
    const ev = f.tick(1);
    expect(ev).toEqual([{ what: 'down', wolf: 1, by: 'her' }]);
    expect(f.standing[0]).toBe(true);
    expect(f.tick(FRAY.HER_EVERY)).toEqual([{ what: 'down', wolf: 2, by: 'her' }]);
  });

  it('is won by her alone if you are knocked out with few enough left, else lost', () => {
    const f = new Fray();
    f.start();
    f.tick(FRAY.HER_FIRST); f.tick(FRAY.HER_EVERY);   // (two of hers down: two left, yours among them)
    const ev = f.duelOver(false);
    expect(ev[0]).toEqual({ what: 'out' });
    expect(ev.at(-1)).toEqual({ what: 'over', won: true });

    const g = new Fray();
    g.start();
    expect(g.duelOver(false).at(-1)).toEqual({ what: 'over', won: false });
    expect(g.left).toBe(PACK.length);
  });

  it('does nothing more once it is over', () => {
    const f = new Fray();
    f.start();
    f.duelOver(false);
    expect(f.duelOver(true)).toEqual([]);
    expect(f.tick(999)).toEqual([]);
  });
});
