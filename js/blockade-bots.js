import { squares, drawnAt, alongs, shipPath } from './ship-handling.js';
import { BLOCKADE, inHeart } from './blockade.js';
import { FREE } from './blockade-orders.js';
export const BOTS = {
    /** Seconds between a bot's looks round for something better to do. */
    THINK: 3.5,
    /** Seconds she leaves a place she found no way to before trying it again. */
    NOWAY: 8,
    /** How much better something has to look before she changes her mind. */
    STICK: 1.3,
    /** How much more the heart's buoys are worth to a frigate; and to a sloop, once the enemy's frigates are in it. */
    HEART: 1.6, FLEE: 0.3,
    /** A sloop hurt this badly runs to hide and be patched; and comes out again patched to this. */
    HIDE: 0.5, HEALED: 0.1,
    /** Seconds a raider lies hidden before she darts out again, and the longest a raid lasts. */
    LURK: [8, 14], RAID: 25,
    /** How near an enemy frigate has to be (squares) for a raider to dart out at her, and how far off her side she lies. */
    REACH: 16, OFF: 3,
    /** How far off a frigate's bow or stern a raider lies to snipe at her (squares past her end: in her own guns' reach). */
    END: [3, 2],
    /** Seconds further her bow looks than it is to a raider, against her stern. */
    BOW: 8,
    /** How near an enemy has to be (squares) for a frigate to fight her, and how much she's worth fighting. */
    ENGAGE: 9, FIGHT: 3,
    /** How much more a fight's worth to finish an enemy who's knocked out, or to save a friend who is (an enemy within
        SAVE squares of her). */
    FINISH: 2, RESCUE: 1.6, SAVE: 7,
    /** A brig's: how much more the open sea's buoys are worth to her, and the heart's (less: the frigates' to take); how
        near an enemy has to be for her to launch her craft. */
    BRIG: { OUT: 1.5, HEART: 0.35, LAUNCH: 14 },
    /** Seconds between a turtle's looks for whom to ram (quick: her prey moves), and how far she looks. */
    RAM: { THINK: 0.8, REACH: 24, STUCK: 1.6 },
};
const same = (a, z) => !!a && !!z && JSON.stringify(a) === JSON.stringify(z);
/** The same thing to do, if not exactly (a raid on the same ship, wherever she's got to; hiding in the same cove). */
const sameAim = (a, z) => !!a && a.kind === z.kind && (z.kind === 'raid' || z.kind === 'fight' || z.kind === 'ram' ? a.on === z.on : same(a, z));
/** A buoy's worth to one side: whose it is just now, and whether a friend's already on it. */
function worth(b, s, buoy, i, mates) {
    const hold = b.hold(buoy), friend = b.ships.some((o) => o !== s && o.team === s.team && b.reaches(o, buoy));
    let w = buoy.pennants * (hold === s.team ? (friend ? 0.15 : 1) : hold === 'contested' ? 1.4 : hold ? 1.5 : 1.2);
    if (mates.some((g) => g.kind === 'buoy' && g.i === i))
        w *= 0.35;
    if (s.kind === 'frigate' && inHeart(...buoy.at))
        w *= BOTS.HEART;
    // (a sloop in the heart once the enemy's frigates are in it: out by the winds to the lagoons, before they're caught)
    if (s.kind === 'sloop' && inHeart(...buoy.at) && b.ships.some((o) => o.team !== s.team && o.kind === 'frigate' && o.away <= 0 && !o.dmg.out && b.inHeart(o)))
        w *= BOTS.FLEE;
    // (a brig, and her ghost sloops with her: the islands' buoys before the heart's)
    if (s.kind === 'brig' || s.craft?.kind === 'ghost')
        w *= inHeart(...buoy.at) ? BOTS.BRIG.HEART : BOTS.BRIG.OUT;
    return w;
}
/** The towers standing, gate by gate: what the berths by them hang on. */
const towersSig = (b) => b.gates.map((x) => x.towers.map((t) => t.hp > 0 ? 1 : 0).join('')).join('/');
const berthsKept = new WeakMap();
/** Every berth a ship of her kind can lie in with one side's broadside landing on a standing tower of a gate, from
    either side of its wall (the rocks only: worked out once for her kind while the same towers stand), her nearest
    first. */
export function bombardBerths(b, s) {
    let kept = berthsKept.get(b);
    if (!kept)
        berthsKept.set(b, kept = new Map());
    const k = `${s.kind}|${towersSig(b)}`;
    let all = kept.get(k);
    if (!all) {
        all = [];
        const sea = s.sea.bare();
        for (const [g, gate] of b.gates.entries()) {
            if (gate.open())
                continue;
            const rows = [...Array.from({ length: 5 }, (_, n) => gate.r0 - 1 - n), ...Array.from({ length: 5 }, (_, n) => gate.r1 + 1 + n)];
            for (let c = gate.way - 6; c <= gate.way + 6; c++)
                for (const r of rows)
                    for (const d of [1, 3]) {
                        const pose = { c, r, d };
                        if (!sea.fits(pose))
                            continue;
                        for (const side of ['L', 'R']) {
                            const t = b.aim(s.id, side, pose, false).find((x) => x.what?.what === 'tower');
                            if (t && t.what?.what === 'tower' && t.what.g === g)
                                all.push({ g, tower: t.what.i, pose, side });
                        }
                    }
        }
        kept.set(k, all);
    }
    const p = s.helm.pose, far = (x) => Math.hypot(x.pose.c - p.c, x.pose.r - p.r);
    return [...all].sort((a, z) => far(a) - far(z));
}
const gunsKept = new WeakMap();
/** Every berth a ship of her kind can lie in with one side's broadside landing on one of a gate's bastion guns still
    standing (rocks only, worked out once while the same guns stand). */
export function gunBerths(b, s) {
    let kept = gunsKept.get(b);
    if (!kept)
        gunsKept.set(b, kept = new Map());
    const k = `${s.kind}|${towersSig(b)}|${b.battery.map((x) => x.wrecked ? 0 : 1).join('')}`;
    let all = kept.get(k);
    if (!all) {
        all = [];
        const sea = s.sea.bare();
        for (const [g, gate] of b.gates.entries()) {
            const rows = [...Array.from({ length: 5 }, (_, n) => gate.r0 - 1 - n), ...Array.from({ length: 5 }, (_, n) => gate.r1 + 1 + n)];
            for (let c = gate.way - 9; c <= gate.way + 9; c++)
                for (const r of rows)
                    for (const d of [1, 3]) {
                        const pose = { c, r, d };
                        if (!sea.fits(pose))
                            continue;
                        for (const side of ['L', 'R']) {
                            const t = b.aim(s.id, side, pose, false).find((x) => x.what?.what === 'gun');
                            if (t && t.what?.what === 'gun' && b.gunGate[t.what.i] === g && !b.battery[t.what.i].wrecked)
                                all.push({ g, i: t.what.i, pose, side });
                        }
                    }
        }
        kept.set(k, all);
    }
    return all;
}
/** A gate's berths for her kind, as a place on her chart: its name and its poses. */
function gatePlace(b, s, g) {
    const berths = bombardBerths(b, s).filter((x) => x.g === g), rows = s.sea.rows;
    return { key: `gate${g}|${towersSig(b)}`, poses: () => berths.map((x) => (x.pose.c * rows + x.pose.r) * 4 + x.pose.d), berths };
}
/** One ship's bot. */
export class Bot {
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
        // (a turtle: no guns, only her prey, looked for often)
        if (s.craft?.kind === 'ram') {
            if ((this.t -= dt) > 0)
                return;
            this.t = BOTS.RAM.THINK;
            const goal = this.prey(b, s);
            if (goal) {
                this.goal = goal;
                this.charge(b, s, goal.at);
            }
            return;
        }
        // (a brig: her craft launched whenever an enemy's near)
        if (s.kind === 'brig' && b.canLaunch(s) && b.ships.some((o) => o.team !== s.team && o.away <= 0 && !o.dmg.out && Math.hypot(o.helm.pose.c - s.helm.pose.c, o.helm.pose.r - s.helm.pose.r) <= BOTS.BRIG.LAUNCH))
            b.launch(s.id);
        this.shoot(b, s);
        // (idle short of where she's going, she looks again sooner: but never more than twice a second)
        const idle = s.helm.slot < 0 && !s.helm.pin && (this.goal?.kind === 'buoy' ? !b.reaches(s, BLOCKADE.BUOYS[this.goal.i]) : this.goal?.kind === 'raid' || this.goal?.kind === 'fight');
        if ((this.t -= dt) > 0 && !(idle && this.t < BOTS.THINK - 0.5))
            return;
        this.t = BOTS.THINK * (0.8 + 0.4 * this.random());
        this.think(b, s, mates);
    }
    /** Fire a side that's loaded if it would hit an enemy and no friend, the tower she's come to shoot down, or a
        gate's gun firing on her. */
    shoot(b, s) {
        for (const side of ['L', 'R']) {
            if (!s.guns.ready(side))
                continue;
            const shots = b.aim(s.id, side), at = (id) => b.ship(id);
            // (an enemy, knocked out or not in a sinking blockade: finishing her sinks her)
            const foe = shots.some((x) => x.what?.what === 'ship' && at(x.what.id).team !== s.team && (BLOCKADE.SINKING || !at(x.what.id).dmg.out));
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
        if (!sameAim(this.goal, g.goal) && (g.goal.kind === 'hide' || g.goal.kind === 'raid'))
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
        // Her admiral's order, if she has one (sniping's a raider's way, below; the middle and the outside bend her own
        // choice, below).
        if (!['free', 'snipe', 'middle', 'outside', 'rush'].includes(this.order.kind)) {
            const goal = this.ordered(b, s, this.order);
            if (goal)
                return { goal, score: 50 };
        }
        // A sloop badly hurt hides till she's patched; a raider lurks a while, then darts out at a frigate, and back.
        const raider = this.order.kind === 'snipe' || (this.order.kind === 'free' && s.raider);
        if (s.kind === 'sloop' && !s.craft) {
            const share = s.dmg.share(), hiding = this.goal?.kind === 'hide';
            if (share >= BOTS.HIDE || (hiding && share > BOTS.HEALED) || (hiding && raider && b.clock - this.since < this.lurk)) {
                const cove = this.cove(b, s, mates);
                if (cove)
                    return { goal: { kind: 'hide', cove }, score: 9 };
            }
            if (raider) {
                const raiding = this.goal?.kind === 'raid', done = raiding && (this.firedAt > this.since || b.clock - this.since > BOTS.RAID);
                if (done) {
                    this.lurk = BOTS.LURK[0] + this.random() * (BOTS.LURK[1] - BOTS.LURK[0]);
                    const cove = this.cove(b, s, mates);
                    if (cove)
                        return { goal: { kind: 'hide', cove }, score: 9 };
                }
                const raid = this.raid(b, s);
                if (raid)
                    return { goal: raid, score: 8 };
            }
        }
        const best = [], p = s.helm.pose, post = this.order.kind;
        // (a strategy's weights: the heart's buoys, the gates, the fights)
        const heartW = post === 'rush' ? 3 : post === 'siege' ? 2 : 1, gateW = post === 'rush' || post === 'siege' ? 1.5 : 1, fightW = post === 'rush' ? 0.4 : 1;
        BLOCKADE.BUOYS.forEach((buoy, i) => {
            const heart = inHeart(...buoy.at);
            if ((post === 'middle' && !heart) || (post === 'outside' && heart))
                return;
            const w = worth(b, s, buoy, i, mates) * (heart ? heartW : 1);
            if (b.reaches(s, buoy)) {
                best.push({ goal: { kind: 'buoy', i }, score: w / 10 });
                return;
            }
            // (how long it really is, off her chart: none, and there's no way (a frigate and the heart, its gates shut))
            const eta = s.sea.eta(p, ...buoy.at);
            if (eta < Infinity)
                best.push({ goal: { kind: 'buoy', i }, score: w / (4 + eta) });
        });
        // (any gate still shut: the one nearest her may be quicker shot down than sailing round to one that's open; a
        // gate a friend's already shooting at is left to her)
        if (s.kind === 'frigate' && post !== 'outside')
            for (const [g, gate] of b.gates.entries()) {
                if (gate.open() || mates.some((m) => m.kind === 'gate' && m.g === g))
                    continue;
                const place = gatePlace(b, s, g);
                if (!place.berths.length)
                    continue;
                const here = place.berths.find((x) => x.pose.c === p.c && x.pose.r === p.r && x.pose.d === p.d);
                // (her own berth while it's still a berth, so she doesn't change her mind for another each look; else the
                // nearest, where her quickest way to any of them ends)
                const mine = this.goal?.kind === 'gate' && this.goal.g === g ? place.berths.find((x) => same({ kind: 'gate', ...x }, this.goal)) : undefined;
                const nearest = () => { const way = s.sea.plotAny(p, place.key, place.poses); return way ? place.berths.find((x) => x.pose.c === way.to.c && x.pose.r === way.to.r && x.pose.d === way.to.d) : undefined; };
                const berth = here ?? mine ?? nearest();
                if (!berth)
                    continue;
                // (the gate's own field, its nearest berth's, unless she's set on another of its berths already)
                const eta = here ? 0 : mine ? s.sea.eta(p, berth.pose.c, berth.pose.r, berth.pose) : s.sea.etaAny(p, place.key, place.poses);
                if (!(eta < Infinity))
                    continue;
                const prize = BLOCKADE.BUOYS.filter((x) => inHeart(...x.at)).reduce((t, x) => t + x.pennants, 0) * 1.3;
                const left = gate.towers[berth.tower].hp;
                best.push({ goal: { kind: 'gate', ...berth }, score: gateW * prize / (4 + eta + left * s.h.reload * 0.5) });
            }
        // A frigate fights an enemy close by (the nearest; a frigate before a sloop), lying off her side; a brig too, a
        // sloop before a frigate.
        if (s.kind === 'frigate' || s.kind === 'brig') {
            const fight = this.raid(b, s, BOTS.ENGAGE, true, undefined, s.kind === 'brig' ? 'sloop' : 'frigate');
            if (fight) {
                const was = this.goal?.kind === 'fight' && this.goal.on === fight.on, eta = Math.hypot(fight.at[0] - s.helm.pose.c, fight.at[1] - s.helm.pose.r) / s.h.stride * s.h.move;
                const o = b.ship(fight.on), near = (x) => Math.hypot(x.helm.pose.c - o.helm.pose.c, x.helm.pose.r - o.helm.pose.r) <= BOTS.SAVE;
                // (to finish her off, or to drive her off a friend who's knocked out)
                const why = (o.dmg.out ? BOTS.FINISH : 1) * (b.ships.some((x) => x.team === s.team && x !== s && x.dmg.out && x.away <= 0 && near(x)) ? BOTS.RESCUE : 1);
                const big = s.kind === 'brig' ? (o.kind === 'frigate' ? 0.6 : 1.5) : o.kind === 'frigate' ? 1.5 : 1;
                best.push({ goal: { kind: 'fight', on: fight.on, at: was && this.goal?.kind === 'fight' ? this.goal.at : fight.at }, score: fightW * BOTS.FIGHT * big * why / (4 + eta) });
            }
        }
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
                const all = gunBerths(b, s).filter((x) => x.g === g), rows = s.sea.rows;
                if (!all.length)
                    return null;
                const here = all.find((x) => x.pose.c === p.c && x.pose.r === p.r && x.pose.d === p.d);
                const mine = this.goal?.kind === 'guns' ? all.find((x) => same({ kind: 'guns', ...x }, this.goal)) : undefined;
                const key = `guns${g}|${b.battery.map((x) => x.wrecked ? 0 : 1).join('')}|${towersSig(b)}`;
                const way = here || mine ? null : s.sea.plotAny(p, key, () => all.map((x) => (x.pose.c * rows + x.pose.r) * 4 + x.pose.d));
                const berth = here ?? mine ?? (way ? all.find((x) => x.pose.c === way.to.c && x.pose.r === way.to.r && x.pose.d === way.to.d) : undefined);
                return berth ? { kind: 'guns', ...berth } : null;
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
    /** The nearest cove nobody else is in or making for. */
    cove(b, s, mates) {
        const mine = this.goal?.kind === 'hide' ? this.goal.cove : null;
        if (mine)
            return mine;
        // (the quickest to get to, off her chart)
        const free = b.coves(s.team).filter(([c, r]) => !mates.some((m) => m.kind === 'hide' && m.cove[0] === c && m.cove[1] === r) && !(b.under(c, r) && b.under(c, r) !== s))
            .map((at) => ({ at, eta: s.sea.eta(s.helm.pose, ...at) })).filter((x) => x.eta < Infinity && !this.blocked(b, x.at));
        free.sort((a, z) => a.eta - z.eta);
        return free[0]?.at ?? null;
    }
    /** A raid (or a frigate's fight): the nearest enemy frigate in reach (`any`: any enemy ship, frigates first), and
        where to fire from: a raider's, lying across her line off her bow or her stern, her broadside raking her end
        while none of the frigate's can bear on her; a frigate's fight, a square off her side, broadside to broadside. */
    raid(b, s, reach = BOTS.REACH, any = false, only, first = 'frigate') {
        const p = s.helm.pose;
        // (a frigate's fight can be with one knocked out, to sink her, in a sinking blockade; a raider's never)
        const foes = b.ships.filter((o) => o.team !== s.team && (any || o.kind === 'frigate') && o.away <= 0 && (any && BLOCKADE.SINKING ? true : !o.dmg.out) && (only === undefined ? !this.spare.has(o.id) : o.id === only))
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
                .filter(([c, r]) => s.sea.open(c, r) && !squares(o.h, o.helm.pose).some(([x, y]) => x === c && y === r))
                .sort((a, z) => Math.hypot(a[0] - p.c, a[1] - p.r) - Math.hypot(z[0] - p.c, z[1] - p.r));
            if (spots.length)
                return { kind: 'raid', on: o.id, at: spots[0] };
        }
        return null;
    }
    /** A turtle's prey: the nearest enemy she can get beside (a ship before another's craft), and the open square beside
        her nearest the turtle. */
    prey(b, s) {
        const p = s.helm.pose, sea = s.sea.bare(), far = (c, r) => Math.hypot(c - p.c, r - p.r);
        const foes = b.ships.filter((o) => o.team !== s.team && o.away <= 0 && far(o.helm.pose.c, o.helm.pose.r) <= BOTS.RAM.REACH)
            .sort((a, z) => (a.craft ? 1 : 0) - (z.craft ? 1 : 0) || far(a.helm.pose.c, a.helm.pose.r) - far(z.helm.pose.c, z.helm.pose.r));
        for (const o of foes) {
            const hers = squares(o.h, o.helm.pose), on = new Set(hers.map(([c, r]) => `${c},${r}`)), spots = [];
            for (const [c, r] of hers)
                for (let dc = -1; dc <= 1; dc++)
                    for (let dr = -1; dr <= 1; dr++) {
                        const x = c + dc, y = r + dr;
                        if (!on.has(`${x},${y}`) && sea.open(x, y) && !spots.some(([u, v]) => u === x && v === y))
                            spots.push([x, y]);
                    }
            spots.sort((a, z) => far(...a) - far(...z));
            const at = spots.find((x) => !this.blocked(b, x));
            if (at)
                return { kind: 'ram', on: o.id, at };
        }
        return null;
    }
    /** A turtle's way to her prey: straight at her, a move at a time, whichever of her moves ends nearest her (no
        pilot's way worked out: her prey's moved by the next look anyway); stuck a while getting no nearer (rocks in
        her way), her pilot's way round them. */
    charge(b, s, at) {
        const p = s.helm.pose, far = (q) => Math.hypot(q.c - at[0], q.r - at[1]), now = far(p);
        if (now < this.near - 0.5) {
            this.near = now;
            this.since = b.clock;
        }
        if (b.clock - this.since > BOTS.RAM.STUCK) {
            this.near = now;
            this.since = b.clock;
            this.steer(b, s);
            return;
        }
        if (s.helm.pin || s.helm.slot >= 0 || s.helm.mine.length)
            return;
        const moves = ['F', 'L', 'R'].filter((m) => s.sea.clear(p, m)).map((m) => ({ m, d: far(shipPath(s.h, p, m).to) - (m === 'F' ? 0.01 : 0) }));
        moves.sort((a, z) => a.d - z.d);
        if (moves.length)
            s.helm.put(moves[0].m);
    }
    /** A turtle's nearest yet to her prey (charge). */
    near = Infinity;
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
        if (got)
            this.noway.delete(k);
        else
            this.noway.set(k, b.clock);
        return got;
    }
    /** Set her pin for her goal. */
    steer(b, s) {
        const g = this.goal;
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
        const at = g.kind === 'buoy' ? BLOCKADE.BUOYS[g.i].at : g.kind === 'hide' ? g.cove : g.at;
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
        if (s.helm.slot < 0 && !s.helm.mine.length) {
            const free = ['F', 'L', 'R'].filter((m) => s.sea.clear(s.helm.pose, m));
            if (free.length)
                s.helm.put(free.includes('F') && this.random() < 0.6 ? 'F' : free[Math.floor(this.random() * free.length)]);
        }
    }
}
/** Every ship's bot. */
export class Bots {
    bots;
    /** `brawl`: two ships' ids (Blockade.brawl) that fight each other and nothing else. */
    constructor(b, people = [], random = Math.random, brawl = null) {
        this.bots = b.ships.filter((s) => !people.includes(s.id)).map((s) => new Bot(s.id, random));
        if (brawl)
            for (const bot of this.bots) {
                if (brawl.includes(bot.id))
                    bot.foe = brawl[0] === bot.id ? brawl[1] : brawl[0];
                else
                    bot.spare = new Set(brawl);
            }
    }
    /** Give a ship her admiral's order (FREE: her own choice again): she looks round at once. */
    order(id, o) {
        const bot = this.bots.find((x) => x.id === id);
        if (!bot)
            return;
        bot.order = o;
        bot.t = 0;
    }
    /** A ship's order just now. */
    orderOf(id) { return this.bots.find((x) => x.id === id)?.order ?? FREE; }
    /** Each bot a tick on but those sailing a ship someone's sailing just now (`people`: their ids). */
    tick(b, dt, people = []) {
        for (const bot of this.bots) {
            if (people.includes(bot.id))
                continue;
            const team = b.ship(bot.id).team, mates = this.bots.filter((o) => o !== bot && b.ship(o.id).team === team && o.goal).map((o) => o.goal);
            bot.tick(b, dt, mates);
        }
    }
    /** What a ship's bot is up to, in plain words. */
    doing(b, id) {
        const bot = this.bots.find((x) => x.id === id), s = b.ship(id);
        if (s.craft && s.away > 0)
            return `aboard ${b.ship(s.craft.by).name}, to be launched`;
        if (s.away > 0)
            return `sunk: back in ${Math.ceil(s.away)}s from her side's edge`;
        if (s.dmg.out)
            return 'knocked out: her crew rebuilding her';
        const g = bot?.goal;
        if (!g)
            return 'looking round';
        if (g.kind === 'gate')
            return `shooting down the ${BLOCKADE.GATES[g.g].r0 < BLOCKADE.HEART.r0 ? 'south' : 'north'} gate's tower`;
        if (g.kind === 'guns')
            return `wrecking the ${BLOCKADE.GATES[g.g].r0 < BLOCKADE.HEART.r0 ? 'south' : 'north'} gate's guns`;
        if (g.kind === 'hide')
            return s.helm.pose.c === g.cove[0] && s.helm.pose.r === g.cove[1] ? 'hiding in a lagoon' + (s.dmg.share() > 0.05 ? ', being patched' : '') : 'running for a lagoon to hide';
        if (g.kind === 'raid')
            return `darting out at ${b.ship(g.on).name}`;
        if (g.kind === 'camp')
            return squares(s.h, s.helm.pose).some(([c, r]) => c === g.at[0] && r === g.at[1]) ? 'camped, firing on what comes by' : 'making for her camp';
        if (g.kind === 'escort')
            return `escorting ${b.ship(g.on).name}`;
        if (g.kind === 'fight')
            return `fighting ${b.ship(g.on).name}`;
        if (g.kind === 'ram')
            return `making for ${b.ship(g.on).name}, to ram her`;
        const buoy = BLOCKADE.BUOYS[g.i];
        return `${b.reaches(s, buoy) ? 'holding' : 'making for'} the ${['', 'one', 'two', 'three'][buoy.pennants]}-pennant buoy${inHeart(...buoy.at) ? ' in the heart' : ''}`;
    }
}
