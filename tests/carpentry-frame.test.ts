/* Carpentry's frame, the one implementation of it (src/carpentry-frame.ts): the den's frames, the
   hole in her deck and the crane's frames all play it. The user, 10 Nov: "there should be one
   modular mechanic. So the idea that you can pick up a piece like that you've just placed should be
   in that core module." */
import { describe, expect, it } from 'vitest';
import { carp, hole } from './helpers';
import { CarpentryFrame, held } from '../src/carpentry-frame';
import type { Cell } from '../src/engine';

const flatI: Cell[] = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], upI: Cell[] = flatI.map(([r, c]): Cell => [c, r]);
const at = (cells: Cell[]): [number, number] => [Math.min(...cells.map((p) => p[0])), Math.min(...cells.map((p) => p[1]))];
const norm = (cells: Cell[]): Cell[] => { const [r0, c0] = at(cells); return cells.map(([r, c]): Cell => [r - r0, c - c0]); };
const sorted = (cells: Cell[]) => cells.map(String).sort();

describe("Carpentry's frame", () => {
  it('takes a piece over at least one empty square, clear of the pieces in it', () => {
    const f = new CarpentryFrame(hole('#####', '#####'));
    expect(f.put('I', flatI, 0, 0)).toBe(true);
    expect(f.fit(flatI, 0, 0)).toBeNull();
    expect(f.fit(flatI, 1, 0)).toEqual({ r: 1, c: 0, over: 0 });
    expect(f.fit(flatI, 2, 0)).toBeNull();   // nothing of the frame under it
  });

  it('lets a piece stick out as far as its margin, or any way without one', () => {
    const tight = new CarpentryFrame(hole('###', '###', '###', '###', '###'), { margin: 1 });
    expect(tight.fit(flatI, 0, -1)).toEqual({ r: 0, c: -1, over: 2 });
    expect(tight.fit(flatI, 0, -2)).toBeNull();
    expect(tight.board).toEqual({ r0: -1, c0: -1, h: 7, w: 5 });
    const free = new CarpentryFrame(hole('#'));
    expect(free.fit(flatI, 0, -4)).toEqual({ r: 0, c: -4, over: 4 });
    expect(free.board).toEqual({ r0: 0, c0: 0, h: 1, w: 1 });
  });

  it('keeps a piece off any square its place forbids', () => {
    const f = new CarpentryFrame(hole('#####', '#####'), { allow: (r) => r >= 0 });
    expect(f.fit(upI, -4, 0)).toBeNull();
    expect(f.fit(upI, 0, 0)).toEqual({ r: 0, c: 0, over: 3 });
  });

  it('finds every spot a piece goes, each one a fit', () => {
    const f = new CarpentryFrame(hole('#####', '#####'), { margin: 2 });
    const all = f.fits(upI);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((s) => f.fit(upI, s.r, s.c))).toBe(true);
    expect(all).toContainEqual({ r: -2, c: 0, over: 3 });
  });

  it('lifts a piece out of the middle: its squares freed, the others untouched (10 Nov)', () => {
    const f = new CarpentryFrame(hole('#####', '#####', '#####', '#####'));
    f.put('I', flatI, 0, 0); f.put('I', flatI, 1, 0); f.put('I', flatI, 2, 0);
    const before = [f.laid[0], f.laid[2]].map((p) => p.cells.map(String));
    expect(f.at(1, 3)).toBe(1);
    const l = f.lift(1);
    expect(l?.cells).toEqual(flatI.map(([r, c]) => [r + 1, c]));
    expect(sorted(f.open())).toEqual(sorted(flatI.flatMap(([r, c]): Cell[] => [[r + 1, c], [r + 3, c]])));
    expect(f.laid.map((p) => p.cells.map(String))).toEqual(before);
    expect(f.at(1, 3)).toBe(-1);
    expect(f.occupied(1, 3)).toBe(false);
    expect(f.occupied(0, 3)).toBe(true);
    // Into your hands as it lay, to fit again.
    expect(held(l!)).toEqual({ letter: 'I', cells: flatI, r: 1, c: 0 });
    expect(f.put('I', flatI, 1, 0)).toBe(true);
    expect(f.open().length).toBe(5);
  });

  it('lifts nothing once full, and Backspace takes the last one', () => {
    const f = new CarpentryFrame(hole('#####', '#####'));
    f.put('I', flatI, 0, 0);
    expect(f.lift(5)).toBeUndefined();
    expect(f.takeBack()?.cells).toEqual(flatI);
    expect(f.takeBack()).toBeUndefined();
    f.put('I', flatI, 0, 0); f.put('I', flatI, 1, 0);
    expect(f.lift(0)).toBeUndefined();
    expect(f.takeBack()).toBeUndefined();
  });

  it('saws off what sticks out, once full: Shipshape when nothing does', () => {
    const f = new CarpentryFrame(hole('###', '###'), { margin: 1 });
    f.put('I', flatI, 0, -1);
    expect(f.done()).toBe(false);
    f.put('I', flatI, 1, -1);
    expect(f.done()).toBe(true);
    expect(f.saw()).toEqual([{ kept: [1, 2, 3], cut: [0, 4] }, { kept: [1, 2, 3], cut: [0, 4] }]);
    expect(f.over()).toBe(4);
    expect(f.shipshape()).toBe(false);
    const g = new CarpentryFrame(hole('#####', '#####'));
    for (const p of carp.solve(g.open(), 1)[0]) g.put(p.letter, norm(p.cells), ...at(p.cells));
    expect(g.shipshape()).toBe(true);
    expect(g.saw().every((s) => !s.cut.length)).toBe(true);
  });

  it('lays a copy of a piece just as it is, counting what sticks out', () => {
    const f = new CarpentryFrame(hole('###'));
    expect(f.lay('I', flatI).over).toBe(2);
    expect(f.done()).toBe(true);
  });

  /* The user (10 Nov), stuck on a tiny gap in the stairs: "it should certainly be clearer what the
     boundary of the stairs are". The room drawn round a frame is every square `fit` lets a piece cover. */
  describe("the stairs' boundary isn't clear (10 Nov)", () => {
    const every = Object.values(carp.ORIENTS_BY_LETTER).flat().map((o) => o.cells);
    // The left stairs as the den builds them (js/den/land.js, openJob): a stringer four deep under
    // the treads; a piece may stick up at most a square above the tread line (carried on past the
    // foot).
    const n = 8, top = (c: number) => n - 1 - c;
    const stairs = () => {
      const cells: Cell[] = [];
      for (let c = 0; c < n; c++) for (let r = top(c); r < Math.min(n, top(c) + 4); r++) cells.push([r, c]);
      return new CarpentryFrame(cells.slice(0, cells.length - cells.length % 5), { allow: (r, c) => r >= top(c) - 1 });
    };
    // Every square some piece covers, every way up, in a spot that fits: tried square by square.
    const byHand = (f: CarpentryFrame) => {
      const out: string[] = [];
      for (let r = -8; r < n + 8; r++) for (let c = -8; c < n + 8; c++) {
        if (every.some((sh) => sh.some(([pr, pc]) => f.fit(sh, r - pr, c - pc)))) out.push(String([r, c]));
      }
      return out.sort();
    };

    it('shows just the squares a piece may cover, as it stands', () => {
      const f = stairs();
      expect(f.bounded()).toBe(true);
      expect(sorted(f.room(every))).toEqual(byHand(f));
      // Nothing more than a square above the treads: the stairs stay climbable.
      expect(f.room(every).every(([r, c]) => r >= top(c) - 1)).toBe(true);
      expect(f.room(every).some(([r, c]) => r === top(c) - 1)).toBe(true);
      expect(f.room(every).some(([r, c]) => c < 0 && r === n - 1)).toBe(true);   // (on the floor past the foot)
      // Half built (the bottom step up), still exactly what fits.
      expect(f.put('I', flatI, 7, 0)).toBe(true);
      expect(f.put('I', upI, 0, 7)).toBe(true);
      expect(sorted(f.room(every))).toEqual(byHand(f));
      expect(f.room(every).some(([r, c]) => f.occupied(r, c))).toBe(false);
    });

    it('matches the margin where there is one, and is none where a piece may stick out any way', () => {
      const f = new CarpentryFrame(hole('###', '#..', '###'), { margin: 1 });
      expect(sorted(f.room(every))).toEqual(byHand(f));
      expect(f.room(every).every(([r, c]) => r >= -1 && r <= 3 && c >= -1 && c <= 3)).toBe(true);
      expect(new CarpentryFrame(hole('#####')).bounded()).toBe(false);
    });
  });
});
