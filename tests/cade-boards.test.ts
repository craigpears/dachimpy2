// The tabletop blockade's real boards (src/cade-boards.ts), from the user's own BlockadeSim's MapList.
import { describe, expect, it } from 'vitest';
import lilacGrid from './fixtures/cade-lilac.json';
import { CADE_BOARDS, cadeBoard } from '../src/cade-boards.js';
import { boardFromCraig, buoysOf, Cade, craigTile, tileAt } from '../src/cade.js';

describe('the real boards', () => {
  const ids = Object.keys(CADE_BOARDS);

  it('all 26 of the sim\'s boards are here', () => {
    expect(ids).toHaveLength(26);
  });

  it.each(ids)('%s is a blockade board: 20 by 36, three empty rows of safe zone at each end, whole whirlpools, buoys', (id) => {
    const b = cadeBoard(id);
    expect([b.w, b.h]).toEqual([20, 36]);
    for (let x = 0; x < b.w; x++) for (const y of [0, 1, 2, 33, 34, 35]) expect(tileAt(b, x, y)).toEqual({ safe: true });
    for (let x = 0; x < b.w; x++) for (let y = 3; y < 33; y++) expect(tileAt(b, x, y)!.safe).toBeUndefined();
    // Every whirlpool corner has its other three beside it.
    const off = [[0, 0], [-1, 0], [-1, -1], [0, -1]];
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      const c = tileAt(b, x, y)!.whirl;
      if (c === undefined) continue;
      const [ox, oy] = [x + off[c][0], y + off[c][1]];
      expect([0, 1, 2, 3].map((i) => tileAt(b, ox + (i === 1 || i === 2 ? 1 : 0), oy + (i >= 2 ? 1 : 0))!.whirl)).toEqual([0, 1, 2, 3]);
    }
    expect(buoysOf(b).length).toBeGreaterThanOrEqual(8);
  });

  it('Lilac is the sim\'s own grid turned a quarter clockwise, square for square', () => {
    const g = lilacGrid as number[][];
    const b = cadeBoard('Lilac1_1');
    for (let sy = 1; sy < g.length - 1; sy++) for (let sx = 1; sx < g[0].length - 1; sx++) {
      const t = craigTile(g[sy][sx]), got = tileAt(b, g.length - 2 - sy, sx - 1)!;
      expect(!!got.rock).toBe(!!t.rock);
      expect(got.buoy).toBe(t.buoy);
      expect(got.wind === undefined).toBe(t.wind === undefined);
    }
    expect(boardFromCraig(g).tiles).toEqual(b.tiles);
  });

  it('a round on a real board plays through', () => {
    let seed = 11;
    const c = new Cade(cadeBoard('Gallows16_3'), 10, () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646);
    c.add({ kind: 'warFrigate', side: 0 }); c.add({ kind: 'warBrig', side: 0 });
    c.add({ kind: 'warFrigate', side: 1 }); c.add({ kind: 'sloop', side: 1 });
    for (const s of c.ships) c.plan(s.id, { moves: ['F', 'F', null, null] });
    for (let i = 0; i < 10; i++) c.playTurn();
    expect(c.over).toBe(true);
    expect(c.ships.every((s) => s.y >= 0 && s.y < 36)).toBe(true);
  });
});
