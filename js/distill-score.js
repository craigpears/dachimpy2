/* A Distilling board judged at a glance, for Stage I (the user, 12 Nov, the eleventh note: "the scoring
   should just be as simple as like how many whites have moved to the left, how many other pieces have moved
   to the right. For burning, and it's bonus for completing columns ... Like completed brown black columns
   with no whites in on the right, good"). TypeScript, compiled to js/distill-score.js; tested in
   tests/distill-score.test.ts. The bots (src/distill-bots.ts) judge each drag they could make by the score of
   the board it leaves, for the time it takes a person: one drag ahead, no search ("I'm not saying implement
   them because they're expensive, but even just as a test of moves").

   What it counts (DISTILLING.md §3, "The board score"):
   - each white scores the columns it has to its right (whites further left);
   - each piece of junk (a brown, a black, a burnt white) scores the columns it has to its left (junk further
     right);
   - each junk column finished on the right, no white in it and sure to burn, is a bonus, counted from the
     right-hand edge in: the furnace's column first, then the next, and so on while they're done.
   A swap across a column moves one piece each way, so a white swapped left past junk scores 2, two junk
   pieces swapped score nothing (sorting the junk earns nothing here), and junk dragged back left loses 2.
   And three things to avoid, each added when a look at the bots or the user's notes showed it was needed:
   - junk trapped among the whites, no swap taking it right (the bots' chains broke on it);
   - a white in a pocket behind spice (the thirteenth note), heavily;
   - every place a white meets junk, a little: the whites one block behind an upright wall, not cut by a line
     of colour (the fourteenth note's zigzag).

   Pure: knows nothing of the bots or the den. */
import { BLACK, BROWN, BURNT, COLS, DOWN_RIGHT, SPICE, UP_RIGHT, WHITE, canSwapOn, neighbourOn, weightOf } from './distilling.js';
/** The score's weights. */
export const S = {
    /** A white, a column further left; a piece of junk, a column further right. */
    WHITE: 1,
    JUNK: 1,
    /** A junk column done on the right, counted from the edge in. */
    COLUMN: 8,
    /** A brown or a black trapped among the whites (`trapped`): about the swap's worth it'll cost to free. */
    TRAPPED: 2,
    /** A white in a pocket behind spice (`behindSpice`), one of the worst things to leave. */
    POCKET: 12,
    /** Each place a white and a piece of junk meet: the whites kept as one block behind an upright wall, not
        cut by a line of colour (`seams`). */
    SEAM: 0.5,
};
const junk = (p) => p === BROWN || p === BLACK || p === BURNT;
/** A column done as junk: no white in it, and sure to burn (more blacks than whites, burnt whites counted
    as whites; a pure brown would float up instead). */
export function junkDone(col) {
    let weight = 0;
    for (const p of col) {
        if (p === WHITE)
            return false;
        weight += weightOf(p);
    }
    return weight > 0;
}
/** Junk columns done, from the right-hand edge in: none if the furnace's own isn't. */
export function doneFromRight(cols) {
    let n = 0;
    while (n < COLS && junkDone(cols[COLS - 1 - n]))
        n++;
    return n;
}
/** A brown or a black stuck among whites: whites beside it on its right, and no swap takes it right (a
    black on the bottom of the whites, a brown on the top; "blacks get stuck at the bottom, browns at the
    top"). It needs a technique to get out, and left there it's the white block's dirty edge later. */
export function trapped(cols, x, y) {
    const p = cols[x][y];
    if (p !== BROWN && p !== BLACK)
        return false;
    let white = false;
    for (const d of [UP_RIGHT, DOWN_RIGHT]) {
        const n = neighbourOn(cols, x, y, d);
        if (!n)
            continue;
        const q = cols[n[0]][n[1]];
        // Junk beside it on the right: it's part of the colour, not stuck in the whites.
        if (junk(q) || canSwapOn(cols, x, y, n[0], n[1]))
            return false;
        if (q === WHITE)
            white = true;
    }
    return white;
}
/** A white in a pocket behind spice (the user, 12 Nov, the thirteenth note: "that white piece that's kind of
    trapped behind the spice at the top right ... things burn, like those places become inaccessible"): on the
    top or bottom of its column with a spice just inside it in its column. Spice never swaps, so it has two
    ways out at most, along the edge, and those close as the board slides. */
export function behindSpice(cols, x, y) {
    const c = cols[x];
    if (c[y] !== WHITE || (y !== 0 && y !== c.length - 1))
        return false;
    return c[y === 0 ? 1 : y - 1] === SPICE;
}
/** The places a white and a piece of junk meet, each pair once (the user, 12 Nov, the fourteenth note: "I'm
    like zigzagging so I can maintain a nice wall of white so I'm not creating that line in the middle"). An
    upright wall between the whites and the colour has the fewest; a line of colour through the whites, or the
    whites' edge dragged into a diagonal, has many. */
export function seams(cols) {
    let n = 0;
    for (let x = 0; x < COLS - 1; x++)
        for (let y = 0; y < cols[x].length; y++) {
            const p = cols[x][y], w = p === WHITE;
            if (!w && !junk(p))
                continue;
            for (const d of [UP_RIGHT, DOWN_RIGHT]) {
                const nb = neighbourOn(cols, x, y, d);
                if (!nb)
                    continue;
                const q = cols[nb[0]][nb[1]];
                if (w ? junk(q) : q === WHITE)
                    n++;
            }
        }
    return n;
}
/** The board's score: higher is better (see the header). */
export function boardScore(cols) {
    let v = 0;
    for (let x = 0; x < COLS; x++)
        for (let y = 0; y < cols[x].length; y++) {
            const p = cols[x][y];
            if (p === WHITE) {
                v += S.WHITE * (COLS - 1 - x);
                if (behindSpice(cols, x, y))
                    v -= S.POCKET;
            }
            else if (junk(p)) {
                v += S.JUNK * x;
                if (S.TRAPPED && trapped(cols, x, y))
                    v -= S.TRAPPED;
            }
        }
    return v + S.COLUMN * doneFromRight(cols) - S.SEAM * seams(cols);
}
