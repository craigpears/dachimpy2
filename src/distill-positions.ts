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
import type { Board } from './distilling.js';
import { choose, contextFor, levelNamed } from './distill-bots.js';
import type { Advice, Technique } from './distill-bots.js';
import { isJunk, playDrags } from './distill-routines.js';
import type { Drag } from './distill-routines.js';
import type { Phase } from './distill-phase.js';
import type { BoardState, Tactic } from './distill-read.js';

/** The kinds of moment picked, each a couple of times. */
export type Moment = 'low' | 'edge' | 'stuck' | 'junkUp' | 'block' | 'early';
/** Each kind in plain words, for the page. */
export const MOMENTS: Readonly<Record<Moment, string>> = {
  low: 'Whites low by the fire',
  edge: 'A white on an edge or by a spice, near the fire',
  stuck: 'Waiting, with something stuck',
  junkUp: 'A column about to go up with junk in it',
  block: 'The block phase',
  early: 'Early on, the fire\'s side',
};

/** A move's technique, or 'sweep' for a long plain drag swept blind (Advice's `sweep`). */
export type MoveTechnique = Technique | 'sweep';

/** What the bot does at a position: its phase, the kind of decision, the technique and its label, its reason in a
    line, its drags, and in the chain the column it's filling. */
export interface BotMove {
  phase: Phase;
  kind: Advice['kind'];
  technique: MoveTechnique | null;
  label: string;
  reason: string;
  drags: Drag[];
  column?: number;
  /** The board read (src/distill-read.ts): its state, the tactic in play, and why. */
  state?: BoardState;
  tactic?: Tactic;
  read?: string;
}

/** A moment from a bot's play, fixed. */
export interface Position {
  /** 'P1', 'P2'...: what the user calls it. */
  id: string;
  moment: Moment;
  /** What's happening, in plain words. */
  what: string;
  /** The bot ('cc3'), the deal's seed, and how far into the session (ms of play). */
  level: string;
  seed: number;
  ms: number;
  /** What the planner saw: its stage, Stage II's junk columns still to burn before the chain, the chain now, and the
      furnace's ms left before it takes the right-hand column. */
  stage: 'junk' | 'chain';
  burns: number;
  chain: number;
  timeLeft: number;
  /** The board, a column a string top to bottom (parseBoard: w white, b brown, K black, * spice, x burnt white). */
  cols: string[];
  /** What the bot did there when the tool last ran. */
  bot: BotMove;
}

/** What a verdict expects of the bot's move. Places are [x, y] (see the header: the page's [column, row] less one). */
export interface Expect {
  /** The phase it says it's in. */
  phase?: Phase;
  /** It moves (rather than waits), or waits. */
  kind?: Advice['kind'];
  /** Its first drag starts at the piece here, or ends (the held piece let go) here. */
  starts?: [number, number];
  ends?: [number, number];
  /** Its first drag starts somewhere in this area: columns x[0] to x[1], rows y[0] to y[1] (a corner to work in,
      when the verdict is where to work rather than the exact piece). */
  startsIn?: { x: readonly [number, number]; y: readonly [number, number] };
  /** Its first drag is a quick sorting move: it carries a black down, or a brown up. */
  sorts?: boolean;
  /** Its first drag sorts the right side into the ladder the zigzag climbs: a black carried up, or a brown down. */
  ladder?: boolean;
  /** Its first drag carries junk (a brown or a black) into this column (or one of these), into a white's place: a
      gap filled. */
  fills?: number | readonly number[];
  /** A white freed: given a column, fewer whites in it after the move; given a place, the white there gone from it
      (junk raced into its place, or the white moved on). */
  frees?: number | [number, number];
  /** At least one of these whites freed (junk raced into its place, or the white moved on). */
  freesAny?: readonly (readonly [number, number])[];
  /** These pieces left where they are (needed later: a brown kept in the middle to fix the board with). */
  keeps?: readonly (readonly [number, number])[];
  /** After its move, no junk (brown, black, burnt white) left in this column. */
  clean?: number;
  /** The technique it plays, and those it mustn't. */
  uses?: MoveTechnique;
  avoids?: readonly MoveTechnique[];
  /** Never a burn. */
  noBurn?: boolean;
  /** At least one drag this many swaps long. */
  longest?: number;
}

/** The user's verdict on a position. */
export interface Verdict {
  /** When, and their words (or the note it's from, with `from`). */
  date: string;
  note: string;
  from?: string;
  expect: Expect;
  /** Not met by the bots yet: the test expects it to fail, and says so once it passes. */
  open?: boolean;
}

// ---- POSITIONS: written by tools/distill-positions.mjs; run it again rather than editing these ----
export const POSITIONS: readonly Position[] = [
  {
    id: "P1", moment: "early", level: "cc8", seed: 1, ms: 16300, stage: "junk", burns: 0, chain: 0, timeLeft: 14300,
    what: "16.3 s into the session: 4 whites still in the three columns by the fire, 14.3 s before the first goes.",
    cols: ["wwbKwbKb","KwKKKb*Kw","bbwwKwww","*bwwKKbwb","wwwKbwbb","K*KKbwwbb","wKKbbKww","bwwKKKbww","bbKbbbbb","KKbKKKKKK"],
    bot: {"phase":"fire","kind":"move","technique":"rescue","label":"Save the whites","reason":"free the trapped whites: nothing frees the white at column 8, row 2 yet: open the way to it: a short drag beside it, the pieces round it set moving","drags":[{"x":8,"y":2,"ways":[0]}],"state":"atRisk","tactic":"freeTrapped","read":"2 whites trapped near the fire (column 8, row 2, column 8, row 9), the worst first"},
  },
  {
    id: "P2", moment: "early", level: "cc3", seed: 3, ms: 16200, stage: "junk", burns: 0, chain: 0, timeLeft: 14400,
    what: "16.2 s into the session: 3 whites still in the three columns by the fire, 14.4 s before the first goes.",
    cols: ["bKKbwbwK","bKKwKwKwK","KKwbKbwK","KKKwww*ww","KbbKwKbw","wKKwwwwKK","KKbbbKbw","wKKbbbKwb","wKKKKKKK","bbbKbKKKb"],
    bot: {"phase":"fire","kind":"move","technique":"rescue","label":"Save the whites","reason":"free the trapped whites: a piece near the white at column 9, row 1 taken round into its place","drags":[{"x":9,"y":1,"ways":[1,2,3,0]}],"state":"atRisk","tactic":"freeTrapped","read":"2 whites trapped near the fire (column 9, row 1, column 8, row 1), the worst first"},
  },
  {
    id: "P3", moment: "low", level: "cc3", seed: 2, ms: 207200, stage: "junk", burns: 0, chain: 0, timeLeft: 7000,
    what: "2 whites in the bottom rows of the two columns by the fire, 7.0 s before the furnace takes column 10.",
    cols: ["wKwwKwKK","KKbKwKKKK","bbKbbbwK","bbbbbbbbK","KbwwbwKK","K*bwwwwwK","wbbwKwwK","wKbbbwKKb","bKKKbKww","KKKbb*bKK"],
    bot: {"phase":"fire","kind":"move","technique":"rescue","label":"Save the whites","reason":"fill the gaps: junk raced into a white's place (column 9, row 8, column 9, row 7), and it's out left","drags":[{"x":7,"y":7,"ways":[3]}],"state":"atRisk","tactic":"fillGaps","read":"2 whites by the fire with their columns burning soon (column 9, row 8, column 9, row 7): junk into their places, the quickest first"},
  },
  {
    id: "P4", moment: "low", level: "cc3", seed: 1, ms: 5650, stage: "junk", burns: 0, chain: 0, timeLeft: 9650,
    what: "2 whites in the bottom rows of the two columns by the fire, 9.7 s before the furnace takes column 10.",
    cols: ["KwKKKb*Kw","bbwbKwww","*bwwKKbwb","bKwKbbKb","K*wKbbwKb","wKKbKKbw","wwwKKbbww","bwKbwbbK","KKbKKKwbw","KKKKKKKK"],
    bot: {"phase":"fire","kind":"move","technique":"rescue","label":"Save the whites","reason":"fill the gaps: junk raced into a white's place (column 9, row 7, column 9, row 9), and it's out left","drags":[{"x":7,"y":6,"ways":[0]}],"state":"atRisk","tactic":"fillGaps","read":"2 whites by the fire with their columns burning soon (column 9, row 7, column 9, row 9): junk into their places, the quickest first"},
  },
  {
    id: "P5", moment: "edge", level: "cc8", seed: 3, ms: 170750, stage: "junk", burns: 0, chain: 0, timeLeft: 12850,
    what: "A white at the top of column 8, 2 columns from the fire, and 4 more whites on an edge or by a spice near it; 12.8 s on the furnace.",
    cols: ["xbKKKwww","wbbbKwwww","K*xwKwKK","KwwwwKwKw","bwwwwwww","bbwwwwwKw","b*wwwwbw","wwwwwwwww","bbwbbKKK","b***KKKKK"],
    bot: {"phase":"block","kind":"move","technique":"diamond","label":"The diamond","reason":"free the trapped whites: bring in another piece: drag the black at column 3, row 1 into the gap, then the brown at column 6, row 2 over past it","drags":[{"x":2,"y":0,"ways":[3,3,0,0,3]},{"x":5,"y":1,"ways":[0]}],"state":"atRisk","tactic":"freeTrapped","read":"3 whites trapped near the fire (column 8, row 2, column 9, row 3, column 8, row 3), the worst first"},
  },
  {
    id: "P6", moment: "edge", level: "cc3", seed: 2, ms: 200900, stage: "junk", burns: 0, chain: 0, timeLeft: 13300,
    what: "A white at the top of column 8, 2 columns from the fire, and 4 more whites on an edge or by a spice near it; 13.3 s on the furnace.",
    cols: ["wKwwKwKK","KKbKwKKKK","bbKbKKwK","bbbbbbbbK","KbwbbbKK","b*bwbbwwK","KbbwwwwK","wKbbwwKKb","wKKKwwww","KKKbb*bKK"],
    bot: {"phase":"fire","kind":"move","technique":"rescue","label":"Save the whites","reason":"free the trapped whites: a white stuck in a column to burn: bring the brown at column 6, row 1 beside it, then drag it out left","drags":[{"x":5,"y":0,"ways":[3,3]},{"x":8,"y":0,"ways":[2,1]}],"state":"atRisk","tactic":"freeTrapped","read":"4 whites trapped near the fire (column 9, row 1, column 9, row 6, column 9, row 5 and 1 more), the worst first"},
  },
  {
    id: "P7", moment: "stuck", level: "cc8", seed: 2, ms: 588900, stage: "junk", burns: 0, chain: 0, timeLeft: 7800,
    what: "The bot waits, with 8 pieces stuck (white and brown and black), 5 whites in columns 8 and 9 by the fire with no way out left on their own, 2 of them low down; 7.8 s on the furnace.",
    cols: ["bwKwKKwKK","Kw*wwwbw","ww*www*Kw","bwwwwwww","bwwwwww*K","wwwwwwwK","wwwwbwKww","bwbwwKwK","bwwwbwwKK","bbbKbKKK"],
    bot: {"phase":"block","kind":"move","technique":"rescue","label":"Save the whites","reason":"fill the gaps: junk raced into a white's place (column 9, row 6, column 9, row 2, column 9, row 4), and it's out left","drags":[{"x":6,"y":4,"ways":[0,0]}],"state":"damageControl","tactic":"fillGaps","read":"5 whites still in column 9, 23 s from the fire, and junk free for 1 column: fill its gaps however you can, the quickest first"},
  },
  {
    id: "P8", moment: "stuck", level: "cc8", seed: 3, ms: 197950, stage: "junk", burns: 0, chain: 0, timeLeft: 950,
    what: "The bot waits, with 9 pieces stuck (white), 4 whites in column 8 by the fire with no way out left on their own, 2 of them low down; 0.9 s on the furnace.",
    cols: ["bKwwwwK*w","xbwwwwww","wbxwwwwww","w*wwwwKK","wwwwwwwww","bwwwwwKK","bbwwwwwww","b*wwKwwK","bKbbbKKKK","bbbKKKKK"],
    bot: {"phase":"block","kind":"move","technique":"turnOver","label":"Turn the right side over","reason":"sort the ladder: columns 9 and 10 sorted, blacks over browns, the ladder the zigzag climbs, before column 10 goes","drags":[{"x":8,"y":1,"ways":[0]}],"state":"atRisk","tactic":"sortLadder","read":"columns 9 and 10 aren't sorted blacks over browns, and column 10 goes in 0.9 s: sort the ladder before it's lost"},
  },
  {
    id: "P9", moment: "block", level: "cc8", seed: 1, ms: 102000, stage: "junk", burns: 0, chain: 0, timeLeft: 5100,
    what: "Whites mostly left (40 on the board); the junk being moved in blocks and wrapped round them in a V. 5.1 s on the furnace.",
    cols: ["KwwwKKwbw","ww*wbwKK","wbwww*bKw","bwwwwwww","wwwwwwwwK","wwwwKbKK","wbbwww*bw","bwbwbKbK","*KKKKKKKK","bKKKKKbK"],
    bot: {"phase":"block","kind":"move","technique":"turnOver","label":"Turn the right side over","reason":"sort the tail: a brown sunk down through the blacks at the V's bottom, so the next sweep runs through","drags":[{"x":7,"y":6,"ways":[3,3,2]}],"state":"atRisk","tactic":"sortTail","read":"the V's tail unsorted (column 7, row 8, column 8, row 7): browns down through the blacks, so the next sweep runs through"},
  },
  {
    id: "P10", moment: "block", level: "cc8", seed: 2, ms: 160050, stage: "junk", burns: 0, chain: 0, timeLeft: 8250,
    what: "Whites mostly left (44 on the board); the junk being moved in blocks and wrapped round them in a V. 8.3 s on the furnace.",
    cols: ["bbwwbwwKK","wbbbwwww","K*wwwwwwK","wbbwwwww","wwwwwwKww","bwwwbwww","wwwwb*wwK","bbwwwbKK","bbbbbbbK*","bbbKbbbK"],
    bot: {"phase":"block","kind":"move","technique":"store","label":"Store the junk","reason":"fix the cracks: store the junk: the black at column 3, row 1 can't cross yet: take it back to the junk on the left before it's trapped","drags":[{"x":2,"y":0,"ways":[2]}],"state":"cracked","tactic":"fixCracks","read":"14 pieces of junk stranded among the whites (column 1, row 1, column 1, row 2, column 1, row 5 and 11 more): free them, keeping the browns in the middle to do it with"},
  },
  {
    id: "P11", moment: "junkUp", level: "cc3", seed: 1, ms: 135200, stage: "chain", burns: 0, chain: 2, timeLeft: 2500,
    what: "The chain at CC^2; column 10 goes up next with 1 brown in it, 2.5 s before it goes.",
    cols: ["wwKbKbbKb","KKbKbKbK","bbwbKbKbK","bK*KbwKK","bKKwK*KKb","wKwKbKKK","wwwKKbKKb","wwwbbKbw","bwwwwK*ww","wwwwwbww"],
    bot: {"phase":"chain","kind":"move","technique":"path","label":"Bring a piece round","reason":"the brown at column 10, row 6 is stuck: bring the white at column 8, row 8 round, looping, to take its place, and it's out left","drags":[{"x":7,"y":7,"ways":[1,1,0,0,0,3]}],"column":9,"state":"healthy","tactic":"chain","read":"the chain: whites right"},
  },
  {
    id: "P12", moment: "junkUp", level: "cc8", seed: 2, ms: 303450, stage: "chain", burns: 0, chain: 1, timeLeft: 2550,
    what: "The chain at CC^1; column 10 goes up next with 1 brown in it, 2.5 s before it goes.",
    cols: ["wbKwwbKK","KbKbwwbKK","KKKbwKKK","bKbbbbKKK","bbbbwKKb","KbbKbwwKb","wbwwwwKK","wwwwwwKKK","wwwwwwww","wbwwwwwww"],
    bot: {"phase":"chain","kind":"wait","technique":null,"label":"Wait","reason":"nothing worth moving: wait for the next column","drags":[],"column":9,"state":"healthy","tactic":"chain","read":"the chain: whites right"},
  },
];
// ---- end of POSITIONS ----

/** The user's verdicts, by position. Add to these, never to POSITIONS. */
export const VERDICTS: Readonly<Record<string, readonly Verdict[]>> = {
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
};

/** Positions the user chose not to give a verdict on, and why: kept, and not asked about again. */
export const SKIPPED: Readonly<Record<string, { date: string; note: string }>> = {
  P11: { date: '13 Nov', note: "Not a real situation: with junk everywhere and whites scattered this late, you're just losing, and something went wrong long before. Its lesson is upstream: the risk reader's job is never to arrive there." },
  P12: { date: '13 Nov', note: "Skipped too: what really went wrong is far earlier. A brown in the column going up with 2.5 s left: maybe a black and a brown crawled over to it, but that's a big if, and you wouldn't get into that situation if you're any good." },
};

/* The themes the user's verdicts fell into (13 Nov: "kind of organize them into the themes for those test
   examples ... we'll test that those are behaving and categorizing the way we want"): each position's theme, and
   what the board reader (src/distill-read.ts) should read there, its state or the tactic in play, tested in
   tests/distill-positions.test.ts. A reading the reader doesn't give yet is `open`, as a verdict is. */
export type Theme = 'trapped' | 'fillFast' | 'quickSort' | 'damage' | 'cracked' | 'patterns' | 'skipped';
/** The themes in order, each in plain words for the page. */
export const THEMES: Readonly<Record<Theme, { name: string; about: string }>> = {
  trapped: { name: 'Trapped whites near the fire, first', about: 'whites at the top of the columns by the fire, junk round them and no way for it to reach them: freed before anything else' },
  fillFast: { name: 'Fill by the fire, fast', about: 'the gaps in the columns by the fire filled with the quickest junk moves, not one white dragged a long way' },
  quickSort: { name: 'Quick sorting while nothing\'s at risk', about: 'time in hand: blacks down, browns up, short and simple' },
  damage: { name: 'Damage control', about: 'a board gone really wrong: the columns by the fire filled however you can, then the stranded junk out left' },
  cracked: { name: 'A cracked board: keep the tools', about: 'junk stranded among the whites: fix it, and keep the browns in the middle to fix it with' },
  patterns: { name: 'The patterns: the ladder and the V', about: 'the right-hand pair sorted into the zigzag\'s ladder before one burns; the V\'s tail sorted so the next sweep runs through' },
  skipped: { name: 'Skipped: lost boards', about: 'boards you\'d never reach if you\'re any good; their lesson is earlier' },
};
/** Each position's theme, and what the board reader should read there. */
export const THEMED: Readonly<Record<string, { theme: Theme; reads?: { state?: BoardState; tactic?: Tactic }; open?: boolean }>> = {
  P1: { theme: 'trapped', reads: { tactic: 'freeTrapped' } },
  P2: { theme: 'trapped', reads: { tactic: 'freeTrapped' } },
  P5: { theme: 'trapped', reads: { tactic: 'freeTrapped' } },
  P6: { theme: 'trapped', reads: { tactic: 'freeTrapped' } },
  P4: { theme: 'fillFast', reads: { tactic: 'fillGaps' } },
  // (the reader says fill the gaps here; the user's verdict was quick sorting: to put to them, 13 Nov)
  P3: { theme: 'quickSort', reads: { tactic: 'quickSort' }, open: true },
  P7: { theme: 'damage', reads: { state: 'damageControl' } },
  P10: { theme: 'cracked', reads: { state: 'cracked', tactic: 'fixCracks' } },
  P8: { theme: 'patterns', reads: { tactic: 'sortLadder' } },
  P9: { theme: 'patterns', reads: { tactic: 'sortTail' } },
  P11: { theme: 'skipped' },
  P12: { theme: 'skipped' },
};

/** The board of a position. */
export const boardOf = (p: Position): Board => parseBoard(p.cols);

/** The bot's move at a position now: the planner as the bot calls it, with its level, stage and the furnace's time. */
export function botAt(p: Position): Advice {
  const cols = boardOf(p), level = levelNamed(p.level);
  return choose({ cols, chain: p.chain, timeLeft: p.timeLeft }, contextFor(cols, p.stage, p.burns, level.reach), level);
}

/** An Advice as a position keeps it. */
export function moveOf(a: Advice): BotMove {
  return {
    phase: a.phase, kind: a.kind, technique: a.sweep ? 'sweep' : (a.technique ?? a.routine ?? null), label: a.label, reason: a.reason,
    drags: a.drags.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] })), ...(a.column !== undefined ? { column: a.column } : {}),
    ...(a.state ? { state: a.state, tactic: a.tactic, read: a.read } : {}),
  };
}

/** Where a drag lets its piece go. */
export function dragEnd(cols: Board, d: Drag): [number, number] {
  let at: [number, number] = [d.x, d.y];
  for (const w of d.ways) { const n = neighbourOn(cols, at[0], at[1], w); if (!n) break; at = n; }
  return at;
}

const whitesIn = (cols: Board, x: number) => cols[x].filter((p) => p === WHITE).length;
const place = ([x, y]: readonly [number, number]) => `column ${x + 1}, row ${y + 1}`;

/** What a move falls short of in a verdict, in plain words; none when it meets it all. */
export function check(p: Position, m: BotMove, e: Expect): string[] {
  const cols = boardOf(p), after = playDrags(cols, m.drags) ?? cols, out: string[] = [];
  const first = m.drags[0];
  if (e.phase && m.phase !== e.phase) out.push(`its phase is ${m.phase}, not ${e.phase}`);
  if (e.kind && m.kind !== e.kind) out.push(`it chose to ${m.kind}, not ${e.kind}`);
  if (e.noBurn && m.kind === 'burn') out.push('it burns');
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
    const h = (x: number, y: number) => y + (cols[x].length === TALL ? 0 : 0.5);
    const ok = !!first && !!end && ((held === BLACK && h(...end) > h(first.x, first.y)) || (held === BROWN && h(...end) < h(first.x, first.y)));
    if (!ok) out.push("its first drag isn't a black taken down or a brown taken up");
  }
  if (e.fills !== undefined) {
    const held = first && cols[first.x][first.y], end = first && dragEnd(cols, first);
    const want = typeof e.fills === 'number' ? [e.fills] : e.fills;
    const ok = !!end && (held === BLACK || held === BROWN) && want.includes(end[0]) && cols[end[0]][end[1]] === WHITE;
    if (!ok) out.push(`its first drag doesn${"'"}t carry junk into a white${"'"}s place in column ${want.map((x) => x + 1).join(' or ')}`);
  }
  if (e.ladder) {
    const held = first && cols[first.x][first.y], end = first && dragEnd(cols, first);
    const h = (x: number, y: number) => y + (cols[x].length === TALL ? 0 : 0.5);
    const ok = !!first && !!end && ((held === BLACK && h(...end) < h(first.x, first.y)) || (held === BROWN && h(...end) > h(first.x, first.y)));
    if (!ok) out.push("its first drag isn't a black taken up or a brown taken down");
  }
  if (e.ends) {
    const end = first && dragEnd(cols, first);
    if (!end || end[0] !== e.ends[0] || end[1] !== e.ends[1]) out.push(`its first drag ends ${end ? `at ${place(end)}` : 'nowhere'}, not ${place(e.ends)}`);
  }
  if (typeof e.frees === 'number' && whitesIn(after, e.frees) >= whitesIn(cols, e.frees)) out.push(`no white leaves column ${e.frees + 1}`);
  if (Array.isArray(e.frees) && after[e.frees[0]][e.frees[1]] === WHITE) out.push(`the white at ${place(e.frees)} is still there`);
  if (e.freesAny && e.freesAny.every(([x, y]) => after[x][y] === WHITE)) out.push(`none of the whites at ${e.freesAny.map(place).join(' or ')} is freed`);
  if (e.keeps) for (const [x, y] of e.keeps) if (after[x][y] !== cols[x][y]) out.push(`it moves the piece at ${place([x, y])}`);
  if (e.clean !== undefined && after[e.clean].some(isJunk)) out.push(`column ${e.clean + 1} still holds junk`);
  if (e.uses && m.technique !== e.uses) out.push(`it plays ${m.technique ?? 'nothing'}, not ${e.uses}`);
  if (e.avoids && m.technique && e.avoids.includes(m.technique)) out.push(`it plays ${m.technique}`);
  if (e.longest !== undefined) {
    const n = Math.max(0, ...m.drags.map((d) => d.ways.length));
    if (n < e.longest) out.push(`its longest drag is ${n} swap${n === 1 ? '' : 's'}, not ${e.longest} or more`);
  }
  return out;
}
