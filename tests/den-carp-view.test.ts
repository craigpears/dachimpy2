/* The Carpentry view's keys and jumps (9 Nov): Puzzle Pirates' own Carpentry keys, as YPPedia
   gives them, on the wall and the frames. */
import { describe, expect, it } from 'vitest';
import { KEYS, along, centreOn, clampTo, nextBoard, nextHole, quarters } from '../src/den-carp-view';
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
  it('Q goes on to the next hole left, even with the piece right of its own hole\'s middle (9 Nov: "it isn\'t jumping")', () => {
    // The piece at hole 2 (middle column 20), its own middle at column 20.5: hole 2 isn't "left".
    expect(nextHole(holes, [3, 20.5], 'ul', 2)).toBe(0);
    expect(nextHole(holes, [3, 20.5], 'dl', 2)).toBe(1);
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
  it('switching between the wall, the stairs and the walk works by keyboard both ways (9 Nov: "you should certainly be able to switch between them, including using the keyboard")', () => {
    const list = ['wall', 'walk', 'stairs'];
    expect(nextBoard(list, 'walk')).toBe('stairs');
    expect(nextBoard([...list].reverse(), 'walk')).toBe('wall');   // Shift+Tab
    expect(nextBoard([...list].reverse(), 'wall')).toBe('stairs');
  });
});

describe('the arrows along the wall skip the bare stone between holes', () => {
  // Two holes with stone round them (columns 3-10 and 12-18), then the gate, then one at 30-37.
  const zones = [{ i: 0, c0: 3, c1: 10 }, { i: 1, c0: 12, c1: 18 }, { i: 2, c0: 30, c1: 37 }];
  it('moves a square while the piece is over a hole or the stone just round it', () => {
    expect(along(zones, 5, 2, 1)).toBe('step');
    expect(along(zones, 4, 2, -1)).toBe('step');
  });
  it('a piece that would only cover bare stone jumps on to the next hole instead of being blocked (9 Nov: "it just blocks me instead of skipping over it")', () => {
    expect(along(zones, 17, 2, 1)).toBe(2);   // (over the gate next)
    expect(along(zones, 28, 3, -1)).toBe(1);
  });
  it('jumps even a narrow strip of stone between two holes', () => {
    expect(along(zones, 9, 2, 1)).toBe(1);
  });
  it('goes nowhere past the last hole', () => {
    expect(along(zones, 36, 2, 1)).toBeNull();
    expect(along(zones, 2, 2, -1)).toBeNull();
  });
});
