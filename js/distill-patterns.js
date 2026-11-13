/* Distilling's board reader, the pattern level: groups of pieces read as one (the user, 13 Nov, the thirty-fourth note:
   "an individual piece that's trapped, but also thinking on a bigger group level ... too many blacks and browns at the
   bottom, we need to go rescue them ... there's a V down there, we need to go and fix that up ... a bit of pattern
   matching"). Each a pure calculation, as numbers the planner uses. TypeScript, compiled to js/distill-patterns.js;
   tested in tests/distill-read.test.ts. The piece level is src/distill-risk.ts; the state and tactic read from both
   src/distill-read.ts.

   - Stranded junk (`stranded`): blacks at the bottom and browns at the top among the whites, left of the colour, with
     no way right on their own ("blacks at the bottom, surrounded by whites, browns at the top", P10): each needs a
     piece brought to it, and left there it ruins the Crystal Clear.
   - Stuck pieces (`stuckCount`): the stranded junk, and the whites on the colour's side with no way left ("my risk
     analysis is also looking ... at how many pieces are stuck", P7).
   - Columns the junk can still fill (`fillable`): the junk not yet in a finished junk column and not stranded, a
     column's worth (8.5) a column ("how many columns do I think I can actually fill before I then need to start
     rescuing things out in the middle", P7).
   - The V's tail (`tail`): in the bottom rows where the junk wraps round under the whites, a brown sitting over a black
     it could sink past ("dealing with the tail at the bottom left ... sorting that bottom bit out", P9): each one
     unsorted is a swap the next sweep has to fight through.
   - The right-hand ladder (`ladder`): the two columns by the fire, junk, sorted blacks over browns, the ladder the
     zigzag climbs ("to make that zigzag technique work, you need 2 columns of solid color", P8). How unsorted they
     are, 0 to 1, and its risk: that times how near the furnace is to taking the right-hand one, peaking just before it
     goes, when the zigzag is about to become impossible ("when you're at risk of losing the ability to do the Z
     thing ... That's a risk").

   Pure: no randomness, no clock; knows nothing of the den. */
import { BLACK, BROWN, COLS, DOWN_LEFT, DOWN_RIGHT, SPICE, UP_LEFT, UP_RIGHT, WHITE, beats, neighbourOn } from './distilling.js';
import { doneFromRight, wall } from './distill-score.js';
import { canGo, halfOf, isJunk } from './distill-routines.js';
import { RISK } from './distill-risk.js';
/** The pattern level's weights. */
export const PATTERN = {
    /** Whites a column holds, on average. */
    PER_COLUMN: 8.5,
    /** The tail: its bottom rows (from the bottom up). */
    TAIL_ROWS: 3,
    /** The ladder: a column at least this share junk counts as junk. */
    JUNK_SHARE: 0.75,
    /** Junk the wrong way up (`upsideDown`): the top and bottom this many half rows, and the pieces wrong at least. */
    THIRD: 5,
    UPSIDE_MIN: 6,
};
/** The colour's side starts at the straight wall's place (src/distill-score.ts, `wall`), or past the whites by the
    fire if that's further right. */
const whitesSide = (cols) => wall(cols).at;
/** Whether the junk at (x, y) can make its own way to column `to` or further right, the board as it stands: a walk of
    its swaps (a black down through whites and up through browns, a brown up through whites and down through blacks). */
export function escapes(cols, x, y, to) {
    const p = cols[x][y], seen = new Set([x * 16 + y]), queue = [[x, y]];
    for (let i = 0; i < queue.length; i++) {
        const [cx, cy] = queue[i];
        if (cx >= to)
            return true;
        for (const w of [UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT]) {
            const n = neighbourOn(cols, cx, cy, w);
            if (!n || seen.has(n[0] * 16 + n[1]))
                continue;
            const q = cols[n[0]][n[1]];
            if (q === SPICE || q === p || !(w === UP_RIGHT || w === UP_LEFT ? beats(p, q) : beats(q, p)))
                continue;
            seen.add(n[0] * 16 + n[1]);
            queue.push(n);
        }
    }
    return false;
}
/** Junk stranded among the whites (see the header): left of the colour, a black in its column's bottom half or a brown
    in its top half, at least half its neighbours white, that can't make its own way to the colour. */
export function stranded(cols, at = whitesSide(cols)) {
    const out = [];
    for (let x = 0; x < Math.min(at, COLS - 1); x++)
        cols[x].forEach((p, y) => {
            const low = y * 2 >= cols[x].length;
            if (!((p === BLACK && low) || (p === BROWN && !low)))
                return;
            let n = 0, whites = 0;
            for (const w of [UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT]) {
                const m = neighbourOn(cols, x, y, w);
                if (!m)
                    continue;
                n++;
                if (cols[m[0]][m[1]] === WHITE)
                    whites++;
            }
            if (whites * 2 >= n && whites > 0 && !escapes(cols, x, y, at))
                out.push({ x, y });
        });
    return out;
}
/** Whites in the RISK.COLS columns by the fire with no way left on their own. */
export function stuckWhites(cols) {
    const out = [];
    for (let x = COLS - RISK.COLS; x < COLS; x++)
        cols[x].forEach((p, y) => { if (p === WHITE && !canGo(cols, x, y, -1))
            out.push({ x, y }); });
    return out;
}
/** Pieces stuck: stranded junk and stuck whites. */
export const stuckCount = (cols) => { return stranded(cols).length + stuckWhites(cols).length; };
/** The columns the junk can still fill (see the header): junk outside the finished junk columns on the right, less
    what's stranded, a column's worth a column; and the columns still to fill on the right, from the first unfinished
    one to the wall. */
export function fillable(cols) {
    const done = doneFromRight(cols), at = whitesSide(cols);
    let junk = 0;
    for (let x = 0; x < COLS - done; x++)
        for (const p of cols[x])
            if (isJunk(p))
                junk++;
    junk -= stranded(cols, at).length;
    return { columns: Math.floor(junk / PATTERN.PER_COLUMN), junk, needed: Math.max(0, COLS - done - at) };
}
/** A brown over a black it could sink past, in a region: each such pair, the brown's place. */
function unsorted(cols, xs, rows) {
    const out = [];
    for (const x of xs)
        cols[x].forEach((p, y) => {
            if (p !== BROWN || !rows(x, y))
                return;
            if ([DOWN_LEFT, DOWN_RIGHT].some((w) => { const n = neighbourOn(cols, x, y, w); return !!n && cols[n[0]][n[1]] === BLACK && xs.includes(n[0]); }))
                out.push({ x, y });
        });
    return out;
}
/** The V's tail (see the header): the bottom TAIL_ROWS rows from three columns left of the wall to the first finished
    junk column on the right; its browns over a black, each a swap down to sort. */
export function tail(cols) {
    const at = whitesSide(cols), to = COLS - 1 - doneFromRight(cols), from = Math.max(0, Math.min(at, to) - 3);
    const xs = [];
    for (let x = from; x <= Math.min(to + 1, COLS - 1); x++)
        xs.push(x);
    return { from, to, unsorted: unsorted(cols, xs, (x, y) => y >= cols[x].length - PATTERN.TAIL_ROWS) };
}
/** A column's order, 0 sorted (blacks over browns) to 1 the reverse: browns above blacks, out of every brown and black
    pair. */
export function disorder(col) {
    let browns = 0, bad = 0, pairs = 0, blacks = 0;
    for (const p of col) {
        if (p === BROWN)
            browns++;
        else if (p === BLACK) {
            bad += browns;
            blacks++;
        }
    }
    pairs = browns * blacks;
    return pairs ? bad / pairs : 0;
}
/** A column's browns above blacks, counted in pairs: the swaps still to sort it (0 sorted). */
export function inversions(col) {
    let browns = 0, bad = 0;
    for (const p of col) {
        if (p === BROWN)
            browns++;
        else if (p === BLACK)
            bad += browns;
    }
    return bad;
}
/** The right-hand pair's inversions, both columns'. */
export const ladderBad = (cols) => inversions(cols[COLS - 2]) + inversions(cols[COLS - 1]);
/** How sorted the bottom of the board is from column `from` on (the tail and the junk columns): every brown's depth in
    half pieces, less every black's, in the bottom half. Higher is browns lower and blacks higher; a brown sunk a swap
    down through a black adds 2. */
export function tailOrder(cols, from) {
    let v = 0;
    for (let x = Math.max(0, from); x < COLS; x++)
        cols[x].forEach((p, y) => {
            const h = halfOf(cols, x, y);
            if (h < 8)
                return;
            if (p === BROWN)
                v += h;
            else if (p === BLACK)
                v -= h;
        });
    return v;
}
/** The share of the junk off the finished columns that's stranded (0 to 1): the board cracked when it's high. */
export function strandedShare(cols) {
    const s = stranded(cols).length, f = fillable(cols).junk;
    return s + f > 0 ? s / (s + f) : 0;
}
/** The right-hand ladder (see the header): the two columns by the fire, when both are mostly junk: how unsorted (0 to
    1, the worse of the two), and its risk, that times how near the furnace is to taking the right-hand one (0 a
    column's time off, 1 as it goes). Null when the pair isn't junk yet. */
export function ladder(cols, timeLeft) {
    const pair = [COLS - 2, COLS - 1];
    if (pair.some((x) => cols[x].filter(isJunk).length < PATTERN.JUNK_SHARE * cols[x].length))
        return null;
    const u = Math.max(...pair.map((x) => disorder(cols[x])));
    const near = Math.max(0, Math.min(1, 1 - timeLeft / RISK.BURN_MS));
    return { cols: pair, unsorted: u, risk: u * near };
}
/** Junk sorted the wrong way up (the user, 13 Nov, on P17: "there's a lot of browns near the top left, blacks near
    the bottom left ... it's going to leave you ... stranding those other black pieces, so it should have raised them
    up"; on P23: "so many blacks at the bottom, browns at the top ... you get those whites only so far and then they're
    going to get a bit stuck"): in the columns left of the finished junk columns (from `from`, up to `to`), the browns in
    the top third and the blacks in the bottom third, against the other way round. A brown can't sink through whites nor
    a black rise through them, so browns high and blacks low never meet: the blacks strand at the bottom, and the
    whites' way up (past blacks) and down (past browns) closes. Hoisting is its fix (src/distill-goals.ts): a brown sunk
    through the blacks, lifting them. `wrong`: the browns high and blacks low; `right`: the blacks high and browns low;
    `flagged` when there are UPSIDE_MIN of the wrong at least and twice as many as the right. */
export function upsideDown(cols, from = 0, to = COLS - doneFromRight(cols)) {
    const wrong = [];
    let right = 0;
    for (let x = Math.max(0, from); x < Math.min(to, COLS); x++)
        cols[x].forEach((p, y) => {
            const h = halfOf(cols, x, y), high = h <= PATTERN.THIRD, low = h >= 16 - PATTERN.THIRD;
            if ((p === BROWN && high) || (p === BLACK && low))
                wrong.push({ x, y });
            else if ((p === BLACK && high) || (p === BROWN && low))
                right++;
        });
    return { wrong, right, flagged: wrong.length >= PATTERN.UPSIDE_MIN && wrong.length >= 2 * right };
}
export function patternsOf(cols, timeLeft) {
    const at = whitesSide(cols), s = stranded(cols, at), w = stuckWhites(cols), f = fillable(cols);
    return {
        stranded: s, stuckWhites: w, stuck: s.length + w.length, strandedShare: s.length + f.junk > 0 ? s.length / (s.length + f.junk) : 0,
        fillable: f, tail: tail(cols), ladder: ladder(cols, timeLeft), upsideDown: upsideDown(cols),
    };
}
