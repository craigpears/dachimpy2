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
import type { Board } from './distilling.js';
import { chainContext, choose, contextFor, levelNamed } from './distill-bots.js';
import type { Advice, Technique } from './distill-bots.js';
import { isJunk, playDrags } from './distill-routines.js';
import type { Drag } from './distill-routines.js';
import type { Phase } from './distill-phase.js';
import type { BoardState, Tactic } from './distill-read.js';

/** The kinds of moment picked, each a couple of times. */
export type Moment = 'low' | 'edge' | 'stuck' | 'junkUp' | 'block' | 'early' | 'chain' | 'read';
/** Each kind in plain words, for the page. */
export const MOMENTS: Readonly<Record<Moment, string>> = {
  low: 'Whites low by the fire',
  edge: 'A white on an edge or by a spice, near the fire',
  stuck: 'Waiting, with something stuck',
  junkUp: 'A column about to go up with junk in it',
  block: 'The block phase',
  early: 'Early on, the fire\'s side',
  chain: 'The chain under way',
  read: 'Picked for how the board reader reads it',
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
  /** Each drag named (src/distill-goals.ts): its tricks and its goal in plain words (null: none, a half move). */
  steps?: { name: string; goal: string | null }[];
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
  /** Its next few moves from there, played forward, and the aim they reach (`planOf`), when the tool last ran. */
  plan?: PlanKept;
  /** A batch to judge (tools/distill-positions.mjs's `batch`, 13 Nov), not judged yet: 'random', telling moments from
      fresh play; 'challenge', a board the reader reads as a judged theme's, `like` the judged position it reads as. */
  batch?: Batch;
  like?: string;
}
/** The parts of a batch to judge. */
export type Batch = 'random' | 'challenge';
export const BATCHES: Readonly<Record<Batch, { name: string; about: string }>> = {
  random: { name: 'Random', about: 'telling moments from fresh bot play, on levels and deals not used before' },
  challenge: { name: 'The theme challenge', about: 'for each theme you judged, boards from other games that the board reader reads the same way: is it right that they\'re alike?' },
};
/** The one question each new position asks (the user, 13 Nov: a batch to "speed through"). */
export const QUESTION = 'Is this the right idea? If not, what would you do?';
/** A position's plan as kept (src/distill-ahead.ts): each move's board, label and drags, each drag named; the aim, the
    move by which it's done (1 on; null, not), and why the plan stops. */
export interface PlanKept {
  aim: string | null; reached: number | null; through?: boolean; ends: string;
  moves: { cols: string[]; label: string; drags: Drag[]; steps: { name: string; goal: string | null }[] }[];
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
    bot: {"phase":"fire","kind":"move","technique":"rescue","label":"Save the whites","reason":"free the trapped whites: nothing frees the white at column 8, row 2 yet: open the way to it: a short drag beside it, the pieces round it set moving","drags":[{"x":8,"y":2,"ways":[0]}],"state":"atRisk","tactic":"freeTrapped","read":"2 whites trapped near the fire (column 8, row 2, column 8, row 9), the worst first","steps":[{"name":"the ladder","goal":"set the pieces round column 8's white in row 2 moving"}]},
    plan: {"aim":"free column 8's white in row 2","reached":4,"through":false,"ends":"5 moves","moves":[{"cols":["wwbKwbKb","KwKKKb*Kw","bbwwKwww","*bwwKKbwb","wwwKbwbb","K*KKbwwbb","wKKbbKww","bwwKKKbww","bbKbbbbb","KKbKKKKKK"],"label":"Save the whites","drags":[{"x":8,"y":2,"ways":[0]}],"steps":[{"name":"the ladder","goal":"set the pieces round column 8's white in row 2 moving"}]},{"cols":["wwbKwbKb","KwKKKb*Kw","bbwwKwww","*bwwKKbwb","wwwKbwbb","K*KKbwwbb","wKKbbKww","bwwKKKbww","bbbbbbbb","KKKKKKKKK"],"label":"Save the whites","drags":[{"x":7,"y":2,"ways":[1]}],"steps":[{"name":"the climb","goal":"open the way to column 8's white in row 2"}]},{"cols":["wwbKwbKb","KwKKKb*Kw","bbwwKwww","*bwwKKbwb","wwwKbwbb","K*KKbwwbb","wwKbbKww","bwKKKKbww","bbbbbbbb","KKKKKKKKK"],"label":"Save the whites","drags":[{"x":6,"y":5,"ways":[2,3,3,2,3]}],"steps":[{"name":"the drop","goal":"free column 8's bottom white"}]},{"cols":["wwbKwbKb","KwKKKb*Kw","bbwwKwww","*bwwKKbwb","wwwKbwbb","K*KKbwwbb","wwKbbwww","bwKKKKbwK","bbbbbbbb","KKKKKKKKK"],"label":"Save the whites","drags":[{"x":0,"y":2,"ways":[3,0,0,0,3,0]},{"x":7,"y":1,"ways":[2]}],"steps":[{"name":"the ladder, then the lift, then the ladder, then the lift","goal":"set the pieces round column 8's white in row 2 moving"},{"name":"the sink","goal":"free column 8's white in row 2"}]},{"cols":["wwKKwbKb","KwKwKb*Kw","bbwwKwww","*bwwKKbwb","wKwKbwbb","K*wKbwwbb","wwKbbwww","bbKKKKbwK","bbbbbbbb","KKKKKKKKK"],"label":"The sweep","drags":[{"x":3,"y":5,"ways":[3,3,3,3,0]}],"steps":[{"name":"the drop, then the ladder","goal":"fill column 8's gap: its white out left before it burns"}]}]},
  },
  {
    id: "P2", moment: "early", level: "cc3", seed: 3, ms: 16200, stage: "junk", burns: 0, chain: 0, timeLeft: 14400,
    what: "16.2 s into the session: 3 whites still in the three columns by the fire, 14.4 s before the first goes.",
    cols: ["bKKbwbwK","bKKwKwKwK","KKwbKbwK","KKKwww*ww","KbbKwKbw","wKKwwwwKK","KKbbbKbw","wKKbbbKwb","wKKKKKKK","bbbKbKKKb"],
    bot: {"phase":"fire","kind":"move","technique":"rescue","label":"Save the whites","reason":"free the trapped whites: a piece near the white at column 9, row 1 taken round into its place","drags":[{"x":9,"y":1,"ways":[1,2,3,0]}],"state":"atRisk","tactic":"freeTrapped","read":"2 whites trapped near the fire (column 9, row 1, column 8, row 1), the worst first","steps":[{"name":"the lift, then the ladder, then the lift","goal":"free column 9's top white"}]},
    plan: {"aim":"free column 9's top white","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["bKKbwbwK","bKKwKwKwK","KKwbKbwK","KKKwww*ww","KbbKwKbw","wKKwwwwKK","KKbbbKbw","wKKbbbKwb","wKKKKKKK","bbbKbKKKb"],"label":"Save the whites","drags":[{"x":9,"y":1,"ways":[1,2,3,0]}],"steps":[{"name":"the lift, then the ladder, then the lift","goal":"free column 9's top white"}]},{"cols":["bKKbwbwK","bKKwKwKwK","KKwbKbwK","KKKwww*ww","KbbKwKbw","wKKwwwwKK","KKbbbKbw","wKKbbbKwb","KwKKKKKK","bbbKbKKKb"],"label":"Save the whites","drags":[{"x":7,"y":1,"ways":[3]}],"steps":[{"name":"the drop","goal":"fill column 9's gap: column 9's white in row 2 out left"}]},{"cols":["bKKbwbwK","bKKwKwKwK","KKwbKbwK","KKKwww*ww","KbbKwKbw","wKKwwwwKK","KKbbbKbw","wwKbbbKwb","KKKKKKKK","bbbKbKKKb"],"label":"Bring a piece round","drags":[{"x":6,"y":0,"ways":[3]},{"x":9,"y":0,"ways":[2,2,1,0]}],"steps":[{"name":"the drop","goal":"open the way to column 8's top white"},{"name":"the ladder, then the lift","goal":"free column 8's top white"}]},{"cols":["bKKbwbwK","bKKwKwKwK","KKwbKbwK","KKKwww*ww","KbbKwKbw","wKKwwwwKK","wKbbbKbw","bwKbbbKwb","KKKKKKKK","KbbKbKKKb"],"label":"The sweep","drags":[{"x":9,"y":1,"ways":[2,1,1,1]}],"steps":[{"name":"the ladder, then the lift","goal":"open the way to column 8's white in row 2"}]},{"cols":["bKKbwbwK","bKKwKwKwK","KKwbKbwK","KKKwww*ww","KbbKwKbw","bKKwwwwKK","wKbbbKbw","bwKbbbKwb","KwKKKKKK","KKbKbKKKb"],"label":"The sweep","drags":[{"x":4,"y":0,"ways":[0,3,3,3]}],"steps":[{"name":"the ladder, then the drop","goal":"free column 9's white in row 2"}]}]},
  },
  {
    id: "P3", moment: "low", level: "cc3", seed: 2, ms: 207200, stage: "junk", burns: 0, chain: 0, timeLeft: 7000,
    what: "2 whites in the bottom rows of the two columns by the fire, 7.0 s before the furnace takes column 10.",
    cols: ["wKwwKwKK","KKbKwKKKK","bbKbbbwK","bbbbbbbbK","KbwwbwKK","K*bwwwwwK","wbbwKwwK","wKbbbwKKb","bKKKbKww","KKKbb*bKK"],
    bot: {"phase":"fire","kind":"move","technique":"diamond","label":"The diamond","reason":"bring in another piece: drag the black at column 6, row 1 into the gap, then the brown at column 4, row 1 over past it","drags":[{"x":5,"y":0,"ways":[3]},{"x":3,"y":0,"ways":[3,0,3]}],"state":"atRisk","tactic":"quickSort","read":"2 whites by the fire free to go, with time in hand (column 9, row 8, column 9, row 7): the quick sorting moves, blacks down and browns up, fill their places","steps":[{"name":"the drop","goal":"carry the black over to the colour in column 7"},{"name":"the ladder, then the lift, then the ladder","goal":"free column 8's top white, stuck"}]},
    plan: {"aim":"free column 8's top white, stuck","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["wKwwKwKK","KKbKwKKKK","bbKbbbwK","bbbbbbbbK","KbwwbwKK","K*bwwwwwK","wbbwKwwK","wKbbbwKKb","bKKKbKww","KKKbb*bKK"],"label":"The diamond","drags":[{"x":5,"y":0,"ways":[3]},{"x":3,"y":0,"ways":[3,0,3]}],"steps":[{"name":"the drop","goal":"carry the black over to the colour in column 7"},{"name":"the ladder, then the lift, then the ladder","goal":"free column 8's top white, stuck"}]},{"cols":["wKwwKwKK","KKbKwKKKK","bbKbbbwK","KbbbbbbbK","wbwwbwKK","K*bwwwwwK","bbbwKwwK","wKbbbwKKb","bKKKbKww","KKKbb*bKK"],"label":"The sweep","drags":[{"x":2,"y":2,"ways":[0,3,3,3,0]}],"steps":[{"name":"the ladder, then the drop, then the ladder","goal":"carry the black over to the colour in column 8"}]},{"cols":["wKwwKwKK","KKbKwKKKK","bbbbbbwK","KbwbbbbbK","wbwwbwKK","K*bwwwwwK","bbbbKwwK","wKbKbwKKb","bKKKbKww","KKKbb*bKK"],"label":"The sweep","drags":[{"x":3,"y":6,"ways":[3,0,0]}],"steps":[{"name":"the ladder, then the lift","goal":"carry the brown over to the colour in column 7"}]},{"cols":["wKwwKwKK","KKbKwKKKK","bbbbbbwK","KbwbbbKbK","wbwwbwwK","K*bwwwwwK","bbbbKbwK","wKbKbwKKb","bKKKbKww","KKKbb*bKK"],"label":"The sweep","drags":[{"x":6,"y":4,"ways":[3,0,0]}],"steps":[{"name":"the drop, then the ladder","goal":"fill column 8's gap: its white further from the fire"}]},{"cols":["wKwwKwKK","KKbKwKKKK","bbbbbbwK","KbwbbbKbK","wbwwbwwK","K*bwwwwwK","bbbbwbwK","wKbKbbKKb","bKKKbKww","KKKbK*bKK"],"label":"Save the whites","drags":[{"x":7,"y":6,"ways":[3,0]}],"steps":[{"name":"the drop, then the ladder","goal":"fill column 9's gap: its white further from the fire"}]}]},
  },
  {
    id: "P4", moment: "low", level: "cc3", seed: 1, ms: 5650, stage: "junk", burns: 0, chain: 0, timeLeft: 9650,
    what: "2 whites in the bottom rows of the two columns by the fire, 9.7 s before the furnace takes column 10.",
    cols: ["KwKKKb*Kw","bbwbKwww","*bwwKKbwb","bKwKbbKb","K*wKbbwKb","wKKbKKbw","wwwKKbbww","bwKbwbbK","KKbKKKwbw","KKKKKKKK"],
    bot: {"phase":"fire","kind":"move","technique":"rescue","label":"Save the whites","reason":"fill the gaps: junk raced into a white's place (column 9, row 7, column 9, row 9), and it's out left","drags":[{"x":7,"y":6,"ways":[0]}],"state":"atRisk","tactic":"fillGaps","read":"2 whites by the fire with their columns burning soon (column 9, row 7, column 9, row 9): junk into their places, the quickest first","steps":[{"name":"the lift","goal":"fill column 9's gap: column 9's white in row 7 out left"}]},
    plan: {"aim":"fill column 9's gap: column 9's white in row 7 out left","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["KwKKKb*Kw","bbwbKwww","*bwwKKbwb","bKwKbbKb","K*wKbbwKb","wKKbKKbw","wwwKKbbww","bwKbwbbK","KKbKKKwbw","KKKKKKKK"],"label":"Save the whites","drags":[{"x":7,"y":6,"ways":[0]}],"steps":[{"name":"the lift","goal":"fill column 9's gap: column 9's white in row 7 out left"}]},{"cols":["KwKKKb*Kw","bbwbKwww","*bwwKKbwb","bKwKbbKb","K*wKbbwKb","wKKbKKbw","wwwKKbbww","bwKbwbwK","KKbKKKbbw","KKKKKKKK"],"label":"Save the whites","drags":[{"x":7,"y":7,"ways":[3]}],"steps":[{"name":"the drop","goal":"fill column 9's gap: its white further from the fire"}]},{"cols":["KwKKKb*Kw","bbwbKwww","*bwwKKbwb","bKwKbbKb","K*wKbbwKb","wKKbKKbw","wwwKKbbww","bwKbwbww","KKbKKKbbK","KKKKKKKK"],"label":"The sweep","drags":[{"x":4,"y":7,"ways":[0,3,3]}],"steps":[{"name":"the ladder, then the drop","goal":"free column 8's bottom white"}]},{"cols":["KwKKKb*Kw","bbwbKwww","*bwwKKbwb","bKwKbbKb","K*wKbbwbb","wKKbKKww","wwwKKbbww","bwKbwbwK","KKbKKKbbK","KKKKKKKK"],"label":"The sweep","drags":[{"x":4,"y":0,"ways":[3,3,3]}],"steps":[{"name":"the drop","goal":"free column 8's white in row 2"}]},{"cols":["KwKKKb*Kw","bbwbKwww","*bwwKKbwb","bKwKbbKb","w*wKbbwbb","wKKbKKww","wwwKKbbww","bKKbwbwK","KKbKKKbbK","KKKKKKKK"],"label":"Save the whites","drags":[{"x":5,"y":5,"ways":[2,3,3,2,3]}],"steps":[{"name":"the drop","goal":"fill column 7's gap: its white further from the fire"}]}]},
  },
  {
    id: "P5", moment: "edge", level: "cc8", seed: 3, ms: 170750, stage: "junk", burns: 0, chain: 0, timeLeft: 12850,
    what: "A white at the top of column 8, 2 columns from the fire, and 4 more whites on an edge or by a spice near it; 12.8 s on the furnace.",
    cols: ["xbKKKwww","wbbbKwwww","K*xwKwKK","KwwwwKwKw","bwwwwwww","bbwwwwwKw","b*wwwwbw","wwwwwwwww","bbwbbKKK","b***KKKKK"],
    bot: {"phase":"block","kind":"move","technique":"diamond","label":"The diamond","reason":"free the trapped whites: bring in another piece: drag the black at column 3, row 1 into the gap, then the brown at column 6, row 2 over past it","drags":[{"x":2,"y":0,"ways":[3,3,0,0,3]},{"x":5,"y":1,"ways":[0]}],"state":"atRisk","tactic":"freeTrapped","read":"3 whites trapped near the fire (column 8, row 2, column 9, row 3, column 8, row 3), the worst first","steps":[{"name":"the drop, then the ladder, then the drop","goal":"free column 8's white in row 2"},{"name":"the lift","goal":"free column 8's top white, stuck"}]},
    plan: {"aim":"free column 8's top white, stuck","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["xbKKKwww","wbbbKwwww","K*xwKwKK","KwwwwKwKw","bwwwwwww","bbwwwwwKw","b*wwwwbw","wwwwwwwww","bbwbbKKK","b***KKKKK"],"label":"The diamond","drags":[{"x":2,"y":0,"ways":[3,3,0,0,3]},{"x":5,"y":1,"ways":[0]}],"steps":[{"name":"the drop, then the ladder, then the drop","goal":"free column 8's white in row 2"},{"name":"the lift","goal":"free column 8's top white, stuck"}]},{"cols":["xbKKKwww","wbbbKwwww","w*xwKwKK","KwwwwKwKw","bbwwwwww","bwwwwwwKw","b*wwwwbw","wKwwwwwww","bbwbbKKK","b***KKKKK"],"label":"Save the whites","drags":[{"x":8,"y":4,"ways":[1,1,0]}],"steps":[{"name":"the lift","goal":"open the way to column 9's white in row 3"}]},{"cols":["xbKKKwww","wbbbKwwww","w*xwKwKK","KwwwwKwKw","bbwwwwww","bwwwwwwKw","b*wwwwbw","wKwbwwwww","bbwbwKKK","b***KKKKK"],"label":"The crawl","drags":[{"x":6,"y":6,"ways":[0,1,0,0]},{"x":5,"y":7,"ways":[3,3]}],"steps":[{"name":"the lift","goal":"free column 9's white in row 5"},{"name":"the drop","goal":"fill column 8's gap: its white out left before it burns"}]},{"cols":["xbKKKwww","wbbbKwwww","w*xwKwKK","KwwwwKwKw","bbwwwwww","bwwwwwwww","b*wwwwww","wKwbwwwwK","bbwbbKKK","b***KKKKK"],"label":"Save the whites","drags":[{"x":7,"y":3,"ways":[0]}],"steps":[{"name":"the lift","goal":"fill column 9's gap: its white further from the fire"}]},{"cols":["xbKKKwww","wbbbKwwww","w*xwKwKK","KwwwwKwKw","bbwwwwww","bwwwwwwww","b*wwwwww","wKwwwwwwK","bbbbbKKK","b***KKKKK"],"label":"The sweep","drags":[{"x":0,"y":2,"ways":[0,3,3,3,3,3,3,0]}],"steps":[{"name":"the ladder, then the drop, then the ladder","goal":"free column 8's white in row 6"}]}]},
  },
  {
    id: "P6", moment: "edge", level: "cc3", seed: 2, ms: 200900, stage: "junk", burns: 0, chain: 0, timeLeft: 13300,
    what: "A white at the top of column 8, 2 columns from the fire, and 4 more whites on an edge or by a spice near it; 13.3 s on the furnace.",
    cols: ["wKwwKwKK","KKbKwKKKK","bbKbKKwK","bbbbbbbbK","KbwbbbKK","b*bwbbwwK","KbbwwwwK","wKbbwwKKb","wKKKwwww","KKKbb*bKK"],
    bot: {"phase":"fire","kind":"move","technique":"rescue","label":"Save the whites","reason":"free the trapped whites: a white stuck in a column to burn: bring the brown at column 6, row 1 beside it, then drag it out left","drags":[{"x":5,"y":0,"ways":[3,3]},{"x":8,"y":0,"ways":[2,1]}],"state":"atRisk","tactic":"freeTrapped","read":"4 whites trapped near the fire (column 9, row 1, column 9, row 6, column 9, row 5 and 1 more), the worst first","steps":[{"name":"the ladder","goal":"open the way to column 9's top white"},{"name":"the weave","goal":"free column 9's top white"}]},
    plan: {"aim":"free column 9's top white","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["wKwwKwKK","KKbKwKKKK","bbKbKKwK","bbbbbbbbK","KbwbbbKK","b*bwbbwwK","KbbwwwwK","wKbbwwKKb","wKKKwwww","KKKbb*bKK"],"label":"Save the whites","drags":[{"x":5,"y":0,"ways":[3,3]},{"x":8,"y":0,"ways":[2,1]}],"steps":[{"name":"the ladder","goal":"open the way to column 9's top white"},{"name":"the weave","goal":"free column 9's top white"}]},{"cols":["wKwwKwKK","KKbKwKKKK","bbKbKKwK","bbbbbbbbK","KbwbbbKK","K*bwbbwwK","wbbwwwwK","wKbbwwKKb","bKKKwwww","KKKbb*bKK"],"label":"The sweep","drags":[{"x":2,"y":5,"ways":[0,0,0,3,3,3]}],"steps":[{"name":"the ladder, then the drop","goal":"free column 9's white in row 6"}]},{"cols":["wKwwKwKK","KKbKwKKKK","bbKbKbwK","bbbbbbbbK","KbwbbbKK","K*bwwbwwK","wbbwwwwK","wKbbwwKKb","bKKKwKww","KKKbb*bKK"],"label":"The sweep","drags":[{"x":3,"y":6,"ways":[3,0,0,0,0]}],"steps":[{"name":"the ladder, then the lift","goal":"free column 9's white in row 5"}]},{"cols":["wKwwKwKK","KKbKwKKKK","bbKbKbwK","bbbbbbKbK","KbwbbbwK","K*bwwbwwK","wbbwwwwK","wKbbwwKKb","bKKKbKww","KKKbb*bKK"],"label":"The sweep","drags":[{"x":2,"y":2,"ways":[0,3,3,3,3]}],"steps":[{"name":"the ladder, then the drop","goal":"fill column 8's gap: its white out left before it burns"}]},{"cols":["wKwwKwKK","KKbKwKKKK","bbbbKbwK","bbwbbbKbK","KbwbbbwK","K*bwwbwwK","wbbwwwwK","wKbbKwKKb","bKKKbKww","KKKbb*bKK"],"label":"The diamond","drags":[{"x":5,"y":0,"ways":[3]},{"x":3,"y":0,"ways":[3,0,3]}],"steps":[{"name":"the drop","goal":"make way for drag 2"},{"name":"the ladder, then the lift, then the ladder","goal":"free column 8's top white, stuck"}]}]},
  },
  {
    id: "P7", moment: "stuck", level: "cc8", seed: 2, ms: 588900, stage: "junk", burns: 0, chain: 0, timeLeft: 7800,
    what: "The bot waits, with 8 pieces stuck (white and brown and black), 5 whites in columns 8 and 9 by the fire with no way out left on their own, 2 of them low down; 7.8 s on the furnace.",
    cols: ["bwKwKKwKK","Kw*wwwbw","ww*www*Kw","bwwwwwww","bwwwwww*K","wwwwwwwK","wwwwbwKww","bwbwwKwK","bwwwbwwKK","bbbKbKKK"],
    bot: {"phase":"block","kind":"move","technique":"rescue","label":"Save the whites","reason":"fill the gaps: junk raced into a white's place (column 9, row 6, column 9, row 2, column 9, row 4), and it's out left","drags":[{"x":6,"y":4,"ways":[0,0]}],"state":"damageControl","tactic":"fillGaps","read":"5 whites still in column 9, 23 s from the fire, and junk free for 1 column: fill its gaps however you can, the quickest first","steps":[{"name":"the lift","goal":"fill column 9's gap: column 9's white in row 4 out left"}]},
    plan: {"aim":"fill column 9's gap: column 9's white in row 4 out left","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["bwKwKKwKK","Kw*wwwbw","ww*www*Kw","bwwwwwww","bwwwwww*K","wwwwwwwK","wwwwbwKww","bwbwwKwK","bwwwbwwKK","bbbKbKKK"],"label":"Save the whites","drags":[{"x":6,"y":4,"ways":[0,0]}],"steps":[{"name":"the lift","goal":"fill column 9's gap: column 9's white in row 4 out left"}]},{"cols":["bwKwKKwKK","Kw*wwwbw","ww*www*Kw","bwwwwwww","bwwwwww*K","wwwwwwwK","wwwwwwKww","bwbwwKwK","bwwbbwwKK","bbbKbKKK"],"label":"Save the whites","drags":[{"x":7,"y":2,"ways":[1,0,0]}],"steps":[{"name":"the lift","goal":"fill column 9's gap: column 9's white in row 2 out left"}]},{"cols":["bwKwKKwKK","Kw*wwwbw","ww*www*Kw","bwwwwwww","bwwwwww*K","wwwwwwwK","wwwwwwKww","bwwwwKwK","bbwbbwwKK","bbbKbKKK"],"label":"Save the whites","drags":[{"x":1,"y":6,"ways":[3,0,0,0,0,3]},{"x":8,"y":5,"ways":[2,1]}],"steps":[{"name":"the ladder, then the lift, then the ladder","goal":"open the way to column 9's white in row 6"},{"name":"the weave","goal":"free column 9's white in row 6"}]},{"cols":["bwKwKKwKK","Kw*wwwKw","ww*www*ww","bwwwwwww","bwwwwww*K","wwwwwwwK","wwwwwwKww","bwwwwKwK","bbwbbbwKK","bbbKbKKK"],"label":"Turn the right side over","drags":[{"x":9,"y":3,"ways":[1,0]}],"steps":[{"name":"the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]},{"cols":["bwKwKKwKK","Kw*wwwKw","ww*www*ww","bwwwwwww","bwwwwww*K","wwwwwwwK","wwwwwwKww","bwwwwKwK","bbwbbbwKK","bbKbbKKK"],"label":"Turn the right side over","drags":[{"x":9,"y":5,"ways":[1,0,1,0]}],"steps":[{"name":"the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]}]},
  },
  {
    id: "P8", moment: "stuck", level: "cc8", seed: 3, ms: 197950, stage: "junk", burns: 0, chain: 0, timeLeft: 950,
    what: "The bot waits, with 9 pieces stuck (white), 4 whites in column 8 by the fire with no way out left on their own, 2 of them low down; 0.9 s on the furnace.",
    cols: ["bKwwwwK*w","xbwwwwww","wbxwwwwww","w*wwwwKK","wwwwwwwww","bwwwwwKK","bbwwwwwww","b*wwKwwK","bKbbbKKKK","bbbKKKKK"],
    bot: {"phase":"block","kind":"move","technique":"turnOver","label":"Turn the right side over","reason":"sort the ladder: columns 9 and 10 sorted, blacks over browns, the ladder the zigzag climbs, before column 10 goes","drags":[{"x":8,"y":1,"ways":[0]}],"state":"atRisk","tactic":"sortLadder","read":"columns 9 and 10 aren't sorted blacks over browns, and column 10 goes in 0.9 s: sort the ladder before it's lost","steps":[{"name":"the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]},
    plan: {"aim":"sort columns 9 and 10, blacks over browns, before column 10 goes","reached":1,"through":true,"ends":"it waits","moves":[{"cols":["bKwwwwK*w","xbwwwwww","wbxwwwwww","w*wwwwKK","wwwwwwwww","bwwwwwKK","bbwwwwwww","b*wwKwwK","bKbbbKKKK","bbbKKKKK"],"label":"Turn the right side over","drags":[{"x":8,"y":1,"ways":[0]}],"steps":[{"name":"the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]}]},
  },
  {
    id: "P9", moment: "block", level: "cc8", seed: 1, ms: 102000, stage: "junk", burns: 0, chain: 0, timeLeft: 5100,
    what: "Whites mostly left (40 on the board); the junk being moved in blocks and wrapped round them in a V. 5.1 s on the furnace.",
    cols: ["KwwwKKwbw","ww*wbwKK","wbwww*bKw","bwwwwwww","wwwwwwwwK","wwwwKbKK","wbbwww*bw","bwbwbKbK","*KKKKKKKK","bKKKKKbK"],
    bot: {"phase":"block","kind":"move","technique":"turnOver","label":"Turn the right side over","reason":"sort the tail: a brown sunk down through the blacks at the V's bottom, so the next sweep runs through","drags":[{"x":7,"y":6,"ways":[3,3,2]}],"state":"atRisk","tactic":"sortTail","read":"the V's tail unsorted (column 7, row 8, column 8, row 7): browns down through the blacks, so the next sweep runs through","steps":[{"name":"the ladder","goal":"sort the V's tail: the brown down through the blacks, so the next sweep runs through"}]},
    plan: {"aim":"sort the V's tail: the brown down through the blacks, so the next sweep runs through","reached":1,"through":true,"ends":"the furnace takes the next column","moves":[{"cols":["KwwwKKwbw","ww*wbwKK","wbwww*bKw","bwwwwwww","wwwwwwwwK","wwwwKbKK","wbbwww*bw","bwbwbKbK","*KKKKKKKK","bKKKKKbK"],"label":"Turn the right side over","drags":[{"x":7,"y":6,"ways":[3,3,2]}],"steps":[{"name":"the ladder","goal":"sort the V's tail: the brown down through the blacks, so the next sweep runs through"}]},{"cols":["KwwwKKwbw","ww*wbwKK","wbwww*bKw","bwwwwwww","wwwwwwwwK","wwwwKbKK","wbbwww*bw","bwbwbKKK","*KKKKKKKb","bKKKKKbK"],"label":"Turn the right side over","drags":[{"x":6,"y":7,"ways":[2,2]}],"steps":[{"name":"the ladder","goal":"sort the V's tail: the brown down through the blacks, so the next sweep runs through"}]},{"cols":["KwwwKKwbw","ww*wbwKK","wbwww*bKw","bwwwwwww","wwwwwwwwb","wwwwKbKK","wbbwww*Kw","bwbwbKKK","*KKKKKKKb","bKKKKKbK"],"label":"The sweep","drags":[{"x":6,"y":2,"ways":[0,3,3]}],"steps":[{"name":"the lift, then the ladder","goal":"fill column 8's gap: its white further from the fire"}]},{"cols":["KwwwKKwbw","ww*wbwKK","wbwww*bKw","bwwwwwww","wwwwwwwwb","wwwwKbKK","wbwwww*Kw","bKbwbKKK","*KKKKKKKb","bKbKKKbK"],"label":"Turn the right side over","drags":[{"x":9,"y":2,"ways":[2,3,2,3,2,3]}],"steps":[{"name":"the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]},{"cols":["KwwwKKwbw","ww*wbwKK","wbwww*bKw","bwwwwwww","wwwwwwwwb","wwwwKbKK","wbwwww*Kw","bKbwbKKK","*KKKKKKKb","bKKKKbbK"],"label":"The crawl","drags":[{"x":5,"y":4,"ways":[3]},{"x":5,"y":5,"ways":[1,0,0,0]}],"steps":[{"name":"the drop","goal":"fill column 7's gap: its white further from the fire"},{"name":"the lift","goal":"fill column 8's gap: its white further from the fire"}]}]},
  },
  {
    id: "P10", moment: "block", level: "cc8", seed: 2, ms: 160050, stage: "junk", burns: 0, chain: 0, timeLeft: 8250,
    what: "Whites mostly left (44 on the board); the junk being moved in blocks and wrapped round them in a V. 8.3 s on the furnace.",
    cols: ["bbwwbwwKK","wbbbwwww","K*wwwwwwK","wbbwwwww","wwwwwwKww","bwwwbwww","wwwwb*wwK","bbwwwbKK","bbbbbbbK*","bbbKbbbK"],
    bot: {"phase":"block","kind":"move","technique":"store","label":"Store the junk","reason":"fix the cracks: store the junk: the black at column 3, row 1 can't cross yet: take it back to the junk on the left before it's trapped","drags":[{"x":2,"y":0,"ways":[2]}],"state":"cracked","tactic":"fixCracks","read":"14 pieces of junk stranded among the whites (column 1, row 1, column 1, row 2, column 1, row 5 and 11 more): free them, keeping the browns in the middle to do it with","steps":[{"name":"the drop","goal":"free the stranded brown at column 1, row 1"}]},
    plan: {"aim":"free the stranded brown at column 1, row 1","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["bbwwbwwKK","wbbbwwww","K*wwwwwwK","wbbwwwww","wwwwwwKww","bwwwbwww","wwwwb*wwK","bbwwwbKK","bbbbbbbK*","bbbKbbbK"],"label":"Store the junk","drags":[{"x":2,"y":0,"ways":[2]}],"steps":[{"name":"the drop","goal":"free the stranded brown at column 1, row 1"}]},{"cols":["bbwwbwwKK","Kbbbwwww","w*wwwwwwK","wbbwwwww","wwwwwwKww","bwwwbwww","wwwwb*wwK","bbwwwbKK","bbbbbbbK*","bbbKbbbK"],"label":"Store the junk","drags":[{"x":3,"y":2,"ways":[1]}],"steps":[{"name":"the lift","goal":"free the stranded brown at column 2, row 2"}]},{"cols":["bbwwbwwKK","Kbbbwwww","w*bwwwwwK","wbwwwwww","wwwwwwKww","bwwwbwww","wwwwb*wwK","bbwwwbKK","bbbbbbbK*","bbbKbbbK"],"label":"Turn the right side over","drags":[{"x":8,"y":7,"ways":[0]}],"steps":[{"name":"the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]},{"cols":["bbwwbwwKK","Kbbbwwww","w*bwwwwwK","wbwwwwww","wwwwwwKww","bwwwbwww","wwwwb*wwK","bbwwwbKK","bbbbbbbb*","bbbKbbKK"],"label":"Save the whites","drags":[{"x":8,"y":5,"ways":[1]}],"steps":[{"name":"the lift","goal":"free column 8's white in row 5"}]},{"cols":["bbwwbwwKK","Kbbbwwww","w*bwwwwwK","wbwwwwww","wwwwwwKww","bwwwbwww","wwwwb*wwK","bbwwbbKK","bbbbbwbb*","bbbKbbKK"],"label":"Turn the right side over","drags":[{"x":9,"y":3,"ways":[1,0,1,0,1,0]}],"steps":[{"name":"the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]}]},
  },
  {
    id: "P11", moment: "junkUp", level: "cc3", seed: 1, ms: 135200, stage: "chain", burns: 0, chain: 2, timeLeft: 2500,
    what: "The chain at CC^2; column 10 goes up next with 1 brown in it, 2.5 s before it goes.",
    cols: ["wwKbKbbKb","KKbKbKbK","bbwbKbKbK","bK*KbwKK","bKKwK*KKb","wKwKbKKK","wwwKKbKKb","wwwbbKbw","bwwwwK*ww","wwwwwbww"],
    bot: {"phase":"chain","kind":"move","technique":"path","label":"Bring a piece round","reason":"the brown at column 10, row 6 is stuck: bring the white at column 8, row 8 round, looping, to take its place, and it's out left","drags":[{"x":7,"y":7,"ways":[1,1,0,0,0,3]}],"column":9,"state":"healthy","tactic":"chain","read":"the chain: whites right","steps":[{"name":"the weave","goal":"clear column 10's junk for the Crystal Clear"}]},
    plan: {"aim":"clear column 10's junk for the Crystal Clear","reached":1,"through":true,"ends":"it waits","moves":[{"cols":["wwKbKbbKb","KKbKbKbK","bbwbKbKbK","bK*KbwKK","bKKwK*KKb","wKwKbKKK","wwwKKbKKb","wwwbbKbw","bwwwwK*ww","wwwwwbww"],"label":"Bring a piece round","drags":[{"x":7,"y":7,"ways":[1,1,0,0,0,3]}],"steps":[{"name":"the weave","goal":"clear column 10's junk for the Crystal Clear"}]}]},
  },
  {
    id: "P12", moment: "junkUp", level: "cc8", seed: 2, ms: 303450, stage: "chain", burns: 0, chain: 1, timeLeft: 2550,
    what: "The chain at CC^1; column 10 goes up next with 1 brown in it, 2.5 s before it goes.",
    cols: ["wbKwwbKK","KbKbwwbKK","KKKbwKKK","bKbbbbKKK","bbbbwKKb","KbbKbwwKb","wbwwwwKK","wwwwwwKKK","wwwwwwww","wbwwwwwww"],
    bot: {"phase":"chain","kind":"wait","technique":null,"label":"Wait","reason":"nothing worth moving: wait for the next column","drags":[],"column":9,"state":"healthy","tactic":"chain","read":"the chain: whites right"},
    plan: {"aim":null,"reached":null,"through":false,"ends":"it waits","moves":[]},
  },
  {
    id: "P13", moment: "early", level: "cc5", seed: 4, ms: 6050, stage: "junk", burns: 0, chain: 0, timeLeft: 9250, batch: "random",
    what: "6.0 s into the session: 5 whites still in the three columns by the fire, 9.3 s before the first goes.",
    cols: ["KKKb*bKwK","KKKwwbww","KKwKbwK*K","wKbbKKwK","KbbbbbKKb","wbKwwKwK","Kwb*KbwwK","wwKwKwbw","KbKKbbKKK","bKKKKKKK"],
    bot: {"phase":"fire","kind":"move","technique":"sweep","label":"The sweep","reason":"go, go, go: free the trapped whites: whites left, junk right: the brown at column 5, row 5 up-right across the whites, then down through the blacks to the browns","drags":[{"x":4,"y":4,"ways":[0,3,0]}],"state":"atRisk","tactic":"freeTrapped","read":"3 whites trapped near the fire (column 8, row 4, column 8, row 8, column 8, row 6), the worst first","steps":[{"name":"the lift, then the ladder, then the lift","goal":"free column 8's white in row 4"}]},
    plan: {"aim":"free column 8's white in row 4","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["KKKb*bKwK","KKKwwbww","KKwKbwK*K","wKbbKKwK","KbbbbbKKb","wbKwwKwK","Kwb*KbwwK","wwKwKwbw","KbKKbbKKK","bKKKKKKK"],"label":"The sweep","drags":[{"x":4,"y":4,"ways":[0,3,0]}],"steps":[{"name":"the lift, then the ladder, then the lift","goal":"free column 8's white in row 4"}]},{"cols":["KKKb*bKwK","KKKwwbww","KKwKbwK*K","wKbbKKwK","KbbbwbKKb","wbKKwKwK","Kwb*wbwwK","wwKbKwbw","KbKKbbKKK","bKKKKKKK"],"label":"The sweep","drags":[{"x":4,"y":6,"ways":[3,3,3]}],"steps":[{"name":"the drop","goal":"free column 8's bottom white"}]},{"cols":["KKKb*bKwK","KKKwwbww","KKwKbwK*K","wKbbKKwK","KbbbwbwKb","wbKKwKwK","Kwb*wbwwK","wwKbKwbK","KbKKbbKKK","bKKKKKKK"],"label":"Save the whites","drags":[{"x":5,"y":5,"ways":[0,3]}],"steps":[{"name":"the ladder, then the drop","goal":"free column 8's white in row 6"}]},{"cols":["KKKb*bKwK","KKKwwbww","KKwKbwK*K","wKbbKKwK","KbbbwbwKb","wbKKwbwK","Kwb*wwwwK","wwKbKKbK","KbKKbbKKK","bKKKKKKK"],"label":"The sweep","drags":[{"x":6,"y":1,"ways":[2,2,1]}],"steps":[{"name":"the weave","goal":"get column 7's white in row 2 out before it burns"}]},{"cols":["KKKb*bKwK","KKKwwbww","KKwKbwK*K","wwbbKKwK","KbKbwbwKb","wbKKwbwK","Kbb*wwwwK","wwKbKKbK","KbKKbbKKK","bKKKKKKK"],"label":"The sweep","drags":[{"x":3,"y":5,"ways":[3,3,3,0]}],"steps":[{"name":"the drop, then the ladder","goal":"fill column 7's gap: its white out left before it burns"}]}]},
  },
  {
    id: "P14", moment: "low", level: "cc5", seed: 7, ms: 174700, stage: "junk", burns: 0, chain: 0, timeLeft: 8900, batch: "random",
    what: "3 whites in the bottom rows of the two columns by the fire, 8.9 s before the furnace takes column 10.",
    cols: ["bbwbKbbK","bxwbwbwKw","wwwKKwbK","KwKwww*Kw","wwbwwwbw","*wwwwbwwK","KbwwwbwK","K*wwwww*w","wKwwKww*","KbbbbbbKw"],
    bot: {"phase":"fire","kind":"move","technique":"sweep","label":"The sweep","reason":"go, go, go: whites left, junk right: the black at column 3, row 5 down-right across the whites, then up through the browns to the blacks","drags":[{"x":2,"y":4,"ways":[3,3,3,0,3,3,0]}],"state":"atRisk","tactic":"fillGaps","read":"a white in the furnace's column: junk into its place first","steps":[{"name":"the drop, then the ladder, then the drop, then the ladder","goal":"fill column 9's gap: its white out left before it burns"}]},
    plan: {"aim":"fill column 9's gap: its white out left before it burns","reached":1,"through":true,"ends":"it waits","moves":[{"cols":["bbwbKbbK","bxwbwbwKw","wwwKKwbK","KwKwww*Kw","wwbwwwbw","*wwwwbwwK","KbwwwbwK","K*wwwww*w","wKwwKww*","KbbbbbbKw"],"label":"The sweep","drags":[{"x":2,"y":4,"ways":[3,3,3,0,3,3,0]}],"steps":[{"name":"the drop, then the ladder, then the drop, then the ladder","goal":"fill column 9's gap: its white out left before it burns"}]},{"cols":["bbwbKbbK","bxwbwbwKw","wwwKwwbK","KwKwww*Kw","wwbwwwbw","*wwwwbbwK","KbwwwwwK","K*wwwww*w","wKwwKwb*","KbbbbbKKw"],"label":"The diamond","drags":[{"x":0,"y":6,"ways":[0,0,0,0,0,0,0,0]},{"x":1,"y":5,"ways":[0,0,0,0,0,0]}],"steps":[{"name":"the lift","goal":"fill column 9's gap: its white out left before it burns"},{"name":"the lift","goal":"free the stuck brown at column 7, row 2"}]}]},
  },
  {
    id: "P15", moment: "edge", level: "cc8", seed: 9, ms: 414550, stage: "junk", burns: 0, chain: 0, timeLeft: 13850, batch: "random",
    what: "A white beside a spice in column 8, 2 columns from the fire, and 2 more whites on an edge or by a spice near it; 13.8 s on the furnace.",
    cols: ["bbKKbwKb","bwwwwb*wK","wbwKwbww","wbKwwwwKb","bwwwbwKb","wwKKwwKKb","bbwwKK**","bKbKKbwbw","KKbKbKKw","bbKbbKb*b"],
    bot: {"phase":"fire","kind":"move","technique":"rescue","label":"Save the whites","reason":"a white in a column to burn: drag it out left, up through the blacks","drags":[{"x":7,"y":6,"ways":[1]}],"state":"atRisk","tactic":"freeTrapped","read":"2 whites trapped near the fire (column 9, row 8, column 8, row 9), the worst first","steps":[{"name":"the climb","goal":"get column 8's white in row 7 further from the fire"}]},
    plan: {"aim":"get column 8's white in row 7 further from the fire","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["bbKKbwKb","bwwwwb*wK","wbwKwbww","wbKwwwwKb","bwwwbwKb","wwKKwwKKb","bbwwKK**","bKbKKbwbw","KKbKbKKw","bbKbbKb*b"],"label":"Save the whites","drags":[{"x":7,"y":6,"ways":[1]}],"steps":[{"name":"the climb","goal":"get column 8's white in row 7 further from the fire"}]},{"cols":["bbKKbwKb","bwwwwb*wK","wbwKwbww","wbKwwwwKb","bwwwbwKb","wwKKwwKKb","bbwwKw**","bKbKKbKbw","KKbKbKKw","bbKbbKb*b"],"label":"Save the whites","drags":[{"x":8,"y":5,"ways":[1]}],"steps":[{"name":"the ladder","goal":"set the pieces round column 9's bottom white moving"}]},{"cols":["bbKKbwKb","bwwwwb*wK","wbwKwbww","wbKwwwwKb","bwwwbwKb","wwKKwwKKb","bbwwKw**","bKbKKKKbw","KKbKbbKw","bbKbbKb*b"],"label":"Save the whites","drags":[{"x":7,"y":6,"ways":[0]}],"steps":[{"name":"the ladder","goal":"set the pieces round column 9's bottom white moving"}]},{"cols":["bbKKbwKb","bwwwwb*wK","wbwKwbww","wbKwwwwKb","bwwwbwKb","wwKKwwKKb","bbwwKw**","bKbKKKbbw","KKbKbKKw","bbKbbKb*b"],"label":"The diamond","drags":[{"x":0,"y":3,"ways":[3,3,3,3]},{"x":2,"y":5,"ways":[0,3,3,0]}],"steps":[{"name":"the drop","goal":"free column 4's top white, stuck"},{"name":"the lift, then the ladder, then the lift","goal":"carry the brown over to the colour in column 7"}]},{"cols":["bbKwbwKb","bwwwwb*wK","wbwKwwww","wbKwwKwKb","bwwwbKKb","wwKKwwwKb","bbwwKb**","bKbKKKbbw","KKbKbKKw","bbKbbKb*b"],"label":"Save the whites","drags":[{"x":6,"y":5,"ways":[1]}],"steps":[{"name":"the lift","goal":"set the pieces round column 9's bottom white moving"}]}]},
  },
  {
    id: "P16", moment: "stuck", level: "cc8", seed: 5, ms: 102200, stage: "junk", burns: 0, chain: 0, timeLeft: 4900, batch: "random",
    what: "The bot waits, with 4 pieces stuck (white and black), 4 whites in columns 8 and 10 by the fire with no way out left on their own, 4 of them low down; 4.9 s on the furnace.",
    cols: ["KKbwbb*bK","bbwwbwww","wwbwwwwwK","wwbwwwww","KwwwwKwww","bbwwwwww","wwbwwwwwK","bKbbwwwK","bbbbbbK*K","KKbbbbbw"],
    bot: {"phase":"block","kind":"wait","technique":null,"label":"Wait","reason":"nothing worth moving: wait for the next column","drags":[],"state":"atRisk","tactic":"fillGaps","read":"a white in the furnace's column: junk into its place first"},
    plan: {"aim":null,"reached":null,"through":false,"ends":"it waits","moves":[]},
  },
  {
    id: "P17", moment: "block", level: "cc5", seed: 8, ms: 67200, stage: "junk", burns: 0, chain: 0, timeLeft: 9300, batch: "random",
    what: "Whites mostly left (42 on the board); the junk being moved in blocks and wrapped round them in a V. 9.3 s on the furnace.",
    cols: ["wwwKwKKww","bbwKKK*b","wbwwwKwww","bwwwKwww","wwwwwwwK*","wwwwwwww","bwwwwwww*","*KbKKK*K","KKKKKKKbK","bKKKbbbK"],
    bot: {"phase":"block","kind":"move","technique":"sweep","label":"The sweep","reason":"go, go, go: whites left, junk right: the black at column 3, row 6 down-right across the whites, then up through the browns to the blacks","drags":[{"x":2,"y":5,"ways":[3,3,3,3]}],"state":"healthy","tactic":"blocks","read":"nothing at risk, the whites mostly left: the junk moved in long drags, blocks at a time","steps":[{"name":"the drop","goal":"fill column 7's gap: its white out left before it burns"}]},
    plan: {"aim":"fill column 7's gap: its white out left before it burns","reached":1,"through":true,"ends":"it waits","moves":[{"cols":["wwwKwKKww","bbwKKK*b","wbwwwKwww","bwwwKwww","wwwwwwwK*","wwwwwwww","bwwwwwww*","*KbKKK*K","KKKKKKKbK","bKKKbbbK"],"label":"The sweep","drags":[{"x":2,"y":5,"ways":[3,3,3,3]}],"steps":[{"name":"the drop","goal":"fill column 7's gap: its white out left before it burns"}]},{"cols":["wwwKwKKww","bbwKKK*b","wbwwwwwww","bwwwKwww","wwwwwwwK*","wwwwwwww","bwwwwwwK*","*KbKKK*K","KKKKKKKbK","bKKKbbbK"],"label":"The sweep","drags":[{"x":1,"y":4,"ways":[3,3,3,3]}],"steps":[{"name":"the drop","goal":"fill column 6's gap: its white out left before it burns"}]},{"cols":["wwwKwKKww","bbwKwK*b","wbwwwwwww","bwwwKwww","wwwwwwwK*","wwwwwwKw","bwwwwwwK*","*KbKKK*K","KKKKKKKbK","bKKKbbbK"],"label":"The diamond","drags":[{"x":3,"y":4,"ways":[3,3]}],"steps":[{"name":"the drop","goal":"fill column 6's gap: its white out left before it burns"}]}]},
  },
  {
    id: "P18", moment: "chain", level: "cc5", seed: 6, ms: 219650, stage: "chain", burns: 0, chain: 6, timeLeft: 9850, batch: "random",
    what: "The chain at CC^6, the bot filling column 10 (3 pieces of junk still in it), 9.8 s on the furnace.",
    cols: ["KbwKbKKwK","bbKbbbbw","wbwbKKb*b","KwKbbKKb","bKKbbwKK*","bKKbbwKK","bbKKbwKKK","bbKbwwwb","bbwKwwwKK","Kbwwwwwb"],
    bot: {"phase":"chain","kind":"move","technique":"crawl","label":"The crawl","reason":"the black at column 4, row 1 can't move alone: crawl it left with a brown beside it","drags":[{"x":1,"y":0,"ways":[0,3]},{"x":2,"y":0,"ways":[2]}],"column":9,"state":"healthy","tactic":"chain","read":"the chain: whites right","steps":[{"name":"the lift, then the ladder","goal":"make way for drag 2"},{"name":"the drop","goal":"take the black back left, out of the chain's way"}]},
    plan: {"aim":"take the black back left, out of the chain's way","reached":1,"through":true,"ends":"it waits","moves":[{"cols":["KbwKbKKwK","bbKbbbbw","wbwbKKb*b","KwKbbKKb","bKKbbwKK*","bKKbbwKK","bbKKbwKKK","bbKbwwwb","bbwKwwwKK","Kbwwwwwb"],"label":"The crawl","drags":[{"x":1,"y":0,"ways":[0,3]},{"x":2,"y":0,"ways":[2]}],"steps":[{"name":"the lift, then the ladder","goal":"make way for drag 2"},{"name":"the drop","goal":"take the black back left, out of the chain's way"}]}]},
  },
  {
    id: "P19", moment: "stuck", level: "cc8", seed: 7, ms: 179700, stage: "junk", burns: 0, chain: 0, timeLeft: 3900, batch: "random",
    what: "The bot waits, with 4 pieces stuck (white and brown), 7 whites in columns 8 and 9 and 10 by the fire with no way out left on their own, 4 of them low down; 3.9 s on the furnace.",
    cols: ["bbwbKbwK","bxwbwwwKw","wwwKwwbK","KwKwww*Kw","wwbwwwbw","*wwwwbbwK","KbwwwwwK","K*bwwww*w","wKbwKwb*","KbbbbbKKw"],
    bot: {"phase":"block","kind":"wait","technique":null,"label":"Wait","reason":"nothing worth moving: wait for the next column","drags":[],"state":"atRisk","tactic":"fillGaps","read":"a white in the furnace's column: junk into its place first"},
    plan: {"aim":null,"reached":null,"through":false,"ends":"it waits","moves":[]},
  },
  {
    id: "P20", moment: "edge", level: "cc8", seed: 4, ms: 138600, stage: "junk", burns: 0, chain: 0, timeLeft: 14400, batch: "random",
    what: "A white at the top of column 8, 2 columns from the fire, and 4 more whites on an edge or by a spice near it; 14.4 s on the furnace.",
    cols: ["wwbKbwbb","bwKbbKKww","wKK*wKwK","wwwbwwwww","ww*wwKww","wwwwwwwwK","wwwwwwKK","wwwKwbwww","bbbb*b*K","KKKb*bKKb"],
    bot: {"phase":"block","kind":"move","technique":"rescue","label":"Save the whites","reason":"free the trapped whites: a white stuck in a column to burn: bring the brown at column 1, row 8 beside it, then drag it out left","drags":[{"x":0,"y":7,"ways":[0,3,0,0,0,3]},{"x":7,"y":6,"ways":[2,1]}],"state":"atRisk","tactic":"freeTrapped","read":"3 whites trapped near the fire (column 8, row 7, column 8, row 1, column 8, row 2), the worst first","steps":[{"name":"the lift, then the ladder, then the lift, then the ladder","goal":"open the way to column 8's white in row 7"},{"name":"the weave","goal":"free column 8's white in row 7"}]},
    plan: {"aim":"free column 8's white in row 7","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["wwbKbwbb","bwKbbKKww","wKK*wKwK","wwwbwwwww","ww*wwKww","wwwwwwwwK","wwwwwwKK","wwwKwbwww","bbbb*b*K","KKKb*bKKb"],"label":"Save the whites","drags":[{"x":0,"y":7,"ways":[0,3,0,0,0,3]},{"x":7,"y":6,"ways":[2,1]}],"steps":[{"name":"the lift, then the ladder, then the lift, then the ladder","goal":"open the way to column 8's white in row 7"},{"name":"the weave","goal":"free column 8's white in row 7"}]},{"cols":["wwbKbwbw","bwKbbKKKw","wKK*wKww","wwwbwwwww","ww*wwKww","wwwwwwwwK","wwwwwwKK","wwwKwbbww","bbbb*b*K","KKKb*bKKb"],"label":"Save the whites","drags":[{"x":8,"y":1,"ways":[1,1,0]}],"steps":[{"name":"the lift","goal":"free column 8's top white"}]},{"cols":["wwbKbwbw","bwKbbKKKw","wKK*wKww","wwwbwwwww","ww*wwKww","wwwwwwwwK","wwwwwwKK","bwwKwbbww","bwbb*b*K","KKKb*bKKb"],"label":"The sweep","drags":[{"x":0,"y":4,"ways":[3,0,0,0,0,0,0,0,3]}],"steps":[{"name":"the ladder, then the lift, then the ladder","goal":"free column 9's white in row 2"}]},{"cols":["wwbKKwbw","bwKbbwKKw","wKK*wKww","wwwbwwwww","ww*wwKww","wwwwwwwwK","wwwwwwKK","bwwKwbbww","bKbb*b*K","KKbb*bKKb"],"label":"Save the whites","drags":[{"x":8,"y":2,"ways":[2,1,1,0,0]}],"steps":[{"name":"the ladder, then the lift","goal":"free column 8's white in row 2"}]},{"cols":["wwbKKwbw","bwKbbwKKw","wKK*wKww","wwwbwwwww","ww*wwKww","wwwwwwwwK","wwwwwwKK","bbwwwbbww","bKKb*b*K","KKbb*bKKb"],"label":"Bring a piece round","drags":[{"x":7,"y":5,"ways":[1,0]}],"steps":[{"name":"the lift","goal":"free column 8's white in row 5"}]}]},
  },
  {
    id: "P21", moment: "read", level: "cc8", seed: 5, ms: 444600, stage: "junk", burns: 0, chain: 0, timeLeft: 14400, batch: "challenge", like: "P5",
    what: "Read as P5 is: 4 whites trapped near the fire (column 8, row 2, column 8, row 3, column 8, row 4 and 1 more), the worst first. 444.6 s in, 14.4 s on the furnace.",
    cols: ["KbbKwbbw","KbwwKwwKw","wwKwwwbw","wwwwKwwww","wwwwwwww","bwwKwwwww","bwwKwKww","bwww*KKKb","*bwKKKKb","KbKKKKKbb"],
    bot: {"phase":"block","kind":"move","technique":"path","label":"Bring a piece round","reason":"free the trapped whites: the white at column 8, row 2 is stuck: bring the brown at column 3, row 7 round, looping, to take its place, and it's out left","drags":[{"x":2,"y":6,"ways":[0,0,0,0,1,1,1,0,0,0,0]}],"state":"atRisk","tactic":"freeTrapped","read":"4 whites trapped near the fire (column 8, row 2, column 8, row 3, column 8, row 4 and 1 more), the worst first","steps":[{"name":"the lift","goal":"free column 8's white in row 2"}]},
    plan: {"aim":"free column 8's white in row 2","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["KbbKwbbw","KbwwKwwKw","wwKwwwbw","wwwwKwwww","wwwwwwww","bwwKwwwww","bwwKwKww","bwww*KKKb","*bwKKKKb","KbKKKKKbb"],"label":"Bring a piece round","drags":[{"x":2,"y":6,"ways":[0,0,0,0,1,1,1,0,0,0,0]}],"steps":[{"name":"the lift","goal":"free column 8's white in row 2"}]},{"cols":["KbbKwbbw","KbwwKwwKw","wwKwwwww","wwwwKwwww","wwwwwwww","bwwKwwwww","bwwKwKww","bbww*KKKb","*bwKKKKb","KbKKKKKbb"],"label":"The sweep","drags":[{"x":1,"y":0,"ways":[3,3,3,3,3,3]}],"steps":[{"name":"the drop","goal":"free column 8's white in row 4"}]},{"cols":["KbbKwbbw","wbwwKwwKw","wwKwwwww","wwwwKwwww","wwwwwwww","bwwKwwwww","bwwKwKww","bbwK*KKKb","*bwKKKKb","KbKKKKKbb"],"label":"The crawl","drags":[{"x":1,"y":1,"ways":[0]},{"x":0,"y":0,"ways":[3,0,3]},{"x":1,"y":1,"ways":[0,3,0]},{"x":2,"y":0,"ways":[3,0,3,3,3,3]}],"steps":[{"name":"the lift","goal":"make way for drag 2"},{"name":"the drop, then the ladder, then the drop","goal":"make way for drag 3"},{"name":"the lift, then the ladder, then the lift","goal":"make way for drag 4"},{"name":"the drop, then the ladder, then the drop","goal":"free column 9's white in row 3"}]},{"cols":["wbbKwbbw","wwwwKwwKw","wwKwwwww","wbwwKwwww","wwwwwwww","bwwKwwwww","bwwKwKww","bbwK*KKKb","*bKKKKKb","KbKKKKKbb"],"label":"Save the whites","drags":[{"x":9,"y":2,"ways":[1,1,1,2,3,3]}],"steps":[{"name":"the ladder, then the drop","goal":"free column 8's white in row 3"}]},{"cols":["wbbKwbbw","wwwwKwwKw","wwKwwwww","wbwwKwwww","wwwwwwww","bwwKwwwww","wwwKwKww","bbKK*KKKb","*bKKKKKb","KbbKKKKbb"],"label":"The sweep","drags":[{"x":2,"y":2,"ways":[3,3,3,3]}],"steps":[{"name":"the drop","goal":"fill column 7's gap: its white out left before it burns"}]}]},
  },
  {
    id: "P22", moment: "read", level: "cc5", seed: 9, ms: 398750, stage: "junk", burns: 0, chain: 0, timeLeft: 14350, batch: "challenge", like: "P6",
    what: "Read as P6 is: 2 whites trapped near the fire (column 9, row 5, column 8, row 1), the worst first. 398.8 s in, 14.3 s on the furnace.",
    cols: ["bKKbbb*wK","wbbwwbww","wbwwwwwKb","wwwwwwKb","bwwwwwwKb","bwwwww**","wwwwwwwKw","wKbbwKKw","bbwKwKK*b","KKKbbKKK"],
    bot: {"phase":"block","kind":"move","technique":"rescue","label":"Save the whites","reason":"free the trapped whites: a white stuck in a column to burn: bring the black at column 1, row 3 beside it, then drag it out left","drags":[{"x":0,"y":2,"ways":[0,3,3,3,3,3,0]},{"x":8,"y":4,"ways":[1,2]}],"state":"atRisk","tactic":"freeTrapped","read":"2 whites trapped near the fire (column 9, row 5, column 8, row 1), the worst first","steps":[{"name":"the ladder, then the drop, then the ladder","goal":"open the way to column 9's white in row 5"},{"name":"the weave","goal":"free column 9's white in row 5"}]},
    plan: {"aim":"free column 9's white in row 5","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["bKKbbb*wK","wbbwwbww","wbwwwwwKb","wwwwwwKb","bwwwwwwKb","bwwwww**","wwwwwwwKw","wKbbwKKw","bbwKwKK*b","KKKbbKKK"],"label":"Save the whites","drags":[{"x":0,"y":2,"ways":[0,3,3,3,3,3,0]},{"x":8,"y":4,"ways":[1,2]}],"steps":[{"name":"the ladder, then the drop, then the ladder","goal":"open the way to column 9's white in row 5"},{"name":"the weave","goal":"free column 9's white in row 5"}]},{"cols":["bKbbbb*wK","wwbwwbww","wbwwwwwKb","wwwwwwKb","bwwwwwwKb","bwwwww**","wwwwwwwKw","wKbbwKKw","bbwKKKK*b","KKKbbKKK"],"label":"Save the whites","drags":[{"x":7,"y":2,"ways":[0,3]}],"steps":[{"name":"the lift, then the ladder","goal":"fill column 9's gap: its white further from the fire"}]},{"cols":["bKbbbb*wK","wwbwwbww","wbwwwwwKb","wwwwwwKb","bwwwwwwKb","bwwwww**","wwwwwwwKw","wKwbwKKw","bbKKKKK*b","KKbbbKKK"],"label":"The sweep","drags":[{"x":0,"y":4,"ways":[0,0,0,0,0,0,0]}],"steps":[{"name":"the lift","goal":"free column 8's top white"}]},{"cols":["bKbbwb*wK","wwbwwbww","wbwwwwwKb","wwwwwwKb","bwwwwwwKb","bwwwww**","wwwwwwwKw","bKwbwKKw","bbKKKKK*b","KKbbbKKK"],"label":"Save the whites","drags":[{"x":6,"y":7,"ways":[3]}],"steps":[{"name":"the drop","goal":"fill column 8's gap: its white further from the fire"}]},{"cols":["bKbbwb*wK","wwbwwbww","wbwwwwwKb","wwwwwwKb","bwwwwwwKb","bwwwww**","wwwwwwwww","bKwbwKKK","bbKKKKK*b","KKbbbKKK"],"label":"The sweep","drags":[{"x":1,"y":5,"ways":[0,0,0,0,0,0,3]}],"steps":[{"name":"the lift, then the ladder","goal":"fill column 8's gap: its white out left before it burns"}]}]},
  },
  {
    id: "P23", moment: "read", level: "cc2", seed: 9, ms: 128500, stage: "junk", burns: 0, chain: 0, timeLeft: 9200, batch: "challenge", like: "P3",
    what: "Read as P3 is: a white by the fire free to go, with time in hand (column 9, row 7): the quick sorting moves, blacks down and browns up, fill their places. 128.5 s in, 9.2 s on the furnace.",
    cols: ["wKwbbwwKK","bbwbbKbK","KbKbbKKKb","bKKKbKKb","bbKbKKKKK","bbwbbKKK","bbwwwKKwK","bbwwKKwK","bKbbKbwKb","bbbKKb*K"],
    bot: {"phase":"fire","kind":"move","technique":"rescue","label":"Save the whites","reason":"quick sorting: the black at column 8, row 6 down into a white's place by the fire, and it's out left","drags":[{"x":7,"y":5,"ways":[3]}],"state":"atRisk","tactic":"quickSort","read":"a white by the fire free to go, with time in hand (column 9, row 7): the quick sorting moves, blacks down and browns up, fill their places","steps":[{"name":"the drop","goal":"fill column 9's gap: its white further from the fire"}]},
    plan: {"aim":"fill column 9's gap: its white further from the fire","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["wKwbbwwKK","bbwbbKbK","KbKbbKKKb","bKKKbKKb","bbKbKKKKK","bbwbbKKK","bbwwwKKwK","bbwwKKwK","bKbbKbwKb","bbbKKb*K"],"label":"Save the whites","drags":[{"x":7,"y":5,"ways":[3]}],"steps":[{"name":"the drop","goal":"fill column 9's gap: its white further from the fire"}]},{"cols":["wKwbbwwKK","bbwbbKbK","KbKbbKKKb","bKKKbKKb","bbKbKKKKK","bbwbbKKK","bbwwwKKwK","bbwwKwwK","bKbbKbKKb","bbbKKb*K"],"label":"The diamond","drags":[{"x":0,"y":3,"ways":[0]}],"steps":[{"name":"the lift","goal":"carry the brown over to the colour in column 2"}]},{"cols":["wKwwbwwKK","bbbbbKbK","KbKbbKKKb","bKKKbKKb","bbKbKKKKK","bbwbbKKK","bbwwwKKwK","bbwwKwwK","bKbbKbKKb","bbbKKb*K"],"label":"The sweep","drags":[{"x":4,"y":2,"ways":[3,3,3,0,0]}],"steps":[{"name":"the drop, then the ladder","goal":"fill column 8's gap: its white out left before it burns"}]},{"cols":["wKwwbwwKK","bbbbbKbK","KbKbbKKKb","bKKKbKKb","bbwbKKKKK","bbwbbKKK","bbwwwKKwK","bbwbKwwK","bKbbKbKKb","bbKKKb*K"],"label":"The sweep","drags":[{"x":7,"y":6,"ways":[1,1,1]}],"steps":[{"name":"the climb","goal":"get column 8's white in row 7 out before it burns"}]},{"cols":["wKwwbwwKK","bbbbbKbK","KbKbbKKKb","bKKKbKKb","bbwbKwKKK","bbwbbKKK","bbwwwKKwK","bbwbKwKK","bKbbKbKKb","bbKKKb*K"],"label":"The sweep","drags":[{"x":6,"y":4,"ways":[2,1,1]}],"steps":[{"name":"the weave","goal":"get column 7's white in row 5 out before it burns"}]}]},
  },
  {
    id: "P24", moment: "read", level: "cc8", seed: 6, ms: 270750, stage: "junk", burns: 0, chain: 0, timeLeft: 4650, batch: "challenge", like: "P3",
    what: "Read as P3 is: a white by the fire free to go, with time in hand (column 9, row 7): the quick sorting moves, blacks down and browns up, fill their places. 270.8 s in, 4.7 s on the furnace.",
    cols: ["bbwwKbbb","KKbKKKKww","bbKKb*bw","bbKbbbKbb","bbbKKbbw","wbwbKKK*K","Kwwbwwwb","bbwwbwKb*","bbbKbKwK","bbKKKKKKK"],
    bot: {"phase":"fire","kind":"move","technique":"rescue","label":"Save the whites","reason":"quick sorting: the black at column 8, row 7 down into a white's place by the fire, and it's out left","drags":[{"x":7,"y":6,"ways":[3]}],"state":"atRisk","tactic":"quickSort","read":"a white by the fire free to go, with time in hand (column 9, row 7): the quick sorting moves, blacks down and browns up, fill their places","steps":[{"name":"the drop","goal":"fill column 9's gap: its white further from the fire"}]},
    plan: {"aim":"fill column 9's gap: its white further from the fire","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["bbwwKbbb","KKbKKKKww","bbKKb*bw","bbKbbbKbb","bbbKKbbw","wbwbKKK*K","Kwwbwwwb","bbwwbwKb*","bbbKbKwK","bbKKKKKKK"],"label":"Save the whites","drags":[{"x":7,"y":6,"ways":[3]}],"steps":[{"name":"the drop","goal":"fill column 9's gap: its white further from the fire"}]},{"cols":["bbwwKbbb","KKbKKKKww","bbKKb*bw","bbKbbbKbb","bbbKKbbw","wbwbKKK*K","Kwwbwwwb","bbwwbwwb*","bbbKbKKK","bbKKKKKKK"],"label":"The sweep","drags":[{"x":5,"y":4,"ways":[3,3,0]}],"steps":[{"name":"the drop, then the ladder","goal":"fill column 8's gap: its white further from the fire"}]},{"cols":["bbwwKbbb","KKbKKKKww","bbKKb*bw","bbKbbbKbb","bbbKKbbw","wbwbwKK*K","Kwwbwwwb","bbwwbbwb*","bbbKKKKK","bbKKKKKKK"],"label":"The sweep","drags":[{"x":3,"y":2,"ways":[0,3,3,3,0]}],"steps":[{"name":"the ladder, then the drop, then the ladder","goal":"fill column 8's gap: its white out left before it burns"}]},{"cols":["bbwwKbbb","KKbKKKKww","bbKKb*bw","bbbbbbKbb","bwbKKbbw","wbwbwKK*K","Kwwbwwwb","bbwbbbwb*","bbKKKKKK","bbKKKKKKK"],"label":"Save the whites","drags":[{"x":5,"y":3,"ways":[0,0]}],"steps":[{"name":"the lift","goal":"free column 8's white in row 3"}]},{"cols":["bbwwKbbb","KKbKKKKww","bbKKb*bw","bbbbbbKbb","bwbKKbbw","wbwwwKK*K","Kwwbwwwb","bbbbbbwb*","bbKKKKKK","bbKKKKKKK"],"label":"Save the whites","drags":[{"x":5,"y":5,"ways":[3,3]}],"steps":[{"name":"the drop","goal":"fill column 8's gap: its white further from the fire"}]}]},
  },
  {
    id: "P25", moment: "read", level: "cc5", seed: 5, ms: 16300, stage: "junk", burns: 0, chain: 0, timeLeft: 14300, batch: "challenge", like: "P4",
    what: "Read as P4 is: 2 whites by the fire with their columns burning soon (column 9, row 1, column 9, row 3): junk into their places, the quickest first. 16.3 s in, 14.3 s on the furnace.",
    cols: ["KKwbwwbb","bbbbKKbKK","bwwwwKbK","bbwbwww*b","bbwwwwww","KKwwbbwwK","K*bKwww*","KKbbbbKKw","wKwKKKKK","KKbKKKKbK"],
    bot: {"phase":"fire","kind":"move","technique":"rescue","label":"Save the whites","reason":"fill the gaps: junk raced into a white's place (column 9, row 1, column 9, row 3), and it's out left","drags":[{"x":8,"y":3,"ways":[1,1,0,3]}],"state":"atRisk","tactic":"fillGaps","read":"2 whites by the fire with their columns burning soon (column 9, row 1, column 9, row 3): junk into their places, the quickest first","steps":[{"name":"the ladder, then the drop","goal":"fill column 9's gap: column 9's white in row 3 out left"}]},
    plan: {"aim":"fill column 9's gap: column 9's white in row 3 out left","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["KKwbwwbb","bbbbKKbKK","bwwwwKbK","bbwbwww*b","bbwwwwww","KKwwbbwwK","K*bKwww*","KKbbbbKKw","wKwKKKKK","KKbKKKKbK"],"label":"Save the whites","drags":[{"x":8,"y":3,"ways":[1,1,0,3]}],"steps":[{"name":"the ladder, then the drop","goal":"fill column 9's gap: column 9's white in row 3 out left"}]},{"cols":["KKwbwwbb","bbbbKKbKK","bwwwwKbK","bbwbwww*b","bbwwwwww","KKwwbbwwK","K*bKwww*","KKwbbbKKw","wKKbKKKK","KKbKKKKbK"],"label":"Save the whites","drags":[{"x":7,"y":0,"ways":[3]}],"steps":[{"name":"the drop","goal":"fill column 9's gap: its white further from the fire"}]},{"cols":["KKwbwwbb","bbbbKKbKK","bwwwwKbK","bbwbwww*b","bbwwwwww","KKwwbbwwK","K*bKwww*","wKwbbbKKw","KKKbKKKK","KKbKKKKbK"],"label":"Save the whites","drags":[{"x":8,"y":7,"ways":[2]}],"steps":[{"name":"the drop","goal":"free column 8's bottom white"}]},{"cols":["KKwbwwbb","bbbbKKbKK","bwwwwKbK","bbwbwww*b","bbwwwwww","KKwwbbwwK","K*bKwww*","wKwbbbKKK","KKKbKKKw","KKbKKKKbK"],"label":"Save the whites","drags":[{"x":7,"y":7,"ways":[3,0]}],"steps":[{"name":"the drop, then the ladder","goal":"fill column 9's gap: its white further from the fire"}]},{"cols":["KKwbwwbb","bbbbKKbKK","bwwwwKbK","bbwbwww*b","bbwwwwww","KKwwbbwwK","K*bKwww*","wKwbbbKwK","KKKbKKKb","KKbKKKKKK"],"label":"The diamond","drags":[{"x":1,"y":4,"ways":[3,3,3,0]},{"x":2,"y":5,"ways":[3,0,3,3,3]}],"steps":[{"name":"the drop, then the ladder","goal":"carry the black over to the colour in column 6"},{"name":"the drop, then the ladder, then the drop","goal":"fill column 8's gap: its white out left before it burns"}]}]},
  },
  {
    id: "P26", moment: "read", level: "cc8", seed: 9, ms: 449350, stage: "junk", burns: 0, chain: 0, timeLeft: 9650, batch: "challenge", like: "P4",
    what: "Read as P4 is: a white in the furnace's column: junk into its place first. 449.4 s in, 9.7 s on the furnace.",
    cols: ["wbwbbbKb","KKwKbwwK*","bbwwwwKb","bwwwww*wb","bbwKwwww","wwKKbbwKK","wwwwKwKb","KwKKKKwKb","bbwwKb**","bbbKKKbbw"],
    bot: {"phase":"fire","kind":"wait","technique":null,"label":"Wait","reason":"nothing worth moving: wait for the next column","drags":[],"state":"atRisk","tactic":"fillGaps","read":"a white in the furnace's column: junk into its place first"},
    plan: {"aim":null,"reached":null,"through":false,"ends":"it waits","moves":[]},
  },
  {
    id: "P27", moment: "read", level: "cc8", seed: 9, ms: 162100, stage: "junk", burns: 0, chain: 0, timeLeft: 6200, batch: "challenge", like: "P7",
    what: "Read as P7 is: 5 whites still in column 9, 22 s from the fire, and junk free for 1 column: fill its gaps however you can, the quickest first. 162.1 s in, 6.2 s on the furnace.",
    cols: ["wbbwKbKKK","KwwwKwwb","wwwbKbwKK","wbwbwwKK","wbwwwwwKw","bwwwwwKK","wwwwwwwww","wwwwwwwK","bwwwwKwKK","bbbbbKKK"],
    bot: {"phase":"block","kind":"move","technique":"sweep","label":"The sweep","reason":"go, go, go: fill the gaps: a white stuck in a column to burn: sweep the brown at column 4, row 4 onto it, and it's out","drags":[{"x":3,"y":3,"ways":[0,0,0,0,0]}],"state":"damageControl","tactic":"fillGaps","read":"5 whites still in column 9, 22 s from the fire, and junk free for 1 column: fill its gaps however you can, the quickest first","steps":[{"name":"the lift","goal":"fill column 9's gap: column 9's white in row 2 out left"}]},
    plan: {"aim":"fill column 9's gap: column 9's white in row 2 out left","reached":1,"through":true,"ends":"the furnace takes the next column","moves":[{"cols":["wbbwKbKKK","KwwwKwwb","wwwbKbwKK","wbwbwwKK","wbwwwwwKw","bwwwwwKK","wwwwwwwww","wwwwwwwK","bwwwwKwKK","bbbbbKKK"],"label":"The sweep","drags":[{"x":3,"y":3,"ways":[0,0,0,0,0]}],"steps":[{"name":"the lift","goal":"fill column 9's gap: column 9's white in row 2 out left"}]},{"cols":["wbbwKbKKK","KwwwKwwb","wwwbKbwKK","wbwwwwKK","wbwwwwwKw","bwwwwwKK","wwwwwwwww","wwwwwwwK","bbwwwKwKK","bbbbbKKK"],"label":"The sweep","drags":[{"x":2,"y":5,"ways":[0,0,0,0,0,0]}],"steps":[{"name":"the lift","goal":"free column 9's white in row 3"}]},{"cols":["wbbwKbKKK","KwwwKwwb","wwwbKwwKK","wbwwwwKK","wbwwwwwKw","bwwwwwKK","wwwwwwwww","wwwwwwwK","bbbwwKwKK","bbbbbKKK"],"label":"Save the whites","drags":[{"x":1,"y":0,"ways":[3,2,3,0,0,3,3,3,3,0]}],"steps":[{"name":"the drop, then the ladder, then the drop, then the ladder","goal":"free column 9's white in row 4"}]},{"cols":["wbbwKbKKK","wwwwKwwb","wwbbKwwKK","wbwwwwKK","wwwwwwwKw","bwwwwwKK","wwwwwwwww","wwwwwwwK","bbbbwKwKK","bbKbbKKK"],"label":"Bring a piece round","drags":[{"x":9,"y":4,"ways":[2]}],"steps":[{"name":"the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]},{"cols":["wbbwKbKKK","wwwwKwwb","wwbbKwwKK","wbwwwwKK","wwwwwwwKw","bwwwwwKK","wwwwwwwww","wwwwwwwK","bbbbwbwKK","bbKbKKKK"],"label":"The sweep","drags":[{"x":2,"y":3,"ways":[0,0,0,0,0]}],"steps":[{"name":"the lift","goal":"fill column 8's gap: its white out left before it burns"}]}]},
  },
  {
    id: "P28", moment: "read", level: "cc8", seed: 7, ms: 222150, stage: "junk", burns: 0, chain: 0, timeLeft: 7350, batch: "challenge", like: "P7",
    what: "Read as P7 is: 4 whites still in column 9, 23 s from the fire, and junk free for 1 column: fill its gaps however you can, the quickest first. 222.2 s in, 7.3 s on the furnace.",
    cols: ["KwKwwwKKw","ww*Kwbwb","wbw*Kbwww","bbwwwwwK","bxwwwwwKw","wwwwwwwK","wwwwww*ww","bwwwwKww","*bwbwwwKK","bbbbbbbK"],
    bot: {"phase":"block","kind":"move","technique":"sweep","label":"The sweep","reason":"go, go, go: fill the gaps: a white stuck in a column to burn: sweep the brown at column 3, row 6 onto it, and it's out","drags":[{"x":2,"y":5,"ways":[0,0,0,0,0,0]}],"state":"damageControl","tactic":"fillGaps","read":"4 whites still in column 9, 23 s from the fire, and junk free for 1 column: fill its gaps however you can, the quickest first","steps":[{"name":"the lift","goal":"fill column 9's gap: column 9's white in row 3 out left"}]},
    plan: {"aim":"fill column 9's gap: column 9's white in row 3 out left","reached":1,"through":true,"ends":"the furnace takes the next column","moves":[{"cols":["KwKwwwKKw","ww*Kwbwb","wbw*Kbwww","bbwwwwwK","bxwwwwwKw","wwwwwwwK","wwwwww*ww","bwwwwKww","*bwbwwwKK","bbbbbbbK"],"label":"The sweep","drags":[{"x":2,"y":5,"ways":[0,0,0,0,0,0]}],"steps":[{"name":"the lift","goal":"fill column 9's gap: column 9's white in row 3 out left"}]},{"cols":["KwKwwwKKw","ww*Kwbwb","wbw*Kwwww","bbwwwwwK","bxwwwwwKw","wwwwwwwK","wwwwww*ww","bwwwwKww","*bbbwwwKK","bbbbbbbK"],"label":"Save the whites","drags":[{"x":1,"y":7,"ways":[0,0,0,0,0,3]},{"x":8,"y":5,"ways":[2,1]}],"steps":[{"name":"the lift, then the ladder","goal":"open the way to column 9's white in row 6"},{"name":"the weave","goal":"free column 9's white in row 6"}]},{"cols":["KwKwwwKKw","ww*Kwbww","wbw*Kwwww","bbwwwwwK","bxwwwwwKw","wwwwwwwK","wwwwww*ww","bwwwwKww","*bbbwbwKK","bbbbbbbK"],"label":"Save the whites","drags":[{"x":8,"y":7,"ways":[0]}],"steps":[{"name":"the ladder","goal":"open the way to column 8's white in row 7"}]},{"cols":["KwKwwwKKw","ww*Kwbww","wbw*Kwwww","bbwwwwwK","bxwwwwwKw","wwwwwwwK","wwwwww*ww","bwwwwKww","*bbbwbwbK","bbbbbbKK"],"label":"Save the whites","drags":[{"x":2,"y":4,"ways":[2,3,3,3,3,3,3,0]}],"steps":[{"name":"the drop, then the ladder","goal":"free column 8's bottom white"}]},{"cols":["KwKwwwKKw","ww*Kwbww","wbw*wwwww","bbwwwwwK","bxwwwwwKw","wwwwwwwK","wwwwww*ww","bwwwwKwb","*bbbwbwKK","bbbbbbKK"],"label":"Save the whites","drags":[{"x":0,"y":0,"ways":[3,2,3,3,0,3,3,3,3,3,0]}],"steps":[{"name":"the drop, then the ladder, then the drop, then the ladder","goal":"free column 9's white in row 5"}]}]},
  },
  {
    id: "P29", moment: "read", level: "cc5", seed: 4, ms: 427450, stage: "junk", burns: 0, chain: 0, timeLeft: 950, batch: "challenge", like: "P8",
    what: "Read as P8 is: columns 9 and 10 aren't sorted blacks over browns, and column 10 goes in 0.9 s: sort the ladder before it's lost. 427.4 s in, 0.9 s on the furnace.",
    cols: ["bK*wwwbw","wbbwwbKw*","wbwwwwww","bwww*wwwK","wwwwww*w","wwbwwwwww","www*wwK*","bbbKKbKKb","KKbbbKKb","bbbbKbKbb"],
    bot: {"phase":"block","kind":"move","technique":"turnOver","label":"Turn the right side over","reason":"sort the ladder: columns 9 and 10 sorted, blacks over browns, the ladder the zigzag climbs, before column 10 goes","drags":[{"x":8,"y":3,"ways":[3]}],"state":"atRisk","tactic":"sortLadder","read":"columns 9 and 10 aren't sorted blacks over browns, and column 10 goes in 0.9 s: sort the ladder before it's lost","steps":[{"name":"the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]},
    plan: {"aim":"sort columns 9 and 10, blacks over browns, before column 10 goes","reached":1,"through":true,"ends":"the furnace takes the next column","moves":[{"cols":["bK*wwwbw","wbbwwbKw*","wbwwwwww","bwww*wwwK","wwwwww*w","wwbwwwwww","www*wwK*","bbbKKbKKb","KKbbbKKb","bbbbKbKbb"],"label":"Turn the right side over","drags":[{"x":8,"y":3,"ways":[3]}],"steps":[{"name":"the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]},{"cols":["bK*wwwbw","wbbwwbKw*","wbwwwwww","bwww*wwwK","wwwwww*w","wwbwwwwww","www*wwK*","bbbKKbKKb","KKbKbKKb","bbbbbbKbb"],"label":"The sweep","drags":[{"x":1,"y":6,"ways":[3,3,3]}],"steps":[{"name":"the drop","goal":"free column 6's bottom white, stuck"}]}]},
  },
  {
    id: "P30", moment: "read", level: "cc5", seed: 6, ms: 347050, stage: "junk", burns: 0, chain: 0, timeLeft: 4850, batch: "challenge", like: "P9",
    what: "Read as P9 is: the V's tail unsorted (column 6, row 7): browns down through the blacks, so the next sweep runs through. 347.1 s in, 4.8 s on the furnace.",
    cols: ["wwKwwbwKK","wwbKwwww","b**KwKwwb","wwwwwwbK","wwwwwwwww","wwwwwbbw","wwwwKwwKw","bbKbK*Kb","bbKbbKKKb","KbbbKbKK"],
    bot: {"phase":"block","kind":"move","technique":"diamond","label":"The diamond","reason":"sort the tail: bring in another piece: drag the black at column 4, row 8 into the gap, then the brown at column 3, row 9 over past it","drags":[{"x":3,"y":7,"ways":[3]},{"x":2,"y":8,"ways":[0,3,0]}],"state":"healthy","tactic":"sortTail","read":"the V's tail unsorted (column 6, row 7): browns down through the blacks, so the next sweep runs through","steps":[{"name":"the drop","goal":"make way for drag 2"},{"name":"the lift, then the ladder, then the lift","goal":"sort the V's tail: the brown down through the blacks, so the next sweep runs through"}]},
    plan: {"aim":"sort the V's tail: the brown down through the blacks, so the next sweep runs through","reached":1,"through":true,"ends":"5 moves","moves":[{"cols":["wwKwwbwKK","wwbKwwww","b**KwKwwb","wwwwwwbK","wwwwwwwww","wwwwwbbw","wwwwKwwKw","bbKbK*Kb","bbKbbKKKb","KbbbKbKK"],"label":"The diamond","drags":[{"x":3,"y":7,"ways":[3]},{"x":2,"y":8,"ways":[0,3,0]}],"steps":[{"name":"the drop","goal":"make way for drag 2"},{"name":"the lift, then the ladder, then the lift","goal":"sort the V's tail: the brown down through the blacks, so the next sweep runs through"}]},{"cols":["wwKwwbwKK","wwbKwwww","b**KwKwww","wwwwwwbK","wwwwwwwww","wwwwwbbb","wwwwKwwKw","bbKbK*Kb","bbKbbKKKb","KbbbKbKK"],"label":"The sweep","drags":[{"x":5,"y":6,"ways":[0,3,3,3]}],"steps":[{"name":"the lift, then the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]},{"cols":["wwKwwbwKK","wwbKwwww","b**KwKwww","wwwwwwbK","wwwwwwwww","wwwwwbwb","wwwwKwKKw","bbKbK*Kb","bbKbbKKKb","KbbbKbKb"],"label":"Turn the right side over","drags":[{"x":8,"y":0,"ways":[3]}],"steps":[{"name":"the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]},{"cols":["wwKwwbwKK","wwbKwwww","b**KwKwww","wwwwwwbK","wwwwwwwww","wwwwwbwb","wwwwKwKKw","bbKbK*Kb","KbKbbKKKb","bbbbKbKb"],"label":"Turn the right side over","drags":[{"x":8,"y":4,"ways":[3]}],"steps":[{"name":"the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]},{"cols":["wwKwwbwKK","wwbKwwww","b**KwKwww","wwwwwwbK","wwwwwwwww","wwwwwbwb","wwwwKwKKw","bbKbK*Kb","KbKbKKKKb","bbbbbbKb"],"label":"Turn the right side over","drags":[{"x":8,"y":2,"ways":[0,1]}],"steps":[{"name":"the ladder","goal":"sort columns 9 and 10, blacks over browns, before column 10 goes"}]}]},
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
  // (the user, 13 Nov: "I think [P3] was quick sorting": read so since, the whites burning soon free and every quick fill
  // of their places a black down or a brown up)
  P3: { theme: 'quickSort', reads: { tactic: 'quickSort' } },
  P7: { theme: 'damage', reads: { state: 'damageControl' } },
  P10: { theme: 'cracked', reads: { state: 'cracked', tactic: 'fixCracks' } },
  P8: { theme: 'patterns', reads: { tactic: 'sortLadder' } },
  P9: { theme: 'patterns', reads: { tactic: 'sortTail' } },
  P11: { theme: 'skipped' },
  P12: { theme: 'skipped' },
};

/** What the reader should read at a theme challenge's position: what it reads at the judged position it's `like`. */
export function challengeReads(p: Position): { state?: BoardState; tactic?: Tactic } | undefined {
  return p.batch === 'challenge' && p.like ? THEMED[p.like]?.reads : undefined;
}

/** The board of a position. */
export const boardOf = (p: Position): Board => parseBoard(p.cols);

/** The bot's move at a position now: the planner as the bot calls it, with its level, stage and the furnace's time. */
export function botAt(p: Position): Advice {
  const cols = boardOf(p), level = levelNamed(p.level);
  // (in the chain, its rule of thumb as the bot has it: `chainContext`)
  const ctx = p.stage === 'chain' ? chainContext(cols, p.chain, p.burns, level.target, level.reach).ctx : contextFor(cols, p.stage, p.burns, level.reach);
  return choose({ cols, chain: p.chain, timeLeft: p.timeLeft }, ctx, level);
}

/** The bot's next few moves at a position, played forward (src/distill-ahead.ts, `ahead`): the same planner as
    `botAt`, so its first move is the bot's move there. */
export function planOf(p: Position): PlanKept {
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
export function moveOf(a: Advice): BotMove {
  return {
    phase: a.phase, kind: a.kind, technique: a.sweep ? 'sweep' : (a.technique ?? a.routine ?? null), label: a.label, reason: a.reason,
    drags: a.drags.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] })), ...(a.column !== undefined ? { column: a.column } : {}),
    ...(a.state ? { state: a.state, tactic: a.tactic, read: a.read } : {}),
    ...(a.steps?.length ? { steps: a.steps.map((s) => ({ name: s.name, goal: s.goal?.says ?? null })) } : {}),
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
