/* Straightening up (16 Nov): the user watching CC^8 on seed 2 of distilling-test.html, its whites banked on the left with
   junk stuck in them, the bot still quick sorting. src/distill-read.ts's `straighten`, src/distill-patterns.ts's bank
   (`bankOf`, `bankJunk`), src/distill-bots.ts's moves for it. */
import { describe, expect, it } from 'vitest';
import { advise } from '../src/distill-bots';
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
