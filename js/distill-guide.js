/* Distilling, the read version (distilling-guide.html): every picture and name on it, worked out from the same code
   as Helium's lesson and the bots, so the page can't drift from them. TypeScript, compiled to js/distill-guide.js;
   tested in tests/distill-guide.test.ts; drawn by the hand-written js/distill-guide-view.js.

   The user (13 Nov): "a summary document of the strategy that the bot is taking now ... what are the rules, what are
   the phases, what are the tricks and techniques ... a read version ... a 2D static version of the guide, and ...
   everything's just kept in sync, like the animated version, the 2D static version" (RULES.md, "Every tutorial has
   a read version, kept in sync").

   - The rules: the pieces' weights and points, the swaps the rule allows (`beats`), the furnace's seconds, columns
     judged as the game judges them (`judge`), the chain bonus: all read off src/distilling.ts.
   - The phases (src/distill-phase.ts, PHASES): the fire's side and the fill on the lesson's own board, before and
     after its step one (src/den-helium.ts); blocks and the chain on boards a bot reached (src/distill-guide-boards.ts).
     Each checked to be that phase by `phaseOf`.
   - The levels (src/distill-bots.ts, LEVELS): each target's bank (`bankFor`) and the techniques it plays.
   - The techniques (src/distill-routines.ts, ROUTINES, with the sweep and the path search): each drawn on a real
     board with the move its own `find` offers there, the move the bot played or the lesson plays.
   - The user's tricks: each on a board where it shows, marked by the planner's own reading of it (`dangerZones`,
     `edgeWhites`, `keptTools`, `clearComingUp`); the sorted right side's one fluid motion (the thirty-first note)
     found on a sorted board by `fluidMotion` and checked by `isFluid`.
   - Reading the board (src/distill-read.ts): its states and tactics, on the positions the user critiqued, each read
     as the planner reads it, with the bot's move there now (`readingExamples`).
   - The page's order (`PLAN`, 13 Nov): the rules and a target, the rules of thumb (`RULES_OF_THUMB`, 14 Nov), then
     each phase in a game's order with its own moves under it, simplest first; only the ones that teach well, the
     rest `BEHIND_THE_SCENES` (14 Nov).
   - Helium's lines, quoted from src/lines/helium.ts.
   The words round them are the page's own, written by hand.

   Pure: no randomness (the lesson's deal is seeded), no clock, no DOM. */
import { BLACK, BROWN, BURNT, BURN_TICKS, CARRY_ON, CHAIN_BONUS, COLS, DOWN_LEFT, DOWN_RIGHT, FLASK, MESSAGES, POINTS, SPICE, TICK_MS, UP_LEFT, UP_RIGHT, WHITE, beats, canSwapOn, goesUp, judge, neighbourOn, parseBoard, weightOf, } from './distilling.js';
import { ROUTINES, canGo, clear, copyBoard, junkTarget, playDrags, burnsClean, rightFrom, whitesFrom } from './distill-routines.js';
import { FIRE_COLS, PHASES, PHASE_ORDER } from './distill-phase.js';
import { LEVELS, PATH_LABEL, PER_COLUMN, SWEEP_LABEL, bankFor, chainZones, clearComingUp, contextFor, dangerZones, edgeWhites, levelNamed, plainDrag } from './distill-bots.js';
import { blockPhase, keptTools } from './distill-score.js';
import { bringRound, pairRescue, stuck } from './distill-path.js';
import { channelRuns } from './distill-channel.js';
import { STEP_ONE_CTX, afterOpening, aimFor, beforeBang, lessonPlan, opening, lessonGame } from './den-helium.js';
import { DRAG_TRICKS, LADDER, dragTricks, makeWay, teachLevel } from './distill-teach.js';
import { BEST, HELP, HELP_ELSE, NERVES, ONWARD, OPENING, PHASE, SPOT, STEP_ONE, TEACH, TELL } from './lines/helium.js';
import { POSITIONS } from './distill-guide-boards.js';
import { POSITIONS as POSITIONS_SEEN, boardOf, botAt } from './distill-positions.js';
import { STATES, TACTICS, readBoard } from './distill-read.js';
/** The user's tricks (DISTILLING.md §3, the twentieth to twenty-ninth notes, the thirty-first's fluid motion, the
    pair rescue in the chain, 13 Nov, and the late game's channels, 14 Nov). */
export const TRICKS = ['white', 'danger', 'edge', 'flick', 'blocks', 'kept', 'burnEarly', 'fluid', 'pair', 'channelIn'];
const tech = (name, longer = false) => (longer ? { kind: 'technique', name, longer } : { kind: 'technique', name });
const trick = (name) => ({ kind: 'trick', name });
/** The rules of thumb, a section of their own before the phases, apart from the moves (the user, 14 Nov: "these are
    scenarios, not moves"): what a player needs first, whatever they're doing. */
export const RULES_OF_THUMB = ['white', 'danger', 'edge'];
/** The page's moves in the course of a game (the user, 13 Nov: "a few of the simple things are a bit out of order
    ... progression's a bit weird"): each phase in a game's order, and under it its own moves, simplest first. Only
    the ones that teach well (14 Nov: "I love how we've got the moves like the hook, pull a line of browns. But ...
    some of the moves are good for behind the scenes but need hiding ... it's all just a bit noisy. It feels like
    you've got to, like, find the diamonds in the rough"); the rest are BEHIND_THE_SCENES. */
export const PLAN = {
    fire: [tech('sweep')],
    fill: [tech('diamond'), tech('turnOver')],
    block: [tech('leapfrog')],
    chain: [tech('hook', true), tech('linePull', true)],
};
/** The techniques and tricks the bots still play and the tests still check, each with its board worked out, but
    kept off the read version since 14 Nov (the crawl: "I really can't even see what the crawl is. Those arrows are so
    confusing"; the channel made for a white: "these are scenarios, not moves"). Each phase's in its old place on the
    page: storing waits till the junk on the right is down to a few columns (`sortingTime`), the channels and the
    pair rescue open the chain. */
export const BEHIND_THE_SCENES = {
    fire: [tech('rescue')],
    fill: [tech('junkColumn'), trick('flick'), trick('burnEarly')],
    block: [trick('blocks'), trick('kept'), tech('store'), trick('fluid')],
    chain: [tech('channel'), trick('pair'), trick('channelIn'), tech('crawl', true), tech('figureEight', true), tech('path')],
};
// ---------------------------------------------------------------- where the boards come from
/** A board a bot reached, as the page says it: the deal and how far in. */
const fromPosition = (p) => {
    const s = Math.round(p.ms / 1000);
    return `A real deal (seed ${p.seed}), ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} in, as a practice player aiming for ${p.bot.toUpperCase().replace('CC', 'CC^')} ${p.chosen ? 'played it' : 'found it'}`;
};
const LESSON_FROM = 'Helium\'s lesson board';
const same = (a, b) => a.length === b.length && a.every((w, i) => w === b[i]);
/** Whether a move offered (`full`) is the one played (`played`): the same drags, the last let go anywhere along its
    way (the planner lets a drag go where it's best, src/distill-bots.ts `judge`). */
export function sameMove(full, played) {
    if (!played.length || full.length !== played.length)
        return false;
    return played.every((d, i) => {
        const f = full[i];
        if (d.x !== f.x || d.y !== f.y)
            return false;
        return i < played.length - 1 ? same(d.ways, f.ways) : d.ways.length >= 1 && d.ways.length <= f.ways.length && d.ways.every((w, k) => w === f.ways[k]);
    });
}
/** The position kept for a key (src/distill-guide-boards.ts); throws if the tool hasn't picked one. */
export function position(key) {
    const p = POSITIONS[key];
    if (!p)
        throw new Error(`no board for ${key}: run tools/distill-guide.mjs`);
    return p;
}
/** A kept position's move, live: the move its routine's own `find` offers on the board now that's the one played
    there (`offered`): the routine's whole move (`full`, a technique's picture) and as far as the bot took it
    (`played`, a trick's). If the routine no longer offers it, its first move there (the test then fails, to pick
    the boards again). The path search's and a burn's are as kept. */
export function liveMove(p) {
    const cols = parseBoard(p.cols);
    if (!p.by || p.by === 'path')
        return { full: p.drags, played: p.drags, offered: !!playDrags(cols, p.drags) };
    const moves = ROUTINES[p.by].find(cols, p.ctx);
    const m = moves.find((x) => sameMove(x.drags, p.drags));
    if (m)
        return { full: m.drags, played: p.drags, offered: true };
    const first = moves[0]?.drags ?? [];
    return { full: first, played: first, offered: false };
}
// ---------------------------------------------------------------- the rules
/** The pieces, in the game's order: weight (which way a column goes), points sent up, whether it swaps. */
export const PIECES = [WHITE, BROWN, BLACK, SPICE, BURNT].map((p) => ({ piece: p, weight: weightOf(p), points: POINTS[p], swaps: p !== SPICE }));
/** The swaps the rule allows: lower over upper, the lower beating the upper (rock, paper, scissors). */
export const SWAPS = [WHITE, BROWN, BLACK].flatMap((lower) => [WHITE, BROWN, BLACK].filter((upper) => beats(lower, upper)).map((upper) => ({ lower, upper })));
/** Seconds the furnace takes to burn the right-hand column (the 50th tick). */
export const FURNACE_SECS = Math.round(((BURN_TICKS + 1) * TICK_MS) / 100) / 10;
export { CHAIN_BONUS, FLASK, CARRY_ON };
/** Columns judged as the game judges them: a column written top to bottom, and the Crystal Clears straight before
    it. Which way it goes, its points, its message. */
const SAMPLE_COLUMNS = [
    { col: 'wwwwwwwww', before: 0 },
    { col: 'wwwwwwwww', before: 3 },
    { col: 'www*wwww', before: 1 },
    { col: 'wwwwwbbww', before: 2 },
    { col: 'bbbbbbbb', before: 2 },
    { col: 'wwKKwbKKw', before: 0 },
    { col: 'KKKbbbbw', before: 0 },
];
export function sampleColumns() {
    return SAMPLE_COLUMNS.map(({ col, before }) => {
        const pieces = parseBoard([col])[0], c = judge(pieces, before);
        return { pieces, before, up: c.up, points: c.points + c.bonus, bonus: c.bonus, chain: c.chain, message: c.message ? MESSAGES[c.message] : null, spice: c.spice ? MESSAGES[c.spice] : null };
    });
}
/** The lesson's board before and after its step one, and its step one's drags. */
function lessonBoards() {
    const g = afterOpening(), before = copyBoard(g.cols);
    const clearBeat = lessonPlan(g).find((b) => b.name === 'clear');
    const drags = clearBeat && clearBeat.act.kind === 'drags' ? clearBeat.act.drags.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] })) : [];
    return { before, after: copyBoard(g.cols), drags };
}
/** Whites on the fire's side, ringed (the lesson rings them so). */
const fireWhites = (cols) => {
    const out = [];
    for (let x = COLS - FIRE_COLS; x < COLS; x++)
        cols[x].forEach((p, y) => { if (p === WHITE || p === BURNT)
            out.push([x, y]); });
    return out;
};
const range = (a, b) => Array.from({ length: b - a }, (_, i) => a + i);
/** The junk columns done from the fire in, and the one being filled. */
const junkSide = (cols) => range(junkTarget(cols), COLS);
export function phaseExamples() {
    const lesson = lessonBoards();
    const kept = (key, shade, rings = () => []) => {
        const p = position(key), cols = parseBoard(p.cols);
        return { cols, drags: liveMove(p).played, rings: rings(cols), shade: shade(cols), from: fromPosition(p) };
    };
    const pictures = {
        fire: { cols: lesson.before, drags: lesson.drags, rings: fireWhites(lesson.before), shade: range(COLS - FIRE_COLS, COLS), from: `${LESSON_FROM}, Helium's step one` },
        fill: { cols: lesson.after, drags: [], rings: [], shade: junkSide(lesson.after), from: `${LESSON_FROM}, after step one` },
        block: kept('phase:block', () => range(COLS - 3, COLS), toolsAt),
        chain: kept('phase:chain', (cols) => range(0, COLS).filter((x) => clear(cols[x]))),
    };
    return PHASE_ORDER.map((phase) => ({
        phase, ...PHASES[phase], says: PHASE[phase].first, stage: phase === 'chain' ? 'chain' : 'junk', picture: pictures[phase],
    }));
}
/** Each target, lowest first: the columns of whites banked before its chain, and the techniques it plays (every
    level sweeps and brings a piece round too). */
export function levelRows() {
    let had = [];
    return LEVELS.map((l) => {
        const techniques = ['sweep', ...l.routines, ...(l.path ? ['path'] : [])];
        const adds = techniques.filter((t) => !had.includes(t));
        had = techniques;
        return { name: l.name, label: l.label, target: l.target, bank: bankFor(l.target), whites: Math.round(bankFor(l.target) * PER_COLUMN), techniques, adds };
    });
}
/** The lowest target whose bot plays a technique. */
export const firstLevel = (t) => levelRows().find((l) => l.techniques.includes(t));
/** Every technique in the order a player meets them: the sweep, then each level's new ones, the path search last. */
export function techniqueOrder() {
    const order = [];
    for (const l of levelRows())
        for (const t of l.adds)
            if (t !== 'path' && !order.includes(t))
                order.push(t);
    for (const r of Object.keys(ROUTINES))
        if (!order.includes(r))
            order.push(r);
    return [...order, 'path'];
}
const labelOf = (t) => (t === 'sweep' ? SWEEP_LABEL : t === 'path' ? PATH_LABEL : ROUTINES[t].label);
/** Saving the whites, on the lesson's own board: the first move Helium plays in step one, as the routine offers it. */
function rescueOnLesson() {
    const lesson = lessonBoards();
    const moves = ROUTINES.rescue.find(lesson.before, STEP_ONE_CTX);
    const m = moves.find((x) => x.drags.length <= lesson.drags.length && x.drags.every((d, i) => d.x === lesson.drags[i].x && d.y === lesson.drags[i].y && same(d.ways, lesson.drags[i].ways)));
    const drags = m?.drags ?? moves[0]?.drags ?? [];
    return { picture: { cols: lesson.before, drags, rings: fireWhites(lesson.before), shade: range(COLS - FIRE_COLS, COLS), from: `${LESSON_FROM}, Helium's first move` }, offered: !!m };
}
export function techniqueExamples() {
    return techniqueOrder().map((name) => {
        let picture, offered;
        if (name === 'rescue')
            ({ picture, offered } = rescueOnLesson());
        else {
            const p = position(`technique:${name}`), cols = parseBoard(p.cols), live = liveMove(p);
            picture = { cols, drags: live.full, rings: [], shade: [], from: fromPosition(p) };
            offered = live.offered && (name !== 'sweep' || plainDrag(live.played)) && (name !== 'path' || stuck(cols, p.ctx).length > 0);
        }
        const says = name === 'sweep' ? HELP.diamond : HELP[name];
        return { name, label: labelOf(name), says, level: firstLevel(name)?.label ?? null, picture, offered };
    });
}
// ---------------------------------------------------------------- the sorted right side's one fluid motion
/** A sorted right side (DISTILLING.md, the thirty-first note), as a real game at Helium's still had it
    (notes/distilling/45-sorted-right-side-one-fluid-motion.webp): the whites a block on the left and middle, the
    right-hand columns junk, blacks along the top and browns low. */
export const SORTED_RIGHT = ['bKKwKwwK', 'wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wKwwwwww', 'KKKwwwbbb', 'KKbbwbbb', 'KKKbbbbbb', 'KbKbbbbK', 'bbKKKKKK*'];
/** How far the right side (from `from`) is out of its order: each brown above a black in the same column. */
export function unsorted(cols, from) {
    let n = 0;
    for (let x = from; x < COLS; x++)
        cols[x].forEach((p, i) => { if (p === BROWN)
            for (let j = i + 1; j < cols[x].length; j++)
                if (cols[x][j] === BLACK)
                    n++; });
    return n;
}
/** A black that's joined the blacks: nothing but blacks (or the edge, or a spice) above it, so it climbs no further. */
export function amongBlacks(cols, x, y) {
    if (cols[x][y] !== BLACK || (y > 0 && cols[x][y - 1] !== BLACK))
        return false;
    return [UP_RIGHT, UP_LEFT].every((w) => { const n = neighbourOn(cols, x, y, w); return !n || cols[n[0]][n[1]] === BLACK || cols[n[0]][n[1]] === SPICE; });
}
const isDown = (w) => w === DOWN_LEFT || w === DOWN_RIGHT;
/** Where a drag leaves its piece. */
export function endOf(cols, d) {
    let at = [d.x, d.y];
    for (const w of d.ways)
        at = neighbourOn(cols, at[0], at[1], w);
    return at;
}
/** The fluid motion (the user, 13 Nov: "once there's a nice clear separation, it's just down, up and back up
    again"): on a sorted right side, a black from the far left (not a corner tool kept top-left) dragged down
    through the whites, then up through the browns, in one drag, until it's joined the blacks on the right, with the
    right side no less sorted and no white let into it. The fewest swaps. */
export function fluidMotion(cols, reach = 20) {
    const from = rightFrom(cols), order = unsorted(cols, from), whites = whitesFrom(cols, from);
    let best = null;
    for (let x0 = 0; x0 < 2; x0++)
        for (let y0 = 2; y0 < cols[x0].length; y0++) {
            if (cols[x0][y0] !== BLACK)
                continue;
            const b = copyBoard(cols), ways = [], seen = new Set([x0 * 16 + y0]);
            let nodes = 0;
            const dfs = (x, y, rising) => {
                if (ways.length >= reach || (best && ways.length >= best.ways.length) || nodes++ > 20000)
                    return;
                for (const w of [DOWN_RIGHT, UP_RIGHT, DOWN_LEFT, UP_LEFT]) {
                    if (rising && isDown(w))
                        continue;
                    const n = neighbourOn(b, x, y, w);
                    if (!n || seen.has(n[0] * 16 + n[1]) || !canSwapOn(b, x, y, n[0], n[1]))
                        continue;
                    const t = b[x][y];
                    b[x][y] = b[n[0]][n[1]];
                    b[n[0]][n[1]] = t;
                    ways.push(w);
                    seen.add(n[0] * 16 + n[1]);
                    if (n[0] >= from && ways.some(isDown) && !isDown(w) && amongBlacks(b, n[0], n[1]) && unsorted(b, from) <= order && whitesFrom(b, from) <= whites
                        && (!best || ways.length < best.ways.length))
                        best = { x: x0, y: y0, ways: [...ways] };
                    else
                        dfs(n[0], n[1], rising || !isDown(w));
                    seen.delete(n[0] * 16 + n[1]);
                    ways.pop();
                    b[n[0]][n[1]] = b[x][y];
                    b[x][y] = t;
                }
            };
            dfs(x0, y0, false);
        }
    return best;
}
/** Whether a drag is the fluid motion on its board: legal, a black, down first and then only up, ending among the
    blacks on the right with the right side no less sorted. */
export function isFluid(cols, d) {
    const after = playDrags(cols, [d]), from = rightFrom(cols);
    if (!after || cols[d.x][d.y] !== BLACK || !d.ways.length || !isDown(d.ways[0]))
        return false;
    const turn = d.ways.findIndex((w) => !isDown(w));
    if (turn < 0 || d.ways.slice(turn).some(isDown))
        return false;
    const [ex, ey] = endOf(cols, d);
    return ex >= from && amongBlacks(after, ex, ey) && unsorted(after, from) <= unsorted(cols, from) && whitesFrom(after, from) <= whitesFrom(cols, from);
}
// ---------------------------------------------------------------- the pair rescue, in the chain
/** A brown stuck at the top of the column going up (the user, 13 Nov: "this is absolute danger mode ... the first
    thing I would be doing here is just rescuing that brown piece ... You got a brown piece there, look, that can
    move up, and then a black that can hop along the top"): the furnace's column all white but a brown at its top, a
    black on the top row a few columns left, a brown below it that can move up, the junk on the left. */
export const STUCK_ON_TOP = ['bKbKbKbK', 'KbKbwKbKb', 'bKwbKbKw', 'KwbwKwbww', 'wwwwwwww', 'Kwwwwwwww', 'wbwwwwww', 'wwwwwwwww', 'wwwwwwww', 'bwwwwwwww'];
/** The pair rescue on a board, live: the chain's zone (`chainZones`), its stuck piece, and the drags the bots'
    `pairRescue` finds for the lowest target, which frees the column where no one piece brought round does. */
export function pairOn(cols) {
    const ctx = contextFor(cols, 'chain', 0, LEVELS[0].reach), zone = chainZones(cols, ctx)[0] ?? null;
    if (zone === null)
        return { zone, stuck: null, drags: [], frees: false };
    const y = cols[zone].findIndex((p, i) => (p === BROWN || p === BLACK) && !canGo(cols, zone, i, -1));
    const drags = pairRescue(cols, zone, ctx, levelNamed(LEVELS[0].name)) ?? [];
    const after = drags.length ? playDrags(cols, drags) : null;
    const alone = bringRound(cols, { x: zone, y, side: -1 }, levelNamed(LEVELS[0].name));
    return { zone, stuck: [zone, y], drags, frees: !!after && !alone && after[zone].every((p) => p === WHITE || p === SPICE) };
}
// ---------------------------------------------------------------- the late game's channels
/** The board the late game's channels are drawn on: the user's own (P43, 14 Nov), the column second from the fire being
    filled with two blacks in it. */
export const CHANNEL_POSITION = 'P43';
/** The late game's channels on a board, live (src/distill-channel.ts): column `fill` cleared a piece of junk at a time,
    each the cheapest plan the bots find on the board the last one left (a white along a channel, the channel built first
    where need be); its drags in order, the junk it replaces, and whether the column's left all white. */
export function channelOn(cols, fill) {
    const ctx = { stage: 'chain', burnFrom: fill + 1, fill, reach: LEVELS[0].reach }, pace = levelNamed(LEVELS[0].name);
    const drags = [], into = [];
    let b = cols;
    for (let i = 0; i < 4 && b[fill].some((p) => p === BROWN || p === BLACK); i++) {
        const plan = channelRuns(b, ctx, pace)[0], after = plan && playDrags(b, plan.drags);
        if (!plan || !after)
            break;
        drags.push(...plan.drags);
        into.push(plan.into);
        b = after;
    }
    return { drags, into, clears: drags.length > 0 && b[fill].every((p) => p === WHITE || p === SPICE) };
}
/** The corner tools (keptTools): a brown in the bottom-left corner, a black in the top-left. */
function toolsAt(cols) {
    const out = [];
    for (let x = 0; x < 2; x++)
        cols[x].forEach((p, y) => { if ((p === BROWN && y >= cols[x].length - 2) || (p === BLACK && y <= 1))
            out.push([x, y]); });
    return out;
}
const hardWhites = (cols, x) => cols[x].flatMap((p, y) => (p === WHITE && !canGo(cols, x, y, -1) ? [[x, y]] : []));
const whitesIn = (cols, x) => cols[x].filter((p) => p === WHITE).length;
export function trickExamples() {
    const kept = (key) => { const p = position(key), cols = parseBoard(p.cols); return { p, cols, drags: liveMove(p).played, from: fromPosition(p) }; };
    const out = [];
    // Every bot plays the tricks (the planner's own), so each comes in at the first level; the fluid motion once the
    // right side's turned over.
    const every = levelRows()[0].label;
    for (const trick of TRICKS) {
        if (trick === 'white') {
            // The opening's board, the column at the fire with a white in it: the bang.
            const cols = copyBoard(beforeBang().cols), last = COLS - 1;
            const rings = cols[last].flatMap((p, y) => (p === WHITE ? [[last, y]] : []));
            const bang = opening(lessonGame()).some((b) => b.mishap);
            out.push({ trick, says: OPENING.safe, level: every, picture: { cols, drags: [], rings, shade: [last], burn: true, from: `${LESSON_FROM}, Helium's opening` }, shows: bang && rings.length > 0 && !goesUp(cols[last]) });
            continue;
        }
        if (trick === 'fluid') {
            // A sorted right side, the black's one drag found on it, live.
            const cols = parseBoard(SORTED_RIGHT), d = fluidMotion(cols), from = rightFrom(cols);
            out.push({
                trick, says: null, level: firstLevel('turnOver')?.label ?? null,
                picture: { cols, drags: d ? [d] : [], rings: [], shade: range(from, COLS), from: 'A real game at Helium\'s still, the right side sorted' },
                shows: !!d && isFluid(cols, d),
            });
            continue;
        }
        if (trick === 'channelIn') {
            // The user's own board (P43), the channels found on it live.
            const p = POSITIONS_SEEN.find((q) => q.id === CHANNEL_POSITION), cols = boardOf(p), fill = botAt(p).column ?? COLS - 2, c = channelOn(cols, fill);
            out.push({
                trick, says: null, level: every,
                picture: { cols, drags: c.drags, rings: c.into, shade: [fill], from: 'A real game: the column going up second from the fire, two blacks stuck in it' },
                shows: c.clears && c.into.length >= 2,
            });
            continue;
        }
        if (trick === 'pair') {
            // The user's board, the plan found on it live.
            const cols = parseBoard(STUCK_ON_TOP), p = pairOn(cols);
            out.push({
                trick, says: HELP.path, level: every,
                picture: { cols, drags: p.drags, rings: p.stuck ? [p.stuck] : [], shade: p.zone === null ? [] : [p.zone], from: 'A board laid to show it: a brown stuck at the top of the column going up, the chain on' },
                shows: p.frees && p.drags.length >= 2,
            });
            continue;
        }
        const k = kept(`trick:${trick}`), { cols, drags } = k, after = drags.length ? playDrags(cols, drags) : cols;
        const pic = (rings, shade, burn = false) => ({ cols, drags, rings, shade, burn, from: k.from });
        const push = (says, picture, shows) => out.push({ trick, says, level: every, picture, shows });
        if (trick === 'danger') {
            const x = COLS - 2;
            push(NERVES.uneasy[1], pic(hardWhites(cols, x), [x, COLS - 1]), dangerZones(cols, 'junk', true).includes(x) && !!after && whitesIn(after, x) < whitesIn(cols, x));
        }
        else if (trick === 'edge') {
            const e = edgeWhites(cols);
            push(null, pic(e.map((w) => [w.x, w.y]), range(COLS - FIRE_COLS, COLS)), e.length > 0 && !!after && edgeWhites(after).length < e.length);
        }
        else if (trick === 'flick') {
            push(null, pic([], range(COLS - 4, COLS)), !!after && drags.length > 0);
        }
        else if (trick === 'blocks') {
            push(PHASE.block.first, pic([], []), blockPhase(cols) && !!after);
        }
        else if (trick === 'kept') {
            push(HELP.store, pic(toolsAt(cols), [0, 1]), blockPhase(cols) && keptTools(cols).brown && !!after && keptTools(after).brown);
        }
        else {
            push(HELP_ELSE.burn, pic([], [COLS - 1, COLS - 2, COLS - 3], true), burnsClean(cols[COLS - 1]) && clearComingUp(cols));
        }
    }
    return out;
}
/** The positions the page reads (src/distill-positions.ts, the user's own critiques): a white trapped by the fire, the
    ladder about to be lost, a cracked board, damage control, and damage control met by the hoist (13 Nov, P27: browns
    sunk through blacks, lifting them, where a brown swept off to the top right would split them further). */
export const READ_EXAMPLES = ['P2', 'P8', 'P10', 'P7', 'P27'];
/** Each READ_EXAMPLES position read, as the planner reads it, with the bot's move there now. */
export function readingExamples() {
    return READ_EXAMPLES.map((id) => {
        const p = POSITIONS_SEEN.find((q) => q.id === id), cols = boardOf(p), r = readBoard(cols, { stage: p.stage, timeLeft: p.timeLeft }), a = botAt(p);
        const rings = r.tactic === 'sortLadder' ? [] : r.targets.slice(0, 6).map((t) => [t.x, t.y]);
        const shade = r.tactic === 'sortLadder' ? [COLS - 2, COLS - 1] : r.tactic === 'fixCracks' ? [] : [...new Set(r.targets.map((t) => t.x))];
        const s = Math.round(p.ms / 1000);
        return {
            id, state: r.state, tactic: r.tactic, stateLabel: STATES[r.state].label, tacticLabel: TACTICS[r.tactic].label, about: TACTICS[r.tactic].about, why: r.why,
            picture: { cols, drags: a.drags, rings, shade, from: `A real deal (seed ${p.seed}), ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} in, ${(p.timeLeft / 1000).toFixed(1)} s on the furnace; ${id} of the positions` },
        };
    });
}
/** Every drag of one piece on a board, up to `most` swaps, each swap legal after the last. */
function everyDrag(cols, most, visit) {
    const walk = (b, x0, y0, x, y, ways) => {
        if (ways.length && visit({ x: x0, y: y0, ways: [...ways] }))
            return true;
        if (ways.length >= most)
            return false;
        for (const w of [UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT]) {
            const n = neighbourOn(b, x, y, w);
            if (!n || !canSwapOn(b, x, y, n[0], n[1]))
                continue;
            const nb = copyBoard(b);
            nb[n[0]][n[1]] = b[x][y];
            nb[x][y] = b[n[0]][n[1]];
            if (walk(nb, x0, y0, n[0], n[1], [...ways, w]))
                return true;
        }
        return false;
    };
    for (let x = 1; x < COLS - 1; x++)
        for (let y = 1; y < cols[x].length - 1; y++)
            if (walk(cols, x, y, x, y, []))
                return;
}
/** The columns and rows round some drags, a piece either side. */
function cropOf(cols, drags) {
    const cells = drags.flatMap((d) => { const out = [[d.x, d.y]]; let at = [d.x, d.y]; for (const w of d.ways) {
        at = neighbourOn(cols, at[0], at[1], w);
        out.push(at);
    } return out; });
    const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]);
    return { x: [Math.max(0, Math.min(...xs) - 1), Math.min(COLS - 1, Math.max(...xs) + 1)], y: [Math.max(0, Math.min(...ys) - 1), Math.min(8, Math.max(...ys) + 1)] };
}
/** The tricks side by side: each found on the lesson's board after its opening (a drag of two swaps that's that trick
    alone, the first from the left; three for the weave if need be), making way as their lesson finds it for step one. */
export function trickTiles() {
    const cols = afterOpening().cols, out = [];
    const tile = (trick, drags, bots = false) => {
        const t = TEACH[trick];
        return { trick, name: t.name, how: t.how, rule: t.why, bots, picture: { cols, drags, rings: [], shade: [], from: LESSON_FROM }, crop: cropOf(cols, drags) };
    };
    for (const trick of DRAG_TRICKS) {
        let found = null;
        for (const most of [2, 3]) {
            everyDrag(cols, most, (d) => { const ts = dragTricks(cols, d); if (d.ways.length === most && ts.length === 1 && ts[0] === trick) {
                found = d;
                return true;
            } return false; });
            if (found)
                break;
        }
        if (found)
            out.push(tile(trick, [found], trick === LADDER));
    }
    const fire = Array.from({ length: FIRE_COLS }, (_, i) => COLS - FIRE_COLS + i);
    const way = makeWay(cols, aimFor(cols, fire, null, 1, 'out'), teachLevel(1));
    if (way)
        out.push(tile('makeWay', way.drags));
    return out;
}
/** Helium's lines the page quotes, from src/lines/helium.ts. */
export const QUOTES = { goal: BEST.none, stepOne: STEP_ONE.says, why: STEP_ONE.why, onward: ONWARD, tell: TELL, trick: TEACH.lift.why, spot: SPOT.three };
/** Everything the page draws. */
export function guide() {
    return {
        pieces: PIECES, swaps: SWAPS, furnaceSecs: FURNACE_SECS, chainBonus: CHAIN_BONUS, flask: FLASK, carryOn: CARRY_ON, columns: sampleColumns(),
        phases: phaseExamples(), levels: levelRows(), techniques: techniqueExamples(), tricks: trickExamples(), quotes: QUOTES, plan: PLAN, reading: readingExamples(),
        trickTiles: trickTiles(),
    };
}
