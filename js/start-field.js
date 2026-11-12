/* Pirate Den: the sloop race's start, its field of slow winds and whirlpools, laid fresh each race (12 Nov).
   TypeScript, compiled to js/start-field.js; tested in tests/start-field.test.ts. The sea lays it (Sea.layField,
   src/den-sail.ts); js/den/race-start.js draws it; the race picks it by its seed (src/den-race.ts, Race.seed),
   so a race online, every browser on the room's one seed, has the same field for everyone.

   The user (12 Nov): "we need two different kinds of [winds]. Like the trade wind kind that really just blows
   you and you don't get the chance, but you also need the slower wind that only nudges you one per turn", and
   of the start: "you would say left into a whirlpool because the wind action then takes you one tile further
   up, so that kind of navigating and eyeballing the route", and "there should be some element of randomness to
   it so that it's not the same on every single thing".

   So the field below the starting line (LAY.RACE.FIELD's rows) is a few plain whirlpools (they turn her to
   their far corner, by Puzzle Pirates' rules: src/den-whirl.ts) and short runs of slow winds (each pushes her a
   square its way after each move: Sea.nudge), laid at random from the race's seed round the field's one fixed
   thing, its hop (LAY.RACE.FIELD.HOP), kept clear. Always with a way through: from every spot on the line the
   pilot can sail her down onto leg 1 under sail (checked; a field that fails is laid again from the next
   draw, and if none would do, the field's left plain). Knows nothing of who's racing. */
import { LAY, Sea } from './den-sail.js';
import { seeded } from './mirror-row.js';
const RC = LAY.RACE, F = RC.FIELD, HOP = F.HOP;
export const START_FIELD = {
    /** Whirlpools in a field, at least and most. */
    POOLS: [2, 4],
    /** Runs of slow winds in a field, at least and most, each one to RUN squares long. */
    RUNS: [6, 9],
    RUN: 3,
    /** The ways a slow wind blows, and how often, left of the long way's own column and right of it: on the
        left, mostly on toward buoy 1 (right: 1) or down the course (0); on the right, mostly back (left: 3) or up
        toward the line (2), so no stretch of the line is far ahead of the rest (leg 1 runs right, to buoy 1). */
    WAYS: { left: [[1, 0.4], [0, 0.3], [2, 0.18], [3, 0.12]], right: [[3, 0.34], [2, 0.26], [0, 0.24], [1, 0.16]] },
    /** Draws before a field that works is given up on (and the field's left plain). */
    TRIES: 24,
};
export const PLAIN = { POOLS: [], SLOW: [] };
const key = (c, r) => `${c},${r}`;
/** Squares the field's random winds and pools keep off: the hop, its rocks, the row she hops from over its
    columns and a column either side (so she can always line up for it), and where its lane comes down. */
const KEEP = (() => {
    const s = new Set();
    for (let c = HOP.c0 - 1; c <= HOP.c1 + 1; c++)
        for (let r = HOP.FROM; r <= F.r1; r++)
            s.add(key(c, r));
    // (and the field's fixed trade winds, its conveyor on the left and the wind back on the right, and the water
    // the conveyor carries everyone past, left of the long way's column: the field proper is from there on)
    for (const [c, r] of [...F.CONVEYOR, ...F.BACK])
        s.add(key(c, r));
    for (let c = 0; c < HOP.c0 - 4; c++)
        for (let r = F.r0; r <= F.r1; r++)
            s.add(key(c, r));
    return s;
})();
/** One draw of a field from `rand`, not yet checked. */
function draw(rand) {
    const W = 27, used = new Set(), pools = [], slow = [];
    const free = (c, r) => c >= 0 && c < W && r >= F.r0 && r <= F.r1 && !KEEP.has(key(c, r)) && !used.has(key(c, r));
    const pick = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
    // Whirlpools: two by two, a square of open water between each and the next, never right under the line (so
    // every spot can get going).
    for (let n = pick(...START_FIELD.POOLS), tries = 0; pools.length < n && tries < 300; tries++) {
        const c = pick(1, W - 3), r = pick(F.r0 + 1, F.r1 - 1);
        let ok = true;
        for (let a = -1; a <= 2 && ok; a++)
            for (let b = -1; b <= 2 && ok; b++) {
                const x = c + a, y = r + b, inside = a >= 0 && a <= 1 && b >= 0 && b <= 1;
                if (inside ? !free(x, y) : used.has(key(x, y)))
                    ok = false;
            }
        if (!ok)
            continue;
        pools.push({ at: [c, r] });
        for (const [x, y] of [[c, r], [c + 1, r], [c, r + 1], [c + 1, r + 1]])
            used.add(key(x, y));
    }
    // Slow winds: short runs, each square blowing the run's way, laid along it (a slow conveyor) or across it.
    const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
    const way = (c) => { let u = rand(); const W8 = START_FIELD.WAYS[c < RC.LINE.c0 + 12 ? 'left' : 'right']; for (const [d, p] of W8) {
        if ((u -= p) < 0)
            return d;
    } return 0; };
    for (let n = pick(...START_FIELD.RUNS), runs = 0, tries = 0; runs < n && tries < 300; tries++) {
        const c = pick(0, W - 1), r = pick(F.r0, F.r1), d = way(c), along = rand() < 0.5 ? d : (d + 1) % 4, len = pick(1, START_FIELD.RUN);
        const sq = [];
        for (let k = 0; k < len; k++)
            sq.push([c + DC[along] * k, r + DR[along] * k]);
        if (!sq.every(([x, y]) => free(x, y)))
            continue;
        for (const [x, y] of sq) {
            slow.push([x, y, d]);
            used.add(key(x, y));
        }
        runs++;
    }
    return { POOLS: pools, SLOW: slow };
}
let checkSea = null;
/** Whether a field has a way through from every spot on the line: the pilot sails her from each, under sail,
    down through it and along leg 1 to its bend (buoy 1's water). */
export function hasWayThrough(f, sea = (checkSea ??= new Sea(9))) {
    sea.layField(f);
    const L = RC.LINE, [bc] = RC.BUOYS[0].at, br = RC.SPITS[0].r0;
    for (let c = L.c0; c <= L.c1; c++) {
        const from = { c, r: L.r, d: 0 };
        if (!sea.plot(from, bc, br))
            return false;
    }
    return true;
}
const made = new Map();
/** The field for a race's seed (the same seed, the same field, everywhere): the first draw from it that has
    a way through from every spot on the line; or a plain field, if none would. */
export function fieldFor(seed) {
    const s = Math.floor(Math.abs(seed)) % 2 ** 31;
    const got = made.get(s);
    if (got)
        return got;
    const rand = seeded(s * 2654435761 + 97);
    let f = PLAIN;
    for (let k = 0; k < START_FIELD.TRIES; k++) {
        const x = draw(rand);
        if (hasWayThrough(x)) {
            f = x;
            break;
        }
    }
    if (made.size > 64)
        made.clear();
    made.set(s, f);
    return f;
}
