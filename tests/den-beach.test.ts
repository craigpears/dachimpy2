/* The landing along the den's beach (10 Nov). */
import { describe, expect, it } from 'vitest';
import { BEACH, canLand, onLanding } from '../src/den-beach';
import { SAIL, Sea, Helm } from '../src/den-sail';

const clearSea = () => { const s = new Sea(1, false); s.rocks.clear(); return s; };
const run = (h: Helm, secs: number, step = 0.05) => { for (let t = 0; t < secs; t += step) h.tick(step); };

describe('"how to get back to shore is not very obvious ... you get to the general vicinity, not one specific square" (10 Nov)', () => {
  it('counts a whole stretch of water along the beach, her mooring among it', () => {
    const L = BEACH.LANDING;
    expect(onLanding(SAIL.HOME.c, SAIL.HOME.r)).toBe(true);
    expect(L.c1 - L.c0 + 1).toBeGreaterThanOrEqual(6);
    expect(L.rows).toBeGreaterThanOrEqual(2);
    for (let c = L.c0; c <= L.c1; c++) for (let r = 0; r < L.rows; r++) expect(onLanding(c, r)).toBe(true);
    expect(onLanding(L.c0 - 1, 0)).toBe(false);
    expect(onLanding(L.c1 + 1, 0)).toBe(false);
    expect(onLanding(SAIL.HOME.c, L.rows)).toBe(false);
  });

  it('is open water along the shore, whatever the sea', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = new Sea(seed);
      for (let c = BEACH.LANDING.c0; c <= BEACH.LANDING.c1; c++) expect(s.open(c, 0)).toBe(true);
    }
  });

  it('lets you ashore from any square of it, stopped or under way, and brings her in to her mooring', () => {
    const h = new Helm(clearSea(), { c: BEACH.LANDING.c1, r: 1, d: 0 });
    expect(canLand(h)).toBe(true);
    h.drop(BEACH.LANDING.c1, 8);
    run(h, SAIL.WAKE + 0.2);
    expect(h.slot).toBeGreaterThanOrEqual(0);
    expect(canLand(h)).toBe(true);
    h.moor();
    expect(h.pose).toEqual(SAIL.HOME);
    expect(h.idle()).toBe(true);
    expect(h.pin).toBeNull();
  });

  it('but not from further out, nor with a hole in her deck', () => {
    const out = new Helm(clearSea(), { c: SAIL.HOME.c, r: BEACH.LANDING.rows, d: 0 });
    expect(canLand(out)).toBe(false);
    const holed = new Helm(clearSea());
    holed.hit();
    expect(canLand(holed)).toBe(false);
  });
});
