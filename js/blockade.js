import { ShipSea, ShipHelm, Guns, broadside, squares, SLOOP_HANDLING, FRIGATE_HANDLING, BRIG_HANDLING } from './ship-handling.js';
import { HullChart } from './hull-chart.js';
import { SLOOP, WAR_FRIGATE, WAR_BRIG } from './ships.js';
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
    /** The imperial gates: each one's way (its column), its wall's rows, its bastion guns on the wall, four, doubled up
        (15 Nov: "I do love watching the imperial [cannons] ... training on people's positions, especially punishing people
        camping. I almost partly think that we need to double up on the [cannons] ... stop people camping. And provide
        more of a barrier to the war frigates"): two by the gate's towers, two further along. */
    GATES: [
        { way: 21, r0: 12, r1: 13, guns: [[16, 12], [18, 12], [24, 12], [26, 12]] },
        { way: 22, r0: 22, r1: 23, guns: [[17, 23], [19, 23], [25, 23], [27, 23]] },
    ],
    /** Seconds a ship lingers in a gate gun's reach before it fires on her, roused or not: camping there's punished;
        slipping past isn't, mostly; charging through a fallen gate under its guns costs her. */
    CAMP: 4,
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
    INFLUENCE: { sloop: 2, brig: 2.75, frigate: 3.5 },
    /** A brig's craft: seconds between her launches, how many she launches, their names, seconds each lasts before she
        fades (a ghost sloop's "a set number of turns", four blockade turns), and a turtle's ram, as so many hits of a gun
        that size where she strikes. */
    LAUNCH: {
        EVERY: 30,
        CRAFT: { ghost: ['Wisp', 'Shade'], ram: ['Snapper', 'Old Shell', 'Barnacle'] },
        LIFE: { ghost: 40, ram: 30 },
        RAM: { gun: 'large', hits: 2 },
    },
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
                { name: 'Tidecaller', kind: 'brig', at: { c: 9, r: 1, d: 0 }, craft: 'ram' },
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
                { name: 'Grave Lantern', kind: 'brig', at: { c: 35, r: 34, d: 2 }, craft: 'ghost' },
            ] },
    ],
    /** How near (squares) a ship has to be to another for her moving to make the other's pilot think again. */
    NEAR: 8,
    /** How near (squares) another ship has to be to be in a ship's way, as her pilot works it out: one further off will
        have moved by the time she's there (inside NEAR, so a ship in her way moving always makes her think again). */
    IN_WAY: 5,
    /** The gates' guns' size. */
    GATE_GUNS: 'medium',
    /** A sinking blockade: a ship shot on while she's knocked out sinks (src/ship-damage.ts, SINK), and comes back
        this many seconds later where she came in at the start, refitted. */
    SINKING: true,
    RETURN: 25,
    /** The brawl to watch (blockade-test.html?watch=brawl, 15 Nov: "I want to see two of the big ships really having a
        brawl and fighting it out to see what that damage looks like"; "That needs to be like one of the shortcuts so
        people can actually see a cinematic of the blockade"): two war frigates broadside to broadside on the open water
        between the south-west islands and the fort, room to come about, the rest of the blockade going on round them. */
    BRAWL: [{ name: 'Primates Rule', at: { c: 7, r: 10, d: 1 } }, { name: 'Iron Pride', at: { c: 7, r: 14, d: 1 } }],
};
const HANDLINGS = { sloop: SLOOP_HANDLING, brig: BRIG_HANDLING, frigate: FRIGATE_HANDLING };
const CLASSES = { sloop: SLOOP, brig: WAR_BRIG, frigate: WAR_FRIGATE };
/** A brig's sea turtle: a sloop's size on the board, no guns, a couple of small shots and she's gone. */
export const SEA_TURTLE = { ...SLOOP, name: 'Sea turtle', crew: 1, minCrew: 1, guns: 0, mainDeckGuns: 0, stations: { nav: 1, sailing: 0, carpentry: 0, bilge: 0, gunnery: 0 } };
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
    /** Every launch of a brig's craft, and every turtle's ram, since whoever draws them last took them. */
    launches = [];
    seen = new Map();
    /** Each square a ship covers just now, and whose (kept as they move: notice). */
    taken = new Map();
    /** Each gate gun's seconds each ship's been in its reach (camping there, past BLOCKADE.CAMP), and the ship it's
        firing on just now (-1: none). */
    dwell = [];
    gunOn = [];
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
                this.ships.push({ id: me, name: s.name, team: team.id, kind: s.kind, h, cls: CLASSES[s.kind], raider: !!s.raider, sea, helm: new ShipHelm(sea, { ...s.at }), guns: new Guns(h.reload), dmg: new Damage(CLASSES[s.kind]), start: { ...s.at }, away: 0, launched: -Infinity });
            }
        // (each brig's craft, aboard her till she launches them: after every fleet's ships, so theirs keep their ids)
        for (const team of B.TEAMS)
            for (const f of team.ships) {
                if (!f.craft)
                    continue;
                const by = this.ships.find((x) => x.name === f.name);
                for (const name of B.LAUNCH.CRAFT[f.craft]) {
                    const me = id++, cls = f.craft === 'ram' ? SEA_TURTLE : SLOOP;
                    const sea = new ShipSea(SLOOP_HANDLING, B.COLS, B.ROWS, this.rocks, (c, r) => { const o = this.taken.get(key(c, r)); return o !== undefined && o !== me; });
                    sea.carriedBy(this.wind);
                    sea.chart = this.charts.sloop ??= new HullChart(sea.bare());
                    sea.near = B.IN_WAY;
                    this.ships.push({ id: me, name, team: team.id, kind: 'sloop', h: SLOOP_HANDLING, cls, raider: false, sea, helm: new ShipHelm(sea, { ...by.start }), guns: new Guns(SLOOP_HANDLING.reload), dmg: new Damage(cls), start: { ...by.start }, away: Infinity, craft: { by: by.id, kind: f.craft, life: 0 }, launched: -Infinity });
                }
            }
        // (the charts worked out now, while the board's being set up, rather than on the first move)
        for (const c of Object.values(this.charts))
            c.fresh();
        this.notice();
    }
    ship(id) { return this.ships[id]; }
    /** On the board: not sunk and waiting to come back. */
    afloat(s) { return s.away <= 0; }
    /** The ship on this square, if one is. */
    under(c, r) { const o = this.taken.get(key(c, r)); return o === undefined ? null : this.ships[o]; }
    /** A gate's down: the heart's open to a frigate. */
    gateOpen() { return this.gates.some((g) => g.open()); }
    /** Everything a tick on: each ship's helm and crew, the gates' guns, the blockade turn's scoring. */
    tick(dt) {
        const out = { sail: new Map(), damage: new Map(), guns: [], scored: false, returned: [], faded: [], rams: [] };
        if (this.over)
            return out;
        for (const s of this.ships) {
            // (sunk: back where she came in once her time's up and nobody's lying there)
            if (s.away > 0) {
                if (s.craft)
                    continue; // (aboard her brig, till she's launched)
                if ((s.away -= dt) <= 0 && !this.comeBack(s))
                    s.away = 0.5;
                if (s.away <= 0)
                    out.returned.push(s.id);
                continue;
            }
            // (a craft's time up, or her brig gone down: she fades)
            if (s.craft && ((s.craft.life -= dt) <= 0 || this.ships[s.craft.by].away > 0)) {
                this.aboard(s);
                out.faded.push(s.id);
                continue;
            }
            const ev = s.dmg.tick(dt);
            if (ev.some((e) => e.kind === 'back'))
                s.helm.hole = null;
            s.sea.drag = s.dmg.drag();
            out.damage.set(s.id, ev);
            out.sail.set(s.id, s.helm.tick(dt));
            s.guns.tick(dt);
            this.notice();
        }
        // (a turtle beside an enemy rams her: her holes where she struck, and the turtle's gone)
        for (const s of this.ships) {
            if (s.craft?.kind !== 'ram' || s.away > 0 || s.dmg.out)
                continue;
            const hit = this.besideFoe(s);
            if (!hit)
                continue;
            const { o, at } = hit, from = [s.helm.pose.c, s.helm.pose.r], holes = [];
            let sunk = false;
            for (let i = 0; i < BLOCKADE.LAUNCH.RAM.hits && !sunk && o.away <= 0; i++) {
                const got = this.hurt(o, BLOCKADE.LAUNCH.RAM.gun, at, from);
                holes.push(got.hole);
                sunk = got.sunk;
            }
            this.aboard(s);
            out.rams.push({ ram: s.id, on: o.id, at, holes, sunk });
        }
        // (every square a ship's on, read once for all the guns)
        const on = [...this.taken].map(([k, id]) => { const [c, r] = k.split(',').map(Number); return { c, r, id }; });
        this.battery.forEach((g, i) => {
            // (how long each ship's been under it: a gun not yet roused fires on whoever's camped there)
            const dw = this.dwell[i] ??= new Map(), near = new Set(on.filter((x) => g.reaches(x.c, x.r)).map((x) => x.id));
            for (const s of this.ships)
                if (near.has(s.id))
                    dw.set(s.id, (dw.get(s.id) ?? 0) + dt);
                else
                    dw.delete(s.id);
            const target = this.gunTarget(g, on, g.roused ? null : (id) => (dw.get(id) ?? 0) >= BLOCKADE.CAMP);
            this.gunOn[i] = target?.id ?? -1;
            for (const e of g.tick(dt, target, !!target)) {
                const hit = e.kind === 'land' ? this.under(...e.to) : null;
                let hole, sunk = false;
                if (hit)
                    ({ hole, sunk } = this.hurt(hit, BLOCKADE.GATE_GUNS, e.to, g.at));
                out.guns.push({ gun: i, e, hit: hit?.id ?? null, hole, sunk });
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
    /** The ship a gate's gun fires on: the nearest square of any in its reach (`only` those camped there, if it's not
        roused), not knocked out (unless it's a sinking blockade: lying there knocked out, she's camping). */
    gunTarget(g, on, only = null) {
        let best = null, far = Infinity;
        for (const x of on) {
            const s = this.ships[x.id];
            if ((s.dmg.out && !BLOCKADE.SINKING) || (only && !only(s.id)))
                continue;
            const d = Math.max(Math.abs(x.c - g.at[0]), Math.abs(x.r - g.at[1]));
            if (g.reaches(x.c, x.r) && d < far) {
                far = d;
                best = x;
            }
        }
        return best;
    }
    /** Where any ship's moved to, every other's pilot works her way out afresh. */
    notice() {
        let moved = false;
        for (const s of this.ships) {
            // (where she is and where the move she's on takes her: what she covers, cheaply)
            const p = s.helm.pose, to = s.helm.cur?.to, sig = s.away > 0 ? 'away' : `${p.c},${p.r},${p.d}${to ? `>${to.c},${to.r},${to.d}` : ''}`;
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
            if (s.away <= 0)
                for (const k of s.helm.covers())
                    this.taken.set(k, s.id);
    }
    /** A ship's influence reaches this buoy: within her circle of any square of hers, and she's not knocked out. */
    reaches(s, b) {
        if (s.dmg.out || s.away > 0 || s.craft?.kind === 'ram')
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
    /** A ship struck by a shot of that size on that square, fired from `from`: her hole, there (and she's sunk, if it
        was the last she could take). */
    hurt(s, gun, at, from) {
        const where = struck(s.helm.pose, s.h.long, at, from), got = s.dmg.hit(gun, where.along, where.side, BLOCKADE.SINKING);
        if (got.out)
            s.helm.hit(); // (dead in the water: held till she's rebuilt)
        // (a brig's craft knocked out goes down at once)
        if (got.sunk || (s.craft && got.out)) {
            this.sink(s);
            return { ...got, sunk: true };
        }
        return got;
    }
    /** She's gone down: off the board till she comes back (comeBack), in nobody's way meanwhile; a brig's craft, back
        aboard her brig. */
    sink(s) {
        if (s.craft) {
            this.aboard(s);
            return;
        }
        s.away = BLOCKADE.RETURN;
        s.helm.moor(s.helm.pose);
        s.helm.hole = null;
        this.notice();
    }
    /** A brig's craft back aboard her (faded, sunk, or rammed home): off the board till she's launched again. */
    aboard(s) {
        s.away = Infinity;
        s.craft.life = 0;
        s.helm.moor(s.helm.pose);
        s.helm.hole = null;
        this.notice();
    }
    /** A brig's craft still aboard her. */
    craftOf(brig) { return this.ships.filter((x) => x.craft?.by === brig.id); }
    /** She can launch: a brig afloat and in action, her time since her last launch up, and her craft all aboard. */
    canLaunch(s) {
        const craft = this.craftOf(s);
        return s.kind === 'brig' && s.away <= 0 && !s.dmg.out && this.clock - s.launched >= BLOCKADE.LAUNCH.EVERY && craft.length > 0 && craft.every((x) => x.away > 0);
    }
    /** A brig launches her craft off her sides (port and starboard by each of her squares, then off her bow and her
        stern), each heading as she is, refitted, for her LIFE: their ids (none, if she can't). */
    launch(id) {
        const s = this.ship(id);
        if (!this.canLaunch(s))
            return [];
        this.notice();
        const p = s.helm.pose, DC = [0, 1, 0, -1], DR = [1, 0, -1, 0], sd = (p.d + 1) % 4, mine = squares(s.h, p), al = mine.length;
        const spots = [];
        for (const [c, r] of mine)
            for (const k of [1, -1])
                spots.push([c + DC[sd] * k, r + DR[sd] * k]);
        const [bc, br] = mine[0], [sc, sr] = mine[al - 1];
        spots.push([bc + DC[p.d], br + DR[p.d]], [sc - DC[p.d], sr - DR[p.d]]);
        const out = [];
        for (const x of this.craftOf(s)) {
            const at = spots.find(([c, r]) => x.sea.bare().fits({ c, r, d: p.d }) && !this.taken.has(key(c, r)));
            if (!at)
                break;
            spots.splice(spots.indexOf(at), 1);
            x.dmg.refit();
            x.sea.drag = 1;
            x.sea.exact = null;
            x.helm.moor({ c: at[0], r: at[1], d: p.d });
            x.helm.hole = null;
            x.guns.wait = { L: 0, R: 0 };
            x.away = 0;
            x.craft.life = BLOCKADE.LAUNCH.LIFE[x.craft.kind];
            this.taken.set(key(...at), x.id);
            out.push(x.id);
        }
        if (out.length) {
            s.launched = this.clock;
            this.launches.push({ by: id, ids: out });
            this.notice();
        }
        return out;
    }
    /** An enemy beside a turtle (on a square next to hers, diagonals too), and the square of hers it's on. */
    besideFoe(s) {
        const { c, r } = s.helm.pose;
        for (let dc = -1; dc <= 1; dc++)
            for (let dr = -1; dr <= 1; dr++) {
                const o = this.under(c + dc, r + dr);
                if (o && o !== s && o.team !== s.team && o.away <= 0)
                    return { o, at: [c + dc, r + dr] };
            }
        return null;
    }
    /** Back where she came in, refitted, if nobody's lying there: whether she is. */
    comeBack(s) {
        if (!s.sea.bare().fits(s.start) || squares(s.h, s.start).some(([c, r]) => this.taken.has(key(c, r))))
            return false;
        s.dmg.refit();
        s.sea.drag = 1;
        s.sea.exact = null;
        s.helm.moor(s.start);
        s.helm.hole = null;
        s.guns.wait = { L: 0, R: 0 };
        s.away = 0;
        this.notice();
        return true;
    }
    /** Fire a ship's broadside out of that side, if it's loaded and she's not knocked out (null if not). */
    fire(id, side) {
        const s = this.ship(id);
        if (s.dmg.out || s.away > 0 || !s.guns.fire(side))
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
            const { hole, out, sunk } = this.hurt(this.ship(w.id), s.h.guns, shot.hit, shot.from);
            return { ...shot, got: 'hit', hole, out, sunk };
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
