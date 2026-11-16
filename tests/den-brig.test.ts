/* A war brig's plan and the blockade's two brigs (src/den-brig.ts), built by js/den/frigate.js as a war frigate is. The
   user, 15 Nov: "work on like the equivalent of war brigs ... things that can launch smaller ships like little sloops
   and Atlantis creatures." */
import { describe, expect, it } from 'vitest';
import { SLOOP, WAR_BRIG, SLOOP_HULL, hullVolume } from '../src/ships';
import { FOOT, onDeck, insideAt, deckY } from '../src/den-frigate';
import { WAR_BRIG_PLAN as P, BRIG_HULL, BRIGS, TIDECALLER, GRAVE_LANTERN } from '../src/den-brig';
import { BRIG_HANDLING } from '../src/ship-handling';
import { SAIL } from '../src/den-sail';

describe('a war brig, in proportion to the sloop (11 Nov: "I want everything physically proportional")', () => {
  it('holds what her hold does against the sloop\'s, twice the sloop\'s length: two squares long and one wide on the board', () => {
    expect(hullVolume(BRIG_HULL) / hullVolume(SLOOP_HULL)).toBeCloseTo(WAR_BRIG.holdLitres / SLOOP.holdLitres, 6);
    expect(BRIG_HULL.len / SLOOP_HULL.len).toBeCloseTo(2);
    expect([BRIG_HANDLING.long, BRIG_HANDLING.wide]).toEqual([2, 1]);
    expect(BRIG_HULL.beam).toBeLessThanOrEqual(SAIL.CELL);
  });
  it('YPPedia\'s guns: 16 medium, two shots a side', () => {
    expect([WAR_BRIG.guns, WAR_BRIG.gunSize, WAR_BRIG.shotsPerSide]).toEqual([16, 'medium', 2]);
    // (her main deck's 8, 4 a side)
    expect(TIDECALLER.guns.length * 2).toBe(WAR_BRIG.mainDeckGuns);
  });
  it('two masts, her decks and sails all on her, her ports below her deck', () => {
    expect(P.masts).toHaveLength(2);
    for (const m of P.masts) expect(Math.abs(m.x)).toBeLessThan(BRIG_HULL.len / 2 - 1);
    for (const y of P.stripes.at) expect(y).toBeLessThan(deckY(P, 'waist'));
    expect(P.ports.to).toBeLessThan(BRIG_HULL.len / 2 - 1);
    expect(P.ports.from).toBeGreaterThan(-BRIG_HULL.len / 2 + 0.5);
  });
});

describe('the blockade\'s brigs: Tidecaller the Atlantean, Grave Lantern the haunted', () => {
  it('Tidecaller sea green with a mermaid at her bow; Grave Lantern a ghost with a skull', () => {
    expect(TIDECALLER.figurehead.kind).toBe('mermaid');
    expect(GRAVE_LANTERN.figurehead.kind).toBe('skull');
    expect(GRAVE_LANTERN.ghost).toBe(true);
    expect(Object.keys(BRIGS).sort()).toEqual(['Grave Lantern', 'Pearl Diver', 'Tidecaller', "Wraith's Wake"]);
  });
  for (const f of Object.values(BRIGS)) it(`keeps ${f.name}'s deck clear: everything inside her bulwarks, nothing in anything else's way`, () => {
    const all = onDeck(P, f);
    for (const o of f.furniture) expect(FOOT[o.kind], o.kind).toBeTruthy();
    for (const o of all) {
      if (o.what === f.gunKind || o.what === 'stairs') continue;   // (a gun's muzzle's out over her side; the stairs run up against it)
      for (const x of [o.x - o.r * 0.8, o.x, o.x + o.r * 0.8]) expect(Math.abs(o.z) + o.r * 0.8, `${o.what} at ${o.x}, ${o.z}`).toBeLessThanOrEqual(insideAt(P, x));
    }
    for (const [i, a] of all.entries()) for (const b of all.slice(i + 1)) {
      if (a.deck !== b.deck) continue;
      expect(Math.hypot(a.x - b.x, a.z - b.z), `${a.what} (${a.x}, ${a.z}) and ${b.what} (${b.x}, ${b.z})`).toBeGreaterThanOrEqual(a.r + b.r - 0.05);
    }
  });
});
