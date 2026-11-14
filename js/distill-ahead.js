/* A bot's next few moves, played forward, and the goal they reach: its plan, seen through. TypeScript, compiled to
   js/distill-ahead.js; tested in tests/distill-ahead.test.ts; drawn on distilling-positions.html.

   The user (13 Nov), on the positions page: "for each one as well, show like a short plan of next steps ... this P1,
   for example, ... the black moving up to three, is it to start working on three in the whites, but it only shows one
   move, so then it's kind of just wanting to make sure it actually follows through rather than just making a step
   towards it."

   So from a board, the planner (src/distill-bots.ts, `choose`, as the bot calls it, the chain's rule of thumb and all)
   is played forward a move at a time on a copy of the board, up to AHEAD.MOVES moves, the furnace's time running down
   by each move's time a person's (`timeFor`), the board as it stands otherwise (no column leaves: the plan stops where
   the furnace would take one). Its aim is its first move's goal (src/distill-goals.ts): a goal its first move gets done
   by itself, or, when that move only opens the way to a white or sets up a save, that white freed, that save made.
   `reached`: the move (1 on) by which the aim's done, or null if the plan doesn't get there.

   Pure: no randomness, no clock; knows nothing of the den. */
import { WHITE } from './distilling.js';
import { chainContext, choose, contextFor, focusOf, timeFor } from './distill-bots.js';
import { isJunk, playDrags } from './distill-routines.js';
/** The plan's length. */
export const AHEAD = { MOVES: 5 };
/** The goal a move's about: its last drag's (the earlier ones make way for it), or a set-up's. */
export function headline(steps) {
    for (let i = steps.length - 1; i >= 0; i--) {
        const g = steps[i].goal;
        if (g && g.kind !== 'makeWay')
            return g;
    }
    return null;
}
/** The plan from a stand (see the header). */
export function ahead(s, level, most = AHEAD.MOVES) {
    let cols = s.cols, timeLeft = s.timeLeft, burns = s.burns;
    const moves = [];
    let aim = null, reached = null, ends = `${most} moves`;
    let done = null, on = null;
    // (The white a move opened the way to is the next move's to free, as the bots play: `focusOf`.)
    let focus = null;
    for (let i = 0; i < most; i++) {
        const c = s.stage === 'chain' ? chainContext(cols, s.chain, burns, level.target, level.reach) : { ctx: contextFor(cols, s.stage, burns, level.reach), burns };
        burns = c.burns;
        const a = choose({ cols, chain: s.chain, timeLeft }, c.ctx, level, focus);
        focus = focusOf(a);
        if (a.kind !== 'move') {
            ends = a.kind === 'wait' ? 'it waits' : `it ${a.kind}s`;
            if (!i)
                aim = null;
            break;
        }
        moves.push({ cols, timeLeft, advice: a });
        const after = playDrags(cols, a.drags);
        if (!after) {
            ends = 'a drag that won\'t play';
            break;
        }
        if (i === 0) {
            const g = headline(a.steps ?? []);
            if (g?.kind === 'open' && g.at) {
                const at = g.at, held = cols[at.x][at.y];
                aim = `free column ${at.x + 1}'s white in row ${at.y + 1}`;
                done = (b) => held === WHITE && b[at.x][at.y] !== WHITE;
                on = (m) => (m.steps ?? []).some((st) => !!st.goal?.at && st.goal.at.x === at.x && st.goal.at.y === at.y);
            }
            else if (g?.kind === 'channel' && g.at && cols[g.at.x].filter(isJunk).length > 1) {
                // The late game's channels (src/distill-channel.ts): the column cleared of junk, a white along a channel in for
                // each piece of it, the plan seen through (the user, 14 Nov: "So that's what I would expect it to plan out here").
                const x = g.at.x;
                aim = `clear column ${x + 1} of junk: a white along a channel in for each piece`;
                done = (b) => !b[x].some(isJunk);
                on = (m) => (m.steps ?? []).some((st) => st.goal?.kind === 'channel');
            }
            else if (g?.kind === 'setUp') {
                aim = 'save the white by the fire';
                done = (_, m) => (m.steps ?? []).some((st) => st.goal && ['save', 'fill', 'free', 'untrap'].includes(st.goal.kind));
                on = (m) => (m.steps ?? []).some((st) => st.goal && ['setUp', 'save', 'fill', 'free', 'untrap'].includes(st.goal.kind));
            }
            else if (g) {
                aim = g.says;
                reached = 1;
            }
        }
        else if (reached === null && done && done(after, a))
            reached = i + 1;
        if (i === 0 && reached === null && done && done(after, a))
            reached = 1;
        cols = after;
        timeLeft -= timeFor(a.drags, level, a.sweep);
        if (timeLeft <= 0) {
            ends = 'the furnace takes the next column';
            break;
        }
    }
    const through = reached !== null && (!on || moves.slice(0, reached).every((m) => on(m.advice)));
    return { moves, aim, reached, through, ends };
}
/** A plan's moves' drags, in order, each move's own (for drawing each on its own board). */
export const aheadDrags = (p) => p.moves.map((m) => m.advice.drags);
