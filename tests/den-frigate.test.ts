/* Primates Rule, the user's war frigate (src/den-frigate.ts), sized against the sloop by YPPedia's
   numbers (src/ships.ts). RULES.md, "Ships, physically proportional, by YPPedia's numbers" and
   "Primates Rule, as Puzzle Pirates drew her". */
import { describe, expect, it } from 'vitest';
import { SLOOP, WAR_FRIGATE, SLOOP_HULL, SLOOP_SAIL, hullVolume, halfBeam, sailArea } from '../src/ships';
import { WAR_FRIGATE_PLAN as P, PRIMATES_RULE as PR, FRIGATE_HULL, deckGuns, portXs, onDeck, deckAt, insideAt } from '../src/den-frigate';

describe('"I want everything physically proportional" (11 Nov): the war frigate beside the sloop', () => {
  it('holds sixteen times the sloop, as her hold does by YPPedia', () => {
    expect(WAR_FRIGATE.holdLitres / SLOOP.holdLitres).toBe(16);
    expect(hullVolume(FRIGATE_HULL) / hullVolume(SLOOP_HULL)).toBeCloseTo(16, 6);
  });

  it('is longer, beamier and higher-sided than the sloop, her pirates the same size', () => {
    expect(FRIGATE_HULL.len / SLOOP_HULL.len).toBeCloseTo(3.4);
    expect(FRIGATE_HULL.beam / SLOOP_HULL.beam).toBeCloseTo(2);
    // Two rows of ports between the water and her main deck, with room for a pirate between decks.
    expect(FRIGATE_HULL.deck).toBeGreaterThan(1.6);
    expect(P.ports.rows[1] + P.ports.size / 2).toBeLessThan(P.stripes.at[1] - P.stripes.h / 2);
    expect(P.ports.rows[0] + P.ports.size / 2).toBeLessThan(P.stripes.at[0] - P.stripes.h / 2);
  });

  it('carries her sail cloth: her sails about 5⅓ times the sloop\'s, on three masts', () => {
    const area = P.masts.flatMap((m) => m.sails).reduce((a, [w, h]) => a + w * h, 0);
    expect(P.masts).toHaveLength(3);
    expect(area / SLOOP_SAIL).toBeGreaterThan(sailArea(WAR_FRIGATE) / SLOOP_SAIL * 0.95);
    expect(area / SLOOP_SAIL).toBeLessThan(sailArea(WAR_FRIGATE) / SLOOP_SAIL * 1.05);
  });

  it('has her 24 guns: 12 on the main deck, 6 a side, and 12 below behind the upper ports', () => {
    const guns = deckGuns(P, PR.guns);
    expect(guns).toHaveLength(WAR_FRIGATE.mainDeckGuns);
    expect(guns.filter((g) => g.side === 'port')).toHaveLength(6);
    const [upper] = portXs(P);
    expect(guns.length + upper.length * 2).toBe(WAR_FRIGATE.guns);
    for (const g of guns) expect(Math.abs(g.z)).toBeLessThan(halfBeam(P.hull, g.x));
  });
});

describe('Primates Rule\'s deck, "relatively close" to her picture (11 Nov)', () => {
  const all = onDeck(P, PR);

  it('has what the user asked for: the skeleton cannons, gibbets and the skeleton furniture', () => {
    expect(PR.gunKind).toBe('skeletalCannon');
    for (const kind of ['gibbet', 'skeletonChair', 'armour', 'grandPiano', 'anchorChair', 'table', 'jar']) expect(PR.furniture.some((f) => f.kind === kind)).toBe(true);
    expect(PR.furniture.some((f) => f.kind === 'skeletonChair' && f.opts?.sitter)).toBe(true);   // (a skeleton in a chair)
    expect(PR.name).toBe('Primates Rule');   // (no apostrophe: the user, 11 Nov)
  });

  it('keeps everything on her deck, inside her bulwarks', () => {
    for (const o of all) {
      if (o.what === 'skeletalCannon' || o.what === 'stairs') continue;   // (a gun's muzzle's out over her side; the stairs run up against it)
      expect(Math.abs(o.z) + o.r * 0.8, `${o.what} at ${o.x}, ${o.z}`).toBeLessThanOrEqual(insideAt(P, o.x));
      expect(o.x - o.r * 0.8, `${o.what} at ${o.x}`).toBeGreaterThan(-P.hull.len / 2 + P.bulwark.t);
    }
  });

  it('keeps nothing in anything else\'s way, nor across a deck\'s edge', () => {
    for (const [i, a] of all.entries()) for (const b of all.slice(i + 1)) {
      if (a.deck !== b.deck) continue;
      expect(Math.hypot(a.x - b.x, a.z - b.z), `${a.what} (${a.x}, ${a.z}) and ${b.what} (${b.x}, ${b.z})`).toBeGreaterThanOrEqual(a.r + b.r - 0.05);
    }
    for (const o of all.filter((o) => !['stairs'].includes(o.what))) {
      expect(Math.abs(o.x - P.quarter.to), `${o.what} at ${o.x}`).toBeGreaterThan(o.r * 0.7);
      expect(Math.abs(o.x - P.fore.from), `${o.what} at ${o.x}`).toBeGreaterThan(o.r * 0.7);
    }
  });

  it('puts the wheel and a mast on the quarterdeck, the main mast in the waist, the foremast on the forecastle', () => {
    expect(deckAt(P, P.helm.x)).toBe('quarter');
    expect(P.masts.map((m) => deckAt(P, m.x))).toEqual(['fore', 'waist', 'quarter']);
  });
});
