/* The wall in two courses (src/den-wall.ts). The user, 9 Nov: "Try with 2 wall courses. Let's see
   how that works": a high hole over a low one each side of the gate, like the real puzzle's four. */
import { describe, expect, it } from 'vitest';
import { carp, hole } from './helpers';
import { END, GAP, GATE, MIN_H, flat, isHigh, twoCourses } from '../src/den-wall';
import type { Cell } from '../src/den-wall';

const seeded = (seed: number) => { let a = seed; return () => (a = (a * 16807) % 2147483647) / 2147483647; };
const box = (cells: Cell[]) => {
  const rs = cells.map((p) => p[0]), cs = cells.map((p) => p[1]);
  return { r0: Math.min(...rs), r1: Math.max(...rs), c0: Math.min(...cs), c1: Math.max(...cs) };
};
// Walls as the den makes them: a one-piece, two two-piece and a three-piece hole.
const walls = Array.from({ length: 40 }, (_, i) => {
  carp.useSeed(i + 1);
  const shapes = [1, 2, 2, 3].map((n) => carp.genHole(n).hole as Cell[]);
  return { shapes, laid: twoCourses(shapes, seeded(i + 7)) };
});

describe('the wall in two courses', () => {
  it.each(walls.map((w, i) => [i, w]))('wall %i: a high hole over a low one each side of the gate', (_, { laid }) => {
    const [hl, ll, hr, lr] = laid.holes.map(box);
    expect(isHigh(laid.holes[0], laid.H) && isHigh(laid.holes[2], laid.H)).toBe(true);
    expect(isHigh(laid.holes[1], laid.H) || isHigh(laid.holes[3], laid.H)).toBe(false);
    expect(Math.max(hl.c1, ll.c1)).toBeLessThan(laid.gate.c0);
    expect(Math.min(hr.c0, lr.c0)).toBeGreaterThan(laid.gate.c1);
    // Stone between the two of a side, and under the low one for raiders to hack a doorway into.
    expect(ll.r0 - hl.r1).toBeGreaterThan(GAP);
    expect(lr.r0 - hr.r1).toBeGreaterThan(GAP);
    expect(ll.r1).toBe(laid.H - 1 - GAP);
    expect(lr.r1).toBe(laid.H - 1 - GAP);
    // The top course's capstones above, and the stairs' columns at each end, left alone.
    expect(Math.min(hl.r0, hr.r0)).toBe(1);
    expect(Math.min(hl.c0, ll.c0)).toBeGreaterThanOrEqual(END);
    expect(Math.max(hr.c1, lr.c1)).toBeLessThanOrEqual(laid.W - 1 - END);
  });
  it('room round the gate for the gun tower', () => {
    for (const { laid } of walls) {
      const left = Math.max(...laid.holes.slice(0, 2).map((h) => box(h).c1)), right = Math.min(...laid.holes.slice(2).map((h) => box(h).c0));
      expect(laid.gate.c0 - left - 1).toBeGreaterThanOrEqual(GATE.before);
      expect(right - laid.gate.c1 - 1).toBeGreaterThanOrEqual(GATE.after);
      expect(laid.gate.c1 - laid.gate.c0 + 1).toBe(GATE.w);
    }
  });
  it('half as tall again as the old wall, and not much more (holes lie on their side)', () => {
    const hs = walls.map((w) => w.laid.H);
    expect(Math.min(...hs)).toBe(MIN_H);
    expect(Math.max(...hs)).toBeLessThanOrEqual(12);
    for (const { laid } of walls) for (const h of laid.holes) { const b = box(h); expect(b.r1 - b.r0).toBeLessThanOrEqual(b.c1 - b.c0); }
  });
  it('a shorter wall than the one long row, so the view takes in all four holes', () => {
    for (const { laid } of walls) expect(laid.W * 0.55).toBeLessThan(22);
  });
  it('keeps every hole\'s shape, so it can still be filled exactly', () => {
    for (const { shapes, laid } of walls) {
      const sizes = laid.holes.map((h) => h.length).sort();
      expect(sizes).toEqual(shapes.map((s) => s.length).sort());
      for (const h of laid.holes) expect(carp.solve(h, 1).length).toBe(1);
    }
  });
  it('no two holes share a square', () => {
    for (const { laid } of walls) {
      const all = laid.holes.flat().map(([r, c]) => `${r},${c}`);
      expect(new Set(all).size).toBe(all.length);
    }
  });
});

describe('a hole lies on its side if it\'s taller than it\'s wide', () => {
  it('turns a tall one, and moves it to the top left', () => {
    expect(flat(hole('.#', '.#', '.#', '##', '..')).sort()).toEqual(hole('...#', '####').sort());
  });
  it('leaves a wide one as it is', () => {
    expect(flat(hole('###', '#..'))).toEqual(hole('###', '#..'));
  });
});

describe('which holes are high', () => {
  it('its middle above the wall\'s middle: raiders need ladders for it', () => {
    expect(isHigh([[1, 0], [3, 0]], 9)).toBe(true);
    expect(isHigh([[5, 0], [7, 0]], 9)).toBe(false);
  });
});
