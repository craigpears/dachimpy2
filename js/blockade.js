import { ShipSea, ShipHelm, Guns, broadside, squares, SLOOP_HANDLING, FRIGATE_HANDLING } from './ship-handling.js';
import { HullChart } from './hull-chart.js';
import { SLOOP, WAR_FRIGATE } from './ships.js';
import { Gate } from './imperial-gate.js';
import { Turret } from './den-turret.js';
import { Damage, struck } from './ship-damage.js';
const key = (c, r) => `${c},${r}`;
/** The board (c across, r up from the south edge). */
export const BLOCKADE = {
    COLS: 44,
    ROWS: 36,
    /** The fort's walls, two deep, round the heart. */
    WALLS: [
        { c0: 14, c1: 29, r0: 12, r1: 13 }, { c0: 14, c1: 29, r0: 22, r1: 23 },
        { c0: 14, c1: 15, r0: 12, r1: 23 }, { c0: 28, c1: 29, r0: 12, r1: 23 },
    ],
    /** The heart, inside them. */
    HEART: { c0: 16, c1: 27, r0: 14, r1: 21 },
    /** The imperial gates: each one's way (its column), its wall's rows, its bastion guns on the wall. */
    GATES: [
        { way: 21, r0: 12, r1: 13, guns: [[16, 12], [26, 12]] },
        { way: 22, r0: 22, r1: 23, guns: [[17, 23], [27, 23]] },
    ],
    /** The side ways: a one-square gap through the west wall and the east. */
    SIDEWAYS: [[14, 18], [15, 18], [28, 17], [29, 17]],
    /** The winds (the way each blows: 0 up the board, 1 right, 2 down, 3 left; n squares from `at`): one in through
        each side way from the open sea into the heart. A sloop on one is carried along it; a frigate rides them out. */
    WINDS: [{ at: [5, 18], d: 1, n: 13 }, { at: [38, 17], d: 3, n: 13 }],
    /** The islands, each with its cove. */
    ISLANDS: [
        { c0: 5, c1: 9, r0: 4, r1: 8, cove: [7, 6], way: [[7, 7], [7, 8]] },
        { c0: 34, c1: 38, r0: 4, r1: 8, cove: [36, 6], way: [[36, 7], [36, 8]] },
        { c0: 5, c1: 9, r0: 27, r1: 31, cove: [7, 29], way: [[7, 28], [7, 27]] },
        { c0: 34, c1: 38, r0: 27, r1: 31, cove: [36, 29], way: [[36, 28], [36, 27]] },
    ],
    /** Each side's corner of the sea, where her sloops can lie out of the fighting too when the coves are full. */
    HOMES: { gold: [[0, 0], [3, 0], [0, 3]], crimson: [[43, 35], [40, 35], [43, 32]] },
    /** Rocks about the open sea and the heart. */
    ROCKS: [
        [12, 7], [13, 7], [30, 7], [31, 7], [12, 28], [13, 28], [30, 28], [31, 28], [21, 4], [22, 31], [2, 24], [41, 11],
        [18, 20], [25, 15],
    ],
    /** The buoys: in the heart two, and its prize three; out on the open sea, two off each gate and one by each island. */
    BUOYS: [
        { at: [21, 17], pennants: 3 }, { at: [18, 15], pennants: 2 }, { at: [25, 20], pennants: 2 },
        { at: [21, 8], pennants: 2 }, { at: [22, 27], pennants: 2 },
        { at: [11, 10], pennants: 1 }, { at: [32, 10], pennants: 1 }, { at: [11, 25], pennants: 1 }, { at: [32, 25], pennants: 1 },
    ],
    /** Squares from any of her squares a ship's influence reaches, by her size (YPPedia: "different sized ships
        have different sized influence circles"). */
    INFLUENCE: { sloop: 2, frigate: 3.5 },
    /** Seconds a blockade turn, scored at its end, and a round. */
    TURN: 10,
    ROUND: 360,
    /** The sides, and their fleets: where each ship comes in (a frigate's config by her name: src/den-frigate.ts). */
    TEAMS: [
        { id: 'gold', name: 'Dachimpy\'s flag', ships: [
                { name: 'Primates Rule', kind: 'frigate', at: { c: 13, r: 2, d: 0 } },
                { name: 'Coral Throne', kind: 'frigate', at: { c: 29, r: 2, d: 0 } },
                { name: 'Golden Grin', kind: 'frigate', at: { c: 2, r: 14, d: 1 } },
                { name: 'Lucky Banana', kind: 'sloop', at: { c: 4, r: 1, d: 0 }, raider: true },
                { name: 'Grin and Bear It', kind: 'sloop', at: { c: 20, r: 1, d: 0 } },
                { name: 'Cheeky Monkey', kind: 'sloop', at: { c: 24, r: 1, d: 0 } },
                { name: 'Bananarama', kind: 'sloop', at: { c: 1, r: 21, d: 1 }, raider: true },
                { name: 'Coconut Shy', kind: 'sloop', at: { c: 1, r: 10, d: 1 } },
            ] },
        { id: 'crimson', name: 'Dalnoth\'s flag', ships: [
                { name: 'Iron Pride', kind: 'frigate', at: { c: 14, r: 33, d: 2 } },
                { name: 'Eldritch Wail', kind: 'frigate', at: { c: 30, r: 33, d: 2 } },
                { name: 'Crimson Tide', kind: 'frigate', at: { c: 41, r: 21, d: 3 } },
                { name: 'Red Wake', kind: 'sloop', at: { c: 39, r: 34, d: 2 }, raider: true },
                { name: 'Smoke and Mirrors', kind: 'sloop', at: { c: 19, r: 34, d: 2 } },
                { name: 'Scarlet Fever', kind: 'sloop', at: { c: 23, r: 34, d: 2 } },
                { name: 'Blood Orange', kind: 'sloop', at: { c: 42, r: 14, d: 3 }, raider: true },
                { name: 'Rust Bucket', kind: 'sloop', at: { c: 42, r: 26, d: 3 } },
            ] },
    ],
    /** How near (squares) a ship has to be to another for her moving to make the other's pilot think again. */
    NEAR: 8,
    /** How near (squares) another ship has to be to be in a ship's way, as her pilot works it out: one further off will
        have moved by the time she's there (inside NEAR, so a ship in her way moving always makes her think again). */
    IN_WAY: 5,
    /** The gates' guns' size. */
    GATE_GUNS: 'medium',
    /** The brawl to watch (blockade-test.html?watch=brawl, 15 Nov: "I want to see two of the big ships really having a
        brawl and fighting it out to see what that damage looks like"; "That needs to be like one of the shortcuts so
        people can actually see a cinematic of the blockade"): two war frigates broadside to broadside on the open water
        between the south-west islands and the fort, room to come about, the rest of the blockade going on round them. */
    BRAWL: [{ name: 'Primates Rule', at: { c: 7, r: 10, d: 1 } }, { name: 'Iron Pride', at: { c: 7, r: 14, d: 1 } }],
};
const HANDLINGS = { sloop: SLOOP_HANDLING, frigate: FRIGATE_HANDLING };
const CLASSES = { sloop: SLOOP, frigate: WAR_FRIGATE };
const inRect = (x, c, r) => c >= x.c0 && c <= x.c1 && r >= x.r0 && r <= x.r1;
/** A square in the heart. */
export const inHeart = (c, r) => inRect(BLOCKADE.HEART, c, r);
/** Every island's land squares (not its cove nor the way into it). */
export function islandLand(i) {
    const out = [], open = new Set([i.cove, ...i.way].map(([c, r]) => key(c, r)));
    for (let c = i.c0; c <= i.c1; c++)
        for (let r = i.r0; r <= i.r1; r++)
            if (!open.has(key(c, r)))
                out.push([c, r]);
    return out;
}
export class Blockade {
    rocks = new Set();
    wind = new Map();
    gates = BLOCKADE.GATES.map((x) => new Gate(x.way, x.r0, x.r1));
    /** Every gate's bastion guns, and whose gate each is. */
    battery = BLOCKADE.GATES.flatMap((x) => x.guns.map((at) => new Turret({ at, alert: false })));
    gunGate = BLOCKADE.GATES.flatMap((x, i) => x.guns.map(() => i));
    ships = [];
    score = { gold: 0, crimson: 0 };
    /** Seconds into the round, and into this blockade turn. */
    clock = 0;
    turnT = 0;
    over = false;
    /** Every broadside fired since whoever draws them last took them (anyone's: a bot's or yours). */
    fired = [];
    seen = new Map();
    /** Each square a ship covers just now, and whose (kept as they move: notice). */
    taken = new Map();
    /** Each kind of ship's chart of this board (src/hull-chart.ts): all the sloops share one, all the frigates another. */
    charts = {};
    constructor() {
        const B = BLOCKADE, side = new Set(B.SIDEWAYS.map(([c, r]) => key(c, r))), ways = new Set(B.GATES.flatMap((x) => [key(x.way, x.r0), key(x.way, x.r1)]));
        for (const w of B.WALLS)
            for (let c = w.c0; c <= w.c1; c++)
                for (let r = w.r0; r <= w.r1; r++)
                    if (!side.has(key(c, r)) && !ways.has(key(c, r)))
                        this.rocks.add(key(c, r));
        for (const isle of B.ISLANDS)
            for (const [c, r] of islandLand(isle))
                this.rocks.add(key(c, r));
        for (const [c, r] of B.ROCKS)
            this.rocks.add(key(c, r));
        for (const { at: [c, r], d, n } of B.WINDS)
            for (let i = 0; i < n; i++)
                this.wind.set(key(c + [0, 1, 0, -1][d] * i, r + [1, 0, -1, 0][d] * i), d);
        let id = 0;
        for (const team of B.TEAMS)
            for (const s of team.ships) {
                const h = HANDLINGS[s.kind], me = id++;
                const sea = new ShipSea(h, B.COLS, B.ROWS, this.rocks, (c, r) => { const o = this.taken.get(key(c, r)); return o !== undefined && o !== me; });
                if (s.kind === 'sloop')
                    sea.carriedBy(this.wind);
                sea.chart = this.charts[s.kind] ??= new HullChart(sea.bare());
                sea.near = B.IN_WAY;
                this.ships.push({ id: me, name: s.name, team: team.id, kind: s.kind, h, cls: CLASSES[s.kind], raider: !!s.raider, sea, helm: new ShipHelm(sea, { ...s.at }), guns: new Guns(h.reload), dmg: new Damage(CLASSES[s.kind]) });
            }
        // (the charts worked out now, while the board's being set up, rather than on the first move)
        for (const c of Object.values(this.charts))
            c.fresh();
        this.notice();
    }
    ship(id) { return this.ships[id]; }
    /** The ship on this square, if one is. */
    under(c, r) { const o = this.taken.get(key(c, r)); return o === undefined ? null : this.ships[o]; }
    /** A gate's down: the heart's open to a frigate. */
    gateOpen() { return this.gates.some((g) => g.open()); }
    /** Everything a tick on: each ship's helm and crew, the gates' guns, the blockade turn's scoring. */
    tick(dt) {
        const out = { sail: new Map(), damage: new Map(), guns: [], scored: false };
        if (this.over)
            return out;
        for (const s of this.ships) {
            const ev = s.dmg.tick(dt);
            if (ev.some((e) => e.kind === 'back'))
                s.helm.hole = null;
            s.sea.drag = s.dmg.drag();
            out.damage.set(s.id, ev);
            out.sail.set(s.id, s.helm.tick(dt));
            s.guns.tick(dt);
            this.notice();
        }
        this.battery.forEach((g, i) => {
            for (const e of g.tick(dt, this.gunTarget(g))) {
                const hit = e.kind === 'land' ? this.under(...e.to) : null;
                let hole;
                if (hit)
                    hole = this.hurt(hit, BLOCKADE.GATE_GUNS, e.to, g.at).hole;
                out.guns.push({ gun: i, e, hit: hit?.id ?? null, hole });
            }
        });
        this.clock += dt;
        if ((this.turnT += dt) >= BLOCKADE.TURN) {
            this.turnT -= BLOCKADE.TURN;
            this.scoreTurn();
            out.scored = true;
        }
        if (this.clock >= BLOCKADE.ROUND)
            this.over = true;
        return out;
    }
    /** The ship a gate's gun fires on: the nearest square of any in its reach, not knocked out. */
    gunTarget(g) {
        let best = null, far = Infinity;
        for (const s of this.ships) {
            if (s.dmg.out)
                continue;
            for (const id of s.helm.covers()) {
                const [c, r] = id.split(',').map(Number), d = Math.max(Math.abs(c - g.at[0]), Math.abs(r - g.at[1]));
                if (g.reaches(c, r) && d < far) {
                    far = d;
                    best = [c, r];
                }
            }
        }
        return best && { c: best[0], r: best[1] };
    }
    /** Where any ship's moved to, every other's pilot works her way out afresh. */
    notice() {
        let moved = false;
        for (const s of this.ships) {
            // (where she is and where the move she's on takes her: what she covers, cheaply)
            const p = s.helm.pose, to = s.helm.cur?.to, sig = `${p.c},${p.r},${p.d}${to ? `>${to.c},${to.r},${to.d}` : ''}`;
            // (only the ships near enough for her to be in their way work their ways out afresh: one far off will have
            // moved again by the time she's near, and a bump makes her pilot think again anyway)
            if (sig !== this.seen.get(s.id)) {
                this.seen.set(s.id, sig);
                moved = true;
                for (const o of this.ships)
                    if (o !== s && Math.max(Math.abs(o.helm.pose.c - p.c), Math.abs(o.helm.pose.r - p.r)) <= BLOCKADE.NEAR)
                        o.sea.touch();
            }
        }
        if (!moved && this.taken.size)
            return;
        this.taken.clear();
        for (const s of this.ships)
            for (const k of s.helm.covers())
                this.taken.set(k, s.id);
    }
    /** A ship's influence reaches this buoy: within her circle of any square of hers, and she's not knocked out. */
    reaches(s, b) {
        if (s.dmg.out)
            return false;
        const R = BLOCKADE.INFLUENCE[s.kind];
        return squares(s.h, s.helm.pose).some(([c, r]) => Math.hypot(c - b.at[0], r - b.at[1]) <= R + 1e-9);
    }
    /** Whose a buoy is just now. */
    hold(b) {
        const teams = new Set(this.ships.filter((s) => this.reaches(s, b)).map((s) => s.team));
        return teams.size === 0 ? null : teams.size > 1 ? 'contested' : [...teams][0];
    }
    /** The end of a blockade turn: each buoy one side alone holds scores it the buoy's pennants. */
    scoreTurn() {
        for (const b of BLOCKADE.BUOYS) {
            const h = this.hold(b);
            if (h === 'gold' || h === 'crimson')
                this.score[h] += b.pennants;
        }
    }
    /** Who's ahead (null while it's level). */
    leader() { return this.score.gold === this.score.crimson ? null : this.score.gold > this.score.crimson ? 'gold' : 'crimson'; }
    /** What a shot of `from`'s stops at on this square (`ships` false: as if no ship were on the sea). */
    stopAt(from, c, r, ships = true) {
        for (const [g, gate] of this.gates.entries()) {
            const t = gate.towerAt(c, r);
            if (t >= 0)
                return { what: 'tower', g, i: t };
        }
        const g = this.battery.findIndex((x) => x.at[0] === c && x.at[1] === r);
        if (g >= 0)
            return this.battery[g].wrecked ? { what: 'rock' } : { what: 'gun', i: g };
        if (this.rocks.has(key(c, r)))
            return { what: 'rock' };
        if (!ships)
            return null;
        const s = this.under(c, r);
        return s && s !== from ? { what: 'ship', id: s.id } : null;
    }
    /** Her broadside out of that side as it would fly now (or lying at `at`), without firing it (a bot's look
        before it fires; `ships` false, as if no ship were in the way). */
    aim(id, side, at, ships = true) {
        const s = this.ship(id), from = at ? { c: at.c, r: at.r, a: at.d } : s.helm.now();
        return broadside(s.h, from, side, (c, r) => this.stopAt(s, c, r, ships));
    }
    /** A ship struck by a shot of that size on that square, fired from `from`: her hole, there. */
    hurt(s, gun, at, from) {
        const where = struck(s.helm.pose, s.h.long, at, from), got = s.dmg.hit(gun, where.along, where.side);
        if (got.out)
            s.helm.hit(); // (dead in the water: held till she's rebuilt)
        return got;
    }
    /** Fire a ship's broadside out of that side, if it's loaded and she's not knocked out (null if not). */
    fire(id, side) {
        const s = this.ship(id);
        if (s.dmg.out || !s.guns.fire(side))
            return null;
        this.notice(); // (where everyone is now, if they've been moved by hand)
        const roused = new Set();
        const shots = this.aim(id, side).map((shot) => {
            const w = shot.what;
            if (!w || w.what === 'rock')
                return shot;
            if (w.what === 'tower') {
                roused.add(w.g);
                const tower = this.gates[w.g].towers[w.i], got = tower.hit(s.h.guns);
                if (got === 'crumbled') {
                    for (const [c, r] of tower.squares)
                        this.rocks.delete(key(c, r));
                    for (const o of this.ships)
                        o.sea.touch();
                }
                return { ...shot, got: got ?? undefined };
            }
            if (w.what === 'gun') {
                roused.add(this.gunGate[w.i]);
                return { ...shot, got: this.battery[w.i].hit() ?? undefined };
            }
            const { hole, out } = this.hurt(this.ship(w.id), s.h.guns, shot.hit, shot.from);
            return { ...shot, got: 'hit', hole, out };
        });
        this.battery.forEach((g, i) => { if (roused.has(this.gunGate[i]))
            g.rouse(); });
        const got = { ship: id, side, shots };
        this.fired.push(got);
        if (this.fired.length > 64)
            this.fired.shift(); // (nobody drawing them: kept short)
        return got;
    }
    drop(id, c, r) { return this.ship(id).helm.drop(c, r); }
    put(id, m) { return this.ship(id).helm.put(m); }
    /** The brawl (BLOCKADE.BRAWL): its two frigates put broadside to broadside; their ids. */
    brawl() {
        const ids = BLOCKADE.BRAWL.map(({ name, at }) => { const s = this.ships.find((x) => x.name === name); s.helm.moor(at); return s.id; });
        this.notice();
        return [ids[0], ids[1]];
    }
    /** In the heart of the board, inside the fort. */
    inHeart(s) { return inHeart(s.helm.pose.c, s.helm.pose.r); }
    /** Where a sloop of that side hides: the islands' coves, and her side's corner of the sea, far from the fighting. */
    coves(team) { return [...BLOCKADE.ISLANDS.map((i) => i.cove), ...(team ? BLOCKADE.HOMES[team] : [])]; }
}
