/* Bots that distil, and the planner behind them and "Help, Helium": Distilling (src/distilling.ts) played
   by its techniques, each a routine of src/distill-routines.ts, picked by stage. TypeScript, compiled to
   js/distill-bots.js; tested in tests/distill-bots.test.ts; run over many seeded boards by
   tools/distill-bots.mjs, whose numbers are DISTILLING.md §4's goals.

   Every tier plays the same plan, the user's (12 Nov: "It's always whites to the left. There's no
   reason to do any other strategy"): whites left, junk right, a junk column at a time, never a white
   burned on purpose; then, with enough whites banked, the chain, whites right. The tiers differ in which
   techniques they can pull off (their routines) and how fast (a moment to spot each drag, and a hand's
   speed along it), and how much they bank before the chain.

   The planner (`choose`): the stage says which routines are on the menu, the board which of them apply.
   In Stage I every move they offer, a plain drag or a technique alike, is judged by the board it leaves
   (src/distill-score.ts: junk columns filled from the right, colour pulled right, then a straight upright
   wall; nothing trapped), the score it gains a second of a person's time, one look ahead (the user, 12 Nov, the eleventh note: "even just as a test of
   moves"); the cheap plain drag that does as well wins, and a long plain one is the sweep, swept blind. In
   the chain, a move is weighed by how much it betters the board (distill-routines' `measure`) less the
   time it takes. With time short, only what saves the furnace's column. A column
   ready to go is burned at once when nothing worth doing is left (the better tiers). In the chain, past
   a few Crystal Clears, the top tiers take the endgame's gamble the way a player does (the user, 12 Nov:
   "like a game of Russian roulette"): chase the next column while the odds are fair, cash in (dismiss)
   when it can't be filled in time. When a piece is stuck where it can't go its way (a white trapped at the
   top, junk in a column still to go up) and none of the routines it knows unsticks anything, the better
   tiers search for a piece to bring round into its place (src/distill-path.ts, the user, 13 Nov: "model it
   as a path ... A-star"), judged like any other move.

   `advise(board)` is the planner for anyone's board, a person's mid-game: the stage, the routine it would
   play now, why in a line, and its drags. "Help, Helium" will show that on the player's own board. */
import { BROWN, COLS, DOWN_LEFT, DOWN_RIGHT, SPICE, UP_LEFT, UP_RIGHT, WHITE, neighbourOn } from './distilling.js';
import { M, ROUTINES, burnsClean, clear, colourLeft, fillTarget, isJunk, junkTarget, measure, playDrags, swapsIn, whitesFrom, } from './distill-routines.js';
import { boardScore } from './distill-score.js';
import { pathMoves, stuck } from './distill-path.js';
/** The path search's name for a player. */
export const PATH_LABEL = 'Bring a piece round';
const BASIC = ['rescue', 'junkColumn', 'diamond', 'channel'];
export const TIERS = [
    { name: 'learner', label: 'Learner', rate: 4, spot: 900, sweepSpot: 400, bank: 4, reach: 6, routines: BASIC, early: false, dismiss: false, gamble: false },
    { name: 'master', label: 'Able to Master', rate: 5, spot: 500, sweepSpot: 150, bank: 6, reach: 10, routines: [...BASIC, 'turnOver', 'crawl', 'store', 'leapfrog'], path: true, early: true, dismiss: true, gamble: false },
    { name: 'grandmaster', label: 'Grand-Master to Legendary', rate: 6, spot: 350, sweepSpot: 100, bank: 6, reach: 14, routines: [...BASIC, 'turnOver', 'crawl', 'store', 'leapfrog', 'figureEight', 'hook'], path: true, early: true, dismiss: true, gamble: true },
    { name: 'ultimate', label: 'Ultimate', rate: 6, spot: 250, sweepSpot: 80, bank: 6, reach: 16, routines: [...BASIC, 'turnOver', 'crawl', 'store', 'leapfrog', 'figureEight', 'hook', 'linePull'], path: true, early: true, dismiss: true, gamble: true },
];
export const tierNamed = (name) => {
    const t = TIERS.find((x) => x.name === name);
    if (!t)
        throw new Error(`no tier "${name}"`);
    return t;
};
/** The routines on the menu in each stage, in the order they're preferred when they'd do as well. */
export const MENU = {
    junk: ['rescue', 'junkColumn', 'turnOver', 'crawl', 'diamond', 'leapfrog', 'hook', 'figureEight', 'linePull', 'store'],
    chain: ['rescue', 'junkColumn', 'crawl', 'channel', 'diamond', 'leapfrog', 'hook', 'figureEight', 'linePull'],
};
/** The planner's weights (exported to tune from tools/distill-bots.mjs's PLAN). */
export const P = {
    /** A routine's cost: what each second of a person's time is worth in the chain (timeFor), and each turn
        within a drag. */
    PER_SEC: 1,
    TURN_MS: 60,
    /** The chain: the least a routine must better the board by (`measure`) to be worth it. */
    MIN: 0.3,
    /** Stage I, judged by the board score (src/distill-score.ts) a second of a person's time: the least a
        move must get to be worth it, and the most for a ready column to burn at once rather than wait while
        it's done. */
    RATE_MIN: 0.15,
    SLACK: 1,
    /** ms left on the furnace below which only what saves its column counts. */
    URGENT: 5000,
    /** The gamble: from this many Crystal Clears in a row, a chain is cashed in when its next column can't
        be filled in time. */
    CASH_FROM: 3,
    /** ... looked at only in its last few seconds, when what's left can be judged. */
    CASH_MS: 4000,
    /** Stage I: how many columns past the one being built are kept clear of whites too. */
    AHEAD: 1,
    /** A sweep: one plain drag at least this long, all one way across, swept blind (no pause to think). */
    SWEEP_LONG: 3,
    /** The chain: each swap that takes a piece back the wrong way. */
    BACK: 0.6,
};
/** Junk in the furnace's column (spice is fine in a Crystal Clear). */
const junkAt = (col) => col.filter((p) => p !== WHITE && p !== SPICE).length;
/** The ms a move takes at a pace. */
const msFor = (drags, s, sweep = false) => drags.length * (sweep ? s.sweepSpot : s.spot) + (swapsIn(drags) * 1000) / s.rate;
/** The context for a stage: Stage I, the junk column being built (and those done right of it) burn;
    Stage II, the last `burns` columns burn, and the rightmost left of them not yet clear is filled. */
export function contextFor(cols, stage, burns, reach) {
    // Stage I: the junk column being built and the next one with it, so the next one's whites are out
    // before it's the furnace's ("one column at a time ... to give yourself breathing room").
    if (stage === 'junk') {
        const t = Math.max(0, junkTarget(cols) - P.AHEAD);
        return { stage, burnFrom: t, fill: t, reach };
    }
    const burnFrom = COLS - burns;
    return { stage, burnFrom, fill: fillTarget(cols, burnFrom), reach };
}
/** A sweep: one plain drag, long, every swap the same way across (left or right), so it's swept blind with
    hardly a pause (the user, 12 Nov: "It's just quick drag motions ... go, go, go"). */
export function plainDrag(drags) {
    if (drags.length !== 1 || drags[0].ways.length < P.SWEEP_LONG)
        return false;
    const right = (w) => w === UP_RIGHT || w === DOWN_RIGHT, r = right(drags[0].ways[0]);
    return drags[0].ways.every((w) => right(w) === r);
}
/** The brown sweep: a brown taken up through the whites and back down through the blacks, to the bottom right
    (the diamond's brown run). */
export function brownSweep(cols, drags) {
    if (!drags.length || cols[drags[0].x][drags[0].y] !== BROWN)
        return false;
    const ways = drags[0].ways, up = ways.findIndex((w) => w === UP_RIGHT || w === UP_LEFT);
    return up >= 0 && ways.slice(up + 1).some((w) => w === DOWN_RIGHT || w === DOWN_LEFT);
}
/** Whites left in the junk columns from x on (those more junk than white): the columns next to burn still to
    clear. */
export function whitesInJunk(cols, x) {
    let n = 0;
    for (let i = Math.max(0, x); i < COLS; i++) {
        const w = cols[i].filter((p) => p === WHITE).length;
        if (cols[i].filter(isJunk).length > w)
            n += w;
    }
    return n;
}
/** Stage I: a move judged by the board it leaves (src/distill-score.ts), the score it gains a second of a
    person's time (the user, 12 Nov, the eleventh note: "even just as a test of moves"). One look ahead, no
    search. Its last drag is let go where that's best: carried on while each swap still gets something over,
    stopped before it only climbs through the junk (a black sent on up through the browns gets nothing). */
export function judge(cols, drags, style, base = boardScore(cols)) {
    if (!drags.length)
        return null;
    const init = drags.slice(0, -1), last = drags[drags.length - 1];
    let best = null;
    for (let k = last.ways.length; k >= 1; k--) {
        const d = [...init, { x: last.x, y: last.y, ways: last.ways.slice(0, k) }];
        const after = playDrags(cols, d);
        if (!after)
            continue;
        const value = (boardScore(after) - base) / (timeFor(d, style, plainDrag(d)) / 1000);
        if (!best || value > best.value)
            best = { drags: d, value };
    }
    return best;
}
/** Turns within a move's drags: each change of way while a piece is held. */
export const turnsIn = (drags) => drags.reduce((n, d) => n + d.ways.filter((w, i) => i > 0 && w !== d.ways[i - 1]).length, 0);
/** The junk's whole way across: every junk piece's column, added up (a swap taking junk right adds one). */
export function junkAcross(cols) {
    let n = 0;
    cols.forEach((c, x) => { for (const p of c)
        if (isJunk(p))
            n += x; });
    return n;
}
/** A move's cost in a person's time (the user, 12 Nov: "that kind of one smooth mouse motion is cheap. It's
    quick"): a moment to spot and pick up each drag, its swaps at a hand's speed, a little for each turn. */
export const timeFor = (drags, s, sweep = false) => drags.length * (sweep ? s.sweepSpot : s.spot) + (swapsIn(drags) * 1000) / s.rate + P.TURN_MS * turnsIn(drags);
/** A move's swaps that take a piece the wrong way, back over ground already won (the user, 12 Nov, the tenth
    note: "each time you kind of loop or go back, you're basically undoing some progress"): junk going back left
    in Stage I (right in the chain), a white going back right (left in the chain). */
export function backward(cols, drags, stage) {
    const side = stage === 'junk' ? 1 : -1, b = cols.map((c) => [...c]);
    let n = 0;
    for (const d of drags) {
        let [x, y] = [d.x, d.y];
        for (const w of d.ways) {
            const to = neighbourOn(b, x, y, w);
            if (!to)
                break;
            const p = b[x][y], dx = to[0] - x;
            if ((isJunk(p) && dx * side < 0) || (p === WHITE && dx * side > 0))
                n++;
            b[x][y] = b[to[0]][to[1]];
            b[to[0]][to[1]] = p;
            [x, y] = to;
        }
    }
    return n;
}
/** Every move of the routines the style knows, on the board now, weighed, best first. Stage I: by the board
    score it gains a second of a person's time (`judge`), its last drag let go where that's best. The chain:
    how much it betters the board (`measure`), less the person's time it takes and the ground it gives back.
    With time short on a column that needs saving, only moves that save it in time. */
export function weigh(sit, ctx, style) {
    const { cols } = sit, last = COLS - 1, burning = ctx.burnFrom <= last, one = ctx.stage === 'junk';
    const base = one ? boardScore(cols) : measure(cols, ctx);
    const wrong = (b) => (burning ? b[last].filter((p) => p === WHITE).length : junkAt(b[last]));
    const urgent = sit.timeLeft < P.URGENT && wrong(cols) > 0;
    const out = [];
    const near = one ? whitesInJunk(cols, ctx.burnFrom) : 0;
    const consider = (found) => {
        const j = one ? judge(cols, found.drags, style, base) : null;
        const move = j ? { ...found, drags: j.drags } : found;
        const after = playDrags(cols, move.drags);
        if (!after || (one && !j))
            return;
        if (urgent && (wrong(after) >= wrong(cols) || msFor(move.drags, style, plainDrag(move.drags)) > sit.timeLeft))
            return;
        // The brown sweep waits till the columns next to burn are clear of white (the user, 13 Nov: "it's very good.
        // But it's just like it leaves one or two trapped whites ... it's being applied a bit too quickly before those
        // columns have been cleared"): till then it's played only when it takes a white out of them.
        if (one && near > 0 && brownSweep(cols, move.drags) && whitesInJunk(after, ctx.burnFrom) >= near)
            return;
        const value = j ? j.value : measure(after, ctx) - base - P.PER_SEC * timeFor(move.drags, style) / 1000 - P.BACK * backward(cols, move.drags, ctx.stage);
        out.push({ move, value });
    };
    for (const name of MENU[ctx.stage]) {
        if (!style.routines.includes(name))
            continue;
        for (const found of ROUTINES[name].find(cols, ctx))
            consider(found);
    }
    // The fallback: a piece stuck that nothing the routines offer unsticks (it's still stuck where it is after
    // every one of them): bring a piece round to take its place.
    if (style.path) {
        let left = stuck(cols, ctx);
        const at = (s) => `${s.x},${s.y}`;
        for (const m of out) {
            if (!left.length)
                break;
            const still = new Set(stuck(playDrags(cols, m.move.drags), ctx).map(at));
            left = left.filter((s) => still.has(at(s)));
        }
        if (left.length)
            for (const found of pathMoves(cols, ctx, style, left))
                consider(found);
    }
    return out.sort((a, b) => b.value - a.value);
}
/** Pick the routine for the board now (see the header). */
export function choose(sit, ctx, style) {
    const { cols } = sit, last = COLS - 1;
    const burning = ctx.burnFrom <= last;
    const furnace = cols[last];
    const ready = burning ? burnsClean(furnace) : clear(furnace);
    // What's wrong with the furnace's column, to save it when time's short.
    const wrong = (b) => (burning ? b[last].filter((p) => p === WHITE).length : junkAt(b[last]));
    const moves = weigh(sit, ctx, style);
    const best = moves[0] && moves[0].value > (ctx.stage === 'junk' ? P.RATE_MIN : P.MIN) ? moves[0] : null;
    const advice = (kind, label, reason, m = null) => ({
        stage: ctx.stage, kind, routine: !m ? null : m.move.routine === 'path' ? 'hook' : m.move.routine, technique: m?.move.routine ?? null,
        label, reason, drags: m?.move.drags ?? [], value: m?.value ?? 0, sweep: false,
    });
    // The endgame's gamble: the next Crystal Clear can't be filled in time.
    if (style.gamble && !burning && sit.chain >= P.CASH_FROM && !ready && sit.timeLeft < P.CASH_MS) {
        const need = junkAt(furnace), saving = moves.filter((m) => m.value > P.MIN && wrong(playDrags(cols, m.move.drags)) < need);
        const perFix = style.spot + 4000 / style.rate;
        if (!saving.length || need * perFix > sit.timeLeft) {
            return advice('dismiss', 'Cash in', `the gamble: CC^${sit.chain} so far, and the next column needs ${need} more white${need > 1 ? 's' : ''} in ${(sit.timeLeft / 1000).toFixed(0)} s. Poor odds: cash in now`);
        }
    }
    // Burn a ready column at once when nothing much is left to do; in the chain, only when nothing is (a
    // Crystal Clear burned early is time lost ferrying whites for the next).
    if (ready && style.early && (!best || (ctx.stage === 'junk' && best.value < P.SLACK))) {
        return advice('burn', 'Burn now', burning ? "the furnace's column is all junk: burn it now" : 'the column is Crystal Clear: send it up now');
    }
    // A plain long drag that wins is the sweep, swept blind: no technique needed, "quick drag brown up, black
    // down, done" (the eleventh note).
    if (best && ctx.stage === 'junk' && plainDrag(best.move.drags)) {
        return { ...advice('move', 'The sweep', `go, go, go: ${best.move.reason}`, best), sweep: true };
    }
    if (best) {
        const gamble = !burning && sit.chain >= P.CASH_FROM && !ready && style.gamble
            ? ` (the gamble: CC^${sit.chain} so far, chasing the next while the odds are fair)` : '';
        return advice('move', best.move.routine === 'path' ? PATH_LABEL : ROUTINES[best.move.routine].label, best.move.reason + gamble, best);
    }
    return advice('wait', 'Wait', ready ? 'the column is ready: let the furnace take it' : 'nothing worth moving: wait for the next column');
}
/** Whites, and junk, on the board. */
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
/** Whether it's decision time in Stage I: the whites banked make `bank` columns, or too little junk is
    left to finish the junk column being built. */
export function decisionTime(cols, bank) {
    const t = junkTarget(cols), { whites } = counts(cols);
    let junkLeft = 0;
    for (let x = 0; x < t; x++)
        for (const p of cols[x])
            if (isJunk(p))
                junkLeft++;
    const need = cols[t].filter((p) => p === WHITE).length;
    return whites >= bank * 8.5 || junkLeft < need;
}
/** The junk columns still to burn at decision time: the ones done on the right, and the one being built
    if it's mostly junk. */
export function burnsLeft(cols) {
    // From the furnace, every column that's more junk than whites: those are finished as junk (their
    // whites saved) and burned, so the chain starts on a column that's mostly white.
    let n = 0;
    while (n < COLS - 1) {
        const col = cols[COLS - 1 - n], whites = col.filter((p) => p === WHITE).length;
        if (whites * 2 >= col.length && !burnsClean(col))
            break;
        n++;
    }
    return n;
}
/** The pace "Help, Helium" plays at, and every technique. */
export const HELIUM = { routines: Object.keys(ROUTINES), path: true, reach: 16, rate: 6, spot: 250, sweepSpot: 80, early: true, gamble: true };
/** The planner on anyone's board mid-game, a person's: it reads the stage from the board (the chain
    started, or the whites banked, or the junk run out), then picks the routine as the bots do. */
export function advise(g, o = {}) {
    const cols = g.cols, chain = g.chain ?? 0, timeLeft = g.timeLeft ?? Infinity;
    const two = chain > 0 || decisionTime(cols, o.bank ?? 8);
    const burns = chain > 0 ? 0 : two ? burnsLeft(cols) : 0;
    return choose({ cols, chain, timeLeft }, contextFor(cols, two ? 'chain' : 'junk', burns, HELIUM.reach), HELIUM);
}
/** A distiller of a tier: where it is in its run, and its next move. */
export class DistillBot {
    tier;
    stage = 'junk';
    /** Stage II's junk columns still to go out before the chain. */
    burns = 0;
    /** Whites on the board, in columns, as the chain started. */
    banked = null;
    quit = false;
    /** Drags made, and how often each routine was played. */
    drags = 0;
    used = {};
    /** What it's doing now (the test page shows its label). */
    last = null;
    constructor(tier) { this.tier = tier; }
    plan(g) {
        if (this.quit)
            return this.say({ stage: this.stage, kind: 'dismiss', routine: null, label: 'Dismiss', reason: 'the chain is over: dismiss and keep the score', drags: [], value: 0, sweep: false });
        if (this.stage === 'junk' && decisionTime(g.cols, this.tier.bank)) {
            this.stage = 'chain';
            this.burns = burnsLeft(g.cols);
        }
        const ctx = contextFor(g.cols, this.stage, this.burns, this.tier.reach);
        const a = choose({ cols: g.cols, chain: g.chain, timeLeft: g.timeLeft() }, ctx, this.tier);
        if (a.kind === 'dismiss')
            this.quit = true;
        const t = a.technique ?? a.routine;
        if (t)
            this.used[t] = (this.used[t] ?? 0) + 1;
        return this.say(a);
    }
    say(a) { this.last = a; return a; }
    /** A column went: count down the junk columns, note the bank, and quit when the chain breaks. */
    seen(col, g) {
        if (this.stage !== 'chain')
            return;
        if (this.burns > 0) {
            this.burns--;
            return;
        }
        if (col.chain === 1 && this.banked === null)
            this.banked = (whitesFrom(g.cols, 0) + col.whites) / 8.5;
        if (this.tier.dismiss && col.chain === 0 && g.longest > 0)
            this.quit = true;
    }
}
/** Play a session through with a bot: each drag a moment to spot, then swept at the tier's hand speed;
    the furnace runs on meanwhile. Stops at `cap` minutes of play. `onColumn` sees each column, `onPlan`
    each decision. */
export function playSession(g, tier, cap = 30, onColumn, onPlan) {
    const bot = new DistillBot(tier), swapMs = 1000 / tier.rate, cost = {};
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
        const a = bot.plan(g);
        onPlan?.(a);
        if (a.kind === 'dismiss') {
            g.dismiss();
            break;
        }
        if (a.kind === 'burn') {
            handle(g.burnNow());
            handle(g.tick(tier.spot));
            continue;
        }
        if (a.kind === 'wait') {
            handle(g.tick(Math.max(1, Math.min(250, g.timeLeft()))));
            continue;
        }
        went = false;
        let ok = true;
        const was = a.stage === 'junk' ? junkAcross(g.cols) : 0, share = colourLeft(g.cols), t0 = g.time;
        for (const d of a.drags) {
            handle(g.tick(a.sweep ? tier.sweepSpot : tier.spot));
            bot.drags++;
            let x = d.x, y = d.y;
            for (const w of d.ways) {
                if (went || !g.movable)
                    break;
                const n = g.swapToward(x, y, w);
                if (!n) {
                    ok = false;
                    break;
                }
                [x, y] = n;
                handle(g.tick(swapMs));
            }
            if (went || !ok)
                break;
        }
        if (a.stage === 'junk' && !went && a.routine) {
            const k = a.sweep ? 'sweep' : (a.technique ?? a.routine), c = (cost[k] ??= { plenty: 0, middle: 0, scarce: 0, ms: 0, over: 0 });
            c[share > 0.45 ? 'plenty' : share > M.SCARCE ? 'middle' : 'scarce']++;
            c.ms += g.time - t0 + P.TURN_MS * turnsIn(a.drags);
            c.over += junkAcross(g.cols) - was;
        }
    }
    return {
        tier: tier.name, longest: g.longest, score: g.score(), points: g.points, columnsUp: g.columnsUp,
        columnsBurned: g.columns.length - g.columnsUp, whitesBurned: g.whitesBurned, minutes: g.time / 60000,
        swaps: g.swaps, drags: bot.drags, banked: bot.banked, dismissed: g.dismissed, finished: g.finished, used: bot.used, cost,
    };
}
