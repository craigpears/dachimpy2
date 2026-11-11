/* Pirate Den: someone standing about talking, what they say and when, for anyone anywhere. TypeScript,
   compiled to js/chatter.js; tested in tests/chatter.test.ts. js/den/props-people.js's person() says
   its lines with it (Kikkit on her island, Gravee in her house), knowing nothing of who's talking.

   The user (11 Nov), of Kikkit: "It's a pirate with a configurable loop of text", and "Kikkit should
   just be a bit of config ... this is what her lines are. But then it should be using ... some generic
   pirate talking". So a character's talk is a Script, plain data: lines said once first (an intro, a
   ramble), then a list round and round for ever (in turn or at random), the intro told again after
   each time round if it says so, and lines slotted in by name when something happens (an aside: Kikkit
   when you're spat back). A Chatter plays one: a line up for as long as it takes to read, a pause
   between if it has one, only while you're within earshot (out of it, it finishes its line and stops;
   come back and it carries on where it was), Space on to the next. */
/** Someone's talk, played: see the top of this file. */
export class Chatter {
    script;
    pace;
    /** It's begun (start): it says its script while you're within earshot. */
    started = false;
    /** The line up just now, if any. */
    line = null;
    /** Its intro's been told through, all of it, at least once (it's on to its loop). */
    told = false;
    phase = 'intro';
    i = 0;
    wait;
    asideAt = {};
    rand;
    constructor(script, pace) {
        this.script = script;
        this.pace = pace;
        this.wait = pace.wait ?? 0;
        this.rand = pace.rand ?? Math.random;
    }
    /** Begins its script (its first line comes on the next tick within earshot). False if it already had. */
    start() {
        if (this.started)
            return false;
        this.started = true;
        return true;
    }
    /** The script's next line, moving on: the intro's, then the loop's, for ever (null when there's
        nothing more: an intro alone, said). Just the order: nothing's said. */
    next() {
        const S = this.script, intro = S.intro ?? [], loop = S.loop ?? [];
        if (this.phase === 'intro') {
            if (this.i < intro.length)
                return intro[this.i++];
            this.phase = 'loop';
            this.i = 0;
            this.told = true;
        }
        if (!loop.length)
            return null;
        if (S.random)
            return loop[Math.floor(this.rand() * loop.length)];
        if (this.i >= loop.length) {
            this.i = 0;
            if (S.retell && intro.length) {
                this.phase = 'intro';
                return this.next();
            }
        }
        return loop[this.i++];
    }
    /** Each tick: its line up a while, then (within earshot: `near`) after the pause, the next. The text of
        a line begun this tick, or null. */
    tick(dt, near = true) {
        if (this.line) {
            if ((this.line.t += dt) < this.line.secs)
                return null;
            this.line = null;
            this.wait = this.gap();
        }
        if (!this.started || !near)
            return null; // (out of earshot: its line finished, it stops there)
        if ((this.wait -= dt) > 0)
            return null;
        // (its intro's just been told through, the first time: a quiet beat, if it's to have one)
        const intro = this.script.intro ?? [];
        if (!this.told && this.phase === 'intro' && intro.length && this.i >= intro.length) {
            this.told = true;
            if ((this.wait = this.script.afterIntro ?? 0) > 0)
                return null;
        }
        return this.say(this.next());
    }
    /** Space: on to its next line now if it's talking (no pause), else (begun) its next line. Null if it's
        nothing to say. */
    hail() {
        if (!this.started && !this.line) {
            this.start();
            return this.say(this.next());
        }
        this.line = null;
        return this.started ? this.say(this.next()) : null;
    }
    /** Something's happened: the next of its lines for it (Script.asides), said now over whatever it was
        saying; then it carries on where it was. Null if it has none by that name. */
    aside(name) {
        const list = this.script.asides?.[name];
        if (!list?.length)
            return null;
        const k = this.asideAt[name] ?? 0;
        this.asideAt[name] = k + 1;
        return this.say(list[k % list.length]);
    }
    /** Says this now, over whatever it was saying (or, null, stops). */
    say(text) {
        this.line = text ? { text, t: 0, secs: this.pace.secs(text) } : null;
        return text;
    }
    /** Stops talking just now (where it is in its script is kept). */
    hush() { this.line = null; this.wait = this.gap(); }
    gap() {
        const g = this.pace.gap ?? 0;
        return typeof g === 'number' ? g : g[0] + this.rand() * (g[1] - g[0]);
    }
}
export class Voices {
    all = new Map();
    /** A talker, by name, standing there. */
    add(name, v) { this.all.set(name, v); }
    /** Whom you hear from (c, r): the nearest within its earshot, or null. */
    heard(c, r) {
        let best = null, d0 = Infinity;
        for (const [name, v] of this.all) {
            const d = Math.hypot(c - v.c, r - v.r);
            if (d <= v.earshot && d < d0) {
                best = name;
                d0 = d;
            }
        }
        return best;
    }
    /** Does `name` reach you at (c, r)? (Within its earshot, and nobody nearer.) A talker nobody's
        added is heard by its own earshot alone. */
    hears(name, c, r) { return !this.all.has(name) || this.heard(c, r) === name; }
}
