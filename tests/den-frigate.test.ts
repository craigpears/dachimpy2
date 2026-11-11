/* Primates Rule, the user's war frigate (src/den-frigate.ts), sized against the sloop by YPPedia's
   numbers (src/ships.ts). RULES.md, "Ships, physically proportional, by YPPedia's numbers" and
   "Primates Rule, as Puzzle Pirates drew her". */
import { describe, expect, it } from 'vitest';
import { SLOOP, WAR_FRIGATE, SLOOP_HULL, SLOOP_SAIL, hullVolume, halfBeam, sailArea, widthAt, sideY, liftAt, stemX, BOX_SHAPE, SHIP_SHAPE, SHAPES, hullFor } from '../src/ships';
import { WAR_FRIGATE_PLAN as P, PRIMATES_RULE as PR, FRIGATE_HULL, deckGuns, portXs, portRows, onDeck, deckAt, deckY, insideAt } from '../src/den-frigate';

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
    const rows = portRows(P);
    expect(rows[1] + P.ports.size / 2).toBeLessThan(P.stripes.at[1] - P.stripes.h / 2);
    expect(rows[0] + P.ports.size / 2).toBeLessThan(P.stripes.at[0] - P.stripes.h / 2);
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
      // (all round it: her stern rounds in, her bow too)
      for (const x of [o.x - o.r * 0.8, o.x, o.x + o.r * 0.8]) expect(Math.abs(o.z) + o.r * 0.8, `${o.what} at ${o.x}, ${o.z}`).toBeLessThanOrEqual(insideAt(P, x));
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

describe('"the ones at the bottom are like touching the bottom line instead of being centered" (11 Nov)', () => {
  it('sits each row of ports in the middle of its band of black, the lower as the upper', () => {
    const [lower, upper] = portRows(P), half = P.stripes.h / 2;
    // The lower band: from the fine line where her paint stops up to her lower stripe.
    const lo = [P.bottom + P.line / 2, P.stripes.at[0] - half], hi = [P.stripes.at[0] + half, P.stripes.at[1] - half];
    expect(lower - lo[0]).toBeCloseTo(lo[1] - lower, 9);
    expect(upper - hi[0]).toBeCloseTo(hi[1] - upper, 9);
    // ...and clear of both lines, the port's frame and all.
    const frame = P.ports.size / 2 + 0.045;
    for (const [y, [a, b]] of [[lower, lo], [upper, hi]] as const) { expect(y - frame).toBeGreaterThan(a); expect(y + frame).toBeLessThan(b); }
  });

  it('keeps them centred toward bow and stern, where her sheer lifts her stripes and ports together', () => {
    const H = P.hull, [lower] = portRows(P);
    for (const x of [-6, -3, 0, 3, 6]) {
      const a = sideY(H, x, P.bottom + P.line / 2), b = sideY(H, x, P.stripes.at[0] - P.stripes.h / 2), y = sideY(H, x, lower);
      expect(y - a).toBeCloseTo(b - y, 9);
    }
  });
});

describe('"is it intentional ... such a square back? ... I\'d like to see it maybe with a bit more curves" (11 Nov)', () => {
  const S = SLOOP_HULL, F = FRIGATE_HULL;

  it('draws every ship with the same curves, the frigate and the sloop alike', () => {
    expect(S.shape).toBe(SHIP_SHAPE);
    expect(F.shape).toBe(SHIP_SHAPE);
    expect(SHAPES.box).toBe(BOX_SHAPE);
  });

  it('rounds her stern in to her middle, instead of a flat transom square across', () => {
    for (const h of [S, F]) {
      const l = h.len / 2;
      expect(halfBeam(h, -l)).toBeLessThan(1e-4);
      // (smoothly: narrowing all the way round, never wider aft)
      let w = halfBeam(h, -l);
      for (let x = -l; x <= 0; x += h.len / 400) { const v = halfBeam(h, x); expect(v).toBeGreaterThanOrEqual(w - 1e-9); w = v; }
      // ...and only at her very end: her sides still run straight along most of her.
      expect(halfBeam(h, -l + h.len * 0.15)).toBeGreaterThan(h.beam / 2 * 0.85);
    }
    // The old box, to compare: square across.
    const box = { ...S, shape: BOX_SHAPE };
    expect(halfBeam(box, -S.len / 2)).toBeCloseTo(S.beam / 2 * 0.85, 9);
  });

  it('still comes to a point at her stem, her bow fuller behind it', () => {
    for (const h of [S, F]) {
      expect(halfBeam(h, stemX(h))).toBeCloseTo(0, 6);
      const box = { ...h, shape: BOX_SHAPE }, mid = stemX(h) - h.len * 0.12;
      expect(halfBeam(h, mid)).toBeGreaterThan(halfBeam(box, mid));
    }
  });

  it('falls in above the water (tumblehome) and rounds under below it, her deck as wide as ever', () => {
    for (const h of [S, F]) {
      expect(widthAt(h, 0, h.deck)).toBeCloseTo(halfBeam(h, 0), 9);   // (what's on her deck still fits)
      expect(widthAt(h, 0, 0)).toBeGreaterThan(widthAt(h, 0, h.deck));
      expect(widthAt(h, 0, h.deck + 1)).toBeLessThan(widthAt(h, 0, h.deck));
      expect(widthAt(h, 0, h.deck - h.deep)).toBeCloseTo(0, 6);   // (her keel)
    }
  });

  it('lifts her deck line toward bow and stern (sheer), not amidships', () => {
    for (const h of [S, F]) {
      expect(liftAt(h, 0)).toBe(0);
      expect(liftAt(h, -h.len / 2)).toBeGreaterThan(0.1 * h.deck);
      expect(liftAt(h, stemX(h))).toBeGreaterThan(0.1 * h.deck);
    }
  });

  it('still holds sixteen times the sloop, curved as she is (her hull grown, not her shape)', () => {
    expect(hullVolume(hullFor(WAR_FRIGATE, 3.4, 2, { ...S, shape: BOX_SHAPE })) / hullVolume({ ...S, shape: BOX_SHAPE })).toBeCloseTo(16, 6);
    expect(F.deep).toBeCloseTo(hullFor(WAR_FRIGATE, 3.4, 2, { ...S, shape: BOX_SHAPE }).deep, 6);   // (as deep as before: the same shape grown)
    expect(deckY(P, 'waist')).toBeCloseTo(F.deck, 9);
  });
});
