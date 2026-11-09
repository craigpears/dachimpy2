/* The wall's Carpentry board (9 Nov): the holes in two rows, like the real puzzle, not strung out
   along the wall. */
import { describe, expect, it } from 'vitest';
import { cornerTile, layout, pieceToWall, tileAt, toBoard, toWall } from '../src/den-carp-board';
import type { Box } from '../src/den-carp-board';

// The den's opening wall: four holes along it, the gate between the second and third.
const wall: Box[] = [
  { r0: 2, c0: 3, h: 3, w: 3 },
  { r0: 1, c0: 9, h: 4, w: 4 },
  { r0: 3, c0: 30, h: 2, w: 3 },
  { r0: 2, c0: 36, h: 3, w: 5 },
];

describe('with 4 or 5 holes you see 2 rows (the user, 9 Nov)', () => {
  it('four holes make two rows of two, left to right in the order they run along the wall', () => {
    const L = layout(wall);
    expect(L.tiles.map((t) => [t.row, t.col])).toEqual([[0, 0], [1, 0], [0, 1], [1, 1]]);
  });
  it('five holes still make two rows', () => {
    const L = layout([...wall, { r0: 1, c0: 45, h: 3, w: 3 }]);
    expect(new Set(L.tiles.map((t) => t.row))).toEqual(new Set([0, 1]));
    expect(L.tiles[4]).toMatchObject({ row: 0, col: 2 });
  });
  it('one hole is just one tile', () => {
    expect(layout([wall[0]]).tiles).toEqual([expect.objectContaining({ row: 0, col: 0, R0: 0, C0: 0 })]);
  });
  it('is much narrower than the wall, so you never move a piece across every hole', () => {
    const L = layout(wall);
    expect(L.W).toBeLessThan(20);
    expect(L.W).toBeLessThan(wall[3].c0 + wall[3].w - wall[0].c0);
  });
  it('keeps each hole in the order it came, whatever order they run along the wall', () => {
    const L = layout([wall[2], wall[0]]);
    expect(L.tiles[0].c0).toBe(wall[2].c0 - 2);
    expect(L.tiles[1].col).toBe(0);
  });
  it('gives each hole two squares of stone all round, to board over', () => {
    const t = layout(wall).tiles[1];
    expect([t.H, t.W, t.r0, t.c0]).toEqual([8, 8, -1, 7]);
  });
  it("stops at the edges of the wall: no stone that isn't there", () => {
    const t = layout(wall, 2, 1, { h: 6, w: 44 }).tiles[1];
    expect([t.r0, t.H, t.c0, t.W]).toEqual([0, 6, 7, 8]);
  });
  it('never lets tiles overlap', () => {
    const L = layout([...wall, { r0: 0, c0: 45, h: 6, w: 6 }, { r0: 2, c0: 52, h: 1, w: 2 }]);
    for (const a of L.tiles) for (const b of L.tiles) {
      if (a === b) continue;
      const apart = a.R0 + a.H <= b.R0 || b.R0 + b.H <= a.R0 || a.C0 + a.W <= b.C0 || b.C0 + b.W <= a.C0;
      expect(apart).toBe(true);
    }
    for (const t of L.tiles) expect(t.R0 + t.H <= L.H && t.C0 + t.W <= L.W && t.R0 >= 0 && t.C0 >= 0).toBe(true);
  });
});

describe('what you put on the board goes into the real hole', () => {
  const L = layout(wall);
  it('maps a board square to the wall and back', () => {
    const t = L.tiles[2];
    expect(toWall(t, t.R0 + 2, t.C0 + 2)).toEqual([wall[2].r0, wall[2].c0]);
    expect(toBoard(t, wall[2].r0, wall[2].c0)).toEqual([t.R0 + 2, t.C0 + 2]);
  });
  it('a piece goes to the hole whose tile its middle is over', () => {
    const t = L.tiles[3];
    expect(pieceToWall(L, t.R0 + 2, t.C0 + 2, 2, 3)).toEqual({ tile: 3, r: wall[3].r0, c: wall[3].c0 });
  });
  it('a point between tiles counts for the nearest', () => {
    const a = L.tiles[0], b = L.tiles[2];
    expect(tileAt(L, a.R0 + 1, a.C0 + a.W + 0.2)).toBe(0);
    expect(tileAt(L, b.R0 + 1, b.C0 - 0.2)).toBe(2);
  });
});

describe('Q, W, A and S go to the holes as in the real puzzle', () => {
  const L = layout(wall);
  it('with two columns they are the four holes, from anywhere', () => {
    for (const from of [0, 1, 2, 3]) {
      expect(['ul', 'dl', 'ur', 'dr'].map((c) => cornerTile(L, from, c as 'ul'))).toEqual([0, 1, 2, 3]);
    }
  });
  it('with more columns, a column at a time', () => {
    const M = layout([...wall, { r0: 1, c0: 45, h: 3, w: 3 }, { r0: 1, c0: 50, h: 3, w: 3 }]);
    expect(cornerTile(M, 0, 'ur')).toBe(2);
    expect(cornerTile(M, 2, 'ur')).toBe(4);
    expect(cornerTile(M, 4, 'dl')).toBe(3);
  });
  it('a column with nothing in the bottom row gives its top tile', () => {
    const M = layout([...wall, { r0: 1, c0: 45, h: 3, w: 3 }]);
    expect(cornerTile(M, 3, 'dr')).toBe(4);
  });
});
