/* Distilling's techniques as routines (src/distill-routines.ts, 12 Nov): each on a small hand-made board,
   doing what it says, by the rules, as whole drags. Boards are written a column a string, top to bottom
   (w b K), on a sea of whites. */
import { describe, expect, it } from 'vitest';
import { BLACK, BROWN, COLS, DOWN_LEFT, DOWN_RIGHT, SHORT, TALL, UP_LEFT, UP_RIGHT, WHITE, canSwapOn, neighbourOn, parseBoard } from '../src/distilling';
import { ROUTINES, burnsClean, canGo, halfOf, playDrags, stepsOf, swapsIn } from '../src/distill-routines';
import type { Board } from '../src/distilling';
import type { Ctx, Move, RoutineName } from '../src/distill-routines';

const sea = (ch: string) => Array.from({ length: COLS }, (_, x) => ch.repeat(x % 2 === 0 ? TALL : SHORT));
function board(at: [number, number, string][], cols = sea('w')): Board {
  const out = cols.map((c) => [...c]);
  for (const [x, y, ch] of at) out[x][y] = ch;
  return parseBoard(out.map((c) => c.join('')));
}
const column = (x: number, s: string): [number, number, string][] => [...s].map((ch, y) => [x, y, ch]);
const stageI = (burnFrom: number): Ctx => ({ stage: 'junk', burnFrom, fill: burnFrom, reach: 16 });
const stageII = (fill: number, burnFrom = COLS): Ctx => ({ stage: 'chain', burnFrom, fill, reach: 16 });
const find = (name: RoutineName, cols: Board, ctx: Ctx) => ROUTINES[name].find(cols, ctx);
const whitesIn = (cols: Board, x: number) => cols[x].filter((p) => p === WHITE).length;
const where = (cols: Board, piece: number) => cols.flatMap((c, x) => c.flatMap((p, y) => (p === piece ? [[x, y] as [number, number]] : [])));

/** A move as a hand makes it: every swap legal, and its drags whole (no drag goes on where the last one
    stopped, which would be one drag split in two). */
function wholeDrags(cols: Board, m: Move): Board {
  let end: [number, number] | null = null;
  for (const d of m.drags) {
    expect(d.ways.length).toBeGreaterThan(0);
    if (end) expect([d.x, d.y]).not.toEqual(end);
    let at: [number, number] = [d.x, d.y];
    for (const w of d.ways) at = neighbourOn(cols, at[0], at[1], w)!;
    end = at;
  }
  expect(stepsOf(cols, m.drags).length).toBe(swapsIn(m.drags));
  const after = playDrags(cols, m.drags);
  expect(after).not.toBeNull();
  return after!;
}

describe('the routines (12 Nov)', () => {
  it('save the whites: a white in the furnace\'s column is dragged out left, up through a black (the bot "just went down and burnt" a white)', () => {
    const cols = board([...column(9, 'KKKwKKKK'), [8, 3, 'K']]);
    const moves = find('rescue', cols, stageI(9));
    expect(moves.length).toBeGreaterThan(0);
    expect(moves[0].drags[0].ways[0]).toBe(UP_LEFT);
    expect(whitesIn(wholeDrags(cols, moves[0]), 9)).toBe(0);
  });
  it('save the whites: a white stuck in the furnace\'s column has a black swept down onto it from the top left', () => {
    // Whites all round it on the left, so it can't go alone; a black far up its diagonal can.
    const cols = board([...column(9, 'KKKKKKwK'), [3, 3, 'K']]);
    expect(canGo(cols, 9, 6, -1)).toBe(false);
    const moves = find('rescue', cols, stageI(9));
    expect(moves.length).toBeGreaterThan(0);
    const after = wholeDrags(cols, moves[0]);
    expect(whitesIn(after, 9)).toBe(0);
    expect(moves[0].drags[0]).toMatchObject({ x: 3, y: 3 });
    expect(moves[0].drags[0].ways.every((w) => w === DOWN_RIGHT)).toBe(true);
  });
  it('finish the junk column: an all-brown column by the furnace gets a black on top, so it burns and never floats up', () => {
    const cols = board([...column(9, 'bbbbbbbb'), [8, 4, 'K']]);
    expect(burnsClean(cols[9])).toBe(false);
    const moves = find('junkColumn', cols, stageI(9));
    expect(moves.length).toBeGreaterThan(0);
    expect(burnsClean(wholeDrags(cols, moves[0])[9])).toBe(true);
  });
  it('the diamond: a black from the top left goes down-right across the whites, then up through the browns to the blacks, in one drag', () => {
    const cols = board([...column(8, 'KKKKbbbbb'), ...column(9, 'KKKKbbbb'), [0, 1, 'K']]);
    const moves = find('diamond', cols, stageI(8));
    expect(moves).toHaveLength(1);
    const m = moves[0];
    expect(m.drags).toHaveLength(1);
    expect(m.drags[0]).toEqual({ x: 0, y: 1, ways: [...Array(7).fill(DOWN_RIGHT), UP_RIGHT] });
    const after = wholeDrags(cols, m);
    expect(after[8][4]).toBe(BLACK);
    expect(after[8].slice(0, 5).every((p) => p === BLACK)).toBe(true);
  });
  it('the diamond, mirrored in the chain: junk in the column going up next goes left out of the whites', () => {
    const cols = board([...column(0, 'KKKKbbbbb'), ...column(1, 'KKKKbbbb'), [8, 1, 'K']]);
    const moves = find('diamond', cols, stageII(8));
    expect(moves.length).toBeGreaterThan(0);
    const after = wholeDrags(cols, moves[0]);
    expect(after[8].every((p) => p === WHITE)).toBe(true);
  });
  it('store the junk: a black on the bottom left is lifted up through the browns above it, ready to cross', () => {
    const cols = board([[0, 8, 'K'], [1, 7, 'b'], [2, 7, 'b'], ...column(9, 'KKKKbbbb')]);
    const m = find('store', cols, stageI(9)).find((x) => x.drags[0].x === 0 && x.drags[0].y === 8)!;
    expect(m).toBeDefined();
    const after = wholeDrags(cols, m);
    const [[bx, by]] = where(after, BLACK).filter(([x]) => x < 9);
    expect(halfOf(after, bx, by)).toBeLessThanOrEqual(14);
  });
  it('the crawl rescues whites stuck at the top: a lone brown at the top among whites does nothing, with a black beside it the pair crawls along (the user, 12 Nov)', () => {
    // A white stuck at the top of the furnace's column (whites to its left), and a brown up at the top.
    const lone = board([...column(9, 'wbbbbbbb'), [6, 0, 'b']]);
    expect(canGo(lone, 9, 0, -1)).toBe(false);
    expect(canGo(lone, 6, 0, 1) || canGo(lone, 6, 0, -1)).toBe(false);
    expect(find('crawl', lone, stageI(9))).toHaveLength(0);
    // A black beside it: they work together.
    const cols = board([...column(9, 'wbbbbbbb'), [6, 0, 'b'], [5, 0, 'K']]);
    const moves = find('crawl', cols, stageI(9));
    expect(moves.length).toBeGreaterThan(0);
    const m = moves[0];
    const after = wholeDrags(cols, m);
    expect(whitesIn(after, 9)).toBe(0);
    // Both moved: the black and the brown, each its own drag in turn.
    const starts = new Set(m.drags.map((d) => cols[d.x]?.[d.y]));
    expect(m.drags.length).toBeGreaterThan(1);
    expect(m.reason).toMatch(/top/);
    expect([...starts].length).toBeGreaterThan(0);
  });
  it('the figure of eight: a black stuck low is looped up a tile or more with a brown beside it', () => {
    const cols = board([[4, 8, 'K'], [3, 7, 'b'], ...column(9, 'KKKKbbbb')]);
    const moves = find('figureEight', cols, stageI(8));
    expect(moves.length).toBeGreaterThan(0);
    const after = wholeDrags(cols, moves[0]);
    const [[bx, by]] = where(after, BLACK).filter(([x]) => x < 9);
    expect(halfOf(after, bx, by)).toBeLessThanOrEqual(12);
    expect(Math.abs(bx - 4)).toBeLessThanOrEqual(1);
  });
  it('pull a line up: a black at the front of a line of browns, the line pulled up a tile', () => {
    const cols = board([[4, 7, 'K'], [3, 6, 'b'], [2, 6, 'b'], ...column(9, 'KKKKbbbb')]);
    const height = (b: Board) => [...where(b, BLACK), ...where(b, BROWN)].filter(([x]) => x < 9).reduce((s, [x, y]) => s + halfOf(b, x, y), 0);
    const moves = find('linePull', cols, stageI(8));
    expect(moves.length).toBeGreaterThan(0);
    const after = wholeDrags(cols, moves[0]);
    expect(height(after)).toBeLessThanOrEqual(height(cols) - 6);
  });
  it('the leapfrog: a black swept sideways along browns stored at the top, in one drag', () => {
    const cols = board([[1, 0, 'K'], [2, 0, 'b'], [4, 0, 'b'], [6, 0, 'b'], ...column(9, 'KKKKbbbb')]);
    const moves = find('leapfrog', cols, stageI(9)).filter((m) => m.drags[0].x === 1);
    expect(moves).toHaveLength(1);
    expect(moves[0].drags).toEqual([{ x: 1, y: 0, ways: [UP_RIGHT, DOWN_RIGHT, UP_RIGHT, DOWN_RIGHT, UP_RIGHT, DOWN_RIGHT] }]);
    const after = wholeDrags(cols, moves[0]);
    expect(after[7][0]).toBe(BLACK);
    // Each brown let it past and stepped one back, still at the top.
    for (const x of [1, 3, 5]) expect(after[x][0]).toBe(BROWN);
  });
  it('the hook: a black dragged down through the whites hooks up past a brown, and the brown is dragged on', () => {
    const cols = board([[6, 0, 'K'], [2, 2, 'K'], [2, 1, 'b']]);
    const m = find('hook', cols, stageII(9)).find((x) => x.drags[0].x === 6 && x.drags[0].y === 0)!;
    expect(m).toBeDefined();
    expect(m.drags).toHaveLength(2);
    expect(m.drags[0].ways).toEqual([DOWN_LEFT, DOWN_LEFT, DOWN_LEFT, UP_LEFT]);
    expect(m.drags[1]).toMatchObject({ x: 3, y: 1 });
    const after = wholeDrags(cols, m);
    const [[bx]] = where(after, BROWN);
    expect(bx).toBeLessThanOrEqual(1);
  });
  it('channels: in the chain a white on the left is ferried right through the junk, down through the browns', () => {
    const cols = board([...column(0, 'bbbbbbbbb'), ...column(1, 'bbbbbbbb'), ...column(2, 'bbbbbbbbb'), ...column(3, 'bbbbbbbb'), ...column(4, 'bbbbbbbbb'), [0, 1, 'w']]);
    const m = find('channel', cols, stageII(9)).find((x) => x.drags[0].x === 0)!;
    expect(m).toBeDefined();
    expect(m.drags[0].ways).toEqual([DOWN_RIGHT, DOWN_RIGHT, DOWN_RIGHT, DOWN_RIGHT]);
    const after = wholeDrags(cols, m);
    expect(after[4][3]).toBe(WHITE);
  });
  it('a routine\'s moves come out as whole drags, not single swaps: a piece is swept along its path (the user, 12 Nov: "one smooth motion")', () => {
    const cols = board([[1, 0, 'K'], [2, 0, 'b'], [4, 0, 'b'], [6, 0, 'b'], ...column(9, 'KKKKbbbb')]);
    let long = 0;
    for (const r of Object.values(ROUTINES)) for (const m of r.find(cols, stageI(8))) {
      wholeDrags(cols, m);
      long = Math.max(long, ...m.drags.map((d) => d.ways.length));
    }
    expect(long).toBeGreaterThanOrEqual(6);
    // ... and every swap of a drag is one the rules let the held piece make from where it is.
    const m = find('leapfrog', cols, stageI(9))[0], b = cols.map((c) => [...c]);
    let [x, y] = [m.drags[0].x, m.drags[0].y];
    for (const w of m.drags[0].ways) {
      const n = neighbourOn(b, x, y, w)!;
      expect(canSwapOn(b, x, y, n[0], n[1])).toBe(true);
      const t = b[x][y]; b[x][y] = b[n[0]][n[1]]; b[n[0]][n[1]] = t;
      [x, y] = n;
    }
  });
});
