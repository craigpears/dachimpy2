/* The Carpentry view's keys and jumps (9 Nov): Puzzle Pirates' own Carpentry keys, as YPPedia
   gives them, on the wall and the frames. */
import { describe, expect, it } from 'vitest';
import { KEYS, arrowStep, centreOn, clampTo, holeKey, nextBoard, nextHole, quarters } from '../src/den-carp-view';
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
  it(`W from the bottom-left hole goes to the top-right, S to the bottom-right, as in the real game; each hole shows its key (9 Nov: "I was just working in the bottom left hole, pressed up, and I ended up in the top right")`, () => {
    expect(nextHole(holes, [8, 5], KEYS.w.kind === 'jump' ? KEYS.w.corner : 'ul', 1, split)).toBe(2);
    expect(nextHole(holes, [3, 20], KEYS.s.kind === 'jump' ? KEYS.s.corner : 'ul', 2, split)).toBe(3);
    expect(holes.map((p) => holeKey(p, split))).toEqual(['Q', 'A', 'W', 'S']);
    // A cannon breach answers to its corner's key too.
    expect(holeKey([2, 9], split)).toBe('Q');
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

describe('the arrows on the wall always move the piece, never further than they must', () => {
  // The wall in two courses, 31 by 9, the gate at columns 13-16: a high hole over a low one each
  // side (as laid in a game the user played on 9 Nov).
  const wall = { H: 9, W: 31 };
  const holes = [
    { r0: 1, c0: 3, h: 3, w: 4 }, { r0: 6, c0: 3, h: 3, w: 4 },
    { r0: 1, c0: 23, h: 3, w: 3 }, { r0: 5, c0: 21, h: 4, w: 5 },
  ];
  const F = { h: 3, w: 3 };
  const go = (r: number, c: number, dr: number, dc: number, piece = F) => arrowStep(holes, { r, c }, piece, wall, dr, dc);
  it(`left and right go to the next spot, not two squares on and down to the bottom (9 Nov: "it seems to be jumping two spaces and going right to the bottom")`, () => {
    // Off the left low hole, over the gate: to the first spot touching the right low hole, same row.
    expect(go(6, 6, 0, 1)).toEqual({ r: 6, c: 19 });
    expect(go(6, 19, 0, 1)).toEqual({ r: 6, c: 20 });
    // And back: the first spot touching the left low hole, not its best fit.
    expect(go(6, 19, 0, -1)).toEqual({ r: 6, c: 6 });
  });
  it('a square at a time while the piece touches a hole, overhanging its edges', () => {
    expect(go(6, 3, 0, 1)).toEqual({ r: 6, c: 4 });
    expect(go(6, 3, 0, -1)).toEqual({ r: 6, c: 2 });
    expect(go(6, 1, 0, -1)).toEqual({ r: 6, c: 0 });
  });
  it(`never stuck: past the last hole it goes on to the wall's edge (9 Nov: "you should always be able to go left and right")`, () => {
    expect(go(6, 25, 0, 1)).toEqual({ r: 6, c: 26 });
    expect(go(6, 28, 0, 1)).toBeNull();   // the edge
    expect(go(6, 0, 0, -1)).toBeNull();
  });
  it('keeps to its course: the next high hole from a high one, not the low one under it', () => {
    expect(go(1, 6, 0, 1)).toEqual({ r: 1, c: 21 });   // the high right hole starts at 23
  });
  it('up and down: a square while over a hole, then over the stone to the hole above or below', () => {
    expect(go(6, 3, -1, 0)).toEqual({ r: 5, c: 3 });
    expect(go(4, 3, -1, 0)).toEqual({ r: 3, c: 3 });   // touching the high hole's foot
    expect(go(1, 3, -1, 0)).toEqual({ r: 0, c: 3 });
    expect(go(0, 3, -1, 0)).toBeNull();
  });
  it('never a diagonal jump: with no hole in line, a plain square on', () => {
    expect(go(0, 9, 0, 1, { h: 1, w: 2 })).toEqual({ r: 0, c: 10 });
    expect(go(6, 0, -1, 0)).toEqual({ r: 5, c: 0 });   // beside the low hole, not shifted onto it
  });
});
