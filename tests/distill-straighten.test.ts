/* Straightening up (16 Nov): the user watching CC^8 on seed 2 of distilling-test.html, its whites banked on the left with
   junk stuck in them, the bot still quick sorting. src/distill-read.ts's `straighten`, src/distill-patterns.ts's bank
   (`bankOf`, `bankJunk`), src/distill-bots.ts's moves for it. */
import { describe, expect, it } from 'vitest';
import { advise, pulledDown } from '../src/distill-bots';
import { readBoard, strayDrags } from '../src/distill-read';
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
