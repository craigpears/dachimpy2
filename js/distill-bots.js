/* Bots that distil, and the planner behind them and "Help, Helium": Distilling (src/distilling.ts) played
   by its techniques, each a routine of src/distill-routines.ts, picked by stage. TypeScript, compiled to
   js/distill-bots.js; tested in tests/distill-bots.test.ts; run over many seeded boards by
   tools/distill-bots.mjs, whose numbers are DISTILLING.md §4's goals.

   Every tier plays the same plan, the user's (12 Nov: "It's always whites to the left. There's no
   reason to do any other strategy"): whites left, junk right, a junk column at a time, never a white
   burned on purpose; then, with enough whites banked, the chain, whites right. The tiers differ in which
   techniques they can pull off (their routines) and how fast (a moment to spot each drag, and a hand's
   speed along it), and how much they bank before the chain.

   The planner (`choose`): the stage says which routines are on the menu, the board which of them apply,
   and each routine's drags are weighed by how much they better the board (distill-routines' `measure`)
   for the swaps and drags they take; with time short, only what saves the furnace's column. A column
   ready to go is burned at once when nothing worth doing is left (the better tiers). In the chain, past
   a few Crystal Clears, the top tiers take the endgame's gamble the way a player does (the user, 12 Nov:
   "like a game of Russian roulette"): chase the next column while the odds are fair, cash in (dismiss)
   when it can't be filled in time.

   `advise(board)` is the planner for anyone's board, a person's mid-game: the stage, the routine it would
   play now, why in a line, and its drags. "Help, Helium" will show that on the player's own board. */
import { COLS, SPICE, WHITE } from './distilling.js';
import { ROUTINES, burnsClean, clear, fillTarget, isJunk, junkTarget, measure, playDrags, swapsIn, whitesFrom, } from './distill-routines.js';
const BASIC = ['rescue', 'junkColumn', 'diamond', 'channel'];
export const TIERS = [
    { name: 'learner', label: 'Learner', rate: 4, spot: 900, bank: 4, reach: 6, routines: BASIC, early: false, dismiss: false, gamble: false },
    { name: 'master', label: 'Able to Master', rate: 5, spot: 500, bank: 6, reach: 10, routines: [...BASIC, 'crawl', 'store', 'leapfrog'], early: true, dismiss: true, gamble: false },
    { name: 'grandmaster', label: 'Grand-Master to Legendary', rate: 6, spot: 350, bank: 6, reach: 14, routines: [...BASIC, 'crawl', 'store', 'leapfrog', 'figureEight', 'hook'], early: true, dismiss: true, gamble: true },
    { name: 'ultimate', label: 'Ultimate', rate: 6, spot: 250, bank: 6, reach: 16, routines: [...BASIC, 'crawl', 'store', 'leapfrog', 'figureEight', 'hook', 'linePull'], early: true, dismiss: true, gamble: true },
];
export const tierNamed = (name) => {
    const t = TIERS.find((x) => x.name === name);
    if (!t)
        throw new Error(`no tier "${name}"`);
    return t;
};
/** The routines on the menu in each stage, in the order they're preferred when they'd do as well. */
export const MENU = {
    junk: ['rescue', 'junkColumn', 'crawl', 'diamond', 'leapfrog', 'hook', 'figureEight', 'linePull', 'store'],
    chain: ['rescue', 'junkColumn', 'crawl', 'channel', 'diamond', 'leapfrog', 'hook', 'figureEight', 'linePull'],
};
/** The planner's weights (exported to tune from tools/distill-bots.mjs's PLAN). */
export const P = {
    /** A routine's cost: each swap, and each drag (spotting it). */
    SWAP: 0.08,
    DRAG: 0.5,
    /** The least a routine must better the board by to be worth it, and the most for a ready column to
        burn at once rather than wait while it's done. */
    MIN: 0.3,
    SLACK: 2,
    /** ms left on the furnace below which only what saves its column counts. */
    URGENT: 5000,
    /** The gamble: from this many Crystal Clears in a row, a chain is cashed in when its next column can't
        be filled in time. */
    CASH_FROM: 3,
    /** ... looked at only in its last few seconds, when what's left can be judged. */
    CASH_MS: 4000,
    /** Stage I: how many columns past the one being built are kept clear of whites too. */
    AHEAD: 1,
};
/** Junk in the furnace's column (spice is fine in a Crystal Clear). */
const junkAt = (col) => col.filter((p) => p !== WHITE && p !== SPICE).length;
/** The ms a move takes at a pace. */
const msFor = (drags, s) => drags.length * s.spot + (swapsIn(drags) * 1000) / s.rate;
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
/** Pick the routine for the board now (see the header). */
export function choose(sit, ctx, style) {
    const { cols } = sit, last = COLS - 1;
    const base = measure(cols, ctx);
    const burning = ctx.burnFrom <= last;
    const furnace = cols[last];
    const ready = burning ? burnsClean(furnace) : clear(furnace);
    // What's wrong with the furnace's column, to save it when time's short.
    const wrong = (b) => (burning ? b[last].filter((p) => p === WHITE).length : junkAt(b[last]));
    const urgent = sit.timeLeft < P.URGENT && wrong(cols) > 0;
    const moves = [];
    for (const name of MENU[ctx.stage]) {
        if (!style.routines.includes(name))
            continue;
        for (const move of ROUTINES[name].find(cols, ctx)) {
            const after = playDrags(cols, move.drags);
            if (!after)
                continue;
            if (urgent && (wrong(after) >= wrong(cols) || msFor(move.drags, style) > sit.timeLeft))
                continue;
            const value = measure(after, ctx) - base - P.SWAP * swapsIn(move.drags) - P.DRAG * move.drags.length;
            moves.push({ move, value });
        }
    }
    moves.sort((a, b) => b.value - a.value);
    const best = moves[0] && moves[0].value > P.MIN ? moves[0] : null;
    const advice = (kind, label, reason, m = null) => ({
        stage: ctx.stage, kind, routine: m?.move.routine ?? null, label, reason, drags: m?.move.drags ?? [], value: m?.value ?? 0,
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
    if (best) {
        const gamble = !burning && sit.chain >= P.CASH_FROM && !ready && style.gamble
            ? ` (the gamble: CC^${sit.chain} so far, chasing the next while the odds are fair)` : '';
        return advice('move', ROUTINES[best.move.routine].label, best.move.reason + gamble, best);
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
export const HELIUM = { routines: Object.keys(ROUTINES), reach: 16, rate: 6, spot: 250, early: true, gamble: true };
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
            return this.say({ stage: this.stage, kind: 'dismiss', routine: null, label: 'Dismiss', reason: 'the chain is over: dismiss and keep the score', drags: [], value: 0 });
        if (this.stage === 'junk' && decisionTime(g.cols, this.tier.bank)) {
            this.stage = 'chain';
            this.burns = burnsLeft(g.cols);
        }
        const ctx = contextFor(g.cols, this.stage, this.burns, this.tier.reach);
        const a = choose({ cols: g.cols, chain: g.chain, timeLeft: g.timeLeft() }, ctx, this.tier);
        if (a.kind === 'dismiss')
            this.quit = true;
        if (a.routine)
            this.used[a.routine] = (this.used[a.routine] ?? 0) + 1;
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
        for (const d of a.drags) {
            handle(g.tick(tier.spot));
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
    }
    return {
        tier: tier.name, longest: g.longest, score: g.score(), points: g.points, columnsUp: g.columnsUp,
        columnsBurned: g.columns.length - g.columnsUp, whitesBurned: g.whitesBurned, minutes: g.time / 60000,
        swaps: g.swaps, drags: bot.drags, banked: bot.banked, dismissed: g.dismissed, finished: g.finished, used: bot.used,
    };
}
