/* Pirate Den: sailing. TypeScript, compiled to js/den-sail.js; tested in tests/den-sail.test.ts.
   den.js draws the sloop, the sea and the pin; this is the board under them, the moves, and the
   clock that plays them.

   The user (9 Nov): "actually navigating to these areas, being very more Puzzle Pirates ... you
   actually sail around, you know, do the left, right tokens, and you can see the beach go and
   land", "keep it a 3D thing, so you don't have the grid squares quite as obviously, but obviously
   they're still there underneath", "just keep it simple as like with a few rocks". And then, for a
   first go at it: "drop a pin, like a destination point, but it almost like auto moves. So like
   the turns last maybe every 5 or 10 seconds, but it still moves like a Puzzle Pirate ship. So it
   goes left, pauses, right, pauses, forward, forward, left, right ... the fact that you chart the
   waypoints out gives it the speed."

   So, Battle Navigation's moves on a hidden grid of sea: forward is one square ahead; left and
   right are a square ahead and a square to that side, ending up facing that way (a quarter circle,
   as in Battle Navigation). A turn plays up to four moves, one after another with a pause between,
   then a breather before the next. You drop a pin and the pilot works out the moves to get there;
   you can put in moves yourself as well (they're played first), for when you want to steer. */
import { DeckHole } from './den-patch.js';
import { Lock, lockCost } from './den-lock.js';
import { WIND, against, inZone, lie, rowTime, sailTime, weather, zoneAir } from './den-wind.js';
export const SAIL = {
    /** The board: squares across and out to sea. Grown (10 Nov) from 16 by 14 to make room for the
        imperial checkpoint and the open sea beyond it (the user wanted "a bit of the map, not just
        tiny sections"): out to the right and further out to sea, everything already there staying
        put. */
    COLS: 22,
    ROWS: 26,
    /** Where the scattered rocks fall: the board as it was before it grew, so its rocks are the same
        as ever. The new water is laid out by hand (LAY). */
    SCATTER: { COLS: 16, ROWS: 14 },
    /** A square, in metres (the sloop's about one long). */
    CELL: 4,
    /** The board's left edge, in metres across from the den's middle: where it was at 16 squares
        across, so it grows out to the right. */
    X0: -32,
    /** Where the board starts, out from the wall (metres; the wall's at 0, out is -): at the lowest
        tide's edge, so the sloop's moored close in, where you see her from the beach (the user, 9
        Nov: she should be "in a more natural place"), and still always afloat. */
    Z0: -17,
    /** Her mooring: just off the left of the beach, broadside on, bows along the shore toward the
        middle of the cove. */
    HOME: { c: 6, r: 0, d: 1 },
    /** Moves in a turn, as in Battle Navigation. */
    SLOTS: 4,
    /** Seconds a move takes to sail, the pause after it, and the breather between turns: about
        seven seconds a turn ("5 or 10 seconds"). */
    MOVE: 1,
    PAUSE: 0.35,
    BREAK: 1.4,
    /** A beat before the first move when you give her an order while she's idle. */
    WAKE: 0.5,
    /** Rocks on the board: clumps of one to three squares. */
    CLUMPS: 13,
    /** Her guns, one each side (see broadside; loaded by Gunnery: src/den-guns.ts): how many squares
        a shot carries. */
    RANGE: 3,
    /** Seconds a square of trade wind takes to sweep her along: "just insanely quick wind tiles". */
    PUSH: 0.28,
    /* (The locks' own numbers, the Bilge to raise her and the seconds to drain, are LOCK in
       src/den-lock.ts.) */
    /** Seconds the guns that shoot at her (the checkpoint's: src/den-checkpoint.ts) hold fire once
        she's patched, so she can get going (the user, 9 Nov, of the turret that was: "as soon as you
        finish the puzzle, the cannon starts shooting at you again ... literally before you can do
        anything about it"). */
    GRACE: 5,
    /** The hole a hit knocks in her deck when nothing says what shape (den.js makes a fresh one each
        hit): three pieces' worth, patched by Carpentry (src/den-patch.ts). */
    HOLE: [[0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [1, 3], [2, 0], [2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [3, 3], [4, 2], [4, 3]],
};
/* The lay of the sea (the user, 9 Nov: "just really go for it. Add some shipping lanes ... where
   you've got a fork in the road ... some kind of a lock and canal ... if you want to switch from one
   route to the other one, you know, there's a bit of a cliff. You have to go up a lock").

   Rebuilt round the imperial checkpoint (the user, 10 Nov: "there's no need for that cannon near
   the turret near the den now, because ... we've got the Imperial checkpoint. That's the evolution
   of it"): a trade wind runs out from off the beach and drops her at a junction, "just like a
   normal square", to choose: on, the main shipping lane out to the checkpoint, which drops her
   short of its guns; or left along a canal to a lock in a cliff, up into a hidden cove behind it
   (the side adventure). Another trade wind runs back home from by where the main lane drops her.
   Rocks stand along the lanes' sides.

   The canal became a chain of locks (the user, 10 Nov: "make it a bit more of a journey ... be more
   than just the one lock ... 4 or 5 or something in total. Might be swallowing a bit too much"):
   the secret way round the checkpoint. It climbs two locks up the cliff (each pumped up by Bilge),
   runs along the clifftop, and comes down two more through the headland beside the checkpoint, out
   onto the open sea beyond it. The hidden cove is off it, up at the top, down an arm the locks
   don't lead you along, "almost more like an Easter egg" you find by wandering off. With the
   locks the way round, the reef's far end was closed: the ways past are to run it, row it, fight
   its guns, or the locks.

   Then (the user, 10 Nov) the way to the locks is "supposed to be more of an Easter egg. It
   shouldn't be like right there for you to see. You should have to sail around to find it a bit":
   the canal's mouth is in the high ground's face toward the den, off to the left, out of view from
   the trade wind's run, and nothing at the junction points it out. And the locks were "very
   confusing ... staring at a cliff once you go through", "having to bump into the walls to get
   around this lock system": so the chain runs straight, up one channel cut through the cliffs and
   down through the headland, and out of every lock she faces on along the canal, its next lock's
   gates ahead. The way on pulls you; the side way pushes back (STORY.md): the arm to the hidden
   cove doubles back off it, narrow, two turns tight together. */
export const LAY = {
    /** The trade winds: where each starts, the way it blows, and how many squares long. Out from off
        the beach to the junction; on from the junction, the main shipping lane, out to the imperial
        checkpoint, dropping her off just out of reach of its guns, facing its gate (see CHECKPOINT);
        and back home, from beside where the main lane drops her to just off the beach. */
    LANES: [
        { at: [9, 2], d: 0, n: 8 },
        { at: [9, 11], d: 0, n: 4 },
        { at: [11, 15], d: 2, n: 13 },
    ],
    JUNCTION: [9, 10],
    /** The canal's mouth, at the sea's level: the water up to the first lock, in the high ground's face
        toward the den, out of view from the trade wind's run (kept clear of scattered rocks). */
    CANAL: [[3, 7], [3, 6], [3, 5]],
    /** A sheltered harbour at the canal's mouth (10 Nov): rocks jutting out from the cliff's foot
        either side of it, most of all on its right, the mouth's wind (ZONES) filling the water
        between them right up to the cliff and the first lock. The user, playtesting the way in: "it
        just maybe needs a few rocks along the right-hand side so you can't try and, like, sneak around
        the wind. I mean, you can't, but it kind of feels like you almost can ... almost like it's a
        bit of a harbour, sheltered area. And like the wind just to expand up to the cliff. At the
        moment, it's just kind of in the middle of nowhere." Its arms run out from the cliff (row
        PLATEAU.r0 - 1) toward the den: the left one three squares, the right one four, each two
        thick at the cliff's foot. Drawn as rocky spurs stepping down from the cliff (js/den/sea.js). */
    HARBOUR: [
        [1, 7], [1, 6], [1, 5], [0, 7], [0, 6],
        [5, 7], [5, 6], [5, 5], [5, 4], [6, 7], [6, 6],
    ],
    /** The locks (src/den-lock.ts), in the order she meets them going out, all in one straight line
        out to sea: up the cliff from the canal's mouth, up again to the clifftop, then down through
        the headland beside the checkpoint (each with its high side back toward the den), out onto
        the sea beyond it. Each lock's banks are rock, so she can only go through it straight; and out
        of each she's facing on along the canal. */
    LOCKS: [
        { at: [3, 8], up: 0, low: 0 },
        { at: [3, 12], up: 0, low: 1 },
        { at: [3, 18], up: 2, low: 1 },
        { at: [3, 20], up: 2, low: 0 },
    ],
    /** The stretches of canal between the locks (pounds), and their water's level: a lock's lift
        above the sea; the clifftop's, two (with the arm off it, doubling back down to the hidden cove,
        which the locks don't lead you along); and the one between the two locks down through the
        headland. */
    POUNDS: [
        { level: 1, at: [[3, 9], [3, 10], [3, 11]] },
        { level: 2, at: [[3, 13], [3, 14], [3, 15], [3, 16], [3, 17], [2, 15], [1, 15], [1, 14]] },
        { level: 1, at: [[3, 19]] },
    ],
    /** The hidden cove: up on the clifftop, its water at the top of the locks, off the end of the
        clifftop canal's arm, beside the canal's first stretches (a wall of cliff between). */
    COVE: { c0: 0, c1: 1, r0: 9, r1: 13, level: 2 },
    /** The high ground the canal's cut through, the cove's cliffs with it: every square of it that
        isn't the canal's water (or a lock) is cliff. (The checkpoint's headland, beyond it, is its
        own: CHECKPOINT.HEADLAND.) */
    PLATEAU: { c0: 0, c1: 5, r0: 8, r1: 17 },
    /** Rocks along the lanes' sides ("some craziness to the journey"). */
    SIDES: [[8, 5], [10, 8], [12, 4], [14, 8], [12, 12]],
    /** The imperial checkpoint (10 Nov), across the main shipping lane: a line across the sea at ROW,
        closed but for its gate (GATE, under a gatehouse whose PIERS stand either side). Its guns
        stand on bastions either side (GUNS), each trained on squares of the way through (MARKS,
        src/den-checkpoint.ts). On its left a headland (cliff), the last two locks cut down through it
        (LOCKS); on its right a reef of rocks (REEF, along ROW), out to the board's edge (its end was
        open, the long way round, till the locks became the way round: 10 Nov). */
    CHECKPOINT: {
        ROW: 19,
        GATE: 9,
        PIERS: [[8, 19], [10, 19]],
        GUNS: [[7, 19], [11, 19]],
        HEADLAND: { c0: 0, c1: 6, r0: 18, r1: 20 },
        REEF: { c0: 12, c1: 21 },
    },
    /** An old wreck on the open sea beyond the checkpoint, its treasure hauled up by Treasure Haul:
        the reason to get past. Out of reach of the checkpoint's guns, so she can haul in peace. */
    WRECK: [5, 24],
    /** Wind zones (src/den-wind.ts): patches of sea with a wind of their own, whatever the weather.
        The old wreck's (10 Nov): it blows from the left, so from the checkpoint's side, heading for the
        wreck, she's dead into it ("tempting, but you can't get to it unless you go around the back
        way"), and down the locks she comes out beside it with it across her or behind her. It starts
        a column short of the last lock's foot, so from beside the wreck she can slip out of it
        westward and back up the locks, as well as downwind.
        And the canal's mouth (10 Nov: "there should be some wind stopping you from getting to the
        locks on the left as well ... People have got to figure out that they can use the oars to go
        past the wind"): it blows down out of the cut toward the den, so under sail she can't get into
        the first lock, and coming back down she runs out before it; the oars take her in. It fills
        the harbour (HARBOUR), wall to wall and up to the cliff, so there's no water beside it that
        looks like a way round.
        And under the checkpoint's gatehouse (10 Nov: "these checkpoints are supposed to be strong
        things, not things you just casually get through on the first try ... it should be work"):
        its walls take the wind out of her sails, light airs across her, so under sail she ghosts
        through the gate slowly, on its gun's mark, and that gun has her (once a gun:
        src/den-checkpoint.ts); a combo rowed as one still rushes her through. */
    ZONES: [
        { c0: 4, c1: 7, r0: 20, r1: 25, d: 1, s: 2 },
        { c0: 2, c1: 4, r0: 5, r1: 8, d: 2, s: 2 },
        { c0: 9, c1: 9, r0: 19, r1: 19, d: 1, s: 1 },
    ],
    /** Rocks out on the water the board grew into. */
    FAR: [[17, 4], [19, 8], [16, 13], [20, 15], [15, 17], [17, 22], [13, 24], [19, 24], [1, 23]],
};
/** The canal's squares: its locks and the water between them (the hidden cove's too). */
export function canalAt(c, r) {
    const { c0, c1, r0, r1 } = LAY.COVE;
    return LAY.LOCKS.some((l) => l.at[0] === c && l.at[1] === r) || LAY.POUNDS.some((p) => p.at.some(([x, y]) => x === c && y === r))
        || (c >= c0 && c <= c1 && r >= r0 && r <= r1);
}
/** The squares of the checkpoint's line that are built on (its piers and its guns' bastions), and
    the headland's (but for the canal cut through it): rocks to sail by, drawn by
    js/den/checkpoint.js, not as sea stacks. */
export function checkpointWorks() {
    const K = LAY.CHECKPOINT, out = [...K.PIERS, ...K.GUNS];
    const { c0, c1, r0, r1 } = K.HEADLAND;
    for (let c = c0; c <= c1; c++)
        for (let r = r0; r <= r1; r++)
            if (!canalAt(c, r))
                out.push([c, r]);
    return out;
}
/** Across and out for each way she can face. */
const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
const key = (c, r) => `${c},${r}`;
/** What the pilot weighs a course by: the seconds it takes to sail. A move is a move's sailing, its
    pause and its share of the turn's breather; a square of trade wind is a quick push. (Counting
    moves alone made the wind free, so she'd ride the whole loop round to save a move: 9 Nov, "the
    autopilot is going crazy around them".) */
const COST_TURN = SAIL.BREAK / SAIL.SLOTS, COST_PUSH = SAIL.PUSH;
/** The pause after a move, by how long the move took: the full pause after a move of SAIL.MOVE or
    more, less after a quicker one, so running before the wind (or rowing like crazy) she's quick
    all the way, not just between the pauses (10 Nov: "I'm not seeing like a big speed difference"). */
export const pauseFor = (secs) => SAIL.PAUSE * Math.min(1, (secs / SAIL.MOVE) ** 2);
/** The squares a move passes through (one for forward, two for a turn), and how she ends up. */
export function path(p, m) {
    const a = [p.c + DC[p.d], p.r + DR[p.d]];
    if (m === 'F')
        return { cells: [a], to: { c: a[0], r: a[1], d: p.d } };
    const d = (p.d + (m === 'L' ? 3 : 1)) % 4, b = [a[0] + DC[d], a[1] + DR[d]];
    return { cells: [a, b], to: { c: b[0], r: b[1], d } };
}
/** A little seeded dice, so the same sea comes up for the same seed. */
function dice(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/** The board: its size and its rocks. Every open square can be sailed to from the mooring, and the
    water round the mooring is kept clear so you can always get out. */
export class Sea {
    cols = SAIL.COLS;
    rows = SAIL.ROWS;
    rocks = new Set();
    /** The trade winds: the way each lane square blows (see LAY). */
    wind = new Map();
    /** The cliffs the canal's cut through (rocks too), the hidden cove's water, the canal's water
        and its level (the cove's too), and the locks (src/den-lock.ts). */
    cliff = new Set();
    cove = new Set();
    pounds = new Map();
    locks = [];
    junction = null;
    /** The squares built on (the checkpoint's piers and bastions, its headland) and the wreck's:
        rocks to sail by, drawn by their own 3D rather than as sea stacks. */
    works = new Set();
    /** The old wreck beyond the checkpoint, if laid. */
    wreck = null;
    /** Patches of sea with a wind of their own (src/den-wind.ts), if laid. */
    zones = [];
    /** The wind she sails by (src/den-wind.ts), if there's one. With none, every move takes
        SAIL.MOVE and goes any way. */
    breeze = null;
    /** Squares the scattered rocks keep off: the lanes and everything round them. */
    keep = new Set();
    /** A sea of scattered rocks; with `lay`, the lanes, the canal and its locks, and the cove too (LAY). */
    constructor(seed = 1, lay = true) {
        if (lay)
            this.lay();
        for (let tries = 0; tries < 50; tries++) {
            this.scatter(dice(seed + tries * 7919));
            if (this.allReachable())
                return;
        }
        this.scatter(() => 1); // (never seen: no scattered rocks, rather than a stuck sea)
    }
    lay() {
        const near = (c, r) => { for (let a = -1; a <= 1; a++)
            for (let b = -1; b <= 1; b++)
                this.keep.add(key(c + a, r + b)); };
        for (const { at: [c, r], d, n } of LAY.LANES)
            for (let i = 0; i < n; i++) {
                const x = c + DC[d] * i, y = r + DR[d] * i;
                this.wind.set(key(x, y), d);
                near(x, y);
            }
        for (const [c, r] of [LAY.JUNCTION, [LAY.JUNCTION[0], LAY.JUNCTION[1] + 1], ...LAY.CANAL])
            near(c, r);
        // (and the water round the harbour's arms and in front of it, so its way in is always open and
        // its arms stand clear, not lost among the scattered rocks)
        for (const [c, r] of LAY.HARBOUR)
            near(c, r - 1);
        const { c0, c1, r0, r1, level } = LAY.COVE;
        for (let c = c0; c <= c1; c++)
            for (let r = r0; r <= r1; r++) {
                this.cove.add(key(c, r));
                this.pounds.set(key(c, r), level);
            }
        for (const p of LAY.POUNDS)
            for (const [c, r] of p.at)
                this.pounds.set(key(c, r), p.level);
        this.locks = LAY.LOCKS.map((l) => ({ ...l, at: [...l.at] }));
        // The high ground round it all is cliff, but for the canal cut through it.
        const P = LAY.PLATEAU;
        for (let c = P.c0; c <= P.c1; c++)
            for (let r = P.r0; r <= P.r1; r++)
                if (!canalAt(c, r))
                    this.cliff.add(key(c, r));
        for (let c = P.c0; c <= P.c1 + 1; c++)
            for (let r = P.r0 - 1; r <= P.r1; r++)
                this.keep.add(key(c, r));
        this.junction = [...LAY.JUNCTION];
        // The checkpoint, its headland and the wreck beyond it (all outside where the rocks scatter).
        for (const [c, r] of [...checkpointWorks(), LAY.WRECK])
            this.works.add(key(c, r));
        this.wreck = [...LAY.WRECK];
        this.zones = LAY.ZONES.map((z) => ({ ...z }));
    }
    scatter(roll) {
        const laid = this.wind.size > 0, K = LAY.CHECKPOINT;
        const reef = laid ? Array.from({ length: K.REEF.c1 - K.REEF.c0 + 1 }, (_, i) => key(K.REEF.c0 + i, K.ROW)) : [];
        this.rocks = new Set([...this.cliff, ...this.works, ...reef, ...[...LAY.SIDES, ...LAY.FAR, ...LAY.HARBOUR].filter(() => laid).map(([c, r]) => key(c, r))]);
        const H = SAIL.HOME, COLS = SAIL.SCATTER.COLS, ROWS = SAIL.SCATTER.ROWS;
        for (let n = 0; n < SAIL.CLUMPS; n++) {
            let c = Math.floor(roll() * COLS), r = 2 + Math.floor(roll() * (ROWS - 2));
            const size = 1 + Math.floor(roll() * 3);
            for (let i = 0; i < size; i++) {
                if ((Math.abs(c - H.c) > 2 || r > 3) && !this.keep.has(key(c, r)) && c < COLS && r < ROWS)
                    this.rocks.add(key(c, r));
                if (roll() < 0.5)
                    c += roll() < 0.5 ? -1 : 1;
                else
                    r += roll() < 0.5 ? -1 : 1;
                if (c < 0 || c >= COLS || r < 1 || r >= ROWS)
                    break;
            }
        }
    }
    /** The way the trade wind blows on this square, if it's a lane. */
    windAt(c, r) { return this.wind.get(key(c, r)); }
    /** The lock on this square (its number, as LAY.LOCKS), or -1. */
    lockAt(c, r) { return this.locks.findIndex((l) => l.at[0] === c && l.at[1] === r); }
    isLock(c, r) { return this.lockAt(c, r) >= 0; }
    /** High ground on this square: the cliffs the canal's cut through, or the checkpoint's headland
        and works. */
    ground(c, r) { return this.cliff.has(key(c, r)) || this.works.has(key(c, r)); }
    /** The level the top of high ground on this square stands a bank's height over: the highest water
        beside it (a lock counted full), and never less than a level, so the cliffs step up the locks
        with the canal (js/den/sea.js draws them to it: bankTop). */
    bank(c, r) {
        let top = 1;
        for (let a = -1; a <= 1; a++)
            for (let b = -1; b <= 1; b++) {
                const i = this.lockAt(c + a, r + b);
                top = Math.max(top, i >= 0 ? this.locks[i].low + 1 : this.level(c + a, r + b));
            }
        return top;
    }
    /** The water's level here: the sea's 0, a lock's lift up for each lock up the canal (a lock's own
        is its low side's here: how full it is is the helm's, Helm.lockAt). */
    level(c, r) {
        const l = this.pounds.get(key(c, r));
        if (l !== undefined)
            return l;
        const i = this.lockAt(c, r);
        return i >= 0 ? this.locks[i].low : 0;
    }
    /** Swept along by the trade winds from here, a square at a time, facing the way it blows, till
        she's off the lane (or would hit something). */
    ride(p) {
        const out = [];
        let at = p;
        for (let d = this.windAt(at.c, at.r); d !== undefined && out.length < 64; d = this.windAt(at.c, at.r)) {
            const c = at.c + DC[d], r = at.r + DR[d];
            if (!this.open(c, r))
                break;
            at = { c, r, d };
            out.push(at);
        }
        return out;
    }
    /** The wind zone this square's in, if any. */
    zoneAt(c, r) { return this.zones.find((z) => inZone(z, c, r)) ?? null; }
    /** The wind she feels sailing into this square: a zone's, if it's in one, else the weather's
        (none with neither). */
    airAt(c, r) {
        const z = this.zoneAt(c, r);
        return z ? zoneAir(z) : this.breeze ? weather(this.breeze.d, this.breeze.s) : null;
    }
    /** A move's legs: each square she sails into, the way she's heading as she does, and the wind she
        feels on it, the wind where she's going (one leg for forward, two for a turn). */
    legs(p, m) {
        const { cells, to } = path(p, m), heads = m === 'F' ? [p.d] : [p.d, to.d];
        return cells.map(([c, r], i) => ({ d: heads[i], air: this.airAt(c, r) }));
    }
    /** Under sail (not at the oars), whether this move would take her a square against the wind
        where she's going: then she's in irons, and makes no way (src/den-wind.ts). */
    irons(p, m, oars = false) {
        return !oars && this.legs(p, m).some(({ d, air }) => !!air && against(d, air));
    }
    /** A move and what the trade wind does after it. In irons, or blocked, she stays where she is (a
        turn turning her on the spot): `bump` either way, and `irons` too if it was the wind. */
    move(p, m, oars = false) {
        const { cells, to } = path(p, m);
        if (this.irons(p, m, oars))
            return { to: { c: p.c, r: p.r, d: m === 'F' ? p.d : to.d }, bump: true, ride: [], irons: true };
        if (cells.every(([c, r]) => this.open(c, r)))
            return { to, bump: false, ride: this.ride(to) };
        return { to: { c: p.c, r: p.r, d: to.d }, bump: true, ride: [] };
    }
    /** The seconds a move takes: at the oars (a square on its own: see Helm for a pile of them), or
        under sail in the wind there is, by how she lies to it on the way (a turn's two squares
        shared; in a calm, as in light airs, which is what she'll have when it picks up). Without a
        move, a reach's. A move in irons swings her head round in a reach's time. */
    moveSecs(oars = false, p, m) {
        const legs = p && m ? this.legs(p, m) : [], still = this.breeze ? weather(this.breeze.d, this.breeze.s) : null;
        if (!still && !legs.some((l) => l.air))
            return SAIL.MOVE;
        if (oars)
            return WIND.OARS;
        // (in a calm, as in light airs: what she'll have when it picks up)
        const secs = (a, point = 'reach') => (a ? sailTime(a.s === 0 ? { ...a, s: 1 } : a, point) : SAIL.MOVE);
        if (!legs.length)
            return secs(still);
        // In irons: a reach's time in the wind that heads her off.
        const head = legs.find(({ d, air }) => !!air && against(d, air));
        if (head)
            return secs(head.air);
        return legs.reduce((t, { d, air }) => t + secs(air, air ? lie(d, air) : 'reach'), 0) / legs.length;
    }
    /** On the board and not a rock. */
    open(c, r) {
        return c >= 0 && c < this.cols && r >= 0 && r < this.rows && !this.rocks.has(key(c, r));
    }
    isRock(c, r) { return this.rocks.has(key(c, r)); }
    /** Sailing a move from here: where she ends up, and whether she hit something. Forward into a
        rock (or off the edge of the board) and she stays put; a turn that's blocked turns her where
        she is. */
    sail(p, m, oars = false) {
        const { to, bump, ride } = this.move(p, m, oars);
        return { to: ride.length ? ride[ride.length - 1] : to, bump };
    }
    /** Where the trade wind sweeping her on from this lane square drops her off (the square itself,
        if it isn't a lane). */
    dropOff(c, r) {
        const d = this.windAt(c, r);
        if (d === undefined)
            return [c, r];
        const ride = this.ride({ c, r, d }), end = ride[ride.length - 1];
        return end ? [end.c, end.r] : [c, r];
    }
    /** The lane squares she can sail onto to be swept over this one: it, and every square upwind of
        it on the same wind. */
    boarding(k) {
        const out = new Set();
        for (const [id, d] of this.wind) {
            const [c, r] = id.split(',').map(Number);
            if ((c === k[0] && r === k[1]) || this.ride({ c, r, d }).some((p) => p.c === k[0] && p.r === k[1]))
                out.add(id);
        }
        return out;
    }
    plots = new Map();
    /** The pilot: the quickest way from here to that square (facing any way), never sailing into a
        rock, though a turn that's blocked can turn her where she is (facing the shore at the board's
        edge, that's the only way round). Quickest by the clock, not the fewest moves: a ride on the
        trade wind is quick but not free, so she takes a lane when it saves time and never rides the
        loop round just to save a move; and going up a lock costs her a go of Bilge, so she goes
        through the locks only where they're the way. And the locks are yours to find: from the open
        sea to a pin on the open sea she's never taken up one (going down's fine), only when she's on
        the canal already or the pin is. With `via` (a lane square), she gets there by riding that
        lane: onto it at that square or upwind of it, and the wind carries her to the pin. Under sail
        (`oars` false), by the wind there is: never a square against it, each move the seconds it
        takes in that wind; at the oars, any way, at the oars' steady pace. Null if there's no way
        there. */
    plot(from, c, r, via = null, oars = false) {
        if (!this.open(c, r))
            return null;
        if (!via && from.c === c && from.r === r)
            return [];
        const memo = `${from.c},${from.r},${from.d}|${c},${r}|${via ?? ''}|${this.rocks.size},${this.wind.size}|${this.rig(oars)}`;
        if (!this.plots.has(memo)) {
            if (this.plots.size > 256)
                this.plots.clear();
            const up = this.canal(from.c, from.r) || this.canal(c, r);
            this.plots.set(memo, this.quickest(from, c, r, via ? this.boarding(via) : null, oars, up));
        }
        const got = this.plots.get(memo);
        return got ? [...got] : null;
    }
    /** Up off the sea: on the canal's water above it, or in a lock. */
    canal(c, r) { return this.level(c, r) > 0 || this.isLock(c, r); }
    /** What the moves hang on besides the rocks: under sail, the way the wind blows and how hard; at
        the oars (or with no wind), nothing. */
    rig(oars) { return oars ? 'oars' : !this.breeze ? 'still' : `sail${this.breeze.d}${this.breeze.s}`; }
    /** Where each move takes her from each pose (worked out as needed, and again if the rocks or
        the winds change; a set for each rig): the pose she ends up in, her squares of trade wind,
        whether she bumped, and the square the move itself ended on (before the trade wind). Poses
        are numbered ((c * rows + r) * 4 + d). */
    edges = new Map();
    /** What going into a lock costs her by this move, if it does (src/den-lock.ts, lockCost: Bilge to
        raise her; down's quick), and whether it's up. Into it from the square before it on the move. */
    lockToll(p, m, bump) {
        const none = { secs: 0, up: false };
        if (bump || !this.locks.length)
            return none;
        const { cells } = path(p, m), [c, r] = cells[cells.length - 1], i = this.lockAt(c, r);
        if (i < 0)
            return none;
        const [pc, pr] = cells.length > 1 ? cells[0] : [p.c, p.r];
        if (this.isLock(pc, pr))
            return none;
        const lv = this.level(pc, pr);
        return { secs: lockCost(this.locks[i], lv), up: lv <= this.locks[i].low };
    }
    edgesFor = '';
    from(id, oars) {
        const sig = `${this.rocks.size},${this.wind.size},${this.zones.length}`;
        if (sig !== this.edgesFor) {
            this.edges.clear();
            this.edgesFor = sig;
        }
        const rig = this.rig(oars);
        let set = this.edges.get(rig);
        if (!set)
            this.edges.set(rig, set = new Map());
        let got = set.get(id);
        if (!got) {
            const p = { c: Math.floor(id / 4 / this.rows), r: Math.floor(id / 4) % this.rows, d: id % 4 };
            got = ['F', 'L', 'R'].map((m) => {
                const { to, bump, ride } = this.move(p, m, oars), end = ride.length ? ride[ride.length - 1] : to;
                const secs = this.moveSecs(oars, p, m), toll = this.lockToll(p, m, bump);
                return { end: (end.c * this.rows + end.r) * 4 + end.d, ride: ride.length, bump, on: to.c * this.rows + to.r, secs: secs + pauseFor(secs) + toll.secs, up: toll.up };
            });
            set.set(id, got);
        }
        return got;
    }
    /** Dijkstra over where she can be and the way she faces, by the seconds it takes (at the oars,
        or under sail in the wind there is, by how she lies to it on each move); up a lock only with
        `up`. */
    quickest(from, c, r, boards, oars, up) {
        const N = this.cols * this.rows * 4, MOVES = ['F', 'L', 'R'];
        const best = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), how = new Int8Array(N), done = new Uint8Array(N);
        const board = new Uint8Array(this.cols * this.rows);
        if (boards)
            for (const k of boards) {
                const [x, y] = k.split(',').map(Number);
                board[x * this.rows + y] = 1;
            }
        const goalSq = c * this.rows + r;
        // A little heap of [seconds, order found, pose], quickest (then first found) on top.
        const heap = [];
        const less = (x, y) => x[0] < y[0] - 1e-9 || (Math.abs(x[0] - y[0]) <= 1e-9 && x[1] < y[1]);
        const push = (e) => {
            heap.push(e);
            for (let i = heap.length - 1; i > 0;) {
                const j = (i - 1) >> 1;
                if (!less(e, heap[j]))
                    break;
                heap[i] = heap[j];
                heap[j] = e;
                i = j;
            }
        };
        const pop = () => {
            const top = heap[0], last = heap.pop();
            if (heap.length) {
                heap[0] = last;
                for (let i = 0;;) {
                    const a = 2 * i + 1, b = a + 1;
                    let k = i;
                    if (a < heap.length && less(heap[a], heap[k]))
                        k = a;
                    if (b < heap.length && less(heap[b], heap[k]))
                        k = b;
                    if (k === i)
                        break;
                    [heap[i], heap[k]] = [heap[k], heap[i]];
                    i = k;
                }
            }
            return top;
        };
        let n = 0, goal = null;
        const s0 = (from.c * this.rows + from.r) * 4 + from.d;
        best[s0] = 0;
        push([0, n++, s0]);
        while (heap.length) {
            const [t, , at] = pop();
            if (goal && t >= goal.cost - 1e-9)
                break;
            if (done[at])
                continue;
            done[at] = 1;
            const out = this.from(at, oars);
            for (let m = 0; m < out.length; m++) {
                const e = out[m], cost = t + e.secs + COST_TURN + e.ride * COST_PUSH;
                if (e.up && !up)
                    continue;
                if (e.end >> 2 === goalSq && (!boards || (!e.bump && board[e.on]))) {
                    if (!goal || cost < goal.cost - 1e-9)
                        goal = { cost, at, m };
                    continue;
                }
                if (done[e.end] || best[e.end] <= cost + 1e-9)
                    continue;
                best[e.end] = cost;
                prev[e.end] = at;
                how[e.end] = m;
                push([cost, n++, e.end]);
            }
        }
        if (!goal)
            return null;
        const moves = [MOVES[goal.m]];
        for (let at = goal.at; prev[at] >= 0; at = prev[at])
            moves.unshift(MOVES[how[at]]);
        return moves;
    }
    /** Where a pin dropped here lands, and the lane she rides to get there, if any. Dropped on a trade
        wind it means "ride this lane": the pin goes to where the wind drops her off (the lane's end,
        or the junction), and she gets there by riding it. Otherwise it's the nearest open square she
        can get to and stop in (off the board, or on a rock or a lock, it moves to the nearest that's
        open). */
    pinFor(c, r, from = SAIL.HOME) {
        const cc = Math.max(0, Math.min(this.cols - 1, Math.round(c))), rr = Math.max(0, Math.min(this.rows - 1, Math.round(r)));
        if (this.windAt(cc, rr) !== undefined) {
            const at = this.dropOff(cc, rr), via = [cc, rr];
            if (this.plot(from, ...at, via, true))
                return { at, via };
        }
        for (let ring = 0; ring < Math.max(this.cols, this.rows); ring++) {
            const near = [];
            for (let dc = -ring; dc <= ring; dc++)
                for (let dr = -ring; dr <= ring; dr++) {
                    if (Math.max(Math.abs(dc), Math.abs(dr)) === ring)
                        near.push([cc + dc, rr + dr]);
                }
            near.sort((a, b) => Math.hypot(a[0] - c, a[1] - r) - Math.hypot(b[0] - c, b[1] - r));
            for (const [x, y] of near)
                if (this.open(x, y) && this.windAt(x, y) === undefined && !this.isLock(x, y) && this.plot(from, x, y, null, true))
                    return { at: [x, y], via: null };
        }
        return null;
    }
    /** Just where the pin lands (see pinFor). */
    pinAt(c, r, from = SAIL.HOME) { return this.pinFor(c, r, from)?.at ?? null; }
    allReachable() {
        const H = SAIL.HOME;
        if (!this.open(H.c, H.r))
            return false;
        const got = new Set([key(H.c, H.r)]), seen = new Set();
        let edge = [H];
        while (edge.length) {
            const next = [];
            for (const p of edge)
                for (const m of ['F', 'L', 'R']) {
                    const { to, bump } = this.sail(p, m, true), s = `${to.c},${to.r},${to.d}`;
                    if (bump || seen.has(s))
                        continue;
                    seen.add(s);
                    got.add(key(to.c, to.r));
                    next.push(to);
                }
            edge = next;
        }
        // (She can't stop on a lane: the wind always sweeps her on.)
        for (let c = 0; c < this.cols; c++)
            for (let r = 0; r < this.rows; r++)
                if (this.open(c, r) && this.windAt(c, r) === undefined && !got.has(key(c, r)))
                    return false;
        return true;
    }
}
/** Where she is partway (u, 0 to 1) through a move, for drawing: across and out in squares (the
    middle of a square is a whole number) and the way she faces, in quarter turns. A turn sweeps a
    quarter circle; a bump lurches forward and back, or turns her on the spot. */
export function poseAt(p, m, u, bump = false) {
    const e = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
    if (m === 'F') {
        const k = bump ? 0.22 * Math.sin(Math.PI * Math.min(1, Math.max(0, u))) : e;
        return { c: p.c + DC[p.d] * k, r: p.r + DR[p.d] * k, a: p.d };
    }
    const s = m === 'L' ? -1 : 1, a = p.d + s * e;
    if (bump)
        return { c: p.c, r: p.r, a };
    const side = (p.d + (m === 'L' ? 3 : 1)) % 4, mc = p.c + DC[side], mr = p.r + DR[side];
    const x = -DC[side], y = -DR[side], th = (m === 'L' ? 1 : -1) * e * Math.PI / 2;
    return { c: mc + x * Math.cos(th) - y * Math.sin(th), r: mr + x * Math.sin(th) + y * Math.cos(th), a };
}
/** The helm: where she is, where she's headed, and the clock that plays the turns. */
export class Helm {
    sea;
    pose;
    /** The pin: the square she's sailing for, if any. */
    pin = null;
    /** The lane square the pin was dropped on, if it was: she rides that lane to the pin. */
    via = null;
    /** Moves you've put in yourself, played before the pilot's. */
    mine = [];
    /** The turn being played: its moves, which one's on, and how far into it. */
    turn = [];
    slot = -1;
    t = 0;
    /** What's being sailed just now: a move, or a square of trade wind ('W') sweeping her on. */
    cur = null;
    /** The squares of trade wind still to come after it. */
    rides = [];
    /** The locks on her sea and their water (src/den-lock.ts), as LAY.LOCKS: they start drained. */
    locks;
    /** The hole the last hit knocked in her deck: she's dazed till it's patched. */
    hole = null;
    /** Seconds the guns that shoot at her still hold fire after she's patched (SAIL.GRACE). */
    grace = 0;
    /** Her oars out (she's rowed by the port-and-starboard board, any way, whatever the wind) or
        shipped (she sails, by the wind). */
    oars = false;
    /** At the oars, the squares the board's rowed that she's still to row (Oars hands them out:
        src/rowing.ts). The pin and the pilot don't steer her while the oars are out: the board does. */
    strokes = [];
    /** The seconds each rowed square takes just now: set by the biggest pile of them rowed and
        waiting since she last caught up, so a Vegas is rowed at a rush all the way (rowTime). */
    pace = WIND.OARS;
    /** The headwind's been said for this pin. */
    told = false;
    wait = 0;
    constructor(sea, pose = SAIL.HOME) {
        this.sea = sea;
        this.pose = { ...pose };
        this.locks = sea.locks.map((s) => new Lock(s));
    }
    /** The lock on this square, if there's one. */
    lockAt(c, r) { return this.locks[this.sea.lockAt(c, r)] ?? null; }
    /** Where she'll be when this turn's played out. */
    after() {
        if (this.slot < 0)
            return { ...this.pose };
        let p = this.cur ? (this.rides.length ? this.rides[this.rides.length - 1] : this.cur.to) : this.pose;
        for (let i = this.slot + (this.cur ? 1 : 0); i < this.turn.length; i++)
            p = this.sea.sail(p, this.turn[i], this.oars).to;
        return { ...p };
    }
    /** The course from the end of this turn on: your moves, then the pilot's to the pin (under sail
        or at the oars, as she is). */
    course() {
        if (this.oars)
            return [...this.strokes];
        let p = this.after();
        for (const m of this.mine)
            p = this.sea.sail(p, m, this.oars).to;
        const pilot = this.pin ? this.sea.plot(p, ...this.pin, this.via, this.oars) ?? [] : [];
        return [...this.mine, ...pilot];
    }
    /** Run the oars out, or ship them (a toggle, with nothing said). Always yours to choose: the pilot
        never does. Out, the board rows her (stroke) and your own moves go; either way the rest of a
        turn under way goes after the move she's on, as it was planned for the other rig. Shipped,
        she sails on to the pin, if there is one, by the wind. */
    row(on = !this.oars) {
        if (on === this.oars)
            return on;
        this.oars = on;
        this.strokes = [];
        this.pace = WIND.OARS;
        if (on)
            this.mine = [];
        if (this.slot >= 0) {
            this.turn = this.turn.slice(0, this.slot + (this.cur ? 1 : 0));
            if (!this.cur) {
                this.turn = [];
                this.slot = -1;
                this.wait = 0;
            }
        }
        this.told = false;
        if (!on && (this.pin || this.mine.length))
            this.woken();
        return on;
    }
    /** Squares rowed on the board (Oars hands them out): she rows them in turn, straight away, the
        more of them waiting the quicker (rowTime, and `pace`). Only while her oars are out. */
    stroke(steps) {
        if (!this.oars || !steps.length)
            return;
        this.strokes.push(...steps);
        const ahead = this.strokes.length + (this.slot >= 0 ? this.turn.length - this.slot - (this.cur ? 1 : 0) : 0);
        this.pace = Math.min(this.pace, rowTime(ahead));
    }
    /** The token on the sailing bar that's being sailed just now, if any: not while she waits (10 Nov:
        "in a calm, the first token of 'This turn' lights up though she isn't moving"). */
    lit() { return this.cur ? this.slot : -1; }
    /** Under sail in a calm: dead in the water. */
    becalmed() { return !this.oars && this.sea.breeze?.s === 0; }
    /** A pin she can't sail to in this wind, and the pilot won't row for (you shipped the oars). */
    headwind() {
        return !!this.pin && !this.oars && !this.mine.length && !this.sea.plot(this.after(), ...this.pin, this.via) && !!this.sea.plot(this.after(), ...this.pin, this.via, true);
    }
    /** What the next turn will play. */
    next() { return this.oars ? this.strokes.slice(0, SAIL.SLOTS) : this.course().slice(0, SAIL.SLOTS); }
    woken() { if (this.slot < 0 && this.wait <= 0)
        this.wait = SAIL.WAKE; }
    /** Drop the pin (near where you pointed: see Sea.pinFor). On a trade wind, it goes to where the
        wind will drop her off, and she rides that lane to get there. */
    drop(c, r) {
        const got = this.sea.pinFor(c, r, this.after());
        if (!got)
            return null;
        this.pin = got.at;
        this.via = got.via;
        this.told = false;
        // On the lane she's riding already, ahead of her: she's on her way there.
        const v = got.via, riding = this.cur ? [this.cur.to, ...this.rides] : [];
        if (v && this.rides.length + (this.cur?.m === 'W' ? 1 : 0) > 0 && riding.some((p) => p.c === v[0] && p.r === v[1]))
            this.via = null;
        if (!this.via && got.at[0] === this.after().c && got.at[1] === this.after().r && !this.mine.length)
            this.pin = null;
        else
            this.woken();
        return got.at;
    }
    /** Put in a move yourself (up to a turn's worth ahead). */
    put(m) {
        if (this.mine.length >= SAIL.SLOTS)
            return false;
        this.mine.push(m);
        this.woken();
        return true;
    }
    /** Take back the last move you put in. */
    unput() { return this.mine.pop(); }
    /** Pull up the pin and forget your moves: she stops when this turn's done (or straight away,
        if she's waiting at a lock). */
    stop() {
        this.pin = null;
        this.via = null;
        this.mine = [];
        if (!this.cur && this.slot >= 0) {
            this.turn = [];
            this.slot = -1;
            this.wait = SAIL.BREAK;
        }
    }
    /** Brought in to her mooring and made fast, whatever she was doing: no pin, no moves, nothing
        playing (going ashore from anywhere along the den's beach: src/den-beach.ts). */
    moor() {
        this.pin = null;
        this.via = null;
        this.mine = [];
        this.turn = [];
        this.slot = -1;
        this.t = 0;
        this.cur = null;
        this.rides = [];
        this.strokes = [];
        this.wait = 0;
        this.pose = { ...SAIL.HOME };
    }
    /** Nothing playing and nothing to play. */
    idle() { return this.slot < 0 && !this.next().length; }
    /** Holed, and the hole not yet patched. */
    dazed() { return !!this.hole && !this.hole.done(); }
    /** Hit (by the checkpoint's guns, say): a hole in her deck, and she's dazed till it's patched. She
        finishes the move she's on (or the trade wind's ride), then waits. (A hit while she's holed
        already does nothing more: the guns hold fire then anyway.) */
    hit(cells = SAIL.HOLE) { if (!this.dazed()) {
        this.hole = new DeckHole(cells);
        this.grace = SAIL.GRACE;
    } }
    /** Not to be shot at just now: held up (dazed, or at a lock), or just patched and getting going.
        (Becalmed she's fair game: row out of reach.) */
    spared() { const h = this.held(); return (!!h && h !== 'calm') || this.grace > 1e-9; }
    /** What she's waiting on, if anything. */
    held() {
        if (this.dazed())
            return 'daze';
        if (this.slot >= 0 && !this.cur) {
            const g = this.gate(this.turn[this.slot]);
            return g?.need ?? (g && g.lock.gates > 1e-9 ? 'gates' : this.becalmed() ? 'calm' : null);
        }
        return null;
    }
    /** The lock she's waiting in to be pumped up by Bilge, if she is. */
    working() {
        if (this.dazed() || this.slot < 0 || this.cur)
            return null;
        const g = this.gate(this.turn[this.slot]);
        return g?.need === 'up' ? g.lock : null;
    }
    /** A move of Bilge's worth: pumps the lock up if she's waiting in it to go up. What it went to. */
    pump(w) {
        const l = this.working();
        if (!l)
            return null;
        l.pump(w);
        return 'lock';
    }
    /** The lock this move takes her into or out of, if any, and what's in its way: through its gates
        only when its water's at the level of the side she's going to or from (src/den-lock.ts). */
    gate(m) {
        if (!this.locks.length)
            return null;
        const { cells } = path(this.pose, m);
        if (!cells.every(([c, r]) => this.sea.open(c, r)))
            return null; // (she'll only bump)
        const seq = [[this.pose.c, this.pose.r], ...cells];
        let first = null;
        for (let i = 0; i + 1 < seq.length; i++) {
            const a = this.sea.lockAt(...seq[i]), b = this.sea.lockAt(...seq[i + 1]);
            if (a === b)
                continue;
            const into = b >= 0, lock = this.locks[into ? b : a];
            const need = lock.need(this.sea.level(...(into ? seq[i] : seq[i + 1])), into);
            if (need)
                return { lock, need };
            first ??= lock;
        }
        return first ? { lock: first, need: null } : null;
    }
    /** Where she is right now, for drawing (see poseAt). */
    now() {
        if (!this.cur)
            return { c: this.pose.c, r: this.pose.r, a: this.pose.d };
        const { from, to, m } = this.cur;
        if (m === 'W') {
            const u = Math.min(1, this.t / SAIL.PUSH), turn = ((to.d - from.d + 6) % 4) - 2;
            return { c: from.c + (to.c - from.c) * u, r: from.r + (to.r - from.r) * u, a: from.d + turn * Math.min(1, u * 1.5) };
        }
        return poseAt(from, m, Math.min(1, this.t / this.cur.secs), this.cur.bump);
    }
    tick(dt) {
        const out = [];
        let left = dt;
        // The wind drops, picks up and shifts as it will.
        if (this.sea.breeze)
            out.push(...this.sea.breeze.tick(dt));
        // Holed, the guns' grace waits for the patch; then it runs down.
        this.grace = this.dazed() ? SAIL.GRACE : Math.max(0, this.grace - dt);
        // The locks' water rising to what's been pumped in; full, the top gates swing open.
        for (const l of this.locks)
            l.rise(dt);
        for (let guard = 0; left > 1e-12 && guard < 1000; guard++) {
            if (this.cur) {
                // A move or a square of wind, then (after the last of the wind) the pause. Dazed, she
                // holds once the move's sailed; the wind sweeps her on regardless.
                const cur = this.cur, dur = cur.secs;
                const span = dur + (this.rides.length ? 0 : cur.pause), hold = this.dazed() && !this.rides.length;
                if (hold && cur.done)
                    break;
                const use = hold ? Math.min(left, Math.max(0, dur - this.t)) : Math.min(left, span - this.t);
                this.t += use;
                left -= use;
                if (!cur.done && this.t >= dur - 1e-9) {
                    cur.done = true;
                    this.pose = { ...cur.to };
                    // (Riding a lane to the pin, she's there when the wind drops her off on it.)
                    if (this.pin && this.pose.c === this.pin[0] && this.pose.r === this.pin[1] && (!this.via || cur.m === 'W')) {
                        this.pin = null;
                        this.via = null;
                        out.push({ kind: 'arrive', at: { ...this.pose } });
                    }
                }
                if (this.t < span - 1e-9)
                    continue;
                this.t = 0;
                if (this.rides.length) {
                    const to = this.rides.shift();
                    this.cur = { m: 'W', from: { ...this.pose }, to, bump: false, secs: SAIL.PUSH, pause: SAIL.PAUSE };
                    out.push({ kind: 'push', from: { ...this.pose }, to: { ...to } });
                    continue;
                }
                this.cur = null;
                this.slot++;
                // At the oars, squares rowed since the turn began join it, up to a turn's worth; and there's
                // no breather after it: she rows whatever's been rowed.
                if (this.oars && this.turn.length < SAIL.SLOTS)
                    this.turn.push(...this.strokes.splice(0, SAIL.SLOTS - this.turn.length));
                if (this.slot >= this.turn.length) {
                    this.slot = -1;
                    this.turn = [];
                    this.wait = this.oars ? 0 : SAIL.BREAK;
                }
                continue;
            }
            if (this.slot >= 0) {
                // The next move of the turn, unless she's dazed or waiting on a lock: to be pumped up (by
                // Bilge), or to drain down or fill from above (by itself), then for its gates.
                if (this.dazed())
                    break;
                const g = this.gate(this.turn[this.slot]);
                if (g && (g.need || g.lock.gates > 1e-9) && this.oars && this.sea.isLock(this.pose.c, this.pose.r))
                    this.ship();
                if (g?.need === 'up')
                    break;
                if (g?.need) {
                    left = g.lock.run(g.need === 'down' ? 0 : 1, left);
                    continue;
                }
                if (g && g.lock.gates > 1e-9) {
                    left = g.lock.open(left);
                    continue;
                }
                // Under sail in a calm, she's dead in the water till the wind picks up (or the oars go out).
                if (this.becalmed())
                    break;
                this.begin(out);
                continue;
            }
            // Between turns: the breather, then the next turn, if there's anything to play.
            const use = Math.min(left, Math.max(0, this.wait));
            this.wait -= use;
            left -= use;
            for (const l of this.locks)
                l.gates = Math.max(0, l.gates - use);
            if (this.wait > 1e-9 || this.dazed())
                break;
            // The pin's where the wind won't let her sail at all (against it): she waits, and says so
            // once. Rowing there is your call.
            if (!this.told && this.headwind()) {
                this.told = true;
                out.push({ kind: 'headwind' });
            }
            const moves = this.next();
            if (!moves.length)
                break;
            if (this.oars)
                this.strokes.splice(0, moves.length);
            else
                this.mine.splice(0, Math.min(this.mine.length, moves.length));
            this.turn = moves;
            this.slot = 0;
            this.t = 0;
            out.push({ kind: 'turn', moves: [...moves] });
        }
        return out;
    }
    /** Rowed into a lock, she ships her oars there while she waits on it (the user, 10 Nov: "once you
        get through the lock and you figured out the rowing, it should auto switch back to sailing so
        that it doesn't make it seem like you're having bilge the whole way through"): the move out
        of it she's waiting to make stays, and she makes it under sail once its gates open; what else
        was rowed is let go. Nothing's said. */
    ship() {
        this.oars = false;
        this.strokes = [];
        this.pace = WIND.OARS;
        this.turn = this.turn.slice(0, this.slot + 1);
        this.told = false;
    }
    begin(out) {
        const m = this.turn[this.slot], { to, bump, ride, irons } = this.sea.move(this.pose, m, this.oars);
        // At the oars, the more squares rowed and waiting, the quicker she goes (a Vegas on each side
        // at once: as quick as the trade winds); under sail, by how she lies to the wind.
        const secs = this.oars ? this.pace : this.sea.moveSecs(false, this.pose, m);
        if (this.oars && this.turn.length - this.slot - 1 + this.strokes.length <= 0)
            this.pace = WIND.OARS; // (caught up)
        this.cur = { m, from: { ...this.pose }, to, bump, secs, pause: pauseFor(secs), irons: !!irons };
        this.rides = ride;
        this.t = 0;
        out.push({ kind: 'move', i: this.slot, m, from: { ...this.pose }, to: { ...to }, bump, irons: !!irons, secs });
    }
}
/** A shot out of that side from where she is now (see Helm.now: mid-move counts from the square
    and heading she's nearest): the squares it passes over, and the rock it hits, if any. */
export function broadside(sea, at, side) {
    const d = (((Math.round(at.a) + (side === 'R' ? 1 : 3)) % 4) + 4) % 4;
    const c0 = Math.round(at.c), r0 = Math.round(at.r), cells = [];
    for (let k = 1; k <= SAIL.RANGE; k++) {
        const c = c0 + DC[d] * k, r = r0 + DR[d] * k;
        cells.push([c, r]);
        if (sea.isRock(c, r))
            return { cells, hit: [c, r] };
    }
    return { cells, hit: null };
}
