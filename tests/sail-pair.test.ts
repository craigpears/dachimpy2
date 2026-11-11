/* The Sailing pair steered live as it falls (src/sail-pair.ts): its steps are moves()'s, so where it
   comes to rest is a place moves() has, and it's dropped there. */
import { describe, expect, it } from 'vitest';
import { H, SPAWN, Sailing, W, type Piece, type Platform } from '../src/sailing';
import { FALL, SailPair } from '../src/sail-pair';

/** An empty board (no platforms) with the pair `pair` coming in, and a dice that deals 0s after. */
function game(pair: [number, number] = [0, 1], platforms: Platform[] = [], fill: [number, number, number][] = []): Sailing {
  const s = new Sailing(() => 0, false);
  const grid: (Piece | null)[][] = Array.from({ length: H }, () => Array<Piece | null>(W).fill(null));
  fill.forEach(([r, c, colour], i) => { grid[r][c] = { id: 900 + i, c: colour }; });
  s.lay(grid, platforms);
  s.pair = pair;
  return s;
}

describe('the falling pair', () => {
  it('comes in at the top of the middle columns, turned 0', () => {
    const p = new SailPair(game());
    expect(p.cells()).toEqual([[0, SPAWN[0], 0], [0, SPAWN[1], 1]]);
  });
  it('slides till the wall, and turns about its first square', () => {
    const p = new SailPair(game());
    for (let i = 0; i < 9; i++) p.slide(1);
    expect(p.col).toBe(W - 2);
    expect(p.turnBy(1)).toBe(true);
    expect(p.cells()).toEqual([[0, W - 2, 0], [1, W - 2, 1]]);
    expect(p.slide(1)).toBe(true);   // (upright, it fits in the last column)
    expect(p.turnBy(1)).toBe(false);   // (turned 2 it'd stick out past the wall: no kick)
  });
  it('falls a row every FALL.SECS, and lands where it can\'t sink', () => {
    const s = game(), p = new SailPair(s);
    expect(p.tick(FALL.SECS * 0.5)).toBeNull();
    expect(p.row).toBe(0);
    expect(p.tick(FALL.SECS * 0.6)).toBeNull();
    expect(p.row).toBe(1);
    let res = null;
    for (let i = 0; i < 40 && !res; i++) res = p.tick(FALL.SECS);
    expect(res?.dropped).toBe(true);
    expect(s.grid[H - 1][SPAWN[0]]?.c).toBe(0);
    expect(s.grid[H - 1][SPAWN[1]]?.c).toBe(1);
    expect(p.row).toBe(0);   // (the next pair in at the top)
  });
  it('a hard drop lands it straight down, the same as Sailing.drop down that column', () => {
    const a = game(), b = game(), p = new SailPair(a);
    p.slide(-1); p.turnBy(1);
    const got = p.slam(), want = b.drop(SPAWN[0] - 1, 1);
    expect(got.dropped).toBe(true);
    expect(a.snap().map((r) => r.map((x) => x?.c ?? null))).toEqual(b.snap().map((r) => r.map((x) => x?.c ?? null)));
    expect(got.steps).toBe(want.steps);
  });
  it('can be slid in under a ledge as it falls, and lands there', () => {
    // A platform's shelf over columns 0-2 at row 10; the pair slid under it from column 3.
    const plat: Platform = { id: 1, r: 10, c: 0, w: 3, h: 1, targets: [{ r: 10, c: 0, colour: 2 }] };
    const s = game([0, 1], [plat]), p = new SailPair(s);
    p.turnBy(1);   // (upright in column 3)
    while (p.row < 13) p.tick(FALL.SECS);
    expect(p.slide(-1)).toBe(true);
    expect(p.col).toBe(2);
    const res = p.slam();
    expect(res.dropped).toBe(true);
    expect(s.grid[H - 2][2]?.c).toBe(0);
    expect(s.grid[H - 1][2]?.c).toBe(1);
  });
  it('a pair of one colour lands turned 2 as well as 0', () => {
    const s = game([2, 2]), p = new SailPair(s);
    p.turnBy(1); p.turnBy(1);
    expect(p.turn).toBe(2);
    expect(p.slam().dropped).toBe(true);
    expect(s.grid[H - 1][SPAWN[0]]?.c).toBe(2);
  });
  it('the shadow shows where a hard drop would land', () => {
    const p = new SailPair(game([0, 1], [], [[H - 1, SPAWN[0], 2]]));
    expect(p.rest()).toBe(H - 2);
    expect(p.row).toBe(0);
  });
});

describe('moves() and a pair of one colour (bug, 11 Nov)', () => {
  it('gives each place once, as turn 0 or 1, even one only reached turned 2 or 3', () => {
    const s = game([1, 1]);
    const ms = s.moves();
    expect(ms.every((m) => m.turn < 2)).toBe(true);
    expect(new Set(ms.map((m) => `${m.row},${m.col},${m.turn}`)).size).toBe(ms.length);
  });
});
