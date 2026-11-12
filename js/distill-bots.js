/* Bots that distil: Distilling (src/distilling.ts), played by the techniques (DISTILLING.md §3), knowing
   nothing of where it's played. TypeScript, compiled to js/distill-bots.js; tested in
   tests/distill-bots.test.ts; run over many seeded boards by tools/distill-bots.mjs, whose numbers are
   DISTILLING.md §4's goals.

   A bot sees the board as a player does and moves at a person's pace: a budget of swaps a second (at
   most 6, a swap's 150 ms slide) and a moment to spot each drag. It never searches what a person
   couldn't: it looks at drags of one piece at a time, tracing where a piece can slide (a player sees
   "this black falls down-right through the whites"), and at the better tiers a drag that sets up the
   next (two drags of a pair: the crawl, the leapfrog, the figure of eight, the hook). Nothing deeper.

   How it plays, by the user's stages (12 Nov, DISTILLING.md "The user's own account"):
   - Stage I, burn the junk: whites to the left, browns and blacks to the right, blacks on top and
     browns at the bottom (the junk sorts itself that way: blacks rise past browns; a black-topped
     column burns and never floats up as a pure brown). The column by the furnace: its whites rescued
     first, a black more than its whites, then burned as soon as it's ready (the better tiers).
   - Decision time: when the whites on the board make the tier's columns (bank), or the junk runs low,
     stop ferrying junk across; the junk columns still on the right burn as planned, then the chain.
   - Stage II, the chain: whites to the right, every column out Crystal Clear, the junk piling up on
     the left; the next column out filled first. When the chain breaks below CC^12, dismiss.
   Its sense of the board is one score (`worth`): three zones (the junk columns to burn next, at most
   KMAX built at once; the block of whites beside them, as wide as its whites fill; the rest, where new
   columns come in), each piece worth more where it belongs, junk on the block's top or bottom edge worth
   least (it gets stuck there), blacks up and browns down, a way out kept open, the next columns out
   weighed most. Each go it picks the drag of one piece that gains most (less a little a swap); failing
   that (the better tiers), two pieces moved together, up to six swaps (the crawl, the figure of eight),
   or a drag that sets up the next. A hill-climb, not a plan: DISTILLING.md §4 says how far it gets (CC^2
   typically, CC^6 at best, 12 Nov) and why. The techniques aren't separate routines yet (the tutorial
   will want each as a scripted routine on a seeded board). */
import { BLACK, BROWN, BURNT, COLS, DOWN_LEFT, DOWN_RIGHT, SPICE, TALL, UP_LEFT, UP_RIGHT, WHITE, canSwapOn, neighbourOn, } from './distilling.js';
export const TIERS = [
    { name: 'learner', label: 'Learner', rate: 2, spot: 600, bank: 0, reach: 2, pairs: false, early: false, dismiss: false },
    { name: 'master', label: 'Able to Master', rate: 3.5, spot: 400, bank: 4, reach: 8, pairs: false, early: true, dismiss: true },
    { name: 'grandmaster', label: 'Grand-Master to Legendary', rate: 5, spot: 250, bank: 4.5, reach: 12, pairs: true, early: true, dismiss: true },
    { name: 'ultimate', label: 'Ultimate', rate: 6, spot: 150, bank: 5, reach: 16, pairs: true, early: true, dismiss: true },
];
export const tierNamed = (name) => {
    const t = TIERS.find((x) => x.name === name);
    if (!t)
        throw new Error(`no tier "${name}"`);
    return t;
};
const isJunk = (p) => p === BROWN || p === BLACK || p === BURNT;
/** A piece's height on the board in half pieces, 0 the top of a tall column to 16 the bottom. */
const half = (cols, x, y) => 2 * y + (cols[x].length === TALL ? 0 : 1);
/** Weights of the bot's sense of the board (exported to tune: tools/distill-bots.mjs's WEIGHTS). */
export const W = {
    /** A free column's drift on each piece toward its side. */
    PULL: 0.3,
    /** A piece in the block of whites, or the junk columns, where it belongs or doesn't. */
    ZONE: 6,
    JZONE: 10,
    /** Stage I's junk columns at most: the next ones to burn, built one at a time ("build evenly"). */
    KMAX: 3,
    /** Junk on the top or bottom edge of the block of whites, where it gets stuck ("blacks get stuck at
        the bottom, browns at the top"). */
    EDGE: 10,
    /** Junk in the block of whites, drawn toward the way out (the junk columns in Stage I, the left after). */
    PULL_IN: 0.5,
    /** Moving two pieces together (the crawl, the figure of eight): swaps at most, and pairs looked at. */
    PAIR_DEPTH: 6,
    PAIRS: 24,
    /** Blacks up, browns down. */
    SORT: 0.6,
    /** The next three columns out: a piece in the wrong one. */
    NEXT: [15, 8, 4],
    /** A junk column by the furnace that would float up. */
    FLOAT: 12,
    /** A piece with a way still open to where it wants to go. */
    MOB: 2,
    /** Setting a drag up for the next: how many first drags it weighs, and whether any piece's (else
        only a junk pair's). */
    SETUPS: 30,
    ANY_SETUP: 0,
    /** Each swap's cost, so the shorter drag wins. */
    SWAP: 0.15,
};
/** One piece's worth where it is. */
function pieceWorth(p, x, h, s) {
    if (p === SPICE)
        return 0;
    let v;
    const junk = isJunk(p);
    // In the junk columns: junk at home, a white the worse the further in. In the block of whites: a
    // white at home, junk out of place (its whereabouts in the block don't matter: only getting out).
    // Free, where new columns come in: a little drift, junk toward the furnace in Stage I, whites
    // toward the block in Stage II.
    if (x >= s.junkFrom)
        v = junk ? W.JZONE + W.PULL * x : -W.JZONE - (x - s.junkFrom + 1);
    else if (x >= s.whiteFrom && x < s.whiteTo)
        v = junk ? -W.ZONE - W.PULL_IN * (s.stage === 'junk' ? s.whiteTo - x : x - s.whiteFrom + 1) - (h <= 1 || h >= 15 ? W.EDGE : 0) : W.ZONE;
    else if (s.stage === 'junk')
        v = junk ? W.PULL * x : 0;
    else
        v = junk ? -W.PULL * x : W.PULL * x;
    if (p === BLACK)
        v += (W.SORT * (16 - h)) / 16;
    else if (p === BROWN)
        v += (W.SORT * h) / 16;
    return v;
}
/** A column's worth beyond its pieces': the next ones out weighed by what's wrong in them. */
function columnWorth(cols, x, s) {
    const d = COLS - 1 - x;
    if (d > 2)
        return 0;
    const col = cols[x];
    let whites = 0, junk = 0, weight = 0;
    for (const p of col) {
        if (p === WHITE) {
            whites++;
            weight--;
        }
        else if (p === BURNT) {
            junk++;
            weight--;
        }
        else if (p === BLACK) {
            junk++;
            weight++;
        }
        else if (p === BROWN)
            junk++;
    }
    const burning = s.stage === 'junk' || d < s.burns;
    if (burning)
        return -W.NEXT[d] * whites - (d === 0 && weight <= 0 ? W.FLOAT : d === 1 && weight <= 0 ? W.FLOAT / 3 : 0);
    return -W.NEXT[d] * junk;
}
/** The whole board's worth to the bot. */
export function worth(cols, s) {
    let v = 0;
    for (let x = 0; x < COLS; x++) {
        v += columnWorth(cols, x, s);
        for (let y = 0; y < cols[x].length; y++)
            v += cellWorth(cols, x, y, s);
    }
    return v;
}
/** Which way a piece wants to go across: -1 left, 1 right, 0 it's where it belongs. Stage I: whites
    in the junk columns left, junk outside them right; Stage II: junk in the white block left, whites
    outside it right (and out of the junk columns still to burn, left). */
function wants(p, x, s) {
    if (p === SPICE)
        return 0;
    const junk = isJunk(p);
    if (x >= s.junkFrom)
        return junk ? 0 : -1;
    if (x >= s.whiteFrom && x < s.whiteTo)
        return junk ? (s.stage === 'junk' ? 1 : -1) : 0;
    if (s.stage === 'junk')
        return junk ? 1 : 0;
    return junk ? -1 : 1;
}
/** A piece's way out: worth more while it can still swap the way it wants to go (a white in the junk
    with a black above it or a brown below on the left, which a player keeps open; a black stored high
    and a brown low, to cross the whites). A white shut in between browns above and blacks below is
    stuck, the classic trap. */
function mobility(cols, x, y, s) {
    const dir = wants(cols[x][y], x, s);
    if (!dir)
        return 0;
    const ways = dir > 0 ? [UP_RIGHT, DOWN_RIGHT] : [UP_LEFT, DOWN_LEFT];
    for (const d of ways) {
        const n = neighbourOn(cols, x, y, d);
        if (n && canSwapOn(cols, x, y, n[0], n[1]))
            return W.MOB;
    }
    return 0;
}
const cellWorth = (cols, x, y, s) => pieceWorth(cols[x][y], x, half(cols, x, y), s) + mobility(cols, x, y, s);
/** The places a swap touches the worth of: the two, and their neighbours (whose ways out change). */
function touched(cols, x1, y1, x2, y2) {
    const out = [[x1, y1], [x2, y2]];
    for (const [x, y] of [[x1, y1], [x2, y2]])
        for (let d = 0; d < 4; d++) {
            const n = neighbourOn(cols, x, y, d);
            if (n && !out.some(([a, b]) => a === n[0] && b === n[1]))
                out.push(n);
        }
    return out;
}
/** What one swap changes in the board's worth (the places it touches and the two columns), done on
    `cols`. */
function swapGain(cols, x1, y1, x2, y2, s) {
    const at = touched(cols, x1, y1, x2, y2);
    let before = columnWorth(cols, x1, s) + columnWorth(cols, x2, s);
    for (const [x, y] of at)
        before += cellWorth(cols, x, y, s);
    const a = cols[x1][y1];
    cols[x1][y1] = cols[x2][y2];
    cols[x2][y2] = a;
    let after = columnWorth(cols, x1, s) + columnWorth(cols, x2, s);
    for (const [x, y] of at)
        after += cellWorth(cols, x, y, s);
    return after - before;
}
/** The best drag of one piece at a time (reach swaps at most, always the same way across), on a copy
    of the board. Each step of a drag is a swap a player can see is legal from where the piece is. */
export function bestDrag(cols, s, reach, floor = 0.1) {
    const b = cols.map((c) => [...c]);
    let best = null;
    const ways = [];
    const dfs = (x, y, gain, side) => {
        if (ways.length >= reach)
            return;
        for (const d of side > 0 ? [UP_RIGHT, DOWN_RIGHT] : [UP_LEFT, DOWN_LEFT]) {
            const n = neighbourOn(b, x, y, d);
            if (!n || !canSwapOn(b, x, y, n[0], n[1]))
                continue;
            const g = gain + swapGain(b, x, y, n[0], n[1], s);
            ways.push(d);
            const net = g - W.SWAP * ways.length;
            if (net > floor && (!best || net > best.gain))
                best = { x: x0, y: y0, ways: [...ways], gain: net };
            dfs(n[0], n[1], g, side);
            ways.pop();
            // (undo)
            const t = b[x][y];
            b[x][y] = b[n[0]][n[1]];
            b[n[0]][n[1]] = t;
        }
    };
    let x0 = 0, y0 = 0;
    for (x0 = 0; x0 < COLS; x0++)
        for (y0 = 0; y0 < b[x0].length; y0++) {
            if (b[x0][y0] === SPICE)
                continue;
            dfs(x0, y0, 0, 1);
            dfs(x0, y0, 0, -1);
        }
    return best;
}
/** Every drag of one piece up to `reach` long, with its gain (for setting one up for the next). */
function allDrags(cols, s, reach) {
    const b = cols.map((c) => [...c]), out = [], ways = [];
    let x0 = 0, y0 = 0;
    const dfs = (x, y, gain, side) => {
        if (ways.length >= reach)
            return;
        for (const d of side > 0 ? [UP_RIGHT, DOWN_RIGHT] : [UP_LEFT, DOWN_LEFT]) {
            const n = neighbourOn(b, x, y, d);
            if (!n || !canSwapOn(b, x, y, n[0], n[1]))
                continue;
            const g = gain + swapGain(b, x, y, n[0], n[1], s);
            ways.push(d);
            out.push({ x: x0, y: y0, ways: [...ways], gain: g - W.SWAP * ways.length });
            dfs(n[0], n[1], g, side);
            ways.pop();
            const t = b[x][y];
            b[x][y] = b[n[0]][n[1]];
            b[n[0]][n[1]] = t;
        }
    };
    for (x0 = 0; x0 < COLS; x0++)
        for (y0 = 0; y0 < b[x0].length; y0++) {
            if (b[x0][y0] === SPICE)
                continue;
            dfs(x0, y0, 0, 1);
            dfs(x0, y0, 0, -1);
        }
    return out;
}
/** Whether a junk piece has a piece of the other junk colour beside it (a pair, to crawl with). */
function pairAt(cols, x, y) {
    const p = cols[x][y];
    if (p !== BLACK && p !== BROWN)
        return false;
    for (let w = 0; w < 4; w++) {
        const n = neighbourOn(cols, x, y, w);
        const q = n ? cols[n[0]][n[1]] : -1;
        if ((p === BLACK && q === BROWN) || (p === BROWN && q === BLACK))
            return true;
    }
    return false;
}
/** Make a drag on a board (a copy's), as the rules would. */
function apply(cols, d) {
    let x = d.x, y = d.y;
    for (const w of d.ways) {
        const n = neighbourOn(cols, x, y, w);
        const t = cols[x][y];
        cols[x][y] = cols[n[0]][n[1]];
        cols[n[0]][n[1]] = t;
        [x, y] = n;
    }
}
/** A drag that sets up the next: when no single drag gains, the best pair of drags, the first one
    allowed to cost a little (the crawl's first half, the leapfrog's, the figure of eight's). Only the
    first is made; the second is then a plain drag. Junk pieces only, the few by a piece of the other
    junk colour (a pair), as a player would look for them. */
export function bestSetup(cols, s, reach) {
    const firsts = allDrags(cols, s, Math.min(reach, 4)).filter((d) => d.gain >= -3 && (W.ANY_SETUP || pairAt(cols, d.x, d.y)))
        .sort((a, b) => b.gain - a.gain).slice(0, W.SETUPS);
    let best = null;
    for (const f of firsts) {
        const b = cols.map((c) => [...c]);
        apply(b, f);
        const then = bestDrag(b, s, reach);
        if (!then)
            continue;
        const total = f.gain + then.gain;
        if (total > 0.5 && (!best || total > best.gain))
            best = { ...f, gain: total, setup: true };
    }
    return best;
}
/** Two pieces moved together, a few swaps of one then the other, as the crawl (a black and a brown
    level through whites, three swaps a column), the figure of eight (a pair up or down through
    whites) and the hook move them: for a piece out of place that no drag of its own gets out, with
    each piece beside it of another colour as its partner. The pairs nearest the furnace first. */
export function bestPair(cols, s, depth = W.PAIR_DEPTH) {
    const b = cols.map((c) => [...c]);
    const lost = [];
    for (let x = COLS - 1; x >= 0; x--)
        for (let y = 0; y < b[x].length; y++)
            if (wants(b[x][y], x, s))
                lost.push([x, y]);
    let best = null;
    const steps = [];
    const pos = [[0, 0], [0, 0]];
    const dfs = (gain) => {
        if (steps.length >= depth)
            return;
        for (let i = 0; i < 2; i++)
            for (let d = 0; d < 4; d++) {
                const [x, y] = pos[i], n = neighbourOn(b, x, y, d);
                if (!n || !canSwapOn(b, x, y, n[0], n[1]))
                    continue;
                const g = gain + swapGain(b, x, y, n[0], n[1], s);
                const j = 1 - i, other = pos[j][0] === n[0] && pos[j][1] === n[1];
                steps.push([x, y, d]);
                pos[i] = n;
                if (other)
                    pos[j] = [x, y];
                const net = g - W.SWAP * steps.length;
                if (net > 0.5 && (!best || net > best.gain))
                    best = { steps: [...steps], gain: net };
                dfs(g);
                pos[i] = [x, y];
                if (other)
                    pos[j] = n;
                steps.pop();
                const t = b[x][y];
                b[x][y] = b[n[0]][n[1]];
                b[n[0]][n[1]] = t;
            }
    };
    let tried = 0;
    for (const [x, y] of lost) {
        if (tried >= W.PAIRS)
            break;
        const p = b[x][y];
        for (let d = 0; d < 4; d++) {
            const n = neighbourOn(b, x, y, d);
            if (!n)
                continue;
            const q = b[n[0]][n[1]];
            if (q === SPICE || kindOfPiece(q) === kindOfPiece(p))
                continue;
            tried++;
            pos[0] = [x, y];
            pos[1] = n;
            dfs(0);
        }
    }
    return best;
}
const kindOfPiece = (p) => (p === BURNT ? WHITE : p);
/** The whites on the board (not burnt), and its junk. */
export function counts(cols) {
    let whites = 0, junk = 0;
    for (const c of cols)
        for (const p of c) {
            if (p === WHITE)
                whites++;
            else if (isJunk(p))
                junk++;
        }
    return { whites, junk };
}
/** Whether the column by the furnace is ready to go: a junk column (no whites, and it burns), or a
    Crystal Clear. */
export function ready(cols, s) {
    const col = cols[COLS - 1];
    let whites = 0, junk = 0, weight = 0;
    for (const p of col) {
        if (p === WHITE) {
            whites++;
            weight--;
        }
        else if (p === BURNT) {
            junk++;
            weight--;
        }
        else if (p === BLACK) {
            junk++;
            weight++;
        }
        else if (p === BROWN)
            junk++;
    }
    return s.stage === 'junk' || s.burns > 0 ? whites === 0 && weight > 0 : junk === 0;
}
/** A distiller of a tier: its sense of where the session is, and its next move. */
export class DistillBot {
    tier;
    sense;
    /** Two drags of a pair made, by the stage of the game (early, mid, late, by the junk left). */
    setups = { early: 0, mid: 0, late: 0 };
    drags = 0;
    /** Whites on the board, in columns, as the chain started. */
    banked = null;
    quit = false;
    constructor(tier) {
        this.tier = tier;
        this.sense = { stage: tier.bank > 0 ? 'junk' : 'chain', burns: 0, junkFrom: COLS, whiteFrom: 0, whiteTo: 0 };
    }
    /** Lay out the zones for the board now: Stage I, as many junk columns by the furnace as the junk
        fills; Stage II, the junk columns still to burn, then as many white columns left of them as the
        whites fill. */
    zones(g) {
        const { whites, junk } = counts(g.cols), s = this.sense;
        if (s.stage === 'junk') {
            const k = Math.max(1, Math.min(W.KMAX, Math.floor(junk / 8.5))), m = Math.floor(whites / 8.5);
            this.sense = { ...s, junkFrom: COLS - k, whiteFrom: Math.max(0, COLS - k - m), whiteTo: COLS - k };
        }
        else {
            const jf = COLS - s.burns, m = Math.max(1, Math.floor(whites / 8.5));
            this.sense = { ...s, junkFrom: jf, whiteFrom: Math.max(0, jf - m), whiteTo: jf };
        }
    }
    /** Decision time: switch to the chain when the bank's made or the junk's running out. The junk
        columns still on the right (more junk than whites) go out first. */
    decide(g) {
        if (this.sense.stage !== 'junk')
            return;
        const { whites, junk } = counts(g.cols);
        if (whites < this.tier.bank * 8.5 && junk > 12)
            return;
        let burns = 0;
        for (let x = COLS - 1; x >= 0; x--) {
            const c = g.cols[x];
            const w = c.filter((p) => p === WHITE).length;
            if (w * 2 >= c.length)
                break;
            burns++;
        }
        this.sense = { ...this.sense, stage: 'chain', burns };
    }
    /** A column went: count down the junk columns, note the bank, and quit when the chain breaks. */
    seen(col, g) {
        if (this.sense.stage === 'chain' && this.sense.burns > 0)
            this.sense = { ...this.sense, burns: this.sense.burns - 1 };
        else if (this.sense.stage === 'chain' && col.chain === 1 && this.banked === null)
            this.banked = (counts(g.cols).whites + col.whites) / 8.5;
        if (this.tier.dismiss && this.sense.stage === 'chain' && this.sense.burns === 0 && col.chain === 0 && g.longest > 0)
            this.quit = true;
    }
    plan(g) {
        if (this.quit)
            return { kind: 'dismiss' };
        this.decide(g);
        this.zones(g);
        const s = this.sense, t = this.tier;
        const drag = bestDrag(g.cols, s, t.reach);
        const isReady = ready(g.cols, s);
        // Burn the column as soon as it's ready, unless there's still a drag worth making by it.
        if (t.early && isReady && (!drag || drag.gain < 2))
            return { kind: 'burn' };
        if (drag)
            return { kind: 'drag', drag };
        if (t.pairs) {
            const junk = counts(g.cols).junk, stage = junk > 40 ? 'early' : junk > 18 ? 'mid' : 'late';
            const pair = bestPair(g.cols, s);
            if (pair) {
                this.setups[stage]++;
                return { kind: 'pair', pair };
            }
            const setup = bestSetup(g.cols, s, t.reach);
            if (setup) {
                this.setups[stage]++;
                return { kind: 'drag', drag: setup };
            }
        }
        return { kind: 'wait' };
    }
}
/** Play a session through with a bot: each swap takes 1 / rate of a second, each drag a moment to spot
    first; the furnace runs on meanwhile. Stops at `cap` minutes of play. `onColumn` sees each column. */
export function playSession(g, tier, cap = 30, onColumn) {
    const bot = new DistillBot(tier), swapMs = 1000 / tier.rate;
    let went = false;
    const handle = (ev) => {
        for (const e of ev)
            if (e.kind === 'column') {
                went = true;
                bot.seen(e.column, g);
                onColumn?.(e.column);
            }
    };
    while (!g.finished && g.time < cap * 60000) {
        if (g.sliding > 0) {
            handle(g.tick(g.sliding));
            continue;
        }
        const p = bot.plan(g);
        if (p.kind === 'dismiss') {
            g.dismiss();
            break;
        }
        if (p.kind === 'burn') {
            handle(g.burnNow());
            handle(g.tick(tier.spot));
            continue;
        }
        if (p.kind === 'wait') {
            handle(g.tick(Math.max(1, Math.min(250, g.timeLeft()))));
            continue;
        }
        went = false;
        if (p.kind === 'pair') {
            // Each run of swaps of one piece is a drag: a moment to spot it first.
            let last = null;
            for (const [x, y, w] of p.pair.steps) {
                if (!last || last[0] !== x || last[1] !== y) {
                    handle(g.tick(tier.spot));
                    bot.drags++;
                }
                if (went || !g.movable)
                    break;
                const n = g.swapToward(x, y, w);
                if (!n)
                    break;
                last = n;
                handle(g.tick(swapMs));
            }
            continue;
        }
        handle(g.tick(tier.spot));
        bot.drags++;
        let x = p.drag.x, y = p.drag.y;
        for (const w of p.drag.ways) {
            if (went || !g.movable)
                break;
            const n = g.swapToward(x, y, w);
            if (!n)
                break;
            [x, y] = n;
            handle(g.tick(swapMs));
        }
    }
    return {
        tier: tier.name, longest: g.longest, score: g.score(), points: g.points, columnsUp: g.columnsUp,
        columnsBurned: g.columns.length - g.columnsUp, whitesBurned: g.whitesBurned, minutes: g.time / 60000,
        swaps: g.swaps, banked: bot.banked, dismissed: g.dismissed, finished: g.finished, setups: bot.setups,
    };
}
