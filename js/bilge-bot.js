/* A bot that bilges: the Bilge puzzle's move-choosing (src/bilge.ts), knowing nothing of where it's
   played. TypeScript, compiled to js/bilge-bot.js; tested in tests/puzzle-bots.test.ts. Written (12 Nov)
   for the race watched (src/race-watch.ts): Gravee pumping the up lock plays her board with it, a swap
   at a time.

   Greedy, one swap ahead, as a decent bilger plays: every swap tried on a copy of the board, and the one
   worth most made. What it's worth: the lines the swap itself makes (a combo by its name, Bingo and up
   most), the pieces cleared, the chain that follows, crabs freed; and a little for a swap low on the
   board (what clears there brings more down onto it). A swap that clears nothing is worth only a line
   one short it sets up. Never a crab (it won't budge). */
import { Bilge, H, W } from './bilge.js';
import { seeded } from './mirror-row.js';
/** What a combo's name is worth to the bot. */
const COMBO = { '': 3, Good: 5, Great: 7, 'Arrr!': 8, 'Har!': 10, 'Yarrr!': 12, 'Bingo!': 16, 'Sea Donkey!': 22, 'Vegas!': 30 };
/** A copy of the board to try a swap on (new pieces coming in from its own seed). */
export function bilgeCopy(b, seed = 1) {
    const c = Object.create(Bilge.prototype);
    return Object.assign(c, b, { grid: b.snap(), random: seeded(seed) });
}
/** What a swap did, to the bot. */
export function bilgeWorth(m, r) {
    if (!m.moved)
        return -Infinity;
    if (!m.cleared)
        return 0;
    return (COMBO[m.combo] ?? 3) + m.cleared * 0.4 + m.chain * 2 + m.crabs * 3 + (m.puffer || m.jelly ? 4 : 0) + r * 0.05;
}
/** Threes one short: a pair of a kind with a third a swap away. A board's promise. */
function setUp(b) {
    let n = 0;
    const k = (r, c) => { const x = b.grid[r]?.[c]; return x && !x.s ? x.k : -1; };
    for (let r = 0; r < H; r++)
        for (let c = 0; c < W - 1; c++)
            if (k(r, c) >= 0 && k(r, c) === k(r, c + 1))
                n++;
    for (let r = 0; r < H - 1; r++)
        for (let c = 0; c < W; c++)
            if (k(r, c) >= 0 && k(r, c) === k(r + 1, c))
                n++;
    return n;
}
/** The swap to make: its left square, [row, column]; null if there's none. */
export function bilgeMove(b) {
    let top = null, topV = -Infinity, salt = 1;
    for (let r = 0; r < H; r++)
        for (let c = 0; c < W - 1; c++) {
            const t = bilgeCopy(b, salt++), m = t.swap(r, c);
            let v = bilgeWorth(m, r);
            if (v === 0)
                v = setUp(t) * 0.1;
            if (v > topV) {
                topV = v;
                top = [r, c];
            }
        }
    return top;
}
