/* Straightening up (16 Nov): the user watching CC^8 on seed 2 of distilling-test.html, its whites banked on the left with
   junk stuck in them, the bot still quick sorting. src/distill-read.ts's `straighten`, src/distill-patterns.ts's bank
   (`bankOf`, `bankJunk`), src/distill-bots.ts's moves for it. */
import { describe, expect, it } from 'vitest';
import { P, advise, chainContext, choose, contextFor, decisionTime, levelNamed, pulledDown } from '../src/distill-bots';
import { channelOrder } from '../src/distill-goals';
import { playDrags } from '../src/distill-routines';
import { readBoard, straightened as progressOf, strayDrags, trappedJunk } from '../src/distill-read';
import { S, trapped } from '../src/distill-score';
import { bankJunk, bankOf, solidColumns } from '../src/distill-patterns';
import { BROWN, Distilling } from '../src/distilling';

const B = (s: string) => s.split(' ').map((c) => [...c].map((ch) => 'wbK*x'.indexOf(ch)));
// (notes/distilling/51-whites-banked-junk-stuck-in-them.webp, the user's picture; the same moment in seed 2, CC^8, a
// minute in, the run recorded at fixed ticks: four columns of whites, a black stuck at the bottom of
// each, a brown in two; five junk columns on the right)
const SEED2 = 'bKwKb*bwK wwwwwwwK KwwwwwwK* wwwwbwwK bwwwwwwKb bbKbKbKK ww*bbKbbK bKKKbbKK bbKbb*K*K bK*bbbbb';

describe('"At a certain point it needs to switch modes ... we\'ve got a lot of white columns now, so we\'re switching from quick dragging to ... straightening up the board" (16 Nov)', () => {
  it('reads seed 2\'s board, its white columns banked, as straightening up, not quick sorting', () => {
    const cols = B(SEED2), bank = bankOf(cols);
    expect(bank).toEqual([1, 2, 3, 4]);
    expect(solidColumns(cols, bank)).toBeGreaterThanOrEqual(3);
    expect(readBoard(cols, { stage: 'junk', timeLeft: 12000 }).tactic).toBe('straighten');
    // (the mode it was in before: quick sorting)
    expect(readBoard(cols, { stage: 'junk', timeLeft: 12000, straighten: false }).tactic).toBe('quickSort');
  });

  it('"Step one, get it over. Step two, kind of resort and straighten the line": the junk out of the white columns first, never more put in', () => {
    const g = new Distilling(() => 0.5, { timer: false }).lay(B(SEED2)), bank = bankOf(g.cols), start = bankJunk(g.cols, bank);
    let before = start;
    for (let i = 0; i < 6; i++) {
      const a = advise({ cols: g.cols, timeLeft: 40000 }, { target: 8 });
      expect(a.kind).toBe('move');
      for (const d of a.drags) { g.dragWays(d.x, d.y, d.ways); g.settle(1000); }
      // ("this is going to lead to the board quality degrading over time")
      expect(bankJunk(g.cols, bank), `move ${i + 1}: ${a.reason}`).toBeLessThanOrEqual(before);
      before = bankJunk(g.cols, bank);
    }
    // (the browns along the bottom lift two of the stuck blacks out: "pull those browns down, push the blacks up")
    expect(start - before).toBeGreaterThanOrEqual(4);
  });
});

describe('"That\'s why the blacks are there at the top. They are there to essentially rescue the brown pieces" (16 Nov)', () => {
  it('a brown in the white columns is taken right in one drag, up through the whites and down through the blacks', () => {
    const cols = B('wwwwwwwww wwwwwwww wwwwwwwww wwwwwbww wwwwwwwww wwwwwwww KKKKbbbbb KKKKbbbb KKKKbbbbb KKKKbbbb');
    const drags = strayDrags(cols, [{ x: 3, y: 5 }], 6);
    expect(drags.length).toBeGreaterThan(0);
    const g = new Distilling(() => 0.5, { timer: false }).lay(cols.map((c) => [...c]));
    const d = drags[0][0];
    expect(g.dragWays(d.x, d.y, d.ways).swaps).toBe(d.ways.length);
    expect(g.cols[3].includes(BROWN)).toBe(false);
  });
});

// The user's own boards, copied piece by piece from their pictures (16 Nov), left to right, each column top to bottom.
const PIC1 = 'bwwww*wwK wwwwwwwK wwwwwwwK* wwbwwwwK bwwKKKwKb bbKbKbKK bK*bbbbKK bKKKbbbK bbKKK*b*K bK*Kbbbb';   // notes/distilling/51-...
const PIC3 = 'wwwwwwKww wwwwwwww wwwww*www wwwwwwKw KwKKKbwb* KKKKbbbb KbKKKbbbb KbKKbbbK KK*KbbKKK bbbbbKbK';
const PIC4 = 'wbwwwbbb wwwwwwbww wwwwwwww wwwww*www wwwwwwww KKKKKbbb* KKKKKbbb KbKKKbbbb KbKKbbbK KK*bKbKKK';
const PIC6 = 'bwwwKwbK* bwwwbwwK wwwwwwwKb bwwbwwwK wK*bbKbbK wwKKbbKK bbKbb*K*K bK*bbbbb b*bbKbKKK bKbKKKbK';   // notes/distilling/52-...

/** Moves played forward on a board with advise at a target, each move's board after it. */
function playOn(s: string, moves: number, o: { target?: number; chain?: number } = {}) {
  const g = new Distilling(() => 0.5, { timer: false }).lay(B(s)), out: { a: ReturnType<typeof advise>; cols: number[][] }[] = [];
  for (let i = 0; i < moves; i++) {
    const a = advise({ cols: g.cols, chain: o.chain ?? 0, timeLeft: 40000 }, { target: o.target ?? 8 });
    if (a.kind !== 'move') break;
    for (const d of a.drags) { g.dragWays(d.x, d.y, d.ways); g.settle(1000); }
    out.push({ a, cols: g.cols.map((c) => [...c]) });
  }
  return out;
}

describe('the user\'s pictures (16 Nov), copied exactly', () => {
  it('"Pull those browns down, push the blacks up ... to create nice clear white columns" (picture 1): straightening up, the white columns cleaner move by move, never dirtier', () => {
    const cols = B(PIC1), bank = bankOf(cols);
    expect(bank).toEqual([0, 1, 2, 3]);
    expect(readBoard(cols, { stage: 'junk', timeLeft: 12000 }).tactic).toBe('straighten');
    let before = bankJunk(cols, bank);
    const start = before;
    for (const { a, cols: after } of playOn(PIC1, 6)) { expect(bankJunk(after, bank), a.reason).toBeLessThanOrEqual(before); before = bankJunk(after, bank); }
    expect(before).toBeLessThan(start);
  });
  it('"You just go down, up, and kind of make that large sweeping motion" (picture 3): both blacks out of the white columns', () => {
    const cols = B(PIC3), bank = bankOf(cols);
    expect(bank).toEqual([0, 1, 2, 3]);
    expect(bankJunk(cols, bank)).toBe(4);
    const run = playOn(PIC3, 4);
    // (its first move the sweep itself: the black at column 1, row 7 down through the whites and up through the browns)
    expect(run[0].a.drags).toEqual([{ x: 0, y: 6, ways: [3, 3, 3, 0, 0, 0, 0, 0] }]);
    const last = run[run.length - 1].cols;
    expect(bank.some((x) => last[x].includes(2))).toBe(false);   // (no black left in the white columns)
    expect(bankJunk(last, bank)).toBeLessThanOrEqual(1);
  });
  // Not yet: the brown's way right crosses the clear columns and drops into column 6's blacks, leaving a black in column 5
  // to sort after ("rescue the brown pieces as far as you can go. And then you just drag the browns down through the
  // blacks. Reorganize the board"); the chain's planner, a move ahead, won't spoil a clear column for it. Two moves ahead.
  it.todo(`"Just worry about getting them to the right hand side as far as you can" (picture 4, in the chain, ${PIC4}): the brown out of the column going up, the black it leaves sorted after`);
  it('"Going backwards across the screen ... is good if it pulls down trapped pieces like that" (picture 6): the black taken back along the top, pulling the three browns down', () => {
    const [{ a }] = playOn(PIC6, 1);
    expect(a.drags).toEqual([{ x: 4, y: 1, ways: [1, 2, 1, 1] }]);
    expect(pulledDown(B(PIC6), a.drags)).toBeGreaterThanOrEqual(2);
  });
});

// (picture 5, after the bot had pulled its fifth junk column apart to start the chain: four finished junk columns on the
// right, column 6 emptied back to white: K*KKwwbKK wwbbwKwb wwwbwwwww wwwwwwww wwwww*www wwwwwwww KKKKKbbb* KKKKbbbb
// KbKKbbbbb KbKbbbbK)
describe(`"If you've got an easily completed junk column, you don't do that ever. You keep going until you are at risk of burning a column" (16 Nov, picture 5)`, () => {
  // The whites banked, a fifth junk column half built in column 6 with the junk left to finish it, four finished.
  const cols = B('KKKKwwwww wwwwwwww wwwwwwwww wwwwwwww wwwwwwwww wwwwKKKK KKKKKbbb* KKKKbbbb KbKKbbbbb KbKbbbbK');
  it(`with four finished junk columns waiting and junk to finish the fifth, it isn't time to start the chain`, () => {
    expect(decisionTime(cols, 4)).toBe(false);
    const was = P.KEEP_FILLING;
    try { P.KEEP_FILLING = false; expect(decisionTime(cols, 4)).toBe(true); } finally { P.KEEP_FILLING = was; }   // (the old rule: banked, so start)
  });
  it('"down to, like, even just say 1 or 2 junk columns": then it is', () => {
    // (the same, two of the finished junk columns gone to the furnace)
    const two = B('KKKKwwwww wwwwwwww wwwwwwwww wwwwwwww wwwwwwwww wwwwwwww wwwwwwwww wwwwKKKK KbKKbbbbb KbKbbbbK');
    expect(decisionTime(two, 4)).toBe(true);
  });
});

describe('the chain (17 Nov, seed 2 CC^8, the user\'s pictures copied)', () => {
  it('"Creating a channel of browns ... and ... getting blacks up to that top right": where it waited, it builds a channel to the column being filled', () => {
    const cols = B('bwbbbbKKK bKKbbKKK bbbwKKKbK bbwKKwKK KbwwwwKbK wwwwwwww wwwwwwwww wwwwwwww w*wwwwwww wwwwwwww');
    const ctx = contextFor(cols, 'chain', 0, 40), a = choose({ cols, chain: 3, timeLeft: 15000 }, ctx, levelNamed('cc8'));
    expect(a.kind).toBe('move');
    expect(channelOrder(playDrags(cols, a.drags)!, ctx.fill)).toBeGreaterThan(channelOrder(cols, ctx.fill));
  });
  it('"There\'s no way we\'re sending the crystal clear past 9. Let\'s start moving the junk into that column": a chain whose next column can\'t be filled is let go, its whites no more sent into it', () => {
    const cols = B('bwbKKKbbb wKbKbKbK KKKbK*bKK bbbbKbbK KbKKKKKKK KbwwKKwb bKKwKKbbb bKwwKKbK bKwwKKbbb wwwwwwww');
    const c = chainContext(cols, 8, 0, 8, 40);
    expect(c.letGo).toBe(true);
    expect(c.ctx.over).toEqual([6, 8]);
    const a = choose({ cols, chain: 8, timeLeft: 15000 }, c.ctx, levelNamed('cc8')), after = playDrags(cols, a.drags)!;
    expect(after[8].filter((p) => p === 0).length).toBeLessThanOrEqual(cols[8].filter((p) => p === 0).length);   // (no white into column 9)
  });
});

// (notes/distilling/55-two-blacks-move-as-one.webp, the user's picture copied: black number one at the bottom of column 3,
// number two at the bottom of column 2 beside it, both under whites, the brown that was their way out taken away)
const PIC55 = 'KwKbbKbw bKwKb*bwK wwwwwwwK wwwwwwww* wwwwwwwK bwwwwwbKb bbKbbbbb KK*KKKKKK KKKKKbbb Kbbbb*K*b';
describe(`"If I move number one up without number two, that's going to leave number two stranded ... they move as one continuous unit" (17 Nov, picture 55)`, () => {
  it('both blacks are seen trapped, number two walled in by number one, not joined to the colour through it', () => {
    const cols = B(PIC55);
    expect(trapped(cols, 2, 7)).toBe(true);   // (number one)
    expect(trapped(cols, 1, 8)).toBe(true);   // (number two)
    const was = S.TRAP_GROUP;
    try { S.TRAP_GROUP = 0; expect(trapped(cols, 1, 8)).toBe(false); } finally { S.TRAP_GROUP = was; }   // (the old reading)
  });
  it('straightening up frees them both, never one by leaving the other trapped', () => {
    const run = playOn(PIC55, 4), bank = bankOf(B(PIC55)), to = bank[bank.length - 1] + 1;
    // (the two, and a brown at the top of column 2; the junk left of the white columns got over first since 17 Nov's
    // seed 5008, "get it over", the pair freed within a few moves, the count never rising on the way)
    let was = trappedJunk(B(PIC55), to);
    expect(was).toBe(3);
    for (const { a, cols } of run) { const n = trappedJunk(cols, to); expect(n, a.reason).toBeLessThanOrEqual(was); was = n; }
    expect(was).toBe(0);
  });
});

// Seed 5008, CC^8, Stage I, the user's pictures (17 Nov) copied piece by piece. 56: the white columns banked with three
// browns stuck at their tops, a whole column of browns beside a whole column of blacks (notes/distilling/56-...); 57: the
// user's own board a few moves on, the blacks dragged up into the browns' places (notes/distilling/57-...); then a burn
// later, the junk still left of the white columns, the bot moving nothing; and the bot waiting, "nothing worth moving",
// three junk columns deep by the fire (those two pictures weren't saved).
const PIC56 = '*KKbKwwb KwbKKwbKb wwwwwwww bwwwwwwww bwwwwwww bwwwwwwww bbbbbbbb KKKKKbbbb KK*KKKKK bbbKKb*bb';
const PIC57 = '*KKbKwwb KwbKKwbKb wwwwwwww KKwwwwwww wwwwwwww wKwwwwwww KKbbbbbb KbbbKbbbb Kb*bKKKK bbbKKb*bb';
const LATER = 'wwwKbwbKb *KKbKwwb KKbKKwbKb wwwwwwww wwwwwwwww wwwwwbww wwwwwbwww KKKKKbbb Kbbbbbbbb Kb*KbKKK';
const IDLE = 'bKwbKwbb wKbwwwKKb bbwwKwKK bwwwwwwKK bwwwwwww wbwwbwwww wwwwwwbw KKKKwKwKK bbbbbKbb bbbbbbbbb';
describe('seed 5008 (17 Nov): "There\'s no such thing as nothing worth moving"', () => {
  it('"Just drag those blacks up ... it\'s markedly better": a black in a brown\'s place at the top of the white columns counts as cleaner', () => {
    const xs = [2, 3, 4, 5];
    expect(bankJunk(B(PIC57), xs)).toBeLessThan(bankJunk(B(PIC56), xs));
  });
  it('"Get it over. It\'s not moving anything": the junk left of the white columns is carried over, never a wait', () => {
    const run = playOn(LATER, 8), left = (c: number[][]) => c.slice(0, 3).flat().filter((p) => p === 1 || p === 2).length;
    expect(run.length).toBe(8);
    expect(left(run[run.length - 1].cols)).toBeLessThan(left(B(LATER)));
  });
  for (const [name, s] of [['the junk beside the white columns', PIC56], ['three junk columns deep by the fire', IDLE], ['a burn later', LATER]] as const) {
    it(`"You've got such a safe position here, you can just go for it" (${name}): it keeps moving till the column's ready to burn`, () => {
      const g = new Distilling(() => 0.5, { timer: false }).lay(B(s));
      for (let i = 0; i < 10; i++) {
        const a = advise({ cols: g.cols, chain: 0, timeLeft: 40000 }, { target: 8 });
        expect(a.reason, `move ${i + 1}`).not.toMatch(/nothing worth moving/);
        if (a.kind !== 'move') break;
        for (const d of a.drags) { g.dragWays(d.x, d.y, d.ways); g.settle(1000); }
      }
    });
  }
  it('"Those blacks up at the top were fine. Why did it have to drag them into a column?": sorting the junk columns is no progress of its own', () => {
    const r = readBoard(B(PIC56), { stage: 'junk', timeLeft: 40000 });
    // (the two junk columns side by side sorted blacks over browns, nothing else changed: straightening up gets nothing)
    const sorted = B(PIC56); sorted[6] = [2, 2, 1, 1, 1, 1, 1, 1]; sorted[7] = [2, 2, 2, 1, 1, 1, 1, 1, 1];
    expect(progressOf(r, B(PIC56), sorted)).toBe(0);
  });
});
