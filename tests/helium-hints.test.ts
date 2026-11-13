/* Helium's hints (src/den-helium.ts: hintFor, hintLeft, routesToFire; the user, 13 Nov). */
import { describe, expect, it } from 'vitest';
import { COLS, Distilling, WHITE, canSwapOn, neighbourOn, parseBoard } from '../src/distilling';
import type { Board } from '../src/distilling';
import { advise } from '../src/distill-bots';
import { playDrags } from '../src/distill-routines';
import { HINT_DRAGS, hintFor, hintLeft, routesToFire } from '../src/den-helium';
import { HINT, PHASE } from '../src/lines/helium';
import { seeded } from '../src/mirror-row';

const fresh = (seed = 5000) => new Distilling(seeded(seed));
const words = (s: string) => s.trim().split(/\s+/).length;

describe('a hint shows the path, not played, 13 Nov ("they can be hinting as well, so it shows you the path. Of what the next moves are they would do")', () => {
  it('draws the planner\'s own next drag or two, the same drags it would play', () => {
    for (const seed of [5000, 5001, 5002, 5003]) {
      const g = fresh(seed), before = g.cols.map((c) => [...c]);
      const h = hintFor(g), a = advise({ cols: g.cols, chain: g.chain, timeLeft: g.timeLeft() });
      expect(h.advice).toEqual(a);
      expect(h.drags.length).toBeGreaterThan(0);
      expect(h.drags.length).toBeLessThanOrEqual(HINT_DRAGS);
      // Its first drags are the advice's own, in order.
      a.drags.slice(0, HINT_DRAGS).forEach((d, i) => expect(h.drags[i]).toEqual(d));
      // Not played: the board's as it was.
      expect(g.cols).toEqual(before);
      // Every drag is legal, one after the other.
      expect(playDrags(g.cols, h.drags)).not.toBeNull();
    }
  });
  it('with a one-drag move, the second is what they\'d play next, on the board the first leaves', () => {
    const g = fresh(5000), h = hintFor(g);
    if (h.advice!.drags.length === 1 && h.drags.length === 2) {
      const after = playDrags(g.cols, [h.drags[0]])!;
      expect(h.drags[1]).toEqual(advise({ cols: after, chain: g.chain, timeLeft: g.timeLeft() }).drags[0]);
    }
  });
  it('"this is the thing I will do at this part of the game": their line names the phase and what they\'re after', () => {
    const g = fresh(5000), h = hintFor(g);
    expect(h.advice!.phase).toBe('fire');
    expect(h.says).toBe(PHASE.fire.first);
    expect(h.says).toMatch(/^First things first: the whites out of these three/);
    expect(h.note).toMatch(/^Clear the fire's side/);
  });
  it('follows you along the drags as you play them, and goes once you\'ve done something else', () => {
    const g = fresh(5000), h = hintFor(g);
    expect(hintLeft(h, g.cols)).toEqual(h.drags);
    const one = playDrags(g.cols, [h.drags[0]])!;
    expect(hintLeft(h, one)).toEqual(h.drags.slice(1));
    expect(hintLeft(h, playDrags(g.cols, h.drags)!)).toEqual([]);
    // Something else: any other legal swap.
    const other = g.cols.map((c) => [...c]);
    outer: for (let x = 0; x < COLS; x++) for (let y = 0; y < other[x].length; y++) {
      const n = neighbourOn(other, x, y, 0);
      if (n && canSwapOn(other, x, y, n[0], n[1]) && !(x === h.drags[0].x && y === h.drags[0].y)) {
        const t = other[x][y]; other[x][y] = other[n[0]][n[1]]; other[n[0]][n[1]] = t;
        if (JSON.stringify(other) !== JSON.stringify(one)) break outer;
      }
    }
    expect(hintLeft(h, other)).toEqual([]);
  });
});

describe('arrows into a white\'s place by the fire, 13 Nov ("maybe it should show some arrows of nearby routes of pieces that can be dragged into the spots")', () => {
  // A white low in the furnace's column, junk all round it on the right, whites on the left.
  const cols = (): Board => parseBoard(['wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwbKbKwww', 'KKKKbbbb', 'KKKKbbbbb', 'KKKKbwbb']);
  it('each route is a junk piece\'s drag that takes the white\'s place, and the white goes out left', () => {
    const b = cols(), routes = routesToFire(b);
    expect(routes.length).toBeGreaterThan(1);
    const from = new Set(routes.map((d) => `${d.x},${d.y}`));
    expect(from.size).toBe(routes.length);   // (a different piece each)
    for (const d of routes) {
      expect(b[d.x][d.y]).not.toBe(WHITE);
      const after = playDrags(b, [d])!;
      expect(after[COLS - 1].filter((p) => p === WHITE).length).toBe(0);
    }
  });
  it('nothing when the furnace\'s column has no white', () => {
    expect(routesToFire(parseBoard(['wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwbKbKwww', 'KKKKbbbb', 'KKKKbbbbb', 'KKKKbbbb']))).toEqual([]);
  });
  it('the bar says what the blue arrows are', () => {
    expect(HINT.routes).toMatch(/Blue arrows/);
  });
});

describe('their new lines, 13 Nov', () => {
  const lines = (): string[] => [...Object.values(PHASE).flatMap((p) => [p.first, p.again]), ...Object.values(HINT)];
  it('are short enough for a phone bubble', () => {
    for (const l of lines()) { expect(l.length, l).toBeLessThanOrEqual(90); expect(words(l), l).toBeLessThanOrEqual(16); }
  });
  it('keep Helium "they": no he or she', () => {
    for (const l of lines()) expect(l, l).not.toMatch(/\b(he|she|him|her|his)\b/i);
  });
});
