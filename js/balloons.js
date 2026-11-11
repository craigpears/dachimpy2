/* Balloon animals: Sailing's pieces twisted out of balloons, squeak by squeak, and played onto a real
   Sailing board till they pop. TypeScript, compiled to js/balloons.js; tested in tests/balloons.test.ts.
   It knows nothing of who's twisting them or where: js/den/balloons.js shows it in any pair of hands
   beside a board drawn as the den's own Sailing board (js/den/sail-board.js), and an island's config
   says who, and what they say as they go (src/den-tzz.ts: Tzz's lesson).

   The user (11 Nov), of Tzz: "she's literally got a balloon and starts twisting it, like the same as
   you're making a balloon animal, but she ends up ... twisting it into sailing pieces and then pops
   [it] ... It just makes sense of like, well, how on earth do these sailing pieces pop in the puzzle?
   It makes sense. They're balloon animals." And "the humour is the layer on top, but there's a
   genuine mechanic underneath" (RULES.md). Then, seeing a first go (11 Nov): "it's not really a real
   looking sailing board, it's just things stacked on each other, so it needs to be ... closer to the
   actual tutorial idea. She's helping you ... how to build doubles and bingos and things."

   So it's the real puzzle (src/sailing.ts), on its real board: a routine lays out some platforms, then
   each twist is a pair that comes in at the top of the middle columns and is steered down to where it
   comes to rest, a move at a time (route: a column across, a turn, a row down, the moves a player makes,
   each one Sailing's own), and dropped there by the rules. Nothing clears as it's built; the last
   twist's landing sets off a real chain, popped by the board as any chain is.

   The routines (ROUTINES) are staircases: ledges one over the other down the board's left-hand side,
   each wanting a colour in its top square, a balloon on each ledge's floor the colour the ledge below
   wants (its other half hanging beside it by its peg). Fill the top ledge and it pops; the balloon it
   held drops into the next ledge down, which pops, and so on down: a chain as long as the stair is high.
   Platforms clear last (the user's memory of the real game, src/sailing.ts), so each ledge's pop is a
   step of its own. Two ledges a Double ("and that's what zooms you over a whirlpool"), four a Bingo,
   six a Vegas.

   A show (BalloonShow) plays acts, each a routine and what's said as it goes: a line to start, a line
   as each twist's twisted, and one once it's popped. Its clock gives each beat its time (long enough
   to read its line; a twist slow enough to see each balloon blown up and twisted off, the user: "it
   goes really quickly in her hand ... like, what is she doing? Fiddling around some Play-Doh"), and
   says what's happening: a squeak as each balloon's twisted off, the pair tossed onto the board, the
   pair falling, landing, and the chain going off. */
import { Sailing, SPAWN, chainName } from './sailing.js';
/** A staircase of ledges one over the other down the board's left-hand side: platforms two by two
    (the smallest Sailing has: src/sailing.ts, PLATFORM), each with two targets, its floor's left square
    (`floor[k]`, bottom ledge first) and a gap at its top right (`slot[k]`); its floor's right square no
    target, holding a balloon the colour of the slot below, under the slot. Each ledge is built by one
    pair across its floor, slid in under the ledge above (its two halves pegged: the target's, and the
    one for the ledge below); then the top ledge's slot is filled by a pair across its top, `last` beside
    the colour it wants: it pops, the balloon under its slot drops into the slot below, that ledge pops,
    and so on down. n ledges, a chain of n. */
export function staircase(slot, floor, last) {
    const n = slot.length, platforms = [], twists = [];
    for (let k = 0; k < n; k++) {
        const a = 14 - 2 * k, b = a + 1;
        platforms.push({ id: 1000 + k, r: a, c: 0, w: 2, h: 2, targets: [{ r: a, c: 1, colour: slot[k] }, { r: b, c: 0, colour: floor[k] }] });
        // (the bottom ledge's spare balloon drops into nothing, so it's any colour but its own slot's)
        twists.push({ pair: [floor[k], k ? slot[k - 1] : (slot[0] + 1) % 3], col: 0, turn: 0, row: b });
    }
    twists.push({ pair: [last, slot[n - 1]], col: 0, turn: 0, row: 14 - 2 * (n - 1) });
    // (and one more platform off to the right, two by three, as a real board has more than its stair:
    // so the stair's chain is the chain, and the board isn't cleared and dealt afresh under it)
    platforms.push({ id: 999, r: 11, c: 5, w: 2, h: 3, targets: [11, 12, 13].flatMap((r, i) => [5, 6].map((c, j) => ({ r, c, colour: (i + j + n) % 3 }))) });
    return { platforms, twists };
}
export const ROUTINES = {
    /** Two ledges, three twists: a Double. */
    double: staircase([1, 2], [0, 1], 2),
    /** Four ledges, five twists: a Bingo! */
    bingo: staircase([2, 0, 1, 2], [1, 2, 0, 1], 0),
    /** Six ledges, seven twists: a Vegas!! */
    vegas: staircase([1, 2, 0, 1, 2, 0], [0, 1, 2, 0, 1, 2], 2),
};
/** A game laid out for a routine: its platforms, an empty board, its first pair coming in. */
export function layout(routine) {
    const g = new Sailing(() => 0, false);
    g.lay(g.grid, routine.platforms.map((p) => ({ ...p, targets: p.targets.map((t) => ({ ...t })) })));
    if (routine.twists.length)
        g.pair = [routine.twists[0].pair[0], routine.twists[0].pair[1]];
    return g;
}
/** The board after the routine's first `n` twists, each dropped where it comes to rest by the rules
    (her setup, before your turn: and again, as it was, if you miss). */
export function setup(routine, n) {
    const g = layout(routine);
    routine.twists.slice(0, n).forEach((t, i) => {
        g.pair = [t.pair[0], t.pair[1]];
        if (!g.drop(t.col, t.turn, t.row).dropped)
            throw new Error(`twist ${i} can't come to rest at row ${t.row}, column ${t.col}`);
    });
    const next = routine.twists[n] ?? routine.twists[routine.twists.length - 1];
    g.pair = [next.pair[0], next.pair[1]];
    return g;
}
/** The moves that steer the game's pair from where it comes in (the top of the middle columns, turned
    0) down to where the twist comes to rest, fewest first, each one a move the rules allow (Sailing's
    own open() and sinks(), as moves() searches); null if it can't get there. */
export function route(g, t) {
    const start = [0, SPAWN[0], 0];
    if (!g.open(...start))
        return null;
    const id = (r, c, u) => `${r},${c},${u}`;
    const from = new Map([[id(...start), null]]);
    const todo = [start];
    while (todo.length) {
        const [r, c, u] = todo.shift();
        if (r === t.row && c === t.col && u === t.turn && !g.sinks(r, c, u)) {
            const out = [];
            for (let k = id(r, c, u); from.get(k); k = from.get(k)[0])
                out.unshift(from.get(k)[1]);
            return out;
        }
        const next = [
            [r, c - 1, u, 'left'], [r, c + 1, u, 'right'], [r, c, ((u + 1) % 4), 'turnR'], [r, c, ((u + 3) % 4), 'turnL'],
        ];
        if (g.sinks(r, c, u))
            next.unshift([r + 1, c, u, 'down']);
        for (const [nr, nc, nu, step] of next) {
            const k = id(nr, nc, nu);
            if (from.has(k) || !g.open(nr, nc, nu))
                continue;
            from.set(k, [id(r, c, u), step]);
            todo.push([nr, nc, nu]);
        }
    }
    return null;
}
/** A routine, played by Sailing's rules, as a player would: each twist steered down its route and
    dropped where it comes to rest. What each drop earned, the routes, and the pieces cleared before the
    last twist (a fair show clears none). Throws if a twist can't be got where it says. */
export function perform(routine) {
    const g = layout(routine), routes = [];
    let early = 0, steps = 0, name = '';
    routine.twists.forEach((t, i) => {
        g.pair = [t.pair[0], t.pair[1]];
        const way = route(g, t);
        if (!way)
            throw new Error(`twist ${i} can't be steered to row ${t.row}, column ${t.col}`);
        routes.push(way);
        const res = g.drop(t.col, t.turn, t.row);
        if (i < routine.twists.length - 1)
            early += res.cleared;
        else
            ({ steps, name } = res);
    });
    return { routes, steps, name, early, game: g };
}
/** Seconds: a line to start; a twist in hand (the first balloon blown up and twisted off, squeak; the
    second, squeak; pegged together and tossed onto the board: SQUEAKS and TOSS are its fractions); a move
    of the pair steered down the board; your turn's line (then it waits for you); the chain once it's
    going (the board plays it: a show waits while it does); after it's popped. A beat with a line is at
    least as long as its line takes to read. HELP: misses before she shows you how after all. */
export const SHOW = { START: 2.6, TWIST: 3.2, SQUEAKS: [0.34, 0.68], TOSS: 0.82, STEP: 0.07, LAND: 0.35, YOURS: 2.4, POP: 0.6, AFTER: 3, HELP: 3 };
/** A show's beats, end to end; `secs(text)` how long a line takes to read. */
export function beats(acts, secs) {
    const out = [];
    let t = 0;
    const add = (act, kind, i, base, line) => {
        const s = Math.max(base, line ? secs(line) : 0);
        out.push({ act, kind, i, t0: t, secs: s, ...(line ? { line } : {}) });
        t += s;
    };
    acts.forEach((a, k) => {
        const S = a.says ?? {}, P = perform(a.routine), n = a.routine.twists.length, hers = a.you ? n - 1 : n;
        add(k, 'start', 0, S.start ? SHOW.START : 0.4, S.start);
        for (let i = 0; i < hers; i++) {
            add(k, 'twist', i, SHOW.TWIST, S.twists?.[i]);
            add(k, 'fall', i, P.routes[i].length * SHOW.STEP + SHOW.LAND);
        }
        if (a.you)
            add(k, 'yours', n - 1, SHOW.YOURS, S.yours);
        add(k, 'pop', 0, P.steps * SHOW.POP);
        add(k, 'after', 0, SHOW.AFTER, S.popped);
    });
    return out;
}
/** A show, played: see the top of this file. On your turn its clock holds at the end of the beat till
    your pair lands (played): set off the chain she built and on it goes; anything else, and she has
    you try again (the board as she left it: setup), and after HELP misses shows you how. */
export class BalloonShow {
    acts;
    beats;
    shows;
    /** Seconds in. */
    t = 0;
    /** Your misses this act. */
    misses = 0;
    /** It's said it's done. */
    over = false;
    sent = new Set();
    /** Your turns that are over (your pair set it off, or she showed you), by beat. */
    through = new Set();
    constructor(acts, secs) {
        this.acts = acts;
        this.shows = acts.map((a) => perform(a.routine));
        this.beats = beats(acts, secs);
    }
    /** How long it all takes (not counting waiting for you, or for the board). */
    get length() { const b = this.beats[this.beats.length - 1]; return b ? b.t0 + b.secs : 0; }
    get done() { return this.t >= this.length; }
    /** The beat on now (the last, once it's done). */
    beat() { return this.beats[this.index()]; }
    index() { let i = 0; while (i + 1 < this.beats.length && this.beats[i + 1].t0 <= this.t)
        i++; return i; }
    /** It's your turn: your pair's to drop. */
    get yours() { const n = this.index(), b = this.beats[n]; return b.kind === 'yours' && !this.through.has(n); }
    /** Time going by: what happened. `wait`: the board's still playing a chain out, so the show holds at
        the end of its pop beat till it's done. And on your turn it holds till you've dropped. */
    tick(dt, wait = false) {
        if (this.over)
            return [];
        const n0 = this.index(), b0 = this.beats[n0];
        const hold = (b0.kind === 'pop' && wait) || (b0.kind === 'yours' && !this.through.has(n0));
        this.t = Math.min(this.length, hold ? Math.min(this.t + dt, b0.t0 + b0.secs - 1e-6) : this.t + dt);
        const out = [];
        this.beats.forEach((b, n) => {
            // (each thing once, as its moment comes: in order, however big the step)
            const once = (key, at, e) => {
                const k = `${n}:${key}`;
                if (this.sent.has(k) || this.t < b.t0 + at)
                    return;
                this.sent.add(k);
                out.push(e);
            };
            if (n === 0 || b.act !== this.beats[n - 1].act) {
                if (this.t >= b.t0 && !this.sent.has(`${n}:act`))
                    this.misses = 0;
                once('act', 0, { kind: 'act', act: b.act });
            }
            if (b.line)
                once('line', 0, { kind: 'line', text: b.line, secs: b.secs });
            if (b.kind === 'twist') {
                const pair = this.acts[b.act].routine.twists[b.i].pair;
                once('s0', b.secs * SHOW.SQUEAKS[0], { kind: 'squeak', colour: pair[0], half: 0 });
                once('s1', b.secs * SHOW.SQUEAKS[1], { kind: 'squeak', colour: pair[1], half: 1 });
                once('toss', b.secs * SHOW.TOSS, { kind: 'toss', act: b.act, twist: b.i });
            }
            if (b.kind === 'fall') {
                once('fall', 0, { kind: 'fall', act: b.act, twist: b.i, route: this.shows[b.act].routes[b.i] });
                once('land', b.secs - SHOW.LAND * 0.5, { kind: 'land', act: b.act, twist: b.i });
            }
            if (b.kind === 'yours')
                once('yours', 0, { kind: 'yours', act: b.act, twist: b.i });
        });
        if (this.done) {
            this.over = true;
            out.push({ kind: 'done' });
        }
        return out;
    }
    /** Your pair's landed, setting off a chain of `steps`: 'hit' if that's the one she built (on it goes),
        'miss' if not (she has you try again: her line for it, `again` in turn), or 'help' once you've
        missed HELP times (she shows you, her pair falling down its route, and on it goes). Null if it
        isn't your turn. */
    played(steps) {
        if (!this.yours)
            return null;
        const n = this.index(), b = this.beats[n], want = this.shows[b.act].steps;
        if (steps >= want) {
            this.through.add(n);
            return { result: 'hit', events: [] };
        }
        this.misses++;
        const S = this.acts[b.act].says ?? {}, again = S.again ?? [], events = [{ kind: 'again', act: b.act, misses: this.misses }];
        if (this.misses >= SHOW.HELP) {
            this.through.add(n);
            if (S.help)
                events.push({ kind: 'line', text: S.help, secs: SHOW.YOURS * 1.5 });
            events.push({ kind: 'fall', act: b.act, twist: b.i, route: this.shows[b.act].routes[b.i] });
            return { result: 'help', events };
        }
        if (again.length)
            events.push({ kind: 'line', text: again[(this.misses - 1) % again.length], secs: SHOW.YOURS * 1.5 });
        return { result: 'miss', events };
    }
    /** On to the next beat now (Space): never past your turn. */
    skip() {
        if (this.yours)
            return [];
        const n = this.index(), next = this.beats[n + 1];
        return this.tick((next ? next.t0 : this.length) - this.t);
    }
    /** What's shown now: the act, the beat and how far into it (0 to 1), and the twist in hand (its pair,
        and how far it's twisted, 0 to 1) if one is. */
    now() {
        const b = this.beat(), u = b.secs ? Math.min(1, (this.t - b.t0) / b.secs) : 1;
        const twisting = b.kind === 'twist' ? { i: b.i, pair: this.acts[b.act].routine.twists[b.i].pair, u } : null;
        return { act: b.act, beat: b, u, twisting };
    }
}
export { chainName };
