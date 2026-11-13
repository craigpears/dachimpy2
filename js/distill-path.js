/* A piece brought round to take a stuck piece's place: Distilling's path search, beside the named techniques
   (the user, 13 Nov, the eighteenth note: "it's almost better to model it as a path ... a pathfinding A-star
   style problem. Find the path of a piece that could take that white's place. But obviously that pathfinding
   can involve loops"). TypeScript, compiled to js/distill-path.js; tested in tests/distill-path.test.ts.

   A piece is stuck where it can't go the way it has to (`stuck`): in Stage I a white trapped on the top or
   bottom edge with junk between it and the whites (src/distill-score.ts, `trappedWhite`), a brown or a black
   trapped among the whites (`trapped`), or a white in a column about to burn with no way out left; in the
   chain, junk in a column still to go up Crystal Clear with no way out left. The search (`bringRound`) finds
   one drag, the cheapest in a person's time (a moment to pick the piece up, a hand's speed along it, a little
   for each turn: the user, 12 Nov, "one smooth mouse motion is cheap"), of some other piece along legal swaps,
   loops and all, ending in a swap with the stuck piece that sends it its way: a brown looped round under a
   white trapped at the top, which then rises past the white and the white drops out left. A* over the boards
   the drag leaves (the same square with the board changed behind it is a new place, which is how a loop is
   found), the heuristic the squares still to go; capped at a few thousand boards, so it runs per move in the
   browser.

   When no one drag gets there (the user, 13 Nov, the nineteenth note: "you have to drag that brown upwards so
   then you could drag a black over and into that spot"), `openWay` tries one piece moved out of the way first,
   a short drag near the stuck piece, and searches again on the board it leaves: the two drags played together,
   costed as a person's two (`bringRound`'s search kept small for each, so it stays cheap per move). Only for
   whites in the columns next to burn, where it matters.

   The bots (src/distill-bots.ts) offer it as a fallback, when none of the named routines unsticks anything;
   its moves are then judged like any other. The named routines are the shapes such a search tends to find;
   the search covers what they miss.

   Pure: no randomness, no clock. */
import { COLS, DOWN_LEFT, DOWN_RIGHT, SPICE, UP_LEFT, UP_RIGHT, WHITE, canSwapOn, neighbourOn } from './distilling.js';
import { trapped, trappedWhite, wall } from './distill-score.js';
import { canGo, halfOf, isJunk, placeName, playDrags, whitesFrom } from './distill-routines.js';
/** The search's limits and a turn's cost. */
export const PATH = {
    /** The longest drag searched, in swaps. */
    SWAPS: 12,
    /** Boards looked at, at most, for one stuck piece. */
    NODES: 2500,
    /** Stuck pieces searched for, at most, a move (the furnace's side first). */
    TARGETS: 4,
    /** ms for each turn within a drag (as the planner's TURN_MS). */
    TURN_MS: 60,
    /** Opening the way (`openWay`): pieces this many squares from the stuck one or nearer are tried, moved up to
        ENABLE_SWAPS swaps, at most ENABLE_BOARDS of them, each searched on with ENABLE_NODES boards. */
    ENABLE_NEAR: 4,
    ENABLE_SWAPS: 2,
    ENABLE_BOARDS: 80,
    ENABLE_NODES: 300,
};
const ALL = [UP_RIGHT, UP_LEFT, DOWN_LEFT, DOWN_RIGHT];
const LEFT = [UP_LEFT, DOWN_LEFT], RIGHT = [UP_RIGHT, DOWN_RIGHT];
/** The pieces stuck where they can't go the way they have to (see the header), the furnace's side first. */
export function stuck(cols, ctx) {
    const out = [], at = ctx.stage === 'junk' ? wall(cols).at : 0;
    for (let x = COLS - 1; x >= 0; x--)
        for (let y = 0; y < cols[x].length; y++) {
            const p = cols[x][y];
            if (ctx.stage === 'junk') {
                if (p === WHITE && (trappedWhite(cols, x, y, at) || (x >= ctx.burnFrom && x > 0 && !canGo(cols, x, y, -1))))
                    out.push({ x, y, side: -1 });
                else if (trapped(cols, x, y))
                    out.push({ x, y, side: 1 });
            }
            else if (isJunk(p) && x >= ctx.fill && x < ctx.burnFrom && !canGo(cols, x, y, -1))
                out.push({ x, y, side: -1 });
        }
    return out;
}
/** Squares apart: every swap is a column across and half a piece up or down. */
const apart = (cols, a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(halfOf(cols, a[0], a[1]) - halfOf(cols, b[0], b[1])));
/** The cheapest drag, in a person's time, of some other piece round to the stuck one at (x, y) and into its
    place, sending it toward `side`: its drags (one), or null if none within the search's limits. */
export function bringRound(cols, s, pace, limits = PATH) {
    return search(cols, s, pace, limits, limits.NODES)?.drags ?? null;
}
/** bringRound's search: the drag and its cost in ms, a person's. */
function search(cols, s, pace, limits, nodes, skip) {
    const swapMs = 1000 / pace.rate, q = cols[s.x][s.y], before = s.zone === undefined ? 0 : whitesFrom(cols, s.zone);
    // Where the piece brought round must stand to swap the stuck one its way: beside it on that side.
    const goals = (s.side < 0 ? LEFT : RIGHT).map((d) => neighbourOn(cols, s.x, s.y, d)).filter((n) => !!n);
    if (!goals.length)
        return null;
    const h = (b, at) => Math.min(...goals.map((g) => apart(b, at, g))) * swapMs;
    const open = [];
    const push = (n) => {
        open.push(n);
        for (let i = open.length - 1; i > 0;) {
            const j = (i - 1) >> 1;
            if (open[j].f <= open[i].f)
                break;
            [open[i], open[j]] = [open[j], open[i]];
            i = j;
        }
    };
    const pop = () => {
        const top = open[0], last = open.pop();
        if (open.length) {
            open[0] = last;
            for (let i = 0;;) {
                const l = 2 * i + 1, r = l + 1;
                let m = i;
                if (l < open.length && open[l].f < open[m].f)
                    m = l;
                if (r < open.length && open[r].f < open[m].f)
                    m = r;
                if (m === i)
                    break;
                [open[i], open[m]] = [open[m], open[i]];
                i = m;
            }
        }
        return top;
    };
    // Every other piece that could reach in time and swaps with something: a place to start.
    for (let x = 0; x < COLS; x++)
        for (let y = 0; y < cols[x].length; y++) {
            const p = cols[x][y];
            if (p === SPICE || (x === s.x && y === s.y) || p === q || skip?.has(`${x},${y}`))
                continue;
            const at = [x, y];
            if (apart(cols, at, goals[0]) > limits.SWAPS && (goals.length < 2 || apart(cols, at, goals[1]) > limits.SWAPS))
                continue;
            push({ b: cols, at, ways: [], cost: pace.spot, f: pace.spot + h(cols, at), from: at });
        }
    const seen = new Set();
    let looked = 0;
    while (open.length && looked < nodes) {
        const n = pop();
        const key = `${n.at[0]},${n.at[1]}:${n.b.map((c) => c.join('')).join('|')}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        looked++;
        // Done: beside the stuck piece on its side, and the swap sends it that way.
        if (goals.some((g) => g[0] === n.at[0] && g[1] === n.at[1])) {
            for (const d of ALL) {
                const t = neighbourOn(n.b, n.at[0], n.at[1], d);
                if (t && t[0] === s.x && t[1] === s.y && n.b[s.x][s.y] === q && canSwapOn(n.b, n.at[0], n.at[1], s.x, s.y) && leaves(n.b, s, n.at, before)) {
                    return { drags: [{ x: n.from[0], y: n.from[1], ways: [...n.ways, d] }], ms: n.cost + swapMs + (n.ways.length && n.ways[n.ways.length - 1] !== d ? limits.TURN_MS : 0) };
                }
            }
        }
        if (n.ways.length >= limits.SWAPS)
            continue;
        for (const d of ALL) {
            const t = neighbourOn(n.b, n.at[0], n.at[1], d);
            // Never through the stuck piece on the way: it's swapped only at the end, its way.
            if (!t || (t[0] === s.x && t[1] === s.y) || !canSwapOn(n.b, n.at[0], n.at[1], t[0], t[1]))
                continue;
            const b = n.b.map((c) => c.slice());
            const p = b[n.at[0]][n.at[1]];
            b[n.at[0]][n.at[1]] = b[t[0]][t[1]];
            b[t[0]][t[1]] = p;
            const turn = n.ways.length && n.ways[n.ways.length - 1] !== d ? limits.TURN_MS : 0;
            const cost = n.cost + swapMs + turn;
            push({ b, at: t, ways: [...n.ways, d], cost, f: cost + h(b, t), from: n.from });
        }
    }
    return null;
}
/** A danger zone's white got out by the last swap, the piece at `at` into its place on board b: fewer whites from
    its zone on than `before`. No zone, always. */
function leaves(b, s, at, before) {
    if (s.zone === undefined)
        return true;
    const after = b.map((c) => c.slice());
    after[s.x][s.y] = b[at[0]][at[1]];
    after[at[0]][at[1]] = b[s.x][s.y];
    return whitesFrom(after, s.zone) < before;
}
/** A few ways into a piece's place, each the cheapest drag of a different piece, cheapest first: to show, not
    to play (the user, 13 Nov, of Helium ringing a white by the fire: "maybe it should show some arrows of nearby
    routes of pieces that can be dragged into the spots"). At most `most`; none if nothing reaches it. */
export function routesInto(cols, s, pace, most = 3, limits = PATH) {
    const out = [], skip = new Set();
    while (out.length < most) {
        const r = search(cols, s, pace, limits, limits.NODES, skip);
        if (!r)
            break;
        out.push(r.drags[0]);
        skip.add(`${r.drags[0].x},${r.drags[0].y}`);
    }
    return out;
}
/** When no one drag brings a piece round to the stuck one: the cheapest pair, in a person's time, of a piece
    near it moved out of the way first (a short drag) and then a piece brought round into its place on the board
    that leaves (the user, 13 Nov, the nineteenth note: "what's a single thing that could move, like in this
    example, that brown piece that would allow me to get to that path"). Its two drags, or null. */
export function openWay(cols, s, pace, limits = PATH) {
    const swapMs = 1000 / pace.rate, target = [s.x, s.y];
    // Every short drag of a piece near the stuck one, never of the stuck one or through it.
    const firsts = [], seen = new Set();
    const walk = (b, from, at, ways) => {
        if (ways.length) {
            const key = b.map((c) => c.join('')).join('|');
            if (!seen.has(key)) {
                seen.add(key);
                const turns = ways.filter((w, i) => i > 0 && w !== ways[i - 1]).length;
                firsts.push({ drag: { x: from[0], y: from[1], ways: [...ways] }, b, ms: pace.spot + ways.length * swapMs + turns * limits.TURN_MS });
            }
        }
        if (ways.length >= limits.ENABLE_SWAPS)
            return;
        for (const d of ALL) {
            const t = neighbourOn(b, at[0], at[1], d);
            if (!t || (t[0] === s.x && t[1] === s.y) || !canSwapOn(b, at[0], at[1], t[0], t[1]))
                continue;
            const nb = b.map((c) => c.slice());
            const p = nb[at[0]][at[1]];
            nb[at[0]][at[1]] = nb[t[0]][t[1]];
            nb[t[0]][t[1]] = p;
            walk(nb, from, t, [...ways, d]);
        }
    };
    for (let x = 0; x < COLS; x++)
        for (let y = 0; y < cols[x].length; y++) {
            if (cols[x][y] === SPICE || (x === s.x && y === s.y) || apart(cols, [x, y], target) > limits.ENABLE_NEAR)
                continue;
            walk(cols, [x, y], [x, y], []);
        }
    // The cheapest first, so the best pair is likely found before the cap.
    firsts.sort((a, b) => a.ms - b.ms);
    let best = null;
    for (const f of firsts.slice(0, limits.ENABLE_BOARDS)) {
        if (best && f.ms >= best.ms)
            break;
        const then = search(f.b, s, pace, limits, limits.ENABLE_NODES);
        if (then && (!best || f.ms + then.ms < best.ms))
            best = { drags: [f.drag, ...then.drags], ms: f.ms + then.ms };
    }
    return best?.drags ?? null;
}
/** The pair rescue's limits (`pairRescue`): drags in a plan at most; a piece moved to open the way (an enabler) this
    many squares from the stuck one or nearer, by up to ENABLE_SWAPS swaps, the cheapest ENABLE_BOARDS of them a step;
    each piece brought round searched with NODES boards; SEARCHES such searches in all, a plan; a piece's own way out
    left at most OUT swaps; the cheapest BRANCH ways on from each step followed; WORK boards looked at in all, so it
    stays cheap enough to run on a move in the browser. */
export const PAIR = { DRAGS: 4, NEAR: 4, ENABLE_SWAPS: 3, ENABLE_BOARDS: 25, NODES: 300, SEARCHES: 40, OUT: 10, BRANCH: 5, WORK: 30000 };
/** Junk in the columns from `from` up to (not including) `to`. */
export function junkBetween(cols, from, to = COLS) {
    let n = 0;
    for (let x = Math.max(0, from); x < Math.min(to, COLS); x++)
        for (const p of cols[x])
            if (isJunk(p))
                n++;
    return n;
}
/** Whether a board `after` has freed column x of the chain (`pairRescue`, and the planner's chain zones): less junk
    from x on among the columns still to go up, none more in the column being filled or right of it, and not just
    pushed on into the next column to go up (less from the one after the column being filled too). (Tried 13 Nov: that
    last only while the next column's mostly white; no better over 20 boards a level, a few more whites burned.) */
export function freed(cols, after, x, ctx) {
    const to = Math.min(ctx.burnFrom, COLS), fill = Math.max(x, ctx.fill), away = Math.max(0, Math.min(x, ctx.fill - 1));
    return junkBetween(after, x, to) < junkBetween(cols, x, to) && junkBetween(after, fill, to) <= junkBetween(cols, fill, to)
        && junkBetween(after, away, to) < junkBetween(cols, away, to);
}
/** The cheapest drag of the piece at (x, y) out of its column on its own, left, at most `most` swaps: out of the
    column `away` too if it can, else just out of its own. Null if it can't go. */
function ownWayOut(cols, x, y, away, most, pace) {
    const swapMs = 1000 / pace.rate;
    let best = null;
    const walk = (b, at, ways) => {
        if (ways.length && at[0] < x) {
            const turns = ways.filter((w, i) => i > 0 && w !== ways[i - 1]).length, ms = pace.spot + ways.length * swapMs + turns * PATH.TURN_MS;
            const rank = (at[0] < away ? 0 : 1e6) + ms;
            if (!best || rank < best.rank)
                best = { drag: { x, y, ways: [...ways] }, b, ms, rank };
            if (at[0] < away)
                return;
        }
        if (ways.length >= most)
            return;
        for (const d of LEFT) {
            const t = neighbourOn(b, at[0], at[1], d);
            if (!t || !canSwapOn(b, at[0], at[1], t[0], t[1]))
                continue;
            const nb = b.map((c) => c.slice());
            const p = nb[at[0]][at[1]];
            nb[at[0]][at[1]] = nb[t[0]][t[1]];
            nb[t[0]][t[1]] = p;
            walk(nb, t, [...ways, d]);
        }
    };
    walk(cols, [x, y], []);
    const b = best;
    return b ? { drag: b.drag, b: b.b, ms: b.ms } : null;
}
/** The pair rescue, in the chain (the user, 13 Nov, on a column of whites going up with a brown stuck at its top:
    "this is absolute danger mode ... the first thing I would be doing here is just rescuing that brown piece ... You
    got a brown piece there, look, that can move up, and then a black that can hop along the top, and you'd rescue
    the brown piece. You'd then be able to pull it back"): junk stuck on the edge of a column of whites still to go
    up (a brown on the top, a black on the bottom) needs pieces working together to get out, which no one drag does.
    The cheapest plan, in a person's time, of up to PAIR.DRAGS drags that leaves less junk in column x and the
    columns right of it still to go up, and none more in the column being filled: each step either a piece of the
    column's junk going out left on its own, or a piece brought round into a stuck one's place (`bringRound`'s
    search), either of them after a piece near it is moved to open the way (a brown lifted for a black to hop along
    the top on, the freed piece moved off so the partner can follow it out). Its drags, or null if none in time. */
export function pairRescue(cols, x, ctx, pace, timeLeft = Infinity, limits = PAIR) {
    // The same board asked again (a bot waiting, the board unchanged): the plan found before.
    const memo = `${x},${ctx.fill},${ctx.burnFrom},${ctx.reach},${pace.rate},${pace.spot},${limits === PAIR ? "" : JSON.stringify(limits)}:${cols.map((c) => c.join('')).join('|')}`;
    if (PAIR_MEMO.has(memo)) {
        const m = PAIR_MEMO.get(memo);
        return m && m.ms <= timeLeft ? m.drags : null;
    }
    // Nothing found before with the same pieces round the column (its own and the few left of it, where the pieces that
    // free it come from): nothing now either, while the rest of the board's play goes on further left.
    const near = `${x},${ctx.fill},${ctx.burnFrom},${limits === PAIR ? '' : JSON.stringify(limits)}:${cols.slice(Math.max(0, x - limits.NEAR - 1)).map((c) => c.join('')).join('|')}`;
    if (PAIR_NONE.has(near))
        return null;
    const r = pairPlan(cols, x, ctx, pace, limits);
    if (PAIR_MEMO.size > 64)
        PAIR_MEMO.clear();
    if (PAIR_NONE.size > 256)
        PAIR_NONE.clear();
    PAIR_MEMO.set(memo, r);
    if (!r)
        PAIR_NONE.add(near);
    return r && r.ms <= timeLeft ? r.drags : null;
}
const PAIR_MEMO = new Map(), PAIR_NONE = new Set();
/** `pairRescue`'s search: the cheapest plan and its ms, or null. */
function pairPlan(cols, x, ctx, pace, limits) {
    const timeLeft = Infinity;
    const away = Math.min(x, ctx.fill - 1), swapMs = 1000 / pace.rate;
    if (!junkBetween(cols, x, Math.min(ctx.burnFrom, COLS)))
        return null;
    const done = (b) => freed(cols, b, x, ctx);
    const search1 = { ...PATH, SWAPS: Math.min(PATH.SWAPS, ctx.reach) };
    let best = null, searches = 0, work = 0;
    const seen = new Map();
    const step = (b, drags, ms) => {
        if (ms > timeLeft || (best && ms >= best.ms) || work > limits.WORK)
            return;
        if (done(b)) {
            best = { drags, ms };
            return;
        }
        const left = limits.DRAGS - drags.length;
        if (left <= 0)
            return;
        const key = b.map((c) => c.join('')).join('|');
        if ((seen.get(key) ?? -1) >= left)
            return;
        seen.set(key, left);
        const next = [];
        // The column's junk: out on its own, or a piece brought round into its place.
        const outOf = (bb, pre, ms0, budget) => {
            for (let y = 0; y < bb[x].length; y++) {
                if (!isJunk(bb[x][y]))
                    continue;
                const own = ownWayOut(bb, x, y, away, limits.OUT, pace);
                if (own) {
                    next.push({ b: own.b, drags: [...pre, own.drag], ms: ms0 + own.ms });
                    continue;
                }
                if (budget < 1 || searches >= limits.SEARCHES || work > limits.WORK)
                    continue;
                searches++;
                work += limits.NODES;
                const r = search(bb, { x, y, side: -1 }, pace, search1, limits.NODES);
                const after = r && playDrags(bb, r.drags);
                if (r && after)
                    next.push({ b: after, drags: [...pre, ...r.drags], ms: ms0 + r.ms });
            }
        };
        outOf(b, drags, ms, 1);
        // A piece near the column's stuck junk moved first, to open the way (no more than two drags left for it).
        if (left >= 2) {
            const firsts = [], keys = new Set();
            for (let y = 0; y < b[x].length; y++) {
                if (!isJunk(b[x][y]) || canGo(b, x, y, -1))
                    continue;
                const walk = (bb, from, at, ways) => {
                    if (work++ > limits.WORK)
                        return;
                    if (ways.length) {
                        const k = bb.map((c) => c.join('')).join('|');
                        if (!keys.has(k)) {
                            keys.add(k);
                            const turns = ways.filter((w, i) => i > 0 && w !== ways[i - 1]).length;
                            firsts.push({ drag: { x: from[0], y: from[1], ways: [...ways] }, b: bb, ms: pace.spot + ways.length * swapMs + turns * PATH.TURN_MS });
                        }
                    }
                    if (ways.length >= limits.ENABLE_SWAPS)
                        return;
                    for (const d of ALL) {
                        const t = neighbourOn(bb, at[0], at[1], d);
                        if (!t || (t[0] === x && t[1] === y) || !canSwapOn(bb, at[0], at[1], t[0], t[1]))
                            continue;
                        const nb = bb.map((c) => c.slice());
                        const p = nb[at[0]][at[1]];
                        nb[at[0]][at[1]] = nb[t[0]][t[1]];
                        nb[t[0]][t[1]] = p;
                        walk(nb, from, t, [...ways, d]);
                    }
                };
                for (let ex = 0; ex < COLS; ex++)
                    for (let ey = 0; ey < b[ex].length; ey++) {
                        if (b[ex][ey] === SPICE || (ex === x && ey === y) || apart(b, [ex, ey], [x, y]) > limits.NEAR)
                            continue;
                        walk(b, [ex, ey], [ex, ey], []);
                    }
            }
            firsts.sort((a, c) => a.ms - c.ms);
            for (const f of firsts.slice(0, limits.ENABLE_BOARDS)) {
                if (best && ms + f.ms >= best.ms)
                    break;
                outOf(f.b, [...drags, f.drag], ms + f.ms, 1);
            }
        }
        next.sort((a, c) => a.ms - c.ms);
        for (const n of next.slice(0, limits.BRANCH))
            step(n.b, n.drags, n.ms);
    };
    step(cols, [], 0);
    return best;
}
const NAMES = ['white', 'brown', 'black', 'spice', 'burnt white'];
/** Moves bringing a piece round to each stuck piece given (the first few; all that are stuck, the furnace's
    side first, if none are given). */
export function pathMoves(cols, ctx, pace, targets = stuck(cols, ctx), limits = PATH) {
    const out = [];
    for (const s of targets.slice(0, limits.TARGETS)) {
        const what = NAMES[cols[s.x][s.y]], out_ = s.side < 0 ? 'left' : 'right';
        const drags = bringRound(cols, s, pace, limits);
        if (drags) {
            const d = drags[0], turns = d.ways.filter((w, i) => i > 0 && w !== d.ways[i - 1]).length;
            out.push({
                routine: 'path', drags,
                reason: `the ${what} at ${placeName(s.x, s.y)} is stuck: bring the ${NAMES[cols[d.x][d.y]]} at ${placeName(d.x, d.y)} round${turns > 1 ? ', looping,' : ''} to take its place, and it's out ${out_}`,
            });
            continue;
        }
        // No one drag gets there: a white in the columns next to burn (or a danger zone's, in the chain's junk columns
        // too) gets a piece moved out of the way first.
        if (cols[s.x][s.y] !== WHITE || (s.zone === undefined && (ctx.stage !== 'junk' || s.x < ctx.burnFrom)))
            continue;
        const two = openWay(cols, s, pace, limits);
        if (!two)
            continue;
        const [a, b] = two, after = playDrags(cols, [a]);
        out.push({
            routine: 'path', drags: two,
            reason: `nothing reaches the ${what} at ${placeName(s.x, s.y)}: move the ${NAMES[cols[a.x][a.y]]} at ${placeName(a.x, a.y)} out of the way, then bring the ${after ? NAMES[after[b.x][b.y]] : 'piece'} at ${placeName(b.x, b.y)} round into its place, and it's out ${out_}`,
        });
    }
    return out;
}
