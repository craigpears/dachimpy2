/* Pirate Den: the sloop race, simulated: two to four bots raced on its course with no 3D, over and over,
   to test its balance. TypeScript, compiled to js/race-sim.js; tested in tests/race-sim.test.ts; run by
   tools/race-sim.mjs (win rates by route, by racing style, by skill, by starting spot, by place when
   stopping in the open, and what each shortcut really saves). The race's rules are src/den-race.ts and
   its field src/den-racers.ts, which this plays; its course is LAY.RACE (src/den-sail.ts), read from
   there, so a reworked course is simulated as it's laid (tools/race-measure.mjs measures it with the
   helm, for the numbers here that the helm sets). The same bots sail your rivals in the den's race
   (simDrive, src/den-rivals.ts; tests/den-rivals.test.ts): a race set going (sail) is stepped a tick at
   a time, on the den's own field with you racer 0 on it, or on one of its own (simulate).

   The user (11 Nov): "a test harness underneath this ... where you don't need to worry about the
   graphical elements. So you can just run through simulations quickly and easily, and just really test
   balance ... implement a handful of bots that go through different strategies ... and just actually
   make sure they all have a relatively equal chance of winning."

   How it's played (RACE.md §8, "Simulation", has the reasoning and the numbers):
   - Every racer sails as your own sloop does (12 Nov: "It's supposed to be like moves, like forward, left,
     right"): a helm of her own (src/den-sail.ts, Helm), square to square, a move at a time, on the race's
     sea (its start's field laid from the race's seed: its slow winds and whirlpools; the trade winds; every
     shortcut's way through shut, so the pilot never wanders into one), the pilot steering her round the long
     way from pin to pin (LONG_PINS, as tools/race-measure.mjs sails it), hopping the trade wind back up the
     course with a Double. Each racer's progress is how far round the long way she's got, in seconds of it
     (tau, progressAt her square): what her route's shortcuts, the snakes and the places go by.
   - Her Sailing on the pilot (src/race-sailor.ts): a drop at her skill's pace, and every clear's gust carries
     her on the moment it's made (carry, src/den-sailing.ts: a clear a square, a Double two, a Triple three),
     as yours does, on the pilot or building a combo for a gap; not while she loads a shot by Gunnery.
   - Off the helm (a shortcut's trip, a snake's sweep, into the spot she stops at), she's moved along its
     squares a square at a time (Walk), never slid: wherever she is, she's on a square or on a move between
     two (motion).
   - The start: each racer picks a spot on the starting line (Entrant.spot), and the pilot sails her down
     through the start's field from there. The quickest line is the crowded one: racers starting beside each
     other jostle (SIM.JOSTLE: she sets off a move later).
   - Each shortcut (CUTS): where she leaves the long way and where she rejoins it, from LAY.RACE; her own
     trip through (the gust, the crane, the tunnel, the locks' water and gates, the gap's light airs);
     and what it saves, the long way between less the trip (as tests/den-race.test.ts measures it with
     the helm). Where she sits to puzzle, if she stops, and whether that's sheltered.
   - The snakes (SIM.SNAKE), gentle since 12 Nov, each a few squares back: the trade wind back across leg 3,
     which every racer on the long way hops with a Double (a few seconds' timing, SIM.HOP; a slip and its loop
     sets her three squares back, to hop again); the tight water past the gun gap (a slip rushing the gap,
     three squares back along leg 2); and the left-hand trade wind's loops at the left-hand bends and along
     the run home (a slip, a few squares back).
   - The rocks across spit 3's gap (12 Nov): shot down by broadsides, anyone's hits counted on the field
     (Field.rocks); a racer of the rocks' route loads her shots on the move and fires them as she comes by
     (stopping, in the open, to load more if they're not down yet); once they're down, every racer who comes
     to them goes through, free.
   - Puzzles aren't played move by move: each takes a time drawn for the racer's skill (decent, good,
     great) round a decent player's (SIM.PUZZLE, sources there), spread as people are (SIM.SPREAD). A Vegas
     comes off only so often (SIM.VEGAS); one that doesn't sends her back to the mouth, to try again
     quicker (the board half built), or after SIM.TRIES she gives up and sails on.
   - On the move she's on the pilot, Sailing: a combo built for a gap is built on the same board, its drops'
     clears carrying her as ever, and broken at the gap (a Quad rushing the gun gap, a Double or Triple hopping
     its gap); loading her guns by Gunnery, she's not Sailing, so nothing carries her but the pilot.
   - A racer is a route (ROUTES: the shortcuts she takes) and a style (STYLES: when she fires, whether she
     loads more, whether she'll stop in the open with someone close behind).
   - Shooting, by the field's rules (src/den-racers.ts: a broadside, three squares out of her side,
     stopped by land; sheltered spots out of reach): a bot fires on a racer sitting still as it goes by,
     the broadside landing as often as its skill times it (SIM.AIM). A hit dazes her till she's patched (a
     Carpentry patch's time); a Vegas being built loses some of its board.
   - The gun gap's guns (SIM.GAP): run square by square, each gun's mark shot may hole her; a heavy combo
     rushes her past them; her shots quieten them (RACE.GAP.MODE: the same shots as for racers, a hit each;
     or more hits than a racer starts with) and rouse them: then they fire on any racer in reach, not only
     her, till nobody's near. Their marks are all in the spit: the long way goes by clear of them.
   - No gambles (12 Nov: they went, "not really in the ... good sportsman-like spirit").
   - Deterministic: one seed, one race. */
import { LAY, SAIL, Sea, Helm, layRace, poseAt } from './den-sail.js';
import { RACE, LONG_ROUTE, longRoute, routeRow, rocksDown, spotPose } from './den-race.js';
import { gustPath, carry } from './den-sailing.js';
import { fieldFor } from './start-field.js';
import { PilotChart } from './race-pilot.js';
import { LONG_PINS, HOP_PIN, WAY_IN, shutWays, goalOf as nextCut, pinOf, cutsOf, gapOf, legOf, fallback, longPlan } from './race-plan.js';
import { boardSailor, drawnSailor, gustRate, SAILOR } from './race-sailor.js';
import { DEFAULT_COURSE } from './race-course.js';
import { Field, FIELD, sheltered, courseSea, stretchAt } from './den-racers.js';
import { DOOR } from './den-door.js';
import { BRIBE, towPath } from './den-bribe.js';
import { CHECK } from './den-checkpoint.js';
import { CRANES, TRIP } from './den-crane.js';
import { LOCK } from './den-lock.js';
import { PATCH } from './den-patch.js';
import { WIND } from './den-wind.js';
import { runFor, RUN } from './sailing.js';
import { seeded } from './mirror-row.js';
import { GUNS } from './den-guns.js';
const RC = LAY.RACE, S = RC.STRETCHES;
/** The den's own course, laid out: what the helm measured the race's numbers on (a course from the race's
    editor, src/race-course.ts, has them shifted by how much further round each goes: SHIFT). */
const DEFAULT_LAY = layRace(DEFAULT_COURSE);
/** Squares along a route. */
function squaresOf(route) {
    return route.slice(1).reduce((n, b, i) => n + Math.abs(b[0] - route[i][0]) + Math.abs(b[1] - route[i][1]), 0);
}
export const SKILLS = ['decent', 'good', 'great'];
export const SIM = {
    /** Seconds a tick. */
    DT: 0.1,
    /** Seconds the helm takes the long way round, gun to finish line, no puzzle, from the long way's own spot on
        the starting line, hopping the trade wind back up the course with a Double and weaving through the
        zigzag (measured 11 Nov, the course's second pass: 221.9 s, tools/race-measure.mjs;
        tests/race-sim.test.ts measures it again and holds this to it). A course from the race's editor
        (src/race-course.ts): at the same pace, for its own long way's squares. */
    LONG: 223.5 * squaresOf(LONG_ROUTE) / squaresOf(longRoute(DEFAULT_LAY)),
    /** Seconds from each spot on the starting line (LINE.c0 up) to the first bend, through the start's
        field, the pilot's quickest way (measured 11 Nov, tools/race-measure.mjs; tested). The long way's own spot
        (RACE.LONG_SPOT) is the long way's own start. */
    SPOTS: [22.2, 22.0, 21.7, 21.4, 21.1, 20.8, 20.6, 20.3, 20.0, 19.7, 19.4, 19.2, 18.9, 18.6, 17.5, 16.1, 14.8, 14.4, 12.8, 13.8, 12.0, 13.8, 13.0, 13.9, 15.3, 16.6],
    /** Racers starting within a square of each other jostle through the field: each after the first sets off
        this many seconds later, a move given way. Assumed. */
    JOSTLE: 1.5,
    /** A racer's Sailing a little quicker or slower than another's of her skill: her drops' pace's spread, as
        a fraction. */
    STEER: 0.02,
    /* (Sailing on the pilot was a steady bit of extra speed, CHAIN, and a combo built on the move slowed her,
       OVERLAP, till 12 Nov: now each drop's clear carries her by its gust, src/race-sailor.ts.) */
    /** Puzzle time by skill, as a fraction of a decent player's. */
    SKILL: { decent: 1, good: 0.75, great: 0.55 },
    /** How puzzle times spread about their mean (a log-normal's sigma). */
    SPREAD: 0.3,
    /** A decent player's seconds at each puzzle, as the race asks for it. Where a bot measured it, that;
        otherwise RACE.DECENT's own figure (the design: each shortcut saves about what a decent player
        takes) or a guess:
        - combo: a heavy Sailing chain (worth four squares) on the sea's own board, held and broken just as
          she's lined up on the gap: 32 s. Assumed (at RACE.DECENT.guns, rushing the gap on the move won
          nearly half the races: 11 Nov).
        - vegas: a Sailing Vegas on the sea's own board: 52 s, a little over what the whirlpools save
          (RACE.DECENT.whirls). Assumed (tools/sail-bots.mjs's
          best bot, the staircase, makes one every 170 drops or so; people do far better: the user builds
          "Vegas 3s and 4s quite easily").
        - double, triple: a Double or a Triple built on the move and held to break just as she's lined up
          behind a headwind, as the gun gap's combo is: 30 s and 36 s. Assumed (at RACE.DECENT's, built on
          the move, their gaps won most races).
        - row: the headwind gap's few squares by mirror strokes: 20 s, as long as the other stopped puzzles
          (RACE.md §8, "Shortcuts in proportion"; it was RACE.DECENT.headwind, 25, till 12 Nov). Assumed.
        - bilge: a lock pumped up: LOCK.COST_UP, the pilot's own reckoning of a go of Bilge (LOCK.WORK
          moves' worth). The user finds it quick.
        - forage: the barrier's two bundles of driftwood cleared down off a Foraging board: 15 s (what the barrier
          saved till it moved a column east, 12 Nov; now it saves 12), more or less for more or fewer bundles.
          Assumed.
        - piece: a Carpentry piece fitted (the crane's thirteen, CRANE.PARTS; a hit's patch, PATCH.PIECES):
          4 s. Assumed; the user finds Carpentry quick.
        - nav: the starlit door's constellations (DOOR.NAV): about 24 moves for a two-star one and 34 for a
          three-star one, for the planner bot (tools/nav-bots.mjs, DOOR=1, 12 Nov), at 1.2 s a move.
        - load: a shot loaded by Gunnery: 20 s. Assumed; the user: "just loading the guns and gunning
          takes a long time".
        - haul: the bribe's coins hauled up from the wreck by Treasure Haul: BRIBE.MOVES moves (measured
          by a bot playing any line it sees) at BRIBE.MOVE_SECS a move (assumed).
        - gust: any clear at all, thrown at the starlit door's mouth by a racer who means only to come up
          at its first exit (12 Nov): 8 s. Assumed. */
    PUZZLE: {
        combo: 32, vegas: 52, double: 22, triple: 28, row: 20,
        bilge: (LOCK.COST_UP * RC.COURSE.clears) / LOCK.WORK, forage: (15 * RACE.FORAGE.BUNDLES.length) / 2, piece: 4, nav: (DOOR.NAV.sizes ?? [2, 3]).reduce((n, s) => n + (s <= 2 ? 24 : 34 + (s - 3) * 12), 0) * 1.2, load: 20, haul: BRIBE.MOVES * BRIBE.MOVE_SECS, gust: 8,
    },
    /** A Vegas's chance to come off, a go, by skill; the next go after one that doesn't takes this much of
        a fresh one's time; and the goes before she gives up and sails on. Assumed. */
    VEGAS: { decent: 0.55, good: 0.7, great: 0.85 },
    RETRY: 0.6,
    TRIES: 3,
    /** Seconds back at the whirlpools' mouth after a Vegas that didn't come off: their winds (about ten
        squares at the trade winds' pace, and the whirl). (The starlit door's tunnel never sends her back:
        it spills her out of the last exit she passed, 12 Nov.) */
    BACK: { whirls: 10 * SAIL.PUSH + 2 },
    /** How much of a Vegas's board a hit costs her, built so far. Assumed. */
    HIT_LOSS: 0.5,
    /** How often a broadside fired as she goes by a racer sitting still lands, by skill (it's the timing).
        Assumed. */
    AIM: { decent: 0.6, good: 0.75, great: 0.9 },
    /** Seconds a bot waits her turn at a lock, the crane or the barrier before she gives up and goes the
        long way. */
    WAIT: 20,
    /** The gun gap's guns as the bots meet them (their own numbers are the checkpoint's, CHECK): the
        chance she's holed sailing through square by square (once, as the user found, "one hit, one patch";
        patched, she's spared a while, and she's through); and an aimed shot from a roused gun, on a sloop
        under way (in the air CHECK.AIMED seconds: she's often gone; assumed) and on one sitting still.
        RUN: her trip through it square by square, light airs in its middle (measured, 7.0 s). */
    GAP: { RUN_HIT: 0.9, AIMED_HIT: 0.3, STILL_HIT: 0.95, RUN: 7 },
    /** The squares-worth of the heavy combo that rushes her past the guns (src/den-sailing.ts). */
    COMBO: runFor(4),
    /** Every racer hops the trade wind back up the course with a Double: the seconds lining it up, a
        decent player's (on the move: Sailing on the pilot). Assumed. */
    HOP: 4,
    /** The snakes: the chance, by skill, she slips into one where it waits (RACE.md §4; assumed): the
        trade wind back up the course, hopping it; the tight water past the gun gap, rushing the gap on a
        combo or running it; the left-hand trade wind, at each left-hand bend and on the run home. */
    SNAKE: {
        mid: { decent: 0.08, good: 0.04, great: 0.015 },
        tight: { decent: 0.2, good: 0.1, great: 0.04 },
        left: { decent: 0.02, good: 0.01, great: 0.004 },
    },
    /** The zigzag on leg 4, hopped with Doubles rather than woven through: the seconds it saves, a great
        Sailing player's (measured, woven 17.3 s, hopped 9.5 s); a decent one makes half of them. */
    ZIGZAG: 7.7,
    /** A racer counts as ahead of another stopped in the open once she's this many seconds round the long
        way past her (a square: alongside isn't ahead). */
    AHEAD: 1.6,
    /** The rocks (12 Nov): her trip from leg 3 down through their gap onto leg 4 once they're down, as the helm
        sails it (measured, tools/race-measure.mjs); and the loads of Gunnery she'll stop for, if her shots don't
        bring them down as she comes by, before she gives up and sails on. */
    ROCK_TRIP: 5.1,
    ROCK_LOADS: 3,
    /** An all-rounder taking every shortcut she comes to is this much slower at each stopped puzzle than her
        skill (bestAt): a jack of all trades. Assumed. */
    JACK: 1.2,
};
/* ---- The course as the bots sail it ---- */
const segs = LONG_ROUTE.slice(1).map((b, i) => { const a = LONG_ROUTE[i]; return { a, b, len: Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]) }; });
/** Seconds a square, the long way. */
export const PACE = SIM.LONG / segs.reduce((n, x) => n + x.len, 0);
const secsOf = (i) => segs[i].len * PACE;
/** Where she is, `tau` seconds round the long way: on a leg, its first row, facing along it. */
export function routePose(tau) {
    let left = Math.max(0, tau);
    for (let i = 0; i < segs.length; i++) {
        const { a, b } = segs[i], secs = secsOf(i);
        if (left <= secs || i === segs.length - 1) {
            const u = Math.min(1, left / secs);
            const dc = Math.sign(b[0] - a[0]), dr = Math.sign(b[1] - a[1]), d = dr > 0 ? 0 : dc > 0 ? 1 : dr < 0 ? 2 : 3;
            const c = a[0] + (b[0] - a[0]) * u, r = a[1] + (b[1] - a[1]) * u;
            return { c, r: dr === 0 ? Math.floor(r) : r, d };
        }
        left -= secs;
    }
    return { c: RC.FINISH[0], r: RC.FINISH[1], d: 3 };
}
/** How far round the long way (seconds) she is at column `c` on stretch `s`. */
export function tauAt(s, c) {
    const row = routeRow(s);
    let t = 0;
    for (let i = 0; i < segs.length; i++) {
        const { a, b } = segs[i];
        if (a[1] === row && b[1] === row && Math.min(a[0], b[0]) <= c && c <= Math.max(a[0], b[0]))
            return t + Math.abs(c - a[0]) * PACE;
        t += secsOf(i);
    }
    throw new Error(`no stretch ${s} at ${c}`);
}
/** Where she starts round the long way from spot `c` on the line: ahead of the long way's own spot if her way
    through the field is quicker, behind if it's slower. */
export const startTau = (c) => SIM.SPOTS[RACE.LONG_SPOT - RC.LINE.c0] - SIM.SPOTS[c - RC.LINE.c0];
/** What each shortcut saves, as the helm measures it (RACE.DECENT and DOOR.SAVES, which tests/den-race.test.ts
    and tests/den-door.test.ts hold the course to; the zigzag's SIM.ZIGZAG): she rejoins the long way that
    much further round than she'd have got sailing it in the time her trip takes. (The long way's route
    is sailed at one pace, so its own distances would make a bend's runs as slow as a leg's reaches.) */
/* A course from the race's editor (src/race-course.ts, 12 Nov): nobody's measured it with the helm, so each
   shortcut's and gamble's saving is the den's own course's, shifted by how much more or less of the long way
   it cuts out there (squares round it, at its pace). On the den's own, nothing shifts. */
/** Squares round the long way of a laid course to column `c` of stretch `s` (along its row, on past its ends). */
function roundTo(lay, route, s, c) {
    const row = routeRow(s);
    let t = 0;
    for (let i = 1; i < route.length; i++) {
        const a = route[i - 1], b = route[i];
        if (a[1] === row && b[1] === row)
            return t + (c - a[0]) * Math.sign(b[0] - a[0] || 1);
        t += Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    }
    throw new Error(`no stretch ${s} on ${lay.CODE || 'the course'}`);
}
/** How far round the long way (squares) each shortcut carries her on a course. */
function reach(lay) {
    const route = longRoute(lay), at = (s, c) => roundTo(lay, route, s, c);
    const h = lay.HEADWIND, last = (x) => x[x.length - 1];
    const [g, d2, m, k, f, l, e, t3] = [lay.GUNS.way[0][0], lay.DOUBLE.WAY[0][0], lay.WHIRLS.MOUTH.c, lay.ROCKS.WALL[0][0], lay.FORAGE.NOTCH[0], lay.LOCKS[0].at[0], lay.CRANE, lay.TRIPLE[0][0]];
    return {
        guns: at(1, g) - at(0, g), headwind: at(2, last(h)[0]) - at(1, h[0][0]), double: at(2, d2) - at(1, d2), whirls: at(3, m) - at(2, m),
        rocks: at(3, k) - at(2, k), forage: at(3, f) - at(2, f), locks: at(4, l) - at(3, l), crane: at(5, e.TO.c) - at(4, e.LEDGE[0]), triple: at(5, t3) - at(4, t3),
        door: at(4, lay.DOOR.OFF[0][0]) - at(1, lay.DOOR.OFF[0][0]),
    };
}
/** Seconds each shortcut's saving shifts by on this page's course (none on the den's own). */
const SHIFT = (() => {
    const a = reach(RC), b = reach(DEFAULT_LAY);
    return Object.fromEntries(Object.keys(a).map((k) => [k, (a[k] - b[k]) * PACE]));
})();
const shifted = (id) => (id in SHIFT ? SHIFT[id] : 0);
const SAVES = Object.fromEntries(Object.entries({ ...RACE.DECENT, door: DOOR.SAVES, zigzag: 0, wreck: 0 }).map(([id, s]) => [id, s + shifted(id)]));
const cut = (id, s, c, to, cOut, trip, at, spot = null) => {
    const tIn = tauAt(s, c), saves = id === 'zigzag' ? tauAt(to, cOut) - tIn - trip : SAVES[id];
    return { id, tIn, tOut: tIn + trip + saves, trip, saves, at, sheltered: sheltered(at.c, at.r), spot };
};
const G = RC.GUNS.way, WR = RC.BRIBE.NOTCH, B = RC.HEADWIND, M = RC.WHIRLS.MOUTH, K = RC.ROCKS, L = RC.LOCKS, E = RC.CRANE, D = RC.DOOR, F = RC.FORAGE, D2 = RC.DOUBLE.WAY, T3 = RC.TRIPLE, Z = RC.ZIGZAG;
/** The course's shortcuts, as the bots take them. Their trips as the helm makes them (tools/race-measure.mjs):
    the gap rushed on a heavy combo's gust, the headwind's squares rowed at the oars' pace, a Double's and a
    Triple's hop and the water either side, the barrier's gap sailed once it's cleared, the locks' (4.3 s,
    pumped at once, made ready for the race; 10 s till 12 Nov, waiting on their water and gates), the others' gusts, the crane's trip (TRIP) and the tunnel's (DOOR.TRIP); the zigzag's
    hops, on the long way, what they save (SIM.ZIGZAG). Stopped short of the gap, she waits two squares
    before it, on the leg's second row (and pays the gate's guard there). The wreck saves nothing itself: in
    and out of its notch, its coins hauled up meanwhile, to pay the gate with (the gap's saving). */
export const CUTS = {
    guns: cut('guns', 0, G[0][0], 1, G[0][0], 1 + SIM.COMBO * SAIL.PUSH, { c: G[0][0] - 2, r: S[0].r + 1, d: 1 }),
    wreck: cut('wreck', 0, WR[0], 0, WR[0], 3, { c: WR[0], r: WR[1], d: 0 }, 'wreck'),
    headwind: cut('headwind', 1, B[0][0], 2, B[B.length - 1][0], 1 + (B.length + 2) * WIND.OARS, { c: B[0][0], r: B[0][1], d: 0 }),
    double: cut('double', 1, D2[0][0], 2, D2[0][0], 2.2, { c: D2[0][0], r: D2[0][1], d: 0 }),
    whirls: cut('whirls', 2, M.c, 3, M.c, runFor(RUN.VEGAS) * SAIL.PUSH, { ...M }),
    // (from leg 3's second row by the rocks, firing her port guns down on them as she comes; once they're down,
    // down through the gap onto leg 4)
    rocks: cut('rocks', 2, K.WALL[0][0], 3, K.WALL[0][0], SIM.ROCK_TRIP, { c: K.WALL[0][0], r: S[2].r + 1, d: 1 }),
    forage: cut('forage', 2, F.NOTCH[0], 3, F.NOTCH[0], 6.2, { c: F.NOTCH[0], r: F.NOTCH[1], d: 0 }, 'forage'),
    locks: cut('locks', 3, L[0].at[0], 4, L[0].at[0], 4.3, { c: L[0].at[0], r: L[0].at[1], d: 0 }, 'lock-up'),
    crane: cut('crane', 4, E.LEDGE[0], 5, E.TO.c, TRIP + 1, { c: E.LEDGE[0], r: E.LEDGE[1], d: 0 }, 'crane'),
    triple: cut('triple', 4, T3[0][0], 5, T3[0][0], 1.7, { c: T3[0][0], r: T3[0][1] - 1, d: 0 }),
    zigzag: { ...cut('zigzag', 3, Z[0][0] + 1, 3, Math.min(...Z.map(([c]) => c)), 0, { c: Z[0][0] + 1, r: S[3].r, d: 3 }), saves: SIM.ZIGZAG },
    door: cut('door', DOOR.FROM, D.OFF[0][0], DOOR.TO, D.OFF[0][0], DOOR.TRIP, { c: D.OFF[0][0], r: D.OFF[0][1], d: 0 }),
};
CUTS.zigzag.trip = CUTS.zigzag.tOut - CUTS.zigzag.tIn - SIM.ZIGZAG;
/** Where the trade wind back across leg 3 crosses the long way (every racer on it hops it), and where its loop
    puts her back if she slips (three squares back along the leg, 12 Nov); the tight water past the gun gap,
    and where it puts her (three squares back); the left-hand bends and the run home, where the left-hand trade
    wind's loops wait (a few squares back). */
const MID_C = RC.SNAKES.MID[0][0], MID_T = tauAt(2, MID_C - 1), MID_BACK = tauAt(2, MID_C - 3);
const TIGHT_BACK = tauAt(1, Math.min(RC.BUOYS[0].at[0], G[0][0] + RC.SNAKES.TIGHT.length));
const LEFT_T = [tauAt(1, RC.BUOYS[1].at[0] + 1), tauAt(3, RC.BUOYS[3].at[0] + 1), tauAt(5, RC.FINISH[0] + 3)];
/** Squares a slip into the left-hand trade wind's loops sets her back. */
const LEFT_BACK = 4;
/** Seconds a sweep takes: a square of wind a trade wind's push. */
const sweep = (n) => n * SAIL.PUSH;
/** The bribe's tow through the gate, from in front of its way in: a gust's squares at the trade winds' pace. */
const TOW = 1 + towPath({ c: RC.BRIBE.GATE[0], r: RC.BRIBE.GATE[1] }).length * SAIL.PUSH;
/** How much of what the zigzag's hops can save a racer makes, by her skill at Sailing (SIM.ZIGZAG). */
const HOPS = { decent: 0.5, good: 0.75, great: 1 };
/** Pieces in the crane's three frames (about five squares a piece), as big as the course has them. */
const CRANE_PIECES = Math.round(CRANES[RC.COURSE.frames].reduce((n, p) => n + p.rows.join('').split('#').length - 1, 0) / 5);
/* ---- Sailing her: the helm, the pilot, and a square at a time off it ---- */
/* The long way's pins (LONG_PINS), every shortcut's way through shut on the pilot's sea so the pilot never takes
   one (shutWays: she takes her plan's by its trip), the ways in (WAY_IN) and where to head next (goalOf, pinOf)
   are the plan's (src/race-plan.ts): the same for every racer, you on your plan's pilot included. */
export { LONG_PINS };
/** The pilot's sea once she's down on the course: no start's field (one, made once: its pilot's reckoning
    kept from race to race). Down the start's field, each race's own sea, its field laid (fieldSea). */
let open = null;
const courseWater = () => (open ??= shutWays(new Sea(9)));
/** The race's sea with its start's field (src/start-field.ts, from its seed), as everyone racing it has it. */
const fieldSea = (seed) => { const s = shutWays(new Sea(9)); s.layField(fieldFor(seed)); return s; };
/** The pilot's chart to a square on the course (src/race-pilot.ts: a pin, a shortcut's way in), charted once. */
const charts = new Map();
function courseChart(at) {
    const k = `${at[0]},${at[1]}`;
    let ch = charts.get(k);
    if (!ch)
        charts.set(k, ch = new PilotChart(courseWater(), at, S[0].r, courseWater().rows - 1));
    return ch;
}
/** Squares along a run of them, a square at a time (across, then along). */
function unitSteps(pts) {
    const out = [[Math.round(pts[0][0]), Math.round(pts[0][1])]];
    for (const [c1, r1] of pts.slice(1).map(([c, r]) => [Math.round(c), Math.round(r)])) {
        let [c, r] = out[out.length - 1];
        while (c !== c1) {
            c += Math.sign(c1 - c);
            out.push([c, r]);
        }
        while (r !== r1) {
            r += Math.sign(r1 - r);
            out.push([c, r]);
        }
    }
    return out;
}
const walkOf = (pts, secs, d) => ({ pts: unitSteps(pts), t: 0, secs, d });
const walkDone = (w) => w.t >= w.secs * (w.pts.length - 1) - 1e-9;
const headOf = (a, b, d) => (b[1] > a[1] ? 0 : b[0] > a[0] ? 1 : b[1] < a[1] ? 2 : b[0] < a[0] ? 3 : d);
/** Where a walk has her: the step she's on (from and to, neighbouring squares) and how far through it. */
function walkAt(w) {
    const n = w.pts.length - 1, k = Math.min(n - 1, Math.floor(w.t / w.secs));
    if (n <= 0) {
        const [c, r] = w.pts[0];
        return { from: { c, r, d: w.d }, to: { c, r, d: w.d }, m: 'W', u: 1 };
    }
    const a = w.pts[k], b = w.pts[k + 1], u = Math.min(1, (w.t - k * w.secs) / w.secs), d = headOf(a, b, w.d);
    return { from: { c: a[0], r: a[1], d }, to: { c: b[0], r: b[1], d }, m: 'W', u, secs: w.secs };
}
/** Where a motion has her, for drawing: on a square, or partway along a move between two neighbouring ones
    (a turn sweeps a quarter circle, as your sloop's does: poseAt). `d`, the way she faces, in quarter turns. */
export function motionPose(x) {
    if (x.m !== 'W') {
        const p = poseAt(x.from, x.m, x.u, x.from.c === x.to.c && x.from.r === x.to.r);
        return { c: p.c, r: p.r, d: ((p.a % 4) + 4) % 4 };
    }
    const e = x.u <= 0 ? 0 : x.u >= 1 ? 1 : x.u * x.u * (3 - 2 * x.u), turn = ((x.to.d - x.from.d + 6) % 4) - 2;
    return { c: x.from.c + (x.to.c - x.from.c) * e, r: x.from.r + (x.to.r - x.from.r) * e, d: (((x.from.d + turn * Math.min(1, x.u * 1.5)) % 4) + 4) % 4 };
}
/** A helm's motion just now (as Helm.now draws it): a bot's, or yours, sent to a race's room (src/race-net.ts). */
export function helmMotion(h) {
    const c = h.cur;
    if (!c || c.done)
        return { from: { ...h.pose }, to: { ...h.pose }, m: 'F', u: 0 };
    return { from: { ...c.from }, to: { ...c.to }, m: c.m, u: Math.min(1, h.t / c.secs), secs: c.secs };
}
/** A route by its plan (the long way's hops the zigzag's headwinds on leg 4; the rest weave through them). */
const planned = (name, ...legs) => {
    const plan = longPlan();
    for (const [leg, id] of legs)
        plan[leg] = id;
    return { name, plan, cuts: cutsOf(plan), gap: gapOf(plan) };
};
export const ROUTES = [
    planned('long', [3, 'zigzag']),
    planned('gap-run', [0, 'run']),
    planned('gap-combo', [0, 'quad']),
    planned('gap-shot', [0, 'shoot']),
    planned('bribe', [0, 'bribe']),
    planned('headwind', [1, 'headwind']),
    planned('doubles', [1, 'double'], [4, 'triple']),
    planned('whirls', [2, 'whirls']),
    planned('rocks', [2, 'rocks']),
    planned('forage', [2, 'forage']),
    planned('locks', [3, 'locks']),
    planned('crane', [4, 'crane']),
    planned('door', [1, 'door']),
    planned('every', [0, 'bribe'], [1, 'double'], [2, 'whirls'], [3, 'locks'], [4, 'crane']),
];
export const STYLES = [
    { name: 'peaceful', fire: false },
    { name: 'opportunist', fire: true },
    { name: 'aggressive', fire: true, reload: true },
    { name: 'cautious', fire: true, caution: 30 },
];
const byName = (list, name) => {
    const x = list.find((y) => y.name === name);
    if (!x)
        throw new Error(`no ${name}`);
    return x;
};
export const route = (name) => byName(ROUTES, name);
export const style = (name) => byName(STYLES, name);
/** Back yourself on your puzzles (RACE.md §1): a racer takes the route of the puzzle she's best at, a
    level better at it than at the rest (the long way's is Sailing on the pilot, the gap's its combo, its
    Gunnery or the patches as she runs it, the doubles' the Doubles). Every shortcut at once is an
    all-rounder's, a jack of all trades: no better at any, and a little slower at each than at her own skill
    (SIM.JACK: nobody's quite as sharp at every puzzle). (12 Nov: with every stopped puzzle sized about the
    same, an all-rounder at her own skill at them all won 46% of her races, nearly twice her share.) */
export const bestAt = (e) => (e.route.name === 'every' ? e.skill : SKILLS[Math.min(SKILLS.length - 1, SKILLS.indexOf(e.skill) + 1)]);
const STATE = { sail: 'sailing', stop: 'puzzling', wait: 'waiting', trip: 'carried', daze: 'dazed', done: 'finished' };
/* ---- Where a bot is ----
   Under way, where her helm has her: on a square, or on a move between two (motion). Off it, on the square
   she's stopped at, waiting at, or walked to a square at a time: into the spot she stops at, through a
   shortcut along its own water (TRIPS: the gap, the lock, the crane's swing over the neck...) from where
   she was to where she rejoins the long way, or swept back by a snake. */
/** The squares a shortcut's trip goes by, between where she starts it and where she rejoins the long way;
    the crane's lifted (`air`), the starlit door's under the course (`under`: nobody sees her). */
const TRIPS = {
    guns: { by: G },
    wreck: { by: [WR] },
    headwind: { by: [] },
    double: { by: D2 },
    whirls: { by: [[M.c, M.r + 1], RC.WHIRLS.OUT] },
    rocks: { by: [K.WALL[0], ...K.GAP, K.OUT] },
    forage: { by: [...F.BARRIER, ...F.GAP, F.OUT] },
    locks: { by: [L[0].at, ...RC.POUND.at, L[1].at] },
    crane: { by: [E.LEDGE, [E.TO.c, E.TO.r]], air: true },
    triple: { by: T3.map(([c, r]) => [c, r]) },
    zigzag: { by: [] },
    door: { by: [], under: true },
};
/** Along a run of squares by arc length, `u` of the way (0 to 1): where, and the way it faces. */
function along(pts, u) {
    const len = pts.slice(1).map((b, k) => Math.abs(b[0] - pts[k][0]) + Math.abs(b[1] - pts[k][1]));
    let left = Math.max(0, Math.min(1, u)) * len.reduce((n, x) => n + x, 0);
    for (let k = 0; k < len.length; k++) {
        const [a, b] = [pts[k], pts[k + 1]];
        if (left <= len[k] || k === len.length - 1) {
            const w = len[k] ? Math.min(1, left / len[k]) : 1, dc = b[0] - a[0], dr = b[1] - a[1];
            const d = Math.abs(dr) >= Math.abs(dc) ? (dr >= 0 ? 0 : 2) : dc > 0 ? 1 : 3;
            return { c: a[0] + dc * w, r: a[1] + dr * w, d };
        }
        left -= len[k];
    }
    return { c: pts[0][0], r: pts[0][1], d: 0 };
}
/** The column she comes down onto the first leg at from spot `spot`: below it, or round the field's hop
    (its rocks: LAY.RACE.FIELD.HOP), whichever side's nearer. */
const HOP = RC.FIELD.HOP;
const downAt = (spot) => (spot < HOP.c0 - 1 || spot > HOP.c1 + 1 ? spot : spot - HOP.c0 < HOP.c1 - spot ? HOP.c0 - 2 : HOP.c1 + 2);
/** Where the long way joins her way down from spot `spot` (seconds round it): she meets the first leg
    below her spot (or beside the hop), or (left of the long way's own spot) runs along it to there. */
const joinTau = (spot) => tauAt(0, Math.min(RC.BUOYS[0].at[0] + 0.5, Math.max(downAt(spot), RACE.LONG_SPOT)));
/** The way down through the start's field from her spot, `tau` seconds round the long way (from `tau0`,
    where she started), as the course's own reckoning has it (startTau): straight down, round the hop's
    rocks if they're below her. (The bots sail it by the pilot now: this is only the reckoning.) */
export function startPose(spot, tau0, tau) {
    const S0 = S[0].r, down = downAt(spot), pts = [[spot, RC.LINE.r]];
    if (down !== spot)
        pts.push([spot, HOP.FROM], [down, HOP.FROM]);
    pts.push([down, S0]);
    if (down < RACE.LONG_SPOT)
        pts.push([RACE.LONG_SPOT, S0]);
    const tJ = joinTau(spot);
    return along(pts, (tau - tau0) / Math.max(1e-9, tJ - tau0));
}
/** How far round the long way a racer at `p` is (seconds of it), going by the stretch she's on, or the
    last she's below (in a spit, through a shortcut), or how far down the start's field she's got. */
export function progressAt(p) {
    const r = Math.round(p.r);
    if (r < S[0].r)
        return ((p.r - RC.LINE.r) / (S[0].r + 0.5 - RC.LINE.r)) * tauAt(0, RACE.LONG_SPOT);
    let s = S.length - 1;
    while (s > 0 && S[s].r > r)
        s--;
    const row = routeRow(s), seg = segs.find((x) => x.a[1] === row && x.b[1] === row);
    const lo = Math.min(seg.a[0], seg.b[0]), hi = Math.max(seg.a[0], seg.b[0]);
    const onIt = r === S[s].r || r === S[s].r + 1;
    // (below its rows, in the spit beyond: past its far end, as far as she can be on it)
    const c = onIt ? Math.max(lo, Math.min(hi, p.c)) : S[s].d === 1 ? hi : lo;
    return tauAt(s, c);
}
/** How far round the long way each of the pilot's pins is. */
const PIN_TAU = LONG_PINS.map((p) => progressAt({ c: p.at[0], r: p.at[1] }));
/** The square on the long way `tau` seconds round it (a leg's first row), and the way along it. */
function squareAt(tau) {
    const p = routePose(Math.max(0, Math.min(SIM.LONG, tau)));
    return { c: Math.round(p.c), r: Math.round(p.r), d: p.d };
}
/** Where she leaves the long way for each shortcut: the plan's ways in (src/race-plan.ts, WAY_IN), the same for every racer. */
const ENTRY = WAY_IN;
/** A race set going: its bots (o.racers) on `o.field` if one's given (the den's: started, you racer 0,
    moved by the helm, the bots racers 1 up), else on a field of their own. `sea`: a sea to lay its start's
    field on (every shortcut's way shut: simulate's own, kept from race to race), else a fresh one. */
export function sail(o, sea) {
    const rand = seeded(o.seed), mode = o.mode ?? RACE.GAP.MODE, chains = o.chains ?? true, snakes = o.snakes ?? true;
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
    const draw = (mean, skill) => mean * SIM.SKILL[skill] * Math.exp(SIM.SPREAD * gauss() - SIM.SPREAD ** 2 / 2);
    const cuts = Object.fromEntries(Object.entries(CUTS).map(([k, c]) => {
        const saves = o.saves?.[k];
        return [k, saves === undefined ? c : { ...c, saves, tOut: c.tIn + c.trip + saves }];
    }));
    const you = o.you ?? !!o.field, first = o.humans ?? (you ? 1 : 0);
    const field = o.field ?? new Field(o.racers.map((r) => `${r.route.name}/${r.style.name}`), courseSea(), 0);
    if (!o.field)
        field.start();
    if (o.shots !== undefined)
        for (const r of field.racers)
            r.shots = o.shots;
    // The race's own sea down the start's field (its slow winds and whirlpools, from its seed), and its
    // spots: each racer sets off from hers, a move later for each racer already starting beside her.
    const sea0 = sea ? (sea.layField(fieldFor(o.seed)), sea) : fieldSea(o.seed);
    const spots = o.racers.map((r) => r.spot ?? RACE.LONG_SPOT);
    const sailorFor = (i, skill, pace) => (o.boards ? boardSailor(SAILOR.DROP[skill] * pace, o.seed * 31 + i * 7 + 1) : drawnSailor(SAILOR.DROP[skill] * pace, rand));
    const botFor = (i, e, at, start) => {
        const best = bestAt(e), pace = 1 + SIM.STEER * gauss();
        return {
            i, route: e.route, style: e.style, skill: e.skill, best,
            tau: progressAt(at), mode: 'sail', was: 'sail', spot: Math.round(at.c), delay: 0,
            helm: new Helm(at.r < S[0].r ? sea0 : courseWater(), at), pin: '', goal: null, walk: null, sq: { ...at }, tripFull: 0, stuck: 0, plan: null, came: 0, carried: [],
            sailor: sailorFor(i, e.route.name === 'long' ? best : e.skill, pace),
            cut: null, stage: 0, work: 0, full: 0, tries: 0, since: 0, lost: 0, move: null, combo: false, ready: new Set(), daze: 0, trip: 0, waited: 0,
            hopped: false, hop: 0, lefts: 0, purse: false, paid: false, owed: 0, done: new Set(), stop: null, inLine: new Set(), vegas: false, exit: 0,
            choices: [...e.route.plan], cuts: [...e.route.cuts], gap: e.route.gap, changes: [],
            res: { route: e.route.name, style: e.style.name, skill: e.skill, start, spot: Math.round(at.c), time: 0, place: 0, hitsTaken: 0, hitsGiven: 0, swept: [], cuts: [], exposed: [], rocks: { hits: 0, through: false, free: false } },
        };
    };
    const bots = o.racers.map((r, k) => {
        const b = botFor(k + first, r, spotPose(spots[k]), k);
        b.delay = SIM.JOSTLE * spots.slice(0, k).filter((c) => Math.abs(c - spots[k]) <= 1).length;
        return b;
    });
    const botOf = (i) => bots.find((b) => b.i === i);
    /** The players still sailing their own sloops (not home, not taken over by a bot). */
    const players = () => field.racers.slice(0, first).filter((r) => r.state !== 'finished' && !botOf(r.i));
    /** What a second of her time is worth in Sailing on the pilot (seconds round the long way), on average:
        what a shortcut's saving is reckoned against (her gusts themselves carry her: src/race-sailor.ts). */
    const sailWorth = (b) => (chains ? gustRate(b.sailor.every) * (PACE - SAIL.PUSH) : 0);
    // The gap's guns: hits each has taken, quiet till, loading; roused; whom each has holed.
    const need = mode === 'shared' ? 1 : RACE.GAP.HARD;
    const guns = RC.GUNS.at.map((at) => ({ at, quiet: 0, hits: 0, wait: 0 }));
    let roused = false;
    const scored = new Set();
    const live = (g) => g.hits < CHECK.WRECK && g.quiet <= 0;
    const grace = new Map();
    const shots = (b) => field.racers[b.i].shots;
    const patchTime = (b, skill = b.skill) => draw(PATCH.PIECES * SIM.PUZZLE.piece, skill);
    let events = [];
    for (const b of bots) {
        if (b.gap === 'combo')
            b.move = { kind: 'combo', left: draw(SIM.PUZZLE.combo, b.best) };
        if (b.gap === 'shot' && shots(b) < 2 * need)
            b.move = { kind: 'load', left: draw(SIM.PUZZLE.load, b.best) };
        if (b.gap)
            b.res.cuts.push({ id: 'guns', done: false, saved: 0 });
        // (the rocks' route loads what it'll fire at them on the move, from the gun)
        if (b.cuts.includes('rocks') && shots(b) < RACE.ROCKS.HITS)
            b.move = { kind: 'load', left: draw(SIM.PUZZLE.load, b.best) };
    }
    /* Her helm, and off it. */
    /** Under way on her helm (or dazed there, holding). */
    const onHelm = (b) => b.mode === 'sail' || (b.mode === 'daze' && b.was === 'sail') || b.mode === 'done';
    /** The square she's on (her helm's, under way; else where she's sat or been walked to). */
    const here = (b) => (onHelm(b) ? { ...b.helm.pose } : { ...b.sq });
    /** Back on her helm at `at`, the pilot to give her a pin; on the course's own sea once she's down off the
        start's field. */
    const toHelm = (b, at) => {
        if (at.r >= S[0].r)
            b.helm.sea = courseWater();
        b.helm.moor(at);
        b.pin = '';
        b.walk = null;
        b.stuck = 0;
        b.plan = null;
    };
    /** Walked off her helm along these squares (from where she is), each step `secs`. */
    const walk = (b, to, secs, total = 0) => {
        const at = here(b), pts = unitSteps([[at.c, at.r], ...to]);
        b.sq = { c: pts[pts.length - 1][0], r: pts[pts.length - 1][1], d: at.d };
        b.walk = pts.length > 1 ? { pts, t: 0, secs: secs ?? total / (pts.length - 1), d: at.d } : null;
        if (b.walk)
            b.sq.d = walkAt({ ...b.walk, t: b.walk.secs * (pts.length - 1) }).to.d;
    };
    /** How she's moving now. */
    const motionOf = (b) => {
        if (b.walk)
            return walkAt(b.walk);
        if (onHelm(b))
            return helmMotion(b.helm);
        // (rowing up the headwind gap as she goes: a square at a time, a stroke's pull and a rest)
        if (b.mode === 'stop' && b.cut?.id === 'headwind') {
            const x = Math.max(0, Math.min(B.length - 1, (1 - b.work / Math.max(1e-9, b.full)) * (B.length - 1))), k = Math.min(B.length - 2, Math.floor(x));
            const u = Math.max(0, Math.min(1, (x - k - 0.5) * 2)), [c0, r0] = B[k], [c1, r1] = B[k + 1], d = headOf([c0, r0], [c1, r1], 0);
            return { from: { c: c0, r: r0, d }, to: { c: c1, r: r1, d }, m: 'W', u };
        }
        return { from: { ...b.sq }, to: { ...b.sq }, m: 'F', u: 0 };
    };
    const poseOf = (b) => motionPose(motionOf(b));
    /** Everyone still racing, how far round: the bots, and you. */
    const racing = () => [
        ...bots.filter((x) => x.mode !== 'done').map((x) => ({ b: x, tau: x.tau })),
        ...players().map((r) => ({ b: null, tau: progressAt(r.pose) })),
    ];
    const rankOf = (b) => {
        const all = racing();
        return { rank: all.filter((x) => x.b !== b && x.tau > b.tau + SIM.AHEAD).length, of: all.length };
    };
    const behind = (b, secs) => racing().some((x) => x.b !== b && x.tau <= b.tau + SIM.AHEAD && x.tau > b.tau - secs);
    const hitBot = (t, by) => {
        if (!field.hit(t.i, by))
            return false;
        t.res.hitsTaken++;
        const s = by >= 0 ? botOf(by) : undefined;
        if (s)
            s.res.hitsGiven++;
        if (t.stop)
            t.stop.hit = true;
        if (t.mode === 'stop' && t.cut && (t.cut.id === 'whirls' || (t.cut.id === 'door' && t.stage === 1 && t.vegas)))
            t.work += (t.full - t.work) * SIM.HIT_LOSS;
        if (t.mode !== 'daze')
            t.was = t.mode;
        // (holed under way, she finishes the move she's on and holds there till she's patched, as yours does)
        if (t.was === 'sail')
            t.helm.hit();
        t.mode = 'daze';
        t.daze = patchTime(t);
        return true;
    };
    /** A snake has her: swept back to `tau`, a square at a time, the sweep's seconds all told. */
    const swept = (b, snake, tau, secs) => {
        b.res.swept.push(snake);
        const at = here(b), to = squareAt(tau);
        walk(b, [[to.c, at.r], [to.c, to.r]], null, secs);
        b.sq.d = at.d;
        b.tau = tau;
        b.mode = 'trip';
        b.trip = secs;
        b.tripFull = secs;
        b.cut = null;
        b.stop = null;
    };
    /** Where she rejoins the long way out of shortcut `c`. */
    const tOutOf = (_b, c) => c.tOut;
    const record = (b, id, done) => {
        const c = cuts[id];
        let r = b.res.cuts.find((x) => x.id === id && !x.done && x.saved === 0);
        if (!r) {
            r = { id, done, saved: 0 };
            b.res.cuts.push(r);
        }
        r.done = done;
        if (id === 'door' && done)
            r.exit = b.exit;
        // (what it saved: the long way between, less the time it took her from the turn-off, the Sailing she
        // missed loading shots for it, and the Sailing on the pilot she'd have done meanwhile, on average)
        r.saved = (done ? tOutOf(b, c) - c.tIn : 0) - b.since * (1 + sailWorth(b)) - b.lost;
        // (the bribe: what hauling its coins up cost her is the gap's)
        if (id === 'guns') {
            r.saved -= b.owed;
            b.owed = 0;
        }
        b.since = 0;
        b.lost = 0;
    };
    /** Stopped at shortcut `c` to puzzle `work` seconds: walked into its spot first, a move a square. */
    const go = (b, c, work) => {
        walk(b, [[c.at.c, c.at.r]], SAIL.MOVE + SAIL.PAUSE);
        // (those moves are the start of her trip through, as the helm measured it from the long way: CUTS)
        b.came += b.walk ? b.walk.secs * (b.walk.pts.length - 1) : 0;
        b.sq = { ...c.at };
        b.cut = c;
        b.stage = 0;
        b.work = work;
        b.full = work;
        b.tries = 0;
        b.mode = 'stop';
        if (!c.sheltered) {
            b.stop = { id: c.id, ...rankOf(b), hit: false };
            b.res.exposed.push(b.stop);
        }
    };
    const firstWork = (b, c) => (b.route.name === 'every' ? SIM.JACK : 1) * puzzleWork(b, c);
    const puzzleWork = (b, c) => {
        switch (c.id) {
            case 'headwind': return draw(SIM.PUZZLE.row, b.best);
            case 'double': return draw(SIM.PUZZLE.double, b.best);
            case 'triple': return draw(SIM.PUZZLE.triple, b.best);
            case 'whirls': return draw(SIM.PUZZLE.vegas, b.best);
            case 'forage': return draw(SIM.PUZZLE.forage, b.best);
            case 'locks': return draw(SIM.PUZZLE.bilge, b.best);
            case 'crane': return draw(CRANE_PIECES * SIM.PUZZLE.piece, b.best);
            case 'door': return draw(SIM.PUZZLE.nav, b.best);
            case 'wreck': return draw(SIM.PUZZLE.haul, b.best);
            default: return 0;
        }
    };
    /** On a trip through a shortcut for `secs`: along its water a square at a time, from where she is to where
        she rejoins the long way (straight on to the leg's row and along it, so she never cuts a corner of the
        land); under the course (the starlit door's tunnel), unseen, put straight there at its end. */
    const tripFor = (b, trip) => {
        const c = b.cut, T = TRIPS[c.id], end = squareAt(tOutOf(b, c)), at = here(b);
        // (less the moves she made into its spot: already part of the trip as the helm measured it)
        const secs = Math.max(trip * 0.4, trip - b.came);
        b.came = 0;
        b.sq = at;
        if (T.under)
            b.walk = null;
        else {
            const pts = [];
            if (T.by.length)
                pts.push([T.by[0][0], at.r], ...T.by);
            const last = pts.length ? pts[pts.length - 1] : [at.c, at.r];
            pts.push([last[0], end.r], [end.c, end.r]);
            walk(b, pts, null, secs);
        }
        b.mode = 'trip';
        b.trip = secs;
        b.tripFull = secs;
    };
    /** Her broadsides at the rocks as she comes by, as many as she has or it takes to bring them down, each
        landing as often as her aim: the seconds it took (her guns run out again between shots). */
    const fireRocks = (b) => {
        let n = 0;
        while (shots(b) > 0 && !rocksDown(field)) {
            field.racers[b.i].shots--;
            n++;
            if (rand() < SIM.AIM[b.best] && field.blast(RACE.ROCKS.HITS))
                b.res.rocks.hits++;
        }
        return Math.max(0, n - 1) * GUNS.RUN_OUT;
    };
    /** She's come to a shortcut she means to take: in, waiting her turn, or (cautious, someone close
        behind) on by. The zigzag's hops are on the move: through, for what her Doubles save. */
    const arrive = (b, c) => {
        b.since = 0;
        b.lost = 0;
        if (c.id === 'zigzag') {
            b.cut = c;
            tripFor(b, c.trip + SIM.ZIGZAG * (1 - HOPS[b.route.name === 'long' ? b.skill : b.best]));
            return true;
        }
        // (a Double's or a Triple's gap: built on the move as she came, she breaks it as she's lined up and
        // hops through; not built yet, she stops at its way in to finish it)
        if (c.id === 'double' || c.id === 'triple') {
            if (b.ready.has(c.id)) {
                b.cut = c;
                through(b, c.trip);
                return true;
            }
            const left = b.move?.kind === 'hop' && b.move.id === c.id ? b.move.left : firstWork(b, c);
            if (b.move?.kind === 'hop')
                b.move = null;
            go(b, c, left);
            return true;
        }
        // (the rocks: down already, through she goes; otherwise her broadsides at them as she comes by, and if
        // they're still up, she stops in the open beside them to load more by Gunnery)
        if (c.id === 'rocks') {
            b.cut = c;
            if (rocksDown(field)) {
                b.res.rocks.through = true;
                b.res.rocks.free = !b.res.rocks.hits;
                through(b, c.trip);
                return true;
            }
            const secs = fireRocks(b);
            if (rocksDown(field)) {
                b.res.rocks.through = true;
                through(b, c.trip + secs);
                return true;
            }
            if (b.style.caution && behind(b, b.style.caution)) {
                b.cut = null;
                change(b, c.id);
                return false;
            }
            go(b, c, secs + draw(SIM.PUZZLE.load, b.best));
            return true;
        }
        if (b.style.caution && !c.sheltered && behind(b, b.style.caution)) {
            change(b, c.id);
            return false;
        }
        if (c.spot && field.claim(b.i, c.spot) === 'wait') {
            // (waiting her turn: the locks' berth, sheltered; otherwise on the leg beside the way in)
            const at = c.id === 'locks' ? { c: RC.BERTH[0], r: RC.BERTH[1], d: 0 } : { ...c.at, c: c.at.c + 1, r: c.at.r - 1 };
            walk(b, [[at.c, at.r]], SAIL.MOVE + SAIL.PAUSE);
            b.cut = c;
            b.mode = 'wait';
            b.waited = 0;
            return true;
        }
        go(b, c, firstWork(b, c));
        return true;
    };
    const through = (b, secs) => { tripFor(b, secs); b.stop = null; };
    const out = (b) => {
        const c = b.cut, end = c ? squareAt(tOutOf(b, c)) : { ...b.sq };
        toHelm(b, end);
        b.mode = 'sail';
        if (!c) {
            b.tau = progressAt(end);
            return;
        } // (a snake's sweep: on from where it put her)
        if (c.spot)
            field.release(b.i, c.spot);
        if (c.id === 'door')
            field.under(b.i, DOOR.FROM, DOOR.EXITS[b.exit].to);
        b.done.add(c.id);
        // (the wreck's coins aboard: what it cost her is counted against the gap she pays them at)
        if (c.id === 'wreck') {
            b.purse = true;
            b.owed = b.since * (1 + sailWorth(b)) + b.lost - (tOutOf(b, c) - c.tIn);
            b.since = 0;
            b.lost = 0;
        }
        else
            record(b, c.id, true);
        b.tau = tOutOf(b, c);
        b.cut = null;
        // (rushing the gap, the tight water past it: one move too many)
        // (rushing it on a combo most of all; run a square at a time, half as often; its guns shot quiet, or
        // their guard paid, she goes through at her leisure)
        const run = b.gap === 'run' || (b.gap === 'bribe' && !b.paid), leisure = b.gap === 'shot' || b.paid;
        if (c.id === 'guns' && snakes && !leisure && rand() < SIM.SNAKE.tight[b.best] * (run ? 0.5 : 1))
            swept(b, 'tight', TIGHT_BACK, sweep(RC.SNAKES.TIGHT.length));
    };
    /** Her plan changed on the leg of shortcut `id`: given up, or put by (a cautious racer with someone close
        behind, a way in she can't sail to): the long way there instead (src/race-plan.ts, fallback). */
    const change = (b, id) => {
        const leg = legOf(id), from = b.choices[leg], to = fallback(leg, from);
        if (from === to || !b.cuts.includes(id))
            return;
        b.choices[leg] = to;
        b.cuts = cutsOf(b.choices);
        b.gap = gapOf(b.choices);
        b.changes.push({ t: field.t, leg, from, to });
    };
    const giveUp = (b) => {
        const c = b.cut;
        if (c.spot) {
            field.release(b.i, c.spot);
            field.leave(b.i, c.spot);
        }
        change(b, c.id);
        b.done.add(c.id);
        record(b, c.id, false);
        toHelm(b, here(b));
        b.cut = null;
        b.mode = 'sail';
        b.stop = null;
    };
    /** Through the gap, by her route: rushed past on her combo, past its guns quietened, its guard paid
        (with the wreck's coins aboard: a moment at its gate, and she's towed through), or run. */
    const gap = (b) => {
        const c = cuts.guns;
        if (b.cut !== c) {
            b.since = 0;
            b.cut = c;
        }
        if (b.gap === 'bribe' && b.purse) {
            b.paid = true;
            return through(b, BRIBE.PAY + TOW);
        }
        if (b.gap === 'combo') {
            if (b.combo)
                return through(b, c.trip);
            // (not built yet: stop short, off its marks, and finish it)
            go(b, c, b.move?.left ?? 0);
            b.move = null;
            return;
        }
        if (b.gap === 'shot') {
            const short = 2 * need - shots(b);
            if (short > 0) {
                go(b, c, (b.move?.left ?? draw(SIM.PUZZLE.load, b.best)) + Math.max(0, short - 1) * draw(SIM.PUZZLE.load, b.best));
                b.move = null;
                return;
            }
            field.racers[b.i].shots -= 2 * need;
            for (const g of guns) {
                g.hits += need;
                g.quiet = g.hits >= CHECK.WRECK ? 0 : CHECK.QUIET;
            }
            roused = true;
            return through(b, SIM.GAP.RUN);
        }
        // (run: a live gun that hasn't holed her yet may, once, as she goes through square by square)
        let secs = SIM.GAP.RUN;
        const g = guns.findIndex((x, k) => live(x) && !scored.has(`${k},${b.i}`));
        if (g >= 0 && rand() < SIM.GAP.RUN_HIT) {
            scored.add(`${g},${b.i}`);
            secs += patchTime(b, b.best);
            b.res.hitsTaken++;
            events.push({ kind: 'shot', racer: -1, cells: [], hit: b.i });
        }
        through(b, secs);
    };
    /** A puzzle done at a shortcut: through, or (a Vegas) through if it comes off. */
    const solved = (b) => {
        const c = b.cut;
        if (c.id === 'guns') {
            b.stop = null;
            if (b.gap === 'combo')
                b.combo = true;
            else
                field.load(b.i, 2 * need - shots(b));
            return gap(b);
        }
        // (the starlit door opened by her Navigation: through the tunnel she goes, one stretch, up its cleft onto
        // leg 3: back to simple, 12 Nov)
        if (c.id === 'door') {
            b.exit = 0;
            return through(b, DOOR.TRIP);
        }
        // (the rocks: loaded, she fires again; still up, she loads again, or gives up and sails on)
        if (c.id === 'rocks') {
            field.load(b.i);
            const secs = fireRocks(b);
            if (rocksDown(field)) {
                b.res.rocks.through = true;
                return through(b, c.trip + secs);
            }
            if (++b.tries >= SIM.ROCK_LOADS)
                return giveUp(b);
            b.work = b.full = secs + draw(SIM.PUZZLE.load, b.best);
            return;
        }
        if (c.id === 'whirls' && rand() >= SIM.VEGAS[b.best]) {
            if (++b.tries >= SIM.TRIES)
                return giveUp(b);
            b.work = b.full = SIM.BACK.whirls + draw(SIM.PUZZLE.vegas * SIM.RETRY, b.best);
            return;
        }
        through(b, c.trip);
    };
    /** Whether she's playing her Sailing board just now: under way along a leg, heading along it (a gust then
        carries her on round the course), not round a bend (it'd carry her into the spit), nor coming up to the
        trade wind back up the course (it'd carry her into it): there she steers. Nor down the start's field. */
    const sailing = (b) => {
        // (where a gust would start from: once the move she's on, and its trade wind, are done)
        const p = b.helm.gustFrom(), s = stretchAt(p.c, p.r);
        if (s < 0 || p.d !== S[s].d)
            return false;
        return !(s === 2 && !b.hopped && p.c >= LONG_PINS[HOP_PIN].at[0] - 4);
    };
    /** Over the trade wind back up the course: on leg 3 past it, or further on. */
    const pastMid = (p) => p.r >= S[3].r || (p.r >= S[2].r && p.c > MID_C);
    /** Lined up beside the trade wind back up the course: her Double, two squares over it (as yours hops it,
        tests/race-helpers.ts); or a slip, and its loop has her a few squares back, to line up again. */
    const hopIt = (b) => {
        b.hopped = true;
        if (snakes && rand() < SIM.SNAKE.mid[b.best]) {
            swept(b, 'mid', MID_BACK, sweep(RC.SNAKES.MID.length));
            b.hopped = false;
            return;
        }
        b.helm.pose.d = S[2].d;
        b.helm.gust(gustPath(b.helm.sea, b.helm.pose, runFor(2)));
        b.helm.mine = [];
        b.plan = null;
    };
    /** The next shortcut her plan takes before the long way's pin `k`, if any (one she's just past, a few
        squares, she goes back for: she came onto the leg beyond its way in): the plan's rule, every racer's. */
    const goalOf = (b, k) => {
        const id = nextCut(b.cuts, b.done, b.tau, k, PIN_TAU, (x) => cuts[x].tIn, 6 * PACE);
        return id ? cuts[id] : null;
    };
    /** The pilot's chart to a square: down the start's field, this race's own (its field's), handing on to the
        course's below it; on the course, the course's (charted once). */
    const starts = new Map();
    const chartTo = (at, p) => {
        if (p.r >= S[0].r)
            return courseChart(at);
        const k = `${at[0]},${at[1]}`;
        let ch = starts.get(k);
        if (!ch)
            starts.set(k, ch = new PilotChart(sea0, at, RC.LINE.r - 1, S[0].r - 1, (q) => (q.r >= S[0].r ? courseChart(at).secs(q) : Infinity)));
        return ch;
    };
    /** The pilot: for her route's next shortcut's way in, or else the long way's next pin from how far round
        she's got, beside the trade wind back up the course till she's hopped it (and there, she lines up her
        Double). Her next moves are read off its chart, as moves put in: a turn's worth ahead, always. */
    const steer = (b) => {
        const h = b.helm;
        if (!b.hopped && pastMid(h.pose))
            b.hopped = true;
        const k = pinOf(b.tau, b.hopped, PIN_TAU);
        let g = goalOf(b, k);
        // (a shortcut's way in that no sailing gets her to from here, the wind as it blows down the course, when
        // the long way's still open to her: she goes on without it, as a player would, or rows: RACE.md §8)
        while (g && chartTo(ENTRY[g.id], h.pose).secs(h.pose) === Infinity && chartTo(LONG_PINS[k].at, h.pose).secs(h.pose) < Infinity) {
            const id = g.id;
            change(b, id);
            b.done.add(id);
            if (!b.res.cuts.some((x) => x.id === id))
                b.res.cuts.push({ id, done: false, saved: 0 });
            g = goalOf(b, k);
        }
        const at = g ? ENTRY[g.id] : LONG_PINS[k].at, goal = g ? g.id : `pin ${k}`;
        b.goal = g?.id ?? null;
        if (!g && k === HOP_PIN && h.pose.c === at[0] && h.pose.r === at[1] && h.idle() && !h.gusts.length) {
            b.hop = draw(SIM.HOP, b.skill);
            return;
        }
        if (goal !== b.pin) {
            b.pin = goal;
            h.mine = [];
            b.plan = null;
        }
        if (h.mine.length >= SAIL.SLOTS)
            return;
        // (from where the moves put in leave her; between turns with none, from where she is: a whirlpool or a
        // slow wind may have moved her, resting)
        let p = h.mine.length || h.slot >= 0 ? b.plan : null;
        if (!p) {
            p = h.after();
            for (const m of h.mine)
                p = h.sea.sail(p, m).to;
        }
        const got = chartTo(at, p).moves(p, SAIL.SLOTS - h.mine.length);
        h.mine.push(...got.moves);
        b.plan = got.at;
    };
    function step(dt) {
        events = [];
        for (const g of guns) {
            g.quiet = Math.max(0, g.quiet - dt);
            g.wait = Math.max(0, g.wait - dt);
        }
        for (const [k, v] of grace)
            grace.set(k, v - dt);
        for (const b of bots) {
            if (b.mode === 'done')
                continue;
            if (b.cut)
                b.since += dt;
            if (b.mode === 'daze') {
                b.daze -= dt;
                if (b.was === 'sail')
                    b.helm.tick(dt);
                if (b.daze <= 0) {
                    field.patched(b.i);
                    b.mode = b.was;
                    b.helm.hole = null;
                    grace.set(b.i, SAIL.GRACE);
                }
            }
            else if (b.mode === 'trip') {
                b.trip -= dt;
                if (b.walk)
                    b.walk.t += dt;
                if (b.trip <= 0)
                    out(b);
            }
            else if (b.mode === 'wait') {
                if (b.walk) {
                    b.walk.t += dt;
                    if (walkDone(b.walk))
                        b.walk = null;
                }
                b.waited += dt;
                if (field.holder(b.cut.spot) === b.i)
                    go(b, b.cut, firstWork(b, b.cut));
                else if (b.waited > SIM.WAIT)
                    giveUp(b);
            }
            else if (b.mode === 'stop') {
                // (walked into her spot first, then she puzzles)
                if (b.walk) {
                    b.walk.t += dt;
                    if (walkDone(b.walk))
                        b.walk = null;
                    continue;
                }
                b.work -= dt;
                if (b.work <= 0)
                    solved(b);
            }
            else if (b.mode === 'sail') {
                // On her spot on the line still, giving way to a racer beside her.
                if (b.delay > 0) {
                    b.delay -= dt;
                    continue;
                }
                // Puzzling on the move: loading a shot by Gunnery, or building a combo for a gap (on her Sailing
                // board, its clears carrying her as ever).
                if (!b.move && b.style.reload && shots(b) < FIELD.SHOTS)
                    b.move = { kind: 'load', left: draw(SIM.PUZZLE.load, b.skill) };
                // (the next Double or Triple her route hops, built on the move, once the gap's combo's done with)
                const hopId = b.cuts.find((id) => (id === 'double' || id === 'triple') && !b.done.has(id) && !b.ready.has(id));
                if (!b.move && hopId && (b.gap !== 'combo' || b.done.has('guns')))
                    b.move = { kind: 'hop', id: hopId, left: draw(SIM.PUZZLE[hopId], b.best) };
                const loading = b.move?.kind === 'load';
                if (b.move) {
                    b.move.left -= dt;
                    if (b.move.left <= 0) {
                        if (b.move.kind === 'combo') {
                            b.combo = true;
                            b.move = null;
                        }
                        else if (b.move.kind === 'hop') {
                            b.ready.add(b.move.id);
                            b.move = null;
                        }
                        else {
                            field.load(b.i);
                            const rocks = b.cuts.includes('rocks') && !b.done.has('rocks') && !rocksDown(field) ? RACE.ROCKS.HITS - field.rocks - shots(b) : 0;
                            const short = b.gap === 'shot' && !b.done.has('guns') ? 2 * need - shots(b) : rocks > 0 ? rocks : b.style.reload ? FIELD.SHOTS - shots(b) : 0;
                            b.move = short > 0 ? { kind: 'load', left: draw(SIM.PUZZLE.load, b.gap === 'shot' ? b.best : b.skill) } : null;
                        }
                    }
                }
                // (loading shots for the gap, the Sailing she isn't doing counts against the gap)
                if (loading && b.gap && !b.done.has('guns'))
                    b.lost += dt * sailWorth(b);
                // (lining up her Double at the trade wind back up the course: she's held there till it's timed)
                if (b.hop > 0) {
                    b.hop -= dt;
                    if (b.hop <= 0)
                        hopIt(b);
                    continue;
                }
                // Her Sailing on the pilot: each drop's clear, its gust carrying her on there and then.
                // (down on the course: through the start's field she's steering, not Sailing. After a gust, the rest of
                // the turn she'd put in is let go, and she puts in her next moves from where it left her)
                if (chains && !loading && sailing(b)) {
                    for (const steps of b.sailor.tick(dt)) {
                        if (steps <= 0)
                            continue;
                        const from = b.helm.gustFrom(), got = carry(b.helm, runFor(steps));
                        b.carried.push({ t: field.t, steps, from, ...got });
                        if (!got.went)
                            continue;
                        const h = b.helm;
                        h.letGo();
                        b.plan = null;
                    }
                }
                steer(b);
                if (b.hop > 0)
                    continue;
                const was = b.tau;
                b.helm.tick(dt);
                if (b.helm.pose.r >= S[0].r && b.helm.sea !== courseWater())
                    b.helm.sea = courseWater();
                b.tau = progressAt(b.helm.pose);
                // (nowhere the pilot can take her: a last resort, walked on along the long way)
                b.stuck = !b.helm.cur && b.helm.slot < 0 && !b.helm.mine.length && !b.helm.gusts.length ? b.stuck + dt : 0;
                if (b.stuck > 8) {
                    const to = squareAt(b.tau + 3 * PACE);
                    walk(b, [[to.c, b.helm.pose.r], [to.c, to.r]], SAIL.MOVE);
                    b.mode = 'trip';
                    b.cut = null;
                    b.trip = b.tripFull = (b.walk ? b.walk.pts.length - 1 : 0) * SAIL.MOVE;
                    b.tau = progressAt(to);
                    continue;
                }
                // (come to a shortcut's way in: sailing past it, or onto it, the pilot having brought her there)
                const there = b.goal ? b.helm.pose.c === ENTRY[b.goal][0] && b.helm.pose.r === ENTRY[b.goal][1] : false;
                const comes = (c) => (was < c.tIn && b.tau >= c.tIn) || (there && b.goal === c.id);
                if (b.tau === was && !there)
                    continue;
                if (b.gap && !b.done.has('guns') && comes(cuts.guns)) {
                    gap(b);
                    continue;
                }
                // (the left-hand trade wind's loops: a careless turn at a left-hand bend, or on the run home, and she's
                // carried a few squares back, to go round again)
                while (b.lefts < LEFT_T.length && LEFT_T[b.lefts] < was)
                    b.lefts++;
                if (snakes && b.lefts < LEFT_T.length && was < LEFT_T[b.lefts] && b.tau >= LEFT_T[b.lefts]) {
                    const at = LEFT_T[b.lefts++];
                    if (rand() < SIM.SNAKE.left[b.skill]) {
                        swept(b, 'left', at - LEFT_BACK * PACE, sweep(LEFT_BACK));
                        continue;
                    }
                }
                // (the rocks down, by anyone's guns: open to every racer who comes to them, a shortcut for free)
                const rk = cuts.rocks;
                if (rocksDown(field) && !b.done.has('rocks') && was < rk.tIn && b.tau >= rk.tIn) {
                    b.done.add('rocks');
                    if (arrive(b, rk))
                        continue;
                }
                const due = b.cuts.map((id) => cuts[id]).filter((c) => c.id !== 'guns' && !b.done.has(c.id) && comes(c)).sort((x, y) => x.tIn - y.tIn)[0];
                if (due) {
                    b.done.add(due.id);
                    if (arrive(b, due))
                        continue;
                }
            }
        }
        // Where each is, and what she's doing, for the field: home once she's over the finish line.
        for (const b of bots) {
            if (b.mode === 'done')
                continue;
            for (const e of field.move(b.i, poseOf(b))) {
                if (e.kind === 'finish')
                    b.mode = 'done';
                if (e.kind === 'finish')
                    events.push(e);
            }
            // (at the finish line's pin, home, should the field have missed a stretch of hers)
            const fin = LONG_PINS[LONG_PINS.length - 1].at;
            if (b.mode === 'sail' && b.helm.pose.c === fin[0] && b.helm.pose.r === fin[1]) {
                events.push(...field.home(b.i));
                b.mode = 'done';
            }
            // (walked into the spot she'll stop at, or her turn's berth, she's under way still: not sat there yet)
            if (b.mode !== 'done')
                field.racers[b.i].state = b.walk && (b.mode === 'stop' || b.mode === 'wait') ? 'sailing' : STATE[b.mode];
        }
        // The gap's guns, roused: an aimed shot on a racer in reach each time one's loaded, till nobody's near.
        if (roused) {
            const near = (b, c, r, n) => Math.max(Math.abs(field.racers[b.i].pose.c - c), Math.abs(field.racers[b.i].pose.r - r)) <= n;
            const [gc, gr] = RC.GUNS.gap;
            if (!bots.some((b) => b.mode !== 'done' && near(b, gc, gr, RACE.SIGHT + 1)))
                roused = false;
            for (const g of guns) {
                if (!roused || !live(g) || g.wait > 0)
                    continue;
                const t = bots.find((b) => (b.mode === 'sail' || b.mode === 'stop' || b.mode === 'wait') && !((grace.get(b.i) ?? 0) > 0) && near(b, g.at[0], g.at[1], CHECK.REACH));
                if (!t)
                    continue;
                g.wait = RACE.GAP.AIMED_RELOAD;
                if (rand() < (t.mode === 'sail' ? SIM.GAP.AIMED_HIT : SIM.GAP.STILL_HIT) && hitBot(t, -1))
                    events.push({ kind: 'shot', racer: -1, cells: [], hit: t.i });
            }
        }
        // Broadsides: each that means to fires on a racer sitting still (puzzling, or waiting her turn: a bot,
        // or you), once as it goes by, if it has a shot (not the gap's shot, keeping hers for its guns).
        for (const b of bots) {
            if (b.mode !== 'sail' || !b.style.fire || (b.gap === 'shot' && !b.done.has('guns')) || (b.cuts.includes('rocks') && !b.done.has('rocks')))
                continue;
            const now = new Set();
            for (const side of ['L', 'R']) {
                const { hit } = field.aim(b.i, side);
                if (hit < 0)
                    continue;
                now.add(hit);
                const st = field.racers[hit].state;
                if (b.inLine.has(hit) || !(st === 'puzzling' || st === 'waiting') || shots(b) <= 0)
                    continue;
                const lands = rand() < SIM.AIM[b.skill];
                const shot = field.fire(b.i, side, false);
                const t = botOf(hit);
                const holed = lands && (t ? hitBot(t, b.i) : field.hit(hit, b.i));
                events.push({ ...shot, hit: holed ? hit : -1 });
            }
            b.inLine = now;
        }
        return events;
    }
    /** A player's sloop taken over (she's dropped out of a race online): a bot of the long way, peaceful,
        from her square; anything she held or waited for let go. */
    const adopt = (i) => {
        const r = field.racers[i];
        if (botOf(i) || r.state === 'finished')
            return false;
        for (const sp of Object.keys(FIELD.SPOTS)) {
            field.release(i, sp);
            field.leave(i, sp);
        }
        r.state = 'sailing';
        const at = { c: Math.round(r.pose.c), r: Math.round(r.pose.r), d: ((Math.round(r.pose.d) % 4) + 4) % 4 };
        const b = botFor(i, { route: route('long'), style: style('peaceful'), skill: 'decent' }, at, i);
        b.hopped = pastMid(at);
        b.lefts = LEFT_T.filter((t) => t <= b.tau).length;
        for (const c of Object.values(cuts))
            if (c.tIn <= b.tau)
                b.done.add(c.id);
        bots.push(b);
        return true;
    };
    return {
        field, step, adopt,
        progress: (i) => { const b = botOf(i); return b ? (b.mode === 'done' ? SIM.LONG : b.tau) : progressAt(field.racers[i].pose); },
        hit: (i, by) => { const b = botOf(i); return b ? hitBot(b, by) : field.hit(i, by); },
        lift: (i) => {
            const b = botOf(i);
            if (!b || b.mode !== 'trip' || !b.cut || !TRIPS[b.cut.id].air)
                return 0;
            return Math.sin(Math.PI * Math.min(1, Math.max(0, 1 - b.trip / Math.max(1e-9, b.tripFull))));
        },
        results: (limit) => bots.map((b) => ({ ...b.res, time: field.racers[b.i].time ?? limit, place: field.racers[b.i].place ?? bots.length })),
        motion: (i) => { const b = botOf(i); return b ? motionOf(b) : null; },
        sailor: (i) => botOf(i)?.sailor ?? null,
        carries: (i) => botOf(i)?.carried ?? [],
        info: (i) => {
            const b = botOf(i);
            if (!b)
                return null;
            return {
                mode: b.mode, was: b.was, cut: b.cut?.id ?? null, stage: b.stage, work: Math.max(0, b.work), full: b.full, tries: b.tries, daze: Math.max(0, b.daze),
                move: b.move ? { ...b.move } : null, hop: Math.max(0, b.hop), coming: (b.mode === 'stop' || b.mode === 'wait') && !!b.walk,
                route: b.route.name, style: b.style.name, best: b.best, skill: b.skill, done: [...b.done], plan: [...b.choices], changes: b.changes.map((x) => ({ ...x })),
            };
        },
    };
}
/** One race, start to finish: each racer's result, in starting order. */
export function simulate(o) {
    // (one race at a time, start to finish: the start's sea is the last race's, its field laid afresh)
    const sea = spare ?? shutWays(new Sea(9));
    spare = null;
    try {
        const run = sail(o, sea), LIMIT = SIM.LONG * 4;
        while (run.field.state === 'on' && run.field.t < LIMIT) {
            run.field.tick(SIM.DT);
            run.step(SIM.DT);
        }
        return run.results(LIMIT);
    }
    finally {
        spare = sea;
    }
}
let spare = null;
/** The den's race (src/den-race.ts, its Race's `drive`): its rivals sailed by bots, each on her favourite
    route in her own style and skill (src/den-rivals.ts, her racer), from her spot on the line; you racer 0
    on the same field, moved by the helm, fired on as any racer is. A fresh seed each race. */
export function simDrive(field, rivals, seed = Math.floor(Math.random() * 2 ** 31)) {
    return sail({ field, seed, racers: rivals.map((r) => ({ route: route(r.racer.route), style: style(r.racer.style), skill: r.racer.skill, spot: r.spot })) });
}
/** The course's fingerprint, as the race's chart records it (tools/race-map.mjs, changelog/race-map.jpg's JPEG
    comment; tests/race-chart.test.ts compares them, 12 Nov: "hopefully we're keeping this [race map] JPEG in
    sync"): a short hash of everything the chart draws from, the den's own course as laid (every square of it)
    and what each shortcut saves. */
export function chartFingerprint(lay = DEFAULT_LAY) {
    const { COURSE: _k, CUSTOM: _c, CODE: _d, ...squares } = lay;
    const s = JSON.stringify({ squares, decent: RACE.DECENT, door: DOOR.SAVES, zigzag: SIM.ZIGZAG, long: SIM.LONG });
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
}
export const zoneOf = (c) => (c < 16 ? 'left' : c <= 20 ? 'gap' : 'right');
/** A standard field of `size` from seed `seed`: each racer a route drawn at random (no two alike), a
    style and a skill drawn at random, and a spot on the line: half go for the field's gap (the quickest
    line, so the crowded one), half anywhere; in a random starting order. */
export function lineUp(size, seed, routes = ROUTES, styles = STYLES) {
    const rand = seeded(seed * 7919 + 13), left = [...routes], out = [];
    const W = RC.LINE.c1 - RC.LINE.c0 + 1;
    for (let k = 0; k < size; k++) {
        out.push({
            route: left.splice(Math.floor(rand() * left.length), 1)[0],
            style: styles[Math.floor(rand() * styles.length)],
            skill: SKILLS[Math.floor(rand() * SKILLS.length)],
            spot: rand() < 0.5 ? 17 + Math.floor(rand() * 3) : RC.LINE.c0 + Math.floor(rand() * W),
        });
    }
    return out;
}
/** Races `races` standard fields of `size`, seeds from `seed` (1) up, and tallies them. */
export function run(races, size, opts = {}) {
    const rep = {
        races, size, byRoute: {}, byStyle: {}, bySkill: {}, bySpot: {}, bySnake: {}, cuts: {},
        exits: DOOR.EXITS.map(() => ({ decent: 0, good: 0, great: 0, wins: 0 })),
        rocks: { hit: 0, through: 0, free: 0, hitWins: 0, throughWins: 0, freeWins: 0, down: 0 },
        byPosition: { leader: { n: 0, hit: 0, wins: 0 }, pack: { n: 0, hit: 0, wins: 0 }, last: { n: 0, hit: 0, wins: 0 } },
    };
    const tally = (t, k, r) => {
        const x = (t[k] ??= { n: 0, wins: 0, time: 0, hitsTaken: 0, hitsGiven: 0 });
        x.n++;
        x.wins += r.place === 1 ? 1 : 0;
        x.time += r.time;
        x.hitsTaken += r.hitsTaken;
        x.hitsGiven += r.hitsGiven;
    };
    for (let k = 0; k < races; k++) {
        const seed = (opts.seed ?? 1) + k;
        const results = simulate({ ...opts, racers: lineUp(size, seed, opts.routes, opts.styles), seed });
        if (results.reduce((n, r) => n + r.rocks.hits, 0) >= RACE.ROCKS.HITS)
            rep.rocks.down++;
        for (const r of results) {
            tally(rep.byRoute, r.route, r);
            tally(rep.byStyle, r.style, r);
            tally(rep.bySkill, r.skill, r);
            tally(rep.bySpot, zoneOf(r.spot), r);
            for (const s of new Set(r.swept)) {
                const x = (rep.bySnake[s] ??= { n: 0, wins: 0 });
                x.n++;
                x.wins += r.place === 1 ? 1 : 0;
            }
            for (const e of r.exposed) {
                const p = rep.byPosition[e.rank === 0 ? 'leader' : e.rank === e.of - 1 ? 'last' : 'pack'];
                p.n++;
                p.hit += e.hit ? 1 : 0;
                p.wins += r.place === 1 ? 1 : 0;
            }
            for (const c of r.cuts) {
                const x = (rep.cuts[c.id] ??= { tried: 0, done: 0, saved: { decent: { n: 0, secs: 0 }, good: { n: 0, secs: 0 }, great: { n: 0, secs: 0 } } });
                x.tried++;
                x.done += c.done ? 1 : 0;
                x.saved[r.skill].n++;
                x.saved[r.skill].secs += c.saved;
                if (c.exit !== undefined) {
                    const e = rep.exits[c.exit];
                    e[r.skill]++;
                    e.wins += r.place === 1 ? 1 : 0;
                }
            }
            const won = r.place === 1 ? 1 : 0, R = rep.rocks;
            if (r.rocks.hits) {
                R.hit++;
                R.hitWins += won;
            }
            if (r.rocks.through) {
                R.through++;
                R.throughWins += won;
            }
            if (r.rocks.free) {
                R.free++;
                R.freeWins += won;
            }
        }
    }
    return rep;
}
