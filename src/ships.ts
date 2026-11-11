/* Pirate Den: ships by Puzzle Pirates' numbers, and how big each is drawn. TypeScript, compiled to
   js/ships.js; tested in tests/ships.test.ts. js/den/sloop.js draws the sloop and js/den/frigate.js a
   war frigate, both from the hulls here, so they stand in proportion beside each other.

   The user (11 Nov): "I want everything physically proportional" (RULES.md, "Ships, physically
   proportional, by YPPedia's numbers"). YPPedia's numbers, checked 11 Nov ("Sloop", "War frigate").
   The pirates aboard stay the same size whatever the ship, so a bigger ship isn't the sloop scaled
   up: she's longer, beamier and deeper, by these rules:
   - her hull holds as many times the sloop's as her hold does (a war frigate's, 324,000 litres, is
     sixteen times the sloop's 20,250);
   - her sails are as many times the sloop's as the sail cloth she's built from (400 against 75). */

/** A class of ship, as YPPedia gives it. */
export interface ShipClass {
  name: string;
  /** Most and fewest crew. */
  crew: number; minCrew: number;
  /** Her hold: litres and kilograms. */
  holdLitres: number; holdKg: number;
  /** Cannons aboard, their size, and shots a side a move. */
  guns: number; gunSize: 'small' | 'medium' | 'large'; shotsPerSide: number;
  /** Battle Navigation's move tokens a turn. */
  tokens: number;
  /** The sail cloth she's built with. */
  sailCloth: number;
  /** Her stations, all told, and the Gunnery stations on her main deck (her guns you see on top). */
  stations: { nav: number; sailing: number; carpentry: number; bilge: number; gunnery: number };
  mainDeckGuns: number;
}

export const SLOOP: ShipClass = {
  name: 'Sloop', crew: 7, minCrew: 3, holdLitres: 20250, holdKg: 13500,
  guns: 4, gunSize: 'small', shotsPerSide: 1, tokens: 4, sailCloth: 75,
  stations: { nav: 1, sailing: 3, carpentry: 2, bilge: 2, gunnery: 1 }, mainDeckGuns: 2,
};
export const WAR_FRIGATE: ShipClass = {
  name: 'War frigate', crew: 75, minCrew: 17, holdLitres: 324000, holdKg: 216000,
  guns: 24, gunSize: 'large', shotsPerSide: 2, tokens: 3, sailCloth: 400,
  // (the main deck has 12 Gunnery stations, the galley below 10: her 24 guns, 12 on top)
  stations: { nav: 1, sailing: 18, carpentry: 18, bilge: 12, gunnery: 6 }, mainDeckGuns: 12,
};

/** A hull as drawn (metres): its length and beam at the waterline's widest, its depth keel to
    deck, the deck's height above the water, and how much of its length the bow takes to taper
    (hullGeo's shape in js/den/hull.js: a prism, narrower at the stern, curving in to a point). */
export interface Hull { len: number; beam: number; deep: number; deck: number; bow: number }

/** The sloop, as she's always been drawn (js/den/sloop.js). Beamy enough for two rowers side by side
    and her two guns straight across from each other (10 Nov). */
export const SLOOP_HULL: Hull = { len: 4.4, beam: 2.3, deep: 1.3, deck: 0.75, bow: 0.22 };
/** The sloop's sails' area (square metres): her course, 2 by 1.6, and topsail, 1.4 by 0.9. */
export const SLOOP_SAIL = 2 * 1.6 + 1.4 * 0.9;

/** A hull's volume, as hullGeo draws it (its outline's area times its depth). */
export function hullVolume(h: Hull): number { return outlineArea(h) * h.deep; }
/** The area of a hull's outline, as hullGeo draws it. */
export function outlineArea(h: Hull): number {
  let a = 0, x0 = -h.len / 2, w0 = halfBeam(h, x0);
  const tip = h.len / 2 + h.len * 0.04, n = 400;
  for (let i = 1; i <= n; i++) {
    const x = -h.len / 2 + (tip + h.len / 2) * i / n, w = halfBeam(h, x);
    a += (x - x0) * (w + w0);   // (both sides: twice the half's trapezium)
    x0 = x; w0 = w;
  }
  return a;
}

/** Half a hull's beam at `x` along her (0 amidships, + toward the bow), as hullGeo draws her: from
    0.85 of it at the stern, out straight to the full beam where the bow starts, then curving in to
    the stem a little past her length. 0 beyond her ends. */
export function halfBeam(h: Hull, x: number): number {
  const l = h.len / 2, b = h.beam / 2, xb = l - h.len * h.bow, tip = l + h.len * 0.04;
  if (x < -l - 1e-9 || x > tip + 1e-9) return 0;
  if (x <= xb) return b * 0.85 + (b - b * 0.85) * (x + l) / (xb + l);
  // The bow: a quadratic curve from (xb, b) through the control (l, 0.6b) to (tip, 0); solve for t at x.
  const A = xb - 2 * l + tip, B = 2 * (l - xb), C = xb - x;
  const t = Math.abs(A) < 1e-12 ? -C / B : (-B + Math.sqrt(Math.max(0, B * B - 4 * A * C))) / (2 * A);
  const u = Math.min(1, Math.max(0, t));
  return (1 - u) * (1 - u) * b + 2 * (1 - u) * u * b * 0.6;
}

/** A bigger ship's hull, from the sloop's: `long` times her length and `wide` times her beam, and
    deep enough that it holds as many times hers as her hold does (`ship` against `of`). She floats
    the same, her deck as far up her side. */
export function hullFor(ship: ShipClass, long: number, wide: number, base: Hull = SLOOP_HULL, of: ShipClass = SLOOP): Hull {
  const k = ship.holdLitres / of.holdLitres, len = base.len * long, beam = base.beam * wide;
  const shaped = { ...base, len, beam, deep: 1 };
  const deep = hullVolume(base) * k / hullVolume(shaped);
  return { len, beam, deep, deck: deep * base.deck / base.deep, bow: base.bow };
}
/** Her sails' area, as many times the sloop's as her sail cloth. */
export const sailArea = (ship: ShipClass, of: ShipClass = SLOOP): number => SLOOP_SAIL * ship.sailCloth / of.sailCloth;
