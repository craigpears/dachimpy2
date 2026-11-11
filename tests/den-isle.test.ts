/* Mischievious's isle on the sloop's sea, where her wedding is (11 Nov: "on an island somewhere ...
   islands can all have their own little thing out there"). */
import { describe, expect, it } from 'vitest';
import { ISLE, isleAt, onIsleLanding, canLandIsle, isleMooring, isleShore } from '../src/den-isle';
import { SAIL, LAY, Sea, Helm, path } from '../src/den-sail';
import { onLanding } from '../src/den-beach';
import { CHART, NOTES } from '../src/den-map';

const I = LAY.ISLE;
const run = (h: Helm, secs: number, step = 0.05) => { for (let t = 0; t < secs; t += step) h.tick(step); };

describe("her isle stands out on the open sea, on the den's side of the checkpoint", () => {
  it('is land: she sails round it, never through it, whatever the sea', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = new Sea(seed);
      for (const [c, r] of I.LAND) { expect(s.open(c, r), `${c},${r}`).toBe(false); expect(s.ground(c, r)).toBe(true); }
    }
    expect(isleAt(...I.JETTY)).toBe(true);
  });

  it("is out to the right of the lanes, short of the checkpoint, on nobody else's water", () => {
    const s = new Sea(9);
    for (const [c, r] of I.LAND) {
      expect(c).toBeGreaterThanOrEqual(16); expect(c).toBeLessThan(SAIL.COLS);
      expect(r).toBeLessThan(LAY.CHECKPOINT.ROW - 2);
      expect(s.windAt(c, r)).toBeUndefined();
      expect(s.zoneAt(c, r)).toBeNull();
      expect(LAY.FAR.concat(LAY.SIDES).some(([a, b]) => a === c && b === r)).toBe(false);
    }
  });

  it('a new player can sail there from the mooring and home again, under sail, with no locks', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = new Sea(seed), M = isleMooring();
      const out = s.plot(SAIL.HOME, M.c, M.r);
      expect(out, `seed ${seed}`).not.toBeNull();
      // (never through a lock, nor up on the canal)
      let p = { ...SAIL.HOME };
      for (const m of out!) { for (const [c, r] of path(p, m).cells) expect(s.isLock(c, r) || s.level(c, r) > 0).toBe(false); p = s.sail(p, m).to; }
      expect([p.c, p.r]).toEqual([M.c, M.r]);
      expect(s.plot(M, SAIL.HOME.c, SAIL.HOME.r)).not.toBeNull();
    }
  });

  it('and a pin dropped on it lands just off it, in the water', () => {
    const s = new Sea(9), at = s.pinAt(18, 11)!;
    expect(s.open(...at)).toBe(true);
    expect(I.LAND.some(([c, r]) => Math.max(Math.abs(c - at[0]), Math.abs(r - at[1])) <= 1)).toBe(true);
  });
});

describe('going ashore off its jetty ("you get to the general vicinity, not one specific square", as at the den)', () => {
  it('counts a stretch of water off the jetty, her mooring among it, and never its land', () => {
    const M = isleMooring();
    expect(onIsleLanding(M.c, M.r)).toBe(true);
    let n = 0;
    for (let c = 0; c < SAIL.COLS; c++) for (let r = 0; r < SAIL.ROWS; r++) if (onIsleLanding(c, r)) { n++; expect(isleAt(c, r)).toBe(false); }
    expect(n).toBeGreaterThanOrEqual(10);
    // (beside the jetty, either side of it)
    expect(onIsleLanding(I.JETTY[0], I.JETTY[1] - 1)).toBe(true);
    expect(onIsleLanding(I.JETTY[0] - 1, I.JETTY[1])).toBe(true);
    // (and it's nowhere near the den's own landing)
    for (let c = 0; c < SAIL.COLS; c++) for (let r = 0; r < SAIL.ROWS; r++) if (onIsleLanding(c, r)) expect(onLanding(c, r)).toBe(false);
  });

  it('is off the lanes, and its water by the jetty is open whatever the sea (the rocks scattered off it are the sea\'s own)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = new Sea(seed);
      for (let c = 0; c < SAIL.COLS; c++) for (let r = 0; r < SAIL.ROWS; r++) if (onIsleLanding(c, r)) {
        expect(s.windAt(c, r)).toBeUndefined();
        if (c === I.MOOR.c) expect(s.open(c, r), `seed ${seed}: ${c},${r}`).toBe(true);
      }
    }
  });

  it('lets you ashore from any square of it, stopped or under way, and brings her in alongside the jetty', () => {
    const s = new Sea(9), L = I.LANDING, h = new Helm(s, { c: L.c0, r: L.r0, d: 1 });
    expect(canLandIsle(h)).toBe(true);
    h.drop(L.c0, L.r1);
    run(h, SAIL.WAKE + 0.2);
    expect(h.slot).toBeGreaterThanOrEqual(0);
    expect(canLandIsle(h)).toBe(true);
    h.moor(isleMooring());
    expect(h.pose).toEqual(I.MOOR);
    expect(h.idle()).toBe(true);
    // Moored there, she's alongside the jetty: the square next to her, toward the den, is it.
    expect(I.JETTY).toEqual([I.MOOR.c, I.MOOR.r - 1]);
  });

  it('but not from further off, nor with a hole in her deck', () => {
    const s = new Sea(9);
    expect(canLandIsle(new Helm(s, { c: 12, r: 10, d: 1 }))).toBe(false);
    expect(canLandIsle(new Helm(s))).toBe(false);   // (at home, off the den's beach)
    const holed = new Helm(s, isleMooring());
    holed.hit();
    expect(canLandIsle(holed)).toBe(false);
  });
});

describe("on the captain's map, since it's in plain sight", () => {
  it('is drawn round its land and named', () => {
    const shore = isleShore();
    expect(shore.length).toBeGreaterThanOrEqual(4);
    // Each step of the shore runs along a square's edge, with its land on one side and water on the other.
    for (let i = 0; i < shore.length; i++) {
      const [a, b] = [shore[i], shore[(i + 1) % shore.length]];
      expect(a[0] === b[0] || a[1] === b[1]).toBe(true);
    }
    expect(CHART.isle.shore).toHaveLength(shore.length);
    expect(NOTES.some((n) => n.label === ISLE.NAME)).toBe(true);
    expect(ISLE.NAME).toBe("Mischievious's isle");
  });
});
