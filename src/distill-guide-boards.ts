/* Distilling's read version: the boards its later pictures are drawn on, picked from real play by
   tools/distill-guide.mjs (a CC^8 bot on seeded deals). Written by that tool: run it again rather than
   editing these (tests/distill-guide.test.ts says when). Each is where the bot played that technique (`chosen`),
   or, for one it never played, where the routine's own `find` offered a move; or where a phase or one of the
   user's tricks showed. Plain data: src/distill-guide.ts draws the moves on them live. */
import type { Ctx, Drag, RoutineName } from './distill-routines.js';
import type { Phase } from './distill-phase.js';

export interface Position {
  /** The deal (its seed), the bot, and how far into the session, in ms of its play. */
  seed: number; bot: string; ms: number;
  stage: 'junk' | 'chain'; phase: Phase; chain: number;
  /** Where the bot played it (true), or only where its routine offered it (false). */
  chosen: boolean;
  technique: RoutineName | 'path' | 'sweep' | null;
  /** What offered the move: its routine, or 'path' (a sweep is a long plain drag some routine offered). */
  by: RoutineName | 'path' | null;
  ctx: Ctx;
  /** The board, a column a string top to bottom (parseBoard), and the move played or offered there. */
  cols: string[];
  drags: Drag[];
}

export const POSITIONS: Readonly<Record<string, Position>> = {
  'phase:block': {"seed":5000,"bot":"cc8","ms":78550,"stage":"junk","phase":"block","chain":0,"chosen":true,"technique":"sweep","by":"diamond","ctx":{"stage":"junk","burnFrom":5,"fill":5,"reach":14},"cols":["bbbwbwbb","wwwbwKwbw","ww*KwwKw","wwKwbwKww","wwbbwwww","wwwwwww**","wwwwwwwK","bbbbKbKKK","b*KKbKKK","bKbbbKKKK"],"drags":[{"x":0,"y":6,"ways":[0,0,0,0,0,0]}]},
  'phase:chain': {"seed":5000,"bot":"cc8","ms":231200,"stage":"chain","phase":"chain","chain":4,"chosen":true,"technique":"channel","by":"channel","ctx":{"stage":"chain","burnFrom":10,"fill":8,"reach":14},"cols":["KKwKwwKwK","*KKKbKKK","wbbKKbbbb","KbbbKbKK","wbbwbbKbK","xbwKbKKb","bbwwKwbKw","wbwwwwww","wwbwwwwww","w*wwwwww"],"drags":[{"x":0,"y":7,"ways":[0,3,0,0,0,3]}]},
  'technique:channel': {"seed":5000,"bot":"cc8","ms":218250,"stage":"chain","phase":"chain","chain":1,"chosen":true,"technique":"channel","by":"channel","ctx":{"stage":"chain","burnFrom":10,"fill":5,"reach":14},"cols":["wbbbwwKK","wbbbKwbbK","xbwKbbbb","bbbwKbKKb","wbwwKwKw","wwbwwwwww","w*wwwwww","wwww*wwww","www*wwww","wwwwwwwww"],"drags":[{"x":0,"y":4,"ways":[0,3,3,0]}]},
  'technique:crawl': {"seed":5001,"bot":"cc8","ms":22150,"stage":"junk","phase":"fill","chain":0,"chosen":true,"technique":"crawl","by":"crawl","ctx":{"stage":"junk","burnFrom":3,"fill":3,"reach":14},"cols":["bwwwwKww","wwwwwwwwK","bwwwwbww","wbwwKw*KK","bbKwKKbK","KKbKKK*KK","KbbKb*bb","bKKKbKKKb","bbbbKKKK","bbbbbbKbK"],"drags":[{"x":3,"y":4,"ways":[2,3]},{"x":2,"y":5,"ways":[1,0,0,0]}]},
  'technique:diamond': {"seed":5000,"bot":"cc8","ms":12500,"stage":"junk","phase":"fill","chain":0,"chosen":true,"technique":"diamond","by":"diamond","ctx":{"stage":"junk","burnFrom":5,"fill":5,"reach":14},"cols":["wKKbKKKKK","K*wwKbbw","KKKKwwbKw","wKwwwbbw","KKwwww*wK","bwwbwwwK","KKwbbKKww","bbKbKbKb","bKbKbbKKK","KKKKKKKK"],"drags":[{"x":4,"y":1,"ways":[3,3]}]},
  'technique:figureEight': {"seed":5003,"bot":"cc8","ms":55450,"stage":"junk","phase":"fill","chain":0,"chosen":true,"technique":"figureEight","by":"figureEight","ctx":{"stage":"junk","burnFrom":5,"fill":5,"reach":14},"cols":["bbwbKwww","wwwwwwwbb","wwwbwwKb","wwwwbwwKw","bKbwwwwK","wwwKbwKKw","bbKwwKKK","bbbKKKKKK","bbbbbbKb","KKKbKKKKK"],"drags":[{"x":1,"y":7,"ways":[1]}]},
  'technique:hook': {"seed":5000,"bot":"cc8","ms":215800,"stage":"chain","phase":"chain","chain":1,"chosen":true,"technique":"hook","by":"hook","ctx":{"stage":"chain","burnFrom":10,"fill":5,"reach":14},"cols":["wwbbwwbK","wbbbKwbbK","xbbKbbbw","bbbwKbKKb","wbwwKwKK","wwbwwwwww","w*wwwwww","wwww*wwww","www*wwww","wwwwwwwww"],"drags":[{"x":3,"y":8,"ways":[1]},{"x":4,"y":7,"ways":[2,1,1,1]}]},
  'technique:junkColumn': {"seed":5000,"bot":"cc8","ms":42700,"stage":"junk","phase":"fire","chain":0,"chosen":true,"technique":"junkColumn","by":"junkColumn","ctx":{"stage":"junk","burnFrom":6,"fill":6,"reach":14},"cols":["wKKwbwKKw","KKbbwKww","Kbbwwwb**","bbbwwwwK","wKwwwwKwK","K*wwKwwK","wwbwwwKww","wbbKbKKK","KbKKbb*KK","bKKbbKbK"],"drags":[{"x":4,"y":6,"ways":[3,3]}]},
  'technique:leapfrog': {"seed":5002,"bot":"cc8","ms":455850,"stage":"chain","phase":"chain","chain":4,"chosen":true,"technique":"leapfrog","by":"leapfrog","ctx":{"stage":"chain","burnFrom":10,"fill":8,"reach":14},"cols":["KKwbKKKKK","KbbKwwbK","KbbbbKbKb","bbKKbKKw","bKbbKKKbw","KKKbbKKb","KKbbwwwbx","wwbwwwwK","wwwwwww*b","wwwwwwww"],"drags":[{"x":3,"y":4,"ways":[2,1,2]}]},
  'technique:linePull': {"seed":5000,"bot":"cc8","ms":368450,"stage":"chain","phase":"chain","chain":0,"chosen":true,"technique":"linePull","by":"linePull","ctx":{"stage":"chain","burnFrom":10,"fill":7,"reach":14},"cols":["bwbwbKKKb","bKKbKKKK","bbwbKwbwK","bbwwwwwK","wbwwwwwwb","wwwwwwww","bwwwwwwww","bwwwwwww","wwwwwwwww","wwwwwwww"],"drags":[{"x":1,"y":1,"ways":[3,0,1,1,2,3,0,0,1,2]}]},
  'technique:path': {"seed":5002,"bot":"cc8","ms":106400,"stage":"junk","phase":"block","chain":0,"chosen":true,"technique":"path","by":"path","ctx":{"stage":"junk","burnFrom":7,"fill":7,"reach":14},"cols":["bwbwwwww","K*wwwwwww","bwwwwwwK","bwwwwwwKK","wwwwwww*","wwwbwwwwK","bwwwwwww","bbbbbbwKK","bbbKKwKK","bbbbbKKKK"],"drags":[{"x":8,"y":4,"ways":[1,2,2,3,0,3]}]},
  'technique:store': {"seed":5000,"bot":"cc8","ms":294100,"stage":"junk","phase":"fire","chain":0,"chosen":true,"technique":"store","by":"store","ctx":{"stage":"junk","burnFrom":6,"fill":6,"reach":14},"cols":["bwbKKbww","bKbwbKwKK","wKwwKwww","wwKwwbwwK","wKbwwbKw","KwxwwwKKK","*KwbwKwK","wbbwwKwwb","bbKbKKKK","bKbbbKKKK"],"drags":[{"x":1,"y":1,"ways":[1,0]}]},
  'technique:sweep': {"seed":5000,"bot":"cc8","ms":0,"stage":"junk","phase":"fire","chain":0,"chosen":true,"technique":"sweep","by":"diamond","ctx":{"stage":"junk","burnFrom":7,"fill":7,"reach":14},"cols":["wKKbKKKKK","b*wbKbbw","KKKwwbbKw","KKKKKbbb","KbKwbK*wK","KwwbwwwK","KwwbwwKwb","wbKbwKKw","wKwKbbwwK","KKKKKKKK"],"drags":[{"x":1,"y":3,"ways":[0,3,0,0,0,3,0]}]},
  'technique:turnOver': {"seed":5000,"bot":"cc8","ms":123850,"stage":"junk","phase":"block","chain":0,"chosen":false,"technique":"turnOver","by":"turnOver","ctx":{"stage":"junk","burnFrom":7,"fill":7,"reach":14},"cols":["w*bbKbwK","wbbb*wwKK","www*wwbK","wbbwwwwww","wwwwwwww","wwwwwwwww","bw*wwwww","wbwwwwKKb","bwbbwKKK","bbbbKKK**"],"drags":[{"x":9,"y":4,"ways":[1,0,1,0]}]},
  'trick:blocks': {"seed":5001,"bot":"cc8","ms":39550,"stage":"junk","phase":"block","chain":0,"chosen":true,"technique":"sweep","by":"diamond","ctx":{"stage":"junk","burnFrom":5,"fill":5,"reach":14},"cols":["KbbwKbwK","wwbwww*ww","wwwwwwwK","wwwwwwwww","wwwwwwwK","bwwwwwwwK","bKKKKbwK","bbbKbK*KK","bbKbKKbK","KKbKKK*KK"],"drags":[{"x":0,"y":4,"ways":[3,3,3,3,3]}]},
  'trick:burnEarly': {"seed":5003,"bot":"cc8","ms":23700,"stage":"junk","phase":"fill","chain":0,"chosen":true,"technique":null,"by":null,"ctx":{"stage":"junk","burnFrom":4,"fill":4,"reach":14},"cols":["wbwwbKbK","wwbwwwwww","KbbbwKwK","bwwwwwwbK","bwwKbwKK","KwKbwKwKw","*KbbKbKb","Kbbbb*bKK","bKbKbbKb","KKbKKbbKb"],"drags":[]},
  'trick:danger': {"seed":5001,"bot":"cc8","ms":83000,"stage":"junk","phase":"block","chain":0,"chosen":true,"technique":"rescue","by":"rescue","ctx":{"stage":"junk","burnFrom":7,"fill":7,"reach":14},"cols":["bKbwwwKw","wbbbwwKww","wbwwwKww","bwbwwwwKK","wwwwwwwK","wwwwww*ww","wwwwwKww","bwbKbwwwK","bwKKwwKK","bbbbKKKKK"],"drags":[{"x":7,"y":3,"ways":[2,2,3,0,3]}]},
  'trick:edge': {"seed":5001,"bot":"cc8","ms":109050,"stage":"junk","phase":"fire","chain":0,"chosen":true,"technique":"sweep","by":"rescue","ctx":{"stage":"junk","burnFrom":8,"fill":8,"reach":14},"cols":["bbbKbKbwK","KbbwKwbK","KbbbbwwKK","KbbwwwKK","wbbbwwwKb","wbwwwwww","bwwwwwwwK","wwwwwwww","wwwwwb*ww","wwwwwKww"],"drags":[{"x":4,"y":8,"ways":[0,3,0,0,0]}]},
  'trick:flick': {"seed":5000,"bot":"cc8","ms":275500,"stage":"junk","phase":"fire","chain":0,"chosen":true,"technique":"sweep","by":"rescue","ctx":{"stage":"junk","burnFrom":6,"fill":6,"reach":14},"cols":["wKKwKbww","wwKbwKKwK","KbbKbbKw","KKKKKwKKK","*bwKbKwK","wxwwwwwwb","wbwwwwKK","bKbwwwwwK","bbbKbKbb","bbbbbKbKK"],"drags":[{"x":2,"y":5,"ways":[0,3,0,0,0]}]},
  'trick:kept': {"seed":5000,"bot":"cc8","ms":77200,"stage":"junk","phase":"block","chain":0,"chosen":true,"technique":"rescue","by":"rescue","ctx":{"stage":"junk","burnFrom":6,"fill":6,"reach":14},"cols":["bbbwbwbb","wwwbwKwbw","ww*KwwKw","wwKwbwKww","wwbbwwww","wwwwwww**","wwwKwwwK","bbbbKbwKK","b*KKbKKK","bKbbbKKKK"],"drags":[{"x":6,"y":3,"ways":[2,2,3,3,3]}]},
};
