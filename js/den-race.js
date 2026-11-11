/* Pirate Den: the sloop race. TypeScript, compiled to js/den-race.js; tested in tests/den-race.test.ts.
   js/den/race.js draws it (the course's land, its buoy and gate, the guns, the whirlpools, the crane, the
   rival) and plays it at sea; its squares are LAY.RACE in src/den-sail.ts (with every other place's, as
   the sea lays them), what's said src/lines/race.ts.

   The user (11 Nov): "maybe we've got enough to start some sloop races ... a winding, snakes and ladders,
   zigzagging kind of course, just with a lot of shortcuts, and each shortcut is a different puzzle, and
   you have to choose either the long way round, just ... without doing anything, and the long way it
   potentially involves running past some cannons", "it should be significant", and of the first draft:
   "this will be out near where Primates Rule is ... We're going to have to go through several
   iterations of this course." And it's a minigame, not a sea battle: the den is "about creative new
   mechanics, and tutorials".

   The second pass (11 Nov), re-laid to the simulation (src/race-sim.ts, RACE.md §8) and to what the user
   asked for after more goes: snakes ("I want the snakes and [ladders]"), shortcuts of every size ("Are
   you a person that can break quick double triples? ... Or do you want to go for those giant" ones), a
   start "with just like regular whirlpools ... pick your starting spot along the starting edge", the
   long way plain to follow ("clearer [buoys] for the main route"), the race explained at the start, and
   "a more ceremonious finish goal line".

   So: a buoy on the open sea out past Primates Rule; Space by it takes you in to the starting line,
   where you pick your spot along it (A D, or a click on the line), and Space again and the starter
   counts you down, the clock running from the gun. Through the start's field of whirlpools and winds,
   then five legs back and forth and the run home (LAY.RACE in src/den-sail.ts has the lay), the long
   way round each spit's end by its numbered buoy (no puzzle, a reach every leg), or through it by a
   shortcut, each a puzzle the den already has, played by its one module:
   - [A] the gun gap: two guns trained on it, as the imperial checkpoint's are (its numbers, CHECK; each
     a destructible turret, src/den-turret.ts). It's the combo that gets you through: a heavy one (a big
     Sailing chain's boost, or a Vegas rowed each side) rushes her past their marks; a square at a time
     she's a sitting duck, holed (patched by Carpentry: src/den-patch.ts). Or knock them out with her
     own guns, loaded by Gunnery. Just past it, one move too many and the tight water's wind sweeps her
     back along leg 2.
   - [B] the headwind gap: the wind blows straight back through it, so no sail gets her through; row it,
     by mirror strokes (src/den-row.ts). Sit idle in it and she drifts back a square at a time (Drift).
     And the small gap beside it that a Double hops.
   - [C] the whirlpool channel: only a Vegas from its mouth carries her over (src/den-sailing.ts,
     gustPath); less, and a whirlpool has her and its winds carry her back to the mouth (src/den-whirl.ts).
     And the barrier of driftwood across a gap (Barrier), cleared by Foraging (src/foraging.ts) from the
     notch in front of it, sheltered.
   - [D] the locks: up one, pumped by Bilge, and down the other (src/den-lock.ts), a berth beside the way
     in to wait your turn in; and the zigzag before them, headwinds a Double hops.
   - [E] the crane in its notch on the last spit: built by Carpentry, a part at a time (src/den-crane.ts,
     the cliff's crane's rules put down here), it hauls her over to the run home. And the gap a Triple
     hops.
   Each shortcut saves about what a decent player takes on its puzzle (RACE.DECENT, tested), so it pays
   only if it's your puzzle. The snakes (winds that sweep her back: RACE.md §4) sting more the further
   down the course they are, the left-hand trade wind most: legs 2 and 4 end hard by it, the run home runs
   beside it, and it carries her all the way back to the start. Home is a line across the run home
   between two markers (atFinish).
   The rival (nameless for now: the den's own characters race next) sails the long way at a set pace;
   your best time's kept in this browser. The race keeps a field of racers (src/den-racers.ts: two to
   four on one course, first come first served, shooting each other): you, and the rival as a bot racer.
   The race simulated with bots of every way round is src/race-sim.ts (RACE.md §8). */
import { LAY, SAIL } from './den-sail.js';
import { CHECK } from './den-checkpoint.js';
import { Turret } from './den-turret.js';
import { Crane } from './den-crane.js';
import { Field, stretchAt, atFinish } from './den-racers.js';
export { stretchAt, atFinish };
const RC = LAY.RACE;
const key = (c, r) => `${c},${r}`;
export const RACE = {
    /** Seconds the starter counts down. */
    COUNT: 3,
    /** Seconds she can sit idle in the headwind gap before it drifts her back a square. */
    DRIFT: 3,
    /** How near the gun gap (squares, any way) she has to stay for its guns to keep their fight up; out of
        it, they go back to their marks (as the checkpoint's: CHECK.SIGHT). */
    SIGHT: CHECK.SIGHT,
    /** About what a decent player takes on each shortcut's puzzle, in seconds: what each shortcut saves
        over the long way round its bend, sailed (tests/den-race.test.ts holds each to it). Set (11 Nov,
        the course's second pass) to what the simulation recommended (src/race-sim.ts, RACE.md §8): a
        shortcut pays only for a player good at its puzzle. A heavy combo through the gun gap; a few
        squares rowed by mirror strokes; a Vegas; a lock pumped up by Bilge and another drained; three
        frames of Carpentry; a barrier cleared by Foraging; and the gaps a Double and a Triple hop. */
    DECENT: { guns: 14, headwind: 25, whirls: 49, locks: 26, crane: 38, forage: 15, double: 8, triple: 9 },
    /** The rival: seconds to sail the whole course the long way, from the gun; and its spot on the
        starting line. Quicker than you can sail it the long way (they know the water), so you beat them
        on the shortcuts you're good at. */
    RIVAL: { SECS: 205, SPOT: 13 },
    /** Where your best time's kept, in this browser. */
    STORE: 'den-race-best',
    /** The gun gap's guns in a race of several (RACE.md §6; src/race-sim.ts tries both): what quietens
        them, the same shots as hit other racers, a hit a gun ('shared': leaving the other racers in peace
        pays, "a kind of peaceful racer bonus"); or more hits than a racer starts with, so they want
        Gunnery as well ('hits': HARD hits a gun). The simulation settled it (11 Nov): shared, the gap's
        ways through even with each other; with more hits, shooting them out was the worst way round. And
        once roused, the seconds a gun takes to load again after an aimed shot: slower than the checkpoint's
        (CHECK.AIMED_RELOAD, 4), since in a race it fires on whoever comes near, not only on the racer who
        roused it (the user, 11 Nov: "If they're aggroed, they are very relentless"). */
    GAP: { MODE: 'shared', HARD: 2, AIMED_RELOAD: 6 },
    /** The barrier of driftwood across a gap [C], as Foraging deals it: its bundles of driftwood on the
        board from the start ([row, column], a crate each, the puzzle's smallest container), nothing more
        to come; cleared when they've all dropped out of the bottom (src/foraging.ts: the board's done). */
    FORAGE: { BUNDLES: [[4, 2], [3, 4]] },
};
/** By the starting buoy: where Space takes her in to the starting line. */
export const atStart = (c, r) => c >= RC.START.c0 && c <= RC.START.c1 && r >= RC.START.r0 && r <= RC.START.r1;
/** Anywhere on the course: behind its line of rocks. */
export const onCourse = (c, r) => r > RC.R0;
const headwind = new Set(RC.HEADWIND.map(([c, r]) => key(c, r)));
/** In the headwind gap [B]. */
export const inHeadwind = (c, r) => headwind.has(key(c, r));
/** On the starting line. */
export const onLine = (c, r) => r === RC.LINE.r && c >= RC.LINE.c0 && c <= RC.LINE.c1;
/** Where she starts from on the line at spot `c`: facing out across the start's field. */
export const spotPose = (c) => ({ c: Math.max(RC.LINE.c0, Math.min(RC.LINE.c1, Math.round(c))), r: RC.LINE.r, d: 0 });
/** The spot she's taken in to from the buoy: the line's square below the gate. */
export const FIRST_SPOT = RC.GATE[1][0];
const snakes = new Map([
    ...RC.SNAKES.LEFT.map(([c, r]) => [key(c, r), 'left']),
    ...RC.SNAKES.TIGHT.map(([c, r]) => [key(c, r), 'tight']),
    ...RC.SNAKES.MID.map(([c, r]) => [key(c, r), 'mid']),
]);
export const snakeAt = (c, r) => snakes.get(key(Math.round(c), Math.round(r))) ?? null;
/** The buoy she's sailing for, by where she is: the one at the end of the stretch she's on (1 to 5), 6 the
    finish; in the start's field, buoy 1. (The long way plain to follow: "clearer [buoys] for the main
    route", the next one shown.) */
export function nextBuoy(c, r) {
    const s = stretchAt(Math.round(c), Math.round(r));
    return s >= 0 ? s + 1 : 1;
}
/** The race you sail in the den: on the line (picking her spot), counting down, under way (the clock), or
    done; how far round she's got, in order. Its field (src/den-racers.ts) is two racers: you (racer 0,
    moved by the helm: `at` each tick) and the rival (racer 1, a bot racer the long way round at its set
    pace: rivalAt). */
export class Race {
    best;
    state = 'off';
    /** Counting down, the seconds left; under way, the clock; done, her time. */
    t = 0;
    won = false;
    /** Through the gate onto the course, this race. */
    entered = false;
    /** Her spot on the starting line (its column). */
    spot = FIRST_SPOT;
    /** The racers: you, then the rival. */
    field = new Field(['you', 'rival'], null, RACE.COUNT);
    /** The snake that has her now, if one does (said once a sweep). */
    snake = null;
    constructor(best = null) {
        this.best = best;
    }
    /** The furthest stretch she's reached in order (0 the first leg): every one counts, a shortcut's or not. */
    get leg() { return this.field.racers[0].leg; }
    /** The rival's home. */
    get rivalHome() { return this.field.racers[1].state === 'finished'; }
    /** In to the starting line from the buoy, to pick her spot. Not while one's on. */
    take() {
        if (this.state === 'count' || this.state === 'on')
            return false;
        Object.assign(this, { state: 'line', spot: FIRST_SPOT, won: false, entered: false });
        return true;
    }
    /** Along the line a square, left (-1) or right (+1), or to spot `to`: never onto the rival's (she
        goes past it). Where she is now. */
    shift(by, to = null) {
        if (this.state !== 'line')
            return this.spot;
        let c = to ?? this.spot + by;
        if (c === RACE.RIVAL.SPOT)
            c += (to ?? c) >= this.spot ? 1 : -1;
        if (c >= RC.LINE.c0 && c <= RC.LINE.c1 && c !== RACE.RIVAL.SPOT)
            this.spot = c;
        return this.spot;
    }
    /** The count, from the line (or straight from the buoy). Not while one's on. */
    start() {
        if (this.state === 'count' || this.state === 'on')
            return false;
        Object.assign(this, { state: 'count', t: RACE.COUNT, won: false, entered: false });
        this.snake = null;
        this.field.start();
        return true;
    }
    /** Carried on under the course (the starlit door's tunnel, src/den-door.ts) from stretch `from` to
        stretch `to`, past the ones between: counted as reached in order, if she'd reached `from`. */
    under(from, to) {
        if (this.state !== 'on')
            return [];
        return this.field.under(0, from, to).flatMap((e) => (e.kind === 'leg' ? [{ kind: 'leg', n: e.n }] : []));
    }
    /** Given up (sailed back out through the gate, say). */
    quit() { this.state = 'off'; }
    /** The clock under way: from the gun, 0 till then. */
    clock() { return this.state === 'on' || this.state === 'done' ? this.t : 0; }
    /** Each tick: `at`, her square after it. */
    tick(dt, at) {
        const out = [];
        if (this.state === 'count') {
            for (const e of this.field.tick(dt))
                if (e.kind === 'count' || e.kind === 'go')
                    out.push(e);
            this.t = this.field.t;
            if (this.field.state === 'on')
                this.state = 'on';
            return out;
        }
        if (this.state !== 'on')
            return out;
        this.field.tick(dt);
        this.t = this.field.t;
        if (onCourse(at.c, at.r))
            this.entered = true;
        else if (this.entered) {
            this.state = 'off';
            out.push({ kind: 'quit' });
            return out;
        }
        // (the rival: home at its set time, whatever the clock's steps)
        const rival = this.field.racers[1];
        if (rival.state !== 'finished') {
            const p = rivalAt(this.t);
            const ev = this.t >= RACE.RIVAL.SECS ? this.field.home(1, RACE.RIVAL.SECS) : this.field.move(1, { c: p.c, r: p.r, d: p.a });
            if (ev.some((e) => e.kind === 'finish'))
                out.push({ kind: 'rival' });
        }
        // (a snake: said once each time one has her)
        const sn = snakeAt(at.c, at.r);
        if (sn && sn !== this.snake)
            out.push({ kind: 'swept', snake: sn });
        this.snake = sn;
        for (const e of this.field.move(0, { c: at.c, r: at.r, d: 0 })) {
            if (e.kind === 'leg')
                out.push({ kind: 'leg', n: e.n });
            if (e.kind === 'finish') {
                this.state = 'done';
                this.won = e.place === 1;
                const best = this.best === null || this.t < this.best;
                if (best)
                    this.best = this.t;
                out.push({ kind: 'finish', secs: this.t, best, won: this.won, place: e.place });
            }
        }
        return out;
    }
}
/** A time as the clock shows it: 3:07.4. */
export function clockText(secs) {
    const m = Math.floor(secs / 60), s = secs - m * 60;
    return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
}
/** A best time as kept in this browser, or null if it's not one. */
export function cleanBest(o) {
    const n = typeof o === 'string' ? Number(o) : o;
    return typeof n === 'number' && Number.isFinite(n) && n > 0 && n < 3600 ? n : null;
}
/* The rival: the long way round, at a set pace, from its spot on the line. Its route as squares,
   straight runs between them, down through the start's field and along the middle of each stretch
   (the run home's one row), round every bend, to the finish line, at a steady pace that brings it home
   in RACE.RIVAL.SECS. */
const S = RC.STRETCHES;
/** The row the long way runs along a stretch: the middle of its two, or the run home's one. */
export const routeRow = (i) => (i === S.length - 1 ? S[i].r : S[i].r + 0.5);
export const RIVAL_ROUTE = (() => {
    const out = [[RACE.RIVAL.SPOT, RC.LINE.r], [RACE.RIVAL.SPOT, routeRow(0)]];
    S.forEach((s, i) => {
        const end = s.d === 1 ? SAIL.COLS - 1.5 : i === S.length - 1 ? RC.FINISH[0] : 2.5;
        out.push([end, routeRow(i)]);
        if (i + 1 < S.length)
            out.push([end, routeRow(i + 1)]);
    });
    return out;
})();
const seg = RIVAL_ROUTE.slice(1).map((b, i) => { const a = RIVAL_ROUTE[i]; return { a, b, len: Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]) }; });
const pace = RACE.RIVAL.SECS / seg.reduce((n, x) => n + x.len, 0);
/** Where the rival is `t` seconds from the gun: across, out, and the way it faces (quarter turns). */
export function rivalAt(t) {
    let left = Math.max(0, t);
    for (let i = 0; i < seg.length; i++) {
        const { a, b, len } = seg[i], secs = len * pace;
        const dc = Math.sign(b[0] - a[0]), dr = Math.sign(b[1] - a[1]), face = dr > 0 ? 0 : dc > 0 ? 1 : dr < 0 ? 2 : 3;
        if (left < secs || i === seg.length - 1) {
            const u = Math.min(1, left / secs);
            return { c: a[0] + (b[0] - a[0]) * u, r: a[1] + (b[1] - a[1]) * u, a: face, home: left >= secs };
        }
        left -= secs;
    }
    return { c: RC.FINISH[0], r: RC.FINISH[1], a: 3, home: true };
}
export class GunGap {
    guns = RC.GUNS.at.map((at, g) => new Turret({
        at, marks: RC.GUNS.marks[g], alert: false, reach: CHECK.REACH,
        flight: CHECK.AIMED, reload: RACE.GAP.AIMED_RELOAD, markFlight: CHECK.FLIGHT, markReload: CHECK.RELOAD,
        quiet: CHECK.QUIET, wreck: CHECK.WRECK,
    }));
    scored = this.guns.map(() => false);
    /** The gun on this square, or -1. */
    gunAt(c, r) { return this.guns.findIndex((t) => t.at[0] === c && t.at[1] === r); }
    /** Her shot came down on (c, r): a hit on a gun (see Turret.hit), it's a fight now; null if it isn't one. */
    shot(c, r) {
        const g = this.gunAt(c, r);
        if (g < 0)
            return null;
        const first = !this.guns.some((t) => t.roused);
        for (const t of this.guns)
            t.rouse();
        return { gun: g, did: this.guns[g].hit(), first };
    }
    /** Both wrecked: the gap's safe. */
    silenced() { return this.guns.every((t) => t.wrecked); }
    /** `ship`: where she is (Helm.now), or null when they shouldn't fire on her (Helm.spared). */
    tick(dt, ship, at) {
        const [gc, gr] = RC.GUNS.gap;
        if (Math.max(Math.abs(at.c - gc), Math.abs(at.r - gr)) > RACE.SIGHT + 1) {
            this.scored.fill(false);
            for (const t of this.guns)
                t.roused = false;
        }
        return this.guns.flatMap((t, gun) => t.tick(dt, this.scored[gun] && !t.roused ? null : ship).map((e) => {
            if (e.kind === 'land' && e.hit)
                this.scored[gun] = true;
            return { ...e, gun };
        }));
    }
}
/* [B] Drift: sat idle in the headwind gap (nothing being sailed or rowed), the wind blows her back a
   square every RACE.DRIFT seconds, out of it the way she came in (back round its dog-leg). */
export class Drift {
    idle = 0;
    /** Each tick: the square it blows her back to, if it does (Helm.gust plays it). */
    tick(dt, h) {
        const p = h.pose, still = h.slot < 0 && !h.cur && !h.gusts.length && !h.strokes.length && !h.dazed();
        if (!inHeadwind(p.c, p.r) || !still) {
            this.idle = 0;
            return null;
        }
        this.idle += dt;
        if (this.idle < RACE.DRIFT)
            return null;
        this.idle = 0;
        const i = RC.HEADWIND.findIndex(([c, r]) => c === p.c && r === p.r), [c, r] = i > 0 ? RC.HEADWIND[i - 1] : [p.c, p.r - 1];
        return { c, r, d: p.d };
    }
}
/** [E] The crane in its notch: the cliff's crane's rules (src/den-crane.ts), its ledge here: she lies in
    the notch off leg 5, and it sets her down on the run home (LAY.RACE.CRANE.TO). Once built it stays
    built, race after race. */
export const neckCrane = (random = Math.random) => new Crane(random, [...RC.CRANE.LEDGE]);
/* [C] The barrier of driftwood across a gap (the user, 11 Nov: "it's not even macheting. You just have
   to clear the barrier ... similar to the static rocks, but you're doing it through foraging"): land on
   the sea till it's cleared, by a board of Foraging dealt with its bundles of driftwood on it
   (barrierDeal; src/foraging.ts, the one implementation, played as Umami's is), from the notch in front
   of it. Sheltered there, between the gap's banks: with the whirlpools on the same spit out in the open,
   it's the leader's shortcut on this stretch (the user, 11 Nov: "So I don't want the leaders not be able
   to puzzle at all"). Cleared, it's open for the rest of the race; a new race, it's back. */
export const atNotch = (c, r) => c === RC.FORAGE.NOTCH[0] && r === RC.FORAGE.NOTCH[1];
export function barrierDeal(random = Math.random) {
    return { random, bananas: 0, start: RACE.FORAGE.BUNDLES.map(([r, c]) => ({ size: 'crate', r, c, tag: 'drift' })) };
}
export class Barrier {
    cleared = false;
    /** Cleared: its squares open water on `sea`. */
    clear(sea) {
        for (const [c, r] of RC.FORAGE.BARRIER) {
            sea.works.delete(key(c, r));
            sea.rocks.delete(key(c, r));
        }
        this.cleared = true;
    }
    /** Back across the gap, for a new race. */
    reset(sea) {
        for (const [c, r] of RC.FORAGE.BARRIER) {
            sea.works.add(key(c, r));
            sea.rocks.add(key(c, r));
        }
        this.cleared = false;
    }
}
