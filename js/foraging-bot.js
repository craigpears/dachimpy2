/* A bot that forages: the Foraging puzzle's move-choosing (src/foraging.ts), knowing nothing of where
   it's played. TypeScript, compiled to js/foraging-bot.js; tested in tests/puzzle-bots.test.ts. Written
   (12 Nov) for the race watched (src/race-watch.ts): Umami clearing the barrier of driftwood plays his
   board with it, a turn at a time.

   Greedy, one move ahead: every turn of the cursor's 2x2 (either way) and every special piece used
   (either way) tried on a copy of the board, and the one worth most made. What it's worth: points (only
   containers leaving the board score), containers sunk lower (each row a container drops is that much
   nearer the bottom), the pieces under them cleared (what's under one has to go before it sinks), and a
   little for tiles cleared. */
import { Forage, H, W, SIZES } from './foraging.js';
import { seeded } from './mirror-row.js';
/** A copy of the board to try a move on: its pieces copied (an ant turns and eats, so it's changed in
    place), a container still one piece over all its squares, new tiles from its own seed. */
export function forageCopy(f, seed = 1) {
    const ids = new Map(), copy = (b) => (b ? (ids.get(b) ?? ids.set(b, { ...b }).get(b)) : null);
    const c = Object.create(Forage.prototype);
    return Object.assign(c, f, { grid: f.grid.map((row) => row.map(copy)), cur: { ...f.cur }, random: seeded(seed) });
}
/** How low the containers on the board sit, all told (rows from the top). */
const sunk = (f) => f.containers().reduce((n, x) => n + x.r, 0);
/** Pieces under the containers, all told: what has to go before they're out. */
export function under(f) {
    let n = 0;
    for (const { bit, r, c } of f.containers()) {
        const { w, h } = SIZES[bit.box];
        for (let cc = c; cc < c + w; cc++)
            for (let rr = r + h; rr < H; rr++)
                if (f.grid[rr][cc])
                    n++;
    }
    return n;
}
/** What a move did, to the bot: from a board whose containers sat `was` rows down all told, with `below`
    pieces under them. */
export function forageWorth(f, m, was, below = under(f)) {
    if (!m.moved)
        return -Infinity;
    return m.points * 10 + m.left.length * 8 + (sunk(f) - was) * 2 + (below - under(f)) * 3 + m.tiles * 0.3;
}
/** The move to make; null if none can be made. */
export function forageMove(f) {
    let top = null, topV = -Infinity, salt = 1;
    const was = sunk(f), below = under(f);
    for (let r = 0; r < H; r++)
        for (let c = 0; c < W; c++)
            for (const cw of [false, true]) {
                const b = f.grid[r][c], special = !!b?.s && b.s !== 'ant';
                if (!special && !f.canTurn(r, c))
                    continue;
                const t = forageCopy(f, salt++), m = special ? t.use(r, c, cw) : t.turn(r, c, cw);
                const v = forageWorth(t, m, was, below);
                if (v > topV) {
                    topV = v;
                    top = { r, c, cw };
                }
            }
    return top;
}
/** Played on the board as a player would: the cursor put there, and X (anticlockwise) or C pressed. */
export function forageApply(f, m) {
    f.cur = { r: m.r, c: m.c };
    return f.press(m.cw);
}
