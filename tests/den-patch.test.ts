/* A hole in her deck, patched by Carpentry (src/den-patch.ts). The user, 9 Nov, of bilging her out
   after a hit: "one fix and it was done", and "I've been hit by a cannonball, not water bucket". */
import { describe, expect, it } from 'vitest';
import { carp, hole } from './helpers';
import { DeckHole, PATCH, alongDeck } from '../src/den-patch';
import type { Cell } from '../src/engine';

const at = (cells: Cell[]): [number, number] => [Math.min(...cells.map((p) => p[0])), Math.min(...cells.map((p) => p[1]))];
const norm = (cells: Cell[]): Cell[] => { const [r0, c0] = at(cells); return cells.map(([r, c]): Cell => [r - r0, c - c0]); };
// An I lying flat, and stood up.
const flatI: Cell[] = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], upI: Cell[] = flatI.map(([r, c]): Cell => [c, r]);

describe('a hole in her deck', () => {
  it('lies along her, longer than it\'s wide, at the top left', () => {
    const laid = alongDeck(hole('..#####', '..#####', '.....##').map(([r, c]): Cell => [r + 3, c]));
    const h = Math.max(...laid.map((p) => p[0])) + 1, w = Math.max(...laid.map((p) => p[1])) + 1;
    expect(h).toBeGreaterThanOrEqual(w);
    expect(at(laid)).toEqual([0, 0]);
    expect(laid.length).toBe(12);
  });

  it('is patched once every square of it is filled, a piece at a time', () => {
    for (let seed = 1; seed <= 10; seed++) {
      carp.useSeed(seed);
      const d = new DeckHole(carp.genHole(PATCH.PIECES).hole);
      const tiling = carp.solve(d.cells, 1)[0];
      tiling.forEach((p, i) => {
        expect(d.done()).toBe(false);
        expect(d.put(p.letter, norm(p.cells), ...at(p.cells))).toBe(true);
        expect(d.open().length).toBe(d.cells.length - 5 * (i + 1));
      });
      expect(d.done()).toBe(true);
      expect(d.over()).toBe(0);
    }
    carp.useSeed(null);
  });

  it('a piece must cover an open square of the hole, and nothing already in it', () => {
    const d = new DeckHole(hole('##', '##', '##', '##', '##'));
    const I = upI;
    expect(d.fit(I, 0, 0)).toEqual({ r: 0, c: 0, over: 0 });
    expect(d.put('I', I, 0, 0)).toBe(true);
    expect(d.fit(I, 0, 0)).toBeNull();   // that's wood now
    expect(d.fit(I, 0, -1)).toBeNull();   // only deck
    expect(d.fit(I, 0, 1)).toEqual({ r: 0, c: 1, over: 0 });
  });

  it('a piece may rest on the deck round the hole (boarding it over), but not off the board', () => {
    const d = new DeckHole(hole('###', '###', '###', '###', '###'));
    const I = flatI;   // five wide; the hole's three wide
    expect(d.fit(I, 0, -1)).toEqual({ r: 0, c: -1, over: 2 });
    expect(d.fit(I, 0, -2)).toBeNull();   // past the deck round it
    expect(d.board).toEqual({ r0: -PATCH.MARGIN, c0: -PATCH.MARGIN, h: 5 + 2 * PATCH.MARGIN, w: 3 + 2 * PATCH.MARGIN });
    d.put('I', I, 0, -1);
    expect(d.over()).toBe(2);
    expect(d.fits(I).every((s) => d.fit(I, s.r, s.c))).toBe(true);
  });

  it('the last piece can be taken back out to try again, till it\'s patched', () => {
    const d = new DeckHole(hole('##', '##', '##', '##', '##'));
    const I = upI;
    d.put('I', I, 0, 0);
    expect(d.takeBack()?.letter).toBe('I');
    expect(d.open().length).toBe(10);
    d.put('I', I, 0, 0); d.put('I', I, 0, 1);
    expect(d.done()).toBe(true);
    expect(d.takeBack()).toBeUndefined();
  });
});
