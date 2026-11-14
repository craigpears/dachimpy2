/* Distilling: positions to critique, each critique a test (the user, 13 Nov: "create a few random boards or ...
   snapshots from partways through the game that I can critique and we can create some real deterministic test on
   what I think the bot should be doing at that point, either at the strategic level or specific move level ... at
   the moment, I feel like I'm critiquing, but it's not really having the specific impact, and it's not very
   regression-proof").

   - `POSITIONS`: fixed moments from the bots' own play (src/distill-bots.ts on seeded deals), picked by
     tools/distill-positions.mjs: whites low by the fire, a white on an edge or by a spice near it, the bot waiting
     with something stuck, a column about to go up with junk in it, the block phase, the fire's side early on. Each
     keeps its board and everything the bot's planner saw there (its level, stage, junk columns still to burn, the
     chain, the furnace's time left), and what the bot does there (`bot`), as recorded. The boards never change once
     picked; the tool only refreshes `bot` when the bots change (run it again, then `npm run build`). Written by that
     tool between the two marker lines: don't edit them by hand.
   - `VERDICTS`: the user's verdicts on them, by hand, each a note in their words with its date and what it expects
     of the bot there (`Expect`, kept small: its phase, its first drag's start or end, a white freed from a column,
     a column left with no junk, a technique it should or shouldn't use, never a burn, a drag at least so long).
     tests/distill-positions.test.ts checks each against the bot's move now (`botAt`, the planner as the bot calls
     it); a position with no verdict yet is listed as a todo there. A verdict the bots don't meet yet is marked
     `open`: the test expects it to fail, and says so once the bots get it right.

   The page, distilling-positions.html (js/distill-positions-view.js), draws them for the user to critique.
   Places are as the board's arrays have them: x the column, 0 the left and 9 the furnace's; y the row, 0 the top.
   The page numbers columns 1 to 10 and rows from 1 at the top, so a place on it is [x + 1, y + 1] here. */
import { BLACK, BROWN, TALL, WHITE, neighbourOn, parseBoard, writeBoard } from './distilling.js';
import { ahead } from './distill-ahead.js';
import { chainContext, choose, contextFor, levelNamed } from './distill-bots.js';
import { isJunk, playDrags } from './distill-routines.js';
import { readBoard } from './distill-read.js';
/** Each kind in plain words, for the page. */
export const MOMENTS = {
    low: 'Whites low by the fire',
    edge: 'A white on an edge or by a spice, near the fire',
    stuck: 'Waiting, with something stuck',
    junkUp: 'A column about to go up with junk in it',
    block: 'The block phase',
    early: 'Early on, the fire\'s side',
    chain: 'The chain under way',
    read: 'Picked for how the board reader reads it',
    leadup: 'The move that shuts a white in',
};
export const BATCHES = {
    random: { name: 'Random', about: 'telling moments from fresh bot play, on levels and deals not used before' },
    challenge: { name: 'The theme challenge', about: 'for each theme you judged, boards from other games that the board reader reads the same way: is it right that they\'re alike?' },
    leadup: { name: 'The lead-up', about: 'the moment a white goes from savable to shut in (nothing frees it in two drags after the bot\'s move), early and middle game first: the last board where it was still free, and the move that shut it in' },
};
/** The one question each new position asks (the user, 13 Nov: a batch to "speed through"). */
export const QUESTION = 'Is this the right idea? If not, what would you do?';
/** ... and the lead-up's (the user, 13 Nov: "the ones I really want to be judging are the things that have gotten me
    into that position beforehand"). */
export const LEADUP_QUESTION = 'What should the bot have done here instead?';
// ---- POSITIONS: written by tools/distill-positions.mjs; run it again rather than editing these ----
export const POSITIONS = [
    {
        id: "P1", moment: "early", level: "cc8", seed: 1, ms: 16300, stage: "junk", burns: 0, chain: 0, timeLeft: 14300,
        what: "16.3 s into the session: 4 whites still in the three columns by the fire, 14.3 s before the first goes.",
        cols: ["wwbKwbKb", "KwKKKb*Kw", "bbwwKwww", "*bwwKKbwb", "wwwKbwbb", "K*KKbwwbb", "wKKbbKww", "bwwKKKbww", "bbKbbbbb", "KKbKKKKKK"],
        bot: { "phase": "fire", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "free the trapped whites: nothing frees the white at column 8, row 2 yet: open the way to it: a short drag beside it, the pieces round it set moving", "drags": [{ "x": 8, "y": 2, "ways": [0] }], "state": "atRisk", "tactic": "freeTrapped", "read": "a white trapped near the fire (column 8, row 2), the worst first", "steps": [{ "name": "the ladder", "goal": "set the pieces round column 8's white in row 2 moving", "kind": "open" }] },
        plan: { "aim": "free column 8's white in row 2", "reached": 3, "through": true, "ends": "5 moves", "moves": [{ "cols": ["wwbKwbKb", "KwKKKb*Kw", "bbwwKwww", "*bwwKKbwb", "wwwKbwbb", "K*KKbwwbb", "wKKbbKww", "bwwKKKbww", "bbKbbbbb", "KKbKKKKKK"], "label": "Save the whites", "drags": [{ "x": 8, "y": 2, "ways": [0] }], "steps": [{ "name": "the ladder", "goal": "set the pieces round column 8's white in row 2 moving" }] }, { "cols": ["wwbKwbKb", "KwKKKb*Kw", "bbwwKwww", "*bwwKKbwb", "wwwKbwbb", "K*KKbwwbb", "wKKbbKww", "bwwKKKbww", "bbbbbbbb", "KKKKKKKKK"], "label": "Save the whites", "drags": [{ "x": 7, "y": 2, "ways": [1] }], "steps": [{ "name": "the climb", "goal": "open the way to column 8's white in row 2" }] }, { "cols": ["wwbKwbKb", "KwKKKb*Kw", "bbwwKwww", "*bwwKKbwb", "wwwKbwbb", "K*KKbwwbb", "wwKbbKww", "bwKKKKbww", "bbbbbbbb", "KKKKKKKKK"], "label": "Save the whites", "drags": [{ "x": 0, "y": 2, "ways": [3, 0, 0, 0, 3, 0] }, { "x": 7, "y": 1, "ways": [2] }], "steps": [{ "name": "the ladder, then the lift, then the ladder, then the lift", "goal": "set the pieces round column 8's white in row 2 moving" }, { "name": "the sink", "goal": "free column 8's white in row 2" }] }, { "cols": ["wwKKwbKb", "KwKwKb*Kw", "bbwwKwww", "*bwwKKbwb", "wKwKbwbb", "K*wKbwwbb", "wwKbbKww", "bbKKKKbww", "bbbbbbbb", "KKKKKKKKK"], "label": "Save the whites", "drags": [{ "x": 6, "y": 5, "ways": [2, 3, 3, 2, 3, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 8's gap: its white further from the fire" }] }, { "cols": ["wwKKwbKb", "KwKwKb*Kw", "bbwwKwww", "*bwwKKbwb", "wKwKbwbb", "K*wKbwwbb", "wwKbbwww", "bbKKKKbwb", "bbbbbbbK", "KKKKKKKKK"], "label": "The sweep", "drags": [{ "x": 3, "y": 5, "ways": [3, 3, 3, 3, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 8's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P2", moment: "early", level: "cc3", seed: 3, ms: 16200, stage: "junk", burns: 0, chain: 0, timeLeft: 14400,
        what: "16.2 s into the session: 3 whites still in the three columns by the fire, 14.4 s before the first goes.",
        cols: ["bKKbwbwK", "bKKwKwKwK", "KKwbKbwK", "KKKwww*ww", "KbbKwKbw", "wKKwwwwKK", "KKbbbKbw", "wKKbbbKwb", "wKKKKKKK", "bbbKbKKKb"],
        bot: { "phase": "fire", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "free the trapped whites: a piece near the white at column 9, row 1 taken round into its place", "drags": [{ "x": 9, "y": 1, "ways": [1, 2, 3, 0] }], "state": "atRisk", "tactic": "freeTrapped", "read": "2 whites trapped near the fire (column 9, row 1, column 8, row 1), the worst first", "steps": [{ "name": "the lift, then the ladder, then the lift", "goal": "free column 9's top white", "kind": "free" }] },
        plan: { "aim": "free column 9's top white", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["bKKbwbwK", "bKKwKwKwK", "KKwbKbwK", "KKKwww*ww", "KbbKwKbw", "wKKwwwwKK", "KKbbbKbw", "wKKbbbKwb", "wKKKKKKK", "bbbKbKKKb"], "label": "Save the whites", "drags": [{ "x": 9, "y": 1, "ways": [1, 2, 3, 0] }], "steps": [{ "name": "the lift, then the ladder, then the lift", "goal": "free column 9's top white" }] }, { "cols": ["bKKbwbwK", "bKKwKwKwK", "KKwbKbwK", "KKKwww*ww", "KbbKwKbw", "wKKwwwwKK", "KKbbbKbw", "wKKbbbKwb", "KwKKKKKK", "bbbKbKKKb"], "label": "Save the whites", "drags": [{ "x": 7, "y": 1, "ways": [3] }], "steps": [{ "name": "the drop", "goal": "fill column 9's gap: column 9's white in row 2 out left" }] }, { "cols": ["bKKbwbwK", "bKKwKwKwK", "KKwbKbwK", "KKKwww*ww", "KbbKwKbw", "wKKwwwwKK", "KKbbbKbw", "wwKbbbKwb", "KKKKKKKK", "bbbKbKKKb"], "label": "The sweep", "drags": [{ "x": 1, "y": 2, "ways": [3, 3, 0, 3, 0] }], "steps": [{ "name": "the drop, then the ladder, then the drop, then the ladder", "goal": "carry the black over to the colour in column 7" }] }, { "cols": ["bKKbwbwK", "bKwwKwKwK", "KKwbKbwK", "KKKbww*ww", "KbwKwKbw", "wKKbwwwKK", "KKKbbKbw", "wwKbbbKwb", "KKKKKKKK", "bbbKbKKKb"], "label": "Bring a piece round", "drags": [{ "x": 6, "y": 0, "ways": [3] }, { "x": 9, "y": 0, "ways": [2, 2, 1, 0] }], "steps": [{ "name": "the drop", "goal": "fill column 8's gap: its white further from the fire" }, { "name": "the ladder, then the lift", "goal": "sort column 10's junk, blacks over browns" }] }, { "cols": ["bKKbwbwK", "bKwwKwKwK", "KKwbKbwK", "KKKbww*ww", "KbwKwKbw", "wKKbwwwKK", "wKKbbKbw", "bwKbbbKwb", "KKKKKKKK", "KbbKbKKKb"], "label": "The sweep", "drags": [{ "x": 9, "y": 1, "ways": [2, 1, 1, 1] }], "steps": [{ "name": "the ladder, then the lift", "goal": "open the way to column 8's white in row 2" }] }] },
    },
    {
        id: "P3", moment: "low", level: "cc3", seed: 2, ms: 207200, stage: "junk", burns: 0, chain: 0, timeLeft: 7000,
        what: "2 whites in the bottom rows of the two columns by the fire, 7.0 s before the furnace takes column 10.",
        cols: ["wKwwKwKK", "KKbKwKKKK", "bbKbbbwK", "bbbbbbbbK", "KbwwbwKK", "K*bwwwwwK", "wbbwKwwK", "wKbbbwKKb", "bKKKbKww", "KKKbb*bKK"],
        bot: { "phase": "fire", "kind": "move", "technique": "diamond", "label": "The diamond", "reason": "bring in another piece: drag the black at column 6, row 1 into the gap, then the brown at column 4, row 1 over past it", "drags": [{ "x": 5, "y": 0, "ways": [3] }, { "x": 3, "y": 0, "ways": [3, 0, 3] }], "state": "atRisk", "tactic": "quickSort", "read": "2 whites by the fire free to go, with time in hand (column 9, row 8, column 9, row 7): the quick sorting moves, blacks down and browns up, fill their places; the junk the wrong way up (26 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the drop", "goal": "carry the black over to the colour in column 7", "kind": "pull" }, { "name": "the ladder, then the lift, then the ladder", "goal": "free column 8's top white, stuck", "kind": "untrap" }] },
        plan: { "aim": "free column 8's top white, stuck", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["wKwwKwKK", "KKbKwKKKK", "bbKbbbwK", "bbbbbbbbK", "KbwwbwKK", "K*bwwwwwK", "wbbwKwwK", "wKbbbwKKb", "bKKKbKww", "KKKbb*bKK"], "label": "The diamond", "drags": [{ "x": 5, "y": 0, "ways": [3] }, { "x": 3, "y": 0, "ways": [3, 0, 3] }], "steps": [{ "name": "the drop", "goal": "carry the black over to the colour in column 7" }, { "name": "the ladder, then the lift, then the ladder", "goal": "free column 8's top white, stuck" }] }, { "cols": ["wKwwKwKK", "KKbKwKKKK", "bbKbbbwK", "KbbbbbbbK", "wbwwbwKK", "K*bwwwwwK", "bbbwKwwK", "wKbbbwKKb", "bKKKbKww", "KKKbb*bKK"], "label": "The sweep", "drags": [{ "x": 2, "y": 2, "ways": [0, 3, 3, 3, 0] }], "steps": [{ "name": "the ladder, then the drop, then the ladder", "goal": "carry the black over to the colour in column 8" }] }, { "cols": ["wKwwKwKK", "KKbKwKKKK", "bbbbbbwK", "KbwbbbbbK", "wbwwbwKK", "K*bwwwwwK", "bbbbKwwK", "wKbKbwKKb", "bKKKbKww", "KKKbb*bKK"], "label": "The sweep", "drags": [{ "x": 3, "y": 6, "ways": [3, 0, 0] }], "steps": [{ "name": "the ladder, then the lift", "goal": "carry the brown over to the colour in column 7" }] }, { "cols": ["wKwwKwKK", "KKbKwKKKK", "bbbbbbwK", "KbwbbbKbK", "wbwwbwwK", "K*bwwwwwK", "bbbbKbwK", "wKbKbwKKb", "bKKKbKww", "KKKbb*bKK"], "label": "The sweep", "drags": [{ "x": 6, "y": 4, "ways": [3, 0, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 8's gap: its white further from the fire" }] }, { "cols": ["wKwwKwKK", "KKbKwKKKK", "bbbbbbwK", "KbwbbbKbK", "wbwwbwwK", "K*bwwwwwK", "bbbbwbwK", "wKbKbbKKb", "bKKKbKww", "KKKbK*bKK"], "label": "Save the whites", "drags": [{ "x": 7, "y": 6, "ways": [3, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 9's gap: its white further from the fire" }] }] },
    },
    {
        id: "P4", moment: "low", level: "cc3", seed: 1, ms: 5650, stage: "junk", burns: 0, chain: 0, timeLeft: 9650,
        what: "2 whites in the bottom rows of the two columns by the fire, 9.7 s before the furnace takes column 10.",
        cols: ["KwKKKb*Kw", "bbwbKwww", "*bwwKKbwb", "bKwKbbKb", "K*wKbbwKb", "wKKbKKbw", "wwwKKbbww", "bwKbwbbK", "KKbKKKwbw", "KKKKKKKK"],
        bot: { "phase": "fire", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "fill the gaps: junk raced into a white's place (column 9, row 7, column 9, row 9), and it's out left", "drags": [{ "x": 7, "y": 6, "ways": [0] }], "state": "atRisk", "tactic": "fillGaps", "read": "2 whites by the fire with their columns burning soon (column 9, row 7, column 9, row 9): junk into their places, the quickest first", "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 7 out left", "kind": "fill" }] },
        plan: { "aim": "fill column 9's gap: column 9's white in row 7 out left", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["KwKKKb*Kw", "bbwbKwww", "*bwwKKbwb", "bKwKbbKb", "K*wKbbwKb", "wKKbKKbw", "wwwKKbbww", "bwKbwbbK", "KKbKKKwbw", "KKKKKKKK"], "label": "Save the whites", "drags": [{ "x": 7, "y": 6, "ways": [0] }], "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 7 out left" }] }, { "cols": ["KwKKKb*Kw", "bbwbKwww", "*bwwKKbwb", "bKwKbbKb", "K*wKbbwKb", "wKKbKKbw", "wwwKKbbww", "bwKbwbwK", "KKbKKKbbw", "KKKKKKKK"], "label": "Save the whites", "drags": [{ "x": 7, "y": 7, "ways": [3] }], "steps": [{ "name": "the drop", "goal": "fill column 9's gap: its white further from the fire" }] }, { "cols": ["KwKKKb*Kw", "bbwbKwww", "*bwwKKbwb", "bKwKbbKb", "K*wKbbwKb", "wKKbKKbw", "wwwKKbbww", "bwKbwbww", "KKbKKKbbK", "KKKKKKKK"], "label": "The diamond", "drags": [{ "x": 4, "y": 7, "ways": [3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 7's gap: its white out left before it burns" }] }, { "cols": ["KwKKKb*Kw", "bbwbKwww", "*bwwKKbwb", "bKwKbbKb", "K*wKbbwwb", "wKKbKKbw", "wwwKKbbwK", "bwKbwbww", "KKbKKKbbK", "KKKKKKKK"], "label": "The diamond", "drags": [{ "x": 4, "y": 0, "ways": [3] }, { "x": 3, "y": 0, "ways": [0, 3, 0] }], "steps": [{ "name": "the drop", "goal": "free column 7's white in row 2, stuck" }, { "name": "the lift, then the ladder, then the lift", "goal": "fill column 7's gap: its white further from the fire" }] }, { "cols": ["KwKKKb*Kw", "bbwbKwww", "*bwwKKbwb", "wKwKbbKb", "K*wKbbwwb", "wKKbKKbw", "bwwKKbbwK", "bwKbwbww", "KKbKKKbbK", "KKKKKKKK"], "label": "The sweep", "drags": [{ "x": 7, "y": 4, "ways": [2, 1, 2] }], "steps": [{ "name": "the weave", "goal": "get column 8's white in row 5 out before it burns" }] }] },
    },
    {
        id: "P5", moment: "edge", level: "cc8", seed: 3, ms: 170750, stage: "junk", burns: 0, chain: 0, timeLeft: 12850,
        what: "A white at the top of column 8, 2 columns from the fire, and 4 more whites on an edge or by a spice near it; 12.8 s on the furnace.",
        cols: ["xbKKKwww", "wbbbKwwww", "K*xwKwKK", "KwwwwKwKw", "bwwwwwww", "bbwwwwwKw", "b*wwwwbw", "wwwwwwwww", "bbwbbKKK", "b***KKKKK"],
        bot: { "phase": "block", "kind": "move", "technique": "diamond", "label": "The diamond", "reason": "free the trapped whites: bring in another piece: drag the black at column 3, row 1 into the gap, then the brown at column 6, row 2 over past it", "drags": [{ "x": 2, "y": 0, "ways": [3, 3, 0, 0, 3] }, { "x": 5, "y": 1, "ways": [0] }], "state": "atRisk", "tactic": "freeTrapped", "read": "a white trapped near the fire (column 8, row 2), the worst first; the junk the wrong way up (16 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the drop, then the ladder, then the drop", "goal": "free column 8's white in row 2", "kind": "free" }, { "name": "the lift", "goal": "free column 8's top white, stuck", "kind": "untrap" }] },
        plan: { "aim": "free column 8's top white, stuck", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["xbKKKwww", "wbbbKwwww", "K*xwKwKK", "KwwwwKwKw", "bwwwwwww", "bbwwwwwKw", "b*wwwwbw", "wwwwwwwww", "bbwbbKKK", "b***KKKKK"], "label": "The diamond", "drags": [{ "x": 2, "y": 0, "ways": [3, 3, 0, 0, 3] }, { "x": 5, "y": 1, "ways": [0] }], "steps": [{ "name": "the drop, then the ladder, then the drop", "goal": "free column 8's white in row 2" }, { "name": "the lift", "goal": "free column 8's top white, stuck" }] }, { "cols": ["xbKKKwww", "wbbbKwwww", "w*xwKwKK", "KwwwwKwKw", "bbwwwwww", "bwwwwwwKw", "b*wwwwbw", "wKwwwwwww", "bbwbbKKK", "b***KKKKK"], "label": "Bring a piece round", "drags": [{ "x": 6, "y": 6, "ways": [1, 1, 0, 0, 0, 1, 0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 3 out left" }] }, { "cols": ["xbKKKwww", "wbbbKwwww", "w*xwKwKK", "KwwwwKwKw", "bbwwwwww", "bwwwwwwKw", "b*wwwwww", "wKwwwwwww", "bbbbbKKK", "b***KKKKK"], "label": "Save the whites", "drags": [{ "x": 5, "y": 7, "ways": [3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 8's gap: its white further from the fire" }] }, { "cols": ["xbKKKwww", "wbbbKwwww", "w*xwKwKK", "KwwwwKwKw", "bbwwwwww", "bwwwwwwww", "b*wwwwww", "wKwwwwwwK", "bbbbbKKK", "b***KKKKK"], "label": "Save the whites", "drags": [{ "x": 6, "y": 0, "ways": [0] }], "steps": [{ "name": "the lift", "goal": "fill column 8's gap: its white further from the fire" }] }, { "cols": ["xbKKKwww", "wbbbKwwww", "w*xwKwKK", "KwwwwKwKw", "bbwwwwww", "bwwwwwwww", "w*wwwwww", "bKwwwwwwK", "bbbbbKKK", "b***KKKKK"], "label": "The sweep", "drags": [{ "x": 4, "y": 1, "ways": [0, 0, 3] }], "steps": [{ "name": "the lift, then the ladder", "goal": "fill column 7's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P6", moment: "edge", level: "cc3", seed: 2, ms: 200900, stage: "junk", burns: 0, chain: 0, timeLeft: 13300,
        what: "A white at the top of column 8, 2 columns from the fire, and 4 more whites on an edge or by a spice near it; 13.3 s on the furnace.",
        cols: ["wKwwKwKK", "KKbKwKKKK", "bbKbKKwK", "bbbbbbbbK", "KbwbbbKK", "b*bwbbwwK", "KbbwwwwK", "wKbbwwKKb", "wKKKwwww", "KKKbb*bKK"],
        bot: { "phase": "fire", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "free the trapped whites: a white stuck in a column to burn: bring the brown at column 6, row 1 beside it, then drag it out left", "drags": [{ "x": 5, "y": 0, "ways": [3, 3] }, { "x": 8, "y": 0, "ways": [2, 1] }], "state": "atRisk", "tactic": "freeTrapped", "read": "a white trapped near the fire (column 9, row 1), the worst first; the junk the wrong way up (26 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the ladder", "goal": "open the way to column 9's top white", "kind": "open" }, { "name": "the weave", "goal": "free column 9's top white", "kind": "free" }] },
        plan: { "aim": "free column 9's top white", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["wKwwKwKK", "KKbKwKKKK", "bbKbKKwK", "bbbbbbbbK", "KbwbbbKK", "b*bwbbwwK", "KbbwwwwK", "wKbbwwKKb", "wKKKwwww", "KKKbb*bKK"], "label": "Save the whites", "drags": [{ "x": 5, "y": 0, "ways": [3, 3] }, { "x": 8, "y": 0, "ways": [2, 1] }], "steps": [{ "name": "the ladder", "goal": "open the way to column 9's top white" }, { "name": "the weave", "goal": "free column 9's top white" }] }, { "cols": ["wKwwKwKK", "KKbKwKKKK", "bbKbKKwK", "bbbbbbbbK", "KbwbbbKK", "K*bwbbwwK", "wbbwwwwK", "wKbbwwKKb", "bKKKwwww", "KKKbb*bKK"], "label": "Save the whites", "drags": [{ "x": 7, "y": 7, "ways": [3] }], "steps": [{ "name": "the drop", "goal": "fill column 9's gap: column 9's bottom white out left" }] }, { "cols": ["wKwwKwKK", "KKbKwKKKK", "bbKbKKwK", "bbbbbbbbK", "KbwbbbKK", "K*bwbbwwK", "wbbwwwwK", "wKbbwwKwb", "bKKKwwwK", "KKKbb*bKK"], "label": "The sweep", "drags": [{ "x": 2, "y": 5, "ways": [0, 0, 0, 3, 3, 3] }], "steps": [{ "name": "the ladder, then the drop", "goal": "fill column 9's gap: column 9's white in row 6 out left" }] }, { "cols": ["wKwwKwKK", "KKbKwKKKK", "bbKbKbwK", "bbbbbbbbK", "KbwbbbKK", "K*bwwbwwK", "wbbwwwwK", "wKbbwwKwb", "bKKKwKwK", "KKKbb*bKK"], "label": "The sweep", "drags": [{ "x": 3, "y": 6, "ways": [3, 0, 0, 0, 0] }], "steps": [{ "name": "the ladder, then the lift", "goal": "fill column 9's gap: column 9's white in row 5 out left" }] }, { "cols": ["wKwwKwKK", "KKbKwKKKK", "bbKbKbwK", "bbbbbbKbK", "KbwbbbwK", "K*bwwbwwK", "wbbwwwwK", "wKbbwwKwb", "bKKKbKwK", "KKKbb*bKK"], "label": "Save the whites", "drags": [{ "x": 7, "y": 6, "ways": [3, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 9's gap: its white further from the fire" }] }] },
    },
    {
        id: "P7", moment: "stuck", level: "cc8", seed: 2, ms: 588900, stage: "junk", burns: 0, chain: 0, timeLeft: 7800,
        what: "The bot waits, with 8 pieces stuck (white and brown and black), 5 whites in columns 8 and 9 by the fire with no way out left on their own, 2 of them low down; 7.8 s on the furnace.",
        cols: ["bwKwKKwKK", "Kw*wwwbw", "ww*www*Kw", "bwwwwwww", "bwwwwww*K", "wwwwwwwK", "wwwwbwKww", "bwbwwKwK", "bwwwbwwKK", "bbbKbKKK"],
        bot: { "phase": "block", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "fill the gaps: junk raced into a white's place (column 9, row 6, column 9, row 2, column 9, row 4), and it's out left", "drags": [{ "x": 6, "y": 4, "ways": [0, 0] }], "state": "damageControl", "tactic": "fillGaps", "read": "5 whites still in column 9, 23 s from the fire, and junk free for 1 column: fill its gaps however you can, the quickest first; the junk the wrong way up (16 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 4 out left", "kind": "fill" }] },
        plan: { "aim": "fill column 9's gap: column 9's white in row 4 out left", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["bwKwKKwKK", "Kw*wwwbw", "ww*www*Kw", "bwwwwwww", "bwwwwww*K", "wwwwwwwK", "wwwwbwKww", "bwbwwKwK", "bwwwbwwKK", "bbbKbKKK"], "label": "Save the whites", "drags": [{ "x": 6, "y": 4, "ways": [0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 4 out left" }] }, { "cols": ["bwKwKKwKK", "Kw*wwwbw", "ww*www*Kw", "bwwwwwww", "bwwwwww*K", "wwwwwwwK", "wwwwwwKww", "bwbwwKwK", "bwwbbwwKK", "bbbKbKKK"], "label": "Save the whites", "drags": [{ "x": 7, "y": 2, "ways": [1, 0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 2 out left" }] }, { "cols": ["bwKwKKwKK", "Kw*wwwbw", "ww*www*Kw", "bwwwwwww", "bwwwwww*K", "wwwwwwwK", "wwwwwwKww", "bwwwwKwK", "bbwbbwwKK", "bbbKbKKK"], "label": "Save the whites", "drags": [{ "x": 9, "y": 3, "ways": [1, 2, 2, 3, 3] }], "steps": [{ "name": "the ladder, then the drop", "goal": "fill column 9's gap: column 9's white in row 6 out left" }] }, { "cols": ["bwKwKKwKK", "Kw*wwwbw", "ww*www*Kw", "bwwwwwww", "bwwwwww*K", "wwwwwwwK", "wwwwwwKww", "bwwwwKwK", "bbwwbKwKK", "bbbbbKKK"], "label": "The diamond", "drags": [{ "x": 1, "y": 6, "ways": [1, 0, 0, 0, 0, 0, 0, 0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 3 out left" }] }, { "cols": ["bwKwKKwKK", "Kw*wwwww", "ww*www*Kw", "bwwwwwww", "bwwwwww*K", "wwwwwwwK", "wwwwwwKww", "bwwwwKwK", "bbbwbKwKK", "bbbbbKKK"], "label": "The sweep", "drags": [{ "x": 9, "y": 4, "ways": [2, 2, 2] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 7, row 7, in for the black there" }] }] },
    },
    {
        id: "P8", moment: "stuck", level: "cc8", seed: 3, ms: 197950, stage: "junk", burns: 0, chain: 0, timeLeft: 950,
        what: "The bot waits, with 9 pieces stuck (white), 4 whites in column 8 by the fire with no way out left on their own, 2 of them low down; 0.9 s on the furnace.",
        cols: ["bKwwwwK*w", "xbwwwwww", "wbxwwwwww", "w*wwwwKK", "wwwwwwwww", "bwwwwwKK", "bbwwwwwww", "b*wwKwwK", "bKbbbKKKK", "bbbKKKKK"],
        bot: { "phase": "block", "kind": "move", "technique": "turnOver", "label": "Turn the right side over", "reason": "sort the ladder: a brown brought down to the V's tip, column 8, row 8, swapped in for the black there", "drags": [{ "x": 8, "y": 4, "ways": [2, 3, 3, 2, 3, 2, 2] }], "state": "atRisk", "tactic": "sortLadder", "read": "columns 9 and 10 aren't sorted blacks over browns, and column 10 goes in 0.9 s: sort the ladder before it's lost; the junk the wrong way up (13 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 8, row 8, in for the black there", "kind": "tail" }] },
        plan: { "aim": "the brown down to the V's tip, column 8, row 8, in for the black there", "reached": 1, "through": true, "ends": "the furnace takes the next column", "moves": [{ "cols": ["bKwwwwK*w", "xbwwwwww", "wbxwwwwww", "w*wwwwKK", "wwwwwwwww", "bwwwwwKK", "bbwwwwwww", "b*wwKwwK", "bKbbbKKKK", "bbbKKKKK"], "label": "Turn the right side over", "drags": [{ "x": 8, "y": 4, "ways": [2, 3, 3, 2, 3, 2, 2] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 8, row 8, in for the black there" }] }] },
    },
    {
        id: "P9", moment: "block", level: "cc8", seed: 1, ms: 102000, stage: "junk", burns: 0, chain: 0, timeLeft: 5100,
        what: "Whites mostly left (40 on the board); the junk being moved in blocks and wrapped round them in a V. 5.1 s on the furnace.",
        cols: ["KwwwKKwbw", "ww*wbwKK", "wbwww*bKw", "bwwwwwww", "wwwwwwwwK", "wwwwKbKK", "wbbwww*bw", "bwbwbKbK", "*KKKKKKKK", "bKKKKKbK"],
        bot: { "phase": "block", "kind": "move", "technique": "turnOver", "label": "Turn the right side over", "reason": "sort the tail: a brown brought down to the V's tip, column 5, row 9, swapped in for the black there", "drags": [{ "x": 6, "y": 7, "ways": [2, 2] }], "state": "atRisk", "tactic": "sortTail", "read": "the V's tail unsorted (column 7, row 8, column 8, row 7): browns down through the blacks, so the next sweep runs through; the junk the wrong way up (14 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 5, row 9, in for the black there", "kind": "tail" }] },
        plan: { "aim": "the brown down to the V's tip, column 5, row 9, in for the black there", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["KwwwKKwbw", "ww*wbwKK", "wbwww*bKw", "bwwwwwww", "wwwwwwwwK", "wwwwKbKK", "wbbwww*bw", "bwbwbKbK", "*KKKKKKKK", "bKKKKKbK"], "label": "Turn the right side over", "drags": [{ "x": 6, "y": 7, "ways": [2, 2] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 5, row 9, in for the black there" }] }, { "cols": ["KwwwKKwbw", "ww*wbwKK", "wbwww*bKw", "bwwwwwww", "wwwwwwwwb", "wwwwKbKK", "wbbwww*Kw", "bwbwbKbK", "*KKKKKKKK", "bKKKKKbK"], "label": "Turn the right side over", "drags": [{ "x": 7, "y": 6, "ways": [2, 2] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 6, row 8, in for the black there" }] }, { "cols": ["KwwwKKwbw", "ww*wbwKK", "wbwww*bKw", "bwwwwwww", "wwwwwwwwb", "wwwwKbKb", "wbbwww*Kw", "bwbwbKKK", "*KKKKKKKK", "bKKKKKbK"], "label": "The sweep", "drags": [{ "x": 6, "y": 2, "ways": [0, 3, 3] }], "steps": [{ "name": "the lift, then the ladder", "goal": "fill column 8's gap: its white further from the fire" }] }, { "cols": ["KwwwKKwbw", "ww*wbwKK", "wbwww*bKw", "bwwwwwww", "wwwwwwwwb", "wwwwKbKb", "wbwwww*Kw", "bKbwbKKK", "*KKKKKKKK", "bKbKKKbK"], "label": "Turn the right side over", "drags": [{ "x": 5, "y": 7, "ways": [1, 1, 0, 3] }], "steps": [{ "name": "the lift, then the ladder", "goal": "the brown down to the V's tip, column 6, row 7, in for the black there" }] }, { "cols": ["KwwwKKwbw", "ww*wbwKK", "wbwww*bKw", "bwwwwwww", "wwwwwwKwb", "wwwwKbbw", "wbwwww*Kw", "bKbwbKKK", "*KKKKKKKK", "bKbKKKbK"], "label": "Turn the right side over", "drags": [{ "x": 5, "y": 5, "ways": [2] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 5, row 7, in for the black there" }] }] },
    },
    {
        id: "P10", moment: "block", level: "cc8", seed: 2, ms: 160050, stage: "junk", burns: 0, chain: 0, timeLeft: 8250,
        what: "Whites mostly left (44 on the board); the junk being moved in blocks and wrapped round them in a V. 8.3 s on the furnace.",
        cols: ["bbwwbwwKK", "wbbbwwww", "K*wwwwwwK", "wbbwwwww", "wwwwwwKww", "bwwwbwww", "wwwwb*wwK", "bbwwwbKK", "bbbbbbbK*", "bbbKbbbK"],
        bot: { "phase": "block", "kind": "move", "technique": "store", "label": "Store the junk", "reason": "fix the cracks: store the junk: the black at column 3, row 1 can't cross yet: take it back to the junk on the left before it's trapped", "drags": [{ "x": 2, "y": 0, "ways": [2] }], "state": "cracked", "tactic": "fixCracks", "read": "14 pieces of junk stranded among the whites (column 1, row 1, column 1, row 2, column 1, row 5 and 11 more): free them, keeping the browns in the middle to do it with; the junk the wrong way up (16 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the drop", "goal": "free the stranded brown at column 1, row 1", "kind": "cracks" }] },
        plan: { "aim": "free the stranded brown at column 1, row 1", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["bbwwbwwKK", "wbbbwwww", "K*wwwwwwK", "wbbwwwww", "wwwwwwKww", "bwwwbwww", "wwwwb*wwK", "bbwwwbKK", "bbbbbbbK*", "bbbKbbbK"], "label": "Store the junk", "drags": [{ "x": 2, "y": 0, "ways": [2] }], "steps": [{ "name": "the drop", "goal": "free the stranded brown at column 1, row 1" }] }, { "cols": ["bbwwbwwKK", "Kbbbwwww", "w*wwwwwwK", "wbbwwwww", "wwwwwwKww", "bwwwbwww", "wwwwb*wwK", "bbwwwbKK", "bbbbbbbK*", "bbbKbbbK"], "label": "Store the junk", "drags": [{ "x": 3, "y": 2, "ways": [1] }], "steps": [{ "name": "the lift", "goal": "free the stranded brown at column 2, row 2" }] }, { "cols": ["bbwwbwwKK", "Kbbbwwww", "w*bwwwwwK", "wbwwwwww", "wwwwwwKww", "bwwwbwww", "wwwwb*wwK", "bbwwwbKK", "bbbbbbbK*", "bbbKbbbK"], "label": "The sweep", "drags": [{ "x": 9, "y": 6, "ways": [2, 2, 2] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 7, row 9, in for the black there" }] }, { "cols": ["bbwwbwwKK", "Kbbbwwww", "w*bwwwwwK", "wbwwwwww", "wwwwwwKww", "bwwwbwww", "wwwwb*wwb", "bbwwwbKK", "bbbbbbbK*", "bbbKbbKK"], "label": "Turn the right side over", "drags": [{ "x": 8, "y": 6, "ways": [2, 3, 2] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 8, row 8, in for the black there" }] }, { "cols": ["bbwwbwwKK", "Kbbbwwww", "w*bwwwwwK", "wbwwwwww", "wwwwwwKww", "bwwwbwww", "wwwwb*wwb", "bbwwwbKb", "bbbbbbKK*", "bbbKbbKK"], "label": "Turn the right side over", "drags": [{ "x": 9, "y": 5, "ways": [2, 2] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 8, row 7, in for the black there" }] }] },
    },
    {
        id: "P11", moment: "junkUp", level: "cc3", seed: 1, ms: 135200, stage: "chain", burns: 0, chain: 2, timeLeft: 2500,
        what: "The chain at CC^2; column 10 goes up next with 1 brown in it, 2.5 s before it goes.",
        cols: ["wwKbKbbKb", "KKbKbKbK", "bbwbKbKbK", "bK*KbwKK", "bKKwK*KKb", "wKwKbKKK", "wwwKKbKKb", "wwwbbKbw", "bwwwwK*ww", "wwwwwbww"],
        bot: { "phase": "chain", "kind": "move", "technique": "path", "label": "Bring a piece round", "reason": "the brown at column 10, row 6 is stuck: bring the white at column 8, row 8 round, looping, to take its place, and it's out left", "drags": [{ "x": 7, "y": 7, "ways": [1, 1, 0, 0, 0, 3] }], "column": 9, "state": "healthy", "tactic": "chain", "read": "the chain: whites right", "steps": [{ "name": "the weave", "goal": "clear column 10's junk for the Crystal Clear", "kind": "build" }] },
        plan: { "aim": "clear column 10's junk for the Crystal Clear", "reached": 1, "through": true, "ends": "it waits", "moves": [{ "cols": ["wwKbKbbKb", "KKbKbKbK", "bbwbKbKbK", "bK*KbwKK", "bKKwK*KKb", "wKwKbKKK", "wwwKKbKKb", "wwwbbKbw", "bwwwwK*ww", "wwwwwbww"], "label": "Bring a piece round", "drags": [{ "x": 7, "y": 7, "ways": [1, 1, 0, 0, 0, 3] }], "steps": [{ "name": "the weave", "goal": "clear column 10's junk for the Crystal Clear" }] }] },
    },
    {
        id: "P12", moment: "junkUp", level: "cc8", seed: 2, ms: 303450, stage: "chain", burns: 0, chain: 1, timeLeft: 2550,
        what: "The chain at CC^1; column 10 goes up next with 1 brown in it, 2.5 s before it goes.",
        cols: ["wbKwwbKK", "KbKbwwbKK", "KKKbwKKK", "bKbbbbKKK", "bbbbwKKb", "KbbKbwwKb", "wbwwwwKK", "wwwwwwKKK", "wwwwwwww", "wbwwwwwww"],
        bot: { "phase": "chain", "kind": "wait", "technique": null, "label": "Wait", "reason": "nothing worth moving: wait for the next column", "drags": [], "column": 9, "state": "healthy", "tactic": "chain", "read": "the chain: whites right" },
        plan: { "aim": null, "reached": null, "through": false, "ends": "it waits", "moves": [] },
    },
    {
        id: "P13", moment: "early", level: "cc5", seed: 4, ms: 6050, stage: "junk", burns: 0, chain: 0, timeLeft: 9250, batch: "random",
        what: "6.0 s into the session: 5 whites still in the three columns by the fire, 9.3 s before the first goes.",
        cols: ["KKKb*bKwK", "KKKwwbww", "KKwKbwK*K", "wKbbKKwK", "KbbbbbKKb", "wbKwwKwK", "Kwb*KbwwK", "wwKwKwbw", "KbKKbbKKK", "bKKKKKKK"],
        bot: { "phase": "fire", "kind": "move", "technique": "sweep", "label": "The sweep", "reason": "go, go, go: whites left, junk right: the brown at column 5, row 5 up-right across the whites, then down through the blacks to the browns", "drags": [{ "x": 4, "y": 4, "ways": [0, 3, 0] }], "state": "atRisk", "tactic": "quickSort", "read": "the whites flagged (column 8, row 1, column 8, row 4, column 8, row 8 and 2 more) can wait: quick, simple moves", "steps": [{ "name": "the lift, then the ladder, then the lift", "goal": "fill column 8's gap: its white out left before it burns", "kind": "fill" }] },
        plan: { "aim": "fill column 8's gap: its white out left before it burns", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["KKKb*bKwK", "KKKwwbww", "KKwKbwK*K", "wKbbKKwK", "KbbbbbKKb", "wbKwwKwK", "Kwb*KbwwK", "wwKwKwbw", "KbKKbbKKK", "bKKKKKKK"], "label": "The sweep", "drags": [{ "x": 4, "y": 4, "ways": [0, 3, 0] }], "steps": [{ "name": "the lift, then the ladder, then the lift", "goal": "fill column 8's gap: its white out left before it burns" }] }, { "cols": ["KKKb*bKwK", "KKKwwbww", "KKwKbwK*K", "wKbbKKwK", "KbbbwbKKb", "wbKKwKwK", "Kwb*wbwwK", "wwKbKwbw", "KbKKbbKKK", "bKKKKKKK"], "label": "The sweep", "drags": [{ "x": 6, "y": 1, "ways": [2, 2, 1] }], "steps": [{ "name": "the weave", "goal": "get column 7's white in row 2 out before it burns" }] }, { "cols": ["KKKb*bKwK", "KKKwwbww", "KKwKbwK*K", "wwbbKKwK", "KbKbwbKKb", "wbKKwKwK", "Kbb*wbwwK", "wwKbKwbw", "KbKKbbKKK", "bKKKKKKK"], "label": "The sweep", "drags": [{ "x": 4, "y": 5, "ways": [0, 0, 3] }], "steps": [{ "name": "the lift, then the ladder", "goal": "fill column 7's gap: its white out left before it burns" }] }, { "cols": ["KKKb*bKwK", "KKKwwbww", "KKwKbwK*K", "wwbbKKwK", "KbKbwwKKb", "wbKKwKwK", "Kbb*KbwwK", "wwKbbwbw", "KbKKbbKKK", "bKKKKKKK"], "label": "The sweep", "drags": [{ "x": 4, "y": 6, "ways": [3, 3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 8's gap: its white out left before it burns" }] }, { "cols": ["KKKb*bKwK", "KKKwwbww", "KKwKbwK*K", "wwbbKKwK", "KbKbwwwKb", "wbKKwKwK", "Kbb*KbwwK", "wwKbbwbK", "KbKKbbKKK", "bKKKKKKK"], "label": "The sweep", "drags": [{ "x": 3, "y": 5, "ways": [3, 3, 3, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 7's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P14", moment: "low", level: "cc5", seed: 7, ms: 174700, stage: "junk", burns: 0, chain: 0, timeLeft: 8900, batch: "random",
        what: "3 whites in the bottom rows of the two columns by the fire, 8.9 s before the furnace takes column 10.",
        cols: ["bbwbKbbK", "bxwbwbwKw", "wwwKKwbK", "KwKwww*Kw", "wwbwwwbw", "*wwwwbwwK", "KbwwwbwK", "K*wwwww*w", "wKwwKww*", "KbbbbbbKw"],
        bot: { "phase": "fire", "kind": "move", "technique": "sweep", "label": "The sweep", "reason": "go, go, go: fill the gaps: whites left, junk right: the brown at column 6, row 6 up-right across the whites, then down through the blacks to the browns", "drags": [{ "x": 5, "y": 5, "ways": [0, 0, 0] }], "state": "atRisk", "tactic": "fillGaps", "read": "column 10's white past saving, given up as junk; 5 whites by the fire with their columns burning soon (column 9, row 1, column 9, row 7, column 9, row 4 and 2 more): junk into their places, the quickest first", "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 4 out left", "kind": "fill" }] },
        plan: { "aim": "fill column 9's gap: column 9's white in row 4 out left", "reached": 1, "through": true, "ends": "it waits", "moves": [{ "cols": ["bbwbKbbK", "bxwbwbwKw", "wwwKKwbK", "KwKwww*Kw", "wwbwwwbw", "*wwwwbwwK", "KbwwwbwK", "K*wwwww*w", "wKwwKww*", "KbbbbbbKw"], "label": "The sweep", "drags": [{ "x": 5, "y": 5, "ways": [0, 0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 4 out left" }] }, { "cols": ["bbwbKbbK", "bxwbwbwKw", "wwwKKwbK", "KwKwww*Kw", "wwbwwwbw", "*wwwwwwwK", "KbwwwbwK", "K*wwwww*w", "wKwbKww*", "KbbbbbbKw"], "label": "Save the whites", "drags": [{ "x": 8, "y": 4, "ways": [2, 3, 2, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 9's gap: column 9's white in row 7 out left" }] }, { "cols": ["bbwbKbbK", "bxwbwbwKw", "wwwKKwbK", "KwKwww*Kw", "wwbwwwbw", "*wwwwwwwK", "KbwwwbwK", "K*wwwww*w", "wKwbwwK*", "KbbbbbbKw"], "label": "Finish the junk column", "drags": [{ "x": 6, "y": 5, "ways": [0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 5 out left" }] }, { "cols": ["bbwbKbbK", "bxwbwbwKw", "wwwKKwbK", "KwKwww*Kw", "wwbwwwbw", "*wwwwwwwK", "KbwwwwwK", "K*wwwww*w", "wKwbbwK*", "KbbbbbbKw"], "label": "The crawl", "drags": [{ "x": 3, "y": 2, "ways": [2, 3, 3, 3, 3, 3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 9's gap: column 9's white in row 6 out left" }] }] },
    },
    {
        id: "P15", moment: "edge", level: "cc8", seed: 9, ms: 414550, stage: "junk", burns: 0, chain: 0, timeLeft: 13850, batch: "random",
        what: "A white beside a spice in column 8, 2 columns from the fire, and 2 more whites on an edge or by a spice near it; 13.8 s on the furnace.",
        cols: ["bbKKbwKb", "bwwwwb*wK", "wbwKwbww", "wbKwwwwKb", "bwwwbwKb", "wwKKwwKKb", "bbwwKK**", "bKbKKbwbw", "KKbKbKKw", "bbKbbKb*b"],
        bot: { "phase": "fire", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "a white in a column to burn: drag it out left, up through the blacks", "drags": [{ "x": 7, "y": 6, "ways": [1] }], "state": "atRisk", "tactic": "freeTrapped", "read": "2 whites trapped near the fire (column 9, row 8, column 8, row 9), the worst first", "steps": [{ "name": "the climb", "goal": "get column 8's white in row 7 further from the fire", "kind": "save" }] },
        plan: { "aim": "get column 8's white in row 7 further from the fire", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["bbKKbwKb", "bwwwwb*wK", "wbwKwbww", "wbKwwwwKb", "bwwwbwKb", "wwKKwwKKb", "bbwwKK**", "bKbKKbwbw", "KKbKbKKw", "bbKbbKb*b"], "label": "Save the whites", "drags": [{ "x": 7, "y": 6, "ways": [1] }], "steps": [{ "name": "the climb", "goal": "get column 8's white in row 7 further from the fire" }] }, { "cols": ["bbKKbwKb", "bwwwwb*wK", "wbwKwbww", "wbKwwwwKb", "bwwwbwKb", "wwKKwwKKb", "bbwwKw**", "bKbKKbKbw", "KKbKbKKw", "bbKbbKb*b"], "label": "Save the whites", "drags": [{ "x": 8, "y": 5, "ways": [1] }], "steps": [{ "name": "the ladder", "goal": "set the pieces round column 9's bottom white moving" }] }, { "cols": ["bbKKbwKb", "bwwwwb*wK", "wbwKwbww", "wbKwwwwKb", "bwwwbwKb", "wwKKwwKKb", "bbwwKw**", "bKbKKKKbw", "KKbKbbKw", "bbKbbKb*b"], "label": "Save the whites", "drags": [{ "x": 7, "y": 6, "ways": [0] }], "steps": [{ "name": "the ladder", "goal": "set the pieces round column 9's bottom white moving" }] }, { "cols": ["bbKKbwKb", "bwwwwb*wK", "wbwKwbww", "wbKwwwwKb", "bwwwbwKb", "wwKKwwKKb", "bbwwKw**", "bKbKKKbbw", "KKbKbKKw", "bbKbbKb*b"], "label": "The diamond", "drags": [{ "x": 0, "y": 3, "ways": [3, 3, 3, 3] }, { "x": 2, "y": 5, "ways": [0, 3, 3, 0] }], "steps": [{ "name": "the drop", "goal": "free column 4's top white, stuck" }, { "name": "the lift, then the ladder, then the lift", "goal": "carry the brown over to the colour in column 7" }] }, { "cols": ["bbKwbwKb", "bwwwwb*wK", "wbwKwwww", "wbKwwKwKb", "bwwwbKKb", "wwKKwwwKb", "bbwwKb**", "bKbKKKbbw", "KKbKbKKw", "bbKbbKb*b"], "label": "Save the whites", "drags": [{ "x": 6, "y": 5, "ways": [1] }], "steps": [{ "name": "the lift", "goal": "set the pieces round column 9's bottom white moving" }] }] },
    },
    {
        id: "P16", moment: "stuck", level: "cc8", seed: 5, ms: 102200, stage: "junk", burns: 0, chain: 0, timeLeft: 4900, batch: "random",
        what: "The bot waits, with 4 pieces stuck (white and black), 4 whites in columns 8 and 10 by the fire with no way out left on their own, 4 of them low down; 4.9 s on the furnace.",
        cols: ["KKbwbb*bK", "bbwwbwww", "wwbwwwwwK", "wwbwwwww", "KwwwwKwww", "bbwwwwww", "wwbwwwwwK", "bKbbwwwK", "bbbbbbK*K", "KKbbbbbw"],
        bot: { "phase": "block", "kind": "wait", "technique": null, "label": "Wait", "reason": "nothing worth moving: wait for the next column", "drags": [], "state": "atRisk", "tactic": "sortLadder", "read": "column 10's white past saving, given up as junk; columns 9 and 10 aren't sorted blacks over browns, and column 10 goes in 4.9 s: sort the ladder before it's lost; the junk the wrong way up (20 browns high and blacks low): hoist the blacks with the browns before they strand" },
        plan: { "aim": null, "reached": null, "through": false, "ends": "it waits", "moves": [] },
    },
    {
        id: "P17", moment: "block", level: "cc5", seed: 8, ms: 67200, stage: "junk", burns: 0, chain: 0, timeLeft: 9300, batch: "random",
        what: "Whites mostly left (42 on the board); the junk being moved in blocks and wrapped round them in a V. 9.3 s on the furnace.",
        cols: ["wwwKwKKww", "bbwKKK*b", "wbwwwKwww", "bwwwKwww", "wwwwwwwK*", "wwwwwwww", "bwwwwwww*", "*KbKKK*K", "KKKKKKKbK", "bKKKbbbK"],
        bot: { "phase": "block", "kind": "move", "technique": "sweep", "label": "The sweep", "reason": "go, go, go: whites left, junk right: the black at column 3, row 6 down-right across the whites, then up through the browns to the blacks", "drags": [{ "x": 2, "y": 5, "ways": [3, 3, 3, 3] }], "state": "atRisk", "tactic": "blocks", "read": "nothing at risk, the whites mostly left: the junk moved in long drags, blocks at a time; the junk the wrong way up (8 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the drop", "goal": "fill column 7's gap: its white out left before it burns", "kind": "fill" }] },
        plan: { "aim": "fill column 7's gap: its white out left before it burns", "reached": 1, "through": true, "ends": "it waits", "moves": [{ "cols": ["wwwKwKKww", "bbwKKK*b", "wbwwwKwww", "bwwwKwww", "wwwwwwwK*", "wwwwwwww", "bwwwwwww*", "*KbKKK*K", "KKKKKKKbK", "bKKKbbbK"], "label": "The sweep", "drags": [{ "x": 2, "y": 5, "ways": [3, 3, 3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 7's gap: its white out left before it burns" }] }, { "cols": ["wwwKwKKww", "bbwKKK*b", "wbwwwwwww", "bwwwKwww", "wwwwwwwK*", "wwwwwwww", "bwwwwwwK*", "*KbKKK*K", "KKKKKKKbK", "bKKKbbbK"], "label": "The sweep", "drags": [{ "x": 1, "y": 4, "ways": [3, 3, 3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 6's gap: its white out left before it burns" }] }, { "cols": ["wwwKwKKww", "bbwKwK*b", "wbwwwwwww", "bwwwKwww", "wwwwwwwK*", "wwwwwwKw", "bwwwwwwK*", "*KbKKK*K", "KKKKKKKbK", "bKKKbbbK"], "label": "The diamond", "drags": [{ "x": 3, "y": 4, "ways": [3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 6's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P18", moment: "chain", level: "cc5", seed: 6, ms: 219650, stage: "chain", burns: 0, chain: 6, timeLeft: 9850, batch: "random",
        what: "The chain at CC^6, the bot filling column 10 (3 pieces of junk still in it), 9.8 s on the furnace.",
        cols: ["KbwKbKKwK", "bbKbbbbw", "wbwbKKb*b", "KwKbbKKb", "bKKbbwKK*", "bKKbbwKK", "bbKKbwKKK", "bbKbwwwb", "bbwKwwwKK", "Kbwwwwwb"],
        bot: { "phase": "chain", "kind": "move", "technique": "crawl", "label": "The crawl", "reason": "the black at column 4, row 1 can't move alone: crawl it left with a brown beside it", "drags": [{ "x": 1, "y": 0, "ways": [0, 3] }, { "x": 2, "y": 0, "ways": [2] }], "column": 9, "state": "healthy", "tactic": "chain", "read": "the chain: whites right", "steps": [{ "name": "the lift, then the ladder", "goal": "make way for drag 2", "kind": "makeWay" }, { "name": "the drop", "goal": "take the black back left, out of the chain's way", "kind": "build" }] },
        plan: { "aim": "take the black back left, out of the chain's way", "reached": 1, "through": true, "ends": "it waits", "moves": [{ "cols": ["KbwKbKKwK", "bbKbbbbw", "wbwbKKb*b", "KwKbbKKb", "bKKbbwKK*", "bKKbbwKK", "bbKKbwKKK", "bbKbwwwb", "bbwKwwwKK", "Kbwwwwwb"], "label": "The crawl", "drags": [{ "x": 1, "y": 0, "ways": [0, 3] }, { "x": 2, "y": 0, "ways": [2] }], "steps": [{ "name": "the lift, then the ladder", "goal": "make way for drag 2" }, { "name": "the drop", "goal": "take the black back left, out of the chain's way" }] }] },
    },
    {
        id: "P19", moment: "stuck", level: "cc8", seed: 7, ms: 179700, stage: "junk", burns: 0, chain: 0, timeLeft: 3900, batch: "random",
        what: "The bot waits, with 4 pieces stuck (white and brown), 7 whites in columns 8 and 9 and 10 by the fire with no way out left on their own, 4 of them low down; 3.9 s on the furnace.",
        cols: ["bbwbKbwK", "bxwbwwwKw", "wwwKwwbK", "KwKwww*Kw", "wwbwwwbw", "*wwwwbbwK", "KbwwwwwK", "K*bwwww*w", "wKbwKwb*", "KbbbbbKKw"],
        bot: { "phase": "block", "kind": "wait", "technique": null, "label": "Wait", "reason": "nothing worth moving: wait for the next column", "drags": [], "state": "atRisk", "tactic": "fillGaps", "read": "column 10's white past saving, given up as junk; 3 whites by the fire with their columns burning soon (column 9, row 1, column 9, row 6, column 9, row 4): junk into their places, the quickest first" },
        plan: { "aim": null, "reached": null, "through": false, "ends": "it waits", "moves": [] },
    },
    {
        id: "P20", moment: "edge", level: "cc8", seed: 4, ms: 138600, stage: "junk", burns: 0, chain: 0, timeLeft: 14400, batch: "random",
        what: "A white at the top of column 8, 2 columns from the fire, and 4 more whites on an edge or by a spice near it; 14.4 s on the furnace.",
        cols: ["wwbKbwbb", "bwKbbKKww", "wKK*wKwK", "wwwbwwwww", "ww*wwKww", "wwwwwwwwK", "wwwwwwKK", "wwwKwbwww", "bbbb*b*K", "KKKb*bKKb"],
        bot: { "phase": "block", "kind": "move", "technique": "sweep", "label": "The sweep", "reason": "go, go, go: a white stuck in a column to burn: sweep the brown at column 1, row 5 onto it, and it's out", "drags": [{ "x": 0, "y": 4, "ways": [3, 3, 0, 3, 0, 0, 0] }], "state": "atRisk", "tactic": "blocks", "read": "the whites flagged (column 8, row 7, column 8, row 1, column 8, row 2 and 1 more) can wait: the junk moved in blocks", "steps": [{ "name": "the ladder, then the lift, then the ladder, then the lift", "goal": "fill column 8's gap: its white out left before it burns", "kind": "fill" }] },
        plan: { "aim": "fill column 8's gap: its white out left before it burns", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["wwbKbwbb", "bwKbbKKww", "wKK*wKwK", "wwwbwwwww", "ww*wwKww", "wwwwwwwwK", "wwwwwwKK", "wwwKwbwww", "bbbb*b*K", "KKKb*bKKb"], "label": "The sweep", "drags": [{ "x": 0, "y": 4, "ways": [3, 3, 0, 3, 0, 0, 0] }], "steps": [{ "name": "the ladder, then the lift, then the ladder, then the lift", "goal": "fill column 8's gap: its white out left before it burns" }] }, { "cols": ["wwbKKwbb", "bwKbbKKww", "wKK*wwwK", "wwwbwKwww", "ww*wwwww", "wwwwwwwwK", "wwwwwwKK", "wwwKbbwww", "bbbb*b*K", "KKKb*bKKb"], "label": "The diamond", "drags": [{ "x": 0, "y": 7, "ways": [0, 0, 0, 0, 0] }, { "x": 3, "y": 5, "ways": [3, 0, 3, 3, 0, 0] }], "steps": [{ "name": "the lift", "goal": "free column 7's white in row 5, stuck" }, { "name": "the drop, then the ladder, then the drop, then the ladder", "goal": "fill column 8's gap: its white further from the fire" }] }, { "cols": ["wwbKKwbw", "bwKbbKKww", "wKK*wwwK", "wwwbwwwww", "ww*wwbww", "wwwwwwwwK", "wwwwwwKK", "wwwKbbbww", "bbbb*b*K", "KKKb*KKKb"], "label": "Save the whites", "drags": [{ "x": 6, "y": 6, "ways": [3] }], "steps": [{ "name": "the drop", "goal": "fill column 8's gap: its white further from the fire" }] }, { "cols": ["wwbKKwbw", "bwKbbKKww", "wKK*wwwK", "wwwbwwwww", "ww*wwbww", "wwwwwwwwK", "wwwwwwwK", "wwwKbbbKw", "bbbb*b*K", "KKKb*KKKb"], "label": "Save the whites", "drags": [{ "x": 6, "y": 7, "ways": [3] }], "steps": [{ "name": "the drop", "goal": "fill column 8's gap: its white further from the fire" }] }, { "cols": ["wwbKKwbw", "bwKbbKKww", "wKK*wwwK", "wwwbwwwww", "ww*wwbww", "wwwwwwwwK", "wwwwwwww", "wwwKbbbKK", "bbbb*b*K", "KKKb*KKKb"], "label": "The crawl", "drags": [{ "x": 0, "y": 4, "ways": [0, 3] }, { "x": 0, "y": 4, "ways": [0, 3, 0, 0, 0, 0, 0] }, { "x": 1, "y": 4, "ways": [3, 3, 2, 3, 3, 3, 3] }], "steps": [{ "name": "the ladder, then the drop", "goal": "free the stuck brown at column 2, row 5" }, { "name": "the lift, then the ladder, then the lift", "goal": "fill column 8's gap: its white out left before it burns" }, { "name": "the drop", "goal": "fill column 7's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P21", moment: "read", level: "cc8", seed: 5, ms: 444600, stage: "junk", burns: 0, chain: 0, timeLeft: 14400, batch: "challenge", like: "P5",
        what: "Read as P5 is: 4 whites trapped near the fire (column 8, row 2, column 8, row 3, column 8, row 4 and 1 more), the worst first. 444.6 s in, 14.4 s on the furnace.",
        cols: ["KbbKwbbw", "KbwwKwwKw", "wwKwwwbw", "wwwwKwwww", "wwwwwwww", "bwwKwwwww", "bwwKwKww", "bwww*KKKb", "*bwKKKKb", "KbKKKKKbb"],
        bot: { "phase": "block", "kind": "move", "technique": "path", "label": "Bring a piece round", "reason": "the white at column 9, row 3 is stuck: bring the brown at column 3, row 7 round, looping, to take its place, and it's out left", "drags": [{ "x": 2, "y": 6, "ways": [0, 0, 0, 0, 1, 1, 1, 0, 3, 3, 0, 0] }], "state": "atRisk", "tactic": "fillGaps", "read": "a white by the fire with its column burning soon (column 9, row 3): junk into their places, the quickest first", "steps": [{ "name": "the lift, then the ladder, then the lift", "goal": "fill column 9's gap: column 9's white in row 3 out left", "kind": "fill" }] },
        plan: { "aim": "fill column 9's gap: column 9's white in row 3 out left", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["KbbKwbbw", "KbwwKwwKw", "wwKwwwbw", "wwwwKwwww", "wwwwwwww", "bwwKwwwww", "bwwKwKww", "bwww*KKKb", "*bwKKKKb", "KbKKKKKbb"], "label": "Bring a piece round", "drags": [{ "x": 2, "y": 6, "ways": [0, 0, 0, 0, 1, 1, 1, 0, 3, 3, 0, 0] }], "steps": [{ "name": "the lift, then the ladder, then the lift", "goal": "fill column 9's gap: column 9's white in row 3 out left" }] }, { "cols": ["KbbKwbbw", "KbwwKwwKw", "wwKwwwww", "wwwwKwwww", "wwKwwwww", "bwwKwwwww", "bwwwwKww", "bwww*KKKb", "*bbKKKKb", "KbKKKKKbb"], "label": "The sweep", "drags": [{ "x": 0, "y": 2, "ways": [0, 3, 0, 3, 0, 0, 0] }], "steps": [{ "name": "the lift, then the ladder, then the lift, then the ladder, then the lift", "goal": "fill column 8's gap: its white out left before it burns" }] }, { "cols": ["KbwKwbbw", "KbKwKwwKw", "wwwwwwww", "wwKwKwwww", "wwwwwwww", "bwwKwwwww", "bwwwwKww", "bbww*KKKb", "*bbKKKKb", "KbKKKKKbb"], "label": "The diamond", "drags": [{ "x": 1, "y": 4, "ways": [3, 3] }, { "x": 0, "y": 5, "ways": [0, 0, 3, 0, 0, 0, 0, 3, 3] }], "steps": [{ "name": "the drop", "goal": "make way for drag 2" }, { "name": "the lift, then the ladder, then the lift, then the ladder", "goal": "fill column 8's gap: its white out left before it burns" }] }, { "cols": ["KbwKwwbw", "KbKwwwwKw", "wwwwKwww", "wwKwKwwww", "wwwwwwww", "bwwKwwwww", "bwwwwKww", "bbwK*KKKb", "*bbKKKKb", "KbKKbKKbb"], "label": "The sweep", "drags": [{ "x": 1, "y": 2, "ways": [3, 3, 3, 3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 7's gap: its white out left before it burns" }] }, { "cols": ["KbwKwwbw", "KbwwwwwKw", "wwwwKwww", "wwKwKwwww", "wwwwwwww", "bwwKwwwww", "bwwwKKww", "bbwK*KKKb", "*bbKKKKb", "KbKKbKKbb"], "label": "The sweep", "drags": [{ "x": 1, "y": 0, "ways": [3, 3, 3, 3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 7's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P22", moment: "read", level: "cc5", seed: 9, ms: 398750, stage: "junk", burns: 0, chain: 0, timeLeft: 14350, batch: "challenge", like: "P6",
        what: "Read as P6 is: 2 whites trapped near the fire (column 9, row 5, column 8, row 1), the worst first. 398.8 s in, 14.3 s on the furnace.",
        cols: ["bKKbbb*wK", "wbbwwbww", "wbwwwwwKb", "wwwwwwKb", "bwwwwwwKb", "bwwwww**", "wwwwwwwKw", "wKbbwKKw", "bbwKwKK*b", "KKKbbKKK"],
        bot: { "phase": "block", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "fill the gaps: junk raced into a white's place (column 9, row 3, column 9, row 5), and it's out left", "drags": [{ "x": 7, "y": 2, "ways": [0] }], "state": "atRisk", "tactic": "fillGaps", "read": "2 whites by the fire with their columns burning soon (column 9, row 3, column 9, row 5): junk into their places, the quickest first; the junk the wrong way up (17 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 3 out left", "kind": "fill" }] },
        plan: { "aim": "fill column 9's gap: column 9's white in row 3 out left", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["bKKbbb*wK", "wbbwwbww", "wbwwwwwKb", "wwwwwwKb", "bwwwwwwKb", "bwwwww**", "wwwwwwwKw", "wKbbwKKw", "bbwKwKK*b", "KKKbbKKK"], "label": "Save the whites", "drags": [{ "x": 7, "y": 2, "ways": [0] }], "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 3 out left" }] }, { "cols": ["bKKbbb*wK", "wbbwwbww", "wbwwwwwKb", "wwwwwwKb", "bwwwwwwKb", "bwwwww**", "wwwwwwwKw", "wKwbwKKw", "bbbKwKK*b", "KKKbbKKK"], "label": "Save the whites", "drags": [{ "x": 9, "y": 4, "ways": [2, 2, 1, 0, 0] }], "steps": [{ "name": "the ladder, then the lift", "goal": "fill column 9's gap: column 9's white in row 5 out left" }] }, { "cols": ["bKKbbb*wK", "wbbwwbww", "wbwwwwwKb", "wwwwwwKb", "bwwwwwwKb", "bwwwww**", "wwwwwwwKw", "wKwbwwKw", "bbbKbKK*b", "KKKbKKKK"], "label": "The sweep", "drags": [{ "x": 0, "y": 4, "ways": [0, 0, 0, 0, 0, 0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 8's gap: its white out left before it burns" }] }, { "cols": ["bKKbwb*wK", "wbbwwbww", "wbwwwwwKb", "wwwwwwKb", "bwwwwwwKb", "bwwwww**", "wwwwwwwKw", "bKwbwwKw", "bbbKbKK*b", "KKKbKKKK"], "label": "Save the whites", "drags": [{ "x": 6, "y": 7, "ways": [3] }], "steps": [{ "name": "the drop", "goal": "fill column 8's gap: its white further from the fire" }] }, { "cols": ["bKKbwb*wK", "wbbwwbww", "wbwwwwwKb", "wwwwwwKb", "bwwwwwwKb", "bwwwww**", "wwwwwwwww", "bKwbwwKK", "bbbKbKK*b", "KKKbKKKK"], "label": "The sweep", "drags": [{ "x": 0, "y": 2, "ways": [0, 3, 3, 3, 3, 3, 3, 0, 0] }], "steps": [{ "name": "the ladder, then the drop, then the ladder", "goal": "fill column 8's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P23", moment: "read", level: "cc2", seed: 9, ms: 128500, stage: "junk", burns: 0, chain: 0, timeLeft: 9200, batch: "challenge", like: "P3",
        what: "Read as P3 is: a white by the fire free to go, with time in hand (column 9, row 7): the quick sorting moves, blacks down and browns up, fill their places. 128.5 s in, 9.2 s on the furnace.",
        cols: ["wKwbbwwKK", "bbwbbKbK", "KbKbbKKKb", "bKKKbKKb", "bbKbKKKKK", "bbwbbKKK", "bbwwwKKwK", "bbwwKKwK", "bKbbKbwKb", "bbbKKb*K"],
        bot: { "phase": "fire", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "quick sorting: the black at column 8, row 6 down into a white's place by the fire, and it's out left", "drags": [{ "x": 7, "y": 5, "ways": [3] }], "state": "atRisk", "tactic": "quickSort", "read": "a white by the fire free to go, with time in hand (column 9, row 7): the quick sorting moves, blacks down and browns up, fill their places; the junk the wrong way up (33 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the drop", "goal": "fill column 9's gap: its white further from the fire", "kind": "fill" }] },
        plan: { "aim": "fill column 9's gap: its white further from the fire", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["wKwbbwwKK", "bbwbbKbK", "KbKbbKKKb", "bKKKbKKb", "bbKbKKKKK", "bbwbbKKK", "bbwwwKKwK", "bbwwKKwK", "bKbbKbwKb", "bbbKKb*K"], "label": "Save the whites", "drags": [{ "x": 7, "y": 5, "ways": [3] }], "steps": [{ "name": "the drop", "goal": "fill column 9's gap: its white further from the fire" }] }, { "cols": ["wKwbbwwKK", "bbwbbKbK", "KbKbbKKKb", "bKKKbKKb", "bbKbKKKKK", "bbwbbKKK", "bbwwwKKwK", "bbwwKwwK", "bKbbKbKKb", "bbbKKb*K"], "label": "The diamond", "drags": [{ "x": 0, "y": 3, "ways": [0] }], "steps": [{ "name": "the lift", "goal": "carry the brown over to the colour in column 2" }] }, { "cols": ["wKwwbwwKK", "bbbbbKbK", "KbKbbKKKb", "bKKKbKKb", "bbKbKKKKK", "bbwbbKKK", "bbwwwKKwK", "bbwwKwwK", "bKbbKbKKb", "bbbKKb*K"], "label": "The sweep", "drags": [{ "x": 4, "y": 2, "ways": [3, 3, 3, 0, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 8's gap: its white out left before it burns" }] }, { "cols": ["wKwwbwwKK", "bbbbbKbK", "KbKbbKKKb", "bKKKbKKb", "bbwbKKKKK", "bbwbbKKK", "bbwwwKKwK", "bbwbKwwK", "bKbbKbKKb", "bbKKKb*K"], "label": "The sweep", "drags": [{ "x": 7, "y": 6, "ways": [1, 1, 1] }], "steps": [{ "name": "the climb", "goal": "get column 8's white in row 7 out before it burns" }] }, { "cols": ["wKwwbwwKK", "bbbbbKbK", "KbKbbKKKb", "bKKKbKKb", "bbwbKwKKK", "bbwbbKKK", "bbwwwKKwK", "bbwbKwKK", "bKbbKbKKb", "bbKKKb*K"], "label": "The sweep", "drags": [{ "x": 6, "y": 4, "ways": [2, 1, 1] }], "steps": [{ "name": "the weave", "goal": "get column 7's white in row 5 out before it burns" }] }] },
    },
    {
        id: "P24", moment: "read", level: "cc8", seed: 6, ms: 270750, stage: "junk", burns: 0, chain: 0, timeLeft: 4650, batch: "challenge", like: "P3",
        what: "Read as P3 is: a white by the fire free to go, with time in hand (column 9, row 7): the quick sorting moves, blacks down and browns up, fill their places. 270.8 s in, 4.7 s on the furnace.",
        cols: ["bbwwKbbb", "KKbKKKKww", "bbKKb*bw", "bbKbbbKbb", "bbbKKbbw", "wbwbKKK*K", "Kwwbwwwb", "bbwwbwKb*", "bbbKbKwK", "bbKKKKKKK"],
        bot: { "phase": "fire", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "quick sorting: the black at column 8, row 7 down into a white's place by the fire, and it's out left", "drags": [{ "x": 7, "y": 6, "ways": [3] }], "state": "atRisk", "tactic": "quickSort", "read": "a white by the fire free to go, with time in hand (column 9, row 7): the quick sorting moves, blacks down and browns up, fill their places", "steps": [{ "name": "the drop", "goal": "fill column 9's gap: its white further from the fire", "kind": "fill" }] },
        plan: { "aim": "fill column 9's gap: its white further from the fire", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["bbwwKbbb", "KKbKKKKww", "bbKKb*bw", "bbKbbbKbb", "bbbKKbbw", "wbwbKKK*K", "Kwwbwwwb", "bbwwbwKb*", "bbbKbKwK", "bbKKKKKKK"], "label": "Save the whites", "drags": [{ "x": 7, "y": 6, "ways": [3] }], "steps": [{ "name": "the drop", "goal": "fill column 9's gap: its white further from the fire" }] }, { "cols": ["bbwwKbbb", "KKbKKKKww", "bbKKb*bw", "bbKbbbKbb", "bbbKKbbw", "wbwbKKK*K", "Kwwbwwwb", "bbwwbwwb*", "bbbKbKKK", "bbKKKKKKK"], "label": "The sweep", "drags": [{ "x": 5, "y": 4, "ways": [3, 3, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 8's gap: its white further from the fire" }] }, { "cols": ["bbwwKbbb", "KKbKKKKww", "bbKKb*bw", "bbKbbbKbb", "bbbKKbbw", "wbwbwKK*K", "Kwwbwwwb", "bbwwbbwb*", "bbbKKKKK", "bbKKKKKKK"], "label": "The sweep", "drags": [{ "x": 3, "y": 2, "ways": [0, 3, 3, 3, 0] }], "steps": [{ "name": "the ladder, then the drop, then the ladder", "goal": "fill column 8's gap: its white out left before it burns" }] }, { "cols": ["bbwwKbbb", "KKbKKKKww", "bbKKb*bw", "bbbbbbKbb", "bwbKKbbw", "wbwbwKK*K", "Kwwbwwwb", "bbwbbbwb*", "bbKKKKKK", "bbKKKKKKK"], "label": "Save the whites", "drags": [{ "x": 5, "y": 5, "ways": [3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 8's gap: its white further from the fire" }] }, { "cols": ["bbwwKbbb", "KKbKKKKww", "bbKKb*bw", "bbbbbbKbb", "bwbKKbbw", "wbwbwwK*K", "Kwwbwwwb", "bbwbbbKb*", "bbKKKKKK", "bbKKKKKKK"], "label": "The sweep", "drags": [{ "x": 5, "y": 3, "ways": [0, 0, 3, 3] }], "steps": [{ "name": "the lift, then the ladder", "goal": "fill column 8's gap: its white further from the fire" }] }] },
    },
    {
        id: "P25", moment: "read", level: "cc5", seed: 5, ms: 16300, stage: "junk", burns: 0, chain: 0, timeLeft: 14300, batch: "challenge", like: "P4",
        what: "Read as P4 is: 2 whites by the fire with their columns burning soon (column 9, row 1, column 9, row 3): junk into their places, the quickest first. 16.3 s in, 14.3 s on the furnace.",
        cols: ["KKwbwwbb", "bbbbKKbKK", "bwwwwKbK", "bbwbwww*b", "bbwwwwww", "KKwwbbwwK", "K*bKwww*", "KKbbbbKKw", "wKwKKKKK", "KKbKKKKbK"],
        bot: { "phase": "fire", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "fill the gaps: junk raced into a white's place (column 9, row 1, column 9, row 3), and it's out left", "drags": [{ "x": 8, "y": 3, "ways": [1, 1, 0, 3] }], "state": "atRisk", "tactic": "fillGaps", "read": "2 whites by the fire with their columns burning soon (column 9, row 1, column 9, row 3): junk into their places, the quickest first", "steps": [{ "name": "the ladder, then the drop", "goal": "fill column 9's gap: column 9's white in row 3 out left", "kind": "fill" }] },
        plan: { "aim": "fill column 9's gap: column 9's white in row 3 out left", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["KKwbwwbb", "bbbbKKbKK", "bwwwwKbK", "bbwbwww*b", "bbwwwwww", "KKwwbbwwK", "K*bKwww*", "KKbbbbKKw", "wKwKKKKK", "KKbKKKKbK"], "label": "Save the whites", "drags": [{ "x": 8, "y": 3, "ways": [1, 1, 0, 3] }], "steps": [{ "name": "the ladder, then the drop", "goal": "fill column 9's gap: column 9's white in row 3 out left" }] }, { "cols": ["KKwbwwbb", "bbbbKKbKK", "bwwwwKbK", "bbwbwww*b", "bbwwwwww", "KKwwbbwwK", "K*bKwww*", "KKwbbbKKw", "wKKbKKKK", "KKbKKKKbK"], "label": "Save the whites", "drags": [{ "x": 7, "y": 0, "ways": [3] }], "steps": [{ "name": "the drop", "goal": "fill column 9's gap: its white further from the fire" }] }, { "cols": ["KKwbwwbb", "bbbbKKbKK", "bwwwwKbK", "bbwbwww*b", "bbwwwwww", "KKwwbbwwK", "K*bKwww*", "wKwbbbKKw", "KKKbKKKK", "KKbKKKKbK"], "label": "Save the whites", "drags": [{ "x": 8, "y": 7, "ways": [2] }], "steps": [{ "name": "the drop", "goal": "free column 8's bottom white" }] }, { "cols": ["KKwbwwbb", "bbbbKKbKK", "bwwwwKbK", "bbwbwww*b", "bbwwwwww", "KKwwbbwwK", "K*bKwww*", "wKwbbbKKK", "KKKbKKKw", "KKbKKKKbK"], "label": "Save the whites", "drags": [{ "x": 7, "y": 7, "ways": [3, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 9's gap: its white further from the fire" }] }, { "cols": ["KKwbwwbb", "bbbbKKbKK", "bwwwwKbK", "bbwbwww*b", "bbwwwwww", "KKwwbbwwK", "K*bKwww*", "wKwbbbKwK", "KKKbKKKb", "KKbKKKKKK"], "label": "The diamond", "drags": [{ "x": 1, "y": 4, "ways": [3, 3, 3, 0] }, { "x": 2, "y": 5, "ways": [3, 0, 3, 3, 3] }], "steps": [{ "name": "the drop, then the ladder", "goal": "carry the black over to the colour in column 6" }, { "name": "the drop, then the ladder, then the drop", "goal": "fill column 8's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P26", moment: "read", level: "cc8", seed: 9, ms: 449350, stage: "junk", burns: 0, chain: 0, timeLeft: 9650, batch: "challenge", like: "P4",
        what: "Read as P4 is: a white in the furnace's column: junk into its place first. 449.4 s in, 9.7 s on the furnace.",
        cols: ["wbwbbbKb", "KKwKbwwK*", "bbwwwwKb", "bwwwww*wb", "bbwKwwww", "wwKKbbwKK", "wwwwKwKb", "KwKKKKwKb", "bbwwKb**", "bbbKKKbbw"],
        bot: { "phase": "fire", "kind": "move", "technique": "sweep", "label": "The sweep", "reason": "go, go, go: quick sorting: the brown at column 6, row 5 up into a white's place by the fire, and it's out left", "drags": [{ "x": 5, "y": 4, "ways": [0, 3, 0] }], "state": "atRisk", "tactic": "quickSort", "read": "column 10's white past saving, given up as junk; 2 whites by the fire free to go, with time in hand (column 9, row 3, column 9, row 4): the quick sorting moves, blacks down and browns up, fill their places", "steps": [{ "name": "the lift, then the ladder, then the lift", "goal": "fill column 9's gap: its white further from the fire", "kind": "fill" }] },
        plan: { "aim": "fill column 9's gap: its white further from the fire", "reached": 1, "through": true, "ends": "it waits", "moves": [{ "cols": ["wbwbbbKb", "KKwKbwwK*", "bbwwwwKb", "bwwwww*wb", "bbwKwwww", "wwKKbbwKK", "wwwwKwKb", "KwKKKKwKb", "bbwwKb**", "bbbKKKbbw"], "label": "The sweep", "drags": [{ "x": 5, "y": 4, "ways": [0, 3, 0] }], "steps": [{ "name": "the lift, then the ladder, then the lift", "goal": "fill column 9's gap: its white further from the fire" }] }] },
    },
    {
        id: "P27", moment: "read", level: "cc8", seed: 9, ms: 162100, stage: "junk", burns: 0, chain: 0, timeLeft: 6200, batch: "challenge", like: "P7",
        what: "Read as P7 is: 5 whites still in column 9, 22 s from the fire, and junk free for 1 column: fill its gaps however you can, the quickest first. 162.1 s in, 6.2 s on the furnace.",
        cols: ["wbbwKbKKK", "KwwwKwwb", "wwwbKbwKK", "wbwbwwKK", "wbwwwwwKw", "bwwwwwKK", "wwwwwwwww", "wwwwwwwK", "bwwwwKwKK", "bbbbbKKK"],
        bot: { "phase": "block", "kind": "move", "technique": "store", "label": "Hoist", "reason": "hoist: the brown at column 4, row 4 sunk through the blacks, lifting them, blacks and browns brought together", "drags": [{ "x": 3, "y": 3, "ways": [2, 2] }], "state": "damageControl", "tactic": "fillGaps", "read": "5 whites still in column 9, 22 s from the fire, and junk free for 1 column: fill its gaps however you can, the quickest first; the junk the wrong way up (19 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the ladder", "goal": "hoist: the brown sunk through the blacks, lifting them, blacks and browns together", "kind": "hoist" }] },
        plan: { "aim": "hoist: the brown sunk through the blacks, lifting them, blacks and browns together", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["wbbwKbKKK", "KwwwKwwb", "wwwbKbwKK", "wbwbwwKK", "wbwwwwwKw", "bwwwwwKK", "wwwwwwwww", "wwwwwwwK", "bwwwwKwKK", "bbbbbKKK"], "label": "Hoist", "drags": [{ "x": 3, "y": 3, "ways": [2, 2] }], "steps": [{ "name": "the ladder", "goal": "hoist: the brown sunk through the blacks, lifting them, blacks and browns together" }] }, { "cols": ["wbbwKbKKK", "Kwwwbwwb", "wwwbKbwKK", "wbwKwwKK", "wbwwwwwKw", "bwwwwwKK", "wwwwwwwww", "wwwwwwwK", "bwwwwKwKK", "bbbbbKKK"], "label": "Hoist", "drags": [{ "x": 2, "y": 3, "ways": [3, 2] }], "steps": [{ "name": "the ladder", "goal": "hoist: the brown sunk through the blacks, lifting them, blacks and browns together" }] }, { "cols": ["wbbwKbKKK", "Kwwwbwwb", "wwwKbbwKK", "wbwKwwKK", "wbwwwwwKw", "bwwwwwKK", "wwwwwwwww", "wwwwwwwK", "bwwwwKwKK", "bbbbbKKK"], "label": "Hoist", "drags": [{ "x": 0, "y": 8, "ways": [0] }], "steps": [{ "name": "the ladder", "goal": "carry the black over to the colour in column 2" }] }, { "cols": ["wbbwKbKKb", "KwwwbwwK", "wwwKbbwKK", "wbwKwwKK", "wbwwwwwKw", "bwwwwwKK", "wwwwwwwww", "wwwwwwwK", "bwwwwKwKK", "bbbbbKKK"], "label": "Hoist", "drags": [{ "x": 1, "y": 0, "ways": [3, 2, 3, 0, 0, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "hoist: the black lifted up through the browns, blacks and browns together" }] }, { "cols": ["wbbwKbKKb", "wwwwbwwK", "wwbKbbwKK", "wbwKwwKK", "wbwwwwwKw", "KwwwwwKK", "wwwwwwwww", "wwwwwwwK", "bwwwwKwKK", "bbbbbKKK"], "label": "Hoist", "drags": [{ "x": 2, "y": 4, "ways": [1, 2] }], "steps": [{ "name": "the lift, then the ladder", "goal": "hoist: the brown sunk through the blacks, lifting them, blacks and browns together" }] }] },
    },
    {
        id: "P28", moment: "read", level: "cc8", seed: 7, ms: 222150, stage: "junk", burns: 0, chain: 0, timeLeft: 7350, batch: "challenge", like: "P7",
        what: "Read as P7 is: 4 whites still in column 9, 23 s from the fire, and junk free for 1 column: fill its gaps however you can, the quickest first. 222.2 s in, 7.3 s on the furnace.",
        cols: ["KwKwwwKKw", "ww*Kwbwb", "wbw*Kbwww", "bbwwwwwK", "bxwwwwwKw", "wwwwwwwK", "wwwwww*ww", "bwwwwKww", "*bwbwwwKK", "bbbbbbbK"],
        bot: { "phase": "block", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "fill the gaps: junk raced into a white's place (column 9, row 6, column 9, row 3, column 9, row 5), and it's out left", "drags": [{ "x": 7, "y": 5, "ways": [3] }], "state": "damageControl", "tactic": "fillGaps", "read": "4 whites still in column 9, 23 s from the fire, and junk free for 1 column: fill its gaps however you can, the quickest first; the junk the wrong way up (14 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the drop", "goal": "fill column 9's gap: column 9's white in row 7 out left", "kind": "fill" }] },
        plan: { "aim": "fill column 9's gap: column 9's white in row 7 out left", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["KwKwwwKKw", "ww*Kwbwb", "wbw*Kbwww", "bbwwwwwK", "bxwwwwwKw", "wwwwwwwK", "wwwwww*ww", "bwwwwKww", "*bwbwwwKK", "bbbbbbbK"], "label": "Save the whites", "drags": [{ "x": 7, "y": 5, "ways": [3] }], "steps": [{ "name": "the drop", "goal": "fill column 9's gap: column 9's white in row 7 out left" }] }, { "cols": ["KwKwwwKKw", "ww*Kwbwb", "wbw*Kbwww", "bbwwwwwK", "bxwwwwwKw", "wwwwwwwK", "wwwwww*ww", "bwwwwwww", "*bwbwwKKK", "bbbbbbbK"], "label": "The sweep", "drags": [{ "x": 2, "y": 5, "ways": [0, 0, 0, 0, 0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 3 out left" }] }, { "cols": ["KwKwwwKKw", "ww*Kwbwb", "wbw*Kwwww", "bbwwwwwK", "bxwwwwwKw", "wwwwwwwK", "wwwwww*ww", "bwwwwwww", "*bbbwwKKK", "bbbbbbbK"], "label": "The sweep", "drags": [{ "x": 1, "y": 7, "ways": [0, 0, 0, 0, 0, 0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 9's gap: column 9's white in row 5 out left" }] }, { "cols": ["KwKwwwKKw", "ww*Kwbww", "wbw*Kwwww", "bbwwwwwK", "bxwwwwwKw", "wwwwwwwK", "wwwwww*ww", "bwwwwwww", "*bbbbwKKK", "bbbbbbbK"], "label": "Turn the right side over", "drags": [{ "x": 9, "y": 6, "ways": [2, 3, 2] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 9, row 9, in for the black there" }] }, { "cols": ["KwKwwwKKw", "ww*Kwbww", "wbw*Kwwww", "bbwwwwwK", "bxwwwwwKw", "wwwwwwwK", "wwwwww*ww", "bwwwwwww", "*bbbbwKKb", "bbbbbbKK"], "label": "Turn the right side over", "drags": [{ "x": 9, "y": 5, "ways": [2, 3, 2] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 9, row 8, in for the black there" }] }] },
    },
    {
        id: "P29", moment: "read", level: "cc5", seed: 4, ms: 427450, stage: "junk", burns: 0, chain: 0, timeLeft: 950, batch: "challenge", like: "P8",
        what: "Read as P8 is: columns 9 and 10 aren't sorted blacks over browns, and column 10 goes in 0.9 s: sort the ladder before it's lost. 427.4 s in, 0.9 s on the furnace.",
        cols: ["bK*wwwbw", "wbbwwbKw*", "wbwwwwww", "bwww*wwwK", "wwwwww*w", "wwbwwwwww", "www*wwK*", "bbbKKbKKb", "KKbbbKKb", "bbbbKbKbb"],
        bot: { "phase": "block", "kind": "move", "technique": "sweep", "label": "The sweep", "reason": "go, go, go: sort the ladder: a brown brought down to the V's tip, column 7, row 7, swapped in for the black there", "drags": [{ "x": 9, "y": 5, "ways": [2, 2, 2] }], "state": "atRisk", "tactic": "sortLadder", "read": "columns 9 and 10 aren't sorted blacks over browns, and column 10 goes in 0.9 s: sort the ladder before it's lost; the junk the wrong way up (9 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 7, row 7, in for the black there", "kind": "tail" }] },
        plan: { "aim": "the brown down to the V's tip, column 7, row 7, in for the black there", "reached": 1, "through": true, "ends": "the furnace takes the next column", "moves": [{ "cols": ["bK*wwwbw", "wbbwwbKw*", "wbwwwwww", "bwww*wwwK", "wwwwww*w", "wwbwwwwww", "www*wwK*", "bbbKKbKKb", "KKbbbKKb", "bbbbKbKbb"], "label": "The sweep", "drags": [{ "x": 9, "y": 5, "ways": [2, 2, 2] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 7, row 7, in for the black there" }] }, { "cols": ["bK*wwwbw", "wbbwwbKw*", "wbwwwwww", "bwww*wwwK", "wwwwww*w", "wwbwwwwww", "www*wwb*", "bbbKKbKKb", "KKbbbKKb", "bbbbKKKbb"], "label": "Turn the right side over", "drags": [{ "x": 6, "y": 6, "ways": [3] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 8, row 8, in for the black there" }] }] },
    },
    {
        id: "P30", moment: "read", level: "cc5", seed: 6, ms: 347050, stage: "junk", burns: 0, chain: 0, timeLeft: 4850, batch: "challenge", like: "P9",
        what: "Read as P9 is: the V's tail unsorted (column 6, row 7): browns down through the blacks, so the next sweep runs through. 347.1 s in, 4.8 s on the furnace.",
        cols: ["wwKwwbwKK", "wwbKwwww", "b**KwKwwb", "wwwwwwbK", "wwwwwwwww", "wwwwwbbw", "wwwwKwwKw", "bbKbK*Kb", "bbKbbKKKb", "KbbbKbKK"],
        bot: { "phase": "block", "kind": "move", "technique": "turnOver", "label": "Turn the right side over", "reason": "sort the tail: a brown brought down to the V's tip, column 7, row 8, swapped in for the black there", "drags": [{ "x": 5, "y": 6, "ways": [3] }], "state": "healthy", "tactic": "sortTail", "read": "the V's tail unsorted (column 6, row 7): browns down through the blacks, so the next sweep runs through", "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 7, row 8, in for the black there", "kind": "tail" }] },
        plan: { "aim": "the brown down to the V's tip, column 7, row 8, in for the black there", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["wwKwwbwKK", "wwbKwwww", "b**KwKwwb", "wwwwwwbK", "wwwwwwwww", "wwwwwbbw", "wwwwKwwKw", "bbKbK*Kb", "bbKbbKKKb", "KbbbKbKK"], "label": "Turn the right side over", "drags": [{ "x": 5, "y": 6, "ways": [3] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 7, row 8, in for the black there" }] }, { "cols": ["wwKwwbwKK", "wwbKwwww", "b**KwKwwb", "wwwwwwbK", "wwwwwwwww", "wwwwwbKw", "wwwwKwwbw", "bbKbK*Kb", "bbKbbKKKb", "KbbbKbKK"], "label": "Turn the right side over", "drags": [{ "x": 3, "y": 6, "ways": [0, 3] }], "steps": [{ "name": "the lift, then the ladder", "goal": "the brown down to the V's tip, column 6, row 7, in for the black there" }] }, { "cols": ["wwKwwbwKK", "wwbKwwww", "b**KwKwwb", "wwwwwwwK", "wwwwwwKww", "wwwwwbbw", "wwwwKwwbw", "bbKbK*Kb", "bbKbbKKKb", "KbbbKbKK"], "label": "Turn the right side over", "drags": [{ "x": 5, "y": 5, "ways": [2] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 5, row 7, in for the black there" }] }, { "cols": ["wwKwwbwKK", "wwbKwwww", "b**KwKwwb", "wwwwwwwK", "wwwwwwbww", "wwwwwKbw", "wwwwKwwbw", "bbKbK*Kb", "bbKbbKKKb", "KbbbKbKK"], "label": "Turn the right side over", "drags": [{ "x": 9, "y": 5, "ways": [2, 2] }], "steps": [{ "name": "the ladder", "goal": "the brown down to the V's tip, column 8, row 7, in for the black there" }] }, { "cols": ["wwKwwbwKK", "wwbKwwww", "b**KwKwwb", "wwwwwwwK", "wwwwwwbww", "wwwwwKbw", "wwwwKwwbw", "bbKbK*bb", "bbKbbKKKb", "KbbbKKKK"], "label": "Bring a piece round", "drags": [{ "x": 9, "y": 1, "ways": [2, 2] }], "steps": [{ "name": "the ladder", "goal": "sort columns 9 and 10, blacks over browns, before column 10 goes" }] }] },
    },
    {
        id: "P31", moment: "leadup", level: "cc3", seed: 11, ms: 9600, stage: "junk", burns: 0, chain: 0, timeLeft: 5700, batch: "leadup", shut: [[6, 1]],
        what: "9.6 s in, 5.7 s on the furnace: the white at column 7, row 2 (ringed) is free enough here; after the bot's move it is trapped (a long, complicated way out, or none).",
        cols: ["bKbwbbwKK", "KbbbbKwK", "wKKbbbb*b", "bwwwwwbb", "wKwbKKwbK", "wwwbKKw*", "bwKwbbKwK", "KwbKKKbK", "bKKKbbKKK", "KbKKKKKK"],
        bot: { "phase": "fire", "kind": "move", "technique": "diamond", "label": "The diamond", "reason": "bring in another piece: drag the brown at column 3, row 4 into the gap, then the brown at column 5, row 4 over past it", "drags": [{ "x": 2, "y": 3, "ways": [0, 0, 0, 3, 0] }, { "x": 4, "y": 3, "ways": [0, 0] }], "state": "atRisk", "tactic": "quickSort", "read": "the whites flagged (column 8, row 2) can wait: quick, simple moves", "steps": [{ "name": "the lift, then the ladder, then the lift", "goal": "fill column 8's gap: its white out left before it burns", "kind": "fill" }, { "name": "the lift", "goal": "fill column 7's gap: its white out left before it burns", "kind": "fill" }] },
        plan: { "aim": "fill column 7's gap: its white out left before it burns", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["bKbwbbwKK", "KbbbbKwK", "wKKbbbb*b", "bwwwwwbb", "wKwbKKwbK", "wwwbKKw*", "bwKwbbKwK", "KwbKKKbK", "bKKKbbKKK", "KbKKKKKK"], "label": "The diamond", "drags": [{ "x": 2, "y": 3, "ways": [0, 0, 0, 3, 0] }, { "x": 4, "y": 3, "ways": [0, 0] }], "steps": [{ "name": "the lift, then the ladder, then the lift", "goal": "fill column 8's gap: its white out left before it burns" }, { "name": "the lift", "goal": "fill column 7's gap: its white out left before it burns" }] }, { "cols": ["bKbwbbwKK", "KbbbbKwK", "wKKwbbb*b", "bwwwwwbb", "wKwwKKwbK", "wKwbKKw*", "bwbwbbKwK", "KbbKKKbK", "bKKKbbKKK", "KbKKKKKK"], "label": "The sweep", "drags": [{ "x": 2, "y": 1, "ways": [3, 3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 6's gap: its white out left before it burns" }] }, { "cols": ["bKbwbbwKK", "KbbbbKwK", "wwKwbbb*b", "bwwwwwbb", "wKwwKKwbK", "wKKbKKw*", "bwbwbbKwK", "KbbKKKbK", "bKKKbbKKK", "KbKKKKKK"], "label": "The sweep", "drags": [{ "x": 1, "y": 5, "ways": [0, 3, 3, 3, 3, 0] }], "steps": [{ "name": "the ladder, then the drop, then the ladder", "goal": "fill column 7's gap: its white out left before it burns" }] }, { "cols": ["bKbwbbwKK", "KbbbbbwK", "wwKwbwb*b", "bwwwwwbb", "wKwwKKwbK", "wKKbKKw*", "bwbwbbKbK", "KbbKKKKK", "bKKKbbKKK", "KbKKKKKK"], "label": "The diamond", "drags": [{ "x": 2, "y": 2, "ways": [3, 3] }], "steps": [{ "name": "the drop", "goal": "carry the black over to the colour in column 5" }] }, { "cols": ["bKbwbbwKK", "KbbbbbwK", "wwwwbwb*b", "bwwwwwbb", "wKwKKKwbK", "wKKbKKw*", "bwbwbbKbK", "KbbKKKKK", "bKKKbbKKK", "KbKKKKKK"], "label": "Save the whites", "drags": [{ "x": 6, "y": 3, "ways": [2] }], "steps": [{ "name": "the sink", "goal": "get column 7's white in row 4 further from the fire" }] }] },
    },
    {
        id: "P32", moment: "leadup", level: "cc5", seed: 15, ms: 10050, stage: "junk", burns: 0, chain: 0, timeLeft: 5250, batch: "leadup", shut: [[4, 3]],
        what: "10.1 s in, 5.3 s on the furnace: the white at column 5, row 4 (ringed) is free enough here; after the bot's move it is trapped (a long, complicated way out, or none).",
        cols: ["wbwKKKbbK", "bb**wwww", "KbKwwwwww", "wwwKbKww", "KbwwwwwKw", "wwwKKwww", "KbwKKbwwb", "KbKbbbbK", "bKKbKbKKb", "KKKKbKKK"],
        bot: { "phase": "fill", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "a white stuck in a column to burn: set the black at column 3, row 3 on its diagonal, then sweep it down onto the white", "drags": [{ "x": 2, "y": 2, "ways": [1, 0, 3, 3, 3] }], "state": "healthy", "tactic": "quickSort", "read": "nothing at risk: quick, simple moves, blacks down and browns up", "steps": [{ "name": "the ladder, then the drop", "goal": "fill column 6's gap: its white out left before it burns", "kind": "fill" }] },
        plan: { "aim": "fill column 6's gap: its white out left before it burns", "reached": 1, "through": true, "ends": "the furnace takes the next column", "moves": [{ "cols": ["wbwKKKbbK", "bb**wwww", "KbKwwwwww", "wwwKbKww", "KbwwwwwKw", "wwwKKwww", "KbwKKbwwb", "KbKbbbbK", "bKKbKbKKb", "KKKKbKKK"], "label": "Save the whites", "drags": [{ "x": 2, "y": 2, "ways": [1, 0, 3, 3, 3] }], "steps": [{ "name": "the ladder, then the drop", "goal": "fill column 6's gap: its white out left before it burns" }] }, { "cols": ["wbwKKKbbK", "bb**wwww", "Kwbwwwwww", "wwwKbKww", "KbwwwwwKw", "wwKKKwww", "KbwKKbwwb", "KbKbbbbK", "bKKbKbKKb", "KKKKbKKK"], "label": "The sweep", "drags": [{ "x": 3, "y": 5, "ways": [3, 3, 3, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 7's gap: its white out left before it burns" }] }, { "cols": ["wbwKKKbbK", "bb**wwww", "Kwbwwwwww", "wwwKbwww", "KbwwwwwKw", "wwKKKwww", "KbwKKbwbb", "KbKbbbKK", "bKKbKbKKb", "KKKKbKKK"], "label": "The sweep", "drags": [{ "x": 0, "y": 4, "ways": [3, 3, 3, 3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 6's gap: its white out left before it burns" }] }, { "cols": ["wbwKwKbbK", "bb**wwww", "Kwbwwwwww", "wwwKbwww", "KbwwwwwKw", "wwKKKwKw", "KbwKKbwbb", "KbKbbbKK", "bKKbKbKKb", "KKKKbKKK"], "label": "The diamond", "drags": [{ "x": 4, "y": 0, "ways": [3] }], "steps": [{ "name": "the drop", "goal": "fill column 6's gap: its white further from the fire" }] }, { "cols": ["wbwKwKbbK", "bb**wwww", "Kwbwwwwww", "wwwKbwww", "wbwwwwwKw", "KwKKKwKw", "KbwKKbwbb", "KbKbbbKK", "bKKbKbKKb", "KKKKbKKK"], "label": "The diamond", "drags": [{ "x": 0, "y": 6, "ways": [0, 0] }, { "x": 0, "y": 5, "ways": [3, 0, 0, 3, 3, 3, 0, 0, 0] }], "steps": [{ "name": "the lift", "goal": "make way for drag 2" }, { "name": "the drop, then the ladder, then the drop, then the ladder", "goal": "fill column 7's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P33", moment: "leadup", level: "cc5", seed: 16, ms: 10450, stage: "junk", burns: 0, chain: 0, timeLeft: 4850, batch: "leadup", shut: [[4, 1]],
        what: "10.4 s in, 4.8 s on the furnace: the white at column 5, row 2 (ringed) is free enough here; after the bot's move it is trapped (a long, complicated way out, or none).",
        cols: ["bwKwbwwKw", "KwKbbwwb", "bwwKbwwwb", "wKwbwwKK", "wwKwwwwwb", "wwKwwbbb", "bbKKwKbbw", "bbbbbKKb", "KbbKKKbKK", "KKKKKKKK"],
        bot: { "phase": "fill", "kind": "move", "technique": "sweep", "label": "The sweep", "reason": "go, go, go: whites left, junk right: the black at column 2, row 1 down-right across the whites, then up through the browns to the blacks", "drags": [{ "x": 1, "y": 0, "ways": [0, 3, 3, 3, 0, 0] }], "state": "healthy", "tactic": "quickSort", "read": "nothing at risk: quick, simple moves, blacks down and browns up", "steps": [{ "name": "the ladder, then the drop, then the ladder", "goal": "fill column 6's gap: its white out left before it burns", "kind": "fill" }] },
        plan: { "aim": "fill column 6's gap: its white out left before it burns", "reached": 1, "through": true, "ends": "the furnace takes the next column", "moves": [{ "cols": ["bwKwbwwKw", "KwKbbwwb", "bwwKbwwwb", "wKwbwwKK", "wwKwwwwwb", "wwKwwbbb", "bbKKwKbbw", "bbbbbKKb", "KbbKKKbKK", "KKKKKKKK"], "label": "The sweep", "drags": [{ "x": 1, "y": 0, "ways": [0, 3, 3, 3, 0, 0] }], "steps": [{ "name": "the ladder, then the drop, then the ladder", "goal": "fill column 6's gap: its white out left before it burns" }] }, { "cols": ["bwKwbwwKw", "bwKbbwwb", "wwwKbwwwb", "wKwbwwKK", "wwKwwwwwb", "wbKwwbbb", "bbKKwKbbw", "KbbbbKKb", "KbbKKKbKK", "KKKKKKKK"], "label": "Bring a piece round", "drags": [{ "x": 4, "y": 7, "ways": [3] }, { "x": 3, "y": 7, "ways": [0, 3, 3] }], "steps": [{ "name": "the sink", "goal": "make way for drag 2" }, { "name": "the ladder, then the drop", "goal": "fill column 7's gap: its white further from the fire" }] }, { "cols": ["bwKwbwwKw", "bwKbbwwb", "wwwKbwwwb", "wKwbwwKb", "wwKwwwwwb", "wbKwwbbw", "bbKKwKbbK", "KbbbbKKb", "KbbKKKbKK", "KKKKKKKK"], "label": "Save the whites", "drags": [{ "x": 4, "y": 2, "ways": [2, 3, 3, 3, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 7's gap: its white further from the fire" }] }, { "cols": ["bwKwbwwKw", "bwKbbwwb", "wwwKbwwwb", "wKwbwwKb", "wwwwwwwwb", "wbKwwbbw", "bbKKbKbbK", "KbbKbKKb", "KbbKKKbKK", "KKKKKKKK"], "label": "Save the whites", "drags": [{ "x": 4, "y": 8, "ways": [0, 3] }], "steps": [{ "name": "the lift, then the ladder", "goal": "fill column 6's gap: its white further from the fire" }] }] },
    },
    {
        id: "P34", moment: "leadup", level: "cc3", seed: 13, ms: 10700, stage: "junk", burns: 0, chain: 0, timeLeft: 4600, batch: "leadup", shut: [[4, 1]],
        what: "10.7 s in, 4.6 s on the furnace: the white at column 5, row 2 (ringed) is free enough here; after the bot's move it is trapped (a long, complicated way out, or none).",
        cols: ["wbbwbbbwb", "KbwwbKww", "wwK*wwKbb", "bwwbwwww", "wKKwbbKKb", "KwbbKbKK", "bbKbKKbKK", "KbbKKbbK", "bbKbbKKbb", "KKKKKbKK"],
        bot: { "phase": "fill", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "a white stuck in a column to burn: sweep the black at column 5, row 2 onto it, and it's out", "drags": [{ "x": 4, "y": 1, "ways": [3, 0] }], "state": "healthy", "tactic": "quickSort", "read": "nothing at risk: quick, simple moves, blacks down and browns up", "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 6's gap: its white further from the fire", "kind": "fill" }] },
        plan: { "aim": "fill column 6's gap: its white further from the fire", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["wbbwbbbwb", "KbwwbKww", "wwK*wwKbb", "bwwbwwww", "wKKwbbKKb", "KwbbKbKK", "bbKbKKbKK", "KbbKKbbK", "bbKbbKKbb", "KKKKKbKK"], "label": "Save the whites", "drags": [{ "x": 4, "y": 1, "ways": [3, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 6's gap: its white further from the fire" }] }, { "cols": ["wbbwbbbwb", "KbwwbKww", "wwK*wwKbb", "bwwbwwww", "wwKwbbKKb", "KbbbKbKK", "bKKbKKbKK", "KbbKKbbK", "bbKbbKKbb", "KKKKKbKK"], "label": "Save the whites", "drags": [{ "x": 3, "y": 3, "ways": [0] }], "steps": [{ "name": "the lift", "goal": "fill column 5's gap: its white further from the fire" }] }, { "cols": ["wbbwbbbwb", "KbwwbKww", "wwK*wwKbb", "bwwwwwww", "wwKbbbKKb", "KbbbKbKK", "bKKbKKbKK", "KbbKKbbK", "bbKbbKKbb", "KKKKKbKK"], "label": "The sweep", "drags": [{ "x": 1, "y": 1, "ways": [3, 0, 0] }], "steps": [{ "name": "the ladder, then the lift", "goal": "fill column 5's gap: its white further from the fire" }] }, { "cols": ["wbbwbbbwb", "KKwwbKww", "www*wwKbb", "bwwwwwww", "wbKbbbKKb", "KbbbKbKK", "bKKbKKbKK", "KbbKKbbK", "bbKbbKKbb", "KKKKKbKK"], "label": "The sweep", "drags": [{ "x": 3, "y": 0, "ways": [0, 3, 3] }], "steps": [{ "name": "the lift, then the ladder", "goal": "fill column 5's gap: its white further from the fire" }] }, { "cols": ["wbbwbbbwb", "KKwwbKww", "www*wwKbb", "wwwwwwww", "KbKbbbKKb", "KbbbKbKK", "bbKbKKbKK", "KbbKKbbK", "bbKbbKKbb", "KKKKKbKK"], "label": "The sweep", "drags": [{ "x": 0, "y": 5, "ways": [3, 0, 0] }], "steps": [{ "name": "the ladder, then the lift", "goal": "fill column 4's gap: its white further from the fire" }] }] },
    },
    {
        id: "P35", moment: "leadup", level: "cc5", seed: 17, ms: 13600, stage: "junk", burns: 0, chain: 0, timeLeft: 1700, batch: "leadup", shut: [[4, 1]],
        what: "13.6 s in, 1.7 s on the furnace: the white at column 5, row 2 (ringed) is free enough here; after the bot's move it is trapped (a long, complicated way out, or none).",
        cols: ["KKbKbbKwb", "wKKwbwKK", "KwwKwwwbw", "wwwwKwww", "wwKbbwwwK", "KKKbKbKb", "KKbbKbbbb", "KKKbbbKK", "KKbbKbKbb", "KKbKKKKK"],
        bot: { "phase": "fill", "kind": "move", "technique": "sweep", "label": "The sweep", "reason": "go, go, go: whites left, junk right: the black at column 1, row 1 down-right across the whites, then up through the browns to the blacks", "drags": [{ "x": 0, "y": 0, "ways": [3, 3, 3] }], "state": "healthy", "tactic": "quickSort", "read": "nothing at risk: quick, simple moves, blacks down and browns up", "steps": [{ "name": "the drop", "goal": "fill column 4's gap: its white out left before it burns", "kind": "fill" }] },
        plan: { "aim": "fill column 4's gap: its white out left before it burns", "reached": 1, "through": true, "ends": "the furnace takes the next column", "moves": [{ "cols": ["KKbKbbKwb", "wKKwbwKK", "KwwKwwwbw", "wwwwKwww", "wwKbbwwwK", "KKKbKbKb", "KKbbKbbbb", "KKKbbbKK", "KKbbKbKbb", "KKbKKKKK"], "label": "The sweep", "drags": [{ "x": 0, "y": 0, "ways": [3, 3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 4's gap: its white out left before it burns" }] }, { "cols": ["wKbKbbKwb", "wKKwbwKK", "KwwKwwwbw", "wKwwKwww", "wwKbbwwwK", "KKKbKbKb", "KKbbKbbbb", "KKKbbbKK", "KKbbKbKbb", "KKbKKKKK"], "label": "The diamond", "drags": [{ "x": 1, "y": 1, "ways": [3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 4's gap: its white out left before it burns" }] }, { "cols": ["wKbKbbKwb", "wwKwbwKK", "KwwKwwwbw", "wKKwKwww", "wwKbbwwwK", "KKKbKbKb", "KKbbKbbbb", "KKKbbbKK", "KKbbKbKbb", "KKbKKKKK"], "label": "The diamond", "drags": [{ "x": 2, "y": 0, "ways": [3] }], "steps": [{ "name": "the drop", "goal": "fill column 4's gap: its white further from the fire" }] }] },
    },
    {
        id: "P36", moment: "leadup", level: "cc5", seed: 19, ms: 16250, stage: "junk", burns: 0, chain: 0, timeLeft: 14350, batch: "leadup", shut: [[7, 1]],
        what: "16.3 s in, 14.3 s on the furnace: the white at column 8, row 2 (ringed) is free enough here; after the bot's move it is trapped (a long, complicated way out, or none).",
        cols: ["wbbbbbwK", "KbwwKbwww", "bKbwKwwK", "wwwwwwwww", "wKKwKbbK", "wwwwwwwww", "bwKKKKbb", "wbbKbKKKK", "wKKKKKbK", "bKbbKKKKb"],
        bot: { "phase": "fire", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "quick sorting: the brown at column 8, row 2 up into a white's place by the fire, and it's out left", "drags": [{ "x": 7, "y": 1, "ways": [0] }], "state": "atRisk", "tactic": "quickSort", "read": "a white by the fire free to go, with time in hand (column 9, row 1): the quick sorting moves, blacks down and browns up, fill their places", "steps": [{ "name": "the lift", "goal": "fill column 9's gap: its white further from the fire", "kind": "fill" }] },
        plan: { "aim": "fill column 9's gap: its white further from the fire", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["wbbbbbwK", "KbwwKbwww", "bKbwKwwK", "wwwwwwwww", "wKKwKbbK", "wwwwwwwww", "bwKKKKbb", "wbbKbKKKK", "wKKKKKbK", "bKbbKKKKb"], "label": "Save the whites", "drags": [{ "x": 7, "y": 1, "ways": [0] }], "steps": [{ "name": "the lift", "goal": "fill column 9's gap: its white further from the fire" }] }, { "cols": ["wbbbbbwK", "KbwwKbwww", "bKbwKwwK", "wwwwwwwww", "wKKwKbbK", "wwwwwwwww", "bwKKKKbb", "wwbKbKKKK", "bKKKKKbK", "bKbbKKKKb"], "label": "Save the whites", "drags": [{ "x": 7, "y": 2, "ways": [2, 1, 0, 0] }], "steps": [{ "name": "the ladder, then the lift", "goal": "free column 8's white in row 2" }] }, { "cols": ["wbbbbbwK", "KbwwKbwww", "bKbwKwwK", "wwwwwwwww", "wKKwKbbK", "wwwwwwwww", "bwwKKKbb", "wbKKbKKKK", "bKKKKKbK", "bKbbKKKKb"], "label": "Save the whites", "drags": [{ "x": 6, "y": 0, "ways": [0] }], "steps": [{ "name": "the lift", "goal": "fill column 8's gap: its white further from the fire" }] }, { "cols": ["wbbbbbwK", "KbwwKbwww", "bKbwKwwK", "wwwwwwwww", "wKKwKbbK", "wwwwwwwww", "wwwKKKbb", "bbKKbKKKK", "bKKKKKbK", "bKbbKKKKb"], "label": "The diamond", "drags": [{ "x": 4, "y": 1, "ways": [3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 7's gap: its white further from the fire" }] }, { "cols": ["wbbbbbwK", "KbwwKbwww", "bKbwKwwK", "wwwwwwwww", "wwKwKbbK", "wwwwwwwww", "wwKKKKbb", "bbKKbKKKK", "bKKKKKbK", "bKbbKKKKb"], "label": "The sweep", "drags": [{ "x": 2, "y": 2, "ways": [0, 0, 0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 7's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P37", moment: "leadup", level: "cc5", seed: 10, ms: 20950, stage: "junk", burns: 0, chain: 0, timeLeft: 9650, batch: "leadup", shut: [[4, 5]],
        what: "20.9 s in, 9.7 s on the furnace: the white at column 5, row 6 (ringed) is free enough here; after the bot's move it is trapped (a long, complicated way out, or none).",
        cols: ["KwwbbwKK", "wbwbwww*K", "wwwbwwwK", "wbwwwwKww", "wbwwwwwb", "Kbbwwbbbb", "bwbKbwKw", "KbKKbbKKb", "bKKKKbKK", "KbKbbbKKb"],
        bot: { "phase": "fill", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "a white stuck in a column to burn: bring a brown beside it, then drag it out left", "drags": [{ "x": 5, "y": 6, "ways": [1, 1, 0] }, { "x": 5, "y": 4, "ways": [2] }], "state": "atRisk", "tactic": "quickSort", "read": "nothing at risk: quick, simple moves, blacks down and browns up; the junk the wrong way up (13 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the lift", "goal": "make way for drag 2", "kind": "makeWay" }, { "name": "the sink", "goal": "get column 6's white in row 5 further from the fire", "kind": "save" }] },
        plan: { "aim": "get column 6's white in row 5 further from the fire", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["KwwbbwKK", "wbwbwww*K", "wwwbwwwK", "wbwwwwKww", "wbwwwwwb", "Kbbwwbbbb", "bwbKbwKw", "KbKKbbKKb", "bKKKKbKK", "KbKbbbKKb"], "label": "Save the whites", "drags": [{ "x": 5, "y": 6, "ways": [1, 1, 0] }, { "x": 5, "y": 4, "ways": [2] }], "steps": [{ "name": "the lift", "goal": "make way for drag 2" }, { "name": "the sink", "goal": "get column 6's white in row 5 further from the fire" }] }, { "cols": ["KwwbbwKK", "wbwbwww*K", "wwwbwwwK", "wbwwwwKww", "wbwwwwwb", "Kbbwbbwbb", "bwbKbwKw", "KbKKbbKKb", "bKKKKbKK", "KbKbbbKKb"], "label": "The crawl", "drags": [{ "x": 4, "y": 7, "ways": [1, 0, 0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 7's gap: its white further from the fire" }] }, { "cols": ["KwwbbwKK", "wbwbwww*K", "wwwbwwwK", "wbwwwwKww", "wbwwwwww", "Kbbwbbwbb", "bwbKbbKw", "KbKKbbKKb", "bKKKKbKK", "KbKbbbKKb"], "label": "The crawl", "drags": [{ "x": 1, "y": 1, "ways": [0] }, { "x": 0, "y": 0, "ways": [3, 3, 3, 3, 3] }], "steps": [{ "name": "the lift", "goal": "make way for drag 2" }, { "name": "the drop", "goal": "fill column 6's gap: its white out left before it burns" }] }, { "cols": ["wwwbbwKK", "wwwbwww*K", "bwwbwwwK", "wbwwwwKww", "wbwwwwww", "KbbKbbwbb", "bwbKbbKw", "KbKKbbKKb", "bKKKKbKK", "KbKbbbKKb"], "label": "The crawl", "drags": [{ "x": 5, "y": 7, "ways": [1, 0] }, { "x": 3, "y": 6, "ways": [3, 3, 3] }], "steps": [{ "name": "the lift", "goal": "make way for drag 2" }, { "name": "the drop", "goal": "fill column 7's gap: its white out left before it burns" }] }, { "cols": ["wwwbbwKK", "wwwbwww*K", "bwwbwwwK", "wbwwwwwww", "wbwwwwww", "KbbKbbbwb", "bwbKbbKK", "KbKKbbKKb", "bKKKKbKK", "KbKbbbKKb"], "label": "The crawl", "drags": [{ "x": 5, "y": 8, "ways": [1] }, { "x": 2, "y": 7, "ways": [3, 0, 3] }, { "x": 3, "y": 8, "ways": [0, 0] }], "steps": [{ "name": "the lift", "goal": "make way for drag 2" }, { "name": "the drop, then the ladder, then the drop", "goal": "fill column 6's gap: its white further from the fire" }, { "name": "the lift", "goal": "fill column 6's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P38", moment: "leadup", level: "cc5", seed: 21, ms: 27100, stage: "junk", burns: 0, chain: 0, timeLeft: 3500, batch: "leadup", shut: [[4, 2]],
        what: "27.1 s in, 3.5 s on the furnace: the white at column 5, row 3 (ringed) is free enough here; after the bot's move it is trapped (a long, complicated way out, or none).",
        cols: ["bwKKwwwb", "wwwwbwwww", "wwK*ww*b", "wwwKbwwww", "wwwwwwww", "bKKbKKbKb", "bbKbKKKK", "KKbKbKKKK", "bKbKbKKb", "bbKKbKKKb"],
        bot: { "phase": "fill", "kind": "move", "technique": "crawl", "label": "The crawl", "reason": "whites stuck at the top: crawl them out, a black and a brown working together", "drags": [{ "x": 5, "y": 3, "ways": [1, 1, 2] }, { "x": 3, "y": 2, "ways": [3, 3] }, { "x": 2, "y": 2, "ways": [0] }], "state": "healthy", "tactic": "quickSort", "read": "nothing at risk: quick, simple moves, blacks down and browns up", "steps": [{ "name": "the lift, then the ladder", "goal": "free column 5's white in row 3, stuck", "kind": "untrap" }, { "name": "the drop", "goal": "fill column 6's gap: its white further from the fire", "kind": "fill" }, { "name": "the lift", "goal": "fill column 4's gap: its white further from the fire", "kind": "fill" }] },
        plan: { "aim": "fill column 4's gap: its white further from the fire", "reached": 1, "through": true, "ends": "it waits", "moves": [{ "cols": ["bwKKwwwb", "wwwwbwwww", "wwK*ww*b", "wwwKbwwww", "wwwwwwww", "bKKbKKbKb", "bbKbKKKK", "KKbKbKKKK", "bKbKbKKb", "bbKKbKKKb"], "label": "The crawl", "drags": [{ "x": 5, "y": 3, "ways": [1, 1, 2] }, { "x": 3, "y": 2, "ways": [3, 3] }, { "x": 2, "y": 2, "ways": [0] }], "steps": [{ "name": "the lift, then the ladder", "goal": "free column 5's white in row 3, stuck" }, { "name": "the drop", "goal": "fill column 6's gap: its white further from the fire" }, { "name": "the lift", "goal": "fill column 4's gap: its white further from the fire" }] }] },
    },
    {
        id: "P39", moment: "leadup", level: "cc5", seed: 14, ms: 31600, stage: "junk", burns: 0, chain: 0, timeLeft: 14300, batch: "leadup", shut: [[4, 5]],
        what: "31.6 s in, 14.3 s on the furnace: the white at column 5, row 6 (ringed) is free enough here; after the bot's move it is trapped (a long, complicated way out, or none).",
        cols: ["KbKwbKKKK", "wwwwwwKw", "K*wwwwwKw", "wwwbwwww", "wwwwKwwww", "bwwwwKww", "bKKbbwKKb", "KbbbbbKK", "bKbbKbbKb", "KbKbKKKb"],
        bot: { "phase": "fill", "kind": "move", "technique": "sweep", "label": "The sweep", "reason": "go, go, go: whites left, junk right: the black at column 5, row 5 down-right across the whites, then up through the browns to the blacks", "drags": [{ "x": 4, "y": 4, "ways": [3, 3, 0] }], "state": "healthy", "tactic": "quickSort", "read": "nothing at risk: quick, simple moves, blacks down and browns up", "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 7's gap: its white further from the fire", "kind": "fill" }] },
        plan: { "aim": "fill column 7's gap: its white further from the fire", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["KbKwbKKKK", "wwwwwwKw", "K*wwwwwKw", "wwwbwwww", "wwwwKwwww", "bwwwwKww", "bKKbbwKKb", "KbbbbbKK", "bKbbKbbKb", "KbKbKKKb"], "label": "The sweep", "drags": [{ "x": 4, "y": 4, "ways": [3, 3, 0] }], "steps": [{ "name": "the drop, then the ladder", "goal": "fill column 7's gap: its white further from the fire" }] }, { "cols": ["KbKwbKKKK", "wwwwwwKw", "K*wwwwwKw", "wwwbwwww", "wwwwwwwww", "bwwwwKww", "bKKbbbKKb", "KbbbKbKK", "bKbbKbbKb", "KbKbKKKb"], "label": "The sweep", "drags": [{ "x": 0, "y": 5, "ways": [3, 3, 3, 3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 6's gap: its white out left before it burns" }] }, { "cols": ["KbKwbwKKK", "wwwwwwKw", "K*wwwwwKw", "wwwbwwww", "wwwwwwwww", "bwwwwKwK", "bKKbbbKKb", "KbbbKbKK", "bKbbKbbKb", "KbKbKKKb"], "label": "The sweep", "drags": [{ "x": 0, "y": 4, "ways": [0, 0, 0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 5's gap: its white out left before it burns" }] }, { "cols": ["KbKwwwKKK", "wwwwwwKw", "K*wwwwwKw", "wwwbwwww", "wwbwwwwww", "bwwwwKwK", "bKKbbbKKb", "KbbbKbKK", "bKbbKbbKb", "KbKbKKKb"], "label": "The diamond", "drags": [{ "x": 3, "y": 3, "ways": [0] }], "steps": [{ "name": "the lift", "goal": "fill column 5's gap: its white further from the fire" }] }, { "cols": ["KbKwwwKKK", "wwwwwwKw", "K*wwwwwKw", "wwwwwwww", "wwbbwwwww", "bwwwwKwK", "bKKbbbKKb", "KbbbKbKK", "bKbbKbbKb", "KbKbKKKb"], "label": "The sweep", "drags": [{ "x": 0, "y": 2, "ways": [3, 3, 3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 5's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P40", moment: "leadup", level: "cc5", seed: 20, ms: 36200, stage: "junk", burns: 0, chain: 0, timeLeft: 9700, batch: "leadup", shut: [[5, 7]],
        what: "36.2 s in, 9.7 s on the furnace: the white at column 6, row 8 (ringed) is free enough here; after the bot's move it is trapped (a long, complicated way out, or none).",
        cols: ["wbwwbwwb*", "wwww*bwb", "KbKKwwwwb", "wwwwwwwb", "wKKK*wwww", "Kbbbbbbw", "bKbbbbKwK", "bbKbbbbb", "KbbbbbbbK", "bbbKKbbK"],
        bot: { "phase": "fill", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "a white stuck in a column to burn: set the black at column 5, row 4 on its diagonal, then sweep it down onto the white", "drags": [{ "x": 4, "y": 3, "ways": [2, 2, 3, 2, 3, 2, 3, 3, 0, 3, 0, 0, 0] }], "state": "healthy", "tactic": "quickSort", "read": "nothing at risk: quick, simple moves, blacks down and browns up", "steps": [{ "name": "the drop, then the ladder, then the drop, then the ladder", "goal": "fill column 7's gap: its white further from the fire", "kind": "fill" }] },
        plan: { "aim": "fill column 7's gap: its white further from the fire", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["wbwwbwwb*", "wwww*bwb", "KbKKwwwwb", "wwwwwwwb", "wKKK*wwww", "Kbbbbbbw", "bKbbbbKwK", "bbKbbbbb", "KbbbbbbbK", "bbbKKbbK"], "label": "Save the whites", "drags": [{ "x": 4, "y": 3, "ways": [2, 2, 3, 2, 3, 2, 3, 3, 0, 3, 0, 0, 0] }], "steps": [{ "name": "the drop, then the ladder, then the drop, then the ladder", "goal": "fill column 7's gap: its white further from the fire" }] }, { "cols": ["wbwwbwwb*", "wwww*bwb", "KbKKwwwwb", "wwwwwwwb", "wKKw*wwbw", "Kbbbbbww", "bKbbbbKbK", "bbKbbbbb", "KbbbbbbbK", "bbbKKKbK"], "label": "The sweep", "drags": [{ "x": 5, "y": 6, "ways": [2, 2, 2] }], "steps": [{ "name": "the sink", "goal": "get column 6's white in row 7 out before it burns" }] }, { "cols": ["wbwwbwwb*", "wwww*bwb", "KbKKwwwww", "wwwwwwwb", "wKKw*wwbw", "Kbbbbbbw", "bKbbbbKbK", "bbKbbbbb", "KbbbbbbbK", "bbbKKKbK"], "label": "The sweep", "drags": [{ "x": 0, "y": 7, "ways": [0, 0, 0] }], "steps": [{ "name": "the lift", "goal": "free column 5's white in row 6, stuck" }] }, { "cols": ["wbwwbwww*", "wwww*bwb", "KbKKwwwww", "wwwwwbwb", "wKKw*wwbw", "Kbbbbbbw", "bKbbbbKbK", "bbKbbbbb", "KbbbbbbbK", "bbbKKKbK"], "label": "The crawl", "drags": [{ "x": 2, "y": 1, "ways": [0, 0] }, { "x": 2, "y": 2, "ways": [3, 3] }], "steps": [{ "name": "the lift", "goal": "fill column 5's gap: its white out left before it burns" }, { "name": "the drop", "goal": "fill column 5's gap: its white out left before it burns" }] }, { "cols": ["wbwwbwww*", "wwww*bwb", "KwwKwwwww", "wwwwwbwb", "bKKK*wwbw", "Kbbbbbbw", "bKbbbbKbK", "bbKbbbbb", "KbbbbbbbK", "bbbKKKbK"], "label": "The sweep", "drags": [{ "x": 1, "y": 7, "ways": [0, 0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 5's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P41", moment: "leadup", level: "cc5", seed: 18, ms: 36750, stage: "junk", burns: 0, chain: 0, timeLeft: 9150, batch: "leadup", shut: [[5, 6]],
        what: "36.8 s in, 9.2 s on the furnace: the white at column 6, row 7 (ringed) is free enough here; after the bot's move it is trapped (a long, complicated way out, or none).",
        cols: ["wKbKwbbbK", "bKwwKKwK", "b*bbwKKww", "bwbww*ww", "wwbbwwwww", "bwKwKwwK", "wwwwwwwww", "wbwwbbKw", "bKbKKbwbK", "bKKKKKKb"],
        bot: { "phase": "fire", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "fill the gaps: junk raced into a white's place (column 9, row 7), and it's out left", "drags": [{ "x": 5, "y": 4, "ways": [2, 3, 3, 0, 3] }], "state": "atRisk", "tactic": "fillGaps", "read": "a white by the fire with its column burning soon (column 9, row 7): junk into their places, the quickest first; the junk the wrong way up (18 browns high and blacks low): hoist the blacks with the browns before they strand", "steps": [{ "name": "the drop, then the ladder, then the drop", "goal": "fill column 9's gap: column 9's white in row 7 out left", "kind": "fill" }] },
        plan: { "aim": "fill column 9's gap: column 9's white in row 7 out left", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["wKbKwbbbK", "bKwwKKwK", "b*bbwKKww", "bwbww*ww", "wwbbwwwww", "bwKwKwwK", "wwwwwwwww", "wbwwbbKw", "bKbKKbwbK", "bKKKKKKb"], "label": "Save the whites", "drags": [{ "x": 5, "y": 4, "ways": [2, 3, 3, 0, 3] }], "steps": [{ "name": "the drop, then the ladder, then the drop", "goal": "fill column 9's gap: column 9's white in row 7 out left" }] }, { "cols": ["wKbKwbbbK", "bKwwKKwK", "b*bbwKKww", "bwbww*ww", "wwbbwwwww", "bwKwwwwK", "wwwwwwbww", "wbwwbwKw", "bKbKKbKbK", "bKKKKKKb"], "label": "Save the whites", "drags": [{ "x": 5, "y": 2, "ways": [3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 8's gap: its white further from the fire" }] }, { "cols": ["wKbKwbbbK", "bKwwKKwK", "b*bbwKKww", "bwbww*ww", "wwbbwwwww", "bwwwwwwK", "wwwwwwbww", "wbwKbwKw", "bKbKKbKbK", "bKKKKKKb"], "label": "The sweep", "drags": [{ "x": 4, "y": 2, "ways": [0, 0, 0, 3, 3] }], "steps": [{ "name": "the lift, then the ladder", "goal": "fill column 8's gap: its white out left before it burns" }] }, { "cols": ["wKbKwbbbK", "bKwwKKwK", "b*bbwKKww", "bwbww*ww", "wwwbwwwww", "bwwwwwwK", "wwwwwwbww", "KbwKbwKw", "bKbKKbKbK", "bbKKKKKb"], "label": "The sweep", "drags": [{ "x": 3, "y": 2, "ways": [0, 0, 0] }], "steps": [{ "name": "the lift", "goal": "fill column 7's gap: its white out left before it burns" }] }, { "cols": ["wKbKwbbbK", "bKwwKKwK", "b*bbwKKww", "bwwww*ww", "wwwbwwwww", "bwwwwwwK", "wbwwwwbww", "KbwKbwKw", "bKbKKbKbK", "bbKKKKKb"], "label": "The sweep", "drags": [{ "x": 0, "y": 3, "ways": [3, 0, 3, 3, 3, 3, 3, 0] }], "steps": [{ "name": "the drop, then the ladder, then the drop, then the ladder", "goal": "fill column 8's gap: its white out left before it burns" }] }] },
    },
    {
        id: "P42", moment: "leadup", level: "cc3", seed: 12, ms: 97800, stage: "junk", burns: 0, chain: 0, timeLeft: 9300, batch: "leadup", shut: [[4, 1]],
        what: "97.8 s in, 9.3 s on the furnace: the white at column 5, row 2 (ringed) is free enough here; after the bot's move it is trapped (a long, complicated way out, or none).",
        cols: ["KbwKbKKKK", "bKwbbbwK", "wbwwbbbwK", "wbwKKKbK", "wwKKKKbw*", "KKKwKKKw", "KwwwKbKbb", "KbwwbbbK", "bbbKbbbKK", "bbbKbKKb"],
        bot: { "phase": "fire", "kind": "move", "technique": "sweep", "label": "The sweep", "reason": "go, go, go: whites left, junk right: the brown at column 4, row 2 up-right across the whites, then down through the blacks to the browns", "drags": [{ "x": 3, "y": 1, "ways": [3, 3, 0] }], "state": "healthy", "tactic": "quickSort", "read": "nothing at risk: quick, simple moves, blacks down and browns up", "steps": [{ "name": "the ladder, then the lift", "goal": "fill column 7's gap: its white further from the fire", "kind": "fill" }] },
        plan: { "aim": "fill column 7's gap: its white further from the fire", "reached": 1, "through": true, "ends": "5 moves", "moves": [{ "cols": ["KbwKbKKKK", "bKwbbbwK", "wbwwbbbwK", "wbwKKKbK", "wwKKKKbw*", "KKKwKKKw", "KwwwKbKbb", "KbwwbbbK", "bbbKbbbKK", "bbbKbKKb"], "label": "The sweep", "drags": [{ "x": 3, "y": 1, "ways": [3, 3, 0] }], "steps": [{ "name": "the ladder, then the lift", "goal": "fill column 7's gap: its white further from the fire" }] }, { "cols": ["KbwKbKKKK", "bKwbbbwK", "wbwwbbbwK", "wKwKKKbK", "wwKKKKbw*", "KKwwKKKw", "KwbwKbKbb", "KbwwbbbK", "bbbKbbbKK", "bbbKbKKb"], "label": "The diamond", "drags": [{ "x": 1, "y": 1, "ways": [3, 3] }], "steps": [{ "name": "the drop", "goal": "carry the black over to the colour in column 4" }] }, { "cols": ["KbwKbKKKK", "bwwbbbwK", "wbwwbbbwK", "wKKKKKbK", "wwKKKKbw*", "KKwwKKKw", "KwbwKbKbb", "KbwwbbbK", "bbbKbbbKK", "bbbKbKKb"], "label": "The sweep", "drags": [{ "x": 4, "y": 2, "ways": [3, 3, 3] }], "steps": [{ "name": "the drop", "goal": "fill column 8's gap: its white out left before it burns" }] }, { "cols": ["KbwKbKKKK", "bwwbbbwK", "wbwwbbbwK", "wKKKKKbK", "wwwKKKbw*", "KKwwKKKw", "KwbwKbKbb", "KbwKbbbK", "bbbKbbbKK", "bbbKbKKb"], "label": "Save the whites", "drags": [{ "x": 3, "y": 1, "ways": [3, 3, 0] }, { "x": 7, "y": 2, "ways": [1] }], "steps": [{ "name": "the drop, then the ladder", "goal": "free column 8's white in row 3, stuck" }, { "name": "the climb", "goal": "get column 8's white in row 3 further from the fire" }] }, { "cols": ["KbwKbKKKK", "bwwbbbwK", "wbwwbbbwK", "wwKKKKbK", "wwwKKKbw*", "KKbwKKKw", "KwwwKbKbb", "KbKKbbbK", "bbbKbbbKK", "bbbKbKKb"], "label": "The diamond", "drags": [{ "x": 2, "y": 1, "ways": [0, 0] }], "steps": [{ "name": "the lift", "goal": "free column 5's top white, stuck" }] }] },
    },
];
// ---- end of POSITIONS ----
/** The user's verdicts, by position. Add to these, never to POSITIONS. */
export const VERDICTS = {
    // The first three are from notes the user had already given (DISTILLING.md §3), applied to these positions as
    // examples of the format, for the user to confirm or correct.
    P1: [{
            date: '13 Nov',
            note: "Nothing wrong with saving that white, but the top right comes first: its whites have blacks round them and no move beside them, so they'll be trapped. Drag the blacks there down, and column 10's top blacks through the browns and back, until the top right flows (the thirty-third note).",
            expect: { phase: 'fire', startsIn: { x: [5, 9], y: [0, 2] }, noBurn: true },
        }],
    P2: [{
            date: '13 Nov',
            note: "The same as P1: risk management and priorities. Alarm bells that column 9 has a white at the top, walled in by blacks; a board like this is something gone wrong far earlier, but the work now is the top right, freeing its whites, before anything else (the thirty-third note).",
            expect: { phase: 'fire', startsIn: { x: [5, 9], y: [0, 2] }, noBurn: true },
        }],
    P3: [{
            date: '13 Nov',
            note: "No hurry for column 9's whites with column 10 to go first: quick, simple, easy moves. Drag the blacks down, like the two in column 8, down, down, then along the columns going down, and the browns up.",
            expect: { kind: 'move', sorts: true, noBurn: true },
        }],
    P4: [{
            date: '13 Nov',
            note: "Fill the right-hand columns' gaps as fast as you can: a brown that can go up and a black that can go down fill both whites' places in column 9 in two moves, rather than dragging one white as far as it goes and still leaving gaps on the right to fill.",
            expect: { fills: 8, frees: 8, noBurn: true },
        }],
    P5: [{
            date: '13 Nov',
            note: "Closer, and the move itself is fine, but it misses the bigger danger: the top two whites in column 8 are the risk, with no way of getting a brown up to them. Why is there so much white in the gap? Fix those first.",
            expect: { freesAny: [[7, 0], [7, 1]], noBurn: true },
        }],
    P6: [{
            date: '13 Nov',
            note: "Why big, long, complicated moves? Pull the blacks down at the bottom of column 8. Better yet, the whites isolated and trapped at the top of columns 8 and 9 come first: something has gone wrong to even be in that situation, and all the focus goes on those trapped whites.",
            expect: { freesAny: [[7, 0], [8, 0]], avoids: ['diamond'], noBurn: true },
        }],
    P7: [{
            date: '13 Nov',
            note: "A board where things have gone really wrong: blacks all at the bottom, browns at the top, not enough movement; the blacks low in columns 5 and 6 and the brown at the top of column 5 at risk of being stranded and ruining the Crystal Clear. Panic, and damage control: quick, easy moves first to fill columns 8 and 9 however you can, the two blacks pulled down into them and the browns up; then the blacks and that brown out of the way to the left.",
            expect: { kind: 'move', fills: [7, 8], noBurn: true },
        }],
    P8: [{
            date: '13 Nov',
            note: "Pull the browns in columns 9 and 10 to the bottom and the blacks up to the top, quickly: the zigzag needs two columns of solid colour, and once column 10 burns you've lost the column you need to move blacks and browns up and down. Then the blacks down at the bottom left, fixing up the V, and the same at the top. The V left too long, the pieces not sorted.",
            expect: { kind: 'move', startsIn: { x: [8, 9], y: [0, 8] }, ladder: true, noBurn: true },
        }],
    P9: [{
            date: '13 Nov',
            note: "Not bad, it goes for the white that's the priority, but it feels like it's just stopped: keep dragging that brown down through the blacks to really reach the bottom. The better move is the tail at the bottom left: drag the browns at the bottom of columns 7 and 8 down first, so that when you come to the move at the top you can drag that brown all the way down through. The efficiency of sorting that bottom bit out.",
            expect: { kind: 'move', startsIn: { x: [6, 7], y: [6, 8] }, ladder: true, noBurn: true },
        }],
    P10: [{
            date: '13 Nov',
            note: "The move itself is fine, but the board is in a bad state, something chosen wrong to get here: so many trapped pieces, blacks at the bottom surrounded by whites, browns at the top. How do I get those blacks out? Hold off: move those browns up to the right and they may be the browns needed to rescue the trapped blacks. Switch from filling the white columns to fixing the cracked pieces.",
            expect: { keeps: [[5, 4], [6, 4]], noBurn: true },
        }],
    // The batch of 13 Nov, P13 to P30 (DISTILLING.md, "A batch to judge, P13 to P30": the user's verdicts there).
    P15: [{
            date: '13 Nov',
            note: "The reader's right: column 9 flagged, that's what you've got to dig out. The plan's first three steps are about right (the brown brought so the black can come down, which frees the white), then it gets distracted. See it through: the black in column 9 replaced with a brown in the same row as column 8's white, a line of brown, the browns swapped for blacks, and the whites get up.",
            expect: { planFrees: [[8, 7], [7, 8]], noBurn: true },
            open: true,
        }],
    P17: [{
            date: '13 Nov',
            note: "Black down: agreed. What it's missing is the risk: a lot of browns near the top left and blacks near the bottom left. The immediate moves are fine, but they leave those blacks stranded, so it should have raised them up: a brown to hoist them.",
            expect: { sorts: true, flags: 'upsideDown', noBurn: true },
        }],
    P20: [{
            date: '13 Nov',
            note: "Trapped whites? You just drop the blacks down, that's fine. Nothing's trapped. Quick moves: some of column 7's blacks down a bit, the black in the middle of column 5 out of the way, then the brown to hoist some in columns 2 and 3, certainly the one at the bottom of column 3.",
            expect: { notTactic: 'freeTrapped', sorts: true, noBurn: true },
        }],
    P21: [{
            date: '13 Nov',
            note: "Not trapped: there's a two-step solution, just drag the blacks in 6 and 7 down to the bottom. Trapped I define as much more challenging than that, a complicated move and a high number of swaps.",
            expect: { notTactic: 'freeTrapped', noBurn: true },
        }, {
            date: '13 Nov',
            note: "The two steps themselves: the blacks in columns 6 and 7 dragged down to the bottom.",
            expect: { startsIn: { x: [5, 6], y: [0, 8] }, holds: 'black', sorts: true },
            open: true,
        }],
    P22: [{
            date: '13 Nov',
            note: "The same as P21: only technically trapped, it can't move, there's only one way, but it's just so close.",
            expect: { notTactic: 'freeTrapped', kind: 'move', noBurn: true },
        }],
    P23: [{
            date: '13 Nov',
            note: "Quick sorting, but with suspicion: why so many blacks at the bottom and browns at the top? Get a few whites out quickly, but it needs actual sorting so more browns are at the bottom, or the whites get only so far before they're stuck. A risk the reader didn't see.",
            expect: { sorts: true, flags: 'upsideDown', noBurn: true },
        }],
    P24: [{
            date: '13 Nov',
            note: "Definitely good quick sorting time: the browns up, the blacks down. Agreed, with a low degree of confidence that some risks aren't quite being identified.",
            expect: { kind: 'move', sorts: true, noBurn: true },
        }],
    P25: [{
            date: '13 Nov',
            note: "That's definitely one: the white at the top of column 9, and the one at the bottom of column 8. Save the whites, absolutely. Something's gone horribly wrong to get there, but the classification's right.",
            expect: { fills: 8, noBurn: true },
        }],
    P26: [{
            date: '13 Nov',
            note: "Not fill by the fire: that white's completely doomed. Why does it get stuck? At least say you're doomed on that white, it's junk, and start getting the ones in column 9 out of the way, the blacks dragged down: quick drag-the-black-down motions. Never wait.",
            expect: { kind: 'move', sorts: true, noBurn: true },
        }],
    P27: [{
            date: '13 Nov',
            note: "Damage control, absolutely, yet it does nothing to deal with the damage: its first move drags a brown up to the top right, reinforcing the damage, blacks and browns all separated. There's no time to zigzag, so hoist things up and down with the browns: the cluster on the left, browns and blacks close together; the diagonal of browns in 4, 5, 6 down a bit, or the blacks at the bottom middle sorted. The classification right, the plan terrible.",
            expect: { goals: ['hoist'], noBurn: true },
        }],
    P28: [{
            date: '13 Nov',
            note: "The same as P27: damage control right, just doing what you can. Not quite as dire. How are we getting into so many of these?",
            expect: { goals: ['hoist', 'fill'], near: 2, noBurn: true },
        }],
    P29: [{
            date: '13 Nov',
            note: "The classification's right, the move wrong. The point of the browns down is you want them at the bottom-left tip: the black at the bottom of column 7 is what you'd swap the brown in for. It's just pulling a random brown down, not achieving the goal.",
            expect: { holds: 'brown', ends: [6, 6], noBurn: true },
        }],
    P30: [{
            date: '13 Nov',
            note: "As P29: a brown brought down goes to the V's bottom-left tip, swapped in for the black at the bottom of column 7.",
            expect: { holds: 'brown', ends: [6, 7], noBurn: true },
        }],
};
/** Positions the user chose not to give a verdict on, and why: kept, and not asked about again. */
export const SKIPPED = {
    P11: { date: '13 Nov', note: "Not a real situation: with junk everywhere and whites scattered this late, you're just losing, and something went wrong long before. Its lesson is upstream: the risk reader's job is never to arrive there." },
    P12: { date: '13 Nov', note: "Skipped too: what really went wrong is far earlier. A brown in the column going up with 2.5 s left: maybe a black and a brown crawled over to it, but that's a big if, and you wouldn't get into that situation if you're any good." },
    // Past saving (13 Nov): the lead-up wanted, the boards before it went wrong (the next batch, P31 on).
    P13: { date: '13 Nov', note: "Past saving, the lead-up wanted: \"There's a lot of crap ... how is it still getting in these positions?\"" },
    P14: { date: '13 Nov', note: "Past saving, the lead-up wanted. The bot's ideas not terrible, but the white at the top of column 9 and the bottom of column 8 insanely trapped, the one in column 10 impossible by now: \"How are we finding these boards with so many trapped holes?\"" },
    P16: { date: '13 Nov', note: "Past saving, the lead-up wanted: \"disaster has already struck.\"" },
    P18: { date: '13 Nov', note: "Past saving, the lead-up wanted: \"the problem happens before that. Like, you should have had like a channel of black and brown pieces, so you can just move them up in position.\"" },
    P19: { date: '13 Nov', note: "Past saving, the lead-up wanted: \"a bad example ... stuff's gone bad already.\"" },
};
/** The themes in order, each in plain words for the page. */
export const THEMES = {
    trapped: { name: 'Trapped whites near the fire, first', about: 'whites at the top of the columns by the fire, junk round them and no way for it to reach them: freed before anything else' },
    close: { name: 'Close, not trapped', about: 'a white a drag or two from free (the blacks above it dropped, say) isn\'t trapped: trapped is a complicated move and many swaps' },
    fillFast: { name: 'Fill by the fire, fast', about: 'the gaps in the columns by the fire filled with the quickest junk moves, not one white dragged a long way' },
    quickSort: { name: 'Quick sorting while nothing\'s at risk', about: 'time in hand: blacks down, browns up, short and simple' },
    hoist: { name: 'Hoisting: browns and blacks together', about: 'browns high and blacks low never meet: a brown sunk through the blacks lifts them, before they strand' },
    damage: { name: 'Damage control', about: 'a board gone really wrong: the columns by the fire filled however you can, then the stranded junk out left' },
    cracked: { name: 'A cracked board: keep the tools', about: 'junk stranded among the whites: fix it, and keep the browns in the middle to fix it with' },
    patterns: { name: 'The patterns: the ladder and the V', about: 'the right-hand pair sorted into the zigzag\'s ladder before one burns; the V\'s tail sorted so the next sweep runs through' },
    late: { name: 'Past saving: the lead-up wanted', about: 'boards already lost when picked; the boards before them are the ones to judge (the next batch)' },
    skipped: { name: 'Skipped: lost boards', about: 'boards you\'d never reach if you\'re any good; their lesson is earlier' },
};
/** Each position's theme, and what the board reader should read there. */
export const THEMED = {
    P1: { theme: 'trapped', reads: { tactic: 'freeTrapped' } },
    P2: { theme: 'trapped', reads: { tactic: 'freeTrapped' } },
    P5: { theme: 'trapped', reads: { tactic: 'freeTrapped' } },
    P6: { theme: 'trapped', reads: { tactic: 'freeTrapped' } },
    P4: { theme: 'fillFast', reads: { tactic: 'fillGaps' } },
    // (the user, 13 Nov: "I think [P3] was quick sorting": read so since, the whites burning soon free and every quick fill
    // of their places a black down or a brown up)
    P3: { theme: 'quickSort', reads: { tactic: 'quickSort' } },
    P7: { theme: 'damage', reads: { state: 'damageControl' } },
    P10: { theme: 'cracked', reads: { state: 'cracked', tactic: 'fixCracks' } },
    P8: { theme: 'patterns', reads: { tactic: 'sortLadder' } },
    P9: { theme: 'patterns', reads: { tactic: 'sortTail' } },
    P11: { theme: 'skipped' },
    P12: { theme: 'skipped' },
    // The batch of 13 Nov, judged. P21 and P22 were found as like P5 and P6, trapped; the user: not trapped, so they're
    // close, as P20 is.
    P15: { theme: 'trapped', reads: { tactic: 'freeTrapped' } },
    P20: { theme: 'close' },
    P21: { theme: 'close' },
    P22: { theme: 'close' },
    P25: { theme: 'fillFast', reads: { tactic: 'fillGaps' } },
    // (Found as like P4; the user: "I wouldn't say [fill] by the fire, it's just completely doomed ... just in quick drag
    // the black down motions": its doomed white given up, it reads as quick sorting.)
    P26: { theme: 'quickSort', reads: { tactic: 'quickSort' } },
    P23: { theme: 'quickSort', reads: { tactic: 'quickSort' } },
    P24: { theme: 'quickSort', reads: { tactic: 'quickSort' } },
    P17: { theme: 'hoist', reads: { tactic: 'blocks' } },
    P27: { theme: 'damage', reads: { state: 'damageControl' } },
    P28: { theme: 'damage', reads: { state: 'damageControl' } },
    P29: { theme: 'patterns', reads: { tactic: 'sortLadder' } },
    P30: { theme: 'patterns', reads: { tactic: 'sortTail' } },
    P13: { theme: 'late' },
    P14: { theme: 'late' },
    P16: { theme: 'late' },
    P18: { theme: 'late' },
    P19: { theme: 'late' },
};
/** What the reader should read at a theme challenge's position: what it reads at the judged position it's `like`. */
export function challengeReads(p) {
    return p.batch === 'challenge' && p.like ? THEMED[p.like]?.reads : undefined;
}
/** The board of a position. */
export const boardOf = (p) => parseBoard(p.cols);
/** The bot's move at a position now: the planner as the bot calls it, with its level, stage and the furnace's time. */
export function botAt(p) {
    const cols = boardOf(p), level = levelNamed(p.level);
    // (in the chain, its rule of thumb as the bot has it: `chainContext`)
    const ctx = p.stage === 'chain' ? chainContext(cols, p.chain, p.burns, level.target, level.reach).ctx : contextFor(cols, p.stage, p.burns, level.reach);
    return choose({ cols, chain: p.chain, timeLeft: p.timeLeft }, ctx, level);
}
/** The bot's next few moves at a position, played forward (src/distill-ahead.ts, `ahead`): the same planner as
    `botAt`, so its first move is the bot's move there. */
export function planOf(p) {
    const level = levelNamed(p.level);
    const a = ahead({ cols: boardOf(p), stage: p.stage, burns: p.burns, chain: p.chain, timeLeft: p.timeLeft }, level);
    return {
        aim: a.aim, reached: a.reached, through: a.through, ends: a.ends,
        moves: a.moves.map((m) => ({
            cols: writeBoard(m.cols), label: m.advice.label, drags: m.advice.drags.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] })),
            steps: (m.advice.steps ?? []).map((st) => ({ name: st.name, goal: st.goal?.says ?? null })),
        })),
    };
}
/** An Advice as a position keeps it. */
export function moveOf(a) {
    return {
        phase: a.phase, kind: a.kind, technique: a.sweep ? 'sweep' : (a.technique ?? a.routine ?? null), label: a.label, reason: a.reason,
        drags: a.drags.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] })), ...(a.column !== undefined ? { column: a.column } : {}),
        ...(a.state ? { state: a.state, tactic: a.tactic, read: a.read } : {}),
        ...(a.steps?.length ? { steps: a.steps.map((s) => ({ name: s.name, goal: s.goal?.says ?? null, ...(s.goal ? { kind: s.goal.kind } : {}) })) } : {}),
    };
}
/** Where a drag lets its piece go. */
export function dragEnd(cols, d) {
    let at = [d.x, d.y];
    for (const w of d.ways) {
        const n = neighbourOn(cols, at[0], at[1], w);
        if (!n)
            break;
        at = n;
    }
    return at;
}
const whitesIn = (cols, x) => cols[x].filter((p) => p === WHITE).length;
const place = ([x, y]) => `column ${x + 1}, row ${y + 1}`;
/** What a move falls short of in a verdict, in plain words; none when it meets it all. */
export function check(p, m, e) {
    const cols = boardOf(p), after = playDrags(cols, m.drags) ?? cols, out = [];
    const first = m.drags[0];
    if (e.phase && m.phase !== e.phase)
        out.push(`its phase is ${m.phase}, not ${e.phase}`);
    if (e.kind && m.kind !== e.kind)
        out.push(`it chose to ${m.kind}, not ${e.kind}`);
    if (e.noBurn && m.kind === 'burn')
        out.push('it burns');
    if (e.starts && (!first || first.x !== e.starts[0] || first.y !== e.starts[1])) {
        out.push(`its first drag starts ${first ? `at ${place([first.x, first.y])}` : 'nowhere'}, not ${place(e.starts)}`);
    }
    if (e.startsIn) {
        const { x: [x0, x1], y: [y0, y1] } = e.startsIn;
        if (!first || first.x < x0 || first.x > x1 || first.y < y0 || first.y > y1) {
            out.push(`its first drag starts ${first ? `at ${place([first.x, first.y])}` : 'nowhere'}, not in columns ${x0 + 1} to ${x1 + 1}, rows ${y0 + 1} to ${y1 + 1}`);
        }
    }
    if (e.sorts) {
        const held = first && cols[first.x][first.y], end = first && dragEnd(cols, first);
        const h = (x, y) => y + (cols[x].length === TALL ? 0 : 0.5);
        const ok = !!first && !!end && ((held === BLACK && h(...end) > h(first.x, first.y)) || (held === BROWN && h(...end) < h(first.x, first.y)));
        if (!ok)
            out.push("its first drag isn't a black taken down or a brown taken up");
    }
    if (e.fills !== undefined) {
        const held = first && cols[first.x][first.y], end = first && dragEnd(cols, first);
        const want = typeof e.fills === 'number' ? [e.fills] : e.fills;
        const ok = !!end && (held === BLACK || held === BROWN) && want.includes(end[0]) && cols[end[0]][end[1]] === WHITE;
        if (!ok)
            out.push(`its first drag doesn${"'"}t carry junk into a white${"'"}s place in column ${want.map((x) => x + 1).join(' or ')}`);
    }
    if (e.ladder) {
        const held = first && cols[first.x][first.y], end = first && dragEnd(cols, first);
        const h = (x, y) => y + (cols[x].length === TALL ? 0 : 0.5);
        const ok = !!first && !!end && ((held === BLACK && h(...end) < h(first.x, first.y)) || (held === BROWN && h(...end) > h(first.x, first.y)));
        if (!ok)
            out.push("its first drag isn't a black taken up or a brown taken down");
    }
    if (e.ends) {
        const end = first && dragEnd(cols, first);
        if (!end || end[0] !== e.ends[0] || end[1] !== e.ends[1])
            out.push(`its first drag ends ${end ? `at ${place(end)}` : 'nowhere'}, not ${place(e.ends)}`);
    }
    if (typeof e.frees === 'number' && whitesIn(after, e.frees) >= whitesIn(cols, e.frees))
        out.push(`no white leaves column ${e.frees + 1}`);
    if (Array.isArray(e.frees) && after[e.frees[0]][e.frees[1]] === WHITE)
        out.push(`the white at ${place(e.frees)} is still there`);
    if (e.freesAny && e.freesAny.every(([x, y]) => after[x][y] === WHITE))
        out.push(`none of the whites at ${e.freesAny.map(place).join(' or ')} is freed`);
    if (e.keeps)
        for (const [x, y] of e.keeps)
            if (after[x][y] !== cols[x][y])
                out.push(`it moves the piece at ${place([x, y])}`);
    if (e.clean !== undefined && after[e.clean].some(isJunk))
        out.push(`column ${e.clean + 1} still holds junk`);
    if (e.uses && m.technique !== e.uses)
        out.push(`it plays ${m.technique ?? 'nothing'}, not ${e.uses}`);
    if (e.avoids && m.technique && e.avoids.includes(m.technique))
        out.push(`it plays ${m.technique}`);
    if (e.planFrees) {
        // (Its plan, the next few moves played forward: one of these whites gone from its place by the end of them.)
        let b = cols;
        for (const mv of planOf(p).moves) {
            b = b && playDrags(b, mv.drags);
            if (!b)
                break;
            if (e.planFrees.some(([x, y]) => b[x][y] !== WHITE))
                break;
        }
        if (!b || e.planFrees.every(([x, y]) => b[x][y] === WHITE))
            out.push(`its plan frees none of the whites at ${e.planFrees.map(place).join(' or ')}`);
    }
    if (e.goals) {
        const k = m.steps?.[0]?.kind;
        if (!k || !e.goals.includes(k))
            out.push(`its first drag's goal is ${k ?? 'none'}, not ${e.goals.join(' or ')}`);
    }
    if (e.near !== undefined && first) {
        const end = dragEnd(cols, first);
        if (end[0] - first.x > e.near)
            out.push(`its first drag carries its piece ${end[0] - first.x} columns right, more than ${e.near}`);
    }
    if (e.holds) {
        const held = first && cols[first.x][first.y];
        if (held !== (e.holds === 'brown' ? BROWN : BLACK))
            out.push(`its first drag doesn't hold a ${e.holds}`);
    }
    if (e.notTactic || e.flags) {
        const r = readBoard(cols, { stage: p.stage, timeLeft: p.timeLeft });
        if (e.notTactic && r.tactic === e.notTactic)
            out.push(`the board reader reads it as ${e.notTactic}`);
        if (e.flags === 'upsideDown' && !r.patterns.upsideDown.flagged)
            out.push("the board reader doesn't see the junk the wrong way up");
    }
    if (e.longest !== undefined) {
        const n = Math.max(0, ...m.drags.map((d) => d.ways.length));
        if (n < e.longest)
            out.push(`its longest drag is ${n} swap${n === 1 ? '' : 's'}, not ${e.longest} or more`);
    }
    return out;
}
