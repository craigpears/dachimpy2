/* Pirate Den: the wolf den, a first version (14 Nov). TypeScript, compiled to js/den-wolfden.js; tested in
   tests/den-wolfden.test.ts. js/den/wolfden-house.js plays it in the house shell (js/den/house.js): a hut of its own
   (not in the housing district's list) on Multibella's island (src/den-multibella.ts), its round star table with Duty
   Navigation's wheel lying on it, the moon in its window. Its lines are Multibella's, src/lines/multibella.ts's
   WOLF_DEN; the tutorial it teaches, described in the shape every tutorial shares, is src/wolf-den-tutorial.ts.

   Asked for by Dignity (the real pirate behind the checkpoint's commander): "the 4-tier duty nav in the werewolf den"
   (13 Nov), and the user, 14 Nov: "build the building, the at least do a first version of it". From IDEAS.md,
   "Dignity's tutorial: four-tier Duty Navigation in the werewolf den": the Wolf Dens Guide (a player's, on r/ypp), the
   run in the screenshots the user shared, and Multibella's telling of the wilds. Multibella teaches it, on an island
   of her own (the user, 14 Nov: "Thought the plan was for her to do the wolf den tutorial and would expect her to have
   her own island similar to others"); she was Dignity at first.

   The puzzle is src/navigation.ts's, on a wolf den's board (`den: true`): four rings, the den's constellations, wild
   places, a chain's chart times its step. Here: the hut, the table, the moon (each window starts full, about 200
   charted points a werewolf in the next pack; each chart takes its points off, and as it wanes they turn back to
   wolf-kin, the guide's), and the lesson's boards, each laid for a part of the tutorial and the moves Multibella plays on
   it. Not yet (to come, with the user): the rumbles, the den's Foraging, the funny cutscenes. */
import { Navigation } from './navigation.js';
// ---------------------------------------------------------------- the hut
/** One room, a log hut, the camera looking in from the front (its front wall cut low, a doll's house). */
export const PLAN = {
    rooms: [{ id: 'hut', name: 'The star table', x0: -4.6, x1: 4.6, z0: -3, z1: 3, paper: '#3b2c22' }],
    doors: [],
    out: { x: 0, z: 2.35, r: 0.9 },
};
export const WALLS = { high: 3.6, low: 0.45 };
/** The back wall's face (z). */
export const BACK = PLAN.rooms[0].z0 + 0.2;
/** Where you come in, and where Multibella waits: at the table's left, a cookie in hand. */
export const ARRIVE = { you: { x: 0, z: 2.0 }, her: { x: -1.75, z: -0.55 } };
/** The round star table: its middle, its top's radius and height, and the wheel lying on it (its width). */
export const TABLE = { x: 0, z: -0.55, r: 1.15, top: 0.95, board: 2.0 };
/** Close enough to the table to chart at it. */
export const atTable = (p) => Math.hypot(p.x - TABLE.x, p.z - TABLE.z) < TABLE.r + 0.95;
/** The window in the back wall, the moon through it (and a werewolf's shadow, turning back as the moon wanes). */
export const WINDOW = { x: 2.7, y: 2.05, w: 1.3, h: 1.05 };
/** What's in the hut beside the table: candles and lanterns, barrels, a crate of charts, a rug under the table, and a
    side table with a plate of chocolate chip cookies. */
export const FURNISH = [
    { kind: 'rug', x: 0, z: -0.55, col: '#4a2a3a' },
    { kind: 'table', x: -3.4, z: -1.9 },
    { kind: 'barrel', x: 3.7, z: -2.2 },
    { kind: 'barrel', x: 4.0, z: -1.4 },
    { kind: 'crate', x: -3.9, z: 0.6, yaw: 0.4 },
    { kind: 'lantern', x: -2.6, z: -2.45 },
    { kind: 'lantern', x: 2.0, z: -2.45 },
    { kind: 'candelabra', x: 3.6, z: 0.3 },
];
// ---------------------------------------------------------------- the moon
/** The den's moon (the Wolf Dens Guide): about this many points charted a werewolf in the pack; and the pack this
    first version's window starts with. */
export const MOON = { PER_WOLF: 200, PACK: 4 };
/** A window's moon: full at the start, each chart's points off it; the share of it left says how many werewolves are
    still werewolves (rounded up: the last is turned back only when the moon's gone). */
export class Moon {
    pack;
    full;
    left;
    constructor(pack = MOON.PACK) {
        this.pack = pack;
        this.full = pack * MOON.PER_WOLF;
        this.left = this.full;
    }
    /** How much of it is left, 0 to 1. */
    share() { return this.left / this.full; }
    /** The werewolves still werewolves. */
    werewolves() { return Math.ceil(this.pack * this.share() - 1e-9); }
    /** A constellation's points charted: off the moon. */
    chart(points) {
        const was = this.werewolves();
        this.left = Math.max(0, this.left - Math.max(0, points));
        const now = this.werewolves(), half = Math.ceil(this.pack / 2);
        return { turned: was - now, half: was > this.pack - half && now <= this.pack - half && now > 0, last: was > 0 && now === 0 };
    }
    /** The next pack, the moon full again. */
    rise() { this.left = this.full; }
}
const [Y, R, O, W, B] = [0, 1, 2, 3, 4];
const _ = null;
/** The lesson's boards, by name (a tutorial part's `shows.ref`, after its kind). Each is tested to do what its part
    says (tests/den-wolfden.test.ts). */
export const BOARDS = {
    /* A fresh den's board as you'd find it: the four rings, the first constellation (3 in the centre, 1 in the
       middle), a few stars down, some up in the fourth ring over full spokes. */
    rings: {
        rings: [
            [O, W, B, _, R, Y, _, W],
            [B, R, _, _, W, O, _, _],
            [W, _, _, _, Y],
            [Y],
        ],
        marks: [{ ring: 0, spoke: 2, colour: Y }, { ring: 0, spoke: 3, colour: R }, { ring: 0, spoke: 6, colour: B }, { ring: 1, spoke: 3, colour: O }],
        next: { c: R, spoke: 3 },
        moves: [],
    },
    /* The run in the screenshots ("Single! +3", "Double! +6", "Triple! Constellation!"): the red dropped makes a line
       round the third ring; the orange above falls onto two below it, a line down its spoke, beside the constellation's
       place holding a blue; that combo's clear turns it wild, the blue counts, and it's charted on the third step. */
    run: {
        rings: [
            [_, _, W, O, B],
            [_, _, B, O, W],
            [_, _, R, R],
            [_, _, _, O],
        ],
        marks: [{ ring: 0, spoke: 4, colour: Y }],
        next: { c: R, spoke: 4 },
        moves: [{ drop: true }],
    },
    /* A Trapdoor: the third ring turned a place puts a red over two reds down spoke 0; they go, and the yellow parked
       above them in the fourth ring falls into the place. */
    trapdoor: {
        rings: [
            [R, W, _, _, _, _, _, O],
            [R, B, _, _, _, _, _, B],
            [W, R],
            [Y],
        ],
        marks: [{ ring: 0, spoke: 0, colour: Y }],
        next: { c: W, spoke: 4 },
        moves: [{ turn: 2, dir: -1 }],
    },
    /* An Echo: the middle ring turned a place brings its red onto the place; charted, it goes, and the blue above it
       falls between two blues round the ring: a line. */
    echo: {
        rings: [
            [O, W, O, _, _, _, _, W],
            [B, R, B],
            [B],
        ],
        marks: [{ ring: 1, spoke: 0, colour: R }],
        next: { c: Y, spoke: 4 },
        moves: [{ turn: 1, dir: -1 }],
    },
};
/** A lesson board laid on a den's Navigation of its own: the game, and the moves to play on it. Null if there's no
    such board. */
export function layBoard(name, random = Math.random) {
    const L = BOARDS[name];
    if (!L)
        return null;
    const game = new Navigation(random, { den: true });
    game.lay(L.rings.map((ring) => Array.from({ length: 8 }, (_v, s) => ring[s] ?? null)), L.marks);
    // (a board's first constellation counts as one after a fresh board's, so what's dealt after it is the den's usual)
    game.completed = 1;
    if (L.next)
        game.next = { id: 9000, ...L.next };
    return { game, moves: [...L.moves] };
}
/** Play one of a lesson's moves on its game. */
export function playStep(game, step) {
    return 'drop' in step ? game.drop() : game.turn(step.dir, step.turn);
}
/** Seconds between Multibella's moves on a lesson's board, and how long she waits before the first. */
export const PACE_LESSON = { MOVE: 1.1, FIRST: 1.6 };
