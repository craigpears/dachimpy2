/* Gunnery, the puzzle itself (src/gunnery.ts): the one copy, played on the gun tower and on her deck. */
import { describe, expect, it } from 'vitest';
import { GUNNERY, Gunnery, gunSq, gunMouth, k, loadWith, type Store } from '../src/gunnery';

/** A seeded dice, so a test's board comes out the same every time. */
const dice = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
/** An empty board (no crates), its barrel quiet: stores only where a test puts them. */
const quiet = () => { const g = new Gunnery(null, dice(3)); g.emitT = 1e9; return g; };

describe('loading a gun', () => {
  it('powder, then the wad, then the shot: loaded', () => {
    expect(loadWith('empty', 'powder')).toBe('powder');
    expect(loadWith('powder', 'wad')).toBe('wad');
    expect(loadWith('wad', 'shot')).toBe('loaded');
  });

  it('the wrong store fouls it, and a bucket swabs a fouled or fired gun out', () => {
    expect(loadWith('empty', 'shot')).toBe('fouled');
    expect(loadWith('powder', 'powder')).toBe('fouled');
    expect(loadWith('fouled', 'powder')).toBe('fouled');
    expect(loadWith('dirty', 'powder')).toBe('fouled');
    expect(loadWith('fouled', 'bucket')).toBe('empty');
    expect(loadWith('dirty', 'bucket')).toBe('empty');
    expect(loadWith('wad', 'bucket')).toBe('empty');
  });

  it('a loaded gun takes nothing more', () => {
    for (const s of ['powder', 'wad', 'shot', 'bucket'] as Store[]) expect(loadWith('loaded', s)).toBe('loaded');
  });
});

describe('the board', () => {
  it('13 by 13, the barrel in the middle, four guns two down each side, muzzle out', () => {
    const g = new Gunnery();
    expect(g.cells.size).toBe(169);
    expect(g.barrel).toEqual([6, 6]);
    expect(g.guns.map((x) => [x.port, x.d])).toEqual(GUNNERY.GUNS.map((x) => [x.port, x.d]));
    // Each lies on the three squares in from its lane.
    expect([1, 2, 3].map((i) => gunSq(g.guns[0], i))).toEqual([[3, 1], [3, 2], [3, 3]]);
    expect(g.gunSet.size).toBe(12);
  });

  it('a gun tower cut short at its corners keeps its barrel on the deck', () => {
    const cells = [...new Gunnery().cells].filter((s) => !['12,0', '12,1', '12,11', '12,12'].includes(s));
    const g = new Gunnery(cells);
    expect(g.cells.size).toBe(165);
    expect(g.cells.has(k(...g.barrel))).toBe(true);
  });

  it('the crates: none round the barrel, none on a gun or its lane, never side by side, all of it joined up', () => {
    const g = new Gunnery(null, dice(7));
    g.setCrates(g.pickCrates());
    expect(g.crates.length).toBeGreaterThan(8);
    for (const [r, c] of g.crates) {
      expect(Math.max(Math.abs(r - 6), Math.abs(c - 6))).toBeGreaterThan(2);
      for (const gun of g.guns) for (let i = 0; i <= 4; i++) expect(k(...gunSq(gun, i))).not.toBe(k(r, c));
      for (const [dr, dc] of [[0, 1], [1, 0]]) expect(g.crateSet.has(k(r + dr, c + dc))).toBe(false);
    }
    // About two guns sit on a loop of their own (as on a good Gunnery board).
    const loops = g.loopsOf().filter((l) => l.len <= 30);
    const onLoop = g.guns.filter((x) => loops.some((l) => l.cells.has(k(...gunSq(x, 0))))).length;
    expect(onLoop).toBeGreaterThanOrEqual(1);
  });
});

describe('the stores', () => {
  it('the barrel rolls them out each way round in turn, till there are two of each on deck', () => {
    const g = new Gunnery(null, dice(1));
    const ways: number[] = [];
    for (let i = 0; i < 200; i++) for (const s of g.tick().added) ways.push(s.dir);
    expect(ways.slice(0, 4)).toEqual([0, 1, 2, 3]);
    for (const kd of ['powder', 'wad', 'shot', 'bucket'] as Store[]) expect(g.stores.filter((s) => s.kind === kd).length).toBe(GUNNERY.EACH);
  });

  it('a store rolls straight on; blocked, it turns right, else left, else back', () => {
    const g = quiet();
    const s = g.addStore(1, 'shot', 1, 6, 0);   // rolling north, the edge a square ahead
    g.tick();
    expect([s.r, s.c, s.dir]).toEqual([0, 6, 0]);
    g.tick();
    expect([s.r, s.c, s.dir]).toEqual([0, 7, 1]);   // the edge: right
    g.setCrates([[0, 8], [1, 7]]);
    g.tick();
    expect([s.r, s.c, s.dir]).toEqual([0, 6, 3]);   // a crate ahead, the edge to its right, a crate to its left: back
  });

  it('two that would meet both turn back', () => {
    const g = quiet();
    const a = g.addStore(1, 'shot', 6, 1, 1), b = g.addStore(2, 'wad', 6, 3, 3);
    g.tick();
    expect([a.r, a.c, a.dir, b.r, b.c, b.dir]).toEqual([6, 1, 3, 6, 3, 1]);
    expect([a.bump, b.bump]).toEqual([1, 3]);
  });

  it('a pirate standing on the deck is in the way too', () => {
    const g = quiet();
    const s = g.addStore(1, 'shot', 6, 1, 1);
    g.tick(new Set([k(6, 2)]));
    expect([s.r, s.c, s.dir]).toEqual([7, 1, 2]);
  });
});

describe('arrows', () => {
  it('a store rolling onto one turns the way it points', () => {
    const g = quiet();
    expect(g.chalk(6, 2, 2, 'me')).toBe(true);
    const s = g.addStore(1, 'shot', 6, 1, 1);
    g.tick(); g.tick();
    expect([s.r, s.c, s.dir]).toEqual([7, 2, 2]);
  });

  it('three each: chalk a fourth and your oldest is rubbed out; a crewmate\'s are their own', () => {
    const g = quiet();
    for (let i = 0; i < 4; i++) g.chalk(1, 4 + i, 1, 'me', i);
    g.chalk(2, 4, 1, 'mate', 9);
    expect(g.myArrows('me').map((a) => a.c).sort()).toEqual([5, 6, 7]);
    expect(g.myArrows('mate').length).toBe(1);
  });

  it('chalk where one is and it turns your way; the same way again rubs it out; never on a crate, gun or the barrel', () => {
    const g = quiet();
    g.chalk(1, 4, 1, 'me');
    g.chalk(1, 4, 2, 'me');
    expect(g.arrows.get(k(1, 4))?.dir).toBe(2);
    g.chalk(1, 4, 2, 'me');
    expect(g.arrows.has(k(1, 4))).toBe(false);
    g.chalk(1, 4, 0, 'me'); g.chalk(1, 4, -1, 'me');
    expect(g.arrows.size).toBe(0);
    expect(g.chalk(6, 6, 0, 'me')).toBe(false);
    expect(g.chalk(...gunSq(g.guns[0], 2), 0, 'me')).toBe(false);
  });
});

describe('the guns', () => {
  /** A store rolled along a gun's lane onto an arrow pointing into its muzzle. */
  const feed = (g: Gunnery, kind: Store, arrow = true) => {
    const gun = g.guns[0], [lr, lc] = gunSq(gun, 0);
    if (arrow && !g.arrows.has(k(lr, lc))) g.chalk(lr, lc, gunMouth(gun), 'me');
    g.stores = [];
    g.addStore(++g.seq, kind, lr - 1, lc, 2);   // rolling down the lane onto it
    const beats = [g.tick(), g.tick()];
    return beats.flatMap((b) => b.loads);
  };

  it('a store goes in only off an arrow in its lane pointing into the muzzle', () => {
    const g = quiet();
    expect(feed(g, 'powder', false)).toEqual([]);
    expect(g.guns[0].state).toBe('empty');
    const loads = feed(quiet(), 'powder');
    expect(loads.map((l) => [l.store, l.was, l.gun.state])).toEqual([['powder', 'empty', 'powder']]);
  });

  it('powder, wad, shot: loaded; then stores roll past it; fired, it wants a bucket', () => {
    const g = quiet();
    for (const kd of ['powder', 'wad', 'shot'] as Store[]) feed(g, kd);
    expect(g.guns[0].state).toBe('loaded');
    expect(feed(g, 'powder')).toEqual([]);
    g.fired(g.guns[0]);
    expect(g.guns[0].state).toBe('dirty');
    feed(g, 'bucket');
    expect(g.guns[0].state).toBe('empty');
  });

  it('a gun run out over its lane blocks it', () => {
    const g = quiet(), gun = g.guns[0];
    gun.inLane = true;
    expect(g.blocked(...gun.port)).toBe(true);
    gun.inLane = false;
    expect(g.blocked(...gun.port)).toBe(false);
  });
});
