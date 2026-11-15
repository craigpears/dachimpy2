import { ShipSea, ShipHelm, Guns, broadside, squares, SLOOP_HANDLING, FRIGATE_HANDLING } from './ship-handling.js';
import { SLOOP, WAR_FRIGATE } from './ships.js';
import { Gate } from './imperial-gate.js';
import { Turret } from './den-turret.js';
import { Damage, struck } from './ship-damage.js';
const key = (c, r) => `${c},${r}`;
/** The board (c across, r out from the foot where both sides come in). */
export const BLOCKADE = {
    COLS: 30,
    ROWS: 28,
    /** The wall of rocks across the board, two deep, between the open sea and its heart. */
    WALL: { r0: 14, r1: 15 },
    /** The imperial gate in the middle of it, its one-square way (its towers two wide either side: src/imperial-gate.ts),
        and its bastion guns on the wall. */
    GATE: { WAY: 15, GUNS: [[11, 14], [19, 14]] },
    /** The side ways: a one-square gap in the wall at each flank. */
    SIDEWAYS: [2, 27],
    /** The winds (the way each blows: 0 up the board, 1 right, 2 down, 3 left; n squares from `at`): one up through
        each side way from the open sea into the heart, and one along the heart from each toward its middle. A sloop
        on one is carried along it; a frigate rides them out. */
    WINDS: [
        { at: [2, 8], d: 0, n: 11 }, { at: [27, 8], d: 0, n: 11 },
        { at: [3, 19], d: 1, n: 5 }, { at: [26, 19], d: 3, n: 5 },
    ],
    /** Rocks about the board (besides the wall). */
    ROCKS: [
        [5, 4], [6, 4], [24, 4], [23, 4], [8, 9], [9, 9], [21, 9], [22, 9], [4, 11], [26, 11], [1, 12], [28, 12],
        [11, 18], [19, 18], [6, 23], [7, 23], [23, 23], [22, 23], [14, 25], [16, 25], [1, 21], [28, 21],
    ],
    /** The buoys: out on the open sea, one or two pennants; in the heart, two, and the gate's prize, three. */
    BUOYS: [
        { at: [6, 8], pennants: 1 }, { at: [15, 9], pennants: 2 }, { at: [24, 8], pennants: 1 },
        { at: [7, 20], pennants: 2 }, { at: [15, 22], pennants: 3 }, { at: [23, 20], pennants: 2 },
    ],
    /** Squares from any of her squares a ship's influence reaches, by her size (YPPedia: "different sized ships
        have different sized influence circles"). */
    INFLUENCE: { sloop: 2, frigate: 3.5 },
    /** Seconds a blockade turn, scored at its end, and a round. */
    TURN: 10,
    ROUND: 300,
    /** The sides, and their ships: where each comes in, bows up the board. */
    TEAMS: [
        { id: 'gold', name: 'Dachimpy\'s flag', ships: [
                { name: 'Primates Rule', kind: 'frigate', at: { c: 8, r: 2, d: 0 } },
                { name: 'Lucky Banana', kind: 'sloop', at: { c: 3, r: 1, d: 0 } },
                { name: 'Grin and Bear It', kind: 'sloop', at: { c: 12, r: 1, d: 0 } },
            ] },
        { id: 'crimson', name: 'Dalnoth\'s flag', ships: [
                { name: 'Iron Pride', kind: 'frigate', at: { c: 22, r: 2, d: 0 } },
                { name: 'Red Wake', kind: 'sloop', at: { c: 26, r: 1, d: 0 } },
                { name: 'Smoke and Mirrors', kind: 'sloop', at: { c: 18, r: 1, d: 0 } },
            ] },
    ],
    /** The gate's guns' size. */
    GATE_GUNS: 'medium',
};
const HANDLINGS = { sloop: SLOOP_HANDLING, frigate: FRIGATE_HANDLING };
const CLASSES = { sloop: SLOOP, frigate: WAR_FRIGATE };
export class Blockade {
    rocks = new Set();
    wind = new Map();
    gate = new Gate(BLOCKADE.GATE.WAY, BLOCKADE.WALL.r0, BLOCKADE.WALL.r1);
    battery = BLOCKADE.GATE.GUNS.map((at) => new Turret({ at, alert: false }));
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
    constructor() {
        const B = BLOCKADE;
        for (let c = 0; c < B.COLS; c++)
            for (let r = B.WALL.r0; r <= B.WALL.r1; r++)
                if (c !== B.GATE.WAY && !B.SIDEWAYS.includes(c))
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
                this.ships.push({ id: me, name: s.name, team: team.id, kind: s.kind, h, cls: CLASSES[s.kind], sea, helm: new ShipHelm(sea, { ...s.at }), guns: new Guns(h.reload), dmg: new Damage(CLASSES[s.kind]) });
            }
        this.notice();
    }
    ship(id) { return this.ships[id]; }
    /** The ship on this square, if one is. */
    under(c, r) { const o = this.taken.get(key(c, r)); return o === undefined ? null : this.ships[o]; }
    /** Everything a tick on: each ship's helm and crew, the gate's guns, the blockade turn's scoring. */
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
            const sig = [...s.helm.covers()].sort().join(' ');
            if (sig !== this.seen.get(s.id)) {
                this.seen.set(s.id, sig);
                moved = true;
                for (const o of this.ships)
                    if (o !== s)
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
    /** What a shot of `from`'s stops at on this square. */
    stopAt(from, c, r) {
        const t = this.gate.towerAt(c, r);
        if (t >= 0)
            return { what: 'tower', i: t };
        const g = this.battery.findIndex((x) => x.at[0] === c && x.at[1] === r);
        if (g >= 0)
            return this.battery[g].wrecked ? { what: 'rock' } : { what: 'gun', i: g };
        if (this.rocks.has(key(c, r)))
            return { what: 'rock' };
        const s = this.under(c, r);
        return s && s !== from ? { what: 'ship', id: s.id } : null;
    }
    /** Her broadside out of that side as it would fly now (or lying at `at`), without firing it (a bot's look
        before it fires). */
    aim(id, side, at) {
        this.notice(); // (where everyone is now, if they've been moved by hand)
        const s = this.ship(id), from = at ? { c: at.c, r: at.r, a: at.d } : s.helm.now();
        return broadside(s.h, from, side, (c, r) => this.stopAt(s, c, r));
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
        const shots = this.aim(id, side).map((shot) => {
            const w = shot.what;
            if (!w || w.what === 'rock')
                return shot;
            if (w.what === 'tower') {
                const got = this.gate.towers[w.i].hit(s.h.guns);
                if (got === 'crumbled') {
                    for (const [c, r] of this.gate.towers[w.i].squares)
                        this.rocks.delete(key(c, r));
                    for (const o of this.ships)
                        o.sea.touch();
                }
                return { ...shot, got: got ?? undefined };
            }
            if (w.what === 'gun')
                return { ...shot, got: this.battery[w.i].hit() ?? undefined };
            const { hole, out } = this.hurt(this.ship(w.id), s.h.guns, shot.hit, shot.from);
            return { ...shot, got: 'hit', hole, out };
        });
        if (shots.some((x) => x.what?.what === 'tower' || x.what?.what === 'gun'))
            for (const g of this.battery)
                g.rouse();
        const got = { ship: id, side, shots };
        this.fired.push(got);
        if (this.fired.length > 64)
            this.fired.shift(); // (nobody drawing them: kept short)
        return got;
    }
    drop(id, c, r) { return this.ship(id).helm.drop(c, r); }
    put(id, m) { return this.ship(id).helm.put(m); }
    /** In the heart of the board, past the wall. */
    inHeart(s) { return s.helm.pose.r > BLOCKADE.WALL.r1; }
}
