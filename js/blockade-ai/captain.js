import { squares, drawnAt, alongs } from '../ship-handling.js';
import { BLOCKADE, inHeart, phantom } from '../blockade.js';
import { FREE } from '../blockade-orders.js';
import { BOTS, same, sameAim } from './config.js';
import { worth, gunBerths, gatePlace, towersSig } from './places.js';
/** A ship's AI, as every kind's starts. */
export class Captain {
    id;
    random;
    goal = null;
    score = 0;
    t;
    /** When she last fired; when her hiding or her raid started; how long she'll lurk. */
    firedAt = -99;
    since = 0;
    lurk = 10;
    /** Places she found no way to as things are, and when (not tried again for a while: a ship's in the way). */
    noway = new Map();
    /** In a brawl (Blockade.brawl), the one ship she fights while that ship's afloat, and nothing else; the brawl's ships,
        which everyone else leaves to it (never raided, picked a fight with or fired on). */
    foe = null;
    spare = new Set();
    /** Her admiral's order (src/blockade-orders.ts), carried out before anything she'd pick herself. */
    order = FREE;
    /** A skirmish (src/blockade-skirmish.ts): no buoys, the nearest enemy hers to fight, as her kind best can. */
    skirmish = false;
    constructor(id, random = Math.random) {
        this.id = id;
        this.random = random;
        this.t = random() * BOTS.THINK;
    }
    tick(b, dt, mates = []) {
        const s = b.ship(this.id);
        if (s.dmg.out || s.away > 0) {
            this.goal = null;
            return;
        }
        if (b.over)
            return;
        // (her kind's own business first, this look: a sloop's dodge, a brig's launch and anchor, a turtle's whole life)
        if (this.act(b, s, dt))
            return;
        this.shoot(b, s);
        // (idle short of where she's going, she looks again sooner: but never more than twice a second)
        const idle = s.helm.slot < 0 && !s.helm.pin && (this.goal?.kind === 'buoy' ? !b.reaches(s, BLOCKADE.BUOYS[this.goal.i]) : this.goal?.kind === 'raid' || this.goal?.kind === 'fight');
        if ((this.t -= dt) > 0 && !(idle && this.t < BOTS.THINK - 0.5))
            return;
        this.t = BOTS.THINK * (0.8 + 0.4 * this.random());
        this.think(b, s, mates);
    }
    // ----- what each kind's AI fills in -----
    /** Her kind's own business this tick, before she shoots and looks round: whether that's all for this tick. */
    act(_b, _s, _dt) { return false; }
    /** An enemy she holds her fire on though her guns bear (a sloop on a frigate, unless she's sniping at her end). */
    holdFire(_b, _s, _o) { return false; }
    /** A frigate leaves a ship sheltering in a lagoon or its shoals be: she'd scrape her bottom going in after her. */
    shunsShelter = false;
    /** In a skirmish, her kind's own way with it before she simply fights the nearest enemy. */
    skirmishFirst(_b, _s, _t) { return null; }
    /** What her kind does before weighing the buoys (a brig to her launching spot, a raider's raid): none, she weighs them. */
    first(_b, _s) { return null; }
    /** A buoy's worth to her kind. */
    buoyWorth(b, s, buoy, i, mates) { return worth(b, s, buoy, i, mates); }
    /** What else her kind weighs beside the buoys (a frigate's gates, guns and fights; a brig's fights). */
    options(_b, _s, _mates, _best, _w) { }
    /** Fire a side that's loaded if it would hit an enemy and no friend, the tower she's come to shoot down, or a
        gate's gun firing on her. */
    shoot(b, s) {
        for (const side of ['L', 'R']) {
            if (!s.guns.ready(side))
                continue;
            const shots = b.aim(s.id, side), at = (id) => b.ship(id);
            // (an enemy, knocked out or not in a sinking blockade: finishing her sinks her)
            // (a sloop leaves a frigate be unless she's sniping at her end: a broadside duel with one is a sloop sunk, rock,
            // paper, scissors)
            const duel = (o) => this.holdFire(b, s, o);
            const foe = shots.some((x) => x.what?.what === 'ship' && at(x.what.id).team !== s.team && (BLOCKADE.SINKING || !at(x.what.id).dmg.out) && !duel(at(x.what.id)));
            // (a friend in the way, or one of a brawl's ships, left to it: holding fire)
            const friend = shots.some((x) => x.what?.what === 'ship' && (at(x.what.id).team === s.team || this.spare.has(x.what.id)));
            const gate = this.goal?.kind === 'gate' && s.h.guns === 'large' && shots.some((x) => x.what?.what === 'tower');
            // (a gun she's come to wreck, step by step)
            const goal = this.goal, wreck = goal?.kind === 'guns' && shots.some((x) => x.what?.what === 'gun' && x.what.i === goal.i);
            // (a gate's gun firing on anyone, or on her for camping under it)
            const gun = shots.some((x) => x.what?.what === 'gun' && (b.battery[x.what.i].roused || b.gunOn[x.what.i] === s.id) && b.battery[x.what.i].live());
            if ((foe || gate || gun || wreck) && !friend && b.fire(s.id, side))
                this.firedAt = b.clock;
        }
    }
    /** Look round, and steer for what's best. */
    think(b, s, mates) {
        const g = this.pick(b, s, mates);
        if (!g)
            return;
        if (g.goal.kind !== 'gate' && s.sea.exact)
            s.sea.exact = null;
        // (when her hiding or her raid started: not again just because the ship she's raiding has moved)
        if (!sameAim(this.goal, g.goal) && g.goal.kind === 'raid')
            this.since = b.clock;
        this.goal = g.goal;
        this.score = g.score;
        this.steer(b, s);
    }
    /** What's best for her just now. */
    pick(b, s, mates) {
        // A brawl: she fights her foe off her side, broadside to broadside, keeping her spot while she's getting there or
        // her guns bear, and finding another as the foe moves off.
        if (this.foe !== null && b.ship(this.foe).away <= 0 && (BLOCKADE.SINKING || !b.ship(this.foe).dmg.out)) {
            const fight = this.raid(b, s, Infinity, true, this.foe);
            if (fight) {
                const was = this.goal?.kind === 'fight' && this.goal.on === this.foe ? this.goal.at : null;
                const there = was && squares(s.h, s.helm.pose).some(([c, r]) => c === was[0] && r === was[1]);
                const bears = ['L', 'R'].some((side) => b.aim(s.id, side).some((x) => x.what?.what === 'ship' && x.what.id === this.foe));
                return { goal: { kind: 'fight', on: this.foe, at: was && (!there || bears) ? was : fight.at }, score: 99 };
            }
        }
        // A skirmish: the nearest enemy, as her kind best can fight her: a frigate or a brig broadside on; a sloop off a big
        // ship's end, where her broadsides can't bear, and broadside to another sloop.
        if (this.skirmish && !s.craft) {
            const far = (o) => Math.hypot(o.helm.pose.c - s.helm.pose.c, o.helm.pose.r - s.helm.pose.r);
            // (a frigate leaves be an enemy in a lagoon or its shoals: she'd scrape her bottom chasing her there)
            const sheltered = (o) => this.shunsShelter && b.sheltered(o);
            const t = b.ships.filter((o) => o.team !== s.team && o.away <= 0 && !o.craft && !sheltered(o)).sort((a, z) => far(a) - far(z))[0];
            // (her kind's own way with a skirmish first: a brig to a lagoon, a sloop hit and run)
            const own = this.skirmishFirst(b, s, t);
            if (own)
                return own;
            if (t) {
                const f = this.raid(b, s, Infinity, true, t.id);
                // (her spot off her side picked afresh each look, as she moves: kept while she's still near her, so she doesn't
                // change her mind every look)
                if (f) {
                    const was = this.goal?.kind === 'fight' && this.goal.on === t.id ? this.goal.at : null, near = was && Math.hypot(was[0] - f.at[0], was[1] - f.at[1]) <= 2;
                    return { goal: { kind: 'fight', on: t.id, at: near ? was : f.at }, score: 9 };
                }
            }
        }
        // Her admiral's order, if she has one (sniping's a raider's way, below; the middle and the outside bend her own
        // choice, below).
        if (!['free', 'snipe', 'middle', 'outside', 'rush'].includes(this.order.kind)) {
            const goal = this.ordered(b, s, this.order);
            if (goal)
                return { goal, score: 50 };
        }
        // Her kind's own first call (a brig to her launching spot, a phantom's dart, a raider's raid).
        const own = this.first(b, s);
        if (own)
            return own;
        const best = [], p = s.helm.pose, post = this.order.kind;
        // (a strategy's weights: the heart's buoys, the gates, the fights)
        const heartW = post === 'rush' ? 3 : post === 'siege' ? 2 : 1, gateW = post === 'rush' || post === 'siege' ? 1.5 : 1, fightW = post === 'rush' ? 0.4 : 1;
        BLOCKADE.BUOYS.forEach((buoy, i) => {
            const heart = inHeart(...buoy.at);
            if ((post === 'middle' && !heart) || (post === 'outside' && heart))
                return;
            const w = this.buoyWorth(b, s, buoy, i, mates) * (heart ? heartW : 1);
            if (b.reaches(s, buoy)) {
                best.push({ goal: { kind: 'buoy', i }, score: w / 10 });
                return;
            }
            // (how long it really is, off her chart: none, and there's no way (a frigate and the heart, its gates shut))
            const eta = s.sea.eta(p, ...buoy.at);
            if (eta < Infinity)
                best.push({ goal: { kind: 'buoy', i }, score: w / (4 + eta) });
        });
        this.options(b, s, mates, best, { gateW, fightW, post });
        // Best first.
        best.sort((a, z) => z.score - a.score);
        const top = best[0];
        if (!top)
            return null;
        // (sticking to what she's at unless the new is much better, and it's still there to do)
        const mineNow = this.goal && best.find((x) => same(x.goal, this.goal));
        const goal = this.goal, gone = goal?.kind === 'gate' && b.gates[goal.g].open();
        if (mineNow && !same(top.goal, goal) && top.score < mineNow.score * BOTS.STICK && !gone)
            return mineNow;
        return top;
    }
    /** A fight with an enemy close by (the nearest, `first` her kind first), lying off her side, weighed by how big she
        is to her (`big`), her nerve, and whether she's on the points (off them, `offPoints` of it). */
    fights(b, s, best, fightW, reach, first, big, offPoints) {
        const fight = this.raid(b, s, reach, true, undefined, first);
        if (!fight)
            return;
        const was = this.goal?.kind === 'fight' && this.goal.on === fight.on, eta = Math.hypot(fight.at[0] - s.helm.pose.c, fight.at[1] - s.helm.pose.r) / s.h.stride * s.h.move;
        const o = b.ship(fight.on), near = (x) => Math.hypot(x.helm.pose.c - o.helm.pose.c, x.helm.pose.r - o.helm.pose.r) <= BOTS.SAVE;
        // (to finish her off, or to drive her off a friend who's knocked out)
        const why = (o.dmg.out ? BOTS.FINISH : 1) * (b.ships.some((x) => x.team === s.team && x !== s && x.dmg.out && x.away <= 0 && near(x)) ? BOTS.RESCUE : 1);
        // (more for one more damaged than she is, less for one she'd lose to: her nerve; and a fight's for the points: one
        // on a buoy, or contesting one, is worth it, one off them far less: 15 Nov, "this is a game about the points")
        const onPoints = BLOCKADE.BUOYS.some((x) => b.reaches(o, x)) ? 1 : offPoints;
        if (onPoints > 0)
            best.push({ goal: { kind: 'fight', on: fight.on, at: was && this.goal?.kind === 'fight' ? this.goal.at : fight.at }, score: fightW * BOTS.FIGHT * big(o) * why * this.nerve(s, o) * onPoints / (4 + eta) });
    }
    /** What her order has her do just now (null: nothing, for now: she does as she'd choose). */
    ordered(b, s, o) {
        switch (o.kind) {
            case 'hold': return { kind: 'buoy', i: o.buoy };
            case 'camp': return { kind: 'camp', at: o.at };
            case 'gate': {
                // (down already: done, and she's her own again)
                if (s.kind !== 'frigate' || b.gates[o.g].open()) {
                    this.order = FREE;
                    return null;
                }
                const place = gatePlace(b, s, o.g), p = s.helm.pose;
                const here = place.berths.find((x) => x.pose.c === p.c && x.pose.r === p.r && x.pose.d === p.d);
                const mine = this.goal?.kind === 'gate' && this.goal.g === o.g ? place.berths.find((x) => same({ kind: 'gate', ...x }, this.goal)) : undefined;
                const way = here || mine ? null : s.sea.plotAny(p, place.key, place.poses);
                const berth = here ?? mine ?? (way ? place.berths.find((x) => x.pose.c === way.to.c && x.pose.r === way.to.r && x.pose.d === way.to.d) : undefined);
                return berth ? { kind: 'gate', ...berth } : null;
            }
            case 'frigates':
            case 'sinks': {
                // (their frigates: the nearest, wherever she is; sinks: whoever's most hurt in reach, knocked out first)
                const foes = b.ships.filter((x) => x.team !== s.team && x.away <= 0 && (o.kind === 'sinks' ? Math.hypot(x.helm.pose.c - s.helm.pose.c, x.helm.pose.r - s.helm.pose.r) <= BOTS.REACH : x.kind === 'frigate'));
                const far = (x) => Math.hypot(x.helm.pose.c - s.helm.pose.c, x.helm.pose.r - s.helm.pose.r);
                const t = o.kind === 'sinks' ? foes.filter((x) => x.dmg.share() > 0.2).sort((a, z) => (z.dmg.out ? 2 : z.dmg.share()) - (a.dmg.out ? 2 : a.dmg.share()))[0] : foes.sort((a, z) => far(a) - far(z))[0];
                if (!t)
                    return null;
                const at = this.raid(b, s, Infinity, true, t.id);
                return at ? { kind: 'fight', on: t.id, at: at.at } : null;
            }
            case 'siege': {
                // (the nearest gate still shut: its guns wrecked first, then its tower, by her own choice, then in)
                if (s.kind !== 'frigate')
                    return null;
                const p = s.helm.pose, shut = b.gates.map((x, g) => ({ g, x })).filter(({ x }) => !x.open());
                const g = shut.map(({ g }) => ({ g, eta: s.sea.etaAny(p, gatePlace(b, s, g).key, gatePlace(b, s, g).poses) })).sort((a, z) => a.eta - z.eta)[0]?.g;
                if (g === undefined)
                    return null;
                const berth = this.gunBerth(b, s, g);
                return berth ? { kind: 'guns', ...berth.berth } : null;
            }
            case 'hunt': {
                const t = b.ship(o.ship);
                if (t.away > 0)
                    return null;
                // (a sloop after a frigate snipes at her end; anyone else lies off her side)
                const at = this.raid(b, s, Infinity, !(s.kind === 'sloop' && t.kind === 'frigate'), o.ship);
                return at ? (at.pose ? at : { kind: 'fight', on: o.ship, at: at.at }) : null;
            }
            case 'escort': {
                const f = b.ship(o.ship);
                if (f.away > 0)
                    return null;
                // (an enemy coming at her: fight her off; else keep off her side)
                const fm = drawnAt(f.h, { c: f.helm.pose.c, r: f.helm.pose.r, a: f.helm.pose.d });
                const threat = b.ships.filter((x) => x.team !== s.team && x.away <= 0 && !x.dmg.out && Math.hypot(x.helm.pose.c - fm.c, x.helm.pose.r - fm.r) <= BOTS.ENGAGE)
                    .sort((a, z) => Math.hypot(a.helm.pose.c - fm.c, a.helm.pose.r - fm.r) - Math.hypot(z.helm.pose.c - fm.c, z.helm.pose.r - fm.r))[0];
                if (threat) {
                    const at = this.raid(b, s, Infinity, true, threat.id);
                    if (at)
                        return { kind: 'fight', on: threat.id, at: at.at };
                }
                // (off her side, the nearer side to her first; rocks there, a little nearer or further off, then astern of
                // her, then the nearest open water to her)
                const d = f.helm.pose.d, sd = (d + 1) % 4, DC = [0, 1, 0, -1], DR = [1, 0, -1, 0], k = BOTS.OFF + Math.max(f.h.wide, s.h.wide), sea = s.sea.bare();
                const near = (a, z) => Math.hypot(a[0] - s.helm.pose.c, a[1] - s.helm.pose.r) - Math.hypot(z[0] - s.helm.pose.c, z[1] - s.helm.pose.r);
                const at = (x, y) => [Math.round(fm.c + DC[sd] * x + DC[d] * y), Math.round(fm.r + DR[sd] * x + DR[d] * y)];
                for (const off of [k, k - 1, k + 1, k - 2, k + 2]) {
                    const spots = [at(off, 0), at(-off, 0)].filter(([c, r]) => sea.open(c, r)).sort(near);
                    if (spots.length)
                        return { kind: 'escort', on: o.ship, at: spots[0] };
                }
                const astern = at(0, -(Math.ceil(f.h.long / 2) + k));
                if (sea.open(...astern))
                    return { kind: 'escort', on: o.ship, at: astern };
                for (let ring = 1; ring < 8; ring++) {
                    const round = [];
                    for (let x = -ring; x <= ring; x++)
                        for (let y = -ring; y <= ring; y++)
                            if (Math.max(Math.abs(x), Math.abs(y)) === ring)
                                round.push([Math.round(fm.c) + x, Math.round(fm.r) + y]);
                    const open = round.filter(([c, r]) => sea.open(c, r) && !squares(f.h, f.helm.pose).some(([x, y]) => x === c && y === r)).sort(near);
                    if (open.length)
                        return { kind: 'escort', on: o.ship, at: open[0] };
                }
                return null;
            }
            default: return null;
        }
    }
    /** Where she'd lie to wreck one of a gate's guns still standing: her berth there if she's in one, the one she's making
        for, else the nearest (and how long it is to it); none, if no gun's left or there's no way. */
    gunBerth(b, s, g) {
        const p = s.helm.pose, all = gunBerths(b, s).filter((x) => x.g === g), rows = s.sea.rows;
        if (!all.length)
            return null;
        const here = all.find((x) => x.pose.c === p.c && x.pose.r === p.r && x.pose.d === p.d);
        if (here)
            return { berth: here, eta: 0 };
        const mine = this.goal?.kind === 'guns' ? all.find((x) => same({ kind: 'guns', ...x }, this.goal)) : undefined;
        if (mine)
            return { berth: mine, eta: s.sea.eta(p, mine.pose.c, mine.pose.r, mine.pose) };
        const key = `guns${g}|${b.battery.map((x) => x.wrecked ? 0 : 1).join('')}|${towersSig(b)}`, poses = () => all.map((x) => (x.pose.c * rows + x.pose.r) * 4 + x.pose.d);
        const way = s.sea.plotAny(p, key, poses), berth = way ? all.find((x) => x.pose.c === way.to.c && x.pose.r === way.to.r && x.pose.d === way.to.d) : undefined;
        return berth ? { berth, eta: s.sea.etaAny(p, key, poses) } : null;
    }
    /** Her nerve against an enemy: more than 1 if he's more damaged than she is (she presses in), less if she's the more
        damaged (she takes fewer risks); the user, 15 Nov: "being more or less aggressive depending on your damage level ...
        if you know the person next to you is more damaged than you are, you get more aggressive. If you're damaged, you
        might kind of take fewer risks". */
    nerve(s, o) {
        const d = (o.dmg.out ? 1 : o.dmg.share()) - s.dmg.share();
        return Math.max(BOTS.NERVE.MIN, Math.min(BOTS.NERVE.MAX, 1 + BOTS.NERVE.K * d));
    }
    /** Where she's waiting for the ships in her way to move, and since when. */
    waitFor = '';
    waitFrom = 0;
    /** A raid (or a frigate's fight): the nearest enemy frigate in reach (`any`: any enemy ship, frigates first), and
        where to fire from: a raider's, lying across her line off her bow or her stern, her broadside raking her end
        while none of the frigate's can bear on her; a frigate's fight, a square off her side, broadside to broadside. */
    raid(b, s, reach = BOTS.REACH, any = false, only, first = 'frigate') {
        const p = s.helm.pose;
        // (a frigate's fight can be with one knocked out, to sink her, in a sinking blockade; a raider's never)
        // (a raider's: a frigate or a brig, both too slow to answer a sloop off her end)
        const camped = (o) => phantom(s) && (b.still.get(o.id) ?? 0) >= BOTS.CAMPED && !o.craft;
        // (a big ship never goes after a brig's craft of her own choosing: too quick to catch and only a while, she shoots
        // them as they come in reach and keeps to what she's at)
        // (nor a ship sheltering in a lagoon or its shoals, for a frigate: she'd scrape her bottom going in after her, and
        // there are no points in chasing her there)
        // (and nobody goes after a ship in the safe zone round the edge: there's no shooting there)
        const chase = (o) => !b.safe(o) && !(any && only === undefined && ((o.craft && (s.kind === 'frigate' || s.kind === 'brig')) || (s.kind === 'frigate' && b.sheltered(o))));
        const foes = b.ships.filter((o) => o.team !== s.team && !phantom(o) && chase(o) && (any || o.kind === 'frigate' || o.kind === 'brig' || camped(o)) && o.away <= 0 && (any && BLOCKADE.SINKING ? true : !o.dmg.out) && (only === undefined ? !this.spare.has(o.id) : o.id === only))
            .map((o) => ({ o, m: drawnAt(o.h, { c: o.helm.pose.c, r: o.helm.pose.r, a: o.helm.pose.d }) }))
            .filter(({ m }) => Math.hypot(m.c - p.c, m.r - p.r) <= reach)
            .sort((a, z) => (a.o.kind === z.o.kind ? 0 : a.o.kind === first ? -1 : z.o.kind === first ? 1 : 0) || Math.hypot(a.m.c - p.c, a.m.r - p.r) - Math.hypot(z.m.c - p.c, z.m.r - p.r));
        const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
        for (const { o, m } of foes) {
            if (!any) {
                const op = o.helm.pose, d = op.d, al = alongs(o.h), ends = [[al[al.length - 1], 1], [al[0], -1]], snipes = [];
                for (const [end, dir] of ends)
                    for (const k of BOTS.END)
                        for (const q of [(d + 1) % 4, (d + 3) % 4]) {
                            const x = { c: op.c + DC[d] * (end + dir * k), r: op.r + DR[d] * (end + dir * k), d: q };
                            if (s.sea.fits(x))
                                snipes.push({ x, bow: dir > 0 });
                        }
                // (the quickest to lie in, off her chart; her stern sooner than her bow, which is in her way as she sails on at
                // you, and blocks her)
                const best = snipes.map(({ x, bow }) => ({ x, eta: s.sea.eta(p, x.c, x.r, x) + (bow ? BOTS.BOW : 0) })).filter((x) => x.eta < Infinity).sort((a, z) => a.eta - z.eta)[0];
                if (best)
                    return { kind: 'raid', on: o.id, at: [best.x.c, best.x.r], pose: best.x };
                continue;
            }
            const sd = (o.helm.pose.d + 1) % 4;
            const spots = [1, -1].map((k) => [Math.round(m.c + DC[sd] * k * BOTS.OFF), Math.round(m.r + DR[sd] * k * BOTS.OFF)])
                // (never in the shoals, for a frigate: she'd scrape her bottom lying there)
                .filter(([c, r]) => s.sea.open(c, r) && !squares(o.h, o.helm.pose).some(([x, y]) => x === c && y === r) && !(s.kind === 'frigate' && b.shoals.has(`${c},${r}`)))
                .sort((a, z) => Math.hypot(a[0] - p.c, a[1] - p.r) - Math.hypot(z[0] - p.c, z[1] - p.r));
            if (spots.length)
                return { kind: 'raid', on: o.id, at: spots[0] };
        }
        return null;
    }
    /** Swing her broadside round onto an enemy in gun range that neither side of hers bears on just now (lying ahead of or
        astern of her): a turn, if she's free to make one. Whether she did. */
    swing(b, s, o) {
        if (o.away > 0 || s.helm.slot >= 0 || s.helm.mine.length)
            return false;
        const p = s.helm.pose, m = drawnAt(o.h, { c: o.helm.pose.c, r: o.helm.pose.r, a: o.helm.pose.d }), me = drawnAt(s.h, { c: p.c, r: p.r, a: p.d });
        const dc = m.c - me.c, dr = m.r - me.r;
        if (Math.hypot(dc, dr) > BOTS.SWING)
            return false;
        if (['L', 'R'].some((side) => b.aim(s.id, side).some((x) => x.what?.what === 'ship' && x.what.id === o.id)))
            return false;
        const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0], ahead = dc * DC[p.d] + dr * DR[p.d], across = dc * DC[(p.d + 1) % 4] + dr * DR[(p.d + 1) % 4];
        if (Math.abs(ahead) < Math.abs(across))
            return false; // (abeam already: her guns will bear as she lies)
        const turn = ['L', 'R'].find((m2) => s.sea.clear(p, m2));
        if (!turn)
            return false;
        if (s.helm.pin)
            s.helm.stop();
        s.helm.put(turn);
        return true;
    }
    /** She found no way there as things are a little while ago (another ship in the way): left alone a while. */
    blocked(b, at) {
        const when = this.noway.get(`${at[0]},${at[1]}`);
        return when !== undefined && b.clock - when < BOTS.NOWAY;
    }
    /** Her way to a square as things are (round the ships near her), or null: none, and it's left alone a while. */
    way(b, s, at) {
        if (this.blocked(b, at))
            return null;
        const k = `${at[0]},${at[1]}`, got = s.sea.plot(s.helm.after(), ...at);
        // (a big ship's way round the ships in hers far longer than the way itself (a gateway full, say): they'll have moved
        // long before she's got round, so she waits for them rather than setting off right round the fort, 15 Nov: "one's
        // really out there, near the edge of the map. Like, what is going on again?")
        // (but not for ever: after PATIENCE seconds she takes the long way, or her next look finds her somewhere else to go)
        if (got && s.kind !== 'sloop' && got.length * s.h.move > s.sea.eta(s.helm.after(), ...at) * BOTS.DETOUR + 6) {
            if (this.waitFor !== k) {
                this.waitFor = k;
                this.waitFrom = b.clock;
            }
            if (b.clock - this.waitFrom < BOTS.PATIENCE)
                return null;
        }
        else if (this.waitFor === k)
            this.waitFor = '';
        if (got)
            this.noway.delete(k);
        else
            this.noway.set(k, b.clock);
        return got;
    }
    /** Set her pin for her goal. */
    steer(b, s) {
        const g = this.goal;
        // (in a fight and in gun range of her, no broadside bearing: she swings her side round to her, rather than sailing on
        // for a spot off her side that moves as she does, the two of them circling and never firing)
        if (g.kind === 'fight' && this.swing(b, s, b.ship(g.on)))
            return;
        if (g.kind === 'gate' || g.kind === 'guns') {
            const p = s.helm.pose;
            if (!(p.c === g.pose.c && p.r === g.pose.r && p.d === g.pose.d))
                s.helm.sailTo(g.pose);
            return;
        }
        if (g.kind === 'raid' && g.pose) {
            // (lying across her line off her end, broadside on: firing as she bears)
            const p = s.helm.pose;
            if (p.c === g.pose.c && p.r === g.pose.r && p.d === g.pose.d)
                return;
            if (s.helm.sailTo(g.pose))
                return;
        }
        if (g.kind === 'buoy' && b.reaches(s, BLOCKADE.BUOYS[g.i])) {
            if (s.helm.pin)
                s.helm.stop();
            return;
        }
        const at = g.kind === 'buoy' ? BLOCKADE.BUOYS[g.i].at : g.at;
        // (lying off her, or where she's camped, or by the friend she's escorting: firing as they bear)
        if ((g.kind === 'fight' || g.kind === 'camp' || g.kind === 'escort') && squares(s.h, s.helm.pose).some(([c, r]) => c === at[0] && r === at[1])) {
            if (s.helm.pin && g.kind !== 'fight')
                s.helm.stop();
            return;
        }
        if (s.helm.pose.c === at[0] && s.helm.pose.r === at[1])
            return;
        // (only if she can get there as things are: another ship in her way, she waits for her next look)
        if (this.way(b, s, at)) {
            s.helm.drop(...at);
            return;
        }
        // (another ship's in her way: rather than wait on each other for ever, she makes a move of her own, forward if
        // she can, to try another way)
        // (a big ship waits instead: a move off at random is a big ship's long way off her course)
        if (s.kind !== 'sloop') {
            if (s.helm.pin)
                s.helm.stop();
            return;
        }
        if (s.helm.slot < 0 && !s.helm.mine.length) {
            const free = ['F', 'L', 'R'].filter((m) => s.sea.clear(s.helm.pose, m));
            if (free.length)
                s.helm.put(free.includes('F') && this.random() < 0.6 ? 'F' : free[Math.floor(this.random() * free.length)]);
        }
    }
}
