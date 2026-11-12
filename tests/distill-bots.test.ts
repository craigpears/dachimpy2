/* Distilling's bots (src/distill-bots.ts): they play by the techniques, at a person's pace, by the rules
   (12 Nov). What each tier reaches is tools/distill-bots.mjs's to measure (DISTILLING.md §4). */
import { describe, expect, it } from 'vitest';
import { COLS, DOWN_RIGHT, Distilling, SHORT, TALL, parseBoard } from '../src/distilling';
import { TIERS, bestDrag, bestPair, playSession, tierNamed } from '../src/distill-bots';
import type { Sense } from '../src/distill-bots';
import { seeded } from '../src/mirror-row';

const sea = (ch: string) => Array.from({ length: COLS }, (_, x) => ch.repeat(x % 2 === 0 ? TALL : SHORT));
function put(cols: string[], at: [number, number, string][]): string[] {
  const out = cols.map((c) => [...c]);
  for (const [x, y, ch] of at) out[x][y] = ch;
  return out.map((c) => c.join(''));
}

describe('the bots (12 Nov)', () => {
  it('are four tiers, none faster than 6 swaps a second (a swap slides 150 ms)', () => {
    expect(TIERS.map((t) => t.name)).toEqual(['learner', 'master', 'grandmaster', 'ultimate']);
    for (const t of TIERS) expect(t.rate).toBeLessThanOrEqual(6);
  });
  it('drag a black stored at the top left down-right across the whites into the junk columns', () => {
    // Whites everywhere but the junk columns on the right (columns 7 to 9), and a black top left.
    const cols = put(sea('w'), [[0, 0, 'K'], ...[7, 8, 9].flatMap((x) => Array.from({ length: x % 2 ? SHORT : TALL }, (_, y) => [x, y, y < 4 ? 'K' : 'b'] as [number, number, string]))]);
    const s: Sense = { stage: 'junk', burns: 0, junkFrom: 7, whiteFrom: 0, whiteTo: 7 };
    const d = bestDrag(parseBoard(cols), s, 12)!;
    expect([d.x, d.y]).toEqual([0, 0]);
    expect(d.ways.every((w) => w === DOWN_RIGHT)).toBe(true);
    // ... and the drag is one a hand can make on the board: every swap of it legal.
    const g = new Distilling(seeded(1)).lay(parseBoard(cols));
    expect(g.dragWays(d.x, d.y, d.ways).swaps).toBe(d.ways.length);
    expect(g.at(...g.dragWays(0, 0, []).at)).toBeDefined();
  });
  it('move a black and a brown together to get junk out of the whites, as the crawl does', () => {
    // Stage II: whites wanted on the right; a black and a brown stuck in them, neither able to go left alone.
    const cols = put(sea('w'), [[5, 2, 'K'], [6, 1, 'b']]);
    const s: Sense = { stage: 'chain', burns: 0, junkFrom: COLS, whiteFrom: 2, whiteTo: COLS };
    const b = parseBoard(cols);
    const p = bestPair(b, s)!;
    expect(p).not.toBeNull();
    const g = new Distilling(seeded(1)).lay(b);
    for (const [x, y, w] of p.steps) expect(g.swapToward(x, y, w)).not.toBeNull();
    // The pair is further left than it was.
    const junkX = g.cols.flatMap((c, x) => c.map((q) => (q === 1 || q === 2 ? x : -1))).filter((x) => x >= 0);
    expect(junkX.reduce((a, x) => a + x, 0)).toBeLessThan(5 + 6);
  });
  it('play a whole session by the rules at their own pace, and it ends', () => {
    for (const t of TIERS) {
      const g = new Distilling(seeded(5000));
      const r = playSession(g, t, 6);
      expect(r.swaps / (r.minutes * 60)).toBeLessThanOrEqual(t.rate);
      expect(g.finished || g.time >= 6 * 60000).toBe(true);
      expect(r.columnsUp + r.columnsBurned).toBe(g.columns.length);
    }
  });
  it('the learner never burns early: its columns go at the furnace\'s pace', () => {
    const g = new Distilling(seeded(5001)), at: number[] = [];
    playSession(g, tierNamed('learner'), 4, () => at.push(g.time));
    expect(at.length).toBeGreaterThan(10);
    // (seen at the end of the swap or wait it came in, half a second at the learner's pace)
    for (let i = 1; i < at.length; i++) expect(at[i] - at[i - 1]).toBeGreaterThanOrEqual(15300 - 500);
  });
  it('the better tiers burn early, and dismiss once their chain breaks', () => {
    const g = new Distilling(seeded(5002));
    const r = playSession(g, tierNamed('master'), 20);
    expect(g.columns.length).toBeGreaterThan(Math.floor(g.time / 15300));
    if (r.dismissed) expect(g.columns[g.columns.length - 1].chain).toBe(0);
  });
});
