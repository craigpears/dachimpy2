/* Distilling's board reader: the board's state and the tactic in play, worked out from the piece level
   (src/distill-risk.ts, each white's risk) and the pattern level (src/distill-patterns.ts, groups of pieces), and what
   each tactic counts as progress, so the planner (src/distill-bots.ts) ranks its moves by it. TypeScript, compiled to
   js/distill-read.js; tested in tests/distill-read.test.ts.

   The user (13 Nov, the thirty-third and thirty-fourth notes, on the positions of distilling-positions.html): "a feature
   that tells you there's a risk and detects it ... but also what kind of tactics are in play"; "if you think of an enum
   like there should be like an enum calculation that then feeds into other areas"; "I'd switch strategy or tactics from
   trying to fill in the white column so they're brown with fixing cracked pieces."

   The states (Stage I), the worst that holds:
   - damageControl: the column being built still holds DAMAGE_WHITES whites or more, burning within DAMAGE_MS, and the
     free junk fills a column at most ("things have gone really wrong ... damage control", P7);
   - cracked: STRANDED of the free junk or more stranded among the whites, STRANDED_MIN pieces at least ("a board in bad
     state ... because there's so many trapped pieces", P10);
   - atRisk: a white flagged (src/distill-risk.ts), the junk the wrong way up (`upsideDown`, P17, P23), or in the block
     phase the right-hand ladder's risk LADDER or more (P8);
   A white in the furnace's column past saving (`doomed`) is given up as junk first, and read no more (P26).
   - healthy: none of those.
   The tactics, in order:
   - fillGaps (damage control, or a white in the furnace's column): junk raced into the whites' places, the quickest
     first, the risk they take away a second (P7: "I'll do a quick and easy moves to start with to fill in those
     columns on the right hand side");
   - fixCracks (cracked): the stranded junk freed; the browns in the middle kept as tools, moved only to free it (P10);
   - sortLadder (the block phase, the ladder's risk): the right-hand pair sorted blacks over browns before its column
     burns (P8);
   - freeTrapped (a flagged white that's trapped, by what it takes to free it (`isTrapped`, 13 Nov: a complicated way out
     or none; P20 to P22 aren't), whose column burns within URGENT_MS): those whites freed first, the most at risk first
     (P2, P6: "the top right first"); then any trapped white that can still be freed, before the quick fills (P5);
   - quickSort (those whites all free, their column not the furnace's, and every quick fill a black down or a brown up:
     the sorting fills them, P3: "I think [P3] was quick sorting");
   - fillGaps (a flagged white easy to reach whose column burns within URGENT_MS): the quick fills (P4:
     "prioritising filling those right-hand columns with as much speed as I could");
   - freeTrapped (the trapped whites further off: P1, P5);
   - sortTail (the block phase, the V's tail unsorted): its browns sunk through its blacks, so the next sweep runs
     through (P9);
   - blocks (healthy, the block phase): the junk moved in long drags, as the planner already plays it;
   - quickSort (healthy): quick, simple sorting moves, blacks down and browns up (P3: "just going down, browns up,
     they're just really fast, quick, simple, easy moves").
   In the chain: 'chain', its own danger read by the planner (`chainZones`).

   Pure: no randomness, no clock; knows nothing of the den. */
import { BLACK, BROWN, COLS, DOWN_LEFT, DOWN_RIGHT, UP_LEFT, UP_RIGHT, WHITE, canSwapOn, neighbourOn } from './distilling.js';
import { copyBoard, halfOf, isJunk, junkTarget, playDrags } from './distill-routines.js';
import { RISK, burnsIn, flagged, freeCost, whiteRisk, whiteRisks } from './distill-risk.js';
import { PATTERN, ladderBad, patternsOf, stranded, tailOrder } from './distill-patterns.js';
import { blockPhase } from './distill-score.js';
/** Each state and tactic in plain words, for the pages and Helium. */
export const STATES = {
    healthy: { label: 'Healthy', about: 'nothing at risk: quick, simple moves' },
    atRisk: { label: 'At risk', about: 'a white near the fire in danger, or the two right-hand columns unsorted with one about to go' },
    cracked: { label: 'Cracked', about: 'junk stranded among the whites: fix it before filling more' },
    damageControl: { label: 'Damage control', about: 'too many whites by the fire for the time and the junk left: save what can be saved' },
};
export const TACTICS = {
    quickSort: { label: 'Quick sorting', about: 'blacks down, browns up, short and simple' },
    blocks: { label: 'Blocks', about: 'whites mostly left: the junk moved in long drags, blocks at a time' },
    fillGaps: { label: 'Fill the gaps', about: 'junk raced into the whites\' places by the fire, the quickest first' },
    freeTrapped: { label: 'Free the trapped whites', about: 'the whites walled in near the fire freed first, the most at risk first' },
    sortLadder: { label: 'Sort the right-hand pair', about: 'the two right-hand columns sorted, blacks over browns, before one burns' },
    sortTail: { label: 'Sort the tail', about: 'the browns at the V\'s bottom sunk through the blacks, so the next sweep runs through' },
    fixCracks: { label: 'Fix the cracks', about: 'the stranded junk freed, the browns in the middle kept as tools' },
    chain: { label: 'The chain', about: 'whites right, Crystal Clears one after another' },
};
/** The reader's thresholds. */
export const READ = {
    DAMAGE_WHITES: 4,
    DAMAGE_MS: 25000,
    DAMAGE_FILL: 1,
    STRANDED: 0.5,
    /** ... and at least this many pieces of it (the user's own block-phase picture, 40-*, has 11 and isn't cracked; P10 has 14). */
    STRANDED_MIN: 12,
    LADDER: 0.5,
    URGENT_MS: 30000,
    /** Trapped, by what it takes to free a white (src/distill-risk.ts, `freeCost`; the user, 13 Nov, on P20 to P22:
        "trapped I define as being much more challenging than that, like requiring a complicated move and high number of
        swaps"): nothing frees it in two drags, or its way out costs TRAPPED_COST or more; or near the top (TOP_HALF half
        rows down at most), junk round it on TOP_ROUND sides or more and its way out more than a quick drag (TOP_COST):
        "there's blacks at the top and there's just no way for things to move as freely up there" (P1, P6). */
    TRAPPED_COST: 14,
    TOP_HALF: 2,
    TOP_ROUND: 3,
    TOP_COST: 4,
    /** Damage control's fills: junk from this many columns of the gap at most; junk further off is kept for hoisting (the
        user, 13 Nov, P27: "its first move is to drag a brown up to the top right. That's reinforcing the damage"). */
    DAMAGE_NEAR: 2,
    /** A white in trouble (`inTrouble`): its way out this many swaps or more (a drag's spot counted as two). */
    TROUBLE: 8,
    /** Hoisting's drags, at most. */
    HOIST_SWAPS: 6,
    /** The quick fills searched: drags this many swaps long at most, of junk this many columns from the whites. */
    FILL_SWAPS: 6,
    FILL_NEAR: 4,
    /** The ladder's and the tail's drags, at most. */
    SORT_SWAPS: 8,
    /** A trapped white's surroundings, for how freely they move (low): this many columns either side. */
    FLOW_NEAR: 2,
};
const place = (p) => `column ${p.x + 1}, row ${p.y + 1}`;
/** Whether a flagged white is trapped (READ.TRAPPED_COST and the rest): what it takes to free it, not whether it can move
    this moment. */
export function isTrapped(cols, w) {
    const cost = w.cost ?? (w.walled ? Infinity : freeCost(cols, w.x, w.y));
    if (w.walled || cost >= READ.TRAPPED_COST)
        return true;
    return halfOf(cols, w.x, w.y) <= READ.TOP_HALF && w.round >= READ.TOP_ROUND && cost >= READ.TOP_COST;
}
/** A white heading into trouble (the lead-up's measure, tools/distill-positions.mjs, 13 Nov: "the things that have gotten
    me into that position beforehand"): trapped (`isTrapped`), or its way out READ.TROUBLE swaps or more; in the furnace's
    column, past saving in the time left (`doomed`). */
export function inTrouble(cols, x, y, timeLeft) {
    if (cols[x][y] !== WHITE || x === 0)
        return false;
    const w = whiteRisk(cols, x, y, timeLeft);
    return isTrapped(cols, w) || freeCost(cols, x, y) >= READ.TROUBLE || (x === COLS - 1 && Number.isFinite(timeLeft) && doomed(cols, w, timeLeft));
}
/** A white in the furnace's column past saving: nothing frees it in two drags, or not in the time left (a drag's spot
    and a swap's slide at the bots' pace, FREE.DRAG swaps a drag). */
export function doomed(cols, w, timeLeft) {
    if (w.walled)
        return true;
    const cost = freeCost(cols, w.x, w.y);
    return cost === Infinity || cost * 200 > timeLeft;
}
const list = (ps, most = 3) => ps.slice(0, most).map(place).join(', ') + (ps.length > most ? ` and ${ps.length - most} more` : '');
/** Read a board (see the header). */
export function readBoard(cols, o) {
    const { stage } = o, timeLeft = Number.isFinite(o.timeLeft) ? o.timeLeft : RISK.BURN_MS;
    const patterns = patternsOf(cols, timeLeft), building = junkTarget(cols);
    const base = { stage, patterns, building, timeLeft };
    if (stage === 'chain')
        return { ...base, state: 'healthy', tactic: 'chain', why: 'the chain: whites right', whites: [], flagged: [], targets: [] };
    // A white in the furnace's column that nothing can free before it goes is given up as junk (the user, 13 Nov, P26:
    // "it's just completely doomed ... You should at least just say, well, you're doomed on that white, that's going to be
    // junk. But you can at least start getting the ones in column 9 out of the way"): it isn't read, so the board's read
    // as if it were junk, and the bot never waits on it.
    const all = whiteRisks(cols, timeLeft), lost = all.filter((w) => w.x === COLS - 1 && doomed(cols, w, timeLeft));
    const whites = all.filter((w) => !lost.includes(w)), flags = flagged(whites);
    for (const w of flags)
        w.cost = w.walled ? Infinity : freeCost(cols, w.x, w.y);
    const given = lost.length ? `${lost.length === 1 ? `column ${COLS}'s white` : `${lost.length} whites in column ${COLS}`} past saving, given up as junk; ` : '';
    const upside = patterns.upsideDown.flagged ? `; the junk the wrong way up (${patterns.upsideDown.wrong.length} browns high and blacks low): hoist the blacks with the browns before they strand` : '';
    const read = (state, tactic, why, targets) => ({ ...base, state, tactic, why: given + why + upside, whites, flagged: flags, targets, given: lost });
    const inBuilding = cols[building].filter((p) => p === WHITE).length - lost.filter((w) => w.x === building).length;
    const fireWhites = whites.filter((w) => w.x === COLS - 1);
    const trapped = flags.filter((w) => isTrapped(cols, w)), soon = (w) => w.burnsIn <= READ.URGENT_MS;
    const urgent = flags.filter(soon);
    const state = flags.length || patterns.upsideDown.flagged || (blockPhase(cols) && (patterns.ladder?.risk ?? 0) >= READ.LADDER) ? 'atRisk' : 'healthy';
    if (inBuilding >= READ.DAMAGE_WHITES && burnsIn(building, timeLeft) <= READ.DAMAGE_MS && patterns.fillable.columns <= READ.DAMAGE_FILL) {
        const t = whites.filter((w) => w.x >= building);
        return read('damageControl', 'fillGaps', `${inBuilding} whites still in column ${building + 1}, ${Math.round(burnsIn(building, timeLeft) / 1000)} s from the fire, and junk free for ${patterns.fillable.columns} column${patterns.fillable.columns === 1 ? '' : 's'}: fill its gaps however you can, the quickest first`, t);
    }
    if (fireWhites.length)
        return read('atRisk', 'fillGaps', `a white in the furnace's column: junk into its place first`, fireWhites);
    if (patterns.strandedShare >= READ.STRANDED && patterns.stranded.length >= READ.STRANDED_MIN) {
        return read('cracked', 'fixCracks', `${patterns.stranded.length} pieces of junk stranded among the whites (${list(patterns.stranded)}): free them, keeping the browns in the middle to do it with`, patterns.stranded);
    }
    // The ladder and the V are the block phase's: the zigzag up the sorted right side, the V wrapped round the whites.
    const block = blockPhase(cols);
    if (block && patterns.ladder && patterns.ladder.risk >= READ.LADDER) {
        return read('atRisk', 'sortLadder', `columns ${COLS - 1} and ${COLS} aren't sorted blacks over browns, and column ${COLS} goes in ${(timeLeft / 1000).toFixed(1)} s: sort the ladder before it's lost`, [{ x: COLS - 2, y: 0 }, { x: COLS - 1, y: 0 }]);
    }
    // Trapped whites whose column burns soon, then the easy ones burning soon, then trapped whites further off: the
    // quick fills come before a trapped white that can wait a column (P3, P4), never before one burning as soon (P6).
    const free = (ts) => read('atRisk', 'freeTrapped', `${ts.length === 1 ? 'a white' : `${ts.length} whites`} trapped near the fire (${list(ts)}), the worst first`, ts);
    if (trapped.some(soon))
        return free(trapped);
    // Time in hand and nothing at real risk (the user, 13 Nov, on P3: "No hurry ... I'll just be going down, browns up,
    // they're just really fast, quick, simple, easy moves"; "I think [P3] was quick sorting"): the whites burning soon all
    // free to go left now, their column not the furnace's, and every quick fill of their places itself a quick sorting
    // move, a black down or a brown up: the sorting fills them, so it's quick sorting.
    if (urgent.length && urgent.every((w) => w.free && w.burnsIn >= RISK.BURN_MS)) {
        const fills = quickFills(cols, urgent);
        if (fills.length && fills.every((d) => sorts(cols, d[0]))) {
            return read(state, 'quickSort', `${urgent.length === 1 ? 'a white' : `${urgent.length} whites`} by the fire free to go, with time in hand (${list(urgent)}): the quick sorting moves, blacks down and browns up, fill their places`, urgent);
        }
    }
    // A white trapped that can still be freed (in two drags, if not cheaply) before the quick fills: it only gets harder
    // (P5: "fixing those top two in column 8, because those seem like the biggest risks"); one past freeing waits.
    const freeable = trapped.filter((w) => (w.cost ?? Infinity) < Infinity);
    if (freeable.length)
        return free(freeable);
    if (urgent.length)
        return read('atRisk', 'fillGaps', `${urgent.length === 1 ? 'a white' : `${urgent.length} whites`} by the fire with ${urgent.length === 1 ? 'its column' : 'their columns'} burning soon (${list(urgent)}): junk into their places, the quickest first`, urgent);
    if (trapped.length)
        return free(trapped);
    if (block && patterns.tail.unsorted.length)
        return read(state, 'sortTail', `the V's tail unsorted (${list(patterns.tail.unsorted)}): browns down through the blacks, so the next sweep runs through`, patterns.tail.unsorted);
    if (block)
        return read(state, 'blocks', flags.length ? `the whites flagged (${list(flags)}) can wait: the junk moved in blocks` : 'nothing at risk, the whites mostly left: the junk moved in long drags, blocks at a time', []);
    return read(state, 'quickSort', flags.length ? `the whites flagged (${list(flags)}) can wait: quick, simple moves` : 'nothing at risk: quick, simple moves, blacks down and browns up', []);
}
// ---------------------------------------------------------------- what each tactic counts as progress
/** The browns kept as tools on a cracked board: browns among the whites, left of the colour, off the top half (the
    ones a stranded black climbs out over). */
export function toolBrowns(cols, r) {
    const out = [], right = Math.min(r.building, COLS - 1);
    const stuck = new Set(r.patterns.stranded.map((p) => p.x * 16 + p.y));
    for (let x = 0; x < right; x++)
        cols[x].forEach((p, y) => {
            if (p !== BROWN || stuck.has(x * 16 + y) || y * 2 < cols[x].length)
                return;
            if ([UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT].filter((w) => { const n = neighbourOn(cols, x, y, w); return !!n && cols[n[0]][n[1]] === WHITE; }).length >= 2)
                out.push({ x, y });
        });
    return out;
}
/** The whites' risk by the fire, added up. */
const riskSum = (b, timeLeft) => whiteRisks(b, timeLeft).reduce((s, w) => s + w.risk, 0);
/** Where a drag lets its piece go. */
export function endOf(cols, d) {
    let at = [d.x, d.y];
    for (const w of d.ways) {
        const n = neighbourOn(cols, at[0], at[1], w);
        if (!n)
            break;
        at = n;
    }
    return at;
}
/** How freely the pieces round a place move: the swaps that can be made between pieces within FLOW_NEAR columns and
    twice that in half rows of it (the user, P1: "there's just no way for things to move as freely up there"). */
export function flow(cols, t) {
    const h0 = halfOf(cols, t.x, t.y), near = (x, y) => Math.abs(x - t.x) <= READ.FLOW_NEAR && Math.abs(halfOf(cols, x, y) - h0) <= 2 * READ.FLOW_NEAR;
    let n = 0;
    for (let x = Math.max(0, t.x - READ.FLOW_NEAR); x < Math.min(COLS - 1, t.x + READ.FLOW_NEAR + 1); x++)
        cols[x].forEach((_, y) => {
            if (!near(x, y))
                return;
            for (const w of [UP_RIGHT, DOWN_RIGHT]) {
                const m = neighbourOn(cols, x, y, w);
                if (m && near(m[0], m[1]) && canSwapOn(cols, x, y, m[0], m[1]))
                    n++;
            }
        });
    return n;
}
/** The whites in the right-hand pair, and in the column left of it. */
const pairWhites = (b) => [COLS - 3, COLS - 2, COLS - 1].map((x) => b[x].filter((p) => p === WHITE).length).join();
/** What a move (its drags, and the board it leaves) gets done for the tactic: 0 or less, nothing (it isn't offered
    under the tactic). `target`: freeing whites, only this one counts (the most at risk worked first).
    - fillGaps: its last drag lets junk go in a target white's place (the white gone left), and the whites' risk by the
      fire it takes away;
    - freeTrapped: the target white gone from its place, and the risk it takes away; failing any that does, what it
      takes off the target's own risk where it is (the way opened to it);
    - sortLadder: the right-hand pair's browns-over-blacks pairs it sorts, no white let in or out;
    - sortTail: the bottom's order it betters (half pieces, browns down, blacks up), in swaps;
    - fixCracks: the stranded junk it frees. */
export function progress(r, cols, after, drags = [], target, opening = false) {
    switch (r.tactic) {
        case 'fillGaps': {
            const last = drags[drags.length - 1];
            if (!last)
                return 0;
            const [ex, ey] = endOf(cols, last), before = drags.length > 1 ? playDrags(cols, drags.slice(0, -1)) : cols;
            if (!before || before[ex][ey] !== WHITE || !isJunk(after[ex][ey]) || !r.targets.some((t) => t.x === ex && t.y === ey))
                return 0;
            // (Damage control: junk from near the gap only; junk further off is kept to hoist with.)
            if (r.state === 'damageControl' && last.x < ex - READ.DAMAGE_NEAR)
                return 0;
            return riskSum(cols, r.timeLeft) - riskSum(after, r.timeLeft);
        }
        case 'freeTrapped': {
            const ts = target ? [target] : r.targets;
            if (opening) {
                const t = ts[0];
                if (!t || after[t.x][t.y] !== WHITE)
                    return 0;
                const opened = whiteRisk(cols, t.x, t.y, r.timeLeft).risk - whiteRisk(after, t.x, t.y, r.timeLeft).risk;
                if (opened > 0)
                    return opened;
                // Nothing opens the way to it yet: the pieces round it set moving again ("really fixing that top right corner
                // to get those whites unstuck", P1), its risk by the fire no worse.
                if (riskSum(after, r.timeLeft) > riskSum(cols, r.timeLeft))
                    return 0;
                return (flow(after, t) - flow(cols, t)) / 4;
            }
            if (!ts.some((t) => cols[t.x][t.y] === WHITE && after[t.x][t.y] !== WHITE))
                return 0;
            return riskSum(cols, r.timeLeft) - riskSum(after, r.timeLeft);
        }
        case 'sortLadder': return pairWhites(cols) === pairWhites(after) ? ladderBad(cols) - ladderBad(after) : 0;
        case 'sortTail': return (tailOrder(after, r.patterns.tail.from) - tailOrder(cols, r.patterns.tail.from)) / 2;
        case 'fixCracks': {
            const freed = r.patterns.stranded.length - stranded(after).length;
            return freed;
        }
        default: return 0;
    }
}
// ---------------------------------------------------------------- moves the tactics look for themselves
/** Every drag of the piece at (x, y) up to `most` swaps, along legal swaps, kept when `keep` likes where it is. */
function trace(cols, x, y, most, ok, keep, cap = 400) {
    const b = copyBoard(cols), out = [], path = [];
    let nodes = 0;
    const dfs = (cx, cy) => {
        if (path.length >= most || nodes++ > cap)
            return;
        for (const w of [UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT]) {
            const n = neighbourOn(b, cx, cy, w);
            if (!n || !ok(n) || !canSwapOn(b, cx, cy, n[0], n[1]))
                continue;
            const t = b[cx][cy];
            b[cx][cy] = b[n[0]][n[1]];
            b[n[0]][n[1]] = t;
            path.push(w);
            if (keep(b, n, [cx, cy]))
                out.push({ x, y, ways: [...path] });
            dfs(n[0], n[1]);
            path.pop();
            b[n[0]][n[1]] = b[cx][cy];
            b[cx][cy] = t;
        }
    };
    dfs(x, y);
    return out;
}
/** The quick fills: junk dragged into a target white's place from its left (the white goes left), READ.FILL_SWAPS
    swaps at most, from within READ.FILL_NEAR columns. */
export function quickFills(cols, targets) {
    const want = new Set(targets.filter((t) => cols[t.x][t.y] === WHITE).map((t) => t.x * 16 + t.y));
    if (!want.size)
        return [];
    const minX = Math.min(...targets.map((t) => t.x)), out = [];
    for (let x = Math.max(0, minX - READ.FILL_NEAR); x < COLS; x++)
        cols[x].forEach((p, y) => {
            if (!isJunk(p))
                return;
            // (Its last swap from the left: the white it takes the place of goes left.)
            for (const d of trace(cols, x, y, READ.FILL_SWAPS, () => true, (b, at, from) => want.has(at[0] * 16 + at[1]) && from[0] < at[0]))
                out.push([d]);
        });
    return out;
}
/** Short drags of the pieces round a place (within READ.FLOW_NEAR columns and twice that in half rows), up to 4
    swaps: the small moves that free a trapped white (a brown looped round under it and back), open the way to it, or set
    the pieces round it moving. */
export function nearDrags(cols, t, most = 4) {
    const out = [], h0 = halfOf(cols, t.x, t.y);
    for (let x = Math.max(0, t.x - READ.FLOW_NEAR); x <= Math.min(COLS - 1, t.x + READ.FLOW_NEAR); x++)
        cols[x].forEach((p, y) => {
            if (p === WHITE || !isJunk(p) || Math.abs(halfOf(cols, x, y) - h0) > 2 * READ.FLOW_NEAR)
                return;
            for (const d of trace(cols, x, y, most, () => true, () => true, 120))
                out.push([d]);
        });
    return out;
}
/** The ladder's drags: a piece of the right-hand pair moved within it, READ.SORT_SWAPS swaps at most, each leaving the
    pair better sorted. */
export function ladderDrags(cols) {
    const out = [], from = COLS - 2, bad = ladderBad(cols);
    for (let x = from; x < COLS; x++)
        cols[x].forEach((p, y) => {
            if (p !== BROWN && p !== BLACK)
                return;
            for (const d of trace(cols, x, y, READ.SORT_SWAPS, (n) => n[0] >= from, (b) => ladderBad(b) < bad))
                out.push([d]);
        });
    return out;
}
/** The tail's drags: a brown of the V's tail sunk down through the blacks, READ.SORT_SWAPS swaps at most. */
export function tailDrags(cols, r) {
    const out = [];
    for (const t of r.patterns.tail.unsorted) {
        for (const d of trace(cols, t.x, t.y, READ.SORT_SWAPS, () => true, (b, at) => b[at[0]][at[1]] === BROWN, 200)) {
            const after = playDrags(cols, [d]);
            if (after && d.ways.every((w) => w === DOWN_LEFT || w === DOWN_RIGHT))
                out.push([d]);
        }
    }
    return out;
}
/** Hoisting's order (the user, 13 Nov, P17, P20, P27: "using the brown to kind of hoist up some in column 2 and 3";
    "you've got to do like hoisting things up and down with the browns"): in columns 0 to `to` - 1, every brown's depth
    in half pieces less every black's. A brown sunk a swap through a black (the black rising past it) adds 2; a brown
    risen through whites or a black dropped through them takes away. */
export function hoistOrder(cols, to) {
    let v = 0;
    for (let x = 0; x < Math.min(to, COLS); x++)
        cols[x].forEach((p, y) => { if (p === BROWN)
            v += halfOf(cols, x, y);
        else if (p === BLACK)
            v -= halfOf(cols, x, y); });
    return v;
}
/** Hoisting's drags: a brown sunk down through blacks, lifting them, or a black lifted up through browns, left of column
    `to` (the colour, or the gaps being filled), READ.HOIST_SWAPS swaps at most, bringing blacks and browns together
    rather than splitting them further: each piece's drag that betters `hoistOrder` the most a swap, nothing stranded. */
export function hoistDrags(cols, to) {
    const out = [], base = hoistOrder(cols, to), s0 = stranded(cols).length;
    for (let x = 0; x < Math.min(to, COLS); x++)
        cols[x].forEach((p, y) => {
            if (p !== BROWN && p !== BLACK)
                return;
            let best = null;
            for (const d of trace(cols, x, y, READ.HOIST_SWAPS, (n) => n[0] < to, (b) => hoistOrder(b, to) > base, 120)) {
                const v = (hoistOrder(playDrags(cols, [d]), to) - base) / (d.ways.length + 2);
                if (!best || v > best.v)
                    best = { d, v };
            }
            if (best && stranded(playDrags(cols, [best.d])).length <= s0)
                out.push([best.d]);
        });
    return out;
}
/** The V's tip (the user, 13 Nov, P29, P30: "the point of the browns down is you want them at that kind of bottom left
    tip. So that black, for example, at the bottom of column 7 is what you would want to swap with the drag the brown
    into"): the leftmost black in the V's tail, its bottom rows. Null if none. */
export function vTip(cols, r) {
    const t = r.patterns.tail;
    // (Joined to the junk on its right, a piece of the V: not a black stranded on its own further left.)
    const joined = (x, y) => [UP_RIGHT, DOWN_RIGHT].some((w) => { const n = neighbourOn(cols, x, y, w); return !!n && isJunk(cols[n[0]][n[1]]); });
    for (let x = t.from; x <= Math.min(t.to + 1, COLS - 1); x++) {
        for (let y = cols[x].length - 1; y >= cols[x].length - PATTERN.TAIL_ROWS; y--)
            if (cols[x][y] === BLACK && joined(x, y))
                return { x, y };
    }
    return null;
}
/** A brown brought down to the V's tip, swapped in for the black there (the black lifted): READ.SORT_SWAPS swaps at most. */
export function tipDrags(cols, r) {
    const tip = vTip(cols, r), out = [];
    if (!tip)
        return out;
    for (let x = 0; x < COLS; x++)
        cols[x].forEach((p, y) => {
            if (p !== BROWN)
                return;
            const ds = trace(cols, x, y, READ.SORT_SWAPS, () => true, (b, at) => at[0] === tip.x && at[1] === tip.y && b[tip.x][tip.y] === BROWN, 200);
            ds.sort((a, b) => a.ways.length - b.ways.length);
            if (ds.length)
                out.push([ds[0]]);
        });
    return out;
}
/** A quick sorting drag (P3): a black taken down, or a brown up. */
export function sorts(cols, d) {
    const p = cols[d.x][d.y], [ex, ey] = endOf(cols, d);
    return (p === BLACK && halfOf(cols, ex, ey) > halfOf(cols, d.x, d.y)) || (p === BROWN && halfOf(cols, ex, ey) < halfOf(cols, d.x, d.y));
}
/** Whether a move moves any of these pieces. */
export const moves = (cols, after, ps) => ps.some((p) => after[p.x][p.y] !== cols[p.x][p.y]);
