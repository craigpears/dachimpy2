/* Distilling's phases: where a game stands, in a player's own terms, read off the board, so a bot (or Helium)
   can say aloud which part of the game it thinks it's in, and play it that way. TypeScript, compiled to
   js/distill-phase.js; tested in tests/distill-phase.test.ts; the planner (src/distill-bots.ts) reads it each
   move.

   The user (13 Nov): "the bot should have this is the current phase I think I'm in, and that obviously changes
   the strategy and techniques that it starts using. Obviously, it can always use all the techniques if it
   absolutely needs to, like it gets stuck or there's a blocked white piece. But ... different techniques have
   different weights depending on the stage." And Helium watching: "first of all ... I'm going to try and get rid
   of all the white pieces in all these columns, and then just kind of step by step".

   The phases, built on the planner's own stages (DISTILLING.md §3), not a parallel system:
   - fire: Stage I, a white in the three columns next to the fire (Helium's step one, "the rightmost three
     columns burn first, so save the whites there first"). A column burned brings a new one onto the fire's side,
     so a game comes back here every column or so.
   - fill: Stage I, the fire's side clear of white: fill the right-hand junk columns, the junk swept over.
   - block: Stage I, the whites mostly left (src/distill-score.ts, `blockPhase`): the junk moved in blocks, the V.
   - chain: Stage II, the Crystal Clears.
   Each phase weighs the techniques (`PHASE_WEIGHTS`): a move's worth is multiplied by its technique's weight
   when it's ranked. The weights only tilt the choice; every technique stays on the menu, and while a white's in
   danger they're all even (src/distill-bots.ts, `weigh`; till 13 Nov a piece stuck anywhere evened them too, and
   something nearly always was, so they hardly ever applied: the twenty-eighth note).

   Pure: no randomness, no clock. */
import { COLS, WHITE } from './distilling.js';
import { blockPhase } from './distill-score.js';
/** The phases in a game's order. */
export const PHASE_ORDER = ['fire', 'fill', 'block', 'chain'];
/** The columns next to the fire: the fire's side (Helium's step one). */
export const FIRE_COLS = 3;
/** Whites in the fire's side, the FIRE_COLS columns next to the fire. */
export const whitesByFire = (cols) => {
    let n = 0;
    for (let x = COLS - FIRE_COLS; x < COLS; x++)
        for (const p of cols[x])
            if (p === WHITE)
                n++;
    return n;
};
/** The phase a board is in, at a stage (the planner's: 'junk', Stage I, or 'chain'). */
export function phaseOf(cols, stage) {
    if (stage === 'chain')
        return 'chain';
    if (blockPhase(cols))
        return 'block';
    return whitesByFire(cols) > 0 ? 'fire' : 'fill';
}
/** Each phase, in plain words: its name, and what it's working towards (the bots' test page and the bar). */
export const PHASES = {
    fire: { label: 'Clear the fire\'s side', plan: 'every white out of the three columns next to the fire, left' },
    fill: { label: 'Fill the junk columns', plan: 'the right-hand columns filled with junk, swept over in long drags' },
    block: { label: 'Blocks and the V', plan: 'whites mostly left: the junk moved in blocks, wrapped round them in a V' },
    chain: { label: 'The chain', plan: 'whites right: Crystal Clears, one after another' },
};
/** How much each technique's worth counts in each phase (1 as it is; anything left out is 1). Mild, so they
    tilt the choice between moves doing much the same, never rule one out. */
export const PHASE_WEIGHTS = {
    // The whites out of the fire's side first: rescues and finishing the junk column, the sweep can wait.
    // The crawl's for later (the user, 13 Nov, the twenty-eighth note: crawls and loops "still being done at an
    // early stage when there are much simpler techniques ... That's for ... mid or late game").
    fire: { rescue: 1.3, junkColumn: 1.15, path: 1.15, diamond: 0.9, store: 0.75, linePull: 0.85, leapfrog: 0.85, figureEight: 0.8, crawl: 0.8 },
    // Junk over, fast: the sweep and the junk column; sorting and the slow techniques can wait.
    fill: { diamond: 1.2, junkColumn: 1.15, turnOver: 1.1, store: 0.75, linePull: 0.85, figureEight: 0.8, crawl: 0.8, hook: 0.9 },
    // Blocks: the long drags that move junk together, the corner tools, the V, a piece hooked in through it in one
    // sweep rather than crawled across ("you can just drag stuff and loop, kind of hook things in through there in
    // one big giant sweeping motion ... You don't need to crawl things across"); little turning over.
    block: { hook: 1.2, store: 1.15, linePull: 1.15, leapfrog: 1.15, figureEight: 1.1, diamond: 1.1, turnOver: 0.85, crawl: 0.85 },
    // The chain: whites ferried right, a pair crawling or looping round when it's tight. (The channels themselves
    // left even: tilting toward them over the rescues cost the Learner whites, 5.5 a session against 5.3, 13 Nov.)
    chain: { crawl: 1.1, figureEight: 1.1, hook: 1.05 },
};
/** A technique's weight in a phase. */
export const weightIn = (phase, t) => PHASE_WEIGHTS[phase][t] ?? 1;
