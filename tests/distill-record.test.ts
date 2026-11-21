/* Your own game recorded (18 Nov, the user: "it can record and log my moves while I'm playing it live, so you can
   compare ... you can get more of an insight into what I'm doing differently"): src/distill-record.ts. */
import { describe, expect, it } from 'vitest';
import { Recorder, boardOf, boardText, compare, describe as said } from '../src/distill-record';
import { DOWN_RIGHT, Distilling } from '../src/distilling';
import { seeded } from '../src/mirror-row';

const BOARD = 'wbK*x';
const B = (s: string) => s.split(' ').map((c) => [...c].map((ch) => BOARD.indexOf(ch)));
// (seed 5002, CC^8, 78 s in: tests/distill-straighten.test.ts's gap)
const GAP = 'KwwbKbb* KbwbwKKwK wwwwwwwK wwwwwwwww wwwwwwww wbwwwwwww bbKKKbKK bbwwbbbwK bbbbKbbK KbbbbKKKb';

describe('"Record and log my moves while I\'m playing it live, so you can compare" (18 Nov)', () => {
  it('a held piece\'s swaps are one move, written down with the board before it and the furnace\'s time', () => {
    const g = new Distilling(seeded(5)), rec = new Recorder(g, 5);
    g.tick(1500);
    const before = boardText(g.cols), left = g.timeLeft();
    // (the first piece that can go down-right twice, dragged)
    let at: [number, number] | null = null;
    for (let x = 0; x < 8 && !at; x++) for (let y = 0; y < g.cols[x].length && !at; y++) {
      const t = new Distilling(() => 0.5, { timer: false }).lay(g.cols.map((c) => [...c]));
      if (t.dragWays(x, y, [DOWN_RIGHT, DOWN_RIGHT]).swaps === 2) at = [x, y];
    }
    expect(at).not.toBeNull();
    rec.press();
    g.dragWays(at![0], at![1], [DOWN_RIGHT, DOWN_RIGHT]);
    rec.release();
    expect(rec.rec.moves).toHaveLength(1);
    const m = rec.rec.moves[0];
    expect([m.x, m.y, m.ways]).toEqual([at![0], at![1], [DOWN_RIGHT, DOWN_RIGHT]]);
    expect(m.cols).toEqual(before);
    expect(m.t).toBe(1500);
    expect(m.timeLeft).toBe(Math.round(left));
  });
  it('swaps outside a drag (a click, a key) are a move each; a burn by hand and the columns gone are written down too', () => {
    const g = new Distilling(() => 0.5, { timer: false }).lay(B(GAP)), rec = new Recorder(g, 0);
    // (two swaps by clicks, a move each)
    const [a] = g.allSwaps();
    expect(g.swap(...a)).toBe(true);
    g.tick(1000);
    const [b] = g.allSwaps();
    expect(g.swap(...b)).toBe(true);
    expect(rec.rec.moves).toHaveLength(2);
    expect(rec.rec.moves.every((m) => m.ways.length === 1)).toBe(true);
    g.tick(1000);
    for (const e of g.burnNow()) if (e.kind === 'column') rec.column(e.column);
    expect(rec.rec.burns).toHaveLength(1);
    expect(rec.rec.columns).toHaveLength(1);
    rec.finish();
    expect(rec.rec.end?.swaps).toBe(g.swaps);
    // (plain JSON, read back the same)
    expect(JSON.parse(JSON.stringify(rec.rec))).toEqual(rec.rec);
  });
  it('each of your moves set beside the bot\'s on the same board', () => {
    const g = new Distilling(() => 0.5).lay(B(GAP)), rec = new Recorder(g, 5002);
    g.tick(500);
    const [x, y, x2, y2] = g.allSwaps()[0];
    rec.press(); g.swap(x, y, x2, y2); rec.release();
    const [c] = compare(rec.rec, 8), m = rec.rec.moves[0];
    expect(c.yours).toBe(said(boardOf(c.cols), m.x, m.y, m.ways));
    expect(c.yours).toMatch(/^the (white|brown|black) at column \d+, row \d+, 1 swap to column/);
    expect(c.bot).toMatch(/^the (white|brown|black)/);
    expect(['move', 'piece', 'no']).toContain(c.same);
  });
});
