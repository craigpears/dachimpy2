/* Pirate Den: bilging the shallows. TypeScript, compiled to js/den-bilge.js; tested in
   tests/den-bilge.test.ts. The puzzle itself is src/bilge.ts; den.js only draws the 3D and wires
   these to the raid.

   The user (9 Nov): "can you bilge out the ocean? ... we need to bilge out some of the beach, and
   then that kind of reveals some like obstacles they have to pass over that hurts and damages them
   ... but it gradually comes back over time." It should feel real, "almost like the bilge pieces are
   in the water. So when you kind of clear something and it moves, that piece of water recedes." And
   combos: "maybe it leaves an explosive barrel or something ... you can blow up as people go past".

   So the board lies in the shallows, straight out from the wall, row 0 nearest it, a square a metre
   across. Bilge's own water line is the tide: the sea's edge, all along the beach, is where the
   board's water starts. Bilge well and the tide goes out; leave it and it creeps back in. The sand
   the tide leaves bare is strewn with sharp rocks the raiders have to cross: it cuts them and slows
   them, so they reach the wall tired. Two lines at once or better dredges up a powder barrel onto
   the sand, which blows up raiders walking by it. */
import { MAX_WATER, MIN_WATER, H } from './bilge.js';
/** The numbers to tune. */
export const BILGE = {
    /** A square of the board, in metres. */
    SQ: 1,
    /** How far out from the wall the board's top row starts (metres; the wall is at 0, out is -). */
    Z0: -8,
    /** Rows of water the tide brings in a second, left to itself (a row in 30 seconds). */
    TRICKLE: 1 / 30,
    /** Rows of water pumped out per move's worth (see worth). */
    PUMP: 0.16,
    /** The tide in a crew, where nobody bilges yet: about where the sea always was. */
    CREW_WATER: 7,
    /** Stamina a raider loses for every metre of rocks crossed, and how much they slow on them. */
    ROCK_TOLL: 1,
    ROCK_SLOW: 0.6,
    /** Powder barrels on the beach at once. */
    MAX_BARRELS: 6,
    /** A raider this close sets a barrel off; it knocks down every raider this close. */
    FUSE: 0.9,
    BLAST: 2.4,
};
/** Where the sea's edge is, out from the wall, for this much water on the board. */
export const shoreAt = (water) => BILGE.Z0 - (H - water) * BILGE.SQ;
/** High tide's mark: the edge at the most water there can be. Seaward of it, rocks. */
export const HIGH = shoreAt(MAX_WATER);
/** The lowest the tide goes. */
export const LOW = shoreAt(MIN_WATER);
/** What a move is worth, counted in moves, as the bilging guides on YPPedia reckon it: a three is
    worth a little less than a move, a four or five one or two, two lines at once about three, a
    Bingo about eight. A chain's links count a little; crabs count well, more so the higher the
    water. A pufferfish or jellyfish's own clear counts for nothing, only what it sets off. */
const COMBO_WORTH = { Good: 1.5, Great: 1.8, 'Arrr!': 3, 'Har!': 3.5, 'Yarrr!': 4, 'Bingo!': 8, 'Sea Donkey!': 12, 'Vegas!': 15 };
export function worth(m, water) {
    if (!m.moved)
        return 0;
    let w = m.puffer || m.jelly ? 0 : m.lines.length ? COMBO_WORTH[m.combo] ?? 0.8 : 0;
    w += m.chain * 0.5;
    w += m.crabs * 2 * (water / MIN_WATER);
    return w;
}
/** The tide: rows of water on the board, coming in on its own and pumped out by bilging. */
export class Tide {
    water = MIN_WATER;
    /** In by itself as time goes by. */
    tick(dt) { this.water = Math.min(MAX_WATER, this.water + BILGE.TRICKLE * dt); }
    /** Out by a move's worth (each move costs nothing more: a wasted move pumps nothing). */
    pump(w) { this.water = Math.max(MIN_WATER, this.water - w * BILGE.PUMP); }
    get shore() { return shoreAt(this.water); }
    reset() { this.water = MIN_WATER; }
}
/** Powder barrels a move dredges up: one for two lines at once, two for a Bingo, three for more. */
export function barrelsFor(m) {
    const n = m.lines.length;
    return n >= 4 ? 3 : n === 3 ? 2 : n === 2 ? 1 : 0;
}
/** Metres of bare rocks between the sea's edge and high tide's mark. */
export const rocksBare = (shore) => Math.max(0, HIGH - shore);
/** Is a raider standing on the rocks? */
export const onRocks = (z, shore) => z < HIGH && z > shore;
/** The special pieces as the raids go on: puffers from the second wave, crabs from the third,
    jellyfish from the fourth (in the real puzzle they come with a pirate's standing: 3, 5 and 6 stars). */
export function oddsFor(wave) {
    return { puffer: wave >= 2 ? 0.02 : 0, crab: wave >= 3 ? 0.015 : 0, jelly: wave >= 4 ? 0.01 : 0 };
}
/** A barrel's blast: which raiders it reaches. */
export function blastHits(at, raiders) {
    return raiders.filter((r) => Math.hypot(r.x - at.x, r.z - at.z) <= BILGE.BLAST);
}
