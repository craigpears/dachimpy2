/* Pirate Den: a skirmish, two fleets of equal points fighting to the last ship on open sea, to prove the blockade's
   rock, paper, scissors (src/blockade.ts) by how the ships really handle and shoot, not by rules. TypeScript, compiled
   to js/blockade-skirmish.js; run by tools/blockade-balance.mjs; tested in tests/blockade-balance.test.ts.

   The user (15 Nov): "it feels a bit artificial ... the idea that turtles don't go for sloops at all, rather than it
   being a mechanical advantage. Certainly set some balance tests up. So, for example, if you have ... a fight with all
   frigs ... versus all brigs, etc., ... you'd expect the one to win that's got the advantage in the rock, paper,
   scissors setup ... wouldn't a simulation ... actually prove that the sloop wins? ... How many sloops have you got?"

   - each kind of ship costs points (POINTS: a frigate three, a brig two, a sloop one), and each side brings the same:
     six points is two frigates, three brigs or six sloops;
   - open sea, the board's size, no fort, gates, reefs, rocks or winds: only the ships; or the blockade's own board, its
     lagoons, reefs, shoals, winds, walls and gate guns (which fire on a ship lying still in their reach, not on one
     moving through: the user, 15 Nov, "if the sloops are constantly moving, they shouldn't be vulnerable to the guns");
   - a ship sunk stays sunk; every bot goes for the nearest enemy as her kind best can (src/blockade-bots.ts,
     `skirmish`);
   - a side's strength is its ships' points still afloat, each by how whole she is (knocked out, a quarter); the side
     with more when the other's gone, or the time's up, wins. */
import { Blockade, BLOCKADE } from './blockade.js';
import { Bots } from './blockade-bots.js';
export const SKIRMISH = {
    /** What each kind of ship costs. */
    POINTS: { sloop: 1, brig: 2, frigate: 3 },
    /** Each side's points, and the longest a skirmish runs (seconds). */
    BUDGET: 6, SECS: 300,
};
/** A side's fleet of one kind of ship, as many as its points buy, in a line across its end of the board facing the
    other's: Dachimpy's along the south, Dalnoth's along the north. A brig launches her side's craft (Dachimpy's
    turtles, Dalnoth's phantoms) unless `craft` says. */
export function fleet(kind, team, points = SKIRMISH.BUDGET, craft) {
    const n = Math.floor(points / SKIRMISH.POINTS[kind]), south = team === 'gold';
    const r = kind === 'frigate' ? (south ? 3 : BLOCKADE.ROWS - 4) : south ? 3 : BLOCKADE.ROWS - 4;
    const ships = Array.from({ length: n }, (_, i) => {
        // (Dalnoth's the mirror of Dachimpy's, turned round the board's middle, as the board is: neither side the better placed)
        const c0 = Math.round(6 + (i + 0.5) * (BLOCKADE.COLS - 12) / n), c = south ? c0 : BLOCKADE.COLS - 1 - c0, at = { c, r, d: south ? 0 : 2 };
        return { name: `${team} ${kind} ${i + 1}`, kind, at, ...(kind === 'brig' ? { craft: craft ?? (south ? 'ram' : 'ghost') } : {}) };
    });
    return { id: team, name: team, ships };
}
/** A side's strength: its ships' points still afloat, each by how whole she is. */
export function strength(b, team) {
    return b.ships.filter((s) => s.team === team && !s.craft && s.away <= 0)
        .reduce((t, s) => t + SKIRMISH.POINTS[s.kind] * (s.dmg.out ? 0.25 : 1 - s.dmg.share()), 0);
}
/** Two fleets fight it out, `gold` of one kind against `crimson` of another, the dice seeded. */
export function skirmish(gold, crimson, random, opts = {}) {
    const points = opts.points ?? SKIRMISH.BUDGET, secs = opts.secs ?? SKIRMISH.SECS;
    // (on open sea, or on the blockade's own board, its fort, reefs, shoals, winds and gate guns: the brigs' lagoons theirs
    // to launch from, the user, 15 Nov: "brigs being able to use the terrain to launch from a protected position is very
    // key to the balance test")
    const b = new Blockade({ open: opts.board !== 'blockade', skirmish: true, teams: [fleet(gold, 'gold', points, opts.goldCraft), fleet(crimson, 'crimson', points, opts.crimsonCraft)] });
    const bots = new Bots(b, [], random, null, true), dt = 0.1;
    let t = 0;
    for (; t < secs; t += dt) {
        bots.tick(b, dt);
        b.tick(dt);
        b.fired.length = 0;
        b.launches.length = 0;
        if (strength(b, 'gold') <= 0 || strength(b, 'crimson') <= 0)
            break;
    }
    const g = strength(b, 'gold'), c = strength(b, 'crimson');
    return { winner: Math.abs(g - c) < 1e-9 ? null : g > c ? 'gold' : 'crimson', gold: g, crimson: c, secs: Math.round(t) };
}
/** A side's fleet of a make-up, placed as a blockade's: Dachimpy's frigates along the south facing the south gate, its
    brigs and sloops down the west edge facing in; Dalnoth's the same turned round the board's middle. */
export function blockadeFleet(makeup, team) {
    const south = team === 'gold', turn = (c, r) => (south ? [c, r] : [BLOCKADE.COLS - 1 - c, BLOCKADE.ROWS - 1 - r]);
    const ships = [];
    const nf = makeup.frigate ?? 0;
    // (spread along the edge, clear of the rock off the gate)
    const P = BLOCKADE.PAD, way = BLOCKADE.GATES[0].way, wind = BLOCKADE.WINDS[0].at[1];
    for (let i = 0; i < nf; i++) {
        const c0 = P + Math.round(10 + (i + 0.5) * 24 / nf), [c, r] = turn(c0 >= way - 1 && c0 <= way + 2 ? way + 4 : c0, 3);
        ships.push({ name: `${team} frigate ${i + 1}`, kind: 'frigate', at: { c, r, d: south ? 0 : 2 } });
    }
    // (the brigs and sloops down the side, a square in from the edge, spread either side of the wind)
    const small = [...Array(makeup.brig ?? 0).fill('brig'), ...Array(makeup.sloop ?? 0).fill('sloop')], n = small.length;
    small.forEach((kind, i) => {
        const row = P + Math.round(5 + (i + 0.5) * 26 / n), r0 = row === wind ? wind - 1 : row, [c, r] = turn(kind === 'brig' ? 2 : 1, r0);
        ships.push({ name: `${team} ${kind} ${i + 1}`, kind, at: { c, r, d: south ? 1 : 3 }, ...(kind === 'brig' ? { craft: south ? 'ram' : 'ghost' } : {}) });
    });
    return { id: team, name: team, ships };
}
/** A whole blockade round between two make-ups, the dice seeded: its score. */
export function blockadeGame(gold, crimson, random, secs = BLOCKADE.ROUND) {
    const b = new Blockade({ teams: [blockadeFleet(gold, 'gold'), blockadeFleet(crimson, 'crimson')] });
    const bots = new Bots(b, [], random), dt = 0.1;
    for (let t = 0; t < secs && !b.over; t += dt) {
        bots.tick(b, dt);
        b.tick(dt);
        b.fired.length = 0;
        b.launches.length = 0;
    }
    const { gold: g, crimson: c } = b.score;
    return { winner: g === c ? null : g > c ? 'gold' : 'crimson', gold: g, crimson: c };
}
