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
export const SLOOP = {
    name: 'Sloop', crew: 7, minCrew: 3, holdLitres: 20250, holdKg: 13500,
    guns: 4, gunSize: 'small', shotsPerSide: 1, tokens: 4, sailCloth: 75,
    stations: { nav: 1, sailing: 3, carpentry: 2, bilge: 2, gunnery: 1 }, mainDeckGuns: 2,
};
export const WAR_FRIGATE = {
    name: 'War frigate', crew: 75, minCrew: 17, holdLitres: 324000, holdKg: 216000,
    guns: 24, gunSize: 'large', shotsPerSide: 2, tokens: 3, sailCloth: 400,
    // (the main deck has 12 Gunnery stations, the galley below 10: her 24 guns, 12 on top)
    stations: { nav: 1, sailing: 18, carpentry: 18, bilge: 12, gunnery: 6 }, mainDeckGuns: 12,
};
/** The plain prism every hull was until 11 Nov: square across the stern, straight up and down. */
export const BOX_SHAPE = { stern: 0, square: 2, shoulder: [0.564, 0.733], cheek: [0.897, 0.4], tumble: 0, sheer: 0, bilge: 0 };
/** The ships' curves to try against each other (frigate-test.html?curve=...). */
export const SHAPES = {
    box: BOX_SHAPE,
    gentle: { stern: 0.06, square: 4, shoulder: [0.5, 0.85], cheek: [0.85, 0.4], tumble: 0.08, sheer: 0.15, bilge: 3 },
    curved: { stern: 0.1, square: 3, shoulder: [0.5, 0.95], cheek: [0.8, 0.42], tumble: 0.15, sheer: 0.25, bilge: 2.5 },
    round: { stern: 0.16, square: 2.4, shoulder: [0.55, 1], cheek: [0.78, 0.5], tumble: 0.2, sheer: 0.4, bilge: 2.2 },
};
/** The curves every ship's hull is drawn with (11 Nov). */
export const SHIP_SHAPE = SHAPES.curved;
/** The sloop, as she's always been drawn (js/den/sloop.js). Beamy enough for two rowers side by side
    and her two guns straight across from each other (10 Nov); curved as Puzzle Pirates draws a ship
    (11 Nov). */
export const SLOOP_HULL = { len: 4.4, beam: 2.3, deep: 1.3, deck: 0.75, bow: 0.22, shape: SHIP_SHAPE };
/** The sloop's sails' area (square metres): her course, 2 by 1.6, and topsail, 1.4 by 0.9. */
export const SLOOP_SAIL = 2 * 1.6 + 1.4 * 0.9;
const shapeOf = (h) => h.shape ?? BOX_SHAPE;
/** Where her stem is: a little past her length. */
export const stemX = (h) => h.len / 2 + h.len * 0.04;
/** A hull's volume, as drawn (its outline's area times how full her sections are, keel to deck). */
export function hullVolume(h) {
    const n = 400, y0 = h.deck - h.deep;
    let s = 0;
    for (let i = 0; i < n; i++)
        s += section(h, y0 + h.deep * (i + 0.5) / n) * h.deep / n;
    return outlineArea(h) * s;
}
/** The area of a hull's outline at her deck. */
export function outlineArea(h) {
    let a = 0, x0 = -h.len / 2, w0 = halfBeam(h, x0);
    const tip = stemX(h), n = 400;
    for (let i = 1; i <= n; i++) {
        const x = -h.len / 2 + (tip + h.len / 2) * i / n, w = halfBeam(h, x);
        a += (x - x0) * (w + w0); // (both sides: twice the half's trapezium)
        x0 = x;
        w0 = w;
    }
    return a;
}
/** Half a hull's beam at her deck, `x` along her (0 amidships, + toward the bow): from 0.85 of it at
    the stern, out straight to the full beam where the bow starts, then curving in to the stem a
    little past her length; her stern rounded in over its last stretch, if her shape says so. 0
    beyond her ends. */
export function halfBeam(h, x) {
    const S = shapeOf(h), l = h.len / 2, b = h.beam / 2, xb = l - h.len * h.bow, tip = stemX(h);
    if (x < -l - 1e-9 || x > tip + 1e-9)
        return 0;
    if (x <= xb) {
        const w = b * 0.85 + (b - b * 0.85) * (x + l) / (xb + l), s = S.stern * h.len;
        if (s <= 0 || x >= -l + s)
            return w;
        // (the stern: a superellipse from her straight side round to her middle, at her very end)
        const t = Math.min(1, (-l + s - x) / s);
        return w * Math.pow(Math.max(0, 1 - Math.pow(t, S.square)), 1 / S.square);
    }
    // The bow: along its curve (bowAt) to where it's at x, found by halving.
    let a = 0, c = 1;
    for (let i = 0; i < 40; i++) {
        const m = (a + c) / 2;
        if (bowAt(h, m)[0] < x)
            a = m;
        else
            c = m;
    }
    return bowAt(h, (a + c) / 2)[1];
}
/** A point on her bow's curve, `u` from 0 where it starts (her full beam) to 1 at her stem: [x, half
    her beam there]. A cubic curve, by her shape's shoulder and cheek (the old quadratic's, from
    (xb, b) through the control (l, 0.6b) to her stem, is BOX_SHAPE's). */
export function bowAt(h, u) {
    const S = shapeOf(h), b = h.beam / 2, xb = h.len / 2 - h.len * h.bow, tip = stemX(h), run = tip - xb;
    const xs = [xb, xb + S.shoulder[0] * run, xb + S.cheek[0] * run, tip], ws = [b, S.shoulder[1] * b, S.cheek[1] * b, 0];
    const v = 1 - u, k = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
    return [k.reduce((s, q, i) => s + q * xs[i], 0), k.reduce((s, q, i) => s + q * ws[i], 0)];
}
/** How wide she is at height `y` (her shape's, before the sheer lifts it: above the water, - below),
    against her deck's width: fuller at the waterline by her tumblehome, falling in above it in a
    gentle slant (half straight, half eased in from the waterline, so it reads as a slant side-on,
    not a bend at the top), rounding in below it to her keel. On up past her deck (her bulwarks, a
    frigate's quarterdeck and forecastle) she falls in more gently, steadily, so what stands on her
    upper decks still fits. */
export function section(h, y) {
    const S = shapeOf(h), d = h.deck, dr = h.deep - h.deck, T = S.tumble;
    if (y >= d)
        return Math.max(0.7, 1 - 2 / 3 * T * (y - d) / d);
    if (y >= 0) {
        const u = y / d;
        return 1 + T * (1 - (u + u * u) / 2);
    }
    if (!S.bilge)
        return 1 + T;
    const v = Math.min(1, -y / dr);
    return (1 + T) * Math.pow(Math.max(0, 1 - Math.pow(v, S.bilge)), 1 / S.bilge);
}
/** How far her sheer lifts her side's deck line at `x`: nothing amidships, rising toward each end. */
export function liftAt(h, x) {
    const u = x >= 0 ? x / stemX(h) : -x / (h.len / 2), f = Math.max(0, (Math.min(1, u) - 0.3) / 0.7);
    return shapeOf(h).sheer * h.deck * f * f;
}
/** Where a height `y` on her side (as her shape has it) is, the sheer lifting it: the waterline stays,
    her deck line and all above it rise by liftAt, what's between stretched. */
export function sideY(h, x, y) {
    return y + liftAt(h, x) * Math.min(1, Math.max(0, y / h.deck));
}
/** sideY back: what height on her side, as her shape has it, is `Y` above the water at `x`. */
export function unlift(h, x, Y) {
    const k = liftAt(h, x);
    if (Y <= 0)
        return Y;
    return Y >= h.deck + k ? Y - k : Y / (1 + k / h.deck);
}
/** How far out from her middle her side is at `x` along her and `Y` above the water: her outline
    there, by her section at that height. What anything built on her measures her by. */
export const widthAt = (h, x, Y) => halfBeam(h, x) * section(h, unlift(h, x, Y));
/** A bigger ship's hull, from the sloop's: `long` times her length and `wide` times her beam, and
    deep enough that it holds as many times hers as her hold does (`ship` against `of`). She floats
    the same, her deck as far up her side, her curves the same. */
export function hullFor(ship, long, wide, base = SLOOP_HULL, of = SLOOP) {
    const k = ship.holdLitres / of.holdLitres, len = base.len * long, beam = base.beam * wide;
    const shaped = { ...base, len, beam, deep: 1, deck: base.deck / base.deep };
    const deep = hullVolume(base) * k / hullVolume(shaped);
    return { ...base, len, beam, deep, deck: deep * base.deck / base.deep };
}
/** Her sails' area, as many times the sloop's as her sail cloth. */
export const sailArea = (ship, of = SLOOP) => SLOOP_SAIL * ship.sailCloth / of.sailCloth;
