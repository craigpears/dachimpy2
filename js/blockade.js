import { ShipSea, ShipHelm, Guns, broadside, squares, SLOOP_HANDLING, FRIGATE_HANDLING, BRIG_HANDLING } from './ship-handling.js';
import { HullChart } from './hull-chart.js';
import { SLOOP, WAR_FRIGATE, WAR_BRIG } from './ships.js';
import { Gate } from './imperial-gate.js';
import { Turret } from './den-turret.js';
import { Damage, struck } from './ship-damage.js';
const key = (c, r) => `${c},${r}`;
/** The board (c across, r up from the south edge). */
export const BLOCKADE = {
    COLS: 56,
    ROWS: 48,
    /** Open sea added round the board on every side, squares (the user, 15 Nov: "the whole board's a bit small ... brigs and
        frigs are spawning very close to the action. Like there needs to be a bit of a buffer travel zone"): a ship that
        sinks has a way to sail back, the sloops riding the edge winds in quickly. */
    PAD: 6,
    /** The fort's walls, two deep, round the heart. */
    WALLS: [
        { c0: 20, c1: 35, r0: 18, r1: 19 }, { c0: 20, c1: 35, r0: 28, r1: 29 },
        { c0: 20, c1: 21, r0: 18, r1: 29 }, { c0: 34, c1: 35, r0: 18, r1: 29 },
    ],
    /** The heart, inside them. */
    HEART: { c0: 22, c1: 33, r0: 20, r1: 27 },
    /** The imperial gates: each one's way (its column), its wall's rows, its bastion guns on the wall, four, doubled up
        (15 Nov: "I do love watching the imperial [cannons] ... training on people's positions, especially punishing people
        camping. I almost partly think that we need to double up on the [cannons] ... stop people camping. And provide
        more of a barrier to the war frigates"): two by the gate's towers, two further along. */
    GATES: [
        { way: 27, r0: 18, r1: 19, guns: [[22, 18], [24, 18], [30, 18], [32, 18]] },
        { way: 28, r0: 28, r1: 29, guns: [[23, 29], [25, 29], [31, 29], [33, 29]] },
    ],
    /** Seconds a gate gun's shot is coming down on the square it painted: a sloop on the move is gone from it (a move a
        second or so), a frigate in the middle of hers (two and a half) and a ship lying still aren't. Camping by a gate,
        or lying broadside to its tower, is punished by it; moving through isn't. */
    GATE_AIM: 2.4,
    /** The side ways: a one-square gap through the west wall and the east. */
    SIDEWAYS: [[20, 24], [21, 24], [34, 23], [35, 23]],
    /** A postern by each of the heart's two corners no way out runs through: a one-square gap through the wall from the
        open sea into the corner (the user, 15 Nov: "we've created a bit of a corner for [brigs] to hide ... we also need to
        balance that with another kind of gap coming from the outside"). A sloop slips in at a brig at anchor there, a
        frigate outside fires in through it; no frigate gets through. (The other two corners have the ways out.) */
    POSTERNS: [[20, 20], [21, 20], [34, 27], [35, 27]],
    /** The winds (the way each blows: 0 up the board, 1 right, 2 down, 3 left; n squares from `at`): one a side, from its
        own edge in through its lagoon and its side way into the heart. A sloop on one is carried along it; a frigate rides
        them out. */
    WINDS: [{ at: [0, 24], d: 1, n: 24 }, { at: [55, 23], d: 3, n: 24 }],
    /** The ways out of the heart, one to each lagoon: a wind blowing out through a gap in the fort's wall and on into the
        lagoon by a gap in its reef, carrying a sloop from the heart to its buoy in one move. */
    EXITS: [
        [{ at: [22, 26], d: 3, n: 10 }],
        [{ at: [33, 21], d: 1, n: 10 }],
    ],
    /** The lagoons, one on each side's wind: a reef round each, a ring three squares out (any way) from its middle with
        gaps a square wide (the side's wind in and on, the wind out of the heart, one to the north and one to the south),
        a lagoon five across inside, its buoy in the middle (so no frigate, even in the shoals, reaches it), a tiny island
        by it and the sloops' hiding place in a corner; and shoals `shoal` squares wide round the reef. The east's the
        west's turned round the board's middle. */
    REEFS: [
        { at: [12, 25], ring: 3, gaps: [[9, 24], [15, 24], [15, 26], [12, 28], [12, 22]], islet: [13, 23], hide: [11, 26], shoal: 3 },
        { at: [43, 22], ring: 3, gaps: [[46, 23], [40, 23], [40, 21], [43, 19], [43, 25]], islet: [42, 24], hide: [44, 21], shoal: 3 },
    ],
    /** A frigate in the shoals: every SCRAPE seconds she's in them she scrapes her bottom (a hole, as a shot of that size
        on the square she's in them), and her pilot's toll, the seconds a move through them is reckoned to cost her more. */
    SHOALS: { SCRAPE: 1.5, GUN: 'small', TOLL: 8 },
    /** Rocks about the open sea and the heart. */
    ROCKS: [
        // (none along the west and east edges: with the reefs, the way round past them is the frigates' only one from the
        // south to the north, and two squares either side of a rock is too narrow for her, at her every other square)
        [18, 13], [19, 13], [36, 13], [37, 13], [18, 34], [19, 34], [36, 34], [37, 34], [27, 10], [28, 37],
        [24, 26], [31, 21],
        // (a rock off each end of a frigate lying on the heart's prize: a sloop in her blind spot ducks behind it when she
        // turns; the user, 15 Nov: "even tweak the map if it makes these situations easier ... the [war frig] could be
        // sitting in the middle and a sloop can jump out into those blind spots ... camping should not be rewarded")
        [24, 22], [31, 25],
        // (and one beside each of those, so every corner of the heart is a nook a brig can lie in out of any frigate's reach
        // there, to launch from: the user, 15 Nov, "an enclosed launching spot for a brig ... one rock in each corner")
        [32, 25], [23, 22],
    ],
    /** The buoys: in the heart, its prize four and two of two, eight in all; in each lagoon five; off each gate two, the
        sloops' quick spots (a frigate sniping at whoever sits on them). Holding the heart and contesting a lagoon beats
        holding the other lagoon (8 to 5); both lagoons beat the heart (10 to 8): the user, 15 Nov, "if you're controlling
        the centre and then you're at least contesting one of the lagoons, you should win ... the two lagoons together
        should beat the centre ... centre's worth 8, a lagoon is worth 5". */
    BUOYS: [
        { at: [27, 23], pennants: 4 }, { at: [24, 21], pennants: 2 }, { at: [31, 26], pennants: 2 },
        { at: [27, 14], pennants: 2 }, { at: [28, 33], pennants: 2 },
        { at: [12, 25], pennants: 5 }, { at: [43, 22], pennants: 5 },
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
        // (a turtle rams again and again, every COOL seconds, for as long as she's out: the user, 15 Nov, rock, paper,
        // scissors: "War brigs, can they be good at beating war frigates with how they deploy the turtles?"; "if you go for
        // too many frigs ... the other team having Atlantean war frigs. They'll just send in the turtles and crush your war
        // frigs")
        RAM: { gun: 'large', hits: 1, COOL: 4, STILL: 1 },
        /** Seconds weighing anchor takes a brig, her craft called home as she starts (the user, 15 Nov: "she has to stay
            anchored while they're out ... once a Brig's committed ... very difficult to ... raise the anchor. They become a
            sitting duck"). */
        WEIGH: 8,
    },
    /** Seconds a blockade turn, scored at its end, and a round. */
    TURN: 10,
    ROUND: 360,
    /** The sides, and their fleets: where each ship comes in (a frigate's config by her name: src/den-frigate.ts). */
    TEAMS: [
        { id: 'gold', name: "Dachimpy's flag", ships: [
                { name: 'Primates Rule', kind: 'frigate', at: { c: 23, r: 2, d: 0 }, other: { c: 26, r: 45, d: 2 } },
                { name: 'Coral Throne', kind: 'frigate', at: { c: 33, r: 2, d: 0 }, other: { c: 16, r: 45, d: 2 } },
                { name: 'Lucky Banana', kind: 'sloop', at: { c: 1, r: 16, d: 1 }, raider: true },
                { name: 'Grin and Bear It', kind: 'sloop', at: { c: 1, r: 22, d: 1 }, far: true },
                { name: 'Cheeky Monkey', kind: 'sloop', at: { c: 1, r: 26, d: 1 } },
                { name: 'Bananarama', kind: 'sloop', at: { c: 1, r: 32, d: 1 }, raider: true, far: true },
                { name: 'Coconut Shy', kind: 'sloop', at: { c: 1, r: 19, d: 1 } },
                { name: 'Tidecaller', kind: 'brig', at: { c: 2, r: 29, d: 1 }, craft: 'ram' },
                { name: 'Pearl Diver', kind: 'brig', at: { c: 2, r: 13, d: 1 }, craft: 'ram', far: true },
            ] },
        { id: 'crimson', name: "Dalnoth's flag", ships: [
                { name: 'Iron Pride', kind: 'frigate', at: { c: 32, r: 45, d: 2 }, other: { c: 17, r: 2, d: 0 } },
                { name: 'Eldritch Wail', kind: 'frigate', at: { c: 22, r: 45, d: 2 }, other: { c: 27, r: 2, d: 0 } },
                { name: 'Red Wake', kind: 'sloop', at: { c: 54, r: 31, d: 3 }, raider: true },
                { name: 'Smoke and Mirrors', kind: 'sloop', at: { c: 54, r: 25, d: 3 }, far: true },
                { name: 'Scarlet Fever', kind: 'sloop', at: { c: 54, r: 21, d: 3 } },
                { name: 'Blood Orange', kind: 'sloop', at: { c: 54, r: 15, d: 3 }, raider: true, far: true },
                { name: 'Rust Bucket', kind: 'sloop', at: { c: 54, r: 28, d: 3 } },
                { name: 'Grave Lantern', kind: 'brig', at: { c: 53, r: 18, d: 3 }, craft: 'ghost' },
                { name: "Wraith's Wake", kind: 'brig', at: { c: 53, r: 34, d: 3 }, craft: 'ghost', far: true },
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
        in the south-west corner, room to come about and for the camera to go round them clear of the fort, the rest of the
        blockade going on beyond them. */
    BRAWL: [{ name: 'Primates Rule', at: { c: 12, r: 9, d: 1 } }, { name: 'Iron Pride', at: { c: 12, r: 13, d: 1 } }],
};
const HANDLINGS = { sloop: SLOOP_HANDLING, brig: BRIG_HANDLING, frigate: FRIGATE_HANDLING };
const CLASSES = { sloop: SLOOP, brig: WAR_BRIG, frigate: WAR_FRIGATE };
/** A brig's sea turtle: a sloop's size on the board, no guns, a couple of small shots and she's gone. */
export const SEA_TURTLE = { ...SLOOP, name: 'Sea turtle', crew: 1, minCrew: 1, guns: 0, mainDeckGuns: 0, stations: { nav: 1, sailing: 0, carpentry: 0, bilge: 0, gunnery: 0 } };
/** A sea turtle swims fast, a move in 0.6 of a sloop's time, at a frigate in seconds (the user, 15 Nov: "they're
    supposed to be much faster than the [war brigs] ... a quick deploy tool"); what keeps her off a sloop is her ram,
    which needs a ship lying still a moment (RAM.STILL), not her pace. */
export const TURTLE_HANDLING = { ...SLOOP_HANDLING, name: 'Sea turtle', pace: SLOOP_HANDLING.pace * 0.6, move: SLOOP_HANDLING.move * 0.6, turn: SLOOP_HANDLING.turn * 0.6 };
/** A phantom sloop: the sloop's size, sluggish as a frigate (her moves taking as long as a frigate's square does). */
export const PHANTOM_HANDLING = { ...SLOOP_HANDLING, name: 'Phantom sloop', pace: SLOOP_HANDLING.pace * 1.3, move: SLOOP_HANDLING.move * 1.3, turn: SLOOP_HANDLING.turn * 1.3 };
/** A phantom: shots go through her, she holds no buoy, nothing can hurt her (she fades when her time's up). */
export const phantom = (s) => s.craft?.kind === 'ghost';
const inRect = (x, c, r) => c >= x.c0 && c <= x.c1 && r >= x.r0 && r <= x.r1;
/** A square in the heart. */
export const inHeart = (c, r) => inRect(BLOCKADE.HEART, c, r);
/** A reef's squares: its ring but its gaps (a square already land, an island's or the fort's, still counted). */
export function reefSquares(x) {
    const out = [], gaps = new Set(x.gaps.map(([c, r]) => key(c, r))), [bc, br] = x.at;
    for (let c = bc - x.ring; c <= bc + x.ring; c++)
        for (let r = br - x.ring; r <= br + x.ring; r++) {
            if (Math.max(Math.abs(c - bc), Math.abs(r - br)) === x.ring && !gaps.has(key(c, r)))
                out.push([c, r]);
        }
    return out;
}
/** Every square of a wind lane, in order, and the way it blows. */
/** A reef's shoals: the band `shoal` squares wide outside its ring, on the board and not rock. */
export function shoalSquares(x) {
    const out = [], [bc, br] = x.at, R = x.ring + x.shoal;
    for (let c = Math.max(0, bc - R); c <= Math.min(BLOCKADE.COLS - 1, bc + R); c++)
        for (let r = Math.max(0, br - R); r <= Math.min(BLOCKADE.ROWS - 1, br + R); r++) {
            if (Math.max(Math.abs(c - bc), Math.abs(r - br)) > x.ring)
                out.push([c, r]);
        }
    return out;
}
export function laneSquares({ at: [c, r], d, n }) {
    return Array.from({ length: n }, (_, i) => [c + [0, 1, 0, -1][d] * i, r + [1, 0, -1, 0][d] * i]);
}
/** The same place on the far side's edge: across the board, facing the other way (a sloop's or a brig's other entry). */
export function farSide(p) { return { c: BLOCKADE.COLS - 1 - p.c, r: p.r, d: p.d === 1 ? 3 : p.d === 3 ? 1 : p.d }; }
export class Blockade {
    rocks = new Set();
    wind = new Map();
    /** How long each ship's lain still (on the same square, the same way), seconds: a phantom's for the taking. */
    still = new Map();
    stillAt = new Map();
    /** The shoals round the lagoons (rock's not shoal); a frigate's seconds in them towards her next scrape. */
    shoals = new Set();
    scrape = new Map();
    gates = BLOCKADE.GATES.map((x) => new Gate(x.way, x.r0, x.r1));
    /** Every gate's bastion guns, and whose gate each is. */
    battery = BLOCKADE.GATES.flatMap((x) => x.guns.map((at) => new Turret({ at, alert: true, flight: BLOCKADE.GATE_AIM })));
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
    gunOn = [];
    /** Each kind of ship's chart of this board (src/hull-chart.ts): all the sloops share one, all the frigates another. */
    charts = {};
    /** Ships sunk stay sunk (a skirmish); and open sea, nothing on it but the ships. */
    skirmish = false;
    open = false;
    constructor(setup = {}) {
        const B = BLOCKADE, teams = setup.teams ?? B.TEAMS, open = !!setup.open;
        this.skirmish = !!setup.skirmish;
        this.open = open;
        if (open) {
            this.gates = [];
            this.battery = [];
            this.gunGate = [];
        }
        const side = new Set([...B.SIDEWAYS, ...B.POSTERNS, ...B.EXITS.flat().flatMap(laneSquares)].map(([c, r]) => key(c, r))), ways = new Set(B.GATES.flatMap((x) => [key(x.way, x.r0), key(x.way, x.r1)]));
        if (!open) {
            for (const w of B.WALLS)
                for (let c = w.c0; c <= w.c1; c++)
                    for (let r = w.r0; r <= w.r1; r++)
                        if (!side.has(key(c, r)) && !ways.has(key(c, r)))
                            this.rocks.add(key(c, r));
            for (const [c, r] of B.ROCKS)
                this.rocks.add(key(c, r));
            for (const reef of B.REEFS)
                for (const [c, r] of [...reefSquares(reef), reef.islet])
                    this.rocks.add(key(c, r));
            for (const lane of [...B.WINDS, ...B.EXITS.flat()])
                for (const [c, r] of laneSquares(lane))
                    this.wind.set(key(c, r), lane.d);
            for (const reef of B.REEFS)
                for (const [c, r] of shoalSquares(reef))
                    if (!this.rocks.has(key(c, r)))
                        this.shoals.add(key(c, r));
        }
        let id = 0;
        for (const team of teams)
            for (const s of team.ships) {
                const h = HANDLINGS[s.kind], me = id++;
                const sea = new ShipSea(h, B.COLS, B.ROWS, this.rocks, (c, r) => { const o = this.taken.get(key(c, r)); return o !== undefined && o !== me; });
                if (s.kind === 'sloop')
                    sea.carriedBy(this.wind);
                // (a frigate's pilot reckons the shoals' toll: her kind's chart is worked out with it)
                if (s.kind === 'frigate')
                    sea.toll = { squares: this.shoals, secs: B.SHOALS.TOLL };
                sea.chart = this.charts[s.kind] ??= new HullChart(sea.bare());
                sea.near = B.IN_WAY;
                // (a sloop or a brig on the blockade's board can come in by either side's edge: her own, or the same place on the
                // far one; the user, 15 Nov: "for the smaller ships, they should ... be able to spawn ... on any side that they
                // want to ... island and oceanside spawns", so no side's lagoon is a safe home for its brigs)
                const both = !setup.open && !setup.skirmish;
                const entries = both && s.kind !== 'frigate' ? [{ ...s.at }, farSide(s.at)] : both && s.other ? [{ ...s.at }, { ...s.other }] : [{ ...s.at }], entry = s.far && entries.length > 1 ? 1 : 0;
                const at = entries[entry];
                this.ships.push({ id: me, name: s.name, team: team.id, kind: s.kind, h, cls: CLASSES[s.kind], raider: !!s.raider, sea, helm: new ShipHelm(sea, { ...at }), guns: new Guns(h.reload), dmg: new Damage(CLASSES[s.kind]), start: { ...at }, away: 0, launched: -Infinity, entries, entry });
            }
        // (each brig's craft, aboard her till she launches them: after every fleet's ships, so theirs keep their ids)
        for (const team of teams)
            for (const f of team.ships) {
                if (!f.craft)
                    continue;
                const by = this.ships.find((x) => x.name === f.name);
                for (const name of B.LAUNCH.CRAFT[f.craft]) {
                    const me = id++, cls = f.craft === 'ram' ? SEA_TURTLE : SLOOP, h = f.craft === 'ram' ? TURTLE_HANDLING : PHANTOM_HANDLING;
                    const sea = new ShipSea(h, B.COLS, B.ROWS, this.rocks, (c, r) => { const o = this.taken.get(key(c, r)); return o !== undefined && o !== me; });
                    sea.carriedBy(this.wind);
                    sea.chart = this.charts.sloop ??= new HullChart(sea.bare());
                    sea.near = B.IN_WAY;
                    this.ships.push({ id: me, name, team: team.id, kind: 'sloop', h, cls, raider: false, sea, helm: new ShipHelm(sea, { ...by.start }), guns: new Guns(SLOOP_HANDLING.reload), dmg: new Damage(cls), start: { ...by.start }, away: Infinity, craft: { by: by.id, kind: f.craft, life: 0 }, launched: -Infinity, entries: [{ ...by.start }], entry: 0 });
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
        const out = { sail: new Map(), damage: new Map(), guns: [], scored: false, returned: [], faded: [], rams: [], scrapes: [] };
        if (this.over)
            return out;
        for (const s of this.ships) {
            // (sunk: back where she came in once her time's up and nobody's lying there)
            if (s.away > 0) {
                if (s.craft || this.skirmish)
                    continue; // (aboard her brig, till she's launched; a skirmish's sunk, gone)
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
            {
                const p = s.helm.pose, k = `${p.c},${p.r},${p.d}`;
                this.still.set(s.id, this.stillAt.get(s.id) === k ? (this.still.get(s.id) ?? 0) + dt : 0);
                this.stillAt.set(s.id, k);
            }
            // (a frigate in the shoals scraping her bottom, every so often while she's in them)
            if (s.kind === 'frigate') {
                const shoal = squares(s.h, s.helm.pose).find(([c, r]) => this.shoals.has(key(c, r)));
                const t = shoal ? (this.scrape.get(s.id) ?? 0) + dt : 0;
                if (shoal && t >= BLOCKADE.SHOALS.SCRAPE) {
                    this.scrape.set(s.id, 0);
                    const got = this.hurt(s, BLOCKADE.SHOALS.GUN, shoal, shoal);
                    out.scrapes.push({ ship: s.id, at: shoal, hole: got.hole, sunk: got.sunk });
                    if (got.sunk)
                        continue;
                }
                else
                    this.scrape.set(s.id, t);
            }
            s.sea.drag = s.dmg.drag();
            out.damage.set(s.id, ev);
            out.sail.set(s.id, s.helm.tick(dt));
            s.guns.tick(dt);
            // (a brig at anchor, her craft out: she lies where she is; weighing it, she's free once it's up)
            if (s.kind === 'brig' && (s.weigh ?? 0) > 0 && (s.weigh = Math.max(0, s.weigh - dt)) === 0)
                this.notice();
            if (this.anchored(s) && (s.helm.pin || s.helm.mine.length)) {
                s.helm.stop();
                while (s.helm.mine.length)
                    s.helm.unput();
            }
            this.notice();
        }
        // (a turtle beside an enemy frigate or brig rams her: her holes where she struck; the turtle backs off a moment and
        // comes again)
        for (const s of this.ships) {
            if (s.craft?.kind !== 'ram' || s.away > 0 || s.dmg.out)
                continue;
            if ((s.craft.cool = Math.max(0, (s.craft.cool ?? 0) - dt)) > 0)
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
            s.craft.cool = BLOCKADE.LAUNCH.RAM.COOL;
            out.rams.push({ ram: s.id, on: o.id, at, holes, sunk });
        }
        // (every square a ship's on, read once for all the guns)
        const on = [...this.taken].map(([k, id]) => { const [c, r] = k.split(',').map(Number); return { c, r, id }; });
        this.battery.forEach((g, i) => {
            // (the nearest ship in its reach: it paints her square and fires, the shot GATE_AIM coming down; moving, she's gone
            // from it, lying still she isn't)
            const target = this.gunTarget(g, on);
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
            if ((s.dmg.out && !BLOCKADE.SINKING) || (only && !only(s.id)) || phantom(s))
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
        if (s.dmg.out || s.away > 0 || s.craft)
            return false; // (a brig's craft hold no buoy)
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
        // (a phantom: the shot goes through her)
        return s && s !== from && !phantom(s) ? { what: 'ship', id: s.id } : null;
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
        s.away = this.skirmish ? Infinity : BLOCKADE.RETURN;
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
    /** The ships whose helm you can move between (Tab), sailing ship `id`: a brig and her craft out on the sea, the brig
        first; anyone else, herself alone (the user, 15 Nov: "Are they expected to go on autopilot and you control one of
        them? ... you can choose which one you're controlling, and the others go on autopilot"). */
    fleet(id) {
        const s = this.ship(id), brig = s.craft ? this.ship(s.craft.by) : s;
        if (brig.kind !== 'brig')
            return [id];
        return [brig.id, ...this.craftOf(brig).filter((x) => x.away <= 0).map((x) => x.id)];
    }
    /** A brig at anchor: her craft out, or her anchor still coming up. She can't move; her guns still bear as she lies. */
    anchored(s) { return s.kind === 'brig' && ((s.weigh ?? 0) > 0 || this.craftOf(s).some((x) => x.away <= 0)); }
    /** A brig weighs anchor: her craft called home at once (back aboard), and WEIGH seconds before she can move. */
    weighAnchor(id) {
        const s = this.ship(id);
        if (s.kind !== 'brig' || !this.anchored(s) || (s.weigh ?? 0) > 0)
            return false;
        for (const x of this.craftOf(s))
            if (x.away <= 0)
                this.aboard(x);
        s.weigh = BLOCKADE.LAUNCH.WEIGH;
        return true;
    }
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
        // (and she drops anchor: lying where she is till they're home)
        if (out.length) {
            s.launched = this.clock;
            s.helm.stop();
            while (s.helm.mine.length)
                s.helm.unput();
            this.launches.push({ by: id, ids: out });
            this.notice();
        }
        return out;
    }
    /** An enemy beside a turtle (on a square next to hers, diagonals too; any ship but another brig's craft), and the
        square of hers it's on. */
    besideFoe(s) {
        const { c, r } = s.helm.pose;
        for (let dc = -1; dc <= 1; dc++)
            for (let dr = -1; dr <= 1; dr++) {
                const o = this.under(c + dc, r + dr);
                // (a ram lands on a ship lying still a moment, a frigate trading broadsides, a ship at anchor on a buoy; a sloop under
                // way slips her)
                if (o && o !== s && o.team !== s.team && o.away <= 0 && !o.craft && (this.still.get(o.id) ?? 0) >= BLOCKADE.LAUNCH.RAM.STILL)
                    return { o, at: [c + dc, r + dr] };
            }
        return null;
    }
    /** Back in, refitted, by the next of her entries that nobody's lying on (a sloop or a brig the other side's edge from
        last time, then her own again: so she's in the fight at both ends of the board): whether she is. */
    comeBack(s) {
        const n = s.entries.length, free = (p) => s.sea.bare().fits(p) && !squares(s.h, p).some(([c, r]) => this.taken.has(key(c, r)));
        // (a frigate by whichever end she's quicker into the heart from, through a gate that's down if one is: where she's
        // needed; a sloop or a brig the other edge from last time)
        const order = Array.from({ length: n }, (_, i) => (s.entry + 1 + i) % n);
        if (s.kind === 'frigate') {
            const [pc, pr] = BLOCKADE.BUOYS[0].at;
            order.sort((x, z) => s.sea.eta(s.entries[x], pc, pr) - s.sea.eta(s.entries[z], pc, pr));
        }
        const k = order.find((i) => free(s.entries[i]));
        if (k === undefined)
            return false;
        s.entry = k;
        s.start = { ...s.entries[k] };
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
    drop(id, c, r) { return this.anchored(this.ship(id)) ? null : this.ship(id).helm.drop(c, r); }
    put(id, m) { return !this.anchored(this.ship(id)) && this.ship(id).helm.put(m); }
    /** The brawl (BLOCKADE.BRAWL): its two frigates put broadside to broadside; their ids. */
    brawl() {
        const ids = BLOCKADE.BRAWL.map(({ name, at }) => { const s = this.ships.find((x) => x.name === name); s.helm.moor(at); return s.id; });
        this.notice();
        return [ids[0], ids[1]];
    }
    /** In the heart of the board, inside the fort. */
    inHeart(s) { return inHeart(s.helm.pose.c, s.helm.pose.r); }
    /** Where a sloop of that side hides: each lagoon's far corner, and her side's corner of the sea, far from the
        fighting. */
    // (inside a lagoon's reef only: no corners of the sea any more, far from every buoy, where a sloop went to be patched
    // and a frigate after her, both out of the fight; the user, 15 Nov: "there should be no reason for them to really be
    // venturing over there. Why are they?")
    coves(_team) { return BLOCKADE.REEFS.map((x) => x.hide); }
    /** Whether a ship's sheltering where a frigate won't follow: in a lagoon, or the shoals round it. */
    sheltered(o) {
        const p = o.helm.pose;
        return this.shoals.has(`${p.c},${p.r}`) || BLOCKADE.REEFS.some((x) => Math.max(Math.abs(p.c - x.at[0]), Math.abs(p.r - x.at[1])) <= x.ring);
    }
}
