/* Pirate Den: a crane up the cliff, to a clifftop lagoon. TypeScript, compiled to js/den-crane.js;
   tested in tests/den-crane.test.ts. js/den/crane.js draws it all: the ledge, the old hoist, the
   frames on the ledge, the crane as it goes up, the lagoon and its wreck, and her trip up and down.

   The user (9 Nov): "could I go somewhere to the side of a cliff and like construct a crane to get
   in?", built "with like the carpentry puzzle", and to somewhere of its own: "I don't want ... the
   lock the same thing as the crane." Then (10 Nov) the journey: the canal, Bilge to fill the lock up
   into the hidden cove, and from the cove a crane built by Carpentry hauls her up the cliff, and at
   the top a clifftop lagoon with an old wreck, its treasure brought up by Treasure Haul. "We can
   have a multi-step thing and gradually build up on it."

   So, in the hidden cove, at the foot of its left-hand cliff, there's a ledge: an old smugglers'
   landing, their hoist rotting on the clifftop above it, too small to lift a ship. Sail her
   alongside it and Space builds a crane up there, by Carpentry, a part at a time, as the den's
   rampart and shack are built (RULES.md, "It's built by carpentry, piece by piece, not by magic"):
   each part's frame is laid on the ledge and filled with pieces; a piece may stick out over the
   frame's edge, and the spare's sawn off when it's full; then the old hoist hauls it up the cliff
   and it goes into its place. Its foot, its post and its jib: the crane is the pieces you fitted.
   Built, it hauls her up the cliff and swings her down into the lagoon (a short, cheesy moment
   Space skips), and lowers her back down the same way whenever you like, so you're never stuck.

   The lagoon lies up on the headland, off the edge of the sea's board: she isn't sailed there, she's
   set down in it, beside an old wreck sunk in its still water, and its treasure is hauled up by
   Treasure Haul (src/den-haul.ts). */
import { CarpentryFrame } from './carpentry-frame.js';
import { Salvage } from './den-haul.js';
export const CRANE = {
    /** The ledge: the square of the hidden cove she lies alongside it on (at the foot of its left-hand
        cliff; the cove is LAY.COVE in src/den-sail.ts). */
    LEDGE: [0, 11],
    /** A square of the crane's timber, in metres (the den's are 0.55). */
    SQ: 0.45,
    /** Squares a piece may stick out over a frame's edge (the spare's sawn off when it's full). */
    MARGIN: 2,
    /** Its parts, in the order they're built. Each frame can be filled exactly, with single squares
        jutting out where the rare pieces go (RULES.md, "Room for the rare pieces"): the post's are
        its tenons, into the foot and the jib. About four pieces each, thirteen in all. */
    PARTS: [
        { name: 'foot', rows: ['#####.', '######', '#####.', '.####.'] },
        { name: 'post', rows: ['.######.', '########', '.######.'] },
        { name: 'jib', rows: ['##########', '.########.', '.#######..'] },
    ],
    /** Her trip up the cliff (or down it), a beat at a time, in seconds: you leap up to the winch;
        she's wound up out of the water; the jib swings her round over the clifftop; she's lowered
        into the water on the other side; you leap down onto her deck; a look round. */
    BEATS: { leap: 0.9, rise: 2.4, swing: 2.4, lower: 1.8, back: 0.9, look: 1.2 },
};
/** The crane's frames by size, for the sloop race's crane (a course from its editor, 12 Nov:
    src/race-course.ts, frames): the den's own (CRANE.PARTS, thirteen pieces), or small (two pieces a frame,
    six in all) or large (six a frame, eighteen). Each, as the den's, filled exactly with a square jutting
    out where a rare piece goes, and built foot, post and jib (tests/den-crane.test.ts). */
export const CRANES = {
    small: [
        { name: 'foot', rows: ['#####.', '.#####'] },
        { name: 'post', rows: ['.####.', '######'] },
        { name: 'jib', rows: ['#######.', '.###....'] },
    ],
    standard: CRANE.PARTS,
    large: [
        { name: 'foot', rows: ['######..', '########', '#######.', '.#####..', '..####..'] },
        { name: 'post', rows: ['.##########', '###########', '.#########.'] },
        { name: 'jib', rows: ['############', '.##########.', '.########...'] },
    ],
};
/** The lagoon, up on the headland to the left of the hidden cove: off the sea's board (squares to
    the left of its first column), so nothing on the sea is in the way of it. */
export const LAGOON = {
    /** The old wreck sunk in it, as a square of the sea's board would be counted (off the board). */
    WRECK: [-4, 11],
};
/** A part's frame, as squares [row, column]. */
export function partCells(i, parts = CRANE.PARTS) {
    const out = [];
    parts[i].rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#')
        out.push([r, c]); }));
    return out;
}
/** A part's frame on the ledge, and the pieces fitted into it: Carpentry's frame
    (src/carpentry-frame.ts), as the den's frames and the hole in her deck are, a piece sticking out
    over its edge by up to CRANE.MARGIN squares. Played with the deck patch's keys, tray and fair
    deal; any piece fitted can be lifted back out till it's full, as everywhere you build. */
export class CraneFrame extends CarpentryFrame {
    constructor(cells) { super(cells, { margin: CRANE.MARGIN }); }
}
/** Seconds a whole trip takes. */
export const TRIP = Object.values(CRANE.BEATS).reduce((a, b) => a + b, 0);
/** The beats of a trip, `t` seconds in. The same either way: up out of the water she's in, round,
    and down into the other. */
export function travel(t) {
    const B = CRANE.BEATS, out = { leap: 0, rise: 0, swing: 0, lower: 0, back: 0, done: t >= TRIP };
    let at = Math.max(0, t);
    for (const k of ['leap', 'rise', 'swing', 'lower', 'back']) {
        out[k] = Math.min(1, at / B[k]);
        at -= B[k];
        if (at < 0)
            break;
    }
    return out;
}
/** The crane: how much of it is up, the frame being filled, and her trips up and down. */
export class Crane {
    ledge;
    parts;
    /** Parts up so far (all of CRANE.PARTS: it's built). */
    up = 0;
    /** The next part's frame, on the ledge, once you've started on it (kept as you left it). */
    frame = null;
    /** You're at it: the frame's in front of you (Esc leaves it, to come back to). */
    building = false;
    where = 'cove';
    /** A trip under way: where to, and how far into it. */
    trip = null;
    /** The lagoon wreck's treasure. */
    salvage;
    /** `ledge`: the square she lies alongside it on (the hidden cove's ledge, CRANE.LEDGE, unless it's put
        down somewhere else: the sloop race's, over the neck of its last spit, src/den-race.ts). There,
        'cove' is the side she's hauled from and 'lagoon' the side she's set down on. */
    /** parts: its frames (CRANE.PARTS; the race's as its course has them, CRANES: src/race-course.ts). */
    constructor(random = Math.random, ledge = CRANE.LEDGE, parts = CRANE.PARTS) {
        this.ledge = ledge;
        this.parts = parts;
        this.salvage = new Salvage(LAGOON.WRECK, random);
    }
    built() { return this.up >= this.parts.length; }
    /** She's alongside the ledge, in the cove: on its square, stopped, nothing holding her up, her
        oars shipped (as for hauling a chest). */
    alongside(ship) {
        return this.where === 'cove' && !this.trip && ship.pose.c === this.ledge[0] && ship.pose.r === this.ledge[1] && ship.idle() && !ship.held() && !ship.oars;
    }
    /** Start (or go back to) the next part: its frame, laid on the ledge. Null once it's built. */
    build() {
        if (this.built())
            return null;
        this.building = true;
        return (this.frame ??= new CraneFrame(partCells(this.up, this.parts)));
    }
    /** Leave the frame as it is, to come back to. */
    leave() { this.building = false; }
    /** The frame's full: sawn and hoisted up, the part's in its place. What went up (nothing if the
        frame isn't full). The next part's frame is laid when you go on (build: js/den/crane.js does,
        as each part lands, while you're still at it); once all three are up, it's built and you're
        done building. */
    raise() {
        if (!this.frame?.done())
            return [];
        const out = [{ kind: 'part', part: this.up, shipshape: this.frame.shipshape() }];
        this.up++;
        this.frame = null;
        if (this.built()) {
            this.building = false;
            out.push({ kind: 'built' });
        }
        return out;
    }
    /** Haul her up into the lagoon (or lower her back down to the cove). Only once it's built, and
        not while a trip's under way. */
    haul() {
        if (!this.built() || this.trip)
            return false;
        this.trip = { to: this.where === 'cove' ? 'lagoon' : 'cove', t: 0 };
        return true;
    }
    /** How far through the trip she is (its beats), if she's on one. */
    beat() { return this.trip ? travel(this.trip.t) : null; }
    /** The trip going on; she's there at the end of it. */
    tick(dt) {
        if (!this.trip)
            return [];
        this.trip.t += dt;
        return this.trip.t >= TRIP ? this.skip() : [];
    }
    /** Space: she's there now. */
    skip() {
        if (!this.trip)
            return [];
        this.where = this.trip.to;
        this.trip = null;
        return [{ kind: 'arrive', where: this.where }];
    }
    /** The wreck's treasure can be hauled up: she's in the lagoon (not on her way), and it's not up yet. */
    canHaulWreck() { return this.where === 'lagoon' && !this.trip && !this.salvage.done; }
}
