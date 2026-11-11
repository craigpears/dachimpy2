/* Pirate Den: modelling looks, for anyone anywhere. TypeScript, compiled to js/showcase.js; tested in
   tests/showcase.test.ts. js/den/showcase.js draws it: a pirate in a scene going through a list of
   looks, changing into each with a twirl (a spin with a little hop), its title in a bubble.

   The user (11 Nov), of Mischievious modelling her looks at her wedding: "that definitely needs to be a
   generic module so that you can just ... go through someone like as a wardrobe furniture kind of thing
   that you can just like cycle and demo some outfits ... incredibly reusable." So which look is up, how
   long each lasts, going on to the next, back or straight to one, the twirl's timing, and swapping a
   piece (a familiar, a hat) on any look are here, knowing nothing of the wedding, the wardrobe's items or
   three.js. A scene hands it the looks; the wedding is only one place that does. */
/** How long each look's up (seconds) as they're gone through, and its title's bubble (a shade less, so
    the next one's bubble is its own). */
export const SHOW = { HOLD: 2.9, TITLE: 2.8 };
/** The twirl on changing into a look: a whole turn round in SECS seconds, hopping up to HOP metres
    halfway. */
export const TWIRL = { SECS: 0.8, HOP: 0.12 };
/** The twirl `left` seconds before it's done: how far round (radians, on top of where they face) and
    how high off the ground (metres). Done (left 0 or less), neither. */
export function twirlAt(left) {
    if (!(left > 0))
        return { turn: 0, hop: 0 };
    const k = Math.min(1, left / TWIRL.SECS);
    return { turn: (1 - k) * Math.PI * 2, hop: k < 1 ? Math.sin(k * Math.PI) * TWIRL.HOP : 0 };
}
/** The title as it's said, in its bubble. */
export const titled = (m) => `"${m.title}"`;
/** Going through `count` looks: which is up (i), for how long it's been (t), and how many have been
    shown since it started (n). Once round from wherever it started, then it stops on the last
    (`loop`: round and round for ever). Each change is a new look up: tick() says when. */
export class Showcase {
    count;
    hold;
    loop;
    i = 0;
    t = 0;
    n = 0;
    on = false;
    constructor(count, hold = SHOW.HOLD, loop = false) {
        this.count = count;
        this.hold = hold;
        this.loop = loop;
    }
    at(i) { const c = Math.max(1, this.count); return ((Math.trunc(i) % c) + c) % c; }
    /** Starts going through them from the i-th (wrapped round into the list). */
    start(i = 0) { this.on = this.count > 0; this.i = this.at(i); this.t = 0; this.n = 0; }
    /** Stops where it is. */
    stop() { this.on = false; }
    /** Straight to the i-th, the clock on it from the start (still going through them, if it was). */
    pick(i) { this.i = this.at(i); this.t = 0; }
    /** On to the next one now. */
    next() { this.pick(this.i + 1); }
    /** Back to the one before now. */
    prev() { this.pick(this.i - 1); }
    /** Time passing: 'next' when it's gone on to the next look (now `i`), 'done' when it's been round them
        all and stopped, else null. */
    tick(dt) {
        if (!this.on || (this.t += dt) <= this.hold)
            return null;
        this.t = 0;
        this.n++;
        if (!this.loop && this.n >= this.count) {
            this.on = false;
            return 'done';
        }
        this.i = this.at(this.i + 1);
        return 'next';
    }
}
/** A look with some of its pieces swapped (`over`: slot to item id, a familiar or a hat, say), each swapped
    piece in the colours (slot + "Col", "Col2") another of `looks` wears it in, else with them left off
    for the wardrobe's own. A slot left out of `over` (or undefined) stays as it was. */
export function restyle(look, over, looks = []) {
    const out = { ...look };
    for (const [slot, id] of Object.entries(over)) {
        if (id === undefined || id === look[slot])
            continue;
        const cols = [`${slot}Col`, `${slot}Col2`];
        const from = looks.find((l) => l[slot] === id);
        out[slot] = id;
        for (const c of cols) {
            if (from && from[c] !== undefined)
                out[c] = from[c];
            else
                delete out[c];
        }
    }
    return out;
}
/** The choices for one slot, in the order offered: what the look has already (`own`, or none), then
    those to put first (`first`), then the rest of `all`, then none last. Each once, and only `all`'s. */
export function choices(own, all, first = [], none = 'none') {
    const out = [];
    const add = (id) => { if (id !== undefined && all.includes(id) && !out.includes(id))
        out.push(id); };
    add(own ?? none);
    first.forEach(add);
    all.filter((id) => id !== none).forEach(add);
    add(none);
    return out;
}
