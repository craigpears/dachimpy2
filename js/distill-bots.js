/* Bots that distil, and the planner behind them and "Help, Helium": Distilling (src/distilling.ts) played
   by its techniques, each a routine of src/distill-routines.ts, picked by stage. TypeScript, compiled to
   js/distill-bots.js; tested in tests/distill-bots.test.ts; run over many seeded boards by
   tools/distill-bots.mjs, whose numbers are DISTILLING.md §4's goals.

   Every bot plays the same plan, the user's (12 Nov: "It's always whites to the left. There's no
   reason to do any other strategy"): whites left, junk right, a junk column at a time, never a white
   burned on purpose; then, with enough whites banked, the chain, whites right. A bot is its target chain
   (the user, 13 Nov, the thirtieth note: "I want to say what is the bot's target crystal clear and it will
   try and work towards it"): CC^1, CC^2, CC^3, CC^5, CC^8 (`LEVELS`). The target sets the whites it banks
   before the chain (`bankFor`), so how long Stage I lasts, and the techniques it uses: the simple ones for
   the low targets, the crawl and the hook from CC^5, the figure of eight and the line pull for CC^8. When a
   chain breaks it doesn't dismiss: it sends up what's still banked on the right as a new chain, then goes back
   to building toward the next one ("once it's got a crystal clear one, it will start sending them up ... then
   it will start working on the next one"). All play at
   one pace (a moment to spot each drag, a hand's speed along it).

   The planner (`choose`): the stage says which routines are on the menu, the board which of them apply.
   In Stage I every move they offer, a plain drag or a technique alike, is judged by the board it leaves
   (src/distill-score.ts: junk columns filled from the right, colour pulled right, then a straight upright
   wall; nothing trapped), the score it gains a second of a person's time, one look ahead (the user, 12 Nov, the eleventh note: "even just as a test of
   moves"); the cheap plain drag that does as well wins, and a long plain one is the sweep, swept blind. In
   the chain, a move is weighed by how much it betters the board (distill-routines' `measure`) less the
   time it takes. With time short, only what saves the furnace's column. A column
   ready to go is burned at once when nothing worth doing is left, in Stage I only while the columns coming
   up to the fire next are clear of white too (the twenty-seventh note). "Help, Helium" can take the
   endgame's gamble the way a player does (the user, 12 Nov: "like a game of Russian roulette"): chase the
   next column while the odds are fair, cash in (dismiss) when it can't be filled in time. When a piece is
   stuck where it can't go its way (a white trapped at the top, junk in a column still to go up) and none of
   the routines it knows unsticks anything, it searches for a piece to bring round into its place
   (src/distill-path.ts, the user, 13 Nov: "model it as a path ... A-star"), judged like any other move. Each
   move it reads the phase the game's in (src/distill-phase.ts: the fire's side, filling the junk columns,
   blocks and the V, the chain), which tilts the techniques' worth (the user, 13 Nov: "different techniques
   have different weights depending on the stage"), all even only while a white's in danger (the
   twenty-eighth note); the advice says it, for Helium to say aloud, with its target and the whites still
   needed for it. And in Stage I it reads the board (src/distill-read.ts, from src/distill-risk.ts and
   src/distill-patterns.ts; the user, 13 Nov: "a feature that tells you there's a risk and detects it ... but also
   what kind of tactics are in play"): its state (healthy, at risk, cracked, damage control) and the tactic in play,
   whose own measure of progress ranks the moves first (`byTactic`); the advice carries both. Two drags a player
   would make as one are made one (src/distill-teach.ts, `joinPairs`, the one implementation the teaching picker uses too).
   Every drag of a move is a named trick with a goal (src/distill-goals.ts; the user, 13 Nov: "it's not going to do a
   half move for no reason"): a move with a drag that has none isn't chosen, and a drag's let go only where it gets
   something done (`judge`). And the chain's rule of thumb, shared with Helium's plan (`chainOver`, `chainContext`): a
   next column with more junk than white lets the chain go, the next started further left the bigger the target.

   `advise(board)` is the planner for anyone's board, a person's mid-game: the stage, the routine it would
   play now, why in a line, and its drags. "Help, Helium" will show that on the player's own board. */
import { BLACK, BROWN, COLS, DOWN_LEFT, DOWN_RIGHT, SPICE, TALL, UP_LEFT, UP_RIGHT, WHITE, neighbourOn } from './distilling.js';
import { M, ROUTINES, burnsClean, canGo, clear, colourLeft, fillTarget, isJunk, junkTarget, measure, playDrags, swapsIn, whitesFrom, } from './distill-routines.js';
import { blockPhase, boardScore, keptTools, trappedWhite, wall } from './distill-score.js';
import { PATH, freed, pairRescue, pathMoves, stuck } from './distill-path.js';
import { phaseOf, weightIn } from './distill-phase.js';
import { TACTICS, hoistDrags, hoistOrder, ladderDrags, moves as movesAny, nearDrags, progress, quickFills, readBoard, sorts, tailDrags, tipDrags, toolBrowns } from './distill-read.js';
import { joinPairs } from './distill-teach.js';
import { ownGoal, purposeful, stepsFor } from './distill-goals.js';
/** The path search when a white in the furnace's column has no other way out: longer drags, a wider look
    for a piece to move out of the way first. Run only then. */
export const PATH_WIDE = { ...PATH, SWAPS: 16, NODES: 6000, ENABLE_NEAR: 6, ENABLE_BOARDS: 200, ENABLE_NODES: 600 };
/** The path search's name for a player. */
export const PATH_LABEL = 'Bring a piece round';
/** The pair rescue's name for a player (`pairRescue`, src/distill-path.ts): pieces working together to free junk
    stuck on the edge of a column of whites going up. */
export const PAIR_LABEL = 'The pair rescue';
/** A long plain drag's name for a player: no technique, just swept over (`plainDrag`). */
export const SWEEP_LABEL = 'The sweep';
/** The one pace every bot plays at (the user, 13 Nov: the levels are their targets, not their speed): a hand's
    5 swaps a second along a drag, 350 ms to spot one, 100 ms between the start's blind sweeps, drags up to 14
    swaps long. */
export const PACE = { rate: 5, spot: 350, sweepSpot: 100, reach: 40 }; // (reach 40: no cap a drag would meet; the user, 13 Nov: "don't have any limits on how long an individual pull can be")
const BASIC = ['rescue', 'junkColumn', 'diamond', 'channel'];
/** The techniques each target needs (the thirtieth note: "a CC^2 with the simple ones, the crawls and hooks only
    for the longer chains"; the twenty-eighth: crawls are "for ... mid or late game"). */
const KNOWS = {
    1: BASIC,
    2: [...BASIC, 'turnOver', 'store'],
    3: [...BASIC, 'turnOver', 'store', 'leapfrog'],
    5: [...BASIC, 'turnOver', 'store', 'leapfrog', 'crawl', 'hook'],
    8: [...BASIC, 'turnOver', 'store', 'leapfrog', 'crawl', 'hook', 'figureEight', 'linePull'],
};
const level = (target) => ({ name: `cc${target}`, label: `CC^${target}`, target, routines: KNOWS[target], ...PACE, path: true, early: false, gamble: false });
/** The bots, a target chain each, lowest first. */
export const LEVELS = [1, 2, 3, 5, 8].map(level);
/** The bots' old names, for links made before the levels (`?bot=ultimate`): each the level nearest it. */
const OLD_NAMES = { learner: 'cc1', master: 'cc3', grandmaster: 'cc5', ultimate: 'cc8' };
/** A bot by its name ('cc2'), or an old tier's name. */
export const levelNamed = (name) => {
    const t = LEVELS.find((x) => x.name === (OLD_NAMES[name] ?? name));
    if (!t)
        throw new Error(`no bot "${name}"`);
    return t;
};
/** The level for a target: the highest whose target is at most it (the lowest if none). */
export const levelFor = (target) => [...LEVELS].reverse().find((l) => l.target <= target) ?? LEVELS[0];
/** The tiers' old names for the levels, for anything still keyed by them. */
export const TIERS = LEVELS;
export const tierNamed = levelNamed;
/** Columns of whites banked before the chain, for a target: enough for the chain with a little over, since new
    columns bring whites too as it goes (DISTILLING.md §4: about 8 columns banked for a CC^12). Never more than 6
    for now: banking 7 left the CC^8 bot in Stage I nearly all session (the twelfth run, 0.3 chains a session),
    as banking more did in the second run; it gets its longer chains from its techniques. */
export const bankFor = (target) => Math.max(1, Math.min(6, target));
/* (Was 3.5 + target / 2: CC^1 banked four columns before it sent one up. The user, 13 Nov: "I've got the bot on
   aiming for CC1, but it's just going and going ... it would highlight a column and say, look, I'm aiming to build
   a crystal clear one here." So a column of whites a Crystal Clear of the target, six at the most.) */
/** The whites a column holds, on average (tall and short in turn). */
export const PER_COLUMN = 8.5;
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
    /** The tie-breaker (`tieBreak`): a move doing the same job (its board score gain at most this much less) in
        the same drags and at most TIE_SWAPS more swaps; the right-hand columns it sorts, from the edge in. */
    TIE_SCORE: 0.25,
    TIE_SWAPS: 2,
    TIE_COLS: 4,
    /** The block phase: what each drag costs a person on top (`judge`), so a small move earns its place. */
    BLOCK_DRAG_MS: 400,
    /** Stage I: whites in the column before the furnace's, hard to reach, saved first too (`dangerZones`; 0 off). */
    ZONE2: 1,
    /** Stage I: a white on the top or bottom edge, or beside a spice, in the EDGE_COLS columns next to the fire, in
        danger already (`edgeWhites`, the twenty-sixth note; 0 off). */
    EDGE_COLS: 3,
    /** Stage I: a ready column is burned early only while this many columns coming up to the fire after it are
        clear of white too (the twenty-seventh note; 0, any time). */
    EARLY_CLEAR: 2,
    /** The block phase: a drag carried on at most this many swaps past where its score peaks, to where the junk
        joins up (`judge`, the twenty-ninth note; 0 off). */
    CARRY: 2,
    /** The chain: each swap that takes a piece back the wrong way. */
    BACK: 0.6,
    /** The phases' weights on the techniques (src/distill-phase.ts; 0 off, every technique even). */
    PHASES: 1,
    /** A danger zone nothing saves in one move: the best this many moves on offer are tried as the first of a short
        plan, a move setting up the save (`setUp`, the thirty-second note; 0 off). */
    SETUP: 8,
    /** Stage I: a drag carried on past where one look ahead scores best, while each swap more takes its junk further
        right and the board scores no worse (`judge`, the thirty-second note: "you could go one step further, just do
        it"; 0 off). */
    ONWARD: 1,
    /** The chain: junk stuck in a column of whites going up next, or the one after, freed first, by the pair rescue
        if need be (`chainZones`, `pairRescue`; 0 off). */
    PAIR: 1,
    /** Stage I: the board reader's tactic (src/distill-read.ts) sets the priorities (`byTactic`; 0 off). */
    READ: 1,
    /** Healthy, quick sorting: a short drag taking a black down or a brown up ranks this much higher. */
    QUICK: 1.25,
    QUICK_SWAPS: 6,
    /** Every drag a named trick with a goal (src/distill-goals.ts, the user, 13 Nov: "it's not going to do a half move for
        no reason"): a move with a drag that has none isn't chosen; the best GOAL_LOOK moves on offer are looked at for
        one that has (0 off). */
    GOALS: 1,
    GOAL_LOOK: 30,
    /** The first chain: at least this many columns by the fire burn as junk before its first column goes up (a buffer;
        `DistillBot`, the CC^1 opening; 0 off). */
    BUFFER: 2,
    /** The block phase with the junk the wrong way up: a hoist's order gained a second (`hoists`) counts this much of a
        board score gained a second (0 off). */
    HOIST: 0.4,
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
/* The chain's rule of thumb, the one the bots and Helium's plan both use (the user, 13 Nov, after Helium's plan chased a
   Crystal Clear into a column of junk: "if you've got a completely junk column, you don't try and build a whites into
   it. Yeah, you build further left. You start a new chain as far left as you can. Obviously, in the context of CC^1,
   you don't need to. But like, if you're going for the maximalist one, absolutely"; and "I wouldn't make it more
   complicated unless we find some problems"): no odds model, just more junk than white in the next column. */
/** Whether the chain can't go on into column x, the next to go up: more junk in it than whites. */
export const chainOver = (cols, x) => x >= 0 && x < COLS && cols[x].filter(isJunk).length > cols[x].filter((p) => p === WHITE).length;
/** How many columns the chain's let go over at the least, the one it can't go on into among them, by the target: the
    bigger, the further left the next chain starts (CC^1 and CC^2 that column alone, CC^3 and CC^5 two, CC^8 three). */
export const letGoFor = (target) => (target >= 8 ? 3 : target >= 3 ? 2 : 1);
/** Where the next chain starts when the chain can't go on into column x: left of x, of every column next to it the chain
    can't go on into either, and of letGoFor(target) columns in all; never past a column already clear (a Crystal Clear
    ready to send up). -1: nowhere on the board. */
export function nextChainAt(cols, x, target) {
    const most = x - letGoFor(target);
    let s = x - 1;
    while (s >= 0 && !clear(cols[s]) && (chainOver(cols, s) || s > most))
        s--;
    return s;
}
/** The chain's context with the rule of thumb applied: a chain going (`chain` > 0) whose next column can't be filled
    (`chainOver`) is let go (`letGo`), never a white built into that junk: with nothing clear left to go up before it,
    the columns from the next chain's start to the fire burn now, as at a chain's start (`burns`, more of them); with
    Crystal Clears still to go up first, they go, the columns let go wait to burn after them (`over`: no white into
    them, their whites out), and the next chain's built left of them. */
export function chainContext(cols, chain, burns, target, reach) {
    const ctx = contextFor(cols, 'chain', burns, reach), x = ctx.fill;
    if (chain <= 0 || !chainOver(cols, x))
        return { ctx, burns, letGo: false };
    const s = nextChainAt(cols, x, target);
    if (s < 0)
        return { ctx, burns, letGo: false };
    if (x === ctx.burnFrom - 1) {
        const n = COLS - 1 - s;
        return { ctx: contextFor(cols, 'chain', n, reach), burns: n, letGo: true, at: x };
    }
    return { ctx: { ...ctx, fill: s, over: [s + 1, x] }, burns, letGo: true, at: x };
}
/** The let go in words, for the read: the column the chain can't go on into (`at`), and where the next starts. */
const letGoRead = (ctx, chain, at) => `the chain at CC^${chain} can't go on into column ${at + 1}, more junk than white: let it go there, and start the next one in column ${ctx.fill + 1}`;
/** A sweep: one plain drag, long, every swap the same way across (left or right), so it's swept blind with
    hardly a pause (the user, 12 Nov: "It's just quick drag motions ... go, go, go"). */
export function plainDrag(drags) {
    if (drags.length !== 1 || drags[0].ways.length < P.SWEEP_LONG)
        return false;
    const right = (w) => w === UP_RIGHT || w === DOWN_RIGHT, r = right(drags[0].ways[0]);
    return drags[0].ways.every((w) => right(w) === r);
}
/** The brown sweep: a brown taken up through the whites and back down through the blacks, to the bottom right
    (the diamond's brown run): let go right of where it started. (Not a brown looped round under a white and back to
    its own column, the board reader's way to free a white trapped at the top, 13 Nov.) */
export function brownSweep(cols, drags) {
    if (!drags.length || cols[drags[0].x][drags[0].y] !== BROWN)
        return false;
    const ways = drags[0].ways, up = ways.findIndex((w) => w === UP_RIGHT || w === UP_LEFT);
    return up >= 0 && ways.slice(up + 1).some((w) => w === DOWN_RIGHT || w === DOWN_LEFT) && endOf(cols, drags[0])[0] > drags[0].x;
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
/** The whites in danger, in the order they're saved (the user, 13 Nov, the twentieth and twenty-second notes:
    "If you're playing well, you should never burn a white"; "it doesn't seem fussed that you're only one column
    away from a couple of whites burning at the bottom ... that's your danger area that's hard to reach"): first
    the furnace's own column, a column to burn, while it has a white; then (Stage I) the column before it, a junk
    column, while a white there is hard to reach, with no way out left on its own (low down, boxed in, behind
    spice): it takes longest to free, so it's started soonest; then (Stage I) the leftmost column next to the fire
    with a white on its edge or beside a spice (`edgeWhites`, the twenty-sixth note), whatever its way out now.
    Each zone is its first column; its whites are those from there to the furnace. */
export function dangerZones(cols, stage, burning) {
    const last = COLS - 1, out = [];
    const whites = (x) => cols[x].map((p, y) => (p === WHITE ? y : -1)).filter((y) => y >= 0);
    if (burning && whites(last).length)
        out.push(last);
    if (stage === 'junk' && P.ZONE2) {
        const x = last - 1, w = whites(x);
        if (w.length && cols[x].filter(isJunk).length > w.length && w.some((y) => !canGo(cols, x, y, -1)))
            out.push(x);
    }
    const edge = stage === 'junk' ? edgeZone(cols) : null;
    if (edge !== null && !out.includes(edge))
        out.push(edge);
    return out;
}
/** A white in danger already by the fire (the user, 13 Nov, the twenty-sixth note: "this top right here ... It
    should have moved [a brown] into that spot behind the [spice] piece ... where something can potentially get
    trapped. Like, I would be taking some of those browns in the far bottom left and be like racing them up there
    to fill those gaps in"): in the EDGE_COLS columns next to the fire, on its column's top or bottom, or beside a
    spice, where its ways out are few and close as the board slides. From column `from` on. */
export function edgeWhites(cols, from = 0) {
    const out = [];
    if (!P.EDGE_COLS)
        return out;
    for (let x = Math.max(from, COLS - P.EDGE_COLS); x < COLS; x++)
        cols[x].forEach((p, y) => {
            if (p !== WHITE)
                return;
            const spice = [UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT].some((d) => { const n = neighbourOn(cols, x, y, d); return !!n && cols[n[0]][n[1]] === SPICE; })
                || cols[x][y - 1] === SPICE || cols[x][y + 1] === SPICE;
            if (y === 0 || y === cols[x].length - 1 || spice)
                out.push({ x, y });
        });
    return out;
}
/** The edge whites' zone: the leftmost column next to the fire, short of the furnace's own (its zone already),
    with one (`edgeWhites`); null if none. */
export function edgeZone(cols) {
    const e = edgeWhites(cols).filter((w) => w.x < COLS - 1);
    return e.length ? Math.min(...e.map((w) => w.x)) : null;
}
/** The right-hand columns' order (the user, 13 Nov, the twenty-first note: "one of the heuristics is browns being
    lower down the board"): every brown's depth in half pieces, less every black's, in the last TIE_COLS columns.
    Higher is browns lower and blacks higher. */
export function rightOrder(cols) {
    let v = 0;
    for (let x = COLS - P.TIE_COLS; x < COLS; x++)
        cols[x].forEach((p, y) => {
            const h = 2 * y + (cols[x].length === TALL ? 0 : 1);
            if (p === BROWN)
                v += h;
            else if (p === BLACK)
                v -= h;
        });
    return v;
}
/** A tie-breaker, never a goal (the twenty-first note: "you don't want to really actively be going out of your
    way, spending extra moves to sort them at this point. But it's still preferable if it costs you very little
    ... a little flick and a swish, and the brown can be one level lower"): among moves doing the best one's job
    (its board score gain, within TIE_SCORE) in as many drags and at most TIE_SWAPS more swaps, the one leaving
    the right-hand side in the best order, browns lower and blacks higher; the best itself when none is better. */
export function tieBreak(cols, moves, best, block = false, accept = () => true) {
    if (!best.after)
        return best;
    const base = boardScore(cols, block), gain = boardScore(best.after, block) - base, swaps = swapsIn(best.move.drags);
    let pick = best, order = rightOrder(best.after);
    for (const m of moves) {
        if (m === best || !m.after || m.move.drags.length !== best.move.drags.length)
            continue;
        if (swapsIn(m.move.drags) > swaps + P.TIE_SWAPS || boardScore(m.after, block) - base < gain - P.TIE_SCORE)
            continue;
        const o = rightOrder(m.after);
        if (o > order && accept(m)) {
            pick = m;
            order = o;
        }
    }
    return pick === best ? best : { ...pick, tie: true };
}
/** Hard-to-reach whites in a column: no way out left on their own. */
const hardIn = (cols, x) => cols[x].reduce((n, p, y) => n + (p === WHITE && !canGo(cols, x, y, -1) ? 1 : 0), 0);
/** Stage I: a move judged by the board it leaves (src/distill-score.ts), the score it gains a second of a
    person's time (the user, 12 Nov, the eleventh note: "even just as a test of moves"). One look ahead, no
    search. Its last drag is let go where that's best: carried on while each swap still gets something over,
    stopped before it only climbs through the junk (a black sent on up through the browns gets nothing). */
export function judge(cols, drags, style, base, block = false, goal) {
    base ??= boardScore(cols, block);
    const j = letGoAt(cols, drags, style, base, block);
    if (!j || !goal || !P.GOALS)
        return j;
    // Never let go where the drag's a half move (src/distill-goals.ts; the user, 13 Nov, P10: "Why are things only half
    // moving?"): where it scores best but gets nothing done, it's let go instead where it does, the best of those.
    const init = j.drags.slice(0, -1), before = init.length ? playDrags(cols, init) : cols, last = j.drags[j.drags.length - 1];
    if (!before)
        return j;
    const now = playDrags(before, [last]);
    if (now && goal(before, last, now))
        return j;
    const full = drags[drags.length - 1];
    let pick = null;
    for (let k = full.ways.length; k >= 1; k--) {
        const d = { x: full.x, y: full.y, ways: full.ways.slice(0, k) }, after = playDrags(before, [d]);
        if (!after || !goal(before, d, after))
            continue;
        const all = [...init, d];
        const value = (boardScore(after, block) - base) / ((timeFor(all, style, plainDrag(all)) + (block ? P.BLOCK_DRAG_MS * all.length : 0)) / 1000);
        if (!pick || value > pick.value)
            pick = { drags: all, value };
    }
    return pick && pick.value > 0 ? pick : j;
}
/** Where a move's last drag is let go: where the board scores best a second of a person's time (`judge`). */
function letGoAt(cols, drags, style, base, block) {
    if (!drags.length)
        return null;
    const init = drags.slice(0, -1), last = drags[drags.length - 1];
    let best = null, bestScore = null;
    for (let k = last.ways.length; k >= 1; k--) {
        const d = [...init, { x: last.x, y: last.y, ways: last.ways.slice(0, k) }];
        const after = playDrags(cols, d);
        if (!after)
            continue;
        // In the block phase each drag costs a person more: a small move has to earn its place (the twenty-third note:
        // "a lot of small, intricate moves ... I would just start pulling, like treating it more like blocks").
        // Let go where the board's best, the longest of the drags that leave it so (the user, 13 Nov: "Please keep
        // running things until it stops ... don't have any limits on how long an individual pull can be"); its worth
        // against other moves still its gain a second.
        const score = boardScore(after, block);
        if (bestScore === null || score > bestScore) {
            bestScore = score;
            best = { drags: d, value: (score - base) / ((timeFor(d, style, plainDrag(d)) + (block ? P.BLOCK_DRAG_MS * d.length : 0)) / 1000) };
        }
    }
    // Carried on toward where its junk belongs (the user, 13 Nov, the thirty-second note: "it doesn't really still
    // finish dragging things all the way to the right when it's got the opportunity ... you could go one step further,
    // just do it. Why does it seem to be limited?"): one look ahead lets a drag go where its score a second peaks, and
    // a swap more costs a fifth of a second; so while each swap more takes the junk further right and leaves the board
    // scoring no worse, it's played on.
    if (best && P.ONWARD) {
        const k = best.drags[best.drags.length - 1].ways.length, before = playDrags(cols, init);
        if (before && isJunk(before[last.x][last.y]) && k < last.ways.length) {
            let at = endOf(cols, last, k), top = boardScore(playDrags(cols, best.drags), block), go = k;
            for (let more = k + 1; more <= last.ways.length; more++) {
                const to = endOf(cols, last, more);
                if (to[0] <= at[0])
                    break;
                const d = [...init, { x: last.x, y: last.y, ways: last.ways.slice(0, more) }], after = playDrags(cols, d);
                if (!after)
                    break;
                const s = boardScore(after, block);
                if (s < top)
                    break;
                top = s;
                go = more;
                at = to;
            }
            if (go > k) {
                const d = [...init, { x: last.x, y: last.y, ways: last.ways.slice(0, go) }];
                const value = (top - base) / ((timeFor(d, style, plainDrag(d)) + (block ? P.BLOCK_DRAG_MS * d.length : 0)) / 1000);
                if (value > 0)
                    return { drags: d, value };
            }
        }
    }
    // A block move carried on to where the junk joins up (the user, 13 Nov, the twenty-ninth note: "It has decided
    // to just leave it one short. Why? Like, there was an extra move there. You could have gotten that right, nice,
    // tucked into the corner"): let go among the whites, and a swap or two more of the same drag takes it in against
    // the junk on its right (the corner, the row), it's played on, while it still gains.
    if (block && best && P.CARRY) {
        const k = best.drags[best.drags.length - 1].ways.length, before = playDrags(cols, init);
        if (before && isJunk(before[last.x][last.y]) && !joinedUp(playDrags(cols, best.drags), endOf(cols, last, k))) {
            for (let more = 1; more <= P.CARRY && k + more <= last.ways.length; more++) {
                const d = [...init, { x: last.x, y: last.y, ways: last.ways.slice(0, k + more) }], after = playDrags(cols, d);
                if (!after || !joinedUp(after, endOf(cols, last, k + more)))
                    continue;
                const value = (boardScore(after, block) - base) / ((timeFor(d, style, plainDrag(d)) + P.BLOCK_DRAG_MS * d.length) / 1000);
                if (value > 0)
                    return { drags: d, value };
                break;
            }
        }
    }
    return best;
}
/** Where a drag's piece is after its first k swaps. */
function endOf(cols, d, k = d.ways.length) {
    let at = [d.x, d.y];
    for (const w of d.ways.slice(0, k)) {
        const n = neighbourOn(cols, at[0], at[1], w);
        if (!n)
            break;
        at = n;
    }
    return at;
}
/** A piece of junk joined up with the junk on its right: every neighbour on its right junk (none, on the right
    edge), so it's let go against the colour, not among the whites. */
export function joinedUp(cols, [x, y]) {
    if (!isJunk(cols[x][y]))
        return false;
    for (const d of [UP_RIGHT, DOWN_RIGHT]) {
        const n = neighbourOn(cols, x, y, d);
        if (n && !isJunk(cols[n[0]][n[1]]))
            return false;
    }
    return true;
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
    With time short on a column that needs saving, only moves that save it in time.

    A white in the furnace's column, a column to burn, is never let burn while anything can get it out (the
    user, 13 Nov, the twentieth note: "If you're playing well, you should never burn a white"): then only the
    moves that take a white out of it, in time, are offered (`saves`), whatever they score, the wider path
    search (PATH_WIDE) if nothing else does; and no move ever puts a white into it. In Stage I the same holds
    a column earlier for a white that's hard to reach (`dangerZones`). Among the saving moves, those freeing a
    hard-to-reach white come first ("the harder to reach, the sooner to start"); when nothing can save the
    furnace's whites, the next column's hard ones get the time rather than easy work elsewhere. */
export function weigh(sit, ctx, style, reading) {
    const { cols } = sit, last = COLS - 1, burning = ctx.burnFrom <= last, one = ctx.stage === 'junk';
    const block = one && blockPhase(cols), base = one ? boardScore(cols, block) : measure(cols, ctx);
    const wrong = (b) => (burning ? b[last].filter((p) => p === WHITE).length : junkAt(b[last]));
    const urgent = sit.timeLeft < P.URGENT && wrong(cols) > 0;
    // (The furnace's whites the board reader gave up as junk, past saving, aren't a danger zone: P26, "you're doomed on
    // that white, that's going to be junk".)
    const lost = one ? (reading?.given?.length ?? 0) : 0;
    const zones = dangerZones(cols, ctx.stage, burning).filter((z) => !(z === last && lost > 0 && lost >= cols[last].filter((p) => p === WHITE).length));
    // Never a white into a danger zone (the furnace's column always, when it burns).
    const guard = zones.length ? Math.min(...zones) : burning ? last : COLS;
    const out = [];
    const near = one ? whitesInJunk(cols, ctx.burnFrom) : 0;
    // The whites by the fire in danger already (the twenty-sixth note), and those of them with a way out: no move
    // takes that away ("It even moved some blacks in the way at the top that actually block getting that white piece
    // out easily ... Why have you blocked it all in?"), nor puts another white there.
    const edges = one ? edgeWhites(cols) : [], open = edges.filter((w) => canGo(cols, w.x, w.y, -1));
    const tools = keptTools(cols);
    // The chain let go (`chainContext`): never a white built into the columns let go.
    const over = (b) => { let n = 0; if (ctx.over)
        for (let x = ctx.over[0]; x <= ctx.over[1]; x++)
            n += b[x].filter((p) => p === WHITE).length; return n; };
    const over0 = over(cols);
    // What no move may do, wherever it comes from (a routine, the path search, the board reader's tactic).
    const fillWhites = (b) => (!one && ctx.fill >= 0 && ctx.fill < COLS ? b[ctx.fill].filter((p) => p === WHITE).length : 0), fill0 = fillWhites(cols);
    const admissible = (drags, after) => {
        if (ctx.over && over(after) > over0)
            return false;
        // Never a white taken back out of the column the chain's filling (the user, 13 Nov, watching CC^1: its target column
        // lit, "it doesn't seem to actually try and get the whites there ... and then it's just moved that out").
        if (fillWhites(after) < fill0)
            return false;
        if (urgent && (wrong(after) >= wrong(cols) || msFor(drags, style, plainDrag(drags)) > sit.timeLeft))
            return false;
        if ((burning && wrong(after) > wrong(cols)) || whitesFrom(after, guard) > whitesFrom(cols, guard))
            return false;
        // (A white got out of the two columns nearest the fire is more urgent, wherever it lands.)
        if (one && whitesFrom(after, last - 1) >= whitesFrom(cols, last - 1)
            && (edgeWhites(after).length > edges.length || open.some((w) => after[w.x][w.y] === WHITE && !canGo(after, w.x, w.y, -1))))
            return false;
        // The block phase's corner tools, a brown bottom-left and a black top-left, are spent only to save a white in
        // danger (the twenty-fourth note: "you don't want to just get too greedy"; a long drag across the board always
        // scored more than keeping one).
        if (block && !zones.length) {
            const k = keptTools(after);
            if ((tools.brown && !k.brown) || (tools.black && !k.black))
                return false;
        }
        // The brown sweep waits till the columns next to burn are clear of white (the user, 13 Nov: "it's very good.
        // But it's just like it leaves one or two trapped whites ... it's being applied a bit too quickly before those
        // columns have been cleared"): till then it's played only when it takes a white out of them.
        if (one && near > 0 && brownSweep(cols, drags) && whitesInJunk(after, ctx.burnFrom) >= near)
            return false;
        return true;
    };
    // The board read, once (the user, 13 Nov, the thirty-third and thirty-fourth notes), and every drag let go where it
    // gets something done (src/distill-goals.ts).
    const read = one && P.READ && !urgent ? (reading ?? readBoard(cols, { stage: ctx.stage, timeLeft: sit.timeLeft })) : null;
    const aims = { ctx, reading: one ? (reading ?? read) : null };
    const goal = (b, d, a) => ownGoal(b, d, a, aims) !== null;
    const consider = (found) => {
        const j = one ? judge(cols, found.drags, style, base, block, goal) : null;
        const move = j ? { ...found, drags: j.drags } : found;
        const after = playDrags(cols, move.drags);
        if (!after || (one && !j) || !admissible(move.drags, after))
            return;
        const value = j ? j.value : measure(after, ctx) - base - P.PER_SEC * timeFor(move.drags, style) / 1000 - P.BACK * backward(cols, move.drags, ctx.stage);
        out.push({ move, value, after });
    };
    for (const name of MENU[ctx.stage]) {
        if (!style.routines.includes(name))
            continue;
        for (const found of ROUTINES[name].find(cols, ctx))
            consider(found);
    }
    // Quick sorting with time in hand (the board read, P3: "I'll just be going down, browns up"): its blacks down and
    // browns up into the places of the whites by the fire.
    if (read?.tactic === 'quickSort' && read.targets.length && style.path) {
        for (const d of quickFills(cols, read.targets))
            if (sorts(cols, d[0])) {
                const p = cols[d[0].x][d[0].y] === BLACK ? 'black' : 'brown';
                consider({ routine: 'rescue', drags: d, reason: `quick sorting: the ${p} at column ${d[0].x + 1}, row ${d[0].y + 1} ${p === 'black' ? 'down' : 'up'} into a white's place by the fire, and it's out left` });
            }
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
    // The phase's weights on the techniques, for ranking (the user, 13 Nov: "different techniques have different
    // weights depending on the stage"), every one even only for real danger, a white in a danger zone ("it can
    // always use all the techniques if it absolutely needs to, like ... there's a blocked white"). Not for any piece
    // stuck anywhere: something nearly always is, and the weights hardly ever applied (the twenty-eighth note: crawls
    // "still being done at an early stage when there are much simpler techniques").
    const phase = phaseOf(cols, ctx.stage), even = !P.PHASES || zones.length > 0;
    // The board read (the user, 13 Nov, the thirty-third and thirty-fourth notes): its tactic sets the priorities.
    // Freeing the whites at risk, fixing a cracked board and sorting the ladder before it's lost come before the
    // danger zones (the zones' whites are among those the reader weighs); sorting the V's tail after them; the quick
    // sorting moves are preferred when nothing's at risk.
    const r = read;
    let keep = [];
    if (r && (r.tactic === 'fillGaps' || r.tactic === 'freeTrapped' || r.tactic === 'fixCracks' || r.tactic === 'sortLadder')) {
        const t = byTactic(sit, ctx, style, r, out, admissible);
        if (t.length)
            return t;
        if (r.tactic === 'fixCracks')
            keep = toolBrowns(cols, r);
    }
    const quick = (m) => (r?.tactic === 'quickSort' && quickSort(cols, m.move.drags) ? P.QUICK : 1);
    const rank = (m) => (even || m.value <= 0 ? m.value : m.value * weightIn(phase, m.move.routine) * quick(m));
    // A cracked board's tools, the browns in the middle, aren't spent on anything but freeing the stranded junk.
    if (keep.length)
        for (let i = out.length - 1; i >= 0; i--)
            if (movesAny(cols, out[i].after, keep))
                out.splice(i, 1);
    // The danger zones in turn: only what saves a white of the first that can be saved (the furnace's in time),
    // the hard-to-reach first; if nothing does yet, the wider search for its whites. The edge whites' zone is saved
    // by one of them getting out (junk raced into its place), not any white.
    const edgeAt = one ? edgeZone(cols) : null;
    // (With time in hand and nothing at real risk, the board read's quick sorting, the edge whites wait: P3, "No hurry".)
    const calm = (zone) => read?.tactic === 'quickSort' && zone === edgeAt && zone < last - 1;
    for (const zone of zones) {
        if (calm(zone))
            continue;
        const edgeOnly = zone === edgeAt && zone < last - 1;
        const saving = (m) => whitesFrom(m.after, zone) < whitesFrom(cols, zone)
            && (!edgeOnly || edgeWhites(m.after, zone).length < edgeWhites(cols, zone).length)
            && (zone < last || msFor(m.move.drags, style, plainDrag(m.move.drags)) <= sit.timeLeft);
        if (!out.some(saving) && style.path) {
            const whites = [];
            if (edgeOnly)
                for (const w of edgeWhites(cols, zone))
                    whites.push({ ...w, side: -1 });
            else
                cols[zone].forEach((p, y) => { if (p === WHITE)
                    whites.push({ x: zone, y, side: -1, zone }); });
            for (const found of pathMoves(cols, ctx, style, whites, PATH_WIDE))
                consider(found);
        }
        const saves = out.filter(saving);
        if (!saves.length)
            continue;
        return rankSaves(cols, zone, phase, saves, quick);
    }
    // Nothing saves a white in danger in one move: a short plan, a move that sets up the save and the save it opens
    // (the user, 13 Nov, the thirty-second note, a bot frozen with whites low by the fire: "maybe it's stuck because it
    // requires maybe a few moves just to kind of get the brown into the right position. And then you can use it to
    // drag across a few blacks"). The setting-up move is played; the save is found again next move.
    for (const zone of zones) {
        if (calm(zone))
            continue;
        const plan = setUp(sit, ctx, style, out, zone, zone === edgeAt && zone < last - 1, base, block);
        if (plan)
            return [plan];
    }
    // Quick sorting: its fills first, a black down or a brown up into a white's place by the fire (P26: "start getting the
    // ones in column 9 out of the way and dragging those blacks down ... just in quick drag the black down motions").
    if (r && r.tactic === 'quickSort' && r.targets.length) {
        const fills = out.filter((m) => { const d = m.move.drags[m.move.drags.length - 1], e = endOf(cols, d); return sorts(cols, d) && r.targets.some((t) => t.x === e[0] && t.y === e[1]) && m.after[e[0]][e[1]] !== WHITE; });
        if (fills.length)
            return fills.sort((a, b) => b.value - a.value);
    }
    // The V's tail sorted, so the next sweep runs through (P9), once no white's in danger.
    if (r && r.tactic === 'sortTail') {
        const t = byTactic(sit, ctx, style, r, out, admissible);
        if (t.length)
            return t;
    }
    // The chain's danger (the user, 13 Nov, a brown stuck at the top of the column going up: "this is absolute danger
    // mode ... the first thing I would be doing here is just rescuing that brown piece ... there was lots of time to
    // rescue it even before now"): junk stuck in a column of whites going up next, or the one after, comes before
    // anything easy elsewhere, from as soon as it's seen. Only what takes junk out of it is offered, the pair rescue's
    // plan among them.
    if (!one)
        for (const zx of chainZones(cols, ctx)) {
            const saving = (m) => freed(cols, m.after, zx, ctx) && (zx < last || msFor(m.move.drags, style) <= sit.timeLeft);
            // (Weighed with whatever else frees it: the hook's own way out, for one, often takes twice the drags.)
            if (style.path && P.PAIR) {
                const plan = pairRescue(cols, zx, ctx, style, zx === last ? sit.timeLeft : Infinity);
                if (plan)
                    consider(pairMove(cols, zx, plan));
            }
            const saves = out.filter(saving);
            if (saves.length)
                return saves.map((m) => ({ ...m, saves: true })).sort((a, b) => b.value - a.value);
        }
    // The block phase with the junk the wrong way up, browns high and blacks low (the user, 13 Nov, P17: "it's going to
    // leave you ... stranding those other black pieces, so it should have raised them up"): the hoists on offer too, their
    // order gained a second weighed at P.HOIST against the board score's gain a second.
    if (one && P.HOIST && r && block && r.patterns.upsideDown.flagged) {
        for (const h of hoists(sit, style, r, admissible))
            out.push({ ...h, value: h.value * P.HOIST });
    }
    return out.sort((a, b) => rank(b) - rank(a)).map((m) => (even ? m : { ...m, weighted: true }));
}
/** A quick sorting move (the user, 13 Nov, P3: "just going down, browns up, they're just really fast, quick, simple,
    easy moves"): one drag, P.QUICK_SWAPS swaps at most, taking a black down or a brown up. */
export function quickSort(cols, drags) {
    if (drags.length !== 1 || drags[0].ways.length > P.QUICK_SWAPS)
        return false;
    const d = drags[0], p = cols[d.x][d.y], end = endOf(cols, d), h = (x, y) => 2 * y + (cols[x].length === TALL ? 0 : 1);
    return (p === BLACK && h(...end) > h(d.x, d.y)) || (p === BROWN && h(...end) < h(d.x, d.y));
}
/** The moves the board reader's tactic wants (src/distill-read.ts, `progress`), best first: of the moves on offer and
    those the tactic looks for itself when the style searches (the quick fills and short drags into a trapped white's
    place, a piece brought round to it, the ladder's and the tail's drags), each that gets something done for the
    tactic, ranked by what it gets done a second of a person's time. Each must be `admissible` (what no move may do:
    a white into the danger zones or the furnace's column, the corner tools spent...). Freeing whites, and the ladder
    about to be lost, are played whatever they score (`saves`); the rest must be worth a move. Empty when nothing does. */
export function byTactic(sit, ctx, style, r, out, admissible) {
    const { cols } = sit, last = COLS - 1;
    const cands = [];
    for (const m of out)
        if (m.after)
            cands.push({ move: m.move, after: m.after });
    // The tactic's own drags, named for the routine they are: junk into a white's place is a rescue, sorting the right
    // side or the V's bottom a turning over.
    const own = (drags, routine, reason) => {
        const list = [];
        if (style.path)
            for (const d of drags) {
                const after = playDrags(cols, d);
                if (after)
                    list.push({ move: { routine, drags: d, reason }, after });
            }
        return list;
    };
    const place = (t) => `column ${t.x + 1}, row ${t.y + 1}`;
    if (r.tactic === 'fillGaps')
        cands.push(...own(quickFills(cols, r.targets), 'rescue', `junk raced into a white's place (${r.targets.slice(0, 3).map(place).join(', ')}), and it's out left`));
    else if (r.tactic === 'sortLadder')
        cands.push(...own(ladderDrags(cols), 'turnOver', `columns ${COLS - 1} and ${COLS} sorted, blacks over browns, the ladder the zigzag climbs, before column ${COLS} goes`));
    else if (r.tactic === 'sortTail')
        cands.push(...own(tailDrags(cols, r), 'turnOver', 'a brown sunk down through the blacks at the V\'s bottom, so the next sweep runs through'));
    const forced = r.tactic === 'fillGaps' || r.tactic === 'freeTrapped' || r.tactic === 'sortLadder';
    const trappedNow = (b) => { const at = wall(b).at; let n = 0; b.forEach((c, x) => c.forEach((_, y) => { if (trappedWhite(b, x, y, at))
        n++; })); return n; };
    const trapped0 = trappedNow(cols), block = blockPhase(cols);
    const ranked = (list, target, opening = false) => {
        const res = [], seen = new Set();
        for (const c of list) {
            // (The same drags found twice, the first kept: a routine's or the path search's name over the tactic's own.)
            const key = JSON.stringify(c.move.drags);
            if (seen.has(key))
                continue;
            seen.add(key);
            if (!c.after || !admissible(c.move.drags, c.after))
                continue;
            // (No white left trapped on an edge instead, further from the fire: the eighteenth note's "white trap right at
            // the top".)
            if (trappedNow(c.after) > trapped0)
                continue;
            if (r.targets.some((t) => t.x === last) && msFor(c.move.drags, style) > sit.timeLeft)
                continue;
            const g = progress(r, cols, c.after, c.move.drags, target, opening);
            if (g <= 0)
                continue;
            // (In the block phase each drag costs a person more, as judge has it: a small move has to earn its place.)
            const value = g / ((timeFor(c.move.drags, style, plainDrag(c.move.drags)) + (block ? P.BLOCK_DRAG_MS * c.move.drags.length : 0)) / 1000);
            if (!forced && value <= P.RATE_MIN)
                continue;
            res.push({ move: c.move, after: c.after, value, tactic: r.tactic, ...(forced ? { saves: true } : {}) });
        }
        return res.sort((a, b) => b.value - a.value);
    };
    // The ladder and the tail: a brown brought down goes to the V's tip, swapped in for the black there, first (the user,
    // 13 Nov, P29, P30: "the point of the browns down is you want them at that kind of bottom left tip ... Where it's just
    // kind of pulling a random brown piece down at the moment. It's not really achieving the goal").
    if (r.tactic === 'sortLadder' || r.tactic === 'sortTail') {
        const tips = [];
        for (const d of tipDrags(cols, r)) {
            const after = playDrags(cols, d);
            if (!after || !admissible(d, after) || trappedNow(after) > trapped0)
                continue;
            // (Not a brown from the furnace's column that can't be got out before it goes.)
            if (d[0].x === last && msFor(d, style) > sit.timeLeft)
                continue;
            const tip = endOf(cols, d[0]);
            tips.push({ move: { routine: 'turnOver', drags: d, reason: `a brown brought down to the V's tip, column ${tip[0] + 1}, row ${tip[1] + 1}, swapped in for the black there` }, after, value: 1 / (timeFor(d, style) / 1000), tactic: r.tactic, saves: true });
        }
        if (tips.length)
            return tips.sort((a, b) => b.value - a.value);
    }
    if (r.tactic === 'fillGaps' && r.state === 'damageControl') {
        const fills = ranked(cands);
        if (fills.length)
            return fills;
        // No junk near the gaps: hoist (P27: "there's not any time to zigzag stuff around, so you've got to do like hoisting
        // things up and down with the browns"), blacks and browns brought together for the fills to come.
        const hs = hoists(sit, style, r, admissible);
        return hs.map((m) => ({ ...m, saves: true }));
    }
    if (r.tactic !== 'freeTrapped')
        return ranked(cands);
    // The trapped whites one at a time, the most at risk first ("the top right first"): what frees it, a piece brought
    // round to it, the quick fills and short drags into its place among them; failing all of them, what opens the way to
    // the worst, or sets the pieces round it moving.
    for (const t of r.targets) {
        const list = [...cands];
        list.push(...own(quickFills(cols, [t]), 'rescue', `junk raced into the white's place at ${place(t)}, and it's out left`));
        list.push(...own(nearDrags(cols, t), 'rescue', `a piece near the white at ${place(t)} taken round into its place`));
        if (style.path)
            for (const m of pathMoves(cols, ctx, style, [{ x: t.x, y: t.y, side: -1 }]))
                list.push({ move: m, after: playDrags(cols, m.drags) });
        const res = ranked(list, t);
        if (res.length)
            return res;
        // Nothing frees it cleanly yet: open the way to it, or set the pieces round it moving, before a white that can wait.
        const opening = ranked([...cands, ...own(nearDrags(cols, t), 'rescue', 'a short drag beside it, the pieces round it set moving')], t, true);
        if (opening.length)
            return opening.map((m) => ({ ...m, move: { ...m.move, reason: `nothing frees the white at ${place(t)} yet: open the way to it: ${m.move.reason}` } }));
    }
    return [];
}
/** The hoist (the user, 13 Nov, P17, P20, P27: "using the brown to kind of hoist up some in column 2 and 3"; "a nice
    perfect cluster on the left of like browns and blacks close to each other ... hoist the black"): a brown sunk through
    blacks, lifting them, or a black lifted through browns, left of the column being built, so blacks and browns come
    together rather than split further (src/distill-read.ts, `hoistDrags`). Each admissible one, weighed by the swaps of
    order it gains (`hoistOrder`, a brown down or a black up a place each) a second of a person's time, best first. */
export function hoists(sit, style, r, admissible) {
    const { cols } = sit, to = Math.min(r.building, COLS - 1), base = hoistOrder(cols, to), out = [];
    if (!style.path)
        return out;
    for (const d of hoistDrags(cols, to)) {
        const after = playDrags(cols, d);
        if (!after || !admissible(d, after))
            continue;
        const p = cols[d[0].x][d[0].y] === BROWN ? 'brown' : 'black';
        const gain = (hoistOrder(after, to) - base) / 2;
        out.push({
            move: { routine: 'store', label: HOIST_LABEL, drags: d, reason: `hoist: the ${p} at column ${d[0].x + 1}, row ${d[0].y + 1} ${p === 'brown' ? 'sunk through the blacks, lifting them' : 'lifted up through the browns'}, blacks and browns brought together` },
            after, value: gain / (timeFor(d, style) / 1000),
        });
    }
    return out.sort((a, b) => b.value - a.value);
}
/** The hoist's name for a player. */
export const HOIST_LABEL = 'Hoist';
/** The chain's danger zones (`weigh`): the column being filled and the one after it, each while it's mostly white
    with a piece of junk in it that can't go left on its own (a brown on the top, a black on the bottom), the
    column going up first. Not while a white's still in the junk columns burning out ahead of the chain: saving those
    comes first ("never burn a white"; Helium's plan, step one, clears the junk columns). */
export function chainZones(cols, ctx) {
    if (ctx.stage !== 'chain' || !P.PAIR || (ctx.burnFrom < COLS && whitesFrom(cols, ctx.burnFrom) > 0))
        return [];
    const out = [];
    for (const x of [ctx.fill, ctx.fill - 1]) {
        if (x < 0 || x >= Math.min(ctx.burnFrom, COLS) || !mostlyWhite(cols[x]))
            continue;
        if (cols[x].some((p, y) => isJunk(p) && !canGo(cols, x, y, -1)))
            out.push(x);
    }
    return out;
}
const PIECE = ['white', 'brown', 'black', 'spice', 'burnt white'];
/** The pair rescue's plan as a move, and why in a line. */
function pairMove(cols, x, drags) {
    const y = cols[x].findIndex((p, i) => isJunk(p) && !canGo(cols, x, i, -1)), what = PIECE[cols[x][y]] ?? 'piece';
    const edge = y === 0 ? 'top' : y === cols[x].length - 1 ? 'bottom' : 'edge';
    return {
        routine: 'path', pair: true, drags,
        reason: `the ${what} stuck on the ${edge} of column ${x + 1}, a column of whites going up: ${drags.length} drags, pieces working together to free it, before anything else`,
    };
}
/** The routines a short plan's second move is looked for among (`setUp`). */
const SAVERS = ['rescue', 'junkColumn', 'diamond', 'channel'];
/** A short plan for a danger zone nothing saves in one move (`weigh`): of the moves on offer (`out`, the best
    P.SETUP by worth) that put no white into the zone, the one after which some move (a routine's, or a piece brought
    round) saves one of its whites, both in time; judged by the board score a second in Stage I, the quickest in the
    chain. Null if none. */
export function setUp(sit, ctx, style, out, zone, edgeOnly, base, block) {
    if (!P.SETUP)
        return null;
    const { cols } = sit, last = COLS - 1, one = ctx.stage === 'junk';
    const w0 = whitesFrom(cols, zone), e0 = edgeWhites(cols, zone).length;
    const saved = (b) => whitesFrom(b, zone) < w0 && (!edgeOnly || edgeWhites(b, zone).length < e0);
    const firsts = out.filter((m) => m.after && whitesFrom(m.after, zone) <= w0 && (!edgeOnly || edgeWhites(m.after, zone).length <= e0))
        .sort((a, b) => b.value - a.value).slice(0, P.SETUP);
    let best = null;
    for (const m of firsts) {
        const b = m.after, t1 = msFor(m.move.drags, style, plainDrag(m.move.drags));
        if (zone === last && t1 >= sit.timeLeft)
            continue;
        const seconds = [];
        // The save: a plain one (a rescue, the junk column, the diamond's runs) or a piece brought round; the slow
        // techniques' searches are left out, to keep the look cheap.
        for (const name of SAVERS)
            if (style.routines.includes(name))
                for (const f of ROUTINES[name].find(b, ctx))
                    seconds.push(f.drags);
        if (style.path) {
            const whites = [];
            if (edgeOnly)
                for (const w of edgeWhites(b, zone))
                    whites.push({ ...w, side: -1 });
            else
                b[zone].forEach((p, y) => { if (p === WHITE)
                    whites.push({ x: zone, y, side: -1, zone }); });
            for (const f of pathMoves(b, ctx, style, whites))
                seconds.push(f.drags);
        }
        for (const found of seconds) {
            // Let go where the planner would let it go next move, so the save it finds then is this one.
            const d = one ? judge(b, found, style, undefined, block)?.drags : found;
            if (!d)
                continue;
            const b2 = playDrags(b, d);
            if (!b2 || !saved(b2))
                continue;
            const t = t1 + msFor(d, style, plainDrag(d));
            if (zone === last && t > sit.timeLeft)
                continue;
            const v = one ? (boardScore(b2, block) - base) / (t / 1000) : -t;
            if (!best || v > best.v)
                best = { m, v };
        }
    }
    if (!best)
        return null;
    return { ...best.m, saves: true, setup: true, move: { ...best.m.move, reason: `first, to open the way to the white by the fire: ${best.m.move.reason}` } };
}
/** A danger zone's saving moves, best first: those freeing the most hard-to-reach whites in it first ("the harder
    to reach, the sooner to start"), then by their worth weighed by the phase's weights (the thirteenth run: with
    the zones evened, crawls by the fire rose to 12 to 16 a session; the user, 13 Nov: through the V, "one big giant
    sweeping motion. That's really easy. You don't need to crawl things across"), so a plain drag or a hook that
    saves the white beats a crawl that saves it as well. Only the weights that hold a technique back count here
    (saving is the job, so a rescue's own lift doesn't), and a long plain drag counts in full, whatever routine
    found it: a sweep that gets the white out is the simplest move there is. */
export function rankSaves(cols, zone, phase, saves, boost = () => 1) {
    const hard = (m) => hardIn(cols, zone) - hardIn(m.after, zone);
    const weight = (m) => (plainDrag(m.move.drags) ? 1 : Math.min(1, weightIn(phase, m.move.routine)));
    const ranked = (m) => (m.value <= 0 ? m.value : m.value * (P.PHASES ? weight(m) : 1) * boost(m));
    return saves.map((m) => ({ ...m, saves: true, ...(P.PHASES ? { weighted: true } : {}) })).sort((a, b) => hard(b) - hard(a) || ranked(b) - ranked(a));
}
/** The columns coming up to the fire after the furnace's, clear of white (`P.EARLY_CLEAR` of them): only then is
    a junk column burned early (the user, 13 Nov, the twenty-seventh note: "3 burns just happened in rapid
    succession ... Is that why it's struggling and failing?"; each early burn brought the whites a column closer). */
export function clearComingUp(cols) {
    for (let k = 2; k <= 1 + P.EARLY_CLEAR; k++)
        if (COLS - k >= 0 && cols[COLS - k].includes(WHITE))
            return false;
    return true;
}
/** A set-up move's goal (`setUp`): next move's save, which it opens. */
const SETUP_GOAL = "set up next move's save of the white by the fire";
/** Pick the routine for the board now (see the header). */
export function choose(sit, ctx, style) {
    const { cols } = sit, last = COLS - 1;
    const burning = ctx.burnFrom <= last;
    const furnace = cols[last];
    const ready = burning ? burnsClean(furnace) : clear(furnace);
    // What's wrong with the furnace's column, to save it when time's short.
    const wrong = (b) => (burning ? b[last].filter((p) => p === WHITE).length : junkAt(b[last]));
    const reading = readBoard(cols, { stage: ctx.stage, timeLeft: sit.timeLeft });
    const moves = weigh(sit, ctx, style, reading);
    // Every drag a named trick with a goal (src/distill-goals.ts): a move with a drag that has none, a half move, isn't
    // chosen; the first on offer whose drags all have one is (the user, 13 Nov: "it's not going to do a half move for no
    // reason, like everything ... has got a goal and a reason").
    const aims = { ctx, reading: ctx.stage === 'junk' ? reading : null };
    const named = new Map();
    const stepsOf = (m) => {
        let st = named.get(m);
        if (!st) {
            st = stepsFor(cols, joinPairs(cols, m.move.drags), m.setup ? { ...aims, setup: SETUP_GOAL } : aims);
            named.set(m, st);
        }
        return st;
    };
    const ok = (m) => !P.GOALS || purposeful(stepsOf(m));
    const first = P.GOALS ? moves.slice(0, P.GOAL_LOOK).find(ok) : moves[0];
    // A move saving a white from the furnace is played whatever it scores.
    const top = first && (first.saves || first.value > (ctx.stage === 'junk' ? P.RATE_MIN : P.MIN)) ? first : null;
    const best = top && ctx.stage === 'junk' && !top.saves && !top.tactic ? tieBreak(cols, moves, top, blockPhase(cols), ok) : top;
    const advice = (kind, label, reason, m = null) => ({
        stage: ctx.stage, phase: phaseOf(cols, ctx.stage), kind, routine: !m ? null : m.move.routine === 'path' ? 'hook' : m.move.routine, technique: m?.move.routine ?? null,
        label, reason, drags: m ? joinPairs(cols, m.move.drags) : [], value: m?.value ?? 0, sweep: false, ...(m?.tie ? { tie: true } : {}),
        ...(m ? { steps: stepsOf(m), how: stepsOf(m).map((x) => x.name).join('; then ') } : {}),
        ...(m?.weighted ? { weighted: true } : {}),
        ...(ctx.stage === 'chain' && ctx.fill >= 0 && ctx.fill < COLS ? { column: ctx.fill } : {}),
        state: reading.state, tactic: reading.tactic, read: reading.why,
    });
    // The endgame's gamble: the next Crystal Clear can't be filled in time.
    if (style.gamble && !burning && sit.chain >= P.CASH_FROM && !ready && sit.timeLeft < P.CASH_MS) {
        const need = junkAt(furnace), saving = moves.filter((m) => m.value > P.MIN && wrong(playDrags(cols, m.move.drags)) < need);
        const perFix = style.spot + 4000 / style.rate;
        if (!saving.length || need * perFix > sit.timeLeft) {
            return advice('dismiss', 'Cash in', `the gamble: CC^${sit.chain} so far, and the next column needs ${need} more white${need > 1 ? 's' : ''} in ${(sit.timeLeft / 1000).toFixed(0)} s. Poor odds: cash in now`);
        }
    }
    // Never a column burned by hand (the user, 13 Nov: "definitely get rid of manual burns. Why is it manually
    // burning when it wants to do something? ... that's why no one's getting past CC2 ... just don't ever do that.
    // Never."): the furnace takes each column in its own time, and that time goes on the next.
    // A plain long drag that wins is the sweep, swept blind: no technique needed, "quick drag brown up, black
    // down, done" (the eleventh note).
    if (best && ctx.stage === 'junk' && plainDrag(best.move.drags) && !best.move.label) {
        return { ...advice('move', SWEEP_LABEL, `go, go, go: ${best.tactic ? `${TACTICS[best.tactic].label.toLowerCase()}: ` : ''}${best.move.reason}`, best), sweep: true };
    }
    if (best) {
        const gamble = !burning && sit.chain >= P.CASH_FROM && !ready && style.gamble
            ? ` (the gamble: CC^${sit.chain} so far, chasing the next while the odds are fair)` : '';
        const label = best.move.routine === 'path' ? (best.move.pair ? PAIR_LABEL : PATH_LABEL) : (best.move.label ?? ROUTINES[best.move.routine].label);
        // A move the tactic picked says so first.
        const why = best.tactic ? `${TACTICS[best.tactic].label.toLowerCase()}: ${best.move.reason}` : best.move.reason;
        return advice('move', label, why + gamble, best);
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
    return whites >= bank * PER_COLUMN || junkLeft < need;
}
/** A column at least half white: it goes up as it is, never burns (the bank, after a chain). */
export const mostlyWhite = (col) => col.filter((p) => p === WHITE).length * 2 >= col.length;
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
/** The junk columns to burn before the first chain (`DistillBot`, the CC^1 opening): those done (`burnsLeft`), and on to
    P.BUFFER columns by the fire, a buffer, over any column with two pieces of junk or more (not a column of whites a fix
    from Crystal Clear: it goes up). */
export function bufferBurns(cols) {
    let n = burnsLeft(cols);
    while (n < P.BUFFER && n < COLS - 1 && cols[COLS - 1 - n].filter(isJunk).length >= 2)
        n++;
    return n;
}
/** The pace "Help, Helium" plays at, and every technique. */
export const HELIUM = { routines: Object.keys(ROUTINES), path: true, reach: 40, rate: 6, spot: 250, sweepSpot: 80, early: false, gamble: true };
/** The target "Help, Helium" plays to when none is given: the top level's, every technique. */
export const DEFAULT_TARGET = LEVELS[LEVELS.length - 1].target;
/** The whites still needed for a target (the Advice's `whitesNeeded`): in Stage I, still to bank before the chain
    (`bankFor`); in the chain, missing from the columns going up for the rest of it, the first left of the junk
    columns still to burn (0 once it's reached). */
export function whitesNeededFor(cols, stage, chain, target, burns = 0) {
    if (stage === 'junk')
        return Math.max(0, Math.round(bankFor(target) * PER_COLUMN) - counts(cols).whites);
    let n = 0;
    for (let x = COLS - 1 - burns, k = Math.max(0, target - chain); k > 0 && x >= 0; x--, k--)
        n += cols[x].filter((p) => p !== WHITE && p !== SPICE).length;
    return n;
}
/** The planner on anyone's board mid-game, a person's: it reads the stage from the board (the chain
    started, or the whites banked for the target, or the junk run out), then picks the routine as the bots do,
    with the techniques that target needs (`levelFor`) at Helium's pace. The target is DEFAULT_TARGET unless
    given (Helium's lesson in levels: "this is how I build a Crystal Clear 2"). */
export function advise(g, o = {}) {
    const cols = g.cols, chain = g.chain ?? 0, timeLeft = g.timeLeft ?? Infinity, target = o.target ?? DEFAULT_TARGET;
    const two = chain > 0 || decisionTime(cols, bankFor(target));
    const burns0 = chain > 0 ? 0 : two ? burnsLeft(cols) : 0, stage = two ? 'chain' : 'junk';
    const style = target === DEFAULT_TARGET ? HELIUM : { ...HELIUM, routines: levelFor(target).routines };
    // The chain's rule of thumb: a next column of junk lets the chain go (`chainContext`).
    const c = stage === 'chain' ? chainContext(cols, chain, burns0, target, HELIUM.reach) : { ctx: contextFor(cols, stage, burns0, HELIUM.reach), burns: burns0, letGo: false };
    const a = choose({ cols, chain, timeLeft }, c.ctx, style);
    return { ...a, target, ...letGoNote(cols, c, chain, target, stage) };
}
/** The advice's whites still needed, and the chain let go said: the whites for the next chain, from its column. */
function letGoNote(cols, c, chain, target, stage) {
    if (!c.letGo)
        return { whitesNeeded: whitesNeededFor(cols, stage, chain, target, c.burns) };
    return { whitesNeeded: whitesNeededFor(cols, 'chain', 0, target, COLS - 1 - c.ctx.fill), letGo: true, read: letGoRead(c.ctx, chain, c.at) };
}
/** A distiller at a level: where it is in its run, and its next move. It banks the whites for its target, sends
    the chain up, and when the chain breaks goes back to building toward the next one; it never dismisses. */
export class DistillBot {
    level;
    stage = 'junk';
    /** Stage II's junk columns still to go out before the chain. */
    burns = 0;
    /** Whites on the board, in columns, as its first chain started. */
    banked = null;
    /** Drags made, and how often each routine was played. */
    drags = 0;
    used = {};
    /** Every chain it's sent up, its length, and the one going now. */
    chains = [];
    /** Whether it's started a chain yet: from then, the whites left banked on the right after a break are chained
        again, not rebuilt. */
    chained = false;
    run = 0;
    /** Decisions made with the chain let go (`chainContext`). */
    letGo = 0;
    /** What it's doing now (the test page shows its label). */
    last = null;
    constructor(level) { this.level = level; }
    plan(g) {
        const target = this.level.target;
        // The first chain's column two or three in from the fire, the columns right of it burning as junk first, a buffer
        // (the user, 13 Nov, watching CC^1: "it should be like trying to build it in the second or third column, like close to
        // what's being burnt, just to have a bit of burnt buffer. You build some fully [junk] columns, and then build behind
        // it"): at least P.BUFFER columns burn before it.
        if (this.stage === 'junk' && decisionTime(g.cols, bankFor(target))) {
            this.stage = 'chain';
            this.burns = this.chained ? burnsLeft(g.cols) : bufferBurns(g.cols);
            this.chained = true;
        }
        // After a chain broke, the whites still banked on the right are sent up, a new chain, not turned into junk
        // columns to burn (the thirteenth run, traced 13 Nov: back in Stage I with the bank still on the right, every
        // column reaching the fire was mostly white, and the bot filled it with junk to burn, a white or two burned
        // with it each time: 20 in one CC^5 session).
        else if (this.stage === 'junk' && this.chained && mostlyWhite(g.cols[COLS - 1])) {
            this.stage = 'chain';
            this.burns = 0;
        }
        // The chain's rule of thumb (`chainContext`): its next column junk, the chain's let go and the next started further
        // left, the columns between burning first.
        const c = this.stage === 'chain' ? chainContext(g.cols, g.chain, this.burns, target, this.level.reach)
            : { ctx: contextFor(g.cols, this.stage, this.burns, this.level.reach), burns: this.burns, letGo: false };
        this.burns = c.burns;
        if (c.letGo)
            this.letGo++;
        const a = choose({ cols: g.cols, chain: g.chain, timeLeft: g.timeLeft() }, c.ctx, this.level);
        const t = a.technique ?? a.routine;
        if (t)
            this.used[t] = (this.used[t] ?? 0) + 1;
        this.last = { ...a, target, ...letGoNote(g.cols, c, g.chain, target, this.stage) };
        return this.last;
    }
    /** A column went: note the chain, count down the junk columns before it, note the bank, and when the chain
        breaks go back to building (Stage I) toward the next. */
    seen(col, g) {
        if (col.chain > 0)
            this.run = col.chain;
        else if (this.run > 0) {
            this.chains.push(this.run);
            this.run = 0;
        }
        if (this.stage !== 'chain')
            return;
        if (this.burns > 0) {
            this.burns--;
            return;
        }
        if (col.chain === 1 && this.banked === null)
            this.banked = (whitesFrom(g.cols, 0) + col.whites) / PER_COLUMN;
        if (col.chain === 0)
            this.stage = 'junk';
    }
    /** Every chain sent up, the one still going too. */
    allChains() { return this.run > 0 ? [...this.chains, this.run] : [...this.chains]; }
}
/** Play a session through with a bot: each drag a moment to spot, then swept at its hand speed;
    the furnace runs on meanwhile. Stops at `cap` minutes of play. `onColumn` sees each column, `onPlan`
    each decision. */
export function playSession(g, level, cap = 30, onColumn, onPlan) {
    const bot = new DistillBot(level), swapMs = 1000 / level.rate, cost = {};
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
            handle(g.tick(level.spot));
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
            handle(g.tick(a.sweep ? level.sweepSpot : level.spot));
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
        level: level.name, target: level.target, chains: bot.allChains(), longest: g.longest, score: g.score(), points: g.points, columnsUp: g.columnsUp,
        columnsBurned: g.columns.length - g.columnsUp, whitesBurned: g.whitesBurned, minutes: g.time / 60000,
        swaps: g.swaps, drags: bot.drags, banked: bot.banked, dismissed: g.dismissed, finished: g.finished, used: bot.used, cost,
    };
}
