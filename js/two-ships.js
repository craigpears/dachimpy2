/* Pirate Den: a war frigate and a sloop on one small sea, a proof of concept (IDEAS.md, "A war frigate and a
   sloop on one board"; RACE.md §11, "Racing in a frigate or a sloop"). TypeScript, compiled to
   js/two-ships.js; tested in tests/ship-handling.test.ts; drawn by js/den/two-ships.js on the unlinked
   frigate-test.html.

   A line of rocks right across the sea with two ways through it, one for each ship (the user, 14 Nov:
   "the frig being the I'm going to battle my way through ... The sloop will have its nimble [ways]
   through"):
   - a narrow gap, one square wide: the sloop slips through; a war frigate, two squares abeam, can't;
   - a channel three squares wide, a boom of chained logs across it: the sloop's small guns bounce off it;
     a war frigate's large ones smash it (BOOM.HP shots: two of her broadsides), and then it's open water
     for anyone.
   Past it, the open sea and a buoy to make for. Both ships sail on it at once, each in the other's way;
   you steer one at a time (the same helm, src/den-sail.ts, by each one's handling: src/ship-handling.ts). */
import { SAIL } from './den-sail.js';
import { ShipSea, ShipHelm, Guns, broadside, SLOOP_HANDLING, FRIGATE_HANDLING } from './ship-handling.js';
const key = (c, r) => `${c},${r}`;
/** The test sea's lay (squares: c across, r out from where the ships start). */
export const TWO_SEA = {
    COLS: 24,
    ROWS: 18,
    /** The line of rocks across it, two deep. */
    WALL: { r0: 8, r1: 9 },
    /** The narrow gap through it, one square wide. */
    GAP: 5,
    /** The channel through it, three wide, and its boom across the channel's near end. */
    CHANNEL: { c0: 15, c1: 17 },
    BOOM: { r: 8, HP: 4 },
    /** A few more rocks, out of the way. */
    ROCKS: [[1, 5], [2, 5], [21, 3], [22, 3], [18, 13], [19, 13], [4, 14]],
    /** The buoy to make for, past the rocks. */
    GOAL: [11, 15],
    /** Where each starts, bows out toward the rocks. */
    START: { sloop: { c: 7, r: 2, d: 0 }, frigate: { c: 15, r: 3, d: 0 } },
};
export const KINDS = ['sloop', 'frigate'];
export const HANDLINGS = { sloop: SLOOP_HANDLING, frigate: FRIGATE_HANDLING };
/** The boom across the channel: its squares (rocks to sail by till it's broken), and what's left of it.
    Only large guns hurt it. */
export class Boom {
    squares = [];
    hp = TWO_SEA.BOOM.HP;
    constructor() { for (let c = TWO_SEA.CHANNEL.c0; c <= TWO_SEA.CHANNEL.c1; c++)
        this.squares.push([c, TWO_SEA.BOOM.r]); }
    broken() { return this.hp <= 0; }
    has(c, r) { return !this.broken() && this.squares.some(([x, y]) => x === c && y === r); }
    /** A shot on it: a large gun's knocks a piece off ('hit', or 'broken' with the last); anything less
        'bounces'. */
    hit(guns) {
        if (this.broken())
            return null;
        if (guns !== 'large')
            return 'bounced';
        this.hp--;
        return this.broken() ? 'broken' : 'hit';
    }
}
/** The two ships on the test sea: each her own sea (her size on the squares, the other in her way) and helm,
    the rocks and the boom shared. */
export class TwoShips {
    rocks = new Set();
    boom = new Boom();
    ships;
    /** The one you're steering. */
    active = 'sloop';
    seen = { sloop: '', frigate: '' };
    constructor() {
        const S = TWO_SEA;
        for (let c = 0; c < S.COLS; c++)
            for (let r = S.WALL.r0; r <= S.WALL.r1; r++) {
                if (c === S.GAP || (c >= S.CHANNEL.c0 && c <= S.CHANNEL.c1))
                    continue;
                this.rocks.add(key(c, r));
            }
        for (const [c, r] of S.ROCKS)
            this.rocks.add(key(c, r));
        for (const [c, r] of this.boom.squares)
            this.rocks.add(key(c, r));
        const make = (kind) => {
            const h = HANDLINGS[kind], other = kind === 'sloop' ? 'frigate' : 'sloop';
            const sea = new ShipSea(h, S.COLS, S.ROWS, this.rocks, (c, r) => !!this.ships?.[other]?.helm.covers().has(key(c, r)));
            return { h, sea, helm: new ShipHelm(sea, S.START[kind]), guns: new Guns(h.reload) };
        };
        this.ships = { sloop: make('sloop'), frigate: make('frigate') };
        this.notice();
    }
    other(kind) { return kind === 'sloop' ? 'frigate' : 'sloop'; }
    /** Each ship's helm and guns a tick on: what happened to each. */
    tick(dt) {
        const out = {};
        for (const k of KINDS) {
            out[k] = this.ships[k].helm.tick(dt);
            this.ships[k].guns.tick(dt);
            this.notice();
        }
        return out;
    }
    /** Where either's moved to, the other's pilot works her way out afresh. */
    notice() {
        for (const k of KINDS) {
            const sig = [...this.ships[k].helm.covers()].sort().join(' ');
            if (sig !== this.seen[k]) {
                this.seen[k] = sig;
                this.ships[this.other(k)].sea.touch();
            }
        }
    }
    /** What a shot from `kind` would stop at on this square. */
    stopAt(kind, c, r) {
        if (this.boom.has(c, r))
            return 'boom';
        if (this.rocks.has(key(c, r)))
            return 'rock';
        const o = this.other(kind);
        return this.ships[o].helm.covers().has(key(c, r)) ? o : null;
    }
    /** Fire `kind`'s broadside out of that side, if it's loaded (null if not). A large gun's shot on the boom
        knocks a piece off; the last breaks it, and the channel's open water. */
    fire(side, kind = this.active) {
        const s = this.ships[kind];
        if (!s.guns.fire(side))
            return null;
        const shots = broadside(s.h, s.helm.now(), side, (c, r) => this.stopAt(kind, c, r)).map((shot) => {
            if (shot.what !== 'boom')
                return shot;
            const got = this.boom.hit(s.h.guns);
            if (got === 'broken')
                this.open();
            return { ...shot, boom: got ?? undefined };
        });
        return { kind, side, shots };
    }
    open() {
        for (const [c, r] of this.boom.squares)
            this.rocks.delete(key(c, r));
        for (const k of KINDS)
            this.ships[k].sea.touch();
    }
    /** The pin for the one you're steering, near this square: where it went (null if she can't get anywhere
        near), and whether that's short of where you meant (she can't get there, as things are). */
    drop(c, r, kind = this.active) {
        const at = this.ships[kind].helm.drop(c, r);
        if (!at)
            return null;
        return { at, short: Math.hypot(at[0] - c, at[1] - r) > 1.5 };
    }
    /** A move put in yourself. */
    put(m, kind = this.active) { return this.ships[kind].helm.put(m); }
    /** She's past the rocks. */
    through(kind) { return this.ships[kind].helm.pose.r > TWO_SEA.WALL.r1; }
}
/** A square of the test sea in metres (its middle; x across, z out, -z as the den's sea: js/den/two-ships.js
    lays it with the board's middle at the origin). */
export const seaXZ = (c, r) => [(c + 0.5 - TWO_SEA.COLS / 2) * SAIL.CELL, -(r + 0.5 - TWO_SEA.ROWS / 2) * SAIL.CELL];
/** A point on the water back to the square it's over (fractional). */
export const seaCR = (x, z) => [x / SAIL.CELL + TWO_SEA.COLS / 2 - 0.5, -z / SAIL.CELL + TWO_SEA.ROWS / 2 - 0.5];
