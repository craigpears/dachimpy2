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
  // The wall in two courses: a high hole over a low one each side of the gate (column 12), the
  // courses split at row 5.5.
  const split: [number, number] = [5.5, 12];
  const holes: Pt[] = [[3, 5], [8, 5], [3, 20], [8, 20]];
  it(`Q, W, A and S go to the real puzzle's four holes, wherever the piece is (9 Nov: "Try with 2 wall courses")`, () => {
    for (const at of [[3, 5], [8, 20], [5, 13]] as Pt[]) {
      expect(nextHole(holes, at, 'ul', null, split)).toBe(0);
      expect(nextHole(holes, at, 'dl', null, split)).toBe(1);
      expect(nextHole(holes, at, 'ur', null, split)).toBe(2);
      expect(nextHole(holes, at, 'dr', null, split)).toBe(3);
    }
  });
  it('goes straight up and down a side, low hole to high hole', () => {
    expect(nextHole(holes, [8, 5], 'ul', 1, split)).toBe(0);
    expect(nextHole(holes, [3, 20], 'dr', 2, split)).toBe(3);
  });
  it(`never back to the hole the piece is at (9 Nov: "it isn't jumping")`, () => {
    expect(nextHole(holes, [3, 5.5], 'ul', 0, split)).toBeNull();
  });
  it('goes on round a cannon breach in the same corner, nearest first', () => {
    const more: Pt[] = [...holes, [2, 9]];
    expect(nextHole(more, [3, 5], 'ul', 0, split)).toBe(4);
    expect(nextHole(more, [2, 9], 'ul', 4, split)).toBe(0);
  });
  it('a corner with no hole: the nearest on that side', () => {
    expect(nextHole([[8, 5], [3, 20]], [3, 20], 'ul', 1, split)).toBe(0);
    expect(nextHole([[8, 5]], [8, 5], 'ur', 0, split)).toBeNull();
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
