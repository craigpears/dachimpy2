/* Pirate Den: the Sailing puzzle played at sea, and what its chains do to her (TODO.md, "The Sailing
   puzzle, for Kikkit's quest", 10 Nov: "You should be able to jump into the sailing puzzle whenever
   you want to, and that gives you, like the doubles ... it allows you to basically go really, really
   fast, and like in one go, like a trade winds, kind of, just jump multiple tiles"). TypeScript,
   compiled to js/den-sailing.js; tested in tests/den-sailing.test.ts. The puzzle is src/sailing.ts
   (its run, runFor, is what a drop's chain is worth in squares); js/den/sail-station.js plays it.

   A drop's run carries her that many squares straight ahead, the way she's heading, in one go: a
   gust, played as the trade winds play their squares (Helm.gust: SAIL.PUSH seconds a square), after
   the move she's on. She stops short of anything her other moves are stopped by (rocks, the cliffs,
   land, off the board) and of a lock (its gates are shut to a gust; she goes up and down the canal
   by its locks), of water at another level (the canal above the sea), and of the imperial
   checkpoint's gate: getting past it is meant to be work, so no gust blows her through it. Ending on
   a trade wind's lane, the wind takes her on from there.

   And of the way through the whirlpools (Sea.passage: Kikkit's whirlpools, their winds, the gap in
   the reef), unless she starts the gust at one of its mouths, facing into it (Sea.mouths). The user
   (11 Nov), sailing with the board open by Tzz's island: "somehow I have ended up over near Dignity
   ... I don't know how I managed to just make a mishap near the Whirlpools. Something got clipped",
   and "this is supposed to be a secret way round". A chain heading out to sea past Kikkit's island
   had carried her over the winds that feed the whirlpools, through the reef with them, and out the
   other side. Now the whirlpools are a way through only when you sail into them on purpose: up to
   the mouth, then the chain (as Kikkit tells it), or your own moves onto their winds. */
import { LAY, path } from './den-sail.js';
import { chainName, runFor, RUN } from './sailing.js';
/** The squares a gust of `n` takes her, from `from` straight ahead, a pose each; short of the first
    square she can't go to (and none if it's the first). */
export function gustPath(sea, from, n) {
    const out = [], K = LAY.CHECKPOINT, level = sea.level(from.c, from.r);
    if (sea.isLock(from.c, from.r))
        return out;
    const key = (c, r) => `${c},${r}`;
    // (on purpose: from a mouth of the way through the whirlpools, facing into it, or in it already)
    const meant = sea.passage.has(key(from.c, from.r)) || sea.mouths.some((m) => m.c === from.c && m.r === from.r && m.d === from.d);
    let at = from;
    for (let i = 0; i < n; i++) {
        const to = path(at, 'F').to, whirl = sea.whirlAt(to.c, to.r), pocket = sea.pockets.has(key(to.c, to.r));
        if (!meant && (sea.passage.has(key(to.c, to.r)) || sea.reef.has(key(to.c, to.r))))
            break;
        // (Into the way through on purpose: a gust carries her clean over its whirlpools, as the token
        // moves do in Puzzle Pirates, and they have her only if it ends on one (src/den-whirl.ts). And into
        // the penguins' water, but only a Vegas's: src/den-kikkit.ts)
        if (!whirl && !pocket && (!sea.open(to.c, to.r) || sea.isLock(to.c, to.r) || sea.level(to.c, to.r) !== level))
            break;
        if (pocket && n < runFor(RUN.VEGAS))
            break;
        if (to.c === K.GATE && to.r === K.ROW && sea.works.size)
            break;
        out.push(to);
        at = to;
    }
    return out;
}
/** A drop's run, given to her: a gust of that many squares straight ahead (gustPath), from where
    she'll be once the move she's on (and any gust already blowing) is done. */
export function carry(h, run) {
    if (run <= 0)
        return { run, went: 0, why: null, squares: [] };
    if (!h.gusty())
        return { run, went: 0, why: 'held', squares: [] };
    const squares = gustPath(h.sea, h.gustFrom(), run);
    h.gust(squares);
    return { run, went: squares.length, why: squares.length < run ? 'short' : null, squares };
}
const squares = (n) => (n === 1 ? 'a square' : `${n} squares`);
/** What's said of a drop's run: its chain by name, and how far the wind carried her. */
export function carrySay(steps, c) {
    const name = chainName(steps).replace(/!+$/, '');
    const what = name ? `A ${name}!` : 'A clear!';
    if (c.why === 'held')
        return `${what} But she's held up: no wind can carry her just now`;
    if (!c.went)
        return `${what} But there's no sea ahead of her to run`;
    if (c.why === 'short')
        return `${what} The wind carries her ${squares(c.went)}, as far as she can go`;
    return `${what} The wind carries her ${squares(c.went)}`;
}
/* Doing well shows, as it does in Puzzle Pirates (the user, 11 Nov, "very important"): a sparkly
   indicator, and sparkly full sails. The bigger the chain the more show: a Double a little glitter on
   her sails, a Vegas her sails billowing full with sparkles streaming off them and a whoosh. It lasts
   a while after the chain, while the gust carries her and a few seconds more, then fades. And on the
   board a sparkle meter fills with how well you're sailing: each chain adds to it, more for a bigger
   one, a booch knocks most of it out, and it drains slowly with time, so it shows how you've been
   sailing lately. js/den/sail-station.js draws it, on her (js/den/sea.js's sails) and the board. */
export const SPARKLE = {
    /** The show a chain puts on, by its steps: none for a plain clear, a little glitter for a Double,
        everything for a Vegas. */
    BY_STEPS: [0, 0, 0.25, 0.45, 0.62, 0.8, 1],
    /** Seconds it stays at its height after the gust's spent, then the seconds it takes to fade away. */
    HOLD: 3,
    FADE: 5,
    /** The show at which her sails billow full and the whoosh goes off (a Vegas). */
    FULL: 1,
    /** What a chain adds to the meter, by its steps (a plain clear a sliver), and the meter's drain a
        second; a booch keeps this much of it. */
    METER_BY_STEPS: [0, 0.02, 0.1, 0.18, 0.26, 0.34, 0.45],
    METER_DRAIN: 1 / 90,
    BOOCH_KEEPS: 0.3,
};
const bySteps = (t, steps) => t[Math.max(0, Math.min(t.length - 1, Math.floor(steps)))];
/** The show a chain of `steps` puts on (0 to 1). */
export const sparkleFor = (steps) => bySteps(SPARKLE.BY_STEPS, steps);
/** The sparkle: the show on her now, and the meter of how well you're sailing. */
export class Sparkle {
    /** The show on her sails now, 0 to 1. */
    level = 0;
    /** The meter, 0 to 1. */
    meter = 0;
    /** Seconds before the show starts to fade. */
    hold = 0;
    /** A drop's chain (`steps`), and the squares its gust carries her (`went`): the show goes up to
        the chain's, if that's more, and holds while the gust blows, a square every `push` seconds. */
    chain(steps, went = 0, push = 0.28) {
        const s = sparkleFor(steps);
        if (s > 0) {
            this.level = Math.max(this.level, s);
            this.hold = Math.max(this.hold, went * push + SPARKLE.HOLD);
        }
        this.meter = Math.min(1, this.meter + bySteps(SPARKLE.METER_BY_STEPS, steps));
    }
    /** A booch: the show's gone, and most of the meter. */
    booch() { this.level = 0; this.hold = 0; this.meter *= SPARKLE.BOOCH_KEEPS; }
    /** Time going by: the show holds, then fades; the meter drains. */
    tick(dt) {
        const held = Math.min(dt, this.hold);
        this.hold -= held;
        this.level = Math.max(0, this.level - (dt - held) / SPARKLE.FADE);
        this.meter = Math.max(0, this.meter - dt * SPARKLE.METER_DRAIN);
    }
    /** Her sails billowing full (a Vegas's show, while it lasts). */
    full() { return this.level >= SPARKLE.FULL - 1e-9; }
}
