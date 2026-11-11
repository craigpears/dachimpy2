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
   - The course, as the bots see it: the long way's route (LONG_ROUTE, from the long way's own spot on the
     starting line), sailed at the pace that brings her round in the time the helm takes the long way
     (SIM.LONG, measured by the helm; the test checks it). Each racer's progress is how far round the long
     way she's got, in seconds of it (tau). Under way, she's on a leg's first row; the second is for
     passing a sloop that's stopped.
   - The start: each racer picks a spot on the starting line (Entrant.spot), and gets through the start's
     field in the time the helm takes from there (SIM.SPOTS, measured), ahead of or behind the long way's own.
     The quickest line is the crowded one: racers starting beside each other jostle (SIM.JOSTLE).
   - Each shortcut (CUTS): where she leaves the long way and where she rejoins it, from LAY.RACE; her own
     trip through (the gust, the crane, the tunnel, the locks' water and gates, the gap's light airs);
     and what it saves, the long way between less the trip (as tests/den-race.test.ts measures it with
     the helm). Where she sits to puzzle, if she stops, and whether that's sheltered.
   - The snakes (SIM.SNAKE): the trade wind back up the course, which every racer hops with a Double (a
     few seconds' timing, SIM.HOP; a slip and it sweeps her back up onto leg 2); the tight water past the
     gun gap (a slip rushing the gap, and she's swept back along leg 2); and the left-hand trade wind at
     the left-hand bends and the run home (a slip, rarely, and she's back at the start).
   - Puzzles aren't played move by move: each takes a time drawn for the racer's skill (decent, good,
     great) round a decent player's (SIM.PUZZLE, sources there), spread as people are (SIM.SPREAD). A Vegas
     comes off only so often (SIM.VEGAS); one that doesn't sends her back to the mouth, to try again
     quicker (the board half built), or after SIM.TRIES she gives up and sails on.
   - On the move she's on the pilot: Sailing on it (any racer, whenever she's free: SIM.CHAIN) carries her
     on ahead by its chains' gusts; a combo built for the gun gap, or her guns loaded by Gunnery, takes
     that time instead, and she sails a little slower while she's at it (SIM.OVERLAP).
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
   - Deterministic: one seed, one race. */
import { LAY, SAIL } from './den-sail.js';
import { RACE, LONG_ROUTE, routeRow } from './den-race.js';
import { Field, FIELD, sheltered, courseSea } from './den-racers.js';
import { DOOR } from './den-door.js';
import { CHECK } from './den-checkpoint.js';
import { CRANE, TRIP } from './den-crane.js';
import { LOCK } from './den-lock.js';
import { PATCH } from './den-patch.js';
import { WIND } from './den-wind.js';
import { runFor, RUN } from './sailing.js';
import { seeded } from './mirror-row.js';
const RC = LAY.RACE, S = RC.STRETCHES;
export const SKILLS = ['decent', 'good', 'great'];
export const SIM = {
    /** Seconds a tick. */
    DT: 0.1,
    /** Seconds the helm takes the long way round, gun to finish line, no puzzle, from the long way's own spot on
        the starting line, hopping the trade wind back up the course with a Double and weaving through the
        zigzag (measured 11 Nov, the course's second pass: 221.9 s, tools/race-measure.mjs;
        tests/race-sim.test.ts measures it again and holds this to it). */
    LONG: 222,
    /** Seconds from each spot on the starting line (LINE.c0 up) to the first bend, through the start's
        field, the pilot's quickest way (measured 11 Nov, tools/race-measure.mjs; tested). The long way's own spot
        (RACE.LONG_SPOT) is the long way's own start. */
    SPOTS: [19.3, 19.0, 18.7, 18.4, 18.1, 17.9, 17.6, 17.3, 17.0, 16.7, 16.5, 16.2, 15.9, 15.6, 15.3, 15.1, 14.8, 14.5, 14.9, 15.5, 18.5, 16.6, 19.6, 21.1, 22.7, 22.4],
    /** Racers starting within a square of each other jostle through the field: each after the first loses
        this many seconds, a move given way. Assumed. */
    JOSTLE: 1.5,
    /** A racer's sailing a little better or worse than another's (the pins she drops, her turns): her
        pace's spread, as a fraction. */
    STEER: 0.02,
    /** Puzzling on the move at something other than Sailing (a combo held for the gun gap, Gunnery), she
        sails on at this fraction of her speed: the pilot sails her, but the bends and the gap want her
        (RACE.md §8: on-the-move time overlaps the sailing). Assumed. */
    OVERLAP: 0.85,
    /** Sailing on the pilot whenever she's free: the squares a second its chains' gusts carry her on, by
        skill. From tools/sail-bots.mjs (40 to 47 squares every 100 drops for the two-ply and builder bots),
        at a drop every 2.5 s or so, less what's lost at the bends: decent 0.06, good 0.09, great 0.12.
        Assumed; CHAIN=0 in the runner tries the race with nobody doing it. */
    CHAIN: { decent: 0.06, good: 0.09, great: 0.12 },
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
        - row: the headwind gap's few squares by mirror strokes: RACE.DECENT.headwind. Assumed.
        - bilge: a lock pumped up: LOCK.COST_UP, the pilot's own reckoning of a go of Bilge (LOCK.WORK
          moves' worth). The user finds it quick.
        - forage: the barrier's bundles of driftwood cleared down off a Foraging board: RACE.DECENT.forage.
          Assumed.
        - piece: a Carpentry piece fitted (the crane's thirteen, CRANE.PARTS; a hit's patch, PATCH.PIECES):
          4 s. Assumed; the user finds Carpentry quick.
        - nav: the starlit door's two small constellations: 53 moves for the planner bot
          (tools/nav-bots.mjs, DOOR=1), at 1.2 s a move.
        - load: a shot loaded by Gunnery: 20 s. Assumed; the user: "just loading the guns and gunning
          takes a long time". */
    PUZZLE: {
        combo: 32, vegas: 52, double: 22, triple: 28, row: RACE.DECENT.headwind,
        bilge: LOCK.COST_UP, forage: RACE.DECENT.forage, piece: 4, nav: 53 * 1.2, load: 20,
    },
    /** A Vegas's chance to come off, a go, by skill; the next go after one that doesn't takes this much of
        a fresh one's time; and the goes before she gives up and sails on. Assumed. */
    VEGAS: { decent: 0.55, good: 0.7, great: 0.85 },
    RETRY: 0.6,
    TRIES: 3,
    /** Seconds back at the mouth after a Vegas that didn't come off: the whirlpools' winds (about ten
        squares at the trade winds' pace, and the whirl); the tunnel's draught (DOOR.BACK). */
    BACK: { whirls: 10 * SAIL.PUSH + 2, door: DOOR.BACK },
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
const SAVES = { ...RACE.DECENT, door: DOOR.SAVES, zigzag: 0 };
const cut = (id, s, c, to, cOut, trip, at, spot = null) => {
    const tIn = tauAt(s, c), saves = id === 'zigzag' ? tauAt(to, cOut) - tIn - trip : SAVES[id];
    return { id, tIn, tOut: tIn + trip + saves, trip, saves, at, sheltered: sheltered(at.c, at.r), spot };
};
const G = RC.GUNS.way, B = RC.HEADWIND, M = RC.WHIRLS.MOUTH, L = RC.LOCKS, E = RC.CRANE, D = RC.DOOR, F = RC.FORAGE, D2 = RC.DOUBLE.WAY, T3 = RC.TRIPLE, Z = RC.ZIGZAG;
/** The course's shortcuts, as the bots take them. Their trips as the helm makes them (tools/race-measure.mjs):
    the gap rushed on a heavy combo's gust, the headwind's squares rowed at the oars' pace, a Double's and a
    Triple's hop and the water either side, the barrier's gap sailed once it's cleared, the locks' (10 s,
    pumped at once), the others' gusts, the crane's trip (TRIP) and the tunnel's (DOOR.TRIP); the zigzag's
    hops, on the long way, what they save (SIM.ZIGZAG). Stopped short of the gap, she waits two squares
    before it, on the leg's second row. */
export const CUTS = {
    guns: cut('guns', 0, G[0][0], 1, G[0][0], 1 + SIM.COMBO * SAIL.PUSH, { c: G[0][0] - 2, r: S[0].r + 1, d: 1 }),
    headwind: cut('headwind', 1, B[0][0], 2, B[B.length - 1][0], 1 + (B.length + 2) * WIND.OARS, { c: B[0][0], r: B[0][1], d: 0 }),
    double: cut('double', 1, D2[0][0], 2, D2[0][0], 3.8, { c: D2[0][0], r: D2[0][1], d: 0 }),
    whirls: cut('whirls', 2, M.c, 3, M.c, runFor(RUN.VEGAS) * SAIL.PUSH, { ...M }),
    forage: cut('forage', 2, F.NOTCH[0], 3, F.NOTCH[0], 6.2, { c: F.NOTCH[0], r: F.NOTCH[1], d: 0 }, 'forage'),
    locks: cut('locks', 3, L[0].at[0], 4, L[0].at[0], 10, { c: L[0].at[0], r: L[0].at[1], d: 0 }, 'lock-up'),
    crane: cut('crane', 4, E.LEDGE[0], 5, E.TO.c, TRIP + 1, { c: E.LEDGE[0], r: E.LEDGE[1], d: 0 }, 'crane'),
    triple: cut('triple', 4, T3[0][0], 5, T3[0][0], 1.7, { c: T3[0][0], r: T3[0][1] - 1, d: 0 }),
    zigzag: { ...cut('zigzag', 3, Z[0][0] + 1, 3, Math.min(...Z.map(([c]) => c)), 0, { c: Z[0][0] + 1, r: S[3].r, d: 3 }), saves: SIM.ZIGZAG },
    door: cut('door', 1, D.OFF[0][0], 3, D.OFF[0][0], DOOR.TRIP, { c: D.OFF[0][0], r: D.OFF[0][1], d: 0 }),
};
CUTS.zigzag.trip = CUTS.zigzag.tOut - CUTS.zigzag.tIn - SIM.ZIGZAG;
/** Where the trade wind back up the course crosses the long way (every racer hops it), and where it puts
    her back if she slips; the tight water past the gun gap, and where it puts her; the left-hand bends and
    the run home, where the left-hand trade wind waits. */
const MID_T = tauAt(2, RC.SNAKES.MID[0][0] - 1), MID_BACK = tauAt(1, RC.SNAKES.MID[0][0]);
const TIGHT_BACK = tauAt(1, SAIL.COLS - 2);
const LEFT_T = [tauAt(1, 3), tauAt(3, 3), tauAt(5, RC.FINISH[0] + 3)];
/** Seconds a sweep takes: a square of wind a trade wind's push. */
const sweep = (n) => n * SAIL.PUSH;
/** How much of what the zigzag's hops can save a racer makes, by her skill at Sailing (SIM.ZIGZAG). */
const HOPS = { decent: 0.5, good: 0.75, great: 1 };
/** Pieces in the crane's three frames (about five squares a piece). */
const CRANE_PIECES = Math.round(CRANE.PARTS.reduce((n, p) => n + p.rows.join('').split('#').length - 1, 0) / 5);
export const ROUTES = [
    { name: 'long', cuts: ['zigzag'] },
    { name: 'gap-run', cuts: ['guns'], gap: 'run' },
    { name: 'gap-combo', cuts: ['guns'], gap: 'combo' },
    { name: 'gap-shot', cuts: ['guns'], gap: 'shot' },
    { name: 'headwind', cuts: ['headwind'] },
    { name: 'doubles', cuts: ['double', 'triple'] },
    { name: 'whirls', cuts: ['whirls'] },
    { name: 'forage', cuts: ['forage'] },
    { name: 'locks', cuts: ['locks'] },
    { name: 'crane', cuts: ['crane'] },
    { name: 'door', cuts: ['door'] },
    { name: 'every', cuts: ['guns', 'double', 'whirls', 'locks', 'crane'], gap: 'combo' },
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
    all-rounder's: no better at any. */
export const bestAt = (e) => (e.route.name === 'every' ? e.skill : SKILLS[Math.min(SKILLS.length - 1, SKILLS.indexOf(e.skill) + 1)]);
const STATE = { sail: 'sailing', stop: 'puzzling', wait: 'waiting', trip: 'carried', daze: 'dazed', done: 'finished' };
/* ---- Where a bot is ----
   Under way she's on the long way (routePose); down through the start's field, from her own spot on the
   line: straight down to the first leg and along it to where the long way runs (startPose). On a trip
   through a shortcut, along its own water (TRIPS: the gap, the lock, the crane's swing over the neck...)
   from where she was to where she rejoins the long way (tripPose). */
/** The squares a shortcut's trip goes by, between where she starts it and where she rejoins the long way;
    the crane's lifted (`air`), the starlit door's under the course (`under`: nobody sees her). */
const TRIPS = {
    guns: { by: G },
    headwind: { by: [] },
    double: { by: D2 },
    whirls: { by: [[M.c, M.r + 1], RC.WHIRLS.OUT] },
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
/** Where the long way joins her way down from spot `spot` (seconds round it): she meets the first leg
    below her spot, or (left of the long way's own spot) runs along it to there. */
const joinTau = (spot) => tauAt(0, Math.min(SAIL.COLS - 1.5, Math.max(spot, RACE.LONG_SPOT)));
/** Down through the start's field from her spot, `tau` seconds round the long way (from `tau0`, where
    she started). */
export function startPose(spot, tau0, tau) {
    const S0 = S[0].r, pts = [[spot, RC.LINE.r], [spot, S0]];
    if (spot < RACE.LONG_SPOT)
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
/** A race set going: its bots (o.racers) on `o.field` if one's given (the den's: started, you racer 0,
    moved by the helm, the bots racers 1 up), else on a field of their own. */
export function sail(o) {
    const rand = seeded(o.seed), mode = o.mode ?? RACE.GAP.MODE, chains = o.chains ?? true, snakes = o.snakes ?? true;
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
    const draw = (mean, skill) => mean * SIM.SKILL[skill] * Math.exp(SIM.SPREAD * gauss() - SIM.SPREAD ** 2 / 2);
    const cuts = Object.fromEntries(Object.entries(CUTS).map(([k, c]) => {
        const saves = o.saves?.[k];
        return [k, saves === undefined ? c : { ...c, saves, tOut: c.tIn + c.trip + saves }];
    }));
    const you = !!o.field, first = you ? 1 : 0;
    const field = o.field ?? new Field(o.racers.map((r) => `${r.route.name}/${r.style.name}`), courseSea(), 0);
    if (!o.field)
        field.start();
    if (o.shots !== undefined)
        for (const r of field.racers)
            r.shots = o.shots;
    // (where each starts: her spot's way through the field, less a move given way to each racer already
    // starting beside her)
    const spots = o.racers.map((r) => r.spot ?? RACE.LONG_SPOT);
    const bots = o.racers.map((r, k) => {
        const tau0 = startTau(spots[k]) - SIM.JOSTLE * spots.slice(0, k).filter((c) => Math.abs(c - spots[k]) <= 1).length;
        return {
            i: k + first, route: r.route, style: r.style, skill: r.skill, best: bestAt(r), pace: 1 + SIM.STEER * gauss(),
            tau: tau0, mode: 'sail', was: 'sail', spot: spots[k], tau0, from: { c: spots[k], r: RC.LINE.r, d: 0 }, tripFull: 0,
            cut: null, stage: 0, work: 0, full: 0, tries: 0, since: 0, lost: 0, move: null, combo: false, ready: new Set(), daze: 0, trip: 0, waited: 0,
            hopped: false, hop: 0, lefts: 0, done: new Set(), stop: null, inLine: new Set(),
            res: { route: r.route.name, style: r.style.name, skill: r.skill, start: k, spot: spots[k], time: 0, place: 0, hitsTaken: 0, hitsGiven: 0, swept: [], cuts: [], exposed: [] },
        };
    });
    const botOf = (i) => bots[i - first];
    /** What a second of her time is worth in Sailing on the pilot (seconds round the long way). */
    const chainWorth = (b) => (chains ? SIM.CHAIN[b.route.name === 'long' ? b.best : b.skill] * (PACE - SAIL.PUSH) : 0);
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
        if (b.route.gap === 'combo')
            b.move = { kind: 'combo', left: draw(SIM.PUZZLE.combo, b.best) };
        if (b.route.gap === 'shot' && shots(b) < 2 * need)
            b.move = { kind: 'load', left: draw(SIM.PUZZLE.load, b.best) };
        if (b.route.gap)
            b.res.cuts.push({ id: 'guns', done: false, saved: 0 });
    }
    /** Everyone still racing, how far round: the bots, and you. */
    const racing = () => [
        ...bots.filter((x) => x.mode !== 'done').map((x) => ({ b: x, tau: x.tau })),
        ...(you && field.racers[0].state !== 'finished' ? [{ b: null, tau: progressAt(field.racers[0].pose) }] : []),
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
        if (t.mode === 'stop' && t.cut && (t.cut.id === 'whirls' || (t.cut.id === 'door' && t.stage === 1)))
            t.work += (t.full - t.work) * SIM.HIT_LOSS;
        if (t.mode !== 'daze')
            t.was = t.mode;
        t.mode = 'daze';
        t.daze = patchTime(t);
        return true;
    };
    /** A snake has her: swept back to `tau`, the sweep's seconds on top. */
    const swept = (b, snake, tau, secs) => {
        b.res.swept.push(snake);
        b.tau = tau;
        b.mode = 'trip';
        b.trip = secs;
        b.cut = null;
        b.stop = null;
    };
    const record = (b, id, done) => {
        const c = cuts[id];
        let r = b.res.cuts.find((x) => x.id === id && !x.done && x.saved === 0);
        if (!r) {
            r = { id, done, saved: 0 };
            b.res.cuts.push(r);
        }
        r.done = done;
        // (what it saved: the long way between, less the time it took her from the turn-off, the sailing she
        // lost puzzling on the move for it, and the Sailing on the pilot she'd have done meanwhile)
        r.saved = (done ? c.tOut - c.tIn : 0) - b.since * (1 + chainWorth(b)) - b.lost;
        b.since = 0;
        b.lost = 0;
    };
    const go = (b, c, work) => {
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
    const firstWork = (b, c) => {
        switch (c.id) {
            case 'headwind': return draw(SIM.PUZZLE.row, b.best);
            case 'double': return draw(SIM.PUZZLE.double, b.best);
            case 'triple': return draw(SIM.PUZZLE.triple, b.best);
            case 'whirls': return draw(SIM.PUZZLE.vegas, b.best);
            case 'forage': return draw(SIM.PUZZLE.forage, b.best);
            case 'locks': return draw(SIM.PUZZLE.bilge, b.best);
            case 'crane': return draw(CRANE_PIECES * SIM.PUZZLE.piece, b.best);
            case 'door': return draw(SIM.PUZZLE.nav, b.best);
            default: return 0;
        }
    };
    /** On a trip through a shortcut (or swept by a snake) for `secs`, from where she is now. */
    const tripFor = (b, secs) => { b.mode = 'trip'; b.trip = secs; b.tripFull = secs; b.from = { ...field.racers[b.i].pose }; };
    /** She's come to a shortcut she means to take: in, waiting her turn, or (cautious, someone close
        behind) on by. The zigzag's hops are on the move: through, for what her Doubles save. */
    const arrive = (b, c) => {
        b.tau = c.tIn;
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
        if (b.style.caution && !c.sheltered && behind(b, b.style.caution))
            return false;
        if (c.spot && field.claim(b.i, c.spot) === 'wait') {
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
        const c = b.cut;
        if (!c) {
            b.mode = 'sail';
            return;
        } // (a snake's sweep: on from where it put her)
        if (c.spot)
            field.release(b.i, c.spot);
        if (c.id === 'door')
            field.under(b.i, DOOR.FROM, DOOR.TO);
        b.done.add(c.id);
        record(b, c.id, true);
        b.tau = c.tOut;
        b.cut = null;
        b.mode = 'sail';
        // (rushing the gap, the tight water past it: one move too many)
        // (rushing it on a combo most of all; run a square at a time, half as often; its guns shot quiet, she
        // goes through at her leisure)
        if (c.id === 'guns' && snakes && b.route.gap !== 'shot' && rand() < SIM.SNAKE.tight[b.best] * (b.route.gap === 'run' ? 0.5 : 1))
            swept(b, 'tight', TIGHT_BACK, sweep(SAIL.COLS - 2 - G[0][0]));
    };
    const giveUp = (b) => {
        const c = b.cut;
        if (c.spot) {
            field.release(b.i, c.spot);
            field.leave(b.i, c.spot);
        }
        b.done.add(c.id);
        record(b, c.id, false);
        b.cut = null;
        b.mode = 'sail';
        b.stop = null;
    };
    /** Through the gap, by her route: rushed past on her combo, past its guns quietened, or run. */
    const gap = (b) => {
        const c = cuts.guns;
        if (b.cut !== c) {
            b.tau = c.tIn;
            b.since = 0;
            b.cut = c;
        }
        if (b.route.gap === 'combo') {
            if (b.combo)
                return through(b, c.trip);
            // (not built yet: stop short, off its marks, and finish it)
            go(b, c, b.move?.left ?? 0);
            b.move = null;
            return;
        }
        if (b.route.gap === 'shot') {
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
            if (b.route.gap === 'combo')
                b.combo = true;
            else
                field.load(b.i, 2 * need - shots(b));
            return gap(b);
        }
        if (c.id === 'door' && b.stage === 0) {
            b.stage = 1;
            b.work = b.full = draw(SIM.PUZZLE.vegas, b.best);
            return;
        }
        if ((c.id === 'whirls' || c.id === 'door') && rand() >= SIM.VEGAS[b.best]) {
            if (++b.tries >= SIM.TRIES)
                return giveUp(b);
            b.work = b.full = SIM.BACK[c.id] + draw(SIM.PUZZLE.vegas * SIM.RETRY, b.best);
            return;
        }
        through(b, c.trip);
    };
    /** Where a bot is drawn and reckoned: see "Where a bot is" above. */
    const poseOf = (b) => {
        if (b.mode === 'stop' || (b.mode === 'daze' && b.was === 'stop')) {
            const at = { ...b.cut.at };
            // (rowing up the headwind gap as she goes)
            if (b.cut.id === 'headwind') {
                const [c, r] = B[Math.min(B.length - 1, Math.floor((1 - b.work / Math.max(1e-9, b.full)) * B.length))];
                at.c = c;
                at.r = r;
            }
            return at;
        }
        if (b.mode === 'wait' || (b.mode === 'daze' && b.was === 'wait')) {
            // (waiting her turn: the locks' berth, sheltered; otherwise on the leg beside the way in)
            const c = b.cut;
            return c.id === 'locks' ? { c: RC.BERTH[0], r: RC.BERTH[1], d: 0 } : { ...c.at, c: c.at.c + 1, r: c.at.r - 1 };
        }
        if (b.mode === 'trip' && b.cut) {
            const T = TRIPS[b.cut.id], end = routePose(b.cut.tOut);
            if (T.under)
                return { ...b.from };
            // (square by square: along her row to the way in, through, then straight on to the leg's row and
            // along it, so she never cuts a corner of the land)
            const pts = [[b.from.c, b.from.r]];
            if (T.by.length)
                pts.push([T.by[0][0], b.from.r], ...T.by);
            pts.push([pts[pts.length - 1][0], end.r], [end.c, end.r]);
            return along(pts, 1 - b.trip / Math.max(1e-9, b.tripFull));
        }
        const at = b.tau < joinTau(b.spot) && b.lefts === 0 && !b.hopped ? startPose(b.spot, Math.min(b.tau0, b.tau), b.tau) : routePose(b.tau);
        if (b.mode === 'daze')
            at.r = Math.floor(at.r) + 1;
        return at;
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
                if (b.daze <= 0) {
                    field.patched(b.i);
                    b.mode = b.was;
                    grace.set(b.i, SAIL.GRACE);
                }
            }
            else if (b.mode === 'trip') {
                b.trip -= dt;
                if (b.trip <= 0)
                    out(b);
            }
            else if (b.mode === 'wait') {
                b.waited += dt;
                if (field.holder(b.cut.spot) === b.i)
                    go(b, b.cut, firstWork(b, b.cut));
                else if (b.waited > SIM.WAIT)
                    giveUp(b);
            }
            else if (b.mode === 'stop') {
                b.work -= dt;
                if (b.work <= 0)
                    solved(b);
            }
            else if (b.mode === 'sail') {
                // On the pilot: a combo held for the gap, or a shot loaded, slows her a little; otherwise her
                // Sailing's gusts carry her on.
                let speed = 1 + chainWorth(b);
                if (!b.move && b.style.reload && shots(b) < FIELD.SHOTS)
                    b.move = { kind: 'load', left: draw(SIM.PUZZLE.load, b.skill) };
                // (the next Double or Triple her route hops, built on the move, once the gap's combo's done with)
                const hopId = b.route.cuts.find((id) => (id === 'double' || id === 'triple') && !b.done.has(id) && !b.ready.has(id));
                if (!b.move && hopId && (b.route.gap !== 'combo' || b.done.has('guns')))
                    b.move = { kind: 'hop', id: hopId, left: draw(SIM.PUZZLE[hopId], b.best) };
                if (b.move) {
                    speed = SIM.OVERLAP;
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
                            const short = b.route.gap === 'shot' && !b.done.has('guns') ? 2 * need - shots(b) : b.style.reload ? FIELD.SHOTS - shots(b) : 0;
                            b.move = short > 0 ? { kind: 'load', left: draw(SIM.PUZZLE.load, b.route.gap === 'shot' ? b.best : b.skill) } : null;
                        }
                    }
                }
                // (the Sailing she'd have done, held for the gap's puzzle, counts against the gap)
                if (b.move && b.route.gap && !b.done.has('guns'))
                    b.lost += dt * (1 + chainWorth(b) - speed);
                // (lining up her Double at the trade wind back up the course: she's held there till it's timed)
                if (b.hop > 0) {
                    b.hop -= dt;
                    if (b.hop <= 0) {
                        b.hopped = true;
                        if (snakes && rand() < SIM.SNAKE.mid[b.best]) {
                            swept(b, 'mid', MID_BACK, sweep(RC.SNAKES.MID.length));
                            b.hopped = false;
                        }
                    }
                    continue;
                }
                const next = b.tau + (dt * speed) / b.pace;
                if (b.route.gap && !b.done.has('guns') && b.tau < cuts.guns.tIn && next >= cuts.guns.tIn) {
                    gap(b);
                    continue;
                }
                if (!b.hopped && b.tau < MID_T && next >= MID_T) {
                    b.tau = MID_T;
                    b.hop = draw(SIM.HOP, b.skill);
                    continue;
                }
                // (the left-hand trade wind: a careless turn at a left-hand bend, or on the run home)
                if (snakes && b.lefts < LEFT_T.length && b.tau < LEFT_T[b.lefts] && next >= LEFT_T[b.lefts]) {
                    const at = LEFT_T[b.lefts++];
                    if (rand() < SIM.SNAKE.left[b.skill]) {
                        const r = routePose(at);
                        swept(b, 'left', 0, sweep(Math.abs(r.r - RC.LINE.r) + r.c));
                        b.lefts = 0;
                        b.hopped = false;
                        b.done.clear();
                        b.combo = false;
                        b.ready.clear();
                        continue;
                    }
                }
                const due = b.route.cuts.map((id) => cuts[id]).filter((c) => c.id !== 'guns' && !b.done.has(c.id) && b.tau < c.tIn && next >= c.tIn).sort((x, y) => x.tIn - y.tIn)[0];
                if (due) {
                    b.done.add(due.id);
                    if (arrive(b, due))
                        continue;
                }
                b.tau = next;
                if (b.tau >= SIM.LONG) {
                    b.mode = 'done';
                    events.push(...field.home(b.i));
                }
            }
        }
        // Where each is, and what she's doing, for the field.
        for (const b of bots) {
            if (b.mode === 'done')
                continue;
            for (const e of field.move(b.i, poseOf(b))) {
                if (e.kind === 'finish')
                    b.mode = 'done';
                if (e.kind === 'finish')
                    events.push(e);
            }
            field.racers[b.i].state = STATE[b.mode];
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
            if (b.mode !== 'sail' || !b.style.fire || (b.route.gap === 'shot' && !b.done.has('guns')))
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
    return {
        field, step,
        progress: (i) => { const b = botOf(i); return b ? (b.mode === 'done' ? SIM.LONG : b.tau) : progressAt(field.racers[i].pose); },
        hit: (i, by) => { const b = botOf(i); return b ? hitBot(b, by) : field.hit(i, by); },
        lift: (i) => {
            const b = botOf(i);
            if (!b || b.mode !== 'trip' || !b.cut || !TRIPS[b.cut.id].air)
                return 0;
            return Math.sin(Math.PI * Math.min(1, Math.max(0, 1 - b.trip / Math.max(1e-9, b.tripFull))));
        },
        results: (limit) => bots.map((b) => ({ ...b.res, time: field.racers[b.i].time ?? limit, place: field.racers[b.i].place ?? bots.length })),
    };
}
/** One race, start to finish: each racer's result, in starting order. */
export function simulate(o) {
    const run = sail(o), LIMIT = SIM.LONG * 4;
    while (run.field.state === 'on' && run.field.t < LIMIT) {
        run.field.tick(SIM.DT);
        run.step(SIM.DT);
    }
    return run.results(LIMIT);
}
/** The den's race (src/den-race.ts, its Race's `drive`): its rivals sailed by bots, each on her favourite
    route in her own style and skill (src/den-rivals.ts, her racer), from her spot on the line; you racer 0
    on the same field, moved by the helm, fired on as any racer is. A fresh seed each race. */
export function simDrive(field, rivals, seed = Math.floor(Math.random() * 2 ** 31)) {
    return sail({ field, seed, racers: rivals.map((r) => ({ route: route(r.racer.route), style: style(r.racer.style), skill: r.racer.skill, spot: r.spot })) });
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
        for (const r of simulate({ ...opts, racers: lineUp(size, seed, opts.routes, opts.styles), seed })) {
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
            }
        }
    }
    return rep;
}
