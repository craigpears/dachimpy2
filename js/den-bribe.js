/* Pirate Den: the sloop race's bribe at the gate. TypeScript, compiled to js/den-bribe.js; tested in
   tests/den-bribe.test.ts. js/den/race-bribe.js draws it (the wreck in its notch, the gun gap's gatehouse
   in the Empire's look, its guard) and plays it at sea; its squares are LAY.RACE.BRIBE in src/den-sail.ts,
   what the guard says src/lines/gate-guard.ts. The race simulated with it is src/race-sim.ts (the 'bribe'
   route, and 'every').

   The user (12 Nov): "I can imagine you having treasure haul, and one of the shortcuts is then bribe, yeah,
   you can then use the treasure that you hold up to bribe somebody at a gate to get through", "maybe to
   keep it from being too overly busy in a course", and, agreeing it: "build the bribe gate ... I just want
   all the ideas in there ... to show how many different ways you have of really getting through the
   course." So (RACE.md §3):
   - The gun gap on the first spit is an imperial gate: its two guns trained on the way through, as ever,
     and a guard at its gatehouse. Its ways through: shoot its guns quiet, or run it and be holed (by both its
     guns since 13 Nov; rushing it on a heavy combo went the same day), and a third: pay the guard, and the gate lets her
     through: its guns hold their fire on her (src/den-race.ts, GunGap: ticked with no ship to fire on) and
     his men warp her through on the gate's line (towPath), out of the gatehouse's light airs and out of
     anyone's reach while she's towed, as a gust carries her. Without the tow she'd ghost through the light
     airs as slowly as running it, and the bribe would never be worth its haul (src/race-sim.ts).
   - Since 13 Nov (an experiment: RACE.md §3, "The gate across the fort's bay") the gate's through the Empire's
     fort at the root of a mole across a bay in spit 1, by the bend past leg 1's end: the long way goes right
     round the bay, the gate cuts straight through to buoy 1 on its far side. So it saves a lot, and the price
     is a bigger haul.
   - The money's apart from the gate: an old wreck run aground at the back of a notch off leg 1, on the way to
     the gate from wherever the field comes down onto the leg (13 Nov: where most of it comes down by the
     start's hop; it was five columns before that, out of sailing's reach from most of the line), where she lies to haul up its
     coins by Treasure Haul (src/treasure-haul.ts, the real puzzle; the board laid on the water beside her, as
     at the den's other wrecks). Every racer goes for its coins before the gate, wherever it lies
     (src/race-plan.ts, goalOf). The notch is sheltered (as the barrier's and the crane's are:
     src/den-racers.ts, SHELTER; the gate's guns never fire into it either), so a leader can do her puzzling
     there in safety and spend it at the exposed gate in a moment.
   - The price (BRIBE.PRICE): so many coins, the board's coins hauled up and nothing else down there (no
     chest: a chest takes twenty moves and more to raise, worth far more than the gap saves). Set by the
     simulation (src/race-sim.ts, RACE.md §8) so the bribe's way through the gap wins about its fair share.
   - Each racer hauls her own (as she clears her own barrier: RACE.md §12), one at a time in the notch
     (first come, first served: FIELD.SPOTS's 'wreck'); a new race, the wreck's coins are back.
   Nothing here knows of the 3D or the field: what you carry, the gate's answer, the guard's script. */
import { LAY } from './den-sail.js';
import { Haul } from './treasure-haul.js';
import { HAUL } from './den-haul.js';
import { HALT, GRUMBLES, PAID, SHORT, AGAIN } from './lines/gate-guard.js';
const RB = LAY.RACE.BRIBE;
export const BRIBE = {
    /** The guard's price: coins hauled up from the wreck. A player who plays any line he sees brings this
        many up in about 5 moves (measured 12 Nov: 4.7 on average, 7 at the slow end, for a bot playing a
        random clearing swap with the den's gems; the best swap each time takes 2.5), so about 7 s at a
        decent player's 1.5 s a move. Set by the simulation (RACE.md §8): the bribe won 29% of its races at 30
        coins, 27% at 40 (fair 25%), on 12 Nov; since every racer sails as your sloop does, in and out of the
        wreck's dead-end notch and back to the gate cost it what the other stopped shortcuts don't, and with the
        wreck reachable (13 Nov) it won 10% at 40 coins, 14% at 30 and 15% at 20: 20 since. */
    PRICE: LAY.RACE.COURSE.coins,
    /** Moves a decent player takes to haul the price up (as measured above, for 40 coins; a course from the
        race's editor may ask more or fewer: src/race-course.ts, coins); src/race-sim.ts's haul time. */
    MOVES: (4.7 * LAY.RACE.COURSE.coins) / 40,
    /** Seconds a move of Treasure Haul takes a decent player: seeing it, the swap, the coins going up. 1.5 till
        12 Nov; then 4, from the user's playtest ("doing an entire puzzle to get through one gate"): a haul for the
        bribe feels a whole puzzle's worth, as long as the others' (RACE.md §8, "Shortcuts in proportion"). */
    MOVE_SECS: 4,
    /** Gems now and then, as the den's other hauls; no chest. */
    ODDS: { ...HAUL.ODDS, chest: 0 },
    /** Seconds at the gate to pay (src/race-sim.ts): a moment, stopped, before she's towed. */
    PAY: 1,
    /** How near the gate (squares, any way) the guard's heard. */
    EARSHOT: 3,
};
/** In the wreck's notch, where she lies to haul. */
export const atWreck = (c, r) => Math.round(c) === RB.NOTCH[0] && Math.round(r) === RB.NOTCH[1];
/** By the gate, where she pays: in front of its way in (on the bay's north side since 13 Nov: LAY.RACE.BAY), or
    a square either side. */
export const atGate = (c, r) => {
    const x = Math.round(c), y = Math.round(r);
    return Math.abs(x - RB.GATE[0]) <= 1 && y === RB.GATE[1];
};
/** Within earshot of the guard. */
export const inEarshot = (c, r) => Math.max(Math.abs(c - RB.GATE[0]), Math.abs(r - RB.GATE[1])) <= BRIBE.EARSHOT;
/** The tow through the gate once she's paid, from where she is by it: along the bay's north side to the gate's
    way in, through the fort's three squares, and out by buoy 1, facing down (on down to leg 2 is the way on). A gust's
    squares (Helm.gust). */
export function towPath(from) {
    const [gc] = RB.GATE, out = [];
    let c = Math.round(from.c), r = Math.round(from.r);
    const dir = Math.sign(gc - c);
    while (c !== gc) {
        c += dir;
        out.push({ c, r, d: dir > 0 ? 1 : 3 });
    }
    while (r < RB.GATE[1])
        out.push({ c, r: ++r, d: 0 });
    for (const [x, y] of LAY.RACE.GUNS.way)
        out.push({ c: x, r: y, d: 0 });
    const [lx, ly] = LAY.RACE.GUNS.way[LAY.RACE.GUNS.way.length - 1];
    out.push({ c: lx, r: ly + 1, d: 0 });
    return out;
}
/** The wreck's board: Treasure Haul's own, the price in coins to come up and nothing else. */
export function purseBoard(random = Math.random) {
    const b = new Haul(random, BRIBE.ODDS);
    b.hoard = BRIBE.PRICE;
    b.chestsLeft = 0;
    return b;
}
/** The wreck's coins, to be hauled up by Treasure Haul (as a Salvage is, src/den-haul.ts: js/den/treasure.js
    plays either): from her notch only; Esc leaves the board as it is, to come back to. */
export class Purse {
    random;
    board = null;
    /** All hauled up. */
    done = false;
    at = [...RB.WRECK];
    constructor(random = Math.random) {
        this.random = random;
    }
    /** In reach of the wreck: lying in its notch. */
    reaches(c, r) { return atWreck(c, r); }
    /** She can start (or go back to) hauling: not all up yet, in the notch, stopped there. */
    canStart(ship) {
        return !this.done && ship.idle() && !ship.held() && this.reaches(ship.pose.c, ship.pose.r);
    }
    open() {
        if (this.done)
            throw new Error('The wreck\'s coins are up already');
        return (this.board ??= purseBoard(this.random));
    }
    /** All up: the coins hauled (once; null if it isn't over, or they're counted already). */
    finish() {
        if (this.done || !this.board?.over)
            return null;
        this.done = true;
        return this.board.coins;
    }
    /** Coins up so far. */
    coins() { return Math.min(BRIBE.PRICE, this.board?.coins ?? 0); }
}
/** One race's bribe: the wreck's purse, and whether the gate's paid. Paid, its guns hold their fire on her
    (spares) while she sails through, for the rest of the race. */
export class Bribe {
    purse;
    paid = false;
    constructor(random = Math.random) { this.purse = new Purse(random); }
    /** What she carries (coins up so far; spent once paid). */
    carried() { return this.paid ? 0 : this.purse.coins(); }
    /** Space at the gate. */
    pay(c, r) {
        if (!atGate(c, r))
            return null;
        if (this.paid)
            return 'again';
        const n = this.carried();
        if (n <= 0)
            return null;
        if (n < BRIBE.PRICE)
            return 'short';
        this.paid = true;
        return 'paid';
    }
    /** The gate's guns hold their fire on her. */
    spares() { return this.paid; }
}
/** A guard's line with the price in it. */
export const fill = (s) => s.replace('{price}', String(BRIBE.PRICE));
/** The guard: halts you as you first come up, grumbles now and then (hinting at the wreck), and answers
    Space at the gate (src/chatter.ts). */
export const GUARD_SAYS = {
    intro: [HALT],
    loop: GRUMBLES.map(fill),
    asides: { paid: PAID.map(fill), short: SHORT.map(fill), again: AGAIN.map(fill) },
};
