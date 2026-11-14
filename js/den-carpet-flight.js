/* Pirate Den: Jazzmy's carpet in flight over the real sea (14 Nov). TypeScript, compiled to js/den-carpet-flight.js;
   tested in tests/den-carpet.test.ts. The ride (src/den-carpet.ts) hands over to it as the wind runs out; js/den/carpet.js
   draws it.

   The user, 14 Nov: "I feel like we need a bit more of a game ... what exactly are you doing on this magic carpet?
   Like, do I have to run some kind of a course?"; "how fast you go affects kind of how far she goes and whereabouts in
   the map she can land and get to ... different little cutscenes depending on which kind of area she lands in, whether
   that's close to the Imperial Outpost, Helium's Distillery ..."; "fly over all the assets that we've made".

   How it flies: off the sloop's foredeck at the speed she was doing (`u`, on along the way the wind ran, which is
   down the sea), with a lift in proportion (`w`), falling back under a floaty gravity. You steer her across (left,
   right), and hold Space to dive, bringing her down where you want her. Gusts hang over the sea in trails, the way
   to Helium's, to Port Decorum and on past both: fly through one and she's lifted again and pushed on. Where she comes down is the ending: short of the reef, into its rocks (or any
   rocks), the open sea, Helium's island, Port Decorum, another island, the race course beyond the far reef, or off
   the edge of the sea altogether.

   Its frame: metres from the middle of the trade wind's first square (LAY.JAZZMY.RUN), `x` on down the sea (the way
   the wind runs, rows increasing) and `z` across it (columns increasing); `h` above the water. */
import { LAY, SAIL } from './den-sail.js';
import { TZZ_CAST } from './den-tzz.js';
import { KIKKIT_CAST } from './den-kikkit.js';
import { HELIUM_CAST } from './den-helium.js';
import { AS_JAZZMY_SAILS_BY as TZZ_BY } from './lines/tzz.js';
import { AS_JAZZMY_SAILS_BY as KIKKIT_BY } from './lines/kikkit.js';
import { AS_JAZZMY_FLIES_IN as HELIUM_IN } from './lines/helium.js';
import { AS_JAZZMY_FLIES_OVER as GUARD_OVER } from './lines/imperial-guards.js';
const RUN = LAY.JAZZMY.RUN, CELL = SAIL.CELL;
/** A square, from a point in the flight's frame. */
export const squareAt = (x, z) => [Math.round(RUN.c + z / CELL), Math.round(RUN.r0 + x / CELL)];
/** A square's middle, in the flight's frame. */
export const pointAt = (c, r) => ({ x: (r - RUN.r0) * CELL, z: (c - RUN.c) * CELL });
export const FLIGHT = {
    /** Gravity, floaty (m/s²); her lift off the deck for her speed; how fast you steer her across (m/s), and how quickly
        she answers; air drag on her speed (a share a second). */
    G: 2.6, LIFT: 0.35, STEER: 6.5, EASE: 6, DRAG: 0.02,
    /** A gust: how near you have to pass (metres, across the water), the climb it gives her (m/s up, at least) and the
        push on (m/s). */
    GUST_R: 2.6, GUST_W: 4.2, GUST_PUSH: 0.8,
    /** Diving (Space held in the air): the extra pull down (m/s²), so you can bring her down where you want her. */
    DIVE: 9,
    /** How high a rock stands (she has to be over this to clear one), an island's ground, and how low she has to be
        over an island for it to catch her (she comes down on it). */
    ROCK_TOP: 2.0, LAND_H: 0.7, CATCH_H: 3.2,
};
const key = (c, r) => `${c},${r}`;
const HELIUM_LAND = new Set(LAY.HELIUM.LAND.map(([c, r]) => key(c, r)));
const EMPIRE_LAND = new Set(LAY.EMPIRE.LAND.map(([c, r]) => key(c, r)));
/** The ground of a sea (its rocks, and its islands' land, `works`). */
export function groundOf(sea) {
    return (c, r) => {
        const k = key(c, r);
        if (HELIUM_LAND.has(k))
            return 'helium';
        if (EMPIRE_LAND.has(k))
            return 'decorum';
        if (sea.rocks.has(k))
            return 'rocks';
        if (sea.works.has(k))
            return 'island';
        return 'sea';
    };
}
/** The reef she has to clear, its row (the checkpoint's), and the far reef before the race course. */
export const REEF_ROW = LAY.CHECKPOINT.ROW, RACE_ROW = 38;
/** The gusts, in trails (the flight's frame): one way straight on to Helium's, one off to her left to Port Decorum,
    one on past Helium's, to her right, over the far reef to the race course. They start past the reef: the first she has to reach
    on her launch alone. */
export const GUSTS = [
    // (straight on: the one gust that carries her to Helium's)
    { x: 66, z: 1, to: 'helium' },
    // (off to her left, curving round to Port Decorum, high over the smugglers' rocks)
    { x: 64, z: -8, to: 'decorum' },
    { x: 82, z: -25, to: 'decorum' },
    // (on past Helium's, off to her right of it, over the far reef to the race course)
    { x: 82, z: 8, to: 'race' },
    { x: 98, z: 11, to: 'race' },
    { x: 114, z: 10, to: 'race' },
];
/** Who calls out as she goes by, from where they stand (sea squares), once each, when she's within `near` metres. */
export const CALLOUTS = [
    { who: 'tzz', at: TZZ_CAST.her.at, near: 10, text: TZZ_BY },
    // (on her island's far side from the lane, by the reef: heard as the sloop comes to the wind's end)
    { who: 'kikkit', at: KIKKIT_CAST.her.at, near: 17, text: KIKKIT_BY },
    { who: 'helium', at: HELIUM_CAST.them.at, near: 20, text: HELIUM_IN },
    { who: 'guard', at: [12.5, 28.5], near: 22, text: GUARD_OVER },
];
/** The carpet in the air, from her launch (at `x` along the way, `h` up, at `v` m/s) to where she comes down. */
export class Flight {
    ground;
    x;
    z = 0;
    h;
    u;
    w;
    s = 0;
    t = 0;
    taken = new Set();
    landed = null;
    constructor(x, h, v, ground) {
        this.ground = ground;
        this.x = x;
        this.h = h;
        this.u = v;
        this.w = FLIGHT.LIFT * v;
    }
    /** The place whose harbour this square is: within a square of Helium's island or Port Decorum. */
    harbour(c, r) {
        for (let a = -1; a <= 1; a++)
            for (let b = -1; b <= 1; b++) {
                const g = this.ground(c + a, r + b);
                if (g === 'helium' || g === 'decorum')
                    return g;
            }
        return null;
    }
    /** On by `dt`, steered `steer` (-1 left, 0, 1 right), diving or not. */
    tick(dt, steer, dive = false) {
        if (this.landed)
            return [];
        const out = [], F = FLIGHT;
        this.t += dt;
        this.s += (steer * F.STEER - this.s) * Math.min(1, dt * F.EASE);
        this.u *= 1 - F.DRAG * dt;
        this.w -= (F.G + (dive ? F.DIVE : 0)) * dt;
        this.x += this.u * dt;
        this.z += this.s * dt;
        this.h += this.w * dt;
        GUSTS.forEach((g, i) => {
            if (this.taken.has(i) || Math.hypot(g.x - this.x, g.z - this.z) > F.GUST_R)
                return;
            this.taken.add(i);
            this.w = Math.max(this.w, F.GUST_W);
            this.u += F.GUST_PUSH;
            out.push({ kind: 'gust', i });
        });
        const [c, r] = squareAt(this.x, this.z);
        let where = null;
        if (c < 0 || c >= SAIL.COLS || r >= SAIL.ROWS)
            where = 'over';
        else {
            const g = this.ground(c, r);
            if (g === 'rocks' && this.h < F.ROCK_TOP) {
                where = 'rocks';
                this.h = F.ROCK_TOP;
            }
            else if (g !== 'rocks' && g !== 'sea' && this.h < F.CATCH_H) {
                where = g;
                this.h = F.LAND_H;
            }
            else if (this.h <= 0) {
                where = this.harbour(c, r) ?? (r < REEF_ROW ? 'short' : r >= RACE_ROW ? 'race' : 'sea');
                this.h = 0;
            }
        }
        if (where) {
            this.landed = { where, x: this.x, z: this.z, h: this.h, c, r };
            out.push({ kind: 'land', landed: this.landed });
        }
        return out;
    }
}
/** Flies one through with a steer each tick (`steer(f)`), to where she comes down: for the tests, and for working
    out the meter's marks. */
export function flyOut(v, ground, steer = () => 0, x0 = 0, h0 = 1.5, dive = () => false) {
    const f = new Flight(x0, h0, v, ground);
    for (let i = 0; i < 60 * 40 && !f.landed; i++)
        f.tick(1 / 60, steer(f), dive(f));
    return f;
}
