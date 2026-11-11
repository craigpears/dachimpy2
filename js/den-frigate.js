/* Pirate Den: a war frigate's plan, and Primates Rule, Dachimpy's own, as config. TypeScript, compiled
   to js/den-frigate.js; tested in tests/den-frigate.test.ts. js/den/frigate.js builds any war frigate
   from a plan and a ship's config (her name, her paints, what's on her deck); Primates Rule is the
   first (the user, 11 Nov: "I want to use my ship ... my war frigate that's painted black and white
   ... the skeleton cannons. That's just really cool. I want Primates Rule."). No apostrophe in her name.

   Sized by YPPedia's numbers against the sloop (src/ships.ts): three times the sloop's length and a
   third more (she's long and slender, as Puzzle Pirates draws her), twice her beam, and deep enough
   that her hull holds sixteen times the sloop's, as her hold does. Three masts, her sails 5⅓ times
   the sloop's (her sail cloth, 400 to 75). A raised quarterdeck aft and forecastle forward, as in her
   picture (notes/primates-rule/1-top-deck.jpg). Her 24 large guns: 12 on her main deck (YPPedia's
   main deck has 12 Gunnery stations), 6 a side, and 12 below on the gun deck, behind the upper row
   of ports. Places along her are x (metres from amidships, + to the bow), across her z (+ to
   starboard, her right; port, her left, is -z), as the sloop's are. */
import { WAR_FRIGATE, hullFor, widthAt } from './ships.js';
/** A war frigate's hull, from the sloop's by YPPedia's numbers. */
export const FRIGATE_HULL = hullFor(WAR_FRIGATE, 3.4, 2);
/** The war frigate, as Puzzle Pirates draws her. */
export const WAR_FRIGATE_PLAN = {
    hull: FRIGATE_HULL,
    quarter: { to: -2.4, up: 1.5 },
    fore: { from: 3.4, up: 0.7 },
    bulwark: { h: 0.72, t: 0.12 },
    bottom: 0.28, line: 0.05,
    stripes: { at: [0.88, 1.62], h: 0.09 },
    ports: { each: 6, size: 0.32, from: -5.6, to: 4.6 },
    masts: [
        { x: 5.0, foot: 5.3, sails: [[2.8, 1.6], [2.2, 1.2], [1.5, 0.8]] },
        { x: 0.6, foot: 5.0, sails: [[3.2, 1.8], [2.5, 1.3], [1.7, 0.9]] },
        { x: -4.8, foot: 5.8, sails: [[2.2, 1.4], [1.6, 1.0]] },
    ],
    helm: { x: -3.8 },
    stairs: { quarter: { len: 2.0 }, fore: { len: 0.8, w: 1.0 } },
    hatches: [{ x: -0.8, z: 0, w: 0.8 }],
};
/** The gap between one sail and the next up a mast, and the mast's head above its top sail. */
export const SAIL_GAP = 0.2, MAST_HEAD = 0.6;
/** Each sail's foot up a mast (above the water), and the mast's top. */
export function mastSails(m) {
    const feet = [];
    let y = m.foot;
    for (const [, h] of m.sails) {
        feet.push(y);
        y += h + SAIL_GAP;
    }
    return { feet, top: y - SAIL_GAP + MAST_HEAD };
}
/** Which deck is at `x` along her. */
export const deckAt = (p, x) => (x < p.quarter.to ? 'quarter' : x >= p.fore.from ? 'fore' : 'waist');
/** That deck's height above the water. */
export const deckY = (p, d) => p.hull.deck + (d === 'quarter' ? p.quarter.up : d === 'fore' ? p.fore.up : 0);
/** How far out from her middle the inside of her bulwark is at `x`, on that deck (her sides falling
    in above the water: src/ships.ts, widthAt). */
export const insideAt = (p, x) => widthAt(p.hull, x, deckY(p, deckAt(p, x))) - p.bulwark.t;
/** The heights of her two rows of ports: each in the middle of its band of black, the lower between
    the line where her paint stops and her lower stripe, the upper between her stripes (the user, 11
    Nov: "the ones at the bottom are like touching the bottom line instead of being centered"). As
    her shape has them: her sheer lifts them with her stripes toward bow and stern (sideY). */
export function portRows(p) {
    const [a, b] = p.stripes.at, h = p.stripes.h / 2;
    return [(p.bottom + p.line / 2 + a - h) / 2, (a + h + b - h) / 2];
}
/** Her 12 main-deck guns, 6 a side: where each stands (muzzle out over her side). */
export function deckGuns(p, xs) {
    return xs.flatMap((x) => ['port', 'starboard'].map((side) => ({ x, z: (side === 'port' ? -1 : 1) * (insideAt(p, x) - 0.6), side })));
}
/** The upper row of ports, her gun deck's, and the lower, staggered between them. */
export function portXs(p) {
    const { from, to, each } = p.ports, step = (to - from) / (each - 1);
    const upper = Array.from({ length: each }, (_, i) => from + i * step);
    return [upper, upper.map((x) => x + step / 2)];
}
/** About how far each piece reaches from where it stands (for keeping them clear of each other). */
export const FOOT = {
    skeletalCannon: 0.55, gibbet: 0.5, skeletonChair: 0.3, armour: 0.35, grandPiano: 0.6, anchorChair: 0.3,
    table: 0.42, jar: 0.25, toolChest: 0.35,
};
/** Primates Rule, from the user's picture of her deck (TODO.md, "Pictures of Primates Rule"): black
    and white, the skeleton cannons, gibbets, the skeleton furniture; suits of armour on plinths, a
    black grand piano, anchor-backed chairs, tables of cards and bottles, jars with creatures in them,
    tool chests. ("go relatively close": the user, 11 Nov.) */
export const PRIMATES_RULE = {
    name: 'Primates Rule',
    paint: { hull: '#18171b', sideboard: '#f1efe8', railing: '#f4f2ec', bottom: '#a27a4f', deck: '#c49a6a', sails: '#ece6d8', gold: '#d6a63c' },
    figurehead: { kind: 'beast', col: '#1c1a1e' },
    guns: [-5.4, -3.2, 0.2, 1.5, 2.75, 4.4],
    gunKind: 'skeletalCannon',
    furniture: [
        // The quarterdeck: the piano at the stern, armour in its corners, two anchor chairs to listen
        // from; a table of bottles by the wheel.
        { kind: 'grandPiano', x: -6.55, z: 0, yaw: Math.PI / 2 },
        { kind: 'armour', x: -6.75, z: -1.15, yaw: Math.PI / 2 },
        { kind: 'armour', x: -6.75, z: 1.15, yaw: Math.PI / 2 },
        { kind: 'anchorChair', x: -5.45, z: -0.32, yaw: -Math.PI / 2 - 0.3 },
        { kind: 'anchorChair', x: -5.45, z: 0.32, yaw: -Math.PI / 2 + 0.3 },
        { kind: 'table', x: -2.95, z: 0, opts: { cup: false, bottles: 3, black: true } },
        // The main deck: armour either side of the doors under the quarterdeck, jars, a hatch, skeleton
        // chairs, a tool chest.
        { kind: 'armour', x: -2.05, z: -0.8, yaw: Math.PI / 2 },
        { kind: 'armour', x: -2.05, z: 0.8, yaw: Math.PI / 2 },
        { kind: 'jar', x: 0.95, z: 0.7, opts: { creature: '#8a5cd8' } },
        { kind: 'jar', x: -0.9, z: 0.95, opts: { creature: '#c8343a' } },
        { kind: 'skeletonChair', x: 2.05, z: -0.5, yaw: 0.4 },
        { kind: 'skeletonChair', x: 2.05, z: 0.5, yaw: Math.PI - 0.4 },
        { kind: 'toolChest', x: 0.95, z: -0.75, yaw: Math.PI },
        // The forecastle: the gibbets, a skeleton sat in a chair, a table of cards, a tool chest.
        { kind: 'gibbet', x: 6.1, z: -0.6, yaw: Math.PI / 2 },
        { kind: 'gibbet', x: 3.95, z: 0.55, yaw: -Math.PI / 2 },
        { kind: 'skeletonChair', x: 6.1, z: 0.72, yaw: -Math.PI / 2 - 0.5, opts: { sitter: true } },
        { kind: 'table', x: 7.0, z: 0, opts: { cup: false, cards: true, bottles: 1, black: true } },
        { kind: 'toolChest', x: 4.25, z: -0.6, yaw: 0 },
    ],
};
/** Everything standing on her decks (masts, stairs, hatches, the wheel, the guns and the furniture),
    each where it is and how far it reaches: for checking nothing's in anything else's way. */
export function onDeck(p, f) {
    const at = (what, x, z, r) => ({ what, x, z, r, deck: deckAt(p, x) });
    const l = p.quarter.to, s = p.stairs;
    return [
        ...p.masts.map((m) => at('mast', m.x, 0, 0.3)),
        at('helm', p.helm.x, 0, 0.35),
        ...p.hatches.map((h) => at('hatch', h.x, h.z, h.w * 0.56)),
        // (the stairs up to the quarterdeck, along each side just forward of it; up to the forecastle,
        // in the middle just aft of it)
        ...[-1, 1].map((sd) => at('stairs', l + s.quarter.len / 2, sd * (insideAt(p, l + s.quarter.len / 2) - 0.32), 0.55)),
        at('stairs', p.fore.from - s.fore.len / 2 - 0.01, 0, 0.5),
        ...deckGuns(p, f.guns).map((g) => at(f.gunKind, g.x, g.z, FOOT[f.gunKind] ?? 0.55)),
        ...f.furniture.map((o) => at(o.kind, o.x, o.z, FOOT[o.kind] ?? 0.4)),
    ];
}
