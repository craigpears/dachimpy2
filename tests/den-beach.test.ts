/* The landing along the den's beach, and the jetty out to her (10 Nov). */
import { describe, expect, it } from 'vitest';
import { BEACH, JETTY, JETTY_AT, canLand, onLanding, onJetty, beachFloor, beachStep, canBoard, ashoreAt } from '../src/den-beach';
import { SAIL, Sea, Helm } from '../src/den-sail';
import { HIGH, LOW } from '../src/den-bilge';
const SLOOP_BEAM = 2.3;   // (her beam: js/den/sea.js)

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

/* Her, moored: broadside on along the beach, her middle at her mooring's square. */
const HOME_X = SAIL.X0 + (SAIL.HOME.c + 0.5) * SAIL.CELL, HOME_Z = SAIL.Z0 - (SAIL.HOME.r + 0.5) * SAIL.CELL;
/* Walk from (x, z) toward (tx, tz) a little at a time, as the den does, with the tide where it is. */
function walk(x: number, z: number, tx: number, tz: number, shore: number, side = 8, secs = 12): [number, number] {
  for (let t = 0; t < secs; t += 1 / 30) {
    const dx = tx - x, dz = tz - z, d = Math.hypot(dx, dz);
    if (d < 0.05) break;
    const s = Math.min(d, 5.4 / 30);
    [x, z] = beachStep(x, z, x + dx / d * s, z + dz / d * s, shore, side);
  }
  return [x, z];
}

describe('"the pier is a random pier in the middle of the water" (10 Nov)', () => {
  it("runs from dry sand, above high tide's mark, all the way out to her", () => {
    expect(JETTY_AT.z0).toBeGreaterThan(HIGH + BEACH.DRY);   // its foot's on the sand, whatever the tide
    expect(JETTY_AT.z1).toBeLessThan(LOW);                    // its end's out past the lowest tide's edge
    expect(JETTY_AT.z1).toBeLessThanOrEqual(HOME_Z + SLOOP_BEAM / 2 + 0.3);   // alongside her
    expect(Math.abs(JETTY_AT.x - HOME_X)).toBeLessThan(2.6);  // by her, just to her side
    for (let z = JETTY_AT.z0; z >= JETTY_AT.z1 + JETTY.PAD; z -= 0.25) expect(onJetty(JETTY_AT.x, z, JETTY.PAD)).toBe(true);   // one unbroken way
  });

  it('is walked out along at high tide, its boards underfoot, to her at its end', () => {
    const [x, z] = walk(JETTY_AT.x, JETTY_AT.z0 + 2, JETTY_AT.x, JETTY_AT.z1 - 3, HIGH);
    expect(z).toBeCloseTo(JETTY_AT.z1 + JETTY.PAD, 1);
    expect(x).toBeCloseTo(JETTY_AT.x, 5);
    expect(beachFloor(x, z)).toBe(JETTY.DECK);
    expect(canBoard(x, z)).toBe(true);
  });

  it("reaches out past the den's side when the den is narrow", () => {
    const side = Math.abs(JETTY_AT.x) - 0.5;
    const [x, z] = walk(0, -3, JETTY_AT.x, JETTY_AT.z1, HIGH, side);
    expect(x).toBeCloseTo(JETTY_AT.x, 1);
    expect(z).toBeCloseTo(JETTY_AT.z1 + JETTY.PAD, 1);
  });
});

describe('the jetty: you walk out along it to board her, and back along it ashore (10 Nov)', () => {
  it("stands its boards just above the water, and you're still down on the beach on them", () => {
    expect(JETTY.DECK).toBeGreaterThan(0.1);
    expect(JETTY.DECK).toBeLessThan(0.3);
    expect(beachFloor(JETTY_AT.x, (JETTY_AT.z0 + JETTY_AT.z1) / 2)).toBe(JETTY.DECK);
    expect(beachFloor(JETTY_AT.x + 3, (JETTY_AT.z0 + JETTY_AT.z1) / 2)).toBe(0);
  });

  it('never walks you off its side or its end into the sea', () => {
    for (const shore of [LOW, (LOW + HIGH) / 2, HIGH]) {
      const mid = Math.min(JETTY_AT.z1 + 1.5, shore - 1);
      for (const tx of [JETTY_AT.x - 5, JETTY_AT.x + 5]) {
        const [x, z] = walk(JETTY_AT.x, mid, tx, mid - 1, shore);
        expect(onJetty(x, z, JETTY.PAD - 1e-9)).toBe(true);
      }
      const [x, z] = walk(JETTY_AT.x, mid, JETTY_AT.x, -40, shore);
      expect(onJetty(x, z, JETTY.PAD - 1e-9)).toBe(true);
      expect(z).toBeCloseTo(JETTY_AT.z1 + JETTY.PAD, 5);
    }
  });

  it("keeps the sand as it was: down to the water's edge and no further, off the jetty", () => {
    const [, z] = walk(3, -5, 3, -30, HIGH);
    expect(z).toBeCloseTo(HIGH + BEACH.DRY, 5);
    expect(beachStep(3, HIGH, 3, HIGH - 0.1, HIGH, 8)[1]).toBeCloseTo(HIGH + BEACH.DRY, 5);   // the tide come in round you: up the beach
  });

  it('lets you board her only out at its end, not from the sand', () => {
    expect(canBoard(JETTY_AT.x, JETTY_AT.z1 + 0.5)).toBe(true);
    expect(canBoard(JETTY_AT.x, JETTY_AT.z0 - 0.5)).toBe(false);
    expect(canBoard(HOME_X, LOW + BEACH.DRY)).toBe(false);   // the sand by her at low tide
    expect(canBoard(HOME_X, HIGH + BEACH.DRY)).toBe(false);  // nor the water's edge at high tide, metres off
  });

  it('puts you ashore on its end, by her, to walk back along it to the beach', () => {
    const at = ashoreAt();
    expect(onJetty(at.x, at.z, JETTY.PAD)).toBe(true);
    expect(at.h).toBe(JETTY.DECK);
    expect(canBoard(at.x, at.z)).toBe(true);
    for (const shore of [LOW, HIGH]) {
      const [x, z] = walk(at.x, at.z, at.x, JETTY_AT.z0 + 3, shore);
      expect(z).toBeCloseTo(JETTY_AT.z0 + 3, 1);
      expect(beachFloor(x, z)).toBe(0);
    }
  });
});
