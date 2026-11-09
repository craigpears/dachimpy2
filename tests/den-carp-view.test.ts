/* The Carpentry view's keys and jumps (9 Nov): Puzzle Pirates' own Carpentry keys, as YPPedia
   gives them, on the wall and the frames. */
import { describe, expect, it } from 'vitest';
import { KEYS, centreOn, clampTo, nextBoard, nextHole, quarters } from '../src/den-carp-view';
import type { Pt } from '../src/den-carp-view';

describe('the keys are the real Carpentry keys', () => {
  it('1-3 take the toolbox pieces, the arrows move, X and C turn, Z flips, Space puts it in', () => {
    expect(KEYS['1']).toEqual({ kind: 'take', i: 0 });
    expect(KEYS['3']).toEqual({ kind: 'take', i: 2 });
    expect(KEYS.arrowleft).toEqual({ kind: 'move', dr: 0, dc: -1 });
    expect(KEYS.arrowdown).toEqual({ kind: 'move', dr: 1, dc: 0 });
    expect(KEYS.x).toEqual({ kind: 'turn', dir: -1 });
    expect(KEYS.c).toEqual({ kind: 'turn', dir: 1 });
    expect(KEYS.z).toEqual({ kind: 'flip' });
    expect(KEYS[' ']).toEqual({ kind: 'place' });
  });
  it('Q, W, A and S go to the upper-left, upper-right, lower-left and lower-right holes', () => {
    expect([KEYS.q, KEYS.w, KEYS.a, KEYS.s]).toEqual(['ul', 'ur', 'dl', 'dr'].map((corner) => ({ kind: 'jump', corner })));
  });
  it('keeps D for itself, so you aren\'t walked off mid-puzzle', () => {
    expect(KEYS.d).toEqual({ kind: 'none' });
  });
});

describe('jumping between holes on the wall', () => {
  // Holes along the wall: two high, two low, left to right.
  const holes: Pt[] = [[3, 5], [8, 12], [3, 20], [8, 28]];
  it('goes to the nearest hole that way, the one on the key\'s level first', () => {
    expect(nextHole(holes, [5, 16], 'ul')).toBe(0);
    expect(nextHole(holes, [5, 16], 'dl')).toBe(1);
    expect(nextHole(holes, [5, 16], 'ur')).toBe(2);
    expect(nextHole(holes, [5, 16], 'dr')).toBe(3);
  });
  it('takes the other level if there\'s none on the key\'s level that way', () => {
    expect(nextHole(holes, [5, 24], 'ur')).toBe(3);
  });
  it('goes nowhere if there\'s no hole that way', () => {
    expect(nextHole(holes, [5, 2], 'ul')).toBeNull();
    expect(nextHole(holes, [5, 30], 'dr')).toBeNull();
  });
});

describe('on a frame, its four quarters are the holes', () => {
  const square = (r0: number, c0: number, n: number): Pt[] => Array.from({ length: n * n }, (_, i) => [r0 + Math.floor(i / n), c0 + (i % n)]);
  it('finds the middle of each quarter\'s empty squares', () => {
    const q = quarters(square(0, 0, 4));
    expect(q.ul).toEqual([1, 1]);
    expect(q.dr).toEqual([3, 3]);
  });
  it('has no quarter where it\'s all filled', () => {
    const q = quarters(square(0, 0, 2));
    expect(q.ul).toEqual([0.5, 0.5]);
    expect(quarters([]).ul).toBeNull();
  });
});

describe('moving the piece about a board', () => {
  const box = { r0: 0, c0: 0, h: 6, w: 10 };
  it('keeps it on the wall', () => {
    expect(clampTo(-3, 20, 2, 3, box, false)).toEqual([0, 7]);
  });
  it('lets it hang over a frame\'s edge, but not off it altogether', () => {
    expect(clampTo(-1, -2, 2, 3, box, true)).toEqual([-1, -2]);
    expect(clampTo(-5, 20, 2, 3, box, true)).toEqual([-1, 9]);
  });
  it('centres it over a point', () => {
    expect(centreOn([4, 6], 2, 3)).toEqual([3, 5]);
  });
});

describe('Tab goes on to the next thing being built', () => {
  it('round and round', () => {
    expect(nextBoard(['wall', 'stairs', 'walk'], 'wall')).toBe('stairs');
    expect(nextBoard(['wall', 'stairs', 'walk'], 'walk')).toBe('wall');
    expect(nextBoard(['wall'], null)).toBe('wall');
    expect(nextBoard([], null)).toBeNull();
  });
});
