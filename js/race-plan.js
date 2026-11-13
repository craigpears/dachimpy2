/* Pirate Den: planning your race route, then puzzling it through (RACE.md §5; agreed 12 Nov, built 13 Nov).
   TypeScript, compiled to js/race-plan.js; tested in tests/race-plan.test.ts. Pure: no 3D, no DOM.

   The user (12 Nov): "if we are supposed to be puzzling as you're going through as a person, some way of like
   pre-planning your route through the course ... and then the puzzling's kind of the executing phase", and,
   agreeing it: "I like that plan idea ... you plan by choosing those options, that works. That's really simple
   and easy." Then (13 Nov): "it should all be in the same thing. So if you're watching the race, you should
   ... be able to see what people's plans are ... online, local should all be the same."

   So every racer races by a plan, the one module for all of them: your sloop, your rivals, the simulation's
   bots, the race watched, and racers online.
   - A plan is a choice for each leg (LEGS): the long way, or one of that leg's shortcuts. Not a drawn line: the
     pilot knows the water. It starts as the long way everywhere (longPlan), and it can be changed at any time
     (choose, cycle), hidden from the other racers.
   - What a plan takes (cutsOf: the shortcuts, in course order; gapOf: how it takes the gun gap) is what the
     simulation's bots race by (src/race-sim.ts: a route is a named plan; a bot changes hers when she gives a
     shortcut up), and what the pilot sails you by.
   - Where the pilot heads next (goalOf, pinOf): the long way's next pin, or the plan's next shortcut's way in
     (WAY_IN), the same rule for every racer, weighed by how far round the long way she's got. The moves there
     are read off the pilot's chart (src/race-pilot.ts, PilotChart), never worked out another way.
   - The obstacles make the stops, never the plan (Pilot, for a sloop sailed by a person): each shortcut and
     each hop has a spot she stops at (STOPS), the board it needs put up there; she goes on once it's done (a
     gust's carried her over, the crane's swung her across, the lock's pumped). A Double or Triple held and
     thrown on the way in (the gaps' mouths line her up: src/den-sailing.ts, lineUp) is used without stopping. */
import { LAY, SAIL, Sea } from './den-sail.js';
import { PilotChart } from './race-pilot.js';
import { DOOR } from './den-door.js';
import { fieldFor } from './start-field.js';
import { LONG_ROUTE, routeRow, bayAlong } from './den-race.js';
import { gustPath } from './den-sailing.js';
const RC = LAY.RACE, S = RC.STRETCHES, P = RC.SPITS;
const opt = (id, name, short, puzzle, cuts = []) => ({ id, name, short, puzzle, cuts });
const LONG = opt('long', 'The long way', 'Long way', 'Sailing on the pilot');
/** Each leg's choices, the long way first, then its shortcuts in the order she comes to them. */
export const LEGS = [
    { n: 1, options: [LONG, opt('bribe', 'The wreck, then bribe the gate', 'Bribe', 'Treasure Haul', ['wreck', 'guns']), opt('shoot', 'Shoot the gate quiet', 'Shoot', 'Gunnery', ['guns']), opt('run', 'Run the gate', 'Run', 'no puzzle: holed by both its guns', ['guns'])] },
    { n: 2, options: [LONG, opt('headwind', 'The headwind gap', 'Row', 'rowing', ['headwind']), opt('door', 'The starlit door', 'Door', 'Duty Navigation', ['door']), opt('double', 'The Double\'s gap', 'Double', 'Sailing: a Double', ['double'])] },
    { n: 3, options: [LONG, opt('whirls', 'The whirlpools', 'Vegas', 'Sailing: a Vegas', ['whirls']), opt('rocks', 'The rocks', 'Rocks', 'Gunnery: broadsides', ['rocks']), opt('forage', 'The driftwood', 'Driftwood', 'Foraging', ['forage'])] },
    { n: 4, options: [opt('long', 'The long way', 'Weave', 'weaving the zigzag: no puzzle'), opt('zigzag', 'Hop the zigzag', 'Hop', 'Sailing: a Double a headwind', ['zigzag']), opt('locks', 'The locks', 'Locks', 'Bilge', ['locks'])] },
    { n: 5, options: [LONG, opt('crane', 'The crane', 'Crane', 'Carpentry', ['crane']), opt('triple', 'The Triple\'s gap', 'Triple', 'Sailing: a Triple', ['triple'])] },
];
/** The long way everywhere, hopping the zigzag: where every plan starts. */
export const longPlan = () => LEGS.map(() => 'long');
/** Leg `leg`'s option `id`, if it has one. */
export const optionOf = (leg, id) => LEGS[leg]?.options.find((o) => o.id === id);
/** A plan with leg `leg` changed to `id` (unchanged if it isn't one of that leg's). */
export function choose(plan, leg, id) {
    if (!optionOf(leg, id))
        return plan;
    const out = [...plan];
    out[leg] = id;
    return out;
}
/** One click on a leg: its next choice, round to the first again. */
export function cycle(plan, leg, by = 1) {
    const os = LEGS[leg].options, k = os.findIndex((o) => o.id === plan[leg]);
    return choose(plan, leg, os[(((k + by) % os.length) + os.length) % os.length].id);
}
/** A plan as written down or said over the wire, made safe: a choice of each leg's own, the long way otherwise. */
export function cleanPlan(x) {
    const a = Array.isArray(x) ? x : [];
    return LEGS.map((L, i) => (L.options.some((o) => o.id === a[i]) ? a[i] : 'long'));
}
/** Your last plan, kept in this browser (the user, 13 Nov: "persist the last plan you chose so that you don't
    need to do it every time"): each race starts from it. Under this key, as written by writePlan; read back by
    readPlan, which makes anything stale or broken safe (the long way where it doesn't fit). */
export const PLAN_STORE = 'carp.den.racePlan';
export const writePlan = (plan) => JSON.stringify(cleanPlan(plan));
export function readPlan(raw) {
    try {
        return cleanPlan(raw ? JSON.parse(raw) : null);
    }
    catch {
        return longPlan();
    }
}
/** The shortcuts a plan takes, in course order. */
export const cutsOf = (plan) => plan.flatMap((id, leg) => optionOf(leg, id)?.cuts ?? []);
/** How a plan takes the gun gap, if it does: run, its guns shot quiet, or its guard bribed. */
export function gapOf(plan) {
    return { run: 'run', shoot: 'shot', bribe: 'bribe' }[plan[0]] ?? undefined;
}
/** The leg a shortcut's choice is on. */
export const legOf = (id) => CUT_AT[id][0];
/** What a plan falls back to on a leg when a shortcut on it is given up (or can't be got to): the long way (on
    leg 4 weaving, as she would without the zigzag's hops; the bribe's gate without its coins is run). */
export const fallback = (leg, id) => (leg === 0 && id === 'bribe' ? 'run' : 'long');
/** The plan's legs from `from` on, in words: "Leg 3: the whirlpools (Sailing: a Vegas)". */
export const planText = (plan, from = 0) => plan.slice(from).map((id, k) => {
    const o = optionOf(from + k, id);
    return `Leg ${from + k + 1}: ${o.name.toLowerCase().replace(/^the /, 'the ')}`;
});
/* ---- Where each shortcut leaves the long way ---- */
const G = RC.GUNS.way, WR = RC.BRIBE.NOTCH, B = RC.HEADWIND, M = RC.WHIRLS.MOUTH, K = RC.ROCKS, L = RC.LOCKS, E = RC.CRANE, D = RC.DOOR, F = RC.FORAGE, D2 = RC.DOUBLE.WAY, T3 = RC.TRIPLE, Z = RC.ZIGZAG;
/** The stretch and column where each shortcut leaves the long way (the simulation's CUTS go by it too). */
export const CUT_AT = {
    guns: [0, G[0][0]], wreck: [0, WR[0]], headwind: [1, B[0][0]], double: [1, D2[0][0]], whirls: [2, M.c], rocks: [2, K.WALL[0][0]],
    forage: [2, F.NOTCH[0]], locks: [3, L[0].at[0]], crane: [4, E.LEDGE[0]], triple: [4, T3[0][0]], zigzag: [3, Z[0][0] + 1], door: [DOOR.FROM, D.OFF[0][0]],
};
/** The long way's pins, in order, as the pilot sails it (tools/race-measure.mjs, tests/race-helpers.ts's
    longWay): round each spit's end (spit 1's by way of the fort's bay since 13 Nov: round its mole's end, and on
    round buoy 1), to beside the trade wind back up the course (`hop`: hopped with a Double), and on to the finish
    line. */
export const LONG_PINS = [
    { at: [SAIL.COLS - 2, P[0].r0] }, { at: [...RC.BAY.TURN] }, { at: [SAIL.COLS - 2, P[0].r1] }, { at: [3, P[1].r1] }, { at: [RC.SNAKES.MID[0][0] - 1, S[2].r + 1], hop: true },
    { at: [SAIL.COLS - 2, P[2].r1] }, { at: [3, P[3].r1] }, { at: [SAIL.COLS - 2, P[4].r1] }, { at: [RC.FINISH[0], RC.FINISH[1]] },
];
/** The trade wind back up the course's pin. */
export const HOP_PIN = LONG_PINS.findIndex((p) => p.hop);
/** Every shortcut's way through the spits: shut on the pilot's sea but for the one she's taking, so the pilot
    never wanders into one. */
export const WAYS = [...RC.GUNS.way, ...RC.HEADWIND, ...RC.LOCKS.map((l) => l.at), ...RC.DOUBLE.WAY];
const WAYS_OF = { guns: RC.GUNS.way, headwind: RC.HEADWIND, locks: RC.LOCKS.map((l) => l.at), double: RC.DOUBLE.WAY };
/** The shortcut whose way through she's in, if she's in one (a gust's left her there, say): its way's open to
    the pilot while she's in it. */
export const wayAt = (c, r) => Object.keys(WAYS_OF).find((id) => WAYS_OF[id].some(([x, y]) => x === c && y === r)) ?? null;
/** A sea with every shortcut's way shut but `open`'s. */
export function shutWays(s, open = null) {
    const keep = new Set((open ? WAYS_OF[open] ?? [] : []).map(([c, r]) => `${c},${r}`));
    for (const [c, r] of WAYS)
        if (!keep.has(`${c},${r}`))
            s.rocks.add(`${c},${r}`);
    s.touch();
    return s;
}
/** Where she leaves the long way for each shortcut, the pilot sailing her there when her plan takes it: her
    square on the leg at its way in, on its second row, the spit's side (every shortcut goes down through a
    spit, and the course's wind blows down it: from the second row there's no sailing back up onto the first);
    or the first, or a column on, where that's a trade wind's. On `sea`, the course's with its ways shut. */
export function waysIn(sea) {
    const ok = ([x, y]) => sea.open(x, y) && sea.windAt(x, y) === undefined && !sea.isLock(x, y);
    return Object.fromEntries(Object.keys(CUT_AT).map((id) => {
        const [s, c] = CUT_AT[id], r = S[s].r;
        const near = [[c, r + 1], [c, r], [c - 1, r + 1], [c + 1, r + 1], [c - 1, r], [c + 1, r]];
        return [id, near.find(ok) ?? near[0]];
    }));
}
let courseOnce = null;
/** The ways in on the den's course (WAY_IN): the same squares for every racer. */
export const WAY_IN = waysIn(courseOnce ??= shutWays(new Sea(9)));
/** The course drawn small, for the plan's strip (13 Nov: "you need to be able to see the length"): its squares
    across, its rows from the starting line down to the run home, and its land as runs along each row
    ([row, first column, last column]). Each choice's line on it: src/race-sim.ts, choiceLines and planLines. */
export function courseChart(sea = new Sea(9)) {
    const r0 = RC.LINE.r, r1 = sea.rows - 1, land = [];
    for (let r = r0; r <= r1; r++) {
        let from = -1;
        for (let c = 0; c <= sea.cols; c++) {
            const solid = c < sea.cols && !sea.open(c, r);
            if (solid && from < 0)
                from = c;
            if (!solid && from >= 0) {
                land.push([r, from, c - 1]);
                from = -1;
            }
        }
    }
    return { cols: sea.cols, r0, r1, land };
}
/** The long way's next pin from how far round she's got (`at`, by `pinAt`'s measure): beside the trade wind
    back up the course till she's hopped it. */
export function pinOf(at, hopped, pinAt) {
    const k = LONG_PINS.findIndex((_, j) => pinAt[j] > at + 1e-6 || (j === HOP_PIN && !hopped));
    return k < 0 ? LONG_PINS.length - 1 : k;
}
/** The next shortcut a plan's cuts take before the long way's pin `k`, if any: not done, not the zigzag (it's
    on the long way's water), and not one she's well past (`back`: a few squares, she goes back for one she
    came onto the leg beyond). Measured round the long way by `cutAt` and `pinAt`, the caller's measure (the
    simulation's seconds; squares). The same rule for every racer. Bribing the gate, she hauls the wreck's coins
    first, wherever it lies, and goes back along leg 1 however far for the wreck and then the gate (13 Nov: most of
    the field comes down onto leg 1 by the start's hop, past them both; and out of the wreck's notch, she's counted
    as far round as the leg goes). */
export function goalOf(cuts, done, at, k, pinAt, cutAt, back) {
    const bribing = cuts.includes('wreck'), forGate = (id) => bribing && (id === 'wreck' || id === 'guns');
    const wreckFirst = bribing && !done.has('wreck');
    return cuts.filter((id) => id !== 'zigzag' && !done.has(id) && !(id === 'guns' && wreckFirst))
        .filter((id) => cutAt(id) <= pinAt[k] + 1e-6 && (cutAt(id) >= at - back || forGate(id)))
        .sort((x, y) => cutAt(x) - cutAt(y))[0] ?? null;
}
/* ---- How far round the long way, in squares (the pilot's measure; the simulation's, progressAt, is the same
   in seconds) ---- */
const SEGS = LONG_ROUTE.slice(1).map((b, i) => { const a = LONG_ROUTE[i]; return { a, b, len: Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]) }; });
/** Squares round the long way to column `c` of stretch `s`. */
export function roundTo(s, c) {
    const row = routeRow(s);
    let t = 0;
    for (const { a, b, len } of SEGS) {
        if (a[1] === row && b[1] === row)
            return t + Math.abs(Math.max(Math.min(a[0], b[0]), Math.min(Math.max(a[0], b[0]), c)) - a[0]);
        t += len;
    }
    return t;
}
/** Which stretch she's on or past (0 the first leg, 5 the run home; -1 above the first). */
export function stretchOf(r) {
    let s = S.length - 1;
    while (s >= 0 && S[s].r > Math.round(r))
        s--;
    return s;
}
/** How far round the long way a square is, in squares: by the stretch she's on (either of its two rows), or
    the last she's below (in a spit, through a shortcut: as far along it as it goes), or down the start's field. */
export function roundAt(p) {
    const bay = bayAlong(p.c, p.r); // (in the fort's bay, round it: src/den-race.ts)
    if (bay !== null)
        return bay;
    const r = Math.round(p.r);
    if (r < S[0].r)
        return ((p.r - RC.LINE.r) / (S[0].r + 0.5 - RC.LINE.r)) * roundTo(0, LONG_ROUTE[0][0]);
    const s = stretchOf(r), onIt = r === S[s].r || r === S[s].r + 1;
    return roundTo(s, onIt ? p.c : S[s].d === 1 ? SAIL.COLS : -1);
}
const T = (s) => S[s].r;
/** The zigzag's headwinds, in the order she meets them (leg 4 runs left). */
const ZIG = [...Z].sort((a, b) => b[0] - a[0]);
export const STOPS = {
    /** The trade wind back up the course, on the long way: hopped with a Double from right behind it. */
    mid: { id: 'mid', at: LONG_PINS[HOP_PIN].at, d: 1, board: 'sailing', need: 2, hold: true, say: 'The trade wind back · a Double hops her over' },
    zigzag: ZIG.map(([c, r], k) => ({ id: `zigzag${k}`, at: [c + 1, r], d: 3, board: 'sailing', need: 2, hold: true, say: `The zigzag's headwind ${k + 1} of ${ZIG.length} · a Double hops her over` })),
    shoot: { id: 'shoot', at: [G[0][0] - 1, G[0][1] - 1], d: 1, board: 'gunnery', say: 'Off the gate\'s gun · Q: fire port to quieten it' },
    wreck: { id: 'wreck', at: [...WR], board: 'treasure', say: 'The old wreck · haul up the guard\'s price' },
    pay: { id: 'pay', at: [...RC.BRIBE.GATE], board: 'pay', say: 'The imperial gate · paying the guard' },
    /** (lined up facing down into the gap before the oars go out, so the oars take her along it, not across its
        mouth: the user, 13 Nov, "the rowboat is perpendicular to the actual gap, so you're not even going forward") */
    headwind: { id: 'headwind', at: [B[0][0], B[0][1] - 1], d: 0, board: 'rowing', say: 'The headwind gap · even clears on both boards row her down it', cut: 'headwind' },
    double: { id: 'double', at: [D2[0][0], T(1) + 1], board: 'sailing', need: 2, hold: true, say: 'The Double\'s gap · a Double hops her over', cut: 'double' },
    door: { id: 'door', at: [...D.OFF[0]], board: 'navigation', say: 'The starlit door · Duty Navigation opens it' },
    whirls: { id: 'whirls', at: [M.c, M.r], d: 0, board: 'sailing', need: 7, say: 'The whirlpools\' mouth · a Vegas carries her over' },
    rocks: { id: 'rocks', at: [K.WALL[0][0], T(2) + 1], d: 1, board: 'gunnery', say: 'Off the rocks · Q: fire port at them' },
    forage: { id: 'forage', at: [...F.NOTCH], board: 'foraging', say: 'The driftwood · clear it' },
    locks: { id: 'locks', at: [...L[0].at], board: 'bilge', say: 'The up lock · pump it up' },
    crane: { id: 'crane', at: [...E.LEDGE], board: 'carpentry', say: 'The crane · build it, and it hauls her over' },
    triple: { id: 'triple', at: [T3[0][0], T(4) + 1], board: 'sailing', need: 3, hold: true, say: 'The Triple\'s gap · a Triple hops her over', cut: 'triple' },
};
const at = (p, q) => p.c === q[0] && p.r === q[1];
/** On a stretch's own rows (not in a spit, a notch or a gap). */
const onLeg = (p) => { const s = stretchOf(p.r); return s >= 0 && (Math.round(p.r) === S[s].r || Math.round(p.r) === S[s].r + 1); };
/** Held at a hop's stop, a gust of `run` squares too small to hop it doesn't carry her into its wind: she's held
    there for the one that will (the pilot holding her, as agreed: "the pilot sails up to it, lines her up, holds
    her there and puts up the board it asks for"). Whether it's held. */
export const holds = (o, run) => o.kind === 'stop' && !!o.stop.hold && run > 0 && run < (o.stop.need ?? 0);
/** The pilot, sailing your sloop by your plan, a move at a time, with the same moves as your own helm. The
    bots' pilot is the simulation's (src/race-sim.ts), by the same rule for where to head (goalOf), the same
    ways in and the same charts. Each step: steer(h, w) puts in her next moves (h.put, as your own: written
    down online as yours are), or holds her at a stop. */
export class Pilot {
    plan;
    /** The shortcuts she's been through (or given up), and whether she's over the trade wind back up the course. */
    done = new Set();
    hopped = false;
    /** Off: the helm's yours, and the pilot puts nothing in. Taken: you've put in moves or dropped a pin, and
        she's sailing them; the pilot carries on once they're played out. */
    on = true;
    taken = false;
    /** Changes of plan in the race, for whoever's watching. */
    changes = [];
    /** The order given last, and the shortcut she's on her way through, if she is. */
    order = { kind: 'idle' };
    going = null;
    charts = new Map();
    seas = new Map();
    sig = '';
    letGone = false;
    constructor(plan = longPlan()) { this.plan = cleanPlan(plan); }
    /** A new race: the plan kept (it's yours), nothing done. */
    restart() { this.done.clear(); this.going = null; this.hopped = false; this.taken = false; this.changes = []; this.order = { kind: 'idle' }; this.letGone = false; }
    /** The plan changed (one click on the strip: cycle), at the race's clock `t`. */
    set(plan, t = 0) {
        const next = cleanPlan(plan);
        next.forEach((id, leg) => { if (id !== this.plan[leg])
            this.changes.push({ t, leg, from: this.plan[leg], to: id }); });
        this.plan = next;
    }
    /** The pilot's chart to a square (and a way to face there, `d`), on her sea with every way shut but `open`'s:
        charted once for each, again when her sea changes. */
    chart(w, goal, d, open) {
        if (w.sig !== this.sig) {
            this.sig = w.sig;
            this.charts.clear();
            this.seas.clear();
        }
        const k = `${goal}|${d ?? ''}|${open ?? ''}`;
        let ch = this.charts.get(k);
        if (!ch) {
            const sk = open ?? '';
            let sea = this.seas.get(sk);
            if (!sea) {
                sea = new Sea(9);
                sea.layField(fieldFor(w.seed));
                sea.breeze = w.sea.breeze;
                // (her own sea's land as it is now, in the race's rows: the barrier, the rocks, a spot shut to her)
                for (let c = 0; c < sea.cols; c++)
                    for (let r = RC.R0; r < sea.rows; r++) {
                        const q = `${c},${r}`;
                        if (w.sea.rocks.has(q))
                            sea.rocks.add(q);
                        else
                            sea.rocks.delete(q);
                    }
                shutWays(sea, open);
                this.seas.set(sk, sea);
            }
            this.charts.set(k, ch = new PilotChart(sea, [goal[0], goal[1]], RC.LINE.r - 1, sea.rows - 1, () => Infinity, d));
        }
        return ch;
    }
    /** Where she's headed, from where she is: the order for now. */
    next(h, w, depth = 0) {
        const p = h.pose, s = stretchOf(p.r), cuts = cutsOf(this.plan);
        // (through or past a shortcut's leg, it's done)
        for (const id of cuts)
            if (s > legOf(id))
                this.done.add(id);
        if (!this.hopped && (s > 2 || (s === 2 && p.c >= RC.SNAKES.MID[0][0])))
            this.hopped = true;
        if (s === S.length - 1 && p.c <= RC.FINISH[0])
            return { kind: 'idle' };
        const pinAt = LONG_PINS.map((x) => roundAt({ c: x.at[0], r: x.at[1] }));
        const here = roundAt(p), k = pinOf(here, this.hopped, pinAt);
        const cutAt = (id) => roundTo(CUT_AT[id][0], CUT_AT[id][1]);
        // (the shortcut she's on her way through, kept to till she's out the far side: in a notch or a gap she's
        // counted as far round as the leg goes, past it; on the leg's own rows well past its way in, it's let go,
        // as goalOf would. The Double's gap's gust leaves her in its far end: through)
        const c0 = this.going;
        if (c0 && (!cuts.includes(c0) || this.done.has(c0) || (onLeg(p) && cutAt(c0) < here - 6) || (c0 === 'double' && wayAt(p.c, p.r) === 'double'))) {
            if (c0 === 'double' && cuts.includes(c0))
                this.done.add(c0);
            this.going = null;
        }
        const g = this.going ?? goalOf(cuts, this.done, here, k, pinAt, cutAt, 6);
        this.going = g;
        if (g) {
            const o = this.cut(g, h, w, depth);
            if (o)
                return o;
            // (put by: a shortcut whose way in no sailing gets her to from here, as the bots do: the long way there)
            this.done.add(g);
            this.going = null;
            const leg = legOf(g);
            this.set(choose(this.plan, leg, fallback(leg, this.plan[leg])));
            return depth < 4 ? this.next(h, w, depth + 1) : { kind: 'idle' };
        }
        // (the zigzag's hops: each headwind on the row she's sailing that's still ahead of her on leg 4, a stop
        // behind it, a Double over each (they alternate rows, so that's every other one: the rest aren't in her way);
        // one she can't line up for from where she is, she weaves by)
        if (cuts.includes('zigzag') && s === 3) {
            const z = STOPS.zigzag.find((x) => x.at[1] === p.r && p.c >= x.at[0]);
            if (z && this.reach(w, z, null, p))
                return this.stopOr(p, z, null);
        }
        if (k === HOP_PIN && !this.hopped)
            return this.stopOr(p, STOPS.mid, null);
        return { kind: 'sail', to: LONG_PINS[k].at };
    }
    /** Whether she can sail to a stop's spot from here (or she's on it). */
    reach(w, st, open, p) {
        return at(p, st.at) || this.chart(w, st.at, st.d, open ?? wayAt(p.c, p.r)).secs(p) < Infinity;
    }
    /** Sail to a stop's spot, or held there once she's on it (facing as it needs). */
    stopOr(p, st, open) {
        if (at(p, st.at) && (st.d === undefined || p.d === st.d))
            return { kind: 'stop', stop: st };
        return { kind: 'sail', to: st.at, d: st.d, open };
    }
    /** The way through a shortcut her plan takes: to its stop, held there, then through. Null if she can't get
        there from here. */
    cut(id, h, w, depth) {
        const p = h.pose, s = stretchOf(p.r);
        const go = (st, open = null) => (this.reach(w, st, open, p) ? this.stopOr(p, st, open) : null);
        switch (id) {
            case 'wreck':
                if (w.coins() >= w.price) {
                    this.done.add('wreck');
                    return this.next(h, w, depth + 1);
                }
                return go(STOPS.wreck);
            case 'guns': {
                const gap = gapOf(this.plan);
                if (gap === 'bribe' && w.coins() >= w.price && !w.paid())
                    return go(STOPS.pay);
                if (gap === 'shot' && !w.gunQuiet())
                    return go(STOPS.shoot);
                // (through the fort to buoy 1, past the way out: 13 Nov; there, she's through)
                const out = [G[G.length - 1][0], G[G.length - 1][1] + 1];
                if (at(p, out)) {
                    this.done.add('guns');
                    this.going = null;
                    return this.next(h, w, depth + 1);
                }
                return { kind: 'sail', to: out, open: 'guns' };
            }
            // (rowing up the gap, the oars out: the board's steering her, not the pilot, till she's out on leg 3)
            // (and on its spot with the oars out, whichever way a stroke's turned her: they stay out)
            case 'headwind': return (s === 1 && p.r > T(1) + 1) || (h.oars && at(p, STOPS.headwind.at)) ? { kind: 'stop', stop: STOPS.headwind } : go(STOPS.headwind);
            case 'door': return go(STOPS.door);
            case 'double': return go(STOPS.double);
            case 'whirls': return go(STOPS.whirls);
            case 'rocks': return w.rocksDown() ? { kind: 'sail', to: [...K.OUT] } : go(STOPS.rocks);
            case 'forage': return w.cleared() ? { kind: 'sail', to: [...F.OUT] } : go(STOPS.forage);
            // (into the up lock, held there till it's pumped by Bilge on its quay; then on through the canal and down)
            case 'locks': return at(p, L[0].at) && h.held() === 'up' ? { kind: 'stop', stop: STOPS.locks } : { kind: 'sail', to: [L[1].at[0], T(4)], open: 'locks' };
            case 'crane': return go(STOPS.crane);
            case 'triple': return go(STOPS.triple);
            default: return null;
        }
    }
    /** One step of the race (before the helm's): her next moves put in toward where the order says, or held.
        What it ordered. */
    steer(h, w) {
        // (a gust's carrying her: the rest of her turn, put in from where she was, is let go, and she goes on from
        // where it leaves her, as the bots do)
        if (h.gusts.length) {
            if (!this.letGone && (h.mine.length || h.slot >= 0)) {
                h.letGo();
                this.letGone = true;
            }
            return this.order;
        }
        this.letGone = false;
        // (swept along by a square of wind, or a gust's last: where she'll be is where it leaves her)
        if (h.cur?.m === 'W' && !h.cur.done)
            return this.order;
        if (!this.on)
            return (this.order = { kind: 'idle' });
        // (the helm's yours till your own moves and pin are played out)
        if (this.taken) {
            if (h.pin || h.mine.length || h.slot >= 0 || h.cur)
                return (this.order = { kind: 'idle' });
            this.taken = false;
        }
        const o = (this.order = this.next(h, w));
        if (o.kind !== 'sail' || h.oars || h.mine.length >= SAIL.SLOTS)
            return o;
        // (her next moves off the chart, a turn's worth ahead, from where those already put in leave her)
        let q = h.after();
        for (const m of h.mine)
            q = h.sea.sail(q, m).to;
        const got = this.chart(w, o.to, o.d, o.open ?? wayAt(q.c, q.r)).moves(q, SAIL.SLOTS - h.mine.length);
        for (const m of got.moves)
            h.put(m);
        return o;
    }
    /** Whether a Sailing gust of `run` squares is held where she is, and why: 'hop', at a hop's stop and too small
        for it (holds); 'way', it would carry her into a shortcut's way through that her plan isn't taking her
        through just now. The user, 13 Nov: the plan changed while she was held facing into the gate for the Quad,
        and a gust carried her straight through it without paying or shooting. So a gust goes into a way through
        only if it's the one she's in, or the one she's going for and may go through now: the gate's gun quiet once
        shot, its guard paid (run, she sails it a square at a time: no gust rushes her past its guns since the Quad
        went, 13 Nov). The pilot then turns her onto the leg, and the next
        gust goes along it. Null when it carries her (or the helm's yours: the pilot off, or your own moves). */
    gustHeld(h, w, run) {
        if (holds(this.order, run))
            return 'hop';
        if (!this.on || this.taken || run <= 0)
            return null;
        const from = h.gustFrom(), inIt = wayAt(from.c, from.r), gap = gapOf(this.plan);
        const may = (id) => (id === inIt && id !== 'guns') || (id === this.going && (id !== 'guns' || (gap === 'bribe' && w.paid()) || (gap === 'shot' && w.gunQuiet())));
        for (const q of gustPath(h.sea, from, run)) {
            const id = wayAt(q.c, q.r);
            if (id && !may(id))
                return 'way';
        }
        return null;
    }
    /** You've put in a move or dropped a pin: the helm's yours till they're played out (the pilot's own moves let
        go first). */
    take(h) {
        if (!this.on || this.taken)
            return;
        this.taken = true;
        while (h.mine.length)
            h.unput();
    }
}
