/* Pirate Den: Umami the capybara, found stuck on the clifftop lagoon's far bank and freed by
   Foraging. TypeScript, compiled to js/den-umami.js; tested in tests/den-umami.test.ts. js/den/umami.js
   draws it all: his bank, his board, his swim to her and his life at the den.

   A friend's side quest (IDEAS.md, "Side quests that leave friends about the den"), the user, 10 Nov:
   an animal trapped in the lagoon, rescued by a puzzle, who then lives at the den as "a pet that you
   found and rescued". A capybara, so it has to make sense ("not just hanging around on the land"):
   he's stuck high on the lagoon's far bank in reeds, roots and mud, tangled in an old net; cleared
   down off the foot of the board he splashes into the water and swims to her; and at the den he lives
   at the water's edge, wading, swimming and sitting in the shallows, as capybaras do. Called Umami
   ("for fun ... since he requested it"). Freed by Foraging ("Definitely foraging ... it's got the same
   kind of logic as treasure haul, but like reversed"): the one Foraging (src/foraging.ts), dealt with
   him as its one container and nothing more to come.

   Nothing's said about him beforehand (RULES.md, "Hidden gems, never hinted"): you see him on the bank
   from her, pole her along the shore to him (the arrows or a click, as she's sailed everywhere), and
   at his bank Space frees him.

   Never stuck (the user, 10 Nov: "as long as we've got enough pieces so that you don't get stuck ...
   as long as you can get through eventually if you make a mistake"). A mistake on a Foraging board
   can strand a container: dig one of its columns out from under it and that side's left hanging over
   an empty gap, which nothing falls into; it only sinks once the square under its other side clears
   too, and that square can only be cleared by a line through it or one below it in its column. Beside
   a column of tiles that always can be (turn the squares beside it till three line up; new tiles of
   every kind keep coming in). At the board's edge it can't: with its inner column dug out to the
   bottom, the outer one has no neighbour to line up with and can never be turned. So he's dealt in
   the middle two columns (UMAMI.AT), and his board has no earthquakes, the only thing that ever moves
   a container sideways: he never reaches an edge, and there's always a way to get him down. The bots
   in tests/den-umami.test.ts show it, blundering first and freeing him after.

   A real puzzle's worth of clearing (the user, 10 Nov: "I don't understand as well how he seems to
   get free after just 2 clicks"). A shovel digs out its whole column below it, containers ignored, so
   two landing over him (they come in at the top, where he starts) dug him clean out in a move or two:
   a bot that sees what each move does freed him in 17 moves at the median, in 3 at best. His board
   deals no shovels either: he's brought down by clearing lines under him, row by row, and drops off
   the foot of the bank when there's nothing left under him (the same bot: 91 at the median, never
   fewer than 5). The other specials (the machete, the monkey, the ant) still come. */
import { SPECIAL_ODDS } from './foraging.js';
export const UMAMI = {
    /** His container's tag on the board. */
    TAG: 'umami',
    /** Where he's stuck: a basket-sized container (2x2), at the top of the board (high on the bank), in
        its middle two columns (the board's 7 wide: two columns clear on his left, three on his right). */
    AT: { size: 'basket', r: 0, c: 2 },
    /** Seconds to pole her along the lagoon's shore from one mooring to the other. */
    POLE: 3,
    /** Seconds his swim to her takes, from the foot of the board. */
    SWIM: 3.2,
};
/* Trapped while you free him, then free (the user, 10 Nov: "being in the cage or being trapped in some
   way visually makes sense while you're trying to free them. They break free and happily start
   jumping around"). On his board he's tangled in the old net, and it comes down the board with him;
   once he's off its foot he breaks out of it (it falls away), bounds along the muddy foot of the bank
   a few times for joy, and leaps into the water to swim to her. Soft, slow arcs, as functions of the
   time since he came off the board (nothing stepped a frame at a time, no fast bobbing). */
export const FREED = {
    /** Seconds to wriggle out of the net (it slides off him and falls away). */
    BREAK: 0.6,
    /** Bounds for joy, each this long (seconds) and this high (metres at his size at home). */
    HOPS: 3, HOP: 0.55, HIGH: 0.35,
    /** Then a leap into the water: this long, this high. */
    LEAP: 0.7, LEAP_HIGH: 0.55,
};
/** Seconds from coming off the board to his splash. */
export const FREED_T = FREED.BREAK + FREED.HOPS * FREED.HOP + FREED.LEAP;
/** Where he is in breaking free, `t` seconds after coming off the board: the phase, how far through
    it (`u`, 0 to 1), how high he is off the ground (`lift`, metres), how far along his bounds he's
    got (`along`, 0 to 1 over all of them), and how far the net's slid off him (`net`, 0 to 1). */
export function freedAt(t) {
    const F = FREED, arc = (u, h) => h * 4 * u * (1 - u);
    if (t < F.BREAK) {
        const u = Math.max(0, t) / F.BREAK;
        return { phase: 'break', u, lift: 0, along: 0, net: u };
    }
    t -= F.BREAK;
    if (t < F.HOPS * F.HOP) {
        const i = Math.floor(t / F.HOP), u = (t - i * F.HOP) / F.HOP;
        return { phase: 'hop', u, lift: arc(u, F.HIGH), along: t / (F.HOPS * F.HOP), net: 1 };
    }
    t -= F.HOPS * F.HOP;
    if (t < F.LEAP) {
        const u = t / F.LEAP;
        return { phase: 'leap', u, lift: arc(u, F.LEAP_HIGH), along: 1, net: 1 };
    }
    return { phase: 'swim', u: 1, lift: 0, along: 1, net: 1 };
}
/** His board's special pieces: as any board's, with no earthquakes and no shovels (see above). */
export function umamiOdds(odds = SPECIAL_ODDS) {
    return { ...odds, weights: { ...odds.weights, earthquake: 0, shovel: 0 } };
}
/** His board, dealt: him high on the bank and nothing more to come. */
export function umamiDeal(random = Math.random, odds = SPECIAL_ODDS) {
    return { random, bananas: 0, start: [{ ...UMAMI.AT, tag: UMAMI.TAG }], specials: umamiOdds(odds) };
}
/** Umami: where he is, the board that frees him (kept as you left it), and her moorings in the lagoon. */
export class Umami {
    stage = 'stuck';
    moor = 'wreck';
    /** Poling her along the shore: to which mooring, and how far there (0 to 1). */
    pole = null;
    /** His board, once you've started on it. */
    game = null;
    /** You're at his board. */
    freeing = false;
    /** She can be poled along the shore: up in the lagoon (`inLagoon`: there, not on her way), and
        not while you're freeing him or she's being poled already. */
    canPole(inLagoon) { return inLagoon && !this.pole && !this.freeing; }
    /** Pole her to that mooring. */
    poleTo(to, inLagoon) {
        if (!this.canPole(inLagoon) || to === this.moor)
            return false;
        this.pole = { to, t: 0 };
        return true;
    }
    /** Time passing: she's poled along. True as she gets there. */
    tick(dt) {
        if (!this.pole)
            return false;
        this.pole.t = Math.min(1, this.pole.t + dt / UMAMI.POLE);
        if (this.pole.t < 1)
            return false;
        this.moor = this.pole.to;
        this.pole = null;
        return true;
    }
    /** She's moored by the wreck, still: the crane's work (hauling the wreck, lowering her) goes on. */
    byWreck(inLagoon) { return !inLagoon || (this.moor === 'wreck' && !this.pole); }
    /** She's moored by his bank. */
    beside(inLagoon) { return inLagoon && this.moor === 'bank' && !this.pole; }
    /** He can be freed: she's beside him and he's still stuck. */
    canFree(inLagoon) { return this.beside(inLagoon) && this.stage === 'stuck'; }
    /** Start freeing him (or go back to it): his board, as you left it. `deal` makes it the first time. */
    free(deal) {
        if (this.stage !== 'stuck')
            return null;
        this.freeing = true;
        return (this.game ??= deal());
    }
    /** Leave him for now: his board stays as it is. */
    leave() { this.freeing = false; }
    /** He's off the foot of the board and into the water. */
    freed() {
        if (this.stage !== 'stuck')
            return;
        this.stage = 'swimming';
    }
    /** The board's done (he's gone out of it): you're done at it. */
    done() { this.freeing = false; }
    /** He's reached her and clambered aboard. */
    aboard() { if (this.stage === 'swimming')
        this.stage = 'aboard'; }
    /** She's home and you're ashore: he hops off into the shallows, and lives at the den from now on. */
    home() { if (this.stage === 'aboard')
        this.stage = 'home'; }
}
// ---------- his life at the den ----------
/** Where he lives at the den: the stretch of beach left of her mooring (her mooring's at x -6, the
    Bilge board's to its right), the shack's end of the den; and how he moves about it. Distances are
    metres: `x` along the beach, `off` from the water's edge, up the sand (+) or out into the water
    (-), so the tide moves him with it. */
export const LIFE = {
    X: [-12.5, -8.8],
    OFF: [1.4, -3.2],
    /** Above this he's on the sand; below SWIM he's out of his depth, swimming; between, wading. */
    SAND: 0.15,
    SWIM: -1.3,
    /** Metres a second, on his feet (sand or wading) and swimming. */
    WALK: 0.75,
    SWIMS: 0.55,
    /** Seconds he stays at a spot, at least and at most. */
    STAY: [4, 11],
    /** How likely his next spot is in the water (he's a capybara). */
    WET: 0.75,
    /** Where he comes ashore from her (hopping off her into the water, off her bow). */
    ARRIVE: { x: -8.8, off: -2.6 },
};
/** How deep it is at `off`: sand, shallows or deep. */
export function depth(off) {
    return off > LIFE.SAND ? 'sand' : off > LIFE.SWIM ? 'shallows' : 'deep';
}
/** Umami at home: where he is on the beach, where he's off to next, and what he's doing. */
export class Life {
    random;
    x;
    off;
    /** Where he's heading, if he's on his way. */
    to = null;
    /** Seconds before he moves on, while he's staying put. */
    wait;
    /** Which way he faces: an angle in the beach's plane, 0 along +x, π/2 up the sand (+off). */
    heading = Math.PI;
    constructor(random = Math.random, at = LIFE.ARRIVE) {
        this.random = random;
        this.x = at.x;
        this.off = at.off;
        this.wait = 1;
    }
    /** What he's doing now. */
    doing() {
        const d = depth(this.off);
        if (this.to)
            return d === 'sand' ? 'walk' : d === 'shallows' ? 'wade' : 'swim';
        return d === 'sand' ? 'sit' : d === 'shallows' ? 'soak' : 'float';
    }
    /** His next spot: somewhere on his stretch, mostly in the water, never right where he is. */
    pick() {
        const [x0, x1] = LIFE.X, [top, low] = LIFE.OFF, R = this.random;
        for (let i = 0; i < 8; i++) {
            const x = x0 + (x1 - x0) * R();
            const off = R() < LIFE.WET ? LIFE.SAND + (low - LIFE.SAND) * R() : LIFE.SAND + (top - LIFE.SAND) * R();
            if (Math.hypot(x - this.x, off - this.off) > 0.8)
                return { x, off };
        }
        return { x: (x0 + x1) / 2, off: LIFE.SWIM };
    }
    /** Time passing: he stays a while, then wanders (or swims) off to his next spot. */
    tick(dt) {
        if (!this.to) {
            if ((this.wait -= dt) > 0)
                return;
            this.to = this.pick();
        }
        const dx = this.to.x - this.x, doff = this.to.off - this.off, d = Math.hypot(dx, doff);
        const step = (depth(this.off) === 'deep' ? LIFE.SWIMS : LIFE.WALK) * dt;
        if (d > 1e-6)
            this.heading = Math.atan2(doff, dx);
        if (d <= step) {
            this.x = this.to.x;
            this.off = this.to.off;
            this.to = null;
            const [lo, hi] = LIFE.STAY;
            this.wait = lo + (hi - lo) * this.random();
            return;
        }
        this.x += dx / d * step;
        this.off += doff / d * step;
    }
}
