/* Swordfight duel bots (SWORDFIGHT.md), knowing nothing of the den or the page. TypeScript, compiled to
   js/sword-bots.js; tested in tests/sword-duel.test.ts.

   A bot is a strategy: shown its own board, the pair it's playing and the other side's board, it picks where the
   pair goes (`SwordBot.plan`). A `Hand` plays that out at a person's pace on a Duel, a key a beat, then drops it.
   Only one strategy so far, `greedy`. Others plug in as another SwordBot in BOTS (the idea card
   swordfight-duel-bots-with-different-strategies-o: one building an insta, and others): a strategy needs nothing
   but `plan`, and can use `placements` and `tryPlace` to look ahead on copies of the boards. */
import { ENTRY, H, W } from './swordfight.js';
/** The pair spawned on a copy of the board and turned and moved as the keys would: rot quarter turns (3 as one
    turn the other way), then across to column c. Null if it can't come in. */
function steered(board, pair, plan) {
    const b = board.clone();
    b.falling = null;
    if (!b.spawn(pair))
        return null;
    for (const d of turns(plan.rot))
        b.rotate(d);
    while (b.falling.c < plan.c && b.move(1))
        ;
    while (b.falling.c > plan.c && b.move(-1))
        ;
    return b;
}
/** The quarter turns that bring a pair from its spawn to way round rot. */
export function turns(rot) {
    return rot === 3 ? [-1] : Array(rot).fill(1);
}
/** Every place the pair can be dropped from its spawn, each once. */
export function placements(board, pair) {
    const out = [], seen = new Set();
    for (let rot = 0; rot < 4; rot++)
        for (let c = 0; c < W; c++) {
            const b = steered(board, pair, { c, rot });
            if (!b)
                return out;
            const f = b.falling, key = `${f.c},${f.rot}`;
            if (!seen.has(key)) {
                seen.add(key);
                out.push({ c: f.c, rot: f.rot });
            }
        }
    return out;
}
/** The pair dropped by plan on a copy of the board: the copy after, and what broke. Null if it can't come in. */
export function tryPlace(board, pair, plan) {
    const b = steered(board, pair, plan);
    return b ? { board: b, result: b.drop() } : null;
}
/** What an attack's worth: its sprinkles, and its swords' squares. */
export function worth(r) {
    return r.sprinkles + r.strikes.reduce((n, s) => n + s.w * s.h, 0);
}
/** The greedy bot: every place the pair can go, scored one move deep. It sends what it can now, keeps its
    colours together so blocks fuse, and keeps its stack low, the fourth column above all. */
export const greedy = {
    name: 'greedy',
    plan(v) {
        let best = { c: ENTRY, rot: 0 }, top = -Infinity;
        for (const p of placements(v.board, v.pair)) {
            const t = tryPlace(v.board, v.pair, p);
            if (!t)
                continue;
            const s = score(t.board, t.result);
            if (s > top) {
                top = s;
                best = p;
            }
        }
        return best;
    },
};
/** How good a board is after a move, to the greedy bot. */
function score(b, r) {
    if (b.lost)
        return -1e9;
    let s = worth(r) * 3 + r.links.length * 2;
    for (let c = 0; c < W; c++) {
        const h = b.height(c);
        s -= h * h * 0.04;
        if (c === ENTRY)
            s -= Math.max(0, h - 6) ** 2 * 3;
    }
    // Like colours side by side, and fused blocks, make the swords later.
    for (let r0 = 0; r0 < H; r0++)
        for (let c = 0; c < W; c++) {
            const g = b.grid[r0][c];
            if (!g || g.grey || g.breaker)
                continue;
            for (const [dr, dc] of [[1, 0], [0, 1]]) {
                const o = b.at(r0 + dr, c + dc);
                if (o && !o.grey && !o.breaker && o.c === g.c)
                    s += 0.4;
            }
            if (g.fuse !== undefined)
                s += 0.3;
        }
    return s;
}
/** Every strategy, by the name a page's address uses (?bot=greedy). */
export const BOTS = { greedy };
/** A person's pace for a bot's hand: seconds to think when a pair comes in, then a key a beat, then the drop. */
export const PACE = { THINK: 0.45, KEY: 0.14, DROP: 0.2 };
/** A bot's hand on one side of a duel: plans each pair as it comes in, then plays the keys out at PACE: its turns,
    then a key across a beat till it's over its column (or stuck), then the drop. */
export class Hand {
    bot;
    side;
    pace;
    pair = null;
    turns = [];
    to = ENTRY;
    t = 0;
    constructor(bot, side, pace = PACE) {
        this.bot = bot;
        this.side = side;
        this.pace = pace;
    }
    /** Time goes by on the duel; the drop's Turn if this hand dropped its pair. */
    update(duel, dt) {
        const me = duel.sides[this.side], b = me.board, f = b.falling;
        if (duel.over || !f)
            return null;
        if (f.pair !== this.pair) {
            this.pair = f.pair;
            const plan = this.bot.plan({ board: b.clone(), pair: f.pair, foe: duel.sides[1 - this.side].board.clone(), incoming: me.incoming.slice() });
            this.turns = turns(plan.rot);
            this.to = plan.c;
            this.t = -this.pace.THINK;
        }
        for (this.t += dt; this.t >= 0;) {
            const d = this.turns.shift();
            const moved = d ? b.rotate(d) : f.c !== this.to && b.move(f.c < this.to ? 1 : -1);
            if (d || moved) {
                this.t -= this.pace.KEY;
                continue;
            }
            return this.t >= this.pace.DROP ? duel.drop(this.side) : null;
        }
        return null;
    }
}
