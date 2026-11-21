/* Rumble's bots (RUMBLE.md §6), knowing nothing of the den: each looks at every shot it has (both fists, every
   angle that lands somewhere different, charged or not), plays each on a copy of its board, and takes the one its
   style scores best, at a person's pace. Compiled to js/rumble-bots.js; tested in tests/rumble.test.ts.

   A style is the plug-in: its name, its pace, and a score for a shot. Only the greedy brawler is built (21 Nov, the
   user: "start out the basics for now"); the strategy bots (aggressive sprinkles, short 3-pop strikes, 3 or 4 group
   strikes with bruises, 10+ group combos) are the idea card rumble-bots-with-different-strategies-to-demo-th, each
   one a `Style` added to `STYLES`, with the same options and hand. */
import { CHARGE_TIME, H, MAX_AIM, W, strikeSize } from './rumble.js';
/** Every shot a side has now: both fists, every angle a degree apart, one for each cell a fist's ball can reach (its
    middle angle, so it's not a shave off a corner), charged and not (charged only where it would charge a group). */
export function options(me, step = Math.PI / 180) {
    const out = [];
    for (const fist of [0, 1]) {
        const reach = new Map();
        for (let a = -MAX_AIM; a <= MAX_AIM + 1e-9; a += step) {
            const { cell } = me.board.shot(fist, a), k = `${cell.r},${cell.c}`;
            const at = reach.get(k);
            if (at)
                at.angles.push(a);
            else
                reach.set(k, { cell, angles: [a] });
        }
        const colour = me.fists[fist][0];
        for (const { cell, angles } of reach.values()) {
            const angle = angles[Math.floor(angles.length / 2)];
            for (const charged of [false, true]) {
                const after = me.board.clone(), outcome = after.land(colour, cell, charged);
                if (charged && outcome.kind !== 'charge')
                    continue;
                out.push({ fist, angle, charged, colour, cell, outcome, after });
            }
        }
    }
    return out;
}
/** The best shot for a style, or null when there's none. */
export function choose(style, look) {
    let best = null, bestScore = -Infinity;
    for (const o of options(look.me)) {
        const s = style.score(o, look);
        if (s > bestScore) {
            bestScore = s;
            best = o;
        }
    }
    return best;
}
/** How near a board is to the line: 0 empty, 1 at it. */
export const fullness = (b) => (b.lowest() + 1) / H;
/** The greedy brawler: clears whatever it can, builds a few charged groups in the middle when it can't, and sets
    them off once it has three (or sooner when its board is getting low, or a strike is coming). */
export const GREEDY = {
    id: 'greedy',
    name: 'Greedy brawler',
    says: 'Clears what it can; charges three groups in the middle, then sets them off.',
    think: 1.1,
    score(o, { me }) {
        const { outcome: out, after } = o, charges = me.board.charges.length;
        const low = fullness(after), danger = low > 0.7;
        const struck = me.incoming.some((x) => x.attack.kind === 'strike');
        let s = 0;
        if (out.kind === 'combo' && out.groups >= 2) {
            const { h, w, bruises } = strikeSize(out.groups, out.dropoff, out.extra);
            s = charges >= 3 || danger || struck ? 200 + out.groups * 40 + h * w + bruises * 2 : -40;
        }
        else if (out.kind === 'combo') {
            s = charges >= 3 || danger ? 40 + out.popped * 2 + out.dropoff * 3 : -20;
        }
        else if (out.kind === 'clear') {
            s = 40 + out.popped * 2 + out.dropoff * 3;
        }
        else if (out.kind === 'charge') {
            const size = after.group(o.cell.r, o.cell.c).length;
            s = charges < 3 && !danger ? 60 + size * 2 - Math.abs(o.cell.c - (W - 1) / 2) * 3 : 5;
        }
        else {
            // Nothing cleared: next to its own colour (a group to come), up high, away from the middle.
            const same = after.neighbours(o.cell.r, o.cell.c).filter(({ r, c }) => {
                const b = after.at(r, c);
                return b && !b.bruise && b.c === o.colour;
            }).length;
            s = same * 8 - o.cell.r * 1.5 - (Math.abs(o.cell.c - (W - 1) / 2) < 1.5 ? 4 : 0);
        }
        return s - (low > 0.85 ? 150 : 0);
    },
};
/** The styles there are, by id (the page's ?bot=). New ones go here. */
export const STYLES = { greedy: GREEDY };
/** A bot's hands on its side of a rumble: it picks a shot, takes its time over it (holding the button to charge,
    as a person must), then fires. The page calls `play` every frame. */
export class Hand {
    style;
    p;
    random;
    /** The shot it's about to take, and when it fires; `chargeFrom` when it starts holding the button. */
    plan = null;
    constructor(style, p, random = Math.random) {
        this.style = style;
        this.p = p;
        this.random = random;
    }
    play(game, now) {
        if (!game.canFire(this.p)) {
            this.plan = null;
            return;
        }
        const me = game.sides[this.p], them = game.sides[1 - this.p];
        if (!this.plan) {
            const option = choose(this.style, { me, them });
            if (!option)
                return;
            const fireAt = now + this.style.think * (0.75 + this.random() * 0.5) + (option.charged ? CHARGE_TIME : 0);
            this.plan = { option, fireAt, chargeFrom: fireAt - CHARGE_TIME };
            me.aim = option.angle;
        }
        if (now >= this.plan.fireAt) {
            const { fist, angle, charged } = this.plan.option;
            this.plan = null;
            game.fire(this.p, fist, angle, charged, now);
        }
    }
    /** How far through holding the button to charge (0 to 1), or null when it isn't. */
    charging(now) {
        const pl = this.plan;
        if (!pl || !pl.option.charged || now < pl.chargeFrom)
            return null;
        return { fist: pl.option.fist, t: Math.min(1, (now - pl.chargeFrom) / CHARGE_TIME) };
    }
}
