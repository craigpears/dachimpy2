/* Pirate Den: Jazzmy's magic carpet ride, a little adventure of its own (14 Nov). TypeScript, compiled to js/den-carpet.js;
   tested in tests/den-carpet.test.ts. js/den/carpet.js draws it, on the real sea, from her own island (den.html?at=carpet).

   The user, 14 Nov, for Jazzmy (a real pirate of the Emerald Ocean; pirate name only), who wanted her name to sound
   like Jasmine: the trend of a rug strapped to a car roof for a magic carpet ride, ending when someone brakes, done
   Puzzle Pirates style. "You have to go pick her up ... she says, 'I want to have an Aladdin-style adventure'"; you're
   dressed as Aladdin "temporarily, at least for the little adventure"; a magic carpet on top of the sloop, down a
   trade wind. "If you go really fast, she has a great time." "I don't want her to have to play the puzzle to see the
   funny part": Space alone (a held button on a phone) leans into the wind, and doing nothing at all still gets you to
   an ending. The name joke is the carpet's: "JASMINE" embroidered on it, crossed out, "Jazzmy" stitched over ("I
   don't think you need a constant correction in the dialogue"); nothing said about it (the user, later: "I don't
   think she'd want the 'my name's not even Jasmine' thing on there. That seems a bit personal").

   Then "we need a bit more of a game": she's running rum to a blockade ("she's got to go pick the [rum] up ... then
   ... from there to the blockade"), so this, the first leg, takes her to Helium's for it. How it plays: her jetty, she
   needs to get to Helium's quick, and the carpet's your idea, not her ask (the user: "like you're the one that comes
   up with the idea ... I don't want her to seem like she's demanding it"); she says yes, you change and lash the
   carpet on, she climbs on. Then the trade wind, laid on the real sea straight down from
   her island (LAY.JAZZMY.RUN), past Tzz's and Kikkit's islands (each calling out): it carries the sloop at its own
   pace (CRUISE), and holding Space leans into it, faster (LEAN) up to MAX; let go and she eases back to the wind's
   pace. Where it runs out, just short of the reef, the sloop stops dead and the carpet flies on at the speed she was
   doing: the flight (src/den-carpet-flight.ts), steered through gusts, and where she comes down is the ending. Her
   lines by how fast you're going (`moodAt`), and a meter of where that launch alone would take her: short of the
   reef, into it, or over it. */
import { ON_HER_JETTY, ON_THE_CARPET, AS_SHE_GOES, IN_THE_AIR, WHERE_SHE_ENDS_UP } from './lines/jazzmy.js';
import { ON_THE_CARPET_RIDE, AS_SHE_SAILS_OFF } from './lines/you.js';
import { WHEN_JAZZMY_LANDS as HELIUM_LANDS } from './lines/helium.js';
import { WHEN_JAZZMY_LANDS as GUARD_LANDS } from './lines/imperial-guards.js';
import { LAY, SAIL } from './den-sail.js';
import { Flight, flyOut, CALLOUTS, REEF_ROW, pointAt } from './den-carpet-flight.js';
const RUN = LAY.JAZZMY.RUN;
export const CARPET = {
    /** Its name, as the bar and the cheats say it. */
    NAME: 'Jazzmy\'s carpet ride',
    /** The trade wind's length, metres: from its first square to its last, where it runs out. */
    LANE: (RUN.r1 - RUN.r0) * SAIL.CELL,
    /** The wind's own pace, m/s, with nobody leaning into it; the most she'll do; how fast leaning picks her up
        (m/s²), and how fast she eases back to the wind's pace once you let go. */
    CRUISE: 4, MAX: 12, LEAN: 3, EASE: 2,
    /** The carpet's height on the sloop, and how far forward of her middle it's lashed. */
    DECK_H: 1.5, RUG_X: 1.3,
    /** Going this fast she's thrilled. */
    THRILL: 9.5,
};
/** Where the carpet takes off from, in the flight's frame: the sloop stopped dead at the wind's end. */
export const LAUNCH_X = CARPET.LANE + CARPET.RUG_X;
/** The sea as the meter sees it: open water, the reef across its row, Helium's island. */
const HELIUM_LAND = new Set(LAY.HELIUM.LAND.map(([c, r]) => `${c},${r}`));
const meterSea = (c, r) => (r === REEF_ROW ? 'rocks' : HELIUM_LAND.has(`${c},${r}`) ? 'helium' : 'sea');
/** Where her launch alone takes her, flown straight on (through whatever gusts are in the way). */
export const straightOn = (v) => flyOut(v, meterSea, () => 0, LAUNCH_X, CARPET.DECK_H).landed.where;
const LABEL = { short: 'Splash', rocks: 'Reef', sea: 'Sea', helium: 'Helium\'s' };
/** The meter's zones, slowest first: where her launch alone would take her, flown straight on (short of the reef,
    into it, the sea, Helium's island, past it), each as wide as its run of speeds. */
export const METER = (() => {
    const out = [];
    for (let v = CARPET.CRUISE; v <= CARPET.MAX + 1e-9; v += 0.05) {
        const id = straightOn(v), last = out[out.length - 1];
        if (last?.id === id)
            last.to = v;
        else
            out.push({ id, label: LABEL[id] ?? id, from: v, to: v });
    }
    for (let i = 0; i + 1 < out.length; i++)
        out[i].to = out[i + 1].from;
    out[out.length - 1].to = CARPET.MAX;
    return out;
})();
/** The slowest launch that gets as far as the reef. */
export const REEF_SPEEDS = { reach: METER.find((z) => z.id !== 'short').from };
/** How she feels at a speed: bored where she'd come down short of the reef, happy on her way, thrilled going fast.
    (Scared is for the air: dropping low.) */
export function moodAt(v) {
    if (v < REEF_SPEEDS.reach)
        return 'bored';
    if (v < CARPET.THRILL)
        return 'happy';
    return 'thrilled';
}
/** Where a speed sits on the meter: 0 at the wind's own pace, where she is with nobody leaning (the user, 14 Nov: "if
    you don't even touch the space bar, it's like 80, 90% of the way through ... It looks a bit weird"), to 1 at the
    most she'll do. */
export const meterAt = (v) => Math.max(0, Math.min(1, (v - CARPET.CRUISE) / (CARPET.MAX - CARPET.CRUISE)));
/** Each ending's title and a few words, on the card after. */
export const ENDINGS = {
    short: { title: 'A gentle paddle', blurb: 'Short of the reef. Lean into the wind with Space next time: she wants to go faster.' },
    rocks: { title: 'Into the rocks', blurb: 'Not quite high enough. Faster, or fly through a gust.' },
    sea: { title: 'A splash', blurb: 'Over the reef and into the sea. Steer through the gusts to keep her up.' },
    helium: { title: 'Rum, collected', blurb: 'Down on Helium\'s island, rum in hand. Just right.' },
    decorum: { title: 'Port Decorum', blurb: 'Over the Empire\'s harbour, and down in it. They weren\'t pleased.' },
    smugglers: { title: 'The smugglers\' beach', blurb: 'Round the back of Port Decorum, where the guards can\'t see. Nobody saw a thing.' },
    race: { title: 'The race course', blurb: 'All the way past the far reef. That\'s a long way for a carpet.' },
    over: { title: 'Off the map', blurb: 'Clean off the edge of the sea. She\'ll turn up.' },
};
/** How long each step that plays by itself lasts (seconds). */
export const SECS = { arrive: 3.5, hello: 3.2, ask: 4.6, idea: 4.6, yes: 2.6, dress: 2.2, lash: 3.6, board: 3, ready: 4, stop: 0.6, down: 2.6, punch: 4.5 };
const ORDER = ['arrive', 'hello', 'ask', 'idea', 'yes', 'dress', 'lash', 'board', 'ready', 'ride', 'stop', 'fly', 'down', 'punch', 'card'];
/** Each step's line, as it starts. */
const SAYS = {
    hello: { who: 'jazzmy', text: ON_HER_JETTY.hello },
    ask: { who: 'jazzmy', text: ON_HER_JETTY.ask },
    idea: { who: 'you', text: ON_THE_CARPET_RIDE },
    yes: { who: 'jazzmy', text: ON_HER_JETTY.yes },
    board: { who: 'jazzmy', text: ON_HER_JETTY.aboard },
};
/** Her lines down the wind: none closer together than this (seconds); the new mood held this long first; bored only
    once she's been bored this long. */
const SAY_GAP = 2.6, SETTLE = 0.5, BORED_AFTER = 3;
/** The ride, from her jetty to the card: see the top of this file. tick(dt, leaning, steer) and skip() return what
    happened. `ground`, the sea she flies over (src/den-carpet-flight.ts's groundOf). */
export class Ride {
    ground;
    phase = 'arrive';
    /** Seconds into this step. */
    t = 0;
    /** How far down the wind she's come (metres), and how fast she's going (m/s). */
    x = 0;
    v = 0;
    /** The carpet in the air, once the wind's run out. */
    flight = null;
    /** Where she came down. */
    result = null;
    /** Her mood as last said, and how long she's been in the one she's in now. */
    said = null;
    mood = 'bored';
    moodT = 0;
    gap = 0;
    nth = {};
    called = new Set();
    low = false;
    /** Ever leaned into the wind this ride? */
    leaned = false;
    constructor(ground = (_c, r) => (r === REEF_ROW ? 'rocks' : 'sea'), start = 'arrive') {
        this.ground = ground;
        this.phase = start;
    }
    /** Its step's line, if it has one, as it starts (the first step's, when the ride's made). */
    opening() { return this.enter(this.phase); }
    /** Her mood just now, by her speed. */
    get feels() { return moodAt(this.v); }
    /** The wind still to go (metres). */
    get left() { return Math.max(0, CARPET.LANE - this.x); }
    line(list, k) { const i = this.nth[k] ?? 0; this.nth[k] = i + 1; return list[i % list.length]; }
    enter(p) {
        this.phase = p;
        this.t = 0;
        const out = [{ kind: 'phase', phase: p }];
        const s = SAYS[p];
        if (s)
            out.push({ kind: 'say', ...s });
        const R = this.result;
        if (p === 'down' && R?.where === 'helium')
            out.push({ kind: 'say', who: 'helium', text: HELIUM_LANDS });
        if (p === 'down' && R?.where === 'decorum')
            out.push({ kind: 'say', who: 'guard', text: GUARD_LANDS });
        if (p === 'punch' && R)
            out.push(R.where === 'over' ? { kind: 'say', who: 'you', text: AS_SHE_SAILS_OFF } : { kind: 'say', who: 'jazzmy', text: WHERE_SHE_ENDS_UP[R.where] });
        return out;
    }
    next() {
        const i = ORDER.indexOf(this.phase);
        return this.enter(ORDER[Math.min(ORDER.length - 1, i + 1)]);
    }
    /** Anyone she's near calling out, once each (the user: "an interaction of like [Kikkit] saying something ... as you
        fly over her"). */
    callouts(x, z) {
        const out = [];
        CALLOUTS.forEach((C, i) => {
            if (this.called.has(i))
                return;
            const p = pointAt(C.at[0], C.at[1]);
            if (Math.hypot(p.x - x, p.z - z) > C.near)
                return;
            this.called.add(i);
            out.push({ kind: 'say', who: C.who, text: C.text, at: C.at });
        });
        return out;
    }
    /** On by `dt` seconds, leaning into the wind or not; once she's up, steering the carpet (-1 left, 0, 1 right) and
        diving (Space held again) or not. */
    tick(dt, leaning, steer = 0, dive = false) {
        const out = [];
        this.t += dt;
        if (this.phase === 'ready') {
            if (leaning || this.t >= SECS.ready)
                out.push(...this.enter('ride'));
            else
                return out;
        }
        if (this.phase === 'ride') {
            if (leaning) {
                this.v = Math.min(CARPET.MAX, this.v + CARPET.LEAN * dt);
                this.leaned = true;
            }
            else if (this.v > CARPET.CRUISE)
                this.v = Math.max(CARPET.CRUISE, this.v - CARPET.EASE * dt);
            else
                this.v = Math.min(CARPET.CRUISE, this.v + CARPET.EASE * dt);
            this.x += this.v * dt;
            out.push(...this.chatter(dt), ...this.callouts(this.x, 0));
            if (this.x >= CARPET.LANE) {
                this.x = CARPET.LANE;
                this.flight = new Flight(LAUNCH_X, CARPET.DECK_H, this.v, this.ground);
                out.push({ kind: 'launch', v: this.v }, ...this.enter('stop'));
                out.push({ kind: 'say', who: 'jazzmy', text: this.v < REEF_SPEEDS.reach ? AS_SHE_GOES.short : AS_SHE_GOES.off });
            }
            return out;
        }
        if ((this.phase === 'stop' || this.phase === 'fly') && this.flight) {
            const F = this.flight;
            for (const e of F.tick(dt, this.phase === 'fly' ? steer : 0, this.phase === 'fly' && dive)) {
                if (e.kind === 'gust') {
                    out.push(e);
                    if (this.gap <= 0) {
                        out.push({ kind: 'say', who: 'jazzmy', text: this.line(IN_THE_AIR.gust, 'gust') });
                        this.gap = 1.5;
                    }
                }
                else {
                    this.result = { ...e.landed, v: this.v };
                    out.push({ kind: 'land', landed: this.result });
                }
            }
            this.gap -= dt;
            out.push(...this.callouts(F.x, F.z));
            // (dropping low, heading down past the reef: once a flight)
            if (!this.low && !F.landed && F.w < -1.5 && F.h < 1.6 && F.x > LAUNCH_X + 6) {
                this.low = true;
                out.push({ kind: 'say', who: 'jazzmy', text: this.line(IN_THE_AIR.low, 'low') });
            }
            if (F.landed) {
                out.push(...this.enter('down'));
                return out;
            }
            if (this.phase === 'stop' && this.t >= SECS.stop)
                out.push(...this.next());
            return out;
        }
        const secs = SECS[this.phase];
        if (secs !== undefined && this.t >= secs)
            out.push(...this.next());
        return out;
    }
    /** Her lines down the wind, as her mood changes. */
    chatter(dt) {
        const m = moodAt(this.v);
        if (m !== this.mood) {
            this.mood = m;
            this.moodT = 0;
        }
        this.moodT += dt;
        this.gap -= dt;
        const wait = m === 'bored' ? BORED_AFTER : SETTLE;
        if (m === this.said || this.gap > 0 || this.moodT < wait)
            return [];
        this.said = m;
        this.gap = SAY_GAP;
        return [{ kind: 'say', who: 'jazzmy', text: this.line(ON_THE_CARPET[m], m) }];
    }
    /** Space (or the button) on a step that plays by itself: on to the next. Leaning starts the ride from `ready`;
        nothing skips the ride or the flight. */
    skip() {
        if (['ride', 'stop', 'fly', 'card'].includes(this.phase))
            return [];
        if (this.phase === 'ready')
            return this.enter('ride');
        return this.next();
    }
    /** Again, from her jetty, already dressed and the carpet on: back to `board`. */
    again() {
        Object.assign(this, { x: 0, v: 0, flight: null, result: null, said: null, mood: 'bored', moodT: 0, gap: 0, leaned: false, low: false });
        this.called.clear();
        return this.enter('board');
    }
}
/** What you wear for it, for this adventure only (the user: "you have to get your pirate's clothes temporarily, at
    least for the little adventure"): a fez, a vest over a shirt, a sash, patched trousers, bare feet and a monkey on
    your shoulder; your own body, skin, hair and face kept. Our own colours, not the film's. (The wardrobe drops what a
    body can't wear: a capybara has no trousers.) */
export const OUTFIT = {
    hat: 'fez', hatCol: 'red', top: 'vest', topCol: 'plum', topCol2: 'cream', waist: 'sash', waistCol: 'pumpkin',
    legs: 'patched', legsCol: 'cream', legsCol2: 'tan', feet: 'bare', hand: 'none', fam: 'monkey', famCol: 'brown',
};
/** You, dressed for it. */
export const dressedForIt = (look) => ({ ...look, ...OUTFIT });
