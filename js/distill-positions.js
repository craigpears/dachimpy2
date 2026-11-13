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
import { BLACK, BROWN, TALL, WHITE, neighbourOn, parseBoard } from './distilling.js';
import { choose, contextFor, levelNamed } from './distill-bots.js';
import { isJunk, playDrags } from './distill-routines.js';
/** Each kind in plain words, for the page. */
export const MOMENTS = {
    low: 'Whites low by the fire',
    edge: 'A white on an edge or by a spice, near the fire',
    stuck: 'Waiting, with something stuck',
    junkUp: 'A column about to go up with junk in it',
    block: 'The block phase',
    early: 'Early on, the fire\'s side',
};
// ---- POSITIONS: written by tools/distill-positions.mjs; run it again rather than editing these ----
export const POSITIONS = [
    {
        id: "P1", moment: "early", level: "cc8", seed: 1, ms: 16300, stage: "junk", burns: 0, chain: 0, timeLeft: 14300,
        what: "16.3 s into the session: 4 whites still in the three columns by the fire, 14.3 s before the first goes.",
        cols: ["wwbKwbKb", "KwKKKb*Kw", "bbwwKwww", "*bwwKKbwb", "wwwKbwbb", "K*KKbwwbb", "wKKbbKww", "bwwKKKbww", "bbKbbbbb", "KKbKKKKKK"],
        bot: { "phase": "fire", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "a white stuck in a column to burn: set the black at column 4, row 6 on its diagonal, then sweep it down onto the white", "drags": [{ "x": 3, "y": 5, "ways": [3, 3, 3, 3, 2, 3, 0] }] },
    },
    {
        id: "P2", moment: "early", level: "cc3", seed: 3, ms: 16200, stage: "junk", burns: 0, chain: 0, timeLeft: 14400,
        what: "16.2 s into the session: 3 whites still in the three columns by the fire, 14.4 s before the first goes.",
        cols: ["bKKbwbwK", "bKKwKwKwK", "KKwbKbwK", "KKKwww*ww", "KbbKwKbw", "wKKwwwwKK", "KKbbbKbw", "wKKbbbKwb", "wKKKKKKK", "bbbKbKKKb"],
        bot: { "phase": "fire", "kind": "move", "technique": "diamond", "label": "The diamond", "reason": "first, to open the way to the white by the fire: bring in another piece: drag the brown at column 3, row 4 into the gap, then the black at column 1, row 3 over past it", "drags": [{ "x": 2, "y": 3, "ways": [0] }, { "x": 0, "y": 2, "ways": [3, 3, 3, 3, 3, 0, 0] }] },
    },
    {
        id: "P3", moment: "low", level: "cc3", seed: 2, ms: 207200, stage: "junk", burns: 0, chain: 0, timeLeft: 7000,
        what: "2 whites in the bottom rows of the two columns by the fire, 7.0 s before the furnace takes column 10.",
        cols: ["wKwwKwKK", "KKbKwKKKK", "bbKbbbwK", "bbbbbbbbK", "KbwwbwKK", "K*bwwwwwK", "wbbwKwwK", "wKbbbwKKb", "bKKKbKww", "KKKbb*bKK"],
        bot: { "phase": "fire", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "a white in a column to burn: drag it out left, down through the browns", "drags": [{ "x": 8, "y": 7, "ways": [2, 1] }] },
    },
    {
        id: "P4", moment: "low", level: "cc3", seed: 1, ms: 5650, stage: "junk", burns: 0, chain: 0, timeLeft: 9650,
        what: "2 whites in the bottom rows of the two columns by the fire, 9.7 s before the furnace takes column 10.",
        cols: ["KwKKKb*Kw", "bbwbKwww", "*bwwKKbwb", "bKwKbbKb", "K*wKbbwKb", "wKKbKKbw", "wwwKKbbww", "bwKbwbbK", "KKbKKKwbw", "KKKKKKKK"],
        bot: { "phase": "fire", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "a white stuck in a column to burn: bring the black at column 5, row 8 beside it, then drag it out left", "drags": [{ "x": 4, "y": 7, "ways": [0, 0, 0] }, { "x": 8, "y": 6, "ways": [1, 2] }] },
    },
    {
        id: "P5", moment: "edge", level: "cc8", seed: 3, ms: 170750, stage: "junk", burns: 0, chain: 0, timeLeft: 12850,
        what: "A white at the top of column 8, 2 columns from the fire, and 4 more whites on an edge or by a spice near it; 12.8 s on the furnace.",
        cols: ["xbKKKwww", "wbbbKwwww", "K*xwKwKK", "KwwwwKwKw", "bwwwwwww", "bbwwwwwKw", "b*wwwwbw", "wwwwwwwww", "bbwbbKKK", "b***KKKKK"],
        bot: { "phase": "block", "kind": "move", "technique": "path", "label": "Bring a piece round", "reason": "the white at column 9, row 3 is stuck: bring the brown at column 7, row 7 round, looping, to take its place, and it's out left", "drags": [{ "x": 6, "y": 6, "ways": [1, 1, 0, 0, 0, 1, 0, 0] }] },
    },
    {
        id: "P6", moment: "edge", level: "cc3", seed: 2, ms: 200900, stage: "junk", burns: 0, chain: 0, timeLeft: 13300,
        what: "A white at the top of column 8, 2 columns from the fire, and 4 more whites on an edge or by a spice near it; 13.3 s on the furnace.",
        cols: ["wKwwKwKK", "KKbKwKKKK", "bbKbKKwK", "bbbbbbbbK", "KbwbbbKK", "b*bwbbwwK", "KbbwwwwK", "wKbbwwKKb", "wKKKwwww", "KKKbb*bKK"],
        bot: { "phase": "fire", "kind": "move", "technique": "diamond", "label": "The diamond", "reason": "bring in another piece: drag the black at column 3, row 6 into the gap, then the black at column 3, row 5 over past it", "drags": [{ "x": 2, "y": 5, "ways": [0, 0, 0, 3, 3, 3] }, { "x": 2, "y": 4, "ways": [0, 0, 3, 3, 3] }] },
    },
    {
        id: "P7", moment: "stuck", level: "cc8", seed: 2, ms: 588900, stage: "junk", burns: 0, chain: 0, timeLeft: 7800,
        what: "The bot waits, with 8 pieces stuck (white and brown and black), 5 whites in columns 8 and 9 by the fire with no way out left on their own, 2 of them low down; 7.8 s on the furnace.",
        cols: ["bwKwKKwKK", "Kw*wwwbw", "ww*www*Kw", "bwwwwwww", "bwwwwww*K", "wwwwwwwK", "wwwwbwKww", "bwbwwKwK", "bwwwbwwKK", "bbbKbKKK"],
        bot: { "phase": "block", "kind": "wait", "technique": null, "label": "Wait", "reason": "the column is ready: let the furnace take it", "drags": [] },
    },
    {
        id: "P8", moment: "stuck", level: "cc8", seed: 3, ms: 197950, stage: "junk", burns: 0, chain: 0, timeLeft: 950,
        what: "The bot waits, with 9 pieces stuck (white), 4 whites in column 8 by the fire with no way out left on their own, 2 of them low down; 0.9 s on the furnace.",
        cols: ["bKwwwwK*w", "xbwwwwww", "wbxwwwwww", "w*wwwwKK", "wwwwwwwww", "bwwwwwKK", "bbwwwwwww", "b*wwKwwK", "bKbbbKKKK", "bbbKKKKK"],
        bot: { "phase": "block", "kind": "wait", "technique": null, "label": "Wait", "reason": "the column is ready: let the furnace take it", "drags": [] },
    },
    {
        id: "P9", moment: "block", level: "cc8", seed: 1, ms: 102000, stage: "junk", burns: 0, chain: 0, timeLeft: 5100,
        what: "Whites mostly left (40 on the board); the junk being moved in blocks and wrapped round them in a V. 5.1 s on the furnace.",
        cols: ["KwwwKKwbw", "ww*wbwKK", "wbwww*bKw", "bwwwwwww", "wwwwwwwwK", "wwwwKbKK", "wbbwww*bw", "bwbwbKbK", "*KKKKKKKK", "bKKKKKbK"],
        bot: { "phase": "block", "kind": "move", "technique": "sweep", "label": "The sweep", "reason": "go, go, go: a white stuck in a column to burn: sweep the brown at column 7, row 3 onto it, and it's out", "drags": [{ "x": 6, "y": 2, "ways": [0, 3, 3] }] },
    },
    {
        id: "P10", moment: "block", level: "cc8", seed: 2, ms: 160050, stage: "junk", burns: 0, chain: 0, timeLeft: 8250,
        what: "Whites mostly left (44 on the board); the junk being moved in blocks and wrapped round them in a V. 8.3 s on the furnace.",
        cols: ["bbwwbwwKK", "wbbbwwww", "K*wwwwwwK", "wbbwwwww", "wwwwwwKww", "bwwwbwww", "wwwwb*wwK", "bbwwwbKK", "bbbbbbbK*", "bbbKbbbK"],
        bot: { "phase": "block", "kind": "move", "technique": "rescue", "label": "Save the whites", "reason": "first, to open the way to the white by the fire: a white in a column to burn: drag it out left, down through the browns", "drags": [{ "x": 7, "y": 3, "ways": [2] }] },
    },
    {
        id: "P11", moment: "junkUp", level: "cc3", seed: 1, ms: 135200, stage: "chain", burns: 0, chain: 2, timeLeft: 2500,
        what: "The chain at CC^2; column 10 goes up next with 1 brown in it, 2.5 s before it goes.",
        cols: ["wwKbKbbKb", "KKbKbKbK", "bbwbKbKbK", "bK*KbwKK", "bKKwK*KKb", "wKwKbKKK", "wwwKKbKKb", "wwwbbKbw", "bwwwwK*ww", "wwwwwbww"],
        bot: { "phase": "chain", "kind": "wait", "technique": null, "label": "Wait", "reason": "nothing worth moving: wait for the next column", "drags": [], "column": 9 },
    },
    {
        id: "P12", moment: "junkUp", level: "cc8", seed: 2, ms: 303450, stage: "chain", burns: 0, chain: 1, timeLeft: 2550,
        what: "The chain at CC^1; column 10 goes up next with 1 brown in it, 2.5 s before it goes.",
        cols: ["wbKwwbKK", "KbKbwwbKK", "KKKbwKKK", "bKbbbbKKK", "bbbbwKKb", "KbbKbwwKb", "wbwwwwKK", "wwwwwwKKK", "wwwwwwww", "wbwwwwwww"],
        bot: { "phase": "chain", "kind": "wait", "technique": null, "label": "Wait", "reason": "nothing worth moving: wait for the next column", "drags": [], "column": 9 },
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
            expect: { phase: 'fire', startsIn: { x: [5, 9], y: [0, 2] }, noBurn: true }, open: true,
        }],
    P2: [{
            date: '13 Nov',
            note: "The same as P1: risk management and priorities. Alarm bells that column 9 has a white at the top, walled in by blacks; a board like this is something gone wrong far earlier, but the work now is the top right, freeing its whites, before anything else (the thirty-third note).",
            expect: { phase: 'fire', startsIn: { x: [5, 9], y: [0, 2] }, noBurn: true }, open: true,
        }],
    P3: [{
            date: '13 Nov',
            note: "No hurry for column 9's whites with column 10 to go first: quick, simple, easy moves. Drag the blacks down, like the two in column 8, down, down, then along the columns going down, and the browns up.",
            expect: { kind: 'move', sorts: true, noBurn: true }, open: true,
        }],
    P4: [{
            date: '13 Nov',
            note: "Fill the right-hand columns' gaps as fast as you can: a brown that can go up and a black that can go down fill both whites' places in column 9 in two moves, rather than dragging one white as far as it goes and still leaving gaps on the right to fill.",
            expect: { fills: 8, frees: 8, noBurn: true }, open: true,
        }],
    P5: [{
            date: '13 Nov',
            note: "Closer, and the move itself is fine, but it misses the bigger danger: the top two whites in column 8 are the risk, with no way of getting a brown up to them. Why is there so much white in the gap? Fix those first.",
            expect: { freesAny: [[7, 0], [7, 1]], noBurn: true }, open: true,
        }],
    P6: [{
            date: '13 Nov',
            note: "Why big, long, complicated moves? Pull the blacks down at the bottom of column 8. Better yet, the whites isolated and trapped at the top of columns 8 and 9 come first: something has gone wrong to even be in that situation, and all the focus goes on those trapped whites.",
            expect: { freesAny: [[7, 0], [8, 0]], avoids: ['diamond'], noBurn: true }, open: true,
        }],
    P7: [{
            date: '13 Nov',
            note: "A board where things have gone really wrong: blacks all at the bottom, browns at the top, not enough movement; the blacks low in columns 5 and 6 and the brown at the top of column 5 at risk of being stranded and ruining the Crystal Clear. Panic, and damage control: quick, easy moves first to fill columns 8 and 9 however you can, the two blacks pulled down into them and the browns up; then the blacks and that brown out of the way to the left.",
            expect: { kind: 'move', fills: [7, 8], noBurn: true }, open: true,
        }],
    P8: [{
            date: '13 Nov',
            note: "Pull the browns in columns 9 and 10 to the bottom and the blacks up to the top, quickly: the zigzag needs two columns of solid colour, and once column 10 burns you've lost the column you need to move blacks and browns up and down. Then the blacks down at the bottom left, fixing up the V, and the same at the top. The V left too long, the pieces not sorted.",
            expect: { kind: 'move', startsIn: { x: [8, 9], y: [0, 8] }, ladder: true, noBurn: true }, open: true,
        }],
};
/** The board of a position. */
export const boardOf = (p) => parseBoard(p.cols);
/** The bot's move at a position now: the planner as the bot calls it, with its level, stage and the furnace's time. */
export function botAt(p) {
    const cols = boardOf(p), level = levelNamed(p.level);
    return choose({ cols, chain: p.chain, timeLeft: p.timeLeft }, contextFor(cols, p.stage, p.burns, level.reach), level);
}
/** An Advice as a position keeps it. */
export function moveOf(a) {
    return {
        phase: a.phase, kind: a.kind, technique: a.sweep ? 'sweep' : (a.technique ?? a.routine ?? null), label: a.label, reason: a.reason,
        drags: a.drags.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] })), ...(a.column !== undefined ? { column: a.column } : {}),
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
    if (e.clean !== undefined && after[e.clean].some(isJunk))
        out.push(`column ${e.clean + 1} still holds junk`);
    if (e.uses && m.technique !== e.uses)
        out.push(`it plays ${m.technique ?? 'nothing'}, not ${e.uses}`);
    if (e.avoids && m.technique && e.avoids.includes(m.technique))
        out.push(`it plays ${m.technique}`);
    if (e.longest !== undefined) {
        const n = Math.max(0, ...m.drags.map((d) => d.ways.length));
        if (n < e.longest)
            out.push(`its longest drag is ${n} swap${n === 1 ? '' : 's'}, not ${e.longest} or more`);
    }
    return out;
}
